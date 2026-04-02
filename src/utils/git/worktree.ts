/**
 * Git Worktree Management — native worktree isolation for Danya agents.
 *
 * Provides API for creating, managing, and cleaning up git worktrees.
 * Worktrees enable parallel agent execution with full file-system isolation.
 *
 * Lifecycle: create → agent executes in worktree → verify → merge/cleanup
 */

import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join, resolve } from 'path'

export type WorktreeInfo = {
  path: string
  branch: string
  slug: string
  createdAt: number
  baseCommit: string
}

const WORKTREE_DIR = '.worktrees'
const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/
const STALE_LOCK_MS = 60000 // 60 seconds

/**
 * Validate slug to prevent command injection.
 */
function validateSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid worktree slug: "${slug}". Only alphanumeric, hyphens, and underscores allowed.`)
  }
}

/**
 * Cross-platform sleep (works on Windows too).
 */
function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * Create an isolated git worktree for an agent.
 * Returns worktree info including path and branch name.
 */
export function createAgentWorktree(
  slug: string,
  projectRoot?: string,
): WorktreeInfo {
  validateSlug(slug)

  const root = projectRoot || process.cwd()
  const worktreeBase = join(root, WORKTREE_DIR)
  mkdirSync(worktreeBase, { recursive: true })

  const worktreePath = join(worktreeBase, slug)
  const branch = `wt/${slug}`

  // Get current HEAD commit for later comparison
  const baseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf-8' }).trim()

  // Create worktree with new branch
  execFileSync('git', ['worktree', 'add', '-b', branch, worktreePath, 'HEAD'], {
    cwd: root,
    stdio: 'pipe',
  })

  return {
    path: resolve(worktreePath),
    branch,
    slug,
    createdAt: Date.now(),
    baseCommit,
  }
}

/**
 * Check if a worktree has any changes compared to its base commit.
 * Returns { hasChanges, error } — error is set if detection failed.
 */
export function worktreeHasChanges(info: WorktreeInfo): { hasChanges: boolean; error?: string } {
  try {
    const diff = execFileSync('git', ['diff', info.baseCommit, 'HEAD', '--stat'], {
      cwd: info.path,
      encoding: 'utf-8',
    }).trim()
    return { hasChanges: diff.length > 0 }
  } catch (e: any) {
    return { hasChanges: false, error: e.message || 'Failed to check worktree changes' }
  }
}

/**
 * Merge a worktree's changes back to the main branch.
 * Uses a lock directory to prevent concurrent merges.
 */
export function mergeWorktree(
  info: WorktreeInfo,
  projectRoot?: string,
): { success: boolean; error?: string } {
  const root = projectRoot || process.cwd()
  const lockDir = join(root, WORKTREE_DIR, '.merge-lock')
  const lockPidFile = join(lockDir, 'pid')

  // Check if branch exists before attempting merge
  try {
    execFileSync('git', ['rev-parse', '--verify', info.branch], { cwd: root, stdio: 'pipe' })
  } catch {
    return { success: false, error: `Branch "${info.branch}" does not exist` }
  }

  // Acquire lock (atomic mkdir) with stale lock detection
  let lockAcquired = false
  const maxWait = 30000
  const start = Date.now()
  while (!lockAcquired && Date.now() - start < maxWait) {
    try {
      mkdirSync(lockDir)
      writeFileSync(lockPidFile, `${process.pid}:${Date.now()}`)
      lockAcquired = true
    } catch {
      // Lock exists — check if stale
      try {
        const lockContent = readFileSync(lockPidFile, 'utf-8')
        const lockTime = parseInt(lockContent.split(':')[1] || '0')
        if (Date.now() - lockTime > STALE_LOCK_MS) {
          // Stale lock — force remove
          rmSync(lockDir, { recursive: true })
          continue
        }
      } catch { /* lock file unreadable, wait */ }
      sleepMs(500)
    }
  }

  if (!lockAcquired) {
    return { success: false, error: 'Could not acquire merge lock (timeout)' }
  }

  try {
    execFileSync('git', ['merge', info.branch, '--no-edit'], {
      cwd: root,
      stdio: 'pipe',
    })
    return { success: true }
  } catch (e: any) {
    // Merge failed — abort and report actual error
    try {
      execFileSync('git', ['merge', '--abort'], { cwd: root, stdio: 'pipe' })
    } catch { /* already clean */ }
    const stderr = e.stderr?.toString() || ''
    const errorMsg = stderr.includes('CONFLICT') ? 'Merge conflict' : (stderr.slice(0, 200) || 'Merge failed')
    return { success: false, error: errorMsg }
  } finally {
    // Release lock
    try { rmSync(lockDir, { recursive: true }) } catch { /* ok */ }
  }
}

/**
 * Clean up a worktree and its branch.
 * If worktree has changes and keepIfChanged is true, preserves the branch.
 */
export function cleanupWorktree(
  info: WorktreeInfo,
  projectRoot?: string,
  options: { keepIfChanged?: boolean } = {},
): { cleaned: boolean; preserved: boolean } {
  const root = projectRoot || process.cwd()
  const { hasChanges, error } = worktreeHasChanges(info)

  // If detection failed, preserve by default to avoid data loss
  if (error && options.keepIfChanged) {
    try {
      execFileSync('git', ['worktree', 'remove', info.path, '--force'], { cwd: root, stdio: 'pipe' })
    } catch { /* may already be removed */ }
    return { cleaned: false, preserved: true }
  }

  if (hasChanges && options.keepIfChanged) {
    try {
      execFileSync('git', ['worktree', 'remove', info.path, '--force'], { cwd: root, stdio: 'pipe' })
    } catch { /* may already be removed */ }
    return { cleaned: false, preserved: true }
  }

  // Full cleanup: remove worktree + branch
  try {
    execFileSync('git', ['worktree', 'remove', info.path, '--force'], { cwd: root, stdio: 'pipe' })
  } catch { /* ok */ }
  try {
    execFileSync('git', ['branch', '-D', info.branch], { cwd: root, stdio: 'pipe' })
  } catch { /* ok */ }

  return { cleaned: true, preserved: false }
}

/**
 * List all active worktrees.
 */
export function listWorktrees(projectRoot?: string): string[] {
  const root = projectRoot || process.cwd()
  try {
    const output = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: root, encoding: 'utf-8' })
    return output
      .split('\n')
      .filter(line => line.startsWith('worktree '))
      .map(line => line.replace('worktree ', ''))
      .filter(path => path.includes(WORKTREE_DIR))
  } catch {
    return []
  }
}
