# Record Formats

File naming, header structure, section order, and formatting conventions for all
session record artifacts. Follow these exactly.

---

## File Naming

All records follow `util-artifact-schema` conventions:

- **Feature mode:** `{sprint-name}-{artifact}-{nn}.md` in `{CHESTER_WORKING_DIR}/{sprint-subdir}/summary/`
- **Refactor mode:** `{slug}-{artifact}-{nn}.md` in `docs/refactor/{slug}/`

Where `{artifact}` is `summary`, `audit`, `brief`, or `cache-analysis`.

---

## Session Summary Format

### Header

```markdown
# Session Summary: [Task Description]

**Date:** YYYY-MM-DD
**Session type:** [Brief label]
**Plan:** `[Filename of the plan that drove this session]`
```

Session type examples: `Planning and adversarial review`, `Full-stack implementation`,
`Full-stack refactoring implementation`, `Benchmark-driven refactoring`.

### Body Sections (in order, skip if no evidence)

1. **Goal** — one concise paragraph describing what this session aimed to accomplish

2. **What Was Decided** / **What Was Completed** — main content section. Use whichever
   label fits (Decided for planning sessions, Completed for implementation sessions).
   Use sub-sections with clear headings. Tables for data-heavy summaries.

3. **Verification Results** — build and test outcomes as a table:
   ```
   | Check | Result |
   |-------|--------|
   ```
   Include pass/fail counts. Omit if no build or tests were run.

4. **Known Remaining Items** — future work, pending deletions, incomplete stages.
   Omit if nothing is deferred.

5. **Files Changed** — organized by project or component, listing all modifications,
   creations, and deletions. For large change sets, group with counts.

6. **Commits** — list commits made during the session with short hashes and messages.

7. **Handoff Notes** — context the next session needs to pick up cleanly. Always include.

---

## Reasoning Audit Format

### Header

```markdown
# Reasoning Audit: [Task Description]

**Date:** YYYY-MM-DD
**Session:** `NN`
**Plan:** `[Implementation plan filename]`
```

### Sections

1. **Executive Summary** — 2-4 sentences. What the session set out to do, the most
   significant decision and why it mattered, whether the implementation stayed on-plan
   or deviated. Written for a reader who will not read the full entry log. Write this
   last, after all entries are complete, so the most significant entry is known.

2. **Plan Development** — 3-6 sentences on how the plan was developed or arrived at.
   If carried in fully-formed, one sentence is sufficient.

3. **Decision Log** — entries ordered by downstream significance, most consequential first.

### Decision Entry Structure

```markdown
### [Decision Title — short noun phrase]

**Context:**
[1-3 sentences: what situation, constraint, or ambiguity prompted this decision]

**Information used:**
- [Specific file, pattern, convention, or prior knowledge that was directly relevant]

**Alternatives considered:**
- `[Option A]` — [why rejected]
- `[Option B]` — [why rejected]
- *(No alternatives visible in context)* — use when none were mentioned or inferable

**Decision:** [What was chosen, one sentence]

**Rationale:** [Why. Mark inferred reasoning with `(inferred)`]

**Confidence:** [High | Medium | Low] — [one-line justification]
```

Separate entries with horizontal rules (`---`).

### Confidence Levels

| Level | Meaning |
|-------|---------|
| **High** | Decision and rationale explicitly stated in conversation or narration |
| **Medium** | Decision visible; rationale inferred from context or codebase evidence |
| **Low** | Decision visible but rationale not recoverable from context |

---

## Evaluation Brief Format (refactor mode only)

### Header

```markdown
# Evaluation Brief: [Title]

**Date:** YYYY-MM-DD
**Type:** Refactor — [short description]
**Scope:** [files/systems touched]
```

### Required Sections

- **Scope** — what was in scope, what was explicitly out of scope. Name files,
  directories, modules, or systems.
- **Decision** — what was changed and why. Most important section. A future reader
  should understand the rationale without reading anything else.
- **Artifacts** — what was produced. File paths, benchmark data, backup files.

### Flexible Sections (include whichever apply)

- **Hypothesis** — for benchmark-driven refactors
- **Methodology** — how evaluation was conducted
- **Key Data** — tables, metrics, timing data
- **Origin** — what triggered this refactor
- **Migration Notes** — for dependency upgrades
- **Before/After** — for simplification work

---

## Formatting Conventions

- **File paths:** relative from project root
- **Line references:** `(line 101)` or `lines 101-105`
- **Change verbs:** Add, Remove, Rename, Delete, Modify, Create
- **Dates:** YYYY-MM-DD (ISO 8601)
- **Plan cross-references:** backtick-quoted filenames
- **Code identifiers:** backtick-quoted inline
- **Inferred content:** always marked `(inferred)` inline
- **Invisible rationale:** use "not visible in context" rather than speculating
- **Decision titles:** noun phrases, not sentences
