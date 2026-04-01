export const TOOL_NAME = 'CSharpSyntaxCheck'

export const DESCRIPTION = `Performs Roslyn-based AST-level C# syntax validation. Catches syntax errors instantly without waiting for full Unity/Godot compilation.

Usage:
- Automatically triggered after writing/editing .cs files via post-tool hook
- Can also be called manually to check a specific file
- Returns structured errors with file path, line number, column, error code, and message
- Typical execution: <500ms per file`
