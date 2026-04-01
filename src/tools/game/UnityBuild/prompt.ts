export const TOOL_NAME = 'UnityBuild'

export const DESCRIPTION = `Compile a Unity project in batch mode. Attempts script-only compilation via dotnet build first, then falls back to reporting that the Unity editor is needed for a full build.

Usage:
- Validates C# scripts compile correctly without opening the Unity editor
- Parses Unity/MSBuild log format for structured error reporting
- Supports build targets: editor, android, ios, windows
- Typical execution: 10-60s for script compilation`
