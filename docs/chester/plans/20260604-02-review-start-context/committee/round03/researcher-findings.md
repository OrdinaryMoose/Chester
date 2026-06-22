# Researcher Findings — Round 03 (Attack phase)
# Sprint: 20260604-02-review-start-context
# Date: 2026-06-05
# Draft spec attacked: committee/round02/draft-spec.md

## Scope

Verify or break draft-spec claims against actual files. Mark DECISIVE / FALSIFIED.

---

## 1. First-run wizard block (§3.5) — FALSIFIED

**DECISIVE — the draft's §3.5 sed-strip mechanism is broken for its stated goal.**

The spec says: strip the "first-run wizard sub-block" using a "content-anchor sed range
(heading-to-heading)" while keeping verification checks 0–3.

**Ground truth:** wizard and verification checks share a SINGLE `## Session Housekeeping`
heading and are NOT separated by any sub-heading, marker, or numbered-list boundary.

Structure:
- Line 29: `## Session Housekeeping` (one heading covers both)
- Line 33: `1. **First-run project configuration:**` — top-level list item at column 0
- Lines 37–111: wizard body (`CHESTER_CONFIG_PATH == none` branch), indented continuation
- Line 113: `   If \`CHESTER_CONFIG_PATH\` is not \`none\`...` — 3-space indent, CONTINUATION of item 1, not a new item
- Lines 116–160: checks 0–3 and path-echo, still under item 1 body
- Line 162: `## How to Access Skills` (next heading — Session Housekeeping ends here)

The `If \`CHESTER_CONFIG_PATH\` is not \`none\`` line at 113 is INDENTED (3 spaces) — it is the
`else` branch of the same prose conditional that started the wizard. It is NOT a new list item
or sub-heading. A heading-to-heading `sed` range on `## Session Housekeeping`..`## How to Access Skills`
deletes BOTH wizard AND checks.

**No content anchor exists in the file today that separates wizard from checks within Session
Housekeeping.** The transition is a single blank line at line 112 between two prose continuations.

**Implication for §3.5:** the "content-anchor sed range" approach cannot strip just the wizard
without also stripping the checks. The spec's §3.5 mechanism is FALSIFIED as stated.

**What survives:** the underlying GOAL (gate wizard off established projects) is valid.
The mechanism needs revision. Three alternatives:
- (a) Strip the entire `## Session Housekeeping` block (wizard + checks) from the startup payload
  for established projects. This is actually fine: checks are "near-zero value" on startup of
  an established session per round01 consensus — the state they verify is already known good.
  Simplest fix: heading-to-heading strip of the WHOLE housekeeping block when config established.
- (b) Add a new sub-heading or marker to SKILL.md to separate wizard from checks (SKILL.md body
  edit → version bump, but creates a clean anchor for both the sed strip and the spec).
- (c) Assemble the startup payload by emitting non-housekeeping sections only (mandate + path-echo
  announcement when config established), bypassing the housekeeping section entirely in script.

Byte measurements:
- Full Session Housekeeping (lines 29–160): 4,809 bytes
- Wizard only (lines 33–111): 2,784 bytes (~696 tokens, matches prior analysis)
- Checks only (lines 113–160): 1,967 bytes (~492 tokens)

---

## 2. Stub block extractability for byte-compare test (§4 F3, §5 T8) — HOLDS WITH ONE NOTE

**DECISIVE — 7 of 8 blocks are cleanly extractable by heading anchor. One structural note.**

Block boundaries confirmed:

| Block | Lines | Start anchor | End anchor | Clean? |
|-------|-------|-------------|-----------|--------|
| SUBAGENT-STOP | 7–9 | `<SUBAGENT-STOP>` | `</SUBAGENT-STOP>` | YES |
| EXTREMELY-IMPORTANT | 11–17 | `<EXTREMELY-IMPORTANT>` | `</EXTREMELY-IMPORTANT>` | YES |
| Instruction Priority | 19–27 | `## Instruction Priority` | next heading `## Session Housekeeping` | YES |
| How to Access Skills | 162–164 | `## How to Access Skills` | `# Using Skills` | YES |
| The Rule | 168–172 | `## The Rule` | `## Red Flags` | YES |
| Red Flags | 174–191 | `## Red Flags` | `## Skill Types` | YES |
| Skill Types | 193–199 | `## Skill Types` | `## Choosing Between Skills` | YES |
| User Instructions | 205–207 | `## User Instructions` | EOF | YES |

**Structural note — `# Using Skills` H1 header (line 166):**
Between `## How to Access Skills` and `## The Rule` sits a H1 header `# Using Skills` (line 166)
with no content body. It is a section divider only. The stub spec (§3.4) lists `## The Rule`
as block 5. If the stub is a separate file or heredoc, the implementer must decide whether to
include `# Using Skills` in the stub. Omitting it: The Rule is self-explanatory without it.
Including it: faithful to SKILL.md structure. Either is valid — the spec must pin this.
For the byte-compare test (F3/T8): this is the only boundary ambiguity. All other blocks have
unambiguous `##` heading delimiters.

Byte measurements (for T8/F3 test sizing):
- SUBAGENT-STOP (7–9): 115 bytes
- EXTREMELY-IMPORTANT (11–17): 334 bytes
- Instruction Priority (19–27): 472 bytes
- How to Access Skills (162–164): 67 bytes
- # Using Skills + ## The Rule (166–172): 678 bytes
- Red Flags (174–191): 1,040 bytes
- Skill Types (193–199): 196 bytes
- User Instructions (205–207): 102 bytes
- **Total 8 blocks: 3,004 bytes ≈ 751 tokens**

Draft says "~2,991 bytes + orientation" — 3,004 bytes is consistent (13-byte diff = rounding /
orientation line not included in this count). ~750 tokens confirmed.

---

## 3. `/clear` trigger value — UNCONFIRMED (low risk)

**NOT FALSIFIED but NOT directly confirmed from a test fixture.**

No test in `tests/` feeds `trigger="clear"` to a SessionStart hook. The claim that `/clear`
delivers `trigger="clear"` is inferred from the hooks.json matcher string `startup|clear|compact`
— the matcher tokens are expected to map to trigger values. This is consistent with the
`trigger="auto"` pattern for PreCompact (the hook event name vs the trigger value are distinct).

**Risk level: LOW.** The design branches on `trigger == "compact"` only; every other value
(including "clear", "startup", empty, or anything else) falls through to the full payload.
If `/clear` happened to deliver `trigger="startup"` instead of `trigger="clear"`, the
behavior would still be correct: full payload emitted, mandate present. The branch logic
is conservative by construction — misidentifying a clear as startup has zero behavioral
consequence. T5 (`clear` → same as T3) is a good-to-have but not safety-critical.

---

## 4. jq-absent host guard — DECISIVE

**DECISIVE — no guard exists or is needed. Match existing behavior.**

`pre-compact.sh` uses jq directly at line 41 with NO `command -v jq` availability check.
`post-compact.sh` same pattern. Neither script guards against jq absence.

The spec should match: no jq guard in `session-start`. The `// ""` fallback in the jq
expression handles null/absent JSON fields, but if jq itself is absent, the hook exits
non-zero (due to `set -euo pipefail`). This is the existing behavior and the spec inherits it.

One note: `chester-config-read.sh` DOES guard jq (`if command -v jq &>/dev/null`) and falls
back to defaults if absent. If the spec adds a config-read call to `session-start` for first-run
gating, that call is already jq-guarded inside the script.

---

## 5. Frontmatter exclusion from injected body — DECISIVE

**DECISIVE — frontmatter IS stripped today. §2 claim holds.**

The `session-start` script at line 13 runs:
```bash
skill_content=$(echo "$raw_content" | sed '1{/^---$/!q}; 1,/^---$/d')
```

Verified: piping actual SKILL.md through this sed produces output starting with `<SUBAGENT-STOP>`,
not with `---` or frontmatter. Frontmatter (lines 1–5) is fully stripped before injection.

The version bump v0002 → v0003 (triggered by the §3.6 startup trim editing SKILL.md body) has
ZERO effect on the injected content — the version field is in the stripped frontmatter. The
draft's §6 statement that v0002 → v0003 is needed for the startup trim is still correct; it's
a CLAUDE.md convention bump, not a payload change.

---

## 6. Stub token recount — DECISIVE

**DECISIVE — ~751 tokens / 3,004 bytes for the 8 blocks. Draft's ~750 is accurate.**

Per-block byte → approximate token breakdown:
- SUBAGENT-STOP: 115 bytes ≈ 29 tokens
- EXTREMELY-IMPORTANT: 334 bytes ≈ 84 tokens
- Instruction Priority: 472 bytes ≈ 118 tokens
- How to Access Skills: 67 bytes ≈ 17 tokens
- # Using Skills + The Rule: 678 bytes ≈ 170 tokens
- Red Flags: 1,040 bytes ≈ 260 tokens
- Skill Types: 196 bytes ≈ 49 tokens
- User Instructions: 102 bytes ≈ 26 tokens
- **Total: 3,004 bytes ≈ 751 tokens**

Draft says "~750 tokens (~2,991 bytes + orientation)" — within rounding. **HOLDS.**

Wizard savings: lines 33–111 = 2,784 bytes ≈ 696 tokens. Draft says "~696 tok off every
startup/clear." **HOLDS exactly.**

Bash-trim savings (~300 tok): the verification checks at 1,967 bytes ≈ 492 tokens.
Collapsing the bash prose to one-sentence descriptions would cut most of this — ~300 tok
saving is plausible but depends on how aggressive the trim is. This is a startup-only edit
(§3.6) and the exact saving depends on implementation. **Draft's ~300 tok is a reasonable
estimate, not a precise figure.**

---

## Bonus: §6 skill-index cleanup claim — CONFIRMED

**DECISIVE — 0e79b85 is in the log and the entry is gone.**

`git log --oneline` shows `0e79b85 fix(skill-index): remove archived design-architect-committee entry`.
`grep "design-architect-committee" skills/setup-start/references/skill-index.md` produces no output.
The §6 "DONE (committed 0e79b85 this sprint)" claim is accurate.

---

## Summary: Draft claim status

| §  | Claim | Status |
|----|-------|--------|
| §3.5 | Heading-to-heading sed strip separates wizard from checks | **FALSIFIED** — wizard and checks share one heading, no sub-anchor exists |
| §3.5 | Wizard-strip goal (gate off established projects) | VALID GOAL, mechanism needs revision |
| §3.4 | ~750 tokens / ~2,991 bytes for 8 blocks | HOLDS (3,004 bytes / 751 tokens) |
| §3.4 | # Using Skills H1 placement | NOTE — implementer must pin whether to include in stub |
| §4 F3 / §5 T8 | 8 blocks cleanly extractable by heading anchor | HOLDS — 7 unambiguous, 1 note |
| §2 | trigger field + exact values | HOLDS |
| §2 | /clear delivers trigger="clear" | UNCONFIRMED but low risk (conservative branch) |
| §2 | jq present, no guard needed | HOLDS — matches existing hook behavior |
| §2 | Frontmatter stripped before injection | HOLDS — confirmed by direct sed test |
| §6 | skill-index cleanup done at 0e79b85 | HOLDS — confirmed in git log + file |
| §6 | ~696 tok wizard saving | HOLDS exactly |
| §3.6 | ~300 tok bash-trim saving | APPROXIMATE — reasonable estimate |

---

## Key finding for attackers

**The §3.5 falsification is the only structural kill-shot.** The wizard-strip mechanism
must change. The simplest fix (alternative a): strip the entire `## Session Housekeeping`
block for established projects, not just the wizard. This removes both wizard AND checks
from the established-project startup payload — which round01 consensus supports (checks
are "near-zero value" at session open for an already-configured project).

<!-- created-at: 2026-06-05 -->
