/**
 * Unity engine bundle — rules, commands, memory adapted from game-harness-engineering/client
 */

export const UNITY_RULES_CONSTITUTION = `# Forbidden Zone Constitution

## Auto-Generated Code (DO NOT edit manually)
- \`{{CONFIG_GEN_PATH}}\` — Generated config. Edit Excel/data source → run ConfigGenerate.
- \`*_pb.cs\` — Protobuf generated. Edit .proto → regenerate.

## Framework Layer (requires approval)
- \`{{FRAMEWORK_PATH}}\` — Core framework code. Modifying without understanding impacts all systems.

## Art & Resource Directories
- \`ArtResources/\`, \`PackResources/\` — Managed by art pipeline, not code.
- \`.unity\` scene files — Binary, merge-unfriendly. Coordinate with team.

## Third-Party Plugins
- \`Assets/Plugins/\`, \`Assets/3rd/\` — No modification unless marked with [CUSTOM_MOD].
`

export const UNITY_RULES_GOLDEN_PRINCIPLES = `# Golden Principles — Unity/C#

Non-negotiable coding rules for this project.

## Logging
- ❌ \`Debug.Log\`, \`Debug.LogWarning\`, \`Debug.LogError\`
- ✅ Use project logger (MLog or equivalent)

## Async
- ❌ \`System.Threading.Tasks.Task\`, \`async/await\` with Task
- ✅ \`UniTask\` for all async operations

## Object Lifecycle
- ❌ \`Destroy()\` on pooled objects
- ✅ \`ObjectPoolUtility.Return()\` or equivalent pool API

## Events
- Subscribe in \`OnEnable()\` / initialization
- Unsubscribe in \`OnDisable()\` / cleanup
- ❌ Unmatched Subscribe without Unsubscribe → memory leak

## Architecture
- One-way dependencies: Framework ← Gameplay ← Renderer ← Tools
- ❌ Lower layer referencing higher layer
- ✅ Cross-module communication through EventManager/interfaces

## Null Safety
- Always null-check GetComponent<T>() results
- Use TryGetComponent<T>() where possible
- Never assume Find() returns non-null
`

export const UNITY_RULES_STYLE = `# Unity C# Style Guide

## Naming
- Classes/Structs: PascalCase
- Methods: PascalCase
- Private fields: _camelCase with underscore prefix
- Public properties: PascalCase
- Constants: UPPER_SNAKE_CASE
- Enums: PascalCase (members too)

## File Organization
- One primary class per file
- File name matches class name
- Namespace matches directory structure

## MonoBehaviour
- Lifecycle order: Awake → OnEnable → Start → Update → OnDisable → OnDestroy
- Heavy init in Awake, subscriptions in OnEnable
- Never call Destroy() in Awake or OnEnable
`

export const UNITY_MEMORY_ARCHITECTURE = `---
name: architecture-layers
description: Unity project layer structure and dependencies
type: project
---

## Layer Structure

| Layer | Responsibility | Can Reference |
|-------|---------------|---------------|
| Framework | Core systems, managers, utilities | Nothing above |
| Gameplay | Game logic, features, handlers | Framework |
| Renderer | Visual, UI, effects | Framework, Gameplay |
| Tools | Editor tools, debug utilities | All layers |

_Update this with your project's actual architecture as you learn it._
`

export const UNITY_HOOK_SYNTAX = `#!/bin/bash
# Gate 1: SYNTAX — post-edit C# syntax check.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
[ -z "$FILE_PATH" ] && exit 0
echo "$FILE_PATH" | grep -qE '\\.cs$' || exit 0
# If dotnet-csharp-syntax-check is available, use it
if command -v dotnet-csharp-syntax-check &>/dev/null; then
  dotnet-csharp-syntax-check "$FILE_PATH" 2>&1 || true
fi
exit 0
`

export function getUnityBundle(): Record<string, string> {
  return {
    'rules/constitution.md.tmpl': UNITY_RULES_CONSTITUTION,
    'rules/golden-principles.md': UNITY_RULES_GOLDEN_PRINCIPLES,
    'rules/unity-csharp.md': UNITY_RULES_STYLE,
    'rules/known-pitfalls.md': require('./common').RULE_KNOWN_PITFALLS,
    'rules/architecture-boundaries.md': require('./common').RULE_ARCHITECTURE_BOUNDARIES,
    'commands/auto-work.md': require('./common').CMD_AUTO_WORK,
    'commands/auto-bugfix.md': require('./common').CMD_AUTO_BUGFIX,
    'commands/review.md': require('./common').CMD_REVIEW,
    'commands/fix-harness.md': require('./common').CMD_FIX_HARNESS,
    'commands/plan.md': require('./common').CMD_PLAN,
    'commands/verify.md': require('./common').CMD_VERIFY,
    'commands/parallel-execute.md': require('./common').CMD_PARALLEL_EXECUTE,
    'memory/MEMORY.md': require('./common').MEMORY_INDEX,
    'memory/architecture-layers.md': UNITY_MEMORY_ARCHITECTURE,
    'hooks/constitution-guard.sh': require('./common').HOOK_CONSTITUTION_GUARD,
    'hooks/syntax-check.sh': UNITY_HOOK_SYNTAX,
    'hooks/pre-commit.sh': require('./common').HOOK_PRE_COMMIT,
    'hooks/post-commit.sh': require('./common').HOOK_POST_COMMIT,
    'hooks/push-gate.sh': require('./common').HOOK_PUSH_GATE,
    'hooks/harness-evolution.sh': require('./common').HOOK_HARNESS_EVOLUTION,
  }
}
