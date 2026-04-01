import { Command } from '@commands'
import { buildParallelExecutePrompt } from '../pipeline/parallelExecute'

export default {
  type: 'prompt',
  name: 'parallel-execute',
  description: 'Wave parallel execution: decompose → topological sort → worktree parallel → merge',
  isEnabled: true,
  isHidden: false,
  progressMessage: 'running parallel execution',
  userFacingName() { return 'parallel-execute' },
  async getPromptForCommand(args) {
    if (!args?.trim()) {
      return [{ role: 'user', content: [{ type: 'text', text: 'Usage: /parallel-execute prepare <requirement> OR /parallel-execute <tasks-dir>' }] }]
    }
    const trimmed = args.trim()
    const isPrepare = trimmed.startsWith('prepare ')
    const mode = isPrepare ? 'prepare' as const : 'execute' as const
    const content = isPrepare ? trimmed.slice(8).trim() : trimmed

    return [{ role: 'user', content: [{ type: 'text', text: buildParallelExecutePrompt(content, mode, mode === 'execute' ? content : undefined) }] }]
  },
} satisfies Command
