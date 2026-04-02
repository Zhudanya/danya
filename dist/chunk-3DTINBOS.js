import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/session/requestStatus.ts
function getRequestStatus() {
  return current;
}
function setRequestStatus(status) {
  current = { ...status, updatedAt: Date.now() };
  for (const listener of listeners) listener(current);
}
function subscribeRequestStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
var current, listeners;
var init_requestStatus = __esm({
  "src/utils/session/requestStatus.ts"() {
    current = { kind: "idle", updatedAt: Date.now() };
    listeners = /* @__PURE__ */ new Set();
  }
});

export {
  getRequestStatus,
  setRequestStatus,
  subscribeRequestStatus,
  init_requestStatus
};
