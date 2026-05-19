# Session Summary — sprint-02-bug-fix-08

**Sprint:** sprint-02-bug-fix-08
**Master plan:** 20260511-01-mp-redesign-proof-system
**Branch:** sprint-02-bug-fix-08
**Date:** 2026-05-18
**Target system:** `skills/design-proof-system/references/`

## Goal

Rebalance the proof system's per-category authority so the designer holds sole authority over framing categories (Rule, Permission, Definition, Concern, Resolution) and the agent (`DESIGN_PARTNER`) joins as a peer on content categories (Evidence, Proposition, Risk, Friction). Record every agent-side action as a designer-reviewable EDB fact. Revert sprint-02-bug-fix-07's D12 reviseResolution dual-partner approval to designer-only so the runtime authority check and the emitted approval facts agree.

## What was completed

All three design decisions implemented and tested. 413 tests pass across `domain/__tests__/`, `domain/structural-tests/`, `engine/__tests__/`.

### Per-decision implementation

- **D1 — Authority allowlist rewrite.** `CATEGORY_REGISTRY[*].authority` rewritten for seven entries in `schema.js`. RULE and PERMISSION unchanged (already DESIGNER-only). EVIDENCE / RISK / FRICTION: `add/revise/withdraw` opened to `[DESIGNER, DESIGN_PARTNER]`; ratify stays DESIGNER-only (FRICTION-add additionally retains `SYSTEM` for auto-detection). PROPOSITION: `add/revise/withdraw` opened to `[DESIGNER, DESIGN_PARTNER]`; ratify retains `[DESIGNER, DESIGN_PARTNER]` (per Q1 = 1a). RESOLUTION / CONCERN / DEFINITION: all four verbs tightened to `[DESIGNER]` only (the framing categories).
- **D2 — Designer-inform channel.** Central `agent_action(elementId, verb, source, ts)` EDB fact emission in `runOperation` at the §6.1 step-5/step-6 boundary, gated on `consent.source === DESIGN_PARTNER`. Verb-aware `targetId` resolution: WITHDRAW → `args.id`; RATIFY → `args.elementId`; else → allocator-produced `id`. The predicate registered in `EDB_PREDICATES` and `PROJECTION_ARITIES` (arity 4); flows into `validPredicates` automatically via `getDeclaredEDBPredicates()`. The fact participates in `renderDatalogProjection` so the designer can review the agent's history via existing query surfaces.
- **D3 — Revert reviseResolution dual-partner approval.** `OPERATION_SPECS[REVISE_RESOLUTION]`: `consentCategory` narrowed to `[DESIGNER]`; the two `'design_partner'` approval+two_yes baseFacts removed. The verb now emits a single DESIGNER approval row — `two_yes_complete(newId)` does NOT derive for revised resolutions, but `resolution(newId, S)` still derives via the approval-gated rule template (single-source approval is sufficient for derivation). `reviseProposition` retains its dual-partner approval pattern (Proposition keeps dual-partner ratify under D1).

### Cross-cutting decisions made during the sprint

- **Authority matrix is binding.** Five categories designer-only across all four verbs; four categories admit agent on `add/revise/withdraw`; PROPOSITION additionally admits agent on `ratify`.
- **Central emission only.** No translator signature changes. All `agent_action` facts come from a single `runOperation` insertion point with verb-aware targetId resolution.
- **Designer-inform via EDB fact, not via new port.** The agent_action predicate lives in the EDB and is queryable via existing `queryProof` / `renderDatalogProjection` — no out-of-band notification surface, no new bridge facade methods.
- **`CONSENT_INVALID` is the error code.** Confirmed at `authority.js:12,16,19`. The new tightened authority paths reject DESIGN_PARTNER with the existing error code; no new code introduced.
- **D3 is a deliberate revert of D12's behavior.** A test in `sprint-02-bug-fix-07.test.js` previously asserted `two_yes_complete` for reviseResolution outputs; updated in lockstep alongside the D3 implementation.

### Hardening outcomes

Plan hardening produced a Significant-risk threat report before mitigations (one CRITICAL `render.js` PROJECTION_ARITIES gap; two HIGH findings on discovery-grep coverage and WITHDRAW emission emitting the wrong elementId). All three structural findings were patched in the plan inline before save; risk dropped to Moderate. User pre-authorized "apply all fixes automatically" at the hardening gate.

During execution, code-quality reviews caught additional findings beyond what the plan anticipated:

- **Task 2 Important:** Shared block comment over REVISE_PROPOSITION / REVISE_RESOLUTION still implied dual-partner approval for both verbs after D3. Split into per-verb comments.
- **Task 2 Minor:** AC-12.2 lacked a negative `two_yes_complete` assertion on the revised resolution. Added.
- **Task 4 Important:** `makeRealBridge.seed` regressed from sprint-07's null-guarded version to a TypeError-on-`undefined` version. Restored the null guard.
- **Task 4 Important:** No test covered `reviseProposition` with DESIGN_PARTNER consent emitting `agent_action`. Added AC-2.4 to pin the else-branch path.
- **Task 4 Minor:** Emission-block comment listed `MANAGE_FRICTION` in the allocator-id path. MANAGE_FRICTION is DESIGNER-only after D1 and unreachable from the D2 emission block. Comment corrected.

## What was produced

Artifacts under `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-08/`:
- `design/sprint-02-bug-fix-08-design-00.md` (Approved — 3 ratified decisions)
- `spec/sprint-02-bug-fix-08-spec-00.md` (Hybrid architecture + AC-1.x..AC-4.1)
- `spec/sprint-02-bug-fix-08-spec-ground-truth-report-00.md` (1 MEDIUM, 1 LOW — both fixed inline)
- `plan/sprint-02-bug-fix-08-plan-00.md` (5 tasks, execution mode = subagent, hardened)
- `plan/sprint-02-bug-fix-08-plan-threat-report-00.md` (Significant pre-mitigation; Moderate after inline patches)
- `summary/sprint-02-bug-fix-08-summary-00.md` (this file)

Code commits on branch `sprint-02-bug-fix-08` (from `9977a27` to HEAD `341936d`):
- D1 schema rewrite + concern-schema.test.js lockstep update
- D3 reviseResolution revert + bug-fix-07 lockstep AC-12.2/12.3 updates
- D2 EDB predicate registration (EDB_PREDICATES + PROJECTION_ARITIES)
- D2 central emission + sprint-02-bug-fix-08.test.js behavioral suite (30 it-blocks)
- Quality-fix commits: shared comment split, negative two_yes_complete assertion, seed null-guard, AC-2.4 reviseProposition emission test, comment correction
- Checkpoint commit `341936d`: execution complete

## What is deferred or left open

No formal deferred-items file created this sprint (no quality finding required deferral — all Important findings were patched inline). Follow-ups noted in the threat report:

- **`agent_action` retention / compaction.** The fact accumulates indefinitely in the EDB. The brief explicitly deferred a retention mechanism; long-running proofs with heavy agent participation will see the predicate grow without a pruning path. Future sub-sprint may add a compaction surface.
- **Designer-acknowledge mechanism.** The brief explicitly declined an explicit acknowledge gesture for agent actions. Designer reviews via query; no "I've seen this" flag. Could be added in a follow-up if value emerges.
- **`createDomainBridgeWith` stub.** Continues to exist unaddressed (sprint-02-bug-fix-07 declared it out of scope; bug-fix-08 added new facade methods to `createDomainBridge` only, widening the divergence further). Not blocking.
- **Sprint-slug-named test files.** `sprint-02-bug-fix-08.test.js` continues the pattern; future test-reorganization sprint could consolidate behavioral coverage by topic (authority, agent_action, revise-semantics) rather than by sprint.

## What the next session needs to know

- All three D1–D3 decisions are landed and tested at HEAD `341936d`. The system is in a clean state for archive and merge.
- The most observable behavior change: agent (`DESIGN_PARTNER`) can now author and revise Evidence, Propositions, Risks, and Frictions; every such action emits an `agent_action` row in the EDB queryable via existing surfaces. Designer review is read-only; no acknowledge protocol exists yet.
- `reviseResolution` now produces single-source DESIGNER approval only. Any caller previously observing `two_yes_complete` deriving on revised resolutions will see it stop firing — this is the deliberate D3 revert.
- Three categories that previously admitted DESIGN_PARTNER on ratify (DEFINITION, CONCERN, RESOLUTION) now reject it with `CONSENT_INVALID`. Tests that authored ratify calls with `design_partner` source for those categories were updated in lockstep; no further migration required.
- Plan-build's cross-cutting decisions in the plan header (authority matrix, central emission, D3 scope, error code) are binding for any future work touching the authority or approval surface.
- The plan, threat report, and ground-truth report together capture far more decision-record context than this summary; refer to them for full rationale on any specific choice.

## Session Skill Versions

<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by execute-write@v0006 -->
<!-- produced-by finish-write-records@v0003 -->
