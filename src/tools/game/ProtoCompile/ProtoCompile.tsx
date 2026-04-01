import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { getCwd } from '@utils/state'
import type { BuildError } from '../types'

const inputSchema = z.strictObject({
  proto_path: z.string().describe('Path to .proto file or directory'),
  languages: z.array(z.enum(['csharp', 'go', 'cpp'])).optional()
    .describe('Target languages. Default: auto-detect'),
  output_dir: z.string().optional()
    .describe('Output directory. Default: project-configured'),
})

type Output = {
  success: boolean
  proto_files_compiled: number
  generated_files: Array<{ language: string; file_path: string }>
  errors: BuildError[]
  duration_ms: number
}

const PROTOC_ERROR_REGEX = /^(.+?):(\d+):(\d+):\s+(.+)$/

function parseProtocErrors(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const match = line.trim().match(PROTOC_ERROR_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!, line: parseInt(match[2]!, 10),
        column: parseInt(match[3]!, 10), message: match[4]!,
        severity: 'error',
      })
    }
  }
  return errors
}

export const ProtoCompileTool = {
  name: TOOL_NAME, description: DESCRIPTION,
  searchHint: 'compile protobuf and generate client server stubs',
  inputSchema,
  async isEnabled() { return true },
  isReadOnly() { return false },
  isConcurrencySafe() { return false },
  needsPermissions() { return true },
  async prompt() { return DESCRIPTION },

  renderToolUseMessage(input: z.infer<typeof inputSchema>) {
    return `Compiling protobuf: ${input.proto_path}`
  },
  renderResultForAssistant(output: Output): string {
    if (output.success) return `ProtoCompile: ${output.proto_files_compiled} files compiled, ${output.generated_files.length} generated`
    return `ProtoCompile FAILED: ${output.errors.map(e => `${e.file_path}:${e.line}: ${e.message}`).join('\n')}`
  },

  async *call(input: z.infer<typeof inputSchema>, context: ToolUseContext) {
    const start = Date.now()
    const cwd = getCwd()
    try {
      const cmd = `protoc --proto_path="${input.proto_path}" ${input.output_dir ? `--go_out="${input.output_dir}"` : ''} "${input.proto_path}"/*.proto 2>&1`
      const output = execSync(cmd, { cwd, encoding: 'utf-8', timeout: 60000 })
      yield { type: 'result' as const, data: { success: true, proto_files_compiled: 1, generated_files: [], errors: [], duration_ms: Date.now() - start } as Output }
    } catch (err: any) {
      const errors = parseProtocErrors((err.stdout ?? '') + (err.stderr ?? ''))
      yield { type: 'result' as const, data: { success: false, proto_files_compiled: 0, generated_files: [], errors: errors.length ? errors : [{ file_path: '', line: 0, message: String(err.message).slice(0, 300), severity: 'error' as const }], duration_ms: Date.now() - start } as Output }
    }
  },
} satisfies Tool<typeof inputSchema, Output>
