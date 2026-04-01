import { z } from 'zod'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { getCwd } from '@utils/state'

const inputSchema = z.strictObject({
  type: z.enum(['feature', 'bugfix', 'research'])
    .describe('Type of knowledge to sediment'),
  title: z.string()
    .describe('Short title for the knowledge entry'),
  version: z.string().optional()
    .describe('Project version. Default: "current"'),
  content: z.object({
    summary: z.string().describe('1-3 sentence summary'),
    details: z.string().optional().describe('Detailed content'),
    files_changed: z.array(z.string()).optional().describe('Files involved'),
    lessons_learned: z.string().optional().describe('Key takeaways'),
  }),
})

type Output = {
  file_path: string
  created: boolean
}

function getOutputPath(cwd: string, type: string, version: string, title: string): string {
  const safeTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '-').toLowerCase()
  switch (type) {
    case 'feature':
      return join(cwd, 'Docs', 'Version', version, safeTitle, 'summary.md')
    case 'bugfix':
      return join(cwd, 'Docs', 'Bugs', version, `${safeTitle}.md`)
    case 'research':
      return join(cwd, 'Docs', 'Engine', 'Research', safeTitle, 'findings.md')
    default:
      return join(cwd, 'Docs', 'Other', `${safeTitle}.md`)
  }
}

function formatContent(input: z.infer<typeof inputSchema>): string {
  const lines: string[] = []
  lines.push(`# ${input.title}`)
  lines.push('')
  lines.push(`**Type:** ${input.type}`)
  if (input.version) lines.push(`**Version:** ${input.version}`)
  lines.push(`**Date:** ${new Date().toISOString().split('T')[0]}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(input.content.summary)

  if (input.content.details) {
    lines.push('')
    lines.push('## Details')
    lines.push('')
    lines.push(input.content.details)
  }

  if (input.content.files_changed?.length) {
    lines.push('')
    lines.push('## Files Changed')
    lines.push('')
    for (const f of input.content.files_changed) {
      lines.push(`- ${f}`)
    }
  }

  if (input.content.lessons_learned) {
    lines.push('')
    lines.push('## Lessons Learned')
    lines.push('')
    lines.push(input.content.lessons_learned)
  }

  lines.push('')
  return lines.join('\n')
}

export const KnowledgeSedimentTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'save knowledge documentation for features bugs research',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return false },
  isConcurrencySafe() { return true },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  renderToolUseMessage(input: z.infer<typeof inputSchema>) {
    return `Sedimenting ${input.type}: ${input.title}`
  },

  renderResultForAssistant(output: Output): string {
    return output.created
      ? `Knowledge sediment written to: ${output.file_path}`
      : `Knowledge sediment appended to: ${output.file_path}`
  },

  async *call(input: z.infer<typeof inputSchema>, context: ToolUseContext) {
    const cwd = getCwd()
    const version = input.version ?? 'current'
    const filePath = getOutputPath(cwd, input.type, version, input.title)
    const content = formatContent(input)

    mkdirSync(dirname(filePath), { recursive: true })

    let created = true
    if (existsSync(filePath)) {
      const existing = readFileSync(filePath, 'utf-8')
      writeFileSync(filePath, existing + '\n---\n\n' + content, 'utf-8')
      created = false
    } else {
      writeFileSync(filePath, content, 'utf-8')
    }

    const output: Output = { file_path: filePath, created }
    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
