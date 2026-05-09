// proof-mcp/state-render.js
// Markdown rendering surface for the proof MCP. Read-only; consumes raw state plus
// the `partitionActiveElements` output from closing-argument.js. No mutations, no I/O.

/** Numbered sub-clauses at or above this count trigger outsized-rule annotation in recap. */
export const OUTSIZED_RULE_THRESHOLD = 3;

/**
 * Counts numbered sub-clauses (lines beginning with `<digit>.<digit>`, e.g. 18.1, 18.2)
 * in a rule statement. The pattern matches per-line so a header line like "18. Big rule"
 * does not count itself.
 */
export function isOutsizedRule(statement, threshold) {
  if (typeof statement !== 'string') return false;
  // /^\s*\d+\.\d/m matches a line starting with optional whitespace, then digits, dot, digit
  // (e.g. "18.1", "  18.2"). The header-only "18." form does not match because no digit
  // follows the dot.
  const matches = statement.match(/^\s*\d+\.\d/gm) ?? [];
  return matches.length >= threshold;
}

/**
 * Returns the first sentence of `text` — text up through (but not including) the first
 * `.`, `!`, or `?` followed by whitespace or end-of-string. Returns the full text when
 * no terminator is present.
 */
export function firstSentence(text) {
  if (typeof text !== 'string') return '';
  const m = text.match(/^(.+?)[.!?](\s|$)/);
  return m ? m[1] : text;
}

export function renderHeading(title) {
  return `## ${title}\n`;
}

export function renderBullet(id, meta, summary) {
  return `- **${id}** _(${meta})_ — ${summary}\n`;
}

export function renderSubBullet(label, value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value) && value.length === 0) return '';
  return `  - **${label}:** ${value}\n`;
}
