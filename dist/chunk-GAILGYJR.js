import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSettingsFileCandidates,
  loadSettingsWithLegacyFallback,
  saveSettingsToPrimaryAndSyncLegacy
} from "./chunk-ICAZBVTN.js";
import {
  createDefaultToolPermissionContext,
  isPersistableToolPermissionDestination
} from "./chunk-MVN3DHQF.js";
import {
  getCurrentProjectConfig
} from "./chunk-VJGTSZDK.js";
import {
  getCwd,
  init_log,
  init_state,
  logError
} from "./chunk-N4NKN7KX.js";

// src/utils/permissions/toolPermissionSettings.ts
init_state();
init_log();
function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of value) {
    if (typeof item !== "string") continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}
function getPrimarySettingsFilePathForDestination(options) {
  const candidates = getSettingsFileCandidates({
    destination: options.destination,
    projectDir: options.projectDir,
    homeDir: options.homeDir
  });
  return candidates?.primary ?? null;
}
function loadToolPermissionContextFromDisk(options) {
  const projectDir = options?.projectDir ?? getCwd();
  const homeDir = options?.homeDir;
  const includeDanyaProjectConfig = options?.includeDanyaProjectConfig ?? true;
  const base = createDefaultToolPermissionContext({
    isBypassPermissionsModeAvailable: options?.isBypassPermissionsModeAvailable ?? false
  });
  const destinations = [
    "userSettings",
    "projectSettings",
    "localSettings"
  ];
  for (const destination of destinations) {
    const settings = loadSettingsWithLegacyFallback({
      destination,
      projectDir,
      homeDir,
      migrateToPrimary: true
    }).settings;
    const perms = settings?.permissions;
    const allow = uniqueStrings(perms?.allow);
    const deny = uniqueStrings(perms?.deny);
    const ask = uniqueStrings(perms?.ask);
    const additionalDirectories = uniqueStrings(perms?.additionalDirectories);
    if (allow.length > 0) base.alwaysAllowRules[destination] = allow;
    if (deny.length > 0) base.alwaysDenyRules[destination] = deny;
    if (ask.length > 0) base.alwaysAskRules[destination] = ask;
    for (const dir of additionalDirectories) {
      base.additionalWorkingDirectories.set(dir, {
        path: dir,
        source: destination
      });
    }
  }
  if (includeDanyaProjectConfig) {
    try {
      const cfg = getCurrentProjectConfig();
      const allow = Array.isArray(cfg.allowedTools) ? cfg.allowedTools : [];
      const deny = Array.isArray(cfg.deniedTools) ? cfg.deniedTools : [];
      const ask = Array.isArray(cfg.askedTools) ? cfg.askedTools : [];
      if (allow.length > 0) {
        const prev = base.alwaysAllowRules.localSettings ?? [];
        base.alwaysAllowRules.localSettings = [.../* @__PURE__ */ new Set([...prev, ...allow])];
      }
      if (deny.length > 0) {
        const prev = base.alwaysDenyRules.localSettings ?? [];
        base.alwaysDenyRules.localSettings = [.../* @__PURE__ */ new Set([...prev, ...deny])];
      }
      if (ask.length > 0) {
        const prev = base.alwaysAskRules.localSettings ?? [];
        base.alwaysAskRules.localSettings = [.../* @__PURE__ */ new Set([...prev, ...ask])];
      }
    } catch (error) {
      logError(error);
    }
  }
  return base;
}
function getOrCreatePermissions(settings) {
  const existing = settings.permissions;
  if (existing && typeof existing === "object") {
    return existing;
  }
  settings.permissions = {};
  return settings.permissions;
}
function behaviorKey(behavior) {
  switch (behavior) {
    case "allow":
      return "allow";
    case "deny":
      return "deny";
    case "ask":
      return "ask";
  }
}
function persistToolPermissionUpdateToDisk(options) {
  const update = options.update;
  if (!isPersistableToolPermissionDestination(update.destination)) {
    return { persisted: false };
  }
  if (update.type === "setMode") {
    return { persisted: false };
  }
  const filePath = getPrimarySettingsFilePathForDestination({
    destination: update.destination,
    projectDir: options.projectDir,
    homeDir: options.homeDir
  });
  if (!filePath) return { persisted: false };
  const existing = loadSettingsWithLegacyFallback({
    destination: update.destination,
    projectDir: options.projectDir,
    homeDir: options.homeDir,
    migrateToPrimary: true
  }).settings ?? {};
  const permissions = getOrCreatePermissions(existing);
  try {
    switch (update.type) {
      case "addRules":
      case "replaceRules":
      case "removeRules": {
        const key = behaviorKey(update.behavior);
        const current = uniqueStrings(permissions[key]);
        if (update.type === "addRules") {
          const merged = [.../* @__PURE__ */ new Set([...current, ...update.rules])];
          permissions[key] = merged;
        } else if (update.type === "replaceRules") {
          permissions[key] = uniqueStrings(update.rules);
        } else {
          const toRemove = new Set(update.rules);
          permissions[key] = current.filter((rule) => !toRemove.has(rule));
        }
        break;
      }
      case "addDirectories":
      case "removeDirectories": {
        const current = uniqueStrings(permissions.additionalDirectories);
        if (update.type === "addDirectories") {
          permissions.additionalDirectories = [
            .../* @__PURE__ */ new Set([...current, ...update.directories])
          ];
        } else {
          const toRemove = new Set(update.directories);
          permissions.additionalDirectories = current.filter(
            (dir) => !toRemove.has(dir)
          );
        }
        break;
      }
      default:
        return { persisted: false };
    }
    saveSettingsToPrimaryAndSyncLegacy({
      destination: update.destination,
      projectDir: options.projectDir,
      homeDir: options.homeDir,
      settings: existing,
      syncLegacyIfExists: true
    });
    return { persisted: true };
  } catch (error) {
    logError(error);
    return { persisted: false };
  }
}

export {
  loadToolPermissionContextFromDisk,
  persistToolPermissionUpdateToDisk
};
