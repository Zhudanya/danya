import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  init_prompts,
  init_query,
  query
} from "./chunk-N3BDVRN5.js";
import "./chunk-NESEEZWN.js";
import "./chunk-ANPUBT7V.js";
import "./chunk-RWDMN2AH.js";
import "./chunk-GPTG4QQW.js";
import "./chunk-KUA7THTV.js";
import "./chunk-AD3SIIVR.js";
import "./chunk-WPI5U4PK.js";
import "./chunk-3DTINBOS.js";
import "./chunk-E24I5ZZR.js";
import "./chunk-X5J77R43.js";
import "./chunk-SHPJLUFE.js";
import "./chunk-AAOXFLVW.js";
import "./chunk-VEZ7YZ3S.js";
import "./chunk-2ZOIW7TX.js";
import "./chunk-AIPZXXE3.js";
import "./chunk-44JHBEWR.js";
import "./chunk-MKOA77ZZ.js";
import "./chunk-FJF3DB5L.js";
import "./chunk-CLGU7CR7.js";
import "./chunk-OOPWPZWL.js";
import "./chunk-BXHNUAYR.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  createUserMessage,
  init_messages
} from "./chunk-PLDHEH6T.js";
import {
  getModelManager,
  init_model
} from "./chunk-GZHNOIAB.js";
import {
  getContext,
  init_context
} from "./chunk-IXMD6UXD.js";
import "./chunk-BNMIUZJ2.js";
import "./chunk-RCIUE4YU.js";
import "./chunk-2KMDVUZ2.js";
import "./chunk-ZNGVQSC5.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-JPK5WJPZ.js";
import "./chunk-MUJ423LE.js";
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
