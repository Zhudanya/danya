/**
 * Phase 2 Milestone Verification
 * Milestone: "/auto-work '添加排序功能' 跑完全流程"
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import { classifyRequirement } from '../src/pipeline/stages/classify'
import { buildAutoWorkPrompt } from '../src/pipeline/autoWork'
import { buildAutoGugfixPrompt } from '../src/pipeline/autoBugfix'
import { buildParallelExecutePrompt } from '../src/pipeline/parallelExecute'
import { computeWaves, CyclicDependencyError, formatWaveSchedule, type Task } from '../src/pipeline/waveCompute'
import { formatPipelineReport, type PipelineResult } from '../src/pipeline/types'
import { checkReviewRatchet } from '../src/pipeline/stages/review'
import { KnowledgeSedimentTool } from '../src/tools/game/KnowledgeSediment/KnowledgeSediment'
import { GateChainTool } from '../src/tools/game/GateChain/GateChain'

let passed = 0
let failed = 0

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✅ ${name}`); passed++ }
  else { console.log(`  ❌ ${name}`); failed++ }
}

console.log('\n═══════════════════════════════════════════')
console.log('  Phase 2 Milestone Verification')
console.log('═══════════════════════════════════════════\n')

// ── 1. Classification ───────────────────────────
console.log('1. Requirement Classification')
assert(classifyRequirement('fix the login bug').type === 'bug', '"fix the login bug" → bug')
assert(classifyRequirement('修复 NPC 不刷新的 bug').type === 'bug', '"修复 NPC bug" → bug')
assert(classifyRequirement('add inventory sorting').type === 'feature', '"add inventory sorting" → feature')
assert(classifyRequirement('refactor the config system').type === 'refactor', '"refactor config" → refactor')
assert(classifyRequirement('implement weapon upgrade').type === 'feature', '"implement weapon" → feature')

// ── 2. Pipeline Prompts ─────────────────────────
console.log('\n2. Pipeline Prompt Generation')
{
  const autoWorkPrompt = buildAutoWorkPrompt('Add inventory sorting feature')
  assert(autoWorkPrompt.includes('Stage 0: Classify'), 'auto-work prompt has Stage 0')
  assert(autoWorkPrompt.includes('Stage 1: Plan'), 'auto-work prompt has Stage 1')
  assert(autoWorkPrompt.includes('Stage 2: Code'), 'auto-work prompt has Stage 2')
  assert(autoWorkPrompt.includes('Stage 3: Review'), 'auto-work prompt has Stage 3')
  assert(autoWorkPrompt.includes('Stage 4: Commit'), 'auto-work prompt has Stage 4')
  assert(autoWorkPrompt.includes('Stage 5: Knowledge'), 'auto-work prompt has Stage 5')
  assert(autoWorkPrompt.includes('Stage 6: Harness'), 'auto-work prompt has Stage 6')
  assert(autoWorkPrompt.includes('Quality ratchet'), 'auto-work prompt mentions ratchet')
  assert(autoWorkPrompt.includes('No push'), 'auto-work prompt says no push')

  const bugfixPrompt = buildAutoGugfixPrompt('NPC schedule not advancing')
  assert(bugfixPrompt.includes('Reproduce'), 'auto-bugfix prompt has reproduce stage')
  assert(bugfixPrompt.includes('5 rounds'), 'auto-bugfix prompt allows 5 rounds')
  assert(bugfixPrompt.includes('NOT guess'), 'auto-bugfix says no guessing')

  const parallelPrompt = buildParallelExecutePrompt('Add weapon system', 'prepare')
  assert(parallelPrompt.includes('Decompose'), 'parallel-execute prompt has decompose')
  assert(parallelPrompt.includes('worktree'), 'parallel-execute prompt mentions worktree')
  assert(parallelPrompt.includes('depends'), 'parallel-execute prompt explains depends')
}

// ── 3. Wave Computation ─────────────────────────
console.log('\n3. Wave Computation')
{
  // No deps → 1 wave
  const noDeps: Task[] = [
    { id: '01', depends: [], description: 'Task A' },
    { id: '02', depends: [], description: 'Task B' },
    { id: '03', depends: [], description: 'Task C' },
  ]
  const waves1 = computeWaves(noDeps)
  assert(waves1.length === 1, '3 tasks, no deps → 1 wave')
  assert(waves1[0]!.tasks.length === 3, 'All 3 tasks in wave 1')

  // Chain deps → 3 waves
  const chainDeps: Task[] = [
    { id: '01', depends: [], description: 'Base' },
    { id: '02', depends: ['01'], description: 'Middle' },
    { id: '03', depends: ['02'], description: 'Top' },
  ]
  const waves2 = computeWaves(chainDeps)
  assert(waves2.length === 3, 'Chain deps → 3 waves')
  assert(waves2[0]!.tasks[0]!.id === '01', 'Wave 1 has task 01')
  assert(waves2[1]!.tasks[0]!.id === '02', 'Wave 2 has task 02')
  assert(waves2[2]!.tasks[0]!.id === '03', 'Wave 3 has task 03')

  // Diamond deps → 3 waves
  const diamond: Task[] = [
    { id: '01', depends: [], description: 'Base' },
    { id: '02', depends: ['01'], description: 'Left' },
    { id: '03', depends: ['01'], description: 'Right' },
    { id: '04', depends: ['02', '03'], description: 'Top' },
  ]
  const waves3 = computeWaves(diamond)
  assert(waves3.length === 3, 'Diamond deps → 3 waves')
  assert(waves3[1]!.tasks.length === 2, 'Wave 2 has 2 parallel tasks')

  // Circular deps → error
  const circular: Task[] = [
    { id: '01', depends: ['02'], description: 'A' },
    { id: '02', depends: ['01'], description: 'B' },
  ]
  let caughtError = false
  try { computeWaves(circular) } catch (e) { caughtError = e instanceof CyclicDependencyError }
  assert(caughtError, 'Circular deps → CyclicDependencyError')

  // Format display
  const display = formatWaveSchedule(waves3)
  assert(display.includes('Wave 1'), 'Wave display shows Wave 1')
  assert(display.includes('Wave 3'), 'Wave display shows Wave 3')
}

// ── 4. Pipeline Report Format ───────────────────
console.log('\n4. Pipeline Report Formatting')
{
  const result: PipelineResult = {
    requirement: 'Add sorting',
    type: 'feature',
    stages: [
      { name: 'Classify', status: 'passed', duration_ms: 800, detail: 'feature' },
      { name: 'Plan', status: 'passed', duration_ms: 12000, detail: '3 files' },
      { name: 'Code', status: 'passed', duration_ms: 85000, detail: '2 rounds' },
      { name: 'Review', status: 'passed', duration_ms: 15000, detail: '88/100' },
      { name: 'Commit', status: 'passed', duration_ms: 2000 },
      { name: 'Sediment', status: 'passed', duration_ms: 3000 },
    ],
    review_score: 88,
    commit_hash: 'abc123',
    status: 'completed',
    total_duration_ms: 120000,
  }
  const report = formatPipelineReport(result)
  assert(report.includes('AUTO-WORK COMPLETE'), 'Report has COMPLETE header')
  assert(report.includes('Add sorting'), 'Report has requirement')
  assert(report.includes('feature'), 'Report has type')
  assert(report.includes('88/100'), 'Report has review score')
  assert(report.includes('Ready to push'), 'Report has push suggestion')

  // Terminated report
  const terminated: PipelineResult = {
    requirement: 'Fix bug',
    type: 'bug',
    stages: [{ name: 'Code', status: 'failed', duration_ms: 5000, detail: 'build failed' }],
    status: 'terminated',
    terminated_at: 'Code',
    total_duration_ms: 5000,
  }
  const failReport = formatPipelineReport(terminated)
  assert(failReport.includes('TERMINATED'), 'Failed report has TERMINATED')
  assert(failReport.includes('Code'), 'Failed report shows termination stage')
}

// ── 5. Review Ratchet ───────────────────────────
console.log('\n5. Review Ratchet (pipeline context)')
assert(checkReviewRatchet(85, null).passed, 'No previous → pass')
assert(checkReviewRatchet(90, 85).passed, '90 > 85 → pass')
assert(!checkReviewRatchet(70, 85).passed, '70 < 85 → fail')

// ── 6. KnowledgeSediment Tool ───────────────────
console.log('\n6. KnowledgeSediment Tool')
{
  const TMP = join(tmpdir(), `danya-p2-sediment-${Date.now()}`)
  mkdirSync(TMP, { recursive: true })

  const origCwd = process.cwd()
  process.chdir(TMP)

  const gen = KnowledgeSedimentTool.call(
    { type: 'feature', title: 'Test Feature', content: { summary: 'Added sorting', files_changed: ['sort.go'] } },
    { messageId: 'test', abortController: new AbortController(), readFileTimestamps: {} },
  )
  let sedimentResult: any = null
  for await (const ev of gen) { if (ev.type === 'result') sedimentResult = ev.data }

  process.chdir(origCwd)

  assert(sedimentResult !== null, 'KnowledgeSediment produces result')
  assert(sedimentResult?.created === true, 'File was created')
  assert(existsSync(sedimentResult?.file_path), 'Doc file exists on disk')
  if (sedimentResult?.file_path) {
    const content = readFileSync(sedimentResult.file_path, 'utf-8')
    assert(content.includes('Test Feature'), 'Doc contains title')
    assert(content.includes('Added sorting'), 'Doc contains summary')
  }
}

// ── 7. GateChain Tool exists ────────────────────
console.log('\n7. GateChain Tool')
assert(GateChainTool.name === 'GateChain', 'GateChain tool exists')
assert(typeof GateChainTool.call === 'function', 'GateChain has call method')

// ── 8. Slash Commands ───────────────────────────
console.log('\n8. Slash Commands')
{
  const autoWork = require('../src/commands/auto-work')
  const cmd1 = autoWork.default ?? autoWork
  assert(cmd1.name === 'auto-work', '/auto-work command registered')
  const prompt1 = await cmd1.getPromptForCommand('Add sorting')
  assert(prompt1[0]?.content?.[0]?.text?.includes('Stage 0'), '/auto-work generates pipeline prompt')

  const autoBugfix = require('../src/commands/auto-bugfix')
  const cmd2 = autoBugfix.default ?? autoBugfix
  assert(cmd2.name === 'auto-bugfix', '/auto-bugfix command registered')

  const parallelExec = require('../src/commands/parallel-execute')
  const cmd3 = parallelExec.default ?? parallelExec
  assert(cmd3.name === 'parallel-execute', '/parallel-execute command registered')
}

// ── 9. Shell Scripts ────────────────────────────
console.log('\n9. Shell Scripts')
assert(existsSync('scripts/auto-work-loop.sh'), 'auto-work-loop.sh exists')
assert(existsSync('scripts/parallel-wave.sh'), 'parallel-wave.sh exists')
{
  const script = readFileSync('scripts/auto-work-loop.sh', 'utf-8')
  assert(script.includes('Stage 0: Classify'), 'Shell script has Stage 0')
  assert(script.includes('MAX_CODE_ROUNDS'), 'Shell script has retry config')
  assert(script.includes('git checkout'), 'Shell script has ratchet rollback')
}

// ── Summary ─────────────────────────────────────
console.log('\n═══════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════')

if (failed > 0) process.exit(1)
