export const TOOL_NAME = 'UnrealBuild'

export const DESCRIPTION = `Build an Unreal Engine project using Unreal Build Tool (UBT). Parses both MSVC and Clang compiler output for structured error reporting.

Usage:
- Invokes UnrealBuildTool for C++ compilation
- Supports platforms: Win64, Linux, Mac
- Supports configurations: Development, DebugGame, Shipping
- Reports structured errors with file path, line, column, severity, and message
- Typical execution: 30s-10min depending on project size`
