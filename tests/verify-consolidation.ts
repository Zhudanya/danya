/**
 * Verification: Legacy consolidation (.claude/ + .codex/ → .danya/)
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { consolidateLegacyIntoDanya, hasLegacyHarness } from '../src/services/harness/consolidate'

let passed = 0
let failed = 0

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✅ ${name}`); passed++ }
  else { console.log(`  ❌ ${name}`); failed++ }
}

console.log('\n═══════════════════════════════════════════')
console.log('  Legacy Consolidation Verification')
console.log('═══════════════════════════════════════════\n')

// ── 1. hasLegacyHarness Detection ───────────────
console.log('1. Legacy Detection')
{
  const TMP1 = join(tmpdir(), `danya-legacy-detect-${Date.now()}`)
  mkdirSync(TMP1, { recursive: true })
  assert(!hasLegacyHarness(TMP1), 'Empty dir → no legacy')

  const TMP2 = join(tmpdir(), `danya-legacy-detect2-${Date.now()}`)
  mkdirSync(join(TMP2, '.claude', 'rules'), { recursive: true })
  writeFileSync(join(TMP2, '.claude', 'rules', 'test.md'), '# Test', 'utf-8')
  assert(hasLegacyHarness(TMP2), '.claude/rules/ → has legacy')

  const TMP3 = join(tmpdir(), `danya-legacy-detect3-${Date.now()}`)
  mkdirSync(join(TMP3, '.codex', 'commands'), { recursive: true })
  writeFileSync(join(TMP3, '.codex', 'commands', 'test.md'), '# Test', 'utf-8')
  assert(hasLegacyHarness(TMP3), '.codex/commands/ → has legacy')
}

// ── 2. Basic Consolidation ──────────────────────
console.log('\n2. Basic Consolidation (.claude/ → .danya/)')
{
  const TMP = join(tmpdir(), `danya-consolidate-${Date.now()}`)

  // Create .danya/ with some content
  mkdirSync(join(TMP, '.danya', 'rules'), { recursive: true })
  writeFileSync(join(TMP, '.danya', 'rules', 'constitution.md'), '# Danya constitution', 'utf-8')

  // Create .claude/ with overlapping + unique content
  mkdirSync(join(TMP, '.claude', 'rules'), { recursive: true })
  mkdirSync(join(TMP, '.claude', 'commands'), { recursive: true })
  mkdirSync(join(TMP, '.claude', 'memory'), { recursive: true })
  writeFileSync(join(TMP, '.claude', 'rules', 'constitution.md'), '# Claude constitution (should be skipped)', 'utf-8')
  writeFileSync(join(TMP, '.claude', 'rules', 'custom-rule.md'), '# Custom rule from Claude', 'utf-8')
  writeFileSync(join(TMP, '.claude', 'commands', 'my-command.md'), '# My custom command', 'utf-8')
  writeFileSync(join(TMP, '.claude', 'memory', 'project-info.md'), '# Project info', 'utf-8')

  const result = consolidateLegacyIntoDanya(TMP)

  assert(result.sources.includes('.claude'), 'Source detected: .claude')
  assert(result.skipped.includes('rules/constitution.md'), 'Same-name file skipped')
  assert(result.merged.includes('rules/custom-rule.md'), 'Unique rule merged')
  assert(result.merged.includes('commands/my-command.md'), 'Unique command merged')
  assert(result.merged.includes('memory/project-info.md'), 'Unique memory merged')

  // Verify .danya/ has the right content
  const constitution = readFileSync(join(TMP, '.danya', 'rules', 'constitution.md'), 'utf-8')
  assert(constitution.includes('Danya constitution'), '.danya/ constitution preserved (not overwritten)')

  assert(existsSync(join(TMP, '.danya', 'rules', 'custom-rule.md')), 'Custom rule now in .danya/')
  assert(existsSync(join(TMP, '.danya', 'commands', 'my-command.md')), 'Custom command now in .danya/')
  assert(existsSync(join(TMP, '.danya', 'memory', 'project-info.md')), 'Memory now in .danya/')
}

// ── 3. Codex Consolidation ──────────────────────
console.log('\n3. Codex Consolidation (.codex/ → .danya/)')
{
  const TMP = join(tmpdir(), `danya-codex-consolidate-${Date.now()}`)

  mkdirSync(join(TMP, '.danya', 'rules'), { recursive: true })
  mkdirSync(join(TMP, '.codex', 'rules'), { recursive: true })
  mkdirSync(join(TMP, '.codex', 'skills'), { recursive: true })
  writeFileSync(join(TMP, '.codex', 'rules', 'codex-rule.md'), '# From Codex', 'utf-8')
  writeFileSync(join(TMP, '.codex', 'skills', 'advanced.md'), '# Codex skill', 'utf-8')

  const result = consolidateLegacyIntoDanya(TMP)

  assert(result.sources.includes('.codex'), 'Source detected: .codex')
  assert(result.merged.includes('rules/codex-rule.md'), 'Codex rule merged')
  assert(result.merged.includes('skills/advanced.md'), 'Codex skill merged')
  assert(existsSync(join(TMP, '.danya', 'rules', 'codex-rule.md')), 'Codex rule in .danya/')
  assert(existsSync(join(TMP, '.danya', 'skills', 'advanced.md')), 'Codex skill in .danya/')
}

// ── 4. Both .claude/ and .codex/ ────────────────
console.log('\n4. Both Legacy Dirs (.claude/ + .codex/ → .danya/)')
{
  const TMP = join(tmpdir(), `danya-both-legacy-${Date.now()}`)

  mkdirSync(join(TMP, '.danya', 'rules'), { recursive: true })
  mkdirSync(join(TMP, '.claude', 'rules'), { recursive: true })
  mkdirSync(join(TMP, '.codex', 'rules'), { recursive: true })

  writeFileSync(join(TMP, '.claude', 'rules', 'claude-only.md'), '# Claude', 'utf-8')
  writeFileSync(join(TMP, '.codex', 'rules', 'codex-only.md'), '# Codex', 'utf-8')
  // Both have same file — .claude/ is processed first
  writeFileSync(join(TMP, '.claude', 'rules', 'shared.md'), '# From Claude', 'utf-8')
  writeFileSync(join(TMP, '.codex', 'rules', 'shared.md'), '# From Codex', 'utf-8')

  const result = consolidateLegacyIntoDanya(TMP)

  assert(result.sources.length === 2, 'Both legacy dirs detected')
  assert(existsSync(join(TMP, '.danya', 'rules', 'claude-only.md')), 'Claude-only rule merged')
  assert(existsSync(join(TMP, '.danya', 'rules', 'codex-only.md')), 'Codex-only rule merged')

  // shared.md: .claude/ is processed first, so .claude/ version wins
  const shared = readFileSync(join(TMP, '.danya', 'rules', 'shared.md'), 'utf-8')
  assert(shared.includes('From Claude'), 'Shared file: .claude/ processed first')
}

// ── 5. Settings Merge ───────────────────────────
console.log('\n5. Settings Merge')
{
  const TMP = join(tmpdir(), `danya-settings-merge-${Date.now()}`)

  mkdirSync(join(TMP, '.danya'), { recursive: true })
  mkdirSync(join(TMP, '.claude'), { recursive: true })

  writeFileSync(join(TMP, '.danya', 'settings.json'), JSON.stringify({
    hooks: {
      PreToolUse: [{ matcher: 'Edit', hooks: [{ command: 'echo danya' }] }],
    },
  }, null, 2), 'utf-8')

  writeFileSync(join(TMP, '.claude', 'settings.json'), JSON.stringify({
    hooks: {
      PreToolUse: [{ matcher: 'Write', hooks: [{ command: 'echo claude' }] }],
      PostToolUse: [{ matcher: 'Bash', hooks: [{ command: 'echo post' }] }],
    },
  }, null, 2), 'utf-8')

  const result = consolidateLegacyIntoDanya(TMP)

  const settings = JSON.parse(readFileSync(join(TMP, '.danya', 'settings.json'), 'utf-8'))
  assert(settings.hooks.PreToolUse[0].matcher === 'Edit', 'PreToolUse preserved (danya wins)')
  assert(settings.hooks.PostToolUse !== undefined, 'PostToolUse merged from legacy')
  assert(!result.merged.includes('settings.json:hooks.PreToolUse'), 'PreToolUse NOT merged (already exists)')
  assert(result.merged.includes('settings.json:hooks.PostToolUse'), 'PostToolUse merged')
}

// ── 6. No Legacy = No-op ───────────────────────
console.log('\n6. No Legacy Dirs')
{
  const TMP = join(tmpdir(), `danya-no-legacy-${Date.now()}`)
  mkdirSync(join(TMP, '.danya'), { recursive: true })

  const result = consolidateLegacyIntoDanya(TMP)
  assert(result.sources.length === 0, 'No legacy dirs → no sources')
  assert(result.merged.length === 0, 'No legacy dirs → nothing merged')
}

// ── Summary ─────────────────────────────────────
console.log('\n═══════════════════════════════════════════')
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════')

if (failed > 0) process.exit(1)
