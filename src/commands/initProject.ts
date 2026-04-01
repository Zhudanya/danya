/**
 * `danya init` enhanced command — scaffolds .danya/ with gate chain hooks.
 */

import { mkdirSync, writeFileSync, copyFileSync, existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { detectProject } from '../engine/detect'
import { getModelManager } from '../utils/model'

export type GuardRule = {
  pattern: string
  description: string
  fix_hint: string
}

export async function initDanyaProject(cwd: string, force: boolean = false): Promise<string> {
  const danyaDir = join(cwd, '.danya')
  const hooksDir = join(danyaDir, 'hooks')

  if (existsSync(danyaDir) && !force) {
    return '⚠️ .danya/ already exists. Skipping initialization.'
  }

  mkdirSync(hooksDir, { recursive: true })

  const detection = detectProject(cwd)

  // 1. Guard rules
  const guardRules = generateGuardRules(detection.engine, detection.serverLanguage)
  writeFileSync(join(danyaDir, 'guard-rules.json'), JSON.stringify(guardRules, null, 2), 'utf-8')

  // 2. Gate chain config
  const gateChainConfig = {
    gates: {
      guard: { enabled: true },
      syntax: { enabled: true },
      verify: { enabled: true, default_level: 'build' },
      commit: { enabled: true },
      review: { enabled: true },
      push: { enabled: true, require_review: true },
    },
  }
  writeFileSync(join(danyaDir, 'gate-chain.json'), JSON.stringify(gateChainConfig, null, 2), 'utf-8')

  // 3. Hook scripts (embedded)
  writeHookScript(hooksDir, 'guard.sh', GUARD_SCRIPT)
  writeHookScript(hooksDir, 'syntax-check.sh', SYNTAX_CHECK_SCRIPT)
  writeHookScript(hooksDir, 'pre-commit.sh', PRE_COMMIT_SCRIPT)
  writeHookScript(hooksDir, 'post-commit.sh', POST_COMMIT_SCRIPT)
  writeHookScript(hooksDir, 'push-gate.sh', PUSH_GATE_SCRIPT)

  // 4. Settings with hook registration
  const settings = {
    hooks: {
      PreToolUse: [
        { matcher: 'Edit|Write', hooks: [{ type: 'command', command: 'bash .danya/hooks/guard.sh', timeout: 5000 }] },
        { matcher: 'Bash', commandPattern: 'git\\s+commit', hooks: [{ type: 'command', command: 'bash .danya/hooks/pre-commit.sh', timeout: 300000 }] },
        { matcher: 'Bash', commandPattern: 'git\\s+push', hooks: [{ type: 'command', command: 'bash .danya/hooks/push-gate.sh', timeout: 5000 }] },
      ],
      PostToolUse: [
        { matcher: 'Edit|Write', filePattern: '\\.(cs|go|cpp|h|gd)$', hooks: [{ type: 'command', command: 'bash .danya/hooks/syntax-check.sh', timeout: 30000 }] },
        { matcher: 'Bash', commandPattern: 'git\\s+commit', hooks: [{ type: 'command', command: 'bash .danya/hooks/post-commit.sh', timeout: 5000 }] },
      ],
    },
  }
  writeFileSync(join(danyaDir, 'settings.json'), JSON.stringify(settings, null, 2), 'utf-8')

  // 5. Generate project instructions template
  // Claude models → CLAUDE.md, other models → AGENTS.md
  const instructionsFile = isClaudeModel() ? 'CLAUDE.md' : 'AGENTS.md'
  const instructionsPath = join(cwd, instructionsFile)
  // Also check the other file to avoid duplicates
  const altFile = instructionsFile === 'CLAUDE.md' ? 'AGENTS.md' : 'CLAUDE.md'
  const altPath = join(cwd, altFile)
  const alreadyExists = existsSync(instructionsPath) || existsSync(altPath)
  if (!alreadyExists) {
    writeFileSync(instructionsPath, generateAgentsMdTemplate(detection.engine, detection.serverLanguage), 'utf-8')
  }

  return [
    '✅ Danya project initialized!',
    '',
    `Detected: engine=${detection.engine ?? 'none'}, server=${detection.serverLanguage ?? 'none'}`,
    `Guard rules: ${guardRules.length} forbidden zone patterns`,
    '',
    'Created:',
    '  .danya/gate-chain.json   — Gate chain configuration',
    '  .danya/guard-rules.json  — Forbidden zone patterns',
    '  .danya/settings.json     — Hook registration',
    '  .danya/hooks/            — 5 hook scripts',
    alreadyExists ? '' : `  ${instructionsFile}               — Project instructions template`,
    '',
    'Gate chain: Edit → Guard → Syntax → Verify → Commit → Review → Push',
    '',
    'Next steps:',
    '  1. Configure API key: run danya and follow setup',
    `  2. Customize ${instructionsFile} with your project-specific rules`,
    '  3. Run: danya',
  ].filter(Boolean).join('\n')
}

function generateAgentsMdTemplate(engine: string | null, serverLanguage: string | null): string {
  const lines: string[] = []
  lines.push('# Project Instructions')
  lines.push('')
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
  lines.push('## Coding Conventions')

  if (engine === 'unity') {
    lines.push('- Logging: use project logger, NOT Debug.Log')
    lines.push('- Async: use UniTask, NOT System.Threading.Tasks.Task')
    lines.push('- Pool: use ObjectPoolUtility, NOT Destroy() on pooled objects')
    lines.push('- Events: Subscribe/Unsubscribe must be paired')
    lines.push('- Architecture: Framework ← Gameplay ← Renderer ← Tools')
  } else if (engine === 'unreal') {
    lines.push('- Memory: UPROPERTY() on all UObject* references')
    lines.push('- Logging: UE_LOG, not printf/cout')
    lines.push('- Threading: FRunnable/AsyncTask, not std::thread')
    lines.push('- Naming: F=struct, U=UObject, A=Actor, E=Enum')
  } else if (engine === 'godot') {
    lines.push('- Type hints on all functions')
    lines.push('- Signals: connect in _ready(), disconnect in _exit_tree()')
    lines.push('- Movement: use _physics_process, not _process')
  }

  if (serverLanguage === 'go') {
    lines.push('- Error wrapping: fmt.Errorf with %w')
    lines.push('- Goroutines: use safego.Go, not bare go func()')
    lines.push('- DB access: through db_server RPC only')
  }

  lines.push('')
  lines.push('## Forbidden Zones')
  lines.push('See .danya/guard-rules.json for auto-detected forbidden zones.')
  lines.push('')

  return lines.join('\n')
}

function writeHookScript(dir: string, name: string, content: string): void {
  writeFileSync(join(dir, name), content, { encoding: 'utf-8', mode: 0o755 })
}

function generateGuardRules(engine: string | null, serverLanguage: string | null): GuardRule[] {
  const rules: GuardRule[] = []
  if (engine === 'unity') {
    rules.push(
      { pattern: 'Config/Gen/', description: 'Auto-generated config', fix_hint: 'Edit Excel → run ConfigGenerate' },
      { pattern: 'Scripts/Framework/', description: 'Core framework', fix_hint: 'Needs programmer approval' },
    )
  }
  if (engine === 'unreal') {
    rules.push({ pattern: 'Generated/', description: 'UE generated code', fix_hint: 'Regenerate via UBT' })
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

// Embedded hook scripts
const GUARD_SCRIPT = `#!/bin/bash
# Gate 0: GUARD — forbidden zone check. Exit 2 = block.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
[ -z "$FILE_PATH" ] && exit 0
FILE_PATH=$(echo "$FILE_PATH" | sed 's/\\\\\\\\/\\//g')
RULES=".danya/guard-rules.json"
[ ! -f "$RULES" ] && exit 0
while IFS= read -r p; do
  p=$(echo "$p" | tr -d '"' | tr -d ' ')
  [ -z "$p" ] && continue
  if echo "$FILE_PATH" | grep -qE "$p" 2>/dev/null; then
    echo "❌ GUARD: $FILE_PATH is in forbidden zone ($p)" >&2
    exit 2
  fi
done < <(grep '"pattern"' "$RULES" | sed 's/.*"pattern"\\s*:\\s*"//;s/".*//')
exit 0
`

const SYNTAX_CHECK_SCRIPT = `#!/bin/bash
# Gate 1: SYNTAX — post-edit syntax check. Always exit 0.
exit 0
`

const PRE_COMMIT_SCRIPT = `#!/bin/bash
# Gate 3: COMMIT — pre-commit lint. Exit 2 = block.
INPUT=$(cat)
CMD=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
echo "$CMD" | grep -qE 'git\\s+commit' || exit 0
echo "$CMD" | grep -qE 'make\\s+(lint|test)' && exit 0
if [ -f "Makefile" ]; then
  make lint > /tmp/danya-lint.log 2>&1 || { echo "❌ Lint failed" >&2; tail -10 /tmp/danya-lint.log >&2; exit 2; }
fi
exit 0
`

const POST_COMMIT_SCRIPT = `#!/bin/bash
# Gate 4: Post-commit review reminder. Always exit 0.
echo '{"systemMessage":"✅ Commit done. Run /review before push (score >= 80, no CRITICAL)."}'
exit 0
`

const PUSH_GATE_SCRIPT = `#!/bin/bash
# Gate 5: PUSH — check push-approved marker. Exit 2 = block.
INPUT=$(cat)
CMD=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
echo "$CMD" | grep -qE 'git[[:space:]]+push' || exit 0
MARKER=".danya/push-approved"
[ ! -f "$MARKER" ] && { echo "❌ PUSH BLOCKED: run /review first" >&2; exit 2; }
rm -f "$MARKER"
exit 0
`

function isClaudeModel(): boolean {
  try {
    const modelManager = getModelManager()
    const modelName = modelManager.getCurrentModel()
    return Boolean(modelName && modelName.startsWith('claude'))
  } catch {
    return false
  }
}
