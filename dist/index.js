import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  MACRO,
  init_macros
} from "./chunk-5M3MBCE7.js";
import "./chunk-M3TKNAUR.js";

// src/entrypoints/index.ts
init_macros();
function hasFlag(...flags) {
  return process.argv.some((arg) => flags.includes(arg));
}
if (hasFlag("--version", "-v")) {
  process.stdout.write(`${MACRO.VERSION || ""}
`);
  process.exit(0);
}
if (hasFlag("--help-lite")) {
  process.stdout.write(
    `Usage: danya [options] [command] [prompt]

Common options:
  -h, --help           Show full help
  -v, --version        Show version
  -p, --print          Print response and exit (non-interactive)
  -c, --cwd <cwd>      Set working directory
`
  );
  process.exit(0);
}
if (hasFlag("--acp")) {
  await import("./acp-EXBBRWNU.js");
} else {
  await import("./cli-ARGKID2S.js");
}
