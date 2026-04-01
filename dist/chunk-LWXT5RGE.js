import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/core/costTracker.ts
import chalk from "chalk";

// src/utils/terminal/format.ts
function wrapText(text, width) {
  const lines = [];
  let currentLine = "";
  for (const char of text) {
    if ([...currentLine].length < width) {
      currentLine += char;
    } else {
      lines.push(currentLine);
      currentLine = char;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
function formatDuration(ms) {
  if (ms < 6e4) {
    return `${(ms / 1e3).toFixed(1)}s`;
  }
  const hours = Math.floor(ms / 36e5);
  const minutes = Math.floor(ms % 36e5 / 6e4);
  const seconds = (ms % 6e4 / 1e3).toFixed(1);
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
function formatNumber(number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number).toLowerCase();
}

// src/core/costTracker.ts
var STATE = {
  totalCost: 0,
  totalAPIDuration: 0,
  startTime: Date.now()
};
function addToTotalCost(cost, duration) {
  STATE.totalCost += cost;
  STATE.totalAPIDuration += duration;
}
function getTotalCost() {
  return STATE.totalCost;
}
function getTotalDuration() {
  return Date.now() - STATE.startTime;
}
function getTotalAPIDuration() {
  return STATE.totalAPIDuration;
}
function formatCost(cost) {
  return `$${cost > 0.5 ? round(cost, 100).toFixed(2) : cost.toFixed(4)}`;
}
function formatTotalCost() {
  return chalk.grey(
    `Total cost: ${formatCost(STATE.totalCost)}
Total duration (API): ${formatDuration(STATE.totalAPIDuration)}
Total duration (wall): ${formatDuration(getTotalDuration())}`
  );
}
function round(number, precision) {
  return Math.round(number * precision) / precision;
}
function resetStateForTests() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetStateForTests can only be called in tests");
  }
  STATE.startTime = Date.now();
  STATE.totalCost = 0;
  STATE.totalAPIDuration = 0;
}

export {
  wrapText,
  formatDuration,
  formatNumber,
  addToTotalCost,
  getTotalCost,
  getTotalDuration,
  getTotalAPIDuration,
  formatTotalCost,
  resetStateForTests
};
