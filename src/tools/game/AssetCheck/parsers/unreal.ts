import { readFileSync, existsSync, statSync } from 'fs'
import { join, relative, extname, basename } from 'path'
import { glob } from 'glob'

export type AssetIssue = {
  asset_path: string
  type: 'missing_reference' | 'broken_prefab' | 'orphaned_asset' | 'naming_violation' | 'size_warning'
  message: string
  referenced_by?: string
}

// Unreal naming conventions — recommended prefixes per asset type
const UE_NAMING_PREFIXES: Record<string, string> = {
  'StaticMesh': 'SM_',
  'SkeletalMesh': 'SK_',
  'Texture': 'T_',
  'Material': 'M_',
  'MaterialInstance': 'MI_',
  'Blueprint': 'BP_',
  'WidgetBlueprint': 'WBP_',
  'AnimBlueprint': 'ABP_',
  'AnimMontage': 'AM_',
  'ParticleSystem': 'PS_',
  'NiagaraSystem': 'NS_',
  'SoundCue': 'SC_',
  'SoundWave': 'SW_',
}

// File extension to asset type mapping
const EXT_TO_TYPE: Record<string, string> = {
  '.uasset': 'Asset',
  '.umap': 'Map',
}

// Texture file extensions (source files that may exist alongside .uasset)
const TEXTURE_EXTS = ['.png', '.jpg', '.jpeg', '.tga', '.bmp', '.exr', '.hdr']
const MESH_EXTS = ['.fbx', '.obj', '.gltf', '.glb']

// Size thresholds (bytes)
const TEXTURE_MAX_SIZE = 50 * 1024 * 1024  // 50MB for source textures
const MESH_MAX_SIZE = 100 * 1024 * 1024     // 100MB for source meshes

// Reference patterns in Unreal text assets (.umap, .uasset in text format)
// SoftObjectPath: /Game/Path/To/Asset.Asset
const SOFT_REF_REGEX = /\/Game\/([^\s"',)]+)/g
// StringAssetReference / TSoftObjectPtr
const ASSET_PATH_REGEX = /AssetPath['":\s]+\/Game\/([^\s"',)]+)/g

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
 * Check Unreal asset naming conventions.
 * UE recommends prefixes like SM_, T_, M_, BP_, etc.
 */
function checkNamingConventions(assetPath: string): AssetIssue | null {
  const name = basename(assetPath, extname(assetPath))
  const dir = assetPath.toLowerCase()

  // Detect asset type from directory hints
  for (const [typeHint, prefix] of Object.entries(UE_NAMING_PREFIXES)) {
    const hint = typeHint.toLowerCase()
    // Check if the directory path suggests this asset type
    if (dir.includes(`/${hint.toLowerCase()}/`) || dir.includes(`/${hint.toLowerCase()}s/`) ||
        dir.includes('/meshes/') && prefix === 'SM_' ||
        dir.includes('/textures/') && prefix === 'T_' ||
        dir.includes('/materials/') && prefix === 'M_' ||
        dir.includes('/blueprints/') && prefix === 'BP_' ||
        dir.includes('/widgets/') && prefix === 'WBP_' ||
        dir.includes('/animations/') && prefix === 'AM_' ||
        dir.includes('/particles/') && (prefix === 'PS_' || prefix === 'NS_') ||
        dir.includes('/sounds/') && (prefix === 'SC_' || prefix === 'SW_') ||
        dir.includes('/audio/') && (prefix === 'SC_' || prefix === 'SW_')) {

      if (!name.startsWith(prefix)) {
        return {
          asset_path: assetPath,
          type: 'naming_violation',
          message: `Asset "${name}" in ${typeHint}-related directory should use "${prefix}" prefix (e.g., "${prefix}${name}")`,
        }
      }
      break
    }
  }

  return null
}

/**
 * Check source asset file sizes.
 */
function checkAssetSizes(projectPath: string, files: string[]): AssetIssue[] {
  const issues: AssetIssue[] = []

  for (const file of files) {
    const ext = extname(file).toLowerCase()
    const fullPath = file.startsWith(projectPath) ? file : join(projectPath, file)

    try {
      const stat = statSync(fullPath)
      const relPath = relative(projectPath, fullPath)

      if (TEXTURE_EXTS.includes(ext) && stat.size > TEXTURE_MAX_SIZE) {
        const sizeMB = (stat.size / (1024 * 1024)).toFixed(1)
        issues.push({
          asset_path: relPath,
          type: 'size_warning',
          message: `Texture source file is ${sizeMB}MB (threshold: ${TEXTURE_MAX_SIZE / (1024 * 1024)}MB). Consider reducing resolution or compressing.`,
        })
      }

      if (MESH_EXTS.includes(ext) && stat.size > MESH_MAX_SIZE) {
        const sizeMB = (stat.size / (1024 * 1024)).toFixed(1)
        issues.push({
          asset_path: relPath,
          type: 'size_warning',
          message: `Mesh source file is ${sizeMB}MB (threshold: ${MESH_MAX_SIZE / (1024 * 1024)}MB). Consider reducing polygon count or LODs.`,
        })
      }
    } catch {
      // skip unreadable files
    }
  }

  return issues
}

/**
 * Check for missing references in text-format Unreal assets.
 * Only works with assets saved in text format (not binary .uasset).
 */
function checkTextAssetReferences(projectPath: string, files: string[], knownAssets: Set<string>): AssetIssue[] {
  const issues: AssetIssue[] = []

  for (const file of files) {
    const fullPath = file.startsWith(projectPath) ? file : join(projectPath, file)
    try {
      const content = readFileSync(fullPath, 'utf-8')
      // Skip binary files (will throw or contain garbled text)
      if (content.includes('\0')) continue

      const relPath = relative(projectPath, fullPath)
      const softRefRegex = new RegExp(SOFT_REF_REGEX.source, 'g')
      let match: RegExpExecArray | null

      const checkedRefs = new Set<string>()
      while ((match = softRefRegex.exec(content)) !== null) {
        const refPath = match[1]!.split('.')[0]! // Remove .ClassName suffix
        if (checkedRefs.has(refPath)) continue
        checkedRefs.add(refPath)

        // Normalize: /Game/Foo/Bar -> Content/Foo/Bar
        const contentPath = 'Content/' + refPath
        if (!knownAssets.has(contentPath) && !knownAssets.has(contentPath + '.uasset') && !knownAssets.has(contentPath + '.umap')) {
          issues.push({
            asset_path: 'Content/' + refPath,
            type: 'missing_reference',
            message: `Soft reference "/Game/${match[1]}" not found in project`,
            referenced_by: relPath,
          })
        }
      }
    } catch {
      // skip unreadable / binary files
    }
  }

  return issues
}

/**
 * Check Unreal project assets for issues.
 */
export function checkUnrealAssets(projectPath: string, scope: 'changed' | 'full'): AssetIssue[] {
  const issues: AssetIssue[] = []
  const changedFiles = scope === 'changed' ? getChangedFiles(projectPath) : undefined

  // Find Content directory
  const contentDir = existsSync(join(projectPath, 'Content')) ? 'Content' : ''
  if (!contentDir) {
    // Some UE projects have Content under the project name
    const uprojectFiles = glob.sync('*.uproject', { cwd: projectPath })
    if (uprojectFiles.length === 0) return issues
  }

  // Build known asset set
  const allAssets = glob.sync(`${contentDir || 'Content'}/**/*.{uasset,umap}`, {
    cwd: projectPath,
  })
  const knownAssets = new Set(allAssets)

  // Also add source assets
  const sourceAssets = glob.sync(`${contentDir || 'Content'}/**/*.{${[...TEXTURE_EXTS, ...MESH_EXTS].map(e => e.slice(1)).join(',')}}`, {
    cwd: projectPath,
  })

  // Determine files to check
  let filesToCheck: string[]
  if (scope === 'changed' && changedFiles) {
    filesToCheck = changedFiles.map(f => join(projectPath, f))
  } else {
    filesToCheck = allAssets.map(f => join(projectPath, f))
  }

  // 1. Naming convention checks
  for (const asset of (scope === 'full' ? allAssets : (changedFiles ?? []))) {
    const issue = checkNamingConventions(asset)
    if (issue) issues.push(issue)
  }

  // 2. Size checks on source assets
  const sourceFiles = scope === 'full'
    ? sourceAssets.map(f => join(projectPath, f))
    : (changedFiles ?? [])
        .filter(f => [...TEXTURE_EXTS, ...MESH_EXTS].some(ext => f.endsWith(ext)))
        .map(f => join(projectPath, f))
  issues.push(...checkAssetSizes(projectPath, sourceFiles))

  // 3. Reference checks (only on text-format assets)
  issues.push(...checkTextAssetReferences(projectPath, filesToCheck, knownAssets))

  return issues
}
