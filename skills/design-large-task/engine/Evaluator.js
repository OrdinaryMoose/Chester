/**
 * Evaluator — semi-naive bottom-up fixed-point evaluation, organized by stratum.
 * Each derived fact carries provenance: { ruleId, bindings }.
 */

import { unify } from './Unifier.js';
import { factKey } from './utils.js';
import { DerivedPositionalIndex } from './DerivedPositionalIndex.js';

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

  // Step 3: bound positions exist. Compute per-position fact-key candidate sets,
  // keeping base and derived buckets SEPARATE (no copy of either bucket — derived's
  // bucket is the live Set inside DerivedPositionalIndex; we treat it read-only).
  const baseArgsByKey = new Map();
  const positions = boundPositions.map(({ position, value }) => {
    const baseFacts = factStore.factsMatching(predicate, arity, position, value);
    for (const bArgs of baseFacts) baseArgsByKey.set(factKey(predicate, bArgs), bArgs);
    const baseKeys = new Set(baseFacts.map(bArgs => factKey(predicate, bArgs)));
    const derivedKeys = idbIndex.bucketFor(predicate, arity, position, value);
    return { baseKeys, derivedKeys, totalSize: baseKeys.size + derivedKeys.size };
  });

  // Step 4: pick the smallest driver across position unions AND deltaFilter.
  // The delta-set is often dramatically smaller than any position bucket on later
  // semi-naive iterations (it's the new facts derived in the previous pass), so
  // including it in the smallest-set selection is the key asymptotic optimization
  // for recursive transitive-closure workloads (avoids O(N) bucket-copy per call).
  let driverPosIdx = 0;
  for (let i = 1; i < positions.length; i++) {
    if (positions[i].totalSize < positions[driverPosIdx].totalSize) driverPosIdx = i;
  }
  const driverPos = positions[driverPosIdx];
  const deltaSize = deltaFilter !== null ? deltaFilter.size : Infinity;
  const driveDelta = deltaSize < driverPos.totalSize;

  // Step 5: iterate the chosen driver and check membership in the other filters.
  // No Set is copied; intersection is done by per-key membership tests.
  const inPosition = (pos, fk) => pos.baseKeys.has(fk) || pos.derivedKeys.has(fk);

  const out = [];
  if (driveDelta) {
    // Drive off delta (smaller). For each delta entry, check membership in all positions.
    for (const [fk, fArgs] of deltaFilter) {
      let ok = true;
      for (const pos of positions) {
        if (!inPosition(pos, fk)) { ok = false; break; }
      }
      if (ok) out.push({ args: fArgs, fk });
    }
  } else {
    // Drive off the smallest position bucket. Check other positions and delta.
    const visit = (fk) => {
      for (let i = 0; i < positions.length; i++) {
        if (i === driverPosIdx) continue;
        if (!inPosition(positions[i], fk)) return;
      }
      if (deltaFilter !== null && !deltaFilter.has(fk)) return;
      const derivedEntry = derivedMap.get(fk);
      const fArgs = baseArgsByKey.get(fk) || (derivedEntry && derivedEntry.args);
      if (fArgs) out.push({ args: fArgs, fk });
    };
    for (const fk of driverPos.baseKeys) visit(fk);
    for (const fk of driverPos.derivedKeys) visit(fk);
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

function matchBodyAtom(atom, factStore, idbIndex, derivedMap, currentBindings, deltaMap, onCandidates) {
  // deltaMap is precomputed by fireRule (Map<factKey, args> pre-filtered to this atom's
  // predicate/arity) or null. Lifting the wrap out of this per-binding function changes
  // the wrap cost from O(N × deltaSize) to O(deltaSize) per fireRule iteration — the
  // asymptotic difference between cubic and quadratic on recursive transitive closure.
  const candidates = candidatesFor(atom, currentBindings, factStore, idbIndex, deltaMap, derivedMap);

  if (onCandidates) onCandidates(candidates.length);

  if (atom.negated) {
    // ADR-0017: unbound atom vars are existentially quantified.
    // candidatesFor returned the bound-position-narrowed candidate set (caller passed deltaMap = null
    // for negation; see fireRule). isConsistent verifies consistency with currentBindings.
    const isConsistent = (factArgs) => {
      const fresh = unify(atom.args, factArgs);
      if (fresh === null) return false;
      for (const [k, v] of Object.entries(fresh)) {
        if (k in currentBindings && currentBindings[k] !== v) return false;
      }
      return true;
    };
    const hasMatch = candidates.some(c => isConsistent(c.args));
    return hasMatch ? [] : [{ ...currentBindings }];
  }

  const out = [];
  for (const c of candidates) {
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
    this._candidateCountObserver = null;
  }

  setCandidateCountObserver(fn) {
    this._candidateCountObserver = fn;
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
    const idbIndex = new DerivedPositionalIndex();
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

          // Build processing order: the delta-restricted atom first (when there is one),
          // then the remaining atoms in their declared order. This is delta-driven join —
          // for recursive joins where the delta atom is not body[0], iterating delta and
          // binding the earlier atoms via positional lookup drops the asymptotic cost
          // from O(N^3) to O(N^2). For iteration 1 (deltaAtomIndex === -1) and for the
          // case where deltaAtomIndex === 0, the order is the natural declared order.
          const order = [];
          if (deltaAtomIndex >= 0) order.push(deltaAtomIndex);
          for (let j = 0; j < rule.body.length; j++) {
            if (j !== deltaAtomIndex) order.push(j);
          }

          for (const i of order) {
            const atom = rule.body[i];
            const filter = (deltaAtomIndex === i && !atom.negated) ? delta : null;

            // Wrap delta (Set<factKey>) into Map<factKey, args> ONCE per atom,
            // pre-filtered to atom's predicate/arity. Lifted out of matchBodyAtom
            // so the wrap cost is O(deltaSize) per atom, not per binding.
            let deltaMap = null;
            if (filter !== null) {
              deltaMap = new Map();
              for (const fk of filter) {
                const fact = derived.get(fk);
                if (fact && fact.predicate === atom.predicate && fact.args.length === atom.arity) {
                  deltaMap.set(fk, fact.args);
                }
              }
            }

            const onCandidates = this._candidateCountObserver
              ? (count) => this._candidateCountObserver(rule.ruleId, i, count)
              : null;
            const next = [];
            for (const b of bindingsList) {
              next.push(...matchBodyAtom(atom, this.factStore, idbIndex, derived, b, deltaMap, onCandidates));
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
            idbIndex.addFact(rule.head.predicate, headArgs);
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
