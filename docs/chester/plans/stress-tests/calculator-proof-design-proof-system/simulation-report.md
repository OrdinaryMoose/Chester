# Stress-Test Simulation: Fully-Featured Calculator Proof — End-of-Simulation Report

**Date:** 2026-05-15
**Subject:** `design-proof-system` Domain layer (`skills/design-proof-system/references/domain/`) integrated against the design-proof-system Engine (`skills/design-proof-system/references/engine/`) end-to-end.
**Scenario:** Designer builds a proof for a fully-featured calculator application — every element category in `tags.ELEMENT_CATEGORIES` is exercised at least twice. Same shape as the 2026-05-14 calculator simulation but applied to the design-proof-system codebase, and broadened so all nine element categories appear.
**Stress-test artifacts** (gitignored, in `docs/chester/working/stress-tests/calculator-proof-design-proof-system/`):
- `calculator-fully-featured-simulation.mjs` — main run (54 attempts)
- `probe-friction-disposition.mjs` — narrowing probe for finding #2
- `run-output-01.log`, `run-output-02-probe.log` — captured runs

---

## Executive Summaryfix

54 attempts in the main run; 4 failures. After narrowing, three of the four failures map to genuine defects in the Domain layer:

1. **Critical** — `manage_friction` asserts a new `friction_disposition` fact but never updates the original `friction` fact; the `unresolved_friction_rule` matches the FRICTION fact's 4th position, so disposition changes through the supported API have no effect on closure. Once any friction exists, closure is unreachable through the public surface.
2. **Important** — `overrideFrictionDisposition` shape-checks the operation's args against the FRICTION element schema (which requires `shape` and `description`), even though the operation only consumes `frictionId` and `disposition`. Callers must either pass irrelevant filler fields or use a private mutation path.
3. **Important** — `CATEGORY_REGISTRY[FRICTION].sourceConstraint = SYSTEM` is dead documentation: `verifyConsent` reads `OPERATION_SPECS.add.consentCategory` (hard-coded `DESIGNER`), so a SYSTEM-detected friction cannot be added under SYSTEM consent. Either the schema field is wrong, or the consent layer is missing a per-category branch.

The fourth "failure" — closure refused at `presentClosingArgument` — is **correct behavior**: the simulation deliberately left frictions and concerns unresolved. With finding #1 in place, however, no remediation through the public API would have changed that outcome.

The integration also confirmed several positive results: every element category landed at least one fact in the engine, all four approval-gated categories (PROPOSITION, RESOLUTION, DEFINITION, CONCERN) successfully derived their post-ratification predicates, the closure gate refused presentation with a useful per-id failure list, and `runCounterfactual` returned a coherent collapse-test result for a ratified proposition.

---

## Element coverage matrix

The simulation drove every element category in `tags.ELEMENT_CATEGORIES`. Per-category EDB-fact counts at the end of the run (from the inventory query):

- EVIDENCE — 4 added, 4 EDB rows
- RULE — 3 added, 3 EDB rows (`rule_decl`)
- PERMISSION — 3 added, 3 EDB rows (`permission_decl`)
- PROPOSITION — 3 added, 3 EDB rows (`proposition_decl`), 3 derived rows (`proposition`) after ratification
- RISK — 3 added, 3 EDB rows
- RESOLUTION — 3 added, 3 EDB rows (`resolution_decl`), 3 derived rows (`resolution`) after ratification
- FRICTION — 1 added (1 attempt failed by design as a consent probe — see Finding #3)
- CONCERN — 2 added, 2 EDB rows; both flagged as `unaddressed_concern` because no resolution `addresses` either of them (correct semantics)
- DEFINITION — 4 added, 4 EDB rows (`definition_decl`), 4 derived rows (`definition`) after ratification

All four approval-gated categories successfully fired their per-element rule template at `add` time and derived their public predicate after `ratifyElement` — confirming that `instantiateTemplate` works for each of them.

---

## Finding 1 — CRITICAL: `manage_friction` updates a satellite fact but the closure rule reads the element fact

**Severity:** Critical
**Where:** `skills/design-proof-system/references/domain/mutations.js:74` (translate of `MANAGE_FRICTION`) ↔ `skills/design-proof-system/references/domain/closure-policy.js:18-22` (`unresolved_friction_rule`)

### Observation

The probe script (`probe-friction-disposition.mjs`) created a single FRICTION, then called `overrideFrictionDisposition({frictionId, disposition: 'address', ...filler})`. The operation succeeded (Test B). Inspection:

| Probe | Result |
|---|---|
| `friction_disposition` fact written? | yes — `[{F:'friction_1', D:'address'}]` |
| `unresolved_friction(friction_1)` cleared? | **no** — still derives |
| Raw `friction` fact 4th arg | **still `'unset'`** |

So even after the supported "set the disposition to ADDRESS" call returned `{}` successfully, the friction is still considered unresolved by the closure gate.

### Why

`mutations.js:74` defines the `MANAGE_FRICTION` translator as:

```js
translate: (args, id, ts) => ({
  baseFacts: [['friction_disposition', [args.frictionId, args.disposition]]],
  rules: [], metaFacts: [],
})
```

It only writes a *new* `friction_disposition` fact. It does not retract the original `friction` fact and re-assert it with an updated 4th-position value.

But `closure-policy.js:20` defines:

```js
['friction', ['F', '_', '_', 'unset']]
```

The rule looks at the FRICTION fact's 4th position directly, not at the satellite `friction_disposition` predicate. So the new fact is invisible to the closure gate.

### Blast radius

Once any FRICTION is added, closure is **unreachable through the public Domain API** unless the friction is withdrawn entirely. Every workflow that reaches `presentClosingArgument` after a friction has been raised will fail with `CLOSURE_NOT_PERMITTED`. The bug is silent in the sense that the `manage_friction` call itself returns `{}` cleanly — the operator has no signal that the disposition didn't take effect.

This is similar in shape to the 2026-05-14 calculator simulation's Critical wildcard finding in the *other* system: a closure-gate-defeating defect that hides behind successful-looking calls.

### Suggested fix (Domain-side)

Either:

- **Option A (recommended) — make `unresolved_friction_rule` read `friction_disposition`:**

  ```js
  rulePorts.defineRule(
    'unresolved_friction_rule',
    ['unresolved_friction', ['F']],
    [
      ['friction', ['F', '_', '_', '_']],
      ['not', ['friction_disposition', ['F', 'address']]],
      ['not', ['friction_disposition', ['F', 'defer']]],
      ['not', ['friction_disposition', ['F', 'dismiss']]],
      ['not', ['friction_disposition', ['F', 'override']]],
    ],
    { ... },
  );
  ```

  Disposition lives in its own predicate; the FRICTION fact stays immutable after add.

- **Option B — make `MANAGE_FRICTION` retract+re-assert the FRICTION fact** with the updated 4th position. Cheaper to write but forces the FRICTION fact to mutate, which conflicts with the EDB-immutable convention used by every other element category in the system.

### Regression test

```js
const f = bridge.addElement({idShape: 'friction', shape: 'overlap', description: 'x'}, designerConsent);
bridge.overrideFrictionDisposition({frictionId: f.id, disposition: 'address', shape: 'overlap', description: 'x'}, designerConsent);
expect(bridge.queryProof({pattern: ['unresolved_friction', [{var: 'F'}]]})).toEqual([]);
```

Pre-fix: the assertion fails — the friction is still flagged as unresolved.

---

## Finding 2 — IMPORTANT: `manage_friction` shape-checks against the wrong schema

**Severity:** Important
**Where:** `skills/design-proof-system/references/domain/mutations.js:73` (`MANAGE_FRICTION.idShape`) → `skills/design-proof-system/references/domain/mutations.js:118-119` (`runOperation` step 3)

### Observation

The main simulation called `bridge.overrideFrictionDisposition({frictionId, disposition: 'address'}, consent)`. It failed:

```
SHAPE_INVALID: missing required field "shape" for friction
```

The probe (Test A) reproduced minimally; Test B confirmed that adding filler `shape` and `description` fields lets the same call succeed.

### Why

`mutations.js:73` declares `MANAGE_FRICTION.idShape = ELEMENT_CATEGORIES.FRICTION`. `runOperation` then runs `verifyArgsShape(args, args.idShape ?? spec.idShape)` (`mutations.js:118-119`), which consults `CATEGORY_REGISTRY[FRICTION].requiredFields = ['shape', 'description']`.

The disposition operation's actual argument shape is `{frictionId, disposition}` — `shape` and `description` are properties of the *element being modified*, not of the *operation*. The shape-check is checking the wrong thing.

### Blast radius

The `manage_friction` verb is unusable without forcing callers to pass irrelevant fields that the translator doesn't even read. Any caller writing the documented argument shape will hit `SHAPE_INVALID` at the boundary; the operation has no documented escape. The `bridge.addFriction` and `bridge.overrideFrictionDisposition` facade methods both flow through the same `manage_friction` verb, so both are affected.

### Suggested fix (Domain-side)

Introduce a verb-specific argument shape rather than reusing the element-category shape for operations whose args don't match it. Either:

- Add `argShape` records to `OPERATION_SPECS`, separate from `idShape`, and have `runOperation` shape-check against `argShape` when present.
- Or move shape-checking out of `runOperation` and into the per-translator path, where each translator knows its own required fields.

The same mismatch likely applies to other operations whose args don't match their `idShape` element schema (`PRESENT_CLOSING_ARGUMENT`, `CONFIRM_CLOSURE_GO`, and `OPEN_PROOF` all default `idShape: EVIDENCE` but take operation-specific args). Those happened not to surface in this simulation because `verifyArgsShape` is forgiving when *no* required field is present in `args` — wait, it actually throws on the first missing field. The reason those didn't fail is that the simulation passed `{source: 'designer', claim: 'closure-attempt'}` which happens to satisfy EVIDENCE's required fields (`source`, `claim`). That's coincidental, not by design — and any caller who omits `claim` from a `presentClosingArgument` call would hit the same false-positive shape failure.

---

## Finding 3 — IMPORTANT: `CATEGORY_REGISTRY[FRICTION].sourceConstraint` is unused

**Severity:** Important
**Where:** `skills/design-proof-system/references/domain/schema.js:61` (FRICTION row, `sourceConstraint: SYSTEM`) ↔ `skills/design-proof-system/references/domain/authority.js:9-20` (`verifyConsent`) ↔ `skills/design-proof-system/references/domain/mutations.js:35-36` (`OPERATION_SPECS.add.consentCategory`)

### Observation

The simulation tried `bridge.addElement({idShape: FRICTION, ...}, {source: 'system'})` after successfully adding a FRICTION under DESIGNER consent. Result:

```
CONSENT_INVALID: source system does not match required designer
```

Yet `CATEGORY_REGISTRY[FRICTION].sourceConstraint = CONSENT_SOURCES.SYSTEM` and `authority.add = [SYSTEM, DESIGNER]` — both indicate the schema *intends* SYSTEM-source frictions to be addable.

### Why

`verifyConsent` (`authority.js:13`) is a strict equality check between `consent.source` and the `consentCategory` *passed in by the caller*. The caller is `runOperation`, which passes `spec.consentCategory` (`mutations.js:115`) — and `OPERATION_SPECS.add.consentCategory` is hard-coded to `DESIGNER` (`mutations.js:36`).

The per-category `sourceConstraint` field is set on every entry in `CATEGORY_REGISTRY` but is **never read by any module** in the Domain layer. There is also a `lookupAuthority(idShape, action)` helper (`authority.js:29`) that reads the per-category `authority.add` allowlist — but no caller invokes it during `runOperation`.

### Possible designs

This looks like an unfinished spec contract. Either:

- The schema field is aspirational and should be deleted; SYSTEM-source frictions are never meant to be admittable through the public API. (Then friction creation must always carry DESIGNER consent, and the FRICTION docstring should say so.)
- The schema field is load-bearing and `verifyConsent` should consult `CATEGORY_REGISTRY[idShape].sourceConstraint` before falling back to the spec-level `consentCategory`. (Then the simulation's probe attempt should have succeeded.)

The cascade docs would tell which design was intended; this report does not pick a side. The defect is the contract gap between schema and consent.

### Blast radius

The contradiction matters because:
- The proof system's friction-detection plan reportedly expects SYSTEM-detected frictions (e.g. `ungrounded_proposition`, `coverage_gap_detected`, `overlap_detected`, `conflict_detected` rules in `friction-policy.js` — visible in `domain-bridge.js:47`). If that machinery generates derived friction *facts* directly (bypassing `addElement`), the schema field is purely cosmetic. If it ever wants to flow through the public surface — for batch import, for replay, for an auditor's view — the public surface won't accept SYSTEM consent.
- Anyone reading `schema.js` reasonably concludes FRICTION supports SYSTEM consent and writes integration code that fails at runtime with no compile-time signal.

---

## Finding 4 — CONFIRMED: `presentClosingArgument` correctly refuses unresolved state, and the diagnostic id list is useful

**Severity:** None (positive finding)
**Where:** `skills/design-proof-system/references/domain/closure-policy.js:64`

### Observation

The main simulation deliberately left state where the closure gate should refuse:
- `friction_26` had no disposition (would-be ADDRESS hit Finding #2)
- `concern_24` and `concern_25` were ratified but never `addresses`-d by any resolution

`presentClosingArgument` correctly threw `CLOSURE_NOT_PERMITTED` with a per-id diagnostic message:

```
Closure failed: friction_26, concern_24, concern_25
```

The diagnostic list comes from `closure_failure_reason(R)`, which the closure-policy module derives from both `unresolved_friction(F)` and `unaddressed_concern(C)` (`closure-policy.js:43-54`). The `triggerGate` function (`closure-policy.js:64`) queries that predicate and concatenates the bindings into a human-readable message.

This is a notably better failure-mode shape than the prior simulation's analogue: the closure refusal here names *which* elements are blocking, instead of just stating that closure is not permitted. An operator can map each id back to its rendered description and act on it.

### Implication

The closure-failure-reason machinery works correctly in this codebase. If Finding #1 (the disposition decoupling) is fixed, the error list would shrink as frictions are addressed — which is the intended UX. Finding #1 is the only structural blocker between this codebase and an actual end-to-end closure.

---

## What worked (positive findings)

- **Boot:** `createDomainBridge` ran Phase A (`closurePolicy.registerStatic`, `frictionPolicy.registerStatic`) and Phase B (`registerRuleTemplates` for all four approval-gated categories) without throwing. No `DomainBootError`.
- **Engine port adapter:** `engine-port-adapter.js`'s `normalizeEngine` correctly detected the flat-API sprint-01 Engine and wrapped it. The adapter is now part of the Domain layer (the prior simulation surfaced it as Finding #1; that fix has landed).
- **All nine element categories admitted at least one fact.** The inventory query confirmed `evidence`, `rule_decl`, `permission_decl`, `proposition_decl`, `risk`, `resolution_decl`, `friction`, `concern`, `definition_decl` all populated.
- **All four approval-gated categories derived their public predicate after ratification.** `proposition`, `resolution`, `definition`, and `concern_status(_, 'ratified')` all increased from 0 to N rows once `ratifyElement` was called for each. The Phase-C `instantiateTemplate` works for every approval-gated category, including CONCERN (which the prior simulation didn't exercise).
- **`renderStructuredProof`** rendered Givens, Lemmas, Theorems, and Definitions sections with the expected element ids and statements. The wildcard-in-rule-body bug from the prior simulation does not reproduce in this codebase, so the renderer sees actual derived facts.
- **`renderClosingArgument`** returned `{permitted: false, asOf: <timestamp>}` correctly reflecting the gate state. (The `asOf` value is `Date.now()`, not the injected clock — same caveat as the prior simulation's Finding #3, which was a deferred render-side issue. Worth re-confirming whether that fix has landed in this codebase or is still pending.)
- **`renderElementDeep`** returned a non-null record for both a definition and a proposition.
- **`runCounterfactual`** returned `{stillCloses: false, failureReasons: ['friction_26', 'concern_24', 'concern_25']}` — same diagnostic list as the closure gate, confirming the snapshot/restore-bracketed counterfactual path uses the same closure-failure-reason machinery.
- **Transactions:** 50+ committed operations across the run; no `STALE_HANDLE` or `NESTED_TRANSACTION` errors.
- **Closed-enum discipline:** `inference_pattern` was rejected outside `INFERENCE_PATTERNS` during script authoring (caught a typo); `shape` and `disposition` enforcement on FRICTION worked.

---

## Recommendations

In order of urgency:

1. **Fix Finding #1 (disposition decoupling).** Pick Option A (move negation into the rule body, inspect `friction_disposition` predicate) — it preserves EDB immutability and matches the design pattern used elsewhere. Without this fix, no proof with a friction can ever close via the public API.
2. **Fix Finding #2 (verb-arg shape mismatch).** Add an `argShape` field to `OPERATION_SPECS` and have `runOperation` shape-check against it instead of conflating arg shape with element-id shape. Audit `PRESENT_CLOSING_ARGUMENT`, `CONFIRM_CLOSURE_GO`, and `OPEN_PROOF` for the same conflation while you're there.
3. **Resolve Finding #3 (sourceConstraint contract gap).** Pick a side: either delete the unused field with a comment explaining why DESIGNER is the only valid consent source for `addElement`, or wire `verifyConsent` to consult the per-category `sourceConstraint` (and per-category `authority.add` allowlist) so SYSTEM-shape frictions can be admitted through the documented public surface.
4. **Re-verify Finding #3 from the 2026-05-14 simulation** in this codebase: does `renderClosingArgument` honor the injected clock, or does it still use `Date.now()`? The current run shows `asOf: 1778889983862` which is a real-time `Date.now()` value, not the injected `1700000000` — suggesting the fix has not landed here.
5. **Add the per-category EDB inventory probe to the Domain test suite.** This run found that all 9 categories landed at least one fact, and that derived predicates fire for all 4 approval-gated categories. A property test that asserts "after `addElement` for each category, the corresponding EDB predicate has at least one row" would catch translator-table regressions cheaply.

---

## Methodology notes

- Real `Engine` from the design-proof-system + real `createDomainBridge` from the design-proof-system. No mocks beyond the four cross-cutting adapters (`clock`, `idAllocator`, `consentVerification`, `persistenceRepo`) which are correctly Domain-injected.
- Every action wrapped in `attempt(label, fn)` so failures are logged without halting the simulation. Yielded a 54-attempt full run.
- Bug isolation took one narrowing iteration (`probe-friction-disposition.mjs`) which surfaced the chained Findings #1 + #2 cleanly in five tests.
- All runs deterministic — same seed (constant clock, monotonic id allocator), same outputs.

## Provenance trailer

<!-- created-at: 2026-05-15T00:00:00Z -->
<!-- produced-by stress-test-calculator-proof-design-proof-system (one-off, no skill version) -->
