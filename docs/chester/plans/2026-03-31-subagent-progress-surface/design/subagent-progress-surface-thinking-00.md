# Thinking Summary — Subagent Progress Surface

**Sprint:** sprint-008-subagent-progress-surface
**Date:** 2026-03-31

## Starting Point

Sprint-007 shipped subagent progress visibility via prompt instructions telling agents to emit formatted status lines. Two failures observed: (1) output is buried in ctrl+o expansion panel, not visible on main screen, (2) agents completely ignore the formatting instructions.

## Key Reasoning Shifts

### Shift 1: Surface constraint recognition
**Before:** Assumed subagent text output was visible on the main conversation screen.
**After:** Discovered subagent output routes to an expandable panel (ctrl+o). Only the orchestrator can write to the main screen.
**Trigger:** User's screenshot showing instructions visible in expansion panel alongside ignored tool calls.

### Shift 2: Prompt-based emission is unreliable
**Before:** Soft prompt instructions ("emit a short status line at each major phase") would be followed.
**After:** Agents under cognitive load deprioritize formatting instructions entirely. The compliance problem is not solvable with better wording — it's a fundamental reliability issue with soft behavioral instructions.
**Trigger:** Screenshot evidence of zero compliance despite clear instructions.

### Shift 3: Task list is wrong tool for progress
**Before:** Considered TaskUpdate/activeForm as a mechanism since tasks show on main screen.
**After:** Task list is flat, has no hierarchy, mixes workflow tasks with agent progress, and shows subject not activeForm for non-active tasks. Live experiment confirmed the formatting was confusing.
**Trigger:** User experiment — created test tasks, user reported "formatting is confusing."

### Shift 4: Dispatch/return boundaries are sufficient
**Before:** Considered mid-execution updates essential (the original design's goal).
**After:** User confirmed dispatch/return boundary visibility is sufficient. For parallel agents, return lines appearing one by one as agents finish creates a natural progress stream.
**Trigger:** User accepted the dispatch/return pattern when presented with concrete example output.

## Alternatives Explored and Rejected

| Alternative | Why Rejected |
|---|---|
| Background agents + shared file polling | Too complex, fundamental architecture shift |
| Task list for progress display | Flat, noisy, no hierarchy, mixes with workflow tasks |
| Subagent text emission (current approach) | Wrong surface (ctrl+o), unreliable compliance |
| TaskUpdate activeForm spinner | Shows titles not activeForm, single line not stream |
| Orchestrator dispatch/return only (no mid-exec) | Accepted — sufficient granularity |

## Decision Chain

1. Main screen is non-negotiable → only orchestrator can write there
2. Orchestrator blocked during foreground agent execution → can't poll
3. Background polling too complex → rejected
4. Task list visible but wrong format → rejected after experiment
5. Orchestrator prints at dispatch/return boundaries → accepted
