---
name: finish-write-records
description: >
  Produces session documentation after Chester work session — session summary
  and reasoning audit. Use when: "summarize what we did", "write the summary",
  "session report", "reasoning audit", "document this session", or at natural
  session end points. Also trigger proactively.
version: v0004
---

# Session Records

Two artifacts: session summary + reasoning audit. Sprint pipeline work only.

## Step 1: Output Location

```bash
eval "$(chester-config-read)"
```

Determine sprint subdir from context — plan file path, conversation, or most recent dir under `{CHESTER_WORKING_DIR}/`. Unknown → ask.

Check existing files in `summary/` for version number — `00` if none, else increment. See `util-artifact-schema`.

Output path: `{CHESTER_WORKING_DIR}/{sprint-subdir}/summary/`

## Step 2: Source Mode

**Context Mode (default)** — session was planning, design, analysis, or discussion. Summarize from conversation only. No bash commands.

**Deep Scan Mode** — user explicitly requests ("deep scan", "full scan") or session had silent file changes not in conversation.

```bash
find . -name "*.md" -newer . -not -path "*/obj/*" -not -path "*/.git/*" | sort
find . -name "*.cs" -newer . -not -path "*/obj/*" | sort
```

Scan for: intent (sprint folder, NorthStar doc), decisions (ADRs), open items (TODO/FIXME/BLOCKED/`- [ ]`), build/test results.

## Step 3: Write Artifacts

Write without asking confirmation. Note ambiguity inside artifact — don't block.

Read `references/record-formats.md` for naming, headers, section order, formatting. Don't reconstruct from scratch.

### Harvest Skill Versions

Collect deduped `<!-- produced-by ... -->` trailers from sprint artifacts. Embed verbatim under `## Session Skill Versions` in summary.

```bash
chester-trailer-write harvest "$CHESTER_WORKING_DIR/{sprint-subdir}"
```

### Session Summary

Extract from conversation or deep scan:
1. Goal
2. Decided or completed
3. Produced (documents, plans, code)
4. Deferred or open
5. What next session needs

Skip sections with no evidence. Don't invent.

Stamp after writing:
```bash
chester-trailer-write stamp finish-write-records@v0004 "<summary-path>"
```

### Reasoning Audit

Source: session JSONL transcript. Locate:

```bash
SESSION_DIR="$HOME/.claude/projects/$(echo "$PWD" | sed 's|/|-|g; s|^-||')"
LATEST_JSONL=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1)
```

JSONL resolution fails → abort, report error, don't write audit.

Parse chronologically. Identify 4-12 non-trivial decision points — real choice among alternatives. For each: context, information used, alternatives, decision, rationale, confidence.

Order by significance (most consequential first).

**Qualifies:**
- Deviation from plan
- Implementation choice among alternatives
- Information-driven choice (read/grep → chose)
- Explicit rejection of approach

**Does not qualify:**
- Mechanical execution, one reasonable choice
- Tool calls with no decision content
- Trivial style choices

Stamp after writing:
```bash
chester-trailer-write stamp finish-write-records@v0004 "<audit-path>"
```

## Step 4: Copy Plan

Find plan in `{CHESTER_WORKING_DIR}/{sprint-subdir}/plan/`. Copy most recent file into summary dir.

No plan found → reconstruct from conversation and note. No plan at all → skip and note.

Authoritative plan stays in `plan/`. Convenience copy only.

## Step 5: Offer State Update

Strategy doc or session state file exists → offer:

> "I can also update the Session State section in [filename] to reflect what was
> completed this session. Would you like me to do that?"

Don't update automatically.

## Principles

- Context is evidence. Conversation describes what happened → that IS record.
- Reconstruct, don't invent. Every claim traceable to conversation or artifact.
- Signal over noise. Extract pass/fail counts. Don't narrate build output.
- Honest about gaps. Can't determine → say so.
- Causal, not chronological. Audit ordered by significance, not sequence.
- Calibrated confidence. Each audit entry carries High/Medium/Low.

## Integration

- After: `execute-verify-complete`
- Leads to: `finish-archive-artifacts`
- Reads: `util-artifact-schema` for naming and paths
