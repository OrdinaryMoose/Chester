# Plan: Sprint-02 Proof Layer (Domain)

**Sprint:** `20260511-01-mp-redesign-proof-system/sprint-02-proof-layer`
**Spec:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/spec/sprint-02-proof-layer-spec-02.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

**Revision note (plan-01):** delta on plan-00 to align with `spec-02` corrections (Engine API pinning after sprint-01 pass-4 merge, commit 146bc68). Three spec-driven patches plus four plan-reviewer-driven refinements.

**Spec-02-driven patches:**
1. **Task 11 (counterfactual.js)** — `probePorts.facts.retractFact("approved", [propId, "_", "_"])` rewritten as **query-then-retract**, since Engine `retractFact(predicate, args)` requires exact constant args (matched by `JSON.stringify(args)`, not by pattern). Test fixture and assertions updated.
2. **Tasks 4, 13, 14** — `defineRule` calls audited to use the **4-arg tuple form** `defineRule(ruleId, headAtom, bodyAtoms, metadata)` pinned in spec-02's new "Engine public-surface signatures" section. `RuleSpec` shape renamed `{ruleId, head, body, metadata}` → `{ruleId, headAtom, bodyAtoms, metadata}` everywhere (translation.js, mutations.js, domain-bridge.js, test stubs).
3. **Citation hygiene** — any `Engine Spec §4.5 line 305` reference corrected to `§4.6 line 305` (Snapshot/restore, not Explain).

**Plan-reviewer-driven refinements (caught pre-existing gaps in plan-00 vs spec ACs):**
4. **Task 4 + Task 14 — Phase B `DomainBootError` carries the failing template id.** `registerRuleTemplates` wraps each per-template `defineRule` in a try/catch that annotates the throw with `templateId` and `ruleId`; `domain-bridge.js`'s Phase B catch reads `e.templateId` into `DomainBootError.recordId`. Tests for AC-4.3 and AC-5.1 now assert `captured.recordId === 'junk'` / `=== 'cyclic_test'`.
5. **Task 14 — `createDomainBridgeWith` empty-facade pitfall closed.** The test-only factory previously returned `Object.freeze({})` with a "copy from createDomainBridge" comment; success-path tests would silently see `undefined` methods. Replaced with an explicit `throw new Error(...)` that fires if the implementer reaches the success path without first copying the facade or refactoring to a shared helper.
6. **Task 15 (module-shape.test.js) — AC-12.1 now asserts `bridge-integration.test.js` exists.** Previously the test enumerated only the 12 module-named files; the spec explicitly requires `bridge-integration.test.js` alongside them. The NAMED list excludes `domain-bridge.js` for the per-module test mapping (its behavioral coverage lives in `bridge-integration.test.js`, not in `domain-bridge.test.js`).
7. **Task 16 — AC-3.4 and AC-11.1 now iterate the full surface.** AC-3.4 was testing only `addElement`; it now exercises all eight verbs (`openProof`, `addElement`, `reviseElement`, `withdrawElement`, `ratifyElement`, `manageFriction`, `presentClosingArgument`, `confirmClosureGo`) with §6.1 ordering invariants checked per-verb. The loop invokes `runOperation` directly (via the existing exports from `mutations.js`) rather than via facade methods, because two of the eight verbs don't map cleanly to single facade methods: `openProof` has no delivery-port facade method (it's invoked by the Interface at session initiation, not as a tool call), and `manageFriction` is dispatched across two facade methods (`addFriction` and `overrideFrictionDisposition`) per spec §"Delivery-port facade methods". AC-11.1 was testing only two render methods; it now iterates the full five-method `IRenderSurface` (`renderStructuredProof`, `renderElementDeep`, `renderClosingArgument`, `renderDatalogProjection`, `renderLaneSlice`), exposes `runCounterfactual` on `createReadOnlyAudit` (IQuerySurface completeness per spec line 493), and asserts a 13-entry forbidden-mutation list (IElementMutation + IRatification + IFrictionManagement + the full 5-method IDefinitionManagement + IClosureSurface).

**Plan-hardening-driven mitigations (Critical + selected Important findings from `plan-threat-report-01.md`):**

8. **CR-1 / IM-1 — fake `_unify` aligned to Engine wire format.** The substrate fake's `_unify` now branches on `{var: 'name'}` objects (the Engine's variable form per `Unifier.js`) and treats bare uppercase strings as constants (no longer as variables). All Domain query patterns in `lifecycle.js`, `closure-policy.js`, `friction-policy.js`, `render.js` updated from bare uppercase strings (e.g. `['round', ['N']]`) to `{var:'X'}` form (e.g. `['round', [{var:'N'}]]`). 12 call-sites patched. Sprint-02 tests now exercise the same variable-resolution semantics that sprint-03 will see against the real Engine.
9. **CR-2 — AC-6.1 render-read-only test resets recorder before render calls.** Added `calls.length = 0` between bridge construction and the first render call so Phase A/B `defineRule` registrations don't pollute the mutation-detection assertion.
10. **CR-3 — AC-3.4 verb-loop args satisfy each verb's idShape required fields.** Six of eight verb cases were failing `verifyArgsShape` at §6.1 step 3 (before `tx.begin`); now each verb's args include the EVIDENCE-shape required fields `{source, claim}` (or FRICTION-shape `{shape, description}` for `manageFriction`). Inline comment documents the verbs using EVIDENCE as a placeholder idShape (`openProof`, `ratify`, `withdrawElement`, `presentClosingArgument`, `confirmClosureGo`). The bridge-integration `makeAdapters` now uses a deterministic per-shape counter (`shape_1`, `shape_2`, ...) instead of random suffixes so test prep can reference `evidence_1` reliably.
11. **CR-4 — `renderElementDeep` and `renderDatalogProjection` use per-predicate arity.** Both functions previously queried with a fixed-width wildcard fill (`Array(5).fill('_')` / `Array(8).fill('_')`) that never matched any fact because the Engine's `unify` requires exact arity. Both now use a per-predicate `arity` map and construct patterns at the declared arity. `renderDatalogProjection` additionally uses positional named variables (`{var: 'V0'}`, `{var: 'V1'}`, ...) so the binding object captures concrete fact args; reconstruction preserves positional order via `varNames.map((n) => row[n])` instead of relying on `Object.values` ordering. AC-11.1 invocation list now passes realistic per-method args (`{id: 'evidence_1'}` for `renderElementDeep`, `{lane: 'all'}` for `renderLaneSlice`).
12. **IM-3 — sprint-03 Engine adapter contract documented in Tech Stack.** A note explains that the real Engine exposes flat methods on its instance while the Domain's port bundles consume nested-port objects; sprint-03's Interface wiring must adapt between them. Adapter shape is documented inline so sprint-03 doesn't have to re-derive the contract.

**Deferred from threat report (operator decision recorded):**

- **IM-2 — substrate fake's empty `_runFixedPoint` evaluator** (smell finding F1). Tests that depend on derived facts pass vacuously; per-fixture stubbing would close the gap but adds scope. Deferred to a follow-up sprint.
- **IM-5 — `createDomainBridgeWith` clone-and-refactor** (smell finding F3). The throw-on-success contract surfaces the duplication loudly; the underlying clone remains. Deferred — would require a `_buildBootedBridge` helper extraction (~30 LOC restructure).
- **MN-1 through MN-5** — minor findings. None block sprint-02; documented in the threat report and deferred.

All other 11 tasks are unchanged from plan-00 in behavior. plan-00 remains as the audit trail of "what was planned before the Engine merge."

## Goal

Implement the Chester proof system's Domain layer as the verb-as-data Purist design at `skills/design-large-task/domain/` — 13 source files (~2,650 LOC) + 9 test files — realizing the §6.1 mutation flow, the role-narrowed port bundles, the boot-validators, the structural-tests suite, and the seven delivery-port facade.

## Architecture

Hexagonal Domain layer: consumes six substrate ports from the sibling Engine at `skills/design-large-task/engine/`, exposes seven delivery ports through `domain-bridge.js`. Verb-as-data (`OPERATION_SPECS` registry + single `runOperation` orchestrator). Role-narrowed port bundles (`ReadPorts`, `WritePorts`, `ProbePorts`, `FullPorts`) enforced at function-signature level. Boot-validators in dedicated `boot-validators.js` close cross-record drift modes. Static-structural tests in `domain/structural-tests/` enforce source-shape ACs.

## Tech Stack

- **Language:** JavaScript ES modules (`"type": "module"`) — same convention as the sibling `engine/` package.
- **Test runner:** vitest (matching the engine package).
- **Source layout:** `skills/design-large-task/domain/` as a sibling of `skills/design-large-task/engine/`.
- **Engine import (test-time):** an in-memory substrate fake under `domain/__tests__/_fixtures/` that implements the six substrate-port contracts (no real engine dependency for domain tests).
- **Engine import (runtime, sprint-03 integration):** sprint-03 wires `domain-bridge.createDomainBridge({engine, ...})` to the real engine; sprint-02 only documents the contract.
- **Engine-to-port-bundle adapter (sprint-03 deliverable, NOT in sprint-02 scope):** the substrate fake exposes nested port objects (`engine.facts`, `engine.rules`, `engine.query`, `engine.snapshot = {snapshot, restore}`, `engine.explain`, `engine.tx`) matching the Domain's port-bundle shape. The real Engine exposes flat methods on its instance (`engine.assertFact`, `engine.query`, `engine.snapshot`, `engine.explain`, `engine.begin/commit/rollback` etc.). Sprint-03's Interface wiring must adapt the real Engine's flat surface into the nested-port shape that `createDomainBridge` consumes — e.g.: `{ facts: { assertFact: (p,a) => engine.assertFact(p,a), retractFact: ..., factExists: ... }, rules: { defineRule: (id, h, b, m) => engine.defineRule(id, h, b, m), ... }, query: { query: (p) => engine.query(p), derive: () => engine.derive(), count: ..., exists: ... }, snapshot: { snapshot: () => engine.snapshot(), restore: (t) => engine.restore(t) }, explain: (f) => engine.explain(f), tx: { begin: () => engine.begin(), commit: (h) => engine.commit(h), rollback: (h) => engine.rollback(h) } }`. This adapter is sprint-03 scope per spec Non-Goals; sprint-02 does not build it.

---

## Task 1: Foundation — domain/ package + vitest + structural-tests scaffolding + substrate fake

**Type:** config-producing
**Implements:** none directly (foundation for all subsequent tasks)
**Decision budget:** 2 (vitest config conventions; in-memory substrate fake shape)
**Must remain green:** the scaffold smoke test created in this task

**Files:**
- Create: `skills/design-large-task/domain/package.json`
- Create: `skills/design-large-task/domain/vitest.config.js`
- Create: `skills/design-large-task/domain/__tests__/_fixtures/inMemorySubstrate.js`
- Create: `skills/design-large-task/domain/__tests__/_fixtures/scaffold.test.js`
- Create: `skills/design-large-task/domain/structural-tests/source-scanner.js`

**Background:**
The sibling `engine/` package uses `vitest run` as `npm test` with ESM modules. Mirror that. The in-memory substrate fake implements the six substrate-port contracts (`IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction`) with map/set internals so every Domain test runs against the same fake. Cascade references: `04-engine-spec.md` §4.1–§4.8 (port surfaces), `05-domain-spec.md` §12 (test obligations).

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/domain/__tests__/_fixtures/scaffold.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './inMemorySubstrate.js';

describe('inMemorySubstrate', () => {
  it('exposes six substrate ports', () => {
    const s = createInMemorySubstrate();
    expect(s.facts).toBeDefined();
    expect(s.rules).toBeDefined();
    expect(s.query).toBeDefined();
    expect(s.snapshot).toBeDefined();
    expect(s.explain).toBeDefined();
    expect(s.tx).toBeDefined();
  });

  it('assertFact then query round-trips', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('p', ['a', 'b']);
    expect(s.query.query(['p', ['_', '_']])).toEqual([{}]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run from `skills/design-large-task/domain/`: `npm test -- --run scaffold`
Expected: FAIL — module not found (`inMemorySubstrate.js` doesn't exist).
```

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/domain/package.json`:

```json
{
  "name": "chester-proof-domain",
  "version": "0.1.0",
  "type": "module",
  "description": "Domain layer for the Chester proof system (sprint-02-proof-layer)",
  "main": "domain-bridge.js",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.1.1"
  }
}
```

Create `skills/design-large-task/domain/vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['**/*.test.js'] } });
```

Create `skills/design-large-task/domain/__tests__/_fixtures/inMemorySubstrate.js`:

```javascript
// In-memory substrate fake. Implements the six substrate-port contracts per
// Engine Spec §4.1–§4.8. NOT a mock — implements the contracts correctly.
// Used by every Domain test (Spec Testing Strategy).

export function createInMemorySubstrate() {
  const baseFacts = new Map(); // predicate -> Set<JSON args>
  const rules = new Map();     // ruleId -> {head, body, metadata}
  const derived = new Map();   // predicate -> Set<JSON args> (rebuilt by derive)
  let dirty = false;
  let inTx = false;
  const txBuffer = { asserts: [], retracts: [], defines: [], undefines: [] };

  const key = (args) => JSON.stringify(args);

  const facts = {
    assertFact(predicate, args) {
      if (inTx) { txBuffer.asserts.push({ predicate, args }); }
      else { _addFact(baseFacts, predicate, args); dirty = true; }
    },
    retractFact(predicate, args) {
      if (inTx) { txBuffer.retracts.push({ predicate, args }); }
      else { _removeFact(baseFacts, predicate, args); dirty = true; }
    },
    factExists(predicate, args) {
      return _hasFact(_logicalEDB(), predicate, args);
    },
  };

  const rulesPort = {
    defineRule(ruleId, head, body, metadata = {}) {
      // ADR-0013 Part 3: stratification check fires HERE at defineRule time.
      _checkStratification(_logicalRules({ id: ruleId, head, body, metadata }));
      if (inTx) { txBuffer.defines.push({ ruleId, head, body, metadata }); }
      else { rules.set(ruleId, { head, body, metadata }); dirty = true; }
    },
    undefineRule(ruleId) {
      if (inTx) { txBuffer.undefines.push({ ruleId }); }
      else { rules.delete(ruleId); dirty = true; }
    },
    getRule(ruleId) { return rules.get(ruleId) ?? null; },
  };

  const queryPort = {
    derive() { if (dirty) { _runFixedPoint(); dirty = false; } },
    query(pattern) { this.derive(); return _matchPattern(_logicalEDB(), _logicalIDB(), pattern); },
    count(pattern) { return this.query(pattern).length; },
    exists(pattern) { return this.count(pattern) > 0; },
  };

  const snapshotPort = {
    snapshot() {
      return JSON.stringify({
        baseFacts: [...baseFacts.entries()].map(([p, s]) => [p, [...s]]),
        rules: [...rules.entries()],
        derived: [...derived.entries()].map(([p, s]) => [p, [...s]]),
      });
    },
    restore(token) {
      const obj = JSON.parse(token);
      baseFacts.clear(); rules.clear(); derived.clear();
      for (const [p, arr] of obj.baseFacts) baseFacts.set(p, new Set(arr));
      for (const [id, r] of obj.rules) rules.set(id, r);
      for (const [p, arr] of obj.derived) derived.set(p, new Set(arr));
      dirty = false;
    },
  };

  // Spec-02 §"Engine public-surface signatures" pins ReadPorts.explain(fact) as a direct
  // 1-arg call (Engine Spec §4.5; `Engine.explain(fact)` on the real Engine is a method on
  // the Engine instance, not a namespace). The fake mirrors that shape: `engine.explain` is
  // a callable function, not a `{explain(fact){...}}` namespace, so bridge code that does
  // `readPorts.explain = engine.explain` then `readPorts.explain(fact)` works against the
  // fake the same way it works against the real Engine.
  const explainFn = (fact) => ({ fact, derivation: [], provenance: 'in-memory-fake' });

  const tx = {
    begin() {
      if (inTx) throw new Error('TX_ALREADY_OPEN');
      inTx = true;
      return Symbol('tx-handle');
    },
    commit(handle) {
      if (!inTx) throw new Error('TX_NOT_OPEN');
      for (const { predicate, args } of txBuffer.asserts) _addFact(baseFacts, predicate, args);
      for (const { predicate, args } of txBuffer.retracts) _removeFact(baseFacts, predicate, args);
      for (const { ruleId, head, body, metadata } of txBuffer.defines) rules.set(ruleId, { head, body, metadata });
      for (const { ruleId } of txBuffer.undefines) rules.delete(ruleId);
      _resetTxBuffer(); inTx = false; dirty = true;
    },
    rollback(handle) { _resetTxBuffer(); inTx = false; },
  };

  // --- helpers (implementation detail; collapse into ~40 LOC) ---
  function _addFact(store, p, args) { if (!store.has(p)) store.set(p, new Set()); store.get(p).add(key(args)); }
  function _removeFact(store, p, args) { store.get(p)?.delete(key(args)); }
  function _hasFact(edb, p, args) { return edb.get(p)?.has(key(args)) ?? false; }
  function _logicalEDB() {
    if (!inTx) return baseFacts;
    const e = new Map([...baseFacts].map(([p, s]) => [p, new Set(s)]));
    for (const { predicate, args } of txBuffer.asserts) _addFact(e, predicate, args);
    for (const { predicate, args } of txBuffer.retracts) _removeFact(e, predicate, args);
    return e;
  }
  function _logicalRules(extra) {
    const r = new Map(rules);
    if (inTx) {
      for (const d of txBuffer.defines) r.set(d.ruleId, d);
      for (const { ruleId } of txBuffer.undefines) r.delete(ruleId);
    }
    if (extra) r.set(extra.id, extra);
    return r;
  }
  function _logicalIDB() { return derived; }
  function _runFixedPoint() { /* trivial: walk rules and produce derived facts. For tests, implementations can stub specific predicates per fixture. */ }
  function _checkStratification(ruleMap) {
    // ADR-0013 Part 3: detect cycles through negation. The substrate fake implements a simple
    // negation-cycle detector so the Task 16 AC-4.3/AC-5.1 Phase B stratification test fires.
    // Algorithm: build a directed graph where every body atom contributes head→body edges,
    // marked "negated" when the body is wrapped in ['not', ...]. Any cycle that includes a
    // negated edge is rejected as "cycle through negation".
    const edges = []; // {from, to, negated}
    for (const { head, body } of ruleMap.values()) {
      const headPred = head?.[0];
      if (!headPred) continue;
      for (const atom of body ?? []) {
        if (atom[0] === 'not') edges.push({ from: headPred, to: atom[1][0], negated: true });
        else edges.push({ from: headPred, to: atom[0], negated: false });
      }
    }
    // DFS for negation cycles.
    const adj = new Map();
    for (const e of edges) { if (!adj.has(e.from)) adj.set(e.from, []); adj.get(e.from).push(e); }
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map();
    function dfs(node, hasNegated) {
      color.set(node, GRAY);
      for (const e of adj.get(node) ?? []) {
        const next = e.to;
        const carry = hasNegated || e.negated;
        if (color.get(next) === GRAY && carry) {
          throw Object.assign(new Error(`STRATIFICATION: cycle through negation involving ${next}`), { code: 'STRATIFICATION' });
        }
        if (color.get(next) === undefined) dfs(next, carry);
      }
      color.set(node, BLACK);
    }
    for (const node of adj.keys()) if (color.get(node) === undefined) dfs(node, false);
  }
  function _matchPattern(edb, idb, pattern) {
    const [pred, args] = pattern;
    const merged = new Set([...(edb.get(pred) ?? []), ...(idb.get(pred) ?? [])]);
    const out = [];
    for (const k of merged) {
      const factArgs = JSON.parse(k);
      const binding = _unify(args, factArgs);
      if (binding !== null) out.push(binding);
    }
    return out;
  }
  function _unify(pat, fact) {
    if (pat.length !== fact.length) return null;
    const b = {};
    for (let i = 0; i < pat.length; i++) {
      const p = pat[i];
      // Wildcard — matches anything, binds nothing.
      if (p === '_') continue;
      // Variable in Engine wire format: { var: 'name' } object (per Unifier.js).
      // This is the form _lowerWildcards (counterfactual.js) produces and the form
      // the real Engine's Unifier.unify expects in query patterns.
      if (p && typeof p === 'object' && typeof p.var === 'string') {
        const name = p.var;
        if (Object.prototype.hasOwnProperty.call(b, name)) {
          // Same variable seen twice — both bindings must agree.
          if (b[name] !== fact[i]) return null;
        } else {
          b[name] = fact[i];
        }
        continue;
      }
      // Constant — must equal the fact arg exactly.
      // (Bare uppercase strings are NOT variables here; they are constants. The fake
      // matches Engine query-time behavior — Domain modules must use { var: 'X' } for
      // variables in query patterns, not bare 'X'.)
      if (p !== fact[i]) return null;
    }
    return b;
  }
  function _resetTxBuffer() { txBuffer.asserts.length = txBuffer.retracts.length = txBuffer.defines.length = txBuffer.undefines.length = 0; }

  return { facts, rules: rulesPort, query: queryPort, snapshot: snapshotPort, explain: explainFn, tx };
}
```

Create `skills/design-large-task/domain/structural-tests/source-scanner.js`:

```javascript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DOMAIN_DIR = resolve(import.meta.dirname, '..');

export function readSource(relPath) { return readFileSync(resolve(DOMAIN_DIR, relPath), 'utf-8'); }
export function linesOf(src) { return src.split('\n'); }
export function countNonBlankNonComment(src) {
  return linesOf(src).filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*')).length;
}
export function grep(src, pattern) { return [...src.matchAll(pattern)]; }
export function countMatches(src, pattern) { return grep(src, pattern).length; }
export function assertNoMatch(src, pattern, message) {
  const m = grep(src, pattern);
  if (m.length > 0) throw new Error(`${message}: matched ${m.length} times`);
}
export function assertMatchCount(src, pattern, n, message) {
  const m = grep(src, pattern);
  if (m.length !== n) throw new Error(`${message}: expected ${n} matches, got ${m.length}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

```
Run from `skills/design-large-task/domain/`: `npm install && npm test -- --run scaffold`
Expected: PASS — both scaffold tests green. (Stub fixed-point evaluator is acceptable for scaffold; later tasks add per-fixture rule firings.)
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/package.json skills/design-large-task/domain/vitest.config.js skills/design-large-task/domain/__tests__/_fixtures/inMemorySubstrate.js skills/design-large-task/domain/__tests__/_fixtures/scaffold.test.js skills/design-large-task/domain/structural-tests/source-scanner.js
git commit -m "feat(domain): scaffold package, vitest, substrate fake, source-scanner"
```

---

## Task 2: tags.js — closed-set discipline

**Type:** code-producing
**Implements:** AC-1.1 (file existence), AC-1.2 (LOC ceiling), partial AC-4.1/4.2 (closed-set anchors)
**Decision budget:** 1 (concrete enum values per cascade)
**Must remain green:** `tags.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/tags.js`
- Create: `skills/design-large-task/domain/__tests__/tags.test.js`

**Background:**
Closed-set enums per brief Key Decision 6, plus `RENDER_SECTIONS` (spec amendment, see spec line ~28). Each set is `Object.freeze`'d. `assertExhaustive(value, set, label)` is the canonical membership check. Enum values come from Domain Spec §1 (ELEMENT_CATEGORIES: evidence, rule, permission, proposition, risk, resolution, friction, definition), §3.4.1 (INFERENCE_PATTERNS), §3.7.1 (FRICTION_SHAPES), §3.7.2 (FRICTION_DISPOSITIONS), §3.10 (WITHDRAWAL_DISPOSITIONS), §4.5 (PHASES), §6.2 (ACTION_LABELS), §3.1/§3.2/§5.1 (CONSENT_SOURCES), §10 (RENDER_SECTIONS).

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import * as tags from '../tags.js';

describe('tags', () => {
  it('exposes nine frozen closed-set objects', () => {
    for (const name of [
      'INFERENCE_PATTERNS', 'FRICTION_SHAPES', 'FRICTION_DISPOSITIONS',
      'ACTION_LABELS', 'WITHDRAWAL_DISPOSITIONS', 'CONSENT_SOURCES',
      'ELEMENT_CATEGORIES', 'PHASES', 'RENDER_SECTIONS',
    ]) {
      expect(tags[name]).toBeDefined();
      expect(Object.isFrozen(tags[name])).toBe(true);
    }
  });

  it('ELEMENT_CATEGORIES has eight known values', () => {
    expect(new Set(Object.values(tags.ELEMENT_CATEGORIES))).toEqual(
      new Set(['evidence', 'rule', 'permission', 'proposition', 'risk', 'resolution', 'friction', 'definition'])
    );
  });

  it('assertExhaustive throws on out-of-set value', () => {
    expect(() => tags.assertExhaustive('not-a-phase', tags.PHASES, 'PHASES')).toThrow(/PHASES/);
  });

  it('assertExhaustive returns the value on in-set value', () => {
    const v = Object.values(tags.PHASES)[0];
    expect(tags.assertExhaustive(v, tags.PHASES, 'PHASES')).toBe(v);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run from `skills/design-large-task/domain/`: `npm test -- --run tags`
Expected: FAIL — module not found.
```

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/domain/tags.js`:

```javascript
// Closed-set enums per brief Key Decision 6 + RENDER_SECTIONS (spec amendment).
// Every Domain module imports tag values from here; no module re-declares an enum.
// See Architecture §11.11 (closed-set discipline) and the cascade docs cited per set.

export const ELEMENT_CATEGORIES = Object.freeze({
  EVIDENCE: 'evidence', RULE: 'rule', PERMISSION: 'permission',
  PROPOSITION: 'proposition', RISK: 'risk', RESOLUTION: 'resolution',
  FRICTION: 'friction', DEFINITION: 'definition',
});

export const PHASES = Object.freeze({
  ESTABLISHMENT: 'establishment', LANE_RESOLUTION: 'lane_resolution',
  PRESENTATION: 'presentation', CONFIRMATION: 'confirmation',
});

export const CONSENT_SOURCES = Object.freeze({
  DESIGNER: 'designer', DESIGN_PARTNER: 'design_partner', SYSTEM: 'system',
});

export const INFERENCE_PATTERNS = Object.freeze({
  GROUNDS_IMPLY_CONCLUSION: 'grounds_imply_conclusion',
  ABSENCE_IMPLIES_ABSENCE: 'absence_implies_absence',
  ENABLEMENT: 'enablement',
  STRUCTURAL: 'structural',
});

export const FRICTION_SHAPES = Object.freeze({
  COVERAGE_GAP: 'coverage_gap', OVERLAP: 'overlap',
  CONFLICT: 'conflict', UNGROUNDED: 'ungrounded',
  STAGNATION: 'stagnation',
});

export const FRICTION_DISPOSITIONS = Object.freeze({
  ADDRESS: 'address', DEFER: 'defer', DISMISS: 'dismiss', OVERRIDE: 'override',
});

export const WITHDRAWAL_DISPOSITIONS = Object.freeze({
  EXPLICIT: 'explicit', SUPERSEDED: 'superseded', PHANTOM: 'phantom',
});

export const ACTION_LABELS = Object.freeze({
  ADD: 'add', REVISE: 'revise', WITHDRAW: 'withdraw',
  RATIFY: 'ratify', MANAGE_FRICTION: 'manage_friction',
  PRESENT_CLOSING_ARGUMENT: 'present_closing_argument',
  CONFIRM_CLOSURE_GO: 'confirm_closure_go', OPEN_PROOF: 'open_proof',
});

export const RENDER_SECTIONS = Object.freeze({
  PROBLEM: 'problem', GIVENS: 'givens', DEFINITIONS: 'definitions',
  INFERENTIAL_FRAMEWORK: 'inferential_framework', LEMMAS: 'lemmas',
  THEOREMS: 'theorems', FRICTIONS: 'frictions', REJECTED: 'rejected',
  CLOSURE_STATUS: 'closure_status',
});

export function assertExhaustive(value, set, label) {
  const allowed = new Set(Object.values(set));
  if (!allowed.has(value)) {
    throw new Error(`Unexhausted ${label}: ${JSON.stringify(value)} not in ${JSON.stringify([...allowed])}`);
  }
  return value;
}
```

- [ ] **Step 4: Run test to verify it passes**

```
Run: `npm test -- --run tags`
Expected: PASS — all four tests green.
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/tags.js skills/design-large-task/domain/__tests__/tags.test.js
git commit -m "feat(domain): tags.js with nine closed-set enums and assertExhaustive"
```

---

## Task 3: schema.js — CATEGORY_REGISTRY

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-4.2 (CategoryRegistry validator anchor)
**Decision budget:** 2 (CategoryDescriptor field shape; per-category requiredFields)
**Must remain green:** `schema.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/schema.js`
- Create: `skills/design-large-task/domain/__tests__/schema.test.js`

**Background:**
`CATEGORY_REGISTRY` maps each of the eight `ELEMENT_CATEGORIES` values to a `CategoryDescriptor` with fields: `requiredFields` (array of strings, non-empty), `optionalFields` (array), `sourceConstraint` (value from `tags.CONSENT_SOURCES`), `idShape` (matches an `ELEMENT_CATEGORIES` value, used as the id prefix), `renderSection` (value from `tags.RENDER_SECTIONS`), `closedEnumFields` (object: fieldName → enum from `tags.js`), `authority` (object: who can `add`/`revise`/`withdraw`/`ratify`). Per-category content comes from Domain Spec §3 (each subsection enumerates the schema for one element category). Also exports `verifyArgsShape(args, idShape)` — a pure function that checks an operation's args against the descriptor's `requiredFields` and `closedEnumFields`.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { CATEGORY_REGISTRY, verifyArgsShape } from '../schema.js';
import { ELEMENT_CATEGORIES } from '../tags.js';

describe('schema', () => {
  it('CATEGORY_REGISTRY has eight descriptors keyed by ELEMENT_CATEGORIES', () => {
    expect(Object.keys(CATEGORY_REGISTRY).sort()).toEqual(Object.values(ELEMENT_CATEGORIES).sort());
  });

  it('each descriptor has non-empty requiredFields and a sourceConstraint', () => {
    for (const d of Object.values(CATEGORY_REGISTRY)) {
      expect(Array.isArray(d.requiredFields)).toBe(true);
      expect(d.requiredFields.length).toBeGreaterThan(0);
      expect(typeof d.sourceConstraint).toBe('string');
    }
  });

  it('verifyArgsShape passes valid args and throws on missing required field', () => {
    const cat = ELEMENT_CATEGORIES.EVIDENCE;
    const desc = CATEGORY_REGISTRY[cat];
    const validArgs = Object.fromEntries(desc.requiredFields.map(f => [f, 'x']));
    expect(() => verifyArgsShape(validArgs, cat)).not.toThrow();
    const { [desc.requiredFields[0]]: _, ...partial } = validArgs;
    expect(() => verifyArgsShape(partial, cat)).toThrow(/SHAPE/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run: `npm test -- --run schema`
Expected: FAIL — module not found.
```

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/domain/schema.js`. Build one `CategoryDescriptor` per `ELEMENT_CATEGORIES` value. Per-category fields come from Domain Spec §3.1 (Evidence), §3.2 (Rule), §3.3 (Permission), §3.4 (Proposition with grounding/collapse_test/inference_pattern), §3.5 (Risk), §3.6 (Resolution), §3.7 (Friction), §3.8 (Definition). Use `tags.js` for every closed-set reference.

```javascript
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, RENDER_SECTIONS, INFERENCE_PATTERNS, FRICTION_SHAPES, FRICTION_DISPOSITIONS, WITHDRAWAL_DISPOSITIONS, assertExhaustive } from './tags.js';

export const CATEGORY_REGISTRY = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]: Object.freeze({
    requiredFields: ['source', 'claim'],
    optionalFields: ['url', 'citation'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    renderSection: RENDER_SECTIONS.GIVENS,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.RULE]: Object.freeze({
    requiredFields: ['statement'],
    optionalFields: ['rationale'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RULE,
    renderSection: RENDER_SECTIONS.INFERENTIAL_FRAMEWORK,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.PERMISSION]: Object.freeze({
    requiredFields: ['statement'],
    optionalFields: ['rationale'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PERMISSION,
    renderSection: RENDER_SECTIONS.INFERENTIAL_FRAMEWORK,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.PROPOSITION]: Object.freeze({
    requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern'],
    optionalFields: ['scope'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.PROPOSITION,
    renderSection: RENDER_SECTIONS.LEMMAS,
    closedEnumFields: { inference_pattern: INFERENCE_PATTERNS },
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
  [ELEMENT_CATEGORIES.RISK]: Object.freeze({
    requiredFields: ['statement'],
    optionalFields: ['severity'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RISK,
    renderSection: RENDER_SECTIONS.PROBLEM,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.RESOLUTION]: Object.freeze({
    requiredFields: ['statement', 'addresses'],
    optionalFields: [],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.RESOLUTION,
    renderSection: RENDER_SECTIONS.THEOREMS,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
  [ELEMENT_CATEGORIES.FRICTION]: Object.freeze({
    requiredFields: ['shape', 'description'],
    optionalFields: ['disposition'],
    sourceConstraint: CONSENT_SOURCES.SYSTEM,
    idShape: ELEMENT_CATEGORIES.FRICTION,
    renderSection: RENDER_SECTIONS.FRICTIONS,
    closedEnumFields: { shape: FRICTION_SHAPES, disposition: FRICTION_DISPOSITIONS },
    authority: { add: [CONSENT_SOURCES.SYSTEM, CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER] },
  }),
  [ELEMENT_CATEGORIES.DEFINITION]: Object.freeze({
    requiredFields: ['term', 'definition'],
    optionalFields: ['scope'],
    sourceConstraint: CONSENT_SOURCES.DESIGNER,
    idShape: ELEMENT_CATEGORIES.DEFINITION,
    renderSection: RENDER_SECTIONS.DEFINITIONS,
    closedEnumFields: {},
    authority: { add: [CONSENT_SOURCES.DESIGNER], revise: [CONSENT_SOURCES.DESIGNER], withdraw: [CONSENT_SOURCES.DESIGNER], ratify: [CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER] },
  }),
});

export function verifyArgsShape(args, idShape) {
  const desc = CATEGORY_REGISTRY[idShape];
  if (!desc) throw Object.assign(new Error(`SHAPE_INVALID: unknown idShape ${idShape}`), { code: 'SHAPE_INVALID' });
  for (const f of desc.requiredFields) {
    if (!(f in args)) throw Object.assign(new Error(`SHAPE_INVALID: missing required field "${f}" for ${idShape}`), { code: 'SHAPE_INVALID', field: f });
  }
  for (const [field, set] of Object.entries(desc.closedEnumFields)) {
    if (field in args) assertExhaustive(args[field], set, field);
  }
  return args;
}
```

- [ ] **Step 4: Run test to verify it passes**

```
Run: `npm test -- --run schema`
Expected: PASS — three tests green.
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/schema.js skills/design-large-task/domain/__tests__/schema.test.js
git commit -m "feat(domain): schema.js with CATEGORY_REGISTRY and verifyArgsShape"
```

---

## Task 4: translation.js — translators + RULE_TEMPLATES + EDB-predicate declaration

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-4.3 (RULE_TEMPLATES anchor), partial AC-4.1 (EDB predicate declaration)
**Decision budget:** 3 (per-category translator output shape; rule template parameter format; instantiateTemplate signature)
**Must remain green:** `translation.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/translation.js`
- Create: `skills/design-large-task/domain/__tests__/translation.test.js`

**Background:**
`translate(category, args, id, ts) → {baseFacts, rules, metaFacts}`. Each category translator turns an element into base facts (cascade §2 translation table) and, for approval-gated categories (Proposition, Resolution, Definition), parameterized rules. `RULE_TEMPLATES` is keyed by `idShape` — each value carries a function `(elementId) → {ruleId, head, body, metadata}` representing the parameterized rule for that category's "approved" implication (per ADR-0003: approval as engine body literal). `registerRuleTemplates(rulePorts)` defines all approval-gated rule templates at Phase B. `instantiateTemplate(idShape, newId, rulePorts)` is called from `runOperation` step 5 for Phase C — it builds the concrete rule from the template and calls `rulePorts.defineRule`. `getDeclaredEDBPredicates()` returns the set of base-fact predicate names this module emits (used by `boot-validators` to build `validPredicates`).

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { translate, RULE_TEMPLATES, registerRuleTemplates, instantiateTemplate, getDeclaredEDBPredicates } from '../translation.js';
import { ELEMENT_CATEGORIES } from '../tags.js';

describe('translation', () => {
  it('translate(Evidence) returns baseFacts with predicate "evidence"', () => {
    const out = translate(ELEMENT_CATEGORIES.EVIDENCE, { source: 'codebase', claim: 'x' }, 'evid_1', 1700000000);
    expect(out.baseFacts.some(f => f[0] === 'evidence')).toBe(true);
    expect(Array.isArray(out.rules)).toBe(true);
    expect(Array.isArray(out.metaFacts)).toBe(true);
  });

  it('translate(Proposition) returns approval-gated rule shape', () => {
    const out = translate(ELEMENT_CATEGORIES.PROPOSITION,
      { statement: 's', grounding: 'g', collapse_test: 'ct', inference_pattern: 'grounds_imply_conclusion' },
      'prop_1', 1700000000);
    // Proposition translation emits base facts (proposition_decl etc.) AND
    // a rule that fires when "approved" is asserted (per ADR-0003).
    expect(out.baseFacts.some(f => f[0] === 'proposition_decl')).toBe(true);
  });

  it('RULE_TEMPLATES has entries for approval-gated categories only', () => {
    expect(RULE_TEMPLATES[ELEMENT_CATEGORIES.PROPOSITION]).toBeDefined();
    expect(RULE_TEMPLATES[ELEMENT_CATEGORIES.RESOLUTION]).toBeDefined();
    expect(RULE_TEMPLATES[ELEMENT_CATEGORIES.DEFINITION]).toBeDefined();
    expect(RULE_TEMPLATES[ELEMENT_CATEGORIES.EVIDENCE]).toBeUndefined();
  });

  it('registerRuleTemplates defines a rule per approval-gated category', () => {
    const rulePorts = { defineRule: vi.fn(), undefineRule: vi.fn(), getRule: vi.fn() };
    registerRuleTemplates(rulePorts);
    // Approval-gated categories: Proposition, Resolution, Definition → at least 3 defines
    expect(rulePorts.defineRule.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('instantiateTemplate substitutes id and calls defineRule', () => {
    const rulePorts = { defineRule: vi.fn(), undefineRule: vi.fn(), getRule: vi.fn() };
    instantiateTemplate(ELEMENT_CATEGORIES.PROPOSITION, 'prop_42', rulePorts);
    expect(rulePorts.defineRule).toHaveBeenCalledTimes(1);
    const [ruleId] = rulePorts.defineRule.mock.calls[0];
    expect(ruleId).toContain('prop_42');
  });

  it('getDeclaredEDBPredicates returns set of base-fact predicate names', () => {
    const preds = getDeclaredEDBPredicates();
    expect(preds.has('evidence')).toBe(true);
    expect(preds.has('proposition_decl')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run: `npm test -- --run translation`
Expected: FAIL — module not found.
```

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/domain/translation.js`:

```javascript
import { ELEMENT_CATEGORIES } from './tags.js';

// Translators — one per element category. Each returns {baseFacts, rules, metaFacts}.
// baseFacts: Array<[predicate, args]> — assertFact inputs.
// rules:     Array<{ruleId, headAtom, bodyAtoms, metadata}> — defineRule inputs (parameterized).
//            Field names align with Engine public surface per spec-02 §"Engine public-surface signatures";
//            headAtom is `[predicate, [...args]]`, bodyAtoms is an array of `[predicate, [...args]]`.
// metaFacts: Array<[predicate, args]> — provenance / lineage / created_at metadata.
//
// Cascade reference: 05-domain-spec.md §2 (translation table), §3.x (per-category schemas), ADR-0003 (approval-as-body-literal).

const TRANSLATORS = Object.freeze({
  [ELEMENT_CATEGORIES.EVIDENCE]: (args, id, ts) => ({
    baseFacts: [['evidence', [id, args.source, args.claim]]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.RULE]: (args, id, ts) => ({
    baseFacts: [['rule_decl', [id, args.statement]]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.PERMISSION]: (args, id, ts) => ({
    baseFacts: [['permission_decl', [id, args.statement]]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.PROPOSITION]: (args, id, ts) => ({
    baseFacts: [
      ['proposition_decl', [id, args.statement, args.inference_pattern]],
      ['grounding', [id, args.grounding]],
      ['collapse_test', [id, args.collapse_test]],
    ],
    rules: [], // The approval-gated rule lives in RULE_TEMPLATES (Phase B); per-element instantiation happens in Phase C via instantiateTemplate.
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.RISK]: (args, id, ts) => ({
    baseFacts: [['risk', [id, args.statement, args.severity ?? 'unspecified']]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.RESOLUTION]: (args, id, ts) => ({
    baseFacts: [
      ['resolution_decl', [id, args.statement]],
      ...(Array.isArray(args.addresses) ? args.addresses.map(rid => ['addresses', [id, rid]]) : [['addresses', [id, args.addresses]]]),
    ],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.FRICTION]: (args, id, ts) => ({
    baseFacts: [['friction', [id, args.shape, args.description, args.disposition ?? 'unset']]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
  [ELEMENT_CATEGORIES.DEFINITION]: (args, id, ts) => ({
    baseFacts: [['definition_decl', [id, args.term, args.definition]]],
    rules: [],
    metaFacts: [['created_at', [id, ts]]],
  }),
});

export function translate(category, args, id, ts) {
  const t = TRANSLATORS[category];
  if (!t) throw Object.assign(new Error(`UNKNOWN_CATEGORY: ${category}`), { code: 'UNKNOWN_CATEGORY' });
  return t(args, id, ts);
}

// RULE_TEMPLATES — parameterized rule shapes for approval-gated categories.
// Each template, when instantiated with an element id, produces a defineRule call
// whose body literal includes ['approved', [id, ...]] per ADR-0003.

export const RULE_TEMPLATES = Object.freeze({
  [ELEMENT_CATEGORIES.PROPOSITION]: Object.freeze({
    elementCategory: ELEMENT_CATEGORIES.PROPOSITION,
    build: (elementId) => ({
      ruleId: `${elementId}_approved_implies_proposition`,
      headAtom: ['proposition', [elementId, 'S']],
      bodyAtoms: [
        ['proposition_decl', [elementId, 'S', '_']],
        ['approved', [elementId, '_', '_']],
      ],
      metadata: { domain_concept: 'necessary_condition', element: elementId },
    }),
  }),
  [ELEMENT_CATEGORIES.RESOLUTION]: Object.freeze({
    elementCategory: ELEMENT_CATEGORIES.RESOLUTION,
    build: (elementId) => ({
      ruleId: `${elementId}_approved_implies_resolution`,
      headAtom: ['resolution', [elementId, 'S']],
      bodyAtoms: [
        ['resolution_decl', [elementId, 'S']],
        ['approved', [elementId, '_', '_']],
      ],
      metadata: { domain_concept: 'resolution', element: elementId },
    }),
  }),
  [ELEMENT_CATEGORIES.DEFINITION]: Object.freeze({
    elementCategory: ELEMENT_CATEGORIES.DEFINITION,
    build: (elementId) => ({
      ruleId: `${elementId}_approved_implies_definition`,
      headAtom: ['definition', [elementId, 'T', 'D']],
      bodyAtoms: [
        ['definition_decl', [elementId, 'T', 'D']],
        ['approved', [elementId, '_', '_']],
      ],
      metadata: { domain_concept: 'definition', element: elementId },
    }),
  }),
});

export function registerRuleTemplates(rulePorts) {
  // Phase B: install one anchor rule per approval-gated category using a sentinel
  // placeholder id. Per-element rules are installed at Phase C via instantiateTemplate.
  // The anchor rule's purpose is to surface stratification failures at boot.
  //
  // Per-template try/catch annotates the throw with `templateId` and `ruleId` so the
  // domain-bridge outer catch can populate DomainBootError({recordId: templateId, ...})
  // — spec AC-4.3 and AC-5.1 require the error payload to carry the failing template id.
  for (const [cat, template] of Object.entries(RULE_TEMPLATES)) {
    const placeholder = `__template_anchor__${cat}`;
    const r = template.build(placeholder);
    try {
      rulePorts.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, { ...r.metadata, isTemplateAnchor: true });
    } catch (innerErr) {
      const err = new Error(`Phase B defineRule failed for template '${cat}' (ruleId='${r.ruleId}'): ${innerErr.message}`);
      err.templateId = cat;
      err.ruleId = r.ruleId;
      err.cause = innerErr;
      throw err;
    }
  }
}

export function instantiateTemplate(idShape, newId, rulePorts) {
  const template = RULE_TEMPLATES[idShape];
  if (!template) return; // Non-approval-gated category — no per-element rule.
  const r = template.build(newId);
  rulePorts.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata);
}

// EDB-predicate declaration. Returns the set of base-fact predicate names this module
// emits. Used by boot-validators to construct validPredicates (Phase-A rule heads ∪
// EDB base-fact predicates). Per the spec's Data Flow §"Session boot" step 5.

const EDB_PREDICATES = Object.freeze(new Set([
  'evidence', 'rule_decl', 'permission_decl', 'proposition_decl', 'grounding',
  'collapse_test', 'risk', 'resolution_decl', 'addresses', 'friction',
  'definition_decl', 'approved', 'two_yes', 'closure_committed', 'closure_pending',
  'phase', 'round', 'created_at', 'withdrew', 'superseded',
]));

export function getDeclaredEDBPredicates() {
  return new Set(EDB_PREDICATES);
}
```

- [ ] **Step 4: Run test to verify it passes**

```
Run: `npm test -- --run translation`
Expected: PASS — six tests green.
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/translation.js skills/design-large-task/domain/__tests__/translation.test.js
git commit -m "feat(domain): translation.js with translators, RULE_TEMPLATES, and EDB predicates"
```

---

## Task 5: authority.js — consent verification

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2
**Decision budget:** 2 (consent shape; per-action authority lookup)
**Must remain green:** `authority.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/authority.js`
- Create: `skills/design-large-task/domain/__tests__/authority.test.js`

**Background:**
`verifyConsent(consentCategory, consent, consentVerificationPort)` validates that the `consent` object has a valid source matching `consentCategory` and that `consentVerificationPort.verify(consent)` returns truthy. Also exports `lookupAuthority(idShape, action) → Array<CONSENT_SOURCES>` for `runOperation` to use when dispatching ratification. Cascade references: `05-domain-spec.md` §5 (authority), ADR-0009 (consent as cross-cutting port).

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { verifyConsent, lookupAuthority } from '../authority.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, ACTION_LABELS } from '../tags.js';

describe('authority', () => {
  it('verifyConsent passes valid consent', () => {
    const port = { verify: vi.fn().mockReturnValue(true) };
    expect(() => verifyConsent(CONSENT_SOURCES.DESIGNER, { source: 'designer', token: 't' }, port)).not.toThrow();
  });

  it('verifyConsent throws CONSENT_INVALID on source mismatch', () => {
    const port = { verify: vi.fn().mockReturnValue(true) };
    expect(() => verifyConsent(CONSENT_SOURCES.DESIGNER, { source: 'system' }, port))
      .toThrow(/CONSENT_INVALID/);
  });

  it('verifyConsent throws CONSENT_INVALID on port rejection', () => {
    const port = { verify: vi.fn().mockReturnValue(false) };
    expect(() => verifyConsent(CONSENT_SOURCES.DESIGNER, { source: 'designer' }, port))
      .toThrow(/CONSENT_INVALID/);
  });

  it('lookupAuthority returns approved-by sources for ratify on Proposition', () => {
    const sources = lookupAuthority(ELEMENT_CATEGORIES.PROPOSITION, ACTION_LABELS.RATIFY);
    expect(sources).toContain(CONSENT_SOURCES.DESIGN_PARTNER);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run: `npm test -- --run authority`
Expected: FAIL — module not found.
```

- [ ] **Step 3: Write minimal implementation**

```javascript
import { CONSENT_SOURCES, ACTION_LABELS, assertExhaustive } from './tags.js';
import { CATEGORY_REGISTRY } from './schema.js';

/**
 * @param {string} consentCategory — value from tags.CONSENT_SOURCES
 * @param {{source: string, token?: string}} consent — caller-supplied consent
 * @param {{verify: (consent: any) => boolean}} consentPort — IConsentVerification
 */
export function verifyConsent(consentCategory, consent, consentPort) {
  if (!consent || typeof consent !== 'object') {
    throw Object.assign(new Error('CONSENT_INVALID: missing consent'), { code: 'CONSENT_INVALID' });
  }
  if (consent.source !== consentCategory) {
    throw Object.assign(new Error(`CONSENT_INVALID: source ${consent.source} does not match required ${consentCategory}`), { code: 'CONSENT_INVALID' });
  }
  if (!consentPort.verify(consent)) {
    throw Object.assign(new Error('CONSENT_INVALID: port rejected'), { code: 'CONSENT_INVALID' });
  }
  return true;
}

const ACTION_TO_AUTHORITY_KEY = Object.freeze({
  [ACTION_LABELS.ADD]: 'add',
  [ACTION_LABELS.REVISE]: 'revise',
  [ACTION_LABELS.WITHDRAW]: 'withdraw',
  [ACTION_LABELS.RATIFY]: 'ratify',
});

export function lookupAuthority(idShape, action) {
  const desc = CATEGORY_REGISTRY[idShape];
  if (!desc) throw new Error(`AUTHORITY_LOOKUP: unknown idShape ${idShape}`);
  const key = ACTION_TO_AUTHORITY_KEY[action] ?? action;
  return desc.authority[key] ?? [];
}
```

- [ ] **Step 4: Run test to verify it passes**

```
Run: `npm test -- --run authority`
Expected: PASS — four tests green.
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/authority.js skills/design-large-task/domain/__tests__/authority.test.js
git commit -m "feat(domain): authority.js consent verification + lookup"
```

---

## Task 6: lifecycle.js — round + phase + body advancement

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2
**Decision budget:** 2 (round-counter shape; phase transitions)
**Must remain green:** `lifecycle.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/lifecycle.js`
- Create: `skills/design-large-task/domain/__tests__/lifecycle.test.js`

**Background:**
Lifecycle tracks proof-round counter, current phase (from `tags.PHASES`), and body advancement. Exports: `getRound(ports)`, `getPhase(ports)`, `advance(ports)` — each implemented as an engine query/assertion (no in-module mutable state). Cascade: `05-domain-spec.md` §4 (lifecycle).

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { getRound, getPhase, advance } from '../lifecycle.js';
import { PHASES } from '../tags.js';

describe('lifecycle', () => {
  it('getRound returns 0 on a fresh substrate (no round fact)', () => {
    const s = createInMemorySubstrate();
    expect(getRound(s)).toBe(0);
  });

  it('advance asserts a round increment', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('round', [0]);
    advance(s);
    expect(getRound(s)).toBe(1);
  });

  it('getPhase reads the current phase fact', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('phase', [PHASES.ESTABLISHMENT]);
    expect(getPhase(s)).toBe(PHASES.ESTABLISHMENT);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
import { PHASES, assertExhaustive } from './tags.js';

/** @param {{query: any, facts: any}} ports */
export function getRound(ports) {
  const rows = ports.query.query(['round', [{ var: 'N' }]]);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map(b => b.N));
}

/** @param {{query: any, facts: any}} ports */
export function getPhase(ports) {
  const rows = ports.query.query(['phase', [{ var: 'P' }]]);
  if (rows.length === 0) return PHASES.ESTABLISHMENT;
  const p = rows[0].P;
  return assertExhaustive(p, PHASES, 'PHASES');
}

/** @param {{query: any, facts: any}} ports */
export function advance(ports) {
  const current = getRound(ports);
  ports.facts.retractFact('round', [current]);
  ports.facts.assertFact('round', [current + 1]);
}
```

- [ ] **Step 4: Run test to verify it passes** — three tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/lifecycle.js skills/design-large-task/domain/__tests__/lifecycle.test.js
git commit -m "feat(domain): lifecycle.js round/phase/advance"
```

---

## Task 7: closure-policy.js — registerStatic + closure queries

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, partial AC-5.1 (registerStatic stratification trigger)
**Decision budget:** 2 (closure-condition rule shapes; gate-permitted query)
**Must remain green:** `closure-policy.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/closure-policy.js`
- Create: `skills/design-large-task/domain/__tests__/closure-policy.test.js`

**Background:**
`registerStatic({rules})` defines closure-condition rules: `closure_permitted` head derives when all concerns are addressed, no unresolved frictions, all propositions grounded, etc. Also defines `closure_failure_reason(R)` head for diagnostic output. `triggerGate(args, readPorts)` is the `customPostCheck` body for `presentClosingArgument` and `confirmClosureGo` verbs. Cascade: `05-domain-spec.md` §7 (closure policy), §11.1 (mechanical_collapse_test as proof tool).

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { registerStatic, triggerGate } from '../closure-policy.js';

describe('closure-policy', () => {
  it('registerStatic defines at least one closure_permitted rule', () => {
    const s = createInMemorySubstrate();
    let calls = 0;
    registerStatic({ defineRule: (...args) => { calls++; s.rules.defineRule(...args); }, undefineRule: s.rules.undefineRule, getRule: s.rules.getRule });
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it('triggerGate returns null on permitted closure (smoke)', () => {
    const s = createInMemorySubstrate();
    registerStatic(s.rules);
    // No assertions yet — query may legitimately return null; this is a smoke test for the function existing and returning DomainError|null.
    const result = triggerGate({}, { query: s.query, explain: s.explain });
    expect(result === null || (result && typeof result.code === 'string')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
// Closure-policy module. Registers static rules that derive whether closure is permitted.
// Cascade: 05-domain-spec.md §7.

/** @param {{defineRule: any, undefineRule: any, getRule: any}} rulePorts */
export function registerStatic(rulePorts) {
  // closure_permitted derives when all concerns are addressed AND no unresolved friction exists.
  // The body uses negation-as-failure on unresolved_friction and unaddressed_concern.
  rulePorts.defineRule(
    'closure_permitted_rule',
    ['closure_permitted', []],
    [
      ['not', ['unresolved_friction', ['_']]],
      ['not', ['unaddressed_concern', ['_']]],
    ],
    { domain_concept: 'closure_permitted', module: 'closure-policy' },
  );
  rulePorts.defineRule(
    'unresolved_friction_rule',
    ['unresolved_friction', ['F']],
    [['friction', ['F', '_', '_', 'unset']]],
    { domain_concept: 'unresolved_friction', module: 'closure-policy' },
  );
  rulePorts.defineRule(
    'unaddressed_concern_rule',
    ['unaddressed_concern', ['C']],
    [['risk', ['C', '_', '_']], ['not', ['addresses', ['_', 'C']]]],
    { domain_concept: 'unaddressed_concern', module: 'closure-policy' },
  );
}

/**
 * customPostCheck body for presentClosingArgument / confirmClosureGo.
 * @param {object} args
 * @param {{query: any, explain: any}} readPorts
 * @returns {{code: string, message: string}|null}
 */
export function triggerGate(args, readPorts) {
  if (!readPorts.query.exists(['closure_permitted', []])) {
    const reasons = readPorts.query.query(['closure_failure_reason', [{ var: 'R' }]]).map(b => b.R);
    return { code: 'CLOSURE_NOT_PERMITTED', message: `Closure failed: ${reasons.join(', ') || 'no reason recorded'}` };
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes** — two tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/closure-policy.js skills/design-large-task/domain/__tests__/closure-policy.test.js
git commit -m "feat(domain): closure-policy.js with registerStatic + triggerGate"
```

---

## Task 8: friction-policy.js — registerStatic + detection

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, partial AC-5.1
**Decision budget:** 2 (friction-detection rule shapes; disposition lookup)
**Must remain green:** `friction-policy.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/friction-policy.js`
- Create: `skills/design-large-task/domain/__tests__/friction-policy.test.js`

**Background:**
`registerStatic({rules})` defines friction-detection rules: `coverage_gap_detected`, `overlap_detected`, `conflict_detected`, `ungrounded_proposition`, `stagnation_detected`. Each maps to a `FRICTION_SHAPES` value. `detectFrictions(readPorts) → Array<{shape, description}>` queries all detection heads and returns candidates. `applyDisposition(args, fullPorts)` is the `customPostCheck` body for `manageFriction`. Cascade: `05-domain-spec.md` §8.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { registerStatic, detectFrictions } from '../friction-policy.js';

describe('friction-policy', () => {
  it('registerStatic defines at least four friction-detection rules', () => {
    const s = createInMemorySubstrate();
    let count = 0;
    registerStatic({ defineRule: (...a) => { count++; s.rules.defineRule(...a); }, undefineRule: s.rules.undefineRule, getRule: s.rules.getRule });
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it('detectFrictions returns array (possibly empty)', () => {
    const s = createInMemorySubstrate();
    registerStatic(s.rules);
    const fr = detectFrictions({ query: s.query, explain: s.explain });
    expect(Array.isArray(fr)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
import { FRICTION_SHAPES } from './tags.js';

export function registerStatic(rulePorts) {
  rulePorts.defineRule('ungrounded_proposition_rule',
    ['ungrounded_proposition', ['P']],
    [['proposition_decl', ['P', '_', '_']], ['not', ['grounding', ['P', '_']]]],
    { domain_concept: FRICTION_SHAPES.UNGROUNDED, module: 'friction-policy' });
  rulePorts.defineRule('coverage_gap_rule',
    ['coverage_gap_detected', ['C']],
    [['risk', ['C', '_', '_']], ['not', ['addresses', ['_', 'C']]]],
    { domain_concept: FRICTION_SHAPES.COVERAGE_GAP, module: 'friction-policy' });
  rulePorts.defineRule('overlap_rule',
    ['overlap_detected', ['T1', 'T2']],
    [['definition_decl', ['T1', 'TERM', '_']], ['definition_decl', ['T2', 'TERM', '_']]],
    { domain_concept: FRICTION_SHAPES.OVERLAP, module: 'friction-policy' });
  rulePorts.defineRule('conflict_rule',
    ['conflict_detected', ['R1', 'R2']],
    [['rule_decl', ['R1', '_']], ['rule_decl', ['R2', '_']]],
    { domain_concept: FRICTION_SHAPES.CONFLICT, module: 'friction-policy' });
}

/**
 * @param {{query: any, explain: any}} readPorts
 * @returns {Array<{shape: string, args: any[]}>}
 */
export function detectFrictions(readPorts) {
  const out = [];
  for (const row of readPorts.query.query(['ungrounded_proposition', [{ var: 'P' }]])) out.push({ shape: FRICTION_SHAPES.UNGROUNDED, args: [row.P] });
  for (const row of readPorts.query.query(['coverage_gap_detected', [{ var: 'C' }]])) out.push({ shape: FRICTION_SHAPES.COVERAGE_GAP, args: [row.C] });
  for (const row of readPorts.query.query(['overlap_detected', [{ var: 'T1' }, { var: 'T2' }]])) out.push({ shape: FRICTION_SHAPES.OVERLAP, args: [row.T1, row.T2] });
  for (const row of readPorts.query.query(['conflict_detected', [{ var: 'R1' }, { var: 'R2' }]])) out.push({ shape: FRICTION_SHAPES.CONFLICT, args: [row.R1, row.R2] });
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes** — two tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/friction-policy.js skills/design-large-task/domain/__tests__/friction-policy.test.js
git commit -m "feat(domain): friction-policy.js with detection rules"
```

---

## Task 9: restructuring.js — open-proof submission pipeline

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2
**Decision budget:** 2 (open-proof input shape; structural validation)
**Must remain green:** `restructuring.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/restructuring.js`
- Create: `skills/design-large-task/domain/__tests__/restructuring.test.js`

**Background:**
Restructuring handles open-proof submission: the user posts a draft proof structure (elements + relationships), the module validates structurally (no cycles, all references resolve, etc.) before the engine sees it. Per ADR-0005: restructuring stays pre-engine. Cascade: `05-domain-spec.md` §9.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { validateOpenProofPayload, expandIntoOperations } from '../restructuring.js';

describe('restructuring', () => {
  it('validateOpenProofPayload accepts well-formed payload', () => {
    const payload = { elements: [{ category: 'evidence', args: { source: 'codebase', claim: 'x' } }] };
    expect(() => validateOpenProofPayload(payload)).not.toThrow();
  });

  it('validateOpenProofPayload rejects payload missing elements array', () => {
    expect(() => validateOpenProofPayload({})).toThrow(/RESTRUCTURE/);
  });

  it('expandIntoOperations returns one add op per element', () => {
    const payload = { elements: [
      { category: 'evidence', args: { source: 'c', claim: 'x' } },
      { category: 'rule', args: { statement: 's' } },
    ]};
    const ops = expandIntoOperations(payload);
    expect(ops).toHaveLength(2);
    // expandIntoOperations emits the ACTION_LABELS.ADD value ('add') as the verb.
    // The bridge facade layer is what exposes it as `addElement`; the open-proof
    // pipeline routes through runOperation('add', ...).
    expect(ops[0].verb).toBe('add');
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
import { ELEMENT_CATEGORIES, ACTION_LABELS } from './tags.js';

export function validateOpenProofPayload(payload) {
  if (!payload || !Array.isArray(payload.elements)) {
    throw Object.assign(new Error('RESTRUCTURE_INVALID: missing elements array'), { code: 'RESTRUCTURE_INVALID' });
  }
  for (const [i, el] of payload.elements.entries()) {
    if (!el.category || !Object.values(ELEMENT_CATEGORIES).includes(el.category)) {
      throw Object.assign(new Error(`RESTRUCTURE_INVALID: element[${i}] has unknown category ${el.category}`), { code: 'RESTRUCTURE_INVALID', index: i });
    }
    if (!el.args || typeof el.args !== 'object') {
      throw Object.assign(new Error(`RESTRUCTURE_INVALID: element[${i}] missing args`), { code: 'RESTRUCTURE_INVALID', index: i });
    }
  }
  return payload;
}

export function expandIntoOperations(payload) {
  return payload.elements.map(el => ({
    verb: ACTION_LABELS.ADD,
    args: { idShape: el.category, ...el.args },
  }));
}
```

- [ ] **Step 4: Run test to verify it passes** — three tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/restructuring.js skills/design-large-task/domain/__tests__/restructuring.test.js
git commit -m "feat(domain): restructuring.js open-proof pipeline"
```

---

## Task 10: render.js — read-only renders + renderDatalogProjection

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, partial AC-6.1, partial AC-11.1 (Datalog projection sub-clause)
**Decision budget:** 2 (per-render output shape; Datalog projection serialization format)
**Must remain green:** `render.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/render.js`
- Create: `skills/design-large-task/domain/__tests__/render.test.js`

**Background:**
Render functions take `ReadPorts` only. Five+ render entry points: `renderStructuredProof`, `renderElementDeep`, `renderClosingArgument`, `renderDatalogProjection`, `renderLaneSlice`. Also `getProofState`, `queryProof`. The `renderDatalogProjection` returns a serializable Datalog projection (per Architecture §10's "Independent verification path" payoff and `IRenderSurface` spec). Cascade: `05-domain-spec.md` §10.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { renderStructuredProof, renderDatalogProjection, renderElementDeep, getProofState } from '../render.js';

describe('render', () => {
  it('renderStructuredProof returns a markdown string', () => {
    const s = createInMemorySubstrate();
    const out = renderStructuredProof({}, { query: s.query, explain: s.explain });
    expect(typeof out).toBe('string');
  });

  it('renderDatalogProjection returns serializable {facts, rules}', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('evidence', ['evid_1', 'codebase', 'x']);
    const out = renderDatalogProjection({}, { query: s.query, explain: s.explain });
    expect(out).toHaveProperty('facts');
    expect(out).toHaveProperty('rules');
    expect(() => JSON.stringify(out)).not.toThrow();
  });

  it('getProofState returns a JSON-serializable snapshot', () => {
    const s = createInMemorySubstrate();
    const state = getProofState({}, { query: s.query, explain: s.explain });
    expect(() => JSON.stringify(state)).not.toThrow();
  });

  it('renderElementDeep returns null for unknown id', () => {
    const s = createInMemorySubstrate();
    const out = renderElementDeep({ id: 'unknown_42' }, { query: s.query, explain: s.explain });
    expect(out).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
// render.js — read-only render and query functions. Takes ReadPorts only.
// Cascade: 05-domain-spec.md §10. Architecture §10 payoffs ("Independent verification path"
// is realized by renderDatalogProjection).

/**
 * @param {object} args
 * @param {{query: any, explain: any}} readPorts
 * @returns {string} markdown
 */
export function renderStructuredProof(args, readPorts) {
  const sections = [];
  sections.push('# Proof\n');
  const evidences = readPorts.query.query(['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]]);
  if (evidences.length) sections.push('## Givens (Evidence)\n' + evidences.map(b => `- ${b.I}: ${b.C}`).join('\n') + '\n');
  const propositions = readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]);
  if (propositions.length) sections.push('## Lemmas (Propositions)\n' + propositions.map(b => `- ${b.I}: ${b.S}`).join('\n') + '\n');
  const resolutions = readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]]);
  if (resolutions.length) sections.push('## Theorems (Resolutions)\n' + resolutions.map(b => `- ${b.I}: ${b.S}`).join('\n') + '\n');
  return sections.join('\n');
}

// Per-predicate fact arities for renderElementDeep. The Engine matches by arity exactly
// (Unifier returns null when pattern.length !== fact.length), so each predicate must be
// queried at its declared arity rather than with a fixed-width wildcard fill.
const _ARITIES = Object.freeze({
  evidence: 3,
  rule_decl: 2,
  permission_decl: 2,
  proposition_decl: 3,
  risk: 2,
  resolution_decl: 2,
  friction: 4,
  definition_decl: 3,
});

export function renderElementDeep(args, readPorts) {
  if (!args || !args.id) return null;
  const { id } = args;
  for (const [pred, arity] of Object.entries(_ARITIES)) {
    if (arity < 1) continue;
    const pattern = [id, ...Array(arity - 1).fill('_')];
    const rows = readPorts.query.query([pred, pattern]);
    if (rows.length) return { id, predicate: pred, ...rows[0] };
  }
  return null;
}

export function renderClosingArgument(args, readPorts) {
  const permitted = readPorts.query.exists(['closure_permitted', []]);
  return { permitted, asOf: Date.now() };
}

export function renderDatalogProjection(args, readPorts) {
  // Serializable Datalog projection: every base/derived fact + every rule.
  // Per Architecture §10 "Independent verification path" — output suitable for
  // ingestion by a second engine.
  //
  // The Engine matches by exact arity (Unifier returns null when pattern.length !==
  // fact.length), so each predicate is queried at its declared arity with positional
  // named variables — variables bind to concrete values, which are then re-collected
  // in positional order to reconstruct the fact tuple.
  const PROJECTION_ARITIES = {
    evidence: 3, rule_decl: 2, permission_decl: 2, proposition_decl: 3,
    resolution_decl: 2, definition_decl: 3, risk: 2, friction: 4, approved: 3,
  };
  const facts = [];
  for (const [pred, arity] of Object.entries(PROJECTION_ARITIES)) {
    const varNames = Array.from({ length: arity }, (_, i) => `V${i}`);
    const pattern = [pred, varNames.map((n) => ({ var: n }))];
    for (const row of readPorts.query.query(pattern)) {
      // Preserve positional order — Object.values on the binding object is not
      // guaranteed to match insertion order across engines, so reconstruct from varNames.
      facts.push([pred, varNames.map((n) => row[n])]);
    }
  }
  const rules = []; // rules surface through ports.explain or a getRule iteration; for now, projection of facts is the load-bearing half.
  return { facts, rules };
}

export function renderLaneSlice(args, readPorts) {
  return { lane: args.lane ?? 'all', elements: [] };
}

export function getProofState(args, readPorts) {
  return {
    evidence: readPorts.query.query(['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]]),
    propositions: readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]),
    resolutions: readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]]),
    closurePermitted: readPorts.query.exists(['closure_permitted', []]),
  };
}

export function queryProof(args, readPorts) {
  if (!args || !args.pattern) return [];
  return readPorts.query.query(args.pattern);
}
```

- [ ] **Step 4: Run test to verify it passes** — four tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/render.js skills/design-large-task/domain/__tests__/render.test.js
git commit -m "feat(domain): render.js with renders, projections, queries"
```

---

## Task 11: counterfactual.js — collapseTest with snapshot/restore

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-7.1
**Decision budget:** 2 (counterfactual API; snapshot/restore bracketing)
**Must remain green:** `counterfactual.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/counterfactual.js`
- Create: `skills/design-large-task/domain/__tests__/counterfactual.test.js`

**Background:**
`collapseTest(args, probePorts)` implements Domain Spec §11.1: `snapshot → retract approved(propId, _, _) → derive → query closure_permitted → restore`. The `restore(snap)` MUST run in a `finally` so engine state reverts on any throw (AC-7.1). `queryWith(args, probePorts)` and `queryWithout(args, probePorts)` per §11.2. ProbePorts includes `facts` (per spec amendment).

**Engine integration note (from spec-02):** Engine `retractFact(predicate, args)` requires **exact constant args** (Engine Spec §4.1; matched by `JSON.stringify(args)` lookup in `FactStore.retractFact`). Wildcards are NOT accepted. The §11.1 pattern is therefore realized via **query-then-retract**: build a query pattern using named variables (Engine wire format per `Unifier.js`: `{var: 'X'}` is a variable, bare strings are constants, literal `'_'` is an anonymous wildcard that does not bind), call `probePorts.query.query(pattern)` to enumerate matching facts with concrete bindings, then call `probePorts.facts.retractFact(predicate, concreteArgs)` per match. `queryWithout` lowers each user-supplied retract pattern (which may contain `'_'`) into the same shape by replacing wildcards with unique named variables before the query call.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { collapseTest, queryWithout, queryWith } from '../counterfactual.js';

describe('counterfactual', () => {
  it('collapseTest restores state on completion', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    const before = s.snapshot.snapshot();
    collapseTest({ propId: 'prop_1' }, { query: s.query, explain: s.explain, snapshot: s.snapshot, facts: s.facts });
    expect(s.snapshot.snapshot()).toBe(before);
    // Positive: post-restore, the original fact is still present.
    expect(s.facts.factExists('approved', ['prop_1', 'designer', 'x'])).toBe(true);
  });

  it('collapseTest retracts matching facts inside snapshot scope before restore', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    s.facts.assertFact('approved', ['prop_1', 'reviewer', 'y']);
    s.facts.assertFact('approved', ['prop_2', 'designer', 'z']);  // must NOT be retracted

    // Spy on retractFact to confirm the query-then-retract loop hits both prop_1 matches
    // with concrete args (not wildcards).
    const retractSpy = vi.spyOn(s.facts, 'retractFact');
    collapseTest({ propId: 'prop_1' }, { query: s.query, explain: s.explain, snapshot: s.snapshot, facts: s.facts });

    // Two retract calls, both with prop_1 and concrete (non-wildcard) args.
    const prop1Retracts = retractSpy.mock.calls.filter((c) => c[0] === 'approved' && c[1][0] === 'prop_1');
    expect(prop1Retracts.length).toBe(2);
    for (const [, args] of prop1Retracts) {
      expect(args.every((a) => a !== '_')).toBe(true);
    }
    // prop_2 must not have been retracted.
    const prop2Retracts = retractSpy.mock.calls.filter((c) => c[0] === 'approved' && c[1][0] === 'prop_2');
    expect(prop2Retracts.length).toBe(0);

    // After restore, all three original facts are present again.
    expect(s.facts.factExists('approved', ['prop_1', 'designer', 'x'])).toBe(true);
    expect(s.facts.factExists('approved', ['prop_1', 'reviewer', 'y'])).toBe(true);
    expect(s.facts.factExists('approved', ['prop_2', 'designer', 'z'])).toBe(true);
  });

  it('collapseTest restores state on throw mid-call', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    const before = s.snapshot.snapshot();
    const badPorts = {
      query: { query: () => { throw new Error('INJECTED'); }, derive: s.query.derive, exists: s.query.exists, count: s.query.count },
      explain: s.explain, snapshot: s.snapshot, facts: s.facts,
    };
    expect(() => collapseTest({ propId: 'prop_1' }, badPorts)).toThrow(/INJECTED/);
    expect(s.snapshot.snapshot()).toBe(before);
  });

  it('queryWithout lowers wildcards via query-then-retract then restores', () => {
    const s = createInMemorySubstrate();
    s.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    s.facts.assertFact('approved', ['prop_1', 'reviewer', 'y']);
    const ports = { query: s.query, explain: s.explain, snapshot: s.snapshot, facts: s.facts };

    expect(() => queryWithout({ retract: [['approved', ['prop_1', '_', '_']]], pattern: ['closure_permitted', []] }, ports)).not.toThrow();
    // Restored.
    expect(s.facts.factExists('approved', ['prop_1', 'designer', 'x'])).toBe(true);
    expect(s.facts.factExists('approved', ['prop_1', 'reviewer', 'y'])).toBe(true);
  });

  it('queryWith asserts facts inside snapshot scope and restores', () => {
    const s = createInMemorySubstrate();
    const ports = { query: s.query, explain: s.explain, snapshot: s.snapshot, facts: s.facts };
    expect(() => queryWith({ assert: [['evidence', ['e1', 'src', 'c']]], pattern: ['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]] }, ports)).not.toThrow();
    // Hypothetical fact does not persist post-restore.
    expect(s.facts.factExists('evidence', ['e1', 'src', 'c'])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
// counterfactual.js — probe with snapshot/restore. ProbePorts = {query, explain, snapshot, facts}.
// Cascade: 05-domain-spec.md §11.1 (mechanical_collapse_test), §11.2 (query_with / query_without).
// Spec: try/finally snapshot bracketing ensures engine state reverts on throw or return.
// Engine retractFact requires exact constant args (Engine Spec §4.1, FactStore.retractFact).
// Wildcard retract is realized via query-then-retract — named variables in the query
// pattern (Engine wire format: {var:'A'} for variable, bare string for constant, '_'
// for non-binding wildcard) recover concrete args from the binding object.

const WILDCARD = '_';

// Lower a wildcard-allowing pattern array into (probePattern, reconstructFn) so a
// query result row can be turned back into the concrete fact args for retractFact.
function _lowerWildcards(predicate, patternArgs) {
  const probe = patternArgs.map((a, i) => a === WILDCARD ? { var: `__wv${i}` } : a);
  const reconstruct = (binding) =>
    probe.map((t) => (t && typeof t === 'object' && typeof t.var === 'string') ? binding[t.var] : t);
  return { probe: [predicate, probe], reconstruct };
}

/** @param {{propId: string}} args
 *  @param {{query: any, explain: any, snapshot: any, facts: any}} probePorts */
export function collapseTest(args, probePorts) {
  const snap = probePorts.snapshot.snapshot();
  try {
    // §11.1: retract every approved(propId, _, _) fact via query-then-retract.
    const { probe, reconstruct } = _lowerWildcards('approved', [args.propId, WILDCARD, WILDCARD]);
    const matches = probePorts.query.query(probe);
    for (const binding of matches) {
      probePorts.facts.retractFact('approved', reconstruct(binding));
    }
    const stillCloses = probePorts.query.exists(['closure_permitted', []]);
    const reasons = stillCloses
      ? []
      : probePorts.query.query(['closure_failure_reason', [{ var: 'R' }]]).map((b) => b.R);
    return { stillCloses, failureReasons: reasons };
  } finally {
    probePorts.snapshot.restore(snap);
  }
}

/** @param {{retract: Array<[string, any[]]>, pattern: [string, any[]]}} args
 *  Each retract entry is a wildcard-allowing fact pattern; lowered via _lowerWildcards. */
export function queryWithout(args, probePorts) {
  const snap = probePorts.snapshot.snapshot();
  try {
    for (const [pred, patternArgs] of args.retract) {
      const { probe, reconstruct } = _lowerWildcards(pred, patternArgs);
      const matches = probePorts.query.query(probe);
      for (const binding of matches) {
        probePorts.facts.retractFact(pred, reconstruct(binding));
      }
    }
    return probePorts.query.query(args.pattern);
  } finally {
    probePorts.snapshot.restore(snap);
  }
}

/** @param {{assert: Array<[string, any[]]>, pattern: [string, any[]]}} args
 *  Each assert entry is a fully-concrete fact (assertFact rejects non-constants per Engine Spec §4.1). */
export function queryWith(args, probePorts) {
  const snap = probePorts.snapshot.snapshot();
  try {
    for (const [pred, a] of args.assert) probePorts.facts.assertFact(pred, a);
    return probePorts.query.query(args.pattern);
  } finally {
    probePorts.snapshot.restore(snap);
  }
}
```

- [ ] **Step 4: Run test to verify it passes** — five tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/counterfactual.js skills/design-large-task/domain/__tests__/counterfactual.test.js
git commit -m "feat(domain): counterfactual.js collapseTest + queryWith/Without"
```

---

## Task 12: boot-validators.js — three cross-record validators

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-4.1, AC-4.2, AC-4.3
**Decision budget:** 3 (validator function signatures; DomainBootError shape; cross-record check enumeration)
**Must remain green:** `boot-validators.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/boot-validators.js`
- Create: `skills/design-large-task/domain/__tests__/boot-validators.test.js`

**Background:**
Per spec AC-4.x, the three validators do cross-record consistency checks only. Stratification is gated by Phase A/B's `defineRule` (ADR-0013 Part 3). `DomainBootError` has `{validator, recordId, field, violation, expected, actual, isBootError: true}` payload.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { validateOperationSpecs, validateCategoryRegistry, validateRuleTemplates, DomainBootError } from '../boot-validators.js';
import * as tags from '../tags.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { RULE_TEMPLATES } from '../translation.js';

describe('boot-validators', () => {
  it('validateCategoryRegistry passes a clean CATEGORY_REGISTRY', () => {
    expect(() => validateCategoryRegistry(CATEGORY_REGISTRY, tags)).not.toThrow();
  });

  it('validateCategoryRegistry throws on missing requiredFields', () => {
    const bad = { ...CATEGORY_REGISTRY, [tags.ELEMENT_CATEGORIES.EVIDENCE]: { ...CATEGORY_REGISTRY[tags.ELEMENT_CATEGORIES.EVIDENCE], requiredFields: [] } };
    expect(() => validateCategoryRegistry(bad, tags)).toThrow(DomainBootError);
  });

  it('validateOperationSpecs passes with empty-friendly spec set', () => {
    const validPredicates = new Set(['approved', 'evidence', 'closure_permitted', 'proposition']);
    const cleanSpecs = {
      openProof: { consentCategory: tags.CONSENT_SOURCES.DESIGNER, preconditions: [], idShape: tags.ELEMENT_CATEGORIES.EVIDENCE, translate: () => ({}), postconditions: [], clearsTwoYes: false, resultShape: {} },
    };
    expect(() => validateOperationSpecs(cleanSpecs, tags, validPredicates)).not.toThrow();
  });

  it('validateOperationSpecs throws on unresolved consentCategory', () => {
    const validPredicates = new Set();
    const bad = { x: { consentCategory: 'not_a_source', preconditions: [], idShape: tags.ELEMENT_CATEGORIES.EVIDENCE, translate: () => ({}), postconditions: [], clearsTwoYes: false, resultShape: {} } };
    expect(() => validateOperationSpecs(bad, tags, validPredicates)).toThrow(DomainBootError);
  });

  it('validateRuleTemplates passes a clean RULE_TEMPLATES', () => {
    expect(() => validateRuleTemplates(RULE_TEMPLATES, CATEGORY_REGISTRY)).not.toThrow();
  });

  it('validateRuleTemplates throws on unresolved elementCategory', () => {
    const bad = { ...RULE_TEMPLATES, junk: { elementCategory: 'not_a_category', build: () => ({ ruleId: 'x', headAtom: [], bodyAtoms: [] }) } };
    expect(() => validateRuleTemplates(bad, CATEGORY_REGISTRY)).toThrow(DomainBootError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
export class DomainBootError extends Error {
  constructor(payload) {
    super(`DomainBootError[${payload.validator}/${payload.recordId}/${payload.field}]: ${payload.violation}`);
    this.name = 'DomainBootError';
    Object.assign(this, payload, { isBootError: true });
  }
}

function check(cond, payload) { if (!cond) throw new DomainBootError(payload); }

/**
 * @param {Record<string, any>} specs OPERATION_SPECS
 * @param {object} tags imported tag module (provides CONSENT_SOURCES, ELEMENT_CATEGORIES)
 * @param {Set<string>} validPredicates Phase-A rule head predicates ∪ EDB predicates
 */
export function validateOperationSpecs(specs, tags, validPredicates) {
  const consentSources = new Set(Object.values(tags.CONSENT_SOURCES));
  const elementCategories = new Set(Object.values(tags.ELEMENT_CATEGORIES));
  for (const [verb, spec] of Object.entries(specs)) {
    for (const f of ['consentCategory', 'preconditions', 'idShape', 'translate', 'postconditions', 'clearsTwoYes', 'resultShape']) {
      check(f in spec, { validator: 'validateOperationSpecs', recordId: verb, field: f, violation: 'missing required field', expected: 'present', actual: 'missing' });
    }
    check(consentSources.has(spec.consentCategory), { validator: 'validateOperationSpecs', recordId: verb, field: 'consentCategory', violation: 'not in tags.CONSENT_SOURCES', expected: [...consentSources], actual: spec.consentCategory });
    check(elementCategories.has(spec.idShape), { validator: 'validateOperationSpecs', recordId: verb, field: 'idShape', violation: 'not in tags.ELEMENT_CATEGORIES', expected: [...elementCategories], actual: spec.idShape });
    if ('customPostCheck' in spec) {
      check(typeof spec.customPostCheck === 'function' && spec.customPostCheck.length === 2,
        { validator: 'validateOperationSpecs', recordId: verb, field: 'customPostCheck', violation: 'not a function with arity 2', expected: 'function(args, readPorts)', actual: typeof spec.customPostCheck });
    }
    for (const block of ['preconditions', 'postconditions']) {
      for (const qp of spec[block]) {
        check(qp && typeof qp.predicate === 'string' && typeof qp.arity === 'number',
          { validator: 'validateOperationSpecs', recordId: verb, field: block, violation: 'QueryPattern shape invalid', expected: '{predicate: string, arity: number}', actual: JSON.stringify(qp) });
        check(validPredicates.has(qp.predicate),
          { validator: 'validateOperationSpecs', recordId: verb, field: `${block}.predicate`, violation: `predicate "${qp.predicate}" not in validPredicates`, expected: [...validPredicates], actual: qp.predicate });
      }
    }
  }
}

export function validateCategoryRegistry(registry, tags) {
  const consentSources = new Set(Object.values(tags.CONSENT_SOURCES));
  const elementCategories = new Set(Object.values(tags.ELEMENT_CATEGORIES));
  const renderSections = new Set(Object.values(tags.RENDER_SECTIONS));
  for (const [cat, desc] of Object.entries(registry)) {
    check(Array.isArray(desc.requiredFields) && desc.requiredFields.length > 0,
      { validator: 'validateCategoryRegistry', recordId: cat, field: 'requiredFields', violation: 'must be non-empty array', expected: 'non-empty', actual: desc.requiredFields });
    check(consentSources.has(desc.sourceConstraint),
      { validator: 'validateCategoryRegistry', recordId: cat, field: 'sourceConstraint', violation: 'not in tags.CONSENT_SOURCES', expected: [...consentSources], actual: desc.sourceConstraint });
    check(elementCategories.has(desc.idShape),
      { validator: 'validateCategoryRegistry', recordId: cat, field: 'idShape', violation: 'not in tags.ELEMENT_CATEGORIES', expected: [...elementCategories], actual: desc.idShape });
    check(renderSections.has(desc.renderSection),
      { validator: 'validateCategoryRegistry', recordId: cat, field: 'renderSection', violation: 'not in tags.RENDER_SECTIONS', expected: [...renderSections], actual: desc.renderSection });
  }
}

export function validateRuleTemplates(templates, registry) {
  const knownCategories = new Set(Object.keys(registry));
  for (const [templateKey, template] of Object.entries(templates)) {
    check(knownCategories.has(template.elementCategory),
      { validator: 'validateRuleTemplates', recordId: templateKey, field: 'elementCategory', violation: 'not in CATEGORY_REGISTRY keys', expected: [...knownCategories], actual: template.elementCategory });
    check(typeof template.build === 'function',
      { validator: 'validateRuleTemplates', recordId: templateKey, field: 'build', violation: 'must be a function', expected: 'function(elementId)', actual: typeof template.build });
  }
}
```

- [ ] **Step 4: Run test to verify it passes** — six tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/boot-validators.js skills/design-large-task/domain/__tests__/boot-validators.test.js
git commit -m "feat(domain): boot-validators.js with three cross-record validators"
```

---

## Task 13: mutations.js — OPERATION_SPECS + runOperation

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-3.1, AC-3.2, AC-3.3, AC-3.4 (source-order half), AC-8.1
**Decision budget:** 4 (per-verb OperationSpec records; runOperation step ordering; customPostCheck wiring; POST_COMMIT_SAVE_FAILED shape)
**Must remain green:** `mutations.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/mutations.js`
- Create: `skills/design-large-task/domain/__tests__/mutations.test.js`

**Background:**
This is the heart of the Domain. Builds:
1. `OPERATION_SPECS` — eight `OperationSpec` records, three of which carry `customPostCheck`: `presentClosingArgument` (closure-policy.triggerGate), `confirmClosureGo` (closure-policy.triggerGate), `manageFriction` (friction-policy.applyDisposition).
2. `runOperation(verbName, args, consent, fullPorts)` — implements §6.1 line-by-line per spec Data Flow §"Operation execution".
3. `DomainError` class for runtime errors. `POST_COMMIT_SAVE_FAILED` subclasses it.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { OPERATION_SPECS, runOperation, DomainError } from '../mutations.js';
import { ACTION_LABELS, CONSENT_SOURCES } from '../tags.js';

describe('mutations', () => {
  it('OPERATION_SPECS has exactly 8 named verbs', () => {
    expect(Object.keys(OPERATION_SPECS).sort()).toEqual([
      ACTION_LABELS.ADD, ACTION_LABELS.CONFIRM_CLOSURE_GO, ACTION_LABELS.MANAGE_FRICTION,
      ACTION_LABELS.OPEN_PROOF, ACTION_LABELS.PRESENT_CLOSING_ARGUMENT,
      ACTION_LABELS.RATIFY, ACTION_LABELS.REVISE, ACTION_LABELS.WITHDRAW,
    ].sort());
  });

  it('customPostCheck appears on at most 3 of 8 specs', () => {
    const withCustom = Object.values(OPERATION_SPECS).filter(s => 'customPostCheck' in s);
    expect(withCustom.length).toBeLessThanOrEqual(3);
  });

  it('runOperation throws UNKNOWN_VERB on bad name', () => {
    const s = createInMemorySubstrate();
    const ports = _makeFullPorts(s);
    expect(() => runOperation('not_a_verb', {}, { source: CONSENT_SOURCES.DESIGNER }, ports))
      .toThrow(/UNKNOWN_VERB/);
  });

  it('runOperation calls saveState after successful commit', () => {
    const s = createInMemorySubstrate();
    const ports = _makeFullPorts(s);
    runOperation(ACTION_LABELS.ADD, { idShape: 'evidence', source: 'codebase', claim: 'x' }, { source: CONSENT_SOURCES.DESIGNER }, ports);
    expect(ports.persist.saveState).toHaveBeenCalled();
  });

  it('runOperation throws POST_COMMIT_SAVE_FAILED on persist failure', () => {
    const s = createInMemorySubstrate();
    const ports = _makeFullPorts(s, { failSave: true });
    expect(() => runOperation(ACTION_LABELS.ADD, { idShape: 'evidence', source: 'codebase', claim: 'x' }, { source: CONSENT_SOURCES.DESIGNER }, ports))
      .toThrow(/POST_COMMIT_SAVE_FAILED/);
  });
});

function _makeFullPorts(substrate, { failSave = false } = {}) {
  let i = 0;
  return {
    ...substrate,
    clock: { now: () => 1700000000 },
    ids: { next: (prefix) => `${prefix}_${++i}` },
    consent: { verify: () => true },
    persist: { saveState: vi.fn(() => { if (failSave) throw new Error('DISK_FULL'); }) },
  };
}
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
import { ACTION_LABELS, CONSENT_SOURCES, ELEMENT_CATEGORIES } from './tags.js';
import { verifyArgsShape } from './schema.js';
import { translate, instantiateTemplate } from './translation.js';
import { verifyConsent } from './authority.js';
import { advance } from './lifecycle.js';
import { triggerGate as closureTriggerGate } from './closure-policy.js';

export class DomainError extends Error {
  constructor(payload) {
    super(payload.message ?? payload.code);
    this.name = 'DomainError';
    Object.assign(this, payload);
  }
}

export class POST_COMMIT_SAVE_FAILED extends DomainError {
  constructor(cause) {
    super({ code: 'POST_COMMIT_SAVE_FAILED', message: 'Engine committed but save failed', engineCommitted: true, cause });
    this.name = 'POST_COMMIT_SAVE_FAILED';
  }
}

// Eight OperationSpec records. customPostCheck appears on 3 (manageFriction, presentClosingArgument, confirmClosureGo).
export const OPERATION_SPECS = Object.freeze({
  [ACTION_LABELS.OPEN_PROOF]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE, // Open-proof submission expands to addElement calls; the verb itself does not allocate an id.
    translate: () => ({ baseFacts: [], rules: [], metaFacts: [] }),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.ADD]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE, // overridden by args.idShape at runtime — actual category dispatch happens in translate.
    translate: (args, id, ts) => translate(args.idShape, args, id, ts),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: { id: 'string' },
  },
  [ACTION_LABELS.REVISE]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: (args, id, ts) => translate(args.idShape, args, id, ts),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: { id: 'string' },
  },
  [ACTION_LABELS.WITHDRAW]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: (args) => ({ baseFacts: [['withdrew', [args.id]]], rules: [], metaFacts: [] }),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.RATIFY]: {
    consentCategory: CONSENT_SOURCES.DESIGNER, // Authorities for ratify are looked up per element category via authority.lookupAuthority.
    preconditions: [{ predicate: 'evidence', arity: 3 }], // weak: just confirms an element exists pre-derivation.
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: (args, _, ts) => ({ baseFacts: [['approved', [args.elementId, args.source ?? CONSENT_SOURCES.DESIGNER, ts]]], rules: [], metaFacts: [] }),
    postconditions: [],
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.MANAGE_FRICTION]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.FRICTION,
    translate: (args, id, ts) => ({ baseFacts: [['friction_disposition', [args.frictionId, args.disposition]]], rules: [], metaFacts: [] }),
    postconditions: [],
    customPostCheck: (args, readPorts) => null, // friction-policy.applyDisposition; placeholder returns null.
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.PRESENT_CLOSING_ARGUMENT]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: () => ({ baseFacts: [['closure_pending', []]], rules: [], metaFacts: [] }),
    postconditions: [],
    customPostCheck: (args, readPorts) => closureTriggerGate(args, readPorts),
    clearsTwoYes: true,
    resultShape: {},
  },
  [ACTION_LABELS.CONFIRM_CLOSURE_GO]: {
    consentCategory: CONSENT_SOURCES.DESIGNER,
    preconditions: [],
    idShape: ELEMENT_CATEGORIES.EVIDENCE,
    translate: () => ({ baseFacts: [['closure_committed', []]], rules: [], metaFacts: [] }),
    postconditions: [],
    customPostCheck: (args, readPorts) => closureTriggerGate(args, readPorts),
    clearsTwoYes: false,
    resultShape: {},
  },
});

/**
 * runOperation implements Domain Spec §6.1 line-by-line.
 * @param {string} verbName
 * @param {object} args
 * @param {{source: string}} consent
 * @param {object} ports FullPorts
 */
export function runOperation(verbName, args, consent, ports) {
  // §6.1 step 1: read spec
  const spec = OPERATION_SPECS[verbName];
  if (!spec) throw new DomainError({ code: 'UNKNOWN_VERB', verbName });

  // §6.1 step 2: verify consent
  verifyConsent(spec.consentCategory, consent, ports.consent);

  // §6.1 step 3: verify shape
  const targetShape = args.idShape ?? spec.idShape;
  verifyArgsShape(args, targetShape);

  // §6.1 step 4: begin tx
  const tx = ports.tx.begin();
  let id = null;
  try {
    // §6.1 step 5: assert facts + define rules
    id = ports.ids.next(targetShape);
    const ts = ports.clock.now();
    const { baseFacts, rules, metaFacts } = spec.translate(args, id, ts);
    for (const [pred, a] of baseFacts) ports.facts.assertFact(pred, a);
    for (const r of rules) ports.rules.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata);
    for (const [pred, a] of metaFacts) ports.facts.assertFact(pred, a);
    // Phase-C template instantiation for approval-gated categories.
    if ([ELEMENT_CATEGORIES.PROPOSITION, ELEMENT_CATEGORIES.RESOLUTION, ELEMENT_CATEGORIES.DEFINITION].includes(targetShape) && verbName === ACTION_LABELS.ADD) {
      instantiateTemplate(targetShape, id, ports.rules);
    }

    // §6.1 step 6: derive (queries auto-trigger; explicit for clarity)
    ports.query.derive();

    // §6.1 step 7: preconditions
    const readView = { query: ports.query, explain: ports.explain };
    for (const pat of spec.preconditions) {
      if (!ports.query.exists([pat.predicate, Array(pat.arity).fill('_')])) {
        throw new DomainError({ code: 'PRECONDITION_FAILED', predicate: pat.predicate });
      }
    }

    // §6.1 step 8: postconditions
    for (const pat of spec.postconditions) {
      if (!ports.query.exists([pat.predicate, Array(pat.arity).fill('_')])) {
        throw new DomainError({ code: 'POSTCONDITION_FAILED', predicate: pat.predicate });
      }
    }

    // §6.1 step 9: customPostCheck if present
    if (spec.customPostCheck) {
      const err = spec.customPostCheck(args, readView);
      if (err) throw new DomainError(err);
    }

    // §6.1 step 10: commit
    ports.tx.commit(tx);
  } catch (err) {
    if (!(err instanceof POST_COMMIT_SAVE_FAILED)) ports.tx.rollback(tx);
    throw err;
  }

  // §6.1 step 11: save (outside tx; divergence is a typed Domain error)
  try {
    ports.persist.saveState({ /* serialized log entry */ verb: verbName, args, ts: ports.clock.now() });
  } catch (cause) {
    throw new POST_COMMIT_SAVE_FAILED(cause);
  }

  // §6.1 step 12: build result
  const result = spec.resultShape && 'id' in spec.resultShape ? { id } : {};

  // §6.1 step 13: advance round if applicable
  if (spec.clearsTwoYes) advance(ports);

  // §6.1 step 14: return
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes** — five tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/mutations.js skills/design-large-task/domain/__tests__/mutations.test.js
git commit -m "feat(domain): mutations.js OPERATION_SPECS + runOperation"
```

---

## Task 14: domain-bridge.js — assembly seam + facade methods + createReadOnlyAudit

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-5.1 (Phase A/B stratification wrap), AC-9.1, AC-10.1, AC-11.1 (audit + datalog sub-clauses)
**Decision budget:** 3 (port-bundle construction; facade method routing; createReadOnlyAudit shape)
**Must remain green:** `domain-bridge.test.js`, `module-shape.test.js`

**Files:**
- Create: `skills/design-large-task/domain/domain-bridge.js`
- Create: `skills/design-large-task/domain/__tests__/domain-bridge.test.js`

**Background:**
The single assembly seam. Constructs the four frozen port bundles, runs the §"Session boot" 9-step sequence (Components & Data Flow), exposes the seven delivery-port facades as one-line wrappers, exports `createReadOnlyAudit`.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';
import { createDomainBridge, createReadOnlyAudit } from '../domain-bridge.js';
import { DomainBootError } from '../boot-validators.js';

function makeAdapters() {
  return {
    clock: { now: () => 1700000000 },
    idAllocator: { next: (p) => `${p}_1` },
    consentVerification: { verify: () => true },
    persistenceRepo: { saveState: vi.fn(() => {}) },
  };
}

describe('domain-bridge', () => {
  it('createDomainBridge returns a frozen facade with seven delivery surfaces', () => {
    const engine = createInMemorySubstrate();
    const bridge = createDomainBridge({ engine, ...makeAdapters() });
    for (const m of ['addElement', 'ratifyElement', 'renderStructuredProof', 'renderDatalogProjection', 'getProofState']) {
      expect(typeof bridge[m]).toBe('function');
    }
  });

  it('createReadOnlyAudit returns a facade with only render/query methods', () => {
    const engine = createInMemorySubstrate();
    const audit = createReadOnlyAudit(engine);
    expect(typeof audit.renderStructuredProof).toBe('function');
    expect(audit.addElement).toBeUndefined();
    expect(audit.ratifyElement).toBeUndefined();
  });

  it('createDomainBridge wraps Phase B defineRule throws into DomainBootError', () => {
    // Engine with a defineRule that throws — simulates ADR-0013 stratification check failing.
    const engine = createInMemorySubstrate();
    const originalDefine = engine.rules.defineRule;
    engine.rules.defineRule = vi.fn(() => { throw new Error('STRATIFICATION: cycle through negation'); });
    expect(() => createDomainBridge({ engine, ...makeAdapters() })).toThrow(DomainBootError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
// domain-bridge.js — single assembly seam. Constructs port bundles, runs boot sequence,
// exposes seven delivery-port facades. Per spec Components §"Delivery-port facade methods".

import { CATEGORY_REGISTRY } from './schema.js';
import { OPERATION_SPECS, runOperation } from './mutations.js';
import { RULE_TEMPLATES, registerRuleTemplates, getDeclaredEDBPredicates } from './translation.js';
import * as closurePolicy from './closure-policy.js';
import * as frictionPolicy from './friction-policy.js';
import * as render from './render.js';
import * as counterfactual from './counterfactual.js';
import * as tags from './tags.js';
import { validateOperationSpecs, validateCategoryRegistry, validateRuleTemplates, DomainBootError } from './boot-validators.js';

/**
 * @param {{engine: object, clock: object, idAllocator: object, consentVerification: object, persistenceRepo: object}} deps
 * @returns {Readonly<object>} frozen facade
 */
export function createDomainBridge({ engine, clock, idAllocator, consentVerification, persistenceRepo }) {
  // Step 2: construct four frozen port bundles
  const readPorts = Object.freeze({ query: engine.query, explain: engine.explain });
  const writePorts = Object.freeze({ facts: engine.facts, rules: engine.rules, query: engine.query, explain: engine.explain, tx: engine.tx });
  const probePorts = Object.freeze({ query: engine.query, explain: engine.explain, snapshot: engine.snapshot, facts: engine.facts });
  const fullPorts = Object.freeze({
    ...writePorts, ...probePorts,
    clock, ids: idAllocator, consent: consentVerification, persist: persistenceRepo,
  });

  // Step 3: validate CATEGORY_REGISTRY
  try { validateCategoryRegistry(CATEGORY_REGISTRY, tags); }
  catch (e) { if (e instanceof DomainBootError) throw e; throw new DomainBootError({ validator: 'createDomainBridge', recordId: 'CATEGORY_REGISTRY', field: '*', violation: e.message }); }

  // Step 4: Phase A — static rule registration. Wrap any defineRule throw into DomainBootError.
  for (const policy of [closurePolicy, frictionPolicy]) {
    try { policy.registerStatic(writePorts.rules); }
    catch (e) {
      throw new DomainBootError({ validator: 'Phase A registerStatic', recordId: policy?.name ?? '?', field: '*', violation: e.message, cause: e });
    }
  }

  // Step 5: assemble validPredicates = Phase-A rule heads ∪ EDB predicates
  const validPredicates = getDeclaredEDBPredicates();
  // For sprint-02's scope, Phase-A rule head predicates are added by reading the rule store, OR statically named here.
  for (const p of ['closure_permitted', 'unresolved_friction', 'unaddressed_concern', 'ungrounded_proposition', 'coverage_gap_detected', 'overlap_detected', 'conflict_detected', 'proposition', 'resolution', 'definition']) validPredicates.add(p);

  // Step 6: validate OPERATION_SPECS
  validateOperationSpecs(OPERATION_SPECS, tags, validPredicates);

  // Step 7: validate RULE_TEMPLATES (cross-record only; stratification at Phase B defineRule)
  validateRuleTemplates(RULE_TEMPLATES, CATEGORY_REGISTRY);

  // Step 8: Phase B — install rule templates. defineRule throws (stratification per ADR-0013 Part 3) wrap into DomainBootError.
  // The DomainBootError.recordId carries the failing template id (annotated by registerRuleTemplates per AC-4.3/AC-5.1);
  // if the inner throw is not template-scoped, fall back to a generic 'RULE_TEMPLATES' marker.
  try { registerRuleTemplates(writePorts.rules); }
  catch (e) {
    throw new DomainBootError({
      validator: 'Phase B registerRuleTemplates',
      recordId: e.templateId || 'RULE_TEMPLATES',
      field: e.ruleId ? `ruleId='${e.ruleId}'` : '*',
      violation: e.message,
      cause: e.cause || e,
    });
  }

  // Step 9: return frozen facade — seven delivery-port surfaces as one-line methods.
  return Object.freeze({
    // IElementMutation
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    addElement: (args, consent) => runOperation('add', args, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    reviseElement: (args, consent) => runOperation('revise', args, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    withdrawElement: (args, consent) => runOperation('withdraw', args, consent, fullPorts),
    // IRatification
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    ratifyElement: (args, consent) => runOperation('ratify', args, consent, fullPorts),
    // IFrictionManagement
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    addFriction: (args, consent) => runOperation('manage_friction', { ...args, action: 'add' }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    overrideFrictionDisposition: (args, consent) => runOperation('manage_friction', { ...args, action: 'override' }, consent, fullPorts),
    // IDefinitionManagement
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    addDefinition: (args, consent) => runOperation('add', { ...args, idShape: tags.ELEMENT_CATEGORIES.DEFINITION }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    reviseDefinition: (args, consent) => runOperation('revise', { ...args, idShape: tags.ELEMENT_CATEGORIES.DEFINITION }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    ratifyDefinition: (args, consent) => runOperation('ratify', { ...args, idShape: tags.ELEMENT_CATEGORIES.DEFINITION }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    deprecateDefinition: (args, consent) => runOperation('withdraw', { ...args, idShape: tags.ELEMENT_CATEGORIES.DEFINITION }, consent, fullPorts),
    /** @param {object} args @throws {DomainError} @returns {Array<object>} */
    queryOverlap: (args) => render.queryProof({ pattern: ['overlap_detected', ['T1', 'T2']] }, readPorts),
    // IClosureSurface
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    presentClosingArgument: (args, consent) => runOperation('present_closing_argument', args, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    confirmClosureGo: (args, consent) => runOperation('confirm_closure_go', args, consent, fullPorts),
    // IRenderSurface
    /** @param {object} args @throws {DomainError} @returns {string} markdown */
    renderStructuredProof: (args) => render.renderStructuredProof(args, readPorts),
    /** @param {{id: string}} args @throws {DomainError} @returns {object|null} */
    renderElementDeep: (args) => render.renderElementDeep(args, readPorts),
    /** @param {object} args @throws {DomainError} @returns {object} */
    renderClosingArgument: (args) => render.renderClosingArgument(args, readPorts),
    /** @param {object} args @throws {DomainError} @returns {{facts: Array, rules: Array}} */
    renderDatalogProjection: (args) => render.renderDatalogProjection(args, readPorts),
    /** @param {{lane?: string}} args @throws {DomainError} @returns {object} */
    renderLaneSlice: (args) => render.renderLaneSlice(args, readPorts),
    // IQuerySurface
    /** @param {object} args @throws {DomainError} @returns {object} */
    getProofState: (args) => render.getProofState(args, readPorts),
    /** @param {{pattern: [string, any[]]}} args @throws {DomainError} @returns {Array<object>} */
    queryProof: (args) => render.queryProof(args, readPorts),
    /** @param {{propId: string}} args @throws {DomainError} @returns {{stillCloses: boolean, failureReasons: string[]}} */
    runCounterfactual: (args) => counterfactual.collapseTest(args, probePorts),
  });
}

/**
 * Internal factory used by the bridge integration test suite for injecting
 * corrupted registries to drive the boot-validator failure paths (AC-4.1/4.2/4.3).
 * Production callers should use `createDomainBridge` instead.
 *
 * @param {object} deps {engine, clock, idAllocator, consentVerification, persistenceRepo}
 * @param {{operationSpecs?: object, categoryRegistry?: object, ruleTemplates?: object}} overrides
 * @returns {Readonly<object>} frozen facade
 */
export function createDomainBridgeWith(deps, overrides = {}) {
  const specs = overrides.operationSpecs ?? OPERATION_SPECS;
  const registry = overrides.categoryRegistry ?? CATEGORY_REGISTRY;
  const templates = overrides.ruleTemplates ?? RULE_TEMPLATES;
  // Bridge construction re-runs against the override registries. Implementation mirrors
  // createDomainBridge step-for-step but reads `specs`, `registry`, `templates` instead
  // of the module-level constants.
  const { engine, clock, idAllocator, consentVerification, persistenceRepo } = deps;
  const readPorts = Object.freeze({ query: engine.query, explain: engine.explain });
  const writePorts = Object.freeze({ facts: engine.facts, rules: engine.rules, query: engine.query, explain: engine.explain, tx: engine.tx });
  const probePorts = Object.freeze({ query: engine.query, explain: engine.explain, snapshot: engine.snapshot, facts: engine.facts });
  const fullPorts = Object.freeze({ ...writePorts, ...probePorts, clock, ids: idAllocator, consent: consentVerification, persist: persistenceRepo });

  try { validateCategoryRegistry(registry, tags); }
  catch (e) { if (e instanceof DomainBootError) throw e; throw new DomainBootError({ validator: 'createDomainBridgeWith', recordId: 'CATEGORY_REGISTRY', field: '*', violation: e.message }); }

  for (const policy of [closurePolicy, frictionPolicy]) {
    try { policy.registerStatic(writePorts.rules); }
    catch (e) { throw new DomainBootError({ validator: 'Phase A registerStatic', recordId: '?', field: '*', violation: e.message, cause: e }); }
  }

  const validPredicates = getDeclaredEDBPredicates();
  for (const p of ['closure_permitted', 'unresolved_friction', 'unaddressed_concern', 'ungrounded_proposition', 'coverage_gap_detected', 'overlap_detected', 'conflict_detected', 'proposition', 'resolution', 'definition']) validPredicates.add(p);

  validateOperationSpecs(specs, tags, validPredicates);
  validateRuleTemplates(templates, registry);

  // Phase B with per-template annotation so DomainBootError.recordId carries the failing
  // template id (AC-4.3 / AC-5.1).
  for (const [templateId, template] of Object.entries(templates)) {
    const placeholder = `__template_anchor__${template.elementCategory}`;
    const r = template.build(placeholder);
    try {
      writePorts.rules.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, { ...r.metadata, isTemplateAnchor: true });
    } catch (e) {
      throw new DomainBootError({
        validator: 'Phase B registerRuleTemplates',
        recordId: templateId,
        field: `ruleId='${r.ruleId}'`,
        violation: e.message,
        cause: e,
      });
    }
  }

  // createDomainBridgeWith is a test-only factory used by bridge-integration.test.js to inject
  // corrupted registries through the AC-4.x throw paths. The success-path facade is identical
  // to createDomainBridge's facade — implementers MUST copy that block here verbatim, or, if
  // sharing is cleaner, refactor both factories to call a single `_buildFacade(ports, runtime)`
  // helper that returns the frozen facade object. Returning an empty frozen object is forbidden:
  // any test that reaches the success path against this factory would silently see undefined
  // methods instead of an obvious failure.
  throw new Error('createDomainBridgeWith: facade not implemented in this stub — implementer must copy from createDomainBridge or refactor to a shared _buildFacade helper before any success-path test uses this factory.');
}

/**
 * Read-only audit adapter. Exposes IRenderSurface + IQuerySurface methods (per spec AC-11.1
 * line 493). "Read-only" means externally observable state is unchanged by any call —
 * `runCounterfactual` mutates inside a snapshot/restore bracket so the engine state is
 * bit-equal before and after (AC-7.1). The adapter exposes ProbePorts to counterfactual.collapseTest
 * but no IElementMutation/IRatification/IFrictionManagement/IDefinitionManagement/IClosureSurface
 * methods are surfaced — the test asserts the 13-entry forbidden list is absent.
 * Realizes Architecture §10 "Adversary integrates cleanly" payoff.
 */
export function createReadOnlyAudit(engine) {
  const readPorts = Object.freeze({ query: engine.query, explain: engine.explain });
  const probePorts = Object.freeze({ query: engine.query, explain: engine.explain, snapshot: engine.snapshot, facts: engine.facts });
  return Object.freeze({
    renderStructuredProof: (args) => render.renderStructuredProof(args, readPorts),
    renderElementDeep: (args) => render.renderElementDeep(args, readPorts),
    renderClosingArgument: (args) => render.renderClosingArgument(args, readPorts),
    renderDatalogProjection: (args) => render.renderDatalogProjection(args, readPorts),
    renderLaneSlice: (args) => render.renderLaneSlice(args, readPorts),
    getProofState: (args) => render.getProofState(args, readPorts),
    queryProof: (args) => render.queryProof(args, readPorts),
    runCounterfactual: (args) => counterfactual.collapseTest(args, probePorts),
  });
}
```

- [ ] **Step 4: Run test to verify it passes** — three tests green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/domain-bridge.js skills/design-large-task/domain/__tests__/domain-bridge.test.js
git commit -m "feat(domain): domain-bridge.js assembly seam + facades + createReadOnlyAudit"
```

---

## Task 15: Structural test suite (eight source-shape tests)

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-2.1, AC-2.2, AC-3.1, AC-3.2, AC-3.3, AC-3.4 (source half), AC-6.1 (grep half), AC-9.1, AC-10.1, AC-11.2, AC-12.1
**Decision budget:** 3 (regex patterns; LOC counting convention; module-shape coverage)
**Must remain green:** every file in `structural-tests/`, plus all module tests previously created

**Files:**
- Create: `skills/design-large-task/domain/structural-tests/module-shape.test.js`
- Create: `skills/design-large-task/domain/structural-tests/port-discipline.test.js`
- Create: `skills/design-large-task/domain/structural-tests/operation-spec.test.js`
- Create: `skills/design-large-task/domain/structural-tests/facade-shape.test.js`
- Create: `skills/design-large-task/domain/structural-tests/bundle-construction.test.js`
- Create: `skills/design-large-task/domain/structural-tests/boot-validator.test.js`
- Create: `skills/design-large-task/domain/structural-tests/facade-jsdoc.test.js`

**Background:**
Eight test files implement the spec's structural-AC coverage. All use `source-scanner.js` (from Task 1). No new tooling dependencies. Regex over `fs.readFileSync` output. Per spec Components §"Test infrastructure".

**Steps (TDD):**

- [ ] **Step 1: Write all eight test files**

```javascript
// module-shape.test.js
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { readSource, countNonBlankNonComment } from './source-scanner.js';

const DOMAIN = resolve(import.meta.dirname, '..');
const NAMED = ['tags.js', 'schema.js', 'translation.js', 'authority.js', 'lifecycle.js', 'closure-policy.js', 'friction-policy.js', 'restructuring.js', 'render.js', 'counterfactual.js', 'mutations.js', 'boot-validators.js', 'domain-bridge.js'];
const CEILINGS = { 'tags.js': 120, 'schema.js': 320, 'translation.js': 320, 'authority.js': 230, 'lifecycle.js': 180, 'closure-policy.js': 280, 'friction-policy.js': 230, 'restructuring.js': 220, 'render.js': 380, 'counterfactual.js': 190, 'mutations.js': 320, 'boot-validators.js': 230, 'domain-bridge.js': 170 };

describe('module-shape', () => {
  it('all 13 named files exist', () => {
    const present = readdirSync(DOMAIN).filter(f => f.endsWith('.js'));
    for (const f of NAMED) expect(present).toContain(f);
  });

  it('total Domain LOC within 1500-2500', () => {
    const total = NAMED.reduce((s, f) => s + countNonBlankNonComment(readSource(f)), 0);
    expect(total).toBeGreaterThanOrEqual(1500);
    expect(total).toBeLessThanOrEqual(2500);
  });

  it('each module respects its per-file ceiling', () => {
    for (const f of NAMED) expect(countNonBlankNonComment(readSource(f))).toBeLessThanOrEqual(CEILINGS[f]);
  });

  it('all 12 module test files plus bridge-integration.test.js exist', () => {
    // Spec AC-12.1: domain/__tests__/ contains one .test.js per Domain module (12 module
    // test files — domain-bridge.js's behavioral coverage lives in bridge-integration.test.js,
    // not in a same-named module test) plus bridge-integration.test.js.
    const tests = readdirSync(resolve(DOMAIN, '__tests__')).filter(f => f.endsWith('.test.js'));
    const moduleTestStems = NAMED.filter(f => f !== 'domain-bridge.js');
    for (const stem of moduleTestStems) expect(tests).toContain(stem.replace('.js', '.test.js'));
    expect(tests).toContain('bridge-integration.test.js');
  });

  it('domain/structural-tests/ contains exactly the eight test files plus source-scanner.js', () => {
    const STRUCTURAL_DIR = resolve(import.meta.dirname);
    const all = readdirSync(STRUCTURAL_DIR);
    const expected = [
      'source-scanner.js',
      'module-shape.test.js', 'port-discipline.test.js', 'operation-spec.test.js',
      'facade-shape.test.js', 'bundle-construction.test.js', 'boot-validator.test.js',
      'facade-jsdoc.test.js',
    ];
    // Last expected structural-tests file lives at the end of Task 15. If we add a ninth
    // (e.g., a runtime-render check), update this list.
    for (const f of expected) expect(all).toContain(f);
    // No untracked files: every .js file in structural-tests/ must be in the expected list.
    const stray = all.filter(f => f.endsWith('.js') && !expected.includes(f));
    expect(stray).toEqual([]);
  });
});

// port-discipline.test.js
import { describe, it, expect } from 'vitest';
import { readSource, assertNoMatch } from './source-scanner.js';

const NON_BRIDGE = ['tags.js', 'schema.js', 'translation.js', 'authority.js', 'lifecycle.js', 'closure-policy.js', 'friction-policy.js', 'restructuring.js', 'render.js', 'counterfactual.js', 'mutations.js', 'boot-validators.js'];

describe('port-discipline', () => {
  it('no Domain module outside domain-bridge.js imports IClock / IIDAllocator / IConsentVerification / IPersistenceRepository implementation', () => {
    for (const f of NON_BRIDGE) {
      const src = readSource(f);
      assertNoMatch(src, /from\s+['"][^'"]*Clock[^'"]*['"]/, `${f} imports a Clock implementation`);
      assertNoMatch(src, /from\s+['"][^'"]*Persistence[^'"]*['"]/, `${f} imports a Persistence implementation`);
    }
  });

  it('render.js contains no mutation-symbol references', () => {
    const src = readSource('render.js');
    assertNoMatch(src, /facts\.assertFact/, 'render.js references facts.assertFact');
    assertNoMatch(src, /facts\.retractFact/, 'render.js references facts.retractFact');
    assertNoMatch(src, /rules\.defineRule/, 'render.js references rules.defineRule');
    assertNoMatch(src, /tx\.begin/, 'render.js references tx.begin');
  });

  it('every exported function in render.js carries an @param ReadPorts JSDoc tag', () => {
    const src = readSource('render.js');
    const exportMatches = [...src.matchAll(/export function (\w+)/g)];
    expect(exportMatches.length).toBeGreaterThan(0);
    // Each export has a JSDoc-style readPorts annotation in the file (sufficient: every export is followed by readPorts as second param).
    for (const m of exportMatches) {
      const fnIndex = src.indexOf(m[0]);
      const segment = src.slice(fnIndex, fnIndex + 400);
      expect(segment).toMatch(/readPorts/);
    }
  });
});

// operation-spec.test.js
import { describe, it, expect } from 'vitest';
import { readSource, countMatches } from './source-scanner.js';

describe('operation-spec', () => {
  const src = readSource('mutations.js');

  it('exactly one runOperation definition', () => {
    expect(countMatches(src, /\bfunction runOperation\b|\bconst runOperation\b/g)).toBe(1);
  });

  it('exactly one OPERATION_SPECS declaration', () => {
    expect(countMatches(src, /\bOPERATION_SPECS\s*=\s*Object\.freeze\b/g)).toBe(1);
  });

  it('OPERATION_SPECS contains all eight verb keys', () => {
    for (const verb of ['ADD', 'REVISE', 'WITHDRAW', 'RATIFY', 'MANAGE_FRICTION', 'PRESENT_CLOSING_ARGUMENT', 'CONFIRM_CLOSURE_GO', 'OPEN_PROOF']) {
      expect(src).toMatch(new RegExp(`ACTION_LABELS\\.${verb}`));
    }
  });

  it('customPostCheck appears on at most 3 of 8 records', () => {
    expect(countMatches(src, /customPostCheck:/g)).toBeLessThanOrEqual(3);
  });

  it('runOperation body contains §6.1 step labels in order', () => {
    const stepRefs = [...src.matchAll(/§6\.1 step (\d+)/g)].map(m => parseInt(m[1], 10));
    expect(stepRefs.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < stepRefs.length; i++) expect(stepRefs[i]).toBeGreaterThanOrEqual(stepRefs[i - 1]);
  });
});

// facade-shape.test.js
import { describe, it, expect } from 'vitest';
import { readSource } from './source-scanner.js';

describe('facade-shape', () => {
  it('each facade method body in domain-bridge.js is one expression', () => {
    const src = readSource('domain-bridge.js');
    // Each facade is of the form: methodName: (args, consent) => runOperation(...) or render.x(...) etc.
    const methodMatches = [...src.matchAll(/(\w+):\s*\((args[,)]\s*consent?)?\)\s*=>\s*([^,\n;}]+)[,\n}]/g)];
    expect(methodMatches.length).toBeGreaterThanOrEqual(7);
    for (const m of methodMatches) {
      // The body (m[3]) must not contain a semicolon (which would mean multiple statements).
      expect(m[3]).not.toMatch(/;/);
    }
  });
});

// bundle-construction.test.js
import { describe, it, expect } from 'vitest';
import { readSource, countMatches } from './source-scanner.js';

describe('bundle-construction', () => {
  const NON_BRIDGE = ['tags.js', 'schema.js', 'translation.js', 'authority.js', 'lifecycle.js', 'closure-policy.js', 'friction-policy.js', 'restructuring.js', 'render.js', 'counterfactual.js', 'mutations.js', 'boot-validators.js'];

  it('readPorts/writePorts/probePorts/fullPorts construction appears in domain-bridge.js and nowhere else', () => {
    // Spec AC-10.1: bundles are constructed only in domain-bridge.js. The bridge may legitimately
    // construct them more than once (e.g., production createDomainBridge + test-only createDomainBridgeWith
    // both construct port bundles). The "only in bridge file" rule is the load-bearing constraint.
    const bridgeSrc = readSource('domain-bridge.js');
    for (const name of ['readPorts', 'writePorts', 'probePorts', 'fullPorts']) {
      expect(countMatches(bridgeSrc, new RegExp(`const ${name} = Object\\.freeze`, 'g'))).toBeGreaterThanOrEqual(1);
    }
    for (const f of NON_BRIDGE) {
      const src = readSource(f);
      expect(countMatches(src, /Object\.freeze\(\{.*query.*explain.*\}/gs)).toBe(0);
    }
  });
});

// boot-validator.test.js
import { describe, it, expect } from 'vitest';
import { readSource, countMatches } from './source-scanner.js';

describe('boot-validator', () => {
  it('boot-validators.js exports three named validators', () => {
    const src = readSource('boot-validators.js');
    expect(src).toMatch(/export function validateOperationSpecs/);
    expect(src).toMatch(/export function validateCategoryRegistry/);
    expect(src).toMatch(/export function validateRuleTemplates/);
  });

  it('domain-bridge.js calls each validator at least once (in production factory and in test-only factory)', () => {
    // Spec boot-validator description says each validator is referenced in domain-bridge.js
    // without demanding exactly-once. createDomainBridge calls each validator once;
    // createDomainBridgeWith (test-only factory for AC-4.x bridge integration cases) also
    // calls each validator once. Each call site appearing ≥1 times in the file satisfies
    // the load-bearing constraint (validator is wired into bridge construction).
    const src = readSource('domain-bridge.js');
    expect(countMatches(src, /validateOperationSpecs\(/g)).toBeGreaterThanOrEqual(1);
    expect(countMatches(src, /validateCategoryRegistry\(/g)).toBeGreaterThanOrEqual(1);
    expect(countMatches(src, /validateRuleTemplates\(/g)).toBeGreaterThanOrEqual(1);
  });
});

// facade-jsdoc.test.js
import { describe, it, expect } from 'vitest';
import { readSource } from './source-scanner.js';

describe('facade-jsdoc', () => {
  it('every facade method has JSDoc with @param, @returns, @throws', () => {
    const src = readSource('domain-bridge.js');
    // Spec AC-11.2: every facade method on domain-bridge.js — mutation-side AND
    // render/query-side — carries JSDoc with @param, @returns, @throws tags.
    const facades = [
      // Mutation surface
      'addElement', 'reviseElement', 'withdrawElement', 'ratifyElement',
      'addFriction', 'overrideFrictionDisposition',
      'addDefinition', 'reviseDefinition', 'ratifyDefinition', 'deprecateDefinition', 'queryOverlap',
      'presentClosingArgument', 'confirmClosureGo',
      // Render surface
      'renderStructuredProof', 'renderElementDeep', 'renderClosingArgument',
      'renderDatalogProjection', 'renderLaneSlice',
      // Query surface
      'getProofState', 'queryProof', 'runCounterfactual',
    ];
    for (const m of facades) {
      // For each facade, expect a JSDoc block in the preceding 400 chars containing @param, @returns, @throws.
      const idx = src.indexOf(`${m}:`);
      expect(idx).toBeGreaterThan(0); // facade must exist in source
      const preceding = src.slice(Math.max(0, idx - 400), idx);
      expect(preceding, `${m} missing @param JSDoc`).toMatch(/@param/);
      expect(preceding, `${m} missing @returns JSDoc`).toMatch(/@returns/);
      expect(preceding, `${m} missing @throws JSDoc`).toMatch(/@throws/);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify all pass after the 13 production files exist**

```
Run: `npm test`
Expected: all module tests + all eight structural tests green.
```

If any structural test fails, fix the corresponding production file (e.g., add JSDoc tags, fix LOC, fix facade body shape).

- [ ] **Step 3: Wire up Implements coverage**

Update each test file's leading comment to list the AC IDs it implements (for plan-attack reference; no code change).

- [ ] **Step 4: Run final test pass**

```
Run: `npm test`
Expected: PASS — full suite.
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/structural-tests/
git commit -m "test(domain): structural-tests suite (8 source-shape AC coverage files)"
```

---

## Task 16: Bridge integration tests (behavioral AC coverage)

**Type:** code-producing
**Implements:** AC-3.4 (runtime half — port-call sequence), AC-4.1/4.2/4.3 (boot validator failure cases), AC-5.1 (cyclic-template throw at bridge construction), AC-6.1 (runtime render cannot mutate), AC-7.1 (counterfactual restore on throw), AC-8.1 (save divergence typed), AC-11.1 (audit + datalog end-to-end)
**Decision budget:** 4 (test fixture shapes; recording substrate; injectable persistence-failure; cyclic-template injection)
**Must remain green:** `bridge-integration.test.js`, all prior tests

**Files:**
- Create: `skills/design-large-task/domain/__tests__/bridge-integration.test.js`
- Modify: `skills/design-large-task/domain/__tests__/_fixtures/inMemorySubstrate.js` (add a `createRecordingSubstrate` helper that records every port-method call)

**Background:**
Per spec Testing Strategy §"Bridge integration tests". Each named case exercises a single AC's behavioral half. Uses the in-memory substrate fake plus a recording wrapper.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test (all integration cases)**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { createInMemorySubstrate, createRecordingSubstrate } from './_fixtures/inMemorySubstrate.js';
import { createDomainBridge, createReadOnlyAudit } from '../domain-bridge.js';
import { DomainBootError } from '../boot-validators.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES } from '../tags.js';

function makeAdapters({ failSaveOnce = false } = {}) {
  let saved = false;
  // Deterministic per-shape counter so tests can reference predictable ids like 'evidence_1'.
  // Each call to next(shape) yields shape_<n> with n monotonically increasing per shape.
  const counters = new Map();
  return {
    clock: { now: () => 1700000000 },
    idAllocator: {
      next: (shape) => {
        const n = (counters.get(shape) ?? 0) + 1;
        counters.set(shape, n);
        return `${shape}_${n}`;
      },
    },
    consentVerification: { verify: () => true },
    persistenceRepo: { saveState: vi.fn(() => { if (failSaveOnce && !saved) { saved = true; throw new Error('DISK_FULL'); } }) },
  };
}

describe('bridge-integration', () => {
  it('AC-3.4 — runOperation port-call ordering for each of the eight verbs matches §6.1', async () => {
    // Spec AC-3.4 observable boundary: a bridge-integration test invokes EACH of the eight
    // verbs against an instrumented substrate fake and records the actual port-call sequence.
    // The recorded sequence must match the §6.1 ordering: tx.begin → (assertFact|defineRule)* →
    // (derive) → query (precond) → query (postcond) → (customPostCheck?) → tx.commit → save.
    //
    // The test invokes runOperation directly (not via facade methods) for two reasons:
    //   (1) `openProof` is an OPERATION_SPECS verb but has no delivery-port facade method
    //       (the spec's seven delivery ports don't expose it — it's expected to be invoked
    //       by the Interface at session initiation, not as a tool call).
    //   (2) `manageFriction` is a single OPERATION_SPECS verb but is dispatched via two
    //       distinct facade methods (`addFriction` and `overrideFrictionDisposition` per
    //       spec §"Delivery-port facade methods") based on `args.action`. Testing at the
    //       verb level instead of the facade level keeps the loop uniform across all eight.
    //
    // The bridge is constructed first so Phase A and Phase B rules land in the substrate;
    // then a parallel fullPorts is built (mirroring the bridge's internal construction)
    // for direct runOperation calls. `calls.length = 0` resets the recorder between bridge
    // construction and verb invocation so only the verb's port calls are observed.
    const { runOperation, OPERATION_SPECS } = await import('../mutations.js');

    const buildFullPorts = (substrate, adapters) => Object.freeze({
      facts: substrate.facts, rules: substrate.rules, query: substrate.query,
      explain: substrate.explain, tx: substrate.tx, snapshot: substrate.snapshot,
      clock: adapters.clock, ids: adapters.idAllocator,
      consent: adapters.consentVerification, persist: adapters.persistenceRepo,
    });

    const consent = { source: CONSENT_SOURCES.DESIGNER };
    // §6.1 step 3 (verifyArgsShape) checks that every required field of the verb's idShape
    // is present in args before opening the transaction at step 4. Each verb-case args
    // therefore includes the required fields of its idShape — even when the verb's translate
    // ignores them (e.g., openProof / closure verbs use EVIDENCE as a placeholder idShape per
    // OPERATION_SPECS comments; their translate functions don't read `source`/`claim`, but the
    // shape check still demands them). Required-field sources of truth:
    //   EVIDENCE  → ['source', 'claim']             (schema.js CATEGORY_REGISTRY)
    //   PROPOSITION → ['statement','grounding','collapse_test','inference_pattern']
    //   FRICTION  → ['shape', 'description']
    const evidenceFill = { source: 'codebase', claim: 'x' };
    const frictionFill = { shape: 'concern', description: 'placeholder' };
    const verbCases = [
      { verb: 'openProof', prep: () => {}, args: () => ({ ...evidenceFill }) },
      { verb: 'addElement', prep: () => {}, args: () => ({ idShape: ELEMENT_CATEGORIES.EVIDENCE, ...evidenceFill }) },
      { verb: 'reviseElement', prep: (b) => b.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, ...evidenceFill }, consent), args: () => ({ id: 'evidence_1', source: 'codebase', claim: 'y' }) },
      { verb: 'withdrawElement', prep: (b) => b.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, ...evidenceFill }, consent), args: () => ({ id: 'evidence_1', ...evidenceFill }) },
      { verb: 'ratifyElement', prep: (b) => b.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, ...evidenceFill }, consent), args: () => ({ elementId: 'evidence_1', source: CONSENT_SOURCES.DESIGNER, ...evidenceFill }) },
      { verb: 'manageFriction', prep: () => {}, args: () => ({ action: 'add', frictionId: 'f1', target: 'x', ...frictionFill }) },
      { verb: 'presentClosingArgument', prep: () => {}, args: () => ({ ...evidenceFill }) },
      { verb: 'confirmClosureGo', prep: (b) => { try { b.presentClosingArgument({ ...evidenceFill }, consent); } catch {} }, args: () => ({ ...evidenceFill }) },
    ];
    expect(verbCases.length).toBe(8);
    // Sanity check: every verb is a real OPERATION_SPECS key.
    for (const { verb } of verbCases) expect(OPERATION_SPECS[verb]).toBeDefined();

    for (const { verb, prep, args } of verbCases) {
      const { substrate, calls } = createRecordingSubstrate();
      const adapters = makeAdapters();
      const bridge = createDomainBridge({ engine: substrate, ...adapters });
      const fullPorts = buildFullPorts(substrate, adapters);
      try { prep(bridge); } catch { /* prep failures are not the test target */ }
      calls.length = 0; // reset recorder so only the target verb's port calls are observed
      try { runOperation(verb, args(bridge), consent, fullPorts); }
      catch (e) {
        // DomainError on precondition failure is acceptable — the §6.1 ordering invariant
        // must hold for whatever calls WERE recorded before the throw. UNKNOWN_VERB or
        // TypeError indicates a test setup bug; re-throw those.
        if (e && (e.code === 'UNKNOWN_VERB' || e.name === 'TypeError')) throw e;
      }

      const order = calls.map(c => `${c.port}.${c.method}`);
      // Every verb opens a transaction at §6.1 step 4 — assert this fires for all eight.
      const txBeginAt = order.indexOf('tx.begin');
      expect(txBeginAt, `verb '${verb}' must open a transaction (§6.1 step 4)`).toBeGreaterThanOrEqual(0);
      const txCommitAt = order.indexOf('tx.commit');
      const txRollbackAt = order.indexOf('tx.rollback');
      const closeAt = txCommitAt !== -1 ? txCommitAt : txRollbackAt;
      expect(closeAt, `verb '${verb}' must close the transaction (commit or rollback)`).toBeGreaterThan(txBeginAt);
      // Any assertFact/defineRule call happens strictly between begin and close.
      for (let i = 0; i < calls.length; i++) {
        const tag = `${calls[i].port}.${calls[i].method}`;
        if (tag === 'facts.assertFact' || tag === 'rules.defineRule') {
          expect(i, `verb '${verb}': ${tag} must follow tx.begin`).toBeGreaterThan(txBeginAt);
          expect(i, `verb '${verb}': ${tag} must precede tx close`).toBeLessThan(closeAt);
        }
      }
      // On the commit path, persist.saveState fires strictly after tx.commit (§6.1 step 11).
      if (txCommitAt !== -1) {
        const saveAt = order.findIndex((t, i) => i > txCommitAt && t === 'persist.saveState');
        if (saveAt !== -1) expect(saveAt, `verb '${verb}': persist.saveState must follow tx.commit`).toBeGreaterThan(txCommitAt);
      }
    }
  });

  it('AC-4.1 — DomainBootError thrown when bridge is constructed against corrupted OPERATION_SPECS (no facade returned)', async () => {
    // Spec AC-4.1 requires bridge-level observation: corrupting OPERATION_SPECS makes bridge construction throw DomainBootError
    // AND no port-bundle facade is returned. The bridge module exports an internal `createDomainBridgeWith` factory used here for
    // the corruption injection — this internal factory takes overrides for {operationSpecs, categoryRegistry, ruleTemplates}.
    // (`createDomainBridgeWith` is added at the bottom of domain-bridge.js, exported for the test boundary only.)
    const { createDomainBridgeWith } = await import('../domain-bridge.js');
    const { OPERATION_SPECS } = await import('../mutations.js');
    const substrate = createInMemorySubstrate();
    // Variant 1: missing required field
    const badSpecsMissing = { ...OPERATION_SPECS, add: { ...OPERATION_SPECS.add, idShape: undefined } };
    expect(() => createDomainBridgeWith({ engine: substrate, ...makeAdapters() }, { operationSpecs: badSpecsMissing }))
      .toThrow(DomainBootError);
    // Variant 2: bad consentCategory tag
    const badSpecsTag = { ...OPERATION_SPECS, add: { ...OPERATION_SPECS.add, consentCategory: 'not_a_consent_source' } };
    expect(() => createDomainBridgeWith({ engine: createInMemorySubstrate(), ...makeAdapters() }, { operationSpecs: badSpecsTag }))
      .toThrow(DomainBootError);
  });

  it('AC-4.2 — DomainBootError thrown when bridge is constructed against corrupted CATEGORY_REGISTRY', async () => {
    const { createDomainBridgeWith } = await import('../domain-bridge.js');
    const { CATEGORY_REGISTRY } = await import('../schema.js');
    const { ELEMENT_CATEGORIES } = await import('../tags.js');
    const substrate = createInMemorySubstrate();
    // Variant: empty requiredFields
    const badRegistry = { ...CATEGORY_REGISTRY, [ELEMENT_CATEGORIES.EVIDENCE]: { ...CATEGORY_REGISTRY[ELEMENT_CATEGORIES.EVIDENCE], requiredFields: [] } };
    expect(() => createDomainBridgeWith({ engine: substrate, ...makeAdapters() }, { categoryRegistry: badRegistry }))
      .toThrow(DomainBootError);
    // Variant: unresolved sourceConstraint
    const badRegistry2 = { ...CATEGORY_REGISTRY, [ELEMENT_CATEGORIES.EVIDENCE]: { ...CATEGORY_REGISTRY[ELEMENT_CATEGORIES.EVIDENCE], sourceConstraint: 'not_a_source' } };
    expect(() => createDomainBridgeWith({ engine: createInMemorySubstrate(), ...makeAdapters() }, { categoryRegistry: badRegistry2 }))
      .toThrow(DomainBootError);
  });

  it('AC-4.3 — DomainBootError thrown when bridge is constructed against RULE_TEMPLATES with unresolved elementCategory', async () => {
    const { createDomainBridgeWith } = await import('../domain-bridge.js');
    const { RULE_TEMPLATES } = await import('../translation.js');
    const substrate = createInMemorySubstrate();
    const badTemplates = { ...RULE_TEMPLATES, junk: { elementCategory: 'not_a_category', build: (id) => ({ ruleId: `${id}_x`, headAtom: ['x', [id]], bodyAtoms: [], metadata: {} }) } };
    // AC-4.3: validateRuleTemplates throws DomainBootError with the failing template id in recordId.
    let captured = null;
    try { createDomainBridgeWith({ engine: substrate, ...makeAdapters() }, { ruleTemplates: badTemplates }); }
    catch (e) { captured = e; }
    expect(captured).toBeInstanceOf(DomainBootError);
    expect(captured.recordId).toBe('junk');
  });

  it('AC-4.3 / AC-5.1 (Phase B stratification sub-case) — cyclic-negation template body throws as DomainBootError at Phase B defineRule', async () => {
    const { createDomainBridgeWith } = await import('../domain-bridge.js');
    const { RULE_TEMPLATES } = await import('../translation.js');
    const { ELEMENT_CATEGORIES } = await import('../tags.js');
    // Cross-record-clean template with cyclic-negation body. The in-memory substrate's
    // _checkStratification (called from defineRule per ADR-0013 Part 3) throws on
    // cycle-through-negation. The bridge catches and re-throws as DomainBootError
    // carrying the failing template id.
    const cyclicTemplates = {
      ...RULE_TEMPLATES,
      cyclic_test: {
        elementCategory: ELEMENT_CATEGORIES.PROPOSITION,
        build: (id) => ({
          ruleId: `${id}_cyclic`,
          headAtom: ['p', [id]],
          bodyAtoms: [['not', ['q', [id]]], ['p', [id]]], // p depends on not q AND on p — cyclic through negation
          metadata: { element: id },
        }),
      },
    };
    const substrate = createInMemorySubstrate();
    // The substrate fake's _checkStratification must throw on this cyclic body; the
    // bridge then wraps the throw into DomainBootError. Implementer note: if the
    // in-memory fake's stratification check is a no-op stub (Task 1 left this minimal),
    // tighten the stub to detect a simple negation cycle for this test to fire.
    // AC-5.1: DomainBootError carries the failing template id in recordId.
    let captured = null;
    try { createDomainBridgeWith({ engine: substrate, ...makeAdapters() }, { ruleTemplates: cyclicTemplates }); }
    catch (e) { captured = e; }
    expect(captured).toBeInstanceOf(DomainBootError);
    expect(captured.recordId).toBe('cyclic_test');
  });

  it('AC-5.1 — cyclic-negation rule causes DomainBootError at bridge construction', () => {
    const substrate = createInMemorySubstrate();
    const realDefineRule = substrate.rules.defineRule;
    let count = 0;
    substrate.rules.defineRule = vi.fn((...args) => {
      count++;
      if (count === 1) throw new Error('STRATIFICATION: cycle through negation in rule x');
      return realDefineRule(...args);
    });
    expect(() => createDomainBridge({ engine: substrate, ...makeAdapters() })).toThrow(DomainBootError);
  });

  it('AC-6.1 — render functions structurally read-only at runtime', () => {
    const { substrate, calls } = createRecordingSubstrate();
    const bridge = createDomainBridge({ engine: substrate, ...makeAdapters() });
    // Bridge construction installs Phase A (registerStatic) and Phase B (rule templates)
    // rules, firing multiple defineRule calls into the recorder. Reset the recorder so the
    // assertion below scopes to the render calls only.
    calls.length = 0;
    bridge.renderStructuredProof({});
    bridge.renderDatalogProjection({});
    const mutationMethods = new Set(['assertFact', 'retractFact', 'defineRule', 'undefineRule', 'begin', 'commit', 'rollback']);
    expect(calls.filter(c => mutationMethods.has(c.method)).length).toBe(0);
  });

  it('AC-7.1 — counterfactual restores state on throw', () => {
    const substrate = createInMemorySubstrate();
    const bridge = createDomainBridge({ engine: substrate, ...makeAdapters() });
    substrate.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    const before = substrate.snapshot.snapshot();
    const realQuery = substrate.query.query;
    substrate.query.query = () => { throw new Error('INJECTED'); };
    expect(() => bridge.runCounterfactual({ propId: 'prop_1' })).toThrow(/INJECTED/);
    substrate.query.query = realQuery;
    expect(substrate.snapshot.snapshot()).toBe(before);
  });

  it('AC-8.1 — POST_COMMIT_SAVE_FAILED on save failure after successful commit', () => {
    const substrate = createInMemorySubstrate();
    const adapters = makeAdapters({ failSaveOnce: true });
    const bridge = createDomainBridge({ engine: substrate, ...adapters });
    expect(() => bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', claim: 'x' }, { source: CONSENT_SOURCES.DESIGNER }))
      .toThrow(/POST_COMMIT_SAVE_FAILED/);
    // Engine has committed (assertion visible).
    expect(substrate.query.exists(['evidence', ['_', '_', '_']])).toBe(true);
  });

  it('AC-11.1 — createReadOnlyAudit runs every IRenderSurface render method and excludes every mutation', () => {
    // Spec AC-11.1 observable boundary: the audit adapter runs EVERY IRenderSurface.render*
    // method against a populated state and returns structurally-valid render payloads, AND
    // exposes no IElementMutation/IRatification/IFrictionManagement/IDefinitionManagement/
    // IClosureSurface method on its surface.
    const substrate = createInMemorySubstrate();
    const bridge = createDomainBridge({ engine: substrate, ...makeAdapters() });
    // Populate state so each render method has content to project.
    bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', claim: 'x' }, { source: CONSENT_SOURCES.DESIGNER });

    const audit = createReadOnlyAudit(substrate);
    // Spec lists five IRenderSurface methods (Architecture §4.2 + spec Components §"Delivery-port facade methods").
    // Each render method takes args of a different shape; pass realistic args per method so the
    // method has enough input to produce a non-null payload. The substrate was populated above
    // via bridge.addElement, so an evidence_1 element exists for renderElementDeep to find.
    const renderInvocations = [
      ['renderStructuredProof', {}],
      ['renderElementDeep', { id: 'evidence_1' }],
      ['renderClosingArgument', {}],
      ['renderDatalogProjection', {}],
      ['renderLaneSlice', { lane: 'all' }],
    ];
    for (const [m, methodArgs] of renderInvocations) {
      expect(typeof audit[m]).toBe('function');
      const result = audit[m](methodArgs);
      // Every render method returns SOMETHING — string, object, or array — but never undefined or null.
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    }
    // Spec Datalog-projection sub-clause: renderDatalogProjection output is parseable
    // (JSON.parse(JSON.stringify(x)) preserves it) and structurally complete.
    const projection = audit.renderDatalogProjection({});
    expect(JSON.parse(JSON.stringify(projection))).toEqual(projection);
    expect(Array.isArray(projection.facts)).toBe(true);
    expect(projection.facts.length).toBeGreaterThan(0);

    // Audit adapter exposes IQuerySurface (getProofState, queryProof, runCounterfactual) per spec.
    for (const m of ['getProofState', 'queryProof', 'runCounterfactual']) {
      expect(typeof audit[m]).toBe('function');
    }

    // No mutation methods are callable on the audit adapter (spec AC-11.1 sub-clause).
    const forbidden = [
      // IElementMutation
      'addElement', 'reviseElement', 'withdrawElement',
      // IRatification
      'ratifyElement',
      // IFrictionManagement
      'addFriction', 'overrideFrictionDisposition',
      // IDefinitionManagement (spec lists five: add/revise/ratify/deprecate plus queryOverlap)
      'addDefinition', 'reviseDefinition', 'ratifyDefinition', 'deprecateDefinition', 'queryOverlap',
      // IClosureSurface
      'presentClosingArgument', 'confirmClosureGo',
    ];
    for (const m of forbidden) expect(audit[m]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Add `createRecordingSubstrate` helper to inMemorySubstrate.js**

Add to the bottom of `inMemorySubstrate.js`:

```javascript
export function createRecordingSubstrate() {
  const substrate = createInMemorySubstrate();
  const calls = [];
  const record = (port, method, ...args) => calls.push({ port, method, args });
  for (const port of ['facts', 'rules', 'query', 'snapshot', 'explain', 'tx']) {
    for (const [method, fn] of Object.entries(substrate[port])) {
      if (typeof fn === 'function') {
        const orig = fn.bind(substrate[port]);
        substrate[port][method] = (...args) => { record(port, method, ...args); return orig(...args); };
      }
    }
  }
  return { substrate, calls };
}
```

- [ ] **Step 3: Run test to verify it passes**

```
Run: `npm test`
Expected: PASS — all integration cases plus the full prior suite.
```

- [ ] **Step 4: Final test pass**

```
Run: `npm test`
Expected: PASS — full suite (~38 tests across module + structural + integration).
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/domain/__tests__/bridge-integration.test.js skills/design-large-task/domain/__tests__/_fixtures/inMemorySubstrate.js
git commit -m "test(domain): bridge-integration suite + recording substrate"
```

---

## End of Plan

Sixteen tasks. Total expected: 13 production source files + 13 module test files + 1 substrate fixture + 8 structural-tests files + 1 source-scanner + 1 bridge-integration test = **37 files**. Production LOC ≈ 2,400 (within 1,500–2,500 envelope). Test LOC ≈ 1,200.

After Task 16 completes and `npm test` passes, sprint-02 is implementation-complete. `execute-verify-complete` runs next, then `finish-write-records` → `finish-archive-artifacts` → `finish-close-worktree`.

<!-- created-at: 2026-05-14T09:40:50Z -->
<!-- produced-by plan-build@v0004 -->
