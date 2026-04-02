import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSystemPrompt,
  query
} from "./chunk-ZIYUEAYT.js";
import "./chunk-5ONWVNJH.js";
import "./chunk-RO73O3Q7.js";
import "./chunk-6IH7H2LH.js";
import "./chunk-6GABS3DM.js";
import "./chunk-HNK7M2ZO.js";
import "./chunk-U7ZJW3CQ.js";
import "./chunk-Y5LQPJWK.js";
import "./chunk-JVGG2YQR.js";
import "./chunk-GMM7B7WX.js";
import "./chunk-U7Z4MXY4.js";
import "./chunk-HRXRIW33.js";
import "./chunk-VMJRNHDU.js";
import "./chunk-YX4FL35K.js";
import "./chunk-SSS2WVMA.js";
import "./chunk-KS52NNBY.js";
import "./chunk-M75PDOOM.js";
import "./chunk-2VUDETSP.js";
import "./chunk-MVN3DHQF.js";
import "./chunk-QJMLHIGS.js";
import "./chunk-XEYEKVFT.js";
import "./chunk-7I3UELIX.js";
import "./chunk-WAY3DKFO.js";
import "./chunk-2VQWLLDU.js";
import {
  createUserMessage
} from "./chunk-5LONAD3G.js";
import {
  getModelManager
} from "./chunk-BTAVLAZT.js";
import {
  getContext
} from "./chunk-JF5D7ADP.js";
import "./chunk-N74L4GAM.js";
import "./chunk-T6RTYOJB.js";
import "./chunk-HIIHGKXP.js";
import "./chunk-CZ5UJ3RL.js";
import {
  getMessagesPath,
  init_log,
  init_state,
  overwriteLog,
  setCwd
} from "./chunk-BAYPSZHG.js";
import "./chunk-PTQTKIR2.js";
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
