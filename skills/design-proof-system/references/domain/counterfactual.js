// counterfactual.js — probe with snapshot/restore. ProbePorts = {query, explain, snapshot, facts}.
// Cascade: 05-domain-spec.md §11.1 (mechanical_collapse_test), §11.2 (query_with / query_without).
// Spec: try/finally snapshot bracketing ensures engine state reverts on throw or return.
// Engine retractFact requires exact constant args (Engine Spec §4.1, FactStore.retractFact).
// Wildcard retract is realized via query-then-retract — named variables in the query
// pattern (Engine wire format: {var:'A'} for variable, bare string for constant, '_'
// for non-binding wildcard) recover concrete args from the binding object.

const WILDCARD = '_';

// Lower a wildcard-allowing pattern array into (probePattern, reconstructFn) so a
// query result row can be turned back into the concrete fact args for retractFact.
function _lowerWildcards(predicate, patternArgs) {
  const probe = patternArgs.map((a, i) => a === WILDCARD ? { var: `__wv${i}` } : a);
  const reconstruct = (binding) =>
    probe.map((t) => (t && typeof t === 'object' && typeof t.var === 'string') ? binding[t.var] : t);
  return { probe: [predicate, probe], reconstruct };
}

/** @param {{propId: string}} args
 *  @param {{query: any, explain: any, snapshot: any, facts: any}} probePorts */
export function collapseTest(args, probePorts) {
  const snap = probePorts.snapshot.snapshot();
  try {
    // §11.1: retract every approved(propId, _, _) fact via query-then-retract.
    const { probe, reconstruct } = _lowerWildcards('approved', [args.propId, WILDCARD, WILDCARD]);
    const matches = probePorts.query.query(probe);
    for (const binding of matches) {
      probePorts.facts.retractFact('approved', reconstruct(binding));
    }
    const stillCloses = probePorts.query.exists(['closure_permitted', []]);
    const reasons = stillCloses
      ? []
      : probePorts.query.query(['closure_failure_reason', [{ var: 'R' }]]).map((b) => b.R);
    return { stillCloses, failureReasons: reasons };
  } finally {
    probePorts.snapshot.restore(snap);
  }
}

/** @param {{retract: Array<[string, any[]]>, pattern: [string, any[]]}} args
 *  Each retract entry is a wildcard-allowing fact pattern; lowered via _lowerWildcards. */
export function queryWithout(args, probePorts) {
  const snap = probePorts.snapshot.snapshot();
  try {
    for (const [pred, patternArgs] of args.retract) {
      const { probe, reconstruct } = _lowerWildcards(pred, patternArgs);
      const matches = probePorts.query.query(probe);
      for (const binding of matches) {
        probePorts.facts.retractFact(pred, reconstruct(binding));
      }
    }
    return probePorts.query.query(args.pattern);
  } finally {
    probePorts.snapshot.restore(snap);
  }
}

/** @param {{assert: Array<[string, any[]]>, pattern: [string, any[]]}} args
 *  Each assert entry is a fully-concrete fact (assertFact rejects non-constants per Engine Spec §4.1). */
export function queryWith(args, probePorts) {
  const snap = probePorts.snapshot.snapshot();
  try {
    for (const [pred, a] of args.assert) probePorts.facts.assertFact(pred, a);
    return probePorts.query.query(args.pattern);
  } finally {
    probePorts.snapshot.restore(snap);
  }
}
