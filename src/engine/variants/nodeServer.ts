/**
 * Node.js game server variant — engine knowledge, conventions, pitfalls.
 */

export const NODE_SERVER_ENGINE_KNOWLEDGE = `## Node.js Game Server Knowledge

### Frameworks
- **Colyseus** — room-based multiplayer framework, automatic state synchronization
- **Socket.IO** — real-time bidirectional event-based communication
- **geckos.io** — UDP-based real-time communication using WebRTC
- **Photon** (client SDK) — when server is Photon Cloud, Node handles auxiliary services

### Runtime
- **Node.js** — V8 engine, single-threaded event loop
- **Bun** — faster runtime, compatible with Node.js APIs
- **TypeScript** — strongly recommended for game server code

### Concurrency Model
- Single event loop — never block it
- Worker threads for CPU-intensive tasks (pathfinding, physics)
- Cluster module or PM2 for multi-core utilization
- async/await for I/O operations

### Common Patterns
- Room/match pattern: each game session is an isolated room with its own state
- State synchronization: server-authoritative state, delta patches to clients
- Tick-based game loop: setInterval or custom high-resolution timer
- Message schema: define message types, validate on receive

### Database
- Redis for session state, matchmaking queues, leaderboards
- MongoDB/PostgreSQL for persistent player data
- In-memory for active game state (rooms are ephemeral)
`

export const NODE_SERVER_CODING_CONVENTIONS = `## Node.js Server Coding Conventions

### Naming
- PascalCase for classes: \`GameRoom\`, \`PlayerState\`
- camelCase for functions, variables, methods: \`onJoin()\`, \`playerCount\`
- UPPER_SNAKE for constants: \`MAX_PLAYERS\`, \`TICK_RATE\`
- kebab-case for file names: \`game-room.ts\`, \`player-state.ts\`

### File Organization
- Feature-based directory structure
- Separate room definitions, schemas, and handlers
- Co-locate tests with source files (\`*.test.ts\` or \`*.spec.ts\`)

### TypeScript
- strict mode enabled
- Explicit return types on public methods
- Use interfaces for message schemas
- Avoid \`any\` — use \`unknown\` and narrow

### Error Handling
- try/catch around async operations
- Graceful disconnect handling (player timeout, network drop)
- Process-level error handlers: uncaughtException, unhandledRejection
- Never crash the server on a single player's bad input
`

export const NODE_SERVER_PITFALLS = `## Node.js Server Pitfalls

### Event Loop
- ❌ Blocking the event loop (JSON.parse on huge payloads, crypto sync, tight loops)
- ❌ CPU-intensive work on main thread — use Worker threads
- ❌ Synchronous file operations (fs.readFileSync) in request handlers
- ❌ Large setInterval callbacks that exceed tick interval

### Memory
- ❌ Leaking event listeners (on without off) — causes memory growth
- ❌ Closures capturing large scopes in long-lived callbacks
- ❌ Unbounded arrays/maps for player history — set max sizes
- ❌ Not cleaning up rooms/sessions when players disconnect

### WebSocket
- ❌ Not handling disconnect gracefully — implement reconnect window
- ❌ Sending state to disconnected clients — check connection status
- ❌ Broadcasting full state every tick — use delta/patch updates
- ❌ No message validation — always validate client messages

### Colyseus Specific
- ❌ Mutating @type schema outside room handler — use room.state
- ❌ Heavy computation in onMessage — offload to worker
- ❌ Not implementing onLeave cleanup — resources leak
- ❌ Forgetting to call this.clock.start() for delayed actions
`

export function getNodeServerVariantPrompt(): string {
  return [
    NODE_SERVER_ENGINE_KNOWLEDGE,
    NODE_SERVER_CODING_CONVENTIONS,
    NODE_SERVER_PITFALLS,
  ].join('\n\n')
}
