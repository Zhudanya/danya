export { detectEngine, detectServerLanguage, detectProject } from './detect'
export type { EngineType, ServerLanguage, ProjectDetection } from './detect'
export { getUnityVariantPrompt } from './variants/unity'
export { getUnrealVariantPrompt } from './variants/unreal'
export { getGodotVariantPrompt } from './variants/godot'
export { getCppServerVariantPrompt } from './variants/cppServer'
export { getJavaServerVariantPrompt } from './variants/javaServer'
export { getNodeServerVariantPrompt } from './variants/nodeServer'

import type { EngineType, ServerLanguage } from './detect'
import { getUnityVariantPrompt } from './variants/unity'
import { getUnrealVariantPrompt } from './variants/unreal'
import { getGodotVariantPrompt } from './variants/godot'
import { getCppServerVariantPrompt } from './variants/cppServer'
import { getJavaServerVariantPrompt } from './variants/javaServer'
import { getNodeServerVariantPrompt } from './variants/nodeServer'

export function getEngineVariantPrompt(engine: EngineType): string {
  switch (engine) {
    case 'unity':
      return getUnityVariantPrompt()
    case 'unreal':
      return getUnrealVariantPrompt()
    case 'godot':
      return getGodotVariantPrompt()
    default:
      return ''
  }
}

export function getServerVariantPrompt(serverLanguage: ServerLanguage): string {
  switch (serverLanguage) {
    case 'cpp':
      return getCppServerVariantPrompt()
    case 'java':
      return getJavaServerVariantPrompt()
    case 'nodejs':
      return getNodeServerVariantPrompt()
    default:
      return ''
  }
}

export function getEngineDisplayName(engine: EngineType): string {
  switch (engine) {
    case 'unity': return 'Unity'
    case 'unreal': return 'Unreal Engine'
    case 'godot': return 'Godot'
    default: return 'None detected'
  }
}

export function getServerDisplayName(serverLanguage: ServerLanguage): string {
  switch (serverLanguage) {
    case 'go': return 'Go Server'
    case 'cpp': return 'C++ Server'
    case 'java': return 'Java Server'
    case 'nodejs': return 'Node.js Server'
    default: return 'None detected'
  }
}
