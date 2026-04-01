/**
 * Hook system type definitions ported from Codex (Claude Code).
 * Supports 18 hook event types for the gate chain and quality workflow.
 *
 * Type-only file — no runtime dependencies.
 */

// ============================================================================
// Hook Events — 18 lifecycle events
// ============================================================================

export const HOOK_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'PermissionRequest',
  'PermissionDenied',
  'UserPromptSubmit',
  'SessionStart',
  'Setup',
  'Stop',
  'Notification',
  'SubagentStart',
  'SubagentStop',
  'PreCompact',
  'PostCompact',
  'CwdChanged',
  'FileChanged',
  'WorktreeCreate',
  'Elicitation',
] as const

export type HookEvent = (typeof HOOK_EVENTS)[number]

export function isHookEvent(value: string): value is HookEvent {
  return HOOK_EVENTS.includes(value as HookEvent)
}

// ============================================================================
// Hook Input (what hooks receive)
// ============================================================================

export type HookInput = {
  /** The hook event name */
  hook_event_name: HookEvent
  /** Session ID */
  session_id?: string
  /** Tool name (for PreToolUse, PostToolUse, etc.) */
  tool_name?: string
  /** Tool input parameters */
  tool_input?: Record<string, unknown>
  /** Tool output (for PostToolUse) */
  tool_output?: unknown
  /** Error message (for PostToolUseFailure) */
  error?: string
  /** File path (for FileChanged) */
  file_path?: string
  /** Working directory */
  cwd?: string
  /** Stop reason (for Stop event) */
  stop_reason?: string
}

// ============================================================================
// Hook Output (what hooks return via JSON stdout)
// ============================================================================

/** Sync hook response (immediate result) */
export type SyncHookOutput = {
  /** Whether the agent should continue after hook (default: true) */
  continue?: boolean
  /** Hide stdout from transcript */
  suppressOutput?: boolean
  /** Message shown when continue is false */
  stopReason?: string
  /** Approve or block the operation */
  decision?: 'approve' | 'block'
  /** Explanation for the decision */
  reason?: string
  /** Warning message shown to the user */
  systemMessage?: string
  /** Additional context injected into the conversation */
  additionalContext?: string
  /** Hook-specific output */
  hookSpecificOutput?: HookSpecificOutput
}

/** Async hook response (hook continues running in background) */
export type AsyncHookOutput = {
  async: true
  asyncTimeout?: number
}

export type HookJSONOutput = SyncHookOutput | AsyncHookOutput

/** Hook-specific output discriminated by event name */
export type HookSpecificOutput =
  | {
      hookEventName: 'PreToolUse'
      permissionDecision?: 'allow' | 'deny' | 'ask'
      permissionDecisionReason?: string
      updatedInput?: Record<string, unknown>
      additionalContext?: string
    }
  | {
      hookEventName: 'PostToolUse'
      additionalContext?: string
      updatedMCPToolOutput?: unknown
    }
  | {
      hookEventName: 'PostToolUseFailure'
      additionalContext?: string
    }
  | {
      hookEventName: 'SessionStart'
      additionalContext?: string
      initialUserMessage?: string
      watchPaths?: string[]
    }
  | {
      hookEventName: 'UserPromptSubmit'
      additionalContext?: string
    }
  | {
      hookEventName: 'Setup'
      additionalContext?: string
    }
  | {
      hookEventName: 'SubagentStart'
      additionalContext?: string
    }
  | {
      hookEventName: 'Notification'
      additionalContext?: string
    }
  | {
      hookEventName: 'PermissionRequest'
      decision:
        | { behavior: 'allow'; updatedInput?: Record<string, unknown> }
        | { behavior: 'deny'; message?: string; interrupt?: boolean }
    }
  | {
      hookEventName: 'PermissionDenied'
      retry?: boolean
    }
  | {
      hookEventName: 'CwdChanged'
      watchPaths?: string[]
    }
  | {
      hookEventName: 'FileChanged'
      watchPaths?: string[]
    }

// ============================================================================
// Hook Configuration (from settings.json)
// ============================================================================

/** A single hook definition */
export type HookDefinition = {
  /** Shell command to execute */
  command: string
  /** Timeout in milliseconds */
  timeout?: number
  /** Hook type: command (shell) or callback (internal) */
  type?: 'command'
}

/** Hook with matcher for targeting specific tools/patterns */
export type HookMatcher = {
  /** Tool name pattern (regex). e.g., "Edit|Write", "Bash" */
  matcher?: string
  /** Command pattern for Bash tool (regex). e.g., "git\\s+push" */
  commandPattern?: string
  /** File pattern for file tools (regex). e.g., "\\.(cs|go)$" */
  filePattern?: string
  /** Hook definitions to execute when matched */
  hooks: HookDefinition[]
  /** Plugin that provided this hook */
  pluginName?: string
}

/** Complete hooks configuration per event */
export type HooksConfig = {
  [K in HookEvent]?: HookMatcher[]
}

// ============================================================================
// Hook Execution Results
// ============================================================================

export type HookBlockingError = {
  blockingError: string
  command: string
}

export type HookResult = {
  /** System message to inject */
  systemMessage?: string
  /** Blocking error (stops tool execution) */
  blockingError?: HookBlockingError
  /** Outcome of hook execution */
  outcome: 'success' | 'blocking' | 'non_blocking_error' | 'cancelled'
  /** Prevent agent from continuing */
  preventContinuation?: boolean
  /** Stop reason text */
  stopReason?: string
  /** Permission behavior override */
  permissionBehavior?: 'ask' | 'deny' | 'allow' | 'passthrough'
  /** Reason for permission override */
  hookPermissionDecisionReason?: string
  /** Additional context to inject */
  additionalContext?: string
  /** Updated tool input */
  updatedInput?: Record<string, unknown>
}

export type AggregatedHookResult = {
  /** Blocking errors from all hooks */
  blockingErrors?: HookBlockingError[]
  /** Prevent agent from continuing */
  preventContinuation?: boolean
  /** Stop reason text */
  stopReason?: string
  /** Final permission behavior (merged from all hooks) */
  permissionBehavior?: 'ask' | 'deny' | 'allow' | 'passthrough'
  /** All additional contexts from hooks */
  additionalContexts?: string[]
  /** Updated tool input (from last hook that provided one) */
  updatedInput?: Record<string, unknown>
}

// ============================================================================
// Hook Progress (for UI display)
// ============================================================================

export type HookProgress = {
  type: 'hook_progress'
  hookEvent: HookEvent
  hookName: string
  command: string
  statusMessage?: string
}
