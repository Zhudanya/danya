import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { glob } from 'glob'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { parseMSBuildOutput, parseRoslynOutput } from './parser'
import type { BuildError } from '../types'

const inputSchema = z.strictObject({
  file_path: z.string().describe('Absolute path to the .cs file to check'),
  project_path: z.string().optional()
    .describe('Path to .csproj for reference resolution. If omitted, auto-detected from file location'),
})

type Output = {
  file_path: string
  success: boolean
  errors: BuildError[]
  error_count: number
  warning_count: number
  duration_ms: number
}

function findCsproj(filePath: string): string | null {
  let dir = dirname(filePath)
  for (let i = 0; i < 10; i++) {
    const csprojFiles = glob.sync('*.csproj', { cwd: dir })
    if (csprojFiles.length > 0) return join(dir, csprojFiles[0]!)
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export const CSharpSyntaxCheckTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'check C# syntax errors using Roslyn',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return true },
  isConcurrencySafe() { return true },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  async validateInput({ file_path }: z.infer<typeof inputSchema>) {
    if (!existsSync(file_path)) {
      return { result: false, message: `File not found: ${file_path}` }
    }
    if (!file_path.endsWith('.cs')) {
      return { result: false, message: 'Not a C# file' }
    }
    return { result: true }
  },

  renderToolUseMessage({ file_path }: z.infer<typeof inputSchema>) {
    return `Checking C# syntax: ${file_path}`
  },

  renderResultForAssistant(output: Output): string {
    if (output.success) {
      return `C# syntax check passed: ${output.file_path} (${output.duration_ms}ms)`
    }
    const errorLines = output.errors
      .map(e => `  ${e.file_path}:${e.line}:${e.column ?? 0} ${e.severity} ${e.code ?? ''}: ${e.message}`)
      .join('\n')
    return `C# syntax check FAILED: ${output.error_count} errors, ${output.warning_count} warnings\n${errorLines}`
  },

  async *call(
    { file_path, project_path }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    let errors: BuildError[] = []

    try {
      // Strategy 1: Try dotnet build
      const csproj = project_path ?? findCsproj(file_path)
      if (csproj && existsSync(csproj)) {
        const output = execSync(
          `dotnet build "${csproj}" --no-restore --nologo -v q 2>&1`,
          { encoding: 'utf-8', timeout: 30000 },
        )
        errors = parseMSBuildOutput(output)
      } else {
        // Strategy 2: Basic regex-based syntax check (fallback)
        const { readFileSync } = require('fs')
        const content = readFileSync(file_path, 'utf-8')
        errors = basicSyntaxCheck(content, file_path)
      }
    } catch (err: any) {
      // dotnet build returns non-zero on errors — parse stdout for errors
      if (err.stdout) {
        errors = parseMSBuildOutput(err.stdout)
      } else if (err.stderr) {
        errors = parseMSBuildOutput(err.stderr)
      }
    }

    // Filter to only errors in the target file
    const fileErrors = errors.filter(
      e => e.file_path === file_path || e.file_path.endsWith(file_path.split(/[/\\]/).pop()!)
    )

    const output: Output = {
      file_path,
      success: fileErrors.filter(e => e.severity === 'error').length === 0,
      errors: fileErrors,
      error_count: fileErrors.filter(e => e.severity === 'error').length,
      warning_count: fileErrors.filter(e => e.severity === 'warning').length,
      duration_ms: Date.now() - start,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>

function basicSyntaxCheck(content: string, filePath: string): BuildError[] {
  const errors: BuildError[] = []
  const lines = content.split('\n')

  let braceDepth = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const stripped = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const ch of stripped) {
      if (ch === '{') braceDepth++
      if (ch === '}') braceDepth--
    }
    if (braceDepth < 0) {
      errors.push({
        file_path: filePath, line: i + 1, severity: 'error',
        message: 'Unexpected closing brace', code: 'DANYA001',
      })
      braceDepth = 0
    }
  }

  if (braceDepth !== 0) {
    errors.push({
      file_path: filePath, line: lines.length, severity: 'error',
      message: `Unmatched braces: ${braceDepth > 0 ? 'missing closing' : 'extra closing'} brace(s)`,
      code: 'DANYA002',
    })
  }

  return errors
}
