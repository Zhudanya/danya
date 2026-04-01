/**
 * Permission Rule Cascade Engine
 *
 * Loads permission rules from multiple sources in priority order:
 *   1. Policy settings (org-level, managed)       ← highest priority
 *   2. CLI arguments (--always-allow, --always-deny)
 *   3. User settings (~/.danya/settings.json)
 *   4. Project settings (.danya/settings.json)
 *   5. Local settings (.danya/settings.local.json)
 *   6. Session settings (set via /allow, /deny)   ← lowest priority
 *
 * Higher-priority rules override lower-priority ones.
 */

import type {
  PermissionBehavior,
  PermissionRule,
  PermissionRuleSource,
  PermissionRuleValue,
  PermissionResult,
  PermissionDecision,
  PermissionDecisionReason,
  ToolPermissionContext,
  ToolPermissionRulesBySource,
} from '../../types/permissions'

export type { PermissionRule, PermissionRuleValue, PermissionResult, PermissionDecision }

// ============================================================================
// Rule Matching
// ============================================================================

/**
 * Check if a tool name matches a rule pattern.
 * Supports exact match and wildcard (*).
 */
export function matchToolRule(ruleName: string, toolName: string): boolean {
  if (ruleName === '*') return true
  if (ruleName === toolName) return true

  // Support simple prefix wildcard: "File*" matches "FileRead", "FileWrite", etc.
  if (ruleName.endsWith('*')) {
    const prefix = ruleName.slice(0, -1)
    return toolName.startsWith(prefix)
  }

  // Support pipe-separated: "Edit|Write" matches "Edit" or "Write"
  if (ruleName.includes('|')) {
    return ruleName.split('|').some((part) => part.trim() === toolName)
  }

  return false
}

/**
 * Check if a rule's content pattern matches the tool input content.
 */
export function matchRuleContent(
  ruleContent: string | undefined,
  inputContent: string | undefined,
): boolean {
  if (!ruleContent) return true // No content filter = match all
  if (!inputContent) return false

  try {
    const regex = new RegExp(ruleContent)
    return regex.test(inputContent)
  } catch {
    // Invalid regex — fall back to substring match
    return inputContent.includes(ruleContent)
  }
}

// ============================================================================
// Rule Resolution
// ============================================================================

/** Priority order of rule sources (highest first) */
const SOURCE_PRIORITY: PermissionRuleSource[] = [
  'policySettings',
  'flagSettings',
  'cliArg',
  'userSettings',
  'projectSettings',
  'localSettings',
  'command',
  'session',
]

/**
 * Resolve permission for a tool by checking rules in priority order.
 *
 * Algorithm:
 * 1. Collect all matching rules from all sources
 * 2. Sort by source priority (highest first)
 * 3. Return the first matching rule's behavior
 * 4. If no rule matches, return 'ask' (default)
 */
export function resolvePermission(
  toolName: string,
  inputContent: string | undefined,
  context: ToolPermissionContext,
): PermissionDecision {
  // Check deny rules first (from highest priority source)
  const denyMatch = findMatchingRule(
    toolName,
    inputContent,
    context.alwaysDenyRules,
    'deny',
  )
  if (denyMatch) {
    return {
      behavior: 'deny',
      message: `Permission denied by ${denyMatch.source} rule for ${toolName}`,
      decisionReason: { type: 'rule', rule: denyMatch },
    }
  }

  // Check allow rules
  const allowMatch = findMatchingRule(
    toolName,
    inputContent,
    context.alwaysAllowRules,
    'allow',
  )
  if (allowMatch) {
    return {
      behavior: 'allow',
      decisionReason: { type: 'rule', rule: allowMatch },
    }
  }

  // Check ask rules
  const askMatch = findMatchingRule(
    toolName,
    inputContent,
    context.alwaysAskRules,
    'ask',
  )
  if (askMatch) {
    return {
      behavior: 'ask',
      message: `Permission requires approval: ${toolName}`,
      decisionReason: { type: 'rule', rule: askMatch },
    }
  }

  // Mode-based default
  return resolveModeDefault(toolName, context.mode)
}

function findMatchingRule(
  toolName: string,
  inputContent: string | undefined,
  rulesBySource: ToolPermissionRulesBySource,
  behavior: PermissionBehavior,
): PermissionRule | null {
  for (const source of SOURCE_PRIORITY) {
    const rules = rulesBySource[source]
    if (!rules) continue

    for (const rulePattern of rules) {
      // Parse rule pattern: "ToolName" or "ToolName:content_pattern"
      const colonIdx = rulePattern.indexOf(':')
      const ruleName = colonIdx >= 0 ? rulePattern.slice(0, colonIdx) : rulePattern
      const ruleContent = colonIdx >= 0 ? rulePattern.slice(colonIdx + 1) : undefined

      if (matchToolRule(ruleName, toolName) && matchRuleContent(ruleContent, inputContent)) {
        return {
          source,
          ruleBehavior: behavior,
          ruleValue: { toolName: ruleName, ruleContent },
        }
      }
    }
  }

  return null
}

function resolveModeDefault(
  toolName: string,
  mode: string,
): PermissionDecision {
  switch (mode) {
    case 'bypassPermissions':
      return {
        behavior: 'allow',
        decisionReason: { type: 'mode', mode: 'bypassPermissions' as any },
      }
    case 'dontAsk':
      return {
        behavior: 'deny',
        message: `Permission auto-denied in dontAsk mode for ${toolName}`,
        decisionReason: { type: 'mode', mode: 'dontAsk' as any },
      }
    case 'plan':
      return {
        behavior: 'deny',
        message: `Tool ${toolName} not allowed in plan mode (read-only)`,
        decisionReason: { type: 'mode', mode: 'plan' as any },
      }
    case 'acceptEdits':
      // In acceptEdits mode, file tools are auto-allowed, others ask
      return {
        behavior: 'ask',
        message: `Permission required for ${toolName}`,
        decisionReason: { type: 'mode', mode: 'acceptEdits' as any },
      }
    default:
      return {
        behavior: 'ask',
        message: `Permission required for ${toolName}`,
        decisionReason: { type: 'mode', mode: 'default' as any },
      }
  }
}

// ============================================================================
// Settings Loading
// ============================================================================

export type PermissionSettings = {
  allow?: string[]
  deny?: string[]
  ask?: string[]
}

/**
 * Load permission rules from a settings file and return as ToolPermissionRulesBySource entries.
 */
export function loadRulesFromSettings(
  settings: PermissionSettings | undefined,
  source: PermissionRuleSource,
): {
  allow: ToolPermissionRulesBySource
  deny: ToolPermissionRulesBySource
  ask: ToolPermissionRulesBySource
} {
  const allow: ToolPermissionRulesBySource = {}
  const deny: ToolPermissionRulesBySource = {}
  const ask: ToolPermissionRulesBySource = {}

  if (settings?.allow?.length) {
    allow[source] = settings.allow
  }
  if (settings?.deny?.length) {
    deny[source] = settings.deny
  }
  if (settings?.ask?.length) {
    ask[source] = settings.ask
  }

  return { allow, deny, ask }
}

/**
 * Merge multiple rule-by-source maps.
 */
export function mergeRuleSources(
  ...maps: ToolPermissionRulesBySource[]
): ToolPermissionRulesBySource {
  const result: ToolPermissionRulesBySource = {}
  for (const map of maps) {
    for (const [source, rules] of Object.entries(map)) {
      const key = source as PermissionRuleSource
      if (result[key]) {
        result[key] = [...result[key]!, ...rules!]
      } else {
        result[key] = [...rules!]
      }
    }
  }
  return result
}
