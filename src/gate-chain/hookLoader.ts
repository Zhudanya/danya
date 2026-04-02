/**
 * Load hooks configuration from .danya/settings.json.
 * Bridges the gate chain config into the hook executor.
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { HooksConfig } from '../types/hooks'

let cachedHooksConfig: HooksConfig | null = null

export function loadHooksFromSettings(cwd: string): HooksConfig {
  if (cachedHooksConfig) return cachedHooksConfig

  const candidates = [
    join(cwd, '.danya', 'settings.json'),
  ]

  for (const path of candidates) {
    if (!existsSync(path)) continue
    try {
      const content = readFileSync(path, 'utf-8')
      const parsed = JSON.parse(content)
      if (parsed.hooks) {
        cachedHooksConfig = normalizeHooksConfig(parsed.hooks)
        return cachedHooksConfig
      }
    } catch {
      continue
    }
  }

  cachedHooksConfig = {}
  return cachedHooksConfig
}

export function resetHooksCache(): void {
  cachedHooksConfig = null
}

/**
 * Normalize settings.json hook format to our HooksConfig type.
 * Handles both old Kode format (PreToolUse/PostToolUse) and new Danya format.
 */
function normalizeHooksConfig(raw: Record<string, unknown>): HooksConfig {
  const config: HooksConfig = {}

  // Map settings.json keys to hook event names
  const keyMap: Record<string, string> = {
    PreToolUse: 'PreToolUse',
    PostToolUse: 'PostToolUse',
    pre_tool_use: 'PreToolUse',
    post_tool_use: 'PostToolUse',
    SessionStart: 'SessionStart',
    session_start: 'SessionStart',
    Stop: 'Stop',
    stop: 'Stop',
  }

  for (const [key, value] of Object.entries(raw)) {
    const eventName = keyMap[key] ?? key
    if (Array.isArray(value)) {
      (config as any)[eventName] = value.map((entry: any) => ({
        matcher: entry.matcher,
        commandPattern: entry.commandPattern,
        filePattern: entry.filePattern,
        hooks: Array.isArray(entry.hooks)
          ? entry.hooks.map((h: any) => ({
              command: h.command,
              timeout: h.timeout,
            }))
          : [{ command: entry.command, timeout: entry.timeout }],
        pluginName: entry.pluginName,
      }))
    }
  }

  return config
}
