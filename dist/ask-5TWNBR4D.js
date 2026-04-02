import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  query
} from "./chunk-H77AJXLU.js";
import "./chunk-X46SRZQF.js";
import "./chunk-CXOM4XMN.js";
import "./chunk-IZETEFF5.js";
import "./chunk-HXH5LYLI.js";
import "./chunk-UNIJZL2G.js";
import "./chunk-Z4QNIOFF.js";
import "./chunk-Y5LQPJWK.js";
import "./chunk-JVGG2YQR.js";
import "./chunk-EQQU36GF.js";
import "./chunk-U7Z4MXY4.js";
import "./chunk-X7ZDT7EX.js";
import "./chunk-3ONZAVOS.js";
import "./chunk-CQXCGKNJ.js";
import "./chunk-E5BAXZSR.js";
import "./chunk-HIH5HC5H.js";
import "./chunk-Y5IRVMDD.js";
import "./chunk-HPSW7NNI.js";
import "./chunk-MVN3DHQF.js";
import "./chunk-5TDBDWNG.js";
import "./chunk-XEYEKVFT.js";
import "./chunk-X36NKBPR.js";
import "./chunk-WAY3DKFO.js";
import "./chunk-2VQWLLDU.js";
import {
  createUserMessage
} from "./chunk-FI2UVGGO.js";
import {
  getModelManager
} from "./chunk-RRPXM25U.js";
import {
  getContext
} from "./chunk-LHNX67NO.js";
import "./chunk-DZCV2FEW.js";
import "./chunk-6JHEJQWY.js";
import "./chunk-HIIHGKXP.js";
import "./chunk-NMNFFCQ7.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-3A4ENL7W.js";
import "./chunk-5M3MBCE7.js";
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
