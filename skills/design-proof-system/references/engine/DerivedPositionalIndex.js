/**
 * DerivedPositionalIndex — per-position lookup tables for the derived (IDB) facts
 * inside a single Evaluator.derive() call. Mirrors the data-structure shape of
 * FactStore._positionalIndex but is grow-only (no retract) and derive-local.
 * See ADR-0019.
 *
 * Public surface (AC-5.1): constructor, addFact, bucketFor. Nothing else.
 */

import { factKey } from './utils.js';

const predKey = (predicate, arity) => `${predicate}/${arity}`;

export class DerivedPositionalIndex {
  constructor() {
    // Map<"predicate/arity", Array<Map<value, Set<factKey>>>>
    this._positions = new Map();
  }

  addFact(predicate, args) {
    const arity = args.length;
    const pk = predKey(predicate, arity);
    let positions = this._positions.get(pk);
    if (!positions) {
      positions = Array.from({ length: arity }, () => new Map());
      this._positions.set(pk, positions);
    }
    const fk = factKey(predicate, args);
    for (let i = 0; i < arity; i++) {
      let bucket = positions[i].get(args[i]);
      if (!bucket) { bucket = new Set(); positions[i].set(args[i], bucket); }
      bucket.add(fk);
    }
  }

  bucketFor(predicate, arity, position, value) {
    const positions = this._positions.get(predKey(predicate, arity));
    if (!positions || position < 0 || position >= positions.length) return new Set();
    const bucket = positions[position].get(value);
    return bucket || new Set();
  }
}
