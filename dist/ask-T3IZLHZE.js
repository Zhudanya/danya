import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-VWJXXSBZ.js";
import "./chunk-GTNDFKUQ.js";
import "./chunk-I5RUD77Q.js";
import "./chunk-TLJKPKU6.js";
import "./chunk-MXNHL36F.js";
import "./chunk-KMDHIVO4.js";
import "./chunk-ANJS6CBT.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-XQSQESKD.js";
import "./chunk-X5J77R43.js";
import "./chunk-DUFUU7OC.js";
import "./chunk-JAZFZ5S6.js";
import "./chunk-P5W73F66.js";
import "./chunk-B3XOLDR4.js";
import "./chunk-PSBIG2KM.js";
import "./chunk-3CAATSHN.js";
import "./chunk-OWVROMOP.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-QXL63TYE.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-TBFODY3K.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-KWRA54OY.js";
import {
  getModelManager,
  init_model
} from "./chunk-M7TKGSVK.js";
import {
  getContext,
  init_context
} from "./chunk-RGTVY4EY.js";
import "./chunk-KFOVJKLG.js";
import "./chunk-7RMU3EY3.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-4IN3CA7J.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-47Q2VMTW.js";
import "./chunk-HLV7FB2P.js";
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
