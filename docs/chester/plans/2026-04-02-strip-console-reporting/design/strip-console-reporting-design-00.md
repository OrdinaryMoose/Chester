# Design Brief — Strip Console Reporting

**Date:** 2026-04-02
**Sprint:** sprint-009-strip-console-reporting

## Problem

Chester's console reporting layer adds complexity that creates its own failure modes. The transcript bash-append mechanism triggers permission bugs. Debug instrumentation is redundant with JSONL data. Progress-only output prescribes how the agent communicates rather than letting it behave naturally.

## Decision: What to Remove

### 1. Progress-Only Console Output (all skills)
- Skill entry announcements ("I'm using chester-X to...")
- All automatic `/report` calls (dispatch/completion lines in plan-attack, plan-smell, execute-write, design-specify, util-dispatch)
- "Print full document to terminal" directives (plan-build, session-summary, reasoning-audit)
- Raw findings dumps to terminal (plan-attack, plan-smell)
- Informational messages ("Sprint docs at...", "Cleaned up working copy...", worktree readiness block)

### 2. Debug Instrumentation System (entire subsystem)
- chester-setup-start-debug skill and directory
- chester-debug.json flag and cleanup logic in chester-setup-start session housekeeping
- chester-log-usage.sh script
- All `Diagnostic Logging` sections in skills (the before/after log-usage calls)
- chester-setup-start-debug entry from the available skills list

### 3. Interview Transcript Mechanism (chester-design-figure-out)
- Entire bash cat-append transcript mechanism in Phase 3
- Transcript file creation, write-through rule, formatting instructions
- Transcript copy steps in Phase 4 closure

## Decision: What to Keep

### Untouched
- **Budget guard** — all of it (status section, options, threshold logic)
- **Decision gates** — completion options menu (chester-finish), spec review gate (chester-design-specify), any output that requests user input
- **/report** — stays as a manually-invocable command; only automatic calls removed
- **Socratic interview output** — the thinking lines and questions printed to console stay; only the file-writing mechanism is removed

## Rationale

- JSONL already captures full conversations, tool calls, and subagent logs — transcripts are redundant
- User pulls token data from JSONL directly — debug instrumentation is redundant
- Skills should govern what work to do, not what to print while doing it
- Removing broken machinery is more reliable than fixing it
