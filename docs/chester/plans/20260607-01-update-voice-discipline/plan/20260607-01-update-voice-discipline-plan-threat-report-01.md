# Plan Threat Report — plan-02 (catalog-only generator + voice/rule single-sourcing)

**Sprint:** 20260607-01-update-voice-discipline
**Plan:** plan/20260607-01-update-voice-discipline-plan-02.md
**Date:** 2026-06-08

## Hardening configuration

- **plan-attack:** run (unconditional).
- **plan-smell:** SKIPPED by designer directive — not a heuristic miss. The designer instructed "skip smell" for this hardening pass. (For the record, this is a bounded refactor + authoring-edit sprint with no new composition/lifetime/persistence surface, so the smell pre-check would likely not have fired regardless.)
- **Ground-truth cascade:** the only spec-stage report is `-00`, produced against the abandoned spec-00 scope (members generated, reviewers single-sourced). Treated as UNTRUSTED; plan-02 modifies nearly every anchor it touches, so the attacker re-verified all anchors against the worktree directly.
- **Read scope:** main branch + current worktree only (no other `.worktrees/` sprints).

## Findings and dispositions

### Critical

- **C-1 — Double `git rm` in Task 1 (Steps 4 + 5).** Step 4 runs `git rm tests/test-generate-agents-core.sh`; Step 5's commit block ran it again, which aborts with `fatal: pathspec ... did not match` and breaks the commit. **FIXED:** Step 5 no longer runs `git rm`; it relies on Step 4's staged deletion and only stages the two modified files before committing.

### Important (no code fix required)

- **I-1 — Task 1 Step 2 fail-reasoning is partly distracting** but the test fails for the correct reason (the `emit_agent` absence grep fires while the function still exists). Behavior is correct. No change.
- **I-2 — `emit_catalog` null-catalog behavior changed** from `return 0` to `exit 4`. The only test exercising a null catalog is deleted in the same task; the Task 2 manifest always carries a real catalog entry. Benign. No change.

### Minor (all fixed)

- **M-1 — `TMP2` unbound in the EXIT trap** of the new verify test under `set -u` if it aborts early. **FIXED:** both temp dirs are declared up front with a single trap.
- **M-2 — Stale PASS footer** in `test-partner-role-discipline.sh` after AC-7.1 assertions land. **FIXED:** Task 3 Step 4 now makes the footer update mandatory.
- **M-3 — Redundant `$SMALL` reassignment** in Task 4's appended test block. **FIXED:** the duplicate declaration is removed; only `$LEAD` is new.

## Verified correct (attacker-confirmed, reduces implementer uncertainty)

- Phantom-pointer assertion is bounded correctly — `setup-start/SKILL.md` appears only at root `CLAUDE.md:86` (the line Task 5 replaces); the `session-start` hook line uses `setup-start` without `/SKILL.md` and does not false-match.
- All cited line numbers confirmed (`design-small-task:187,209`; `team-lead.md:288,299`).
- All version bumps correct (`util-design-partner-role` v0005→v0006; `design-small-task` v0003→v0004; `team-lead.md` v0008→v0009).
- Task ordering is safe — no task's commit breaks a prior task's green test; catalog generation does not change any modified skill's `description`, so the verify test stays green through Tasks 3–5.
- Determinism holds — `LC_ALL=C sort` on tab-separated records is stable regardless of glob order.

## Combined implementation risk: LOW

Reasons:
- The single Critical was a commit-block mechanics bug, now fixed; it carried no design or contract risk.
- All other findings are minor and fixed; two Important findings need no change.
- The attacker independently verified the load-bearing assumptions (phantom-pointer bounding, line numbers, version bumps, ordering, determinism) against the actual worktree.
- Scope is a bounded refactor (strip + build catalog pipeline) plus mechanical authoring edits, each task one commit with a TDD gate.

<!-- created-at: 2026-06-08 -->

<!-- created-at: 2026-06-08T15:41:19Z -->
<!-- produced-by plan-build@v0006 -->
