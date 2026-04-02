import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getDanyaAgentSessionId
} from "./chunk-U7Z4MXY4.js";
import {
  PLAN_SLUG_ADJECTIVES,
  PLAN_SLUG_NOUNS,
  PLAN_SLUG_VERBS,
  getCwd,
  getKodeBaseDir,
  init_env,
  init_planSlugWords,
  init_state
} from "./chunk-OPC7BAW5.js";
import {
  MACRO,
  init_macros
} from "./chunk-NYT5K544.js";

// src/utils/protocol/kodeAgentSessionLog.ts
init_macros();
init_state();
import { execFileSync } from "child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "fs";
import { randomBytes } from "crypto";
import { dirname, join } from "path";
init_env();
init_planSlugWords();
function getSessionStoreBaseDir() {
  return getKodeBaseDir();
}
function sanitizeProjectNameForSessionStore(cwd) {
  return cwd.replace(/[^a-zA-Z0-9]/g, "-");
}
function getSessionProjectsDir() {
  return join(getSessionStoreBaseDir(), "projects");
}
function getSessionProjectDir(cwd) {
  return join(getSessionProjectsDir(), sanitizeProjectNameForSessionStore(cwd));
}
function getSessionLogFilePath(args) {
  return join(getSessionProjectDir(args.cwd), `${args.sessionId}.jsonl`);
}
function getAgentLogFilePath(args) {
  return join(getSessionProjectDir(args.cwd), `agent-${args.agentId}.jsonl`);
}
function safeMkdir(dir) {
  if (existsSync(dir)) return;
  mkdirSync(dir, { recursive: true });
}
function safeEnsureFile(path) {
  safeMkdir(dirname(path));
  if (!existsSync(path)) writeFileSync(path, "", "utf8");
}
function safeAppendJsonl(path, record) {
  try {
    safeEnsureFile(path);
    appendFileSync(path, JSON.stringify(record) + "\n", "utf8");
  } catch {
  }
}
var lastUuidByFile = /* @__PURE__ */ new Map();
var snapshotWrittenByFile = /* @__PURE__ */ new Set();
var slugBySessionId = /* @__PURE__ */ new Map();
var currentSessionCustomTitle = null;
var currentSessionTag = null;
function safeReadLastPersistedInfo(filePath) {
  try {
    if (!existsSync(filePath)) return { uuid: null, slug: null };
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    let lastSlug = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]?.trim();
      if (!line) continue;
      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }
      if (!parsed || typeof parsed !== "object") continue;
      if (!lastSlug && typeof parsed.slug === "string" && parsed.slug.trim()) {
        lastSlug = parsed.slug.trim();
      }
      if (typeof parsed.uuid === "string" && parsed.uuid) {
        return { uuid: parsed.uuid, slug: lastSlug };
      }
    }
    return { uuid: null, slug: lastSlug };
  } catch {
    return { uuid: null, slug: null };
  }
}
function pickIndex(length) {
  return randomBytes(4).readUInt32BE(0) % length;
}
function pickWord(words) {
  return words[pickIndex(words.length)];
}
function generateSessionSlug() {
  const adjective = pickWord(PLAN_SLUG_ADJECTIVES);
  const verb = pickWord(PLAN_SLUG_VERBS);
  const noun = pickWord(PLAN_SLUG_NOUNS);
  return `${adjective}-${verb}-${noun}`;
}
function getOrCreateSessionSlug(sessionId) {
  const existing = slugBySessionId.get(sessionId);
  if (existing) return existing;
  const slug = generateSessionSlug();
  slugBySessionId.set(sessionId, slug);
  return slug;
}
var gitBranchCache = null;
function getGitBranchBestEffort(cwd) {
  if (gitBranchCache && gitBranchCache.cwd === cwd) return gitBranchCache.value;
  let value;
  try {
    const stdout = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 750
    });
    const branch = stdout.toString("utf8").trim();
    value = branch || void 0;
  } catch {
    value = void 0;
  }
  gitBranchCache = { cwd, value };
  return value;
}
function ensureFileHistorySnapshot(filePath, firstMessageUuid) {
  if (snapshotWrittenByFile.has(filePath)) return;
  try {
    safeEnsureFile(filePath);
    const size = statSync(filePath).size;
    if (size > 0) {
      snapshotWrittenByFile.add(filePath);
      return;
    }
  } catch {
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  safeAppendJsonl(filePath, {
    type: "file-history-snapshot",
    messageId: firstMessageUuid,
    snapshot: {
      messageId: firstMessageUuid,
      trackedFileBackups: {},
      timestamp: now
    },
    isSnapshotUpdate: false
  });
  snapshotWrittenByFile.add(filePath);
}
function resolvePersistTarget(toolUseContext) {
  const agentId = toolUseContext.agentId;
  if (agentId && agentId !== "main") return { kind: "agent", agentId };
  return { kind: "session", sessionId: getDanyaAgentSessionId() };
}
function appendSessionJsonlFromMessage(args) {
  const { message, toolUseContext } = args;
  if (message.type !== "user" && message.type !== "assistant") return;
  const cwd = getCwd();
  const userType = (process.env.USER_TYPE ?? "external").trim() || "external";
  const sessionId = getDanyaAgentSessionId();
  const agentId = (toolUseContext.agentId ?? "main").trim() || "main";
  const isSidechain = agentId !== "main";
  const gitBranch = getGitBranchBestEffort(cwd);
  const target = resolvePersistTarget(toolUseContext);
  const filePath = target.kind === "agent" ? getAgentLogFilePath({ cwd, agentId: target.agentId }) : getSessionLogFilePath({ cwd, sessionId: target.sessionId });
  if (!lastUuidByFile.has(filePath)) {
    const info = safeReadLastPersistedInfo(filePath);
    lastUuidByFile.set(filePath, info.uuid);
    if (info.slug) slugBySessionId.set(sessionId, info.slug);
  }
  const previousUuid = lastUuidByFile.get(filePath) ?? null;
  const slug = getOrCreateSessionSlug(sessionId);
  if (target.kind === "session") {
    ensureFileHistorySnapshot(filePath, message.uuid);
  }
  const base = {
    parentUuid: previousUuid,
    logicalParentUuid: void 0,
    isSidechain,
    userType,
    cwd,
    sessionId,
    version: MACRO.VERSION,
    ...gitBranch ? { gitBranch } : {},
    agentId,
    slug,
    uuid: message.uuid,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  const record = message.type === "user" ? {
    ...base,
    type: "user",
    message: message.message,
    ...message.toolUseResult?.data !== void 0 ? { toolUseResult: message.toolUseResult.data } : {}
  } : {
    ...base,
    type: "assistant",
    message: message.message,
    ...typeof message.requestId === "string" ? { requestId: String(message.requestId) } : {},
    ...message.isApiErrorMessage ? { isApiErrorMessage: true } : {}
  };
  safeAppendJsonl(filePath, record);
  lastUuidByFile.set(filePath, message.uuid);
}
function appendSessionCustomTitleRecord(args) {
  const cwd = getCwd();
  safeAppendJsonl(getSessionLogFilePath({ cwd, sessionId: args.sessionId }), {
    type: "custom-title",
    sessionId: args.sessionId,
    customTitle: args.customTitle
  });
  if (args.sessionId === getDanyaAgentSessionId()) {
    currentSessionCustomTitle = args.customTitle;
  }
}
function appendSessionTagRecord(args) {
  const cwd = getCwd();
  safeAppendJsonl(getSessionLogFilePath({ cwd, sessionId: args.sessionId }), {
    type: "tag",
    sessionId: args.sessionId,
    tag: args.tag
  });
  if (args.sessionId === getDanyaAgentSessionId()) {
    currentSessionTag = args.tag;
  }
}

export {
  getSessionProjectsDir,
  getSessionProjectDir,
  appendSessionJsonlFromMessage,
  appendSessionCustomTitleRecord,
  appendSessionTagRecord
};
