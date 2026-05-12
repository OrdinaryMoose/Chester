# Reasoning Audit: Sprint-01 Proof Backend — Engine Layer Implementation

**Date:** 2026-05-12
**Session:** `00`
**Plan:** `sprint-01-proof-backend-plan-00.md`

## Executive Summary

The session executed all 16 plan tasks of the Engine-layer implementation via subagent dispatches, finishing with 86 passing / 1 skipped / 0 failed tests and a clean tree. The defining pattern was a repeated "fix the plan-prescribed source" loop: per-task quality reviewers caught five real defects (D1–D5) in the plan's prescribed Evaluator/FactStore/Serializer code, each handled by pausing the task, recording a deferred-items entry, and dispatching a surgical fix on top of the original commit. The most consequential moment came at Task 15, when stress-test AC-11.2 exposed an O(N³) hot path in the Evaluator; a partial per-predicate index was attempted, proved insufficient, and was reverted, after which the operator authorized escalating D5 from a coding-level fix to a design-level deferment with full architectural context handed to a future sprint.

## Plan Development

The plan was inherited fully formed from `plan-build` as `sprint-01-proof-backend-plan-00.md` — 16 tasks across ~2662 lines, sourced from `04-engine-spec.md` and pre-vetted by the planning skill's adversarial review (threat report co-located in `plan/`). No re-planning happened in this session; the execution mode header was the only template field left unresolved, and the operator chose `subagent` early (see decision below).

## Decision Log

### D5 escalation from coding fix to design-level deferment

**Context:**
After AC-11.2 (1000-element transitive closure) hung at Task 15 and a dispatched partial per-predicate index proved insufficient at N=100, the operator asked whether the team should "go back to plan or specify reevaluate the full implementation of this fix" and whether "another plan set of architects" should review. The agent had been about to commit the partial fix and skip AC-11.2 with a minimal D5 reference.

**Information used:**
- Empirical: N=100 termination test still took ~8s after the partial-fix index landed; N=1000 still hung past the 60s vitest timeout.
- Diagnostic: every derived fact in the transitive-closure workload has the same predicate (`ancestor`), so the per-predicate bucket equals the entire IDB — the index provided zero discrimination.
- The Engine spec §3.1 specifies "semi-naive bottom-up" but does not specify IDB indexing structure, so the real fix (per-position index mirroring `FactStore._positionalIndex`) is an architectural choice, not a coding correction.
- The plan-attack/threat report did not flag this hot path — confirming the gap was upstream of execute-write.

**Alternatives considered:**
- `Land the partial per-predicate index and skip AC-11.2 with a one-line D5 reference` — rejected because the partial index doesn't measurably help and would leave half-baked optimization code in the baseline, hiding the real problem from a future architect.
- `Implement the full per-position index inline now` — rejected because (a) correctness risk on the negation branch under deeper indexing is real, (b) sprint 02's Domain layer hasn't yet revealed the actual query shapes that should inform the index design, and (c) the change exceeds the scope plan-build authorized for Task 15.
- `Loosen the AC-11.2 bound and call it passing` — rejected implicitly; the hang is not a 2× slow case, it is a ~2.5-hour extrapolation.

**Decision:** Revert the partial fix, mark AC-11.2 `it.skip` with a D5 cross-reference, and rewrite D5 from a coding deferral into a design-level deferment containing symptom, why-architectural, pre-mortem of attempted fixes, candidate data structures, risk catalog, and acceptance criteria — handed to a future design pass at sprint 02's opening.

**Rationale:** The operator's "maximum context" instruction (turn 896) made explicit that the goal was not to ship the optimization but to ship the diagnosis. Reverting kept the baseline clean for a future architect; escalating the deferment from coding-level to design-level signaled that the fix-and-defer template (which worked for D1–D4) is not appropriate when the underlying choice is a data-structure commitment that touches Evaluator correctness on the negation branch.

**Confidence:** High — the operator's "with the maximum context" instruction and the agent's articulated risks are explicit in the transcript; the resulting deferred-items entry corroborates the framing.

---

### D3 — Negation must existentially quantify unbound atom variables

**Context:**
Task 8's canonical Datalog test AC-9.4 fired with the expected input and produced the wrong result. The implementer correctly stopped without modifying engine source. Quality review identified the defect as a wrong-semantics bug in the plan-prescribed `Evaluator.matchBodyAtom` negation branch.

**Information used:**
- Test evidence: AC-9.4 (negation correctness) failed with concrete actual-vs-expected delta visible in the dispatch return.
- Source diagnosis: the negation branch did `substituteArgs(atom, bindings)` and then required full unification of the result against the IDB, treating unbound variables as literal `undefined` rather than as existential quantifiers.
- Reference: standard Datalog semantics require "there does not exist any fact matching the atom under any extension of the current bindings" — i.e. unify-then-consistency, not substitute-then-unify.

**Alternatives considered:**
- `Mark AC-9.4 as expected-to-fail and ship` — rejected because it is a correctness defect, not a perf or scope question.
- `Patch the test to match the wrong semantics` — rejected for the same reason.
- `Defer the fix to a follow-up sprint` — rejected because the Domain layer (sprint 02) will write negated rules; shipping wrong negation semantics would propagate corruption.

**Decision:** Authorize a plan deviation: rewrite the negation branch to iterate the IDB looking for any fact unifiable with the negated atom under any extension of current bindings, and treat a successful unification as a failure of the negation (existential quantification).

**Rationale:** Same fix-and-defer template established by D1: surgical commit on top of the original task commit, deferred-items entry logged, no plan amendment yet. The fix matches the canonical-Datalog reference semantics the spec gestures at without specifying.

**Confidence:** High — defect, test evidence, and remedy are explicit in the transcript and committed as `e2f1344`.

---

### D1 — Reject NaN and Infinity as fact arguments (template-setting deviation)

**Context:**
Task 2's quality reviewer returned Critical (confidence 95) on `FactStore.isConstant`: the predicate accepted `NaN` and `±Infinity` because `typeof NaN === 'number'`, and `factKey` then collided via `JSON.stringify(NaN) === "null"` with legitimately-null-valued facts.

**Information used:**
- Reviewer's confidence-95 Critical finding with concrete collision example.
- The agent's own observation that Task 2 had been prematurely marked complete before the quality reviewer returned (a process error caught and corrected by reopening the task).
- Plan-prescribed source for `isConstant` did not include non-finite-number rejection.

**Alternatives considered:**
- `Land the fix as an amend to commit d27e0ca` — rejected; agent explicitly chose "new commit on top, not an amend" to preserve the plan-prescribed baseline and make the deviation auditable.
- `Skip the fix because well-formed input never produces NaN` — rejected because EDB inputs come from external substrate writes and cannot be assumed well-formed.

**Decision:** Apply the reviewer's prescribed remedy verbatim as a separate commit (`2c1bf25`), write the first deferred-items entry, and skip a second-round quality review for an identical-to-recommended patch.

**Rationale:** This was the first surgical fix-and-defer of the sprint and established the template all subsequent D-items (D2/D3/D4) followed. The "new commit, not amend" choice prioritized auditability of plan deviations over commit-graph tidiness. The "skip second review" choice was an explicit efficiency call when the patch is byte-equal to the reviewer's recommendation.

**Confidence:** High — explicit operator dialogue and the agent's narration of both the new-commit-not-amend choice and the skip-second-review choice are visible in the transcript.

---

### D4 — `loadFrom` atomicity wrap using Task-10 snapshot/restore primitives

**Context:**
Task 11's quality reviewer found that `loadEngineFrom` validates schema, calls `engine.clear()`, then replays via `assertFact`/`defineRule`. A malformed replayed fact or a `CYCLIC_NEGATION` at rule replay leaves the engine partially loaded, breaking AC-7.3's promise that "engine state is unchanged from before the failed loadFrom call."

**Information used:**
- Reviewer's Important finding pointing at the exact AC-7.3 contract gap.
- The Task-10 snapshot/restore primitives (`_snapshot`/`_restore` on FactStore and RuleStore) had landed cleanly two tasks earlier — available as a composition building block.
- The plan-prescribed `Serializer.js` source had no atomicity wrapper.

**Alternatives considered:**
- `Stage all replays into a TransactionBuffer before committing` — rejected implicitly; plan had already committed to the snapshot-rollback strategy elsewhere and reusing it kept the engine's primitive-set small.
- `Document the gap and defer the fix` — rejected because AC-7.3 is part of the spec's port contract; sprint 02 will rely on it.

**Decision:** Wrap `loadEngineFrom` in `_snapshot` before `clear()` and `_restore` on any throw during replay; commit as the D4 surgical fix (`3538978`).

**Rationale:** The composition demonstrates that the Engine's lifecycle primitives are correctly factored — atomicity at the serializer is achievable using primitives the spec already requires for transactions. (inferred: the agent treated this as evidence the spec's port factoring was sound, but did not explicitly say so in the transcript.)

**Confidence:** Medium — defect and remedy explicit; the "this validates spec factoring" rationale is inferred from the broader fix-and-defer pattern, not stated.

---

### D2 — UNBOUND_HEAD_VARIABLE guard at Evaluator boundary (placement choice)

**Context:**
Task 6's quality reviewer found that for a rule like `q(X, Y) :- p(X)` where head variable `Y` does not appear in the body, `substituteArgs` returns `bindings.Y === undefined`, and `factKey` then JSON.stringifies the undefined slot as `null` — silently colliding with `q(a, null)` in the IDB. Same defect class as D1 (silent key collision via JSON serialization) but at the IDB write path.

**Information used:**
- Reviewer's Important finding (confidence 87) with the JSON-collision diagnosis.
- The defect can only fire on unsafe rules (head vars not contained in body vars); well-formed Datalog forbids them.
- Two candidate placements: defensive guard at `Evaluator.fireRule` (catches the error at derivation time) vs canonical safety check at `RuleStore.defineRule` (rejects unsafe rules at registration time, before any derivation).

**Alternatives considered:**
- `Reject unsafe rules at RuleStore.defineRule` — deferred (not rejected): it is the canonical Datalog placement, but it expands Task 4's scope retroactively and requires a new spec/AC pair.
- `Document the gap and ship the silent collision` — rejected because the failure mode is data corruption, not a clean error.

**Decision:** Land a defensive `UNBOUND_HEAD_VARIABLE` throw at `Evaluator.fireRule` as the immediate fix; defer the canonical `RuleStore.defineRule` safety check as the open half of D2.

**Rationale:** Two-tier handling: defensive backstop at the evaluator guarantees no silent corruption regardless of how rules entered the store, while the canonical check at the registration boundary remains the right long-term placement. The split lets sprint 01 ship a correct engine without re-opening Task 4's prescribed source.

**Confidence:** High — the placement trade-off and the "ship backstop, defer canonical check" split are both explicit in the deferred-items file and the transcript.

---

### Inline test addition for `rulesByStratum` after Task 4 quality review

**Context:**
Task 4's quality reviewer (Pass with notes) flagged that `RuleStore.rulesByStratum` — the primary Evaluator-facing accessor — had no direct test coverage. The agent's default would have been to re-dispatch an implementer subagent for any source change.

**Information used:**
- Reviewer's Minor finding flagging coverage gap on a load-bearing accessor.
- The fix was test-only, not source code.
- Re-dispatching a subagent for a test-only addition would have cost a full review round and yielded nothing the agent could not verify locally.

**Alternatives considered:**
- `Re-dispatch a test-implementer subagent` — rejected as disproportionate to a test-only addition.
- `Defer the coverage gap to the audit task` — rejected because the audit task is for compliance, not coverage backfill.

**Decision:** Add the `rulesByStratum` and `stratumOf` tests inline as a separate commit (`fc70344`) without spawning a subagent dispatch.

**Rationale:** A process-economy choice. Subagent dispatch is the default; the agent treated test-only patches as cheap enough to do inline. (inferred: this also kept the originating Task 4 commit unmodified, preserving the fix-and-defer pattern's auditability for D-items.)

**Confidence:** Medium — the choice and the commit are visible; the "preserve auditability" framing is inferred from the consistent pattern across D-items.

---

### Execution mode resolved by operator

**Context:**
The plan header field `Execution mode` held the unresolved template placeholder `subagent | inline` rather than a single resolved value. `execute-write` requires a definite mode to choose its Section 2 (subagent-driven) vs Section 3 (inline) branch.

**Information used:**
- Plan header literal text (operator-confirmed).
- The 16-task scope and the prescribed-source-with-review pattern (more consistent with subagent dispatch's review checkpoints than with inline execution's lighter cadence).

**Alternatives considered:**
- `Default to inline because the worktree is clean and the agent has full context` — rejected (not invoked; agent waited for operator).
- `Default to subagent because the plan is review-heavy` — rejected (not invoked; agent waited for operator).

**Decision:** Operator chose `subagent`; agent recorded the resolution and proceeded into Section 2.

**Rationale:** When the plan template carries an unresolved field, the agent's policy is to ask rather than to infer. Sets the precedent that unresolved-template-field handling is an operator call, not an agent call.

**Confidence:** High — the resolution is explicitly recorded ("Execution mode: subagent (user override; plan header held an unresolved placeholder)") in turn 94.

---

### Skip dedicated spec/quality reviews for Task 15

**Context:**
After the partial D5 fix was reverted and AC-11.2 marked `it.skip`, Task 15 still had to close. The default cadence would have run a spec reviewer and a quality reviewer over the final state.

**Information used:**
- The deviations in Task 15 (skip AC-11.2, restore Task 14's 15s bound, no source changes beyond what was reverted) are all explicit and operator-authorized.
- Task 16 is the failure-mode and architectural-compliance audit; it will see the full picture.
- Running two more dispatch rounds on a state that is already known to be partial-and-deferred would burn cycles without surfacing new information.

**Alternatives considered:**
- `Run the full review cadence anyway for hygiene` — rejected on cost-benefit (reviews would re-discover D5 which is already documented).
- `Skip Task 16 too` — rejected; the audit is the formal close-out for the spec contract.

**Decision:** Close Task 15 without the spec/quality dispatches; rely on Task 16's audit dispatch to evaluate the whole picture.

**Rationale:** A process-economy choice analogous to the inline-test decision above: review cadence is a default, not a contract, and can be skipped when the state is already explicit. (inferred: the trade-off is documented but the explicit cost-benefit math is not written out.)

**Confidence:** Medium — the choice is stated; the cost-benefit reasoning is partly inferred.

---

### Snapshot-rollback as the transaction strategy (architectural commitment, not deviation)

**Context:**
Task 12's plan-prescribed source committed the Engine's transaction model to a snapshot-rollback strategy (`begin` snapshots, `commit` discards the snapshot, `rollback` restores it) rather than the alternative TransactionBuffer model (stage writes in a buffer, flush on commit, drop on rollback). This was a plan-level commitment that the session honored without reopening.

**Information used:**
- ADR-0013 (referenced in the master CLAUDE.md) had already specified read-own-writes visibility and stratification-check timing inside transactions — both of which are easier under snapshot-rollback than under buffering.
- Task 10's `_snapshot`/`_restore` primitives had already landed cleanly and were reusable for D4's loadFrom wrap — confirming the primitive's compositionality.

**Alternatives considered:**
- `TransactionBuffer model (stage writes, flush on commit)` — rejected by the plan; the session inherited that rejection.
- `Reopen the choice given D5's perf cost` — not considered; transaction strategy is orthogonal to the Evaluator hot path.

**Decision:** Implement transactions exactly per the plan-prescribed snapshot-rollback strategy; no buffer file enters the codebase.

**Rationale:** A non-deviation worth recording: when the plan made a sound architectural commitment, the session honored it without litigating. The fact that the same `_snapshot`/`_restore` primitives also enabled D4's loadFrom atomicity wrap is downstream evidence the commitment was correctly factored.

**Confidence:** Medium — the implementation matches the plan; the framing as a deliberate non-deviation is inferred from the consistent pattern of recording deviations only when the plan was wrong.

---

### Reopen Task 2 after premature completion mark

**Context:**
Task 2 was marked complete on the agent's task list before the quality review subagent had returned. The quality review then produced the D1 Critical. Standard hygiene would either treat the task as still-done (and apply D1 as a separate Task-2-followup task) or reopen the original task.

**Information used:**
- The Critical defect was in plan-prescribed source for Task 2, not a downstream concern.
- The fix would be committed on top of `d27e0ca` (Task 2's original commit) — naturally part of Task 2's history.

**Alternatives considered:**
- `Leave Task 2 marked complete and open a Task-2-followup line` — rejected as bookkeeping noise; the defect is in Task 2's source.
- `Amend `d27e0ca`` — rejected (chosen separately in D1) to keep the deviation visible as a discrete commit.

**Decision:** Reopen Task 2 in the task list, write the deferred-items entry, dispatch the fix on top of `d27e0ca`, then re-close.

**Rationale:** Task-list state should reflect actual completion, not optimistic marking. Reopening preserves the auditability of the deviation: a future reader sees Task 2 closed only after the D1 surgical fix landed.

**Confidence:** High — the reopen and the framing ("premature completion mark — quality review hadn't returned yet") are explicit in turn 218.

<!-- created-at: 2026-05-12T08:47:08Z -->
<!-- produced-by finish-write-records@v0003 -->
