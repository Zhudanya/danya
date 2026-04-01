/**
 * Stage 2: Code — implement changes with fail-fast verification
 */

export type CodeResult = {
  success: boolean
  rounds: number
  errors?: string[]
}

/**
 * Build the coding prompt for the LLM.
 */
export function buildCodePrompt(requirement: string, plan: string, round: number, previousErrors?: string[]): string {
  let prompt = `Implement the following requirement:

Requirement: "${requirement}"

Plan:
${plan}

Instructions:
- Modify each file according to the plan
- After each file, verify it compiles
- If compilation fails, fix immediately before moving to the next file
- Follow all project coding conventions (check AGENTS.md and .danya/rules/)
`

  if (round > 1 && previousErrors?.length) {
    prompt += `\n\nThis is round ${round}. Previous errors to fix:\n${previousErrors.join('\n')}`
  }

  return prompt
}
