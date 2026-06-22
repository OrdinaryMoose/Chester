# Researcher Findings — round05 — Attack Phase Ground Truth
# Sprint: 20260604-02-review-start-context · Round: 05 · dtd 2026-06-06

All findings from live bash tests and direct file reads. DECISIVE unless noted.

---

## Attack 1 — Wide-strip sed: HOLDS, with confirmed boundary behavior

Command tested:
```bash
sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}' \
  skills/setup-start/SKILL.md
```

Anchor uniqueness: grep confirms BOTH anchors appear **exactly once** in SKILL.md:
- `## Session Housekeeping`: line 29 only
- `## How to Access Skills`: line 162 only

No duplicates anywhere in the file. The range command is unambiguous.

Boundary output after strip (lines around the cut zone):

Before strip, output jumps directly from:
```
27: If CLAUDE.md says "don't use TDD" and a skill says "always use TDD," follow the user's
     instructions. The user is in control.
28: (blank)
29: ## How to Access Skills       ← closing anchor PRESERVED
30: (blank)
31: **In Claude Code:** Use the `Skill` tool.
```

The range `/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}`
deletes every line from `## Session Housekeeping` through the line before `## How to Access Skills`,
then the `{/^## How to Access Skills/!d}` inner condition preserves the closing heading.
Result: `## Session Housekeeping` and all body through line 161 are gone; `## How to Access
Skills` at line 162 is kept.

**HOLDS.** Draft plan §Task 4 wide-strip expression is correct.

---

## Attack 2 — escape_for_json() character coverage: HOLDS, with one nuance noted

Tested against all problematic char classes:

| Input | Output | JSON-safe? |
|-------|--------|-----------|
| backtick `` ` `` | unchanged | YES — not a JSON special char |
| `$CHESTER_CONFIG_PATH` | unchanged | YES — `$` not a JSON special char |
| `$(chester-config-read)` | unchanged | YES — `$` and `()` pass through |
| `"hello"` | `\"hello\"` | YES — double-quotes escaped |
| `<SUBAGENT-STOP>` | unchanged | YES — `<>` not JSON special |
| `| Thought | Reality |` | unchanged | YES — pipes pass through |
| `\\` (backslash) | `\\\\` | YES — doubled |
| multiline content | newlines → `\n` | YES — literal newlines escaped |

Full end-to-end pipeline test (escape_for_json → printf → jq -r extraction):
- heredoc containing all of the above chars: **PASS**
- All strings (`chester-config-read`, `$CHESTER_CONFIG_PATH`, `$CHESTER_PLANS_DIR`,
  `SUBAGENT-STOP`, pipe chars) survive round-trip intact.

**Nuance (informational, not a failure):** `$` is NOT escaped by escape_for_json. This is
correct — `$` is not a JSON special character and does not need escaping in a JSON string
value. The shell does not expand `$VAR` inside the `printf '%s'` format because `%s` receives
the already-substituted variable value. No breakage.

**HOLDS.** escape_for_json handles all mandate block content correctly.

---

## Attack 3 — jq -r round-trip fidelity for T8: HOLDS

Tested `jq -r '.hookSpecificOutput.additionalContext'` on a JSON object whose
`additionalContext` value contained:
- Markdown table with pipes and double-quoted strings
- Multi-line content with newlines
- Special chars: `—`, `%`, `1%`

Result: **PASS — byte-identical round-trip.** `jq -r` decodes JSON string escapes and
outputs raw text. The extracted content matched the original input exactly.

T8 full-block verbatim comparison via jq extraction is viable. The draft plan's T8 approach
(extract `additionalContext` via `jq -r`, grep for each block's content) is sound.

**HOLDS.**

---

## Attack 4 — `## Choosing Between Skills` position: HOLDS, sits between mandate blocks

Line numbers confirmed:
- `## Skill Types`: line 193 (mandate block 7, ends at line 199)
- `## Choosing Between Skills`: line 201–203 (three lines, non-mandate)
- `## User Instructions`: line 205 (mandate block 8, ends at 207)

`## Choosing Between Skills` sits between the last two mandate blocks (`## Skill Types` and
`## User Instructions`), with a blank line on each side (line 200 blank, line 204 blank).

Implication for markers: the `skill-types` end-marker must close before line 201, and the
`user-instructions` start-marker must open at line 205. The three Choosing lines (201–203)
are outside any mandate marker — correctly absent from the stub.

The mandate block boundaries at this zone:
- `<!-- mandate-block:skill-types end -->` → after line 199
- lines 200–204: blank + Choosing Between Skills content + blank — UNMARKED
- `<!-- mandate-block:user-instructions start -->` → before line 205

**HOLDS.** Draft plan's marker contract for `## Choosing Between Skills` is correct.

---

## Attack 5 — sed -i idiom at lines 81 and 143: HOLDS

Line 81 (wizard branch, step f — STAYS):
```bash
sed -i "\|^$CHESTER_PLANS_DIR|d" .gitignore
```
Context: inside `if git check-ignore -q "$CHESTER_PLANS_DIR"` — first-run wizard, step f.
Confirmed inside the wizard branch (lines 77–85). NOT removed under Option B.

Line 143 (Check 3 — REMOVED):
```bash
sed -i "\|^$CHESTER_PLANS_DIR|d" .gitignore
```
Context: inside `**Check 3: Plans directory is NOT gitignored**` — the returning-session
verification branch (lines 113–160). Removed entirely under Task 2 (Option B checks removal).

Both idioms confirmed at their respective lines. Draft plan §Task 2 correctly states "wizard's
line-81 `sed` stays" and "line-143 removed."

**HOLDS.**

---

## FALSIFIED CLAIM — draft plan line count

**Draft plan §Ground truth:** "`chester-util-config/session-start` today: 32 lines"

**Actual:** `wc -l session-start` = **32** — BUT `wc -l` counts newlines, not lines. The file
ends with `exit 0` followed by a newline on what is effectively line 32 by `wc -l` count.
However, the prior researcher-findings (round04) stated **33 lines**. Direct `cat -n` read
confirms:
- Line 30: `printf '...'`
- Line 31: (blank)
- Line 32: `exit 0`

`wc -l` returns 32. `cat -n` last line = 32. The prior round04 finding of "33 lines" was off
by one — the file is 32 lines. The draft plan's "32 lines" is **CORRECT**. The round04
researcher-findings.md "33 lines" claim was the error.

**CORRECTION:** session-start is **32 lines** (wc -l = 32, confirmed). Draft plan is correct;
prior round04 researcher finding was wrong by one. No impact on implementation — the rewrite
LOC estimate (~95–105) remains valid regardless.

---

## Summary table

| Attack | Claim | Result |
|--------|-------|--------|
| 1 — Wide-strip sed | Anchors unique; range cuts exactly Session Housekeeping → How to Access Skills | HOLDS |
| 2 — escape_for_json | Handles backtick, $, XML tags, pipes, quotes, backslash, newlines | HOLDS |
| 3 — jq -r round-trip | Byte-faithful extraction for T8 verbatim compare | HOLDS |
| 4 — Choosing Between Skills position | Lines 201–203, between skill-types and user-instructions | HOLDS |
| 5 — sed -i at lines 81/143 | Line 81 in wizard (stays), line 143 in Check 3 (removed) | HOLDS |
| Line count | Draft says 32; actual is 32 (prior round04 finding of 33 was wrong) | FALSIFIED (round04 error, not draft error) |

No draft plan claims falsified. One prior researcher finding corrected.

<!-- created-at: 2026-06-06 -->
