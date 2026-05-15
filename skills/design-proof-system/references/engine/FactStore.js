/**
 * FactStore — EDB (extensional database) with positional indexes.
 * Stores base facts as predicate/arity-keyed Maps; set semantics; per-position indexes.
 */

// ADR-0015: NaN/Infinity collide via JSON.stringify
const isConstant = (v) =>
  typeof v === 'string' ||
  (typeof v === 'number' && Number.isFinite(v)) ||
  typeof v === 'boolean' ||
  v === null;

const factKey = (args) => JSON.stringify(args);
const predKey = (predicate, arity) => `${predicate}/${arity}`;

export class FactStore {
  constructor() {
    // Map<"predicate/arity", Map<factKey, args>>
    this._facts = new Map();
    // Map<"predicate/arity", Array<Map<value, Set<factKey>>>>
    this._positionalIndex = new Map();
  }

  _validateArgs(args) {
    for (const a of args) {
      if (!isConstant(a)) {
        throw { code: 'TYPE_ERROR', message: `non-constant argument: ${String(a)}` };
      }
    }
  }

  assertFact(predicate, args) {
    this._validateArgs(args);
    const arity = args.length;
    const pk = predKey(predicate, arity);
    let rel = this._facts.get(pk);
    if (!rel) {
      rel = new Map();
      this._facts.set(pk, rel);
      this._positionalIndex.set(pk, Array.from({ length: arity }, () => new Map()));
    }
    const fk = factKey(args);
    if (rel.has(fk)) return false;
    rel.set(fk, args);
    const indexes = this._positionalIndex.get(pk);
    for (let i = 0; i < arity; i++) {
      let bucket = indexes[i].get(args[i]);
      if (!bucket) { bucket = new Set(); indexes[i].set(args[i], bucket); }
      bucket.add(fk);
    }
    return true;
  }

  retractFact(predicate, args) {
    const arity = args.length;
    const pk = predKey(predicate, arity);
    const rel = this._facts.get(pk);
    if (!rel) return false;
    const fk = factKey(args);
    if (!rel.has(fk)) return false;
    rel.delete(fk);
    const indexes = this._positionalIndex.get(pk);
    for (let i = 0; i < arity; i++) {
      const bucket = indexes[i].get(args[i]);
      if (bucket) {
        bucket.delete(fk);
        if (bucket.size === 0) indexes[i].delete(args[i]);
      }
    }
    return true;
  }

  factExists(predicate, args) {
    const arity = args.length;
    const pk = predKey(predicate, arity);
    const rel = this._facts.get(pk);
    return !!(rel && rel.has(factKey(args)));
  }

  allFacts(predicate, arity) {
    const pk = predKey(predicate, arity);
    const rel = this._facts.get(pk);
    if (!rel) return [];
    return Array.from(rel.values());
  }

  /**
   * factsMatching(predicate, arity, position, value)
   * Returns facts where args[position] === value, via positional index.
   * Used by Evaluator for fast join.
   */
  factsMatching(predicate, arity, position, value) {
    const pk = predKey(predicate, arity);
    const indexes = this._positionalIndex.get(pk);
    if (!indexes || !indexes[position]) return [];
    const bucket = indexes[position].get(value);
    if (!bucket) return [];
    const rel = this._facts.get(pk);
    return Array.from(bucket, (fk) => rel.get(fk));
  }

  _snapshot() {
    // Return plain JSON-serializable form. structuredClone handles Maps/Sets too.
    return {
      facts: Array.from(this._facts.entries()).map(([k, m]) => [k, Array.from(m.entries())])
    };
  }

  _restore(token) {
    this._facts = new Map();
    this._positionalIndex = new Map();
    for (const [pk, entries] of token.facts) {
      const rel = new Map(entries);
      this._facts.set(pk, rel);
      const arity = entries.length > 0 ? entries[0][1].length : 0;
      const indexes = Array.from({ length: arity }, () => new Map());
      for (const [fk, args] of entries) {
        for (let i = 0; i < args.length; i++) {
          let bucket = indexes[i].get(args[i]);
          if (!bucket) { bucket = new Set(); indexes[i].set(args[i], bucket); }
          bucket.add(fk);
        }
      }
      this._positionalIndex.set(pk, indexes);
    }
  }
}
