# Conservator Transcript — Round 02
# Sprint: 20260606-01-update-committee-context-management
# Role: Conservator
# Date: 2026-06-06
# Phase: DESIGN (generative) — redesign committee roles + comms channels

---

## Lens Statement

Conservator: guard meaning. Ruthless compression risks dropping load-bearing signal.
Before proposing, I name what MUST be retained — then build a design that keeps it.

---

## What Must Be Retained (Non-Negotiables)

Before redesigning anything, I establish what the committee exists to produce and what
therefore cannot be traded away.

**1. Perspective diversity reaching the designer.** The committee's value is that four
structurally distinct lenses (conservator/innovator/pragmatist/purist) surface
irreducible tensions the designer wouldn't see alone. If synthesis collapses these
into a single recommendation before the designer sees the split, the committee has
done the designer's job. Alignment PATTERNS (4-0, 3-1, 2-2, 2-1-1) must survive
to the designer surface — not raw arguments, but the FACT of who stands where.

**2. Dissent visibility.** A 3-1 split where the 1 holds a kill-shot concern is
more important than the 3. Any design that weights by count without surfacing
minority positions will systematically discard the most load-bearing signal.
Dissent must reach the TL (and therefore the designer) with its strength, not
just its count.

**3. Evidence provenance.** The designer must be able to challenge the synthesis.
"Researcher confirmed X" carries different weight than "Pragmatist asserted X."
Source labels must survive compression. Invented confidence without traceable
basis is worse than no recommendation at all.

**4. Convergence finding vs. enumeration.** The current design produces enumeration
(consolidator) and then synthesis (TL). The designer needs the synthesis — what the
committee CONCLUDED — not just what each member said. A redesign that only enumerates
without converging fails the design task.

**5. Designer's ability to ask follow-up.** The designer adjudicates. That requires
being able to ask "what did the Conservator say about X?" and get an answer. This
means transcripts must stay on disk and be reachable even if they never enter TL
context.

---

## Root Cause Diagnosis (carrying forward from round01)

Confirmed evidence:
- TL peaked at 347k tokens; 63% (~217k) is ephemeral off-disk content.
- Consolidator-output drifted 5-7x over its cap (rounds 02-05: 2,470-3,340 words).
- Premature synthesis: TL must update ledger from digests BEFORE consolidator runs,
  forcing TL to hold and process digest content twice.
- Digests unverifiable in size but plausibly overran the 6-field spec.
- Artifact authoring (draft-spec, draft-plan, committee-analysis.md) is inherently
  in-context and is the irreducible structural cost.

Key insight: the TL is doing THREE different things that each have different context
profiles:
(A) Routing/orchestration: zero content needed — just pointers and sequencing.
(B) Synthesis/judgment: needs alignment PATTERN + minority positions, NOT raw content.
(C) Artifact authoring: needs synthesis output and constraints — NOT raw transcripts.

Current design blurs these. The redesign should separate them.

---

## Conservator Redesign Proposal

### Core Structural Move: Separate Routing, Synthesis, and Authoring

The 2-function TL (dispatch + present) demands that everything between those two
functions moves off the TL's thread. I propose three structural changes that together
achieve this.

---

### Change 1: Replace the Consolidator with a Synthesizer

**Current:** Consolidator reads transcripts, emits an "enumerate-only" artifact
(alignment counts + one-line summaries + notable quotes). TL reads this, then
SEPARATELY applies risk-weighted judgment to produce a recommendation.

**Problem:** (a) The enumerate-only artifact drifted to 3,000+ words in practice
because "enumerate only" with no size ceiling becomes "enumerate fully." (b) TL must
still do synthesis work AFTER reading it, meaning TL holds the consolidator output in
context AND does synthesis authoring on top. Two in-context costs where there was meant
to be one.

**Proposed: Synthesizer role.** Same off-thread dispatch as the Consolidator. Reads
all transcripts from disk. But its output mandate is different:

```
Synthesizer output format (hard ceiling: 400 words):
- Alignment: [pattern, e.g. "3-1"] — [who on each side, one phrase each]
- Convergence: [what the committee agrees on, if anything — one sentence]
- Live split: [the irreducible tension, if any — one sentence naming what each side
  defends, NOT just a count]
- Dominant evidence: [the 1-3 pieces of grounded evidence that most constrain the
  decision — source-labeled, one line each]
- Minority concern: [the strongest single dissent with its strength marker — one line]
- Open fork: [any question the committee couldn't close — one line, or "none"]
```

This is 6 fields, all single-sentence or one-line, with a hard 400-word ceiling.
The TL reads this and has EVERYTHING needed to (a) update the ledger and (b) build
the designer packet — without synthesizing from scratch.

**What this preserves:** alignment patterns, dissent visibility, evidence provenance,
convergence finding. What it drops: extended quotes, full per-source breakdowns, LOC
math, code blocks. Those stay on disk in transcripts.

**What the Synthesizer is NOT allowed to do:** recommend. It synthesizes position
structure; the TL risk-weights and recommends. The synthesis/recommendation boundary
must be enforced in the Synthesizer's role spec.

---

### Change 2: Structured Member Channels — Machine-readable digest, disk-first content

**Current:** Members send TL digests (claimed 300-600 words, specified as 6 fields
but with no enforcement; size unverifiable). TL receives all digests, synthesizes
prematuraly from streaming content before Consolidator lands.

**Proposed: Two-layer member output.**

Layer A — Disk write (full transcript, unlimited): member writes everything to
`committee/roundNN/<member>-transcript.md`. No change here. This is working correctly.

Layer B — TL-facing signal packet (hard ceiling: 6 structured fields, enum-constrained):

```
stance:       [HOLD | SHIFT | SPLIT | CONCEDE]
position_ref: committee/roundNN/<member>-transcript.md
option:       [structural name of chosen option, ≤10 words]
kill_shot:    [YES/NO — if YES: one-sentence failure mode]
trade_off:    [one sentence — the load-bearing cost of the chosen option]
confidence:   [HIGH | MEDIUM | LOW]
```

**Key changes from current spec:**
- `stance` is an enum (HOLD/SHIFT/SPLIT/CONCEDE), not prose. Tells TL immediately
  whether a member changed position — critical signal with zero word cost.
- `kill_shot` is boolean + one sentence. The current spec has no kill-shot flag;
  TL must read the transcript or the consolidator to find one. This surfaces it
  immediately without prose content.
- `position_ref` replaces "Transcript path" — same content, reframed as a disk
  reference pointer, not a filing note.
- All prose fields are one sentence, hard. No multi-sentence fields.
- Hard ceiling: ~40-60 words total per digest. Not 6 fields of variable length.

**Why the kill_shot field matters:** The consolidator pattern from round05 showed that
the Conservator's kill-shot (anchor-absent = catastrophic deletion) was the most
load-bearing single finding. In the current design, the TL has to read the full
consolidator output to discover this. A boolean flag in the digest surfaces it
immediately and tells the TL "read this transcript before synthesizing."

**Peer-DM channel:** no change proposed. Members DM each other directly, no TL relay.
These never enter TL context. Working correctly.

---

### Change 3: Ledger-update Gate — Synthesizer runs FIRST, ledger updated from
Synthesizer output

**Current problem:** TL updates the ledger at the "round boundary" (step 3 of
Per-Round Flow), which forces TL to synthesize alignment from streaming digests BEFORE
the Consolidator (now Synthesizer) runs. This is the "premature synthesis" problem —
TL does synthesis work twice: once from digests (ledger), once from consolidator
output (committee-analysis.md).

**Proposed fix:** Change the Per-Round Flow ordering:

```
Current order:
1. Dispatch question
2. One-round-format runs → TL receives digests
3. Update ledger (TL synthesizes from digests — premature)
4. Dispatch Consolidator
5. Read Consolidator output
6. Write round's Final Recommendation
7. Present to designer

Proposed order:
1. Dispatch question
2. One-round-format runs → TL receives digests (pointers only, no prose synthesis)
3. Dispatch Synthesizer (same dispatch as Consolidator, new output format)
4. Read Synthesizer output (400 words, structured, all signal present)
5. Update ledger FROM Synthesizer output (single synthesis pass — no premature step)
6. Write round's Final Recommendation from Synthesizer output
7. Present to designer
```

**What this eliminates:** the TL's premature synthesis step. The TL never synthesizes
from raw digests. The Synthesizer does one synthesis pass off-thread; the TL reads the
result and works from it for BOTH the ledger update AND the recommendation. One
in-context read, not two synthesis passes.

**Preserved:** ledger still updated every round. Per-round record still on disk.
Designer can still ask "what happened in round03?" and get it from the ledger.

---

### Change 4: Scribe for Artifact Authoring (Candidate C, now structural)

**Current:** TL authors all artifacts — draft-spec, draft-plan, committee-analysis.md,
ledger updates. This is inherently in-context and is the only channel I classify as
genuinely structural (not drift).

**Proposed:** Scribe role for committee-analysis.md. The TL DICTATES (sends a structured
message with the Synthesizer output + the TL's risk-weighted recommendation sentence),
and the Scribe WRITES the full committee-analysis.md to disk. The TL never authors the
prose document — only the recommendation sentence.

**Scope limit (Conservator constraint):** Scribe for committee-analysis.md ONLY. NOT
for draft-spec or draft-plan — those require TL judgment about the full design space
and cannot be faithfully delegated to a scribe from a structured message alone. The
authoring cost for draft-spec/plan is proportional to the design complexity; it cannot
be eliminated without risking quality loss on the most important artifacts.

**Why committee-analysis.md is different:** this document is a formatted container for
the Synthesizer output plus the TL recommendation. Its content is almost entirely
determined by the structured inputs. A Scribe receiving those inputs can produce the
document with high fidelity. The TL's unique contribution is the recommendation
sentence, which it still authors.

**Dispatch cost:** Scribe is an ephemeral dispatch (same pattern as Synthesizer). One
extra spawn per round. Net cost is the dispatch overhead; net gain is the TL's
authoring work for committee-analysis.md eliminated from TL context.

---

### Change 5: Hard output ceilings in every role spec

The consolidator-output drift (452 words round01 → 3,106 words round05) happened
because "enumerate-only" has no ceiling. Every role in the redesigned committee must
carry a word-count ceiling in its spec, not just a content description.

Proposed ceilings:
- Member digest (Layer B signal packet): 60 words hard ceiling.
- Synthesizer output: 400 words hard ceiling.
- TL designer packet (Information Package + Decision Package + TL Comments): 600 words
  soft ceiling, 800 hard.
- Ledger entry per round: 100 words hard ceiling.

These are enforced by the role spec, not by post-hoc measurement. Each role self-
enforces before sending. The TL checks at consolidation.

---

## Membership — Keep Four Lenses + Researcher

**Conservator position: the four advocacy lenses are load-bearing. Do not reduce.**

The four-lens structure (conservator/innovator/pragmatist/purist) produces the 2-1-1
and 3-1 patterns that are the committee's primary value. Reducing to two or three
members collapses the deliberation space — a 2-0 split is not the same information
as a 4-0 or 3-1. The designer needs to know where the split is, not just that there
is one.

Researcher stays: the researcher grounds empirical claims. Round01 of this sprint
would have produced a false diagnosis (digest drift as primary) without the researcher
finding (digest sizes unrecoverable; consolidator drift confirmed). This is exactly the
researcher's function.

What changes: Consolidator → Synthesizer (role redefined, same spawn pattern). Scribe
added (ephemeral per-round, same spawn pattern as Synthesizer). Net roster change:
+1 role type (Scribe), Consolidator replaced by Synthesizer.

---

## What Breaks Under Each Compression Move (Conservator Flag)

**Candidate A (routing-only digests, one line):** breaks TL's kill-shot detection.
The TL cannot tell from a routing pointer whether a member found a fatal flaw. My
redesign instead adds a `kill_shot: YES/NO` field, which preserves this signal at
zero prose cost.

**Candidate B (gate synthesis on consolidator output):** already in spec, but doesn't
solve premature synthesis — the ledger step still forces TL to process digests before
the consolidator runs. My proposed ordering fix (Change 3) actually closes this.

**Candidate C (scribe for all artifacts):** risks quality degradation on draft-spec
and draft-plan, which require TL judgment. I support Scribe for committee-analysis.md
only. The scoped version is safe; the broad version is not.

**Removing the Researcher:** breaks empirical grounding. Round01 diagnosis would have
been wrong without the researcher. Keep.

**Removing any advocacy member:** collapses the split pattern space. 3-member committee
produces 2-1 or 3-0; loses 2-1-1, 2-2. The split pattern IS the information.

**Dropping notable quotes from Synthesizer:** acceptable IF transcript path is always
present and reachable. The designer can ask for the quote. Quotes in the Synthesizer
output are convenience; transcripts are the durable record.

---

## Summary of Conservator Redesign

Five structural changes:

1. **Consolidator → Synthesizer.** Same off-thread dispatch; different output mandate.
   6-field structured output, 400-word hard ceiling. Includes convergence finding,
   dominant evidence with source labels, minority concern, open fork. NOT a recommendation.

2. **Member digest → structured signal packet.** 6 enum/one-sentence fields, 60-word
   hard ceiling. Adds `stance` enum (HOLD/SHIFT/SPLIT/CONCEDE) and `kill_shot` boolean.
   Drops prose fields entirely.

3. **Per-round flow reordered.** Synthesizer runs before ledger update. TL synthesizes
   ONCE from Synthesizer output, not twice (once from digests, once from consolidator).

4. **Scribe for committee-analysis.md.** TL dictates (Synthesizer output + one
   recommendation sentence); Scribe writes the document. TL authoring cost for
   committee-analysis.md eliminated. Draft-spec and draft-plan stay with TL.

5. **Hard word-count ceilings in every role spec.** The drift happened because specs
   described content without size constraints. All outputs get hard ceilings.

**Membership:** unchanged at four advocacy + researcher. Consolidator replaced by
Synthesizer (same slot). Scribe added (ephemeral).

**Biggest trade-off:** the Synthesizer's 400-word output drops raw content (extended
quotes, code blocks, per-finding tables) that currently lives in the consolidator-output
and is used as a working reference by the TL. Under the redesign, TL reads the
Synthesizer output and then reaches for transcripts on disk when needed — on-demand,
not all-at-once. This is a read-discipline change: TL must be willing to read individual
transcripts selectively rather than having all content pre-summarized. If TL reads
transcripts unnecessarily, the gain is lost.

---

## Peer-DM Resolution Notes (recorded post-HALT, for round03 reference)

**Innovator — kill_shot sequencing:** Innovator accepts kill_shot as field 7 in their blackboard
schema. Convergent intent — same boolean, different surface (my direct signal packet vs
Innovator's blackboard-then-Synthesizer path). Innovator's protocol answer: TL ALWAYS waits for
Synthesizer before acting; kill_shot surfaces in Synthesizer artifact same round, one dispatch
later. I accept this IF the "TL always waits" constraint is hard-enforced in the protocol spec.
The load-bearing condition: if TL is ever allowed to act mid-round before Synthesizer lands, the
blackboard path loses kill_shot visibility. The two designs converge on the field; they differ
only on enforcement surface. Round03 convergence question: direct signal packet or blackboard?

**Pragmatist — Scribe scope:** Pragmatist is NOT proposing Scribe for draft-spec or draft-plan.
Explicit in their round02 transcript, same rationale (dispatch composition cost approaches in-
context authoring cost for open-ended artifacts). Convergence on: Scribe for committee-analysis.md
only, where fixed template makes dispatch composition cheap. Aligned on scope.

**Pragmatist — protocol trace:** Confirmed by protocol trace (my reply to Pragmatist DM) that
digest content is structurally required ONLY at step 3 (ledger update), and only because ledger
is ordered before Synthesizer output. Reorder those two steps and digest channel is structurally
dispensable. Supports Pragmatist's digest-free design and is consistent with my Per-Round Flow
reordering. This is now grounded in both analysis and Pragmatist's design intent.

**Purist — synthesis/recommendation boundary (DECISIVE, amends Conservator redesign):**
The boundary I drew is porous at strength labels specifically. Purist's ruling:

- "Dominant evidence" CAN be neutral if the selection rule is mechanical: "cited by the most
  members across transcripts" = a count. Porous if "dominant" means "most important" (implicit
  consequence assessment = recommendation in disguise). Fix: state selection rule as frequency
  count in the Synthesizer's protocol spec.

- "Minority concern: HIGH strength" is NOT neutral. Consequence assessment (strength = how much
  this matters) belongs to the TL. The Synthesizer labeling strength pre-weights the concern;
  TL inherits it rather than independently deriving it. Laundered recommendation.

- Fix: replace strength labels with structural descriptions — who holds the concern, whether it
  survived peer exchange (DM received/sent on this point), whether majority members engaged with
  it in their transcripts. These are facts. TL draws consequence conclusion from facts.

- Trade-off: neutral synthesis requires more TL interpretive work. Purist: that is correct
  allocation — interpretive work belongs to TL, not Synthesizer.

Impact on Conservator redesign: Synthesizer `minority_concern` field must be revised. Drop
"with its strength marker" — replace with structural description: holder, peer-challenged (Y/N),
majority-engaged (Y/N). One-field revision. The dominant_evidence selection rule must also be
stated as frequency count in the Synthesizer role spec, not left as implicit judgment.

<!-- produced-by: conservator / round02 / 2026-06-06 -->
