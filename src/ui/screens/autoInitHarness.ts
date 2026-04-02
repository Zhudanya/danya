/**
 * Auto-init harness at startup.
 * Silently initializes .danya/ if it doesn't exist.
 * Consolidates legacy .claude/ and .codex/ content into .danya/.
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { initDanyaProject } from '../../commands/initProject'

let hasRun = false

export function autoInitHarness(cwd: string): void {
  if (hasRun) return
  hasRun = true

  const danyaDir = join(cwd, '.danya')
  if (existsSync(danyaDir)) return

  try {
    // Run init silently — generates .danya/ with full harness + consolidates legacy
    initDanyaProject(cwd, false).catch(() => {
      // Ignore errors — auto-init is best-effort
    })
  } catch {
    // Ignore errors — auto-init is best-effort
  }
}
