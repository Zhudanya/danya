import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/utils/text/uuid.ts
function isUuid(value) {
  return UUID_RE.test(value.trim());
}
var UUID_RE;
var init_uuid = __esm({
  "src/utils/text/uuid.ts"() {
    UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  }
});

export {
  isUuid,
  init_uuid
};
