/**
 * Stage 1: Plan — analyze requirement, list files to modify
 */

export type PlanResult = {
  files: Array<{ path: string; intent: string }>
  plan_summary: string
  mode: 'serial' | 'parallel'
}

/**
 * Build the planning prompt for the LLM.
 */
export function buildPlanPrompt(requirement: string, type: string): string {
  return `Analyze this ${type} requirement and create an implementation plan:

Requirement: "${requirement}"

Output a plan with:
1. List each file to modify with a one-line intent
2. If >3 files or cross-module: recommend parallel mode
3. Keep the plan minimal — only files that MUST change

Format your response as:
FILES:
- path/to/file1.go — what to change
- path/to/file2.go — what to change

SUMMARY: One paragraph describing the approach.
MODE: serial (or parallel if >3 independent files)`
}
