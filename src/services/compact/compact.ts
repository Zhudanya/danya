/**
 * Conversation Compaction Service
 * Ported from Codex's services/compact/, adapted for Danya.
 *
 * Automatically compresses conversation history when approaching context limits.
 * Uses the 'compact' model pointer for summarization.
 *
 * Features:
 * - Auto-trigger when token count > threshold% of context window
 * - Semantic grouping: keeps tool use summaries, compresses verbose output
 * - Preserves critical context (recent tool results, user instructions)
 * - Token budget management per model
 */

export type CompactionConfig = {
  /** Trigger compaction when usage exceeds this percentage of context window (default: 90) */
  triggerThresholdPercent: number
  /** Target usage after compaction as percentage of context window (default: 60) */
  targetPercent: number
  /** Maximum number of recent messages to preserve uncompacted */
  preserveRecentMessages: number
  /** Whether auto-compaction is enabled */
  enabled: boolean
}

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  triggerThresholdPercent: 90,
  targetPercent: 60,
  preserveRecentMessages: 4,
  enabled: true,
}

export type CompactableMessage = {
  type: 'user' | 'assistant' | 'tool_result' | 'system'
  content: string
  /** Estimated token count */
  tokens: number
  /** Whether this message should be preserved (not compacted) */
  preserve?: boolean
  /** Original message reference */
  original?: unknown
}

export type CompactionResult = {
  /** Whether compaction was performed */
  compacted: boolean
  /** Summary of compacted messages */
  summary?: string
  /** Number of messages before compaction */
  messagesBefore: number
  /** Number of messages after compaction */
  messagesAfter: number
  /** Token count before compaction */
  tokensBefore: number
  /** Token count after compaction */
  tokensAfter: number
}

// ============================================================================
// Message Grouping
// ============================================================================

export type MessageGroup = {
  /** Group type for compaction strategy */
  type: 'tool_use' | 'conversation' | 'system' | 'preserved'
  /** Messages in this group */
  messages: CompactableMessage[]
  /** Total tokens in group */
  totalTokens: number
}

/**
 * Group messages semantically for compaction.
 * Tool use sequences (request + result) are grouped together.
 * Recent messages are marked as preserved.
 */
export function groupMessages(
  messages: CompactableMessage[],
  preserveCount: number,
): MessageGroup[] {
  const groups: MessageGroup[] = []
  const preserveStartIdx = Math.max(0, messages.length - preserveCount)

  let currentGroup: MessageGroup | null = null

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!
    const isPreserved = i >= preserveStartIdx

    if (isPreserved) {
      // Flush current group
      if (currentGroup) {
        groups.push(currentGroup)
        currentGroup = null
      }
      groups.push({
        type: 'preserved',
        messages: [msg],
        totalTokens: msg.tokens,
      })
      continue
    }

    if (msg.type === 'tool_result') {
      // Tool results group with their preceding assistant message
      if (currentGroup?.type === 'tool_use') {
        currentGroup.messages.push(msg)
        currentGroup.totalTokens += msg.tokens
      } else {
        if (currentGroup) groups.push(currentGroup)
        currentGroup = {
          type: 'tool_use',
          messages: [msg],
          totalTokens: msg.tokens,
        }
      }
    } else if (msg.type === 'system') {
      if (currentGroup) groups.push(currentGroup)
      groups.push({
        type: 'system',
        messages: [msg],
        totalTokens: msg.tokens,
      })
      currentGroup = null
    } else {
      // User or assistant messages
      if (currentGroup?.type === 'conversation') {
        currentGroup.messages.push(msg)
        currentGroup.totalTokens += msg.tokens
      } else {
        if (currentGroup) groups.push(currentGroup)
        currentGroup = {
          type: msg.type === 'assistant' ? 'tool_use' : 'conversation',
          messages: [msg],
          totalTokens: msg.tokens,
        }
      }
    }
  }

  if (currentGroup) groups.push(currentGroup)
  return groups
}

// ============================================================================
// Compaction Prompt
// ============================================================================

export const COMPACTION_SYSTEM_PROMPT = `You are a conversation summarizer. Summarize the following conversation history concisely, preserving:
1. Key decisions and their reasoning
2. Important code changes and file paths
3. Error messages and their resolutions
4. Current task state and progress

Be extremely concise. Use bullet points. Do not include pleasantries or meta-commentary.
Output only the summary, nothing else.`

// ============================================================================
// Auto-Compaction Trigger
// ============================================================================

/**
 * Check if compaction should be triggered based on current token usage.
 */
export function shouldTriggerCompaction(
  currentTokens: number,
  contextWindowSize: number,
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG,
): boolean {
  if (!config.enabled) return false
  const usagePercent = (currentTokens / contextWindowSize) * 100
  return usagePercent >= config.triggerThresholdPercent
}

/**
 * Calculate how many tokens need to be freed to reach the target.
 */
export function calculateCompactionTarget(
  currentTokens: number,
  contextWindowSize: number,
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG,
): number {
  const targetTokens = Math.floor(contextWindowSize * (config.targetPercent / 100))
  return Math.max(0, currentTokens - targetTokens)
}

/**
 * Select which message groups to compact based on token budget.
 * Compacts oldest non-preserved groups first.
 */
export function selectGroupsForCompaction(
  groups: MessageGroup[],
  tokensToFree: number,
): { toCompact: MessageGroup[]; toKeep: MessageGroup[] } {
  const toCompact: MessageGroup[] = []
  const toKeep: MessageGroup[] = []
  let freed = 0

  for (const group of groups) {
    if (group.type === 'preserved') {
      toKeep.push(group)
      continue
    }

    if (freed < tokensToFree) {
      toCompact.push(group)
      freed += group.totalTokens
    } else {
      toKeep.push(group)
    }
  }

  return { toCompact, toKeep }
}

/**
 * Build the compaction prompt from message groups.
 */
export function buildCompactionPrompt(groups: MessageGroup[]): string {
  const lines: string[] = []

  for (const group of groups) {
    for (const msg of group.messages) {
      const prefix = msg.type === 'user' ? 'User' : msg.type === 'assistant' ? 'Assistant' : 'System'
      // Truncate very long messages for the compaction prompt
      const content = msg.content.length > 2000
        ? msg.content.slice(0, 2000) + '... (truncated)'
        : msg.content
      lines.push(`[${prefix}]: ${content}`)
    }
  }

  return lines.join('\n\n')
}
