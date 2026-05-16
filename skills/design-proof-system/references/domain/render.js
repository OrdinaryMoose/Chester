// render.js — read-only render and query functions. Takes ReadPorts only.
// Cascade: 05-domain-spec.md §10. Architecture §10 payoffs ("Independent verification path"
// is realized by renderDatalogProjection).

// Withdrawal filter: returns a Set of element ids that have been marked withdrew(I).
// Current-state render surfaces (renderStructuredProof, getProofState) filter against
// this set so withdrawn elements don't appear as if still load-bearing. The verification-
// path projection (renderDatalogProjection) intentionally does NOT filter — it must be
// faithful to the EDB so a second engine can replay it.
function _withdrewIdSet(readPorts) {
  const rows = readPorts.query.query(['withdrew', [{ var: 'I' }]]);
  return new Set(rows.map(r => r.I));
}

/**
 * @param {object} args
 * @param {{query: any, explain: any}} readPorts
 * @returns {string} markdown
 */
export function renderStructuredProof(args, readPorts) {
  const withdrawn = _withdrewIdSet(readPorts);
  const live = (rows) => rows.filter(b => !withdrawn.has(b.I));
  const sections = [];
  sections.push('# Proof\n');
  const evidences = live(readPorts.query.query(['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]]));
  if (evidences.length) sections.push('## Givens (Evidence)\n' + evidences.map(b => `- ${b.I}: ${b.C}`).join('\n') + '\n');
  const propositions = live(readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]));
  if (propositions.length) sections.push('## Lemmas (Propositions)\n' + propositions.map(b => `- ${b.I}: ${b.S}`).join('\n') + '\n');
  const resolutions = live(readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]]));
  if (resolutions.length) sections.push('## Theorems (Resolutions)\n' + resolutions.map(b => `- ${b.I}: ${b.S}`).join('\n') + '\n');
  return sections.join('\n');
}

// Per-predicate fact arities for renderElementDeep. The Engine matches by arity exactly
// (Unifier returns null when pattern.length !== fact.length), so each predicate must be
// queried at its declared arity rather than with a fixed-width wildcard fill.
const _ARITIES = Object.freeze({
  evidence: 3,
  rule_decl: 2,
  permission_decl: 2,
  proposition_decl: 3,
  risk: 2,
  resolution_decl: 2,
  friction: 4,
  definition_decl: 3,
});

export function renderElementDeep(args, readPorts) {
  if (!args || !args.id) return null;
  const { id } = args;
  // Annotate (rather than filter) for the programmatic API: the caller needs to
  // distinguish "no such element" (return null) from "element exists but withdrawn"
  // (return record with withdrawn:true). Filtering would conflate the two.
  const withdrawn = _withdrewIdSet(readPorts).has(id);
  for (const [pred, arity] of Object.entries(_ARITIES)) {
    if (arity < 1) continue;
    const pattern = [id, ...Array(arity - 1).fill('_')];
    const rows = readPorts.query.query([pred, pattern]);
    if (rows.length) return { id, predicate: pred, withdrawn, ...rows[0] };
  }
  return null;
}

export function renderClosingArgument(args, readPorts) {
  const permitted = readPorts.query.exists(['closure_permitted', []]);
  return { permitted, asOf: Date.now() };
}

export function renderDatalogProjection(args, readPorts) {
  // Serializable Datalog projection: every base/derived fact + every rule.
  // Per Architecture §10 "Independent verification path" — output suitable for
  // ingestion by a second engine.
  //
  // The Engine matches by exact arity (Unifier returns null when pattern.length !==
  // fact.length), so each predicate is queried at its declared arity with positional
  // named variables — variables bind to concrete values, which are then re-collected
  // in positional order to reconstruct the fact tuple.
  // PROJECTION_ARITIES must cover every EDB predicate declared by translation.js's
  // EDB_PREDICATES set — otherwise a second engine ingesting the projection misses
  // facts the first engine had. The set below mirrors EDB_PREDICATES at the time of
  // writing; add to both when a new EDB predicate is introduced.
  //
  // Note on `concern_status`: this predicate is mixed-source — the CONCERN translator
  // writes (id, 'draft') as an EDB fact, while the CONCERN per-element rule template
  // derives (id, 'ratified'). Projecting it includes both rows; on replay the second
  // engine sees the derived row as if it were EDB. This is an idempotency edge —
  // re-derivation produces the same fact, so replay is functionally correct, but the
  // projection is not strictly EDB-only. Pure EDB-vs-derived separation would require
  // an engine-side discriminator the current API doesn't expose.
  const PROJECTION_ARITIES = {
    evidence: 3, rule_decl: 2, permission_decl: 2, proposition_decl: 3,
    grounding: 2, collapse_test: 2, risk: 2, resolution_decl: 2, addresses: 2,
    friction: 4, friction_disposition: 2, definition_decl: 3,
    concern: 3, concern_status: 2,
    approved: 3, two_yes: 2,
    closure_committed: 0, closure_pending: 0, round: 1,
    created_at: 2, withdrew: 1, superseded: 2,
  };
  const facts = [];
  for (const [pred, arity] of Object.entries(PROJECTION_ARITIES)) {
    const varNames = Array.from({ length: arity }, (_, i) => `V${i}`);
    const pattern = [pred, varNames.map((n) => ({ var: n }))];
    for (const row of readPorts.query.query(pattern)) {
      // Preserve positional order — Object.values on the binding object is not
      // guaranteed to match insertion order across engines, so reconstruct from varNames.
      facts.push([pred, varNames.map((n) => row[n])]);
    }
  }
  // Rules are projected in tuple-format (the same shape defineRule consumes), so a
  // second engine ingesting this projection can replay the proof faithfully. Each
  // rule is {ruleId, headAtom, bodyAtoms, metadata}. If readPorts is constructed
  // without getAllRules (e.g. by a legacy caller), fall back to an empty array
  // rather than throwing.
  const rules = typeof readPorts.getAllRules === 'function' ? readPorts.getAllRules() : [];
  return { facts, rules };
}

export function renderLaneSlice(args, readPorts) {
  return { lane: args.lane ?? 'all', elements: [] };
}

export function getProofState(args, readPorts) {
  // Current-state inventory: filter withdrawn elements so consumers see only the
  // load-bearing live state. Callers needing the historical EDB use renderDatalogProjection.
  const withdrawn = _withdrewIdSet(readPorts);
  const live = (rows) => rows.filter(b => !withdrawn.has(b.I));
  return {
    evidence: live(readPorts.query.query(['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]])),
    propositions: live(readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]])),
    resolutions: live(readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]])),
    closurePermitted: readPorts.query.exists(['closure_permitted', []]),
  };
}

export function queryProof(args, readPorts) {
  if (!args || !args.pattern) return [];
  return readPorts.query.query(args.pattern);
}
