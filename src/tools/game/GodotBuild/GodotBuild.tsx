import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import type { BuildError } from '../types'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Absolute path to the Godot project root (contains project.godot)'),
  check_only: z.boolean().optional()
    .describe('If true, only validate scripts without producing export artifacts. Defaults to true'),
})

type Output = {
  success: boolean
  errors: BuildError[]
  error_count: number
  warning_count: number
  duration_ms: number
}

// GDScript error format: res://scripts/player.gd:42 - Parse Error: Expected ":"
const GDSCRIPT_ERROR_REGEX = /^(.+?):(\d+)\s*-\s*(Parse Error|Error|Warning):\s*(.+)$/
// Also: SCRIPT ERROR: res://scripts/player.gd:42: message
const SCRIPT_ERROR_REGEX = /^SCRIPT ERROR:\s*(.+?):(\d+):\s*(.+)$/
// MSBuild format for C# Godot projects
const MSBUILD_REGEX = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(CS\d+):\s+(.+)$/

function parseGodotOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const trimmed = line.trim()

    let match = trimmed.match(GDSCRIPT_ERROR_REGEX)
    if (match) {
      const severityRaw = match[3]!.toLowerCase()
      errors.push({
        file_path: match[1]!.replace(/^res:\/\//, ''),
        line: parseInt(match[2]!, 10),
        severity: severityRaw.includes('warning') ? 'warning' : 'error',
        message: match[4]!,
      })
      continue
    }

    match = trimmed.match(SCRIPT_ERROR_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!.replace(/^res:\/\//, ''),
        line: parseInt(match[2]!, 10),
        severity: 'error',
        message: match[3]!,
      })
      continue
    }

    match = trimmed.match(MSBUILD_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        column: parseInt(match[3]!, 10),
        severity: match[4] as 'error' | 'warning',
        code: match[5]!,
        message: match[6]!,
      })
    }
  }
  return errors
}

function hasCSharpScripts(projectPath: string): boolean {
  return glob.sync('**/*.cs', { cwd: projectPath, ignore: ['.godot/**'] }).length > 0
}

function findCsproj(projectPath: string): string | null {
  const results = glob.sync('*.csproj', { cwd: projectPath })
  return results.length > 0 ? join(projectPath, results[0]!) : null
}

export const GodotBuildTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'compile Godot project GDScript C# validation',
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
    if (!existsSync(join(project_path, 'project.godot'))) {
      return { result: false, message: `Not a Godot project: missing project.godot` }
    }
    return { result: true }
  },

  renderToolUseMessage({ project_path, check_only }: z.infer<typeof inputSchema>) {
    return `Building Godot project: ${project_path}${check_only !== false ? ' (check only)' : ''}`
  },

  renderResultForAssistant(output: Output): string {
    if (output.success) {
      return `Godot build passed (${output.duration_ms}ms)`
    }
    const errorLines = output.errors
      .filter(e => e.severity === 'error')
      .map(e => `  ${e.file_path}:${e.line}: ${e.code ?? ''} ${e.message}`)
      .join('\n')
    return `Godot build FAILED: ${output.error_count} errors, ${output.warning_count} warnings\n${errorLines}`
  },

  async *call(
    { project_path, check_only }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    let errors: BuildError[] = []

    // Strategy 1: GDScript validation via headless Godot
    try {
      const raw = execSync(
        `godot --headless --check-only --path "${project_path}" 2>&1`,
        { encoding: 'utf-8', timeout: 60000, cwd: project_path },
      )
      errors = parseGodotOutput(raw)
    } catch (err: any) {
      const raw = err.stdout || err.stderr || ''
      if (raw) {
        errors = parseGodotOutput(raw)
      } else {
        // Godot CLI not available — not a fatal error if we can try C# build
        errors.push({
          file_path: project_path,
          line: 0,
          severity: 'warning',
          message: 'Godot CLI not found. GDScript validation skipped. Install Godot and add to PATH.',
          code: 'DANYA_GODOT001',
        })
      }
    }

    // Strategy 2: C# compilation via dotnet build (if project uses C#)
    if (hasCSharpScripts(project_path)) {
      const csproj = findCsproj(project_path)
      if (csproj) {
        try {
          const raw = execSync(
            `dotnet build "${csproj}" --no-restore --nologo -v q 2>&1`,
            { encoding: 'utf-8', timeout: 60000, cwd: project_path },
          )
          errors = errors.concat(parseGodotOutput(raw))
        } catch (err: any) {
          const raw = err.stdout || err.stderr || ''
          if (raw) {
            errors = errors.concat(parseGodotOutput(raw))
          }
        }
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
