import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-2ETKXT47.js";
import "./chunk-II6NDTE4.js";
import "./chunk-56RSZR7W.js";
import "./chunk-KPRKPI7K.js";
import "./chunk-EZEUZWBE.js";
import "./chunk-PKNQHQCB.js";
import "./chunk-A3ZYQ6LV.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-R3LYUVAF.js";
import "./chunk-X5J77R43.js";
import "./chunk-5SIUXQRU.js";
import "./chunk-CAXDIZNI.js";
import "./chunk-BR2UYGVT.js";
import "./chunk-4OPPD2LQ.js";
import "./chunk-XR3GXTKO.js";
import "./chunk-UX3OCHT5.js";
import "./chunk-H2NGWALY.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-RIAXZPGP.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-JMFKELD4.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-LRD33J36.js";
import {
  getModelManager,
  init_model
} from "./chunk-6FAHW4WI.js";
import {
  getContext,
  init_context
} from "./chunk-QSCQMWZX.js";
import "./chunk-JCOYUAGO.js";
import "./chunk-SI5FIKAE.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-5EAAFPEU.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-NGBTEKOZ.js";
import "./chunk-FHMQUTJ3.js";
import {
  getTotalCost,
  init_costTracker
} from "./chunk-SDQQA5KA.js";
import "./chunk-M3TKNAUR.js";

// src/app/ask.ts
init_prompts();
init_context();
init_costTracker();
init_query();
init_model();
init_state();
init_log();
init_messages();
import { last } from "lodash-es";
async function ask({
  commands,
  safeMode,
  hasPermissionsToUseTool,
  messageLogName,
  prompt,
  cwd,
  tools,
  verbose = false,
  initialMessages,
  persistSession = true
}) {
  await setCwd(cwd);
  const message = createUserMessage(prompt);
  const messages = [...initialMessages ?? [], message];
  const [systemPrompt, context, model] = await Promise.all([
    getSystemPrompt(),
    getContext(),
    getModelManager().getModelName("main")
  ]);
  for await (const m of query(
    messages,
    systemPrompt,
    context,
    hasPermissionsToUseTool,
    {
      options: {
        commands,
        tools,
        verbose,
        safeMode,
        forkNumber: 0,
        messageLogName: "unused",
        maxThinkingTokens: 0,
        persistSession
      },
      abortController: new AbortController(),
      messageId: void 0,
      readFileTimestamps: {},
      setToolJSX: () => {
      }
    }
  )) {
    messages.push(m);
  }
  const result = last(messages);
  if (!result || result.type !== "assistant") {
    throw new Error("Expected content to be an assistant message");
  }
  const textContent = result.message.content.find((c) => c.type === "text");
  if (!textContent) {
    throw new Error(
      `Expected at least one text content item, but got ${JSON.stringify(
        result.message.content,
        null,
        2
      )}`
    );
  }
  const messageHistoryFile = getMessagesPath(messageLogName, 0, 0);
  overwriteLog(messageHistoryFile, messages);
  return {
    resultText: textContent.text,
    totalCost: getTotalCost(),
    messageHistoryFile
  };
}
export {
  ask
};
