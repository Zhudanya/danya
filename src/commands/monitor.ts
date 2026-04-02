/**
 * /monitor — View harness effectiveness metrics.
 */

import type { Command } from '@commands'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { getCwd } from '@utils/state'

const monitorCommand: Command = {
  name: 'monitor',
  description: 'View harness effectiveness metrics and data',
  isEnabled: true,
  isHidden: false,
  type: 'prompt',
  progressMessage: 'Analyzing harness metrics...',
  argumentHint: '[summary|tools|reviews|bugfixes|sessions] [days]',
  userFacingName() { return 'monitor' },
  async getPromptForCommand(args: string) {
    const dataDir = join(getCwd(), '.danya', 'monitor', 'data')
    const parts = args.trim().split(/\s+/)
    const metric = parts[0] || 'summary'
    const days = parts[1] || '7'

    // Check if data exists
    if (!existsSync(dataDir)) {
      return [{
        role: 'user' as const,
        content: [{ type: 'text' as const, text: `No monitor data found at .danya/monitor/data/.

Monitor data is collected automatically via PostToolUse and Stop hooks registered in .danya/settings.json. Data will accumulate as you use Danya.

Available metrics: summary, tools, reviews, bugfixes, sessions
Usage: /monitor [metric] [days]` }],
      }]
    }

    // Read available data files
    const files = readdirSync(dataDir).filter(f => f.endsWith('.jsonl'))
    const dataSummary: string[] = []
    for (const file of files) {
      try {
        const lines = readFileSync(join(dataDir, file), 'utf-8').trim().split('\n').filter(Boolean)
        dataSummary.push(`${file}: ${lines.length} entries`)
      } catch { /* skip */ }
    }

    return [{
      role: 'user' as const,
      content: [{ type: 'text' as const, text: `Analyze harness metrics from .danya/monitor/data/ for the last ${days} days.

Metric requested: ${metric}

Available data files:
${dataSummary.length > 0 ? dataSummary.map(s => `  - ${s}`).join('\n') : '  (no data yet)'}

## Analysis Instructions

For **summary**: Show overview of all metrics (tool usage count, session count, avg verify time, avg review score, bug fix success rate).

For **tools**: Show tool usage distribution (which tools are used most).

For **reviews**: Show review score trends (avg, min, max, pass rate, CRITICAL count).

For **bugfixes**: Show bug fix efficiency (avg rounds, success rate).

For **sessions**: Show session count and duration.

Read the JSONL files, parse entries within the date range, and present a formatted summary. Each line in the JSONL files is a JSON object with a "timestamp" field (Unix epoch).` }],
    }]
  },
} satisfies Command

export default monitorCommand
