import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  query
} from "./chunk-ZD3WOKTA.js";
import "./chunk-ZVXACFY4.js";
import "./chunk-U5SAUK33.js";
import "./chunk-KMJTUDQT.js";
import "./chunk-6Z7EGLJB.js";
import "./chunk-HGMX7LUU.js";
import "./chunk-F4DQYOST.js";
import "./chunk-Y5LQPJWK.js";
import "./chunk-JVGG2YQR.js";
import "./chunk-TNCJ6TRC.js";
import "./chunk-U7Z4MXY4.js";
import "./chunk-CSAIELUO.js";
import "./chunk-W5HDZPFZ.js";
import "./chunk-YOSGOIID.js";
import "./chunk-66P52YYI.js";
import "./chunk-EPA5LFNP.js";
import "./chunk-S7FJMZJQ.js";
import "./chunk-2ZWXQRFX.js";
import "./chunk-MVN3DHQF.js";
import "./chunk-XQVGT6FI.js";
import "./chunk-XEYEKVFT.js";
import "./chunk-PFTCTG5X.js";
import "./chunk-WAY3DKFO.js";
import "./chunk-2VQWLLDU.js";
import {
  createUserMessage
} from "./chunk-SRXZ3EYU.js";
import {
  getModelManager
} from "./chunk-3IXSSL3F.js";
import {
  getContext
} from "./chunk-FCXTZVJG.js";
import "./chunk-NWCMSPVL.js";
import "./chunk-CEARH7HF.js";
import "./chunk-HIIHGKXP.js";
import "./chunk-VUWBPLA2.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-OPC7BAW5.js";
import "./chunk-NYT5K544.js";
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
