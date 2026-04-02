import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-EL4TYMFG.js";
import "./chunk-ZVTHFZVC.js";
import "./chunk-5G4CJRXC.js";
import "./chunk-EQ4343O6.js";
import "./chunk-MA3E4C3D.js";
import "./chunk-6KDTYOEC.js";
import "./chunk-IPNSWN2V.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-CXHK5KMD.js";
import "./chunk-X5J77R43.js";
import "./chunk-FDPYNXS5.js";
import "./chunk-3Q6FP5OW.js";
import "./chunk-J6G7BF7P.js";
import "./chunk-ZQFPPXAE.js";
import "./chunk-52QVZRB3.js";
import "./chunk-M7TET4KT.js";
import "./chunk-BGTVUX52.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-ZL4EOIOL.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-J33POJGJ.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-XFWAZMZJ.js";
import {
  getModelManager,
  init_model
} from "./chunk-OJXD6PAW.js";
import {
  getContext,
  init_context
} from "./chunk-BE7LPJEX.js";
import "./chunk-H3Y22PUP.js";
import "./chunk-HBGDGK5Y.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-KNCVPLW3.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-WV65MPNS.js";
import "./chunk-6SN4DOM2.js";
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
