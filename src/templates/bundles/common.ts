/**
 * Common templates shared across all engine types.
 */

// ── Commands ────────────────────────────────────────────

export const CMD_AUTO_WORK = `# /auto-work <requirement>

Full-auto development pipeline. Walks through the entire cycle without manual intervention.

## Stages

### Stage 0: Classify
Determine requirement type: bug | feature | refactor

### Stage 1: Plan
- List all files to modify with 1-line intent per file
- If >3 tasks and parallelizable → switch to parallel mode

### Stage 2: Code
- Modify files per plan
- After each file → compile check immediately (fail-fast)
- After all: run /verify
- Verify fail → fix (max 3 rounds), else abort

### Stage 3: Review
- Run /review (100-point scoring)
- CRITICAL → fail; <80 → fail
- Quality ratchet: score must not drop
- Pass → write push-approved marker

### Stage 4: Commit
- git add + git commit
- Pre-commit hook runs lint + test
- Fail → fix and retry (max 2 times)

### Stage 5: Knowledge Deposit
- Feature → Docs/Version/<version>/<feature>/summary.md
- Bug → Docs/Bugs/<version>/<bug-name>.md
- New module → Docs/Engine/Business/<module>/

### Stage 6: Harness Self-Evolution
- Check for errors fixed in Stages 2-3
- If found → update .danya/rules/ to prevent recurrence

## Termination Conditions
- Verify fail after 3 rounds (Stage 2)
- Review score <80 after 3 rounds (Stage 3)
- Commit fail after 2 attempts (Stage 4)

## Important
- Do NOT push. Push is manual after human review.
- Do NOT skip stages. Each stage must complete before next.
`

export const CMD_AUTO_BUGFIX = `# /auto-bugfix <bug-description>

Autonomous bug-fix pipeline. Must reproduce before fixing.

## Flow

### Step 1: Reproduce
- Analyze bug description
- Find reproduction steps
- Verify the bug exists (compile, run test, check logs)
- If NOT reproducible → report and STOP

### Step 2: Root Cause Analysis
- Trace from symptom to root cause
- Do NOT guess. Read code, check logs, add debug output if needed.

### Step 3: Fix (max 5 rounds)
- Modify code to fix root cause
- Run /verify after each fix attempt
- If verify fails → analyze why and try again
- If 5 rounds exhausted → report failure

### Step 4: Review + Commit
- Run /review (must pass ≥80, no CRITICAL)
- git commit with descriptive message

### Step 5: Knowledge Deposit
- Write to Docs/Bugs/<version>/<bug-name>.md
- Include: reproduction steps, root cause, fix, lessons learned

### Step 6: Harness Evolution
- If this bug type isn't in known-pitfalls.md → add it
`

export const CMD_REVIEW = `# /review

Score-based code review. Quantitative, not subjective.

## Pre-check
Run /verify first. If verify fails, fix before reviewing.

## Scoring System
- Initial score: 100
- CRITICAL: -30 each (any CRITICAL = automatic FAIL)
- HIGH: -10 each
- MEDIUM: -3 each
- Pass threshold: ≥80 AND no CRITICAL

## Check Categories

### 1. Architecture Compliance (mechanical + AI)
- Forbidden file edits (constitution)?
- Cross-layer imports?
- Package boundary violations?

### 2. Coding Standards (mechanical + AI)
- Engine-specific style violations?
- Error handling patterns?
- Naming conventions?

### 3. Logic Review (AI only)
- Intent clarity
- Error propagation
- Concurrency safety
- Edge cases
- Dead code

### 4. Harness Completeness
- Were errors fixed during development?
- Did rules get updated to match?

## Quality Ratchet
Score must not drop compared to previous review. If it drops, the fix introduced regressions.

## Output
On PASS: write .danya/push-approved marker (one-time use).
On FAIL: list all issues with severity, do NOT write marker.
`

export const CMD_FIX_HARNESS = `# /fix-harness [error-description]

Update harness rules after discovering an error pattern.

## Process

1. Analyze the error that occurred
2. Route to the correct rule file:
   - Forbidden zone violation → constitution.md
   - Coding principle violation → golden-principles.md
   - Known pitfall re-occurrence → known-pitfalls.md
   - Architecture boundary violation → architecture-boundaries.md
   - Style issue → engine-style rule file
3. Add a concise rule:
   - ❌ What went wrong (with example)
   - ✅ Correct approach (with example)
4. If mechanically checkable → add to /verify checks
5. Check total rule file lines < 550 (if exceeded, consolidate)

## Important
- Only add NEW patterns not already captured
- Keep rules minimal: one error = one rule
- Include correct-usage example, not just prohibition
`

export const CMD_PLAN = `# /plan <requirement>

Analyze requirement and create a development plan.

## Output Format

### 1. Requirement Analysis
- What needs to change and why
- Scope assessment

### 2. File Checklist
For each file to modify:
- File path
- 1-line description of changes
- Risk level (low/medium/high)

### 3. Execution Order
- Dependencies between changes
- Which files can be modified in parallel
- Which must be sequential

### 4. Verification Strategy
- How to verify each change works
- Integration test approach

## Rules
- Read existing code before planning changes
- Check architecture boundaries before proposing cross-layer changes
- Flag any forbidden zone files that would need regeneration
`

export const CMD_VERIFY = `# /verify [level]

Mechanical verification checks. Levels: quick | build | full

## quick (default)
- Lint check
- Syntax check (engine-specific)

## build
- Everything in quick
- Full compilation/build

## full
- Everything in build
- Run tests
- Architecture boundary check

## Important
- Run this BEFORE /review
- If verify fails, fix issues before reviewing
- Exit with clear pass/fail and error details
`

export const CMD_PARALLEL_EXECUTE = `# /parallel-execute <mode> <description>

Wave-based parallel task execution.

## Modes
- prepare: Decompose task into sub-tasks with dependency declarations
- execute: Run prepared tasks in parallel waves

## Prepare Mode
Create task files in .danya/exec-plans/active/:
- task-01.md, task-02.md, etc.
- Each has YAML frontmatter with \`depends: []\` field
- Tasks with no dependencies → Wave 1
- Tasks depending on Wave 1 → Wave 2, etc.

## Execute Mode
- Parse dependency DAG → compute waves
- Wave 1: run all independent tasks in parallel (separate worktrees)
- Collect results, merge successful tasks
- Wave 2: run next batch
- Continue until all waves complete
- Run /verify full on integrated code

## Rules
- Each task must be atomic (can succeed/fail independently)
- Failed task → rollback its worktree, don't affect others
- Cyclic dependencies → error, re-decompose
`

// ── Rules ───────────────────────────────────────────────

export const RULE_KNOWN_PITFALLS = `# Known Pitfalls

Real errors encountered during development. Each entry prevents the same mistake.

_This file grows through harness self-evolution. Start empty, fill as errors occur._
`

export const RULE_ARCHITECTURE_BOUNDARIES = `# Architecture Boundaries

Dependency direction rules. Higher layers can import lower layers, not vice versa.

## General Principle
- One-way dependencies: lower layers must NOT reference higher layers
- Cross-module communication through events/interfaces, not direct references

_Customize with your project's actual layer structure._
`

// ── Memory ──────────────────────────────────────────────

export const MEMORY_INDEX = `# Project Memory

Persistent domain knowledge. Updated as the agent learns about this project.

_Memory files are auto-loaded each session and survive context compression._
`

// ── Hooks ───────────────────────────────────────────────

export const HOOK_CONSTITUTION_GUARD = `#!/bin/bash
# Gate 0: GUARD — forbidden zone check. Exit 2 = block.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
[ -z "$FILE_PATH" ] && exit 0
FILE_PATH=$(echo "$FILE_PATH" | sed 's/\\\\\\\\/\\//g')
RULES=".danya/guard-rules.json"
[ ! -f "$RULES" ] && exit 0
while IFS= read -r p; do
  p=$(echo "$p" | tr -d '"' | tr -d ' ')
  [ -z "$p" ] && continue
  if echo "$FILE_PATH" | grep -qE "$p" 2>/dev/null; then
    echo "{\\"systemMessage\\":\\"❌ GUARD: $FILE_PATH is in forbidden zone ($p). Edit the source data and regenerate instead.\\"}"
    exit 2
  fi
done < <(grep '"pattern"' "$RULES" | sed 's/.*"pattern"\\s*:\\s*"//;s/".*//')
exit 0
`

export const HOOK_ASSET_GUARD = `#!/bin/bash
# Gate: Asset guard — block large binary files not tracked by Git LFS.
# Runs as part of pre-commit. Exit 2 = block.
INPUT=$(cat)
CMD=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
echo "$CMD" | grep -qE 'git[[:space:]]+commit' || exit 0

SIZE_THRESHOLD=\${ASSET_GUARD_THRESHOLD:-5242880}  # 5MB default

# Check for .gitattributes
if [ ! -f ".gitattributes" ]; then
  echo '{"systemMessage":"⚠️ No .gitattributes found. Consider adding Git LFS tracking for binary assets (textures, meshes, audio)."}' >&2
fi

# Check staged files for large binaries not tracked by LFS
LARGE_FILES=""
for FILE in $(git diff --cached --name-only --diff-filter=ACM 2>/dev/null); do
  # Skip text files
  case "$FILE" in
    *.cs|*.cpp|*.h|*.hpp|*.py|*.js|*.ts|*.gd|*.md|*.txt|*.json|*.yaml|*.yml|*.xml|*.toml|*.cfg|*.ini|*.sh|*.bat)
      continue ;;
  esac

  # Check file size
  if [ -f "$FILE" ]; then
    SIZE=$(wc -c < "$FILE" 2>/dev/null | tr -d ' ')
    if [ "\${SIZE:-0}" -gt "$SIZE_THRESHOLD" ]; then
      # Check if tracked by LFS
      if ! git lfs ls-files --name-only 2>/dev/null | grep -qF "$FILE"; then
        SIZE_MB=$(( SIZE / 1048576 ))
        LARGE_FILES="$LARGE_FILES\\n  $FILE (\${SIZE_MB}MB)"
      fi
    fi
  fi
done

if [ -n "$LARGE_FILES" ]; then
  echo "❌ Large binary files not tracked by Git LFS (threshold: $(( SIZE_THRESHOLD / 1048576 ))MB):$LARGE_FILES" >&2
  echo "" >&2
  echo "Fix: git lfs track '<pattern>' && git add .gitattributes" >&2
  exit 2
fi
exit 0
`

export const HOOK_PRE_COMMIT = `#!/bin/bash
# Gate 3: COMMIT — pre-commit lint + test. Exit 2 = block.
INPUT=$(cat)
CMD=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
echo "$CMD" | grep -qE 'git\\s+commit' || exit 0
if [ -f "Makefile" ]; then
  make lint > /tmp/danya-lint.log 2>&1 || { echo "❌ Lint failed" >&2; tail -10 /tmp/danya-lint.log >&2; exit 2; }
  make test > /tmp/danya-test.log 2>&1 || { echo "❌ Tests failed" >&2; tail -10 /tmp/danya-test.log >&2; exit 2; }
fi
exit 0
`

export const HOOK_POST_COMMIT = `#!/bin/bash
# Gate 4: Post-commit review reminder. Always exit 0.
echo '{"systemMessage":"✅ Commit done. Run /review before push (score ≥80, no CRITICAL)."}'
exit 0
`

export const HOOK_PUSH_GATE = `#!/bin/bash
# Gate 5: PUSH — check push-approved marker. Exit 2 = block.
INPUT=$(cat)
CMD=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
echo "$CMD" | grep -qE 'git[[:space:]]+push' || exit 0
MARKER=".danya/push-approved"
[ ! -f "$MARKER" ] && { echo "❌ PUSH BLOCKED: run /review first" >&2; exit 2; }
rm -f "$MARKER"
exit 0
`

export const HOOK_HARNESS_EVOLUTION = `#!/bin/bash
# PostToolUse: detect error-then-fix pattern for harness self-evolution.
# Reads tool result, checks if a previous error was just fixed.
# If so, injects a system message prompting the agent to update rules.
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | sed -n 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' 2>/dev/null)
EXIT_CODE=$(echo "$INPUT" | sed -n 's/.*"exit_code"[[:space:]]*:[[:space:]]*\\([0-9]*\\).*/\\1/p' 2>/dev/null)

# Track error state using project-scoped file (stable across hook invocations)
STATE_FILE=".danya/.error-state"

case "$TOOL_NAME" in
  Bash)
    if [ "$EXIT_CODE" != "0" ] && [ -n "$EXIT_CODE" ]; then
      # Error occurred — record it
      echo "error" > "$STATE_FILE" 2>/dev/null
    elif [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE" 2>/dev/null)" = "error" ]; then
      # Previous error, now success — fix confirmed
      rm -f "$STATE_FILE"
      echo '{"systemMessage":"Error was fixed. Consider running /fix-harness to update rules and prevent this error pattern in the future."}'
    fi
    ;;
esac
exit 0
`
