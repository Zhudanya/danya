import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/utils/protocol/kodeAgentSessionId.ts
import { randomUUID } from "crypto";
var currentSessionId = randomUUID();
function setDanyaAgentSessionId(nextSessionId) {
  currentSessionId = nextSessionId;
}
function resetDanyaAgentSessionIdForTests() {
  currentSessionId = randomUUID();
}
function getDanyaAgentSessionId() {
  return currentSessionId;
}

export {
  setDanyaAgentSessionId,
  resetDanyaAgentSessionIdForTests,
  getDanyaAgentSessionId
};
