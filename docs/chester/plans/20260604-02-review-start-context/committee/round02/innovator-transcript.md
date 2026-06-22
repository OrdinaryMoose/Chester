# Innovator Transcript — Round 02
# Sprint: 20260604-02-review-start-context
# Date: 2026-06-05

## Ground-Truth Pull (Pre-Position)

Direct reads before forming position. No inference.

**stdin JSON shape for SessionStart (confirmed from test-compaction-hooks.sh):**
```json
{"session_id":"...","transcript_path":"...","cwd":"...","hook_event_name":"SessionStart","trigger":"startup"}
```
For compact events: `"hook_event_name":"SessionStart","trigger":"compact"`.
Discriminator field: `trigger` (values: `startup`, `clear`, `compact`).
`hook_event_name` is always `"SessionStart"` for this hook — not useful as discriminator.

**pre-compact.sh stdin pattern:**
- Line 7: `INPUT=$(cat)` — reads full stdin JSON
- Line 44: `SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""')` — extracts field via jq with empty-string fallback
- This is the exact pattern session-start would use: `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')`
- Note: pre-compact.sh does NOT use `trigger` (it doesn't need to discriminate events); the pattern for extraction is identical.

**setup-start/SKILL.md section map (exact line boundaries):**
- Lines 1–5: YAML frontmatter (stripped by session-start before injection)
- Lines 7–9: `<SUBAGENT-STOP>` — mandate
- Lines 11–17: `<EXTREMELY-IMPORTANT>` — mandate
- Lines 19–27: `## Instruction Priority` — mandate
- Lines 29–161: `## Session Housekeeping` + `## How to Access Skills` — housekeeping
  - Lines 33–111: first-run wizard (config==none branch)
  - Lines 113–160: verification checks 0–3 (returning-session branch)
  - Lines 162–165: `## How to Access Skills` (1 line of substance)
- Lines 166–207: `# Using Skills` — mandate
  - Lines 168–172: The Rule
  - Lines 174–192: Red Flags table
  - Lines 193–199: Skill Types
  - Lines 201–203: Choosing Between Skills
  - Lines 205–207: User Instructions

**Mandate block (what must survive compact):** lines 7–27 + 166–207 = ~62 lines / ~550 tokens
**Housekeeping block (startup/clear only):** lines 29–165 = ~137 lines / ~1,400 tokens

**Key structural observation:** The mandate is split across two non-contiguous regions
(top: lines 7–27; bottom: lines 166–207) with the housekeeping block in between.
This is the central fact for question A.

**No existing machine-readable markers** in SKILL.md. Plain markdown; no HTML comments,
no delimiter conventions, no section tags usable for scripted extraction.

---

## Innovator Position

### A. Payload Assembly — WHERE does the compact stub live?

**My recommendation: inline heredoc in session-start (option ii). Reject runtime extraction (marker approach). Reject separate stub file (option i).**

**The extraction idea evaluated honestly:**

The extraction approach — marker-delimited region in SKILL.md, extracted at runtime via
sed/awk — is architecturally elegant (one source, two views, zero second copy). I pushed
it because it eliminates drift. But the SKILL.md structure defeats it:

The mandate is NOT a contiguous region. It lives in two blocks separated by ~137 lines
of housekeeping:
- Block A: lines 7–27 (SUBAGENT-STOP + EXTREMELY-IMPORTANT + Instruction Priority)
- Block B: lines 166–207 (# Using Skills: The Rule, Red Flags, Skill Types, Choosing
  Between Skills, User Instructions)

To extract both blocks at runtime requires: add two pairs of markers to SKILL.md, then
run a multi-region sed/awk extraction in session-start. That is ~10–15 lines of shell
to do what a heredoc does in 40 lines flat. The extraction machinery adds complexity
without reducing the maintenance problem: when the mandate changes, you edit SKILL.md
anyway — the heredoc stub is a 2-minute sync, not a drift problem that requires
automation to solve.

More importantly: adding markers to SKILL.md pollutes the skill body with delivery
plumbing. SKILL.md is a skill-behavior document read by the model. Embedding
`<!-- COMPACT_START -->` / `<!-- COMPACT_END -->` comments creates a coupling between
the skill's semantic content and the hook's implementation detail. That is the wrong
direction.

**The separate stub file evaluated:**

A separate `session-start-compact` file (Innovator's prior round proposal) solves the
maintenance problem at the cost of an extra file the implementer must remember to sync.
It's cleaner than markers but still two copies. The only advantage over an inline
heredoc is that the compact stub is independently readable/testable as a file. That
advantage is real but marginal — a bash heredoc in a well-structured session-start is
perfectly readable.

**Inline heredoc — why it wins:**

The session-start script is 32 lines and already has one structural concern: assemble
the payload, escape it, emit JSON. Adding trigger branching makes it:

```
read stdin → extract trigger → if compact: emit COMPACT_STUB else: emit FULL_PAYLOAD
```

The compact stub is ~40 lines of text. An inline heredoc keeps the two payloads
side-by-side in one file, making the branching structure immediately readable. No
second file to find, no extraction machinery to debug, no SKILL.md pollution.

**Selection mechanism:** `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')`, then
`if [ "$TRIGGER" = "compact" ]`. Absent/malformed → fall back to FULL payload (safe
default: never under-deliver the mandate; better to pay extra tokens than lose skill
discipline post-compaction).

### B. Stub Content + Order

**Verbatim-copied blocks, in this order:**

1. `<SUBAGENT-STOP>` (lines 7–9) — verbatim copy; 2 lines of substance
2. `<EXTREMELY-IMPORTANT>` (lines 11–17) — verbatim copy; 5 lines of substance
3. `## Instruction Priority` (lines 19–27) — verbatim copy; 8 lines
4. `# Using Skills` section (lines 166–207) — verbatim copy; all subsections:
   - `## The Rule` (168–172)
   - `## Red Flags` (174–192) — keep inline, unanimous from prior round
   - `## Skill Types` (193–199)
   - `## Choosing Between Skills` (201–203)
   - `## User Instructions` (205–207)

One line of context: `# Chester skill mandate (compact session — housekeeping already
complete, config live)` — prefix before SUBAGENT-STOP. This orients the model to why
the housekeeping section is absent. ~5 tokens; no ceremony.

**Excluded from stub:**
- `## Session Housekeeping` (lines 29–161) — excluded because filesystem state does
  not decay across compaction; config is still written, dirs still exist. The model
  does not need to re-run or re-verify these at mid-session.
- `## How to Access Skills` (lines 162–165) — one instruction line ("use the Skill
  tool"); absorbed into context from the prior startup injection.

**Estimated stub size (corrected after researcher measurement):** ~59 lines / ~700–815
tokens. Researcher measured the mandate blocks directly: lines 7–27 + 168–199 = ~706
tokens; full mandate through line 207 (including Choosing Between Skills + User
Instructions) = ~815 tokens. My earlier ~420 figure was wrong — it confused the
"~417 core" from the prior round (which excluded Instruction Priority and Red Flags
from the core-only count) with the full stub size. Correct compact stub floor ≈ 700
tokens. This is consistent with the prior round's "~700 with Red Flags" figure.
Net saving per compaction: ~1,314–1,580 tokens (from ~2,014 total down to ~700–815).

### C. First-Run Gating Mechanism

**Where the logic lives: session-start script, not SKILL.md.**

The gate is a pre-injection config read:

```bash
eval "$(chester-config-read)" 2>/dev/null || true
```

If `CHESTER_CONFIG_PATH` == `"none"` (or empty/unset): include the first-run wizard
block in the full payload. If `CHESTER_CONFIG_PATH` != `"none"`: exclude it.

This is a bash conditional wrapping the payload assembly, not a skill-content change.
SKILL.md retains the full housekeeping section (including first-run wizard) so a human
reading the skill sees the complete behavior. The delivery script gates what the model
sees based on runtime state.

**Implementation shape in session-start:**

```bash
eval "$(chester-config-read)" 2>/dev/null || true
IS_NEW_PROJECT=false
[ "${CHESTER_CONFIG_PATH:-none}" = "none" ] && IS_NEW_PROJECT=true

if [ "$TRIGGER" = "compact" ]; then
  # emit compact stub (mandate only)
elif [ "$IS_NEW_PROJECT" = "true" ]; then
  # emit full payload (includes first-run wizard)
else
  # emit full payload WITHOUT first-run wizard block
fi
```

Three branches, one file. The established-project startup path is the hot path (most
sessions); it gets the leaner payload. The new-project path is rare; it gets the full
payload. Compact always gets the stub.

**Why this lives in session-start, not SKILL.md:** SKILL.md is the behavioral
specification read by the model. Making it conditional on runtime state (config exists
or not) would mean the model is reading its own instructions contingently — wrong
abstraction level. The delivery script is the right place for runtime gating.

### D. Trigger Detection — Stdin Field, Parse, Fallback

**Exact parse:**
```bash
INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')
```

This is the identical pattern pre-compact.sh uses for `.session_id // ""` — same
idiom, same fallback convention, no novelty.

**Fallback behavior (absent or malformed trigger):**

If `TRIGGER` is empty (stdin absent, jq unavailable, malformed JSON): fall back to
FULL payload. Rationale: the failure mode of delivering too much is paying extra
tokens; the failure mode of delivering too little (compact stub when full payload was
needed at startup) is the model missing housekeeping and verification — a behavioral
failure. Safe side is always full payload.

**jq availability:** jq is already a hard dependency of pre-compact.sh and
post-compact.sh. If jq is absent those hooks already fail. Session-start adding a jq
dependency is not a new risk — it is existing practice in this codebase.

**A note on `hook_event_name`:** the field is always `"SessionStart"` for this hook
(all three trigger events share the same hook registration). The `trigger` field is the
discriminator. Do not branch on `hook_event_name`.

### E. Startup Trim (Collapse Verification Bash to 1 Line, Keep `sed` and Check 2 Verbatim)

**Recommendation: include in this spec. It is directly in scope and costs nothing to
specify here.**

The verification bash blocks are for human readers, not the executing model. The model
executes these as natural-language instructions, not by parsing the bash. Collapsing
to one-sentence descriptions per check reduces the startup payload by ~80–100 tokens.

**Revised after conservator input — two keep-verbatim cases, not one:**

**Keep Check 2 bash block verbatim** (lines 131–138):
```bash
WORKING_DIR_RELATIVE="<relative path from config>"
if ! git check-ignore -q "$WORKING_DIR_RELATIVE" 2>/dev/null; then
  echo "$WORKING_DIR_RELATIVE/" >> .gitignore
  ...
fi
```
The reconstruction risk is not the `!` inversion per se — it is the exit-code semantics
of `git check-ignore` combined with the `2>/dev/null` stderr suppression. A model
working from prose will substitute `grep -q "$path" .gitignore` which is glob-blind:
it passes when the path is in .gitignore literally but fails when covered by a parent
glob (`docs/chester/` matching `docs/chester/working/`). Git's ignore resolution is
glob-aware; grep is not. Wrong reconstruction → silent misfire on gitignore check.

**Keep Check 3 bash block verbatim** (lines 142–148): the `sed -i "\|^$CHESTER_PLANS_DIR|d"`
idiom. `\|...|` is a non-standard sed delimiter; a model reconstructing from prose
will likely produce `sed -i "s|^...|d"` (wrong syntax) or `grep -v` piped back (wrong
behavior on multiline). Silent delayed failure: plans dir stays gitignored, caught only
at sprint finish when archive artifacts land untracked.

**Collapsible to prose:** Check 0 (read JSON, add missing key — no bash shown, prose
already) and Check 1 (`mkdir -p` if dir absent — single obvious command, ~20 tokens).

**Collapse rule:** Check 0 and Check 1 collapse to one-sentence descriptions. Check 2
and Check 3 retain their bash blocks verbatim. Net startup saving: ~80–100 tokens
(smaller than originally estimated ~300, but correctness argument is clean).

This trim applies to the startup/clear payload only; the compact stub never contained
these checks.

### F. Drift Control — Single Source

**The inline heredoc in session-start IS the canonical compact stub source.**

Drift control rule (spec-level contract):
- When mandate content changes in SKILL.md, the compact stub heredoc in session-start
  must be updated in the same commit. This is a two-place sync.
- The two places are: (1) setup-start/SKILL.md (the full skill body), (2)
  chester-util-config/session-start (the inline compact stub heredoc).
- SKILL.md version must be bumped whenever the mandate changes (already the convention
  per CLAUDE.md).
- The commit message for any mandate change must name both files explicitly.

**Why inline heredoc is no worse than a separate file for drift:**

A separate stub file requires the same two-place sync — edit SKILL.md, edit
stub file. An inline heredoc in session-start requires: edit SKILL.md, edit
session-start. Same cognitive load. The advantage of inline is that the two-place sync
is auditable in one diff: you see both the full body and the stub in the same file
context (session-start contains the stub; git diff shows SKILL.md and session-start
together when both are staged).

**What would eliminate drift entirely:** the marker-extraction approach. But as argued
in A, the non-contiguous mandate structure and the SKILL.md pollution cost make it not
worth it for a two-place sync that's a 2-minute edit.

### G. Test Plan Per Branch

Three branches to test: startup/established-project, startup/new-project, compact.

**T1 — compact branch:**
- Input: `'{"session_id":"t1","hook_event_name":"SessionStart","trigger":"compact"}'`
- Assert: output is valid JSON with `hookSpecificOutput.additionalContext` present
- Assert: output contains `SUBAGENT-STOP`
- Assert: output contains `Instruction Priority`
- Assert: output contains `Red Flags`
- Assert: output does NOT contain `Session Housekeeping`
- Assert: output does NOT contain `First-run project configuration`
- Assert: output does NOT contain `Check 0:` / `Check 1:`

**T2 — startup/established-project branch:**
- Requires: valid chester config present (non-none CHESTER_CONFIG_PATH)
- Input: `'{"session_id":"t2","hook_event_name":"SessionStart","trigger":"startup"}'`
- Assert: output contains `Session Housekeeping`
- Assert: output contains `Check 0:` (verification checks present)
- Assert: output does NOT contain first-run wizard intro text
  (`"This looks like a new project"`)
- Assert: output contains `sed -i "\|^$CHESTER_PLANS_DIR|d"` verbatim

**T3 — startup/new-project branch:**
- Requires: chester config absent or CHESTER_CONFIG_PATH=none
- Input: `'{"session_id":"t3","hook_event_name":"SessionStart","trigger":"startup"}'`
- Assert: output contains `"This looks like a new project"`
- Assert: output contains first-run wizard prose

**T4 — clear trigger (same as startup):**
- Input: trigger=clear
- Assert: same behavior as T2 (full payload, established-project)

**T5 — fallback (absent/malformed trigger):**
- Input: `'{}'` (no trigger field)
- Assert: exits 0, emits valid JSON, contains full payload (not compact stub)
- Assert: does NOT contain compact-stub context line

**T6 — jq unavailable fallback (optional, low priority):**
- Simulate jq absence; assert exits 0 with full payload (defensive fallback)

### H. Version Bump + Two-Place Sync

**Version bump:** setup-start/SKILL.md version v0002 → v0003 on this implementation.
Rationale: the payload delivered changes for two event types (compact and
established-project startup) — this is a behavior change, not a doc fix.

**Two places that must update in lockstep:**
1. `skills/setup-start/SKILL.md` — version bump (v0002 → v0003). Content changes:
   - Collapse verification bash to 1-sentence descriptions (keeps `sed` verbatim).
   - No mandate changes in this sprint (mandate is specified, not redesigned).
2. `chester-util-config/session-start` — all substantive implementation work:
   - Add `INPUT=$(cat)` + TRIGGER extraction
   - Add `IS_NEW_PROJECT` config gate
   - Add compact stub as inline heredoc
   - Add three-branch assembly logic
   - Bump script comment/version marker if present

**Commit discipline:** both files must appear in the same commit. Commit message must
name both surfaces: `feat(session-start,setup-start): trigger-split + first-run gate`.

**Downstream sync check:** skill-index.md references setup-start. Check whether the
skill-index entry describes setup-start behavior in a way that needs updating (unlikely
— the index describes invocation conditions, not delivery mechanism). If no content
change, no sync needed there.

---

## Peer Question (to conservator)

Conservator, in the prior round you held that the verification checks (Checks 0–3) are
load-bearing at startup — "checks exist to catch broken state at session open, not three
skills later." The startup-trim proposal (section E above) collapses the bash blocks to
one-sentence descriptions per check but keeps the `sed` verbatim. My read: the model
executes the checks as natural-language instructions, so collapsing the bash prose
changes presentation but not behavior.

Do you see a failure mode I'm missing? Specifically: is there any check where the bash
block contains non-obvious logic (beyond the `sed`) that a natural-language description
would cause the model to reconstruct incorrectly?

---

## Post-Peer Revision Note

Conservator answered the Check 2 question. Revised section E above.

**What changed:** Check 2 (`git check-ignore -q` inverted test) is now keep-verbatim,
same category as Check 3's `sed`. Conservator's argument: the failure mode is not the
`!` inversion (a model can reconstruct that) but the exit-code semantics of
`git check-ignore` + `2>/dev/null` suppression. A model working from prose will
substitute `grep -q` which is glob-blind — wrong tool, silent misfire.

**Net effect on section E:** startup saving revised from ~300 tokens to ~80–100 tokens.
Only Check 0 and Check 1 collapse to prose. Check 2 and Check 3 stay verbatim.

**Researcher confirmation received (second update):** All five ground-truth questions
confirmed. Key correction surfaced: compact stub size is ~706–815 tokens, not ~420 as
originally estimated. The ~420 figure conflated the prior round's "~417 core" (which
was core-only, excluding Red Flags and Instruction Priority) with the full stub. The
researcher's direct measurement of the mandate line ranges (7–27 + 168–199 = ~706
tokens; through 207 = ~815 tokens) is the authoritative figure. Transcript section B
corrected. Net saving per compaction is ~1,314–1,580 tokens.

All other spec picks (A, C, D, E revised, F, G, H) unchanged.

<!-- created-at: 2026-06-05 -->
<!-- role: innovator -->
<!-- round: 02 -->
