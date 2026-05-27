---
name: design-committee-round-format
description: >
  Template for one persisted committee consultation — the full internal analysis
  record: round overview, an initial deliberation (researcher findings + per-member
  positions + member follow-ups), any number of appended follow-up rounds each capped
  by team-lead comments, and a single always-current Final Recommendation. Distinct
  from the designer-facing decision packet in team-lead.md. Copy the template block,
  fill the <…> placeholders, delete the (guidance) notes. Read when persisting a round.
---

# Committee Analysis — Per-Round Artifact Format

One filled instance of this template = one full committee consultation on a single
question, persisted as the committee's **internal analysis record**.

This is the internal transcript: researcher findings and each member's position quoted
close to verbatim, the follow-up exchanges, and the team-lead's comments. Code
vocabulary, type names, and file paths ARE allowed here — this artifact is not
designer-facing. The distilled, Translation-Gated thing the designer reads is the
separate **decision packet** in `team-lead.md` § Information Packet Format. Write that
*from* this record; do not confuse the two.

## Document Shape

- **Round Overview** — frames the consultation: question, poles, round shape.
- **Initial Deliberation** — researcher findings, each member's opening position, the
  member follow-ups, then a **Team Lead** comments section.
- **Follow Up 01, 02, …** — one per additional deliberation round. Each holds the
  member follow-ups for that round, then a **Team Lead** comments section.
- **Final Recommendation** — a single section at the very end carrying the current
  team-lead recommendation.

## How To Use

1. Copy the template block below into the consultation's file:
   `{CHESTER_WORKING_DIR}/<sprint-subdir>/design/committee-analysis-<question-slug>.md`.
2. Replace every `<…>` placeholder with content; delete the `(guidance…)` notes once filled.
3. Each new deliberation round is **appended** as a `## Follow Up NN` section — the rounds
   above are append-only record, never back-edited.
4. **Final Recommendation is the one mutable section.** When a follow-up shifts the call,
   the team-lead **overwrites it in place** so it always reflects the latest recommendation,
   not a history of calls. Note in its **Basis** line which round settled it and what it
   supersedes.

## Conventions (carry into every filled round)

- **Quote, don't paraphrase.** Member positions and researcher findings are recorded
  `(verbatim, abridged)`. The team-lead abridges, never rewrites away, a member's own
  words and stance label.
- **Poles are a reporting lens, not a fixed pairing.** The four advocacy members are
  points in shared deliberation space. Name the poles a round split into for clarity,
  but any member may converge with or split from any other — do not bake a fixed 2-and-2.
- **Capture mid-round events.** Premise swaps, loop halts, retractions, and adoptions are
  part of the proven record. Record them in the round's Member follow-ups: what happened
  and what the members settled on.
- **Team Lead sections carry comments only — no recommendation.** Per round the team-lead
  reports convergence, alignment, and observations; it does not adjudicate for the designer
  and never collapses an irreducible split. The recommendation lives solely in the single
  Final Recommendation section.

---

## Template

```markdown
# Committee Analysis — <one-line topic>
# File: committee-analysis-<question-slug>.md dtd <YYYY-MM-DD>
# Master: <master-sprint-name> · Sub-sprint: <sub-sprint-name>

## Round Overview

<One paragraph framing the consultation: round shape (e.g. one round, single-round-format,
or initial + follow-ups expected); what workflow step the committee runs as, if any (e.g.
the design-specify "Competing Architectures" step); any role reassignment (e.g. researcher
serves the prior-art role); HEAD <commit>.>

**Question (<scope note — e.g. scope LOCKED from <prior consultation>>):** <the single
question the committee decides, stated in full.>

**Poles (reporting lens, not a fixed pairing):**
- <Pole A> — <one-line framing> (<members aligned>).
- <Pole B> — <one-line framing> (<members aligned>).
- <add or omit poles as the deliberation actually split.>

## Initial Deliberation

### Researcher — prior-art findings (verbatim, abridged<; mark DECISIVE if it settles the question>)

<Finding 1> — <fact, with file:line or source evidence.>

<Finding 2> — <fact.>

<add findings as needed.>

Synthesis (facts): <neutral fact-level synthesis — no design opinion, no recommendation.>

### <Member> — position (verbatim, abridged): <one-line stance label>

<The member's position in their own words, abridged: the gating fact they key on, the
form/content they propose, what they sacrifice. Mark Assumption:/Opinion: where the member did.>
<Scope self-check the round uses, e.g. F-A-C pass. Note if the member returns null in scope.>

### <Member> — position (verbatim, abridged): <one-line stance label>

<...>

(One section per advocacy member who took a position: Conservator, Innovator, Pragmatist, Purist.)

### Member follow-ups

<The peer Q&A and any revised positions within this round — one entry per member who asked,
answered, or revised. Record mid-round events (premise swaps, loop halts, retractions,
adoptions) here: what happened, and the proven facts the members settled on.>

### Team Lead

<Comments only — NO recommendation (that lives in Final Recommendation).>

**Convergence (stable, proven).** <What all members + researcher agree on after this round —
the settled floor, and which contested forms collapsed to null and why.>

**Alignment.** <Count and who-is-on-which-side this round (4-0, 3-1, 2-2, 2-1-1, finer); what
each side defends in plain substance. Flag any irreducible split — do not collapse it.>

**Observations.** <Team-lead's read on the round: scope-check (e.g. F-A-C), open tensions,
what a follow-up round would need to resolve. No design opinion injected into member content.>

## Follow Up 01

### Member follow-ups

<Each member's follow-up this round — what changed since the prior round and why. Record any
mid-round events as above.>

### Team Lead

<Comments only, same shape as above: Convergence, Alignment, Observations. No recommendation.>

## Follow Up 02

### Member follow-ups

<...>

### Team Lead

<...>

(Append a Follow Up NN section per additional round. Each = Member follow-ups + a Team Lead
comments section. No recommendation in any of them.)

## Final Recommendation

<Single, always-current. OVERWRITE in place whenever a follow-up shifts the call — it reflects
the latest team-lead recommendation, not a history. The only mutable section; the rounds above
are append-only record. Written in the team-lead.md § Decision Package + § Team-Lead Comments
form — the Translation Gate APPLIES here (this is the one designer-facing block in the record:
option-naming rule, read-aloud, no code vocab/paths/type names). Note which round settled the
call in the Recommendation line so a reader knows it is current, not stale.>

**Decision.** <One sentence naming what the designer is being asked to decide.>

**Options:**

1. <Option named by what it does structurally> — <defending member> defends, <opposing member> opposes; <one-line load-bearing trade-off>.

Advantages:
- <one-line advantage>
- <one-line advantage>

Disadvantages:
- <one-line disadvantage>
- <one-line disadvantage>

Implications: <one sentence on downstream effects>

2. <Option named by what it does structurally> — <defending member> defends, <opposing member> opposes; <one-line trade-off>.

Advantages:
- <one-line advantage>
- <one-line advantage>

Disadvantages:
- <one-line disadvantage>
- <one-line disadvantage>

Implications: <one sentence on downstream effects>

**Split adjudication** (include ONLY when irreducible). <Name the tension in plain substance —
what each side defends; name who is on each side; ask which side the designer solves for. Do not
collapse to a single recommendation.>

**Recommendation.** Opinion: <so-what plus risk-weighted recommendation plus the trade-off the
designer accepts by taking it. Note which round settled the call and what it supersedes — e.g.
"settled Follow Up 02; supersedes the Initial Deliberation lean.">

**Closing prompt.** <recommended next step, phrased direct to the designer.>
```
