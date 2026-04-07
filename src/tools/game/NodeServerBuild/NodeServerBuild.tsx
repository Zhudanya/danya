import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { parseTscOutput, parseEslintOutput, parseNodeTestOutput } from './parser'
import type { BuildStageResult } from '../types'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Path to Node.js server project root'),
  level: z.enum(['quick', 'build', 'full']).optional()
    .describe('Verification level. quick=lint, build=lint+compile, full=lint+compile+test. Default: build'),
})

type Output = {
  success: boolean
  level: string
  stages: BuildStageResult[]
  total_duration_ms: number
}

const STAGES_BY_LEVEL = {
  quick: ['lint'],
  build: ['lint', 'build'],
  full: ['lint', 'build', 'test'],
}

function detectPackageManager(projectPath: string): 'bun' | 'npm' {
  if (existsSync(join(projectPath, 'bun.lockb')) || existsSync(join(projectPath, 'bun.lock'))) {
    return 'bun'
  }
  return 'npm'
}

function runStage(stageName: string, projectPath: string): BuildStageResult {
  const start = Date.now()
  const pm = detectPackageManager(projectPath)
  const run = pm === 'bun' ? 'bun run' : 'npx'
  let cmd: string

  switch (stageName) {
    case 'lint':
      cmd = `${run} eslint src/ --format unix 2>&1`
      break
    case 'build':
      // Try tsc for type checking
      cmd = `${run} tsc --noEmit 2>&1`
      break
    case 'test':
      cmd = pm === 'bun'
        ? 'bun test 2>&1'
        : 'npx vitest run 2>&1'
      break
    default:
      return { name: stageName, success: false, errors: [{ file_path: '', line: 0, message: `Unknown stage: ${stageName}`, severity: 'error' }], duration_ms: 0 }
  }

  try {
    const output = execSync(cmd, { cwd: projectPath, encoding: 'utf-8', timeout: 300000 })
    const errors = stageName === 'lint' ? parseEslintOutput(output) : []
    return { name: stageName, success: true, errors, duration_ms: Date.now() - start }
  } catch (err: any) {
    const output = (err.stdout ?? '') + (err.stderr ?? '')
    let errors = stageName === 'lint'
      ? parseEslintOutput(output)
      : stageName === 'test'
        ? parseNodeTestOutput(output)
        : parseTscOutput(output)

    if (errors.length === 0) {
      errors = [{ file_path: '', line: 0, message: output.slice(0, 500), severity: 'error' as const }]
    }
    return { name: stageName, success: false, errors, duration_ms: Date.now() - start }
  }
}

export const NodeServerBuildTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'build Node.js game server and report errors',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return true },
  isConcurrencySafe() { return false },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  async validateInput({ project_path }: z.infer<typeof inputSchema>) {
    if (!existsSync(project_path)) {
      return { result: false, message: `Directory not found: ${project_path}` }
    }
    if (!existsSync(join(project_path, 'package.json'))) {
      return { result: false, message: 'Not a Node.js project (no package.json)' }
    }
    return { result: true }
  },

  renderToolUseMessage({ project_path, level }: z.infer<typeof inputSchema>) {
    return `Building Node.js server (${level ?? 'build'}): ${project_path}`
  },

  renderResultForAssistant(output: Output): string {
    const stageLines = output.stages.map(s => {
      const status = s.success ? '✅' : '❌'
      const errorSummary = s.errors.length > 0
        ? `\n${s.errors.slice(0, 5).map(e => `    ${e.file_path}:${e.line}: ${e.message}`).join('\n')}`
        : ''
      return `  ${status} ${s.name} (${s.duration_ms}ms)${errorSummary}`
    }).join('\n')
    return `NodeServerBuild [${output.level}] ${output.success ? 'PASSED' : 'FAILED'} (${output.total_duration_ms}ms)\n${stageLines}`
  },

  async *call(
    { project_path, level = 'build' }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    const stageNames = STAGES_BY_LEVEL[level]
    const stages: BuildStageResult[] = []
    let success = true

    for (const stageName of stageNames) {
      yield { type: 'progress' as const, content: { stage: stageName, status: 'running' } }
      const result = runStage(stageName, project_path)
      stages.push(result)
      if (!result.success) { success = false; break }
    }

    const output: Output = { success, level, stages, total_duration_ms: Date.now() - start }
    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
