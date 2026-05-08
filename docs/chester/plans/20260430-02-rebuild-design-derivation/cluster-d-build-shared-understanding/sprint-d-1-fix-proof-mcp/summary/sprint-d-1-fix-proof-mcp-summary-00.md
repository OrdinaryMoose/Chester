# Sprint Summary — Sprint D-1 Fix Proof MCP

**Sprint:** `20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp`
**Branch:** `sprint-d-1-fix-proof-mcp`
**Worktree:** `.worktrees/sprint-d-1-fix-proof-mcp`
**Date completed:** 2026-05-08

## Goal

Run the maintenance pass on the proof MCP module that the d.2 design session's friction report demanded:

- Collapse the proof lifecycle to a binary (`planning` / `finish` — no `reopen` motion)
- Retire the structural challenge-mode personality machinery (three personalities + count-based stall detection)
- Add a `body_advancement` signal computed per-round in `applyOperations` and surfaced to the agent (never the designer)
- Gate `present_closing_argument` on a per-element first-yes precondition (NCs, RCs, Concerns, Definitions across all four lanes)
- Cap `get_proof_state` response size via an optional `summary_mode` flag for long sessions
- Verify universal-withdraw routing for Concerns end-to-end
- Apply five mandatory correctness fixes the deletions force (`closing-argument.js`, `applyOperations` history pushes, `loadState` `defaultConcernStatus`, `metrics.js` four lock reads, `server.js` concernCoverage gate)
- Refuse all post-finish mutations across every mutating tool with structured `PROOF_FINISHED` error

## What Shipped

Sixteen acceptance criteria across eight categories — all delivered:

| AC group | Surface | Implemented in |
|---|---|---|
| AC-1.1, AC-1.2 | `proofStatus` binary + `loadState` legacy backfill | Task 4 |
| AC-2.1 | reopen motion fully removed | Task 10 |
| AC-2.2 | `manage_concerns op:lock` + `concernsLocked` field + 4 metrics lock reads removed | Task 11 (+ follow-up `f07cbf7`) |
| AC-2.3 | three challenge personalities removed (`detectChallenge`, `detectStall`, `STALL_WINDOW`, `markChallengeUsed`, 4 history fields, `challenge_trigger`, `stall_detected`) | Task 12 |
| AC-2.4 | bulk-ratify hook removed from `recordDesignerGo` | Task 13 |
| AC-3.1, AC-3.2, AC-6.2 | `body_advancement` signal computed + threaded into submit response (agent-internal only) | Tasks 1 + 5 |
| AC-4.1, AC-4.2 | first-yes precondition with `FIRST_YES_GATE_FAILED` | Tasks 2 + 6 |
| AC-4.3 | mid-review revision resets first-yes flags | Task 7 (verification-only) |
| AC-4.4 | `clearClosingFlags` → `resetFirstYesIfFired` rename + 12 inline-site rewires | Task 3 |
| AC-5.1 | universal withdraw routes Concerns end-to-end | Task 14 (verification-only) |
| AC-5.2 | `summary_mode` flag for `get_proof_state` | Task 9 |
| AC-6.1 | `lockedConcerns` partition uses `proofStatus === 'finish'` | Task 8 |
| AC-7.1 | post-finish mutations refused at state-layer + handler-layer | Task 13 |
| AC-8.1 | SKILL.md updated to match new surface | Task 15 (+ follow-up `3a223fb`) |
| AC-8.2 | full suite passes, no skipped tests | confirmed at every task; final 509/509 |

## Artifacts Produced

- **`design/sprint-d-1-fix-proof-mcp-design-00.md`** — design brief from design-small-task
- **`spec/sprint-d-1-fix-proof-mcp-spec-00.md`** — spec from design-specify
- **`spec/sprint-d-1-fix-proof-mcp-spec-ground-truth-report-00.md`** — codebase verification (1 HIGH, 3 MEDIUM, 2 LOW findings, all addressed inline before plan-build started)
- **`plan/sprint-d-1-fix-proof-mcp-plan-00.md`** — 15-task implementation plan, hardened
- **`plan/sprint-d-1-fix-proof-mcp-plan-threat-report-00.md`** — combined plan-attack + plan-smell findings (12 attack + 6 smell), risk: Significant; user chose proceed-with-directed-mitigations; 7 mitigations applied to plan before execution

## Code Changes

**New files (8):**

- `skills/design-large-task/proof-mcp/body-advancement.js`
- `skills/design-large-task/proof-mcp/first-yes-gate.js`
- `skills/design-large-task/proof-mcp/__tests__/body-advancement.test.js`
- `skills/design-large-task/proof-mcp/__tests__/first-yes-gate.test.js`
- `skills/design-large-task/proof-mcp/__tests__/first-yes-precondition.test.js`
- `skills/design-large-task/proof-mcp/__tests__/mid-review-revision.test.js`
- `skills/design-large-task/proof-mcp/__tests__/get-proof-state-summary.test.js`
- `skills/design-large-task/proof-mcp/__tests__/concern-withdraw-routing.test.js`

**Deleted files (2):**

- `skills/design-large-task/proof-mcp/__tests__/reopen.test.js`
- `skills/design-large-task/proof-mcp/__tests__/bulk-ratify.test.js`

**Modified files (substantive):**

- `skills/design-large-task/proof-mcp/state.js` — rename, vocabulary, body-advancement wiring, post-finish refusals across 11 mutating exports, removal of bulk-ratify, removal of `lockConcerns`/`reopenProof`/`markChallengeUsed`, removal of 6 fields from `initializeState`
- `skills/design-large-task/proof-mcp/metrics.js` — removed `detectChallenge`/`detectStall`/`STALL_WINDOW`, simplified `concernsRatificationGate`, removed gate call from `evaluateTrigger`, fixed 4 lock-reads
- `skills/design-large-task/proof-mcp/server.js` — `summary_mode`, `body_advancement`, FIRST_YES_GATE_FAILED, `proofFinishedResponse` helper + 9 handler pre-flights, schema enum updates, removal of `reopen_proof` and `op:lock` and `challenge_used`, vocabulary fixes for `handleOpenProof` and `persistRejectedOpen`
- `skills/design-large-task/proof-mcp/closing-argument.js` — `lockedConcerns` partition predicate
- `skills/design-large-task/SKILL.md` — version v0012 → v0013, all retired surface references removed, three new descriptions added, frontmatter and stall-recovery sections updated

## Suite Trajectory

| Phase | Tests |
|---|---|
| Sprint start | 501 / 501 |
| After Task 1 (body-advancement) | 509 |
| After Task 7 (mid-review) | 520 |
| After Task 9 (summary_mode) | 525 (peak) |
| After Task 10 (reopen removal) | 513 |
| After Task 11 (lock removal) | 505 |
| After Task 12 (personalities removal) | 490 (trough) |
| After Task 13 (bulk-ratify + post-finish) | 508 |
| After Task 14 (concern-withdraw lock) | 509 |
| **Sprint end** | **509 / 509** (37 test files, 0 skipped) |

Net delta: **+8 tests, +6 test files, −2 retired test files**. Retired-mechanism tests deleted, not skipped (per AC-8.2).

## Decisions Worth Carrying Forward

1. **`bodyAdvancement` is transient — never persisted.** During hardening it was caught that `state.bodyAdvancement ?? null` in summary mode would always be `null` because the field is computed in `applyOperations` and returned in the submit response, never written to state. Decision: drop the field from the summary-mode shape entirely rather than ship a permanent-null. Callers needing the signal read it from the `submit_proof_update` response.

2. **Defense-in-depth post-finish refusal** (state-layer + handler pre-flight) is load-bearing, not over-engineering. `handleSubmitProofUpdate` reads `result.errors[]` directly without going through `classifyStateError`, so the handler-layer pre-flight is genuinely necessary to surface `code: 'PROOF_FINISHED'` as a structured error rather than a plain string.

3. **`concernsRatificationGate` lives on as a simplified-but-dead-from-production export in `metrics.js`.** Per spec it was preserved (simplified), and `metrics.test.js` still tests it. Future cleanup could drop the export — flagged as smell debt, not in this sprint's scope.

4. **`evaluateTrigger`'s remaining NC quality checks** (`collapse_test`, `rejected_alternatives`) are NOT superseded by `checkFirstYesGate` even though the spec phrasing said "supersedes both gates." Documentation debt — the gate logic is now genuinely split across `first-yes-gate.js` (ratification) and `evaluateTrigger` (quality).

## What's Deferred

- **Definitions G1 promotion path** — d.1 known-remaining item; deferred per spec Non-Goals
- **D-11 (rule-add semantics)** and **D-12 (withdrawn-elements visibility)** — documentation-only friction items, deferred to a future doc sweep
- **Round-prompt conduct items** for the retired challenge personalities — `challenge-personalities-fold-into-round-prompts.md` exists for a future presentation-layer sprint
- **`concernsRatificationGate` export-removal** — function is dead-from-production; tests still exercise it; cleanup deferred
- **`evaluateTrigger` decomposition** — split-gate documentation/structural cleanup

## What the Next Session Needs to Know

The proof MCP is now structurally cleaner: binary lifecycle, no reopen, no challenge-mode, no concerns-lock, post-finish state is genuinely terminal. Three new contract surfaces (`body_advancement` field, `FIRST_YES_GATE_FAILED` error, `summary_mode` flag) describe the new agent-facing behavior. Five correctness fixes the deletions forced have been applied. The SKILL.md (`design-large-task/SKILL.md` at v0013) describes the post-sprint surface accurately — it's the agent's behavioral contract.

Next sub-sprint under cluster-d should consume this surface as fixed-and-known. The test count and structure represent the bottom of the trough — the sprint's deletion phases are complete.

## Session Skill Versions

```
<!-- produced-by design-small-task@v0002 -->
<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
```
<!-- produced-by finish-write-records@v0003 -->
