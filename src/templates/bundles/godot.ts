/**
 * Godot engine bundle
 */

import * as common from './common'

export const GODOT_RULES_CONSTITUTION = `# Forbidden Zone Constitution

## Auto-Generated Code
- \`{{CONFIG_GEN_PATH}}\` — Generated scripts. Edit source data → regenerate.
- \`.import/\` — Godot import cache. Never edit or commit.

## Addons
- \`addons/\` — Third-party plugins. Do not modify unless forked.
`

export const GODOT_RULES_GOLDEN_PRINCIPLES = `# Golden Principles — Godot/GDScript

## Type Hints
- ✅ All function parameters and return types must have type hints
- ❌ Untyped \`func process(delta)\`
- ✅ \`func _process(delta: float) -> void\`

## Signals
- Connect in \`_ready()\`
- Disconnect in \`_exit_tree()\`
- ❌ Unmatched connect without disconnect

## Physics
- ❌ Movement in \`_process()\`
- ✅ Movement in \`_physics_process()\`

## Node References
- ❌ Hardcoded paths: \`get_node("../Player/Sprite")\`
- ✅ @onready var + @export for configurable references

## Resource Loading
- ❌ \`load()\` at runtime for large resources
- ✅ \`preload()\` for small, always-needed resources
- ✅ \`ResourceLoader.load_threaded_request()\` for large resources
`

export const GODOT_RULES_STYLE = `# GDScript Style Guide

## Naming
- Classes: PascalCase
- Functions/variables: snake_case
- Constants: UPPER_SNAKE_CASE
- Signals: snake_case (past tense: health_changed, item_picked_up)
- Private: underscore prefix (_internal_method)

## File Organization
- One script per node/scene where possible
- Autoloads for global systems
- Class name matches file name
`

export function getGodotBundle(): Record<string, string> {
  return {
    'rules/constitution.md.tmpl': GODOT_RULES_CONSTITUTION,
    'rules/golden-principles.md': GODOT_RULES_GOLDEN_PRINCIPLES,
    'rules/godot-gdscript.md': GODOT_RULES_STYLE,
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
