import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { parseUnityLogOutput } from './parser'
import type { BuildError } from '../types'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Absolute path to the Unity project root (contains Assets/ folder)'),
  build_target: z.enum(['editor', 'android', 'ios', 'windows']).optional()
    .describe('Build target platform. Defaults to editor (script compilation only)'),
})

type Output = {
  success: boolean
  errors: BuildError[]
  error_count: number
  warning_count: number
  duration_ms: number
  unity_version?: string
}

function detectUnityVersion(projectPath: string): string | undefined {
  try {
    const versionFile = join(projectPath, 'ProjectSettings', 'ProjectVersion.txt')
    if (existsSync(versionFile)) {
      const { readFileSync } = require('fs')
      const content = readFileSync(versionFile, 'utf-8')
      const match = content.match(/m_EditorVersion:\s*(.+)/)
      return match?.[1]?.trim()
    }
  } catch {}
  return undefined
}

function findCsproj(projectPath: string): string | null {
  const patterns = [
    'Assembly-CSharp.csproj',
    '*.csproj',
  ]
  for (const pattern of patterns) {
    const results = glob.sync(pattern, { cwd: projectPath })
    if (results.length > 0) return join(projectPath, results[0]!)
  }
  return null
}

export const UnityBuildTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'compile Unity project scripts batch mode',
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
    if (!existsSync(join(project_path, 'Assets'))) {
      return { result: false, message: `Not a Unity project: missing Assets/ folder` }
    }
    return { result: true }
  },

  renderToolUseMessage({ project_path, build_target }: z.infer<typeof inputSchema>) {
    return `Building Unity project: ${project_path}${build_target ? ` (${build_target})` : ''}`
  },

  renderResultForAssistant(output: Output): string {
    if (output.success) {
      return `Unity build passed (${output.duration_ms}ms)${output.unity_version ? ` [Unity ${output.unity_version}]` : ''}`
    }
    const errorLines = output.errors
      .filter(e => e.severity === 'error')
      .map(e => `  ${e.file_path}(${e.line},${e.column ?? 0}): ${e.code ?? ''} ${e.message}`)
      .join('\n')
    return `Unity build FAILED: ${output.error_count} errors, ${output.warning_count} warnings\n${errorLines}`
  },

  async *call(
    { project_path, build_target }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    let errors: BuildError[] = []
    const unity_version = detectUnityVersion(project_path)

    try {
      // Strategy 1: Try dotnet build for script-only compilation
      const csproj = findCsproj(project_path)
      if (csproj && existsSync(csproj)) {
        const output = execSync(
          `dotnet build "${csproj}" --no-restore --nologo -v q 2>&1`,
          { encoding: 'utf-8', timeout: 60000, cwd: project_path },
        )
        errors = parseUnityLogOutput(output)
      } else {
        // Strategy 2: Report that Unity editor is needed
        errors.push({
          file_path: project_path,
          line: 0,
          severity: 'warning',
          message: 'No .csproj found. Full Unity editor build is required. Open the project in Unity to generate solution files, or run Unity in batch mode.',
          code: 'DANYA_UNITY001',
        })
      }
    } catch (err: any) {
      // dotnet build returns non-zero on compilation errors — parse output
      const raw = err.stdout || err.stderr || ''
      errors = parseUnityLogOutput(raw)
      if (errors.length === 0) {
        errors.push({
          file_path: project_path,
          line: 0,
          severity: 'error',
          message: `Build process failed: ${err.message ?? 'unknown error'}`,
          code: 'DANYA_UNITY002',
        })
      }
    }

    const output: Output = {
      success: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      error_count: errors.filter(e => e.severity === 'error').length,
      warning_count: errors.filter(e => e.severity === 'warning').length,
      duration_ms: Date.now() - start,
      unity_version,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
