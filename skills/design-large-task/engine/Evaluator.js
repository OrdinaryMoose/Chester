/**
 * Evaluator — semi-naive bottom-up fixed-point evaluation, organized by stratum.
 * Each derived fact carries provenance: { ruleId, bindings }.
 */

import { unify } from './Unifier.js';
import { factKey } from './utils.js';

function substituteArgs(args, bindings) {
  return args.map(a => {
    if (a && typeof a === 'object' && typeof a.var === 'string') {
      return bindings[a.var];
    }
    return a;
  });
}

function matchBodyAtom(atom, factStore, derived, currentBindings, deltaFilter) {
  // Returns array of bindings that satisfy this body atom given currentBindings.
  // If deltaFilter is a Set<factKey>, only matches whose underlying fact is in the delta count.
  const arity = atom.arity;

  if (atom.negated) {
    // Negation-as-failure with existential quantification of unbound atom variables.
    // Unify the original atom pattern (which may contain still-unbound variables)
    // against each fact and require consistency with currentBindings — any consistent
    // match means the inner atom holds for some binding, so the negation fails.
    const baseFacts = factStore.allFacts(atom.predicate, arity);
    const derivedFacts = [];
    for (const f of derived.values()) {
      if (f.predicate === atom.predicate && f.args.length === arity) derivedFacts.push(f);
    }
    const isConsistent = (factArgs) => {
      const fresh = unify(atom.args, factArgs);
      if (fresh === null) return false;
      for (const [k, v] of Object.entries(fresh)) {
        if (k in currentBindings && currentBindings[k] !== v) return false;
      }
      return true;
    };
    const hasMatch = baseFacts.some((args) => isConsistent(args)) || derivedFacts.some((f) => isConsistent(f.args));
    return hasMatch ? [] : [{ ...currentBindings }];
  }

  const out = [];
  const baseFacts = factStore.allFacts(atom.predicate, arity);
  const derivedFacts = [];
  for (const f of derived.values()) {
    if (f.predicate === atom.predicate && f.args.length === arity) derivedFacts.push(f);
  }
  const candidates = [
    ...baseFacts.map(args => ({ args, fk: factKey(atom.predicate, args) })),
    ...derivedFacts.map(f => ({ args: f.args, fk: factKey(f.predicate, f.args) }))
  ];

  for (const c of candidates) {
    if (deltaFilter && !deltaFilter.has(c.fk)) continue;
    const fresh = unify(atom.args, c.args);
    if (fresh === null) continue;
    const merged = { ...currentBindings };
    let consistent = true;
    for (const [k, v] of Object.entries(fresh)) {
      if (k in merged && merged[k] !== v) { consistent = false; break; }
      merged[k] = v;
    }
    if (consistent) out.push(merged);
  }
  return out;
}

export class Evaluator {
  constructor(factStore, ruleStore) {
    this.factStore = factStore;
    this.ruleStore = ruleStore;
    this.iterationStats = []; // [{ stratum, iteration, deltaSize }] — populated each derive() call
  }

  /**
   * derive() → Map<factKey, { predicate, args, provenance: { ruleId, bindings } }>
   *
   * Semi-naive bottom-up evaluation per Engine Spec §3.1:
   *   - Stratum 0 runs first to fixed point, then stratum 1, etc.
   *   - Iteration 1 of each stratum: full join (no delta restriction).
   *   - Iteration N>1: each rule fires once per body-atom position, with that position restricted to delta facts.
   *   - Terminates when iteration produces an empty delta.
   *
   * The instrumentation hook populates this.iterationStats so tests can verify
   * delta tracking is in effect (AC-3.5 observable boundary).
   */
  derive() {
    this.iterationStats = [];
    const derived = new Map();
    const strata = this.ruleStore.rulesByStratum();
    const stratumIds = Array.from(strata.keys()).sort((a, b) => a - b);

    for (const s of stratumIds) {
      const rules = strata.get(s);
      let delta = null; // null sentinel for "first iteration" — no delta restriction
      let iter = 0;

      while (true) {
        iter++;
        if (iter > 10000) throw { code: 'MEMORY_BUDGET_EXCEEDED', message: 'evaluator did not terminate within budget' };
        const newDelta = new Set();

        const fireRule = (rule, deltaAtomIndex) => {
          let bindingsList = [{}];
          for (let i = 0; i < rule.body.length; i++) {
            const atom = rule.body[i];
            const filter = (deltaAtomIndex === i && !atom.negated) ? delta : null;
            const next = [];
            for (const b of bindingsList) {
              next.push(...matchBodyAtom(atom, this.factStore, derived, b, filter));
            }
            bindingsList = next;
            if (bindingsList.length === 0) break;
          }
          for (const b of bindingsList) {
            const headArgs = substituteArgs(rule.head.args, b);
            if (headArgs.some((a) => a === undefined)) {
              throw { code: 'UNBOUND_HEAD_VARIABLE', ruleId: rule.ruleId, message: `rule ${rule.ruleId} head contains a variable not bound by its body` };
            }
            const fk = factKey(rule.head.predicate, headArgs);
            if (derived.has(fk)) continue;
            derived.set(fk, {
              predicate: rule.head.predicate,
              args: headArgs,
              provenance: { ruleId: rule.ruleId, bindings: b }
            });
            newDelta.add(fk);
          }
        };

        for (const rule of rules) {
          if (delta === null) {
            // Iteration 1: full join (no delta restriction)
            fireRule(rule, -1);
          } else {
            // Iteration N>1: fire once per body atom position, with that atom restricted to delta
            for (let i = 0; i < rule.body.length; i++) {
              if (!rule.body[i].negated) fireRule(rule, i);
            }
          }
        }

        this.iterationStats.push({ stratum: s, iteration: iter, deltaSize: newDelta.size });
        if (newDelta.size === 0) break;
        delta = newDelta;
      }
    }

    return derived;
  }
}
