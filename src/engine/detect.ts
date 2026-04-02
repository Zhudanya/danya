import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { globSync } from 'glob'

export type EngineType = 'unity' | 'unreal' | 'godot' | null
export type ServerLanguage = 'go' | 'cpp' | null

export interface ProjectDetection {
  engine: EngineType
  serverLanguage: ServerLanguage
  languages: string[]
}

export function detectEngine(projectPath: string, depth: number = 0): EngineType {
  // Unity: has ProjectSettings/ and Assets/ directories
  if (
    existsSync(join(projectPath, 'ProjectSettings')) &&
    existsSync(join(projectPath, 'Assets'))
  ) {
    return 'unity'
  }

  // Unreal: has *.uproject file
  try {
    const uprojectFiles = globSync('*.uproject', { cwd: projectPath })
    if (uprojectFiles.length > 0) {
      return 'unreal'
    }
  } catch {
    // glob may fail on invalid paths
  }

  // Godot: has project.godot file
  if (existsSync(join(projectPath, 'project.godot'))) {
    return 'godot'
  }

  // Check subdirectories for workspace mode (max depth 1 to prevent infinite recursion)
  if (depth < 1) {
    const subCandidates = ['client', 'server', 'game-client', 'game-server']
    for (const candidate of subCandidates) {
      const subPath = join(projectPath, candidate)
      if (existsSync(subPath)) {
        const subEngine = detectEngine(subPath, depth + 1)
        if (subEngine) return subEngine
      }
    }
  }

  return null
}

export function detectServerLanguage(projectPath: string, depth: number = 0): ServerLanguage {
  // Go: has go.mod
  if (existsSync(join(projectPath, 'go.mod'))) {
    return 'go'
  }

  // Go: has Makefile with go build references
  if (existsSync(join(projectPath, 'Makefile'))) {
    try {
      const makefile = readFileSync(join(projectPath, 'Makefile'), 'utf-8')
      if (makefile.includes('go build') || makefile.includes('go test')) {
        return 'go'
      }
    } catch {
      // ignore read errors
    }
  }

  // C++: has CMakeLists.txt
  if (existsSync(join(projectPath, 'CMakeLists.txt'))) {
    return 'cpp'
  }

  // Check server/ subdirectory (max depth 1)
  if (depth < 1) {
    const serverDir = join(projectPath, 'server')
    if (existsSync(serverDir)) {
      return detectServerLanguage(serverDir, depth + 1)
    }
  }

  return null
}

export function detectLanguages(engine: EngineType, serverLanguage: ServerLanguage): string[] {
  const languages: string[] = []

  switch (engine) {
    case 'unity':
      languages.push('C#')
      break
    case 'unreal':
      languages.push('C++')
      break
    case 'godot':
      languages.push('GDScript')
      break
  }

  switch (serverLanguage) {
    case 'go':
      languages.push('Go')
      break
    case 'cpp':
      if (!languages.includes('C++')) {
        languages.push('C++')
      }
      break
  }

  if (languages.length === 0) {
    languages.push('Unknown')
  }

  return languages
}

export function detectProject(projectPath: string): ProjectDetection {
  const engine = detectEngine(projectPath)
  const serverLanguage = detectServerLanguage(projectPath)
  const languages = detectLanguages(engine, serverLanguage)

  return { engine, serverLanguage, languages }
}

// ── Workspace Detection ────────────────────────────────

export type WorkspaceType = 'workspace' | 'single-project'

export interface SubProjectInfo {
  name: string
  path: string
  engine: EngineType
  serverLanguage: ServerLanguage
  role: 'client' | 'server' | 'shared' | 'unknown'
}

export interface WorkspaceDetection {
  type: WorkspaceType
  rootPath: string
  subProjects: SubProjectInfo[]
}

function inferRole(name: string, engine: EngineType, serverLanguage: ServerLanguage): SubProjectInfo['role'] {
  const lower = name.toLowerCase()
  if (lower.includes('client') || lower.includes('game-client')) return 'client'
  if (lower.includes('server') || lower.includes('game-server')) return 'server'
  if (lower.includes('shared') || lower.includes('common')) return 'shared'
  if (engine) return 'client'
  if (serverLanguage) return 'server'
  return 'unknown'
}

export function detectWorkspace(rootPath: string): WorkspaceDetection {
  const subProjects: SubProjectInfo[] = []

  try {
    const entries = readdirSync(rootPath) as string[]
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'Docs' || entry === 'Tools') continue
      const subPath = join(rootPath, entry)
      try {
        if (!statSync(subPath).isDirectory()) continue
      } catch { continue }

      const engine = detectEngine(subPath)
      const serverLanguage = detectServerLanguage(subPath)

      if (engine || serverLanguage) {
        subProjects.push({
          name: entry,
          path: subPath,
          engine,
          serverLanguage,
          role: inferRole(entry, engine, serverLanguage),
        })
      }
    }
  } catch {
    // ignore read errors
  }

  if (subProjects.length >= 2) {
    return { type: 'workspace', rootPath, subProjects }
  }

  return { type: 'single-project', rootPath, subProjects: [] }
}
