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
except: pass
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
except: pass
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
