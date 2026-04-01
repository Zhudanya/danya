/**
 * Stage 4: Commit — git add + git commit with proper format
 */

export type CommitResult = {
  success: boolean
  commit_hash?: string
  message?: string
}

/**
 * Build the commit prompt for the LLM.
 */
export function buildCommitPrompt(type: string, requirement: string, files?: string[]): string {
  const commitType = type === 'bug' ? 'fix' : type === 'refactor' ? 'refactor' : 'feat'
  return `Commit the changes with the following format:

Commit message format: <${commitType}>(scope) one-line description

Where:
- Type: ${commitType} (based on requirement type: ${type})
- Scope: the primary module or directory affected
- Description: concise summary of what was done

Requirement was: "${requirement}"
${files ? `Files changed: ${files.join(', ')}` : ''}

Steps:
1. git add the relevant files (NOT git add -A)
2. git commit with the formatted message

Do NOT push.`
}
