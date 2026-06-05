# Purist Transcript — Round 04 (Attack)

**Sprint:** 20260605-01-remove-largetask-references
**Round:** 04 — plan-attack
**Role:** Purist (category integrity / trace / contract gaps)

---

## Attack 1: AC-Trace — Two-Part Observable Boundary Check

Re-derived coverage for all 24 ACs. The Purist attack targets whether each re-point task's verify step carries BOTH greps (large-task absent AND small-task present), and whether any AC's observable boundary is only partially satisfied by its task.

### AC-1.1 (execute-write, Task 6) — PASS

Step 4 carries both greps:
- `grep -c design-large-task skills/execute-write/SKILL.md` → `0`
- `grep -c design-small-task skills/execute-write/SKILL.md` → `≥ 1`

Both assertions present. Boundary complete.

### AC-1.2 (design-specify, Task 5) — PASS

Step 4 carries both greps:
- `grep -c design-large-task skills/design-specify/SKILL.md` → `0`
- `grep -c design-small-task skills/design-specify/SKILL.md` → `≥ 1`

Both assertions present. Boundary complete.

### AC-1.3 (plan-build, Task 1) — PASS

Step 4 carries both greps:
- `grep -c design-large-task skills/plan-build/SKILL.md` → `0`
- `grep -c design-small-task skills/plan-build/SKILL.md` → `≥ 1`

Both assertions present. The cascade-rule survival check ("ground-truth cascade rule still present, cites design-specify as the spec-stage report source") is a READ-only confirm in the step narrative, not a separate grep gate. This is acceptable — the cascade's survival is guaranteed by the instruction to keep the rule while dropping the clause; a grep for "design-specify" in plan-build would add safety but is not structurally required given the task description.

### AC-1.4 (start-bootstrap, Task 4) — **DEFECT: presence gap**

Step 4 carries:
- `grep -c design-large-task skills/start-bootstrap/SKILL.md` → `0`
- `grep -c design-small-task skills/start-bootstrap/SKILL.md` → `≥ 1`

**The defect:** start-bootstrap currently contains ZERO occurrences of `design-small-task`. The re-point edit must ADD design-small-task to the caller list — it cannot just delete the large-task references. If an implementer only deletes the three large-task occurrences (lines 6, 19, 92) without inserting "design-small-task" into the When to Call section, the absence check passes but the presence check fails. The task description says "name design-small-task as always-caller" — this re-point is load-bearing for the two-part boundary. **The verify step is correct; the risk is that the task description must make the insertion requirement explicit.** Severity: medium — the description implies the insertion, but does not state it plainly enough for a fresh implementer.

**Recommended fix:** Add a sentence to Task 4's Step 3 prose: "In the When to Call section, replace the design-large-task 'Always' bullet with a design-small-task 'Always' bullet — do not merely delete the old bullet, as the re-point requires an explicit insertion."

### AC-1.5 (util-design-partner-role, Task 4) — **DEFECT: presence check on wrong file**

Step 4 for Task 4 carries:
- `grep -c design-large-task skills/util-design-partner-role/SKILL.md` → `0`
- `grep -c design-small-task skills/util-design-partner-role/SKILL.md` → `≥ 1`

util-design-partner-role already has design-small-task present (confirmed at line 96: the surviving small-task sentence in the private-precision note). The presence check will pass even if the re-point edit on line 9 is accidentally omitted — the surviving line 96 mention keeps the count ≥ 1 regardless. **The presence check is insufficient to confirm the intro-line re-point landed.**

**Recommended fix:** The verify step should check for design-small-task in the specific context of the intro line, not just a file-wide count. Suggested addition: `grep -q "design-small-task reads this file\|design-small-task.*read this file" skills/util-design-partner-role/SKILL.md` → exit 0. A file-wide count ≥ 1 is necessary but not sufficient for AC-1.5.

### AC-1.6 (util-worktree, Task 7) — PARTIAL

Step 4 carries:
- `grep -c design-large-task skills/util-worktree/SKILL.md` → `0`
- No explicit presence-check grep for design-small-task.

**The defect:** Task 7's Step 4 verify for util-worktree checks only the absence of design-large-task. The surviving obligation (design-small-task at Closure as worktree creator) is described in the task text but not gate-checked. The spec's AC-1.6 observable boundary explicitly requires both: "the REQUIRED/worktree-creation obligation still reads true with design-small-task at closure as actor."

**Recommended fix:** Add `grep -q "design-small-task" skills/util-worktree/SKILL.md` → exit 0 to Task 7 Step 4.

### AC-1.7 (setup-start, Task 8) — ACCEPTABLE with caveat

Step 1 confirms both files are already grep-zero; the real work is description-text sync. The verify step checks `test-start-cleanup.sh` passes and instructs a visual comparison. No design-small-task presence-check grep. But AC-1.7's observable boundary (the spec) is: "start-bootstrap and design-specify entries in the available-skills list match their updated SKILL.md descriptions." A visual confirm is the correct check here — a grep for design-small-task in skill-index.md is not the boundary; the boundary is content match. Acceptable.

### AC-2.x (delete tasks) — PASS pattern

All delete tasks check only absence (no surviving member to assert). Verified:
- Task 2 Step 4: `grep -c design-large-task skills/util-artifact-schema/SKILL.md` → `0` AND `grep -c design-small-task … → ≥ 1` (the surviving design-artifact producer). This is the one delete AC where a positive check is needed and it is present.
- Task 3 Step 4: fork-policy absence + step-b absence + file-move check. Clean.
- Task 4 Step 4 (AC-2.2, AC-2.4): covered by the combined Task 4 absence check.
- Task 7 Step 4 (AC-2.5, AC-2.6): absence checks on their respective files. Clean.
- Task 9 Step 4 (AC-2.8): `grep -c design-large-task docs/instructions.md → 0`. Clean.

**Note on AC-2.1 positive assertion:** Task 2 checks `grep -c design-small-task skills/util-artifact-schema/SKILL.md → ≥ 1`. This is correctly a delete-AC check (not a re-point), because design-small-task was already present as the surviving producer; the positive check confirms the deletion didn't accidentally remove it. The category is clean — design-small-task's presence is a survival assertion, not a re-point assertion.

### AC-3.1 (archive, Task 7) — PASS

Step 4: `[ ! -f agents/agent-industry-explorer.md ] && [ -f _archive/design-large-task/agent-industry-explorer.md ] && echo OK` → `OK`. Two-path assertion present. Clean.

### AC-4.x (test lockstep) — PASS pattern

Each test-lockstep task runs the test in Step 4 and expects exit 0. All four covered:
- AC-4.1: `bash tests/test-plan-build-heuristic.sh` → exit 0 (Task 1)
- AC-4.2: `bash tests/test-artifact-schema.sh` → exit 0 (Task 2)
- AC-4.3: `bash tests/test-artifact-schema-provenance.sh` → exit 0 (Task 2)
- AC-4.4: file-move check (Task 3)

### AC-5.1 (version bumps) — PASS pattern

Each skill's version bump is paired with its version-pinning test in the same task. The non-obvious one (task 2: two version-assertion tests for one file) is explicitly handled. All eight skills covered across Tasks 1, 2, 4, 5, 6, 7, 8.

### AC-6.1 (suite green, Task 10) — PASS

Full suite sweep in Task 10 Step 1. Clean.

---

## Attack 2: OD-1 — record-formats Historical Examples

**The question:** Is the plan's default (a) — scrub all occurrences, substitute a surviving skill name or placeholder — category-clean? Or does substituting a skill name into a historical example assert a false equivalence?

**The four occurrences:**

1. **Line 68** — inside a provenance trailer example block:
   ```
   <!-- produced-by design-large-task@vNNNN -->
   ```
   This is an example of a provenance trailer line produced by a skill that stamped an artifact. It is a documentation example of what a real trailer looks like.

2. **Line 193** — the stage enum (the spec's AC-2.6 target):
   ```
   stage: design-large-task | design-small-task | design-specify | ...
   ```
   This is a forward-facing enumeration of valid stage values.

3. **Line 213** — a prose field description:
   ```
   the skill where the decision crystallized (e.g., the design-large-task Solve Stage round, or the plan-build task-mapping step)
   ```
   This is a parenthetical example explaining the stage field.

4. **Line 229** — inside a complete decision record example:
   ```
   stage: design-large-task
   ```
   This is a field value in a concrete example decision record.

**Category analysis per occurrence:**

- **Line 193 (stage enum):** Forward-facing valid-value list. design-large-task is removed; it is no longer a valid stage. Delete the entry. Surviving values remain. This is a straightforward delete — no substitution needed.

- **Line 68 (trailer example):** This is a provenance trailer format example. The example shows what a trailer looks like. The Framing note says "re-point" means naming the surviving skill that factually owns a role — it never means substituting design-small-task for design-large-task. A trailer from design-large-task existed historically; design-small-task's trailers are different entries in the same format. Substituting `design-small-task` here would assert "design-small-task produces trailers instead of design-large-task" — true, but the example is a multi-line block that already shows design-specify and plan-build. **The correct action is to delete the design-large-task line from the example block**, not substitute. The surviving lines (design-specify, plan-build) still illustrate the format.

- **Line 213 (field description parenthetical):** The example names a specific stage ("the design-large-task Solve Stage round") as a concrete illustration of when a decision crystallizes. This is a sole-actor mention — no surviving skill has a "Solve Stage round." Substituting design-small-task here would be false: design-small-task has no Solve Stage. **Delete the design-large-task clause; keep the plan-build example.** The field description reads correctly with just "the plan-build task-mapping step."

- **Line 229 (example decision record):** The complete decision record example has `stage: design-large-task` as its stage field value. This is a fixture-like example of what a filled-in record looks like. Substituting design-small-task here would assert "this decision was made in design-small-task" — false for the fictional record. **Delete the example record or update the stage field to a surviving skill name.** Substituting any surviving skill name makes the fictional record plausible (a decision crystallized during plan-build or design-specify is common). Substituting design-small-task specifically is acceptable as a surviving skill that produces briefs.

**Purist ruling on OD-1:**

The plan's default (a) — "substitute a surviving skill name or placeholder" — is partially category-clean. The category-correct disposition per occurrence:

- Line 193: **delete** the enum entry (no substitute). ✓ Plan's intent satisfies this.
- Line 68: **delete** the design-large-task line from the trailer example block; do NOT substitute design-small-task in that position. Substituting would create a new false entry.
- Line 213: **delete** the design-large-task clause from the parenthetical; do NOT substitute. The plan-build example already in the same parenthetical is sufficient.
- Line 229: **update** the stage field value to a surviving skill name (design-small-task or plan-build or design-specify). This is not a substitution in the Framing-note sense — it is updating a fixture field value to something accurate.

**The flaw in default (a) as stated:** "substitute a surviving skill name" applied uniformly to lines 68 and 213 would introduce false equivalence. The plan must specify delete-not-substitute for those two lines. For line 229, a substitution (updating the field value) is the category-honest move.

**Verdict: OD-1 default (a) is partially wrong.** The plan must be more precise: delete-not-substitute for lines 68 and 213; update-field-value for line 229; delete-enum-entry for line 193. A blanket "substitute a surviving skill name or placeholder" rule produces the wrong result for lines 68 and 213.

---

## Attack 3: Category Blur — Task 4 and Task 7

### Task 4: start-bootstrap + util-design-partner-role (AC-1.4, AC-1.5, AC-2.2, AC-2.4)

Task 4 bundles two skills. Within each skill: mixed re-point + delete. Across the two skills: different categories applied to different files.

- start-bootstrap: re-point (caller list + when-to-call) + delete (session-meta prose)
- util-design-partner-role: re-point (intro line) + delete (capture-thought sentence)

**Is the cross-skill bundling a category blur?** No. The bundling rationale is commit-safety: `test-info-packet-style-version-bumps.sh` pins BOTH skills' versions in a single test run. If the two skills are in separate commits, the suite goes red between them (one bumped, test asserting both old values). The bundle is forced by the test structure, not by category similarity.

**Is the within-skill mixing a blur?** No. In each skill, the re-point and delete touch distinct locations with distinct observable boundaries. The net file state (design-large-task absent, design-small-task present in re-pointed locations) is coherent and independently verifiable. The category distinction is preserved by edit location and by the two-part vs. one-part boundary check.

**One genuine blur risk in Task 4:** the absence-check `grep -c design-large-task skills/start-bootstrap/SKILL.md → 0` covers BOTH the re-point edits (lines 6 and 19) AND the delete edit (line 92) in a single count. A reader cannot tell from the verify step which absence satisfies which AC. This is cosmetically blurred but not a correctness defect — the net observable boundary for AC-1.4 (re-point) is presence+absence; for AC-2.4 (delete) it is absence only. The combined absence check satisfies both. The presence check (`→ ≥ 1` for design-small-task) disambiguates the re-point from the delete.

**Verdict: Category blur in Task 4 is acceptable (commit-safety driven, not a real defect).**

### Task 7: util-worktree + agent archive + design-brief-small-template + record-formats (AC-1.6, AC-2.5, AC-2.6, AC-3.1)

Task 7 bundles a re-point (util-worktree), a delete (design-brief-small-template), a delete (record-formats), and an archive (agent). Three distinct categories in one task.

**Is the bundling a category blur?** Potentially — but the plan's rationale is that none of these files have pinning tests coupling them to each other. The question is whether bundling them creates any confusion about the category of each edit.

**Finding:** The plan's Step 3 prose distinguishes the operations: "Edit util-worktree (remove bullet, bump v0002). git mv the agent. Edit design-brief-small-template (delete upsize block + scrub remaining hits + gap comment). Edit record-formats (delete stage entry + scrub example occurrences)." The operations are named distinctly. The verify step checks each file independently.

**However:** Task 7's verify step does NOT carry a design-small-task presence check for util-worktree (AC-1.6). As flagged in Attack 1 (AC-1.6 defect), the absence check is present but the presence check is missing. This is a defect regardless of bundling.

**The bundling itself is not a category blur — but it creates a risk:** a reviewer scanning Task 7 sees mixed categories and may not notice that the util-worktree edit is a re-point (needing both greps) while the reference-file edits are deletes (needing only absence). The plan could mitigate this with a note: "util-worktree is a re-point; verify both absence and presence. The two reference-file edits are pure deletes; verify absence only."

**Verdict: Task 7 bundling is acceptable for commit-safety. The absence of the util-worktree presence-check grep is a real defect (carried from AC-1.6 Attack 1 finding).**

---

## Attack 4: OD-4 — Delete-without-Replacement for Upsize Block

**The question:** Is "delete the upsize block without replacement" category-honest?

**The upsize block's role:** It told users "if your task is too complex for this template, use the full design-large-task template instead." The role is: escalation pointer to a heavier design flow.

**Post-removal reality:** No surviving skill fills the "heavier design entry point" role. design-committee is a consultation primitive; design-grillme is a stress-test interview. Neither is an entry-point design skill. The Framing note says re-point means "name the surviving skill that factually owns a role now." No surviving skill factually owns the "start the heavy design flow" role.

**Category-honest analysis:**

- Re-pointing to design-committee or design-grillme would assert a false equivalence — those skills don't do what the upsize block said to do. This violates the Framing note.
- Keeping the upsize block with a dead path is the current bug — it tells users to do something impossible.
- Deleting without replacement is the sole-actor-mention case: design-large-task was the sole actor for this role, and that role has no surviving equivalent. Delete, substitute nothing.

**The gap comment question:** The plan says "leaving a one-line gap comment for designer review." Is a gap comment category-honest?

A gap comment is not a substitution — it says "this guidance was removed because the escalation path no longer exists; designer should decide whether to add new guidance." This is historical narration about a removal, not a current-state declaration. Per the standalone-documentation discipline, historical narration belongs in a change log, not the main body.

**Verdict: Delete-without-replacement is category-correct. The gap comment violates standalone-documentation discipline.** The correct move is to delete the upsize block entirely and record the reason in the file's change log section (if one exists) or in the commit message. The main body should read as current-state: a template that describes only itself, with no forward pointer to a non-existent escalation path. An absent pointer is honest; a "gap" comment is narration.

---

## Summary of Findings

**Defects (require plan fix before execution):**

1. **AC-1.4 insertion not explicit (Task 4, Step 3):** start-bootstrap has zero design-small-task occurrences. The re-point requires an explicit insertion of the design-small-task caller mention, not just deletion of design-large-task. Step 3 must state this plainly.

2. **AC-1.5 presence check insufficient (Task 4, Step 4):** A file-wide `grep -c design-small-task → ≥ 1` passes even if the intro-line re-point is omitted (line 96 keeps the count positive). Add a targeted grep: `grep -q "design-small-task reads this file\|design-small-task.*read this file" skills/util-design-partner-role/SKILL.md`.

3. **AC-1.6 presence check missing (Task 7, Step 4):** util-worktree verify step has no design-small-task presence check. Add: `grep -q "design-small-task" skills/util-worktree/SKILL.md` → exit 0.

4. **OD-1 over-broad substitution rule (Task 7, Step 3):** "substitute a surviving skill name or placeholder" applied uniformly produces false equivalence on lines 68 and 213 of record-formats. Per-occurrence ruling: line 193 delete enum entry; line 68 delete the line from the example block; line 213 delete the design-large-task clause from the parenthetical; line 229 update field value to a surviving skill name. Do NOT substitute for lines 68 and 213.

5. **OD-4 gap comment violates standalone-documentation discipline (Task 7, Step 3):** Delete the upsize block completely; move the reason to the commit message. Do not insert a gap comment in the main body.

**Acceptable findings (noted, no fix required):**

- Task 4 cross-skill bundling: commit-safety driven, not a category blur.
- Task 7 multi-category bundling: acceptable; the real defect is the missing util-worktree presence check (already flagged as defect 3 above).
- AC-2.1 positive assertion: survival check for design-small-task in util-artifact-schema is correctly a delete-category check, not a re-point.
- AC-1.3 cascade-rule survival: read-only confirm is acceptable given the task description.

---

## Change log

- 2026-06-05 — Round 04 attack written. Five defects found: two in Task 4 (insertion not explicit; presence check insufficient for intro-line re-point), one in Task 7 (util-worktree presence check missing), one in OD-1 (over-broad substitution rule on historical examples), one in OD-4 (gap comment violates standalone-documentation discipline). Three findings acceptable without fix.
