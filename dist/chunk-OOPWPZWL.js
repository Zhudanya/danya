import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/session/sessionState.ts
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
var isDebug, sessionState;
var init_sessionState = __esm({
  "src/utils/session/sessionState.ts"() {
    isDebug = process.argv.includes("--debug") || process.argv.includes("-d") || process.env.DEBUG === "true";
    sessionState = {
      modelErrors: {},
      currentError: null
    };
  }
});

export {
  setSessionState,
  getSessionState,
  init_sessionState
};
