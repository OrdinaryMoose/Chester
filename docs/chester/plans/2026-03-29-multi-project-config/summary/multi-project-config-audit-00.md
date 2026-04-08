# Reasoning Audit: Sprint 006 — Multi-Project Config

**Date:** 2026-03-30
**Session:** `cbdbfb87-40aa-47ce-9b9c-f2422114aa46`

## Decision Chain

### 1. Problem Framing

**Input:** User asked to "figure out the proper paths and configurations for chester to operate in multiple solution directories."

**Interpretation:** This was a design problem, not a code change. Invoked chester-figure-out to resolve open design questions before touching code.

**Alternative considered:** Jumping straight to implementation based on the existing plan at `rustling-scribbling-kay.md`. Rejected because that plan had already been denied twice by the user with corrections, indicating the design wasn't settled.

### 2. Directory Prompt Scope

**Question:** Should first-run ask about one directory or both?

**Initial assumption:** Only plans directory (carried over from the earlier rejected plan).

**User correction:** Both directories.

**Impact:** Changed the first-run UX to prompt for both paths. This was a direct user preference, not a technical decision.

### 3. User Config Purpose

**Question:** What belongs in user-level config?

**User answer:** Cross-project settings like budget_guard, with more possible in the future.

**Decision:** Keep the merge pipeline for user config (don't ignore it entirely), but exclude directory paths from it. This preserved future extensibility while enforcing project-local directory scoping.

### 4. Config File Location

**Question:** Where should project config live?

**Signal:** User said "match how Claude does it."

**Research:** Explored how Claude Code stores project config — found `.claude/settings.local.json` pattern.

**Decision:** Chester config at `{project-root}/.claude/settings.chester.local.json` and `~/.claude/settings.chester.json`. The `.chester` infix distinguishes Chester from Claude's own config. The `.local` suffix marks project-scoped files.

**Alternative considered:** Keeping the `.chester/` directory. Rejected because it contradicts the "match Claude" directive and adds an unnecessary parallel config directory.

### 5. Merge Semantics

**Question:** Who wins when project and user configs conflict?

**User answer:** Project wins.

**Decision:** Deep merge with project overriding user for all shared keys. Directory keys additionally restricted to project-only sourcing.

### 6. No Migration

**Decision:** No migration code for old config locations.

**Rationale:** The spec explicitly states "No new migration code — old `.chester/` directories are left in place, not auto-cleaned." This was a design choice to avoid complexity, not an oversight.

**Trade-off:** Users with old configs need to manually copy their settings. On this machine, the user config was copied during the session (`~/.claude/.chester/.settings.chester.json` to `~/.claude/settings.chester.json`).

### 7. Hardening Findings

**Critical finding:** Budget guard paths hardcoded in 5 skills — not covered by original plan.

**Decision:** Add Task 5 to update all 5 skills. This was the most valuable hardening outcome — would have caused silent budget guard degradation post-merge.

**Also added:** Task 6 (two orphaned test files) and Task 7 (visual-companion removal per user request mid-hardening).

### 8. Merge Fix

**Issue:** After merging to main, integration test failed — `chester-start missing debug cleanup`.

**Root cause:** The Task 4 subagent replaced the first-run section but the merge auto-resolved by dropping the debug cleanup and jq verification steps that preceded it.

**Fix:** Restored the two missing sections from the pre-merge main version. This demonstrates why post-merge test verification is critical — auto-merge can silently drop content.

## Key Reasoning Shifts

| # | From | To | Trigger |
|---|------|----|---------|
| 1 | Plans dir only | Both dirs prompted | User correction |
| 2 | Separate `.chester/` dir | Inside `.claude/` | "Match how Claude does it" |
| 3 | 5-task plan | 8-task plan | Hardening found budget guard gap |
| 4 | Merge complete | Merge + fix | Post-merge test failure caught dropped content |

## Information Sources

| Source | How Used |
|--------|----------|
| Claude Code `.claude/settings.local.json` convention | Determined config file naming and location |
| Existing `chester-config-read.sh` (89 lines) | Understood current resolution logic to write replacement |
| 5 SKILL.md files with budget guard | Discovered hardcoded paths during hardening |
| `test-integration.sh` and `test-chester-config.sh` | Found orphaned old-path references during hardening |
| Pre-merge main `chester-start/SKILL.md` | Restored debug cleanup lost in merge |

## What Worked Well

- Hardening caught the budget guard gap that the plan review missed — 10 parallel agents provided redundant coverage
- TDD approach (write failing tests first) provided immediate feedback when the config script was rewritten
- Post-merge test run caught the auto-merge content loss immediately

## What Could Improve

- The Task 4 subagent should have been given explicit context about preserving preceding sections (debug cleanup, jq check) — the replacement instruction said "replace lines 73-108" which was ambiguous about surrounding content
- Budget guard path references should have been in scope from the start — the spec said "no skill changes required" which was wrong
