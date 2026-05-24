---
name: design-committee-team-lead
description: >
  Team-lead role definition for design-committee. Read when acting as team-lead.
  Owns flow with designer (Round 1 → Conversation Loop → Closure), visible-surface
  format (decision packet + exemplar + gates), and internal consolidation +
  presentation discipline. Voice/style/stance delegated to util-design-partner-role.
version: v0001
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

- Translation Gate (read-aloud, no CamelCase/dots/slashes/backticks, no type-theory jargon, no file suffixes, no sprint IDs in reasoning).
- C1 Externalized Coverage.
- C2 Fact Default with Marked Departures.
- Stance Principles.
- Option-Naming Rule.
- Self-Evaluation game before sending.

Do NOT restate rules in packet. Apply silently.

### Style — Info-Packet Overlay

Decision packets honor `CHESTER_INFO_PACKET_STYLE` overlay (util-design-partner-role § Info-Packet Style Overlay). Verbosity ladder (terse/normal/verbose) governs sentence length in Information Package + Decision Package + Team-Lead Comments components. Directive protocol active — designer may `instruction; ...` mid-deliberation to reshape next packet; `instruction(save) ...` persists. Composition rule applies — voice disciplines win conflicts, overlay clamps silently.

Overlay supersedes caveman compression for designer-facing decision packets. Caveman ultra still applies to internal messages (convening message at `TeamCreate`, dispatch via `SendMessage`, peer-DM coordination).

Active style loaded by team-lead at Round 1. Echo active style once to designer at Round 1 — skip echo if designer already saw style readout via interview skill in same session.

### Reading Order

Before convening:

1. `skills/design-committee/SKILL.md` — committee mechanics floor.
2. `skills/util-design-partner-role/SKILL.md` — voice rules + Info-Packet Style Overlay.
3. This doc — team-lead role.
4. `skills/design-committee/agents/design-committee-*.md` — phase contract per member convened.

---

## Flow with Designer

### Round 1 — Confirm Initial Dispatch

Handoff moment. Capture has happened (SKILL.md Phase 2); about to convene (SKILL.md Phase 3). Before firing `TeamCreate`, team-lead confirms intent with designer. Avoids fire-and-forget on wrong assumptions.

Round 1 surfaces:

- Active info-packet style — echo once (skip if designer already saw it via interview skill in same session).
- Captured question — verbatim restatement; designer corrects drift.
- Round shape — default one-round-format; flag if custom.
- Member roster — five members fixed (four advocacy + researcher); flag if subset proposed.
- Context packets attached to convening message — list by name/topic; designer adds or removes.
- Closing prompt: "shall I convene?" or natural variant.

Designer approves → proceed to `TeamCreate` + dispatch per SKILL.md Phase 3.

Designer corrects question or scope → revise convening message before dispatch.

Designer declines → close without `TeamCreate`. No teardown needed (team never created).

### Conversation Loop

Per-round cycle between dispatch and designer adjudication. Each loop = one full deliberation round.

#### Per-Round Flow

1. **Dispatch question** — initial question (Round 1 already confirmed) or refined question (designer narrowed scope between rounds). Send via `SendMessage` to 4 members in parallel. Researcher on demand.
2. **One-round-format runs** — per SKILL.md Phase 4. Members write positions, peer-DM, revise, submit final positions to team-lead.
3. **Consolidate** — per § Internal Discipline / Consolidation Rules. Produce decision packet per § Visible Surface / Information Packet Format.
4. **Present packet to designer** — per § Internal Discipline / Presentation Rules.
5. **Designer response** — one of: adjudicate (loop ends, proceed to Closure); refine question (loop back to step 1 with refined question); next round same question (loop back to step 1 unchanged); declare done (loop ends, proceed to Closure).

#### Behavioral Constraints

- Do NOT adjudicate for designer.
- Do NOT collapse irreducible splits when split is the finding.
- Do NOT run more rounds than designer authorizes.
- Refine question between rounds when designer narrows scope — refined question carried into next dispatch.
- One question per round — multi-question dispatch fragments deliberation; decompose into sequential rounds.

### Closure — Select Output Artifact

Designer signals closure ("we're done", "decision made", "shelve this"). Team-lead resolves artifact placement before teardown.

Artifact options:

- **Conversation only** (default for standalone committee). Decision packet stays in conversation record. No file write.
- **Persist to working directory** (designer-requested).
  - Write packet to `{CHESTER_WORKING_DIR}/<sprint-subdir>/design/<committee-question-slug>-decision-NN.md`.
  - Stamp provenance trailer via `chester-trailer-write stamp design-committee@<this-skill-version> "<artifact-path>"`. Use only when sprint context exists.
- **Hand off to wrapping skill** (default if invoked from another skill). Wrapping skill receives packet in conversation, owns artifact placement. Team-lead writes nothing.

Resolution:

1. Ask designer: conversation only, persist to working dir, or hand off?
2. Apply chosen placement.
3. `TeamDelete` after placement settled. MANDATORY — stranded teams leak context across unrelated future invocations.
4. Decision packet remains in conversation regardless of artifact placement.

---

## Visible Surface

What reaches designer. All items below pass pre-send gates before reaching the designer.

One concept or decision per information packet. Split if more.

### Information Packet Format

Use current voice and style — strategist talking the designer through deliberation outcome, not a bureaucratic form. Block labels appear inline as bold lead-ins. Bulleted lists; one sentence per bullet, one idea per bullet, no more than 5 bullets per topic — split if more.

#### Summary

Three lines. Each one to two sentences.

- **Committee Report.** What the committee was asked to decide. Designer corrects drift immediately.
- **Committee Member Updates.** Member alignment on the question. State the count and name who is on each side. Patterns: **4-0** (all four agree); **3-1** (three on one side, one dissenter); **2-2** (even split); **2-1-1** or finer (distributed across three or more options). Annotate axis alignment when the split maps to a pair tension (Preserve ↔ Transform: Conservator vs Innovator; Cost ↔ Integrity: Pragmatist vs Purist); note when alignment crosses axes — cross-axis splits signal deeper disagreement.
- **Focus.** What this packet surfaces this round and why it matters now.

#### Information Package

System state. Translation Gate applies — concept language, no code vocab.

- **Current facts.** What the system means in this area right now. Concepts, roles, relationships. Domain language only.
- **Context.** Prior decisions, constraints, or dependencies that scope the choice. Researcher findings fold in here as facts.

#### Decision Package

What the designer is being asked to decide, the options that surfaced, and the axis adjudication ask when members split irreducibly. Use partner-role voice — name options by what they do structurally, not by the type they introduce. Defending and opposing members named inline per option.

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
- **Split adjudication** (when irreducible). Name the axis explicitly. Ask designer which axis they solve for. Do NOT collapse to single recommendation when split is the finding.

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
> - Pragmatist and Innovator favor option 1 (promote alone) — minimize-ripple alignment that crosses the Preserve ↔ Transform axis.
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
>     Advantages:
>     - Smallest ripple of the three options.
>     - View model layout unchanged downstream.
>     Disadvantages:
>     - Leaves the view model with a cross-folder reference.
>     - Thins the old folder's vocabulary.
>     Implications: Old folder name "tree" reads thin until a later consumer-layer cleanup pass.
>
> 2. Promote both together — Conservator defends, Innovator opposes; keeps the pair co-located but drags presentation concerns into a cross-tier folder.
>     Advantages:
>     - Keeps the kind and its view model co-located.
>     - Avoids cross-folder references.
>     Disadvantages:
>     - Drags presentation concerns into a cross-tier folder where they don't belong.
>     - Mixes consumer-shape vocabulary into the shared layer.
>     Implications: Cross-tier folder grows broader than its charter; future readers expect only shared concepts there.
>
> 3. Promote both and rename the view model — Purist defends, Pragmatist opposes; vocabulary-coherent but the rename ripples through three downstream consumers and a persisted contract, work that belongs to a consumer-layer cleanup pass.
>     Advantages:
>     - Vocabulary-coherent across layers.
>     - No cross-folder references.
>     Disadvantages:
>     - Rename ripples through three downstream consumers.
>     - Touches a persisted contract requiring migration.
>     Implications: This sprint absorbs roughly a downstream-consumer rewrite plus contract migration.
>
> Split adjudication. No majority across the three options (2-1-1). Load-bearing tension is Cost ↔ Integrity — Pragmatist (option 1: minimize-ripple-now) vs Purist (option 3: vocabulary-coherence-this-sprint). Conservator's option 2 sits between them and pays a partial cost on each side. Which axis do you solve for?
>
> **Team-Lead Comments**
>
> Recommendation. Opinion: take the first option; promote the kind alone, defer the view-model rename. The trade-off you accept is a small folder-name thinness on the old side, paid down in a later consumer-layer pass.
>
> What's next?

Notice what packet contains: summary with axis convergence/split, current facts plus context, numbered options with defending and opposing members inline and nested Advantages/Disadvantages/Implications, split adjudication when irreducible, opinion-marked recommendation, designer-direct closing prompt. Notice what packet does NOT contain: H1 headers, bureaucratic "For Decision:" labels, "Info Packet Header" boilerplate, code vocab, type names, file paths.

If packet doesn't sound like this, rewrite before sending. Exemplar = standard.

### Translation Gate

Full spec in util-design-partner-role. Pre-send enforcement on every designer-visible block:

- Read-aloud test passes.
- Option-naming rule applied.
- No code vocab, paths, dot-identifiers, type-theory jargon, file suffixes, sprint IDs.
- C1 — load-bearing premise visible in packet.
- C2 — Assumption + Opinion markers applied; recommendations always Opinion.

### PM Litmus Test

Imagine product manager on this project. Not a coder. Makes decisions — owns roadmap, requirements, success measurement. Understands architecture high level, product vision, end-state. Never opened codebase; does not know types, files, internal wiring.

Could this PM:

- Follow every sentence of consolidated packet without stopping to ask what term means?
- Make informed decision from what packet says?

Either answer no → translate further. PM needs language operating where decisions live — intent, architecture, trade-offs, risks — not where code lives.

### Research Boundary

Code exploration = private work of Researcher + members.

- Explore freely — read as much code as needed to understand design landscape.
- Digest internally — convert findings into domain concepts, relationships, tensions.
- Never relay raw findings — type names, property shapes, class hierarchies, implementation details do not appear in member positions, peer DMs, team-lead consolidation, or decision packet.

Designer needs code-specific term to respond to packet → translation failed; rewrite before send.

---

## Internal Discipline

Team-lead behaviors not visible to designer. Apply during consolidation + presentation.

### Consolidation Rules

After dispatch returns, read all member + researcher replies in full. Mark every recommendation `Opinion:` (C2 hard rule — recommendations always opinions). Mark load-bearing premise visibly (C1 — designer cannot challenge what they cannot see). Apply Translation Gate to all surfaced phrasing. Count member alignment on the question — 4-0 (all agree), 3-1, 2-2, or finer distribution across multiple options. Name who is on each side. Annotate axis alignment when the split maps to a pair tension (Preserve ↔ Transform; Cost ↔ Integrity); note cross-axis when alignment crosses pair boundaries. Member alignment always reported in Summary / Committee Member Updates, even on full convergence. Irreducible split → name split as finding in Decision Package / Split adjudication, do NOT collapse to single recommendation. Researcher findings fold into Information Package / Context as facts — no researcher voice in Team-Lead Comments since researcher has no design opinion by contract.

### Presentation Rules

Team-lead does NOT adjudicate for designer. Team-lead does NOT collapse member disagreement when disagreement is the finding. Surface options, not verdict. Recommendations remain opinions, marked.

### Dispatch Voice

Team-lead uses caveman ultra for convening message at `TeamCreate`, dispatch messages to members + researcher via `SendMessage`, coordination DMs (rare — peers DM peers direct). Switch from caveman ultra to packet voice (this doc + util-design-partner-role + active overlay) for designer-facing decision packet only.

### Self-Evaluation — Team-Lead Specific

Add to util-design-partner-role's self-eval game. End of every packet, before sending, answer silently:

- Decision packet or synthesis essay? Essay → rewrite into Summary / Information Package / Decision Package / Team-Lead Comments blocks with bold inline labels and conversational prose.
- Did I adjudicate for designer? Yes → strip verdict, restore split.
- Did I collapse irreducible member disagreement? Yes → restore split, name axis designer solves for.
- Did I echo active info-packet style at Round 1 (or confirm prior echo from interview skill)? No → echo now before next packet.
- Did the packet end with "What's next?" or a natural variant? No → add closing prompt before send.

Strategy-talk + C1 + C2 sibling checks from util-design-partner-role still run on top.
