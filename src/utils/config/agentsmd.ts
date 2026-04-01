/**
 * AGENTS.md Hierarchical Loading System
 * Loads project instructions from multiple sources:
 *   1. User-level: ~/.danya/AGENTS.md
 *   2. Project-level: .danya/AGENTS.md, .danya/rules/*.md (all files)
 *   3. Root-level: AGENTS.md, CLAUDE.md (legacy compat)
 *   4. Local override: AGENTS.local.md (never committed)
 *
 * Supports @include directive for referencing other files.
 * Concatenates from root → leaf, closer directories have higher priority.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname, resolve, isAbsolute } from 'path'
import { homedir } from 'os'
import { CONFIG_BASE_DIR } from '@constants/product'

export type InstructionSource = {
  filePath: string
  content: string
  type: 'user' | 'project' | 'rules' | 'root' | 'local' | 'legacy'
}

export type LoadResult = {
  sources: InstructionSource[]
  concatenated: string
  totalBytes: number
  warnings: string[]
}

const MAX_TOTAL_BYTES = 40 * 1024 // 40KB total limit
const MAX_FILE_BYTES = 25 * 1024  // 25KB per file
const MAX_INDEX_LINES = 200       // MEMORY.md style index limit

/**
 * Load all project instructions for a given working directory.
 */
export function loadProjectInstructions(cwd: string): LoadResult {
  const sources: InstructionSource[] = []
  const warnings: string[] = []
  let totalBytes = 0

  // 1. User-level: ~/.danya/AGENTS.md
  const userFile = join(homedir(), CONFIG_BASE_DIR, 'AGENTS.md')
  tryLoadFile(userFile, 'user', sources, warnings)

  // 2. Walk from root to cwd, loading project instructions at each level
  const projectInstructions = walkDirectoryTree(cwd)
  for (const pi of projectInstructions) {
    sources.push(pi)
  }

  // 3. Local override (never committed)
  const localFile = join(cwd, 'AGENTS.local.md')
  tryLoadFile(localFile, 'local', sources, warnings)
  // Also check legacy
  const localClaudeFile = join(cwd, 'CLAUDE.local.md')
  tryLoadFile(localClaudeFile, 'local', sources, warnings)

  // Resolve @include directives
  const resolved = sources.map((s) => ({
    ...s,
    content: resolveIncludes(s.content, dirname(s.filePath), new Set()),
  }))

  // Enforce size limits
  for (const s of resolved) {
    if (s.content.length > MAX_FILE_BYTES) {
      warnings.push(`${s.filePath}: truncated from ${s.content.length} to ${MAX_FILE_BYTES} bytes`)
      s.content = s.content.slice(0, MAX_FILE_BYTES) + '\n... (truncated)'
    }
    totalBytes += s.content.length
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    warnings.push(`Total instruction size (${totalBytes} bytes) exceeds limit (${MAX_TOTAL_BYTES} bytes)`)
  }

  const concatenated = resolved
    .map((s) => {
      const header = `# From: ${s.filePath} (${s.type})`
      return `${header}\n\n${s.content}`
    })
    .join('\n\n---\n\n')

  return {
    sources: resolved,
    concatenated,
    totalBytes,
    warnings,
  }
}

/**
 * Walk from filesystem root to cwd, collecting instructions at each directory level.
 */
function walkDirectoryTree(cwd: string): InstructionSource[] {
  const sources: InstructionSource[] = []
  const absPath = resolve(cwd)
  const parts = absPath.split(/[/\\]/).filter(Boolean)

  // Build path from root to cwd
  let current = absPath.startsWith('/') ? '/' : parts[0] + '/'
  const pathsToCheck = [current]

  for (let i = absPath.startsWith('/') ? 0 : 1; i < parts.length; i++) {
    current = join(current, parts[i]!)
    pathsToCheck.push(current)
  }

  for (const dir of pathsToCheck) {
    // AGENTS.md at this level
    tryLoadFile(join(dir, 'AGENTS.md'), 'root', sources, [])

    // CLAUDE.md (legacy compat) at this level
    tryLoadFile(join(dir, 'CLAUDE.md'), 'legacy', sources, [])

    // .danya/AGENTS.md
    tryLoadFile(join(dir, CONFIG_BASE_DIR, 'AGENTS.md'), 'project', sources, [])

    // .danya/rules/*.md (all rule files)
    const rulesDir = join(dir, CONFIG_BASE_DIR, 'rules')
    if (existsSync(rulesDir)) {
      try {
        const ruleFiles = readdirSync(rulesDir)
          .filter((f) => f.endsWith('.md'))
          .sort()
        for (const ruleFile of ruleFiles) {
          tryLoadFile(join(rulesDir, ruleFile), 'rules', sources, [])
        }
      } catch {
        // ignore readdir errors
      }
    }

    // .claude/ directory (legacy compat)
    tryLoadFile(join(dir, '.claude', 'CLAUDE.md'), 'legacy', sources, [])
    const legacyRulesDir = join(dir, '.claude', 'rules')
    if (existsSync(legacyRulesDir)) {
      try {
        const ruleFiles = readdirSync(legacyRulesDir)
          .filter((f) => f.endsWith('.md'))
          .sort()
        for (const ruleFile of ruleFiles) {
          tryLoadFile(join(legacyRulesDir, ruleFile), 'rules', sources, [])
        }
      } catch {
        // ignore
      }
    }
  }

  return sources
}

function tryLoadFile(
  filePath: string,
  type: InstructionSource['type'],
  sources: InstructionSource[],
  warnings: string[],
): void {
  try {
    if (!existsSync(filePath)) return
    if (!statSync(filePath).isFile()) return

    const content = readFileSync(filePath, 'utf-8')
    if (content.trim().length === 0) return

    // Dedup: don't load the same file twice
    if (sources.some((s) => s.filePath === filePath)) return

    sources.push({ filePath, content, type })
  } catch {
    warnings.push(`Failed to read ${filePath}`)
  }
}

/**
 * Resolve @include directives in content.
 * Supports: @path/to/file.md, @./relative/path, @~/home/path, @/absolute/path
 */
function resolveIncludes(
  content: string,
  baseDir: string,
  visited: Set<string>,
): string {
  return content.replace(/^@(.+)$/gm, (match, includePath: string) => {
    const trimmed = includePath.trim()
    if (!trimmed) return match

    let resolved: string
    if (trimmed.startsWith('~/')) {
      resolved = join(homedir(), trimmed.slice(2))
    } else if (isAbsolute(trimmed)) {
      resolved = trimmed
    } else {
      resolved = resolve(baseDir, trimmed)
    }

    // Prevent circular includes
    if (visited.has(resolved)) return `<!-- circular include: ${trimmed} -->`
    visited.add(resolved)

    // Only include text files
    const textExtensions = ['.md', '.txt', '.ts', '.tsx', '.js', '.json', '.yaml', '.yml', '.toml']
    const hasTextExt = textExtensions.some((ext) => resolved.endsWith(ext))
    if (!hasTextExt) return match

    try {
      if (!existsSync(resolved)) return '' // Silently ignore missing includes
      const included = readFileSync(resolved, 'utf-8')
      return resolveIncludes(included, dirname(resolved), visited)
    } catch {
      return '' // Silently ignore read errors
    }
  })
}
