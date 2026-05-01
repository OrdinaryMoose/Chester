# Reasoning Audit: Cluster A — Define Solve

**Date:** 2026-05-01
**Session:** `00`
**Plan:** `cluster-a-define-solve-plan-00.md`

## Executive Summary

Cluster A delivered the resolution-claim element category as a sixth proof MCP element type (`RESOLVE_CONDITION`) with a PM-ratified Concern enumeration anchor and per-Concern closure coverage. The single most consequential decision was Architect A (atomic full-stack registration) over the phased and hybrid options at the spec stage — locking proof MCP, brief template, and `design-specify/SKILL.md` updates into one cluster diff so cluster B inherits no template/specify cleanup work. Implementation stayed on-plan; the only mid-execution deviations were inline applications of two code-review-surfaced fixes (legacy state file backward-compat in loadState, word-boundary regex in Rule-union match) committed as a follow-up after the eleventh task.

## Plan Development

The plan was developed bottom-up from the spec's 24 ACs, decomposed into 11 tasks ordered by forward dependency (each task's tests only reference functionality from earlier tasks). plan-attack hardening surfaced 2 HIGH and 2 MEDIUM test-fixture maintenance gaps concentrated in Task 7's `closableState()` factory and `computeCompleteness` `toEqual` shape; the user picked option 2 (proceed with directed mitigations), and four mitigations were applied to the plan: scoping `npm test` away from acceptance.test.js for Tasks 1-10, adding `makeElement`/`mapOf` helpers to Task 6, and explicit fixture updates to Task 7.

## Decision Log

### Architect A (atomic full-stack registration) chosen at spec stage

**Context:** design-specify dispatched two architect subagents (atomic vs phased) and a prior-art explorer. Atomic touched 8 files in one cluster, phased deferred brief-template + design-specify integration to cluster B citing master-plan §4.2 + RULE-9 + RULE-10. Hybrid was offered as principled merge (additive template + defer specify).

**Information used:**
- Master-plan §4.2 designates cluster B as owner of brief-template updates and Phase 4a → Phase 4b transition mechanism
- Spec brief AC list (lines 88-97) includes brief-template (AC-93/94) and design-specify integration (AC-96)
- Architect A's feasibility evidence: 8 files, ~400 LOC, comparable to prior `20260429-01-add-competitive-interview` sprint

**Alternatives considered:**
- `Architect B (phased schema-first)` — rejected: defers AC-93/94/96 to cluster B with structural justification (RULE-9 vocabulary lock as prerequisite), introduces cluster A → B gap window
- `Hybrid (additive template + defer specify)` — rejected: brief template carries dual sections for one cluster cycle; cluster B inherits cleanup task

**Decision:** Architect A — atomic full-stack landing of proof MCP + brief template + design-specify in cluster A.

**Rationale:** User picked A explicitly. Cluster B inherits no template/specify cleanup work; gap window between cluster A merge and cluster B merge eliminated. Trade-off: ~400 LOC across 8 files is the largest sprint surface, but consistent with prior Chester sprint scope.

**Confidence:** High — decision and rationale explicit in user response (`a`).

---

### Critical fix from full code review applied as follow-up commit (loadState backward-compat)

**Context:** After all 11 plan tasks completed and 177/177 tests green, the full code review subagent identified a Critical (95 confidence) finding: legacy state files written by pre-cluster-A code lack `concerns`, `concernsLocked`, `concernCounter`, `ratificationLog`, and per-element `problem_anchor`/`ratification` fields. `loadState` returns the raw object as-is, leaving these undefined; downstream mutators (`addConcern.push`, `lockConcerns.length`, `applyOperations.some`) crash on TypeError.

**Information used:**
- `state.js:loadState` source — minimal JSON parse + Map reconstitution, no field backfill
- Empirical verification by reviewer against a synthesized legacy state file
- Skill rule: "Critical (Must Fix): Fix before proceeding"

**Alternatives considered:**
- `Defer with deferred-items entry` — rejected: skill mandates immediate fix for Critical
- `Add explicit version detector that errors out on legacy files` — rejected: backfill is mechanically simple, costs nothing on new files, converts critical to non-issue

**Decision:** Apply five-line backfill block in `loadState` using `??=` operator for cluster-A fields and per-element shell fields.

**Rationale:** Backfill matches the same defaults `initializeState` writes for new state. Conservative — does not modify existing field values, only fills nullish ones. Verified in `npm test`: 177/177 still pass.

**Confidence:** High — fix verified, rationale explicit.

---

### Word-boundary regex for Rule-union match (Important #1 from full code review)

**Context:** Full code review surfaced a false-positive vector: a Concern labeled `"A"` would be reported "covered" by any Rule containing the word "a" (substring match). Even non-pathological labels like `"Performance"` collide with common English ("preserve performance baseline" matches even if the Rule has nothing to do with the Concern semantically).

**Information used:**
- `metrics.js:checkConcernCoverage` Rule-union path used `String.prototype.includes` on lower-cased statement
- Spec line 66 commits to "case-insensitive substring on label OR id" — but treats this as the spec author's working assumption, not a hard contract
- Reviewer-provided counter-example: label "A" matching "Build a robust system"
- closure permission silently load-bearing on this match: false positive grants closure on uncovered Concern

**Alternatives considered:**
- `Defer with deferred-items entry` — rejected: silent closure permission on uncovered Concern is a correctness-leaning gap, not a polish nit
- `ID-only match (drop label-based coverage)` — rejected: spec line 66 explicitly includes label
- `Minimum label length floor` — rejected: arbitrary threshold, doesn't solve "Performance" type collisions
- `Word-boundary regex` — accepted: tightens match without removing label coverage

**Decision:** Replace `stmt.toLowerCase().includes(...)` with `\b{escaped}\b` regex (case-insensitive) for both id and label. Add `escapeRegex` helper.

**Rationale:** Word-boundary regex eliminates substring-collision false positives while preserving label-based coverage. All five existing checkConcernCoverage tests still pass after the change (the test labels — "Performance", "Auditability" — are word-boundary-clean and the Rule statements use them in clean word contexts).

**Confidence:** High — fix verified, all 177 tests pass.

---

### Plan-attack mitigations applied (option 2: proceed with directed mitigations)

**Context:** plan-attack hardening returned 2 HIGH + 2 MEDIUM + 2 LOW findings concentrated in test-fixture maintenance:
- HIGH: existing `metrics.test.js:42-56` `toEqual` shape break when Task 7 adds counters
- HIGH: existing `closableState()` fixture lacks concerns/concernsLocked, breaks all 6 existing checkClosure tests when condition 8 fires
- MEDIUM: Task 6 references `makeElement`/`mapOf` helpers that don't exist in `proof.test.js`
- LOW: acceptance.test.js pending stubs cause `npm test` failures throughout Tasks 1-10

**Information used:**
- Plan threat report at `cluster-a-define-solve-plan-threat-report-00.md`
- Mitigations were verbatim plan-text edits, not code changes
- Skill heuristic: combined risk Moderate (test-fixture maintenance, not runtime logic)

**Alternatives considered:**
- `Option 1: proceed as-is` — rejected: HIGH findings would break Task 7 build at Step 4, requiring runtime debugging during implementation
- `Option 3: return to design` — rejected: gaps were plan-level, not spec/design-level
- `Option 4: stop` — rejected: gaps were mechanical and addressable

**Decision:** Apply four mitigations to the plan: scope `npm test` to exclude acceptance.test.js for Tasks 1-10 (`--exclude='**/acceptance.test.js'`), add `makeElement`/`mapOf` helpers to Task 6 Step 1, add Fixture update 1 (toEqual extension) and Fixture update 2 (closableState extension) to Task 7 Step 1.

**Rationale:** Mechanical plan-text edits removed the HIGH-severity Task 7 build break by anticipating fixture updates explicitly. The acceptance.test.js scoping kept red/green TDD signal clean throughout the implementation phase.

**Confidence:** High — user picked option 2 explicitly; mitigations applied verbatim.

---

### Subagent execution mode chosen via heuristic + user confirmation

**Context:** plan-build's Execution Mode Selection step computed the heuristic against the final hardened plan: 11 tasks, sum of decision budgets 13, two multi-file code-producing tasks, threat risk Moderate.

**Information used:**
- Heuristic: subagent default; downgrade to inline only if all four conditions hold (≤3 tasks, ≤Moderate risk, ≤4 decision-budget sum, no multi-file code-producing tasks)
- 3 of 4 conditions failed (task count, decision-budget sum, multi-file tasks)

**Alternatives considered:**
- `Inline mode override` — rejected by heuristic and confirmed by user

**Decision:** Subagent execution mode written into plan header.

**Rationale:** Per-task review independence (spec-reviewer + quality-reviewer) is the property hardest to recover if you pick wrong; subagent's per-dispatch isolation pays for itself across 11 tasks with sum-of-budgets 13.

**Confidence:** High — heuristic explicit, user confirmed.

---

### Universal-shell extension: problem_anchor + ratification on every element

**Context:** Spec NC-03 said "exactly three fields, no other fields" for RESOLVE_CONDITION. Spec line 22 committed that `problem_anchor` and `ratification` default null on every element shell, not only on RC. Architect A's design adopted this universal shell.

**Information used:**
- Spec line 22 explicit commitment
- Existing pattern: `relieves: null` lives on every element shell though only PERMISSION uses it; same pattern fits problem_anchor + ratification
- NC-03 collapse test in design brief — "no other fields" means no domain-specific fields beyond statement/problem_anchor/ratification, not "no universal-shell fields"

**Alternatives considered:**
- `Conditional shape — only RC carries the two fields` — rejected: would require runtime branching in createElement return shape and break the existing flat-shape pattern
- `Validation-side only (allow fields on input but don't return them on non-RC)` — rejected: silently drops data

**Decision:** Add `problem_anchor: null` and `ratification: null` to every element's return shape; only validate them for RESOLVE_CONDITION.

**Rationale:** Matches existing `relieves: null` pattern. Tests verify non-RC elements receive nulls (AC-1.2's fourth `it`). Universal shell simplifies serialization (saveState/loadState don't branch on type).

**Confidence:** High — spec line 22 is explicit, implementation matches.

---

### Cleared-on-revise vs sentinel for stale-ratification (NC-06)

**Context:** Spec needs to invalidate ratification on `statement` or `problem_anchor` revision after ratification. Two design paths surfaced during spec writing: (a) keep ratification but flag stale, (b) null ratification immediately on revise.

**Information used:**
- Existing `checkStaleGrounding` pattern (proof.js) uses an integrity-check function that flags stale references
- Spec line 24 explicitly committed to clear-on-revise approach: makes stale structurally impossible
- Sentinel function `checkStaleRatification` documented as extension callsite

**Alternatives considered:**
- `Warn-on-stale` — rejected per spec line 24: requires runtime checks, leaves window where stale ratification persists
- `Clear-on-revise + log` — accepted: ratification field is the canonical source of truth (non-null = currently valid)

**Decision:** Null `ratification` in revise branch when target is RC and statement/anchor changed; append `cleared-on-revise` event to ratificationLog. Keep `checkStaleRatification` as sentinel returning `[]` for symmetry + extension callsite.

**Rationale:** Cleared-on-revise puts the invariant in the write path itself rather than relying on read-time checks. ratificationLog preserves audit trail. Sentinel provides extension hook if future paths bypass the clear logic.

**Confidence:** High — spec explicit, implementation matches.

---

### Single `manage_concerns` tool with `op` enum (vs two tools)

**Context:** Concerns lifecycle has two operations (add, lock). Two tool surfacings possible: separate `add_concern` + `lock_concerns` tools, or one `manage_concerns` tool with `op: 'add' | 'lock'`.

**Information used:**
- Spec line 80 commits to single tool with op enum
- Existing `submit_proof_update` precedent uses op enum for add/revise/withdraw

**Alternatives considered:**
- `Two separate tools` — rejected per spec line 80; would also be inconsistent with `submit_proof_update`'s op-enum pattern

**Decision:** Single `manage_concerns` tool with `op: 'add' | 'lock'` enum.

**Rationale:** Pattern consistency with existing tools. Reduces MCP surface area. Handler dispatches on op via if/else.

**Confidence:** High — spec explicit, pattern match documented.

---

### Sequential ratification enforced via singular MCP schema (NC-05)

**Context:** Spec NC-05 requires sequential per-RC ratification — refuses batch shapes. Two enforcement layers possible: state-fn signature, MCP schema, or both.

**Information used:**
- `ratifyResolveCondition` function takes single `elementId` parameter (state-fn enforcement)
- MCP tool inputSchema declares `element_id: { type: 'string' }` (no `element_ids` array)
- AC-4.2 verifies the schema is singular by source-text inspection

**Alternatives considered:**
- `Schema-only enforcement` — rejected: relies on schema validation; bypassable from internal callers
- `State-fn-only enforcement` — rejected: MCP layer accepts batch and falls back to looped single calls
- `Both layers (defense in depth)` — accepted

**Decision:** Both function signature and MCP schema enforce singularity. AC-4.2 source-inspects the schema for ongoing verification.

**Rationale:** Two-layer enforcement closes both internal and external paths. AC-4.2 prevents schema regression.

**Confidence:** High — spec explicit, implementation matches.

---

### Skip checkStaleRatification real implementation; keep sentinel

**Context:** Full code review Important #2 (confidence 80) flagged that `checkStaleRatification` always returns `[]` provides zero defense if a future change bypasses applyOperations's clearing path. Reviewer suggested implementing real check or removing the function.

**Information used:**
- Spec line 24 explicitly commits to sentinel approach as extension callsite
- Cleared-on-revise puts invariant in write path; stale-ratification structurally impossible under current code
- Implementing real check would duplicate existing `checkStaleGrounding` logic for rounds-comparison

**Alternatives considered:**
- `Implement real check (defense in depth)` — rejected: spec commits to cleared-on-revise; real check redundant
- `Remove sentinel (YAGNI)` — rejected: spec commits to extension callsite; future cluster work may extend
- `Defer to deferred-items` — accepted

**Decision:** Defer to deferred items. Sentinel remains as documented extension callsite returning `[]`.

**Rationale:** Decision is spec-bound; cluster A does not unilaterally remove or extend sentinels the spec preserves. Future cluster B/C may revisit if revise paths grow.

**Confidence:** High — spec line 24 explicit, deferred-items entry created.

---

### Re-ratification guard absent — defer rather than fix

**Context:** Task 4 quality review Important (85) flagged that `ratifyResolveCondition` does not guard against already-ratified RCs — calling twice silently overwrites the ratification object and appends a second log entry. Spec is silent on whether re-ratification (without intervening revise) is permitted.

**Information used:**
- Spec defines clear-on-revise + re-ratify as the documented re-ratify path
- Spec does not explicitly permit or forbid direct re-ratification
- Task 4 implementation reflects spec's stated behavior verbatim

**Alternatives considered:**
- `Add guard` — rejected: would invent semantic decision spec did not commit
- `Defer to deferred items` — accepted: behavior question for designer in future cluster

**Decision:** Defer; record in deferred items file.

**Rationale:** Important findings under skill rule: "use judgment on whether to fix now or defer." Deferring keeps cluster A's diff faithful to spec; designer can decide re-ratification semantics in a follow-up.

**Confidence:** High — deferred-items entry created.

---

### `state.concerns` undefined guard added in Task 7 quality review

**Context:** Task 7 quality reviewer Important (85) flagged that `checkConcernCoverage` lacks a guard against `state.concerns` being null/undefined. State.js always initializes `concerns: []`, so the bug is latent — but checkConcernCoverage is exported and any direct caller (synthetic test states, future server.js handlers) can trigger TypeError.

**Information used:**
- Reviewer empirically confirmed: `state.concerns is not iterable` thrown on synthetic state
- One-line fix: `if (!state.concerns) return { covered: [], uncovered: [] }`
- All existing tests pass with the guard

**Alternatives considered:**
- `Defer to deferred items` — rejected: cheap fix, prevents future-confusion
- `Apply immediately as inline fix` — accepted

**Decision:** Apply guard inline; commit as `fix(proof-mcp): guard checkConcernCoverage against undefined state.concerns`.

**Rationale:** Free safety. Defends against direct callers (e.g., test fixtures, future handlers) without changing happy-path behavior.

**Confidence:** High — fix verified, suite green.

---

### Task 9 acceptance.test.js created in worktree (didn't exist there)

**Context:** During Task 9, the implementer reported the acceptance.test.js file did not exist in the worktree, despite design-specify having scaffolded it earlier. Investigation: design-specify created the file in main repo's untracked state at the spec-write step; the worktree was created from commit `313dd23` which predated the untracked file's existence, so the worktree did not carry the file.

**Information used:**
- Worktree was created from BASE `313dd23`
- acceptance.test.js was untracked in main repo (gitignored? no — just uncommitted)
- Implementer had two options: copy from main, or create fresh

**Alternatives considered:**
- `Copy from main into worktree` — rejected: copying untracked files across worktrees is fragile and creates trust issues
- `Create fresh in worktree` — accepted: implementer wrote 24 stubs matching the skeleton manifest

**Decision:** Create fresh in worktree; manifest-aligned stubs. Tasks 9, 10, 11 then fill stubs in worktree.

**Rationale:** Worktree is the authoritative source for branch contents. Creating fresh ensures the file is properly tracked and committed.

**Confidence:** High — implementer explicit; result functionally equivalent.

---
