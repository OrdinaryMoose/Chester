# Spec — Subagent Progress Surface

**Sprint:** sprint-008-subagent-progress-surface

## Problem

Subagent progress is invisible on the main conversation screen. Sprint-007 attempted to fix this with prompt-based status line instructions, but failed because (a) subagent text output routes to the ctrl+o expansion panel, not the main screen, and (b) agents ignore soft formatting instructions under cognitive load.

## Solution

The orchestrator prints a dispatch line before launching each subagent and a completion line after each subagent returns. This puts progress on the main screen using the only actor that can write there.

## Format

```
Dispatched: {agent}:{task}-{short description}
Completed: {agent}:{task}-{one-line summary}
```

- **{agent}** — role name (e.g., "Structural", "Implementer", "Bloaters")
- **{task}** — what the agent is working on (e.g., "Task 3", "plan review", "auth module")
- **{short description}** — one sentence context on dispatch
- **{one-line summary}** — one sentence result on return

The orchestrator extracts the completion summary from the agent's report. For agents with structured reports (status codes, findings), the summary is derived from the top-level status and key finding. For agents with freeform output, the orchestrator writes a one-line summary of the result.

## Scope — Files to Modify

### 1. chester-write-code/SKILL.md

Add orchestrator print instructions around each dispatch point:

- **Implementer dispatch** (sequential, one per task): Print dispatch line before each Agent call, print completion line after reading the agent's status code and report.
- **Spec compliance reviewer dispatch**: Print dispatch/completion lines.
- **Code quality reviewer dispatch**: Print dispatch/completion lines.

### 2. chester-attack-plan/SKILL.md

Add orchestrator print instructions around the parallel dispatch:

- **Before parallel launch**: Print 6 dispatch lines (one per agent).
- **After each agent returns**: Print completion line. Since agents are launched in parallel and return at different times, completion lines appear as agents finish.

### 3. chester-smell-code/SKILL.md

Same pattern as attack-plan:

- **Before parallel launch**: Print 4 dispatch lines.
- **After returns**: Print 4 completion lines.

### 4. chester-dispatch-agents/SKILL.md

Add dispatch/completion print pattern to the guidance section so any skill using dispatch-agents follows the convention.

### 5. chester-build-spec/SKILL.md

Add orchestrator print instructions around the spec reviewer dispatch.

### 6. Remove existing Progress Reporting sections

Remove the `## Progress Reporting` blocks from all subagent prompt templates:

- `chester-write-code/implementer.md`
- `chester-write-code/spec-reviewer.md`
- `chester-write-code/quality-reviewer.md`
- `chester-attack-plan/SKILL.md` (6 blocks, one per agent)
- `chester-smell-code/SKILL.md` (4 blocks, one per agent)
- `chester-build-spec/spec-reviewer.md`
- `chester-dispatch-agents/SKILL.md` (guidance section)

These are dead weight — agents ignore them, and the mechanism is now orchestrator-side.

## Non-Goals

- Mid-execution progress updates (dispatch/return boundaries are sufficient)
- Changes to subagent report format or content
- Changes to dispatch mechanics (foreground/background, parallel/sequential)
- Infrastructure code, scripts, or new files

## Constraints

- All changes are prompt/instruction modifications in existing SKILL.md and template files
- No new files created
- The orchestrator's print lines are plain text output, not tool calls
- Completion summaries are best-effort one-liners — the orchestrator uses judgment to summarize, not a rigid extraction rule

## Testing

Manual verification: run a skill that dispatches subagents (e.g., attack-plan or write-code) and confirm dispatch/completion lines appear on the main conversation screen.
