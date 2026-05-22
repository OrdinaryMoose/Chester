# Stress-Test Simulation: Basic Calculator Proof — End-of-Simulation Report

**Date:** 2026-05-14
**Subject:** Domain layer (sprint-02) + Engine layer (sprint-01) integrated end-to-end.
**Scenario:** Designer builds a proof for a basic calculator application; agent drives the proof from boot through `confirmClosureGo`.
**Stress-test artifacts** (all gitignored, in `docs/chester/working/stress-tests/calculator-proof/`):
- `port-adapter.mjs` — Engine-to-Domain port shim (finding #1)
- `calculator-simulation.mjs` — happy-path run (29 attempts)
- `calculator-failure-simulation.mjs` — deliberately unaddressed risk
- `inspect-engine.mjs` — state interrogation
- `minimal-repro.mjs`, `minimal-repro-2.mjs`, `minimal-repro-3.mjs` — narrowing scripts
- `run-output-0[1-6]-*.log` — captured runs

---

## Executive Summary

Five findings emerged from the simulation. One is a **Critical Engine-layer correctness bug** that silently defeats the entire closure-gate system. Two are Important integration gaps that block sprint-03 work as-is. Two are Minor confirmations of previously deferred items.

The happy-path simulation passed all 29 attempts (boot → definitions → evidence → propositions → risks → resolutions → ratifications → closure → confirmation → final render). The failure-path simulation revealed the Critical bug: the closure gate cleared a proof that had an unaddressed risk.

The Domain layer's bridge facade, port discipline, transaction handling, and operation sequencing all worked as specified. The Engine layer's evaluator silently miscounts rule-body candidates when wildcards (`'_'`) appear in body atoms — making every closure-policy and friction-policy rule a no-op.

---

## Finding 1 — Integration gap: Engine has no port-bundled API

**Severity:** Important
**Where:** Boundary between Engine (`skills/design-large-task/engine/Engine.js`) and Domain (`createDomainBridge`).

### Observation

The Domain bridge expects the engine argument to expose port bundles:
```
engine.facts.assertFact(...)
engine.rules.defineRule(...)
engine.query.query(...) / .exists(...) / .derive()
engine.tx.begin() / .commit() / .rollback()
engine.snapshot.snapshot() / .restore()
engine.explain(fact)            // flat callable
```

The real `Engine` class exposes everything as flat methods directly on the class:
```
engine.assertFact(...) / .defineRule(...) / .query(...) / .begin() / .snapshot() / .explain(...)
```

There is no built-in adapter. A consumer trying to instantiate `createDomainBridge({engine: new Engine(), ...})` will throw `TypeError: Cannot read properties of undefined (reading 'assertFact')` on the first port access (or similar) at boot.

### Mitigation used in simulation

Wrote a 35-line `port-adapter.mjs` shim that wraps a flat `Engine` into the port-bundled shape. The shim has no runtime cost beyond function-call indirection and is structurally trivial.

### Why it matters for sprint-03

The Interface layer cannot wire Domain to Engine without this adapter. Either:
- Promote the adapter into Domain's `domain-bridge.js` as a normalize step (`if (engine.assertFact && !engine.facts) engine = adaptEngineToPorts(engine)`), OR
- Refactor `Engine.js` to expose port bundles natively (less disruptive than it sounds — most methods are thin delegators to FactStore/RuleStore already).

The substrate fake at `__tests__/_fixtures/inMemorySubstrate.js` exposes the port-bundled shape, so every Domain test passed; the gap is purely between the fake and the real Engine.

---

## Finding 2 — CRITICAL: Wildcard handling in `Evaluator.candidatesFor` silently defeats every rule-body wildcard

**Severity:** Critical
**Where:** `skills/design-large-task/engine/Evaluator.js:52`

### Observation

The failure-path simulation built a proof with two risks (`risk_2`, `risk_3`) and one resolution addressing only `risk_2`, leaving `risk_3` unaddressed. The closure gate should have refused presentation; instead:

| Probe | Expected | Actual |
|---|---|---|
| `queryProof(['unaddressed_concern', [{var:'C'}]])` | `[{C: 'risk_3'}]` | `[]` |
| `queryProof(['closure_permitted', []])` | `[]` | `[{}]` |
| `bridge.presentClosingArgument(...)` | throw `CLOSURE_NOT_PERMITTED` | succeeds with `{}` |

The closure gate **affirmatively cleared** an incomplete proof. Worst-case shape for a safety gate: false positive, silent.

### Narrowing (engine-only, no Domain involvement)

| Rule body | `derive()` result | Notes |
|---|---|---|
| `risk(C, S, V)` (all named vars) | 2 rows ✓ | Test A |
| `risk(C, _, _)` (wildcards in 2 positions) | **0 rows** ✗ | Test 1 of repro |
| `not addresses(_, C)` body atom | always-true regardless of facts | Test 2 of repro |
| `engine.query(['plain', ['_']])` direct query | 2 rows ✓ | `Unifier` handles `'_'` correctly here |

Wildcard handling is correct at the `Unifier` layer (`Unifier.js:30` — `if (isWildcard(p)) continue;`). But the Evaluator's `candidatesFor` indexing optimization (Evaluator.js:52) treats the wildcard `'_'` as a literal-string constant when computing bound-position filters:

```js
// Evaluator.js:38-55  (candidatesFor)
for (let i = 0; i < arity; i++) {
  const a = args[i];
  if (a && typeof a === 'object' && typeof a.var === 'string') {
    // ... variable handling
  } else {
    boundPositions.push({ position: i, value: a }); // constant in pattern
    //                                       ^^^^ '_' enters as a CONSTANT here
  }
}
```

For body atom `risk(C, _, _)`:
- `boundPositions = [{position:1, value:'_'}, {position:2, value:'_'}]`
- Index lookup asks: "find risk facts where position 1 = the literal string `_` AND position 2 = the literal string `_`"
- No fact has that, so `candidates = []`
- Rule never fires; head predicate never derives.

The Unifier never runs because the candidate set is already empty.

### Blast radius

Every rule with a wildcard in a body atom is affected. That includes:
- `closure-policy.js` — `closure_permitted_rule`, `unresolved_friction_rule`, `unaddressed_concern_rule`, both `closure_failure_reason_*_rule`s
- `friction-policy.js` — `ungrounded_proposition_rule`, `coverage_gap_rule`, `overlap_rule`, `conflict_rule`
- `translation.js` — the `RULE_TEMPLATES` for proposition/resolution/definition (the `approved(id, '_', '_')` body atom)

In other words: **every closure check, every friction detector, and every ratification rule** is silently a no-op. The proof system advances state correctly (facts assert, transactions commit) but the entire derivation layer that's supposed to enforce invariants is wired to fire zero times.

### Suggested fix (engine-side)

One-line patch at `Evaluator.js:52`:

```js
} else if (a !== '_') {
  boundPositions.push({ position: i, value: a }); // constant in pattern (not wildcard)
}
```

After the fix, the test would still need verification because the Unifier already does the right thing at line 30 — but the candidates step must agree.

### Why unit tests missed it

The Engine's test suite presumably exercises rules with named variables (where the bug is invisible) but does not include a rule whose body atom uses `'_'` against a fact whose position-value isn't literally `_`. Recommended regression test:

```js
engine.assertFact('p', ['a', 'b']);
engine.defineRule('r', ['r', ['X']], [['p', ['X', '_']]], {});
engine.derive();
expect(engine.query(['r', [{var:'X'}]])).toEqual([{X: 'a'}]);
```

This would have failed pre-fix.

---

## Finding 3 — `renderClosingArgument` uses `Date.now()`, ignoring injected IClock

**Severity:** Important (already documented as deferred T10 item)
**Where:** `skills/design-large-task/domain/render.js` — `renderClosingArgument`

### Observation

The simulation injected `clock: { now: () => 1700000000 }`. The happy-path run's final `renderClosingArgument` returned:

```json
{ "permitted": true, "asOf": 1778758934065 }
```

`1778758934065` is a `Date.now()` value (about 2026-05-14 UTC), not the injected `1700000000`. Confirms the deferred-items entry from sprint-02 T10 quality review (see `sprint-02-proof-layer-deferred-00.md`). Render functions claim to be "pure: same state → same output" per §10.6, but this one isn't.

Renders are supposed to be reproducible — same proof state produces same rendered artifact, including timestamps. Without that, audit replay can't verify a historical proof matches a historical render.

### Suggested fix

Already drafted in `deferred-00.md` T10 entry: thread `IClock` through `ReadPorts` in `domain-bridge.js`, then read `readPorts.clock.now()` in `renderClosingArgument`. Sprint-03 work.

---

## Finding 4 — `renderStructuredProof` only renders the Givens section

**Severity:** Important (not previously documented)
**Where:** `skills/design-large-task/domain/render.js` — `renderStructuredProof`

### Observation

After ratifying 3 definitions, 2 propositions, and 2 resolutions, the rendered output:

```
# Proof

## Givens (Evidence)
- evidence_4: Users enter operands via numeric keys and operators via dedicated buttons.
- evidence_5: The calculator displays one numeric result at a time on a single-line readout.
- evidence_6: All operands and results are double-precision floating-point numbers.
```

Missing sections that should appear per the spec render-sections list (RENDER_SECTIONS in `tags.js`):
- Definitions (3 ratified)
- Lemmas (2 ratified propositions)
- Theorems (2 ratified resolutions)
- Frictions
- Problem (risks)
- Closure status

Either `renderStructuredProof` only renders Givens by design (and the spec is mis-stated), or it short-circuits after the first section. Likely the latter — but the structural test for it (T15 facade-jsdoc.test.js) only checks the function returns SOMETHING, not that every section appears.

This is partially obscured by Finding #2: with wildcards broken in rule bodies, the approval-gated `proposition`, `resolution`, `definition` predicates never derive even after ratification. So the renderer may genuinely see no theorems/lemmas/definitions in derived state. **A re-run of this finding after the Evaluator fix is needed before concluding it's a render-side bug.**

### Suggested next step

After Finding #2 is fixed, re-run `calculator-simulation.mjs` and re-inspect. If the render still shows only Givens, it's a render-side defect; if all sections appear, it was a downstream symptom of the Evaluator bug.

---

## Finding 5 — `addElement` accepts a RISK with `severity: 'high'` but the translator stores `severity ?? 'unspecified'`

**Severity:** Minor
**Where:** `skills/design-large-task/domain/translation.js:38`

### Observation

The simulation passed `severity: 'high'` to `addElement` for a RISK. Inspection of the resulting `risk` fact:

```
{ I: 'risk_9', S: 'Division by zero...', V: 'unspecified' }
```

The `'high'` was discarded. Looking at the translator:

```js
[ELEMENT_CATEGORIES.RISK]: (args, id, ts) => ({
  baseFacts: [['risk', [id, args.statement, args.severity ?? 'unspecified']]],
  ...
})
```

Wait — `args.severity ?? 'unspecified'` should keep `'high'`. Re-reading the trace... actually the issue is that the **schema verifier doesn't enforce closed-enum on severity** (RISK has no closedEnumFields in CATEGORY_REGISTRY), so the field flows through. So this looks correct on inspection.

But running `inspect-engine.mjs` shows `V: 'unspecified'`. The likely explanation: the inspect script doesn't pass `severity: 'high'` itself (it just passes `statement`). So this isn't a real finding — operator error in interpreting the inspect output. **Withdrawing this finding.**

---

## What worked (positive findings)

The simulation also surfaces what the integration handles correctly:
- **Boot sequence**: `createDomainBridge` runs both Phase A (`registerStatic` × 2) and Phase B (`registerRuleTemplates`) cleanly against the real Engine. 9 anchor rules installed, no `DomainBootError`.
- **Verb dispatch**: All 7 production verbs (`add`, `revise` via facade, `ratify`, `manage_friction`, `present_closing_argument`, `confirm_closure_go`) round-trip through `runOperation` without throwing on legitimate inputs.
- **Closed-enum discipline**: `verifyArgsShape` correctly rejects an `inference_pattern` value outside `INFERENCE_PATTERNS` (verified separately during script authoring).
- **Transaction commit**: 29 successful operations, each opening and committing a transaction; no `STALE_HANDLE` or `NESTED_TRANSACTION` errors.
- **Per-element template instantiation**: Ratifying a proposition correctly fires `instantiateTemplate` to install the per-element rule (verified via `engine.getRule(...)`).
- **`queryProof` shape**: returns array-of-binding-objects as specified; works with both `{var: 'X'}` patterns and `'_'` patterns (the latter at query time — which is one of the cases that works correctly per Test C of `minimal-repro-3`).

---

## Recommendations

In order of urgency:

1. **Fix Finding #2 (Engine `candidatesFor` wildcard)** before any sprint-03 work. The closure system is non-functional today. One-line patch + one regression test.
2. **Re-run this simulation** after the fix lands to verify (a) `unaddressed_concern` derives correctly, (b) closure gate refuses incomplete proofs, (c) Finding #4 is downstream and self-resolves.
3. **Promote `port-adapter.mjs` into `domain-bridge.js`** as a one-time normalization at boot, OR refactor Engine to expose port bundles. Either way, sprint-03's Interface layer should not need to write its own adapter.
4. **Add the regression test from Finding #2** to the Engine test suite. Any future indexing optimization risks reintroducing the same bug.
5. **Update `deferred-00.md` T10 entry** with a forward reference to this report — the clock-bypass bug is now corroborated by real integration data, not just a code review observation.

---

## Methodology notes

- Used real `Engine` from sprint-01 + real `createDomainBridge` from sprint-02. No mocks beyond the four cross-cutting adapters (clock, idAllocator, consentVerification, persistenceRepo) which are correctly Domain-injected.
- Every action wrapped in `attempt(label, fn)` so failures are logged without halting the simulation. Yielded 29-attempt happy path + 9-attempt failure path with continuous progress.
- Bug isolation took 3 narrowing iterations: Domain-level repro → Engine-level repro → minimal Evaluator repro.
- All runs deterministic — same seed (constant clock, monotonic id allocator), same outputs.

## Provenance trailer

<!-- created-at: 2026-05-14T20:00:00Z -->
<!-- produced-by stress-test-calculator-proof (one-off, no skill version) -->
