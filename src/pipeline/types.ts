export type PipelineStage = {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  duration_ms: number
  detail?: string
}

export type PipelineResult = {
  requirement: string
  type: 'bug' | 'feature' | 'refactor'
  stages: PipelineStage[]
  review_score?: number
  commit_hash?: string
  status: 'completed' | 'terminated'
  terminated_at?: string
  total_duration_ms: number
}

export type PipelineConfig = {
  max_code_rounds: number
  max_review_rounds: number
  verify_level: string
  auto_sediment: boolean
  auto_harness_evolution: boolean
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  max_code_rounds: 3,
  max_review_rounds: 3,
  verify_level: 'build',
  auto_sediment: true,
  auto_harness_evolution: true,
}

export type StageInput = {
  requirement: string
  type: 'bug' | 'feature' | 'refactor'
  cwd: string
  config: PipelineConfig
  previousStages: PipelineStage[]
}

export function formatPipelineReport(result: PipelineResult): string {
  const lines: string[] = []
  lines.push('══════════════════════════════════════════════')
  lines.push(`  AUTO-WORK ${result.status === 'completed' ? 'COMPLETE' : 'TERMINATED'}`)
  lines.push('══════════════════════════════════════════════')
  lines.push(`  Requirement: "${result.requirement}"`)
  lines.push(`  Type:        ${result.type}`)
  lines.push('')
  lines.push('  Stages:')

  for (const stage of result.stages) {
    const icon = stage.status === 'passed' ? '✅' :
                 stage.status === 'failed' ? '❌' :
                 stage.status === 'skipped' ? '⏭' : '⏳'
    const time = stage.duration_ms > 0 ? ` (${(stage.duration_ms / 1000).toFixed(1)}s)` : ''
    const detail = stage.detail ? ` — ${stage.detail}` : ''
    lines.push(`    ${icon} ${stage.name}${detail}${time}`)
  }

  if (result.review_score !== undefined) {
    lines.push('')
    lines.push(`  Review score: ${result.review_score}/100`)
  }
  if (result.commit_hash) {
    lines.push(`  Commit: ${result.commit_hash}`)
  }
  if (result.terminated_at) {
    lines.push('')
    lines.push(`  ❌ Terminated at: ${result.terminated_at}`)
  }
  if (result.status === 'completed') {
    lines.push('')
    lines.push('  ⚡ Ready to push. Run `git push` when ready.')
  }
  lines.push('══════════════════════════════════════════════')
  return lines.join('\n')
}
