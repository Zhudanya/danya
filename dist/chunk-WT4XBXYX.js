import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSessionState,
  init_sessionState,
  setSessionState
} from "./chunk-OOPWPZWL.js";
import {
  getGlobalConfig,
  init_config
} from "./chunk-IXSBQ5SS.js";
import {
  debug,
  getCurrentRequest,
  init_debugLogger,
  logAPIError
} from "./chunk-25H3VI24.js";
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/services/ai/openai.ts
function getRetryDelay(attempt, retryAfter) {
  if (retryAfter) {
    const retryAfterMs = parseInt(retryAfter) * 1e3;
    if (!isNaN(retryAfterMs) && retryAfterMs > 0) {
      return Math.min(retryAfterMs, RETRY_CONFIG.MAX_SERVER_DELAY_MS);
    }
  }
  const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt - 1);
  const jitter = Math.random() * RETRY_CONFIG.JITTER_FACTOR * delay;
  return Math.min(delay + jitter, RETRY_CONFIG.MAX_DELAY_MS);
}
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
function getModelErrorKey(baseURL, model, type) {
  return `${baseURL}:${model}:${type}`;
}
function hasModelError(baseURL, model, type) {
  return !!getSessionState("modelErrors")[getModelErrorKey(baseURL, model, type)];
}
function setModelError(baseURL, model, type, error) {
  setSessionState("modelErrors", {
    [getModelErrorKey(baseURL, model, type)]: error
  });
}
function getModelFeatures(modelName) {
  if (!modelName || typeof modelName !== "string") {
    return { usesMaxCompletionTokens: false };
  }
  if (MODEL_FEATURES[modelName]) {
    return MODEL_FEATURES[modelName];
  }
  if (modelName.toLowerCase().includes("gpt-5")) {
    return {
      usesMaxCompletionTokens: true,
      supportsResponsesAPI: true,
      requiresTemperatureOne: true,
      supportsVerbosityControl: true,
      supportsCustomTools: true,
      supportsAllowedTools: true
    };
  }
  for (const [key, features] of Object.entries(MODEL_FEATURES)) {
    if (modelName.includes(key)) {
      return features;
    }
  }
  return { usesMaxCompletionTokens: false };
}
function applyModelSpecificTransformations(opts) {
  if (!opts.model || typeof opts.model !== "string") {
    return;
  }
  const features = getModelFeatures(opts.model);
  const isGPT5 = opts.model.toLowerCase().includes("gpt-5");
  if (isGPT5 || features.usesMaxCompletionTokens) {
    if ("max_tokens" in opts && !("max_completion_tokens" in opts)) {
      debug.api("OPENAI_TRANSFORM_MAX_TOKENS", {
        model: opts.model,
        from: opts.max_tokens
      });
      opts.max_completion_tokens = opts.max_tokens;
      delete opts.max_tokens;
    }
    if (features.requiresTemperatureOne && "temperature" in opts) {
      if (opts.temperature !== 1 && opts.temperature !== void 0) {
        debug.api("OPENAI_TRANSFORM_TEMPERATURE", {
          model: opts.model,
          from: opts.temperature,
          to: 1
        });
        opts.temperature = 1;
      }
    }
    if (isGPT5) {
      delete opts.frequency_penalty;
      delete opts.presence_penalty;
      delete opts.logit_bias;
      delete opts.user;
      if (!opts.reasoning_effort && features.supportsVerbosityControl) {
        opts.reasoning_effort = "medium";
      }
    }
  } else {
    if (features.usesMaxCompletionTokens && "max_tokens" in opts && !("max_completion_tokens" in opts)) {
      opts.max_completion_tokens = opts.max_tokens;
      delete opts.max_tokens;
    }
  }
}
async function applyModelErrorFixes(opts, baseURL) {
  const isGPT5 = opts.model.startsWith("gpt-5");
  const handlers = isGPT5 ? [...GPT5_ERROR_HANDLERS, ...ERROR_HANDLERS] : ERROR_HANDLERS;
  for (const handler of handlers) {
    if (hasModelError(baseURL, opts.model, handler.type)) {
      await handler.fix(opts);
      return;
    }
  }
}
async function tryWithEndpointFallback(baseURL, opts, headers, provider, proxy, signal) {
  const endpointsToTry = [];
  if (provider === "minimax") {
    endpointsToTry.push("/text/chatcompletion_v2", "/chat/completions");
  } else {
    endpointsToTry.push("/chat/completions");
  }
  let lastError = null;
  for (const endpoint of endpointsToTry) {
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(opts.stream ? { ...opts, stream: true } : opts),
        ...proxy ? { dispatcher: proxy } : {},
        signal
      });
      if (response.ok) {
        return { response, endpoint };
      }
      if (response.status === 404 && endpointsToTry.length > 1) {
        debug.api("OPENAI_ENDPOINT_FALLBACK", {
          endpoint,
          status: 404,
          reason: "not_found"
        });
        continue;
      }
      return { response, endpoint };
    } catch (error) {
      lastError = error;
      if (endpointsToTry.indexOf(endpoint) < endpointsToTry.length - 1) {
        debug.api("OPENAI_ENDPOINT_FALLBACK", {
          endpoint,
          reason: "network_error",
          error: error instanceof Error ? error.message : String(error)
        });
        continue;
      }
    }
  }
  throw lastError || new Error("All endpoints failed");
}
async function getCompletionWithProfile(modelProfile, opts, attempt = 0, maxAttempts = 10, signal) {
  if (attempt >= maxAttempts) {
    throw new Error("Max attempts reached");
  }
  const provider = modelProfile?.provider || "anthropic";
  const baseURL = modelProfile?.baseURL;
  const apiKey = modelProfile?.apiKey;
  const proxy = getGlobalConfig().proxy ? new ProxyAgent(getGlobalConfig().proxy) : void 0;
  const headers = {
    "Content-Type": "application/json"
  };
  if (apiKey) {
    if (provider === "azure") {
      headers["api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
  }
  applyModelSpecificTransformations(opts);
  await applyModelErrorFixes(opts, baseURL || "");
  debug.api("OPENAI_API_CALL_START", {
    endpoint: baseURL || "DEFAULT_OPENAI",
    model: opts.model,
    provider,
    apiKeyConfigured: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) : null,
    maxTokens: opts.max_tokens,
    temperature: opts.temperature,
    messageCount: opts.messages?.length || 0,
    streamMode: opts.stream,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    modelProfileModelName: modelProfile?.modelName,
    modelProfileName: modelProfile?.name
  });
  opts.messages = opts.messages.map((msg) => {
    if (msg.role === "tool") {
      if (Array.isArray(msg.content)) {
        return {
          ...msg,
          content: msg.content.map((c) => c.text || "").filter(Boolean).join("\n\n") || "(empty content)"
        };
      } else if (typeof msg.content !== "string") {
        return {
          ...msg,
          content: typeof msg.content === "undefined" ? "(empty content)" : JSON.stringify(msg.content)
        };
      }
    }
    return msg;
  });
  const azureApiVersion = "2024-06-01";
  let endpoint = "/chat/completions";
  if (provider === "azure") {
    endpoint = `/chat/completions?api-version=${azureApiVersion}`;
  } else if (provider === "minimax") {
    endpoint = "/text/chatcompletion_v2";
  }
  try {
    if (opts.stream) {
      const isOpenAICompatible2 = [
        "minimax",
        "kimi",
        "deepseek",
        "siliconflow",
        "qwen",
        "glm",
        "glm-coding",
        "baidu-qianfan",
        "openai",
        "mistral",
        "xai",
        "groq",
        "custom-openai"
      ].includes(provider);
      let response2;
      let usedEndpoint2;
      if (isOpenAICompatible2 && provider !== "azure") {
        const result = await tryWithEndpointFallback(
          baseURL,
          opts,
          headers,
          provider,
          proxy,
          signal
        );
        response2 = result.response;
        usedEndpoint2 = result.endpoint;
      } else {
        response2 = await fetch(`${baseURL}${endpoint}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...opts, stream: true }),
          ...proxy ? { dispatcher: proxy } : {},
          signal
        });
        usedEndpoint2 = endpoint;
      }
      if (!response2.ok) {
        if (signal?.aborted) {
          throw new Error("Request cancelled by user");
        }
        try {
          const errorData = await response2.json();
          const hasError = (data) => {
            return typeof data === "object" && data !== null;
          };
          const errorMessage = hasError(errorData) ? errorData.error?.message || errorData.message || `HTTP ${response2.status}` : `HTTP ${response2.status}`;
          const isGPT5 = opts.model.startsWith("gpt-5");
          const handlers = isGPT5 ? [...GPT5_ERROR_HANDLERS, ...ERROR_HANDLERS] : ERROR_HANDLERS;
          for (const handler of handlers) {
            if (handler.detect(errorMessage)) {
              debug.api("OPENAI_MODEL_ERROR_DETECTED", {
                model: opts.model,
                type: handler.type,
                errorMessage,
                status: response2.status
              });
              setModelError(
                baseURL || "",
                opts.model,
                handler.type,
                errorMessage
              );
              await handler.fix(opts);
              debug.api("OPENAI_MODEL_ERROR_FIXED", {
                model: opts.model,
                type: handler.type
              });
              return getCompletionWithProfile(
                modelProfile,
                opts,
                attempt + 1,
                maxAttempts,
                signal
              );
            }
          }
          debug.warn("OPENAI_API_ERROR_UNHANDLED", {
            model: opts.model,
            status: response2.status,
            errorMessage
          });
          logAPIError({
            model: opts.model,
            endpoint: `${baseURL}${endpoint}`,
            status: response2.status,
            error: errorMessage,
            request: opts,
            response: errorData,
            provider
          });
        } catch (parseError) {
          debug.warn("OPENAI_API_ERROR_PARSE_FAILED", {
            model: opts.model,
            status: response2.status,
            error: parseError instanceof Error ? parseError.message : String(parseError)
          });
          logAPIError({
            model: opts.model,
            endpoint: `${baseURL}${endpoint}`,
            status: response2.status,
            error: `Could not parse error response: ${parseError.message}`,
            request: opts,
            response: { parseError: parseError.message },
            provider
          });
        }
        const delayMs = getRetryDelay(attempt);
        debug.warn("OPENAI_API_RETRY", {
          model: opts.model,
          status: response2.status,
          attempt: attempt + 1,
          maxAttempts,
          delayMs
        });
        try {
          await abortableDelay(delayMs, signal);
        } catch (error) {
          if (error.message === "Request was aborted") {
            throw new Error("Request cancelled by user");
          }
          throw error;
        }
        return getCompletionWithProfile(
          modelProfile,
          opts,
          attempt + 1,
          maxAttempts,
          signal
        );
      }
      const stream = createStreamProcessor(response2.body, signal);
      return stream;
    }
    const isOpenAICompatible = [
      "minimax",
      "kimi",
      "deepseek",
      "siliconflow",
      "qwen",
      "glm",
      "baidu-qianfan",
      "openai",
      "mistral",
      "xai",
      "groq",
      "custom-openai"
    ].includes(provider);
    let response;
    let usedEndpoint;
    if (isOpenAICompatible && provider !== "azure") {
      const result = await tryWithEndpointFallback(
        baseURL,
        opts,
        headers,
        provider,
        proxy,
        signal
      );
      response = result.response;
      usedEndpoint = result.endpoint;
    } else {
      response = await fetch(`${baseURL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(opts),
        ...proxy ? { dispatcher: proxy } : {},
        signal
      });
      usedEndpoint = endpoint;
    }
    if (!response.ok) {
      if (signal?.aborted) {
        throw new Error("Request cancelled by user");
      }
      try {
        const errorData = await response.json();
        const hasError = (data) => {
          return typeof data === "object" && data !== null;
        };
        const errorMessage = hasError(errorData) ? errorData.error?.message || errorData.message || `HTTP ${response.status}` : `HTTP ${response.status}`;
        const isGPT5 = opts.model.startsWith("gpt-5");
        const handlers = isGPT5 ? [...GPT5_ERROR_HANDLERS, ...ERROR_HANDLERS] : ERROR_HANDLERS;
        for (const handler of handlers) {
          if (handler.detect(errorMessage)) {
            debug.api("OPENAI_MODEL_ERROR_DETECTED", {
              model: opts.model,
              type: handler.type,
              errorMessage,
              status: response.status
            });
            setModelError(baseURL || "", opts.model, handler.type, errorMessage);
            await handler.fix(opts);
            debug.api("OPENAI_MODEL_ERROR_FIXED", {
              model: opts.model,
              type: handler.type
            });
            return getCompletionWithProfile(
              modelProfile,
              opts,
              attempt + 1,
              maxAttempts,
              signal
            );
          }
        }
        debug.warn("OPENAI_API_ERROR_UNHANDLED", {
          model: opts.model,
          status: response.status,
          errorMessage
        });
      } catch (parseError) {
        debug.warn("OPENAI_API_ERROR_PARSE_FAILED", {
          model: opts.model,
          status: response.status,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }
      const delayMs = getRetryDelay(attempt);
      debug.warn("OPENAI_API_RETRY", {
        model: opts.model,
        status: response.status,
        attempt: attempt + 1,
        maxAttempts,
        delayMs
      });
      try {
        await abortableDelay(delayMs, signal);
      } catch (error) {
        if (error.message === "Request was aborted") {
          throw new Error("Request cancelled by user");
        }
        throw error;
      }
      return getCompletionWithProfile(
        modelProfile,
        opts,
        attempt + 1,
        maxAttempts,
        signal
      );
    }
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    if (signal?.aborted) {
      throw new Error("Request cancelled by user");
    }
    if (attempt < maxAttempts) {
      if (signal?.aborted) {
        throw new Error("Request cancelled by user");
      }
      const delayMs = getRetryDelay(attempt);
      debug.warn("OPENAI_NETWORK_RETRY", {
        model: opts.model,
        attempt: attempt + 1,
        maxAttempts,
        delayMs,
        error: error instanceof Error ? error.message : String(error)
      });
      try {
        await abortableDelay(delayMs, signal);
      } catch (error2) {
        if (error2.message === "Request was aborted") {
          throw new Error("Request cancelled by user");
        }
        throw error2;
      }
      return getCompletionWithProfile(
        modelProfile,
        opts,
        attempt + 1,
        maxAttempts,
        signal
      );
    }
    throw error;
  }
}
function createStreamProcessor(stream, signal) {
  if (!stream) {
    throw new Error("Stream is null or undefined");
  }
  return (async function* () {
    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    try {
      while (true) {
        if (signal?.aborted) {
          break;
        }
        let readResult;
        try {
          readResult = await reader.read();
        } catch (e) {
          if (signal?.aborted) {
            break;
          }
          debug.warn("OPENAI_STREAM_READ_ERROR", {
            error: e instanceof Error ? e.message : String(e)
          });
          break;
        }
        const { done, value } = readResult;
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        let lineEnd = buffer.indexOf("\n");
        while (lineEnd !== -1) {
          const line = buffer.substring(0, lineEnd).trim();
          buffer = buffer.substring(lineEnd + 1);
          if (line === "data: [DONE]") {
            continue;
          }
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              debug.warn("OPENAI_STREAM_JSON_PARSE_ERROR", {
                data,
                error: e instanceof Error ? e.message : String(e)
              });
            }
          }
          lineEnd = buffer.indexOf("\n");
        }
      }
      if (buffer.trim()) {
        const lines = buffer.trim().split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            const data = line.slice(6).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              debug.warn("OPENAI_STREAM_FINAL_JSON_PARSE_ERROR", {
                data,
                error: e instanceof Error ? e.message : String(e)
              });
            }
          }
        }
      }
    } catch (e) {
      debug.warn("OPENAI_STREAM_UNEXPECTED_ERROR", {
        error: e instanceof Error ? e.message : String(e)
      });
    } finally {
      try {
        reader.releaseLock();
      } catch (e) {
        debug.warn("OPENAI_STREAM_RELEASE_LOCK_ERROR", {
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }
  })();
}
function streamCompletion(stream, signal) {
  return createStreamProcessor(stream, signal);
}
async function callGPT5ResponsesAPI(modelProfile, request, signal) {
  const baseURL = modelProfile?.baseURL || "https://api.openai.com/v1";
  const apiKey = modelProfile?.apiKey;
  const proxy = getGlobalConfig().proxy ? new ProxyAgent(getGlobalConfig().proxy) : void 0;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };
  const responsesParams = request;
  try {
    const response = await fetch(`${baseURL}/responses`, {
      method: "POST",
      headers,
      body: JSON.stringify(responsesParams),
      ...proxy ? { dispatcher: proxy } : {},
      signal
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GPT-5 Responses API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
    return response;
  } catch (error) {
    if (signal?.aborted) {
      throw new Error("Request cancelled by user");
    }
    throw error;
  }
}
async function getGPT5CompletionWithProfile(modelProfile, opts, attempt = 0, maxAttempts = 10, signal) {
  const features = getModelFeatures(opts.model);
  const isOfficialOpenAI = !modelProfile.baseURL || modelProfile.baseURL.includes("api.openai.com");
  if (!isOfficialOpenAI) {
    debug.api("GPT5_THIRD_PARTY_PROVIDER", {
      model: opts.model,
      baseURL: modelProfile.baseURL,
      provider: modelProfile.provider,
      supportsResponsesAPI: features.supportsResponsesAPI,
      requestId: getCurrentRequest()?.id
    });
    debug.api("GPT5_PROVIDER_THIRD_PARTY_NOTICE", {
      model: opts.model,
      provider: modelProfile.provider,
      baseURL: modelProfile.baseURL
    });
    if (modelProfile.provider === "azure") {
      delete opts.reasoning_effort;
    } else if (modelProfile.provider === "custom-openai") {
      debug.api("GPT5_CUSTOM_PROVIDER_OPTIMIZATIONS", {
        model: opts.model,
        provider: modelProfile.provider
      });
    }
  } else if (opts.stream) {
    debug.api("GPT5_STREAMING_MODE", {
      model: opts.model,
      baseURL: modelProfile.baseURL || "official",
      reason: "responses_api_no_streaming",
      requestId: getCurrentRequest()?.id
    });
    debug.api("GPT5_STREAMING_FALLBACK_TO_CHAT_COMPLETIONS", {
      model: opts.model,
      reason: "responses_api_no_streaming"
    });
  }
  debug.api("USING_CHAT_COMPLETIONS_FOR_GPT5", {
    model: opts.model,
    baseURL: modelProfile.baseURL || "official",
    provider: modelProfile.provider,
    reason: isOfficialOpenAI ? "streaming_or_fallback" : "third_party_provider",
    requestId: getCurrentRequest()?.id
  });
  return await getCompletionWithProfile(
    modelProfile,
    opts,
    attempt,
    maxAttempts,
    signal
  );
}
async function fetchCustomModels(baseURL, apiKey) {
  try {
    const hasVersionNumber = /\/v\d+/.test(baseURL);
    const cleanBaseURL = baseURL.replace(/\/+$/, "");
    const modelsURL = hasVersionNumber ? `${cleanBaseURL}/models` : `${cleanBaseURL}/v1/models`;
    const response = await fetch(modelsURL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Invalid API key. Please check your API key and try again."
        );
      } else if (response.status === 403) {
        throw new Error(
          "API key does not have permission to access models. Please check your API key permissions."
        );
      } else if (response.status === 404) {
        throw new Error(
          "API endpoint not found. Please check if the base URL is correct and supports the /models endpoint."
        );
      } else if (response.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again."
        );
      } else if (response.status >= 500) {
        throw new Error(
          "API service is temporarily unavailable. Please try again later."
        );
      } else {
        throw new Error(
          `Unable to connect to API (${response.status}). Please check your base URL, API key, and internet connection.`
        );
      }
    }
    const data = await response.json();
    const hasDataArray = (obj) => {
      return typeof obj === "object" && obj !== null && "data" in obj && Array.isArray(obj.data);
    };
    const hasModelsArray = (obj) => {
      return typeof obj === "object" && obj !== null && "models" in obj && Array.isArray(obj.models);
    };
    let models = [];
    if (hasDataArray(data)) {
      models = data.data;
    } else if (Array.isArray(data)) {
      models = data;
    } else if (hasModelsArray(data)) {
      models = data.models;
    } else {
      throw new Error(
        'API returned unexpected response format. Expected an array of models or an object with a "data" or "models" array.'
      );
    }
    if (!Array.isArray(models)) {
      throw new Error("API response format error: models data is not an array.");
    }
    return models;
  } catch (error) {
    if (error instanceof Error && (error.message.includes("API key") || error.message.includes("API endpoint") || error.message.includes("API service") || error.message.includes("response format"))) {
      throw error;
    }
    debug.warn("CUSTOM_API_MODELS_FETCH_FAILED", {
      baseURL,
      error: error instanceof Error ? error.message : String(error)
    });
    if (error instanceof Error && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to the API. Please check the base URL and your internet connection."
      );
    }
    throw new Error(
      "Failed to fetch models from custom API. Please check your configuration and try again."
    );
  }
}
var ProxyAgent, RETRY_CONFIG, GPT5_ERROR_HANDLERS, ERROR_HANDLERS, MODEL_FEATURES;
var init_openai = __esm({
  "src/services/ai/openai.ts"() {
    init_config();
    init_sessionState();
    init_debugLogger();
    ProxyAgent = class {
      constructor(_url) {
      }
    };
    RETRY_CONFIG = {
      BASE_DELAY_MS: 1e3,
      MAX_DELAY_MS: 32e3,
      MAX_SERVER_DELAY_MS: 6e4,
      JITTER_FACTOR: 0.1
    };
    GPT5_ERROR_HANDLERS = [
      {
        type: "max_completion_tokens" /* MaxCompletionTokens */,
        detect: (errMsg) => {
          const lowerMsg = errMsg.toLowerCase();
          return lowerMsg.includes("unsupported parameter: 'max_tokens'") && lowerMsg.includes("'max_completion_tokens'") || lowerMsg.includes("max_tokens") && lowerMsg.includes("max_completion_tokens") || lowerMsg.includes("max_tokens") && lowerMsg.includes("not supported") || lowerMsg.includes("max_tokens") && lowerMsg.includes("use max_completion_tokens") || lowerMsg.includes("invalid parameter") && lowerMsg.includes("max_tokens") || lowerMsg.includes("parameter error") && lowerMsg.includes("max_tokens");
        },
        fix: async (opts) => {
          debug.api("GPT5_FIX_MAX_TOKENS", {
            from: opts.max_tokens,
            to: opts.max_tokens
          });
          if ("max_tokens" in opts) {
            opts.max_completion_tokens = opts.max_tokens;
            delete opts.max_tokens;
          }
        }
      },
      {
        type: "temperature_restriction" /* TemperatureRestriction */,
        detect: (errMsg) => {
          const lowerMsg = errMsg.toLowerCase();
          return lowerMsg.includes("temperature") && (lowerMsg.includes("only supports") || lowerMsg.includes("must be 1") || lowerMsg.includes("invalid temperature"));
        },
        fix: async (opts) => {
          debug.api("GPT5_FIX_TEMPERATURE", {
            from: opts.temperature,
            to: 1
          });
          opts.temperature = 1;
        }
      }
    ];
    ERROR_HANDLERS = [
      {
        type: "1024" /* MaxLength */,
        detect: (errMsg) => errMsg.includes("Expected a string with maximum length 1024"),
        fix: async (opts) => {
          const toolDescriptions = {};
          for (const tool of opts.tools || []) {
            if (tool.function.description.length <= 1024) continue;
            let str = "";
            let remainder = "";
            for (let line of tool.function.description.split("\n")) {
              if (str.length + line.length < 1024) {
                str += line + "\n";
              } else {
                remainder += line + "\n";
              }
            }
            tool.function.description = str;
            toolDescriptions[tool.function.name] = remainder;
          }
          if (Object.keys(toolDescriptions).length > 0) {
            let content = "<additional-tool-usage-instructions>\n\n";
            for (const [name, description] of Object.entries(toolDescriptions)) {
              content += `<${name}>
${description}
</${name}>

`;
            }
            content += "</additional-tool-usage-instructions>";
            for (let i = opts.messages.length - 1; i >= 0; i--) {
              if (opts.messages[i].role === "system") {
                opts.messages.splice(i + 1, 0, {
                  role: "system",
                  content
                });
                break;
              }
            }
          }
        }
      },
      {
        type: "max_completion_tokens" /* MaxCompletionTokens */,
        detect: (errMsg) => errMsg.includes("Use 'max_completion_tokens'"),
        fix: async (opts) => {
          opts.max_completion_tokens = opts.max_tokens;
          delete opts.max_tokens;
        }
      },
      {
        type: "stream_options" /* StreamOptions */,
        detect: (errMsg) => errMsg.includes("stream_options"),
        fix: async (opts) => {
          delete opts.stream_options;
        }
      },
      {
        type: "citations" /* Citations */,
        detect: (errMsg) => errMsg.includes("Extra inputs are not permitted") && errMsg.includes("citations"),
        fix: async (opts) => {
          if (!opts.messages) return;
          for (const message of opts.messages) {
            if (!message) continue;
            if (Array.isArray(message.content)) {
              for (const item of message.content) {
                if (item && typeof item === "object") {
                  const itemObj = item;
                  if ("citations" in itemObj) {
                    delete itemObj.citations;
                  }
                }
              }
            } else if (message.content && typeof message.content === "object") {
              const contentObj = message.content;
              if ("citations" in contentObj) {
                delete contentObj.citations;
              }
            }
          }
        }
      }
    ];
    MODEL_FEATURES = {
      o1: { usesMaxCompletionTokens: true },
      "o1-preview": { usesMaxCompletionTokens: true },
      "o1-mini": { usesMaxCompletionTokens: true },
      "o1-pro": { usesMaxCompletionTokens: true },
      "o3-mini": { usesMaxCompletionTokens: true },
      "gpt-5": {
        usesMaxCompletionTokens: true,
        supportsResponsesAPI: true,
        requiresTemperatureOne: true,
        supportsVerbosityControl: true,
        supportsCustomTools: true,
        supportsAllowedTools: true
      },
      "gpt-5-mini": {
        usesMaxCompletionTokens: true,
        supportsResponsesAPI: true,
        requiresTemperatureOne: true,
        supportsVerbosityControl: true,
        supportsCustomTools: true,
        supportsAllowedTools: true
      },
      "gpt-5-nano": {
        usesMaxCompletionTokens: true,
        supportsResponsesAPI: true,
        requiresTemperatureOne: true,
        supportsVerbosityControl: true,
        supportsCustomTools: true,
        supportsAllowedTools: true
      },
      "gpt-5-chat-latest": {
        usesMaxCompletionTokens: true,
        supportsResponsesAPI: false,
        requiresTemperatureOne: true,
        supportsVerbosityControl: true
      }
    };
  }
});

export {
  getModelFeatures,
  applyModelSpecificTransformations,
  getCompletionWithProfile,
  createStreamProcessor,
  streamCompletion,
  callGPT5ResponsesAPI,
  getGPT5CompletionWithProfile,
  fetchCustomModels,
  init_openai
};
