/**
 * /exit-worktree — Exit current worktree, merge or discard changes.
 */

import type { Command } from '@commands'

const exitWorktreeCommand: Command = {
  name: 'exit-worktree',
  description: 'Exit worktree and merge/discard changes',
  isEnabled: true,
  isHidden: false,
  type: 'prompt',
  progressMessage: 'Exiting worktree...',
  argumentHint: '[merge|discard|keep]',
  userFacingName() {
    return 'exit-worktree'
  },
  async getPromptForCommand(args: string) {
    const action = args.trim().toLowerCase() || 'merge'

    return [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `Exit the current git worktree with action: **${action}**

## Actions

- **merge**: Verify changes compile, then merge worktree branch into main and clean up.
- **discard**: Delete worktree and branch, losing all changes.
- **keep**: Remove worktree directory but keep the branch for later inspection.

## Steps for "${action}":

${action === 'merge' ? `1. Check if there are any changes: \`git diff HEAD --stat\`
2. If changes exist, run verification (build/compile check)
3. If verification passes:
   - \`cd <project-root>\`
   - \`git merge <worktree-branch> --no-edit\`
   - \`git worktree remove <worktree-path> --force\`
   - \`git branch -D <worktree-branch>\`
4. If verification fails, report errors and stay in worktree.` :
action === 'discard' ? `1. \`cd <project-root>\`
2. \`git worktree remove <worktree-path> --force\`
3. \`git branch -D <worktree-branch>\`
4. Report: all changes discarded.` :
`1. \`cd <project-root>\`
2. \`git worktree remove <worktree-path> --force\`
3. Keep branch: \`<worktree-branch>\` preserved for later.
4. Report: branch name for manual merge later.`}

Change working directory back to the project root after cleanup.`,
          },
        ],
      },
    ]
  },
} satisfies Command

export default exitWorktreeCommand
