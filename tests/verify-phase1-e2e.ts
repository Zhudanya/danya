/**
 * Phase 1 End-to-End Verification
 * Tests the full wiring: hooks loaded → hooks fire → push blocked
 *
 * Milestone: "执行 /review 出评分报告；push 被门禁拦截"
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { execSync } from 'child_process'

import { initDanyaProject } from '../src/commands/initProject'
import { ScoreReviewTool } from '../src/tools/game/ScoreReview/ScoreReview'
import { createPushApprovedMarker, hasPushApprovedMarker, consumePushApprovedMarker } from '../src/tools/game/ScoreReview/pushApproved'

let passed = 0
let failed = 0

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✅ ${name}`); passed++ }
  else { console.log(`  ❌ ${name}`); failed++ }
}

console.log('\n═══════════════════════════════════════════')
console.log('  Phase 1 E2E Verification')
console.log('  "执行 /review 出评分报告；push 被门禁拦截"')
console.log('═══════════════════════════════════════════\n')

// ── Setup: create a Go project with danya init ──
const PROJECT = join(tmpdir(), `danya-e2e-${Date.now()}`)
mkdirSync(PROJECT, { recursive: true })

// Make it a Go project
writeFileSync(join(PROJECT, 'go.mod'), 'module example.com/server\n\ngo 1.21\n')

// Write a Go file with known issues
writeFileSync(join(PROJECT, 'handler.go'), `package main

import (
	"fmt"
)

func handleRequest() error {
	err := doSomething()
	_ = err
	go func() {
		doBackground()
	}()
	return fmt.Errorf("failed: %v", err)
}
`)

// Init git repo
try {
  execSync('git init && git add -A && git commit -m "initial"', { cwd: PROJECT, stdio: 'pipe' })
} catch {}

// ── Test 1: danya init scaffolds project ────────
console.log('1. danya init')
const initResult = await initDanyaProject(PROJECT)
assert(initResult.includes('✅'), 'init succeeds')
assert(existsSync(join(PROJECT, '.danya', 'settings.json')), 'settings.json created')
assert(existsSync(join(PROJECT, '.danya', 'hooks', 'push-gate.sh')), 'push-gate.sh created')
assert(existsSync(join(PROJECT, '.danya', 'guard-rules.json')), 'guard-rules.json created')

// Verify guard rules include Go patterns
const guardRules = JSON.parse(readFileSync(join(PROJECT, '.danya', 'guard-rules.json'), 'utf-8'))
assert(guardRules.some((r: any) => r.pattern.includes('orm')), 'Guard rules include ORM pattern')
assert(guardRules.some((r: any) => r.pattern.includes('_pb')), 'Guard rules include protobuf pattern')

// ── Test 2: Settings.json has correct hook format ─
console.log('\n2. Hook configuration')
const settings = JSON.parse(readFileSync(join(PROJECT, '.danya', 'settings.json'), 'utf-8'))
assert(Array.isArray(settings.hooks?.PreToolUse), 'PreToolUse hooks configured')
assert(Array.isArray(settings.hooks?.PostToolUse), 'PostToolUse hooks configured')

const preHooks = settings.hooks.PreToolUse
assert(preHooks.some((h: any) => h.matcher === 'Edit|Write'), 'Guard hook registered for Edit|Write')
assert(preHooks.some((h: any) => h.commandPattern === 'git\\s+push'), 'Push-gate hook registered')
assert(preHooks.some((h: any) => h.commandPattern === 'git\\s+commit'), 'Pre-commit hook registered')

// ── Test 3: ScoreReview on file with known issues ─
console.log('\n3. ScoreReview execution')

// Stage the Go file change
try {
  execSync('git add handler.go', { cwd: PROJECT, stdio: 'pipe' })
} catch {}

// Mock getCwd for ScoreReview
const originalCwd = process.cwd()
process.chdir(PROJECT)

// Make a change so git diff has something
writeFileSync(join(PROJECT, 'handler.go'), readFileSync(join(PROJECT, 'handler.go'), 'utf-8') + '\n// modified\n')

// Run ScoreReview with explicit files (bypassing git diff issues)
const reviewGen = ScoreReviewTool.call(
  { mode: 'quick', files: ['handler.go'] },
  { messageId: 'test', abortController: new AbortController(), readFileTimestamps: {} },
)

let reviewResult: any = null
for await (const event of reviewGen) {
  if (event.type === 'result') {
    reviewResult = event.data
  }
}

process.chdir(originalCwd)

assert(reviewResult !== null, 'ScoreReview produces a result')
if (reviewResult) {
  assert(typeof reviewResult.score?.score === 'number', 'Result has numeric score')
  assert(Array.isArray(reviewResult.issues), 'Result has issues array')
  console.log(`  Score: ${reviewResult.score?.score}/100, Issues: ${reviewResult.issues?.length}`)

  // Check that Go issues are detected
  const goIssues = reviewResult.issues?.filter((i: any) => i.id?.startsWith('GO-'))
  assert(goIssues?.length > 0, 'Go-specific issues detected')
  if (goIssues?.length > 0) {
    console.log(`  Go issues found: ${goIssues.map((i: any) => i.id).join(', ')}`)
  }

  // Report formatting
  const report = ScoreReviewTool.renderResultForAssistant(reviewResult)
  assert(report.includes('CODE REVIEW'), 'Report contains CODE REVIEW header')
  assert(report.includes('/100'), 'Report contains score')
}

// ── Test 4: Push-approved marker lifecycle ──────
console.log('\n4. Push-approved marker (gate chain)')

// No marker initially
assert(!hasPushApprovedMarker(PROJECT), 'No push-approved initially')

// Create marker (simulating review pass)
createPushApprovedMarker(PROJECT, {
  score: 85, branch: 'main', timestamp: new Date().toISOString(), reviewer: 'danya',
})
assert(hasPushApprovedMarker(PROJECT), 'Marker created after review pass')

// Consume (simulating push)
const markerData = consumePushApprovedMarker(PROJECT)
assert(markerData?.score === 85, 'Marker has correct score')
assert(!hasPushApprovedMarker(PROJECT), 'Marker consumed after push')

// ── Test 5: Push-gate.sh blocks without marker ──
console.log('\n5. Push gate (hook script)')

// Test the push-gate script directly
const pushGateScript = join(PROJECT, '.danya', 'hooks', 'push-gate.sh')
if (existsSync(pushGateScript)) {
  try {
    const hookInput = JSON.stringify({ command: 'git push origin main' })
    const result = execSync(`echo '${hookInput}' | bash "${pushGateScript}"`, {
      cwd: PROJECT, encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
    })
    // If we get here, it didn't block (exit 0) — but we expect block (exit 2)
    assert(false, 'Push-gate should block without marker')
  } catch (err: any) {
    // Exit code 2 = blocked (expected!)
    if (err.status === 2) {
      assert(true, 'Push-gate blocks push without marker (exit 2)')
      const stderr = err.stderr?.toString() || ''
      assert(stderr.includes('BLOCKED') || stderr.includes('review'), 'Block message mentions review')
    } else {
      // Other error
      assert(false, `Push-gate unexpected exit code: ${err.status}`)
    }
  }

  // Now create marker and test that push is allowed
  createPushApprovedMarker(PROJECT, {
    score: 90, branch: 'main', timestamp: new Date().toISOString(), reviewer: 'danya',
  })

  try {
    const hookInput = JSON.stringify({ command: 'git push origin main' })
    const result = execSync(`echo '${hookInput}' | bash "${pushGateScript}"`, {
      cwd: PROJECT, encoding: 'utf-8', timeout: 5000,
    })
    assert(true, 'Push-gate allows push with marker (exit 0)')
    assert(!hasPushApprovedMarker(PROJECT), 'Marker consumed by push-gate')
  } catch (err: any) {
    assert(false, `Push-gate should allow with marker but got exit ${err.status}`)
  }
} else {
  assert(false, 'push-gate.sh not found')
}

// ── Test 6: /review command exists ──────────────
console.log('\n6. /review slash command')
try {
  const reviewCmd = require('../src/commands/review')
  const cmd = reviewCmd.default ?? reviewCmd
  assert(cmd.name === 'review', '/review command exists with correct name')
  assert(cmd.description.includes('Score-based'), '/review description mentions score-based')
  assert(typeof cmd.getPromptForCommand === 'function', '/review has getPromptForCommand')

  const prompt = await cmd.getPromptForCommand('standard')
  const promptText = prompt[0]?.content?.[0]?.text ?? ''
  assert(promptText.includes('ScoreReview'), '/review prompt instructs to use ScoreReview tool')
} catch (err) {
  assert(false, `/review command load error: ${err}`)
}

// ── Summary ─────────────────────────────────────
console.log('\n═══════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════')

if (failed > 0) process.exit(1)
