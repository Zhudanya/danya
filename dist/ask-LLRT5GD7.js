import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-XB6UWJYI.js";
import "./chunk-LBUWJ2JN.js";
import "./chunk-3KCU3YD7.js";
import "./chunk-JB42JNJP.js";
import "./chunk-WJF5XPSX.js";
import "./chunk-RKX7V3SL.js";
import "./chunk-EVEASQMY.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-F7ZHCY44.js";
import "./chunk-X5J77R43.js";
import "./chunk-OOPXBCPF.js";
import "./chunk-2NGT654O.js";
import "./chunk-Z2RXTTVJ.js";
import "./chunk-NHG72EEA.js";
import "./chunk-W4JESC7O.js";
import "./chunk-NTB47SQG.js";
import "./chunk-IQYKVFIG.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-4QBTZC7L.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-VCL3NZI7.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-2UUQ3FTV.js";
import {
  getModelManager,
  init_model
} from "./chunk-M754P6WC.js";
import {
  getContext,
  init_context
} from "./chunk-PV4NJEXF.js";
import "./chunk-AOPQNR4B.js";
import "./chunk-QZ442EHC.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-PPXRQ4YY.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-LUEVEFPD.js";
import "./chunk-ZJSKZ6EL.js";
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
