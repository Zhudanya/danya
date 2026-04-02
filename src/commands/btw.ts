/**
 * /btw — Send a side message to the agent without interrupting current work.
 * The message is injected as additional context for the agent to consider.
 */

import type { Command } from '@commands'

const btwCommand: Command = {
  name: 'btw',
  description: 'Send a side note without interrupting current work',
  isEnabled: true,
  isHidden: false,
  type: 'prompt',
  progressMessage: '',
  argumentHint: '<message>',
  userFacingName() {
    return 'btw'
  },
  async getPromptForCommand(args: string) {
    if (!args.trim()) {
      return [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: 'Usage: /btw <message> — send a side note for the agent to consider',
            },
          ],
        },
      ]
    }

    return [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `[Side note from user]: ${args.trim()}\n\nThis is additional context. Acknowledge briefly and continue with your current task.`,
          },
        ],
      },
    ]
  },
} satisfies Command

export default btwCommand
