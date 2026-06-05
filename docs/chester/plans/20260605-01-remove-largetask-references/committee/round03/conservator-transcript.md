# Conservator Transcript — Round 03
# Sprint: 20260605-01-remove-largetask-references

## Lens

Regression safety and existing-structure preservation. This round: derive
lockstep commit pairings, must-remain-green lists per task, ordering hazards,
and the capstone dependency. Ground all claims in the actual test files, not
the spec's AC enumeration.

---

## FINDING: The Spec Undercounts the Pinning Tests

The spec (and the team-lead framing) names four pinning tests. The actual repo
has **seven** tests that pin version numbers or skill names for skills this
sprint modifies. All seven must move in lockstep with their respective scrubs.
The extra three are:

- `test-stamping-design-specify.sh` — pins `design-specify` at `v0003`
- `test-stamping-plan-build.sh` — pins `plan-build` at `v0005`
- `test-stamping-execute-write.sh` — pins `execute-write` at `v0007`
- `test-info-packet-style-version-bumps.sh` — pins `util-design-partner-role`
  at `v0004` AND `start-bootstrap` at `v0002`

The spec's AC-5.1 bumps all of these skills. The moment a version bump lands
without the matching test update, that stamping test goes red. There is no
grace period — these tests run the full suite check at AC-6.1.

**Consequence for plan structure:** every task that bumps a skill version must
update its pinning stamping test in the same commit. This is the same lockstep
rule as the four named tests — it just applies to seven tests, not four.

---

## Lockstep Commit Pairings

Each pairing is a single commit boundary. Files listed together must land
together; splitting them leaves a red suite.

### Pairing 1 — plan-build scrub + cascade simplification + heuristic test
(AC-1.3 + AC-4.1 + AC-5.1 partial + test-stamping-plan-build update)

Files in single commit:
- `skills/plan-build/SKILL.md` — canonical-sequence drop, cascade simplification,
  spec-compat note update, version v0005 → v0006
- `tests/test-plan-build-heuristic.sh` — remove lines 62–68 (design-large-task
  cascade assertion block); all other assertions survive
- `tests/test-stamping-plan-build.sh` — update version pin v0005 → v0006

Rationale: `test-plan-build-heuristic.sh` greps plan-build for
`design-large-task` (line 65). After the scrub, that grep fails → test red.
`test-stamping-plan-build.sh` pins `v0005` (line 15). After the version bump,
that pin fails → test red. Both fail the moment plan-build is touched; both
must land in the same commit.

### Pairing 2 — util-artifact-schema delete + schema tests
(AC-2.1 + AC-4.2 + AC-4.3 + AC-5.1 partial)

Files in single commit:
- `skills/util-artifact-schema/SKILL.md` — delete design-row large-task
  producer half, template-path note, thinking row, process row, stamping-list
  entry; version v0002 → v0003
- `tests/test-artifact-schema.sh` — drop `design-large-task` from producer
  loop (line 17)
- `tests/test-artifact-schema-provenance.sh` — drop `design-large-task` from
  stamping-skill loop (line 24); update version assertion v0002 → v0003

Rationale: `test-artifact-schema.sh` requires `design-large-task` in the
producer list (line 17–21). After the delete, it fails. `test-artifact-
schema-provenance.sh` requires `design-large-task` in the stamping loop
(line 24) AND asserts version v0002 (line 36). After the delete + bump, both
assertions fail. All three files must be in the same commit.

Note: AC-4.3 observable boundary says the version assertion must update from
v0002 → v0003. The spec correctly identifies this as a three-way dependency:
schema scrub + version bump + test version update. Pairing 2 handles all three.

### Pairing 3 — fork-policy row delete + test archive
(AC-2.7 + AC-4.4)

Files in single commit:
- `docs/fork-policy.md` — delete rows 1a–1g (lines 14–20); table header and
  subsequent rows intact
- `tests/test-ac-4-1-fork-policy-pole-rows.sh` — move to
  `_archive/design-large-task/tests/` (git mv, not copy)

Rationale: `test-ac-4-1-fork-policy-pole-rows.sh` greps fork-policy.md for
`chester:design-large-task-step-b-{pole}`. The moment those rows are deleted,
the test fails. The test must be archived (removed from `tests/`) in the same
commit. Git mv preserves history; the test is gone from the suite's glob
(`tests/test-*.sh`).

### Pairing 4 — start-bootstrap scrub + version bump + info-packet test
(AC-1.4 + AC-2.4 + AC-5.1 partial + test-info-packet partial)

Files in single commit:
- `skills/start-bootstrap/SKILL.md` — description caller list update,
  when-to-call update, dead SKILL.md path prose removal (line ~92),
  version v0002 → v0003
- `tests/test-info-packet-style-version-bumps.sh` — update pin for
  start-bootstrap: v0002 → v0003

Rationale: `test-info-packet-style-version-bumps.sh` pins start-bootstrap at
v0002 (line 21). After the version bump, it fails. Must land together.

### Pairing 5 — util-design-partner-role scrub + version bump + info-packet test
(AC-1.5 + AC-2.2 + AC-5.1 partial + test-info-packet partial)

Files in single commit:
- `skills/util-design-partner-role/SKILL.md` — intro line simplification
  (AC-1.5), capture-thought sentence delete (AC-2.2), version v0004 → v0005
- `tests/test-info-packet-style-version-bumps.sh` — update pin for
  util-design-partner-role: v0004 → v0005

Note: `test-info-packet-style-version-bumps.sh` pins TWO skills (start-bootstrap
AND util-design-partner-role). If Pairings 4 and 5 land in separate commits,
the test will fail in the intermediate state (after one bump but before the
other). Options:
(a) Combine Pairings 4 and 5 into one commit — both skills + test update land
    together. Cleanest. Recommended.
(b) Keep them separate and accept that the test is briefly red between the two
    commits. This is acceptable only if the capstone (AC-6.1) runs after both
    land — which it does by construction. But it means the intermediate state
    fails the "suite stays green throughout" constraint in the spec.

**Recommendation: combine Pairings 4 and 5 into a single commit.**

Combined commit files:
- `skills/start-bootstrap/SKILL.md`
- `skills/util-design-partner-role/SKILL.md`
- `tests/test-info-packet-style-version-bumps.sh` (one update covers both pins)

### Pairing 6 — design-specify scrub + version bump + stamping test
(AC-1.2 + AC-2.3 + AC-5.1 partial + test-stamping-design-specify update)

Files in single commit:
- `skills/design-specify/SKILL.md` — entry condition, standalone note,
  invoked-by, dead template path in Reads; version v0003 → v0004
- `tests/test-stamping-design-specify.sh` — update version pin v0003 → v0004

### Pairing 7 — execute-write scrub + version bump + stamping test
(AC-1.1 + AC-5.1 partial + test-stamping-execute-write update)

Files in single commit:
- `skills/execute-write/SKILL.md` — worktree-creation parenthetical,
  canonical-sequence mention; version v0007 → v0008
- `tests/test-stamping-execute-write.sh` — update version pin v0007 → v0008

---

## Must-Remain-Green Per Task

For each task, the tests that must stay green after it lands. Sorted by which
tests are most at risk.

**Task touching `skills/plan-build/SKILL.md`:**
- `test-plan-build-heuristic.sh` — EDITED in this commit (see Pairing 1)
- `test-stamping-plan-build.sh` — EDITED in this commit
- `test-artifact-schema.sh` — not directly coupled; stays green
- `test-artifact-schema-provenance.sh` — not directly coupled; stays green

**Task touching `skills/util-artifact-schema/SKILL.md`:**
- `test-artifact-schema.sh` — EDITED in this commit (see Pairing 2)
- `test-artifact-schema-provenance.sh` — EDITED in this commit
- `test-stamping-design-specify.sh` — cites util-artifact-schema presence; not version-coupled to this file; stays green
- `test-stamping-plan-build.sh` — same; stays green
- `test-stamping-execute-write.sh` — same; stays green
- `test-stamping-design-small-task.sh` — same; stays green

**Task touching `docs/fork-policy.md`:**
- `test-ac-4-1-fork-policy-pole-rows.sh` — ARCHIVED in this commit (see Pairing 3)

**Task touching `skills/start-bootstrap/SKILL.md`:**
- `test-info-packet-style-version-bumps.sh` — EDITED in this commit (see combined Pairing 4+5)
- `test-start-cleanup.sh` — greps setup-start, not start-bootstrap; stays green unless setup-start is touched in the same commit

**Task touching `skills/util-design-partner-role/SKILL.md`:**
- `test-info-packet-style-version-bumps.sh` — EDITED in this commit
- `test-partner-role-discipline.sh` — greps for C1/C2 sections, Before/After blocks, opinion markers; does NOT pin version; must stay green. The scrub only removes the intro line's large-task reference and the capture-thought sentence — neither of those is asserted by this test.
- `test-partner-role-overlay-section.sh` — greps for overlay section headings; does NOT pin version; must stay green. The scrub does not touch overlay section headings.

**Task touching `skills/design-specify/SKILL.md`:**
- `test-stamping-design-specify.sh` — EDITED in this commit (see Pairing 6)
- `test-no-archived-refs.sh` — greps all skills/*/SKILL.md for "design-figure-out"; does not check for design-large-task; stays green after scrub.

**Task touching `skills/execute-write/SKILL.md`:**
- `test-stamping-execute-write.sh` — EDITED in this commit (see Pairing 7)

**Task touching `skills/util-worktree/SKILL.md`:**
- No tests currently pin this file's version number. Check: no `test-stamping-util-worktree.sh` exists. The scrub is safe to land without a paired test update. Version bump still required per AC-5.1.

**Task touching `skills/setup-start/SKILL.md` (AC-1.7 two-place sync):**
- `test-start-cleanup.sh` — CRITICAL HAZARD. This test asserts that `design-specify` does NOT appear in `skills/setup-start/SKILL.md`. If AC-1.7 updates setup-start body text to add a `design-specify` description entry, this test goes red. AC-1.7 must only update `skills/setup-start/references/skill-index.md` (the reference file) — not the SKILL.md body. Confirm before touching setup-start.

**Task archiving `agents/agent-industry-explorer.md`:**
- No tests currently grep agents/ directly for this file name. Safe.

**Task touching `docs/instructions.md`:**
- No tests currently pin instructions.md content. Safe.

**Tasks touching `skills/design-small-task/references/design-brief-small-template.md` and `skills/finish-write-records/references/record-formats.md`:**
- `test-finish-write-records-provenance.sh` — greps skills/finish-write-records/SKILL.md (not record-formats.md); stays green.
- `test-stamping-design-small-task.sh` — greps design-small-task/SKILL.md, not the template reference; stays green.

---

## Ordering Hazards

Three ordering dependencies where the wrong sequence leaves tests red:

**Hazard 1 — util-artifact-schema version bump must be in the same commit as
the provenance test update.**

`test-artifact-schema-provenance.sh` asserts `version: v0002` (line 36). The
version bump (v0002 → v0003) is part of AC-5.1. If the schema scrub (AC-2.1)
and the version bump (AC-5.1) land in separate commits, the provenance test
fails in the intermediate state. AC-4.3's observable boundary explicitly calls
this out: "the schema version assertion updated to the bumped value (v0002 →
v0003) so it matches AC-5.1." All three must be one commit: schema scrub +
version bump + test update. This is fully captured in Pairing 2.

**Hazard 2 — test-info-packet-style-version-bumps.sh pins two skills; both
bumps must land together.**

As noted in Pairing 4+5: the test checks both util-design-partner-role (v0004)
and start-bootstrap (v0002) in a single run. If one skill is bumped before the
other, the test fails between commits. The combined Pairing 4+5 eliminates this
hazard. If the plan author chooses to separate them, the plan must note that the
suite is briefly red between those two tasks and the executor must run the full
suite only after both tasks are committed.

**Hazard 3 — setup-start two-place sync must not add design-specify to the
SKILL.md body.**

`test-start-cleanup.sh` fails if `design-specify` appears anywhere in
`skills/setup-start/SKILL.md`. AC-1.7 requires keeping start-bootstrap and
design-specify skill-index entries in lockstep with their updated descriptions.
The safe path: update `skills/setup-start/references/skill-index.md` only
(a reference file, not the SKILL.md body). The test does not grep reference
files. If the plan author routes AC-1.7 edits to setup-start/SKILL.md instead
of skill-index.md, the test goes red immediately.

---

## Capstone Ordering

AC-6.1 (`for t in tests/test-*.sh; do bash "$t"; done`) is the last task
by definition. Its dependency chain:

- All seven lockstep pairings must be committed before AC-6.1 runs.
- The test-ac-4-1 archive must be committed (it's gone from `tests/`) before
  AC-6.1 runs (otherwise the suite still invokes it, which would fail against
  the scrubbed fork-policy).
- Version bumps in the stamping tests must all be committed before AC-6.1.

AC-6.1 is not just a final check — it is the sole gate that proves no
intermediate state left a latent failure. It must be listed as a dependency-
on-all in the plan, not just as the last numbered task.

---

## Recommended Task Grouping (conservator view)

Group by lockstep commit boundary, not by AC category. Each group = one commit.

**Group A (Pairing 1):** plan-build scrub + test-plan-build-heuristic +
test-stamping-plan-build. Implements: AC-1.3, AC-4.1, AC-5.1 (plan-build).

**Group B (Pairing 2):** util-artifact-schema scrub + test-artifact-schema +
test-artifact-schema-provenance. Implements: AC-2.1, AC-4.2, AC-4.3, AC-5.1
(util-artifact-schema).

**Group C (Pairing 3):** fork-policy row delete + archive test-ac-4-1.
Implements: AC-2.7, AC-4.4.

**Group D (Pairings 4+5 combined):** start-bootstrap scrub + util-design-
partner-role scrub + test-info-packet-style-version-bumps. Implements: AC-1.4,
AC-1.5, AC-2.2, AC-2.4, AC-5.1 (start-bootstrap, util-design-partner-role).

**Group E (Pairing 6):** design-specify scrub + test-stamping-design-specify.
Implements: AC-1.2, AC-2.3, AC-5.1 (design-specify).

**Group F (Pairing 7):** execute-write scrub + test-stamping-execute-write.
Implements: AC-1.1, AC-5.1 (execute-write).

**Group G (collapsed per pragmatist Q&A):** util-worktree scrub + version bump
(AC-1.6, AC-5.1) + agent-industry-explorer archive (AC-3.1) + design-brief-
small-template and record-formats delete (AC-2.5, AC-2.6). All mechanical
deletes/moves, no test coupling, clear revert scope. Implements: AC-1.6, AC-2.5,
AC-2.6, AC-3.1, AC-5.1 (util-worktree).

**Group H (separate — one file only):** setup-start skill-index.md update.
Implements: AC-1.7. Must not touch SKILL.md body — test-start-cleanup asserts
design-specify is absent from setup-start/SKILL.md. One file: skill-index.md.

**Group K (own commit):** docs/instructions.md deliberate rewrite.
Implements: AC-2.8. Size and deliberateness warrant an isolated commit.

**Capstone (last):** full suite run. Implements: AC-6.1.

Sprint total: 9 task commits + capstone. Groups A–F lockstep-paired; Group G
collapsed; H and K standalone.

Groups have no required ordering among themselves except:
- Groups A–F must each land as atomic commits (internal lockstep rule).
- AC-6.1 runs last, after all groups are committed.

---

## Peer Q&A Resolution (pragmatist)

Question asked: collapse G+I+J vs. separate commits for revert safety?

Answer: collapse G+I+J (now Group G above) — all deletions in the same sprint,
revert scope is "un-delete three things," clear and bounded. H must stay
separate (one-file constraint from test hazard). K stays own commit. Sprint
total 9+capstone.

Caveat confirmed: util-worktree version bump is a body edit (Integration section
changes) — safe to batch with the deletes since no pinning test exists for
util-worktree.

---

## Summary

- Spec undercounts pinning tests: 7 version-pinning tests, not 4. Extra ones:
  test-stamping-design-specify, test-stamping-plan-build,
  test-stamping-execute-write, test-info-packet-style-version-bumps (covers 2).
- Pairing 4+5 must be a single commit (one test covers two version bumps).
- Critical hazard: test-start-cleanup fails if design-specify appears in
  setup-start/SKILL.md body — AC-1.7 must target skill-index.md only.
- Groups G+I+J collapsed into one commit (pragmatist Q&A, round 03).
- Capstone AC-6.1 is last, depends on all groups.
- Final structure: 9 task commits + capstone (down from 11+capstone).
