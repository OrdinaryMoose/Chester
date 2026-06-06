# Purist Transcript — Round 02
# Sprint: 20260606-01-update-committee-context-management
# Role: Purist — category boundaries + compositional integrity
# Date: 2026-06-06
# Question: Redesign committee roles + all comms channels for TL = exactly 2 functions
#            (dispatch, present). Ruthlessly minimize context, completely retain meaning.

---

## Framing: The Category Problem

The designer constraint is exact: TL does dispatch and present. Nothing else.

That constraint forces a category question: synthesis is real work. If TL does not own it,
whose category is it? This is not a detail — it is the load-bearing design choice that all
other decisions follow from.

Synthesis has three components:
- (a) Alignment counting: who agrees with whom, what is the pattern.
- (b) Option distillation: what are the actual structural choices surfacing from the positions.
- (c) Risk weighting: which option the TL recommends and why.

Under the constraint, TL can own (c) as part of "present" — a recommendation is a
presentation artifact. But (c) requires (a) and (b) as inputs. If TL cannot do (a) and (b),
something else must hand them to TL already resolved, in a format TL can directly present.

The Consolidator is the natural owner of (a) and (b). It already reads all transcripts
off-thread. Expanding its scope from "enumerate positions" to "synthesize alignment + options"
is a clean boundary extension — same input, richer output, still entirely off-thread.

This is the anchor for the entire redesign.

---

## Redesign Proposal

### Role Definitions (revised)

**Team-Lead** — 2 functions only: (1) dispatch task to committee, (2) present synthesized
decision packet to designer, adding risk-weighted recommendation (c). Reads ONE artifact per
round: the Synthesizer output. Writes ONE artifact: the designer-facing decision packet.
Holds NO raw member content at any point.

**Synthesizer** (replaces Consolidator + absorbs TL synthesis) — permanent off-thread role.
Per round: reads all member transcripts from disk, produces one artifact with three sections:
  - Alignment map: who is on which side, named explicitly (owns synthesis job (a)).
  - Option set: the distinct structural choices that emerge from the positions, named by what
    they do structurally, not by member labels (owns synthesis job (b)).
  - Key evidence per option: one verbatim quote per member per option, selected for maximum
    diagnostic value (enables TL to apply (c) without reading raw transcripts).
The Synthesizer never sends a message to TL — it writes a file. TL reads the file once.

**Members (4 advocacy roles)** — unchanged in composition (conservator, innovator,
pragmatist, purist). Changed in output contract:
  - Write full transcript to disk (unchanged).
  - Send TL a ROUTING SIGNAL ONLY: one line, no prose. Format: "DONE path/to/transcript.md"
  - No digest content. No argument. No position summary. The transcript is the position.
  - Peer DM unchanged: members DM each other directly during the round.

**Researcher** — unchanged in scope. Writes findings to disk. Sends TL a routing signal
("DONE path/to/researcher-findings.md"). Does NOT send findings content to TL.

**Designer** — unchanged. Adjudicates. Sets meta-rules.

---

### Channel Definitions (redesigned)

Each channel gets exactly one job. Mixed-job channels are abolished.

**Channel 1: TL → Members (dispatch)**
- Job: task delivery.
- Format: question + context packet references (file paths only, no inline content) +
  round shape + peer-DM scope authorization.
- Size: small. No inline content. References only.
- Category: routing. Pure.

**Channel 2: Members → TL (return)**
- Job: completion signal. One line. "DONE path/to/transcript.md"
- Format: exactly one line. No fields. No sentences. No argument.
- Size: trivial. ~10 tokens per member.
- Category: routing signal. Pure.
- Current problem abolished: digests carried both routing AND argument. This channel carries
  routing only. Argument lives in the transcript (on disk, not in TL context).

**Channel 3: Members ↔ Members (peer DM)**
- Job: argument exchange + challenge.
- Format: free-form reasoning. Code vocab permitted (not designer-facing).
- Size: bounded by the question. No change from current design.
- Category: deliberation. Pure.
- Note: peer DMs land in each member's context, not TL's. No cross-contamination.

**Channel 4: Synthesizer → TL (synthesis artifact)**
- Job: decision-ready summary of the round.
- Format: three fixed sections — alignment map, option set, key evidence.
  TL reads this file once. TL does NOT read raw transcripts or member findings directly.
- Size: targeted. Key evidence = one verbatim quote per member per option, not full arguments.
  Alignment map = named list, not prose. Option set = structured, not narrative.
- Category: synthesis output. Pure. Synthesizer writes; TL reads once; no back-channel.

**Channel 5: TL → Designer (decision packet)**
- Job: presentation + recommendation.
- Format: existing Information Packet Format (summary, information package, decision package,
  team-lead comments). Unchanged — this is the one designer-facing surface.
- Size: bounded by the packet format.
- Category: presentation. Pure.

---

### Synthesis Ownership (the load-bearing question)

Synthesizer owns (a) and (b). TL owns (c).

**Why Synthesizer owns (a) and (b) and not a member or the TL:**
- Members cannot own (a) or (b) because each member sees only its own reasoning plus peer DMs.
  No member has full round visibility. Giving a member synthesis authority collapses the
  multi-perspective structure into one perspective's framing.
- TL cannot own (a) or (b) under the 2-function constraint. If TL synthesizes, it must hold
  raw content to synthesize from — which is the current failure.
- Synthesizer reads ALL transcripts off-thread. Full round visibility is its defining property.
  It is structurally the correct owner of alignment counting and option distillation.

**Why TL owns (c) and not Synthesizer:**
- Risk-weighted recommendation is an adjudication-adjacent function — it requires standing to
  make a judgment call on behalf of the committee, not just enumerate what the committee said.
  That standing belongs to the role that faces the designer.
- If Synthesizer owned (c), the TL would be a relay — presenting a recommendation it did not
  make. That collapses TL into a message courier, not a presenter. The designer relationship
  requires the TL to own (c).
- Synthesizer has no design opinion by construction (same constraint as current Consolidator).
  Giving it (c) would violate its category.

**Clean boundary:** Synthesizer = enumerate and structure (no opinion). TL = recommend and
present (opinion explicitly marked, from synthesized input only).

---

### Convergence: How the Committee Reaches Optimal Answer

Current problem: the committee enumerates positions but does not converge. TL adjudicates from
enumeration + its own synthesis — overloading TL and bypassing committee convergence.

Redesign convergence mechanism: **two-pass member protocol**.

Pass 1 (standard deliberation): members write positions, peer-DM, revise. Synthesizer reads,
produces synthesis artifact. TL reads synthesis, presents to designer.

Pass 2 (optional, triggered by split): if the synthesis artifact shows an irreducible split
(two or more options with strong defenses), TL can dispatch a convergence question to members:
"Given the synthesizer output at [path], does your position change? State yes/no and one
sentence if yes." Members read the synthesis artifact directly (it is on disk, they can read
it). They send back: "UNCHANGED" or "REVISED: [one sentence]." Synthesizer runs again on
revised transcripts. TL presents updated alignment.

**Why this is categorically clean:**
- Pass 2 members read a synthesis artifact, not each other's raw transcripts. They respond
  to a structured question, not free-form deliberation.
- The "UNCHANGED / REVISED: one sentence" return format is a routing signal with a minimal
  payload. It is not a new digest channel — the sentence is the revision summary, not an
  argument. The argument is in the updated transcript.
- Pass 2 is optional: the TL decides whether to run it based on whether the synthesis shows
  a split worth resolving. TL is not running synthesis to make that decision — it is reading
  the alignment map section of the synthesis artifact. A 4-0 alignment = no pass 2. A 2-2
  split = pass 2 is worth running.

**Convergence without TL bloat:** pass 2 adds one Synthesizer run and one routing-signal
return per member. TL receives 4-5 one-line returns + one updated synthesis artifact. No
raw content enters TL context.

---

### Ledger Redesign

Current problem (confirmed round01): the ledger update (step 3) requires alignment synthesis
BEFORE the Synthesizer/Consolidator runs (step 4). This forces TL synthesis from digests.

Fix: ledger is written AFTER the Synthesizer artifact lands. Ledger draws alignment pattern
from the synthesis artifact's alignment map section, not from digests. The step ordering
becomes:

1. Dispatch question to members.
2. Members deliberate, write transcripts, send routing signals to TL.
3. TL dispatches Synthesizer (after all routing signals received — all members complete).
4. Synthesizer writes synthesis artifact.
5. TL reads synthesis artifact.
6. TL writes ledger update (alignment from synthesis artifact, not digests).
7. TL writes decision packet.
8. TL presents to designer.

No TL synthesis work occurs before step 5. Steps 6 and 7 draw entirely from the synthesis
artifact. TL holds: the synthesis artifact (one file, read once), the decision packet
(in construction), and the ledger entry (small). Nothing else.

---

### Membership (what to keep, what to drop, what to add)

**Keep all four advocacy members.** The four lenses (conservator, innovator, pragmatist,
purist) are the committee's core value. Removing a lens collapses perspective diversity.
Each member has a single category (one lens). This is already clean.

**Keep researcher.** Grounds claims in evidence. Off-demand usage (not every round) is
already correct. No change.

**Replace Consolidator with Synthesizer.** The Consolidator's scope was intentionally thin
(enumerate-only) because TL was supposed to synthesize from digests. That design assumed
the wrong owner for synthesis. Synthesizer absorbs the scope the TL was wrongly holding.
This is not "adding a role" — it is correctly assigning an existing implicit role.

**Do not add a Scribe.** Candidate C (round01) proposed a Scribe for artifact authoring.
Under this redesign, TL authors only two artifacts per round: the ledger entry and the
decision packet. Both are small and naturally in TL's "present" function. A Scribe adds
coordination cost for minimal authoring offload. The case for Scribe collapses when TL's
authoring burden is correctly bounded.

---

### Info Packet Format (size minimization)

The designer-facing decision packet format is already well-designed (summary, information
package, decision package, team-lead comments). No structural change needed there.

The change is in what feeds it:

**Synthesis artifact format (Synthesizer output) — proposed:**

```
# Synthesis — Round NN
## Alignment map
- [Option A name]: conservator, pragmatist (2)
- [Option B name]: innovator (1)
- [Option C name]: purist (1)
Split: 2-1-1

## Options
Option A — [structural name]: [one sentence — what it does structurally]
Option B — [structural name]: [one sentence]
Option C — [structural name]: [one sentence]

## Key evidence
Option A: "[verbatim quote, conservator]" / "[verbatim quote, pragmatist]"
Option B: "[verbatim quote, innovator]"
Option C: "[verbatim quote, purist]"
```

Target size: ~500-800 tokens. Compare to current consolidator-output.md at 21k tokens
(round05 evidence). This is a ~25-40x reduction in the artifact TL reads per round.

The reduction is achieved by:
- Alignment map: names only, no prose (current consolidator includes per-source headline +
  verdict paragraphs).
- Options: one sentence each (current consolidator includes multi-paragraph analysis per
  position).
- Key evidence: ONE quote per member per option, not full summaries.

TL gets enough to apply risk-weighting and write the decision packet. Full reasoning lives
in transcripts on disk.

---

### Category Cleanliness Audit (full channel list)

| Channel | Job | Format | Category clean? |
|---------|-----|--------|----------------|
| TL → Members | Dispatch task | Question + file refs | YES — one job |
| Members → TL | Completion signal | "DONE path" | YES — one job |
| Members ↔ Members | Argument exchange | Free-form | YES — one job |
| Researcher → disk | Evidence record | Findings file | YES — one job |
| Researcher → TL | Completion signal | "DONE path" | YES — one job |
| Synthesizer → disk | Synthesis artifact | Fixed-section format | YES — one job |
| TL reads synthesis | Information input | File read, once | YES — one job |
| TL → Designer | Present + recommend | Packet format | YES — one job |

No channel carries two jobs. No role holds raw content it should not see.

---

### Biggest Trade-off

The Synthesizer now does more than the Consolidator did. It distills options and selects key
evidence — that is interpretive work, not pure enumeration. There is a risk the Synthesizer
introduces framing bias: by choosing which quote is "key evidence" and how to name an option
structurally, it shapes how the TL (and therefore the designer) sees the decision.

Mitigations:
- Option names are structural (what the option does), not evaluative. No "good" or "better."
- Key evidence selection: one quote per member per option = the member chooses its strongest
  statement; the Synthesizer takes the first/most explicit rather than cherry-picking.
- The Synthesizer has no design opinion (same constraint as current Consolidator). Its role
  is to structure, not to recommend.
- Full transcripts remain on disk. TL can read any transcript if it suspects framing distortion.

The trade-off is real: more powerful Synthesizer = more interpretation risk. The mitigation
is structural constraints on Synthesizer output format, not behavioral instructions to "be
neutral."

---

## Summary

The redesign has four structural moves:

1. **Routing-signal-only returns (replaces digests).** Members send "DONE path" only.
   Argument stays in transcripts on disk. TL never holds member reasoning in context.

2. **Synthesizer absorbs synthesis jobs (a) and (b).** Produces a ~500-800 token artifact
   with alignment map, option set, and key evidence. TL reads this once and nowhere else.
   Consolidator scope expands and its name changes to reflect the expanded role.

3. **Ledger drawn from synthesis artifact, not digests.** Step ordering fixed: ledger written
   after Synthesizer artifact lands, not before. Eliminates structural forced-synthesis.

4. **Optional pass-2 convergence protocol.** If synthesis shows irreducible split, TL can
   dispatch a convergence question. Members read synthesis artifact from disk, return
   "UNCHANGED" or "REVISED: one sentence." Synthesizer re-runs. Convergence without TL
   holding raw content.

The result: TL holds two artifacts per round (synthesis artifact + decision packet under
construction). No raw member content. No digest stream. No premature synthesis. All four
jobs the current TL conflates (route, synthesize, author, adjudicate) are either dropped
(route → routing signals only, no TL routing work needed), delegated (synthesize → Synthesizer),
reduced (author → two small artifacts only), or retained cleanly (adjudicate + present).

---

<!-- created-at: 2026-06-06 -->
<!-- role: purist -->
<!-- round: 02 -->
<!-- sprint: 20260606-01-update-committee-context-management -->
