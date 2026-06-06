---
name: design-committee-member-protocol
description: >
  Shared protocol for design-committee members and the researcher — the typed
  routing signal sent to the team-lead, the transcript/round-folder discipline,
  the Final Position schema (sole authority), the peer-DM shape, write-then-send
  sequencing, and the single authority for committee-root resolution. Cited by
  SKILL.md and team-lead.md; not restated by them.
---

# Committee member protocol

This is the shared contract every committee member and the researcher follows
when participating in an Ad-hoc committee round. The sections below are
citable by exact `##` heading. `SKILL.md` and `team-lead.md` reference these
sections rather than restating their rules.

## Routing signal (member → team-lead)

A member never sends its reasoning or its position into the team-lead's context.
The **routing signal is the entire team-lead-facing payload** — a typed pointer,
nothing more. The team-lead reads the signal only to learn *that* a member
finished and *where* its work landed; the substance lives on disk (the
transcript and its `## Final Position`), read on demand, never resident in
context by default.

The signal is exactly these four fields and no others:

```
{member, status, round, transcript}
```

- `member` — the member's role (e.g. `conservator`, `researcher`).
- `status` — `done` (transcript written, `## Final Position` present) or
  `blocked` (the member could not complete; the transcript states why).
- `round` — the zero-padded round number the signal belongs to.
- `transcript` — the round-folder path to the member's transcript
  (`committee/roundNN/<member>-transcript.md`, or
  `committee/roundNN/researcher-findings.md` for the researcher).

These four fields are the whole body. There is **no free-text field** — no
headline, no summary, no argument. A signal carrying any field outside this
schema, or omitting one, is **malformed**: the team-lead rejects it unread and
issues one correction prompt, and the member re-sends a conforming signal. The
argument never travels in the signal; it lives in the transcript and is
consolidated only through `## Final Position`.

## Transcript and round-folder

Before sending its routing signal, each member writes its full position to:

```
committee/roundNN/<member>-transcript.md
```

The researcher writes to `committee/roundNN/researcher-findings.md` instead.

`NN` is zero-padded and **matches the team-lead's current round number** — a
member writing in Round 3 writes under `committee/round03/`. The round folder
is created if it does not yet exist.

The transcript holds the member's complete reasoning: the options considered,
the weighing, the evidence, and the path to its Final Position. It is the
durable record the downstream steps consult; its `## Final Position` (below) is
the bounded slice that gets consolidated.

The **Translation Gate does not apply to transcript files.** Transcripts are
internal working records, not designer-facing artifacts, so code vocabulary and
implementation-level terms are permitted inside them.

## Final Position

Every member transcript ends with a section under the exact header
`## Final Position`. It is the **last section of the transcript** and the only
part any downstream step reads to learn what the member concluded. This section
is the **single authority for the Final Position schema** — the consolidator,
the team-lead, the round-format reference, and the annotated artifact all cite
this section rather than restating its fields.

Requirements:

- **Exact header** — `## Final Position`, spelled exactly, so downstream steps
  locate it structurally.
- **Last section** — nothing follows it in the transcript.
- **200-word cap** — the whole section is at most 200 words.
- **Member-authored** — the member writes every field; no other role composes or
  edits it.
- **Schema** — exactly these three fields:

```
{position, rationale, blocking_risk}
```

- `position` — the option the member lands on, named by what it does
  structurally.
- `rationale` — why, from the member's lens; a few sentences.
- `blocking_risk` — the member's own ~20-word articulation of the hardest
  objection to the options it did *not* choose. It is the member's reasoning in
  its own words, **not a label and not a paraphrase** of someone else's point.

No other file restates these fields. Downstream steps read this section directly.

## Peer-DM

A member may challenge a peer directly during a multi-round deliberation. A
peer-DM exchange has this shape:

```
[sender]→[target]: [one sentence]
[target]: [one sentence]
```

- **Max 2 exchanges per pair** for the whole deliberation — a sender/target pair
  trades at most two challenge-and-response rounds. Beyond that, the point goes
  to the transcript.
- **Caveman ultra** — the most compressed register: fragments only, articles and
  connectors and hedging dropped, code vocab kept (the peer can decode).
- Peer-DMs are working chatter, not team-lead-facing payload. Nothing in a
  peer-DM reaches the team-lead except through a transcript and its
  `## Final Position`.

## Write-then-send sequencing

The order is fixed: write the transcript — including its `## Final Position` —
to its round-folder path before sending the routing signal.

1. **Write the transcript first** (with `## Final Position` as the last section)
   to its round-folder path.
2. **Send the routing signal second** via messaging.

Never send a routing signal whose transcript is not yet on disk. The
`transcript` field is a promise that the file already exists and carries a
`## Final Position`; sending a signal ahead of its transcript breaks that
promise and leaves the team-lead with a dangling reference.

## Committee root resolution

The `committee/` root referenced throughout this protocol resolves as follows:

- When sprint context exists, the root is
  `{CHESTER_WORKING_DIR}/<sprint-subdir>/committee/`.
- When no sprint context exists, the team-lead asks the designer for the
  committee location at Round 1 and locks it for the remainder of the session.

This section is the **single authority for the resolution rule.** `SKILL.md`
and `team-lead.md` cite this section; they do not restate the fork. Any change
to how the committee root is resolved is made here and only here.
