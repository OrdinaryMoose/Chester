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
    validateRule(rule);
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
