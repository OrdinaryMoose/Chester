# Conservator Transcript — Round 04
# Sprint: 20260604-02-review-start-context
# Role: Conservator
# Date: 2026-06-06
# Phase: BUILD (decompose spec into ordered implementation tasks)

---

## Lens

Conservator priority: safe sequencing (P2), no broken tree between tasks (P5). Every
task lands on a tree that passes existing tests and does not break the next task's
preconditions. The marker contract is the critical dependency: mandate-block markers
must exist in SKILL.md before the stub heredoc is assembled and before T8 can pass.

---

## Ground-Truth Inventory (pre-transcript reads)

**Spec (final, Option B):** §5.2 removes Checks 0–3 from SKILL.md; the `## Session
Housekeeping` heading itself is retained (wizard branch stays). §5.1 wide-strip sed
expression pins on `## Session Housekeeping` → `## How to Access Skills`. §4.3 requires
HTML-comment mandate-block markers in SKILL.md for the bidirectional drift test (T8).

**session-start:** 33 lines, zero stdin read, single `cat` of SKILL.md. Full rewrite.

**hooks.json:** unchanged throughout (split-and-keep).

**test-start-cleanup.sh:** line 7 asserts `grep -q "Session Housekeeping" SKILL.md`.
Heading survives Option B — assertion still passes after check removal.

**Cross-reference check (P6):**
- `start-bootstrap/SKILL.md:35` — mentions "Run setup-start" in the "no config" warn
  path. References the skill name, not the check bodies. Not broken by check removal.
- `util-artifact-schema/SKILL.md:46` — mentions "setup-start first or use defaults."
  No check-body reference.
- `execute-write/SKILL.md` — no Session Housekeeping or check references.
- `docs/chester/plans/` references to Check 0–3 are in archived sprint docs. Read-only
  institutional memory; no live behavior depends on them.
- No live skill, hook, or test asserts the presence of Check 0, 1, 2, or 3 by name.

**DMed researcher** to confirm: (1) heading retained post-check-removal (test-start-
cleanup.sh still passes), (2) session-start rewrite line-count estimate, (3) any other
tests that grep SKILL.md content. Transcript written before confirmation; will revise
if researcher contradicts.

---

## P1. Task Decomposition

Four tasks. One-surface-per-task. Each task leaves the tree in a passing state.

**Task 1 — Add mandate-block markers to SKILL.md**
Surface: `skills/setup-start/SKILL.md` only.
Add HTML-comment `<!-- mandate-block:X start -->` / `<!-- mandate-block:X end -->` pairs
around each of the 8 mandate blocks (spec §4.3). No other SKILL.md change in this task.
Version field: NOT bumped yet (markers are invisible in rendered Markdown; the
skill's behavior is unchanged until Task 4 changes the content).

Rationale for splitting markers from check removal: Task 2 (the T8 drift test) reads
the markers. Task 4 (session-start rewrite) copies marked blocks into the heredoc. Both
depend on the markers existing and being correct. Landing markers alone in Task 1 is
safe: the existing session-start still works (it ignores HTML comments), existing tests
still pass, and the markers can be visually verified before anything depends on them.

**Task 2 — Write test-session-start.sh (red phase)**
Surface: `tests/test-session-start.sh` (new file).
Write all 8 tests (T1–T8) against the CURRENT session-start. T1–T7 will FAIL (session-
start does not yet branch). T8 (drift test) will FAIL (stub heredoc doesn't exist yet).
This is the TDD red phase — all tests written and confirmed-red before any rewrite.

Rationale for test-before-rewrite: the test file is the spec's executable form. Writing
it against the current (broken) state confirms the assertions are syntactically correct
and exercise the right surfaces. It also makes the green phase unambiguous — run the
same tests, confirm all 8 pass.

Note on T8 implementation: T8 requires reading SKILL.md's `mandate-block:*` regions
(from Task 1) and comparing them against the stub. Task 1 must be complete before T8
can be written correctly. Sequencing: Task 1 → Task 2.

**Task 3 — Remove Checks 0–3 from SKILL.md; bump version to v0003**
Surface: `skills/setup-start/SKILL.md` only.
Remove the returning-session branch (lines ~113–161: the "If CHESTER_CONFIG_PATH is not
none" block through "After checks, always echo BOTH resolved paths"). The `## Session
Housekeeping` heading and the shared `eval` + first-run wizard (if-none branch) remain.
Bump version frontmatter v0002 → v0003.

Rationale for separating from Task 4: check removal is a SKILL.md content edit, not a
session-start change. Landing it before the session-start rewrite means: (a) the
existing session-start (which emits the full body) now emits the post-removal body on
startup — correct, because established projects no longer need the checks; (b) if
session-start rewrite goes wrong, rollback is simpler (only Task 4 to revert); (c) the
SKILL.md diff in the merge commit is clean.

Tree state after Task 3: existing session-start emits the trimmed body unconditionally.
T1–T7 still fail (no branching). T8 still fails (no heredoc). test-start-cleanup.sh
still passes (heading retained). test-compaction-hooks.sh still passes (unrelated). All
existing tests green.

**Task 4 — Rewrite session-start (green phase)**
Surface: `chester-util-config/session-start` only.
Rewrite the script to:
1. `INPUT=$(cat)` + `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // "")`.
2. If `TRIGGER == "compact"` → emit compact-stub heredoc → exit 0.
3. Else → `eval "$(chester-config-read)"` + optional wide-strip + emit full body.

The compact-stub heredoc copies the 8 mandate blocks verbatim from SKILL.md (marked in
Task 1, at their post-Task-3 state — checks already removed, so the body the heredoc
must match is final).

After Task 4: all 8 tests in T1–T8 go green. test-compaction-hooks.sh still passes.
test-start-cleanup.sh still passes.

---

## P2. Sequencing + Dependencies

```
Task 1 (markers in SKILL.md)
  └─→ Task 2 (write test file — T8 reads markers)
        └─→ Task 3 (remove checks, bump version)
              └─→ Task 4 (rewrite session-start — heredoc copies post-Task-3 body)
                    └─→ Run all tests: T1–T8 green + existing suite green
```

**Why Task 3 must precede Task 4 (not follow):**
The compact-stub heredoc in Task 4 copies the mandate blocks verbatim from SKILL.md as
they exist at heredoc-write time. If Task 4 runs before Task 3, the heredoc is copied
from a SKILL.md that still contains Checks 0–3. Then Task 3 removes the checks. Now
T8's drift test reads the post-removal SKILL.md and compares it against a heredoc that
was copied from the pre-removal SKILL.md — the `## Instruction Priority` block
boundaries haven't changed, but any whitespace or context near the removed checks could
affect the copy. More importantly, the spec says the heredoc must reflect the canonical
SKILL.md; running Task 4 before Task 3 requires a second heredoc update after Task 3.
Wrong order = two touches on session-start.

**Why Task 2 (tests) before Task 3 and Task 4:**
Confirmed-red tests before any behavioral change is standard TDD discipline. It also
validates T8's extraction logic against the markers (from Task 1) while the SKILL.md
body is still full-size — the markers themselves are the T8 anchor, not the check
presence, so T8 can be written and confirmed-structurally-correct in Task 2 even though
it will fail (no heredoc yet).

**Gate: existing tests must pass after every task.** If any existing test goes red
between tasks, stop and fix before proceeding.

---

## P3. Per-Task Contract

### Task 1 — Mandate-block markers
- **Files touched:** `skills/setup-start/SKILL.md`
- **Changes:** 16 HTML comment lines inserted (8 start + 8 end markers), no other edits
- **Done criteria:**
  - `grep -c "mandate-block:" SKILL.md` returns 16 (8 pairs)
  - Markers surround exactly the 8 blocks listed in spec §4.2
  - Existing session-start emits markers as part of the injected body (benign; HTML
    comments are invisible in rendered Markdown, harmless in the injection)
  - All existing tests pass
- **Next task depends on:** markers at their final positions, named correctly

### Task 2 — test-session-start.sh (red)
- **Files touched:** `tests/test-session-start.sh` (new)
- **Changes:** ~83 lines, 8 test functions T1–T8
- **Done criteria:**
  - T1–T7: run script with appropriate stdin, assert output — all FAIL (expected)
  - T8: assert every mandate-block region from SKILL.md appears in stub output — FAILS
    because no stub output exists yet (expected)
  - Test file passes `bash -n` (no syntax errors) and `set -euo pipefail`
  - All existing tests (test-compaction-hooks.sh, test-start-cleanup.sh, etc.) still pass
- **Next task depends on:** test assertions are syntactically correct and logically cover
  the spec's acceptance criteria

### Task 3 — Remove Checks 0–3; version bump
- **Files touched:** `skills/setup-start/SKILL.md`
- **Changes:**
  - Remove lines ~113–161 (the "If CHESTER_CONFIG_PATH is not none" returning-session
    branch: the transitional prose, Check 0, Check 1, Check 2, Check 3, and the "After
    checks, echo BOTH paths" section)
  - Retain: `## Session Housekeeping` heading, the shared `eval "$(chester-config-read)"`
    preamble line, the first-run wizard (if-none branch)
  - Bump frontmatter: `version: v0002` → `version: v0003`
- **Done criteria:**
  - `grep -q "Check 0:\|Check 1:\|Check 2:\|Check 3:" SKILL.md` returns nothing
  - `grep -q "Session Housekeeping" SKILL.md` returns match (heading retained)
  - `grep -q "First-run project configuration" SKILL.md` returns match (wizard retained)
  - `grep -q "version: v0003" SKILL.md` returns match
  - test-start-cleanup.sh PASSES (heading present; no archived skill references added)
  - All other existing tests pass
  - T1–T7 still fail, T8 still fails (expected — no heredoc yet)
- **Next task depends on:** SKILL.md in its final production state (no further content
  changes planned after this task)

### Task 4 — session-start rewrite (green)
- **Files touched:** `chester-util-config/session-start`
- **Changes:** full rewrite (~95–105 lines):
  - Add `INPUT=$(cat)` + jq trigger parse at top (~4 lines)
  - Compact branch: `cat <<'EOF' … EOF` heredoc of 8 blocks (57 lines of mandate
    content verbatim from post-Task-3 SKILL.md, with markers stripped from the copy;
    plus orientation line + heredoc envelope = ~62 lines total for the stub)
  - Full-payload path: `eval "$(chester-config-read)"` + CHESTER_CONFIG_PATH branch
    + conditional wide-strip sed + existing escape_for_json + printf emission (~10
    net-new lines; ~33 existing lines retained)
  Note: the heredoc body (57 lines) is the bulk of the length. Estimate from researcher
  direct-count of mandate blocks: ~100 lines total.
- **Done criteria (acceptance criteria from spec §10):**
  - T1: PASS — compact emits all 8 mandate blocks
  - T2: PASS — compact output contains no "Session Housekeeping" content
  - T3: PASS — startup + established config, housekeeping absent
  - T4: PASS — startup + no config, housekeeping present
  - T5: PASS — clear + established config, same as T3
  - T6: PASS — absent trigger → full payload
  - T7: PASS — malformed JSON → full payload, exit 0
  - T8: PASS — bidirectional drift test, every marked block present verbatim in stub
  - test-compaction-hooks.sh PASSES (unaffected)
  - test-start-cleanup.sh PASSES (unaffected)
- **Next task depends on:** nothing — this is the final implementation task

---

## P4. Test Mapping (TDD)

| Test | Written in | Red confirmed | Green after |
|------|-----------|---------------|-------------|
| T1 compact → blocks present | Task 2 | Task 2 | Task 4 |
| T2 compact → housekeeping absent | Task 2 | Task 2 | Task 4 |
| T3 startup+established → HK absent | Task 2 | Task 2 | Task 4 |
| T4 startup+new-project → HK present | Task 2 | Task 2 | Task 4 |
| T5 clear+established → HK absent | Task 2 | Task 2 | Task 4 |
| T6 absent trigger → full | Task 2 | Task 2 | Task 4 |
| T7 malformed JSON → full | Task 2 | Task 2 | Task 4 |
| T8 drift bidirectional | Task 2 | Task 2 | Task 4 |

**All tests written before any behavioral change (Task 2 precedes Task 3 and Task 4).**
All go green in one step (Task 4). No partial green states between tasks.

**T8 implementation note:** T8 reads SKILL.md markers (from Task 1) to derive the
expected content, then greps the session-start output for that content. T8's logic:

```bash
# For each mandate-block:X region in SKILL.md, extract content
# Assert it appears verbatim in the compact-trigger output
# Assert compact output contains nothing outside the union of marked regions
#   + the orientation line
```

T8 is the most complex test (~16–20 lines). It must be written after Task 1 (markers
exist) but can be written before Task 3 (check removal does not affect the mandate
blocks' content or marker positions).

---

## P5. Rollback Safety

**Task 1 (markers):** fully reversible — remove the 16 HTML comment lines. No behavior
change; existing session-start is unaffected. Safe failure path: revert SKILL.md.

**Task 2 (tests):** reversible — delete the test file. No behavior change. The test
file failing red is the expected state; a broken test file is caught by `bash -n` before
commit. Safe failure path: fix syntax or delete file.

**Task 3 (check removal):** partially reversible. The existing session-start emits the
trimmed body after Task 3 — but the trimmed body is correct behavior for established
projects (Option B). The safe-failure path if Task 3 is wrong: revert SKILL.md. The
existing session-start unconditionally emits whatever SKILL.md contains, so a SKILL.md
revert immediately restores the full body. No session is left without the mandate;
only the housekeeping content changes.

**Task 4 (session-start rewrite):** the fallback rule (any non-"compact" trigger →
full payload) protects the mandate. If the wide-strip sed expression misfires:
- Worst case: strip matches nothing → full body emitted, including housekeeping → 
  established projects get extra ~1,188 tokens but the mandate is intact. Sessions
  work correctly, just without the saving.
- Edge case: strip matches too much → payload truncated. Caught by T3 (housekeeping
  absent check) but also T1 (mandate blocks present check) — T1 will fail if the
  mandate gets stripped. T3 is an absence assertion; if the sed expression deletes
  beyond the housekeeping section, T1 catches it.

If Task 4 goes wrong: revert session-start to the pre-rewrite 33-line script. Sessions
immediately restore to the current full-body unconditional emit. The mandate is never
lost in this revert path.

**No task leaves the repo in a state where sessions lose the mandate.** The mandate
is in SKILL.md (Tasks 1 and 3 do not touch mandate blocks) and in the heredoc (Task 4
copies from SKILL.md). Until Task 4 lands, the current session-start emits the full
body unconditionally — the safe fallback is identical to the current production state.

---

## P6. Cross-Reference Risk: Removing Checks 0–3

**Live skills — no references to check bodies:**
- `start-bootstrap/SKILL.md:35` mentions "Run setup-start" as a warning when config is
  absent. This is a skill-invocation reference, not a reference to Checks 0–3. Unaffected.
- `util-artifact-schema/SKILL.md:46` mentions "setup-start first or use defaults."
  Unaffected.
- No other live skill in `skills/` references Check 0, 1, 2, or 3 by name.

**Archived plans — read-only:**
- `docs/chester/plans/20260408-02-artifact-directory-worktree-clarity/spec/` references
  "Check 2 (working dir IS gitignored)" and "Check 3 (plans dir is NOT gitignored)."
  These are archived sprint artifacts, not live behavior documents. Read-only; no update
  needed.

**tests/ — no check-body assertions:**
- `test-start-cleanup.sh` asserts `grep -q "Session Housekeeping" SKILL.md` (heading
  retained) and checks for archived skill name absences. Neither assertion touches check
  bodies. No update needed.
- `test-compaction-hooks.sh` is entirely unrelated to SKILL.md content.
- No other test file greps for "Check 0/1/2/3" content in SKILL.md.

**Conclusion:** removing Checks 0–3 breaks no live cross-references. The only risk is
the archived plan references — those are accurate descriptions of the prior behavior and
do not need updating (they describe what the sprint changed, not current behavior).

**One update required:** `test-start-cleanup.sh` currently passes because "Session
Housekeeping" survives. But the test's intent is "setup-start has session housekeeping."
After Option B, the heading stays but the checks are gone — the test is checking presence
of a heading that now covers only the first-run wizard. The test still passes (correct
behavior), but a note in the task plan should flag that `test-start-cleanup.sh` may need
a description update if its intent is "checks present" not just "heading present." This
is not a breakage — it is a semantic drift between test description and behavior. Record
in the implementation notes but do not block any task on it.

---

## Summary

**Ordered task list:**

1. Task 1 — Add 8 mandate-block marker pairs to SKILL.md (markers only, no other change)
2. Task 2 — Write test-session-start.sh, confirm all 8 tests red
3. Task 3 — Remove Checks 0–3 from SKILL.md, bump version v0002→v0003
4. Task 4 — Rewrite session-start (stdin branch + compact heredoc + wide-strip), confirm
   all 8 tests green + full existing suite green

**Invariants:**
- Existing tests pass after every task
- Mandate never lost in any rollback path
- The heredoc in Task 4 is copied from the post-Task-3 SKILL.md (final state)
- T8 is written in Task 2 (after markers exist), goes green in Task 4

---

## Peer Question

DM sent to researcher before transcript written:

> (1) Does the `## Session Housekeeping` heading stay in SKILL.md after check removal,
>     so test-start-cleanup.sh line 7 still passes?
> (2) Rough line count for the session-start rewrite — ~60–70 lines?
> (3) Any other test files that grep SKILL.md content and would break on check removal?

Load-bearing for P3 (done criteria) and P6 (cross-reference risk). Will revise if
researcher contradicts any of the three claims.

---

## Revision Status

**All three confirmed** by researcher (2026-06-06):

1. `## Session Housekeeping` heading retained after Option B check removal. Lines 113–160
   removed (returning-session branch); heading at line 29, wizard at lines 33–111 stay.
   test-start-cleanup.sh line 7 still passes. Confirmed.

2. Session-start rewrite LOC revised: ~95–105 lines (not ~60–70). The stub heredoc
   content alone is 57 lines (mandate blocks direct-counted from SKILL.md). Task 4
   task-sizing updated accordingly in P3. Confirmed with correction.

3. No other test file greps setup-start/SKILL.md content or breaks on Checks 0–3
   removal. Exhaustive grep across all tests/test-*.sh confirmed zero hits on check-body
   strings. test-config-read-new.sh tests the binary output, not SKILL.md content.
   Confirmed.

Position locked. All items confirmed (one with correction to LOC estimate).

<!-- produced-by: conservator / round04 / 2026-06-06 -->
