# Reasoning Audit — Sprint D-1 Fix Proof MCP

**Sprint:** sprint-d-1-fix-proof-mcp
**Source transcript:** 8dd6719f-1709-4375-b4ea-11074d4e867f.jsonl
**Date completed:** 2026-05-08

## Decision 1: Inline-fix Task 11's spec deviation rather than dispatch a new implementer

**Context:** After Task 11 (the largest deletion task — `op:lock` removal, `concernsLocked` field retirement, four metrics lock-reads, 16 test files touched) reported DONE at `76ed764` with suite 505/505 green, the parallel quality reviewer flagged one **Important** finding (82 confidence): `evaluateTrigger` retained the `concernsRatificationGate(state)` call. The spec reviewer had passed the task; only the quality reviewer caught it.
**Information used:** Plan-build threat-report mitigations (which had explicitly directed Task 11 to remove the entire `concernsRatificationGate` call because the first-yes precondition supersedes it), the spec reviewer's Pass verdict, the quality reviewer's Important finding with reproduction reference, and the implementer's commit diff showing simplification rather than removal.
**Alternatives:**
- Re-dispatch a new Task 11.5 implementer subagent to remove the call.
- Defer to Task 12 or a sweep at sprint end.
- Accept as-is on grounds the spec reviewer passed.
- Inline-edit four lines in `evaluateTrigger` and commit as a follow-up.
**Decision:** Inline-edit `evaluateTrigger` to delete the four-line `concernsRatificationGate` call, run suite to confirm 505/505 still green, commit as `f07cbf7` with `fix(proof-mcp):` prefix.
**Rationale:** Bounded mechanical fix (4 lines, one function), already-known location, no need to re-explain context to a fresh subagent. The spec was unambiguous; the implementer simply chose simplification when the plan said removal. A new dispatch would carry overhead disproportionate to a four-line delete. Inline keeps the per-task commit cadence intact and produces a clean audit trail (Task 11 main commit + Task 11 follow-up commit).
**Confidence:** High

## Decision 2: Treat the quality reviewer's "Important" finding on Task 14 as a false positive after independent verification

**Context:** Task 14 (universal withdraw routing verification test) reported DONE at `a85dc1e`, suite 509/509. Spec review **Pass**. Quality reviewer raised an "Important" finding suggesting the test's destructuring of `addConcern`'s return tuple "may be reversed" — but hedged the concern with "verify this is correct."
**Information used:** Direct read of `addConcern` source confirming return shape `[id, newState, hints, null]` (4-element with ID first), the green test suite (509/509 passing twice — once at implementer, once at spec-reviewer reproduction), and the quality reviewer's explicit hedge language.
**Alternatives:**
- Trust the quality reviewer's "Important" tag and re-dispatch a fix.
- Add a defensive assertion to silence the concern.
- Verify by reading source, treat as false positive if confirmed.
**Decision:** Verify `addConcern`'s return shape directly, confirm bindings correct, record as false positive, do not modify code.
**Rationale:** When a finding hedges with "verify this," verification trumps the finding's confidence score. The test passes — twice. Modifying correct code to pacify a hedged review is worse than leaving correct code alone. Documenting the verification in the session log preserves the audit trail.
**Confidence:** High

## Decision 3: Treat Task 5's three Minor findings as deferred-by-construction rather than fix-now

**Context:** Task 5 (body-advancement wiring) DONE at `4ae139a`, suite 505/505. Quality reviewer surfaced three Minor findings (88, 85, 82): (a) `detectStall`/`detectChallenge` unused imports in `state.js`; (b) `markChallengeUsed` unused import in `server.js`; (c) rejected-path response shape inconsistency.
**Information used:** Plan structure (Task 12 explicitly removes both `detectChallenge` and `markChallengeUsed`), reviewer's own annotation that import-staleness was "possibly intentional," and skill guidance: "Minor severity = note and move on."
**Alternatives:**
- Fix all three inline (would re-touch files Task 12 modifies anyway).
- Fix only the import-cleanup ones, defer the response-shape question.
- Defer all three with explicit rationale tied to plan ordering.
**Decision:** Defer all three. Document the cross-task seam in an Insight block. Carry forward `body_advancement` rejected-path question as a possible follow-up only if user asks.
**Rationale:** The first two findings are transitional state — Task 12 cleans them up naturally. Touching them now would either churn (Task 12 re-edits) or risk introducing a divergent diff. The third is genuine but out-of-spec for this sprint. The reviewer correctly characterized two of the three as transitional; trusting that judgment honors the per-task scope.
**Confidence:** High

## Decision 4: Inline-fix Task 13's two Minor findings rather than defer

**Context:** Task 13 (multi-handler PROOF_FINISHED pre-flight, bulk-ratify removal — final structural change task) DONE at `2faaf1a`, 508/508. Quality reviewer flagged two Minor (85, 82): stale JSDoc claiming removed behavior; lint workaround (eslint-disable on dead-flagged pattern).
**Information used:** Confidence scores (85 is non-trivial, near the report-threshold boundary), nature of findings (stale JSDoc misleads readers indefinitely; lint workaround signals an underlying pattern that should be cleaned up), and effort estimate (both are 30-second fixes).
**Alternatives:**
- Defer per "Minor = note and move on."
- Fix only the 85-confidence JSDoc, defer the 82.
- Fix both inline before moving to Task 14.
**Decision:** Fix both inline; commit as `c00bec9`.
**Rationale:** "Note and move on" is a default, not a mandate. The 85-confidence JSDoc finding is legitimately consequential because stale documentation poisons reader mental models for years; cheaper to kill it now while context is loaded. The 82 is bounded enough that fixing alongside is essentially free. Cost/benefit on inline fix favors action.
**Confidence:** High

## Decision 5: Apply hardening's 12 attack + 6 smell findings as directed mitigations rather than redesign

**Context:** Plan-build hardening dispatched plan-attack and plan-smell in parallel after smell heuristics fired (two new abstractions, three new contract surfaces). Combined: 12 attack issues + 6 smell issues. Critical findings included 5 unlisted test files breaking at deletion commits, an inverted tuple shape (`ratifyResolveCondition` documented as 2-elem when actually 3-elem), and two AC-violating semantic gaps in `handleOpenProof` and `handleSubmitProofUpdate`.
**Information used:** Hardening risk synthesis ("Significant" overall), structural correctness of the plan ("plan structurally sound; deletions/scope correct"), and a per-finding mechanical-vs-redesign categorization.
**Alternatives:**
- Treat "Significant" risk as a redesign trigger; re-do plan-build.
- Apply only the critical findings (tuple shape, AC violations); accept residual risk on test enumeration.
- Apply all findings inline as directed mitigations and proceed.
**Decision:** Apply all directed mitigations to the plan in place — Task 11 enumerates 5 missing test files, Task 12 adds markChallengeUsed/operation-log enumeration, Task 13 fixes tuple shape and routes PROOF_FINISHED through `classifyStateError`, Task 14 disposition fix, Task 4 extends to `handleOpenProof`'s three additional sites, drop misleading `bodyAdvancement` field from summary mode response shape.
**Rationale:** Risk classification "Significant" was driven entirely by enumeration gaps and one tuple-shape correctness defect — not by structural plan failure. All findings were bounded and locally fixable. Redesign would discard correct work; partial application would leave known red-commit hazards. Full inline application preserves plan structure while closing every concrete defect the hardening surfaced.
**Confidence:** High

## Decision 6: Drop the `bodyAdvancement` field from summary-mode response shape rather than persist it

**Context:** Smell finding S1 (matched by attack F8): summary-mode response includes `bodyAdvancement: state.bodyAdvancement ?? null` — but `bodyAdvancement` is computed each call from the body-advancement gate, never persisted to state. The field would always serialize to `null`.
**Information used:** Plan task definitions for `body-advancement.js` (pure recomputation per call), summary-mode contract (response shape goes to consumers who would interpret `null` as a valid current value), and AC-7 (response shape correctness).
**Alternatives:**
- Persist `bodyAdvancement` to state to match the response shape.
- Keep the field with always-null value (status quo of plan).
- Drop the field from summary-mode response entirely.
**Decision:** Drop the field from summary-mode response.
**Rationale:** Persisting violates the "pure recomputation" design of the new abstraction (would re-introduce a state/derived-value sync hazard). Always-null is a user-visible smell that misleads consumers. Dropping the field aligns shape with semantic truth. Decision later validated downstream — Task 9 implementer didn't have to reason about a permanent-null field.
**Confidence:** High

## Decision 7: Choose subagent execution mode despite user concurrence — verify heuristic independently

**Context:** End of plan-build, before saving plan. User had said "proceed with subagent execution." Skill guidance requires running the four-condition heuristic regardless of user preference, to record reasoning.
**Information used:** Task count (15), threat risk (Significant), decision-budget sum (~25), multi-file pattern (most tasks touch state.js + server.js + tests).
**Alternatives:**
- Accept user instruction without independent verification.
- Run heuristic and record outcome.
**Decision:** Run heuristic, record all four conditions failing for inline mode, confirm subagent recommendation, declare in plan header `Execution mode: subagent`.
**Rationale:** Independent verification creates an audit trail and protects against user-instruction-driven mode mismatch. All four heuristic conditions failed for inline mode, so user instruction and heuristic concurred — recording the concurrence is the value. If they had diverged, the conflict would surface immediately.
**Confidence:** High

## Decision 8: Extend Task 4 implementer's scope to update test files with stale fixture literals

**Context:** Task 4 (lifecycle vocabulary — `'open'`/`'closed'` to `'planning'`/`'finished'`) DONE at `cd276da`, suite 504/504 (including 3 new legacy-mapping cases). Implementer flagged that additional test files beyond the plan's enumeration had stale literals and that `reopenProof` had internal writes to the old vocabulary even though `reopenProof` is deleted in Task 10.
**Information used:** Plan guidance: "any pre-existing test that asserted the old literals must be updated in this task." Plan ordering (Task 10 deletes `reopenProof`, but Task 4 runs first). AC-1.1 invariant (zero production writes of `'open'`/`'closed'`).
**Alternatives:**
- Restrict Task 4 strictly to plan-enumerated files; defer extra test files to a sweep task.
- Defer `reopenProof` internal writes since the function is deleted in Task 10.
- Extend scope to all stale-literal sites including the soon-to-be-deleted `reopenProof`.
**Decision:** Approve implementer's extended scope; do not push back. Note `reopenProof` internal writes as "defensive but harmless" given Task 10 deletion.
**Rationale:** Plan guidance explicitly anticipated extra test files. Restricting scope would create a known-red interim state; extending scope keeps every commit green. The `reopenProof` writes are deleted in Task 10 anyway, but updating them in Task 4 enforces the AC-1.1 invariant uniformly across the interim — easier to grep-verify, no behavior cost.
**Confidence:** High

## Decision 9: Inline-fix Task 15's `FIRST_YES_GATE_FAILED` parenthetical conflation

**Context:** Task 15 (SKILL.md cleanup + suite verification — final task) DONE at `e4ba919`, suite 509/509. Quality reviewer flagged one Important (82): the `FIRST_YES_GATE_FAILED` description's parenthetical conflated first-yes-gate (per-element ratification across all four lanes) with closure-assent flag (a separate later-stage gate).
**Information used:** Skill semantics distinction (first-yes-gate operates per-element pre-closure; closure assent is the designer's final go/no-go), the parenthetical's misleading wording, and the doc's role as the agent's mental-model anchor for proof phase.
**Alternatives:**
- Defer per "Important but no cluster of issues."
- Fix only the parenthetical, leaving surrounding text intact.
- Rewrite the broader paragraph for clarity.
**Decision:** Inline-fix the parenthetical to correctly identify per-element ratification semantics; commit as `eaecb4b`.
**Rationale:** Documentation defects in the SKILL.md propagate into every future invocation of the design-large-task skill — agents reading the doc form a wrong mental model that causes downstream errors. The cost is one parenthetical edit; the benefit compounds across every future use. Surrounding text was correct, so a narrow fix beat a paragraph rewrite.
**Confidence:** High

## Decision 10: Halt at quality-review false-positive verification rather than re-run reviewer

**Context:** Task 14 quality review's "Important" finding hedged with "verify this is correct." After source-read confirmation that the test bindings matched `addConcern`'s actual return shape, the choice was whether to also re-dispatch the reviewer or accept verification as terminal.
**Information used:** Suite green twice (implementer + spec reviewer reproduction), source confirmation, reviewer's own hedging language.
**Alternatives:**
- Re-dispatch quality reviewer with a corrective context note.
- Accept verification as terminal, log false-positive in session log.
- Add a comment in the test file explaining the binding shape.
**Decision:** Accept verification as terminal; log false-positive; no further action.
**Rationale:** Re-dispatch costs context and time without changing outcome — the source already proved the bindings correct. Adding a defensive comment would document the wrong thing (the test should not need to defend its bindings against a hedged review). Logging the false-positive in the session record preserves audit trail without code churn.
**Confidence:** Medium

## Decision 11: Patch plan-review reviewer findings inline rather than re-write plan

**Context:** First plan-build review pass produced three blocking findings: (a) pre-existing assertion conflicts in already-listed files needed line-number callouts; (b) a `require` statement in plan code template (ESM project — should be `import`); (c) `addConcern` and every mutator return-tuple shape was not template-explicit.
**Information used:** Reviewer's specific findings with file:line references, plan structure (additive patches integrate cleanly), and the cost of a full re-write versus targeted patches.
**Alternatives:**
- Re-write the plan from scratch incorporating findings.
- Discard reviewer's findings on grounds of plan correctness.
- Patch the three locations inline; re-dispatch reviewer for a Pass.
**Decision:** Patch inline — add line-number callouts, swap `require` to ESM-clean form, expand `addConcern` and every mutator to a return-tuple template. Re-dispatch reviewer.
**Rationale:** Targeted patches are cheaper than rewrites and preserve the plan's structural integrity. Reviewer approved on second pass with one minor advisory (factual table fix), which was applied directly without a third loop.
**Confidence:** High

<!-- created-at: 2026-05-08T18:59:19Z -->
<!-- produced-by finish-write-records@v0003 -->
