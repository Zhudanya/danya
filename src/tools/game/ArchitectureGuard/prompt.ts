export const TOOL_NAME = 'ArchitectureGuard'

export const DESCRIPTION = `Static analysis to detect architecture/dependency violations.

Checks:
- Layer dependency direction (e.g., Framework ← Gameplay ← Renderer ← Tools)
- Forbidden zone edits (auto-generated code, protected directories)
- Cross-module import violations

Supports: C# (using), Go (import), C++ (#include), GDScript (preload).
Fast: regex-based, typically <2s.`
