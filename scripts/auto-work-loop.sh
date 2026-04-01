#!/bin/bash
# auto-work-loop.sh — Shell-enforced auto-work pipeline
# Each stage runs a separate `danya -p` with isolated context.
# Shell controls flow — agent cannot skip stages.
#
# Usage: bash scripts/auto-work-loop.sh "<requirement>"

set -uo pipefail

REQUIREMENT="${1:?Usage: auto-work-loop.sh '<requirement>'}"
PROJECT_ROOT="$(pwd)"
DANYA_CMD="${DANYA_CMD:-danya}"
MAX_CODE_ROUNDS="${MAX_CODE_ROUNDS:-3}"
MAX_REVIEW_ROUNDS="${MAX_REVIEW_ROUNDS:-3}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="${PROJECT_ROOT}/.danya/logs/auto-work-${TIMESTAMP}"
mkdir -p "$LOG_DIR"

echo "========================================="
echo "  Danya Auto-Work Shell Orchestrator"
echo "========================================="
echo "  Requirement: $REQUIREMENT"
echo "  Project: $PROJECT_ROOT"
echo "  Logs: $LOG_DIR"
echo "========================================="

run_stage() {
    local stage="$1"
    local prompt="$2"
    local log_file="$LOG_DIR/${stage}.log"
    echo ""
    echo ">>> Stage: $stage"
    $DANYA_CMD -p "$prompt" > "$log_file" 2>&1
    local exit_code=$?
    echo "  Exit: $exit_code | Log: $log_file"
    return $exit_code
}

# Stage 0: Classify
echo ""
echo "=== Stage 0: Classify ==="
TYPE=$($DANYA_CMD -p "Classify this requirement as one word (bug/feature/refactor): $REQUIREMENT" 2>/dev/null | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
case "$TYPE" in bug|fix) TYPE="bug" ;; feature|feat) TYPE="feature" ;; refactor) TYPE="refactor" ;; *) TYPE="feature" ;; esac
echo "  Type: $TYPE"

# Stage 1: Plan
echo ""
echo "=== Stage 1: Plan ==="
run_stage "plan" "Analyze and plan for this $TYPE requirement: $REQUIREMENT. List files to modify with one-line intent each."

# Stage 2: Code (retry loop)
echo ""
echo "=== Stage 2: Code ==="
for ((round=1; round<=MAX_CODE_ROUNDS; round++)); do
    echo "--- Round $round/$MAX_CODE_ROUNDS ---"
    run_stage "code-$round" "Implement the plan for: $REQUIREMENT. This is coding round $round. Follow all rules in AGENTS.md and .danya/rules/."

    if make build 2>"$LOG_DIR/build-$round.log" || go build ./... 2>"$LOG_DIR/build-$round.log"; then
        echo "  [PASS] Build successful"
        break
    else
        echo "  [FAIL] Build failed"
        if [[ $round -ge $MAX_CODE_ROUNDS ]]; then
            echo "  [END] Max rounds reached. Pipeline terminated."
            exit 1
        fi
    fi
done

# Stage 3: Review (retry + ratchet)
echo ""
echo "=== Stage 3: Review ==="
best_score=0
for ((round=1; round<=MAX_REVIEW_ROUNDS; round++)); do
    echo "--- Review round $round/$MAX_REVIEW_ROUNDS ---"
    run_stage "review-$round" "Run /review on the current changes. Output the score as: REVIEW_SCORE: <number>"

    score=$(grep -oP 'REVIEW_SCORE:\s*\K[0-9]+' "$LOG_DIR/review-$round.log" 2>/dev/null || echo "0")
    echo "  Score: $score (baseline: $best_score)"

    # Quality ratchet
    if [[ "$score" -lt "$best_score" ]]; then
        echo "  [RATCHET] Score dropped. Rolling back."
        git checkout . 2>/dev/null
        continue
    fi
    best_score=$score

    if [[ "$score" -ge 80 ]]; then
        echo "  [PASS] Review passed ($score/100)"
        break
    else
        echo "  [FAIL] Score below 80"
        if [[ $round -ge $MAX_REVIEW_ROUNDS ]]; then
            echo "  [END] Max review rounds. Pipeline terminated."
            exit 1
        fi
        run_stage "fix-review-$round" "Fix the review issues (score was $score/100). Focus on CRITICAL and HIGH issues."
    fi
done

# Stage 4: Commit
echo ""
echo "=== Stage 4: Commit ==="
run_stage "commit" "Commit the changes with format: <$( [ "$TYPE" = "bug" ] && echo "fix" || echo "feat" )>(scope) description. Requirement: $REQUIREMENT"

# Stage 5: Sediment
echo ""
echo "=== Stage 5: Knowledge Sediment ==="
run_stage "sediment" "Use KnowledgeSediment to document this $TYPE work: $REQUIREMENT" || true

# Stage 6: Harness Evolution
echo ""
echo "=== Stage 6: Harness Evolution ==="
run_stage "harness" "Check if any rules need updating based on errors fixed during development." || true

# Done
echo ""
echo "========================================="
echo "  Auto-Work Complete"
echo "========================================="
echo "  Requirement: $REQUIREMENT"
echo "  Type: $TYPE"
echo "  Review score: $best_score/100"
echo "  Logs: $LOG_DIR"
echo "========================================="
