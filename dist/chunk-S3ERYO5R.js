import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/text/generators.ts
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
var NO_VALUE;
var init_generators = __esm({
  "src/utils/text/generators.ts"() {
    NO_VALUE = Symbol("NO_VALUE");
  }
});

export {
  lastX,
  init_generators
};
