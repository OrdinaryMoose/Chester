# Deferred Items — sprint-01-proof-backend

Items surfaced during execute-write that are out of scope for the active task but should be addressed before sprint close or in a follow-up sub-sprint. Reviewed at finish.

---

## D1 — Tighten "constant" definition to exclude non-finite numbers

**Date:** 2026-05-11
**Source task:** Task 2 (FactStore)
**Discovered during:** quality review of commit `d27e0ca`

**Description.** The spec, plan, and engine-spec text define constants as `string, number, boolean, null only`. In JavaScript, `typeof NaN === 'number'` and `typeof Infinity === 'number'` are true, so the literal reading admits non-finite numbers as constants. However, `JSON.stringify` serializes `NaN`, `Infinity`, and `-Infinity` all as `null`, which causes silent fact-key collisions between e.g. `assertFact('p', [NaN])` and `assertFact('p', [null])`. The collision propagates into the Evaluator (Task 6) as wrong-result joins.

**Resolution applied to code (Task 2).** `FactStore.isConstant` was tightened during execute-write to additionally require `Number.isFinite(v)` for numeric arguments. Three new tests assert that `NaN`, `Infinity`, and `-Infinity` are rejected with `TYPE_ERROR`. This deviation from the plan-prescribed source was explicitly authorized by the operator. See commit on `sprint-01-proof-backend` after `d27e0ca`.

**Outstanding documentation work (deferred).** The following artifacts still carry the looser phrasing and should be updated before sprint close so the spec → plan → code chain is internally consistent:

1. **Sprint spec** — `sprint-01-proof-backend/spec/sprint-01-proof-backend-spec-00.md`, "Error Handling" section, `TYPE_ERROR` description line. Change `constants are string, number, boolean, null only` to `constants are string, finite number, boolean, null only` (or equivalent wording that explicitly excludes `NaN`, `+Infinity`, `-Infinity`).
2. **Plan** — `sprint-01-proof-backend/plan/sprint-01-proof-backend-plan-00.md`, Task 2 Step 3 (FactStore.js source), and Step 1 (operations.test.js source). Update both to reflect the corrected `isConstant` definition and the additional NaN/Infinity rejection tests. Bumps the plan to `-01.md`.
3. **Engine spec** — `design-documents/04-engine-spec.md`, wherever the constant set is enumerated. Apply the same "finite number" tightening.

**Why deferred.** The corrective code change is small, surgical, and prevents downstream wrong-result corruption; it had to happen now to keep Task 6 (Evaluator) on solid ground. The accompanying documentation edits, while necessary for artifact correctness, are not on the critical path of any remaining sprint task — they can be batched as a small spec/plan revision before `finish-write-records`.

**Acceptance for closure.** All three artifacts above contain the tightened phrasing; the code (already corrected) continues to match.

---

## D2 — Enforce safety condition on rule heads (head vars ⊆ body vars)

**Date:** 2026-05-11
**Source task:** Task 6 (Evaluator)
**Discovered during:** quality review of commit `cce5a4a`

**Description.** A rule whose head references a variable that does not appear in any non-negated body atom (an "unsafe" rule in Datalog terminology) causes `substituteArgs` to return `undefined` for that position. The Evaluator then computes `factKey('q', ['a', undefined])`, which `JSON.stringify` serializes as `"q/2:["a",null]"` — silently colliding with the key for a legitimately-null-valued fact `q(a, null)`. The IDB ends up with poisoned entries whose stored `args` array contains `undefined` but whose Map key implies `null`, and downstream `unify` calls produce nondeterministic results because `undefined !== anything` even for matches the key implies should succeed.

This is the same shape as D1 (silent key collision via `JSON.stringify`), but at the **IDB write path** rather than the **EDB write path**, and triggered by **malformed rules** rather than **valid arguments**.

**Resolution applied to code (Task 6).** Added a one-line guard at the top of `fireRule` (after `substituteArgs` produces `headArgs`): if any element of `headArgs` is `undefined`, throw `{ code: 'UNBOUND_HEAD_VARIABLE', ruleId, message }`. A new test in `evaluation.test.js` constructs an unsafe rule and asserts the guard fires. This is defense-in-depth at the derivation boundary — it surfaces the bug at `derive()` time rather than producing a poisoned IDB entry. Authorized deviation from plan-prescribed source.

**Outstanding work (deferred).** The Evaluator guard is a backstop; the canonical fix is at `RuleStore.defineRule`. Specifically:

1. **RuleStore safety check.** `RuleStore.defineRule` should reject unsafe rules at definition time, the same way it rejects malformed-shape rules with `MALFORMED_RULE`. The check: compute the set of variable names bound by non-negated body atoms; require head variables (the set of `args[i].var` values where `args[i]` is a variable term) to be a subset. Reject with `{ code: 'UNSAFE_RULE', ruleId, unboundVars: [...] }` (or extend `MALFORMED_RULE` — design call).
2. **Spec update.** `sprint-01-proof-backend/spec/sprint-01-proof-backend-spec-00.md`, "Error Handling" section, add the new error code (or amend `MALFORMED_RULE`'s description to include unsafe-rule rejection). The engine spec `design-documents/04-engine-spec.md` should also explicitly state the safety condition.
3. **Plan update.** Task 4's RuleStore plan source should be amended to include the safety check, and Task 6's Evaluator source should be amended to include the runtime guard (since the spec/plan currently prescribe the unsafe versions). Both bumps would push the plan to `-01.md`.
4. **Test coverage.** RuleStore test block in `operations.test.js` should add an explicit case for unsafe-rule rejection at definition time. The Evaluator's guard test (added during this resolution) stays as defense-in-depth.

**Why deferred.** The Evaluator backstop is sufficient to prevent silent corruption now; the deeper RuleStore fix is a Task 4 amendment that disturbs task ordering and requires re-running Task 4's reviews. The Domain layer (sprint-02) generates rules programmatically and is expected to emit safe rules, so the operational risk is bounded. The spec/plan/engine-spec text updates batch naturally with D1's documentation work before `finish-write-records`.

**Acceptance for closure.** RuleStore validates the safety condition at `defineRule`; spec/plan/engine-spec text canonicalizes the safety requirement; the Evaluator guard remains as defense-in-depth or is removed if redundant.

---

## D3 — Negation must existentially quantify unbound atom variables

**Date:** 2026-05-11
**Source task:** Task 8 (canonical Datalog tests) — exposed defect in Task 6 (Evaluator)
**Discovered during:** test run of AC-9.4 (negation interacting with retraction)

**Description.** The plan-prescribed `Evaluator.matchBodyAtom` negation branch substituted bound variables into the atom pattern via `substituteArgs(atom.args, currentBindings)` and then unified the result against each fact. For a negated atom with unbound variables (e.g. `¬ancestor(X, Y)` where `X` is bound but `Y` is unbound), `substituteArgs` returned `['a', undefined]`, and the Unifier — correctly per its contract — treated `undefined` as a constant. Unification against any fact with a non-`undefined` second position failed, so the negation reported "no matching fact" and erroneously succeeded.

Standard Datalog semantics require unbound variables in negated body atoms to be **existentially quantified**: `¬p(X, Y)` with X bound means "there is NO Y such that p(X, Y) holds." The test case `leaf(X) :- node(X), ¬ancestor(X, Y)` is a textbook example — with `parent(a, b)` asserted (and therefore `ancestor(a, b)` derived), `leaf(a)` should NOT be derivable because `ancestor(a, Y)` succeeds for `Y = b`. The buggy implementation derived `leaf(a)` anyway. The same shape is present in any negated-atom rule with unbound body variables.

**Resolution applied to code (Task 8).** Replaced the substitute-then-unify approach with a direct-unify-then-consistency-check approach: for each candidate fact, run `unify(atom.args, factArgs)` to get fresh bindings (which treats unbound atom variables as fresh — matching any value), then check that the fresh bindings are consistent with `currentBindings` (no variable bound to two different values). Any consistent match means the inner atom holds for some binding, so the negation fails. The fix is in the `if (atom.negated)` branch of `Evaluator.matchBodyAtom`. Authorized deviation from plan-prescribed source.

AC-9.4 test now passes; the prior 5 fixed-point tests and AC-9.1/9.2/9.3 canonical tests remain green.

**Outstanding work (deferred).**

1. **Plan update.** Task 6's plan source (lines 1003–1014 of plan -00) prescribes the buggy negation branch. The plan should be amended to the corrected source. Bumps plan to `-01.md`.
2. **Engine spec update.** `design-documents/04-engine-spec.md`, §3 or §7 (wherever NAF semantics are documented), should explicitly state that unbound variables in negated body atoms are existentially quantified. Sprint spec text should mirror.
3. **Test coverage.** The existing AC-9.4 case is enough to lock down the regression. Optional: add a small unit test directly against `matchBodyAtom`'s negation branch with mixed bound/unbound variables. Low priority.

**Why deferred.** The code fix is small, surgical, and immediately restores canonical Datalog semantics — it had to happen now or Tasks 14 (property tests) and 15 (stress tests) would silently produce wrong results. The documentation updates batch naturally with D1 and D2 before `finish-write-records`.

**Side observation (not a defect).** With the corrected negation, the canonical AC-9.1 `same_gen` query still produces self-pairs (X = X) and "ordered" pairs that the loose `toContain('b-c')` / `toContain('d-e')` assertions tolerate. Strict same-generation semantics would require an `X ≠ Y` builtin (out of scope for this sprint per spec §"out of scope"). Either rewrite the test to be strict (which would also require the engine to support inequality), or leave the rule semantics as-is and accept the looser test. Recommendation: leave as-is and document in the test header that `same_gen` here admits self-pairs because pure Datalog without inequality cannot exclude them.

**Acceptance for closure.** Plan and engine-spec text describe existential-quantification semantics; AC-9.4 test continues to pass; D3 closes.

---

## D4 — `loadFrom` atomicity gap for mid-replay failures

**Date:** 2026-05-11
**Source task:** Task 11 (Serializer)
**Discovered during:** quality review of commit `1b8b74f`

**Description.** The plan-prescribed `loadEngineFrom` validates schema (shallow) then calls `engine.clear()` and replays facts/rules via the public `assertFact` / `defineRule` API. If any replay step throws — e.g. `TYPE_ERROR` on a fact with `NaN`, `MALFORMED_RULE` / `DUPLICATE_RULE_ID` / `CYCLIC_NEGATION` / `UNBOUND_HEAD_VARIABLE` on a rule — the engine is left in a partially-loaded state. The spec's AC-7.3 promises "engine state is unchanged from before the failed `loadFrom` call" unconditionally — the implementation only honored that for shallow-schema failures.

**Resolution applied to code (Task 11).** Wrapped the replay in `engine.snapshot()` before `engine.clear()` plus a try/catch that calls `engine.restore(rollback)` and rethrows. The Task-10 snapshot/restore facility makes the fix mechanically trivial. Added a new lifecycle test (`'loadFrom is atomic on mid-replay failure — prior state preserved (AC-7.3)'`) that constructs a tampered payload with `NaN` in a fact arg, asserts the throw, and verifies prior engine state (original facts AND rules) is preserved. Authorized deviation from plan-prescribed source.

58/58 green after the fix.

**Outstanding work (deferred).**

1. **Plan update.** Task 11's plan source (lines 1953–1960) prescribes the non-atomic replay. The plan should be amended to include the snapshot/restore wrapper. Bumps plan to `-01.md`.
2. **Spec/engine-spec.** Confirm AC-7.3's wording matches the new behavior. If the spec authors intended a narrower guarantee (atomicity only for shallow-schema failures), the code should be reverted and the AC tightened — but the natural reading favors the broader atomicity, which the code now honors.
3. **Test coverage.** The new mid-replay-failure test covers the TYPE_ERROR path; could optionally add cases for CYCLIC_NEGATION and DUPLICATE_RULE_ID mid-replay. Low priority — the snapshot/restore mechanism is shared.

**Side observation (not part of D4).** Quality review also flagged that `serializeEngine` reaches into `engine._facts` and `engine._rules` (private-by-convention fields). When Task 12 (Transactions) introduces a transaction-buffered fact view, Serializer may need to consult the committed-only view, not whatever `_facts` happens to point to during a transaction. Track in Task 16 audit.

**Acceptance for closure.** Plan source matches the snapshot/restore wrapper; AC-7.3 wording confirms atomicity contract; test continues to pass.

---

## D5 — Evaluator IDB indexing architecture (raised to design-level deferment)

**Date:** 2026-05-11 (filed); 2026-05-12 (escalated)
**Source task:** Task 14 (property tests) surfaced the symptom; Task 15 (stress tests) confirmed the deeper architectural gap
**Discovered during:** termination test (N=100) ran ~9s; AC-11.2 (N=1000) hung; partial fix attempt revealed insufficiency

### Symptom

`Evaluator.matchBodyAtom` iterates `derived.values()` and filters by predicate/arity, producing an O(IDB-size) linear scan **per body atom per iteration**. For the recursive transitive-closure rule `ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y)`:

- N=100: ~9 seconds (~5050 ancestor facts derived)
- N=1000: hangs (extrapolated ~2.5 hours; ~500500 ancestor facts)
- AC-11.2 stress test cannot pass under the current Evaluator

### Why this is architectural, not coding

The plan-prescribed Evaluator uses `Map<factKey, fact>` for the IDB. That's correct for **set semantics** (no duplicate derivations) but provides **no efficient join lookup**. The Engine spec §3.1 says "semi-naive bottom-up" but does not specify how the IDB should be indexed for the recursive-rule join hot path.

Compare to the EDB: `FactStore` already has `_positionalIndex: Map<predKey, Array<Map<value, Set<factKey>>>>` — a per-position index that gives O(matching-facts) lookups via `factsMatching(predicate, arity, position, value)`. The IDB lacks the equivalent. The Evaluator's `matchBodyAtom` also never calls `factsMatching` even for the EDB side of the join — it iterates `allFacts(...)` and filters via `unify`. Both the EDB and IDB paths waste the existing FactStore index.

### Pre-mortem of attempted fixes during this sprint

**Attempt 1 (Task 14 recalibration).** Loosened the test bound from 5000ms to 15000ms. Code unchanged. Restored test green. Did not address the underlying cost; would not help AC-11.2.

**Attempt 2 (partial D5 fix dispatched during Task 15).** Added a `Map<predKey, Set<factKey>>` per-predicate index to the Evaluator's `derive()` loop. Updated `matchBodyAtom` to iterate the predicate bucket instead of `derived.values()`. Tests run after the change: N=100 termination still took ~8 seconds — the partial fix did not measurably help.

**Why attempt 2 failed.** In the transitive-closure workload, every derived fact has the same predicate (`ancestor`). The per-predicate bucket IS the entire IDB. Filtering by predicate provides zero discrimination. **What's needed is per-position indexing** — when joining `ancestor(Z, Y)` with Z bound to a specific value, look up only the ancestor facts whose first arg equals that Z value.

Attempt 2 was reverted before commit. No partial-fix code is in `Evaluator.js` as of D5's escalation date. The sprint baseline is the original plan-prescribed Evaluator (with the D1/D2/D3 surgical fixes applied).

### The real fix (architectural sketch)

**Data structure.** Replace `derivedIndex: Map<predKey, Set<factKey>>` (the partial-fix shape) with `derivedPositionalIndex: Map<predKey, Array<Map<value, Set<factKey>>>>` — mirroring `FactStore._positionalIndex` exactly. Outer Map keyed by `${predicate}/${arity}`. Inner array length = arity. Each `Map<value, Set<factKey>>` indexes facts whose `args[position] === value`.

**Maintenance in `fireRule`.** Every `derived.set(fk, fact)` is paired with a positional-index update — for each `i in [0..arity)`, insert `fk` into `positions[i].get(args[i])`'s bucket.

**Lookup in `matchBodyAtom`.** Before falling back to a full predicate-bucket scan:
1. Identify atom-arg positions that are *already bound* (either a constant in the pattern, or a variable bound in `currentBindings`).
2. For each such (position, value) pair, look up `positions[position].get(value)` to get a `Set<factKey>` candidate set.
3. Intersect the candidate sets across bound positions. Iterate only the intersection.
4. Fall back to predicate-bucket scan if no positions are bound.

**Apply to the EDB side too.** `matchBodyAtom`'s EDB path currently calls `factStore.allFacts(...)` and filters via `unify`. The same bound-position analysis should call `factStore.factsMatching(predicate, arity, position, value)` for each bound position and intersect. FactStore's index already exists; the Evaluator just isn't using it.

### Risk catalog for the real fix (from session analysis)

| Risk | Severity | Mitigation |
|---|---|---|
| Bucket intersection edge cases (empty set, single-bucket, all-wildcard atom) | High — subtle correctness | Property tests + targeted unit tests for intersection logic |
| Repeated variables in atom (e.g. `p(X, X)`) | Medium — could under- or over-filter | Defer index lookup when same variable appears twice; let `unify` handle equality |
| Negation branch's existential semantics (D3 fix already in place) | High — different "any match" vs "all match" pattern | Reuse positional lookup for "is there ANY consistent match" via `bucket.size > 0` shortcut |
| Duplicates FactStore's positional-index design | Medium — code duplication, two parallel implementations | Audit may recommend factoring out a shared `PositionalIndex` utility |
| Evaluator becomes stateful across `fireRule` and `matchBodyAtom` boundaries | Low — index lives inside one `derive()` call | Pass index as a parameter; do not store as instance field |
| Memory cost of carrying the positional index per derive() call | Low — same shape as FactStore, similar overhead | Budget into existing AC-11.2 cost analysis |
| Sprint-2 Domain layer may want a different access pattern | Medium — Domain hasn't been built yet | This is the strongest argument for letting Task 16 audit defer the decision until Domain reveals real workloads |

### Alternatives considered

1. **Skip-with-deferment (chosen for this sprint).** Mark AC-11.2 as `it.skip`. Document architectural gap fully. Let Task 16 audit OR sprint 2's design-specify pass evaluate the right fix.
2. **Per-predicate index (rejected — implemented and reverted).** Insufficient when one predicate dominates the IDB.
3. **Per-position index (the real fix, NOT applied this sprint).** ~85 lines across Evaluator.js; medium correctness risk on negation and intersection paths; deeper plan deviation than other D-items.
4. **Recalibrate AC-11.2 to N=200 (offered, not chosen).** Spec deviation; weakens the test contract.
5. **Switch Evaluator algorithm entirely (e.g., magic sets, hash join).** Out of scope for this sprint; would require a fresh design-large-task pass.

### State of sprint 1 at D5's escalation

- Evaluator.js: original plan-prescribed source with D1, D2, D3 surgical fixes applied. The partial D5 attempt was reverted before commit.
- `__tests__/properties.test.js` (Task 14): 100-element termination test with 15s bound + 20s vitest timeout. Passes.
- `__tests__/stress.test.js` (Task 15): 3 active tests (AC-11.1, AC-11.3, AC-11.4) all pass. AC-11.2 is `it.skip` with a comment referencing D5.
- Engine spec §3.1: makes no claim about per-position IDB indexing. The performance contract is implicit. A spec amendment is part of D5 closure.

### Acceptance for closure

1. Evaluator's IDB carries a per-position index equivalent in shape to `FactStore._positionalIndex`.
2. `matchBodyAtom` uses bound-position intersection on BOTH the EDB side (via `factStore.factsMatching`) and the IDB side (via the new index).
3. AC-11.2 (`it.skip` removed) passes within its 60s budget. Expected time: well under 1s.
4. The 100-element termination test (`properties.test.js`) is tightened back to 5000ms and passes.
5. The negation branch (D3 fix) continues to behave correctly under the new lookup path — all canonical AC-9.* tests stay green.
6. Engine spec §3.1 amended to record the indexing contract (or an ADR added).
7. The audit task (Task 16) — or a subsequent sprint — reviews whether the implementation matches the architectural sketch above.

### Recommended channel for closure

Task 16 (Failure-mode and architectural compliance audit) is the canonical place for an architectural-level decision. The audit can recommend any of:

- **Apply the per-position index now** as a focused refactor before sprint 1 merge.
- **Open a follow-up sprint** scoped to "Evaluator performance and indexing architecture" with a fresh design-large-task pass (cleaner if Domain layer's workload patterns will inform the design).
- **Defer further** to sprint 2's design-specify (when Domain reveals actual join shapes).

The audit subagent should inherit this full D5 entry as the architectural brief.

### Why escalated from "deferred minor optimization" to "design-level deferment"

The original D5 entry framed this as a coding-detail optimization with a one-paragraph fix sketch. The escalation surfaces:

1. The plan and engine spec UNDER-SPECIFIED the indexing requirement — this is a spec/plan gap, not just code.
2. The simple fix sketched in the original D5 entry was implemented and proved insufficient — the problem is genuinely architectural.
3. The five surgical D-items (D1–D5) collectively signal that the plan's Evaluator block didn't get enough adversarial review during plan-build. A future sprint may want to run plan-attack on the Evaluator design specifically.
4. The right closure channel is the architectural audit task (Task 16), not a coding follow-up.

---

<!-- created-at: 2026-05-11T22:00:56Z -->
<!-- produced-by execute-write@v0004 -->
