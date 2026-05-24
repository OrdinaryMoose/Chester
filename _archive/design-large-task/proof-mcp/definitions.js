/**
 * definitions.js — Vocabulary definitions module for the design proof MCP server.
 *
 * Implements NC-7 (Definitions are first-class proof entities) and RULE-5
 * (Definitions carry status: draft → ratified, revisions append history).
 *
 * Pure-functions module: shape construction, input validation, and overlap query.
 * State integration (counters, log, dispatch) lives in state.js#manageDefinitions.
 *
 * Definition shape:
 *   {
 *     id: 'DEFN-N',
 *     canonical_name: string,
 *     aliases: string[],
 *     definition: string,
 *     sense_constraints: string|null,
 *     status: 'draft' | 'ratified' | 'withdrawn' | 'deprecated',
 *     source: 'agent-derivation' | 'designer' | ...,
 *     addedInRound: number,
 *     revisedInRound: number|null,
 *     revision: number,
 *     history: Array<{ round, definition, sense_constraints }>,
 *   }
 */

/**
 * Validate a Definition input payload.
 * @param {object} input
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateDefinitionInput(input) {
  if (!input || typeof input !== 'object') return { valid: false, reason: 'input required' };
  if (!input.canonical_name || typeof input.canonical_name !== 'string') return { valid: false, reason: 'canonical_name required string' };
  if (!input.definition || typeof input.definition !== 'string') return { valid: false, reason: 'definition required string' };
  return { valid: true };
}

/**
 * Build a Definition object from validated input.
 * @param {object} input - { canonical_name, aliases?, definition, sense_constraints? }
 * @param {string} id - DEFN-N
 * @param {number} round
 * @param {string} source - defaults to 'agent-derivation'
 * @returns {object}
 */
export function createDefinition(input, id, round, source = 'agent-derivation') {
  return {
    id,
    canonical_name: input.canonical_name,
    aliases: input.aliases ?? [],
    definition: input.definition,
    sense_constraints: input.sense_constraints ?? null,
    status: 'draft',
    source,
    addedInRound: round,
    revisedInRound: null,
    revision: 0,
    history: [],
  };
}

/**
 * Find definitions whose canonical_name or aliases share token-overlap with the
 * supplied canonical_name. Tokenizes by non-word characters, lowercase. Skips
 * definitions in withdrawn or deprecated status.
 * @param {Array<object>} definitions
 * @param {string} canonical_name
 * @returns {Array<object>} candidates
 */
export function queryOverlapCandidates(definitions, canonical_name) {
  const tokens = (canonical_name ?? '').toLowerCase().split(/\W+/).filter(Boolean);
  const matches = [];
  for (const d of definitions) {
    if (d.status === 'withdrawn' || d.status === 'deprecated') continue;
    const hay = (d.canonical_name + ' ' + (d.aliases ?? []).join(' ')).toLowerCase();
    if (tokens.some(t => hay.includes(t))) matches.push(d);
  }
  return matches;
}
