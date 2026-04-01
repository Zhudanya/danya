# Godot Setup Guide

## Detection
Danya auto-detects Godot projects by finding `project.godot`.

## Build Tools
- **GodotBuild** — `godot --headless --check-only` + `dotnet build` for C#

## Review Checks (GD-01 to GD-05)
| ID | Check | Severity |
|----|-------|----------|
| GD-01 | Missing type hints | MEDIUM |
| GD-02 | print() in non-debug code | MEDIUM |
| GD-03 | yield (deprecated in Godot 4) | HIGH |
| GD-04 | Movement in _process | HIGH |
| GD-05 | Missing class_name | MEDIUM |
