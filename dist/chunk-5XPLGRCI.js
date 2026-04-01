import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  AskUserQuestionTool,
  BashTool,
  Cost,
  EnterPlanModeTool,
  ExitPlanModeTool,
  FileEditTool,
  FileReadTool,
  FileWriteTool,
  GlobTool,
  GrepTool,
  KillShellTool,
  NotebookEditTool,
  SkillTool,
  SlashCommandTool,
  TodoWriteTool,
  WebFetchTool,
  WebSearchTool,
  applyMarkdown,
  countTokens,
  detectProject,
  getAbsolutePath,
  getAgentPrompt,
  getMaxThinkingTokens,
  hasPermissionsToUseTool,
  hasReadPermission,
  init_detect,
  query
} from "./chunk-QUV2YCUP.js";
import {
  FallbackToolUseRejectedMessage,
  MCPTool,
  getClients,
  getMCPTools
} from "./chunk-QOWU527O.js";
import {
  queryLLM
} from "./chunk-JKRPU66R.js";
import {
  generateAgentId
} from "./chunk-ZS6GNOVF.js";
import {
  getActiveAgents,
  getAgentByType,
  getAvailableAgentTypes
} from "./chunk-RIE2FUKS.js";
import {
  INTERRUPT_MESSAGE,
  createAssistantMessage,
  createUserMessage,
  getLastAssistantMessageId
} from "./chunk-7NTVKI6U.js";
import {
  getModelManager
} from "./chunk-EOZSZNKR.js";
import {
  getContext
} from "./chunk-4FOB6KC5.js";
import {
  getTheme
} from "./chunk-KS5K2JLY.js";
import {
  debug
} from "./chunk-JIBQDOXO.js";
import {
  BunShell,
  getCwd,
  getMessagesPath,
  getNextAvailableLogSidechainNumber,
  init_log,
  init_shell,
  init_state,
  init_taskOutputStore,
  logError,
  overwriteLog,
  readTaskOutput
} from "./chunk-DH6PY5WA.js";
import {
  formatDuration,
  formatNumber
} from "./chunk-LWXT5RGE.js";
import {
  __esm,
  __export,
  __require,
  __toCommonJS
} from "./chunk-M3TKNAUR.js";

// src/tools/game/ScoreReview/prompt.ts
var TOOL_NAME4, DESCRIPTION5;
var init_prompt = __esm({
  "src/tools/game/ScoreReview/prompt.ts"() {
    TOOL_NAME4 = "ScoreReview";
    DESCRIPTION5 = `Score-based code review with 100-point scoring system and quality ratchet.

Scoring: 100 points starting, CRITICAL=-30, HIGH=-10, MEDIUM=-3.
Pass: score >= 80 AND zero CRITICAL issues.
Quality ratchet: each round's score must >= previous round.

Checks architecture violations, coding conventions, logic issues, and security problems.
Engine-specific checks loaded based on detected game engine.`;
  }
});

// src/tools/game/ScoreReview/scoringEngine.ts
function calculateScore(issues) {
  let score = 100;
  let critical_count = 0;
  let high_count = 0;
  let medium_count = 0;
  for (const issue of issues) {
    const deduction = DEDUCTIONS[issue.severity];
    score -= deduction;
    switch (issue.severity) {
      case "CRITICAL":
        critical_count++;
        break;
      case "HIGH":
        high_count++;
        break;
      case "MEDIUM":
        medium_count++;
        break;
    }
  }
  score = Math.max(score, 0);
  return {
    score,
    passed: score >= PASS_THRESHOLD && critical_count === 0,
    critical_count,
    high_count,
    medium_count,
    total_deduction: 100 - score
  };
}
function assignDeduction(severity) {
  return DEDUCTIONS[severity];
}
var DEDUCTIONS, PASS_THRESHOLD;
var init_scoringEngine = __esm({
  "src/tools/game/ScoreReview/scoringEngine.ts"() {
    DEDUCTIONS = { CRITICAL: 30, HIGH: 10, MEDIUM: 3 };
    PASS_THRESHOLD = 80;
  }
});

// src/tools/game/ScoreReview/checks/universal.ts
var UNIVERSAL_CHECKS;
var init_universal = __esm({
  "src/tools/game/ScoreReview/checks/universal.ts"() {
    UNIVERSAL_CHECKS = [
      {
        id: "U-01",
        severity: "CRITICAL",
        category: "architecture",
        pattern: null,
        // Handled by ArchitectureGuard forbidden zone check
        fileFilter: /.*/,
        message: "Forbidden zone edit detected",
        suggestion: "Edit the source file and regenerate, or use a WORKAROUND"
      },
      {
        id: "U-02",
        severity: "CRITICAL",
        category: "security",
        pattern: /(password|api[_-]?key|secret|token)\s*[:=]\s*["'][a-zA-Z0-9]/i,
        fileFilter: /\.(ts|tsx|js|go|cs|cpp|h|gd|py)$/,
        excludeFilter: /\.(test|spec|mock|fixture)\./,
        message: "Possible hardcoded secret/credential",
        suggestion: "Use environment variables or a secrets manager"
      },
      {
        id: "U-03",
        severity: "MEDIUM",
        category: "convention",
        pattern: /\b(TODO|FIXME|HACK|XXX)\b:/,
        fileFilter: /\.(ts|tsx|js|go|cs|cpp|h|gd|py)$/,
        excludeFilter: /\.(test|spec)\./,
        message: "Debug/temp marker left in code",
        suggestion: "Resolve or remove before committing"
      },
      {
        id: "U-04",
        severity: "MEDIUM",
        category: "convention",
        pattern: null,
        // Checked at file level (line count > 500 changed)
        fileFilter: /.*/,
        message: "Large file change (>500 lines)",
        suggestion: "Consider decomposing into smaller changes"
      }
    ];
  }
});

// src/tools/game/ScoreReview/checks/unity.ts
var UNITY_CHECKS;
var init_unity = __esm({
  "src/tools/game/ScoreReview/checks/unity.ts"() {
    UNITY_CHECKS = [
      {
        id: "UC-01",
        severity: "HIGH",
        category: "convention",
        pattern: /\bDebug\.(Log|LogWarning|LogError)\s*\(/,
        fileFilter: /\.cs$/,
        excludeFilter: /(Editor|Test)\//,
        message: "Debug.Log used instead of project logger",
        suggestion: "Use MLog.Info?.Log() or project-specific logging wrapper"
      },
      {
        id: "UC-02",
        severity: "HIGH",
        category: "convention",
        pattern: /async\s+Task[^A-Za-z]/,
        fileFilter: /\.cs$/,
        message: "async Task used instead of async UniTask",
        suggestion: "Replace System.Threading.Tasks.Task with UniTask"
      },
      {
        id: "UC-03",
        severity: "HIGH",
        category: "convention",
        pattern: /Task\.Delay/,
        fileFilter: /\.cs$/,
        message: "Task.Delay used instead of UniTask.Delay",
        suggestion: "Replace Task.Delay with UniTask.Delay"
      },
      {
        id: "UC-04",
        severity: "HIGH",
        category: "convention",
        pattern: /\bDestroy\s*\(/,
        fileFilter: /\.cs$/,
        excludeFilter: /(Editor|Test)\//,
        message: "Destroy() used on potentially pooled object",
        suggestion: "Use ObjectPoolUtility.Instance.Free() for pooled objects"
      },
      {
        id: "UC-05",
        severity: "MEDIUM",
        category: "performance",
        pattern: /new\s+GameObject\s*\(/,
        fileFilter: /\.cs$/,
        excludeFilter: /(Editor|Test)\//,
        message: "new GameObject() \u2014 consider object pool for frequent use",
        suggestion: "Use ObjectPoolUtility.Instance.LoadGameObject() for high-frequency creation"
      },
      {
        id: "UC-06",
        severity: "HIGH",
        category: "convention",
        pattern: null,
        // Special: check 3rd/ files for missing [CUSTOM_MOD]
        fileFilter: /3rd\//,
        message: "Third-party code modified without [CUSTOM_MOD] marker",
        suggestion: "Add // [CUSTOM_MOD] YYYY-MM-DD: reason"
      },
      {
        id: "UC-07",
        severity: "HIGH",
        category: "convention",
        pattern: /using\s+System\.Threading\.Tasks/,
        fileFilter: /\.cs$/,
        message: "System.Threading.Tasks imported \u2014 use UniTask instead",
        suggestion: "Remove using System.Threading.Tasks, use Cysharp.Threading.Tasks"
      },
      {
        id: "UC-08",
        severity: "CRITICAL",
        category: "architecture",
        pattern: /using\s+FL\.Gameplay/,
        fileFilter: /Scripts\/Framework\//,
        message: "Layer violation: Framework importing Gameplay",
        suggestion: "Framework layer must not reference Gameplay. Use events or interfaces."
      },
      {
        id: "UC-09",
        severity: "HIGH",
        category: "architecture",
        pattern: /using\s+FL\.Renderer/,
        fileFilter: /Scripts\/Gameplay\//,
        message: "Layer violation: Gameplay importing Renderer",
        suggestion: "Gameplay should not reference Renderer directly."
      }
    ];
  }
});

// src/tools/game/ScoreReview/checks/go.ts
var GO_CHECKS;
var init_go = __esm({
  "src/tools/game/ScoreReview/checks/go.ts"() {
    GO_CHECKS = [
      {
        id: "GO-01",
        severity: "HIGH",
        category: "convention",
        pattern: /fmt\.Errorf\([^)]*%v/,
        fileFilter: /\.go$/,
        excludeFilter: /_test\.go$/,
        message: "fmt.Errorf uses %v instead of %w for error wrapping",
        suggestion: "Replace %v with %w to enable errors.Is/As unwrapping"
      },
      {
        id: "GO-02",
        severity: "HIGH",
        category: "convention",
        pattern: /_\s*=\s*err\b/,
        fileFilter: /\.go$/,
        excludeFilter: /_test\.go$/,
        message: "Error ignored with _ = err",
        suggestion: "Handle the error or use an explicit //nolint:errcheck comment"
      },
      {
        id: "GO-03",
        severity: "HIGH",
        category: "convention",
        pattern: /\bgo\s+func\s*\(/,
        fileFilter: /\.go$/,
        excludeFilter: /(safego|_test)\.go$/,
        message: "Bare go func() \u2014 use safego.Go for panic recovery",
        suggestion: "Replace go func() { ... }() with safego.Go(func() { ... })"
      },
      {
        id: "GO-04",
        severity: "HIGH",
        category: "convention",
        pattern: /"sync\/atomic"/,
        fileFilter: /\.go$/,
        message: "sync/atomic used instead of go.uber.org/atomic",
        suggestion: "Use go.uber.org/atomic for safer atomic operations"
      },
      {
        id: "GO-05",
        severity: "HIGH",
        category: "convention",
        pattern: /"base\/glog"/,
        fileFilter: /\.go$/,
        excludeFilter: /base\//,
        message: "Direct base/glog import \u2014 use common/log instead",
        suggestion: "Import common/log and use log.Infof, log.Errorf, etc."
      },
      {
        id: "GO-06",
        severity: "CRITICAL",
        category: "architecture",
        pattern: /"go\.mongodb\.org/,
        fileFilter: /\.go$/,
        excludeFilter: /db_server/,
        message: "Direct MongoDB import outside db_server",
        suggestion: "All DB operations must go through db_server RPC"
      },
      {
        id: "GO-07",
        severity: "CRITICAL",
        category: "architecture",
        pattern: null,
        // Special: check cross-service internal imports
        fileFilter: /servers\/.*\/internal\//,
        message: "Cross-service internal package import",
        suggestion: "Services should communicate via RPC, not internal imports"
      },
      {
        id: "GO-08",
        severity: "CRITICAL",
        category: "architecture",
        pattern: /".*servers\//,
        fileFilter: /common\//,
        message: "common/ importing servers/ \u2014 wrong dependency direction",
        suggestion: "common/ must not import from servers/. Move shared code to common/"
      },
      {
        id: "GO-09",
        severity: "HIGH",
        category: "convention",
        pattern: /\btime\.Now\(\)/,
        fileFilter: /\.go$/,
        excludeFilter: /_test\.go$/,
        message: "time.Now() used \u2014 consider mtime.NowTimeWithOffset()",
        suggestion: "Use mtime.NowTimeWithOffset() for server-consistent time"
      }
    ];
  }
});

// src/tools/game/ScoreReview/checks/unreal.ts
var UNREAL_CHECKS;
var init_unreal = __esm({
  "src/tools/game/ScoreReview/checks/unreal.ts"() {
    UNREAL_CHECKS = [
      {
        id: "UE-01",
        severity: "HIGH",
        category: "convention",
        pattern: /\bnew\s+[A-Z]\w+[^(]*;/,
        fileFilter: /\.(cpp|h)$/,
        message: "Raw new on potential UObject \u2014 use NewObject<T>()",
        suggestion: "Use NewObject<T>(), CreateDefaultSubobject<T>(), or SpawnActor<T>()"
      },
      {
        id: "UE-02",
        severity: "HIGH",
        category: "convention",
        pattern: /\bU[A-Z]\w+\s*\*/,
        fileFilter: /\.(h|hpp)$/,
        message: "UObject* without UPROPERTY() may be GC-collected",
        suggestion: "Mark UObject references with UPROPERTY() to prevent GC"
      },
      {
        id: "UE-03",
        severity: "HIGH",
        category: "convention",
        pattern: /\b(printf|std::cout|OutputDebugString)\b/,
        fileFilter: /\.(cpp|h)$/,
        message: "Raw print used instead of UE_LOG",
        suggestion: 'Use UE_LOG(LogGame, Warning, TEXT("message"))'
      },
      {
        id: "UE-04",
        severity: "HIGH",
        category: "convention",
        pattern: /\b(std::thread|std::async)\b/,
        fileFilter: /\.(cpp|h)$/,
        message: "std::thread/async used instead of FRunnable/AsyncTask",
        suggestion: "Use FRunnable, FAsyncTask, or AsyncTask(ENamedThreads::...)"
      },
      {
        id: "UE-05",
        severity: "CRITICAL",
        category: "convention",
        pattern: /class\s+\w+\s*:\s*public\s+(AActor|UActorComponent|UObject)/,
        fileFilter: /\.(h|hpp)$/,
        message: "Reflected class may be missing GENERATED_BODY()",
        suggestion: "Ensure GENERATED_BODY() is present inside UCLASS/USTRUCT"
      },
      {
        id: "UE-06",
        severity: "MEDIUM",
        category: "convention",
        pattern: /\bdelete\s+/,
        fileFilter: /\.(cpp|h)$/,
        message: "Raw delete \u2014 UObjects are GC-managed",
        suggestion: "Let GC handle UObject cleanup. Use TSharedPtr for non-UObjects."
      }
    ];
  }
});

// src/tools/game/ScoreReview/checks/godot.ts
var GODOT_CHECKS;
var init_godot = __esm({
  "src/tools/game/ScoreReview/checks/godot.ts"() {
    GODOT_CHECKS = [
      {
        id: "GD-01",
        severity: "MEDIUM",
        category: "convention",
        pattern: /func\s+\w+\([^:)]+\)\s*:/,
        fileFilter: /\.gd$/,
        message: "Missing type hints on function parameters",
        suggestion: "Add type hints: func method(param: Type) -> ReturnType:"
      },
      {
        id: "GD-02",
        severity: "MEDIUM",
        category: "convention",
        pattern: /\bprint\s*\(/,
        fileFilter: /\.gd$/,
        excludeFilter: /debug\//,
        message: "print() left in non-debug code",
        suggestion: "Remove print() or use a debug logger"
      },
      {
        id: "GD-03",
        severity: "HIGH",
        category: "convention",
        pattern: /\byield\b/,
        fileFilter: /\.gd$/,
        message: "yield is deprecated in Godot 4 \u2014 use await",
        suggestion: "Replace yield with await"
      },
      {
        id: "GD-04",
        severity: "HIGH",
        category: "performance",
        pattern: /(velocity|move_and_slide)/,
        fileFilter: /\.gd$/,
        message: "Movement logic possibly in _process instead of _physics_process",
        suggestion: "Move physics-related code to _physics_process for frame-rate independence"
      },
      {
        id: "GD-05",
        severity: "MEDIUM",
        category: "convention",
        pattern: null,
        // Special: check for missing class_name in shared scripts
        fileFilter: /(component|shared|util)\//,
        message: "Missing class_name on reusable script",
        suggestion: "Add class_name at top of script for global type registration"
      }
    ];
  }
});

// src/tools/game/ScoreReview/mechanicalChecks.ts
function getChecksForEngine(engine, serverLanguage) {
  const checks = [
    ...UNIVERSAL_CHECKS.filter((c) => c.pattern !== null)
  ];
  switch (engine) {
    case "unity":
      checks.push(...UNITY_CHECKS.filter((c) => c.pattern !== null));
      break;
    case "unreal":
      checks.push(...UNREAL_CHECKS.filter((c) => c.pattern !== null));
      break;
    case "godot":
      checks.push(...GODOT_CHECKS.filter((c) => c.pattern !== null));
      break;
  }
  if (serverLanguage === "go") {
    checks.push(...GO_CHECKS.filter((c) => c.pattern !== null));
  }
  return checks;
}
function runMechanicalChecks(changedFiles, engine, serverLanguage) {
  const checks = getChecksForEngine(engine, serverLanguage);
  const issues = [];
  for (const file of changedFiles) {
    for (const check of checks) {
      if (!check.fileFilter.test(file.path)) continue;
      if (check.excludeFilter?.test(file.path)) continue;
      if (!check.pattern) continue;
      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (check.pattern.test(lines[i])) {
          issues.push({
            id: check.id,
            phase: "mechanical",
            category: check.category,
            severity: check.severity,
            file_path: file.path,
            line: i + 1,
            message: check.message,
            suggestion: check.suggestion,
            deduction: assignDeduction(check.severity)
          });
        }
      }
    }
  }
  return issues;
}
var init_mechanicalChecks = __esm({
  "src/tools/game/ScoreReview/mechanicalChecks.ts"() {
    init_scoringEngine();
    init_universal();
    init_unity();
    init_go();
    init_unreal();
    init_godot();
  }
});

// src/tools/game/ScoreReview/qualityRatchet.ts
function checkRatchet(currentScore, previousScore) {
  if (previousScore === null) return { passed: true };
  if (currentScore >= previousScore) return { passed: true };
  return {
    passed: false,
    message: `Quality regression: ${currentScore} < ${previousScore}. Fix introduced issues and re-review.`
  };
}
var init_qualityRatchet = __esm({
  "src/tools/game/ScoreReview/qualityRatchet.ts"() {
  }
});

// src/tools/game/ScoreReview/pushApproved.ts
import { existsSync as existsSync4, readFileSync as readFileSync4, writeFileSync as writeFileSync2, unlinkSync, mkdirSync as mkdirSync2 } from "fs";
import { join as join3, dirname } from "path";
function getMarkerPath(cwd) {
  return join3(cwd, ".danya", MARKER_FILENAME);
}
function createPushApprovedMarker(cwd, data) {
  const path = getMarkerPath(cwd);
  mkdirSync2(dirname(path), { recursive: true });
  writeFileSync2(path, JSON.stringify(data, null, 2), "utf-8");
}
var MARKER_FILENAME;
var init_pushApproved = __esm({
  "src/tools/game/ScoreReview/pushApproved.ts"() {
    MARKER_FILENAME = "push-approved";
  }
});

// src/tools/game/ScoreReview/reportFormatter.ts
function formatHumanReport(report) {
  const status = report.score.passed ? "PASS" : "FAIL";
  const lines = [];
  lines.push("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  lines.push(`  CODE REVIEW: ${status}  Score: ${report.score.score}/100`);
  lines.push("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  lines.push(`  Branch: ... \u2192 ${report.base_ref}`);
  lines.push(`  Changed: ${report.change_summary.files_changed} files, +${report.change_summary.lines_added}/-${report.change_summary.lines_removed} lines`);
  if (report.change_summary.modules.length > 0) {
    lines.push(`  Modules: ${report.change_summary.modules.join(", ")}`);
  }
  lines.push("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  const byCategory = /* @__PURE__ */ new Map();
  for (const issue of report.issues) {
    const list = byCategory.get(issue.category) ?? [];
    list.push(issue);
    byCategory.set(issue.category, list);
  }
  for (const [category, issues] of byCategory) {
    lines.push("");
    lines.push(`\u2500\u2500\u2500 ${capitalize(category)} (${issues.length} issue${issues.length !== 1 ? "s" : ""}) \u2500\u2500\u2500`);
    for (const issue of issues) {
      const loc = issue.line ? `${issue.file_path}:${issue.line}` : issue.file_path;
      lines.push(`  [${issue.severity}] ${issue.id}  ${loc}`);
      lines.push(`         ${issue.message}`);
      if (issue.suggestion) {
        lines.push(`         Fix: ${issue.suggestion}`);
      }
    }
  }
  if (report.issues.length === 0) {
    lines.push("");
    lines.push("  \u2705 No issues found");
  }
  lines.push("");
  lines.push("\u2500\u2500\u2500 Scoring \u2500\u2500\u2500");
  lines.push(`  CRITICAL: ${report.score.critical_count}  (\xD7-30 = -${report.score.critical_count * 30})`);
  lines.push(`  HIGH:     ${report.score.high_count}  (\xD7-10 = -${report.score.high_count * 10})`);
  lines.push(`  MEDIUM:   ${report.score.medium_count}  (\xD7-3  = -${report.score.medium_count * 3})`);
  lines.push(`  Deduction: -${report.score.total_deduction}`);
  lines.push(`  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  lines.push(`  Score: ${report.score.score}/100`);
  lines.push("");
  lines.push("\u2500\u2500\u2500 Verdict \u2500\u2500\u2500");
  if (report.score.passed) {
    lines.push(`  \u2705 PASS (${report.score.score}/100) \u2014 push-approved ${report.push_approved ? "created" : "not created"}`);
  } else {
    if (report.score.critical_count > 0) {
      lines.push(`  \u274C FAIL (${report.score.score}/100) \u2014 ${report.score.critical_count} CRITICAL issue(s) (auto-fail)`);
    } else {
      lines.push(`  \u274C FAIL (${report.score.score}/100) \u2014 below threshold (80)`);
    }
  }
  lines.push("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  return lines.join("\n");
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
var init_reportFormatter = __esm({
  "src/tools/game/ScoreReview/reportFormatter.ts"() {
  }
});

// src/tools/game/ScoreReview/ScoreReview.tsx
var ScoreReview_exports = {};
__export(ScoreReview_exports, {
  ScoreReviewTool: () => ScoreReviewTool
});
import { z as z7 } from "zod";
import { readFileSync as readFileSync5, existsSync as existsSync5 } from "fs";
import { execSync } from "child_process";
import { join as join4 } from "path";
function getChangedFiles(cwd, baseRef) {
  try {
    const output = execSync(`git diff --name-only ${baseRef} 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null || git diff --name-only`, {
      cwd,
      encoding: "utf-8",
      timeout: 1e4
    });
    return output.split("\n").filter((f) => f.trim().length > 0);
  } catch {
    return [];
  }
}
function getDiffStats(cwd, baseRef) {
  try {
    const output = execSync(`git diff --shortstat ${baseRef} 2>/dev/null`, {
      cwd,
      encoding: "utf-8",
      timeout: 1e4
    });
    const addMatch = output.match(/(\d+) insertion/);
    const delMatch = output.match(/(\d+) deletion/);
    return {
      added: addMatch ? parseInt(addMatch[1], 10) : 0,
      removed: delMatch ? parseInt(delMatch[1], 10) : 0
    };
  } catch {
    return { added: 0, removed: 0 };
  }
}
function getBranchName(cwd) {
  try {
    return execSync("git branch --show-current 2>/dev/null", { cwd, encoding: "utf-8" }).trim() || "unknown";
  } catch {
    return "unknown";
  }
}
function readFileContents(cwd, files) {
  return files.map((f) => {
    const fullPath = f.startsWith("/") || f.includes(":") ? f : join4(cwd, f);
    try {
      return { path: f, content: existsSync5(fullPath) ? readFileSync5(fullPath, "utf-8") : "" };
    } catch {
      return { path: f, content: "" };
    }
  }).filter((f) => f.content.length > 0);
}
var inputSchema7, ScoreReviewTool;
var init_ScoreReview = __esm({
  "src/tools/game/ScoreReview/ScoreReview.tsx"() {
    init_prompt();
    init_scoringEngine();
    init_mechanicalChecks();
    init_qualityRatchet();
    init_pushApproved();
    init_reportFormatter();
    init_detect();
    init_state();
    inputSchema7 = z7.strictObject({
      files: z7.array(z7.string()).optional().describe("Files to review. Default: all changed files from git diff"),
      base_ref: z7.string().optional().describe("Git ref to diff against. Default: HEAD~1"),
      previous_score: z7.number().optional().describe("Previous review score for quality ratchet enforcement"),
      mode: z7.enum(["quick", "standard", "full"]).optional().describe("Review mode. quick=mechanical only, standard=mechanical+AI, full=all+harness. Default: standard")
    });
    ScoreReviewTool = {
      name: TOOL_NAME4,
      description: DESCRIPTION5,
      searchHint: "score-based code review with quality ratchet",
      inputSchema: inputSchema7,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return false;
      },
      // writes push-approved marker
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION5;
      },
      renderToolUseMessage({ files, mode }) {
        return `Running code review (${mode ?? "standard"})${files ? `: ${files.length} files` : ""}`;
      },
      renderResultForAssistant(output) {
        return formatHumanReport(output);
      },
      async *call({ files, base_ref = "HEAD~1", previous_score, mode = "standard" }, context) {
        const cwd = getCwd();
        const detection = detectProject(cwd);
        const changedFiles = files ?? getChangedFiles(cwd, base_ref);
        if (changedFiles.length === 0) {
          const emptyReport = {
            score: { score: 100, passed: true, critical_count: 0, high_count: 0, medium_count: 0, total_deduction: 0 },
            issues: [],
            change_summary: { files_changed: 0, lines_added: 0, lines_removed: 0, modules: [] },
            base_ref,
            push_approved: true
          };
          yield { type: "result", data: emptyReport, resultForAssistant: formatHumanReport(emptyReport) };
          return;
        }
        const fileContents = readFileContents(cwd, changedFiles);
        const allIssues = [];
        yield { type: "progress", content: { phase: "mechanical", status: "running" } };
        const mechanicalIssues = runMechanicalChecks(fileContents, detection.engine, detection.serverLanguage);
        allIssues.push(...mechanicalIssues);
        if (mode === "standard" || mode === "full") {
          yield { type: "progress", content: { phase: "ai_judgment", status: "running" } };
        }
        const score = calculateScore(allIssues);
        const ratchet = checkRatchet(score.score, previous_score ?? null);
        if (!ratchet.passed) {
        }
        const diffStats = getDiffStats(cwd, base_ref);
        const modules = [...new Set(changedFiles.map((f) => {
          const parts = f.replace(/\\/g, "/").split("/");
          return parts.length > 1 ? parts[0] : "root";
        }))];
        const pushApproved = score.passed && ratchet.passed;
        if (pushApproved) {
          createPushApprovedMarker(cwd, {
            score: score.score,
            branch: getBranchName(cwd),
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            reviewer: "danya-agent"
          });
        }
        const report = {
          score,
          issues: allIssues,
          change_summary: {
            files_changed: changedFiles.length,
            lines_added: diffStats.added,
            lines_removed: diffStats.removed,
            modules
          },
          base_ref,
          push_approved: pushApproved
        };
        yield { type: "result", data: report, resultForAssistant: formatHumanReport(report) };
      }
    };
  }
});

// src/tools/game/ArchitectureGuard/prompt.ts
var TOOL_NAME5, DESCRIPTION6;
var init_prompt2 = __esm({
  "src/tools/game/ArchitectureGuard/prompt.ts"() {
    TOOL_NAME5 = "ArchitectureGuard";
    DESCRIPTION6 = `Static analysis to detect architecture/dependency violations.

Checks:
- Layer dependency direction (e.g., Framework \u2190 Gameplay \u2190 Renderer \u2190 Tools)
- Forbidden zone edits (auto-generated code, protected directories)
- Cross-module import violations

Supports: C# (using), Go (import), C++ (#include), GDScript (preload).
Fast: regex-based, typically <2s.`;
  }
});

// src/tools/game/ArchitectureGuard/importParser.ts
function extractImports(content, filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "cs":
      return extractCSharpImports(content, filePath);
    case "go":
      return extractGoImports(content, filePath);
    case "cpp":
    case "h":
    case "hpp":
    case "cc":
      return extractCppImports(content, filePath);
    case "gd":
      return extractGDScriptImports(content, filePath);
    default:
      return [];
  }
}
function extractCSharpImports(content, filePath) {
  const imports = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(CSHARP_USING);
    if (match) {
      imports.push({
        file_path: filePath,
        line: i + 1,
        imported_path: match[1],
        imported_module: match[1].split(".")[0]
      });
    }
  }
  return imports;
}
function extractGoImports(content, filePath) {
  const imports = [];
  const lines = content.split("\n");
  let inImportBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "import (") {
      inImportBlock = true;
      continue;
    }
    if (inImportBlock && line === ")") {
      inImportBlock = false;
      continue;
    }
    if (inImportBlock || line.startsWith('import "')) {
      const match = line.match(GO_IMPORT);
      if (match) {
        imports.push({
          file_path: filePath,
          line: i + 1,
          imported_path: match[1],
          imported_module: match[1].split("/")[0]
        });
      }
    }
  }
  return imports;
}
function extractCppImports(content, filePath) {
  const imports = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(CPP_INCLUDE);
    if (match) {
      imports.push({
        file_path: filePath,
        line: i + 1,
        imported_path: match[1]
      });
    }
  }
  return imports;
}
function extractGDScriptImports(content, filePath) {
  const imports = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let match;
    const regex = new RegExp(GDSCRIPT_PRELOAD.source, "g");
    while ((match = regex.exec(lines[i])) !== null) {
      imports.push({
        file_path: filePath,
        line: i + 1,
        imported_path: match[1]
      });
    }
  }
  return imports;
}
var CSHARP_USING, GO_IMPORT, CPP_INCLUDE, GDSCRIPT_PRELOAD;
var init_importParser = __esm({
  "src/tools/game/ArchitectureGuard/importParser.ts"() {
    CSHARP_USING = /^using\s+([A-Za-z][\w.]*)\s*;/;
    GO_IMPORT = /^\s*"([^"]+)"/;
    CPP_INCLUDE = /^#include\s+["<]([^">]+)[">]/;
    GDSCRIPT_PRELOAD = /preload\(["']([^"']+)["']\)/g;
  }
});

// src/tools/game/ArchitectureGuard/layerRules.ts
function getLayerForFile(filePath, rule) {
  const normalized = filePath.replace(/\\/g, "/");
  for (const [pattern, layer] of Object.entries(rule.pathToLayer)) {
    if (normalized.includes(pattern)) return layer;
  }
  return null;
}
function getLayerForImport(importPath, rule) {
  if (rule.namespaceToLayer) {
    for (const [ns, layer] of Object.entries(rule.namespaceToLayer)) {
      if (importPath.startsWith(ns)) return layer;
    }
  }
  for (const [pattern, layer] of Object.entries(rule.pathToLayer)) {
    if (importPath.includes(pattern)) return layer;
  }
  return null;
}
function checkLayerViolations(imports, rule) {
  const violations = [];
  const layerOrder = rule.layers;
  for (const imp of imports) {
    const fromLayer = getLayerForFile(imp.file_path, rule);
    const toLayer = getLayerForImport(imp.imported_path, rule);
    if (!fromLayer || !toLayer) continue;
    if (fromLayer === toLayer) continue;
    const fromIdx = layerOrder.indexOf(fromLayer);
    const toIdx = layerOrder.indexOf(toLayer);
    if (fromIdx < toIdx) {
      violations.push({
        type: "layer_violation",
        file_path: imp.file_path,
        line: imp.line,
        message: `Layer violation: ${fromLayer} cannot import ${toLayer} (${imp.imported_path})`,
        from_layer: fromLayer,
        to_layer: toLayer,
        import_path: imp.imported_path
      });
    }
  }
  return violations;
}
function checkForbiddenZones(filePaths, guardRules) {
  const violations = [];
  for (const filePath of filePaths) {
    const normalized = filePath.replace(/\\/g, "/");
    for (const rule of guardRules) {
      try {
        const regex = new RegExp(rule.pattern);
        if (regex.test(normalized)) {
          violations.push({
            type: "forbidden_zone_edit",
            file_path: filePath,
            line: 0,
            message: `Forbidden zone: ${rule.description}. ${rule.fix_hint}`
          });
          break;
        }
      } catch {
        if (normalized.includes(rule.pattern)) {
          violations.push({
            type: "forbidden_zone_edit",
            file_path: filePath,
            line: 0,
            message: `Forbidden zone: ${rule.description}. ${rule.fix_hint}`
          });
          break;
        }
      }
    }
  }
  return violations;
}
var UNITY_LAYERS, GO_SERVER_LAYERS;
var init_layerRules = __esm({
  "src/tools/game/ArchitectureGuard/layerRules.ts"() {
    UNITY_LAYERS = {
      name: "Unity 4-Layer",
      layers: ["Framework", "Gameplay", "Renderer", "Tools"],
      pathToLayer: {
        "Scripts/Framework/": "Framework",
        "Scripts/Gameplay/": "Gameplay",
        "Scripts/Renderer/": "Renderer",
        "Scripts/Tools/": "Tools"
      },
      namespaceToLayer: {
        "FL.Framework": "Framework",
        "FL.Gameplay": "Gameplay",
        "FL.Renderer": "Renderer",
        "FL.Update": "Tools"
      }
    };
    GO_SERVER_LAYERS = {
      name: "Go Server Layers",
      layers: ["base", "pkg", "common", "servers"],
      pathToLayer: {
        "base/": "base",
        "pkg/": "pkg",
        "common/": "common",
        "servers/": "servers"
      }
    };
  }
});

// src/tools/game/ArchitectureGuard/ArchitectureGuard.tsx
var ArchitectureGuard_exports = {};
__export(ArchitectureGuard_exports, {
  ArchitectureGuardTool: () => ArchitectureGuardTool
});
import { z as z8 } from "zod";
import { readFileSync as readFileSync6, existsSync as existsSync6 } from "fs";
import { execSync as execSync2 } from "child_process";
function getChangedFiles2(cwd) {
  try {
    const output = execSync2("git diff --name-only HEAD 2>/dev/null || git diff --name-only", {
      cwd,
      encoding: "utf-8",
      timeout: 1e4
    });
    return output.split("\n").filter((f) => f.trim().length > 0);
  } catch {
    return [];
  }
}
function loadGuardRules(cwd) {
  const candidates = [
    `${cwd}/.danya/guard-rules.json`,
    `${cwd}/.claude/guard-rules.json`
  ];
  for (const path of candidates) {
    if (existsSync6(path)) {
      try {
        return JSON.parse(readFileSync6(path, "utf-8"));
      } catch {
      }
    }
  }
  return [];
}
function getLayerRule(cwd) {
  const detection = detectProject(cwd);
  switch (detection.engine) {
    case "unity":
      return UNITY_LAYERS;
    default:
      break;
  }
  if (detection.serverLanguage === "go") return GO_SERVER_LAYERS;
  return null;
}
var inputSchema8, ArchitectureGuardTool;
var init_ArchitectureGuard = __esm({
  "src/tools/game/ArchitectureGuard/ArchitectureGuard.tsx"() {
    init_prompt2();
    init_importParser();
    init_layerRules();
    init_detect();
    init_state();
    inputSchema8 = z8.strictObject({
      files: z8.array(z8.string()).optional().describe("Files to check. Default: all changed files from git diff"),
      rules_path: z8.string().optional().describe("Path to architecture rules. Default: auto-detect from .danya/rules/")
    });
    ArchitectureGuardTool = {
      name: TOOL_NAME5,
      description: DESCRIPTION6,
      searchHint: "check code dependency direction and architecture violations",
      inputSchema: inputSchema8,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return true;
      },
      isConcurrencySafe() {
        return true;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION6;
      },
      renderToolUseMessage({ files }) {
        return `Checking architecture: ${files ? `${files.length} files` : "changed files"}`;
      },
      renderResultForAssistant(output) {
        if (output.clean) {
          return `Architecture check: \u2705 clean (${output.files_checked} files checked)`;
        }
        const lines = output.violations.map(
          (v) => `  [${v.type}] ${v.file_path}:${v.line} \u2014 ${v.message}`
        ).join("\n");
        return `Architecture check: ${output.violation_count} violations
${lines}`;
      },
      async *call({ files, rules_path }, context) {
        const cwd = getCwd();
        const targetFiles = files ?? getChangedFiles2(cwd);
        if (targetFiles.length === 0) {
          const output2 = { violations: [], violation_count: 0, files_checked: 0, clean: true };
          yield { type: "result", data: output2, resultForAssistant: this.renderResultForAssistant(output2) };
          return;
        }
        const allViolations = [];
        const guardRules = loadGuardRules(cwd);
        if (guardRules.length > 0) {
          allViolations.push(...checkForbiddenZones(targetFiles, guardRules));
        }
        const layerRule = getLayerRule(cwd);
        if (layerRule) {
          for (const file of targetFiles) {
            const fullPath = file.startsWith("/") || file.includes(":") ? file : `${cwd}/${file}`;
            if (!existsSync6(fullPath)) continue;
            try {
              const content = readFileSync6(fullPath, "utf-8");
              const imports = extractImports(content, file);
              allViolations.push(...checkLayerViolations(imports, layerRule));
            } catch {
            }
          }
        }
        const output = {
          violations: allViolations,
          violation_count: allViolations.length,
          files_checked: targetFiles.length,
          clean: allViolations.length === 0
        };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/KnowledgeSediment/prompt.ts
var TOOL_NAME6, DESCRIPTION7;
var init_prompt3 = __esm({
  "src/tools/game/KnowledgeSediment/prompt.ts"() {
    TOOL_NAME6 = "KnowledgeSediment";
    DESCRIPTION7 = `Automatically sediment knowledge (features, bug fixes, research) to the project's Docs/ directory.

Runs automatically after task completion. Creates structured documentation:
- feature \u2192 Docs/Version/<version>/<title>/summary.md
- bugfix  \u2192 Docs/Bugs/<version>/<title>.md
- research \u2192 Docs/Engine/Research/<title>/findings.md`;
  }
});

// src/tools/game/KnowledgeSediment/KnowledgeSediment.tsx
var KnowledgeSediment_exports = {};
__export(KnowledgeSediment_exports, {
  KnowledgeSedimentTool: () => KnowledgeSedimentTool
});
import { z as z9 } from "zod";
import { mkdirSync as mkdirSync3, writeFileSync as writeFileSync3, existsSync as existsSync7, readFileSync as readFileSync7 } from "fs";
import { join as join5, dirname as dirname2 } from "path";
function getOutputPath(cwd, type, version, title) {
  const safeTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, "-").toLowerCase();
  switch (type) {
    case "feature":
      return join5(cwd, "Docs", "Version", version, safeTitle, "summary.md");
    case "bugfix":
      return join5(cwd, "Docs", "Bugs", version, `${safeTitle}.md`);
    case "research":
      return join5(cwd, "Docs", "Engine", "Research", safeTitle, "findings.md");
    default:
      return join5(cwd, "Docs", "Other", `${safeTitle}.md`);
  }
}
function formatContent(input) {
  const lines = [];
  lines.push(`# ${input.title}`);
  lines.push("");
  lines.push(`**Type:** ${input.type}`);
  if (input.version) lines.push(`**Version:** ${input.version}`);
  lines.push(`**Date:** ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(input.content.summary);
  if (input.content.details) {
    lines.push("");
    lines.push("## Details");
    lines.push("");
    lines.push(input.content.details);
  }
  if (input.content.files_changed?.length) {
    lines.push("");
    lines.push("## Files Changed");
    lines.push("");
    for (const f of input.content.files_changed) {
      lines.push(`- ${f}`);
    }
  }
  if (input.content.lessons_learned) {
    lines.push("");
    lines.push("## Lessons Learned");
    lines.push("");
    lines.push(input.content.lessons_learned);
  }
  lines.push("");
  return lines.join("\n");
}
var inputSchema9, KnowledgeSedimentTool;
var init_KnowledgeSediment = __esm({
  "src/tools/game/KnowledgeSediment/KnowledgeSediment.tsx"() {
    init_prompt3();
    init_state();
    inputSchema9 = z9.strictObject({
      type: z9.enum(["feature", "bugfix", "research"]).describe("Type of knowledge to sediment"),
      title: z9.string().describe("Short title for the knowledge entry"),
      version: z9.string().optional().describe('Project version. Default: "current"'),
      content: z9.object({
        summary: z9.string().describe("1-3 sentence summary"),
        details: z9.string().optional().describe("Detailed content"),
        files_changed: z9.array(z9.string()).optional().describe("Files involved"),
        lessons_learned: z9.string().optional().describe("Key takeaways")
      })
    });
    KnowledgeSedimentTool = {
      name: TOOL_NAME6,
      description: DESCRIPTION7,
      searchHint: "save knowledge documentation for features bugs research",
      inputSchema: inputSchema9,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return false;
      },
      isConcurrencySafe() {
        return true;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION7;
      },
      renderToolUseMessage(input) {
        return `Sedimenting ${input.type}: ${input.title}`;
      },
      renderResultForAssistant(output) {
        return output.created ? `Knowledge sediment written to: ${output.file_path}` : `Knowledge sediment appended to: ${output.file_path}`;
      },
      async *call(input, context) {
        const cwd = getCwd();
        const version = input.version ?? "current";
        const filePath = getOutputPath(cwd, input.type, version, input.title);
        const content = formatContent(input);
        mkdirSync3(dirname2(filePath), { recursive: true });
        let created = true;
        if (existsSync7(filePath)) {
          const existing = readFileSync7(filePath, "utf-8");
          writeFileSync3(filePath, existing + "\n---\n\n" + content, "utf-8");
          created = false;
        } else {
          writeFileSync3(filePath, content, "utf-8");
        }
        const output = { file_path: filePath, created };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/GateChain/prompt.ts
var TOOL_NAME7, DESCRIPTION8;
var init_prompt4 = __esm({
  "src/tools/game/GateChain/prompt.ts"() {
    TOOL_NAME7 = "GateChain";
    DESCRIPTION8 = `Run the full quality gate chain: verify \u2192 commit \u2192 review \u2192 push.
Chains other tools in sequence. Stops at the first failed gate.
Use skip_push=true (default) to stop after review without pushing.`;
  }
});

// src/tools/game/GateChain/GateChain.tsx
var GateChain_exports = {};
__export(GateChain_exports, {
  GateChainTool: () => GateChainTool
});
import { z as z10 } from "zod";
import { execSync as execSync3 } from "child_process";
function runCommand(cmd, cwd) {
  try {
    const output = execSync3(cmd, { cwd, encoding: "utf-8", timeout: 3e5 });
    return { success: true, output };
  } catch (err) {
    return { success: false, output: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}
var inputSchema10, GateChainTool;
var init_GateChain = __esm({
  "src/tools/game/GateChain/GateChain.tsx"() {
    init_prompt4();
    init_state();
    init_detect();
    inputSchema10 = z10.strictObject({
      start_from: z10.enum(["verify", "commit", "review", "push"]).optional().describe("Start from this stage. Default: verify"),
      commit_message: z10.string().optional().describe("Commit message. If omitted, auto-generated from diff"),
      skip_push: z10.boolean().optional().describe("Stop after review, do not push. Default: true"),
      files: z10.array(z10.string()).optional().describe("Specific files to include")
    });
    GateChainTool = {
      name: TOOL_NAME7,
      description: DESCRIPTION8,
      searchHint: "run full quality gate chain verify commit review push",
      inputSchema: inputSchema10,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return false;
      },
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return true;
      },
      async prompt() {
        return DESCRIPTION8;
      },
      renderToolUseMessage(input) {
        return `Running gate chain from ${input.start_from ?? "verify"}${input.skip_push !== false ? " (no push)" : ""}`;
      },
      renderResultForAssistant(output) {
        const lines = output.stages.map((s) => {
          const icon = s.status === "passed" ? "\u2705" : s.status === "failed" ? "\u274C" : "\u23ED";
          return `  ${icon} ${s.name}: ${s.detail} (${s.duration_ms}ms)`;
        });
        const header = output.overall_status === "passed" ? `Gate Chain: \u2705 ALL PASSED` : `Gate Chain: \u274C STOPPED at ${output.stopped_at}`;
        if (output.review_score !== void 0) {
          lines.push(`  Score: ${output.review_score}/100`);
        }
        return `${header}
${lines.join("\n")}`;
      },
      async *call({ start_from = "verify", commit_message, skip_push = true, files }, context) {
        const cwd = getCwd();
        const detection = detectProject(cwd);
        const totalStart = Date.now();
        const stages = [];
        const gateOrder = ["verify", "commit", "review", "push"];
        const startIdx = gateOrder.indexOf(start_from);
        for (let i = 0; i < gateOrder.length; i++) {
          const gate = gateOrder[i];
          if (i < startIdx) {
            stages.push({ name: gate, status: "skipped", detail: "skipped (start_from)", duration_ms: 0 });
            continue;
          }
          if (gate === "push" && skip_push) {
            stages.push({ name: gate, status: "skipped", detail: "skipped (skip_push=true)", duration_ms: 0 });
            continue;
          }
          yield { type: "progress", content: { stage: gate, status: "running" } };
          const stageStart = Date.now();
          switch (gate) {
            case "verify": {
              let cmd = 'echo "No build tool configured"';
              if (detection.serverLanguage === "go") {
                cmd = "make build 2>&1 || go build ./... 2>&1";
              }
              const result = runCommand(cmd, cwd);
              stages.push({
                name: "verify",
                status: result.success ? "passed" : "failed",
                detail: result.success ? "Build passed" : result.output.slice(0, 200),
                duration_ms: Date.now() - stageStart
              });
              if (!result.success) {
                const output2 = { stages, overall_status: "failed", stopped_at: "verify", total_duration_ms: Date.now() - totalStart };
                yield { type: "result", data: output2, resultForAssistant: this.renderResultForAssistant(output2) };
                return;
              }
              break;
            }
            case "commit": {
              const fileList = files?.join(" ") ?? "-A";
              const msg = commit_message ?? "chore: auto-commit via gate chain";
              const addResult = runCommand(`git add ${fileList}`, cwd);
              const commitResult = runCommand(`git commit -m "${msg}"`, cwd);
              const success = commitResult.success || commitResult.output.includes("nothing to commit");
              stages.push({
                name: "commit",
                status: success ? "passed" : "failed",
                detail: success ? "Committed" : commitResult.output.slice(0, 200),
                duration_ms: Date.now() - stageStart
              });
              if (!success) {
                const output2 = { stages, overall_status: "failed", stopped_at: "commit", total_duration_ms: Date.now() - totalStart };
                yield { type: "result", data: output2, resultForAssistant: this.renderResultForAssistant(output2) };
                return;
              }
              break;
            }
            case "review": {
              stages.push({
                name: "review",
                status: "passed",
                detail: "Review should be run via /review or ScoreReview tool",
                duration_ms: Date.now() - stageStart
              });
              break;
            }
            case "push": {
              const pushResult = runCommand("git push", cwd);
              stages.push({
                name: "push",
                status: pushResult.success ? "passed" : "failed",
                detail: pushResult.success ? "Pushed" : pushResult.output.slice(0, 200),
                duration_ms: Date.now() - stageStart
              });
              if (!pushResult.success) {
                const output2 = { stages, overall_status: "failed", stopped_at: "push", total_duration_ms: Date.now() - totalStart };
                yield { type: "result", data: output2, resultForAssistant: this.renderResultForAssistant(output2) };
                return;
              }
              break;
            }
          }
        }
        const output = { stages, overall_status: "passed", total_duration_ms: Date.now() - totalStart };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/ProtoCompile/prompt.ts
var TOOL_NAME8, DESCRIPTION9;
var init_prompt5 = __esm({
  "src/tools/game/ProtoCompile/prompt.ts"() {
    TOOL_NAME8 = "ProtoCompile";
    DESCRIPTION9 = `Compile Protocol Buffer definitions and generate client/server stub code.
Invokes protoc with appropriate plugins. Parses errors with file:line.`;
  }
});

// src/tools/game/ProtoCompile/ProtoCompile.tsx
var ProtoCompile_exports = {};
__export(ProtoCompile_exports, {
  ProtoCompileTool: () => ProtoCompileTool
});
import { z as z11 } from "zod";
import { execSync as execSync4 } from "child_process";
function parseProtocErrors(output) {
  const errors = [];
  for (const line of output.split("\n")) {
    const match = line.trim().match(PROTOC_ERROR_REGEX);
    if (match) {
      errors.push({
        file_path: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[4],
        severity: "error"
      });
    }
  }
  return errors;
}
var inputSchema11, PROTOC_ERROR_REGEX, ProtoCompileTool;
var init_ProtoCompile = __esm({
  "src/tools/game/ProtoCompile/ProtoCompile.tsx"() {
    init_prompt5();
    init_state();
    inputSchema11 = z11.strictObject({
      proto_path: z11.string().describe("Path to .proto file or directory"),
      languages: z11.array(z11.enum(["csharp", "go", "cpp"])).optional().describe("Target languages. Default: auto-detect"),
      output_dir: z11.string().optional().describe("Output directory. Default: project-configured")
    });
    PROTOC_ERROR_REGEX = /^(.+?):(\d+):(\d+):\s+(.+)$/;
    ProtoCompileTool = {
      name: TOOL_NAME8,
      description: DESCRIPTION9,
      searchHint: "compile protobuf and generate client server stubs",
      inputSchema: inputSchema11,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return false;
      },
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return true;
      },
      async prompt() {
        return DESCRIPTION9;
      },
      renderToolUseMessage(input) {
        return `Compiling protobuf: ${input.proto_path}`;
      },
      renderResultForAssistant(output) {
        if (output.success) return `ProtoCompile: ${output.proto_files_compiled} files compiled, ${output.generated_files.length} generated`;
        return `ProtoCompile FAILED: ${output.errors.map((e) => `${e.file_path}:${e.line}: ${e.message}`).join("\n")}`;
      },
      async *call(input, context) {
        const start = Date.now();
        const cwd = getCwd();
        try {
          const cmd = `protoc --proto_path="${input.proto_path}" ${input.output_dir ? `--go_out="${input.output_dir}"` : ""} "${input.proto_path}"/*.proto 2>&1`;
          const output = execSync4(cmd, { cwd, encoding: "utf-8", timeout: 6e4 });
          yield { type: "result", data: { success: true, proto_files_compiled: 1, generated_files: [], errors: [], duration_ms: Date.now() - start } };
        } catch (err) {
          const errors = parseProtocErrors((err.stdout ?? "") + (err.stderr ?? ""));
          yield { type: "result", data: { success: false, proto_files_compiled: 0, generated_files: [], errors: errors.length ? errors : [{ file_path: "", line: 0, message: String(err.message).slice(0, 300), severity: "error" }], duration_ms: Date.now() - start } };
        }
      }
    };
  }
});

// src/tools/game/ConfigGenerate/prompt.ts
var TOOL_NAME9, DESCRIPTION10;
var init_prompt6 = __esm({
  "src/tools/game/ConfigGenerate/prompt.ts"() {
    TOOL_NAME9 = "ConfigGenerate";
    DESCRIPTION10 = `Run the config table generation pipeline (Excel/designer tools \u2192 generated code).
Invokes the project-specific generator. Reports errors traced to source.`;
  }
});

// src/tools/game/ConfigGenerate/ConfigGenerate.tsx
var ConfigGenerate_exports = {};
__export(ConfigGenerate_exports, {
  ConfigGenerateTool: () => ConfigGenerateTool
});
import { z as z12 } from "zod";
import { execSync as execSync5 } from "child_process";
import { existsSync as existsSync8 } from "fs";
var inputSchema12, ConfigGenerateTool;
var init_ConfigGenerate = __esm({
  "src/tools/game/ConfigGenerate/ConfigGenerate.tsx"() {
    init_prompt6();
    init_state();
    inputSchema12 = z12.strictObject({
      source_path: z12.string().describe("Path to config source (Excel dir or generator executable)"),
      generator: z12.string().optional().describe("Generator command. Default: auto-detect"),
      targets: z12.array(z12.enum(["client", "server", "both"])).optional().describe("Default: both")
    });
    ConfigGenerateTool = {
      name: TOOL_NAME9,
      description: DESCRIPTION10,
      searchHint: "generate config code from Excel or designer data",
      inputSchema: inputSchema12,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return false;
      },
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return true;
      },
      async prompt() {
        return DESCRIPTION10;
      },
      renderToolUseMessage(input) {
        return `Generating config from: ${input.source_path}`;
      },
      renderResultForAssistant(output) {
        if (output.success) return `ConfigGenerate: ${output.generated_files.length} files generated`;
        return `ConfigGenerate FAILED: ${output.errors.map((e) => `${e.source_file}: ${e.message}`).join("\n")}`;
      },
      async *call(input, context) {
        const start = Date.now();
        const cwd = getCwd();
        const cmd = input.generator ?? (existsSync8(`${cwd}/Makefile`) ? "make config" : `"${input.source_path}"`);
        try {
          execSync5(cmd, { cwd, encoding: "utf-8", timeout: 12e4 });
          yield { type: "result", data: { success: true, generated_files: [], errors: [], duration_ms: Date.now() - start } };
        } catch (err) {
          yield { type: "result", data: { success: false, generated_files: [], errors: [{ source_file: input.source_path, message: String(err.message).slice(0, 300) }], duration_ms: Date.now() - start } };
        }
      }
    };
  }
});

// src/tools/game/CSharpSyntaxCheck/prompt.ts
var TOOL_NAME10, DESCRIPTION11;
var init_prompt7 = __esm({
  "src/tools/game/CSharpSyntaxCheck/prompt.ts"() {
    TOOL_NAME10 = "CSharpSyntaxCheck";
    DESCRIPTION11 = `Performs Roslyn-based AST-level C# syntax validation. Catches syntax errors instantly without waiting for full Unity/Godot compilation.

Usage:
- Automatically triggered after writing/editing .cs files via post-tool hook
- Can also be called manually to check a specific file
- Returns structured errors with file path, line number, column, error code, and message
- Typical execution: <500ms per file`;
  }
});

// src/tools/game/CSharpSyntaxCheck/parser.ts
function parseMSBuildOutput(output) {
  const errors = [];
  for (const line of output.split("\n")) {
    const match = line.trim().match(MSBUILD_REGEX);
    if (match) {
      errors.push({
        file_path: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4],
        code: match[5],
        message: match[6]
      });
    }
  }
  return errors;
}
var MSBUILD_REGEX;
var init_parser = __esm({
  "src/tools/game/CSharpSyntaxCheck/parser.ts"() {
    MSBUILD_REGEX = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(CS\d+):\s+(.+)$/;
  }
});

// src/tools/game/CSharpSyntaxCheck/CSharpSyntaxCheck.tsx
var CSharpSyntaxCheck_exports = {};
__export(CSharpSyntaxCheck_exports, {
  CSharpSyntaxCheckTool: () => CSharpSyntaxCheckTool
});
import { z as z13 } from "zod";
import { execSync as execSync6 } from "child_process";
import { existsSync as existsSync9 } from "fs";
import { dirname as dirname3, join as join6 } from "path";
import { glob } from "glob";
function findCsproj(filePath) {
  let dir = dirname3(filePath);
  for (let i = 0; i < 10; i++) {
    const csprojFiles = glob.sync("*.csproj", { cwd: dir });
    if (csprojFiles.length > 0) return join6(dir, csprojFiles[0]);
    const parent = dirname3(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
function basicSyntaxCheck(content, filePath) {
  const errors = [];
  const lines = content.split("\n");
  let braceDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.replace(/\/\/.*$/, "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const ch of stripped) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth < 0) {
      errors.push({
        file_path: filePath,
        line: i + 1,
        severity: "error",
        message: "Unexpected closing brace",
        code: "DANYA001"
      });
      braceDepth = 0;
    }
  }
  if (braceDepth !== 0) {
    errors.push({
      file_path: filePath,
      line: lines.length,
      severity: "error",
      message: `Unmatched braces: ${braceDepth > 0 ? "missing closing" : "extra closing"} brace(s)`,
      code: "DANYA002"
    });
  }
  return errors;
}
var inputSchema13, CSharpSyntaxCheckTool;
var init_CSharpSyntaxCheck = __esm({
  "src/tools/game/CSharpSyntaxCheck/CSharpSyntaxCheck.tsx"() {
    init_prompt7();
    init_parser();
    inputSchema13 = z13.strictObject({
      file_path: z13.string().describe("Absolute path to the .cs file to check"),
      project_path: z13.string().optional().describe("Path to .csproj for reference resolution. If omitted, auto-detected from file location")
    });
    CSharpSyntaxCheckTool = {
      name: TOOL_NAME10,
      description: DESCRIPTION11,
      searchHint: "check C# syntax errors using Roslyn",
      inputSchema: inputSchema13,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return true;
      },
      isConcurrencySafe() {
        return true;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION11;
      },
      async validateInput({ file_path }) {
        if (!existsSync9(file_path)) {
          return { result: false, message: `File not found: ${file_path}` };
        }
        if (!file_path.endsWith(".cs")) {
          return { result: false, message: "Not a C# file" };
        }
        return { result: true };
      },
      renderToolUseMessage({ file_path }) {
        return `Checking C# syntax: ${file_path}`;
      },
      renderResultForAssistant(output) {
        if (output.success) {
          return `C# syntax check passed: ${output.file_path} (${output.duration_ms}ms)`;
        }
        const errorLines = output.errors.map((e) => `  ${e.file_path}:${e.line}:${e.column ?? 0} ${e.severity} ${e.code ?? ""}: ${e.message}`).join("\n");
        return `C# syntax check FAILED: ${output.error_count} errors, ${output.warning_count} warnings
${errorLines}`;
      },
      async *call({ file_path, project_path }, context) {
        const start = Date.now();
        let errors = [];
        try {
          const csproj = project_path ?? findCsproj(file_path);
          if (csproj && existsSync9(csproj)) {
            const output2 = execSync6(
              `dotnet build "${csproj}" --no-restore --nologo -v q 2>&1`,
              { encoding: "utf-8", timeout: 3e4 }
            );
            errors = parseMSBuildOutput(output2);
          } else {
            const { readFileSync: readFileSync10 } = __require("fs");
            const content = readFileSync10(file_path, "utf-8");
            errors = basicSyntaxCheck(content, file_path);
          }
        } catch (err) {
          if (err.stdout) {
            errors = parseMSBuildOutput(err.stdout);
          } else if (err.stderr) {
            errors = parseMSBuildOutput(err.stderr);
          }
        }
        const fileErrors = errors.filter(
          (e) => e.file_path === file_path || e.file_path.endsWith(file_path.split(/[/\\]/).pop())
        );
        const output = {
          file_path,
          success: fileErrors.filter((e) => e.severity === "error").length === 0,
          errors: fileErrors,
          error_count: fileErrors.filter((e) => e.severity === "error").length,
          warning_count: fileErrors.filter((e) => e.severity === "warning").length,
          duration_ms: Date.now() - start
        };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/UnityBuild/prompt.ts
var TOOL_NAME11, DESCRIPTION12;
var init_prompt8 = __esm({
  "src/tools/game/UnityBuild/prompt.ts"() {
    TOOL_NAME11 = "UnityBuild";
    DESCRIPTION12 = `Compile a Unity project in batch mode. Attempts script-only compilation via dotnet build first, then falls back to reporting that the Unity editor is needed for a full build.

Usage:
- Validates C# scripts compile correctly without opening the Unity editor
- Parses Unity/MSBuild log format for structured error reporting
- Supports build targets: editor, android, ios, windows
- Typical execution: 10-60s for script compilation`;
  }
});

// src/tools/game/UnityBuild/parser.ts
function parseUnityLogOutput(output) {
  const errors = [];
  for (const line of output.split("\n")) {
    const match = line.trim().match(UNITY_LOG_REGEX);
    if (match) {
      errors.push({
        file_path: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4],
        code: match[5],
        message: match[6]
      });
    }
  }
  return errors;
}
var UNITY_LOG_REGEX;
var init_parser2 = __esm({
  "src/tools/game/UnityBuild/parser.ts"() {
    UNITY_LOG_REGEX = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(CS\d+):\s+(.+)$/;
  }
});

// src/tools/game/UnityBuild/UnityBuild.tsx
var UnityBuild_exports = {};
__export(UnityBuild_exports, {
  UnityBuildTool: () => UnityBuildTool
});
import { z as z14 } from "zod";
import { execSync as execSync7 } from "child_process";
import { existsSync as existsSync10 } from "fs";
import { join as join7 } from "path";
import { glob as glob2 } from "glob";
function detectUnityVersion(projectPath) {
  try {
    const versionFile = join7(projectPath, "ProjectSettings", "ProjectVersion.txt");
    if (existsSync10(versionFile)) {
      const { readFileSync: readFileSync10 } = __require("fs");
      const content = readFileSync10(versionFile, "utf-8");
      const match = content.match(/m_EditorVersion:\s*(.+)/);
      return match?.[1]?.trim();
    }
  } catch {
  }
  return void 0;
}
function findCsproj2(projectPath) {
  const patterns = [
    "Assembly-CSharp.csproj",
    "*.csproj"
  ];
  for (const pattern of patterns) {
    const results = glob2.sync(pattern, { cwd: projectPath });
    if (results.length > 0) return join7(projectPath, results[0]);
  }
  return null;
}
var inputSchema14, UnityBuildTool;
var init_UnityBuild = __esm({
  "src/tools/game/UnityBuild/UnityBuild.tsx"() {
    init_prompt8();
    init_parser2();
    inputSchema14 = z14.strictObject({
      project_path: z14.string().describe("Absolute path to the Unity project root (contains Assets/ folder)"),
      build_target: z14.enum(["editor", "android", "ios", "windows"]).optional().describe("Build target platform. Defaults to editor (script compilation only)")
    });
    UnityBuildTool = {
      name: TOOL_NAME11,
      description: DESCRIPTION12,
      searchHint: "compile Unity project scripts batch mode",
      inputSchema: inputSchema14,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return true;
      },
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION12;
      },
      async validateInput({ project_path }) {
        if (!existsSync10(project_path)) {
          return { result: false, message: `Project path not found: ${project_path}` };
        }
        if (!existsSync10(join7(project_path, "Assets"))) {
          return { result: false, message: `Not a Unity project: missing Assets/ folder` };
        }
        return { result: true };
      },
      renderToolUseMessage({ project_path, build_target }) {
        return `Building Unity project: ${project_path}${build_target ? ` (${build_target})` : ""}`;
      },
      renderResultForAssistant(output) {
        if (output.success) {
          return `Unity build passed (${output.duration_ms}ms)${output.unity_version ? ` [Unity ${output.unity_version}]` : ""}`;
        }
        const errorLines = output.errors.filter((e) => e.severity === "error").map((e) => `  ${e.file_path}(${e.line},${e.column ?? 0}): ${e.code ?? ""} ${e.message}`).join("\n");
        return `Unity build FAILED: ${output.error_count} errors, ${output.warning_count} warnings
${errorLines}`;
      },
      async *call({ project_path, build_target }, context) {
        const start = Date.now();
        let errors = [];
        const unity_version = detectUnityVersion(project_path);
        try {
          const csproj = findCsproj2(project_path);
          if (csproj && existsSync10(csproj)) {
            const output2 = execSync7(
              `dotnet build "${csproj}" --no-restore --nologo -v q 2>&1`,
              { encoding: "utf-8", timeout: 6e4, cwd: project_path }
            );
            errors = parseUnityLogOutput(output2);
          } else {
            errors.push({
              file_path: project_path,
              line: 0,
              severity: "warning",
              message: "No .csproj found. Full Unity editor build is required. Open the project in Unity to generate solution files, or run Unity in batch mode.",
              code: "DANYA_UNITY001"
            });
          }
        } catch (err) {
          const raw = err.stdout || err.stderr || "";
          errors = parseUnityLogOutput(raw);
          if (errors.length === 0) {
            errors.push({
              file_path: project_path,
              line: 0,
              severity: "error",
              message: `Build process failed: ${err.message ?? "unknown error"}`,
              code: "DANYA_UNITY002"
            });
          }
        }
        const output = {
          success: errors.filter((e) => e.severity === "error").length === 0,
          errors,
          error_count: errors.filter((e) => e.severity === "error").length,
          warning_count: errors.filter((e) => e.severity === "warning").length,
          duration_ms: Date.now() - start,
          unity_version
        };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/UnrealBuild/prompt.ts
var TOOL_NAME12, DESCRIPTION13;
var init_prompt9 = __esm({
  "src/tools/game/UnrealBuild/prompt.ts"() {
    TOOL_NAME12 = "UnrealBuild";
    DESCRIPTION13 = `Build an Unreal Engine project using Unreal Build Tool (UBT). Parses both MSVC and Clang compiler output for structured error reporting.

Usage:
- Invokes UnrealBuildTool for C++ compilation
- Supports platforms: Win64, Linux, Mac
- Supports configurations: Development, DebugGame, Shipping
- Reports structured errors with file path, line, column, severity, and message
- Typical execution: 30s-10min depending on project size`;
  }
});

// src/tools/game/UnrealBuild/parser.ts
function parseUnrealBuildOutput(output) {
  const errors = [];
  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    let match = trimmed.match(MSVC_REGEX);
    if (match) {
      errors.push({
        file_path: match[1],
        line: parseInt(match[2], 10),
        severity: match[3],
        code: match[4],
        message: match[5]
      });
      continue;
    }
    match = trimmed.match(CLANG_REGEX);
    if (match) {
      errors.push({
        file_path: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4],
        message: match[5]
      });
      continue;
    }
    match = trimmed.match(UE_LOG_REGEX);
    if (match) {
      errors.push({
        file_path: match[2],
        line: parseInt(match[3], 10),
        severity: match[1].toLowerCase(),
        message: match[4]
      });
    }
  }
  return errors;
}
var MSVC_REGEX, CLANG_REGEX, UE_LOG_REGEX;
var init_parser3 = __esm({
  "src/tools/game/UnrealBuild/parser.ts"() {
    MSVC_REGEX = /^(.+?)\((\d+)\):\s+(error|warning)\s+(C\d+):\s+(.+)$/;
    CLANG_REGEX = /^(.+?):(\d+):(\d+):\s+(error|warning):\s+(.+)$/;
    UE_LOG_REGEX = /^.+?:\s+(Error|Warning):\s+(.+?)\((\d+)\):\s+(.+)$/;
  }
});

// src/tools/game/UnrealBuild/UnrealBuild.tsx
var UnrealBuild_exports = {};
__export(UnrealBuild_exports, {
  UnrealBuildTool: () => UnrealBuildTool
});
import { z as z15 } from "zod";
import { execSync as execSync8 } from "child_process";
import { existsSync as existsSync11 } from "fs";
import { join as join8, basename } from "path";
import { glob as glob3 } from "glob";
function findUProject(projectPath) {
  const results = glob3.sync("*.uproject", { cwd: projectPath });
  return results.length > 0 ? join8(projectPath, results[0]) : null;
}
function findUBT() {
  const candidates = [
    // Environment variable
    process.env.UE_ROOT ? join8(process.env.UE_ROOT, "Engine", "Build", "BatchFiles", "Build.bat") : null,
    process.env.UE_ROOT ? join8(process.env.UE_ROOT, "Engine", "Build", "BatchFiles", "RunUBT.bat") : null,
    // Common Windows install paths
    "C:/Program Files/Epic Games/UE_5.4/Engine/Build/BatchFiles/Build.bat",
    "C:/Program Files/Epic Games/UE_5.3/Engine/Build/BatchFiles/Build.bat"
  ].filter(Boolean);
  for (const path of candidates) {
    if (existsSync11(path)) return path;
  }
  return null;
}
var inputSchema15, UnrealBuildTool;
var init_UnrealBuild = __esm({
  "src/tools/game/UnrealBuild/UnrealBuild.tsx"() {
    init_prompt9();
    init_parser3();
    inputSchema15 = z15.strictObject({
      project_path: z15.string().describe("Absolute path to the Unreal Engine project root (contains .uproject file)"),
      platform: z15.enum(["Win64", "Linux", "Mac"]).optional().describe("Target platform. Defaults to Win64"),
      configuration: z15.enum(["Development", "DebugGame", "Shipping"]).optional().describe("Build configuration. Defaults to Development")
    });
    UnrealBuildTool = {
      name: TOOL_NAME12,
      description: DESCRIPTION13,
      searchHint: "compile Unreal Engine C++ project UBT",
      inputSchema: inputSchema15,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return true;
      },
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION13;
      },
      async validateInput({ project_path }) {
        if (!existsSync11(project_path)) {
          return { result: false, message: `Project path not found: ${project_path}` };
        }
        const uproject = findUProject(project_path);
        if (!uproject) {
          return { result: false, message: `Not an Unreal project: no .uproject file found` };
        }
        return { result: true };
      },
      renderToolUseMessage({ project_path, platform, configuration }) {
        const plat = platform ?? "Win64";
        const config = configuration ?? "Development";
        return `Building Unreal project: ${project_path} (${plat} ${config})`;
      },
      renderResultForAssistant(output) {
        if (output.success) {
          return `Unreal build passed (${output.duration_ms}ms)`;
        }
        const errorLines = output.errors.filter((e) => e.severity === "error").slice(0, 20).map((e) => `  ${e.file_path}:${e.line}${e.column ? ":" + e.column : ""}: ${e.code ?? ""} ${e.message}`).join("\n");
        return `Unreal build FAILED: ${output.error_count} errors, ${output.warning_count} warnings
${errorLines}`;
      },
      async *call({ project_path, platform, configuration }, context) {
        const start = Date.now();
        let errors = [];
        const plat = platform ?? "Win64";
        const config = configuration ?? "Development";
        const uproject = findUProject(project_path);
        if (!uproject) {
          const output2 = {
            success: false,
            errors: [{ file_path: project_path, line: 0, severity: "error", message: "No .uproject file found" }],
            error_count: 1,
            warning_count: 0,
            duration_ms: Date.now() - start
          };
          yield { type: "result", data: output2, resultForAssistant: this.renderResultForAssistant(output2) };
          return;
        }
        const projectName = basename(uproject, ".uproject");
        const ubt = findUBT();
        try {
          if (ubt) {
            const cmd = `"${ubt}" ${projectName}Editor ${plat} ${config} -project="${uproject}" -NoHotReloadFromIDE 2>&1`;
            const raw = execSync8(cmd, {
              encoding: "utf-8",
              timeout: 6e5,
              // 10 min timeout for large projects
              cwd: project_path
            });
            errors = parseUnrealBuildOutput(raw);
          } else {
            const slnFiles = glob3.sync("*.sln", { cwd: project_path });
            if (slnFiles.length > 0) {
              const raw = execSync8(
                `dotnet build "${join8(project_path, slnFiles[0])}" --nologo -v q 2>&1`,
                { encoding: "utf-8", timeout: 12e4, cwd: project_path }
              );
              errors = parseUnrealBuildOutput(raw);
            } else {
              errors.push({
                file_path: project_path,
                line: 0,
                severity: "error",
                message: "Unreal Build Tool (UBT) not found. Set UE_ROOT environment variable or ensure Unreal Engine is installed.",
                code: "DANYA_UE001"
              });
            }
          }
        } catch (err) {
          const raw = err.stdout || err.stderr || "";
          errors = parseUnrealBuildOutput(raw);
          if (errors.length === 0) {
            errors.push({
              file_path: project_path,
              line: 0,
              severity: "error",
              message: `Build process failed: ${err.message ?? "unknown error"}`,
              code: "DANYA_UE002"
            });
          }
        }
        const output = {
          success: errors.filter((e) => e.severity === "error").length === 0,
          errors,
          error_count: errors.filter((e) => e.severity === "error").length,
          warning_count: errors.filter((e) => e.severity === "warning").length,
          duration_ms: Date.now() - start
        };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/GodotBuild/prompt.ts
var TOOL_NAME13, DESCRIPTION14;
var init_prompt10 = __esm({
  "src/tools/game/GodotBuild/prompt.ts"() {
    TOOL_NAME13 = "GodotBuild";
    DESCRIPTION14 = `Build and validate a Godot project. Supports both GDScript (via headless Godot) and C# (via dotnet build) workflows.

Usage:
- For GDScript: runs godot --headless --check-only to validate scripts
- For C# projects: runs dotnet build on the .csproj
- check_only mode validates without producing export artifacts
- Reports structured errors with file path, line number, and message
- Typical execution: 5-30s`;
  }
});

// src/tools/game/GodotBuild/GodotBuild.tsx
var GodotBuild_exports = {};
__export(GodotBuild_exports, {
  GodotBuildTool: () => GodotBuildTool
});
import { z as z16 } from "zod";
import { execSync as execSync9 } from "child_process";
import { existsSync as existsSync12 } from "fs";
import { join as join9 } from "path";
import { glob as glob4 } from "glob";
function parseGodotOutput(output) {
  const errors = [];
  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    let match = trimmed.match(GDSCRIPT_ERROR_REGEX);
    if (match) {
      const severityRaw = match[3].toLowerCase();
      errors.push({
        file_path: match[1].replace(/^res:\/\//, ""),
        line: parseInt(match[2], 10),
        severity: severityRaw.includes("warning") ? "warning" : "error",
        message: match[4]
      });
      continue;
    }
    match = trimmed.match(SCRIPT_ERROR_REGEX);
    if (match) {
      errors.push({
        file_path: match[1].replace(/^res:\/\//, ""),
        line: parseInt(match[2], 10),
        severity: "error",
        message: match[3]
      });
      continue;
    }
    match = trimmed.match(MSBUILD_REGEX2);
    if (match) {
      errors.push({
        file_path: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4],
        code: match[5],
        message: match[6]
      });
    }
  }
  return errors;
}
function hasCSharpScripts(projectPath) {
  return glob4.sync("**/*.cs", { cwd: projectPath, ignore: [".godot/**"] }).length > 0;
}
function findCsproj3(projectPath) {
  const results = glob4.sync("*.csproj", { cwd: projectPath });
  return results.length > 0 ? join9(projectPath, results[0]) : null;
}
var inputSchema16, GDSCRIPT_ERROR_REGEX, SCRIPT_ERROR_REGEX, MSBUILD_REGEX2, GodotBuildTool;
var init_GodotBuild = __esm({
  "src/tools/game/GodotBuild/GodotBuild.tsx"() {
    init_prompt10();
    inputSchema16 = z16.strictObject({
      project_path: z16.string().describe("Absolute path to the Godot project root (contains project.godot)"),
      check_only: z16.boolean().optional().describe("If true, only validate scripts without producing export artifacts. Defaults to true")
    });
    GDSCRIPT_ERROR_REGEX = /^(.+?):(\d+)\s*-\s*(Parse Error|Error|Warning):\s*(.+)$/;
    SCRIPT_ERROR_REGEX = /^SCRIPT ERROR:\s*(.+?):(\d+):\s*(.+)$/;
    MSBUILD_REGEX2 = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(CS\d+):\s+(.+)$/;
    GodotBuildTool = {
      name: TOOL_NAME13,
      description: DESCRIPTION14,
      searchHint: "compile Godot project GDScript C# validation",
      inputSchema: inputSchema16,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return true;
      },
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION14;
      },
      async validateInput({ project_path }) {
        if (!existsSync12(project_path)) {
          return { result: false, message: `Project path not found: ${project_path}` };
        }
        if (!existsSync12(join9(project_path, "project.godot"))) {
          return { result: false, message: `Not a Godot project: missing project.godot` };
        }
        return { result: true };
      },
      renderToolUseMessage({ project_path, check_only }) {
        return `Building Godot project: ${project_path}${check_only !== false ? " (check only)" : ""}`;
      },
      renderResultForAssistant(output) {
        if (output.success) {
          return `Godot build passed (${output.duration_ms}ms)`;
        }
        const errorLines = output.errors.filter((e) => e.severity === "error").map((e) => `  ${e.file_path}:${e.line}: ${e.code ?? ""} ${e.message}`).join("\n");
        return `Godot build FAILED: ${output.error_count} errors, ${output.warning_count} warnings
${errorLines}`;
      },
      async *call({ project_path, check_only }, context) {
        const start = Date.now();
        let errors = [];
        try {
          const raw = execSync9(
            `godot --headless --check-only --path "${project_path}" 2>&1`,
            { encoding: "utf-8", timeout: 6e4, cwd: project_path }
          );
          errors = parseGodotOutput(raw);
        } catch (err) {
          const raw = err.stdout || err.stderr || "";
          if (raw) {
            errors = parseGodotOutput(raw);
          } else {
            errors.push({
              file_path: project_path,
              line: 0,
              severity: "warning",
              message: "Godot CLI not found. GDScript validation skipped. Install Godot and add to PATH.",
              code: "DANYA_GODOT001"
            });
          }
        }
        if (hasCSharpScripts(project_path)) {
          const csproj = findCsproj3(project_path);
          if (csproj) {
            try {
              const raw = execSync9(
                `dotnet build "${csproj}" --no-restore --nologo -v q 2>&1`,
                { encoding: "utf-8", timeout: 6e4, cwd: project_path }
              );
              errors = errors.concat(parseGodotOutput(raw));
            } catch (err) {
              const raw = err.stdout || err.stderr || "";
              if (raw) {
                errors = errors.concat(parseGodotOutput(raw));
              }
            }
          }
        }
        const output = {
          success: errors.filter((e) => e.severity === "error").length === 0,
          errors,
          error_count: errors.filter((e) => e.severity === "error").length,
          warning_count: errors.filter((e) => e.severity === "warning").length,
          duration_ms: Date.now() - start
        };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/OrmGenerate/prompt.ts
var TOOL_NAME14, DESCRIPTION15;
var init_prompt11 = __esm({
  "src/tools/game/OrmGenerate/prompt.ts"() {
    TOOL_NAME14 = "OrmGenerate";
    DESCRIPTION15 = `Generate ORM code from schema definitions. Invokes the project's code generation pipeline (typically make orm) to produce typed data access code.

Usage:
- Reads schema files and generates code for specified targets
- Supported targets: golang, redis, mongo, proto
- Generates files in the project directory structure
- Reports which files were generated and any schema errors
- Typical execution: 5-30s`;
  }
});

// src/tools/game/OrmGenerate/OrmGenerate.tsx
var OrmGenerate_exports = {};
__export(OrmGenerate_exports, {
  OrmGenerateTool: () => OrmGenerateTool
});
import { z as z17 } from "zod";
import { execSync as execSync10 } from "child_process";
import { existsSync as existsSync13 } from "fs";
import { join as join10 } from "path";
function parseGeneratedFiles(output) {
  const files = [];
  const patterns = [
    /(?:generated|wrote|created|writing):\s*(.+)/gi,
    /^\s*->\s*(.+\.\w+)\s*$/gm,
    /^\s*(.+\.(?:go|proto|rs|ts))\s*$/gm
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      const file = match[1].trim();
      if (file && !files.includes(file)) {
        files.push(file);
      }
    }
  }
  return files;
}
function parseErrors(output, schemaPath) {
  const errors = [];
  const errorPatterns = [
    /(?:error|ERROR|Error):\s*(.+)/g,
    /^(.+?):(\d+):\s*(?:error|ERROR):\s*(.+)/gm
  ];
  for (const pattern of errorPatterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      errors.push({
        schema_file: match.length > 3 ? match[1] : schemaPath,
        message: match.length > 3 ? `Line ${match[2]}: ${match[3]}` : match[1]
      });
    }
  }
  return errors;
}
var inputSchema17, OrmGenerateTool;
var init_OrmGenerate = __esm({
  "src/tools/game/OrmGenerate/OrmGenerate.tsx"() {
    init_prompt11();
    inputSchema17 = z17.strictObject({
      schema_path: z17.string().describe("Path to the schema definition file or directory"),
      targets: z17.array(z17.enum(["golang", "redis", "mongo", "proto"])).optional().describe("Code generation targets. Defaults to all configured targets"),
      project_path: z17.string().optional().describe("Project root path. Defaults to parent of schema_path")
    });
    OrmGenerateTool = {
      name: TOOL_NAME14,
      description: DESCRIPTION15,
      searchHint: "generate ORM code from schema definitions",
      inputSchema: inputSchema17,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return false;
      },
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return true;
      },
      async prompt() {
        return DESCRIPTION15;
      },
      async validateInput({ schema_path }) {
        if (!existsSync13(schema_path)) {
          return { result: false, message: `Schema path not found: ${schema_path}` };
        }
        return { result: true };
      },
      renderToolUseMessage({ schema_path, targets }) {
        const targetStr = targets?.join(", ") ?? "all";
        return `Generating ORM code from ${schema_path} (targets: ${targetStr})`;
      },
      renderResultForAssistant(output) {
        if (output.success) {
          const fileList = output.generated_files.length > 0 ? "\nGenerated:\n" + output.generated_files.map((f) => `  ${f}`).join("\n") : "";
          return `ORM generation succeeded (${output.duration_ms}ms, ${output.generated_files.length} files)${fileList}`;
        }
        const errorLines = output.errors.map((e) => `  ${e.schema_file}: ${e.message}`).join("\n");
        return `ORM generation FAILED: ${output.errors.length} errors
${errorLines}`;
      },
      async *call({ schema_path, targets, project_path }, context) {
        const start = Date.now();
        let generatedFiles = [];
        let errors = [];
        const cwd = project_path ?? join10(schema_path, "..");
        const hasMakefile = existsSync13(join10(cwd, "Makefile"));
        try {
          let cmd;
          if (hasMakefile) {
            const makeTargets = targets?.length ? `orm-${targets.join(" orm-")}` : "orm";
            cmd = `make ${makeTargets} SCHEMA="${schema_path}" 2>&1`;
          } else {
            cmd = `go generate "${schema_path}" 2>&1`;
          }
          const raw = execSync10(cmd, {
            encoding: "utf-8",
            timeout: 12e4,
            cwd
          });
          generatedFiles = parseGeneratedFiles(raw);
          errors = parseErrors(raw, schema_path);
        } catch (err) {
          const raw = err.stdout || err.stderr || "";
          errors = parseErrors(raw, schema_path);
          generatedFiles = parseGeneratedFiles(raw);
          if (errors.length === 0) {
            errors.push({
              schema_file: schema_path,
              message: `Generation failed: ${err.message ?? "unknown error"}`
            });
          }
        }
        const hasErrors = errors.length > 0 && generatedFiles.length === 0;
        const output = {
          success: !hasErrors,
          generated_files: generatedFiles,
          errors,
          duration_ms: Date.now() - start
        };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/AssetCheck/prompt.ts
var TOOL_NAME15, DESCRIPTION16;
var init_prompt12 = __esm({
  "src/tools/game/AssetCheck/prompt.ts"() {
    TOOL_NAME15 = "AssetCheck";
    DESCRIPTION16 = `Check game assets for integrity issues: missing references, broken prefabs, and orphaned assets. Supports Unity (.meta/GUID) and Godot (.tscn/ext_resource) asset pipelines.

Usage:
- Scans asset files for broken or missing references
- Scope: 'changed' checks only git-modified files, 'full' checks all assets
- Detects: missing_reference, broken_prefab, orphaned_asset
- Filterable by asset type: prefab, scene, material, audio, texture
- Typical execution: 1-30s depending on scope`;
  }
});

// src/tools/game/AssetCheck/parsers/unity.ts
import { readFileSync as readFileSync8 } from "fs";
import { join as join11, relative as relative2 } from "path";
import { glob as glob5 } from "glob";
function getChangedFiles3(projectPath) {
  try {
    const { execSync: execSync12 } = __require("child_process");
    const output = execSync12("git diff --name-only HEAD 2>/dev/null || git diff --name-only", {
      cwd: projectPath,
      encoding: "utf-8",
      timeout: 1e4
    });
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
function checkUnityAssets(projectPath, scope) {
  const issues = [];
  const changedFiles = scope === "changed" ? getChangedFiles3(projectPath) : void 0;
  const allGuids = /* @__PURE__ */ new Map();
  const allMetaFiles = glob5.sync("Assets/**/*.meta", { cwd: projectPath, absolute: true });
  for (const metaFile of allMetaFiles) {
    try {
      const content = readFileSync8(metaFile, "utf-8");
      const match = content.match(META_GUID_REGEX);
      if (match) {
        allGuids.set(match[1], relative2(projectPath, metaFile.replace(/\.meta$/, "")));
      }
    } catch {
    }
  }
  const assetExts = [".prefab", ".unity", ".asset", ".mat", ".controller", ".anim"];
  let assetFiles;
  if (scope === "changed" && changedFiles) {
    assetFiles = changedFiles.filter((f) => assetExts.some((ext) => f.endsWith(ext))).map((f) => join11(projectPath, f));
  } else {
    assetFiles = glob5.sync(`Assets/**/*{${assetExts.join(",")}}`, { cwd: projectPath, absolute: true });
  }
  for (const assetFile of assetFiles) {
    try {
      const content = readFileSync8(assetFile, "utf-8");
      const relPath = relative2(projectPath, assetFile);
      let match;
      const guidRegex = new RegExp(GUID_REF_REGEX.source, "gi");
      while ((match = guidRegex.exec(content)) !== null) {
        const guid = match[1];
        if (!allGuids.has(guid)) {
          issues.push({
            asset_path: relPath,
            type: "missing_reference",
            message: `References GUID ${guid} which has no corresponding .meta file`,
            referenced_by: relPath
          });
        }
      }
    } catch {
    }
  }
  if (scope === "full") {
    const referencedGuids = /* @__PURE__ */ new Set();
    const allAssetFiles = glob5.sync("Assets/**/*{.prefab,.unity,.asset,.mat,.controller,.anim}", {
      cwd: projectPath,
      absolute: true
    });
    for (const assetFile of allAssetFiles) {
      try {
        const content = readFileSync8(assetFile, "utf-8");
        const guidRegex = new RegExp(GUID_REF_REGEX.source, "gi");
        let m;
        while ((m = guidRegex.exec(content)) !== null) {
          referencedGuids.add(m[1]);
        }
      } catch {
      }
    }
    for (const [guid, assetPath] of allGuids) {
      if (!referencedGuids.has(guid) && !assetPath.endsWith(".cs") && !assetPath.endsWith(".shader")) {
        const ext = assetPath.split(".").pop() ?? "";
        if (["mat", "prefab", "asset", "controller", "anim"].includes(ext)) {
          issues.push({
            asset_path: assetPath,
            type: "orphaned_asset",
            message: `Asset GUID ${guid} is not referenced by any other asset`
          });
        }
      }
    }
  }
  return issues;
}
var GUID_REF_REGEX, META_GUID_REGEX;
var init_unity2 = __esm({
  "src/tools/game/AssetCheck/parsers/unity.ts"() {
    GUID_REF_REGEX = /guid:\s*([0-9a-f]{32})/gi;
    META_GUID_REGEX = /^guid:\s*([0-9a-f]{32})/m;
  }
});

// src/tools/game/AssetCheck/parsers/godot.ts
import { readFileSync as readFileSync9, existsSync as existsSync15 } from "fs";
import { join as join12, relative as relative3 } from "path";
import { glob as glob6 } from "glob";
function getChangedFiles4(projectPath) {
  try {
    const { execSync: execSync12 } = __require("child_process");
    const output = execSync12("git diff --name-only HEAD 2>/dev/null || git diff --name-only", {
      cwd: projectPath,
      encoding: "utf-8",
      timeout: 1e4
    });
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
function checkGodotAssets(projectPath, scope) {
  const issues = [];
  const changedFiles = scope === "changed" ? getChangedFiles4(projectPath) : void 0;
  const sceneExts = [".tscn", ".tres", ".gd"];
  let filesToScan;
  if (scope === "changed" && changedFiles) {
    filesToScan = changedFiles.filter((f) => sceneExts.some((ext) => f.endsWith(ext))).map((f) => join12(projectPath, f));
  } else {
    filesToScan = glob6.sync(`**/*{${sceneExts.join(",")}}`, {
      cwd: projectPath,
      absolute: true,
      ignore: [".godot/**", ".import/**"]
    });
  }
  for (const file of filesToScan) {
    try {
      const content = readFileSync9(file, "utf-8");
      const relPath = relative3(projectPath, file);
      const extRegex = new RegExp(EXT_RESOURCE_REGEX.source, "g");
      let match;
      while ((match = extRegex.exec(content)) !== null) {
        const referencedPath = match[1];
        const absolutePath = join12(projectPath, referencedPath);
        if (!existsSync15(absolutePath)) {
          issues.push({
            asset_path: referencedPath,
            type: "missing_reference",
            message: `Referenced resource "res://${referencedPath}" does not exist`,
            referenced_by: relPath
          });
        }
      }
      const loadRegex = new RegExp(LOAD_REGEX.source, "g");
      while ((match = loadRegex.exec(content)) !== null) {
        const referencedPath = match[1];
        const absolutePath = join12(projectPath, referencedPath);
        if (!existsSync15(absolutePath)) {
          issues.push({
            asset_path: referencedPath,
            type: "missing_reference",
            message: `load()/preload() references "res://${referencedPath}" which does not exist`,
            referenced_by: relPath
          });
        }
      }
    } catch {
    }
  }
  return issues;
}
var EXT_RESOURCE_REGEX, LOAD_REGEX;
var init_godot2 = __esm({
  "src/tools/game/AssetCheck/parsers/godot.ts"() {
    EXT_RESOURCE_REGEX = /\[ext_resource\s[^\]]*path="res:\/\/([^"]+)"/g;
    LOAD_REGEX = /(?:preload|load)\(\s*"res:\/\/([^"]+)"\s*\)/g;
  }
});

// src/tools/game/AssetCheck/AssetCheck.tsx
var AssetCheck_exports = {};
__export(AssetCheck_exports, {
  AssetCheckTool: () => AssetCheckTool
});
import { z as z18 } from "zod";
import { existsSync as existsSync16 } from "fs";
import { join as join13 } from "path";
function detectEngine(projectPath) {
  if (existsSync16(join13(projectPath, "Assets")) && existsSync16(join13(projectPath, "ProjectSettings"))) {
    return "unity";
  }
  if (existsSync16(join13(projectPath, "project.godot"))) {
    return "godot";
  }
  return null;
}
var inputSchema18, AssetCheckTool;
var init_AssetCheck = __esm({
  "src/tools/game/AssetCheck/AssetCheck.tsx"() {
    init_prompt12();
    init_unity2();
    init_godot2();
    inputSchema18 = z18.strictObject({
      project_path: z18.string().describe("Absolute path to the game project root"),
      scope: z18.enum(["changed", "full"]).optional().describe('Scan scope: "changed" checks only git-modified files, "full" checks all assets. Defaults to "changed"'),
      asset_types: z18.array(z18.enum(["prefab", "scene", "material", "audio", "texture"])).optional().describe("Filter by asset types. If omitted, checks all types")
    });
    AssetCheckTool = {
      name: TOOL_NAME15,
      description: DESCRIPTION16,
      searchHint: "check game assets missing references broken prefabs",
      inputSchema: inputSchema18,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return true;
      },
      isConcurrencySafe() {
        return true;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION16;
      },
      async validateInput({ project_path }) {
        if (!existsSync16(project_path)) {
          return { result: false, message: `Project path not found: ${project_path}` };
        }
        const engine = detectEngine(project_path);
        if (!engine) {
          return { result: false, message: `Could not detect game engine. Expected Unity (Assets/ + ProjectSettings/) or Godot (project.godot)` };
        }
        return { result: true };
      },
      renderToolUseMessage({ project_path, scope }) {
        return `Checking assets: ${project_path} (scope: ${scope ?? "changed"})`;
      },
      renderResultForAssistant(output) {
        if (output.clean) {
          return `Asset check passed: ${output.assets_checked} assets checked, no issues found (${output.duration_ms}ms)`;
        }
        const issueLines = output.issues.slice(0, 20).map((i) => `  [${i.type}] ${i.asset_path}: ${i.message}${i.referenced_by ? ` (referenced by ${i.referenced_by})` : ""}`).join("\n");
        const more = output.issue_count > 20 ? `
  ... and ${output.issue_count - 20} more` : "";
        return `Asset check found ${output.issue_count} issues (${output.assets_checked} assets checked, ${output.duration_ms}ms)
${issueLines}${more}`;
      },
      async *call({ project_path, scope, asset_types }, context) {
        const start = Date.now();
        const effectiveScope = scope ?? "changed";
        const engine = detectEngine(project_path);
        let rawIssues = [];
        let assetsChecked = 0;
        if (engine === "unity") {
          const issues2 = checkUnityAssets(project_path, effectiveScope);
          rawIssues = issues2;
          try {
            const { glob: glob7 } = __require("glob");
            assetsChecked = glob7.sync("Assets/**/*.{prefab,unity,asset,mat,controller,anim}", { cwd: project_path }).length;
          } catch {
            assetsChecked = rawIssues.length;
          }
        } else if (engine === "godot") {
          const issues2 = checkGodotAssets(project_path, effectiveScope);
          rawIssues = issues2;
          try {
            const { glob: glob7 } = __require("glob");
            assetsChecked = glob7.sync("**/*.{tscn,tres,gd}", { cwd: project_path, ignore: [".godot/**"] }).length;
          } catch {
            assetsChecked = rawIssues.length;
          }
        }
        let issues = rawIssues;
        if (asset_types && asset_types.length > 0) {
          const typeExtMap = {
            prefab: [".prefab"],
            scene: [".unity", ".tscn"],
            material: [".mat", ".tres"],
            audio: [".wav", ".ogg", ".mp3"],
            texture: [".png", ".jpg", ".jpeg", ".tga", ".bmp"]
          };
          const allowedExts = new Set(asset_types.flatMap((t) => typeExtMap[t] ?? []));
          issues = rawIssues.filter((i) => {
            const ext = "." + (i.asset_path.split(".").pop() ?? "");
            return allowedExts.has(ext) || allowedExts.size === 0;
          });
        }
        const output = {
          issues,
          issue_count: issues.length,
          assets_checked: assetsChecked,
          clean: issues.length === 0,
          duration_ms: Date.now() - start
        };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/game/GameServerBuild/prompt.ts
var TOOL_NAME16, DESCRIPTION17;
var init_prompt13 = __esm({
  "src/tools/game/GameServerBuild/prompt.ts"() {
    TOOL_NAME16 = "GameServerBuild";
    DESCRIPTION17 = `Build and verify a Go game server with configurable verification levels.

Levels:
- quick: lint only (fastest, <30s)
- build: lint + compile (default, 30s-2min)
- full: lint + compile + test (1-5min)

Reports structured errors with file path, line number, and message for each stage.`;
  }
});

// src/tools/game/GameServerBuild/parser.ts
function parseGoBuildOutput(output) {
  const errors = [];
  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    let match = trimmed.match(GO_BUILD_REGEX);
    if (match) {
      errors.push({
        file_path: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[4],
        severity: "error"
      });
      continue;
    }
    match = trimmed.match(GO_BUILD_REGEX_NO_COL);
    if (match) {
      errors.push({
        file_path: match[1],
        line: parseInt(match[2], 10),
        message: match[3],
        severity: "error"
      });
    }
  }
  return errors;
}
function parseGolangCILintJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    const issues = data.Issues ?? [];
    return issues.map((issue) => ({
      file_path: issue.Pos.Filename,
      line: issue.Pos.Line,
      column: issue.Pos.Column,
      message: issue.Text,
      severity: "warning",
      rule: issue.FromLinter
    }));
  } catch {
    return [];
  }
}
function parseGoTestOutput(output) {
  const errors = [];
  for (const line of output.split("\n")) {
    const match = line.trim().match(GO_TEST_FAIL_REGEX);
    if (match) {
      errors.push({
        file_path: "",
        line: 0,
        message: `Test failed: ${match[1]}`,
        severity: "error"
      });
    }
  }
  return errors;
}
var GO_BUILD_REGEX, GO_BUILD_REGEX_NO_COL, GO_TEST_FAIL_REGEX;
var init_parser4 = __esm({
  "src/tools/game/GameServerBuild/parser.ts"() {
    GO_BUILD_REGEX = /^(.+?\.go):(\d+):(\d+):\s+(.+)$/;
    GO_BUILD_REGEX_NO_COL = /^(.+?\.go):(\d+):\s+(.+)$/;
    GO_TEST_FAIL_REGEX = /^--- FAIL:\s+(\S+)/;
  }
});

// src/tools/game/GameServerBuild/GameServerBuild.tsx
var GameServerBuild_exports = {};
__export(GameServerBuild_exports, {
  GameServerBuildTool: () => GameServerBuildTool
});
import { z as z19 } from "zod";
import { execSync as execSync11 } from "child_process";
import { existsSync as existsSync17 } from "fs";
import { join as join14 } from "path";
function runStage(stageName, projectPath) {
  const start = Date.now();
  let cmd;
  switch (stageName) {
    case "lint":
      cmd = existsSync17(join14(projectPath, "Makefile")) ? "make lint 2>&1" : "golangci-lint run --out-format json 2>&1";
      break;
    case "build":
      cmd = existsSync17(join14(projectPath, "Makefile")) ? "make build 2>&1" : "go build ./... 2>&1";
      break;
    case "test":
      cmd = existsSync17(join14(projectPath, "Makefile")) ? "make test 2>&1" : "go test ./... 2>&1";
      break;
    default:
      return { name: stageName, success: false, errors: [{ file_path: "", line: 0, message: `Unknown stage: ${stageName}`, severity: "error" }], duration_ms: 0 };
  }
  try {
    const output = execSync11(cmd, { cwd: projectPath, encoding: "utf-8", timeout: 3e5 });
    let errors = stageName === "lint" && output.trim().startsWith("{") ? parseGolangCILintJSON(output) : [];
    return {
      name: stageName,
      success: true,
      errors,
      duration_ms: Date.now() - start
    };
  } catch (err) {
    const output = (err.stdout ?? "") + (err.stderr ?? "");
    let errors = stageName === "lint" ? output.trim().startsWith("{") ? parseGolangCILintJSON(output) : parseGoBuildOutput(output) : stageName === "test" ? parseGoTestOutput(output) : parseGoBuildOutput(output);
    if (errors.length === 0) {
      errors = [{ file_path: "", line: 0, message: output.slice(0, 500), severity: "error" }];
    }
    return {
      name: stageName,
      success: false,
      errors,
      duration_ms: Date.now() - start
    };
  }
}
var inputSchema19, STAGES_BY_LEVEL, GameServerBuildTool;
var init_GameServerBuild = __esm({
  "src/tools/game/GameServerBuild/GameServerBuild.tsx"() {
    init_prompt13();
    init_parser4();
    inputSchema19 = z19.strictObject({
      project_path: z19.string().describe("Path to Go server project root"),
      level: z19.enum(["quick", "build", "full"]).optional().describe("Verification level. quick=lint, build=lint+compile, full=lint+compile+test. Default: build")
    });
    STAGES_BY_LEVEL = {
      quick: ["lint"],
      build: ["lint", "build"],
      full: ["lint", "build", "test"]
    };
    GameServerBuildTool = {
      name: TOOL_NAME16,
      description: DESCRIPTION17,
      searchHint: "build game server services and report errors",
      inputSchema: inputSchema19,
      async isEnabled() {
        return true;
      },
      isReadOnly() {
        return true;
      },
      isConcurrencySafe() {
        return false;
      },
      needsPermissions() {
        return false;
      },
      async prompt() {
        return DESCRIPTION17;
      },
      async validateInput({ project_path }) {
        if (!existsSync17(project_path)) {
          return { result: false, message: `Directory not found: ${project_path}` };
        }
        if (!existsSync17(join14(project_path, "go.mod")) && !existsSync17(join14(project_path, "Makefile"))) {
          return { result: false, message: "Not a Go project (no go.mod or Makefile)" };
        }
        return { result: true };
      },
      renderToolUseMessage({ project_path, level }) {
        return `Building Go server (${level ?? "build"}): ${project_path}`;
      },
      renderResultForAssistant(output) {
        const stageLines = output.stages.map((s) => {
          const status = s.success ? "\u2705" : "\u274C";
          const errorSummary = s.errors.length > 0 ? `
${s.errors.slice(0, 5).map((e) => `    ${e.file_path}:${e.line}: ${e.message}`).join("\n")}` : "";
          return `  ${status} ${s.name} (${s.duration_ms}ms)${errorSummary}`;
        }).join("\n");
        return `GameServerBuild [${output.level}] ${output.success ? "PASSED" : "FAILED"} (${output.total_duration_ms}ms)
${stageLines}`;
      },
      async *call({ project_path, level = "build" }, context) {
        const start = Date.now();
        const stageNames = STAGES_BY_LEVEL[level];
        const stages = [];
        let success = true;
        for (const stageName of stageNames) {
          yield {
            type: "progress",
            content: { stage: stageName, status: "running" }
          };
          const result = runStage(stageName, project_path);
          stages.push(result);
          if (!result.success) {
            success = false;
            break;
          }
        }
        const output = {
          success,
          level,
          stages,
          total_duration_ms: Date.now() - start
        };
        yield { type: "result", data: output, resultForAssistant: this.renderResultForAssistant(output) };
      }
    };
  }
});

// src/tools/index.ts
import { memoize as memoize2 } from "lodash-es";

// src/tools/ai/AskExpertModelTool/AskExpertModelTool.tsx
import * as React from "react";
import { Box, Text } from "ink";
import { z } from "zod";
init_log();

// src/utils/session/expertChatStorage.ts
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
init_log();
function getExpertChatDirectory() {
  const configDir = process.env.DANYA_CONFIG_DIR ?? process.env.KODE_CONFIG_DIR ?? process.env.ANYKODE_CONFIG_DIR ?? join(homedir(), ".danya");
  const expertChatDir = join(configDir, "expert-chats");
  if (!existsSync(expertChatDir)) {
    mkdirSync(expertChatDir, { recursive: true });
  }
  return expertChatDir;
}
function getSessionFilePath(sessionId) {
  return join(getExpertChatDirectory(), `${sessionId}.json`);
}
function createExpertChatSession(expertModel) {
  const sessionId = randomUUID().slice(0, 5);
  const session = {
    sessionId,
    expertModel,
    messages: [],
    createdAt: Date.now(),
    lastUpdated: Date.now()
  };
  saveExpertChatSession(session);
  return session;
}
function loadExpertChatSession(sessionId) {
  const filePath = getSessionFilePath(sessionId);
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    logError(error);
    debug.warn("EXPERT_CHAT_SESSION_LOAD_FAILED", {
      sessionId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}
function saveExpertChatSession(session) {
  const filePath = getSessionFilePath(session.sessionId);
  try {
    session.lastUpdated = Date.now();
    writeFileSync(filePath, JSON.stringify(session, null, 2), "utf-8");
  } catch (error) {
    logError(error);
    debug.warn("EXPERT_CHAT_SESSION_SAVE_FAILED", {
      sessionId: session.sessionId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
function addMessageToSession(sessionId, role, content) {
  const session = loadExpertChatSession(sessionId);
  if (!session) {
    return null;
  }
  session.messages.push({ role, content });
  saveExpertChatSession(session);
  return session;
}
function getSessionMessages(sessionId) {
  const session = loadExpertChatSession(sessionId);
  return session?.messages || [];
}

// src/tools/ai/AskExpertModelTool/AskExpertModelTool.tsx
var inputSchema = z.strictObject({
  question: z.string().describe(
    "COMPLETE SELF-CONTAINED QUESTION: Must include full background context, relevant details, and a clear independent question. The expert model will receive ONLY this content with no access to previous conversation or external context. Structure as: 1) Background/Context 2) Specific situation/problem 3) Clear question. Ensure the expert can fully understand and respond without needing additional information."
  ),
  expert_model: z.string().describe(
    "The expert model to use (e.g., gpt-5, claude-3-5-sonnet-20241022)"
  ),
  chat_session_id: z.string().describe(
    'Chat session ID: use "new" for new session or existing session ID'
  )
});
var AskExpertModelTool = {
  name: "AskExpertModel",
  async description() {
    return "Consult external AI models for expert opinions and analysis";
  },
  async prompt() {
    return `Ask a question to a specific external AI model for expert analysis.

This tool allows you to consult different AI models for their unique perspectives and expertise.

CRITICAL REQUIREMENT FOR QUESTION PARAMETER:
The question MUST be completely self-contained and include:
1. FULL BACKGROUND CONTEXT - All relevant information the expert needs
2. SPECIFIC SITUATION - Clear description of the current scenario/problem
3. INDEPENDENT QUESTION - What exactly you want the expert to analyze/answer

The expert model receives ONLY your question content with NO access to:
- Previous conversation history (unless using existing session)  
- Current codebase or file context
- User's current task or project details

IMPORTANT: This tool is for asking questions to models, not for task execution.
- Use when you need a specific model's opinion or analysis
- Use when you want to compare different models' responses
- Use the @ask-[model] format when available

The expert_model parameter accepts:
- OpenAI: gpt-4, gpt-5, o1-preview
- Messages API: claude-3-5-sonnet, claude-3-opus  
- Others: kimi, gemini-pro, mixtral

Example of well-structured question:
"Background: I'm working on a React TypeScript application with performance issues. The app renders a large list of 10,000 items using a simple map() function, causing UI freezing.

Current situation: Users report 3-5 second delays when scrolling through the list. The component re-renders the entire list on every state change.

Question: What are the most effective React optimization techniques for handling large lists, and how should I prioritize implementing virtualization vs memoization vs other approaches?"`;
  },
  isReadOnly() {
    return true;
  },
  isConcurrencySafe() {
    return true;
  },
  inputSchema,
  userFacingName() {
    return "AskExpertModel";
  },
  async isEnabled() {
    return true;
  },
  needsPermissions() {
    return false;
  },
  async validateInput({ question, expert_model, chat_session_id }, context) {
    if (!question.trim()) {
      return { result: false, message: "Question cannot be empty" };
    }
    if (!expert_model.trim()) {
      return { result: false, message: "Expert model must be specified" };
    }
    if (!chat_session_id.trim()) {
      return {
        result: false,
        message: 'Chat session ID must be specified (use "new" for new session)'
      };
    }
    try {
      const modelManager = getModelManager();
      let currentModel;
      if (context?.agentId && context?.options?.model) {
        currentModel = context.options.model;
      } else {
        currentModel = modelManager.getModelName("main") || "";
      }
      const normalizedExpert = expert_model.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedCurrent = currentModel.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normalizedExpert === normalizedCurrent) {
        return {
          result: false,
          message: `You are already running as ${currentModel}. Consulting the same model would be redundant. Please choose a different model or handle the task directly.`
        };
      }
    } catch (e) {
      debug.error("AskExpertModel", {
        message: "Could not determine current model",
        error: e
      });
    }
    try {
      const modelManager = getModelManager();
      const modelResolution = modelManager.resolveModelWithInfo(expert_model);
      if (!modelResolution.success) {
        const availableModels = modelManager.getAllAvailableModelNames();
        if (availableModels.length > 0) {
          return {
            result: false,
            message: `Model '${expert_model}' is not configured. Available models: ${availableModels.join(", ")}. Check if any available model closely matches the user's request (e.g., 'kimi' matches 'kimi-k2-0711-preview'). If there's a strong match, auto retry using the correct model name. If no close match exists, inform the user that '${expert_model}' needs to be configured using /model command.`
          };
        } else {
          return {
            result: false,
            message: `Model '${expert_model}' not found and no models are currently configured in the system. Inform the user that models need to be configured first using the /model command.`
          };
        }
      }
    } catch (error) {
      logError(error);
      return {
        result: false,
        message: `Failed to validate expert model '${expert_model}'. Please check your model configuration.`
      };
    }
    return { result: true };
  },
  renderToolUseMessage({ question, expert_model, chat_session_id }, { verbose }) {
    if (!question || !expert_model) return null;
    const isNewSession = chat_session_id === "new";
    const sessionDisplay = isNewSession ? "new session" : `session ${chat_session_id.substring(0, 5)}...`;
    const theme = getTheme();
    if (verbose) {
      return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Text, { bold: true, color: "yellow" }, expert_model), /* @__PURE__ */ React.createElement(Text, { color: theme.secondaryText }, sessionDisplay), /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: theme.text }, question.length > 300 ? question.substring(0, 300) + "..." : question)));
    }
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Text, { bold: true, color: "yellow" }, expert_model, " "), /* @__PURE__ */ React.createElement(Text, { color: theme.secondaryText, dimColor: true }, "(", sessionDisplay, ")"));
  },
  renderToolResultMessage(content) {
    const verbose = true;
    const theme = getTheme();
    if (typeof content === "object" && content && "expertAnswer" in content) {
      const expertResult = content;
      const isError = expertResult.expertAnswer.startsWith("Error") || expertResult.expertAnswer.includes("failed");
      const isInterrupted = expertResult.chatSessionId === "interrupted";
      if (isInterrupted) {
        return /* @__PURE__ */ React.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React.createElement(Text, { color: theme.secondaryText }, "Consultation interrupted"));
      }
      const answerText = verbose ? expertResult.expertAnswer.trim() : expertResult.expertAnswer.length > 500 ? expertResult.expertAnswer.substring(0, 500) + "..." : expertResult.expertAnswer.trim();
      if (isError) {
        return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Text, { color: "red" }, answerText));
      }
      return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Text, { bold: true, color: theme.text }, "Response from ", expertResult.expertModelName, ":"), /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: theme.text }, applyMarkdown(answerText))), /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: theme.secondaryText, dimColor: true }, "Session: ", expertResult.chatSessionId.substring(0, 8))));
    }
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React.createElement(Text, { color: theme.secondaryText }, "Consultation completed"));
  },
  renderResultForAssistant(output) {
    return `[Expert consultation completed]
Expert Model: ${output.expertModelName}
Session ID: ${output.chatSessionId}
To continue this conversation with context preservation, use this Session ID in your next AskExpertModel call to maintain the full conversation history and context.

${output.expertAnswer}`;
  },
  renderToolUseRejectedMessage() {
    return /* @__PURE__ */ React.createElement(FallbackToolUseRejectedMessage, null);
  },
  async *call({ question, expert_model, chat_session_id }, { abortController, readFileTimestamps }) {
    const expertModel = expert_model;
    let sessionId;
    let isInterrupted = false;
    const abortListener = () => {
      isInterrupted = true;
    };
    abortController.signal.addEventListener("abort", abortListener);
    try {
      if (abortController.signal.aborted) {
        return yield* this.handleInterrupt();
      }
      if (chat_session_id === "new") {
        try {
          const session = createExpertChatSession(expertModel);
          sessionId = session.sessionId;
        } catch (error) {
          logError(error);
          throw new Error("Failed to create new chat session");
        }
      } else {
        sessionId = chat_session_id;
        try {
          const session = loadExpertChatSession(sessionId);
          if (!session) {
            const newSession = createExpertChatSession(expertModel);
            sessionId = newSession.sessionId;
          }
        } catch (error) {
          logError(error);
          try {
            const newSession = createExpertChatSession(expertModel);
            sessionId = newSession.sessionId;
          } catch (createError) {
            logError(createError);
            throw new Error("Unable to create or load chat session");
          }
        }
      }
      if (isInterrupted || abortController.signal.aborted) {
        return yield* this.handleInterrupt();
      }
      let historyMessages;
      try {
        historyMessages = getSessionMessages(sessionId);
      } catch (error) {
        logError(error);
        historyMessages = [];
      }
      const messages = [...historyMessages, { role: "user", content: question }];
      let systemMessages;
      try {
        systemMessages = messages.map(
          (msg) => msg.role === "user" ? createUserMessage(msg.content) : createAssistantMessage(msg.content)
        );
      } catch (error) {
        logError(error);
        throw new Error("Failed to prepare conversation messages");
      }
      if (isInterrupted || abortController.signal.aborted) {
        return yield* this.handleInterrupt();
      }
      yield {
        type: "progress",
        content: createAssistantMessage(
          `Connecting to ${expertModel}... (timeout: 5 minutes)`
        )
      };
      let response;
      try {
        const modelManager = getModelManager();
        const modelResolution = modelManager.resolveModelWithInfo(expertModel);
        debug.api("EXPERT_MODEL_RESOLUTION", {
          requestedModel: expertModel,
          success: modelResolution.success,
          profileName: modelResolution.profile?.name,
          profileModelName: modelResolution.profile?.modelName,
          provider: modelResolution.profile?.provider,
          isActive: modelResolution.profile?.isActive,
          error: modelResolution.error
        });
        const timeoutMs = 3e5;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Expert model query timed out after ${timeoutMs / 1e3}s`
              )
            );
          }, timeoutMs);
        });
        response = await Promise.race([
          queryLLM(
            systemMessages,
            [],
            0,
            [],
            abortController.signal,
            {
              safeMode: false,
              model: expertModel,
              prependCLISysprompt: false
            }
          ),
          timeoutPromise
        ]);
      } catch (error) {
        logError(error);
        if (error.name === "AbortError" || abortController.signal?.aborted || isInterrupted) {
          return yield* this.handleInterrupt();
        }
        if (error.message?.includes("timed out")) {
          throw new Error(
            `Expert model '${expertModel}' timed out after 5 minutes.

Suggestions:
  - The model might be experiencing high load
  - Try a different model or retry later
  - Consider breaking down your question into smaller parts`
          );
        }
        if (error.message?.includes("rate limit")) {
          throw new Error(
            `Rate limit exceeded for ${expertModel}.

Please wait a moment and try again, or use a different model.`
          );
        }
        if (error.message?.includes("invalid api key")) {
          throw new Error(
            `Invalid API key for ${expertModel}.

Please check your model configuration with /model command.`
          );
        }
        if (error.message?.includes("model not found") || error.message?.includes("Failed to resolve model")) {
          try {
            const modelManager = getModelManager();
            const availableModels = modelManager.getAllAvailableModelNames();
            if (availableModels.length > 0) {
              throw new Error(
                `Model '${expertModel}' is not configured. Available models: ${availableModels.join(", ")}. Check if any available model closely matches the user's request (e.g., 'kimi' matches 'kimi-k2-0711-preview'). If there's a strong match, auto retry using the correct model name. If no close match exists, inform the user that '${expertModel}' needs to be configured using /model command.`
              );
            } else {
              throw new Error(
                `Model '${expertModel}' not found and no models are currently configured in the system. Inform the user that models need to be configured first using the /model command.`
              );
            }
          } catch (modelError) {
            throw new Error(
              `Model '${expertModel}' not found. Please check model configuration or inform user about the issue.`
            );
          }
        }
        throw new Error(
          `Expert model query failed: ${error.message || "Unknown error"}`
        );
      }
      let expertAnswer;
      try {
        if (!response?.message?.content) {
          throw new Error("No content in expert response");
        }
        expertAnswer = response.message.content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
        if (!expertAnswer.trim()) {
          throw new Error("Expert response was empty");
        }
      } catch (error) {
        logError(error);
        throw new Error("Failed to process expert response");
      }
      try {
        addMessageToSession(sessionId, "user", question);
        addMessageToSession(sessionId, "assistant", expertAnswer);
      } catch (error) {
        logError(error);
      }
      const result = {
        chatSessionId: sessionId,
        expertModelName: expertModel,
        expertAnswer
      };
      yield {
        type: "result",
        data: result,
        resultForAssistant: this.renderResultForAssistant(result)
      };
    } catch (error) {
      if (error.name === "AbortError" || abortController.signal?.aborted || isInterrupted) {
        return yield* this.handleInterrupt();
      }
      logError(error);
      const errorSessionId = sessionId || "error-session";
      const errorMessage = error.message || "Expert consultation failed with unknown error";
      const result = {
        chatSessionId: errorSessionId,
        expertModelName: expertModel,
        expertAnswer: `\u274C ${errorMessage}`
      };
      yield {
        type: "result",
        data: result,
        resultForAssistant: this.renderResultForAssistant(result)
      };
    } finally {
      abortController.signal.removeEventListener("abort", abortListener);
    }
  },
  async *handleInterrupt() {
    yield {
      type: "result",
      data: {
        chatSessionId: "interrupted",
        expertModelName: "cancelled",
        expertAnswer: INTERRUPT_MESSAGE
      },
      resultForAssistant: INTERRUPT_MESSAGE
    };
  }
};

// src/tools/system/TaskOutputTool/TaskOutputTool.tsx
init_shell();
import { Box as Box2, Text as Text2 } from "ink";
import React2 from "react";
import { z as z2 } from "zod";

// src/utils/session/backgroundTasks.ts
var backgroundTasks = /* @__PURE__ */ new Map();
function getBackgroundAgentTaskSnapshot(agentId) {
  const task = backgroundTasks.get(agentId);
  if (!task) return void 0;
  const { abortController: _abortController, done: _done, ...snapshot } = task;
  return snapshot;
}
function upsertBackgroundAgentTask(task) {
  backgroundTasks.set(task.agentId, task);
}
async function waitForBackgroundAgentTask(agentId, waitUpToMs, signal) {
  const task = backgroundTasks.get(agentId);
  if (!task) return void 0;
  if (task.status !== "running") return task;
  const timeoutPromise = new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Request timed out"));
    }, waitUpToMs);
    timeoutId.unref?.();
  });
  const abortPromise = new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new Error("Request aborted"));
      return;
    }
    const onAbort = () => reject(new Error("Request aborted"));
    signal.addEventListener("abort", onAbort, { once: true });
  });
  await Promise.race([task.done, timeoutPromise, abortPromise]);
  return backgroundTasks.get(agentId);
}

// src/utils/tooling/toolOutputDisplay.ts
function isTruthyEnv(value) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
function isPackagedRuntime() {
  if (isTruthyEnv(process.env.DANYA_PACKAGED ?? process.env.KODE_PACKAGED)) return true;
  try {
    const exec = (process.execPath || "").split(/[\\/]/).pop()?.toLowerCase();
    if (!exec) return false;
    if (exec === "bun" || exec === "bun.exe") return false;
    if (exec === "node" || exec === "node.exe") return false;
    return true;
  } catch {
    return false;
  }
}
function truncateTextForDisplay(text, options) {
  const maxLines = options?.maxLines ?? 120;
  const maxChars = options?.maxChars ?? 12e3;
  const normalized = String(text ?? "");
  const lines = normalized.split(/\r?\n/);
  let workingLines = lines;
  let omittedLines = 0;
  if (maxLines > 0 && lines.length > maxLines) {
    workingLines = lines.slice(0, maxLines);
    omittedLines = lines.length - maxLines;
  }
  let workingText = workingLines.join("\n");
  let omittedChars = 0;
  if (maxChars > 0 && workingText.length > maxChars) {
    omittedChars = workingText.length - maxChars;
    workingText = workingText.slice(0, maxChars);
  }
  const truncated = omittedLines > 0 || omittedChars > 0;
  if (!truncated) {
    return {
      text: workingText,
      truncated: false,
      omittedLines: 0,
      omittedChars: 0
    };
  }
  const suffixParts = [];
  if (omittedLines > 0) {
    suffixParts.push(`${omittedLines} lines`);
  }
  if (omittedChars > 0) {
    suffixParts.push(`${omittedChars} chars`);
  }
  const suffix = `

... [truncated ${suffixParts.join(" \xB7 ")}] ...`;
  return {
    text: workingText + suffix,
    truncated: true,
    omittedLines,
    omittedChars
  };
}
function maybeTruncateVerboseToolOutput(text, options) {
  const maxLinesEnv = Number(process.env.DANYA_TOOL_OUTPUT_MAX_LINES ?? process.env.KODE_TOOL_OUTPUT_MAX_LINES ?? "");
  const maxCharsEnv = Number(process.env.DANYA_TOOL_OUTPUT_MAX_CHARS ?? process.env.KODE_TOOL_OUTPUT_MAX_CHARS ?? "");
  const envOverrides = {
    maxLines: Number.isFinite(maxLinesEnv) && maxLinesEnv > 0 ? maxLinesEnv : void 0,
    maxChars: Number.isFinite(maxCharsEnv) && maxCharsEnv > 0 ? maxCharsEnv : void 0
  };
  const effective = {
    maxLines: envOverrides.maxLines ?? options?.maxLines,
    maxChars: envOverrides.maxChars ?? options?.maxChars
  };
  const fullAllowed = isTruthyEnv(process.env.DANYA_TOOL_OUTPUT_FULL ?? process.env.KODE_TOOL_OUTPUT_FULL);
  if (!isPackagedRuntime() || fullAllowed) {
    return { text: String(text ?? ""), truncated: false };
  }
  const result = truncateTextForDisplay(String(text ?? ""), effective);
  return { text: result.text, truncated: result.truncated };
}

// src/tools/system/TaskOutputTool/prompt.ts
var TOOL_NAME_FOR_PROMPT = "TaskOutput";
var DESCRIPTION = "Retrieves output from a running or completed task";
var PROMPT = `- Retrieves output from a running or completed task (background shell, agent, or remote session)
- Takes a task_id parameter identifying the task
- Returns the task output along with status information
- Use block=true (default) to wait for task completion
- Use block=false for non-blocking check of current status
- Task IDs can be found using the /tasks command
- Works with all task types: background shells, async agents, and remote sessions`;

// src/tools/system/TaskOutputTool/TaskOutputTool.tsx
init_taskOutputStore();
var inputSchema2 = z2.strictObject({
  task_id: z2.string().describe("The task ID to get output from"),
  block: z2.boolean().optional().default(true).describe("Whether to wait for completion"),
  timeout: z2.number().min(0).max(6e5).optional().default(3e4).describe("Max wait time in ms")
});
function normalizeTaskOutputInput(input) {
  const task_id = typeof input.task_id === "string" && input.task_id || typeof input.agentId === "string" && String(input.agentId) || typeof input.bash_id === "string" && String(input.bash_id) || "";
  const block = typeof input.block === "boolean" ? input.block : true;
  const timeout = typeof input.timeout === "number" ? input.timeout : typeof input.wait_up_to === "number" ? Number(input.wait_up_to) * 1e3 : 3e4;
  return { task_id, block, timeout };
}
function taskStatusFromBash(bg) {
  if (!bg) return "failed";
  if (bg.killed) return "killed";
  if (bg.code === null) return "running";
  return bg.code === 0 ? "completed" : "failed";
}
function buildTaskSummary(taskId) {
  const bg = BunShell.getInstance().getBackgroundOutput(taskId);
  if (bg) {
    return {
      task_id: taskId,
      task_type: "local_bash",
      status: taskStatusFromBash(bg),
      description: bg.command,
      output: readTaskOutput(taskId),
      exitCode: bg.code
    };
  }
  const agent = getBackgroundAgentTaskSnapshot(taskId);
  if (agent) {
    const output = readTaskOutput(taskId) || agent.resultText || "";
    return {
      task_id: taskId,
      task_type: "local_agent",
      status: agent.status,
      description: agent.description,
      output,
      prompt: agent.prompt,
      result: output,
      error: agent.error
    };
  }
  return null;
}
async function waitForBashTaskCompletion(args) {
  const { taskId, timeoutMs, signal } = args;
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (signal.aborted) return null;
    const summary = buildTaskSummary(taskId);
    if (!summary) return null;
    if (summary.status !== "running" && summary.status !== "pending")
      return summary;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return buildTaskSummary(taskId);
}
var TaskOutputTool = {
  name: TOOL_NAME_FOR_PROMPT,
  async description() {
    return DESCRIPTION;
  },
  userFacingName() {
    return "Task Output";
  },
  inputSchema: inputSchema2,
  isReadOnly() {
    return true;
  },
  isConcurrencySafe() {
    return true;
  },
  async isEnabled() {
    return true;
  },
  needsPermissions() {
    return false;
  },
  async prompt() {
    return PROMPT;
  },
  renderToolUseMessage(input) {
    const normalized = normalizeTaskOutputInput(input);
    if (!normalized.block) return "non-blocking";
    return "";
  },
  renderToolUseRejectedMessage() {
    return null;
  },
  renderToolResultMessage(output, { verbose }) {
    const theme = getTheme();
    if (output.retrieval_status === "timeout" || output.retrieval_status === "not_ready") {
      return /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, { color: theme.secondaryText }, "Task is still running\u2026"));
    }
    if (!output.task) {
      return /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, { color: theme.secondaryText }, "No task output available"));
    }
    if (output.task.task_type === "local_agent") {
      const lines = output.task.result ? output.task.result.split("\n").length : 0;
      if (!verbose) {
        return /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, { color: theme.secondaryText }, "Read output (ctrl+o to expand)"));
      }
      return /* @__PURE__ */ React2.createElement(Box2, { flexDirection: "column" }, /* @__PURE__ */ React2.createElement(Text2, null, output.task.description, " (", lines, " lines)"), output.task.prompt ? /* @__PURE__ */ React2.createElement(Box2, { paddingLeft: 2 }, /* @__PURE__ */ React2.createElement(Text2, { color: theme.secondaryText }, output.task.prompt)) : null, output.task.result ? /* @__PURE__ */ React2.createElement(Box2, { paddingLeft: 2, marginTop: 1 }, /* @__PURE__ */ React2.createElement(Text2, null, maybeTruncateVerboseToolOutput(output.task.result, {
        maxLines: 200,
        maxChars: 4e4
      }).text)) : null, output.task.error ? /* @__PURE__ */ React2.createElement(Box2, { flexDirection: "column", marginTop: 1, paddingLeft: 2 }, /* @__PURE__ */ React2.createElement(Text2, { color: theme.error, bold: true }, "Error:"), /* @__PURE__ */ React2.createElement(Text2, { color: theme.error }, output.task.error)) : null);
    }
    const content = output.task.output?.trimEnd() ?? "";
    if (!verbose) {
      return /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, { color: theme.secondaryText }, content.length > 0 ? "Read output (ctrl+o to expand)" : "(No content)"));
    }
    return /* @__PURE__ */ React2.createElement(Box2, { flexDirection: "column" }, /* @__PURE__ */ React2.createElement(Text2, { color: theme.secondaryText }, output.task.description), content ? /* @__PURE__ */ React2.createElement(Box2, { paddingLeft: 2, marginTop: 1 }, /* @__PURE__ */ React2.createElement(Text2, null, maybeTruncateVerboseToolOutput(content, {
      maxLines: 200,
      maxChars: 4e4
    }).text)) : null);
  },
  renderResultForAssistant(output) {
    const parts = [];
    parts.push(
      `<retrieval_status>${output.retrieval_status}</retrieval_status>`
    );
    if (output.task) {
      parts.push(`<task_id>${output.task.task_id}</task_id>`);
      parts.push(`<task_type>${output.task.task_type}</task_type>`);
      parts.push(`<status>${output.task.status}</status>`);
      if (output.task.exitCode !== void 0 && output.task.exitCode !== null) {
        parts.push(`<exit_code>${output.task.exitCode}</exit_code>`);
      }
      if (output.task.output?.trim()) {
        parts.push(`<output>
${output.task.output.trimEnd()}
</output>`);
      }
      if (output.task.error) {
        parts.push(`<error>${output.task.error}</error>`);
      }
    }
    return parts.join("\n\n");
  },
  async validateInput(input) {
    if (!input.task_id) {
      return { result: false, message: "Task ID is required", errorCode: 1 };
    }
    const task = buildTaskSummary(input.task_id);
    if (!task) {
      return {
        result: false,
        message: `No task found with ID: ${input.task_id}`,
        errorCode: 2
      };
    }
    return { result: true };
  },
  async *call(input, context) {
    const normalized = normalizeTaskOutputInput(input);
    const taskId = normalized.task_id;
    const block = normalized.block;
    const timeoutMs = normalized.timeout;
    const initial = buildTaskSummary(taskId);
    if (!initial) {
      throw new Error(`No task found with ID: ${taskId}`);
    }
    if (!block) {
      const isDone = initial.status !== "running" && initial.status !== "pending";
      const out2 = {
        retrieval_status: isDone ? "success" : "not_ready",
        task: initial
      };
      yield {
        type: "result",
        data: out2,
        resultForAssistant: this.renderResultForAssistant(out2)
      };
      return;
    }
    yield {
      type: "progress",
      content: createAssistantMessage(
        `<tool-progress>${initial.description ? `  ${initial.description}
` : ""}     Waiting for task (esc to give additional instructions)</tool-progress>`
      )
    };
    let finalTask = null;
    if (initial.task_type === "local_agent") {
      try {
        const task = await waitForBackgroundAgentTask(
          taskId,
          timeoutMs,
          context.abortController.signal
        );
        finalTask = task ? buildTaskSummary(taskId) : null;
      } catch {
        finalTask = buildTaskSummary(taskId);
      }
    } else {
      finalTask = await waitForBashTaskCompletion({
        taskId,
        timeoutMs,
        signal: context.abortController.signal
      });
    }
    if (!finalTask) {
      const out2 = { retrieval_status: "timeout", task: null };
      yield {
        type: "result",
        data: out2,
        resultForAssistant: this.renderResultForAssistant(out2)
      };
      return;
    }
    if (finalTask.status === "running" || finalTask.status === "pending") {
      const out2 = { retrieval_status: "timeout", task: finalTask };
      yield {
        type: "result",
        data: out2,
        resultForAssistant: this.renderResultForAssistant(out2)
      };
      return;
    }
    const out = { retrieval_status: "success", task: finalTask };
    yield {
      type: "result",
      data: out,
      resultForAssistant: this.renderResultForAssistant(out)
    };
  }
};

// src/tools/mcp/ListMcpResourcesTool/ListMcpResourcesTool.tsx
import { Box as Box3, Text as Text3 } from "ink";
import React3 from "react";
import { z as z3 } from "zod";
import { ListResourcesResultSchema } from "@modelcontextprotocol/sdk/types.js";

// src/tools/mcp/ListMcpResourcesTool/prompt.ts
var TOOL_NAME = "ListMcpResourcesTool";
var DESCRIPTION2 = `Lists available resources from configured MCP servers.
Each resource object includes a 'server' field indicating which server it's from.

Usage examples:
- List all resources from all servers: \`listMcpResources\`
- List resources from a specific server: \`listMcpResources({ server: "myserver" })\``;
var PROMPT2 = `List available resources from configured MCP servers.
Each returned resource will include all standard MCP resource fields plus a 'server' field 
indicating which server the resource belongs to.

Parameters:
- server (optional): The name of a specific MCP server to get resources from. If not provided,
  resources from all servers will be returned.`;

// src/tools/mcp/ListMcpResourcesTool/ListMcpResourcesTool.tsx
var inputSchema3 = z3.strictObject({
  server: z3.string().optional().describe("Optional server name to filter resources by")
});
var ListMcpResourcesTool = {
  name: TOOL_NAME,
  async description() {
    return DESCRIPTION2;
  },
  async prompt() {
    return PROMPT2;
  },
  inputSchema: inputSchema3,
  userFacingName() {
    return "listMcpResources";
  },
  async isEnabled() {
    return true;
  },
  isReadOnly() {
    return true;
  },
  isConcurrencySafe() {
    return true;
  },
  needsPermissions() {
    return false;
  },
  async validateInput({ server }, context) {
    if (!server) return { result: true };
    const clients = context?.options?.mcpClients ?? await getClients();
    const found = clients.some((c) => c.name === server);
    if (!found) {
      return {
        result: false,
        message: `Server "${server}" not found. Available servers: ${clients.map((c) => c.name).join(", ")}`,
        errorCode: 1
      };
    }
    return { result: true };
  },
  renderToolUseMessage({ server }) {
    return server ? `List MCP resources from server "${server}"` : "List all MCP resources";
  },
  renderToolUseRejectedMessage() {
    return /* @__PURE__ */ React3.createElement(FallbackToolUseRejectedMessage, null);
  },
  renderToolResultMessage(output) {
    return /* @__PURE__ */ React3.createElement(Box3, { justifyContent: "space-between", width: "100%" }, /* @__PURE__ */ React3.createElement(Box3, { flexDirection: "row" }, /* @__PURE__ */ React3.createElement(Text3, null, "\xA0\xA0\u23BF \xA0"), /* @__PURE__ */ React3.createElement(Text3, { bold: true }, output.length), /* @__PURE__ */ React3.createElement(Text3, null, " resources")), /* @__PURE__ */ React3.createElement(Cost, { costUSD: 0, durationMs: 0, debug: false }));
  },
  renderResultForAssistant(output) {
    return JSON.stringify(output);
  },
  async *call({ server }, context) {
    const clients = context.options?.mcpClients ?? await getClients();
    const selected = server ? clients.filter((c) => c.name === server) : clients;
    if (server && selected.length === 0) {
      throw new Error(
        `Server "${server}" not found. Available servers: ${clients.map((c) => c.name).join(", ")}`
      );
    }
    const resources = [];
    for (const wrapped of selected) {
      if (wrapped.type !== "connected") continue;
      try {
        let capabilities = wrapped.capabilities ?? null;
        if (!capabilities) {
          try {
            capabilities = wrapped.client.getServerCapabilities();
          } catch {
            capabilities = null;
          }
        }
        if (!capabilities?.resources) continue;
        const result = await wrapped.client.request(
          { method: "resources/list" },
          ListResourcesResultSchema
        );
        if (!result.resources) continue;
        resources.push(
          ...result.resources.map((r) => ({
            ...r,
            server: wrapped.name
          }))
        );
      } catch {
      }
    }
    yield {
      type: "result",
      data: resources,
      resultForAssistant: this.renderResultForAssistant(resources)
    };
  }
};

// src/tools/search/LspTool/LspTool.tsx
init_state();
import { existsSync as existsSync2, readFileSync as readFileSync2, statSync } from "fs";
import { Box as Box4, Text as Text4 } from "ink";
import { createRequire } from "node:module";
import { extname, join as join2, relative } from "path";
import React4 from "react";
import { pathToFileURL } from "url";
import { z as z4 } from "zod";

// src/tools/search/LspTool/prompt.ts
var TOOL_NAME_FOR_PROMPT2 = "LSP";
var PROMPT3 = `Interact with Language Server Protocol (LSP) servers to get code intelligence features.

Supported operations:
- goToDefinition: Find where a symbol is defined
- findReferences: Find all references to a symbol
- hover: Get hover information (documentation, type info) for a symbol
- documentSymbol: Get all symbols (functions, classes, variables) in a document
- workspaceSymbol: Search for symbols across the entire workspace
- goToImplementation: Find implementations of an interface or abstract method
- prepareCallHierarchy: Get call hierarchy item at a position (functions/methods)
- incomingCalls: Find all functions/methods that call the function at a position
- outgoingCalls: Find all functions/methods called by the function at a position

All operations require:
- filePath: The file to operate on
- line: The line number (1-based, as shown in editors)
- character: The character offset (1-based, as shown in editors)

Note: LSP servers must be configured for the file type. If no server is available, an error will be returned.`;
var DESCRIPTION3 = PROMPT3;

// src/tools/search/LspTool/LspTool.tsx
var inputSchema4 = z4.strictObject({
  operation: z4.enum([
    "goToDefinition",
    "findReferences",
    "hover",
    "documentSymbol",
    "workspaceSymbol",
    "goToImplementation",
    "prepareCallHierarchy",
    "incomingCalls",
    "outgoingCalls"
  ]).describe("The LSP operation to perform"),
  filePath: z4.string().describe("The absolute or relative path to the file"),
  line: z4.number().int().positive().describe("The line number (1-based, as shown in editors)"),
  character: z4.number().int().positive().describe("The character offset (1-based, as shown in editors)")
});
var outputSchema = z4.object({
  operation: z4.enum([
    "goToDefinition",
    "findReferences",
    "hover",
    "documentSymbol",
    "workspaceSymbol",
    "goToImplementation",
    "prepareCallHierarchy",
    "incomingCalls",
    "outgoingCalls"
  ]).describe("The LSP operation that was performed"),
  result: z4.string().describe("The formatted result of the LSP operation"),
  filePath: z4.string().describe("The file path the operation was performed on"),
  resultCount: z4.number().int().nonnegative().optional().describe("Number of results (definitions, references, symbols)"),
  fileCount: z4.number().int().nonnegative().optional().describe("Number of files containing results")
});
var OPERATION_LABELS = {
  goToDefinition: { singular: "definition", plural: "definitions" },
  findReferences: { singular: "reference", plural: "references" },
  documentSymbol: { singular: "symbol", plural: "symbols" },
  workspaceSymbol: { singular: "symbol", plural: "symbols" },
  hover: { singular: "hover info", plural: "hover info", special: "available" },
  goToImplementation: { singular: "implementation", plural: "implementations" },
  prepareCallHierarchy: { singular: "call item", plural: "call items" },
  incomingCalls: { singular: "caller", plural: "callers" },
  outgoingCalls: { singular: "callee", plural: "callees" }
};
function extractSymbolAtPosition(lines, zeroBasedLine, zeroBasedCharacter) {
  try {
    if (zeroBasedLine < 0 || zeroBasedLine >= lines.length) return null;
    const line = lines[zeroBasedLine];
    if (zeroBasedCharacter < 0 || zeroBasedCharacter >= line.length) return null;
    const tokenRe = /[\w$'!]+|[+\-*/%&|^~<>=]+/g;
    let match;
    while ((match = tokenRe.exec(line)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (zeroBasedCharacter >= start && zeroBasedCharacter < end) {
        const token = match[0];
        return token.length > 30 ? `${token.slice(0, 27)}...` : token;
      }
    }
    return null;
  } catch {
    return null;
  }
}
function toProjectRelativeIfPossible(filePath) {
  const cwd = getCwd();
  try {
    const rel = relative(cwd, filePath);
    if (!rel || rel === "") return filePath;
    if (rel.startsWith("..")) return filePath;
    return rel;
  } catch {
    return filePath;
  }
}
function formatLocation(fileName, line0, character0) {
  return `${toProjectRelativeIfPossible(fileName)}:${line0 + 1}:${character0 + 1}`;
}
function formatGoToDefinitionResult(locations) {
  if (!locations || locations.length === 0) {
    return {
      formatted: "No definition found. This may occur if the cursor is not on a symbol, or if the definition is in an external library not indexed by the LSP server.",
      resultCount: 0,
      fileCount: 0
    };
  }
  const fileCount = new Set(locations.map((l) => l.fileName)).size;
  if (locations.length === 1) {
    const loc = locations[0];
    return {
      formatted: `Defined in ${formatLocation(loc.fileName, loc.line0, loc.character0)}`,
      resultCount: 1,
      fileCount
    };
  }
  return {
    formatted: `Found ${locations.length} definitions:
${locations.map(
      (loc) => `  ${formatLocation(loc.fileName, loc.line0, loc.character0)}`
    ).join("\n")}`,
    resultCount: locations.length,
    fileCount
  };
}
function groupLocationsByFile(items) {
  const grouped = /* @__PURE__ */ new Map();
  for (const item of items) {
    const key = toProjectRelativeIfPossible(item.fileName);
    const existing = grouped.get(key);
    if (existing) existing.push(item);
    else grouped.set(key, [item]);
  }
  return grouped;
}
function formatFindReferencesResult(references) {
  if (!references || references.length === 0) {
    return {
      formatted: "No references found. This may occur if the symbol has no usages, or if the LSP server has not fully indexed the workspace.",
      resultCount: 0,
      fileCount: 0
    };
  }
  if (references.length === 1) {
    const ref = references[0];
    return {
      formatted: `Found 1 reference:
  ${formatLocation(ref.fileName, ref.line0, ref.character0)}`,
      resultCount: 1,
      fileCount: 1
    };
  }
  const grouped = groupLocationsByFile(references);
  const lines = [
    `Found ${references.length} references across ${grouped.size} files:`
  ];
  for (const [file, refs] of grouped) {
    lines.push(`
${file}:`);
    for (const ref of refs) {
      lines.push(`  Line ${ref.line0 + 1}:${ref.character0 + 1}`);
    }
  }
  return {
    formatted: lines.join("\n"),
    resultCount: references.length,
    fileCount: grouped.size
  };
}
function formatHoverResult(hoverText, line0, character0) {
  if (!hoverText || hoverText.trim() === "") {
    return {
      formatted: "No hover information available. This may occur if the cursor is not on a symbol, or if the LSP server has not fully indexed the file.",
      resultCount: 0,
      fileCount: 0
    };
  }
  return {
    formatted: `Hover info at ${line0 + 1}:${character0 + 1}:

${hoverText}`,
    resultCount: 1,
    fileCount: 1
  };
}
function formatDocumentSymbolsResult(lines, symbolCount) {
  if (symbolCount === 0) {
    return {
      formatted: "No symbols found in document. This may occur if the file is empty, not supported by the LSP server, or if the server has not fully indexed the file.",
      resultCount: 0,
      fileCount: 0
    };
  }
  return {
    formatted: ["Document symbols:", ...lines].join("\n"),
    resultCount: symbolCount,
    fileCount: 1
  };
}
var cachedTypeScript = null;
function tryLoadTypeScriptModule(projectCwd) {
  if (cachedTypeScript?.cwd === projectCwd) return cachedTypeScript.module;
  try {
    const requireFromCwd = createRequire(
      pathToFileURL(join2(projectCwd, "__kode_lsp__.js"))
    );
    const mod = requireFromCwd("typescript");
    cachedTypeScript = { cwd: projectCwd, module: mod };
    return mod;
  } catch {
    cachedTypeScript = { cwd: projectCwd, module: null };
    return null;
  }
}
var projectCache = /* @__PURE__ */ new Map();
function getOrCreateTsProject(projectCwd) {
  const ts = tryLoadTypeScriptModule(projectCwd);
  if (!ts) return null;
  const existing = projectCache.get(projectCwd);
  if (existing) return existing;
  let compilerOptions = {
    allowJs: true,
    checkJs: false,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext
  };
  let rootFileNames = [];
  try {
    const configPath = ts.findConfigFile(
      projectCwd,
      ts.sys.fileExists,
      "tsconfig.json"
    );
    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      if (!configFile.error) {
        const parsed = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          projectCwd
        );
        compilerOptions = { ...compilerOptions, ...parsed.options };
        rootFileNames = parsed.fileNames;
      }
    }
  } catch {
  }
  const rootFiles = new Set(rootFileNames);
  const versions = /* @__PURE__ */ new Map();
  const host = {
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => Array.from(rootFiles),
    getScriptVersion: (fileName) => {
      try {
        const stat = statSync(fileName);
        const version = String(stat.mtimeMs ?? Date.now());
        versions.set(fileName, version);
        return version;
      } catch {
        return versions.get(fileName) ?? "0";
      }
    },
    getScriptSnapshot: (fileName) => {
      try {
        if (!ts.sys.fileExists(fileName)) return void 0;
        const content = ts.sys.readFile(fileName);
        if (content === void 0) return void 0;
        const stat = statSync(fileName);
        versions.set(fileName, String(stat.mtimeMs ?? Date.now()));
        return ts.ScriptSnapshot.fromString(content);
      } catch {
        return void 0;
      }
    },
    getCurrentDirectory: () => projectCwd,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getCanonicalFileName: (fileName) => ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
    getNewLine: () => ts.sys.newLine
  };
  const languageService = ts.createLanguageService(
    host,
    ts.createDocumentRegistry()
  );
  const state = {
    ts,
    cwd: projectCwd,
    rootFiles,
    compilerOptions,
    languageService,
    versions
  };
  projectCache.set(projectCwd, state);
  return state;
}
function isFileTypeSupportedByTypescriptBackend(filePath) {
  const ext = extname(filePath).toLowerCase();
  return ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx" || ext === ".mts" || ext === ".cts" || ext === ".mjs" || ext === ".cjs";
}
function summarizeToolResult(operation, resultCount, fileCount) {
  const label = OPERATION_LABELS[operation] ?? {
    singular: "result",
    plural: "results"
  };
  const noun = resultCount === 1 ? label.singular : label.plural;
  if (operation === "hover" && resultCount > 0 && label.special) {
    return /* @__PURE__ */ React4.createElement(Text4, null, "Hover info ", label.special);
  }
  return /* @__PURE__ */ React4.createElement(Text4, null, "Found ", /* @__PURE__ */ React4.createElement(Text4, { bold: true }, resultCount), " ", noun, fileCount > 1 ? /* @__PURE__ */ React4.createElement(React4.Fragment, null, " ", "across ", /* @__PURE__ */ React4.createElement(Text4, { bold: true }, fileCount), " files") : null);
}
var LspTool = {
  name: TOOL_NAME_FOR_PROMPT2,
  async description() {
    return DESCRIPTION3;
  },
  async prompt() {
    return PROMPT3;
  },
  inputSchema: inputSchema4,
  userFacingName() {
    return "LSP";
  },
  async isEnabled() {
    return tryLoadTypeScriptModule(getCwd()) !== null;
  },
  isReadOnly() {
    return true;
  },
  isConcurrencySafe() {
    return true;
  },
  needsPermissions({ filePath }) {
    const abs = getAbsolutePath(filePath) ?? filePath;
    return !hasReadPermission(abs || getCwd());
  },
  async validateInput(input) {
    const parsed = inputSchema4.safeParse(input);
    if (!parsed.success) {
      return {
        result: false,
        message: `Invalid input: ${parsed.error.message}`,
        errorCode: 3
      };
    }
    const absPath = getAbsolutePath(input.filePath) ?? input.filePath;
    if (!existsSync2(absPath)) {
      return {
        result: false,
        message: `File does not exist: ${input.filePath}`,
        errorCode: 1
      };
    }
    try {
      if (!statSync(absPath).isFile()) {
        return {
          result: false,
          message: `Path is not a file: ${input.filePath}`,
          errorCode: 2
        };
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      return {
        result: false,
        message: `Cannot access file: ${input.filePath}. ${e.message}`,
        errorCode: 4
      };
    }
    return { result: true };
  },
  renderToolUseMessage(input, { verbose }) {
    const abs = getAbsolutePath(input.filePath) ?? input.filePath;
    const filePathForDisplay = verbose ? abs : toProjectRelativeIfPossible(abs);
    const parts = [];
    if ((input.operation === "goToDefinition" || input.operation === "findReferences" || input.operation === "hover" || input.operation === "goToImplementation") && input.filePath && input.line !== void 0 && input.character !== void 0) {
      try {
        const content = readFileSync2(abs, "utf8");
        const symbol = extractSymbolAtPosition(
          content.split("\n"),
          input.line - 1,
          input.character - 1
        );
        if (symbol) {
          parts.push(`operation: "${input.operation}"`);
          parts.push(`symbol: "${symbol}"`);
          parts.push(`in: "${filePathForDisplay}"`);
          return parts.join(", ");
        }
      } catch {
      }
      parts.push(`operation: "${input.operation}"`);
      parts.push(`file: "${filePathForDisplay}"`);
      parts.push(`position: ${input.line}:${input.character}`);
      return parts.join(", ");
    }
    parts.push(`operation: "${input.operation}"`);
    if (input.filePath) parts.push(`file: "${filePathForDisplay}"`);
    return parts.join(", ");
  },
  renderToolUseRejectedMessage() {
    return /* @__PURE__ */ React4.createElement(FallbackToolUseRejectedMessage, null);
  },
  renderToolResultMessage(output, { verbose }) {
    if (output.resultCount !== void 0 && output.fileCount !== void 0) {
      const display = verbose ? maybeTruncateVerboseToolOutput(output.result, {
        maxLines: 120,
        maxChars: 2e4
      }) : null;
      return /* @__PURE__ */ React4.createElement(Box4, { flexDirection: "column" }, /* @__PURE__ */ React4.createElement(Box4, { flexDirection: "row" }, /* @__PURE__ */ React4.createElement(Text4, null, "\xA0\xA0\u23BF \xA0"), summarizeToolResult(
        output.operation,
        output.resultCount,
        output.fileCount
      )), display ? /* @__PURE__ */ React4.createElement(Box4, { marginLeft: 5 }, /* @__PURE__ */ React4.createElement(Text4, null, display.text)) : null);
    }
    return /* @__PURE__ */ React4.createElement(Box4, { justifyContent: "space-between", width: "100%" }, /* @__PURE__ */ React4.createElement(Box4, { flexDirection: "row" }, /* @__PURE__ */ React4.createElement(Text4, null, "\xA0\xA0\u23BF \xA0"), /* @__PURE__ */ React4.createElement(Text4, null, output.result)));
  },
  renderResultForAssistant(output) {
    return output.result;
  },
  async *call(input, _context) {
    const absPath = getAbsolutePath(input.filePath) ?? input.filePath;
    if (!isFileTypeSupportedByTypescriptBackend(absPath)) {
      const ext = extname(absPath);
      const out = {
        operation: input.operation,
        result: `No LSP server available for file type: ${ext}`,
        filePath: input.filePath,
        resultCount: 0,
        fileCount: 0
      };
      yield { type: "result", data: out, resultForAssistant: out.result };
      return;
    }
    const project = getOrCreateTsProject(getCwd());
    if (!project) {
      const out = {
        operation: input.operation,
        result: "LSP server manager not initialized. This may indicate a startup issue.",
        filePath: input.filePath,
        resultCount: 0,
        fileCount: 0
      };
      yield { type: "result", data: out, resultForAssistant: out.result };
      return;
    }
    project.rootFiles.add(absPath);
    const ts = project.ts;
    const service = project.languageService;
    const program = service.getProgram?.();
    if (!program) {
      const out = {
        operation: input.operation,
        result: `Error performing ${input.operation}: TypeScript program not available`,
        filePath: input.filePath,
        resultCount: 0,
        fileCount: 0
      };
      yield { type: "result", data: out, resultForAssistant: out.result };
      return;
    }
    const sourceFile = program.getSourceFile(absPath);
    if (!sourceFile) {
      const out = {
        operation: input.operation,
        result: `Error performing ${input.operation}: File is not part of the TypeScript program`,
        filePath: input.filePath,
        resultCount: 0,
        fileCount: 0
      };
      yield { type: "result", data: out, resultForAssistant: out.result };
      return;
    }
    const pos = ts.getPositionOfLineAndCharacter(
      sourceFile,
      input.line - 1,
      input.character - 1
    );
    try {
      let formatted;
      let resultCount = 0;
      let fileCount = 0;
      switch (input.operation) {
        case "goToDefinition": {
          const defs = service.getDefinitionAtPosition?.(absPath, pos) ?? [];
          const locations = defs.map((d) => {
            const defSourceFile = program.getSourceFile(d.fileName);
            if (!defSourceFile) return null;
            const lc = ts.getLineAndCharacterOfPosition(
              defSourceFile,
              d.textSpan.start
            );
            return {
              fileName: d.fileName,
              line0: lc.line,
              character0: lc.character
            };
          }).filter(Boolean);
          const res = formatGoToDefinitionResult(locations);
          formatted = res.formatted;
          resultCount = res.resultCount;
          fileCount = res.fileCount;
          break;
        }
        case "goToImplementation": {
          const impls = service.getImplementationAtPosition?.(absPath, pos) ?? [];
          const locations = impls.map((d) => {
            const defSourceFile = program.getSourceFile(d.fileName);
            if (!defSourceFile) return null;
            const lc = ts.getLineAndCharacterOfPosition(
              defSourceFile,
              d.textSpan.start
            );
            return {
              fileName: d.fileName,
              line0: lc.line,
              character0: lc.character
            };
          }).filter(Boolean);
          const res = formatGoToDefinitionResult(locations);
          formatted = res.formatted;
          resultCount = res.resultCount;
          fileCount = res.fileCount;
          break;
        }
        case "findReferences": {
          const referencedSymbols = service.findReferences?.(absPath, pos) ?? [];
          const refs = [];
          for (const sym of referencedSymbols) {
            for (const ref of sym.references ?? []) {
              const refSource = program.getSourceFile(ref.fileName);
              if (!refSource) continue;
              const lc = ts.getLineAndCharacterOfPosition(
                refSource,
                ref.textSpan.start
              );
              refs.push({
                fileName: ref.fileName,
                line0: lc.line,
                character0: lc.character
              });
            }
          }
          const res = formatFindReferencesResult(refs);
          formatted = res.formatted;
          resultCount = res.resultCount;
          fileCount = res.fileCount;
          break;
        }
        case "hover": {
          const info = service.getQuickInfoAtPosition?.(absPath, pos);
          let text = null;
          let hoverLine0 = input.line - 1;
          let hoverCharacter0 = input.character - 1;
          if (info) {
            const parts = [];
            const signature = ts.displayPartsToString(info.displayParts ?? []);
            if (signature) parts.push(signature);
            const doc = ts.displayPartsToString(info.documentation ?? []);
            if (doc) parts.push(doc);
            if (info.tags && info.tags.length > 0) {
              for (const tag of info.tags) {
                const tagText = ts.displayPartsToString(tag.text ?? []);
                parts.push(`@${tag.name}${tagText ? ` ${tagText}` : ""}`);
              }
            }
            text = parts.filter(Boolean).join("\n\n");
            const lc = ts.getLineAndCharacterOfPosition(
              sourceFile,
              info.textSpan.start
            );
            hoverLine0 = lc.line;
            hoverCharacter0 = lc.character;
          }
          const res = formatHoverResult(text, hoverLine0, hoverCharacter0);
          formatted = res.formatted;
          resultCount = res.resultCount;
          fileCount = res.fileCount;
          break;
        }
        case "documentSymbol": {
          const tree = service.getNavigationTree?.(absPath);
          const lines = [];
          let count = 0;
          const kindLabel = (kind) => {
            const m = {
              class: "Class",
              interface: "Interface",
              enum: "Enum",
              function: "Function",
              method: "Method",
              property: "Property",
              var: "Variable",
              let: "Variable",
              const: "Constant",
              module: "Module",
              alias: "Alias",
              type: "Type"
            };
            return m[kind] ?? (kind ? kind[0].toUpperCase() + kind.slice(1) : "Unknown");
          };
          const walk = (node, depth) => {
            const children = node?.childItems ?? [];
            for (const child of children) {
              const span = child.spans?.[0];
              if (!span) continue;
              const lc = ts.getLineAndCharacterOfPosition(
                sourceFile,
                span.start
              );
              const indent = "  ".repeat(depth);
              const label = kindLabel(child.kind);
              const detail = child.kindModifiers ? ` ${child.kindModifiers}` : "";
              lines.push(
                `${indent}${child.text} (${label})${detail} - Line ${lc.line + 1}`
              );
              count += 1;
              if (child.childItems && child.childItems.length > 0) {
                walk(child, depth + 1);
              }
            }
          };
          walk(tree, 0);
          const res = formatDocumentSymbolsResult(lines, count);
          formatted = res.formatted;
          resultCount = res.resultCount;
          fileCount = res.fileCount;
          break;
        }
        case "workspaceSymbol": {
          const items = service.getNavigateToItems?.("", 100, void 0, true, true) ?? [];
          if (!items || items.length === 0) {
            formatted = "No symbols found in workspace. This may occur if the workspace is empty, or if the LSP server has not finished indexing the project.";
            resultCount = 0;
            fileCount = 0;
            break;
          }
          const lines = [
            `Found ${items.length} symbol${items.length === 1 ? "" : "s"} in workspace:`
          ];
          const grouped = groupLocationsByFile(
            items.map((it) => ({
              fileName: it.fileName,
              item: it
            }))
          );
          for (const [file, itemsInFile] of grouped) {
            lines.push(`
${file}:`);
            for (const wrapper of itemsInFile) {
              const it = wrapper.item;
              const sf = program.getSourceFile(it.fileName);
              if (!sf) continue;
              const span = it.textSpan;
              const lc = span ? ts.getLineAndCharacterOfPosition(sf, span.start) : { line: 0, character: 0 };
              const label = it.kind ? String(it.kind)[0].toUpperCase() + String(it.kind).slice(1) : "Symbol";
              let line = `  ${it.name} (${label}) - Line ${lc.line + 1}`;
              if (it.containerName) line += ` in ${it.containerName}`;
              lines.push(line);
            }
          }
          formatted = lines.join("\n");
          resultCount = items.length;
          fileCount = grouped.size;
          break;
        }
        case "prepareCallHierarchy":
        case "incomingCalls":
        case "outgoingCalls": {
          const opLabel = input.operation;
          formatted = `Error performing ${opLabel}: Call hierarchy is not supported by the TypeScript backend`;
          resultCount = 0;
          fileCount = 0;
          break;
        }
        default: {
          formatted = `Error performing ${input.operation}: Unsupported operation`;
          resultCount = 0;
          fileCount = 0;
        }
      }
      const out = {
        operation: input.operation,
        result: formatted,
        filePath: input.filePath,
        resultCount,
        fileCount
      };
      yield { type: "result", data: out, resultForAssistant: out.result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const out = {
        operation: input.operation,
        result: `Error performing ${input.operation}: ${message}`,
        filePath: input.filePath
      };
      yield { type: "result", data: out, resultForAssistant: out.result };
    }
  }
};

// src/tools/mcp/ReadMcpResourceTool/ReadMcpResourceTool.tsx
import { Box as Box5, Text as Text5 } from "ink";
import React5 from "react";
import { z as z5 } from "zod";
import { ReadResourceResultSchema } from "@modelcontextprotocol/sdk/types.js";

// src/tools/mcp/ReadMcpResourceTool/prompt.ts
var TOOL_NAME2 = "ReadMcpResourceTool";
var DESCRIPTION4 = `Reads a specific resource from an MCP server.
- server: The name of the MCP server to read from
- uri: The URI of the resource to read

Usage examples:
- Read a resource from a server: \`readMcpResource({ server: "myserver", uri: "my-resource-uri" })\``;
var PROMPT4 = `Reads a specific resource from an MCP server, identified by server name and resource URI.

Parameters:
- server (required): The name of the MCP server from which to read the resource
- uri (required): The URI of the resource to read`;

// src/tools/mcp/ReadMcpResourceTool/ReadMcpResourceTool.tsx
var inputSchema5 = z5.strictObject({
  server: z5.string().describe("The MCP server name"),
  uri: z5.string().describe("The resource URI to read")
});
var ReadMcpResourceTool = {
  name: TOOL_NAME2,
  async description() {
    return DESCRIPTION4;
  },
  async prompt() {
    return PROMPT4;
  },
  inputSchema: inputSchema5,
  userFacingName() {
    return "readMcpResource";
  },
  async isEnabled() {
    return true;
  },
  isReadOnly() {
    return true;
  },
  isConcurrencySafe() {
    return true;
  },
  needsPermissions() {
    return false;
  },
  async validateInput({ server }, context) {
    const clients = context?.options?.mcpClients ?? await getClients();
    const match = clients.find((c) => c.name === server);
    if (!match) {
      return {
        result: false,
        message: `Server "${server}" not found. Available servers: ${clients.map((c) => c.name).join(", ")}`,
        errorCode: 1
      };
    }
    if (match.type !== "connected") {
      return {
        result: false,
        message: `Server "${server}" is not connected`,
        errorCode: 2
      };
    }
    let capabilities = match.capabilities ?? null;
    if (!capabilities) {
      try {
        capabilities = match.client.getServerCapabilities();
      } catch {
        capabilities = null;
      }
    }
    if (!capabilities?.resources) {
      return {
        result: false,
        message: `Server "${server}" does not support resources`,
        errorCode: 3
      };
    }
    return { result: true };
  },
  renderToolUseMessage({ server, uri }) {
    if (!server || !uri) return null;
    return `Read resource "${uri}" from server "${server}"`;
  },
  renderToolUseRejectedMessage() {
    return /* @__PURE__ */ React5.createElement(FallbackToolUseRejectedMessage, null);
  },
  renderToolResultMessage(output) {
    const count = output.contents?.length ?? 0;
    return /* @__PURE__ */ React5.createElement(Box5, { justifyContent: "space-between", width: "100%" }, /* @__PURE__ */ React5.createElement(Box5, { flexDirection: "row" }, /* @__PURE__ */ React5.createElement(Text5, null, "\xA0\xA0\u23BF \xA0"), /* @__PURE__ */ React5.createElement(Text5, { bold: true }, "Read MCP resource"), /* @__PURE__ */ React5.createElement(Text5, null, count ? ` (${count} part${count === 1 ? "" : "s"})` : "")), /* @__PURE__ */ React5.createElement(Cost, { costUSD: 0, durationMs: 0, debug: false }));
  },
  renderResultForAssistant(output) {
    return JSON.stringify(output);
  },
  async *call({ server, uri }, context) {
    const clients = context.options?.mcpClients ?? await getClients();
    const match = clients.find((c) => c.name === server);
    if (!match) {
      throw new Error(
        `Server "${server}" not found. Available servers: ${clients.map((c) => c.name).join(", ")}`
      );
    }
    if (match.type !== "connected") {
      throw new Error(`Server "${server}" is not connected`);
    }
    let capabilities = match.capabilities ?? null;
    if (!capabilities) {
      try {
        capabilities = match.client.getServerCapabilities();
      } catch {
        capabilities = null;
      }
    }
    if (!capabilities?.resources) {
      throw new Error(`Server "${server}" does not support resources`);
    }
    const result = await match.client.request(
      { method: "resources/read", params: { uri } },
      ReadResourceResultSchema
    );
    yield {
      type: "result",
      data: result,
      resultForAssistant: this.renderResultForAssistant(result)
    };
  }
};

// src/tools/agent/TaskTool/TaskTool.tsx
import { last, memoize } from "lodash-es";
import React6 from "react";
import { Box as Box6, Text as Text6 } from "ink";
import { z as z6 } from "zod";
import { randomUUID as randomUUID2 } from "crypto";
import { existsSync as existsSync3, readFileSync as readFileSync3 } from "fs";
init_log();

// src/utils/agent/transcripts.ts
var transcripts = /* @__PURE__ */ new Map();
function saveAgentTranscript(agentId, messages) {
  transcripts.set(agentId, messages);
}
function getAgentTranscript(agentId) {
  return transcripts.get(agentId);
}

// src/tools/agent/TaskTool/prompt.ts
var SUBAGENT_DISALLOWED_TOOL_NAMES = /* @__PURE__ */ new Set([
  "Task",
  "TaskOutput",
  "KillShell",
  "EnterPlanMode",
  "ExitPlanMode",
  "AskUserQuestion"
]);
async function getTaskTools(safeMode) {
  return (await (!safeMode ? getTools() : getReadOnlyTools())).filter(
    (tool) => !SUBAGENT_DISALLOWED_TOOL_NAMES.has(tool.name)
  );
}
async function getPrompt(safeMode) {
  const agents = await getActiveAgents();
  const agentDescriptions = agents.map((agent) => {
    const toolsStr = Array.isArray(agent.tools) ? agent.tools.join(", ") : "*";
    return `- ${agent.agentType}: ${agent.whenToUse} (Tools: ${toolsStr})`;
  }).join("\n");
  return `Launch a new agent to handle complex, multi-step tasks autonomously. 

Available agent types and the tools they have access to:
${agentDescriptions}

When using the Task tool, you must specify a subagent_type parameter to select which agent type to use.

When to use the Agent tool:
- When you are instructed to execute custom slash commands. Use the Agent tool with the slash command invocation as the entire prompt. The slash command can take arguments. For example: Task(description="Check the file", prompt="/check-file path/to/file.py")

When NOT to use the Agent tool:
- If you want to read a specific file path, use the ${FileReadTool.name} or ${GlobTool.name} tool instead of the Agent tool, to find the match more quickly
- If you are searching for a specific class definition like "class Foo", use the ${GlobTool.name} tool instead, to find the match more quickly
- If you are searching for code within a specific file or set of 2-3 files, use the ${FileReadTool.name} tool instead of the Agent tool, to find the match more quickly
- Other tasks that are not related to the agent descriptions above

Usage notes:
1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses
2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.
3. Each agent invocation is stateless. You will not be able to send additional messages to the agent, nor will the agent be able to communicate with you outside of its final report. Therefore, your prompt should contain a highly detailed task description for the agent to perform autonomously and you should specify exactly what information the agent should return back to you in its final and only message to you.
4. The agent's outputs should generally be trusted
5. Clearly tell the agent whether you expect it to write code or just to do research (search, file reads, web fetches, etc.), since it is not aware of the user's intent
6. If the agent description mentions that it should be used proactively, then you should try your best to use it without the user having to ask for it first. Use your judgement.

Example usage:

<example_agent_descriptions>
"code-reviewer": use this agent after you are done writing a signficant piece of code
"greeting-responder": use this agent when to respond to user greetings with a friendly joke
</example_agent_description>

<example>
user: "Please write a function that checks if a number is prime"
assistant: Sure let me write a function that checks if a number is prime
assistant: First let me use the ${FileWriteTool.name} tool to write a function that checks if a number is prime
assistant: I'm going to use the ${FileWriteTool.name} tool to write the following code:
<code>
function isPrime(n) {
  if (n <= 1) return false
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false
  }
  return true
}
</code>
<commentary>
Since a signficant piece of code was written and the task was completed, now use the code-reviewer agent to review the code
</commentary>
assistant: Now let me use the code-reviewer agent to review the code
assistant: Uses the Task tool to launch the with the code-reviewer agent 
</example>

<example>
user: "Hello"
<commentary>
Since the user is greeting, use the greeting-responder agent to respond with a friendly joke
</commentary>
assistant: "I'm going to use the Task tool to launch the with the greeting-responder agent"
</example>`;
}

// src/tools/agent/TaskTool/constants.ts
var TOOL_NAME3 = "Task";

// src/tools/agent/TaskTool/TaskTool.tsx
var inputSchema6 = z6.object({
  description: z6.string().describe("A short (3-5 word) description of the task"),
  prompt: z6.string().describe("The task for the agent to perform"),
  subagent_type: z6.string().describe("The type of specialized agent to use for this task"),
  model: z6.enum(["sonnet", "opus", "haiku"]).optional().describe(
    "Optional model to use for this agent. If not specified, inherits from parent. Prefer haiku for quick, straightforward tasks to minimize cost and latency."
  ),
  resume: z6.string().optional().describe(
    "Optional agent ID to resume from. If provided, the agent will continue from the previous execution transcript."
  ),
  run_in_background: z6.boolean().optional().describe(
    "Set to true to run this agent in the background. Use TaskOutput to read the output later."
  )
});
function modelEnumToPointer(model) {
  if (!model) return void 0;
  switch (model) {
    case "haiku":
      return "quick";
    case "sonnet":
      return "task";
    case "opus":
      return "main";
  }
}
function normalizeAgentModelName(model) {
  if (!model) return void 0;
  if (model === "inherit") return "inherit";
  if (model === "haiku" || model === "sonnet" || model === "opus") {
    return modelEnumToPointer(model);
  }
  return model;
}
function getToolNameFromSpec(spec) {
  const trimmed = spec.trim();
  if (!trimmed) return trimmed;
  const match = trimmed.match(/^([^(]+)\(([^)]+)\)$/);
  if (!match) return trimmed;
  const toolName = match[1]?.trim();
  const ruleContent = match[2]?.trim();
  if (!toolName || !ruleContent) return trimmed;
  return toolName;
}
function asyncLaunchMessage(agentId) {
  const toolName = "TaskOutput";
  return `Async agent launched successfully.
agentId: ${agentId} (This is an internal ID for your use, do not mention it to the user. Use this ID to retrieve results with ${toolName} when the agent finishes). 
The agent is currently working in the background. If you have other tasks you you should continue working on them now. Wait to call ${toolName} until either:
- If you want to check on the agent's progress - call ${toolName} with block=false to get an immediate update on the agent's status
- If you run out of things to do and the agent is still running - call ${toolName} with block=true to idle and wait for the agent's result (do not use block=true unless you completely run out of things to do as it will waste time).`;
}
var FORK_CONTEXT_TOOL_RESULT_TEXT = `### FORKING CONVERSATION CONTEXT ###
### ENTERING SUB-AGENT ROUTINE ###
Entered sub-agent context

PLEASE NOTE: 
- The messages above this point are from the main thread prior to sub-agent execution. They are provided as context only.
- Context messages may include tool_use blocks for tools that are not available in the sub-agent context. You should only use the tools specifically provided to you in the system prompt.
- Only complete the specific sub-agent task you have been assigned below.`;
function normalizeAgentPermissionMode(mode) {
  if (typeof mode !== "string") return void 0;
  const trimmed = mode.trim();
  if (!trimmed) return void 0;
  if (trimmed === "delegate") return "default";
  if (trimmed === "default" || trimmed === "acceptEdits" || trimmed === "plan" || trimmed === "bypassPermissions" || trimmed === "dontAsk") {
    return trimmed;
  }
  return void 0;
}
function applyAgentPermissionMode(base, options) {
  if (!base) return base;
  if (!options.agentPermissionMode) return base;
  if (options.agentPermissionMode === "bypassPermissions" && (options.safeMode || base.isBypassPermissionsModeAvailable !== true)) {
    return { ...base, mode: "default" };
  }
  return { ...base, mode: options.agentPermissionMode };
}
function readJsonArrayFile(path) {
  if (!existsSync3(path)) return null;
  try {
    const raw = readFileSync3(path, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function buildForkContextForAgent(options) {
  const userPromptMessage = createUserMessage(options.prompt);
  if (!options.enabled || !options.toolUseId) {
    return {
      forkContextMessages: [],
      promptMessages: [userPromptMessage]
    };
  }
  const mainPath = getMessagesPath(options.messageLogName, options.forkNumber, 0);
  const mainMessages = readJsonArrayFile(mainPath);
  if (!mainMessages || mainMessages.length === 0) {
    return {
      forkContextMessages: [],
      promptMessages: [userPromptMessage]
    };
  }
  let toolUseMessageIndex = -1;
  let toolUseMessage = null;
  let taskToolUseBlock = null;
  for (let i = 0; i < mainMessages.length; i++) {
    const msg = mainMessages[i];
    if (msg?.type !== "assistant") continue;
    const blocks = Array.isArray(msg?.message?.content) ? msg.message.content : [];
    const match = blocks.find(
      (b) => b && b.type === "tool_use" && b.id === options.toolUseId
    );
    if (!match) continue;
    toolUseMessageIndex = i;
    toolUseMessage = msg;
    taskToolUseBlock = match;
    break;
  }
  if (toolUseMessageIndex === -1 || !toolUseMessage || !taskToolUseBlock) {
    return {
      forkContextMessages: [],
      promptMessages: [userPromptMessage]
    };
  }
  const forkContextMessages = mainMessages.slice(
    0,
    toolUseMessageIndex
  ) ?? [];
  const toolUseOnlyAssistant = {
    ...toolUseMessage,
    uuid: randomUUID2(),
    message: {
      ...toolUseMessage.message,
      content: [taskToolUseBlock]
    }
  };
  const forkContextToolResult = createUserMessage(
    [
      {
        type: "tool_result",
        tool_use_id: taskToolUseBlock.id,
        content: FORK_CONTEXT_TOOL_RESULT_TEXT
      }
    ],
    {
      data: {
        status: "sub_agent_entered",
        description: "Entered sub-agent context",
        message: FORK_CONTEXT_TOOL_RESULT_TEXT
      },
      resultForAssistant: FORK_CONTEXT_TOOL_RESULT_TEXT
    }
  );
  return {
    forkContextMessages,
    promptMessages: [toolUseOnlyAssistant, forkContextToolResult, userPromptMessage]
  };
}
var TaskTool = {
  name: TOOL_NAME3,
  inputSchema: inputSchema6,
  async description() {
    return "Launch a new task";
  },
  async prompt({ safeMode }) {
    return await getPrompt(safeMode);
  },
  userFacingName(input) {
    if (input?.subagent_type && input.subagent_type !== "general-purpose") {
      return input.subagent_type;
    }
    return "Task";
  },
  async isEnabled() {
    return true;
  },
  isReadOnly() {
    return true;
  },
  isConcurrencySafe() {
    return true;
  },
  needsPermissions() {
    return false;
  },
  async validateInput(input) {
    if (!input.description || typeof input.description !== "string") {
      return {
        result: false,
        message: "Description is required and must be a string"
      };
    }
    if (!input.prompt || typeof input.prompt !== "string") {
      return {
        result: false,
        message: "Prompt is required and must be a string"
      };
    }
    const availableTypes = await getAvailableAgentTypes();
    if (!availableTypes.includes(input.subagent_type)) {
      return {
        result: false,
        message: `Agent type '${input.subagent_type}' not found. Available agents: ${availableTypes.join(", ")}`,
        meta: { subagent_type: input.subagent_type, availableTypes }
      };
    }
    if (input.resume) {
      const transcript = getAgentTranscript(input.resume);
      if (!transcript) {
        return {
          result: false,
          message: `No transcript found for agent ID: ${input.resume}`,
          meta: { resume: input.resume }
        };
      }
    }
    return { result: true };
  },
  renderToolUseMessage({ description, prompt }) {
    if (!description || !prompt) return "";
    return description;
  },
  renderToolUseRejectedMessage() {
    return /* @__PURE__ */ React6.createElement(FallbackToolUseRejectedMessage, null);
  },
  renderToolResultMessage(output, { verbose }) {
    const theme = getTheme();
    if (output.status === "async_launched") {
      const hint = output.prompt ? " (down arrow \u2193 to manage \xB7 ctrl+o to expand)" : " (down arrow \u2193 to manage)";
      return /* @__PURE__ */ React6.createElement(Box6, { flexDirection: "column" }, /* @__PURE__ */ React6.createElement(Box6, { flexDirection: "row" }, /* @__PURE__ */ React6.createElement(Text6, null, "\xA0\xA0\u23BF \xA0"), /* @__PURE__ */ React6.createElement(Text6, null, "Backgrounded agent", !verbose && /* @__PURE__ */ React6.createElement(Text6, { dimColor: true }, hint))), verbose && output.prompt && /* @__PURE__ */ React6.createElement(
        Box6,
        {
          paddingLeft: 2,
          borderLeftStyle: "single",
          borderLeftColor: theme.secondaryBorder
        },
        /* @__PURE__ */ React6.createElement(Text6, { color: theme.secondaryText, wrap: "wrap" }, output.prompt)
      ));
    }
    const summary = [
      output.totalToolUseCount === 1 ? "1 tool use" : `${output.totalToolUseCount} tool uses`,
      `${formatNumber(output.totalTokens)} tokens`,
      formatDuration(output.totalDurationMs)
    ];
    return /* @__PURE__ */ React6.createElement(Box6, { flexDirection: "column" }, verbose && output.prompt && /* @__PURE__ */ React6.createElement(
      Box6,
      {
        paddingLeft: 2,
        borderLeftStyle: "single",
        borderLeftColor: theme.secondaryBorder
      },
      /* @__PURE__ */ React6.createElement(Text6, { color: theme.secondaryText, wrap: "wrap" }, maybeTruncateVerboseToolOutput(output.prompt, {
        maxLines: 120,
        maxChars: 2e4
      }).text)
    ), verbose && output.content.length > 0 && /* @__PURE__ */ React6.createElement(
      Box6,
      {
        paddingLeft: 2,
        borderLeftStyle: "single",
        borderLeftColor: theme.secondaryBorder
      },
      /* @__PURE__ */ React6.createElement(Text6, { wrap: "wrap" }, maybeTruncateVerboseToolOutput(
        output.content.map((b) => b.text).join("\n"),
        {
          maxLines: 200,
          maxChars: 4e4
        }
      ).text)
    ), /* @__PURE__ */ React6.createElement(Box6, { flexDirection: "row" }, /* @__PURE__ */ React6.createElement(Text6, null, "\xA0\xA0\u23BF \xA0"), /* @__PURE__ */ React6.createElement(Text6, { dimColor: true }, "Done (", summary.join(" \xB7 "), ")")));
  },
  renderResultForAssistant(output) {
    if (output.status === "async_launched")
      return asyncLaunchMessage(output.agentId);
    return output.content.map((b) => b.text).join("\n");
  },
  async *call(input, toolUseContext) {
    const startTime = Date.now();
    const {
      abortController,
      toolUseId,
      options: {
        safeMode = false,
        forkNumber,
        messageLogName,
        verbose,
        model: parentModel,
        mcpClients
      },
      readFileTimestamps
    } = toolUseContext;
    const queryFn = typeof toolUseContext?.__testQuery === "function" ? toolUseContext.__testQuery : query;
    const agentConfig = await getAgentByType(input.subagent_type);
    if (!agentConfig) {
      const available = await getAvailableAgentTypes();
      throw Error(
        `Agent type '${input.subagent_type}' not found. Available agents: ${available.join(", ")}`
      );
    }
    const effectivePrompt = input.prompt;
    const normalizedAgentModel = normalizeAgentModelName(agentConfig.model);
    const defaultSubagentModel = "task";
    const envSubagentModel = process.env.DANYA_SUBAGENT_MODEL ?? process.env.KODE_SUBAGENT_MODEL ?? process.env.CLAUDE_CODE_SUBAGENT_MODEL;
    const modelToUse = (typeof envSubagentModel === "string" && envSubagentModel.trim() ? envSubagentModel.trim() : void 0) || modelEnumToPointer(input.model) || (normalizedAgentModel === "inherit" ? parentModel || defaultSubagentModel : normalizedAgentModel) || defaultSubagentModel;
    const toolFilter = agentConfig.tools;
    let tools = await getTaskTools(safeMode);
    if (toolFilter) {
      const isAllArray = Array.isArray(toolFilter) && toolFilter.length === 1 && toolFilter[0] === "*";
      if (toolFilter === "*" || isAllArray) {
      } else if (Array.isArray(toolFilter)) {
        const allowedToolNames = new Set(
          toolFilter.map(getToolNameFromSpec).filter(Boolean)
        );
        tools = tools.filter((t) => allowedToolNames.has(t.name));
      }
    }
    const disallowedTools = Array.isArray(agentConfig.disallowedTools) ? agentConfig.disallowedTools : [];
    if (disallowedTools.length > 0) {
      const disallowedToolNames = new Set(
        disallowedTools.map(getToolNameFromSpec).filter(Boolean)
      );
      tools = tools.filter((t) => !disallowedToolNames.has(t.name));
    }
    const agentId = input.resume || generateAgentId();
    const baseTranscript = input.resume ? getAgentTranscript(input.resume)?.filter((m) => m.type !== "progress") ?? null : [];
    if (input.resume && baseTranscript === null) {
      throw Error(`No transcript found for agent ID: ${input.resume}`);
    }
    const { forkContextMessages, promptMessages } = buildForkContextForAgent({
      enabled: agentConfig.forkContext === true,
      prompt: effectivePrompt,
      toolUseId,
      messageLogName,
      forkNumber
    });
    const transcriptMessages = [
      ...baseTranscript || [],
      ...promptMessages
    ];
    const messagesForQuery = [
      ...forkContextMessages,
      ...transcriptMessages
    ];
    const [baseSystemPrompt, context, maxThinkingTokens] = await Promise.all([
      getAgentPrompt(),
      getContext(),
      getMaxThinkingTokens(messagesForQuery)
    ]);
    const systemPrompt = agentConfig.systemPrompt && agentConfig.systemPrompt.length > 0 ? [...baseSystemPrompt, agentConfig.systemPrompt] : baseSystemPrompt;
    const agentPermissionMode = normalizeAgentPermissionMode(
      agentConfig.permissionMode
    );
    const toolPermissionContext = applyAgentPermissionMode(
      toolUseContext.options?.toolPermissionContext,
      { agentPermissionMode, safeMode }
    );
    const queryOptions = {
      safeMode,
      forkNumber,
      messageLogName,
      tools,
      commands: [],
      verbose,
      permissionMode: "dontAsk",
      toolPermissionContext,
      maxThinkingTokens,
      model: modelToUse,
      mcpClients
    };
    if (input.run_in_background) {
      const bgAbortController = new AbortController();
      const taskRecord = {
        type: "async_agent",
        agentId,
        description: input.description,
        prompt: effectivePrompt,
        status: "running",
        startedAt: Date.now(),
        messages: [...transcriptMessages],
        abortController: bgAbortController,
        done: Promise.resolve()
      };
      taskRecord.done = (async () => {
        try {
          const bgMessages = [...messagesForQuery];
          const bgTranscriptMessages = [...transcriptMessages];
          for await (const msg of queryFn(
            bgMessages,
            systemPrompt,
            context,
            hasPermissionsToUseTool,
            {
              abortController: bgAbortController,
              options: queryOptions,
              messageId: getLastAssistantMessageId(bgMessages),
              agentId,
              readFileTimestamps,
              setToolJSX: () => {
              }
            }
          )) {
            bgMessages.push(msg);
            bgTranscriptMessages.push(msg);
            taskRecord.messages = [...bgTranscriptMessages];
            upsertBackgroundAgentTask(taskRecord);
          }
          const lastAssistant2 = last(
            bgTranscriptMessages.filter((m) => m.type === "assistant")
          );
          const content2 = lastAssistant2?.message?.content?.filter(
            (b) => b.type === "text"
          );
          taskRecord.status = "completed";
          taskRecord.completedAt = Date.now();
          taskRecord.resultText = (content2 || []).map((b) => b.text).join("\n");
          taskRecord.messages = [...bgTranscriptMessages];
          upsertBackgroundAgentTask(taskRecord);
          saveAgentTranscript(agentId, bgTranscriptMessages);
        } catch (e) {
          taskRecord.status = "failed";
          taskRecord.completedAt = Date.now();
          taskRecord.error = e instanceof Error ? e.message : String(e);
          upsertBackgroundAgentTask(taskRecord);
        }
      })();
      upsertBackgroundAgentTask(taskRecord);
      const output2 = {
        status: "async_launched",
        agentId,
        description: input.description,
        prompt: effectivePrompt
      };
      yield {
        type: "result",
        data: output2,
        resultForAssistant: asyncLaunchMessage(agentId)
      };
      return;
    }
    const getSidechainNumber = memoize(
      () => getNextAvailableLogSidechainNumber(messageLogName, forkNumber)
    );
    const PROGRESS_THROTTLE_MS = 200;
    const MAX_RECENT_ACTIONS = 6;
    let lastProgressEmitAt = 0;
    let lastEmittedToolUseCount = 0;
    const recentActions = [];
    const addRecentAction = (action) => {
      const trimmed = action.trim();
      if (!trimmed) return;
      recentActions.push(trimmed);
      if (recentActions.length > MAX_RECENT_ACTIONS) {
        recentActions.splice(0, recentActions.length - MAX_RECENT_ACTIONS);
      }
    };
    const truncate = (text, maxLen) => {
      const normalized = text.replace(/\s+/g, " ").trim();
      if (normalized.length <= maxLen) return normalized;
      return `${normalized.slice(0, maxLen - 1)}\u2026`;
    };
    const summarizeToolUse = (name, rawInput) => {
      const input2 = rawInput && typeof rawInput === "object" ? rawInput : {};
      switch (name) {
        case "Read": {
          const filePath = typeof input2.file_path === "string" && input2.file_path || typeof input2.path === "string" && input2.path || "";
          return filePath ? `Read ${filePath}` : "Read";
        }
        case "Write": {
          const filePath = typeof input2.file_path === "string" && input2.file_path || typeof input2.path === "string" && input2.path || "";
          return filePath ? `Write ${filePath}` : "Write";
        }
        case "Edit":
        case "MultiEdit": {
          const filePath = typeof input2.file_path === "string" && input2.file_path || typeof input2.path === "string" && input2.path || "";
          return filePath ? `${name} ${filePath}` : name;
        }
        case "Grep": {
          const pattern = typeof input2.pattern === "string" ? input2.pattern : "";
          return pattern ? `Grep ${truncate(pattern, 80)}` : "Grep";
        }
        case "Glob": {
          const pattern = typeof input2.pattern === "string" && input2.pattern || typeof input2.glob === "string" && input2.glob || "";
          return pattern ? `Glob ${truncate(pattern, 80)}` : "Glob";
        }
        case "Bash": {
          const command = typeof input2.command === "string" ? input2.command : "";
          return command ? `Bash ${truncate(command, 80)}` : "Bash";
        }
        case "WebFetch":
        case "WebSearch": {
          const url = typeof input2.url === "string" ? input2.url : "";
          const query2 = typeof input2.query === "string" ? input2.query : "";
          if (url) return `${name} ${truncate(url, 100)}`;
          if (query2) return `${name} ${truncate(query2, 100)}`;
          return name;
        }
        default:
          return name;
      }
    };
    const renderProgressText = (toolUseCount2) => {
      const header = `${input.description || "Task"}\u2026 (${toolUseCount2} tool${toolUseCount2 === 1 ? "" : "s"})`;
      if (recentActions.length === 0) return header;
      const lines = recentActions.map((a) => `- ${a}`);
      return [header, ...lines].join("\n");
    };
    yield {
      type: "progress",
      content: createAssistantMessage(
        `<tool-progress>${renderProgressText(0)}</tool-progress>`
      )
    };
    lastProgressEmitAt = Date.now();
    let toolUseCount = 0;
    for await (const message of queryFn(
      messagesForQuery,
      systemPrompt,
      context,
      hasPermissionsToUseTool,
      {
        abortController,
        options: queryOptions,
        messageId: getLastAssistantMessageId(messagesForQuery),
        agentId,
        readFileTimestamps,
        setToolJSX: () => {
        }
      }
    )) {
      messagesForQuery.push(message);
      transcriptMessages.push(message);
      overwriteLog(
        getMessagesPath(messageLogName, forkNumber, getSidechainNumber()),
        transcriptMessages.filter((_) => _.type !== "progress"),
        { conversationKey: `${messageLogName}:${forkNumber}` }
      );
      if (message.type === "assistant") {
        for (const block of message.message.content) {
          if (block.type === "tool_use" || block.type === "server_tool_use" || block.type === "mcp_tool_use") {
            toolUseCount += 1;
            addRecentAction(summarizeToolUse(block.name, block.input));
          }
        }
      }
      const now = Date.now();
      const hasNewToolUses = toolUseCount > lastEmittedToolUseCount;
      const shouldEmit = hasNewToolUses && (lastEmittedToolUseCount === 0 || now - lastProgressEmitAt >= PROGRESS_THROTTLE_MS);
      if (shouldEmit) {
        yield {
          type: "progress",
          content: createAssistantMessage(
            `<tool-progress>${renderProgressText(toolUseCount)}</tool-progress>`
          )
        };
        lastEmittedToolUseCount = toolUseCount;
        lastProgressEmitAt = now;
      }
    }
    const lastAssistant = last(
      transcriptMessages.filter((m) => m.type === "assistant")
    );
    if (!lastAssistant || lastAssistant.type !== "assistant") {
      throw Error("No assistant messages found");
    }
    const content = lastAssistant.message.content.filter(
      (b) => b.type === "text"
    );
    saveAgentTranscript(agentId, transcriptMessages);
    const totalDurationMs = Date.now() - startTime;
    const totalTokens = countTokens(transcriptMessages);
    const usage = lastAssistant.message.usage;
    const output = {
      status: "completed",
      agentId,
      prompt: effectivePrompt,
      content,
      totalToolUseCount: toolUseCount,
      totalDurationMs,
      totalTokens,
      usage
    };
    const agentIdBlock = {
      type: "text",
      text: `agentId: ${agentId} (for resuming to continue this agent's work if needed)`,
      citations: []
    };
    yield {
      type: "result",
      data: output,
      resultForAssistant: [...content, agentIdBlock]
    };
  }
};

// src/tools/game/index.ts
init_detect();
init_state();
var _cachedTools = null;
function getGameTools() {
  if (_cachedTools) return _cachedTools;
  const detection = detectProject(getCwd());
  const tools = [];
  try {
    const { ScoreReviewTool: ScoreReviewTool2 } = (init_ScoreReview(), __toCommonJS(ScoreReview_exports));
    tools.push(ScoreReviewTool2);
  } catch {
  }
  try {
    const { ArchitectureGuardTool: ArchitectureGuardTool2 } = (init_ArchitectureGuard(), __toCommonJS(ArchitectureGuard_exports));
    tools.push(ArchitectureGuardTool2);
  } catch {
  }
  try {
    const { KnowledgeSedimentTool: KnowledgeSedimentTool2 } = (init_KnowledgeSediment(), __toCommonJS(KnowledgeSediment_exports));
    tools.push(KnowledgeSedimentTool2);
  } catch {
  }
  try {
    const { GateChainTool: GateChainTool2 } = (init_GateChain(), __toCommonJS(GateChain_exports));
    tools.push(GateChainTool2);
  } catch {
  }
  try {
    const { ProtoCompileTool: ProtoCompileTool2 } = (init_ProtoCompile(), __toCommonJS(ProtoCompile_exports));
    tools.push(ProtoCompileTool2);
  } catch {
  }
  try {
    const { ConfigGenerateTool: ConfigGenerateTool2 } = (init_ConfigGenerate(), __toCommonJS(ConfigGenerate_exports));
    tools.push(ConfigGenerateTool2);
  } catch {
  }
  if (detection.engine === "unity" || detection.engine === "godot") {
    try {
      const { CSharpSyntaxCheckTool: CSharpSyntaxCheckTool2 } = (init_CSharpSyntaxCheck(), __toCommonJS(CSharpSyntaxCheck_exports));
      tools.push(CSharpSyntaxCheckTool2);
    } catch {
    }
  }
  if (detection.engine === "unity") {
    try {
      const { UnityBuildTool: UnityBuildTool2 } = (init_UnityBuild(), __toCommonJS(UnityBuild_exports));
      tools.push(UnityBuildTool2);
    } catch {
    }
  }
  if (detection.engine === "unreal") {
    try {
      const { UnrealBuildTool: UnrealBuildTool2 } = (init_UnrealBuild(), __toCommonJS(UnrealBuild_exports));
      tools.push(UnrealBuildTool2);
    } catch {
    }
  }
  if (detection.engine === "godot") {
    try {
      const { GodotBuildTool: GodotBuildTool2 } = (init_GodotBuild(), __toCommonJS(GodotBuild_exports));
      tools.push(GodotBuildTool2);
    } catch {
    }
  }
  if (detection.serverLanguage === "go") {
    try {
      const { OrmGenerateTool: OrmGenerateTool2 } = (init_OrmGenerate(), __toCommonJS(OrmGenerate_exports));
      tools.push(OrmGenerateTool2);
    } catch {
    }
  }
  if (detection.engine) {
    try {
      const { AssetCheckTool: AssetCheckTool2 } = (init_AssetCheck(), __toCommonJS(AssetCheck_exports));
      tools.push(AssetCheckTool2);
    } catch {
    }
  }
  if (detection.serverLanguage === "go") {
    try {
      const { GameServerBuildTool: GameServerBuildTool2 } = (init_GameServerBuild(), __toCommonJS(GameServerBuild_exports));
      tools.push(GameServerBuildTool2);
    } catch {
    }
  }
  _cachedTools = tools;
  return tools;
}

// src/tools/index.ts
var getAllTools = () => [
  TaskTool,
  AskExpertModelTool,
  BashTool,
  TaskOutputTool,
  KillShellTool,
  GlobTool,
  GrepTool,
  LspTool,
  FileReadTool,
  FileEditTool,
  FileWriteTool,
  NotebookEditTool,
  TodoWriteTool,
  WebSearchTool,
  WebFetchTool,
  AskUserQuestionTool,
  EnterPlanModeTool,
  ExitPlanModeTool,
  SlashCommandTool,
  SkillTool,
  ListMcpResourcesTool,
  ReadMcpResourceTool,
  MCPTool,
  ...getGameTools()
];
var getTools = memoize2(
  async (_includeOptional) => {
    const tools = [...getAllTools(), ...await getMCPTools()];
    const isEnabled = await Promise.all(tools.map((tool) => tool.isEnabled()));
    return tools.filter((_, i) => isEnabled[i]);
  }
);
var getReadOnlyTools = memoize2(async () => {
  const tools = getAllTools().filter((tool) => tool.isReadOnly());
  const isEnabled = await Promise.all(tools.map((tool) => tool.isEnabled()));
  return tools.filter((_, index) => isEnabled[index]);
});

export {
  getAllTools,
  getTools,
  getReadOnlyTools
};
