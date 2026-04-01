#!/bin/bash
# Gate 1: SYNTAX — Post-Edit syntax check
# Runs language-specific syntax validation after file edits.
# Reports errors as systemMessage (does not block — file is already written).
# Exit 0 always.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

EXT="${FILE_PATH##*.}"

case "$EXT" in
  cs)
    # C# — try dotnet build if .csproj exists
    DIR=$(dirname "$FILE_PATH")
    CSPROJ=$(find "$DIR" -maxdepth 3 -name "*.csproj" -print -quit 2>/dev/null)
    if [ -n "$CSPROJ" ]; then
      ERRORS=$(dotnet build "$CSPROJ" --no-restore --nologo -v q 2>&1 | grep -E "error CS" | head -5)
      if [ -n "$ERRORS" ]; then
        echo "{\"systemMessage\":\"⚠️ C# syntax errors detected:\\n$ERRORS\"}"
      fi
    fi
    ;;
  go)
    # Go — quick vet
    DIR=$(dirname "$FILE_PATH")
    ERRORS=$(cd "$DIR" && go vet ./... 2>&1 | head -5)
    if [ -n "$ERRORS" ]; then
      echo "{\"systemMessage\":\"⚠️ Go vet issues:\\n$ERRORS\"}"
    fi
    ;;
esac

exit 0
