/**
 * Evaluator — semi-naive bottom-up fixed-point evaluation, organized by stratum.
 * Each derived fact carries provenance: { ruleId, bindings }.
 */

import { unify } from './Unifier.js';
import { factKey } from './utils.js';

/**
 * candidatesFor — unified candidate-source helper for body-atom matching.
 *
 * Returns Array<{ args, fk }> of candidate facts (from both base and derived sides)
 * narrowed by:
 *   - bound-position intersection (positions where the atom has a constant in the
 *     pattern OR a variable already bound in currentBindings)
 *   - delta filter (when non-null, restricts to delta entries pre-filtered to this
 *     atom's predicate/arity by the caller)
 *
 * The helper does NOT call unify; consumers iterate the returned array and call
 * unify(atom.args, args) themselves to extract bindings.
 *
 * Repeated variables in the atom: only the first occurrence drives bucket lookup;
 * subsequent occurrences are deferred to the unification step.
 *
 * Negation handling: matchBodyAtom passes deltaFilter = null for negated atoms.
 *
 * Parameters:
 *   atom: { predicate, arity, args, negated }
 *   currentBindings: Object<varName, value>
 *   factStore: FactStore
 *   idbIndex: DerivedPositionalIndex
 *   deltaFilter: Map<factKey, args>  // pre-filtered to atom's predicate/arity; or null
 *   derivedMap: Map<factKey, { predicate, args, provenance }>  // the engine's `derived` IDB
 *
 * See spec §Data Flow for the four-case decision table.
 */
export function candidatesFor(atom, currentBindings, factStore, idbIndex, deltaFilter, derivedMap) {
  const { predicate, arity, args } = atom;

  // Step 1: identify bound positions (first occurrence per variable; repeated vars deferred).
  const seenVars = new Set();
  const boundPositions = []; // Array<{ position, value }>
  for (let i = 0; i < arity; i++) {
    const a = args[i];
    if (a && typeof a === 'object' && typeof a.var === 'string') {
      if (seenVars.has(a.var)) continue; // repeated var — defer to unify
      seenVars.add(a.var);
      if (a.var in currentBindings) {
        boundPositions.push({ position: i, value: currentBindings[a.var] });
      }
    } else {
      boundPositions.push({ position: i, value: a }); // constant in pattern
    }
  }

  // Step 2: no bound positions.
  if (boundPositions.length === 0) {
    if (deltaFilter !== null) {
      // Delta-driver case: caller pre-filtered delta to atom's predicate/arity.
      const out = [];
      for (const [fk, fArgs] of deltaFilter) out.push({ args: fArgs, fk });
      return out;
    }
    // No delta, no bound positions: full base ∪ derived for this predicate.
    const out = [];
    for (const bArgs of factStore.allFacts(predicate, arity)) {
      out.push({ args: bArgs, fk: factKey(predicate, bArgs) });
    }
    for (const fact of derivedMap.values()) {
      if (fact.predicate === predicate && fact.args.length === arity) {
        out.push({ args: fact.args, fk: factKey(predicate, fact.args) });
      }
    }
    return out;
  }

  // Step 3: bound positions exist. Compute per-position fact-key unions (base ∪ derived).
  const baseArgsByKey = new Map();
  const perPositionUnions = boundPositions.map(({ position, value }) => {
    const baseFacts = factStore.factsMatching(predicate, arity, position, value);
    for (const bArgs of baseFacts) baseArgsByKey.set(factKey(predicate, bArgs), bArgs);
    const baseKeys = new Set(baseFacts.map(bArgs => factKey(predicate, bArgs)));
    const derivedKeys = idbIndex.bucketFor(predicate, arity, position, value);
    const union = new Set(baseKeys);
    for (const k of derivedKeys) union.add(k);
    return union;
  });

  // Step 4: smallest-set-driver — pick smallest union as iteration driver.
  let driverIdx = 0;
  for (let i = 1; i < perPositionUnions.length; i++) {
    if (perPositionUnions[i].size < perPositionUnions[driverIdx].size) driverIdx = i;
  }
  const driverKeys = new Set(perPositionUnions[driverIdx]);

  // Step 5: intersect driver with other positions' unions.
  for (let i = 0; i < perPositionUnions.length; i++) {
    if (i === driverIdx) continue;
    for (const k of [...driverKeys]) {
      if (!perPositionUnions[i].has(k)) driverKeys.delete(k);
    }
  }

  // Step 6: intersect with delta when present.
  if (deltaFilter !== null) {
    for (const k of [...driverKeys]) {
      if (!deltaFilter.has(k)) driverKeys.delete(k);
    }
  }

  // Step 7: materialize args for each surviving key.
  const out = [];
  for (const k of driverKeys) {
    const fArgs = baseArgsByKey.get(k) || (derivedMap.get(k) && derivedMap.get(k).args);
    if (fArgs) out.push({ args: fArgs, fk: k });
  }
  return out;
}

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
    // ADR-0017: unbound atom vars are existentially quantified
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
