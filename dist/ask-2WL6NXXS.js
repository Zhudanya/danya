import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  query
} from "./chunk-74GBZTPP.js";
import "./chunk-A6S6B5ON.js";
import "./chunk-4O5O3U2Q.js";
import "./chunk-OEFYC6EB.js";
import "./chunk-POHRDMZV.js";
import "./chunk-LNJIGLXK.js";
import "./chunk-YUWKAFEL.js";
import "./chunk-Y5LQPJWK.js";
import "./chunk-JVGG2YQR.js";
import "./chunk-W6DD6HFV.js";
import "./chunk-U7Z4MXY4.js";
import "./chunk-5KVUE5NQ.js";
import "./chunk-XHRIZS7U.js";
import "./chunk-XET6HH6E.js";
import "./chunk-IDCB7YEI.js";
import "./chunk-TBLZSFCF.js";
import "./chunk-GAILGYJR.js";
import "./chunk-ICAZBVTN.js";
import "./chunk-MVN3DHQF.js";
import "./chunk-26HTKJMS.js";
import "./chunk-XEYEKVFT.js";
import "./chunk-KDCWEBFW.js";
import "./chunk-WAY3DKFO.js";
import "./chunk-2VQWLLDU.js";
import {
  createUserMessage
} from "./chunk-TUWAFK5F.js";
import {
  getModelManager
} from "./chunk-XZOUXQ53.js";
import {
  getContext
} from "./chunk-BFNWUM5C.js";
import "./chunk-7GV7NEXQ.js";
import "./chunk-VJGTSZDK.js";
import "./chunk-HIIHGKXP.js";
import "./chunk-GBLHJRR7.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-N4NKN7KX.js";
import "./chunk-OVY6CUZW.js";
import {
  getTotalCost
} from "./chunk-LWXT5RGE.js";
import "./chunk-M3TKNAUR.js";

// src/app/ask.ts
import { last } from "lodash-es";
init_state();
init_log();
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
