import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);

// src/utils/text/generators.ts
var NO_VALUE = Symbol("NO_VALUE");
async function lastX(as) {
  let lastValue = NO_VALUE;
  for await (const a of as) {
    lastValue = a;
  }
  if (lastValue === NO_VALUE) {
    throw new Error("No items in generator");
  }
  return lastValue;
}

export {
  lastX
};
