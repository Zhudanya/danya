import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-RRZ3LOVV.js";
import "./chunk-PZHHTH22.js";
import "./chunk-M6HSJABB.js";
import "./chunk-KGAXQGBL.js";
import "./chunk-XDOTJSGQ.js";
import "./chunk-EZ7VV5PL.js";
import "./chunk-FQDBAAWF.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-265UCRXM.js";
import "./chunk-X5J77R43.js";
import "./chunk-P54FCURN.js";
import "./chunk-7GK6P4AX.js";
import "./chunk-HOQ4MZF6.js";
import "./chunk-S2DIODLR.js";
import "./chunk-O3BNSE3B.js";
import "./chunk-DRKMZV25.js";
import "./chunk-LIN3XTPL.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-TW23FZOX.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-UQVPJXIG.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-QKULWKZU.js";
import {
  getModelManager,
  init_model
} from "./chunk-2HO7CH6N.js";
import {
  getContext,
  init_context
} from "./chunk-IQ5KM7XA.js";
import "./chunk-K7CQOE2C.js";
import "./chunk-5LZ4PCN2.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-O6DDUSAA.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-GHHJWRHV.js";
import "./chunk-Z6XWUAKU.js";
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
