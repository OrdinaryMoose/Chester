# Sprint-02 Proof Layer — Plan-01 Threat Report

**Plan reviewed:** `sprint-02-proof-layer-plan-01.md`
**Spec:** `sprint-02-proof-layer-spec-02.md`
**Reviewers dispatched:** `chester:plan-build-plan-attacker` (unconditional) + `chester:plan-build-plan-smeller` (triggered by 4 of 5 smell-heuristic categories: DI/registration, async, persistence, new contract surfaces).
**Verified-anchor skip-list applied to attack:** Six substrate ports, Engine §4 method signatures, seven delivery ports, four cross-cutting adapters, §6.1 mutation flow, eight verbs, counterfactual §11.1/§11.2, ADR-0013 Parts 1/2/3, closed-set tag families, LOC envelope, read-own-writes (all verified at design stage per `sprint-02-proof-layer-spec-ground-truth-report-00.md`).

---

## Combined Implementation Risk Level: **Significant**

Five statements support this assessment:

1. **Four Critical test failures in plan-supplied code will block `npm test` on the first run.** None require design rework — they are concrete bugs with concrete fixes in plan-01's task bodies. But shipping plan-01 as-is means an implementer will hit them in the first execution hour.
2. **Three of the four Criticals were introduced or made visible by the plan-reviewer-loop patches.** The strengthened counterfactual spy test, the strengthened AC-3.4 verb loop, and the strengthened AC-11.1 render iteration each surfaced an underlying implementation bug that the weaker original tests masked. This is a *good outcome* for the reviewer loop, but it means the patches need their own pass to ensure the implementations they exercise actually work.
3. **The substrate fake is a load-bearing test substrate with two no-op behaviors and one wire-format divergence.** Its fixed-point evaluator is an empty stub (`_runFixedPoint() { /* trivial */ }`), so every derived-fact test passes vacuously. Its `_unify` accepts bare uppercase strings as variables (consistent with the Engine's `defineRule` translator but NOT with the Engine's `query` unifier). Many Domain modules pass bare uppercase strings to `query` and rely on the fake's permissive matching; the real Engine treats them as constants. Sprint-02's green-test signal does not validate sprint-03 integration.
4. **Two architectural smells create permanent dual-maintenance obligations.** `createDomainBridgeWith` is a near-clone of `createDomainBridge` (port-bundle construction, Phase A, validator sequence, Phase B template installation) with a throw-on-success contract that converts copy-paste hazard into runtime error without resolving the duplication. The `validPredicates` hardcoded predicate list is duplicated across both factories. Neither breaks correctness today; both will surface as friction at every future bridge-boot change.
5. **No findings warrant returning to design.** The plan's architectural shape — verb-as-data `OPERATION_SPECS`, four role-narrowed frozen port bundles, boot-time validator stack, two-phase rule registration with Phase B stratification gating — is structurally sound and matches spec-02. The findings are all at the task-implementation layer.

---

## Critical Findings (block first `npm test` run)

### CR-1: Fake `_unify` rejects `{var: 'name'}` objects produced by `_lowerWildcards` → counterfactual spy-based retract test fails

**Plan locations:** `inMemorySubstrate._unify` at plan-01.md:284–293; `_lowerWildcards` at plan-01.md:1633–1638; affected test at plan-01.md:1555–1580.

The fake's `_unify` branches: `'_'` (wildcard), `typeof pat[i] === 'string' && /^[A-Z]/.test(pat[i])` (uppercase-bare-string variable), constant otherwise. `_lowerWildcards` produces probe args like `{var: '__wv1'}` (per the Engine's `Unifier.js` wire format). Those objects fall through the string check and are compared as constants via `pat[i] !== fact[i]` — an object is never equal to a string constant, so every match fails.

The strengthened counterfactual test added during plan-reviewer round 1 ("collapseTest retracts matching facts inside snapshot scope") asserts `expect(prop1Retracts.length).toBe(2)` based on spy data. With the broken `_unify`, query returns `[]` and zero retracts fire. Test fails.

**Fix:** add an object-variable branch to the fake's `_unify` before the constant fallthrough:

```javascript
if (typeof pat[i] === 'object' && pat[i] !== null && typeof pat[i].var === 'string') {
  b[pat[i].var] = fact[i]; continue;
}
```

### CR-2: AC-6.1 render-read-only test does not reset the recorder after bridge construction → Phase A/B `defineRule` calls register as mutations

**Plan location:** plan-01.md:2886–2893.

The test creates a `createRecordingSubstrate()`, calls `createDomainBridge(...)` (which runs Phase A and Phase B, firing 7+ `defineRule` calls), then renders, then asserts `calls.filter(c => mutationMethods.has(c.method)).length === 0`. The `defineRule` calls from boot pollute the recorded calls before any render runs. The assertion fails unconditionally.

**Fix:** add `calls.length = 0` between bridge construction and the first render call (the AC-3.4 test at line 2762 already uses this pattern; mirror it).

### CR-3: AC-3.4 verb loop — six of eight verbs throw `SHAPE_INVALID` at step 3, never reach `tx.begin`

**Plan locations:** AC-3.4 loop at plan-01.md:2742–2793; `OPERATION_SPECS` at plan-01.md:1948–2023; EVIDENCE schema at plan-01.md:545–554.

The verb cases for `openProof`, `withdrawElement`, `ratifyElement`, `manageFriction`, `presentClosingArgument`, `confirmClosureGo` all pass args that fail `verifyArgsShape` (step 3) for their declared `idShape`. The `SHAPE_INVALID` throw fires before `tx.begin` (step 4), and the catch block silently swallows `DomainError` (line 2767). The new strengthened assertion `expect(txBeginAt).toBeGreaterThanOrEqual(0)` fails for six consecutive iterations.

This is compounded by Finding CR-5 (Important): `openProof` and `ratify` use `idShape: EVIDENCE` as a placeholder because the real category is dynamically resolved — so the args those verbs require don't match EVIDENCE's `['source', 'claim']` required fields.

**Fix options:**
- **(a) Make the verb-case args satisfy EVIDENCE's shape requirements** where the verb uses EVIDENCE as a placeholder. Pass `{source: 'codebase', claim: 'x', ...verb-specific-fields}` for `openProof`/`confirmClosureGo`/etc.
- **(b) Move the `tx.begin` assertion inside an `if (e.code !== 'SHAPE_INVALID')` guard** so verbs that fail shape are excluded from the ordering check — but this contradicts the spec AC-3.4 wording ("invokes each of the eight verbs ... records the actual sequence of port method calls").
- **(c) Re-architect `OPERATION_SPECS` so `openProof` and `ratify` use a sentinel idShape that resolves dynamically at runtime** — this is the proper structural fix but is larger than a plan-level patch.

Option (a) is the smallest delta that satisfies the spec. Recommended.

### CR-4: AC-11.1 render iteration test — `renderElementDeep({})` returns `null` → `expect(result).not.toBeNull()` fails

**Plan locations:** AC-11.1 loop at plan-01.md:2929–2941; `renderElementDeep` impl at plan-01.md:1460.

`renderElementDeep(args, readPorts)` short-circuits to `null` when `!args.id`. The loop calls each render method with `{}`, so `renderElementDeep` returns null and trips the assertion.

This is also compounded by Finding CR-7 (Important): `renderElementDeep`'s query uses `Array(5).fill('_')` (arity 6 including id) against facts whose arities are 2–4, so the method is structurally non-functional even with a valid `id`.

**Fix:** pass realistic per-method args in the loop. For `renderElementDeep`, pass `{id: 'evidence_1'}` (and ensure setup populates it). Additionally fix the arity bug in `renderElementDeep` itself (use per-predicate-arity wildcard patterns, not a fixed-width fill).

---

## Important Findings (latent sprint-03 integration hazards + correctness gaps)

### IM-1 (smell+attack convergence): Bare uppercase strings as query variables work against the fake, fail silently against the real Engine

**Plan locations:** `lifecycle.getRound` at plan-01.md:1067, 1074; `closure-policy` at plan-01.md:1183; `friction-policy` at plan-01.md:1273–1276; `render.js` at plan-01.md:1450–1497.

The Engine's `Unifier.unify` recognizes only `{var: 'X'}` objects as variables in query patterns. Bare uppercase strings are constants. The fake's `_unify` (plan-01.md:287–289) extends this convention to also accept uppercase-bare-strings as variables — convenient for the plan author, but a divergence from the real Engine.

Every module using bare uppercase strings in `query` patterns (lifecycle, closure-policy, friction-policy, render) will:
- Pass against the fake.
- Return `[]` against the real Engine (treating `'N'` etc. as literal constant strings).
- Silently produce wrong results in sprint-03 integration.

**Fix:** standardize all Domain query patterns to either `{var: 'NAME'}` for binding variables OR `'_'` for unbinding wildcards. Drop the fake's uppercase-string extension so the fake matches Engine behavior. Affects at least 7 query call-sites.

### IM-2 (smell): Substrate fake's fixed-point evaluator is a stub → every derived-fact test passes vacuously

**Plan location:** `_runFixedPoint() { /* trivial */ }` at plan-01.md:227.

The real `Evaluator.js` is a ~300-LOC semi-naive bottom-up evaluator with per-stratum evaluation and delta tracking. The fake's evaluator is an empty function. Every Domain test that asserts something about derived facts (closure-policy, friction-policy, mutations postconditions, bridge-integration AC-3.4 step ordering, AC-11.1's `projection.facts.length > 0`) silently sees an empty IDB.

**Fix options:**
- **(a) Implement a minimal but correct fixed-point evaluator in the fake** — perhaps 60–80 LOC of naive semi-naive evaluation. Adds substantive test value.
- **(b) Document the stub explicitly and mark all derived-fact tests as `it.todo` or `it.skip`** until sprint-03 wires the real Engine. Honest, but loses sprint-02's behavioral signal.
- **(c) Per-fixture stubbing** (the plan's current claim) — but no per-fixture stubbing is actually implemented in plan-01's test files.

Recommended: (a). The implementer should add a minimal evaluator in Task 1.

### IM-3 (smell): Snapshot port shape mismatch between fake (namespace object) and real Engine (flat methods)

**Plan locations:** fake `snapshotPort = {snapshot(), restore()}` at plan-01.md:167–183; bridge port-bundle construction at plan-01.md:2207 (`snapshot: engine.snapshot`).

The bridge constructs `probePorts.snapshot = engine.snapshot`. For the fake, that's a namespace object — callers do `probePorts.snapshot.snapshot()` and `probePorts.snapshot.restore(token)`. For the real Engine, `engine.snapshot` is a method (returns a snapshot token directly). Sprint-03 wiring requires either:
- An adapter at the bridge layer: `snapshot: { snapshot: () => engine.snapshot(), restore: (t) => engine.restore(t) }`.
- A refactor of the fake to match the real Engine's flat-method shape, plus a port-bundle convention change throughout the Domain.

Spec-02's "Engine public-surface signatures" section pins `ProbePorts.snapshot.snapshot() → token` / `ProbePorts.snapshot.restore(token)` (namespace form). That ratifies the fake's shape and implicitly mandates an adapter for the real Engine. The plan does not document the adapter as a sprint-03 deliverable.

**Fix:** add a note to plan-01's "Tech Stack" section: "Sprint-03 must wrap the real Engine's flat `snapshot()`/`restore()` methods into the namespace shape `{snapshot, restore}` that ProbePorts expects. This adapter is sprint-03 scope per the cascade's non-goals."

### IM-4 (attack CR-3 compound): `OPERATION_SPECS.openProof` and `.ratify` use EVIDENCE idShape as a placeholder

**Plan locations:** plan-01.md:1949–1958 (`openProof`), plan-01.md:1985–1994 (`ratify`).

Both verbs declare `idShape: ELEMENT_CATEGORIES.EVIDENCE` with comments explaining the placeholder. But `verifyArgsShape` enforces EVIDENCE's `['source', 'claim']` required fields on every call. Production callers (Interface in sprint-03) would have to pass dummy `source`/`claim` values that have no semantic meaning. This is a structural correctness gap — the verbs' contract doesn't match their behavior.

**Fix:** add a sentinel idShape (e.g., `NONE` or `PROOF_SESSION` for openProof; per-element dynamic resolution for ratify) and special-case the shape verification for these verbs. Or move the idShape determination into the `translate` function for these verbs and use a vacuous schema check.

### IM-5 (smell): `createDomainBridgeWith` is a permanent clone of `createDomainBridge` with throw-on-success contract

**Plan locations:** `createDomainBridge` at plan-01.md:2197–2273; `createDomainBridgeWith` at plan-01.md:2305–2365.

The two factories share: port-bundle construction, validator sequence, Phase A registration, `validPredicates` assembly, Phase B template installation. They diverge only in: which registry sources are used (overrides via parameter vs. hardcoded module imports), and whether the success path returns a facade (createDomainBridge does; createDomainBridgeWith throws).

The plan-reviewer-loop closed an empty-facade pitfall by converting `Object.freeze({})` into an explicit throw. This is an improvement (failures are loud, not silent), but the underlying duplication remains. Any boot-sequence change requires editing both factories.

**Fix:** refactor both factories to call a single `_buildBootedBridge({engine, adapters, registries, _buildFacade})` helper that takes the registry-source set as a parameter and a `_buildFacade` callback to produce the final facade. Then `createDomainBridge` passes the module-imported registries plus a real `_buildFacade` block; `createDomainBridgeWith` passes overrideable registries plus a `_buildFacade` that throws. Same amount of code, no duplication. Estimated ~30 LOC refactor.

### IM-6 (attack F8): Phase B annotation chain is split between `registerRuleTemplates` and `createDomainBridgeWith`'s inline loop

**Plan locations:** annotation in `registerRuleTemplates` at plan-01.md:849–860; `createDomainBridgeWith` inline loop at plan-01.md:2342–2356.

`registerRuleTemplates` annotates throws with `templateId` and `ruleId`. `createDomainBridgeWith` does NOT call `registerRuleTemplates` — it has its own inline loop with its own per-template catch that sets `recordId: templateId`. The two paths happen to produce the same `recordId` value, so AC-4.3 and AC-5.1 tests pass against either. But the annotation chain is inconsistent and a future refactor consolidating these into one helper could lose the contract.

**Fix:** addressed by IM-5's refactor (single helper means single annotation chain).

---

## Minor Findings

### MN-1 (attack F10): `createDomainBridgeWith` Phase A could throw `DUPLICATE_RULE_ID` from real Engine on a reused substrate

**Plan location:** plan-01.md:2329–2332.

The real `RuleStore.defineRule` throws `{code: 'DUPLICATE_RULE_ID'}` on a duplicate; the fake silently overwrites. No current test reuses a substrate across bridge calls, so the bug is invisible today. Future tests that share a substrate would surface it.

**Fix:** none required for sprint-02. Document the constraint in `createDomainBridgeWith`'s JSDoc.

### MN-2 (smell F4): `validPredicates` hardcoded predicate list duplicated across both bridge factories

**Plan locations:** plan-01.md:2228 (createDomainBridge), plan-01.md:2335 (createDomainBridgeWith). Ten predicate names duplicated.

**Fix:** addressed by IM-5's refactor. Or: derive Phase-A rule heads dynamically from the rule store after `registerStatic` completes (real `RuleStore.allRules()` exposes this).

### MN-3 (smell F6): Brittle regex-based JSDoc structural tests

**Plan locations:** `facade-jsdoc.test.js` at plan-01.md:2636–2644; `facade-shape.test.js` at plan-01.md:2557–2565.

The JSDoc test uses a 400-character window before each method name to check for `@param`/`@returns`/`@throws` tags. The 400-char window is a magic number with no spec backing. The facade-shape regex matches only specific formatting styles. Both can produce false-passes or false-failures with formatting changes.

**Fix:** none required for sprint-02. AST-based verification is explicitly out of scope per spec Non-Goals. Document the formatting constraints in the test file's header.

### MN-4 (smell F7): `runOperation` rollback could double-throw on real-Engine `STALE_HANDLE` from a failed commit

**Plan location:** plan-01.md:2086–2097.

The real Engine's `commit(handle)` calls `_assertHandleValid` which throws `STALE_HANDLE` if `_tx === null`. A failed commit attempt would leave `_tx` invalid; calling `rollback(handle)` in the catch block would then throw `STALE_HANDLE` again, masking the original error.

**Fix:** wrap `rollback(tx)` in a try/catch inside the outer catch:
```javascript
} catch (err) {
  if (!(err instanceof POST_COMMIT_SAVE_FAILED)) {
    try { ports.tx.rollback(tx); } catch { /* tx already gone — original err is the one to surface */ }
  }
  throw err;
}
```

### MN-5 (attack F6): Fake's `_checkStratification` keys by bare predicate; real `Stratifier.js` keys by `predicate/arity`

**Plan locations:** fake at plan-01.md:254–271; real `Stratifier.js` lines 9, 22–24.

For sprint-02's content (no overloaded-arity predicates), the keys coincide. A future rule set with the same predicate at two arities would see different cycle-detection behavior between fake and real Engine.

**Fix:** none required for sprint-02. Worth noting in the fake's stratification-detector comment.

---

## Recommendation

**Proceed with directed mitigations.** The four Criticals are concrete plan-supplied-code bugs with concrete fixes (no design rework). Three of them are byproducts of the strengthened tests added during the plan-reviewer loop — fixing them validates that the strengthened tests are buying real coverage rather than papering over silent passes. The Important findings are latent integration hazards that should be addressed before sprint-03 wiring; some can be done as part of execute-write, some are sprint-03 scope.

Directed mitigations the operator should request before invoking `execute-write`:

1. **Critical batch:** apply fixes for CR-1 (`_unify` object-variable branch), CR-2 (`calls.length = 0` reset in AC-6.1), CR-3 (verb-case args satisfy idShape requirements), CR-4 (`renderElementDeep` args + arity fix). Estimated: 1–2 plan edits.
2. **Important batch (recommended in plan-01):** apply IM-1 (standardize query variable format) and IM-3 (snapshot adapter note). Defer IM-2 (fake fixed-point) and IM-5 (factory refactor) decisions to the operator — both improve quality but expand sprint-02 scope.
3. **Minor batch:** apply MN-4 (rollback double-throw guard) since it's a 3-line plan edit. Defer the rest.

---

## Provenance Trailer

<!-- created-at: 2026-05-14T07:00:00Z -->
<!-- combined report from plan-attacker + plan-smeller dispatch -->
<!-- produced-by plan-build@v0004 -->
