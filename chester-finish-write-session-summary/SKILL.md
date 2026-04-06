---
name: chester-finish-write-session-summary
description: >
  Produces a concise executive summary at the end of any Chester work session and
  archives the implementation plan alongside it. Use this skill whenever the user wants
  a summary of what was just done — after a refactor, a feature build, a doc review, a
  bug fix, a migration, or any other agent-driven work session. Trigger when the user says
  things like: "summarize what we did", "give me a summary", "end of session summary",
  "what did we accomplish", "write up what happened", "session report", "produce a handoff",
  or "write the session summary". Also trigger proactively at natural session end points
  when a major unit of work has just completed.
---

# Session Summary Skill

Produces an executive summary of a completed Claude Code work session and archives the
implementation plan that drove the work.

**Read `references/summary-formats.md` before writing anything.** All file naming,
header structure, section order, and formatting conventions are defined there. Do not
invent or reconstruct the format from scratch.

**Two deliverables per session:**
1. `Session-Summary.md` (or suffixed variant for multi-session sprints)
2. `Implementation-Plan.md` (or suffixed variant) — copied from `.claude/plans/`

**Default mode: context-first.** Summarize from conversation context. Only scan the
filesystem when explicitly asked, or when the session involved silent file changes not
reflected in conversation.

---

## Step 0: Determine Output Directory

Read project config:
```bash
eval "$(~/.claude/skills/chester-util-config/chester-config-read.sh)"
```

Determine the sprint subdirectory from context (plan file path, conversation, or most recent sprint directory under `{CHESTER_PLANS_DIR}/`).

Write summary to: `{CHESTER_PLANS_DIR}/{sprint-subdir}/summary/{sprint-name}-summary-00.md`

If the sprint subdirectory cannot be determined, ask the user.

---

## Step 1: Determine File Names

Check the sprint folder for existing `Session-Summary.md` and `Implementation-Plan.md`
files. If base files already exist, this is a subsequent session — use the suffixed
naming convention from `references/summary-formats.md` (e.g., `Session-Summary-Sprint022d.md`).
If no base files exist, use the unsuffixed base names.

---

## Step 2: Copy the Implementation Plan

Look for the plan that drove this session. Plans live in `~/.claude/plans/` and are
referenced in the conversation when exiting plan mode.

- Copy the most recently modified relevant plan into the output directory using the
  filename determined in Step 1.
- If no plan file is visible in the conversation, reconstruct it from conversation context
  and note that it was reconstructed.
- If no plan exists at all, skip this deliverable and note its absence in the summary.

---

## Step 3: Select Mode

### Context Mode (default)
Use when:
- The session was planning, design, analysis, or discussion
- Files changed were discussed in conversation (you already know what happened)
- The user says "summarize" with no qualifiers

**Do not run any bash commands. Do not read any files. Summarize from conversation only.**

### Deep Scan Mode
Use ONLY when the user explicitly requests it ("deep scan", "full scan", "check the files
too") OR when the session involved silent file changes not reflected in conversation.

---

## Step 4: Extract Content

### Context Mode
Read the conversation and extract:
1. What was the goal?
2. What was decided or completed?
3. What was produced (documents, plans, code)?
4. What is deferred or left open?
5. What does the next session need to know?

Skip sections where no evidence exists. Do not invent content.

### Deep Scan Mode
Run discovery before writing:

```bash
find . -name "*.md" -newer . -not -path "*/obj/*" -not -path "*/.git/*" | sort
find . -name "*.cs" -newer . -not -path "*/obj/*" | sort
find . -name "*.log" -not -path "*/obj/*" | sort
```

Then find:
- **Intent** — sprint folder name, NorthStar doc, first message
- **Decisions** — files named *decision*, *ledger*, *adr*; headings `## Decision`, `## Rationale`
- **Open items** — TODO, FIXME, BLOCKED, PENDING; `- [ ]` items; `## Next Steps`
- **Build/test results** — log files; extract pass/fail counts only

---

## Step 5: Write the Summary

Write the `Session-Summary` file using the format in `references/summary-formats.md`.
Do not ask a confirmation question first. If context is ambiguous, note the ambiguity
inside the summary rather than blocking on it.

---

## Core Principles

**Context is evidence.** If the conversation describes what happened, that IS the record.

**Reconstruct, don't invent.** Every claim must be traceable to conversation or artifact.

**Signal over noise.** Extract pass/fail counts from logs. Don't narrate build output.

**Honest about gaps.** If something can't be determined, say so rather than guessing.

---

## Session State Update

If a strategy document or session state file exists for the current work (e.g. a
*review-strategy* or *plan* file with a Session State section), offer to update it
after producing the summary:

> "I can also update the Session State section in [filename] to reflect what was
> completed this session. Would you like me to do that?"

Do not update session state files automatically — always ask first.
