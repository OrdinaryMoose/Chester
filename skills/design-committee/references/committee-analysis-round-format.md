---
name: design-committee-round-format
description: >
  Template for the round-folder committee record. Each round is one
  `committee/roundNN/` folder holding per-member transcript files, a researcher
  findings file, a distinct enumerate-only Consolidator output file, and the
  team-lead's designer-facing committee-analysis.md (Round Overview + Final
  Recommendation). A follow-up round opens the next roundNN/. Copy the template
  block, fill the <…> placeholders, delete the (guidance) notes. Read when
  persisting a round.
---

# Committee Analysis — Round-Folder Format

One committee round = one **folder**: `committee/roundNN/`. A follow-up round opens
the next folder (`round02/`, `round03/`, …). Rounds are not appended into a single
file — each round is a self-contained folder. There is no per-designer-question file:
the round folder is the unit of record.

The folder separates three distinct kinds of artifact, with three distinct audiences
and disciplines:

- **Per-member transcripts** (`<member>-transcript.md`, `researcher-findings.md`) —
  full positions in each member's own words. Code vocabulary, type names, and file
  paths ARE allowed here. These are the internal record; they are **not**
  designer-facing and the Translation Gate does **not** apply to them.
- **Consolidator output** (`consolidator-output.md`) — a mechanical enumeration over
  the transcripts: alignment count, a one-line summary per member, and verbatim
  notable quotes. The Consolidator **enumerates only**. It does NOT make the
  risk-weighted call, does NOT characterize or weight positions, and does NOT
  synthesize. This is explicitly **not** the team-lead's recommendation.
- **Team-lead committee analysis** (`committee-analysis.md`) — the Round Overview plus
  the **Final Recommendation**: the team-lead's risk-weighted decision, written
  downstream of and distinct from the Consolidator output. The Translation Gate
  **APPLIES** here (designer-facing: option-naming rule, read-aloud, no code
  vocab/paths/type names).

## Folder Shape

```
committee/
└── roundNN/
    ├── researcher-findings.md       # prior-art facts, source/file:line evidence
    ├── conservator-transcript.md    # one transcript per advocacy member
    ├── innovator-transcript.md
    ├── pragmatist-transcript.md
    ├── purist-transcript.md
    ├── consolidator-output.md       # enumerate-only: counts, summaries, quotes
    └── committee-analysis.md        # team-lead: Round Overview + Final Recommendation
```

- **One folder per round.** The first consultation round is `round01/`. Each additional
  deliberation pass opens the **next** `roundNN/` folder — `round02/`, `round03/`, … A
  follow-up does not edit a prior round's folder; the prior rounds are immutable record.
- **Per-member transcripts** are written by each member (full position, verbatim).
- **researcher-findings.md** is the researcher's prior-art file (verbatim, abridged).
- **consolidator-output.md** is the Consolidator's enumeration over that round's
  transcripts + findings.
- **committee-analysis.md** is the team-lead's designer-facing analysis for the round.

## How To Use

1. Create the round folder `committee/roundNN/`, where `NN` is the zero-padded round
   number (`01`, `02`, …). The `committee/` root resolves per `references/member-protocol.md`
   § Committee root resolution (sprint-subdir when sprint context exists, else the
   designer-asked location locked at Round 1) — that section is the single authority;
   do not restate the fork here.
2. Each member writes their own `<member>-transcript.md`; the researcher writes
   `researcher-findings.md`. Replace every `<…>` placeholder; delete the `(guidance…)`
   notes once filled.
3. The Consolidator reads that round's transcripts + findings and writes
   `consolidator-output.md` — enumeration only.
4. The team-lead writes `committee-analysis.md` for the round: Round Overview, then a
   Final Recommendation derived from (and distinct from) the Consolidator output.
5. A follow-up deliberation opens the **next** `roundNN/` folder. Do not back-edit
   prior round folders — each round is a self-contained, immutable record.

## Conventions (carry into every round folder)

- **Quote, don't paraphrase.** Member transcripts and researcher findings are recorded
  `(verbatim, abridged)`. Abridge, never rewrite away, a member's own words and stance
  label.
- **Poles are a reporting lens, not a fixed pairing.** The four advocacy members are
  points in shared deliberation space. Name the poles a round split into for clarity,
  but any member may converge with or split from any other — do not bake a fixed 2-and-2.
- **Capture mid-round events.** Premise swaps, loop halts, retractions, and adoptions are
  part of the proven record. Record them in the transcripts: what happened and what the
  members settled on.
- **Consolidator enumerates; team-lead decides.** The Consolidator reports alignment
  count, per-member summaries, and verbatim notable quotes — nothing more. The
  risk-weighted call lives solely in the team-lead's Final Recommendation, downstream of
  the Consolidator output.
- **Translation Gate boundary.** The Gate APPLIES to `committee-analysis.md` (the one
  designer-facing artifact). It does NOT apply to transcripts, findings, or the
  Consolidator output — those are internal and may carry code vocabulary.

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
```

### `<member>-transcript.md` (one per advocacy member: conservator, innovator, pragmatist, purist)

```markdown
# <Member> — transcript (verbatim, abridged) — roundNN
# Stance: <one-line stance label>

## Position

<The member's position in their own words, abridged: the gating fact they key on, the
form/content they propose, what they sacrifice. Mark Assumption:/Opinion: where the member did.
Code vocabulary, type names, and file paths are allowed here.>
<Scope self-check the round uses, e.g. F-A-C pass. Note if the member returns null in scope.>

## Follow-ups

<Peer Q&A and any revised position this round — what changed and why. Record mid-round events
(premise swaps, loop halts, retractions, adoptions) here: what happened and the proven facts
the member settled on.>
```

### `consolidator-output.md` (enumerate-only — NOT the risk-weighted call)

```markdown
# Consolidator output — roundNN
# Enumeration over this round's transcripts + findings. No interpretation, no weighting,
# no synthesis, no recommendation.

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

- <Member>: "<verbatim quote pulled from the transcript.>"
- <Member>: "<verbatim quote.>"
- <add quotes as needed; quote, never paraphrase.>
```

### `committee-analysis.md` (team-lead, designer-facing — Translation Gate APPLIES)

```markdown
# Committee Analysis — <one-line topic> — roundNN
# Sub-sprint: <sub-sprint-name> · dtd <YYYY-MM-DD> · HEAD <commit>

## Round Overview

<One paragraph framing the consultation: round shape (this is roundNN; whether follow-ups are
expected); what workflow step the committee runs as, if any; any role reassignment (e.g.
researcher serves the prior-art role); HEAD <commit>.>

**Question (<scope note — e.g. scope LOCKED from <prior round>>):** <the single question the
committee decides, stated in full.>

**Poles (reporting lens, not a fixed pairing):**
- <Pole A> — <one-line framing> (<members aligned>).
- <Pole B> — <one-line framing> (<members aligned>).
- <add or omit poles as the deliberation actually split.>

## Final Recommendation

<The team-lead's risk-weighted decision for this round, written downstream of and distinct from
consolidator-output.md. Translation Gate APPLIES: option-naming rule, read-aloud, no code
vocab/paths/type names. This is the designer-facing block.>

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

**Split adjudication** (OPTIONAL — include ONLY when irreducible; drop this block entirely on a unanimous round). <Name the tension in plain substance —
what each side defends; name who is on each side; ask which side the designer solves for. Do not
collapse to a single recommendation.>

**Recommendation.** Opinion: <so-what plus risk-weighted recommendation plus the trade-off the
designer accepts by taking it. This round is roundNN; note what it supersedes from a prior round
if anything.>

**Closing prompt.** <recommended next step, phrased direct to the designer.>
```
