import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/config/settingSources.ts
function setEnabledSettingSourcesFromCli(sources) {
  if (sources === void 0) return;
  const trimmed = sources.trim();
  if (!trimmed) {
    throw new Error(
      `Invalid --setting-sources value: ${JSON.stringify(sources)}. Expected a comma-separated list of: user, project, local.`
    );
  }
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  const next = /* @__PURE__ */ new Set();
  const unknown = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    const mapped = CLI_TO_SETTING_SOURCE[key];
    if (!mapped) {
      unknown.push(part);
      continue;
    }
    next.add(mapped);
  }
  if (unknown.length > 0) {
    throw new Error(
      `Unknown setting source(s): ${unknown.join(", ")}. Expected: user, project, local.`
    );
  }
  enabledSettingSources = next;
}
function isSettingSourceEnabled(source) {
  return enabledSettingSources.has(source);
}
var CLI_TO_SETTING_SOURCE, enabledSettingSources;
var init_settingSources = __esm({
  "src/utils/config/settingSources.ts"() {
    CLI_TO_SETTING_SOURCE = {
      user: "userSettings",
      project: "projectSettings",
      local: "localSettings"
    };
    enabledSettingSources = new Set(
      Object.values(CLI_TO_SETTING_SOURCE)
    );
  }
});

export {
  setEnabledSettingSourcesFromCli,
  isSettingSourceEnabled,
  init_settingSources
};
