import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-3B6OLM4B.js";
import "./chunk-E7ZAARX4.js";
import "./chunk-OA7VJ7PI.js";
import "./chunk-D6ULJZL3.js";
import "./chunk-VPPFM7QG.js";
import "./chunk-UEGTDALU.js";
import "./chunk-WK4ZG3B2.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-2FMOK2ID.js";
import "./chunk-X5J77R43.js";
import "./chunk-UCUAIA37.js";
import "./chunk-WV4E4YWF.js";
import "./chunk-26NLONRD.js";
import "./chunk-54GOTLJB.js";
import "./chunk-HC2VESFB.js";
import "./chunk-3O4QRKMS.js";
import "./chunk-N5ECCAQI.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-OCN2J3I2.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-O5VBECBZ.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-KKTFVPRL.js";
import {
  getModelManager,
  init_model
} from "./chunk-HT7LCECM.js";
import {
  getContext,
  init_context
} from "./chunk-BAIVG2BO.js";
import "./chunk-WTZBIGFD.js";
import "./chunk-Y3QDSWIM.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-J5RHYOCM.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-N4NKN7KX.js";
import "./chunk-OVY6CUZW.js";
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
