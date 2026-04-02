/**
 * Shell scripts for Danya — adapted from game-harness-engineering.
 * All `claude` references replaced with `danya`, `.claude/` with `.danya/`.
 */

// ── Auto-Work Shell Orchestrator ────────────────

export const SCRIPT_AUTO_WORK_LOOP = `#!/bin/bash
# auto-work-loop.sh — Shell-enforced full-auto development pipeline.
# Each stage runs an independent danya -p call. Agent cannot skip steps.
set -uo pipefail

REQUIREMENT="\${1:?Usage: auto-work-loop.sh '<requirement>'}"
PROJECT_ROOT="\$(cd "\$(dirname "\$0")/../.." && pwd)"
DANYA_CMD="\${DANYA_CMD:-danya}"
MODEL="\${MODEL:-sonnet}"
MAX_TURNS="\${MAX_TURNS:-30}"
MAX_REVIEW_ROUNDS=3
MAX_FIX_ROUNDS=3
CACHE_DIR="\$PROJECT_ROOT/.danya/.cache/auto-work"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
LOG_DIR="\$CACHE_DIR/\$TIMESTAMP"
mkdir -p "\$LOG_DIR"

echo "========================================="
echo "  Danya Auto-Work Orchestrator"
echo "========================================="
echo "  Requirement: \$REQUIREMENT"
echo "  Project: \$PROJECT_ROOT"
echo "  Logs: \$LOG_DIR"
echo "========================================="

run_danya() {
    local stage="\$1"; local prompt="\$2"; local log_file="\$LOG_DIR/\${stage}.log"
    echo ""; echo ">>> Stage: \$stage"
    \$DANYA_CMD -p "\$prompt" --model "\$MODEL" --max-turns "\$MAX_TURNS" \\
        --allowedTools "Edit,Write,Read,Bash,Grep,Glob" > "\$log_file" 2>&1
    local ec=\$?; echo "  Exit: \$ec | Log: \$log_file"; return \$ec
}

check_build() { echo "  [CHECK] build..."; cd "\$PROJECT_ROOT" && make build > "\$LOG_DIR/build.log" 2>&1; }
check_test()  { echo "  [CHECK] test...";  cd "\$PROJECT_ROOT" && make test  > "\$LOG_DIR/test.log"  2>&1; }

# Stage 0: Classify
echo ""; echo "=== Stage 0: Classify ==="
TYPE=\$(\$DANYA_CMD -p "Classify this requirement as one word: bug / feature / refactor. Requirement: \$REQUIREMENT" --model haiku --max-turns 1 2>/dev/null | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
case "\$TYPE" in bug|fix) TYPE="bug";; feature|feat) TYPE="feature";; refactor) TYPE="refactor";; *) TYPE="feature";; esac
echo "  Type: \$TYPE"

# Stage 0-B: Reproduce (bug only)
if [[ "\$TYPE" == "bug" ]]; then
    echo ""; echo "=== Stage 0-B: Reproduce ==="
    run_danya "reproduce" "Reproduce this bug without fixing it. Output reproduction report: \$REQUIREMENT"
    if grep -qi "not reproduced\\|unable to reproduce" "\$LOG_DIR/reproduce.log" 2>/dev/null; then
        echo "  [END] Bug not reproduced. Pipeline terminated."; exit 0
    fi
fi

# Stage 1: Plan
echo ""; echo "=== Stage 1: Plan ==="
run_danya "plan" "Requirement: \$REQUIREMENT (type: \$TYPE). List all files to modify with 1-line intent each. Do NOT write code."

# Stage 2: Code + Verify loop
echo ""; echo "=== Stage 2: Code ==="
for ((fix_round=1; fix_round<=MAX_FIX_ROUNDS; fix_round++)); do
    echo "--- Code round \$fix_round/\$MAX_FIX_ROUNDS ---"
    run_danya "coding-\$fix_round" "Requirement: \$REQUIREMENT. Execute the plan. Compile-check after each file. Follow .danya/rules/."
    if check_build && check_test; then echo "  [PASS]"; break
    else
        echo "  [FAIL]"
        [[ \$fix_round -ge \$MAX_FIX_ROUNDS ]] && { echo "  [END] \$MAX_FIX_ROUNDS rounds failed."; exit 1; }
    fi
done

# Stage 3: Review loop
echo ""; echo "=== Stage 3: Review ==="
best_score=0
for ((rr=1; rr<=MAX_REVIEW_ROUNDS; rr++)); do
    echo "--- Review round \$rr/\$MAX_REVIEW_ROUNDS ---"
    run_danya "review-\$rr" "Run /review. Output score as: REVIEW_SCORE: <number>"
    score=\$(grep -oP 'REVIEW_SCORE:\\s*\\K[0-9]+' "\$LOG_DIR/review-\$rr.log" 2>/dev/null || echo "0")
    echo "  Score: \$score (baseline: \$best_score)"
    [[ "\$score" -lt "\$best_score" ]] && { echo "  [ROLLBACK] Score dropped"; git checkout . 2>/dev/null; continue; }
    best_score=\$score
    [[ "\$score" -ge 80 ]] && { echo "  [PASS] \$score/100"; break; }
    [[ \$rr -ge \$MAX_REVIEW_ROUNDS ]] && { echo "  [END] Score < 80 after \$MAX_REVIEW_ROUNDS rounds."; exit 1; }
    run_danya "fix-review-\$rr" "Review failed (\$score/100). Fix all CRITICAL and HIGH issues."
done

# Stage 4: Commit
echo ""; echo "=== Stage 4: Commit ==="
run_danya "commit" "Generate commit message and commit. Format: <type>(scope) description" || true

# Stage 5: Knowledge Deposit
echo ""; echo "=== Stage 5: Knowledge Deposit ==="
run_danya "docs" "Document this work in Docs/ (feature→Version/, bug→Bugs/). Only write docs, no code changes." || true

# Stage 6: Harness Evolution
echo ""; echo "=== Stage 6: Harness Evolution ==="
run_danya "harness" "Check if any compile/lint/review errors were fixed. If so, update .danya/rules/ via /fix-harness. If none, output 'No harness update needed'." || true

echo ""
echo "========================================="
echo "  Auto-Work Complete"
echo "  Score: \$best_score/100 | Type: \$TYPE"
echo "  Logs: \$LOG_DIR"
echo "========================================="
`

// ── Parallel Wave Execution ─────────────────────

export const SCRIPT_PARALLEL_WAVE = `#!/bin/bash
# parallel-wave.sh — Wave-based parallel execution with independent worktrees.
# Each task runs in its own worktree with its own danya -p instance.
set -euo pipefail

TASKS_DIR="\${1:?Usage: parallel-wave.sh <tasks-dir>}"
PROJECT_ROOT="\$(cd "\$(dirname "\$0")/../.." && pwd)"
WORKTREE_BASE="\$PROJECT_ROOT/.worktrees"
RESULTS_FILE="\$TASKS_DIR/results.tsv"
LOG_DIR="\$TASKS_DIR/logs"
DANYA_CMD="\${DANYA_CMD:-danya}"
MODEL="\${MODEL:-sonnet}"
mkdir -p "\$WORKTREE_BASE" "\$LOG_DIR"
echo -e "task\\twave\\tstatus\\tduration\\tnotes" > "\$RESULTS_FILE"

# Parse tasks
declare -A TASK_DEPS TASK_FILES TASK_STATUS
echo "=== Parsing tasks ==="
for f in "\$TASKS_DIR"/task-*.md; do
    [[ -f "\$f" ]] || continue
    basename=\$(basename "\$f" .md); task_id="\${basename#task-}"
    deps=\$(sed -n '/^---$/,/^---$/p' "\$f" | grep "^depends:" | sed 's/depends: *\\[//;s/\\]//;s/,/ /g;s/"//g;s/ //g' || echo "")
    TASK_DEPS[\$task_id]="\$deps"; TASK_FILES[\$task_id]="\$f"; TASK_STATUS[\$task_id]="pending"
    echo "  task-\$task_id: depends=[\${deps:-none}]"
done
[[ \${#TASK_FILES[@]} -eq 0 ]] && { echo "No tasks found"; exit 0; }

# Compute waves (topological sort)
declare -a WAVES=()
compute_waves() {
    local -A remaining_deps status; local all_ids=("\${!TASK_FILES[@]}")
    for id in "\${all_ids[@]}"; do remaining_deps[\$id]="\${TASK_DEPS[\$id]}"; status[\$id]="waiting"; done
    local wave_num=0 total_done=0 total=\${#all_ids[@]}
    while [[ \$total_done -lt \$total ]]; do
        local wave_tasks=(); wave_num=\$((wave_num + 1))
        for id in "\${all_ids[@]}"; do
            [[ "\${status[\$id]}" != "waiting" ]] && continue
            local deps="\${remaining_deps[\$id]}" all_met=true
            if [[ -n "\$deps" ]]; then
                for dep in \$deps; do [[ "\${status[\$dep]:-waiting}" != "done" ]] && all_met=false && break; done
            fi
            \$all_met && wave_tasks+=("\$id")
        done
        [[ \${#wave_tasks[@]} -eq 0 ]] && { echo "[ERROR] Circular dependency!"; exit 1; }
        for id in "\${wave_tasks[@]}"; do status[\$id]="done"; total_done=\$((total_done + 1)); done
        WAVES+=("\$(IFS=' '; echo "\${wave_tasks[*]}")"); echo "  Wave \$wave_num: \${wave_tasks[*]}"
    done
}
echo ""; echo "=== Computing waves ==="; compute_waves
echo "Total: \${#WAVES[@]} wave(s), \${#TASK_FILES[@]} task(s)"

# Execute task in worktree
execute_task() {
    local task_id="\$1" wave_num="\$2" task_file="\${TASK_FILES[\$task_id]}"
    local wt_path="\$WORKTREE_BASE/task-\${task_id}" branch="wt/task-\${task_id}"
    local log_file="\$LOG_DIR/task-\${task_id}.log" start_time=\$(date +%s)
    echo "  [task-\$task_id] Starting..."
    git worktree add -b "\$branch" "\$wt_path" HEAD >> "\$log_file" 2>&1 || {
        echo -e "\$task_id\\t\$wave_num\\tfailed\\t0\\tworktree failed" >> "\$RESULTS_FILE"; return 1; }
    local task_content=\$(sed '1,/^---$/d; /^---$/,\$!d; 1d' "\$task_file")
    ( cd "\$wt_path" && \$DANYA_CMD -p "\$task_content" --allowedTools "Edit,Write,Read,Bash,Grep,Glob" --max-turns 30 >> "\$log_file" 2>&1 ) || true
    local build_ok=false; (cd "\$wt_path" && make build >> "\$log_file" 2>&1) && build_ok=true
    local duration=\$(( \$(date +%s) - start_time ))
    if \$build_ok; then
        # Serialize merges with lock to prevent concurrent git index corruption
        local lockfile="\$WORKTREE_BASE/.merge-lock"
        while ! mkdir "\$lockfile" 2>/dev/null; do sleep 0.5; done
        if git merge "\$branch" --no-edit >> "\$log_file" 2>&1; then
            echo "  [task-\$task_id] PASS (\${duration}s)"; echo -e "\$task_id\\t\$wave_num\\tpassed\\t\$duration\\tmerged" >> "\$RESULTS_FILE"
        else
            git merge --abort 2>/dev/null || true
            echo "  [task-\$task_id] FAIL (merge conflict)"; echo -e "\$task_id\\t\$wave_num\\tfailed\\t\$duration\\tmerge conflict" >> "\$RESULTS_FILE"
        fi
        rmdir "\$lockfile" 2>/dev/null || true
    else
        echo "  [task-\$task_id] FAIL (build)"; echo -e "\$task_id\\t\$wave_num\\tfailed\\t\$duration\\tbuild failed" >> "\$RESULTS_FILE"
    fi
    git worktree remove "\$wt_path" --force 2>/dev/null || true; git branch -D "\$branch" 2>/dev/null || true
}

# Execute waves
echo ""; echo "=== Executing waves ==="
wave_num=0
for wave in "\${WAVES[@]}"; do
    wave_num=\$((wave_num + 1)); IFS=' ' read -ra tasks <<< "\$wave"
    echo ""; echo "--- Wave \$wave_num: \${tasks[*]} ---"
    for task_id in "\${tasks[@]}"; do
        for dep in \${TASK_DEPS[\$task_id]}; do
            [[ "\${TASK_STATUS[\$dep]}" == "failed" ]] && {
                echo "  [task-\$task_id] SKIP (dep failed)"
                echo -e "\$task_id\\t\$wave_num\\tskipped\\t0\\tdep failed" >> "\$RESULTS_FILE"
                TASK_STATUS[\$task_id]="failed"; }
        done
    done
    pids=()
    for task_id in "\${tasks[@]}"; do
        [[ "\${TASK_STATUS[\$task_id]}" == "failed" ]] && continue
        execute_task "\$task_id" "\$wave_num" &; pids+=(\$!)
    done
    for pid in "\${pids[@]}"; do wait "\$pid" 2>/dev/null || true; done
done

echo ""; echo "=== Results ==="; cat "\$RESULTS_FILE"
passed=\$(grep -c "passed" "\$RESULTS_FILE" 2>/dev/null || echo "0")
failed=\$(grep -c "failed" "\$RESULTS_FILE" 2>/dev/null || echo "0")
echo "Summary: \$passed passed, \$failed failed"
rmdir "\$WORKTREE_BASE" 2>/dev/null || true
[[ "\$failed" -gt 0 ]] && exit 1; exit 0
`

// ── Red-Blue Adversarial Loop ───────────────────

export const SCRIPT_RED_BLUE = `#!/bin/bash
# red-blue-loop.sh — Adversarial: red team finds bugs, blue team fixes, loop until clean.
set -uo pipefail

SCOPE="\${1:-.}"
PROJECT_ROOT="\$(cd "\$(dirname "\$0")/../.." && pwd)"
DANYA_CMD="\${DANYA_CMD:-danya}"
MODEL="\${MODEL:-sonnet}"
MAX_ROUNDS="\${MAX_ROUNDS:-5}"
CACHE_DIR="\$PROJECT_ROOT/.danya/.cache/red-blue"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
LOG_DIR="\$CACHE_DIR/\$TIMESTAMP"
mkdir -p "\$LOG_DIR"

echo "========================================="
echo "  Red-Blue Adversarial Loop"
echo "  Scope: \$SCOPE | Max rounds: \$MAX_ROUNDS"
echo "========================================="

for ((round=1; round<=MAX_ROUNDS; round++)); do
    echo ""; echo "=== Round \$round/\$MAX_ROUNDS ==="

    # Red Team: find bugs
    echo "  [RED] Analyzing..."
    DIFF=\$(cd "\$PROJECT_ROOT" && git diff HEAD~1 2>/dev/null || echo "No diff available")
    \$DANYA_CMD -p "You are the RED TEAM. Read .danya/agents/red-team.md for your role.
Analyze the code in scope: \$SCOPE
Recent changes: \$DIFF
Find all bugs. Output format: BUG-N [SEVERITY]: description" \\
        --model "\$MODEL" --max-turns 15 \\
        --allowedTools "Read,Grep,Glob,Bash" \\
        > "\$LOG_DIR/red-\$round.log" 2>&1 || true

    # Count bugs
    bug_count=\$(grep -c "^BUG-" "\$LOG_DIR/red-\$round.log" 2>/dev/null || echo "0")
    echo "  [RED] Found \$bug_count bug(s)"

    [[ "\$bug_count" -eq 0 ]] && { echo "  [CLEAN] Zero bugs found. Stopping."; break; }

    # Blue Team: fix bugs
    echo "  [BLUE] Fixing..."
    \$DANYA_CMD -p "You are the BLUE TEAM. Read .danya/agents/blue-team.md for your role.
Fix bugs from the red team report:
\$(cat "\$LOG_DIR/red-\$round.log")
Priority: CRITICAL > HIGH > MEDIUM. Minimal fixes only." \\
        --model "\$MODEL" --max-turns 20 \\
        --allowedTools "Edit,Write,Read,Bash,Grep,Glob" \\
        > "\$LOG_DIR/blue-\$round.log" 2>&1 || true

    # Build check
    echo "  [CHECK] Building..."
    if (cd "\$PROJECT_ROOT" && make build > "\$LOG_DIR/build-\$round.log" 2>&1); then
        echo "  [PASS] Build OK. Committing fixes."
        (cd "\$PROJECT_ROOT" && git add -u && git commit -m "<fix>(red-blue) round \$round fixes" 2>/dev/null) || true
    else
        echo "  [FAIL] Build failed. Reverting."
        (cd "\$PROJECT_ROOT" && git checkout . 2>/dev/null) || true
        break
    fi
done

# Skill Extraction
echo ""; echo "=== Skill Extraction ==="
\$DANYA_CMD -p "You are the SKILL EXTRACTOR. Read .danya/agents/skill-extractor.md for your role.
Analyze logs in \$LOG_DIR/ (red-*.log, blue-*.log).
Extract patterns (2+ occurrences) to .danya/rules/ and .danya/memory/." \\
    --model "\$MODEL" --max-turns 10 \\
    --allowedTools "Read,Write,Grep,Glob" \\
    > "\$LOG_DIR/skill-extract.log" 2>&1 || true

echo ""; echo "=== Red-Blue Complete ==="; echo "Logs: \$LOG_DIR"
`

// ── Orchestrator (Auto-Research Iteration) ──────

export const SCRIPT_ORCHESTRATOR = `#!/bin/bash
# orchestrator.sh — Auto-research iteration: AI codes → verify → commit/revert × N rounds.
set -uo pipefail

TASK_FILE="\${1:?Usage: orchestrator.sh <task-file.md>}"
PROJECT_ROOT="\$(cd "\$(dirname "\$0")/../.." && pwd)"
DANYA_CMD="\${DANYA_CMD:-danya}"
MODEL="\${MODEL:-sonnet}"
MAX_ITERATIONS="\${MAX_ITERATIONS:-20}"
CIRCUIT_BREAK="\${CIRCUIT_BREAK:-5}"
CACHE_DIR="\$PROJECT_ROOT/.danya/.cache/orchestrator"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
LOG_DIR="\$CACHE_DIR/\$TIMESTAMP"
mkdir -p "\$LOG_DIR"

BASELINE_FILE="\$LOG_DIR/baseline.txt"
RESULTS_FILE="\$LOG_DIR/results.tsv"
echo "0" > "\$BASELINE_FILE"
echo -e "iter\\tscore\\tbaseline\\tstatus\\ttimestamp" > "\$RESULTS_FILE"

echo "========================================="
echo "  Danya Orchestrator (Auto-Research)"
echo "  Task: \$TASK_FILE"
echo "  Max iterations: \$MAX_ITERATIONS"
echo "  Circuit break: \$CIRCUIT_BREAK consecutive failures"
echo "========================================="

TASK_CONTENT=\$(cat "\$TASK_FILE")
consecutive_failures=0

for ((iter=1; iter<=MAX_ITERATIONS; iter++)); do
    echo ""; echo "=== Iteration \$iter/\$MAX_ITERATIONS ==="
    baseline=\$(cat "\$BASELINE_FILE")

    # Code
    \$DANYA_CMD -p "You are a code-writer. Read .danya/agents/code-writer.md for your role.
Task: \$TASK_CONTENT
Iteration \$iter. Current baseline: \$baseline/100. Improve the score." \\
        --model "\$MODEL" --max-turns 20 \\
        --allowedTools "Edit,Write,Read,Bash,Grep,Glob" \\
        > "\$LOG_DIR/iter-\$iter.log" 2>&1 || true

    # Verify (score 0-100)
    score=0
    if [ -f "\$PROJECT_ROOT/.danya/scripts/verify-server.sh" ]; then
        score=\$(bash "\$PROJECT_ROOT/.danya/scripts/verify-server.sh" 2>/dev/null || echo "0")
    elif [ -f Makefile ]; then
        (cd "\$PROJECT_ROOT" && make build > /dev/null 2>&1) && score=40
        (cd "\$PROJECT_ROOT" && make lint > /dev/null 2>&1) && score=\$((score + 20))
        (cd "\$PROJECT_ROOT" && make test > /dev/null 2>&1) && score=\$((score + 40))
    fi

    echo "  Score: \$score (baseline: \$baseline)"

    if [[ "\$score" -ge "\$baseline" ]]; then
        echo "  [COMMIT] Score >= baseline"
        (cd "\$PROJECT_ROOT" && git add -u && git commit -m "<feat>(orchestrator) iter \$iter score \$score" 2>/dev/null) || true
        echo "\$score" > "\$BASELINE_FILE"
        consecutive_failures=0
        echo -e "\$iter\\t\$score\\t\$score\\tpass\\t\$(date +%H:%M:%S)" >> "\$RESULTS_FILE"
    else
        echo "  [REVERT] Score < baseline"
        (cd "\$PROJECT_ROOT" && git checkout . 2>/dev/null) || true
        consecutive_failures=\$((consecutive_failures + 1))
        echo -e "\$iter\\t\$score\\t\$baseline\\tfail\\t\$(date +%H:%M:%S)" >> "\$RESULTS_FILE"
    fi

    if [[ \$consecutive_failures -ge \$CIRCUIT_BREAK ]]; then
        echo "  [CIRCUIT BREAK] \$CIRCUIT_BREAK consecutive failures. Stopping."
        break
    fi
done

echo ""; echo "========================================="
echo "  Orchestrator Complete"
echo "  Final baseline: \$(cat "\$BASELINE_FILE")/100"
echo "  Results: \$RESULTS_FILE"
echo "========================================="
cat "\$RESULTS_FILE"
`

// ── Verify Scripts ──────────────────────────────

export const SCRIPT_VERIFY_SERVER = `#!/bin/bash
# verify-server.sh — Quantitative server verification (0-100 points).
# build=40, lint=20, test=40
set -uo pipefail
PROJECT_ROOT="\${1:-\$(pwd)}"
score=0
(cd "\$PROJECT_ROOT" && make build > /dev/null 2>&1) && score=40 || { echo "\$score"; exit 0; }
(cd "\$PROJECT_ROOT" && make lint > /dev/null 2>&1) && score=\$((score + 20))
if (cd "\$PROJECT_ROOT" && make test > /dev/null 2>&1); then score=\$((score + 40))
else score=\$((score + 10)); fi  # partial credit
echo "\$score"
`

export const SCRIPT_VERIFY_CLIENT = `#!/bin/bash
# verify-client.sh — Quantitative client verification using CSharp syntax check.
set -uo pipefail
PROJECT_ROOT="\${1:-\$(pwd)}"
CHECKER="\$PROJECT_ROOT/.danya/tools/CSharpSyntaxChecker"
MODIFIED_CS=\$(cd "\$PROJECT_ROOT" && git diff --name-only HEAD 2>/dev/null | grep '\\.cs$' || echo "")
[[ -z "\$MODIFIED_CS" ]] && { echo "100"; exit 0; }
total=\$(echo "\$MODIFIED_CS" | wc -l)
errors=0
if [[ -x "\$CHECKER" ]]; then
    for f in \$MODIFIED_CS; do
        "\$CHECKER" "\$PROJECT_ROOT/\$f" > /dev/null 2>&1 || errors=\$((errors + 1))
    done
else
    echo "80"; exit 0  # fallback if checker not available
fi
pass_rate=\$(( (total - errors) * 100 / total ))
echo "\$pass_rate"
`

export const SCRIPT_CHECK_ENV = `#!/bin/bash
# check-env.sh — Validate environment dependencies for Danya tools.
set -uo pipefail
ok=true
check() { command -v "\$1" > /dev/null 2>&1 && echo "  [OK] \$1" || { echo "  [MISSING] \$1 — \$2"; ok=false; }; }
echo "=== Danya Environment Check ==="
check danya "Install: npm install -g @danya-ai/cli"
check git "Install: https://git-scm.com"
check make "Install: build-essential (Linux) or MinGW (Windows)"
check python3 "Install: https://python.org"
command -v go > /dev/null 2>&1 && echo "  [OK] go" || echo "  [SKIP] go (only needed for Go server projects)"
command -v dotnet > /dev/null 2>&1 && echo "  [OK] dotnet" || echo "  [SKIP] dotnet (only needed for C# syntax checking)"
echo ""
\$ok && echo "All required dependencies found." || echo "Some dependencies missing. Install them before using shell-enforced scripts."
`
