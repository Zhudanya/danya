/**
 * Rich permission type definitions.
 * Provides rule-based permission cascade, decision types, and risk assessment.
 *
 * This file contains only type definitions with no runtime dependencies.
 */

// ============================================================================
// Permission Modes
// ============================================================================

export const PERMISSION_MODES = [
  'default',
  'acceptEdits',
  'bypassPermissions',
  'dontAsk',
  'plan',
] as const

export type PermissionMode = (typeof PERMISSION_MODES)[number]

// ============================================================================
// Permission Behaviors
// ============================================================================

export type PermissionBehavior = 'allow' | 'deny' | 'ask'

// ============================================================================
// Permission Rules
// ============================================================================

/**
 * Where a permission rule originated from.
 * Ordered by priority (highest first): policy > flag > cliArg > user > project > local > session
 */
export type PermissionRuleSource =
  | 'policySettings'
  | 'flagSettings'
  | 'cliArg'
  | 'userSettings'
  | 'projectSettings'
  | 'localSettings'
  | 'command'
  | 'session'

/**
 * The value of a permission rule — specifies which tool and optional content pattern
 */
export type PermissionRuleValue = {
  toolName: string
  ruleContent?: string
}

/**
 * A permission rule with its source and behavior
 */
export type PermissionRule = {
  source: PermissionRuleSource
  ruleBehavior: PermissionBehavior
  ruleValue: PermissionRuleValue
}

// ============================================================================
// Permission Updates
// ============================================================================

export type PermissionUpdateDestination =
  | 'userSettings'
  | 'projectSettings'
  | 'localSettings'
  | 'session'
  | 'cliArg'

export type PermissionUpdate =
  | {
      type: 'addRules'
      destination: PermissionUpdateDestination
      rules: PermissionRuleValue[]
      behavior: PermissionBehavior
    }
  | {
      type: 'replaceRules'
      destination: PermissionUpdateDestination
      rules: PermissionRuleValue[]
      behavior: PermissionBehavior
    }
  | {
      type: 'removeRules'
      destination: PermissionUpdateDestination
      rules: PermissionRuleValue[]
      behavior: PermissionBehavior
    }
  | {
      type: 'setMode'
      destination: PermissionUpdateDestination
      mode: PermissionMode
    }
  | {
      type: 'addDirectories'
      destination: PermissionUpdateDestination
      directories: string[]
    }
  | {
      type: 'removeDirectories'
      destination: PermissionUpdateDestination
      directories: string[]
    }

export type AdditionalWorkingDirectory = {
  path: string
  source: PermissionRuleSource
}

// ============================================================================
// Permission Decisions & Results
// ============================================================================

export type PermissionCommandMetadata = {
  name: string
  description?: string
  [key: string]: unknown
}

export type PermissionMetadata =
  | { command: PermissionCommandMetadata }
  | undefined

/**
 * Result when permission is granted
 */
export type PermissionAllowDecision<
  Input extends Record<string, unknown> = Record<string, unknown>,
> = {
  behavior: 'allow'
  updatedInput?: Input
  userModified?: boolean
  decisionReason?: PermissionDecisionReason
  toolUseID?: string
  acceptFeedback?: string
}

/**
 * Result when user should be prompted
 */
export type PermissionAskDecision<
  Input extends Record<string, unknown> = Record<string, unknown>,
> = {
  behavior: 'ask'
  message: string
  updatedInput?: Input
  decisionReason?: PermissionDecisionReason
  suggestions?: PermissionUpdate[]
  blockedPath?: string
  metadata?: PermissionMetadata
}

/**
 * Result when permission is denied
 */
export type PermissionDenyDecision = {
  behavior: 'deny'
  message: string
  decisionReason: PermissionDecisionReason
  toolUseID?: string
}

/**
 * A permission decision — allow, ask, or deny
 */
export type PermissionDecision<
  Input extends Record<string, unknown> = Record<string, unknown>,
> =
  | PermissionAllowDecision<Input>
  | PermissionAskDecision<Input>
  | PermissionDenyDecision

/**
 * Permission result with additional passthrough option (for MCP tools)
 */
export type PermissionResult<
  Input extends Record<string, unknown> = Record<string, unknown>,
> =
  | PermissionDecision<Input>
  | {
      behavior: 'passthrough'
      message: string
      decisionReason?: PermissionDecisionReason
      suggestions?: PermissionUpdate[]
      blockedPath?: string
    }

/**
 * Explanation of why a permission decision was made
 */
export type PermissionDecisionReason =
  | { type: 'rule'; rule: PermissionRule }
  | { type: 'mode'; mode: PermissionMode }
  | { type: 'hook'; hookName: string; hookSource?: string; reason?: string }
  | { type: 'sandboxOverride'; reason: 'excludedCommand' | 'dangerouslyDisableSandbox' }
  | { type: 'workingDir'; reason: string }
  | { type: 'safetyCheck'; reason: string; classifierApprovable: boolean }
  | { type: 'other'; reason: string }

// ============================================================================
// Tool Permission Context
// ============================================================================

export type ToolPermissionRulesBySource = {
  [T in PermissionRuleSource]?: string[]
}

export type ToolPermissionContext = {
  readonly mode: PermissionMode
  readonly additionalWorkingDirectories: ReadonlyMap<string, AdditionalWorkingDirectory>
  readonly alwaysAllowRules: ToolPermissionRulesBySource
  readonly alwaysDenyRules: ToolPermissionRulesBySource
  readonly alwaysAskRules: ToolPermissionRulesBySource
  readonly isBypassPermissionsModeAvailable: boolean
  readonly shouldAvoidPermissionPrompts?: boolean
}

// ============================================================================
// Risk Assessment (for game dev: used by ArchitectureGuard, ScoreReview)
// ============================================================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type PermissionExplanation = {
  riskLevel: RiskLevel
  explanation: string
  reasoning: string
  risk: string
}
