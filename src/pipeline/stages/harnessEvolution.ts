/**
 * Stage 6: Harness Evolution — update rules if errors were fixed
 */

export type HarnessEvolutionResult = {
  rules_updated: string[]
}

export function buildHarnessEvolutionPrompt(): string {
  return `Check the development process for error patterns that should be captured in rules:

1. Were there compilation errors that were fixed?
2. Were there lint violations that were fixed?
3. Were there review issues that were fixed?

For each error pattern found:
- Determine which rule file should be updated (.danya/rules/ or .claude/rules/)
- Add a concise rule with correct-usage example
- If the error can be mechanically detected, add it to the verification checks

If no errors were fixed during development, output "No Harness update needed."

Only update rules for NEW error patterns not already captured.`
}
