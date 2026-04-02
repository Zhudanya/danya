import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/session/sessionPlugins.ts
function setSessionPlugins(next) {
  sessionPlugins = next;
}
function getSessionPlugins() {
  return sessionPlugins;
}
var sessionPlugins;
var init_sessionPlugins = __esm({
  "src/utils/session/sessionPlugins.ts"() {
    sessionPlugins = [];
  }
});

export {
  setSessionPlugins,
  getSessionPlugins,
  init_sessionPlugins
};
