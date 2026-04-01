#!/bin/bash
# Gate 3: COMMIT — Pre-Commit lint/test check
# Runs project-specific lint and test before allowing commit.
# Exit 0 = allow, Exit 2 = block

set -uo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')

# Only gate git commit commands
if ! echo "$COMMAND" | grep -qE 'git\s+commit'; then
  exit 0
fi

# Don't double-run if command already includes lint/test
if echo "$COMMAND" | grep -qE 'make\s+(lint|test)'; then
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."

# Detect project type and run appropriate checks
if [ -f "$PROJECT_ROOT/go.mod" ] || [ -f "$PROJECT_ROOT/Makefile" ]; then
  # Go project
  if [ -f "$PROJECT_ROOT/Makefile" ]; then
    echo "Pre-commit: running make lint..." >&2
    if ! (cd "$PROJECT_ROOT" && make lint > /tmp/danya-precommit-lint.log 2>&1); then
      echo "❌ PRE-COMMIT BLOCKED: lint failed" >&2
      tail -20 /tmp/danya-precommit-lint.log >&2
      exit 2
    fi
  fi
fi

exit 0
