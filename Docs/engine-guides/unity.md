# Unity Setup Guide

## Detection

Danya auto-detects Unity projects by finding `ProjectSettings/` and `Assets/` directories.

## Build Tools

- **CSharpSyntaxCheck** — Instant Roslyn-based syntax validation (<500ms)
- **UnityBuild** — Full Unity compilation via `dotnet build` or batch mode

## Review Checks (UC-01 to UC-09)

| ID | Check | Severity |
|----|-------|----------|
| UC-01 | Debug.Log usage | HIGH |
| UC-02 | async Task instead of UniTask | HIGH |
| UC-03 | Task.Delay instead of UniTask.Delay | HIGH |
| UC-04 | Destroy() on pooled objects | HIGH |
| UC-05 | new GameObject() in hot path | MEDIUM |
| UC-06 | Third-party mod without [CUSTOM_MOD] | HIGH |
| UC-07 | System.Threading.Tasks import | HIGH |
| UC-08 | Framework importing Gameplay | CRITICAL |
| UC-09 | Gameplay importing Renderer | HIGH |

## Typical AGENTS.md

```markdown
## Build & Test
- Build: Unity Editor → File > Build Settings
- Test: Window > General > Test Runner

## Architecture
- Framework ← Gameplay ← Renderer ← Tools
- Managers communicate via EventManager

## Conventions
- Logging: MLog.Info?.Log(), NOT Debug.Log
- Async: UniTask, NOT System.Threading.Tasks.Task
- Pool: ObjectPoolUtility.Instance.Free(), NOT Destroy()
```
