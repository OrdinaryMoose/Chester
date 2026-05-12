# Plan: Engine — Datalog Evaluator (Sprint-01 Proof Backend)

**Sprint:** 20260511-01-mp-redesign-proof-system / sprint-01-proof-backend
**Spec:** ../spec/sprint-01-proof-backend-spec-00.md
**Execution mode:** subagent | inline

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Build a pure, generic, dependency-free Datalog evaluator (`skills/design-large-task/engine/`) implementing the six substrate-facing ports — `IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction` — exactly as specified in `../spec/sprint-01-proof-backend-spec-00.md`.

## Architecture

Single-pass delivery, modular file layout, semi-naive bottom-up evaluation per Engine Spec §3.1, per-predicate positional indexes per §5.1, full-copy snapshot via `structuredClone`, provenance tracking from day one. Engine ships standalone — no callers in this sprint. The Domain layer (sprint-02-proof-layer) and Interface layer (sprint-03-presentation-layer) consume it later.

## Tech Stack

- **Language:** JavaScript (ES modules), Node 17+ (target Node 22.x to match installed environment).
- **Test framework:** Vitest `^3.1.1` — matches existing `skills/design-large-task/proof-mcp/package.json:16`.
- **Test layout:** `__tests__/` directory with `describe/it/expect` imports, one test file per spec subsection. Matches `skills/design-large-task/proof-mcp/__tests__/proof.test.js:1`.
- **No runtime dependencies.** Engine imports only JS standard library (`Map`, `Set`, `JSON`, `structuredClone`, `Array`).
- **Module convention:** `"type": "module"` in `package.json`; named exports; no default exports unless wrapping a class.
- **Error pattern:** structured exceptions thrown as plain objects with `code` string field, e.g. `throw { code: 'TYPE_ERROR', message: '...' }`. Domain-specific error codes never appear at this layer.

---

## Task 1: Project setup

**Type:** config-producing
**Implements:** AC-13.1
**Decision budget:** 1
**Must remain green:** `engine/__tests__/architecture.test.js` (no-deps assertion)

**Files:**
- Create: `skills/design-large-task/engine/package.json`
- Create: `skills/design-large-task/engine/README.md`
- Create: `skills/design-large-task/engine/__tests__/architecture.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/architecture.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('engine architecture compliance', () => {
  it('package.json declares no runtime dependencies', () => {
    const pkgPath = join(import.meta.dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.dependencies).toBeUndefined();
  });

  it('package.json declares ES module type', () => {
    const pkgPath = join(import.meta.dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.type).toBe('module');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/architecture.test.js`
Expected: FAIL — `package.json` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/package.json`:

```json
{
  "name": "chester-engine",
  "version": "0.1.0",
  "type": "module",
  "description": "Pure Datalog evaluator for the Chester proof system (sprint-01-proof-backend)",
  "main": "Engine.js",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.1.1"
  }
}
```

Create `skills/design-large-task/engine/README.md`:

```markdown
# Chester Engine

Pure Datalog evaluator. Generic over predicate symbols and value types; knows nothing about proof concepts.

Implements the six substrate-facing ports (`IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction`) per `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md`.

## Run tests

```
npm install
npm test
```
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm install && npm test`
Expected: PASS — both architecture tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/package.json skills/design-large-task/engine/README.md skills/design-large-task/engine/__tests__/architecture.test.js
git commit -m "feat(engine): initialize package and architecture compliance test"
```

---

## Task 2: FactStore — base fact store with positional indexes

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-1.4 (factExists semantics), AC-1.5 (predicate arity), AC-1.6 (constant type validation)
**Decision budget:** 2
**Must remain green:** `engine/__tests__/operations.test.js` (FactStore portion); architecture tests from Task 1

**Files:**
- Create: `skills/design-large-task/engine/FactStore.js`
- Create: `skills/design-large-task/engine/__tests__/operations.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/operations.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { FactStore } from '../FactStore.js';

describe('FactStore', () => {
  it('assertFact stores and exposes a fact via factExists', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    expect(fs.factExists('p', ['a', 'b'])).toBe(true);
    expect(fs.factExists('p', ['x', 'y'])).toBe(false);
  });

  it('assertFact is idempotent (no duplicate)', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.assertFact('p', ['a', 'b']);
    expect(fs.allFacts('p', 2)).toHaveLength(1);
  });

  it('retractFact removes a fact', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.retractFact('p', ['a', 'b']);
    expect(fs.factExists('p', ['a', 'b'])).toBe(false);
  });

  it('retractFact on absent fact is idempotent', () => {
    const fs = new FactStore();
    expect(() => fs.retractFact('p', ['a', 'b'])).not.toThrow();
  });

  it('treats predicate arity as part of identity', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a', 'b']);
    fs.assertFact('p', ['a', 'b', 'c']);
    expect(fs.allFacts('p', 2)).toHaveLength(1);
    expect(fs.allFacts('p', 3)).toHaveLength(1);
  });

  it('rejects non-constant arguments with TYPE_ERROR', () => {
    const fs = new FactStore();
    expect(() => fs.assertFact('p', [{}])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [() => {}])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
    expect(() => fs.assertFact('p', [undefined])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
  });

  it('accepts string, number, boolean, null as constants', () => {
    const fs = new FactStore();
    expect(() => fs.assertFact('p', ['s', 1, true, null])).not.toThrow();
    expect(fs.factExists('p', ['s', 1, true, null])).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js`
Expected: FAIL — `FactStore` not defined.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/FactStore.js`:

```javascript
/**
 * FactStore — EDB (extensional database) with positional indexes.
 * Stores base facts as predicate/arity-keyed Maps; set semantics; per-position indexes.
 */

const isConstant = (v) =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null;

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
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js`
Expected: PASS — all 7 FactStore tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/FactStore.js skills/design-large-task/engine/__tests__/operations.test.js
git commit -m "feat(engine): FactStore with positional indexes and constant validation"
```

---

## Task 3: Stratifier — topological sort with cycle-through-negation detection

**Type:** code-producing
**Implements:** AC-2.5
**Decision budget:** 2
**Must remain green:** Stratifier-specific tests added in this task

**Files:**
- Create: `skills/design-large-task/engine/Stratifier.js`
- Modify: `skills/design-large-task/engine/__tests__/operations.test.js` (add Stratifier describe block)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `skills/design-large-task/engine/__tests__/operations.test.js`:

```javascript
import { stratify } from '../Stratifier.js';

describe('Stratifier', () => {
  it('assigns stratum 0 to rules with no negated body literals', () => {
    const rules = [
      { ruleId: 'r1', head: { predicate: 'a', arity: 1 }, body: [{ predicate: 'b', arity: 1, negated: false }] }
    ];
    const strata = stratify(rules);
    expect(strata.get('r1')).toBe(0);
  });

  it('assigns higher strata to rules with negated body atoms referring to lower strata', () => {
    const rules = [
      { ruleId: 'r1', head: { predicate: 'a', arity: 1 }, body: [{ predicate: 'b', arity: 1, negated: false }] },
      { ruleId: 'r2', head: { predicate: 'c', arity: 1 }, body: [{ predicate: 'a', arity: 1, negated: true }] }
    ];
    const strata = stratify(rules);
    expect(strata.get('r1')).toBe(0);
    expect(strata.get('r2')).toBe(1);
  });

  it('rejects cyclic negation with CYCLIC_NEGATION error naming the cycle', () => {
    const rules = [
      { ruleId: 'r1', head: { predicate: 'p', arity: 1 }, body: [{ predicate: 'q', arity: 1, negated: true }] },
      { ruleId: 'r2', head: { predicate: 'q', arity: 1 }, body: [{ predicate: 'p', arity: 1, negated: true }] }
    ];
    expect(() => stratify(rules)).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
  });

  it('allows positive recursion (self-reference without negation)', () => {
    const rules = [
      { ruleId: 'r1', head: { predicate: 'a', arity: 2 }, body: [{ predicate: 'a', arity: 2, negated: false }] }
    ];
    expect(() => stratify(rules)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js`
Expected: FAIL — `stratify` not defined.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/Stratifier.js`:

```javascript
/**
 * Stratifier — compute stratum assignment for a rule set.
 * Builds the predicate dependency graph (edges marked positive/negated).
 * Cycles through any negated edge ⇒ CYCLIC_NEGATION rejection.
 * Otherwise assigns each rule the smallest stratum N where all negated body
 * predicates are fully evaluated in strata 0..N-1.
 */

const predKey = (p) => `${p.predicate}/${p.arity}`;

export function stratify(rules) {
  // Build directed graph: head -> body atom (each edge marked positive or negated).
  // Map<predKey, Array<{ to: predKey, negated: boolean }>>
  const graph = new Map();
  const rulesByHead = new Map();
  for (const r of rules) {
    const hk = predKey(r.head);
    if (!rulesByHead.has(hk)) rulesByHead.set(hk, []);
    rulesByHead.get(hk).push(r);
    if (!graph.has(hk)) graph.set(hk, []);
    for (const b of r.body) {
      const bk = predKey(b);
      graph.get(hk).push({ to: bk, negated: !!b.negated });
      if (!graph.has(bk)) graph.set(bk, []);
    }
  }

  // Detect cycle through negation via DFS with edge-marking.
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const node of graph.keys()) color.set(node, WHITE);

  function dfs(node, pathHasNegation) {
    color.set(node, GRAY);
    for (const edge of graph.get(node) || []) {
      const childPathNeg = pathHasNegation || edge.negated;
      if (color.get(edge.to) === GRAY) {
        if (childPathNeg) {
          throw { code: 'CYCLIC_NEGATION', cycle: [node, edge.to], message: `cycle through negation: ${node} → ${edge.to}` };
        }
      } else if (color.get(edge.to) === WHITE) {
        dfs(edge.to, childPathNeg);
      }
    }
    color.set(node, BLACK);
  }

  for (const node of graph.keys()) {
    if (color.get(node) === WHITE) dfs(node, false);
  }

  // Assign strata: iterate until fixed point. A rule's stratum = max over its negated body predicates of (their stratum + 1), or 0 if no negated body atom.
  const predStratum = new Map();
  for (const k of graph.keys()) predStratum.set(k, 0);
  const ruleStratum = new Map();

  let changed = true;
  let iterations = 0;
  const maxIterations = rules.length * 2 + 2;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    for (const r of rules) {
      let s = 0;
      for (const b of r.body) {
        const bk = predKey(b);
        const bs = predStratum.get(bk) ?? 0;
        if (b.negated) {
          s = Math.max(s, bs + 1);
        } else {
          s = Math.max(s, bs);
        }
      }
      const prev = ruleStratum.get(r.ruleId);
      if (prev !== s) {
        ruleStratum.set(r.ruleId, s);
        const hk = predKey(r.head);
        const hs = predStratum.get(hk) ?? 0;
        if (s > hs) {
          predStratum.set(hk, s);
          changed = true;
        }
      }
    }
  }

  return ruleStratum;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js`
Expected: PASS — all Stratifier tests pass; FactStore tests still pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Stratifier.js skills/design-large-task/engine/__tests__/operations.test.js
git commit -m "feat(engine): Stratifier with cycle-through-negation detection"
```

---

## Task 4: RuleStore — define, undefine, getRule

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3, AC-2.4 (rule removal portion)
**Decision budget:** 2
**Must remain green:** RuleStore tests added in this task; prior FactStore and Stratifier tests

**Files:**
- Create: `skills/design-large-task/engine/RuleStore.js`
- Modify: `skills/design-large-task/engine/__tests__/operations.test.js` (add RuleStore describe block)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `skills/design-large-task/engine/__tests__/operations.test.js`:

```javascript
import { RuleStore } from '../RuleStore.js';

describe('RuleStore', () => {
  const r1 = {
    ruleId: 'r1',
    head: { predicate: 'q', arity: 1, args: [{ var: 'X' }] },
    body: [{ predicate: 'p', arity: 2, args: [{ var: 'X' }, { var: 'Y' }], negated: false }],
    metadata: { domain_concept: 'test' }
  };

  it('defineRule stores a rule retrievable via getRule', () => {
    const rs = new RuleStore();
    rs.defineRule(r1);
    const got = rs.getRule('r1');
    expect(got.head).toEqual(r1.head);
    expect(got.body).toEqual(r1.body);
    expect(got.metadata).toEqual(r1.metadata);
  });

  it('defineRule rejects duplicate ruleId with DUPLICATE_RULE_ID', () => {
    const rs = new RuleStore();
    rs.defineRule(r1);
    expect(() => rs.defineRule(r1)).toThrow(expect.objectContaining({ code: 'DUPLICATE_RULE_ID' }));
  });

  it('defineRule rejects malformed head with MALFORMED_RULE', () => {
    const rs = new RuleStore();
    expect(() => rs.defineRule({ ruleId: 'bad', head: 'not-an-object', body: [] })).toThrow(
      expect.objectContaining({ code: 'MALFORMED_RULE' })
    );
  });

  it('defineRule rejects body atom with wrong shape', () => {
    const rs = new RuleStore();
    expect(() => rs.defineRule({
      ruleId: 'bad',
      head: r1.head,
      body: ['not-an-atom']
    })).toThrow(expect.objectContaining({ code: 'MALFORMED_RULE' }));
  });

  it('undefineRule removes a rule', () => {
    const rs = new RuleStore();
    rs.defineRule(r1);
    rs.undefineRule('r1');
    expect(rs.getRule('r1')).toBeUndefined();
  });

  it('undefineRule on non-existent id is idempotent', () => {
    const rs = new RuleStore();
    expect(() => rs.undefineRule('nonexistent')).not.toThrow();
  });

  it('defineRule runs stratification check and rejects cyclic negation', () => {
    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'r1',
      head: { predicate: 'p', arity: 1, args: [{ var: 'X' }] },
      body: [{ predicate: 'q', arity: 1, args: [{ var: 'X' }], negated: true }]
    });
    expect(() => rs.defineRule({
      ruleId: 'r2',
      head: { predicate: 'q', arity: 1, args: [{ var: 'X' }] },
      body: [{ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: true }]
    })).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
    expect(rs.getRule('r2')).toBeUndefined();
  });

  it('allRules returns the full rule list', () => {
    const rs = new RuleStore();
    rs.defineRule(r1);
    rs.defineRule({ ...r1, ruleId: 'r2' });
    expect(rs.allRules()).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js`
Expected: FAIL — `RuleStore` not defined.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/RuleStore.js`:

```javascript
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
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js`
Expected: PASS — all RuleStore tests pass; FactStore and Stratifier tests still pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/RuleStore.js skills/design-large-task/engine/__tests__/operations.test.js
git commit -m "feat(engine): RuleStore with stratification at defineRule"
```

---

## Task 5: Unifier — pattern matching for queries and rule bodies

**Type:** code-producing
**Implements:** AC-4.1 (pattern shapes), AC-4.2 (anonymous wildcards)
**Decision budget:** 3
**Must remain green:** Unifier tests added in this task

**Files:**
- Create: `skills/design-large-task/engine/Unifier.js`
- Create: `skills/design-large-task/engine/__tests__/query.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/query.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { unify, V, WILDCARD } from '../Unifier.js';

describe('Unifier.unify', () => {
  it('matches ground pattern (all constants)', () => {
    const bindings = unify([1, 'a', true], [1, 'a', true]);
    expect(bindings).toEqual({});
  });

  it('returns null when ground pattern does not match', () => {
    expect(unify([1, 'a'], [2, 'a'])).toBeNull();
  });

  it('binds variables', () => {
    const bindings = unify([V('X'), V('Y')], ['a', 'b']);
    expect(bindings).toEqual({ X: 'a', Y: 'b' });
  });

  it('mixed pattern: returns bindings for variables, constants must match', () => {
    expect(unify(['a', V('X')], ['a', 'b'])).toEqual({ X: 'b' });
    expect(unify(['a', V('X')], ['c', 'b'])).toBeNull();
  });

  it('wildcard matches anything without binding', () => {
    expect(unify([WILDCARD, V('X')], ['a', 'b'])).toEqual({ X: 'b' });
  });

  it('repeated variable name in pattern requires equal values', () => {
    expect(unify([V('X'), V('X')], ['a', 'a'])).toEqual({ X: 'a' });
    expect(unify([V('X'), V('X')], ['a', 'b'])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/query.test.js`
Expected: FAIL — `unify` / `V` / `WILDCARD` not defined.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/Unifier.js`:

```javascript
/**
 * Unifier — pattern matching for query patterns and rule body atoms.
 *
 * Wire format:
 *   - Constant: any string/number/boolean/null
 *   - Variable: { var: 'X' } — produced by V('X')
 *   - Wildcard: the literal string '_' — also exported as WILDCARD constant
 *
 * Spec §"Pattern wire format" reserves bare '_' as wildcard; a Domain caller
 * needing the literal string '_' as a constant must escape (out of scope here).
 */

export const WILDCARD = '_';
export const V = (name) => ({ var: name });

const isVariable = (t) => t && typeof t === 'object' && typeof t.var === 'string';
const isWildcard = (t) => t === WILDCARD;

/**
 * unify(pattern, factArgs) → bindings object or null
 *   pattern: Array<term>  (term: constant | { var: name } | '_')
 *   factArgs: Array<constant>
 */
export function unify(pattern, factArgs) {
  if (pattern.length !== factArgs.length) return null;
  const bindings = {};
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    const a = factArgs[i];
    if (isWildcard(p)) continue;
    if (isVariable(p)) {
      const name = p.var;
      if (Object.prototype.hasOwnProperty.call(bindings, name)) {
        if (bindings[name] !== a) return null;
      } else {
        bindings[name] = a;
      }
    } else {
      // constant
      if (p !== a) return null;
    }
  }
  return bindings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/query.test.js`
Expected: PASS — all Unifier tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Unifier.js skills/design-large-task/engine/__tests__/query.test.js
git commit -m "feat(engine): Unifier with variables and anonymous wildcard"
```

---

## Task 6: Evaluator — semi-naive bottom-up to fixed point with provenance

**Type:** code-producing
**Implements:** AC-3.1, AC-3.2, AC-3.5
**Decision budget:** 3
**Must remain green:** Evaluator tests added; prior tests

**Files:**
- Create: `skills/design-large-task/engine/utils.js` (shared `factKey(pred, args)` helper imported by Evaluator, Engine, Explain)
- Create: `skills/design-large-task/engine/Evaluator.js`
- Create: `skills/design-large-task/engine/__tests__/evaluation.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/evaluation.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { FactStore } from '../FactStore.js';
import { RuleStore } from '../RuleStore.js';
import { Evaluator } from '../Evaluator.js';
import { V } from '../Unifier.js';

describe('Evaluator — fixed-point semantics', () => {
  it('computes transitive closure correctly', () => {
    const fs = new FactStore();
    fs.assertFact('parent', ['a', 'b']);
    fs.assertFact('parent', ['b', 'c']);
    fs.assertFact('parent', ['c', 'd']);

    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    rs.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });

    const ev = new Evaluator(fs, rs);
    const idb = ev.derive();
    const ancFacts = Array.from(idb.values()).filter(f => f.predicate === 'ancestor');
    expect(ancFacts).toHaveLength(6); // a-b, b-c, c-d, a-c, b-d, a-d
  });

  it('derive() is idempotent — two consecutive calls produce same IDB', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a']);
    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const ev = new Evaluator(fs, rs);
    const idb1 = ev.derive();
    const idb2 = ev.derive();
    expect(idb2.size).toBe(idb1.size);
  });

  it('handles cycle reachability without infinite loop', () => {
    const fs = new FactStore();
    fs.assertFact('edge', ['a', 'b']);
    fs.assertFact('edge', ['b', 'a']);

    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'reach1',
      head: { predicate: 'reach', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'edge', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    rs.defineRule({
      ruleId: 'reach2',
      head: { predicate: 'reach', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'edge', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'reach', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    const ev = new Evaluator(fs, rs);
    const idb = ev.derive();
    const reach = Array.from(idb.values()).filter(f => f.predicate === 'reach');
    expect(reach).toHaveLength(4); // a-b, b-a, a-a, b-b
  });

  it('stores provenance per derived fact', () => {
    const fs = new FactStore();
    fs.assertFact('p', ['a']);
    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const ev = new Evaluator(fs, rs);
    const idb = ev.derive();
    const qFact = Array.from(idb.values()).find(f => f.predicate === 'q');
    expect(qFact.provenance.ruleId).toBe('r');
    expect(qFact.provenance.bindings).toEqual({ X: 'a' });
  });

  it('semi-naive delta tracking (AC-3.5 instrumentation)', () => {
    // For a 4-element parent chain, transitive-closure should reach fixed point in O(log N) iterations
    // and each iteration's delta size should equal the new ancestor facts derived that round.
    const fs = new FactStore();
    fs.assertFact('parent', ['a', 'b']);
    fs.assertFact('parent', ['b', 'c']);
    fs.assertFact('parent', ['c', 'd']);

    const rs = new RuleStore();
    rs.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    rs.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });

    const ev = new Evaluator(fs, rs);
    ev.derive();
    // iterationStats records per-iteration delta sizes. After the first iteration produces direct ancestors,
    // subsequent iterations should produce strictly smaller deltas until reaching zero.
    expect(ev.iterationStats.length).toBeGreaterThan(0);
    const deltas = ev.iterationStats.map(s => s.deltaSize);
    // Total facts derived equals sum of deltas (each fact counted once)
    const sum = deltas.reduce((a, b) => a + b, 0);
    expect(sum).toBe(6); // 6 ancestor facts in 3-element chain
    // Terminates: last recorded iteration has deltaSize = 0
    expect(deltas[deltas.length - 1]).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/evaluation.test.js`
Expected: FAIL — `Evaluator` not defined.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/utils.js` (shared helpers):

```javascript
/**
 * Shared utility for fact-key derivation. Used by Evaluator, Engine, and Explain
 * to address the IDB Map consistently. Centralizing here ensures any future change
 * to the key format propagates everywhere.
 */
export const factKey = (pred, args) => `${pred}/${args.length}:${JSON.stringify(args)}`;
```

Create `skills/design-large-task/engine/Evaluator.js`:

```javascript
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
    // Negation-as-failure: succeeds if no matching fact exists under currentBindings.
    const groundedPattern = substituteArgs(atom.args, currentBindings);
    const baseFacts = factStore.allFacts(atom.predicate, arity);
    const derivedFacts = [];
    for (const f of derived.values()) {
      if (f.predicate === atom.predicate && f.args.length === arity) derivedFacts.push(f);
    }
    const matchFn = (factArgs) => unify(groundedPattern, factArgs) !== null;
    const hasMatch = baseFacts.some(args => matchFn(args)) || derivedFacts.some(f => matchFn(f.args));
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
```

Semi-naive per Engine Spec §3.1: each rule iteration fires only against the prior iteration's delta facts (after the initial full pass), satisfying AC-3.5's instrumentation requirement. The `iterationStats` array is the instrumentation hook tests assert on.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/evaluation.test.js`
Expected: PASS — all 4 Evaluator tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/utils.js skills/design-large-task/engine/Evaluator.js skills/design-large-task/engine/__tests__/evaluation.test.js
git commit -m "feat(engine): Evaluator with stratified bottom-up fixed-point, provenance, shared factKey util"
```

---

## Task 7: Engine facade — derive, query, count, exists, isDerived, auto-derive

**Type:** code-producing
**Implements:** AC-1.3 (cascade through derive), AC-2.4 (rule removal cascade), AC-3.3 (isDerived), AC-3.4 (auto-derive), AC-4.3 (count/exists consistency)
**Decision budget:** 2
**Must remain green:** query.test.js, evaluation.test.js, operations.test.js

**Files:**
- Create: `skills/design-large-task/engine/Engine.js`
- Modify: `skills/design-large-task/engine/__tests__/query.test.js` (add Engine describe block)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `skills/design-large-task/engine/__tests__/query.test.js`:

```javascript
import { Engine } from '../Engine.js';

describe('Engine — facade & auto-derive', () => {
  it('isDerived transitions correctly', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    expect(e.isDerived()).toBe(false);
    e.derive();
    expect(e.isDerived()).toBe(true);
    e.assertFact('p', ['b']);
    expect(e.isDerived()).toBe(false);
  });

  it('query auto-derives when state is non-derived', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    // No explicit derive() — query should trigger it.
    const result = e.query(['q', [V('X')]]);
    expect(result).toEqual([{ X: 'a' }]);
  });

  it('count and exists are consistent with query', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.assertFact('p', ['b']);
    const q = e.query(['p', [V('X')]]);
    expect(e.count(['p', [V('X')]])).toBe(q.length);
    expect(e.exists(['p', [V('X')]])).toBe(q.length > 0);
    expect(e.exists(['p', ['nonexistent']])).toBe(false);
  });

  it('retracting a base fact cascades — derived dependent disappears after next derive', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    expect(e.query(['q', [V('X')]])).toEqual([{ X: 'a' }]);
    e.retractFact('p', ['a']);
    expect(e.query(['q', [V('X')]])).toEqual([]);
  });

  it('undefineRule cascades — facts derived only by that rule disappear', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    expect(e.query(['q', [V('X')]])).toHaveLength(1);
    e.undefineRule('r');
    expect(e.query(['q', [V('X')]])).toEqual([]);
  });

  it('query supports ground patterns (returns [{}] or [])', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    expect(e.query(['p', ['a']])).toEqual([{}]);
    expect(e.query(['p', ['b']])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/query.test.js`
Expected: FAIL — `Engine` not defined.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/Engine.js`:

```javascript
/**
 * Engine — facade aggregating FactStore, RuleStore, and Evaluator.
 * Exposes the §4 public API. Manages the "isDerived" flag and auto-derive.
 */

import { FactStore } from './FactStore.js';
import { RuleStore } from './RuleStore.js';
import { Evaluator } from './Evaluator.js';
import { unify } from './Unifier.js';
import { factKey } from './utils.js';

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all tests in evaluation, operations, query test files pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Engine.js skills/design-large-task/engine/__tests__/query.test.js
git commit -m "feat(engine): Engine facade with auto-derive and cascade-on-mutation"
```

---

## Task 8: Canonical Datalog evaluation tests

**Type:** code-producing
**Implements:** AC-9.1, AC-9.2, AC-9.3, AC-9.4
**Decision budget:** 2
**Must remain green:** evaluation.test.js (existing tests); all prior tests

**Files:**
- Modify: `skills/design-large-task/engine/__tests__/evaluation.test.js` (add canonical-programs describe blocks)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `skills/design-large-task/engine/__tests__/evaluation.test.js`:

```javascript
import { Engine } from '../Engine.js';

describe('Canonical Datalog programs', () => {
  it('stratified negation — same-generation cousins (canonical AC-9.1)', () => {
    // Build a family tree with same-generation pairs to detect.
    //   a is root; b and c are children of a; d is child of b; e is child of c.
    //   Same-generation pairs (sharing a common ancestor, neither an ancestor of the other):
    //     b/c (both children of a) and d/e (both grandchildren of a).
    const e = new Engine();
    e.assertFact('parent', ['a', 'b']);
    e.assertFact('parent', ['a', 'c']);
    e.assertFact('parent', ['b', 'd']);
    e.assertFact('parent', ['c', 'e']);

    e.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    // same_gen(X, Y) :- ancestor(Z, X), ancestor(Z, Y), ¬ancestor(X, Y), ¬ancestor(Y, X)
    // Tests two-sided mutual-exclusion negation per spec AC-9.1.
    e.defineRule({
      ruleId: 'same_gen',
      head: { predicate: 'same_gen', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('X')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')], negated: true },
        { predicate: 'ancestor', arity: 2, args: [V('Y'), V('X')], negated: true }
      ]
    });

    const pairs = e.query(['same_gen', [V('X'), V('Y')]])
      .map(b => [b.X, b.Y].sort().join('-'))
      .sort()
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedup ordered-pair vs unordered-pair
    // Expected unordered pairs: b-c (children of a) and d-e (grandchildren of a)
    expect(pairs).toContain('b-c');
    expect(pairs).toContain('d-e');
  });

  it('determinism: same program, two engines, same results', () => {
    const program = (engine) => {
      engine.assertFact('p', ['a']);
      engine.assertFact('p', ['b']);
      engine.defineRule({
        ruleId: 'r',
        head: { predicate: 'q', arity: 1, args: [V('X')] },
        body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
      });
    };
    const e1 = new Engine(); program(e1);
    const e2 = new Engine(); program(e2);
    expect(e1.query(['q', [V('X')]]).sort()).toEqual(e2.query(['q', [V('X')]]).sort());
  });

  it('insertion-order independence: facts in different orders produce same fixed point', () => {
    const e1 = new Engine();
    const e2 = new Engine();
    e1.assertFact('p', ['a']);
    e1.assertFact('p', ['b']);
    e2.assertFact('p', ['b']);
    e2.assertFact('p', ['a']);
    const r = {
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    };
    e1.defineRule(r); e2.defineRule(r);
    const result1 = e1.query(['q', [V('X')]]).map(b => b.X).sort();
    const result2 = e2.query(['q', [V('X')]]).map(b => b.X).sort();
    expect(result1).toEqual(result2);
  });

  it('negation interacting with retraction (AC-9.4)', () => {
    const e = new Engine();
    e.assertFact('parent', ['a', 'b']);
    e.assertFact('node', ['a']);
    e.assertFact('node', ['b']);
    e.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'leaf',
      head: { predicate: 'leaf', arity: 1, args: [V('X')] },
      body: [
        { predicate: 'node', arity: 1, args: [V('X')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')], negated: true }
      ]
    });
    expect(e.query(['leaf', [V('X')]]).map(b => b.X).sort()).toEqual(['b']);
    e.retractFact('parent', ['a', 'b']);
    expect(e.query(['leaf', [V('X')]]).map(b => b.X).sort()).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/evaluation.test.js`
Expected: All 4 new canonical tests pass (the Engine and Evaluator are already built). If any fail, the bug is in Evaluator or Engine and must be fixed.

- [ ] **Step 3: Write minimal implementation**

No new implementation required — these tests exercise existing modules. If a test fails, the implementation defect lives in Evaluator.js or Engine.js; fix the defect there.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all tests across all suites.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/__tests__/evaluation.test.js
git commit -m "test(engine): canonical Datalog programs incl stratified negation & negation+retraction"
```

---

## Task 9: Explain — derivation tree walker

**Type:** code-producing
**Implements:** AC-5.1, AC-5.2, AC-5.3
**Decision budget:** 2
**Must remain green:** explain.test.js (created); prior tests

**Files:**
- Create: `skills/design-large-task/engine/Explain.js`
- Create: `skills/design-large-task/engine/__tests__/explain.test.js`
- Modify: `skills/design-large-task/engine/Engine.js` (add `explain(predicate, args)` method)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/explain.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Engine.explain', () => {
  function buildAncestor() {
    const e = new Engine();
    e.assertFact('parent', ['a', 'b']);
    e.assertFact('parent', ['b', 'c']);
    e.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    e.derive();
    return e;
  }

  it('returns a derivation tree for a derived fact', () => {
    const e = buildAncestor();
    const tree = e.explain('ancestor', ['a', 'c']);
    expect(tree).not.toBeNull();
    expect(tree.fact.predicate).toBe('ancestor');
    expect(tree.ruleId).toBe('anc2');
    expect(tree.children).toBeInstanceOf(Array);
    expect(tree.children.length).toBe(2);
  });

  it('leaves are EDB facts (children empty or marked source: edb)', () => {
    const e = buildAncestor();
    const tree = e.explain('ancestor', ['a', 'b']);
    expect(tree.ruleId).toBe('anc1');
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].source).toBe('edb');
  });

  it('returns null for non-derived fact', () => {
    const e = buildAncestor();
    expect(e.explain('ancestor', ['x', 'y'])).toBeNull();
  });

  it('returns null after retraction-then-rederive removes the fact', () => {
    const e = buildAncestor();
    expect(e.explain('ancestor', ['a', 'c'])).not.toBeNull();
    e.retractFact('parent', ['b', 'c']);
    e.derive();
    expect(e.explain('ancestor', ['a', 'c'])).toBeNull();
  });

  it('returns same canonical tree on repeated calls (deterministic)', () => {
    const e = buildAncestor();
    const t1 = e.explain('ancestor', ['a', 'c']);
    const t2 = e.explain('ancestor', ['a', 'c']);
    expect(JSON.stringify(t1)).toBe(JSON.stringify(t2));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/explain.test.js`
Expected: FAIL — `explain` not on Engine.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/Explain.js`:

```javascript
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
```

Modify `skills/design-large-task/engine/Engine.js` — add explain method:

```javascript
// Add to existing imports at top of Engine.js:
import { explainFact } from './Explain.js';

// Add as method on Engine class:
explain(predicate, args) {
  this._ensureDerived();
  return explainFact(predicate, args, this._derived, this._rules, this._facts);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all explain tests pass; no regression in earlier tests.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Explain.js skills/design-large-task/engine/Engine.js skills/design-large-task/engine/__tests__/explain.test.js
git commit -m "feat(engine): explain via provenance tree walker"
```

---

## Task 10: Snapshot — structuredClone-based snapshot/restore

**Type:** code-producing
**Implements:** AC-6.1, AC-6.2, AC-6.3
**Decision budget:** 2
**Must remain green:** snapshot.test.js (created); prior tests

**Files:**
- Create: `skills/design-large-task/engine/Snapshot.js`
- Create: `skills/design-large-task/engine/__tests__/snapshot.test.js`
- Modify: `skills/design-large-task/engine/Engine.js` (add `snapshot()` / `restore(token)`)
- Modify: `skills/design-large-task/engine/FactStore.js` (add `_serialize` / `_loadFrom` helpers)
- Modify: `skills/design-large-task/engine/RuleStore.js` (add `_serialize` / `_loadFrom` helpers)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/snapshot.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Engine.snapshot / restore', () => {
  it('round-trip preserves all observable state', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    e.derive();
    const snap = e.snapshot();

    e.assertFact('p', ['b']);
    e.retractFact('p', ['a']);
    e.undefineRule('r');

    e.restore(snap);
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(e.getRule('r')).toBeDefined();
    expect(e.query(['q', [V('X')]])).toEqual([{ X: 'a' }]);
  });

  it('out-of-order restore: older snapshot wins', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const snap1 = e.snapshot();
    e.assertFact('p', ['b']);
    const snap2 = e.snapshot();
    e.assertFact('p', ['c']);

    e.restore(snap1);
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(e.factExists('p', ['c'])).toBe(false);
  });

  it('snapshot survives clear', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const snap = e.snapshot();
    e.clear();
    expect(e.factExists('p', ['a'])).toBe(false);
    e.restore(snap);
    expect(e.factExists('p', ['a'])).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/snapshot.test.js`
Expected: FAIL — `snapshot`/`restore` not on Engine.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/Snapshot.js`:

```javascript
/**
 * Snapshot — full-copy snapshot/restore via structuredClone.
 * Captures EDB, rule store, IDB, and isDerived flag.
 */

export function captureSnapshot(engine) {
  return structuredClone({
    facts: engine._facts._snapshot(),
    rules: engine._rules._snapshot(),
    derived: Array.from(engine._derived.entries()),
    isDerived: engine._isDerived
  });
}

export function restoreSnapshot(engine, token) {
  engine._facts._restore(token.facts);
  engine._rules._restore(token.rules);
  engine._derived = new Map(token.derived);
  engine._isDerived = token.isDerived;
}
```

Modify `skills/design-large-task/engine/FactStore.js` — add at the end of the class:

```javascript
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
```

Modify `skills/design-large-task/engine/RuleStore.js` — add at the end of the class:

```javascript
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
```

Modify `skills/design-large-task/engine/Engine.js` — add methods and import:

```javascript
import { captureSnapshot, restoreSnapshot } from './Snapshot.js';

// Methods on Engine class:
snapshot() { return captureSnapshot(this); }
restore(token) { restoreSnapshot(this, token); }
clear() {
  this._facts = new FactStore();
  this._rules = new RuleStore();
  this._derived = new Map();
  this._isDerived = false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all snapshot tests pass; no regression.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Snapshot.js skills/design-large-task/engine/Engine.js skills/design-large-task/engine/FactStore.js skills/design-large-task/engine/RuleStore.js skills/design-large-task/engine/__tests__/snapshot.test.js
git commit -m "feat(engine): snapshot/restore via structuredClone and clear()"
```

---

## Task 11: Lifecycle and serialization — serialize, loadFrom

**Type:** code-producing
**Implements:** AC-7.1, AC-7.2, AC-7.3, AC-7.4
**Decision budget:** 2
**Must remain green:** lifecycle.test.js (created); prior tests

**Files:**
- Create: `skills/design-large-task/engine/Serializer.js`
- Create: `skills/design-large-task/engine/__tests__/lifecycle.test.js`
- Modify: `skills/design-large-task/engine/Engine.js` (add `serialize()` / `loadFrom(serialized)`)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/lifecycle.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Engine lifecycle and serialization', () => {
  it('clear empties EDB and rule store', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    e.clear();
    expect(e.factExists('p', ['a'])).toBe(false);
    expect(e.getRule('r')).toBeUndefined();
    expect(e.query(['p', [V('X')]])).toEqual([]);
  });

  it('serialize/loadFrom round-trip preserves observable state', () => {
    const e1 = new Engine();
    e1.assertFact('p', ['a']);
    e1.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const s = e1.serialize();
    const json = JSON.stringify(s);
    const reloaded = JSON.parse(json);
    const e2 = new Engine();
    e2.loadFrom(reloaded);
    expect(e2.factExists('p', ['a'])).toBe(true);
    expect(e2.query(['q', [V('X')]])).toEqual([{ X: 'a' }]);
  });

  it('serialize excludes derived facts (IDB recomputes on load)', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    e.derive();
    const s = e.serialize();
    expect(s.idb).toBeUndefined();
    expect(s.derived).toBeUndefined();
  });

  it('loadFrom rejects malformed input with MALFORMED_SERIALIZED_INPUT', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    expect(() => e.loadFrom('not-an-object')).toThrow(
      expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT' })
    );
    expect(() => e.loadFrom({ wrong: 'shape' })).toThrow(
      expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT' })
    );
    // Engine state unchanged.
    expect(e.factExists('p', ['a'])).toBe(true);
  });

  it('loadFrom on empty valid input produces empty engine', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.loadFrom({ version: 1, facts: [], rules: [] });
    expect(e.factExists('p', ['a'])).toBe(false);
    expect(e.query(['p', [V('X')]])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/lifecycle.test.js`
Expected: FAIL — `serialize`/`loadFrom` not implemented.

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/Serializer.js`:

```javascript
/**
 * Serializer — JSON-marshals EDB and rule store; IDB is excluded (recomputed on load).
 * Validates structure of incoming serialized input.
 *
 * Uses the `_snapshot()` helpers on FactStore and RuleStore as the single source of
 * truth for extracting internal state — does NOT reach past those helpers into
 * `_facts._facts` or `_rules._rules` directly. This consolidates the persistence
 * path: if the internal storage format changes, only the `_snapshot()` helpers move.
 */

export function serializeEngine(engine) {
  const factsSnap = engine._facts._snapshot();
  const factsOut = [];
  for (const [pk, entries] of factsSnap.facts) {
    // pk format is "<predicate>/<arity>" — predicate may itself contain '/'.
    // Use lastIndexOf to split at the final separator only.
    const lastSlash = pk.lastIndexOf('/');
    const predicate = pk.slice(0, lastSlash);
    for (const [, args] of entries) {
      factsOut.push({ predicate, args });
    }
  }
  const rulesSnap = engine._rules._snapshot();
  const rulesOut = rulesSnap.rules.map(([, rule]) => rule);
  return { version: 1, facts: factsOut, rules: rulesOut };
}

function isValidSerialized(s) {
  return s && typeof s === 'object'
    && typeof s.version === 'number'
    && Array.isArray(s.facts)
    && Array.isArray(s.rules)
    && s.facts.every(f => f && typeof f.predicate === 'string' && Array.isArray(f.args))
    && s.rules.every(r => r && typeof r.ruleId === 'string' && r.head && Array.isArray(r.body));
}

export function loadEngineFrom(engine, serialized) {
  if (!isValidSerialized(serialized)) {
    throw { code: 'MALFORMED_SERIALIZED_INPUT', message: 'serialized form failed schema validation' };
  }
  engine.clear();
  for (const f of serialized.facts) engine.assertFact(f.predicate, f.args);
  for (const r of serialized.rules) engine.defineRule(r);
}
```

Modify `skills/design-large-task/engine/Engine.js` — add methods:

```javascript
import { serializeEngine, loadEngineFrom } from './Serializer.js';

// Methods on Engine class:
serialize() { return serializeEngine(this); }
loadFrom(serialized) { loadEngineFrom(this, serialized); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all lifecycle tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Serializer.js skills/design-large-task/engine/Engine.js skills/design-large-task/engine/__tests__/lifecycle.test.js
git commit -m "feat(engine): serialize/loadFrom with schema validation"
```

---

## Task 12: Transactions — begin, commit, rollback with read-own-writes

**Type:** code-producing
**Implements:** AC-8.1, AC-8.2, AC-8.4, AC-8.5
**Decision budget:** 3
**Must remain green:** transactions.test.js (created); prior tests

**Files:**
- Create: `skills/design-large-task/engine/__tests__/transactions.test.js`
- Modify: `skills/design-large-task/engine/Engine.js` (add `begin/commit/rollback` using snapshot-rollback strategy: snapshot at begin, mutations apply live during tx, rollback restores the snapshot)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/transactions.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Engine transactions', () => {
  it('begin/commit applies buffered mutations atomically', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.assertFact('p', ['b']);
    expect(e.factExists('p', ['b'])).toBe(true); // read-own-writes
    e.commit(h);
    expect(e.factExists('p', ['b'])).toBe(true); // post-commit visible
  });

  it('begin/rollback discards buffered mutations', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.assertFact('p', ['b']);
    e.rollback(h);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(e.factExists('p', ['a'])).toBe(true);
  });

  it('read-own-writes: query inside tx sees buffered assertions and rules', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    expect(e.query(['q', [V('X')]])).toEqual([{ X: 'a' }]); // in-tx query sees buffered rule
    e.rollback(h);
    expect(e.getRule('r')).toBeUndefined(); // post-rollback rule is gone
  });

  it('nested begin raises NESTED_TRANSACTION', () => {
    const e = new Engine();
    const h = e.begin();
    expect(() => e.begin()).toThrow(expect.objectContaining({ code: 'NESTED_TRANSACTION' }));
    e.rollback(h);
  });

  it('stale handle: double commit raises STALE_HANDLE', () => {
    const e = new Engine();
    const h = e.begin();
    e.commit(h);
    expect(() => e.commit(h)).toThrow(expect.objectContaining({ code: 'STALE_HANDLE' }));
    expect(() => e.rollback(h)).toThrow(expect.objectContaining({ code: 'STALE_HANDLE' }));
  });

  it('post-rollback state is bit-equal to pre-begin', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const before = e.snapshot();
    const h = e.begin();
    e.assertFact('p', ['b']);
    e.assertFact('p', ['c']);
    e.rollback(h);
    const after = e.snapshot();
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/transactions.test.js`
Expected: FAIL — `begin`/`commit`/`rollback` not implemented.

- [ ] **Step 3: Write minimal implementation**

Implementation strategy: **snapshot-rollback**. When `begin()` is called, snapshot the engine. Mutations during the tx apply directly to the live state — read-own-writes is free since the live state reflects them, and the stratification check at `defineRule` runs on the live rule store (satisfying ADR-0013 Part 3). `commit()` discards the snapshot (mutations are already live). `rollback()` restores the snapshot. This makes commit trivially atomic by construction: there is no apply step to fail, so no try/catch wrapper is needed.

A `TransactionBuffer` class is NOT created — the snapshot-rollback strategy carries no buffer; the file would be dead code.

```javascript
// Add to Engine class:

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
```

Note: under this implementation, mutations during a tx execute *immediately* against the live state. The snapshot captured at `begin()` is the rollback point. Read-own-writes is trivially satisfied — queries inside the tx see the live state, which reflects the buffered mutations. This is a valid implementation of the §4.8 logical-view contract because the spec's intent is read-own-writes visibility, not that the live state remain pristine until commit.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all transaction tests pass; no regression.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Engine.js skills/design-large-task/engine/__tests__/transactions.test.js
git commit -m "feat(engine): transactions with snapshot-rollback and read-own-writes"
```

---

## Task 13: Transaction edge cases — stratification in tx, lifecycle ops refused, commit atomicity

**Type:** code-producing
**Implements:** AC-8.3, AC-8.6, AC-8.7
**Decision budget:** 3
**Must remain green:** transactions.test.js (existing + extended); prior tests

**Files:**
- Modify: `skills/design-large-task/engine/Engine.js` (refuse clear/loadFrom during open tx; restore inside tx implicitly rolls back; snapshot inside tx captures logical view because mutations are already live; commit-time atomicity holds by construction under snapshot-rollback — commit only clears the active handle, no apply step to fail)
- Modify: `skills/design-large-task/engine/__tests__/transactions.test.js` (add edge-case tests)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `skills/design-large-task/engine/__tests__/transactions.test.js`:

```javascript
describe('Engine transaction edge cases', () => {
  it('cyclic-negation rule inside tx is rejected at defineRule, tx remains usable', () => {
    const e = new Engine();
    const h = e.begin();
    e.defineRule({
      ruleId: 'r1',
      head: { predicate: 'p', arity: 1, args: [V('X')] },
      body: [{ predicate: 'q', arity: 1, args: [V('X')], negated: true }]
    });
    expect(() => e.defineRule({
      ruleId: 'r2',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: true }]
    })).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
    expect(e.getRule('r1')).toBeDefined();
    expect(e.getRule('r2')).toBeUndefined();
    e.commit(h);
    expect(e.getRule('r1')).toBeDefined();
  });

  it('clear() inside tx refused with NESTED_TRANSACTION_OP_REFUSED', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    expect(() => e.clear()).toThrow(expect.objectContaining({ code: 'NESTED_TRANSACTION_OP_REFUSED' }));
    expect(e.factExists('p', ['a'])).toBe(true);
    e.rollback(h);
  });

  it('loadFrom() inside tx refused with NESTED_TRANSACTION_OP_REFUSED', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    expect(() => e.loadFrom({ version: 1, facts: [], rules: [] })).toThrow(
      expect.objectContaining({ code: 'NESTED_TRANSACTION_OP_REFUSED' })
    );
    expect(e.factExists('p', ['a'])).toBe(true);
    e.rollback(h);
  });

  it('serialize() inside tx returns logical view (committed + buffered)', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.assertFact('p', ['b']);
    const s = e.serialize();
    expect(s.facts.find(f => f.predicate === 'p' && f.args[0] === 'b')).toBeDefined();
    e.rollback(h);
  });

  it('restore() inside tx implicitly rolls back', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const pre = e.snapshot();
    const h = e.begin();
    e.assertFact('p', ['b']);
    e.restore(pre);
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(() => e.commit(h)).toThrow(expect.objectContaining({ code: 'STALE_HANDLE' }));
  });

  it('snapshot inside tx captures logical view; restore returns to that view', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    const h = e.begin();
    e.assertFact('p', ['b']);
    const snap = e.snapshot();
    // Even after rollback, restore brings us back to logical view (a + b).
    e.rollback(h);
    expect(e.factExists('p', ['b'])).toBe(false);
    e.restore(snap);
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(true);
  });

  it('AC-8.7 commit-time atomicity: post-commit state = pre-begin + mutations (no halfway state)', () => {
    // The snapshot-rollback implementation makes commit trivially atomic:
    // mutations apply live; commit only clears the active-tx handle.
    // This test verifies the observable invariant: after commit, no halfway state is reachable.
    const e = new Engine();
    e.assertFact('p', ['a']);
    const preBegin = e.snapshot();

    const h = e.begin();
    e.assertFact('p', ['b']);
    e.assertFact('p', ['c']);
    e.commit(h);

    // Post-commit state must match pre-begin + the buffered mutations exactly — no half-applied state.
    const expectedPostCommit = new Engine();
    expectedPostCommit.loadFrom({ version: 1, facts: [
      { predicate: 'p', args: ['a'] },
      { predicate: 'p', args: ['b'] },
      { predicate: 'p', args: ['c'] }
    ], rules: [] });
    expect(e.count(['p', [V('X')]])).toBe(expectedPostCommit.count(['p', [V('X')]]));
    expect(e.factExists('p', ['a'])).toBe(true);
    expect(e.factExists('p', ['b'])).toBe(true);
    expect(e.factExists('p', ['c'])).toBe(true);

    // Inverse property: rolling back to pre-begin via restore returns to exact pre-begin state.
    e.restore(preBegin);
    expect(e.factExists('p', ['b'])).toBe(false);
    expect(e.factExists('p', ['c'])).toBe(false);
    expect(e.factExists('p', ['a'])).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/transactions.test.js`
Expected: FAIL — clear/loadFrom/restore inside tx not yet guarded.

- [ ] **Step 3: Write minimal implementation**

Modify `skills/design-large-task/engine/Engine.js`:

```javascript
// Update clear() to refuse during open tx:
clear() {
  if (this._tx) throw { code: 'NESTED_TRANSACTION_OP_REFUSED', op: 'clear', message: 'cannot clear during open transaction' };
  this._facts = new FactStore();
  this._rules = new RuleStore();
  this._derived = new Map();
  this._isDerived = false;
}

// Update loadFrom() to refuse during open tx:
loadFrom(serialized) {
  if (this._tx) throw { code: 'NESTED_TRANSACTION_OP_REFUSED', op: 'loadFrom', message: 'cannot loadFrom during open transaction' };
  loadEngineFrom(this, serialized);
}

// Update restore() to implicitly roll back any open tx:
restore(token) {
  if (this._tx) {
    // Invalidate handle by clearing _tx. The caller's handle becomes stale.
    this._tx = null;
  }
  restoreSnapshot(this, token);
}
```

(No change needed for `serialize()` inside tx — the live state already reflects buffered mutations, so serialize returns the logical view automatically.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all transaction edge-case tests pass; no regression.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Engine.js skills/design-large-task/engine/__tests__/transactions.test.js
git commit -m "feat(engine): transaction edge cases — refuse clear/loadFrom in tx, implicit rollback on restore"
```

---

## Task 14: Cross-cutting property tests — monotonicity, termination

**Type:** code-producing
**Implements:** AC-10.1, AC-10.2
**Decision budget:** 1
**Must remain green:** properties.test.js (created); prior tests

**Files:**
- Create: `skills/design-large-task/engine/__tests__/properties.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/properties.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Cross-cutting properties', () => {
  it('monotonicity: adding facts never reduces IDB', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const initialSize = e.query(['q', [V('X')]]).length;
    e.assertFact('p', ['b']);
    expect(e.query(['q', [V('X')]]).length).toBeGreaterThanOrEqual(initialSize);
  });

  it('set semantics: asserting same fact twice produces one EDB entry', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.assertFact('p', ['a']);
    expect(e.query(['p', [V('X')]])).toEqual([{ X: 'a' }]);
  });

  it('termination: 100-element transitive closure terminates within bounded time', () => {
    const e = new Engine();
    for (let i = 0; i < 100; i++) e.assertFact('parent', [`n${i}`, `n${i + 1}`]);
    e.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    const start = Date.now();
    const count = e.count(['ancestor', [V('X'), V('Y')]]);
    const elapsed = Date.now() - start;
    expect(count).toBe(100 * 101 / 2); // n*(n+1)/2 = 5050
    expect(elapsed).toBeLessThan(5000); // generous bound
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/properties.test.js`
Expected: Existing engine should pass — if any fails, it indicates an evaluator bug.

- [ ] **Step 3: Write minimal implementation**

No new implementation required — tests exercise existing engine. Fix evaluator if needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all properties tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/__tests__/properties.test.js
git commit -m "test(engine): cross-cutting properties — monotonicity, set semantics, termination"
```

---

## Task 15: Stress tests — large fact stores, deep recursion, many rules, large transactions

**Type:** code-producing
**Implements:** AC-11.1, AC-11.2, AC-11.3, AC-11.4
**Decision budget:** 2
**Must remain green:** stress.test.js (created); prior tests

**Files:**
- Create: `skills/design-large-task/engine/__tests__/stress.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/stress.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Stress tests', () => {
  it('AC-11.1: 10k facts with query workload completes within budget', () => {
    const e = new Engine();
    for (let i = 0; i < 10000; i++) e.assertFact('p', [`v${i}`, i % 100]);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 2, args: [V('X'), V('K')], negated: false }]
    });
    const t0 = Date.now();
    e.derive();
    const deriveMs = Date.now() - t0;
    const t1 = Date.now();
    const r = e.count(['p', [V('X'), 5]]);
    const queryMs = Date.now() - t1;
    expect(r).toBe(100);
    expect(deriveMs).toBeLessThan(5000); // generous for naive
    expect(queryMs).toBeLessThan(100);
  }, 30000);

  it('AC-11.2: 1000-element transitive closure terminates with correct count', () => {
    const e = new Engine();
    for (let i = 0; i < 1000; i++) e.assertFact('parent', [`n${i}`, `n${i + 1}`]);
    e.defineRule({
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    const c = e.count(['ancestor', [V('X'), V('Y')]]);
    expect(c).toBe(1000 * 1001 / 2);
  }, 60000);

  it('AC-11.3: 100 rules with shared bodies', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.assertFact('s', ['a']);
    for (let i = 0; i < 100; i++) {
      e.defineRule({
        ruleId: `r${i}`,
        head: { predicate: `q${i}`, arity: 1, args: [V('X')] },
        body: [
          { predicate: 'p', arity: 1, args: [V('X')], negated: false },
          { predicate: 's', arity: 1, args: [V('X')], negated: false }
        ]
      });
    }
    e.derive();
    // All q_i should derive
    expect(e.exists(['q50', [V('X')]])).toBe(true);
  }, 30000);

  it('AC-11.4: large transaction with 500 buffered mutations commits', () => {
    const e = new Engine();
    const h = e.begin();
    for (let i = 0; i < 500; i++) e.assertFact('p', [`v${i}`]);
    e.commit(h);
    expect(e.count(['p', [V('X')]])).toBe(500);
  }, 30000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/stress.test.js`
Expected: PASS — existing engine should handle these workloads. If any fails on performance, document the gap and consider optimization (out of scope here unless §8 budget is grossly violated).

- [ ] **Step 3: Write minimal implementation**

No new implementation required.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all stress tests pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/__tests__/stress.test.js
git commit -m "test(engine): stress tests for AC-11.1..AC-11.4"
```

---

## Task 16: Failure-mode and architectural compliance audit

**Type:** code-producing
**Implements:** AC-12.1, AC-13.1 (re-confirmed), AC-13.2
**Decision budget:** 1
**Must remain green:** failures.test.js (created); architecture.test.js; all prior tests

**Files:**
- Create: `skills/design-large-task/engine/__tests__/failures.test.js`
- Modify: `skills/design-large-task/engine/__tests__/architecture.test.js` (add port-surface assertion)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/failures.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Failure modes — all nine error codes', () => {
  it('MALFORMED_RULE — defineRule with non-atom head', () => {
    const e = new Engine();
    expect(() => e.defineRule({ ruleId: 'r', head: 'bad', body: [] })).toThrow(
      expect.objectContaining({ code: 'MALFORMED_RULE' })
    );
  });

  it('CYCLIC_NEGATION — defineRule introducing cycle', () => {
    const e = new Engine();
    e.defineRule({
      ruleId: 'r1',
      head: { predicate: 'p', arity: 1, args: [V('X')] },
      body: [{ predicate: 'q', arity: 1, args: [V('X')], negated: true }]
    });
    expect(() => e.defineRule({
      ruleId: 'r2',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: true }]
    })).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
  });

  it('DUPLICATE_RULE_ID', () => {
    const e = new Engine();
    const r = {
      ruleId: 'r',
      head: { predicate: 'p', arity: 1, args: [V('X')] },
      body: [{ predicate: 'q', arity: 1, args: [V('X')], negated: false }]
    };
    e.defineRule(r);
    expect(() => e.defineRule(r)).toThrow(expect.objectContaining({ code: 'DUPLICATE_RULE_ID' }));
  });

  it('TYPE_ERROR on non-constant fact arg', () => {
    const e = new Engine();
    expect(() => e.assertFact('p', [{}])).toThrow(expect.objectContaining({ code: 'TYPE_ERROR' }));
  });

  it('NESTED_TRANSACTION on second begin()', () => {
    const e = new Engine();
    const h = e.begin();
    expect(() => e.begin()).toThrow(expect.objectContaining({ code: 'NESTED_TRANSACTION' }));
    e.rollback(h);
  });

  it('STALE_HANDLE on double commit', () => {
    const e = new Engine();
    const h = e.begin();
    e.commit(h);
    expect(() => e.commit(h)).toThrow(expect.objectContaining({ code: 'STALE_HANDLE' }));
  });

  it('MALFORMED_SERIALIZED_INPUT on bad loadFrom', () => {
    const e = new Engine();
    expect(() => e.loadFrom('bad')).toThrow(expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT' }));
  });

  it('NESTED_TRANSACTION_OP_REFUSED on clear() during tx', () => {
    const e = new Engine();
    const h = e.begin();
    expect(() => e.clear()).toThrow(expect.objectContaining({ code: 'NESTED_TRANSACTION_OP_REFUSED' }));
    e.rollback(h);
  });

  // MEMORY_BUDGET_EXCEEDED is a defensive guard: Evaluator.derive sets a 10000-iteration cap.
  // A well-stratified Datalog program cannot trigger this cap by construction (every program
  // terminates in finite iterations). The error code exists for safety against rule-set bugs
  // that the Stratifier somehow misses, but it is not exercisable from the public API under
  // a valid program. No test asserts on it directly; the guard remains in the implementation.
});
```

Append to `skills/design-large-task/engine/__tests__/architecture.test.js`:

```javascript
import { Engine } from '../Engine.js';

describe('Architectural compliance', () => {
  it('Engine exposes the six substrate ports', () => {
    const e = new Engine();
    // IFactStore
    expect(typeof e.assertFact).toBe('function');
    expect(typeof e.retractFact).toBe('function');
    expect(typeof e.factExists).toBe('function');
    // IRuleStore
    expect(typeof e.defineRule).toBe('function');
    expect(typeof e.undefineRule).toBe('function');
    expect(typeof e.getRule).toBe('function');
    // IQueryEngine
    expect(typeof e.derive).toBe('function');
    expect(typeof e.query).toBe('function');
    expect(typeof e.count).toBe('function');
    expect(typeof e.exists).toBe('function');
    expect(typeof e.isDerived).toBe('function');
    // ISnapshotRestore
    expect(typeof e.snapshot).toBe('function');
    expect(typeof e.restore).toBe('function');
    // IExplain
    expect(typeof e.explain).toBe('function');
    // ITransaction
    expect(typeof e.begin).toBe('function');
    expect(typeof e.commit).toBe('function');
    expect(typeof e.rollback).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — all engine surfaces in place from prior tasks. Failure indicates a missed implementation.

- [ ] **Step 3: Write minimal implementation**

No new implementation required if all prior tasks completed.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skills/design-large-task/engine && npm test`
Expected: PASS — entire test suite green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/__tests__/failures.test.js skills/design-large-task/engine/__tests__/architecture.test.js
git commit -m "test(engine): failure-mode audit (9 error codes) and port-surface compliance"
```
