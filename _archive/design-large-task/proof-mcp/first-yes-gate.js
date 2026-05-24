/**
 * first-yes-gate.js — Pure-function module checking the per-element first-yes
 * precondition. present_closing_argument refuses if any active element is in
 * working state across the four affected lanes:
 *   - NCs with ratificationStatus === 'draft'
 *   - RCs with ratification === null
 *   - Concerns with status === 'draft'
 *   - Definitions with status === 'draft'
 *
 * No I/O.
 */

export function checkFirstYesGate(state) {
  const unratifiedIds = [];
  if (state.elements) {
    for (const [id, el] of state.elements) {
      if (el.status !== 'active') continue;
      if (el.type === 'NECESSARY_CONDITION' && el.ratificationStatus === 'draft') {
        unratifiedIds.push(id);
      } else if (el.type === 'RESOLVE_CONDITION' && (el.ratification ?? null) === null) {
        unratifiedIds.push(id);
      }
    }
  }
  for (const c of state.concerns || []) {
    if (c.status === 'draft') unratifiedIds.push(c.id);
  }
  for (const d of state.definitions || []) {
    if (d.status === 'draft') unratifiedIds.push(d.id);
  }
  return { passed: unratifiedIds.length === 0, unratifiedIds };
}
