// engine-port-adapter.js — shape normalizer at the Engine↔Domain boundary.
//
// The Domain bridge expects the engine argument to expose port-bundled sub-objects
// (engine.facts.assertFact, engine.rules.defineRule, engine.query.query, engine.tx.begin,
// engine.snapshot.snapshot, engine.explain as a flat callable). The sprint-02 substrate
// fake at __tests__/_fixtures/inMemorySubstrate.js exposes this shape directly.
//
// The real sprint-01 Engine (Engine.js) exposes the same six substrate-port contracts
// but as flat methods on the class instance (engine.assertFact(...), engine.defineRule(...),
// engine.query(pat), engine.begin(), etc.) per Engine Spec §4. This normalizer accepts
// either shape and produces the port-bundled form the bridge consumes.
//
// Surfaced by the 2026-05-14 calculator-proof stress test (finding #1 in
// docs/chester/working/stress-tests/calculator-proof/simulation-report.md).

const PORT_BUNDLED_MARKER = 'facts';
const FLAT_MARKER = 'assertFact';

export function normalizeEngine(engine) {
  if (!engine || typeof engine !== 'object') {
    throw new Error('normalizeEngine: engine argument must be an object');
  }
  // Port-bundled shape — pass through unchanged. Detection: engine.facts is itself
  // an object exposing assertFact. The substrate fake and any future port-bundled
  // engine implementation match here.
  if (engine[PORT_BUNDLED_MARKER] && typeof engine[PORT_BUNDLED_MARKER].assertFact === 'function') {
    return engine;
  }
  // Flat-API shape — wrap. Detection: engine.assertFact is a method directly on the
  // engine object. The sprint-01 Engine class matches here.
  if (typeof engine[FLAT_MARKER] === 'function') {
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
        allRules: () => engine.allRules(),
      },
      query: {
        query: (pattern) => engine.query(pattern),
        exists: (pattern) => engine.exists(pattern),
        count: (pattern) => engine.count(pattern),
        derive: () => engine.derive(),
      },
      explain: (fact) => engine.explain(fact),
      tx: {
        begin: () => engine.begin(),
        commit: (handle) => engine.commit(handle),
        rollback: (handle) => engine.rollback(handle),
        hasOpenTransaction: () => engine.hasOpenTransaction(),
      },
      snapshot: {
        snapshot: () => engine.snapshot(),
        restore: (token) => engine.restore(token),
      },
    };
  }
  throw new Error(
    'normalizeEngine: engine is neither port-bundled (expected engine.facts.assertFact) ' +
    'nor a flat-API Engine (expected engine.assertFact); cannot wire to bridge'
  );
}
