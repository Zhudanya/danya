import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/utils/config/sanitizeAnthropicEnv.ts
var deprecatedAnthropicEnvVars = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_API_TOKEN",
  "ANTHROPIC_API_Token"
];
for (const key of deprecatedAnthropicEnvVars) {
  if (process.env[key]) {
    delete process.env[key];
  }
}

// src/entrypoints/cli/bootstrapEnv.ts
import { fileURLToPath } from "node:url";
import { basename, dirname, join } from "node:path";
import { existsSync } from "node:fs";
function ensurePackagedRuntimeEnv() {
  if (process.env.DANYA_PACKAGED !== void 0 || process.env.KODE_PACKAGED !== void 0) return;
  try {
    const exec = basename(process.execPath || "").toLowerCase();
    if (exec && exec !== "bun" && exec !== "bun.exe" && exec !== "node" && exec !== "node.exe") {
      process.env.DANYA_PACKAGED = "1";
    }
  } catch {
  }
}
function ensureYogaWasmPath(entrypointUrl) {
  try {
    if (process.env.YOGA_WASM_PATH) return;
    const entryFile = fileURLToPath(entrypointUrl);
    const entryDir = dirname(entryFile);
    const devCandidate = join(entryDir, "../../yoga.wasm");
    const distCandidate = join(entryDir, "./yoga.wasm");
    const resolved = existsSync(distCandidate) ? distCandidate : existsSync(devCandidate) ? devCandidate : void 0;
    if (resolved) {
      process.env.YOGA_WASM_PATH = resolved;
    }
  } catch {
  }
}

export {
  ensurePackagedRuntimeEnv,
  ensureYogaWasmPath
};
