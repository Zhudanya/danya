import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  PRODUCT_NAME,
  execFileNoThrow,
  init_execFileNoThrow,
  init_log,
  init_product,
  logError
} from "./chunk-SQGAHZPM.js";
import {
  MACRO,
  init_macros
} from "./chunk-UNCTVIS7.js";

// src/utils/session/autoUpdater.ts
init_execFileNoThrow();
init_log();
init_macros();
init_product();
async function getSemver() {
  const mod = await import("semver");
  return mod?.default ?? mod;
}
async function assertMinVersion() {
  try {
    const versionConfig = { minVersion: "0.0.0" };
    if (versionConfig.minVersion) {
      const { lt } = await getSemver();
      if (!lt(MACRO.VERSION, versionConfig.minVersion)) return;
      const suggestions = await getUpdateCommandSuggestions();
      process.stderr.write(
        `Your ${PRODUCT_NAME} version ${MACRO.VERSION} is below the minimum supported ${versionConfig.minVersion}.
Update using one of:
` + suggestions.map((c) => `  ${c}`).join("\n") + "\n"
      );
      process.exit(1);
    }
  } catch (error) {
    logError(`Error checking minimum version: ${error}`);
  }
}
async function getLatestVersion() {
  try {
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), 5e3);
    const result = await execFileNoThrow(
      "npm",
      ["view", MACRO.PACKAGE_URL, "version"],
      abortController.signal
    );
    if (result.code === 0) {
      const v = result.stdout.trim();
      if (v) return v;
    }
  } catch {
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5e3);
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(MACRO.PACKAGE_URL)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.npm.install-v1+json",
          "User-Agent": `${PRODUCT_NAME}/${MACRO.VERSION}`
        },
        signal: controller.signal
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const latest = json && json["dist-tags"] && json["dist-tags"].latest;
    return typeof latest === "string" ? latest : null;
  } catch {
    return null;
  }
}
async function getUpdateCommandSuggestions() {
  return [
    `bun add -g ${MACRO.PACKAGE_URL}@latest`,
    `npm install -g ${MACRO.PACKAGE_URL}@latest`
  ];
}
async function checkAndNotifyUpdate() {
  try {
    if (process.env.NODE_ENV === "test") return;
    const [
      { isAutoUpdaterDisabled, getGlobalConfig, saveGlobalConfig },
      { env }
    ] = await Promise.all([import("./config-MLH7ZTFA.js"), import("./env-VMEIP4EW.js")]);
    if (await isAutoUpdaterDisabled()) return;
    if (await env.getIsDocker()) return;
    if (!await env.hasInternetAccess()) return;
    const config = getGlobalConfig();
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1e3;
    const lastCheck = Number(config.lastUpdateCheckAt || 0);
    if (lastCheck && now - lastCheck < DAY_MS) return;
    const latest = await getLatestVersion();
    if (!latest) {
      saveGlobalConfig({ ...config, lastUpdateCheckAt: now });
      return;
    }
    const { gt } = await getSemver();
    if (gt(latest, MACRO.VERSION)) {
      saveGlobalConfig({
        ...config,
        lastUpdateCheckAt: now,
        lastSuggestedVersion: latest
      });
      const suggestions = await getUpdateCommandSuggestions();
      process.stderr.write(
        [
          `New version available: ${latest} (current: ${MACRO.VERSION})`,
          "Run the following command to update:",
          ...suggestions.map((command) => `  ${command}`),
          ""
        ].join("\n")
      );
    } else {
      saveGlobalConfig({ ...config, lastUpdateCheckAt: now });
    }
  } catch (error) {
    logError(`update-notify: ${error}`);
  }
}

export {
  assertMinVersion,
  getLatestVersion,
  getUpdateCommandSuggestions,
  checkAndNotifyUpdate
};
