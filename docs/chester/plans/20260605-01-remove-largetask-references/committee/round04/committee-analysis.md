# Committee Analysis — Plan Rounds (03 develop, 04 attack)

**Sprint:** 20260605-01-remove-largetask-references
**Rounds:** 03 (develop the plan) + 04 (attack the plan)
**Question:** Decompose the approved spec (24 ACs) into a bite-sized, lockstep-safe TDD implementation plan, then adversarially harden it.
**Deliverables:** `plan/…-plan-00.md` (hardened) + `plan/…-plan-threat-report-00.md`.

## Outcome in one line

A 10-task by-commit-unit plan, subagent execution mode, all 24 ACs traced, combined risk Low after hardening. The attack round caught one blocker and a class of silent-failure presence checks; all folded in. No structural defect survived to the plan.

## Round 03 — Develop

The decomposition question split four ways on granularity (6 / 9+cap / 10 / 10+cap). The deciding constraint was the **lockstep rule**: a scrubbed file and the tests that pin it (text *and* version) must co-commit, or the suite goes red mid-sprint. By-commit-unit was the only shape satisfying that invariant; by-file breaks it directly, by-AC is too fine.

The round's load-bearing output was not the task count but the **ground-truth correction**: the spec's AC-4.x names 4 pinning tests; the worktree has **9 version-pinning assertions across 7 test files** that break on the AC-5.1 bumps, and AC-1.7's premise (design-large-task present in setup-start) is **already false** — both files are grep-zero, so the real work is a conditional skill-index sync, not a removal. A planner trusting the spec's line lists verbatim would have shipped a red suite and a no-op AC.

## Round 04 — Attack

`plan-smell` did not fire (zero trigger match — documentation/test refactor). `plan-attack` ran via the four lenses plus researcher codebase verification. Alignment: **4/4 — structurally sound, no restructuring; 0/4 — safe as-is** (every member found patchable gaps).

Defect census: **1 Blocker, 7 Important, 8 Minor** — all task-prose precision gaps, none structural:
- **Blocker:** plan-build had a 5th `design-large-task` occurrence (L19) the draft missed → would have failed AC-1.3's grep-zero.
- **Presence-check theater:** three re-point ACs verified file-wide counts that a surviving sentence keeps positive even if the actual re-point is skipped → replaced with targeted, edit-specific greps.
- **Category rulings:** OD-1 (record-formats) resolved per-occurrence to avoid false equivalence and a `Session Skill Versions` block-deletion hazard; OD-4 (upsize block) deleted entirely with rationale in the commit message, honoring standalone-documentation discipline.
- **Task-8 degeneracy:** reframed as conditional-sync + precautionary bump, with the L56 no-touch hazard and a missing must-remain-green test added.

All findings are folded into plan-00 and recorded in the threat report.

## Structural certification

Conservator's red-suite walk certified all 10 commits green-by-construction: every version-pinning assertion is paired in the same atomic commit as the scrub/bump that would break it. The suite stays green after every commit by design, not by ordering luck.

## Designer decision (pending)

Per the plan-build hardening gate: proceed / proceed with mitigations / return to design / stop. Committee read: ready to execute (subagent mode). The only soft spot — Task 8 may reduce to a version bump — is bounded and documented, not a risk.

---

### Change log

- 2026-06-05 — Authored by the design-committee team-lead from round-03 develop digests and round-04 attack digests, plus both consolidator-output enumerations. Synthesis of conservator (lockstep + red-suite walk), purist (AC-trace + category rulings), pragmatist (budgets + execution mode), innovator (decomposition shape + structural attack), researcher (ground truth + codebase verification).
