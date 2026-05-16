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

// Refuse to enter a snapshot/restore bracket while an external transaction is open.
// Engine.restore() at Engine.js:94-96 explicitly invalidates any open tx when fired,
// which would silently strand the caller's handle. Throwing at entry surfaces the
// conflict at the call site instead of as a delayed STALE_HANDLE on next commit/rollback.
// Mirrors the pattern in Engine.loadFrom / Engine.clear (NESTED_TRANSACTION_OP_REFUSED).
function _assertNoOpenTransaction(probePorts, op) {
  if (typeof probePorts.hasOpenTransaction === 'function' && probePorts.hasOpenTransaction()) {
    throw Object.assign(new Error(
      `COUNTERFACTUAL_REFUSED_DURING_TX: ${op} cannot run while an external transaction is open ` +
      `(see bridge.runCounterfactual JSDoc — the snapshot/restore bracket would invalidate the tx handle)`
    ), { code: 'COUNTERFACTUAL_REFUSED_DURING_TX', op });
  }
}

/** @param {{propId: string}} args
 *  @param {{query: any, explain: any, snapshot: any, facts: any, hasOpenTransaction?: () => boolean}} probePorts */
export function collapseTest(args, probePorts) {
  _assertNoOpenTransaction(probePorts, 'collapseTest');
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
  _assertNoOpenTransaction(probePorts, 'queryWithout');
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
  _assertNoOpenTransaction(probePorts, 'queryWith');
  const snap = probePorts.snapshot.snapshot();
  try {
    for (const [pred, a] of args.assert) probePorts.facts.assertFact(pred, a);
    return probePorts.query.query(args.pattern);
  } finally {
    probePorts.snapshot.restore(snap);
  }
}
