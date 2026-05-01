# Plan Threat Report — Decision Record System Replacement

**Sprint:** `20260501-01-fix-decision-record`
**Plan reviewed:** `plan/fix-decision-record-plan-00.md`
**Reviewers:** `chester:plan-build-plan-attacker`, `chester:plan-build-plan-smeller`
**Date:** 2026-05-01

## Combined Risk Level: **Significant**

The plan has **two CRITICAL findings** that block execution as written. One HIGH finding leaves a dangling skeleton reference. Multiple MEDIUM-LOW findings leave residue.

## Why Significant (not High, not Moderate)

- **Two hard blockers** at CRITICAL severity. Both are mechanically fixable with concrete edits but must land before any task runs.
- **The CRITICAL findings are self-inconsistent plan logic, not stale-codebase drift.** Line numbers and text blocks all match the live files (drift was the smeller's specific probe and came back negative). The plan's own assertions about what's currently in `tests/` are incomplete (missing 4 files); the plan's own filter-file procedure contradicts its own test's grep direction.
- **Finding 8 / Finding 2 (cross-validated bug)** — both reviewers independently caught the supersession grep mismatch. `decision-record-filter.md` documents `grep -A 1` (returns the line *after* `supersedes:`, which is `artifact_refs:`), but Task 5's test uses `grep -B1` (correct — returns `id:`). The reference file has the wrong direction.
- **Multiple residue-level findings** (no version bumps, dangling references in `spec-template.md` and `plan-template.md`, "loop-optimized" intro retains DR vocabulary) won't break builds but ship sprint-completion-blockers if revert-clean test runs after Task 14 with these residues present.
- **Smell triggers fired on false positives** (`Task.` matched sentence punctuation, `new record` matched decision-record prose, not .NET semantics). Smeller calibrated correctly and produced relevant findings anyway.

## Smell Pre-Check Result

Triggers matched:
- `Task.` — 3 spurious matches (sentence-period after "task")
- `new record` — 2 matches in decision-record append context

These are **false positives** for .NET-flavored smell categories. The Chester codebase is markdown / bash / Node.js. Smeller calibrated against the actual domain and produced relevant findings.

## Findings — Plan-Attacker

### CRITICAL — Four currently-passing tests are not deleted, blocking Task 4 verification AND preventing revert-clean from going green

Files containing DR tokens not addressed by Task 13:
- `tests/test-finish-write-records-update.sh` — contains `dr_audit`, `dr_abandon`, `chester-decision-record` (7 hits)
- `tests/test-plan-build-update.sh` — contains `dr_query`, `chester-decision-record` (13 hits)
- `tests/test-execute-verify-complete-update.sh` — contains `dr_verify_tests`, `chester-decision-record` (5 hits)
- `tests/test-reference-files.sh` — contains `skeleton-generator`, `propagation-procedure`

**Impact:** Task 4 Step 4's "no FAIL lines" check fails immediately when `test-finish-write-records-update.sh` greps for `dr_audit` against the post-Task-4 SKILL.md. Revert-clean test (Task 14) reports token hits in `tests/` after all 14 tasks complete because these four files still exist. Plan as written cannot land cleanly.

**Fix:** add the four files to Task 13's deletion list. `test-finish-write-records-update.sh` must be deleted before Task 4's full-suite verification (or Task 4 narrows its check to specific tests).

### CRITICAL — Task 5 supersession test contains a grep-direction logic bug that fails at first run

Plan Task 5 Step 1 fixture has YAML field order `id, date, sprint, stage, title, decision, rationale, alternatives, tags, supersedes, artifact_refs`. The line *immediately before* `supersedes:` is `tags:`, not `id:`. The test's grep:

```bash
SUPERSEDER=$(grep -B1 "^supersedes: dr-20260101-01-original$" "$CORPUS" | grep "^id:" | sed 's/^id: //')
```

returns empty `SUPERSEDER` because `grep -B1` returns the `tags:` line, then `grep "^id:"` matches nothing. Test fails at the assertion step.

**Fix:** rewrite the supersession discovery procedure to scan back to the most recent `id:` line preceding the matching `supersedes:` line. An `awk` one-pass:

```bash
SUPERSEDER=$(awk '/^id: / { last_id = $2 } /^supersedes: dr-20260101-01-original$/ { print last_id; exit }' "$CORPUS")
```

Apply the same fix to `decision-record-filter.md` (Task 1 content) — see Finding 8.

### HIGH — `skills/design-specify/references/spec-template.md:64` retains `skeleton-generator.md` reference

Plan does not touch `spec-template.md`. After all 14 tasks complete, the revert-clean test scans `skills/` for `skeleton-generator` and finds:

```
skills/design-specify/references/spec-template.md:64:- **Skeleton IDs** match the stub emitted by `skeleton-generator.md`.
```

Also `spec-template.md:53` has `**Test skeleton ID:** ac-{N-M}-{slug}` — a structural field with no backing procedure after Task 9.

**Fix:** add `spec-template.md` to Task 9's modification list. Remove the `Test skeleton ID:` line and the skeleton-IDs cross-reference.

### MEDIUM — Task 7 renumbering instructions lack sed strings; naive `sed -i 's/^4\. \*\*/3. \*\*/'` would match Section 5's unrelated step at line 237

`skills/execute-write/SKILL.md:237` reads `4. **Invoke `finish-close-worktree`**`. A naive sed renumber from `4.` to `3.` would corrupt this unrelated line.

**Fix:** Task 7 should provide explicit sed strings with full-context anchors (matching the pattern Tasks 10 and 11 already use), or instruct implementer to renumber via Edit tool with surrounding context.

### MEDIUM — Five skill files have substantive behavior changes but no `version:` field bump

CLAUDE.md states: "Bump it on any meaningful change to the skill's behavior or contract." Plan changes:
- `finish-write-records/SKILL.md` (Task 4 — entirely new fork mechanism)
- `execute-write/SKILL.md` (Task 7 — chain reverted)
- `design-specify/SKILL.md` (Task 9 — scaffolding removed)
- `plan-build/SKILL.md` (Task 10 — Prior Decisions removed)
- `execute-verify-complete/SKILL.md` (Task 11 — verify step removed)

None of the 14 tasks bump the `version:` frontmatter field. Provenance trailers stamped after the changes will be semantically misleading (v0002 trailer applied to v0003 behavior).

**Fix:** add an explicit "Bump version: vNNNN → vNNNN+1" sub-step to each affected task.

### LOW — `plan-build/SKILL.md:28` retains "derive per-task `Must remain green` from Prior Decisions"

Task 10 Step 2 covers the section heading and integration block but does not address line 28 in Dynamic Progress Tracking. Stays as a stale instruction.

### LOW — Task 12 Step 3's trailing-comma note is factually wrong

The current `mcp.json` does NOT have a trailing comma after `chester-design-understanding-problemfocused`'s closing `}`. The plan's note "remove that comma" is misinformation (resulting JSON is still valid; an implementer searching for a comma to remove will be confused).

**Fix:** delete the trailing-comma sentence from Task 12 Step 3.

### LOW — `plan-template.md` "loop-optimized" intro retains DR vocab

`plan-template.md:7-9` contains "loop-optimized — per-task fields ... build-decision loop." Task 10 doesn't rewrite this paragraph. Tokens are not in the revert-clean scan list, but they're DR residue in a document every future plan-build reads.

## Findings — Plan-Smeller (relevant only)

### HIGH — Same as plan-attacker CRITICAL #2: `decision-record-filter.md` documents `grep -A 1` but the supersession test (Task 5) uses `grep -B1`

Cross-validated by both reviewers. The reference file's procedure is wrong; the test's procedure is right. Future agents reading the reference file get incorrect grep syntax.

**Fix:** rewrite the filter file's supersession discovery procedure to use the awk approach above (or `grep -B 12` to scan far enough back to capture `id:`). Apply the same fix to Task 1's filter file content AND Task 5's test.

### MEDIUM — Split-reference fragility: `record-formats.md` and `decision-record-filter.md` are mutually dependent

The 11-field shape lives in `record-formats.md`; the id format, tag list, and supersession procedure live in `decision-record-filter.md`. Cross-references exist but no enforcement. Adding a field requires touching one file; adding a tag requires the other; changing the id format requires both. Intentional split, but worth noting for future evolution.

**Fix:** acceptable as-is; flag for future tracking. Consider documenting in the SKILL.md Step 3 dispatch instruction: "before emitting, read both `record-formats.md` and `decision-record-filter.md`."

### LOW — Audit-filter inline in `finish-write-records/SKILL.md`, records-filter in dedicated reference file (asymmetric management)

Fork A's discrimination criteria duplicate inline in SKILL.md (~30 lines); Fork B's criteria live in `decision-record-filter.md`. The two parallel responsibilities are not managed symmetrically.

**Fix:** acceptable as-is. Worth a comment but not blocking. Could extract Fork A's filter to its own reference file in a follow-up sprint.

### LOW — `plan-template.md` Part 2 task structure example retains `{skeleton-ID}` reference

Line 66 still says `(reference skeleton {skeleton-ID} if one exists)`. Vestigial after Task 9 removes the skeleton mechanism.

**Fix:** Task 10 Step 3 should also remove the `{skeleton-ID}` cross-reference from the Part 2 task example.

### NON-FINDINGS (verified clean)

- Plan-text contract drift — line numbers and text blocks match the live files exactly.
- `record-formats.md` line count baseline (176) is correct.
- New tests in Tasks 3 and 5 do not contain forbidden tokens that would false-positive the revert-clean scan.

## Verified Assumptions (reduce implementer uncertainty)

- `finish-write-records/SKILL.md` step structure (Steps 1-7, Step 4 at line 236, exact heading) — CONFIRMED.
- `record-formats.md` line count = 176 — CONFIRMED.
- `mcp.json` four-server shape with `chester-decision-record` last — CONFIRMED.
- `execute-write/SKILL.md` numbered steps 1-7 — CONFIRMED.
- `execute-verify-complete/SKILL.md` Steps 1-4 with Step 2 "Verify Decision-Record Linkage" at line 43 — CONFIRMED.
- `plan-build/SKILL.md` `dr_query` at lines 24, 50-79, 345 — CONFIRMED.
- All 8 `test-decision-record-*.sh` + `test-execute-write-update.sh` + `test-skeleton-manifest-path-convention.sh` exist — CONFIRMED.
- `agents/execute-write-test-generator.md` exists — CONFIRMED.
- 96ea360 diff blocks for SKILL.md, implementer.md, spec-reviewer.md exact text matches plan's quoted blocks — CONFIRMED.
- 8 keep-bucket items findable in live codebase — CONFIRMED.

<!-- created-at: 2026-05-01T13:37:58Z -->
<!-- produced-by plan-build@v0002 -->
