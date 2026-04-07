/**
 * Node.js server bundle — rules, commands, memory for Node.js game servers.
 */

import * as common from './common'

export const NODE_RULES_CONSTITUTION = `# Forbidden Zone Constitution

## Auto-Generated Code (DO NOT edit manually)
- \`{{PROTO_GEN_PATH}}\` — Protobuf generated TypeScript code. Edit .proto → protoc.
- \`{{CONFIG_GEN_PATH}}\` — Config generated from data tables. Edit source → regenerate.

## Build Output
- \`dist/\` or \`build/\` — Compiled output. Never edit.
- \`node_modules/\` — Dependencies. Use package manager.

## Important
When you see these files, tell the user HOW to regenerate instead of editing directly.
`

export const NODE_RULES_GOLDEN_PRINCIPLES = `# Golden Principles — Node.js Server

Non-negotiable coding rules.

## Event Loop
- ❌ Blocking the event loop (sync I/O, CPU-heavy computation, tight loops)
- ❌ JSON.parse on unbounded user input without size limit
- ✅ Worker threads for CPU-intensive tasks
- ✅ async/await for all I/O operations

## Error Handling
- ❌ Unhandled promise rejections
- ❌ Empty catch blocks
- ✅ try/catch around async operations
- ✅ Process-level handlers: uncaughtException, unhandledRejection
- ✅ Never crash on a single player's bad input

## Memory
- ❌ Leaking event listeners (on without off)
- ❌ Unbounded arrays/maps for player data
- ✅ Clean up rooms/sessions on disconnect
- ✅ Set max sizes for collections

## WebSocket
- ❌ Broadcasting full state every tick
- ✅ Delta/patch state synchronization
- ✅ Check connection status before sending
- ✅ Implement reconnect window

## TypeScript
- ❌ any type
- ✅ strict mode enabled
- ✅ Validate all client messages

## Workflow
- Plan first for multi-file changes
- Use TaskCreate for progress tracking
`

export const NODE_RULES_STYLE = `# Node.js Style Guide

## File Naming
- kebab-case for files: game-room.ts, player-state.ts
- PascalCase for class files when 1:1: GameRoom.ts (acceptable)
- Co-locate tests: game-room.test.ts

## Naming Conventions
- PascalCase: classes, interfaces, type aliases
- camelCase: functions, methods, variables
- UPPER_SNAKE: constants

## Async
- Always use async/await over raw promises
- Never mix callbacks and promises
- Handle errors at the appropriate level

## Modules
- Named exports preferred over default exports
- Barrel files (index.ts) for public API
- Feature-based directory structure
`

export const NODE_MEMORY_ARCHITECTURE = `---
name: server-architecture
description: Node.js game server architecture overview
type: project
---

## Architecture

_Update this with your project's actual architecture._

| Module | Role |
|--------|------|
| rooms/ | Game room definitions and state |
| schemas/ | State schemas (Colyseus @type) |
| handlers/ | Message handlers |
| services/ | Business logic, matchmaking |
| models/ | Data models |

## Runtime
- Node.js or Bun
- TypeScript with strict mode
- Framework: Colyseus / Socket.IO / custom

## Database
- Redis: session state, queues, leaderboards
- MongoDB/PostgreSQL: persistent player data
`

export const NODE_HOOK_VERIFY = `#!/bin/bash
# Leveled verification for Node.js server.
LEVEL=\${1:-quick}

if [ -f bun.lockb ] || [ -f bun.lock ]; then
  RUN="bun run"
  TEST="bun test"
else
  RUN="npx"
  TEST="npx jest --ci"
fi

case "$LEVEL" in
  quick)
    $RUN eslint src/ 2>&1 || true
    ;;
  build)
    $RUN tsc --noEmit 2>&1 || exit 1
    ;;
  full)
    $RUN tsc --noEmit 2>&1 || exit 1
    $TEST 2>&1 || exit 1
    ;;
esac
exit 0
`

export function getNodeServerBundle(): Record<string, string> {
  return {
    'rules/constitution.md.tmpl': NODE_RULES_CONSTITUTION,
    'rules/golden-principles.md': NODE_RULES_GOLDEN_PRINCIPLES,
    'rules/nodejs-style.md': NODE_RULES_STYLE,
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
    'memory/server-architecture.md': NODE_MEMORY_ARCHITECTURE,
    'hooks/constitution-guard.sh': common.HOOK_CONSTITUTION_GUARD,
    'hooks/verify-server.sh': NODE_HOOK_VERIFY,
    'hooks/pre-commit.sh': common.HOOK_PRE_COMMIT,
    'hooks/post-commit.sh': common.HOOK_POST_COMMIT,
    'hooks/push-gate.sh': common.HOOK_PUSH_GATE,
    'hooks/harness-evolution.sh': common.HOOK_HARNESS_EVOLUTION,
  }
}
