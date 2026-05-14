/**
 * Serializer — JSON-marshals EDB and rule store; IDB is excluded (recomputed on load).
 * Validates structure of incoming serialized input.
 *
 * Uses the `_snapshot()` helpers on FactStore and RuleStore as the single source of
 * truth for extracting internal state — does NOT reach past those helpers into
 * `_facts._facts` or `_rules._rules` directly. This consolidates the persistence
 * path: if the internal storage format changes, only the `_snapshot()` helpers move.
 */

import { internalRuleToTuple } from './RuleAtomTranslator.js';

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
  // Schema version 2: rules are emitted in tuple form (matches Engine.defineRule public surface)
  return { version: 2, facts: factsOut, rules: rulesOut.map(internalRuleToTuple) };
}

function isValidSerialized(s) {
  return s && typeof s === 'object'
    && typeof s.version === 'number'
    && Array.isArray(s.facts)
    && Array.isArray(s.rules)
    && s.facts.every(f => f && typeof f.predicate === 'string' && Array.isArray(f.args))
    && s.rules.every(r => r && typeof r.ruleId === 'string' && Array.isArray(r.headAtom) && Array.isArray(r.bodyAtoms));
}

export function loadEngineFrom(engine, serialized) {
  // Version check runs before shape validation so any non-v2 blob (including
  // real v1 data with old head/body field names) gets a structured
  // `actualVersion` payload per AC-5.3, not a generic shape-failure error.
  if (serialized && typeof serialized === 'object' && serialized.version !== 2) {
    throw {
      code: 'MALFORMED_SERIALIZED_INPUT',
      message: `unsupported schema version: ${serialized.version}; expected 2`,
      actualVersion: serialized.version,
    };
  }
  if (!isValidSerialized(serialized)) {
    throw { code: 'MALFORMED_SERIALIZED_INPUT', message: 'serialized form failed schema validation' };
  }
  // Atomic-load contract (spec AC-7.3): if any replay step throws (TYPE_ERROR on
  // an invalid fact arg, MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION /
  // UNSAFE_RULE on a rule), the engine must be restored to its prior
  // state. Take a snapshot before clear, restore on any replay exception.
  // ADR-0018: mid-replay failure leaves partial-load state
  const rollback = engine.snapshot();
  try {
    engine.clear();
    for (const f of serialized.facts) engine.assertFact(f.predicate, f.args);
    for (const r of serialized.rules) engine.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata ?? {});
  } catch (err) {
    engine.restore(rollback);
    throw err;
  }
}
