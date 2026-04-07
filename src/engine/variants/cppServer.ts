/**
 * C++ game server variant — engine knowledge, conventions, pitfalls.
 */

export const CPP_SERVER_ENGINE_KNOWLEDGE = `## C++ Game Server Knowledge

### Build Systems
- **CMake** — most common, use CMakeLists.txt + target-based configuration
- **Ninja** — fast builds, commonly used as CMake generator (-G Ninja)
- **Make** — fallback, Makefile-based builds

### Memory Management
- RAII: acquire in constructor, release in destructor
- Prefer std::unique_ptr for single ownership, std::shared_ptr for shared ownership
- Never use raw new/delete in application code
- Object pools for frequently created/destroyed game objects (projectiles, particles)

### Concurrency Model
- Thread-per-service or thread pool with work stealing
- Lock-free queues for inter-thread communication
- std::mutex for shared state, prefer std::shared_mutex for read-heavy scenarios
- Avoid lock ordering issues — always acquire locks in consistent order

### Network Frameworks
- **Boost.Asio** — async I/O, most mature
- **libevent / libuv** — event-driven networking
- **gRPC** — for inter-service RPC
- **Protobuf** — serialization for client-server messages

### Common Patterns
- Entity-Component-System (ECS) for game state
- Fixed-timestep game loop for deterministic simulation
- Ring buffer for network packet history (rollback/replay)
- Message queues between game thread and network thread
`

export const CPP_SERVER_CODING_CONVENTIONS = `## C++ Server Coding Conventions

### Naming
- PascalCase for classes and structs: \`PlayerManager\`, \`GameSession\`
- camelCase for methods and local variables: \`getPlayer()\`, \`sessionCount\`
- UPPER_SNAKE for constants and macros: \`MAX_PLAYERS\`, \`TICK_RATE\`
- snake_case for file names: \`player_manager.cpp\`, \`game_session.h\`
- Header guards or #pragma once

### File Organization
- .h for declarations, .cpp for definitions
- One class per file pair (unless tightly coupled helper classes)
- Group by feature/module, not by type

### Error Handling
- Use exceptions for exceptional conditions, error codes for expected failures
- RAII ensures cleanup even when exceptions are thrown
- Log errors with context: file, function, relevant IDs

### Modern C++ (C++17/20)
- Use auto for complex types, explicit types for simple ones
- Structured bindings: \`auto [key, value] = *it;\`
- std::optional for nullable values
- std::string_view for non-owning string parameters
- constexpr where possible
`

export const CPP_SERVER_PITFALLS = `## C++ Server Pitfalls

### Memory
- ❌ Raw pointers for ownership — use smart pointers
- ❌ Dangling references to destroyed objects — weak_ptr or ID-based lookup
- ❌ Memory leaks in error paths — RAII handles this
- ❌ Unbounded container growth — set max sizes, preallocate

### Concurrency
- ❌ Data races on shared game state — protect with mutex or make thread-local
- ❌ Deadlocks from inconsistent lock ordering — document lock hierarchy
- ❌ Blocking the game loop thread — offload IO to worker threads
- ❌ std::shared_ptr across threads without atomic operations

### Performance
- ❌ Allocating in hot path (game tick) — preallocate, use pools
- ❌ Virtual function calls in tight loops — consider ECS data-oriented design
- ❌ Cache-unfriendly data layouts (AoS) — prefer SoA for hot data
- ❌ String operations in tick — use string IDs or hashes

### Build
- ❌ Including everything from a header — forward declare when possible
- ❌ Recompiling the world — use pch, minimize header dependencies
- ❌ Mixing debug/release libraries — link consistently
`

export function getCppServerVariantPrompt(): string {
  return [
    CPP_SERVER_ENGINE_KNOWLEDGE,
    CPP_SERVER_CODING_CONVENTIONS,
    CPP_SERVER_PITFALLS,
  ].join('\n\n')
}
