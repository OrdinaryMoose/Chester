# Adversarial Review: Cascading Output Directory Plan

**Plan:** `docs/skills/superpowers/plans/2026-03-19-cascading-output-directory-plan.md`
**Codebase:** `/home/mike/RiderProjects/StoryDesigner/`
**Date:** 2026-04-04

---

## Finding 1: ALL target files in Tasks 1-3 do not exist (CRITICAL)

**Severity: Structural / Blocking**

Tasks 1, 2, and 3 target files under a `superpowers` plugin path that does not exist on this system:

- `/home/mike/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/brainstorming/SKILL.md` -- **does not exist**
- `/home/mike/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/writing-plans/SKILL.md` -- **does not exist**
- `/home/mike/.claude/plugins/cache/claude-plugins-official/superpowers/5.0.5/skills/executing-plans/SKILL.md` -- **does not exist**

There is no `superpowers` directory anywhere under `/home/mike/.claude/plugins/cache/`. The installed plugins are: `linear`, `skill-creator`, `feature-dev`, `coderabbit`, and `oh-my-claudecode`.

The skills the plan intends to modify exist in the StoryDesigner project's worktrees as **megapowers** skills (e.g., `.claude/worktrees/agent-aaa2c72e/.claude/skills/megapowers-brainstorming/SKILL.md`), not as a superpowers plugin. This means Tasks 1, 2, 3, and 6 are entirely unexecutable as written -- the file paths point to nothing.

## Finding 2: Tasks 4 and 5 target paths that also do not exist on main (HIGH)

**Severity: Structural**

Task 4 targets `/home/mike/RiderProjects/StoryDesigner/.claude/skills/session-summary/SKILL.md` and Task 5 targets `/home/mike/RiderProjects/StoryDesigner/.claude/skills/reasoning-audit/SKILL.md`.

Neither exists on the main branch. The main branch skills directory contains only:
- `master-plan-generator/`
- `span-inspect/`
- `task-tracker/`

These skills exist in worktree copies (e.g., `.claude/worktrees/agent-aaa2c72e/.claude/skills/session-summary/`), but not at the paths the plan specifies.

## Finding 3: Plan has already been implemented in worktrees (HIGH)

**Severity: Execution risk / Waste**

The worktree copies of session-summary, reasoning-audit, megapowers-brainstorming, megapowers-writing-plans, and megapowers-executing-plans already contain all the changes described in this plan:

- `session-summary/SKILL.md` Step 0 already has the cascading priority order with `output_dir`/`sprint_prefix` frontmatter inheritance (line 38 in worktree copy)
- `reasoning-audit/SKILL.md` Step 1 already has the cascading priority order (line 56 in worktree copy)
- `reasoning-audit/audit-formats.md` already has the "Sprint-prefixed naming" section (line 20-25 in worktree copy)
- `session-summary/references/summary-formats.md` already has the "Sprint-prefixed naming" section (line 29+ in worktree copy)
- `megapowers-brainstorming/SKILL.md` already has step 2 "Ask output directory preference" in the checklist (line 26) and the updated dot graph
- `megapowers-writing-plans/SKILL.md` already has output_dir inheritance instructions (line 19-23) and the plan header frontmatter template (lines 53-59)
- `megapowers-executing-plans/SKILL.md` already has frontmatter check in Step 1 (line 21) and the Deferred Items section (lines 59-80)

Implementing this plan would duplicate already-completed work, or would need to be explicitly scoped as "merge worktree changes to main."

## Finding 4: `Documents/Refactor/` path does not exist on main (MEDIUM)

**Severity: Assumption gap**

The plan's sprint auto-detection logic says to "Scan for existing `Documents/Refactor/Sprint NNN` directories." On the main branch, `Documents/` does not exist at all. Sprint directories live under `docs/refactor/` instead (containing Sprints 001 through 052).

The worktree copy at `agent-aaa2c72e` has a `Documents/Refactor/` directory, but it only goes up to Sprint 034 and appears to be a historical artifact. The current and active sprint directory structure is `docs/refactor/Sprint NNN <topic>/`.

The plan's auto-detection glob would scan the wrong path and fail to find existing sprints.

## Finding 5: Plan references `docs/superpowers/` throughout but actual paths are `docs/skills/superpowers/` or `docs/megapowers/` (MEDIUM)

**Severity: Internal contradiction**

The plan uses `docs/superpowers/specs/`, `docs/superpowers/plans/`, `docs/superpowers/deferred/`, etc. as the "default" paths. On the main branch, the actual path is `docs/skills/superpowers/specs/` and `docs/skills/superpowers/plans/`. The already-implemented worktree versions use `docs/megapowers/` paths (visible in the writing-plans SKILL.md line 21 and executing-plans SKILL.md line 63).

This is a naming inconsistency that runs throughout all seven tasks.

## Finding 6: Task 6 references reviewer prompt files that cannot be verified (LOW)

**Severity: Unverifiable**

Task 6 modifies:
- `skills/brainstorming/spec-document-reviewer-prompt.md`
- `skills/writing-plans/plan-document-reviewer-prompt.md`

Both are under the non-existent superpowers plugin path. The "Old" text block the plan says to replace (`**Dispatch after:** Spec document is written to docs/superpowers/specs/`) cannot be verified against actual file contents.

## Finding 7: Reasoning-audit writes to `summary/` subdirectory -- same as session-summary (LOW)

**Severity: Design ambiguity**

The plan's Task 7 "happy path" trace (line 444) shows reasoning-audit writing to `<output_dir>/summary/Sprint032-Reasoning-Audit.md`. Both session-summary and reasoning-audit share the `summary/` subdirectory. This is consistent with the implemented worktree versions but differs from the default-path behavior, where reasoning-audit writes to `docs/superpowers/reasoning/` (a separate directory from summaries). The plan doesn't call this out as an intentional flattening.

## Verified Assumptions

- **Sprint directory naming convention is established:** Confirmed. `docs/refactor/` contains Sprint 001 through Sprint 052, with the pattern `Sprint NNN <topic>`.
- **Frontmatter inheritance chain is coherent:** The design of brainstorming -> spec frontmatter -> writing-plans -> plan frontmatter -> downstream skills is logically sound and the already-implemented versions in the worktrees demonstrate it works.
- **Session-summary and reasoning-audit do have Step 0/Step 1 "Determine Output Directory" sections:** Confirmed in the worktree copies. The plan's "Old" text for Tasks 4 and 5 matches what would have existed before the worktree changes were made.

---

## Risk Assessment

This plan cannot land as written. Three of its seven tasks target files under a `superpowers` plugin path that does not exist on this system, and the remaining tasks target files that only exist in worktrees, not on the main branch. Furthermore, the plan has already been fully implemented in the worktree copies (under "megapowers" naming). The plan is either outdated (written before a superpowers-to-megapowers rename) or was written against a different system state. Before any implementation attempt, the plan needs to be reconciled with the actual file locations and the work that already exists in the worktrees.
