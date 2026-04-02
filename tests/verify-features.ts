/**
 * Verification: Self-Evolution + Three-Layer Isolation + Complete Harness Bundle
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { detectWorkspace, detectProject } from '../src/engine/detect'
import { getBundleForEngine, getWorkspaceBundle, installBundle, buildTemplateContext } from '../src/templates'

let passed = 0
let failed = 0

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✅ ${name}`); passed++ }
  else { console.log(`  ❌ ${name}`); failed++ }
}

console.log('\n═══════════════════════════════════════════')
console.log('  Feature Verification')
console.log('═══════════════════════════════════════════\n')

// ── 1. Bundle System ────────────────────────────
console.log('1. Bundle System')
{
  const unityBundle = getBundleForEngine('unity', null)
  assert(Object.keys(unityBundle).length > 0, 'Unity bundle has content')
  assert('rules/constitution.md.tmpl' in unityBundle, 'Unity has constitution rule')
  assert('rules/golden-principles.md' in unityBundle, 'Unity has golden principles')
  assert('commands/auto-work.md' in unityBundle, 'Unity has auto-work command')
  assert('commands/review.md' in unityBundle, 'Unity has review command')
  assert('commands/fix-harness.md' in unityBundle, 'Unity has fix-harness command')
  assert('hooks/constitution-guard.sh' in unityBundle, 'Unity has constitution guard hook')
  assert('hooks/harness-evolution.sh' in unityBundle, 'Unity has harness evolution hook')
  assert('memory/MEMORY.md' in unityBundle, 'Unity has memory index')

  const goBundle = getBundleForEngine(null, 'go')
  assert('rules/go-style.md' in goBundle, 'Go bundle has style rules')
  assert('hooks/verify-server.sh' in goBundle, 'Go bundle has verify hook')

  const unrealBundle = getBundleForEngine('unreal', null)
  assert('rules/unreal-cpp.md' in unrealBundle, 'Unreal bundle has C++ rules')

  const godotBundle = getBundleForEngine('godot', null)
  assert('rules/godot-gdscript.md' in godotBundle, 'Godot bundle has GDScript rules')

  const genericBundle = getBundleForEngine(null, null)
  assert('commands/auto-work.md' in genericBundle, 'Generic bundle has auto-work')
  assert('hooks/push-gate.sh' in genericBundle, 'Generic bundle has push gate')
}

// ── 2. Template Engine ──────────────────────────
console.log('\n2. Template Engine')
{
  const ctx = buildTemplateContext('TestProject', 'unity', null, 'CLAUDE.md')
  assert(ctx.projectName === 'TestProject', 'Context has project name')
  assert(ctx.engine === 'unity', 'Context has engine')
  assert(ctx.configGenPath.includes('Config/Gen'), 'Unity config path correct')
  assert(ctx.frameworkPath.includes('Framework'), 'Unity framework path correct')

  const goCtx = buildTemplateContext('Server', null, 'go', 'AGENTS.md')
  assert(goCtx.configGenPath.includes('cfg_'), 'Go config path correct')
  assert(goCtx.ormPath.includes('orm/'), 'Go ORM path correct')
}

// ── 3. Bundle Installation ──────────────────────
console.log('\n3. Bundle Installation')
{
  const TMP = join(tmpdir(), `danya-bundle-test-${Date.now()}`)
  mkdirSync(TMP, { recursive: true })

  const bundle = getBundleForEngine('unity', null)
  const ctx = buildTemplateContext('TestGame', 'unity', null, 'CLAUDE.md')
  const installed = installBundle(TMP, bundle, ctx)

  assert(installed.length > 0, `Installed ${installed.length} files`)
  assert(existsSync(join(TMP, 'rules', 'constitution.md')), 'Constitution rule installed')
  assert(existsSync(join(TMP, 'rules', 'golden-principles.md')), 'Golden principles installed')
  assert(existsSync(join(TMP, 'commands', 'auto-work.md')), 'Auto-work command installed')
  assert(existsSync(join(TMP, 'hooks', 'constitution-guard.sh')), 'Constitution guard installed')
  assert(existsSync(join(TMP, 'hooks', 'harness-evolution.sh')), 'Harness evolution hook installed')

  // Check template rendering
  const constitution = readFileSync(join(TMP, 'rules', 'constitution.md'), 'utf-8')
  assert(constitution.includes('Assets/Scripts/Gameplay/Config/Gen'), 'Template variables rendered (config path)')
  assert(!constitution.includes('{{CONFIG_GEN_PATH}}'), 'No unresolved template variables')
}

// ── 4. Workspace Detection ──────────────────────
console.log('\n4. Workspace Detection')
{
  // Single project (no sub-projects)
  const TMP1 = join(tmpdir(), `danya-ws-single-${Date.now()}`)
  mkdirSync(join(TMP1, 'Assets'), { recursive: true })
  mkdirSync(join(TMP1, 'ProjectSettings'), { recursive: true })
  const ws1 = detectWorkspace(TMP1)
  assert(ws1.type === 'single-project', 'Unity-only dir → single-project')

  // Workspace (client + server)
  const TMP2 = join(tmpdir(), `danya-ws-multi-${Date.now()}`)
  // Client subdir with Unity markers
  mkdirSync(join(TMP2, 'client', 'Assets'), { recursive: true })
  mkdirSync(join(TMP2, 'client', 'ProjectSettings'), { recursive: true })
  // Server subdir with Go marker
  mkdirSync(join(TMP2, 'server'), { recursive: true })
  writeFileSync(join(TMP2, 'server', 'go.mod'), 'module game-server\ngo 1.21\n', 'utf-8')

  const ws2 = detectWorkspace(TMP2)
  assert(ws2.type === 'workspace', 'client/ + server/ → workspace')
  assert(ws2.subProjects.length === 2, 'Found 2 sub-projects')

  const clientSub = ws2.subProjects.find(p => p.name === 'client')
  const serverSub = ws2.subProjects.find(p => p.name === 'server')
  assert(clientSub?.engine === 'unity', 'Client detected as Unity')
  assert(clientSub?.role === 'client', 'Client role = client')
  assert(serverSub?.serverLanguage === 'go', 'Server detected as Go')
  assert(serverSub?.role === 'server', 'Server role = server')
}

// ── 5. Workspace Bundle ─────────────────────────
console.log('\n5. Workspace Bundle')
{
  const wsBundle = getWorkspaceBundle()
  assert('commands/fix-harness.md' in wsBundle, 'Workspace has fix-harness command')
  assert('memory/cross-project-protocol.md' in wsBundle, 'Workspace has cross-project memory')
  assert('memory/cross-project-pitfalls.md' in wsBundle, 'Workspace has pitfalls memory')
}

// ── 6. /fix-harness Command ─────────────────────
console.log('\n6. /fix-harness Command')
{
  const fixHarness = require('../src/commands/fix-harness')
  const cmd = fixHarness.default ?? fixHarness
  assert(cmd.name === 'fix-harness', '/fix-harness command registered')
  const prompt = await cmd.getPromptForCommand('compile error in Player.cs')
  assert(prompt[0]?.content?.[0]?.text?.includes('harness self-evolution'), '/fix-harness generates evolution prompt')
  assert(prompt[0]?.content?.[0]?.text?.includes('constitution.md'), 'Prompt mentions rule routing')
}

// ── 7. Harness Evolution Hook Content ───────────
console.log('\n7. Harness Evolution Hook')
{
  const { HOOK_HARNESS_EVOLUTION } = require('../src/templates/bundles/common')
  assert(HOOK_HARNESS_EVOLUTION.includes('error-then-fix'), 'Hook detects error-then-fix pattern')
  assert(HOOK_HARNESS_EVOLUTION.includes('/fix-harness'), 'Hook suggests /fix-harness')
  assert(HOOK_HARNESS_EVOLUTION.includes('PostToolUse'), 'Hook is PostToolUse type')
}

// ── Summary ─────────────────────────────────────
console.log('\n═══════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════')

if (failed > 0) process.exit(1)
