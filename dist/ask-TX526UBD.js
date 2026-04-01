import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  query
} from "./chunk-F6DEGMX6.js";
import "./chunk-OV5HJXXQ.js";
import "./chunk-OBGVKM3N.js";
import "./chunk-DHYBJN3V.js";
import "./chunk-VMEOI6MH.js";
import "./chunk-IQ6VZB2Y.js";
import "./chunk-CQCREBDO.js";
import "./chunk-Y5LQPJWK.js";
import "./chunk-JVGG2YQR.js";
import "./chunk-YIJWUNWF.js";
import "./chunk-U7Z4MXY4.js";
import "./chunk-ELAE6Z4H.js";
import "./chunk-LGEK2NV7.js";
import "./chunk-YMIWYEZ7.js";
import "./chunk-MRFO7QO5.js";
import "./chunk-O25PXGOC.js";
import "./chunk-77IRSDFR.js";
import "./chunk-66EZC7Y7.js";
import "./chunk-MVN3DHQF.js";
import "./chunk-J4D7AELD.js";
import "./chunk-XEYEKVFT.js";
import "./chunk-RHNEZOPO.js";
import "./chunk-WAY3DKFO.js";
import "./chunk-2VQWLLDU.js";
import {
  createUserMessage
} from "./chunk-H7BGBV4P.js";
import {
  getModelManager
} from "./chunk-4CLHMO4I.js";
import {
  getContext
} from "./chunk-ELZQD7ZR.js";
import "./chunk-GDF2AON2.js";
import "./chunk-DLSLSLTR.js";
import "./chunk-HIIHGKXP.js";
import "./chunk-Y4BQ36T4.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-SQGAHZPM.js";
import "./chunk-UNCTVIS7.js";
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
