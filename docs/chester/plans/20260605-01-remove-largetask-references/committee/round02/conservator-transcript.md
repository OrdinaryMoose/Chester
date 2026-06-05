# Conservator Transcript — Round 02
# Sprint: 20260605-01-remove-largetask-references

## Lens

Constraints, Non-Goals, and regression-guard acceptance criteria. The conservator
job here: for each re-point site, identify the obligation the deleted sentence
carried and write a guard that proves the surviving `design-small-task` statement
still carries that same obligation after the edit.

---

## Constraints

These are the non-negotiable structural boundaries for the scrub. They come from
ratified sources (CLAUDE.md, standalone-documentation discipline, sprint directory
model). None are in dispute; they are stated here for spec completeness.

**Scrub and test edits land together.**
The four pinning tests (one deleted, three updated) must be committed in the
same atomic change as the skill edits they pin. Committing the skill scrub
before the test updates leaves the suite red; committing the test updates before
the skill scrub leaves the tests asserting a truth that doesn't yet exist. The
only safe order is a single commit that contains both. This is a structural
constraint, not a preference.

**Declarative docs — no historical narration in edited skill bodies.**
The standalone-documentation discipline is normative. After each edit, the
skill body must describe current state only. Phrases like "previously called by
design-large-task" or "originally used by" are prohibited in the main body of
any edited SKILL.md. Historical context belongs in commit messages or end-of-file
change logs, not the operational text.

**Stage by path — no git add -A or git add .**
The working tree carries unrelated staged and untracked entries from prior sprint
work. Every file touched by this scrub must be staged explicitly by name. No bulk
staging commands. This is CLAUDE.md staging discipline.

**Edits to live skills happen in the sprint worktree; working-dir artifacts stay
at the main-repo path.**
Skill SKILL.md edits land on the sprint branch inside the worktree.
Committee transcripts and design artifacts are written to
`docs/chester/working/20260605-01-remove-largetask-references/` at the main-repo
path (gitignored). These two paths must not be confused.

---

## Non-Goals

Explicit boundaries on what this sprint does not do. Each entry has a rationale
so the spec is self-contained.

**Restoring or replacing design-large-task.**
The removal is intentional and ratified. This sprint completes the removal; it
does not reverse it or substitute a new skill in the same slot.

**Touching frozen plans/ history.**
Archived sprint artifacts under `docs/chester/plans/` correctly describe the
state at their time of creation. They legitimately carry references to
`design-large-task`. They are out of scope — editing them would corrupt the
historical record.

**Authoring design-committee fork-policy rows.**
Path A defers this to a follow-up sprint. The current scrub deletes the dead
step-b rows and archives `test-ac-4-1`; it does not author net-new committee
rows or a replacement test. Authoring new policy rows is a separate correctness
surface with its own review needs.

**Re-pointing sample-string fixtures.**
`test-trailer-write`, `test-trailer-harvest`, and `test-decision-record-*` use
`design-large-task@vNNNN` as an arbitrary skill-name string to exercise trailer
and decision-record machinery. These tests are not coupled to the skill existing.
Re-pointing them is cosmetic and is out of scope for this scrub.

**Editing _archive/ contents.**
The archived skill directory and its supporting files are the designated home for
removed content. This sprint moves `agents/agent-industry-explorer.md` into
`_archive/` — but does not edit any file already inside `_archive/`. Archive
contents are frozen on entry.

---

## Regression-Guard Acceptance Criteria

These are observable tests that each re-point obligation survived the edit. Each
AC names the obligation that was being carried by the deleted sentence, then
states what must be true of the surviving text for the obligation to remain live.

**AC-RG-1: execute-write — worktree-creation obligation preserved.**

The deleted clause was: "by `design-large-task` at Archival or `design-small-task`
at Closure." The obligation: execute-write must document that the worktree is
created upstream in the design phase and inherited through design-specify and
plan-build unchanged.

Guard: After the edit, `skills/execute-write/SKILL.md` must contain text stating
that the worktree is created upstream during the design phase by `design-small-task`
at Closure, and that it is inherited through `design-specify` and `plan-build`
unchanged. A reader arriving at execute-write must be able to answer "who created
this worktree and when" from the skill text alone.

Mechanical check: `grep -q "design-small-task.*Closure\|Closure.*design-small-task" skills/execute-write/SKILL.md`

**AC-RG-2: design-specify — entry condition preserved.**

The deleted references named `design-large-task` as a valid upstream source of
the design brief. The obligation: design-specify must remain accessible when the
upstream brief came from any live design skill, and must still document the path
to the brief artifact.

Guard: After the edit, `skills/design-specify/SKILL.md` must (a) list
`design-small-task` as a valid upstream source in both the description frontmatter
and the preconditions section; (b) name the brief path
`{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`;
(c) list `design-small-task` (not `design-large-task`) in the Invoked-by line;
(d) reference only the surviving template path
`../design-small-task/references/design-brief-small-template.md` in the Reads
line.

Mechanical check:
`grep -q "design-small-task" skills/design-specify/SKILL.md`
`grep -vq "design-large-task" skills/design-specify/SKILL.md` (no surviving hits)
`grep -q "design-brief-small-template" skills/design-specify/SKILL.md`

**AC-RG-3: plan-build — cascade rule preserved, spec-compatibility statement
updated.**

Two obligations exist here. (a) The cascade rule: plan-build reads the
spec-stage ground-truth report when present. That rule must survive without the
large-task parenthetical. (b) The spec-compatibility statement: plan-build must
still assert that it reads spec documents regardless of which upstream design
skill produced the brief.

Guard for (a): `skills/plan-build/SKILL.md` must state that the cascade reads
the spec-stage report (from design-specify) when present, and that the ground-truth
report no longer comes from the design stage (the line at 153 that already says
this must remain or be simplified, not deleted).

Guard for (b): The spec-compatibility line must name `design-small-task` as the
upstream brief source and assert that design-specify normalizes it into the spec
contract. The phrase "regardless of whether the upstream brief came from" must
survive with only `design-small-task` in the list.

Guard for worktree context (line 43): The context note must state that plan-build
runs in a dedicated worktree created by `design-small-task` at Closure (not by
`design-large-task`).

Mechanical check: `grep -q "design-small-task" skills/plan-build/SKILL.md`

**AC-RG-4: start-bootstrap — callers list and description updated, session-meta
hash re-pointed.**

Two obligations. (a) The When-to-Call list must name the correct callers.
(b) The session-meta description must name the correct skills whose commit hashes
are recorded.

Guard for (a): `skills/start-bootstrap/SKILL.md` When-to-Call section must name
`design-small-task` (not `design-large-task`) as the caller for fresh sprints.
The "Always" entry must reference `design-small-task`.

Guard for (b): The session-meta description (line 92 area) must replace
`design-large-task SKILL.md files` with `design-small-task SKILL.md files` —
or, if the session-meta script is updated to hash a different skill, the prose
must match the actual script behavior.

Note: the session-meta script (`write-session-metadata.sh`) runs `git log -1
--format=%H -- skills/design-large-task/SKILL.md`. On a deleted path, git log
returns the last commit that touched the file before deletion — not a failure or
null. The `2>/dev/null || echo ''` guard converts truly empty output to null. The
`designLargeTask` JSON field gets a valid historical hash or null. Not an error;
not a broken build.

**Resolved by purist Q&A (round 02):** the script behavior is a documentation
gap, not a behavioral bug. The session-meta JSON is archival and not read by any
other script or skill at runtime. AC-RG-4 requires only the documentation AC:
remove the prose reference to `design-large-task SKILL.md files` in start-bootstrap
line 92. Updating the script field name (`designLargeTask` → `designSmallTask`)
and log-query path is deferred to a follow-up improvement sprint.

Mechanical check: `grep -q "design-small-task" skills/start-bootstrap/SKILL.md`
`grep -vq "design-large-task" skills/start-bootstrap/SKILL.md`

**AC-RG-5: util-design-partner-role — the "both design skills read this file"
obligation preserved.**

The deleted sentence named both design skills as importers of the voice rules.
The obligation: the skill must still be discoverable as the shared voice-rules
file for the surviving design skill.

Guard: After the edit, `skills/util-design-partner-role/SKILL.md` description
frontmatter must name `design-small-task` as the skill that reads this file. The
body intro must state that `design-small-task` reads this file. The
private-precision note (line 96 area) must be simplified to describe how
`design-small-task` handles private precision (without the `capture_thought`
comparison, which described `design-large-task`'s unique behavior).

Mechanical check: `grep -q "design-small-task" skills/util-design-partner-role/SKILL.md`
`grep -vq "design-large-task" skills/util-design-partner-role/SKILL.md`

**AC-RG-6: util-worktree — REQUIRED caller obligation preserved.**

The deleted entry named `design-large-task` as a REQUIRED caller at Archival.
The obligation: util-worktree must still document who calls it and when — the
REQUIRED constraint must remain for the surviving caller.

Guard: After the edit, `skills/util-worktree/SKILL.md` Called-by list must name
`design-small-task` at Closure as REQUIRED (the word "REQUIRED" must survive
with `design-small-task` as the actor). `execute-write` and "Any skill needing
isolated workspace" entries are unchanged and must remain.

Mechanical check: `grep -q "design-small-task.*REQUIRED\|REQUIRED.*design-small-task" skills/util-worktree/SKILL.md`

---

## Test Lockstep Guards

These ACs cover the four pinning tests specifically.

**AC-TS-1: test-plan-build-heuristic — large-task grep removed, cascade
structure still asserted.**

Path A removes the assertion that `plan-build` references `design-large-task`.
Guard: After the test edit, `tests/test-plan-build-heuristic.sh` must (a) not
contain `grep.*design-large-task` as a pass/fail assertion; (b) still assert
that `plan-build` references `design-specify` as the invoker (the canonical
sequence assertion); (c) still assert plan-attack scope-narrowing presence. The
test must exit 0 against the scrubbed skill file.

Mechanical check: `bash tests/test-plan-build-heuristic.sh` exits 0 after both
the skill edit and the test edit are applied.

**AC-TS-2: test-artifact-schema — large-task dropped from producer loop, suite
still green.**

Guard: After the edit, `tests/test-artifact-schema.sh` producer loop must not
include `design-large-task`. The loop must still assert all surviving producers
(`design-small-task`, `design-specify`, `plan-build`, `execute-write`,
`finish-write-records`). The test must exit 0 against the scrubbed schema.

Mechanical check: `bash tests/test-artifact-schema.sh` exits 0.

**AC-TS-3: test-artifact-schema-provenance — large-task dropped from stamping
loop, suite still green.**

Guard: After the edit, `tests/test-artifact-schema-provenance.sh` stamping-skill
loop must not include `design-large-task`. All surviving skills must remain in
the loop. The test must exit 0 against the scrubbed schema.

Mechanical check: `bash tests/test-artifact-schema-provenance.sh` exits 0.

**AC-TS-4: test-ac-4-1-fork-policy-pole-rows — archived alongside the 27
design-large-task tests.**

Path A: this test is archived to `_archive/design-large-task/tests/`, not
updated. Guard: after the sprint, `tests/test-ac-4-1-fork-policy-pole-rows.sh`
must not exist at `tests/`. It must exist at
`_archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh`. The
full test suite (the for-loop over `tests/test-*.sh`) must not invoke it.

Mechanical check: `[ ! -f tests/test-ac-4-1-fork-policy-pole-rows.sh ]` exits 0.
`[ -f _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh ]` exits 0.

---

## Peer Question

Sending to purist: the session-meta behavioral question (AC-RG-4 guard b).

The `write-session-metadata.sh` script hashes commit refs for `util-design-partner-role`
and `design-large-task` SKILL.md files. After the scrub, `design-large-task` SKILL.md
no longer exists at its live path. The spec needs to decide: does the script get
updated this sprint (the skill file it hashes is a behavioral dependency, not just
documentation), or is updating the script out of scope (the session-meta JSON
is a retrospective artifact and a null hash for a removed skill is acceptable)?

The purist lens is best positioned to say whether a skill file that hashes a
dead path is a behavioral bug requiring a fix in this sprint, or a retrospective
artifact whose staleness is tolerable and deferred.

---

## Summary

Constraints: four, all normative. Non-Goals: five, each with rationale.
Regression-guard ACs: six re-point guards (RG-1 through RG-6) plus four test
lockstep guards (TS-1 through TS-4). Every guard names the original obligation,
the required surviving text, and a mechanical check command.

The session-meta behavioral question (write-session-metadata.sh hashing a dead
path) is flagged as an open question for the purist. Its resolution determines
whether AC-RG-4 needs a companion implementation AC or just a documentation AC.
