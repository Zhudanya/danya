/**
 * Unified Compression Engine
 *
 * Merges the best of Kode and Codex compression strategies:
 * - Codex: selective compression + semantic grouping (preserve recent, compress oldest)
 * - Kode: 8-section structured prompt + file recovery + model fallback + full state cleanup
 *
 * Flow:
 *   1. Trigger check (>= 90% context used, >= 3 messages)
 *   2. Semantic grouping (tool-use pairs, conversation clusters, preserved recent)
 *   3. Select oldest groups to compress (target: free enough to reach 60%)
 *   4. Summarize selected groups with 8-section structured prompt
 *   5. Recover important files
 *   6. Result: [notice, summary, ...kept_messages, ...recovered_files]
 */

import { Message } from '@query'
import { countTokens } from '@utils/model/tokens'
import { getMessagesGetter, getMessagesSetter } from '@messages'
import { getContext } from '@context'
import { getCodeStyle } from '@utils/config/style'
import { resetFileFreshnessSession } from '@services/fileFreshness'
import { createUserMessage, normalizeMessagesForAPI } from '@utils/messages'
import { queryLLM } from '@services/llmLazy'
import { selectAndReadFiles } from './fileRecoveryCore'
import { addLineNumbers } from '@utils/fs/file'
import { getModelManager } from '@utils/model'
import { debug as debugLogger } from '@utils/log/debugLogger'
import { logError } from '@utils/log'
import { calculateAutoCompactThresholds } from './autoCompactThreshold'
import {
  groupMessages,
  selectGroupsForCompaction,
  buildCompactionPrompt,
  calculateCompactionTarget,
  DEFAULT_COMPACTION_CONFIG,
  type CompactableMessage,
} from '../../services/compact/compact'

// ── 8-Section Structured Compression Prompt (from Kode) ──

const COMPRESSION_PROMPT = `Please provide a comprehensive summary of the following conversation history, structured as follows:

## Technical Context
Development environment, tools, frameworks, and configurations in use. Programming languages, libraries, and technical constraints. File structure, directory organization, and project architecture.

## Project Overview
Main project goals, features, and scope. Key components, modules, and their relationships. Data models, APIs, and integration patterns.

## Code Changes
Files created, modified, or analyzed during the conversation. Specific code implementations, functions, and algorithms added. Configuration changes and structural modifications.

## Debugging & Issues
Problems encountered and their root causes. Solutions implemented and their effectiveness. Error messages, logs, and diagnostic information.

## Current Status
What was most recently completed. Current state of the codebase and any ongoing work. Test results, validation steps, and verification performed.

## Pending Tasks
Immediate next steps and priorities. Planned features, improvements, and refactoring. Known issues, technical debt, and areas needing attention.

## User Preferences
Coding style, formatting, and organizational preferences. Communication patterns and feedback style. Tool choices and workflow preferences.

## Key Decisions
Important technical decisions made and their rationale. Alternative approaches considered and why they were rejected. Trade-offs accepted and their implications.

Focus on information essential for continuing the conversation effectively, including specific details about code, files, errors, and plans.`

// ── Context Limit Resolution ──

async function getMainConversationContextLimit(): Promise<number> {
  try {
    const modelManager = getModelManager()
    const resolution = modelManager.resolveModelWithInfo('main')
    const modelProfile = resolution.success ? resolution.profile : null
    if (modelProfile?.contextLength) return modelProfile.contextLength
    return 200_000
  } catch {
    return 200_000
  }
}

// ── Trigger Check ──

async function shouldAutoCompact(messages: Message[]): Promise<boolean> {
  if (messages.length < 3) return false
  const tokenCount = countTokens(messages)
  const contextLimit = await getMainConversationContextLimit()
  const { isAboveAutoCompactThreshold } = calculateAutoCompactThresholds(tokenCount, contextLimit)
  return isAboveAutoCompactThreshold
}

// ── Public Entry Point ──

export async function checkAutoCompact(
  messages: Message[],
  toolUseContext: any,
): Promise<{ messages: Message[]; wasCompacted: boolean }> {
  if (!(await shouldAutoCompact(messages))) {
    return { messages, wasCompacted: false }
  }

  try {
    const compactedMessages = await executeAutoCompact(messages, toolUseContext)
    return { messages: compactedMessages, wasCompacted: true }
  } catch (error) {
    logError(error)
    debugLogger.warn('AUTO_COMPACT_FAILED', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { messages, wasCompacted: false }
  }
}

// ── Core Compression Logic (merged Kode + Codex) ──

async function executeAutoCompact(
  messages: Message[],
  toolUseContext: any,
): Promise<Message[]> {
  const tokenCount = countTokens(messages)
  const contextLimit = await getMainConversationContextLimit()

  // Step 1: Convert messages to CompactableMessage format for grouping
  const compactableMessages = messagesToCompactable(messages)

  // Step 2: Semantic grouping — preserve recent N messages, group older ones
  const groups = groupMessages(compactableMessages, DEFAULT_COMPACTION_CONFIG.preserveRecentMessages)

  // Step 3: Calculate how many tokens to free (target: 60% of context)
  const tokensToFree = calculateCompactionTarget(tokenCount, contextLimit)

  // Step 4: Select oldest groups to compress
  const { toCompact, toKeep } = selectGroupsForCompaction(groups, tokensToFree)

  // If nothing to compact (all messages are recent/preserved), fall back to full compression
  if (toCompact.length === 0) {
    return executeFullCompact(messages, toolUseContext, tokenCount)
  }

  // Step 5: Build compaction prompt from selected groups
  const conversationToSummarize = buildCompactionPrompt(toCompact)

  // Step 6: Resolve compression model (compact → main fallback)
  const { modelPointer, notice } = resolveCompressionModel(tokenCount)

  // Step 7: Call LLM with 8-section structured prompt
  const summaryPrompt = `${COMPRESSION_PROMPT}\n\n---\n\nConversation to summarize:\n\n${conversationToSummarize}`
  const summaryRequest = createUserMessage(summaryPrompt)

  const summaryResponse = await queryLLM(
    normalizeMessagesForAPI([summaryRequest]),
    [
      'You are a helpful AI assistant tasked with creating comprehensive conversation summaries that preserve all essential context for continuing development work.',
    ],
    0,
    [],
    toolUseContext.abortController.signal,
    {
      safeMode: false,
      model: modelPointer,
      prependCLISysprompt: true,
    },
  )

  // Finalize: validate summary, recover files, build result, clear caches
  const noticeText = notice
    ? `Context selectively compressed (${toCompact.length} groups summarized, ${toKeep.length} preserved). ${notice}`
    : `Context selectively compressed (${toCompact.length} groups summarized, ${toKeep.length} preserved).`

  const result = await finalizeSummary(summaryResponse, noticeText)

  // Add preserved (recent) messages back as-is
  for (const group of toKeep) {
    for (const msg of group.messages) {
      if (msg.original) {
        result.push(msg.original as Message)
      }
    }
  }

  return result
}

/**
 * Fallback: full compression when selective compression can't free enough.
 * This is the original Kode behavior — compress everything.
 */
async function executeFullCompact(
  messages: Message[],
  toolUseContext: any,
  tokenCount: number,
): Promise<Message[]> {
  const { modelPointer, notice } = resolveCompressionModel(tokenCount)

  const summaryRequest = createUserMessage(COMPRESSION_PROMPT)
  const summaryResponse = await queryLLM(
    normalizeMessagesForAPI([...messages, summaryRequest]),
    [
      'You are a helpful AI assistant tasked with creating comprehensive conversation summaries that preserve all essential context for continuing development work.',
    ],
    0,
    [],
    toolUseContext.abortController.signal,
    {
      safeMode: false,
      model: modelPointer,
      prependCLISysprompt: true,
    },
  )

  const noticeText = notice
    ? `Context fully compressed due to token limit. ${notice}`
    : `Context fully compressed due to token limit.`

  return finalizeSummary(summaryResponse, noticeText)
}

// ── Shared Finalization ──

/**
 * Shared tail for both selective and full compression:
 * validate summary → zero usage → recover files → build result → clear caches.
 */
async function finalizeSummary(
  summaryResponse: any,
  noticeText: string,
): Promise<Message[]> {
  const summary = extractSummaryText(summaryResponse)
  if (!summary) {
    throw new Error('Failed to generate conversation summary')
  }

  summaryResponse.message.usage = {
    input_tokens: 0,
    output_tokens: summaryResponse.message.usage.output_tokens,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  }

  const recoveredFiles = await selectAndReadFiles()

  const result: Message[] = [
    createUserMessage(noticeText),
    summaryResponse,
  ]

  for (const file of recoveredFiles) {
    const contentWithLines = addLineNumbers({ content: file.content, startLine: 1 })
    result.push(
      createUserMessage(
        `**Recovered File: ${file.path}**\n\n\`\`\`\n${contentWithLines}\n\`\`\`\n\n` +
          `*Automatically recovered (${file.tokens} tokens)${file.truncated ? ' [truncated]' : ''}*`,
      ),
    )
  }

  getMessagesSetter()([])
  getContext.cache.clear?.()
  getCodeStyle.cache.clear?.()
  resetFileFreshnessSession()

  return result
}

// ── Helpers ──

function resolveCompressionModel(tokenCount: number): {
  modelPointer: 'compact' | 'main'
  notice: string | null
} {
  const modelManager = getModelManager()
  const compactResolution = modelManager.resolveModelWithInfo('compact')
  const mainResolution = modelManager.resolveModelWithInfo('main')

  let modelPointer: 'compact' | 'main' = 'compact'
  let notice: string | null = null

  if (!compactResolution.success || !compactResolution.profile) {
    modelPointer = 'main'
    notice = compactResolution.error || "Compression model 'compact' not configured."
  } else {
    const compactBudget = Math.floor(compactResolution.profile.contextLength * 0.9)
    if (compactBudget > 0 && tokenCount > compactBudget) {
      modelPointer = 'main'
      notice = `Compression model '${compactResolution.profile.name}' can't fit context (~${Math.round(tokenCount / 1000)}k tokens).`
    }
  }

  if (modelPointer === 'main' && (!mainResolution.success || !mainResolution.profile)) {
    throw new Error(mainResolution.error || "Compression fallback failed: 'main' not configured.")
  }

  return { modelPointer, notice }
}

function extractSummaryText(response: any): string | null {
  const content = response.message.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block?.type === 'text' && block.text) return block.text
    }
  }
  return null
}

function messagesToCompactable(messages: Message[]): CompactableMessage[] {
  return messages.map((msg) => {
    let content = ''
    let type: CompactableMessage['type'] = 'user'

    if (msg.type === 'user') {
      type = 'user'
      const rawContent = (msg as any).message?.content
      content = typeof rawContent === 'string'
        ? rawContent
        : Array.isArray(rawContent)
          ? rawContent.map((c: any) => c.text || '').join('\n')
          : ''
    } else if (msg.type === 'assistant') {
      type = 'assistant'
      const rawContent = (msg as any).message?.content
      content = typeof rawContent === 'string'
        ? rawContent
        : Array.isArray(rawContent)
          ? rawContent.map((c: any) => c.text || '').join('\n')
          : ''
    }

    // Estimate tokens: ~4 chars per token
    const tokens = Math.ceil(content.length * 0.25)

    return { type, content, tokens, original: msg }
  })
}
