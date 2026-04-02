import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-7QNNLWUX.js";
import "./chunk-J4UUIY4E.js";
import "./chunk-FPTRADRB.js";
import "./chunk-UOJRT4P4.js";
import "./chunk-YEN4AO42.js";
import "./chunk-AUC4MEQG.js";
import "./chunk-GTBCUEQE.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-6KNFYOOC.js";
import "./chunk-X5J77R43.js";
import "./chunk-EOFMWVZS.js";
import "./chunk-VCTS5XWT.js";
import "./chunk-725XZCBA.js";
import "./chunk-3YNNCSLX.js";
import "./chunk-FAIKF4H6.js";
import "./chunk-RHAPLCXL.js";
import "./chunk-PSSQVPRQ.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-OJ53R56V.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-K6QWHGDR.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-SVBOSKXT.js";
import {
  getModelManager,
  init_model
} from "./chunk-37RE2YKP.js";
import {
  getContext,
  init_context
} from "./chunk-JMLUZLV5.js";
import "./chunk-66TAFPFD.js";
import "./chunk-KKDKRXVW.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-JEQGWONM.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-YBS2A7SU.js";
import "./chunk-ZTECLAYJ.js";
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
