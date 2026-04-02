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

    return [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `Create a git worktree for isolated work.

Execute the following steps:
1. Run this code to create the worktree:
\`\`\`typescript
import { createAgentWorktree } from '../../utils/git/worktree'
const info = createAgentWorktree('${name}')
\`\`\`

Or use bash:
\`\`\`bash
mkdir -p .worktrees
git worktree add -b "wt/${name}" ".worktrees/${name}" HEAD
cd .worktrees/${name}
\`\`\`

2. After creating, change your working directory to the worktree path.
3. All subsequent file edits will happen in the worktree (isolated from main branch).
4. When done, use /exit-worktree to merge back or discard.

Report the worktree path and branch name.`,
          },
        ],
      },
    ]
  },
} satisfies Command

export default enterWorktreeCommand
