# Pragmatist Transcript — Round 02
# Sprint: 20260606-01-update-committee-context-management
# Role: Pragmatist
# Date: 2026-06-06
# Task: DESIGN — propose committee redesign from scratch, pragmatist lens.
# Evidence base: round01 researcher findings + verified round01 evidence packet from TL.

---

## Verified evidence I'm designing against

From TL's round02 dispatch (verified figures):

- TL peaked 347k tokens over the prior session; 2 forced compactions.
- Round01 alone drove 122k tokens in TL context; 347k after round05.
- ~63% (~217k tokens) of TL context was OFF-DISK ephemeral: draft authoring, source reads,
  streamed digests + revisions, consolidator-output read back, reviewer findings.
- Consolidator offloads transcripts — but transcripts were already on disk and TL never read
  them. This means the consolidator addressed a non-leak.
- Ledger step (Per-Round Flow step 3) forces TL to synthesize from digests BEFORE the
  consolidator dispatches. Premature synthesis = TL holds all digest content when it writes
  the ledger.

Key ratio: 63% ephemeral means 137k tokens were from reads and artifacts that stayed on disk.
The leaks are in what passes through TL transiently, not in what sits on disk.

---

## Pragmatist framing: what does "minimal sufficient" mean here?

Three goals from the brief:
(a) Converge on an optimal answer — committee must reach a decision, not just enumerate.
(b) Enable designer decisions — designer needs enough signal to adjudicate.
(c) Ruthlessly minimize TL context while completely retaining meaning.

The current architecture's budget per round:
- Digests in (5 × unknown size, minimum ~50–80 words spec, observed up to 300–600 per TL self-report): arrives in TL context.
- Consolidator-output read back (~3,100 words in rounds 02–05): arrives in TL context.
- TL ledger authoring (synthesizing from the above): in-context work.
- TL committee-analysis authoring (~500–1,000 words): in-context work.
- TL decision packet authoring (translated version of above): in-context work.
- Draft-spec / draft-plan authoring (rounds 02, 04): large in-context work.

Total per round that is inherently TL-context: roughly 6,000–15,000 tokens (digests + consolidator
readback + authoring), probably more in deliberation-heavy rounds.

The 2-function TL constraint simplifies this sharply:
- TL dispatches → sends one message to members.
- TL presents → sends one message to designer.
- Everything between = pipeline that TL does NOT personally run.

Under that constraint: digests → TL → synthesis is the wrong architecture. The correct
architecture is: all member content goes to an off-TL synthesis step; TL receives one
synthesis artifact per round; TL converts it to a designer packet.

---

## The proposed redesign

### Core structural move: single-read TL

The TL reads exactly ONE artifact per round (the synthesis output), then writes exactly ONE
artifact (the designer packet). No digest reads. No consolidator-output reads. No ledger
authoring. No draft authoring.

This requires re-routing member content:
- Members write transcripts to disk (as now).
- Members send no direct message to TL. The digest channel is eliminated.
- Instead: a Synthesizer role reads all transcripts off-disk after members complete, and
  produces a single synthesis artifact the TL reads.

The Synthesizer is NOT the current Consolidator. The Consolidator was enumerate-only —
it deliberately avoided synthesis and recommendation. The current design expects the TL
to do the synthesis step after reading the Consolidator's enumeration. That's what costs
context: TL reads 3,100 words of enumeration and then synthesizes in-context.

The Synthesizer produces a pre-digested decision artifact. It reads full transcripts, does
risk-weighted alignment analysis, identifies the convergent option, names the split if
irreducible, and outputs a compact decision brief. The TL reads the brief, translates it
through the Translation Gate, and presents it to the designer. TL does no original synthesis.

### Channel inventory and cost

**Channel 1 (ELIMINATED): Member → TL digest**
Current cost: 5 × 50–300+ words in TL context per round. Structural flaw: unfiltered,
protocol-drift-prone, in TL context before any off-thread work.
Redesign: eliminated. Members write transcripts; no message to TL.

**Channel 2 (REDESIGNED): Transcripts → Synthesizer**
Members write to `committee/roundNN/<member>-transcript.md` as now. Synthesizer reads all
transcripts off-disk. Cost to TL: zero. Synthesizer has its own context, independent of TL.
This is the same pattern as the current Consolidator but with synthesis authority.

**Channel 3 (REDESIGNED): Synthesizer → TL**
Synthesizer writes `committee/roundNN/synthesis.md` to disk. TL reads this ONE artifact.
Target size: 400–600 words maximum. Enforced by hard word cap in Synthesizer spec.
Contents: alignment count + who-is-where, convergent option or named split, top trade-off,
one notable quote per member. TL reads ~400–600 words instead of 3,100+ words.

**Channel 4 (RETAINED): TL → designer**
TL reads synthesis.md (~500 words), applies Translation Gate, writes designer packet.
Target: ~500–800 words. No change to this channel's content; only its input changes.

**Channel 5 (SIMPLIFIED): Member → member peer DM**
Current: uncapped peer DMs, routed member-to-member, can be lengthy.
Redesign: peer DMs happen as now (direct, no TL routing). But since members no longer
send digests to TL, peer exchange content can be richer without TL cost. This channel
is free from TL perspective — it stays on disk via transcript revisions.

**Channel 6 (REDESIGNED): TL → members (dispatch)**
Current: convening message + round dispatch via SendMessage to 5 members.
Redesign: dispatch is ONE message with question + context path + constraints. Members read
context artifacts themselves — TL does not relay context in the dispatch body. This reduces
dispatch message size and keeps context reads in member threads, not TL.

### Role changes

**Drop: Consolidator**
The Consolidator was designed as enumerate-only to avoid TL dependence on synthesis.
It failed because the TL still had to synthesize from its enumerate output. Replace with
Synthesizer (below). Do not keep both — two off-thread reads for one output adds latency
with no benefit.

**Add: Synthesizer (replaces Consolidator)**
Ephemeral per-round dispatch, same as current Consolidator. Reads all member transcripts.
Outputs `committee/roundNN/synthesis.md`. Hard output cap: 600 words maximum, enforced by
explicit word-count constraint in agent spec.

Contents of synthesis.md:
```
## Alignment
<count and who-is-where — 2–3 sentences>

## Convergent option (or: named split)
<one paragraph — the answer the committee is converging toward, OR the split described
in plain substance if irreducible>

## Top trade-off
<one sentence>

## Notable quotes
<one sentence per member — verbatim or close paraphrase, labeled>

## Recommendation flag
<"convergent" | "split" — one word; TL uses this to gate split-adjudication language>
```

Total target: ~400–500 words. TL reads this instead of 3,100+ words of enumeration.

**Drop: Ledger (as TL-authored artifact)**
The ledger was a cross-round running record the TL maintained. Under the redesign, the TL
never synthesizes from digests, so there is nothing to record mid-round. The Synthesizer's
`synthesis.md` IS the per-round record. A lightweight ledger (round number, convergence flag,
designer decisions) can be written by the Synthesizer as a 3-line append, not by the TL.
TL never authors the ledger.

**Retain: 4 advocacy members**
The four advocacy lenses (conservator, innovator, pragmatist, purist) provide the diversity
that makes committee output non-trivial. Dropping any reduces the coverage that justifies
convening a committee at all. Retain at 4.

**Retain: Researcher (on demand)**
Researcher is already on-demand, not on the deliberation clock. Retain unchanged.
Researcher findings go to transcript (as now), not to TL directly.

**Retain: Designer as adjudicator**
No change.

### Synthesis: who, from what, when

- WHO: Synthesizer (ephemeral subagent, not TL).
- FROM: Member transcripts on disk, read after all four members complete their round.
- WHEN: After members finish writing transcripts and peer DMs complete. Before TL reads
  anything from the round.
- OUTPUT: synthesis.md ≤ 600 words. TL reads nothing else from the round.

The Synthesizer has synthesis authority — it can identify the convergent option, name the
split, and flag which trade-off is load-bearing. This is what the current Consolidator
deliberately avoided. The result is that TL receives a pre-synthesized brief, not an
enumeration it must synthesize from.

Risk: Synthesizer synthesis quality may not match TL's risk-weighted judgment. The
Synthesizer could mislabel a convergence that is actually fragile, or underweight a
minority position that is load-bearing. Mitigation: the designer still adjudicates —
the TL presents options clearly including named dissent, and the designer decides. The
Synthesizer synthesizes for brevity; the designer adjudicates for correctness.

### Convergence mechanism

How does the committee reach an optimal answer rather than just enumerating?

Current architecture: four members write positions → TL synthesizes → TL recommends →
designer adjudicates. Convergence happens between rounds via designer narrowing scope.

Redesign: four members write positions AND do peer exchange (as now). The Synthesizer
identifies convergence within the round — not just who-is-where but whether positions
have moved toward a shared answer through peer exchange. If all four members converge
on one option after peer exchange, Synthesizer flags "convergent" and names the option.
TL presents it as a convergent recommendation. If split remains, Synthesizer flags "split"
and names what each side defends. TL presents the split for designer adjudication.

This is the same convergence mechanism as now, but the synthesis step is off-TL. The
designer sees the same signal; the TL does not hold the synthesis work in context.

One additional convergence mechanism not in the current design: the Synthesizer can
note when all four members have converged but one has a high-confidence reservation.
Current protocol collapses this to a 3-1 split. A 3+1-with-caveat signal preserves
the minority voice at lower cost than a full split adjudication. This is a precision
improvement, not a cost increase.

### Designer decision enablement

The designer currently receives a TL-authored decision packet (Summary + Information Package
+ Decision Package + Team-Lead Comments). That format is well-designed and should be retained.

What changes: the TL's input to that packet shifts from (digests + 3,100-word consolidator
output + in-context synthesis) to (600-word synthesis.md). The packet quality depends on
synthesis.md quality. The output format to the designer is unchanged.

One addition: the TL should include the synthesis.md path in the designer packet so the
designer can read it if the packet leaves something unclear. This costs one line in the
packet and gives the designer direct access to the synthesis artifact without TL relay.

---

## Cost model: redesign vs current

| Item | Current (per round) | Redesign (per round) |
|------|---------------------|----------------------|
| Digest reads (TL context) | 5 × 50–300+ words = 250–1,500+ words | 0 |
| Consolidator/Synthesizer output read (TL context) | ~3,100 words | ~500 words |
| Ledger authoring (TL in-context) | ~300–500 words | 0 (Synthesizer appends) |
| Committee-analysis authoring (TL in-context) | ~500–1,000 words | ~500–800 words (still TL) |
| Draft-spec/plan authoring (TL, specific rounds) | ~1,000–3,000 words | ~1,000–3,000 words (still TL — not changed here) |
| Per-round TL context (exc. draft authoring) | ~4,250–6,100+ words | ~1,000–1,300 words |
| Reduction | — | ~3,000–5,000 words / round |

Over 5 rounds at ~4,000 words reduction each: ~20,000 words / ~80,000 tokens saved. Against
the observed 347k TL peak, this is a ~23% reduction from the persistent structural changes.
Draft authoring (rounds 02, 04 in the prior session) is not addressed here — that is a separate
cost center the current design brief notes but this round does not solve.

### What is NOT fixed by this redesign

- **Draft authoring** (draft-spec, draft-plan, wrapping-skill artifacts): still TL-authored,
  still in-context. This is the remaining large cost center. If the designer later wants to
  address it, offloading to a Scribe (Candidate C from round01) is the path. Out of scope here.
- **System prompt + session carryover**: baseline context cost, not committee-specific.
- **Researcher integration**: researcher findings currently flow through member transcripts
  (not direct to TL). This is already clean; no change needed.

---

## Summary: structural moves, ranked by pragmatist cost-benefit

1. **Eliminate digest channel** — zero messages from members to TL per round. Addresses the
   structural flaw regardless of digest size. Cost: one edit to member-protocol.md.

2. **Replace Consolidator with Synthesizer** — shift from enumerate-only (TL must synthesize)
   to pre-synthesized brief (TL reads and translates). Hard 600-word cap enforced in agent spec.
   Cost: rewrite consolidator agent file. One file.

3. **Drop TL ledger authoring** — Synthesizer appends 3-line ledger entry per round. Cost:
   add 3-line ledger-append to Synthesizer spec.

4. **Dispatch = question + path only** — TL dispatch message carries question and context
   artifact paths; members read context themselves. Reduces dispatch message size.
   Cost: one line change to dispatch protocol in SKILL.md.

All four are two-document changes total (member-protocol.md + Synthesizer agent file) plus
one SKILL.md line. No new roles beyond renaming Consolidator → Synthesizer with expanded
authority. No added latency steps.

---

## DM questions to peers

Sending:
- Researcher: what does prior art say about "synthesis vs enumeration" in multi-agent
  deliberation systems — is there evidence that off-TL synthesis degrades decision quality
  vs TL synthesis?
- Conservator: what existing protocol text in team-lead.md or member-protocol.md would break
  under the "no digest to TL" rule — is there anything that currently requires TL to hold
  digest content for correct operation beyond the ledger step?
- Innovator: is there a simpler role architecture than 4 members + Synthesizer — e.g., could
  the Synthesizer be eliminated by having members write to a shared synthesis document
  collaboratively rather than in parallel transcripts?
- Purist: does shifting synthesis authority from TL to Synthesizer break any categorical
  boundary in the committee's role design — specifically, does TL "adjudicates" become
  incoherent if TL never reads the raw positions?

---

## Peer exchange record (post-DM)

### Conservator reply — digest channel structural dependency confirmed clean

Conservator traced all 8 Per-Round Flow steps. Finding: digest content is structurally required
only at step 3 (ledger), and only because the ledger update is currently ordered before
Synthesizer output lands. Steps 4–8 do not use digest content — step 6 (Final Recommendation)
is already specified to work from Consolidator/Synthesizer output alone (team-lead.md:
"The team-lead reads the Consolidator output... NOT the raw member returns").

Key finding: cut the digest channel and premature synthesis (TL synthesizing from digests before
Consolidator lands) becomes impossible by construction. This is the desired outcome.

One protocol change needed: move ledger update to after Synthesizer output lands (after step 5,
not before step 4). Synthesizer output must include alignment count + who-on-which-side as one
of its fields to supply what the ledger needs. Already in my Synthesizer spec (Alignment section).

**Convergence with conservator:** digest channel elimination is structurally clean. The only
required protocol change is ledger reordering, which my design already handles via Synthesizer-
authored ledger append.

### Conservator exchange — Scribe scope boundary (conservator-initiated DM)

Conservator proposed Scribe for committee-analysis.md only, explicitly not for draft-spec/plan.
My reply agreed and supplied the principle: Scribe is worth it when the artifact has a fixed
template and TL's contribution fits a short structured input. committee-analysis.md passes this
test (fixed template, TL inputs: convergence flag + recommendation sentence + notable dissent).
draft-spec/plan fail it (open-ended, dispatch composition cost approaches authoring cost).

**Convergence with conservator:** Scribe scope = committee-analysis.md only. Both designs
agree. Neither proposes Scribe for draft-spec/plan.

### Innovator reply — blackboard schema vs freeform transcripts

Innovator's blackboard design: members write 6-field structured entries (~180 tokens each),
send one-line done signals to TL, Synthesizer reads blackboard and produces decision artifact
(~500 tokens), TL reads decision artifact only. Eliminates digest channel, consolidator, ledger
synthesis, AND TL committee-analysis authoring.

My reply assessed net ceremony cost:
- Done signals vs nothing-to-TL: marginal (~40 tokens, negligible).
- Schema compliance: new failure surface not in my design. Members must follow 6-field schema
  under deliberation load — same drift risk as current consolidator spec (which drifted 5–7x).
- Committee-analysis authoring eliminated: genuine saving beyond my design. If schema holds,
  Innovator's design is strictly cheaper.

Conclusion stated to Innovator: higher ceiling (eliminates one more TL authoring step), higher
risk (schema compliance). My design: lower ceiling, lower risk. Round03 decides which bet to take.

The load-bearing question for round03: can the blackboard schema be enforced with hard caps
(field-level token limits, Synthesizer validation before read) rather than text prohibition only?
If yes, take the blackboard. If enforcement must be soft, take freeform transcripts.

---

### Purist reply — TL adjudicator vs translator collapse is real, protocol-preventable

Purist confirmed: adjudicator→translator collapse is a genuine categorical risk, not a label
change. Adjudication requires three things: (a) access to competing positions, (b) a judgment
standard, (c) authority to render an independent conclusion — including rejecting all presented
options, synthesizing a new one, or calling the question unanswerable. A translator has none
of (c). The collapse occurs specifically if the TL's protocol does not explicitly preserve (c).

The failure mode: Synthesizer distills 3 options from member positions. TL protocol implies it
must choose among them. TL is rubber-stamping Synthesizer framing. Designer receives
Synthesizer's pre-adjudication laundered through TL's apparent judgment. Wrong decision
structure reaches designer when Synthesizer's distillation is wrong (e.g., collapses two
distinct positions, or misses a fourth option no member named).

Two fixes Purist identifies — both needed:

1. One protocol clause: "TL may reject the Synthesizer's option framing entirely and present
   a reformulated decision question to the designer." Without this, TL is a translator with an
   adjudicator label. Adding this clause makes Synthesizer output input to TL, not constraint.

2. Verbatim quotes per member in synthesis.md: gives TL raw material to independently
   validate Synthesizer's distillation. Without at least one verbatim quote per member per
   option addressed, TL cannot catch Synthesizer mislabeling even with the (c) clause.

**Impact on my design:**

My synthesis.md template had "Notable quotes — one verbatim sentence per member." Purist's
finding sharpens this: quotes need to be per-option, not just per-member. If a member's
position spans two options, one quote may not give TL enough signal to validate option
boundaries.

Revision to synthesis.md spec: quotes field becomes "one verbatim sentence per member per
option they address." This increases word count slightly (still within 600-word cap at typical
2 options × 4 members = 8 quotes × ~20 words = ~160 words; was ~80 words for 4 quotes).

Protocol clause addition: synthesis.md is labeled "member-framed options — TL may reframe
before presentation." TL protocol explicitly states it may reframe, synthesize a new option,
or flag the question as ill-posed.

**Net:** the adjudicator question is resolved — the collapse is real and addressable with two
specific protocol additions. My design was missing the explicit (c) clause; this exchange
surfaces the gap and closes it within the 600-word Synthesizer output cap.

---

### Innovator reply — collaborative synthesis doc ruled out; parallel + Synthesizer confirmed

Innovator evaluated the collaborative synthesis doc directly. Verdict: fails on independence
poisoning and serialization, not a trade-off — a structural disqualifier.

Key findings from Innovator:
- Serialization: Member 4 cannot write until 1-3 complete. Either enforced write order
  (arbitrary) or write collisions (one member overwrites another). Neither is clean.
- Independence poisoning: later members read prior entries before writing. Position anchoring
  from social pressure rather than evidence. Current parallel design preserves independence by
  construction; collaborative writing destroys it.
- Context load grows per member: last writer holds the largest context load. Parallel
  blackboard/transcript writes are context-uniform across members.
- Parallel writing to shared doc requires locking or append-only discipline — coordination
  overhead that defeats the simplicity gain.

Innovator's verdict: collaborative synthesis doc optimizes for role simplicity at the cost of
member independence. Independence is the committee's core epistemic value; losing it makes the
committee not worth running. One extra Synthesizer dispatch per round is the right price for
preserving parallel independence.

**Pragmatist position confirmed:** the collaborative synthesis doc alternative is closed.
Parallel transcripts + Synthesizer is the correct architecture. The only open question for
round03 is blackboard schema (Innovator's variant) vs freeform transcripts (my variant) — and
that question turns on whether schema enforcement can be made hard rather than soft.

---

<!-- created-at: 2026-06-06 -->
<!-- role: pragmatist -->
<!-- round: 02 -->
<!-- updated: post-all-peer-exchanges-final -->
