import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/services/ai/llmLazy.ts
async function queryLLM(messages, systemPrompt, maxThinkingTokens, tools, signal, options) {
  const { queryLLM: inner } = await import("./llm-U3UUPOEK.js");
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
  const { queryQuick: inner } = await import("./llm-U3UUPOEK.js");
  return inner(args);
}
async function verifyApiKey(apiKey, baseURL, provider) {
  const { verifyApiKey: inner } = await import("./llm-U3UUPOEK.js");
  return inner(apiKey, baseURL, provider);
}
async function fetchAnthropicModels(apiKey, baseURL) {
  const { fetchAnthropicModels: inner } = await import("./llm-U3UUPOEK.js");
  return inner(apiKey, baseURL);
}

export {
  queryLLM,
  queryQuick,
  verifyApiKey,
  fetchAnthropicModels
};
