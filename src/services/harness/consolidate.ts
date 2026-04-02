/**
 * Harness Consolidation — merges .claude/ and .codex/ content into .danya/
 *
 * Rules:
 * - .danya/ is the primary directory, always authoritative
 * - Same-name files: .danya/ wins, skip legacy
 * - Legacy-only files: copy into .danya/ (preserving subdirectory structure)
 * - Consolidation is one-time on init; runtime only reads .danya/
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs'
import { join, relative, basename } from 'path'

const CONSOLIDATION_DIRS = ['rules', 'commands', 'memory', 'skills', 'hooks'] as const
const LEGACY_DIRS = ['.claude', '.codex'] as const

export interface ConsolidationResult {
  merged: string[]     // files copied from legacy into .danya/
  skipped: string[]    // files skipped because .danya/ already has them
  sources: string[]    // legacy directories that were found
}

/**
 * Consolidate legacy .claude/ and .codex/ content into .danya/.
 * Only copies files that don't already exist in .danya/.
 */
export function consolidateLegacyIntoDanya(projectDir: string): ConsolidationResult {
  const danyaDir = join(projectDir, '.danya')
  const result: ConsolidationResult = { merged: [], skipped: [], sources: [] }

  for (const legacyName of LEGACY_DIRS) {
    const legacyDir = join(projectDir, legacyName)
    if (!existsSync(legacyDir)) continue

    result.sources.push(legacyName)

    // Consolidate each subdirectory (rules/, commands/, etc.)
    for (const subDir of CONSOLIDATION_DIRS) {
      const legacySub = join(legacyDir, subDir)
      if (!existsSync(legacySub)) continue

      const danyaSub = join(danyaDir, subDir)
      mkdirSync(danyaSub, { recursive: true })

      copyMissing(legacySub, danyaSub, subDir, result)
    }

    // Consolidate settings.json (merge hooks)
    mergeSettings(legacyDir, danyaDir, result)
  }

  return result
}

/**
 * Recursively copy files from legacy dir to danya dir,
 * skipping any that already exist in danya.
 */
function copyMissing(
  legacyDir: string,
  danyaDir: string,
  prefix: string,
  result: ConsolidationResult,
): void {
  let entries: string[]
  try {
    entries = readdirSync(legacyDir)
  } catch {
    return
  }

  for (const entry of entries) {
    const legacyPath = join(legacyDir, entry)
    const danyaPath = join(danyaDir, entry)

    try {
      if (statSync(legacyPath).isDirectory()) {
        mkdirSync(danyaPath, { recursive: true })
        copyMissing(legacyPath, danyaPath, `${prefix}/${entry}`, result)
        continue
      }
    } catch {
      continue
    }

    const relPath = `${prefix}/${entry}`

    if (existsSync(danyaPath)) {
      result.skipped.push(relPath)
    } else {
      try {
        const content = readFileSync(legacyPath)
        writeFileSync(danyaPath, content, {
          mode: prefix === 'hooks' ? 0o755 : 0o644,
        })
        result.merged.push(relPath)
      } catch {
        // skip unreadable files
      }
    }
  }
}

/**
 * Merge legacy settings.json hooks into .danya/settings.json.
 * Only adds hooks that don't already exist.
 */
function mergeSettings(
  legacyDir: string,
  danyaDir: string,
  result: ConsolidationResult,
): void {
  const legacySettings = join(legacyDir, 'settings.json')
  const danyaSettings = join(danyaDir, 'settings.json')

  if (!existsSync(legacySettings)) return

  let legacyConfig: any
  let danyaConfig: any
  try {
    legacyConfig = JSON.parse(readFileSync(legacySettings, 'utf-8'))
  } catch {
    return
  }
  try {
    danyaConfig = existsSync(danyaSettings)
      ? JSON.parse(readFileSync(danyaSettings, 'utf-8'))
      : {}
  } catch {
    danyaConfig = {}
  }

  // Merge hooks: add legacy hooks that aren't already registered
  if (legacyConfig.hooks) {
    if (!danyaConfig.hooks) danyaConfig.hooks = {}

    for (const [event, handlers] of Object.entries(legacyConfig.hooks)) {
      if (!danyaConfig.hooks[event]) {
        danyaConfig.hooks[event] = handlers
        result.merged.push(`settings.json:hooks.${event}`)
      }
    }

    writeFileSync(danyaSettings, JSON.stringify(danyaConfig, null, 2), 'utf-8')
  }
}

/**
 * Check if a legacy harness directory exists (.claude/ or .codex/ with rules/commands).
 */
export function hasLegacyHarness(projectDir: string): boolean {
  for (const legacyName of LEGACY_DIRS) {
    const legacyDir = join(projectDir, legacyName)
    if (!existsSync(legacyDir)) continue

    // Check if it has harness structure (not just an empty .claude/)
    for (const subDir of CONSOLIDATION_DIRS) {
      if (existsSync(join(legacyDir, subDir))) return true
    }
    if (existsSync(join(legacyDir, 'settings.json'))) return true
  }
  return false
}
