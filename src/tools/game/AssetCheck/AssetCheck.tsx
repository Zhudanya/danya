import { z } from 'zod'
import { existsSync } from 'fs'
import { join } from 'path'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { checkUnityAssets, type AssetIssue as UnityAssetIssue } from './parsers/unity'
import { checkGodotAssets, type AssetIssue as GodotAssetIssue } from './parsers/godot'
import { checkUnrealAssets, type AssetIssue as UnrealAssetIssue } from './parsers/unreal'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Absolute path to the game project root'),
  scope: z.enum(['changed', 'full']).optional()
    .describe('Scan scope: "changed" checks only git-modified files, "full" checks all assets. Defaults to "changed"'),
  asset_types: z.array(z.enum(['prefab', 'scene', 'material', 'audio', 'texture'])).optional()
    .describe('Filter by asset types. If omitted, checks all types'),
})

type AssetIssue = {
  asset_path: string
  type: 'missing_reference' | 'broken_prefab' | 'orphaned_asset' | 'naming_violation' | 'size_warning'
  message: string
  referenced_by?: string
}

type Output = {
  issues: AssetIssue[]
  issue_count: number
  assets_checked: number
  clean: boolean
  duration_ms: number
}

function detectEngine(projectPath: string): 'unity' | 'unreal' | 'godot' | null {
  if (existsSync(join(projectPath, 'Assets')) && existsSync(join(projectPath, 'ProjectSettings'))) {
    return 'unity'
  }
  // Unreal: has .uproject file
  try {
    const { globSync } = require('glob')
    if (globSync('*.uproject', { cwd: projectPath }).length > 0) {
      return 'unreal'
    }
  } catch {}
  if (existsSync(join(projectPath, 'project.godot'))) {
    return 'godot'
  }
  return null
}

export const AssetCheckTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'check game assets missing references broken prefabs',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return true },
  isConcurrencySafe() { return true },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  async validateInput({ project_path }: z.infer<typeof inputSchema>) {
    if (!existsSync(project_path)) {
      return { result: false, message: `Project path not found: ${project_path}` }
    }
    const engine = detectEngine(project_path)
    if (!engine) {
      return { result: false, message: `Could not detect game engine. Expected Unity (Assets/ + ProjectSettings/), Unreal (*.uproject), or Godot (project.godot)` }
    }
    return { result: true }
  },

  renderToolUseMessage({ project_path, scope }: z.infer<typeof inputSchema>) {
    return `Checking assets: ${project_path} (scope: ${scope ?? 'changed'})`
  },

  renderResultForAssistant(output: Output): string {
    if (output.clean) {
      return `Asset check passed: ${output.assets_checked} assets checked, no issues found (${output.duration_ms}ms)`
    }
    const issueLines = output.issues
      .slice(0, 20)
      .map(i => `  [${i.type}] ${i.asset_path}: ${i.message}${i.referenced_by ? ` (referenced by ${i.referenced_by})` : ''}`)
      .join('\n')
    const more = output.issue_count > 20 ? `\n  ... and ${output.issue_count - 20} more` : ''
    return `Asset check found ${output.issue_count} issues (${output.assets_checked} assets checked, ${output.duration_ms}ms)\n${issueLines}${more}`
  },

  async *call(
    { project_path, scope, asset_types }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    const effectiveScope = scope ?? 'changed'
    const engine = detectEngine(project_path)

    let rawIssues: AssetIssue[] = []
    let assetsChecked = 0

    if (engine === 'unity') {
      const issues = checkUnityAssets(project_path, effectiveScope)
      rawIssues = issues as AssetIssue[]
      // Rough count from globbed files
      try {
        const { glob } = require('glob')
        assetsChecked = glob.sync('Assets/**/*.{prefab,unity,asset,mat,controller,anim}', { cwd: project_path }).length
      } catch {
        assetsChecked = rawIssues.length
      }
    } else if (engine === 'unreal') {
      const issues = checkUnrealAssets(project_path, effectiveScope)
      rawIssues = issues as AssetIssue[]
      try {
        const { glob } = require('glob')
        assetsChecked = glob.sync('Content/**/*.{uasset,umap}', { cwd: project_path }).length
      } catch {
        assetsChecked = rawIssues.length
      }
    } else if (engine === 'godot') {
      const issues = checkGodotAssets(project_path, effectiveScope)
      rawIssues = issues as AssetIssue[]
      try {
        const { glob } = require('glob')
        assetsChecked = glob.sync('**/*.{tscn,tres,gd}', { cwd: project_path, ignore: ['.godot/**'] }).length
      } catch {
        assetsChecked = rawIssues.length
      }
    }

    // Filter by asset_types if specified
    let issues = rawIssues
    if (asset_types && asset_types.length > 0) {
      const typeExtMap: Record<string, string[]> = {
        prefab: ['.prefab', '.uasset'],
        scene: ['.unity', '.tscn', '.umap'],
        material: ['.mat', '.tres'],
        audio: ['.wav', '.ogg', '.mp3'],
        texture: ['.png', '.jpg', '.jpeg', '.tga', '.bmp', '.exr'],
      }
      const allowedExts = new Set(asset_types.flatMap(t => typeExtMap[t] ?? []))
      issues = rawIssues.filter(i => {
        const ext = '.' + (i.asset_path.split('.').pop() ?? '')
        return allowedExts.has(ext) || allowedExts.size === 0
      })
    }

    const output: Output = {
      issues,
      issue_count: issues.length,
      assets_checked: assetsChecked,
      clean: issues.length === 0,
      duration_ms: Date.now() - start,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
