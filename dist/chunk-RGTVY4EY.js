import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getCurrentProjectConfig,
  getGlobalConfig,
  getOrCreateUserID,
  init_config,
  saveCurrentProjectConfig
} from "./chunk-7RMU3EY3.js";
import {
  SESSION_ID,
  env,
  execFileNoThrow,
  getCwd,
  init_env,
  init_execFileNoThrow,
  init_log,
  init_state,
  logError
} from "./chunk-47Q2VMTW.js";
import {
  MACRO,
  init_macros
} from "./chunk-HLV7FB2P.js";
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/config/projectInstructions.ts
import { existsSync, readFileSync } from "fs";
import { dirname, join, parse, relative, resolve, sep } from "path";
function isRegularFile(path) {
  try {
    return existsSync(path);
  } catch {
    return false;
  }
}
function findGitRoot(startDir) {
  let currentDir = resolve(startDir);
  const fsRoot = parse(currentDir).root;
  while (true) {
    const dotGitPath = join(currentDir, ".git");
    if (existsSync(dotGitPath)) {
      return currentDir;
    }
    if (currentDir === fsRoot) {
      return null;
    }
    currentDir = dirname(currentDir);
  }
}
function getDirsFromGitRootToCwd(gitRoot, cwd) {
  const absoluteGitRoot = resolve(gitRoot);
  const absoluteCwd = resolve(cwd);
  const rel = relative(absoluteGitRoot, absoluteCwd);
  if (!rel || rel === ".") {
    return [absoluteGitRoot];
  }
  const parts = rel.split(sep).filter(Boolean);
  const dirs = [absoluteGitRoot];
  for (let i = 0; i < parts.length; i++) {
    dirs.push(join(absoluteGitRoot, ...parts.slice(0, i + 1)));
  }
  return dirs;
}
function getProjectInstructionFiles(cwd) {
  const gitRoot = findGitRoot(cwd);
  const root = gitRoot ?? resolve(cwd);
  const dirs = getDirsFromGitRootToCwd(root, cwd);
  const results = [];
  for (const dir of dirs) {
    const overridePath = join(dir, "AGENTS.override.md");
    const agentsPath = join(dir, "AGENTS.md");
    if (isRegularFile(overridePath)) {
      results.push({
        absolutePath: overridePath,
        relativePathFromGitRoot: relative(root, overridePath) || "AGENTS.override.md",
        filename: "AGENTS.override.md"
      });
      continue;
    }
    if (isRegularFile(agentsPath)) {
      results.push({
        absolutePath: agentsPath,
        relativePathFromGitRoot: relative(root, agentsPath) || "AGENTS.md",
        filename: "AGENTS.md"
      });
    }
  }
  return results;
}
function getProjectDocMaxBytes() {
  const raw = process.env.DANYA_PROJECT_DOC_MAX_BYTES ?? process.env.KODE_PROJECT_DOC_MAX_BYTES;
  if (!raw) return DEFAULT_PROJECT_DOC_MAX_BYTES;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0)
    return DEFAULT_PROJECT_DOC_MAX_BYTES;
  return parsed;
}
function readAndConcatProjectInstructionFiles(files, {
  maxBytes = getProjectDocMaxBytes(),
  includeHeadings = true
} = {}) {
  let totalBytes = 0;
  let truncated = false;
  const parts = [];
  const truncateUtf8ToBytes = (value, bytes) => {
    const buf = Buffer.from(value, "utf8");
    if (buf.length <= bytes) return value;
    return buf.subarray(0, Math.max(0, bytes)).toString("utf8");
  };
  for (const file of files) {
    if (totalBytes >= maxBytes) {
      truncated = true;
      break;
    }
    let raw;
    try {
      raw = readFileSync(file.absolutePath, "utf-8");
    } catch {
      continue;
    }
    if (!raw.trim()) continue;
    const separator = parts.length > 0 ? "\n\n" : "";
    const separatorBytes = Buffer.byteLength(separator, "utf8");
    const remainingAfterSeparator = maxBytes - totalBytes - separatorBytes;
    if (remainingAfterSeparator <= 0) {
      truncated = true;
      break;
    }
    const heading = includeHeadings ? `# ${file.filename}

_Path: ${file.relativePathFromGitRoot}_

` : "";
    const block = `${heading}${raw}`.trimEnd();
    const blockBytes = Buffer.byteLength(block, "utf8");
    if (blockBytes <= remainingAfterSeparator) {
      parts.push(`${separator}${block}`);
      totalBytes += separatorBytes + blockBytes;
      continue;
    }
    truncated = true;
    const suffix = `

... (truncated: project instruction files exceeded ${maxBytes} bytes)`;
    const suffixBytes = Buffer.byteLength(suffix, "utf8");
    let finalBlock = "";
    if (suffixBytes >= remainingAfterSeparator) {
      finalBlock = truncateUtf8ToBytes(suffix, remainingAfterSeparator);
    } else {
      const prefixBudget = remainingAfterSeparator - suffixBytes;
      const prefix = truncateUtf8ToBytes(block, prefixBudget);
      finalBlock = `${prefix}${suffix}`;
    }
    parts.push(`${separator}${finalBlock}`);
    totalBytes += separatorBytes + Buffer.byteLength(finalBlock, "utf8");
    break;
  }
  return { content: parts.join(""), truncated };
}
var DEFAULT_PROJECT_DOC_MAX_BYTES;
var init_projectInstructions = __esm({
  "src/utils/config/projectInstructions.ts"() {
    DEFAULT_PROJECT_DOC_MAX_BYTES = 32 * 1024;
  }
});

// src/utils/config/style.ts
import { readFileSync as readFileSync2 } from "fs";
import { memoize } from "lodash-es";
var STYLE_PROMPT, getCodeStyle;
var init_style = __esm({
  "src/utils/config/style.ts"() {
    init_state();
    init_projectInstructions();
    STYLE_PROMPT = "The codebase follows strict style guidelines shown below. All code changes must strictly adhere to these guidelines to maintain consistency and quality.";
    getCodeStyle = memoize(() => {
      const styles = [];
      const instructionFiles = getProjectInstructionFiles(getCwd());
      for (const file of instructionFiles) {
        try {
          styles.push(
            `Contents of ${file.absolutePath}:

${readFileSync2(file.absolutePath, "utf-8")}`
          );
        } catch {
        }
      }
      if (styles.length === 0) {
        return "";
      }
      return `${STYLE_PROMPT}

${styles.join("\n\n")}`;
    });
  }
});

// src/utils/system/git.ts
import { memoize as memoize2 } from "lodash-es";
async function getGitState() {
  try {
    const [commitHash, branchName, remoteUrl, isHeadOnRemote, isClean] = await Promise.all([
      getHead(),
      getBranch(),
      getRemoteUrl(),
      getIsHeadOnRemote(),
      getIsClean()
    ]);
    return {
      commitHash,
      branchName,
      remoteUrl,
      isHeadOnRemote,
      isClean
    };
  } catch (_) {
    return null;
  }
}
var getIsGit, getHead, getBranch, getRemoteUrl, getIsHeadOnRemote, getIsClean;
var init_git = __esm({
  "src/utils/system/git.ts"() {
    init_execFileNoThrow();
    getIsGit = memoize2(async () => {
      const { code } = await execFileNoThrow("git", [
        "rev-parse",
        "--is-inside-work-tree"
      ]);
      return code === 0;
    });
    getHead = async () => {
      const { stdout } = await execFileNoThrow("git", ["rev-parse", "HEAD"]);
      return stdout.trim();
    };
    getBranch = async () => {
      const { stdout } = await execFileNoThrow(
        "git",
        ["rev-parse", "--abbrev-ref", "HEAD"],
        void 0,
        void 0,
        false
      );
      return stdout.trim();
    };
    getRemoteUrl = async () => {
      const { stdout, code } = await execFileNoThrow(
        "git",
        ["remote", "get-url", "origin"],
        void 0,
        void 0,
        false
      );
      return code === 0 ? stdout.trim() : null;
    };
    getIsHeadOnRemote = async () => {
      const { code } = await execFileNoThrow(
        "git",
        ["rev-parse", "@{u}"],
        void 0,
        void 0,
        false
      );
      return code === 0;
    };
    getIsClean = async () => {
      const { stdout } = await execFileNoThrow(
        "git",
        ["status", "--porcelain"],
        void 0,
        void 0,
        false
      );
      return stdout.trim().length === 0;
    };
  }
});

// src/utils/identity/user.ts
import { memoize as memoize3 } from "lodash-es";
var getGitEmail, getUser;
var init_user = __esm({
  "src/utils/identity/user.ts"() {
    init_config();
    init_env();
    init_execFileNoThrow();
    init_log();
    init_macros();
    getGitEmail = memoize3(async () => {
      const result = await execFileNoThrow("git", ["config", "user.email"]);
      if (result.code !== 0) {
        logError(`Failed to get git email: ${result.stdout} ${result.stderr}`);
        return void 0;
      }
      return result.stdout.trim() || void 0;
    });
    getUser = memoize3(async () => {
      const userID = getOrCreateUserID();
      const config = getGlobalConfig();
      const email = void 0;
      return {
        customIDs: {
          sessionId: SESSION_ID
        },
        userID,
        appVersion: MACRO.VERSION,
        userAgent: env.platform,
        email,
        custom: {
          nodeVersion: env.nodeVersion,
          userType: process.env.USER_TYPE,
          organizationUuid: config.oauthAccount?.organizationUuid,
          accountUuid: config.oauthAccount?.accountUuid
        }
      };
    });
  }
});

// src/context/index.ts
import { memoize as memoize4, omit } from "lodash-es";
import { join as join2 } from "path";
import { readFile } from "fs/promises";
import { existsSync as existsSync2, readdirSync } from "fs";
async function getInstructionFilesNote() {
  try {
    const cwd = getCwd();
    const instructionFiles = getProjectInstructionFiles(cwd);
    const legacyPath = join2(cwd, "CLAUDE.md");
    const hasLegacy = existsSync2(legacyPath);
    if (instructionFiles.length === 0 && !hasLegacy) {
      return null;
    }
    const fileTypes = /* @__PURE__ */ new Set();
    for (const f of instructionFiles) fileTypes.add(f.filename);
    if (hasLegacy) fileTypes.add("CLAUDE.md (legacy)");
    const allFiles = [
      ...instructionFiles.map((f) => f.absolutePath),
      ...hasLegacy ? [legacyPath] : []
    ];
    return `NOTE: Additional project instruction files (${Array.from(fileTypes).join(", ")}) were found. When working in these directories, make sure to read and follow the instructions in the corresponding files:
${allFiles.map((_) => `- ${_}`).join("\n")}`;
  } catch (error) {
    logError(error);
    return null;
  }
}
function setContext(key, value) {
  const projectConfig = getCurrentProjectConfig();
  const context = omit(
    { ...projectConfig.context, [key]: value },
    "codeStyle",
    "directoryStructure"
  );
  saveCurrentProjectConfig({ ...projectConfig, context });
}
function removeContext(key) {
  const projectConfig = getCurrentProjectConfig();
  const context = omit(
    projectConfig.context,
    key,
    "codeStyle",
    "directoryStructure"
  );
  saveCurrentProjectConfig({ ...projectConfig, context });
}
async function getProjectDocsForCwd(cwd) {
  try {
    const instructionFiles = getProjectInstructionFiles(cwd);
    const legacyPath = join2(cwd, "CLAUDE.md");
    const docs = [];
    if (instructionFiles.length > 0) {
      const { content } = readAndConcatProjectInstructionFiles(
        instructionFiles,
        { includeHeadings: true }
      );
      if (content.trim().length > 0) docs.push(content);
    }
    if (existsSync2(legacyPath)) {
      try {
        const content = await readFile(legacyPath, "utf-8");
        docs.push(
          `# Legacy instructions (CLAUDE.md)

${content}`
        );
      } catch (e) {
        logError(e);
      }
    }
    return docs.length > 0 ? docs.join("\n\n---\n\n") : null;
  } catch (e) {
    logError(e);
    return null;
  }
}
var getReadme, getProjectDocs, getGitStatus, getContext, getDirectoryStructure;
var init_context = __esm({
  "src/context/index.ts"() {
    init_config();
    init_log();
    init_style();
    init_state();
    init_git();
    init_execFileNoThrow();
    init_user();
    init_projectInstructions();
    getReadme = memoize4(async () => {
      try {
        const readmePath = join2(getCwd(), "README.md");
        if (!existsSync2(readmePath)) {
          return null;
        }
        const content = await readFile(readmePath, "utf-8");
        return content;
      } catch (e) {
        logError(e);
        return null;
      }
    });
    getProjectDocs = memoize4(async () => {
      return getProjectDocsForCwd(getCwd());
    });
    getGitStatus = memoize4(async () => {
      if (process.env.NODE_ENV === "test") {
        return null;
      }
      if (!await getIsGit()) {
        return null;
      }
      try {
        const [branch, mainBranch, status, log, authorLog] = await Promise.all([
          execFileNoThrow(
            "git",
            ["branch", "--show-current"],
            void 0,
            void 0,
            false
          ).then(({ stdout }) => stdout.trim()),
          execFileNoThrow(
            "git",
            ["rev-parse", "--abbrev-ref", "origin/HEAD"],
            void 0,
            void 0,
            false
          ).then(({ stdout }) => stdout.replace("origin/", "").trim()),
          execFileNoThrow(
            "git",
            ["status", "--short"],
            void 0,
            void 0,
            false
          ).then(({ stdout }) => stdout.trim()),
          execFileNoThrow(
            "git",
            ["log", "--oneline", "-n", "5"],
            void 0,
            void 0,
            false
          ).then(({ stdout }) => stdout.trim()),
          execFileNoThrow(
            "git",
            [
              "log",
              "--oneline",
              "-n",
              "5",
              "--author",
              await getGitEmail() || ""
            ],
            void 0,
            void 0,
            false
          ).then(({ stdout }) => stdout.trim())
        ]);
        const statusLines = status.split("\n").length;
        const truncatedStatus = statusLines > 200 ? status.split("\n").slice(0, 200).join("\n") + '\n... (truncated because there are more than 200 lines. If you need more information, run "git status" using BashTool)' : status;
        return `This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.
Current branch: ${branch}

Main branch (you will usually use this for PRs): ${mainBranch}

Status:
${truncatedStatus || "(clean)"}

Recent commits:
${log}

Your recent commits:
${authorLog || "(no recent commits)"}`;
      } catch (error) {
        logError(error);
        return null;
      }
    });
    getContext = memoize4(
      async () => {
        const codeStyle = getCodeStyle();
        const projectConfig = getCurrentProjectConfig();
        const dontCrawl = projectConfig.dontCrawlDirectory;
        const [
          gitStatus,
          directoryStructure,
          instructionFilesNote,
          readme,
          projectDocs
        ] = await Promise.all([
          getGitStatus(),
          dontCrawl ? Promise.resolve("") : getDirectoryStructure(),
          dontCrawl ? Promise.resolve("") : getInstructionFilesNote(),
          getReadme(),
          getProjectDocs()
        ]);
        return {
          ...projectConfig.context,
          ...directoryStructure ? { directoryStructure } : {},
          ...gitStatus ? { gitStatus } : {},
          ...codeStyle ? { codeStyle } : {},
          ...instructionFilesNote ? { instructionFilesNote } : {},
          ...readme ? { readme } : {},
          ...projectDocs ? { projectDocs } : {}
        };
      }
    );
    getDirectoryStructure = memoize4(
      async function() {
        let lines;
        try {
          const entries = readdirSync(getCwd(), { withFileTypes: true });
          lines = entries.map((entry) => `${entry.isDirectory() ? "d" : "f"} ${entry.name}`).join("\n");
        } catch (error) {
          logError(error);
          return "";
        }
        return `Below is a snapshot of this project's file structure at the start of the conversation. This snapshot will NOT update during the conversation.

${lines}`;
      }
    );
  }
});

export {
  getCodeStyle,
  init_style,
  getIsGit,
  getGitState,
  init_git,
  getInstructionFilesNote,
  setContext,
  removeContext,
  getReadme,
  getProjectDocsForCwd,
  getProjectDocs,
  getGitStatus,
  getContext,
  getDirectoryStructure,
  init_context
};
