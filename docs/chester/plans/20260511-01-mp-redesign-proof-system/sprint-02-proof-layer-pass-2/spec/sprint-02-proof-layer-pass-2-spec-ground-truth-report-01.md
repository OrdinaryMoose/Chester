# Ground-Truth Report: sprint-02-proof-layer-pass-2-spec-03

**Spec reviewed:** `spec/sprint-02-proof-layer-pass-2-spec-03.md`
**Brief context:** `design/sprint-02-proof-layer-pass-2-design-00.md`
**Reviewer:** general-purpose subagent dispatched by design-specify@v0003, plus inline fidelity and adversarial passes
**Status:** Clean across all three review dimensions. Re-run triggered by user-directed scope correction.
**Predecessor:** `sprint-02-proof-layer-pass-2-spec-ground-truth-report-00.md` (covered spec-01; spec-02 was re-reviewed inline clean; spec-03 gets this fresh report because it carries a user-directed scope change).

## Context

Spec-03 is a scope-corrected revision of spec-02. The user clarified mid-`plan-build` that `skills/design-large-task/proof-mcp/` is a separate system from `skills/design-proof-system/references/` (Domain + Engine) and this sub-sprint should not cross that system boundary. AC-5.1, AC-5.2, AC-5.3, AC-6.3 removed. Components' proof-mcp layer block removed. Data Flow step 5 removed. The `manage_concerns` MCP tool contract constraint removed. Non-Goals tightened.

All three reviews (fidelity, ground-truth, adversarial) were re-run on spec-03 at the user's request with explicit instruction to verify no out-of-scope references remain.

## Boundary Check (Primary Focus)

All `design-large-task` / `proof-mcp` / `state.concerns` / `manage_concerns` occurrences in spec-03 (11 lines total):

- Line 5: Architecture section — system-boundary statement — BOUNDARY
- Lines 10-11: Revision history (-02 and -03 entries) — historical — BOUNDARY
- Line 15: Goal — "Whether and when proof-mcp adopts the new bridge surface is a separate system-boundary decision left to a future sub-sprint" — BOUNDARY
- Line 33: Out-of-scope block — explicit enumeration — BOUNDARY
- Line 47: Data Flow parenthetical noting Step 5 intentionally absent — BOUNDARY
- Line 70: Testing Strategy — "proof-mcp tests are untouched by this sub-sprint (system boundary)" — BOUNDARY
- Line 77: Constraints — System boundary statement — BOUNDARY
- Line 87: Non-Goals — no retroactive migration — BOUNDARY
- Line 91: Non-Goals — no changes to proof-mcp — BOUNDARY
- Line 152: AC-1.4 legacy citation note — explicitly historical, format not preserved — BOUNDARY

**IN-SCOPE LEAK count: 0.** No occurrence appears inside an in-scope work item, AC observable boundary, Given/When/Then, or implementation requirement.

## Verified Claims

- Revision -03's claim that AC-5.1, AC-5.2, AC-5.3, AC-6.3 were removed — CONFIRMED. AC-heading grep returns exactly: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-2.1, AC-2.2, AC-2.3, AC-3.1, AC-4.1, AC-4.2, AC-4.3, AC-6.1, AC-6.2, AC-7.1, AC-7.2 (15 ACs).
- Eight proof-mcp files in Out-of-scope block — ALL CONFIRMED at `skills/design-large-task/proof-mcp/{state,server,closing-argument,body-advancement,first-yes-gate,state-render,metrics,friction-detection}.js`.
- AC-1.4's `state.js:253` `CERN-${counter}` hardcode — CONFIRMED at `skills/design-large-task/proof-mcp/state.js:253`.
- AC-4.3's `addresses/2` arity claim — CONFIRMED at `skills/design-proof-system/references/domain/translation.js:45`.
- AC-4.3's no-existing-`covered(C)`-producer claim — CONFIRMED (grep across domain/ returns zero hits outside node_modules).
- AC-2.3's RULE_TEMPLATE proposition analog at `translation.js:75-82` — CONFIRMED.
- AC numbering coherence — CLEAN. Removed numbers (AC-5.x, AC-6.3) appear only in revision history (-02, -03) where their removal is announced.

## Fidelity Re-Review

Spec-03 faithfully addresses the brief's primary goal (add CONCERN to domain schema/translator/bridge). The brief's KD1 ("retire `state.concerns` (option a) vs add only schema entry (option b)") is resolved as option (b) by the user's system-boundary directive — a valid brief-respecting resolution of the open question. All brief constraints (cascade-normative, uniform 9-category pattern, no test regression, real-import discipline) are respected. No untraceable additions. Internally consistent.

## Adversarial Re-Review (inline)

- Structural integrity: clean. Stratification chain acyclic (`unaddressed_concern ← not covered ← concern_status + addresses + approved`).
- Execution risk: proof-mcp regression structurally impossible — proof-mcp does not import from domain (separate npm package, separate process, separate state). Dropping AC-6.3 doesn't leave a guard down because no dependency edge exists.
- Unstated assumptions: AC-1.4 defers production-allocator behavior to execute-write Decision; spec assumes the test-allocator's `${shape}_${n}` pattern is matched by production. Documented as a Decision, not asserted.
- Contract gaps: AC-4.3's tightening of `covered(C)` semantics (adding `approved(R, _, _)`) is explicitly justified by cascade §3.8's text.
- No new concurrency surface.

**Findings:** none.

## Risk Assessment

Spec-03 is boundary-clean and factually grounded. The scope correction is executed cleanly across all sections of the spec. Every proof-mcp reference is properly fenced as out-of-scope context, no active work crosses into the separate system, and removed AC numbers (5.x, 6.3) are absent from all in-scope sections. Inherited claims from spec-02 (allocator behavior, `addresses/2` arity, RULE_TEMPLATES location, `state.js:253` legacy citation) re-verify under the worktree's current HEAD. Adversarial review found no new gaps introduced by the subtractive change. Spec-03 is plan-ready.

<!-- created-at: 2026-05-15T02:08:39Z -->
<!-- produced-by design-specify@v0003 -->
