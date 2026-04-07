/**
 * Java game server variant — engine knowledge, conventions, pitfalls.
 */

export const JAVA_SERVER_ENGINE_KNOWLEDGE = `## Java Game Server Knowledge

### Build Systems
- **Maven** — pom.xml, convention over configuration, widespread
- **Gradle** — build.gradle / build.gradle.kts, flexible, faster incremental builds

### Frameworks
- **Netty** — async event-driven networking, channel pipelines for protocol handling
- **Spring Boot** — when using HTTP/REST alongside game protocol
- **Vert.x** — reactive, event-loop based (similar to Node.js model)

### Concurrency Model
- Thread pool per service (ExecutorService)
- Netty EventLoopGroup — NIO-based event loops
- Virtual threads (Java 21+) for blocking IO in game logic
- CompletableFuture for async orchestration
- Minimize synchronized blocks — prefer concurrent collections

### Common Patterns
- Room/Session model: each game session has its own state and tick loop
- Message codec pipeline: ByteBuf → decode → GameMessage → handle → encode → ByteBuf
- Protobuf for serialization, custom codecs for performance-critical paths
- Connection management: heartbeat, reconnect, graceful disconnect

### JVM Tuning
- G1GC or ZGC for low-pause game servers
- -Xms = -Xmx to avoid heap resizing during gameplay
- Monitor GC pauses — they cause player-visible lag
`

export const JAVA_SERVER_CODING_CONVENTIONS = `## Java Server Coding Conventions

### Naming
- PascalCase for classes: \`PlayerManager\`, \`GameSession\`
- camelCase for methods and fields: \`getPlayer()\`, \`sessionCount\`
- UPPER_SNAKE for constants: \`MAX_PLAYERS\`, \`TICK_RATE_MS\`
- Package structure: \`com.game.{module}.{feature}\`

### File Organization
- One public class per file
- Group by feature module, not by layer
- Separate API interfaces from implementations

### Error Handling
- Use checked exceptions for recoverable errors
- Use runtime exceptions for programming errors
- Never catch and ignore exceptions silently
- Log with context: logger.error("Failed to process player={} action={}", playerId, action, ex)

### Dependencies
- Prefer constructor injection over field injection
- Minimize external dependencies — each dependency is a risk
- Pin dependency versions explicitly
`

export const JAVA_SERVER_PITFALLS = `## Java Server Pitfalls

### GC Pressure
- ❌ Boxing primitives in hot paths — use primitive collections (Eclipse Collections, Koloboke)
- ❌ Creating objects per tick (new ArrayList, new HashMap) — preallocate and reuse
- ❌ String concatenation in loops — use StringBuilder
- ❌ Autoboxing in Map<Integer, Object> — use specialized int maps

### Concurrency
- ❌ Shared mutable state without synchronization — use ConcurrentHashMap or thread confinement
- ❌ Blocking Netty EventLoop thread — offload to business thread pool
- ❌ Thread.sleep() in game loop — use ScheduledExecutorService
- ❌ Forgetting to shutdown ExecutorService — register shutdown hooks

### Netty Specific
- ❌ Forgetting to release ByteBuf — causes memory leaks (use ReferenceCountUtil)
- ❌ Doing heavy computation in ChannelHandler — offload to separate thread pool
- ❌ Ignoring backpressure — check Channel.isWritable() before writing

### Performance
- ❌ Reflection in hot paths — cache Method handles
- ❌ Excessive logging in tick loop — use level guards (if logger.isDebugEnabled())
- ❌ Creating iterators per tick — use indexed loops for hot collections
`

export function getJavaServerVariantPrompt(): string {
  return [
    JAVA_SERVER_ENGINE_KNOWLEDGE,
    JAVA_SERVER_CODING_CONVENTIONS,
    JAVA_SERVER_PITFALLS,
  ].join('\n\n')
}
