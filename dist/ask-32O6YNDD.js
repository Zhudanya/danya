import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-MPPI3S7K.js";
import "./chunk-Q6XDQ3AT.js";
import "./chunk-MHTBVQBS.js";
import "./chunk-IXZ4P5D3.js";
import "./chunk-EWRSJYUY.js";
import "./chunk-S6XXLPM2.js";
import "./chunk-EDAO4VR3.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-XLSEUN5N.js";
import "./chunk-X5J77R43.js";
import "./chunk-EL74OXJ4.js";
import "./chunk-WT4XBXYX.js";
import "./chunk-GW46LCO4.js";
import "./chunk-3MZEENE3.js";
import "./chunk-BTZ4R76V.js";
import "./chunk-AM6J2PIK.js";
import "./chunk-HOFE63J3.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-QORI6OT3.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-TEQWBBNP.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-ZR5WPEB5.js";
import {
  getModelManager,
  init_model
} from "./chunk-AHDVFYCY.js";
import {
  getContext,
  init_context
} from "./chunk-XKUNK6I7.js";
import "./chunk-CADH3HVO.js";
import "./chunk-IXSBQ5SS.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-25H3VI24.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-T4EWAMW6.js";
import "./chunk-5RFHLD2N.js";
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
