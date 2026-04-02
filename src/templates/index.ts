/**
 * Template system — provides complete harness bundles per engine type.
 */

export { renderTemplate, buildTemplateContext, type TemplateContext } from './templateEngine'
export { installBundle, type InstalledFiles } from './bundleInstaller'

import * as common from './bundles/common'
import { getUnityBundle } from './bundles/unity'
import { getGoServerBundle } from './bundles/goServer'
import { getUnrealBundle } from './bundles/unreal'
import { getGodotBundle } from './bundles/godot'
import { getWorkspaceBundle } from './bundles/workspace'
import * as scripts from './bundles/scripts'
import * as agents from './bundles/agents'
import * as monitor from './bundles/monitor'

/**
 * Shared tools bundle — scripts, agents, monitor.
 * Added to every engine bundle.
 */
function getSharedToolsBundle(): Record<string, string> {
  return {
    // Shell-enforced scripts
    'scripts/auto-work-loop.sh': scripts.SCRIPT_AUTO_WORK_LOOP,
    'scripts/parallel-wave.sh': scripts.SCRIPT_PARALLEL_WAVE,
    'scripts/red-blue-loop.sh': scripts.SCRIPT_RED_BLUE,
    'scripts/orchestrator.sh': scripts.SCRIPT_ORCHESTRATOR,
    'scripts/verify-server.sh': scripts.SCRIPT_VERIFY_SERVER,
    'scripts/verify-client.sh': scripts.SCRIPT_VERIFY_CLIENT,
    'scripts/check-env.sh': scripts.SCRIPT_CHECK_ENV,
    // Agent role specs
    'agents/code-writer.md': agents.AGENT_CODE_WRITER,
    'agents/code-reviewer.md': agents.AGENT_CODE_REVIEWER,
    'agents/red-team.md': agents.AGENT_RED_TEAM,
    'agents/blue-team.md': agents.AGENT_BLUE_TEAM,
    'agents/skill-extractor.md': agents.AGENT_SKILL_EXTRACTOR,
    // Task template
    'templates/program-template.md': agents.TEMPLATE_PROGRAM,
    // Monitor data collection
    'monitor/log-tool-use.py': monitor.MONITOR_LOG_TOOL_USE,
    'monitor/log-session-end.py': monitor.MONITOR_LOG_SESSION_END,
    'monitor/log-verify.py': monitor.MONITOR_LOG_VERIFY,
    'monitor/log-bugfix.py': monitor.MONITOR_LOG_BUGFIX,
    'monitor/log-review.py': monitor.MONITOR_LOG_REVIEW,
  }
}

export function getBundleForEngine(engine: string | null, serverLanguage: string | null): Record<string, string> {
  let engineBundle: Record<string, string>

  if (engine === 'unity') engineBundle = getUnityBundle()
  else if (engine === 'unreal') engineBundle = getUnrealBundle()
  else if (engine === 'godot') engineBundle = getGodotBundle()
  else if (serverLanguage === 'go') engineBundle = getGoServerBundle()
  else {
    // Generic fallback
    engineBundle = {
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

  // Merge shared tools into every bundle
  return { ...engineBundle, ...getSharedToolsBundle() }
}

export { getWorkspaceBundle }
