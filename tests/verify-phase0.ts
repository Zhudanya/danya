/**
 * Phase 0 Milestone Verification Script
 * Run with: bun tests/verify-phase0.ts
 */

import { detectEngine, detectServerLanguage, detectProject } from '../src/engine/detect'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Create test dirs using OS-native temp directory
const TMP = join(tmpdir(), 'danya-phase0-test')
const UNITY_DIR = join(TMP, 'test-unity')
const GODOT_DIR = join(TMP, 'test-godot')
const GO_DIR = join(TMP, 'test-go')
const GENERIC_DIR = join(TMP, 'test-generic')

mkdirSync(join(UNITY_DIR, 'ProjectSettings'), { recursive: true })
mkdirSync(join(UNITY_DIR, 'Assets'), { recursive: true })
mkdirSync(GODOT_DIR, { recursive: true })
writeFileSync(join(GODOT_DIR, 'project.godot'), '[application]')
mkdirSync(GO_DIR, { recursive: true })
writeFileSync(join(GO_DIR, 'go.mod'), 'module example.com/server')
mkdirSync(GENERIC_DIR, { recursive: true })
import { getEngineVariantPrompt, getEngineDisplayName } from '../src/engine/index'
import { PRODUCT_NAME, PRODUCT_COMMAND, CONFIG_BASE_DIR } from '../src/constants/product'
import { systemPromptSection, DANGEROUS_uncachedSystemPromptSection, resolveSystemPromptSections, clearSystemPromptSections } from '../src/constants/systemPromptSections'
import { matchToolRule, matchRuleContent, resolvePermission } from '../src/utils/permissions-cascade/index'
import { groupMessages, shouldTriggerCompaction } from '../src/services/compact/compact'
import { partitionToolCalls } from '../src/core/tools/tool'
import { HOOK_EVENTS, isHookEvent } from '../src/types/hooks'
import { PERMISSION_MODES } from '../src/types/permissions'

let passed = 0
let failed = 0

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✅ ${name}`)
    passed++
  } else {
    console.log(`  ❌ ${name}`)
    failed++
  }
}

console.log('\n═══════════════════════════════════════════')
console.log('  Phase 0 Milestone Verification')
console.log('═══════════════════════════════════════════\n')

// ── 1. Product Identity ──────────────────────────
console.log('1. Product Identity')
assert(PRODUCT_NAME === 'Danya', 'PRODUCT_NAME is "Danya"')
assert(PRODUCT_COMMAND === 'danya', 'PRODUCT_COMMAND is "danya"')
assert(CONFIG_BASE_DIR === '.danya', 'CONFIG_BASE_DIR is ".danya"')

// ── 2. Engine Detection ─────────────────────────
console.log('\n2. Engine Detection')
assert(detectEngine(UNITY_DIR) === 'unity', 'Detects Unity (ProjectSettings + Assets)')
assert(detectEngine(GODOT_DIR) === 'godot', 'Detects Godot (project.godot)')
assert(detectEngine(GENERIC_DIR) === null, 'Returns null for non-game project')
assert(detectServerLanguage(GO_DIR) === 'go', 'Detects Go server (go.mod)')
assert(detectServerLanguage(GENERIC_DIR) === null, 'Returns null for non-server project')

// ── 3. Engine Variants ──────────────────────────
console.log('\n3. Engine Variants')
const unityPrompt = getEngineVariantPrompt('unity')
const unrealPrompt = getEngineVariantPrompt('unreal')
const godotPrompt = getEngineVariantPrompt('godot')
const nullPrompt = getEngineVariantPrompt(null)
assert(unityPrompt.includes('UniTask'), 'Unity variant contains UniTask knowledge')
assert(unityPrompt.includes('DOTS'), 'Unity variant contains DOTS knowledge')
assert(unrealPrompt.includes('UPROPERTY'), 'Unreal variant contains UPROPERTY knowledge')
assert(unrealPrompt.includes('BeginPlay'), 'Unreal variant contains lifecycle knowledge')
assert(godotPrompt.includes('_ready'), 'Godot variant contains _ready lifecycle')
assert(godotPrompt.includes('Signal'), 'Godot variant contains Signal knowledge')
assert(nullPrompt === '', 'Null engine returns empty prompt')
assert(getEngineDisplayName('unity') === 'Unity', 'Unity display name correct')
assert(getEngineDisplayName('unreal') === 'Unreal Engine', 'Unreal display name correct')
assert(getEngineDisplayName(null) === 'None detected', 'Null display name correct')

// ── 4. System Prompt Sections (Caching) ─────────
console.log('\n4. System Prompt Sections (Cache)')
let callCount = 0
const section = systemPromptSection('test', () => { callCount++; return 'cached-value' })
const volatile = DANGEROUS_uncachedSystemPromptSection('vol', () => `time-${Date.now()}`, 'test')

const r1 = await resolveSystemPromptSections([section])
const r2 = await resolveSystemPromptSections([section])
assert(r1[0] === 'cached-value', 'Cached section returns correct value')
assert(callCount === 1, 'Cached section computed only once (not twice)')

let volatileCallCount = 0
const volatile2 = DANGEROUS_uncachedSystemPromptSection('vol2', () => `call-${++volatileCallCount}`, 'test')
const v1 = await resolveSystemPromptSections([volatile2])
const v2 = await resolveSystemPromptSections([volatile2])
assert(v1[0] !== v2[0], 'Volatile section recomputes each time')

clearSystemPromptSections()
const r3 = await resolveSystemPromptSections([section])
assert(callCount === 2, 'After clear, cached section recomputes')

// ── 5. Permission Types ─────────────────────────
console.log('\n5. Permission System')
assert(PERMISSION_MODES.length === 5, '5 permission modes defined')
assert(PERMISSION_MODES.includes('bypassPermissions'), 'Includes bypassPermissions mode')
assert(PERMISSION_MODES.includes('dontAsk'), 'Includes dontAsk mode')
assert(matchToolRule('Edit|Write', 'Edit'), 'Pipe matcher: Edit|Write matches Edit')
assert(matchToolRule('Edit|Write', 'Write'), 'Pipe matcher: Edit|Write matches Write')
assert(!matchToolRule('Edit|Write', 'Bash'), 'Pipe matcher: Edit|Write does not match Bash')
assert(matchToolRule('File*', 'FileRead'), 'Wildcard matcher: File* matches FileRead')
assert(matchToolRule('*', 'Anything'), 'Wildcard *: matches everything')
assert(matchRuleContent('git\\s+push', 'git push origin main'), 'Regex content match works')
assert(!matchRuleContent('git\\s+push', 'git commit'), 'Regex content non-match works')

// ── 6. Hook System ──────────────────────────────
console.log('\n6. Hook System')
assert(HOOK_EVENTS.length === 18, `18 hook events defined (got ${HOOK_EVENTS.length})`)
assert(isHookEvent('PreToolUse'), 'PreToolUse is valid hook event')
assert(isHookEvent('PostToolUse'), 'PostToolUse is valid hook event')
assert(isHookEvent('SessionStart'), 'SessionStart is valid hook event')
assert(isHookEvent('FileChanged'), 'FileChanged is valid hook event')
assert(isHookEvent('Stop'), 'Stop is valid hook event')
assert(!isHookEvent('InvalidEvent'), 'InvalidEvent is not a hook event')

// ── 7. Tool Interface Extensions ────────────────
console.log('\n7. Tool Interface (extensions)')
// Test partitionToolCalls
const mockReadTool = { name: 'Read', isReadOnly: () => true, isConcurrencySafe: () => true } as any
const mockWriteTool = { name: 'Write', isReadOnly: () => false, isConcurrencySafe: () => false } as any
const { parallel, serial } = partitionToolCalls([
  { tool: mockReadTool, input: {} },
  { tool: mockWriteTool, input: {} },
  { tool: mockReadTool, input: {} },
])
assert(parallel.length === 2, 'partitionToolCalls: 2 read-only tools in parallel batch')
assert(serial.length === 1, 'partitionToolCalls: 1 write tool in serial batch')

// ── 8. Compaction ───────────────────────────────
console.log('\n8. Compaction System')
assert(shouldTriggerCompaction(180000, 200000), 'Triggers at 90% (180k/200k)')
assert(!shouldTriggerCompaction(100000, 200000), 'Does not trigger at 50% (100k/200k)')
assert(!shouldTriggerCompaction(180000, 200000, { ...({} as any), enabled: false, triggerThresholdPercent: 90, targetPercent: 60, preserveRecentMessages: 4 }), 'Does not trigger when disabled')

const messages = [
  { type: 'user' as const, content: 'hello', tokens: 10 },
  { type: 'assistant' as const, content: 'hi', tokens: 10 },
  { type: 'user' as const, content: 'recent', tokens: 10, preserve: true },
]
const groups = groupMessages(messages, 1)
assert(groups.some(g => g.type === 'preserved'), 'groupMessages marks recent messages as preserved')

// ── 9. Full Project Detection ───────────────────
console.log('\n9. Full Project Detection')
const unityProject = detectProject(UNITY_DIR)
assert(unityProject.engine === 'unity', 'detectProject: Unity engine detected')
assert(unityProject.languages.includes('C#'), 'detectProject: C# language detected for Unity')

const goProject = detectProject(GO_DIR)
assert(goProject.serverLanguage === 'go', 'detectProject: Go server detected')
assert(goProject.languages.includes('Go'), 'detectProject: Go language detected')

const genericProject = detectProject(GENERIC_DIR)
assert(genericProject.engine === null, 'detectProject: No engine for generic project')

// ── Summary ─────────────────────────────────────
console.log('\n═══════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════')

if (failed > 0) {
  process.exit(1)
}
