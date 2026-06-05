# Purist Transcript — Round 02

**Sprint:** 20260605-01-remove-largetask-references
**Round:** 02 — AC decomposition
**Role:** Purist

---

## Position: AC Group Structure

Path A is ratified. The spec's AC decomposition must give each of the four action categories (re-point, delete, archive, test-lockstep) a distinct observable boundary. Category boundaries are not style — they are the difference between a test that passes for the right reason and a test that passes because stale text happened to survive.

Proposed AC groups:

- **AC-1.x** — re-points: design-large-task absent AND design-small-task present in each file
- **AC-2.x** — deletes: design-large-task absent, nothing substituted
- **AC-3.x** — archive: file no longer under `agents/`, now under `_archive/design-large-task/`
- **AC-4.x** — test lockstep: four tests updated in lockstep so suite stays green
- **AC-5.x** — version bumps: each modified SKILL.md carries a bumped version field
- **AC-6.x** — suite stays green: full suite passes after all changes land

The Purist concern is that AC-1 and AC-2 must not share an observable boundary. Re-point leaves something in place (design-small-task present); delete leaves nothing. A test checking only "design-large-task absent" passes for both, hiding whether the re-point actually landed. Each category needs its own positive assertion.

---

## AC Set

---

### AC-1.1 — execute-write worktree attribution re-pointed

**Observable boundary:**
- `design-large-task` absent from `skills/execute-write/SKILL.md`
- `design-small-task` present in the same file (in the worktree-creation context)

**Given:** `skills/execute-write/SKILL.md` currently names both skills as worktree creators in Section 1.2
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" skills/execute-write/SKILL.md` exits non-zero (absent)
- `grep -q "design-small-task" skills/execute-write/SKILL.md` exits zero (present)

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-1.2 — design-specify entry condition and integration re-pointed

**Observable boundary:**
- `design-large-task` absent from `skills/design-specify/SKILL.md`
- `design-small-task` present in the same file (in entry condition, standalone invocation, and invoked-by)

**Given:** design-specify names both skills as valid upstream sources in its description, Entry Condition, Standalone Invocation, and Integration sections
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" skills/design-specify/SKILL.md` exits non-zero
- `grep -q "design-small-task" skills/design-specify/SKILL.md` exits zero

**Note on the Reads section (lines 233–235):** the template path reference (`../design-large-task/references/design-brief-template.md`) is a delete, not a re-point — no surviving path replaces it at that location. That edit falls under AC-2.3. The observable boundary here covers the description, Entry Condition, Standalone Invocation, and Invoked-by fields only.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-1.3 — plan-build canonical-sequence mentions re-pointed

**Observable boundary:**
- `design-large-task` absent from `skills/plan-build/SKILL.md`
- `design-small-task` present in the same file

**Given:** plan-build names design-large-task in four places: the task-reset example (line 19), the worktree-context note (line 43), the cascade explanation (lines 153–154), and the spec-compatibility note (lines 311–312)
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" skills/plan-build/SKILL.md` exits non-zero
- `grep -q "design-small-task" skills/plan-build/SKILL.md` exits zero

**Note:** Line 153–154 (the cascade explanation) is a simplify, not a re-point — the design-large-task clause is removed and the surviving cascade rule retained. The positive observable boundary (design-small-task present) is satisfied by the surviving context note and spec-compatibility note.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-1.4 — start-bootstrap description and when-to-call re-pointed

**Observable boundary:**
- `design-large-task` absent from `skills/start-bootstrap/SKILL.md`
- `design-small-task` present in the same file (in the description or When to Call section)

**Given:** start-bootstrap description says "Called by design-large-task and execute-write (standalone)"; the When to Call section lists design-large-task under "Always"
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" skills/start-bootstrap/SKILL.md` exits non-zero
- `grep -q "design-small-task" skills/start-bootstrap/SKILL.md` exits zero

**Note:** Line 92 (session-meta hash reference) is a delete, not a re-point — that edit falls under AC-2.4. The observable boundary here covers description and When to Call only; the combined grep-absent on design-large-task covers both edits in the same file.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-1.5 — util-design-partner-role intro re-pointed

**Observable boundary:**
- The phrase "Both `design-large-task` and `design-small-task` read this file" absent from `skills/util-design-partner-role/SKILL.md`
- `design-small-task` still present in the same file (in the intro or surviving context)

**Given:** util-design-partner-role body (line 9) says both skills read this file; description field also names both
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" skills/util-design-partner-role/SKILL.md` exits non-zero
- `grep -q "design-small-task" skills/util-design-partner-role/SKILL.md` exits zero

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-1.6 — util-worktree caller attribution re-pointed

**Observable boundary:**
- `design-large-task` absent from `skills/util-worktree/SKILL.md`
- `design-small-task` present in the same file (in the Called-by integration note)

**Given:** util-worktree Integration section lists design-large-task (Archival stage) as a required caller
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" skills/util-worktree/SKILL.md` exits non-zero
- `grep -q "design-small-task" skills/util-worktree/SKILL.md` exits zero

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-2.1 — util-artifact-schema producer and stamping entries deleted

**Observable boundary:**
- `design-large-task` absent from `skills/util-artifact-schema/SKILL.md`
- The `thinking` artifact type row absent from the same file
- The `process` artifact type row absent from the same file
- `design-small-task` still present in the same file (the design-artifact row's surviving producer)

**Given:** util-artifact-schema names design-large-task in the design-artifact producer column, the thinking-artifact row (sole producer), the process-artifact row (sole producer), and the stamping-skills list
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" skills/util-artifact-schema/SKILL.md` exits non-zero
- `grep -qi "^| \`thinking\`" skills/util-artifact-schema/SKILL.md` exits non-zero (row removed)
- `grep -qi "^| \`process\`" skills/util-artifact-schema/SKILL.md` exits non-zero (row removed)
- `grep -q "design-small-task" skills/util-artifact-schema/SKILL.md` exits zero (surviving producer present)

**Why not re-point:** the thinking/process rows have no surviving producer. Leaving them implies these artifact types can still be produced. The stamping-list entry is a positive action a skill performs — design-large-task performs no actions now.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-2.2 — util-design-partner-role capture-thought sentence deleted

**Observable boundary:**
- The sentence describing design-large-task's capture_thought usage absent from `skills/util-design-partner-role/SKILL.md`
- `capture_thought` either absent or present only in design-small-task context

**Given:** util-design-partner-role line 96 contains: "`design-large-task` captures private precision via `capture_thought` with tag `private-precision`."
**When:** the scrub lands
**Then:**
- `grep -q "capture_thought.*private-precision\|private-precision.*capture_thought" skills/util-design-partner-role/SKILL.md` exits non-zero (the large-task-specific usage gone)

**Note:** The design-small-task sentence on the same line ("design-small-task uses whatever scratch note habit fits session") survives. The observable boundary targets the large-task clause specifically.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-2.3 — design-specify stale template path deleted

**Observable boundary:**
- The path `design-large-task/references/design-brief-template.md` absent from `skills/design-specify/SKILL.md`
- The path `design-small-task/references/design-brief-small-template.md` present in the same file

**Given:** design-specify Reads section (lines 233–235) references both template paths; the large-task path does not exist on disk
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task/references/design-brief-template" skills/design-specify/SKILL.md` exits non-zero
- `grep -q "design-small-task/references/design-brief-small-template" skills/design-specify/SKILL.md` exits zero

**Researcher-confirmed anchors (round 02 Q&A):** both strings are unique in that file. The surviving path is `../design-small-task/references/design-brief-small-template.md` — the grep above is sufficient.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-2.4 — start-bootstrap session-meta hash reference deleted

**Observable boundary:**
- The phrase naming design-large-task's SKILL.md in the session-meta helper call absent from `skills/start-bootstrap/SKILL.md`
- The phrase naming util-design-partner-role's SKILL.md still present (the surviving hash target)

**Given:** start-bootstrap line 92 names both `util-design-partner-role` and `design-large-task` SKILL.md files as inputs to the session-meta hash script; the surviving text reads "skillVersion (commit hash for `util-design-partner-role` SKILL.md)"
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task.*SKILL\.md\|SKILL\.md.*design-large-task" skills/start-bootstrap/SKILL.md` exits non-zero
- `grep -q "util-design-partner-role.*SKILL\.md" skills/start-bootstrap/SKILL.md` exits zero (surviving reference present)

**Researcher-confirmed anchor (round 02 Q&A):** the unique absent fragment is `` design-large-task` SKILL.md ``; the surviving positive fragment is `util-design-partner-role.*SKILL.md`.

**Note:** The session-meta script call itself may need to be simplified or the hash field removed entirely. The observable boundary checks only that the stale file reference is gone; how the script is corrected (remove the field, hash only util-design-partner-role, or drop the hash step) is an implementation choice.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-2.5 — design-brief-small-template upsize pointer deleted

**Observable boundary:**
- The path reference `design-large-task/references/design-brief-template.md` absent from `skills/design-small-task/references/design-brief-small-template.md`

**Given:** design-brief-small-template lines 20–23 and 138–139 point to the large-task template path as the "full template" target; that path does not exist
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task/references" skills/design-small-task/references/design-brief-small-template.md` exits non-zero

**Note:** The "When to Use This Template" section's guidance about when to escalate to the full template must also be rewritten — the escalation target is now `design-committee` or `design-grillme`, not a deleted skill. The observable boundary is the path absence; the rewrite content is an implementation choice.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-2.6 — record-formats stage enum entry deleted

**Observable boundary:**
- `design-large-task` absent from `skills/finish-write-records/references/record-formats.md`

**Given:** record-formats.md contains a `stage:` field enum that lists design-large-task as a valid stage value
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" skills/finish-write-records/references/record-formats.md` exits non-zero

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-2.7 — fork-policy dead dispatch rows deleted

**Observable boundary:**
- Rows 1a–1g absent from `docs/fork-policy.md`
- Specifically: no row containing `design-large-task` survives in the table
- The framing-side rationale string that existed for those rows may or may not survive (it belongs to the deleted rows, not to surviving rows)

**Given:** fork-policy.md rows 1a–1g describe design-large-task dispatch sites: code explorer (1a), prior-art explorer (1b), industry explorer (1c), and four step-b poles (1d–1g)
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" docs/fork-policy.md` exits non-zero
- `grep -q "step-b" docs/fork-policy.md` exits non-zero

**Why not re-point:** the dispatch table records active sites. These were active sites for a removed skill. Re-pointing would assert a surviving skill dispatches these agents; no surviving skill does. The `design-committee` pole rows are a separate future sprint (Path A deferred gap).

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-2.8 — docs/instructions.md design-large-task section deleted

**Observable boundary:**
- `design-large-task` absent from `docs/instructions.md`
- The design phase description updated to reflect current-state skills

**Given:** docs/instructions.md contains a full `chester:design-large-task` section (approx. lines 219–247), the pipeline diagram, quick-reference table rows, and template references — all naming a removed skill
**When:** the scrub lands
**Then:**
- `grep -q "design-large-task" docs/instructions.md` exits non-zero

**Note:** The committee-analysis ratified a deliberate rewrite of the design section as current-state rather than line-by-line scrub. The observable boundary (absence of the string) is the same either way; the rewrite approach is an implementation choice for plan-build.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-3.1 — agent-industry-explorer archived

**Observable boundary:**
- `agents/agent-industry-explorer.md` does not exist at its current path
- A file with the same base name exists under `_archive/design-large-task/`

**Given:** `agents/agent-industry-explorer.md` exists; it has no surviving dispatch site; design-large-task was its sole caller (researcher-confirmed)
**When:** the scrub lands
**Then:**
- `test -f agents/agent-industry-explorer.md` exits non-zero (file gone from agents/)
- `test -f _archive/design-large-task/agent-industry-explorer.md` exits zero (file present in archive)

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-4.1 — test-plan-build-heuristic updated

**Observable boundary:**
- `test-plan-build-heuristic.sh` no longer contains the `grep -q "design-large-task"` assertion on plan-build
- The test still passes (`bash tests/test-plan-build-heuristic.sh` exits zero)

**Given:** the test currently asserts design-large-task must appear in plan-build/SKILL.md; after the scrub that file will contain no such mention
**When:** both plan-build/SKILL.md is scrubbed AND the test is updated in lockstep
**Then:**
- `grep -q '"design-large-task"' tests/test-plan-build-heuristic.sh` exits non-zero (the stale assertion gone)
- `bash tests/test-plan-build-heuristic.sh` exits zero (test passes on updated content)

**Note on replacement assertion:** the test comment says "cascade survives through design-specify." The replacement assertion should check the cascade concept: e.g., that plan-build references both `ground-truth` and `design-specify` — which is true of the surviving cascade text and will remain true after the large-task clause is simplified out.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-4.2 — test-artifact-schema updated

**Observable boundary:**
- `design-large-task` absent from the producers loop in `tests/test-artifact-schema.sh`
- The test still passes (`bash tests/test-artifact-schema.sh` exits zero)

**Given:** the test's producers loop currently includes `design-large-task`; after the schema scrub that name will not appear in util-artifact-schema/SKILL.md
**When:** both util-artifact-schema/SKILL.md is scrubbed AND the test is updated in lockstep
**Then:**
- `grep -q '"design-large-task"' tests/test-artifact-schema.sh` exits non-zero (removed from loop)
- `bash tests/test-artifact-schema.sh` exits zero

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-4.3 — test-artifact-schema-provenance updated

**Observable boundary:**
- `design-large-task` absent from the stamping-skills loop in `tests/test-artifact-schema-provenance.sh`
- The test still passes (`bash tests/test-artifact-schema-provenance.sh` exits zero)

**Given:** the provenance test's loop currently includes `design-large-task`; after the schema scrub that name will not appear in the stamping list
**When:** both util-artifact-schema/SKILL.md is scrubbed AND the test is updated in lockstep
**Then:**
- `grep -q '"design-large-task"' tests/test-artifact-schema-provenance.sh` exits non-zero (removed from loop)
- `bash tests/test-artifact-schema-provenance.sh` exits zero

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-4.4 — test-ac-4-1-fork-policy-pole-rows archived

**Observable boundary:**
- `tests/test-ac-4-1-fork-policy-pole-rows.sh` does not exist at its current path
- A file with the same name exists under `_archive/design-large-task/tests/`

**Given:** the test greps for `chester:design-large-task-step-b-{pole}` entries in fork-policy.md; after AC-2.7 those entries are gone; the test would fail if left in place
**When:** both fork-policy.md is scrubbed AND the test is moved in lockstep
**Then:**
- `test -f tests/test-ac-4-1-fork-policy-pole-rows.sh` exits non-zero (gone from live tests/)
- `test -f _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh` exits zero (present in archive)

**Why archive rather than update:** the criterion this test pins was a requirement for a removed skill's behavior (step-b pole dispatch). No live equivalent exists to re-point it to — Path A explicitly defers the design-committee pole-row authoring to a future sprint. An updated test would be testing a gap, not a contract.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-5.1 — version bumps on all modified SKILL.md files

**Observable boundary:**
- Each modified SKILL.md carries a version number strictly greater than its pre-scrub version

**Given:** committee-analysis lists six SKILL.md files that change behavior/contract text: plan-build (v0005), util-artifact-schema (v0002), design-specify (v0003), util-design-partner-role (v0004), start-bootstrap (v0002), execute-write (v0007)
**When:** the scrub lands
**Then:** for each of the six files, the `version:` field in frontmatter is one increment higher than the pre-scrub value:
- `grep -q "^version: v0006" skills/plan-build/SKILL.md` exits zero
- `grep -q "^version: v0003" skills/util-artifact-schema/SKILL.md` exits zero
- `grep -q "^version: v0004" skills/design-specify/SKILL.md` exits zero
- `grep -q "^version: v0005" skills/util-design-partner-role/SKILL.md` exits zero
- `grep -q "^version: v0003" skills/start-bootstrap/SKILL.md` exits zero
- `grep -q "^version: v0008" skills/execute-write/SKILL.md` exits zero

**Note:** Reference files under a skill (e.g., record-formats.md, design-brief-small-template.md) ride the parent skill's bump — they carry no own version field. The observable boundary covers SKILL.md frontmatter only.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### AC-6.1 — full test suite stays green

**Observable boundary:**
- All tests in `tests/` pass after the complete scrub lands

**Given:** the suite was at zero failing before this sprint; four tests are being updated in lockstep (AC-4.1–4.4); all other tests are unmodified
**When:** all AC-1.x through AC-5.x changes are committed
**Then:**
- `for t in tests/test-*.sh; do bash "$t"; done` all exit zero
- No test that was passing before the sprint begins failing after

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

## Purist Concern: Category Boundary Discipline

The AC group structure above enforces one rule the Purist position holds as non-negotiable: **AC-1 (re-point) and AC-2 (delete) must never share an observable boundary.**

Every AC-1 boundary has TWO assertions: design-large-task absent AND design-small-task present. Every AC-2 boundary has ONE: design-large-task absent, nothing substituted (except AC-2.1 which also checks the orphaned type rows are gone and design-small-task survives as the remaining producer in the design row — still distinct from a re-point because the positive assertion is about a different concept's survival, not design-small-task substituting for design-large-task in the same slot).

A spec that collapses these into a shared "large-task absent" boundary would pass green even if the re-point edits were accidentally omitted. The two-assertion boundary is the test harness equivalent of the three-rule sort — it makes the distinction auditable.

---

## Open item: researcher Q&A

Sent to researcher: need exact grep-able fragments for (1) start-bootstrap line 92 design-large-task mention, and (2) the surviving design-small-task template path in design-specify after the large-task path is removed. AC-2.4 and AC-2.3 observable boundaries above use pattern-matches that should work based on the researcher's round-01 findings; will update if the researcher's answer refines them.

---

## Change log

- 2026-06-05 — Round 02 position written. AC group structure proposed: AC-1.x re-points (6), AC-2.x deletes (8), AC-3.x archive (1), AC-4.x test lockstep (4), AC-5.x version bumps (1), AC-6.x suite green (1). Total: 21 ACs.
- 2026-06-05 — Researcher Q&A resolved: AC-2.3 and AC-2.4 observable boundaries tightened with confirmed unique grep anchors. AC-2.4 gains a positive assertion (util-design-partner-role SKILL.md reference survives). Conservator Q&A resolved: write-session-metadata.sh script is not a behavioral bug — git log on a deleted path returns the last commit hash, not null/error; AC-2.4 remains documentation-only; script field rename deferred to a follow-up sprint.
