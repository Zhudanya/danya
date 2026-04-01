import { z } from 'zod'
import type * as React from 'react'
import type { PermissionMode } from '@kode-types/permissionMode'
import type { ToolPermissionContext } from '@kode-types/toolPermissionContext'
import type {
  PermissionResult,
  PermissionDecision,
} from '../../types/permissions'

export type SetToolJSXFn = (
  jsx: {
    jsx: React.ReactNode | null
    shouldHidePromptInput: boolean
  } | null,
) => void

export interface ToolUseContext {
  messageId: string | undefined
  toolUseId?: string
  agentId?: string
  safeMode?: boolean
  abortController: AbortController
  readFileTimestamps: { [filePath: string]: number }
  options?: {
    commands?: any[]
    tools?: any[]
    verbose?: boolean
    slowAndCapableModel?: string
    safeMode?: boolean
    permissionMode?: PermissionMode
    toolPermissionContext?: ToolPermissionContext
    lastUserPrompt?: string
    forkNumber?: number
    messageLogName?: string
    maxThinkingTokens?: any
    model?: string
    commandAllowedTools?: string[]
    isKodingRequest?: boolean
    kodingContext?: string
    isCustomCommand?: boolean
    mcpClients?: any[]
    disableSlashCommands?: boolean
    persistSession?: boolean
    shouldAvoidPermissionPrompts?: boolean
  }
  responseState?: {
    previousResponseId?: string
    conversationId?: string
  }
}

export interface ExtendedToolUseContext extends ToolUseContext {
  setToolJSX: SetToolJSXFn
}

export interface ValidationResult {
  result: boolean
  message?: string
  errorCode?: number
  meta?: any
}

// ============================================================================
// Tool Progress
// ============================================================================

export type ToolProgressData = Record<string, unknown>

export type ToolProgress<P extends ToolProgressData = ToolProgressData> = {
  toolUseID: string
  data: P
}

export type ToolCallProgress<P extends ToolProgressData = ToolProgressData> = (
  progress: ToolProgress<P>,
) => void

// ============================================================================
// Tool Result
// ============================================================================

export type ToolResult<T = unknown> = {
  data: T
  newMessages?: unknown[]
  contextModifier?: {
    modifyContext: (ctx: ToolUseContext) => ToolUseContext
  }
}

// ============================================================================
// Tool Interface
// ============================================================================

export interface Tool<
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput = any,
> {
  // ── Identity ──────────────────────────────────────
  name: string
  description?: string | ((input?: z.infer<TInput>) => Promise<string>)
  inputSchema: TInput
  inputJSONSchema?: Record<string, unknown>
  prompt: (options?: { safeMode?: boolean }) => Promise<string>
  userFacingName?: (input?: z.infer<TInput>) => string
  cachedDescription?: string

  /** 3-10 word hint for tool discovery */
  searchHint?: string

  // ── State Queries ─────────────────────────────────
  isEnabled: () => Promise<boolean>
  isReadOnly: (input?: z.infer<TInput>) => boolean
  isConcurrencySafe: (input?: z.infer<TInput>) => boolean
  needsPermissions: (input?: z.infer<TInput>) => boolean
  requiresUserInteraction?: (input?: z.infer<TInput>) => boolean

  /**
   * Whether the tool performs an irreversible action (delete, send, overwrite).
   * Used for risk assessment in gate chain and destructive command detection.
   */
  isDestructive?: (input?: z.infer<TInput>) => boolean

  /**
   * Extract the primary file path from tool input (for file-based tools).
   * Used by permission system for path-based rule matching.
   */
  getPath?: (input: z.infer<TInput>) => string

  /**
   * Maximum result size in characters before persisting to disk.
   * Large results are saved to file and the model gets a preview + path.
   */
  maxResultSizeChars?: number

  // ── Validation & Permissions ──────────────────────
  validateInput?: (
    input: z.infer<TInput>,
    context?: ToolUseContext,
  ) => Promise<ValidationResult>

  /**
   * Rich permission checking that returns allow/ask/deny with reasons.
   * Provides richer feedback than needsPermissions().
   * If both checkPermissions and needsPermissions exist, checkPermissions takes precedence.
   */
  checkPermissions?: (
    input: z.infer<TInput>,
    context: ToolUseContext,
  ) => Promise<PermissionResult>

  /**
   * Prepare a matcher function for checking this tool's input against permission rules.
   * Returns a function that takes a rule pattern and returns whether it matches.
   */
  preparePermissionMatcher?: (
    input: z.infer<TInput>,
  ) => Promise<(rulePattern: string) => boolean>

  // ── Rendering ─────────────────────────────────────
  renderResultForAssistant: (output: TOutput) => string | any[]
  renderToolUseMessage: (
    input: z.infer<TInput>,
    options: { verbose: boolean },
  ) => string | React.ReactElement | null
  renderToolUseRejectedMessage?: (...args: any[]) => React.ReactElement
  renderToolResultMessage?: (
    output: TOutput,
    options: { verbose: boolean },
  ) => React.ReactNode

  /**
   * Description for the status spinner during tool execution.
   * Returns something like "Reading src/foo.ts" or "Searching codebase".
   */
  getActivityDescription?: (input: z.infer<TInput>) => string | null

  // ── Execution ─────────────────────────────────────
  /**
   * Async generator-based execution (Kode's pattern).
   * Yields progress events and a final result.
   */
  call: (
    input: z.infer<TInput>,
    context: ToolUseContext,
  ) => AsyncGenerator<
    | {
        type: 'result'
        data: TOutput
        resultForAssistant?: string | any[]
        newMessages?: unknown[]
        contextModifier?: {
          modifyContext: (ctx: ToolUseContext) => ToolUseContext
        }
      }
    | {
        type: 'progress'
        content: any
        normalizedMessages?: any[]
        tools?: any[]
      },
    void,
    unknown
  >
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getToolDescription(tool: Tool): string {
  if (tool.cachedDescription) {
    return tool.cachedDescription
  }

  if (typeof tool.description === 'string') {
    return tool.description
  }

  return `Tool: ${tool.name}`
}

/**
 * Find a tool by name from a tool array.
 */
export function findToolByName(tools: Tool[], name: string): Tool | undefined {
  return tools.find((t) => t.name === name)
}

/**
 * Check if a tool is safe to run in parallel based on its input.
 * Read-only tools are always safe. Non-read-only tools check isConcurrencySafe.
 */
export function isToolParallelSafe(tool: Tool, input?: unknown): boolean {
  if (tool.isReadOnly(input)) return true
  return tool.isConcurrencySafe(input)
}

/**
 * Partition tool calls into parallel-safe and serial batches.
 */
export function partitionToolCalls<T extends { tool: Tool; input: unknown }>(
  calls: T[],
): { parallel: T[]; serial: T[] } {
  const parallel: T[] = []
  const serial: T[] = []

  for (const call of calls) {
    if (isToolParallelSafe(call.tool, call.input)) {
      parallel.push(call)
    } else {
      serial.push(call)
    }
  }

  return { parallel, serial }
}
