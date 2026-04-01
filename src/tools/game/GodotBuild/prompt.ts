export const TOOL_NAME = 'GodotBuild'

export const DESCRIPTION = `Build and validate a Godot project. Supports both GDScript (via headless Godot) and C# (via dotnet build) workflows.

Usage:
- For GDScript: runs godot --headless --check-only to validate scripts
- For C# projects: runs dotnet build on the .csproj
- check_only mode validates without producing export artifacts
- Reports structured errors with file path, line number, and message
- Typical execution: 5-30s`
