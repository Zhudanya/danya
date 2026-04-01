# Configuration Guide

## Model Configuration

### Config file: `~/.danya/config.json`

```json
{
  "modelProfiles": [
    {
      "name": "DeepSeek V3",
      "provider": "deepseek",
      "modelName": "deepseek-chat",
      "baseURL": "https://api.deepseek.com/v1",
      "apiKey": "sk-xxx",
      "maxTokens": 8192,
      "contextLength": 128000,
      "isActive": true
    }
  ],
  "modelPointers": {
    "main": "DeepSeek V3",
    "task": "DeepSeek V3",
    "compact": "DeepSeek V3",
    "quick": "DeepSeek V3"
  }
}
```

### Model Pointers

| Pointer | Purpose | Used By |
|---------|---------|---------|
| `main` | Primary coding and conversation | User interaction, code editing |
| `task` | Sub-agent tasks | Codebase exploration, knowledge sediment |
| `compact` | Context compression | Auto-compaction when approaching limits |
| `quick` | Fast classification | Requirement classification, commit messages |

## Gate Chain Configuration

### Config file: `.danya/gate-chain.json`

```json
{
  "gates": {
    "guard": { "enabled": true },
    "syntax": { "enabled": true },
    "verify": { "enabled": true, "default_level": "build" },
    "commit": { "enabled": true },
    "review": { "enabled": true },
    "push": { "enabled": true, "require_review": true }
  }
}
```

### Disabling Gates

Set `"enabled": false` to skip any gate. Not recommended for guard and push gates.

## Hook Configuration

### Config file: `.danya/settings.json`

Hooks fire at tool lifecycle events:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "bash .danya/hooks/guard.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "filePattern": "\\.(cs|go)$",
        "hooks": [{ "type": "command", "command": "bash .danya/hooks/syntax-check.sh" }]
      }
    ]
  }
}
```

### Hook Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| 0 | Allow (success) |
| 1 | Warning (non-blocking) |
| 2 | Block (hard stop) |

## Forbidden Zones

### Config file: `.danya/guard-rules.json`

```json
[
  {
    "pattern": "Config/Gen/",
    "description": "Auto-generated config code",
    "fix_hint": "Edit source Excel → run ConfigGenerate"
  }
]
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DANYA_CONFIG_DIR` | Override config directory (default: ~/.danya) |
| `DANYA_OFFLINE` | Disable network features |
| `DANYA_RIPGREP_PATH` | Custom ripgrep binary path |
