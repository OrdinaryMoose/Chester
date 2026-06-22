# Purist Transcript — Round 05
# Sprint: 20260604-02-review-start-context
# Role: Purist — category boundaries + compositional integrity
# Date: 2026-06-06
# Focus: ATTACK phase on draft plan — kill-shots or confirm

## Ground Truth Established

From direct read of the draft plan and structural analysis of SKILL.md at HEAD.

---

## Attack Findings

### FINDING 1 — MODERATE: T8 assertion wording mixes "present" (unidirectional) with "diff"
### (bidirectional) — creates implementation ambiguity with a real failure path

**The gap:** The draft plan (lines 69–74) says:

> "dynamically grep all mandate-block slugs from SKILL.md (NOT a hardcoded list),
> extract each marked region's full content, concatenate in order → EXPECTED;
> extract the compact additionalContext → STUB; **assert each block's full text present
> verbatim**. Dynamic slug extraction is load-bearing: a new marked block auto-enters
> EXPECTED, so an uncopied block fails **the diff** (case c)."

"Assert each block's full text present verbatim" = per-block presence check (unidirectional).
"An uncopied block fails the diff" = equality check (bidirectional).

These are different operations. The plan describes both. An implementer who reads "present
verbatim" and implements per-block grep-presence passes the following case silently:

**The addition-blind path:**
1. Implementer accidentally includes `## Choosing Between Skills` text in the heredoc.
2. T8 checks: is each of the 8 marked blocks present in STUB? Yes (they are all there).
3. T8 PASSES GREEN.
4. Live compact payload includes Choosing Between Skills — a routing pointer that routes to
   skill-index.md, which was excluded from the mandate by design.

This is the ONLY genuine path where T8 passes green but the live compact stub is wrong. It
requires T8 to be implemented as per-block presence checks rather than full equality diff.

**Fix:** The plan must specify exactly: `diff <(echo "$EXPECTED") <(echo "$STUB_CONTENT")`.
The diff operation is symmetric — EXPECTED extra content fails, STUB extra content fails.
Per-block presence checks are explicitly rejected. The phrase "assert each block's full text
present verbatim" must be replaced with "assert STUB == concatenation of all marked regions
+ orientation line (nothing else)."

**Severity:** MODERATE. The failure path requires a specific implementation choice (grep
presence over diff) AND an additional implementation error (wrong heredoc content). Two
things must go wrong simultaneously. But the plan's wording makes the wrong choice
defensible — an implementer could read "present verbatim" and choose grep.

---

### FINDING 2 — CLEARED: Boundary off-by-one cannot produce T8-pass/wrong-stub

The primary attack target: "heredoc hand-copies blocks but a marker boundary differs by one
line from what awk extracts → T8 passes but live compact payload differs from SKILL.md."

**Analysis:** For T8-pass with wrong stub to occur, you need:
`jq_r(escape_for_json(heredoc)) == awk_extract(SKILL.md)` AND `heredoc != SKILL.md_marked_content`

Since `escape_for_json → jq -r` is a verified bijection (no transformation loss), this
simplifies to: `heredoc == awk_extract(SKILL.md)` for T8 to pass. If the heredoc has a
boundary error (one extra or missing line), awk_extract produces different content, and
`heredoc != awk_extract` → T8 FAILS.

A boundary off-by-one always produces a T8 FAIL, never a silent pass. **Cleared.**

The one residual concern: if T8 uses per-block presence checks (Finding 1), then a
heredoc with ONE EXTRA LINE appended to a block would pass the presence check (the block
is present, plus one extra line). But this is the same addition-blind failure mode as
Finding 1, not a new finding.

---

### FINDING 3 — CLEARED: Uniform-8 vs two-tag — uniform-8 is categorically correct

**The question:** does two-tag (XML delimiters for SUBAGENT-STOP and EXTREMELY-IMPORTANT,
HTML comments for the other 6) split the mandate declaration into two conventions, violating
"the marker IS the mandate declaration"?

**Analysis:**

With two-tag, the existing XML tags (`<SUBAGENT-STOP>`, `<EXTREMELY-IMPORTANT>`) serve
DOUBLE duty:
- Role A: behavioral signal to the model (the model reads and acts on these tags)
- Role B: manifest boundary for T8 (the test uses them to extract content)

These roles are not equivalent. A future author adding a NEW XML-tagged behavioral block
(e.g., `<MUST-READ>`) would be captured by T8's XML-pattern awk but NOT by the
`mandate-block:*` HTML comment grep — creating a case where a block is captured by T8
without being explicitly declared as mandate by the marker convention. Alternatively, if
the XML pattern awk is the exclusive mechanism for those two blocks, adding a new XML block
would NOT be captured, silently missing it.

With uniform-8, the mandate declaration is single-convention: `<!-- mandate-block:* -->`.
Adding a new mandate block requires adding one HTML comment pair — the same author action
for all blocks. The dynamic `mandate-block:[a-z-]* start` grep captures all mandate
declarations without exception. No dual-convention footgun.

**Category boundary verdict:** uniform-8 keeps the mandate as a single declared category.
Two-tag splits the mandate declaration into two conventions with different capture mechanics.
The plan's provisional choice (uniform-8) is correct. **Cleared.**

---

### FINDING 4 — CLEARED: Task 1/Task 2 split correctly separates concerns

The draft plan correctly identifies Task 1 as "mandate-reading contract" and Task 2 as
"behavioral scope retirement." Task 2's description ("mandate blocks untouched") is a
verification statement confirming no leak from Task 2 into Task 1's territory — not a
mandate action. The lines removed by Task 2 (113–160, checks branch) are entirely within
`## Session Housekeeping`, which sits BETWEEN the two marker clusters (top cluster
lines 7–27, bottom cluster lines 162–207). No marker line is touched by the removal.

The version bump (v0002 → v0003) is correctly placed in Task 2, not Task 1, because it
records the final SKILL.md state after all content changes are complete. **Cleared.**

---

### FINDING 5 — CLEARED: Orientation line is clean state context

"# Session context: housekeeping already complete this session. Mandate only."

"Housekeeping already complete" = declarative state fact.
"Mandate only" = a label describing the payload composition (what follows), not an
instruction about what the model should DO.

A behavioral rule would read: "Do not attempt housekeeping." The orientation line is
descriptive, not prescriptive. The line is explicitly excluded from the marked mandate
regions and stripped in T8's STUB normalization — the spec's own boundary defines it as
non-mandate. **Cleared.**

One nuance worth noting: "Mandate only." COULD be misread as "perform only mandate-
related actions." The phrase is slightly ambiguous. However the surrounding context
(it is a `#`-prefixed comment-style line, not a directive block) and its structural
position (before the mandate content, as a context header) make the state-context
interpretation unambiguous in practice. Not a blocking concern.

---

### FINDING 6 — CONFIRMED MODERATE: XML-block marker placement is genuinely ambiguous
### (SUBAGENT-STOP + EXTREMELY-IMPORTANT)

**Researcher response received.** Direct read with `cat -A` on SKILL.md lines 5–17.

**The structure (both XML-tagged blocks identical in form):**

```
7: <SUBAGENT-STOP>
8: If you were dispatched as a subagent to execute a specific task, skip this skill.
9: </SUBAGENT-STOP>
```

Two defensible placements for `mandate-block:subagent-stop start`:

- **Option A (outer):** marker before line 7 — the marked region captures all three lines
  (`<SUBAGENT-STOP>`, content, `</SUBAGENT-STOP>`)
- **Option B (inner):** marker after line 7 — the marked region captures only line 8
  (content only, XML tags excluded)

Both are "immediately before first content line" depending on whether `<SUBAGENT-STOP>` is
content or delimiter. The plan does not define this. Same structure applies identically to
EXTREMELY-IMPORTANT (lines 11–17).

**Failure mode:** If the marker implementer chooses Option A (outer, markers wrap XML tags)
but the heredoc hand-copy in Task 4 omits the XML tags (copies only the inner content), then:
- T8 awk-extraction from SKILL.md finds: `<SUBAGENT-STOP>\n{content}\n</SUBAGENT-STOP>`
- EXPECTED = includes XML tags
- STUB heredoc = content only (no tags)
- `diff` FAILS → T8 RED even on a correct implementation

Conversely if Task 1 uses Option B (inner, markers exclude XML tags) but the heredoc
includes the XML tags: same result. The diff is unforgiving — one character of mismatch fails.

**This is a producer/consumer disagreement T8 cannot self-resolve.** The test enforces
consistency between marker placement and heredoc content, but does not specify WHICH
interpretation is correct. An implementer making independent choices for Task 1 (markers)
and Task 4 (heredoc) could pick different options and produce a permanently red T8.

**Severity:** MODERATE. Not a silent-pass failure — it's a false-red failure. T8 forces
the implementer to resolve the ambiguity, but produces confusing red output rather than a
clear error message. The plan must specify the interpretation.

**Other blocks confirmed unambiguous by researcher:**
- Instruction Priority (19–27): content ends at 27, blank at 28 is outside. Unambiguous.
- User Instructions (205–207): last line of file, single trailing newline. Unambiguous.
- All 6 heading-delimited blocks: blank-line convention is unambiguous (blanks outside).

**Fix:** The plan must add one sentence to Task 1's contract: "For SUBAGENT-STOP and
EXTREMELY-IMPORTANT, markers wrap the ENTIRE XML block including the XML open- and close-tags
(outer placement). The heredoc in Task 4 must copy the XML tags as part of each block."
This eliminates the producer/consumer disagreement and makes T8 deterministic.

---

## Summary

| # | Finding | Severity | Blocks? |
|---|---------|----------|---------|
| 1 | T8 "present verbatim" vs "diff equality" — addition-blind path if implemented as grep | MODERATE | NO |
| 2 | Boundary off-by-one → T8-pass/wrong-stub | — | CLEARED |
| 3 | Two-tag vs uniform-8 category split | — | CLEARED (uniform-8 correct) |
| 4 | Task 1/2 split leakage | — | CLEARED |
| 5 | Orientation line as rule | — | CLEARED |
| 6 | XML-block marker placement ambiguity (SUBAGENT-STOP + EXTREMELY-IMPORTANT) | MODERATE | NO |

**Required plan fixes:**

**Finding 1:** Replace "assert each block's full text present verbatim" with exact
specification: `diff <(echo "$EXPECTED") <(echo "$STUB_CONTENT_MINUS_ORIENTATION")`.
Reject per-block grep-presence explicitly. The diff is symmetric — catches both missing
blocks AND extra content in the stub.

**Finding 6:** Add to Task 1 contract: "For SUBAGENT-STOP and EXTREMELY-IMPORTANT, markers
wrap the entire XML block including open- and close-tags (outer placement). Task 4 heredoc
copies the XML tags as part of each block." This resolves the producer/consumer ambiguity
and makes T8 deterministic.

**No category leaks in the contract structure.** The marker IS the mandate declaration
(uniform-8). Task 1/2 concerns are clean. The contract flows: Task 1 (produce markers) →
Task 3 (consume markers for T8) → Task 4 (produce stub, T8 turns green) → Task 5 (no
regression). Two wording gaps require explicit resolution before implementation.

---

## Researcher Response (received)

Boundaries across all 8 blocks:
- SUBAGENT-STOP (7–9): **ambiguous** — outer (XML tags included) vs inner (content only)
- EXTREMELY-IMPORTANT (11–17): **ambiguous** — same structure as SUBAGENT-STOP
- Instruction Priority (19–27): unambiguous — blank at 28 is outside
- How to Access Skills (162–164): unambiguous
- Using Skills + The Rule (166–172): unambiguous
- Red Flags (174–191): unambiguous
- Skill Types (193–199): unambiguous
- User Instructions (205–207): unambiguous — file ends cleanly at line 207

---

<!-- created-at: 2026-06-06 -->
<!-- role: purist -->
<!-- round: 05 -->
<!-- sprint: 20260604-02-review-start-context -->
