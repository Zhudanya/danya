import { z } from 'zod'
import { existsSync, readFileSync } from 'fs'
import { join, relative } from 'path'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Absolute path to the game project root'),
  scope: z.enum(['changed', 'full']).optional()
    .describe('Scan scope: "changed" checks only git-modified files, "full" checks all shaders. Defaults to "changed"'),
})

type ShaderIssue = {
  file_path: string
  line: number
  type: 'variant_explosion' | 'syntax_error' | 'sampler_limit' | 'complexity_warning'
  message: string
}

type Output = {
  issues: ShaderIssue[]
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

function getShaderGlobs(engine: string): string[] {
  switch (engine) {
    case 'unity': return ['**/*.shader', '**/*.hlsl', '**/*.cginc']
    case 'unreal': return ['**/*.usf', '**/*.ush']
    case 'godot': return ['**/*.gdshader']
    default: return []
  }
}

function findShaderFiles(projectPath: string, engine: string, scope: string): string[] {
  const globs = getShaderGlobs(engine)
  if (globs.length === 0) return []

  if (scope === 'changed') {
    try {
      const { execSync } = require('child_process')
      const output = execSync('git diff --name-only HEAD', { cwd: projectPath, encoding: 'utf-8' })
      const stagedOutput = execSync('git diff --name-only --cached', { cwd: projectPath, encoding: 'utf-8' })
      const allChanged = new Set([...output.split('\n'), ...stagedOutput.split('\n')].map((f: string) => f.trim()).filter(Boolean))

      const extensions = new Set<string>()
      for (const g of globs) {
        const ext = g.split('.').pop()
        if (ext) extensions.add('.' + ext)
      }

      return [...allChanged].filter(f => {
        const dotIdx = f.lastIndexOf('.')
        if (dotIdx < 0) return false
        return extensions.has(f.substring(dotIdx))
      }).map(f => join(projectPath, f)).filter(f => existsSync(f))
    } catch {
      // Fall back to full scan if git isn't available
      return findShaderFiles(projectPath, engine, 'full')
    }
  }

  // Full scan
  try {
    const { globSync } = require('glob')
    const ignore = engine === 'godot' ? ['.godot/**'] : ['**/Library/**', '**/Intermediate/**']
    const pattern = globs.length === 1
      ? globs[0]
      : `**/*.{${globs.map(g => g.split('.').pop()).join(',')}}`
    return globSync(pattern, { cwd: projectPath, ignore, absolute: true })
  } catch {
    return []
  }
}

function checkVariantExplosion(content: string, filePath: string): ShaderIssue[] {
  const issues: ShaderIssue[] = []
  const lines = content.split('\n')
  const variantCounts: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/\b(multi_compile|shader_feature)(_local)?(_fragment|_vertex)?\b/)
    if (match) {
      // Count variants on this directive: number of keywords after the directive
      const parts = line.trim().split(/\s+/)
      const directiveIdx = parts.findIndex(p => p.match(/^#pragma$/))
      // Keywords after the pragma directive name
      const keywordCount = Math.max(parts.length - (directiveIdx + 2), 2)
      variantCounts.push(keywordCount)
    }
  }

  if (variantCounts.length > 0) {
    const totalCombinations = variantCounts.reduce((a, b) => a * b, 1)
    if (totalCombinations > 256) {
      issues.push({
        file_path: filePath,
        line: 1,
        type: 'variant_explosion',
        message: `Shader has ${variantCounts.length} multi_compile/shader_feature directives producing ~${totalCombinations} variant combinations (threshold: 256)`,
      })
    }
  }

  return issues
}

function checkSyntaxIssues(content: string, filePath: string): ShaderIssue[] {
  const issues: ShaderIssue[] = []
  const lines = content.split('\n')

  // Check for unclosed brackets
  let braceDepth = 0
  let parenDepth = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip single-line comments
    const codePart = line.replace(/\/\/.*$/, '')
    for (const ch of codePart) {
      if (ch === '{') braceDepth++
      if (ch === '}') braceDepth--
      if (ch === '(') parenDepth++
      if (ch === ')') parenDepth--
    }
    if (braceDepth < 0) {
      issues.push({ file_path: filePath, line: i + 1, type: 'syntax_error', message: 'Unexpected closing brace }' })
      braceDepth = 0
    }
    if (parenDepth < 0) {
      issues.push({ file_path: filePath, line: i + 1, type: 'syntax_error', message: 'Unexpected closing parenthesis )' })
      parenDepth = 0
    }
  }
  if (braceDepth > 0) {
    issues.push({ file_path: filePath, line: lines.length, type: 'syntax_error', message: `${braceDepth} unclosed brace(s) at end of file` })
  }
  if (parenDepth > 0) {
    issues.push({ file_path: filePath, line: lines.length, type: 'syntax_error', message: `${parenDepth} unclosed parenthesis(es) at end of file` })
  }

  // Check for missing semicolons after statements (HLSL-style)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    // Skip comments, preprocessor, empty, braces-only, struct/cbuffer/if/else/for
    if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*') || line.startsWith('*')) continue
    if (/^[{}]$/.test(line)) continue
    if (/^(struct|cbuffer|if|else|for|while|switch|case|default|return\s*;|void|float|half|int|uint|CGPROGRAM|ENDCG|SubShader|Pass|Tags|Shader|Properties|Fallback|Category)/.test(line)) continue
    // Lines ending with assignment or declaration but no semicolon
    if (/^(float|half|int|uint|fixed|sampler|Texture)\d*\s+\w+.*[^;{},)\s]$/.test(line)) {
      // Check if next line is a continuation
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
      if (nextLine && !nextLine.startsWith('{') && !nextLine.startsWith('//') && !nextLine.startsWith('#')) {
        issues.push({ file_path: filePath, line: i + 1, type: 'syntax_error', message: 'Possible missing semicolon' })
      }
    }
  }

  return issues
}

function checkSamplerCount(content: string, filePath: string): ShaderIssue[] {
  const issues: ShaderIssue[] = []
  const samplerPattern = /\b(sampler2D|sampler3D|samplerCUBE|Texture2D|Texture3D|TextureCube|SamplerState)\b/g
  const matches = content.match(samplerPattern)
  if (matches && matches.length > 16) {
    issues.push({
      file_path: filePath,
      line: 1,
      type: 'sampler_limit',
      message: `Shader declares ${matches.length} sampler/texture bindings (mobile limit: 16)`,
    })
  }
  return issues
}

function checkComplexity(content: string, filePath: string): ShaderIssue[] {
  const issues: ShaderIssue[] = []
  const lines = content.split('\n')

  // Find function bodies and count arithmetic operations
  let inFunction = false
  let funcStartLine = 0
  let funcName = ''
  let braceDepth = 0
  let opCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const codePart = line.replace(/\/\/.*$/, '')

    // Detect function definition (simplified: type name(...) {)
    if (!inFunction) {
      const funcMatch = codePart.match(/\b(\w+)\s+(\w+)\s*\([^)]*\)\s*\{?/)
      if (funcMatch && !['if', 'for', 'while', 'switch', 'else', 'struct', 'cbuffer'].includes(funcMatch[2])) {
        if (codePart.includes('{')) {
          inFunction = true
          funcStartLine = i + 1
          funcName = funcMatch[2]
          // Count all braces on this line (handles one-liners like: float foo() { return 1.0; })
          braceDepth = 0
          for (const ch of codePart) {
            if (ch === '{') braceDepth++
            if (ch === '}') braceDepth--
          }
          opCount = 0
          if (braceDepth <= 0) { inFunction = false; continue }
          continue
        }
      }
    }

    if (inFunction) {
      for (const ch of codePart) {
        if (ch === '{') braceDepth++
        if (ch === '}') braceDepth--
      }

      // Count arithmetic operations
      const ops = codePart.match(/[+\-*/]=?|sin|cos|tan|pow|sqrt|lerp|saturate|dot|cross|normalize|mul|abs|floor|ceil|frac|step|smoothstep|clamp|min|max/g)
      if (ops) opCount += ops.length

      if (braceDepth <= 0) {
        if (opCount > 100) {
          issues.push({
            file_path: filePath,
            line: funcStartLine,
            type: 'complexity_warning',
            message: `Function '${funcName}' has ~${opCount} arithmetic operations (threshold: 100)`,
          })
        }
        inFunction = false
        braceDepth = 0
        opCount = 0
      }
    }
  }

  return issues
}

function analyzeShaderFile(filePath: string, engine: string): ShaderIssue[] {
  let content: string
  try {
    content = readFileSync(filePath, 'utf-8')
  } catch {
    return []
  }

  const issues: ShaderIssue[] = []

  // Variant explosion (primarily Unity)
  if (engine === 'unity') {
    issues.push(...checkVariantExplosion(content, filePath))
  }

  // Syntax checks
  issues.push(...checkSyntaxIssues(content, filePath))

  // Sampler count
  issues.push(...checkSamplerCount(content, filePath))

  // Complexity
  issues.push(...checkComplexity(content, filePath))

  return issues
}

export const ShaderCheckTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'check shader validate hlsl glsl variant explosion sampler complexity',
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
    return `Checking shaders: ${project_path} (scope: ${scope ?? 'changed'})`
  },

  renderResultForAssistant(output: Output): string {
    if (output.issue_count === 0) {
      return `Shader check passed: ${output.files_checked} files checked, no issues found [${output.engine}] (${output.duration_ms}ms)`
    }
    const issueLines = output.issues
      .slice(0, 20)
      .map(i => `  [${i.type}] ${i.file_path}:${i.line}: ${i.message}`)
      .join('\n')
    const more = output.issue_count > 20 ? `\n  ... and ${output.issue_count - 20} more` : ''
    return `Shader check found ${output.issue_count} issues (${output.files_checked} files checked, ${output.engine}, ${output.duration_ms}ms)\n${issueLines}${more}`
  },

  async *call(
    { project_path, scope }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()
    const effectiveScope = scope ?? 'changed'
    const engine = detectEngine(project_path)

    if (!engine) {
      const output: Output = {
        issues: [],
        issue_count: 0,
        files_checked: 0,
        engine: 'unknown',
        duration_ms: Date.now() - start,
      }
      yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
      return
    }

    const shaderFiles = findShaderFiles(project_path, engine, effectiveScope)
    const issues: ShaderIssue[] = []

    for (const file of shaderFiles) {
      const relPath = relative(project_path, file)
      const fileIssues = analyzeShaderFile(file, engine)
      // Normalize paths to be relative
      for (const issue of fileIssues) {
        issue.file_path = relPath
      }
      issues.push(...fileIssues)
    }

    const output: Output = {
      issues,
      issue_count: issues.length,
      files_checked: shaderFiles.length,
      engine,
      duration_ms: Date.now() - start,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
