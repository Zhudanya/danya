import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/utils/session/sessionPlugins.ts
var sessionPlugins = [];
function setSessionPlugins(next) {
  sessionPlugins = next;
}
function getSessionPlugins() {
  return sessionPlugins;
}

export {
  setSessionPlugins,
  getSessionPlugins
};
