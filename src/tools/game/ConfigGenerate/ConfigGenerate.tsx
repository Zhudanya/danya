import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { getCwd } from '@utils/state'

const inputSchema = z.strictObject({
  source_path: z.string().describe('Path to config source (Excel dir or generator executable)'),
  generator: z.string().optional().describe('Generator command. Default: auto-detect'),
  targets: z.array(z.enum(['client', 'server', 'both'])).optional().describe('Default: both'),
})

type Output = {
  success: boolean
  generated_files: Array<{ target: string; file_path: string }>
  errors: Array<{ source_file: string; message: string }>
  duration_ms: number
}

export const ConfigGenerateTool = {
  name: TOOL_NAME, description: DESCRIPTION,
  searchHint: 'generate config code from Excel or designer data',
  inputSchema,
  async isEnabled() { return true },
  isReadOnly() { return false },
  isConcurrencySafe() { return false },
  needsPermissions() { return true },
  async prompt() { return DESCRIPTION },

  renderToolUseMessage(input: z.infer<typeof inputSchema>) {
    return `Generating config from: ${input.source_path}`
  },
  renderResultForAssistant(output: Output): string {
    if (output.success) return `ConfigGenerate: ${output.generated_files.length} files generated`
    return `ConfigGenerate FAILED: ${output.errors.map(e => `${e.source_file}: ${e.message}`).join('\n')}`
  },

  async *call(input: z.infer<typeof inputSchema>, context: ToolUseContext) {
    const start = Date.now()
    const cwd = getCwd()
    const cmd = input.generator ?? (existsSync(`${cwd}/Makefile`) ? 'make config' : `"${input.source_path}"`)
    try {
      execSync(cmd, { cwd, encoding: 'utf-8', timeout: 120000 })
      yield { type: 'result' as const, data: { success: true, generated_files: [], errors: [], duration_ms: Date.now() - start } as Output }
    } catch (err: any) {
      yield { type: 'result' as const, data: { success: false, generated_files: [], errors: [{ source_file: input.source_path, message: String(err.message).slice(0, 300) }], duration_ms: Date.now() - start } as Output }
    }
  },
} satisfies Tool<typeof inputSchema, Output>
