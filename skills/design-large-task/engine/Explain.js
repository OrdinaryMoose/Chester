/**
 * Explain — walks Evaluator provenance to build a derivation tree.
 * First-supporting-path semantics: provenance records only the first rule
 * firing that derived a fact (which is set during Evaluator.derive()).
 */

import { factKey } from './utils.js';

function substituteArgs(args, bindings) {
  return args.map(a => {
    if (a && typeof a === 'object' && typeof a.var === 'string') return bindings[a.var];
    return a;
  });
}

export function explainFact(predicate, args, derived, ruleStore, factStore) {
  const fk = factKey(predicate, args);
  const f = derived.get(fk);
  if (!f) return null;
  const rule = ruleStore.getRule(f.provenance.ruleId);
  const children = rule.body.map(atom => {
    if (atom.negated) {
      return { fact: { predicate: atom.predicate, args: substituteArgs(atom.args, f.provenance.bindings) }, source: 'negated', children: [] };
    }
    const bodyArgs = substituteArgs(atom.args, f.provenance.bindings);
    if (factStore.factExists(atom.predicate, bodyArgs)) {
      return { fact: { predicate: atom.predicate, args: bodyArgs }, source: 'edb', children: [] };
    }
    return explainFact(atom.predicate, bodyArgs, derived, ruleStore, factStore) ||
      { fact: { predicate: atom.predicate, args: bodyArgs }, source: 'unknown', children: [] };
  });
  return { fact: { predicate, args }, ruleId: f.provenance.ruleId, bindings: f.provenance.bindings, children };
}
