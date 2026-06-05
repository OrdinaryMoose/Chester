# Pragmatist — Round 02 Transcript

**Sprint:** 20260605-01-remove-largetask-references
**Role:** Pragmatist
**Dimension:** Testing Strategy section + test-lockstep acceptance criteria
**Path:** A (ratified) — complete removal, defer the fork-policy gap

---

## Grounding

Read all four pinning tests in full. Exact grep strings extracted from each test file.
The position below is derived from actual test logic, not inference.

---

## Testing Strategy

The four pinning tests encode assumptions about file content that become false once the
reference scrub lands. The scrub and the test edits are a single atomic unit — they must
be staged and committed together so the suite never passes through a red state.

Three tests survive with targeted assertion removal. One test is archived alongside the
removed skill.

### Order of operations

1. Edit each target file (the twelve references).
2. Edit each surviving test in the same commit or immediately adjacent commit on the
   same branch.
3. Archive `test-ac-4-1-fork-policy-pole-rows.sh` to `_archive/design-large-task/tests/`
   in the same commit that deletes the fork-policy rows.
4. Run the full suite as the terminal gate: `for t in tests/test-*.sh; do bash "$t"; done`.
   Zero failures is the exit condition.

The "same commit or immediately adjacent" constraint means: never push a state where the
file edit has landed but the test edit has not, or vice versa. One branch, one ordered
sequence of commits, suite green at every commit boundary.

### Per-test change

**test-plan-build-heuristic** — one assertion removed, all others survive.

The stale assertion (lines 56–59 of the test file):
```bash
if ! grep -q "design-large-task" "$SKILL"; then
  echo "FAIL: $SKILL does not reference design-large-task in cascade context"
  ERRORS=$((ERRORS + 1))
fi
```
This block is the only reference to `design-large-task` in the test. Remove it. The test
retains seven other assertions covering the smell heuristic, smell-triggers reference,
ground-truth cascade, scope-narrowing language, and `design-specify` as invoker. Those
all survive the plan-build edits unaffected.

**test-artifact-schema** — one producer removed from the loop, all others survive.

The stale producer in the loop (line 14 of the test file):
```bash
for producer in "design-large-task" "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do
```
Remove `"design-large-task"` from the loop. Revised loop:
```bash
for producer in "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do
```
The archived-skill guard (`design-figure-out`) and the ground-truth artifact assertion
are unaffected.

**test-artifact-schema-provenance** — one skill removed from the stamping loop, all
others survive.

The stale skill in the stamping loop (lines 21–23 of the test file, step 5):
```bash
for skill in design-large-task design-small-task design-specify plan-build execute-write finish-write-records; do
```
Remove `design-large-task` from the loop. Revised loop:
```bash
for skill in design-small-task design-specify plan-build execute-write finish-write-records; do
```
All other assertions (section heading, helper script, subcommands, trailer format,
non-stamping list, version check) are unaffected.

**test-ac-4-1-fork-policy-pole-rows** — archived, not edited.

This test pins four assertions that all become false once fork-policy rows 1d–1g are
deleted: the four `grep -F "chester:design-large-task-step-b-${pole}"` calls, the
`step-b` row count check, and the framing-side rationale grep. No redirect target exists
(confirmed: zero design-committee pole rows in fork-policy.md). Editing the test to pass
against empty content would make it vacuous. Archive the file to
`_archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh` alongside the
27 previously archived large-task tests. The `tests/` directory loses this file; the
archive gains it. No assertion is rewritten as a stub.

---

## Acceptance Criteria

Each AC has an observable boundary: a bash command that returns 0 on success, non-zero
on failure. No AC is aspirational.

---

### AC-T1: test-plan-build-heuristic passes after scrub

**Condition:** `test-plan-build-heuristic` passes with the stale assertion removed and
`skills/plan-build/SKILL.md` scrubbed of `design-large-task` references.

**Observable boundary:**
```bash
cd /path/to/repo && bash tests/test-plan-build-heuristic.sh
```
Returns exit 0 and prints `PASS: plan-build heuristic and cascade structure correct`.

**What must be true for this to hold:**
- The stale assertion block (`grep -q "design-large-task"`) is removed from the test.
- `skills/plan-build/SKILL.md` contains no remaining `design-large-task` occurrences
  (verify: `grep -c "design-large-task" skills/plan-build/SKILL.md` returns 0).
- The surviving assertions still hold: `ground-truth` appears in the skill, `verified
  anchor` or `skip-list` or `plan-specific additions` appears, `Invoked by.*design-specify`
  matches, smell heuristic text present, `references/smell-triggers.md` cited, trigger
  file exists with DI/abstraction/async/persistence/contract categories and
  AddScoped/SemaphoreSlim/DbContext keywords.

**Flagged as checkable:** yes. All surviving assertions are grep-based on file content.

---

### AC-T2: test-artifact-schema passes after scrub

**Condition:** `test-artifact-schema` passes with `design-large-task` removed from the
producer loop and `skills/util-artifact-schema/SKILL.md` scrubbed of `design-large-task`
entries.

**Observable boundary:**
```bash
cd /path/to/repo && bash tests/test-artifact-schema.sh
```
Returns exit 0 and prints `PASS: artifact schema correct`.

**What must be true for this to hold:**
- `"design-large-task"` is removed from the `for producer in ...` loop in the test.
- `skills/util-artifact-schema/SKILL.md` contains no `design-large-task` occurrences
  (verify: `grep -c "design-large-task" skills/util-artifact-schema/SKILL.md` returns 0).
- `design-figure-out` does not appear in the schema (existing archived-skill guard still
  passes).
- All surviving producers (`design-small-task`, `design-specify`, `plan-build`,
  `execute-write`, `finish-write-records`) still appear in the schema.
- `spec-ground-truth-report` or `ground-truth` still appears in the schema.

**Flagged as checkable:** yes.

---

### AC-T3: test-artifact-schema-provenance passes after scrub

**Condition:** `test-artifact-schema-provenance` passes with `design-large-task` removed
from the stamping-skill loop and `skills/util-artifact-schema/SKILL.md` scrubbed.

**Observable boundary:**
```bash
cd /path/to/repo && bash tests/test-artifact-schema-provenance.sh
```
Returns exit 0 and prints `PASS: provenance convention documented`.

**What must be true for this to hold:**
- `design-large-task` is removed from the `for skill in ...` loop in the test.
- The schema's stamping-skill list no longer names `design-large-task` (same grep as
  AC-T2: `grep -c "design-large-task" skills/util-artifact-schema/SKILL.md` returns 0).
- All surviving stamping skills (`design-small-task`, `design-specify`, `plan-build`,
  `execute-write`, `finish-write-records`) still appear in the schema.
- Non-stamping list entries (`plan-attack`, `plan-smell`, `finish-archive-artifacts`,
  `subagents`, `execute-test`, `execute-prove`, `execute-verify-complete`,
  `start-bootstrap`) still appear in the schema.
- `## Provenance Trailers` section heading, `chester-trailer-write`, `stamp`, `harvest`,
  `<!-- created-at:`, and `<!-- produced-by` still appear in the schema.
- Version is `v0002` (existing assertion; the schema version bump for this sprint will
  move it to `v0003` — this assertion must be updated to `v0003` in lockstep).

**Version bump note:** `test-artifact-schema-provenance` step 7 asserts
`grep -q '^version: v0002'`. The schema gets a version bump in this sprint (v0002 →
v0003). The test must be updated to assert `v0003` in lockstep with the schema edit.
This is a third change to this test file beyond the stamping-loop removal.

**Flagged as checkable:** yes.

---

### AC-T4: test-ac-4-1 is archived, not in tests/

**Condition:** `tests/test-ac-4-1-fork-policy-pole-rows.sh` does not exist in the live
`tests/` directory; the file exists at
`_archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh`.

**Observable boundary:**
```bash
[ ! -f tests/test-ac-4-1-fork-policy-pole-rows.sh ] && echo "PASS: archived" || echo "FAIL: still in tests/"
[ -f _archive/design-large-task/tests/test-ac-4-1-fork-policy-pole-rows.sh ] && echo "PASS: in archive" || echo "FAIL: not in archive"
```
Both lines print PASS.

**Flagged as checkable:** yes.

---

### AC-T5: full suite green after all edits

**Condition:** All tests in `tests/` pass after the reference scrub and all test edits
are applied.

**Observable boundary:**
```bash
cd /path/to/repo
FAILURES=0
for t in tests/test-*.sh; do
  bash "$t" || { echo "FAIL: $t"; FAILURES=$((FAILURES + 1)); }
done
[ "$FAILURES" -eq 0 ] && echo "PASS: suite green" || echo "FAIL: $FAILURES test(s) failed"
```
Prints `PASS: suite green`. Zero failures attributable to this sprint.

**What constitutes "attributable to this sprint":** any test failure whose failing
assertion greps for `design-large-task` in a file that this sprint edits, or any test
failure caused by a version bump in a file this sprint touches. Pre-existing failures
from unrelated causes are out of scope and should have been zero before this sprint
(the brief states the suite was green at sprint start).

**Flagged as checkable:** yes.

---

## Notes on AC scope and ordering

AC-T5 is the terminal gate. AC-T1 through AC-T4 are intermediate gates that decompose
AC-T5 into per-test checkpoints. An implementer can run AC-T1 through AC-T4 after each
file-edit pair, then run AC-T5 once at the end as the final confirmation.

No AC requires human judgment to evaluate. All are bash-runnable from the repo root.

No AC is aspirational. Each states a file-content or exit-code condition that is either
true or false at run time.

---

## Open flag: version assertion in test-artifact-schema-provenance

The current test asserts `version: v0002`. After this sprint's bump, the schema will be
at `v0003`. The test must be updated to match. This is not aspirational — the exact
string to update is `grep -q '^version: v0002'` → `grep -q '^version: v0003'`. Flag for
the implementer: do not forget this third change to that test file.

---

## Peer question sent

Asked researcher (round 01): exact grep strings in each pinning test. Researcher
confirmed test logic in round 01 Q&A; all four tests read in full for this round to
verify exact assertions. No new peer question required for round 02 — the test files
themselves are the ground truth.
