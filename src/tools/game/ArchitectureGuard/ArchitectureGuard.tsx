import { z } from 'zod'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { extractImports } from './importParser'
import {
  checkLayerViolations,
  checkForbiddenZones,
  UNITY_LAYERS,
  GO_SERVER_LAYERS,
  type Violation,
  type LayerRule,
  type GuardRule,
} from './layerRules'
import { detectProject } from '../../../engine/detect'
import { getCwd } from '@utils/state'

const inputSchema = z.strictObject({
  files: z.array(z.string()).optional()
    .describe('Files to check. Default: all changed files from git diff'),
  rules_path: z.string().optional()
    .describe('Path to architecture rules. Default: auto-detect from .danya/rules/'),
})

type Output = {
  violations: Violation[]
  violation_count: number
  files_checked: number
  clean: boolean
}

function getChangedFiles(cwd: string): string[] {
  try {
    const output = execSync('git diff --name-only HEAD 2>/dev/null || git diff --name-only', {
      cwd, encoding: 'utf-8', timeout: 10000,
    })
    return output.split('\n').filter(f => f.trim().length > 0)
  } catch {
    return []
  }
}

function loadGuardRules(cwd: string): GuardRule[] {
  const candidates = [
    `${cwd}/.danya/guard-rules.json`,
    `${cwd}/.claude/guard-rules.json`,
  ]
  for (const path of candidates) {
    if (existsSync(path)) {
      try { return JSON.parse(readFileSync(path, 'utf-8')) } catch {}
    }
  }
  return []
}

function getLayerRule(cwd: string): LayerRule | null {
  const detection = detectProject(cwd)
  switch (detection.engine) {
    case 'unity': return UNITY_LAYERS
    default: break
  }
  if (detection.serverLanguage === 'go') return GO_SERVER_LAYERS
  return null
}

export const ArchitectureGuardTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'check code dependency direction and architecture violations',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return true },
  isConcurrencySafe() { return true },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  renderToolUseMessage({ files }: z.infer<typeof inputSchema>) {
    return `Checking architecture: ${files ? `${files.length} files` : 'changed files'}`
  },

  renderResultForAssistant(output: Output): string {
    if (output.clean) {
      return `Architecture check: ✅ clean (${output.files_checked} files checked)`
    }
    const lines = output.violations.map(v =>
      `  [${v.type}] ${v.file_path}:${v.line} — ${v.message}`
    ).join('\n')
    return `Architecture check: ${output.violation_count} violations\n${lines}`
  },

  async *call(
    { files, rules_path }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const cwd = getCwd()
    const targetFiles = files ?? getChangedFiles(cwd)

    if (targetFiles.length === 0) {
      const output: Output = { violations: [], violation_count: 0, files_checked: 0, clean: true }
      yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
      return
    }

    const allViolations: Violation[] = []

    // 1. Check forbidden zones
    const guardRules = loadGuardRules(cwd)
    if (guardRules.length > 0) {
      allViolations.push(...checkForbiddenZones(targetFiles, guardRules))
    }

    // 2. Check layer violations
    const layerRule = getLayerRule(cwd)
    if (layerRule) {
      for (const file of targetFiles) {
        const fullPath = file.startsWith('/') || file.includes(':') ? file : `${cwd}/${file}`
        if (!existsSync(fullPath)) continue

        try {
          const content = readFileSync(fullPath, 'utf-8')
          const imports = extractImports(content, file)
          allViolations.push(...checkLayerViolations(imports, layerRule))
        } catch {
          // skip unreadable files
        }
      }
    }

    const output: Output = {
      violations: allViolations,
      violation_count: allViolations.length,
      files_checked: targetFiles.length,
      clean: allViolations.length === 0,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
