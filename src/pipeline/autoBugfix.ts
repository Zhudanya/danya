/**
 * /auto-bugfix Pipeline
 * Bug-specialized: reproduce-first methodology with 5-round iteration loop.
 */

import { buildReviewPrompt } from './stages/review'
import { buildCommitPrompt } from './stages/commit'
import { buildSedimentPrompt } from './stages/sediment'
import { buildHarnessEvolutionPrompt } from './stages/harnessEvolution'
import type { PipelineConfig } from './types'
import { DEFAULT_PIPELINE_CONFIG } from './types'

export function buildAutoGugfixPrompt(
  bugDescription: string,
  config: PipelineConfig = { ...DEFAULT_PIPELINE_CONFIG, max_code_rounds: 5 },
): string {
  return `Execute the /auto-bugfix pipeline for the following bug:

Bug: "${bugDescription}"

## Pipeline Stages — Execute ALL in order.

### Stage 1: Reproduce & Locate
- Analyze the bug description
- Search the codebase for related code (use sub-agents for exploration)
- If server bug: check logs, trace the error path
- Identify the root cause: file:line + explanation
- If NOT reproducible → STOP immediately. Do NOT guess-fix.

### Stage 2: Fix (max ${config.max_code_rounds} rounds)
For each round:
1. Write the minimal fix based on root cause
2. Verify it compiles (go build / CSharpSyntaxCheck)
3. If compile fails: fix immediately (doesn't count as a round)
4. Run full verification
5. If pass → proceed to review
6. If fail → analyze why, next round

### Stage 3: Review
${buildReviewPrompt(1)}

### Stage 4: Commit
${buildCommitPrompt('bug', bugDescription)}

### Stage 5: Experience Solidification
${buildSedimentPrompt('bugfix', bugDescription)}

Additionally:
- Classify the bug root cause (logic error, concurrency, null deref, state management, etc.)
- Write to Docs/Bugs/ with: description, reproduction steps, root cause, fix, lessons

### Stage 6: Harness Evolution
${buildHarnessEvolutionPrompt()}

## Key Rules
- **Reproduce first**: No reproduction → No fix. Do NOT guess.
- **5 rounds max**: More iterations than auto-work because bugs are harder.
- **One fix at a time**: Each round focuses on one issue.
- **No push**: User decides when to push.
`
}
