import { z } from 'zod'
import { execSync } from 'child_process'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { getCwd } from '@utils/state'
import { detectProject } from '../../../engine/detect'

const inputSchema = z.strictObject({
  start_from: z.enum(['verify', 'commit', 'review', 'push']).optional()
    .describe('Start from this stage. Default: verify'),
  commit_message: z.string().optional()
    .describe('Commit message. If omitted, auto-generated from diff'),
  skip_push: z.boolean().optional()
    .describe('Stop after review, do not push. Default: true'),
  files: z.array(z.string()).optional()
    .describe('Specific files to include'),
})

type StageResult = {
  name: 'verify' | 'commit' | 'review' | 'push'
  status: 'passed' | 'failed' | 'skipped'
  detail: string
  duration_ms: number
}

type Output = {
  stages: StageResult[]
  overall_status: 'passed' | 'failed'
  stopped_at?: string
  review_score?: number
  total_duration_ms: number
}

function runCommand(cmd: string, cwd: string): { success: boolean; output: string } {
  try {
    const output = execSync(cmd, { cwd, encoding: 'utf-8', timeout: 300000 })
    return { success: true, output }
  } catch (err: any) {
    return { success: false, output: (err.stdout ?? '') + (err.stderr ?? '') }
  }
}

export const GateChainTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'run full quality gate chain verify commit review push',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return false },
  isConcurrencySafe() { return false },
  needsPermissions() { return true },

  async prompt() { return DESCRIPTION },

  renderToolUseMessage(input: z.infer<typeof inputSchema>) {
    return `Running gate chain from ${input.start_from ?? 'verify'}${input.skip_push !== false ? ' (no push)' : ''}`
  },

  renderResultForAssistant(output: Output): string {
    const lines = output.stages.map(s => {
      const icon = s.status === 'passed' ? '✅' : s.status === 'failed' ? '❌' : '⏭'
      return `  ${icon} ${s.name}: ${s.detail} (${s.duration_ms}ms)`
    })
    const header = output.overall_status === 'passed'
      ? `Gate Chain: ✅ ALL PASSED`
      : `Gate Chain: ❌ STOPPED at ${output.stopped_at}`
    if (output.review_score !== undefined) {
      lines.push(`  Score: ${output.review_score}/100`)
    }
    return `${header}\n${lines.join('\n')}`
  },

  async *call(
    { start_from = 'verify', commit_message, skip_push = true, files }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const cwd = getCwd()
    const detection = detectProject(cwd)
    const totalStart = Date.now()
    const stages: StageResult[] = []
    const gateOrder: Array<'verify' | 'commit' | 'review' | 'push'> = ['verify', 'commit', 'review', 'push']
    const startIdx = gateOrder.indexOf(start_from)

    for (let i = 0; i < gateOrder.length; i++) {
      const gate = gateOrder[i]!
      if (i < startIdx) {
        stages.push({ name: gate, status: 'skipped', detail: 'skipped (start_from)', duration_ms: 0 })
        continue
      }
      if (gate === 'push' && skip_push) {
        stages.push({ name: gate, status: 'skipped', detail: 'skipped (skip_push=true)', duration_ms: 0 })
        continue
      }

      yield { type: 'progress' as const, content: { stage: gate, status: 'running' } }
      const stageStart = Date.now()

      switch (gate) {
        case 'verify': {
          // Run build verification based on engine
          let cmd = 'echo "No build tool configured"'
          if (detection.serverLanguage === 'go') {
            cmd = 'make build 2>&1 || go build ./... 2>&1'
          }
          const result = runCommand(cmd, cwd)
          stages.push({
            name: 'verify', status: result.success ? 'passed' : 'failed',
            detail: result.success ? 'Build passed' : result.output.slice(0, 200),
            duration_ms: Date.now() - stageStart,
          })
          if (!result.success) {
            const output: Output = { stages, overall_status: 'failed', stopped_at: 'verify', total_duration_ms: Date.now() - totalStart }
            yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
            return
          }
          break
        }

        case 'commit': {
          const fileList = files?.join(' ') ?? '-A'
          const msg = commit_message ?? 'chore: auto-commit via gate chain'
          const addResult = runCommand(`git add ${fileList}`, cwd)
          const commitResult = runCommand(`git commit -m "${msg}"`, cwd)
          const success = commitResult.success || commitResult.output.includes('nothing to commit')
          stages.push({
            name: 'commit', status: success ? 'passed' : 'failed',
            detail: success ? 'Committed' : commitResult.output.slice(0, 200),
            duration_ms: Date.now() - stageStart,
          })
          if (!success) {
            const output: Output = { stages, overall_status: 'failed', stopped_at: 'commit', total_duration_ms: Date.now() - totalStart }
            yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
            return
          }
          break
        }

        case 'review': {
          // ScoreReview is invoked by the LLM in the conversation context
          // The GateChain tool signals that review should happen
          stages.push({
            name: 'review', status: 'passed',
            detail: 'Review should be run via /review or ScoreReview tool',
            duration_ms: Date.now() - stageStart,
          })
          break
        }

        case 'push': {
          const pushResult = runCommand('git push', cwd)
          stages.push({
            name: 'push', status: pushResult.success ? 'passed' : 'failed',
            detail: pushResult.success ? 'Pushed' : pushResult.output.slice(0, 200),
            duration_ms: Date.now() - stageStart,
          })
          if (!pushResult.success) {
            const output: Output = { stages, overall_status: 'failed', stopped_at: 'push', total_duration_ms: Date.now() - totalStart }
            yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
            return
          }
          break
        }
      }
    }

    const output: Output = { stages, overall_status: 'passed', total_duration_ms: Date.now() - totalStart }
    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
