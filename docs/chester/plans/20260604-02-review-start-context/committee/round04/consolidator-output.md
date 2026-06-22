# Consolidator Output — Round 04
# Sprint: 20260604-02-review-start-context
# Phase: BUILD — implementation plan from spec (Option B, wide-strip)
# Date: 2026-06-06

---

## 1. Per-Member Task Lists, Counts, and Proposed Sequences

### Conservator — 4 tasks

1. Task 1: Add mandate-block markers to SKILL.md (markers only; no content change, no version bump)
2. Task 2: Write test-session-start.sh — all 8 tests RED against current session-start
3. Task 3: Remove Checks 0–3 from SKILL.md; bump v0002 → v0003
4. Task 4: Rewrite session-start (stdin branch + compact heredoc + wide-strip) — all 8 tests GREEN

Sequence: Task 1 → Task 2 → Task 3 → Task 4 → run existing suite

**Count: 4**

---

### Innovator — 5 tasks

1. Task 1: Edit SKILL.md — add markers + remove Checks 0–3 + version bump (combined SKILL.md pass)
2. Task 2: Rewrite session-start — trigger branch + compact stub heredoc + full-path gate
3. Task 3: Write tests T1–T7 (behavior tests) — all PASS after Task 2
4. Task 4: Write T8 (drift test) — extends Task 3's file; PASS after Task 2
5. Task 5: Final integration check — run full test suite; confirm no regressions

Sequence: Task 1 → Task 2 → Task 3 → Task 4 → Task 5

**Count: 5**

---

### Pragmatist — 4 tasks

1. Task 1: Edit SKILL.md — add markers + remove Checks 0–3 + version bump (combined SKILL.md pass)
2. Task 2: Rewrite session-start — trigger branch + compact stub heredoc + full-path gate
3. Task 3: New test-session-start.sh — 8 tests (T1–T8) — all PASS after Task 2
4. Task 4: Smoke-check — run full test suite; confirm existing tests unbroken

Sequence: Task 1 → Task 2 → Task 3 → Task 4

**Count: 4**

---

### Purist — 5 tasks

1. Task 1: Establish mandate-marker contract in SKILL.md (markers only; no version bump)
2. Task 2: Retire Checks 0–3 from SKILL.md; bump v0002 → v0003
3. Task 3: Rewrite session-start — trigger branch + compact stub heredoc + wide-strip
4. Task 4: Write tests/test-session-start.sh (T1–T8) — all GREEN
5. Task 5: Verify test-compaction-hooks.sh still passes

Sequence: Task 1 → Task 2 → Task 3 → Task 4 → Task 5

**Count: 5**

---

## 2. Enumerated Divergences

### (a) Markers + Check Removal: One SKILL.md Task vs. Two

**One task (Innovator, Pragmatist):**
- Both SKILL.md changes (markers + check removal + version bump) done in a single combined edit.
- Rationale: the heredoc in session-start must be copied from the final SKILL.md state; touching SKILL.md twice for the same file requires re-reading SKILL.md between tasks.
- Pragmatist: "SKILL.md edits (markers + check removal + version bump) are one atomic surface change. Markers must be in place before the session-start heredoc references them (for T8)."
- Innovator: "Why first: the markers are the source-of-truth for the heredoc content (Task 2) and the drift test (Task 4). You cannot write the heredoc correctly until you know the exact verbatim text of each marked block."

**Two tasks (Conservator, Purist):**
- Task 1 adds markers only; Task 2 (Conservator) or Task 2 (Purist) separately removes checks and bumps version.
- Conservator: adding markers vs. removing checks = different concerns, different failure modes, cleaner rollback.
- Purist: "Adding markers = defining the mandate delivery boundary... Removing Checks 0–3 = retiring a startup behavior... These are different failure modes, different test coverage, and different rollback criteria."
- Conservator additionally inserts test-writing (Task 2) between the two SKILL.md edits.

---

### (b) TDD Ordering: Tests First (Red) vs. Tests After (Green)

**Tests first, all red (Conservator):**
- Test file written in Task 2, BEFORE check removal (Task 3) and BEFORE session-start rewrite (Task 4).
- All 8 tests confirmed RED before any behavioral change.
- Conservator: "the test file is the spec's executable form. Writing it against the current (broken) state confirms the assertions are syntactically correct and exercise the right surfaces."

**Tests after implementation, going green immediately (Innovator, Pragmatist, Purist):**
- Test file written after session-start rewrite; tests are expected to pass on first run.
- Innovator Task 3: "Why after Task 2: the tests drive the implementation; they need the rewritten session-start to run against."
- Pragmatist: tests written as Task 3, after session-start rewrite (Task 2).
- Purist Task 4: "T1–T7 require session-start to exist and behave correctly (requires Task 3)."
- Innovator acknowledges the TDD deviation: "Deviation from strict TDD: T8 cannot be written first because it reads runtime artifacts (marked blocks) that don't exist until Task 1."

---

### (c) Marker Scheme: Uniform 8 HTML-Comment Pairs vs. 6 HTML + 2 XML-Reuse

**Uniform 8 HTML-comment pairs (Conservator, Pragmatist, Purist, draft-plan provisional):**
- All 8 blocks get `<!-- mandate-block:{slug} start -->` / `<!-- mandate-block:{slug} end -->` pairs.
- Slugs: `subagent-stop`, `extremely-important`, `instruction-priority`, `how-to-access`, `the-rule`, `red-flags`, `skill-types`, `user-instructions`.
- Draft plan provisional: "one convention, single dynamic grep, no author footgun."
- Conservator: specification requires 16 HTML comment lines (8 pairs); T8 reads markers; no special handling.
- Purist: explicitly specifies uniform HTML-comment format from spec §4.3; slugs shown in table.

**6 HTML-comment pairs + 2 XML-reuse (Innovator):**
- `SUBAGENT-STOP` and `EXTREMELY-IMPORTANT` already have XML-style delimiters (`<SUBAGENT-STOP>`, `</SUBAGENT-STOP>`, `<EXTREMELY-IMPORTANT>`, `</EXTREMELY-IMPORTANT>`). Innovator proposes the T8 awk extractor treat these as native markers without adding HTML comments around them.
- Innovator Task 1: "SUBAGENT-STOP and EXTREMELY-IMPORTANT use their existing XML tags (no new HTML comments for those two — the extractor handles both tag types)."
- Innovator's awk handles two tag types: XML-style for SUBAGENT-STOP/EXTREMELY-IMPORTANT; HTML-comment for the 6 heading-delimited blocks.
- Purist's answer to Innovator: "Two-tag-type design (XML delimiters for SUBAGENT-STOP/EXTREMELY-IMPORTANT, HTML-comment markers for 6 heading blocks) is structurally sound." Confirmed correct after peer exchange.
- Innovator post-peer update: "Two-tag-type design confirmed sound by purist."

---

### (d) T8 Assertion: Full-Block Verbatim Diff vs. First-Line Grep

**Full-block verbatim diff (Conservator, Purist; and Pragmatist post-peer-update):**
- Extract each mandate-block region from SKILL.md; extract same regions from compact `additionalContext` (decoded via `jq -r`); diff the two.
- Purist: "Assert verbatim equality, in order: diff <(echo "$EXPECTED_CONTENT") <(echo "$STUB_CONTENT"). Any diff = FAIL (covers cases a and b)."
- Purist ruling (decisive, transmitted to Pragmatist): "Full-block verbatim equality is required. First-line grep is insufficient... First-line grep misses: a word-level edit inside a block (e.g., '1% chance' → '2% chance' in EXTREMELY-IMPORTANT). First line still matches; T8 silently passes. That is spec §4.3 case (a)."
- Pragmatist revised T8 to full-block diff after the purist ruling.

**First-line grep (Pragmatist, pre-ruling):**
- Pragmatist initial: extract each marked region's first distinctive line; assert it appears in compact output via `grep -qF`.
- Pragmatist's concern: "full-block diff requires getting newline handling right across the escape_for_json transformation... First-line grep avoids that escaping complexity entirely."
- Dropped by Pragmatist after purist ruling confirmed `jq -r` exactly inverts `escape_for_json`.

---

### (e) LOC Estimates

| Member | session-start rewrite | test file | SKILL.md net | Total estimate |
|--------|-----------------------|-----------|--------------|----------------|
| Conservator | ~95–105 lines (updated from ~60–70 after researcher's direct mandate-block count) | ~83 lines | −33 net (~48 removed, +16 markers) | — |
| Innovator | "rewritten" (no final number stated explicitly); heredoc copies exact verbatim blocks | ~80–83 lines | ~175 lines post-edit | — |
| Pragmatist | 32 → ~67 lines (+35 net); stub heredoc ~35 lines | ~80 lines | +16 markers, −49 checks, −33 net; 207 → ~174 | ~148 total new/changed (matches spec); 82 net |
| Purist | ~95–105 lines (cited from draft-plan "done" criteria) | ~8 tests; no explicit line count | 16 added + ~48 removed | — |
| Researcher (confirmed) | 33 lines current; mandate blocks direct-counted = 57 lines heredoc content; total ~95–105 | — | Checks 0–3 at lines 113–160 (remove 48 lines) | — |
| Draft-plan | ~95–105 lines (heredoc ~57 lines); ~148 LOC new/changed | — | — | ~148 |

LOC convergence point: ~148 new/changed LOC total. Heredoc content ~57 lines. Full rewrite ~95–105 lines.

---

## 3. Convergences

- **Strict linear sequencing.** All members: Task 1 (SKILL.md) → implementation (session-start) → tests → regression check. No member proposes parallel execution.

- **Inline execution mode.** All members. Pragmatist explicitly: "Recommendation: inline. Rationale: 3 code tasks + 1 run task. Small total surface (~148 LOC). Tasks are tightly coupled." Draft plan: "round04 unanimous."

- **Marker contract as the load-bearing interface.** All members: SKILL.md markers must be established before the session-start heredoc is written and before T8 can be written or run. This dependency chain is explicit in every plan.

- **Heredoc copied post-edit SKILL.md.** All members: the compact-stub heredoc in session-start must be copied from SKILL.md in its final state (after check removal), not from an intermediate state. Conservator, Purist: this is the explicit rationale for Task 2 (check removal) preceding Task 4 (rewrite). Innovator, Pragmatist: combined SKILL.md edit precedes session-start rewrite for the same reason.

- **~148 LOC total new/changed.** All members and the draft plan converge on this figure. Researcher direct-count confirms: heredoc content alone is 57 lines; full rewrite ~95–105 lines; test file ~80 lines.

- **Zero existing tests break.** All members. Researcher decisive: `test-start-cleanup.sh` greps `## Session Housekeeping` heading (survives Option B); `test-compaction-hooks.sh` tests PreCompact/PostCompact hooks only; no other test file greps SKILL.md content relevant to checks. Post-implementation regression check appears as the final task in every plan.

---

## 4. Marker-Contract Slug Specification

### 8 Slugs (in SKILL.md order)

| # | Slug | Content anchored to | SKILL.md lines (pre-implementation) |
|---|------|--------------------|------------------------------------|
| 1 | `subagent-stop` | `<SUBAGENT-STOP>` … `</SUBAGENT-STOP>` | 7–9 |
| 2 | `extremely-important` | `<EXTREMELY-IMPORTANT>` … `</EXTREMELY-IMPORTANT>` | 11–17 |
| 3 | `instruction-priority` | `## Instruction Priority` … end of priority list prose | 19–27 |
| 4 | `how-to-access` | `## How to Access Skills` … `**In Claude Code:**...` line | 162–164 |
| 5 | `the-rule` | `# Using Skills` H1 … end of The Rule body | 166–172 |
| 6 | `red-flags` | `## Red Flags` … end of table | 174–191 |
| 7 | `skill-types` | `## Skill Types` … end of rigid/flexible prose | 193–199 |
| 8 | `user-instructions` | `## User Instructions` … end of one-line body | 205–207 |

Note: `## Choosing Between Skills` (lines 201–203) is explicitly NOT marked (non-mandate).

### Syntax (uniform HTML-comment form — provisional, attack target #1)

```
<!-- mandate-block:{slug} start -->
<block content>
<!-- mandate-block:{slug} end -->
```

- Marker placed immediately before first content line and immediately after last content line.
- Blank lines between blocks are OUTSIDE markers (not included in marked region).
- 16 total comment lines (8 start + 8 end pairs).

### Alternative syntax (Innovator — 6 HTML + 2 XML-reuse)

- Blocks 1–2 (`subagent-stop`, `extremely-important`): use existing XML delimiters natively; no new HTML-comment markers added.
- Blocks 3–8: same `<!-- mandate-block:{slug} start/end -->` HTML-comment form.
- Extractor awk handles both types in one pass.

---

## 5. One-Line-Per-Member Positions

- **Conservator:** 4 tasks in the sequence markers → tests-red → check-removal → rewrite-green; strict TDD with confirmed-red gate between SKILL.md edits; session-start LOC revised to ~95–105 after researcher confirmation.

- **Innovator:** 5 tasks (combined SKILL.md edit → rewrite → T1–T7 → T8 → integration); reuses existing XML delimiters for top two blocks; tests written after implementation and expected green immediately; peer-corrected T8 awk after purist identified off-by-one and blank-line issues.

- **Pragmatist:** 4 tasks (combined SKILL.md edit → rewrite → all-8-tests → smoke-check); tests written after implementation (green immediately); revised T8 from first-line grep to full-block verbatim diff after purist ruling; most concrete bash for T8 and test harness setup.

- **Purist:** 5 tasks splitting markers from check-removal on orthogonality grounds, placing tests after session-start rewrite; marker contract specification is the most detailed (slug table, blank-line policy, dynamic slug extraction for T8 case-c coverage); T8 extraction extracts from SKILL.md via dynamic slug list (not hardcoded).

---

## 6. Verbatim Notable Quotes

**Conservator — on TDD rationale:**
> "The test file is the spec's executable form. Writing it against the current (broken) state confirms the assertions are syntactically correct and exercise the right surfaces. It also makes the green phase unambiguous — run the same tests, confirm all 8 pass."

**Conservator — on task separation rationale (markers vs. check removal):**
> "If Task 4 runs before Task 3, the heredoc is copied from a SKILL.md that still contains Checks 0–3... Wrong order = two touches on session-start."

**Innovator — on two-tag-type awk:**
> "The two-tag-type awk is the key simplification over a pure HTML-comment approach: The XML-style tags on SUBAGENT-STOP and EXTREMELY-IMPORTANT already demarcate those blocks. Adding HTML comments AROUND those XML tags creates nested markers — confusing."

**Innovator — on T8 inter-block blank lines:**
> "SKILL.md has blank lines between blocks... These blanks fall OUTSIDE markers (capturing=0) so the awk naturally excludes them from EXPECTED. The heredoc must match: no blank lines between the 8 blocks in the heredoc. This is the explicit inter-block blank line policy."

**Pragmatist — on structural insight for session-start rewrite:**
> "The rewrite is a branch + merge, not a fork."

**Pragmatist — on T8 after purist ruling:**
> "Full-block verbatim equality is required. First-line grep is insufficient. Verification: `jq -r` is the exact inverse of `escape_for_json` (five bijective substitutions). Round-trip test on Instruction Priority text (contains literal double-quotes): byte-for-byte identical to source. Full-block diff is achievable."

**Purist — on markers-vs-checks split:**
> "Merging them into one task means: A bad check removal cannot be rolled back without also rolling back the markers. A test failure is ambiguous — was it the marker placement or the content removal? Code review cannot clearly assess 'did the markers land in the right places' when the surrounding content is also changing."

**Purist — on T8 dynamic slug extraction (case c coverage):**
> "The critical property of Step 4: the slug list is derived DYNAMICALLY from the markers in SKILL.md, not hardcoded in the test. A hardcoded list in the test would fail to catch case (c) — a new marked block would not appear in the hardcoded list and the test would not compare it."

**Purist — on T8 verbatim ruling to Pragmatist:**
> "First-line grep misses: a word-level edit inside a block (e.g., '1% chance' → '2% chance' in EXTREMELY-IMPORTANT). First line still matches; T8 silently passes. That is spec §4.3 case (a) — the primary case the verbatim check exists to catch."

**Researcher — on LOC ground truth:**
> "The stub heredoc content alone is 57 lines (mandate blocks direct-counted from SKILL.md). Task 4 task-sizing updated accordingly in P3. Confirmed with correction." (Confirming Conservator's upward revision from ~60–70 to ~95–105.)

**Researcher — on existing test breakage:**
> "No existing test breaks. `test-start-cleanup.sh` grep is for `'Session Housekeeping'` — heading stays, PASSES."

---

<!-- produced-by: consolidator / round04 / 2026-06-06 -->
