import { Command } from '@commands'

export default {
  type: 'prompt',
  name: 'review',
  description: 'Score-based code review (100-pt system). Run before pushing.',
  isEnabled: true,
  isHidden: false,
  progressMessage: 'reviewing code changes',
  userFacingName() {
    return 'review'
  },
  async getPromptForCommand(args) {
    const mode = args?.trim() || 'standard'
    return [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Run the ScoreReview tool to perform a score-based code review on the current changes.

Parameters:
- mode: "${mode}"
- base_ref: "HEAD~1"

After the review:
1. Display the full review report (score, issues by category, verdict)
2. If PASS (score >= 80, no CRITICAL): confirm push-approved marker was created
3. If FAIL: list all issues with fix suggestions, show minimum fixes needed to pass

Available modes: quick (mechanical only), standard (mechanical + AI analysis), full (all + harness integrity)

Arguments provided: ${args || '(none — using standard mode)'}`,
          },
        ],
      },
    ]
  },
} satisfies Command
