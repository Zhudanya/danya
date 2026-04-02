/**
 * /orchestrate — Auto-research iteration: AI codes → verify → commit/revert × N rounds.
 */

import type { Command } from '@commands'

const orchestrateCommand: Command = {
  name: 'orchestrate',
  description: 'Auto-research iteration loop (AI codes → verify → commit/revert)',
  isEnabled: true,
  isHidden: false,
  type: 'prompt',
  progressMessage: 'Starting auto-research iteration...',
  argumentHint: '<task-file.md> [-n iterations]',
  userFacingName() { return 'orchestrate' },
  async getPromptForCommand(args: string) {
    return [{
      role: 'user' as const,
      content: [{ type: 'text' as const, text: `Run the orchestrator script for autonomous iteration:

\`\`\`bash
bash .danya/scripts/orchestrator.sh ${args || '.danya/templates/program-template.md'}
\`\`\`

This will:
1. Read the task definition
2. Loop N iterations: AI codes → quantitative verification → commit if score ≥ baseline, revert if not
3. Circuit break after 5 consecutive failures
4. Report final baseline score

If the task file doesn't exist, help the user create one using .danya/templates/program-template.md as reference.` }],
    }]
  },
} satisfies Command

export default orchestrateCommand
