# Plan Attacker Findings — Trigger-Split Start-Sequence Implementation

**Input:** `committee/round04/draft-plan.md` against `spec/20260604-02-review-start-context-spec-00.md`
**Date:** 2026-06-06
**Reviewer role:** plan-build-plan-attacker (adversarial)

All claims below are grounded in direct file inspection. Line numbers are from the codebase at time of review.

---

## CRITICAL

### C1 — Envelope intro text is semantically wrong in the compact branch (confidence: 90)

**Evidence.** `chester-util-config/session-start:27`:
```
session_context="<EXTREMELY_IMPORTANT>\\nYou have Chester.\\n\\n**Below is the full content of your 'setup-start' skill...**\\n\\n---\\n${skill_escaped}\\n...
```
The plan says the compact branch goes "through the existing envelope/escape_for_json/printf" (Task 4). This reuses the envelope word-for-word, so the compact payload wraps the mandate-only stub inside "Below is the **full content** of your 'setup-start' skill." That claim is false for compact: the compact payload is NOT the full content.

**Why this matters.** The model receiving the compact context sees an authoritative "full content" claim and may discount the orientation line's "Mandate only" correction. The behavioral risk is small but real — and it's a semantic contract lie in every compaction event, for the life of the feature.

**Fix.** The compact branch should build its own `session_context` string with a different intro (e.g., "Below is the mandate-only compact stub for this session"). The reuse of the existing envelope is convenient but incorrect here.

---

### C2 — T8 "nothing outside" assertion mechanism is unspecified, leaving a real implementation trap (confidence: 85)

**Evidence.** The plan (Task 3, T8) states "assert each block's full text present verbatim" and "contains nothing outside the union of marked regions plus the orientation line." The spec §4.3 states: "the test collects every mandate-block:* region from SKILL.md and asserts the stub heredoc contains each region's content verbatim, in order, and contains nothing outside the union."

Neither document specifies HOW the "nothing outside" assertion is implemented. A grep-per-block approach (which the plan suggests by referencing the `grep-assert` pattern from `test-compaction-hooks.sh`) cannot prove absence of extra content — it only proves presence. To assert "nothing outside", the test must build EXPECTED = orientation_line + concatenation of all marked blocks, extract ACTUAL from the compact `additionalContext` (after stripping the envelope wrapper), and assert EXPECTED == ACTUAL.

**Critical sub-trap.** Stripping the envelope to isolate the heredoc content requires knowing the envelope's separator structure. The envelope in `session-start:27` uses `---\n` as the separator between the intro and the content. The SKILL.md body itself contains `---` only in the frontmatter (lines 1 and 5), which is already stripped before injection. So `---` is unique as a separator in the current code. But if the compact branch uses a DIFFERENT envelope structure (per fix for C1), the separator changes too — and T8 must be updated in sync. The plan doesn't flag this coupling.

**Fix.** Specify T8's assertion mechanism explicitly: build EXPECTED programmatically from SKILL.md markers; extract ACTUAL by splitting on the envelope separator; assert equality. Document the envelope-separator assumption so it's visible when the envelope changes.

---

## IMPORTANT

### I1 — Task 4 heredoc copy skips "Choosing Between Skills" but plan calls it "verbatim from SKILL.md" (confidence: 92)

**Evidence.** Spec §4.2 lists 8 mandate blocks. `setup-start/SKILL.md` has `## Choosing Between Skills` at lines 201–203 sitting between `## Skill Types` (193–199) and `## User Instructions` (205–207). It is explicitly excluded from the mandate set. The plan Task 4 says "emit the 8-block heredoc stub (verbatim from post-Task-1/2 SKILL.md)."

"Verbatim from SKILL.md" cannot mean a contiguous range extraction (162–207) because that would include the excluded section. The implementer must consciously omit lines 201–203 during the Task 4 copy. If they do a naive range extraction, the heredoc includes `## Choosing Between Skills` content, T8's "nothing outside" check catches it post-facto, but only AFTER the implementation is done and tested.

**The risk.** The plan's wording implies a simpler copy than the actual non-contiguous extraction required. This is an implementation footgun that makes T8's RED→GREEN cycle essential for catching the error, rather than preventing it.

**Fix.** Change the plan's Task 4 wording to say "copy each of the 8 marked blocks in order, omitting unmarked sections (specifically `## Choosing Between Skills`)."

---

### I2 — The "how-to-access + the-rule" open fork is unresolved but blocks Task 1 implementation (confidence: 88)

**Evidence.** The plan (Task 1 "Open") states: "`how-to-access` (162–164) + `the-rule` (166–172) — one combined marker or two (Purist DMed Researcher; resolve at implementation per whether non-mandate content sits between)."

Direct inspection of SKILL.md lines 162–172:
```
## How to Access Skills        (162)
                               (163 blank)
**In Claude Code:** Use the... (164)
                               (165 blank)
# Using Skills                 (166)
                               (167 blank)
## The Rule                    (168)
```
Content between the two sub-blocks is `# Using Skills` (H1, line 166), which is the section container. It is part of the mandate context — spec §4.2 explicitly lists item 5 as "# Using Skills (H1) + ## The Rule". This is not non-mandate content sitting between them; it IS part of the block.

**The finding.** The open fork is resolvable now: `# Using Skills` is mandate content, so blocks 4 and 5 have no non-mandate content between them. Whether to use one combined marker or two is a style choice, not a correctness concern. But the plan routes this to "resolve at implementation," which means the implementer must make this decision inline, potentially without the rationale in context.

**Risk.** If the implementer reads the fork description without checking the actual content, they may choose two markers with `# Using Skills` falling outside any marker — making T8 catch the gap as "content outside markers." This causes a RED state on T8 that looks like a test bug, not an implementation bug.

**Fix.** Resolve the fork in the plan now: "use one combined marker encompassing lines 162–172 (`## How to Access Skills` through `## The Rule` body); `# Using Skills` at line 166 is mandate content and must be inside the marker."

---

### I3 — Task 2 check removal creates a double-blank-line before "## How to Access Skills" (confidence: 80)

**Evidence.** After removing lines 113–160 from SKILL.md, the sequence becomes:
- Line 112 (blank, last line of wizard section)
- Former line 161 (blank, was separator before `## How to Access Skills`)
- Former line 162 (`## How to Access Skills`)

This results in two consecutive blank lines before the heading. This doesn't break anything functionally, and the wide-strip sed in Task 4 deletes this range anyway for established projects. But:

1. The post-Task-2 SKILL.md has a cosmetic double-blank that stays in the file permanently.
2. The heredoc in Task 4 copies the mandate blocks verbatim. If the implementer copies `## How to Access Skills` from SKILL.md (line 164 post-removal), and SKILL.md has a double-blank before it due to the deletion, the verbatim copy may carry that double-blank into the heredoc. T8's verbatim comparison then requires the heredoc to also have that double-blank — which is a whitespace trap if the implementer types it manually.

**Fix.** When removing lines 113–160 in Task 2, also remove line 161 (the blank separator that now doubles with line 112). Or just note it explicitly so the implementer's heredoc copy is whitespace-aware.

---

## MINOR

### M1 — Plan claims jq parse failure triggers fallback but doesn't specify the guard (confidence: 82)

**Evidence.** Spec §3: "On any internal error, session-start exits 0 and emits a valid full payload." T7 tests: malformed JSON → full payload, exit 0. The plan Task 4 says: "Insert `INPUT=$(cat)` + `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')` after CHESTER_ROOT setup."

Testing reveals: `jq` with `-r` and `.trigger // ""` on truly malformed input (e.g. `"not-json"`) exits with code 5. Under `set -euo pipefail` (which `session-start:5` uses), the exit code from `jq` inside `$()` is _not_ propagated by bash's `set -e` in command substitution context — bash assigns the empty output and continues. So T7 actually passes without explicit guard by a bash-behavior coincidence.

**The risk.** The plan relies on an implicit bash behavior (command substitution swallowing exit codes under set -e) rather than explicit `|| TRIGGER=""` error handling. This is fragile: it works today, but any future bash version or shell behavior change could break it. The spec says "exits 0 and emits a valid full payload" as a contract; the implementation should make that explicit.

**Fix.** Change `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')` to `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""' 2>/dev/null) || TRIGGER=""` to make the error handling explicit and shell-portable.

---

### M2 — Fork #2 (Task 1/Task 2 split vs merge) has no resolution criteria in the plan (confidence: 83)

**Evidence.** The plan marks this "[PROVISIONAL — attack target #2]" and says "Round05 decides split vs merge." No criteria for the decision are stated. The plan's own rationale for keeping them separate is "different failure mode, different rollback" (Purist/Conservator position). The Innovator/Pragmatist position is "one-edit-pass."

**Finding.** Split vs merge changes nothing about the execution correctness — the end state is identical. The only risk of merge is that a review of Task 1 markers is conflated with a review of Task 2 content removal. Since there is no automated review step between tasks (inline execution mode), the merge vs split decision is purely cosmetic. The plan should pick one and close the fork rather than routing it to attack.

**Recommendation.** Keep the split: markers and content removal have different blast radii (a marker-insertion error breaks T8; a check-removal error could leave dead text or break the wizard). Keeping them separate gives the implementer a cleaner mental checkpoint.

---

### M3 — TDD ordering fork (#4) not resolved: Task 1+2 precede Task 3 (confidence: 80)

**Evidence.** The plan tasks: 1 (markers) → 2 (remove checks) → 3 (write tests RED) → 4 (green). Fork #4 asks: "is writing all of SKILL.md (Tasks 1–2) before the test (Task 3) acceptable test-first, or should a structural test precede the marker edit?"

T8 is the only test that depends on markers existing (it greps `mandate-block:*` from SKILL.md). T1–T7 are behavioral tests of `session-start` — they don't require markers in SKILL.md. The plan could write T1–T7 before Task 1, keep Task 1 as "structural precondition for T8 only," and then add T8 after markers exist.

**Finding.** The plan's current ordering is pragmatic and defensible: the SKILL.md changes are prerequisites for the tests to be meaningful. Chester's `execute-test` discipline requires tests RED before implementation (session-start), and that contract IS honored (Task 3 before Task 4). The Tasks 1+2 are SKILL.md restructuring, not session-start implementation. This is an acceptable deviation from pure TDD ordering.

**Recommendation.** Close the fork: acknowledge that T1–T7 could technically precede Task 1, but the ordering overhead is not worth the purity. The test-first discipline is met for the implementation task (Task 4). Note this in the plan to prevent future confusion.

---

## NON-FINDING (attack-target resolutions)

**Fork #1 — Uniform 8 HTML markers vs 6 HTML + 2 XML-reuse.** Both work. Uniform scheme is cleaner for T8's dynamic grep (`mandate-block:*` pattern). The existing `<SUBAGENT-STOP>` / `<EXTREMELY-IMPORTANT>` XML tags are parse-opaque to the dynamic grep — using them would require two different extraction patterns in T8. Uniform HTML is the correct choice. Close in favor of Uniform.

**Fork #3 — T8 full-block verbatim vs first-line grep.** Round-trip fidelity of `escape_for_json` → printf → `jq -r` was verified by direct test: byte-faithful for all content types present in the mandate blocks (backticks, pipe tables, `$` variables, XML-like tags). Full-block verbatim is feasible and spec-required. Close in favor of full-block verbatim. The one constraint: T8 must reconstruct EXPECTED from SKILL.md marker content (not hardcode it), because hardcoding recreates the two-place-omission bug the drift test exists to prevent.

**Wide-strip `sed` correctness.** The sed expression `sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'` was verified against the actual SKILL.md. Both heading strings are unique (confirmed by grep). The strip correctly removes lines 29–161 inclusive, preserving `## How to Access Skills` at the start of the surviving content. No duplicate-heading hazard exists in the current file.

**`escape_for_json` + heredoc content hazard.** Direct round-trip test with backticks, pipe tables, double-quoted strings, `$()` subshell fragments, and `<SUBAGENT-STOP>` / `<EXTREMELY-IMPORTANT>` tags confirmed byte-faithful reconstruction via `jq -r`. The `<EXTREMELY_IMPORTANT>` (underscore) outer envelope and `<EXTREMELY-IMPORTANT>` (hyphen) inner tag are distinct strings — no tag-collision issue.

**Line-81 vs line-143 `sed` (wizard vs check 3).** Confirmed: line 81 (`sed -i "\|^$CHESTER_PLANS_DIR|d"`) is inside the first-run wizard and is not touched by Task 2. Line 143 is inside Check 3 and is removed with it. The plan's claim is accurate.

---

## Summary table

| # | Severity | Finding | Confidence |
|---|----------|---------|------------|
| C1 | Critical | Compact branch reuses "full content" envelope — semantically false | 90 |
| C2 | Critical | T8 "nothing outside" assertion mechanism unspecified | 85 |
| I1 | Important | "Verbatim from SKILL.md" obscures non-contiguous copy (Choosing Between Skills excluded) | 92 |
| I2 | Important | how-to-access+the-rule fork unresolved; resolvable now | 88 |
| I3 | Important | Task 2 deletion creates double-blank before How to Access Skills | 80 |
| M1 | Minor | jq failure fallback relies on implicit bash behavior, not explicit guard | 82 |
| M2 | Minor | Fork #2 (split vs merge) lacks resolution criteria | 83 |
| M3 | Minor | TDD ordering fork lacks resolution (defensible as-is) | 80 |
