# Conservator Transcript — Round 04 (Attack)
# Sprint: 20260605-01-remove-largetask-references

## Lens

Red-suite hunting. Walk each of the 10 commits in isolation and look for a
state where the suite is red after that commit lands but before the next.
Also: missed lockstep pairs, hidden ordering dependencies, must-remain-green
completeness. All findings grounded in actual test file reads and a confirmed
baseline (all 26 tests pass at HEAD 5a800e5).

---

## Confirmed Baseline

All 26 tests pass at HEAD. The four currently-passing tests the spec calls
"pinning tests" are among them: test-plan-build-heuristic, test-artifact-schema,
test-artifact-schema-provenance, test-ac-4-1-fork-policy-pole-rows.

---

## RED-SUITE WALK — Commit by Commit

**After Task 1 (plan-build scrub + test-plan-build-heuristic + test-stamping-plan-build):**

Three files change atomically. After landing:
- test-plan-build-heuristic: plan says remove lines 62-68 (the design-large-task
  cascade assertion). The other assertions (smell heuristic, smell-triggers cite,
  ground-truth reference, design-specify invoker) all survive. The test exits 0.
- test-stamping-plan-build: version assertion updated v0005→v0006 in the same
  commit. Exits 0.
- All other tests: none grep plan-build for design-large-task specifically.
  test-artifact-schema and test-artifact-schema-provenance do not touch plan-build.

VERDICT: suite green after Task 1.

**After Task 2 (util-artifact-schema scrub + test-artifact-schema +
test-artifact-schema-provenance):**

Three files change atomically. The version bump (v0002→v0003) and both test
edits (producer loop + stamping loop + version assertion) are in the same commit.
- test-artifact-schema: design-large-task removed from producer loop. Test exits 0.
- test-artifact-schema-provenance: design-large-task removed from stamping loop
  AND version assertion updated v0002→v0003. Both changes in same commit. Exits 0.
- Stamping tests that cite util-artifact-schema by string presence
  (test-stamping-design-specify, test-stamping-plan-build, test-stamping-execute-
  write, test-stamping-design-small-task): they grep for `util-artifact-schema`
  as a string in the respective SKILL.md — they do not grep the schema file itself.
  Unchanged. All exit 0.

VERDICT: suite green after Task 2.

**After Task 3 (fork-policy row delete + test-ac-4-1 archived):**

Two changes: docs/fork-policy.md rows 1a-1g deleted; test-ac-4-1 moved to
_archive via git mv. After landing:
- test-ac-4-1-fork-policy-pole-rows.sh: gone from tests/ (git mv removed it from
  the suite glob `tests/test-*.sh`). No longer invoked. Not a failure — it simply
  does not run.
- No other test greps fork-policy.md. No other test would fire on this change.

VERDICT: suite green after Task 3.

**After Task 4 (start-bootstrap + util-design-partner-role + three test edits):**

Five files change atomically: two SKILL.md files, test-info-packet-style-version-
bumps, test-partner-role-overlay-section, and — implicitly — no edit to
test-partner-role-discipline (it is must-remain-green passively).

FINDING 1 — two pins, both covered. test-info-packet-style-version-bumps pins
both util-design-partner-role at v0004 AND start-bootstrap at v0002 in a single
run. The plan updates both assertions (L20: v0004→v0005; L21: v0002→v0003) in
the same commit. Confirmed: both pins covered in one file edit. No intermediate
red state.

FINDING 2 — test-partner-role-overlay-section second pin confirmed. This test
pins util-design-partner-role at `^version: v0004$` (line 32). It is correctly
listed in Task 4's Files block with the edit `v0004→v0005`. Confirmed covered.

FINDING 3 — test-partner-role-overlay-section also greps skill-index.md. Line
37-38 of the test: `grep -q 'info-packet style overlay' "$INDEX"` where INDEX
is `skills/setup-start/references/skill-index.md`. Task 4 does NOT modify skill-
index.md (that is Task 8). The phrase 'info-packet style overlay' is at skill-
index line 56 (the util-design-partner-role catalog entry). Task 8 syncs
start-bootstrap (~L25) and design-specify (~L28) entries — different lines.

Risk: an implementer editing skill-index.md in Task 8 could accidentally disturb
line 56 and break test-partner-role-overlay-section. This is a human-error
vector, not a structural plan error. The plan should explicitly warn Task 8 not
to touch the util-design-partner-role entry at line 56.

After Task 4, test-partner-role-overlay-section passes (skill-index untouched,
partner-role version updated). test-partner-role-discipline passes (C1/C2
sections and Before/After blocks not touched by the scrub). test-info-packet
passes (both pins updated).

VERDICT: suite green after Task 4. One warning for Task 8 implementer.

**After Task 5 (design-specify scrub + test-stamping-design-specify):**

Two files change atomically.
- test-stamping-design-specify: version assertion v0003→v0004 updated in same
  commit. Exits 0.
- test-no-archived-refs: greps skills/*/SKILL.md for "design-figure-out" only.
  Unaffected. Exits 0.

VERDICT: suite green after Task 5.

**After Task 6 (execute-write scrub + test-stamping-execute-write):**

Two files change atomically.
- test-stamping-execute-write: version assertion v0007→v0008 updated. Exits 0.

VERDICT: suite green after Task 6.

**After Task 7 (util-worktree + agent archive + two reference files):**

Four files modified, one agent moved. No version-pinning test exists for
util-worktree. No test directly greps design-brief-small-template. But:

FINDING 4 — test-finish-write-records-provenance greps record-formats.md
directly. The test is listed in Task 7's must-remain-green. The test checks:
`grep -q 'Session Skill Versions' "$FORMATS"`. Task 7 scrubs design-large-task
occurrences from record-formats.md at lines 68, 193, 213, 229. Line 64 contains
the "## Session Skill Versions" heading. Line 68 contains the design-large-task
provenance example comment, which is inside the Session Skill Versions block.

Risk: if the implementer deletes lines 64-68 as a block (instead of surgically
removing only L68), the "Session Skill Versions" heading disappears and the test
fails. The plan's Step 3 says "delete the stage-enum entry (~L193); scrub the
example-block occurrences (~L68/L213/L229)" — it does not call out that L64-67
("## Session Skill Versions" and its surrounding prose) must be preserved while
removing L68.

The plan lists test-finish-write-records-provenance in must-remain-green, which
is correct. But the task description does not warn about the surgical precision
required near L64-68. This is a real implementation risk. Recommend adding an
explicit note to Task 7 Step 3: "L68 is inside the Session Skill Versions block
(L59-72); remove only L68, not the surrounding block."

VERDICT: suite green after Task 7 IF the implementer is surgical. The plan's
description is not precise enough to guarantee this. Flag as a plan gap.

**After Task 8 (setup-start skill-index sync + version bump):**

Two files change: skill-index.md (description sync for start-bootstrap and
design-specify entries) and setup-start/SKILL.md (version frontmatter only).

FINDING 5 — test-start-cleanup forbids design-specify in setup-start SKILL.md
body. The plan explicitly warns about this: "Do not touch the SKILL.md body."
The only body change is the version frontmatter. test-start-cleanup checks for
the string "design-specify" in the SKILL.md body — not in frontmatter. The
version line does not contain "design-specify." Safe.

FINDING 6 — no version-pinning test exists for setup-start. Confirmed: no
test-stamping-setup-start.sh exists. The setup-start bump (v0001→?) has no
paired test to update. The plan correctly notes this (OD-2). No lockstep
required for the bump itself. Suite stays green.

FINDING 7 — test-partner-role-overlay-section greps skill-index.md for 'info-
packet style overlay' (line 56). Task 8 edits skill-index.md. If the edit
accidentally removes or alters line 56, test-partner-role-overlay-section fails.
The plan does not warn about this. This is the same risk flagged in Finding 3 —
it materializes at Task 8, not Task 4. The plan's Task 8 must include an explicit
constraint: the util-design-partner-role entry at skill-index line 56 must not
be modified. Only lines ~25 (start-bootstrap) and ~28 (design-specify) are in
scope.

VERDICT: suite green after Task 8 IF the implementer does not touch line 56.
The plan does not make this constraint explicit. Flag as a plan gap.

**After Task 9 (docs/instructions.md rewrite):**

One file modified. No test pins instructions.md. No other test greps it.

VERDICT: suite green after Task 9 trivially.

**After Task 10 (capstone):**

Full suite run. If all prior tasks landed correctly, all 26 tests (minus the
archived test-ac-4-1, so 25 tests) pass.

---

## MISSED LOCKSTEP CHECK

Walk the version bumps in AC-5.1 against the plan's test pairing:

| Skill | Bump | Test that pins it | Task | Same commit? |
|---|---|---|---|---|
| plan-build v0005→v0006 | T1 | test-stamping-plan-build | T1 | YES |
| util-artifact-schema v0002→v0003 | T2 | test-artifact-schema-provenance (version assertion L36) | T2 | YES |
| start-bootstrap v0002→v0003 | T4 | test-info-packet-style-version-bumps (L21) | T4 | YES |
| util-design-partner-role v0004→v0005 | T4 | test-info-packet-style-version-bumps (L20) + test-partner-role-overlay-section (L32) | T4 | YES — both |
| design-specify v0003→v0004 | T5 | test-stamping-design-specify | T5 | YES |
| execute-write v0007→v0008 | T6 | test-stamping-execute-write | T6 | YES |
| util-worktree v0001→v0002 | T7 | none | T7 | N/A — no pinning test |
| setup-start v0001→v0002 | T8 | none | T8 | N/A — no pinning test |

VERDICT: no missed lockstep pair. Every version bump with a pinning test lands
in the same task as that test's edit. The table is complete.

---

## ORDERING HAZARDS

**Stated ordering:** Tasks 1-7 and 9 have no required ordering. Task 8 depends
on Tasks 4 and 5. Task 10 is last.

**Hidden dependency check:**

Task 8 depends on Tasks 4 and 5 "reads their finalized descriptions." This is a
content dependency (the implementer needs to know the new start-bootstrap and
design-specify descriptions before updating skill-index). If Tasks 4 and 5 have
not landed when Task 8 executes in a subagent context, the implementer reads
stale descriptions. The plan correctly states this dependency.

FINDING 8 — Task 8 must also land BEFORE Task 10. This is implicit in "Task 10
is last and depends on all others" but is not explicitly called out in Task 8.
No structural concern — the plan's Ordering section covers it.

FINDING 9 — No ordering dependency between Task 7 and any other task was
missed. The design-brief-small-template and record-formats edits have no content
dependencies on any other task's output.

FINDING 10 — Test suite ordering during execution is not a concern. The plan
runs each task's tests immediately after that task's commit (Steps 4 in each
task). The capstone (Task 10) runs the full suite. No hidden ordering within
the test suite itself.

VERDICT: no hidden dependencies beyond the stated Task 8 → after Tasks 4 and 5.

---

## MUST-REMAIN-GREEN COMPLETENESS

Walk each task and check for unlisted tests that grep the touched files:

**Task 1 (plan-build/SKILL.md):**
Listed: test-plan-build-heuristic, test-stamping-plan-build.
Unlisted but checked: test-artifact-schema (does not grep plan-build SKILL.md —
greps util-artifact-schema only). test-artifact-schema-provenance (same). No gap.

**Task 2 (util-artifact-schema/SKILL.md):**
Listed: test-artifact-schema, test-artifact-schema-provenance.
Unlisted but safe: test-stamping-design-specify, test-stamping-plan-build,
test-stamping-execute-write, test-stamping-design-small-task all grep the
respective SKILL.md for the STRING "util-artifact-schema" (not the schema file).
These are unaffected. No gap.

**Task 3 (fork-policy.md, test archive):**
Listed: none (archived test leaves suite). Correct — no other test greps
fork-policy.md. Confirmed: grep -rn "fork-policy" tests/ shows only test-ac-4-1.

**Task 4 (start-bootstrap/SKILL.md, util-design-partner-role/SKILL.md):**
Listed: test-info-packet-style-version-bumps, test-partner-role-overlay-section,
test-partner-role-discipline.
FINDING 11 — test-partner-role-overlay-section also greps skill-index.md. The
test fires on skill-index content, not just the SKILL.md. Task 4 does not edit
skill-index.md, so the test passes. But Task 8's skill-index edit could break
it retroactively if line 56 is disturbed. This is correctly a Task 8 concern,
not a Task 4 gap. No gap in Task 4's must-remain-green list.

**Task 5 (design-specify/SKILL.md):**
Listed: test-stamping-design-specify, test-no-archived-refs.
test-no-archived-refs greps all skills/*/SKILL.md for "design-figure-out" — the
design-specify scrub does not add "design-figure-out" — no gap.

**Task 6 (execute-write/SKILL.md):**
Listed: test-stamping-execute-write.
No other test greps execute-write SKILL.md specifically. Confirmed by grep scan.
No gap.

**Task 7 (util-worktree/SKILL.md, agent move, design-brief-small-template,
record-formats):**
Listed: test-stamping-design-small-task, test-finish-write-records-provenance.

FINDING 12 — test-finish-write-records-provenance greps record-formats.md (not
just the SKILL.md). The plan correctly includes this test. The plan's Step 4
verify block runs this test. However, the plan's Step 3 description does not
warn about surgical precision near the Session Skill Versions heading. This is a
description gap, not a must-remain-green completeness gap. The test IS listed.

FINDING 13 — test-stamping-design-small-task greps design-small-task/SKILL.md,
not the template reference file. Confirmed: this test stays green because Task 7
only touches the template reference file, not the SKILL.md. Correct.

No unlisted test greps util-worktree SKILL.md, agent-industry-explorer,
design-brief-small-template, or record-formats.md beyond those already listed.
Confirmed by grep scan.

**Task 8 (setup-start/SKILL.md, skill-index.md):**
Listed: test-start-cleanup.

FINDING 14 — test-partner-role-overlay-section greps skill-index.md and is NOT
listed in Task 8's must-remain-green. This is a must-remain-green completeness
gap. If the implementer edits skill-index.md in Task 8 and accidentally disturbs
the util-design-partner-role entry (line 56), test-partner-role-overlay-section
goes red. The test must be added to Task 8's must-remain-green list with the
warning about line 56.

**Task 9 (docs/instructions.md):**
Listed: none. Correct — no test greps instructions.md. No gap.

**Task 10 (capstone):**
Listed: entire suite. Correct.

---

## SUMMARY OF FINDINGS

**Hard bugs (would cause red suite if not fixed):**

None found that are structural (i.e., where the plan's lockstep pairing is
wrong). All seven version bumps with pinning tests are correctly paired in the
same task.

**Plan gaps (implementation risks that the plan does not guard against explicitly):**

GAP 1 (Task 7, Step 3): record-formats.md scrub near Session Skill Versions
heading. Line 68 is inside the Section Skill Versions block (L59-72). The plan
says "scrub example-block occurrences (~L68)" without warning the implementer
that L64 ("## Session Skill Versions") must survive. Add to Task 7 Step 3:
"Remove only L68 — the surrounding Session Skill Versions block (L59-67, L69-72)
must not be disturbed; test-finish-write-records-provenance greps for
'Session Skill Versions' in this file."

GAP 2 (Task 8, Files/Step 3 + must-remain-green): skill-index.md edit risks
disturbing the util-design-partner-role entry at line 56. Two sub-gaps:
(a) Must-remain-green does not list test-partner-role-overlay-section. Add it.
(b) Step 3 does not explicitly state which lines to edit. Add: "Edit only the
start-bootstrap entry (~L25) and design-specify entry (~L28). The util-design-
partner-role entry (~L56) must not be modified — test-partner-role-overlay-
section greps this line for 'info-packet style overlay'."

**Open Decisions (not plan bugs — designer rulings needed):**

OD-1: record-formats example-block treatment (default (a) = scrub all). No
change needed to plan structure — default is clear and the plan implements it.

OD-2: setup-start version bump on reference-only change. Default is to bump.
Structural concern: no test pins this version, so the bump is safe but produces
a version increment with no test coverage. Not a plan bug.

OD-3: reference-file parents not bumped. Plan follows spec's AC-5.1 list
explicitly. Correct.

OD-4: design-brief-small-template upsize destination deleted without replacement.
Plan implements this with a one-line gap comment. Correct.

---

## CONSERVATOR VERDICT

The plan is structurally sound. No commit leaves the suite red by construction.
Two plan-description gaps (Gaps 1 and 2) are implementation risks that could
cause a red suite if an implementer is imprecise — they are not structural errors
in the lockstep pairing. Both gaps should be addressed by adding explicit
constraints to the relevant task steps and must-remain-green lists before
execute-write begins.

Recommendation: patch Task 7 Step 3 and Task 8 Files/Step 3/must-remain-green
with the language above, then proceed to execute.
