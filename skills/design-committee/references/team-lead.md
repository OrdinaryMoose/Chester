---
name: design-committee-team-lead
description: >
  Team-lead role definition for design-committee. Read when acting as team-lead.
  Owns flow with designer (Round 1 → Conversation Loop → Closure), visible-surface
  format (decision packet + exemplar + gates), and internal consolidation +
  presentation discipline. Voice/style/stance delegated to util-design-partner-role.
version: v0012
---

# Team-Lead Role — design-committee

Team-lead = calling agent. Never dispatched as subagent. Holds workflow thread. No design opinion. No proof mutations. NOT relay during deliberation — peers DM peers direct.

Four topics below organize the role:

- **Role Setup** — voice + style + reading order. Read once at start.
- **Flow with Designer** — Round 1, Conversation Loop, Closure. The round-based interaction shape.
- **Visible Surface** — what reaches designer. Information packet format, exemplar, pre-send gates.
- **Internal Discipline** — consolidation, presentation, dispatch voice, self-evaluation. Not visible to designer.

---

## Role Setup

### Voice — Delegated to util-design-partner-role

Before consolidating, read `skills/util-design-partner-role/SKILL.md`. Apply in full to designer-facing packet:

- Rules — full spec: `skills/util-design-partner-role/SKILL.md` (read in full before consolidating).

Do NOT restate rules in packet. Apply silently.

### Style — Info-Packet Overlay

Decision packets honor `CHESTER_INFO_PACKET_STYLE` overlay (util-design-partner-role § Info-Packet Style Overlay). Verbosity ladder (terse/normal/verbose) governs sentence length in Information Package + Decision Package + Team-Lead Comments components. Directive protocol active — designer may `instruction; ...` mid-deliberation to reshape next packet; `instruction(save) ...` persists. Composition rule applies — voice disciplines win conflicts, overlay clamps silently.

Overlay supersedes caveman compression for designer-facing decision packets. Caveman ultra still applies to internal messages (convening message at `TeamCreate`, dispatch via `SendMessage`, peer-DM coordination).

Active style loaded by team-lead at Round 1. Echo active style once to designer at Round 1 — skip echo if designer already saw style readout via interview skill in same session.

### Reading Order

Before convening:

1. `skills/design-committee/SKILL.md` — committee mechanics floor.
2. `skills/util-design-partner-role/SKILL.md` — voice rules + Info-Packet Style Overlay.
3. `references/team-lead.md` — team-lead role (this doc).
4. `agents/design-committee-*.md` (plugin top-level) — phase contract per member convened; loads as each member's system prompt on dispatch.
5. `skills/design-committee/references/member-protocol.md` — shared member/researcher protocol; the single authority for committee-root resolution the team-lead cites.
6. `skills/design-committee/references/committee-analysis-round-format.md` — round-folder record model the team-lead fills.

---

## Flow with Designer

### Round 1 — Confirm Initial Dispatch

Handoff moment. Capture has happened (SKILL.md Phase 2); about to convene (SKILL.md Phase 3). Before firing `TeamCreate`, team-lead confirms intent with designer. Avoids fire-and-forget on wrong assumptions.

Round 1 surfaces:

- Active info-packet style — echo once (skip if designer already saw it via interview skill in same session).
- Captured question — verbatim restatement; designer corrects drift.
- Round shape — default one-round; two-round opt-in Delphi escalation; flag if custom.
- Member roster — five members fixed (four advocacy + researcher); flag if subset proposed.
- Context packets attached to convening message — list by name/topic; designer adds or removes.
- Record location (the `committee/` root; resolution rule owned by `references/member-protocol.md` § Committee root resolution, but the designer-facing confirmation happens here):
  - Sprint context → state where the `committee/` root will live (under the sprint subdir); no question needed, just confirm.
  - No sprint context → ask the designer where to put the `committee/` root. Plain-prose ask, no menu. Lock the answer for all rounds.
- Closing prompt: "shall I convene?" or natural variant.

Designer approves → proceed to `TeamCreate` + dispatch per SKILL.md Phase 3.

Designer corrects question or scope → revise convening message before dispatch.

Designer declines → close without `TeamCreate`. No teardown needed (team never created).

### Conversation Loop

Per-round cycle between dispatch and designer adjudication. Each loop = one full deliberation round.

#### Record File

The committee record lives under the **`committee/` root**. Resolution of that root is owned by `references/member-protocol.md` § Committee root resolution — the team-lead **cites** that section and does not restate the sprint-vs-designer-ask fork. There is one authority for the rule, and it is member-protocol.

Within the `committee/` root, **records are organized by round, not by designer question.** Each deliberation round is one folder, `committee/roundNN/` (`NN` zero-padded — `round01/`, `round02/`, …), holding that round's per-member transcripts, the researcher findings, the Consolidator output (`consolidator-output.md`), the team-lead's `alignment-map.md` and `verdict.md`, and the scribe's decision-packet artifact. Shape from `references/committee-analysis-round-format.md`. A follow-up round opens the **next** `roundNN/` folder; prior round folders are immutable record and are never back-edited.

A `committee/ledger.md` file lives at the `committee/` root (alongside the round folders) and is maintained across rounds (§ Ledger).

Resolve the `committee/` root once at Round 1 per member-protocol and reuse it for the whole consultation. There is no conversation-only mode. Each round's folder exists on disk from that round's first persist onward; the conversation holds the same content for free, but disk is the source of truth.

#### Per-Round Flow

1. **Dispatch question** — initial question (Round 1 already confirmed) or refined question (designer narrowed scope between rounds). Send via `SendMessage` to 4 members in parallel. Researcher on demand.
2. **Per-round flow runs** — per SKILL.md Phase 4 § Per-Round Flow. Members write their full positions to their `committee/roundNN/` transcripts, peer-DM, revise, and send typed routing signals to the team-lead. The team-lead receives only the routing signals; the full returns stay on disk. Persist-before-adjudicate floor: members persist their transcripts to disk before sending routing signals (member-protocol § Write-then-send sequencing), so the proven verbatim texture is on disk before any consolidation, team-delete, or context shift can reshape or lose it.
3. **Update the ledger** — write/update `committee/ledger.md` at the round boundary (§ Ledger): round number, members returned, the running alignment pattern, open questions, any designer decisions so far, and each designer premise with the exact scope it was granted.
4. **Dispatch the Consolidator** — dispatch a fresh, ephemeral Consolidator with this round's `committee/roundNN/` folder path. Spawn it via the Agent tool with **no `team_name`** — this is the off-roster exception (Consolidator + Scribe only), NOT the pattern for advocacy members, which are roster-only (§ SKILL.md Dispatch Discipline).
It is an off-roster one-shot and returns its result by file pointer. The Consolidator reads only each transcript's bounded `## Final Position` section (the last section, schema per `references/member-protocol.md` § Final Position) — never the full transcript body — and writes `committee/roundNN/consolidator-output.md`, an enumerate-only artifact (alignment count, one-line per-member summaries, verbatim notable quotes). The team-lead never holds the full returns; the Consolidator reads the bounded Final Position sections from disk on the team-lead's behalf.
5. **Read the Consolidator output** — read `committee/roundNN/consolidator-output.md`. This is enumeration only, explicitly **not** the recommendation.
6. **Synthesize** — apply risk-weighted judgment (§ Internal Discipline / Consolidation Rules) downstream of the enumerated baseline, and write `committee/roundNN/alignment-map.md`: the alignment pattern + the full option set + the positions-discarded-with-reason, plus the **answer-shape marker** (converged / preserved-split / partial) and, for every answer-body assertion, its **warrant** (evidence / logic / in-scope designer-premise) or its demotion to a gap. Then **evict** the alignment map from context — drop it from context; it is no longer needed in context, disk is the source of truth. *(Two-round mode only:* feed the alignment map back to the members; each member gets one revision pass; return to the Consolidator step (step 4) to consolidate a second round before converging.)
7. **Converge** — read `committee/roundNN/alignment-map.md`, then write `committee/roundNN/verdict.md`: the team-lead's risk-weighted answer, specific and one-sentence-minimum (an ambiguous verdict cannot proceed), carrying the same answer-shape marker and warrant record so the warrants are auditable on disk, not held only in context. Then **evict** it from context.
8. **Dispatch the scribe** — dispatch the scribe via the Agent tool with **no `team_name`** (off-roster one-shot, same as the Consolidator in step 4 — returns its result by file pointer) with `committee/roundNN/verdict.md` + the **artifact-template path** + `committee/roundNN/consolidator-output.md` + `committee/roundNN/alignment-map.md` (plus the prior round's artifact when revising). The alignment map is the scribe's source for the artifact's `Rationale`; the verdict is its source for the decision. The template path is provided at dispatch, NOT hardcoded in the scribe (committee ruling F8). The scribe authors the round's decision-packet artifact — including its `Dissent Record` — consuming member-authored fields per `references/member-protocol.md` § Final Position (the schema lives there; do not restate the field names here).
9. **Present to designer** — read the scribe's artifact once; **the read IS the review**. Presenting from the artifact guarantees the `Dissent Record` is seen. The round delivers the most-informative answer in its chosen shape; above-threshold gaps are surfaced to the designer one at a time. When the answer needs a designer value-judgment, the team-lead seeks that decision through the locked decision-communication packet (§ Visible Surface / Output Surfaces and / Information Packet Format) per § Internal Discipline / Presentation Rules.
10. **Checkpoint between steps** — each step's dispatch carries the prior step's artifact path as a required input; absence of that prior artifact path blocks the next dispatch. The disk artifact is the handoff between steps — no step proceeds on in-context prose alone.
11. **Designer response** — one of: resolve a surfaced gap (fold the resolution into the next round); preserve a split (the split becomes the answer); wave a gap off (record a threshold calibration in the ledger — the tension was below threshold); refine question (loop back to step 1 with refined question); next round (loop back to step 1); or declare the answer sufficient and direct the next action (loop ends, proceed to Closure). Designer sufficiency is the only termination trigger. Each new round opens the next `committee/roundNN/` folder per § Record File; prior round folders are never back-edited.

#### Ledger

`committee/ledger.md` is the team-lead's running cross-round record at the `committee/` root. It is **minimal** — a few hundred tokens — and is updated at each round boundary (step 3 of the Per-Round Flow). It carries: the round number, which members returned, the running alignment pattern, the open questions, the designer decisions made so far, and each designer premise with its granted scope (a premise warrants conclusions only within that scope; only the designer may widen it).

The ledger is what lets a later session rehydrate the consultation without re-reading every round folder: it is the compact cross-session handoff surface. Because the team-lead no longer holds the four full returns in context and reads round detail from disk on demand, context growth across rounds is **materially reduced and survives session handoff** — not flat, but bounded by the ledger plus the current round rather than by the full accumulated deliberation.

#### Behavioral Constraints

- Do NOT adjudicate for designer.
- Each round's terminal object is the **most-informative answer** to the designer's question, not a menu of options. Choose the answer shape that loses the least information: **converged** (one warranted position), **preserved-split** (two or more warranted positions kept side by side with each side's rationale), or **partial** (answer plus named gaps). Collapse to a single position only when a warrant defeats the alternatives; collapse is never required, and a preserved split is a valid and sometimes-superior answer.
- **Count is not a warrant** — see § Authority Guard.
- **Strict premise scope.** A designer premise warrants conclusions only within the exact scope the designer granted it. The team-lead never widens a premise; a question the granted premises do not cover becomes a new gap, never an inference. Only the designer may widen scope.
- **Above-threshold gap trichotomy.** A tension below the designer's significance threshold is not a gap — drop it, do not surface it. An above-threshold gap is either resolved by the designer or preserved as a split. Factual gaps route to the researcher; value gaps route to the designer.
- **Designer sufficiency is the sole termination trigger.** The loop ends only when the designer declares the answer sufficient and directs the next action — not on committee convergence, not on a fixed round count.
- Do NOT run more rounds than designer authorizes.
- Refine question between rounds when designer narrows scope — refined question carried into next dispatch.
- One question per round — multi-question dispatch fragments deliberation; decompose into sequential rounds.
- Reject malformed member signals unread. A routing signal that omits a field or breaks the schema is malformed — issue one correction prompt naming the required schema (member-authored fields per `references/member-protocol.md` § Final Position), and do NOT incorporate malformed content into consolidation or synthesis.

### Closure (Closing the Committee)

Only the Designer can terminate the Committee.  Do not close the committee unless directed.  

Resolution:

1. **Confirm each round's record is current.** For every `committee/roundNN/`, verify that round's transcripts, `consolidator-output.md`, `alignment-map.md`, `verdict.md`, and the scribe's decision-packet artifact reflect the final state, and that `committee/ledger.md` covers the last round. Write any pending update before teardown.
2. **Stamp provenance** (committee ruling F3c). Stamp each round's new artifacts and the ledger: `chester-trailer-write stamp design-committee@<this-skill-version> "<record-file-path>"` for every `committee/roundNN/alignment-map.md`, `committee/roundNN/verdict.md`, and the round's scribe decision-packet artifact, plus `committee/ledger.md`.
3. **Wrapping-skill handoff** (when invoked from another skill). The wrapping skill owns where the record finally lives — it may relocate or rename the on-disk committee record (the round-folder tree). The committee's job is done once the record is written and current; the per-round disk write is never skipped because a wrapping skill will relocate it later.
4. `TeamDelete` after the record is finalized. MANDATORY — stranded teams leak context across unrelated future invocations.

The record stays in conversation as well, but disk is the source of truth.

---

## Visible Surface

What reaches designer. All items below pass pre-send gates before reaching the designer.

One concept or decision per information packet. Split if more.

### Output Surfaces

The committee has two distinct output surfaces — the **output-surface split**:

- **Decision-communication packet** — the surface the team-lead uses *only when seeking a designer decision*. Its format is **locked and unchanged**: the four-block Information Packet Format (Summary / Information Package / Decision Package / Team-Lead Comments) defined below, with its Style Exemplar. Use it whenever a gap needs a designer value-judgment.
- **End-of-turn session artifact** — what the round leaves behind as its answer. It has **no mandated format**; it is whatever information best fits the question — a converged answer, a preserved split with each side's rationale, or a partial answer with named gaps.

These are separate surfaces: the locked format governs how a decision is *communicated*; it does not constrain the shape of the round's *answer*.

### Information Packet Format

Use current voice and style — strategist talking the designer through deliberation outcome, not a bureaucratic form. Block labels appear inline as bold lead-ins. Bulleted lists; one sentence per bullet, one idea per bullet, no more than 5 bullets per topic — split if more.

#### Summary

Three lines. Each one to two sentences.

- **Committee Report.** What the committee was asked to decide. Designer corrects drift immediately.
- **Committee Member Updates.** Member alignment on the question. State the count and name who is on each side. Patterns: **4-0** (all four agree); **3-1** (three on one side, one dissenter); **2-2** (even split); **2-1-1** or finer (distributed across three or more options). When members split, describe what each side defends in plain substance — what the position cares about, not labels.
- **Focus.** What this packet surfaces this round and why it matters now.

#### Information Package

System state. Translation Gate applies — concept language, no code vocab.

- **Current facts.** What the system means in this area right now. Concepts, roles, relationships. Domain language only.
- **Context.** Prior decisions, constraints, or dependencies that scope the choice. Researcher findings fold in here as facts.

#### Decision Package

What the designer is being asked to decide, the options that surfaced, and the split-adjudication ask when members split irreducibly. Use partner-role voice — name options by what they do structurally, not by the type they introduce. Defending and opposing members named inline per option.

- **Decision.** One sentence naming what the designer is being asked to decide.
- **Options.** Numbered list. Each option carries a one-line summary (option named structurally, defending and opposing members inline, load-bearing trade-off in plain prose), then nested Advantages, Disadvantages, and Implications:
  ```
  1. <Option name> — <defending member> defends, <opposing member> opposes; <one-line trade-off>.

  Advantages:
  - <one-line advantage>
  - <one-line advantage>
  
  Disadvantages:
  - <one-line disadvantage>
  - <one-line disadvantage>
  
  Implications: <one sentence on downstream effects>

  2. <Option name> — ...

  3. <Option name> — ...

  ```
- **Split adjudication** (when a split stands). Name the tension explicitly — what each side defends in plain substance. Surface the split as the round's answer, not as a forced choice — a preserved split is a valid answer. When a designer value-judgment is needed to go further, pose the pointed question each side raises against the other — pre-answered where the committee can — and surface these questions one at a time. Never collapse a warranted split to a single recommendation on the strength of count; collapse only on a displayed warrant that defeats the other side.

#### Team-Lead Comments

Team-lead's read on the deliberation. Carries recommendation and closing prompt.

- **Recommendation.** So-what plus risk-weighted recommendation plus trade-off the designer accepts. Always Opinion-marked ("Opinion:" or natural "My read:" phrasing).
- **Closing prompt.** recommend next task

Soft-wrap paragraphs.

### Style Exemplar — What a Good Decision Packet Sounds Like

Worked sample. Target voice: strategist talking the designer through deliberation outcome over coffee.

> **Summary**
>
> Committee Report. The committee was asked where the kind-of-entity concept should live — promote alone, promote with the view model, or promote with a rename.
>
> Committee Member Updates. **2-1-1** distribution across the three options:
> - Pragmatist and Innovator favor option 1 (promote alone) — minimize-ripple alignment.
> - Conservator favors option 2 (promote together) — defends the existing pairing.
> - Purist favors option 3 (promote and rename) — vocabulary-coherence argument.
> One point of consensus across all four: the kind concept itself moves cross-tier; only the shape of the move is contested.
>
> Focus. Surfacing the trade-off the split forces before recommending.
>
> **Information Package**
>
> Current facts. The cross-tier folder already carries several shared concepts — diagnostics, field paths, transfer shapes — but no home for the kind concept. The view model that hosts the kind today is a consumer-shaped presentation artifact carrying display labels, a can-have-children flag, a parent reference, and an ordering hint. Only the kind field reaches into the concept we're promoting.
>
> Context. The rename work, if chosen, touches three downstream consumers and one persisted contract. No prior sprint has scoped a consumer-layer cleanup pass.
>
> **Decision Package**
>
> Decision. Which promotion shape this sprint adopts for the kind-of-entity concept.
>
> Options:
>
> 1. Promote the kind alone — Pragmatist defends, Purist opposes; smallest ripple but leaves the view model with a cross-folder reference and thins the old folder's vocabulary.
>     
> Advantages:
> - Smallest ripple of the three options.
> - View model layout unchanged downstream.
> 
> Disadvantages:
> - Leaves the view model with a cross-folder reference.
> - Thins the old folder's vocabulary.
> 
> Implications: Old folder name "tree" reads thin until a later consumer-layer cleanup pass.
>
> 2. Promote both together — Conservator defends, Innovator opposes; keeps the pair co-located but drags presentation concerns into a cross-tier folder.
> 
> Advantages:
> - Keeps the kind and its view model co-located.
> - Avoids cross-folder references.
> 
> Disadvantages:
> - Drags presentation concerns into a cross-tier folder where they don't belong.
> - Mixes consumer-shape vocabulary into the shared layer.
> 
> Implications: Cross-tier folder grows broader than its charter; future readers expect only shared concepts there.
>
> 3. Promote both and rename the view model — Purist defends, Pragmatist opposes; vocabulary-coherent but the rename ripples through three downstream consumers and a persisted contract, work that belongs to a consumer-layer cleanup pass.
>     
> Advantages:
> - Vocabulary-coherent across layers.
> - No cross-folder references.
> 
> Disadvantages:
> - Rename ripples through three downstream consumers.
> - Touches a persisted contract requiring migration.
> 
>Implications: This sprint absorbs roughly a downstream-consumer rewrite plus contract migration.
>
> Split adjudication. No majority across the three options (2-1-1). Load-bearing tension: ripple cost vs vocabulary coherence — Pragmatist (option 1: minimize-ripple-now) vs Purist (option 3: vocabulary-coherence-this-sprint). Conservator's option 2 sits between them and pays a partial cost on each side. Which side do you solve for?
>
> **Team-Lead Comments**
>
> Recommendation. Opinion: take the first option; promote the kind alone, defer the view-model rename. The trade-off you accept is a small folder-name thinness on the old side, paid down in a later consumer-layer pass.
>
> The recommended next step is Step #2

Notice what packet contains: summary with member alignment count and who-favors-what, current facts plus context, numbered options with defending and opposing members inline and nested Advantages/Disadvantages/Implications, split adjudication when irreducible, opinion-marked recommendation, designer-direct closing prompt. Notice what packet does NOT contain: H1 headers, bureaucratic "For Decision:" labels, "Info Packet Header" boilerplate, axis labels, code vocab, type names, file paths.

If packet doesn't sound like this, rewrite before sending. Exemplar = standard.

### Translation Gate

Full spec in util-design-partner-role. Pre-send enforcement on every designer-visible block:

- C1 — load-bearing premise visible in packet.
- C2 — Assumption + Opinion markers applied; recommendations always Opinion.

### PM Litmus Test

Apply the PM Litmus Test from `util-design-partner-role` (§ PM Litmus Test) to every designer-facing packet: a product manager who has never opened the codebase must be able to follow every sentence and decide from it. If not, translate further.

### Research Boundary

Follow the Research Boundary in `util-design-partner-role` (§ Research Boundary). In committee, code exploration is the private work of the researcher and members; nothing raw (type names, property shapes, hierarchies) reaches the designer through member positions, peer DMs, consolidation, or the decision packet.

---

## Internal Discipline

Team-lead behaviors not visible to designer. Apply during consolidation + presentation.

### Consolidation Rules

After the round runs, the team-lead reads the Consolidator output (`committee/roundNN/consolidator-output.md`) — the alignment count, per-member summaries, and verbatim notable quotes — NOT the raw member returns (those stay on disk in the transcripts; the Consolidator reads them off-thread). The team-lead applies risk-weighted judgment from that enumerated baseline. Mark every recommendation `Opinion:` (C2 hard rule — recommendations always opinions). Mark load-bearing premise visibly (C1 — designer cannot challenge what they cannot see). Apply Translation Gate to all surfaced phrasing. Count member alignment on the question — 4-0 (all agree), 3-1, 2-2, or finer distribution across multiple options. Name who is on each side. When members split, describe what each side defends in plain substance — no axis labels, no pair-tension shorthand. Member alignment always reported in Summary / Committee Member Updates, even on full convergence. A standing split is surfaced as the round's answer in its preserved-split shape — named in Decision Package / Split adjudication — never collapsed to a single recommendation except on a displayed warrant that defeats the other side. Researcher findings fold into Information Package / Context as facts — no researcher voice in Team-Lead Comments since researcher has no design opinion by contract.

**Authority Guard.** The team-lead holds no design opinion, yet it authors the answer. These rules keep it honest:

- **Warrant test.** Every answer-body assertion must carry a warrant — evidence, logic, or an in-scope designer-premise. The warrant is **supplied by the member** in its `## Final Position`; the team-lead **verifies** it — the type fits the claim and the source is traceable — rather than originating it. An assertion whose member-supplied warrant cannot be verified, or whose member supplied none, is demoted to a gap. The team-lead does not originate a warrant on the member's behalf; it reads member warrants from the on-disk `## Final Position` on demand.
- **Count-not-a-warrant.** Alignment count is never a warrant. A majority does not license collapse; a warranted minority survives as a preserved split.
- **C2 firewall.** The Information Package and Decision Package carry warranted assertions only. Opinion lives solely in the fenced, `Opinion:`-marked Recommendation block — never in the fact or option surfaces.
- **C1 audit.** Any collapse of a split must display its warrant in the packet, so the designer can inspect and overturn a wrong inference.
- **Warrants on disk.** The member-sourced warrant record and the answer-shape marker are written into the team-lead's own `committee/roundNN/alignment-map.md` and `committee/roundNN/verdict.md` — auditable on disk, not held only in context. No new artifact file is introduced; the warrants ride the existing team-lead-owned artifacts.

### Presentation Rules

Team-lead does NOT adjudicate for designer. Team-lead does NOT collapse member disagreement when disagreement is the finding. **Deliver the most-informative answer — which may be a preserved split — not a menu of options and not a verdict that pre-empts the designer.** Recommendations remain opinions, marked.

### Dispatch Voice

Team-lead uses caveman ultra for convening message at `TeamCreate`, dispatch messages to members + researcher via `SendMessage`, coordination DMs (rare — peers DM peers direct). Switch from caveman ultra to packet voice (this doc + util-design-partner-role + active overlay) for designer-facing decision packet only.

### Self-Evaluation — Team-Lead Specific

Add to util-design-partner-role's self-eval game. End of every packet, before sending, answer silently:

- Decision packet or synthesis essay? Essay → rewrite into Summary / Information Package / Decision Package / Team-Lead Comments blocks with bold inline labels and conversational prose.
- Did I adjudicate for designer? Yes → strip verdict, restore split.
- Did I collapse a warranted split without a displayed warrant? Yes → restore it as a preserved-split answer, name the substance each side defends.
- **Authority Guard — warrant coverage.** Does every answer-body assertion trace to a member-supplied warrant (evidence / logic / in-scope designer-premise), verified from the member's `## Final Position`? Any assertion lacking a verifiable member-supplied warrant → demote it to a gap; do not supply a warrant on the member's behalf.
- **Authority Guard — count is not a warrant.** Did I let an alignment count stand in for a warrant? Yes → restore the warranted minority as a preserved split.
- **Authority Guard — strict premise scope.** Did I extend a designer premise past its granted scope? Yes → withdraw the over-extension and surface the uncovered question as a new gap.
- Did I echo active info-packet style at Round 1 (or confirm prior echo from interview skill)? No → echo now before next packet.
- Did the packet end with "What's next?" or a natural variant? No → add closing prompt before send.

Strategy-talk + C1 + C2 sibling checks from util-design-partner-role still run on top.
