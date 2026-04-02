import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/services/ai/llmLazy.ts
async function queryLLM(messages, systemPrompt, maxThinkingTokens, tools, signal, options) {
  const { queryLLM: inner } = await import("./llm-XJ4RSJAR.js");
  return inner(
    messages,
    systemPrompt,
    maxThinkingTokens,
    tools,
    signal,
    options
  );
}
async function queryQuick(args) {
  const { queryQuick: inner } = await import("./llm-XJ4RSJAR.js");
  return inner(args);
}
async function verifyApiKey(apiKey, baseURL, provider) {
  const { verifyApiKey: inner } = await import("./llm-XJ4RSJAR.js");
  return inner(apiKey, baseURL, provider);
}
async function fetchAnthropicModels(apiKey, baseURL) {
  const { fetchAnthropicModels: inner } = await import("./llm-XJ4RSJAR.js");
  return inner(apiKey, baseURL);
}
var init_llmLazy = __esm({
  "src/services/ai/llmLazy.ts"() {
  }
});

export {
  queryLLM,
  queryQuick,
  verifyApiKey,
  fetchAnthropicModels,
  init_llmLazy
};
