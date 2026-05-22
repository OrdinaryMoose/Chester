// port-adapter.mjs — wraps the real Engine (flat class API per Engine.js §4)
// into the port-bundled shape the Domain bridge expects (engine.facts.assertFact,
// engine.rules.defineRule, engine.query.query, engine.tx.begin, etc.).
//
// This adapter is the missing piece between sprint-01 (Engine, flat API) and
// sprint-02 (Domain bridge, port-bundled). Stress-test finding #1.

export function adaptEngineToPorts(engine) {
  return {
    facts: {
      assertFact: (predicate, args) => engine.assertFact(predicate, args),
      retractFact: (predicate, args) => engine.retractFact(predicate, args),
      factExists: (predicate, args) => engine.factExists(predicate, args),
    },
    rules: {
      defineRule: (ruleId, headAtom, bodyAtoms, metadata) =>
        engine.defineRule(ruleId, headAtom, bodyAtoms, metadata),
      undefineRule: (ruleId) => engine.undefineRule(ruleId),
      getRule: (ruleId) => engine.getRule(ruleId),
    },
    query: {
      query: (pattern) => engine.query(pattern),
      exists: (pattern) => engine.exists(pattern),
      count: (pattern) => engine.count(pattern),
      derive: () => engine.derive(),
    },
    // Domain reads `engine.explain` directly as a callable (substrate-fake convention).
    explain: (fact) => engine.explain(fact),
    tx: {
      begin: () => engine.begin(),
      commit: (handle) => engine.commit(handle),
      rollback: (handle) => engine.rollback(handle),
    },
    snapshot: {
      snapshot: () => engine.snapshot(),
      restore: (token) => engine.restore(token),
    },
  };
}
