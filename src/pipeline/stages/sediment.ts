/**
 * Stage 5: Sediment — write knowledge to Docs/
 */

export type SedimentResult = {
  doc_path?: string
}

export function buildSedimentPrompt(type: string, requirement: string, reviewScore?: number): string {
  return `Use the KnowledgeSediment tool to document this work:

Type: ${type}
Requirement: "${requirement}"
${reviewScore !== undefined ? `Review score: ${reviewScore}/100` : ''}

Write a concise summary of:
- What was done and why
- Key technical decisions
- Files changed
- Lessons learned (if any errors were fixed during development)

The tool will write to the appropriate Docs/ directory automatically.`
}
