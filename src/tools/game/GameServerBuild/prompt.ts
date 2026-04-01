export const TOOL_NAME = 'GameServerBuild'

export const DESCRIPTION = `Build and verify a Go game server with configurable verification levels.

Levels:
- quick: lint only (fastest, <30s)
- build: lint + compile (default, 30s-2min)
- full: lint + compile + test (1-5min)

Reports structured errors with file path, line number, and message for each stage.`
