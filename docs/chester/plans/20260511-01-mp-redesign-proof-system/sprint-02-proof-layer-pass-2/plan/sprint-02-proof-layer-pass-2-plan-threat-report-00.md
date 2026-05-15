# Plan Threat Report: sprint-02-proof-layer-pass-2-plan-00

**Plan reviewed:** `plan/sprint-02-proof-layer-pass-2-plan-00.md`
**Spec context:** `spec/sprint-02-proof-layer-pass-2-spec-03.md`
**Reviewers:** `chester:plan-build-plan-attacker` + `chester:plan-build-plan-smeller` (both dispatched in parallel; smell triggered by "new contract surfaces" heuristic — 4 new bridge entry points + 2 new Datalog rules)

## Combined Implementation Risk Level: Significant

The plan has two CRITICAL structural defects that will produce code which compiles but whose verification step does not verify intent. Both defects are concrete and fixable inside the plan (not the spec or architecture). Three MEDIUM findings around TDD discipline, stub coverage, and test-rationale accuracy are tactical, not architectural. A handful of LOW findings document accepted trade-offs from spec discipline.

## Reasoning

1. **Task 5's primary verification surface is broken.** The plan's six closure-policy derivation tests (AC-4.1, AC-4.2, AC-4.3) call `s.query.derive()` against the in-memory substrate fixture at `__tests__/_fixtures/inMemorySubstrate.js`. That substrate's `_runFixedPoint` at line 126 is an empty function with a comment placeholder — it never populates the `derived` IDB map. Every `s.query.exists(['covered', ...])`, `exists(['unaddressed_concern', ...])`, and `exists(['closure_permitted', []])` call against the substrate returns `false` regardless of what rules and facts are asserted. Tests expecting derivation to succeed will fail; tests expecting NOT to derive will spuriously pass even if the rule is wrong. The plan needs Task 5 to use the real Engine import (`import('../../engine/Engine.js')` per the working pattern at `bridge-integration.test.js:37`) rather than `createInMemorySubstrate()`.

2. **Task 7's lifecycle test will throw `SHAPE_INVALID` at the ratify step.** `mutations.js:119` runs `verifyArgsShape(args, targetShape)` on every operation including ratify. With `targetShape = 'concern'` (pinned by `ratifyConcern` or set via `args.idShape: 'concern'` in `ratifyElement`), the check fails because `CATEGORY_REGISTRY['concern'].requiredFields = ['label']` and the ratify args supply only `{ elementId, idShape }`. The existing working test at `bridge-integration.test.js:49-50` uses generic `ratifyElement` without pinning idShape and passes dummy `source` + `claim` fields to satisfy EVIDENCE's required check. The dedicated `ratifyDefinition` wrapper at `domain-bridge.js:92` is latently broken in the same way — it pins `idShape: 'definition'` which triggers `verifyArgsShape` against `['term', 'definition']` that callers don't supply. There is no existing test that exercises `ratifyDefinition`; the plan-attacker discovered this gap is pre-existing.

3. **`createDomainBridgeWith` ends with a deliberate `throw` at `domain-bridge.js:185`.** This is a test-only factory used by `bridge-integration.test.js:170-247` to inject corrupted registries for AC-4.x boot-validator tests. The plan adds four new CONCERN bridge methods to `createDomainBridge` but does NOT extend `createDomainBridgeWith`. The spec discipline ("no abstraction introduction") forbids extracting a shared `_buildFacade` helper. The result is acceptable for this sprint — the `createDomainBridgeWith` throw is a pre-existing gap whose error-path tests don't reach a facade call, and no AC requires CONCERN to be present in that test-only factory's facade. But the divergence is now wider by four methods.

4. **Task 6's AC-2.2 smoke test rationale is technically wrong.** The plan claims the boot would fail with a `validateOperationSpecs` throw on Phase-A rule head atoms if `validPredicates` were missing entries. `validateOperationSpecs` actually only validates OPERATION_SPECS `preconditions`/`postconditions`, not rule head atoms (`boot-validators.js:32`). The test still passes (`makeTestBridge()` doesn't throw) but for a different reason than the plan states. Cosmetic.

5. **Task 4 has no truly-red TDD step.** Step 1's test passes immediately because Task 3's `RULE_TEMPLATES[CONCERN]` entry is already in place. The "failing test" is described as a code-reading exercise. The real red-to-green transition is in Task 7's lifecycle test, which itself is blocked by issue #2. Plan acknowledges this but breaks the five-step TDD discipline.

## Smell Heuristic Triggers Matched

- **New contract surfaces** — 4 new bridge entry points (`addConcern`/`reviseConcern`/`ratifyConcern`/`withdrawConcern`) + 2 new Datalog rules (`covered_rule` + `unaddressed_concern_rule` body fix). plan-smell fired on this trigger.
- Other triggers (DI registrations, new abstractions, async/concurrency, new persistence pathways): no match.

## Findings Detail

### plan-attack findings

- **CRITICAL-A: `_runFixedPoint` is a no-op stub.** Evidence: `inMemorySubstrate.js:126`. Impact: Task 5's 6 derivation tests + Task 7's second lifecycle test produce false signals. Resolution: revise Task 5 and Task 7 to import the real Engine (sibling `engine/Engine.js`), pattern from `bridge-integration.test.js:37-38`.

- **CRITICAL-B: `verifyArgsShape` throws on ratify with pinned `idShape: 'concern'`.** Evidence: `mutations.js:119` + `schema.js:79-83`. Impact: Task 7's ratify step fails before exercising derivation. Resolution: Task 7 uses generic `ratifyElement({ elementId, source: 'designer', claim: '_' })` with dummy fields satisfying EVIDENCE's required check (matching `bridge-integration.test.js:49-50` working pattern); document the latent `ratifyConcern` brokenness as a known issue inherited from `ratifyDefinition` (Decision recorded at execute-write time).

- **MEDIUM-C: Task 6 AC-2.2 smoke test cites wrong validator.** Evidence: `boot-validators.js:32`. Impact: test passes for the wrong reason; doesn't actually verify what its comment claims. Resolution: replace the rationale comment with the correct one (the smoke test confirms `validateRuleTemplates` and Phase-A `registerStatic` succeed without throwing, which depends on `validPredicates` containing rule-head predicates — not OPERATION_SPECS validation).

- **MEDIUM-D: Task 4 has no truly-red TDD step.** Evidence: plan Task 4 Steps 1-2. Impact: TDD discipline broken; gap acknowledged by plan but unfixed. Resolution: keep the structure but tighten the framing — Task 4 is a single-line list mutation whose verification is end-to-end via Task 7's lifecycle test (once Task 7 is fixed per CRITICAL-B).

- **LOW-E: `validPredicates` omits `closure_failure_reason` (pre-existing).** No action. Plan inherits, doesn't worsen.

- **LOW-F: Stratification order recommendation is moot.** Evidence: substrate stratification check is cycle-based, not order-based (`inMemorySubstrate.js:127-181`). Impact: plan's Implementation Notes line is misleading but harmless. Resolution: drop the registration-order recommendation; replace with a note that the substrate's stratifier is cycle-based.

### plan-smell findings

- **MEDIUM-G: Duplicated `validPredicates` for-loop at `domain-bridge.js:47` and `:155`.** Pre-existing pattern. Plan extends both correctly. Resolution: leave as-is; flag for a follow-up sub-sprint that introduces a single source of truth (out of scope for this sprint per spec discipline).

- **MEDIUM-H: `createDomainBridgeWith` stub throw + new methods only in `createDomainBridge`.** Evidence: `domain-bridge.js:185`. Impact: described in Reasoning #3. Resolution: explicitly accept the divergence as a known issue; the plan does not extend `createDomainBridgeWith`; the AC-4.x error-path tests are unaffected because they fail before facade construction.

- **LOW-I: `covered` added to `validPredicates` for-loop but not `EDB_PREDICATES`.** Correct behavior (IDB vs EDB). Plan's split is appropriate. No action.

- **LOW-J: Phase-C dispatch list at `mutations.js:133` duplicates `RULE_TEMPLATES` keys.** Pre-existing structural weakness. Plan extends correctly. Watch for fan-out as more approval-gated categories are added.

- **LOW-K: `concern-schema.test.js` accumulates across modules.** Plan structure; spec mandates one new test file. Accept as is.

- **LOW-L: `covered_rule` couples to `addresses/2` arity (matching `translation.js:45` not cascade §7.2's `addresses/3`).** Acknowledged in plan Implementation Notes and spec AC-4.3. Accept.

## Recommended Mitigations Before Execution

Before dispatching `execute-write`, revise the plan to address the two CRITICAL findings and the most material MEDIUM ones. Concretely:

- **Revise Task 5** to use the real Engine via `import('../../engine/Engine.js')` (matching `bridge-integration.test.js:37-38`'s pattern). Build a small helper (`makeRealEngineBridge`) that boots a real Engine + the existing test allocator/clock/consent/persistence fakes. Update all 6 derivation tests to use this helper.
- **Revise Task 7** to use `bridge.ratifyElement({ elementId, source: 'designer', claim: '_' }, ...)` (the working pattern) instead of `ratifyConcern`. Document `ratifyConcern`'s latent SHAPE_INVALID throw as a known issue (inherited from `ratifyDefinition`) and a Decision for execute-write to record.
- **Tighten Task 6 AC-2.2 test rationale** — replace the misleading `validateOperationSpecs` claim with the correct path (Phase-A `registerStatic` would fail if `closure-policy.js` rule heads aren't in `validPredicates`).
- **Drop the stratification registration-order note** from Implementation Notes.
- **Add a Known Issues section** to the plan documenting LOW/MEDIUM residuals: `createDomainBridgeWith` stub remains, `ratifyConcern` latently broken (mirrors pre-existing `ratifyDefinition`), `validPredicates` duplication at two sites unresolved.

After mitigations, **no re-run of plan-attack or plan-smell** is strictly required — the mitigations are tactical fixes to known issues, not architectural changes. If desired, a one-pass re-run on the revised plan can confirm the CRITICAL items are resolved.

<!-- created-at: 2026-05-15T08:37:57Z -->
<!-- produced-by plan-build@v0004 -->
