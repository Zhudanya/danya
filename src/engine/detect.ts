import { existsSync } from 'fs'
import { join } from 'path'
import { globSync } from 'glob'

export type EngineType = 'unity' | 'unreal' | 'godot' | null
export type ServerLanguage = 'go' | 'cpp' | null

export interface ProjectDetection {
  engine: EngineType
  serverLanguage: ServerLanguage
  languages: string[]
}

export function detectEngine(projectPath: string): EngineType {
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

  // Check parent directories for workspace mode (e.g., workspace/client/ is Unity)
  // This handles the game-harness-engineering structure where client/ is a subdirectory
  const parentCandidates = ['client', 'server', 'game-client', 'game-server']
  for (const candidate of parentCandidates) {
    const subPath = join(projectPath, candidate)
    if (existsSync(subPath)) {
      const subEngine = detectEngine(subPath)
      if (subEngine) return subEngine
    }
  }

  return null
}

export function detectServerLanguage(projectPath: string): ServerLanguage {
  // Go: has go.mod
  if (existsSync(join(projectPath, 'go.mod'))) {
    return 'go'
  }

  // Go: has Makefile with go build references
  if (existsSync(join(projectPath, 'Makefile'))) {
    try {
      const { readFileSync } = require('fs')
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

  // Check server/ subdirectory
  const serverDir = join(projectPath, 'server')
  if (existsSync(serverDir) && projectPath !== serverDir) {
    return detectServerLanguage(serverDir)
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
      // Check if Godot project uses C#
      languages.push('C#') // Godot 4 supports both
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
