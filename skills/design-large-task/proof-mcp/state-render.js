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

/** Build the meta segment for a bullet — includes status and disposition when withdrawn. */
function elementMeta(el) {
  if (el?.status === 'withdrawn') {
    return `withdrawn — ${el.withdrawal_disposition ?? 'unclassified'}`;
  }
  if (el?.ratificationStatus) return el.ratificationStatus;
  if (el?.ratification && typeof el.ratification === 'object') return 'ratified';
  if (el?.status) return el.status;
  return 'active';
}

export function renderNC(el) {
  const meta = elementMeta(el);
  const summary = firstSentence(el.statement ?? '');
  let out = renderBullet(el.id, meta, summary);
  out += renderSubBullet('statement', el.statement);
  out += renderSubBullet('grounding', (el.grounding ?? []).join(', '));
  out += renderSubBullet('reasoning_chain', el.reasoning_chain);
  out += renderSubBullet('collapse_test', el.collapse_test);
  // Explicit join so the sub-bullet renders alternatives separated by "; " rather
  // than relying on Array.toString()'s no-space comma format. Pass null when empty
  // so renderSubBullet's null-guard suppresses the line entirely.
  out += renderSubBullet(
    'rejected_alternatives',
    Array.isArray(el.rejected_alternatives) && el.rejected_alternatives.length > 0
      ? el.rejected_alternatives.join('; ')
      : null
  );
  return out;
}

export function renderRule(el, outsized) {
  const meta = elementMeta(el);
  if (outsized) {
    const count = (el.statement ?? '').match(/^\s*\d+\.\d/gm)?.length ?? 0;
    const summary = `${firstSentence(el.statement ?? '')}. (${count} sub-clauses — request deep render to view in full)`;
    return renderBullet(el.id, meta, summary);
  }
  return renderBullet(el.id, meta, el.statement ?? '');
}

export function renderRC(el) {
  const meta = elementMeta(el);
  const summary = firstSentence(el.statement ?? '');
  let out = renderBullet(el.id, meta, summary);
  out += renderSubBullet('statement', el.statement);
  out += renderSubBullet('problem_anchor', el.problem_anchor);
  const ratif = el.ratification && typeof el.ratification === 'object'
    ? JSON.stringify(el.ratification)
    : el.ratification;
  out += renderSubBullet('ratification', ratif);
  out += renderSubBullet('groundingNCs', (el.grounding ?? []).join(', '));
  return out;
}

export function renderConcern(c) {
  // Use elementMeta so withdrawn concerns reached via renderElementDeep surface
  // their disposition consistently with other element types (AC-3.2). Concerns
  // do not currently carry a withdrawal_disposition field, so elementMeta will
  // fall back to 'unclassified' for withdrawn concerns; that is the canonical
  // unspecified-disposition string per the proof MCP convention.
  const meta = elementMeta(c);
  let out = renderBullet(c.id, meta, c.label ?? '');
  out += renderSubBullet('label', c.label);
  out += renderSubBullet('description', c.description);
  out += renderSubBullet('status', c.status);
  return out;
}

export function renderEvidence(el) {
  const meta = elementMeta(el);
  let out = renderBullet(el.id, meta, firstSentence(el.statement ?? ''));
  out += renderSubBullet('statement', el.statement);
  out += renderSubBullet('source', el.source);
  return out;
}

export function renderPermission(el) {
  const meta = elementMeta(el);
  let out = renderBullet(el.id, meta, firstSentence(el.statement ?? ''));
  out += renderSubBullet('statement', el.statement);
  out += renderSubBullet('relieves', el.relieves);
  return out;
}

export function renderRisk(el) {
  const meta = elementMeta(el);
  let out = renderBullet(el.id, meta, firstSentence(el.statement ?? ''));
  out += renderSubBullet('statement', el.statement);
  out += renderSubBullet('basis', el.basis);
  return out;
}

/**
 * Multi-storage element lookup. Dispatches on the ID's prefix to one of two storages.
 * Returns null for prefixes outside the seven in-scope types. FRIC- (FRICTION) and
 * DEFN- (DEFINITION) are explicitly out of deep-render scope per the design brief and
 * return null here.
 */
export function findElementById(state, id) {
  if (typeof id !== 'string') return null;
  const dash = id.indexOf('-');
  if (dash < 0) return null;
  const prefix = id.slice(0, dash + 1);
  switch (prefix) {
    case 'NCON-':
    case 'RULE-':
    case 'PERM-':
    case 'EVID-':
    case 'RISK-':
    case 'RCON-':
      return state.elements.get(id) ?? null;
    case 'CERN-':
      return (state.concerns ?? []).find(c => c.id === id) ?? null;
    default:
      return null;
  }
}

/**
 * Numeric-suffix comparator. Splits the trailing integer off an ID and compares
 * numerically so NCON-3 sorts before NCON-10. Falls back to lexicographic on prefix.
 */
function compareById(a, b) {
  const splitId = (id) => {
    const m = (id ?? '').match(/^([A-Z]+-)(\d+)$/);
    return m ? [m[1], Number(m[2])] : [id ?? '', 0];
  };
  const [pa, na] = splitId(a.id);
  const [pb, nb] = splitId(b.id);
  if (pa !== pb) return pa < pb ? -1 : 1;
  return na - nb;
}

/**
 * Renders the active proof body as a markdown recap. Eight sections in fixed order:
 * Problem Statement (preamble), Concerns, Rules, Permissions, Evidence,
 * Necessary Conditions, Resolve Conditions, Risks. Reads section contents only from
 * the supplied partition so the partitioner is the single source of truth for
 * active-by-type filtering.
 */
export function renderProofRecap(state, partition) {
  let out = '';
  out += renderHeading('Problem Statement');
  out += `${state.problemStatement ?? ''}\n\n`;

  out += renderHeading('Concerns');
  for (const c of [...partition.activeConcerns].sort(compareById)) {
    out += renderBullet(c.id, c.status ?? 'unknown', c.label ?? '');
  }
  out += '\n';

  out += renderHeading('Rules');
  for (const el of [...partition.activeRules].sort(compareById)) {
    out += renderRule(el, isOutsizedRule(el.statement ?? '', OUTSIZED_RULE_THRESHOLD));
  }
  out += '\n';

  out += renderHeading('Permissions');
  for (const el of [...partition.activePermissions].sort(compareById)) {
    out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
  }
  out += '\n';

  out += renderHeading('Evidence');
  for (const el of [...partition.activeEvidence].sort(compareById)) {
    out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
  }
  out += '\n';

  out += renderHeading('Necessary Conditions');
  for (const el of [...partition.activeNCsAll].sort(compareById)) {
    out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
  }
  out += '\n';

  out += renderHeading('Resolve Conditions');
  for (const el of [...partition.activeRCs].sort(compareById)) {
    out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
  }
  out += '\n';

  out += renderHeading('Risks');
  for (const el of [...partition.activeRisks].sort(compareById)) {
    out += renderBullet(el.id, elementMeta(el), firstSentence(el.statement ?? ''));
  }
  out += '\n';

  return out;
}

/**
 * Renders a single element by ID with full sub-fields. Returns null when the ID is
 * absent in the state's storages. Callers (the server handler) translate null to a
 * structured ELEMENT_NOT_FOUND refusal.
 */
export function renderElementDeep(elementId, state) {
  const found = findElementById(state, elementId);
  if (!found) return null;
  if (elementId.startsWith('CERN-')) return renderConcern(found);
  switch (found.type) {
    case 'NECESSARY_CONDITION': return renderNC(found);
    case 'RULE':                return renderRule(found, false); // deep mode: no truncation
    case 'PERMISSION':          return renderPermission(found);
    case 'EVIDENCE':            return renderEvidence(found);
    case 'RISK':                return renderRisk(found);
    case 'RESOLVE_CONDITION':   return renderRC(found);
    default:                    return null;
  }
}
