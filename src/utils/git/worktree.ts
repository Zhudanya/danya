/**
 * Git Worktree Management — native worktree isolation for Danya agents.
 *
 * Provides API for creating, managing, and cleaning up git worktrees.
 * Worktrees enable parallel agent execution with full file-system isolation.
 *
 * Lifecycle: create → agent executes in worktree → verify → merge/cleanup
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join, resolve } from 'path'

export type WorktreeInfo = {
  path: string
  branch: string
  slug: string
  createdAt: number
  baseCommit: string
}

const WORKTREE_DIR = '.worktrees'

/**
 * Create an isolated git worktree for an agent.
 * Returns worktree info including path and branch name.
 */
export function createAgentWorktree(
  slug: string,
  projectRoot?: string,
): WorktreeInfo {
  const root = projectRoot || process.cwd()
  const worktreeBase = join(root, WORKTREE_DIR)
  mkdirSync(worktreeBase, { recursive: true })

  const worktreePath = join(worktreeBase, slug)
  const branch = `wt/${slug}`

  // Get current HEAD commit for later comparison
  const baseCommit = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf-8' }).trim()

  // Create worktree with new branch
  execSync(`git worktree add -b "${branch}" "${worktreePath}" HEAD`, {
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
 */
export function worktreeHasChanges(info: WorktreeInfo): boolean {
  try {
    const diff = execSync(`git diff "${info.baseCommit}" HEAD --stat`, {
      cwd: info.path,
      encoding: 'utf-8',
    }).trim()
    return diff.length > 0
  } catch {
    return false
  }
}

/**
 * Merge a worktree's changes back to the main branch.
 * Uses a lock file to prevent concurrent merges.
 * Returns true if merge succeeded.
 */
export function mergeWorktree(
  info: WorktreeInfo,
  projectRoot?: string,
): { success: boolean; error?: string } {
  const root = projectRoot || process.cwd()
  const lockDir = join(root, WORKTREE_DIR, '.merge-lock')

  // Acquire lock (atomic mkdir)
  let lockAcquired = false
  const maxWait = 30000
  const start = Date.now()
  while (!lockAcquired && Date.now() - start < maxWait) {
    try {
      mkdirSync(lockDir)
      lockAcquired = true
    } catch {
      // Lock held by another merge, wait
      execSync('sleep 0.5')
    }
  }

  if (!lockAcquired) {
    return { success: false, error: 'Could not acquire merge lock (timeout)' }
  }

  try {
    execSync(`git merge "${info.branch}" --no-edit`, {
      cwd: root,
      stdio: 'pipe',
    })
    return { success: true }
  } catch (e: any) {
    // Merge conflict — abort
    try {
      execSync('git merge --abort', { cwd: root, stdio: 'pipe' })
    } catch { /* already clean */ }
    return { success: false, error: 'Merge conflict' }
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
  const hasChanges = worktreeHasChanges(info)

  if (hasChanges && options.keepIfChanged) {
    // Remove worktree but keep branch for manual inspection
    try {
      execSync(`git worktree remove "${info.path}" --force`, { cwd: root, stdio: 'pipe' })
    } catch { /* may already be removed */ }
    return { cleaned: false, preserved: true }
  }

  // Full cleanup: remove worktree + branch
  try {
    execSync(`git worktree remove "${info.path}" --force`, { cwd: root, stdio: 'pipe' })
  } catch { /* ok */ }
  try {
    execSync(`git branch -D "${info.branch}"`, { cwd: root, stdio: 'pipe' })
  } catch { /* ok */ }

  return { cleaned: true, preserved: false }
}

/**
 * List all active worktrees.
 */
export function listWorktrees(projectRoot?: string): string[] {
  const root = projectRoot || process.cwd()
  try {
    const output = execSync('git worktree list --porcelain', { cwd: root, encoding: 'utf-8' })
    return output
      .split('\n')
      .filter(line => line.startsWith('worktree '))
      .map(line => line.replace('worktree ', ''))
      .filter(path => path.includes(WORKTREE_DIR))
  } catch {
    return []
  }
}
