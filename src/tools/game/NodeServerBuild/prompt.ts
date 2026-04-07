export const TOOL_NAME = 'NodeServerBuild'

export const DESCRIPTION = `Build and verify a Node.js game server with configurable verification levels.

Levels:
- quick: lint only (ESLint, <30s)
- build: lint + TypeScript compile (default, 30s-2min)
- full: lint + compile + test (1-5min)

Reports structured errors with file path, line number, and message for each stage.`
