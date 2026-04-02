/**
 * Go server bundle — rules, commands, memory adapted from game-harness-engineering/server
 */

import * as common from './common'

export const GO_RULES_CONSTITUTION = `# Forbidden Zone Constitution

## Auto-Generated Code (DO NOT edit manually)
- \`{{ORM_PATH}}\` — ORM generated from XML. Edit XML → run ORM generator.
- \`{{CONFIG_GEN_PATH}}\` — Config generated from game data. Edit data source → regenerate.
- \`*_service.go\`, \`*_client.go\` — Protobuf RPC wrappers. Edit .proto → protoc.

## Git Submodules (edit in upstream repo)
- \`base/\` — Shared base library. Edit in the base repo, then update submodule.
- \`{{PROTO_PATH}}\` — Proto definitions. Edit in proto repo.

## Important
When you see these files, tell the user HOW to regenerate instead of editing directly.
`

export const GO_RULES_GOLDEN_PRINCIPLES = `# Golden Principles — Go Server

Non-negotiable coding rules.

## Error Handling
- ❌ \`_ = err\` (errcheck enforced)
- ❌ \`fmt.Errorf("...")\` without %w
- ✅ \`fmt.Errorf("context: %w", err)\` — always wrap errors

## RPC Handlers
- ❌ Log error + return error (double reporting)
- ✅ RPC handler: catch error → return RpcError, no log
- ✅ Internal logic: log.Errorf + return err

## Goroutines
- ❌ Bare \`go func() { ... }()\`
- ✅ \`safego.Go(func() { ... })\` — panic recovery built-in

## Atomics
- ❌ \`sync/atomic\`
- ✅ \`go.uber.org/atomic\`

## UUID
- ❌ \`pborman/uuid\`
- ✅ \`google/uuid\`

## Database Operations
- ❌ Direct DB access from game logic
- ✅ All DB operations through db_server RPC

## ECS (if applicable)
- Components: data only, no logic
- Systems: logic only, operate on components
- ❌ Logic in components, data mutation outside systems

## Workflow
- Plan first for multi-file changes
- Use TaskCreate for progress tracking
- Use subagent for 5+ file searches
`

export const GO_RULES_STYLE = `# Go Style Guide

## File Naming
- snake_case for all .go files
- _test.go suffix for tests
- Group by feature, not by type

## Error Handling
- Check errors immediately after function call
- Wrap with context: fmt.Errorf("operation: %w", err)
- Don't ignore errors silently

## Logging
- log.Debugf — development only, verbose
- log.Infof — normal operations
- log.Warnf — recoverable issues
- log.Errorf — errors that need attention
- ❌ fmt.Println, fmt.Printf for logging

## Testing
- Table-driven tests preferred
- go test ./... must pass before commit
`

export const GO_MEMORY_ARCHITECTURE = `---
name: cluster-architecture
description: Go microservices cluster structure
type: project
---

## Service Architecture

_Update this with your project's actual services as you learn them._

| Service | Role |
|---------|------|
| gate_server | Client connection, protocol decode |
| logic_server | Game logic, state management |
| scene_server | Scene/combat, ECS-based |
| db_server | Database operations (all DB access goes here) |

## Startup Order
Services have dependency order. Check project docs or startup scripts.

## RPC Call Chain
Typical request flow: client → gate → logic → scene → db
`

export const GO_HOOK_VERIFY = `#!/bin/bash
# Leveled verification for Go server.
LEVEL=\${1:-quick}
case "$LEVEL" in
  quick)
    go vet ./... 2>&1 || exit 1
    ;;
  build)
    go vet ./... 2>&1 || exit 1
    go build ./... 2>&1 || exit 1
    ;;
  full)
    go vet ./... 2>&1 || exit 1
    go build ./... 2>&1 || exit 1
    go test ./... 2>&1 || exit 1
    ;;
esac
exit 0
`

export function getGoServerBundle(): Record<string, string> {
  return {
    'rules/constitution.md.tmpl': GO_RULES_CONSTITUTION,
    'rules/golden-principles.md': GO_RULES_GOLDEN_PRINCIPLES,
    'rules/go-style.md': GO_RULES_STYLE,
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
    'memory/cluster-architecture.md': GO_MEMORY_ARCHITECTURE,
    'hooks/constitution-guard.sh': common.HOOK_CONSTITUTION_GUARD,
    'hooks/verify-server.sh': GO_HOOK_VERIFY,
    'hooks/pre-commit.sh': common.HOOK_PRE_COMMIT,
    'hooks/post-commit.sh': common.HOOK_POST_COMMIT,
    'hooks/push-gate.sh': common.HOOK_PUSH_GATE,
    'hooks/harness-evolution.sh': common.HOOK_HARNESS_EVOLUTION,
  }
}
