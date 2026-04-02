import { createRequire as __kodeCreateRequire } from "node:module";
const require = __kodeCreateRequire(import.meta.url);
import {
  MACRO,
  init_macros
} from "./chunk-5RFHLD2N.js";
import {
  __esm
} from "./chunk-M3TKNAUR.js";

// src/services/telemetry/sentry.ts
function initSentry() {
}
async function captureException(error) {
}
var init_sentry = __esm({
  "src/services/telemetry/sentry.ts"() {
  }
});

// src/constants/product.ts
var PRODUCT_NAME, PROJECT_FILE, PRODUCT_COMMAND, CONFIG_BASE_DIR, CONFIG_FILE, GITHUB_ISSUES_REPO_URL, ASCII_LOGO;
var init_product = __esm({
  "src/constants/product.ts"() {
    PRODUCT_NAME = "Danya";
    PROJECT_FILE = "AGENTS.md";
    PRODUCT_COMMAND = "danya";
    CONFIG_BASE_DIR = ".danya";
    CONFIG_FILE = ".danya.json";
    GITHUB_ISSUES_REPO_URL = "https://github.com/danya-game/danya/issues";
    ASCII_LOGO = `
  ____
 |  _ \\   __ _  _ __   _   _   __ _
 | | | | / _\` || '_ \\ | | | | / _\` |
 | |_| || (_| || | | || |_| || (_| |
 |____/  \\__,_||_| |_| \\__, | \\__,_|
                        |___/
   Game Dev AI Coding Assistant
`;
  }
});

// src/utils/system/execFileNoThrow.ts
import { execFile } from "child_process";
function execFileNoThrow(file, args, abortSignal, timeout = 10 * SECONDS_IN_MINUTE * MS_IN_SECOND, preserveOutputOnError = true) {
  return new Promise((resolve3) => {
    try {
      execFile(
        file,
        args,
        {
          maxBuffer: 1e6,
          signal: abortSignal,
          timeout,
          cwd: getCwd()
        },
        (error, stdout, stderr) => {
          if (error) {
            if (preserveOutputOnError) {
              const errorCode = typeof error.code === "number" ? error.code : 1;
              resolve3({
                stdout: stdout || "",
                stderr: stderr || "",
                code: errorCode
              });
            } else {
              resolve3({ stdout: "", stderr: "", code: 1 });
            }
          } else {
            resolve3({ stdout, stderr, code: 0 });
          }
        }
      );
    } catch (error) {
      logError(error);
      resolve3({ stdout: "", stderr: "", code: 1 });
    }
  });
}
var MS_IN_SECOND, SECONDS_IN_MINUTE;
var init_execFileNoThrow = __esm({
  "src/utils/system/execFileNoThrow.ts"() {
    init_state();
    init_log();
    MS_IN_SECOND = 1e3;
    SECONDS_IN_MINUTE = 60;
  }
});

// src/utils/config/env.ts
import { memoize } from "lodash-es";
import { join } from "path";
import { homedir } from "os";
function getDanyaBaseDir() {
  return process.env.DANYA_CONFIG_DIR ?? process.env.KODE_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), CONFIG_BASE_DIR);
}
function getGlobalConfigFilePath() {
  return process.env.DANYA_CONFIG_DIR || process.env.KODE_CONFIG_DIR || process.env.CLAUDE_CONFIG_DIR ? join(getDanyaBaseDir(), "config.json") : join(homedir(), CONFIG_FILE);
}
function getMemoryDir() {
  return join(getDanyaBaseDir(), "memory");
}
var getKodeBaseDir, DANYA_BASE_DIR, KODE_BASE_DIR, GLOBAL_CONFIG_FILE, MEMORY_DIR, getIsDocker, hasInternetAccess, env;
var init_env = __esm({
  "src/utils/config/env.ts"() {
    init_execFileNoThrow();
    init_product();
    getKodeBaseDir = getDanyaBaseDir;
    DANYA_BASE_DIR = getDanyaBaseDir();
    KODE_BASE_DIR = DANYA_BASE_DIR;
    GLOBAL_CONFIG_FILE = getGlobalConfigFilePath();
    MEMORY_DIR = getMemoryDir();
    getIsDocker = memoize(async () => {
      const { code } = await execFileNoThrow("test", ["-f", "/.dockerenv"]);
      if (code !== 0) {
        return false;
      }
      return process.platform === "linux";
    });
    hasInternetAccess = memoize(async () => {
      const offline = process.env.DANYA_OFFLINE ?? process.env.KODE_OFFLINE ?? process.env.OFFLINE ?? process.env.NO_NETWORK ?? "";
      const normalized = String(offline).trim().toLowerCase();
      if (["1", "true", "yes", "on"].includes(normalized)) return false;
      return true;
    });
    env = {
      getIsDocker,
      hasInternetAccess,
      isCI: Boolean(process.env.CI),
      platform: process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux",
      nodeVersion: process.version,
      terminal: process.env.TERM_PROGRAM
    };
  }
});

// src/utils/plan/planSlugWords.ts
var PLAN_SLUG_ADJECTIVES, PLAN_SLUG_VERBS, PLAN_SLUG_NOUNS;
var init_planSlugWords = __esm({
  "src/utils/plan/planSlugWords.ts"() {
    PLAN_SLUG_ADJECTIVES = [
      "abundant",
      "ancient",
      "bright",
      "calm",
      "cheerful",
      "clever",
      "cozy",
      "curious",
      "dapper",
      "dazzling",
      "deep",
      "delightful",
      "eager",
      "elegant",
      "enchanted",
      "fancy",
      "fluffy",
      "gentle",
      "gleaming",
      "golden",
      "graceful",
      "happy",
      "hidden",
      "humble",
      "jolly",
      "joyful",
      "keen",
      "kind",
      "lively",
      "lovely",
      "lucky",
      "luminous",
      "magical",
      "majestic",
      "mellow",
      "merry",
      "mighty",
      "misty",
      "noble",
      "peaceful",
      "playful",
      "polished",
      "precious",
      "proud",
      "quiet",
      "quirky",
      "radiant",
      "rosy",
      "serene",
      "shiny",
      "silly",
      "sleepy",
      "smooth",
      "snazzy",
      "snug",
      "snuggly",
      "soft",
      "sparkling",
      "spicy",
      "splendid",
      "sprightly",
      "starry",
      "steady",
      "sunny",
      "swift",
      "tender",
      "tidy",
      "toasty",
      "tranquil",
      "twinkly",
      "valiant",
      "vast",
      "velvet",
      "vivid",
      "warm",
      "whimsical",
      "wild",
      "wise",
      "witty",
      "wondrous",
      "zany",
      "zesty",
      "zippy",
      "breezy",
      "bubbly",
      "buzzing",
      "cheeky",
      "cosmic",
      "cozy",
      "crispy",
      "crystalline",
      "cuddly",
      "drifting",
      "dreamy",
      "effervescent",
      "ethereal",
      "fizzy",
      "flickering",
      "floating",
      "floofy",
      "fluttering",
      "foamy",
      "frolicking",
      "fuzzy",
      "giggly",
      "glimmering",
      "glistening",
      "glittery",
      "glowing",
      "goofy",
      "groovy",
      "harmonic",
      "hazy",
      "humming",
      "iridescent",
      "jaunty",
      "jazzy",
      "jiggly",
      "melodic",
      "moonlit",
      "mossy",
      "nifty",
      "peppy",
      "prancy",
      "purrfect",
      "purring",
      "quizzical",
      "rippling",
      "rustling",
      "shimmering",
      "shimmying",
      "snappy",
      "snoopy",
      "squishy",
      "swirling",
      "ticklish",
      "tingly",
      "twinkling",
      "velvety",
      "wiggly",
      "wobbly",
      "woolly",
      "zazzy",
      "abstract",
      "adaptive",
      "agile",
      "async",
      "atomic",
      "binary",
      "cached",
      "compiled",
      "composed",
      "compressed",
      "concurrent",
      "cryptic",
      "curried",
      "declarative",
      "delegated",
      "distributed",
      "dynamic",
      "eager",
      "elegant",
      "encapsulated",
      "enumerated",
      "eventual",
      "expressive",
      "federated",
      "functional",
      "generic",
      "greedy",
      "hashed",
      "idempotent",
      "immutable",
      "imperative",
      "indexed",
      "inherited",
      "iterative",
      "lazy",
      "lexical",
      "linear",
      "linked",
      "logical",
      "memoized",
      "modular",
      "mutable",
      "nested",
      "optimized",
      "parallel",
      "parsed",
      "partitioned",
      "piped",
      "polymorphic",
      "pure",
      "reactive",
      "recursive",
      "refactored",
      "reflective",
      "replicated",
      "resilient",
      "robust",
      "scalable",
      "sequential",
      "serialized",
      "sharded",
      "sorted",
      "staged",
      "stateful",
      "stateless",
      "streamed",
      "structured",
      "synchronous",
      "synthetic",
      "temporal",
      "transient",
      "typed",
      "unified",
      "validated",
      "vectorized",
      "virtual"
    ];
    PLAN_SLUG_VERBS = [
      "baking",
      "beaming",
      "booping",
      "bouncing",
      "brewing",
      "bubbling",
      "chasing",
      "churning",
      "coalescing",
      "conjuring",
      "cooking",
      "crafting",
      "crunching",
      "cuddling",
      "dancing",
      "dazzling",
      "discovering",
      "doodling",
      "dreaming",
      "drifting",
      "enchanting",
      "exploring",
      "finding",
      "floating",
      "fluttering",
      "foraging",
      "forging",
      "frolicking",
      "gathering",
      "giggling",
      "gliding",
      "greeting",
      "growing",
      "hatching",
      "herding",
      "honking",
      "hopping",
      "hugging",
      "humming",
      "imagining",
      "inventing",
      "jingling",
      "juggling",
      "jumping",
      "kindling",
      "knitting",
      "launching",
      "leaping",
      "mapping",
      "marinating",
      "meandering",
      "mixing",
      "moseying",
      "munching",
      "napping",
      "nibbling",
      "noodling",
      "orbiting",
      "painting",
      "percolating",
      "petting",
      "plotting",
      "pondering",
      "popping",
      "prancing",
      "purring",
      "puzzling",
      "questing",
      "riding",
      "roaming",
      "rolling",
      "sauteeing",
      "scribbling",
      "seeking",
      "shimmying",
      "singing",
      "skipping",
      "sleeping",
      "snacking",
      "sniffing",
      "snuggling",
      "soaring",
      "sparking",
      "spinning",
      "splashing",
      "sprouting",
      "squishing",
      "stargazing",
      "stirring",
      "strolling",
      "swimming",
      "swinging",
      "tickling",
      "tinkering",
      "toasting",
      "tumbling",
      "twirling",
      "waddling",
      "wandering",
      "watching",
      "weaving",
      "whistling",
      "wibbling",
      "wiggling",
      "wishing",
      "wobbling",
      "wondering",
      "yawning",
      "zooming"
    ];
    PLAN_SLUG_NOUNS = [
      "aurora",
      "avalanche",
      "blossom",
      "breeze",
      "brook",
      "bubble",
      "canyon",
      "cascade",
      "cloud",
      "clover",
      "comet",
      "coral",
      "cosmos",
      "creek",
      "crescent",
      "crystal",
      "dawn",
      "dewdrop",
      "dusk",
      "eclipse",
      "ember",
      "feather",
      "fern",
      "firefly",
      "flame",
      "flurry",
      "fog",
      "forest",
      "frost",
      "galaxy",
      "garden",
      "glacier",
      "glade",
      "grove",
      "harbor",
      "horizon",
      "island",
      "lagoon",
      "lake",
      "leaf",
      "lightning",
      "meadow",
      "meteor",
      "mist",
      "moon",
      "moonbeam",
      "mountain",
      "nebula",
      "nova",
      "ocean",
      "orbit",
      "pebble",
      "petal",
      "pine",
      "planet",
      "pond",
      "puddle",
      "quasar",
      "rain",
      "rainbow",
      "reef",
      "ripple",
      "river",
      "shore",
      "sky",
      "snowflake",
      "spark",
      "spring",
      "star",
      "stardust",
      "starlight",
      "storm",
      "stream",
      "summit",
      "sun",
      "sunbeam",
      "sunrise",
      "sunset",
      "thunder",
      "tide",
      "twilight",
      "valley",
      "volcano",
      "waterfall",
      "wave",
      "willow",
      "wind",
      "alpaca",
      "axolotl",
      "badger",
      "bear",
      "beaver",
      "bee",
      "bird",
      "bumblebee",
      "bunny",
      "cat",
      "chipmunk",
      "crab",
      "crane",
      "deer",
      "dolphin",
      "dove",
      "dragon",
      "dragonfly",
      "duckling",
      "eagle",
      "elephant",
      "falcon",
      "finch",
      "flamingo",
      "fox",
      "frog",
      "giraffe",
      "goose",
      "hamster",
      "hare",
      "hedgehog",
      "hippo",
      "hummingbird",
      "jellyfish",
      "kitten",
      "koala",
      "ladybug",
      "lark",
      "lemur",
      "llama",
      "lobster",
      "lynx",
      "manatee",
      "meerkat",
      "moth",
      "narwhal",
      "newt",
      "octopus",
      "otter",
      "owl",
      "panda",
      "parrot",
      "peacock",
      "pelican",
      "penguin",
      "phoenix",
      "piglet",
      "platypus",
      "pony",
      "porcupine",
      "puffin",
      "puppy",
      "quail",
      "quokka",
      "rabbit",
      "raccoon",
      "raven",
      "robin",
      "salamander",
      "seahorse",
      "seal",
      "sloth",
      "snail",
      "sparrow",
      "sphinx",
      "squid",
      "squirrel",
      "starfish",
      "swan",
      "tiger",
      "toucan",
      "turtle",
      "unicorn",
      "walrus",
      "whale",
      "wolf",
      "wombat",
      "wren",
      "yeti",
      "zebra",
      "acorn",
      "anchor",
      "balloon",
      "beacon",
      "biscuit",
      "blanket",
      "bonbon",
      "book",
      "boot",
      "cake",
      "candle",
      "candy",
      "castle",
      "charm",
      "clock",
      "cocoa",
      "cookie",
      "crayon",
      "crown",
      "cupcake",
      "donut",
      "dream",
      "fairy",
      "fiddle",
      "flask",
      "flute",
      "fountain",
      "gadget",
      "gem",
      "gizmo",
      "globe",
      "goblet",
      "hammock",
      "harp",
      "haven",
      "hearth",
      "honey",
      "journal",
      "kazoo",
      "kettle",
      "key",
      "kite",
      "lantern",
      "lemon",
      "lighthouse",
      "locket",
      "lollipop",
      "mango",
      "map",
      "marble",
      "marshmallow",
      "melody",
      "mitten",
      "mochi",
      "muffin",
      "music",
      "nest",
      "noodle",
      "oasis",
      "origami",
      "pancake",
      "parasol",
      "peach",
      "pearl",
      "pebble",
      "pie",
      "pillow",
      "pinwheel",
      "pixel",
      "pizza",
      "plum",
      "popcorn",
      "pretzel",
      "prism",
      "pudding",
      "pumpkin",
      "puzzle",
      "quiche",
      "quill",
      "quilt",
      "riddle",
      "rocket",
      "rose",
      "scone",
      "scroll",
      "shell",
      "sketch",
      "snowglobe",
      "sonnet",
      "sparkle",
      "spindle",
      "sprout",
      "sundae",
      "swing",
      "taco",
      "teacup",
      "teapot",
      "thimble",
      "toast",
      "token",
      "tome",
      "tower",
      "treasure",
      "treehouse",
      "trinket",
      "truffle",
      "tulip",
      "umbrella",
      "waffle",
      "wand",
      "whisper",
      "whistle",
      "widget",
      "wreath",
      "zephyr",
      "abelson",
      "adleman",
      "aho",
      "allen",
      "babbage",
      "bachman",
      "backus",
      "barto",
      "bengio",
      "bentley",
      "blum",
      "boole",
      "brooks",
      "catmull",
      "cerf",
      "cherny",
      "church",
      "clarke",
      "cocke",
      "codd",
      "conway",
      "cook",
      "corbato",
      "cray",
      "curry",
      "dahl",
      "diffie",
      "dijkstra",
      "dongarra",
      "eich",
      "emerson",
      "engelbart",
      "feigenbaum",
      "floyd",
      "gosling",
      "graham",
      "gray",
      "hamming",
      "hanrahan",
      "hartmanis",
      "hejlsberg",
      "hellman",
      "hennessy",
      "hickey",
      "hinton",
      "hoare",
      "hollerith",
      "hopcroft",
      "hopper",
      "iverson",
      "kahan",
      "kahn",
      "karp",
      "kay",
      "kernighan",
      "knuth",
      "kurzweil",
      "lamport",
      "lampson",
      "lecun",
      "lerdorf",
      "liskov",
      "lovelace",
      "matsumoto",
      "mccarthy",
      "metcalfe",
      "micali",
      "milner",
      "minsky",
      "moler",
      "moore",
      "naur",
      "neumann",
      "newell",
      "nygaard",
      "papert",
      "parnas",
      "pascal",
      "patterson",
      "pearl",
      "perlis",
      "pike",
      "pnueli",
      "rabin",
      "reddy",
      "ritchie",
      "rivest",
      "rossum",
      "russell",
      "scott",
      "sedgewick",
      "shamir",
      "shannon",
      "sifakis",
      "simon",
      "stallman",
      "stearns",
      "steele",
      "stonebraker",
      "stroustrup",
      "sutherland",
      "sutton",
      "tarjan",
      "thacker",
      "thompson",
      "torvalds",
      "turing",
      "ullman",
      "valiant",
      "wadler",
      "wall",
      "wigderson",
      "wilkes",
      "wilkinson",
      "wirth",
      "wozniak",
      "yao"
    ];
  }
});

// src/utils/plan/planMode.ts
import { existsSync, mkdirSync, readFileSync, realpathSync } from "fs";
import { randomBytes } from "crypto";
import { isAbsolute, join as join2, relative, resolve, parse } from "path";
function getConversationKey(context) {
  const messageLogName = context?.options?.messageLogName ?? DEFAULT_CONVERSATION_KEY;
  const forkNumber = context?.options?.forkNumber ?? 0;
  return `${messageLogName}:${forkNumber}`;
}
function getPlanConversationKey(context) {
  return getConversationKey(context);
}
function setActivePlanConversationKey(conversationKey) {
  activePlanConversationKey = conversationKey;
}
function getAgentKey(context) {
  const conversationKey = getConversationKey(context);
  const agentId = context?.agentId ?? "main";
  return `${conversationKey}:${agentId}`;
}
function pickIndex(length) {
  return randomBytes(4).readUInt32BE(0) % length;
}
function pickWord(words) {
  return words[pickIndex(words.length)];
}
function generateSlug() {
  const adjective = pickWord(PLAN_SLUG_ADJECTIVES);
  const verb = pickWord(PLAN_SLUG_VERBS);
  const noun = pickWord(PLAN_SLUG_NOUNS);
  return `${adjective}-${verb}-${noun}`;
}
function getOrCreatePlanSlug(conversationKey) {
  const existing = planSlugCache.get(conversationKey);
  if (existing) return existing;
  const dir = getPlanDirectory();
  let slug = null;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    slug = generateSlug();
    const path = join2(dir, `${slug}.md`);
    if (!existsSync(path)) break;
  }
  if (!slug) slug = generateSlug();
  planSlugCache.set(conversationKey, slug);
  return slug;
}
function extractSlugFromPlanFilePath(planFilePath) {
  if (!planFilePath) return null;
  const baseName = parse(planFilePath).name;
  if (!baseName) return null;
  const agentMarker = "-agent-";
  const idx = baseName.lastIndexOf(agentMarker);
  if (idx === -1) return baseName;
  if (idx === 0) return null;
  return baseName.slice(0, idx);
}
function getOrCreatePlanModeFlags(conversationKey) {
  const existing = planModeFlagsByConversationKey.get(conversationKey);
  if (existing) return existing;
  const created = {
    hasExitedPlanMode: false,
    needsPlanModeExitAttachment: false
  };
  planModeFlagsByConversationKey.set(conversationKey, created);
  return created;
}
function getMaxParallelExploreAgents() {
  const raw = process.env.DANYA_PLAN_V2_EXPLORE_AGENT_COUNT ?? process.env.KODE_PLAN_V2_EXPLORE_AGENT_COUNT ?? process.env.CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 10) return parsed;
  }
  return 3;
}
function getMaxParallelPlanAgents() {
  const raw = process.env.DANYA_PLAN_V2_AGENT_COUNT ?? process.env.KODE_PLAN_V2_AGENT_COUNT ?? process.env.CLAUDE_CODE_PLAN_V2_AGENT_COUNT;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 10) return parsed;
  }
  return 1;
}
function buildPlanModeMainReminder(args) {
  const {
    planExists,
    planFilePath,
    maxParallelExploreAgents,
    maxParallelPlanAgents
  } = args;
  const writeToolName = "Write";
  const editToolName = "Edit";
  const askUserToolName = "AskUserQuestion";
  const exploreAgentType = "Explore";
  const planAgentType = "Plan";
  const exitPlanModeToolName = "ExitPlanMode";
  return `Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits (with the exception of the plan file mentioned below), run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supercedes any other instructions you have received.

## Plan File Info:
${planExists ? `A plan file already exists at ${planFilePath}. You can read it and make incremental edits using the ${editToolName} tool.` : `No plan file exists yet. You should create your plan at ${planFilePath} using the ${writeToolName} tool.`}
You should build your plan incrementally by writing to or editing this file. NOTE that this is the only file you are allowed to edit - other than this you are only allowed to take READ-ONLY actions.

## Plan Workflow

### Phase 1: Initial Understanding
Goal: Gain a comprehensive understanding of the user's request by reading through code and asking them questions. Critical: In this phase you should only use the ${exploreAgentType} subagent type.

1. Focus on understanding the user's request and the code associated with their request

2. **Launch up to ${maxParallelExploreAgents} ${exploreAgentType} agents IN PARALLEL** (single message, multiple tool calls) to efficiently explore the codebase.
   - Use 1 agent when the task is isolated to known files, the user provided specific file paths, or you're making a small targeted change.
   - Use multiple agents when: the scope is uncertain, multiple areas of the codebase are involved, or you need to understand existing patterns before planning.
   - Quality over quantity - ${maxParallelExploreAgents} agents maximum, but you should try to use the minimum number of agents necessary (usually just 1)
   - If using multiple agents: Provide each agent with a specific search focus or area to explore. Example: One agent searches for existing implementations, another explores related components, a third investigates testing patterns

3. After exploring the code, use the ${askUserToolName} tool to clarify ambiguities in the user request up front.

### Phase 2: Design
Goal: Design an implementation approach.

Launch ${planAgentType} agent(s) to design the implementation based on the user's intent and your exploration results from Phase 1.

You can launch up to ${maxParallelPlanAgents} agent(s) in parallel.

**Guidelines:**
- **Default**: Launch at least 1 Plan agent for most tasks - it helps validate your understanding and consider alternatives
- **Skip agents**: Only for truly trivial tasks (typo fixes, single-line changes, simple renames)
${maxParallelPlanAgents > 1 ? `- **Multiple agents**: Use up to ${maxParallelPlanAgents} agents for complex tasks that benefit from different perspectives

Examples of when to use multiple agents:
- The task touches multiple parts of the codebase
- It's a large refactor or architectural change
- There are many edge cases to consider
- You'd benefit from exploring different approaches

Example perspectives by task type:
- New feature: simplicity vs performance vs maintainability
- Bug fix: root cause vs workaround vs prevention
- Refactoring: minimal change vs clean architecture
` : ""}
In the agent prompt:
- Provide comprehensive background context from Phase 1 exploration including filenames and code path traces
- Describe requirements and constraints
- Request a detailed implementation plan

### Phase 3: Review
Goal: Review the plan(s) from Phase 2 and ensure alignment with the user's intentions.
1. Read the critical files identified by agents to deepen your understanding
2. Ensure that the plans align with the user's original request
3. Use ${askUserToolName} to clarify any remaining questions with the user

### Phase 4: Final Plan
Goal: Write your final plan to the plan file (the only file you can edit).
- Include only your recommended approach, not all alternatives
- Ensure that the plan file is concise enough to scan quickly, but detailed enough to execute effectively
- Include the paths of critical files to be modified

### Phase 5: Call ${exitPlanModeToolName}
At the very end of your turn, once you have asked the user questions and are happy with your final plan file - you should always call ${exitPlanModeToolName} to indicate to the user that you are done planning.
This is critical - your turn should only end with either asking the user a question or calling ${exitPlanModeToolName}. Do not stop unless it's for these 2 reasons.

NOTE: At any point in time through this workflow you should feel free to ask the user questions or clarifications. Don't make large assumptions about user intent. The goal is to present a well researched plan to the user, and tie any loose ends before implementation begins.`;
}
function buildPlanModeSubAgentReminder(args) {
  const { planExists, planFilePath } = args;
  const writeToolName = "Write";
  const editToolName = "Edit";
  const askUserToolName = "AskUserQuestion";
  return `Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits, run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supercedes any other instructions you have received (for example, to make edits). Instead, you should:

## Plan File Info:
${planExists ? `A plan file already exists at ${planFilePath}. You can read it and make incremental edits using the ${editToolName} tool if you need to.` : `No plan file exists yet. You should create your plan at ${planFilePath} using the ${writeToolName} tool if you need to.`}
You should build your plan incrementally by writing to or editing this file. NOTE that this is the only file you are allowed to edit - other than this you are only allowed to take READ-ONLY actions.
Answer the user's query comprehensively, using the ${askUserToolName} tool if you need to ask the user clarifying questions. If you do use the ${askUserToolName}, make sure to ask all clarifying questions you need to fully understand the user's intent before proceeding.`;
}
function buildPlanModeReentryReminder(planFilePath) {
  const exitPlanModeToolName = "ExitPlanMode";
  return `## Re-entering Plan Mode

You are returning to plan mode after having previously exited it. A plan file exists at ${planFilePath} from your previous planning session.

**Before proceeding with any new planning, you should:**
1. Read the existing plan file to understand what was previously planned
2. Evaluate the user's current request against that plan
3. Decide how to proceed:
   - **Different task**: If the user's request is for a different task\u2014even if it's similar or related\u2014start fresh by overwriting the existing plan
   - **Same task, continuing**: If this is explicitly a continuation or refinement of the exact same task, modify the existing plan while cleaning up outdated or irrelevant sections
4. Continue on with the plan process and most importantly you should always edit the plan file one way or the other before calling ${exitPlanModeToolName}

Treat this as a fresh planning session. Do not assume the existing plan is relevant without evaluating it first.`;
}
function buildPlanModeExitReminder(planFilePath) {
  return `## Exited Plan Mode

You have exited plan mode. You can now make edits, run tools, and take actions. The plan file is located at ${planFilePath} if you need to reference it.`;
}
function wrapSystemReminder(text) {
  return `<system-reminder>
${text}
</system-reminder>`;
}
function getPlanModeSystemPromptAdditions(messages, context) {
  const conversationKey = getConversationKey(context);
  const agentKey = getAgentKey(context);
  const flags = getOrCreatePlanModeFlags(conversationKey);
  const additions = [];
  const assistantTurns = messages.filter((m) => m?.type === "assistant").length;
  if (isPlanModeEnabled(context)) {
    const previous = planModeAttachmentStateByAgentKey.get(agentKey) ?? {
      hasInjected: false,
      lastInjectedAssistantTurn: -Infinity
    };
    if (previous.hasInjected && assistantTurns - previous.lastInjectedAssistantTurn < TURNS_BETWEEN_ATTACHMENTS) {
      return [];
    }
    const planFilePath = getPlanFilePath(context.agentId, conversationKey);
    const planExists = existsSync(planFilePath);
    if (flags.hasExitedPlanMode && planExists) {
      additions.push(
        wrapSystemReminder(buildPlanModeReentryReminder(planFilePath))
      );
      flags.hasExitedPlanMode = false;
    }
    const isSubAgent = !!context.agentId;
    additions.push(
      wrapSystemReminder(
        isSubAgent ? buildPlanModeSubAgentReminder({ planExists, planFilePath }) : buildPlanModeMainReminder({
          planExists,
          planFilePath,
          maxParallelExploreAgents: getMaxParallelExploreAgents(),
          maxParallelPlanAgents: getMaxParallelPlanAgents()
        })
      )
    );
    planModeFlagsByConversationKey.set(conversationKey, flags);
    planModeAttachmentStateByAgentKey.set(agentKey, {
      hasInjected: true,
      lastInjectedAssistantTurn: assistantTurns
    });
    return additions;
  }
  if (flags.needsPlanModeExitAttachment) {
    const planFilePath = getPlanFilePath(context.agentId, conversationKey);
    additions.push(wrapSystemReminder(buildPlanModeExitReminder(planFilePath)));
    flags.needsPlanModeExitAttachment = false;
    planModeFlagsByConversationKey.set(conversationKey, flags);
  }
  return additions;
}
function isPlanModeEnabled(context) {
  const key = getConversationKey(context);
  return planModeEnabledByConversationKey.get(key) ?? false;
}
function enterPlanMode(context) {
  const key = getConversationKey(context);
  planModeEnabledByConversationKey.set(key, true);
  return { planFilePath: getPlanFilePath(context?.agentId, key) };
}
function enterPlanModeForConversationKey(conversationKey) {
  planModeEnabledByConversationKey.set(conversationKey, true);
}
function exitPlanModeForConversationKey(conversationKey) {
  planModeEnabledByConversationKey.set(conversationKey, false);
  const flags = getOrCreatePlanModeFlags(conversationKey);
  flags.hasExitedPlanMode = true;
  flags.needsPlanModeExitAttachment = true;
  planModeFlagsByConversationKey.set(conversationKey, flags);
}
function getPlanSlugForConversationKey(conversationKey) {
  return planSlugCache.get(conversationKey) ?? null;
}
function hydratePlanSlugFromMessages(messages, context) {
  const conversationKey = getConversationKey(context);
  if (planSlugCache.has(conversationKey)) return true;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const directSlug = typeof msg?.slug === "string" ? msg.slug.trim() : "";
    if (directSlug) {
      planSlugCache.set(conversationKey, directSlug);
      return true;
    }
    const data = msg?.toolUseResult?.data;
    if (!data || typeof data !== "object") continue;
    const planFilePath = typeof data.planFilePath === "string" ? data.planFilePath : typeof data.filePath === "string" ? data.filePath : null;
    if (!planFilePath) continue;
    const slug = extractSlugFromPlanFilePath(planFilePath);
    if (!slug) continue;
    planSlugCache.set(conversationKey, slug);
    return true;
  }
  return false;
}
function getPlanDirectory() {
  const dir = join2(getKodeBaseDir(), "plans");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}
function getPlanFilePath(agentId, conversationKey) {
  const dir = getPlanDirectory();
  const key = conversationKey ?? DEFAULT_CONVERSATION_KEY;
  const slug = getOrCreatePlanSlug(key);
  if (!agentId) return join2(dir, `${slug}.md`);
  return join2(dir, `${slug}-agent-${agentId}.md`);
}
function resolveExistingPath(path) {
  const resolved = resolve(path);
  try {
    return realpathSync(resolved);
  } catch {
    return resolved;
  }
}
function isMainPlanFilePathForActiveConversation(path) {
  const key = activePlanConversationKey ?? DEFAULT_CONVERSATION_KEY;
  const expected = resolveExistingPath(getPlanFilePath(void 0, key));
  const target = resolveExistingPath(path);
  return target === expected;
}
function readPlanFile(agentId, conversationKey) {
  const planFilePath = getPlanFilePath(agentId, conversationKey);
  if (!existsSync(planFilePath)) {
    return { content: "", exists: false, planFilePath };
  }
  return {
    content: readFileSync(planFilePath, "utf8"),
    exists: true,
    planFilePath
  };
}
var DEFAULT_CONVERSATION_KEY, MAX_SLUG_ATTEMPTS, TURNS_BETWEEN_ATTACHMENTS, planModeEnabledByConversationKey, planSlugCache, planModeFlagsByConversationKey, planModeAttachmentStateByAgentKey, activePlanConversationKey;
var init_planMode = __esm({
  "src/utils/plan/planMode.ts"() {
    init_env();
    init_planSlugWords();
    DEFAULT_CONVERSATION_KEY = "default";
    MAX_SLUG_ATTEMPTS = 10;
    TURNS_BETWEEN_ATTACHMENTS = 5;
    planModeEnabledByConversationKey = /* @__PURE__ */ new Map();
    planSlugCache = /* @__PURE__ */ new Map();
    planModeFlagsByConversationKey = /* @__PURE__ */ new Map();
    planModeAttachmentStateByAgentKey = /* @__PURE__ */ new Map();
    activePlanConversationKey = null;
  }
});

// src/utils/log/index.ts
import {
  existsSync as existsSync2,
  mkdirSync as mkdirSync2,
  writeFileSync,
  readFileSync as readFileSync2,
  readdirSync,
  statSync,
  copyFileSync,
  promises as fsPromises
} from "fs";
import { dirname, join as join3 } from "path";
import { randomUUID } from "crypto";
import envPaths from "env-paths";
function isPermissionError(error) {
  return typeof error === "object" && error !== null && "code" in error && PERMISSION_ERROR_CODES.has(error.code ?? "");
}
function safeMkdir(dir) {
  if (existsSync2(dir)) return true;
  try {
    mkdirSync2(dir, { recursive: true });
    return true;
  } catch (error) {
    if (isPermissionError(error)) {
      return false;
    }
    throw error;
  }
}
function safeWriteFile(path, data, encoding = "utf8") {
  try {
    writeFileSync(path, data, encoding);
    return true;
  } catch (error) {
    if (isPermissionError(error)) {
      return false;
    }
    throw error;
  }
}
function getProjectDir(cwd2) {
  return cwd2.replace(/[^a-zA-Z0-9]/g, "-");
}
function getLegacyCacheRoot() {
  return process.env.DANYA_LEGACY_CACHE_ROOT ?? process.env.KODE_LEGACY_CACHE_ROOT ?? paths.cache;
}
function getNewLogRoot() {
  return process.env.DANYA_LOG_ROOT ?? process.env.KODE_LOG_ROOT ?? getKodeBaseDir();
}
function dateToFilename(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}
function getErrorsPath() {
  return join3(CACHE_PATHS.errors(), DATE + ".txt");
}
function getMessagesPath(messageLogName, forkNumber, sidechainNumber) {
  return join3(
    CACHE_PATHS.messages(),
    `${messageLogName}${forkNumber > 0 ? `-${forkNumber}` : ""}${sidechainNumber > 0 ? `-sidechain-${sidechainNumber}` : ""}.json`
  );
}
function migrateLegacyMessageLogsIfNeeded() {
  if (didMigrateMessageLogs) return;
  didMigrateMessageLogs = true;
  const legacyDir = LEGACY_CACHE_PATHS.messages();
  const newDir = CACHE_PATHS.messages();
  if (!existsSync2(legacyDir)) return;
  const newHasAny = existsSync2(newDir) && readdirSync(newDir).some((file) => file.endsWith(".json"));
  if (newHasAny) return;
  try {
    mkdirSync2(newDir, { recursive: true });
  } catch {
    return;
  }
  let legacyFiles = [];
  try {
    legacyFiles = readdirSync(legacyDir).filter((file) => file.endsWith(".json"));
  } catch {
    return;
  }
  const sorted = legacyFiles.map((file) => {
    try {
      const stats = statSync(join3(legacyDir, file));
      return { file, mtimeMs: stats.mtimeMs };
    } catch {
      return { file, mtimeMs: 0 };
    }
  }).sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, MIGRATION_MESSAGE_LOG_LIMIT);
  for (const { file } of sorted) {
    const src = join3(legacyDir, file);
    const dest = join3(newDir, file);
    if (existsSync2(dest)) continue;
    try {
      copyFileSync(src, dest);
    } catch {
    }
  }
}
function logError(error) {
  try {
    if (process.env.NODE_ENV === "test") {
      console.error(error);
    }
    const errorStr = error instanceof Error ? error.stack || error.message : String(error);
    const errorInfo = {
      error: errorStr,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (IN_MEMORY_ERROR_LOG.length >= MAX_IN_MEMORY_ERRORS) {
      IN_MEMORY_ERROR_LOG.shift();
    }
    IN_MEMORY_ERROR_LOG.push(errorInfo);
    appendToLog(getErrorsPath(), {
      error: errorStr
    });
  } catch {
  }
  captureException(error);
}
function readLog(path) {
  if (!existsSync2(path)) {
    return [];
  }
  try {
    return JSON.parse(readFileSync2(path, "utf8"));
  } catch {
    return [];
  }
}
function appendToLog(path, message) {
  if (process.env.USER_TYPE === "external") {
    return;
  }
  const dir = dirname(path);
  if (!safeMkdir(dir)) {
    return;
  }
  if (!existsSync2(path) && !safeWriteFile(path, "[]")) {
    return;
  }
  const messages = readLog(path);
  const messageWithTimestamp = {
    ...message,
    cwd: process.cwd(),
    userType: process.env.USER_TYPE,
    sessionId: SESSION_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: MACRO.VERSION
  };
  messages.push(messageWithTimestamp);
  safeWriteFile(path, JSON.stringify(messages, null, 2));
}
function overwriteLog(path, messages, options) {
  if (process.env.USER_TYPE === "external") {
    return;
  }
  if (!messages.length) {
    return;
  }
  const dir = dirname(path);
  if (!safeMkdir(dir)) {
    return;
  }
  const slug = options?.conversationKey ? getPlanSlugForConversationKey(options.conversationKey) : null;
  const messagesWithMetadata = messages.map((message) => ({
    ...message,
    ...slug ? { slug } : {},
    cwd: process.cwd(),
    userType: process.env.USER_TYPE,
    sessionId: SESSION_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: MACRO.VERSION
  }));
  safeWriteFile(path, JSON.stringify(messagesWithMetadata, null, 2));
}
async function loadLogList(path = CACHE_PATHS.messages()) {
  if (path === CACHE_PATHS.messages()) {
    migrateLegacyMessageLogsIfNeeded();
  }
  const searchPaths = path === CACHE_PATHS.messages() ? [CACHE_PATHS.messages(), LEGACY_CACHE_PATHS.messages()] : [path];
  const existingPaths = searchPaths.filter((p) => existsSync2(p));
  if (existingPaths.length === 0) {
    logError(`No logs found at ${path}`);
    return [];
  }
  const filesWithDir = (await Promise.all(
    existingPaths.map(async (dirPath) => {
      const dirFiles = await fsPromises.readdir(dirPath);
      return dirFiles.map((file) => ({ file, dirPath }));
    })
  )).flat();
  const seen = /* @__PURE__ */ new Set();
  const uniqueFiles = filesWithDir.filter(({ file }) => {
    if (seen.has(file)) return false;
    seen.add(file);
    return true;
  });
  const logData = await Promise.all(
    uniqueFiles.map(async ({ file, dirPath }, i) => {
      const fullPath = join3(dirPath, file);
      const content = await fsPromises.readFile(fullPath, "utf8");
      const messages = JSON.parse(content);
      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];
      const firstPrompt = firstMessage?.type === "user" && typeof firstMessage?.message?.content === "string" ? firstMessage?.message?.content : "No prompt";
      const { date, forkNumber, sidechainNumber } = parseLogFilename(file);
      return {
        date,
        forkNumber,
        fullPath,
        messages,
        value: i,
        created: parseISOString(firstMessage?.timestamp || date),
        modified: lastMessage?.timestamp ? parseISOString(lastMessage.timestamp) : parseISOString(date),
        firstPrompt: firstPrompt.split("\n")[0]?.slice(0, 50) + (firstPrompt.length > 50 ? "\u2026" : "") || "No prompt",
        messageCount: messages.length,
        sidechainNumber
      };
    })
  );
  return sortLogs(logData.filter((_) => _.messages.length)).map((_, i) => ({
    ..._,
    value: i
  }));
}
function parseLogFilename(filename) {
  const base = filename.split(".")[0];
  const segments = base.split("-");
  const hasSidechain = base.includes("-sidechain-");
  let date = base;
  let forkNumber = void 0;
  let sidechainNumber = void 0;
  if (hasSidechain) {
    const sidechainIndex = segments.indexOf("sidechain");
    sidechainNumber = Number(segments[sidechainIndex + 1]);
    if (sidechainIndex > 6) {
      forkNumber = Number(segments[sidechainIndex - 1]);
      date = segments.slice(0, 6).join("-");
    } else {
      date = segments.slice(0, 6).join("-");
    }
  } else if (segments.length > 6) {
    const lastSegment = Number(segments[segments.length - 1]);
    forkNumber = lastSegment >= 0 ? lastSegment : void 0;
    date = segments.slice(0, 6).join("-");
  } else {
    date = base;
  }
  return { date, forkNumber, sidechainNumber };
}
function getNextAvailableLogForkNumber(date, forkNumber, sidechainNumber) {
  while (existsSync2(getMessagesPath(date, forkNumber, sidechainNumber))) {
    forkNumber++;
  }
  return forkNumber;
}
function getNextAvailableLogSidechainNumber(date, forkNumber) {
  let sidechainNumber = 1;
  while (existsSync2(getMessagesPath(date, forkNumber, sidechainNumber))) {
    sidechainNumber++;
  }
  return sidechainNumber;
}
function sortLogs(logs) {
  return logs.sort((a, b) => {
    const modifiedDiff = b.modified.getTime() - a.modified.getTime();
    if (modifiedDiff !== 0) {
      return modifiedDiff;
    }
    const createdDiff = b.created.getTime() - a.created.getTime();
    if (createdDiff !== 0) {
      return createdDiff;
    }
    return (b.forkNumber ?? 0) - (a.forkNumber ?? 0);
  });
}
function formatDate(date) {
  const now = /* @__PURE__ */ new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).toLowerCase();
  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    }) + ` at ${timeStr}`;
  }
}
function parseISOString(s) {
  const b = s.split(/\D+/);
  return new Date(
    Date.UTC(
      parseInt(b[0], 10),
      parseInt(b[1], 10) - 1,
      parseInt(b[2], 10),
      parseInt(b[3], 10),
      parseInt(b[4], 10),
      parseInt(b[5], 10),
      parseInt(b[6], 10)
    )
  );
}
function logMCPError(serverName, error) {
  try {
    const logDir = CACHE_PATHS.mcpLogs(serverName);
    const errorStr = error instanceof Error ? error.stack || error.message : String(error);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const logFile = join3(logDir, DATE + ".txt");
    if (!existsSync2(logDir)) {
      mkdirSync2(logDir, { recursive: true });
    }
    if (!existsSync2(logFile)) {
      writeFileSync(logFile, "[]", "utf8");
    }
    const errorInfo = {
      error: errorStr,
      timestamp,
      sessionId: SESSION_ID,
      cwd: process.cwd()
    };
    const messages = readLog(logFile);
    messages.push(errorInfo);
    writeFileSync(logFile, JSON.stringify(messages, null, 2), "utf8");
  } catch {
  }
}
var IN_MEMORY_ERROR_LOG, MAX_IN_MEMORY_ERRORS, PERMISSION_ERROR_CODES, SESSION_ID, paths, CACHE_PATHS, LEGACY_CACHE_PATHS, DATE, MIGRATION_MESSAGE_LOG_LIMIT, didMigrateMessageLogs;
var init_log = __esm({
  "src/utils/log/index.ts"() {
    init_sentry();
    init_macros();
    init_product();
    init_planMode();
    init_env();
    IN_MEMORY_ERROR_LOG = [];
    MAX_IN_MEMORY_ERRORS = 100;
    PERMISSION_ERROR_CODES = /* @__PURE__ */ new Set(["EACCES", "EPERM", "EROFS"]);
    SESSION_ID = randomUUID();
    paths = envPaths(PRODUCT_COMMAND);
    CACHE_PATHS = {
      errors: () => join3(getNewLogRoot(), getProjectDir(process.cwd()), "errors"),
      messages: () => join3(getNewLogRoot(), getProjectDir(process.cwd()), "messages"),
      mcpLogs: (serverName) => join3(
        getLegacyCacheRoot(),
        getProjectDir(process.cwd()),
        `mcp-logs-${serverName}`
      )
    };
    LEGACY_CACHE_PATHS = {
      errors: () => join3(getLegacyCacheRoot(), getProjectDir(process.cwd()), "errors"),
      messages: () => join3(getLegacyCacheRoot(), getProjectDir(process.cwd()), "messages"),
      mcpLogs: (serverName) => join3(
        getLegacyCacheRoot(),
        getProjectDir(process.cwd()),
        `mcp-logs-${serverName}`
      )
    };
    DATE = dateToFilename(/* @__PURE__ */ new Date());
    MIGRATION_MESSAGE_LOG_LIMIT = 50;
    didMigrateMessageLogs = false;
  }
});

// src/utils/log/taskOutputStore.ts
import {
  appendFileSync,
  existsSync as existsSync3,
  mkdirSync as mkdirSync3,
  readFileSync as readFileSync3,
  statSync as statSync2,
  writeFileSync as writeFileSync2
} from "fs";
import { dirname as dirname2, join as join4 } from "path";
function getProjectDir2(cwd2) {
  return cwd2.replace(/[^a-zA-Z0-9]/g, "-");
}
function getTaskOutputsDir() {
  return join4(getKodeBaseDir(), getProjectDir2(PROJECT_ROOT), "tasks");
}
function getTaskOutputFilePath(taskId) {
  return join4(getTaskOutputsDir(), `${taskId}.output`);
}
function ensureTaskOutputsDirExists() {
  const dir = getTaskOutputsDir();
  if (existsSync3(dir)) return;
  mkdirSync3(dir, { recursive: true });
}
function touchTaskOutputFile(taskId) {
  ensureTaskOutputsDirExists();
  const filePath = getTaskOutputFilePath(taskId);
  if (!existsSync3(filePath)) {
    const parent = dirname2(filePath);
    if (!existsSync3(parent)) mkdirSync3(parent, { recursive: true });
    writeFileSync2(filePath, "", "utf8");
  }
  return filePath;
}
function appendTaskOutput(taskId, chunk) {
  try {
    ensureTaskOutputsDirExists();
    appendFileSync(getTaskOutputFilePath(taskId), chunk, "utf8");
  } catch {
  }
}
function readTaskOutput(taskId) {
  try {
    const filePath = getTaskOutputFilePath(taskId);
    if (!existsSync3(filePath)) return "";
    return readFileSync3(filePath, "utf8");
  } catch {
    return "";
  }
}
var PROJECT_ROOT;
var init_taskOutputStore = __esm({
  "src/utils/log/taskOutputStore.ts"() {
    init_env();
    PROJECT_ROOT = process.cwd();
  }
});

// src/utils/bun/shell.ts
import { spawn } from "child_process";
import { existsSync as existsSync4, mkdirSync as mkdirSync4, realpathSync as realpathSync2, statSync as statSync3 } from "fs";
import { randomUUID as randomUUID2 } from "crypto";
import { homedir as homedir2 } from "os";
import { dirname as dirname3, isAbsolute as isAbsolute2, resolve as resolve2 } from "path";
import which from "which";
function whichSync(bin) {
  try {
    return which.sync(bin, { nothrow: true }) ?? null;
  } catch {
    return null;
  }
}
function whichOrSelf(bin) {
  return whichSync(bin) ?? bin;
}
function spawnWithExited(options) {
  const child = spawn(options.cmd[0], options.cmd.slice(1), {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: ["inherit", "pipe", "pipe"],
    windowsHide: true
  });
  child.exited = new Promise((resolve3) => {
    const done = () => resolve3();
    child.once("exit", done);
    child.once("error", done);
  });
  return child;
}
function maybeAnnotateMacosSandboxStderr(stderr, sandbox) {
  if (!stderr) return stderr;
  if (!sandbox || sandbox.enabled !== true) return stderr;
  const platform = sandbox.__platformOverride ?? process.platform;
  if (platform !== "darwin") return stderr;
  if (stderr.includes("[sandbox]")) return stderr;
  const lower = stderr.toLowerCase();
  const looksLikeSandboxViolation = stderr.includes("DANYA_SANDBOX") || stderr.includes("KODE_SANDBOX") || lower.includes("sandbox-exec") && (lower.includes("deny") || lower.includes("operation not permitted")) || lower.includes("operation not permitted") && lower.includes("sandbox");
  if (!looksLikeSandboxViolation) return stderr;
  return [
    stderr.trimEnd(),
    "",
    "[sandbox] This failure looks like a macOS sandbox denial. Adjust sandbox settings (e.g. /sandbox or .kode/settings.json) to grant the minimal required access."
  ].join("\n");
}
function hasGlobPattern(value) {
  return value.includes("*") || value.includes("?") || value.includes("[") || value.includes("]");
}
function normalizeLinuxSandboxPath(input, options) {
  const cwd2 = options?.cwd ?? process.cwd();
  const homeDir = options?.homeDir ?? homedir2();
  let resolved = input;
  if (input === "~") resolved = homeDir;
  else if (input.startsWith("~/")) resolved = homeDir + input.slice(1);
  else if (input.startsWith("./") || input.startsWith("../"))
    resolved = resolve2(cwd2, input);
  else if (!isAbsolute2(input)) resolved = resolve2(cwd2, input);
  if (hasGlobPattern(resolved)) {
    const prefix = resolved.split(/[*?[\]]/)[0];
    if (prefix && prefix !== "/") {
      const dir = prefix.endsWith("/") ? prefix.slice(0, -1) : dirname3(prefix);
      try {
        const real = realpathSync2(dir);
        const suffix = resolved.slice(dir.length);
        return real + suffix;
      } catch {
      }
    }
    return resolved;
  }
  try {
    resolved = realpathSync2(resolved);
  } catch {
  }
  return resolved;
}
function buildLinuxBwrapFilesystemArgs(options) {
  const cwd2 = options.cwd ?? process.cwd();
  const homeDir = options.homeDir ?? homedir2();
  const args = [];
  const writeConfig = options.writeConfig;
  if (writeConfig) {
    args.push("--ro-bind", "/", "/");
    const allowedRoots = [];
    if (existsSync4("/tmp/kode")) {
      args.push("--bind", "/tmp/kode", "/tmp/kode");
      allowedRoots.push("/tmp/kode");
    }
    for (const raw of writeConfig.allowOnly ?? []) {
      const resolved = normalizeLinuxSandboxPath(raw, { cwd: cwd2, homeDir });
      if (resolved.startsWith("/dev/")) continue;
      if (!existsSync4(resolved)) continue;
      args.push("--bind", resolved, resolved);
      allowedRoots.push(resolved);
    }
    const denyWithinAllow = [
      ...writeConfig.denyWithinAllow ?? [],
      ...options.extraDenyWithinAllow ?? []
    ];
    for (const raw of denyWithinAllow) {
      const resolved = normalizeLinuxSandboxPath(raw, { cwd: cwd2, homeDir });
      if (resolved.startsWith("/dev/")) continue;
      if (!existsSync4(resolved)) continue;
      const withinAllowed = allowedRoots.some(
        (root) => resolved === root || resolved.startsWith(root + "/")
      );
      if (!withinAllowed) continue;
      args.push("--ro-bind", resolved, resolved);
    }
  } else {
    args.push("--bind", "/", "/");
  }
  const denyRead = [...options.readConfig?.denyOnly ?? []];
  if (existsSync4("/etc/ssh/ssh_config.d"))
    denyRead.push("/etc/ssh/ssh_config.d");
  for (const raw of denyRead) {
    const resolved = normalizeLinuxSandboxPath(raw, { cwd: cwd2, homeDir });
    if (resolved.startsWith("/dev/")) continue;
    if (!existsSync4(resolved)) continue;
    if (statSync3(resolved).isDirectory()) args.push("--tmpfs", resolved);
    else args.push("--ro-bind", "/dev/null", resolved);
  }
  return args;
}
function buildLinuxBwrapCommand(options) {
  const args = [];
  args.push(
    "--die-with-parent",
    "--new-session",
    "--unshare-pid",
    "--unshare-uts",
    "--unshare-ipc"
  );
  if (options.needsNetworkRestriction) args.push("--unshare-net");
  args.push(
    ...buildLinuxBwrapFilesystemArgs({
      cwd: options.cwd,
      homeDir: options.homeDir,
      readConfig: options.readConfig,
      writeConfig: options.writeConfig
    })
  );
  args.push(
    "--dev",
    "/dev",
    "--setenv",
    "SANDBOX_RUNTIME",
    "1",
    "--setenv",
    "TMPDIR",
    "/tmp/kode"
  );
  if (!options.enableWeakerNestedSandbox) args.push("--proc", "/proc");
  args.push("--", options.binShellPath, "-c", options.command);
  return [options.bwrapPath, ...args];
}
function buildSandboxEnvAssignments(options) {
  const httpProxyPort = options?.httpProxyPort;
  const socksProxyPort = options?.socksProxyPort;
  const platform = options?.platform ?? process.platform;
  const env2 = ["SANDBOX_RUNTIME=1", "TMPDIR=/tmp/kode"];
  if (!httpProxyPort && !socksProxyPort) return env2;
  const noProxy = [
    "localhost",
    "127.0.0.1",
    "::1",
    "*.local",
    ".local",
    "169.254.0.0/16",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16"
  ].join(",");
  env2.push(`NO_PROXY=${noProxy}`);
  env2.push(`no_proxy=${noProxy}`);
  if (httpProxyPort) {
    env2.push(`HTTP_PROXY=http://localhost:${httpProxyPort}`);
    env2.push(`HTTPS_PROXY=http://localhost:${httpProxyPort}`);
    env2.push(`http_proxy=http://localhost:${httpProxyPort}`);
    env2.push(`https_proxy=http://localhost:${httpProxyPort}`);
  }
  if (socksProxyPort) {
    env2.push(`ALL_PROXY=socks5h://localhost:${socksProxyPort}`);
    env2.push(`all_proxy=socks5h://localhost:${socksProxyPort}`);
    if (platform === "darwin") {
      env2.push(
        `GIT_SSH_COMMAND="ssh -o ProxyCommand='nc -X 5 -x localhost:${socksProxyPort} %h %p'"`
      );
    }
    env2.push(`FTP_PROXY=socks5h://localhost:${socksProxyPort}`);
    env2.push(`ftp_proxy=socks5h://localhost:${socksProxyPort}`);
    env2.push(`RSYNC_PROXY=localhost:${socksProxyPort}`);
    env2.push(
      `DOCKER_HTTP_PROXY=http://localhost:${httpProxyPort || socksProxyPort}`
    );
    env2.push(
      `DOCKER_HTTPS_PROXY=http://localhost:${httpProxyPort || socksProxyPort}`
    );
    if (httpProxyPort) {
      env2.push("CLOUDSDK_PROXY_TYPE=https");
      env2.push("CLOUDSDK_PROXY_ADDRESS=localhost");
      env2.push(`CLOUDSDK_PROXY_PORT=${httpProxyPort}`);
    }
    env2.push(`GRPC_PROXY=socks5h://localhost:${socksProxyPort}`);
    env2.push(`grpc_proxy=socks5h://localhost:${socksProxyPort}`);
  }
  return env2;
}
function escapeRegexForSandboxGlobPattern(pattern) {
  return "^" + pattern.replace(/[.^$+{}()|\\]/g, "\\$&").replace(/\[([^\]]*?)$/g, "\\[$1").replace(/\*\*\//g, "__GLOBSTAR_SLASH__").replace(/\*\*/g, "__GLOBSTAR__").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]").replace(/__GLOBSTAR_SLASH__/g, "(.*/)?").replace(/__GLOBSTAR__/g, ".*") + "$";
}
function getMacosTmpDirWriteAllowPaths() {
  const tmpdirValue = process.env.TMPDIR;
  if (!tmpdirValue) return [];
  if (!tmpdirValue.match(/^\/(private\/)?var\/folders\/[^/]{2}\/[^/]+\/T\/?$/))
    return [];
  const base = tmpdirValue.replace(/\/T\/?$/, "");
  if (base.startsWith("/private/var/"))
    return [base, base.replace("/private", "")];
  if (base.startsWith("/var/")) return [base, "/private" + base];
  return [base];
}
function buildMacosSandboxDenyUnlinkRules(paths2, logTag) {
  const lines = [];
  for (const raw of paths2) {
    const normalized = normalizeLinuxSandboxPath(raw);
    if (hasGlobPattern(normalized)) {
      const regex = escapeRegexForSandboxGlobPattern(normalized);
      lines.push(
        "(deny file-write-unlink",
        `  (regex ${JSON.stringify(regex)})`,
        `  (with message "${logTag}"))`
      );
      const prefix = normalized.split(/[*?[\]]/)[0];
      if (prefix && prefix !== "/") {
        const literal = prefix.endsWith("/") ? prefix.slice(0, -1) : dirname3(prefix);
        lines.push(
          "(deny file-write-unlink",
          `  (literal ${JSON.stringify(literal)})`,
          `  (with message "${logTag}"))`
        );
      }
      continue;
    }
    lines.push(
      "(deny file-write-unlink",
      `  (subpath ${JSON.stringify(normalized)})`,
      `  (with message "${logTag}"))`
    );
  }
  return lines;
}
function buildMacosSandboxFileReadRules(readConfig, logTag) {
  if (!readConfig) return ["(allow file-read*)"];
  const lines = ["(allow file-read*)"];
  for (const raw of readConfig.denyOnly ?? []) {
    const normalized = normalizeLinuxSandboxPath(raw);
    if (hasGlobPattern(normalized)) {
      const regex = escapeRegexForSandboxGlobPattern(normalized);
      lines.push(
        "(deny file-read*",
        `  (regex ${JSON.stringify(regex)})`,
        `  (with message "${logTag}"))`
      );
    } else {
      lines.push(
        "(deny file-read*",
        `  (subpath ${JSON.stringify(normalized)})`,
        `  (with message "${logTag}"))`
      );
    }
  }
  lines.push(
    ...buildMacosSandboxDenyUnlinkRules(readConfig.denyOnly ?? [], logTag)
  );
  return lines;
}
function buildMacosSandboxFileWriteRules(writeConfig, logTag) {
  if (!writeConfig) return ["(allow file-write*)"];
  const lines = [];
  lines.push(
    "(allow file-write*",
    `  (literal "/dev/null")`,
    `  (with message "${logTag}"))`
  );
  for (const raw of getMacosTmpDirWriteAllowPaths()) {
    const normalized = normalizeLinuxSandboxPath(raw);
    lines.push(
      "(allow file-write*",
      `  (subpath ${JSON.stringify(normalized)})`,
      `  (with message "${logTag}"))`
    );
  }
  for (const raw of writeConfig.allowOnly ?? []) {
    const normalized = normalizeLinuxSandboxPath(raw);
    if (hasGlobPattern(normalized)) {
      const regex = escapeRegexForSandboxGlobPattern(normalized);
      lines.push(
        "(allow file-write*",
        `  (regex ${JSON.stringify(regex)})`,
        `  (with message "${logTag}"))`
      );
    } else {
      lines.push(
        "(allow file-write*",
        `  (subpath ${JSON.stringify(normalized)})`,
        `  (with message "${logTag}"))`
      );
    }
  }
  for (const raw of writeConfig.denyWithinAllow ?? []) {
    const normalized = normalizeLinuxSandboxPath(raw);
    if (hasGlobPattern(normalized)) {
      const regex = escapeRegexForSandboxGlobPattern(normalized);
      lines.push(
        "(deny file-write*",
        `  (regex ${JSON.stringify(regex)})`,
        `  (with message "${logTag}"))`
      );
    } else {
      lines.push(
        "(deny file-write*",
        `  (subpath ${JSON.stringify(normalized)})`,
        `  (with message "${logTag}"))`
      );
    }
  }
  lines.push(
    ...buildMacosSandboxDenyUnlinkRules(
      writeConfig.denyWithinAllow ?? [],
      logTag
    )
  );
  return lines;
}
function buildMacosSandboxExecCommand(options) {
  const logTag = "DANYA_SANDBOX";
  const profileLines = [
    "(version 1)",
    `(deny default (with message "${logTag}"))`,
    "",
    "; Danya sandbox-exec profile (reference CLI compatible)",
    "",
    "(allow process*)",
    "(allow sysctl-read)",
    "(allow mach-lookup)",
    "",
    "; Network"
  ];
  const allowUnixSockets = options.allowUnixSockets ?? [];
  if (!options.needsNetworkRestriction) {
    profileLines.push("(allow network*)");
  } else {
    if (options.allowLocalBinding) {
      profileLines.push('(allow network-bind (local ip "localhost:*"))');
      profileLines.push('(allow network-inbound (local ip "localhost:*"))');
      profileLines.push('(allow network-outbound (local ip "localhost:*"))');
    }
    if (options.allowAllUnixSockets) {
      profileLines.push('(allow network* (subpath "/"))');
    } else if (allowUnixSockets.length > 0) {
      for (const socketPath of allowUnixSockets) {
        const normalized = normalizeLinuxSandboxPath(socketPath);
        profileLines.push(
          `(allow network* (subpath ${JSON.stringify(normalized)}))`
        );
      }
    }
    if (options.httpProxyPort !== void 0) {
      profileLines.push(
        `(allow network-bind (local ip "localhost:${options.httpProxyPort}"))`
      );
      profileLines.push(
        `(allow network-inbound (local ip "localhost:${options.httpProxyPort}"))`
      );
      profileLines.push(
        `(allow network-outbound (remote ip "localhost:${options.httpProxyPort}"))`
      );
    }
    if (options.socksProxyPort !== void 0) {
      profileLines.push(
        `(allow network-bind (local ip "localhost:${options.socksProxyPort}"))`
      );
      profileLines.push(
        `(allow network-inbound (local ip "localhost:${options.socksProxyPort}"))`
      );
      profileLines.push(
        `(allow network-outbound (remote ip "localhost:${options.socksProxyPort}"))`
      );
    }
  }
  profileLines.push("");
  profileLines.push("; File read");
  profileLines.push(
    ...buildMacosSandboxFileReadRules(options.readConfig, logTag)
  );
  profileLines.push("");
  profileLines.push("; File write");
  profileLines.push(
    ...buildMacosSandboxFileWriteRules(options.writeConfig, logTag)
  );
  const profile = profileLines.join("\n");
  const envAssignments = buildSandboxEnvAssignments({
    httpProxyPort: options.httpProxyPort,
    socksProxyPort: options.socksProxyPort,
    platform: "darwin"
  });
  const envPrefix = envAssignments.length ? `export ${envAssignments.join(" ")} && ` : "";
  return [
    options.sandboxExecPath,
    "-p",
    profile,
    options.binShellPath,
    "-c",
    `${envPrefix}${options.command}`
  ];
}
function renderBackgroundShellStatusAttachment(attachment) {
  const parts = [];
  if (attachment.stdoutLineDelta > 0) {
    const n = attachment.stdoutLineDelta;
    parts.push(`${n} line${n > 1 ? "s" : ""} of stdout`);
  }
  if (attachment.stderrLineDelta > 0) {
    const n = attachment.stderrLineDelta;
    parts.push(`${n} line${n > 1 ? "s" : ""} of stderr`);
  }
  if (parts.length === 0) return "";
  return `Background bash ${attachment.taskId} has new output: ${parts.join(", ")}. Read ${attachment.outputFile} to see output.`;
}
function renderBashNotification(notification) {
  const status = notification.status;
  const exitCode = notification.exitCode;
  const summarySuffix = status === "completed" ? `completed${exitCode !== void 0 ? ` (exit code ${exitCode})` : ""}` : status === "failed" ? `failed${exitCode !== void 0 ? ` with exit code ${exitCode}` : ""}` : "was killed";
  return [
    "<bash-notification>",
    `<shell-id>${notification.taskId}</shell-id>`,
    `<output-file>${notification.outputFile}</output-file>`,
    `<status>${status}</status>`,
    `<summary>Background command "${notification.description}" ${summarySuffix}.</summary>`,
    "Read the output file to retrieve the output.",
    "</bash-notification>"
  ].join("\n");
}
var BunShell;
var init_shell = __esm({
  "src/utils/bun/shell.ts"() {
    init_log();
    init_taskOutputStore();
    BunShell = class _BunShell {
      cwd;
      isAlive = true;
      currentProcess = null;
      abortController = null;
      backgroundProcesses = /* @__PURE__ */ new Map();
      constructor(cwd2) {
        this.cwd = cwd2;
      }
      static instance = null;
      static restart() {
        if (_BunShell.instance) {
          _BunShell.instance.close();
          _BunShell.instance = null;
        }
      }
      static getInstance() {
        if (!_BunShell.instance || !_BunShell.instance.isAlive) {
          _BunShell.instance = new _BunShell(process.cwd());
        }
        return _BunShell.instance;
      }
      static getShellCmdForPlatform(platform, command, env2 = process.env) {
        if (platform === "win32") {
          const comspec = typeof env2.ComSpec === "string" && env2.ComSpec.length > 0 ? env2.ComSpec : "cmd";
          return [comspec, "/c", command];
        }
        const sh = existsSync4("/bin/sh") ? "/bin/sh" : "sh";
        return [sh, "-c", command];
      }
      getShellCmd(command) {
        return _BunShell.getShellCmdForPlatform(
          process.platform,
          command,
          process.env
        );
      }
      buildSandboxCmd(command, sandbox) {
        if (!sandbox.enabled) return null;
        const platform = sandbox.__platformOverride ?? process.platform;
        const needsNetworkRestriction = sandbox.needsNetworkRestriction !== void 0 ? sandbox.needsNetworkRestriction : sandbox.allowNetwork === true ? false : true;
        const writeConfig = sandbox.writeConfig ?? (sandbox.writableRoots && sandbox.writableRoots.length > 0 ? { allowOnly: sandbox.writableRoots.filter(Boolean) } : void 0);
        const readConfig = sandbox.readConfig;
        const hasReadRestrictions = (readConfig?.denyOnly?.length ?? 0) > 0;
        const hasWriteRestrictions = writeConfig !== void 0;
        const hasNetworkRestrictions = needsNetworkRestriction === true;
        if (!hasReadRestrictions && !hasWriteRestrictions && !hasNetworkRestrictions) {
          return null;
        }
        const binShell = sandbox.binShell ?? (whichSync("bash") ? "bash" : "sh");
        const binShellPath = whichOrSelf(binShell);
        const cwd2 = sandbox.chdir || this.cwd;
        if (platform === "linux") {
          const bwrapPath = sandbox.__bwrapPathOverride !== void 0 ? sandbox.__bwrapPathOverride : whichSync("bwrap") ?? whichSync("bubblewrap");
          if (!bwrapPath) {
            return null;
          }
          try {
            mkdirSync4("/tmp/kode", { recursive: true });
          } catch {
          }
          const cmd = buildLinuxBwrapCommand({
            bwrapPath,
            command,
            needsNetworkRestriction,
            readConfig,
            writeConfig,
            enableWeakerNestedSandbox: sandbox.enableWeakerNestedSandbox,
            binShellPath,
            cwd: cwd2
          });
          return { cmd };
        }
        if (platform === "darwin") {
          const sandboxExecPath = sandbox.__sandboxExecPathOverride !== void 0 ? sandbox.__sandboxExecPathOverride : existsSync4("/usr/bin/sandbox-exec") ? "/usr/bin/sandbox-exec" : whichSync("sandbox-exec");
          if (!sandboxExecPath) {
            return null;
          }
          try {
            mkdirSync4("/tmp/kode", { recursive: true });
          } catch {
          }
          try {
            mkdirSync4("/private/tmp/kode", { recursive: true });
          } catch {
          }
          return {
            cmd: buildMacosSandboxExecCommand({
              sandboxExecPath,
              binShellPath,
              command,
              needsNetworkRestriction,
              httpProxyPort: sandbox.httpProxyPort,
              socksProxyPort: sandbox.socksProxyPort,
              allowUnixSockets: sandbox.allowUnixSockets,
              allowAllUnixSockets: sandbox.allowAllUnixSockets,
              allowLocalBinding: sandbox.allowLocalBinding,
              readConfig,
              writeConfig
            })
          };
        }
        return null;
      }
      isSandboxInitFailure(stderr) {
        const s = stderr.toLowerCase();
        return s.includes("bwrap:") || s.includes("bubblewrap") || s.includes("namespace") && s.includes("failed");
      }
      startStreamReader(stream, append) {
        if (!stream) return;
        try {
          ;
          stream.setEncoding?.("utf8");
        } catch {
        }
        stream.on("data", (chunk) => {
          append(
            typeof chunk === "string" ? chunk : Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk)
          );
        });
        stream.on("error", (err) => {
          logError(`Stream read error: ${err}`);
        });
      }
      createCancellableTextCollector(stream, options) {
        let text = "";
        const collectText = options?.collectText !== false;
        if (!stream) {
          return {
            getText: () => text,
            done: Promise.resolve(),
            cancel: async () => {
            }
          };
        }
        let cancelled = false;
        let resolveDone = null;
        const done = new Promise((resolve3) => {
          resolveDone = resolve3;
        });
        const finish = () => {
          if (!resolveDone) return;
          resolveDone();
          resolveDone = null;
        };
        const onData = (chunk) => {
          if (cancelled) return;
          const s = typeof chunk === "string" ? chunk : Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
          if (collectText) text += s;
          options?.onChunk?.(s);
        };
        const onEnd = () => {
          cleanup();
          finish();
        };
        const onClose = () => {
          cleanup();
          finish();
        };
        const cleanup = () => {
          stream.off("data", onData);
          stream.off("end", onEnd);
          stream.off("close", onClose);
          stream.off("error", onError);
        };
        const onError = (err) => {
          if (!cancelled) {
            logError(`Stream read error: ${err}`);
          }
          cleanup();
          finish();
        };
        try {
          ;
          stream.setEncoding?.("utf8");
        } catch {
        }
        stream.on("data", onData);
        stream.once("end", onEnd);
        stream.once("close", onClose);
        stream.once("error", onError);
        return {
          getText: () => text,
          done,
          cancel: async () => {
            if (cancelled) return;
            cancelled = true;
            cleanup();
            finish();
          }
        };
      }
      static makeBackgroundTaskId() {
        return `b${randomUUID2().replace(/-/g, "").slice(0, 6)}`;
      }
      execPromotable(command, abortSignal, timeout, options) {
        const DEFAULT_TIMEOUT = 12e4;
        const commandTimeout = timeout ?? DEFAULT_TIMEOUT;
        const startedAt = Date.now();
        const sandbox = options?.sandbox;
        const shouldAttemptSandbox = sandbox?.enabled === true;
        const executionCwd = shouldAttemptSandbox && sandbox?.chdir ? sandbox.chdir : this.cwd;
        if (abortSignal?.aborted) {
          return {
            get status() {
              return "killed";
            },
            background: () => null,
            kill: () => {
            },
            result: Promise.resolve({
              stdout: "",
              stderr: "Command aborted before execution",
              code: 145,
              interrupted: true
            })
          };
        }
        const sandboxCmd = shouldAttemptSandbox ? this.buildSandboxCmd(command, sandbox) : null;
        if (shouldAttemptSandbox && sandbox?.require && !sandboxCmd) {
          return {
            get status() {
              return "killed";
            },
            background: () => null,
            kill: () => {
            },
            result: Promise.resolve({
              stdout: "",
              stderr: "System sandbox is required but unavailable (missing bubblewrap or unsupported platform).",
              code: 2,
              interrupted: false
            })
          };
        }
        const cmdToRun = sandboxCmd ? sandboxCmd.cmd : this.getShellCmd(command);
        const internalAbortController = new AbortController();
        this.abortController = internalAbortController;
        let status = "running";
        let backgroundProcess = null;
        let backgroundTaskId = null;
        let stdout = "";
        let stderr = "";
        let wasAborted = false;
        let wasBackgrounded = false;
        let timeoutHandle = null;
        let timedOut = false;
        let onTimeoutCb = null;
        const countNonEmptyLines = (chunk) => chunk.split("\n").filter((line) => line.length > 0).length;
        const spawnedProcess = spawnWithExited({ cmd: cmdToRun, cwd: executionCwd });
        this.currentProcess = spawnedProcess;
        const onAbort = () => {
          if (status === "backgrounded") return;
          wasAborted = true;
          try {
            internalAbortController.abort();
          } catch {
          }
          try {
            spawnedProcess.kill();
          } catch {
          }
          if (backgroundProcess) backgroundProcess.interrupted = true;
        };
        const clearForegroundGuards = () => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
          if (abortSignal) {
            abortSignal.removeEventListener("abort", onAbort);
          }
        };
        if (abortSignal) {
          abortSignal.addEventListener("abort", onAbort, { once: true });
          if (abortSignal.aborted) onAbort();
        }
        const stdoutCollector = this.createCancellableTextCollector(
          spawnedProcess.stdout,
          {
            collectText: false,
            onChunk: (chunk) => {
              stdout += chunk;
              options?.onStdoutChunk?.(chunk);
              if (backgroundProcess) {
                backgroundProcess.stdout = stdout;
                appendTaskOutput(backgroundProcess.id, chunk);
                backgroundProcess.stdoutLineCount += countNonEmptyLines(chunk);
              }
            }
          }
        );
        const stderrCollector = this.createCancellableTextCollector(
          spawnedProcess.stderr,
          {
            collectText: false,
            onChunk: (chunk) => {
              stderr += chunk;
              options?.onStderrChunk?.(chunk);
              if (backgroundProcess) {
                backgroundProcess.stderr = stderr;
                appendTaskOutput(backgroundProcess.id, chunk);
                backgroundProcess.stderrLineCount += countNonEmptyLines(chunk);
              }
            }
          }
        );
        timeoutHandle = setTimeout(() => {
          if (status !== "running") return;
          if (onTimeoutCb) {
            onTimeoutCb(background);
            return;
          }
          timedOut = true;
          try {
            spawnedProcess.kill();
          } catch {
          }
          try {
            internalAbortController.abort();
          } catch {
          }
        }, commandTimeout);
        const background = (bashId) => {
          if (backgroundTaskId) return { bashId: backgroundTaskId };
          if (status !== "running") return null;
          backgroundTaskId = bashId ?? _BunShell.makeBackgroundTaskId();
          const outputFile = touchTaskOutputFile(backgroundTaskId);
          if (stdout) appendTaskOutput(backgroundTaskId, stdout);
          if (stderr) appendTaskOutput(backgroundTaskId, stderr);
          status = "backgrounded";
          wasBackgrounded = true;
          clearForegroundGuards();
          backgroundProcess = {
            id: backgroundTaskId,
            command,
            stdout,
            stderr,
            stdoutCursor: 0,
            stderrCursor: 0,
            stdoutLineCount: countNonEmptyLines(stdout),
            stderrLineCount: countNonEmptyLines(stderr),
            lastReportedStdoutLines: 0,
            lastReportedStderrLines: 0,
            code: null,
            interrupted: false,
            killed: false,
            timedOut: false,
            completionStatusSentInAttachment: false,
            notified: false,
            startedAt,
            timeoutAt: Number.POSITIVE_INFINITY,
            process: spawnedProcess,
            abortController: internalAbortController,
            timeoutHandle: null,
            cwd: executionCwd,
            outputFile
          };
          this.backgroundProcesses.set(backgroundTaskId, backgroundProcess);
          this.currentProcess = null;
          this.abortController = null;
          return { bashId: backgroundTaskId };
        };
        const kill = () => {
          status = "killed";
          try {
            spawnedProcess.kill();
          } catch {
          }
          try {
            internalAbortController.abort();
          } catch {
          }
          if (backgroundProcess) {
            backgroundProcess.interrupted = true;
            backgroundProcess.killed = true;
          }
        };
        const result = (async () => {
          try {
            await spawnedProcess.exited;
            if (status === "running" || status === "backgrounded")
              status = "completed";
            if (backgroundProcess) {
              backgroundProcess.code = spawnedProcess.exitCode ?? 0;
              backgroundProcess.interrupted = backgroundProcess.interrupted || wasAborted || internalAbortController.signal.aborted;
            }
            if (!wasBackgrounded) {
              await Promise.race([
                Promise.allSettled([stdoutCollector.done, stderrCollector.done]),
                new Promise((resolve3) => setTimeout(resolve3, 250))
              ]);
              await Promise.allSettled([
                stdoutCollector.cancel(),
                stderrCollector.cancel()
              ]);
            }
            const interrupted = wasAborted || abortSignal?.aborted === true || internalAbortController.signal.aborted === true || timedOut;
            let code = spawnedProcess.exitCode;
            if (!Number.isFinite(code)) {
              code = interrupted ? 143 : 0;
            }
            const stderrWithTimeout = timedOut ? [`Command timed out`, stderr].filter(Boolean).join("\n") : stderr;
            const stderrAnnotated = sandboxCmd ? maybeAnnotateMacosSandboxStderr(stderrWithTimeout, sandbox) : stderrWithTimeout;
            return {
              stdout,
              stderr: stderrAnnotated,
              code,
              interrupted
            };
          } finally {
            clearForegroundGuards();
            if (this.currentProcess === spawnedProcess) {
              this.currentProcess = null;
              this.abortController = null;
            }
          }
        })();
        const execHandle = {
          get status() {
            return status;
          },
          background,
          kill,
          result
        };
        execHandle.onTimeout = (cb) => {
          onTimeoutCb = cb;
        };
        result.then((r) => {
          if (!backgroundProcess || !backgroundTaskId) return;
          backgroundProcess.code = r.code;
          backgroundProcess.interrupted = r.interrupted;
        }).catch(() => {
          if (!backgroundProcess) return;
          backgroundProcess.code = backgroundProcess.code ?? 2;
        });
        return execHandle;
      }
      async exec(command, abortSignal, timeout, options) {
        const DEFAULT_TIMEOUT = 12e4;
        const commandTimeout = timeout ?? DEFAULT_TIMEOUT;
        this.abortController = new AbortController();
        let wasAborted = false;
        const onAbort = () => {
          wasAborted = true;
          try {
            this.abortController?.abort();
          } catch {
          }
          try {
            this.currentProcess?.kill();
          } catch {
          }
        };
        if (abortSignal) {
          abortSignal.addEventListener("abort", onAbort, { once: true });
        }
        const sandbox = options?.sandbox;
        const shouldAttemptSandbox = sandbox?.enabled === true;
        const executionCwd = shouldAttemptSandbox && sandbox?.chdir ? sandbox.chdir : this.cwd;
        const runOnce = async (cmd, cwdOverride) => {
          this.currentProcess = spawnWithExited({
            cmd,
            cwd: cwdOverride ?? executionCwd
          });
          const stdoutCollector = this.createCancellableTextCollector(
            this.currentProcess.stdout,
            { onChunk: options?.onStdoutChunk }
          );
          const stderrCollector = this.createCancellableTextCollector(
            this.currentProcess.stderr,
            { onChunk: options?.onStderrChunk }
          );
          let timeoutHandle = null;
          const timeoutPromise = new Promise((resolve3) => {
            timeoutHandle = setTimeout(() => resolve3("timeout"), commandTimeout);
          });
          const result = await Promise.race([
            this.currentProcess.exited.then(() => "completed"),
            timeoutPromise
          ]);
          if (timeoutHandle) clearTimeout(timeoutHandle);
          if (result === "timeout") {
            try {
              this.currentProcess.kill();
            } catch {
            }
            try {
              this.abortController.abort();
            } catch {
            }
            try {
              await this.currentProcess.exited;
            } catch {
            }
            await Promise.race([
              Promise.allSettled([stdoutCollector.done, stderrCollector.done]),
              new Promise((resolve3) => setTimeout(resolve3, 250))
            ]);
            await Promise.allSettled([
              stdoutCollector.cancel(),
              stderrCollector.cancel()
            ]);
            return {
              stdout: "",
              stderr: "Command timed out",
              code: 143,
              interrupted: true
            };
          }
          await Promise.race([
            Promise.allSettled([stdoutCollector.done, stderrCollector.done]),
            new Promise((resolve3) => setTimeout(resolve3, 250))
          ]);
          await Promise.allSettled([
            stdoutCollector.cancel(),
            stderrCollector.cancel()
          ]);
          const stdout = stdoutCollector.getText();
          const stderr = stderrCollector.getText();
          const interrupted = wasAborted || abortSignal?.aborted === true || this.abortController?.signal.aborted === true;
          const exitCode = this.currentProcess.exitCode ?? (interrupted ? 143 : 0);
          return {
            stdout,
            stderr,
            code: exitCode,
            interrupted
          };
        };
        try {
          if (shouldAttemptSandbox) {
            const sandboxCmd = this.buildSandboxCmd(command, sandbox);
            if (!sandboxCmd) {
              if (sandbox?.require) {
                return {
                  stdout: "",
                  stderr: "System sandbox is required but unavailable (missing bubblewrap or unsupported platform).",
                  code: 2,
                  interrupted: false
                };
              }
              const fallback = await runOnce(this.getShellCmd(command));
              return {
                ...fallback,
                stderr: `[sandbox] unavailable, ran without isolation.
${fallback.stderr}`.trim()
              };
            }
            const sandboxed = await runOnce(sandboxCmd.cmd);
            sandboxed.stderr = maybeAnnotateMacosSandboxStderr(
              sandboxed.stderr,
              sandbox
            );
            if (!sandboxed.interrupted && sandboxed.code !== 0 && this.isSandboxInitFailure(sandboxed.stderr) && !sandbox?.require) {
              const fallback = await runOnce(this.getShellCmd(command));
              return {
                ...fallback,
                stderr: `[sandbox] failed to start, ran without isolation.
${fallback.stderr}`.trim()
              };
            }
            return sandboxed;
          }
          return await runOnce(this.getShellCmd(command));
        } catch (error) {
          if (this.abortController.signal.aborted) {
            this.currentProcess?.kill();
            return {
              stdout: "",
              stderr: "Command was interrupted",
              code: 143,
              interrupted: true
            };
          }
          const errorStr = error instanceof Error ? error.message : String(error);
          logError(`Shell execution error: ${errorStr}`);
          return {
            stdout: "",
            stderr: errorStr,
            code: 2,
            interrupted: false
          };
        } finally {
          if (abortSignal) {
            abortSignal.removeEventListener("abort", onAbort);
          }
          this.currentProcess = null;
          this.abortController = null;
        }
      }
      execInBackground(command, timeout, options) {
        const DEFAULT_TIMEOUT = 12e4;
        const commandTimeout = timeout ?? DEFAULT_TIMEOUT;
        const abortController = new AbortController();
        const sandbox = options?.sandbox;
        const sandboxCmd = sandbox?.enabled === true ? this.buildSandboxCmd(command, sandbox) : null;
        const executionCwd = sandbox?.enabled === true && sandbox?.chdir ? sandbox.chdir : this.cwd;
        if (sandbox?.enabled === true && sandbox?.require && !sandboxCmd) {
          throw new Error(
            "System sandbox is required but unavailable (missing bubblewrap or unsupported platform)."
          );
        }
        const cmdToRun = sandboxCmd ? sandboxCmd.cmd : this.getShellCmd(command);
        const bashId = _BunShell.makeBackgroundTaskId();
        const outputFile = touchTaskOutputFile(bashId);
        const process2 = spawnWithExited({ cmd: cmdToRun, cwd: executionCwd });
        const timeoutHandle = setTimeout(() => {
          abortController.abort();
          backgroundProcess.timedOut = true;
          process2.kill();
        }, commandTimeout);
        const backgroundProcess = {
          id: bashId,
          command,
          stdout: "",
          stderr: "",
          stdoutCursor: 0,
          stderrCursor: 0,
          stdoutLineCount: 0,
          stderrLineCount: 0,
          lastReportedStdoutLines: 0,
          lastReportedStderrLines: 0,
          code: null,
          interrupted: false,
          killed: false,
          timedOut: false,
          completionStatusSentInAttachment: false,
          notified: false,
          startedAt: Date.now(),
          timeoutAt: Date.now() + commandTimeout,
          process: process2,
          abortController,
          timeoutHandle,
          cwd: executionCwd,
          outputFile
        };
        const countNonEmptyLines = (chunk) => chunk.split("\n").filter((line) => line.length > 0).length;
        this.startStreamReader(process2.stdout, (chunk) => {
          backgroundProcess.stdout += chunk;
          appendTaskOutput(bashId, chunk);
          backgroundProcess.stdoutLineCount += countNonEmptyLines(chunk);
        });
        this.startStreamReader(process2.stderr, (chunk) => {
          backgroundProcess.stderr += chunk;
          appendTaskOutput(bashId, chunk);
          backgroundProcess.stderrLineCount += countNonEmptyLines(chunk);
        });
        process2.exited.then(() => {
          backgroundProcess.code = process2.exitCode ?? 0;
          backgroundProcess.interrupted = backgroundProcess.interrupted || abortController.signal.aborted;
          if (sandbox?.enabled === true) {
            backgroundProcess.stderr = maybeAnnotateMacosSandboxStderr(
              backgroundProcess.stderr,
              sandbox
            );
          }
          if (backgroundProcess.timeoutHandle) {
            clearTimeout(backgroundProcess.timeoutHandle);
            backgroundProcess.timeoutHandle = null;
          }
        });
        this.backgroundProcesses.set(bashId, backgroundProcess);
        return { bashId };
      }
      getBackgroundOutput(shellId) {
        const proc = this.backgroundProcesses.get(shellId);
        if (!proc) return null;
        const running = proc.code === null && !proc.interrupted;
        return {
          stdout: proc.stdout,
          stderr: proc.stderr,
          code: proc.code,
          interrupted: proc.interrupted,
          killed: proc.killed,
          timedOut: proc.timedOut,
          running,
          command: proc.command,
          cwd: proc.cwd,
          startedAt: proc.startedAt,
          timeoutAt: proc.timeoutAt,
          outputFile: proc.outputFile
        };
      }
      readBackgroundOutput(bashId, options) {
        const proc = this.backgroundProcesses.get(bashId);
        if (!proc) return null;
        const stdoutDelta = proc.stdout.slice(proc.stdoutCursor);
        const stderrDelta = proc.stderr.slice(proc.stderrCursor);
        proc.stdoutCursor = proc.stdout.length;
        proc.stderrCursor = proc.stderr.length;
        const stdoutLines = stdoutDelta === "" ? 0 : stdoutDelta.split("\n").length;
        const stderrLines = stderrDelta === "" ? 0 : stderrDelta.split("\n").length;
        let stdoutToReturn = stdoutDelta;
        let stderrToReturn = stderrDelta;
        const filter = options?.filter?.trim();
        if (filter) {
          const regex = new RegExp(filter, "i");
          stdoutToReturn = stdoutDelta.split("\n").filter((line) => regex.test(line)).join("\n");
          stderrToReturn = stderrDelta.split("\n").filter((line) => regex.test(line)).join("\n");
        }
        const status = proc.killed ? "killed" : proc.code === null ? "running" : proc.code === 0 ? "completed" : "failed";
        return {
          shellId: bashId,
          command: proc.command,
          cwd: proc.cwd,
          startedAt: proc.startedAt,
          timeoutAt: proc.timeoutAt,
          status,
          exitCode: proc.code,
          stdout: stdoutToReturn,
          stderr: stderrToReturn,
          stdoutLines,
          stderrLines,
          ...filter ? { filterPattern: filter } : {}
        };
      }
      killBackgroundShell(shellId) {
        const proc = this.backgroundProcesses.get(shellId);
        if (!proc) return false;
        try {
          proc.interrupted = true;
          proc.killed = true;
          proc.abortController.abort();
          proc.process.kill();
          if (proc.timeoutHandle) {
            clearTimeout(proc.timeoutHandle);
            proc.timeoutHandle = null;
          }
          return true;
        } catch {
          return false;
        }
      }
      listBackgroundShells() {
        return Array.from(this.backgroundProcesses.values());
      }
      pwd() {
        return this.cwd;
      }
      async setCwd(cwd2) {
        const resolved = isAbsolute2(cwd2) ? cwd2 : resolve2(this.cwd, cwd2);
        if (!existsSync4(resolved)) {
          throw new Error(`Path "${resolved}" does not exist`);
        }
        this.cwd = resolved;
      }
      killChildren() {
        this.abortController?.abort();
        this.currentProcess?.kill();
        for (const bg of Array.from(this.backgroundProcesses.keys())) {
          this.killBackgroundShell(bg);
        }
      }
      close() {
        this.isAlive = false;
        this.killChildren();
      }
      flushBashNotifications() {
        const processes = Array.from(this.backgroundProcesses.values());
        const statusFor = (proc) => proc.killed ? "killed" : proc.code === null ? "running" : proc.code === 0 ? "completed" : "failed";
        const notifications = [];
        for (const proc of processes) {
          if (proc.notified) continue;
          const status = statusFor(proc);
          if (status === "running") continue;
          notifications.push({
            type: "bash_notification",
            taskId: proc.id,
            description: proc.command,
            outputFile: proc.outputFile || getTaskOutputFilePath(proc.id),
            status,
            ...proc.code !== null ? { exitCode: proc.code } : {}
          });
          proc.notified = true;
        }
        return notifications;
      }
      flushBackgroundShellStatusAttachments() {
        const processes = Array.from(this.backgroundProcesses.values());
        const statusFor = (proc) => proc.killed ? "killed" : proc.code === null ? "running" : proc.code === 0 ? "completed" : "failed";
        const progressAttachments = [];
        for (const proc of processes) {
          if (statusFor(proc) !== "running") continue;
          const stdoutDelta = proc.stdoutLineCount - proc.lastReportedStdoutLines;
          const stderrDelta = proc.stderrLineCount - proc.lastReportedStderrLines;
          if (stdoutDelta === 0 && stderrDelta === 0) continue;
          proc.lastReportedStdoutLines = proc.stdoutLineCount;
          proc.lastReportedStderrLines = proc.stderrLineCount;
          progressAttachments.push({
            type: "task_progress",
            taskId: proc.id,
            stdoutLineDelta: stdoutDelta,
            stderrLineDelta: stderrDelta,
            outputFile: proc.outputFile || getTaskOutputFilePath(proc.id)
          });
        }
        return progressAttachments;
      }
    };
  }
});

// src/utils/state/index.ts
import { cwd } from "process";
async function setCwd(cwd2) {
  await BunShell.getInstance().setCwd(cwd2);
}
function setOriginalCwd(cwd2) {
  STATE.originalCwd = cwd2;
}
function getOriginalCwd() {
  return STATE.originalCwd;
}
function getCwd() {
  return BunShell.getInstance().pwd();
}
var STATE;
var init_state = __esm({
  "src/utils/state/index.ts"() {
    init_shell();
    STATE = {
      originalCwd: cwd()
    };
  }
});

export {
  initSentry,
  captureException,
  init_sentry,
  PRODUCT_NAME,
  PROJECT_FILE,
  PRODUCT_COMMAND,
  CONFIG_BASE_DIR,
  GITHUB_ISSUES_REPO_URL,
  ASCII_LOGO,
  init_product,
  getTaskOutputFilePath,
  readTaskOutput,
  init_taskOutputStore,
  renderBackgroundShellStatusAttachment,
  renderBashNotification,
  BunShell,
  init_shell,
  setCwd,
  setOriginalCwd,
  getOriginalCwd,
  getCwd,
  init_state,
  execFileNoThrow,
  init_execFileNoThrow,
  getDanyaBaseDir,
  getGlobalConfigFilePath,
  getMemoryDir,
  getKodeBaseDir,
  DANYA_BASE_DIR,
  KODE_BASE_DIR,
  GLOBAL_CONFIG_FILE,
  MEMORY_DIR,
  env,
  init_env,
  PLAN_SLUG_ADJECTIVES,
  PLAN_SLUG_VERBS,
  PLAN_SLUG_NOUNS,
  init_planSlugWords,
  getPlanConversationKey,
  setActivePlanConversationKey,
  getPlanModeSystemPromptAdditions,
  enterPlanMode,
  enterPlanModeForConversationKey,
  exitPlanModeForConversationKey,
  hydratePlanSlugFromMessages,
  getPlanFilePath,
  isMainPlanFilePathForActiveConversation,
  readPlanFile,
  init_planMode,
  SESSION_ID,
  CACHE_PATHS,
  dateToFilename,
  getMessagesPath,
  logError,
  overwriteLog,
  loadLogList,
  parseLogFilename,
  getNextAvailableLogForkNumber,
  getNextAvailableLogSidechainNumber,
  formatDate,
  logMCPError,
  init_log
};
