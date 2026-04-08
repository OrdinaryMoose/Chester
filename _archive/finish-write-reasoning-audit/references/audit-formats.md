# Audit Formats — StoryDesigner Project Conventions

These are the file naming and format conventions for Reasoning Audit files.
Follow them exactly. Do not invent alternative structures.

---

## File Organization

All Chester artifacts are organized by work effort, not by artifact type.
Reasoning audits live in the same effort directory as their spec, plan, and summary.

### Default effort directory
```
docs/chester/YYYY-MM-DD-<topic-slug>/
```

### File naming convention
```
<topic-slug>-audit-NN.md
```

- `<topic-slug>`: lowercase, hyphenated, 3-5 words max (e.g., `span-inspector-semantic`)
- `NN`: zero-padded two-digit suffix — `-00` is the first audit, `-01`, `-02`, etc. for subsequent sessions
- The topic slug appears in both the directory name and the file name

### Example
```
docs/chester/2026-03-24-span-inspector-semantic/
├── span-inspector-semantic-spec-00.md
├── span-inspector-semantic-plan-00.md
├── span-inspector-semantic-summary-00.md
├── span-inspector-semantic-audit-00.md      ← this file
└── span-inspector-semantic-audit-01.md      ← second session audit
```

### Custom output directories (sprint option B/C)

When writing to a custom output directory with a `sprint_prefix` from spec/plan frontmatter,
prepend the prefix to all filenames:
- `Sprint032-Reasoning-Audit.md`
- Multi-session: `Sprint032-Reasoning-Audit-01.md`, `Sprint032-Reasoning-Audit-02.md`, etc.

---

## File Structure

```markdown
# Reasoning Audit: [Task Description]

**Date:** YYYY-MM-DD
**Session:** `NN` (e.g., `00` for first session, `01` for second)
**Plan:** `[Implementation plan filename]`

---

## Executive Summary

[2–4 sentences. Cover: what the session set out to do, the most significant decision
made and why it mattered, and whether the implementation stayed on-plan or deviated.
Written for a reader who will not read the full entry log — give them enough to know
whether this session is worth digging into.]

---

## Plan Development

[3–6 sentences on how the plan was developed or arrived at. If it was carried in
fully-formed, one sentence is sufficient.]

---

## Decision Log

[Entries in order of downstream significance — most consequential first.]

---

### [Decision Title — short, noun-phrase, describes the choice made]

**Context:**
[1–3 sentences: what situation, constraint, or ambiguity prompted this decision.]

**Information used:**
- [Specific file, pattern, convention, or prior knowledge that was directly relevant]
- [Add as many bullets as needed; omit this section only if decision was purely deductive]

**Alternatives considered:**
- `[Option A]` — [why rejected or not chosen]
- `[Option B]` — [why rejected or not chosen]
- *(No alternatives visible in context)* — use this if no alternatives were mentioned
  or inferable

**Decision:** [What was chosen, in one sentence.]

**Rationale:** [Why — stated or inferred. Mark inferred reasoning with `(inferred)`.]

**Confidence:** [High | Medium | Low] — [one-line justification]

---
```

Repeat the entry block for each decision point. Horizontal rules (`---`) separate entries.

---

## Confidence Levels

| Level | Meaning |
|-------|---------|
| **High** | Decision and rationale are explicitly stated in conversation or narration |
| **Medium** | Decision is visible; rationale is inferred from context or codebase evidence |
| **Low** | Decision is visible but rationale is not recoverable from context |

---

## Formatting Conventions

Inherit all conventions from `finish-write-session-summary/references/summary-formats.md`:
- **File paths:** relative from solution root
- **Line references:** `(line 101)` or `lines 101–105`
- **Dates:** YYYY-MM-DD (ISO 8601)
- **Plan cross-references:** backtick-quoted filenames

Additional conventions specific to audit entries:
- **Code identifiers:** backtick-quoted inline (e.g., `AppContext.BaseDirectory`,
  `ResolveDumpDirectory()`)
- **Inferred content:** always marked `(inferred)` inline
- **Invisible rationale:** use the phrase "not visible in context" rather than speculating
- **Decision titles:** noun phrases, not sentences (e.g., "Filename Timestamp Precision"
  not "Agent decided to use milliseconds in filenames")
