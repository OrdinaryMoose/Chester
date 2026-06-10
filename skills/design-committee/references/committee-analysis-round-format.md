---
name: design-committee-round-format
description: >
  Template for the round-folder committee record. Each round is one
  `committee/roundNN/` folder holding per-member transcript files (each ending in
  a `## Final Position`), a researcher findings file, the enumerate-only
  Consolidator output, the team-lead's `alignment-map.md` and `verdict.md`, and
  the scribe's designer-facing decision-packet artifact. A follow-up round opens
  the next roundNN/. Copy the template block, fill the <…> placeholders, delete
  the (guidance) notes. Read when persisting a round.
version: v0001
---

# Committee Round-Folder Format

One committee round = one **folder**: `committee/roundNN/`. A follow-up round opens
the next folder (`round02/`, `round03/`, …). Rounds are not appended into a single
file — each round is a self-contained folder. There is no per-designer-question file:
the round folder is the unit of record.

The folder holds the round's artifacts in pipeline order, with distinct audiences and
disciplines:

- **Per-member transcripts** (`<member>-transcript.md`, `researcher-findings.md`) —
  full positions in each member's own words, each ending in a `## Final Position`
  (schema per `references/member-protocol.md` § Final Position). Code vocabulary, type
  names, and file paths ARE allowed here. Internal record; **not** designer-facing; the
  Translation Gate does **not** apply.
- **Consolidator output** (`consolidator-output.md`) — a mechanical enumeration over the
  transcripts' `## Final Position` sections: alignment count, a one-line summary per
  member, and verbatim notable quotes. The Consolidator **enumerates only** — it does NOT
  make the risk-weighted call, characterize, weight, or synthesize. Internal.
- **Alignment map** (`alignment-map.md`) — the team-lead's synthesis: the alignment
  pattern, the full option set, and the positions discarded with reason. Written downstream
  of the Consolidator output, then evicted from context. Internal.
- **Verdict** (`verdict.md`) — the team-lead's risk-weighted decision, specific and
  one-sentence-minimum, written downstream of the alignment map. The decision of record and
  the scribe's primary source. Internal handoff.
- **Scribe decision-packet** (the designer-facing artifact) — authored by the scribe from
  the verdict, alignment map, and Consolidator output, following
  `references/artifact-template.md` (which owns the artifact's section structure, including
  the mandatory `## Dissent Record`). The Translation Gate **APPLIES** here (designer-facing:
  option-naming rule, read-aloud, no code vocab/paths/type names).

## Folder Shape

```
committee/
└── roundNN/
    ├── researcher-findings.md       # prior-art facts, source/file:line evidence
    ├── conservator-transcript.md    # one transcript per advocacy member; ends in ## Final Position
    ├── innovator-transcript.md
    ├── pragmatist-transcript.md
    ├── purist-transcript.md
    ├── consolidator-output.md       # enumerate-only: counts, summaries, quotes
    ├── alignment-map.md             # team-lead: alignment pattern + option set + discards
    ├── verdict.md                   # team-lead: risk-weighted decision (one sentence min)
    └── <decision-packet>.md         # scribe: designer-facing artifact, per references/artifact-template.md
```

- **One folder per round.** The first consultation round is `round01/`. Each additional
  deliberation pass opens the **next** `roundNN/` folder. A follow-up does not edit a prior
  round's folder; prior rounds are immutable record.
- **Per-member transcripts** are written by each member (full position, verbatim), each ending
  in a `## Final Position`.
- **researcher-findings.md** is the researcher's prior-art file (verbatim, abridged).
- **consolidator-output.md** is the Consolidator's enumeration over that round's `## Final
  Position` sections.
- **alignment-map.md** and **verdict.md** are the team-lead's synthesis and decision.
- the **scribe decision-packet** is the round's designer-facing artifact.

## How To Use

1. Create the round folder `committee/roundNN/`, where `NN` is the zero-padded round number.
   The `committee/` root resolves per `references/member-protocol.md` § Committee root
   resolution — that section is the single authority; do not restate the fork here.
2. Each member writes their own `<member>-transcript.md` (ending in `## Final Position`); the
   researcher writes `researcher-findings.md`. Replace every `<…>` placeholder; delete the
   `(guidance…)` notes once filled.
3. The Consolidator reads that round's `## Final Position` sections and writes
   `consolidator-output.md` — enumeration only.
4. The team-lead writes `alignment-map.md` (synthesis), then `verdict.md` (the risk-weighted
   decision), each downstream of the Consolidator output and evicted after writing.
5. The scribe authors the designer-facing decision-packet from the verdict, alignment map, and
   Consolidator output, following `references/artifact-template.md`.
6. A follow-up deliberation opens the **next** `roundNN/` folder. Do not back-edit prior round
   folders — each round is a self-contained, immutable record.

## Conventions (carry into every round folder)

- **Quote, don't paraphrase.** Member transcripts and researcher findings are recorded
  `(verbatim, abridged)`. Abridge, never rewrite away, a member's own words and stance label.
- **Poles are a reporting lens, not a fixed pairing.** The four advocacy members are points in
  shared deliberation space. Name the poles a round split into for clarity, but any member may
  converge with or split from any other — do not bake a fixed 2-and-2.
- **Capture mid-round events.** Premise swaps, loop halts, retractions, and adoptions are part
  of the proven record. Record them in the transcripts.
- **Consolidator enumerates; team-lead decides.** The Consolidator reports alignment count,
  per-member summaries, and verbatim notable quotes — nothing more. The risk-weighted call lives
  solely in the team-lead's `verdict.md`, downstream of the Consolidator output.
- **Translation Gate boundary.** The Gate APPLIES to the scribe's designer-facing decision-packet.
  It does NOT apply to transcripts, findings, the Consolidator output, the alignment map, or the
  verdict — those are internal and may carry code vocabulary.
- **Answer shape + warrants on disk.** `alignment-map.md` and `verdict.md` carry an answer-shape
  marker (converged / preserved-split / partial) and a warrant record for the answer body. These
  ride the existing team-lead artifacts — no new per-round file is introduced. This is the
  committee's **output-surface split**: the scribe's designer-facing decision-packet has a locked
  format; the team-lead's on-disk answer record does not. (This output-surface split is a distinct
  concept from the "two-surface" usage in sprint `20260521-02-design-architect-committee` — do not
  conflate the two terms.)

---

## Template — round folder files

### `researcher-findings.md`

```markdown
# Researcher — prior-art findings (verbatim, abridged) — roundNN
# Sub-sprint: <sub-sprint-name> · HEAD <commit>

<Finding 1> — <fact, with file:line or source evidence; mark DECISIVE if it settles the question.>

<Finding 2> — <fact.>

<add findings as needed.>

Synthesis (facts): <neutral fact-level synthesis — no design opinion, no recommendation.>

## Final Position
<Per `references/member-protocol.md` § Final Position. The researcher holds no design opinion:
position = "no design opinion"; blocking_risk = "none — research role holds no advocacy".>
```

### `<member>-transcript.md` (one per advocacy member: conservator, innovator, pragmatist, purist)

```markdown
# <Member> — transcript (verbatim, abridged) — roundNN
# Stance: <one-line stance label>

## Position

<The member's position in their own words, abridged: the gating fact they key on, the
form/content they propose, what they sacrifice. Mark Assumption:/Opinion: where the member did.
Code vocabulary, type names, and file paths are allowed here.>

## Follow-ups

<Peer Q&A and any revised position this round — what changed and why. Record mid-round events
(premise swaps, loop halts, retractions, adoptions) here.>

## Final Position
<The last section of every transcript. Schema per `references/member-protocol.md` § Final Position
(the schema lives there; do not restate the fields here). 200-word cap; member-authored.>
```

### `consolidator-output.md` (enumerate-only — NOT the risk-weighted call)

```markdown
# Consolidator output — roundNN
# Enumeration over this round's transcripts' Final Position sections. No interpretation,
# no weighting, no synthesis, no recommendation.

## Alignment count

<Count and who-is-on-which-side this round (4-0, 3-1, 2-2, 2-1-1, finer). State the count;
do not characterize which side is stronger.>

## Per-member summaries

- **Conservator** — <one-line factual summary of the recorded position.>
- **Innovator** — <one-line factual summary.>
- **Pragmatist** — <one-line factual summary.>
- **Purist** — <one-line factual summary.>
- **Researcher** — <one-line factual summary of the findings.>

## Notable quotes (verbatim)

- <Member>: "<verbatim quote pulled from the Final Position.>"
- <Member>: "<verbatim quote.>"
- <add quotes as needed; quote, never paraphrase.>
```

### `alignment-map.md` (team-lead — synthesis, internal)

```markdown
# Alignment map — <one-line topic> — roundNN

## Alignment pattern
<The alignment count and who-is-on-which-side, carried from consolidator-output.md.>

## Option set
<Every option on the table this round, named by what it does structurally.>

## Positions discarded (with reason)
<Each option or position set aside this round, and the load-bearing reason it was set aside.>

## Answer shape
<One of: converged / preserved-split / partial. The shape the round's answer takes — chosen to lose the least information.>

## Warrant record
<For every answer-body assertion, its warrant: evidence / logic / in-scope designer-premise, with the source. An assertion with no warrant is not answer content — record it under the gaps it became instead.>
```

### `verdict.md` (team-lead — risk-weighted decision, internal handoff to scribe)

```markdown
# Verdict — <one-line topic> — roundNN

**Answer shape:** <converged / preserved-split / partial>

<The team-lead's risk-weighted answer for this round: specific, one-sentence-minimum (an
ambiguous verdict cannot proceed), written downstream of and distinct from consolidator-output.md
and alignment-map.md. This is the scribe's primary source.>

**Warrants:** <for each answer-body assertion, its warrant (evidence / logic / in-scope designer-premise)
and source — the same record carried in alignment-map.md, restated so the verdict is auditable standalone.>
```

### Scribe decision-packet (designer-facing — Translation Gate APPLIES)

The scribe authors the round's designer-facing artifact from `verdict.md`, `alignment-map.md`, and
`consolidator-output.md`, following `references/artifact-template.md` — which owns the artifact's
section structure (Summary, Verdict, Rationale, the mandatory `## Dissent Record`, Deferred / Open).
Do not duplicate that template here; it is the single source for the artifact shape. The team-lead
presents this artifact to the designer per `team-lead.md` § Visible Surface / Information Packet Format.
