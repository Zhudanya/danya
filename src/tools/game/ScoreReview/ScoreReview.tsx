import { z } from 'zod'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'
import { calculateScore, type ReviewIssue } from './scoringEngine'
import { runMechanicalChecks } from './mechanicalChecks'
import { checkRatchet } from './qualityRatchet'
import { createPushApprovedMarker } from './pushApproved'
import { formatHumanReport, type ReviewReport } from './reportFormatter'
import { detectProject } from '../../../engine/detect'
import { getCwd } from '@utils/state'

const inputSchema = z.strictObject({
  files: z.array(z.string()).optional()
    .describe('Files to review. Default: all changed files from git diff'),
  base_ref: z.string().optional()
    .describe('Git ref to diff against. Default: HEAD~1'),
  previous_score: z.number().optional()
    .describe('Previous review score for quality ratchet enforcement'),
  mode: z.enum(['quick', 'standard', 'full']).optional()
    .describe('Review mode. quick=mechanical only, standard=mechanical+AI, full=all+harness. Default: standard'),
})

type Output = ReviewReport

function getChangedFiles(cwd: string, baseRef: string): string[] {
  try {
    const output = execSync(`git diff --name-only ${baseRef} 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null || git diff --name-only`, {
      cwd, encoding: 'utf-8', timeout: 10000,
    })
    return output.split('\n').filter(f => f.trim().length > 0)
  } catch {
    return []
  }
}

function getDiffStats(cwd: string, baseRef: string): { added: number; removed: number } {
  try {
    const output = execSync(`git diff --shortstat ${baseRef} 2>/dev/null`, {
      cwd, encoding: 'utf-8', timeout: 10000,
    })
    const addMatch = output.match(/(\d+) insertion/)
    const delMatch = output.match(/(\d+) deletion/)
    return {
      added: addMatch ? parseInt(addMatch[1]!, 10) : 0,
      removed: delMatch ? parseInt(delMatch[1]!, 10) : 0,
    }
  } catch {
    return { added: 0, removed: 0 }
  }
}

function getBranchName(cwd: string): string {
  try {
    return execSync('git branch --show-current 2>/dev/null', { cwd, encoding: 'utf-8' }).trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

function readFileContents(cwd: string, files: string[]): Array<{ path: string; content: string }> {
  return files.map(f => {
    const fullPath = f.startsWith('/') || f.includes(':') ? f : join(cwd, f)
    try {
      return { path: f, content: existsSync(fullPath) ? readFileSync(fullPath, 'utf-8') : '' }
    } catch {
      return { path: f, content: '' }
    }
  }).filter(f => f.content.length > 0)
}

export const ScoreReviewTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'score-based code review with quality ratchet',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return false }, // writes push-approved marker
  isConcurrencySafe() { return false },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  renderToolUseMessage({ files, mode }: z.infer<typeof inputSchema>) {
    return `Running code review (${mode ?? 'standard'})${files ? `: ${files.length} files` : ''}`
  },

  renderResultForAssistant(output: Output): string {
    return formatHumanReport(output)
  },

  async *call(
    { files, base_ref = 'HEAD~1', previous_score, mode = 'standard' }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const cwd = getCwd()
    const detection = detectProject(cwd)
    const changedFiles = files ?? getChangedFiles(cwd, base_ref)

    if (changedFiles.length === 0) {
      const emptyReport: Output = {
        score: { score: 100, passed: true, critical_count: 0, high_count: 0, medium_count: 0, total_deduction: 0 },
        issues: [],
        change_summary: { files_changed: 0, lines_added: 0, lines_removed: 0, modules: [] },
        base_ref,
        push_approved: true,
      }
      yield { type: 'result' as const, data: emptyReport, resultForAssistant: formatHumanReport(emptyReport) }
      return
    }

    // Read file contents for mechanical checks
    const fileContents = readFileContents(cwd, changedFiles)
    const allIssues: ReviewIssue[] = []

    // Phase 2: Mechanical checks
    yield { type: 'progress' as const, content: { phase: 'mechanical', status: 'running' } }
    const mechanicalIssues = runMechanicalChecks(fileContents, detection.engine, detection.serverLanguage)
    allIssues.push(...mechanicalIssues)

    // Phase 3: AI judgment (for standard and full modes)
    if (mode === 'standard' || mode === 'full') {
      yield { type: 'progress' as const, content: { phase: 'ai_judgment', status: 'running' } }
      // AI judgment is handled by the LLM in conversation context
      // The tool provides mechanical results; the model adds AI analysis
    }

    // Calculate score
    const score = calculateScore(allIssues)

    // Quality ratchet
    const ratchet = checkRatchet(score.score, previous_score ?? null)
    if (!ratchet.passed) {
      // Don't create push-approved if ratchet fails
    }

    // Diff stats
    const diffStats = getDiffStats(cwd, base_ref)

    // Modules (extract from file paths)
    const modules = [...new Set(changedFiles.map(f => {
      const parts = f.replace(/\\/g, '/').split('/')
      return parts.length > 1 ? parts[0]! : 'root'
    }))]

    const pushApproved = score.passed && ratchet.passed
    if (pushApproved) {
      createPushApprovedMarker(cwd, {
        score: score.score,
        branch: getBranchName(cwd),
        timestamp: new Date().toISOString(),
        reviewer: 'danya-agent',
      })
    }

    const report: Output = {
      score,
      issues: allIssues,
      change_summary: {
        files_changed: changedFiles.length,
        lines_added: diffStats.added,
        lines_removed: diffStats.removed,
        modules,
      },
      base_ref,
      push_approved: pushApproved,
    }

    yield { type: 'result' as const, data: report, resultForAssistant: formatHumanReport(report) }
  },
} satisfies Tool<typeof inputSchema, Output>
