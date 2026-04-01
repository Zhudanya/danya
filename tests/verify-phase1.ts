/**
 * Phase 1 Milestone Verification
 * Milestone: "执行 /review 出评分报告；push 被门禁拦截"
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// ── Imports under test ──────────────────────────
import { calculateScore, assignDeduction, type ReviewIssue } from '../src/tools/game/ScoreReview/scoringEngine'
import { checkRatchet } from '../src/tools/game/ScoreReview/qualityRatchet'
import { createPushApprovedMarker, consumePushApprovedMarker, hasPushApprovedMarker } from '../src/tools/game/ScoreReview/pushApproved'
import { runMechanicalChecks } from '../src/tools/game/ScoreReview/mechanicalChecks'
import { formatHumanReport } from '../src/tools/game/ScoreReview/reportFormatter'
import { extractImports } from '../src/tools/game/ArchitectureGuard/importParser'
import { checkLayerViolations, UNITY_LAYERS, GO_SERVER_LAYERS, checkForbiddenZones } from '../src/tools/game/ArchitectureGuard/layerRules'
import { parseMSBuildOutput } from '../src/tools/game/CSharpSyntaxCheck/parser'
import { parseGoBuildOutput, parseGolangCILintJSON } from '../src/tools/game/GameServerBuild/parser'
import { initDanyaProject } from '../src/commands/initProject'
import { loadHooksFromSettings, resetHooksCache } from '../src/gate-chain/hookLoader'

let passed = 0
let failed = 0

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✅ ${name}`); passed++ }
  else { console.log(`  ❌ ${name}`); failed++ }
}

console.log('\n═══════════════════════════════════════════')
console.log('  Phase 1 Milestone Verification')
console.log('═══════════════════════════════════════════\n')

// ── 1. Scoring Engine ───────────────────────────
console.log('1. Scoring Engine')
{
  const noIssues = calculateScore([])
  assert(noIssues.score === 100, '0 issues → 100/100')
  assert(noIssues.passed === true, '0 issues → PASS')

  const oneCritical: ReviewIssue[] = [
    { id: 'T-01', phase: 'mechanical', category: 'architecture', severity: 'CRITICAL', file_path: 'a.go', message: 'test', deduction: 30 },
  ]
  const critResult = calculateScore(oneCritical)
  assert(critResult.score === 70, '1 CRITICAL → 70/100')
  assert(critResult.passed === false, '1 CRITICAL → FAIL (auto-fail)')
  assert(critResult.critical_count === 1, 'critical_count = 1')

  const twoHigh: ReviewIssue[] = [
    { id: 'T-02', phase: 'mechanical', category: 'convention', severity: 'HIGH', file_path: 'a.go', message: 'test', deduction: 10 },
    { id: 'T-03', phase: 'mechanical', category: 'convention', severity: 'HIGH', file_path: 'b.go', message: 'test', deduction: 10 },
  ]
  const highResult = calculateScore(twoHigh)
  assert(highResult.score === 80, '2 HIGH → 80/100')
  assert(highResult.passed === true, '2 HIGH → PASS (borderline)')

  const threeHigh: ReviewIssue[] = [...twoHigh, { id: 'T-04', phase: 'mechanical', category: 'convention', severity: 'HIGH', file_path: 'c.go', message: 'test', deduction: 10 }]
  const threeHighResult = calculateScore(threeHigh)
  assert(threeHighResult.score === 70, '3 HIGH → 70/100')
  assert(threeHighResult.passed === false, '3 HIGH → FAIL')

  assert(assignDeduction('CRITICAL') === 30, 'CRITICAL deduction = 30')
  assert(assignDeduction('HIGH') === 10, 'HIGH deduction = 10')
  assert(assignDeduction('MEDIUM') === 3, 'MEDIUM deduction = 3')
}

// ── 2. Quality Ratchet ──────────────────────────
console.log('\n2. Quality Ratchet')
{
  assert(checkRatchet(85, null).passed === true, 'No previous → pass')
  assert(checkRatchet(85, 72).passed === true, '85 >= 72 → pass')
  assert(checkRatchet(68, 72).passed === false, '68 < 72 → fail (regression)')
  assert(checkRatchet(80, 80).passed === true, '80 == 80 → pass (no regression)')
}

// ── 3. Push-Approved Marker ─────────────────────
console.log('\n3. Push-Approved Marker')
{
  const TMP = join(tmpdir(), 'danya-phase1-marker')
  mkdirSync(join(TMP, '.danya'), { recursive: true })

  assert(!hasPushApprovedMarker(TMP), 'Initially no marker')

  createPushApprovedMarker(TMP, { score: 88, branch: 'feat/test', timestamp: '2026-04-01T10:00:00Z', reviewer: 'danya' })
  assert(hasPushApprovedMarker(TMP), 'Marker created')

  const data = consumePushApprovedMarker(TMP)
  assert(data !== null, 'Consume returns data')
  assert(data?.score === 88, 'Score is 88')
  assert(data?.branch === 'feat/test', 'Branch is correct')
  assert(!hasPushApprovedMarker(TMP), 'Marker consumed (deleted)')

  const again = consumePushApprovedMarker(TMP)
  assert(again === null, 'Second consume returns null')
}

// ── 4. Mechanical Checks ────────────────────────
console.log('\n4. Mechanical Checks')
{
  // Go: fmt.Errorf %v
  const goFile = [{ path: 'server.go', content: 'err := fmt.Errorf("failed: %v", err)\n' }]
  const goIssues = runMechanicalChecks(goFile, null, 'go')
  assert(goIssues.some(i => i.id === 'GO-01'), 'GO-01: fmt.Errorf %v detected')

  // Go: bare go func()
  const goFile2 = [{ path: 'worker.go', content: 'go func() { doWork() }()\n' }]
  const goIssues2 = runMechanicalChecks(goFile2, null, 'go')
  assert(goIssues2.some(i => i.id === 'GO-03'), 'GO-03: bare go func() detected')

  // Unity: Debug.Log
  const csFile = [{ path: 'Player.cs', content: 'Debug.Log("hello");\n' }]
  const csIssues = runMechanicalChecks(csFile, 'unity', null)
  assert(csIssues.some(i => i.id === 'UC-01'), 'UC-01: Debug.Log detected')

  // Unity: async Task
  const csFile2 = [{ path: 'Loader.cs', content: 'public async Task LoadData() {}\n' }]
  const csIssues2 = runMechanicalChecks(csFile2, 'unity', null)
  assert(csIssues2.some(i => i.id === 'UC-02'), 'UC-02: async Task detected')

  // Universal: hardcoded secret
  const secretFile = [{ path: 'config.ts', content: 'const api_key = "sk-abc123def"\n' }]
  const secretIssues = runMechanicalChecks(secretFile, null, null)
  assert(secretIssues.some(i => i.id === 'U-02'), 'U-02: hardcoded secret detected')

  // No false positive on test file
  const testFile = [{ path: 'player_test.go', content: '_ = err\n' }]
  const testIssues = runMechanicalChecks(testFile, null, 'go')
  assert(!testIssues.some(i => i.id === 'GO-02'), 'GO-02 excludes test files')
}

// ── 5. Architecture Guard ───────────────────────
console.log('\n5. Architecture Guard')
{
  // C# import parsing
  const csContent = 'using FL.Framework.Core;\nusing FL.Gameplay.Town;\nusing System.Collections;\n'
  const csImports = extractImports(csContent, 'Scripts/Gameplay/Player.cs')
  assert(csImports.length === 3, 'C# parser: 3 using statements extracted')
  assert(csImports[0]!.imported_path === 'FL.Framework.Core', 'C# parser: correct import path')

  // Go import parsing
  const goContent = 'import (\n\t"servers/logic_server/internal/handler"\n\t"common/log"\n)\n'
  const goImports = extractImports(goContent, 'servers/scene_server/main.go')
  assert(goImports.length === 2, 'Go parser: 2 imports extracted')

  // Layer violation: Framework importing Gameplay (Unity)
  const violatingImports = [
    { file_path: 'Scripts/Framework/Core.cs', line: 1, imported_path: 'FL.Gameplay.Town' },
  ]
  const violations = checkLayerViolations(violatingImports, UNITY_LAYERS)
  assert(violations.length > 0, 'Unity layer violation detected: Framework → Gameplay')

  // No violation: Gameplay importing Framework (correct direction)
  const correctImports = [
    { file_path: 'Scripts/Gameplay/Player.cs', line: 1, imported_path: 'FL.Framework.Core' },
  ]
  const noViolations = checkLayerViolations(correctImports, UNITY_LAYERS)
  assert(noViolations.length === 0, 'No violation: Gameplay → Framework (correct)')

  // Go: common importing servers (violation)
  const goViolation = [
    { file_path: 'common/util.go', line: 5, imported_path: 'servers/logic_server/handler' },
  ]
  const goLayerViolation = checkLayerViolations(goViolation, GO_SERVER_LAYERS)
  assert(goLayerViolation.length > 0, 'Go layer violation: common → servers')

  // Forbidden zone
  const forbiddenZoneViolation = checkForbiddenZones(
    ['orm/golang/player.go', 'servers/logic_server/handler.go'],
    [{ pattern: 'orm/(golang|redis|mongo)/', description: 'ORM generated', fix_hint: 'make orm' }],
  )
  assert(forbiddenZoneViolation.length === 1, 'Forbidden zone: orm/golang/ detected')
  assert(forbiddenZoneViolation[0]!.type === 'forbidden_zone_edit', 'Correct violation type')
}

// ── 6. Error Parsers ────────────────────────────
console.log('\n6. Error Parsers')
{
  // MSBuild
  const msbuild = parseMSBuildOutput('Player.cs(42,10): error CS1002: ; expected\nLoader.cs(5,1): warning CS0168: unused variable')
  assert(msbuild.length === 2, 'MSBuild: 2 errors parsed')
  assert(msbuild[0]!.line === 42, 'MSBuild: correct line number')
  assert(msbuild[0]!.code === 'CS1002', 'MSBuild: correct error code')

  // Go build
  const goBuild = parseGoBuildOutput('handler.go:42:10: undefined: PlayerState\nmain.go:5: cannot find package')
  assert(goBuild.length === 2, 'Go build: 2 errors parsed')
  assert(goBuild[0]!.file_path === 'handler.go', 'Go build: correct file')

  // golangci-lint JSON
  const lintJson = parseGolangCILintJSON('{"Issues":[{"FromLinter":"errcheck","Text":"error not checked","Pos":{"Filename":"server.go","Line":10,"Column":5}}]}')
  assert(lintJson.length === 1, 'golangci-lint: 1 issue parsed')
  assert(lintJson[0]!.rule === 'errcheck', 'golangci-lint: correct linter name')
}

// ── 7. Report Formatter ─────────────────────────
console.log('\n7. Report Formatter')
{
  const issues: ReviewIssue[] = [
    { id: 'GO-01', phase: 'mechanical', category: 'convention', severity: 'HIGH', file_path: 'a.go', line: 42, message: 'fmt.Errorf %v', suggestion: 'Use %w', deduction: 10 },
    { id: 'L-03', phase: 'ai_judgment', category: 'logic', severity: 'MEDIUM', file_path: 'b.go', line: 67, message: 'Missing nil check', deduction: 3 },
  ]
  const score = calculateScore(issues)
  const report = formatHumanReport({
    score,
    issues,
    change_summary: { files_changed: 2, lines_added: 50, lines_removed: 5, modules: ['servers'] },
    base_ref: 'main',
    push_approved: true,
  })
  assert(report.includes('CODE REVIEW: PASS'), 'Report shows PASS')
  assert(report.includes('87/100'), 'Report shows correct score 87')
  assert(report.includes('GO-01'), 'Report includes issue ID')
  assert(report.includes('fmt.Errorf %v'), 'Report includes issue message')
}

// ── 8. danya init ───────────────────────────────
console.log('\n8. danya init')
{
  const TMP = join(tmpdir(), `danya-phase1-init-${Date.now()}`)
  mkdirSync(join(TMP, 'ProjectSettings'), { recursive: true })
  mkdirSync(join(TMP, 'Assets'), { recursive: true })

  const result = await initDanyaProject(TMP)
  assert(result.includes('✅'), 'init returns success')
  assert(result.includes('unity'), 'init detects Unity')
  assert(existsSync(join(TMP, '.danya', 'gate-chain.json')), 'gate-chain.json created')
  assert(existsSync(join(TMP, '.danya', 'guard-rules.json')), 'guard-rules.json created')
  assert(existsSync(join(TMP, '.danya', 'settings.json')), 'settings.json created')
  assert(existsSync(join(TMP, '.danya', 'hooks', 'guard.sh')), 'guard.sh created')
  assert(existsSync(join(TMP, '.danya', 'hooks', 'push-gate.sh')), 'push-gate.sh created')

  // Verify hooks config loads
  resetHooksCache()
  const hooks = loadHooksFromSettings(TMP)
  assert(hooks.PreToolUse !== undefined, 'PreToolUse hooks loaded from settings')
  assert(hooks.PostToolUse !== undefined, 'PostToolUse hooks loaded from settings')
}

// ── Summary ─────────────────────────────────────
console.log('\n═══════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════')

if (failed > 0) process.exit(1)
