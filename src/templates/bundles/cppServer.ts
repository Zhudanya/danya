/**
 * C++ server bundle — rules, commands, memory for C++ game servers.
 */

import * as common from './common'

export const CPP_RULES_CONSTITUTION = `# Forbidden Zone Constitution

## Auto-Generated Code (DO NOT edit manually)
- \`{{PROTO_GEN_PATH}}\` — Protobuf generated C++ code. Edit .proto → protoc.
- \`{{CONFIG_GEN_PATH}}\` — Config generated from data tables. Edit source → regenerate.
- \`{{FLATBUF_GEN_PATH}}\` — FlatBuffers generated code. Edit .fbs → flatc.

## Third-party / Vendored Code
- \`third_party/\` — External libraries. Update via package manager or submodule.
- \`vendor/\` — Vendored dependencies. Do not modify directly.

## Important
When you see these files, tell the user HOW to regenerate instead of editing directly.
`

export const CPP_RULES_GOLDEN_PRINCIPLES = `# Golden Principles — C++ Server

Non-negotiable coding rules.

## Memory Management
- ❌ Raw new/delete in application code
- ✅ std::unique_ptr for single ownership
- ✅ std::shared_ptr only when shared ownership is truly needed
- ✅ Object pools for frequently created/destroyed objects

## Error Handling
- ❌ Ignoring return values
- ❌ Catching exceptions and swallowing silently
- ✅ Check return codes immediately
- ✅ RAII for resource cleanup

## Concurrency
- ❌ Bare std::thread without join/detach
- ❌ Data races on shared state
- ✅ std::mutex or std::shared_mutex for shared state
- ✅ Lock-free queues for inter-thread messaging

## Build
- ❌ Warnings treated as informational
- ✅ -Wall -Wextra -Werror in CI
- ✅ Address Sanitizer in debug builds

## Workflow
- Plan first for multi-file changes
- Use TaskCreate for progress tracking
`

export const CPP_RULES_STYLE = `# C++ Style Guide

## File Naming
- snake_case for all source files: player_manager.cpp, game_session.h
- .h for headers, .cpp for implementation
- One class per file pair

## Naming Conventions
- PascalCase: classes, structs, enums
- camelCase: methods, local variables
- UPPER_SNAKE: constants, macros
- m_ prefix for member variables (optional, be consistent)

## Headers
- #pragma once (or header guards)
- Forward declare when possible
- Minimize includes in headers

## Modern C++
- Use auto for complex iterator types
- Prefer constexpr over macros
- Use std::optional, std::variant, std::string_view
- Range-based for loops
`

export const CPP_MEMORY_ARCHITECTURE = `---
name: server-architecture
description: C++ game server architecture overview
type: project
---

## Architecture

_Update this with your project's actual architecture._

| Module | Role |
|--------|------|
| network/ | Connection management, packet I/O |
| game/ | Game logic, session management |
| ecs/ | Entity-Component-System (if applicable) |
| db/ | Database access layer |
| proto/ | Protocol definitions and handlers |

## Build
- CMake-based build system
- Debug: -O0 -g -fsanitize=address
- Release: -O2 -DNDEBUG
`

export const CPP_HOOK_VERIFY = `#!/bin/bash
# Leveled verification for C++ server.
LEVEL=\${1:-quick}
case "$LEVEL" in
  quick)
    if command -v cppcheck &>/dev/null; then
      cppcheck --enable=all --quiet --error-exitcode=1 src/ 2>&1 || exit 1
    fi
    ;;
  build)
    if [ -f CMakeLists.txt ]; then
      cmake -B build -G Ninja 2>&1 || exit 1
      cmake --build build 2>&1 || exit 1
    elif [ -f Makefile ]; then
      make build 2>&1 || exit 1
    fi
    ;;
  full)
    if [ -f CMakeLists.txt ]; then
      cmake -B build -G Ninja 2>&1 || exit 1
      cmake --build build 2>&1 || exit 1
      cd build && ctest --output-on-failure 2>&1 || exit 1
    elif [ -f Makefile ]; then
      make build 2>&1 || exit 1
      make test 2>&1 || exit 1
    fi
    ;;
esac
exit 0
`

export function getCppServerBundle(): Record<string, string> {
  return {
    'rules/constitution.md.tmpl': CPP_RULES_CONSTITUTION,
    'rules/golden-principles.md': CPP_RULES_GOLDEN_PRINCIPLES,
    'rules/cpp-style.md': CPP_RULES_STYLE,
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
    'memory/server-architecture.md': CPP_MEMORY_ARCHITECTURE,
    'hooks/constitution-guard.sh': common.HOOK_CONSTITUTION_GUARD,
    'hooks/verify-server.sh': CPP_HOOK_VERIFY,
    'hooks/pre-commit.sh': common.HOOK_PRE_COMMIT,
    'hooks/post-commit.sh': common.HOOK_POST_COMMIT,
    'hooks/push-gate.sh': common.HOOK_PUSH_GATE,
    'hooks/harness-evolution.sh': common.HOOK_HARNESS_EVOLUTION,
  }
}
