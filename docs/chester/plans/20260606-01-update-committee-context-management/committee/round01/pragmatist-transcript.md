# Pragmatist Transcript — Round 01
# Sprint: 20260606-01-update-committee-context-management
# Role: Pragmatist
# Date: 2026-06-06
# Question: Why does team-lead still eat most per-round context despite the consolidator?
#            What structural change actually offloads it?

---

## Ground truth gathered

Evidence base before forming any position:

- Brief: `20260606-01-update-committee-context-management-design-00.md` — read in full.
- Prior committee session: `20260604-02-review-start-context/committee/round05/`
  - `consolidator-output.md` — 373 lines, substantial enumeration artifact.
  - `handoff.md` — post-compaction resume artifact; confirms TL hit 200k+ tokens one round,
    compacted mid-session at ~380k.
  - Member transcripts: confirmed 12–15k token range (pragmatist-transcript.md is ~290 lines,
    easily 3k+ tokens; researcher-findings.md and consolidator-output.md are larger).
- `design-committee/SKILL.md` — full protocol read.
- `design-committee/references/team-lead.md` — full read; Per-Round Flow steps 1-8 are the
  structural basis for this analysis.
- `design-committee/references/member-protocol.md` — digest shape confirmed.

---

## (a) Root cause of TL bloat

The brief correctly identifies three cost centers. From a pragmatist lens, the question is which
one dominates and which one is cheapest to cut.

### The three cost centers, ranked by magnitude

**1. Member digests arriving in-context (biggest leak)**

The digest field spec in member-protocol.md says "keep every prose field to its stated length."
In practice the digest contains six fields — Role, Headline position, Chosen option, Top
trade-off, Confidence + basis, Transcript path. "One sentence" fields tend to run long under
deliberation load. With four members + researcher, that is 5 digests per round. If each runs
300–600 words (the brief's figure, flagged as UNTESTED), that is 1,500–3,000 words per round
flowing into TL context — before the TL does any synthesis.

The consolidator does not touch this at all. It reads transcripts off-thread and writes
`consolidator-output.md`. The digest channel bypasses the consolidator completely. This is the
structural leak the brief describes accurately.

**2. TL artifact authoring (medium, inherent)**

TL writes the ledger update, `committee-analysis.md`, and the designer-facing decision packet
each round. These are genuinely in-context operations — the TL has to hold current-round
synthesis while writing them. The brief names this correctly as not offloaded. However, this
cost is bounded per round by the complexity of the question, not by member count. It does not
compound from member-to-member the way digests do. In round05 of the prior session the
committee-analysis and decision packet were probably ~1,000–2,000 words. Significant, but not
the dominant multiplier.

**3. TL synthesizing from streaming digests before consolidator lands (timing, medium)**

The brief asserts consolidator-output.md arrives *after* the TL has already narrated round
synthesis. This is flagged UNTESTED. From process mechanics: members send digests after writing
transcripts (write-then-send). TL receives four digests. TL then dispatches the consolidator.
Consolidator reads 4 transcripts and writes consolidator-output.md. Only then does TL read it.

So the sequence is:
1. TL receives 4+ digests (full content in context)
2. TL dispatches consolidator
3. Consolidator outputs
4. TL reads consolidator output

The consolidator was designed to prevent the TL from reading raw transcripts (12–15k each). It
succeeds at that. But by step 4 the TL has already consumed the digests in step 1 — the
consolidator output is partially redundant for synthesis purposes because the TL has already
read the substance (in digest form). This is the "partly redundant" observation in the brief.

**Root cause summary:**

The dominant leak is the digest channel. Five digests per round, each carrying substantive
prose, flowing directly into TL context with no filtering layer. The consolidator is a transcript
filter, not a digest filter. Fixing the consolidator further does not address the dominant leak.

---

## (b) Which fixes hold by cost/benefit?

### Candidate A — Routing-only digests

**Mechanics:** Members send TL a one-line routing signal ("position written, path X"). TL works
entirely from `consolidator-output.md`, read after the consolidator completes.

**Cost-benefit analysis:**

Context savings: if digests currently run 300–600 words × 5 members = 1,500–3,000 words per
round eliminated from TL context. This is the largest single addressable pool. At ~4 tokens/word,
that's 6,000–12,000 tokens per round. Over 5 rounds (the prior session went to round05), that's
30,000–60,000 tokens. Against a 200k+ token hit, this is a meaningful structural reduction.

Implementation cost: change the digest field spec in `member-protocol.md` — replace the six-field
digest with a one-line routing signal. Update `team-lead.md` Per-Round Flow to make step 5 (read
consolidator output) the primary synthesis input, not the digests. Change is in two reference
documents; no new roles, no new subagents, no new infrastructure.

Quality risk: the TL currently reads digests before dispatching the consolidator, which means the
TL goes into synthesis with pre-processed signal. Under routing-only, the TL's synthesis input is
entirely the consolidator output — which is already an enumerate-only artifact (not a synthesis
itself). The TL must do its own risk-weighting from the consolidator's one-line-per-member
summaries. This is an acceptable and intended trade — the consolidator should be the TL's primary
input, which is what the design intended but the protocol failed to enforce.

**Verdict: A is high-return, low-complexity. Should be adopted.**

One caveat: the brief flags "Digest length (300–600 words) is the dominant leak — UNTESTED." If
actual digest length is 50–100 words, the savings are smaller. Researcher should corroborate
against actual transcripts. My analysis above uses the 300–600 figure as the working hypothesis.

### Candidate B — Gate TL synthesis on consolidator output

**Mechanics:** Protocol explicitly prohibits TL from synthesizing from digests at all — must wait
for consolidator output.

**Cost-benefit analysis:**

If A is adopted, B is partly automatic: with routing-only digests (one line each), there is no
useful signal in the digests to synthesize from. A forces B implicitly — the TL cannot
synthesize from a path reference.

If A is not adopted (full digests remain), B alone has a problem: the TL still holds the full
digest text in context even if prohibited from synthesizing early. The tokens are already in
context. Prohibiting synthesis does not remove the tokens. B without A does not reduce TL token
load — it only delays when the TL acts on content it already holds.

**Verdict: B is not independently load-reducing. B is load-reshaping (sequence change) not
load-reduction. Adopt B as a *policy consequence of A*, not as a standalone fix.**

### Candidate C — Offload draft-artifact authoring to scribe subagent

**Mechanics:** A scribe subagent authors `committee-analysis.md`, draft-spec, draft-plan. TL only
adjudicates and routes.

**Cost-benefit analysis:**

Context savings: TL authoring is the second-largest cost center (medium, above). Offloading it
would save the tokens consumed while drafting. For a typical committee-analysis (~500–1,000 words),
that's ~2,000–4,000 tokens per round. Smaller than the digest channel (6,000–12,000 tokens per
round under current estimates).

Implementation cost: new subagent role definition, new dispatch step in Per-Round Flow, new
protocol for TL-scribe handoff (TL adjudicates → passes synthesis notes to scribe → scribe
writes → TL reviews and surfaces to designer). This is a non-trivial protocol addition: the
scribe needs enough TL context to write correctly, which means a context-passing mechanism that
may eat back much of the context saved.

Compounding concern: the scribe must receive the consolidator output plus TL's adjudication
reasoning in order to write a coherent committee-analysis. That means the scribe's context load
is roughly what the TL currently holds during authoring. The work is moved, not eliminated. Total
system context is not materially reduced — it is redistributed to another thread.

The exception where C would be clearly worth it: if the TL needs to hold the authoring context
PLUS carry it forward across multiple subsequent rounds (i.e., it accumulates). But the committee
artifacts are per-round writes — the TL writes committee-analysis.md and it goes to disk. The
in-context authoring cost does not compound across rounds the way carried-forward digests do.

**Verdict: C is medium-cost, medium-savings, with context-redistribution rather than context-
elimination. It is the most complex fix for the third-largest cost center. Do not adopt in this
round; revisit only if A+B prove insufficient.**

---

## (c) Top trade-off

**Adopting A (routing-only digests) trades synthesis richness for context headroom.**

Under full digests, the TL enters each round synthesis with multi-perspective pre-processed
reasoning from five members. Under routing-only, the TL enters synthesis with the consolidator's
enumerate-only one-line-per-member summaries. The consolidator was designed to carry that load —
it reads full transcripts, produces per-source verdicts, verbatim notable quotes, and convergence
patterns. If the consolidator does its job well, the TL does not lose meaningful signal. But if
the consolidator's output is thin or misses a key nuance, the TL has no fallback — the transcript
is on disk but reading it costs exactly the context budget the fix was designed to protect.

This is an acceptable trade because: (a) the consolidator already reads the full transcripts, so
the information is not lost — only the routing changes; (b) the TL can always read a specific
transcript on demand if the consolidator output flags a nuance worth pursuing. "Read one transcript
on demand" is far cheaper than "receive five full digests unconditionally every round."

---

## Peer DM question (to researcher)

Researcher is the right peer to corroborate the one UNTESTED claim that my entire position is
conditioned on: actual digest word counts in prior committee sessions.

---

<!-- created-at: 2026-06-06 -->
<!-- role: pragmatist -->
<!-- round: 01 -->

---

## Update post-researcher findings

Researcher's findings materially revise two load-bearing assumptions in my original position.

### Finding 1: Digest word counts not recoverable — spec says 50–80 words

The 300–600 word figure traces to a TL self-report in conversation, not a measurement. Actual
digests were consumed by the inbox mechanism and are gone. Protocol spec (member-protocol.md)
defines 6 single-sentence fields = ~50–80 words per digest.

**Impact on Candidate A savings estimate:**

At ~50–80 words × 5 members = 250–400 words per round, the digest channel is ~1,000–1,600
tokens per round — not 6,000–12,000. Still a real leak, but smaller in absolute terms.

However, the structural argument for A does not depend on the digest word count being high.
It depends on the digest channel being *unfiltered*. Even at 50–80 words per digest, five
digests arrive in TL context unconditionally every round. The consolidator reads transcripts
but never touches digests. The channel design is wrong regardless of current size, because:

(a) Nothing prevents members from padding digests beyond spec — this is precisely how protocol
drift happens. Spec says one sentence per field; under deliberation load, members write more.
The 300–600 word claim, even if inflated, suggests this drift is real and observed.

(b) The savings from A are proportional to *actual* digest size, which is unverifiable but
bounded above by the 300–600 word self-report and bounded below by the 50–80 word spec. The
structural fix is correct at any point in that range.

**Revised verdict on A:** still the right fix, but the savings magnitude is uncertain. The
structural argument (unfiltered channel → TL context → design flaw regardless of size) stands.

### Finding 2: Consolidator-output has also drifted past "enumerate-only"

Researcher measured consolidator outputs across all 5 rounds. Round01 = 452 words (fits spec).
Rounds 02–05 = 2,470–3,340 words each. The "enumerate-only" label remained while the artifact
expanded ~5–7x.

**This is a second drift problem that no candidate fix (A, B, or C) touches.**

The TL reads consolidator-output.md per round (Per-Round Flow step 5). If the output grew from
450 words to 3,100 words, the TL reads ~12,400 tokens of consolidator output per round instead
of ~1,800. Over 5 rounds, ~62,000 tokens from consolidator outputs alone — potentially larger
than the digest channel under either word-count scenario.

**Pragmatist assessment of the consolidator drift:**

Low-cost fix: enforce the "enumerate-only" spec on the consolidator's dispatch prompt. The
consolidator is an ephemeral per-round dispatch — its output is controlled entirely by the
consolidator agent file. Tightening that file's output spec to Round01 format (alignment count
+ one-line per-member + notable quotes) caps output at ~450 words per round, no protocol
changes elsewhere. Cheaper than A/B/C and addresses a directly measured, confirmed problem.

### Revised priority order (post-researcher)

Two fixes, both low-cost; consolidator first:

**Fix 1 — Enforce consolidator enumerate-only spec.** Cap consolidator output at Round01
size. Tighten the consolidator agent prompt. No new roles, no protocol changes anywhere else.
Addresses a confirmed, directly measured drift that is potentially the largest single readable
artifact per round.

**Fix 2 — Routing-only digests (Candidate A).** Eliminates the unfiltered digest channel
regardless of current digest size. The structural design flaw is real. Low-cost: two reference
document edits. B falls out as a natural consequence.

**Do not adopt C (scribe subagent).** Researcher data shows TL artifact authoring is bounded
and per-round. C addresses the wrong cost center with the most complexity.

**Key revision from original position:** consolidator output enforcement (not listed in A/B/C
candidates) is now the highest-priority fix. It is cheaper, more directly evidenced, and
potentially higher-return than any of the three named candidates.

---

## Update 2 — post-researcher follow-up (consolidator agent file confirmed)

Researcher confirmed: the consolidator is controlled by a single file,
`agents/design-committee-consolidator.md`. No secondary sources at runtime. Tightening that
one file fully controls output size.

**Critical sharpening: this is an enforcement gap, not a spec gap.**

The agent file already specifies tight output bounds: three sections only (alignment count +
sides, one-line per-member summary, notable quotes — one verbatim sentence per member). Hard
prohibitions already in the file prohibit convergence analysis, risk-weighting, synthesis, and
recommendations.

Rounds 02–05 produced multi-section convergence analysis, per-finding breakdowns, LOC math,
dissent sections, and multi-sentence member summaries. None of this is permitted by the existing
spec. The consolidator instances ran past their own system prompt.

**What this means for the fix:**

The file does not need to be rewritten — it may only need harder output constraints (explicit
word/line counts, or a stricter template with field-level length caps) to make the prohibitions
hold under deliberation load. The spec language already exists; it did not hold behavior.

The cheaper version of Fix 1 is: add hard numeric caps to the existing agent file (e.g., "Per-
member summary: one sentence, maximum 20 words; total output must not exceed 500 words"). This
is additive, not a rewrite. The more conservative version is to also restructure the template
so that sections can only contain enumerated fields, not free prose. Either way: single file,
confirmed.

This reinforces the cost-benefit case for Fix 1 — it is the least expensive structural
intervention available, and it addresses a directly measured problem that the existing spec
already prohibits but failed to prevent.
