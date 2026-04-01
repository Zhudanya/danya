#!/bin/bash
# parallel-wave.sh — Wave parallel execution with git worktrees
# Usage: bash scripts/parallel-wave.sh <tasks-dir>

set -uo pipefail

TASKS_DIR="${1:?Usage: parallel-wave.sh <tasks-dir>}"
PROJECT_ROOT="$(pwd)"
DANYA_CMD="${DANYA_CMD:-danya}"
WORKTREES_DIR="${PROJECT_ROOT}/.worktrees"
RESULTS_FILE="${TASKS_DIR}/results.tsv"

echo "========================================="
echo "  Danya Parallel Wave Executor"
echo "========================================="
echo "  Tasks: $TASKS_DIR"
echo "  Project: $PROJECT_ROOT"
echo "========================================="

# Parse task files and compute waves (simplified: tasks without depends go first)
declare -A TASK_DEPS
declare -A TASK_DESC

for f in "$TASKS_DIR"/task-*.md; do
    [ -f "$f" ] || continue
    id=$(basename "$f" .md | sed 's/task-//')
    deps=$(grep -oP 'depends:\s*\[\K[^\]]*' "$f" 2>/dev/null | tr -d '"' | tr -d "'" | tr ',' ' ')
    desc=$(grep -A1 "## Task" "$f" | tail -1)
    TASK_DEPS[$id]="${deps:-}"
    TASK_DESC[$id]="${desc:-No description}"
done

if [ ${#TASK_DEPS[@]} -eq 0 ]; then
    echo "No task files found in $TASKS_DIR"
    exit 1
fi

echo "Tasks found: ${!TASK_DEPS[@]}"
echo ""

# Initialize results
echo -e "task\twave\tstatus\tduration\tnotes" > "$RESULTS_FILE"

# Simple wave computation
declare -A COMPLETED
wave_num=0

while [ ${#COMPLETED[@]} -lt ${#TASK_DEPS[@]} ]; do
    wave_num=$((wave_num + 1))
    wave_tasks=()

    for id in "${!TASK_DEPS[@]}"; do
        [ "${COMPLETED[$id]:-}" = "1" ] && continue

        # Check if all deps are completed
        all_deps_met=true
        for dep in ${TASK_DEPS[$id]}; do
            dep=$(echo "$dep" | tr -d ' ')
            [ -z "$dep" ] && continue
            if [ "${COMPLETED[$dep]:-}" != "1" ]; then
                all_deps_met=false
                break
            fi
        done

        if $all_deps_met; then
            wave_tasks+=("$id")
        fi
    done

    if [ ${#wave_tasks[@]} -eq 0 ]; then
        echo "ERROR: Circular dependency detected!"
        exit 1
    fi

    echo "=== Wave $wave_num: ${wave_tasks[*]} ==="

    # Execute tasks in this wave (parallel)
    pids=()
    for id in "${wave_tasks[@]}"; do
        (
            start_time=$(date +%s)
            branch="auto/task-${id}"
            worktree="${WORKTREES_DIR}/task-${id}"

            echo "  [task-$id] Starting in worktree: $worktree"
            git worktree add "$worktree" -b "$branch" 2>/dev/null

            # Run danya in worktree
            cd "$worktree"
            $DANYA_CMD -p "Execute task: ${TASK_DESC[$id]}" > "${TASKS_DIR}/logs/task-${id}.log" 2>&1
            task_exit=$?

            duration=$(( $(date +%s) - start_time ))

            if [ $task_exit -eq 0 ]; then
                # Merge back
                cd "$PROJECT_ROOT"
                if git merge "$branch" --no-ff -m "merge: task-${id}" 2>/dev/null; then
                    echo -e "${id}\t${wave_num}\tpassed\t${duration}s\tmerged" >> "$RESULTS_FILE"
                    echo "  [task-$id] ✅ PASSED (${duration}s)"
                else
                    echo -e "${id}\t${wave_num}\tconflict\t${duration}s\tmerge conflict" >> "$RESULTS_FILE"
                    echo "  [task-$id] ⚠️ CONFLICT (${duration}s)"
                fi
            else
                echo -e "${id}\t${wave_num}\tfailed\t${duration}s\ttask failed" >> "$RESULTS_FILE"
                echo "  [task-$id] ❌ FAILED (${duration}s)"
            fi

            # Cleanup worktree
            git worktree remove "$worktree" 2>/dev/null
            git branch -D "$branch" 2>/dev/null
        ) &
        pids+=($!)
    done

    # Wait for all tasks in this wave
    for pid in "${pids[@]}"; do
        wait "$pid"
    done

    # Mark completed
    for id in "${wave_tasks[@]}"; do
        COMPLETED[$id]=1
    done
done

echo ""
echo "========================================="
echo "  Parallel Execution Complete"
echo "========================================="
echo "  Waves: $wave_num"
echo "  Results: $RESULTS_FILE"
cat "$RESULTS_FILE"
echo "========================================="
