import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/text/errors.ts
var MalformedCommandError, AbortError, ConfigParseError;
var init_errors = __esm({
  "src/utils/text/errors.ts"() {
    MalformedCommandError = class extends TypeError {
    };
    AbortError = class extends Error {
    };
    ConfigParseError = class extends Error {
      filePath;
      defaultConfig;
      constructor(message, filePath, defaultConfig) {
        super(message);
        this.name = "ConfigParseError";
        this.filePath = filePath;
        this.defaultConfig = defaultConfig;
      }
    };
  }
});

export {
  MalformedCommandError,
  AbortError,
  ConfigParseError,
  init_errors
};
