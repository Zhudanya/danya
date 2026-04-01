import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join, basename } from 'path'
import { glob } from 'glob'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { parseUnrealBuildOutput } from './parser'
import type { BuildError } from '../types'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Absolute path to the Unreal Engine project root (contains .uproject file)'),
  platform: z.enum(['Win64', 'Linux', 'Mac']).optional()
    .describe('Target platform. Defaults to Win64'),
  configuration: z.enum(['Development', 'DebugGame', 'Shipping']).optional()
    .describe('Build configuration. Defaults to Development'),
})

type Output = {
  success: boolean
  errors: BuildError[]
  error_count: number
  warning_count: number
  duration_ms: number
}

function findUProject(projectPath: string): string | null {
  const results = glob.sync('*.uproject', { cwd: projectPath })
  return results.length > 0 ? join(projectPath, results[0]!) : null
}

function findUBT(): string | null {
  // Common UBT locations
  const candidates = [
    // Environment variable
    process.env.UE_ROOT ? join(process.env.UE_ROOT, 'Engine', 'Build', 'BatchFiles', 'Build.bat') : null,
    process.env.UE_ROOT ? join(process.env.UE_ROOT, 'Engine', 'Build', 'BatchFiles', 'RunUBT.bat') : null,
    // Common Windows install paths
    'C:/Program Files/Epic Games/UE_5.4/Engine/Build/BatchFiles/Build.bat',
    'C:/Program Files/Epic Games/UE_5.3/Engine/Build/BatchFiles/Build.bat',
  ].filter(Boolean) as string[]

  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  return null
}

export const UnrealBuildTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'compile Unreal Engine C++ project UBT',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return true },
  isConcurrencySafe() { return false },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  async validateInput({ project_path }: z.infer<typeof inputSchema>) {
    if (!existsSync(project_path)) {
      return { result: false, message: `Project path not found: ${project_path}` }
    }
    const uproject = findUProject(project_path)
    if (!uproject) {
      return { result: false, message: `Not an Unreal project: no .uproject file found` }
    }
    return { result: true }
  },

  renderToolUseMessage({ project_path, platform, configuration }: z.infer<typeof inputSchema>) {
    const plat = platform ?? 'Win64'
    const config = configuration ?? 'Development'
    return `Building Unreal project: ${project_path} (${plat} ${config})`
  },

  renderResultForAssistant(output: Output): string {
    if (output.success) {
      return `Unreal build passed (${output.duration_ms}ms)`
    }
    const errorLines = output.errors
      .filter(e => e.severity === 'error')
      .slice(0, 20)
      .map(e => `  ${e.file_path}:${e.line}${e.column ? ':' + e.column : ''}: ${e.code ?? ''} ${e.message}`)
      .join('\n')
    return `Unreal build FAILED: ${output.error_count} errors, ${output.warning_count} warnings\n${errorLines}`
  },

  async *call(
    { project_path, platform, configuration }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    let errors: BuildError[] = []
    const plat = platform ?? 'Win64'
    const config = configuration ?? 'Development'

    const uproject = findUProject(project_path)
    if (!uproject) {
      const output: Output = {
        success: false,
        errors: [{ file_path: project_path, line: 0, severity: 'error', message: 'No .uproject file found' }],
        error_count: 1,
        warning_count: 0,
        duration_ms: Date.now() - start,
      }
      yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
      return
    }

    const projectName = basename(uproject, '.uproject')
    const ubt = findUBT()

    try {
      if (ubt) {
        const cmd = `"${ubt}" ${projectName}Editor ${plat} ${config} -project="${uproject}" -NoHotReloadFromIDE 2>&1`
        const raw = execSync(cmd, {
          encoding: 'utf-8',
          timeout: 600000, // 10 min timeout for large projects
          cwd: project_path,
        })
        errors = parseUnrealBuildOutput(raw)
      } else {
        // Fallback: try MSBuild on the .sln if it exists
        const slnFiles = glob.sync('*.sln', { cwd: project_path })
        if (slnFiles.length > 0) {
          const raw = execSync(
            `dotnet build "${join(project_path, slnFiles[0]!)}" --nologo -v q 2>&1`,
            { encoding: 'utf-8', timeout: 120000, cwd: project_path },
          )
          errors = parseUnrealBuildOutput(raw)
        } else {
          errors.push({
            file_path: project_path,
            line: 0,
            severity: 'error',
            message: 'Unreal Build Tool (UBT) not found. Set UE_ROOT environment variable or ensure Unreal Engine is installed.',
            code: 'DANYA_UE001',
          })
        }
      }
    } catch (err: any) {
      const raw = err.stdout || err.stderr || ''
      errors = parseUnrealBuildOutput(raw)
      if (errors.length === 0) {
        errors.push({
          file_path: project_path,
          line: 0,
          severity: 'error',
          message: `Build process failed: ${err.message ?? 'unknown error'}`,
          code: 'DANYA_UE002',
        })
      }
    }

    const output: Output = {
      success: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      error_count: errors.filter(e => e.severity === 'error').length,
      warning_count: errors.filter(e => e.severity === 'warning').length,
      duration_ms: Date.now() - start,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
