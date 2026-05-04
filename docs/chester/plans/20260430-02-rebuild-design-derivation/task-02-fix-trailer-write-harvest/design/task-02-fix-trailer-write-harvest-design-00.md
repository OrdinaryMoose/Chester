# task-02-fix-trailer-write-harvest — Design Brief

## Goal

Fix the trailer-write tool's harvest pass, which silently aborts when iterating sprint-artifact directories that contain even one un-stamped artifact. The bug surfaced during cluster B.2's records-writing run and was misattributed at registration time to a master-mode path-resolution issue. Investigation 2026-05-04 established the real root cause: the script's strict-mode shell discipline combined with a no-match grep pattern produces a script-wide silent abort the moment the per-artifact loop reaches a file lacking a `<!-- created-at: ` trailer.

Scope is moderate. The task fixes the script, audits the rest of the harvest function for sibling hazards, corrects the wrong attribution in two paper-trail sites (the master plan's task-02 entry and the closing-cluster summary's known-issues note), and adds the first test for harvest. Out of scope: the records-writing skill's session-path resolution bug — a separate fault line in a separate script, briefed standalone in `docs/admin/doc-finish-write-records-session-path-bug-2026-05-04.md`.

## Prior Art

The just-finished `task-01-fix-staleb3-label` set the erratum-class precedent for paper-trail corrections under master mode: an inline italicized erratum at the line of the wrong claim, dated and task-tagged, naming both the original mis-claim and the actual reality. Task-02 follows that precedent exactly for the closing-cluster summary's wrong-attribution note.

The harvest pass was added to the trailer-write tool in a recent task and ships in `chester-util-config/chester-trailer-write.sh`. Its strict-mode discipline plus pipefail rule combined with a no-match grep pattern produce the silent-abort behavior fixed here. The tool ships with five stamping tests (one per stamped skill) but no test for the harvest pass — task-02 introduces the first.

The §4.4 amendment from earlier this session introduced the trivial-edit vs investigation-bearing pipeline-weight class distinction. Task-02 is investigation-bearing; investigation has been completed at design time, surfacing root cause and fix shape before brief.

## Scope

**In scope:**
- Bug fix in the harvest pass's per-artifact timestamp-capture pipeline — append a swallow-the-exit suffix so the no-match path returns empty and the existing fallback line executes as designed.
- Audit of the rest of the harvest function for sibling pipeline-and-strict-mode hazards. Confidence-bias rule: harden where the no-match path is reachable in current usage; document with a one-sentence safety invariant comment where not. Stamping pass is not in audit scope (its pipelines are wrapped in `if` and safe by construction).
- Master-plan §4.4.2 scope and exit-criteria rewrite. Descriptive replacement with a one-clause aside acknowledging the original wrong attribution. Frontmatter version bumped.
- Closing-cluster summary L178 erratum. Inline italicized note immediately after the existing parenthetical, dated 2026-05-04, tagged `task-02-fix-trailer-write-harvest`, naming both the original wrong attribution and the real root cause.
- Synthetic-fixture test (rich shape) covering: the bug's exact trigger (one un-stamped artifact present before a stamped one), timestamp-based ordering across multiple stamped artifacts, deduplication of repeated stamps, and multi-stamp-per-file files. Test creates a temp directory at run time, exercises harvest, asserts output, tears down.
- End-to-end validation via finish-write-records run on this task — the populated `Session Skill Versions` section confirms the fix works under live conditions.

**Out of scope:**
- Records-writing skill session-path resolution bug. Separate fault line in a separate script with separate mechanics. Standalone brief at `docs/admin/doc-finish-write-records-session-path-bug-2026-05-04.md`.
- Broader refactor of the trailer-write tool or new feature additions.
- Cross-script audit of other potential set-e + pipefail hazards in other Chester utilities.
- Stamping-test dynamism — already deferred to master-plan §10 as out-of-master-scope.
- Migration of session-path resolution to a shared helper. Mentioned in the standalone brief as a possible future improvement; not required by either task.

## Key Decisions

1. **Scope: moderate.** Fix the bug, correct both paper-trail sites, audit the function, add the test. Records-writing session-path bug stays separate. Alternatives: minimal (script + master-plan only) underpays the precedent set by task-01's erratum; broad (also fold in the records-writing bug) couples unrelated fault lines.

2. **Fix shape: swallow-the-exit suffix on the timestamp-capture pipeline.** The script's existing fallback line ("if captured timestamp is empty, default to a far-future placeholder so un-stamped artifacts sort last") is the correct semantic; the bug is purely that the abort happens before the fallback can execute. Restoring the path so the fallback runs is the most behavior-preserving fix. Alternatives: replace pipeline with awk one-liner, wrap loop in strict-mode-disabled subshell, restructure to explicit if-else — all are larger changes that risk introducing their own bugs.

3. **Hardening scope: targeted plus audit.** Fix the observed bug; audit the rest of the harvest function for sibling hazards. Alternatives: targeted only (leaves known-shape hazard latent at the end-of-function pipeline), prophylactic full harden (over-rotates and dilutes signal of which sites carry real hazards).

4. **Audit discrimination rule: confidence bias.** Harden where the no-match path is reachable in current usage; document with a one-sentence safety invariant comment where the no-match path is not reachable today but could become so under plausible future changes. Alternatives: defensive bias (over-hardens), bug-as-evidence (under-hardens; defers all real hardening to future incidents).

5. **Test approach: synthetic fixture (rich shape).** Test creates a temp directory at run time with multiple stamped artifacts at different timestamps, at least one un-stamped, and at least one with multiple produced-by lines. Exercises the bug's trigger plus the harvest pass's existing-but-untested behaviors (timestamp ordering, deduplication, multi-stamp files). Alternative: real-sprint fixture — couples test to archived sprint state which task-01 just demonstrated is fragile.

6. **Master-plan §4.4.2 rewrite shape: descriptive replacement.** Rewrite scope paragraph and exit criteria to reflect the real root cause and trigger condition. One-clause aside acknowledges the wrong original attribution. Alternatives: minimal swap (loses correction-provenance signal), full restatement (over-narrates).

7. **Closing-cluster summary L178 erratum: strict precedent.** Inline italicized erratum note after the existing parenthetical, dated and task-tagged, naming original mis-claim and real root cause. Follows task-01 template exactly. Alternatives: replace in place (erases history), footnote hybrid (over-engineered for a single-line correction).

## Constraints

- Preserve the harvest function's strict-mode shell discipline globally; localize hardening to the specific pipelines via swallow-the-exit suffixes, not via subshell escapes or whole-function discipline disabling.
- Test must be deterministic and self-contained; no dependence on archived sprint state, working-directory state, or environment variables beyond what the script itself reads. Setup and teardown are inside the test.
- Erratum and master-plan corrections preserve historical signal; do not erase the original wrong attribution. The label-fix work this morning set this precedent — diverging now would create competing precedents on consecutive task exercises.
- Skill-version stamping is not applicable. `chester-trailer-write` is a utility script under `chester-util-config/`, not a skill; it has no `version:` frontmatter and is not subject to the skill-version stamping convention.
- The audit must produce per-site evidence. Each pipeline-and-strict-mode interaction in the harvest function leaves either a hardening change or a one-sentence safety invariant comment. No silent passes.
- Master-plan attribution-correction aside is one clause, not a paragraph. The master plan is the registration document, not the investigation log.

## Acceptance Criteria

- Harvest pass succeeds on the master tree with mixed stamped and un-stamped artifacts present; exits 0 with non-empty output reflecting all stamped artifacts in deterministic order.
- New synthetic-fixture test passes on first run; covers the bug's trigger, timestamp ordering, deduplication, and multi-stamp files. Test setup and teardown are self-contained.
- All five existing stamping tests still pass without modification.
- Audit findings present in the script source: every pipeline-and-strict-mode interaction in the harvest function carries either a hardening change or a one-sentence safety invariant comment; no silent passes left.
- Master-plan §4.4.2 scope and exit criteria reflect the real root cause (strict-mode plus no-match interaction) and trigger condition (un-stamped artifacts in the iterated directory). One-clause aside acknowledges the original wrong attribution. Frontmatter version bumped.
- Closing-cluster summary L178 carries an inline italicized erratum dated 2026-05-04, tagged `task-02-fix-trailer-write-harvest`, naming both the original wrong attribution and the real root cause.
- finish-write-records run on this task produces a `Session Skill Versions` section populated automatically via the fixed harvest tool — end-to-end validation that the fix works in live conditions.
- No regressions in existing test suite. All `tests/test-*.sh` pass.

<!-- created-at: 2026-05-04T10:15:07Z -->
<!-- produced-by design-small-task@v0002 -->
