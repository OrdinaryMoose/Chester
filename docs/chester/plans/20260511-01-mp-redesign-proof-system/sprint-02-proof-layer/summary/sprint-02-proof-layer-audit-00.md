# Reasoning Audit: sprint-02-proof-layer (Domain Layer Build)

**Date:** 2026-05-14
**Session:** `00`
**Plan:** `sprint-02-proof-layer-plan-01.md`

## Executive Summary

The session resumed a paused sub-sprint (sprint-02 Domain layer) that had been parked while sprint-01 went through four convergence passes to stabilize the Engine public API. The most consequential decision was the choice to **realign existing artifacts via delta-revisions (spec-02, plan-01) rather than regenerate from scratch** — this preserved the spec-01/plan-00 audit trail of "what was assumed before the pass-4 Engine merge" while burning hours of identical work was avoided. Execution stayed substantially on-plan across 16 tasks but surfaced four implementation defects in the plan itself (verb-key casing mismatch, post-commit ordering, friction-shape literal, regex flag drift), each fixed inline. One context-rot recovery between T13 and T14 forced a shift from per-task review to cumulative review for T14–T16; the cumulative review caught two Critical wire-format bugs (`queryOverlap`, `validPredicates`) before the boundary commit.

## Plan Development

The plan was not built fresh in this session — `plan-00.md` already existed (2,756 lines, 16 tasks) from a prior planning pass against the original `spec-01`. After spec-01 was patched into spec-02 (three targeted fixes for the post-pass-4 Engine API), plan-00 was copy-revised into `plan-01` with three direct deltas, then iteratively hardened: three plan-reviewer rounds added five refinements (per-template `templateId` propagation, render-loop strengthening, verb-loop coverage, audit-adapter `runCounterfactual` exposure, JSDoc hygiene), and a parallel `plan-attack` + `plan-smell` hardening gate produced 10 attack findings (4 Critical) and 7 smell findings, of which the four Criticals and two Importants were patched inline. Two Important smell findings (IM-2 stub fixed-point evaluator, IM-5 `createDomainBridgeWith` clone) were explicitly deferred with documentation. Final plan-01 carried 14 layered fixes over plan-00 and an `Execution mode: subagent` header derived from the four-heuristic check (all four conditions failed, recommending subagent).

## Decision Log

### Spec-02 over fresh spec generation

**Context:** Sprint-02 had a pre-existing `spec-01` written before sprint-01's four pass-4 corrections. The user asked whether spec-01's Engine references were accurate against the merged pass-4 Engine.

**Information used:**
- `Engine.js`, `FactStore.js`, `RuleStore.js`, `Unifier.js`, `RuleAtomTranslator.js` at merge commit `146bc68`
- ADR-0012 (six substrate ports) and ADR-0013 (Parts 2 & 3: read-own-writes, stratification timing)
- Engine spec §4.1–§4.6 and §9.3 (wildcards)
- `05-domain-spec.md:723` cascade pseudocode that originated the bad pattern

**Alternatives considered:**
- `Rewrite spec from scratch` — rejected; most of spec-01 (six port names, snapshot/restore API, transaction lifecycle, query/count/exists surfaces) was already accurate against pass-4
- `Patch spec-01 in place` — rejected; lost audit trail of "what was assumed pre-merge"
- `Defer the corrections until execution and fix during implementation` — rejected; pass-1-through-4 history shows the same class of integration error gets expensive when caught at integration time

**Decision:** Create `spec-02.md` as a sibling revision with three targeted patches (wildcard retract → query-then-retract, pinned 4-arg `defineRule` signature, citation `§4.5` → `§4.6`).

**Rationale:** Three concrete issues identified, all narrow enough for sibling-revision treatment. Pinning Engine signatures explicitly converts implicit cascade-coupling into a grep-able contract, preventing sprint-01's four-pass drift from recurring.

**Confidence:** High — issues, fixes, and rationale all stated explicitly during the review.

---

### Delta-plan-01 over plan-build cold restart

**Context:** Spec-02 had landed but `plan-00.md` (2,756 lines, 16 tasks) was generated against spec-01. Running `plan-build` cold would regenerate ~95% identical content plus require re-review and re-attack against the same plan body.

**Information used:**
- `plan-00.md` line-by-line scan showing only Task 11 carried the bad wildcard retract
- The artifact schema already supports `NN`-versioned plan revisions (same pattern as spec-01 → spec-02)
- Plan-build skill description (assumes from-scratch generation)

**Alternatives considered:**
- `Full plan-build cold restart` — rejected; hours of regenerated identical content, but offered fresh adversarial perspective from a clean plan-attacker pass
- `Patch plan-00 in place` — rejected; lost the audit trail of what was planned pre-Engine-merge

**Decision:** Copy plan-00 → plan-01 and apply targeted patches (Task 11 wildcard, field-name alignment `head/body` → `headAtom/bodyAtoms` in Tasks 4/13/14, RULE_TEMPLATES build functions), then run the full reviewer + hardening loop against plan-01.

**Rationale:** Plan-00 was structurally aligned with spec-02 (same 13 source files, same vitest stack, same task shape) and ~95% reusable. Delta path preserves the audit trail and still receives full hardening because the reviewer + attacker + smeller run against the patched plan, not the deltas in isolation.

**Confidence:** High — explicitly framed as a scope decision, surfaced to user, then executed.

---

### Subagent execution mode over inline

**Context:** Plan-01 finalized at 16 tasks, Significant risk level, multi-file code-producing tasks throughout. The plan-build skill defines a four-heuristic check for execution mode.

**Information used:**
- Four heuristic conditions: task count ≤ 3, threat risk ≤ Moderate, decision-budget sum ≤ 4, no multi-file code-producing tasks
- Plan-01 task count (16), risk (Significant), decision budget sum (well over 4), and that most tasks create source + test file pairs

**Alternatives considered:**
- `Inline` — rejected; all four heuristic conditions failed
- `Hybrid (inline for simple tasks, subagent for complex)` — not visibly considered

**Decision:** Set `Execution mode: subagent` in plan-01 header, triggering per-task fresh implementer dispatch with spec-reviewer + quality-reviewer between tasks.

**Rationale:** Per-task review independence pays for itself on a plan of this size and risk; isolation prevents cumulative context contamination across 16 tasks.

**Confidence:** High — explicit heuristic application and recommendation.

---

### Fix the four Critical plan-supplied-code bugs inline rather than ship

**Context:** Plan-attack returned 4 Critical findings (CR-1 through CR-4) about plan-supplied test/fake code that would block `npm test` on first run. Three were introduced or made visible by the plan-reviewer-loop's own strengthened tests.

**Information used:**
- CR-1: fake `_unify` rejects `{var:name}` objects from `_lowerWildcards`
- CR-2: AC-6.1 missing `calls.length = 0` reset
- CR-3: six of eight verbs throw `SHAPE_INVALID` before `tx.begin` (args don't satisfy idShape required fields)
- CR-4: `renderElementDeep({})` returns null, failing `not.toBeNull`
- Engine `Unifier.unify`'s actual variable convention (`{var: 'X'}` in queries; bare uppercase in rule bodies only)

**Alternatives considered:**
- `Ship with criticals and let implementer discover` — rejected; would block `npm test` in first hour, defeating purpose of plan-hardening gate
- `Return to design` — rejected; problems were at task-implementation layer, architectural shape was sound
- `Fix only the worst Critical and defer the others` — not considered; all four were small concrete fixes

**Decision:** Patch all four Criticals plus IM-1 (12 bare-uppercase query call-sites converted to `{var:...}`) and IM-3 (snapshot-adapter note for sprint-03) in plan-01 directly.

**Rationale:** The hardening gate exists precisely to surface these before implementation; not fixing them would defeat the gate's purpose. IM-1 was forced by CR-1's resolution (aligning the fake's unifier with the real Engine's query-time convention).

**Confidence:** High — each Critical's fix is explicitly described and applied.

---

### Defer I-1 and I-2 from cumulative review

**Context:** End-of-execution cumulative code review (forced by skipped per-task reviews on T14–T16) surfaced two Critical and two Important findings.

**Information used:**
- I-1 / I-2 nature (visible in narration as "two Important to defer" but specific content not enumerated in audit-visible turns)
- Sprint context: 16 commits, 81 tests passing, boundary-stamp approaching
- Sprint-02's role as a bridge to sprint-03 (real-Engine wiring will revisit some of these areas)

**Alternatives considered:**
- `Fix all four findings inline` — rejected; Importants would extend session past natural boundary
- `Defer all four` — rejected; both Criticals were wire-format bugs (queryOverlap constants-vs-variables, validPredicates) that would propagate to sprint-03
- `DONE_WITH_CONCERNS without fixing the Criticals` — rejected; same propagation risk

**Decision:** Fix both Criticals inline, append I-1 and I-2 to the deferred-items log, then boundary-commit.

**Rationale:** Wire-format bugs at module boundaries (the same class as the T6 lifecycle-query mistake) propagate; Importants without immediate downstream impact can wait. Maintains the boundary-marker discipline.

**Confidence:** High — explicit fix/defer split described in the narration.

---

### Cumulative code review for T14–T16 instead of per-task review

**Context:** Context-rot event occurred between T13 commit and T14 commit. T14 implementation had completed and tests were green, but the work was uncommitted at the time the prior conversation ran out of context. T15 and T16 also remained. The user invoked `/compact` and then resumed with "we may have experienced context rot. Ensure all tests pass correctly and continue."

**Information used:**
- All 53 tests at T13 boundary were passing; T14's three new tests also passed in the recovered state
- Per-task review pattern from T1–T13 had been spec-reviewer + quality-reviewer + inline fixes
- T16's implementer surfaced four plan defects during execution (camelCase vs snake_case verb keys, post-commit advance ordering, friction-shape literal, regex flag drift)

**Alternatives considered:**
- `Resume per-task spec/quality review for T14, T15, T16` — rejected; remaining context budget would not safely cover three full review pairs plus the boundary-stamp
- `Skip all review for T14–T16` — rejected; T16's four implementer-surfaced plan defects signal that a review pass is warranted
- `Per-task review for T14 only, skip T15/T16` — not visibly considered

**Decision:** Commit T14/T15/T16 implementations without per-task review, then dispatch a single cumulative code reviewer covering all three.

**Rationale:** Context budget after rot recovery favored a consolidated review over three sequential review pairs; the cumulative pass would still catch wire-format bugs (and did — `queryOverlap` and `validPredicates`).

**Confidence:** High — explicitly stated as "skipped per-task spec/quality reviews for T14/T15/T16 due to the context-rot recovery."

---

### Stop start-bootstrap; back out to read master-plan instead

**Context:** Session opened in Master Plan Mode with stale `.active-sprint` breadcrumb (pointed at the closed sprint-01-pass-4). Default behavior was to invoke `start-bootstrap` to orient.

**Information used:**
- `start-bootstrap` is designed for fresh sprint creation, not for resuming pre-allocated sub-sprints
- Master plan mode pre-creates sub-sprint dirs (`sprint-02-proof-layer`) and pre-allocates branches/worktrees
- `master-plan.md` is authoritative for "what next"

**Alternatives considered:**
- `Run start-bootstrap and let it create a fresh dir` — rejected; would create duplicate dir conflicting with the pre-allocated sprint-02 structure
- `Read master-plan first, then call appropriate skill` — chosen

**Decision:** Abandon start-bootstrap mid-flow, read master-plan.md, identify sprint-02 as the next pending sub-sprint with existing design/spec/plan artifacts.

**Rationale:** Bootstrap creates dirs and derives names from a clean slate — none of which applies mid-master. Only the breadcrumb update and thinking-history reset from bootstrap were useful, both of which were applied later in the session manually.

**Confidence:** High — explicitly stated reasoning and skill back-out.

---

### Amend T1 commit to absorb post-review quality fixes

**Context:** T1 implementer landed at `ae455cb`. Quality reviewer found 1 Important (substrate-fake handle validation) and 2 Minor. The Important affects every future task because the fake is foundational.

**Information used:**
- T1's audit trail is the substrate fake itself — foundational for 15 remaining tasks
- The `getRule` Minor was not exercised mid-transaction by any plan task
- Two patterns available: amend-and-retry vs. follow-up commit

**Alternatives considered:**
- `New follow-up commit` — rejected; would split T1's foundational fake across two commits, complicating future bisect
- `Defer Important to backlog` — rejected; affects every downstream task
- `Amend T1 commit after re-running tests` — chosen

**Decision:** Fix Important + Minor #1 inline, re-run scaffold test, amend `ae455cb` → `556ee11`. Defer Minor #2 (`getRule` mid-tx) since no plan task exercises it.

**Rationale:** Amend keeps T1's audit trail clean as a single foundational commit; deferred minor has zero downstream coupling.

**Confidence:** High — explicit pattern stated as "amending the commit so T1's audit trail stays clean."

---

### Fix `closure_failure_reason` rule mid-task at T7

**Context:** T7 quality reviewer surfaced an Important: plan's Background section says "defines closure_failure_reason(R) head," but Step 3 code omits the rule, leading to silent fallback in integration.

**Information used:**
- Plan Background vs. Step 3 code drift (a real plan defect, not implementer error)
- The omission would only surface as an integration symptom in T16

**Alternatives considered:**
- `Defer to T16 integration` — rejected; would manifest as a mysterious bridge-integration failure
- `Mark as plan defect and continue without fix` — rejected; behavior loss is real

**Decision:** Add the missing rule inline at T7.

**Rationale:** Plan defects discovered during execution should be fixed where surfaced, not propagated to a later task where the symptom would be harder to trace.

**Confidence:** High — explicit "real plan gap. Fixing inline."

---

### Demote `conflict_rule` Cartesian product at T8

**Context:** T8 quality reviewer found a Critical: the `conflict_rule` definition produced an unbounded Cartesian product when fired.

**Information used:**
- The friction-policy rule body had no join condition between the two negated atoms
- IM-2 (stub fixed-point evaluator) is deferred, so the rule wouldn't actually fire in sprint-02 tests — but it would in sprint-03 with the real Engine

**Alternatives considered:**
- `Leave it; the fake won't fire it anyway` — rejected; sprint-03 wires the real Engine
- `Add a proper join` — not visibly considered (would require deeper friction semantics design)
- `Demote to a no-op shape that still validates the rule-registration surface` — chosen

**Decision:** Demote `conflict_rule` to a non-firing shape that still passes stratification and exercises the registration path.

**Rationale:** The structural goal of the rule (be registered as a stratified head) is sprint-02's contract; the firing semantics belong to a later sprint with real evaluator support.

**Confidence:** Medium — visible as a Critical fix in narration but full alternatives not enumerated.

---

### Tighten the substrate fake's stratification stub mid-T16

**Context:** T16 implementer reported tightening the fake's stratification check as one of four implementer adjustments.

**Information used:**
- Plan lines 2944-2947 explicitly authorize "tighten the stratification stub" if needed during execution
- The original stub was permissive; some bridge-integration ACs needed sharper rejection semantics

**Alternatives considered:**
- `Reject the implementer's tightening and force a strict plan-verbatim interpretation` — rejected; plan-authorized

**Decision:** Accept the tightening as a plan-authorized adjustment.

**Rationale:** The plan anticipated this exact discretion; not granting it would have been an over-rigid reading of the verbatim-adherence rule.

**Confidence:** Medium — visible in narration but reasoning compressed.

---

### Order T16 before T15 due to file-dependency inversion

**Context:** Plan task ordering was structure-then-behavior (T15 structural tests then T16 bridge-integration), but T15's module-shape AC asserts that T16's `bridge-integration.test.js` file exists.

**Information used:**
- Plan-task ordering vs. actual file-dependency graph
- T15's module-shape AC reads from filesystem, not plan-task position

**Alternatives considered:**
- `Execute in plan order (T15 then T16)` — rejected; T15 would be transiently red until T16 lands
- `Skip the failing T15 assertion and fix on second pass` — rejected; weakens the structural-test contract

**Decision:** Dispatch T16 first, then T15, then final verify pass.

**Rationale:** File-dependency direction trumps plan-task ordering when an AC reads filesystem state; execution-order is implementer discretion when the plan defects are obvious.

**Confidence:** High — explicit reasoning stated.

---

**Confidence:** High — explicit reasoning in the narration.

<!-- artifact-trailer:v1
skill: TBD
generated-at: TBD
-->

<!-- created-at: 2026-05-14T11:16:37Z -->
<!-- produced-by finish-write-records@v0003 -->
