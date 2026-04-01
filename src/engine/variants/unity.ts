export const UNITY_ENGINE_KNOWLEDGE = `
# Engine Knowledge: Unity

## Lifecycle
- MonoBehaviour: Awake → OnEnable → Start → FixedUpdate → Update → LateUpdate → OnDisable → OnDestroy
- ScriptableObject: OnEnable → OnDisable → OnDestroy
- Execution order matters — use [DefaultExecutionOrder] or Script Execution Order settings when dependencies exist between scripts.

## Async & Coroutines
- Prefer UniTask over System.Threading.Tasks.Task. UniTask is zero-allocation, Unity-lifecycle-aware, and cancellation-friendly.
- Use .Forget() to fire-and-forget UniTask without warnings.
- Coroutines (StartCoroutine) are tied to the GameObject lifecycle — if the GameObject is destroyed, the coroutine dies silently.
- Never use async void — use async UniTaskVoid or async UniTask instead.

## ECS / DOTS
- DOTS uses a separate World from GameObjects. Communication between them requires bridge systems.
- Components are pure data structs (IComponentData). No methods, no references to managed objects.
- Systems contain all logic. Never store Entity or Component references across frames.

## Resource Management
- Use the project's asset loading framework (Addressables, YooAsset, etc.) — never use Resources.Load in production code.
- Pooled objects: load via object pool utility, return via pool Free(). NEVER call Destroy() on pooled objects.

## Common Pitfalls
- Main thread only: Unity API calls must happen on the main thread.
- Null comparison: Unity overrides == null for destroyed objects.
- SerializeField rename: Renaming a serialized field breaks all scenes/prefabs using it. Use [FormerlySerializedAs].
- Scene files (.unity) are often SVN-managed. Never commit to Git unless the project workflow explicitly allows it.
`

export const UNITY_CODING_CONVENTIONS = `
# Engine Conventions: Unity

## Logging
- Use the project's logging wrapper. NEVER use Debug.Log / Debug.LogWarning / Debug.LogError.

## Async
- Use UniTask, not System.Threading.Tasks.Task.
- Use .Forget() for fire-and-forget.

## Object Lifecycle
- Load from pool, return to pool. NEVER call Destroy() on pooled objects.

## Events
- Subscribe and Unsubscribe MUST be paired. Missing Unsubscribe = memory leak.

## Architecture Direction (Unidirectional Dependency)
- Framework ← Gameplay ← Renderer ← Tools. Lower layers MUST NOT reference upper layers.
- Managers communicate via EventManager, not direct references.
`

export const UNITY_PITFALLS = `
# Engine Pitfalls: Unity

- Main thread constraint: All Unity API calls must be on the main thread.
- Coroutine lifecycle: Coroutines die when the host GameObject is destroyed or disabled.
- SerializeField rename: Renaming a serialized field breaks all scenes/prefabs.
- DOTS interop: GameObject World and DOTS World are separate.
- Object pool: Calling Destroy() on a pooled object corrupts the pool.
- Event leak: Missing Unsubscribe causes handlers to fire on destroyed objects.
- async void: swallows exceptions silently. Always use async UniTask.
`

export const UNITY_REVIEW_CHECKS = `
# Unity Mechanical Review Checks

- UC-01: Debug.Log / Debug.LogWarning / Debug.LogError usage (HIGH)
- UC-02: async Task instead of async UniTask (HIGH)
- UC-03: Task.Delay instead of UniTask.Delay (HIGH)
- UC-04: Destroy() on potentially pooled object (HIGH)
- UC-05: new GameObject() in non-editor code for high-frequency use (MEDIUM)
- UC-06: Missing [CUSTOM_MOD] on third-party modification (HIGH)
- UC-07: using System.Threading.Tasks import (HIGH)
- UC-08: Layer violation: Framework importing Gameplay (CRITICAL)
- UC-09: Layer violation: Gameplay importing Renderer (HIGH)
`

export function getUnityVariantPrompt(): string {
  return [
    UNITY_ENGINE_KNOWLEDGE,
    UNITY_CODING_CONVENTIONS,
    UNITY_PITFALLS,
  ].join('\n')
}
