/**
 * Snapshot — full-copy snapshot/restore via structuredClone.
 * Captures EDB, rule store, IDB, and isDerived flag.
 */

export function captureSnapshot(engine) {
  return structuredClone({
    facts: engine._facts._snapshot(),
    rules: engine._rules._snapshot(),
    derived: Array.from(engine._derived.entries()),
    isDerived: engine._isDerived
  });
}

export function restoreSnapshot(engine, token) {
  engine._facts._restore(token.facts);
  engine._rules._restore(token.rules);
  engine._derived = new Map(token.derived);
  engine._isDerived = token.isDerived;
}
