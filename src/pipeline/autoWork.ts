/**
 * /auto-work Pipeline Orchestrator
 *
 * Full-auto development pipeline:
 * Classify → Plan → Code → Verify → Review → Commit → Sediment → Harness Evolution
 */

import { classifyRequirement } from './stages/classify'
import { buildPlanPrompt } from './stages/plan'
import { buildCodePrompt } from './stages/code'
import { buildReviewPrompt, checkReviewRatchet } from './stages/review'
import { buildCommitPrompt } from './stages/commit'
import { buildSedimentPrompt } from './stages/sediment'
import { buildHarnessEvolutionPrompt } from './stages/harnessEvolution'
import {
  type PipelineResult,
  type PipelineStage,
  type PipelineConfig,
  DEFAULT_PIPELINE_CONFIG,
  formatPipelineReport,
} from './types'

export { formatPipelineReport }

/**
 * Build the full /auto-work prompt for the LLM.
 * This is a single comprehensive prompt that instructs the agent
 * to execute all pipeline stages in sequence.
 */
export function buildAutoWorkPrompt(
  requirement: string,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG,
): string {
  const classification = classifyRequirement(requirement)
  const type = classification.type

  return `Execute the /auto-work pipeline for the following requirement:

Requirement: "${requirement}"
Auto-classified as: ${type}

## Pipeline Stages — Execute ALL in order. Do NOT skip any stage.

### Stage 0: Classify
Type: ${type}
(Already classified. Proceed to planning.)

### Stage 1: Plan
${buildPlanPrompt(requirement, type)}

### Stage 2: Code
${buildCodePrompt(requirement, '(use the plan from Stage 1)', 1)}

After coding, verify the changes compile:
- Go projects: run \`go build ./...\` or \`make build\`
- Unity projects: run CSharpSyntaxCheck on modified .cs files
- If verification fails: fix and retry (max ${config.max_code_rounds} rounds)

### Stage 3: Review
${buildReviewPrompt(1)}

Quality ratchet: score must not decrease between review rounds.
Max ${config.max_review_rounds} review rounds. If still failing after max rounds, terminate.

### Stage 4: Commit
${buildCommitPrompt(type, requirement)}

### Stage 5: Knowledge Sediment
${config.auto_sediment ? buildSedimentPrompt(type, requirement) : '(Sediment disabled)'}

### Stage 6: Harness Evolution
${config.auto_harness_evolution ? buildHarnessEvolutionPrompt() : '(Harness evolution disabled)'}

## Important Rules
- **Full chain**: Execute ALL stages from classify to harness evolution
- **Fail-fast**: If compilation fails, fix immediately before next file
- **Quality ratchet**: Review score must not decrease between rounds
- **No push**: Do NOT push. User decides when to push.
- **Report**: After completing all stages, output a completion report summarizing what was done

## Completion Report Format
After all stages complete, output:
- Requirement and type
- Each stage's result (pass/fail, duration)
- Review score
- Commit message
- Documentation path (if sediment was written)
- Rules updated (if any)
`
}

/**
 * Classify a requirement. Exported for use by other modules.
 */
export { classifyRequirement }
