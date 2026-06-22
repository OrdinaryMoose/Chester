# Design Brief: Token-Frugal Start Sequence & Master Plan Procedure

**Status:** Draft
**Date:** 2026-06-04
**Sprint:** 20260604-02-review-start-context

## Problem Statement

The Chester session-start sequence and the Master Plan Mode procedure are hostile to
main-window context tokens. Two surfaces drive the cost:

1. **Start sequence.** The `setup-start` session housekeeping runs at every session start.
   It carries a large block of verification logic and prose that consumes context before
   any user work begins.

2. **Master plan change log.** Each version entry in `master-plan.md` is a single 400–700
   word run-on paragraph. The status story, commit hashes, test counts, and carried-forward
   items are all braided into prose. Any grep that matches a status keyword drags the whole
   paragraph wall into context — a status check that should cost a line costs thousands of
   tokens.

Core insight: **cost = bytes × remaining-turns.** A status ledger of thin lines returns
~hundreds of bytes per query; five fat paragraphs return ~8–10k. The prose still has value
— it just shouldn't load on every status check.

## Prior Art

- `feedback_subsprint_completion_annotation` (auto-memory) — requires an inline actual-actions
  summary at sub-sprint finish. This is NOT in conflict with the proposed change: the summary
  stays, but as a bulleted inline summary, not a run-on paragraph. The paragraph form was the
  avoidable part.
- CLAUDE.md "Known gap — living-document persistence" — `master-plan.md` reaches git only via
  `finish-archive-artifacts` at sub-sprint merge; intermediate edits have no commit history.
  Adjacent concern, not the target of this sprint.

## Design Decisions

These are leanings from the opening analysis, not yet ratified. The committee will
stress-test and extend them.

### D1 — Make the change log structurally scannable and greppable by line

Replace the mega-paragraph per version with a bullet list, each bullet ≤1 sentence, one fact
per line. A status query then returns one short line, not a paragraph.

**Format rules proposed:**
- One fact per line. Bullet list under each version.
- Status on its own short line, leading token first — e.g. `S3: COMPLETE — merged off 91d8809, 4 commits`. `grep ^S[0-9]:` returns ~12 thin lines, zero prose.
- Stable line prefixes for greppable facets: `commit:`, `carry-forward:`, `pending:`, `decision:`. `grep '^carry-forward:'` pulls only those.
- Hard cap ~5 bullets per version. Detail overflow → linked file.

### D2 — Separate the ledger from the narrative

Keep a terse status ledger at the top of `master-plan.md` — the part future sessions grep.
Push the long why/how prose into a per-sub-sprint summary file under that sprint's `summary/`
dir. The master plan carries pointers, not the full execution story.

### D3 — Execution detail lives in the sub-sprint, not the master plan

A version entry that re-narrates commit hashes, test counts, and traps-avoided belongs in
`sprint-XX-.../summary/`. The master plan needs only: sprint done, base commit, link.

**Proposed shape:**

```
## Status Ledger
S0: COMPLETE  S1: COMPLETE  S2: COMPLETE  M1: COMPLETE
S3: COMPLETE (v1.7, base 91d8809) -> sprint-s3-.../summary/
S4: NEXT

## Change Log
### v1.7 (2026-06-04)
- S3 executed + merged. detail: sprint-s3-.../summary/
- carry-forward: <item> -> S4
- carry-forward: <item>
- doc-sync: <item> -> post-S4
```

## Scope

### In scope

- Restructure `master-plan.md` change-log format for greppability (the anchor question).
- Define the status-ledger / change-log split and the facet-prefix convention.
- Review the start sequence (`setup-start` housekeeping) for context cost.

### Out of scope

- **Living-document persistence gap** — _not now_: known CLAUDE.md gap, adjacent but separate.

## Constraints

- The sub-sprint-finish inline actual-actions summary must survive _(normative — source: `feedback_subsprint_completion_annotation` memory)_. It converts from paragraph to bulleted inline summary; it is not removed.
- Chester artifacts describe current state declaratively; history goes in an end-of-document change log _(normative — source: `feedback_standalone_documentation` memory)_.

## Assumptions

- **"Most master-plan reads are status checks, not narrative reads"** — UNTESTED. The whole bytes×turns argument rests on status queries dominating. If narrative reads dominate, the split saves less.
- **"Grep-by-line-prefix is how future sessions actually query the ledger"** — UNTESTED. Depends on session tooling consistently using prefix greps over full-file reads.

## Residual Risks

- Splitting prose into per-sub-sprint summary files multiplies file-hops; a session needing the full story pays more reads than one monolithic file.
- Facet-prefix discipline (`carry-forward:`, `pending:`) only pays off if every writer follows it; drift reintroduces the paragraph wall under new labels.

## Acceptance Criteria

Acceptance criteria not yet defined — to be established during the committee consultation
and any follow-on design pass. Candidate target: a status query (`grep ^S[0-9]:` or a
facet-prefix grep) returns a thin-line result set, and no single version entry exceeds the
bullet cap.
