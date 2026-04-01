#!/bin/bash
# Gate 0: GUARD — Pre-Edit forbidden zone check
# Blocks edits to auto-generated code and protected directories.
# Exit 0 = allow, Exit 2 = block
#
# Reads hook input from stdin (JSON)
# Checks file_path against .danya/guard-rules.json patterns

set -uo pipefail

# Read input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')

if [ -z "$FILE_PATH" ]; then
  exit 0  # No file path — allow
fi

# Normalize path (backslash → forward slash)
FILE_PATH=$(echo "$FILE_PATH" | sed 's/\\/\//g')

# Load guard rules
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RULES_FILE="$SCRIPT_DIR/../guard-rules.json"

if [ ! -f "$RULES_FILE" ]; then
  exit 0  # No rules file — allow all
fi

# Check each pattern
while IFS= read -r pattern; do
  pattern=$(echo "$pattern" | tr -d '"' | tr -d ' ')
  if [ -z "$pattern" ]; then continue; fi

  if echo "$FILE_PATH" | grep -qE "$pattern" 2>/dev/null; then
    echo "❌ GUARD VIOLATION: $FILE_PATH matches forbidden pattern: $pattern" >&2
    echo "   Edit the source file and regenerate, or find a workaround in allowed directories." >&2
    exit 2
  fi
done < <(grep '"pattern"' "$RULES_FILE" | sed 's/.*"pattern"\s*:\s*"//;s/".*//')

exit 0
