import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getCwd,
  init_log,
  init_state,
  logError
} from "./chunk-NGBTEKOZ.js";
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/config/settingsFiles.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";
function normalizeOverride(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? resolve(trimmed) : null;
}
function dedupeStrings(values) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}
function getDefaultHomeDir() {
  const envHome = typeof process.env.HOME === "string" ? process.env.HOME : typeof process.env.USERPROFILE === "string" ? process.env.USERPROFILE : "";
  const trimmed = envHome.trim();
  if (trimmed) return trimmed;
  return homedir();
}
function getUserDanyaBaseDir(options) {
  const respectEnvOverride = options?.respectEnvOverride ?? true;
  if (respectEnvOverride) {
    const override = normalizeOverride(
      process.env.DANYA_CONFIG_DIR ?? process.env.KODE_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR
    );
    if (override) return override;
  }
  const home = options?.homeDir ?? getDefaultHomeDir();
  return join(home, ".danya");
}
function getUserLegacyBaseDir(options) {
  const respectEnvOverride = options?.respectEnvOverride ?? true;
  if (respectEnvOverride) {
    const override = normalizeOverride(process.env.CLAUDE_CONFIG_DIR);
    if (override) return override;
  }
  const home = options?.homeDir ?? getDefaultHomeDir();
  return join(home, ".claude");
}
function getSettingsFileCandidates(options) {
  const projectDir = options.projectDir ?? getCwd();
  const homeDir = options.homeDir ?? getDefaultHomeDir();
  const respectEnvOverride = options.homeDir === void 0;
  switch (options.destination) {
    case "localSettings": {
      const primary = join(projectDir, ".danya", "settings.local.json");
      const legacy = [join(projectDir, ".kode", "settings.local.json"), join(projectDir, ".claude", "settings.local.json")];
      return { primary, legacy };
    }
    case "projectSettings": {
      const primary = join(projectDir, ".danya", "settings.json");
      const legacy = [join(projectDir, ".kode", "settings.json"), join(projectDir, ".claude", "settings.json")];
      return { primary, legacy };
    }
    case "userSettings": {
      const primary = join(
        getUserDanyaBaseDir({ homeDir, respectEnvOverride }),
        "settings.json"
      );
      const legacy = dedupeStrings([
        join(
          getUserLegacyBaseDir({ homeDir, respectEnvOverride }),
          "settings.json"
        ),
        join(homeDir, ".claude", "settings.json")
      ]);
      return { primary, legacy };
    }
    default:
      return null;
  }
}
function readSettingsFile(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    logError(error);
    return null;
  }
}
function writeSettingsFile(filePath, settings) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}
function loadSettingsWithLegacyFallback(options) {
  const candidates = getSettingsFileCandidates(options);
  if (!candidates) return { settings: null, usedPath: null };
  const primarySettings = readSettingsFile(candidates.primary);
  if (primarySettings)
    return { settings: primarySettings, usedPath: candidates.primary };
  for (const legacyPath of candidates.legacy) {
    const legacySettings = readSettingsFile(legacyPath);
    if (!legacySettings) continue;
    if (options.migrateToPrimary && legacyPath !== candidates.primary) {
      try {
        if (!existsSync(candidates.primary)) {
          writeSettingsFile(candidates.primary, legacySettings);
        }
      } catch (error) {
        logError(error);
      }
    }
    return { settings: legacySettings, usedPath: legacyPath };
  }
  return { settings: null, usedPath: null };
}
function saveSettingsToPrimaryAndSyncLegacy(options) {
  const candidates = getSettingsFileCandidates(options);
  if (!candidates) return;
  writeSettingsFile(candidates.primary, options.settings);
  if (!options.syncLegacyIfExists) return;
  for (const legacyPath of candidates.legacy) {
    if (legacyPath === candidates.primary) continue;
    if (!existsSync(legacyPath)) continue;
    try {
      writeSettingsFile(legacyPath, options.settings);
    } catch (error) {
      logError(error);
    }
  }
}
var init_settingsFiles = __esm({
  "src/utils/config/settingsFiles.ts"() {
    init_state();
    init_log();
  }
});

export {
  getSettingsFileCandidates,
  loadSettingsWithLegacyFallback,
  saveSettingsToPrimaryAndSyncLegacy,
  init_settingsFiles
};
