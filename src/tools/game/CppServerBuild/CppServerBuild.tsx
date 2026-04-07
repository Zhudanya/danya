import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { parseCppBuildOutput, parseCppCheckOutput, parseCTestOutput } from './parser'
import type { BuildStageResult } from '../types'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Path to C++ server project root'),
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

function runStage(stageName: string, projectPath: string): BuildStageResult {
  const start = Date.now()
  let cmd: string
  const hasMakefile = existsSync(join(projectPath, 'Makefile'))
  const hasBuildDir = existsSync(join(projectPath, 'build'))

  switch (stageName) {
    case 'lint':
      if (hasMakefile) {
        cmd = 'make lint 2>&1'
      } else {
        // Try clang-tidy first, fall back to cppcheck
        cmd = 'cppcheck --enable=all --quiet --template="[{file}:{line}]: ({severity}) {message}" src/ 2>&1'
      }
      break
    case 'build':
      if (hasMakefile) {
        cmd = 'make build 2>&1'
      } else {
        // CMake configure + build
        cmd = hasBuildDir
          ? 'cmake --build build 2>&1'
          : 'cmake -B build -G Ninja 2>&1 && cmake --build build 2>&1'
      }
      break
    case 'test':
      if (hasMakefile) {
        cmd = 'make test 2>&1'
      } else {
        cmd = 'cd build && ctest --output-on-failure 2>&1'
      }
      break
    default:
      return { name: stageName, success: false, errors: [{ file_path: '', line: 0, message: `Unknown stage: ${stageName}`, severity: 'error' }], duration_ms: 0 }
  }

  try {
    const output = execSync(cmd, { cwd: projectPath, encoding: 'utf-8', timeout: 600000 })
    const errors = stageName === 'lint' ? parseCppCheckOutput(output) : []
    return { name: stageName, success: true, errors, duration_ms: Date.now() - start }
  } catch (err: any) {
    const output = (err.stdout ?? '') + (err.stderr ?? '')
    let errors = stageName === 'lint'
      ? parseCppCheckOutput(output)
      : stageName === 'test'
        ? parseCTestOutput(output)
        : parseCppBuildOutput(output)

    if (errors.length === 0) {
      errors = [{ file_path: '', line: 0, message: output.slice(0, 500), severity: 'error' as const }]
    }
    return { name: stageName, success: false, errors, duration_ms: Date.now() - start }
  }
}

export const CppServerBuildTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'build C++ game server and report errors',
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
    if (!existsSync(join(project_path, 'CMakeLists.txt')) && !existsSync(join(project_path, 'Makefile'))) {
      return { result: false, message: 'Not a C++ project (no CMakeLists.txt or Makefile)' }
    }
    return { result: true }
  },

  renderToolUseMessage({ project_path, level }: z.infer<typeof inputSchema>) {
    return `Building C++ server (${level ?? 'build'}): ${project_path}`
  },

  renderResultForAssistant(output: Output): string {
    const stageLines = output.stages.map(s => {
      const status = s.success ? '✅' : '❌'
      const errorSummary = s.errors.length > 0
        ? `\n${s.errors.slice(0, 5).map(e => `    ${e.file_path}:${e.line}: ${e.message}`).join('\n')}`
        : ''
      return `  ${status} ${s.name} (${s.duration_ms}ms)${errorSummary}`
    }).join('\n')
    return `CppServerBuild [${output.level}] ${output.success ? 'PASSED' : 'FAILED'} (${output.total_duration_ms}ms)\n${stageLines}`
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
