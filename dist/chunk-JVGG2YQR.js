import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/utils/session/requestStatus.ts
var current = { kind: "idle", updatedAt: Date.now() };
var listeners = /* @__PURE__ */ new Set();
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

export {
  getRequestStatus,
  setRequestStatus,
  subscribeRequestStatus
};
