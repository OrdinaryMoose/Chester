# Reasoning Audit: Orchestrator-Side Subagent Progress Visibility

**Date:** 2026-04-01
**Session:** `00`
**Plan:** `subagent-progress-surface-plan-00.md`

---

## Executive Summary

This session redesigned sprint-007's failed subagent progress visibility feature. The most consequential decision was rejecting all subagent-side mechanisms (text emission, task list updates, spinner manipulation) in favor of orchestrator-printed dispatch/return lines — driven by the discovery that only the orchestrator can write to the main conversation screen. Implementation stayed on-plan with no deviations; all changes were prompt edits to existing skill files.

---

## Plan Development

The plan emerged from a full chester-figure-out Socratic interview (7 questions) that systematically eliminated candidate mechanisms. The design brief locked in "orchestrator prints at dispatch/return boundaries" as the sole mechanism. The spec formalized scope (8 files across 5 skills) and the plan decomposed into 5 tasks grouped by file ownership. Plan hardening was minimal (user-approved) since all changes are reversible prompt edits with no code, tests, or infrastructure.

---

## Decision Log

---

### Main-Screen-Only Constraint

**Context:**
The user reported two problems with sprint-007's progress visibility: updates buried in ctrl+o, and agent non-compliance with formatting instructions. The question was which problem to prioritize.

**Information used:**
- User's annotated screenshot showing Progress Reporting instructions circled in red, with raw tool calls below and zero formatted status lines
- Claude Code's rendering behavior: subagent output routes to expansion panel, not main screen

**Alternatives considered:**
- `Fix compliance only (keep ctrl+o surface)` — would solve the formatting problem but not the visibility problem
- `Fix both independently` — more work, and compliance fix is moot if surface is wrong

**Decision:** Main screen visibility is the non-negotiable requirement; compliance is secondary.

**Rationale:** User stated "yes, on the main screen" — the ctrl+o panel is not acceptable even with perfect formatting.

**Confidence:** High — explicitly stated by user.

---

### Rejection of Shared-File Polling Architecture

**Context:**
Once main-screen was confirmed as the target, the question became: how does progress reach the main screen? Subagents can't write there. The orchestrator can, but is blocked during foreground agent execution.

**Information used:**
- Agent tool supports `run_in_background: true` for non-blocking dispatch
- Background agents + shared progress file would require a polling loop in the orchestrator

**Alternatives considered:**
- `Background agents + file polling` — orchestrator dispatches in background, agents write to shared file, orchestrator polls and prints. Rejected by user as too complex.
- `Background agents + task updates` — agents update tasks, orchestrator reads. Still requires polling.

**Decision:** No polling architecture. Keep existing dispatch mechanics.

**Rationale:** User said "no, don't want to do that" — the architecture shift was disproportionate to the problem.

**Confidence:** High — explicitly rejected by user.

---

### Task List Experiment and Rejection

**Context:**
User suggested using the task list for dynamic updates at the orchestrator level. This prompted a live experiment to test task list rendering.

**Information used:**
- Created 3 test tasks (Alpha, Beta, Gamma) with activeForm text and set to in_progress
- Screenshot showed: tasks display subject, not activeForm, when orchestrator is running
- Created subtasks to test hierarchy — task list is flat, no nesting, completed items mixed with active

**Alternatives considered:**
- `Task subjects as progress lines` — worked visually but flat list mixed agent tasks with workflow tasks
- `Task hierarchy with subtasks` — task system has no hierarchy; subtasks appear as siblings

**Decision:** Task list is the wrong tool for progress display.

**Rationale:** User confirmed "formatting is confusing" after seeing the flat, mixed task list.

**Confidence:** High — empirically tested and rejected by user.

---

### Dispatch/Return Boundary Granularity

**Context:**
After eliminating subagent-side mechanisms and the task list, the remaining option was orchestrator-printed text. The question was granularity: dispatch/return only, or something more.

**Information used:**
- Orchestrator knows dispatch context (what agent, what task) and return context (agent's report)
- For parallel dispatches (6 attack-plan agents, 4 smell-code agents), returns arrive at different times creating a natural stream

**Alternatives considered:**
- `Mid-execution updates via some mechanism` — all mid-execution paths required either polling or subagent writing to a surface, both rejected
- `Dispatch/return boundaries only` — simple, no new infrastructure, natural stream for parallel agents

**Decision:** Dispatch and return boundaries are sufficient granularity.

**Rationale:** User accepted the concrete example output (`Dispatched: Alpha...`, `Completed: Alpha...`) and confirmed "yes, go with this."

**Confidence:** High — accepted with concrete example.

---

### Removal of Existing Progress Reporting Blocks

**Context:**
Sprint-007 added `## Progress Reporting` blocks to all subagent prompts. These are now dead weight — the mechanism moved orchestrator-side.

**Information used:**
- Screenshot evidence: agent had the instructions in its prompt and completely ignored them
- All 14 blocks across 8 files identified during spec phase

**Alternatives considered:**
- `Keep for ctrl+o visibility` — still visible in expansion panel for anyone who expands. But adds prompt noise and agents ignore them.
- `Remove entirely` — clean prompts, no dead instructions

**Decision:** Remove all Progress Reporting blocks from subagent prompts.

**Rationale:** Agents ignore them under cognitive load, and the mechanism is now orchestrator-side. Keeping them adds noise with zero benefit. (inferred — not explicitly discussed with user, but follows from the design decisions)

**Confidence:** Medium — follows logically from design decisions but disposition was listed as "TBD in spec" in the design brief.

---

### Parallel Dispatch of Tasks 3, 4, 5

**Context:**
Tasks 3 (attack-plan), 4 (smell-code), and 5 (dispatch-agents + build-spec) modify entirely separate files with no overlap.

**Information used:**
- File ownership map: Task 3 only touches `chester-attack-plan/SKILL.md`, Task 4 only touches `chester-smell-code/SKILL.md`, Task 5 touches `chester-dispatch-agents/SKILL.md` + `chester-build-spec/` files

**Alternatives considered:**
- `Sequential dispatch` — safer but slower, no benefit since files don't overlap
- `Parallel dispatch` — 3 agents simultaneously, faster completion

**Decision:** Dispatch Tasks 3, 4, 5 in parallel.

**Rationale:** No shared state between tasks; parallel execution is safe and faster. (inferred)

**Confidence:** High — file independence is verifiable from the plan.

---
