# Spec: Strip Console Reporting

**Sprint:** sprint-009-strip-console-reporting
**Date:** 2026-04-02

## Goal

Remove all progress-only console output, debug instrumentation, and redundant in-session recording from Chester skills. Reset skills to baseline agent behavior where the agent decides what to communicate. Keep decision gates and the manual `/report` command.

## Scope

### 1. Remove: Skill Entry Announcements

Every skill that has an "Announcement" section with "announce:" or "When this skill activates, announce:" — remove the announcement instruction.

**Affected files:**
- `chester-design-figure-out/SKILL.md` — line ~63
- `chester-design-specify/SKILL.md` — line ~70
- `chester-execute-write/SKILL.md` — line ~34
- `chester-util-worktree/SKILL.md` — line ~14 (if present)

**Also remove** the announcement node and edges from the process flow digraph in `chester-setup-start/SKILL.md` (the "Announce: 'Using [skill] to [purpose]'" box in the skill_flow graph).

### 2. Remove: Automatic `/report` Calls

Remove all "Progress visibility:" paragraphs that instruct the orchestrator to `/report` before/after dispatching agents.

**Affected files:**
- `chester-plan-attack/SKILL.md` — lines ~45, ~301
- `chester-plan-smell/SKILL.md` — lines ~60, ~257
- `chester-design-specify/SKILL.md` — line ~139
- `chester-execute-write/SKILL.md` — lines ~98, ~122, ~131
- `chester-util-dispatch/SKILL.md` — lines ~128-138 (the entire "Progress Visibility" section about orchestrator reporting)

**Do NOT remove** the `/report` skill itself or its entry in the available skills list. It remains available for manual use.

### 3. Remove: "Print to Terminal" Directives

Remove all instructions that say "print the full document/plan/content to the terminal."

**Affected files:**
- `chester-plan-build/SKILL.md` — line ~226
- `chester-finish-write-session-summary/SKILL.md` — line ~122
- `chester-finish-write-reasoning-audit/SKILL.md` — line ~137
- `chester-design-specify/SKILL.md` — lines ~62, ~132

### 4. Remove: Raw Findings Dumps

Remove instructions to print raw agent findings to terminal before synthesis.

**Affected files:**
- `chester-plan-attack/SKILL.md` — lines ~303, ~331
- `chester-plan-smell/SKILL.md` — lines ~259, ~288

### 5. Remove: Informational Messages

Remove non-decision output like status messages and cleanup announcements.

**Affected files:**
- `chester-design-figure-out/SKILL.md` — "Inform user: Sprint docs at..." (~line 271)
- `chester-finish/SKILL.md` — "Announce: Cleaned up working copy..." (~line 241)
- `chester-util-worktree/SKILL.md` — worktree readiness status block (~lines 139-141, 189-191)
- `chester-execute-write/SKILL.md` — "Print the deferred item to terminal output" (~line 79)

### 6. Remove: Entire Debug Instrumentation System

**Delete directory:**
- `chester-setup-start-debug/` — the entire skill directory

**Delete scripts (if they exist):**
- `chester-log-usage.sh` at repo root or in `chester-util-config/`

**Delete test files:**
- `tests/test-log-usage-script.sh`
- `tests/test-debug-flag.sh`

**Remove from chester-setup-start/SKILL.md:**
- The "Clean up stale debug flag" step in Session Housekeeping (~lines 32-42)
- The `chester-setup-start-debug` entry from the Available Chester Skills list (~line 188)

**Remove Diagnostic Logging sections from:**
- `chester-design-figure-out/SKILL.md` (~lines 30-35)
- `chester-design-specify/SKILL.md` (~lines 30-35)
- `chester-plan-build/SKILL.md` (~lines 34-43)
- `chester-execute-write/SKILL.md` (~lines 149-175)
- `chester-finish/SKILL.md` (~lines 40-45)

### 7. Remove: Interview Transcript Mechanism

In `chester-design-figure-out/SKILL.md`, remove:

- The entire "Interview Transcript" subsection in Phase 3 (~lines 133-183) — file creation, write-through rule, checkpoint appends, formatting rules, tool choice directive
- Phase 4 closure steps that copy/commit the transcript (~lines 276-278)
- The transcript reference in the "This skill writes to design/" file listing at the bottom

**Keep:** The Socratic interview output itself — the thinking lines and questions printed to the user's console. Only the file-writing mechanism is removed.

## Out of Scope

- **Budget guard** — all budget guard sections, pause-and-report blocks, threshold checks remain untouched
- **Decision gates** — chester-finish completion options menu, chester-design-specify user review gate message, any output that asks the user to choose
- **`/report` skill** — stays in the available skills list, stays as a manual command
- **chester-setup-start announcements** for first-run project configuration — these are part of an interactive setup flow, not progress reporting
- **Socratic interview console output** — the thinking and questions the agent prints during the interview stay; only the parallel file-writing is removed

## Constraints

- Each SKILL.md edit must preserve the surrounding document structure (section numbering, phase references, checklist items)
- If removing a checklist item or closure step, renumber subsequent items
- If removing a node from a digraph, remove its edges too
- The `/report` skill entry in chester-setup-start's available skills list must remain

## Testing

- After all edits, grep the full skill set for: `Announce:`, `announce:`, `/report`, `print.*terminal`, `chester-log-usage`, `chester-debug`, `Diagnostic Logging` — confirm zero hits outside of budget guard sections and the `/report` skill listing
- Verify `chester-setup-start-debug/` directory is gone
- Verify no broken cross-references (skills referencing deleted skills or sections)

## Non-Goals

- Changing how skills work or what they produce
- Modifying the budget guard system
- Replacing removed reporting with alternative mechanisms
- Changing the `/report` skill itself
