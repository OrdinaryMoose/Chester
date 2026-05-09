# Plan Threat Report — task-03-fix-render-concern-recap

**Sprint:** task-03-fix-render-concern-recap
**Plan reviewed:** `task-03-fix-render-concern-recap-plan-00.md`
**Date:** 2026-05-09

## Combined Implementation Risk Level

**Low**

## Hardening Inputs

- **plan-attack:** ran (unconditional) — 4 Low findings, 0 Moderate or higher
- **plan-smell:** skipped — heuristic pre-check matched zero triggers
- **Spec-stage ground-truth report:** none (task skipped design-specify; plan-attack performed full anchor verification itself)
- **Smell triggers matched:** none. Plan introduces no DI registrations, no async/concurrency primitives, no persistence pathways, no contract surfaces, and no new abstractions in the trigger sense (the `concernRecapSummary` helper is a same-module utility function, not an interface, abstract class, or service class).

## Why Low

1. **Single-line bug, single-line fix.** The defect is one line of code (`state-render.js:195`); the fix is one new export and one call-site change. Blast radius is bounded by file structure.
2. **All anchors verified against the codebase.** plan-attack confirmed every file path, line number, function return shape, and behavior claim against actual code. Line 138 closes `renderRisk`; line 195 carries the bug; the `describe('renderProofRecap', ...)` block ends at line 355.
3. **No downstream callers affected.** `renderProofRecap` is called only from `server.js:516` and the target test file. The change is to summary-string composition inside the function — the function signature, return shape, and section ordering are untouched.
4. **TDD discipline is real.** Two tests added before implementation, regex correctness verified by direct execution against the post-fix shape, fallback path explicitly covered.
5. **Deep-render path is left alone.** The plan explicitly preserves `renderConcern` (lines 102-114), which the brief identifies as out of scope. AC-1.4 enforces this.

## Findings (plan-attack)

All four findings are Low severity. None blocked plan approval.

### Finding 1 — Low — Test fixture mismatch with production shape

**Original observation:** AC-1.3 test seeded a Concern with `description: ''` (empty string), but production `addConcern` stores `description ?? null`, so legacy concerns produced without a description argument carry `description: null`, not `''`. Both shapes flow through `concernRecapSummary` correctly (`null ?? '' = ''` and `'' ?? '' = ''` both produce `desc = ''`), so this was a test-coverage observation rather than a correctness gap.

**Resolution:** Plan updated. AC-1.3 test now calls `addConcern(s, { label: 'concern Y' }, consent)` with description omitted, exercising the actual `null`-storage path production legacy concerns take.

### Finding 2 — Low — Status filter on AC-1.3 test

**Observation:** The AC-1.3 test seeds a Concern via `addConcern`, which stores `status: 'draft'`. `partitionActiveElements` includes concerns where `c.status !== 'withdrawn'`, so `'draft'` passes and the concern reaches the recap. The recap line meta becomes `_(draft)_`, which the test regex absorbs via `.*`.

**Resolution:** No action required. This is a verification note confirming the test path is well-bounded.

### Finding 3 — Low — `concernRecapSummary` exported but not unit-tested in isolation

**Observation:** The plan exports `concernRecapSummary` and notes "testable in isolation" as the rationale, but the new tests exercise it only through `renderProofRecap`. Unit coverage of the helper itself (label-only, both-present, neither-present branches) is left to the integration path.

**Resolution:** Accepted as-is. For a one-function fix where the integration path covers every branch, isolated unit tests are redundant. The export remains useful for future tests if branches diverge.

### Finding 4 — Low — Implicit `cd` discipline in commit step

**Observation:** Steps 2 and 4 use `cd skills/design-large-task/proof-mcp && npx vitest run` (`cd` scoped to the `&&` chain, does not persist). Step 5's `git add` uses repo-relative paths and assumes the executor is at the worktree root. An executor that mechanically `cd`s before git would break.

**Resolution:** Accepted as-is. The worktree-cd hazard is documented in user memory; an execute-write run respects it. The plan's `git add` paths are repo-relative and correct from the worktree root.

## Designer Decision Options

The hardening gate completed cleanly with one cheap improvement applied. Choose how to proceed:

1. **Proceed.** Move to Execution Mode Selection and save the plan. This is the recommended path given the Low risk level.
2. **Proceed with directed mitigations.** Specify additional mitigations you want incorporated (e.g., add isolated unit tests for `concernRecapSummary`, or expand AC coverage).
3. **Return to design with additional requirements.** If the brief misframes the problem or the scope is wrong, drop back to brief-revision before re-running plan-build.
4. **Stop.** Halt the sprint here.

<!-- created-at: 2026-05-09T15:53:09Z -->
<!-- produced-by plan-build@v0004 -->
