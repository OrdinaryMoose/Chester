# Feature Definition Brief: Master-Mode Cascade Archive Drift

**Status:** Draft
**Date:** 2026-05-13

---

## Problem Statement

`finish-archive-artifacts` running under Master Plan Mode silently reverses cascade-document edits made by sub-sprints. The hazard surfaces whenever a sub-sprint task modifies a file under `docs/chester/plans/<master>/design-documents/` (an ADR, the engine spec, the open-questions document) and the sub-sprint then completes its finish sequence. The archive step's `cp -r` from `docs/chester/working/<master>/` to `docs/chester/plans/<master>/` overwrites the just-committed cascade edits with the pre-edit copies that working/ has been carrying since the master plan started.

Concretely during sprint-01-proof-backend-pass-3 (closed 2026-05-13): Tasks 5 and 6 produced four edits to cascade documents — `04-engine-spec.md` §5.3 amendment + front-matter `related_adrs` refresh; `ADR/0019-evaluator-idb-positional-indexing.md` creation; `ADR/0017-existential-quantification-negation-semantics.md` line-reference fix; `engine-open-questions.md` OQ-1 removal. All four were committed cleanly on the sub-sprint branch (commits 270fb45, 4d48a8b, 11544fa). At archive time the `cp -r` then staged a reversion of three of those four files (the ADR-0019 creation survived because no working/-side counterpart existed). The reversion was caught manually via a staged-diff inspection and restored from worktree HEAD before commit, but no skill machinery detected or warned about the drift. A less careful operator would have shipped an archive commit that silently undid the sprint's spec-tier work.

### Prior attempts

None. The issue is structural in the Master Plan Mode archive payload, surfaced for the first time in pass-3 because pass-3 is the first sub-sprint to materially edit cascade documents during execution.

---

## Current State Inventory

### `skills/finish-archive-artifacts/SKILL.md`

- Step 2's `cp -r "$CHESTER_WORKING_DIR/{sprint-subdir}/"* "$WORKTREE_ROOT/$CHESTER_PLANS_DIR/{sprint-subdir}/"` is the offending command in non-master mode and remains the shape under Master Plan Mode (with `{sprint-subdir}` widened to the master directory).
- The skill's documented behavior under Master Plan Mode is "copies the entire master working tree (master-level files + all nested sub-sprint dirs) into the master plans dir." This is exactly what happens — the regression is that the master working tree's `design-documents/` is stale relative to the worktree's `plans/design-documents/` that the sub-sprint just edited.
- The skill assumes working/ is the only mutation target during a sprint. It is not; cascade docs are mutated in plans/.

### `docs/chester/CLAUDE.md`

- Asserts: "`plans/` — tracked in git. Archive-only. Immutable record after merge. No skill writes here except `finish-archive-artifacts`."
- This assertion is violated by sub-sprints that edit cascade documents during execution (Tasks 5 and 6 of pass-3 both wrote to `plans/.../design-documents/` directly). The CLAUDE.md description and the actual practice are out of sync.

### Root `CLAUDE.md` — Master Plan Mode

- Says cascade is the "design cascade lives in `design-documents/`. All sub-sprints are normative against that cascade. No sub-sprint redefines design content; sub-sprints consume it."
- Also: "no sub-sprint edits the master `design-documents/` cascade without an ADR."
- Pass-3's spec mandated ADR-0019 plus an engine-spec §5.3 amendment plus front-matter refresh — by the master CLAUDE.md's own rules, those are normative edits to the cascade, valid because an ADR was added. So edits to cascade docs are sanctioned; the archive flow just doesn't account for them.

### Pass-3 archive run (2026-05-13)

- Source: `docs/chester/working/20260511-01-mp-redesign-proof-system/` — full master working tree, including a stale `design-documents/` snapshot.
- Destination: `docs/chester/plans/20260511-01-mp-redesign-proof-system/` — has the post-sprint cascade edits from Tasks 5/6.
- After `cp -r`: staged diff shows reversion of `04-engine-spec.md`, `engine-open-questions.md`, `ADR/0017-...md` and creation of the new sub-sprint subdirectory. The reversion is dead-set against the sprint's intent.
- Recovery: `git restore --staged --worktree` on the three reverted files, then `cp` from worktree → working/ to sync working/ for next sub-sprint, then commit only the sub-sprint subtree additions.

---

## Governing Constraints

- **Working directory remains gitignored.** Any solution must keep working/ outside git tracking; it is the cross-worktree scratch space.
- **Plans directory remains the merge-time tracked archive.** Any solution must continue to produce a clean archive commit on the sub-sprint branch that lands on main at merge.
- **Master Plan Mode keeps accumulating.** Each sub-sprint's finish carries the entire master working tree to plans/. Solutions that drop the master tree shape are off-table; solutions that change WHICH copy is authoritative are on-table.
- **Cascade edits during sub-sprints are sanctioned.** The master CLAUDE.md explicitly allows them (with an ADR). The design-specify spec template encourages spec amendments. The fix must not forbid cascade edits — it must make them safe.
- **The cross-worktree visibility property must survive.** Multiple sub-sprint worktrees can read working/'s cascade snapshot simultaneously. Any solution must preserve that read path.
- **finish-archive-artifacts is the only skill that writes to plans/.** Per docs/chester/CLAUDE.md. This is the authoritative entry point for the archive flow; the fix should land there or in a pre-flight check it invokes.

---

## Design Direction

The fix needs to resolve the question "which copy of `design-documents/` is authoritative during a sub-sprint" and reconcile working/ and plans/ at the archive boundary. Three candidate directions, presented for comparison rather than recommendation.

### Direction A — Sync working/ from plans/ at archive entry

Before the `cp -r`, the archive skill runs a one-way refresh of `working/<master>/design-documents/` from the worktree's `plans/<master>/design-documents/`. Then `cp -r` carries the freshened working tree to plans/ — the cascade-doc files round-trip but the content matches the worktree's HEAD because that's the authoritative source.

- *Why it works.* Plans/ is the authoritative state for cascade docs during a sub-sprint (sub-sprints write there directly). Working/ is only an inter-worktree distribution channel.
- *Cost.* One pre-flight `cp` step inside finish-archive-artifacts. Constant overhead per sub-sprint close.
- *Risk.* If a different worktree edited working/'s cascade copy after the current sub-sprint started, that edit gets clobbered. Mitigation: master-mode operators are expected to serialize cascade edits to one sub-sprint at a time anyway.

### Direction B — Make working/'s cascade authoritative

Skills that edit cascade docs (design-specify, execute-write tasks that touch design-documents/) write to `working/<master>/design-documents/` instead of `plans/<master>/design-documents/`. The archive flow's `cp -r` then carries the canonical edits forward correctly with no special handling.

- *Why it works.* working/ is the cross-worktree distribution channel anyway. Making it the edit target means the archive copy is always a faithful snapshot.
- *Cost.* Every skill that edits cascade docs needs path translation logic ("under master plan mode, write to working/, not plans/"). The plan-build/execute-write contracts get more conditional. Implementer-facing plans must be rewritten to use the correct path.
- *Risk.* During a sub-sprint, the worktree's plans/ copy diverges from working/'s copy. Anyone reading plans/ in the worktree sees pre-edit content. Cross-worktree readers see post-edit content. Reverse of today's divergence.

### Direction C — Detect divergence at archive entry; abort or prompt

The archive skill compares the contents of `working/<master>/design-documents/` against `plans/<master>/design-documents/` (worktree state) before the `cp -r`. If they differ, it surfaces the divergence to the operator with three explicit options: (1) prefer plans/ (worktree edits win, sync working/ ← worktree); (2) prefer working/ (worktree edits get reverted, accept it); (3) abort the archive.

- *Why it works.* Makes the silent divergence loud. Operator gets to choose explicitly.
- *Cost.* One per-file diff loop. Adds an interactive prompt to a finish-sequence step that is otherwise automated.
- *Risk.* If divergence is common (which is hard to predict without more cascade-editing sub-sprints), the prompt becomes friction and operators may rubber-stamp option (1) every time, reducing it to Direction A with extra steps. If divergence is rare, the prompt is appropriate friction.

---

## Acceptance Criteria for the Chosen Direction

Any solution should satisfy:

1. **Round-trip preservation.** A cascade-doc edit committed in the sub-sprint's worktree appears in main's history after `finish-archive-artifacts` + `finish-close-worktree` complete; no reversion is staged silently.
2. **Cross-worktree visibility.** Other sub-sprint worktrees opening the same master plan see the cascade edits via `working/<master>/design-documents/` after the source sub-sprint's archive runs.
3. **No regression in non-master mode.** Single-sprint mode (no `.active-master` breadcrumb) continues to copy `working/<sprint-dir>/` → `plans/<sprint-dir>/` as today; no cascade-doc concerns exist there.
4. **The chosen direction is testable.** A bash test in `tests/` constructs a master-mode + cascade-edit scenario and asserts the archive commit reflects the worktree's HEAD, not the working/ snapshot.
5. **The fix docs in `docs/chester/CLAUDE.md` are amended** to reflect actual practice (the "no skill writes to plans/ except finish-archive-artifacts" assertion needs softening if cascade edits in sub-sprints are sanctioned, or hardening if Direction B is chosen).

---

## Residual Risks

- The "ADR-required for cascade edits" rule in the master CLAUDE.md is enforced today only by convention. A sub-sprint that edits a cascade doc without filing an ADR would slip through any of the three directions. Out of scope for this brief but worth flagging.
- Direction A and Direction C both keep cascade edits flowing through plans/ inside the worktree. If a future master-mode operator forgets that and edits working/ directly, that edit gets clobbered by the worktree's plans/ on the next archive. Documentation can mitigate; structure cannot, under those two directions.
- Master Plan Mode is a young convention with one master plan currently active (`20260511-01-mp-redesign-proof-system`). The fix surface may interact with the "living-document persistence gap" already documented in `docs/chester/CLAUDE.md` and the root `CLAUDE.md`; those are about `master-plan.md` drift, but the underlying mechanism (working/ vs plans/ divergence in master mode) is the same shape.

---

*Captured following the manual recovery during sprint-01-proof-backend-pass-3's finish sequence. The recovery added ~10 minutes of manual archive validation; a similar drift on a less-watched archive could have produced a clean-looking commit that silently reverted spec-tier work.*
