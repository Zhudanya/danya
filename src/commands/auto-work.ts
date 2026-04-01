import { Command } from '@commands'
import { buildAutoWorkPrompt } from '../pipeline/autoWork'

export default {
  type: 'prompt',
  name: 'auto-work',
  description: 'Full-auto development pipeline: classify → plan → code → verify → review → commit → sediment',
  isEnabled: true,
  isHidden: false,
  progressMessage: 'running auto-work pipeline',
  userFacingName() {
    return 'auto-work'
  },
  async getPromptForCommand(args) {
    if (!args?.trim()) {
      return [{
        role: 'user',
        content: [{ type: 'text', text: 'Error: /auto-work requires a requirement description. Usage: /auto-work <requirement>' }],
      }]
    }

    const prompt = buildAutoWorkPrompt(args.trim())

    return [{
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    }]
  },
} satisfies Command
