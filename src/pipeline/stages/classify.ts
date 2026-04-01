/**
 * Stage 0: Classify requirement as bug/feature/refactor
 */

export type ClassifyResult = {
  type: 'bug' | 'feature' | 'refactor'
}

const BUG_KEYWORDS = ['fix', 'bug', 'broken', 'crash', 'error', 'fail', 'issue', 'wrong', 'incorrect', '修复', '修', 'bug', '崩溃', '错误']
const REFACTOR_KEYWORDS = ['refactor', 'rename', 'reorganize', 'clean', 'restructure', '重构', '重命名', '清理']

/**
 * Classify a requirement text into bug/feature/refactor.
 * Uses keyword matching as a fast fallback. The LLM can override this.
 */
export function classifyRequirement(requirement: string): ClassifyResult {
  const lower = requirement.toLowerCase()

  for (const kw of BUG_KEYWORDS) {
    if (lower.includes(kw)) return { type: 'bug' }
  }
  for (const kw of REFACTOR_KEYWORDS) {
    if (lower.includes(kw)) return { type: 'refactor' }
  }

  return { type: 'feature' }
}
