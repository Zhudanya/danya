/**
 * System prompt section caching framework ported from Codex (Claude Code).
 *
 * System prompt is split into cacheable (static) and volatile (dynamic) sections.
 * Static sections are computed once and cached until /clear or /compact.
 * Dynamic sections recompute every turn — this breaks prompt cache when values change.
 *
 * Architecture:
 *   STATIC PREFIX (cached globally)     ← Sections 1-11
 *   ──── DYNAMIC BOUNDARY ────
 *   DYNAMIC SUFFIX (per-turn)           ← Sections 12-14 + engine variant
 */

// Simple in-memory cache (replaces Codex's bootstrap/state.js dependency)
const sectionCache = new Map<string, string | null>()

type ComputeFn = () => string | null | Promise<string | null>

export type SystemPromptSection = {
  name: string
  compute: ComputeFn
  cacheBreak: boolean
}

/**
 * Create a memoized system prompt section.
 * Computed once, cached until clearSystemPromptSections() is called.
 */
export function systemPromptSection(
  name: string,
  compute: ComputeFn,
): SystemPromptSection {
  return { name, compute, cacheBreak: false }
}

/**
 * Create a volatile system prompt section that recomputes every turn.
 * This WILL break the prompt cache when the value changes.
 * @param _reason — explanation for why cache-breaking is necessary (documentation only)
 */
export function DANGEROUS_uncachedSystemPromptSection(
  name: string,
  compute: ComputeFn,
  _reason: string,
): SystemPromptSection {
  return { name, compute, cacheBreak: true }
}

/**
 * Resolve all system prompt sections, returning prompt strings.
 * Cached sections return from cache; volatile sections recompute.
 */
export async function resolveSystemPromptSections(
  sections: SystemPromptSection[],
): Promise<(string | null)[]> {
  return Promise.all(
    sections.map(async (s) => {
      if (!s.cacheBreak && sectionCache.has(s.name)) {
        return sectionCache.get(s.name) ?? null
      }
      const value = await s.compute()
      sectionCache.set(s.name, value)
      return value
    }),
  )
}

/**
 * Clear all system prompt section caches.
 * Called on /clear and /compact to force re-evaluation.
 */
export function clearSystemPromptSections(): void {
  sectionCache.clear()
}

/**
 * The dynamic boundary marker.
 * Everything before this in the prompt array is cacheable.
 * Everything after recomputes per turn.
 */
export const SYSTEM_PROMPT_DYNAMIC_BOUNDARY = '__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__'
