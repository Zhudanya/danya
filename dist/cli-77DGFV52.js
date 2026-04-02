#!/usr/bin/env bun
import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  ensurePackagedRuntimeEnv,
  ensureYogaWasmPath
} from "./chunk-PDSAJX7G.js";
import {
  getAllTools
} from "./chunk-6KHOUEFL.js";
import {
  DanyaAgentStructuredStdio
} from "./chunk-P5VWDMRD.js";
import {
  assertMinVersion
} from "./chunk-TWE6H65Q.js";
import {
  getToolDescription
} from "./chunk-DKOCP6VD.js";
import {
  lastX
} from "./chunk-BNBV2FXC.js";
import {
  Doctor,
  Onboarding,
  ResumeConversation,
  Select,
  addToHistory,
  clearTerminal,
  grantReadPermissionForOriginalDir,
  hasPermissionsToUseTool,
  review_default,
  useExitOnCtrlCD,
  useTerminalSize
} from "./chunk-QMR44KOM.js";
import "./chunk-X46SRZQF.js";
import {
  addMcpServer,
  ensureConfigScope,
  getClients,
  getClientsForCliMcpConfig,
  getMcpServer,
  getMcprcServerStatus,
  listMCPServers,
  looksLikeMcpUrl,
  normalizeMcpScopeForCli,
  normalizeMcpTransport,
  parseEnvVars,
  parseMcpHeaders,
  removeMcpServer
} from "./chunk-CXOM4XMN.js";
import "./chunk-IZETEFF5.js";
import "./chunk-HXH5LYLI.js";
import "./chunk-UNIJZL2G.js";
import "./chunk-Z4QNIOFF.js";
import "./chunk-Y5LQPJWK.js";
import "./chunk-JVGG2YQR.js";
import "./chunk-7OKTUFZC.js";
import "./chunk-U7Z4MXY4.js";
import {
  clearOutputStyleCache
} from "./chunk-X7ZDT7EX.js";
import "./chunk-3ONZAVOS.js";
import "./chunk-QK4NKMF5.js";
import "./chunk-E5BAXZSR.js";
import "./chunk-HIH5HC5H.js";
import "./chunk-Y5IRVMDD.js";
import "./chunk-HPSW7NNI.js";
import "./chunk-MVN3DHQF.js";
import "./chunk-5TDBDWNG.js";
import "./chunk-XEYEKVFT.js";
import {
  clearAgentCache,
  setFlagAgentsFromCliJson
} from "./chunk-X36NKBPR.js";
import {
  setEnabledSettingSourcesFromCli
} from "./chunk-WAY3DKFO.js";
import "./chunk-2VQWLLDU.js";
import "./chunk-IR3J5REA.js";
import {
  getModelManager,
  isDefaultSlowAndCapableModel
} from "./chunk-RRPXM25U.js";
import {
  getContext,
  removeContext,
  setContext
} from "./chunk-LHNX67NO.js";
import {
  getTheme
} from "./chunk-DZCV2FEW.js";
import {
  checkHasTrustDialogAccepted,
  deleteConfigForCLI,
  enableConfigs,
  getConfigForCLI,
  getCurrentProjectConfig,
  getGlobalConfig,
  getProjectMcpServerDefinitions,
  listConfigForCLI,
  saveCurrentProjectConfig,
  saveGlobalConfig,
  setConfigForCLI,
  validateAndRepairAllGPT5Profiles
} from "./chunk-6JHEJQWY.js";
import {
  ConfigParseError
} from "./chunk-HIIHGKXP.js";
import {
  debug,
  initDebugLogger
} from "./chunk-NMNFFCQ7.js";
import {
  BunShell,
  CACHE_PATHS,
  PRODUCT_COMMAND,
  PRODUCT_NAME,
  dateToFilename,
  formatDate,
  getCwd,
  getNextAvailableLogForkNumber,
  initSentry,
  init_log,
  init_product,
  init_sentry,
  init_shell,
  init_state,
  loadLogList,
  logError,
  parseLogFilename,
  setCwd,
  setOriginalCwd
} from "./chunk-3A4ENL7W.js";
import {
  MACRO,
  init_macros
} from "./chunk-5M3MBCE7.js";
import "./chunk-LWXT5RGE.js";
import {
  __require
} from "./chunk-M3TKNAUR.js";

// src/entrypoints/cli.tsx
init_sentry();

// src/entrypoints/cli/runCli.tsx
init_product();
import { existsSync, readFileSync, writeFileSync as writeFileSync2 } from "node:fs";

// src/entrypoints/cli/printMode.ts
init_log();

// src/entrypoints/cli/stdio/canUseTool.ts
function createStdioCanUseTool(args) {
  if (args.normalizedPermissionPromptTool !== "stdio" || !args.structured) {
    return args.hasPermissionsToUseTool;
  }
  return (async (tool, input, toolUseContext, assistantMessage) => {
    const base = await args.hasPermissionsToUseTool(
      tool,
      input,
      toolUseContext,
      assistantMessage
    );
    if (base.result === true) return { result: true };
    const denied = base;
    if (denied.shouldPromptUser === false) {
      return { result: false, message: denied.message };
    }
    try {
      const blockedPath = typeof denied.blockedPath === "string" ? String(denied.blockedPath) : typeof input?.file_path === "string" ? String(input.file_path) : typeof input?.notebook_path === "string" ? String(input.notebook_path) : typeof input?.path === "string" ? String(input.path) : void 0;
      const decisionReason = typeof denied.decisionReason === "string" ? String(denied.decisionReason) : void 0;
      const response = await args.structured.sendRequest(
        {
          subtype: "can_use_tool",
          tool_name: tool.name,
          input,
          ...typeof toolUseContext?.toolUseId === "string" && toolUseContext.toolUseId ? { tool_use_id: toolUseContext.toolUseId } : {},
          ...typeof toolUseContext?.agentId === "string" && toolUseContext.agentId ? { agent_id: toolUseContext.agentId } : {},
          ...Array.isArray(denied.suggestions) ? {
            permission_suggestions: denied.suggestions
          } : {},
          ...blockedPath ? { blocked_path: blockedPath } : {},
          ...decisionReason ? { decision_reason: decisionReason } : {}
        },
        {
          signal: toolUseContext.abortController.signal,
          timeoutMs: args.permissionTimeoutMs
        }
      );
      if (response && response.behavior === "allow") {
        const updatedInput = response.updatedInput && typeof response.updatedInput === "object" ? response.updatedInput : null;
        if (updatedInput) {
          Object.assign(input, updatedInput);
        }
        const updatedPermissionsRaw = response.updatedPermissions;
        const updatedPermissions = Array.isArray(updatedPermissionsRaw) && updatedPermissionsRaw.every(
          (u) => u && typeof u === "object" && typeof u.type === "string"
        ) ? updatedPermissionsRaw : null;
        if (updatedPermissions && args.printOptions.toolPermissionContext) {
          const next = args.applyToolPermissionContextUpdates(
            args.printOptions.toolPermissionContext,
            updatedPermissions
          );
          args.printOptions.toolPermissionContext = next;
          if (toolUseContext?.options) {
            toolUseContext.options.toolPermissionContext = next;
          }
          for (const update of updatedPermissions) {
            args.persistToolPermissionUpdateToDisk({
              update,
              projectDir: args.cwd
            });
          }
        }
        return { result: true };
      }
      if (response && response.behavior === "deny") {
        if (response.interrupt === true) {
          toolUseContext.abortController.abort();
        }
      }
      return {
        result: false,
        message: typeof response?.message === "string" ? String(response.message) : denied.message
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        result: false,
        message: `Permission prompt failed: ${msg}`,
        shouldPromptUser: false
      };
    }
  });
}

// src/entrypoints/cli/stdio/controlRequestHandler.ts
function createPrintModeControlRequestHandler(args) {
  return async (msg) => {
    const subtype = msg.request?.subtype;
    if (subtype === "initialize") {
      return;
    }
    if (subtype === "set_permission_mode") {
      const mode = msg.request?.mode;
      if (mode === "default" || mode === "acceptEdits" || mode === "plan" || mode === "dontAsk" || mode === "bypassPermissions") {
        if (args.printOptions.toolPermissionContext) {
          args.printOptions.toolPermissionContext.mode = mode;
        }
      }
      return;
    }
    if (subtype === "set_model") {
      const requested = msg.request?.model;
      if (requested === "default") {
        args.printOptions.model = void 0;
      } else if (typeof requested === "string" && requested.trim()) {
        args.printOptions.model = requested.trim();
      }
      return;
    }
    if (subtype === "set_max_thinking_tokens") {
      const value = msg.request?.max_thinking_tokens;
      if (value === null) {
        args.printOptions.maxThinkingTokens = 0;
      } else if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        args.printOptions.maxThinkingTokens = value;
      }
      return;
    }
    if (subtype === "mcp_status") {
      return {
        mcpServers: args.mcpClients.map((c) => ({
          name: c.name,
          status: c.type,
          ...c.type === "connected" && c.capabilities ? { serverInfo: c.capabilities } : {}
        }))
      };
    }
    if (subtype === "mcp_message") {
      const serverName = msg.request?.server_name;
      const message = msg.request?.message;
      if (typeof serverName === "string" && serverName) {
        const found = args.mcpClients.find((c) => c.name === serverName);
        if (found && found.type === "connected") {
          const transport = found.client?.transport;
          if (transport && typeof transport.onmessage === "function") {
            transport.onmessage(message);
          }
        }
      }
      return;
    }
    if (subtype === "mcp_set_servers") {
      return { ok: true, sdkServersChanged: false };
    }
    if (subtype === "rewind_files") {
      throw new Error("rewind_files is not supported in Danya yet.");
    }
    throw new Error(`Unsupported control request subtype: ${String(subtype)}`);
  };
}

// src/entrypoints/cli/stdio/streamJsonSession.ts
async function runPrintModeStreamJsonSession(args) {
  const { runDanyaAgentStreamJsonSession } = await import("./kodeAgentStreamJsonSession-UDMNA7CP.js");
  await runDanyaAgentStreamJsonSession(args);
}

// src/entrypoints/cli/stdio/structuredStdio.ts
function createPrintModeStructuredStdio(args) {
  if (!args.enabled) return null;
  return new DanyaAgentStructuredStdio(args.stdin, args.stdout, {
    onInterrupt: args.onInterrupt,
    onControlRequest: args.onControlRequest
  });
}

// src/entrypoints/cli/printMode.ts
async function runPrintMode({
  prompt,
  stdinContent,
  inputPrompt,
  cwd: cwd2,
  safe,
  verbose,
  outputFormat,
  inputFormat,
  jsonSchema,
  permissionPromptTool,
  replayUserMessages,
  cliTools,
  tools,
  commands,
  ask,
  initialMessages,
  sessionPersistence,
  systemPromptOverride,
  appendSystemPrompt,
  disableSlashCommands,
  allowedTools,
  disallowedTools,
  addDir,
  permissionMode,
  dangerouslySkipPermissions,
  allowDangerouslySkipPermissions,
  model,
  mcpClients
}) {
  const normalizedOutputFormat = String(outputFormat || "text").toLowerCase().trim();
  const normalizedInputFormat = String(inputFormat || "text").toLowerCase().trim();
  if (!["text", "stream-json"].includes(normalizedInputFormat)) {
    console.error(
      `Error: Invalid --input-format "${inputFormat}". Expected one of: text, stream-json`
    );
    process.exit(1);
  }
  if (!["text", "json", "stream-json"].includes(normalizedOutputFormat)) {
    console.error(
      `Error: Invalid --output-format "${outputFormat}". Expected one of: text, json, stream-json`
    );
    process.exit(1);
  }
  if (normalizedOutputFormat === "stream-json" && !verbose) {
    console.error(
      "Error: When using --print, --output-format=stream-json requires --verbose"
    );
    process.exit(1);
  }
  const normalizedPermissionPromptTool = permissionPromptTool ? String(permissionPromptTool).trim() : null;
  if (normalizedPermissionPromptTool) {
    if (normalizedPermissionPromptTool !== "stdio") {
      console.error(
        `Error: Unsupported --permission-prompt-tool "${normalizedPermissionPromptTool}". Only "stdio" is supported in Danya right now.`
      );
      process.exit(1);
    }
    if (normalizedInputFormat !== "stream-json") {
      console.error(
        "Error: --permission-prompt-tool=stdio requires --input-format=stream-json"
      );
      process.exit(1);
    }
    if (normalizedOutputFormat !== "stream-json") {
      console.error(
        "Error: --permission-prompt-tool=stdio requires --output-format=stream-json"
      );
      process.exit(1);
    }
  }
  if (normalizedInputFormat === "stream-json" && normalizedOutputFormat !== "stream-json") {
    console.error(
      "Error: --input-format=stream-json requires --output-format=stream-json"
    );
    process.exit(1);
  }
  if (replayUserMessages) {
    if (normalizedInputFormat !== "stream-json" || normalizedOutputFormat !== "stream-json") {
      console.error(
        "Error: --replay-user-messages requires --input-format=stream-json and --output-format=stream-json"
      );
      process.exit(1);
    }
  }
  if (normalizedInputFormat === "stream-json") {
    if (prompt) {
      console.error(
        "Error: --input-format=stream-json cannot be used with a prompt argument"
      );
      process.exit(1);
    }
    if (stdinContent) {
      console.error(
        "Error: --input-format=stream-json cannot be used with stdin prompt text"
      );
      process.exit(1);
    }
  } else {
    if (!inputPrompt) {
      console.error(
        "Error: Input must be provided either through stdin or as a prompt argument when using --print"
      );
      process.exit(1);
    }
  }
  const toolsForPrint = (() => {
    if (!cliTools) return tools;
    const raw = Array.isArray(cliTools) ? cliTools : [cliTools];
    const flattened = raw.flatMap((v) => String(v ?? "").split(",")).map((v) => v.trim());
    if (flattened.length === 0) return tools;
    if (flattened.length === 1 && flattened[0] === "") return [];
    if (flattened.length === 1 && flattened[0] === "default") return tools;
    const wanted = new Set(flattened.filter((v) => v && v !== "default"));
    const unknown = [...wanted].filter(
      (name) => !tools.some((t) => t.name === name)
    );
    if (unknown.length > 0) {
      console.error(`Error: Unknown tool(s) in --tools: ${unknown.join(", ")}`);
      process.exit(1);
    }
    return tools.filter((t) => wanted.has(t.name));
  })();
  if (normalizedOutputFormat === "text") {
    addToHistory(inputPrompt);
    const { resultText: response } = await ask({
      commands,
      hasPermissionsToUseTool,
      messageLogName: dateToFilename(/* @__PURE__ */ new Date()),
      prompt: inputPrompt,
      cwd: cwd2,
      tools: toolsForPrint,
      safeMode: safe,
      initialMessages,
      persistSession: sessionPersistence !== false
    });
    process.stdout.write(`${response}
`);
    process.exit(0);
  }
  const { createUserMessage } = await import("./messages-UASSXCVQ.js");
  const { getSystemPrompt } = await import("./prompts-6GVIGZ7T.js");
  const { getContext: getContext2 } = await import("./context-SF3X335Q.js");
  const { getTotalCost } = await import("./costTracker-5WKZXN5S.js");
  const { query } = await import("./query-HB65JZX7.js");
  const { getDanyaAgentSessionId } = await import("./kodeAgentSessionId-WUT74FSH.js");
  const { danyaMessageToSdkMessage, makeSdkInitMessage, makeSdkResultMessage } = await import("./kodeAgentStreamJson-EDHHWNNX.js");
  const { DanyaAgentStructuredStdio: DanyaAgentStructuredStdio2 } = await import("./kodeAgentStructuredStdio-UA5P5UNU.js");
  const {
    loadToolPermissionContextFromDisk,
    persistToolPermissionUpdateToDisk
  } = await import("./toolPermissionSettings-SFS4Z63J.js");
  const { applyToolPermissionContextUpdates } = await import("./toolPermissionContext-DHAGUPEW.js");
  const sessionIdForSdk = getDanyaAgentSessionId();
  const startedAt = Date.now();
  const sdkMessages = [];
  const baseSystemPrompt = typeof systemPromptOverride === "string" && systemPromptOverride.trim() ? [systemPromptOverride] : await getSystemPrompt({ disableSlashCommands });
  const systemPrompt = typeof appendSystemPrompt === "string" && appendSystemPrompt.trim() ? [...baseSystemPrompt, appendSystemPrompt] : baseSystemPrompt;
  const normalizedJsonSchema = typeof jsonSchema === "string" ? jsonSchema.trim() : "";
  const parsedJsonSchema = (() => {
    if (!normalizedJsonSchema) return null;
    try {
      const parsed = JSON.parse(normalizedJsonSchema);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Schema must be a JSON object");
      }
      return parsed;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Error: Invalid --json-schema: ${msg}`);
      process.exit(1);
    }
  })();
  if (parsedJsonSchema) {
    systemPrompt.push(
      [
        "You MUST respond with ONLY valid JSON.",
        "The JSON MUST validate against the following JSON Schema.",
        "Do not wrap the JSON in markdown code fences and do not add extra commentary.",
        "",
        `<json_schema>${JSON.stringify(parsedJsonSchema)}</json_schema>`
      ].join("\n")
    );
  }
  const ctx = await getContext2();
  const isBypassAvailable = !safe || Boolean(allowDangerouslySkipPermissions) || Boolean(dangerouslySkipPermissions);
  let toolPermissionContext = loadToolPermissionContextFromDisk({
    projectDir: cwd2,
    includeDanyaProjectConfig: true,
    isBypassPermissionsModeAvailable: isBypassAvailable
  });
  const cliRuleList = (value) => {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw.flatMap((v) => String(v ?? "").split(",")).map((v) => v.trim()).filter(Boolean);
  };
  const allowedRules = cliRuleList(allowedTools);
  const deniedRules = cliRuleList(disallowedTools);
  const additionalDirs = cliRuleList(addDir);
  const updates = [];
  if (allowedRules.length > 0) {
    updates.push({
      type: "addRules",
      destination: "cliArg",
      behavior: "allow",
      rules: allowedRules
    });
  }
  if (deniedRules.length > 0) {
    updates.push({
      type: "addRules",
      destination: "cliArg",
      behavior: "deny",
      rules: deniedRules
    });
  }
  if (additionalDirs.length > 0) {
    updates.push({
      type: "addDirectories",
      destination: "cliArg",
      directories: additionalDirs
    });
  }
  const normalizedPermissionMode = typeof permissionMode === "string" ? permissionMode.trim() : "";
  if (normalizedPermissionMode) {
    const normalized = normalizedPermissionMode === "delegate" ? "default" : normalizedPermissionMode;
    const allowed = /* @__PURE__ */ new Set([
      "acceptEdits",
      "bypassPermissions",
      "default",
      "dontAsk",
      "plan"
    ]);
    if (!allowed.has(normalized)) {
      console.error(
        `Error: Invalid --permission-mode "${normalizedPermissionMode}". Expected one of: acceptEdits, bypassPermissions, default, delegate, dontAsk, plan`
      );
      process.exit(1);
    }
    updates.push({
      type: "setMode",
      destination: "cliArg",
      mode: normalized
    });
  }
  if (dangerouslySkipPermissions) {
    updates.push({
      type: "setMode",
      destination: "cliArg",
      mode: "bypassPermissions"
    });
  }
  if (updates.length > 0) {
    toolPermissionContext = applyToolPermissionContextUpdates(
      toolPermissionContext,
      updates
    );
  }
  const printOptions = {
    commands,
    tools: toolsForPrint,
    verbose: true,
    safeMode: safe,
    forkNumber: 0,
    messageLogName: "unused",
    maxThinkingTokens: 0,
    persistSession: sessionPersistence !== false,
    toolPermissionContext,
    mcpClients,
    shouldAvoidPermissionPrompts: normalizedInputFormat !== "stream-json",
    model: typeof model === "string" && model.trim() ? model.trim() : void 0
  };
  const availableTools = toolsForPrint.map((t) => t.name);
  const slashCommands = disableSlashCommands === true ? void 0 : commands.filter((c) => !c.isHidden).map((c) => `/${c.userFacingName()}`);
  const initMsg = makeSdkInitMessage({
    sessionId: sessionIdForSdk,
    cwd: cwd2,
    tools: availableTools,
    slashCommands
  });
  const writeSdkLine = (obj) => {
    process.stdout.write(JSON.stringify(obj) + "\n");
  };
  if (normalizedOutputFormat === "stream-json") {
    writeSdkLine(initMsg);
  } else {
    sdkMessages.push(initMsg);
  }
  let activeTurnAbortController = null;
  const structured = createPrintModeStructuredStdio({
    enabled: normalizedInputFormat === "stream-json",
    stdin: process.stdin,
    stdout: process.stdout,
    onInterrupt: () => {
      activeTurnAbortController?.abort();
    },
    onControlRequest: createPrintModeControlRequestHandler({
      printOptions,
      mcpClients
    })
  });
  if (structured) structured.start();
  const permissionTimeoutMs = (() => {
    const raw = process.env.DANYA_STDIO_PERMISSION_TIMEOUT_MS ?? process.env.KODE_STDIO_PERMISSION_TIMEOUT_MS;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 3e4;
  })();
  const canUseTool = createStdioCanUseTool({
    normalizedPermissionPromptTool,
    structured,
    permissionTimeoutMs,
    cwd: cwd2,
    printOptions,
    hasPermissionsToUseTool,
    applyToolPermissionContextUpdates,
    persistToolPermissionUpdateToDisk
  });
  if (normalizedInputFormat === "stream-json") {
    if (!structured) {
      console.error("Error: Structured stdin is not available");
      process.exit(1);
    }
    await runPrintModeStreamJsonSession({
      structured,
      query,
      writeSdkLine,
      sessionId: sessionIdForSdk,
      systemPrompt,
      jsonSchema: parsedJsonSchema,
      context: ctx,
      canUseTool,
      toolUseContextBase: {
        options: printOptions,
        messageId: void 0,
        readFileTimestamps: {},
        setToolJSX: () => {
        }
      },
      replayUserMessages: Boolean(replayUserMessages),
      getTotalCostUsd: () => getTotalCost(),
      onActiveTurnAbortControllerChanged: (controller) => {
        activeTurnAbortController = controller;
      },
      initialMessages
    });
    process.exit(0);
  }
  const abortController = new AbortController();
  const userMsg = await (async () => {
    if (normalizedInputFormat !== "stream-json") {
      addToHistory(inputPrompt);
      return createUserMessage(inputPrompt);
    }
    if (!structured) {
      console.error("Error: Structured stdin is not available");
      process.exit(1);
    }
    const sdkUser2 = await structured.nextUserMessage({
      signal: abortController.signal,
      timeoutMs: 3e4
    });
    if (!sdkUser2 || typeof sdkUser2 !== "object") {
      console.error("Error: Invalid stream-json input (missing user message)");
      process.exit(1);
    }
    const sdkMessage = sdkUser2.message;
    const sdkContent = sdkMessage?.content;
    if (typeof sdkContent !== "string" && !Array.isArray(sdkContent)) {
      console.error("Error: Invalid stream-json user message content");
      process.exit(1);
    }
    const m = createUserMessage(sdkContent);
    if (typeof sdkUser2.uuid === "string" && sdkUser2.uuid) {
      ;
      m.uuid = String(sdkUser2.uuid);
    }
    return m;
  })();
  const baseMessages = [...initialMessages ?? [], userMsg];
  const sdkUser = danyaMessageToSdkMessage(userMsg, sessionIdForSdk);
  if (sdkUser) {
    if (normalizedOutputFormat === "stream-json") {
      writeSdkLine(sdkUser);
    } else {
      sdkMessages.push(sdkUser);
    }
  }
  let lastAssistant = null;
  let queryError = null;
  try {
    for await (const m of query(baseMessages, systemPrompt, ctx, canUseTool, {
      options: printOptions,
      abortController,
      messageId: void 0,
      readFileTimestamps: {},
      setToolJSX: () => {
      }
    })) {
      if (m.type === "assistant") lastAssistant = m;
      const sdk = danyaMessageToSdkMessage(m, sessionIdForSdk);
      if (!sdk) continue;
      if (normalizedOutputFormat === "stream-json") {
        writeSdkLine(sdk);
      } else {
        sdkMessages.push(sdk);
      }
    }
  } catch (e) {
    abortController.abort();
    queryError = e;
  }
  const textFromAssistant = lastAssistant?.message?.content?.find(
    (c) => c.type === "text"
  )?.text;
  let text = typeof textFromAssistant === "string" ? textFromAssistant : queryError instanceof Error ? queryError.message : queryError ? String(queryError) : "";
  let structuredOutput;
  if (parsedJsonSchema && !queryError) {
    try {
      const raw = typeof textFromAssistant === "string" ? textFromAssistant : "";
      const fenced = raw.trim();
      const unfenced = (() => {
        const m = fenced.match(/^```(?:json)?\\s*([\\s\\S]*?)\\s*```$/i);
        return m ? m[1].trim() : fenced;
      })();
      const parsed = JSON.parse(unfenced);
      const Ajv = (await import("ajv")).default;
      const ajv = new Ajv({ allErrors: true, strict: false });
      const validate = ajv.compile(parsedJsonSchema);
      const ok = validate(parsed);
      if (!ok) {
        const errorText = typeof ajv.errorsText === "function" ? ajv.errorsText(validate.errors, { separator: "; " }) : JSON.stringify(validate.errors ?? []);
        throw new Error(
          `Structured output failed JSON schema validation: ${errorText}`
        );
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Structured output must be a JSON object");
      }
      structuredOutput = parsed;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      queryError = new Error(msg);
      text = msg;
    }
  }
  const usage = lastAssistant?.message?.usage;
  const totalCostUsd = getTotalCost();
  const durationMs = Date.now() - startedAt;
  const resultMsg = makeSdkResultMessage({
    sessionId: sessionIdForSdk,
    result: String(text),
    structuredOutput,
    numTurns: 1,
    usage,
    totalCostUsd,
    durationMs,
    durationApiMs: 0,
    isError: Boolean(queryError)
  });
  if (normalizedOutputFormat === "stream-json") {
    writeSdkLine(resultMsg);
    process.exit(0);
  }
  sdkMessages.push(resultMsg);
  if (verbose) {
    process.stdout.write(`${JSON.stringify(sdkMessages, null, 2)}
`);
  } else {
    process.stdout.write(`${JSON.stringify(resultMsg, null, 2)}
`);
  }
  process.exit(0);
}

// src/utils/session/cleanup.ts
init_log();
import { promises as fs } from "fs";
import { join as join2 } from "path";
var THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1e3;
function convertFileNameToDate(filename) {
  const isoStr = filename.split(".")[0].replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, "T$1:$2:$3.$4Z");
  return new Date(isoStr);
}
async function cleanupOldMessageFiles() {
  const messagePath = CACHE_PATHS.messages();
  const errorPath = CACHE_PATHS.errors();
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
  const deletedCounts = { messages: 0, errors: 0 };
  for (const path of [messagePath, errorPath]) {
    try {
      const files = await fs.readdir(path);
      for (const file of files) {
        try {
          const timestamp = convertFileNameToDate(file);
          if (timestamp < thirtyDaysAgo) {
            await fs.unlink(join2(path, file));
            if (path === messagePath) {
              deletedCounts.messages++;
            } else {
              deletedCounts.errors++;
            }
          }
        } catch (error) {
          logError(
            `Failed to process file ${file}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
        logError(
          `Failed to cleanup directory ${path}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
  return deletedCounts;
}
function cleanupOldMessageFilesInBackground() {
  const immediate = setImmediate(cleanupOldMessageFiles);
  immediate.unref();
}

// src/entrypoints/cli/setup.ts
init_state();
async function setup(cwd2, safeMode) {
  if (cwd2 !== process.cwd()) {
    setOriginalCwd(cwd2);
  }
  await setCwd(cwd2);
  grantReadPermissionForOriginalDir();
  let agentLoader;
  try {
    agentLoader = await import("./loader-BXIFWM6O.js");
  } catch {
    agentLoader = await import("./loader-BXIFWM6O.js");
  }
  const { startAgentWatcher } = agentLoader;
  await startAgentWatcher(() => {
    debug.info("AGENTS_HOT_RELOADED", { ok: true });
  });
  if (safeMode) {
    if (process.platform !== "win32" && typeof process.getuid === "function" && process.getuid() === 0) {
      console.error(
        `--safe mode cannot be used with root/sudo privileges for security reasons`
      );
      process.exit(1);
    }
  }
  if (process.env.NODE_ENV === "test") {
    return;
  }
  cleanupOldMessageFilesInBackground();
  getContext();
  const projectConfig = getCurrentProjectConfig();
  if (projectConfig.lastCost !== void 0 && projectConfig.lastDuration !== void 0) {
  }
}

// src/entrypoints/cli/setupScreens.tsx
init_macros();
import React6 from "react";

// src/ui/components/TrustDialog.tsx
import React from "react";
import { Box, Text, useInput } from "ink";
init_product();
init_state();
import { homedir } from "os";
function TrustDialog({ onDone }) {
  const theme = getTheme();
  React.useEffect(() => {
  }, []);
  function onChange(value) {
    const config = getCurrentProjectConfig();
    switch (value) {
      case "yes": {
        const isHomeDir = homedir() === getCwd();
        if (!isHomeDir) {
          saveCurrentProjectConfig({
            ...config,
            hasTrustDialogAccepted: true
          });
        }
        onDone();
        break;
      }
      case "no": {
        process.exit(1);
        break;
      }
    }
  }
  const exitState = useExitOnCtrlCD(() => process.exit(0));
  useInput((_input, key) => {
    if (key.escape) {
      process.exit(0);
      return;
    }
  });
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    Box,
    {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      borderStyle: "round",
      borderColor: theme.warning
    },
    /* @__PURE__ */ React.createElement(Text, { bold: true, color: theme.warning }, "Do you trust the files in this folder?"),
    /* @__PURE__ */ React.createElement(Text, { bold: true }, process.cwd()),
    /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", gap: 1 }, /* @__PURE__ */ React.createElement(Text, null, PRODUCT_NAME, " may read files in this folder. Reading untrusted files may lead to ", PRODUCT_NAME, " to behave in an unexpected ways."), /* @__PURE__ */ React.createElement(Text, null, "With your permission ", PRODUCT_NAME, " may execute files in this folder. Executing untrusted code is unsafe.")),
    /* @__PURE__ */ React.createElement(
      Select,
      {
        options: [
          { label: "Yes, proceed", value: "yes" },
          { label: "No, exit", value: "no" }
        ],
        onChange: (value) => onChange(value)
      }
    )
  ), /* @__PURE__ */ React.createElement(Box, { marginLeft: 3 }, /* @__PURE__ */ React.createElement(Text, { dimColor: true }, exitState.pending ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Press ", exitState.keyName, " again to exit") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Enter to confirm \xB7 Esc to exit"))));
}

// src/ui/screens/MCPServerApproval.tsx
import React5 from "react";
import { render } from "ink";

// src/ui/components/MCPServerMultiselectDialog.tsx
import React3 from "react";
import { Box as Box2, Text as Text3, useInput as useInput2 } from "ink";
import { MultiSelect } from "@inkjs/ui";
import { partition } from "lodash-es";

// src/ui/components/MCPServerDialogCopy.tsx
init_product();
import React2 from "react";
import { Text as Text2 } from "ink";
import Link from "ink-link";
function MCPServerDialogCopy() {
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Text2, null, "MCP servers provide additional functionality to ", PRODUCT_NAME, ". They may execute code, make network requests, or access system resources via tool calls. All tool calls will require your explicit approval before execution. For more information, see", " ", /* @__PURE__ */ React2.createElement(Link, { url: "https://github.com/shareAI-lab/kode/blob/main/docs/mcp.md" }, "MCP documentation")), /* @__PURE__ */ React2.createElement(Text2, { dimColor: true }, "Remember: You can always change these choices later by running `", PRODUCT_COMMAND, " mcp reset-project-choices`"));
}

// src/ui/components/MCPServerMultiselectDialog.tsx
function MCPServerMultiselectDialog({
  serverNames,
  onDone
}) {
  const theme = getTheme();
  function onSubmit(selectedServers) {
    const config = getCurrentProjectConfig();
    if (!config.approvedMcprcServers) {
      config.approvedMcprcServers = [];
    }
    if (!config.rejectedMcprcServers) {
      config.rejectedMcprcServers = [];
    }
    const [approvedServers, rejectedServers] = partition(
      serverNames,
      (server) => selectedServers.includes(server)
    );
    config.approvedMcprcServers.push(...approvedServers);
    config.rejectedMcprcServers.push(...rejectedServers);
    saveCurrentProjectConfig(config);
    onDone();
  }
  const exitState = useExitOnCtrlCD(() => process.exit());
  useInput2((_input, key) => {
    if (key.escape) {
      const config = getCurrentProjectConfig();
      if (!config.rejectedMcprcServers) {
        config.rejectedMcprcServers = [];
      }
      for (const server of serverNames) {
        if (!config.rejectedMcprcServers.includes(server)) {
          config.rejectedMcprcServers.push(server);
        }
      }
      saveCurrentProjectConfig(config);
      onDone();
      return;
    }
  });
  return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(
    Box2,
    {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      borderStyle: "round",
      borderColor: theme.warning
    },
    /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: theme.warning }, "New MCP Servers Detected"),
    /* @__PURE__ */ React3.createElement(Text3, null, "This project contains an MCP config file (.mcp.json or .mcprc) with", " ", serverNames.length, " MCP servers that require your approval."),
    /* @__PURE__ */ React3.createElement(MCPServerDialogCopy, null),
    /* @__PURE__ */ React3.createElement(Text3, null, "Please select the servers you want to enable:"),
    /* @__PURE__ */ React3.createElement(
      MultiSelect,
      {
        options: serverNames.map((server) => ({
          label: server,
          value: server
        })),
        defaultValue: serverNames,
        onSubmit
      }
    )
  ), /* @__PURE__ */ React3.createElement(Box2, { marginLeft: 3 }, /* @__PURE__ */ React3.createElement(Text3, { dimColor: true }, exitState.pending ? /* @__PURE__ */ React3.createElement(React3.Fragment, null, "Press ", exitState.keyName, " again to exit") : /* @__PURE__ */ React3.createElement(React3.Fragment, null, "Space to select \xB7 Enter to confirm \xB7 Esc to reject all"))));
}

// src/ui/components/MCPServerApprovalDialog.tsx
import React4 from "react";
import { Box as Box3, Text as Text4, useInput as useInput3 } from "ink";
function MCPServerApprovalDialog({
  serverName,
  onDone
}) {
  const theme = getTheme();
  function onChange(value) {
    const config = getCurrentProjectConfig();
    switch (value) {
      case "yes": {
        if (!config.approvedMcprcServers) {
          config.approvedMcprcServers = [];
        }
        if (!config.approvedMcprcServers.includes(serverName)) {
          config.approvedMcprcServers.push(serverName);
        }
        saveCurrentProjectConfig(config);
        onDone();
        break;
      }
      case "no": {
        if (!config.rejectedMcprcServers) {
          config.rejectedMcprcServers = [];
        }
        if (!config.rejectedMcprcServers.includes(serverName)) {
          config.rejectedMcprcServers.push(serverName);
        }
        saveCurrentProjectConfig(config);
        onDone();
        break;
      }
    }
  }
  const exitState = useExitOnCtrlCD(() => process.exit(0));
  useInput3((_input, key) => {
    if (key.escape) {
      onDone();
      return;
    }
  });
  return /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement(
    Box3,
    {
      flexDirection: "column",
      gap: 1,
      padding: 1,
      borderStyle: "round",
      borderColor: theme.warning
    },
    /* @__PURE__ */ React4.createElement(Text4, { bold: true, color: theme.warning }, "New MCP Server Detected"),
    /* @__PURE__ */ React4.createElement(Text4, null, "This project contains an MCP config file (.mcp.json or .mcprc) with an MCP server that requires your approval:"),
    /* @__PURE__ */ React4.createElement(Text4, { bold: true }, serverName),
    /* @__PURE__ */ React4.createElement(MCPServerDialogCopy, null),
    /* @__PURE__ */ React4.createElement(Text4, null, "Do you want to approve this MCP server?"),
    /* @__PURE__ */ React4.createElement(
      Select,
      {
        options: [
          { label: "Yes, approve this server", value: "yes" },
          { label: "No, reject this server", value: "no" }
        ],
        onChange: (value) => onChange(value)
      }
    )
  ), /* @__PURE__ */ React4.createElement(Box3, { marginLeft: 3 }, /* @__PURE__ */ React4.createElement(Text4, { dimColor: true }, exitState.pending ? /* @__PURE__ */ React4.createElement(React4.Fragment, null, "Press ", exitState.keyName, " again to exit") : /* @__PURE__ */ React4.createElement(React4.Fragment, null, "Enter to confirm \xB7 Esc to reject"))));
}

// src/ui/screens/MCPServerApproval.tsx
async function handleMcprcServerApprovals() {
  const { servers } = getProjectMcpServerDefinitions();
  const pendingServers = Object.keys(servers).filter(
    (serverName) => getMcprcServerStatus(serverName) === "pending"
  );
  if (pendingServers.length === 0) {
    return;
  }
  await new Promise((resolve) => {
    const clearScreenAndResolve = () => {
      process.stdout.write("\x1B[2J\x1B[3J\x1B[H", () => {
        resolve();
      });
    };
    if (pendingServers.length === 1 && pendingServers[0] !== void 0) {
      const result = render(
        /* @__PURE__ */ React5.createElement(
          MCPServerApprovalDialog,
          {
            serverName: pendingServers[0],
            onDone: () => {
              result.unmount?.();
              clearScreenAndResolve();
            }
          }
        ),
        { exitOnCtrlC: false }
      );
    } else {
      const result = render(
        /* @__PURE__ */ React5.createElement(
          MCPServerMultiselectDialog,
          {
            serverNames: pendingServers,
            onDone: () => {
              result.unmount?.();
              clearScreenAndResolve();
            }
          }
        ),
        { exitOnCtrlC: false }
      );
    }
  });
}

// src/entrypoints/cli/setupScreens.tsx
function completeOnboarding() {
  const config = getGlobalConfig();
  saveGlobalConfig({
    ...config,
    hasCompletedOnboarding: true,
    lastOnboardingVersion: MACRO.VERSION
  });
}
async function showSetupScreens(safeMode, print) {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const config = getGlobalConfig();
  if (!config.theme || !config.hasCompletedOnboarding) {
    await clearTerminal();
    const { render: render3 } = await import("ink");
    await new Promise((resolve) => {
      render3(
        /* @__PURE__ */ React6.createElement(
          Onboarding,
          {
            onDone: async () => {
              completeOnboarding();
              await clearTerminal();
              resolve();
            }
          }
        ),
        {
          exitOnCtrlC: false
        }
      );
    });
  }
  if (!print) {
    if (safeMode) {
      if (!checkHasTrustDialogAccepted()) {
        await new Promise((resolve) => {
          const onDone = () => {
            grantReadPermissionForOriginalDir();
            resolve();
          };
          (async () => {
            const { render: render3 } = await import("ink");
            render3(/* @__PURE__ */ React6.createElement(TrustDialog, { onDone }), {
              exitOnCtrlC: false
            });
          })();
        });
      }
    }
    await handleMcprcServerApprovals();
  }
}

// src/entrypoints/cli/runCli.tsx
import React10 from "react";
import { ReadStream } from "tty";
import { openSync } from "fs";
import { Command } from "@commander-js/extra-typings";
init_log();
import { cwd } from "process";

// src/utils/model/modelConfigYaml.ts
import yaml from "js-yaml";
import { z } from "zod";
var ApiKeySpecSchema = z.union([
  z.object({
    fromEnv: z.string().min(1)
  }).strict(),
  z.object({
    value: z.string()
  }).strict()
]);
var ModelProfileYamlSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  modelName: z.string().min(1),
  baseURL: z.string().min(1).optional(),
  maxTokens: z.number().int().positive(),
  contextLength: z.number().int().positive(),
  reasoningEffort: z.string().optional(),
  isActive: z.boolean().optional(),
  apiKey: ApiKeySpecSchema.optional(),
  apiKeyEnv: z.string().min(1).optional(),
  createdAt: z.number().int().positive().optional(),
  lastUsed: z.number().int().positive().optional()
}).strict();
var ModelPointersYamlSchema = z.object({
  main: z.string().min(1).optional(),
  task: z.string().min(1).optional(),
  compact: z.string().min(1).optional(),
  quick: z.string().min(1).optional()
}).strict().optional();
var ModelConfigYamlSchema = z.object({
  version: z.number().int().positive().default(1),
  profiles: z.array(ModelProfileYamlSchema).default([]),
  pointers: ModelPointersYamlSchema
}).strict();
function suggestedApiKeyEnvForProvider(provider) {
  switch (provider) {
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "openai":
    case "custom-openai":
      return "OPENAI_API_KEY";
    case "azure":
      return "AZURE_OPENAI_API_KEY";
    case "gemini":
      return "GEMINI_API_KEY";
    default:
      return void 0;
  }
}
function resolveApiKeyFromYaml(input, existingApiKey) {
  const warnings = [];
  if (input.apiKeyEnv) {
    const envValue = process.env[input.apiKeyEnv];
    if (envValue) return { apiKey: envValue, warnings };
    if (existingApiKey) return { apiKey: existingApiKey, warnings };
    warnings.push(`Missing env var '${input.apiKeyEnv}' for apiKey`);
    return { apiKey: "", warnings };
  }
  if (input.apiKey && "fromEnv" in input.apiKey) {
    const envValue = process.env[input.apiKey.fromEnv];
    if (envValue) return { apiKey: envValue, warnings };
    if (existingApiKey) return { apiKey: existingApiKey, warnings };
    warnings.push(`Missing env var '${input.apiKey.fromEnv}' for apiKey`);
    return { apiKey: "", warnings };
  }
  if (input.apiKey && "value" in input.apiKey) {
    return { apiKey: input.apiKey.value, warnings };
  }
  if (existingApiKey) return { apiKey: existingApiKey, warnings };
  warnings.push(
    "Missing apiKey (set apiKey.fromEnv, apiKeyEnv, or apiKey.value)"
  );
  return { apiKey: "", warnings };
}
function resolvePointerTarget(pointerValue, profiles) {
  if (profiles.some((p) => p.modelName === pointerValue)) return pointerValue;
  const byName = profiles.find((p) => p.name === pointerValue);
  return byName?.modelName ?? null;
}
function parseModelConfigYaml(yamlText) {
  const parsed = yaml.load(yamlText);
  return ModelConfigYamlSchema.parse(parsed);
}
function formatModelConfigYamlForSharing(config) {
  const modelProfiles = config.modelProfiles ?? [];
  const pointers = config.modelPointers;
  const exported = {
    version: 1,
    profiles: modelProfiles.map((p) => {
      const suggestedEnv = suggestedApiKeyEnvForProvider(p.provider);
      return {
        name: p.name,
        provider: p.provider,
        modelName: p.modelName,
        ...p.baseURL ? { baseURL: p.baseURL } : {},
        maxTokens: p.maxTokens,
        contextLength: p.contextLength,
        ...p.reasoningEffort ? { reasoningEffort: p.reasoningEffort } : {},
        isActive: p.isActive,
        createdAt: p.createdAt,
        ...typeof p.lastUsed === "number" ? { lastUsed: p.lastUsed } : {},
        apiKey: { fromEnv: suggestedEnv ?? "API_KEY" }
      };
    }),
    ...pointers ? { pointers } : {}
  };
  return yaml.dump(exported, {
    noRefs: true,
    lineWidth: 120
  });
}
function applyModelConfigYamlImport(existingConfig, yamlText, options = {}) {
  const parsed = parseModelConfigYaml(yamlText);
  const warnings = [];
  const existingProfiles = existingConfig.modelProfiles ?? [];
  const existingByModelName = new Map(
    existingProfiles.map((p) => [p.modelName, p])
  );
  const now = Date.now();
  const importedProfiles = parsed.profiles.map((profile) => {
    const existing = existingByModelName.get(profile.modelName);
    const resolved = resolveApiKeyFromYaml(
      { apiKey: profile.apiKey, apiKeyEnv: profile.apiKeyEnv },
      existing?.apiKey
    );
    warnings.push(...resolved.warnings.map((w) => `[${profile.modelName}] ${w}`));
    return {
      name: profile.name,
      provider: profile.provider,
      modelName: profile.modelName,
      ...profile.baseURL ? { baseURL: profile.baseURL } : {},
      apiKey: resolved.apiKey,
      maxTokens: profile.maxTokens,
      contextLength: profile.contextLength,
      ...profile.reasoningEffort ? { reasoningEffort: profile.reasoningEffort } : {},
      isActive: profile.isActive ?? true,
      createdAt: profile.createdAt ?? existing?.createdAt ?? now,
      ...profile.lastUsed ? { lastUsed: profile.lastUsed } : existing?.lastUsed ? { lastUsed: existing.lastUsed } : {},
      ...existing?.isGPT5 ? { isGPT5: existing.isGPT5 } : {},
      ...existing?.validationStatus ? { validationStatus: existing.validationStatus } : {},
      ...existing?.lastValidation ? { lastValidation: existing.lastValidation } : {}
    };
  });
  const mergedProfiles = options.replace ? importedProfiles : [
    ...existingProfiles.filter(
      (p) => !importedProfiles.some((i) => i.modelName === p.modelName)
    ),
    ...importedProfiles
  ];
  const nextPointers = {
    ...existingConfig.modelPointers ?? {
      main: "",
      task: "",
      compact: "",
      quick: ""
    }
  };
  if (parsed.pointers) {
    const resolvedMain = parsed.pointers.main && resolvePointerTarget(parsed.pointers.main, mergedProfiles);
    const resolvedTask = parsed.pointers.task && resolvePointerTarget(parsed.pointers.task, mergedProfiles);
    const resolvedCompact = parsed.pointers.compact && resolvePointerTarget(parsed.pointers.compact, mergedProfiles);
    const resolvedQuick = parsed.pointers.quick && resolvePointerTarget(parsed.pointers.quick, mergedProfiles);
    if (parsed.pointers.main && !resolvedMain) {
      warnings.push(
        `[pointers.main] Unknown model '${parsed.pointers.main}' (expected modelName or profile name)`
      );
    } else if (resolvedMain) {
      nextPointers.main = resolvedMain;
    }
    if (parsed.pointers.task && !resolvedTask) {
      warnings.push(
        `[pointers.task] Unknown model '${parsed.pointers.task}' (expected modelName or profile name)`
      );
    } else if (resolvedTask) {
      nextPointers.task = resolvedTask;
    }
    if (parsed.pointers.compact && !resolvedCompact) {
      warnings.push(
        `[pointers.compact] Unknown model '${parsed.pointers.compact}' (expected modelName or profile name)`
      );
    } else if (resolvedCompact) {
      nextPointers.compact = resolvedCompact;
    }
    if (parsed.pointers.quick && !resolvedQuick) {
      warnings.push(
        `[pointers.quick] Unknown model '${parsed.pointers.quick}' (expected modelName or profile name)`
      );
    } else if (resolvedQuick) {
      nextPointers.quick = resolvedQuick;
    }
  }
  return {
    nextConfig: {
      ...existingConfig,
      modelProfiles: mergedProfiles,
      modelPointers: nextPointers
    },
    warnings
  };
}

// src/ui/screens/LogList.tsx
init_log();
import React8, { useEffect, useState } from "react";

// src/ui/components/LogSelector.tsx
import React7 from "react";
import { Box as Box4, Text as Text5 } from "ink";
init_log();
function LogSelector({
  logs,
  onSelect
}) {
  const { rows, columns } = useTerminalSize();
  if (logs.length === 0) {
    return null;
  }
  const visibleCount = rows - 3;
  const hiddenCount = Math.max(0, logs.length - visibleCount);
  const indexWidth = 7;
  const modifiedWidth = 21;
  const createdWidth = 21;
  const countWidth = 9;
  const options = logs.map((log, i) => {
    const index = `[${i}]`.padEnd(indexWidth);
    const modified = formatDate(log.modified).padEnd(modifiedWidth);
    const created = formatDate(log.created).padEnd(createdWidth);
    const msgCount = `${log.messageCount}`.padStart(countWidth);
    const prompt = log.firstPrompt;
    let branchInfo = "";
    if (log.forkNumber) branchInfo += ` (fork #${log.forkNumber})`;
    if (log.sidechainNumber)
      branchInfo += ` (sidechain #${log.sidechainNumber})`;
    const labelTxt = `${index}${modified}${created}${msgCount} ${prompt}${branchInfo}`;
    const truncated = labelTxt.length > columns - 2 ? `${labelTxt.slice(0, columns - 5)}...` : labelTxt;
    return {
      label: truncated,
      value: log.value.toString()
    };
  });
  return /* @__PURE__ */ React7.createElement(Box4, { flexDirection: "column", height: "100%", width: "100%" }, /* @__PURE__ */ React7.createElement(Box4, { paddingLeft: 9 }, /* @__PURE__ */ React7.createElement(Text5, { bold: true, color: getTheme().text }, "Modified"), /* @__PURE__ */ React7.createElement(Text5, null, "             "), /* @__PURE__ */ React7.createElement(Text5, { bold: true, color: getTheme().text }, "Created"), /* @__PURE__ */ React7.createElement(Text5, null, "             "), /* @__PURE__ */ React7.createElement(Text5, { bold: true, color: getTheme().text }, "# Messages"), /* @__PURE__ */ React7.createElement(Text5, null, " "), /* @__PURE__ */ React7.createElement(Text5, { bold: true, color: getTheme().text }, "First message")), /* @__PURE__ */ React7.createElement(
    Select,
    {
      options,
      onChange: (index) => onSelect(parseInt(index, 10)),
      visibleOptionCount: visibleCount
    }
  ), hiddenCount > 0 && /* @__PURE__ */ React7.createElement(Box4, { paddingLeft: 2 }, /* @__PURE__ */ React7.createElement(Text5, { color: getTheme().secondaryText }, "and ", hiddenCount, " more\u2026")));
}

// src/ui/screens/LogList.tsx
init_log();
init_log();
function LogList({ context, type, logNumber }) {
  const [logs, setLogs] = useState([]);
  const [didSelectLog, setDidSelectLog] = useState(false);
  useEffect(() => {
    loadLogList(
      type === "messages" ? CACHE_PATHS.messages() : CACHE_PATHS.errors()
    ).then((logs2) => {
      if (logNumber !== void 0) {
        const log = logs2[logNumber >= 0 ? logNumber : 0];
        if (log) {
          console.log(JSON.stringify(log.messages, null, 2));
          process.exit(0);
        } else {
          console.error("No log found at index", logNumber);
          process.exit(1);
        }
      }
      setLogs(logs2);
    }).catch((error) => {
      logError(error);
      if (logNumber !== void 0) {
        process.exit(1);
      } else {
        context.unmount?.();
      }
    });
  }, [context, type, logNumber]);
  function onSelect(index) {
    const log = logs[index];
    if (!log) {
      return;
    }
    setDidSelectLog(true);
    setTimeout(() => {
      console.log(JSON.stringify(log.messages, null, 2));
      process.exit(0);
    }, 100);
  }
  if (logNumber !== void 0) {
    return null;
  }
  if (didSelectLog) {
    return null;
  }
  return /* @__PURE__ */ React8.createElement(LogSelector, { logs, onSelect });
}

// src/entrypoints/mcp.ts
init_state();
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
init_log();
init_macros();
var state = {
  readFileTimestamps: {}
};
var MCP_COMMANDS = [review_default];
var MCP_TOOLS = [...getAllTools()];
async function startMCPServer(cwd2) {
  await setCwd(cwd2);
  const server = new Server(
    {
      name: "claude/tengu",
      version: MACRO.VERSION
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );
  server.setRequestHandler(
    ListToolsRequestSchema,
    async () => {
      const tools = await Promise.all(
        MCP_TOOLS.map(async (tool) => ({
          ...tool,
          description: getToolDescription(tool),
          inputSchema: zodToJsonSchema(
            tool.inputSchema
          )
        }))
      );
      return {
        tools
      };
    }
  );
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      const { name, arguments: args } = request.params;
      const tool = MCP_TOOLS.find((_) => _.name === name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }
      try {
        if (!await tool.isEnabled()) {
          throw new Error(`Tool ${name} is not enabled`);
        }
        const model = getModelManager().getModelName("main");
        const validationResult = await tool.validateInput?.(
          args ?? {},
          {
            abortController: new AbortController(),
            options: {
              commands: MCP_COMMANDS,
              tools: MCP_TOOLS,
              forkNumber: 0,
              messageLogName: "unused",
              maxThinkingTokens: 0
            },
            messageId: void 0,
            readFileTimestamps: state.readFileTimestamps
          }
        );
        if (validationResult && !validationResult.result) {
          throw new Error(
            `Tool ${name} input is invalid: ${validationResult.message}`
          );
        }
        const result = tool.call(args ?? {}, {
          abortController: new AbortController(),
          messageId: void 0,
          options: {
            commands: MCP_COMMANDS,
            tools: MCP_TOOLS,
            forkNumber: 0,
            messageLogName: "unused",
            maxThinkingTokens: 0
          },
          readFileTimestamps: state.readFileTimestamps
        });
        const finalResult = await lastX(result);
        if (finalResult.type !== "result") {
          throw new Error(`Tool ${name} did not return a result`);
        }
        return {
          content: Array.isArray(finalResult) ? finalResult.map((item) => ({
            type: "text",
            text: "text" in item ? item.text : JSON.stringify(item)
          })) : [
            {
              type: "text",
              text: typeof finalResult === "string" ? finalResult : JSON.stringify(finalResult.data)
            }
          ]
        };
      } catch (error) {
        logError(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
  return await runServer();
}

// src/entrypoints/cli/runCli.tsx
init_state();
init_log();

// src/utils/session/conversationRecovery.ts
init_log();
import fs2 from "fs/promises";
async function loadMessagesFromLog(logPath, tools) {
  try {
    const content = await fs2.readFile(logPath, "utf-8");
    const messages = JSON.parse(content);
    return deserializeMessages(messages, tools);
  } catch (error) {
    logError(`Failed to load messages from ${logPath}: ${error}`);
    throw new Error(`Failed to load messages from log: ${error}`);
  }
}
function deserializeMessages(messages, tools) {
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
  return messages.map((message) => {
    const clonedMessage = JSON.parse(JSON.stringify(message));
    if (clonedMessage.toolCalls) {
      clonedMessage.toolCalls = clonedMessage.toolCalls.map((toolCall) => {
        if (toolCall.tool && typeof toolCall.tool === "string") {
          const actualTool = toolMap.get(toolCall.tool);
          if (actualTool) {
            toolCall.tool = actualTool;
          }
        }
        return toolCall;
      });
    }
    return clonedMessage;
  });
}

// src/commands/approved-tools.ts
var defaultConfigHandler = {
  getCurrentProjectConfig,
  saveCurrentProjectConfig
};
function handleListApprovedTools(cwd2, projectConfigHandler = defaultConfigHandler) {
  const projectConfig = projectConfigHandler.getCurrentProjectConfig();
  return `Allowed tools for ${cwd2}:
${projectConfig.allowedTools.join("\n")}`;
}
function handleRemoveApprovedTool(tool, projectConfigHandler = defaultConfigHandler) {
  const projectConfig = projectConfigHandler.getCurrentProjectConfig();
  const originalToolCount = projectConfig.allowedTools.length;
  const updatedAllowedTools = projectConfig.allowedTools.filter((t) => t !== tool);
  if (originalToolCount !== updatedAllowedTools.length) {
    projectConfig.allowedTools = updatedAllowedTools;
    projectConfigHandler.saveCurrentProjectConfig(projectConfig);
    return {
      success: true,
      message: `Removed ${tool} from the list of approved tools`
    };
  } else {
    return {
      success: false,
      message: `${tool} was not in the list of approved tools`
    };
  }
}

// src/entrypoints/cli/runCli.tsx
import { cursorShow } from "ansi-escapes";
init_log();
init_shell();

// src/ui/components/InvalidConfigDialog.tsx
import React9 from "react";
import { Box as Box5, Newline, Text as Text6, useInput as useInput4 } from "ink";
import { render as render2 } from "ink";
import { writeFileSync } from "fs";
function InvalidConfigDialog({
  filePath,
  errorDescription,
  onExit,
  onReset
}) {
  const theme = getTheme();
  useInput4((_, key) => {
    if (key.escape) {
      onExit();
    }
  });
  const exitState = useExitOnCtrlCD(() => process.exit(0));
  const handleSelect = (value) => {
    if (value === "exit") {
      onExit();
    } else {
      onReset();
    }
  };
  return /* @__PURE__ */ React9.createElement(React9.Fragment, null, /* @__PURE__ */ React9.createElement(
    Box5,
    {
      flexDirection: "column",
      borderColor: theme.error,
      borderStyle: "round",
      padding: 1,
      width: 70,
      gap: 1
    },
    /* @__PURE__ */ React9.createElement(Text6, { bold: true }, "Configuration Error"),
    /* @__PURE__ */ React9.createElement(Box5, { flexDirection: "column", gap: 1 }, /* @__PURE__ */ React9.createElement(Text6, null, "The configuration file at ", /* @__PURE__ */ React9.createElement(Text6, { bold: true }, filePath), " contains invalid JSON."), /* @__PURE__ */ React9.createElement(Text6, null, errorDescription)),
    /* @__PURE__ */ React9.createElement(Box5, { flexDirection: "column" }, /* @__PURE__ */ React9.createElement(Text6, { bold: true }, "Choose an option:"), /* @__PURE__ */ React9.createElement(
      Select,
      {
        options: [
          { label: "Exit and fix manually", value: "exit" },
          { label: "Reset with default configuration", value: "reset" }
        ],
        onChange: handleSelect
      }
    ))
  ), exitState.pending ? /* @__PURE__ */ React9.createElement(Text6, { dimColor: true }, "Press ", exitState.keyName, " again to exit") : /* @__PURE__ */ React9.createElement(Newline, null));
}
function showInvalidConfigDialog({
  error
}) {
  return new Promise((resolve) => {
    render2(
      /* @__PURE__ */ React9.createElement(
        InvalidConfigDialog,
        {
          filePath: error.filePath,
          errorDescription: error.message,
          onExit: () => {
            resolve();
            process.exit(1);
          },
          onReset: () => {
            writeFileSync(
              error.filePath,
              JSON.stringify(error.defaultConfig, null, 2)
            );
            resolve();
            process.exit(0);
          }
        }
      ),
      { exitOnCtrlC: false }
    );
  });
}

// src/entrypoints/cli/runCli.tsx
init_macros();
function omitKeys(input, ...keys) {
  const result = { ...input };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
async function runCli() {
  initDebugLogger();
  try {
    enableConfigs();
    queueMicrotask(() => {
      try {
        validateAndRepairAllGPT5Profiles();
      } catch (repairError) {
        logError(`GPT-5 configuration validation failed: ${repairError}`);
      }
    });
  } catch (error) {
    if (error instanceof ConfigParseError) {
      await showInvalidConfigDialog({ error });
      return;
    }
  }
  let inputPrompt = "";
  let renderContext = {
    exitOnCtrlC: false,
    onFlicker() {
    }
  };
  const wantsStreamJsonStdin = process.argv.some(
    (arg, idx, all) => arg === "--input-format" && all[idx + 1] === "stream-json"
  ) || process.argv.some((arg) => arg.startsWith("--input-format=stream-json"));
  if (!process.stdin.isTTY && !process.env.CI && !process.argv.includes("mcp") && !wantsStreamJsonStdin) {
    inputPrompt = await stdin();
    if (process.platform !== "win32") {
      try {
        const ttyFd = openSync("/dev/tty", "r");
        renderContext = { ...renderContext, stdin: new ReadStream(ttyFd) };
      } catch (err) {
        logError(`Could not open /dev/tty: ${err}`);
      }
    }
  }
  await parseArgs(inputPrompt, renderContext);
}
async function parseArgs(stdinContent, renderContext) {
  const program = new Command();
  const renderContextWithExitOnCtrlC = {
    ...renderContext,
    exitOnCtrlC: true
  };
  program.name(PRODUCT_COMMAND).description(
    `${PRODUCT_NAME} - starts an interactive session by default, use -p/--print for non-interactive output`
  ).argument("[prompt]", "Your prompt", String).option("--cwd <cwd>", "The current working directory", String, cwd()).option(
    "-d, --debug [filter]",
    'Enable debug mode with optional category filtering (e.g., "api,hooks" or "!statsig,!file")'
  ).option(
    "--debug-verbose",
    "Enable verbose debug terminal output",
    () => true
  ).option(
    "--verbose",
    "Override verbose mode setting from config",
    () => true
  ).option("-e, --enable-architect", "Enable the Architect tool", () => true).option(
    "-p, --print",
    "Print response and exit (useful for pipes)",
    () => true
  ).option(
    "--output-format <format>",
    'Output format (only works with --print): "text" (default), "json", or "stream-json"',
    String,
    "text"
  ).option(
    "--json-schema <schema>",
    'JSON Schema for structured output validation. Example: {"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}',
    String
  ).option(
    "--input-format <format>",
    'Input format (only works with --print): "text" (default) or "stream-json"',
    String,
    "text"
  ).option(
    "--mcp-debug",
    "[DEPRECATED. Use --debug instead] Enable MCP debug mode (shows MCP server errors)",
    () => true
  ).option(
    "--dangerously-skip-permissions",
    "Bypass all permission checks. Recommended only for sandboxes with no internet access.",
    () => true
  ).option(
    "--allow-dangerously-skip-permissions",
    "Enable bypassing all permission checks as an option, without it being enabled by default. Recommended only for sandboxes with no internet access.",
    () => true
  ).option(
    "--max-budget-usd <amount>",
    "Maximum dollar amount to spend on API calls (only works with --print)",
    String
  ).option(
    "--include-partial-messages",
    "Include partial message chunks as they arrive (only works with --print and --output-format=stream-json)",
    () => true
  ).option(
    "--replay-user-messages",
    "Re-emit user messages from stdin back on stdout for acknowledgment (only works with --input-format=stream-json and --output-format=stream-json)",
    () => true
  ).option(
    "--allowedTools, --allowed-tools <tools...>",
    'Comma or space-separated list of tool names to allow (e.g. "Bash(git:*) Edit")'
  ).option(
    "--tools <tools...>",
    'Specify the list of available tools from the built-in set. Use "" to disable all tools, "default" to use all tools, or specify tool names (e.g. "Bash,Edit,Read"). Only works with --print mode.'
  ).option(
    "--disallowedTools, --disallowed-tools <tools...>",
    'Comma or space-separated list of tool names to deny (e.g. "Bash(git:*) Edit")'
  ).option(
    "--mcp-config <configs...>",
    "Load MCP servers from JSON files or strings (space-separated)"
  ).option("--system-prompt <prompt>", "System prompt to use for the session").option(
    "--append-system-prompt <prompt>",
    "Append a system prompt to the default system prompt"
  ).option(
    "--permission-mode <mode>",
    'Permission mode to use for the session (choices: "acceptEdits", "bypassPermissions", "default", "delegate", "dontAsk", "plan")',
    String
  ).option(
    "--permission-prompt-tool <tool>",
    'Permission prompt tool (only works with --print, --output-format=stream-json, and --input-format=stream-json): "stdio"',
    String
  ).option(
    "--safe",
    "Enable strict permission checking mode (default is permissive)",
    () => true
  ).option(
    "--disable-slash-commands",
    "Disable slash commands (treat /... as plain text)",
    () => true
  ).option(
    "--plugin-dir <paths...>",
    "Load plugins from directories for this session only (repeatable)",
    (value, previous) => {
      const prev = Array.isArray(previous) ? previous : [];
      const next = Array.isArray(value) ? value : [value];
      return [...prev, ...next].filter(Boolean);
    },
    []
  ).option(
    "--model <model>",
    "Model for the current session. Provide an alias for the latest model (e.g. 'sonnet' or 'opus') or a model's full name.",
    String
  ).option(
    "--agent <agent>",
    "Agent for the current session. Overrides the 'agent' setting.",
    String
  ).option(
    "--betas <betas...>",
    "Beta headers to include in API requests (API key users only)"
  ).option(
    "--fallback-model <model>",
    "Enable automatic fallback to specified model when default model is overloaded (only works with --print)",
    String
  ).option(
    "--settings <file-or-json>",
    "Path to a settings JSON file or a JSON string to load additional settings from",
    String
  ).option(
    "--add-dir <directories...>",
    "Additional directories to allow tool access to"
  ).option(
    "--ide",
    "Automatically connect to IDE on startup if exactly one valid IDE is available",
    () => true
  ).option(
    "--strict-mcp-config",
    "Only use MCP servers from --mcp-config, ignoring all other MCP configurations",
    () => true
  ).option(
    "--agents <json>",
    `JSON object defining custom agents (e.g. '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}')`,
    String
  ).option(
    "--setting-sources <sources>",
    "Comma-separated list of setting sources to load (user, project, local).",
    String
  ).option(
    "-r, --resume [value]",
    "Resume a conversation by session ID or session name (omit value to open selector)"
  ).option(
    "-c, --continue",
    "Continue the most recent conversation",
    () => true
  ).option(
    "--fork-session",
    "When resuming/continuing, create a new session ID instead of reusing the original (use with --resume or --continue)",
    () => true
  ).option(
    "--no-session-persistence",
    "Disable session persistence - sessions will not be saved to disk and cannot be resumed (only works with --print)"
  ).option(
    "--session-id <uuid>",
    "Use a specific session ID for the conversation (must be a valid UUID)",
    String
  ).action(
    async (prompt, {
      cwd: cwd2,
      debug: debug2,
      verbose,
      enableArchitect,
      print,
      outputFormat,
      jsonSchema,
      inputFormat,
      mcpDebug,
      dangerouslySkipPermissions,
      allowDangerouslySkipPermissions,
      maxBudgetUsd,
      includePartialMessages,
      replayUserMessages,
      allowedTools: allowedTools2,
      tools: cliTools,
      disallowedTools,
      mcpConfig,
      systemPrompt: systemPromptOverride,
      appendSystemPrompt,
      permissionMode,
      permissionPromptTool,
      safe,
      disableSlashCommands,
      pluginDir,
      model,
      addDir,
      strictMcpConfig,
      agents,
      settingSources,
      resume,
      continue: continueConversation,
      forkSession,
      sessionId,
      sessionPersistence
    }) => {
      try {
        setEnabledSettingSourcesFromCli(settingSources);
      } catch (err) {
        process.stderr.write(
          `Error processing --setting-sources: ${err instanceof Error ? err.message : String(err)}
`
        );
        process.exit(1);
      }
      setFlagAgentsFromCliJson(agents);
      clearAgentCache();
      clearOutputStyleCache();
      await setup(cwd2, safe);
      await showSetupScreens(safe, print);
      assertMinVersion();
      {
        const requested = Array.isArray(pluginDir) && pluginDir.length > 0 ? pluginDir : [];
        const { listEnabledInstalledPluginPackRoots } = await import("./skillMarketplace-NX6XZDT4.js");
        const installed = listEnabledInstalledPluginPackRoots();
        const all = [...installed, ...requested].filter(Boolean);
        const deduped = Array.from(new Set(all));
        if (deduped.length > 0) {
          const { configureSessionPlugins } = await import("./pluginRuntime-SN62Y6FC.js");
          const { errors } = await configureSessionPlugins({
            pluginDirs: deduped
          });
          for (const err of errors) {
            console.warn(err);
          }
        }
      }
      const [{ ask }, { getTools }, { getCommands }] = await Promise.all([
        import("./ask-ZE2CNNSH.js"),
        import("./tools-XL3UTAPA.js"),
        import("./commands-2LTR54FC.js")
      ]);
      const commands = await getCommands();
      const mcpClientsPromise = Array.isArray(mcpConfig) && mcpConfig.length > 0 || strictMcpConfig === true ? getClientsForCliMcpConfig({
        mcpConfig: Array.isArray(mcpConfig) ? mcpConfig : [],
        strictMcpConfig: strictMcpConfig === true,
        projectDir: cwd2
      }) : getClients();
      const [allTools, mcpClients] = await Promise.all([
        getTools(
          enableArchitect ?? getCurrentProjectConfig().enableArchitectTool
        ),
        mcpClientsPromise
      ]);
      const tools = disableSlashCommands === true ? allTools.filter((t) => t.name !== "SlashCommand") : allTools;
      const inputPrompt = [prompt, stdinContent].filter(Boolean).join("\n");
      const {
        loadDanyaAgentSessionMessages,
        findMostRecentDanyaAgentSessionId
      } = await import("./kodeAgentSessionLoad-L54J2WSU.js");
      const { listDanyaAgentSessions, resolveResumeSessionIdentifier } = await import("./kodeAgentSessionResume-4S4ZW7WI.js");
      const { isUuid } = await import("./uuid-QUYJMIUV.js");
      const { setDanyaAgentSessionId, getDanyaAgentSessionId } = await import("./kodeAgentSessionId-WUT74FSH.js");
      const { randomUUID } = await import("crypto");
      const wantsContinue = Boolean(continueConversation);
      const wantsResume = resume !== void 0;
      const wantsFork = Boolean(forkSession);
      if (sessionId && !isUuid(String(sessionId))) {
        console.error(`Error: --session-id must be a valid UUID`);
        process.exit(1);
      }
      if (sessionId && (wantsContinue || wantsResume) && !wantsFork) {
        console.error(
          `Error: --session-id can only be used with --continue or --resume if --fork-session is also specified.`
        );
        process.exit(1);
      }
      let initialMessages;
      let resumedFromSessionId = null;
      let needsResumeSelector = false;
      if (wantsContinue) {
        const latest = findMostRecentDanyaAgentSessionId(cwd2);
        if (!latest) {
          console.error("No conversation found to continue");
          process.exit(1);
        }
        initialMessages = loadDanyaAgentSessionMessages({
          cwd: cwd2,
          sessionId: latest
        });
        resumedFromSessionId = latest;
      } else if (wantsResume) {
        if (resume === true) {
          needsResumeSelector = true;
        } else {
          const identifier = String(resume);
          const resolved = resolveResumeSessionIdentifier({ cwd: cwd2, identifier });
          if (resolved.kind === "ok") {
            initialMessages = loadDanyaAgentSessionMessages({
              cwd: cwd2,
              sessionId: resolved.sessionId
            });
            resumedFromSessionId = resolved.sessionId;
          } else if (resolved.kind === "different_directory") {
            console.error(
              resolved.otherCwd ? `Error: That session belongs to a different directory: ${resolved.otherCwd}` : `Error: That session belongs to a different directory.`
            );
            process.exit(1);
          } else if (resolved.kind === "ambiguous") {
            console.error(
              `Error: Multiple sessions match "${identifier}": ${resolved.matchingSessionIds.join(
                ", "
              )}`
            );
            process.exit(1);
          } else {
            console.error(
              `No conversation found with session ID or name: ${identifier}`
            );
            process.exit(1);
          }
        }
      }
      if (needsResumeSelector && print) {
        console.error(
          "Error: --resume without a value requires interactive mode (no --print)."
        );
        process.exit(1);
      }
      if (!needsResumeSelector) {
        const effectiveSessionId = (() => {
          if (resumedFromSessionId) {
            if (wantsFork) return sessionId ? String(sessionId) : randomUUID();
            return resumedFromSessionId;
          }
          if (sessionId) return String(sessionId);
          return getDanyaAgentSessionId();
        })();
        setDanyaAgentSessionId(effectiveSessionId);
      }
      if (print) {
        await runPrintMode({
          prompt,
          stdinContent,
          inputPrompt,
          cwd: cwd2,
          safe,
          verbose,
          outputFormat,
          inputFormat,
          jsonSchema,
          permissionPromptTool,
          replayUserMessages,
          cliTools,
          tools,
          commands,
          ask,
          initialMessages,
          sessionPersistence,
          systemPromptOverride,
          appendSystemPrompt,
          disableSlashCommands,
          allowedTools: allowedTools2,
          disallowedTools,
          addDir,
          permissionMode,
          dangerouslySkipPermissions,
          allowDangerouslySkipPermissions,
          model,
          mcpClients
        });
        return;
      } else {
        if (sessionPersistence === false) {
          console.error(
            "Error: --no-session-persistence only works with --print"
          );
          process.exit(1);
        }
        const updateInfo = await (async () => {
          try {
            const [
              { getLatestVersion, getUpdateCommandSuggestions },
              semverMod
            ] = await Promise.all([
              import("./autoUpdater-KEQOIUBC.js"),
              import("semver")
            ]);
            const semver = semverMod?.default ?? semverMod;
            const gt = semver?.gt;
            if (typeof gt !== "function")
              return {
                version: null,
                commands: null
              };
            const latest = await getLatestVersion();
            if (latest && gt(latest, MACRO.VERSION)) {
              const cmds = await getUpdateCommandSuggestions();
              return { version: latest, commands: cmds };
            }
          } catch {
          }
          return {
            version: null,
            commands: null
          };
        })();
        if (needsResumeSelector) {
          const sessions = listDanyaAgentSessions({ cwd: cwd2 });
          if (sessions.length === 0) {
            console.error("No conversation found to resume");
            process.exit(1);
          }
          const context2 = {};
          (async () => {
            const { render: render3 } = await import("ink");
            const { unmount } = render3(
              /* @__PURE__ */ React10.createElement(
                ResumeConversation,
                {
                  cwd: cwd2,
                  context: context2,
                  commands,
                  sessions,
                  tools,
                  verbose,
                  safeMode: safe,
                  debug: Boolean(debug2),
                  disableSlashCommands: disableSlashCommands === true,
                  mcpClients,
                  initialPrompt: inputPrompt,
                  forkSession: wantsFork,
                  forkSessionId: sessionId ? String(sessionId) : null,
                  initialUpdateVersion: updateInfo.version,
                  initialUpdateCommands: updateInfo.commands
                }
              ),
              renderContextWithExitOnCtrlC
            );
            context2.unmount = unmount;
          })();
          return;
        }
        const isDefaultModel = await isDefaultSlowAndCapableModel();
        {
          const { render: render3 } = await import("ink");
          const { REPL } = await import("./REPL-4R6ZWV74.js");
          render3(
            /* @__PURE__ */ React10.createElement(
              REPL,
              {
                commands,
                debug: Boolean(debug2),
                disableSlashCommands: disableSlashCommands === true,
                initialPrompt: inputPrompt,
                messageLogName: dateToFilename(/* @__PURE__ */ new Date()),
                shouldShowPromptInput: true,
                verbose,
                tools,
                safeMode: safe,
                mcpClients,
                isDefaultModel,
                initialUpdateVersion: updateInfo.version,
                initialUpdateCommands: updateInfo.commands,
                initialMessages
              }
            ),
            renderContext
          );
        }
      }
    }
  ).version(MACRO.VERSION, "-v, --version");
  const config = program.command("config").description(
    `Manage configuration (eg. ${PRODUCT_COMMAND} config set -g theme dark)`
  );
  config.command("get <key>").description("Get a config value").option("--cwd <cwd>", "The current working directory", String, cwd()).option("-g, --global", "Use global config").action(async (key, { cwd: cwd2, global }) => {
    await setup(cwd2, false);
    console.log(getConfigForCLI(key, global ?? false));
    process.exit(0);
  });
  config.command("set <key> <value>").description("Set a config value").option("--cwd <cwd>", "The current working directory", String, cwd()).option("-g, --global", "Use global config").action(async (key, value, { cwd: cwd2, global }) => {
    await setup(cwd2, false);
    setConfigForCLI(key, value, global ?? false);
    console.log(`Set ${key} to ${value}`);
    process.exit(0);
  });
  config.command("remove <key>").description("Remove a config value").option("--cwd <cwd>", "The current working directory", String, cwd()).option("-g, --global", "Use global config").action(async (key, { cwd: cwd2, global }) => {
    await setup(cwd2, false);
    deleteConfigForCLI(key, global ?? false);
    console.log(`Removed ${key}`);
    process.exit(0);
  });
  config.command("list").description("List all config values").option("--cwd <cwd>", "The current working directory", String, cwd()).option("-g, --global", "Use global config", false).action(async ({ cwd: cwd2, global }) => {
    await setup(cwd2, false);
    console.log(
      JSON.stringify(
        global ? listConfigForCLI(true) : listConfigForCLI(false),
        null,
        2
      )
    );
    process.exit(0);
  });
  const modelsCmd = program.command("models").description("Import/export model profiles and pointers (YAML)");
  modelsCmd.command("export").description(
    "Export shareable model config as YAML (does not include plaintext API keys)"
  ).option("--cwd <cwd>", "The current working directory", String, cwd()).option("-o, --output <path>", "Write YAML to file instead of stdout").action(async ({ cwd: cwd2, output }) => {
    try {
      await setup(cwd2, false);
      const yamlText = formatModelConfigYamlForSharing(getGlobalConfig());
      if (output) {
        writeFileSync2(output, yamlText, "utf-8");
        console.log(`Wrote model config YAML to ${output}`);
      } else {
        console.log(yamlText);
      }
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  modelsCmd.command("import <file>").description("Import model config YAML (merges by default)").option("--cwd <cwd>", "The current working directory", String, cwd()).option("--replace", "Replace existing model profiles instead of merging").action(async (file, { cwd: cwd2, replace }) => {
    try {
      await setup(cwd2, false);
      const yamlText = readFileSync(file, "utf-8");
      const { nextConfig, warnings } = applyModelConfigYamlImport(
        getGlobalConfig(),
        yamlText,
        { replace: !!replace }
      );
      saveGlobalConfig(nextConfig);
      await import("./model-NIOLLP6W.js").then(({ reloadModelManager }) => {
        reloadModelManager();
      });
      if (warnings.length > 0) {
        console.error(warnings.join("\n"));
      }
      console.log(`Imported model config YAML from ${file}`);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  modelsCmd.command("list").description("List configured model profiles and pointers").option("--cwd <cwd>", "The current working directory", String, cwd()).option("--json", "Output as JSON").action(async (options) => {
    try {
      const workingDir = typeof options?.cwd === "string" ? options.cwd : cwd();
      const asJson = options?.json === true;
      await setup(workingDir, false);
      const { reloadModelManager, getModelManager: getModelManager2 } = await import("./model-NIOLLP6W.js");
      reloadModelManager();
      const manager = getModelManager2();
      const config2 = getGlobalConfig();
      const pointers = ["main", "task", "compact", "quick"].map(
        (pointer) => {
          const pointerId = config2.modelPointers?.[pointer] ?? null;
          const resolved = manager.resolveModelWithInfo(pointer);
          const profile = resolved.success ? resolved.profile : null;
          return {
            pointer,
            pointerId,
            resolved: profile ? {
              name: profile.name,
              provider: profile.provider,
              modelName: profile.modelName,
              isActive: profile.isActive
            } : null,
            error: resolved.success ? null : resolved.error ?? null
          };
        }
      );
      const profiles = (config2.modelProfiles ?? []).map((p) => ({
        name: p.name,
        provider: p.provider,
        modelName: p.modelName,
        baseURL: p.baseURL ?? null,
        maxTokens: p.maxTokens,
        contextLength: p.contextLength,
        reasoningEffort: p.reasoningEffort ?? null,
        isActive: p.isActive,
        createdAt: p.createdAt,
        lastUsed: typeof p.lastUsed === "number" ? p.lastUsed : null,
        isGPT5: p.isGPT5 ?? null,
        validationStatus: p.validationStatus ?? null,
        lastValidation: typeof p.lastValidation === "number" ? p.lastValidation : null,
        hasApiKey: Boolean(p.apiKey)
      }));
      if (asJson) {
        console.log(JSON.stringify({ pointers, profiles }, null, 2));
        process.exitCode = 0;
        return;
      }
      console.log("Model pointers:\n");
      for (const ptr of pointers) {
        const resolvedLabel = ptr.resolved ? `${ptr.resolved.name} (${ptr.resolved.provider}:${ptr.resolved.modelName})` : "(unresolved)";
        const configured = ptr.pointerId ? ` -> ${ptr.pointerId}` : "";
        const err = ptr.error ? ` [${ptr.error}]` : "";
        console.log(`  - ${ptr.pointer}${configured}: ${resolvedLabel}${err}`);
      }
      const active = profiles.filter((p) => p.isActive);
      console.log(`
Model profiles (${active.length}/${profiles.length} active):
`);
      for (const p of profiles.sort((a, b) => a.name.localeCompare(b.name))) {
        const status = p.isActive ? "active" : "inactive";
        console.log(`  - ${p.name} (${status})`);
        console.log(`    provider=${p.provider} modelName=${p.modelName}`);
        if (p.baseURL) console.log(`    baseURL=${p.baseURL}`);
      }
      process.exitCode = 0;
      return;
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
  });
  const agentsCmd = program.command("agents").description("Agent utilities (validate templates, etc.)");
  agentsCmd.command("validate [paths...]").description("Validate agent markdown files (defaults to user+project agent dirs)").option("--cwd <cwd>", "The current working directory", String, cwd()).option("--json", "Output as JSON").option("--no-tools-check", "Skip validating tool names against the tool registry").action(
    async (paths, options) => {
      try {
        const workingDir = typeof options?.cwd === "string" ? options.cwd : cwd();
        await setup(workingDir, false);
        const { validateAgentTemplates } = await import("./agentsValidate-XG3K3DFC.js");
        const report = await validateAgentTemplates({
          cwd: workingDir,
          paths: Array.isArray(paths) ? paths : [],
          checkTools: options.toolsCheck !== false
        });
        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
          process.exitCode = report.ok ? 0 : 1;
          return;
        }
        console.log(
          `Validated ${report.results.length} agent file(s): ${report.errorCount} error(s), ${report.warningCount} warning(s)
`
        );
        for (const r of report.results) {
          const rel = r.filePath;
          const title = r.agentType ? `${r.agentType}` : "(unknown agent)";
          console.log(`${title} \u2014 ${rel}`);
          if (r.model) {
            const normalized = r.normalizedModel ? ` (normalized: ${r.normalizedModel})` : "";
            console.log(`  model: ${r.model}${normalized}`);
          }
          if (r.issues.length === 0) {
            console.log(`  OK`);
          } else {
            for (const issue of r.issues) {
              console.log(`  - ${issue.level}: ${issue.message}`);
            }
          }
          console.log("");
        }
        process.exitCode = report.ok ? 0 : 1;
        return;
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
        return;
      }
    }
  );
  const registerMarketplaceCommands = (marketplaceCmd2) => {
    marketplaceCmd2.command("add <source>").description("Add a marketplace from a URL, path, or GitHub repo").action(async (source) => {
      try {
        const { addMarketplace } = await import("./skillMarketplace-NX6XZDT4.js");
        console.log("Adding marketplace...");
        const { name } = await addMarketplace(source);
        console.log(`Successfully added marketplace: ${name}`);
        process.exit(0);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    });
    marketplaceCmd2.command("list").description("List all configured marketplaces").option("--json", "Output as JSON").action(async (options) => {
      try {
        const { listMarketplaces } = await import("./skillMarketplace-NX6XZDT4.js");
        const marketplaces = listMarketplaces();
        if (options.json) {
          console.log(JSON.stringify(marketplaces, null, 2));
          process.exit(0);
        }
        const names = Object.keys(marketplaces).sort();
        if (names.length === 0) {
          console.log("No marketplaces configured");
          process.exit(0);
        }
        console.log("Configured marketplaces:\n");
        for (const name of names) {
          const entry = marketplaces[name];
          console.log(`  - ${name}`);
          const src = entry?.source;
          if (src?.source === "github") {
            console.log(`    Source: GitHub (${src.repo})`);
          } else if (src?.source === "git") {
            console.log(`    Source: Git (${src.url})`);
          } else if (src?.source === "url") {
            console.log(`    Source: URL (${src.url})`);
          } else if (src?.source === "directory") {
            console.log(`    Source: Directory (${src.path})`);
          } else if (src?.source === "file") {
            console.log(`    Source: File (${src.path})`);
          } else if (src?.source === "npm") {
            console.log(`    Source: NPM (${src.package})`);
          }
          console.log("");
        }
        process.exit(0);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    });
    marketplaceCmd2.command("remove <name>").alias("rm").description("Remove a configured marketplace").action(async (name) => {
      try {
        const { removeMarketplace } = await import("./skillMarketplace-NX6XZDT4.js");
        removeMarketplace(name);
        console.log(`Successfully removed marketplace: ${name}`);
        process.exit(0);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    });
    marketplaceCmd2.command("update [name]").description(
      "Update marketplace(s) from their source - updates all if no name specified"
    ).action(async (name, _options) => {
      try {
        const {
          listMarketplaces,
          refreshAllMarketplacesAsync,
          refreshMarketplaceAsync
        } = await import("./skillMarketplace-NX6XZDT4.js");
        const trimmed = typeof name === "string" ? name.trim() : "";
        if (trimmed) {
          console.log(`Updating marketplace: ${trimmed}...`);
          await refreshMarketplaceAsync(trimmed);
          console.log(`Successfully updated marketplace: ${trimmed}`);
          process.exit(0);
        }
        const marketplaces = listMarketplaces();
        const names = Object.keys(marketplaces);
        if (names.length === 0) {
          console.log("No marketplaces configured");
          process.exit(0);
        }
        console.log(`Updating ${names.length} marketplace(s)...`);
        await refreshAllMarketplacesAsync((message) => {
          console.log(message);
        });
        console.log(`Successfully updated ${names.length} marketplace(s)`);
        process.exit(0);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    });
  };
  const pluginCmd = program.command("plugin").description("Manage plugins and marketplaces");
  const pluginMarketplaceCmd = pluginCmd.command("marketplace").description(
    "Manage marketplaces (.danya-plugin/marketplace.json; legacy .claude-plugin supported)"
  );
  registerMarketplaceCommands(pluginMarketplaceCmd);
  const PLUGIN_SCOPES = ["user", "project", "local"];
  const parsePluginScope = (value) => {
    const normalized = String(value || "user");
    return PLUGIN_SCOPES.includes(normalized) ? normalized : null;
  };
  pluginCmd.command("install <plugin>").alias("i").description(
    "Install a plugin from available marketplaces (use plugin@marketplace for specific marketplace)"
  ).option("--cwd <cwd>", "The current working directory", String, cwd()).option(
    "-s, --scope <scope>",
    "Installation scope: user, project, or local",
    "user"
  ).option("--force", "Overwrite existing installed files", () => true).action(async (plugin, options) => {
    try {
      const scope = parsePluginScope(options.scope);
      if (!scope) {
        console.error(
          `Invalid scope: ${String(options.scope)}. Must be one of: ${PLUGIN_SCOPES.join(", ")}`
        );
        process.exit(1);
      }
      const { setCwd: setCwd2 } = await import("./state-YAYMHZAZ.js");
      await setCwd2(options.cwd ?? cwd());
      const { installSkillPlugin } = await import("./skillMarketplace-NX6XZDT4.js");
      const result = installSkillPlugin(plugin, {
        scope,
        force: options.force === true
      });
      const skillList = result.installedSkills.length > 0 ? `Skills: ${result.installedSkills.join(", ")}` : "Skills: (none)";
      console.log(`Installed ${result.pluginSpec}
${skillList}`);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  pluginCmd.command("uninstall <plugin>").alias("remove").alias("rm").description("Uninstall an installed plugin").option("--cwd <cwd>", "The current working directory", String, cwd()).option(
    "-s, --scope <scope>",
    `Uninstall from scope: ${PLUGIN_SCOPES.join(", ")} (default: user)`,
    "user"
  ).action(async (plugin, options) => {
    try {
      const scope = parsePluginScope(options.scope);
      if (!scope) {
        console.error(
          `Invalid scope: ${String(options.scope)}. Must be one of: ${PLUGIN_SCOPES.join(", ")}`
        );
        process.exit(1);
      }
      const { setCwd: setCwd2 } = await import("./state-YAYMHZAZ.js");
      await setCwd2(options.cwd ?? cwd());
      const { uninstallSkillPlugin } = await import("./skillMarketplace-NX6XZDT4.js");
      const result = uninstallSkillPlugin(plugin, { scope });
      const skillList = result.removedSkills.length > 0 ? `Skills: ${result.removedSkills.join(", ")}` : "Skills: (none)";
      console.log(`Uninstalled ${result.pluginSpec}
${skillList}`);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  pluginCmd.command("list").description("List installed plugins").option("--cwd <cwd>", "The current working directory", String, cwd()).option(
    "-s, --scope <scope>",
    `Filter by scope: ${PLUGIN_SCOPES.join(", ")} (default: user)`,
    "user"
  ).option("--json", "Output as JSON").action(async (options) => {
    try {
      const scope = parsePluginScope(options.scope);
      if (!scope) {
        console.error(
          `Invalid scope: ${String(options.scope)}. Must be one of: ${PLUGIN_SCOPES.join(", ")}`
        );
        process.exit(1);
      }
      const { setCwd: setCwd2, getCwd: getCwd2 } = await import("./state-YAYMHZAZ.js");
      await setCwd2(options.cwd ?? cwd());
      const { listInstalledSkillPlugins } = await import("./skillMarketplace-NX6XZDT4.js");
      const all = listInstalledSkillPlugins();
      const filtered = Object.fromEntries(
        Object.entries(all).filter(([, record]) => {
          if (record?.scope !== scope) return false;
          if (scope === "user") return true;
          return record?.projectPath === getCwd2();
        })
      );
      if (options.json) {
        console.log(JSON.stringify(filtered, null, 2));
        process.exit(0);
      }
      const names = Object.keys(filtered).sort();
      if (names.length === 0) {
        console.log("No plugins installed");
        process.exit(0);
      }
      console.log(`Installed plugins (scope=${scope}):
`);
      for (const spec of names) {
        const record = filtered[spec];
        const enabled = record?.isEnabled === false ? "disabled" : "enabled";
        console.log(`  - ${spec} (${enabled})`);
      }
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  pluginCmd.command("enable <plugin>").description("Enable a disabled plugin").option("--cwd <cwd>", "The current working directory", String, cwd()).option(
    "-s, --scope <scope>",
    `Installation scope: ${PLUGIN_SCOPES.join(", ")} (default: user)`,
    "user"
  ).action(async (plugin, options) => {
    try {
      const scope = parsePluginScope(options.scope);
      if (!scope) {
        console.error(
          `Invalid scope: ${String(options.scope)}. Must be one of: ${PLUGIN_SCOPES.join(", ")}`
        );
        process.exit(1);
      }
      const { setCwd: setCwd2 } = await import("./state-YAYMHZAZ.js");
      await setCwd2(options.cwd ?? cwd());
      const { enableSkillPlugin } = await import("./skillMarketplace-NX6XZDT4.js");
      const result = enableSkillPlugin(plugin, { scope });
      console.log(`Enabled ${result.pluginSpec}`);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  pluginCmd.command("disable <plugin>").description("Disable an enabled plugin").option("--cwd <cwd>", "The current working directory", String, cwd()).option(
    "-s, --scope <scope>",
    `Installation scope: ${PLUGIN_SCOPES.join(", ")} (default: user)`,
    "user"
  ).action(async (plugin, options) => {
    try {
      const scope = parsePluginScope(options.scope);
      if (!scope) {
        console.error(
          `Invalid scope: ${String(options.scope)}. Must be one of: ${PLUGIN_SCOPES.join(", ")}`
        );
        process.exit(1);
      }
      const { setCwd: setCwd2 } = await import("./state-YAYMHZAZ.js");
      await setCwd2(options.cwd ?? cwd());
      const { disableSkillPlugin } = await import("./skillMarketplace-NX6XZDT4.js");
      const result = disableSkillPlugin(plugin, { scope });
      console.log(`Disabled ${result.pluginSpec}`);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  pluginCmd.command("validate <path>").description("Validate a plugin or marketplace manifest").option("--cwd <cwd>", "The current working directory", String, cwd()).action(async (path, options) => {
    try {
      const { setCwd: setCwd2 } = await import("./state-YAYMHZAZ.js");
      await setCwd2(options.cwd ?? cwd());
      const { formatValidationResult, validatePluginOrMarketplacePath } = await import("./pluginValidation-LO7TNL4T.js");
      const result = validatePluginOrMarketplacePath(path);
      console.log(
        `Validating ${result.fileType} manifest: ${result.filePath}
`
      );
      console.log(formatValidationResult(result));
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(
        `Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(2);
    }
  });
  const skillsCmd = program.command("skills").description("Manage skills and skill marketplaces");
  const marketplaceCmd = skillsCmd.command("marketplace").description(
    "Manage skill marketplaces (.danya-plugin/marketplace.json; legacy .claude-plugin supported)"
  );
  registerMarketplaceCommands(marketplaceCmd);
  skillsCmd.command("install <plugin>").description("Install a skill plugin pack (<plugin>@<marketplace>)").option("--cwd <cwd>", "The current working directory", String, cwd()).option("--project", "Install into this project (.danya/...)", () => true).option("--force", "Overwrite existing installed files", () => true).action(async (plugin, options) => {
    try {
      const { setCwd: setCwd2 } = await import("./state-YAYMHZAZ.js");
      await setCwd2(options.cwd ?? cwd());
      const { installSkillPlugin } = await import("./skillMarketplace-NX6XZDT4.js");
      const result = installSkillPlugin(plugin, {
        project: options.project === true,
        force: options.force === true
      });
      const skillList = result.installedSkills.length > 0 ? `Skills: ${result.installedSkills.join(", ")}` : "Skills: (none)";
      console.log(`Installed ${plugin}
${skillList}`);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  skillsCmd.command("uninstall <plugin>").description("Uninstall a skill plugin pack (<plugin>@<marketplace>)").option("--cwd <cwd>", "The current working directory", String, cwd()).option("--project", "Uninstall from this project (.danya/...)", () => true).action(async (plugin, options) => {
    try {
      const { setCwd: setCwd2 } = await import("./state-YAYMHZAZ.js");
      await setCwd2(options.cwd ?? cwd());
      const { uninstallSkillPlugin } = await import("./skillMarketplace-NX6XZDT4.js");
      const result = uninstallSkillPlugin(plugin, {
        project: options.project === true
      });
      const skillList = result.removedSkills.length > 0 ? `Skills: ${result.removedSkills.join(", ")}` : "Skills: (none)";
      console.log(`Uninstalled ${plugin}
${skillList}`);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  skillsCmd.command("list-installed").description("List installed skill plugins").action(async () => {
    try {
      const { listInstalledSkillPlugins } = await import("./skillMarketplace-NX6XZDT4.js");
      console.log(JSON.stringify(listInstalledSkillPlugins(), null, 2));
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  const allowedTools = program.command("approved-tools").description("Manage approved tools");
  allowedTools.command("list").description("List all approved tools").action(async () => {
    const result = handleListApprovedTools(getCwd());
    console.log(result);
    process.exit(0);
  });
  allowedTools.command("remove <tool>").description("Remove a tool from the list of approved tools").action(async (tool) => {
    const result = handleRemoveApprovedTool(tool);
    console.log(result.message);
    process.exit(result.success ? 0 : 1);
  });
  const mcp = program.command("mcp").description("Configure and manage MCP servers");
  mcp.command("serve").description(`Start the ${PRODUCT_NAME} MCP server`).action(async () => {
    const providedCwd = program.opts().cwd ?? cwd();
    if (!existsSync(providedCwd)) {
      console.error(`Error: Directory ${providedCwd} does not exist`);
      process.exit(1);
    }
    try {
      await setup(providedCwd, false);
      await startMCPServer(providedCwd);
    } catch (error) {
      console.error("Error: Failed to start MCP server:", error);
      process.exit(1);
    }
  });
  mcp.command("add-sse <name> <url>").description("Add an SSE server").option(
    "-s, --scope <scope>",
    "Configuration scope (local, user, or project)",
    "local"
  ).option(
    "-H, --header <header...>",
    'Set headers (e.g. -H "X-Api-Key: abc123" -H "X-Custom: value")'
  ).action(async (name, url, options) => {
    try {
      const scopeInfo = normalizeMcpScopeForCli(options.scope);
      const headers = parseMcpHeaders(options.header);
      addMcpServer(
        name,
        { type: "sse", url, ...headers ? { headers } : {} },
        scopeInfo.scope
      );
      console.log(
        `Added SSE MCP server ${name} with URL: ${url} to ${scopeInfo.display} config`
      );
      if (headers) {
        console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
      }
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  mcp.command("add-http <name> <url>").description("Add a Streamable HTTP MCP server").option(
    "-s, --scope <scope>",
    "Configuration scope (local, user, or project)",
    "local"
  ).option(
    "-H, --header <header...>",
    'Set headers (e.g. -H "X-Api-Key: abc123" -H "X-Custom: value")'
  ).action(async (name, url, options) => {
    try {
      const scopeInfo = normalizeMcpScopeForCli(options.scope);
      const headers = parseMcpHeaders(options.header);
      addMcpServer(
        name,
        { type: "http", url, ...headers ? { headers } : {} },
        scopeInfo.scope
      );
      console.log(
        `Added HTTP MCP server ${name} with URL: ${url} to ${scopeInfo.display} config`
      );
      if (headers) {
        console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
      }
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  mcp.command("add-ws <name> <url>").description("Add a WebSocket MCP server").option(
    "-s, --scope <scope>",
    "Configuration scope (local, user, or project)",
    "local"
  ).action(async (name, url, options) => {
    try {
      const scopeInfo = normalizeMcpScopeForCli(options.scope);
      addMcpServer(name, { type: "ws", url }, scopeInfo.scope);
      console.log(
        `Added WebSocket MCP server ${name} with URL ${url} to ${scopeInfo.display} config`
      );
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  mcp.command("add [name] [commandOrUrl] [args...]").description("Add a server (run without arguments for interactive wizard)").option(
    "-s, --scope <scope>",
    "Configuration scope (local, user, or project)",
    "local"
  ).option(
    "-t, --transport <transport>",
    "MCP transport (stdio, sse, or http)"
  ).option(
    "-H, --header <header...>",
    'Set headers (e.g. -H "X-Api-Key: abc123" -H "X-Custom: value")'
  ).option(
    "-e, --env <env...>",
    "Set environment variables (e.g. -e KEY=value)"
  ).action(async (name, commandOrUrl, args, options) => {
    try {
      if (!name) {
        console.log("Interactive wizard mode: Enter the server details");
        const { createInterface } = await import("readline");
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout
        });
        const question = (query) => new Promise((resolve) => rl.question(query, resolve));
        const serverName = await question("Server name: ");
        if (!serverName) {
          console.error("Error: Server name is required");
          rl.close();
          process.exit(1);
        }
        const serverType = await question(
          "Server type (stdio, http, sse, ws) [stdio]: "
        );
        const type = serverType && ["stdio", "http", "sse", "ws"].includes(serverType) ? serverType : "stdio";
        const prompt = type === "stdio" ? "Command: " : "URL: ";
        const commandOrUrlValue = await question(prompt);
        if (!commandOrUrlValue) {
          console.error(
            `Error: ${type === "stdio" ? "Command" : "URL"} is required`
          );
          rl.close();
          process.exit(1);
        }
        let serverArgs = [];
        let serverEnv = {};
        if (type === "stdio") {
          const argsStr = await question(
            "Command arguments (space-separated): "
          );
          serverArgs = argsStr ? argsStr.split(" ").filter(Boolean) : [];
          const envStr = await question(
            "Environment variables (format: KEY1=value1,KEY2=value2): "
          );
          if (envStr) {
            const envPairs = envStr.split(",").map((pair) => pair.trim());
            serverEnv = parseEnvVars(envPairs.map((pair) => pair));
          }
        }
        const scopeStr = await question(
          "Configuration scope (local, user, or project) [local]: "
        );
        const scopeInfo = normalizeMcpScopeForCli(scopeStr);
        const serverScope = scopeInfo.scope;
        rl.close();
        if (type === "http") {
          addMcpServer(
            serverName,
            { type: "http", url: commandOrUrlValue },
            serverScope
          );
          console.log(
            `Added HTTP MCP server ${serverName} with URL ${commandOrUrlValue} to ${scopeInfo.display} config`
          );
        } else if (type === "sse") {
          addMcpServer(
            serverName,
            { type: "sse", url: commandOrUrlValue },
            serverScope
          );
          console.log(
            `Added SSE MCP server ${serverName} with URL ${commandOrUrlValue} to ${scopeInfo.display} config`
          );
        } else if (type === "ws") {
          addMcpServer(
            serverName,
            { type: "ws", url: commandOrUrlValue },
            serverScope
          );
          console.log(
            `Added WebSocket MCP server ${serverName} with URL ${commandOrUrlValue} to ${scopeInfo.display} config`
          );
        } else {
          addMcpServer(
            serverName,
            {
              type: "stdio",
              command: commandOrUrlValue,
              args: serverArgs,
              env: serverEnv
            },
            serverScope
          );
          console.log(
            `Added stdio MCP server ${serverName} with command: ${commandOrUrlValue} ${serverArgs.join(" ")} to ${scopeInfo.display} config`
          );
        }
      } else if (name && commandOrUrl) {
        const scopeInfo = normalizeMcpScopeForCli(options.scope);
        const transportInfo = normalizeMcpTransport(options.transport);
        if (transportInfo.transport === "stdio") {
          if (options.header?.length) {
            throw new Error(
              "--header can only be used with --transport http or --transport sse"
            );
          }
          const env = parseEnvVars(options.env);
          if (!transportInfo.explicit && looksLikeMcpUrl(commandOrUrl)) {
            console.warn(
              `Warning: "${commandOrUrl}" looks like a URL. Default transport is stdio, so it will be treated as a command.`
            );
            console.warn(
              `If you meant to add an HTTP MCP server, run: ${PRODUCT_COMMAND} mcp add ${name} ${commandOrUrl} --transport http`
            );
            console.warn(
              `If you meant to add a legacy SSE MCP server, run: ${PRODUCT_COMMAND} mcp add ${name} ${commandOrUrl} --transport sse`
            );
          }
          addMcpServer(
            name,
            { type: "stdio", command: commandOrUrl, args: args || [], env },
            scopeInfo.scope
          );
          console.log(
            `Added stdio MCP server ${name} with command: ${commandOrUrl} ${(args || []).join(" ")} to ${scopeInfo.display} config`
          );
        } else {
          if (options.env?.length) {
            throw new Error("--env is only supported for stdio MCP servers");
          }
          if (args?.length) {
            throw new Error(
              "Unexpected arguments. URL-based MCP servers do not accept command args."
            );
          }
          const headers = parseMcpHeaders(options.header);
          addMcpServer(
            name,
            {
              type: transportInfo.transport,
              url: commandOrUrl,
              ...headers ? { headers } : {}
            },
            scopeInfo.scope
          );
          const kind = transportInfo.transport.toUpperCase();
          console.log(
            `Added ${kind} MCP server ${name} with URL: ${commandOrUrl} to ${scopeInfo.display} config`
          );
          if (headers) {
            console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
          }
        }
      } else {
        console.error(
          "Error: Missing required arguments. Either provide no arguments for interactive mode or specify name and command/URL."
        );
        process.exit(1);
      }
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  mcp.command("remove <name>").description("Remove an MCP server").option(
    "-s, --scope <scope>",
    "Configuration scope (local, user, or project)"
  ).action(async (name, options) => {
    try {
      if (options.scope) {
        const scopeInfo = normalizeMcpScopeForCli(options.scope);
        removeMcpServer(name, scopeInfo.scope);
        console.log(
          `Removed MCP server ${name} from ${scopeInfo.display} config`
        );
        process.exit(0);
      }
      const matches = [];
      const projectConfig = getCurrentProjectConfig();
      if (projectConfig.mcpServers?.[name]) {
        matches.push({
          scope: ensureConfigScope("project"),
          display: "local"
        });
      }
      const globalConfig = getGlobalConfig();
      if (globalConfig.mcpServers?.[name]) {
        matches.push({ scope: ensureConfigScope("global"), display: "user" });
      }
      const projectFileDefinitions = getProjectMcpServerDefinitions();
      if (projectFileDefinitions.servers[name]) {
        const source = projectFileDefinitions.sources[name];
        if (source === ".mcp.json") {
          matches.push({
            scope: ensureConfigScope("mcpjson"),
            display: "project"
          });
        } else {
          matches.push({
            scope: ensureConfigScope("mcprc"),
            display: "mcprc"
          });
        }
      }
      if (matches.length === 0) {
        throw new Error(`No MCP server found with name: ${name}`);
      }
      if (matches.length > 1) {
        console.error(
          `MCP server "${name}" exists in multiple scopes: ${matches.map((m) => m.display).join(", ")}`
        );
        console.error("Please specify which scope to remove from:");
        for (const match2 of matches) {
          console.error(
            `  ${PRODUCT_COMMAND} mcp remove ${name} --scope ${match2.display}`
          );
        }
        process.exit(1);
      }
      const match = matches[0];
      removeMcpServer(name, match.scope);
      console.log(`Removed MCP server ${name} from ${match.display} config`);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  mcp.command("list").description("List configured MCP servers").action(async () => {
    try {
      const servers = listMCPServers();
      if (Object.keys(servers).length === 0) {
        console.log(
          `No MCP servers configured. Use \`${PRODUCT_COMMAND} mcp add\` to add a server.`
        );
        process.exit(0);
      }
      const projectFileServers = getProjectMcpServerDefinitions();
      const clients = await getClients();
      const clientByName = /* @__PURE__ */ new Map();
      for (const client of clients) {
        clientByName.set(client.name, client);
      }
      const names = Object.keys(servers).sort((a, b) => a.localeCompare(b));
      for (const name of names) {
        const server = servers[name];
        const client = clientByName.get(name);
        const status = client?.type === "connected" ? "connected" : client?.type === "failed" ? "failed" : projectFileServers.servers[name] ? (() => {
          const approval = getMcprcServerStatus(name);
          if (approval === "pending") return "pending";
          if (approval === "rejected") return "rejected";
          return "disconnected";
        })() : "disconnected";
        const summary = (() => {
          switch (server.type) {
            case "http":
              return `${server.url} (http)`;
            case "sse":
              return `${server.url} (sse)`;
            case "sse-ide":
              return `${server.url} (sse-ide)`;
            case "ws":
              return `${server.url} (ws)`;
            case "ws-ide":
              return `${server.url} (ws-ide)`;
            case "stdio":
            default:
              return `${server.command} ${(server.args || []).join(" ")} (stdio)`;
          }
        })();
        console.log(`${name}: ${summary} [${status}]`);
      }
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  mcp.command("add-json <name> <json>").description("Add an MCP server with a JSON string").option(
    "-s, --scope <scope>",
    "Configuration scope (project, global, or mcprc)",
    "project"
  ).action(async (name, jsonStr, options) => {
    try {
      const scope = ensureConfigScope(options.scope);
      let serverConfig;
      try {
        serverConfig = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Error: Invalid JSON string");
        process.exit(1);
      }
      if (!serverConfig.type || !["stdio", "sse", "http", "ws", "sse-ide", "ws-ide"].includes(
        serverConfig.type
      )) {
        console.error(
          'Error: Server type must be one of: "stdio", "http", "sse", "ws", "sse-ide", "ws-ide"'
        );
        process.exit(1);
      }
      if (["sse", "http", "ws", "sse-ide", "ws-ide"].includes(
        serverConfig.type
      ) && !serverConfig.url) {
        console.error("Error: URL-based MCP servers must have a URL");
        process.exit(1);
      }
      if (serverConfig.type === "stdio" && !serverConfig.command) {
        console.error("Error: stdio server must have a command");
        process.exit(1);
      }
      if (["sse-ide", "ws-ide"].includes(serverConfig.type) && !serverConfig.ideName) {
        console.error("Error: IDE MCP servers must include ideName");
        process.exit(1);
      }
      addMcpServer(name, serverConfig, scope);
      switch (serverConfig.type) {
        case "http":
          console.log(
            `Added HTTP MCP server ${name} with URL ${serverConfig.url} to ${scope} config`
          );
          break;
        case "sse":
          console.log(
            `Added SSE MCP server ${name} with URL ${serverConfig.url} to ${scope} config`
          );
          break;
        case "sse-ide":
          console.log(
            `Added SSE-IDE MCP server ${name} with URL ${serverConfig.url} to ${scope} config`
          );
          break;
        case "ws":
          console.log(
            `Added WS MCP server ${name} with URL ${serverConfig.url} to ${scope} config`
          );
          break;
        case "ws-ide":
          console.log(
            `Added WS-IDE MCP server ${name} with URL ${serverConfig.url} to ${scope} config`
          );
          break;
        case "stdio":
        default:
          console.log(
            `Added stdio MCP server ${name} with command: ${serverConfig.command} ${(serverConfig.args || []).join(" ")} to ${scope} config`
          );
          break;
      }
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  mcp.command("get <name>").description("Get details about an MCP server").action(async (name) => {
    try {
      const server = getMcpServer(name);
      if (!server) {
        console.error(`No MCP server found with name: ${name}`);
        process.exit(1);
      }
      const projectFileServers = getProjectMcpServerDefinitions();
      const clients = await getClients();
      const client = clients.find((c) => c.name === name);
      const status = client?.type === "connected" ? "connected" : client?.type === "failed" ? "failed" : projectFileServers.servers[name] ? (() => {
        const approval = getMcprcServerStatus(name);
        if (approval === "pending") return "pending";
        if (approval === "rejected") return "rejected";
        return "disconnected";
      })() : "disconnected";
      const scopeDisplay = (() => {
        switch (server.scope) {
          case "project":
            return "local";
          case "global":
            return "user";
          case "mcpjson":
            return "project";
          case "mcprc":
            return "mcprc";
          default:
            return server.scope;
        }
      })();
      console.log(`${name}:`);
      console.log(`  Status: ${status}`);
      console.log(`  Scope: ${scopeDisplay}`);
      const printHeaders = (headers) => {
        if (!headers || Object.keys(headers).length === 0) return;
        console.log("  Headers:");
        for (const [key, value] of Object.entries(headers)) {
          console.log(`    ${key}: ${value}`);
        }
      };
      switch (server.type) {
        case "http":
          console.log(`  Type: http`);
          console.log(`  URL: ${server.url}`);
          printHeaders(server.headers);
          break;
        case "sse":
          console.log(`  Type: sse`);
          console.log(`  URL: ${server.url}`);
          printHeaders(server.headers);
          break;
        case "sse-ide":
          console.log(`  Type: sse-ide`);
          console.log(`  URL: ${server.url}`);
          console.log(`  IDE: ${server.ideName}`);
          printHeaders(server.headers);
          break;
        case "ws":
          console.log(`  Type: ws`);
          console.log(`  URL: ${server.url}`);
          break;
        case "ws-ide":
          console.log(`  Type: ws-ide`);
          console.log(`  URL: ${server.url}`);
          console.log(`  IDE: ${server.ideName}`);
          break;
        case "stdio":
        default:
          console.log(`  Type: stdio`);
          console.log(`  Command: ${server.command}`);
          console.log(`  Args: ${(server.args || []).join(" ")}`);
          if (server.env) {
            console.log("  Environment:");
            for (const [key, value] of Object.entries(server.env)) {
              console.log(`    ${key}=${value}`);
            }
          }
          break;
      }
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });
  mcp.command("add-from-claude-desktop").description(
    "Import MCP servers from a desktop MCP host config (macOS, Windows and WSL)"
  ).option(
    "-s, --scope <scope>",
    "Configuration scope (project, global, or mcprc)",
    "project"
  ).action(async (options) => {
    try {
      const scope = ensureConfigScope(options.scope);
      const platform = process.platform;
      const { existsSync: existsSync2, readFileSync: readFileSync2 } = await import("fs");
      const { join: join3 } = await import("path");
      const { exec } = await import("child_process");
      const isWSL = platform === "linux" && existsSync2("/proc/version") && readFileSync2("/proc/version", "utf-8").toLowerCase().includes("microsoft");
      if (platform !== "darwin" && platform !== "win32" && !isWSL) {
        console.error(
          "Error: This command is only supported on macOS, Windows, and WSL"
        );
        process.exit(1);
      }
      let configPath;
      if (platform === "darwin") {
        configPath = join3(
          process.env.HOME || "~",
          "Library/Application Support/Claude/claude_desktop_config.json"
        );
      } else if (platform === "win32") {
        configPath = join3(
          process.env.APPDATA || "",
          "Claude/claude_desktop_config.json"
        );
      } else if (isWSL) {
        const whoamiCommand = await new Promise((resolve, reject) => {
          exec(
            'powershell.exe -Command "whoami"',
            (err, stdout) => {
              if (err) reject(err);
              else resolve(stdout.trim().split("\\").pop() || "");
            }
          );
        });
        configPath = `/mnt/c/Users/${whoamiCommand}/AppData/Roaming/Claude/claude_desktop_config.json`;
      }
      if (!existsSync2(configPath)) {
        console.error(`Error: Config file not found at ${configPath}`);
        process.exit(1);
      }
      let config2;
      try {
        const configContent = readFileSync2(configPath, "utf-8");
        config2 = JSON.parse(configContent);
      } catch (err) {
        console.error(`Error reading config file: ${err}`);
        process.exit(1);
      }
      const mcpServers = config2.mcpServers || {};
      const serverNames = Object.keys(mcpServers);
      const numServers = serverNames.length;
      if (numServers === 0) {
        console.log("No MCP servers found in the desktop config");
        process.exit(0);
      }
      const serversInfo = serverNames.map((name) => {
        const server = mcpServers[name];
        let description = "";
        switch (server.type) {
          case "http":
            description = `HTTP: ${server.url}`;
            break;
          case "sse":
            description = `SSE: ${server.url}`;
            break;
          case "sse-ide":
            description = `SSE-IDE (${server.ideName}): ${server.url}`;
            break;
          case "ws":
            description = `WS: ${server.url}`;
            break;
          case "ws-ide":
            description = `WS-IDE (${server.ideName}): ${server.url}`;
            break;
          case "stdio":
          default:
            description = `stdio: ${server.command} ${(server.args || []).join(" ")}`;
            break;
        }
        return { name, description, server };
      });
      const ink = await import("ink");
      const reactModule = await import("react");
      const inkjsui = await import("@inkjs/ui");
      const utilsTheme = await import("./theme-RATH22A4.js");
      const { render: render3 } = ink;
      const React11 = reactModule;
      const { MultiSelect: MultiSelect2 } = inkjsui;
      const { Box: Box6, Text: Text7 } = ink;
      const { getTheme: getTheme2 } = utilsTheme;
      await new Promise((resolve) => {
        function ClaudeDesktopImport() {
          const { useState: useState2 } = reactModule;
          const [isFinished, setIsFinished] = useState2(false);
          const [importResults, setImportResults] = useState2(
            []
          );
          const [isImporting, setIsImporting] = useState2(false);
          const theme = getTheme2();
          const importServers = async (selectedServers) => {
            setIsImporting(true);
            const results = [];
            for (const name of selectedServers) {
              try {
                const server = mcpServers[name];
                const existingServer = getMcpServer(name);
                if (existingServer) {
                  continue;
                }
                addMcpServer(name, server, scope);
                results.push({ name, success: true });
              } catch (err) {
                results.push({ name, success: false });
              }
            }
            setImportResults(results);
            setIsImporting(false);
            setIsFinished(true);
            setTimeout(() => {
              resolve();
            }, 1e3);
          };
          const handleConfirm = async (selectedServers) => {
            const existingServers = selectedServers.filter(
              (name) => getMcpServer(name)
            );
            if (existingServers.length > 0) {
              const results = [];
              const newServers = selectedServers.filter(
                (name) => !getMcpServer(name)
              );
              for (const name of newServers) {
                try {
                  const server = mcpServers[name];
                  addMcpServer(name, server, scope);
                  results.push({ name, success: true });
                } catch (err) {
                  results.push({ name, success: false });
                }
              }
              for (const name of existingServers) {
                try {
                  const server = mcpServers[name];
                  addMcpServer(name, server, scope);
                  results.push({ name, success: true });
                } catch (err) {
                  results.push({ name, success: false });
                }
              }
              setImportResults(results);
              setIsImporting(false);
              setIsFinished(true);
              setTimeout(() => {
                resolve();
              }, 1e3);
            } else {
              await importServers(selectedServers);
            }
          };
          return /* @__PURE__ */ React11.createElement(Box6, { flexDirection: "column", padding: 1 }, /* @__PURE__ */ React11.createElement(
            Box6,
            {
              flexDirection: "column",
              borderStyle: "round",
              borderColor: theme.danya,
              padding: 1,
              width: "100%"
            },
            /* @__PURE__ */ React11.createElement(Text7, { bold: true, color: theme.danya }, "Import MCP Servers from Desktop Config"),
            /* @__PURE__ */ React11.createElement(Box6, { marginY: 1 }, /* @__PURE__ */ React11.createElement(Text7, null, "Found ", numServers, " MCP servers in the desktop config.")),
            /* @__PURE__ */ React11.createElement(Text7, null, "Please select the servers you want to import:"),
            /* @__PURE__ */ React11.createElement(Box6, { marginTop: 1 }, /* @__PURE__ */ React11.createElement(
              MultiSelect2,
              {
                options: serverNames.map((name) => ({
                  label: name,
                  value: name
                })),
                defaultValue: serverNames,
                onSubmit: handleConfirm
              }
            ))
          ), /* @__PURE__ */ React11.createElement(Box6, { marginTop: 0, marginLeft: 3 }, /* @__PURE__ */ React11.createElement(Text7, { dimColor: true }, "Space to select \xB7 Enter to confirm \xB7 Esc to cancel")), isFinished && /* @__PURE__ */ React11.createElement(Box6, { marginTop: 1 }, /* @__PURE__ */ React11.createElement(Text7, { color: theme.success }, "Successfully imported", " ", importResults.filter((r) => r.success).length, " MCP server to local config.")));
        }
        const { unmount } = render3(/* @__PURE__ */ React11.createElement(ClaudeDesktopImport, null));
        setTimeout(() => {
          unmount();
          resolve();
        }, 3e4);
      });
      process.exit(0);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });
  const resetMcpChoices = () => {
    const config2 = getCurrentProjectConfig();
    saveCurrentProjectConfig({
      ...config2,
      approvedMcprcServers: [],
      rejectedMcprcServers: []
    });
    console.log(
      "All project-file MCP server approvals/rejections (.mcp.json/.mcprc) have been reset."
    );
    console.log(
      `You will be prompted for approval next time you start ${PRODUCT_NAME}.`
    );
    process.exit(0);
  };
  mcp.command("reset-project-choices").description(
    "Reset approvals for project-file MCP servers (.mcp.json/.mcprc) in this project"
  ).action(() => {
    resetMcpChoices();
  });
  mcp.command("reset-mcprc-choices").description(
    "Reset approvals for project-file MCP servers (.mcp.json/.mcprc) in this project"
  ).action(() => {
    resetMcpChoices();
  });
  program.command("doctor").description(`Check the health of your ${PRODUCT_NAME} installation`).action(async () => {
    await new Promise((resolve) => {
      ;
      (async () => {
        const { render: render3 } = await import("ink");
        render3(/* @__PURE__ */ React10.createElement(Doctor, { onDone: () => resolve(), doctorMode: true }));
      })();
    });
    process.exit(0);
  });
  program.command("update").description("Show manual upgrade commands (no auto-install)").action(async () => {
    console.log(`Current version: ${MACRO.VERSION}`);
    console.log("Checking for updates...");
    const { getLatestVersion, getUpdateCommandSuggestions } = await import("./autoUpdater-KEQOIUBC.js");
    const latestVersion = await getLatestVersion();
    if (!latestVersion) {
      console.error("Failed to check for updates");
      process.exit(1);
    }
    if (latestVersion === MACRO.VERSION) {
      console.log(`${PRODUCT_NAME} is up to date`);
      process.exit(0);
    }
    console.log(`New version available: ${latestVersion}`);
    const cmds = await getUpdateCommandSuggestions();
    console.log("\nRun one of the following commands to update:");
    for (const c of cmds) console.log(`  ${c}`);
    if (process.platform !== "win32") {
      console.log(
        '\nNote: you may need to prefix with "sudo" on macOS/Linux.'
      );
    }
    process.exit(0);
  });
  program.command("log").description("Manage conversation logs.").argument(
    "[number]",
    "A number (0, 1, 2, etc.) to display a specific log",
    parseInt
  ).option("--cwd <cwd>", "The current working directory", String, cwd()).action(async (number, { cwd: cwd2 }) => {
    await setup(cwd2, false);
    const context2 = {};
    (async () => {
      const { render: render3 } = await import("ink");
      const { unmount } = render3(
        /* @__PURE__ */ React10.createElement(LogList, { context: context2, type: "messages", logNumber: number }),
        renderContextWithExitOnCtrlC
      );
      context2.unmount = unmount;
    })();
  });
  program.command("resume").description(
    "Resume a previous conversation. Optionally provide a session ID or session name (legacy: log index or file path)."
  ).argument(
    "[identifier]",
    "A session ID or session name (legacy: log index or file path)"
  ).option("--cwd <cwd>", "The current working directory", String, cwd()).option("-e, --enable-architect", "Enable the Architect tool", () => true).option("-v, --verbose", "Do not truncate message output", () => true).option(
    "--safe",
    "Enable strict permission checking mode (default is permissive)",
    () => true
  ).option(
    "--disable-slash-commands",
    "Disable slash commands (treat /... as plain text)",
    () => true
  ).action(
    async (identifier, { cwd: cwd2, enableArchitect, safe, verbose, disableSlashCommands }) => {
      await setup(cwd2, safe);
      assertMinVersion();
      const [{ getTools }, { getCommands }] = await Promise.all([
        import("./tools-XL3UTAPA.js"),
        import("./commands-2LTR54FC.js")
      ]);
      const [allTools, commands, mcpClients] = await Promise.all([
        getTools(
          enableArchitect ?? getCurrentProjectConfig().enableArchitectTool
        ),
        getCommands(),
        getClients()
      ]);
      const tools = disableSlashCommands === true ? allTools.filter((t) => t.name !== "SlashCommand") : allTools;
      if (identifier !== void 0) {
        const { loadDanyaAgentSessionMessages } = await import("./kodeAgentSessionLoad-L54J2WSU.js");
        const { resolveResumeSessionIdentifier } = await import("./kodeAgentSessionResume-4S4ZW7WI.js");
        const { setDanyaAgentSessionId } = await import("./kodeAgentSessionId-WUT74FSH.js");
        const rawIdentifier = String(identifier).trim();
        const isLegacyNumber = /^-?\\d+$/.test(rawIdentifier);
        const isLegacyPath = !isLegacyNumber && existsSync(rawIdentifier);
        let messages;
        let messageLogName = dateToFilename(/* @__PURE__ */ new Date());
        let initialForkNumber = void 0;
        try {
          if (isLegacyNumber || isLegacyPath) {
            const logs = await loadLogList(CACHE_PATHS.messages());
            if (isLegacyNumber) {
              const number = Math.abs(parseInt(rawIdentifier, 10));
              const log = logs[number];
              if (!log) {
                console.error("No conversation found at index", number);
                process.exit(1);
              }
              messages = await loadMessagesFromLog(log.fullPath, tools);
              messageLogName = log.date;
              initialForkNumber = getNextAvailableLogForkNumber(
                log.date,
                log.forkNumber ?? 1,
                0
              );
            } else {
              messages = await loadMessagesFromLog(rawIdentifier, tools);
              const pathSegments = rawIdentifier.split("/");
              const filename = pathSegments[pathSegments.length - 1] ?? "unknown";
              const { date, forkNumber } = parseLogFilename(filename);
              messageLogName = date;
              initialForkNumber = getNextAvailableLogForkNumber(
                date,
                forkNumber ?? 1,
                0
              );
            }
          } else {
            const resolved = resolveResumeSessionIdentifier({
              cwd: cwd2,
              identifier: rawIdentifier
            });
            if (resolved.kind === "ok") {
              setDanyaAgentSessionId(resolved.sessionId);
              messages = loadDanyaAgentSessionMessages({
                cwd: cwd2,
                sessionId: resolved.sessionId
              });
            } else if (resolved.kind === "different_directory") {
              console.error(
                resolved.otherCwd ? `Error: That session belongs to a different directory: ${resolved.otherCwd}` : `Error: That session belongs to a different directory.`
              );
              process.exit(1);
            } else if (resolved.kind === "ambiguous") {
              console.error(
                `Error: Multiple sessions match "${rawIdentifier}": ${resolved.matchingSessionIds.join(
                  ", "
                )}`
              );
              process.exit(1);
            } else {
              console.error(
                `No conversation found with session ID or name: ${rawIdentifier}`
              );
              process.exit(1);
            }
          }
          const isDefaultModel = await isDefaultSlowAndCapableModel();
          {
            const { render: render3 } = await import("ink");
            const { REPL } = await import("./REPL-4R6ZWV74.js");
            render3(
              /* @__PURE__ */ React10.createElement(
                REPL,
                {
                  initialPrompt: "",
                  messageLogName,
                  initialForkNumber,
                  shouldShowPromptInput: true,
                  verbose,
                  commands,
                  disableSlashCommands: disableSlashCommands === true,
                  tools,
                  safeMode: safe,
                  initialMessages: messages,
                  mcpClients,
                  isDefaultModel
                }
              ),
              { exitOnCtrlC: false }
            );
          }
        } catch (error) {
          logError(`Failed to load conversation: ${error}`);
          process.exit(1);
        }
      } else {
        const { listDanyaAgentSessions } = await import("./kodeAgentSessionResume-4S4ZW7WI.js");
        const sessions = listDanyaAgentSessions({ cwd: cwd2 });
        if (sessions.length === 0) {
          console.error("No conversation found to resume");
          process.exit(1);
        }
        const context2 = {};
        (async () => {
          const { render: render3 } = await import("ink");
          const { unmount } = render3(
            /* @__PURE__ */ React10.createElement(
              ResumeConversation,
              {
                cwd: cwd2,
                context: context2,
                commands,
                sessions,
                tools,
                verbose,
                safeMode: safe,
                disableSlashCommands: disableSlashCommands === true,
                mcpClients,
                initialPrompt: ""
              }
            ),
            renderContextWithExitOnCtrlC
          );
          context2.unmount = unmount;
        })();
      }
    }
  );
  program.command("error").description(
    "View error logs. Optionally provide a number (0, -1, -2, etc.) to display a specific log."
  ).argument(
    "[number]",
    "A number (0, 1, 2, etc.) to display a specific log",
    parseInt
  ).option("--cwd <cwd>", "The current working directory", String, cwd()).action(async (number, { cwd: cwd2 }) => {
    await setup(cwd2, false);
    const context2 = {};
    (async () => {
      const { render: render3 } = await import("ink");
      const { unmount } = render3(
        /* @__PURE__ */ React10.createElement(LogList, { context: context2, type: "errors", logNumber: number }),
        renderContextWithExitOnCtrlC
      );
      context2.unmount = unmount;
    })();
  });
  const context = program.command("context").description(
    `Set static context (eg. ${PRODUCT_COMMAND} context add-file ./src/*.py)`
  );
  context.command("get <key>").option("--cwd <cwd>", "The current working directory", String, cwd()).description("Get a value from context").action(async (key, { cwd: cwd2 }) => {
    await setup(cwd2, false);
    const context2 = omitKeys(
      await getContext(),
      "codeStyle",
      "directoryStructure"
    );
    console.log(context2[key]);
    process.exit(0);
  });
  context.command("set <key> <value>").description("Set a value in context").option("--cwd <cwd>", "The current working directory", String, cwd()).action(async (key, value, { cwd: cwd2 }) => {
    await setup(cwd2, false);
    setContext(key, value);
    console.log(`Set context.${key} to "${value}"`);
    process.exit(0);
  });
  context.command("list").description("List all context values").option("--cwd <cwd>", "The current working directory", String, cwd()).action(async ({ cwd: cwd2 }) => {
    await setup(cwd2, false);
    const context2 = omitKeys(
      await getContext(),
      "codeStyle",
      "directoryStructure",
      "gitStatus"
    );
    console.log(JSON.stringify(context2, null, 2));
    process.exit(0);
  });
  context.command("remove <key>").description("Remove a value from context").option("--cwd <cwd>", "The current working directory", String, cwd()).action(async (key, { cwd: cwd2 }) => {
    await setup(cwd2, false);
    removeContext(key);
    console.log(`Removed context.${key}`);
    process.exit(0);
  });
  function runScript(scriptPath, args, env) {
    const { execFileSync } = __require("child_process");
    const { existsSync: existsSync2 } = __require("fs");
    if (!existsSync2(scriptPath)) {
      console.error(`Script not found: ${scriptPath}
Run "danya init" first to initialize the harness.`);
      process.exit(1);
    }
    const mergedEnv = env ? { ...process.env, ...env } : process.env;
    execFileSync("bash", [scriptPath, ...args], { stdio: "inherit", env: mergedEnv, cwd: cwd() });
  }
  function runPython(scriptPath, args) {
    const { execFileSync } = __require("child_process");
    const { existsSync: existsSync2 } = __require("fs");
    if (!existsSync2(scriptPath)) {
      console.error(`Script not found: ${scriptPath}
Run "danya init" first to initialize the harness.`);
      process.exit(1);
    }
    execFileSync("python3", [scriptPath, ...args], { stdio: "inherit", cwd: cwd() });
  }
  program.command("auto-work <requirement>").description("Shell-enforced full-auto pipeline (each stage = independent danya -p)").option("--model <model>", "Model to use", "sonnet").option("--max-turns <n>", "Max turns per stage", "30").action(async (requirement, opts) => {
    try {
      runScript(join(cwd(), ".danya", "scripts", "auto-work-loop.sh"), [requirement], { MODEL: opts.model, MAX_TURNS: opts.maxTurns });
    } catch (e) {
      process.exit(e.status || 1);
    }
  });
  program.command("parallel <tasks-dir>").description("Wave-based parallel execution (each task in independent worktree)").action(async (tasksDir) => {
    try {
      runScript(join(cwd(), ".danya", "scripts", "parallel-wave.sh"), [tasksDir]);
    } catch (e) {
      process.exit(e.status || 1);
    }
  });
  program.command("red-blue [scope]").description("Adversarial red-blue testing loop").option("-n, --rounds <n>", "Max rounds", "5").option("--model <model>", "Model to use", "sonnet").action(async (scope, opts) => {
    try {
      runScript(join(cwd(), ".danya", "scripts", "red-blue-loop.sh"), [scope || "."], { MODEL: opts.model, MAX_ROUNDS: opts.rounds });
    } catch (e) {
      process.exit(e.status || 1);
    }
  });
  program.command("orchestrate <task-file>").description("Auto-research iteration loop (AI codes \u2192 verify \u2192 commit/revert)").option("-n, --iterations <n>", "Max iterations", "20").option("--model <model>", "Model to use", "sonnet").action(async (taskFile, opts) => {
    try {
      runScript(join(cwd(), ".danya", "scripts", "orchestrator.sh"), [taskFile], { MODEL: opts.model, MAX_ITERATIONS: opts.iterations });
    } catch (e) {
      process.exit(e.status || 1);
    }
  });
  program.command("check-env").description("Validate environment dependencies for Danya tools").action(async () => {
    try {
      runScript(join(cwd(), ".danya", "scripts", "check-env.sh"), []);
    } catch {
    }
  });
  program.command("analyze").description("Analyze harness effectiveness metrics").requiredOption("--metric <metric>", "Metric: tool-usage|top-tools|session-count|verify-time|bugfix-rounds|review-scores|summary|compare").option("--days <n>", "Last N days").option("--top <n>", "Top N (for top-tools)", "10").action(async (opts) => {
    const args = ["--metric", opts.metric];
    if (opts.days) args.push("--days", opts.days);
    if (opts.top) args.push("--top", opts.top);
    try {
      runPython(join(cwd(), ".danya", "monitor", "analyze.py"), args);
    } catch (e) {
      process.exit(e.status || 1);
    }
  });
  program.command("dashboard").description("Real-time monitoring dashboard").option("-w, --watch [interval]", "Watch mode (refresh every N seconds)").option("-v, --verbose", "Show detailed info").action(async (opts) => {
    const args = [];
    if (opts.watch !== void 0) {
      args.push("-w");
      if (typeof opts.watch === "string") args.push(opts.watch);
    }
    if (opts.verbose) args.push("-v");
    try {
      runPython(join(cwd(), ".danya", "monitor", "dashboard.py"), args);
    } catch {
    }
  });
  program.command("report").description("Monthly orchestrator report").action(async () => {
    try {
      runScript(join(cwd(), ".danya", "scripts", "monthly-report.sh"), []);
    } catch {
    }
  });
  await program.parseAsync(process.argv);
  return program;
}
async function stdin() {
  if (process.stdin.isTTY) {
    return "";
  }
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}
var isGracefulExitInProgress = false;
async function gracefulExit(code = 0) {
  if (isGracefulExitInProgress) {
    process.exit(code);
    return;
  }
  isGracefulExitInProgress = true;
  try {
    const { runSessionEndHooks } = await import("./kodeHooks-HWSEGZ5X.js");
    const { getDanyaAgentSessionId } = await import("./kodeAgentSessionId-WUT74FSH.js");
    const { tmpdir } = await import("os");
    const { join: join3 } = await import("path");
    const sessionId = getDanyaAgentSessionId();
    const transcriptPath = join3(
      tmpdir(),
      "danya-hooks-transcripts",
      `${sessionId}.transcript.txt`
    );
    const { signal, cleanup } = (() => {
      if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        return {
          signal: AbortSignal.timeout(5e3),
          cleanup: () => {
          }
        };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5e3);
      return { signal: controller.signal, cleanup: () => clearTimeout(timer) };
    })();
    try {
      await runSessionEndHooks({
        reason: "exit",
        cwd: cwd(),
        transcriptPath,
        signal
      });
    } finally {
      cleanup();
    }
  } catch {
  }
  try {
    resetCursor();
  } catch {
  }
  try {
    BunShell.getInstance().close();
  } catch {
  }
  process.exit(code);
}
var didInstallProcessHandlers = false;
function installProcessHandlers() {
  if (didInstallProcessHandlers) return;
  didInstallProcessHandlers = true;
  process.on("exit", () => {
    resetCursor();
    BunShell.getInstance().close();
  });
  process.on("SIGINT", () => void gracefulExit(0));
  process.on("SIGTERM", () => void gracefulExit(0));
  process.on("SIGBREAK", () => void gracefulExit(0));
  process.on("unhandledRejection", (err) => {
    console.error("Unhandled rejection:", err);
    void gracefulExit(1);
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    void gracefulExit(1);
  });
}
function resetCursor() {
  const terminal = process.stderr.isTTY ? process.stderr : process.stdout.isTTY ? process.stdout : void 0;
  terminal?.write(`\x1B[?25h${cursorShow}`);
}

// src/entrypoints/cli.tsx
import * as dontcare from "@anthropic-ai/sdk/shims/node";
initSentry();
ensurePackagedRuntimeEnv();
ensureYogaWasmPath(import.meta.url);
Object.keys(dontcare);
installProcessHandlers();
void runCli();
