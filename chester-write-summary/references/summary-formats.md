# Summary Formats — StoryDesigner Project Conventions

These are the actual file naming and format conventions used in this project.
Follow them exactly. Do not invent alternative structures.

---

## File Organization

All Chester artifacts are organized by work effort, not by artifact type.

### Default effort directory
```
docs/chester/YYYY-MM-DD-<topic-slug>/
```

All artifacts for a single effort live in the same directory: spec, plan, summary, audit, deferred.

### File naming convention
```
<topic-slug>-{spec,plan,summary,audit,deferred}-NN.md
```

- `<topic-slug>`: lowercase, hyphenated, 3-5 words max (e.g., `span-inspector-semantic`)
- `NN`: zero-padded two-digit suffix — `-00` is the original, `-01`, `-02`, etc. for subsequent sessions
- The topic slug appears in both the directory name and every file name

### Example
```
docs/chester/2026-03-24-span-inspector-semantic/
├── span-inspector-semantic-spec-00.md
├── span-inspector-semantic-plan-00.md
├── span-inspector-semantic-summary-00.md
├── span-inspector-semantic-summary-01.md
├── span-inspector-semantic-audit-00.md
└── span-inspector-semantic-deferred-00.md
```

### Custom output directories (sprint option B/C)

When writing to a custom output directory with a `sprint_prefix` from spec/plan frontmatter,
use the sprint-prefixed subdirectory convention instead:
- `<output_dir>/spec/<sprint_prefix>-YYYY-MM-DD-<topic>-design.md`
- `<output_dir>/plan/<sprint_prefix>-YYYY-MM-DD-<topic>.md`
- `<output_dir>/summary/<sprint_prefix>-Session-Summary.md`

Multi-session: `<sprint_prefix>-Session-Summary-01.md`, `-02.md`, etc.

---

## Session Summary Format

### Header
```markdown
# Session Summary: [Task Description]

**Date:** YYYY-MM-DD
**Session type:** [Brief label — see examples below]
**Plan:** `[Filename of the plan that drove this session]`
```

Session type examples:
- `Planning and adversarial review`
- `Full-stack implementation`
- `Full-stack refactoring implementation`
- Use judgment for others — keep it brief and descriptive

### Body sections (in order, skip if no evidence)

1. **Goal** — one concise paragraph describing what this session aimed to accomplish

2. **What Was Decided** / **What Was Completed** — main content section; use whichever
   label fits (Decided for planning sessions, Completed for implementation sessions).
   Use sub-sections with clear headings. Sub-lists (numbered or bulleted) are fine.
   Use tables for summaries (e.g., adversarial review findings, migration results).

3. **Verification Results** — build and test outcomes as a table:
   ```
   | Check | Result |
   |-------|--------|
   ```
   Include pass/fail counts. Omit if no build or tests were run.

4. **Known Remaining Items** — future work, pending deletions, incomplete stages.
   Omit if nothing is deferred.

5. **Files Changed** — organized by project, listing all modifications, creations,
   and deletions. For large change sets, group by component with counts.

6. **Handoff Notes** — context the next session needs to pick up cleanly. Always include.

---

## Implementation Plan Format

### Header
```markdown
# Plan: [Task Title or Objective]
```

### Body sections (in order)

1. **Context** — background, why this work is needed, design decisions already made,
   dependencies on other work

2. **Design Approach** — architecture, layering, key decisions with sub-sections as needed

3. **Implementation Steps** — numbered steps with file references, specific line numbers,
   and clear before/after descriptions

4. **Complete Hit List** — table of all affected files:
   ```
   | File | Lines | What to do |
   |------|-------|------------|
   ```

5. **Files Modified** — summary table:
   ```
   | File | Change |
   |------|--------|
   ```

6. **Verification** — build, test, and manual verification steps

---

## Formatting Conventions

- **File paths:** relative from solution root
  e.g., `Story.Application.Desktop/Views/DslEditorView.axaml`
- **Line references:** `(line 101)` or `lines 101-105`
- **Change verbs:** Add, Remove, Rename, Delete, Modify, Create
- **Dates:** YYYY-MM-DD (ISO 8601)
- **Plan cross-references:** backtick-quoted filenames
