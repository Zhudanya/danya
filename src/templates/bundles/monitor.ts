/**
 * Data collection hooks for Danya monitor.
 * Python scripts registered as PostToolUse/Stop hooks.
 */

export const MONITOR_LOG_TOOL_USE = `#!/usr/bin/env python3
"""PostToolUse Hook — record every tool call to JSONL."""
import json, sys, time
from pathlib import Path
DATA_DIR = Path(".danya/monitor/data"); DATA_DIR.mkdir(parents=True, exist_ok=True)
try:
    data = json.load(sys.stdin)
    entry = {"timestamp": time.time(), "session_id": data.get("session_id",""), "tool_name": data.get("tool_name",""), "tool_input_keys": list(data.get("tool_input",{}).keys()), "cwd": data.get("cwd","")}
    with open(DATA_DIR / "tool-usage.jsonl", "a") as f: f.write(json.dumps(entry) + "\\n")
except (json.JSONDecodeError, IOError, KeyError): pass
`

export const MONITOR_LOG_SESSION_END = `#!/usr/bin/env python3
"""Stop Hook — record session end to JSONL."""
import json, sys, time
from pathlib import Path
DATA_DIR = Path(".danya/monitor/data"); DATA_DIR.mkdir(parents=True, exist_ok=True)
try:
    data = json.load(sys.stdin)
    entry = {"timestamp": time.time(), "session_id": data.get("session_id",""), "cwd": data.get("cwd",""), "stop_reason": data.get("stop_hook_reason","unknown")}
    with open(DATA_DIR / "sessions.jsonl", "a") as f: f.write(json.dumps(entry) + "\\n")
except (json.JSONDecodeError, IOError, KeyError): pass
`

export const MONITOR_LOG_VERIFY = `#!/usr/bin/env python3
"""Verify metrics — call with: python log-verify.py start|end <type> [result]"""
import json, sys, time
from pathlib import Path
DATA_DIR = Path(".danya/monitor/data"); DATA_DIR.mkdir(parents=True, exist_ok=True)
STATE = DATA_DIR / ".verify-state.json"
def start(t): STATE.write_text(json.dumps({"type":t,"start_time":time.time()}))
def end(t,r):
    if not STATE.exists(): return
    s = json.loads(STATE.read_text()); d = time.time() - s.get("start_time", time.time())
    with open(DATA_DIR / "verify-metrics.jsonl", "a") as f:
        f.write(json.dumps({"timestamp":time.time(),"type":t,"result":r,"duration_seconds":round(d,1)}) + "\\n")
    STATE.unlink(missing_ok=True)
if len(sys.argv) >= 3:
    if sys.argv[1] == "start": start(sys.argv[2])
    elif sys.argv[1] == "end": end(sys.argv[2], sys.argv[3] if len(sys.argv)>3 else "UNKNOWN")
`

export const MONITOR_LOG_BUGFIX = `#!/usr/bin/env python3
"""Bugfix metrics — call with: python log-bugfix.py start|round|end <args>"""
import json, sys, time
from pathlib import Path
DATA_DIR = Path(".danya/monitor/data"); DATA_DIR.mkdir(parents=True, exist_ok=True)
STATE = DATA_DIR / ".bugfix-state.json"
def start(desc): STATE.write_text(json.dumps({"description":desc,"start_time":time.time(),"rounds":[]}))
def round_log(n,r):
    if not STATE.exists(): return
    s = json.loads(STATE.read_text()); s["rounds"].append({"round":int(n),"result":r,"timestamp":time.time()})
    STATE.write_text(json.dumps(s))
def end(n,r):
    if not STATE.exists(): return
    s = json.loads(STATE.read_text()); d = time.time() - s.get("start_time", time.time())
    with open(DATA_DIR / "bugfix-metrics.jsonl", "a") as f:
        f.write(json.dumps({"timestamp":time.time(),"description":s.get("description",""),"total_rounds":int(n),"final_result":r,"duration_seconds":round(d,1),"rounds":s.get("rounds",[])}) + "\\n")
    STATE.unlink(missing_ok=True)
if len(sys.argv) >= 3:
    a = sys.argv[1]
    if a == "start": start(sys.argv[2])
    elif a == "round": round_log(sys.argv[2], sys.argv[3] if len(sys.argv)>3 else "UNKNOWN")
    elif a == "end": end(sys.argv[2], sys.argv[3] if len(sys.argv)>3 else "UNKNOWN")
`

export const MONITOR_LOG_REVIEW = `#!/usr/bin/env python3
"""Review metrics — call with: python log-review.py <score> <result> [critical] [high] [medium]"""
import json, sys, time
from pathlib import Path
DATA_DIR = Path(".danya/monitor/data"); DATA_DIR.mkdir(parents=True, exist_ok=True)
if len(sys.argv) >= 3:
    entry = {"timestamp":time.time(),"score":int(sys.argv[1]),"result":sys.argv[2],"critical":int(sys.argv[3]) if len(sys.argv)>3 else 0,"high":int(sys.argv[4]) if len(sys.argv)>4 else 0,"medium":int(sys.argv[5]) if len(sys.argv)>5 else 0}
    with open(DATA_DIR / "review-metrics.jsonl", "a") as f: f.write(json.dumps(entry) + "\\n")
`

export const MONITOR_ANALYZE = `#!/usr/bin/env python3
"""Danya Harness data analysis — 8 metrics from JSONL logs."""
import json, sys, time, argparse, io, os
from pathlib import Path
from collections import Counter
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DATA_DIR = Path(".danya/monitor/data")
TOOL_LOG = DATA_DIR / "tool-usage.jsonl"
SESSION_LOG = DATA_DIR / "sessions.jsonl"
VERIFY_LOG = DATA_DIR / "verify-metrics.jsonl"
BUGFIX_LOG = DATA_DIR / "bugfix-metrics.jsonl"
REVIEW_LOG = DATA_DIR / "review-metrics.jsonl"

def load_jsonl(path, days=None):
    if not path.exists(): return []
    cutoff = time.time() - (days * 86400) if days else 0
    entries = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try:
                e = json.loads(line)
                if e.get('timestamp', 0) >= cutoff: entries.append(e)
            except: pass
    return entries

def _calc_period(log_file, days_start, days_end=0):
    if not log_file.exists(): return None
    now = time.time(); start = now - days_start*86400; end = now - days_end*86400
    entries = []
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try:
                e = json.loads(line)
                if start <= e.get('timestamp',0) <= end: entries.append(e)
            except: pass
    return entries

def _change(cur, prev, higher_good=True):
    if prev is None or prev == 0: return ""
    diff = cur - prev; pct = (diff/prev)*100
    if abs(pct) < 0.5: return " (->)"
    arrow = 'UP' if diff > 0 else 'DOWN'
    good = (diff > 0) == higher_good
    mark = 'OK' if good else '!!'
    return f" ({arrow} {abs(pct):.0f}% {mark})"

def metric_tool_usage(days=None):
    entries = load_jsonl(TOOL_LOG, days)
    if not entries: print("No tool data."); return
    counter = Counter(e.get('tool_name','?') for e in entries)
    print(f"Tool Usage (last {days or 'all'} days, {len(entries)} calls):\\n")
    for t, c in counter.most_common():
        bar = '#' * min(c, 50)
        print(f"  {t:25s} {c:5d}  {bar}")

def metric_top_tools(top=10, days=None):
    entries = load_jsonl(TOOL_LOG, days)
    if not entries: print("No tool data."); return
    counter = Counter(e.get('tool_name','?') for e in entries)
    print(f"Top {top} Tools (last {days or 'all'} days):\\n")
    for i, (t, c) in enumerate(counter.most_common(top), 1):
        print(f"  {i:2d}. {t:25s} {c}")

def metric_session_count(days=None):
    entries = load_jsonl(SESSION_LOG, days)
    if not entries: print("No session data."); return
    print(f"Sessions (last {days or 'all'} days): {len(entries)}\\n")
    by_day = Counter(datetime.fromtimestamp(e['timestamp']).strftime('%Y-%m-%d') for e in entries)
    print(f"  Daily avg: {len(entries)/max(len(by_day),1):.1f}\\n  Distribution:")
    for d in sorted(by_day): print(f"    {d}  {by_day[d]:3d}  {'#'*min(by_day[d],30)}")

def metric_verify_time(days=None):
    entries = load_jsonl(VERIFY_LOG, days)
    if not entries: print("No verify data."); return
    print(f"Verify Stats (last {days or 'all'} days, {len(entries)} runs):\\n")
    by_type = {}
    for e in entries:
        t = e.get('type','?')
        by_type.setdefault(t, []).append(e.get('duration_seconds',0))
    for t, ds in sorted(by_type.items()):
        pc = sum(1 for e in entries if e.get('type')==t and e.get('result')=='PASS')
        print(f"  {t}: {len(ds)} runs, pass {pc}/{len(ds)} ({pc/len(ds)*100:.0f}%), avg {sum(ds)/len(ds):.1f}s")

def metric_bugfix_rounds(days=None):
    entries = load_jsonl(BUGFIX_LOG, days)
    if not entries: print("No bugfix data."); return
    rounds = [e.get('total_rounds',0) for e in entries]
    pc = sum(1 for e in entries if e.get('final_result')=='PASS')
    print(f"Bugfix Stats (last {days or 'all'} days, {len(entries)} bugs):\\n")
    print(f"  Success: {pc}/{len(entries)} ({pc/len(entries)*100:.0f}%)")
    print(f"  Avg rounds: {sum(rounds)/len(rounds):.1f}, min: {min(rounds)}, max: {max(rounds)}")

def metric_review_scores(days=None):
    entries = load_jsonl(REVIEW_LOG, days)
    if not entries: print("No review data."); return
    scores = [e.get('score',0) for e in entries]
    pc = sum(1 for e in entries if e.get('result')=='PASS')
    print(f"Review Stats (last {days or 'all'} days, {len(entries)} reviews):\\n")
    print(f"  Pass: {pc}/{len(entries)} ({pc/len(entries)*100:.0f}%), avg: {sum(scores)/len(scores):.1f}, range: {min(scores)}-{max(scores)}")
    print(f"  Issues: CRIT={sum(e.get('critical',0) for e in entries)} HIGH={sum(e.get('high',0) for e in entries)} MED={sum(e.get('medium',0) for e in entries)}")

def metric_summary(days=None):
    p = f"last {days} days" if days else "all time"
    print(f"{'='*50}\\n  Harness Summary | {p}\\n{'='*50}")
    v = load_jsonl(VERIFY_LOG, days)
    if v:
        ds = [e.get('duration_seconds',0) for e in v]; vp = sum(1 for e in v if e.get('result')=='PASS')
        print(f"\\n  Verify: {len(v)} runs, pass {vp/len(v)*100:.0f}%, avg {sum(ds)/len(ds):.1f}s")
    b = load_jsonl(BUGFIX_LOG, days)
    if b:
        rs = [e.get('total_rounds',0) for e in b]; bp = sum(1 for e in b if e.get('final_result')=='PASS')
        print(f"  Bugfix: {len(b)} bugs, success {bp/len(b)*100:.0f}%, avg {sum(rs)/len(rs):.1f} rounds")
    r = load_jsonl(REVIEW_LOG, days)
    if r:
        ss = [e.get('score',0) for e in r]; rp = sum(1 for e in r if e.get('result')=='PASS')
        print(f"  Review: {len(r)} reviews, pass {rp/len(r)*100:.0f}%, avg score {sum(ss)/len(ss):.1f}")
    t = load_jsonl(TOOL_LOG, days); s = load_jsonl(SESSION_LOG, days)
    print(f"  Tools: {len(t)} calls, Sessions: {len(s)}")
    print(f"{'='*50}")

def metric_compare(days=7):
    print(f"{'='*60}\\n  Harness Compare | last {days}d vs prev {days}d\\n{'='*60}")
    for name, log, score_key, higher_good in [
        ("Verify", VERIFY_LOG, "duration_seconds", False),
        ("Bugfix", BUGFIX_LOG, "total_rounds", False),
        ("Review", REVIEW_LOG, "score", True),
    ]:
        c = _calc_period(log, days, 0); p = _calc_period(log, days*2, days)
        print(f"\\n  {name}:")
        if c:
            cv = sum(e.get(score_key,0) for e in c)/len(c)
            pv = sum(e.get(score_key,0) for e in p)/len(p) if p else None
            print(f"    Avg {score_key}: {cv:.1f}{_change(cv, pv, higher_good)}  ({len(c)} vs {len(p) if p else 0})")
        else: print("    No data")
    t = _calc_period(TOOL_LOG, days, 0); tp = _calc_period(TOOL_LOG, days*2, days)
    s = _calc_period(SESSION_LOG, days, 0); sp = _calc_period(SESSION_LOG, days*2, days)
    print(f"\\n  Activity:")
    print(f"    Tools: {len(t) if t else 0}{_change(len(t) if t else 0, len(tp) if tp else None)}")
    print(f"    Sessions: {len(s) if s else 0}{_change(len(s) if s else 0, len(sp) if sp else None)}")
    print(f"{'='*60}")

def main():
    ap = argparse.ArgumentParser(description='Danya Harness Analyzer')
    ap.add_argument('--metric', required=True, choices=['tool-usage','top-tools','session-count','verify-time','bugfix-rounds','review-scores','summary','compare'])
    ap.add_argument('--days', type=int, default=None)
    ap.add_argument('--top', type=int, default=10)
    a = ap.parse_args()
    {'tool-usage': lambda: metric_tool_usage(a.days), 'top-tools': lambda: metric_top_tools(a.top, a.days), 'session-count': lambda: metric_session_count(a.days), 'verify-time': lambda: metric_verify_time(a.days), 'bugfix-rounds': lambda: metric_bugfix_rounds(a.days), 'review-scores': lambda: metric_review_scores(a.days), 'summary': lambda: metric_summary(a.days), 'compare': lambda: metric_compare(a.days or 7)}[a.metric]()

if __name__ == '__main__': main()
`

export const MONITOR_DASHBOARD = `#!/usr/bin/env python3
"""Danya real-time monitoring dashboard."""
import json, os, sys, time, subprocess, io
from datetime import datetime
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    os.system('chcp 65001 > nul 2>&1')

DANYA_DIR = Path.home() / ".danya"
PROJECTS_DIR = DANYA_DIR / "projects" if (Path.home() / ".danya" / "projects").exists() else Path.home() / ".danya" / "projects"
TEMP_DIR = Path(os.environ.get('TEMP', '/tmp')) / "danya"

def get_processes():
    procs = []
    try:
        if sys.platform == 'win32':
            r = subprocess.run(['tasklist','/FI','IMAGENAME eq node.exe','/FO','CSV','/V'], capture_output=True, text=True, timeout=10)
            for line in r.stdout.strip().split('\\n')[1:]:
                if 'node' in line.lower():
                    parts = line.strip('"').split('","')
                    if len(parts) >= 2:
                        try: procs.append({'pid': int(parts[1].strip('"')), 'mem': parts[4] if len(parts)>4 else '?'})
                        except: pass
        else:
            r = subprocess.run(['ps','aux'], capture_output=True, text=True, timeout=10)
            for line in r.stdout.split('\\n'):
                if 'danya' in line.lower() or ('claude' in line.lower() and 'node' in line.lower()):
                    parts = line.split()
                    if len(parts) >= 2:
                        procs.append({'pid': int(parts[1]), 'mem': parts[3]+'%' if len(parts)>3 else '?'})
    except: pass
    return procs

def scan_conversations():
    convs = []
    if not PROJECTS_DIR.exists(): return convs
    for pd in sorted(PROJECTS_DIR.iterdir()):
        if not pd.is_dir(): continue
        for cf in sorted(pd.glob("*.jsonl")):
            age = time.time() - cf.stat().st_mtime
            if age > 3600: continue
            convs.append({'project': pd.name, 'age': age, 'size_kb': cf.stat().st_size/1024})
    return convs

def scan_tasks():
    tasks = []
    if not TEMP_DIR.exists(): return tasks
    for pd in sorted(TEMP_DIR.iterdir()):
        if not pd.is_dir(): continue
        for sd in sorted(pd.iterdir()):
            if not sd.is_dir(): continue
            td = sd / "tasks"
            if not td.exists(): continue
            outs = list(td.glob("*.output"))
            if not outs: continue
            latest = max(f.stat().st_mtime for f in outs)
            if time.time() - latest > 3600: continue
            tasks.append({'project': pd.name, 'count': len(outs), 'age': time.time()-latest})
    return tasks

def fmt_age(s):
    if s < 60: return f"{int(s)}s"
    if s < 3600: return f"{int(s/60)}m"
    return f"{int(s/3600)}h{int((s%3600)/60)}m"

def display(verbose=False):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"\\n{'='*60}\\n  Danya Monitor | {now}\\n{'='*60}")
    procs = get_processes()
    print(f"\\n  Processes: {len(procs)} instance(s)")
    if verbose:
        for p in procs[:10]: print(f"    PID {p['pid']}  mem={p['mem']}")
    convs = scan_conversations()
    print(f"\\n  Active Conversations (1h): {len(convs)}")
    for c in sorted(convs, key=lambda x: x['age'])[:10]:
        print(f"    [{fmt_age(c['age'])} ago] {c['project'][:30]}  {c['size_kb']:.0f}KB")
    tasks = scan_tasks()
    print(f"\\n  Background Tasks (1h): {len(tasks)}")
    for t in sorted(tasks, key=lambda x: x['age'])[:10]:
        print(f"    [{fmt_age(t['age'])} ago] {t['project'][:30]}  tasks={t['count']}")
    print(f"\\n{'='*60}")

def main():
    watch = False; interval = 5; verbose = False
    args = sys.argv[1:]; i = 0
    while i < len(args):
        if args[i] in ('-w','--watch'):
            watch = True
            if i+1 < len(args) and args[i+1].isdigit(): interval = int(args[i+1]); i += 1
        elif args[i] in ('-v','--verbose'): verbose = True
        i += 1
    if watch:
        try:
            while True:
                os.system('cls' if sys.platform=='win32' else 'clear')
                display(verbose); print(f"\\n  Refresh: {interval}s | Ctrl+C to stop")
                time.sleep(interval)
        except KeyboardInterrupt: print("\\nStopped.")
    else: display(verbose)

if __name__ == '__main__': main()
`

export const SCRIPT_MONTHLY_REPORT = `#!/bin/bash
# monthly-report.sh — Aggregate auto-research results.
set -uo pipefail
CACHE_DIR="\${1:-.danya/.cache/orchestrator}"
echo "========================================="
echo "  Orchestrator Monthly Report"
echo "  \$(date +%Y-%m)"
echo "========================================="
[[ ! -d "\$CACHE_DIR" ]] && { echo "No data. Run orchestrator first."; exit 0; }
total_sessions=0; total_iters=0; total_pass=0; total_fail=0; max_base=0
for dir in "\$CACHE_DIR"/*/; do
    rf="\$dir/results.tsv"; [[ -f "\$rf" ]] || continue
    total_sessions=\$((total_sessions + 1))
    while IFS=\$'\\t' read -r iter score baseline status ts; do
        [[ "\$iter" == "iter" ]] && continue
        total_iters=\$((total_iters + 1))
        [[ "\$status" == "pass" ]] && total_pass=\$((total_pass + 1))
        [[ "\$status" == "fail" ]] && total_fail=\$((total_fail + 1))
        [[ "\$baseline" -gt "\$max_base" ]] 2>/dev/null && max_base=\$baseline
    done < "\$rf"
done
echo ""
echo "  Sessions: \$total_sessions"
echo "  Iterations: \$total_iters"
echo "  Commits: \$total_pass"
echo "  Reverts: \$total_fail"
[[ \$total_iters -gt 0 ]] && echo "  Success rate: \$((total_pass * 100 / total_iters))%"
echo "  Max baseline: \$max_base/100"
echo "========================================="
`
