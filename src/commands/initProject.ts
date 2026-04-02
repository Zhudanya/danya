/**
 * `danya init` — scaffolds .danya/ with complete harness system.
 * Supports single-project and workspace (multi-project) modes.
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { detectProject, detectWorkspace } from '../engine/detect'
import type { EngineType, ServerLanguage } from '../engine/detect'
import { getModelManager } from '../utils/model'
import { getBundleForEngine, getWorkspaceBundle, installBundle, buildTemplateContext } from '../templates'
import { consolidateLegacyIntoDanya, hasLegacyHarness } from '../services/harness/consolidate'

export type GuardRule = {
  pattern: string
  description: string
  fix_hint: string
}

export async function initDanyaProject(cwd: string, force: boolean = false): Promise<string> {
  const danyaDir = join(cwd, '.danya')

  if (existsSync(danyaDir) && !force) {
    return '⚠️ .danya/ already exists. Skipping initialization. Use --force to overwrite.'
  }

  const workspace = detectWorkspace(cwd)
  const instructionsFile = isClaudeModel() ? 'CLAUDE.md' : 'AGENTS.md'

  if (workspace.type === 'workspace') {
    return initWorkspace(cwd, workspace.subProjects, instructionsFile, force)
  }

  return initSingleProject(cwd, instructionsFile, force)
}

// ── Single Project Init ────────────────────────────────

function initSingleProject(cwd: string, instructionsFile: string, force: boolean): string {
  const danyaDir = join(cwd, '.danya')
  const detection = detectProject(cwd)
  const projectName = basename(cwd)

  // 1. Install engine-specific bundle (rules, commands, memory, hooks)
  const bundle = getBundleForEngine(detection.engine, detection.serverLanguage)
  const ctx = buildTemplateContext(projectName, detection.engine, detection.serverLanguage, instructionsFile)
  const installed = installBundle(danyaDir, bundle, ctx, { force })

  // 2. Guard rules
  const guardRules = generateGuardRules(detection.engine, detection.serverLanguage)
  writeFileSync(join(danyaDir, 'guard-rules.json'), JSON.stringify(guardRules, null, 2), 'utf-8')

  // 3. Gate chain config
  writeFileSync(join(danyaDir, 'gate-chain.json'), JSON.stringify({
    gates: {
      guard: { enabled: true },
      syntax: { enabled: true },
      verify: { enabled: true, default_level: 'build' },
      commit: { enabled: true },
      review: { enabled: true },
      push: { enabled: true, require_review: true },
    },
  }, null, 2), 'utf-8')

  // 4. Settings with hook registration (includes harness-evolution hook)
  writeFileSync(join(danyaDir, 'settings.json'), JSON.stringify(generateSettings(), null, 2), 'utf-8')

  // 5. Consolidate legacy .claude/ and .codex/ content into .danya/
  const consolidation = consolidateLegacyIntoDanya(cwd)

  // 6. Project instructions
  writeInstructionsFile(cwd, instructionsFile, detection.engine, detection.serverLanguage)

  const legacyMsg = consolidation.sources.length > 0
    ? [`  Legacy integrated: ${consolidation.sources.join(', ')} → .danya/ (${consolidation.merged.length} merged, ${consolidation.skipped.length} skipped)`]
    : []

  return [
    '✅ Danya project initialized! (single-project mode)',
    '',
    `Detected: engine=${detection.engine ?? 'none'}, server=${detection.serverLanguage ?? 'none'}`,
    `Guard rules: ${guardRules.length} forbidden zone patterns`,
    `Harness files: ${installed.length} files installed`,
    '',
    'Created:',
    `  .danya/rules/            — ${countFiles(installed, 'rules/')} constraint files`,
    `  .danya/commands/         — ${countFiles(installed, 'commands/')} workflow commands`,
    `  .danya/memory/           — ${countFiles(installed, 'memory/')} knowledge files`,
    `  .danya/hooks/            — ${countFiles(installed, 'hooks/')} hook scripts`,
    '  .danya/gate-chain.json   — Gate chain configuration',
    '  .danya/guard-rules.json  — Forbidden zone patterns',
    '  .danya/settings.json     — Hook registration',
    ...legacyMsg,
    '',
    'Gate chain: Edit → Guard → Syntax → Verify → Commit → Review → Push',
    '',
    'Available commands:',
    '  /auto-work <req>     — Full-auto pipeline (plan→code→verify→review→commit→sediment→evolve)',
    '  /auto-bugfix <bug>   — Bug reproduction + auto-fix (max 5 rounds)',
    '  /review              — 100-point scoring code review',
    '  /fix-harness         — Update rules after error pattern',
    '  /plan <req>          — Analysis and planning',
    '  /verify [level]      — Mechanical verification (quick|build|full)',
    '',
    'Next steps:',
    `  1. Customize ${instructionsFile} with your project-specific rules`,
    '  2. Review .danya/rules/ and adjust to your project',
    '  3. Start developing: danya',
  ].join('\n')
}

// ── Workspace Init ─────────────────────────────────────

function initWorkspace(
  rootPath: string,
  subProjects: { name: string; path: string; engine: EngineType; serverLanguage: ServerLanguage; role: string }[],
  instructionsFile: string,
  force: boolean,
): string {
  const rootDanyaDir = join(rootPath, '.danya')
  const rootName = basename(rootPath)

  // 1. Install workspace bundle at root
  const wsBundle = getWorkspaceBundle()
  const wsCtx = buildTemplateContext(rootName, null, null, instructionsFile)
  const wsInstalled = installBundle(rootDanyaDir, wsBundle, wsCtx, { force })

  // 2. Workspace-level guard rules (empty — sub-projects have their own)
  writeFileSync(join(rootDanyaDir, 'guard-rules.json'), '[]', 'utf-8')
  writeFileSync(join(rootDanyaDir, 'gate-chain.json'), JSON.stringify({
    gates: { guard: { enabled: true }, review: { enabled: true }, push: { enabled: true } },
  }, null, 2), 'utf-8')

  // 3. Install per-sub-project bundles
  const subResults: string[] = []
  for (const sub of subProjects) {
    const subDanyaDir = join(sub.path, '.danya')
    const bundle = getBundleForEngine(sub.engine, sub.serverLanguage)
    const ctx = buildTemplateContext(sub.name, sub.engine, sub.serverLanguage, instructionsFile)
    const installed = installBundle(subDanyaDir, bundle, ctx, { force })

    const guardRules = generateGuardRules(sub.engine, sub.serverLanguage)
    writeFileSync(join(subDanyaDir, 'guard-rules.json'), JSON.stringify(guardRules, null, 2), 'utf-8')
    writeFileSync(join(subDanyaDir, 'gate-chain.json'), JSON.stringify({
      gates: { guard: { enabled: true }, syntax: { enabled: true }, verify: { enabled: true }, commit: { enabled: true }, review: { enabled: true }, push: { enabled: true, require_review: true } },
    }, null, 2), 'utf-8')
    writeFileSync(join(subDanyaDir, 'settings.json'), JSON.stringify(generateSettings(), null, 2), 'utf-8')

    // Consolidate legacy for each sub-project
    consolidateLegacyIntoDanya(sub.path)

    writeInstructionsFile(sub.path, instructionsFile, sub.engine, sub.serverLanguage)
    subResults.push(`  ${sub.name}/ (${sub.role}): engine=${sub.engine ?? 'none'}, server=${sub.serverLanguage ?? 'none'}, ${installed.length} files`)
  }

  // 4. Consolidate legacy at workspace root + workspace instructions
  consolidateLegacyIntoDanya(rootPath)
  writeInstructionsFile(rootPath, instructionsFile, null, null)

  return [
    '✅ Danya workspace initialized! (multi-project mode)',
    '',
    'Workspace structure:',
    `  ${rootName}/.danya/         — Cross-project (${wsInstalled.length} files)`,
    ...subResults,
    '',
    'Three-layer isolation:',
    '  Layer 1: Workspace — cross-project rules, memory, commands',
    '  Layer 2: Sub-projects — engine-specific rules, hooks, commands',
    '  Layer 3: Session — git worktree isolation for parallel tasks',
    '',
    'Gate chain per sub-project: Edit → Guard → Syntax → Verify → Commit → Review → Push',
  ].join('\n')
}

// ── Shared Helpers ──────────────────────────────────────

function generateSettings(): object {
  return {
    hooks: {
      PreToolUse: [
        { matcher: 'Edit|Write', hooks: [{ type: 'command', command: 'bash .danya/hooks/constitution-guard.sh', timeout: 5000 }] },
        { matcher: 'Bash', commandPattern: 'git\\s+commit', hooks: [{ type: 'command', command: 'bash .danya/hooks/pre-commit.sh', timeout: 300000 }] },
        { matcher: 'Bash', commandPattern: 'git\\s+push', hooks: [{ type: 'command', command: 'bash .danya/hooks/push-gate.sh', timeout: 5000 }] },
      ],
      PostToolUse: [
        { matcher: 'Bash', hooks: [{ type: 'command', command: 'bash .danya/hooks/harness-evolution.sh', timeout: 5000 }] },
        { matcher: 'Bash', commandPattern: 'git\\s+commit', hooks: [{ type: 'command', command: 'bash .danya/hooks/post-commit.sh', timeout: 5000 }] },
      ],
    },
  }
}

function writeInstructionsFile(dir: string, instructionsFile: string, engine: EngineType, serverLanguage: ServerLanguage): void {
  const path = join(dir, instructionsFile)
  const altFile = instructionsFile === 'CLAUDE.md' ? 'AGENTS.md' : 'CLAUDE.md'
  if (existsSync(path) || existsSync(join(dir, altFile))) return

  writeFileSync(path, generateInstructionsTemplate(engine, serverLanguage), 'utf-8')
}

function generateInstructionsTemplate(engine: EngineType, serverLanguage: ServerLanguage): string {
  const lines: string[] = ['# Project Instructions', '']

  lines.push('## Build & Test')
  if (engine === 'unity') {
    lines.push('- Build: Unity Editor → File > Build Settings')
    lines.push('- Test: Window > General > Test Runner')
  } else if (engine === 'unreal') {
    lines.push('- Build: UnrealBuildTool or IDE build')
    lines.push('- Test: Automation tab in Session Frontend')
  } else if (engine === 'godot') {
    lines.push('- Build: godot --export-release <preset>')
    lines.push('- Test: GUT or custom test framework')
  }
  if (serverLanguage === 'go') {
    lines.push('- Server build: make build')
    lines.push('- Server test: make test')
    lines.push('- Server lint: make lint')
  }
  if (!engine && !serverLanguage) {
    lines.push('- Build: <your build command>')
    lines.push('- Test: <your test command>')
  }

  lines.push('')
  lines.push('## Harness')
  lines.push('This project uses Danya harness. See .danya/ for:')
  lines.push('- rules/ — Coding constraints (auto-loaded every session)')
  lines.push('- commands/ — Workflow commands (/auto-work, /review, /fix-harness, etc.)')
  lines.push('- memory/ — Persistent domain knowledge')
  lines.push('- hooks/ — Mechanical enforcement scripts')
  lines.push('')
  lines.push('## Forbidden Zones')
  lines.push('See .danya/guard-rules.json. Hook enforced — Agent cannot bypass.')
  lines.push('')

  return lines.join('\n')
}

function generateGuardRules(engine: EngineType, serverLanguage: ServerLanguage): GuardRule[] {
  const rules: GuardRule[] = []
  if (engine === 'unity') {
    rules.push(
      { pattern: 'Config/Gen/', description: 'Auto-generated config', fix_hint: 'Edit Excel → run ConfigGenerate' },
      { pattern: 'Scripts/Framework/', description: 'Core framework', fix_hint: 'Needs programmer approval' },
    )
  }
  if (engine === 'unreal') {
    rules.push(
      { pattern: 'Generated/', description: 'UE generated code', fix_hint: 'Regenerate via UBT' },
      { pattern: 'Intermediate/', description: 'Build intermediates', fix_hint: 'Do not edit' },
    )
  }
  if (engine === 'godot') {
    rules.push(
      { pattern: '\\.import/', description: 'Godot import cache', fix_hint: 'Do not edit' },
    )
  }
  if (serverLanguage === 'go') {
    rules.push(
      { pattern: 'orm/(golang|redis|mongo)/', description: 'ORM generated code', fix_hint: 'Edit XML → make orm' },
      { pattern: 'cfg_.*\\.go$', description: 'Config generated code', fix_hint: 'Edit data source → regenerate' },
      { pattern: '.*_pb\\.go$', description: 'Protobuf generated', fix_hint: 'Edit .proto → protoc' },
    )
  }
  return rules
}

function countFiles(installed: string[], prefix: string): number {
  return installed.filter(f => f.startsWith(prefix)).length
}

function isClaudeModel(): boolean {
  try {
    const modelManager = getModelManager()
    const modelName = modelManager.getCurrentModel()
    return Boolean(modelName && modelName.startsWith('claude'))
  } catch {
    return false
  }
}
