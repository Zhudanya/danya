# Danya — Game Dev AI Coding Assistant

<p align="center">
  <b>AI-powered terminal coding assistant built for game development</b><br>
  Engine-Aware · Gate Chain Quality Control · Full-Auto Pipelines · Multi-Model Support
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/Zhudanya/danya?style=flat" alt="License" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/github/stars/Zhudanya/danya?style=flat&color=green" alt="Stars" />
  <img src="https://komarev.com/ghpvc/?username=Zhudanya-danya&label=Repo%20views&color=0e75b6&style=flat" alt="Repo views" />
</p>

<p align="center">
  English | <a href="README_CN.md">中文</a> | <a href="https://zhudanya.github.io/posts/danya-complete-guide-en/">Full Guide</a>
</p>

---

## Install

```bash
# Option 1: npm (recommended)
npm install -g @danya-ai/cli

# Option 2: from source
git clone https://github.com/Zhudanya/danya.git
cd danya
bun install && bun run build
npm install -g .
```

```bash
# Verify
danya --version
```

## Update

```bash
npm install -g @danya-ai/cli@latest
```

## Quick Start

```bash
# Enter your game project and start danya (first launch guides model setup)
cd <your-game-project>
danya

# Initialize harness (auto-detects engine, generates rules, commands, hooks)
# Note: auto-initializes on first launch, or manually:
/init

# In-conversation commands
/auto-work "add inventory sorting"         # Full-auto pipeline (7 stages)
/auto-bugfix "character animation glitch"  # Auto bug fix (must reproduce first)
/review                                    # Score-based code review (100-point)
/fix-harness                               # Self-evolution (update harness rules)
/plan "big feature"                        # Analyze requirements, generate plan
/verify                                    # Mechanical verification (quick|build|full)
/parallel-execute prepare "big feature"    # Wave-based parallel execution
/orchestrate task.md                       # Auto-iterate (AI codes→verify→commit/revert×N)
/red-blue servers/                         # Red-blue adversarial (find bugs→fix→loop)
/monitor summary 7                         # View harness effectiveness data
```

```bash
# Terminal commands (shell-enforced, for large tasks / unattended)
danya auto-work "implement weapon upgrade"  # Shell-enforced pipeline (each stage = independent danya -p)
danya parallel <tasks-dir>                  # Multi-agent parallel (independent worktrees)
danya red-blue [scope]                      # Red-blue adversarial (unattended)
danya orchestrate <task.md>                 # Auto-iterate (AI codes→verify→commit/revert)
danya analyze --metric summary              # Data analysis (8 metrics)
danya dashboard -w                          # Real-time monitoring dashboard
danya report                                # Monthly report
danya check-env                             # Environment dependency check
```

### Configure AI Model

Type `/model` in a Danya conversation:

1. Select **Manage Model List** → add new model
2. Choose Provider:
   - **Custom Messages API** — Claude (Anthropic API)
   - **Custom OpenAI-Compatible API** — GPT / DeepSeek / Qwen / GLM etc.
   - **Ollama** — local models
3. Paste API Key → press Enter for remaining steps (use defaults)
4. Return to `/model` page, select the model to use

#### Model Reference

| Model | Provider | Base URL | Model ID | Max Tokens | Context |
|-------|----------|----------|----------|------------|---------|
| Claude Opus 4.6 | Messages API | `https://api.anthropic.com` | `claude-opus-4-6` | 16K | 200K |
| Claude Sonnet 4.6 | Messages API | `https://api.anthropic.com` | `claude-sonnet-4-6` | 16K | 200K |
| DeepSeek V3 | Messages API | `https://api.deepseek.com/anthropic` | `deepseek-chat` | 8K | 128K |
| GPT-4o | OpenAI-Compatible | `https://api.openai.com/v1` | `gpt-4o` | 16K | 128K |
| Qwen Max | OpenAI-Compatible | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-max` | 8K | 128K |

Model config saved in `~/.danya/config.json` — no manual editing needed.

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+G` | Open external editor, content auto-fills on close |
| `Shift+Enter` | Newline without submitting |
| `Enter` | Submit |
| `Ctrl+M` | Quick model switch |
| `Shift+Tab` | Toggle input mode (normal / bash / memory) |

---

## What is Danya

Danya is a terminal-based AI coding assistant **designed specifically for game development**. It's not a generic code completion tool — it's an Agent that understands game project architecture, enforces quality standards, and automates entire development workflows.

**Works out of the box** — enter your game project and start Danya. It auto-detects the engine type, generates a complete harness system (rules, commands, hooks, memory). No manual setup needed. If you previously used Claude Code or Codex, existing `.claude/` or `.codex/` configs are automatically consolidated into `.danya/`.

---

## What's New in v0.2.0 (Phase 4)

### 5 New Game-Specific Tools
- **CppServerBuild** — CMake/Ninja build, cppcheck lint, ctest (C++ Server)
- **JavaServerBuild** — Maven/Gradle build, checkstyle lint, JUnit test (Java Server)
- **NodeServerBuild** — tsc compile, ESLint lint, Jest/Vitest test (Node.js Server)
- **PerfLint** — Static performance analysis for hot paths (Unity/Unreal/Godot)
- **ProtoCompat** — Proto breaking change detection via git diff
- **ShaderCheck** — Shader validation (variant explosion, sampler limits, syntax)

### Enhanced Tools
- **AssetCheck** — Now supports Unreal Engine (naming conventions, size warnings, reference validation) + deep nesting detection (>10 levels) + inactive large object detection for all engines

### New Server Language Support
- **C++ Server** — CMakeLists.txt detection, engine variant, build tool, template bundle
- **Java Server** — pom.xml/build.gradle + game keywords detection, engine variant, build tool, template bundle
- **Node.js Server** — package.json + colyseus/socket.io detection, engine variant, build tool, template bundle

### New Hook
- **AssetGuard** — Pre-commit hook that blocks large binary files (>5MB) not tracked by Git LFS

---

## Features

### Core Capabilities
- **AI-Powered Assistant** — Advanced AI models understand and respond to your requests
- **Multi-Model Support** — Flexibly switch between 20+ AI providers, use different models for different tasks
- **Code Editing** — Direct file editing with intelligent suggestions
- **Codebase Understanding** — Analyze project structure and code relationships
- **Command Execution** — Run shell commands and see results in real-time
- **Interactive UI** — Beautiful terminal interface with syntax highlighting
- **Tool System** — Extensible architecture (22 general + 18 game-specific = 40 tools)

### Game Development
- **Engine Awareness** — Auto-detect Unity / UE / Godot / Go Server / C++ Server / Java Server / Node.js Server, inject engine domain knowledge
- **Complete Harness Built-in** — `/init` releases rules, commands, hooks, memory templates out of the box
- **Gate Chain Quality Control** — 6 gates enforce code quality (hooks block mechanically, Agent cannot bypass)
- **Score-Based Review** — 100-point quantified review, 33 engine check rules, quality ratchet
- **Full-Auto Pipelines** — /auto-work (7 stages), /auto-bugfix (5 rounds), /parallel-execute (wave parallel)
- **Harness Self-Evolution** — Auto-detects error-then-fix patterns, updates rules to prevent recurrence
- **Knowledge Sediment** — Auto-documents development results to Docs/, no knowledge loss

### Automation Toolchain
- **Auto-Iterate Scoring** — /orchestrate: AI codes → quantitative verify (0-100) → commit/revert × N rounds, circuit break after 5 failures
- **Red-Blue Adversarial** — /red-blue: red team finds bugs → blue team fixes → loop until zero bugs → extract skills to rules
- **5 Role Agents** — code-writer, code-reviewer, red-team, blue-team, skill-extractor
- **Shell-Enforced Orchestration** — Terminal commands `danya auto-work/parallel/red-blue/orchestrate`, each stage in independent process
- **Data Monitoring** — Auto-collect tool usage, verify time, review scores, bugfix rounds to JSONL
- **8 Analytics Metrics** — `danya analyze`: tool distribution, verify time, review trends, bugfix efficiency, week-over-week compare
- **Real-Time Dashboard** — `danya dashboard`: running Agent processes, active conversations, background tasks

### Engineering
- **Three-Layer Isolation** — Auto-detect workspace (client + server), independent configs per layer
- **Legacy Compatible** — Auto-consolidate `.claude/` and `.codex/` into `.danya/`, seamless migration
- **Smart Context Compression** — Semantic grouping + selective compression + 8-section structured summary + file recovery
- **Subagent Dispatch** — 5+ tool calls auto-dispatched to subagent to avoid context pollution
- **Auto-Init** — Silently generates `.danya/` on first launch, no manual /init needed

---

## Core Advantages for Game Dev

### 1. Engine-Aware System Prompt

Danya auto-detects engine type on startup and injects domain knowledge:

```
Launch in Unity project → system prompt includes:
  - MonoBehaviour lifecycle
  - UniTask async patterns
  - DOTS/ECS architecture rules
  - Object pool conventions
  - Event subscribe/unsubscribe pairing

Launch in Go server project → system prompt includes:
  - 10+ microservice architecture
  - RPC call chains
  - ORM code generation rules
  - Config pipeline flow
```

The Agent knows your project's rules from **the very first output**.

### 2. Complete Harness Out of the Box

Enter project, start Danya — full governance system auto-generated:

```
.danya/
├── rules/           — Constraint rules (constitution, golden-principles, known-pitfalls...)
├── commands/        — Workflow commands (auto-work, review, fix-harness, verify...)
├── memory/          — Persistent domain knowledge
├── hooks/           — Mechanical enforcement scripts (guard, commit check, push gate...)
├── agents/          — Role agents (code-writer, red-team, blue-team...)
├── scripts/         — Shell-enforced orchestration (auto-work-loop, parallel-wave...)
├── monitor/         — Data collection & analysis
├── settings.json    — Hook registration
├── gate-chain.json  — Gate chain config
└── guard-rules.json — Forbidden zone rules
```

7 engine templates built-in (Unity, Go Server, Unreal, Godot, C++ Server, Java Server, Node.js Server). Users can freely customize — Danya never overwrites your changes.

### 3. Auto-Generated Code Protection

**Gate 0 (Guard)** blocks edits before they happen:

```
Agent tries to edit Config/Gen/XXXConfig.cs
  → Guard Hook detects forbidden zone
  → Blocks edit
  → Tells Agent: "This is auto-generated code. Edit the Excel source and regenerate."
```

### 4. Score-Based Code Review

```
Initial: 100
CRITICAL: -30 (any CRITICAL = automatic FAIL)
HIGH:     -10
MEDIUM:    -3
Pass: >= 80 AND zero CRITICAL

Quality ratchet: score can only go up, not down
```

33 mechanical checks run automatically (5 engine rulesets). AI judgment supplements architecture and logic review.

### 5. Full-Auto Development Pipeline

One command completes the entire cycle:

```bash
/auto-work "add inventory sorting"

→ Stage 0: Classify → feature
→ Stage 1: Plan → 3 files to modify
→ Stage 2: Code → write code + auto compile check (fail-fast)
→ Stage 3: Review → 88/100 PASS
→ Stage 4: Commit → <feat>(inventory) add item sorting
→ Stage 5: Sediment → Docs/Version/v1.2/inventory-sorting/summary.md
→ Stage 6: Evolve → update rule files
```

### 6. Self-Evolution

```
Agent compile error → fix → compile success
  → PostToolUse Hook detects error-then-fix pattern
  → Prompts: "Run /fix-harness to update rules"
  → Routes to correct rule file (constitution / golden-principles / known-pitfalls...)
  → Adds: wrong approach + correct approach
  → Never makes the same mistake again
```

### 7. Three-Layer Isolation (Workspace Mode)

```
workspace/
├── .danya/            — Cross-project rules (protocol sync, config tables)
├── client/
│   └── .danya/        — Client-specific (Unity rules, C# hooks)
└── server/
    └── .danya/        — Server-specific (Go rules, RPC constraints)
```

### 8. Auto-Iterate & Red-Blue Testing

```bash
danya orchestrate my-task.md -n 20
# AI codes → verify (0-100) → commit if ≥ baseline / revert if not → loop 20 rounds

danya red-blue servers/logic_server/
# Red team (read-only) finds all bugs → Blue team fixes → loop until zero bugs
# skill-extractor writes learnings to rules/memory
```

### 9. Data Monitoring & Analysis

```bash
danya analyze --metric summary --days 7    # Summary report
danya analyze --metric compare --days 7    # This week vs last week
danya dashboard -w                         # Real-time dashboard
```

8 metrics: tool distribution, top-N tools, sessions, verify time, bugfix efficiency, review score trends, summary, week-over-week compare.

---

## 18 Game-Specific Tools

| Tool | Purpose | Engine |
|------|---------|--------|
| **CSharpSyntaxCheck** | Roslyn instant syntax check | Unity, Godot |
| **UnityBuild** | Unity build pipeline | Unity |
| **UnrealBuild** | UBT build | UE |
| **GodotBuild** | GDScript/C# check | Godot |
| **GameServerBuild** | Leveled verification (lint/build/test) | Go Server |
| **CppServerBuild** | CMake/Ninja build, cppcheck lint, ctest | C++ Server |
| **JavaServerBuild** | Maven/Gradle build, checkstyle lint, JUnit test | Java Server |
| **NodeServerBuild** | tsc compile, ESLint lint, Jest/Vitest test | Node.js Server |
| **ProtoCompile** | Protobuf compile + stub generation | Cross-engine |
| **ProtoCompat** | Proto breaking change detection via git diff | Cross-engine |
| **ConfigGenerate** | Config table generation | Cross-engine |
| **OrmGenerate** | ORM code generation | Go Server |
| **ScoreReview** | 100-point scoring review | Cross-engine |
| **GateChain** | Gate chain orchestration | Cross-engine |
| **KnowledgeSediment** | Auto knowledge documentation | Cross-engine |
| **ArchitectureGuard** | Dependency direction check | Cross-engine |
| **AssetCheck** | Asset reference integrity + size/nesting checks | Unity, Godot, UE |
| **PerfLint** | Static performance analysis for hot paths | Unity, UE, Godot |
| **ShaderCheck** | Shader validation (variants, samplers, syntax) | Unity, UE, Godot |

---

## Gate Chain

Every code change passes through 6 quality gates:

```
Edit → Guard → Syntax → Verify → Commit → Review → Push
       Hook     Hook     Tool     Hook    AI+Tool   Hook
       (block)  (check)  (build)  (lint)  (score)   (token)
```

- **Mechanical (Hook)**: Guard / Syntax / Commit / Push — shell scripts, Agent cannot bypass
- **AI Judgment (Score)**: Review — understands code quality, quantified by scoring system
- **Self-Evolution (Hook)**: PostToolUse auto-detects error-then-fix patterns
- **AssetGuard (Hook)**: Pre-commit hook blocks large binary files (>5MB) not tracked by Git LFS

**Push Token**: Review pass generates `push-approved` token, consumed on push (one-time use).

---

## Compatibility

| Scenario | Behavior |
|----------|----------|
| Project has `.claude/` | Auto-consolidated into `.danya/`, custom content preserved |
| Project has `.codex/` | Same as above |
| Both `.danya/` and `.claude/` exist | `.danya/` takes priority, unique `.claude/` content merged in |
| Same-name file conflict | `.danya/` kept, `.claude/` skipped |
| Runtime | Only reads `.danya/`, never reads `.claude/` or `.codex/` |
| Claude model | `/init` generates `CLAUDE.md` |
| Other models | `/init` generates `AGENTS.md` |

---

## Supported Engines

| Engine | Detection | Build Tools | Review Rules |
|--------|-----------|-------------|-------------|
| **Unity** | `ProjectSettings/` + `Assets/` | UnityBuild, CSharpSyntaxCheck | 9 (UC-01~09) |
| **Unreal Engine** | `*.uproject` | UnrealBuild | 6 (UE-01~06) |
| **Godot** | `project.godot` | GodotBuild | 5 (GD-01~05) |
| **Go Game Server** | `go.mod` | GameServerBuild | 9 (GO-01~09) |
| **C++ Server** | `CMakeLists.txt` | CppServerBuild | — |
| **Java Server** | `pom.xml` / `build.gradle` + game keywords | JavaServerBuild | — |
| **Node.js Server** | `package.json` + colyseus/socket.io | NodeServerBuild | — |

4 universal review rules (U-01~04) apply to all projects.

---

## Configuration

```
~/.danya/config.json       — Global config (API keys, model config)
.danya/
├── rules/                 — Constraint rules (constitution, golden-principles, known-pitfalls...)
├── commands/              — Workflow commands (auto-work, review, fix-harness...)
├── memory/                — Persistent domain knowledge
├── hooks/                 — Mechanical enforcement scripts
├── agents/                — Role agents (code-writer, red-team, blue-team...)
├── scripts/               — Shell-enforced orchestration (auto-work-loop, parallel-wave...)
├── monitor/               — Data collection & analysis (log-*.py, analyze.py, dashboard.py)
├── templates/             — Task definition templates (for orchestrator)
├── settings.json          — Hook registration
├── gate-chain.json        — Gate chain config
└── guard-rules.json       — Forbidden zone rules
CLAUDE.md / AGENTS.md      — Project instructions
```

---

## Learning Project

Danya is a **learning project** exploring AI Agent engineering practices in game development. Not for commercial use.

The core value is not "yet another Claude Code clone" but answering the question: **How much better can an AI Agent be when specifically customized for game development?**

The answer:
- Generic assistants say "done" after editing — Danya auto-verifies + scores
- Generic assistants don't know auto-generated dirs are off-limits — Danya hooks block mechanically
- Generic assistants review as PASS/FAIL — Danya uses 100-point quantified scoring
- Generic assistants don't preserve knowledge — Danya auto-documents to Docs/
- Generic assistants don't self-evolve after errors — Danya auto-updates rules
- Generic assistants don't understand workspace isolation — Danya auto-detects client/server layers
- A proven Game Harness baked into the Agent, ready out of the box

**Domain-specific > generic.**

## License

Apache 2.0 License - see [LICENSE](LICENSE).
