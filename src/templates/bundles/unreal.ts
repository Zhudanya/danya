/**
 * Unreal Engine bundle
 */

import * as common from './common'

export const UE_RULES_CONSTITUTION = `# Forbidden Zone Constitution

## Auto-Generated Code
- \`{{CONFIG_GEN_PATH}}\` — Generated code. Do not edit manually.
- \`Intermediate/\` — Build intermediates. Never commit or edit.
- \`*.generated.h\` — UHT generated headers.

## Engine Source
- \`Engine/\` — Unreal Engine source. Modify only in engine fork.
`

export const UE_RULES_GOLDEN_PRINCIPLES = `# Golden Principles — Unreal C++

## Memory Management
- ❌ Raw \`new\` for UObjects
- ✅ \`NewObject<T>()\`, \`CreateDefaultSubobject<T>()\`
- All UObject* references must have UPROPERTY()

## Logging
- ❌ printf, cout, std::cerr
- ✅ UE_LOG(LogCategory, Verbosity, TEXT("..."))

## Threading
- ❌ std::thread
- ✅ FRunnable, AsyncTask, FGraphEvent

## Naming Conventions
- F = Struct (FVector, FTransform)
- U = UObject-derived (UActorComponent)
- A = AActor-derived (ACharacter)
- E = Enum (EMovementMode)
- I = Interface (IInteractable)
- b prefix for booleans (bIsActive)

## Garbage Collection
- Pointers in containers must be UPROPERTY() or AddToRoot()
- Use TWeakObjectPtr for non-owning references
- Never cache raw pointers to UObjects across frames
`

export const UE_RULES_STYLE = `# Unreal C++ Style Guide

## Headers
- #pragma once (not include guards)
- Engine headers before project headers
- Minimal includes in headers, forward-declare where possible

## Code Organization
- .h in Public/, .cpp in Private/
- One class per file pair
- Module boundaries respected
`

export function getUnrealBundle(): Record<string, string> {
  return {
    'rules/constitution.md.tmpl': UE_RULES_CONSTITUTION,
    'rules/golden-principles.md': UE_RULES_GOLDEN_PRINCIPLES,
    'rules/unreal-cpp.md': UE_RULES_STYLE,
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
