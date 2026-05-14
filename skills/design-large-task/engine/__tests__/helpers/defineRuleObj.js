/**
 * Test-only migration helper. Wraps the new 4-arg Engine.defineRule with a 1-arg
 * facade that accepts internal-object-shape rule literals (as tests had them
 * during pass-3) and translates them down to the new tuple form before calling.
 *
 * TEMPORARY: deleted in the cleanup commit (Task 6) once all 10 well-formed
 * test files have migrated to direct tuple-form calls.
 *
 * Failure-mode tests (failures.test.js) MUST NOT use this helper — see AC-8.0.
 * The inverse translation crashes on intentionally-malformed input before
 * reaching the public API; failure tests reach the public API directly.
 */

function atomToTuple(atom) {
  if (!atom || typeof atom !== 'object') return atom; // pass-through; will fail Engine validation
  const args = (atom.args ?? []).map((a) => {
    if (a && typeof a === 'object' && typeof a.var === 'string') return a.var;
    return a;
  });
  return [atom.predicate, args];
}

function bodyAtomToTuple(b) {
  const t = atomToTuple(b);
  return b && b.negated ? ['not', t] : t;
}

export function defineRuleObj(target, ruleObj) {
  const head = atomToTuple(ruleObj.head);
  const body = (ruleObj.body ?? []).map(bodyAtomToTuple);
  return target.defineRule(ruleObj.ruleId, head, body, ruleObj.metadata ?? {});
}

export function explainTuple(engine, predicate, args) {
  return engine.explain([predicate, args]);
}
