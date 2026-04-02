import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  emitReminderEvent,
  init_systemReminder
} from "./chunk-RIAXZPGP.js";
import "./chunk-OOPWPZWL.js";
import {
  getAvailableAgentTypes,
  init_loader
} from "./chunk-JMFKELD4.js";
import "./chunk-LCI7QTWS.js";
import "./chunk-RJUXM6BV.js";
import {
  debug,
  init_debugLogger
} from "./chunk-5EAAFPEU.js";
import {
  getCwd,
  init_log,
  init_state,
  logError
} from "./chunk-NGBTEKOZ.js";
import "./chunk-FHMQUTJ3.js";
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/services/context/mentionProcessor.ts
import { existsSync } from "fs";
import { resolve } from "path";
var MentionProcessorService, mentionProcessor, processMentions, clearMentionCache;
var init_mentionProcessor = __esm({
  "src/services/context/mentionProcessor.ts"() {
    init_systemReminder();
    init_loader();
    init_state();
    init_debugLogger();
    init_log();
    MentionProcessorService = class _MentionProcessorService {
      static MENTION_PATTERNS = {
        runAgent: /@(run-agent-[\w\-]+)/g,
        agent: /@(agent-[\w\-]+)/g,
        askModel: /@(ask-[\w\-]+)/g,
        file: /@(?:"([^"\n]+)"|'([^'\n]+)'|([a-zA-Z0-9/._~:\\\\-]+))/g
      };
      agentCache = /* @__PURE__ */ new Map();
      lastAgentCheck = 0;
      CACHE_TTL = 6e4;
      async processMentions(input) {
        const result = {
          agents: [],
          files: [],
          hasAgentMentions: false,
          hasFileMentions: false
        };
        try {
          const agentMentions = this.extractAgentMentions(input);
          if (agentMentions.length > 0) {
            await this.refreshAgentCache();
            for (const { mention, agentType, isAskModel } of agentMentions) {
              if (isAskModel || this.agentCache.has(agentType)) {
                result.agents.push({
                  type: "agent",
                  mention,
                  resolved: agentType,
                  exists: true,
                  metadata: isAskModel ? { type: "ask-model" } : void 0
                });
                result.hasAgentMentions = true;
                this.emitAgentMentionEvent(mention, agentType, isAskModel);
              }
            }
          }
          const fileMatches = [
            ...input.matchAll(_MentionProcessorService.MENTION_PATTERNS.file)
          ];
          const processedAgentMentions = new Set(
            agentMentions.map((am) => am.mention)
          );
          for (const match of fileMatches) {
            const rawMention = match[0]?.slice(1) || "";
            const mention = (match[1] ?? match[2] ?? match[3] ?? "").trim();
            if (mention.startsWith("run-agent-") || mention.startsWith("agent-") || mention.startsWith("ask-") || processedAgentMentions.has(mention)) {
              continue;
            }
            if (!mention) continue;
            const filePath = this.resolveFilePath(
              this.normalizeFileMentionPath(mention)
            );
            if (existsSync(filePath)) {
              result.files.push({
                type: "file",
                mention: rawMention || mention,
                resolved: filePath,
                exists: true
              });
              result.hasFileMentions = true;
              emitReminderEvent("file:mentioned", {
                filePath,
                originalMention: rawMention || mention,
                timestamp: Date.now()
              });
            }
          }
          return result;
        } catch (error) {
          logError(error);
          debug.warn("MENTION_PROCESSOR_PROCESS_FAILED", {
            input: input.substring(0, 100) + (input.length > 100 ? "..." : ""),
            error: error instanceof Error ? error.message : error
          });
          return {
            agents: [],
            files: [],
            hasAgentMentions: false,
            hasFileMentions: false
          };
        }
      }
      resolveFilePath(mention) {
        return resolve(getCwd(), mention);
      }
      normalizeFileMentionPath(mention) {
        return mention.replace(/\\ /g, " ");
      }
      async refreshAgentCache() {
        const now = Date.now();
        if (now - this.lastAgentCheck < this.CACHE_TTL) {
          return;
        }
        try {
          const agents = await getAvailableAgentTypes();
          const previousCacheSize = this.agentCache.size;
          this.agentCache.clear();
          for (const agent of agents) {
            this.agentCache.set(agent.agentType, true);
          }
          this.lastAgentCheck = now;
          if (agents.length !== previousCacheSize) {
            debug.info("MENTION_PROCESSOR_CACHE_REFRESHED", {
              agentCount: agents.length,
              previousCacheSize,
              cacheAge: now - this.lastAgentCheck
            });
          }
        } catch (error) {
          logError(error);
          debug.warn("MENTION_PROCESSOR_CACHE_REFRESH_FAILED", {
            error: error instanceof Error ? error.message : error,
            cacheSize: this.agentCache.size,
            lastRefresh: new Date(this.lastAgentCheck).toISOString()
          });
        }
      }
      extractAgentMentions(input) {
        const mentions = [];
        const runAgentMatches = [
          ...input.matchAll(_MentionProcessorService.MENTION_PATTERNS.runAgent)
        ];
        for (const match of runAgentMatches) {
          const mention = match[1];
          const agentType = mention.replace(/^run-agent-/, "");
          mentions.push({ mention, agentType, isAskModel: false });
        }
        const agentMatches = [
          ...input.matchAll(_MentionProcessorService.MENTION_PATTERNS.agent)
        ];
        for (const match of agentMatches) {
          const mention = match[1];
          const agentType = mention.replace(/^agent-/, "");
          mentions.push({ mention, agentType, isAskModel: false });
        }
        const askModelMatches = [
          ...input.matchAll(_MentionProcessorService.MENTION_PATTERNS.askModel)
        ];
        for (const match of askModelMatches) {
          const mention = match[1];
          mentions.push({ mention, agentType: mention, isAskModel: true });
        }
        return mentions;
      }
      emitAgentMentionEvent(mention, agentType, isAskModel) {
        try {
          const eventData = {
            originalMention: mention,
            timestamp: Date.now()
          };
          if (isAskModel) {
            emitReminderEvent("ask-model:mentioned", {
              ...eventData,
              modelName: mention
            });
          } else {
            emitReminderEvent("agent:mentioned", {
              ...eventData,
              agentType
            });
          }
          debug.info("MENTION_PROCESSOR_EVENT_EMITTED", {
            type: isAskModel ? "ask-model" : "agent",
            mention,
            agentType: isAskModel ? void 0 : agentType
          });
        } catch (error) {
          debug.error("MENTION_PROCESSOR_EVENT_FAILED", {
            mention,
            agentType,
            isAskModel,
            error: error instanceof Error ? error.message : error
          });
        }
      }
      clearCache() {
        this.agentCache.clear();
        this.lastAgentCheck = 0;
      }
    };
    mentionProcessor = new MentionProcessorService();
    processMentions = (input) => mentionProcessor.processMentions(input);
    clearMentionCache = () => mentionProcessor.clearCache();
  }
});
init_mentionProcessor();
export {
  clearMentionCache,
  mentionProcessor,
  processMentions
};
