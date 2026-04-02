import type { Command } from '@commands'
import { markProjectOnboardingComplete } from '@components/ProjectOnboarding'
import { PROJECT_FILE } from '@constants/product'
import { initDanyaProject } from './initProject'
import { getCwd } from '@utils/state'

const command = {
  type: 'prompt',
  name: 'init',
  description: `Initialize Danya harness + ${PROJECT_FILE} for this project`,
  isEnabled: true,
  isHidden: false,
  progressMessage: 'initializing harness and analyzing codebase',
  userFacingName() {
    return 'init'
  },
  async getPromptForCommand(_args: string) {
    markProjectOnboardingComplete()

    // Run harness initialization (generates .danya/ with rules, commands, hooks, etc.)
    let harnessResult = ''
    try {
      const force = _args.includes('--force')
      harnessResult = await initDanyaProject(getCwd(), force)
    } catch (e: any) {
      harnessResult = `⚠️ Harness init failed: ${e.message}`
    }

    return [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${harnessResult}

---

Now please analyze this codebase and create a ${PROJECT_FILE} file containing:
1. Build/lint/test commands - especially for running a single test
2. Code style guidelines including imports, formatting, types, naming conventions, error handling, etc.

The file you create will be given to agentic coding agents (such as yourself) that operate in this repository. Make it about 20 lines long.
If there's already a ${PROJECT_FILE}, improve it.
If there are Cursor rules (in .cursor/rules/ or .cursorrules) or Copilot rules (in .github/copilot-instructions.md), make sure to include them.
Also review the .danya/rules/ files and customize them based on what you learn about this codebase.`,
          },
        ],
      },
    ]
  },
} satisfies Command

export default command
