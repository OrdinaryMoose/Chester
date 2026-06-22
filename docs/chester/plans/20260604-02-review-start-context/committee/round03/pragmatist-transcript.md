# Pragmatist Transcript — Round 03
# Sprint: 20260604-02-review-start-context
# Role: Pragmatist
# Date: 2026-06-05
# Task: Attack draft spec. Lens = over-engineering, untestable claims, hidden cost, LOC creep.

## Ground-truth gathered before writing

All verified via direct bash against current SKILL.md before writing any attack claim.

**SKILL.md structure (confirmed):**
- Line 7–9: `<SUBAGENT-STOP>` block
- Line 11–17: `<EXTREMELY-IMPORTANT>` block
- Line 19–27: `## Instruction Priority`
- Line 29–161: `## Session Housekeeping` (132 lines — first-run wizard + checks 0–3)
- Line 162–164: `## How to Access Skills`
- Line 166: `# Using Skills` (h1 separator, not in stub)
- Line 168–172: `## The Rule`
- Line 174–192: `## Red Flags` (18-line table body)
- Line 193–199: `## Skill Types` (7-line body)
- Line 201–203: `## Choosing Between Skills`
- Line 205–207: `## User Instructions`

**Non-contiguous mandate confirmed:** top cluster (lines 7–27) + bottom cluster
(lines 162–208), with 132 lines of Session Housekeeping between them.

**T8 extraction patterns needed:**
1. XML open/close tags: `<SUBAGENT-STOP>`, `<EXTREMELY-IMPORTANT>` — one awk pattern
2. `## heading` to next `##/# heading` — one awk pattern
3. Last section (`## User Instructions`) to EOF — same awk, stops at EOF cleanly

Minimum distinct awk patterns: 2 (XML + heading-range). But writing them correctly for
all 8 blocks requires a per-block invocation or a loop — and the stop condition differs
between mid-file sections (next `##` heading) and the last section (EOF).

**Heading-to-heading sed strip (§3.5) tested:**
```bash
sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}' SKILL.md
```
This works: 207 → 75 lines, `## How to Access Skills` preserved. Single expression,
content-anchored (not line-numbered), heading-rename-resistant for those two headings.

**Scope creep measurement (develop estimate vs draft):**
- Develop estimate: ~40 LOC change to session-start + ~55 line test file = ~95 LOC
- Draft adds: compact-mandate.md new file (~30 lines) + T6–T9 (4 more tests ~43 lines)
- Draft total: ~65 session-start + ~93 test file + ~30 stub file = ~188 LOC
- Draft is ~2× the develop estimate

---

## Attack Positions

### Attack 1 — T8 is real but costs ~25 lines and is NOT fragile in the way the draft implies

The draft's §4 F3 + §5 T8 claims "byte-for-byte verbatim CI test." This is the load-bearing
argument for preferring separate-file over heredoc — if T8 is cheap and reliable, the separate
file is justified. If T8 is expensive theater, the argument collapses.

**Verdict: T8 is implementable at ~16–20 lines (REVISED DOWN from initial ~25 — see researcher confirmation below), one real brittleness.**

Concrete sketch (verified against actual SKILL.md structure):
```bash
# XML-tagged blocks: one-line awk each
awk '/<SUBAGENT-STOP>/,/<\/SUBAGENT-STOP>/{print}' "$SKILL"
awk '/<EXTREMELY-IMPORTANT>/,/<\/EXTREMELY-IMPORTANT>/{print}' "$SKILL"
# Heading-delimited blocks: one-line awk each
awk '/^## Red Flags$/,/^## Skill Types$/{if(/^## Skill Types$/)exit; print}' "$SKILL"
# ... 5 more heading blocks, same pattern
# Compare all concatenated to stub (minus orientation line):
[ "$(cat extracted)" = "$(tail -n +2 "$STUB")" ] || fail "T8: not byte-identical"
```

LOC: ~16–20 lines (8 extraction lines + comparison + boilerplate). No helper functions
needed — each extraction is a standalone one-liner. XML blocks are actually LESS fragile
than heading anchors (tag names drift less than prose headings).

**Fragility analysis:**
- Heading rename in SKILL.md (e.g. `## The Rule` → `## The Mandate`): T8 silently
  returns empty for that block, comparison fails — TEST FIRES. This is correct behavior.
  The test catches the drift, not hides it.
- XML tag rename: same — test fires. Correct.
- The `extract_section` stop condition uses `/^##? /` which matches both `## foo` and
  `# foo`. The `# Using Skills` h1 at line 166 separates `## How to Access Skills` from
  `## The Rule` — but `extract_section "## How to Access Skills"` stops at `# Using Skills`
  (matched by `/^##? /`) before reaching `## The Rule`. This is correct.
- Last section (`## User Instructions`) stops at EOF — awk handles this cleanly.

**The actual fragility:** the extracted content includes the heading line itself. If the
stub heredoc omits a blank line between blocks that SKILL.md has (or vice versa), the
byte comparison fails. This is a formatting consistency requirement between stub and SKILL.md
that the test enforces but the spec doesn't explicitly call out. The implementer needs to
know: stub format must exactly mirror SKILL.md block format including surrounding blank lines.

**Pragmatist verdict on T8:** KEEP. It's ~25 lines, both helpers are reusable, and the
failure mode (heading rename → test fires) is exactly right. The draft's claim that it
makes "a copy as drift-safe as runtime extraction" is correct IF the implementer matches
blank-line formatting. The spec should call this out explicitly.

**Implication for §3.3 (separate file vs heredoc):**
T8 works equally well against either a separate file or a heredoc (just change the file
path). T8 does NOT break the heredoc argument. The draft's reasoning "heredoc is buried
in shell, less reviewable" is a style preference, not a correctness argument. Both
options are equally testable. The draft's provisionality on §3.3 stands — round03
should settle it on simplicity grounds, not on T8 grounds.

**My position on §3.3:** heredoc is still the simpler choice. Separate file adds one
more file to maintain and one more `cat` call in session-start. The reviewability
argument (Purist's) is real but thin — a 30-line heredoc in a 65-line script is
readable. I hold heredoc, but this is a low-stakes fork; the spec should call it and
move on.

---

### Attack 2 — §3.5 sed-strip: the simple version is simpler than the draft implies

The draft flags §3.5 as "medium confidence, implementer pins the anchor." My testing
shows the clean version is a single expression and the scope question has a better answer.

**The draft's framing is wrong about what to strip.** It says strip only the "first-run
wizard sub-block" while keeping verification checks 0–3. But:

- Verification checks (lines 113–161) are ~492 tokens of bash prose that runs silently
  on every established-project startup.
- The checks already ran on the previous true startup. On a returning session, the dirs
  exist, the config is set, the gitignore is right.
- The checks' value is catching broken state introduced BETWEEN sessions — a valid
  concern, but one that occurs on roughly 0% of normal sessions.
- More importantly: stripping the ENTIRE Session Housekeeping section is one clean
  heading-to-heading sed expression, confirmed tested:
  ```bash
  sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'
  ```
- Stripping only the wizard sub-block requires a between-two-patterns sed — harder to
  read and more fragile (the boundary at line 113 is inside an indented block, not a
  clean heading).

**Revised saving if we strip ALL of Session Housekeeping on established projects:**
- Full housekeeping: 132 lines → ~1,188 tokens (vs ~696 for wizard-only)
- Additional saving: ~492 tokens per startup/clear on established projects
- Trade-off: we lose the verification checks on startup

**Is losing the verification checks acceptable?**
The checks guard: (1) config has both keys, (2) working dir exists, (3) working dir is
gitignored, (4) plans dir is not gitignored. These are set up once and rarely break.
The risk of stripping them is low for the common case. The risk of keeping them is
~492 tokens burned on every startup for a guard that almost never fires.

**Pragmatist call:** strip the entire Session Housekeeping section for established
projects. Simpler expression, bigger saving, acceptable risk. The spec should be explicit
that verification checks are dropped from established-project startup and state the
rationale (set-once, rarely-broken, cost exceeds value on each re-inject).

If the designer prefers to keep the verification checks, the spec must provide the exact
anchor expression for stripping only the wizard sub-block. I can provide it:
```bash
sed '/^1\. \*\*First-run project configuration/,/^   If `CHESTER_CONFIG_PATH` is not `none`/{/^   If `CHESTER_CONFIG_PATH` is not `none`/!d}'
```
But that expression is fragile (it matches content deep inside the indented block; a
phrasing change to that sentinel line breaks it silently). The heading-to-heading
expression is more robust.

---

### Attack 3 — LOC creep: draft is ~2× the develop estimate, but the number is defensible

The draft's implementation surface:
- session-start rewrite: 32 lines → ~65 lines (add INPUT/TRIGGER/branch/stub)
- compact-mandate.md: ~30 lines new file
- test-session-start.sh: ~93 lines (9 tests vs my develop estimate of 5)
- SKILL.md startup trim: ~30 lines removed

Develop estimate was ~95 LOC total. Draft is ~188 LOC. That is scope creep.

**Where the creep came from:**
- T6 (clear trigger): trivial, ~5 lines. Justified.
- T7 (malformed JSON): ~8 lines. Justified — parse-fail fallback is a real path.
- T8 (byte-compare): ~25 lines. The load-bearing drift guard. Justified IF keeping
  separate-file approach. If using heredoc, T8 still makes sense but the test file
  target changes (test heredoc content vs SKILL.md source).
- T9 (size ceiling): ~5 lines. Marginal. A stub that accidentally includes extra content
  is caught by T1/T2 absence assertions already. T9 is belt-and-suspenders. Low value.

**My call on scope creep:** T6, T7, T8 are justified additions. T9 is redundant given
T1/T2's absence assertions — drop it. Net: 9 → 8 tests, ~88 lines, still ~2× develop
but defensible.

The separate-file choice (§3.3) added ~30 lines of a new file that heredoc avoids.
If the spec picks heredoc, LOC drops back to ~155 — closer to develop, and the test
file target becomes the heredoc content inline (slightly different T8, same logic).

---

### Attack 4 — §3.4 Skill Types: I concede, not pressing

In develop I excluded Skill Types. Purist's round02 argument accepted it. The draft
includes it (block 7 of 8). I concede this — the post-invocation adaptation failure
mode is a real category that Red Flags doesn't cover. Not pressing.

The cost is ~49 tokens added to the stub. The revised saving of ~1,298 tokens per
compaction (vs ~1,347 without Skill Types) is the correct number. The draft's §3.4
shows ~750 tokens for the stub; my round02 calculation was ~716. The ~34 token gap
is likely the `## User Instructions` block (2-line body, ~30 tokens) that the draft
includes but I did not count in my develop stub total. Not a material difference.

---

### Attack 5 — Missing spec item: §3.5 needs the exact sed expression or an explicit defer

The draft says "exact anchor expressions to be pinned by the implementer." This is a
spec gap. A spec that defers a medium-confidence implementation detail to the implementer
is incomplete. Either:
(a) Provide the tested expression (heading-to-heading for full housekeeping strip), or
(b) Explicitly defer to implementation with a note that the test (T3) must catch any
    malformed strip.

I provide option (a) above. The spec should adopt it.

---

### Attack 6 — §5 test plan: T3 assertion is imprecise

T3 is: `startup + established config → full minus wizard (checks present, wizard absent)`.
But if we accept Attack 2 (strip all housekeeping), T3 becomes `checks absent, wizard
absent`. The test plan must be updated to match whichever sed-strip scope is chosen.
The draft currently specifies T3 as "checks present, wizard absent" which assumes the
narrow-strip path. If the wide-strip path (full housekeeping) is adopted, T3's presence
assertion for checks 0–3 inverts to an absence assertion.

This is not a kill-shot; it's a consistency gap between §3.5 and §5. Both need to specify
the same strip scope.

---

## Summary: what survives, what needs fixing

**Survives:**
- §3.1, §3.2, §3.4 (stub membership with Skill Types), §3.6, §6 — solid
- T1, T2, T4, T5, T6, T7, T8 — all justified
- F1, F2, F3 — drift control layers are real

**Needs fixing (FINAL — conservator concession closes §3.5 fork):**
- §3.3 (separate file vs heredoc): settle on heredoc; T8 works either way; no
  correctness gain from separate file
- §3.5 (sed-strip scope): WIDE-STRIP (Pragmatist + Conservator). Exact expression
  tested and confirmed: `sed '/^## Session Housekeeping/,/^## How to Access Skills/
  {/^## How to Access Skills/!d}'`. Additional saving ~492 tokens per startup vs
  narrow-strip. Wizard-extraction (Innovator) MOOT under wide-strip.
- §5 T3: "startup + established config → housekeeping ABSENT" (not "checks present,
  wizard absent" as currently specced). Both checks and wizard are stripped.
- §5 T9: drop — redundant given T1/T2 absence assertions. Net 9 → 8 tests.
- §4 F3 / §5 T8: add implementer note — stub blank-line formatting must exactly mirror
  SKILL.md block formatting for byte comparison to pass.

**Kill-shots:** none. The draft survives attack. The T8 cost (~25 lines) is real but
justified. The biggest pragmatist objection is §3.3 (separate file adds unnecessary
surface) and §3.5 (narrow-strip sed is fragile; wide-strip is cleaner). Both are
fixable without reworking the spec's structure.

---

## Peer question

→ **To: conservator**

On §3.5 sed-strip scope: I'm calling for stripping the ENTIRE Session Housekeeping
section for established projects (heading-to-heading, clean expression) rather than only
the first-run wizard sub-block. The verification checks (0–3) are dropped from
established-project startup as a consequence. Your prior position (round01) was that
verification checks "exist to catch broken state at session open, not three skills later."
Does that concern hold strongly enough to require the narrow-strip (keep checks, strip
only wizard), even at the cost of a more fragile sed expression and ~492 fewer tokens
saved per startup?

## Peer exchanges (round03)

### Incoming: Innovator → Pragmatist

Innovator proposed extracting the first-run wizard to a separate file
(`references/first-run-wizard.md`), arguing that the sed-strip has a silent failure
mode: anchor miss → no-op → wizard fires on established project with no error.

**Pragmatist response (tested before replying):**

I ran the silent failure mode test directly:

- Narrow-strip (draft, end anchor on indented prose): broken start anchor → no-op,
  wizard stays, no error. Silent failure confirmed.
- Wide-strip (my proposed approach, heading-to-heading): broken start anchor (typo in
  heading name) → no-op, housekeeping stays, no error. Same failure class.

The silent failure mode exists in BOTH sed approaches. It is not unique to narrow-strip.
Extraction does eliminate one instance of it — `cat "$WIZARD_FILE"` fails loudly if the
file doesn't exist. But the branch logic failure (wrong condition: `!= "none"` vs
`= "none"`) is not eliminated by extraction — it's in the gate, not the inclusion.

**Key distinction:** the narrow-strip end anchor is fragile to PROSE REWORDING (it
anchors on an indented sentence). The wide-strip heading anchor is stable — `## Session
Housekeeping` and `## How to Access Skills` change only on deliberate structural edits,
not on prose rewording. These are not equivalent failure risks.

**Conditional concession:** if the spec adopts narrow-strip (keep verification checks,
strip only wizard), then Innovator's extraction argument becomes valid — the narrow-strip
end anchor IS fragile enough that extraction provides a real improvement. In that case:
extraction eliminates the specific fragility, and the "semantic identity" argument (wizard
is a standalone procedure) tips the balance.

**Position held for wide-strip path:** wide-strip heading-to-heading + no new file.
The sed expression is robust; extraction trades sed fragility for a two-file sync
problem. Simpler wins.

Position not revised. Awaiting conservator on verification-checks trade-off, which
determines whether wide-strip or narrow-strip is the right scope.

### Outgoing: Pragmatist → Conservator

Asked whether the "catch broken state at session open" concern is strong enough to
require narrow-strip (keep verification checks), given the fragility cost and ~492
fewer tokens saved per startup vs wide-strip.

**Conservator answer (accepted — wide-strip conceded):**

Conservator dropped the narrow-strip position on two arguments:

1. Fragility asymmetry: the wide-strip heading anchors (`## Session Housekeeping` →
   `## How to Access Skills`) are robust to prose edits within the block. The narrow-strip
   end anchor (indented prose sentence) is fragile to rewording. Conservator identified
   this independently in their own §3.5 attack on the draft.

2. Coherence: verification checks are already entirely absent from the compact payload.
   Holding that they are load-bearing on established-project startup but acceptable to
   drop post-compaction is incoherent — if their absence post-compaction doesn't break
   the design, their absence on established-project startup doesn't either.

**Position revision:**

- §3.5 wide-strip is now supported by both Pragmatist and Conservator.
- Startup saving upgrades to ~1,188 tokens on established-project startup/clear
  (vs ~696 for narrow-strip). Full Session Housekeeping dropped for established
  projects. New projects (config == "none") still get the full block.
- T3 inverts: "startup + established config → housekeeping ABSENT (checks absent,
  wizard absent)." The presence assertion for verification checks becomes an
  absence assertion.
- Innovator's wizard-extraction argument is now MOOT for wide-strip: heading anchors
  are robust, no extraction needed to solve the fragility problem. (The argument
  remains valid under narrow-strip — noted for record, not pursued.)

### Researcher findings confirmation (T8 + §3.5)

Researcher confirmed both questions independently.

**T8:** ~16–20 lines, not ~25. Each extraction is a standalone one-liner — no helper
functions needed. XML blocks (SUBAGENT-STOP, EXTREMELY-IMPORTANT) extract via one-line
awk range per block. Heading blocks extract via one-line awk range per block. XML tags
are LESS fragile than heading anchors — they drift less under SKILL.md edits.
My ~25-line estimate was too high; transcript corrected to ~16–20.

**§3.5:** Researcher independently confirms wizard-only strip is NOT viable — the end
anchor must target the indented prose sentence at line 113, which is brittle to rewording.
Entire-block strip via `sed '/^## Session Housekeeping$/,/^## How to Access Skills$/{/^## How to Access Skills$/!d}'`
is the viable approach. One line, heading anchors. Savings confirmed: ~696 tok
(wizard-only) vs ~1,188 tok (entire block). This corroborates both my attack position
and Conservator's concession — three independent sources now confirm wide-strip.

No position changes from researcher findings. T8 LOC estimate corrected downward.

---
<!-- created-at: 2026-06-05 -->
<!-- role: pragmatist -->
<!-- round: 03 -->
