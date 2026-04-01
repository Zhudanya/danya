/**
 * 100-point scoring engine. Hardcoded, non-configurable.
 */

export type ReviewIssue = {
  id: string
  phase: 'mechanical' | 'ai_judgment'
  category: 'architecture' | 'convention' | 'logic' | 'security' | 'performance'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  file_path: string
  line?: number
  message: string
  suggestion?: string
  deduction: number
}

export type ReviewScore = {
  score: number
  passed: boolean
  critical_count: number
  high_count: number
  medium_count: number
  total_deduction: number
}

const DEDUCTIONS = { CRITICAL: 30, HIGH: 10, MEDIUM: 3 } as const
const PASS_THRESHOLD = 80

export function calculateScore(issues: ReviewIssue[]): ReviewScore {
  let score = 100
  let critical_count = 0
  let high_count = 0
  let medium_count = 0

  for (const issue of issues) {
    const deduction = DEDUCTIONS[issue.severity]
    score -= deduction
    switch (issue.severity) {
      case 'CRITICAL': critical_count++; break
      case 'HIGH': high_count++; break
      case 'MEDIUM': medium_count++; break
    }
  }

  score = Math.max(score, 0)

  return {
    score,
    passed: score >= PASS_THRESHOLD && critical_count === 0,
    critical_count,
    high_count,
    medium_count,
    total_deduction: 100 - score,
  }
}

export function assignDeduction(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'): number {
  return DEDUCTIONS[severity]
}
