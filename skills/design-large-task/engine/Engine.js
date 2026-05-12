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

export class Engine {
  constructor() {
    this._facts = new FactStore();
    this._rules = new RuleStore();
    this._derived = new Map();
    this._isDerived = false;
  }

  _markDirty() { this._isDerived = false; }

  // §4.1 fact ops
  assertFact(predicate, args) { this._facts.assertFact(predicate, args); this._markDirty(); }
  retractFact(predicate, args) { this._facts.retractFact(predicate, args); this._markDirty(); }
  factExists(predicate, args) { return this._facts.factExists(predicate, args); }

  // §4.2 rule ops
  defineRule(rule) { this._rules.defineRule(rule); this._markDirty(); }
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

  explain(predicate, args) {
    this._ensureDerived();
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
}
