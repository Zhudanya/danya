import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getToolDescription
} from "./chunk-DKOCP6VD.js";
import {
  processResponsesStream
} from "./chunk-6EPQRP3S.js";
import {
  formatSystemPromptWithContext,
  generateDanyaContext,
  getCLISyspromptPrefix,
  getReasoningEffort,
  models_default,
  refreshDanyaContext
} from "./chunk-YHMHHIFQ.js";
import "./chunk-ZVXACFY4.js";
import "./chunk-U5SAUK33.js";
import "./chunk-KMJTUDQT.js";
import "./chunk-6Z7EGLJB.js";
import "./chunk-HGMX7LUU.js";
import "./chunk-F4DQYOST.js";
import "./chunk-Y5LQPJWK.js";
import {
  setRequestStatus
} from "./chunk-JVGG2YQR.js";
import "./chunk-MZCZVIZO.js";
import "./chunk-U7Z4MXY4.js";
import "./chunk-CSAIELUO.js";
import {
  getCompletionWithProfile,
  getGPT5CompletionWithProfile
} from "./chunk-W5HDZPFZ.js";
import "./chunk-C6ND43BL.js";
import "./chunk-66P52YYI.js";
import "./chunk-EPA5LFNP.js";
import "./chunk-S7FJMZJQ.js";
import "./chunk-2ZWXQRFX.js";
import "./chunk-MVN3DHQF.js";
import "./chunk-XQVGT6FI.js";
import "./chunk-XEYEKVFT.js";
import "./chunk-PFTCTG5X.js";
import "./chunk-WAY3DKFO.js";
import "./chunk-2VQWLLDU.js";
import {
  API_ERROR_MESSAGE_PREFIX,
  CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE,
  INVALID_API_KEY_ERROR_MESSAGE,
  MAIN_QUERY_TEMPERATURE,
  NO_CONTENT_MESSAGE,
  PROMPT_TOO_LONG_ERROR_MESSAGE,
  createAssistantAPIErrorMessage,
  normalizeContentFromAPI
} from "./chunk-N3JEQKJM.js";
import {
  USE_BEDROCK,
  USE_VERTEX,
  getModelManager,
  getVertexRegionForModel
} from "./chunk-3IXSSL3F.js";
import "./chunk-FCXTZVJG.js";
import "./chunk-NWCMSPVL.js";
import {
  getAnthropicApiKey,
  getGlobalConfig
} from "./chunk-CEARH7HF.js";
import "./chunk-HIIHGKXP.js";
import {
  debug,
  getCurrentRequest,
  logErrorWithDiagnosis,
  logLLMInteraction,
  logSystemPromptConstruction,
  markPhase
} from "./chunk-VUWBPLA2.js";
import {
  PRODUCT_COMMAND,
  env,
  getCwd,
  init_env,
  init_log,
  init_product,
  init_state,
  logError
} from "./chunk-OPC7BAW5.js";
import {
  MACRO,
  init_macros
} from "./chunk-NYT5K544.js";
import {
  addToTotalCost
} from "./chunk-LWXT5RGE.js";
import "./chunk-M3TKNAUR.js";

// src/services/ai/llm.ts
import "@anthropic-ai/sdk/shims/node";
import Anthropic, { APIConnectionError, APIError } from "@anthropic-ai/sdk";
import chalk from "chalk";
import { randomUUID } from "crypto";
import "dotenv/config";
init_log();

// src/utils/system/http.ts
init_macros();
init_product();
var USER_AGENT = `${PRODUCT_COMMAND}/${MACRO.VERSION} (${process.env.USER_TYPE})`;

// src/services/system/vcr.ts
init_env();
init_state();
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { existsSync } from "fs";
import * as path from "path";
import { mapValues } from "lodash-es";
async function withVCR(messages, f) {
  if (process.env.NODE_ENV !== "test") {
    return await f();
  }
  const dehydratedInput = mapMessages(
    messages.map((_) => _.message.content),
    dehydrateValue
  );
  const filename = `./fixtures/${dehydratedInput.map((_) => createHash("sha1").update(JSON.stringify(_)).digest("hex").slice(0, 6)).join("-")}.json`;
  if (existsSync(filename)) {
    const cached = JSON.parse(readFileSync(filename, "utf-8"));
    return mapAssistantMessage(cached.output, hydrateValue);
  }
  if (env.isCI) {
    process.stderr.write(
      `Anthropic API fixture missing. Re-run bun test locally, then commit the result. ${JSON.stringify({ input: dehydratedInput }, null, 2)}
`
    );
  }
  const result = await f();
  if (env.isCI) {
    return result;
  }
  if (!existsSync(dirname(filename))) {
    mkdirSync(dirname(filename), { recursive: true });
  }
  writeFileSync(
    filename,
    JSON.stringify(
      {
        input: dehydratedInput,
        output: mapAssistantMessage(result, dehydrateValue)
      },
      null,
      2
    )
  );
  return result;
}
function mapMessages(messages, f) {
  return messages.map((_) => {
    if (typeof _ === "string") {
      return f(_);
    }
    return _.map((_2) => {
      switch (_2.type) {
        case "tool_result":
          if (typeof _2.content === "string") {
            return { ..._2, content: f(_2.content) };
          }
          if (Array.isArray(_2.content)) {
            return {
              ..._2,
              content: _2.content.map((_3) => {
                switch (_3.type) {
                  case "text":
                    return { ..._3, text: f(_3.text) };
                  case "image":
                    return _3;
                }
              })
            };
          }
          return _2;
        case "text":
          return { ..._2, text: f(_2.text) };
        case "tool_use":
          return {
            ..._2,
            input: mapValues(_2.input, f)
          };
        case "image":
          return _2;
      }
    });
  });
}
function mapAssistantMessage(message, f) {
  return {
    durationMs: "DURATION",
    costUSD: "COST",
    uuid: "UUID",
    message: {
      ...message.message,
      content: message.message.content.map((_) => {
        switch (_.type) {
          case "text":
            return {
              ..._,
              text: f(_.text),
              citations: _.citations || []
            };
          case "tool_use":
            return {
              ..._,
              input: mapValues(_.input, f)
            };
          default:
            return _;
        }
      }).filter(Boolean)
    },
    type: "assistant"
  };
}
function dehydrateValue(s) {
  if (typeof s !== "string") {
    return s;
  }
  const s1 = s.replace(/num_files="\d+"/g, 'num_files="[NUM]"').replace(/duration_ms="\d+"/g, 'duration_ms="[DURATION]"').replace(/cost_usd="\d+"/g, 'cost_usd="[COST]"').replace(/\//g, path.sep).replaceAll(getCwd(), "[CWD]");
  if (s1.includes("Files modified by user:")) {
    return "Files modified by user: [FILES]";
  }
  return s1;
}
function hydrateValue(s) {
  if (typeof s !== "string") {
    return s;
  }
  return s.replaceAll("[NUM]", "1").replaceAll("[DURATION]", "100").replaceAll("[CWD]", getCwd());
}

// src/services/ai/llm.ts
import { zodToJsonSchema as zodToJsonSchema4 } from "zod-to-json-schema";

// src/services/ai/adapters/base.ts
function normalizeTokens(apiResponse) {
  if (!apiResponse || typeof apiResponse !== "object") {
    return { input: 0, output: 0 };
  }
  const input = Number(
    apiResponse.prompt_tokens ?? apiResponse.input_tokens ?? apiResponse.promptTokens
  ) || 0;
  const output = Number(
    apiResponse.completion_tokens ?? apiResponse.output_tokens ?? apiResponse.completionTokens
  ) || 0;
  const total = Number(apiResponse.total_tokens ?? apiResponse.totalTokens) || void 0;
  const reasoning = Number(apiResponse.reasoning_tokens ?? apiResponse.reasoningTokens) || void 0;
  return {
    input,
    output,
    total: total && total > 0 ? total : void 0,
    reasoning: reasoning && reasoning > 0 ? reasoning : void 0
  };
}
var ModelAPIAdapter = class {
  constructor(capabilities, modelProfile) {
    this.capabilities = capabilities;
    this.modelProfile = modelProfile;
  }
  cumulativeUsage = { input: 0, output: 0 };
  async *parseStreamingResponse(response, signal) {
    return;
    yield;
  }
  resetCumulativeUsage() {
    this.cumulativeUsage = { input: 0, output: 0 };
  }
  updateCumulativeUsage(usage) {
    this.cumulativeUsage.input += usage.input;
    this.cumulativeUsage.output += usage.output;
    if (usage.total) {
      this.cumulativeUsage.total = (this.cumulativeUsage.total || 0) + usage.total;
    }
    if (usage.reasoning) {
      this.cumulativeUsage.reasoning = (this.cumulativeUsage.reasoning || 0) + usage.reasoning;
    }
  }
  getMaxTokensParam() {
    return this.capabilities.parameters.maxTokensField;
  }
  getTemperature() {
    if (this.capabilities.parameters.temperatureMode === "fixed_one") {
      return 1;
    }
    if (this.capabilities.parameters.temperatureMode === "restricted") {
      return Math.min(1, 0.7);
    }
    return 0.7;
  }
  shouldIncludeReasoningEffort() {
    return this.capabilities.parameters.supportsReasoningEffort;
  }
  shouldIncludeVerbosity() {
    return this.capabilities.parameters.supportsVerbosity;
  }
};

// src/services/ai/adapters/openaiAdapter.ts
import { zodToJsonSchema } from "zod-to-json-schema";
init_log();
var OpenAIAdapter = class extends ModelAPIAdapter {
  constructor(capabilities, modelProfile) {
    super(capabilities, modelProfile);
  }
  async parseResponse(response) {
    if (response?.body instanceof ReadableStream) {
      const { assistantMessage } = await this.parseStreamingOpenAIResponse(response);
      return {
        id: assistantMessage.responseId,
        content: assistantMessage.message.content,
        toolCalls: assistantMessage.message.content.filter((block) => block.type === "tool_use").map((block) => ({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input)
          }
        })),
        usage: this.normalizeUsageForAdapter(assistantMessage.message.usage),
        responseId: assistantMessage.responseId
      };
    }
    return this.parseNonStreamingResponse(response);
  }
  async *parseStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let responseId = response.id || `openai_${Date.now()}`;
    let hasStarted = false;
    let accumulatedContent = "";
    const reasoningContext = {
      thinkOpen: false,
      thinkClosed: false,
      sawAnySummary: false,
      pendingSummaryParagraph: false
    };
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.trim()) {
            const parsed = this.parseSSEChunk(line);
            if (parsed) {
              if (parsed.id) {
                responseId = parsed.id;
              }
              yield* this.processStreamingChunk(
                parsed,
                responseId,
                hasStarted,
                accumulatedContent,
                reasoningContext
              );
              const stateUpdate = this.updateStreamingState(
                parsed,
                accumulatedContent
              );
              if (stateUpdate.content) accumulatedContent = stateUpdate.content;
              if (stateUpdate.hasStarted) hasStarted = true;
            }
          }
        }
      }
    } catch (error) {
      logError(error);
      debug.warn("OPENAI_ADAPTER_STREAM_READ_ERROR", {
        error: error instanceof Error ? error.message : String(error)
      });
      yield {
        type: "error",
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      reader.releaseLock();
    }
    const finalContent = accumulatedContent ? [{ type: "text", text: accumulatedContent, citations: [] }] : [{ type: "text", text: "", citations: [] }];
    yield {
      type: "message_stop",
      message: {
        id: responseId,
        role: "assistant",
        content: finalContent,
        responseId
      }
    };
  }
  parseSSEChunk(line) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        return null;
      }
      if (data) {
        try {
          return JSON.parse(data);
        } catch (error) {
          logError(error);
          debug.warn("OPENAI_ADAPTER_SSE_PARSE_ERROR", {
            error: error instanceof Error ? error.message : String(error)
          });
          return null;
        }
      }
    }
    return null;
  }
  handleTextDelta(delta, responseId, hasStarted) {
    const events = [];
    if (!hasStarted && delta) {
      events.push({
        type: "message_start",
        message: {
          role: "assistant",
          content: []
        },
        responseId
      });
    }
    if (delta) {
      events.push({
        type: "text_delta",
        delta,
        responseId
      });
    }
    return events;
  }
  normalizeUsageForAdapter(usage) {
    if (!usage) {
      return {
        input_tokens: 0,
        output_tokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        reasoningTokens: 0
      };
    }
    const inputTokens = usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokens ?? 0;
    const outputTokens = usage.output_tokens ?? usage.completion_tokens ?? usage.completionTokens ?? 0;
    return {
      ...usage,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens: usage.totalTokens ?? inputTokens + outputTokens,
      reasoningTokens: usage.reasoningTokens ?? 0
    };
  }
  buildTools(tools) {
    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: getToolDescription(tool),
        parameters: zodToJsonSchema(tool.inputSchema)
      }
    }));
  }
};

// src/services/ai/adapters/responsesAPI.ts
import { zodToJsonSchema as zodToJsonSchema2 } from "zod-to-json-schema";
init_log();
var ResponsesAPIAdapter = class extends OpenAIAdapter {
  createRequest(params) {
    const {
      messages,
      systemPrompt,
      tools,
      maxTokens,
      reasoningEffort,
      stopSequences
    } = params;
    const request = {
      model: this.modelProfile.modelName,
      input: this.convertMessagesToInput(messages),
      instructions: this.buildInstructions(systemPrompt)
    };
    const maxTokensField = this.getMaxTokensParam();
    request[maxTokensField] = maxTokens;
    if (stopSequences && stopSequences.length > 0) {
      request.stop = stopSequences;
    }
    request.stream = params.stream !== false && this.capabilities.streaming.supported;
    const temperature = this.getTemperature();
    if (temperature !== void 0) {
      request.temperature = temperature;
    }
    const include = [];
    if (this.capabilities.parameters.supportsReasoningEffort && (this.shouldIncludeReasoningEffort() || reasoningEffort)) {
      include.push("reasoning.encrypted_content");
      request.reasoning = {
        effort: reasoningEffort || this.modelProfile.reasoningEffort || "medium"
      };
    }
    if (this.capabilities.parameters.supportsVerbosity && this.shouldIncludeVerbosity()) {
      let defaultVerbosity = "medium";
      if (params.verbosity) {
        defaultVerbosity = params.verbosity;
      } else {
        const modelNameLower = this.modelProfile.modelName.toLowerCase();
        if (modelNameLower.includes("high")) {
          defaultVerbosity = "high";
        } else if (modelNameLower.includes("low")) {
          defaultVerbosity = "low";
        }
      }
      request.text = {
        verbosity: defaultVerbosity
      };
    }
    if (tools && tools.length > 0) {
      request.tools = this.buildTools(tools);
    }
    request.tool_choice = "auto";
    if (this.capabilities.toolCalling.supportsParallelCalls) {
      request.parallel_tool_calls = true;
    }
    request.store = false;
    if (params.previousResponseId && this.capabilities.stateManagement.supportsPreviousResponseId) {
      request.previous_response_id = params.previousResponseId;
    }
    if (include.length > 0) {
      request.include = include;
    }
    return request;
  }
  buildTools(tools) {
    return tools.map((tool) => {
      let parameters = tool.inputJSONSchema;
      if (!parameters && tool.inputSchema) {
        const isPlainObject = (obj) => {
          return obj !== null && typeof obj === "object" && !Array.isArray(obj);
        };
        if (isPlainObject(tool.inputSchema) && ("type" in tool.inputSchema || "properties" in tool.inputSchema)) {
          parameters = tool.inputSchema;
        } else {
          try {
            parameters = zodToJsonSchema2(tool.inputSchema);
          } catch (error) {
            logError(error);
            debug.warn("RESPONSES_API_TOOL_SCHEMA_CONVERSION_FAILED", {
              toolName: tool.name,
              error: error instanceof Error ? error.message : String(error)
            });
            parameters = { type: "object", properties: {} };
          }
        }
      }
      return {
        type: "function",
        name: tool.name,
        description: getToolDescription(tool),
        parameters: parameters || { type: "object", properties: {} }
      };
    });
  }
  async parseResponse(response) {
    if (response?.body instanceof ReadableStream) {
      const { assistantMessage } = await processResponsesStream(
        this.parseStreamingResponse(response),
        Date.now(),
        response.id ?? `resp_${Date.now()}`
      );
      const hasToolUseBlocks = assistantMessage.message.content.some(
        (block) => block.type === "tool_use"
      );
      return {
        id: assistantMessage.responseId,
        content: assistantMessage.message.content,
        toolCalls: hasToolUseBlocks ? [] : [],
        usage: this.normalizeUsageForAdapter(assistantMessage.message.usage),
        responseId: assistantMessage.responseId
      };
    }
    return this.parseNonStreamingResponse(response);
  }
  parseNonStreamingResponse(response) {
    let content = response.output_text || "";
    let reasoningContent = "";
    if (response.output && Array.isArray(response.output)) {
      const messageItems = response.output.filter(
        (item) => item.type === "message"
      );
      if (messageItems.length > 0) {
        content = messageItems.map((item) => {
          if (item.content && Array.isArray(item.content)) {
            return item.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
          }
          return item.content || "";
        }).filter(Boolean).join("\n\n");
      }
      const reasoningItems = response.output.filter(
        (item) => item.type === "reasoning"
      );
      if (reasoningItems.length > 0) {
        reasoningContent = reasoningItems.map((item) => item.content || "").filter(Boolean).join("\n\n");
      }
    }
    if (reasoningContent) {
      const thinkBlock = `

${reasoningContent}

`;
      content = thinkBlock + content;
    }
    const toolCalls = this.parseToolCalls(response);
    const contentArray = content ? [{ type: "text", text: content, citations: [] }] : [{ type: "text", text: "", citations: [] }];
    const promptTokens = response.usage?.input_tokens || 0;
    const completionTokens = response.usage?.output_tokens || 0;
    const totalTokens = response.usage?.total_tokens ?? promptTokens + completionTokens;
    return {
      id: response.id || `resp_${Date.now()}`,
      content: contentArray,
      toolCalls,
      usage: {
        promptTokens,
        completionTokens,
        reasoningTokens: response.usage?.output_tokens_details?.reasoning_tokens
      },
      responseId: response.id
    };
  }
  async *processStreamingChunk(parsed, responseId, hasStarted, accumulatedContent, reasoningContext) {
    if (parsed.type === "response.reasoning_summary_part.added") {
      const partIndex = parsed.summary_index || 0;
      if (!reasoningContext?.thinkingContent) {
        reasoningContext.thinkingContent = "";
        reasoningContext.currentPartIndex = -1;
      }
      reasoningContext.currentPartIndex = partIndex;
      if (partIndex > 0 && reasoningContext.thinkingContent) {
        reasoningContext.thinkingContent += "\n\n";
        yield {
          type: "text_delta",
          delta: "\n\n",
          responseId
        };
      }
      return;
    }
    if (parsed.type === "response.reasoning_summary_text.delta") {
      const delta = parsed.delta || "";
      if (delta && reasoningContext) {
        reasoningContext.thinkingContent += delta;
        yield {
          type: "text_delta",
          delta,
          responseId
        };
      }
      return;
    }
    if (parsed.type === "response.reasoning_text.delta") {
      const delta = parsed.delta || "";
      if (delta && reasoningContext) {
        reasoningContext.thinkingContent += delta;
        yield {
          type: "text_delta",
          delta,
          responseId
        };
      }
      return;
    }
    if (parsed.type === "response.output_text.delta") {
      const delta = parsed.delta || "";
      if (delta) {
        const textEvents = this.handleTextDelta(delta, responseId, hasStarted);
        for (const event of textEvents) {
          yield event;
        }
      }
    }
    if (parsed.type === "response.output_item.done") {
      const item = parsed.item || {};
      if (item.type === "function_call") {
        const callId = item.call_id || item.id;
        const name = item.name;
        const args = item.arguments;
        if (typeof callId === "string" && typeof name === "string" && typeof args === "string") {
          yield {
            type: "tool_request",
            tool: {
              id: callId,
              name,
              input: args
            }
          };
        }
      }
    }
    if (parsed.usage) {
      const normalizedUsage = normalizeTokens(parsed.usage);
      if (parsed.usage.output_tokens_details?.reasoning_tokens) {
        normalizedUsage.reasoning = parsed.usage.output_tokens_details.reasoning_tokens;
      }
      yield {
        type: "usage",
        usage: normalizedUsage
      };
    }
  }
  updateStreamingState(parsed, accumulatedContent) {
    const state = {};
    if (parsed.type === "response.output_text.delta" && parsed.delta) {
      state.content = accumulatedContent + parsed.delta;
      state.hasStarted = true;
    }
    return state;
  }
  async parseStreamingOpenAIResponse(response) {
    const { processResponsesStream: processResponsesStream2 } = await import("./responsesStreaming-L2BSN37C.js");
    return await processResponsesStream2(
      this.parseStreamingResponse(response),
      Date.now(),
      response.id ?? `resp_${Date.now()}`
    );
  }
  normalizeUsageForAdapter(usage) {
    const baseUsage = super.normalizeUsageForAdapter(usage);
    return {
      ...baseUsage,
      reasoningTokens: usage?.output_tokens_details?.reasoning_tokens ?? 0
    };
  }
  convertMessagesToInput(messages) {
    const inputItems = [];
    for (const message of messages) {
      const role = message.role;
      if (role === "tool") {
        const callId = message.tool_call_id || message.id;
        if (typeof callId === "string" && callId) {
          let content2 = message.content || "";
          if (Array.isArray(content2)) {
            const texts = [];
            for (const part of content2) {
              if (typeof part === "object" && part !== null) {
                const t = part.text || part.content;
                if (typeof t === "string" && t) {
                  texts.push(t);
                }
              }
            }
            content2 = texts.join("\n");
          }
          if (typeof content2 === "string") {
            inputItems.push({
              type: "function_call_output",
              call_id: callId,
              output: content2
            });
          }
        }
        continue;
      }
      if (role === "assistant" && Array.isArray(message.tool_calls)) {
        for (const tc of message.tool_calls) {
          if (typeof tc !== "object" || tc === null) {
            continue;
          }
          const tcType = tc.type || "function";
          if (tcType !== "function") {
            continue;
          }
          const callId = tc.id || tc.call_id;
          const fn = tc.function;
          const name = typeof fn === "object" && fn !== null ? fn.name : null;
          const args = typeof fn === "object" && fn !== null ? fn.arguments : null;
          if (typeof callId === "string" && typeof name === "string" && typeof args === "string") {
            inputItems.push({
              type: "function_call",
              name,
              arguments: args,
              call_id: callId
            });
          }
        }
        continue;
      }
      const content = message.content || "";
      const contentItems = [];
      if (Array.isArray(content)) {
        for (const part of content) {
          if (typeof part !== "object" || part === null) continue;
          const ptype = part.type;
          if (ptype === "text") {
            const text = part.text || part.content || "";
            if (typeof text === "string" && text) {
              const kind = role === "assistant" ? "output_text" : "input_text";
              contentItems.push({ type: kind, text });
            }
          } else if (ptype === "image_url") {
            const image = part.image_url;
            const url = typeof image === "object" && image !== null ? image.url : image;
            if (typeof url === "string" && url) {
              contentItems.push({ type: "input_image", image_url: url });
            }
          }
        }
      } else if (typeof content === "string" && content) {
        const kind = role === "assistant" ? "output_text" : "input_text";
        contentItems.push({ type: kind, text: content });
      }
      if (contentItems.length) {
        const roleOut = role === "assistant" ? "assistant" : "user";
        inputItems.push({
          type: "message",
          role: roleOut,
          content: contentItems
        });
      }
    }
    return inputItems;
  }
  buildInstructions(systemPrompt) {
    const systemContent = systemPrompt.filter((content) => content.trim()).join("\n\n");
    return systemContent;
  }
  parseToolCalls(response) {
    if (!response.output || !Array.isArray(response.output)) {
      return [];
    }
    const toolCalls = [];
    for (const item of response.output) {
      if (item.type === "function_call") {
        const callId = item.call_id || item.id;
        const name = item.name || "";
        const args = item.arguments || "{}";
        if (typeof callId === "string" && typeof name === "string" && typeof args === "string") {
          toolCalls.push({
            id: callId,
            type: "function",
            function: {
              name,
              arguments: args
            }
          });
        }
      } else if (item.type === "tool_call") {
        const callId = item.id || `tool_${Math.random().toString(36).substring(2, 15)}`;
        toolCalls.push({
          id: callId,
          type: "tool_call",
          name: item.name,
          arguments: item.arguments
        });
      }
    }
    return toolCalls;
  }
  applyReasoningToMessage(message, reasoningSummaryText, reasoningFullText) {
    const rtxtParts = [];
    if (typeof reasoningSummaryText === "string" && reasoningSummaryText.trim()) {
      rtxtParts.push(reasoningSummaryText);
    }
    if (typeof reasoningFullText === "string" && reasoningFullText.trim()) {
      rtxtParts.push(reasoningFullText);
    }
    const rtxt = rtxtParts.filter((p) => p).join("\n\n");
    if (rtxt) {
      const thinkBlock = `<think>
${rtxt}
</think>
`;
      const contentText = message.content || "";
      message.content = thinkBlock + (typeof contentText === "string" ? contentText : "");
    }
    return message;
  }
};

// src/services/ai/adapters/chatCompletions.ts
import { zodToJsonSchema as zodToJsonSchema3 } from "zod-to-json-schema";
var ChatCompletionsAdapter = class extends OpenAIAdapter {
  createRequest(params) {
    const { messages, systemPrompt, tools, maxTokens, stream } = params;
    const fullMessages = this.buildMessages(systemPrompt, messages);
    const request = {
      model: this.modelProfile.modelName,
      messages: fullMessages,
      [this.getMaxTokensParam()]: maxTokens,
      temperature: this.getTemperature()
    };
    if (tools && tools.length > 0) {
      request.tools = this.buildTools(tools);
      request.tool_choice = "auto";
    }
    if (this.capabilities.parameters.supportsReasoningEffort && params.reasoningEffort) {
      request.reasoning_effort = params.reasoningEffort;
    }
    if (this.capabilities.parameters.supportsVerbosity && params.verbosity) {
      request.verbosity = params.verbosity;
    }
    if (stream && this.capabilities.streaming.supported) {
      request.stream = true;
      if (this.capabilities.streaming.includesUsage) {
        request.stream_options = {
          include_usage: true
        };
      }
    }
    if (this.capabilities.parameters.temperatureMode === "fixed_one") {
      delete request.temperature;
    }
    if (!this.capabilities.streaming.supported) {
      delete request.stream;
      delete request.stream_options;
    }
    return request;
  }
  buildTools(tools) {
    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: getToolDescription(tool),
        parameters: tool.inputJSONSchema || zodToJsonSchema3(tool.inputSchema)
      }
    }));
  }
  parseNonStreamingResponse(response) {
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response: response must be an object");
    }
    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error("Invalid response: no choices found in response");
    }
    const message = choice.message || {};
    const content = typeof message.content === "string" ? message.content : "";
    const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
    const usage = response.usage || {};
    const promptTokens = Number(usage.prompt_tokens) || 0;
    const completionTokens = Number(usage.completion_tokens) || 0;
    return {
      id: response.id || `chatcmpl_${Date.now()}`,
      content,
      toolCalls,
      usage: {
        promptTokens,
        completionTokens
      }
    };
  }
  buildMessages(systemPrompt, messages) {
    const systemMessages = systemPrompt.map((prompt) => ({
      role: "system",
      content: prompt
    }));
    const normalizedMessages = this.normalizeToolMessages(messages);
    return [...systemMessages, ...normalizedMessages];
  }
  normalizeToolMessages(messages) {
    if (!Array.isArray(messages)) {
      return [];
    }
    return messages.map((msg) => {
      if (!msg || typeof msg !== "object") {
        return msg;
      }
      if (msg.role === "tool") {
        if (Array.isArray(msg.content)) {
          return {
            ...msg,
            content: msg.content.map((c) => c?.text || "").filter(Boolean).join("\n\n") || "(empty content)"
          };
        } else if (typeof msg.content !== "string") {
          return {
            ...msg,
            content: msg.content === null || msg.content === void 0 ? "(empty content)" : JSON.stringify(msg.content)
          };
        }
      }
      return msg;
    });
  }
  async *processStreamingChunk(parsed, responseId, hasStarted, accumulatedContent, reasoningContext) {
    if (!parsed || typeof parsed !== "object") {
      return;
    }
    const choice = parsed.choices?.[0];
    if (choice?.delta && typeof choice.delta === "object") {
      const delta = typeof choice.delta.content === "string" ? choice.delta.content : "";
      const reasoningDelta = typeof choice.delta.reasoning_content === "string" ? choice.delta.reasoning_content : "";
      const fullDelta = delta + reasoningDelta;
      if (fullDelta) {
        const textEvents = this.handleTextDelta(
          fullDelta,
          responseId,
          hasStarted
        );
        for (const event of textEvents) {
          yield event;
        }
      }
    }
    if (choice?.delta?.tool_calls && Array.isArray(choice.delta.tool_calls)) {
      for (const toolCall of choice.delta.tool_calls) {
        if (toolCall && typeof toolCall === "object") {
          yield {
            type: "tool_request",
            tool: {
              id: toolCall.id || `tool_${Date.now()}`,
              name: toolCall.function?.name || "unknown",
              input: toolCall.function?.arguments || "{}"
            }
          };
        }
      }
    }
    if (parsed.usage && typeof parsed.usage === "object") {
      const normalizedUsage = normalizeTokens(parsed.usage);
      this.updateCumulativeUsage(normalizedUsage);
      yield {
        type: "usage",
        usage: { ...this.cumulativeUsage }
      };
    }
  }
  updateStreamingState(parsed, accumulatedContent) {
    const state = {};
    const choice = parsed.choices?.[0];
    if (choice?.delta) {
      const delta = choice.delta.content || "";
      const reasoningDelta = choice.delta.reasoning_content || "";
      const fullDelta = delta + reasoningDelta;
      if (fullDelta) {
        state.content = accumulatedContent + fullDelta;
        state.hasStarted = true;
      }
    }
    return state;
  }
  async parseStreamingOpenAIResponse(response, signal) {
    const contentBlocks = [];
    const usage = {
      prompt_tokens: 0,
      completion_tokens: 0
    };
    let responseId = response.id || `chatcmpl_${Date.now()}`;
    const pendingToolCalls = [];
    let hasMarkedStreaming = false;
    try {
      this.resetCumulativeUsage();
      for await (const event of this.parseStreamingResponse(response)) {
        if (signal?.aborted) {
          throw new Error("Stream aborted by user");
        }
        if (event.type === "message_start") {
          responseId = event.responseId || responseId;
          continue;
        }
        if (event.type === "text_delta") {
          if (!hasMarkedStreaming) {
            setRequestStatus({ kind: "streaming" });
            hasMarkedStreaming = true;
          }
          const last = contentBlocks[contentBlocks.length - 1];
          if (!last || last.type !== "text") {
            contentBlocks.push({
              type: "text",
              text: event.delta,
              citations: []
            });
          } else {
            last.text += event.delta;
          }
          continue;
        }
        if (event.type === "tool_request") {
          setRequestStatus({ kind: "tool", detail: event.tool?.name });
          pendingToolCalls.push(event.tool);
          continue;
        }
        if (event.type === "usage") {
          usage.prompt_tokens = event.usage.input;
          usage.completion_tokens = event.usage.output;
          usage.totalTokens = event.usage.total ?? event.usage.input + event.usage.output;
          usage.promptTokens = event.usage.input;
          usage.completionTokens = event.usage.output;
          continue;
        }
      }
    } catch (error) {
      if (signal?.aborted) {
        const assistantMessage2 = {
          type: "assistant",
          message: {
            role: "assistant",
            content: contentBlocks,
            usage: {
              input_tokens: usage.prompt_tokens ?? 0,
              output_tokens: usage.completion_tokens ?? 0,
              prompt_tokens: usage.prompt_tokens ?? 0,
              completion_tokens: usage.completion_tokens ?? 0,
              totalTokens: (usage.prompt_tokens || 0) + (usage.completion_tokens || 0)
            }
          },
          costUSD: 0,
          durationMs: Date.now() - Date.now(),
          uuid: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          responseId
        };
        return {
          assistantMessage: assistantMessage2,
          rawResponse: {
            id: responseId,
            content: contentBlocks,
            usage,
            aborted: true
          }
        };
      }
      throw error;
    }
    for (const toolCall of pendingToolCalls) {
      let toolArgs = {};
      try {
        toolArgs = toolCall.input ? JSON.parse(toolCall.input) : {};
      } catch {
      }
      contentBlocks.push({
        type: "tool_use",
        id: toolCall.id,
        name: toolCall.name,
        input: toolArgs
      });
    }
    const assistantMessage = {
      type: "assistant",
      message: {
        role: "assistant",
        content: contentBlocks,
        usage: {
          input_tokens: usage.prompt_tokens ?? 0,
          output_tokens: usage.completion_tokens ?? 0,
          prompt_tokens: usage.prompt_tokens ?? 0,
          completion_tokens: usage.completion_tokens ?? 0,
          totalTokens: usage.totalTokens ?? (usage.prompt_tokens || 0) + (usage.completion_tokens || 0)
        }
      },
      costUSD: 0,
      durationMs: Date.now() - Date.now(),
      uuid: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      responseId
    };
    return {
      assistantMessage,
      rawResponse: {
        id: responseId,
        content: contentBlocks,
        usage
      }
    };
  }
  normalizeUsageForAdapter(usage) {
    return super.normalizeUsageForAdapter(usage);
  }
};

// src/constants/modelCapabilities.ts
var GPT5_CAPABILITIES = {
  apiArchitecture: {
    primary: "responses_api",
    fallback: "chat_completions"
  },
  parameters: {
    maxTokensField: "max_output_tokens",
    supportsReasoningEffort: true,
    supportsVerbosity: true,
    temperatureMode: "fixed_one"
  },
  toolCalling: {
    mode: "custom_tools",
    supportsFreeform: true,
    supportsAllowedTools: true,
    supportsParallelCalls: true
  },
  stateManagement: {
    supportsResponseId: true,
    supportsConversationChaining: true,
    supportsPreviousResponseId: true
  },
  streaming: {
    supported: true,
    includesUsage: true
  }
};
var CHAT_COMPLETIONS_CAPABILITIES = {
  apiArchitecture: {
    primary: "chat_completions"
  },
  parameters: {
    maxTokensField: "max_tokens",
    supportsReasoningEffort: false,
    supportsVerbosity: false,
    temperatureMode: "flexible"
  },
  toolCalling: {
    mode: "function_calling",
    supportsFreeform: false,
    supportsAllowedTools: false,
    supportsParallelCalls: true
  },
  stateManagement: {
    supportsResponseId: false,
    supportsConversationChaining: false,
    supportsPreviousResponseId: false
  },
  streaming: {
    supported: true,
    includesUsage: true
  }
};
var MODEL_CAPABILITIES_REGISTRY = {
  "gpt-5": GPT5_CAPABILITIES,
  "gpt-5-mini": GPT5_CAPABILITIES,
  "gpt-5-nano": GPT5_CAPABILITIES,
  "gpt-5-chat-latest": GPT5_CAPABILITIES,
  "gpt-5-reasoning": GPT5_CAPABILITIES,
  "gpt-4o": CHAT_COMPLETIONS_CAPABILITIES,
  "gpt-4o-mini": CHAT_COMPLETIONS_CAPABILITIES,
  "gpt-4-turbo": CHAT_COMPLETIONS_CAPABILITIES,
  "gpt-4": CHAT_COMPLETIONS_CAPABILITIES,
  "claude-3-5-sonnet-20241022": CHAT_COMPLETIONS_CAPABILITIES,
  "claude-3-5-haiku-20241022": CHAT_COMPLETIONS_CAPABILITIES,
  "claude-3-opus-20240229": CHAT_COMPLETIONS_CAPABILITIES,
  o1: {
    ...CHAT_COMPLETIONS_CAPABILITIES,
    parameters: {
      ...CHAT_COMPLETIONS_CAPABILITIES.parameters,
      maxTokensField: "max_completion_tokens",
      temperatureMode: "fixed_one"
    }
  },
  "o1-mini": {
    ...CHAT_COMPLETIONS_CAPABILITIES,
    parameters: {
      ...CHAT_COMPLETIONS_CAPABILITIES.parameters,
      maxTokensField: "max_completion_tokens",
      temperatureMode: "fixed_one"
    }
  },
  "o1-preview": {
    ...CHAT_COMPLETIONS_CAPABILITIES,
    parameters: {
      ...CHAT_COMPLETIONS_CAPABILITIES.parameters,
      maxTokensField: "max_completion_tokens",
      temperatureMode: "fixed_one"
    }
  }
};
function inferModelCapabilities(modelName) {
  if (!modelName) return null;
  const lowerName = modelName.toLowerCase();
  if (lowerName.includes("gpt-5") || lowerName.includes("gpt5")) {
    return GPT5_CAPABILITIES;
  }
  if (lowerName.includes("gpt-6") || lowerName.includes("gpt6")) {
    return {
      ...GPT5_CAPABILITIES,
      streaming: { supported: true, includesUsage: true }
    };
  }
  if (lowerName.includes("glm-5") || lowerName.includes("glm5")) {
    return {
      ...CHAT_COMPLETIONS_CAPABILITIES,
      toolCalling: {
        ...CHAT_COMPLETIONS_CAPABILITIES.toolCalling,
        supportsAllowedTools: false
      }
    };
  }
  if (lowerName.startsWith("o1") || lowerName.includes("o1-")) {
    return {
      ...CHAT_COMPLETIONS_CAPABILITIES,
      parameters: {
        ...CHAT_COMPLETIONS_CAPABILITIES.parameters,
        maxTokensField: "max_completion_tokens",
        temperatureMode: "fixed_one"
      }
    };
  }
  return null;
}
var capabilityCache = /* @__PURE__ */ new Map();
function getModelCapabilities(modelName) {
  if (capabilityCache.has(modelName)) {
    return capabilityCache.get(modelName);
  }
  if (MODEL_CAPABILITIES_REGISTRY[modelName]) {
    const capabilities = MODEL_CAPABILITIES_REGISTRY[modelName];
    capabilityCache.set(modelName, capabilities);
    return capabilities;
  }
  const inferred = inferModelCapabilities(modelName);
  if (inferred) {
    capabilityCache.set(modelName, inferred);
    return inferred;
  }
  const defaultCapabilities = CHAT_COMPLETIONS_CAPABILITIES;
  capabilityCache.set(modelName, defaultCapabilities);
  return defaultCapabilities;
}

// src/services/ai/modelAdapterFactory.ts
var ModelAdapterFactory = class {
  static createAdapter(modelProfile) {
    const capabilities = getModelCapabilities(modelProfile.modelName);
    const apiType = this.determineAPIType(modelProfile, capabilities);
    switch (apiType) {
      case "responses_api":
        return new ResponsesAPIAdapter(capabilities, modelProfile);
      case "chat_completions":
      default:
        return new ChatCompletionsAdapter(capabilities, modelProfile);
    }
  }
  static determineAPIType(modelProfile, capabilities) {
    if (capabilities.apiArchitecture.primary !== "responses_api") {
      return "chat_completions";
    }
    const isOfficialOpenAI = !modelProfile.baseURL || modelProfile.baseURL.includes("api.openai.com");
    if (!isOfficialOpenAI) {
      if (capabilities.apiArchitecture.fallback === "chat_completions") {
        return capabilities.apiArchitecture.primary;
      }
      return capabilities.apiArchitecture.primary;
    }
    return capabilities.apiArchitecture.primary;
  }
  static shouldUseResponsesAPI(modelProfile) {
    const capabilities = getModelCapabilities(modelProfile.modelName);
    const apiType = this.determineAPIType(modelProfile, capabilities);
    return apiType === "responses_api";
  }
};

// src/services/ai/responseStateManager.ts
var ResponseStateManager = class {
  conversationStates = /* @__PURE__ */ new Map();
  CLEANUP_INTERVAL = 60 * 60 * 1e3;
  constructor() {
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }
  setPreviousResponseId(conversationId, responseId) {
    this.conversationStates.set(conversationId, {
      previousResponseId: responseId,
      lastUpdate: Date.now()
    });
  }
  getPreviousResponseId(conversationId) {
    const state = this.conversationStates.get(conversationId);
    if (state) {
      state.lastUpdate = Date.now();
      return state.previousResponseId;
    }
    return void 0;
  }
  clearConversation(conversationId) {
    this.conversationStates.delete(conversationId);
  }
  clearAll() {
    this.conversationStates.clear();
  }
  cleanup() {
    const now = Date.now();
    for (const [conversationId, state] of this.conversationStates.entries()) {
      if (now - state.lastUpdate > this.CLEANUP_INTERVAL) {
        this.conversationStates.delete(conversationId);
      }
    }
  }
  getStateSize() {
    return this.conversationStates.size;
  }
};
var responseStateManager = new ResponseStateManager();
function getConversationId(agentId, messageId) {
  return agentId || messageId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// src/services/ai/llm.ts
import { nanoid } from "nanoid";

// src/utils/tooling/toolUsePartialJson.ts
function tokenizePartialJson(input) {
  let index = 0;
  const tokens = [];
  while (index < input.length) {
    let ch = input[index];
    if (ch === "\\") {
      index++;
      continue;
    }
    if (ch === "{") {
      tokens.push({ type: "brace", value: "{" });
      index++;
      continue;
    }
    if (ch === "}") {
      tokens.push({ type: "brace", value: "}" });
      index++;
      continue;
    }
    if (ch === "[") {
      tokens.push({ type: "paren", value: "[" });
      index++;
      continue;
    }
    if (ch === "]") {
      tokens.push({ type: "paren", value: "]" });
      index++;
      continue;
    }
    if (ch === ":") {
      tokens.push({ type: "separator", value: ":" });
      index++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "delimiter", value: "," });
      index++;
      continue;
    }
    if (ch === '"') {
      let value = "";
      let incomplete = false;
      ch = input[++index];
      while (ch !== '"') {
        if (index === input.length) {
          incomplete = true;
          break;
        }
        if (ch === "\\") {
          if (++index === input.length) {
            incomplete = true;
            break;
          }
          value += ch + input[index];
          ch = input[++index];
        } else {
          value += ch;
          ch = input[++index];
        }
      }
      ch = input[++index];
      if (!incomplete) tokens.push({ type: "string", value });
      continue;
    }
    if (ch && /\s/.test(ch)) {
      index++;
      continue;
    }
    const digit = /[0-9]/;
    if (ch && digit.test(ch) || ch === "-" || ch === ".") {
      let value = "";
      if (ch === "-") {
        value += ch;
        ch = input[++index];
      }
      while (ch && digit.test(ch) || ch === ".") {
        value += ch;
        ch = input[++index];
      }
      tokens.push({ type: "number", value });
      continue;
    }
    const alpha = /[a-z]/i;
    if (ch && alpha.test(ch)) {
      let value = "";
      while (ch && alpha.test(ch)) {
        if (index === input.length) break;
        value += ch;
        ch = input[++index];
      }
      if (value === "true" || value === "false" || value === "null") {
        tokens.push({ type: "name", value });
      } else {
        index++;
      }
      continue;
    }
    index++;
  }
  return tokens;
}
function trimTrailingIncompleteTokens(tokens) {
  if (tokens.length === 0) return tokens;
  const last = tokens[tokens.length - 1];
  if (last.type === "separator") {
    return trimTrailingIncompleteTokens(tokens.slice(0, -1));
  }
  if (last.type === "number") {
    const lastChar = last.value[last.value.length - 1];
    if (lastChar === "." || lastChar === "-") {
      return trimTrailingIncompleteTokens(tokens.slice(0, -1));
    }
  }
  if (last.type === "string" || last.type === "number") {
    const previous = tokens[tokens.length - 2];
    if (previous?.type === "delimiter") {
      return trimTrailingIncompleteTokens(tokens.slice(0, -1));
    }
    if (previous?.type === "brace" && previous.value === "{") {
      return trimTrailingIncompleteTokens(tokens.slice(0, -1));
    }
  }
  if (last.type === "delimiter") {
    return trimTrailingIncompleteTokens(tokens.slice(0, -1));
  }
  return tokens;
}
function closeOpenBrackets(tokens) {
  const missingClosers = [];
  for (const token of tokens) {
    if (token.type === "brace") {
      if (token.value === "{") missingClosers.push("}");
      else missingClosers.splice(missingClosers.lastIndexOf("}"), 1);
      continue;
    }
    if (token.type === "paren") {
      if (token.value === "[") missingClosers.push("]");
      else missingClosers.splice(missingClosers.lastIndexOf("]"), 1);
    }
  }
  if (missingClosers.length > 0) {
    missingClosers.reverse();
    for (const closer of missingClosers) {
      if (closer === "}") tokens.push({ type: "brace", value: "}" });
      else tokens.push({ type: "paren", value: "]" });
    }
  }
  return tokens;
}
function tokensToJson(tokens) {
  let out = "";
  for (const token of tokens) {
    if (token.type === "string") out += `"${token.value}"`;
    else out += token.value;
  }
  return out;
}
function parseToolUsePartialJson(input) {
  const tokens = tokenizePartialJson(input);
  const trimmed = trimTrailingIncompleteTokens(tokens);
  const completed = closeOpenBrackets(trimmed);
  return JSON.parse(tokensToJson(completed));
}
function parseToolUsePartialJsonOrThrow(input) {
  try {
    return parseToolUsePartialJson(input);
  } catch (error) {
    throw new Error(
      `Unable to parse tool parameter JSON from model. Please retry your request or adjust your prompt. Error: ${String(error)}. JSON: ${input}`
    );
  }
}

// src/utils/model/openaiMessageConversion.ts
function convertAnthropicMessagesToOpenAIMessages(messages) {
  const openaiMessages = [];
  const toolResults = {};
  for (const message of messages) {
    const blocks = [];
    if (typeof message.message.content === "string") {
      blocks.push({ type: "text", text: message.message.content });
    } else if (Array.isArray(message.message.content)) {
      blocks.push(...message.message.content);
    } else if (message.message.content) {
      blocks.push(message.message.content);
    }
    const role = message.message.role;
    const userContentParts = [];
    const assistantTextParts = [];
    const assistantToolCalls = [];
    for (const block of blocks) {
      if (block.type === "text") {
        const text = typeof block.text === "string" ? block.text : "";
        if (!text) continue;
        if (role === "user") {
          userContentParts.push({ type: "text", text });
        } else if (role === "assistant") {
          assistantTextParts.push(text);
        }
        continue;
      }
      if (block.type === "image" && role === "user") {
        const source = block.source;
        if (source?.type === "base64") {
          userContentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${source.media_type};base64,${source.data}`
            }
          });
        } else if (source?.type === "url") {
          userContentParts.push({
            type: "image_url",
            image_url: { url: source.url }
          });
        }
        continue;
      }
      if (block.type === "tool_use") {
        assistantToolCalls.push({
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input)
          },
          id: block.id
        });
        continue;
      }
      if (block.type === "tool_result") {
        const toolUseId = block.tool_use_id;
        const rawToolContent = block.content;
        const toolContent = typeof rawToolContent === "string" ? rawToolContent : JSON.stringify(rawToolContent);
        toolResults[toolUseId] = {
          role: "tool",
          content: toolContent,
          tool_call_id: toolUseId
        };
        continue;
      }
    }
    if (role === "user") {
      if (userContentParts.length === 1 && userContentParts[0]?.type === "text") {
        openaiMessages.push({
          role: "user",
          content: userContentParts[0].text
        });
      } else if (userContentParts.length > 0) {
        openaiMessages.push({ role: "user", content: userContentParts });
      }
      continue;
    }
    if (role === "assistant") {
      const text = assistantTextParts.filter(Boolean).join("\n");
      if (assistantToolCalls.length > 0) {
        openaiMessages.push({
          role: "assistant",
          content: text ? text : void 0,
          tool_calls: assistantToolCalls
        });
        continue;
      }
      if (text) {
        openaiMessages.push({ role: "assistant", content: text });
      }
    }
  }
  const finalMessages = [];
  for (const message of openaiMessages) {
    finalMessages.push(message);
    if ("tool_calls" in message && message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolResults[toolCall.id]) {
          finalMessages.push(toolResults[toolCall.id]);
        }
      }
    }
  }
  return finalMessages;
}

// src/services/ai/llm.ts
var AnthropicBedrock = class {
  constructor(_args) {
    throw new Error("Bedrock SDK not installed. Install @anthropic-ai/bedrock-sdk to use Bedrock.");
  }
};
var AnthropicVertex = class {
  constructor(_args) {
    throw new Error("Vertex SDK not installed. Install @anthropic-ai/vertex-sdk to use Vertex.");
  }
};
function isGPT5Model(modelName) {
  return modelName.startsWith("gpt-5");
}
var PROMPT_CACHING_ENABLED = !process.env.DISABLE_PROMPT_CACHING;
var SONNET_COST_PER_MILLION_INPUT_TOKENS = 3;
var SONNET_COST_PER_MILLION_OUTPUT_TOKENS = 15;
var SONNET_COST_PER_MILLION_PROMPT_CACHE_WRITE_TOKENS = 3.75;
var SONNET_COST_PER_MILLION_PROMPT_CACHE_READ_TOKENS = 0.3;
var MAX_RETRIES = process.env.USER_TYPE === "SWE_BENCH" ? 100 : 10;
var BASE_DELAY_MS = 500;
function abortableDelay(delayMs, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Request was aborted"));
      return;
    }
    const timeoutId = setTimeout(() => {
      resolve();
    }, delayMs);
    if (signal) {
      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new Error("Request was aborted"));
      };
      signal.addEventListener("abort", abortHandler, { once: true });
    }
  });
}
function getRetryDelay(attempt, retryAfterHeader) {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) {
      return seconds * 1e3;
    }
  }
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), 32e3);
}
function shouldRetry(error) {
  if (error.message?.includes('"type":"overloaded_error"')) {
    return process.env.USER_TYPE === "SWE_BENCH";
  }
  const shouldRetryHeader = error.headers?.["x-should-retry"];
  if (shouldRetryHeader === "true") return true;
  if (shouldRetryHeader === "false") return false;
  if (error instanceof APIConnectionError) {
    return true;
  }
  if (!error.status) return false;
  if (error.status === 408) return true;
  if (error.status === 409) return true;
  if (error.status === 429) return true;
  if (error.status && error.status >= 500) return true;
  return false;
}
async function withRetry(operation, options = {}) {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  let lastError;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt > maxRetries || !(error instanceof APIError) || !shouldRetry(error)) {
        throw error;
      }
      if (options.signal?.aborted) {
        throw new Error("Request cancelled by user");
      }
      const retryAfter = error.headers?.["retry-after"] ?? null;
      const delayMs = getRetryDelay(attempt, retryAfter);
      debug.warn("LLM_API_RETRY", {
        name: error.name,
        message: error.message,
        status: error.status,
        attempt,
        maxRetries,
        delayMs
      });
      try {
        await abortableDelay(delayMs, options.signal);
      } catch (delayError) {
        if (delayError.message === "Request was aborted") {
          throw new Error("Request cancelled by user");
        }
        throw delayError;
      }
    }
  }
  throw lastError;
}
async function fetchAnthropicModels(baseURL, apiKey) {
  try {
    const modelsURL = baseURL ? `${baseURL.replace(/\/+$/, "")}/v1/models` : "https://api.anthropic.com/v1/models";
    const response = await fetch(modelsURL, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "User-Agent": USER_AGENT
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Invalid API key. Please check your Anthropic API key and try again."
        );
      } else if (response.status === 403) {
        throw new Error(
          "API key does not have permission to access models. Please check your API key permissions."
        );
      } else if (response.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again."
        );
      } else if (response.status >= 500) {
        throw new Error(
          "Anthropic service is temporarily unavailable. Please try again later."
        );
      } else {
        throw new Error(
          `Unable to connect to Anthropic API (${response.status}). Please check your internet connection and API key.`
        );
      }
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    if (error instanceof Error && error.message.includes("API key") || error instanceof Error && error.message.includes("Anthropic")) {
      throw error;
    }
    logError(error);
    debug.warn("ANTHROPIC_MODELS_FETCH_FAILED", {
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(
      "Unable to connect to Anthropic API. Please check your internet connection and try again."
    );
  }
}
async function verifyApiKey(apiKey, baseURL, provider) {
  if (!apiKey) {
    return false;
  }
  if (provider && provider !== "anthropic") {
    try {
      const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      };
      if (!baseURL) {
        debug.warn("API_VERIFICATION_MISSING_BASE_URL", { provider });
        return false;
      }
      const modelsURL = `${baseURL.replace(/\/+$/, "")}/models`;
      const response = await fetch(modelsURL, {
        method: "GET",
        headers
      });
      return response.ok;
    } catch (error) {
      logError(error);
      debug.warn("API_VERIFICATION_FAILED", {
        provider,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  const clientConfig = {
    apiKey,
    dangerouslyAllowBrowser: true,
    maxRetries: 3,
    defaultHeaders: {
      "User-Agent": USER_AGENT
    }
  };
  if (baseURL && (provider === "anthropic" || provider === "minimax-coding")) {
    clientConfig.baseURL = baseURL;
  }
  const anthropic = new Anthropic(clientConfig);
  try {
    await withRetry(
      async () => {
        const model = "claude-sonnet-4-20250514";
        const messages = [{ role: "user", content: "test" }];
        await anthropic.messages.create({
          model,
          max_tokens: 1e3,
          messages,
          temperature: 0
        });
        return true;
      },
      { maxRetries: 2 }
    );
    return true;
  } catch (error) {
    logError(error);
    if (error instanceof Error && error.message.includes(
      '{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}'
    )) {
      return false;
    }
    throw error;
  }
}
function convertAnthropicMessagesToOpenAIMessages2(messages) {
  return convertAnthropicMessagesToOpenAIMessages(messages);
}
function messageReducer(previous, item) {
  const reduce = (acc, delta) => {
    acc = { ...acc };
    for (const [key, value] of Object.entries(delta)) {
      if (acc[key] === void 0 || acc[key] === null) {
        acc[key] = value;
        if (Array.isArray(acc[key])) {
          for (const arr of acc[key]) {
            delete arr.index;
          }
        }
      } else if (typeof acc[key] === "string" && typeof value === "string") {
        acc[key] += value;
      } else if (typeof acc[key] === "number" && typeof value === "number") {
        acc[key] = value;
      } else if (Array.isArray(acc[key]) && Array.isArray(value)) {
        const accArray = acc[key];
        for (let i = 0; i < value.length; i++) {
          const { index, ...chunkTool } = value[i];
          if (index - accArray.length > 1) {
            throw new Error(
              `Error: An array has an empty value when tool_calls are constructed. tool_calls: ${accArray}; tool: ${value}`
            );
          }
          accArray[index] = reduce(accArray[index], chunkTool);
        }
      } else if (typeof acc[key] === "object" && typeof value === "object") {
        acc[key] = reduce(acc[key], value);
      }
    }
    return acc;
  };
  const choice = item.choices?.[0];
  if (!choice) {
    return previous;
  }
  return reduce(previous, choice.delta);
}
async function handleMessageStream(stream, signal) {
  const streamStartTime = Date.now();
  let ttftMs;
  let chunkCount = 0;
  let errorCount = 0;
  debug.api("OPENAI_STREAM_START", {
    streamStartTime: String(streamStartTime)
  });
  let message = {};
  let id, model, created, object, usage;
  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        debug.flow("OPENAI_STREAM_ABORTED", {
          chunkCount,
          timestamp: Date.now()
        });
        throw new Error("Request was cancelled");
      }
      chunkCount++;
      try {
        if (!id) {
          id = chunk.id;
          debug.api("OPENAI_STREAM_ID_RECEIVED", {
            id,
            chunkNumber: String(chunkCount)
          });
        }
        if (!model) {
          model = chunk.model;
          debug.api("OPENAI_STREAM_MODEL_RECEIVED", {
            model,
            chunkNumber: String(chunkCount)
          });
        }
        if (!created) {
          created = chunk.created;
        }
        if (!object) {
          object = chunk.object;
        }
        if (!usage) {
          usage = chunk.usage;
        }
        message = messageReducer(message, chunk);
        if (chunk?.choices?.[0]?.delta?.content) {
          if (!ttftMs) {
            ttftMs = Date.now() - streamStartTime;
            debug.api("OPENAI_STREAM_FIRST_TOKEN", {
              ttftMs: String(ttftMs),
              chunkNumber: String(chunkCount)
            });
          }
        }
      } catch (chunkError) {
        errorCount++;
        debug.error("OPENAI_STREAM_CHUNK_ERROR", {
          chunkNumber: String(chunkCount),
          errorMessage: chunkError instanceof Error ? chunkError.message : String(chunkError),
          errorType: chunkError instanceof Error ? chunkError.constructor.name : typeof chunkError
        });
      }
    }
    debug.api("OPENAI_STREAM_COMPLETE", {
      totalChunks: String(chunkCount),
      errorCount: String(errorCount),
      totalDuration: String(Date.now() - streamStartTime),
      ttftMs: String(ttftMs || 0),
      finalMessageId: id || "undefined"
    });
  } catch (streamError) {
    debug.error("OPENAI_STREAM_FATAL_ERROR", {
      totalChunks: String(chunkCount),
      errorCount: String(errorCount),
      errorMessage: streamError instanceof Error ? streamError.message : String(streamError),
      errorType: streamError instanceof Error ? streamError.constructor.name : typeof streamError
    });
    throw streamError;
  }
  return {
    id,
    created,
    model,
    object,
    choices: [
      {
        index: 0,
        message,
        finish_reason: "stop",
        logprobs: void 0
      }
    ],
    usage
  };
}
function convertOpenAIResponseToAnthropic(response, tools) {
  let contentBlocks = [];
  const message = response.choices?.[0]?.message;
  if (!message) {
    return {
      role: "assistant",
      content: [],
      stop_reason: response.choices?.[0]?.finish_reason,
      type: "message",
      usage: response.usage
    };
  }
  if (message?.tool_calls) {
    for (const toolCall of message.tool_calls) {
      const tool = toolCall.function;
      const toolName = tool?.name;
      let toolArgs = {};
      try {
        toolArgs = tool?.arguments ? JSON.parse(tool.arguments) : {};
      } catch (e) {
      }
      contentBlocks.push({
        type: "tool_use",
        input: toolArgs,
        name: toolName,
        id: toolCall.id?.length > 0 ? toolCall.id : nanoid()
      });
    }
  }
  if (message.reasoning) {
    contentBlocks.push({
      type: "thinking",
      thinking: message.reasoning,
      signature: ""
    });
  }
  if (message.reasoning_content) {
    contentBlocks.push({
      type: "thinking",
      thinking: message.reasoning_content,
      signature: ""
    });
  }
  if (message.content) {
    contentBlocks.push({
      type: "text",
      text: message?.content,
      citations: []
    });
  }
  const finalMessage = {
    role: "assistant",
    content: contentBlocks,
    stop_reason: response.choices?.[0]?.finish_reason,
    type: "message",
    usage: response.usage
  };
  return finalMessage;
}
var anthropicClient = null;
function getAnthropicClient(model) {
  const config = getGlobalConfig();
  const provider = config.primaryProvider;
  if (anthropicClient && provider) {
    anthropicClient = null;
  }
  if (anthropicClient) {
    return anthropicClient;
  }
  const region = getVertexRegionForModel(model);
  const modelManager = getModelManager();
  const modelProfile = modelManager.getModel("main");
  const defaultHeaders = {
    "x-app": "cli",
    "User-Agent": USER_AGENT
  };
  if (process.env.ANTHROPIC_AUTH_TOKEN) {
    defaultHeaders["Authorization"] = `Bearer ${process.env.ANTHROPIC_AUTH_TOKEN}`;
  }
  const ARGS = {
    defaultHeaders,
    maxRetries: 0,
    timeout: parseInt(process.env.API_TIMEOUT_MS || String(60 * 1e3), 10)
  };
  if (USE_BEDROCK) {
    const client = new AnthropicBedrock(ARGS);
    anthropicClient = client;
    return client;
  }
  if (USE_VERTEX) {
    const vertexArgs = {
      ...ARGS,
      region: region || process.env.CLOUD_ML_REGION || "us-east5"
    };
    const client = new AnthropicVertex(vertexArgs);
    anthropicClient = client;
    return client;
  }
  let apiKey;
  let baseURL;
  if (modelProfile) {
    apiKey = modelProfile.apiKey || "";
    baseURL = modelProfile.baseURL;
  } else {
    apiKey = getAnthropicApiKey();
    baseURL = void 0;
  }
  if (process.env.USER_TYPE === "ant" && !apiKey && provider === "anthropic") {
    console.error(
      chalk.red(
        "[ANT-ONLY] Missing API key. Configure an API key in your model profile or environment variables."
      )
    );
  }
  const clientConfig = {
    apiKey,
    dangerouslyAllowBrowser: true,
    ...ARGS,
    ...baseURL && { baseURL }
  };
  anthropicClient = new Anthropic(clientConfig);
  return anthropicClient;
}
function resetAnthropicClient() {
  anthropicClient = null;
}
function applyCacheControlWithLimits(systemBlocks, messageParams) {
  if (!PROMPT_CACHING_ENABLED) {
    return { systemBlocks, messageParams };
  }
  const maxCacheBlocks = 4;
  let usedCacheBlocks = 0;
  const processedSystemBlocks = systemBlocks.map((block, index) => {
    if (usedCacheBlocks < maxCacheBlocks && block.text.length > 1e3) {
      usedCacheBlocks++;
      return {
        ...block,
        cache_control: { type: "ephemeral" }
      };
    }
    const { cache_control, ...blockWithoutCache } = block;
    return blockWithoutCache;
  });
  const processedMessageParams = messageParams.map((message, messageIndex) => {
    if (Array.isArray(message.content)) {
      const processedContent = message.content.map(
        (contentBlock, blockIndex) => {
          const shouldCache = usedCacheBlocks < maxCacheBlocks && contentBlock.type === "text" && typeof contentBlock.text === "string" && (contentBlock.text.length > 2e3 || messageIndex === messageParams.length - 1 && blockIndex === message.content.length - 1 && contentBlock.text.length > 500);
          if (shouldCache) {
            usedCacheBlocks++;
            return {
              ...contentBlock,
              cache_control: { type: "ephemeral" }
            };
          }
          const { cache_control, ...blockWithoutCache } = contentBlock;
          return blockWithoutCache;
        }
      );
      return {
        ...message,
        content: processedContent
      };
    }
    return message;
  });
  return {
    systemBlocks: processedSystemBlocks,
    messageParams: processedMessageParams
  };
}
function userMessageToMessageParam(message, addCache = false) {
  if (addCache) {
    if (typeof message.message.content === "string") {
      return {
        role: "user",
        content: [
          {
            type: "text",
            text: message.message.content
          }
        ]
      };
    } else {
      return {
        role: "user",
        content: message.message.content.map((_) => ({ ..._ }))
      };
    }
  }
  return {
    role: "user",
    content: message.message.content
  };
}
function assistantMessageToMessageParam(message, addCache = false) {
  if (addCache) {
    if (typeof message.message.content === "string") {
      return {
        role: "assistant",
        content: [
          {
            type: "text",
            text: message.message.content
          }
        ]
      };
    } else {
      return {
        role: "assistant",
        content: message.message.content.map((_) => ({ ..._ }))
      };
    }
  }
  return {
    role: "assistant",
    content: message.message.content
  };
}
function splitSysPromptPrefix(systemPrompt) {
  const systemPromptFirstBlock = systemPrompt[0] || "";
  const systemPromptRest = systemPrompt.slice(1);
  return [systemPromptFirstBlock, systemPromptRest.join("\n")].filter(Boolean);
}
async function queryLLM(messages, systemPrompt, maxThinkingTokens, tools, signal, options) {
  const modelManager = options.__testModelManager ?? getModelManager();
  const modelResolution = modelManager.resolveModelWithInfo(options.model);
  if (!modelResolution.success || !modelResolution.profile) {
    const fallbackProfile = modelManager.resolveModel(options.model);
    if (!fallbackProfile) {
      throw new Error(
        modelResolution.error || `Failed to resolve model: ${options.model}`
      );
    }
    debug.warn("MODEL_RESOLUTION_FALLBACK", {
      inputParam: options.model,
      error: modelResolution.error,
      fallbackModelName: fallbackProfile.modelName,
      fallbackProvider: fallbackProfile.provider,
      requestId: getCurrentRequest()?.id
    });
    modelResolution.success = true;
    modelResolution.profile = fallbackProfile;
  }
  const modelProfile = modelResolution.profile;
  const resolvedModel = modelProfile.modelName;
  const toolUseContext = options.toolUseContext;
  if (toolUseContext && !toolUseContext.responseState) {
    const conversationId = getConversationId(
      toolUseContext.agentId,
      toolUseContext.messageId
    );
    const previousResponseId = responseStateManager.getPreviousResponseId(conversationId);
    toolUseContext.responseState = {
      previousResponseId,
      conversationId
    };
  }
  debug.api("MODEL_RESOLVED", {
    inputParam: options.model,
    resolvedModelName: resolvedModel,
    provider: modelProfile.provider,
    isPointer: ["main", "task", "compact", "quick"].includes(options.model),
    hasResponseState: !!toolUseContext?.responseState,
    conversationId: toolUseContext?.responseState?.conversationId,
    requestId: getCurrentRequest()?.id
  });
  const currentRequest = getCurrentRequest();
  debug.api("LLM_REQUEST_START", {
    messageCount: messages.length,
    systemPromptLength: systemPrompt.join(" ").length,
    toolCount: tools.length,
    model: resolvedModel,
    originalModelParam: options.model,
    requestId: getCurrentRequest()?.id
  });
  markPhase("LLM_CALL");
  try {
    const queryFn = options.__testQueryLLMWithPromptCaching ?? queryLLMWithPromptCaching;
    const cleanOptions = { ...options };
    delete cleanOptions.__testModelManager;
    delete cleanOptions.__testQueryLLMWithPromptCaching;
    const runQuery = () => queryFn(
      messages,
      systemPrompt,
      maxThinkingTokens,
      tools,
      signal,
      {
        ...cleanOptions,
        model: resolvedModel,
        modelProfile,
        toolUseContext
      }
    );
    const result = options.__testQueryLLMWithPromptCaching ? await runQuery() : await withVCR(messages, runQuery);
    debug.api("LLM_REQUEST_SUCCESS", {
      costUSD: result.costUSD,
      durationMs: result.durationMs,
      responseLength: result.message.content?.length || 0,
      requestId: getCurrentRequest()?.id
    });
    if (toolUseContext?.responseState?.conversationId && result.responseId) {
      responseStateManager.setPreviousResponseId(
        toolUseContext.responseState.conversationId,
        result.responseId
      );
      debug.api("RESPONSE_STATE_UPDATED", {
        conversationId: toolUseContext.responseState.conversationId,
        responseId: result.responseId,
        requestId: getCurrentRequest()?.id
      });
    }
    return result;
  } catch (error) {
    logErrorWithDiagnosis(
      error,
      {
        messageCount: messages.length,
        systemPromptLength: systemPrompt.join(" ").length,
        model: options.model,
        toolCount: tools.length,
        phase: "LLM_CALL"
      },
      currentRequest?.id
    );
    throw error;
  }
}
async function queryLLMWithPromptCaching(messages, systemPrompt, maxThinkingTokens, tools, signal, options) {
  const config = getGlobalConfig();
  const modelManager = getModelManager();
  const toolUseContext = options.toolUseContext;
  const modelProfile = options.modelProfile || modelManager.getModel("main");
  let provider;
  if (modelProfile) {
    provider = modelProfile.provider || config.primaryProvider || "anthropic";
  } else {
    provider = config.primaryProvider || "anthropic";
  }
  if (provider === "anthropic" || provider === "bigdream" || provider === "opendev" || provider === "minimax-coding") {
    return queryAnthropicNative(
      messages,
      systemPrompt,
      maxThinkingTokens,
      tools,
      signal,
      { ...options, modelProfile, toolUseContext }
    );
  }
  return queryOpenAI(messages, systemPrompt, maxThinkingTokens, tools, signal, {
    ...options,
    modelProfile,
    toolUseContext
  });
}
async function queryAnthropicNative(messages, systemPrompt, maxThinkingTokens, tools, signal, options) {
  const config = getGlobalConfig();
  const modelManager = getModelManager();
  const toolUseContext = options?.toolUseContext;
  const modelProfile = options?.modelProfile || modelManager.getModel("main");
  let anthropic;
  let model;
  let provider;
  debug.api("MODEL_CONFIG_ANTHROPIC", {
    modelProfileFound: !!modelProfile,
    modelProfileId: modelProfile?.modelName,
    modelProfileName: modelProfile?.name,
    modelProfileModelName: modelProfile?.modelName,
    modelProfileProvider: modelProfile?.provider,
    modelProfileBaseURL: modelProfile?.baseURL,
    modelProfileApiKeyExists: !!modelProfile?.apiKey,
    optionsModel: options?.model,
    requestId: getCurrentRequest()?.id
  });
  if (modelProfile) {
    model = modelProfile.modelName;
    provider = modelProfile.provider || config.primaryProvider || "anthropic";
    if (modelProfile.provider === "anthropic" || modelProfile.provider === "minimax-coding") {
      const clientConfig = {
        apiKey: modelProfile.apiKey,
        dangerouslyAllowBrowser: true,
        maxRetries: 0,
        timeout: parseInt(process.env.API_TIMEOUT_MS || String(60 * 1e3), 10),
        defaultHeaders: {
          "x-app": "cli",
          "User-Agent": USER_AGENT
        }
      };
      if (modelProfile.baseURL) {
        clientConfig.baseURL = modelProfile.baseURL;
      }
      anthropic = new Anthropic(clientConfig);
    } else {
      anthropic = getAnthropicClient(model);
    }
  } else {
    const errorDetails = {
      modelProfileExists: !!modelProfile,
      modelProfileModelName: modelProfile?.modelName,
      requestedModel: options?.model,
      requestId: getCurrentRequest()?.id
    };
    debug.error("ANTHROPIC_FALLBACK_ERROR", errorDetails);
    throw new Error(
      `No valid ModelProfile available for Anthropic provider. Please configure model through /model command. Debug: ${JSON.stringify(errorDetails)}`
    );
  }
  if (options?.prependCLISysprompt) {
    const [firstSyspromptBlock] = splitSysPromptPrefix(systemPrompt);
    systemPrompt = [getCLISyspromptPrefix(), ...systemPrompt];
  }
  const system = splitSysPromptPrefix(systemPrompt).map(
    (_) => ({
      text: _,
      type: "text"
    })
  );
  const toolSchemas = await Promise.all(
    tools.map(
      async (tool) => ({
        name: tool.name,
        description: getToolDescription(tool),
        input_schema: "inputJSONSchema" in tool && tool.inputJSONSchema ? tool.inputJSONSchema : zodToJsonSchema4(tool.inputSchema)
      })
    )
  );
  const anthropicMessages = addCacheBreakpoints(messages);
  const { systemBlocks: processedSystem, messageParams: processedMessages } = applyCacheControlWithLimits(system, anthropicMessages);
  const startIncludingRetries = Date.now();
  logSystemPromptConstruction({
    basePrompt: systemPrompt.join("\n"),
    danyaContext: generateDanyaContext() || "",
    reminders: [],
    finalPrompt: systemPrompt.join("\n")
  });
  let start = Date.now();
  let attemptNumber = 0;
  let response;
  try {
    response = await withRetry(
      async (attempt) => {
        attemptNumber = attempt;
        start = Date.now();
        const params = {
          model,
          max_tokens: options?.maxTokens ?? getMaxTokensFromProfile(modelProfile),
          messages: processedMessages,
          system: processedSystem,
          tools: toolSchemas.length > 0 ? toolSchemas : void 0,
          tool_choice: toolSchemas.length > 0 ? { type: "auto" } : void 0,
          ...options?.temperature !== void 0 ? { temperature: options.temperature } : {},
          ...options?.stopSequences && options.stopSequences.length > 0 ? { stop_sequences: options.stopSequences } : {}
        };
        if (maxThinkingTokens > 0) {
          ;
          params.extra_headers = {
            "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15"
          };
          params.thinking = { max_tokens: maxThinkingTokens };
        }
        debug.api("ANTHROPIC_API_CALL_START_STREAMING", {
          endpoint: modelProfile?.baseURL || "DEFAULT_ANTHROPIC",
          model,
          provider,
          apiKeyConfigured: !!modelProfile?.apiKey,
          apiKeyPrefix: modelProfile?.apiKey ? modelProfile.apiKey.substring(0, 8) : null,
          maxTokens: params.max_tokens,
          temperature: options?.temperature ?? MAIN_QUERY_TEMPERATURE,
          params,
          messageCount: params.messages?.length || 0,
          streamMode: true,
          toolsCount: toolSchemas.length,
          thinkingTokens: maxThinkingTokens,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          modelProfileId: modelProfile?.modelName,
          modelProfileName: modelProfile?.name
        });
        if (config.stream) {
          const stream = await anthropic.beta.messages.create(
            {
              ...params,
              stream: true
            },
            {
              signal
            }
          );
          let finalResponse = null;
          let messageStartEvent = null;
          const contentBlocks = [];
          const inputJSONBuffers = /* @__PURE__ */ new Map();
          let usage = null;
          let stopReason = null;
          let stopSequence = null;
          let hasMarkedStreaming = false;
          for await (const event of stream) {
            if (signal.aborted) {
              debug.flow("STREAM_ABORTED", {
                eventType: event.type,
                timestamp: Date.now()
              });
              throw new Error("Request was cancelled");
            }
            switch (event.type) {
              case "message_start":
                messageStartEvent = event;
                finalResponse = {
                  ...event.message,
                  content: []
                };
                break;
              case "content_block_start":
                contentBlocks[event.index] = { ...event.content_block };
                const contentBlockType = event.content_block.type;
                if (contentBlockType === "tool_use" || contentBlockType === "server_tool_use" || contentBlockType === "mcp_tool_use") {
                  setRequestStatus({
                    kind: "tool",
                    detail: event.content_block.name
                  });
                  inputJSONBuffers.set(event.index, "");
                }
                break;
              case "content_block_delta":
                const blockIndex = event.index;
                if (!contentBlocks[blockIndex]) {
                  contentBlocks[blockIndex] = {
                    type: event.delta.type === "text_delta" ? "text" : "tool_use",
                    text: event.delta.type === "text_delta" ? "" : void 0
                  };
                  if (event.delta.type === "input_json_delta") {
                    inputJSONBuffers.set(blockIndex, "");
                  }
                }
                if (event.delta.type === "text_delta") {
                  if (!hasMarkedStreaming) {
                    setRequestStatus({ kind: "streaming" });
                    hasMarkedStreaming = true;
                  }
                  contentBlocks[blockIndex].text += event.delta.text;
                } else if (event.delta.type === "input_json_delta") {
                  const currentBuffer = inputJSONBuffers.get(blockIndex) || "";
                  const nextBuffer = currentBuffer + event.delta.partial_json;
                  inputJSONBuffers.set(blockIndex, nextBuffer);
                  const trimmed = nextBuffer.trim();
                  if (trimmed.length === 0) {
                    contentBlocks[blockIndex].input = {};
                    break;
                  }
                  contentBlocks[blockIndex].input = parseToolUsePartialJsonOrThrow(nextBuffer) ?? {};
                }
                break;
              case "message_delta":
                if (event.delta.stop_reason)
                  stopReason = event.delta.stop_reason;
                if (event.delta.stop_sequence)
                  stopSequence = event.delta.stop_sequence;
                if (event.usage) usage = { ...usage, ...event.usage };
                break;
              case "content_block_stop":
                const stopIndex = event.index;
                const block = contentBlocks[stopIndex];
                if ((block?.type === "tool_use" || block?.type === "server_tool_use" || block?.type === "mcp_tool_use") && inputJSONBuffers.has(stopIndex)) {
                  const jsonStr = inputJSONBuffers.get(stopIndex) ?? "";
                  if (block.input === void 0) {
                    const trimmed = jsonStr.trim();
                    if (trimmed.length === 0) {
                      block.input = {};
                    } else {
                      block.input = parseToolUsePartialJsonOrThrow(jsonStr) ?? {};
                    }
                  }
                  inputJSONBuffers.delete(stopIndex);
                }
                break;
              case "message_stop":
                inputJSONBuffers.clear();
                break;
            }
            if (event.type === "message_stop") {
              break;
            }
          }
          if (!finalResponse || !messageStartEvent) {
            throw new Error("Stream ended without proper message structure");
          }
          finalResponse = {
            ...messageStartEvent.message,
            content: contentBlocks.filter(Boolean),
            stop_reason: stopReason,
            stop_sequence: stopSequence,
            usage: {
              ...messageStartEvent.message.usage,
              ...usage
            }
          };
          return finalResponse;
        } else {
          debug.api("ANTHROPIC_API_CALL_START_NON_STREAMING", {
            endpoint: modelProfile?.baseURL || "DEFAULT_ANTHROPIC",
            model,
            provider,
            apiKeyConfigured: !!modelProfile?.apiKey,
            apiKeyPrefix: modelProfile?.apiKey ? modelProfile.apiKey.substring(0, 8) : null,
            maxTokens: params.max_tokens,
            temperature: options?.temperature ?? MAIN_QUERY_TEMPERATURE,
            messageCount: params.messages?.length || 0,
            streamMode: false,
            toolsCount: toolSchemas.length,
            thinkingTokens: maxThinkingTokens,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            modelProfileId: modelProfile?.modelName,
            modelProfileName: modelProfile?.name
          });
          return await anthropic.beta.messages.create(params, {
            signal
          });
        }
      },
      { signal }
    );
    debug.api("ANTHROPIC_API_CALL_SUCCESS", {
      content: response.content
    });
    const ttftMs = start - Date.now();
    const durationMs = Date.now() - startIncludingRetries;
    const content = response.content.map((block) => {
      if (block.type === "text") {
        return {
          type: "text",
          text: block.text
        };
      } else if (block.type === "tool_use") {
        return {
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input
        };
      }
      return block;
    });
    const assistantMessage = {
      message: {
        id: response.id,
        content,
        model: response.model,
        role: "assistant",
        stop_reason: response.stop_reason,
        stop_sequence: response.stop_sequence,
        type: "message",
        usage: response.usage
      },
      type: "assistant",
      uuid: nanoid(),
      durationMs,
      costUSD: 0
    };
    const systemMessages = system.map((block) => ({
      role: "system",
      content: block.text
    }));
    logLLMInteraction({
      systemPrompt: systemPrompt.join("\n"),
      messages: [...systemMessages, ...anthropicMessages],
      response,
      usage: response.usage ? {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      } : void 0,
      timing: {
        start,
        end: Date.now()
      },
      apiFormat: "anthropic"
    });
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cacheCreationInputTokens = response.usage.cache_creation_input_tokens ?? 0;
    const cacheReadInputTokens = response.usage.cache_read_input_tokens ?? 0;
    const costUSD = inputTokens / 1e6 * getModelInputTokenCostUSD(model) + outputTokens / 1e6 * getModelOutputTokenCostUSD(model) + cacheCreationInputTokens / 1e6 * getModelInputTokenCostUSD(model) + cacheReadInputTokens / 1e6 * (getModelInputTokenCostUSD(model) * 0.1);
    assistantMessage.costUSD = costUSD;
    addToTotalCost(costUSD, durationMs);
    return assistantMessage;
  } catch (error) {
    return getAssistantMessageFromError(error);
  }
}
function getAssistantMessageFromError(error) {
  if (error instanceof Error && error.message.includes("prompt is too long")) {
    return createAssistantAPIErrorMessage(PROMPT_TOO_LONG_ERROR_MESSAGE);
  }
  if (error instanceof Error && error.message.includes("Your credit balance is too low")) {
    return createAssistantAPIErrorMessage(CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE);
  }
  if (error instanceof Error && error.message.toLowerCase().includes("x-api-key")) {
    return createAssistantAPIErrorMessage(INVALID_API_KEY_ERROR_MESSAGE);
  }
  if (error instanceof Error) {
    if (process.env.NODE_ENV === "development") {
      debug.error("ANTHROPIC_API_ERROR", {
        message: error.message,
        stack: error.stack
      });
    }
    return createAssistantAPIErrorMessage(
      `${API_ERROR_MESSAGE_PREFIX}: ${error.message}`
    );
  }
  return createAssistantAPIErrorMessage(API_ERROR_MESSAGE_PREFIX);
}
function addCacheBreakpoints(messages) {
  return messages.map((msg, index) => {
    return msg.type === "user" ? userMessageToMessageParam(msg, index > messages.length - 3) : assistantMessageToMessageParam(msg, index > messages.length - 3);
  });
}
async function queryOpenAI(messages, systemPrompt, maxThinkingTokens, tools, signal, options) {
  const config = getGlobalConfig();
  const modelManager = getModelManager();
  const toolUseContext = options?.toolUseContext;
  const modelProfile = options?.modelProfile || modelManager.getModel("main");
  let model;
  const currentRequest = getCurrentRequest();
  debug.api("MODEL_CONFIG_OPENAI", {
    modelProfileFound: !!modelProfile,
    modelProfileId: modelProfile?.modelName,
    modelProfileName: modelProfile?.name,
    modelProfileModelName: modelProfile?.modelName,
    modelProfileProvider: modelProfile?.provider,
    modelProfileBaseURL: modelProfile?.baseURL,
    modelProfileApiKeyExists: !!modelProfile?.apiKey,
    optionsModel: options?.model,
    requestId: getCurrentRequest()?.id
  });
  if (modelProfile) {
    model = modelProfile.modelName;
  } else {
    model = options?.model || modelProfile?.modelName || "";
  }
  if (options?.prependCLISysprompt) {
    const [firstSyspromptBlock] = splitSysPromptPrefix(systemPrompt);
    systemPrompt = [getCLISyspromptPrefix() + systemPrompt];
  }
  const system = splitSysPromptPrefix(systemPrompt).map(
    (_) => ({
      ...PROMPT_CACHING_ENABLED ? { cache_control: { type: "ephemeral" } } : {},
      text: _,
      type: "text"
    })
  );
  const toolSchemas = await Promise.all(
    tools.map(
      async (_) => ({
        type: "function",
        function: {
          name: _.name,
          description: await _.prompt({
            safeMode: options?.safeMode
          }),
          parameters: "inputJSONSchema" in _ && _.inputJSONSchema ? _.inputJSONSchema : zodToJsonSchema4(_.inputSchema)
        }
      })
    )
  );
  const openaiSystem = system.map(
    (s) => ({
      role: "system",
      content: s.text
    })
  );
  const openaiMessages = convertAnthropicMessagesToOpenAIMessages2(messages);
  logSystemPromptConstruction({
    basePrompt: systemPrompt.join("\n"),
    danyaContext: generateDanyaContext() || "",
    reminders: [],
    finalPrompt: systemPrompt.join("\n")
  });
  let start = Date.now();
  let adapterContext = null;
  if (modelProfile && modelProfile.modelName) {
    debug.api("CHECKING_ADAPTER_SYSTEM", {
      modelProfileName: modelProfile.modelName,
      modelName: modelProfile.modelName,
      provider: modelProfile.provider,
      requestId: getCurrentRequest()?.id
    });
    const USE_NEW_ADAPTER_SYSTEM = process.env.USE_NEW_ADAPTERS !== "false";
    if (USE_NEW_ADAPTER_SYSTEM) {
      const shouldUseResponses = ModelAdapterFactory.shouldUseResponsesAPI(modelProfile);
      if (shouldUseResponses) {
        const adapter = ModelAdapterFactory.createAdapter(modelProfile);
        const reasoningEffort = await getReasoningEffort(modelProfile, messages);
        let verbosity = "medium";
        const modelNameLower = modelProfile.modelName.toLowerCase();
        if (modelNameLower.includes("high")) {
          verbosity = "high";
        } else if (modelNameLower.includes("low")) {
          verbosity = "low";
        }
        const unifiedParams = {
          messages: openaiMessages,
          systemPrompt: openaiSystem.map((s) => s.content),
          tools,
          maxTokens: options?.maxTokens ?? getMaxTokensFromProfile(modelProfile),
          stream: config.stream,
          reasoningEffort,
          temperature: options?.temperature ?? (isGPT5Model(model) ? 1 : MAIN_QUERY_TEMPERATURE),
          previousResponseId: toolUseContext?.responseState?.previousResponseId,
          verbosity,
          ...options?.stopSequences && options.stopSequences.length > 0 ? { stopSequences: options.stopSequences } : {}
        };
        adapterContext = {
          adapter,
          request: adapter.createRequest(unifiedParams),
          shouldUseResponses: true
        };
      }
    }
  }
  let queryResult;
  let startIncludingRetries = Date.now();
  try {
    queryResult = await withRetry(
      async () => {
        start = Date.now();
        if (adapterContext) {
          if (adapterContext.shouldUseResponses) {
            const { callGPT5ResponsesAPI } = await import("./openai-HHXFBOUM.js");
            const response = await callGPT5ResponsesAPI(
              modelProfile,
              adapterContext.request,
              signal
            );
            const unifiedResponse = await adapterContext.adapter.parseResponse(response);
            const assistantMessage2 = buildAssistantMessageFromUnifiedResponse(
              unifiedResponse,
              start
            );
            assistantMessage2.message.usage = normalizeUsage(
              assistantMessage2.message.usage
            );
            return {
              assistantMessage: assistantMessage2,
              rawResponse: unifiedResponse,
              apiFormat: "openai"
            };
          }
          const s2 = await getCompletionWithProfile(
            modelProfile,
            adapterContext.request,
            0,
            10,
            signal
          );
          let finalResponse2;
          if (config.stream) {
            finalResponse2 = await handleMessageStream(
              s2,
              signal
            );
          } else {
            finalResponse2 = s2;
          }
          const message2 = convertOpenAIResponseToAnthropic(finalResponse2, tools);
          const assistantMsg2 = {
            type: "assistant",
            message: message2,
            costUSD: 0,
            durationMs: Date.now() - start,
            uuid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          return {
            assistantMessage: assistantMsg2,
            rawResponse: finalResponse2,
            apiFormat: "openai"
          };
        }
        const maxTokens = options?.maxTokens ?? getMaxTokensFromProfile(modelProfile);
        const isGPT5 = isGPT5Model(model);
        const opts = {
          model,
          ...isGPT5 ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens },
          messages: [...openaiSystem, ...openaiMessages],
          temperature: options?.temperature ?? (isGPT5 ? 1 : MAIN_QUERY_TEMPERATURE)
        };
        if (options?.stopSequences && options.stopSequences.length > 0) {
          ;
          opts.stop = options.stopSequences;
        }
        if (config.stream) {
          ;
          opts.stream = true;
          opts.stream_options = {
            include_usage: true
          };
        }
        if (toolSchemas.length > 0) {
          opts.tools = toolSchemas;
          opts.tool_choice = "auto";
        }
        const reasoningEffort = await getReasoningEffort(modelProfile, messages);
        if (reasoningEffort) {
          opts.reasoning_effort = reasoningEffort;
        }
        const completionFunction = isGPT5Model(modelProfile?.modelName || "") ? getGPT5CompletionWithProfile : getCompletionWithProfile;
        const s = await completionFunction(modelProfile, opts, 0, 10, signal);
        let finalResponse;
        if (opts.stream) {
          finalResponse = await handleMessageStream(
            s,
            signal
          );
        } else {
          finalResponse = s;
        }
        const message = convertOpenAIResponseToAnthropic(finalResponse, tools);
        const assistantMsg = {
          type: "assistant",
          message,
          costUSD: 0,
          durationMs: Date.now() - start,
          uuid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        return {
          assistantMessage: assistantMsg,
          rawResponse: finalResponse,
          apiFormat: "openai"
        };
      },
      { signal }
    );
  } catch (error) {
    logError(error);
    return getAssistantMessageFromError(error);
  }
  const durationMs = Date.now() - start;
  const durationMsIncludingRetries = Date.now() - startIncludingRetries;
  const assistantMessage = queryResult.assistantMessage;
  assistantMessage.message.content = normalizeContentFromAPI(
    assistantMessage.message.content || []
  );
  const normalizedUsage = normalizeUsage(assistantMessage.message.usage);
  assistantMessage.message.usage = normalizedUsage;
  const inputTokens = normalizedUsage.input_tokens ?? 0;
  const outputTokens = normalizedUsage.output_tokens ?? 0;
  const cacheReadInputTokens = normalizedUsage.cache_read_input_tokens ?? 0;
  const cacheCreationInputTokens = normalizedUsage.cache_creation_input_tokens ?? 0;
  const costUSD = inputTokens / 1e6 * SONNET_COST_PER_MILLION_INPUT_TOKENS + outputTokens / 1e6 * SONNET_COST_PER_MILLION_OUTPUT_TOKENS + cacheReadInputTokens / 1e6 * SONNET_COST_PER_MILLION_PROMPT_CACHE_READ_TOKENS + cacheCreationInputTokens / 1e6 * SONNET_COST_PER_MILLION_PROMPT_CACHE_WRITE_TOKENS;
  addToTotalCost(costUSD, durationMsIncludingRetries);
  logLLMInteraction({
    systemPrompt: systemPrompt.join("\n"),
    messages: [...openaiSystem, ...openaiMessages],
    response: assistantMessage.message || queryResult.rawResponse,
    usage: {
      inputTokens,
      outputTokens
    },
    timing: {
      start,
      end: Date.now()
    },
    apiFormat: queryResult.apiFormat
  });
  assistantMessage.costUSD = costUSD;
  assistantMessage.durationMs = durationMs;
  assistantMessage.uuid = assistantMessage.uuid || randomUUID();
  return assistantMessage;
}
function getMaxTokensFromProfile(modelProfile) {
  return modelProfile?.maxTokens || 8e3;
}
function buildAssistantMessageFromUnifiedResponse(unifiedResponse, startTime) {
  const contentBlocks = [...unifiedResponse.content || []];
  if (unifiedResponse.toolCalls && unifiedResponse.toolCalls.length > 0) {
    for (const toolCall of unifiedResponse.toolCalls) {
      const tool = toolCall.function;
      const toolName = tool?.name;
      let toolArgs = {};
      try {
        toolArgs = tool?.arguments ? JSON.parse(tool.arguments) : {};
      } catch (e) {
      }
      contentBlocks.push({
        type: "tool_use",
        input: toolArgs,
        name: toolName,
        id: toolCall.id?.length > 0 ? toolCall.id : nanoid()
      });
    }
  }
  return {
    type: "assistant",
    message: {
      role: "assistant",
      content: contentBlocks,
      usage: {
        input_tokens: unifiedResponse.usage?.promptTokens ?? unifiedResponse.usage?.input_tokens ?? 0,
        output_tokens: unifiedResponse.usage?.completionTokens ?? unifiedResponse.usage?.output_tokens ?? 0,
        prompt_tokens: unifiedResponse.usage?.promptTokens ?? unifiedResponse.usage?.input_tokens ?? 0,
        completion_tokens: unifiedResponse.usage?.completionTokens ?? unifiedResponse.usage?.output_tokens ?? 0,
        promptTokens: unifiedResponse.usage?.promptTokens ?? unifiedResponse.usage?.input_tokens ?? 0,
        completionTokens: unifiedResponse.usage?.completionTokens ?? unifiedResponse.usage?.output_tokens ?? 0,
        totalTokens: unifiedResponse.usage?.totalTokens ?? (unifiedResponse.usage?.promptTokens ?? unifiedResponse.usage?.input_tokens ?? 0) + (unifiedResponse.usage?.completionTokens ?? unifiedResponse.usage?.output_tokens ?? 0)
      }
    },
    costUSD: 0,
    durationMs: Date.now() - startTime,
    uuid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    responseId: unifiedResponse.responseId
  };
}
function normalizeUsage(usage) {
  if (!usage) {
    return {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0
    };
  }
  const inputTokens = usage.input_tokens ?? usage.prompt_tokens ?? usage.inputTokens ?? 0;
  const outputTokens = usage.output_tokens ?? usage.completion_tokens ?? usage.outputTokens ?? 0;
  const cacheReadInputTokens = usage.cache_read_input_tokens ?? usage.prompt_token_details?.cached_tokens ?? usage.cacheReadInputTokens ?? 0;
  const cacheCreationInputTokens = usage.cache_creation_input_tokens ?? usage.cacheCreatedInputTokens ?? 0;
  return {
    ...usage,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_read_input_tokens: cacheReadInputTokens,
    cache_creation_input_tokens: cacheCreationInputTokens
  };
}
function getModelInputTokenCostUSD(model) {
  for (const providerModels of Object.values(models_default)) {
    const modelInfo = providerModels.find((m) => m.model === model);
    if (modelInfo) {
      return modelInfo.input_cost_per_token || 0;
    }
  }
  return 3e-6;
}
function getModelOutputTokenCostUSD(model) {
  for (const providerModels of Object.values(models_default)) {
    const modelInfo = providerModels.find((m) => m.model === model);
    if (modelInfo) {
      return modelInfo.output_cost_per_token || 0;
    }
  }
  return 15e-6;
}
async function queryModel(modelPointer, messages, systemPrompt = [], signal) {
  return queryLLM(
    messages,
    systemPrompt,
    0,
    [],
    signal || new AbortController().signal,
    {
      safeMode: false,
      model: modelPointer,
      prependCLISysprompt: true
    }
  );
}
async function queryQuick({
  systemPrompt = [],
  userPrompt,
  assistantPrompt,
  enablePromptCaching = false,
  signal
}) {
  const messages = [
    {
      message: { role: "user", content: userPrompt },
      type: "user",
      uuid: randomUUID()
    }
  ];
  return queryModel("quick", messages, systemPrompt, signal);
}
export {
  API_ERROR_MESSAGE_PREFIX,
  CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE,
  INVALID_API_KEY_ERROR_MESSAGE,
  MAIN_QUERY_TEMPERATURE,
  NO_CONTENT_MESSAGE,
  PROMPT_TOO_LONG_ERROR_MESSAGE,
  assistantMessageToMessageParam,
  fetchAnthropicModels,
  formatSystemPromptWithContext,
  generateDanyaContext,
  getAnthropicClient,
  queryLLM,
  queryModel,
  queryQuick,
  refreshDanyaContext,
  resetAnthropicClient,
  userMessageToMessageParam,
  verifyApiKey
};
