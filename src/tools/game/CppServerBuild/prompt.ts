export const TOOL_NAME = 'CppServerBuild'

export const DESCRIPTION = `Build and verify a C++ game server with configurable verification levels.

Levels:
- quick: lint only (cppcheck/clang-tidy, <1min)
- build: lint + compile via CMake (default, 1-5min)
- full: lint + compile + test via ctest (2-10min)

Reports structured errors with file path, line number, and message for each stage.`
