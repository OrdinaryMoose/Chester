# Plan Smeller Findings — Trigger-Split Start-Sequence Implementation

**Source:** `committee/round04/draft-plan.md`
**Spec:** `spec/20260604-02-review-start-context-spec-00.md`
**Existing files examined:** `chester-util-config/session-start`, `skills/setup-start/SKILL.md`, `tests/test-compaction-hooks.sh`, `tests/test-start-cleanup.sh`
**Date:** 2026-06-06

---

## Smell 1 — Two-Copy Mandate: Change-Prevention Trap

**Severity: HIGH | Confidence: HIGH**

### The pattern

The spec (§4.1) explicitly acknowledges the compact stub is "a co-located copy in `session-start`, kept honest by a CI drift test." The plan (Task 1) adds 16 marker lines to SKILL.md; Task 4 writes a verbatim heredoc copy into `session-start`.

### The trap structure

After landing, every mandate edit touches:
1. The SKILL.md block (the actual content)
2. The marker pair boundaries (if the edit spans a block boundary or adds a new block)
3. The `session-start` heredoc (the copy)
4. T8 passing (the guard that catches the omission)

That is a four-place sync for what is conceptually a one-place change. The plan's mitigation — T8 with dynamic slug extraction — detects the divergence but does not prevent it. It turns "author forgot to update the copy" from a silent bug into a failing test, which is better, but the friction of the four-place sync is not eliminated; it is only made visible after the fact.

### Maintenance cost forecast

The mandate blocks are behavioral rules that will be edited over time (the Red Flags table has already grown; Skill Types may shrink). Each edit:
- Requires the author to remember that `session-start` holds a copy
- Requires them to find and update the heredoc (no IDE cross-reference; it is a bash heredoc, not an import)
- Requires them to run the test suite to confirm T8 green

The two-copy problem is real, and the plan acknowledges it (spec §4.1: "same drift test, §4.3"). The question for round05 is whether the test is a sufficient mitigation or whether it merely converts a silent corruption into a loud friction. Given the mandate blocks are seldom edited (likely once per several sprints), HIGH severity but moderate practical frequency.

**Cite:** Plan Task 1 ("heredoc copies marked blocks"), Task 4 ("emit the 8-block heredoc stub (verbatim from post-Task-1/2 SKILL.md)"); Spec §4.1, §4.3.

---

## Smell 2 — Marker Convention Creates Three-Way Hidden Coupling

**Severity: HIGH | Confidence: HIGH**

### The coupling web

The `<!-- mandate-block:{slug} -->` marker scheme creates coupling across three separate files/mechanisms:

1. **SKILL.md** — must contain the 16 marker comments in the correct positions
2. **session-start heredoc** — must contain verbatim copies of the marked regions, in order
3. **T8 dynamic extraction** — greps for `mandate-block:*` slugs from SKILL.md and asserts the stub contains them

A future author editing SKILL.md sees prose. They do not see that the HTML comments are structural load-bearing elements — they look like metadata labels. The markers are invisible in rendered Markdown (spec §4.3: "invisible in rendered Markdown"), which makes them easy to move, rename, or delete while editing prose.

### Rename failure mode

If a future author renames a heading — say `## Red Flags` becomes `## Warning Signs` — the markers themselves are not renamed (they are separate HTML comment lines above/below the block). The marker mechanism survives a heading rename. **But** the wide-strip `sed` in Task 4 (spec §5.1) does NOT survive it. That is Smell 3 below.

If a future author renames a slug — e.g. changes `<!-- mandate-block:the-rule start -->` to `<!-- mandate-block:rule start -->` — T8's dynamic extraction finds the new slug but the heredoc still has the old slug's content. T8 asserts "is content-under-slug present in stub" which would fail correctly. This is the good case.

If a future author REMOVES a marker pair (thinking it is decorative) without removing the corresponding block from the heredoc — T8 detects it (the heredoc has content outside the union of marked regions). This is also the good case.

**The bad case:** a future author adds a new behavioral block to SKILL.md WITHOUT adding markers. T8 does not detect this (spec §4.3 residual risk, explicitly noted). The mandate degrades silently post-compaction. The plan acknowledges this as "irreducible without semantic understanding" — which is correct but still a smell.

**Cite:** Plan Task 1 (marker scheme), Task 3 (T8 dynamic extraction); Spec §4.3 residual risk.

---

## Smell 3 — Wide-Strip `sed` Couples Session-Start Behavior to SKILL.md Heading Strings

**Severity: HIGH | Confidence: HIGH**

### The coupling

The wide-strip sed (plan Task 4, spec §5.1):
```
sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'
```

This expression is a behavior-defining string in `session-start` that silently depends on two specific prose strings in `SKILL.md`:
- `## Session Housekeeping`
- `## How to Access Skills`

### Failure modes

**Rename of either heading:** the range never triggers or never closes. If `## Session Housekeeping` is renamed, the range never opens — the entire SKILL.md body is emitted to established projects, including the housekeeping block (over-emits tokens, behavioral regression). If `## How to Access Skills` is renamed, the range opens but never closes — the `sed` deletes from the housekeeping heading to EOF. This is the catastrophic payload-loss case identified in spec §6 for the narrow-prose-anchor strip. The wide-strip shares this failure mode for its closing anchor.

**No test in T1–T8 covers a heading rename.** T3 asserts the housekeeping block is absent in established-project startup — but T3 runs against the actual SKILL.md. If `## How to Access Skills` is renamed, T3 would also fail (because the real SKILL.md no longer has that heading, so the sed range never closes, and T3's absence-grep would fail). This means T3 would catch a rename — but only after landing, not before. A developer editing the heading in a non-Chester context would get a failing test without understanding why.

**The spec explicitly identifies this risk** (§5.1: "they break only on a deliberate rename of either heading") but frames it as acceptable because the anchors are "robust to prose/wording edits." That framing is correct for rewording prose inside the section, but the anchors themselves are headings that future authors do rename (e.g., renaming `## Session Housekeeping` to `## Session Setup` is an entirely natural editorial act).

**Cite:** Plan Task 4 (wide-strip sed); Spec §5.1.

---

## Smell 4 — T8 Dynamic Extraction Duplicates the session-start Heredoc-Build Logic

**Severity: MEDIUM | Confidence: MEDIUM**

### The duplication

The plan's Task 4 builds the compact stub by: (conceptually) collecting the 8 marked blocks from SKILL.md in order and writing them as a heredoc. T8 (Task 3) builds EXPECTED by: dynamically grep-extracting all `mandate-block:*` regions from SKILL.md and concatenating in order. These are two implementations of "what is the mandate" — one frozen in a heredoc, one computed live by the test.

### Where this is a smell

T8 is designed to catch drift between the two implementations. But if both implementations have the same systematic mistake — for example, both include or exclude the blank lines between blocks in the same way — T8 passes while the actual runtime behavior may differ from the spec's intent. The spec (§4.3) requires "the heredoc's blank-line formatting must mirror the SKILL.md blocks exactly — the verbatim compare fails on whitespace differences." This means T8 is sensitive to whitespace in the heredoc, which is notoriously fragile in bash.

### The real duplication risk

If T8's extraction logic and the heredoc-build process diverge in their interpretation of "a marked block" (e.g., T8 excludes the blank line after `<!-- mandate-block:slug end -->`, but the heredoc includes it), T8 fails green only when both implementations agree on the same whitespace convention. This makes T8 brittle to heredoc authoring style rather than to content drift. The plan's T8 description ("full-block verbatim") does not specify whether blank lines adjacent to markers are inside or outside the block.

**Cite:** Plan Task 3 (T8 design), Task 4 (heredoc build); Spec §4.3.

---

## Smell 5 — Retiring Checks 0–3: Orphaned References in test-start-cleanup.sh

**Severity: LOW | Confidence: HIGH**

### The orphan

`tests/test-start-cleanup.sh` line 7 greps for `"Session Housekeeping"` in `setup-start/SKILL.md`:
```bash
if ! grep -q "Session Housekeeping" "$SKILL"; then
  echo "FAIL: setup-start missing Session Housekeeping"
```

After Task 2 removes Checks 0–3 from `## Session Housekeeping`, the heading itself survives (the wide-strip depends on it; spec §5.2 says "SKILL.md contains only the shared `eval` + first-run wizard"). So this test continues to pass — it checks for the heading, not the checks content. This is a **low-severity smell, not a breakage**: the test's name (`test-start-cleanup.sh`) and assertion ("has session housekeeping") remain accurate, but they now validate a much smaller section than they were originally written to validate.

**The real orphan risk:** the test was likely written to ensure the housekeeping machinery is present. After the sprint, it tests only that the heading line exists, which is a much weaker assertion. A future author reading the test sees a passing assertion that overpromises what it verifies. This is a documentation/intent smell rather than a behavioral breakage.

**No test in the existing suite validates the *content* of Checks 0–3** — they are prose, not bash, so they were never directly tested. There is no orphaned test that now lies about behavior in a way that would pass but be misleading. The only concern is `test-start-cleanup.sh`'s weakened scope.

**Cite:** Plan Task 2 (retire Checks 0–3), Ground truth ("`test-start-cleanup.sh` greps the `## Session Housekeeping` heading (survives removal)"); `tests/test-start-cleanup.sh:7`.

---

## Smell 6 — Task 3 Written After Task 1+2 Weakens Test-First Discipline

**Severity: LOW | Confidence: HIGH**

### The sequence

Plan sequencing: Task 1 (add markers to SKILL.md) → Task 2 (remove Checks 0–3) → Task 3 (write tests, all RED) → Task 4 (rewrite session-start, GREEN). The plan acknowledges this as "Open fork #4: is writing all of SKILL.md before the test acceptable test-first?"

### Why it is a smell

T8 greps markers from SKILL.md to build EXPECTED. Writing T8 before Task 1 would require the test to hardcode the slug list — which is exactly what the plan rejects (dynamic extraction is load-bearing for case c). But writing Task 1 before the test means the markers are never validated red: by the time T8 exists, the markers are already in the file. If the markers are placed incorrectly (wrong block boundaries), T8 may pass incorrectly because EXPECTED is derived from the same (incorrectly marked) SKILL.md.

This is not fatal — T8's job is to catch future drift, not to validate the initial placement. The initial placement is validated by reading the diff. But it is a deviation from test-first that is worth naming.

**Cite:** Plan Task 3, Task sequencing §"Task 1 → Task 2 → Task 3", Open fork #4.

---

## Summary Table

| # | Smell | Severity | Confidence | Mitigation in Plan |
|---|-------|----------|------------|--------------------|
| 1 | Two-copy mandate = four-place sync on every mandate edit | HIGH | HIGH | T8 detects drift; does not reduce sync burden |
| 2 | Marker convention creates three-way hidden coupling | HIGH | HIGH | T8 catches most cases; new-unmarked-block is residual risk |
| 3 | Wide-strip `sed` couples behavior to two heading strings | HIGH | HIGH | T3/T5 catch heading renames post-hoc; no pre-rename guard |
| 4 | T8 duplicates heredoc-build logic; whitespace fragility | MEDIUM | MEDIUM | Verbatim compare is the spec; blank-line convention unspecified |
| 5 | test-start-cleanup.sh assertion weakens after Checks 0–3 retire | LOW | HIGH | No breakage; intent weaker than assertion |
| 6 | Task 1+2 before Task 3 weakens test-first for marker placement | LOW | HIGH | Plan open fork #4; manual diff review substitutes |

---

## Change log

- **00 (2026-06-06)** — Initial findings. Commissioned by team-lead for round05 ATTACK.
