import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  SESSION_ID,
  init_log
} from "./chunk-N4NKN7KX.js";
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/log/debugLogger.ts
import { existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { format } from "node:util";
import chalk from "chalk";
function getProjectDir(cwd) {
  return cwd.replace(/[^a-zA-Z0-9]/g, "-");
}
function ensureDebugDir() {
  const debugDir = DEBUG_PATHS.base();
  if (!existsSync(debugDir)) {
    mkdirSync(debugDir, { recursive: true });
  }
}
function terminalLog(...args) {
  process.stderr.write(`${format(...args)}
`);
}
function writeToFile(filePath, entry) {
  if (!isDebugMode()) return;
  try {
    ensureDebugDir();
    const logLine = JSON.stringify(
      {
        ...entry,
        sessionId: SESSION_ID,
        pid: process.pid,
        uptime: Date.now() - REQUEST_START_TIME
      },
      null,
      2
    ) + ",\n";
    appendFileSync(filePath, logLine);
  } catch (error) {
  }
}
function getDedupeKey(level, phase, data) {
  if (phase.startsWith("CONFIG_")) {
    const file = data?.file || "";
    return `${level}:${phase}:${file}`;
  }
  return `${level}:${phase}`;
}
function shouldLogWithDedupe(level, phase, data) {
  const key = getDedupeKey(level, phase, data);
  const now = Date.now();
  const lastLogTime = recentLogs.get(key);
  if (!lastLogTime || now - lastLogTime > LOG_DEDUPE_WINDOW_MS) {
    recentLogs.set(key, now);
    for (const [oldKey, oldTime] of recentLogs.entries()) {
      if (now - oldTime > LOG_DEDUPE_WINDOW_MS) {
        recentLogs.delete(oldKey);
      }
    }
    return true;
  }
  return false;
}
function formatMessages(messages) {
  if (Array.isArray(messages)) {
    const recentMessages = messages.slice(-5);
    return recentMessages.map((msg, index) => {
      const role = msg.role || "unknown";
      let content = "";
      if (typeof msg.content === "string") {
        content = msg.content.length > 300 ? msg.content.substring(0, 300) + "..." : msg.content;
      } else if (typeof msg.content === "object") {
        content = "[complex_content]";
      } else {
        content = String(msg.content || "");
      }
      const totalIndex = messages.length - recentMessages.length + index;
      return `[${totalIndex}] ${chalk.dim(role)}: ${content}`;
    }).join("\n    ");
  }
  if (typeof messages === "string") {
    try {
      const parsed = JSON.parse(messages);
      if (Array.isArray(parsed)) {
        return formatMessages(parsed);
      }
    } catch {
    }
  }
  if (typeof messages === "string" && messages.length > 200) {
    return messages.substring(0, 200) + "...";
  }
  return typeof messages === "string" ? messages : JSON.stringify(messages);
}
function shouldShowInTerminal(level) {
  if (!isDebugMode()) return false;
  if (isDebugVerboseMode()) {
    return DEBUG_VERBOSE_TERMINAL_LOG_LEVELS.has(level);
  }
  return TERMINAL_LOG_LEVELS.has(level);
}
function logToTerminal(entry) {
  if (!shouldShowInTerminal(entry.level)) return;
  const { level, phase, data, requestId, elapsed } = entry;
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(11, 23);
  let prefix = "";
  let color = chalk.gray;
  switch (level) {
    case "FLOW" /* FLOW */:
      prefix = "\u{1F504}";
      color = chalk.cyan;
      break;
    case "API" /* API */:
      prefix = "\u{1F310}";
      color = chalk.yellow;
      break;
    case "STATE" /* STATE */:
      prefix = "\u{1F4CA}";
      color = chalk.blue;
      break;
    case "ERROR" /* ERROR */:
      prefix = "\u274C";
      color = chalk.red;
      break;
    case "WARN" /* WARN */:
      prefix = "\u26A0\uFE0F";
      color = chalk.yellow;
      break;
    case "INFO" /* INFO */:
      prefix = "\u2139\uFE0F";
      color = chalk.green;
      break;
    case "TRACE" /* TRACE */:
      prefix = "\u{1F4C8}";
      color = chalk.magenta;
      break;
    default:
      prefix = "\u{1F50D}";
      color = chalk.gray;
  }
  const reqId = requestId ? chalk.dim(`[${requestId}]`) : "";
  const elapsedStr = elapsed !== void 0 ? chalk.dim(`+${elapsed}ms`) : "";
  let dataStr = "";
  if (typeof data === "object" && data !== null) {
    if (data.messages) {
      const formattedMessages = formatMessages(data.messages);
      dataStr = JSON.stringify(
        {
          ...data,
          messages: `
    ${formattedMessages}`
        },
        null,
        2
      );
    } else {
      dataStr = JSON.stringify(data, null, 2);
    }
  } else {
    dataStr = typeof data === "string" ? data : JSON.stringify(data);
  }
  terminalLog(
    `${color(`[${timestamp}]`)} ${prefix} ${color(phase)} ${reqId} ${dataStr} ${elapsedStr}`
  );
}
function debugLog(level, phase, data, requestId) {
  if (!isDebugMode()) return;
  if (!shouldLogWithDedupe(level, phase, data)) {
    return;
  }
  const entry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    phase,
    data,
    requestId: requestId || currentRequest?.id,
    elapsed: currentRequest ? Date.now() - currentRequest.startTime : void 0
  };
  writeToFile(DEBUG_PATHS.detailed(), entry);
  switch (level) {
    case "FLOW" /* FLOW */:
      writeToFile(DEBUG_PATHS.flow(), entry);
      break;
    case "API" /* API */:
      writeToFile(DEBUG_PATHS.api(), entry);
      break;
    case "STATE" /* STATE */:
      writeToFile(DEBUG_PATHS.state(), entry);
      break;
  }
  logToTerminal(entry);
}
function getCurrentRequest() {
  return currentRequest;
}
function markPhase(phase, data) {
  if (!currentRequest) return;
  currentRequest.markPhase(phase);
  debug.flow(`PHASE_${phase.toUpperCase()}`, {
    requestId: currentRequest.id,
    elapsed: currentRequest.getPhaseTime(phase),
    data
  });
}
function logAPIError(context) {
  const errorDir = join(DANYA_DIR, "logs", "error", "api");
  if (!existsSync(errorDir)) {
    try {
      mkdirSync(errorDir, { recursive: true });
    } catch (err) {
      terminalLog("Failed to create error log directory:", err);
      return;
    }
  }
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const sanitizedModel = context.model.replace(/[^a-zA-Z0-9-_]/g, "_");
  const filename = `${sanitizedModel}_${timestamp}.log`;
  const filepath = join(errorDir, filename);
  const fullLogContent = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    sessionId: SESSION_ID,
    requestId: getCurrentRequest()?.id,
    model: context.model,
    provider: context.provider,
    endpoint: context.endpoint,
    status: context.status,
    error: context.error,
    request: context.request,
    response: context.response,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  };
  try {
    appendFileSync(filepath, JSON.stringify(fullLogContent, null, 2) + "\n");
    appendFileSync(filepath, "=".repeat(80) + "\n\n");
  } catch (err) {
    terminalLog("Failed to write API error log:", err);
  }
  if (isDebugMode()) {
    debug.error("API_ERROR", {
      model: context.model,
      status: context.status,
      error: typeof context.error === "string" ? context.error : context.error?.message || "Unknown error",
      endpoint: context.endpoint,
      logFile: filename
    });
  }
  if (isVerboseMode() || isDebugVerboseMode()) {
    terminalLog();
    terminalLog(chalk.red("\u2501".repeat(60)));
    terminalLog(chalk.red.bold("\u26A0\uFE0F  API Error"));
    terminalLog(chalk.red("\u2501".repeat(60)));
    terminalLog(chalk.white("  Model:  ") + chalk.yellow(context.model));
    terminalLog(chalk.white("  Status: ") + chalk.red(context.status));
    let errorMessage = "Unknown error";
    if (typeof context.error === "string") {
      errorMessage = context.error;
    } else if (context.error?.message) {
      errorMessage = context.error.message;
    } else if (context.error?.error?.message) {
      errorMessage = context.error.error.message;
    }
    terminalLog(chalk.white("  Error:  ") + chalk.red(errorMessage));
    if (context.response) {
      terminalLog();
      terminalLog(chalk.gray("  Response:"));
      const responseStr = typeof context.response === "string" ? context.response : JSON.stringify(context.response, null, 2);
      responseStr.split("\n").forEach((line) => {
        terminalLog(chalk.gray("    " + line));
      });
    }
    terminalLog();
    terminalLog(chalk.dim(`  \u{1F4C1} Full log: ${filepath}`));
    terminalLog(chalk.red("\u2501".repeat(60)));
    terminalLog();
  }
}
function logLLMInteraction(context) {
  if (!isDebugMode()) return;
  const duration = context.timing.end - context.timing.start;
  terminalLog("\n" + chalk.blue("\u{1F9E0} LLM CALL DEBUG"));
  terminalLog(chalk.gray("\u2501".repeat(60)));
  terminalLog(chalk.yellow("\u{1F4CA} Context Overview:"));
  terminalLog(`   Messages Count: ${context.messages.length}`);
  terminalLog(`   System Prompt Length: ${context.systemPrompt.length} chars`);
  terminalLog(`   Duration: ${duration.toFixed(0)}ms`);
  if (context.usage) {
    terminalLog(
      `   Token Usage: ${context.usage.inputTokens} \u2192 ${context.usage.outputTokens}`
    );
  }
  const apiLabel = context.apiFormat ? ` (${context.apiFormat.toUpperCase()})` : "";
  terminalLog(chalk.cyan(`
\u{1F4AC} Real API Messages${apiLabel} (last 10):`));
  const recentMessages = context.messages.slice(-10);
  recentMessages.forEach((msg, index) => {
    const globalIndex = context.messages.length - recentMessages.length + index;
    const roleColor = msg.role === "user" ? "green" : msg.role === "assistant" ? "blue" : msg.role === "system" ? "yellow" : "gray";
    let content = "";
    let isReminder = false;
    if (typeof msg.content === "string") {
      if (msg.content.includes("<system-reminder>")) {
        isReminder = true;
        const reminderContent = msg.content.replace(/<\/?system-reminder>/g, "").trim();
        content = `\u{1F514} ${reminderContent.length > 800 ? reminderContent.substring(0, 800) + "..." : reminderContent}`;
      } else {
        const maxLength = msg.role === "user" ? 1e3 : msg.role === "system" ? 1200 : 800;
        content = msg.content.length > maxLength ? msg.content.substring(0, maxLength) + "..." : msg.content;
      }
    } else if (Array.isArray(msg.content)) {
      const textBlocks = msg.content.filter(
        (block) => block.type === "text"
      );
      const toolBlocks = msg.content.filter(
        (block) => block.type === "tool_use"
      );
      if (textBlocks.length > 0) {
        const text = textBlocks[0].text || "";
        const maxLength = msg.role === "assistant" ? 1e3 : 800;
        content = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
      }
      if (toolBlocks.length > 0) {
        content += ` [+ ${toolBlocks.length} tool calls]`;
      }
      if (textBlocks.length === 0 && toolBlocks.length === 0) {
        content = `[${msg.content.length} blocks: ${msg.content.map((b) => b.type || "unknown").join(", ")}]`;
      }
    } else {
      content = "[complex_content]";
    }
    if (isReminder) {
      terminalLog(
        `   [${globalIndex}] ${chalk.magenta("\u{1F514} REMINDER")}: ${chalk.dim(content)}`
      );
    } else {
      const roleIcon = msg.role === "user" ? "\u{1F464}" : msg.role === "assistant" ? "\u{1F916}" : msg.role === "system" ? "\u2699\uFE0F" : "\u{1F4C4}";
      terminalLog(
        `   [${globalIndex}] ${chalk[roleColor](roleIcon + " " + msg.role.toUpperCase())}: ${content}`
      );
    }
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      const toolCalls2 = msg.content.filter(
        (block) => block.type === "tool_use"
      );
      if (toolCalls2.length > 0) {
        terminalLog(
          chalk.cyan(
            `       \u{1F527} \u2192 Tool calls (${toolCalls2.length}): ${toolCalls2.map((t) => t.name).join(", ")}`
          )
        );
        toolCalls2.forEach((tool, idx) => {
          const inputStr = JSON.stringify(tool.input || {});
          const maxLength = 200;
          const displayInput = inputStr.length > maxLength ? inputStr.substring(0, maxLength) + "..." : inputStr;
          terminalLog(
            chalk.dim(`         [${idx}] ${tool.name}: ${displayInput}`)
          );
        });
      }
    }
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      terminalLog(
        chalk.cyan(
          `       \u{1F527} \u2192 Tool calls (${msg.tool_calls.length}): ${msg.tool_calls.map((t) => t.function.name).join(", ")}`
        )
      );
      msg.tool_calls.forEach((tool, idx) => {
        const inputStr = tool.function.arguments || "{}";
        const maxLength = 200;
        const displayInput = inputStr.length > maxLength ? inputStr.substring(0, maxLength) + "..." : inputStr;
        terminalLog(
          chalk.dim(`         [${idx}] ${tool.function.name}: ${displayInput}`)
        );
      });
    }
  });
  terminalLog(chalk.magenta("\n\u{1F916} LLM Response:"));
  let responseContent = "";
  let toolCalls = [];
  if (Array.isArray(context.response.content)) {
    const textBlocks = context.response.content.filter(
      (block) => block.type === "text"
    );
    responseContent = textBlocks.length > 0 ? textBlocks[0].text || "" : "";
    toolCalls = context.response.content.filter(
      (block) => block.type === "tool_use"
    );
  } else if (typeof context.response.content === "string") {
    responseContent = context.response.content;
    toolCalls = context.response.tool_calls || context.response.toolCalls || [];
  } else if (context.response.message?.content) {
    if (Array.isArray(context.response.message.content)) {
      const textBlocks = context.response.message.content.filter(
        (block) => block.type === "text"
      );
      responseContent = textBlocks.length > 0 ? textBlocks[0].text || "" : "";
      toolCalls = context.response.message.content.filter(
        (block) => block.type === "tool_use"
      );
    } else if (typeof context.response.message.content === "string") {
      responseContent = context.response.message.content;
    }
  } else {
    responseContent = JSON.stringify(
      context.response.content || context.response || ""
    );
  }
  const maxResponseLength = 1e3;
  const displayContent = responseContent.length > maxResponseLength ? responseContent.substring(0, maxResponseLength) + "..." : responseContent;
  terminalLog(`   Content: ${displayContent}`);
  if (toolCalls.length > 0) {
    const toolNames = toolCalls.map(
      (t) => t.name || t.function?.name || "unknown"
    );
    terminalLog(
      chalk.cyan(
        `   \u{1F527} Tool Calls (${toolCalls.length}): ${toolNames.join(", ")}`
      )
    );
    toolCalls.forEach((tool, index) => {
      const toolName = tool.name || tool.function?.name || "unknown";
      const toolInput = tool.input || tool.function?.arguments || "{}";
      const inputStr = typeof toolInput === "string" ? toolInput : JSON.stringify(toolInput);
      const maxToolInputLength = 300;
      const displayInput = inputStr.length > maxToolInputLength ? inputStr.substring(0, maxToolInputLength) + "..." : inputStr;
      terminalLog(chalk.dim(`     [${index}] ${toolName}: ${displayInput}`));
    });
  }
  terminalLog(
    `   Stop Reason: ${context.response.stop_reason || context.response.finish_reason || "unknown"}`
  );
  terminalLog(chalk.gray("\u2501".repeat(60)));
}
function logSystemPromptConstruction(construction) {
  if (!isDebugMode()) return;
  terminalLog("\n" + chalk.yellow("\u{1F4DD} SYSTEM PROMPT CONSTRUCTION"));
  terminalLog(`   Base Prompt: ${construction.basePrompt.length} chars`);
  if (construction.danyaContext) {
    terminalLog(`   + Danya Context: ${construction.danyaContext.length} chars`);
  }
  if (construction.reminders.length > 0) {
    terminalLog(
      `   + Dynamic Reminders: ${construction.reminders.length} items`
    );
    construction.reminders.forEach((reminder, index) => {
      terminalLog(chalk.dim(`     [${index}] ${reminder.substring(0, 80)}...`));
    });
  }
  terminalLog(`   = Final Length: ${construction.finalPrompt.length} chars`);
}
function logUserFriendly(type, data, requestId) {
  if (!isDebugMode()) return;
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  let message = "";
  let color = chalk.gray;
  let icon = "\u2022";
  switch (type) {
    case "SESSION_START":
      icon = "\u{1F680}";
      color = chalk.green;
      message = `Session started with ${data.model || "default model"}`;
      break;
    case "QUERY_START":
      icon = "\u{1F4AD}";
      color = chalk.blue;
      message = `Processing query: "${data.query?.substring(0, 50)}${data.query?.length > 50 ? "..." : ""}"`;
      break;
    case "QUERY_PROGRESS":
      icon = "\u23F3";
      color = chalk.yellow;
      message = `${data.phase} (${data.elapsed}ms)`;
      break;
    case "QUERY_COMPLETE":
      icon = "\u2705";
      color = chalk.green;
      message = `Query completed in ${data.duration}ms - Cost: $${data.cost} - ${data.tokens} tokens`;
      break;
    case "TOOL_EXECUTION":
      icon = "\u{1F527}";
      color = chalk.cyan;
      message = `${data.toolName}: ${data.action} ${data.target ? "\u2192 " + data.target : ""}`;
      break;
    case "ERROR_OCCURRED":
      icon = "\u274C";
      color = chalk.red;
      message = `${data.error} ${data.context ? "(" + data.context + ")" : ""}`;
      break;
    case "PERFORMANCE_SUMMARY":
      icon = "\u{1F4CA}";
      color = chalk.magenta;
      message = `Session: ${data.queries} queries, $${data.totalCost}, ${data.avgResponseTime}ms avg`;
      break;
    default:
      message = JSON.stringify(data);
  }
  const reqId = requestId ? chalk.dim(`[${requestId.slice(0, 8)}]`) : "";
  terminalLog(`${color(`[${timestamp}]`)} ${icon} ${color(message)} ${reqId}`);
}
function initDebugLogger() {
  if (!isDebugMode()) return;
  debug.info("DEBUG_LOGGER_INIT", {
    startupTimestamp: STARTUP_TIMESTAMP,
    sessionId: SESSION_ID,
    debugPaths: {
      detailed: DEBUG_PATHS.detailed(),
      flow: DEBUG_PATHS.flow(),
      api: DEBUG_PATHS.api(),
      state: DEBUG_PATHS.state()
    }
  });
  const terminalLevels = isDebugVerboseMode() ? Array.from(DEBUG_VERBOSE_TERMINAL_LOG_LEVELS).join(", ") : Array.from(TERMINAL_LOG_LEVELS).join(", ");
  terminalLog(
    chalk.dim(`[DEBUG] Terminal output filtered to: ${terminalLevels}`)
  );
  terminalLog(
    chalk.dim(`[DEBUG] Complete logs saved to: ${DEBUG_PATHS.base()}`)
  );
  if (!isDebugVerboseMode()) {
    terminalLog(
      chalk.dim(
        `[DEBUG] Use --debug-verbose for detailed system logs (FLOW, API, STATE)`
      )
    );
  }
}
function diagnoseError(error, context) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : void 0;
  if (errorMessage.includes("aborted") || errorMessage.includes("AbortController")) {
    return {
      errorType: "REQUEST_ABORTED",
      category: "SYSTEM",
      severity: "MEDIUM",
      description: "Request was aborted, often due to user cancellation or timeout",
      suggestions: [
        "\u68C0\u67E5\u662F\u5426\u6309\u4E0B\u4E86 ESC \u952E\u53D6\u6D88\u8BF7\u6C42",
        "\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u662F\u5426\u7A33\u5B9A",
        "\u9A8C\u8BC1 AbortController \u72B6\u6001: isActive \u548C signal.aborted \u5E94\u8BE5\u4E00\u81F4",
        "\u67E5\u770B\u662F\u5426\u6709\u91CD\u590D\u7684\u8BF7\u6C42\u5BFC\u81F4\u51B2\u7A81"
      ],
      debugSteps: [
        "\u4F7F\u7528 --debug-verbose \u6A21\u5F0F\u67E5\u770B\u8BE6\u7EC6\u7684\u8BF7\u6C42\u6D41\u7A0B",
        "\u68C0\u67E5 debug \u65E5\u5FD7\u4E2D\u7684 BINARY_FEEDBACK_* \u4E8B\u4EF6",
        "\u9A8C\u8BC1 REQUEST_START \u548C REQUEST_END \u65E5\u5FD7\u914D\u5BF9",
        "\u67E5\u770B QUERY_ABORTED \u4E8B\u4EF6\u7684\u89E6\u53D1\u539F\u56E0"
      ]
    };
  }
  if (errorMessage.includes("api-key") || errorMessage.includes("authentication") || errorMessage.includes("401")) {
    return {
      errorType: "API_AUTHENTICATION",
      category: "API",
      severity: "HIGH",
      description: "API authentication failed - invalid or missing API key",
      suggestions: [
        "\u8FD0\u884C /login \u91CD\u65B0\u8BBE\u7F6E API \u5BC6\u94A5",
        "\u68C0\u67E5 ~/.kode/ \u914D\u7F6E\u6587\u4EF6\u4E2D\u7684 API \u5BC6\u94A5",
        "\u9A8C\u8BC1 API \u5BC6\u94A5\u662F\u5426\u5DF2\u8FC7\u671F\u6216\u88AB\u64A4\u9500",
        "\u786E\u8BA4\u4F7F\u7528\u7684 provider \u8BBE\u7F6E\u6B63\u786E (anthropic/opendev/bigdream)"
      ],
      debugSteps: [
        "\u68C0\u67E5 CONFIG_LOAD \u65E5\u5FD7\u4E2D\u7684 provider \u548C API \u5BC6\u94A5\u72B6\u6001",
        "\u8FD0\u884C kode doctor \u68C0\u67E5\u7CFB\u7EDF\u5065\u5EB7\u72B6\u6001",
        "\u67E5\u770B API_ERROR \u65E5\u5FD7\u4E86\u89E3\u8BE6\u7EC6\u9519\u8BEF\u4FE1\u606F",
        "\u4F7F\u7528 kode config \u547D\u4EE4\u67E5\u770B\u5F53\u524D\u914D\u7F6E"
      ]
    };
  }
  if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND") || errorMessage.includes("timeout")) {
    return {
      errorType: "NETWORK_CONNECTION",
      category: "NETWORK",
      severity: "HIGH",
      description: "Network connection failed - unable to reach API endpoint",
      suggestions: [
        "\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u662F\u5426\u6B63\u5E38",
        "\u786E\u8BA4\u9632\u706B\u5899\u6CA1\u6709\u963B\u6B62\u76F8\u5173\u7AEF\u53E3",
        "\u68C0\u67E5 proxy \u8BBE\u7F6E\u662F\u5426\u6B63\u786E",
        "\u5C1D\u8BD5\u5207\u6362\u5230\u4E0D\u540C\u7684\u7F51\u7EDC\u73AF\u5883",
        "\u9A8C\u8BC1 baseURL \u914D\u7F6E\u662F\u5426\u6B63\u786E"
      ],
      debugSteps: [
        "\u68C0\u67E5 API_REQUEST_START \u548C\u76F8\u5173\u7F51\u7EDC\u65E5\u5FD7",
        "\u67E5\u770B LLM_REQUEST_ERROR \u4E2D\u7684\u8BE6\u7EC6\u9519\u8BEF\u4FE1\u606F",
        "\u4F7F\u7528 ping \u6216 curl \u6D4B\u8BD5 API \u7AEF\u70B9\u8FDE\u901A\u6027",
        "\u68C0\u67E5\u4F01\u4E1A\u7F51\u7EDC\u662F\u5426\u9700\u8981\u4EE3\u7406\u8BBE\u7F6E"
      ]
    };
  }
  if (errorMessage.includes("permission") || errorMessage.includes("EACCES") || errorMessage.includes("denied")) {
    return {
      errorType: "PERMISSION_DENIED",
      category: "PERMISSION",
      severity: "MEDIUM",
      description: "Permission denied - insufficient access rights",
      suggestions: [
        "\u68C0\u67E5\u6587\u4EF6\u548C\u76EE\u5F55\u7684\u8BFB\u5199\u6743\u9650",
        "\u786E\u8BA4\u5F53\u524D\u7528\u6237\u6709\u8DB3\u591F\u7684\u7CFB\u7EDF\u6743\u9650",
        "\u67E5\u770B\u662F\u5426\u9700\u8981\u7BA1\u7406\u5458\u6743\u9650\u8FD0\u884C",
        "\u68C0\u67E5\u5DE5\u5177\u6743\u9650\u8BBE\u7F6E\u662F\u5426\u6B63\u786E\u914D\u7F6E"
      ],
      debugSteps: [
        "\u67E5\u770B PERMISSION_* \u65E5\u5FD7\u4E86\u89E3\u6743\u9650\u68C0\u67E5\u8FC7\u7A0B",
        "\u68C0\u67E5\u6587\u4EF6\u7CFB\u7EDF\u6743\u9650: ls -la",
        "\u9A8C\u8BC1\u5DE5\u5177\u5BA1\u6279\u72B6\u6001",
        "\u67E5\u770B TOOL_* \u76F8\u5173\u7684\u8C03\u8BD5\u65E5\u5FD7"
      ]
    };
  }
  if (errorMessage.includes("substring is not a function") || errorMessage.includes("content")) {
    return {
      errorType: "RESPONSE_FORMAT",
      category: "API",
      severity: "MEDIUM",
      description: "LLM response format mismatch between different providers",
      suggestions: [
        "\u68C0\u67E5\u5F53\u524D\u4F7F\u7528\u7684 provider \u662F\u5426\u4E0E\u671F\u671B\u4E00\u81F4",
        "\u9A8C\u8BC1\u54CD\u5E94\u683C\u5F0F\u5904\u7406\u903B\u8F91",
        "\u786E\u8BA4\u4E0D\u540C provider \u7684\u54CD\u5E94\u683C\u5F0F\u5DEE\u5F02",
        "\u68C0\u67E5\u662F\u5426\u9700\u8981\u66F4\u65B0\u54CD\u5E94\u89E3\u6790\u4EE3\u7801"
      ],
      debugSteps: [
        "\u67E5\u770B LLM_CALL_DEBUG \u4E2D\u7684\u54CD\u5E94\u683C\u5F0F",
        "\u68C0\u67E5 provider \u914D\u7F6E\u548C\u5B9E\u9645\u4F7F\u7528\u7684 API",
        "\u5BF9\u6BD4 Anthropic \u548C OpenAI \u54CD\u5E94\u683C\u5F0F\u5DEE\u5F02",
        "\u9A8C\u8BC1 logLLMInteraction \u51FD\u6570\u7684\u683C\u5F0F\u5904\u7406"
      ]
    };
  }
  if (errorMessage.includes("too long") || errorMessage.includes("context") || errorMessage.includes("token")) {
    return {
      errorType: "CONTEXT_OVERFLOW",
      category: "SYSTEM",
      severity: "MEDIUM",
      description: "Context window exceeded - conversation too long",
      suggestions: [
        "\u8FD0\u884C /compact \u624B\u52A8\u538B\u7F29\u5BF9\u8BDD\u5386\u53F2",
        "\u68C0\u67E5\u81EA\u52A8\u538B\u7F29\u8BBE\u7F6E\u662F\u5426\u6B63\u786E\u914D\u7F6E",
        "\u51CF\u5C11\u5355\u6B21\u8F93\u5165\u7684\u5185\u5BB9\u957F\u5EA6",
        "\u6E05\u7406\u4E0D\u5FC5\u8981\u7684\u4E0A\u4E0B\u6587\u4FE1\u606F"
      ],
      debugSteps: [
        "\u67E5\u770B AUTO_COMPACT_* \u65E5\u5FD7\u68C0\u67E5\u538B\u7F29\u89E6\u53D1",
        "\u68C0\u67E5 token \u4F7F\u7528\u91CF\u548C\u9608\u503C",
        "\u67E5\u770B CONTEXT_COMPRESSION \u76F8\u5173\u65E5\u5FD7",
        "\u9A8C\u8BC1\u6A21\u578B\u7684\u6700\u5927 token \u9650\u5236"
      ]
    };
  }
  if (errorMessage.includes("config") || errorMessage.includes("undefined") && context?.configRelated) {
    return {
      errorType: "CONFIGURATION",
      category: "CONFIG",
      severity: "MEDIUM",
      description: "Configuration error - missing or invalid settings",
      suggestions: [
        "\u8FD0\u884C kode config \u68C0\u67E5\u914D\u7F6E\u8BBE\u7F6E",
        "\u5220\u9664\u635F\u574F\u7684\u914D\u7F6E\u6587\u4EF6\u91CD\u65B0\u521D\u59CB\u5316",
        "\u68C0\u67E5 JSON \u914D\u7F6E\u6587\u4EF6\u8BED\u6CD5\u662F\u5426\u6B63\u786E",
        "\u9A8C\u8BC1\u73AF\u5883\u53D8\u91CF\u8BBE\u7F6E"
      ],
      debugSteps: [
        "\u67E5\u770B CONFIG_LOAD \u548C CONFIG_SAVE \u65E5\u5FD7",
        "\u68C0\u67E5\u914D\u7F6E\u6587\u4EF6\u8DEF\u5F84\u548C\u6743\u9650",
        "\u9A8C\u8BC1 JSON \u683C\u5F0F: cat ~/.kode/config.json | jq",
        "\u67E5\u770B\u914D\u7F6E\u7F13\u5B58\u76F8\u5173\u7684\u8C03\u8BD5\u4FE1\u606F"
      ]
    };
  }
  return {
    errorType: "UNKNOWN",
    category: "SYSTEM",
    severity: "MEDIUM",
    description: `Unexpected error: ${errorMessage}`,
    suggestions: [
      "\u91CD\u65B0\u542F\u52A8\u5E94\u7528\u7A0B\u5E8F",
      "\u68C0\u67E5\u7CFB\u7EDF\u8D44\u6E90\u662F\u5426\u5145\u8DB3",
      "\u67E5\u770B\u5B8C\u6574\u7684\u9519\u8BEF\u65E5\u5FD7\u83B7\u53D6\u66F4\u591A\u4FE1\u606F",
      "\u5982\u679C\u95EE\u9898\u6301\u7EED\uFF0C\u8BF7\u62A5\u544A\u6B64\u9519\u8BEF"
    ],
    debugSteps: [
      "\u4F7F\u7528 --debug-verbose \u83B7\u53D6\u8BE6\u7EC6\u65E5\u5FD7",
      "\u68C0\u67E5 error.log \u4E2D\u7684\u5B8C\u6574\u9519\u8BEF\u4FE1\u606F",
      "\u67E5\u770B\u7CFB\u7EDF\u8D44\u6E90\u4F7F\u7528\u60C5\u51B5",
      "\u6536\u96C6\u91CD\u73B0\u6B65\u9AA4\u548C\u73AF\u5883\u4FE1\u606F"
    ],
    relatedLogs: errorStack ? [errorStack] : void 0
  };
}
function logErrorWithDiagnosis(error, context, requestId) {
  if (!isDebugMode()) return;
  const diagnosis = diagnoseError(error, context);
  const errorMessage = error instanceof Error ? error.message : String(error);
  debug.error(
    "ERROR_OCCURRED",
    {
      error: errorMessage,
      errorType: diagnosis.errorType,
      category: diagnosis.category,
      severity: diagnosis.severity,
      context
    },
    requestId
  );
  terminalLog("\n" + chalk.red("\u{1F6A8} ERROR DIAGNOSIS"));
  terminalLog(chalk.gray("\u2501".repeat(60)));
  terminalLog(chalk.red(`\u274C ${diagnosis.errorType}`));
  terminalLog(
    chalk.dim(
      `Category: ${diagnosis.category} | Severity: ${diagnosis.severity}`
    )
  );
  terminalLog(`
${diagnosis.description}`);
  terminalLog(chalk.yellow("\n\u{1F4A1} Recovery Suggestions:"));
  diagnosis.suggestions.forEach((suggestion, index) => {
    terminalLog(`   ${index + 1}. ${suggestion}`);
  });
  terminalLog(chalk.cyan("\n\u{1F50D} Debug Steps:"));
  diagnosis.debugSteps.forEach((step, index) => {
    terminalLog(`   ${index + 1}. ${step}`);
  });
  if (diagnosis.relatedLogs && diagnosis.relatedLogs.length > 0) {
    terminalLog(chalk.magenta("\n\u{1F4CB} Related Information:"));
    diagnosis.relatedLogs.forEach((log, index) => {
      const truncatedLog = log.length > 200 ? log.substring(0, 200) + "..." : log;
      terminalLog(chalk.dim(`   ${truncatedLog}`));
    });
  }
  const debugPath = DEBUG_PATHS.base();
  terminalLog(chalk.gray(`
\u{1F4C1} Complete logs: ${debugPath}`));
  terminalLog(chalk.gray("\u2501".repeat(60)));
}
var isDebugMode, isVerboseMode, isDebugVerboseMode, TERMINAL_LOG_LEVELS, DEBUG_VERBOSE_TERMINAL_LOG_LEVELS, STARTUP_TIMESTAMP, REQUEST_START_TIME, DANYA_DIR, DEBUG_PATHS, currentRequest, recentLogs, LOG_DEDUPE_WINDOW_MS, debug;
var init_debugLogger = __esm({
  "src/utils/log/debugLogger.ts"() {
    init_log();
    isDebugMode = () => process.argv.includes("--debug-verbose") || process.argv.includes("--mcp-debug") || process.argv.some(
      (arg) => arg === "--debug" || arg === "-d" || arg.startsWith("--debug=")
    );
    isVerboseMode = () => process.argv.includes("--verbose");
    isDebugVerboseMode = () => process.argv.includes("--debug-verbose");
    TERMINAL_LOG_LEVELS = /* @__PURE__ */ new Set([
      "ERROR" /* ERROR */,
      "WARN" /* WARN */,
      "INFO" /* INFO */,
      "REMINDER" /* REMINDER */
    ]);
    DEBUG_VERBOSE_TERMINAL_LOG_LEVELS = /* @__PURE__ */ new Set([
      "ERROR" /* ERROR */,
      "WARN" /* WARN */,
      "FLOW" /* FLOW */,
      "API" /* API */,
      "STATE" /* STATE */,
      "INFO" /* INFO */,
      "REMINDER" /* REMINDER */
    ]);
    STARTUP_TIMESTAMP = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    REQUEST_START_TIME = Date.now();
    DANYA_DIR = join(homedir(), ".danya");
    DEBUG_PATHS = {
      base: () => join(DANYA_DIR, getProjectDir(process.cwd()), "debug"),
      detailed: () => join(DEBUG_PATHS.base(), `${STARTUP_TIMESTAMP}-detailed.log`),
      flow: () => join(DEBUG_PATHS.base(), `${STARTUP_TIMESTAMP}-flow.log`),
      api: () => join(DEBUG_PATHS.base(), `${STARTUP_TIMESTAMP}-api.log`),
      state: () => join(DEBUG_PATHS.base(), `${STARTUP_TIMESTAMP}-state.log`)
    };
    currentRequest = null;
    recentLogs = /* @__PURE__ */ new Map();
    LOG_DEDUPE_WINDOW_MS = 5e3;
    debug = {
      flow: (phase, data, requestId) => debugLog("FLOW" /* FLOW */, phase, data, requestId),
      api: (phase, data, requestId) => debugLog("API" /* API */, phase, data, requestId),
      state: (phase, data, requestId) => debugLog("STATE" /* STATE */, phase, data, requestId),
      info: (phase, data, requestId) => debugLog("INFO" /* INFO */, phase, data, requestId),
      warn: (phase, data, requestId) => debugLog("WARN" /* WARN */, phase, data, requestId),
      error: (phase, data, requestId) => debugLog("ERROR" /* ERROR */, phase, data, requestId),
      trace: (phase, data, requestId) => debugLog("TRACE" /* TRACE */, phase, data, requestId),
      ui: (phase, data, requestId) => debugLog("STATE" /* STATE */, `UI_${phase}`, data, requestId)
    };
  }
});

export {
  debug,
  getCurrentRequest,
  markPhase,
  logAPIError,
  logLLMInteraction,
  logSystemPromptConstruction,
  logUserFriendly,
  initDebugLogger,
  logErrorWithDiagnosis,
  init_debugLogger
};
