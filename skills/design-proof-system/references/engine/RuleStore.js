/**
 * RuleStore — Horn-clause rule registry with stratification check at defineRule.
 */

import { stratify } from './Stratifier.js';

function validateRule(rule) {
  if (!rule || typeof rule.ruleId !== 'string') {
    throw { code: 'MALFORMED_RULE', message: 'rule missing ruleId' };
  }
  if (!rule.head || typeof rule.head !== 'object' || typeof rule.head.predicate !== 'string') {
    throw { code: 'MALFORMED_RULE', message: 'rule head must be a positive atom object' };
  }
  if (!Array.isArray(rule.body)) {
    throw { code: 'MALFORMED_RULE', message: 'rule body must be an array' };
  }
  for (const b of rule.body) {
    if (!b || typeof b !== 'object' || typeof b.predicate !== 'string') {
      throw { code: 'MALFORMED_RULE', message: 'body atom must be an object with predicate string' };
    }
  }
}

function checkSafety(rule) {
  // Datalog safety: every variable in the head must appear in at least one non-negated body atom.
  // Variables that only appear in negated atoms are NOT considered bound — they would be
  // existentially quantified in the negation branch, leaving the head variable unbound at fire time.
  const bound = new Set();
  for (const atom of rule.body) {
    if (atom.negated) continue;
    const args = Array.isArray(atom.args) ? atom.args : [];
    for (const a of args) {
      if (a && typeof a === 'object' && typeof a.var === 'string') {
        bound.add(a.var);
      }
    }
  }
  const unboundVars = [];
  const headArgs = Array.isArray(rule.head.args) ? rule.head.args : [];
  for (const a of headArgs) {
    if (a && typeof a === 'object' && typeof a.var === 'string') {
      if (!bound.has(a.var)) unboundVars.push(a.var);
    }
  }
  if (unboundVars.length > 0) {
    throw { code: 'UNSAFE_RULE', ruleId: rule.ruleId, unboundVars, message: `rule ${rule.ruleId} has head variables not bound by any non-negated body atom: ${unboundVars.join(', ')}` };
  }
}

export class RuleStore {
  constructor() {
    // Map<ruleId, rule>
    this._rules = new Map();
    // Map<"predicate/arity", Set<ruleId>>
    this._byHead = new Map();
    // Map<ruleId, stratum>
    this._strata = new Map();
  }

  defineRule(rule) {
    // ADR-0016: unsafe head var produces poisoned IDB
    validateRule(rule);
    checkSafety(rule);
    if (this._rules.has(rule.ruleId)) {
      throw { code: 'DUPLICATE_RULE_ID', ruleId: rule.ruleId };
    }
    // Stratification check: include the new rule, recompute strata, fail if cycle through negation.
    const candidate = [...this._rules.values(), rule];
    const strata = stratify(candidate); // throws CYCLIC_NEGATION if invalid
    this._rules.set(rule.ruleId, rule);
    this._strata = strata;
    const hk = `${rule.head.predicate}/${rule.head.arity}`;
    if (!this._byHead.has(hk)) this._byHead.set(hk, new Set());
    this._byHead.get(hk).add(rule.ruleId);
  }

  undefineRule(ruleId) {
    const r = this._rules.get(ruleId);
    if (!r) return false;
    this._rules.delete(ruleId);
    const hk = `${r.head.predicate}/${r.head.arity}`;
    const bucket = this._byHead.get(hk);
    if (bucket) {
      bucket.delete(ruleId);
      if (bucket.size === 0) this._byHead.delete(hk);
    }
    this._strata = stratify([...this._rules.values()]);
    return true;
  }

  getRule(ruleId) {
    return this._rules.get(ruleId);
  }

  allRules() {
    return Array.from(this._rules.values());
  }

  stratumOf(ruleId) {
    return this._strata.get(ruleId);
  }

  rulesByStratum() {
    const out = new Map();
    for (const [ruleId, s] of this._strata.entries()) {
      if (!out.has(s)) out.set(s, []);
      out.get(s).push(this._rules.get(ruleId));
    }
    return out;
  }

  _snapshot() {
    return { rules: Array.from(this._rules.entries()) };
  }

  _restore(token) {
    this._rules = new Map(token.rules);
    this._byHead = new Map();
    for (const [ruleId, rule] of this._rules.entries()) {
      const hk = `${rule.head.predicate}/${rule.head.arity}`;
      if (!this._byHead.has(hk)) this._byHead.set(hk, new Set());
      this._byHead.get(hk).add(ruleId);
    }
    this._strata = stratify(Array.from(this._rules.values()));
  }
}
