import type { ImportStatement } from './importParser'

export type LayerRule = {
  name: string
  layers: string[]  // ordered lowest→highest: lower cannot import higher
  pathToLayer: Record<string, string>  // path pattern → layer name
  namespaceToLayer?: Record<string, string>  // namespace/module → layer name
}

export type Violation = {
  type: 'forbidden_import' | 'layer_violation' | 'forbidden_zone_edit'
  file_path: string
  line: number
  message: string
  from_layer?: string
  to_layer?: string
  import_path?: string
}

// Built-in layer rules per engine
export const UNITY_LAYERS: LayerRule = {
  name: 'Unity 4-Layer',
  layers: ['Framework', 'Gameplay', 'Renderer', 'Tools'],
  pathToLayer: {
    'Scripts/Framework/': 'Framework',
    'Scripts/Gameplay/': 'Gameplay',
    'Scripts/Renderer/': 'Renderer',
    'Scripts/Tools/': 'Tools',
  },
  namespaceToLayer: {
    'FL.Framework': 'Framework',
    'FL.Gameplay': 'Gameplay',
    'FL.Renderer': 'Renderer',
    'FL.Update': 'Tools',
  },
}

export const GO_SERVER_LAYERS: LayerRule = {
  name: 'Go Server Layers',
  layers: ['base', 'pkg', 'common', 'servers'],
  pathToLayer: {
    'base/': 'base',
    'pkg/': 'pkg',
    'common/': 'common',
    'servers/': 'servers',
  },
}

export type GuardRule = {
  pattern: string
  description: string
  fix_hint: string
}

function getLayerForFile(filePath: string, rule: LayerRule): string | null {
  const normalized = filePath.replace(/\\/g, '/')
  for (const [pattern, layer] of Object.entries(rule.pathToLayer)) {
    if (normalized.includes(pattern)) return layer
  }
  return null
}

function getLayerForImport(importPath: string, rule: LayerRule): string | null {
  // Check namespace mapping first
  if (rule.namespaceToLayer) {
    for (const [ns, layer] of Object.entries(rule.namespaceToLayer)) {
      if (importPath.startsWith(ns)) return layer
    }
  }
  // Check path mapping
  for (const [pattern, layer] of Object.entries(rule.pathToLayer)) {
    if (importPath.includes(pattern)) return layer
  }
  return null
}

export function checkLayerViolations(
  imports: ImportStatement[],
  rule: LayerRule,
): Violation[] {
  const violations: Violation[] = []
  const layerOrder = rule.layers

  for (const imp of imports) {
    const fromLayer = getLayerForFile(imp.file_path, rule)
    const toLayer = getLayerForImport(imp.imported_path, rule)

    if (!fromLayer || !toLayer) continue
    if (fromLayer === toLayer) continue

    const fromIdx = layerOrder.indexOf(fromLayer)
    const toIdx = layerOrder.indexOf(toLayer)

    // Lower layer (lower index) importing higher layer (higher index) is a violation
    if (fromIdx < toIdx) {
      violations.push({
        type: 'layer_violation',
        file_path: imp.file_path,
        line: imp.line,
        message: `Layer violation: ${fromLayer} cannot import ${toLayer} (${imp.imported_path})`,
        from_layer: fromLayer,
        to_layer: toLayer,
        import_path: imp.imported_path,
      })
    }
  }

  return violations
}

export function checkForbiddenZones(
  filePaths: string[],
  guardRules: GuardRule[],
): Violation[] {
  const violations: Violation[] = []

  for (const filePath of filePaths) {
    const normalized = filePath.replace(/\\/g, '/')
    for (const rule of guardRules) {
      try {
        const regex = new RegExp(rule.pattern)
        if (regex.test(normalized)) {
          violations.push({
            type: 'forbidden_zone_edit',
            file_path: filePath,
            line: 0,
            message: `Forbidden zone: ${rule.description}. ${rule.fix_hint}`,
          })
          break
        }
      } catch {
        if (normalized.includes(rule.pattern)) {
          violations.push({
            type: 'forbidden_zone_edit',
            file_path: filePath,
            line: 0,
            message: `Forbidden zone: ${rule.description}. ${rule.fix_hint}`,
          })
          break
        }
      }
    }
  }

  return violations
}
