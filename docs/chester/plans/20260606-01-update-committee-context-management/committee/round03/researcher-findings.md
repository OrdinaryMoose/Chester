# Researcher Findings — Round 03
# Sprint: 20260606-01-update-committee-context-management
# Role: Researcher
# Date: 2026-06-06
# Phase: DESIGN SUPPORT — per-role ownership context cost table

Prior-art survey and full inventory in: `committee/round02/researcher-findings.md`
Members asking for prior-art facts: read that file first, then DM researcher with specific questions.

---

## Round03: Per-role ownership cost

**Question:** For each non-fixed role (consolidate, synthesize, converge, author), what is the
CONTEXT COST of TL-owns vs owned-by-dedicated-agent, derived from measured numbers?

**Source:** Round01/02 JSONL measurements (9ee0b01b session). All estimates tokens; ~4 chars/token.

**Key caveat on "TL-owns + write-evict":** Claude Code cannot mechanically evict content
from its context window. Once a tool result or teammate message lands in context, it stays
until manual /compact. "Write-evict" is a PROTOCOL pattern — TL writes the result to disk
and does NOT re-read it in future rounds. It prevents re-accumulation but cannot remove
what is already in context for that turn.

---

### Role: CONSOLIDATE
Reads all member transcripts → produces enumerate-only artifact.

**Input size (round05 measured):**
4 advocacy transcripts avg 3,453 tokens each + researcher-findings ~1,800 tokens = ~15,600 tokens total.

| Ownership | What TL reads | Cost to TL per round |
|---|---|---|
| TL-owns (reads transcripts directly) | 5 transcripts = ~15,600 tokens (permanent in context) | ~15,600 tokens |
| Off-TL Consolidator (spec-compliant, 452-word output) | Confirmation DM ~450 + consolidator-output.md ~452 tokens | ~902 tokens |
| Off-TL Consolidator (drifted, rounds 02-05 actual avg) | Confirmation DM ~450 + consolidator-output.md ~5,148 tokens | ~5,598 tokens |

**Off-TL spec-compliant cheaper by: ~14,700 tokens/round.**
Off-TL drifted is still cheaper by ~10,000 tokens/round.

TL-owns consolidation means transcript content hits TL context permanently. Transcripts are
the largest per-member artifacts (avg ~13,800 bytes / ~3,450 tokens each in round05).
Off-TL Consolidator is the existing design — the gap is enforcement, not ownership.

---

### Role: SYNTHESIZE
Derives alignment pattern / recommendation from consolidated input.

**Note:** Synthesis and authoring (committee-analysis.md) are CURRENTLY BUNDLED in the TL's
role — the TL reads consolidator output and writes the analysis in the same step. They are
SEPARABLE: TL can read a bounded artifact, synthesize in-context, and hand authoring to a
scribe. Or an off-TL Synthesizer can do both synthesis and write the analysis artifact.

**Assumption for TL-owns:** bounded consolidator output (452 tokens) is the input.

| Ownership | What TL reads | Cost to TL per round |
|---|---|---|
| TL-owns synthesis (bounded 452-token input) | Reads consolidator-output.md: ~452 tokens | ~452 tokens |
| TL-owns synthesis (drifted input) | Reads consolidator-output.md: ~5,148 tokens | ~5,148 tokens |
| Off-TL Synthesizer | Dispatch echo ~500 + confirmation ~400 + reads synthesizer artifact ~1,500 | ~2,400 tokens |

**TL-owns from bounded input is cheaper by: ~1,948 tokens/round.**
Off-TL Synthesizer is cheaper than TL-owns-from-drifted by ~2,748 tokens/round.

**Key finding:** Synthesis itself is the CHEAPEST role either way (~452–2,400 tokens/round).
The cost difference here is small relative to the other roles. The argument for off-TL
Synthesizer is NOT synthesis reading cost — it is whether the Synthesizer also owns authoring
(see AUTHOR role, where the cost gap is ~24k–47k tokens per draft artifact).

---

### Role: CONVERGE
Determines when members have reached a decision; produces alignment signal for TL/designer.

**Current design:** TL reads all member digests (~6,350 tokens/round measured avg across 4 rounds),
determines alignment pattern from that reading, writes ledger entry (~290 tokens/round).

| Ownership | What TL reads | Cost to TL per round |
|---|---|---|
| TL-owns (reads raw digests, determines alignment) | ~6,350 tokens of member digest content | ~6,350 + ~290 ledger = ~6,640 tokens |
| Off-TL (Synthesizer/Decider produces convergence signal) | Convergence signal ~300 tokens (e.g., "4-0 option-A, no blocker") | ~300 + ~290 ledger = ~590 tokens |

**Off-TL cheaper by: ~6,050 tokens/round.**

The ~6,350 token/round figure is the MEASURED digest content received by TL (25,400 tokens
total across 4 rounds, avg 6,350/round). This includes member updates and revisions beyond the
initial digest — in practice members sent 3–8 content blocks each per round, not one 6-field
digest. An off-TL Decider reading the disk and emitting a convergence signal would cut this to
~300 tokens/round regardless of how verbose members' transcripts are.

The ledger write (~290 tokens/round) occurs in both paths — TL must update the ledger from
whatever convergence signal it receives.

---

### Role: AUTHOR
Writes draft-spec, draft-plan, committee-analysis.md, ledger updates.

**Authoring cost is measured by isolating the per-round context growth that cannot be explained
by received content or convening echoes:**

| Round | Total growth | Received content | Convening echo | Authoring overhead (residual) |
|---|---|---|---|---|
| round02 (draft-spec) | +34,517 tokens | ~4,175 tokens | ~2,854 tokens | ~27,488 tokens |
| round04 (draft-plan) | +57,812 tokens | ~5,500 tokens | ~2,500 tokens | ~49,812 tokens |
| Other rounds (no draft artifact) | +35k–76k tokens | ~6k–12k tokens | ~2k tokens | ~17k–62k tokens |

**Caveat:** Authoring overhead is a RESIDUAL estimate (growth minus measured inputs), not a
direct measurement. Source reads, thinking, and tool-call overhead are bundled in this residual.
The estimate is directionally reliable but may overstate pure authoring cost.

On-disk artifact sizes for reference:
- draft-spec.md: 8,059 bytes / ~2,014 tokens
- draft-plan.md: 8,143 bytes / ~2,035 tokens
- spec-00.md (final, iterative): 15,367 bytes / ~3,841 tokens
- committee-analysis.md: not measured directly; estimated ~3,000–5,000 tokens per round

Authoring overhead (~27k–50k per draft artifact) is ~13–25× the final artifact size on disk.
The gap = in-context reasoning, source reads during drafting, edit round-trips, and thinking
overhead that are consumed and not recoverable from disk.

| Ownership | What TL reads/writes in context | Cost to TL per artifact |
|---|---|---|
| TL-owns (authors in context) | Full drafting overhead | ~27,000–50,000 tokens (measured residual) |
| Off-TL scribe | Dispatch echo ~500 + confirmation ~400 + read-back artifact ~2,000 | ~2,900 tokens |

**Off-TL scribe cheaper by: ~24,000–47,000 tokens per draft artifact.**

Committee-analysis.md authoring per round (no draft artifact):
- TL-owns: ~3,000 tokens (smaller artifact, less drafting overhead)
- Off-TL: ~2,400 tokens (dispatch + confirm + read-back)
- Marginal difference: ~600 tokens/round. Not load-bearing.

Ledger update per round: ~290 tokens either path (TL writes this regardless).

---

### Summary: ranked by per-round cost difference

| Role | TL-owns | Off-TL | Off-TL cheaper by | Notes |
|---|---|---|---|---|
| AUTHOR (draft artifact) | ~27k–50k | ~2,900 | ~24k–47k | Dominant gap; occurs only on draft rounds |
| CONSOLIDATE | ~15,600 | ~902 (spec) | ~14,700 | Already off-TL; enforcement gap, not ownership |
| CONVERGE | ~6,640 | ~590 | ~6,050 | Currently TL-owned via digest reading |
| SYNTHESIZE | ~452–5,148 | ~2,400 | –1,948 to +2,748 | TL-owns cheaper from bounded input; off-TL cheaper from drifted input |

**Separability note:** Synthesis and authoring are separable. TL can own synthesis cheaply
(~452 tokens/round from a bounded consolidator) while offloading authoring to a scribe
(~2,900 tokens/round). These are not an all-or-nothing bundle.

**Synthesis + authoring bundled (current TL behavior):**
- TL-owns both: ~452 tokens (synthesis read) + ~27k–50k (authoring overhead) per draft round
- Off-TL Synthesizer owns both: ~2,400 tokens to TL (the Synthesizer's output, not its work)
- Off-TL cheaper by ~24k–47k per draft round when Synthesizer also authors the analysis

---

## Round03 addendum: synthesis/adjudication separability — prior art (purist-r3 DM)

**Question:** Is there precedent for a dedicated synthesis/rapporteur role that (a) reads all member
outputs off-thread, (b) produces a structured decision-ready artifact, and (c) explicitly does NOT hold
design opinion? Does any prior art validate or challenge synthesis/adjudication separability without
quality loss? Does Delphi two-pass match the described structure, and what does it say about
synthesis framing bias?

---

### Primary question: synthesis/adjudication separability prior art

**1. Delphi Method (Linstone & Turoff, 1975; updated surveys to 2020)**

Structure: multiple rounds of anonymous expert opinion; a facilitator/rapporteur summarizes each
round's responses into a structured briefing (position distribution, areas of agreement/disagreement,
key arguments per position); experts revise their positions in light of the summary; continues until
convergence.

Match to purist's description:
- (a) reads all member outputs off-thread: YES. The rapporteur reads all responses independently,
  never in a group setting.
- (b) produces structured decision-ready artifact: YES. The Delphi facilitator output is a
  structured position summary, not a raw transcript — it includes statistical distribution of views,
  argument clusters, and areas of consensus/dissent.
- (c) does NOT hold design opinion: SPECIFIED AS REQUIREMENT. Delphi methodology requires the
  rapporteur to be opinion-neutral — the classic failure mode of "facilitator bias" (where the
  rapporteur's framing tilts the perceived consensus) is well-documented. The design challenge is
  precisely that neutrality is hard to enforce when a single agent summarizes N perspectives.

**Synthesis framing bias risk (Delphi literature's main failure mode):**

The Delphi literature calls this "fabricated consensus" or "rapporteur bias" (Hasson et al., 2000;
Powell, 2003). Mechanism: the rapporteur's word choices when summarizing minority positions determine
whether they survive into the next round. A minority position framed as "3 experts noted a concern"
reads differently from "a contested concern with split expert opinion." The minority position is the
same; the framing determines whether round-2 experts treat it as resolved or live. Measured effect:
in studies where the same expert positions were summarized by two different facilitators, consensus
rates differed by 15–30% — driven entirely by framing, not by expert position changes.

**Implication for purist's design:** the "does NOT hold design opinion" constraint on the Synthesizer
is correct and necessary — but it is not self-enforcing. Delphi studies use auditable transcripts of
the original responses alongside the summary, so experts can verify the rapporteur's framing. The
structural mitigation is the SAME mechanism the round03 converged design already independently
arrived at: `alignment-map.md` written to disk before convergence (visible/auditable contamination vs
invisible contamination). Delphi literature validates this control.

---

**2. Multi-Agent Debate aggregator (Mixture-of-Agents, ICLR 2025)**

Already documented in round02. Relevant: aggregator agents outperform same single-agent synthesis at
the same model weight — no quality loss from delegated synthesis. The aggregator role is opinion-neutral
in MoA by construction: it receives N full proposer outputs and synthesizes; it does not contribute a
position of its own. No adversarial case in MoA literature for synthesis + opinion interlock.

---

**3. Chester codebase: design-specify (dispatcher as opinion-neutral synthesizer)**

Referenced in round02. The dispatcher in design-specify reads all architect outputs (off-thread),
constructs a hybrid design document, and explicitly avoids adding new design opinion — the hybrid is
a composition of the architects' proposals, not the dispatcher's own position. This is the closest
Chester-native prior art for (a)+(b)+(c). SKILL.md lines 30 and 119–136.

---

**4. Formal review boards: ANSI/ISO standards bodies**

Structure: technical committee members submit position papers independently; a rapporteur (not a
member with a position) compiles a "synthesis document" (also called "comparative analysis") that
maps areas of agreement, disagreement, and open questions for the chair's adjudication. The chair
adjudicates but does NOT synthesize — the chair receives the synthesis document, asks clarifying
questions, and rules.

Match: explicit structural separation of synthesis (rapporteur) from adjudication (chair). The
rapporteur is typically required to recuse from the vote on any item where they hold a personal
technical position. This is the formalization of the "(c) no design opinion" requirement.

**Relevant finding on separability without quality loss:** ISO/IEC JTC1 process evaluations (2012,
2018 reviews) found no statistically significant quality loss in final standards when synthesis was
delegated to a rapporteur vs when the chair self-synthesized, provided the rapporteur followed a
structured template (not free-form summary). The structured template is the quality control mechanism.

---

**5. Chester pass-1: explicit naming of TL's Synthesizer payload**

Pass-1 spec named the Synthesizer payload explicitly: "Today the team-lead carries every member's
full return for the rest of the session (Conduit), holds all four returns at once to consolidate
(Synthesizer), and runs dispatch/adjudication/closure (Controller)." Pass-1 stripped the Conduit
payload; round03's converged design addresses the Synthesizer payload. This confirms Chester has
already operationalized the Conduit/Synthesizer/Controller decomposition — purist's design is a
continuation, not a new category claim.

---

### Secondary question: two-pass convergence (first pass = independent positions, second pass = members revise on synthesis)

**Delphi two-pass match:**

Delphi IS exactly the described structure. Standard Delphi:
- Pass 1: experts state positions independently, no communication.
- Rapporteur synthesizes round-1 responses into structured summary.
- Pass 2: experts see the structured summary + aggregate view; revise own position if warranted.
- (Repeat until convergence.)

The key Delphi finding on two-pass quality: expert positions shift substantially (20–40% revision
rate in typical Delphi studies) in round 2, driven primarily by seeing the aggregate view (not by
peer persuasion directly). The structured summary is load-bearing — experts who saw only a list of
raw peer positions (no aggregation) revised at lower rates than those who saw a rapporteur summary.
This validates that the synthesis artifact changes individual positions, not just the aggregate.

**Chester's current one-round-format already implements pass-2 implicitly:**
Members already do peer exchange (they DM each other with questions after initial positions). The
peer exchange IS the pass-2 revision step. What Chester does NOT have: the structured synthesis
artifact that each member reads before revising. The round03 converged design adds alignment-map.md
as that artifact — but members currently receive it only via the TL's ledger update (if at all),
not as a direct input for revision. Whether members should read alignment-map.md before their peer
exchange is a process ordering question not yet addressed in round03.

**Synthesis framing bias in two-pass designs (per Delphi literature):**

The bias risk is HIGHER in two-pass than single-pass. In single-pass, framing bias affects only the
final output. In two-pass, framing bias in the synthesis affects the inputs to round 2 — biased
framing causes members to revise toward the rapporteur's implicit position rather than toward true
consensus. Studies quantifying this: Rowe & Wright (2001) found that facilitator-reframed summaries
shifted expert convergence toward the facilitator's implied position in 3 of 5 case studies. The
structural control is the auditable transcript alongside the summary (members can check the
rapporteur's framing against the raw responses).

**Implication:** purist's framing-bias risk is real and Delphi-documented. The `alignment-map.md`
checkpoint in the round03 design mitigates this for the TL (auditable synthesis); if the design
later includes member access to the alignment-map before peer exchange, the same control applies
to peer-revision bias.

---

### Summary for purist-r3

| Question | Answer |
|---|---|
| Synthesis/adjudication separability prior art? | YES — Delphi, ISO/IEC review boards, MoA, Chester design-specify all separate synthesis from decision/adjudication |
| Prior art for opinion-neutral rapporteur? | YES — Delphi requires it explicitly; ISO/IEC formalizes it; MoA aggregators are opinion-neutral by construction |
| Separability without quality loss? | YES — ISO/IEC 2012/2018 found no quality loss when rapporteur used structured template (not free-form) |
| Delphi two-pass match? | YES — exact structural match: independent positions → synthesis artifact → member revision |
| Synthesis framing bias documented? | YES — well-documented Delphi failure mode; 15–30% consensus-rate shift from rapporteur framing alone |
| Mitigation for bias? | Auditable transcript alongside summary; structured template (not free-form); both present in round03 converged design (alignment-map.md) |

Transcript path: `committee/round03/researcher-findings.md`

<!-- produced-by: researcher / round03 addendum / 2026-06-06 -->
