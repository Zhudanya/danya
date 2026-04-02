import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/core/tools/tool.ts
function getToolDescription(tool) {
  if (tool.cachedDescription) {
    return tool.cachedDescription;
  }
  if (typeof tool.description === "string") {
    return tool.description;
  }
  return `Tool: ${tool.name}`;
}
var init_tool = __esm({
  "src/core/tools/tool.ts"() {
  }
});

export {
  getToolDescription,
  init_tool
};
