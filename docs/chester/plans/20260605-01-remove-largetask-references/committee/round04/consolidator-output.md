# Consolidator output — round 04

## Alignment

Structurally sound / no restructuring required (4): Conservator, Innovator, Pragmatist, Purist | Requires restructuring (0): none

All four members found the plan implementable without task restructuring. All four found defects or gaps requiring targeted plan amendments before execution. Zero members called the plan safe to execute as-is without any patches.

---

## Per-member summary

- Conservator: Plan is structurally sound with no missed lockstep pairs; two plan-description gaps (Task 7 surgical precision near Session Skill Versions heading; Task 8 missing test-partner-role-overlay-section in must-remain-green list) create implementation risks that could cause a red suite if not patched.
- Innovator: Plan is sound with no Critical findings; two Important findings (no cross-file phrasing consistency guard on canonical-sequence re-points; Task 8 description-sync work may be empty and the task should collapse to a one-line frontmatter bump) and three Minor findings.
- Pragmatist: No blocking findings; two non-blocking prose gaps (Task 4 Step 3 "two version-assertion tests" is imprecise; Task 7 OD-1 substitution leaves implementer an open micro-decision) and a spec-observation about AC-2.8's boundary not verifying surviving pipeline accuracy; subagent exec mode confirmed.
- Purist: Five defects require plan fix before execution — AC-1.4 insertion not explicit, AC-1.5 presence check insufficient for intro-line re-point, AC-1.6 presence check missing in Task 7 Step 4, OD-1 substitution rule over-broad for lines 68 and 213, OD-4 gap comment violates standalone-documentation discipline.
- Researcher: One hard blocker — plan-build L19 (`"e.g., design-large-task"` task-reset sentence) is not in Task 1's edit list, so grep-zero will not be satisfied after applying only the four listed edits; one soft clarification — record-formats Steps text lists three occurrences (L68/L213/L229) but the file has four (L193 also present, covered in Files block but absent from Steps checklist).

---

## Deduplicated defect list

### Blocker

**B-1 — plan-build L19 grep-zero miss** (Researcher)
Task 1 lists 4 edit sites in plan-build/SKILL.md but the file contains 5 occurrences of `design-large-task`. L19 (`"If any tasks exist from a previous skill (e.g., design-large-task)"`) is unaddressed. After applying only the listed edits, `grep -c design-large-task skills/plan-build/SKILL.md` returns 1, not 0. AC-4.1 gate fails.

---

### Important

**I-1 — AC-1.4: start-bootstrap insertion not explicit (Task 4 Step 3)** (Purist)
start-bootstrap currently has zero occurrences of `design-small-task`. The re-point requires an explicit insertion into the When to Call section; deleting the three design-large-task lines alone passes the absence check but fails the presence check (`grep -c design-small-task → ≥ 1`). Task 4 Step 3 does not state the insertion requirement plainly.

**I-2 — AC-1.5: util-design-partner-role presence check insufficient (Task 4 Step 4)** (Purist)
The file-wide `grep -c design-small-task skills/util-design-partner-role/SKILL.md → ≥ 1` passes even if the intro-line re-point at L9 is omitted, because L96 (an unrelated surviving sentence) already keeps the count positive. The verify step does not confirm the intro-line re-point landed.

**I-3 — AC-1.6: util-worktree presence check missing (Task 7 Step 4)** (Purist; also noted by Conservator as Finding 12 scope / Task 7 bundling observation)
Task 7 Step 4 carries `grep -c design-large-task skills/util-worktree/SKILL.md → 0` but no `grep -q design-small-task` presence assertion. AC-1.6's observable boundary requires both halves. The presence check is absent.

**I-4 — OD-1 substitution rule over-broad for record-formats lines 68 and 213 (Task 7 Step 3)** (Purist; also noted by Researcher as soft classification)
The plan's default (a) — "substitute a surviving skill name or placeholder" applied uniformly — produces false equivalence on L68 (template fixture inside Session Skill Versions example block: deleting the line is correct; substituting design-small-task creates a new false entry) and L213 (field-description parenthetical citing "design-large-task Solve Stage round": no surviving skill has a Solve Stage; deletion of the clause is correct). For L229 (YAML fixture field value) substitution is acceptable. For L193 (forward-facing enum) deletion of the entry is correct.

**I-5 — No cross-file phrasing consistency guard on canonical-sequence re-points** (Innovator)
Each of the four re-point tasks (Tasks 1, 4, 5, 6) gates on `grep -c design-large-task <file> → 0` — a presence check, not a consistency check. The plan has no guard ensuring the canonical-sequence phrase is worded identically across all four files. Tasks could independently produce differing phrasings that each pass their individual gates.

**I-6 — Task 8 description-sync work may be empty; real work is only a one-line frontmatter bump** (Innovator)
Task 8 is framed as a "description-text sync" of skill-index.md, but the two-place-sync rule (CLAUDE.md L86) targets setup-start/SKILL.md, not skill-index.md. Current skill-index entries for start-bootstrap and design-specify contain no design-large-task hits and describe those skills with independent prose summaries that do not mirror the description frontmatter. If no substantive skill-index edit is needed, Task 8's dependency on Tasks 4 and 5 evaporates and the task collapses to a one-line frontmatter bump.

**I-7 — Task 8 must-remain-green omits test-partner-role-overlay-section** (Conservator, Findings 7 and 14)
Task 8 edits skill-index.md. test-partner-role-overlay-section.sh greps skill-index.md for `'info-packet style overlay'` at line 56 (the util-design-partner-role catalog entry). Task 8's must-remain-green list does not include this test. If the implementer disturbs line 56 while editing lines ~25 and ~28, the test goes red without warning.

---

### Minor

**m-1 — Task 7 Step 3 does not warn about surgical precision near Session Skill Versions heading** (Conservator, Gap 1)
record-formats.md L68 is inside the Session Skill Versions block (L59–72). The plan's Step 3 says "scrub example-block occurrences (~L68)" without stating that L64 (`## Session Skill Versions`) and surrounding prose must survive. test-finish-write-records-provenance greps for `'Session Skill Versions'` in this file and fails if the heading is accidentally removed.

**m-2 — record-formats Steps text lists three occurrences; actual count is four** (Researcher, soft clarification)
Task 7 Steps text lists `~L68/L213/L229` (3 occurrences). The file has 4: L193 (stage-enum) is covered in the Files block description but absent from the Steps checklist. An implementer working only from the Steps list will miss L193.

**m-3 — Task 4 Step 3 prose says "the two version-assertion tests" — ambiguous count** (Pragmatist, Gap 1)
Two version-assertion files require edits (test-info-packet-style-version-bumps.sh and test-partner-role-overlay-section.sh). test-partner-role-discipline.sh is listed as must-remain-green but requires no edit. Step 3 prose says "two" without naming the files, creating a counting ambiguity for a fresh implementer.

**m-4 — OD-1 substitution in Task 7 leaves implementer an open micro-decision** (Pragmatist, Gap 2)
"Substitute a surviving skill name or a generic placeholder" does not specify which name. Should specify `design-small-task` (for the applicable occurrences) rather than leaving the choice open.

**m-5 — OD-4 gap comment violates standalone-documentation discipline (Task 7 Step 3)** (Purist)
The plan says to delete the upsize block and leave a one-line gap comment in the main body. Per standalone-documentation discipline, historical narration belongs in the commit message, not the main body. A gap comment in the body is narration about a removal, not a current-state declaration.

**m-6 — Task 4 does not state that design-small-task v0003 assertion in test-info-packet is intentionally unchanged** (Innovator)
test-info-packet-style-version-bumps.sh also asserts `design-small-task v0003` (L22). Task 4 updates the start-bootstrap and util-design-partner-role assertions but leaves L22 untouched. The plan does not say this is intentional.

**m-7 — OD-2 setup-start version bump is cargo-cult ritual** (Innovator)
CLAUDE.md L31 says bump on "meaningful change to the skill's behavior or contract." setup-start's SKILL.md body is untouched; the only edit is to a reference catalog file. No behavioral change. The bump satisfies AC-5.1 formally but not the spirit of the versioning rule.

**m-8 — TDD framing for Tasks 4–9 is verification discipline, not genuine red/green** (Innovator)
Tasks 1–3 bundle a file scrub with its pinning test in a genuine red/green cycle. Tasks 4–9 use grep-count-to-zero as a post-hoc verification boundary, not a failing test written before the implementation. The plan labels both patterns as TDD.

---

## Notable quotes

- Conservator: "FINDING 14 — test-partner-role-overlay-section greps skill-index.md and is NOT listed in Task 8's must-remain-green. This is a must-remain-green completeness gap. If the implementer edits skill-index.md in Task 8 and accidentally disturbs the util-design-partner-role entry (line 56), test-partner-role-overlay-section goes red."

- Innovator: "Task 8 as written risks the implementer spending time looking for description-sync work that does not exist. The plan should be explicit: if skill-index.md requires no substantive edit, the task collapses to a one-line frontmatter bump and can be merged into Task 7."

- Pragmatist: (OD-1 per-occurrence ruling) "One note: the plan says 'substitute a surviving skill name or a generic placeholder' for the example occurrences. This leaves the implementer to choose which substitution. Low-cost clarification: the plan should specify 'substitute `design-small-task`' (the natural surviving equivalent for historical-example purposes) rather than leaving it open."

- Purist: "The defect: start-bootstrap has zero design-small-task occurrences. The re-point edit must ADD design-small-task to the caller list — it cannot just delete the large-task references. If an implementer only deletes the three large-task occurrences (lines 6, 19, 92) without inserting 'design-small-task' into the When to Call section, the absence check passes but the presence check fails."

- Purist (AC-1.5 presence-check-theater finding): "util-design-partner-role already has design-small-task present (confirmed at line 96: the surviving small-task sentence in the private-precision note). The presence check will pass even if the re-point edit on line 9 is accidentally omitted — the surviving line 96 mention keeps the count ≥ 1 regardless. The presence check is insufficient to confirm the intro-line re-point landed."

- Purist (OD-1 per-occurrence ruling): "The flaw in default (a) as stated: 'substitute a surviving skill name' applied uniformly to lines 68 and 213 would introduce false equivalence. The plan must specify delete-not-substitute for those two lines."

- Purist (Task 8 degeneracy): (Not raised by Purist; see Innovator quote above — Innovator holds the Task 8 degeneracy finding. Purist's Task 8 finding is AC-1.7 acceptable-with-caveat.)

- Researcher (plan-build L19 blocker): "GREP-ZERO SHORTFALL — PLAN MISS: `grep -c design-large-task skills/plan-build/SKILL.md` = 5, not 4. The plan lists 4 edit sites but the file has 5 occurrences. The plan does not address L19 (task-reset sentence). After applying only the 4 listed edits, grep-zero will NOT be satisfied for plan-build."
