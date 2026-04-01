/**
 * Query Bridge — Integration Adapter
 *
 * Bridges tool orchestration with the multi-model system.
 * This is the key integration point that lets the tool execution engine
 * work with any model provider (Anthropic, OpenAI, Qwen, DeepSeek, etc.).
 *
 * Architecture:
 *   toolOrchestration → queryBridge → ModelManager → Provider Adapters → Any API
 */

import type { Tool, ToolUseContext } from '@tool'
import type { SystemPromptSection } from '../../constants/systemPromptSections'
import { resolveSystemPromptSections } from '../../constants/systemPromptSections'
import { runToolCalls, type ToolCall, type OrchestrationResult } from '../tools/toolOrchestration'
import type { ToolExecutionOptions } from '../tools/toolExecution'
import type { HooksConfig } from '../../types/hooks'
import {
  shouldTriggerCompaction,
  calculateCompactionTarget,
  type CompactionConfig,
  DEFAULT_COMPACTION_CONFIG,
} from '../compact/compact'

// ============================================================================
// Types
// ============================================================================

export type ModelPointer = 'main' | 'task' | 'compact' | 'quick'

export type QueryBridgeConfig = {
  /** Function to resolve a model pointer to an actual model call */
  queryModel: (params: ModelQueryParams) => Promise<ModelQueryResult>
  /** Function to count tokens in a message */
  countTokens?: (text: string) => number
  /** Context window size of the current model */
  contextWindowSize?: number
  /** Compaction config */
  compactionConfig?: CompactionConfig
  /** Hooks configuration */
  hooksConfig?: HooksConfig
  /** Working directory */
  cwd?: string
}

export type ModelQueryParams = {
  messages: unknown[]
  systemPrompt: string[]
  tools: Tool[]
  modelPointer: ModelPointer
  stream: boolean
  abortSignal?: AbortSignal
}

export type ModelQueryResult = {
  content: Array<{
    type: 'text' | 'tool_use'
    text?: string
    id?: string
    name?: string
    input?: Record<string, unknown>
  }>
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  stopReason?: 'end_turn' | 'tool_use' | 'max_tokens'
}

// ============================================================================
// Query Bridge
// ============================================================================

/**
 * Create a query bridge instance with the given configuration.
 * The bridge manages the conversation loop with tool orchestration.
 */
export function createQueryBridge(config: QueryBridgeConfig) {
  const {
    queryModel,
    countTokens = (text: string) => Math.ceil(text.length / 4), // rough estimate
    contextWindowSize = 200000,
    compactionConfig = DEFAULT_COMPACTION_CONFIG,
    hooksConfig,
    cwd = process.cwd(),
  } = config

  /**
   * Resolve system prompt sections and return the final prompt strings.
   */
  async function resolvePrompt(sections: SystemPromptSection[]): Promise<string[]> {
    const resolved = await resolveSystemPromptSections(sections)
    return resolved.filter((s): s is string => s !== null)
  }

  /**
   * Execute a single turn of the conversation:
   * 1. Send messages + tools to model
   * 2. If model requests tool use → execute tools via orchestration
   * 3. Return assistant response + tool results
   */
  async function executeTurn(params: {
    messages: unknown[]
    systemPrompt: string[]
    tools: Tool[]
    toolUseContext: ToolUseContext
    modelPointer?: ModelPointer
  }): Promise<{
    response: ModelQueryResult
    toolResults?: OrchestrationResult
  }> {
    const { messages, systemPrompt, tools, toolUseContext, modelPointer = 'main' } = params

    // Check if compaction needed
    const totalTokens = countTokens(JSON.stringify(messages))
    if (shouldTriggerCompaction(totalTokens, contextWindowSize, compactionConfig)) {
      // Signal that compaction is needed (caller handles it)
      // In a full implementation, this would invoke the compact model
    }

    // Query the model
    const response = await queryModel({
      messages,
      systemPrompt,
      tools,
      modelPointer,
      stream: true,
      abortSignal: toolUseContext.abortController.signal,
    })

    // Check if model requested tool use
    const toolUseBlocks = response.content.filter((c) => c.type === 'tool_use')

    if (toolUseBlocks.length === 0) {
      return { response }
    }

    // Build tool calls from model response
    const toolCalls: ToolCall[] = toolUseBlocks
      .filter((block) => block.name && block.input)
      .map((block) => {
        const tool = tools.find((t) => t.name === block.name)
        if (!tool) {
          throw new Error(`Tool not found: ${block.name}`)
        }
        return {
          toolUseId: block.id ?? `tool-${Date.now()}`,
          tool,
          input: block.input!,
        }
      })

    // Execute tools via orchestration (parallel read, serial write)
    const toolResults = await runToolCalls(toolCalls, toolUseContext, {
      hooksConfig,
      cwd,
    })

    return { response, toolResults }
  }

  return {
    resolvePrompt,
    executeTurn,
  }
}
