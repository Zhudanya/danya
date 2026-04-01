# Getting Started with Danya

## Installation

```bash
npm install -g @danya/cli
```

## Setup

### 1. Initialize your project

```bash
cd <your-game-project>
danya init
```

This creates:
- `.danya/` directory with gate chain hooks and configuration
- `AGENTS.md` template with engine-specific coding conventions
- Forbidden zone rules based on detected engine

### 2. Configure your AI model

Run `danya` and follow the model setup wizard, or use a preset:

**For Chinese teams (DeepSeek + Qwen):**
```bash
danya models import presets/china.yaml
```

**For international teams (Claude + GPT):**
```bash
danya models import presets/international.yaml
```

### 3. Start coding

```bash
danya
```

## Key Commands

- `/review` — Run score-based code review before pushing
- `/auto-work "add feature X"` — Full-auto development pipeline
- `/auto-bugfix "bug description"` — Automated bug fix with reproduction
- `/init` — Reinitialize project configuration

## How the Gate Chain Works

When you edit code, Danya automatically enforces quality:

1. **Guard hook** blocks edits to auto-generated code
2. **Syntax hook** checks syntax after every file edit
3. **Verify** runs build + lint before commit
4. **Review** scores your code changes (need 80+ to pass)
5. **Push gate** requires review approval before pushing

## Tips

- Customize `AGENTS.md` with your project-specific rules
- Add forbidden zones to `.danya/guard-rules.json`
- Use `/auto-work` for features, `/auto-bugfix` for bugs
- The quality ratchet prevents review score from decreasing
