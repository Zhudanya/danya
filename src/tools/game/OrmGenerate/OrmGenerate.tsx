import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'

const inputSchema = z.strictObject({
  schema_path: z.string().describe('Path to the schema definition file or directory'),
  targets: z.array(z.enum(['golang', 'redis', 'mongo', 'proto'])).optional()
    .describe('Code generation targets. Defaults to all configured targets'),
  project_path: z.string().optional()
    .describe('Project root path. Defaults to parent of schema_path'),
})

type SchemaError = {
  schema_file: string
  message: string
}

type Output = {
  success: boolean
  generated_files: string[]
  errors: SchemaError[]
  duration_ms: number
}

function parseGeneratedFiles(output: string): string[] {
  const files: string[] = []
  // Common patterns in code-gen output
  const patterns = [
    /(?:generated|wrote|created|writing):\s*(.+)/gi,
    /^\s*->\s*(.+\.\w+)\s*$/gm,
    /^\s*(.+\.(?:go|proto|rs|ts))\s*$/gm,
  ]
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(output)) !== null) {
      const file = match[1]!.trim()
      if (file && !files.includes(file)) {
        files.push(file)
      }
    }
  }
  return files
}

function parseErrors(output: string, schemaPath: string): SchemaError[] {
  const errors: SchemaError[] = []
  const errorPatterns = [
    /(?:error|ERROR|Error):\s*(.+)/g,
    /^(.+?):(\d+):\s*(?:error|ERROR):\s*(.+)/gm,
  ]
  for (const pattern of errorPatterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(output)) !== null) {
      errors.push({
        schema_file: match.length > 3 ? match[1]! : schemaPath,
        message: match.length > 3 ? `Line ${match[2]}: ${match[3]}` : match[1]!,
      })
    }
  }
  return errors
}

export const OrmGenerateTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'generate ORM code from schema definitions',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return false },
  isConcurrencySafe() { return false },
  needsPermissions() { return true },

  async prompt() { return DESCRIPTION },

  async validateInput({ schema_path }: z.infer<typeof inputSchema>) {
    if (!existsSync(schema_path)) {
      return { result: false, message: `Schema path not found: ${schema_path}` }
    }
    return { result: true }
  },

  renderToolUseMessage({ schema_path, targets }: z.infer<typeof inputSchema>) {
    const targetStr = targets?.join(', ') ?? 'all'
    return `Generating ORM code from ${schema_path} (targets: ${targetStr})`
  },

  renderResultForAssistant(output: Output): string {
    if (output.success) {
      const fileList = output.generated_files.length > 0
        ? '\nGenerated:\n' + output.generated_files.map(f => `  ${f}`).join('\n')
        : ''
      return `ORM generation succeeded (${output.duration_ms}ms, ${output.generated_files.length} files)${fileList}`
    }
    const errorLines = output.errors
      .map(e => `  ${e.schema_file}: ${e.message}`)
      .join('\n')
    return `ORM generation FAILED: ${output.errors.length} errors\n${errorLines}`
  },

  async *call(
    { schema_path, targets, project_path }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    let generatedFiles: string[] = []
    let errors: SchemaError[] = []

    const cwd = project_path ?? join(schema_path, '..')

    // Determine the generation command
    // Priority: Makefile target > custom orm command
    const hasMakefile = existsSync(join(cwd, 'Makefile'))

    try {
      let cmd: string
      if (hasMakefile) {
        // Check if 'orm' target exists
        const makeTargets = targets?.length
          ? `orm-${targets.join(' orm-')}`
          : 'orm'
        cmd = `make ${makeTargets} SCHEMA="${schema_path}" 2>&1`
      } else {
        // Fallback: try a go generate approach
        cmd = `go generate "${schema_path}" 2>&1`
      }

      const raw = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 120000,
        cwd,
      })

      generatedFiles = parseGeneratedFiles(raw)
      errors = parseErrors(raw, schema_path)
      // If we found errors in the output but the command succeeded, they may be warnings
    } catch (err: any) {
      const raw = err.stdout || err.stderr || ''
      errors = parseErrors(raw, schema_path)
      generatedFiles = parseGeneratedFiles(raw)
      if (errors.length === 0) {
        errors.push({
          schema_file: schema_path,
          message: `Generation failed: ${err.message ?? 'unknown error'}`,
        })
      }
    }

    const hasErrors = errors.length > 0 && generatedFiles.length === 0

    const output: Output = {
      success: !hasErrors,
      generated_files: generatedFiles,
      errors,
      duration_ms: Date.now() - start,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
