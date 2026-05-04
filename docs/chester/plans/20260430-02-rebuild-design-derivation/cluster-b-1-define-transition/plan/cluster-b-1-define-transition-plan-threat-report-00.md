# Plan Threat Report — Cluster B.1

**Plan:** `cluster-b-1-define-transition-plan-00.md`
**Date:** 2026-05-03
**Smell heuristic:** matched. Both attacker + smeller dispatched.
**Rounds:** 3 (extensive plan revision after each)

## Combined Risk Level (round 3): **Low**

Round trajectory: **Significant** → **Moderate** → **Low**.

All round-1, round-2, and round-3 fixes verified holding. Remaining items are minor stylistic notes that don't affect correctness or maintainability.

---

## Round 1 (Significant) — All Addressed

- CRITICAL: applyOperations errors silently dropped → FIXED (partial_write_failure response).
- HIGH: ES module syntax errors (mid-file/mid-function imports) → FIXED (Plan-Wide Discipline + per-task explicit "Imports to add via Edit").
- HIGH: handleOpenProof export gap → FIXED.
- HIGH: state.test.js / loadstate-backfill.test.js import additions unstated → FIXED.
- MEDIUM: Single-label promotion priority → FIXED (PRIORITY map + per-field provenance).
- LOW: Temp file cleanup pattern deviation → ACKNOWLEDGED (not changed).

## Round 1 Smells — All Addressed

- Two parallel proof-opening paths → FIXED (Tasks 13, 14 retire initialize_proof + update SKILL.md).
- Single-label-per-element provenance lossy → FIXED (per-field `provenance.field_provenance`).
- RESOLVE_CONDITION blindspot → FIXED (dropped from registry).
- restructure.js unbounded growth → FIXED in round 3 (3-module split).
- Phase-ordering toString test brittle → FIXED (observable-side-effects test).
- checkOpenGate.indexOf O(n²) → ACKNOWLEDGED (failure path only).

## Round 2 — All Addressed

- HIGH: Concern routing crash (Concern not in ELEMENT_TYPES) → FIXED (handleOpenProof partitions admitted into typed-elements + concerns; concerns routed through addConcern).
- MEDIUM: Lingering inline imports in Tasks 4-8 → FIXED (per-task "Imports to add (use Edit) + Then append describe block" separation).
- MEDIUM: vi.spyOn ESM fragility → FIXED (replaced with observable-side-effects test).

## Round 3 (Moderate → Low) — All Addressed

- MEDIUM: spec/plan AC-1.1 contradiction (RESOLVE_CONDITION) → FIXED (spec revised to "6 B.1-admittable categories" + explicit RESOLVE_CONDITION exclusion rationale).
- LOW: extractMetadata leaks `category` field into metadata → FIXED (STRUCTURAL_FIELDS exclusion in extractMetadata).
- LOW: saveState throw not handled → FIXED (try/catch in handleOpenProof returns `status: 'save_failed'`).
- LOW: addConcern 4-tuple destructuring drops error/friction_hints → ACKNOWLEDGED (error path not reachable from open path; friction_hints not relevant at open time).
- LOW: Task 11 `vi` import unused → ACKNOWLEDGED (drop during execution if implementer notices).
- LOW: admittedToAddOp spread risk for future optional fields → ACKNOWLEDGED (latent, future-proofing not in scope).
- LOW: typeof + Array.isArray redundancy → ACKNOWLEDGED (style).
- LOW: restructure.js created without imports in Task 6, Task 8 adds them → ACKNOWLEDGED (acceptable mid-task assembly given explicit per-task instructions).

## Risk Assessment

After three rounds, the plan is implementable with normal TDD discipline. All build-breaking, correctness, and structural issues are closed. Module split delivers clean separation of concerns. Remaining LOW items are stylistic notes the implementer may apply during execution; none affect deliverable correctness.

## Designer Decision Options

- (a) **Proceed** — recommended. Plan is implementable as-written; remaining LOWs are non-blocking.
- (b) **Run round 4** — diminishing returns; only do if a specific concern remains.
- (c) **Stop / return to design.**

<!-- created-at: 2026-05-04T08:09:18Z -->
<!-- produced-by plan-build@v0004 -->
