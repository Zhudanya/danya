import type { ReviewIssue, ReviewScore } from './scoringEngine'

export type ReviewReport = {
  score: ReviewScore
  issues: ReviewIssue[]
  change_summary: {
    files_changed: number
    lines_added: number
    lines_removed: number
    modules: string[]
  }
  base_ref: string
  push_approved: boolean
}

export function formatHumanReport(report: ReviewReport): string {
  const status = report.score.passed ? 'PASS' : 'FAIL'
  const lines: string[] = []

  lines.push('══════════════════════════════════════════════')
  lines.push(`  CODE REVIEW: ${status}  Score: ${report.score.score}/100`)
  lines.push('══════════════════════════════════════════════')
  lines.push(`  Branch: ... → ${report.base_ref}`)
  lines.push(`  Changed: ${report.change_summary.files_changed} files, +${report.change_summary.lines_added}/-${report.change_summary.lines_removed} lines`)
  if (report.change_summary.modules.length > 0) {
    lines.push(`  Modules: ${report.change_summary.modules.join(', ')}`)
  }
  lines.push('══════════════════════════════════════════════')

  // Group by category
  const byCategory = new Map<string, ReviewIssue[]>()
  for (const issue of report.issues) {
    const list = byCategory.get(issue.category) ?? []
    list.push(issue)
    byCategory.set(issue.category, list)
  }

  for (const [category, issues] of byCategory) {
    lines.push('')
    lines.push(`─── ${capitalize(category)} (${issues.length} issue${issues.length !== 1 ? 's' : ''}) ───`)
    for (const issue of issues) {
      const loc = issue.line ? `${issue.file_path}:${issue.line}` : issue.file_path
      lines.push(`  [${issue.severity}] ${issue.id}  ${loc}`)
      lines.push(`         ${issue.message}`)
      if (issue.suggestion) {
        lines.push(`         Fix: ${issue.suggestion}`)
      }
    }
  }

  if (report.issues.length === 0) {
    lines.push('')
    lines.push('  ✅ No issues found')
  }

  lines.push('')
  lines.push('─── Scoring ───')
  lines.push(`  CRITICAL: ${report.score.critical_count}  (×-30 = -${report.score.critical_count * 30})`)
  lines.push(`  HIGH:     ${report.score.high_count}  (×-10 = -${report.score.high_count * 10})`)
  lines.push(`  MEDIUM:   ${report.score.medium_count}  (×-3  = -${report.score.medium_count * 3})`)
  lines.push(`  Deduction: -${report.score.total_deduction}`)
  lines.push(`  ────────────────`)
  lines.push(`  Score: ${report.score.score}/100`)

  lines.push('')
  lines.push('─── Verdict ───')
  if (report.score.passed) {
    lines.push(`  ✅ PASS (${report.score.score}/100) — push-approved ${report.push_approved ? 'created' : 'not created'}`)
  } else {
    if (report.score.critical_count > 0) {
      lines.push(`  ❌ FAIL (${report.score.score}/100) — ${report.score.critical_count} CRITICAL issue(s) (auto-fail)`)
    } else {
      lines.push(`  ❌ FAIL (${report.score.score}/100) — below threshold (80)`)
    }
  }
  lines.push('══════════════════════════════════════════════')

  return lines.join('\n')
}

export function formatJsonReport(report: ReviewReport): string {
  return JSON.stringify(report, null, 2)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
