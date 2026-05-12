/**
 * Serializer — JSON-marshals EDB and rule store; IDB is excluded (recomputed on load).
 * Validates structure of incoming serialized input.
 *
 * Uses the `_snapshot()` helpers on FactStore and RuleStore as the single source of
 * truth for extracting internal state — does NOT reach past those helpers into
 * `_facts._facts` or `_rules._rules` directly. This consolidates the persistence
 * path: if the internal storage format changes, only the `_snapshot()` helpers move.
 */

export function serializeEngine(engine) {
  const factsSnap = engine._facts._snapshot();
  const factsOut = [];
  for (const [pk, entries] of factsSnap.facts) {
    // pk format is "<predicate>/<arity>" — predicate may itself contain '/'.
    // Use lastIndexOf to split at the final separator only.
    const lastSlash = pk.lastIndexOf('/');
    const predicate = pk.slice(0, lastSlash);
    for (const [, args] of entries) {
      factsOut.push({ predicate, args });
    }
  }
  const rulesSnap = engine._rules._snapshot();
  const rulesOut = rulesSnap.rules.map(([, rule]) => rule);
  return { version: 1, facts: factsOut, rules: rulesOut };
}

function isValidSerialized(s) {
  return s && typeof s === 'object'
    && typeof s.version === 'number'
    && Array.isArray(s.facts)
    && Array.isArray(s.rules)
    && s.facts.every(f => f && typeof f.predicate === 'string' && Array.isArray(f.args))
    && s.rules.every(r => r && typeof r.ruleId === 'string' && r.head && Array.isArray(r.body));
}

export function loadEngineFrom(engine, serialized) {
  if (!isValidSerialized(serialized)) {
    throw { code: 'MALFORMED_SERIALIZED_INPUT', message: 'serialized form failed schema validation' };
  }
  // Atomic-load contract (spec AC-7.3): if any replay step throws (TYPE_ERROR on
  // an invalid fact arg, MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION /
  // UNBOUND_HEAD_VARIABLE on a rule), the engine must be restored to its prior
  // state. Take a snapshot before clear, restore on any replay exception.
  const rollback = engine.snapshot();
  try {
    engine.clear();
    for (const f of serialized.facts) engine.assertFact(f.predicate, f.args);
    for (const r of serialized.rules) engine.defineRule(r);
  } catch (err) {
    engine.restore(rollback);
    throw err;
  }
}
