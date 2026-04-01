export const GODOT_ENGINE_KNOWLEDGE = `
# Engine Knowledge: Godot

## Lifecycle
- Node: _init → _enter_tree → _ready → _process/_physics_process → _exit_tree
- _ready() fires bottom-up (children first, then parent).
- _process(delta) runs every frame. _physics_process(delta) runs at fixed physics tick rate.

## Scene & Node Architecture
- Everything is a node. Scenes are saved node trees (.tscn/.scn).
- Composition over inheritance: build complex behavior by combining specialized child nodes.
- Autoloads (singletons): global nodes that persist across scene changes.

## Signals
- Signals are Godot's event system. Prefer signals over direct node references.
- Connect in _ready(), disconnect in _exit_tree() to prevent stale connections.

## Resource System
- Resources (.tres, .res) are data containers. Reference-counted, avoid circular references.
- preload() resolves at compile time — faster but only works with constant paths.

## Networking
- High-level multiplayer API: MultiplayerPeer, MultiplayerSpawner, MultiplayerSynchronizer.
- RPC: @rpc annotation with authority, call_local, reliable/unreliable modes.
`

export const GODOT_CODING_CONVENTIONS = `
# Engine Conventions: Godot

## GDScript Style
- Variables: snake_case. Functions: snake_case. Constants: SCREAMING_SNAKE.
- Classes: PascalCase. Signals: snake_case. Enums: PascalCase name, SCREAMING_SNAKE values.

## Type Hints
- ALWAYS use type hints: var speed: float = 10.0 or var speed := 10.0
- Use typed arrays: var enemies: Array[Enemy] = []
- Use return types: func get_health() -> int:

## Signal Best Practices
- Connect in _ready(), disconnect in _exit_tree().
- Use Callable syntax (Godot 4.x): signal_name.connect(callable)
`

export const GODOT_PITFALLS = `
# Engine Pitfalls: Godot

- Node ready order: _ready() fires bottom-up. Sibling order = tree declaration order.
- @export rename: Renaming an @export variable breaks all .tscn files.
- Signal leak: Forgetting to disconnect signals before removing/freeing a node.
- _process vs _physics_process: Movement in _process is framerate-dependent.
- Tool mode (@tool): Scripts with @tool run in the editor. Unintended side effects.
- Freed object access: Accessing a freed node may silently corrupt memory. Use is_instance_valid().
- Thread safety: Godot is NOT thread-safe for scene tree operations. Use call_deferred().
`

export function getGodotVariantPrompt(): string {
  return [
    GODOT_ENGINE_KNOWLEDGE,
    GODOT_CODING_CONVENTIONS,
    GODOT_PITFALLS,
  ].join('\n')
}
