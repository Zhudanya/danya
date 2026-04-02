/**
 * Workspace bundle — cross-project rules, commands, memory
 * Used when danya detects a multi-project workspace (client + server)
 */

import * as common from './common'

export const WORKSPACE_MEMORY_CROSS_PROJECT = `---
name: cross-project-protocol
description: Cross-project protocol and data sync rules
type: project
---

## Cross-Project Sync Points

_Update as you discover sync boundaries between sub-projects._

### Protobuf
- Proto definitions are shared between client and server
- Edit .proto → regenerate both sides
- Check field number compatibility when adding fields

### Config Tables
- Config data flows: Data Source → Generator → Client code + Server code
- Both sides must regenerate when schema changes

### Version Compatibility
- Client and server versions must match on protocol level
- Breaking changes require coordinated release
`

export const WORKSPACE_MEMORY_PITFALLS = `---
name: cross-project-pitfalls
description: Common mistakes when working across sub-projects
type: project
---

## Cross-Project Pitfalls

_This file grows through harness self-evolution._

### Proto Field Number Conflicts
- ❌ Reusing deleted field numbers
- ✅ Reserve deleted field numbers, always use new ones

### Config Schema Drift
- ❌ Changing config format on one side only
- ✅ Update generator, regenerate both client and server
`

export function getWorkspaceBundle(): Record<string, string> {
  return {
    'commands/fix-harness.md': common.CMD_FIX_HARNESS,
    'commands/plan.md': common.CMD_PLAN,
    'memory/MEMORY.md': common.MEMORY_INDEX,
    'memory/cross-project-protocol.md': WORKSPACE_MEMORY_CROSS_PROJECT,
    'memory/cross-project-pitfalls.md': WORKSPACE_MEMORY_PITFALLS,
  }
}
