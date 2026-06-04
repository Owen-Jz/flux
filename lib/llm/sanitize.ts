// Shared sanitizers for untrusted input that flows into LLM planning prompts.

const MAX_LINK_LENGTH = 512;
const MAX_LINKS = 5;

/**
 * Allowlist-sanitize context links before they flow into an LLM prompt.
 * Keeps only http(s) URLs within a length bound, capped in count.
 *
 * These links are never fetched server-side (no SSRF surface), but bounding
 * them keeps prompt size predictable and stops junk reaching the model. This
 * is the single source of truth — every planner/route that accepts
 * contextLinks must use it so the rules can't drift.
 */
export function sanitizeContextLinks(
  links: unknown,
  opts: { maxLen?: number; max?: number } = {}
): string[] {
  const maxLen = opts.maxLen ?? MAX_LINK_LENGTH;
  const max = opts.max ?? MAX_LINKS;
  if (!Array.isArray(links)) return [];
  return links
    .filter((l): l is string => typeof l === 'string' && /^https?:\/\//i.test(l) && l.length <= maxLen)
    .slice(0, max);
}
