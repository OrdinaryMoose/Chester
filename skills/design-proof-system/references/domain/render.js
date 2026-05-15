// render.js — read-only render and query functions. Takes ReadPorts only.
// Cascade: 05-domain-spec.md §10. Architecture §10 payoffs ("Independent verification path"
// is realized by renderDatalogProjection).

/**
 * @param {object} args
 * @param {{query: any, explain: any}} readPorts
 * @returns {string} markdown
 */
export function renderStructuredProof(args, readPorts) {
  const sections = [];
  sections.push('# Proof\n');
  const evidences = readPorts.query.query(['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]]);
  if (evidences.length) sections.push('## Givens (Evidence)\n' + evidences.map(b => `- ${b.I}: ${b.C}`).join('\n') + '\n');
  const propositions = readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]);
  if (propositions.length) sections.push('## Lemmas (Propositions)\n' + propositions.map(b => `- ${b.I}: ${b.S}`).join('\n') + '\n');
  const resolutions = readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]]);
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
  for (const [pred, arity] of Object.entries(_ARITIES)) {
    if (arity < 1) continue;
    const pattern = [id, ...Array(arity - 1).fill('_')];
    const rows = readPorts.query.query([pred, pattern]);
    if (rows.length) return { id, predicate: pred, ...rows[0] };
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
  const PROJECTION_ARITIES = {
    evidence: 3, rule_decl: 2, permission_decl: 2, proposition_decl: 3,
    resolution_decl: 2, definition_decl: 3, risk: 2, friction: 4,
    friction_disposition: 2, approved: 3,
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
  const rules = []; // rules surface through ports.explain or a getRule iteration; for now, projection of facts is the load-bearing half.
  return { facts, rules };
}

export function renderLaneSlice(args, readPorts) {
  return { lane: args.lane ?? 'all', elements: [] };
}

export function getProofState(args, readPorts) {
  return {
    evidence: readPorts.query.query(['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]]),
    propositions: readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]),
    resolutions: readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]]),
    closurePermitted: readPorts.query.exists(['closure_permitted', []]),
  };
}

export function queryProof(args, readPorts) {
  if (!args || !args.pattern) return [];
  return readPorts.query.query(args.pattern);
}
