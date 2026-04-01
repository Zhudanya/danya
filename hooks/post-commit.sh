#!/bin/bash
# Gate 4: Post-Commit review reminder
# Outputs a systemMessage reminding to run /review before push.
# Exit 0 always (soft nudge, not a hard gate).

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')

if ! echo "$COMMAND" | grep -qE 'git\s+commit'; then
  exit 0
fi

# Check if commit actually happened (not "nothing to commit")
STDOUT=$(echo "$INPUT" | grep -o '"stdout"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')
if echo "$STDOUT" | grep -qiE 'nothing to commit|no changes'; then
  exit 0
fi

echo '{"systemMessage":"✅ Commit complete. Run /review before pushing to verify code quality (score >= 80, no CRITICAL)."}'
exit 0
