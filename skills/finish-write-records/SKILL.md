---
name: finish-write-records
description: >
  Produces session documentation after any Chester work session — session summaries,
  reasoning audits, and cache analysis. Handles both feature work (sprint pipeline) and
  refactoring work (standalone). Use when the user says things like: "summarize what we
  did", "write the summary", "session report", "reasoning audit", "write a refactor
  summary", "document this session", or when a major unit of work has just completed.
  Also trigger proactively at natural session end points.
---

# Session Records

Produces documentation about what happened during a work session: what was done, what
decisions were made, and why. This is one skill with two modes depending on what kind
of work was performed.

## Mode Selection

### Feature Mode (sprint pipeline)

Use when the work followed the Chester pipeline (design → spec → plan → execute) or
any feature development, bug fix, or migration work driven by a sprint.

**Artifacts produced:**
- Session summary (`{sprint-name}-summary-{nn}.md`)
- Reasoning audit (`{sprint-name}-audit-{nn}.md`)
- Cache analysis (optional)

**Output directory:** `{CHESTER_WORKING_DIR}/{sprint-subdir}/summary/`

### Refactor Mode

Use when the work was refactoring — simplifications, rationalizations, tech debt cleanup,
dependency upgrades, performance optimizations. Refactors don't start with a spec or
plan; they start with an observation and end with a simpler state.

**Artifacts produced:**
- Evaluation brief (`{slug}-brief-{nn}.md`) — unique to refactors
- Session summary (`{slug}-summary-{nn}.md`)
- Reasoning audit (`{slug}-audit-{nn}.md`)

**Output directory:** `docs/refactor/{slug}/`

If the output directory doesn't exist, create it. Confirm the slug with the user:
"I'll create `docs/refactor/{slug}/` — does that slug capture it?"

### How to Choose

If the work has a sprint subdirectory in `CHESTER_WORKING_DIR` → feature mode.
If the user says "refactor summary" or the work was cleanup/simplification → refactor mode.
If ambiguous, ask.

## Step 1: Determine Output Location

### Feature Mode

```bash
eval "$(chester-config-read)"
```

Determine the sprint subdirectory from context (plan file path, conversation, or most
recent sprint directory under `{CHESTER_WORKING_DIR}/`). If it cannot be determined, ask.

Check for existing summary/audit files to determine version number — use `00` if none
exist, otherwise increment. See `util-artifact-schema` for versioning rules.

### Refactor Mode

Create a slug following the refactor naming convention (see `util-artifact-schema`):
`YYYYMMDD-##-word-word-word` (3-5 words).

```bash
ls docs/refactor/ 2>/dev/null | grep "^$(date +%Y%m%d)" | sort | tail -1
```

## Step 2: Select Source Mode

### Context Mode (default)

Use when:
- The session was planning, design, analysis, or discussion
- Files changed were discussed in conversation
- The user says "summarize" with no qualifiers

Summarize from conversation context only. Do not run bash commands or read files.

### Deep Scan Mode

Use only when the user explicitly requests it ("deep scan", "full scan", "check the
files too") or when the session involved silent file changes not reflected in conversation.

Run discovery before writing:
```bash
find . -name "*.md" -newer . -not -path "*/obj/*" -not -path "*/.git/*" | sort
find . -name "*.cs" -newer . -not -path "*/obj/*" | sort
find . -name "*.log" -not -path "*/obj/*" | sort
```

Look for: intent (sprint folder, NorthStar doc), decisions (ADRs, decision headings),
open items (TODO, FIXME, BLOCKED, `- [ ]`), build/test results (log files).

## Step 3: Write Artifacts

Write all applicable artifacts without asking for confirmation first. If context is
ambiguous, note the ambiguity inside the artifact rather than blocking on it.

Read `references/record-formats.md` for all file naming, header structure, section order,
and formatting conventions. Do not invent or reconstruct formats from scratch.

### Session Summary (both modes)

Extract from conversation or deep scan:
1. What was the goal?
2. What was decided or completed?
3. What was produced (documents, plans, code)?
4. What is deferred or left open?
5. What does the next session need to know?

Skip sections where no evidence exists. Do not invent content.

### Reasoning Audit (both modes)

**Source:** the session JSONL transcript is the authoritative source, not conversation
context. Locate it:

```bash
SESSION_DIR="$HOME/.claude/projects/$(echo "$PWD" | sed 's|/|-|g; s|^-||')"
LATEST_JSONL=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1)
```

Parse chronologically. Identify 4-12 non-trivial decision points — moments where the
agent made a real choice among alternatives. For each, reconstruct: context, information
used, alternatives considered, decision, rationale, and confidence level.

Order entries by significance (most consequential first), not chronologically.

**What qualifies as a decision point:**
- Deviation from plan
- Implementation detail choice among alternatives
- Information-driven choice (read/grepped then chose based on findings)
- Explicit rejection of an approach

**What does not qualify:**
- Mechanical execution with only one reasonable choice
- Tool calls with no decision content
- Trivial style choices

### Evaluation Brief (refactor mode only)

The brief answers: *why was this refactor justified?*

**Required sections:**
- **Scope** — what was in/out of scope
- **Decision** — what was changed and why (most important section)
- **Artifacts** — what was produced

**Flexible sections** (include whichever apply):
- **Hypothesis** — for benchmark-driven refactors
- **Methodology** — how evaluation was conducted
- **Key Data** — tables, metrics, timing data
- **Origin** — what triggered this refactor
- **Migration Notes** — for dependency upgrades
- **Before/After** — for simplification work

### Cache Analysis (optional, both modes)

Parse the current session's JSONL for cache hit metrics:

```bash
jq -r 'select(.type == "assistant" and .message.usage) |
  [.message.usage.input_tokens // 0,
   .message.usage.cache_creation_input_tokens // 0,
   .message.usage.cache_read_input_tokens // 0] |
  @csv' "$LATEST_JSONL"
```

Compute and display as a table with per-call and overall cache hit rates. Write to
`cache-analysis.md` in the output directory.

This is best-effort. If jq parsing fails, report the error and skip.

## Step 4: Copy Implementation Plan (feature mode only)

Look for the plan that drove this session in `{CHESTER_WORKING_DIR}/{sprint-subdir}/plan/`.
Copy the most recent plan file into the summary output directory for cross-reference.

If no plan file is found, reconstruct from conversation context and note it was
reconstructed. If no plan exists at all, skip and note its absence.

Note: this creates a convenience copy alongside the summary. The authoritative plan
remains in `plan/` and is archived separately by `finish-archive-artifacts`.

## Step 5: Offer Session State Update

If a strategy document or session state file exists for the current work, offer to
update it:

> "I can also update the Session State section in [filename] to reflect what was
> completed this session. Would you like me to do that?"

Do not update session state files automatically.

## Step 6: Commit (refactor mode only)

Refactor artifacts are committed directly since they don't go through the archive flow:

```bash
git add docs/refactor/{slug}/
git commit -m "chore: add refactor artifacts — {short description}"
```

Feature mode artifacts stay in the working directory — `finish-archive-artifacts`
handles committing them.

## Core Principles

- **Context is evidence.** If the conversation describes what happened, that IS the record.
- **Reconstruct, don't invent.** Every claim must be traceable to conversation or artifact.
- **Signal over noise.** Extract pass/fail counts from logs. Don't narrate build output.
- **Honest about gaps.** If something can't be determined, say so rather than guessing.
- **Causal, not chronological.** Audit entries ordered by significance, not sequence.
- **Calibrated confidence.** Each audit entry carries High/Medium/Low reflecting how
  clearly the decision and rationale are supported by evidence.

## Integration

- **Called after:** `execute-verify-complete` (feature mode) or standalone (refactor mode)
- **Leads to:** `finish-archive-artifacts` (feature mode) or done (refactor mode)
- **Reads:** `util-artifact-schema` for naming and paths, `util-budget-guard` if needed
