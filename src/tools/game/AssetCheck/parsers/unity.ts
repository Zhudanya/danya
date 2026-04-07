import { readFileSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import { glob } from 'glob'

export type AssetIssue = {
  asset_path: string
  type: 'missing_reference' | 'broken_prefab' | 'orphaned_asset' | 'deep_nesting' | 'inactive_large_object'
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

  // Check prefab nesting depth
  const prefabFiles = assetFiles.filter(f => f.endsWith('.prefab'))
  for (const prefabFile of prefabFiles) {
    try {
      const content = readFileSync(prefabFile, 'utf-8')
      const relPath = relative(projectPath, prefabFile)

      // Count nested PrefabInstance blocks by tracking indentation depth
      let maxDepth = 0
      let currentDepth = 0
      const lines = content.split('\n')
      for (const line of lines) {
        if (/PrefabInstance:/.test(line)) {
          currentDepth++
          if (currentDepth > maxDepth) {
            maxDepth = currentDepth
          }
        }
        // A new top-level YAML document marker resets depth context
        if (/^--- !u!/.test(line)) {
          currentDepth = 0
        }
      }

      if (maxDepth > 10) {
        issues.push({
          asset_path: relPath,
          type: 'deep_nesting',
          message: `Prefab has ${maxDepth} levels of nested PrefabInstance entries (threshold: 10). Consider flattening the hierarchy.`,
        })
      }
    } catch {}
  }

  // Check for inactive large objects in scene files
  const sceneFiles = assetFiles.filter(f => f.endsWith('.unity'))
  for (const sceneFile of sceneFiles) {
    try {
      const content = readFileSync(sceneFile, 'utf-8')
      const relPath = relative(projectPath, sceneFile)

      // Split into YAML documents (each GameObject is a separate document)
      const documents = content.split(/^--- !u!/m)
      for (const doc of documents) {
        // Check if this is a GameObject document that is inactive
        if (!/GameObject:/.test(doc)) continue
        if (!/m_IsActive:\s*0/.test(doc)) continue

        // Count m_Children entries
        const childrenMatch = doc.match(/m_Children:/g)
        if (!childrenMatch) continue

        // Find the actual children list — count fileID references after m_Children
        const childrenSection = doc.slice(doc.indexOf('m_Children:'))
        const childRefs = childrenSection.match(/- \{fileID:/g)
        const childCount = childRefs ? childRefs.length : 0

        if (childCount > 20) {
          // Try to extract the GameObject name
          const nameMatch = doc.match(/m_Name:\s*(.+)/)
          const objName = nameMatch ? nameMatch[1]!.trim() : 'Unknown'
          issues.push({
            asset_path: relPath,
            type: 'inactive_large_object',
            message: `Inactive GameObject "${objName}" has ${childCount} children. Inactive objects with many children still consume memory. Consider removing or using additive scene loading.`,
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
