import { readFileSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import { glob } from 'glob'

export type AssetIssue = {
  asset_path: string
  type: 'missing_reference' | 'broken_prefab' | 'orphaned_asset'
  message: string
  referenced_by?: string
}

// Regex to extract GUID references from Unity files (.prefab, .unity, .asset, .mat)
const GUID_REF_REGEX = /guid:\s*([0-9a-f]{32})/gi

// Regex to extract GUID from .meta files
const META_GUID_REGEX = /^guid:\s*([0-9a-f]{32})/m

/**
 * Collect all known GUIDs from .meta files in the project.
 */
function collectGuids(projectPath: string, scope: 'changed' | 'full', changedFiles?: string[]): Map<string, string> {
  const guidMap = new Map<string, string>()

  let metaFiles: string[]
  if (scope === 'changed' && changedFiles) {
    metaFiles = changedFiles
      .filter(f => f.endsWith('.meta'))
      .map(f => join(projectPath, f))
  } else {
    metaFiles = glob.sync('**/*.meta', { cwd: projectPath, absolute: true })
  }

  for (const metaFile of metaFiles) {
    try {
      const content = readFileSync(metaFile, 'utf-8')
      const match = content.match(META_GUID_REGEX)
      if (match) {
        guidMap.set(match[1]!, metaFile.replace(/\.meta$/, ''))
      }
    } catch {
      // skip unreadable files
    }
  }

  return guidMap
}

/**
 * Get changed files from git.
 */
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

/**
 * Check Unity assets for missing GUID references and orphaned assets.
 */
export function checkUnityAssets(projectPath: string, scope: 'changed' | 'full'): AssetIssue[] {
  const issues: AssetIssue[] = []
  const changedFiles = scope === 'changed' ? getChangedFiles(projectPath) : undefined

  // Build full GUID registry (always need full set for reference resolution)
  const allGuids = new Map<string, string>()
  const allMetaFiles = glob.sync('Assets/**/*.meta', { cwd: projectPath, absolute: true })
  for (const metaFile of allMetaFiles) {
    try {
      const content = readFileSync(metaFile, 'utf-8')
      const match = content.match(META_GUID_REGEX)
      if (match) {
        allGuids.set(match[1]!, relative(projectPath, metaFile.replace(/\.meta$/, '')))
      }
    } catch {}
  }

  // Determine which asset files to scan
  const assetExts = ['.prefab', '.unity', '.asset', '.mat', '.controller', '.anim']
  let assetFiles: string[]

  if (scope === 'changed' && changedFiles) {
    assetFiles = changedFiles
      .filter(f => assetExts.some(ext => f.endsWith(ext)))
      .map(f => join(projectPath, f))
  } else {
    assetFiles = glob.sync(`Assets/**/*{${assetExts.join(',')}}`, { cwd: projectPath, absolute: true })
  }

  // Check each asset for broken GUID references
  for (const assetFile of assetFiles) {
    try {
      const content = readFileSync(assetFile, 'utf-8')
      const relPath = relative(projectPath, assetFile)
      let match: RegExpExecArray | null

      const guidRegex = new RegExp(GUID_REF_REGEX.source, 'gi')
      while ((match = guidRegex.exec(content)) !== null) {
        const guid = match[1]!
        if (!allGuids.has(guid)) {
          issues.push({
            asset_path: relPath,
            type: 'missing_reference',
            message: `References GUID ${guid} which has no corresponding .meta file`,
            referenced_by: relPath,
          })
        }
      }
    } catch {}
  }

  // Check for orphaned assets (assets with no references)
  if (scope === 'full') {
    const referencedGuids = new Set<string>()
    const allAssetFiles = glob.sync('Assets/**/*{.prefab,.unity,.asset,.mat,.controller,.anim}', {
      cwd: projectPath,
      absolute: true,
    })

    for (const assetFile of allAssetFiles) {
      try {
        const content = readFileSync(assetFile, 'utf-8')
        const guidRegex = new RegExp(GUID_REF_REGEX.source, 'gi')
        let m: RegExpExecArray | null
        while ((m = guidRegex.exec(content)) !== null) {
          referencedGuids.add(m[1]!)
        }
      } catch {}
    }

    for (const [guid, assetPath] of allGuids) {
      if (!referencedGuids.has(guid) && !assetPath.endsWith('.cs') && !assetPath.endsWith('.shader')) {
        // Skip scripts and shaders — they may be referenced by class name, not GUID
        const ext = assetPath.split('.').pop() ?? ''
        if (['mat', 'prefab', 'asset', 'controller', 'anim'].includes(ext)) {
          issues.push({
            asset_path: assetPath,
            type: 'orphaned_asset',
            message: `Asset GUID ${guid} is not referenced by any other asset`,
          })
        }
      }
    }
  }

  return issues
}
