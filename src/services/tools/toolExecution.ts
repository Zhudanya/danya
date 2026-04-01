/**
 * Tool Execution Engine
 *
 * Handles the full lifecycle of a single tool invocation:
 *   validateInput → checkPermissions → executePreHooks → call → executePostHooks
 *
 * Features:
 * - Rich permission checking with allow/ask/deny decisions
 * - Pre/post tool hooks for gate chain integration
 * - Error handling and recovery
 * - Progress event streaming
 */

import type { Tool, ToolUseContext, ValidationResult } from '@tool'
import type { PermissionResult } from '../../types/permissions'
import type { AggregatedHookResult, HooksConfig } from '../../types/hooks'
import { executePreToolHooks, executePostToolHooks } from '../../utils/hooks/hookExecutor'

export type ToolExecutionResult<T = unknown> = {
  success: boolean
  data?: T
  resultForAssistant?: string | any[]
  error?: string
  blocked?: boolean
  blockReason?: string
  hookResult?: AggregatedHookResult
  newMessages?: unknown[]
  contextModifier?: {
    modifyContext: (ctx: ToolUseContext) => ToolUseContext
  }
}

export type ToolExecutionOptions = {
  hooksConfig?: HooksConfig
  cwd?: string
  /** Skip permission check (for tools already approved) */
  skipPermissionCheck?: boolean
  /** Skip hooks (for internal tool calls) */
  skipHooks?: boolean
}

/**
 * Execute a single tool with full lifecycle management.
 */
export async function executeToolUse<TInput extends Record<string, unknown>, TOutput>(
  tool: Tool,
  input: TInput,
  context: ToolUseContext,
  options: ToolExecutionOptions = {},
): Promise<ToolExecutionResult<TOutput>> {
  const { hooksConfig, cwd = process.cwd(), skipPermissionCheck, skipHooks } = options

  // ── Step 1: Validate Input ───────────────────────
  if (tool.validateInput) {
    const validation = await tool.validateInput(input, context)
    if (!validation.result) {
      return {
        success: false,
        error: validation.message ?? 'Input validation failed',
        blocked: true,
        blockReason: 'validation',
      }
    }
  }

  // ── Step 2: Check Permissions ────────────────────
  if (!skipPermissionCheck) {
    if (tool.checkPermissions) {
      const permResult = await tool.checkPermissions(input, context)
      if (permResult.behavior === 'deny') {
        return {
          success: false,
          error: permResult.message,
          blocked: true,
          blockReason: 'permission_denied',
        }
      }
      if (permResult.behavior === 'ask') {
        // In auto mode, this would prompt the user
        // For now, treat as blocked — the UI layer handles the prompt
        return {
          success: false,
          error: permResult.message,
          blocked: true,
          blockReason: 'permission_ask',
        }
      }
    } else if (tool.needsPermissions(input)) {
      // Fallback to Kode's simple permission check
      return {
        success: false,
        error: `Tool ${tool.name} requires permission`,
        blocked: true,
        blockReason: 'permission_ask',
      }
    }
  }

  // ── Step 3: Execute Pre-Tool Hooks ───────────────
  if (!skipHooks && hooksConfig) {
    const preHookResult = await executePreToolHooks(
      hooksConfig,
      tool.name,
      input,
      cwd,
    )

    if (preHookResult.blockingErrors?.length) {
      return {
        success: false,
        blocked: true,
        blockReason: 'hook_blocked',
        error: preHookResult.blockingErrors[0]!.blockingError,
        hookResult: preHookResult,
      }
    }

    // Apply input updates from hooks
    if (preHookResult.updatedInput) {
      Object.assign(input, preHookResult.updatedInput)
    }
  }

  // ── Step 4: Execute Tool ─────────────────────────
  try {
    let result: ToolExecutionResult<TOutput> | null = null

    for await (const event of tool.call(input, context)) {
      if (event.type === 'result') {
        result = {
          success: true,
          data: event.data as TOutput,
          resultForAssistant: event.resultForAssistant,
          newMessages: event.newMessages,
          contextModifier: event.contextModifier,
        }
      }
      // Progress events are yielded but not captured here
      // (the caller's for-await loop handles them)
    }

    if (!result) {
      return {
        success: false,
        error: `Tool ${tool.name} completed without producing a result`,
      }
    }

    // ── Step 5: Execute Post-Tool Hooks ──────────────
    if (!skipHooks && hooksConfig) {
      const postHookResult = await executePostToolHooks(
        hooksConfig,
        tool.name,
        input,
        result.data,
        cwd,
      )
      result.hookResult = postHookResult

      // Post-hooks can inject additional context but don't block
      if (postHookResult.additionalContexts?.length) {
        // Additional context will be added to the next system reminder
      }
    }

    return result
  } catch (err: any) {
    // ── Error Handling ───────────────────────────────
    return {
      success: false,
      error: err.message ?? String(err),
    }
  }
}
