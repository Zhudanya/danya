import { z } from 'zod'
import { readFileSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { glob } from 'glob'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import type { PerfRule, PerfIssue } from './types'
import { unityRules } from './rules/unity'
import { unrealRules } from './rules/unreal'
import { godotRules } from './rules/godot'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Absolute path to the game project root'),
  scope: z.enum(['changed', 'full']).optional()
    .describe('Scan scope: "changed" checks only git-modified files, "full" checks all. Defaults to "changed"'),
})

type Output = {
  issues: PerfIssue[]
  issue_count: number
  files_checked: number
  engine: string
  duration_ms: number
}

function detectEngine(projectPath: string): 'unity' | 'unreal' | 'godot' | null {
  if (existsSync(join(projectPath, 'Assets')) && existsSync(join(projectPath, 'ProjectSettings'))) {
    return 'unity'
  }
  try {
    const uprojectFiles = glob.sync('*.uproject', { cwd: projectPath })
    if (uprojectFiles.length > 0) return 'unreal'
  } catch {}
  if (existsSync(join(projectPath, 'project.godot'))) {
    return 'godot'
  }
  return null
}

function getChangedFiles(projectPath: string): string[] {
  try {
    const { execSync } = require('child_process')
    const output = execSync('git diff --name-only HEAD 2>/dev/null || git diff --name-only', {
      cwd: projectPath,
      encoding: 'utf-8',
      timeout: 10000,
    })
    return output.split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function getSourceFiles(projectPath: string, engine: string, scope: 'changed' | 'full'): string[] {
  if (scope === 'changed') {
    const changed = getChangedFiles(projectPath)
    const exts = engine === 'unity' ? ['.cs'] : engine === 'unreal' ? ['.cpp', '.h'] : ['.gd', '.cs']
    return changed
      .filter(f => exts.some(ext => f.endsWith(ext)))
      .map(f => join(projectPath, f))
      .filter(f => existsSync(f))
  }

  switch (engine) {
    case 'unity':
      return glob.sync('Assets/**/*.cs', { cwd: projectPath, absolute: true })
    case 'unreal':
      return glob.sync('Source/**/*.{cpp,h}', { cwd: projectPath, absolute: true })
    case 'godot':
      return glob.sync('**/*.{gd,cs}', { cwd: projectPath, absolute: true, ignore: ['.godot/**'] })
    default:
      return []
  }
}

/**
 * Extract function/method bodies from source code.
 * Returns map of function name -> { startLine, endLine, content }
 */
function extractFunctionBodies(content: string, hotPaths: string[]): Array<{ name: string; startLine: number; lines: string[] }> {
  const results: Array<{ name: string; startLine: number; lines: string[] }> = []
  const allLines = content.split('\n')

  for (const funcName of hotPaths) {
    // Match function definitions: void Update() { or func _process(delta): or void Tick(float DeltaTime) {
    const funcRegex = new RegExp(`(?:void|func|function|override)\\s+${funcName}\\s*\\(`, 'g')
    let match: RegExpExecArray | null

    while ((match = funcRegex.exec(content)) !== null) {
      // Find the line number of this match
      const beforeMatch = content.slice(0, match.index)
      const startLine = beforeMatch.split('\n').length

      // Find matching brace or indentation-based block end
      let braceCount = 0
      let foundOpen = false
      const bodyLines: string[] = []

      for (let i = startLine - 1; i < allLines.length; i++) {
        const line = allLines[i]!
        bodyLines.push(line)

        for (const ch of line) {
          if (ch === '{') { braceCount++; foundOpen = true }
          if (ch === '}') braceCount--
        }

        // For GDScript (indentation-based), check for de-indent
        if (!foundOpen && i > startLine && line.trim().length > 0 && !line.startsWith('\t') && !line.startsWith('  ')) {
          break
        }

        if (foundOpen && braceCount === 0) break

        // Safety limit
        if (bodyLines.length > 500) break
      }

      results.push({ name: funcName, startLine, lines: bodyLines })
    }
  }

  return results
}

function lintFile(filePath: string, projectPath: string, rules: PerfRule[]): PerfIssue[] {
  const issues: PerfIssue[] = []
  let content: string

  try {
    content = readFileSync(filePath, 'utf-8')
  } catch {
    return []
  }

  const relPath = relative(projectPath, filePath)
  const allLines = content.split('\n')

  for (const rule of rules) {
    // Pair rules: check if the pair exists file-wide
    if (rule.requiresPair) {
      if (rule.pattern.test(content) && !rule.requiresPair.pattern.test(content)) {
        // Find the line of the first match
        for (let i = 0; i < allLines.length; i++) {
          if (rule.pattern.test(allLines[i]!)) {
            issues.push({
              rule_id: rule.id,
              rule_name: rule.name,
              file_path: relPath,
              line: i + 1,
              message: rule.message,
              fix: rule.fix,
            })
            break
          }
        }
      }
      continue
    }

    if (rule.hotPaths === null) {
      // Check entire file
      for (let i = 0; i < allLines.length; i++) {
        if (rule.pattern.test(allLines[i]!)) {
          issues.push({
            rule_id: rule.id,
            rule_name: rule.name,
            file_path: relPath,
            line: i + 1,
            message: rule.message,
            fix: rule.fix,
          })
        }
      }
      continue
    }

    // Check only inside hot path functions
    const bodies = extractFunctionBodies(content, rule.hotPaths)
    for (const body of bodies) {
      for (let i = 0; i < body.lines.length; i++) {
        if (rule.pattern.test(body.lines[i]!)) {
          issues.push({
            rule_id: rule.id,
            rule_name: rule.name,
            file_path: relPath,
            line: body.startLine + i,
            message: `[in ${body.name}] ${rule.message}`,
            fix: rule.fix,
          })
        }
      }
    }
  }

  return issues
}

export const PerfLintTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'performance analysis game code hot path optimization',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return true },
  isConcurrencySafe() { return true },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  async validateInput({ project_path }: z.infer<typeof inputSchema>) {
    if (!existsSync(project_path)) {
      return { result: false, message: `Directory not found: ${project_path}` }
    }
    if (!detectEngine(project_path)) {
      return { result: false, message: 'No game engine detected (Unity/Unreal/Godot required)' }
    }
    return { result: true }
  },

  renderToolUseMessage({ project_path, scope }: z.infer<typeof inputSchema>) {
    return `PerfLint: ${project_path} (scope: ${scope ?? 'changed'})`
  },

  renderResultForAssistant(output: Output): string {
    if (output.issue_count === 0) {
      return `PerfLint [${output.engine}] passed: ${output.files_checked} files checked, no performance issues (${output.duration_ms}ms)`
    }
    const issueLines = output.issues
      .slice(0, 15)
      .map(i => `  [${i.rule_id}] ${i.file_path}:${i.line}: ${i.message}${i.fix ? `\n    Fix: ${i.fix}` : ''}`)
      .join('\n')
    const more = output.issue_count > 15 ? `\n  ... and ${output.issue_count - 15} more` : ''
    return `PerfLint [${output.engine}] found ${output.issue_count} issues (${output.files_checked} files, ${output.duration_ms}ms)\n${issueLines}${more}`
  },

  async *call(
    { project_path, scope }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    const effectiveScope = scope ?? 'changed'
    const engine = detectEngine(project_path)!

    const rules = engine === 'unity' ? unityRules
      : engine === 'unreal' ? unrealRules
      : godotRules

    const files = getSourceFiles(project_path, engine, effectiveScope)
    const allIssues: PerfIssue[] = []

    for (const file of files) {
      allIssues.push(...lintFile(file, project_path, rules))
    }

    const output: Output = {
      issues: allIssues,
      issue_count: allIssues.length,
      files_checked: files.length,
      engine,
      duration_ms: Date.now() - start,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
