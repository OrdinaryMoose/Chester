# Spec: Complete the design-large-task Reference Removal

**Sprint:** 20260605-01-remove-largetask-references
**Parent brief:** docs/chester/working/20260605-01-remove-largetask-references/design/20260605-01-remove-largetask-references-design-00.md
**Architecture:** Action-category decomposition — every edit site is classified as re-point, delete, archive, or test-lockstep, and acceptance criteria are grouped by category so the uniform-rule constraint stays visible. Authored by the design-committee (round 02) over the round-01 ratified design (Path A).

**Framing note — `design-large-task` is removed, not renamed.** It is a deprecated skill being deleted; `design-small-task` is a distinct, surviving skill that was never a continuation of it. "Re-point" in this spec means *drop the deprecated member from a list that already named design-small-task*, or *name the surviving skill that factually owns a role now* — it never means "design-large-task became design-small-task." Where design-large-task is the sole named actor for a job no surviving skill performs, the mention is deleted, not re-pointed.

## Goal

Complete the intentional removal of `design-large-task` by scrubbing its live references across the skill, agent, and documentation corpus and by moving the one orphaned test and the one orphaned agent into the archive, leaving the surviving `design-small-task` pipeline coherent and internally consistent. The removal is already ratified; this sprint finishes it without reversing it. The test suite must stay green throughout — the reference scrub and the four test edits land together, never leaving a red state between commits.

## Components

Units touched, grouped by the action applied. File enumeration sits inside each action heading so the downstream plan keeps per-file granularity without losing the category constraint.

**Re-point (drop `design-large-task`, keep `design-small-task`; the role survives with the small-task skill as actor):**
- `skills/execute-write/SKILL.md` — worktree-creation sentence + canonical-sequence mention
- `skills/design-specify/SKILL.md` — description, entry condition, standalone note, Reads template path, invoked-by
- `skills/plan-build/SKILL.md` — canonical-sequence mention, ground-truth cascade sentence, spec-compatibility note
- `skills/start-bootstrap/SKILL.md` — description (caller list) + when-to-call
- `skills/util-design-partner-role/SKILL.md` — intro line naming the readers of the file
- `skills/util-worktree/SKILL.md` — the design-large-task caller bullet in Integration
- `skills/setup-start/SKILL.md` — available-skills list entries for start-bootstrap and design-specify, kept in lockstep with their updated descriptions (two-place-sync rule, root CLAUDE.md)

**Delete (no surviving exhibitor; remove the line, substitute nothing):**
- `skills/util-artifact-schema/SKILL.md` — design-row producer half + template-path note, the thinking-artifact row, the process-artifact row, the stamping-list entry
- `skills/util-design-partner-role/SKILL.md` — the capture-thought sentence in the private-precision note
- `skills/start-bootstrap/SKILL.md` — the dead SKILL.md path in the skill-version description prose
- `skills/design-specify/SKILL.md` — the dead large-task template path in Reads
- `skills/design-small-task/references/design-brief-small-template.md` — the use-the-full-template upsize block + the archived-template reference
- `skills/finish-write-records/references/record-formats.md` — the stage-enum entry
- `docs/fork-policy.md` — the step-b pole-agent rows (1a–1g)

**Deliberate rewrite (too many hits for line-by-line scrubbing; rewrite the section as current-state):**
- `docs/instructions.md` — the design-large-task section, the design-figure-out section, the comparison-table rows, and the scattered pipeline mentions

**Archive (move out of the live tree):**
- `agents/agent-industry-explorer.md` → `_archive/design-large-task/agent-industry-explorer.md` (confirmed full orphan — no surviving skill dispatches it)

**Test-lockstep (edit in the same change as the files they pin):**
- `tests/test-plan-build-heuristic.sh`, `tests/test-artifact-schema.sh`, `tests/test-artifact-schema-provenance.sh` — targeted removals
- `tests/test-ac-4-1-fork-policy-pole-rows.sh` → archive to `_archive/design-large-task/tests/`

## Data Flow

No runtime data flow changes. This is a documentation-and-test refactor over the skill corpus. The only "flow" is the provenance-harvest path, and round-01 ground truth confirmed it is unaffected: `chester-trailer-write harvest` reads trailer lines already written into artifact files; it never consults the util-artifact-schema producer list, so removing entries from that list cannot orphan any archived trailer.

## Error Handling

The single failure mode is a red test suite. It is prevented structurally, not handled after the fact:
- Each file scrub and its pinning test edit land together (same or adjacent commit), so the suite never observes a half-applied change.
- The terminal gate (AC-6.1) re-runs the whole suite after all changes; a non-zero failure count attributable to this sprint blocks completion.
- The re-point criteria carry a two-part observable boundary (large-task absent **and** small-task present), so an accidentally-omitted re-point fails its AC rather than passing on the absence check alone.

## Testing Strategy

Two levels, neither subsuming the other:
- **Per-test lockstep (AC-4.x).** Each of the three surviving pinning tests is edited to drop its design-large-task assertion while every other assertion in that test continues to hold; the test exits 0. The fourth test is archived, not edited. This level catches "did I change the right assertion."
- **Sprint capstone (AC-6.1).** After all file and test changes, the full suite (`for t in tests/test-*.sh; do bash "$t"; done`) reports zero failures attributable to this sprint. This level catches "did editing one test break something adjacent."

All acceptance criteria are mechanically checkable by running a test or grepping a file. No aspirational criteria.

## Constraints

- The reference scrub and the four test edits land together — scrubbing a pinned file without its test edit breaks a green suite _(structural)_.
- Edited skill bodies describe current state declaratively; no historical narration in the main body — history belongs in a change log only _(normative — standalone-documentation discipline)_.
- Stage by path; never `git add -A` / `git add .` — the tree carries unrelated D and ?? entries _(normative — CLAUDE.md staging discipline)_.
- Edits to live skills happen in the sprint worktree; working-dir artifacts stay at the main-repo path _(structural — directory model)_.
- Any SKILL.md whose body or contract text changes takes a version bump; reference files under a skill ride the parent skill's bump _(normative — skill-versioning rule)_.

## Non-Goals

- Restoring or replacing `design-large-task` — removal is ratified; this sprint completes it.
- Touching frozen history under `docs/chester/plans/` — archives correctly describe their own time.
- Editing `_archive/` contents — the archived skill, agents, and tests stay as-is.
- Authoring `design-committee` pole rows in `docs/fork-policy.md` — the deferred follow-up; this sprint deletes the dead step-b rows but does not write replacements.
- Re-pointing sample-string fixtures (`test-trailer-*`, `test-decision-record-*`) — they use the skill name as an arbitrary token, not coupled to the skill existing.
- Deletion of the dead `designLargeTask` field in `write-session-metadata.sh` — see the Open Scope Decision note below; pending designer ruling, treated as a deferred follow-up (delete the field, not rename it).

## Open Scope Decision (for the designer)

`write-session-metadata.sh` (session-meta hook) carries a `designLargeTask` field that hashes the `design-large-task` SKILL.md path, already dead after the original removal. This is a *functional* dangling reference (a script), not a documentation hit, so it sits just outside the ratified doc-scrub. The deferred fix is to **delete the dead `designLargeTask` field** (and its log query) — not rename it, since design-small-task is a separate surviving skill with its own tracking, not a continuation of the removed one. The committee leans **defer**: ground truth confirms the field degrades gracefully (the `git log` on the deleted path returns the last pre-deletion commit hash, the `2>/dev/null` guard handles empty output, and the field is archival with no downstream consumer). The spec carries the *documentation* edit (start-bootstrap's prose, AC-2.4) but treats the script-field deletion as a deferred follow-up unless the designer rules it in-scope.

## Acceptance Criteria

### AC-1.1 — Re-point execute-write

**Observable boundary:**
- `grep -c design-large-task skills/execute-write/SKILL.md` → 0
- `grep -c design-small-task skills/execute-write/SKILL.md` → ≥ 1

**Given:** the worktree-creation sentence names design-large-task as an upstream creator.
**When:** the scrub applies.
**Then:** the sentence names design-small-task only, and the canonical-sequence mention drops the large-task member while keeping small-task.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.2 — Re-point design-specify (entry path)

**Observable boundary:**
- design-large-task absent from description (line 3), entry condition (line 18), standalone note (line 48), invoked-by (line 237)
- design-small-task present in each of those locations

**Given:** four entry-path locations list design-large-task as a source/invoker.
**When:** the scrub applies.
**Then:** each names design-small-task only; the dead template path in Reads is handled by AC-2.3.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.3 — Re-point plan-build (sequence + cascade + spec-compat)

**Observable boundary:**
- design-large-task absent from skills/plan-build/SKILL.md
- the ground-truth cascade rule still present (cites design-specify as the spec-stage report source)
- design-small-task present in the spec-compatibility note

**Given:** the canonical-sequence line, the cascade sentence, and the spec-compat note reference design-large-task.
**When:** the scrub applies.
**Then:** the sequence drops the large-task member, the cascade sentence is rewritten to one sentence keeping the rule, and the spec-compat note drops the section-count split and names design-small-task / human-authored specs.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.4 — Re-point start-bootstrap (callers + when-to-call)

**Observable boundary:**
- design-large-task absent from the description caller list and the when-to-call list
- design-small-task present in both; design-specify and execute-write listed as standalone callers

**Given:** the description and when-to-call name design-large-task as the always-caller.
**When:** the scrub applies.
**Then:** design-small-task is the always-caller; standalone callers list design-specify and execute-write.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.5 — Re-point util-design-partner-role (intro line)

**Observable boundary:**
- the intro line (line 9) names design-small-task as the reader; no "both" / design-large-task phrasing remains
- the capture-thought sentence handled separately by AC-2.2

**Given:** the intro line says both task skills read the file.
**When:** the scrub applies.
**Then:** it says design-small-task reads the file.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.6 — Re-point util-worktree (Integration)

**Observable boundary:**
- the design-large-task caller bullet (line ~199) is gone
- the REQUIRED/worktree-creation obligation still reads true with design-small-task at closure as actor

**Given:** Integration lists design-large-task as a worktree creator.
**When:** the scrub applies.
**Then:** the design-large-task bullet is removed and the surviving obligation names design-small-task.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.7 — Sync setup-start available-skills list

**Observable boundary:**
- `grep -c design-large-task skills/setup-start/SKILL.md` → 0
- the start-bootstrap and design-specify entries in the available-skills list match their updated SKILL.md descriptions

**Given:** root CLAUDE.md requires the description field and the setup-start list to stay in lockstep.
**When:** start-bootstrap and design-specify descriptions change.
**Then:** their setup-start entries are updated to match, with no design-large-task reference remaining.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.1 — Delete util-artifact-schema large-task entries

**Observable boundary:**
- `grep -c design-large-task skills/util-artifact-schema/SKILL.md` → 0
- the thinking-artifact row and the process-artifact row are gone
- design-small-task remains present as a design-artifact producer

**Given:** the design row's producer half, the template-path note, the thinking row, the process row, and the stamping-list entry name design-large-task.
**When:** the delete applies.
**Then:** all five are removed; nothing is substituted for the large-task half; the surviving small-task producer stays.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.2 — Delete capture-thought sentence (util-design-partner-role)

**Observable boundary:**
- the private-precision note's first sentence (the design-large-task capture-thought comparison, line 96) is gone
- the surviving design-small-task sentence in that note remains

**Given:** the note opens by contrasting the two task skills' capture-thought behavior.
**When:** the delete applies.
**Then:** only the design-small-task sentence remains.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.3 — Delete dead template path (design-specify Reads)

**Observable boundary:**
- the design-large-task template path is absent from the Reads section (line ~235)
- the design-small-task template path is present

**Given:** Reads lists both task-skill template paths; the large-task one no longer exists on disk.
**When:** the delete applies.
**Then:** only the design-small-task template path remains.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.4 — Delete dead SKILL.md path (start-bootstrap session-meta prose)

**Observable boundary:**
- the skill-version description prose (line ~92) no longer names the design-large-task SKILL.md path

**Given:** the prose describes the session-meta hash as covering design-large-task SKILL.md.
**When:** the delete applies.
**Then:** the dead path is dropped from the prose. (Deleting the script's dead `designLargeTask` field is the deferred follow-up — see Open Scope Decision.)

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.5 — Delete upsize pointer (design-brief-small-template)

**Observable boundary:**
- the use-the-full-large-task-template block (lines ~20–24) is gone, replaced by a one-line pointer to design-committee / design-grillme
- the archived-template reference (lines ~138–139) reads as archived, not as a live path

**Given:** the small-task template tells the reader to upsize to the large-task template.
**When:** the delete/rewrite applies.
**Then:** no live large-task path is referenced; the upsize pointer names a surviving destination.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.6 — Delete stage-enum entry (record-formats)

**Observable boundary:**
- `grep -c design-large-task skills/finish-write-records/references/record-formats.md` → 0

**Given:** the stage enum (line ~193) lists design-large-task as a stage.
**When:** the delete applies.
**Then:** the entry is removed; surviving stages stay.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.7 — Delete step-b pole rows (fork-policy)

**Observable boundary:**
- `grep -c design-large-task docs/fork-policy.md` → 0
- `grep -c step-b docs/fork-policy.md` → 0
- the plan-build-reviewer row survives as the new first data row (no renumbering required)

**Given:** rows 1a–1g (lines 14–20) document the removed step-b pole dispatches.
**When:** the delete applies.
**Then:** all seven rows are removed; the table header and subsequent rows remain intact.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.8 — Rewrite docs/instructions design section

**Observable boundary:**
- `grep -c design-large-task docs/instructions.md` → 0
- `grep -ci "design-figure-out\|DFO" docs/instructions.md` → 0 (the removed figure-out section)
- the surviving design path (design-small-task → design-specify) is described accurately, including the correction that design-small-task feeds design-specify, not plan-build directly

**Given:** design-large-task and design-figure-out references span many lines and sections.
**When:** the rewrite applies.
**Then:** the design section, comparison-table rows, and pipeline mentions are rewritten as current-state with no design-large-task or design-figure-out references.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.1 — Archive agent-industry-explorer

**Observable boundary:**
- `[ ! -f agents/agent-industry-explorer.md ]` → true
- `[ -f _archive/design-large-task/agent-industry-explorer.md ]` → true

**Given:** the agent is a confirmed full orphan, dispatched by no surviving skill.
**When:** the archive applies.
**Then:** the file leaves agents/ and lands under _archive/design-large-task/ (move, not copy).

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.1 — Lockstep: test-plan-build-heuristic

**Observable boundary:**
- `bash tests/test-plan-build-heuristic.sh` → exit 0
- the design-large-task cascade assertion block (lines ~63–68) is removed; all other assertions remain

**Given:** the test greps plan-build for design-large-task and fails if absent.
**When:** plan-build is scrubbed (AC-1.3) and this block is removed in the same change.
**Then:** the test passes with its remaining assertions intact.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.2 — Lockstep: test-artifact-schema

**Observable boundary:**
- `bash tests/test-artifact-schema.sh` → exit 0
- design-large-task removed from the producer loop (line ~17); surviving producers remain

**Given:** the producer loop includes design-large-task.
**When:** the schema is scrubbed (AC-2.1) and the loop entry is removed in the same change.
**Then:** the test passes.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.3 — Lockstep: test-artifact-schema-provenance

**Observable boundary:**
- `bash tests/test-artifact-schema-provenance.sh` → exit 0
- design-large-task removed from the stamping-skill loop (line ~24)
- the schema version assertion updated to the bumped value (v0002 → v0003) so it matches AC-5.1

**Given:** the test loops over stamping skills including design-large-task AND asserts the schema version.
**When:** the schema is scrubbed and bumped in the same change.
**Then:** both the loop entry removal and the version-assertion update land together; the test passes.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.4 — Lockstep: archive test-ac-4-1-fork-policy-pole-rows

**Observable boundary:**
- `[ ! -f tests/test-ac-4-1-fork-policy-pole-rows.sh ]` → true
- `[ -f _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh ]` → true

**Given:** the test pins the step-b pole rows, which AC-2.7 deletes, and no design-committee rows exist to redirect it to.
**When:** the rows are deleted.
**Then:** the test is moved to the archive (not rewritten), so the suite no longer runs an assertion for removed behavior.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.1 — Version bumps on modified skills

**Observable boundary (each increments by exactly one from its current value):**
- start-bootstrap v0002 → v0003
- util-artifact-schema v0002 → v0003
- execute-write v0007 → v0008
- plan-build v0005 → v0006
- util-design-partner-role v0004 → v0005
- design-specify v0003 → v0004
- util-worktree v0001 → v0002 (Integration section is contract text)
- setup-start — increment by one from its current value (confirm current at implementation)

**Given:** each listed SKILL.md has body/contract text changed by this sprint.
**When:** the scrub applies.
**Then:** each file's version frontmatter is incremented by one. Reference files (design-brief-small-template, record-formats) carry no own version and ride their parent skill's bump.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.1 — Suite stays green (sprint capstone)

**Observable boundary:**
- `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done` → no FAIL line attributable to this sprint

**Given:** all re-point, delete, archive, and test-lockstep changes are applied.
**When:** the full suite runs.
**Then:** zero failures are attributable to this sprint. Pre-existing unrelated failures, if any, are unchanged base-to-HEAD and noted.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

### Change log

- 2026-06-05 — Spec authored by the design-committee (round 02) from the round-01 ratified design (Path A). Section ownership: Innovator (Goal, Components), Purist (AC decomposition), Pragmatist (Testing Strategy, AC-4.x/6.1), Conservator (Constraints, Non-Goals, regression-guards), Researcher (exact anchors, version numbers). Two items surfaced beyond the ratified 12: setup-start two-place sync (specced in, AC-1.7) and the write-session-metadata.sh dead-path hash (flagged as Open Scope Decision, leaning defer).
- 2026-06-05 — Designer correction folded in: design-large-task is deprecated and removed, not renamed to design-small-task. Added the Framing note clarifying that "re-point" means dropping the deprecated member or naming the surviving skill that factually owns a role — never treating design-small-task as a continuation of design-large-task. The deferred script fix corrected from "rename designLargeTask → designSmallTask" to "delete the dead designLargeTask field."
