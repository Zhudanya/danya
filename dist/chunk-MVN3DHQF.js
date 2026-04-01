import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/types/toolPermissionContext.ts
function createDefaultToolPermissionContext(options) {
  return {
    mode: "default",
    additionalWorkingDirectories: /* @__PURE__ */ new Map(),
    alwaysAllowRules: {},
    alwaysDenyRules: {},
    alwaysAskRules: {},
    isBypassPermissionsModeAvailable: options?.isBypassPermissionsModeAvailable ?? false
  };
}
function applyToolPermissionContextUpdate(context, update) {
  switch (update.type) {
    case "setMode":
      return { ...context, mode: update.mode };
    case "addRules": {
      const key = update.behavior === "allow" ? "alwaysAllowRules" : update.behavior === "deny" ? "alwaysDenyRules" : "alwaysAskRules";
      const existing = context[key][update.destination] ?? [];
      return {
        ...context,
        [key]: {
          ...context[key],
          [update.destination]: [...existing, ...update.rules]
        }
      };
    }
    case "replaceRules": {
      const key = update.behavior === "allow" ? "alwaysAllowRules" : update.behavior === "deny" ? "alwaysDenyRules" : "alwaysAskRules";
      return {
        ...context,
        [key]: {
          ...context[key],
          [update.destination]: [...update.rules]
        }
      };
    }
    case "removeRules": {
      const key = update.behavior === "allow" ? "alwaysAllowRules" : update.behavior === "deny" ? "alwaysDenyRules" : "alwaysAskRules";
      const current = context[key][update.destination] ?? [];
      const toRemove = new Set(update.rules);
      const next = current.filter((rule) => !toRemove.has(rule));
      return {
        ...context,
        [key]: {
          ...context[key],
          [update.destination]: next
        }
      };
    }
    case "addDirectories": {
      const nextDirs = new Map(context.additionalWorkingDirectories);
      for (const dir of update.directories) {
        nextDirs.set(dir, { path: dir, source: update.destination });
      }
      return { ...context, additionalWorkingDirectories: nextDirs };
    }
    case "removeDirectories": {
      const nextDirs = new Map(context.additionalWorkingDirectories);
      for (const dir of update.directories) {
        nextDirs.delete(dir);
      }
      return { ...context, additionalWorkingDirectories: nextDirs };
    }
    default:
      return context;
  }
}
function applyToolPermissionContextUpdates(context, updates) {
  let next = context;
  for (const update of updates) {
    next = applyToolPermissionContextUpdate(next, update);
  }
  return next;
}
function isPersistableToolPermissionDestination(destination) {
  return destination === "localSettings" || destination === "userSettings" || destination === "projectSettings";
}
function canUserModifyToolPermissionUpdate(update) {
  if (update.destination !== "policySettings") return true;
  if (update.type === "removeRules") return false;
  if (update.type === "replaceRules") return false;
  if (update.type === "removeDirectories") return false;
  return true;
}

export {
  createDefaultToolPermissionContext,
  applyToolPermissionContextUpdate,
  applyToolPermissionContextUpdates,
  isPersistableToolPermissionDestination,
  canUserModifyToolPermissionUpdate
};
