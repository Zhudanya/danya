import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  ConfigParseError
} from "./chunk-HIIHGKXP.js";
import {
  debug
} from "./chunk-CZ5UJ3RL.js";
import {
  getCwd,
  getGlobalConfigFilePath,
  init_env,
  init_log,
  init_state,
  logError
} from "./chunk-BAYPSZHG.js";

// src/core/config/schema.ts
function isAutoUpdaterStatus(value) {
  return ["disabled", "enabled", "no_permissions", "not_configured"].includes(
    value
  );
}
var GLOBAL_CONFIG_KEYS = [
  "autoUpdaterStatus",
  "theme",
  "hasCompletedOnboarding",
  "lastOnboardingVersion",
  "lastReleaseNotesSeen",
  "verbose",
  "customApiKeyResponses",
  "primaryProvider",
  "preferredNotifChannel",
  "maxTokens",
  "autoCompactThreshold"
];
function isGlobalConfigKey(key) {
  return GLOBAL_CONFIG_KEYS.includes(key);
}
var PROJECT_CONFIG_KEYS = [
  "dontCrawlDirectory",
  "enableArchitectTool",
  "hasTrustDialogAccepted",
  "hasCompletedProjectOnboarding"
];
function isProjectConfigKey(key) {
  return PROJECT_CONFIG_KEYS.includes(key);
}

// src/core/config/defaults.ts
import { homedir } from "os";
var DEFAULT_PROJECT_CONFIG = {
  allowedTools: [],
  deniedTools: [],
  askedTools: [],
  context: {},
  history: [],
  dontCrawlDirectory: false,
  enableArchitectTool: false,
  mcpContextUris: [],
  mcpServers: {},
  approvedMcprcServers: [],
  rejectedMcprcServers: [],
  hasTrustDialogAccepted: false
};
function defaultConfigForProject(projectPath) {
  const config = { ...DEFAULT_PROJECT_CONFIG };
  if (projectPath === homedir()) {
    config.dontCrawlDirectory = true;
  }
  return config;
}
var DEFAULT_GLOBAL_CONFIG = {
  numStartups: 0,
  autoUpdaterStatus: "not_configured",
  theme: "dark",
  preferredNotifChannel: "iterm2",
  verbose: false,
  primaryProvider: "anthropic",
  customApiKeyResponses: {
    approved: [],
    rejected: []
  },
  stream: true,
  modelProfiles: [],
  modelPointers: {
    main: "",
    task: "",
    compact: "",
    quick: ""
  },
  lastDismissedUpdateVersion: void 0
};

// src/core/config/loader.ts
init_env();
init_state();
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, posix, resolve, win32 } from "path";
import { cloneDeep, memoize, pick } from "lodash-es";
import { homedir as homedir2 } from "os";
import { randomBytes } from "crypto";

// src/utils/text/json.ts
init_log();
function safeParseJSON(json) {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json);
  } catch (e) {
    logError(e);
    return null;
  }
}

// src/core/config/migrations.ts
function migrateModelProfilesRemoveId(config) {
  if (!config.modelProfiles) return config;
  const idToModelNameMap = /* @__PURE__ */ new Map();
  const migratedProfiles = config.modelProfiles.map((profile) => {
    if (profile.id && profile.modelName) {
      idToModelNameMap.set(profile.id, profile.modelName);
    }
    const { id, ...profileWithoutId } = profile;
    return profileWithoutId;
  });
  const migratedPointers = {
    main: "",
    task: "",
    compact: "",
    quick: ""
  };
  const rawPointers = config.modelPointers;
  const rawMain = typeof rawPointers?.main === "string" ? rawPointers.main : "";
  const rawTask = typeof rawPointers?.task === "string" ? rawPointers.task : "";
  const rawQuick = typeof rawPointers?.quick === "string" ? rawPointers.quick : "";
  const rawCompact = typeof rawPointers?.compact === "string" ? rawPointers.compact : typeof rawPointers?.reasoning === "string" ? rawPointers.reasoning : "";
  if (rawMain) migratedPointers.main = idToModelNameMap.get(rawMain) || rawMain;
  if (rawTask) migratedPointers.task = idToModelNameMap.get(rawTask) || rawTask;
  if (rawCompact)
    migratedPointers.compact = idToModelNameMap.get(rawCompact) || rawCompact;
  if (rawQuick)
    migratedPointers.quick = idToModelNameMap.get(rawQuick) || rawQuick;
  let defaultModelName;
  if (config.defaultModelId) {
    defaultModelName = idToModelNameMap.get(config.defaultModelId) || config.defaultModelId;
  } else if (config.defaultModelName) {
    defaultModelName = config.defaultModelName;
  }
  const migratedConfig = { ...config };
  delete migratedConfig.defaultModelId;
  delete migratedConfig.currentSelectedModelId;
  delete migratedConfig.mainAgentModelId;
  delete migratedConfig.taskToolModelId;
  return {
    ...migratedConfig,
    modelProfiles: migratedProfiles,
    modelPointers: migratedPointers,
    defaultModelName
  };
}

// src/core/config/loader.ts
function expandHomeDirForPlatform(input, homeDirPath, platform) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed === "~") return homeDirPath;
  if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) {
    const rest = trimmed.slice(2);
    return platform === "win32" ? win32.join(homeDirPath, rest) : posix.join(homeDirPath, rest);
  }
  return trimmed;
}
function normalizeProjectPathForComparison(projectPath, baseDir, opts) {
  const platform = opts?.platform ?? process.platform;
  const homeDirPath = opts?.homeDir ?? homedir2();
  const expanded = expandHomeDirForPlatform(projectPath, homeDirPath, platform);
  if (!expanded) return "";
  if (platform === "win32") {
    const resolved2 = win32.isAbsolute(expanded) ? win32.resolve(expanded) : win32.resolve(baseDir, expanded);
    return resolved2.toLowerCase();
  }
  const resolved = posix.isAbsolute(expanded) ? posix.resolve(expanded) : posix.resolve(baseDir, expanded);
  return resolved;
}
function findMatchingProjectKey(projects, absolutePath) {
  if (!projects) return void 0;
  if (projects[absolutePath]) return absolutePath;
  const normalizedTarget = normalizeProjectPathForComparison(
    absolutePath,
    absolutePath
  );
  for (const key of Object.keys(projects)) {
    if (normalizeProjectPathForComparison(key, absolutePath) === normalizedTarget) {
      return key;
    }
  }
  return void 0;
}
function checkHasTrustDialogAccepted() {
  let currentPath = getCwd();
  const config = getConfig(getGlobalConfigFilePath(), DEFAULT_GLOBAL_CONFIG);
  while (true) {
    const projectKey = findMatchingProjectKey(config.projects, currentPath);
    const projectConfig = projectKey ? config.projects?.[projectKey] : void 0;
    if (projectConfig?.hasTrustDialogAccepted) {
      return true;
    }
    const parentPath = resolve(currentPath, "..");
    if (parentPath === currentPath) {
      break;
    }
    currentPath = parentPath;
  }
  return false;
}
var TEST_GLOBAL_CONFIG_FOR_TESTING = {
  ...DEFAULT_GLOBAL_CONFIG,
  autoUpdaterStatus: "disabled"
};
var TEST_PROJECT_CONFIG_FOR_TESTING = {
  ...DEFAULT_PROJECT_CONFIG
};
function saveGlobalConfig(config) {
  if (process.env.NODE_ENV === "test") {
    for (const key in config) {
      TEST_GLOBAL_CONFIG_FOR_TESTING[key] = config[key];
    }
    return;
  }
  saveConfig(
    getGlobalConfigFilePath(),
    {
      ...config,
      projects: getConfig(getGlobalConfigFilePath(), DEFAULT_GLOBAL_CONFIG).projects
    },
    DEFAULT_GLOBAL_CONFIG
  );
}
function getGlobalConfig() {
  if (process.env.NODE_ENV === "test") {
    return TEST_GLOBAL_CONFIG_FOR_TESTING;
  }
  const config = getConfig(getGlobalConfigFilePath(), DEFAULT_GLOBAL_CONFIG);
  return migrateModelProfilesRemoveId(config);
}
function normalizeApiKeyForConfig(apiKey) {
  return apiKey?.slice(-20) ?? "";
}
function getCustomApiKeyStatus(truncatedApiKey) {
  const config = getGlobalConfig();
  if (config.customApiKeyResponses?.approved?.includes(truncatedApiKey)) {
    return "approved";
  }
  if (config.customApiKeyResponses?.rejected?.includes(truncatedApiKey)) {
    return "rejected";
  }
  return "new";
}
function saveConfig(file, config, defaultConfig) {
  const filteredConfig = Object.fromEntries(
    Object.entries(config).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(defaultConfig[key])
    )
  );
  try {
    writeFileSync(file, JSON.stringify(filteredConfig, null, 2), "utf-8");
  } catch (error) {
    const err = error;
    if (err?.code === "EACCES" || err?.code === "EPERM" || err?.code === "EROFS") {
      debug.state("CONFIG_SAVE_SKIPPED", {
        file,
        reason: String(err.code)
      });
      return;
    }
    throw error;
  }
}
var configReadingAllowed = false;
function enableConfigs() {
  configReadingAllowed = true;
  getConfig(
    getGlobalConfigFilePath(),
    DEFAULT_GLOBAL_CONFIG,
    true
  );
}
function getConfig(file, defaultConfig, throwOnInvalid) {
  void configReadingAllowed;
  debug.state("CONFIG_LOAD_START", {
    file,
    fileExists: String(existsSync(file)),
    throwOnInvalid: String(!!throwOnInvalid)
  });
  if (!existsSync(file)) {
    debug.state("CONFIG_LOAD_DEFAULT", {
      file,
      reason: "file_not_exists",
      defaultConfigKeys: Object.keys(defaultConfig).join(", ")
    });
    return cloneDeep(defaultConfig);
  }
  try {
    const fileContent = readFileSync(file, "utf-8");
    debug.state("CONFIG_FILE_READ", {
      file,
      contentLength: String(fileContent.length),
      contentPreview: fileContent.substring(0, 100) + (fileContent.length > 100 ? "..." : "")
    });
    try {
      const parsedConfig = JSON.parse(fileContent);
      debug.state("CONFIG_JSON_PARSED", {
        file,
        parsedKeys: Object.keys(parsedConfig).join(", ")
      });
      const finalConfig = {
        ...cloneDeep(defaultConfig),
        ...parsedConfig
      };
      debug.state("CONFIG_LOAD_SUCCESS", {
        file,
        finalConfigKeys: Object.keys(finalConfig).join(", ")
      });
      return finalConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debug.error("CONFIG_JSON_PARSE_ERROR", {
        file,
        errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        contentLength: String(fileContent.length)
      });
      throw new ConfigParseError(errorMessage, file, defaultConfig);
    }
  } catch (error) {
    if (error instanceof ConfigParseError && throwOnInvalid) {
      debug.error("CONFIG_PARSE_ERROR_RETHROWN", {
        file,
        throwOnInvalid: String(throwOnInvalid),
        errorMessage: error.message
      });
      throw error;
    }
    debug.warn("CONFIG_FALLBACK_TO_DEFAULT", {
      file,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      action: "using_default_config"
    });
    return cloneDeep(defaultConfig);
  }
}
function getCurrentProjectConfig() {
  if (process.env.NODE_ENV === "test") {
    return TEST_PROJECT_CONFIG_FOR_TESTING;
  }
  const absolutePath = resolve(getCwd());
  const config = getConfig(getGlobalConfigFilePath(), DEFAULT_GLOBAL_CONFIG);
  if (!config.projects) {
    return defaultConfigForProject(absolutePath);
  }
  const projectKey = findMatchingProjectKey(config.projects, absolutePath);
  const projectConfig = projectKey && config.projects[projectKey] ? config.projects[projectKey] : defaultConfigForProject(absolutePath);
  if (typeof projectConfig.allowedTools === "string") {
    projectConfig.allowedTools = safeParseJSON(projectConfig.allowedTools) ?? [];
  }
  if (typeof projectConfig.deniedTools === "string") {
    ;
    projectConfig.deniedTools = safeParseJSON(projectConfig.deniedTools) ?? [];
  }
  if (typeof projectConfig.askedTools === "string") {
    ;
    projectConfig.askedTools = safeParseJSON(projectConfig.askedTools) ?? [];
  }
  return projectConfig;
}
function saveCurrentProjectConfig(projectConfig) {
  if (process.env.NODE_ENV === "test") {
    for (const key in projectConfig) {
      TEST_PROJECT_CONFIG_FOR_TESTING[key] = projectConfig[key];
    }
    return;
  }
  const config = getConfig(getGlobalConfigFilePath(), DEFAULT_GLOBAL_CONFIG);
  const resolvedCwd = resolve(getCwd());
  const existingKey = findMatchingProjectKey(config.projects, resolvedCwd);
  const storageKey = existingKey ?? resolvedCwd;
  saveConfig(
    getGlobalConfigFilePath(),
    {
      ...config,
      projects: {
        ...config.projects,
        [storageKey]: projectConfig
      }
    },
    DEFAULT_GLOBAL_CONFIG
  );
}
async function isAutoUpdaterDisabled() {
  const status = getGlobalConfig().autoUpdaterStatus;
  return status !== "enabled";
}
var TEST_MCPRC_CONFIG_FOR_TESTING = {};
function clearMcprcConfigForTesting() {
  if (process.env.NODE_ENV === "test") {
    Object.keys(TEST_MCPRC_CONFIG_FOR_TESTING).forEach((key) => {
      delete TEST_MCPRC_CONFIG_FOR_TESTING[key];
    });
  }
}
function addMcprcServerForTesting(name, server) {
  if (process.env.NODE_ENV === "test") {
    TEST_MCPRC_CONFIG_FOR_TESTING[name] = server;
  }
}
function removeMcprcServerForTesting(name) {
  if (process.env.NODE_ENV === "test") {
    if (!TEST_MCPRC_CONFIG_FOR_TESTING[name]) {
      throw new Error(`No MCP server found with name: ${name} in .mcprc`);
    }
    delete TEST_MCPRC_CONFIG_FOR_TESTING[name];
  }
}
var getMcprcConfig = memoize(
  () => {
    if (process.env.NODE_ENV === "test") {
      return TEST_MCPRC_CONFIG_FOR_TESTING;
    }
    const mcprcPath = join(getCwd(), ".mcprc");
    if (!existsSync(mcprcPath)) {
      return {};
    }
    try {
      const mcprcContent = readFileSync(mcprcPath, "utf-8");
      const config = safeParseJSON(mcprcContent);
      if (config && typeof config === "object") {
        return config;
      }
    } catch {
    }
    return {};
  },
  () => {
    const cwd = getCwd();
    const mcprcPath = join(cwd, ".mcprc");
    if (existsSync(mcprcPath)) {
      try {
        const stat = readFileSync(mcprcPath, "utf-8");
        return `${cwd}:${stat}`;
      } catch {
        return cwd;
      }
    }
    return cwd;
  }
);
function parseMcpServersFromMcpJson(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value.mcpServers;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw;
}
function parseMcpServersFromMcprc(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const maybeNested = value.mcpServers;
  if (maybeNested && typeof maybeNested === "object" && !Array.isArray(maybeNested)) {
    return maybeNested;
  }
  return value;
}
var getProjectMcpServerDefinitions = memoize(
  () => {
    if (process.env.NODE_ENV === "test") {
      return {
        servers: {},
        sources: {},
        mcpJsonPath: join(getCwd(), ".mcp.json"),
        mcprcPath: join(getCwd(), ".mcprc")
      };
    }
    const cwd = getCwd();
    const mcpJsonPath = join(cwd, ".mcp.json");
    const mcprcPath = join(cwd, ".mcprc");
    let mcpJsonServers = {};
    let mcprcServers = {};
    if (existsSync(mcpJsonPath)) {
      try {
        const content = readFileSync(mcpJsonPath, "utf-8");
        const parsed = safeParseJSON(content);
        mcpJsonServers = parseMcpServersFromMcpJson(parsed);
      } catch {
      }
    }
    if (existsSync(mcprcPath)) {
      try {
        const content = readFileSync(mcprcPath, "utf-8");
        const parsed = safeParseJSON(content);
        mcprcServers = parseMcpServersFromMcprc(parsed);
      } catch {
      }
    }
    const sources = {};
    for (const name of Object.keys(mcpJsonServers)) {
      sources[name] = ".mcp.json";
    }
    for (const name of Object.keys(mcprcServers)) {
      sources[name] = ".mcprc";
    }
    return {
      servers: { ...mcpJsonServers, ...mcprcServers },
      sources,
      mcpJsonPath,
      mcprcPath
    };
  },
  () => {
    const cwd = getCwd();
    const mcpJsonPath = join(cwd, ".mcp.json");
    const mcprcPath = join(cwd, ".mcprc");
    const parts = [cwd];
    if (existsSync(mcpJsonPath)) {
      try {
        parts.push("mcp.json");
        parts.push(readFileSync(mcpJsonPath, "utf-8"));
      } catch {
      }
    }
    if (existsSync(mcprcPath)) {
      try {
        parts.push("mcprc");
        parts.push(readFileSync(mcprcPath, "utf-8"));
      } catch {
      }
    }
    return parts.join(":");
  }
);
function getOrCreateUserID() {
  const config = getGlobalConfig();
  if (config.userID) {
    return config.userID;
  }
  const userID = randomBytes(32).toString("hex");
  saveGlobalConfig({ ...config, userID });
  return userID;
}
function getConfigForCLI(key, global) {
  if (global) {
    if (!isGlobalConfigKey(key)) {
      console.error(
        `Error: '${key}' is not a valid config key. Valid keys are: ${GLOBAL_CONFIG_KEYS.join(", ")}`
      );
      process.exit(1);
    }
    return getGlobalConfig()[key];
  } else {
    if (!isProjectConfigKey(key)) {
      console.error(
        `Error: '${key}' is not a valid config key. Valid keys are: ${PROJECT_CONFIG_KEYS.join(", ")}`
      );
      process.exit(1);
    }
    return getCurrentProjectConfig()[key];
  }
}
function setConfigForCLI(key, value, global) {
  if (global) {
    if (!isGlobalConfigKey(key)) {
      console.error(
        `Error: Cannot set '${key}'. Only these keys can be modified: ${GLOBAL_CONFIG_KEYS.join(", ")}`
      );
      process.exit(1);
    }
    if (key === "autoUpdaterStatus" && !isAutoUpdaterStatus(value)) {
      console.error(
        `Error: Invalid value for autoUpdaterStatus. Must be one of: disabled, enabled, no_permissions, not_configured`
      );
      process.exit(1);
    }
    const currentConfig = getGlobalConfig();
    saveGlobalConfig({
      ...currentConfig,
      [key]: value
    });
  } else {
    if (!isProjectConfigKey(key)) {
      console.error(
        `Error: Cannot set '${key}'. Only these keys can be modified: ${PROJECT_CONFIG_KEYS.join(", ")}. Did you mean --global?`
      );
      process.exit(1);
    }
    const currentConfig = getCurrentProjectConfig();
    saveCurrentProjectConfig({
      ...currentConfig,
      [key]: value
    });
  }
  setTimeout(() => {
    process.exit(0);
  }, 100);
}
function deleteConfigForCLI(key, global) {
  if (global) {
    if (!isGlobalConfigKey(key)) {
      console.error(
        `Error: Cannot delete '${key}'. Only these keys can be modified: ${GLOBAL_CONFIG_KEYS.join(", ")}`
      );
      process.exit(1);
    }
    const currentConfig = getGlobalConfig();
    delete currentConfig[key];
    saveGlobalConfig(currentConfig);
  } else {
    if (!isProjectConfigKey(key)) {
      console.error(
        `Error: Cannot delete '${key}'. Only these keys can be modified: ${PROJECT_CONFIG_KEYS.join(", ")}. Did you mean --global?`
      );
      process.exit(1);
    }
    const currentConfig = getCurrentProjectConfig();
    delete currentConfig[key];
    saveCurrentProjectConfig(currentConfig);
  }
}
function listConfigForCLI(global) {
  if (global) {
    const currentConfig = pick(getGlobalConfig(), GLOBAL_CONFIG_KEYS);
    return currentConfig;
  } else {
    return pick(getCurrentProjectConfig(), PROJECT_CONFIG_KEYS);
  }
}
function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY;
}
function getAnthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY || "";
}

// src/core/config/validator.ts
function setAllPointersToModel(modelName) {
  const config = getGlobalConfig();
  const updatedConfig = {
    ...config,
    modelPointers: {
      main: modelName,
      task: modelName,
      compact: modelName,
      quick: modelName
    },
    defaultModelName: modelName
  };
  saveGlobalConfig(updatedConfig);
}
function setModelPointer(pointer, modelName) {
  const config = getGlobalConfig();
  const updatedConfig = {
    ...config,
    modelPointers: {
      ...config.modelPointers,
      [pointer]: modelName
    }
  };
  saveGlobalConfig(updatedConfig);
  import("./model-PC6MMS2S.js").then(({ reloadModelManager }) => {
    reloadModelManager();
  });
}
function isGPT5ModelName(modelName) {
  if (!modelName || typeof modelName !== "string") return false;
  const lowerName = modelName.toLowerCase();
  return lowerName.startsWith("gpt-5") || lowerName.includes("gpt-5");
}
function validateAndRepairGPT5Profile(profile) {
  const isGPT5 = isGPT5ModelName(profile.modelName);
  const now = Date.now();
  const repairedProfile = { ...profile };
  let wasRepaired = false;
  if (isGPT5 !== profile.isGPT5) {
    repairedProfile.isGPT5 = isGPT5;
    wasRepaired = true;
  }
  if (isGPT5) {
    const validReasoningEfforts = ["minimal", "low", "medium", "high"];
    if (!profile.reasoningEffort || !validReasoningEfforts.includes(profile.reasoningEffort)) {
      repairedProfile.reasoningEffort = "medium";
      wasRepaired = true;
      debug.state("GPT5_CONFIG_AUTO_REPAIR", {
        model: profile.modelName,
        field: "reasoningEffort",
        value: "medium"
      });
    }
    if (profile.contextLength < 128e3) {
      repairedProfile.contextLength = 128e3;
      wasRepaired = true;
      debug.state("GPT5_CONFIG_AUTO_REPAIR", {
        model: profile.modelName,
        field: "contextLength",
        value: 128e3
      });
    }
    if (profile.maxTokens < 4e3) {
      repairedProfile.maxTokens = 8192;
      wasRepaired = true;
      debug.state("GPT5_CONFIG_AUTO_REPAIR", {
        model: profile.modelName,
        field: "maxTokens",
        value: 8192
      });
    }
    if (profile.provider !== "openai" && profile.provider !== "custom-openai" && profile.provider !== "azure") {
      debug.warn("GPT5_CONFIG_UNEXPECTED_PROVIDER", {
        model: profile.modelName,
        provider: profile.provider,
        expectedProviders: ["openai", "custom-openai", "azure"]
      });
    }
    if (profile.modelName.includes("gpt-5") && !profile.baseURL) {
      repairedProfile.baseURL = "https://api.openai.com/v1";
      wasRepaired = true;
      debug.state("GPT5_CONFIG_AUTO_REPAIR", {
        model: profile.modelName,
        field: "baseURL",
        value: "https://api.openai.com/v1"
      });
    }
  }
  repairedProfile.validationStatus = wasRepaired ? "auto_repaired" : "valid";
  repairedProfile.lastValidation = now;
  if (wasRepaired) {
    debug.info("GPT5_CONFIG_AUTO_REPAIRED", { model: profile.modelName });
  }
  return repairedProfile;
}
function validateAndRepairAllGPT5Profiles() {
  const config = getGlobalConfig();
  if (!config.modelProfiles) {
    return { repaired: 0, total: 0 };
  }
  let repairCount = 0;
  const repairedProfiles = config.modelProfiles.map((profile) => {
    const repairedProfile = validateAndRepairGPT5Profile(profile);
    if (repairedProfile.validationStatus === "auto_repaired") {
      repairCount++;
    }
    return repairedProfile;
  });
  if (repairCount > 0) {
    const updatedConfig = {
      ...config,
      modelProfiles: repairedProfiles
    };
    saveGlobalConfig(updatedConfig);
    debug.info("GPT5_CONFIG_AUTO_REPAIR_SUMMARY", {
      repaired: repairCount,
      total: config.modelProfiles.length
    });
  }
  return { repaired: repairCount, total: config.modelProfiles.length };
}
function getGPT5ConfigRecommendations(modelName) {
  if (!isGPT5ModelName(modelName)) {
    return {};
  }
  const recommendations = {
    contextLength: 128e3,
    maxTokens: 8192,
    reasoningEffort: "medium",
    isGPT5: true
  };
  if (modelName.includes("gpt-5-mini")) {
    recommendations.maxTokens = 4096;
    recommendations.reasoningEffort = "low";
  } else if (modelName.includes("gpt-5-nano")) {
    recommendations.maxTokens = 2048;
    recommendations.reasoningEffort = "minimal";
  }
  return recommendations;
}
function createGPT5ModelProfile(name, modelName, apiKey, baseURL, provider = "openai") {
  const recommendations = getGPT5ConfigRecommendations(modelName);
  const profile = {
    name,
    provider,
    modelName,
    baseURL: baseURL || "https://api.openai.com/v1",
    apiKey,
    maxTokens: recommendations.maxTokens || 8192,
    contextLength: recommendations.contextLength || 128e3,
    reasoningEffort: recommendations.reasoningEffort || "medium",
    isActive: true,
    createdAt: Date.now(),
    isGPT5: true,
    validationStatus: "valid",
    lastValidation: Date.now()
  };
  return profile;
}

export {
  isAutoUpdaterStatus,
  GLOBAL_CONFIG_KEYS,
  isGlobalConfigKey,
  PROJECT_CONFIG_KEYS,
  isProjectConfigKey,
  DEFAULT_GLOBAL_CONFIG,
  safeParseJSON,
  checkHasTrustDialogAccepted,
  saveGlobalConfig,
  getGlobalConfig,
  normalizeApiKeyForConfig,
  getCustomApiKeyStatus,
  enableConfigs,
  getCurrentProjectConfig,
  saveCurrentProjectConfig,
  isAutoUpdaterDisabled,
  TEST_MCPRC_CONFIG_FOR_TESTING,
  clearMcprcConfigForTesting,
  addMcprcServerForTesting,
  removeMcprcServerForTesting,
  getMcprcConfig,
  getProjectMcpServerDefinitions,
  getOrCreateUserID,
  getConfigForCLI,
  setConfigForCLI,
  deleteConfigForCLI,
  listConfigForCLI,
  getOpenAIApiKey,
  getAnthropicApiKey,
  setAllPointersToModel,
  setModelPointer,
  isGPT5ModelName,
  validateAndRepairGPT5Profile,
  validateAndRepairAllGPT5Profiles,
  getGPT5ConfigRecommendations,
  createGPT5ModelProfile
};
