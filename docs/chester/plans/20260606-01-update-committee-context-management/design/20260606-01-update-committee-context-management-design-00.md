# Design Brief: Team-Lead Context Bloat in the Committee Process

**Status:** Draft
**Date:** 2026-06-06
**Sprint:** 20260606-01-update-committee-context-management
**Parent:** 20260604-01-update-committee-context-management (pass 1 — introduced the consolidator role)

## Problem Statement

The committee process (`chester:design-committee`) introduced a **consolidator** role with the
explicit intent of offloading work from the **team-lead** to preserve team-lead context. In
practice the team-lead still consumes the majority of context per round — the offload is only
partial, so the intended preservation isn't happening.

A pre-design assessment identified *what is* and *is not* being offloaded:

**Offloaded and working:**
- Full per-round member transcripts. Each round the 4–5 members write long transcripts to disk;
  the consolidator reads all of them and emits an enumerate-only `consolidator-output.md`. The
  team-lead never reads the full transcripts. This offload is real.

**Not offloaded (the actual leaks):**
- **Member digests stream straight to the team-lead by protocol.** The one-round format has each
  member send the TL a digest directly. The TL receives all 4–5 digests every round regardless of
  the consolidator. Digests are not short — several have run 300–600 words. This is the dominant
  context leak, and the consolidator does nothing about it.
- **The team-lead authors every artifact** — draft-spec, draft-plan, final spec, analysis files,
  ledger updates. Inherently in-context work the consolidator role doesn't touch.
- **The team-lead synthesizes from streaming digests, often before the consolidator output
  arrives.** In practice `consolidator-output.md` lands *after* the TL has already narrated the
  round synthesis — so it functions more as a disk record than as the TL's working input, making it
  partly redundant for context-preservation purposes.

**Net:** transcript-reading is offloaded; digest-receipt, synthesis, and artifact authoring are
not. The TL remains the context bottleneck. The consolidator preserves *some* context (no
transcripts) but the bigger consumers — every digest plus all drafting — bypass the consolidator
entirely.

## Prior Art

- **`20260604-01-update-committee-context-management`** (pass 1) — introduced the consolidator role
  to offload transcript-reading from the team-lead. Achieved the transcript offload but did not
  address the digest channel or the authoring burden. This brief is pass 2.
- **`20260517-01-create-design-committee`** — original creation of the committee.
- **`20260521-02-design-architect-committee`** — committee-as-design-engine work (now archived).

## Design Decisions

No design decisions have been made. This brief captures context for the committee deliberation.

Candidate directions raised in the pre-design assessment (to be evaluated, not yet decided):

### Candidate A — Routing-only digests

Members write transcripts to disk and send the TL **routing-only** digests (one line: "position
written, path X"), not full-content digests. The TL then works solely from `consolidator-output.md`,
read once per round.

### Candidate B — Gate TL synthesis on consolidator output

The TL must not narrate/synthesize from streaming digests at all — wait for the single consolidated
artifact before synthesizing.

### Candidate C — Offload draft-artifact authoring to a scribe subagent

Move draft-spec/draft-plan authoring to a scribe subagent, leaving the TL to only adjudicate and
route.

## Scope

### In scope

- Diagnose why team-lead context still balloons despite the consolidator.
- Identify the structural fix(es) to the committee process that actually preserve TL context.

### Out of scope

Not yet defined — to be bounded during design.

## Constraints

- **Named subagents never fork / never inherit parent context** _(structural — source:
  `docs/fork-policy.md`)_. Independence of consolidator/members is by construction.
- Changes land as a skill-process update to `chester:design-committee`, not code _(structural)_.

## Assumptions

- **"Digest length (300–600 words) is the dominant leak"** — UNTESTED. Asserted in the pre-design
  assessment; committee should confirm against actual transcripts.
- **"Consolidator output reliably lands after TL synthesis"** — UNTESTED. Timing claim; depends on
  protocol ordering.

## Residual Risks

- Routing-only digests could starve the TL of signal it currently uses, degrading synthesis
  quality — trading context for adjudication accuracy.
- Gating synthesis on the consolidator serializes the round (no overlap), possibly slowing
  wall-clock per round.

## Acceptance Criteria

Acceptance criteria not yet defined — to be established during design / committee deliberation.

---

## Change Log

- 2026-06-06 — Initial brief. Captured the pre-design `/btw` assessment of team-lead context bloat
  as the starting point for the pass-2 committee deliberation.
