import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/utils/session/sessionState.ts
var isDebug = process.argv.includes("--debug") || process.argv.includes("-d") || process.env.DEBUG === "true";
var sessionState = {
  modelErrors: {},
  currentError: null
};
function setSessionState(keyOrState, value) {
  if (typeof keyOrState === "string") {
    sessionState[keyOrState] = value;
  } else {
    Object.assign(sessionState, keyOrState);
  }
}
function getSessionState(key) {
  return key === void 0 ? sessionState : sessionState[key];
}

export {
  setSessionState,
  getSessionState
};
