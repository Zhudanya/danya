/**
 * /fix-harness — Update harness rules after discovering an error pattern.
 */

import type { Command } from '@commands'

const fixHarnessCommand: Command = {
  name: 'fix-harness',
  description: 'Update harness rules after an error pattern is found',
  isEnabled: true,
  isHidden: false,
  type: 'prompt',
  progressMessage: 'Analyzing error and updating harness rules...',
  argumentHint: '[error-description]',
  userFacingName() {
    return 'fix-harness'
  },
  async getPromptForCommand(args: string) {
    return [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: buildFixHarnessPrompt(args),
          },
        ],
      },
    ]
  },
}

function buildFixHarnessPrompt(errorDescription: string): string {
  return `You are performing harness self-evolution. An error pattern was discovered during development.

Error description: ${errorDescription || '(Analyze recent errors in this session)'}

## Process

1. **Identify the error pattern**: What went wrong? What type of error is it?

2. **Route to correct rule file**:
   - Forbidden zone violation → .danya/rules/constitution.md
   - Coding principle violation → .danya/rules/golden-principles.md
   - Known pitfall re-occurrence → .danya/rules/known-pitfalls.md
   - Architecture boundary violation → .danya/rules/architecture-boundaries.md
   - Style issue → engine-specific style rule file

3. **Add a concise rule**:
   - ❌ What went wrong (with example)
   - ✅ Correct approach (with example)

4. **Check constraints**:
   - Is this error pattern already captured in rules? If yes, skip.
   - Total rule file lines must stay under 550. If exceeded, consolidate.
   - If mechanically checkable, note it for /verify checks.

5. **Write the update**: Edit the appropriate rule file.

6. **Report**: State which file was updated and what rule was added.

## Important
- Only add NEW patterns not already captured
- Keep rules minimal: one error = one rule
- Include correct-usage example, not just prohibition
- Do NOT modify code files — only update .danya/rules/`
}

export default fixHarnessCommand
