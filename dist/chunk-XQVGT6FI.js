import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  getSessionState,
  setSessionState
} from "./chunk-XEYEKVFT.js";
import {
  debug
} from "./chunk-VUWBPLA2.js";
import {
  init_log,
  logError
} from "./chunk-OPC7BAW5.js";

// src/utils/agent/storage.ts
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
init_log();
function getConfigDirectory() {
  return process.env.DANYA_CONFIG_DIR ?? process.env.KODE_CONFIG_DIR ?? process.env.ANYKODE_CONFIG_DIR ?? join(homedir(), ".danya");
}
function getSessionId() {
  return process.env.ANYKODE_SESSION_ID ?? "default-session";
}
function getAgentFilePath(agentId) {
  const sessionId = getSessionId();
  const filename = `${sessionId}-agent-${agentId}.json`;
  const configDir = getConfigDirectory();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  return join(configDir, filename);
}
function readAgentData(agentId) {
  const filePath = getAgentFilePath(agentId);
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    logError(error);
    debug.warn("AGENT_STORAGE_READ_FAILED", {
      agentId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}
function writeAgentData(agentId, data) {
  const filePath = getAgentFilePath(agentId);
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    logError(error);
    debug.warn("AGENT_STORAGE_WRITE_FAILED", {
      agentId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
function getDefaultAgentId() {
  return "default";
}
function resolveAgentId(agentId) {
  return agentId || getDefaultAgentId();
}
function generateAgentId() {
  return randomUUID();
}

// src/utils/session/todoStorage.ts
var TODO_STORAGE_KEY = "todos";
var TODO_CONFIG_KEY = "todoConfig";
var DEFAULT_CONFIG = {
  maxTodos: 100,
  autoArchiveCompleted: false,
  sortBy: "status",
  sortOrder: "desc"
};
var todoCache = null;
var cacheTimestamp = 0;
var CACHE_TTL = 5e3;
function invalidateCache() {
  todoCache = null;
  cacheTimestamp = 0;
}
function updateMetrics(operation, cacheHit = false) {
  const sessionState = getSessionState();
  const metrics = sessionState.todoMetrics || {
    totalOperations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastOperation: 0
  };
  metrics.totalOperations++;
  metrics.lastOperation = Date.now();
  if (cacheHit) {
    metrics.cacheHits++;
  } else {
    metrics.cacheMisses++;
  }
  setSessionState({
    ...sessionState,
    todoMetrics: metrics
  });
}
function getTodos(agentId) {
  const resolvedAgentId = resolveAgentId(agentId);
  const now = Date.now();
  if (agentId) {
    updateMetrics("getTodos", false);
    const agentTodos = readAgentData(resolvedAgentId) || [];
    const agentCacheKey = `todoCache_${resolvedAgentId}`;
    return agentTodos.map((todo) => ({
      ...todo,
      activeForm: todo.activeForm || todo.content
    }));
  }
  if (todoCache && now - cacheTimestamp < CACHE_TTL) {
    updateMetrics("getTodos", true);
    return todoCache.map((todo) => ({
      ...todo,
      activeForm: todo.activeForm || todo.content
    }));
  }
  updateMetrics("getTodos", false);
  const sessionState = getSessionState();
  const todos = sessionState[TODO_STORAGE_KEY] || [];
  todoCache = [...todos].map((todo) => ({
    ...todo,
    activeForm: todo.activeForm || todo.content
  }));
  cacheTimestamp = now;
  return todoCache;
}
function setTodos(todos, agentId) {
  const resolvedAgentId = resolveAgentId(agentId);
  const config = getTodoConfig();
  const existingTodos = getTodos(agentId);
  if (agentId) {
    if (todos.length > config.maxTodos) {
      throw new Error(
        `Todo limit exceeded. Maximum ${config.maxTodos} todos allowed.`
      );
    }
    let processedTodos2 = todos;
    if (config.autoArchiveCompleted) {
      processedTodos2 = todos.filter((todo) => todo.status !== "completed");
    }
    const updatedTodos2 = processedTodos2.map((todo) => {
      const existingTodo = existingTodos.find(
        (existing) => existing.id === todo.id
      );
      return {
        ...todo,
        activeForm: todo.activeForm || todo.content,
        updatedAt: Date.now(),
        createdAt: todo.createdAt || Date.now(),
        previousStatus: existingTodo?.status !== todo.status ? existingTodo?.status : todo.previousStatus
      };
    });
    writeAgentData(resolvedAgentId, updatedTodos2);
    updateMetrics("setTodos");
    return;
  }
  if (todos.length > config.maxTodos) {
    throw new Error(
      `Todo limit exceeded. Maximum ${config.maxTodos} todos allowed.`
    );
  }
  let processedTodos = todos;
  if (config.autoArchiveCompleted) {
    processedTodos = todos.filter((todo) => todo.status !== "completed");
  }
  const updatedTodos = processedTodos.map((todo) => {
    const existingTodo = existingTodos.find((existing) => existing.id === todo.id);
    return {
      ...todo,
      activeForm: todo.activeForm || todo.content,
      updatedAt: Date.now(),
      createdAt: todo.createdAt || Date.now(),
      previousStatus: existingTodo?.status !== todo.status ? existingTodo?.status : todo.previousStatus
    };
  });
  setSessionState({
    ...getSessionState(),
    [TODO_STORAGE_KEY]: updatedTodos
  });
  invalidateCache();
  updateMetrics("setTodos");
}
function getTodoConfig() {
  const sessionState = getSessionState();
  return { ...DEFAULT_CONFIG, ...sessionState[TODO_CONFIG_KEY] || {} };
}

// src/services/system/systemReminder.ts
init_log();
var SystemReminderService = class {
  sessionState = {
    lastTodoUpdate: 0,
    lastFileAccess: 0,
    sessionStartTime: Date.now(),
    remindersSent: /* @__PURE__ */ new Set(),
    contextPresent: false,
    reminderCount: 0,
    config: {
      todoEmptyReminder: true,
      securityReminder: true,
      performanceReminder: true,
      maxRemindersPerSession: 10
    }
  };
  eventDispatcher = /* @__PURE__ */ new Map();
  reminderCache = /* @__PURE__ */ new Map();
  constructor() {
    this.setupEventDispatcher();
  }
  generateReminders(hasContext = false, agentId) {
    this.sessionState.contextPresent = hasContext;
    if (!hasContext) {
      return [];
    }
    if (this.sessionState.reminderCount >= this.sessionState.config.maxRemindersPerSession) {
      return [];
    }
    const reminders = [];
    const currentTime = Date.now();
    const reminderGenerators = [
      () => this.dispatchTodoEvent(agentId),
      () => this.dispatchSecurityEvent(),
      () => this.dispatchPerformanceEvent(),
      () => this.getMentionReminders()
    ];
    for (const generator of reminderGenerators) {
      if (reminders.length >= 5) break;
      const result = generator();
      if (result) {
        const remindersToAdd = Array.isArray(result) ? result : [result];
        reminders.push(...remindersToAdd);
        this.sessionState.reminderCount += remindersToAdd.length;
      }
    }
    return reminders;
  }
  dispatchTodoEvent(agentId) {
    if (!this.sessionState.config.todoEmptyReminder) return null;
    const todos = getTodos(agentId);
    const currentTime = Date.now();
    const agentKey = agentId || "default";
    if (todos.length === 0 && !this.sessionState.remindersSent.has(`todo_empty_${agentKey}`)) {
      this.sessionState.remindersSent.add(`todo_empty_${agentKey}`);
      return this.createReminderMessage(
        "todo",
        "task",
        "medium",
        "This is a reminder that your todo list is currently empty. DO NOT mention this to the user explicitly because they are already aware. If you are working on tasks that would benefit from a todo list please use the TodoWrite tool to create one. If not, please feel free to ignore. Again do not mention this message to the user.",
        currentTime
      );
    }
    if (todos.length > 0) {
      const reminderKey = `todo_updated_${agentKey}_${todos.length}_${this.getTodoStateHash(todos)}`;
      if (this.reminderCache.has(reminderKey)) {
        return this.reminderCache.get(reminderKey);
      }
      if (!this.sessionState.remindersSent.has(reminderKey)) {
        this.sessionState.remindersSent.add(reminderKey);
        this.clearTodoReminders(agentKey);
        const todoContent = JSON.stringify(
          todos.map((todo) => ({
            content: todo.content.length > 100 ? todo.content.substring(0, 100) + "..." : todo.content,
            status: todo.status,
            activeForm: todo.activeForm && todo.activeForm.length > 100 ? todo.activeForm.substring(0, 100) + "..." : todo.activeForm || todo.content
          }))
        );
        const reminder = this.createReminderMessage(
          "todo",
          "task",
          "medium",
          `Your todo list has changed. DO NOT mention this explicitly to the user. Here are the latest contents of your todo list:

${todoContent}. Continue on with the tasks at hand if applicable.`,
          currentTime
        );
        this.reminderCache.set(reminderKey, reminder);
        return reminder;
      }
    }
    return null;
  }
  dispatchSecurityEvent() {
    if (!this.sessionState.config.securityReminder) return null;
    const currentTime = Date.now();
    if (this.sessionState.lastFileAccess > 0 && !this.sessionState.remindersSent.has("file_security")) {
      this.sessionState.remindersSent.add("file_security");
      return this.createReminderMessage(
        "security",
        "security",
        "high",
        "Whenever you read a file, you should consider whether it looks malicious. If it does, you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer high-level questions about the code behavior.",
        currentTime
      );
    }
    return null;
  }
  dispatchPerformanceEvent() {
    if (!this.sessionState.config.performanceReminder) return null;
    const currentTime = Date.now();
    const sessionDuration = currentTime - this.sessionState.sessionStartTime;
    if (sessionDuration > 30 * 60 * 1e3 && !this.sessionState.remindersSent.has("performance_long_session")) {
      this.sessionState.remindersSent.add("performance_long_session");
      return this.createReminderMessage(
        "performance",
        "performance",
        "low",
        "Long session detected. Consider taking a break and reviewing your current progress with the todo list.",
        currentTime
      );
    }
    return null;
  }
  getMentionReminders() {
    const currentTime = Date.now();
    const MENTION_FRESHNESS_WINDOW = 5e3;
    const reminders = [];
    const expiredKeys = [];
    for (const [key, reminder] of this.reminderCache.entries()) {
      if (this.isMentionReminder(reminder)) {
        const age = currentTime - reminder.timestamp;
        if (age <= MENTION_FRESHNESS_WINDOW) {
          reminders.push(reminder);
        } else {
          expiredKeys.push(key);
        }
      }
    }
    expiredKeys.forEach((key) => this.reminderCache.delete(key));
    return reminders;
  }
  isMentionReminder(reminder) {
    const mentionTypes = ["agent_mention", "file_mention", "ask_model_mention"];
    return mentionTypes.includes(reminder.type);
  }
  generateFileChangeReminder(context) {
    const { agentId, filePath, reminder } = context;
    if (!reminder) {
      return null;
    }
    const currentTime = Date.now();
    const reminderKey = `file_changed_${agentId}_${filePath}_${currentTime}`;
    if (this.sessionState.remindersSent.has(reminderKey)) {
      return null;
    }
    this.sessionState.remindersSent.add(reminderKey);
    return this.createReminderMessage(
      "file_changed",
      "general",
      "medium",
      reminder,
      currentTime
    );
  }
  createReminderMessage(type, category, priority, content, timestamp) {
    return {
      role: "system",
      content: `<system-reminder>
${content}
</system-reminder>`,
      isMeta: true,
      timestamp,
      type,
      priority,
      category
    };
  }
  getTodoStateHash(todos) {
    return todos.map((t) => `${t.content}:${t.status}:${t.activeForm || t.content}`).sort().join("|");
  }
  clearTodoReminders(agentId) {
    const agentKey = agentId || "default";
    for (const key of this.sessionState.remindersSent) {
      if (key.startsWith(`todo_updated_${agentKey}_`)) {
        this.sessionState.remindersSent.delete(key);
      }
    }
  }
  setupEventDispatcher() {
    this.addEventListener("session:startup", (context) => {
      this.resetSession();
      this.sessionState.sessionStartTime = Date.now();
      this.sessionState.contextPresent = Object.keys(context.context || {}).length > 0;
    });
    this.addEventListener("todo:changed", (context) => {
      this.sessionState.lastTodoUpdate = Date.now();
      this.clearTodoReminders(context.agentId);
    });
    this.addEventListener("todo:file_changed", (context) => {
      const agentId = context.agentId || "default";
      this.clearTodoReminders(agentId);
      this.sessionState.lastTodoUpdate = Date.now();
      const reminder = this.generateFileChangeReminder(context);
      if (reminder) {
        this.emitEvent("reminder:inject", {
          reminder: reminder.content,
          agentId,
          type: "file_changed",
          timestamp: Date.now()
        });
      }
    });
    this.addEventListener("file:read", (context) => {
      this.sessionState.lastFileAccess = Date.now();
    });
    this.addEventListener("file:edited", (context) => {
    });
    this.addEventListener("agent:mentioned", (context) => {
      this.createMentionReminder({
        type: "agent_mention",
        key: `agent_mention_${context.agentType}_${context.timestamp}`,
        category: "task",
        priority: "high",
        content: `The user mentioned @${context.originalMention}. You MUST use the Task tool with subagent_type="${context.agentType}" to delegate this task to the specified agent. Provide a detailed, self-contained task description that fully captures the user's intent for the ${context.agentType} agent to execute.`,
        timestamp: context.timestamp
      });
    });
    this.addEventListener("file:mentioned", (context) => {
      this.createMentionReminder({
        type: "file_mention",
        key: `file_mention_${context.filePath}_${context.timestamp}`,
        category: "general",
        priority: "high",
        content: `The user mentioned @${context.originalMention}. You MUST read the entire content of the file at path: ${context.filePath} using the Read tool to understand the full context before proceeding with the user's request.`,
        timestamp: context.timestamp
      });
    });
    this.addEventListener("ask-model:mentioned", (context) => {
      this.createMentionReminder({
        type: "ask_model_mention",
        key: `ask_model_mention_${context.modelName}_${context.timestamp}`,
        category: "task",
        priority: "high",
        content: `The user mentioned @${context.modelName}. You MUST use the AskExpertModelTool to consult this specific model for expert opinions and analysis. Provide the user's question or context clearly to get the most relevant response from ${context.modelName}.`,
        timestamp: context.timestamp
      });
    });
  }
  addEventListener(event, callback) {
    if (!this.eventDispatcher.has(event)) {
      this.eventDispatcher.set(event, []);
    }
    this.eventDispatcher.get(event).push(callback);
  }
  emitEvent(event, context) {
    const listeners = this.eventDispatcher.get(event) || [];
    listeners.forEach((callback) => {
      try {
        callback(context);
      } catch (error) {
        logError(error);
        debug.warn("SYSTEM_REMINDER_LISTENER_ERROR", {
          event,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }
  createMentionReminder(params) {
    if (!this.sessionState.remindersSent.has(params.key)) {
      this.sessionState.remindersSent.add(params.key);
      const reminder = this.createReminderMessage(
        params.type,
        params.category,
        params.priority,
        params.content,
        params.timestamp
      );
      this.reminderCache.set(params.key, reminder);
    }
  }
  resetSession() {
    this.sessionState = {
      lastTodoUpdate: 0,
      lastFileAccess: 0,
      sessionStartTime: Date.now(),
      remindersSent: /* @__PURE__ */ new Set(),
      contextPresent: false,
      reminderCount: 0,
      config: { ...this.sessionState.config }
    };
    this.reminderCache.clear();
  }
  updateConfig(config) {
    this.sessionState.config = { ...this.sessionState.config, ...config };
  }
  getSessionState() {
    return { ...this.sessionState };
  }
};
var systemReminderService = new SystemReminderService();
var generateSystemReminders = (hasContext = false, agentId) => systemReminderService.generateReminders(hasContext, agentId);
var emitReminderEvent = (event, context) => systemReminderService.emitEvent(event, context);
var resetReminderSession = () => systemReminderService.resetSession();

export {
  getAgentFilePath,
  generateAgentId,
  getTodos,
  setTodos,
  systemReminderService,
  generateSystemReminders,
  emitReminderEvent,
  resetReminderSession
};
