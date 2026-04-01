import { readFileSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import { glob } from 'glob'

export type AssetIssue = {
  asset_path: string
  type: 'missing_reference' | 'broken_prefab' | 'orphaned_asset'
  message: string
  referenced_by?: string
}

// Godot ext_resource format: [ext_resource type="PackedScene" path="res://scenes/Player.tscn" id=1]
const EXT_RESOURCE_REGEX = /\[ext_resource\s[^\]]*path="res:\/\/([^"]+)"/g

// Godot sub_resource / load() references
const LOAD_REGEX = /(?:preload|load)\(\s*"res:\/\/([^"]+)"\s*\)/g

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
 * Check Godot assets for missing resource references.
 */
export function checkGodotAssets(projectPath: string, scope: 'changed' | 'full'): AssetIssue[] {
  const issues: AssetIssue[] = []
  const changedFiles = scope === 'changed' ? getChangedFiles(projectPath) : undefined

  // Determine which scene/resource files to scan
  const sceneExts = ['.tscn', '.tres', '.gd']
  let filesToScan: string[]

  if (scope === 'changed' && changedFiles) {
    filesToScan = changedFiles
      .filter(f => sceneExts.some(ext => f.endsWith(ext)))
      .map(f => join(projectPath, f))
  } else {
    filesToScan = glob.sync(`**/*{${sceneExts.join(',')}}`, {
      cwd: projectPath,
      absolute: true,
      ignore: ['.godot/**', '.import/**'],
    })
  }

  for (const file of filesToScan) {
    try {
      const content = readFileSync(file, 'utf-8')
      const relPath = relative(projectPath, file)

      // Check ext_resource paths
      const extRegex = new RegExp(EXT_RESOURCE_REGEX.source, 'g')
      let match: RegExpExecArray | null
      while ((match = extRegex.exec(content)) !== null) {
        const referencedPath = match[1]!
        const absolutePath = join(projectPath, referencedPath)
        if (!existsSync(absolutePath)) {
          issues.push({
            asset_path: referencedPath,
            type: 'missing_reference',
            message: `Referenced resource "res://${referencedPath}" does not exist`,
            referenced_by: relPath,
          })
        }
      }

      // Check load()/preload() references in .gd and .tscn files
      const loadRegex = new RegExp(LOAD_REGEX.source, 'g')
      while ((match = loadRegex.exec(content)) !== null) {
        const referencedPath = match[1]!
        const absolutePath = join(projectPath, referencedPath)
        if (!existsSync(absolutePath)) {
          issues.push({
            asset_path: referencedPath,
            type: 'missing_reference',
            message: `load()/preload() references "res://${referencedPath}" which does not exist`,
            referenced_by: relPath,
          })
        }
      }
    } catch {}
  }

  return issues
}
