/**
 * Hook Execution Engine
 * Ported from Codex's utils/hooks.ts, adapted for Danya.
 *
 * Executes shell command hooks at 18 lifecycle points.
 * Hooks are configured in .danya/settings.json and can:
 * - Block tool execution (exit code 2)
 * - Inject system messages (JSON output)
 * - Transform tool inputs/outputs
 * - Provide additional context
 */

import { execSync, spawn } from 'child_process'
import { join } from 'path'
import type {
  HookEvent,
  HookInput,
  HookMatcher,
  HookResult,
  AggregatedHookResult,
  SyncHookOutput,
  HookDefinition,
  HooksConfig,
} from '../../types/hooks-codex'

// ============================================================================
// Hook Matching
// ============================================================================

/**
 * Check if a hook matcher matches the current tool invocation.
 */
function matchesHook(
  matcher: HookMatcher,
  toolName?: string,
  commandText?: string,
  filePath?: string,
): boolean {
  // If no matcher patterns defined, match everything
  if (!matcher.matcher && !matcher.commandPattern && !matcher.filePattern) {
    return true
  }

  // Tool name matcher
  if (matcher.matcher && toolName) {
    try {
      const regex = new RegExp(matcher.matcher)
      if (!regex.test(toolName)) return false
    } catch {
      if (!toolName.includes(matcher.matcher)) return false
    }
  }

  // Command pattern matcher (for Bash tool)
  if (matcher.commandPattern && commandText) {
    try {
      const regex = new RegExp(matcher.commandPattern)
      if (!regex.test(commandText)) return false
    } catch {
      if (!commandText.includes(matcher.commandPattern)) return false
    }
  }

  // File pattern matcher (for file tools)
  if (matcher.filePattern && filePath) {
    try {
      const regex = new RegExp(matcher.filePattern)
      if (!regex.test(filePath)) return false
    } catch {
      if (!filePath.includes(matcher.filePattern)) return false
    }
  }

  return true
}

// ============================================================================
// Hook Execution
// ============================================================================

/**
 * Execute a single hook command and parse its output.
 */
async function executeHookCommand(
  hookDef: HookDefinition,
  input: HookInput,
  cwd: string,
  timeout: number = 30000,
): Promise<HookResult> {
  return new Promise<HookResult>((resolve) => {
    const inputJson = JSON.stringify(input)

    try {
      const child = spawn('bash', ['-c', hookDef.command], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: hookDef.timeout ?? timeout,
        env: {
          ...process.env,
          DANYA_HOOK_EVENT: input.hook_event_name,
          DANYA_TOOL_NAME: input.tool_name ?? '',
          DANYA_SESSION_ID: input.session_id ?? '',
        },
      })

      let stdout = ''
      let stderr = ''

      child.stdin?.write(inputJson)
      child.stdin?.end()

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        // Exit code 2 = hard block
        if (code === 2) {
          resolve({
            outcome: 'blocking',
            blockingError: {
              blockingError: stderr.trim() || stdout.trim() || 'Hook blocked the operation',
              command: hookDef.command,
            },
          })
          return
        }

        // Exit code 1 = warning (non-blocking)
        if (code === 1) {
          resolve({
            outcome: 'non_blocking_error',
            systemMessage: stderr.trim() || undefined,
          })
          return
        }

        // Exit code 0 = success, parse JSON output if any
        const parsed = tryParseHookOutput(stdout)
        if (parsed) {
          resolve({
            outcome: parsed.decision === 'block' ? 'blocking' : 'success',
            systemMessage: parsed.systemMessage,
            additionalContext: parsed.additionalContext,
            updatedInput: (parsed.hookSpecificOutput as any)?.updatedInput,
            permissionBehavior: (parsed.hookSpecificOutput as any)?.permissionDecision,
            hookPermissionDecisionReason: (parsed.hookSpecificOutput as any)?.permissionDecisionReason,
            preventContinuation: parsed.continue === false,
            stopReason: parsed.stopReason,
            blockingError:
              parsed.decision === 'block'
                ? {
                    blockingError: parsed.reason ?? 'Hook blocked the operation',
                    command: hookDef.command,
                  }
                : undefined,
          })
        } else {
          // No JSON output — success with optional stderr as system message
          resolve({
            outcome: 'success',
            systemMessage: stderr.trim() || undefined,
          })
        }
      })

      child.on('error', (err) => {
        resolve({
          outcome: 'non_blocking_error',
          systemMessage: `Hook error: ${err.message}`,
        })
      })
    } catch (err: any) {
      resolve({
        outcome: 'non_blocking_error',
        systemMessage: `Hook execution failed: ${err.message}`,
      })
    }
  })
}

/**
 * Try to parse hook stdout as JSON output.
 */
function tryParseHookOutput(stdout: string): SyncHookOutput | null {
  const trimmed = stdout.trim()
  if (!trimmed) return null

  // Try each line (hooks may output multiple JSON lines)
  const lines = trimmed.split('\n')
  for (const line of lines.reverse()) {
    try {
      const parsed = JSON.parse(line.trim())
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as SyncHookOutput
      }
    } catch {
      continue
    }
  }

  return null
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Execute all hooks for a given event.
 */
export async function executeHooks(
  event: HookEvent,
  hooksConfig: HooksConfig,
  input: HookInput,
  cwd: string,
  matchContext?: {
    toolName?: string
    commandText?: string
    filePath?: string
  },
): Promise<AggregatedHookResult> {
  const matchers = hooksConfig[event]
  if (!matchers || matchers.length === 0) {
    return {}
  }

  const results: HookResult[] = []

  for (const matcher of matchers) {
    // Check if this matcher applies
    if (
      !matchesHook(
        matcher,
        matchContext?.toolName ?? input.tool_name,
        matchContext?.commandText,
        matchContext?.filePath,
      )
    ) {
      continue
    }

    // Execute each hook in this matcher
    for (const hookDef of matcher.hooks) {
      const result = await executeHookCommand(hookDef, input, cwd)
      results.push(result)

      // If any hook blocks, stop executing remaining hooks
      if (result.outcome === 'blocking') {
        return aggregateResults(results)
      }
    }
  }

  return aggregateResults(results)
}

/**
 * Aggregate results from multiple hooks.
 */
function aggregateResults(results: HookResult[]): AggregatedHookResult {
  const aggregated: AggregatedHookResult = {}

  for (const r of results) {
    if (r.blockingError) {
      if (!aggregated.blockingErrors) aggregated.blockingErrors = []
      aggregated.blockingErrors.push(r.blockingError)
    }

    if (r.preventContinuation) {
      aggregated.preventContinuation = true
      aggregated.stopReason = r.stopReason
    }

    if (r.permissionBehavior) {
      aggregated.permissionBehavior = r.permissionBehavior
    }

    if (r.additionalContext) {
      if (!aggregated.additionalContexts) aggregated.additionalContexts = []
      aggregated.additionalContexts.push(r.additionalContext)
    }

    if (r.updatedInput) {
      aggregated.updatedInput = r.updatedInput
    }
  }

  return aggregated
}

/**
 * Execute pre-tool-use hooks.
 * Returns: aggregated result that may block tool execution.
 */
export async function executePreToolHooks(
  hooksConfig: HooksConfig,
  toolName: string,
  toolInput: Record<string, unknown>,
  cwd: string,
): Promise<AggregatedHookResult> {
  const input: HookInput = {
    hook_event_name: 'PreToolUse',
    tool_name: toolName,
    tool_input: toolInput,
    cwd,
  }

  // Extract command text for Bash matcher
  const commandText = toolName === 'Bash' ? (toolInput.command as string) : undefined
  // Extract file path for file tool matcher
  const filePath = (toolInput.file_path ?? toolInput.path) as string | undefined

  return executeHooks('PreToolUse', hooksConfig, input, cwd, {
    toolName,
    commandText,
    filePath,
  })
}

/**
 * Execute post-tool-use hooks.
 */
export async function executePostToolHooks(
  hooksConfig: HooksConfig,
  toolName: string,
  toolInput: Record<string, unknown>,
  toolOutput: unknown,
  cwd: string,
): Promise<AggregatedHookResult> {
  const input: HookInput = {
    hook_event_name: 'PostToolUse',
    tool_name: toolName,
    tool_input: toolInput,
    tool_output: toolOutput,
    cwd,
  }

  const filePath = (toolInput.file_path ?? toolInput.path) as string | undefined

  return executeHooks('PostToolUse', hooksConfig, input, cwd, {
    toolName,
    filePath,
  })
}

/**
 * Execute session start hooks.
 */
export async function executeSessionStartHooks(
  hooksConfig: HooksConfig,
  cwd: string,
  sessionId?: string,
): Promise<AggregatedHookResult> {
  return executeHooks(
    'SessionStart',
    hooksConfig,
    { hook_event_name: 'SessionStart', session_id: sessionId, cwd },
    cwd,
  )
}

/**
 * Execute stop hooks (when agent is about to stop).
 */
export async function executeStopHooks(
  hooksConfig: HooksConfig,
  cwd: string,
  stopReason?: string,
): Promise<AggregatedHookResult> {
  return executeHooks(
    'Stop',
    hooksConfig,
    { hook_event_name: 'Stop', stop_reason: stopReason, cwd },
    cwd,
  )
}
