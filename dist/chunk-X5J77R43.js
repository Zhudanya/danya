import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/protocol/kodeAgentSessionId.ts
import { randomUUID } from "crypto";
function setDanyaAgentSessionId(nextSessionId) {
  currentSessionId = nextSessionId;
}
function resetDanyaAgentSessionIdForTests() {
  currentSessionId = randomUUID();
}
function getDanyaAgentSessionId() {
  return currentSessionId;
}
var currentSessionId;
var init_kodeAgentSessionId = __esm({
  "src/utils/protocol/kodeAgentSessionId.ts"() {
    currentSessionId = randomUUID();
  }
});

export {
  setDanyaAgentSessionId,
  resetDanyaAgentSessionIdForTests,
  getDanyaAgentSessionId,
  init_kodeAgentSessionId
};
