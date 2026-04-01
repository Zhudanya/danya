#!/bin/bash
# Gate 5: PUSH — Pre-Push marker check
# Blocks push unless .danya/push-approved exists.
# Consumes marker (one-time use).
# Exit 0 = allow, Exit 2 = block

set -uo pipefail

# Read input to check if this is a git push command
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')

# Only gate git push commands
if ! echo "$COMMAND" | grep -qE 'git\s+push'; then
  exit 0
fi

# Find .danya directory (look up from cwd)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MARKER="$SCRIPT_DIR/../push-approved"

if [ ! -f "$MARKER" ]; then
  echo "❌ PUSH BLOCKED" >&2
  echo "   Review has not been completed or did not pass." >&2
  echo "   Run /review first, achieve score >= 80 with no CRITICAL issues." >&2
  exit 2
fi

# Consume marker (one-time use)
SCORE=$(grep -o '"score":\s*[0-9]*' "$MARKER" | grep -o '[0-9]*' || echo "?")
echo "✅ Push approved (review score: $SCORE/100)"
rm -f "$MARKER"
exit 0
