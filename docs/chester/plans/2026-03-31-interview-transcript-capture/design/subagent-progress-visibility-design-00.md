# Design Brief — Subagent Progress Visibility

**Sprint:** sprint-007-interview-transcript-capture
**Date:** 2026-03-31

## Problem

Subagents run silently — the user sees a spinner and nothing else until results return. This makes it impossible to judge whether an agent is on track or going sideways, and therefore impossible to make an informed decision about whether to interrupt.

## Design Decisions

### 1. Scope — all long-running subagent dispatches

Any subagent that runs long enough for the user to wonder what's happening needs progress lines. Primary targets: attack-plan (6 parallel agents), smell-code (4 parallel agents), write-code (implementer agents), dispatch-agents (arbitrary parallel agents).

### 2. Content — major phase transitions only

Each subagent announces what it's doing at each major phase of its workflow. One sentence per report. Enough for the user to judge on-track vs. off-track and decide whether to interrupt.

### 3. Mechanism — prompt instructions in skill files

Subagent text output is visible in the terminal. The fix is adding instructions to each skill's subagent prompts telling them to emit status lines at phase boundaries. No infrastructure, no code — just prompt changes.

### 4. Motivation — interruptibility, not decoration

The purpose is giving the user enough context to make stop/continue decisions. Reports describe what the agent is doing specifically, not abstract step counts.

### 5. Format — `{who}:{label}-{freetext}`

- **who** — the agent's role name (e.g., "Migration Gaps", "Concurrency Hazards", "Implementer Task 3")
- **label** — fixed phase label, identical every time that phase runs (e.g., "Scanning", "Writing tests")
- **freetext** — single sentence describing the specific context

Example: `Migration Gaps:Scanning-checking auth module for unhandled state transitions`

The fixed label enables pattern recognition across runs. The who enables identification when parallel agents interleave.

### 6. Zero additional token cost

Progress lines report what the agent is already doing — no new analysis, no extra reasoning. Just announcing the current phase as it transitions.

## Unchanged

Subagent result format and content stays the same. This is additive — progress lines during execution, not changes to final output.
