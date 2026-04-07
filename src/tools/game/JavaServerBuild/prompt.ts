export const TOOL_NAME = 'JavaServerBuild'

export const DESCRIPTION = `Build and verify a Java game server with configurable verification levels.

Levels:
- quick: lint/checkstyle only (<1min)
- build: lint + compile via Maven/Gradle (default, 1-5min)
- full: lint + compile + test (2-10min)

Reports structured errors with file path, line number, and message for each stage.`
