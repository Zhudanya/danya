/**
 * /parallel-execute Pipeline
 * Splits work into atomic tasks, executes in wave order using git worktrees.
 */

import { computeWaves, formatWaveSchedule, type Task } from './waveCompute'

export function buildParallelExecutePrompt(
  requirement: string,
  mode: 'prepare' | 'execute',
  tasksDir?: string,
): string {
  if (mode === 'prepare') {
    return `Decompose this requirement into atomic parallel tasks:

Requirement: "${requirement}"

## Steps

### Step 1: Analyze & Decompose
- Identify which files/modules need changes
- Group changes that can be done independently
- Create task files with dependency declarations

### Step 2: Create Task Files
For each task, create a task-NN.md file in Docs/Version/current/<feature>/tasks/ with format:

\`\`\`markdown
---
depends: []
files: [path/to/file.go]
verify: "go build ./..."
---

## Task Description
What to modify and why.

## Acceptance Criteria
How to verify this task is complete.
\`\`\`

Dependencies:
- \`depends: []\` — no dependencies, runs in first wave
- \`depends: ["01"]\` — depends on task-01, runs after it completes
- \`depends: ["01", "02"]\` — depends on both, runs after both complete

### Step 3: Show Wave Schedule
After creating tasks, compute the wave schedule and display:
  Wave 1: [01, 02] (parallel)
  Wave 2: [03, 04] (parallel, after wave 1)
  Wave 3: [05] (after wave 2)

Wait for user confirmation before executing.

### Step 4: Execute
For each wave:
1. Create git worktree per task: \`git worktree add .worktrees/task-NN -b auto/task-NN\`
2. Execute task in worktree
3. Verify: run the task's verify command
4. If pass: merge to main branch
5. If fail: delete worktree (rollback)
6. Wait for all tasks in wave to complete before next wave

After all waves: run full project verification.
`
  }

  // Execute mode
  return `Execute the parallel task files in: ${tasksDir}

Read all task-NN.md files from the directory.
Parse their frontmatter for depends/files/verify fields.
Compute wave schedule (topological sort).
Display the schedule and ask for confirmation.
Then execute wave by wave.`
}
