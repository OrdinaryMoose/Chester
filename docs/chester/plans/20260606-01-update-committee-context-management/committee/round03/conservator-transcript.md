# Conservator Transcript — Round 03
# Sprint: 20260606-01-update-committee-context-management
# Role: Conservator (guard R4 — retain meaning, perspective diversity, dissent visibility)
# Date: 2026-06-06
# Phase: GENERATE — clean round, no inherited assumptions

---

## Starting Position: What the Data Actually Shows

The researcher measured: authoring is ~50k–80k tokens (dominant), member messages ~25k
(3.4× over spec), system prompt ~35k–50k (fixed). The two movable channels are authoring
and member messages. Consolidator output reads (~20k across 4 rounds) are a third target.

The dispatch is explicit: do NOT pre-decide "strip the team-lead." For each role, honestly
compare team-lead-owns vs owned-elsewhere against R1–R4. That is what I will do.

---

## The Four Roles — Conservator Analysis

### Role 1: CONSOLIDATE (read raw member work, enumerate it)

**What this role actually does:** Takes N member transcripts (rich, divergent, unedited)
and produces a flat enumeration of what each member said. No interpretation. No alignment
detection. Just: "Member A said X. Member B said Y."

**Meaning risk of offloading:** Low. Enumeration is mechanical. A consolidator agent
that reads transcripts and lists positions loses almost nothing. The meaning IS the list
— it's not a distillation, it's a catalog. The only risk is omission: a consolidator
that silently drops a minority position. This risk exists for any owner (including the
team-lead, which might also fail to notice a quiet outlier in a pile of member messages).

**Team-lead-owns assessment:** The team-lead reading 5 transcripts to enumerate them
costs ~5k–13k tokens of source reads plus authoring overhead. This is confirmed expensive.
The prior session's committee-analysis-01.md read alone was 6,420 tokens — and that was
one file, not five. Team-lead-owns CONSOLIDATE is not cheaper in any scenario.

**Meaning risk of dedicated agent:** The consolidator agent currently exists in the
design. The measured problem was output drift (round01: 816 tokens; rounds 02–05 avg:
5,148 tokens). The consolidator stopped being a filter and became a summarizer. The fix
is output discipline (word cap, enumerate-not-interpret instruction), not a different owner.

**Verdict: dedicated Consolidator agent.** But with a hard output cap enforced by format
discipline — enumerate only, no interpretation, ~450 words / ~900 tokens ceiling.

**R4 preservation mechanism:** The consolidator's output MUST include every distinct
position, including minority/dissent views. The cap applies by compression discipline
(shorter sentences, no elaboration), not by dropping positions. If N positions exist, all
N appear — the cap forces brevity per position, not omission.

---

### Role 2: SYNTHESIZE (turn positions into an alignment map + option set — interpretive)

**What this role actually does:** Takes the enumeration and interprets it: clusters
positions into options, identifies where members agree/disagree, surfaces what is actually
contested vs. what only appears contested. This is genuinely interpretive work.

**Meaning risk of offloading:** HIGH. This is where I plant my flag as Conservator.

Synthesis is not mechanical. To produce an alignment map, someone must:
- Recognize that two superficially different positions are actually the same option
- Recognize that two apparently similar positions have a critical divergence
- Decide what counts as a "distinct option" vs. a variant
- Notice that a minority dissent has a different KIND of concern than the majority

If this interpretive work is done by a dedicated Synthesis agent reading the consolidator
output, the team-lead receives a pre-interpreted option set. The team-lead then presents
that to the designer as if it were the authoritative reading of the committee. But it
isn't — it's one agent's reading of what the committee said.

**What is lost:** The team-lead's own synthesis pass is the last safeguard against
misclassification of positions. If the synthesis agent wrongly groups an outlier with the
majority (because their surface language was similar), that outlier's distinct concern
disappears from the option set — and the designer never sees it.

**Team-lead-owns assessment:** If the team-lead synthesizes FROM the consolidator output
(not from 5 raw transcripts), the input is ~900 tokens (capped consolidator) rather than
~5,148 tokens (current drifted consolidator) or raw transcripts. The synthesis itself
(producing an alignment map as a short structured document) is maybe 1,000–2,000 tokens
of authoring. Total for SYNTHESIZE: ~2,000–3,000 tokens. This is manageable.

The prior session's problem was not that the team-lead synthesized — it was that the team-lead
synthesized FROM FULL TRANSCRIPTS (5k tokens of consolidator output + prior authoring
artifacts read back). Fix the upstream consolidator cap and SYNTHESIZE becomes cheap enough
for the team-lead to own.

**Meaning risk of dedicated agent:** A synthesis agent would need to receive the
full consolidator output to do its job. Its output (an option set + alignment map) would
be read by the team-lead as authoritative. The team-lead would be presenting the designer
with a synthesis it did not perform. If the designer asks "why is this considered the
same option?" the team-lead cannot explain from first principles — it can only report what
the synthesis agent said.

R2 (enable designer decision-making) requires the team-lead to be a credible interlocutor
for the designer's follow-up questions. If synthesis is fully delegated, the team-lead's
credibility depends entirely on the synthesis agent's quality and the team-lead's ability
to reason about a document it received but did not produce.

**Verdict: team-lead owns SYNTHESIZE.** But fed from capped consolidator output (~900
tokens), not from raw transcripts or full consolidator drift. The team-lead writes one
alignment-map document (~500–800 words) directly from the capped list. Write-then-evict:
produce the document, use it as input to CONVERGE, do not re-read it later.

**Channel: consolidator → team-lead:** pointer + capped enumeration inline (team-lead
reads the consolidator file directly, file ≤ 900 tokens). The team-lead's synthesis
document goes to disk, not back into the conversation thread.

---

### Role 3: CONVERGE (drive toward a single optimal answer — R1)

**What this role actually does:** Takes the option set and the alignment map and applies
pressure to resolve to ONE answer. This is where the committee's debate output becomes
a recommendation. It requires:
- Knowing which option is better given the requirements (R1–R4 in this context)
- Applying the right evaluation frame (not just counting votes, but weighing them)
- Making a judgment call when evidence is balanced

**Meaning risk of offloading:** MEDIUM. Convergence requires access to the option set
and the evaluation criteria, but it does not require having been present for all the
member debate. A convergence agent with the alignment map + option set + requirements
CAN make a reasoned selection.

**The ACL 2025 finding matters here:** Majority voting is unreliable when agents share
biases. The committee members are five named roles — Conservator, Innovator, Pragmatist,
Purist, Researcher. They are designed to have different biases by construction. A vote
count would systematically favor whichever bias cluster is larger. Whoever owns CONVERGE
must apply the REQUIREMENTS (R1–R4), not tally votes.

**Team-lead-owns assessment:** The team-lead doing CONVERGE means: read the alignment map
(~800 tokens), apply R1–R4 against each option, select one, write a one-paragraph ruling
with rationale. Cost: ~1,500–2,000 tokens authoring + ~800 tokens source read = ~2,800
tokens. Manageable. And the team-lead is the entity that will present the ruling to the
designer — doing CONVERGE itself means it can defend the choice without delegating that
defense.

**Dedicated Convergence agent option:** A convergence agent would receive the alignment
map and produce a recommendation. The team-lead reads the recommendation and presents
it. Context saving: the team-lead's CONVERGE authoring (~1,500 tokens) becomes a read
of ~500 tokens. Net saving: ~1,000 tokens. This is genuinely small.

More importantly: if a dedicated convergence agent makes the selection and the designer
pushes back, the team-lead must re-litigate the convergence agent's reasoning in a context
where the team-lead did not perform that reasoning. This is a R2 risk.

**Verdict: team-lead owns CONVERGE.** The context cost is small (~2,800 tokens) and the
R2 benefit (defensible presentation) is real. The input is the alignment map the team-lead
just produced in SYNTHESIZE — write-then-evict means the map is already written to disk;
CONVERGE reads it back once (~800 tokens) rather than having it live in the conversation
thread.

---

### Role 4: AUTHOR (the analysis record, the ledger, any draft artifacts)

**What this role actually does:** Writes and maintains durable artifacts — committee-analysis,
ledger updates, draft-spec, draft-plan, handoff. These are large documents that require
multiple edit calls, re-reads for consistency checks, and iterative revision.

**This is the dominant measured channel: ~50k–80k tokens of in-context authoring.**

**The evidence is decisive:** Round04 grew +57,812 tokens while producing draft-plan.md
(8,143 bytes). The authoring overhead — thinking, tool calls, edit confirmations, re-reads
for consistency — is 3–5× the artifact size. Spec-00.md required 10 Edit calls alone.

**Meaning risk of offloading:** MEDIUM-LOW for artifact authoring (draft-spec, draft-plan,
committee-analysis). These documents are produced FROM the alignment map and convergence
ruling — they are execution of a decision, not interpretation of member debate. A scribe
agent given the alignment map + convergence ruling + format spec can produce a draft.

**Meaning risk for the ledger:** LOW. The ledger is a running state tracker. A scribe
can update it from the round's events.

**Meaning risk for the handoff:** MEDIUM. The handoff is the document the team-lead uses
to present to the designer. If a scribe authors the handoff, the team-lead reviews it
and may revise — but the structure and framing of the designer's decision packet comes
from the scribe, not the team-lead. This is acceptable IF the team-lead retains the right
to revise without incurring the same context cost as writing from scratch.

**Team-lead-owns assessment:** The prior session's problem is exactly here. Team-lead
authored draft-spec (8,059 bytes), spec-00.md (15,367 bytes with 10 edit calls),
draft-plan (8,143 bytes), ledger updates (5,799 bytes), handoff (11,958 bytes),
committee-analysis per round (~5k each). This is where 63% of the context gap lived.

**Verdict: dedicated Scribe agent owns AUTHOR for large artifacts.** The team-lead
provides inputs (alignment map + convergence ruling as file paths), the Scribe produces
draft-spec / draft-plan / committee-analysis / handoff. The team-lead reads only the
FINAL artifact (one read call per artifact) and may issue targeted revision instructions
rather than performing multi-call iterative editing.

**What the team-lead retains:**
- Ledger updates for the current round (small, ~100–150 tokens per update)
- Final review of Scribe output (one read per artifact, not multi-edit)
- Revision instructions (short targeted messages to Scribe, not in-context editing)

**R4 preservation mechanism:** The team-lead reads the Scribe's draft before presenting
to the designer. If the Scribe misrepresents a position (flattens dissent, omits a
minority view), the team-lead catches it in review. The review step is the meaning-
preservation gate. Scribe authoring is cheap; team-lead review costs one read call (~1k–4k
tokens) rather than the full authoring thread.

---

## Channel Formats Between Roles

**Members → Consolidator:**
Members write transcripts to disk (`round-NN/<member>-transcript.md`). The Consolidator
reads these files (does not receive teammate messages from members). Zero TL context cost.

**Members → Team-lead (for peer Q&A signals):**
Members continue to send one DM to TL per round — a routing signal only:
`{"member": "conservator", "status": "complete", "round": "03", "transcript": "<path>"}`.
~50–80 tokens per member per round (vs. 705 tokens average current). 5 members × 4 rounds
= ~1,600 tokens total (vs. ~25,400 measured). Saving: ~23,800 tokens.

Members do NOT send digest content to TL. All content goes to disk.

**Consolidator → Team-lead:**
Consolidator writes enumeration to `round-NN/consolidator-output.md` (≤ 900 tokens).
Sends TL a routing signal: `{"status": "done", "output": "<path>", "count": N}`.
~40 tokens. Team-lead reads the file when ready for SYNTHESIZE. One read call: ~900 tokens.

**Team-lead → Scribe (for AUTHOR):**
Team-lead sends: alignment-map path + convergence-ruling path + artifact-type + format-spec.
~200 tokens. Scribe reads the two source files and produces the artifact.

**Scribe → Team-lead:**
Scribe sends: `{"artifact": "<type>", "path": "<path>", "size_tokens": N}`.
~50 tokens. Team-lead reads artifact: one Read call, file contents in context once.

---

## Convergence Mechanism — How R1 Is Actually Achieved

**The convergence path:**

1. Members debate in transcripts (on disk, not in TL context).
2. Consolidator produces a capped enumeration (all positions, ~900 tokens max).
3. Team-lead reads enumeration, applies R1–R4 to cluster into options and identify alignment
   (SYNTHESIZE). Produces alignment map to disk.
4. Team-lead reads alignment map, applies requirements weighting to select ONE option
   (CONVERGE). Produces a convergence ruling (~200 words) to disk.
5. The convergence ruling IS R1 — it is the single answer, with its rationale.

**Why team-lead-owns SYNTHESIZE and CONVERGE achieves R1 without blowing context:**
- Input to SYNTHESIZE: ~900 tokens (capped consolidator output).
- Input to CONVERGE: ~800 tokens (alignment map, just written by TL).
- These two steps together: ~3,000–4,000 tokens of TL work vs. ~57k in the prior session.
- The reduction comes from fixing the CONSOLIDATE channel (capped output), not from
  removing the team-lead from interpretive roles.

**Convergence is not a vote.** The ACL 2025 evidence warns that majority voting fails
when agents share biases. The team-lead applies the requirements (R1–R4) as the evaluation
frame. Members' positions are input, not votes. The team-lead's convergence ruling is
a requirements-based judgment, not a tally.

**Dissent visibility mechanism:**
- The consolidator's enumeration explicitly lists every position including minority ones.
- The alignment map (team-lead's synthesis) explicitly marks which options are contested
  and which dissents are outliers vs. systematic.
- The convergence ruling must state what was discarded and why.
- The Scribe's handoff includes a "dissent record" section (one line per dissenting
  position) so the designer sees what was NOT chosen and why.

This is where R4 is structurally enforced: dissent is not just preserved in transcripts
(which the designer never reads) but surfaced explicitly in the handoff.

---

## Summary: Ownership Assignments

| Role | Owner | Context cost (TL) | R4 notes |
|---|---|---|---|
| CONSOLIDATE | Dedicated Consolidator agent | ~900 tokens (one read) | Hard cap; enumerate all positions including minority; no omission |
| SYNTHESIZE | Team-lead | ~1,500–2,000 tokens (authoring) | TL interprets; no pre-filtered option set from external agent |
| CONVERGE | Team-lead | ~1,500–2,000 tokens (authoring) | TL applies R1–R4; convergence ruling goes to disk |
| AUTHOR | Dedicated Scribe agent | ~1k–4k tokens (one read per artifact) | TL reviews before presentation; dissent record section required |

**Total estimated TL context for committee work (4 rounds):**
- Routing signals from members: ~1,600 tokens (vs. ~25,400)
- Consolidator reads: ~3,600 tokens (4 × 900 token cap)
- SYNTHESIZE authoring: ~6,000–8,000 tokens (4 × ~1,500–2,000)
- CONVERGE authoring: ~6,000–8,000 tokens (4 × ~1,500–2,000)
- Scribe artifact reads: ~8,000–16,000 tokens (4 rounds × ~2–4k per artifact)
- Ledger updates (TL-owned): ~2,400 tokens (4 × 600)
- Convening echo-back: ~9,600 tokens (unchanged)
- TOTAL: ~37,200–49,200 tokens for committee work

vs. prior session: ~297,000 tokens across 4 rounds of committee work.

**Estimated reduction: ~83–87%.**

---

## Biggest Tradeoffs

**Primary tradeoff (SYNTHESIZE on TL):** Keeping SYNTHESIZE on the team-lead adds ~6k–8k
tokens per 4-round session that a dedicated agent could save. The cost is real but bounded.
The meaning benefit is: the team-lead is the entity that explains the option set to the
designer, and it should be the entity that produced it. If the designer pushes back on
why two positions were grouped, the team-lead can answer from its own reasoning, not by
deferring to a Synthesis agent's output.

**Secondary tradeoff (dissent visibility via Scribe):** The handoff is authored by the
Scribe. The Scribe could produce a technically compliant handoff that nonetheless buries
dissent in an appendix. The team-lead must review before presenting. This review step is
the only safeguard against Scribe-level meaning loss. If the review is cursory, R4 breaks.
The design must require the team-lead to check the dissent record explicitly, not just
skim the recommendation.

---

## Confidence Assessment

**Confidence: HIGH (0.85).**

Basis:
- The researcher's data is specific enough to project the savings precisely. The dominant
  channel (authoring) is real and measured, not estimated.
- The SYNTHESIZE-on-TL recommendation is defensible by R2 logic (team-lead must be able
  to explain the option set to the designer) and by the bounded cost of the input (capped
  consolidator output).
- The scribe-as-author recommendation is supported by the evidence that authoring overhead
  is 3–5× artifact size — the savings are large and the meaning risk is low if team-lead
  review is retained.
- The 0.15 uncertainty is: (a) whether the consolidator can consistently hold to the 900-
  token cap across rounds with different volumes of member input, and (b) whether the
  team-lead's SYNTHESIZE authoring, once started, will also drift upward (the same
  discipline problem that afflicted the consolidator).

---

Transcript path: `committee/round03/conservator-transcript.md`

<!-- produced-by: conservator / round03 / 2026-06-06 -->
