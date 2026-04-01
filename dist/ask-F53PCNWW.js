import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  query
} from "./chunk-QUV2YCUP.js";
import "./chunk-DYHI3HU4.js";
import "./chunk-QOWU527O.js";
import "./chunk-WTLJM7O2.js";
import "./chunk-3LC6LWSN.js";
import "./chunk-UOERQDSJ.js";
import "./chunk-2ON4OVWS.js";
import "./chunk-Y5LQPJWK.js";
import "./chunk-JVGG2YQR.js";
import "./chunk-DQ3YBGNC.js";
import "./chunk-U7Z4MXY4.js";
import "./chunk-CDS5HL6U.js";
import "./chunk-DVRQKRHN.js";
import "./chunk-JKRPU66R.js";
import "./chunk-5552MSXN.js";
import "./chunk-LO3O7WT2.js";
import "./chunk-L4IPQYSY.js";
import "./chunk-5GADLAR7.js";
import "./chunk-MVN3DHQF.js";
import "./chunk-ZS6GNOVF.js";
import "./chunk-XEYEKVFT.js";
import "./chunk-RIE2FUKS.js";
import "./chunk-WAY3DKFO.js";
import "./chunk-2VQWLLDU.js";
import {
  createUserMessage
} from "./chunk-7NTVKI6U.js";
import {
  getModelManager
} from "./chunk-EOZSZNKR.js";
import {
  getContext
} from "./chunk-4FOB6KC5.js";
import "./chunk-KS5K2JLY.js";
import "./chunk-NFMXSWNI.js";
import "./chunk-HIIHGKXP.js";
import "./chunk-JIBQDOXO.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-DH6PY5WA.js";
import "./chunk-UYR5Q3GS.js";
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
