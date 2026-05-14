/**
 * Engine — facade aggregating FactStore, RuleStore, and Evaluator.
 * Exposes the §4 public API. Manages the "isDerived" flag and auto-derive.
 */

import { FactStore } from './FactStore.js';
import { RuleStore } from './RuleStore.js';
import { Evaluator } from './Evaluator.js';
import { unify } from './Unifier.js';
import { factKey } from './utils.js';
import { explainFact } from './Explain.js';
import { captureSnapshot, restoreSnapshot } from './Snapshot.js';
import { serializeEngine, loadEngineFrom } from './Serializer.js';
import { tupleRuleToInternal } from './RuleAtomTranslator.js';

export class Engine {
  constructor() {
    this._facts = new FactStore();
    this._rules = new RuleStore();
    this._derived = new Map();
    this._isDerived = false;
    this._tx = null;
  }

  _markDirty() { this._isDerived = false; }

  // §4.1 fact ops
  assertFact(predicate, args) { this._facts.assertFact(predicate, args); this._markDirty(); }
  retractFact(predicate, args) { this._facts.retractFact(predicate, args); this._markDirty(); }
  factExists(predicate, args) { return this._facts.factExists(predicate, args); }

  // §4.2 rule ops — public surface accepts tuple-format atoms (04-engine-spec.md §4.2 + §6.2)
  defineRule(ruleId, headAtom, bodyAtoms, metadata) {
    const internalRule = tupleRuleToInternal(ruleId, headAtom, bodyAtoms, metadata);
    this._rules.defineRule(internalRule);
    this._markDirty();
  }
  undefineRule(ruleId) { this._rules.undefineRule(ruleId); this._markDirty(); }
  getRule(ruleId) { return this._rules.getRule(ruleId); }

  // §4.3 evaluation
  derive() {
    const ev = new Evaluator(this._facts, this._rules);
    this._derived = ev.derive();
    this._isDerived = true;
    return this._derived;
  }
  isDerived() { return this._isDerived; }

  // §4.5 explain — public surface accepts [predicate, args] tuple (04-engine-spec.md §4.5)
  explain(fact) {
    this._ensureDerived();
    if (!Array.isArray(fact) || fact.length !== 2) return null;
    const [predicate, args] = fact;
    return explainFact(predicate, args, this._derived, this._rules, this._facts);
  }

  // §4.4 query
  _ensureDerived() { if (!this._isDerived) this.derive(); }

  _matchAllAgainstPattern(pattern) {
    // pattern is [predicate, [...args]]
    const [pred, patArgs] = pattern;
    const arity = patArgs.length;
    const out = [];
    const seen = new Set();
    // Dedup across EDB+IDB: a fact may be both asserted and derivable; AC-10.1 set semantics requires it appears once.
    const consume = (fArgs) => {
      const k = JSON.stringify(fArgs);
      if (seen.has(k)) return;
      const b = unify(patArgs, fArgs);
      if (b !== null) { seen.add(k); out.push(b); }
    };
    // Match base facts
    for (const fArgs of this._facts.allFacts(pred, arity)) consume(fArgs);
    // Match derived facts
    for (const f of this._derived.values()) {
      if (f.predicate !== pred || f.args.length !== arity) continue;
      consume(f.args);
    }
    return out;
  }

  query(pattern) { this._ensureDerived(); return this._matchAllAgainstPattern(pattern); }
  count(pattern) { return this.query(pattern).length; }
  exists(pattern) { return this.count(pattern) > 0; }

  snapshot() { return captureSnapshot(this); }
  restore(token) {
    if (this._tx) {
      // Invalidate handle by clearing _tx. The caller's handle becomes stale.
      this._tx = null;
    }
    restoreSnapshot(this, token);
  }
  serialize() { return serializeEngine(this); }
  loadFrom(serialized) {
    if (this._tx) throw { code: 'NESTED_TRANSACTION_OP_REFUSED', op: 'loadFrom', message: 'cannot loadFrom during open transaction' };
    loadEngineFrom(this, serialized);
  }
  clear() {
    if (this._tx) throw { code: 'NESTED_TRANSACTION_OP_REFUSED', op: 'clear', message: 'cannot clear during open transaction' };
    this._facts = new FactStore();
    this._rules = new RuleStore();
    this._derived = new Map();
    this._isDerived = false;
  }

  // §4.8 transactions (snapshot-rollback strategy; mutations apply live, snapshot
  // taken at begin() is restored on rollback or discarded on commit).
  _assertNoTx() { if (this._tx) throw { code: 'NESTED_TRANSACTION', message: 'transaction already open' }; }
  _assertHandleValid(h) {
    if (!this._tx || this._tx.handle !== h) {
      throw { code: 'STALE_HANDLE', message: 'handle does not match active transaction' };
    }
  }

  begin() {
    this._assertNoTx();
    const h = Symbol('tx');
    this._tx = { handle: h, preSnapshot: this.snapshot() };
    return h;
  }

  commit(handle) {
    this._assertHandleValid(handle);
    this._tx = null;
    return true;
  }

  rollback(handle) {
    this._assertHandleValid(handle);
    const snap = this._tx.preSnapshot;
    this._tx = null;
    this.restore(snap);
    return true;
  }
}
