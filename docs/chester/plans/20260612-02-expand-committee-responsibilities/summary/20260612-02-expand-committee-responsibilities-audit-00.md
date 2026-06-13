# Reasoning Audit — Decompose the Specification System

**Sprint:** 20260612-02-expand-committee-responsibilities
**Date:** 2026-06-12 / 2026-06-13
**Scope:** plan-build + execute-write phases (the design phase is recorded in the committee ledger/resolution).

Ordered by consequence, not chronology. Each entry carries a calibrated confidence.

## 1. The version-bump principle: bump iff a contract changed, not per grep-hit

- **Context:** ~20 files referenced `design-specify`; many edits were dead-token repoints. Bumping every touched skill would cascade version-pin-test churn; bumping none would understate real contract changes.
- **Information used:** CLAUDE.md's version rule ("bump on meaningful behavior/contract change — not typos or comment-only edits") + the discovered set of version-pin tests coupling each skill's version to a hard-coded assertion.
- **Alternatives:** (a) bump every edited skill (max provenance honesty, max pin churn); (b) bump none (min churn, dishonest provenance); (c) bump iff the edit changes a stated transition / invoked-by / producer-identity / standalone-support contract, treat descriptive pipeline prose as comment-level.
- **Decision:** (c). Bumped design-small-task, util-artifact-schema, plan-build, start-bootstrap, finish-write-records; left execute-write and design-committee unbumped (descriptive mentions only).
- **Rationale:** keeps version churn — and the coupled pin-test churn it drags — proportional to actual contract change, which is exactly what the carve-out is for.
- **Confidence:** High. Every bumped skill had a transition/identity edit; the two unbumped had pure prose; the final integration review confirmed pin coherence.

## 2. Treating catalog freshness as a per-commit invariant

- **Context:** the plan first regenerated the skill catalog once, at a terminal task.
- **Information used:** plan-attacker finding + direct read of `test-generated-agents-current.sh`, which regenerates the catalog and diffs it against the committed `skill-index.md` — so any commit changing a skill name/description or the skill set without regenerating red-bars immediately.
- **Alternatives:** (a) regenerate once at the end (original plan — leaves intermediate commits red); (b) exclude skill-index from the gate (weakens it); (c) regenerate-and-stage in every commit that mutates a catalog input.
- **Decision:** (c). Added catalog regen to Tasks 1–4 (new skills + design-small-task's description) and Task 11 (deletion); confirmed body-only Tasks 5–9 need none (version is not a catalog input).
- **Rationale:** the freshness test makes the catalog a per-commit invariant, not an end-state one; the "suite-green-at-each-commit" guarantee can't hold otherwise.
- **Confidence:** High. Validated in execution — Task 7's implementer independently hit this (its line-7 edit fell inside the description block) and correctly regenerated.

## 3. Overriding a spec-reviewer "Fail" verdict on Task 2 with documented rationale

- **Context:** the Task 2 spec reviewer returned Fail (conf 83): moving `spec-template.md` out of `design-specify/references/` left `design-specify/SKILL.md` with a dangling link while design-specify still existed.
- **Information used:** the plan's own Task 3 note pre-adjudicating this exact transient ("dangling links… deleted in Task 11"); a fresh whole-suite run showing 0 failures; the reasoning that extraction necessarily moves a file before the old skill is deleted.
- **Alternatives:** (a) re-dispatch to "fix" (revert the move → lose git history, or edit out-of-scope design-specify → pointless, deleted in Task 11); (b) accept with rationale + verify the real invariant (whole suite green).
- **Decision:** (b). The finding was correct-but-intentional; spec-write was built exactly to spec; proceeded.
- **Rationale:** "reviewers are advisory" — the finding named a real fact that the plan had already accepted, and the binding invariant (suite green, design-specify deleted in Task 11) held.
- **Confidence:** High. Distinguished an accepted plan-transient from genuine spec drift; the final cutover confirmed the link vanished cleanly.

## 4. Execution mode = subagent

- **Context:** plan-build's Execution Mode Selection heuristic, run against the hardened 12-task plan.
- **Information used:** task count 12 (fail ≤3), decision-budget sum 22 (fail ≤4), threat risk Moderate (pass), no multi-file code-producing tasks (vacuous pass — all docs/config).
- **Alternatives:** inline (lower overhead, lower per-task review independence) vs subagent (per-task spec+quality review, higher dispatch cost).
- **Decision:** subagent (two conditions fail); user confirmed.
- **Rationale:** per-task review independence pays for itself across a 12-task, 20-file migration; wrong-direction inline corrupts review independence, the costlier error.
- **Confidence:** High. Heuristic was unambiguous; execution surfaced two real per-task findings (FAC-grep false-positive, doc-preflight gap) that independent review caught.

## 5. Quality-reviewer skip discipline per task

- **Context:** execute-write's quality reviewer is skip-eligible; the spec reviewer is not.
- **Information used:** the prose-only skip path (skip only when EVERY changed file is documentation, none a script/config) keyed on the observed diff.
- **Alternatives:** skip quality everywhere (faster, violates the contract on script-touching tasks) vs run everywhere (honors letter, wasteful on pure-prose tasks) vs apply the path precisely.
- **Decision:** ran quality for every task touching a `.sh` test (Tasks 1–8, 11); skipped it for Tasks 9–10 (both pure `.md` skill/doc prose).
- **Rationale:** a `.sh` test is a script, so the prose-only path genuinely failed on most tasks; Tasks 9–10 genuinely qualified.
- **Confidence:** High. Mechanically determined from each task's observed file set.

## 6. Verifying leadSessionId before dismissing the committee

- **Context:** user directed "dismiss committee" while a five-member design-committee team was still convened.
- **Information used:** prior feedback (committee dismiss = current session's team only; never tear down other sessions' teams) → read `~/.claude/teams/design-committee-spec-write-process/config.json` and confirmed `leadSessionId` matched this session before `TeamDelete`.
- **Alternatives:** delete immediately (risks tearing down an unrelated session's team) vs verify ownership first.
- **Decision:** verified leadSessionId == this session, then shutdown all five members → TeamDelete.
- **Rationale:** teardown scope is session-local; the check is the guard against cross-session damage.
- **Confidence:** High. Config confirmed ownership; teardown succeeded cleanly.

## 7. Building in a dedicated worktree rather than on main

- **Context:** the sprint reached plan-build via the committee→standalone path, which skips `design-small-task` — so no worktree had been created, and the session sat on `main`.
- **Information used:** Chester's worktree model + the user's preference for clean git history; a pre-existing worktree/branch for this sprint was found already present.
- **Alternatives:** 13 commits directly on main (muddies history) vs an isolated worktree (branch-scoped edits, gitignored working/ shared across worktrees).
- **Decision:** used the existing worktree; all implementer edits and commits landed on the branch; main stayed clean (save one infra `.gitignore` chore).
- **Rationale:** branch isolation keeps main clean and matches the finish-close-worktree merge flow.
- **Confidence:** Medium-High. Correct outcome; minor wrinkle — one `.gitignore` chore committed to main before the worktree was confirmed, immaterial to the migration.


<!-- created-at: 2026-06-13T10:22:12Z -->
<!-- produced-by finish-write-records@v0004 -->
