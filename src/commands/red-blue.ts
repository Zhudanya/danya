/**
 * /red-blue — Adversarial testing: red team finds bugs, blue team fixes, loop until clean.
 */

import type { Command } from '@commands'

const redBlueCommand: Command = {
  name: 'red-blue',
  description: 'Adversarial red-blue testing loop (find bugs → fix → repeat)',
  isEnabled: true,
  isHidden: false,
  type: 'prompt',
  progressMessage: 'Starting red-blue adversarial loop...',
  argumentHint: '[scope-path]',
  userFacingName() { return 'red-blue' },
  async getPromptForCommand(args: string) {
    return [{
      role: 'user' as const,
      content: [{ type: 'text' as const, text: `Run the red-blue adversarial testing loop:

\`\`\`bash
bash .danya/scripts/red-blue-loop.sh ${args || '.'}
\`\`\`

This will:
1. **Red Team** (read-only): Analyze code, find all bugs (edge cases, error paths, concurrency, security)
2. **Blue Team** (write): Fix CRITICAL → HIGH → MEDIUM bugs with minimal changes
3. **Build check**: Verify fixes compile
4. **Loop**: Repeat until red team finds 0 bugs (max 5 rounds)
5. **Skill Extract**: Analyze all logs, extract patterns to .danya/rules/ and .danya/memory/

Agent role specs are in .danya/agents/ (red-team.md, blue-team.md, skill-extractor.md).` }],
    }]
  },
} satisfies Command

export default redBlueCommand
