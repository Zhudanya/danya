/**
 * Java server bundle — rules, commands, memory for Java game servers.
 */

import * as common from './common'

export const JAVA_RULES_CONSTITUTION = `# Forbidden Zone Constitution

## Auto-Generated Code (DO NOT edit manually)
- \`{{PROTO_GEN_PATH}}\` — Protobuf generated Java code. Edit .proto → protoc.
- \`{{CONFIG_GEN_PATH}}\` — Config generated from data tables. Edit source → regenerate.
- \`{{ORM_GEN_PATH}}\` — MyBatis/JPA generated mappers. Edit XML/annotations → regenerate.

## Build Output
- \`target/\` (Maven) or \`build/\` (Gradle) — Build artifacts. Never edit.

## Important
When you see these files, tell the user HOW to regenerate instead of editing directly.
`

export const JAVA_RULES_GOLDEN_PRINCIPLES = `# Golden Principles — Java Server

Non-negotiable coding rules.

## Error Handling
- ❌ Empty catch blocks
- ❌ Catching Exception/Throwable broadly
- ✅ Catch specific exceptions
- ✅ Log with context: logger.error("op={} player={}", op, id, ex)

## Concurrency
- ❌ Blocking Netty EventLoop thread
- ❌ Shared mutable state without synchronization
- ✅ ConcurrentHashMap for shared collections
- ✅ Thread confinement for game session state

## GC Awareness
- ❌ Boxing primitives in hot paths
- ❌ Creating objects per tick (new ArrayList, new HashMap)
- ✅ Preallocate and reuse collections
- ✅ Primitive-specialized collections for performance-critical code

## Netty
- ❌ Forgetting to release ByteBuf (memory leak)
- ✅ ReferenceCountUtil.release() or try-finally
- ✅ Check Channel.isWritable() before writing

## Workflow
- Plan first for multi-file changes
- Use TaskCreate for progress tracking
`

export const JAVA_RULES_STYLE = `# Java Style Guide

## File Naming
- PascalCase for class files: PlayerManager.java
- One public class per file
- Package structure: com.game.{module}.{feature}

## Naming Conventions
- PascalCase: classes, interfaces, enums
- camelCase: methods, fields, local variables
- UPPER_SNAKE: static final constants

## Logging
- Use SLF4J + Logback
- logger.debug — development, verbose
- logger.info — normal operations
- logger.warn — recoverable issues
- logger.error — errors that need attention
- ❌ System.out.println for logging

## Testing
- JUnit 5 for unit tests
- Mockito for mocking
- Test class: {ClassName}Test.java
`

export const JAVA_MEMORY_ARCHITECTURE = `---
name: server-architecture
description: Java game server architecture overview
type: project
---

## Architecture

_Update this with your project's actual architecture._

| Module | Role |
|--------|------|
| network/ | Netty pipeline, connection management |
| game/ | Game logic, room/session management |
| handler/ | Message handlers |
| model/ | Data models, entities |
| service/ | Business logic services |
| dao/ | Data access layer |

## Build
- Maven or Gradle
- JDK 17+ recommended
- JVM flags: -Xms2g -Xmx2g -XX:+UseG1GC
`

export const JAVA_HOOK_VERIFY = `#!/bin/bash
# Leveled verification for Java server.
LEVEL=\${1:-quick}

if [ -f build.gradle ] || [ -f build.gradle.kts ]; then
  BUILD_TOOL="gradle"
else
  BUILD_TOOL="maven"
fi

case "$LEVEL" in
  quick)
    if [ "$BUILD_TOOL" = "gradle" ]; then
      ./gradlew checkstyleMain 2>&1 || true
    else
      mvn checkstyle:check -q 2>&1 || true
    fi
    ;;
  build)
    if [ "$BUILD_TOOL" = "gradle" ]; then
      ./gradlew compileJava 2>&1 || exit 1
    else
      mvn compile -q 2>&1 || exit 1
    fi
    ;;
  full)
    if [ "$BUILD_TOOL" = "gradle" ]; then
      ./gradlew test 2>&1 || exit 1
    else
      mvn test -q 2>&1 || exit 1
    fi
    ;;
esac
exit 0
`

export function getJavaServerBundle(): Record<string, string> {
  return {
    'rules/constitution.md.tmpl': JAVA_RULES_CONSTITUTION,
    'rules/golden-principles.md': JAVA_RULES_GOLDEN_PRINCIPLES,
    'rules/java-style.md': JAVA_RULES_STYLE,
    'rules/known-pitfalls.md': common.RULE_KNOWN_PITFALLS,
    'rules/architecture-boundaries.md': common.RULE_ARCHITECTURE_BOUNDARIES,
    'commands/auto-work.md': common.CMD_AUTO_WORK,
    'commands/auto-bugfix.md': common.CMD_AUTO_BUGFIX,
    'commands/review.md': common.CMD_REVIEW,
    'commands/fix-harness.md': common.CMD_FIX_HARNESS,
    'commands/plan.md': common.CMD_PLAN,
    'commands/verify.md': common.CMD_VERIFY,
    'commands/parallel-execute.md': common.CMD_PARALLEL_EXECUTE,
    'memory/MEMORY.md': common.MEMORY_INDEX,
    'memory/server-architecture.md': JAVA_MEMORY_ARCHITECTURE,
    'hooks/constitution-guard.sh': common.HOOK_CONSTITUTION_GUARD,
    'hooks/verify-server.sh': JAVA_HOOK_VERIFY,
    'hooks/pre-commit.sh': common.HOOK_PRE_COMMIT,
    'hooks/post-commit.sh': common.HOOK_POST_COMMIT,
    'hooks/push-gate.sh': common.HOOK_PUSH_GATE,
    'hooks/harness-evolution.sh': common.HOOK_HARNESS_EVOLUTION,
  }
}
