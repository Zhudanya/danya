import { readFileSync } from 'fs'
import type { ReviewIssue } from './scoringEngine'
import { assignDeduction } from './scoringEngine'
import { UNIVERSAL_CHECKS } from './checks/universal'
import { UNITY_CHECKS } from './checks/unity'
import { GO_CHECKS } from './checks/go'
import { UNREAL_CHECKS } from './checks/unreal'
import { GODOT_CHECKS } from './checks/godot'
import type { EngineType, ServerLanguage } from '../../../engine/detect'

export type MechanicalCheck = {
  id: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  category: 'architecture' | 'convention' | 'logic' | 'security' | 'performance'
  pattern: RegExp | null
  fileFilter: RegExp
  excludeFilter?: RegExp
  message: string
  suggestion?: string
}

export function getChecksForEngine(
  engine: EngineType,
  serverLanguage: ServerLanguage,
): MechanicalCheck[] {
  const checks: MechanicalCheck[] = [
    ...UNIVERSAL_CHECKS.filter(c => c.pattern !== null) as MechanicalCheck[],
  ]

  switch (engine) {
    case 'unity':
      checks.push(...UNITY_CHECKS.filter(c => c.pattern !== null) as MechanicalCheck[])
      break
    case 'unreal':
      checks.push(...UNREAL_CHECKS.filter(c => c.pattern !== null) as MechanicalCheck[])
      break
    case 'godot':
      checks.push(...GODOT_CHECKS.filter(c => c.pattern !== null) as MechanicalCheck[])
      break
  }

  if (serverLanguage === 'go') {
    checks.push(...GO_CHECKS.filter(c => c.pattern !== null) as MechanicalCheck[])
  }

  return checks
}

export function runMechanicalChecks(
  changedFiles: Array<{ path: string; content: string }>,
  engine: EngineType,
  serverLanguage: ServerLanguage,
): ReviewIssue[] {
  const checks = getChecksForEngine(engine, serverLanguage)
  const issues: ReviewIssue[] = []

  for (const file of changedFiles) {
    for (const check of checks) {
      // File filter
      if (!check.fileFilter.test(file.path)) continue
      if (check.excludeFilter?.test(file.path)) continue

      // Pattern match
      if (!check.pattern) continue

      const lines = file.content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (check.pattern.test(lines[i]!)) {
          issues.push({
            id: check.id,
            phase: 'mechanical',
            category: check.category,
            severity: check.severity,
            file_path: file.path,
            line: i + 1,
            message: check.message,
            suggestion: check.suggestion,
            deduction: assignDeduction(check.severity),
          })
        }
      }
    }
  }

  return issues
}
