export const TOOL_NAME = 'PerfLint'

export const DESCRIPTION = `Static performance analysis for game code. Detects common performance pitfalls in hot paths (Update/Tick/_process).

Supports: Unity (C#), Unreal (C++), Godot (GDScript/C#)

Checks include:
- Memory allocation in hot paths (new/Instantiate in Update/Tick)
- Per-frame expensive lookups (GetComponent, FindActor, get_node)
- String concatenation in hot paths
- Uncached expensive queries (Camera.main, etc.)
- Signal/event listener leaks

Each issue maps to MEDIUM severity (-3 points in ScoreReview).`
