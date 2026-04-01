import { Command } from '@commands'
import { buildAutoGugfixPrompt } from '../pipeline/autoBugfix'

export default {
  type: 'prompt',
  name: 'auto-bugfix',
  description: 'Bug auto-fix pipeline: reproduce → fix (5 rounds) → review → commit → solidify',
  isEnabled: true,
  isHidden: false,
  progressMessage: 'running auto-bugfix pipeline',
  userFacingName() { return 'auto-bugfix' },
  async getPromptForCommand(args) {
    if (!args?.trim()) {
      return [{ role: 'user', content: [{ type: 'text', text: 'Error: /auto-bugfix requires a bug description. Usage: /auto-bugfix <bug description>' }] }]
    }
    return [{ role: 'user', content: [{ type: 'text', text: buildAutoGugfixPrompt(args.trim()) }] }]
  },
} satisfies Command
