import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

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

export {
  getToolDescription
};
