import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  lastX
} from "./chunk-BNBV2FXC.js";
import {
  BashTool,
  Spinner,
  UserBashInputMessage,
  getCommand,
  hasCommand
} from "./chunk-NPFMLPUW.js";
import "./chunk-5ONWVNJH.js";
import "./chunk-RO73O3Q7.js";
import "./chunk-6IH7H2LH.js";
import "./chunk-6GABS3DM.js";
import "./chunk-HNK7M2ZO.js";
import "./chunk-U7ZJW3CQ.js";
import "./chunk-Y5LQPJWK.js";
import "./chunk-JVGG2YQR.js";
import "./chunk-4WNIORGK.js";
import "./chunk-U7Z4MXY4.js";
import "./chunk-HRXRIW33.js";
import "./chunk-VMJRNHDU.js";
import "./chunk-WPVNCSHY.js";
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
  NO_RESPONSE_REQUESTED,
  createAssistantMessage,
  createUserMessage
} from "./chunk-MQOOFTBD.js";
import "./chunk-BTAVLAZT.js";
import "./chunk-JF5D7ADP.js";
import "./chunk-N74L4GAM.js";
import "./chunk-T6RTYOJB.js";
import {
  MalformedCommandError
} from "./chunk-HIIHGKXP.js";
import "./chunk-CZ5UJ3RL.js";
import {
  getCwd,
  init_log,
  init_state,
  logError,
  setCwd
} from "./chunk-BAYPSZHG.js";
import "./chunk-PTQTKIR2.js";
import "./chunk-LWXT5RGE.js";
import "./chunk-M3TKNAUR.js";

// src/utils/messages/userInput.tsx
import { Box } from "ink";
init_log();
import { resolve } from "path";
init_state();
init_state();
import chalk from "chalk";
import * as React from "react";
async function processUserInput(input, mode, setToolJSX, context, pastedImages) {
  if (mode === "bash") {
    const userMessage2 = createUserMessage(`<bash-input>${input}</bash-input>`);
    if (input.startsWith("cd ")) {
      const oldCwd = getCwd();
      const newCwd = resolve(getCwd(), input.slice(3).trim());
      try {
        await setCwd(newCwd);
        return [
          userMessage2,
          createAssistantMessage(
            `<bash-stdout>Changed directory to ${chalk.bold(`${newCwd}/`)}</bash-stdout>`
          )
        ];
      } catch (e) {
        logError(e);
        return [
          userMessage2,
          createAssistantMessage(
            `<bash-stderr>cwd error: ${e instanceof Error ? e.message : String(e)}</bash-stderr>`
          )
        ];
      }
    }
    setToolJSX({
      jsx: /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, /* @__PURE__ */ React.createElement(
        UserBashInputMessage,
        {
          addMargin: false,
          param: { text: `<bash-input>${input}</bash-input>`, type: "text" }
        }
      ), /* @__PURE__ */ React.createElement(Spinner, null)),
      shouldHidePromptInput: false
    });
    try {
      const validationResult = await BashTool.validateInput(
        { command: input },
        { commandSource: "user_bash_mode" }
      );
      if (!validationResult.result) {
        return [userMessage2, createAssistantMessage(validationResult.message)];
      }
      const { data } = await lastX(
        BashTool.call({ command: input }, {
          ...context,
          commandSource: "user_bash_mode"
        })
      );
      return [
        userMessage2,
        createAssistantMessage(
          `<bash-stdout>${data.stdout}</bash-stdout><bash-stderr>${data.stderr}</bash-stderr>`
        )
      ];
    } catch (e) {
      return [
        userMessage2,
        createAssistantMessage(
          `<bash-stderr>Command failed: ${e instanceof Error ? e.message : String(e)}</bash-stderr>`
        )
      ];
    } finally {
      setToolJSX(null);
    }
  } else if (mode === "koding") {
    const userMessage2 = createUserMessage(
      `<koding-input>${input}</koding-input>`
    );
    userMessage2.options = {
      ...userMessage2.options,
      isKodingRequest: true
    };
    return [userMessage2];
  }
  if (context.options?.disableSlashCommands !== true && input.startsWith("/")) {
    const words = input.slice(1).split(" ");
    let commandName = words[0];
    if (words.length > 1 && words[1] === "(MCP)") {
      commandName = commandName + " (MCP)";
    }
    if (!commandName) {
      return [
        createAssistantMessage("Commands are in the form `/command [args]`")
      ];
    }
    if (!hasCommand(commandName, context.options.commands)) {
      return [createUserMessage(input)];
    }
    const args = input.slice(commandName.length + 2);
    const newMessages = await getMessagesForSlashCommand(
      commandName,
      args,
      setToolJSX,
      context
    );
    if (newMessages.length === 0) {
      return [];
    }
    if (newMessages.length === 2 && newMessages[0].type === "user" && newMessages[1].type === "assistant" && typeof newMessages[1].message.content === "string" && newMessages[1].message.content.startsWith("Unknown command:")) {
      return newMessages;
    }
    if (newMessages.length === 2) {
      return newMessages;
    }
    return newMessages;
  }
  const isKodingRequest = context.options?.isKodingRequest === true;
  const kodingContextInfo = context.options?.kodingContext;
  let userMessage;
  let processedInput = isKodingRequest && kodingContextInfo ? `${kodingContextInfo}

${input}` : input;
  if (processedInput.includes("!`") || processedInput.includes("@")) {
    try {
      const { executeBashCommands } = await import("./customCommands-RLUKKBRZ.js");
      if (processedInput.includes("!`")) {
        processedInput = await executeBashCommands(processedInput);
      }
      if (processedInput.includes("@")) {
        const { processMentions } = await import("./mentionProcessor-SAPYBDCK.js");
        await processMentions(processedInput);
      }
    } catch (error) {
      logError(error);
    }
  }
  if (pastedImages && pastedImages.length > 0) {
    const occurrences = pastedImages.map((img) => ({ img, index: processedInput.indexOf(img.placeholder) })).filter((o) => o.index >= 0).sort((a, b) => a.index - b.index);
    const blocks = [];
    let cursor = 0;
    for (const { img, index } of occurrences) {
      const before = processedInput.slice(cursor, index);
      if (before) {
        blocks.push({ type: "text", text: before });
      }
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType,
          data: img.data
        }
      });
      cursor = index + img.placeholder.length;
    }
    const after = processedInput.slice(cursor);
    if (after) {
      blocks.push({ type: "text", text: after });
    }
    if (!blocks.some((b) => b.type === "text")) {
      blocks.push({ type: "text", text: "" });
    }
    userMessage = createUserMessage(blocks);
  } else {
    userMessage = createUserMessage(processedInput);
  }
  if (isKodingRequest) {
    userMessage.options = {
      ...userMessage.options,
      isKodingRequest: true
    };
  }
  return [userMessage];
}
async function getMessagesForSlashCommand(commandName, args, setToolJSX, context) {
  try {
    const command = getCommand(commandName, context.options.commands);
    switch (command.type) {
      case "local-jsx": {
        return new Promise((resolve2) => {
          command.call(
            (r) => {
              setToolJSX(null);
              resolve2([
                createUserMessage(`<command-name>${command.userFacingName()}</command-name>
          <command-message>${command.userFacingName()}</command-message>
          <command-args>${args}</command-args>`),
                r ? createAssistantMessage(r) : createAssistantMessage(NO_RESPONSE_REQUESTED)
              ]);
            },
            context,
            args
          ).then((jsx) => {
            if (!jsx) return;
            setToolJSX({ jsx, shouldHidePromptInput: true });
          });
        });
      }
      case "local": {
        const userMessage = createUserMessage(`<command-name>${command.userFacingName()}</command-name>
        <command-message>${command.userFacingName()}</command-message>
        <command-args>${args}</command-args>`);
        try {
          const result = await command.call(args, {
            ...context,
            options: {
              commands: context.options.commands || [],
              tools: context.options.tools || [],
              slowAndCapableModel: context.options.slowAndCapableModel || "main"
            }
          });
          return [
            userMessage,
            createAssistantMessage(
              `<local-command-stdout>${result}</local-command-stdout>`
            )
          ];
        } catch (e) {
          logError(e);
          return [
            userMessage,
            createAssistantMessage(
              `<local-command-stderr>${String(e)}</local-command-stderr>`
            )
          ];
        }
      }
      case "prompt": {
        const commandName2 = command.userFacingName();
        const progressMessage = command.progressMessage || "running";
        const metaMessage = createUserMessage(`<command-name>${commandName2}</command-name>
        <command-message>${commandName2} is ${progressMessage}\u2026</command-message>
        <command-args>${args}</command-args>`);
        const prompt = await command.getPromptForCommand(args);
        const expandedMessages = prompt.map((msg) => {
          const userMessage = createUserMessage(
            typeof msg.content === "string" ? msg.content : msg.content.map((block) => block.type === "text" ? block.text : "").join("\n")
          );
          userMessage.options = {
            ...userMessage.options,
            isCustomCommand: true,
            commandName: command.userFacingName(),
            commandArgs: args
          };
          return userMessage;
        });
        return [metaMessage, ...expandedMessages];
      }
    }
  } catch (e) {
    if (e instanceof MalformedCommandError) {
      return [createAssistantMessage(e.message)];
    }
    throw e;
  }
}
export {
  processUserInput
};
