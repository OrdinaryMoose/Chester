# Conservator Transcript — Round 01
# Sprint: 20260606-01-update-committee-context-management
# Role: Conservator
# Date: 2026-06-06
# Phase: EVALUATE — why does TL still eat most per-round context despite the consolidator?

---

## Lens

Conservator: defend existing structure. Consolidator was just added in pass 1. Is the problem
structural or unfinished rollout? Design history = signal until proven cost.

---

## Ground-Truth Read

Read: design brief (design-00.md), round05 artifacts from 20260604-02-review-start-context,
SKILL.md (v0017), team-lead.md (v0007), member-protocol.md.

### What the protocol actually specifies for digests

member-protocol.md § Digest shape specifies exactly 6 fields:

```
Role:              <role name>
Headline position: <one sentence>
Chosen option:     <structural name>
Top trade-off:     <one sentence>
Confidence:        high | medium | low — <one sentence basis>
Transcript path:   committee/roundNN/<member>-transcript.md
```

Protocol explicitly says: "Keep every prose field to its stated length. The digest is a routing
summary, not an argument; the argument belongs in the transcript."

### What the round05 evidence shows

Word counts (wc -w) for round05:
- conservator-transcript.md: 2,359 words (transcript, disk only — correct)
- innovator-transcript.md: 1,907 words (transcript, disk only — correct)
- pragmatist-transcript.md: 2,179 words (transcript, disk only — correct)
- purist-transcript.md: 1,807 words (transcript, disk only — correct)
- consolidator-output.md: 3,106 words (read by TL after round — ~12k tokens)
- handoff.md: 1,523 words (compaction artifact — in TL context by definition)

The brief claims digests have "run 300–600 words." The protocol specifies 6 short fields —
by my estimate that is ~50–80 words max if each field is one sentence. A 300–600 word
digest is 4-12x the specified maximum. This is protocol drift, not a structural problem.

### TL context sources per round

Layering what genuinely arrives in TL context each round:
1. 4–5 digests × 50–80 words (spec) = ~200–400 words IF protocol followed
2. 4–5 digests × 300–600 words (actual) = ~1,200–3,000 words IF drifted
3. Consolidator output read from disk: ~3,106 words in round05 (in-context)
4. TL-authored artifacts per round: committee-analysis.md (round summary + recommendation),
   ledger update, any draft-spec or draft-plan written — these are large authoring tasks
   done entirely in TL context
5. Prior round's artifacts already in context (accumulation)

The brief identifies three leaks: digest receipt, synthesis, artifact authoring. My read:
these are three DIFFERENT problems with three DIFFERENT root causes and thus three different
fix types.

---

## Position

### (a) Root cause of TL bloat — it's multi-source, not one cause

The brief frames this as one problem. It is three separate accumulation channels:

**Channel 1: Digest drift.** The 300–600 word figure, if accurate, means members are
violating the digest spec. The six-field format is protocol; 300–600 words is 4-12x
overage. This is NOT a structural problem — it is an enforcement problem. The structure
is correct and bounded. Fix: enforce the spec.

**Channel 2: Consolidator output size.** The consolidator emits an "enumerate-only"
artifact — but round05's output was 3,106 words (~12k tokens). "Enumerate-only" has
drifted into a detailed synthesis artifact. The consolidator was designed to be a
compact routing summary; it has grown into a full deliberation record. This is ALSO
protocol drift on the consolidator side. The consolidator-output.md from round05 contains
per-source detailed findings, full failure sequences, code blocks, tables, and extended
quotes — far beyond "one-line per-member summaries."

**Channel 3: TL artifact authoring.** The TL writes draft-spec, draft-plan,
committee-analysis.md, ledger. This is inherent in-context work and cannot be offloaded
without fundamentally changing the TL role. This is a genuine structural cost.

**Root cause hierarchy:**
- Primary: consolidator output has grown well beyond its spec (team-lead.md says
  "alignment count, one-line per-member summaries, verbatim notable quotes" — round05
  output is vastly larger than that).
- Secondary: digest drift if the 300–600 word figure is real.
- Tertiary and structural: TL artifact authoring, which is the irreducible minimum.

### (b) Which fixes hold and why

**Candidate A — Routing-only digests (one line "position written, path X"):**

Partial hold, with risk. The digest spec already bounds digests to 6 short fields. Going
further to one line removes all signal for the TL's risk-weighted adjudication. The TL
needs the headline position, chosen option, top trade-off, and confidence to do the
risk-weighting described in team-lead.md § Consolidation Rules. A routing-only digest
forces the TL to read the consolidator output for ALL signal — which makes the
consolidator-output the sole information source. This is a single point of failure: if
the consolidator output is large (as round05 shows), you've traded many small leaks for
one large one.

The structural change A proposes is sound in principle — reduce TL-facing payload — but
it goes too far. The 6-field digest spec already provides the right abstraction level.
The right fix is to ENFORCE the existing spec, not to further reduce it.

**Candidate B — Gate TL synthesis on consolidator output:**

Holds with a caveat. team-lead.md § Consolidation Rules already says: "the team-lead
reads the Consolidator output... NOT the raw member returns." The protocol already
mandates this. If TL is synthesizing from streaming digests before the consolidator
lands, that is also protocol drift. But: gating synthesis on consolidator output does
not reduce the TL's total context — it just changes the order. TL still reads digests
(6 fields each) AND consolidator output. Serializing the round (B) slows wall-clock
but does not reduce token accumulation. This is a discipline fix, not a context fix.

However, B matters for a different reason: if TL synthesizes from digests first, the
consolidator output is redundant context (TL reads it but its signal is already
incorporated). Gating on consolidator output means the digests become routing-only
signals and the consolidator output becomes the working input — reducing the functional
weight of digests in the synthesis, which indirectly weakens the digest-expansion
incentive.

**Candidate C — Offload draft-artifact authoring to a scribe subagent:**

Strongest structural intervention. This directly addresses Channel 3 — the only channel
that is genuinely structural (not drift). Moving spec/plan authoring off-thread means
the TL produces zero large text blocks per round. The TL adjudicates and routes; the
scribe writes. This is a real reduction. Trade-off: the scribe must have enough context
to produce artifacts of committee quality, which means the dispatch carries significant
context load — the gain is that the TL's thread does not pay the authoring cost, but
someone pays it.

Whether C is net-positive depends on whether the authoring cost is larger than the
dispatch overhead. Given that draft-spec and draft-plan can be thousands of words,
offloading this is plausibly net-positive.

**My ordering:** C addresses the structural channel. B addresses the ordering/discipline
channel (and is already specified). A addresses digest size but over-corrects — the 6-
field spec is the right equilibrium point if enforced.

**But before any structural change: verify whether drift is the actual cause.** If
members actually sent 300–600 word digests in round05, the enforcement fix alone (hold
members to the 6-field spec) may recover a large fraction of the context loss at zero
structural cost. That should be tested before adding complexity.

### (c) Top trade-off

The top trade-off is between **information fidelity for TL risk-weighting** and **context
economy**. Every context-reduction intervention (A, B, or C) takes signal OUT of the TL's
working memory. The TL's risk-weighting requires signal — the quality of the Final
Recommendation depends on it. The consolidator exists precisely to make this a lossy
compression rather than a hard cut: the consolidator reduces volume while preserving
alignment patterns and notable quotes. Any fix that further compresses or removes signal
risks degrading recommendation quality. The conservator's core worry: we build a
context-frugal process and get worse decisions.

---

## Peer Question

DMing researcher to corroborate: I want the actual measured digest word counts from
round05 (not the transcript sizes) — did members send 300-600 word digests or 6-field
digests? This is the key empirical question for root-cause diagnosis. If digests were
actually within spec, the consolidator-output growth is the dominant leak, not the
digest channel. If digests were 300-600 words, drift is primary.

---

## Answer to Incoming Questions

**Researcher reply received.** Two findings:

1. Digest sizes from round05 are NOT RECOVERABLE. Inbox messages are consumed on read and not
   preserved. The 300–600 word figure traces to a TL self-report in a summary file — an unverified
   assertion, not a measured count. Researcher confirms the gap cannot be resolved from available
   evidence.

2. Consolidator drift CONFIRMED and quantified. Round01 output = 452 words (spec-compliant: one-
   line summaries, alignment count, notable quotes). Round05 output = 3,106 words — 7x growth,
   with full convergence sections, LOC math, per-finding tables, extended quotes. "Enumerate-only"
   label stayed on the artifact; its actual content expanded as session topics grew more complex.
   Rounds 02–05 all exceed spec: 2,470–3,340 words each. Only round01 fits the spec.

**Impact on my position:**
- Scenario B (consolidator growth is primary) is now supported by hard evidence. The consolidator
  exceeded its spec mandate by 7x in round05.
- Scenario A (digest drift is primary) remains unresolvable — neither confirmed nor denied.
- Updated conclusion: consolidator-output growth is the CONFIRMED structural drift. It is
  demonstrably the largest documented leak because we can measure it. Digest drift is plausible
  but unverified. Both may coexist.

**This sharpens the fix ordering:** before adding Candidate A (routing-only digests), fix the
consolidator's output spec enforcement — that alone recovers several thousand words per round
from the measured evidence.

---

## Summary of Position (revised post-researcher)

- Root cause: multi-source drift, with consolidator-output growth now CONFIRMED as the largest
  documented leak (7x spec overage from round01 to round05; 2,470–3,340 words across rounds
  02–05 vs a spec of one-line summaries + notable quotes). Digest drift is plausible but
  unverifiable from available evidence. Artifact authoring is structural and irreducible.
- Priority fix ordering:
  1. Enforce the consolidator's "enumerate-only" mandate — this is the documented, measurable
     leak and requires no structural change, only constraint on output scope.
  2. Enforce the 6-field digest spec — this is the correct abstraction level if members held
     to it; drift is likely but unconfirmed.
  3. C (scribe) for the structural authoring channel — legitimate but adds complexity; only
     justified after the drift channels are closed.
  4. B is already in the spec; needs discipline not new structure.
  5. A over-corrects — the 6-field digest spec is the right level if enforced.
- Top trade-off: signal fidelity vs context economy — every compression degrades TL
  risk-weighting capacity; the right target is spec compliance, not further reduction.
- Confidence: high on consolidator diagnosis (hard evidence); medium on digest diagnosis
  (plausible, unverifiable); medium on fix ordering (C could be worth doing early if
  artifact authoring is measurably larger than dispatch overhead).

<!-- produced-by: conservator / round01 / 2026-06-06 -->
