/**
 * /enter-worktree — Create and enter a git worktree for isolated work.
 */

import type { Command } from '@commands'

const enterWorktreeCommand: Command = {
  name: 'enter-worktree',
  description: 'Create a git worktree for isolated file changes',
  isEnabled: true,
  isHidden: false,
  type: 'prompt',
  progressMessage: 'Creating worktree...',
  argumentHint: '[name]',
  userFacingName() {
    return 'enter-worktree'
  },
  async getPromptForCommand(args: string) {
    const name = args.trim() || `wt-${Date.now().toString(36)}`

    // Validate name: only safe characters
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '-')

    return [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `Create a git worktree for isolated work.

Execute these bash commands:
\`\`\`bash
mkdir -p .worktrees
git worktree add -b "wt/${safeName}" ".worktrees/${safeName}" HEAD
cd .worktrees/${safeName}
\`\`\`

After creating:
1. Change your working directory to \`.worktrees/${safeName}\`
2. All subsequent file edits will happen in the worktree (isolated from main branch)
3. The main branch is NOT affected by any changes you make here
4. When done, use \`/exit-worktree merge\` to merge back, or \`/exit-worktree discard\` to throw away changes

Report the worktree path and branch name.`,
          },
        ],
      },
    ]
  },
} satisfies Command

export default enterWorktreeCommand
