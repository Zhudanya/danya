import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/utils/text/errors.ts
var MalformedCommandError = class extends TypeError {
};
var AbortError = class extends Error {
};
var ConfigParseError = class extends Error {
  filePath;
  defaultConfig;
  constructor(message, filePath, defaultConfig) {
    super(message);
    this.name = "ConfigParseError";
    this.filePath = filePath;
    this.defaultConfig = defaultConfig;
  }
};

export {
  MalformedCommandError,
  AbortError,
  ConfigParseError
};
