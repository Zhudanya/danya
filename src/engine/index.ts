export { detectEngine, detectServerLanguage, detectProject } from './detect'
export type { EngineType, ServerLanguage, ProjectDetection } from './detect'
export { getUnityVariantPrompt } from './variants/unity'
export { getUnrealVariantPrompt } from './variants/unreal'
export { getGodotVariantPrompt } from './variants/godot'

import type { EngineType } from './detect'
import { getUnityVariantPrompt } from './variants/unity'
import { getUnrealVariantPrompt } from './variants/unreal'
import { getGodotVariantPrompt } from './variants/godot'

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

export function getEngineDisplayName(engine: EngineType): string {
  switch (engine) {
    case 'unity': return 'Unity'
    case 'unreal': return 'Unreal Engine'
    case 'godot': return 'Godot'
    default: return 'None detected'
  }
}
