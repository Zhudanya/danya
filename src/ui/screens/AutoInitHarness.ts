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

  // Check if harness is already initialized (not just .danya/ existing —
  // Kode creates .danya/settings.local.json before our init runs)
  const harnessMarker = join(cwd, '.danya', 'gate-chain.json')
  if (existsSync(harnessMarker)) return

  try {
    // Run init silently — generates .danya/ with full harness + consolidates legacy
    initDanyaProject(cwd, false).catch(() => {
      // Ignore errors — auto-init is best-effort
    })
  } catch {
    // Ignore errors — auto-init is best-effort
  }
}
