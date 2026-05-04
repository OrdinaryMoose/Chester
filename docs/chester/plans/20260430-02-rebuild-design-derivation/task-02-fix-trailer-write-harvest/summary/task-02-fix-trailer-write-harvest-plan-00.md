# Plan: task-02-fix-trailer-write-harvest

**Sprint:** 20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest
**Spec:** `docs/chester/working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/spec/task-02-fix-trailer-write-harvest-spec-00.md`
**Execution mode:** inline

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

> **Hybrid execution (designer-directed override, 2026-05-04):** The heuristic recommended subagent (4 tasks > 3, multi-file Task 1). Designer overrode to **hybrid** — header set to `inline` for the parent-agent flow, with per-task `Execution:` annotation on each task block carrying the designer's intent. Task 1 (code-producing, TDD) is annotated `subagent` and the parent agent should dispatch a fresh implementer subagent for it, inheriting Section 2's spec + quality review discipline. Tasks 2-4 are docs-only (audit comments, master-plan prose, closing-cluster erratum) and are annotated `inline` — the parent agent executes them directly in the current session without review subagents. Per cluster B.1 audit precedent: per-task overrides are designer-recorded but the executor may honor them by choice when running inline.

## Goal

Fix the silent-abort bug in the trailer-write tool's harvest pass; audit the rest of the harvest function for sibling pipeline-and-strict-mode hazards; correct the wrong attribution sitting in two paper-trail sites (master-plan §4.4.2 and the closing-cluster summary's known-issues note); add the first test for the harvest pass.

## Architecture

Direct edits to `chester-util-config/chester-trailer-write.sh`'s `do_harvest` function — append `|| :` to the timestamp-capture pipeline at line 79 so the no-match path returns empty without aborting; the existing fallback line at line 80 then executes as designed. Audit the rest of the function under confidence-bias rule. One new self-contained bash test (`tests/test-harvest-trailer-write.sh`) using a synthetic temp-directory fixture (rich shape). Inline edits to the master-plan §4.4.2 entry and the closing-cluster summary's L179 parenthetical follow the erratum-class precedent task-01 set.

## Tech Stack

- Bash 5.x (script under test runs in strict mode: `set -euo pipefail`)
- POSIX coreutils (grep, head, sed, sort, awk, find, mktemp, trap)
- No external dependencies; tests are self-contained bash scripts under `tests/`

---

## Task 1: Add harvest test + apply swallow-the-exit fix (TDD)

**Type:** code-producing
**Execution:** subagent (per hybrid override — TDD with real test contract, dispatched to fresh implementer for review-independence)
**Implements:** AC-1.1, AC-3.1, AC-3.2
**Decision budget:** 1 (exact placement of `|| :` within the pipeline; default position is at the end of the `sed` segment, before the closing `)"`)
**Must remain green:** `tests/test-harvest-trailer-write.sh` (created here), `tests/test-stamping-design-large-task.sh`, `tests/test-stamping-design-small-task.sh`, `tests/test-stamping-design-specify.sh`, `tests/test-stamping-execute-write.sh`, `tests/test-stamping-plan-build.sh`

**Files:**
- Create: `tests/test-harvest-trailer-write.sh`
- Modify: `chester-util-config/chester-trailer-write.sh:79`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-harvest-trailer-write.sh` with the rich-shape synthetic fixture. The test invokes the local-source script directly (NOT the PATH wrapper, to bypass the plugin cache):

```bash
#!/usr/bin/env bash
# tests/test-harvest-trailer-write.sh
# Verifies chester-trailer-write harvest tolerates un-stamped artifacts and
# emits stamps in (timestamp, file, position) order with dedup.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT="$REPO_ROOT/chester-util-config/chester-trailer-write.sh"

ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Setup synthetic fixture
FIXTURE_DIR="$(mktemp -d)"
trap 'rm -rf "$FIXTURE_DIR"' EXIT

# 3 stamped artifacts at distinct timestamps
cat > "$FIXTURE_DIR/early.md" <<'EOF'
# Early
content
<!-- created-at: 2026-01-01T00:00:00Z -->
<!-- produced-by skill-alpha@v0001 -->
EOF

cat > "$FIXTURE_DIR/middle.md" <<'EOF'
# Middle
content
<!-- created-at: 2026-02-01T00:00:00Z -->
<!-- produced-by skill-beta@v0001 -->
EOF

cat > "$FIXTURE_DIR/late.md" <<'EOF'
# Late
content
<!-- created-at: 2026-03-01T00:00:00Z -->
<!-- produced-by skill-gamma@v0001 -->
EOF

# 1 un-stamped artifact (the bug trigger)
cat > "$FIXTURE_DIR/unstamped.md" <<'EOF'
# Older artifact predating the stamping convention
content
EOF

# 1 stamped artifact with multiple produced-by lines (tests dedup-by-line)
cat > "$FIXTURE_DIR/multistamp.md" <<'EOF'
# Multi-stamp
content
<!-- created-at: 2026-04-01T00:00:00Z -->
<!-- produced-by skill-delta@v0001 -->
<!-- produced-by skill-delta@v0002 -->
EOF

# Run harvest against the fixture (direct invocation of local source)
OUTPUT="$(bash "$SCRIPT" harvest "$FIXTURE_DIR")"
RC=$?

# Assertion 1: harvest exits 0 (no silent abort)
[ "$RC" = "0" ] || fail "harvest exited $RC, expected 0"

# Assertion 2: every distinct produced-by line is in output
echo "$OUTPUT" | grep -Fxq "<!-- produced-by skill-alpha@v0001 -->" || fail "missing skill-alpha@v0001"
echo "$OUTPUT" | grep -Fxq "<!-- produced-by skill-beta@v0001 -->"  || fail "missing skill-beta@v0001"
echo "$OUTPUT" | grep -Fxq "<!-- produced-by skill-gamma@v0001 -->" || fail "missing skill-gamma@v0001"
echo "$OUTPUT" | grep -Fxq "<!-- produced-by skill-delta@v0001 -->" || fail "missing skill-delta@v0001"
echo "$OUTPUT" | grep -Fxq "<!-- produced-by skill-delta@v0002 -->" || fail "missing skill-delta@v0002"

# Assertion 3: no duplicate stamp lines (dedup verified — each line appears exactly once)
DUPS="$(echo "$OUTPUT" | sort | uniq -d)"
[ -z "$DUPS" ] || fail "duplicate stamp lines emitted: $DUPS"

# Assertion 4: ordering reflects timestamps oldest-first across emitted stamps
ALPHA_POS="$(echo "$OUTPUT" | grep -nFx "<!-- produced-by skill-alpha@v0001 -->" | head -1 | cut -d: -f1)"
BETA_POS="$(echo "$OUTPUT" | grep -nFx "<!-- produced-by skill-beta@v0001 -->"  | head -1 | cut -d: -f1)"
GAMMA_POS="$(echo "$OUTPUT" | grep -nFx "<!-- produced-by skill-gamma@v0001 -->" | head -1 | cut -d: -f1)"
DELTA_POS="$(echo "$OUTPUT" | grep -nFx "<!-- produced-by skill-delta@v0001 -->" | head -1 | cut -d: -f1)"
[ "$ALPHA_POS" -lt "$BETA_POS" ]  || fail "ordering: alpha ($ALPHA_POS) should precede beta ($BETA_POS)"
[ "$BETA_POS"  -lt "$GAMMA_POS" ] || fail "ordering: beta ($BETA_POS) should precede gamma ($GAMMA_POS)"
[ "$GAMMA_POS" -lt "$DELTA_POS" ] || fail "ordering: gamma ($GAMMA_POS) should precede delta ($DELTA_POS)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: harvest tolerates un-stamped artifacts and emits stamps in order"
```

Make the file executable:

```bash
chmod +x tests/test-harvest-trailer-write.sh
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-harvest-trailer-write.sh`
Expected: FAIL with `harvest exited 1, expected 0` and missing stamp assertions, because the un-stamped `unstamped.md` triggers the silent-abort bug before harvest reaches the stamped artifacts.

- [ ] **Step 3: Apply the swallow-the-exit fix to `do_harvest`**

Modify `chester-util-config/chester-trailer-write.sh` line 79. Current line:

```bash
    created="$(grep -E '^<!-- created-at: ' "$file" | head -1 | sed -E 's/^<!-- created-at: (.*) -->$/\1/')"
```

Replace with the line below — the `|| :` is appended INSIDE the `$(...)` command substitution, immediately after the closing single-quote of the `sed` argument and before the `)"` that closes the substitution and string:

```bash
    created="$(grep -E '^<!-- created-at: ' "$file" | head -1 | sed -E 's/^<!-- created-at: (.*) -->$/\1/' || :)"
```

The `|| :` belongs INSIDE the command substitution. Inside `$(...)`, with pipefail enabled, the pipeline exits non-zero on no-match; the `|| :` swallows that exit so the command substitution captures empty and exits 0. The outer assignment then succeeds. The existing fallback at line 80 sets the far-future placeholder for the empty capture.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-harvest-trailer-write.sh`
Expected: `PASS: harvest tolerates un-stamped artifacts and emits stamps in order`

Also run the full test suite to confirm no regression:

```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done | grep -E "^FAIL" || echo "all PASS"
```
Expected: `all PASS`

- [ ] **Step 5: Commit**

```bash
git add tests/test-harvest-trailer-write.sh chester-util-config/chester-trailer-write.sh
git commit -m "fix(trailer-write): tolerate un-stamped artifacts in harvest

The do_harvest function's per-artifact timestamp-capture pipeline returned
non-zero when grep found no created-at trailer, which under set -e + pipefail
silently aborted the whole script before the line-80 fallback could run.

Append || : to the pipeline so the no-match path returns 0; the fallback now
executes as designed, marking un-stamped artifacts with the far-future placeholder.

Adds tests/test-harvest-trailer-write.sh — first test for harvest, covers the
bug trigger, timestamp ordering, dedup, and multi-stamp files via a self-
contained synthetic fixture invoking the local source directly (not via PATH)."
```

---

## Task 2: Audit sibling pipelines under confidence-bias rule

**Type:** docs-producing
**Execution:** inline (per hybrid override — comment additions to a bash file with no behavior change)
**Implements:** AC-2.1
**Decision budget:** 1 (whether the awk-in-loop pipeline at lines 81-83 needs a safety comment beyond its no-match-safe nature)
**Must remain green:** `tests/test-harvest-trailer-write.sh`, all `tests/test-stamping-*.sh`

**Files:**
- Modify: `chester-util-config/chester-trailer-write.sh:80-89` (add safety-invariant comments at audit sites)

**Steps:**

- [ ] **Step 1: Audit the per-artifact awk pipeline at lines 81-83**

The awk command does not return non-zero for no-match (awk processes input regardless of pattern matches). The redirect `>> "$tmp"` could fail under disk-full or permission errors, but those are runtime-environment hazards, not data-shape hazards. Per confidence-bias rule, this site is safe under known invariants.

Add a one-sentence safety invariant comment as a NEW line inserted between the existing line 80 (fallback) and the existing line 81 (start of the awk block). After insertion, the comment is on the new line 81 and the awk block shifts to lines 82-84. Comment text:

```bash
    # Audit (task-02): awk does not return non-zero for no-match — pipeline is no-match-safe.
```

- [ ] **Step 2: Audit the end-of-function sort+awk pipeline at lines 87-88**

The pipeline runs `sort` + `awk` over `$tmp`. Sort exits 0 on empty input; awk exits 0 on empty input. Both segments are no-match-safe today. A future change to the sort flags (e.g. `-c` for "check sorted") or the awk pattern (e.g. requiring at least one match) could violate this invariant.

Add a one-sentence safety invariant comment immediately above the sort line:

```bash
  # Audit (task-02): sort and awk both exit 0 on empty input — pipeline is empty-input-safe under the loop's current contract.
```

- [ ] **Step 3: Verify no behavior change**

Run: `bash tests/test-harvest-trailer-write.sh`
Expected: `PASS: ...` (still green)

Run: `for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done | grep -E "^FAIL" || echo "all PASS"`
Expected: `all PASS`

- [ ] **Step 4: Commit**

```bash
git add chester-util-config/chester-trailer-write.sh
git commit -m "docs(trailer-write): annotate harvest's no-match-safe pipelines (task-02 audit)

Per task-02's confidence-bias audit rule: each pipeline-and-strict-mode interaction
in do_harvest carries either a hardening change (Task 1's || :) or a one-sentence
safety invariant comment naming the invariant that keeps it safe today.

The awk-in-loop and end-of-function sort+awk pipelines are no-match-safe; the
comments document the invariants so future changes don't silently break them."
```

---

## Task 3: Master-plan §4.4.2 rewrite + sync to plans/

**Type:** docs-producing
**Execution:** inline (per hybrid override — text edits and a sync commit on main)
**Implements:** AC-4.1
**Decision budget:** 1 (exact wording of the descriptive replacement; spec specifies the shape but not the literal text)
**Must remain green:** none (docs-only, no test impact)

**Files:**
- Modify: `docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md` (frontmatter version, §4.4.2 entry, §9 if it references task-02 status)
- Modify: `docs/chester/plans/20260430-02-rebuild-design-derivation/master-plan.md` (synced from working via cp)

**Steps:**

- [ ] **Step 1: Apply descriptive-replacement rewrite to working/master-plan.md §4.4.2**

Replace the §4.4.2 scope paragraph (currently attributing the bug to "master-mode nested directory layout") with corrected wording that:
- Names the real fault pattern: strict-mode shell discipline (`set -euo pipefail`) plus a no-match grep pattern in the per-artifact timestamp-capture pipeline.
- Names the real trigger condition: any sprint with at least one un-stamped artifact present in the iterated directory (not master-mode-specific).
- Includes a one-clause aside acknowledging the original wrong attribution: "originally suspected master-mode nested directory layout; investigation showed the strict-mode plus no-match interaction."
- Corrects the existing "B.2 summary L178" reference to "B.2 summary L179" (the parenthetical actually lives at line 179).

Replace the §4.4.2 exit-criteria bullets with:
- "Failure mode reproduced under any sprint layout (master-mode or flat) with un-stamped artifacts present."
- "Root cause identified: `set -e` + pipefail + grep-no-match silent abort in the per-artifact loop's timestamp-capture pipeline."
- "Fix applied to `chester-util-config/chester-trailer-write.sh` `do_harvest` function."
- "Audit findings present in `do_harvest`: every pipeline-and-strict-mode interaction either hardened or carrying a one-sentence safety invariant comment (confidence-bias rule)."
- "Test added (`tests/test-harvest-trailer-write.sh`) covering the bug trigger plus harvest's existing-but-untested behaviors via a synthetic rich-shape fixture."
- "Paper-trail corrections: this entry rewritten; closing-cluster summary L179 erratum landed."

Bump the frontmatter `version` field from `v01.04` to `v01.05` and update `version_date` to today's date.

If §9 (Active Sub-Sprint) carries any reference to task-02's previous wrong-attribution wording, update there too. Otherwise leave §9 untouched.

- [ ] **Step 2: Verify the working master-plan reads cleanly**

Run: `grep -A 3 "task-02 — Fix" docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md`
Expected: shows the rewritten scope paragraph with no "master-mode nested directory layout" claim.

Run: `grep "B.2 summary L17" docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md`
Expected: shows L179, no L178.

- [ ] **Step 3: Sync working master-plan to plans/master-plan via the living-document pattern**

```bash
cp docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md \
   docs/chester/plans/20260430-02-rebuild-design-derivation/master-plan.md
```

This is the same sync pattern used earlier in this master plan's lifecycle (commits 57af718, 92db92f, f977609) to close the living-document gap at point-in-time.

- [ ] **Step 4: Commit on main (NOT in the worktree)**

The master-plan sync commit goes on main, not the task-02 branch, because `plans/master-plan.md` is a cross-task living document. Use the absolute path to the main checkout for every git operation in this step — do not rely on `git rev-parse --show-toplevel` (which would return the worktree root, not main).

The main checkout is at `/home/mike/Documents/CodeProjects/Chester`. The cp in Step 3 already updated `plans/master-plan.md` at the main checkout's path (since `docs/chester/plans/` is a tracked directory whose absolute path is the same regardless of which worktree you're invoked from — but only the main checkout's `.git` directory tracks it as part of `main`).

Run, with the absolute path, from any directory:

```bash
MAIN_CHECKOUT="/home/mike/Documents/CodeProjects/Chester"
git -C "$MAIN_CHECKOUT" add docs/chester/plans/20260430-02-rebuild-design-derivation/master-plan.md
git -C "$MAIN_CHECKOUT" commit -m "docs(master-plan): correct task-02 scope attribution (task-02 mid-task sync)

§4.4.2 originally attributed the harvest empty-result bug to master-mode nested
directory layout. Investigation 2026-05-04 established the real root cause:
set -e + pipefail interacting with a no-match grep in the per-artifact timestamp
pipeline. Bug is independent of layout and reproduces on flat sprint dirs.

This commit lands the corrected §4.4.2 (descriptive replacement with one-clause
attribution-correction aside; exit criteria rewritten; B.2 L178 line ref corrected
to L179) on main via the living-document sync pattern, ahead of the task-02
archive step.

Frontmatter v01.04 → v01.05."
```

Verify the commit landed on main:

```bash
git -C "$MAIN_CHECKOUT" log --oneline -1 main
```
Expected: shows the just-created commit's first line.

Verify the task-02 worktree branch did NOT receive a phantom commit:

```bash
git -C "/home/mike/Documents/CodeProjects/Chester/.worktrees/task-02-fix-trailer-write-harvest" log --oneline -1
```
Expected: shows the `f977609` commit (or whatever task-02's pre-task base was), NOT the just-created docs commit.

- [ ] **Step 5: No worktree commit needed**

The working/master-plan.md edit is shared between worktree and main checkout (gitignored). The plans/master-plan.md sync committed on main above is the authoritative version. The task-02 worktree branch will receive the change via finish-archive-artifacts at sub-sprint close (it copies the entire working master tree into the worktree's plans/ for the archive commit).

---

## Task 4: B.2 summary L179 erratum

**Type:** docs-producing
**Execution:** inline (per hybrid override — single-paragraph erratum insertion)
**Implements:** AC-4.2
**Decision budget:** 1 (exact wording of the erratum, mirroring task-01's L127 erratum format)
**Must remain green:** none (docs-only, no test impact)

**Files:**
- Modify: `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md` (insert erratum after L179)

**Steps:**

- [ ] **Step 1: Read task-01's L129 erratum as the format reference**

The task-01 erratum is at `docs/chester/plans/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md` line 129. Inspect its shape:

```bash
sed -n '125,131p' docs/chester/plans/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md
```

The format: italicized line opening with `*Erratum (YYYY-MM-DD, task-NN-slug):`, naming the original wrong claim and the actual reality, closing italic.

- [ ] **Step 2: Insert the L179 erratum**

Open `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md`. Locate line 179 (the parenthetical `(Harvested manually from artifact trailers — ...)`. Insert a blank line after it, then the erratum, then another blank line:

```markdown
*Erratum (2026-05-04, task-02-fix-trailer-write-harvest): the path-resolution attribution above is wrong. Investigation 2026-05-04 established the real root cause: `chester-util-config/chester-trailer-write.sh` `do_harvest` runs under `set -euo pipefail`, and the per-artifact timestamp-capture pipeline at line 79 returns non-zero on no-match (older artifacts predating the stamping convention), which silently aborts the whole script before the fallback at line 80 can execute. Fixed by appending `|| :` to the pipeline. Independent of master-mode layout.*
```

The erratum annotates without erasing — the original L179 parenthetical text remains untouched.

- [ ] **Step 3: Verify the edit landed cleanly**

Run: `grep -A 2 "Erratum (2026-05-04, task-02" docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md`
Expected: shows the erratum block.

Run: `grep "Harvested manually" docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md`
Expected: still shows the original parenthetical (preserved).

- [ ] **Step 4: No commit needed at this step**

The closing-cluster summary lives in working/ (gitignored). The plans/ mirror is updated automatically at finish-archive-artifacts when task-02 closes. Unlike master-plan.md (which is a cross-task living document needing mid-task sync per Task 3), this summary is a single-task historical artifact — archive-step sync is sufficient.

---

## Handoff Notes for Finish Phase

- **AC-3.3 verification** is owned by `execute-verify-complete` — the gate at the end of execute-write runs the full test suite and confirms zero failures. No explicit plan task needed.
- **AC-5.1 end-to-end validation** is finish-phase, not execute-phase. The `finish-write-records` skill invokes `chester-trailer-write harvest` via the PATH wrapper (which execs the plugin cache). For the Session Skill Versions section to populate correctly, the implementer must run `/refresh-chester` after Task 1's commit lands and BEFORE running finish-write-records. Without the cache refresh, finish-write-records would invoke the un-fixed plugin copy and silently emit empty harvest output.
- **Archive step** copies the working master tree (including the corrected working/master-plan.md and the working/B.2 summary erratum) into the task-02 branch's plans/. The mid-task master-plan sync (Task 3) ensures plans/master-plan.md is consistent on main throughout the task; the archive commit lands the final master-tree snapshot on the task-02 branch for merge.

<!-- created-at: 2026-05-04T10:52:59Z -->
<!-- produced-by plan-build@v0004 -->
