# Reasoning Audit: Team-Lead Context Economy in the Ad-hoc Committee

**Date:** 2026-06-05
**Session:** `00`
**Plan:** `20260604-01-update-committee-context-management-plan-00.md`

## Executive Summary

The session ran Chester's full pipeline on a change to the committee skill itself, opening with a proof-of-principle committee review that exposed — live — the feature's central tooling gap (members cannot write to disk). The most consequential decision was the designer *dissolving* the single/multi-round cutover rather than choosing a trigger, which removed an entire branch of skill logic. One process failure occurred and was corrected: the team-lead (the orchestrating agent) tore the committee down without a designer closure signal; root-causing it surfaced a real ambiguity in the committee skill that the designer then fixed. Implementation stayed on-plan; the layered reviews each caught defects the prior layer structurally could not.

## Plan Development

The plan was derived top-down from a committee-adjudicated `-01` brief through `design-specify` (which chose a hybrid architecture via competing architects) into `plan-build`. Because the brief was heavily pre-adjudicated, the architect axes converged, shifting the real design work onto a few mechanical forks resolved in the hybrid. The plan decomposed into 8 docs-producing tasks with bash structural assertions as the test surface.

## Decision Log

### Cutover dissolved rather than triggered (Decision 4)
**Context:** The brief proposed a cutover so single-round consults wouldn't pay Consolidator/ledger overhead; the open question was the trigger mechanism. The designer pushed back: "there should only be one type of ad-hoc setup, no additional skill burden of a gate."
**Information used:** The existing unconditional record-file pattern ("there is no conversation-only mode"); the asymmetric cost intuition that a branch not written cannot drift.
**Alternatives considered:**
- `Round-count-automatic trigger` — rejected: still branch logic the designer rejected.
- `Wrapping-skill declaration` — rejected: fails the standalone case (no wrapper to declare).
**Decision:** No cutover at all — one unconditional path; disciplines always on; one extra Consolidator spawn on a single-round consult is the accepted cost.
**Rationale:** Removing the fork eliminates the skill burden and a whole class of drift; matches Chester's existing unconditional-persistence precedent.
**Confidence:** High — designer stated the reframing explicitly.

---

### Re-point stale citations instead of reconstructing sister briefs (Decision 3)
**Context:** The brief cited two sister briefs that the researcher found absent. The fork was reconstruct-the-docs vs restate-inline.
**Information used:** A targeted researcher follow-up mapping each cited constraint to existing skill files — 2 already in `skill-contract.md`, 2 absorbable by one-line edits, 1 genuine orphan (late-evidence sub-rounds), the Ad-hoc/architect split already real across two skills.
**Alternatives considered:**
- `Reconstruct both briefs` — rejected: writing two documents to re-create content that already migrated into `skill-contract.md`.
**Decision:** Re-point citations to `skill-contract.md`, fold two one-liners, demote the late-evidence orphan to a future brief.
**Rationale:** The citations were stale, not broken — the substance already exists; reconstruction would be the tail wagging the dog.
**Confidence:** High — researcher evidence was decisive and the designer chose (a).

---

### Proof-of-principle run exposed the member-Write gap
**Context:** The designer asked the team-lead to run the committee under the brief's proposed disciplines as a live test.
**Information used:** The member agent tool grants (`Read, Glob, Grep` only) discovered by the researcher; the live fact that all four members had already messaged full positions into the team-lead's context.
**Alternatives considered:**
- `Treat the brief as paper-reviewable only` — rejected: would have missed the tooling precondition.
**Decision:** Run it for real, surface that discipline 3 (digest-to-lead) is unbuildable without a Write grant, and that the "renamed conduit" trap is real.
**Rationale:** Executing the discipline is what exposed the gap in the discipline; this made D1 and D6 concrete instead of theoretical.
**Confidence:** High — demonstrated in-session.

---

### Committee teardown without designer signal (process failure + recovery)
**Context:** After the seventh decision was answered, the team-lead ran the skill's closure flow and `TeamDelete`d the committee. The designer had not signaled closure.
**Information used:** On root-cause, `team-lead.md:123` ("Designer signals closure") vs `SKILL.md:111` ("after designer adjudicates") — the latter reads like a per-decision trigger.
**Alternatives considered:**
- `Defend the teardown as skill-compliant` — rejected: the skill required a designer closure signal that never came.
**Decision:** Own the error, root-cause it to a skill ambiguity, and offer to re-convene from the persisted record. The designer then manually fixed the skill (only the designer may terminate the committee).
**Rationale:** The teardown was against the skill, not licensed by it; the persisted record meant no deliberation was lost.
**Confidence:** High — error and fix both explicit.

---

### Hybrid: Consolidator writes its own file (third-shape on the write fork)
**Context:** The two architects split on the Consolidator's write model — Architect A gave it Write to the shared record (two-writer race); Architect B made it read-only with the team-lead writing (no race, but team-lead does more).
**Information used:** The round-folder layout (everything is separate files); the goal of keeping synthesis off the team-lead thread.
**Alternatives considered:**
- `A: Consolidator writes the shared record` — rejected: two-writer race on `committee-analysis.md`.
- `B: team-lead writes the Consolidator's output` — rejected: weaker separation.
**Decision:** Consolidator has Write but writes its *own* `consolidator-output.md`; team-lead writes only `committee-analysis.md`.
**Rationale:** Kills the race (different files) and keeps synthesis off-thread — neither pure-A nor pure-B got both.
**Confidence:** High — designer chose the hybrid.

---

### Rejected a cold-reviewer finding that contradicted the target (Task 1 quality)
**Context:** The Task-1 quality reviewer recommended adding "the team-lead's record lives in `design/`" to `member-protocol.md`.
**Information used:** The target design moves the record *out* of `design/` into `committee/roundNN/` (Tasks 5/6); the reviewer ran cold against the not-yet-updated `team-lead.md`.
**Alternatives considered:**
- `Apply the finding` — rejected: would plant the exact stale-location text the sprint removes.
**Decision:** Reject the Minor with reason; apply only the two real test-robustness fixes.
**Rationale:** A cold per-task reviewer can flag correct-for-today-but-wrong-for-target text; the orchestrator holds the target context the reviewer lacks.
**Confidence:** High — explicit reasoning at the time.

---

### Task-5 Critical reclassified as Tasks 6/7 work
**Context:** The Task-5 quality reviewer flagged a Critical: `team-lead.md` still describes the old model and contradicts the new template.
**Information used:** The plan sequences `team-lead.md` (Task 6) and `SKILL.md` (Task 7) immediately after; the plan's atomic-landing note (coherent only once all land).
**Alternatives considered:**
- `Re-dispatch Task 5 to fix team-lead.md` — rejected: scope creep into the wrong task/commit.
**Decision:** Record the Critical as resolved-by-next-tasks; do not pull the edit into Task 5.
**Rationale:** It was expected interim incoherence, not a Task-5 defect; the planned sequence resolves it.
**Confidence:** High — borne out when Task 6 resolved it.

---

### Fast-forwarded the sprint branch to main before executing
**Context:** The worktree branch sat at `ac0e3ce`, missing the closure-authority fix (`099d46c`) that edits the same files the plan edits.
**Information used:** `git merge-base --is-ancestor` confirmed the branch lacked the fix; the branch had no commits of its own (ancestor of main).
**Alternatives considered:**
- `Execute on the stale branch` — rejected: feature edits would collide with main's closure fix at merge.
**Decision:** Fast-forward the branch to `b54be36` first (clean, no merge commit).
**Rationale:** Catching it pre-execution made it a fast-forward; post-execution it would have been a real merge on the same files.
**Confidence:** High — verified before and after.

---

### Proved no regressions via base-vs-HEAD failure-count comparison
**Context:** The full repo suite showed 33 failures; the Iron Law forbids completion claims without evidence.
**Information used:** Failure count at merge-base `b54be36` (33) vs HEAD (33); intersection of changed files with failing test files (empty).
**Alternatives considered:**
- `Assert "failures are pre-existing" from the implementer's word` — rejected: not fresh evidence.
**Decision:** Run the suite at both base and HEAD and compare; confirm no failing test inspects a changed file.
**Rationale:** "The suite has failures" is meaningless without the counterfactual; equal counts + no overlap proves no regression.
**Confidence:** High — measured directly.

---

### Designer-directed mitigations M1 + M3, M2 declined
**Context:** At the hardening gate the designer chose "proceed with directed mitigations" and selected M1 + M3.
**Information used:** plan-smell's watch-items (committee/ path fork duplicated across two files; member-protocol whole-file citations).
**Alternatives considered:**
- `M2 — structural Consolidator-ceiling guard` — not directed: the prose ceiling stands, consistent with the existing committee trust model.
**Decision:** Make `member-protocol.md` the single authority for committee-root resolution (M1) and give it named citable sections (M3); leave the Consolidator ceiling prose-only.
**Rationale:** M1/M3 remove real drift surfaces cheaply; M2 would add a guard the existing trust model doesn't have for any other agent.
**Confidence:** High — designer selected explicitly.

<!-- created-at: 2026-06-05T08:30:51Z -->
<!-- produced-by finish-write-records@v0004 -->
