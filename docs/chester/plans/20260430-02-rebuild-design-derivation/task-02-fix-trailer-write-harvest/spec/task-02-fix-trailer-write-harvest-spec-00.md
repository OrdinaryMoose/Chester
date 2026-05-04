# Spec: task-02-fix-trailer-write-harvest

**Sprint:** 20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest
**Parent brief:** `docs/chester/working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/design/task-02-fix-trailer-write-harvest-design-00.md`
**Architecture:** Direct edits to `chester-util-config/chester-trailer-write.sh` (swallow-the-exit suffix on the timestamp-capture pipeline + audit-driven hardening on sibling pipelines), one new self-contained bash test (`tests/test-harvest-trailer-write.sh`), inline edits to two paper-trail sites (master-plan §4.4.2, closing-cluster summary L179). No new files except the test. No new directories.

## Goal

Fix the silent-abort bug in the trailer-write tool's harvest pass when iterating sprint directories that contain even one un-stamped artifact. Audit the rest of the harvest function for sibling pipeline-and-strict-mode hazards and harden under a confidence-bias rule. Correct the wrong attribution sitting in two paper-trail sites: the master-plan §4.4.2 task-02 entry and the closing-cluster summary's known-issues note. Add the first test for the harvest pass — a self-contained synthetic fixture that exercises the bug's exact trigger plus the harvest contract's existing-but-untested behaviors.

## Components

| Component | Change shape |
|-----------|--------------|
| `chester-util-config/chester-trailer-write.sh` `do_harvest` function | Modified — append swallow-the-exit suffix (`|| :`) to the per-artifact timestamp-capture pipeline at line 79; audit and harden or annotate the end-of-function sort-and-dedupe pipeline at lines 87-88 per confidence-bias rule |
| `tests/test-harvest-trailer-write.sh` | Created — self-contained bash test using a temp-directory synthetic fixture (rich shape) |
| `docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md` §4.4.2 | Modified — descriptive replacement of scope paragraph and exit-criteria bullets; one-clause attribution-correction aside; frontmatter version bump |
| `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md` L179 area | Modified — inline italicized erratum following task-01's precedent (immediately after the L179 parenthetical) |
| `docs/chester/plans/20260430-02-rebuild-design-derivation/master-plan.md` §4.4.2 | Synced from working master-plan via the living-document pattern (mid-task commit on main) |
| `docs/chester/plans/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md` L179 area | Mirrored in worktree at archive step |

## Data Flow

The harvest pass's per-artifact loop reads each `*.md` file, captures its `<!-- created-at: ... -->` timestamp via a grep+head+sed pipeline, and runs an awk pass to extract every `<!-- produced-by ... -->` stamp. Output rows (`<timestamp>\t<file>\t<position>\t<stamp>`) accumulate in a temp file. After the loop, the rows are sorted by (timestamp, file, position), deduplicated by stamp, and printed.

The bug lives in step 1 of the per-artifact loop. With strict-mode-shell discipline (`set -e`) and pipefail enabled, the timestamp-capture pipeline returns non-zero when the matcher finds nothing. The non-zero propagates to the surrounding assignment, which `set -e` treats as a hard failure — the script exits silently mid-loop. The fallback line at line 80 (`[ -n "$created" ] || created="9999..."`) was designed to handle empty-timestamp captures but never executes because the abort happens upstream of it.

The fix preserves the function's strict-mode discipline globally and localizes the change to the one pipeline that needs to tolerate no-match. The fallback line then runs as designed, marking un-stamped artifacts with a far-future placeholder so they sort last in output.

## Error Handling

The fix path:
- Matcher finds at least one timestamp → captured timestamp is the matched ISO 8601 datetime; pipeline exits 0; fallback no-ops.
- Matcher finds no timestamp (un-stamped artifact) → pipeline exits 0 (suffix swallows the no-match exit); captured timestamp is empty; fallback line sets the far-future placeholder.

Other error modes left unchanged by this fix:
- Sprint directory missing → upstream `[ -d "$sprint_dir" ]` check exits 1 with stderr message before the loop.
- Awk command fails (write error, syntax error) → `set -e` propagates the failure as designed; this is implementer-time territory, not a data-shape hazard.
- Sort or dedupe pipeline fails on empty input → covered by the audit (see AC-2.1).

## Testing Strategy

**Test file:** `tests/test-harvest-trailer-write.sh` — new self-contained bash script following the existing convention (e.g. `tests/test-stamping-design-large-task.sh`).

**Invocation path:** the test invokes the local source directly via absolute path (`bash "$(git rev-parse --show-toplevel)/chester-util-config/chester-trailer-write.sh" harvest ...`), not via the PATH-resolved binary. The PATH wrapper at `bin/chester-trailer-write` execs the plugin-cache copy under `~/Documents/CodeProjects/OrdinaryMoose/plugins/chester/`, which lags the local repo source until `/refresh-chester` syncs. Direct invocation guarantees the test exercises the local fix without depending on the cache-refresh step.

**Fixture shape:** rich. Test creates a temp directory at run time containing:
- 3 stamped artifacts at distinct ISO 8601 timestamps (early, middle, late)
- 1 un-stamped artifact (no `<!-- created-at: ... -->` trailer)
- 1 stamped artifact carrying multiple `<!-- produced-by ... -->` lines (tests dedup-by-line behavior)

Setup uses `mktemp -d` for the directory and bash heredocs to write each mock file. Teardown uses a `trap` on `EXIT` that removes the temp directory.

**Assertions:**
- Harvest exits 0 (no silent abort).
- Stdout contains every distinct `<!-- produced-by ... -->` line from the stamped artifacts.
- Stdout does not contain duplicate stamp lines (dedup verified).
- Stdout ordering reflects timestamps oldest-first across emitted stamps. (Un-stamped artifacts contribute no rows to output by definition; the fallback's far-future placeholder governs ordering only for artifacts that have both an empty timestamp capture and at least one produced-by line, which the bug-trigger condition exercises directly.)

**Coverage:** the bug's trigger condition (un-stamped artifact present), timestamp ordering, deduplication, and multi-stamp-per-file files. The audit's documented-safe sites are not directly tested — confidence-bias rule treats them as safe under known invariants, so test coverage stays focused on observable behavior.

**Regression baseline:** all five existing `tests/test-stamping-*.sh` tests continue to pass without modification. New test runs alongside them as part of the standard `for t in tests/test-*.sh; do bash "$t"; done` invocation pattern.

## Constraints

- **Strict-mode discipline preserved globally.** The function's `set -euo pipefail` is preserved; hardening localizes to specific pipelines via swallow-the-exit suffixes, not via subshell escapes or whole-function discipline disabling.
- **Test self-containment.** The test must not depend on archived sprint state, working-directory state, or environment variables beyond what the script itself reads. Setup and teardown are inside the test.
- **Historical signal preserved.** Erratum and master-plan corrections do not erase the original wrong attribution. The label-fix work this morning set this precedent; consecutive task exercises must not create competing precedents.
- **Skill-version stamping not applicable.** `chester-trailer-write` is a utility script, not a skill. No `version:` frontmatter, no test-stamping mirror file (`tests/test-stamping-trailer-write.sh` does not exist and is not created here).
- **Audit produces per-site evidence.** Every pipeline-and-strict-mode interaction in the `do_harvest` function carries either a hardening change or a one-sentence safety invariant comment after the audit; no silent passes.
- **Master-plan attribution-correction aside is one clause.** The master plan is the registration document, not the investigation log; correction signal is a single inline clause.
- **Living-document sync convention.** The master-plan §4.4.2 edit lands on main via the standard working→plans sync pattern (mid-task commit) so future readers consulting main see the corrected scope before the task's archive merge.

## Non-Goals

- Fixing the records-writing skill's session-path resolution bug. Separate fault line, separate brief at `docs/admin/doc-finish-write-records-session-path-bug-2026-05-04.md`.
- Refactoring or extending the trailer-write tool beyond the bug fix and audit-driven hardening.
- Cross-script audit of other Chester utilities for similar set-e + pipefail hazards.
- Making the stamping-test convention dynamic. Already deferred to master-plan §10.
- Migrating session-path resolution to a shared helper. Mentioned in the records-writing brief as a possible future improvement; not in any task's current scope.
- Stamping the trailer-write tool itself with any kind of provenance trailer (it is a utility, not an artifact).
- Adding tests for the stamping pass. Stamping has its own test mirrors per skill; harvest is the gap this task fills.

## Acceptance Criteria

### AC-1.1 — Timestamp-capture pipeline tolerates no-match

**Observable boundary:**
- Harvest pass run against a directory containing at least one un-stamped artifact and at least one stamped artifact → exits 0 with non-empty stdout containing all stamped artifacts' produced-by lines.
- Harvest pass run against a directory containing only un-stamped artifacts → exits 0 with empty stdout (no stamps to report).
- Harvest pass run against a directory with no `*.md` files → exits 0 with empty stdout.

**Given:** the trailer-write tool's `do_harvest` function as edited.
**When:** the per-artifact loop reaches an artifact lacking a `<!-- created-at: ... -->` trailer.
**Then:** the timestamp capture returns empty without aborting, the fallback line sets the far-future placeholder, and the loop continues to the next artifact.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-2.1 — Audit findings present in `do_harvest` source

**Observable boundary:**
- `do_harvest` function source contains zero unannotated pipeline-and-strict-mode interactions. Each such interaction carries either a hardening change (e.g. swallow-the-exit suffix) or a one-sentence safety invariant comment immediately above it.
- The audit covers at minimum: the per-artifact timestamp-capture pipeline (line 79), the per-artifact awk pipeline (lines 81-83), the end-of-function sort-and-dedupe pipeline (lines 87-88).

**Given:** the audit walks `do_harvest` after the AC-1.1 fix is applied.
**When:** the auditor (the implementer) inspects each pipeline.
**Then:** every pipeline either receives a hardening change (no-match path is reachable in current usage) or a one-sentence safety invariant comment (no-match path is not reachable today; the comment names the invariant that keeps it so).

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-3.1 — New harvest test exists and passes

**Observable boundary:**
- `tests/test-harvest-trailer-write.sh` exists, is executable as `bash tests/test-harvest-trailer-write.sh`, and exits 0 on a clean checkout post-fix.
- The test creates a temp directory at run time, populates it with a rich-shape fixture (3 stamped at distinct timestamps + 1 un-stamped + 1 stamped with multiple produced-by lines), invokes the local-source script directly via `bash "$REPO_ROOT/chester-util-config/chester-trailer-write.sh" harvest "$FIXTURE_DIR"` (not via the PATH wrapper), asserts the output, and tears down via `trap`.

**Given:** the test file as authored and the AC-1.1 fix applied.
**When:** the test runs in any working directory inside the repo.
**Then:** the test exits 0 with no leaked temp files.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-3.2 — Test asserts the harvest contract

**Observable boundary:**
- Test asserts harvest exits 0 (no silent abort).
- Test asserts every distinct `<!-- produced-by ... -->` line from the fixture's stamped artifacts is present in stdout.
- Test asserts stdout contains no duplicate stamp lines (dedup verified).
- Test asserts stdout ordering reflects timestamps oldest-first across all emitted stamps. Un-stamped artifacts contribute no rows by definition; the assertion exercises the relative ordering of stamps from the three stamped-at-distinct-timestamps artifacts plus the multi-stamp artifact.

**Given:** the rich-shape fixture from AC-3.1.
**When:** the test runs harvest and inspects stdout.
**Then:** all four assertions hold.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-3.3 — Pre-existing tests pass without modification

**Observable boundary:**
- All five `tests/test-stamping-*.sh` files pass when run via `for t in tests/test-stamping-*.sh; do bash "$t"; done` post-fix.
- No edits to any pre-existing test file are required to satisfy this spec.
- Full test suite (`for t in tests/test-*.sh; do bash "$t"; done`) reports zero failures post-fix.

**Given:** the fix and audit edits applied; the new test added.
**When:** the full test suite runs.
**Then:** every test passes.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-4.1 — Master-plan §4.4.2 reflects real root cause

**Observable boundary:**
- §4.4.2 scope paragraph names the real fault pattern (strict-mode shell discipline plus no-match-grep interaction) and the real trigger condition (any sprint with an un-stamped artifact present).
- §4.4.2 exit criteria bullets reflect the real scope: bug fix in `do_harvest`, audit of the function, paper-trail corrections, synthetic-fixture test added.
- §4.4.2's existing reference to "B.2 summary L178" is corrected to "B.2 summary L179" (the parenthetical actually lives at line 179; line 178 is blank). The line-ref correction is part of the same descriptive-replacement edit.
- A one-clause aside acknowledges the original wrong attribution ("originally suspected master-mode nested directory layout; investigation showed strict-mode plus no-match interaction").
- Master-plan frontmatter version field is bumped (current `v01.04` → `v01.05` or higher).
- Working/master-plan.md and plans/master-plan.md are byte-identical after the edit lands on main.

**Given:** the §4.4.2 entry as currently written (the registration text from earlier this session).
**When:** the spec implementer applies the descriptive-replacement rewrite.
**Then:** §4.4.2 reads as a corrected registration document with attribution provenance preserved.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-4.2 — Closing-cluster summary L179 carries inline erratum

**Observable boundary:**
- The closing-cluster summary file `cluster-b-2-define-solve-closing-summary-00.md` carries an inline italicized erratum note immediately after the existing L179 parenthetical.
- The erratum is dated `2026-05-04`, tagged `task-02-fix-trailer-write-harvest`, names the original wrong attribution ("possibly a path-resolution issue with the master-mode nested directory layout"), and names the real root cause (strict-mode + no-match interaction).
- The original L179 parenthetical text is not modified — the erratum annotates without erasing.
- Both `working/` and `plans/` copies of the summary are updated.

**Given:** the L179 parenthetical as it currently exists.
**When:** the spec implementer adds the erratum note.
**Then:** the file contains both the original mis-attribution (preserved) and the inline erratum correction (added) in shape parallel to task-01's L127 erratum.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-5.1 — End-to-end harvest validation via finish-write-records

**Observable boundary:**
- The `finish-write-records` invocation at the close of this task produces a session summary whose `Session Skill Versions` section is populated automatically by `chester-trailer-write harvest` (not manually filled in).
- The populated section contains the deduped `<!-- produced-by ... -->` chain from this task's design brief, spec, plan (when written), and any other stamped artifacts in the task's working subdirectory.
- No manual workaround note ("harvest returned empty — manually filled") appears in the session summary.
- Before the finish-write-records step runs, the plugin cache is refreshed (`/refresh-chester`) so the PATH-resolved `chester-trailer-write` binary execs the fixed code, not the stale cached version. Without the cache refresh, finish-write-records would invoke the un-fixed plugin copy and AC-5.1 would silently fail.

**Given:** the AC-1.1 fix applied, plugin cache refreshed, and the task's working subdirectory containing stamped artifacts.
**When:** `finish-write-records` runs at task close and invokes `chester-trailer-write harvest` via PATH.
**Then:** the harvest output is non-empty and populates the summary's skill-versions section directly.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-04T10:19:45Z -->
<!-- produced-by design-specify@v0003 -->
