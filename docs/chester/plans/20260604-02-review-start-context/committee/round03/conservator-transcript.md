# Conservator Transcript — Round 03
# Sprint: 20260604-02-review-start-context
# Role: Conservator
# Date: 2026-06-05
# Phase: ATTACK (last round — find what breaks)

---

## Lens

Conservator attack target: where does the draft destabilize working structure, introduce
drift, or break an existing contract? Find the failure sequence that gets past the
spec's defenses. Concede where the draft survives.

---

## Attack 1 — §3.3 / §4 F3: T8+T9 are ADDITION-BLIND (the kill-shot)

### The claim being attacked

Draft §3.3 justifies a separate stub file over runtime extraction with:
> "Its sole advantage (no drift) is matched by the §4 verbatim test on a copy."

§4 F3: "verbatim CI test: each stub block is byte-for-byte identical to its SKILL.md
source block."

T8: checks that each block in the stub is verbatim-identical to the matching block in
SKILL.md.
T9: size ceiling — "catches accidental additions T1 misses."

### The failure sequence

Scenario: a developer revises SKILL.md and adds a new mandate block. Concretely:

1. Developer adds `## Skill Invocation Discipline` between `## Instruction Priority`
   (line 19) and `## Session Housekeeping` (line 29) — a new behavioral rule that all
   models must follow, considered part of the mandate.

2. Developer does NOT update `compact-mandate.md`. This is the canonical drift-by-omission
   failure — the developer knows the block should be in the stub but forgets, or doesn't
   know the stub file exists, or makes the edit in a hurry.

3. **T8 runs.** It iterates over the blocks that ARE in the stub and checks each one
   against its SKILL.md source. All existing blocks still match verbatim. T8 PASSES.
   T8 has no mechanism to ask "is there a mandate block in SKILL.md that is absent from
   the stub?" — it only checks what it finds in the stub.

4. **T9 runs.** The stub did not grow (the new block was never added). T9 is a ceiling,
   not a floor. It fires when the stub grows unexpectedly; it cannot fire when the stub
   fails to grow when it should. T9 PASSES.

5. T1 runs: `compact` trigger → mandate blocks present. T1 asserts the existing named
   blocks appear. The new block is not in T1's assertion list (it was added after T1 was
   written). T1 PASSES.

6. **Result:** CI is entirely green. Post-compaction sessions run without `## Skill
   Invocation Discipline`. Silent behavioral gap in the mandate. No alarm fires.

### Why this is not a theoretical edge case

This is the MOST COMMON drift pattern in this codebase. The stale `design-architect-
committee` catalog entry from round01 is exactly this pattern: a change happens in one
place (skill archived), the corresponding update in a second place (catalog) does not
happen, and no test catches the omission because the test only checks what IS present,
not what SHOULD be present.

Runtime extraction is immune by construction: when a new block is added to SKILL.md
between the mandate-cluster anchors, it appears automatically in the compact payload on
the next session. No stub update, no test gap, no omission possible.

### What would close the gap

A membership floor test: "these specific, named section headings MUST appear in the
stub output — assert their presence by name, and update the assertion list whenever a
new mandate block is added to SKILL.md."

T1 partially serves this role, but it is written once and does not self-update when
SKILL.md gains new mandate blocks. The discipline required is: every SKILL.md mandate
edit must be accompanied by a T1 assertion update AND a compact-mandate.md update. That
is two-place sync, which is the pattern this project already has trouble maintaining.

### Conclusion on §3.3

The draft's §3.3 claim — "its sole advantage (no drift) is matched by the §4 verbatim
test on a copy" — is FALSE for the addition case. T8+T9 together are addition-blind.
The only drift F3 catches is corruption-in-place (an existing block diverges). It does
not catch omission (a new block is never added). The copy is NOT as drift-safe as
extraction.

**Kill-shot verdict:** unless T8 is replaced with a bidirectional membership test
(SKILL.md mandate set == stub set, not just "stub blocks ⊆ SKILL.md") or extraction is
adopted, §3.3 leaves a real, untested drift gap. The gap fires silently, passes all CI,
and produces a behavioral regression in post-compaction sessions.

**If the team wants to keep the separate file:** the fix is a bidirectional test:
- Extract the complete set of mandate section headings from SKILL.md (everything between
  frontmatter-strip and `## Session Housekeeping`, plus everything from `# Using Skills`
  to EOF, minus `## Choosing Between Skills` and `## Session Housekeeping`).
- Assert that exactly those headings appear in compact-mandate.md.
- This test now catches additions AND removals — true bidirectional membership.
- But: writing this test requires the same heading-anchor logic that extraction uses.
  At that point the test IS a dry-run of extraction; the separate file adds maintenance
  without adding safety.

---

## Attack 2 — §3.5 sed-strip first-run gating: heading-rename fragility

### The claim being attacked

Draft §3.5: session-start strips the first-run wizard sub-block from the full body using
a "content-anchor `sed` range (heading-to-heading)."

The exact anchor is not pinned in the draft: "exact anchor expressions to be pinned by
the implementer against current SKILL.md (Pragmatist flagged medium confidence on the
exact `sed` expression)."

### The failure sequence

The wizard sub-block lives inside `## Session Housekeeping` (line 29). It starts at the
first numbered item (`1. **First-run project configuration:**`, line 33) and ends at
the prose paragraph `If \`CHESTER_CONFIG_PATH\` is not \`none\`, this is a returning
session.` (line 113).

There is no clean structural heading that separates the wizard from the verification
checks within `## Session Housekeeping`. The two sub-blocks are separated by the prose
sentence "If `CHESTER_CONFIG_PATH` is not `none`, this is a returning session." — not
by a markdown heading or XML tag. The `sed` range has to anchor on CONTENT, not
structure.

**Fragility case 1 — prose edit breaks the anchor:**
The sed expression anchors on a specific prose string inside the skill body (e.g.,
`/If.*CHESTER_CONFIG_PATH.*is not.*none.*returning session/`). Any edit to that sentence
— rewording for clarity, adding a clause, fixing a typo — silently breaks the anchor.
Session-start fails to strip the wizard. Every established-project startup now emits
~700 tokens of dead first-run instructions. No error, no warning — the strip silently
no-ops and the full block is emitted. The problem appears as unexpected content in the
startup payload, not as a crashed hook.

**Fragility case 2 — heading rename:**
If `## Session Housekeeping` is renamed (e.g., to `## Startup Housekeeping`), the sed
range that anchors on the heading name silently matches nothing and the strip fails.
Same outcome: ~700 token regression on every established-project startup.

**Fragility case 3 — new content inserted into wizard sub-block:**
If a new step is added to the wizard between the anchor points, it is correctly stripped
(the range still works). But if content is added BEFORE the opening anchor or AFTER the
closing anchor, it escapes the strip. Content-anchored ranges have no way to express
"everything that is the wizard, including future additions."

### What makes this worse than it sounds

The failure mode is NOT a crash. The hook exits 0 and emits valid JSON. The model
receives the full housekeeping block including the wizard, silently treats the wizard as
live instructions, and may prompt the user about first-run configuration on an
established project. The user sees unexpected behavior; the dev sees a passing test.

### The clean fix

The wizard sub-block should have a structural anchor — an XML-comment or heading that
marks its boundary, not content-dependent prose. Options:

Option A: wrap the wizard in XML tags in SKILL.md:
```
<!-- first-run-wizard-start -->
1. **First-run project configuration:** ...
...
<!-- first-run-wizard-end -->
```
Session-start strips `/<!-- first-run-wizard-start -->/,/<!-- first-run-wizard-end -->/`.
Rename-proof, prose-edit-proof. Tags are added to SKILL.md once and never need to move.

Option B: split `## Session Housekeeping` into two named sub-sections:
`### First-Run Setup` and `### Returning-Session Verification`. Session-start strips
`/^### First-Run Setup/,/^### Returning-Session Verification/`. Clean heading-anchored
range, resistant to prose edits within the sections.

Both options add ONE edit to SKILL.md (structural markers) and make the sed expression
robust. Without one of these, §3.5 is a latent fragility that will fire on the first
prose edit or heading rename.

**Conservator verdict on §3.5 (REVISED after Pragmatist peer exchange):**

The Pragmatist raised the wide-strip alternative (`## Session Housekeeping` →
`## How to Access Skills`, heading-to-heading) which eliminates the content-anchored
fragility entirely. The wide-strip concession follows from my own attack: if the narrow-
strip requires a content-anchored expression that silently breaks on prose edits, and a
heading-to-heading expression is available that is robust to all prose edits within the
block, the wide-strip is simply the correct choice.

The "catch broken state at session open" argument that supported keeping verification
checks on established-project startup does not survive scrutiny when compared against
compact behavior: checks are already entirely absent from the compact payload under the
adjudicated design. Holding that they must be present on startup but are acceptable
absent on compact is incoherent. The ~492 token saving from dropping them on established-
project startup is real and the fragility cost of the narrow-strip is also real.

**Revised §3.5 position:** wide-strip for established projects. Anchor:
`sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'`
(heading-to-heading, no content anchors). New projects (config == "none") still receive
the full block. Compact still receives no housekeeping.

**Net token saving revised upward:** ~1,188 tokens off established-project startup/clear
(wizard ~696 + checks ~492), not ~696 for narrow-strip.

The spec cannot leave "exact anchor expressions to be pinned by the implementer" —
this verdict stands even with the wide-strip. The spec must state the exact heading
anchors as above. But the anchors are now heading-based and robust, not prose-based
and fragile.

---

## Attack 3 — §3.3 separate file: existing contract check

### hooks.json

No change to hooks.json — UNCHANGED by the spec (§3.1). The separate-file approach does
not require a hooks.json edit. This is fine; no contract broken.

### test-compaction-hooks.sh

`tests/test-compaction-hooks.sh` tests the PreCompact and PostCompact hooks. It does not
test session-start. The new `tests/test-session-start.sh` is a new file; it does not
conflict with the existing test. Contract: no breakage.

### SessionStart injection format

Current session-start emits:
```
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"<escaped content>"}}
```
The draft spec does not change this output format — only the content of `additionalContext`
changes. The injection format contract is preserved. No breakage to existing consumers.

**However:** a new consumer is introduced — `compact-mandate.md` as a `cat`-ed source.
The file path is hardcoded in session-start as a new dependency. If the file moves (e.g.,
during a `references/` restructure) session-start silently emits an error string or empty
context. The spec should require session-start to gate on file existence:
```bash
[ -f "$COMPACT_STUB_PATH" ] || { echo "ERROR: compact stub not found: $COMPACT_STUB_PATH" >&2; exit 1; }
```
This is a missing defensive check in the draft, not a fatal flaw — but it must be in
the spec.

---

## Attack 4 — §3.6 startup trim: Check 2 verbatim (CONCEDE, already corrected)

The draft §3.6 says: "KEEP verbatim `sed -i \"\|^$CHESTER_PLANS_DIR|d\"`" — referring
to Check 3's sed delimiter idiom as the only verbatim-keep.

In round02 peer exchange with Innovator, I argued Check 2's `! git check-ignore -q`
also requires verbatim retention (exit-code semantics + grep-substitution risk). The
draft does not reflect this correction.

**Attack:** §3.6 is incomplete. "~300 tok off startup" is the old estimate before Check 2
was added to the keep-verbatim list. The correct saving is ~80 tokens (Check 1 only).
The spec must specify verbatim retention for BOTH Check 2 and Check 3, not just Check 3.

This is not a fatal flaw but it is a spec accuracy failure — the implementation will
make the wrong choice on Check 2 if the spec is not corrected.

---

## Concessions

**§3.4 stub membership:** the proposed block list (SUBAGENT-STOP, EXTREMELY-IMPORTANT,
Instruction Priority, How-to-Access, The Rule, Red Flags, Skill Types, User Instructions)
is structurally correct. These are all the non-housekeeping sections of the skill. No
attack. Membership disputes (Skill Types / Choosing Between Skills) are minor and do not
affect correctness — either is defensible.

**§3.2 trigger detection:** the fallback rule (any non-"compact" → full payload) is
correct and the jq `// ""` idiom matches the existing hook pattern. No attack.

**§4 F1 + F2:** the header comment (F1) and named block list (F2) are useful and should
be kept regardless of whether extraction or copy wins. They document intent. No attack
on F1/F2.

**T1–T7 test coverage:** the trigger-branch and config-gate tests are well-specified.
No attack on T1–T7.

---

## Summary of attacks

1. **§3.3 / F3 — T8+T9 addition-blind (kill-shot):** T8 only checks corruption-in-place;
   T9 only catches accidental stub growth. Neither fires when a new mandate block is added
   to SKILL.md and omitted from the stub. The spec's claim that F3 makes a copy as drift-
   safe as extraction is false for the addition case. Fix: bidirectional membership test,
   OR adopt extraction. Strength: HIGH — concrete scenario, passes all CI, silent
   behavioral regression.

2. **§3.5 — sed-strip anchor unspecified (medium):** content-anchored sed range silently
   breaks on prose edits or heading renames to the wizard boundary. Spec must pin the
   exact anchor expression OR specify a structural marker (XML comment or sub-heading) in
   SKILL.md. Leaving this to the implementer is deferred fragility. Strength: MEDIUM —
   real fragility, but fixable with one SKILL.md structural addition.

3. **§3.3 — compact-mandate.md missing existence guard (low):** session-start needs a
   file-existence check before `cat`ing the stub. Silent empty emission otherwise.
   Strength: LOW — defensive check, not a design flaw.

4. **§3.6 — Check 2 verbatim omission (low):** spec says keep only Check 3's sed;
   should also keep Check 2's `! git check-ignore -q`. Token saving estimate wrong (~300
   tok vs ~80 tok). Strength: LOW — spec accuracy issue, implementation correction needed.

---

## Peer Question

DM sent to researcher before transcript written:

> The draft's T8+T9 verbatim+ceiling tests — do they include any test that fires when a
> mandate block is in SKILL.md but absent from the stub (addition-blind gap)? Is there
> a T-something I'm missing that serves as an explicit membership floor?

Load-bearing for the §3.3 kill-shot. If researcher finds a T that catches additions, I
concede §3.3. Will revise if needed.

---

## Revision Status

**§3.5 revised** after Pragmatist peer exchange (2026-06-05): conceded wide-strip
(heading-to-heading `## Session Housekeeping` → `## How to Access Skills`) over narrow-
strip. Eliminates the content-anchored fragility attack entirely. Verification checks
dropped from established-project startup payload alongside wizard. Token saving revised:
~1,188 per startup/clear (not ~696). "Catch broken state" argument found incoherent vs
compact behavior (checks already absent on compact under adjudicated design).

**§3.3 confirmed** by researcher (2026-06-05): T8+T9 addition-blind gap is factually
correct. T1–T9 exhaustively reviewed — no test takes the form "for each heading in
SKILL.md's mandate zone, assert it is present in the stub." T8 proves copy-fidelity
(no corruption-in-place), not membership-completeness (no omission). T9 is a ceiling
only. The scenario (new mandate block in SKILL.md, not copied to stub, all nine tests
pass) is exactly valid. Kill-shot stands. §3.3 claim ("its sole advantage is matched by
the §4 verbatim test") is incomplete — T8 does not close the addition case.

Position locked. All items confirmed or revised.

<!-- produced-by: conservator / round03 / 2026-06-05 -->
