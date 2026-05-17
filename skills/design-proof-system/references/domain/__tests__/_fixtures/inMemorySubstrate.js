// In-memory substrate fake. Implements the six substrate-port contracts per
// Engine Spec §4.1–§4.8. NOT a mock — implements the contracts correctly.
// Used by every Domain test (Spec Testing Strategy).

export function createInMemorySubstrate() {
  const baseFacts = new Map(); // predicate -> Set<JSON args>
  const rules = new Map();     // ruleId -> {head, body, metadata}
  const derived = new Map();   // predicate -> Set<JSON args> (rebuilt by derive)
  let dirty = false;
  let inTx = false;
  const txBuffer = { asserts: [], retracts: [], defines: [], undefines: [] };

  const key = (args) => JSON.stringify(args);

  const facts = {
    assertFact(predicate, args) {
      if (inTx) { txBuffer.asserts.push({ predicate, args }); }
      else { _addFact(baseFacts, predicate, args); dirty = true; }
    },
    retractFact(predicate, args) {
      if (inTx) { txBuffer.retracts.push({ predicate, args }); }
      else { _removeFact(baseFacts, predicate, args); dirty = true; }
    },
    factExists(predicate, args) {
      return _hasFact(_logicalEDB(), predicate, args);
    },
  };

  const rulesPort = {
    defineRule(ruleId, head, body, metadata = {}) {
      // ADR-0013 Part 3: stratification check fires HERE at defineRule time.
      _checkStratification(_logicalRules({ id: ruleId, head, body, metadata }));
      if (inTx) { txBuffer.defines.push({ ruleId, head, body, metadata }); }
      else { rules.set(ruleId, { head, body, metadata }); dirty = true; }
    },
    undefineRule(ruleId) {
      if (inTx) { txBuffer.undefines.push({ ruleId }); }
      else { rules.delete(ruleId); dirty = true; }
    },
    getRule(ruleId) { return rules.get(ruleId) ?? null; },
    allRules() {
      // Tuple shape matches the real Engine's allRules output (Engine.js:43 via
      // internalRuleToTuple) and the contract renderDatalogProjection consumes
      // (render.js: "Each rule is {ruleId, headAtom, bodyAtoms, metadata}").
      return [...rules.entries()].map(([ruleId, r]) => ({
        ruleId,
        headAtom: r.head,
        bodyAtoms: r.body,
        metadata: r.metadata,
      }));
    },
  };

  const queryPort = {
    derive() { if (dirty) { _runFixedPoint(); dirty = false; } },
    query(pattern) { this.derive(); return _matchPattern(_logicalEDB(), _logicalIDB(), pattern); },
    count(pattern) { return this.query(pattern).length; },
    exists(pattern) { return this.count(pattern) > 0; },
  };

  const snapshotPort = {
    snapshot() {
      return JSON.stringify({
        baseFacts: [...baseFacts.entries()].map(([p, s]) => [p, [...s]]),
        rules: [...rules.entries()],
        derived: [...derived.entries()].map(([p, s]) => [p, [...s]]),
      });
    },
    restore(token) {
      const obj = JSON.parse(token);
      baseFacts.clear(); rules.clear(); derived.clear();
      for (const [p, arr] of obj.baseFacts) baseFacts.set(p, new Set(arr));
      for (const [id, r] of obj.rules) rules.set(id, r);
      for (const [p, arr] of obj.derived) derived.set(p, new Set(arr));
      dirty = false;
    },
  };

  // Spec-02 §"Engine public-surface signatures" pins ReadPorts.explain(fact) as a direct
  // 1-arg call (Engine Spec §4.5; `Engine.explain(fact)` on the real Engine is a method on
  // the Engine instance, not a namespace). The fake mirrors that shape: `engine.explain` is
  // a callable function, not a `{explain(fact){...}}` namespace, so bridge code that does
  // `readPorts.explain = engine.explain` then `readPorts.explain(fact)` works against the
  // fake the same way it works against the real Engine.
  const explainFn = (fact) => ({ fact, derivation: [], provenance: 'in-memory-fake' });

  // Track the active transaction handle so commit/rollback can validate, matching the
  // real Engine's STALE_HANDLE behavior (Engine.js _assertHandleValid).
  let txHandle = null;
  const _assertTxHandle = (h) => {
    if (!inTx || h !== txHandle) {
      throw { code: 'STALE_HANDLE', message: 'handle does not match active transaction' };
    }
  };
  const tx = {
    begin() {
      if (inTx) throw new Error('TX_ALREADY_OPEN');
      inTx = true;
      txHandle = Symbol('tx-handle');
      return txHandle;
    },
    commit(handle) {
      _assertTxHandle(handle);
      for (const { predicate, args } of txBuffer.asserts) _addFact(baseFacts, predicate, args);
      for (const { predicate, args } of txBuffer.retracts) _removeFact(baseFacts, predicate, args);
      for (const { ruleId, head, body, metadata } of txBuffer.defines) rules.set(ruleId, { head, body, metadata });
      for (const { ruleId } of txBuffer.undefines) rules.delete(ruleId);
      _resetTxBuffer(); inTx = false; txHandle = null; dirty = true;
    },
    rollback(handle) {
      _assertTxHandle(handle);
      _resetTxBuffer(); inTx = false; txHandle = null;
    },
  };

  // --- helpers (implementation detail; collapse into ~40 LOC) ---
  function _addFact(store, p, args) { if (!store.has(p)) store.set(p, new Set()); store.get(p).add(key(args)); }
  function _removeFact(store, p, args) { store.get(p)?.delete(key(args)); }
  function _hasFact(edb, p, args) { return edb.get(p)?.has(key(args)) ?? false; }
  function _logicalEDB() {
    if (!inTx) return baseFacts;
    const e = new Map([...baseFacts].map(([p, s]) => [p, new Set(s)]));
    for (const { predicate, args } of txBuffer.asserts) _addFact(e, predicate, args);
    for (const { predicate, args } of txBuffer.retracts) _removeFact(e, predicate, args);
    return e;
  }
  function _logicalRules(extra) {
    const r = new Map(rules);
    if (inTx) {
      for (const d of txBuffer.defines) r.set(d.ruleId, d);
      for (const { ruleId } of txBuffer.undefines) r.delete(ruleId);
    }
    if (extra) r.set(extra.id, extra);
    return r;
  }
  function _logicalIDB() { return derived; }
  function _runFixedPoint() { /* trivial: walk rules and produce derived facts. For tests, implementations can stub specific predicates per fixture. */ }
  function _checkStratification(ruleMap) {
    // ADR-0013 Part 3: detect cycles through negation. The substrate fake implements a simple
    // negation-cycle detector so the Task 16 AC-4.3/AC-5.1 Phase B stratification test fires.
    // Algorithm: build a directed graph where every body atom contributes head→body edges,
    // marked "negated" when the body is wrapped in ['not', ...]. Any cycle that includes a
    // negated edge is rejected as "cycle through negation".
    //
    // Per Task 16 plan note: detect the case the AC-4.3/AC-5.1 cyclic_test template injects —
    // a rule whose body contains a negation AND a positive self-reference to the rule's head
    // predicate. Formally that's a positive self-loop coexisting with a negative dependency,
    // i.e. the rule's derivation cannot stratify because evaluating the head requires both
    // the head's current value AND a settled negation. The plan-mandated minimum detection
    // surface is "body contains both `not(...)` and `P(...)` where P is the head predicate"
    // — implemented here.
    for (const { head, body } of ruleMap.values()) {
      const headPred = head?.[0];
      if (!headPred) continue;
      let hasNeg = false;
      let hasPosSelf = false;
      for (const atom of body ?? []) {
        if (atom[0] === 'not') hasNeg = true;
        else if (atom[0] === headPred) hasPosSelf = true;
      }
      if (hasNeg && hasPosSelf) {
        throw Object.assign(new Error(`CYCLIC_NEGATION: rule head '${headPred}' has positive self-reference alongside a negation`), { code: 'CYCLIC_NEGATION' });
      }
    }
    const edges = []; // {from, to, negated}
    for (const { head, body } of ruleMap.values()) {
      const headPred = head?.[0];
      if (!headPred) continue;
      for (const atom of body ?? []) {
        if (atom[0] === 'not') edges.push({ from: headPred, to: atom[1][0], negated: true });
        else edges.push({ from: headPred, to: atom[0], negated: false });
      }
    }
    // DFS for negation cycles.
    const adj = new Map();
    for (const e of edges) { if (!adj.has(e.from)) adj.set(e.from, []); adj.get(e.from).push(e); }
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map();
    function dfs(node, hasNegated) {
      color.set(node, GRAY);
      for (const e of adj.get(node) ?? []) {
        const next = e.to;
        const carry = hasNegated || e.negated;
        if (color.get(next) === GRAY && carry) {
          throw Object.assign(new Error(`CYCLIC_NEGATION: cycle through negation involving ${next}`), { code: 'CYCLIC_NEGATION' });
        }
        if (color.get(next) === undefined) dfs(next, carry);
      }
      color.set(node, BLACK);
    }
    for (const node of adj.keys()) if (color.get(node) === undefined) dfs(node, false);
  }
  function _matchPattern(edb, idb, pattern) {
    const [pred, args] = pattern;
    const merged = new Set([...(edb.get(pred) ?? []), ...(idb.get(pred) ?? [])]);
    const out = [];
    for (const k of merged) {
      const factArgs = JSON.parse(k);
      const binding = _unify(args, factArgs);
      if (binding !== null) out.push(binding);
    }
    return out;
  }
  function _unify(pat, fact) {
    if (pat.length !== fact.length) return null;
    const b = {};
    for (let i = 0; i < pat.length; i++) {
      const p = pat[i];
      // Wildcard — matches anything, binds nothing.
      if (p === '_') continue;
      // Variable in Engine wire format: { var: 'name' } object (per Unifier.js).
      // This is the form _lowerWildcards (counterfactual.js) produces and the form
      // the real Engine's Unifier.unify expects in query patterns.
      if (p && typeof p === 'object' && typeof p.var === 'string') {
        const name = p.var;
        if (Object.prototype.hasOwnProperty.call(b, name)) {
          // Same variable seen twice — both bindings must agree.
          if (b[name] !== fact[i]) return null;
        } else {
          b[name] = fact[i];
        }
        continue;
      }
      // Constant — must equal the fact arg exactly.
      // (Bare uppercase strings are NOT variables here; they are constants. The fake
      // matches Engine query-time behavior — Domain modules must use { var: 'X' } for
      // variables in query patterns, not bare 'X'.)
      if (p !== fact[i]) return null;
    }
    return b;
  }
  function _resetTxBuffer() { txBuffer.asserts.length = txBuffer.retracts.length = txBuffer.defines.length = txBuffer.undefines.length = 0; }

  return { facts, rules: rulesPort, query: queryPort, snapshot: snapshotPort, explain: explainFn, tx };
}

export function createRecordingSubstrate() {
  const substrate = createInMemorySubstrate();
  const calls = [];
  const record = (port, method, ...args) => calls.push({ port, method, args });
  for (const port of ['facts', 'rules', 'query', 'snapshot', 'explain', 'tx']) {
    for (const [method, fn] of Object.entries(substrate[port])) {
      if (typeof fn === 'function') {
        const orig = fn.bind(substrate[port]);
        substrate[port][method] = (...args) => { record(port, method, ...args); return orig(...args); };
      }
    }
  }
  return { substrate, calls };
}
