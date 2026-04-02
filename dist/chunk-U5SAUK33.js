import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSettingsFileCandidates,
  loadSettingsWithLegacyFallback
} from "./chunk-2ZWXQRFX.js";
import {
  getSessionPlugins
} from "./chunk-2VQWLLDU.js";
import {
  getTheme
} from "./chunk-NWCMSPVL.js";
import {
  addMcprcServerForTesting,
  getCurrentProjectConfig,
  getGlobalConfig,
  getProjectMcpServerDefinitions,
  removeMcprcServerForTesting,
  safeParseJSON,
  saveCurrentProjectConfig,
  saveGlobalConfig
} from "./chunk-CEARH7HF.js";
import {
  PRODUCT_COMMAND,
  PRODUCT_NAME,
  getCwd,
  init_log,
  init_product,
  init_state,
  logMCPError
} from "./chunk-OPC7BAW5.js";

// src/services/mcp/client.ts
init_state();
init_log();
init_product();
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "fs";
import { resolve } from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { memoize, pickBy } from "lodash-es";

// src/services/mcp/internal/jsonc.ts
function stripJsonComments(input) {
  let out = "";
  let inString = false;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = i + 1 < input.length ? input[i + 1] : "";
    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        out += ch;
      }
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    out += ch;
  }
  return out;
}
function parseJsonOrJsonc(text) {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(stripJsonComments(raw));
    } catch {
      return null;
    }
  }
}

// src/services/mcp/discovery.ts
init_state();
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
function expandTemplateString(value, pluginRoot) {
  return value.replace(/\$\{([^}]+)\}/g, (match, key) => {
    const k = String(key ?? "").trim();
    if (!k) return match;
    if (k === "CLAUDE_PLUGIN_ROOT") return pluginRoot;
    const env = process.env[k];
    return env !== void 0 ? env : match;
  });
}
function expandTemplateDeep(value, pluginRoot) {
  if (typeof value === "string") return expandTemplateString(value, pluginRoot);
  if (Array.isArray(value))
    return value.map((v) => expandTemplateDeep(v, pluginRoot));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = expandTemplateDeep(v, pluginRoot);
    }
    return out;
  }
  return value;
}
function listPluginMCPServers() {
  const plugins = getSessionPlugins();
  if (plugins.length === 0) return {};
  const out = {};
  for (const plugin of plugins) {
    const pluginRoot = plugin.rootDir;
    const pluginName = plugin.name;
    const configs = [];
    for (const configPath of plugin.mcpConfigFiles ?? []) {
      try {
        const raw = readFileSync(configPath, "utf8");
        const parsed = parseJsonOrJsonc(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
          continue;
        const rawServers = parsed.mcpServers && typeof parsed.mcpServers === "object" && !Array.isArray(parsed.mcpServers) ? parsed.mcpServers : parsed;
        if (!rawServers || typeof rawServers !== "object" || Array.isArray(rawServers))
          continue;
        const servers = {};
        for (const [name, cfg] of Object.entries(rawServers)) {
          if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) continue;
          servers[name] = expandTemplateDeep(cfg, pluginRoot);
        }
        configs.push(servers);
      } catch {
        continue;
      }
    }
    const manifestRaw = plugin.manifest?.mcpServers;
    if (manifestRaw && typeof manifestRaw === "object" && !Array.isArray(manifestRaw)) {
      const rawServers = manifestRaw.mcpServers && typeof manifestRaw.mcpServers === "object" && !Array.isArray(manifestRaw.mcpServers) ? manifestRaw.mcpServers : manifestRaw;
      if (rawServers && typeof rawServers === "object" && !Array.isArray(rawServers)) {
        const servers = {};
        for (const [name, cfg] of Object.entries(rawServers)) {
          if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) continue;
          servers[name] = expandTemplateDeep(cfg, pluginRoot);
        }
        configs.push(servers);
      }
    }
    const merged = Object.assign({}, ...configs);
    for (const [serverName, cfg] of Object.entries(merged)) {
      const fullName = `plugin_${pluginName}_${serverName}`;
      out[fullName] = cfg;
    }
  }
  return out;
}
function parseEnvVars(rawEnvArgs) {
  const parsedEnv = {};
  if (rawEnvArgs) {
    for (const envStr of rawEnvArgs) {
      const [key, ...valueParts] = envStr.split("=");
      if (!key || valueParts.length === 0) {
        throw new Error(
          `Invalid environment variable format: ${envStr}, environment variables should be added as: -e KEY1=value1 -e KEY2=value2`
        );
      }
      parsedEnv[key] = valueParts.join("=");
    }
  }
  return parsedEnv;
}
var VALID_SCOPES = ["project", "global", "mcprc", "mcpjson"];
var EXTERNAL_SCOPES = [
  "project",
  "global",
  "mcprc",
  "mcpjson"
];
function ensureConfigScope(scope) {
  if (!scope) return "project";
  const scopesToCheck = process.env.USER_TYPE === "external" ? EXTERNAL_SCOPES : VALID_SCOPES;
  if (!scopesToCheck.includes(scope)) {
    throw new Error(
      `Invalid scope: ${scope}. Must be one of: ${scopesToCheck.join(", ")}`
    );
  }
  return scope;
}
function addMcpServer(name, server, scope = "project") {
  if (scope === "mcprc") {
    if (process.env.NODE_ENV === "test") {
      addMcprcServerForTesting(name, server);
    } else {
      const mcprcPath = join(getCwd(), ".mcprc");
      let mcprcConfig = {};
      if (existsSync(mcprcPath)) {
        try {
          const mcprcContent = readFileSync(mcprcPath, "utf-8");
          const existingConfig = safeParseJSON(mcprcContent);
          if (existingConfig && typeof existingConfig === "object") {
            mcprcConfig = existingConfig;
          }
        } catch {
        }
      }
      mcprcConfig[name] = server;
      try {
        writeFileSync(mcprcPath, JSON.stringify(mcprcConfig, null, 2), "utf-8");
      } catch (error) {
        throw new Error(`Failed to write to .mcprc: ${error}`);
      }
    }
  } else if (scope === "mcpjson") {
    const mcpJsonPath = join(getCwd(), ".mcp.json");
    let config = { mcpServers: {} };
    if (existsSync(mcpJsonPath)) {
      try {
        const content = readFileSync(mcpJsonPath, "utf-8");
        const parsed = safeParseJSON(content);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          config = parsed;
        }
      } catch {
      }
    }
    const rawServers = config.mcpServers;
    const servers = rawServers && typeof rawServers === "object" && !Array.isArray(rawServers) ? rawServers : {};
    servers[name] = server;
    config.mcpServers = servers;
    try {
      writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2), "utf-8");
    } catch (error) {
      throw new Error(`Failed to write to .mcp.json: ${error}`);
    }
  } else if (scope === "global") {
    const config = getGlobalConfig();
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    config.mcpServers[name] = server;
    saveGlobalConfig(config);
  } else {
    const config = getCurrentProjectConfig();
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    config.mcpServers[name] = server;
    saveCurrentProjectConfig(config);
  }
}
function removeMcpServer(name, scope = "project") {
  if (scope === "mcprc") {
    if (process.env.NODE_ENV === "test") {
      removeMcprcServerForTesting(name);
    } else {
      const mcprcPath = join(getCwd(), ".mcprc");
      if (!existsSync(mcprcPath)) {
        throw new Error("No .mcprc file found in this directory");
      }
      try {
        const mcprcContent = readFileSync(mcprcPath, "utf-8");
        const mcprcConfig = safeParseJSON(mcprcContent);
        if (!mcprcConfig || typeof mcprcConfig !== "object" || !mcprcConfig[name]) {
          throw new Error(`No MCP server found with name: ${name} in .mcprc`);
        }
        delete mcprcConfig[name];
        writeFileSync(mcprcPath, JSON.stringify(mcprcConfig, null, 2), "utf-8");
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`Failed to remove from .mcprc: ${error}`);
      }
    }
  } else if (scope === "mcpjson") {
    const mcpJsonPath = join(getCwd(), ".mcp.json");
    if (!existsSync(mcpJsonPath)) {
      throw new Error("No .mcp.json file found in this directory");
    }
    try {
      const content = readFileSync(mcpJsonPath, "utf-8");
      const parsed = safeParseJSON(content);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid .mcp.json format");
      }
      const rawServers = parsed.mcpServers;
      if (!rawServers || typeof rawServers !== "object" || Array.isArray(rawServers)) {
        throw new Error("Invalid .mcp.json format (missing mcpServers)");
      }
      const servers = rawServers;
      if (!servers[name]) {
        throw new Error(`No MCP server found with name: ${name} in .mcp.json`);
      }
      delete servers[name];
      parsed.mcpServers = servers;
      writeFileSync(mcpJsonPath, JSON.stringify(parsed, null, 2), "utf-8");
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(`Failed to remove from .mcp.json: ${error}`);
    }
  } else if (scope === "global") {
    const config = getGlobalConfig();
    if (!config.mcpServers?.[name]) {
      throw new Error(`No global MCP server found with name: ${name}`);
    }
    delete config.mcpServers[name];
    saveGlobalConfig(config);
  } else {
    const config = getCurrentProjectConfig();
    if (!config.mcpServers?.[name]) {
      throw new Error(`No local MCP server found with name: ${name}`);
    }
    delete config.mcpServers[name];
    saveCurrentProjectConfig(config);
  }
}
function listMCPServers() {
  const pluginServers = listPluginMCPServers();
  const globalConfig = getGlobalConfig();
  const projectFileConfig = getProjectMcpServerDefinitions().servers;
  const projectConfig = getCurrentProjectConfig();
  return {
    ...pluginServers ?? {},
    ...globalConfig.mcpServers ?? {},
    ...projectFileConfig ?? {},
    ...projectConfig.mcpServers ?? {}
  };
}
function getMcpServer(name) {
  const projectConfig = getCurrentProjectConfig();
  const projectFileDefinitions = getProjectMcpServerDefinitions();
  const projectFileConfig = projectFileDefinitions.servers;
  const globalConfig = getGlobalConfig();
  if (projectConfig.mcpServers?.[name]) {
    return { ...projectConfig.mcpServers[name], scope: "project" };
  }
  if (projectFileConfig?.[name]) {
    const source = projectFileDefinitions.sources[name];
    const scope = source === ".mcp.json" ? "mcpjson" : "mcprc";
    return { ...projectFileConfig[name], scope };
  }
  if (globalConfig.mcpServers?.[name]) {
    return { ...globalConfig.mcpServers[name], scope: "global" };
  }
  return void 0;
}
function getMcprcServerStatus(serverName) {
  const config = getCurrentProjectConfig();
  if (config.approvedMcprcServers?.includes(serverName)) {
    return "approved";
  }
  if (config.rejectedMcprcServers?.includes(serverName)) {
    return "rejected";
  }
  return "pending";
}

// src/services/mcp/client.ts
function getMcpServerConnectionBatchSize() {
  const raw = process.env.MCP_SERVER_CONNECTION_BATCH_SIZE;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0 && parsed <= 50) return parsed;
  return 3;
}
async function connectToServer(name, serverRef) {
  const ensureWebSocketGlobal = async () => {
    if (typeof globalThis.WebSocket === "function") return;
    try {
      const undici = await import("undici");
      if (typeof undici.WebSocket === "function") {
        ;
        globalThis.WebSocket = undici.WebSocket;
      }
    } catch {
    }
  };
  const candidates = await (async () => {
    switch (serverRef.type) {
      case "sse": {
        const ref = serverRef;
        return [
          {
            kind: "sse",
            transport: new SSEClientTransport(new URL(ref.url), {
              ...ref.headers ? { requestInit: { headers: ref.headers } } : {}
            })
          },
          {
            kind: "http",
            transport: new StreamableHTTPClientTransport(new URL(ref.url), {
              ...ref.headers ? { requestInit: { headers: ref.headers } } : {}
            })
          }
        ];
      }
      case "sse-ide": {
        const ref = serverRef;
        return [
          {
            kind: "sse",
            transport: new SSEClientTransport(new URL(ref.url), {
              ...ref.headers ? { requestInit: { headers: ref.headers } } : {}
            })
          }
        ];
      }
      case "http": {
        const ref = serverRef;
        return [
          {
            kind: "http",
            transport: new StreamableHTTPClientTransport(new URL(ref.url), {
              ...ref.headers ? { requestInit: { headers: ref.headers } } : {}
            })
          },
          {
            kind: "sse",
            transport: new SSEClientTransport(new URL(ref.url), {
              ...ref.headers ? { requestInit: { headers: ref.headers } } : {}
            })
          }
        ];
      }
      case "ws": {
        const ref = serverRef;
        await ensureWebSocketGlobal();
        return [
          {
            kind: "ws",
            transport: new WebSocketClientTransport(new URL(ref.url))
          }
        ];
      }
      case "ws-ide": {
        const ref = serverRef;
        let url = ref.url;
        if (ref.authToken) {
          try {
            const parsed = new URL(url);
            if (!parsed.searchParams.has("authToken")) {
              parsed.searchParams.set("authToken", ref.authToken);
              url = parsed.toString();
            }
          } catch {
          }
        }
        await ensureWebSocketGlobal();
        return [
          {
            kind: "ws",
            transport: new WebSocketClientTransport(new URL(url))
          }
        ];
      }
      case "stdio":
      default: {
        const ref = serverRef;
        return [
          {
            kind: "stdio",
            transport: new StdioClientTransport({
              command: ref.command,
              args: ref.args,
              env: {
                ...process.env,
                ...ref.env
              },
              stderr: "pipe"
            })
          }
        ];
      }
    }
  })();
  const rawTimeout = process.env.MCP_CONNECTION_TIMEOUT_MS;
  const parsedTimeout = rawTimeout ? Number.parseInt(rawTimeout, 10) : NaN;
  const CONNECTION_TIMEOUT_MS = Number.isFinite(parsedTimeout) ? parsedTimeout : 3e4;
  let lastError;
  for (const candidate of candidates) {
    const client = new Client(
      {
        name: PRODUCT_COMMAND,
        version: "0.1.0"
      },
      {
        capabilities: {}
      }
    );
    try {
      const connectPromise = client.connect(candidate.transport);
      if (CONNECTION_TIMEOUT_MS > 0) {
        const timeoutPromise = new Promise((_, reject) => {
          const timeoutId = setTimeout(() => {
            reject(
              new Error(
                `Connection to MCP server "${name}" timed out after ${CONNECTION_TIMEOUT_MS}ms`
              )
            );
          }, CONNECTION_TIMEOUT_MS);
          connectPromise.then(
            () => clearTimeout(timeoutId),
            () => clearTimeout(timeoutId)
          );
        });
        await Promise.race([connectPromise, timeoutPromise]);
      } else {
        await connectPromise;
      }
      if (candidate.kind === "stdio") {
        ;
        candidate.transport.stderr?.on(
          "data",
          (data) => {
            const errorText = data.toString().trim();
            if (errorText) {
              logMCPError(name, `Server stderr: ${errorText}`);
            }
          }
        );
      }
      if (candidates.length > 1 && candidate !== candidates[0]) {
        logMCPError(
          name,
          `Connected using fallback transport "${candidate.kind}". Consider setting the server type explicitly in your MCP config.`
        );
      }
      return client;
    } catch (error) {
      lastError = error;
      try {
        await client.close();
      } catch {
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to connect to MCP server "${name}"`);
}
var getClients = memoize(async () => {
  if (process.env.CI && process.env.NODE_ENV !== "test") {
    return [];
  }
  const pluginServers = listPluginMCPServers();
  const globalServers = getGlobalConfig().mcpServers ?? {};
  const projectFileServers = getProjectMcpServerDefinitions().servers;
  const projectServers = getCurrentProjectConfig().mcpServers ?? {};
  const approvedProjectFileServers = pickBy(
    projectFileServers,
    (_, name) => getMcprcServerStatus(name) === "approved"
  );
  const allServers = {
    ...pluginServers,
    ...globalServers,
    ...approvedProjectFileServers,
    ...projectServers
  };
  const batchSize = getMcpServerConnectionBatchSize();
  const entries = Object.entries(allServers);
  const results = [];
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async ([name, serverRef]) => {
        try {
          const client = await connectToServer(name, serverRef);
          let capabilities = null;
          try {
            capabilities = client.getServerCapabilities();
          } catch {
            capabilities = null;
          }
          return { name, client, capabilities, type: "connected" };
        } catch (error) {
          logMCPError(
            name,
            `Connection failed: ${error instanceof Error ? error.message : String(error)}`
          );
          return { name, type: "failed" };
        }
      })
    );
    results.push(...batchResults);
  }
  return results;
});
function parseMcpServersFromCliConfigEntries(options) {
  const out = {};
  for (const rawEntry of options.entries) {
    const entry = String(rawEntry ?? "").trim();
    if (!entry) continue;
    const resolvedPath = resolve(options.projectDir, entry);
    const payload = existsSync2(resolvedPath) ? readFileSync2(resolvedPath, "utf8") : existsSync2(entry) ? readFileSync2(entry, "utf8") : entry;
    const parsed = parseJsonOrJsonc(payload);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
    const rawServers = parsed.mcpServers && typeof parsed.mcpServers === "object" && !Array.isArray(parsed.mcpServers) ? parsed.mcpServers : parsed;
    if (!rawServers || typeof rawServers !== "object" || Array.isArray(rawServers))
      continue;
    for (const [name, cfg] of Object.entries(rawServers)) {
      if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) continue;
      out[name] = cfg;
    }
  }
  return out;
}
async function getClientsForCliMcpConfig(options) {
  const projectDir = options.projectDir ?? getCwd();
  const entries = Array.isArray(options.mcpConfig) && options.mcpConfig.length > 0 ? options.mcpConfig : [];
  const strict = options.strictMcpConfig === true;
  if (entries.length === 0 && !strict) {
    return getClients();
  }
  const cliServers = parseMcpServersFromCliConfigEntries({
    entries,
    projectDir
  });
  const pluginServers = strict ? {} : listPluginMCPServers();
  const globalServers = strict ? {} : getGlobalConfig().mcpServers ?? {};
  const projectFileServers = strict ? {} : getProjectMcpServerDefinitions().servers;
  const projectServers = strict ? {} : getCurrentProjectConfig().mcpServers ?? {};
  const approvedProjectFileServers = strict ? {} : pickBy(projectFileServers, (_, name) => getMcprcServerStatus(name) === "approved");
  const allServers = {
    ...pluginServers ?? {},
    ...globalServers ?? {},
    ...approvedProjectFileServers ?? {},
    ...projectServers ?? {},
    ...cliServers ?? {}
  };
  const batchSize = getMcpServerConnectionBatchSize();
  const entriesToConnect = Object.entries(allServers);
  const results = [];
  for (let i = 0; i < entriesToConnect.length; i += batchSize) {
    const batch = entriesToConnect.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async ([name, serverRef]) => {
        try {
          const client = await connectToServer(name, serverRef);
          let capabilities = null;
          try {
            capabilities = client.getServerCapabilities();
          } catch {
            capabilities = null;
          }
          return { name, client, capabilities, type: "connected" };
        } catch (error) {
          logMCPError(
            name,
            `Connection failed: ${error instanceof Error ? error.message : String(error)}`
          );
          return { name, type: "failed" };
        }
      })
    );
    results.push(...batchResults);
  }
  return results;
}

// src/services/mcp/tools-integration.ts
import { zipObject, memoize as memoize2 } from "lodash-es";

// src/tools/mcp/MCPTool/MCPTool.tsx
import { Box as Box2, Text as Text3 } from "ink";
import * as React3 from "react";
import { z } from "zod";

// src/ui/components/FallbackToolUseRejectedMessage.tsx
import * as React from "react";
init_product();
import { Text } from "ink";
function FallbackToolUseRejectedMessage() {
  return /* @__PURE__ */ React.createElement(Text, null, "\xA0\xA0\u23BF \xA0", /* @__PURE__ */ React.createElement(Text, { color: getTheme().error }, "No (tell ", PRODUCT_NAME, " what to do differently)"));
}

// src/tools/mcp/MCPTool/prompt.ts
var PROMPT = "";
var DESCRIPTION = "";

// src/tools/system/BashTool/OutputLine.tsx
import { Box, Text as Text2 } from "ink";
import * as React2 from "react";

// src/utils/sandbox/sandboxConfig.ts
import { homedir } from "os";
function parseToolRuleString(rule) {
  const match = rule.match(/^([^(]+)\(([^)]+)\)$/);
  if (!match) return { toolName: rule };
  const toolName = match[1];
  const ruleContent = match[2];
  if (!toolName || !ruleContent) return { toolName: rule };
  return { toolName, ruleContent };
}
function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}
function uniqueStringsUnion(...lists) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const list of lists) {
    for (const item of list) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      if (seen.has(trimmed)) continue;
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}
function mergeSandboxSettings(base, next) {
  if (!base && !next) return void 0;
  const merged = { ...base ?? {} };
  const mergeBool = (k) => {
    if (next && k in next && next[k] !== void 0) merged[k] = next[k];
  };
  mergeBool("enabled");
  mergeBool("autoAllowBashIfSandboxed");
  mergeBool("allowUnsandboxedCommands");
  mergeBool("ignoreViolations");
  mergeBool("enableWeakerNestedSandbox");
  mergeBool("excludedCommands");
  if (next?.network) {
    merged.network = { ...merged.network ?? {}, ...next.network };
  }
  if (next?.ripgrep) {
    merged.ripgrep = { ...merged.ripgrep ?? {}, ...next.ripgrep };
  }
  return merged;
}
function loadMergedSettings(options) {
  const projectDir = options?.projectDir ?? process.cwd();
  const homeDir = options?.homeDir;
  const user = loadSettingsWithLegacyFallback({
    destination: "userSettings",
    homeDir,
    migrateToPrimary: true
  }).settings;
  const project = loadSettingsWithLegacyFallback({
    destination: "projectSettings",
    projectDir,
    homeDir,
    migrateToPrimary: true
  }).settings;
  const local = loadSettingsWithLegacyFallback({
    destination: "localSettings",
    projectDir,
    homeDir,
    migrateToPrimary: true
  }).settings;
  const allow = uniqueStringsUnion(
    uniqueStrings(user?.permissions?.allow),
    uniqueStrings(project?.permissions?.allow),
    uniqueStrings(local?.permissions?.allow)
  );
  const deny = uniqueStringsUnion(
    uniqueStrings(user?.permissions?.deny),
    uniqueStrings(project?.permissions?.deny),
    uniqueStrings(local?.permissions?.deny)
  );
  const sandbox = mergeSandboxSettings(
    mergeSandboxSettings(user?.sandbox, project?.sandbox),
    local?.sandbox
  );
  return {
    permissions: { allow, deny },
    ...sandbox ? { sandbox } : {}
  };
}
function normalizeSandboxRuntimeConfigFromSettings(settings, options) {
  const projectDir = options?.projectDir ?? process.cwd();
  const homeDir = options?.homeDir ?? homedir();
  const permissions = settings.permissions ?? {};
  const allowRules = uniqueStrings(permissions.allow);
  const denyRules = uniqueStrings(permissions.deny);
  const explicitAllowedDomains = uniqueStrings(
    settings.sandbox?.network?.allowedDomains
  );
  const allowedDomains = [...explicitAllowedDomains];
  const deniedDomains = [];
  for (const rule of allowRules) {
    const parsed = parseToolRuleString(rule);
    if (parsed?.toolName === "WebFetch" && parsed.ruleContent?.startsWith("domain:")) {
      allowedDomains.push(parsed.ruleContent.substring(7));
    }
  }
  for (const rule of denyRules) {
    const parsed = parseToolRuleString(rule);
    if (parsed?.toolName === "WebFetch" && parsed.ruleContent?.startsWith("domain:")) {
      deniedDomains.push(parsed.ruleContent.substring(7));
    }
  }
  const allowWrite = ["."];
  const denyWrite = [];
  const denyRead = [];
  const userCandidates = getSettingsFileCandidates({
    destination: "userSettings",
    homeDir
  });
  const userCandidatesWithEnv = getSettingsFileCandidates({
    destination: "userSettings"
  });
  const projectCandidates = getSettingsFileCandidates({
    destination: "projectSettings",
    projectDir,
    homeDir
  });
  const localCandidates = getSettingsFileCandidates({
    destination: "localSettings",
    projectDir,
    homeDir
  });
  for (const path of [
    userCandidates?.primary,
    ...userCandidates?.legacy ?? [],
    userCandidatesWithEnv?.primary,
    ...userCandidatesWithEnv?.legacy ?? [],
    projectCandidates?.primary,
    ...projectCandidates?.legacy ?? [],
    localCandidates?.primary,
    ...localCandidates?.legacy ?? []
  ]) {
    if (!path) continue;
    if (denyWrite.includes(path)) continue;
    denyWrite.push(path);
  }
  for (const rule of allowRules) {
    const parsed = parseToolRuleString(rule);
    if ((parsed?.toolName === "Write" || parsed?.toolName === "Edit") && parsed.ruleContent) {
      allowWrite.push(parsed.ruleContent);
    }
  }
  for (const rule of denyRules) {
    const parsed = parseToolRuleString(rule);
    if ((parsed?.toolName === "Write" || parsed?.toolName === "Edit") && parsed.ruleContent) {
      denyWrite.push(parsed.ruleContent);
    }
    if (parsed?.toolName === "Read" && parsed.ruleContent) {
      denyRead.push(parsed.ruleContent);
    }
  }
  const sandboxNetwork = settings.sandbox?.network;
  const defaultRipgrep = options?.defaultRipgrep ?? {
    command: "rg",
    args: []
  };
  const ripgrep = typeof settings.sandbox?.ripgrep?.command === "string" ? {
    command: settings.sandbox.ripgrep.command,
    args: Array.isArray(settings.sandbox?.ripgrep?.args) ? settings.sandbox.ripgrep.args.filter(
      (v) => typeof v === "string"
    ) : []
  } : defaultRipgrep;
  return {
    network: {
      allowedDomains: uniqueStringsUnion(allowedDomains),
      deniedDomains: uniqueStringsUnion(deniedDomains),
      allowUnixSockets: Array.isArray(sandboxNetwork?.allowUnixSockets) ? sandboxNetwork.allowUnixSockets.filter(
        (v) => typeof v === "string"
      ) : [],
      allowAllUnixSockets: typeof sandboxNetwork?.allowAllUnixSockets === "boolean" ? sandboxNetwork.allowAllUnixSockets : void 0,
      allowLocalBinding: typeof sandboxNetwork?.allowLocalBinding === "boolean" ? sandboxNetwork.allowLocalBinding : void 0,
      httpProxyPort: typeof sandboxNetwork?.httpProxyPort === "number" ? sandboxNetwork.httpProxyPort : void 0,
      socksProxyPort: typeof sandboxNetwork?.socksProxyPort === "number" ? sandboxNetwork.socksProxyPort : void 0
    },
    filesystem: {
      denyRead: uniqueStringsUnion(denyRead),
      allowWrite: uniqueStringsUnion(allowWrite),
      denyWrite: uniqueStringsUnion(denyWrite)
    },
    ignoreViolations: typeof settings.sandbox?.ignoreViolations === "boolean" ? settings.sandbox.ignoreViolations : void 0,
    enableWeakerNestedSandbox: typeof settings.sandbox?.enableWeakerNestedSandbox === "boolean" ? settings.sandbox.enableWeakerNestedSandbox : void 0,
    excludedCommands: uniqueStrings(settings.sandbox?.excludedCommands),
    ripgrep
  };
}

// src/tools/system/BashTool/prompt.ts
var DEFAULT_TIMEOUT_MS = 12e4;
var MAX_TIMEOUT_MS = 6e5;
var MAX_OUTPUT_LENGTH = 3e4;
var MAX_RENDERED_LINES = 5;
var PROJECT_URL = "https://github.com/shareAI-lab/kode";
var DEFAULT_CO_AUTHOR = "ShareAI Lab";
var TOOL_NAME_BASH = "Bash";
var TOOL_NAME_GLOB = "Glob";
var TOOL_NAME_GREP = "Grep";
var TOOL_NAME_READ = "Read";
var TOOL_NAME_EDIT = "Edit";
var TOOL_NAME_WRITE = "Write";
var TOOL_NAME_TASK = "Task";
function isExperimentalMcpCliEnabled() {
  const value = process.env.ENABLE_EXPERIMENTAL_MCP_CLI;
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}
function indentJsonForPrompt(value) {
  return JSON.stringify(value, null, 2).split("\n").join("\n      ");
}
function getAttribution() {
  const pr = `\u{1F916} Generated with [Danya Agent](${PROJECT_URL})`;
  const commit = `${pr}

   Co-Authored-By: ${DEFAULT_CO_AUTHOR} <ai-lab@foxmail.com>`;
  return { commit, pr };
}
function getBashSandboxPrompt() {
  const settings = loadMergedSettings();
  if (settings.sandbox?.enabled !== true) return "";
  const runtimeConfig = normalizeSandboxRuntimeConfigFromSettings(settings);
  const fsReadConfig = { denyOnly: runtimeConfig.filesystem.denyRead };
  const fsWriteConfig = {
    allowOnly: runtimeConfig.filesystem.allowWrite,
    denyWithinAllow: runtimeConfig.filesystem.denyWrite
  };
  const filesystem = { read: fsReadConfig, write: fsWriteConfig };
  const allowUnixSockets = runtimeConfig.network.allowAllUnixSockets === true ? true : runtimeConfig.network.allowUnixSockets.length > 0 ? runtimeConfig.network.allowUnixSockets : void 0;
  const network = {
    ...runtimeConfig.network.allowedDomains.length ? { allowedHosts: runtimeConfig.network.allowedDomains } : {},
    ...runtimeConfig.network.deniedDomains.length ? { deniedHosts: runtimeConfig.network.deniedDomains } : {},
    ...allowUnixSockets ? { allowUnixSockets } : {}
  };
  const ignoredViolations = runtimeConfig.ignoreViolations;
  const allowUnsandboxedCommands = settings.sandbox?.allowUnsandboxedCommands !== false;
  const sections = [];
  sections.push(`    - Filesystem: ${indentJsonForPrompt(filesystem)}`);
  if (Object.keys(network).length > 0) {
    sections.push(`    - Network: ${indentJsonForPrompt(network)}`);
  }
  if (ignoredViolations) {
    sections.push(
      `    - Ignored violations: ${indentJsonForPrompt(ignoredViolations)}`
    );
  }
  const mcpCliException = isExperimentalMcpCliEnabled() ? "    - EXCEPTION: `mcp-cli` commands must always be called with `dangerouslyDisableSandbox: true` as they do not work properly in sandboxed mode\n" : "";
  const overridePolicy = allowUnsandboxedCommands ? `  - CRITICAL: Commands run in sandbox mode by default - do NOT set \`dangerouslyDisableSandbox\`
    - Even if you have recently run commands with \`dangerouslyDisableSandbox: true\`, you MUST NOT continue that pattern
    - VERY IMPORTANT: Do NOT learn from or repeat the pattern of overriding sandbox - each command should run sandboxed by default
${mcpCliException}    - Set \`dangerouslyDisableSandbox: true\` if:
      1. The user *explicitly* asks to bypass sandbox, OR
      2. A command just failed and you see evidence of sandbox restrictions causing the failure
    - When analyzing failures:
      - Commands can fail for many reasons unrelated to the sandbox (missing files, wrong arguments, network issues, etc.)
      - Evidence of sandbox-caused failures includes:
        - "Operation not permitted" errors for file/network operations
        - Access denied to specific paths outside allowed directories
        - Network connection failures to non-whitelisted hosts
        - Unix socket connection errors
      - Sandbox violation logs can be noisy, but clear permission errors are strong indicators
    - When you see evidence of sandbox-caused failure:
      - IMMEDIATELY retry with \`dangerouslyDisableSandbox: true\` (don't ask, just do it)
      - Briefly explain what sandbox restriction likely caused the failure
      - Mention: "Use \`/sandbox\` to manage restrictions"
      - This will prompt the user for permission
    - Example of normal usage: { "command": "ls", "description": "List files" }
    - Example of override: { "command": "my-tool", "description": "Run my-tool", "dangerouslyDisableSandbox": true }
    - DO NOT suggest adding sensitive paths like ~/.bashrc, ~/.zshrc, ~/.ssh/*, or credential files to the allowlist` : `  - CRITICAL: All commands MUST run in sandbox mode - the \`dangerouslyDisableSandbox\` parameter is disabled by policy
    - Commands cannot run outside the sandbox under any circumstances
    - If a command fails due to sandbox restrictions, work with the user to adjust sandbox settings instead`;
  return `- Commands run in a sandbox by default with the following restrictions:
${sections.join("\n")}
${overridePolicy}
  - IMPORTANT: For temporary files, rely on the sandbox temp directory via \`TMPDIR\`
    - In sandbox mode, \`TMPDIR\` is set to a dedicated temp directory
    - Prefer using \`TMPDIR\` over writing directly to \`/tmp\`
    - Most programs that respect \`TMPDIR\` will automatically use it`;
}
function getBashGitPrompt() {
  const { commit, pr } = getAttribution();
  return `# Committing changes with git

Only create commits when requested by the user. If unclear, ask first. When the user asks you to create a new git commit, follow these steps carefully:

Git Safety Protocol:
- NEVER update the git config
- NEVER run destructive/irreversible git commands (like push --force, hard reset, etc) unless the user explicitly requests them 
- NEVER skip hooks (--no-verify, --no-gpg-sign, etc) unless the user explicitly requests it
- NEVER run force push to main/master, warn the user if they request it
- Avoid git commit --amend.  ONLY use --amend when either (1) user explicitly requested amend OR (2) adding edits from pre-commit hook (additional instructions below) 
- Before amending: ALWAYS check authorship (git log -1 --format='%an %ae')
- NEVER commit changes unless the user explicitly asks you to. It is VERY IMPORTANT to only commit when explicitly asked, otherwise the user will feel that you are being too proactive.

1. You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. run the following bash commands in parallel, each using the ${TOOL_NAME_BASH} tool:
  - Run a git status command to see all untracked files.
  - Run a git diff command to see both staged and unstaged changes that will be committed.
  - Run a git log command to see recent commit messages, so that you can follow this repository's commit message style.
2. Analyze all staged changes (both previously staged and newly added) and draft a commit message:
  - Summarize the nature of the changes (eg. new feature, enhancement to an existing feature, bug fix, refactoring, test, docs, etc.). Ensure the message accurately reflects the changes and their purpose (i.e. "add" means a wholly new feature, "update" means an enhancement to an existing feature, "fix" means a bug fix, etc.).
  - Do not commit files that likely contain secrets (.env, credentials.json, etc). Warn the user if they specifically request to commit those files
  - Draft a concise (1-2 sentences) commit message that focuses on the "why" rather than the "what"
  - Ensure it accurately reflects the changes and their purpose
3. You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. run the following commands:
   - Add relevant untracked files to the staging area.
   - Create the commit with a message${commit ? ` ending with:
   ${commit}` : "."}
   - Run git status after the commit completes to verify success.
   Note: git status depends on the commit completing, so run it sequentially after the commit.
4. If the commit fails due to pre-commit hook changes, retry ONCE. If it succeeds but files were modified by the hook, verify it's safe to amend:
   - Check HEAD commit: git log -1 --format='[%h] (%an <%ae>) %s'. VERIFY it matches your commit
   - Check not pushed: git status shows "Your branch is ahead"
   - If both true: amend your commit. Otherwise: create NEW commit (never amend other developers' commits)

Important notes:
- NEVER run additional commands to read or explore code, besides git bash commands
- NEVER use the ${TOOL_NAME_WRITE} or ${TOOL_NAME_TASK} tools
- DO NOT push to the remote repository unless the user explicitly asks you to do so
- IMPORTANT: Never use git commands with the -i flag (like git rebase -i or git add -i) since they require interactive input which is not supported.
- If there are no changes to commit (i.e., no untracked files and no modifications), do not create an empty commit
- In order to ensure good formatting, ALWAYS pass the commit message via a HEREDOC, a la this example:
<example>
git commit -m "$(cat <<'EOF'
   Commit message here.${commit ? `

   ${commit}` : ""}
   EOF
   )"
</example>

# Creating pull requests
Use the gh command via the Bash tool for ALL GitHub-related tasks including working with issues, pull requests, checks, and releases. If given a Github URL use the gh command to get the information needed.

IMPORTANT: When the user asks you to create a pull request, follow these steps carefully:

1. You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. run the following bash commands in parallel using the ${TOOL_NAME_BASH} tool, in order to understand the current state of the branch since it diverged from the main branch:
   - Run a git status command to see all untracked files
   - Run a git diff command to see both staged and unstaged changes that will be committed
   - Check if the current branch tracks a remote branch and is up to date with the remote, so you know if you need to push to the remote
   - Run a git log command and \`git diff [base-branch]...HEAD\` to understand the full commit history for the current branch (from the time it diverged from the base branch)
2. Analyze all changes that will be included in the pull request, making sure to look at all relevant commits (NOT just the latest commit, but ALL commits that will be included in the pull request!!!), and draft a pull request summary
3. You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. run the following commands in parallel:
   - Create new branch if needed
   - Push to remote with -u flag if needed
   - Create PR using gh pr create with the format below. Use a HEREDOC to pass the body to ensure correct formatting.
<example>
gh pr create --title "the pr title" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points>

## Test plan
[Bulleted markdown checklist of TODOs for testing the pull request...]${pr ? `

${pr}` : ""}
EOF
)"
</example>

Important:
- DO NOT use the ${TOOL_NAME_WRITE} or ${TOOL_NAME_TASK} tools
- Return the PR URL when you're done, so the user can see it

# Other common operations
- View comments on a Github PR: gh api repos/foo/bar/pulls/123/comments`;
}
function getBashToolPrompt() {
  const sandboxPrompt = getBashSandboxPrompt();
  return `Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.

IMPORTANT: This tool is for terminal operations like git, npm, docker, etc. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.

Before executing the command, please follow these steps:

1. Directory Verification:
   - If the command will create new directories or files, first use \`ls\` to verify the parent directory exists and is the correct location
   - For example, before running "mkdir foo/bar", first use \`ls foo\` to check that "foo" exists and is the intended parent directory

2. Command Execution:
   - Always quote file paths that contain spaces with double quotes (e.g., cd "path with spaces/file.txt")
   - Examples of proper quoting:
     - cd "/Users/name/My Documents" (correct)
     - cd /Users/name/My Documents (incorrect - will fail)
     - python "/path/with spaces/script.py" (correct)
     - python /path/with spaces/script.py (incorrect - will fail)
   - After ensuring proper quoting, execute the command.
   - Capture the output of the command.

Usage notes:
  - The command argument is required.
  - You can specify an optional timeout in milliseconds (up to ${MAX_TIMEOUT_MS}ms / ${MAX_TIMEOUT_MS / 6e4} minutes). If not specified, commands will timeout after ${DEFAULT_TIMEOUT_MS}ms (${DEFAULT_TIMEOUT_MS / 6e4} minutes).
  - It is very helpful if you write a clear, concise description of what this command does in 5-10 words.
  - If the output exceeds ${MAX_OUTPUT_LENGTH} characters, output will be truncated before being returned to you.
  - You can use the \`run_in_background\` parameter to run the command in the background, which allows you to continue working while the command runs. You can monitor the output using the ${TOOL_NAME_BASH} tool as it becomes available. You do not need to use '&' at the end of the command when using this parameter.
  ${sandboxPrompt}
  - Avoid using Bash with the \`find\`, \`grep\`, \`cat\`, \`head\`, \`tail\`, \`sed\`, \`awk\`, or \`echo\` commands, unless explicitly instructed or when these commands are truly necessary for the task. Instead, always prefer using the dedicated tools for these commands:
    - File search: Use ${TOOL_NAME_GLOB} (NOT find or ls)
    - Content search: Use ${TOOL_NAME_GREP} (NOT grep or rg)
    - Read files: Use ${TOOL_NAME_READ} (NOT cat/head/tail)
    - Edit files: Use ${TOOL_NAME_EDIT} (NOT sed/awk)
    - Write files: Use ${TOOL_NAME_WRITE} (NOT echo >/cat <<EOF)
    - Communication: Output text directly (NOT echo/printf)
  - When issuing multiple commands:
    - If the commands are independent and can run in parallel, make multiple ${TOOL_NAME_BASH} tool calls in a single message. For example, if you need to run "git status" and "git diff", send a single message with two ${TOOL_NAME_BASH} tool calls in parallel.
    - If the commands depend on each other and must run sequentially, use a single ${TOOL_NAME_BASH} call with '&&' to chain them together (e.g., \`git add . && git commit -m "message" && git push\`). For instance, if one operation must complete before another starts (like mkdir before cp, Write before Bash for git operations, or git add before git commit), run these operations sequentially instead.
    - Use ';' only when you need to run commands sequentially but don't care if earlier commands fail
    - DO NOT use newlines to separate commands (newlines are ok in quoted strings)
  - Try to maintain your current working directory throughout the session by using absolute paths and avoiding usage of \`cd\`. You may use \`cd\` if the User explicitly requests it.
    <good-example>
    pytest /foo/bar/tests
    </good-example>
    <bad-example>
    cd /foo/bar && pytest tests
    </bad-example>

${getBashGitPrompt()}`;
}

// src/tools/system/BashTool/OutputLine.tsx
import chalk from "chalk";
function renderTruncatedContent(content, totalLines) {
  const allLines = content.split("\n");
  if (allLines.length <= MAX_RENDERED_LINES) {
    return allLines.join("\n");
  }
  const lastLines = allLines.slice(-MAX_RENDERED_LINES);
  return [
    chalk.grey(
      `Showing last ${MAX_RENDERED_LINES} lines of ${totalLines} total lines`
    ),
    ...lastLines
  ].join("\n");
}
function OutputLine({
  content,
  lines,
  verbose,
  isError
}) {
  return /* @__PURE__ */ React2.createElement(Box, { justifyContent: "space-between", width: "100%" }, /* @__PURE__ */ React2.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React2.createElement(Text2, null, "\xA0\xA0\u23BF \xA0"), /* @__PURE__ */ React2.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React2.createElement(Text2, { color: isError ? getTheme().error : void 0 }, verbose ? content.trim() : renderTruncatedContent(content.trim(), lines)))));
}

// src/tools/mcp/MCPTool/MCPTool.tsx
var inputSchema = z.object({}).passthrough();
var MCPTool = {
  async isEnabled() {
    return true;
  },
  isReadOnly() {
    return false;
  },
  isConcurrencySafe() {
    return false;
  },
  name: "mcp",
  async description() {
    return DESCRIPTION;
  },
  async prompt() {
    return PROMPT;
  },
  inputSchema,
  async *call() {
    yield {
      type: "result",
      data: "",
      resultForAssistant: ""
    };
  },
  needsPermissions() {
    return true;
  },
  renderToolUseMessage(input) {
    return Object.entries(input).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ");
  },
  userFacingName: () => "mcp",
  renderToolUseRejectedMessage() {
    return /* @__PURE__ */ React3.createElement(FallbackToolUseRejectedMessage, null);
  },
  renderToolResultMessage(output) {
    const verbose = false;
    if (Array.isArray(output)) {
      return /* @__PURE__ */ React3.createElement(Box2, { flexDirection: "column" }, output.map((item, i) => {
        if (item.type === "image") {
          return /* @__PURE__ */ React3.createElement(
            Box2,
            {
              key: i,
              justifyContent: "space-between",
              overflowX: "hidden",
              width: "100%"
            },
            /* @__PURE__ */ React3.createElement(Box2, { flexDirection: "row" }, /* @__PURE__ */ React3.createElement(Text3, null, "\xA0\xA0\u23BF \xA0"), /* @__PURE__ */ React3.createElement(Text3, null, "[Image]"))
          );
        }
        const lines2 = item.text.split("\n").length;
        return /* @__PURE__ */ React3.createElement(
          OutputLine,
          {
            key: i,
            content: item.text,
            lines: lines2,
            verbose
          }
        );
      }));
    }
    if (!output) {
      return /* @__PURE__ */ React3.createElement(Box2, { justifyContent: "space-between", overflowX: "hidden", width: "100%" }, /* @__PURE__ */ React3.createElement(Box2, { flexDirection: "row" }, /* @__PURE__ */ React3.createElement(Text3, null, "\xA0\xA0\u23BF \xA0"), /* @__PURE__ */ React3.createElement(Text3, { color: getTheme().secondaryText }, "(No content)")));
    }
    const lines = output.split("\n").length;
    return /* @__PURE__ */ React3.createElement(OutputLine, { content: output, lines, verbose });
  },
  renderResultForAssistant(content) {
    return content;
  }
};

// src/services/mcp/tools-integration.ts
init_log();
import {
  CallToolResultSchema,
  ListPromptsResultSchema,
  ListToolsResultSchema
} from "@modelcontextprotocol/sdk/types.js";
function sanitizeMcpIdentifierPart(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function getMcpToolTimeoutMs() {
  const raw = process.env.MCP_TOOL_TIMEOUT;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}
function createTimeoutSignal(timeoutMs) {
  const timeoutFn = AbortSignal?.timeout;
  if (typeof timeoutFn === "function") {
    return { signal: timeoutFn(timeoutMs), cleanup: () => {
    } };
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cleanup: () => clearTimeout(id) };
}
function mergeAbortSignals(signals) {
  const active = signals.filter((s) => !!s);
  if (active.length === 0) return null;
  if (active.length === 1) return { signal: active[0], cleanup: () => {
  } };
  const controller = new AbortController();
  const abort = () => {
    try {
      controller.abort();
    } catch {
    }
  };
  for (const s of active) {
    if (s.aborted) {
      abort();
      return { signal: controller.signal, cleanup: () => {
      } };
    }
    s.addEventListener("abort", abort, { once: true });
  }
  return { signal: controller.signal, cleanup: () => {
  } };
}
var IDE_MCP_TOOL_ALLOWLIST = /* @__PURE__ */ new Set([
  "mcp__ide__executeCode",
  "mcp__ide__getDiagnostics"
]);
async function requestAll(req, resultSchema, requiredCapability) {
  const timeoutMs = getMcpToolTimeoutMs();
  const clients = await getClients();
  const results = await Promise.allSettled(
    clients.map(async (client) => {
      if (client.type === "failed") return null;
      let timeoutSignal = null;
      try {
        let capabilities = client.capabilities ?? null;
        if (!capabilities) {
          try {
            capabilities = client.client.getServerCapabilities();
          } catch {
            capabilities = null;
          }
          client.capabilities = capabilities;
        }
        if (!capabilities?.[requiredCapability]) {
          return null;
        }
        timeoutSignal = timeoutMs ? createTimeoutSignal(timeoutMs) : null;
        const merged = mergeAbortSignals([timeoutSignal?.signal]);
        return {
          client,
          result: await client.client.request(
            req,
            resultSchema,
            merged?.signal ? { signal: merged.signal } : void 0
          )
        };
      } catch (error) {
        if (client.type === "connected") {
          logMCPError(
            client.name,
            `Failed to request '${req.method}': ${error instanceof Error ? error.message : String(error)}`
          );
        }
        return null;
      } finally {
        timeoutSignal?.cleanup();
      }
    })
  );
  return results.filter(
    (result) => result.status === "fulfilled"
  ).map((result) => result.value).filter((result) => result !== null);
}
var getMCPTools = memoize2(async () => {
  const toolsList = await requestAll(
    {
      method: "tools/list"
    },
    ListToolsResultSchema,
    "tools"
  );
  return toolsList.flatMap(({ client, result: { tools } }) => {
    const serverPart = sanitizeMcpIdentifierPart(client.name);
    return tools.map((tool) => {
      const toolPart = sanitizeMcpIdentifierPart(tool.name);
      const name = `mcp__${serverPart}__${toolPart}`;
      if (name.startsWith("mcp__ide__") && !IDE_MCP_TOOL_ALLOWLIST.has(name)) {
        return null;
      }
      return {
        ...MCPTool,
        name,
        isConcurrencySafe() {
          return tool.annotations?.readOnlyHint ?? false;
        },
        isReadOnly() {
          return tool.annotations?.readOnlyHint ?? false;
        },
        async description() {
          return tool.description ?? "";
        },
        async prompt() {
          return tool.description ?? "";
        },
        inputJSONSchema: tool.inputSchema,
        async validateInput() {
          return { result: true };
        },
        async *call(args, context) {
          const data = await callMCPTool({
            client,
            tool: tool.name,
            args,
            toolUseId: context.toolUseId,
            signal: context.abortController.signal
          });
          yield {
            type: "result",
            data,
            resultForAssistant: data
          };
        },
        userFacingName() {
          const title = tool.annotations?.title || tool.name;
          return `${client.name} - ${title} (MCP)`;
        }
      };
    }).filter((tool) => tool !== null);
  });
});
async function callMCPTool({
  client: { client, name },
  tool,
  args,
  toolUseId,
  signal
}) {
  const timeoutMs = getMcpToolTimeoutMs();
  const timeoutSignal = timeoutMs ? createTimeoutSignal(timeoutMs) : null;
  const merged = mergeAbortSignals([signal, timeoutSignal?.signal]);
  const meta = toolUseId && toolUseId.trim() ? { "claudecode/toolUseId": toolUseId } : void 0;
  try {
    const result = await client.callTool(
      {
        name: tool,
        arguments: args,
        ...meta ? { _meta: meta } : {}
      },
      CallToolResultSchema,
      merged?.signal ? { signal: merged.signal } : void 0
    );
    if ("isError" in result && result.isError) {
      const contentText = "content" in result && Array.isArray(result.content) ? result.content.find((item) => item.type === "text" && "text" in item) : null;
      const rawMessage = contentText && typeof contentText.text === "string" ? String(contentText.text) : "error" in result && result.error ? String(result.error) : "";
      const message = rawMessage || `Error calling tool ${tool}`;
      logMCPError(name, `Error calling tool ${tool}: ${message}`);
      throw new Error(message);
    }
    if ("toolResult" in result) {
      return String(result.toolResult);
    }
    if ("structuredContent" in result && result.structuredContent !== void 0) {
      return JSON.stringify(result.structuredContent);
    }
    if ("content" in result && Array.isArray(result.content)) {
      return result.content.map((item) => {
        if (item.type === "image") {
          return {
            type: "image",
            source: {
              type: "base64",
              data: String(item.data),
              media_type: item.mimeType
            }
          };
        }
        return item;
      });
    }
    throw Error(`Unexpected response format from tool ${tool}`);
  } finally {
    timeoutSignal?.cleanup();
  }
}
var getMCPCommands = memoize2(async () => {
  const results = await requestAll(
    {
      method: "prompts/list"
    },
    ListPromptsResultSchema,
    "prompts"
  );
  return results.flatMap(
    ({ client, result }) => result.prompts?.map((_) => {
      const serverPart = sanitizeMcpIdentifierPart(client.name);
      const argNames = Object.values(_.arguments ?? {}).map((k) => k.name);
      return {
        type: "prompt",
        name: `mcp__${serverPart}__${_.name}`,
        description: _.description ?? "",
        isEnabled: true,
        isHidden: false,
        progressMessage: "running",
        userFacingName() {
          const title = typeof _.title === "string" ? _.title : _.name;
          return `${client.name}:${title} (MCP)`;
        },
        argNames,
        async getPromptForCommand(args) {
          const argsArray = args.split(" ");
          return await runCommand({ name: _.name, client }, zipObject(argNames, argsArray));
        }
      };
    })
  );
});
async function runCommand({ name, client }, args) {
  try {
    const result = await client.client.getPrompt({ name, arguments: args });
    return result.messages.map((message) => {
      const content = message.content;
      if (content.type === "text") {
        return {
          role: message.role,
          content: [
            {
              type: "text",
              text: content.text
            }
          ]
        };
      }
      if (content.type === "image" && "data" in content) {
        return {
          role: message.role,
          content: [
            {
              type: "image",
              source: {
                data: String(content.data),
                media_type: content.mimeType,
                type: "base64"
              }
            }
          ]
        };
      }
      return {
        role: message.role,
        content: [
          {
            type: "text",
            text: `Unsupported MCP content type ${content?.type ?? "unknown"}`
          }
        ]
      };
    });
  } catch (error) {
    logMCPError(
      client.name,
      `Error running command '${name}': ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

// src/services/mcp/cli-utils.ts
function looksLikeMcpUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(https?|wss?):\/\//i.test(trimmed)) return true;
  if (/^localhost(?::\d+)?(\/|$)/i.test(trimmed)) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(\/|$)/.test(trimmed)) return true;
  return trimmed.endsWith("/sse") || trimmed.endsWith("/mcp");
}
function parseMcpHeaders(raw) {
  if (!raw || raw.length === 0) return void 0;
  const headers = {};
  for (const item of raw) {
    const idx = item.indexOf(":");
    if (idx === -1) {
      throw new Error(
        `Invalid header format: "${item}". Expected format: "Header-Name: value"`
      );
    }
    const key = item.slice(0, idx).trim();
    const value = item.slice(idx + 1).trim();
    if (!key) {
      throw new Error(`Invalid header: "${item}". Header name cannot be empty.`);
    }
    headers[key] = value;
  }
  return headers;
}
function normalizeMcpScopeForCli(scope) {
  const raw = (scope ?? "local").trim() || "local";
  if (raw === "local")
    return { scope: ensureConfigScope("project"), display: "local" };
  if (raw === "user")
    return { scope: ensureConfigScope("global"), display: "user" };
  if (raw === "project")
    return { scope: ensureConfigScope("mcpjson"), display: "project" };
  if (raw === "global")
    return { scope: ensureConfigScope("global"), display: "user" };
  if (raw === "projectConfig" || raw === "project-config") {
    return { scope: ensureConfigScope("project"), display: "local" };
  }
  return { scope: ensureConfigScope(raw), display: raw };
}
function normalizeMcpTransport(transport) {
  if (!transport) return { transport: "stdio", explicit: false };
  const normalized = transport.trim();
  if (normalized === "stdio" || normalized === "sse" || normalized === "http") {
    return { transport: normalized, explicit: true };
  }
  throw new Error(
    `Invalid transport type: ${transport}. Must be one of: stdio, sse, http`
  );
}

export {
  FallbackToolUseRejectedMessage,
  loadMergedSettings,
  normalizeSandboxRuntimeConfigFromSettings,
  DEFAULT_TIMEOUT_MS,
  MAX_OUTPUT_LENGTH,
  getBashToolPrompt,
  OutputLine,
  listPluginMCPServers,
  parseEnvVars,
  ensureConfigScope,
  addMcpServer,
  removeMcpServer,
  listMCPServers,
  getMcpServer,
  getMcprcServerStatus,
  getClients,
  getClientsForCliMcpConfig,
  MCPTool,
  getMCPTools,
  getMCPCommands,
  runCommand,
  looksLikeMcpUrl,
  parseMcpHeaders,
  normalizeMcpScopeForCli,
  normalizeMcpTransport
};
