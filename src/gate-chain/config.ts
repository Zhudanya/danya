import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { HooksConfig, HookMatcher } from '../types/hooks'

export type GateChainConfig = {
  gates: {
    guard: { enabled: boolean; rules_file?: string }
    syntax: { enabled: boolean }
    verify: { enabled: boolean; default_level?: string }
    commit: { enabled: boolean; pre_commit_checks?: string[] }
    review: { enabled: boolean }
    push: { enabled: boolean; require_review?: boolean }
  }
}

const DEFAULT_CONFIG: GateChainConfig = {
  gates: {
    guard: { enabled: true },
    syntax: { enabled: true },
    verify: { enabled: true, default_level: 'build' },
    commit: { enabled: true, pre_commit_checks: ['lint'] },
    review: { enabled: true },
    push: { enabled: true, require_review: true },
  },
}

export function loadGateChainConfig(cwd: string): GateChainConfig {
  const configPath = join(cwd, '.danya', 'gate-chain.json')
  if (!existsSync(configPath)) return DEFAULT_CONFIG

  try {
    const content = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return { gates: { ...DEFAULT_CONFIG.gates, ...parsed.gates } }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function generateHooksConfig(cwd: string, config: GateChainConfig): HooksConfig {
  const hooks: HooksConfig = {}
  const hooksDir = join(cwd, '.danya', 'hooks')

  if (config.gates.guard.enabled) {
    hooks.PreToolUse = hooks.PreToolUse ?? []
    hooks.PreToolUse.push({
      matcher: 'Edit|Write',
      hooks: [{ command: `bash "${join(hooksDir, 'guard.sh')}"`, timeout: 5000 }],
    })
  }

  if (config.gates.syntax.enabled) {
    hooks.PostToolUse = hooks.PostToolUse ?? []
    hooks.PostToolUse.push({
      matcher: 'Edit|Write',
      filePattern: '\\.(cs|go|cpp|h|gd)$',
      hooks: [{ command: `bash "${join(hooksDir, 'syntax-check.sh')}"`, timeout: 30000 }],
    })
  }

  if (config.gates.commit.enabled) {
    hooks.PreToolUse = hooks.PreToolUse ?? []
    hooks.PreToolUse.push({
      matcher: 'Bash',
      commandPattern: 'git\\s+commit',
      hooks: [{ command: `bash "${join(hooksDir, 'pre-commit.sh')}"`, timeout: 300000 }],
    })
  }

  if (config.gates.push.enabled) {
    hooks.PreToolUse = hooks.PreToolUse ?? []
    hooks.PreToolUse.push({
      matcher: 'Bash',
      commandPattern: 'git\\s+push',
      hooks: [{ command: `bash "${join(hooksDir, 'push-gate.sh')}"`, timeout: 5000 }],
    })

    hooks.PostToolUse = hooks.PostToolUse ?? []
    hooks.PostToolUse.push({
      matcher: 'Bash',
      commandPattern: 'git\\s+commit',
      hooks: [{ command: `bash "${join(hooksDir, 'post-commit.sh')}"`, timeout: 5000 }],
    })
  }

  return hooks
}
