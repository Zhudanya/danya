/**
 * Template system — provides complete harness bundles per engine type.
 */

export { renderTemplate, buildTemplateContext, type TemplateContext } from './templateEngine'
export { installBundle, type InstalledFiles } from './bundleInstaller'

import { getUnityBundle } from './bundles/unity'
import { getGoServerBundle } from './bundles/goServer'
import { getUnrealBundle } from './bundles/unreal'
import { getGodotBundle } from './bundles/godot'
import { getWorkspaceBundle } from './bundles/workspace'

export function getBundleForEngine(engine: string | null, serverLanguage: string | null): Record<string, string> {
  if (engine === 'unity') return getUnityBundle()
  if (engine === 'unreal') return getUnrealBundle()
  if (engine === 'godot') return getGodotBundle()
  if (serverLanguage === 'go') return getGoServerBundle()

  // Generic fallback — common commands + hooks, no engine-specific rules
  const common = require('./bundles/common')
  return {
    'rules/known-pitfalls.md': common.RULE_KNOWN_PITFALLS,
    'rules/architecture-boundaries.md': common.RULE_ARCHITECTURE_BOUNDARIES,
    'commands/auto-work.md': common.CMD_AUTO_WORK,
    'commands/auto-bugfix.md': common.CMD_AUTO_BUGFIX,
    'commands/review.md': common.CMD_REVIEW,
    'commands/fix-harness.md': common.CMD_FIX_HARNESS,
    'commands/plan.md': common.CMD_PLAN,
    'commands/verify.md': common.CMD_VERIFY,
    'commands/parallel-execute.md': common.CMD_PARALLEL_EXECUTE,
    'memory/MEMORY.md': common.MEMORY_INDEX,
    'hooks/constitution-guard.sh': common.HOOK_CONSTITUTION_GUARD,
    'hooks/pre-commit.sh': common.HOOK_PRE_COMMIT,
    'hooks/post-commit.sh': common.HOOK_POST_COMMIT,
    'hooks/push-gate.sh': common.HOOK_PUSH_GATE,
    'hooks/harness-evolution.sh': common.HOOK_HARNESS_EVOLUTION,
  }
}

export { getWorkspaceBundle }
