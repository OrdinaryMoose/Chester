# Design Brief — Subagent Progress Surface

**Sprint:** sprint-008-subagent-progress-surface
**Date:** 2026-03-31

## Problem

Sprint-007's subagent progress visibility feature failed on two fronts: (1) subagent text output is buried in the ctrl+o expansion panel, not the main conversation screen, and (2) subagents completely ignore soft prompt instructions to emit formatted status lines. The root cause is that the original design assumed subagent text output was visible on the main screen (it isn't) and that agents would reliably follow formatting instructions under cognitive load (they don't).

## Design Decisions

### 1. Mechanism — orchestrator prints dispatch/return lines

The orchestrator prints text lines to the main conversation screen at two boundaries: when dispatching a subagent, and when a subagent returns with results. This is the only reliable way to get content on the main screen — subagents cannot write there directly.

### 2. Format — preserves existing convention

```
Dispatched: {agent}:{task}-{short description}
Completed: {agent}:{task}-{one-line summary of result}
```

The `{agent}` identifies which role. The `{task}` identifies what specific work. The freetext provides context for stop/continue decisions.

### 3. Granularity — dispatch and return boundaries only

No mid-execution updates. For parallel dispatches (attack-plan with 6 agents, smell-code with 4, write-code with multiple implementers), return lines appear one by one as agents finish at different times, creating a natural progress stream.

### 4. Scope — all skills that dispatch subagents

- chester-write-code (implementer, spec-reviewer, quality-reviewer)
- chester-attack-plan (6 parallel agents)
- chester-smell-code (4 parallel agents)
- chester-dispatch-agents (arbitrary parallel agents)
- chester-build-spec (spec reviewer)

### 5. Existing prompt-based Progress Reporting sections — disposition TBD

The current `## Progress Reporting` blocks in subagent prompts need to be addressed. Options: remove (they're dead weight since agents ignore them), keep (still visible in ctrl+o for anyone who expands), or replace with something else. Decision deferred to spec.

## Ruled Out

- **Shared file polling with background agents** — too complex, fundamental architecture shift
- **Task list for progress display** — flat, noisy, no hierarchy, mixes with workflow tasks (confirmed by experiment)
- **Subagent text emission via prompt instructions** — wrong surface (ctrl+o), unreliable compliance
- **TaskUpdate activeForm spinner** — shows subject not activeForm for non-active tasks, single updating line not a scrollable stream

## Unchanged

- Subagent report format and content stays the same
- Agent dispatch mechanics (foreground for sequential, parallel for independent) stay the same
- The orchestrator already knows dispatch/return context — this makes it print what it knows
