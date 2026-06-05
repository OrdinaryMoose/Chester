---
name: design-committee-member-protocol
description: >
  Shared protocol for design-committee members and the researcher — the digest
  shape sent to the team-lead, the transcript/round-folder discipline,
  write-then-send sequencing, and the single authority for committee-root
  resolution. Cited by SKILL.md and team-lead.md; not restated by them.
---

# Committee member protocol

This is the shared contract every committee member and the researcher follows
when participating in an Ad-hoc committee round. The four sections below are
citable by exact `##` heading. `SKILL.md` and `team-lead.md` reference these
sections rather than restating their rules.

## Digest shape

A member never sends its full reasoning into the team-lead's context. The
**digest is the entire team-lead-facing payload** — the team-lead sees only the
digest, never the transcript body. Full reasoning lives on disk (see
`## Transcript and round-folder`) where the team-lead may read it on demand but
it does not occupy context by default.

Each member sends exactly these fields:

```
Role:             <the member's assigned perspective>
Headline position: <one sentence — the member's bottom line for this round>
Chosen option:    <the named option, identified structurally — e.g. by its
                   structural name, not by an opaque label>
Top trade-off:    <one sentence — the single most important cost of the choice>
Confidence:       high | medium | low — <one-sentence basis for the level>
Transcript path:  committee/roundNN/<member>-transcript.md
```

The researcher sends the same field block, except its `Transcript path` points
at `committee/roundNN/researcher-findings.md`.

Keep every prose field to its stated length. The digest is a routing summary,
not an argument; the argument belongs in the transcript.

## Transcript and round-folder

Before sending its digest, each member writes its full position to:

```
committee/roundNN/<member>-transcript.md
```

The researcher writes to `committee/roundNN/researcher-findings.md` instead.

`NN` is zero-padded and **matches the team-lead's current round number** — a
member writing in Round 3 writes under `committee/round03/`. The round folder
is created if it does not yet exist.

The transcript holds the member's complete reasoning: the options considered,
the weighing, the evidence, and the path to the headline position. It is the
durable record the team-lead consults when the digest is not enough.

The **Translation Gate does not apply to transcript files.** Transcripts are
internal working records, not designer-facing artifacts, so code vocabulary and
implementation-level terms are permitted inside them.

## Write-then-send sequencing

The order is fixed: write the transcript to its round-folder path before
sending the digest.

1. **Write the transcript first** to its round-folder path.
2. **Send the digest second** via messaging.

Never send a digest whose transcript is not yet on disk. The `Transcript path`
field in a digest is a promise that the file already exists; sending a digest
ahead of its transcript breaks that promise and leaves the team-lead with a
dangling reference.

## Committee root resolution

The `committee/` root referenced throughout this protocol resolves as follows:

- When sprint context exists, the root is
  `{CHESTER_WORKING_DIR}/<sprint-subdir>/committee/`.
- When no sprint context exists, the team-lead asks the designer for the
  committee location at Round 1 and locks it for the remainder of the session.

This section is the **single authority for the resolution rule.** `SKILL.md`
and `team-lead.md` cite this section; they do not restate the fork. Any change
to how the committee root is resolved is made here and only here.
