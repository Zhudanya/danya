import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSessionPlugins,
  init_sessionPlugins
} from "./chunk-RJUXM6BV.js";
import {
  debug,
  init_debugLogger
} from "./chunk-PPXRQ4YY.js";
import {
  getCwd,
  getKodeBaseDir,
  init_env,
  init_log,
  init_state,
  logError
} from "./chunk-LUEVEFPD.js";
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/services/plugins/customCommands.ts
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { basename, dirname, join, relative, sep } from "path";
import { homedir } from "os";
import { memoize } from "lodash-es";
import { execFile } from "child_process";
import { promisify } from "util";
import matter from "gray-matter";
import yaml from "js-yaml";
async function executeBashCommands(content) {
  const bashCommandRegex = /!\`([^`]+)\`/g;
  const matches = [...content.matchAll(bashCommandRegex)];
  if (matches.length === 0) {
    return content;
  }
  let result = content;
  for (const match of matches) {
    const fullMatch = match[0];
    const command = match[1].trim();
    try {
      const parts = command.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      const { stdout, stderr } = await execFileAsync(cmd, args, {
        timeout: 5e3,
        encoding: "utf8",
        cwd: getCwd()
      });
      const output = stdout.trim() || stderr.trim() || "(no output)";
      result = result.replace(fullMatch, output);
    } catch (error) {
      logError(error);
      debug.warn("CUSTOM_COMMAND_BASH_EXEC_FAILED", {
        command,
        error: error instanceof Error ? error.message : String(error)
      });
      result = result.replace(fullMatch, `(error executing: ${command})`);
    }
  }
  return result;
}
async function resolveFileReferences(content) {
  const fileRefRegex = /@([a-zA-Z0-9/._-]+(?:\.[a-zA-Z0-9]+)?)/g;
  const matches = [...content.matchAll(fileRefRegex)];
  if (matches.length === 0) {
    return content;
  }
  let result = content;
  for (const match of matches) {
    const fullMatch = match[0];
    const filePath = match[1];
    if (filePath.startsWith("agent-")) {
      continue;
    }
    try {
      const fullPath = join(getCwd(), filePath);
      if (existsSync(fullPath)) {
        const fileContent = readFileSync(fullPath, { encoding: "utf-8" });
        const formattedContent = `

## File: ${filePath}
\`\`\`
${fileContent}
\`\`\`
`;
        result = result.replace(fullMatch, formattedContent);
      } else {
        result = result.replace(fullMatch, `(file not found: ${filePath})`);
      }
    } catch (error) {
      logError(error);
      debug.warn("CUSTOM_COMMAND_FILE_READ_FAILED", {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      });
      result = result.replace(fullMatch, `(error reading: ${filePath})`);
    }
  }
  return result;
}
function parseFrontmatter(content) {
  const yamlSchema = yaml.JSON_SCHEMA;
  const parsed = matter(content, {
    engines: {
      yaml: {
        parse: (input) => yaml.load(input, yamlSchema ? { schema: yamlSchema } : void 0) ?? {}
      }
    }
  });
  return {
    frontmatter: parsed.data ?? {},
    content: parsed.content ?? ""
  };
}
function isSkillMarkdownFile(filePath) {
  return /^skill\.md$/i.test(basename(filePath));
}
function getUserDanyaBaseDir() {
  return getKodeBaseDir();
}
function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }
  return false;
}
function parseAllowedTools(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed.split(/\s+/).map((v) => v.trim()).filter(Boolean);
  }
  return [];
}
function parseMaxThinkingTokens(frontmatter) {
  const raw = frontmatter.maxThinkingTokens ?? frontmatter.max_thinking_tokens ?? frontmatter["max-thinking-tokens"] ?? frontmatter["max_thinking_tokens"];
  if (raw === void 0 || raw === null) return void 0;
  const value = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(value) || value < 0) return void 0;
  return Math.floor(value);
}
function sourceLabel(source) {
  if (source === "localSettings") return "project";
  if (source === "userSettings") return "user";
  if (source === "pluginDir") return "plugin";
  return "unknown";
}
function extractDescriptionFromMarkdown(markdown, fallback) {
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    if (heading?.[1]) return heading[1].trim();
    return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
  }
  return fallback;
}
function namespaceFromDirPath(dirPath, baseDir) {
  const relPath = relative(baseDir, dirPath);
  if (!relPath || relPath === "." || relPath.startsWith("..")) return "";
  return relPath.split(sep).join(":");
}
function nameForCommandFile(filePath, baseDir) {
  if (isSkillMarkdownFile(filePath)) {
    const skillDir = dirname(filePath);
    const parentDir = dirname(skillDir);
    const skillName = basename(skillDir);
    const namespace2 = namespaceFromDirPath(parentDir, baseDir);
    return namespace2 ? `${namespace2}:${skillName}` : skillName;
  }
  const dir = dirname(filePath);
  const namespace = namespaceFromDirPath(dir, baseDir);
  const fileName = basename(filePath).replace(/\.md$/i, "");
  return namespace ? `${namespace}:${fileName}` : fileName;
}
function buildPluginQualifiedName(pluginName, localName) {
  const p = pluginName.trim();
  const l = localName.trim();
  if (!p) return l;
  if (!l || l === p) return p;
  return `${p}:${l}`;
}
function nameForPluginCommandFile(filePath, commandsDir, pluginName) {
  const rel = relative(commandsDir, filePath);
  const noExt = rel.replace(/\.md$/i, "");
  const localName = noExt.split(sep).filter(Boolean).join(":");
  return buildPluginQualifiedName(pluginName, localName);
}
function createPluginPromptCommandFromFile(record) {
  const name = nameForPluginCommandFile(
    record.filePath,
    record.commandsDir,
    record.pluginName
  );
  if (!name) return null;
  const descriptionText = record.frontmatter.description ?? extractDescriptionFromMarkdown(record.content, "Custom command");
  const allowedTools = parseAllowedTools(record.frontmatter["allowed-tools"]);
  const maxThinkingTokens = parseMaxThinkingTokens(record.frontmatter);
  const argumentHint = record.frontmatter["argument-hint"];
  const whenToUse = record.frontmatter.when_to_use;
  const version = record.frontmatter.version;
  const disableModelInvocation = toBoolean(
    record.frontmatter["disable-model-invocation"]
  );
  const model = record.frontmatter.model === "inherit" ? void 0 : record.frontmatter.model;
  return {
    type: "prompt",
    name,
    description: `${descriptionText} (${sourceLabel("pluginDir")})`,
    isEnabled: true,
    isHidden: false,
    filePath: record.filePath,
    aliases: [],
    progressMessage: "running",
    allowedTools,
    maxThinkingTokens,
    argumentHint,
    whenToUse,
    version,
    model,
    isSkill: false,
    disableModelInvocation,
    hasUserSpecifiedDescription: !!record.frontmatter.description,
    source: "pluginDir",
    scope: "project",
    userFacingName() {
      return name;
    },
    async getPromptForCommand(args) {
      let prompt = record.content;
      const trimmedArgs = args.trim();
      if (trimmedArgs) {
        if (prompt.includes("$ARGUMENTS")) {
          prompt = prompt.replaceAll("$ARGUMENTS", trimmedArgs);
        } else {
          prompt = `${prompt}

ARGUMENTS: ${trimmedArgs}`;
        }
      }
      return [{ role: "user", content: prompt }];
    }
  };
}
function loadPluginCommandsFromDir(args) {
  let commandsBaseDir = args.commandsDir;
  let files = [];
  try {
    const st = statSync(args.commandsDir);
    if (st.isFile()) {
      if (!args.commandsDir.toLowerCase().endsWith(".md")) return [];
      files = [args.commandsDir];
      commandsBaseDir = dirname(args.commandsDir);
    } else if (st.isDirectory()) {
      files = listMarkdownFilesRecursively(args.commandsDir, args.signal);
    } else {
      return [];
    }
  } catch {
    return [];
  }
  const out = [];
  for (const filePath of files) {
    if (args.signal.aborted) break;
    try {
      const raw = readFileSync(filePath, "utf8");
      const { frontmatter, content } = parseFrontmatter(raw);
      const cmd = createPluginPromptCommandFromFile({
        pluginName: args.pluginName,
        commandsDir: commandsBaseDir,
        filePath,
        frontmatter,
        content
      });
      if (cmd) out.push(cmd);
    } catch {
    }
  }
  return out;
}
function loadPluginSkillDirectoryCommandsFromBaseDir(args) {
  if (!existsSync(args.skillsDir)) return [];
  const out = [];
  let entries;
  try {
    entries = readdirSync(args.skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const strictMode = toBoolean(process.env.DANYA_SKILLS_STRICT ?? process.env.KODE_SKILLS_STRICT);
  const validateName = (skillName) => {
    if (skillName.length < 1 || skillName.length > 64) return false;
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName);
  };
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const skillDir = join(args.skillsDir, entry.name);
    const skillFileCandidates = [
      join(skillDir, "SKILL.md"),
      join(skillDir, "skill.md")
    ];
    const skillFile = skillFileCandidates.find((p) => existsSync(p));
    if (!skillFile) continue;
    try {
      const raw = readFileSync(skillFile, "utf8");
      const { frontmatter, content } = parseFrontmatter(raw);
      const dirName = entry.name;
      const declaredName = typeof frontmatter.name === "string" ? String(frontmatter.name).trim() : "";
      const effectiveDeclaredName = declaredName && declaredName === dirName ? declaredName : "";
      if (declaredName && declaredName !== dirName) {
        if (strictMode) continue;
        debug.warn("CUSTOM_COMMAND_SKILL_NAME_MISMATCH", {
          dirName,
          declaredName,
          skillFile
        });
      }
      const name = buildPluginQualifiedName(args.pluginName, dirName);
      if (!validateName(dirName)) {
        if (strictMode) continue;
        debug.warn("CUSTOM_COMMAND_SKILL_DIR_INVALID", { dirName, skillFile });
      }
      const descriptionText = frontmatter.description ?? extractDescriptionFromMarkdown(content, "Skill");
      if (strictMode) {
        const d = typeof frontmatter.description === "string" ? frontmatter.description.trim() : "";
        if (!d || d.length > 1024) continue;
      }
      const allowedTools = parseAllowedTools(frontmatter["allowed-tools"]);
      const maxThinkingTokens = parseMaxThinkingTokens(frontmatter);
      const argumentHint = frontmatter["argument-hint"];
      const whenToUse = frontmatter.when_to_use;
      const version = frontmatter.version;
      const disableModelInvocation = toBoolean(
        frontmatter["disable-model-invocation"]
      );
      const model = frontmatter.model === "inherit" ? void 0 : frontmatter.model;
      out.push({
        type: "prompt",
        name,
        description: `${descriptionText} (${sourceLabel("pluginDir")})`,
        isEnabled: true,
        isHidden: true,
        aliases: [],
        filePath: skillFile,
        progressMessage: "loading",
        allowedTools,
        maxThinkingTokens,
        argumentHint,
        whenToUse,
        version,
        model,
        isSkill: true,
        disableModelInvocation,
        hasUserSpecifiedDescription: !!frontmatter.description,
        source: "pluginDir",
        scope: "project",
        userFacingName() {
          return effectiveDeclaredName ? buildPluginQualifiedName(args.pluginName, effectiveDeclaredName) : name;
        },
        async getPromptForCommand(argsText) {
          let prompt = `Base directory for this skill: ${skillDir}

${content}`;
          const trimmedArgs = argsText.trim();
          if (trimmedArgs) {
            if (prompt.includes("$ARGUMENTS")) {
              prompt = prompt.replaceAll("$ARGUMENTS", trimmedArgs);
            } else {
              prompt = `${prompt}

ARGUMENTS: ${trimmedArgs}`;
            }
          }
          return [{ role: "user", content: prompt }];
        }
      });
    } catch {
    }
  }
  return out;
}
function applySkillFilePreference(files) {
  const grouped = /* @__PURE__ */ new Map();
  for (const file of files) {
    const key = dirname(file.filePath);
    const existing = grouped.get(key) ?? [];
    existing.push(file);
    grouped.set(key, existing);
  }
  const result = [];
  for (const group of grouped.values()) {
    const skillFiles = group.filter((f) => isSkillMarkdownFile(f.filePath));
    if (skillFiles.length > 0) {
      result.push(skillFiles[0]);
      continue;
    }
    result.push(...group);
  }
  return result;
}
function createPromptCommandFromFile(record) {
  const isSkill = isSkillMarkdownFile(record.filePath);
  const name = nameForCommandFile(record.filePath, record.baseDir);
  if (!name) return null;
  const descriptionText = record.frontmatter.description ?? extractDescriptionFromMarkdown(
    record.content,
    isSkill ? "Skill" : "Custom command"
  );
  const allowedTools = parseAllowedTools(record.frontmatter["allowed-tools"]);
  const maxThinkingTokens = parseMaxThinkingTokens(record.frontmatter);
  const argumentHint = record.frontmatter["argument-hint"];
  const whenToUse = record.frontmatter.when_to_use;
  const version = record.frontmatter.version;
  const disableModelInvocation = toBoolean(
    record.frontmatter["disable-model-invocation"]
  );
  const model = record.frontmatter.model === "inherit" ? void 0 : record.frontmatter.model;
  const description = `${descriptionText} (${sourceLabel(record.source)})`;
  const progressMessage = isSkill ? "loading" : "running";
  const skillBaseDir = isSkill ? dirname(record.filePath) : void 0;
  return {
    type: "prompt",
    name,
    description,
    isEnabled: true,
    isHidden: false,
    filePath: record.filePath,
    aliases: [],
    progressMessage,
    allowedTools,
    maxThinkingTokens,
    argumentHint,
    whenToUse,
    version,
    model,
    isSkill,
    disableModelInvocation,
    hasUserSpecifiedDescription: !!record.frontmatter.description,
    source: record.source,
    scope: record.scope,
    userFacingName() {
      return name;
    },
    async getPromptForCommand(args) {
      let prompt = record.content;
      if (isSkill && skillBaseDir) {
        prompt = `Base directory for this skill: ${skillBaseDir}

${prompt}`;
      }
      const trimmedArgs = args.trim();
      if (trimmedArgs) {
        if (prompt.includes("$ARGUMENTS")) {
          prompt = prompt.replaceAll("$ARGUMENTS", trimmedArgs);
        } else {
          prompt = `${prompt}

ARGUMENTS: ${trimmedArgs}`;
        }
      }
      return [{ role: "user", content: prompt }];
    }
  };
}
function listMarkdownFilesRecursively(baseDir, signal) {
  const results = [];
  const queue = [baseDir];
  while (queue.length > 0) {
    if (signal.aborted) break;
    const currentDir = queue.pop();
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (signal.aborted) break;
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }
  return results;
}
function loadCommandMarkdownFilesFromBaseDir(baseDir, source, scope, signal) {
  if (!existsSync(baseDir)) return [];
  const files = listMarkdownFilesRecursively(baseDir, signal);
  const records = [];
  for (const filePath of files) {
    if (signal.aborted) break;
    try {
      const raw = readFileSync(filePath, "utf8");
      const { frontmatter, content } = parseFrontmatter(raw);
      records.push({ baseDir, filePath, frontmatter, content, source, scope });
    } catch {
    }
  }
  return records;
}
function loadSkillDirectoryCommandsFromBaseDir(skillsDir, source, scope) {
  if (!existsSync(skillsDir)) return [];
  const out = [];
  let entries;
  try {
    entries = readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const strictMode = toBoolean(process.env.DANYA_SKILLS_STRICT ?? process.env.KODE_SKILLS_STRICT);
  const validateName = (skillName) => {
    if (skillName.length < 1 || skillName.length > 64) return false;
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName);
  };
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const skillDir = join(skillsDir, entry.name);
    const skillFileCandidates = [
      join(skillDir, "SKILL.md"),
      join(skillDir, "skill.md")
    ];
    const skillFile = skillFileCandidates.find((p) => existsSync(p));
    if (!skillFile) continue;
    try {
      const raw = readFileSync(skillFile, "utf8");
      const { frontmatter, content } = parseFrontmatter(raw);
      const dirName = entry.name;
      const declaredName = typeof frontmatter.name === "string" ? String(frontmatter.name).trim() : "";
      const effectiveDeclaredName = declaredName && declaredName === dirName ? declaredName : "";
      if (declaredName && declaredName !== dirName) {
        if (strictMode) continue;
        debug.warn("CUSTOM_COMMAND_SKILL_NAME_MISMATCH", {
          dirName,
          declaredName,
          skillFile
        });
      }
      const name = dirName;
      if (!validateName(name)) {
        if (strictMode) continue;
        debug.warn("CUSTOM_COMMAND_SKILL_DIR_INVALID", { name, skillFile });
      }
      const descriptionText = frontmatter.description ?? extractDescriptionFromMarkdown(content, "Skill");
      if (strictMode) {
        const d = typeof frontmatter.description === "string" ? frontmatter.description.trim() : "";
        if (!d || d.length > 1024) continue;
      }
      const allowedTools = parseAllowedTools(frontmatter["allowed-tools"]);
      const maxThinkingTokens = parseMaxThinkingTokens(frontmatter);
      const argumentHint = frontmatter["argument-hint"];
      const whenToUse = frontmatter.when_to_use;
      const version = frontmatter.version;
      const disableModelInvocation = toBoolean(
        frontmatter["disable-model-invocation"]
      );
      const model = frontmatter.model === "inherit" ? void 0 : frontmatter.model;
      out.push({
        type: "prompt",
        name,
        description: `${descriptionText} (${sourceLabel(source)})`,
        isEnabled: true,
        isHidden: true,
        aliases: [],
        filePath: skillFile,
        progressMessage: "loading",
        allowedTools,
        maxThinkingTokens,
        argumentHint,
        whenToUse,
        version,
        model,
        isSkill: true,
        disableModelInvocation,
        hasUserSpecifiedDescription: !!frontmatter.description,
        source,
        scope,
        userFacingName() {
          return effectiveDeclaredName || name;
        },
        async getPromptForCommand(args) {
          let prompt = `Base directory for this skill: ${skillDir}

${content}`;
          const trimmedArgs = args.trim();
          if (trimmedArgs) {
            if (prompt.includes("$ARGUMENTS")) {
              prompt = prompt.replaceAll("$ARGUMENTS", trimmedArgs);
            } else {
              prompt = `${prompt}

ARGUMENTS: ${trimmedArgs}`;
            }
          }
          return [{ role: "user", content: prompt }];
        }
      });
    } catch {
    }
  }
  return out;
}
function getCustomCommandDirectories() {
  const userDanyaBaseDir = getUserDanyaBaseDir();
  return {
    userClaudeCommands: join(homedir(), ".claude", "commands"),
    projectClaudeCommands: join(getCwd(), ".claude", "commands"),
    userClaudeSkills: join(homedir(), ".claude", "skills"),
    projectClaudeSkills: join(getCwd(), ".claude", "skills"),
    userDanyaCommands: join(userDanyaBaseDir, "commands"),
    projectDanyaCommands: join(getCwd(), ".danya", "commands"),
    userDanyaSkills: join(userDanyaBaseDir, "skills"),
    projectDanyaSkills: join(getCwd(), ".danya", "skills")
  };
}
function hasCustomCommands() {
  const dirs = getCustomCommandDirectories();
  return existsSync(dirs.userClaudeCommands) || existsSync(dirs.projectClaudeCommands) || existsSync(dirs.userClaudeSkills) || existsSync(dirs.projectClaudeSkills) || existsSync(dirs.userDanyaCommands) || existsSync(dirs.projectDanyaCommands) || existsSync(dirs.userDanyaSkills) || existsSync(dirs.projectDanyaSkills);
}
var execFileAsync, loadCustomCommands, reloadCustomCommands;
var init_customCommands = __esm({
  "src/services/plugins/customCommands.ts"() {
    init_state();
    init_sessionPlugins();
    init_env();
    init_debugLogger();
    init_log();
    execFileAsync = promisify(execFile);
    loadCustomCommands = memoize(
      async () => {
        const cwd = getCwd();
        const userDanyaBaseDir = getUserDanyaBaseDir();
        const sessionPlugins = getSessionPlugins();
        const projectLegacyCommandsDir = join(cwd, ".claude", "commands");
        const userLegacyCommandsDir = join(homedir(), ".claude", "commands");
        const projectDanyaCommandsDir = join(cwd, ".danya", "commands");
        const userDanyaCommandsDir = join(userDanyaBaseDir, "commands");
        const projectLegacySkillsDir = join(cwd, ".claude", "skills");
        const userLegacySkillsDir = join(homedir(), ".claude", "skills");
        const projectDanyaSkillsDir = join(cwd, ".danya", "skills");
        const userDanyaSkillsDir = join(userDanyaBaseDir, "skills");
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), 3e3);
        try {
          const commandFiles = applySkillFilePreference([
            ...loadCommandMarkdownFilesFromBaseDir(
              projectLegacyCommandsDir,
              "localSettings",
              "project",
              abortController.signal
            ),
            ...loadCommandMarkdownFilesFromBaseDir(
              projectDanyaCommandsDir,
              "localSettings",
              "project",
              abortController.signal
            ),
            ...loadCommandMarkdownFilesFromBaseDir(
              userLegacyCommandsDir,
              "userSettings",
              "user",
              abortController.signal
            ),
            ...loadCommandMarkdownFilesFromBaseDir(
              userDanyaCommandsDir,
              "userSettings",
              "user",
              abortController.signal
            )
          ]);
          const fileCommands = commandFiles.map(createPromptCommandFromFile).filter((cmd) => cmd !== null);
          const skillDirCommands = [
            ...loadSkillDirectoryCommandsFromBaseDir(
              projectLegacySkillsDir,
              "localSettings",
              "project"
            ),
            ...loadSkillDirectoryCommandsFromBaseDir(
              projectDanyaSkillsDir,
              "localSettings",
              "project"
            ),
            ...loadSkillDirectoryCommandsFromBaseDir(
              userLegacySkillsDir,
              "userSettings",
              "user"
            ),
            ...loadSkillDirectoryCommandsFromBaseDir(
              userDanyaSkillsDir,
              "userSettings",
              "user"
            )
          ];
          const pluginCommands = [];
          if (sessionPlugins.length > 0) {
            for (const plugin of sessionPlugins) {
              for (const commandsDir of plugin.commandsDirs) {
                pluginCommands.push(
                  ...loadPluginCommandsFromDir({
                    pluginName: plugin.name,
                    commandsDir,
                    signal: abortController.signal
                  })
                );
              }
              for (const skillsDir of plugin.skillsDirs) {
                pluginCommands.push(
                  ...loadPluginSkillDirectoryCommandsFromBaseDir({
                    pluginName: plugin.name,
                    skillsDir
                  })
                );
              }
            }
          }
          const ordered = [
            ...fileCommands,
            ...skillDirCommands,
            ...pluginCommands
          ].filter((cmd) => cmd.isEnabled);
          const seen = /* @__PURE__ */ new Set();
          const unique = [];
          for (const cmd of ordered) {
            const key = cmd.userFacingName();
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(cmd);
          }
          return unique;
        } catch (error) {
          logError(error);
          debug.warn("CUSTOM_COMMANDS_LOAD_FAILED", {
            error: error instanceof Error ? error.message : String(error)
          });
          return [];
        } finally {
          clearTimeout(timeout);
        }
      },
      () => {
        const cwd = getCwd();
        const userDanyaBaseDir = getUserDanyaBaseDir();
        const dirs = [
          join(homedir(), ".claude", "commands"),
          join(cwd, ".claude", "commands"),
          join(userDanyaBaseDir, "commands"),
          join(cwd, ".danya", "commands"),
          join(homedir(), ".claude", "skills"),
          join(cwd, ".claude", "skills"),
          join(userDanyaBaseDir, "skills"),
          join(cwd, ".danya", "skills")
        ];
        const exists = dirs.map((d) => existsSync(d) ? "1" : "0").join("");
        return `${cwd}:${exists}:${Math.floor(Date.now() / 6e4)}`;
      }
    );
    reloadCustomCommands = () => {
      loadCustomCommands.cache.clear();
    };
  }
});

export {
  executeBashCommands,
  resolveFileReferences,
  parseFrontmatter,
  loadCustomCommands,
  reloadCustomCommands,
  getCustomCommandDirectories,
  hasCustomCommands,
  init_customCommands
};
