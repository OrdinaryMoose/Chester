# Purist Transcript — Round 02
# Sprint: 20260604-02-review-start-context
# Role: Purist — category boundaries + compositional integrity
# Date: 2026-06-05
# Focus: Develop concrete spec answers for trigger-split implementation

## Ground Truth (from direct file reads this round)

`skills/setup-start/SKILL.md` block map at HEAD (v0002, 207 lines / 8,376 bytes):

| Block | Lines | Bytes | Category |
|-------|-------|-------|----------|
| SUBAGENT-STOP | 7–9 | 115 | (c) mandate |
| EXTREMELY-IMPORTANT | 11–17 | 334 | (c) mandate |
| Instruction Priority | 19–28 | 473 | (c) mandate |
| Session Housekeeping (a+b combined) | 29–161 | 4,810 | (a)+(b) non-mandate |
| How to Access Skills | 162–164 | 67 | (c) mandate |
| The Rule | 166–172 | 678 | (c) mandate |
| Red Flags | 174–192 | 1,041 | (c) mandate |
| Skill Types | 194–199 | 181 | (c) mandate |
| Choosing Between Skills | 201–203 | 331 | DISPUTED — see below |
| User Instructions | 205–207 | 102 | (c) mandate |

Total (c) mandate blocks excluding Choosing Between Skills: ~2,991 bytes
Choosing Between Skills: 331 bytes additional
Session Housekeeping: 4,810 bytes (drops from compact payload entirely)

Prior analysis (committee-analysis-01.md) minimum mandate floor: ~417 tokens
  = SUBAGENT-STOP ~29 + EXTREMELY-IMPORTANT mandate ~84 + Instruction Priority ~118
    + The Rule ~166 + Skill Types ~49
  Deferrable set named at ~1,557 tokens (77%) included "Choosing Between Skills + User
  Instructions ~109" as a single deferrable line item.

Question sent to Researcher: confirm "Choosing Between Skills" placement as deferrable
(not load-bearing for compact stub). See DM sent this round.

---

## Purist Position — Spec Answers A through H

### A. Payload assembly — WHERE the compact stub lives

**Recommendation: separate stub file, not inline heredoc, not split SKILL.md.**

Rationale from category-boundary lens:

A separate file (`chester-util-config/session-start-compact` or equivalent) makes the
category boundary a physical boundary — the two payload shapes live in two distinct files.
There is no parsing, no conditional block within a single document, no risk of a future
editor "just adding one thing" to the stub by editing the wrong section of a shared file.

The inline heredoc option (one script, trigger branch, two heredocs) keeps the boundary
invisible to any reader of session-start. The boundary is real but unenforceable by
inspection: a reader sees one script and must mentally partition it. Drift is
undetectable without diffing.

The split-SKILL.md option (e.g., YAML frontmatter flags which sections appear in compact
vs full) introduces a new mechanism with its own category-membership logic. It couples the
payload-split decision to the skill authoring format. Future skill edits now have a
correctness dimension (did you set the flag?) that doesn't exist today.

A separate stub file has one clean property: you can read it and immediately know "this is
the complete compact payload." A reviewer, a test, and a future author all have the same
ground truth. The file IS the category. No parsing required.

Implementation shape:
```
chester-util-config/
  session-start          (existing — full payload, fires on startup|clear)
  session-start-compact  (new — mandate-only stub, fires on compact)
```

`session-start` reads stdin trigger (or falls back to compact-safe behavior — see D).
If trigger == "compact": delegate to `session-start-compact` or emit compact payload inline.
The Pragmatist + Purist position from round01 was one hook with stdin branching. The
separate-file approach is compatible with one-hook: `session-start` reads the trigger and
either emits the full payload or reads and emits `session-start-compact`. Either way the
stub is a discrete file. The branching mechanics live in `session-start`; the category
membership lives in `session-start-compact`.

### B. Stub content and order — exact mandate category membership

This is the load-bearing spec question. The boundary must be named with precision.

**IN the compact stub (mandate category — every item must survive every compaction):**

1. **SUBAGENT-STOP block** (lines 7–9, verbatim)
   - Rationale: subagent-dispatch context does not persist across compaction. A post-
     compaction subagent that has lost this instruction may attempt to re-run setup
     housekeeping it was never supposed to run. Load-bearing on every compact event.

2. **EXTREMELY-IMPORTANT block** (lines 11–17, verbatim)
   - Rationale: the 1% rule and the MUST-invoke imperative are the behavioral commitment
     that compaction is most likely to erode. Behavioral drift at post-compaction turns is
     the exact failure mode the design is protecting against.

3. **Instruction Priority section** (lines 19–28, verbatim)
   - Rationale: without this block, a conflicting project CLAUDE.md silently wins at
     post-compaction turns with no resolution rule in context. Named as "the non-obvious
     load-bearing item" in round01. Verbatim preservation required — the numbered list
     structure and the CLAUDE.md example are the operative content.

4. **"How to Access Skills" one-liner** (lines 162–164, verbatim)
   - Rationale: a single line — "In Claude Code: Use the Skill tool." This is the
     mechanism statement that anchors The Rule. Without it, The Rule floats without a
     concrete action. Cost: 67 bytes. Exclusion risk exceeds inclusion cost.

5. **The Rule section** (lines 166–172, verbatim)
   - Rationale: the behavioral mandate in operational form. This is what the model executes
     at every user message. Verbatim required — any paraphrase risks softening "even a 1%
     chance" or dropping the "before clarifying questions" clause.

6. **Red Flags table** (lines 174–192, verbatim)
   - Rationale: unanimous keep from round01. Conservator reversed explicitly: "a pointer is
     self-defeating since a rationalizing model won't invoke the tool to read it." The table
     pattern-matches the exact defection paths that reassert post-compaction. Verbatim
     required — the table structure enables rapid pattern-matching that prose summaries don't.

7. **Skill Types section** (lines 194–199, verbatim)
   - Rationale: defines the rigid/flexible contract. A post-compaction model that has lost
     this instruction may adapt a rigid skill, silently breaking discipline. Short (181 bytes);
     exclusion risk exceeds inclusion cost.

8. **User Instructions section** (lines 205–207, verbatim)
   - Rationale: "Instructions say WHAT, not HOW." This is the anti-shortcut constraint
     that works in concert with The Rule. At 102 bytes it costs essentially nothing and its
     absence would let "Add X" collapse the pipeline workflow.

**OUT of the compact stub (non-mandate — correctly excluded):**

- **Session Housekeeping (lines 29–161)** — contains categories (a) and (b):
  - First-run config wizard (lines 33–112, ~4,010 bytes of the housekeeping block):
    definitionally unreachable post-compaction (config already written). Dead instructions.
  - Returning-session checks 0–3 (lines 113–161, ~800 bytes): checks already ran this
    session before compaction. Re-running them post-compaction is near-zero value and
    potentially harmful (spurious git commits on clean state).
  - Path-echo (lines 150–160): returning-check artifact, same exclusion rationale.

**DISPUTED: "Choosing Between Skills" (lines 201–203, 331 bytes)**

Prior round01 analysis placed this in the deferrable set ("Choosing Between Skills +
User Instructions ~109"). The 109-token figure appears to group them together, but they
are structurally different:

- "User Instructions" (102 bytes) — a standalone behavioral rule, no external dependency.
  I place it IN the mandate above.
- "Choosing Between Skills" (331 bytes) — routes to `skill-index.md` for catalog lookup.
  It is the only mandate-section block with an external file dependency.

Purist ruling on "Choosing Between Skills": EXCLUDE from compact stub.

Reasoning: the mandate category is defined by content that must survive in the agent's
working memory post-compaction. "Choosing Between Skills" does not add a behavior — it
adds a lookup pointer. A post-compaction agent that needs to choose between skills can
either (a) invoke the skill whose name seems most relevant and discover the right path
from context, or (b) be told by the startup payload when it next fires on startup|clear.
The pointer is guidance, not a rule.

More importantly: excluding it from the compact stub removes the dangling
`design-architect-committee` reference from the post-compaction payload without requiring
a separate skill-index.md fix as a prerequisite. The stale catalog entry cannot be acted
on if the pointer to the catalog is not in the compact payload. This is a secondary
benefit, not the primary rationale — the primary rationale is that routing guidance is not
a behavioral mandate.

However: if other committee members place it IN the mandate, I will not hold this as a
blocking objection. The clean resolution is: fix skill-index.md AND exclude the block from
the compact stub. If only one fix can land before the trigger-split ships, the exclusion
is preferable to including a pointer that routes to stale data.

**Stub byte total (conservative, including all 8 items above + disputed exclusion):**
~115 + ~334 + ~473 + ~67 + ~678 + ~1,041 + ~181 + ~102 = ~2,991 bytes
~750 tokens (rough estimate at ~4 bytes/token)

This matches the "~600 tokens" range from round01 (conservator/pragmatist estimate).
Excluding "Choosing Between Skills" (331 bytes) saves ~83 tokens further.

**Order in stub:**
Preserve the order from SKILL.md. The SUBAGENT-STOP and EXTREMELY-IMPORTANT blocks
must appear first — they are gate conditions. Instruction Priority follows immediately
(resolution rule before behavioral rules). The skill-usage section (How to Access →
The Rule → Red Flags → Skill Types → User Instructions) follows as a unit.

One required addition to the stub (not in the full SKILL.md): a single orientation line
immediately before the skill-usage section:

  `# Session context: housekeeping already complete this session. Mandate only.`

This prevents the post-compaction agent from wondering whether it missed housekeeping. It
is not a behavioral rule — it is state context. One line, ~90 bytes.

### C. First-run gating — clean third category or leakage?

The three categories (a/b/c) as defined are:
- (a) first-run config setup
- (b) returning-session checks
- (c) standing skill-discovery mandate

In SKILL.md, categories (a) and (b) are fused inside a single `## Session Housekeeping`
section under a single conditional branch (`if CHESTER_CONFIG_PATH is none → (a); else
→ (b)`). They are structurally co-located but logically separate.

For the compact stub: both (a) and (b) are excluded by the same rationale (housekeeping
already ran). The fusion in SKILL.md is irrelevant to the compact payload.

For the startup payload (first-run gating): the design adjudicates that the first-run
wizard should be gated off the established-project payload so it does not load on every
startup. This requires separating (a) from (b) within the full SKILL.md — either by
restructuring the conditional so it only runs the first-run path on `CHESTER_CONFIG_PATH
== none`, or by moving the wizard to a separate invocation.

Purist position on gating: the current structure already has the right conditional gate
(`if CHESTER_CONFIG_PATH is none`). The gating is already compositionally correct — the
wizard only fires when the config is absent. The "fix" is not to restructure the file but
to confirm that the check runs before any other output, so an established project never
sees the wizard text even momentarily. This is already the case in SKILL.md.

The category boundary question: does first-run gating "leak into" returning checks? No.
The gate (`if config == none`) is a binary predicate on a file-system state. It does not
depend on any behavioral history and cannot be confused with the returning checks. The
categories are clean.

### D. Trigger detection — stdin field, parse, fallback

The SessionStart hook receives JSON on stdin with `hook_event_name` and `trigger`.
`session-start` currently reads zero stdin.

**Recommended implementation:**

```bash
INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""' 2>/dev/null || echo "")

if [ "$TRIGGER" = "compact" ]; then
  # emit compact payload
  PAYLOAD=$(cat "${CHESTER_ROOT}/chester-util-config/session-start-compact" 2>/dev/null \
            || echo "Error reading compact stub")
else
  # emit full payload (startup|clear, or any unrecognized trigger)
  PAYLOAD=...
fi
```

**Fallback rule:** any trigger value that is NOT exactly "compact" must emit the full
payload, not the compact stub. This includes: empty string, missing field, unrecognized
values, parse errors. The mandate is always present on non-compact events.

Rationale for the fallback direction: the adjudicated design's correctness criterion is
that the mandate MUST survive every compaction. The only way to deliver a lighter payload
is to know with certainty the trigger is "compact". Any ambiguity defaults to the full
payload, which is never wrong — only more expensive. The inverse (default to compact stub
on ambiguity) could silently drop the full housekeeping check on a real startup event if
the trigger field is absent.

**Parse failure fallback:** if `jq` is unavailable or stdin is malformed, TRIGGER defaults
to empty string → full payload fires. No mandate is ever dropped due to a parse failure.

This matches the Pragmatist + Purist recommendation from round01: one hook with stdin
branching, same pattern as pre-compact.sh / post-compact.sh.

### E. Startup trim — this spec or defer?

The adjudicated design includes two bonus initial-context cuts:
1. Gate/relocate the first-run wizard so it never loads on established projects.
2. Collapse verification bash prose to one-sentence descriptions (keeping the non-obvious
   `sed -i "\|^$CHESTER_PLANS_DIR|d"` verbatim).

Purist position: include both in this spec, but as a separate section from the trigger-
split. They are independent changes to the full payload; they do not affect the compact
stub.

Does collapsing verification prose blur any boundary? No. The returning-checks block (b)
is excluded from the compact payload entirely. Whether its prose is verbose or terse in
the full SKILL.md is irrelevant to the category boundary. The boundary is defined by
exclusion, not by the length of what is excluded.

The only risk: if prose collapse is done carelessly and accidentally removes the `sed -i`
snippet, the plans directory could be silently left gitignored on a new project. This is
a category (b) correctness risk on startup, not a category boundary risk. The spec must
note the `sed -i` preservation requirement.

Startup trim verdict: in spec, separate section, startup-only scope confirmed.

### F. Drift control — guaranteeing the stub IS the mandate category

This is the hardest spec question. The compact stub is a second payload shape with its
own lifecycle. It will drift unless there is a structural lock.

**Drift mechanisms:**
1. A new behavioral rule is added to SKILL.md's skill-usage section and not added to the
   compact stub (mandate grows, stub is stale — agent post-compaction missing new rule).
2. A housekeeping item is accidentally added to the compact stub (category leakage —
   stub bloats, compact cost creeps back).
3. The stub is edited directly without updating SKILL.md, creating two divergent mandate
   sources (authoring confusion).

**Drift controls (in priority order):**

**F1 — Source of truth rule (normative):** The full SKILL.md is the authoritative source
for mandate block content. The compact stub is DERIVED from the mandate blocks of SKILL.md.
The stub is never authored independently — it is a subset copy. This must be stated
explicitly in the stub file's header comment and in the implementation documentation.

  ```
  # session-start-compact — DERIVED from setup-start/SKILL.md mandate blocks only.
  # If you change mandate content, update SKILL.md first, then regenerate this stub.
  # Do NOT add content here that is not in SKILL.md.
  ```

**F2 — Enumerated block list (normative):** The spec must name the exact blocks that
constitute the mandate, by SKILL.md section heading. The list in this position (section B)
is that enumeration. The stub is valid if and only if it contains exactly the blocks on
the list and no others. Any reviewer can check this by inspection.

**F3 — Test assertion (normative):** The test plan (section G) must include an assertion
that the compact payload contains every mandate block and does NOT contain any non-mandate
block. The test is the enforcement mechanism for F1 + F2.

**F4 — Version bump rule:** Any change to a mandate block in SKILL.md requires a version
bump AND a corresponding update to `session-start-compact`. The existing version bump
convention (bump on any behavior or contract change) already covers this — the spec just
needs to state explicitly that `session-start-compact` is in scope for the same bump
discipline.

**F5 — Resist generated stubs:** Do not generate the compact stub programmatically at
hook runtime (e.g., by parsing SKILL.md and extracting flagged sections). A generated
stub means the mandate category is defined implicitly (by flags in SKILL.md) rather than
explicitly (by the stub file's content). Implicit definitions drift when the parsing logic
changes. The stub is a static file, authored once, updated deliberately.

The combination of F1 (derived-from rule) + F2 (explicit block list) + F3 (test) is the
minimum sufficient drift control. F4 and F5 are reinforcing constraints.

### G. Test plan — asserting the boundary holds

Minimum test set (each a distinct assertion):

**T1 — Compact trigger emits mandate, no housekeeping:**
  Simulate `trigger = "compact"` on stdin → assert compact payload contains:
  - SUBAGENT-STOP block
  - EXTREMELY-IMPORTANT block
  - Instruction Priority section
  - The Rule section
  - Red Flags table
  - Skill Types section
  → assert compact payload does NOT contain:
  - "first-run project configuration" string
  - "Check 0:", "Check 1:", "Check 2:", "Check 3:" strings
  - `mkdir -p "$CHESTER_WORKING_DIR"` string (housekeeping bash)

**T2 — Startup trigger emits full payload:**
  Simulate `trigger = "startup"` → assert full payload contains all T1 items PLUS
  the Session Housekeeping section header.

**T3 — Clear trigger emits full payload (same as startup):**
  Simulate `trigger = "clear"` → same assertion as T2.

**T4 — Empty/missing trigger falls back to full payload:**
  Simulate missing trigger field or empty string → full payload, not compact stub.
  This is the fallback-direction test.

**T5 — Parse failure falls back to full payload:**
  Simulate malformed stdin JSON → TRIGGER defaults empty → full payload.

**T6 — Compact stub verbatim check:**
  The mandate blocks in the compact stub are byte-for-byte identical to the corresponding
  sections in SKILL.md. This can be a grep/diff assertion: extract the EXTREMELY-IMPORTANT
  block from SKILL.md and from the stub and assert they are equal.

**T7 — No extra content in compact stub:**
  Assert compact stub line count is within expected range (e.g., ≤ 60 lines). A line count
  ceiling is not a correctness test but it catches accidental additions that T1's string
  assertions might miss.

The boundary-hold assertion (T1 + T6 + T7 together) is the minimum. T2–T5 test the
trigger-routing logic. All seven should be in the test suite.

### H. Version bump and two-place sync

On implementation:
- Bump `setup-start/SKILL.md` version: v0002 → v0003.
- Two-place sync: update the `setup-start` entry in `skills/setup-start/references/skill-
  index.md` if the description changes. (It will not change — the visible behavior of
  setup-start is unchanged; the delivery mechanism changes.)
- The `session-start` script is a hook script, not a skill — it has no version field to
  bump. Its changelog lives in git commits.
- The compact stub (`session-start-compact`) is also a hook script. Same convention.
- Separate commit for `skill-index.md` cleanup (remove `design-architect-committee`).
  This is a pre-requisite cleanup, not part of the trigger-split implementation commit.

---

## DM to Researcher (sent this round)

Asked researcher to confirm: was "Choosing Between Skills" (lines 201–203) placed in the
deferrable (non-mandate) set in the round01 analysis, and is there any statement treating
it as load-bearing for the compact stub? This confirms my stub boundary ruling (exclude
the block) against the prior analysis enumeration.

---

## Awaiting researcher response

Position above is complete as written. If researcher confirms "Choosing Between Skills" is
in the deferrable set (as I read from the 417-token floor), no revision needed. If
researcher finds a prior statement treating it as load-bearing, I will revisit section B
and the stub content.

---

<!-- created-at: 2026-06-05 -->
<!-- role: purist -->
<!-- round: 02 -->
<!-- sprint: 20260604-02-review-start-context -->
