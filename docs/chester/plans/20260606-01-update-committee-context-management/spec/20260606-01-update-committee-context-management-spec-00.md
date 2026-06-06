# Spec: Committee Context Redesign — Artifact-Boundary Process

**Status:** Draft for review
**Date:** 2026-06-06
**Sprint:** 20260606-01-update-committee-context-management
**Source:** design-committee deliberation, rounds 01–03 (this sprint). Round records under `committee/round01`–`round03`.

---

## 1. Problem

The committee team-lead accumulates the bulk of per-round context. Measured from session JSONL (sprint 20260604-02 review-start-context): the team-lead peaked at **346,692 tokens** with two forced compactions (122,623 after a single round; 347,339 after five). On-disk committee artifacts for that session total ~130k tokens, so **~63% (~217k) of team-lead context was off-disk ephemeral work** — draft authoring, source reads, streamed member digests and revisions, consolidator output read back in.

The pass-1 consolidator (sprint 20260604-01) offloaded transcript-reading — but transcripts were already on disk and the team-lead never read them. It addressed a channel that was not the leak. The dominant channels (authoring ~50–80k; inbound member messages ~25k, running 3.4× over spec; consolidator-output drift ~5k/round) were untouched.

## 2. Design Principle

**The artifact is the boundary. The enemy is work that is both lossy and invisible.**

- Contamination (a dropped quote, a biased framing) that lands in a written file is **recoverable** — the file states what was discarded.
- The same contamination performed in-context is **unrecoverable** — it vanishes with no trace.
- Therefore every committee step must read a bounded prior artifact, write its own artifact, and **evict** before the next step. Separate agents are optional; **separate files are mandatory.**

This principle, not "move everything off the team-lead," organizes the design. A role may sit on the team-lead if and only if its output is checkpointed to an auditable file.

## 3. Roles and Ownership

The team-lead has two **fixed** functions: (1) **dispatch** the committee task, (2) **present** to the designer. These are the floor, not the ceiling. The team-lead additionally owns synthesize and converge — permitted because each writes an auditable artifact.

| Role | Owner | Rationale |
|---|---|---|
| Consolidate | dedicated consolidator agent | Contamination here is invisible/unrecoverable (a dropped quote never appears in any artifact) — must stay off the team-lead even though team-lead-reads-directly is ~3k cheaper. |
| Synthesize | team-lead | Cheapest on the team-lead when input is bounded; required for R2 (the team-lead must own the option set to defend it to the designer). Writes `alignment-map.md`, then evicts. |
| Converge | team-lead | Cheap from bounded input; convergence-as-disk-artifact makes "present" a clean read. Writes `verdict.md` before presenting, then evicts. |
| Author | dedicated scribe agent | Dominant leak (~24–47k saved per artifact off the team-lead). Fed the finished verdict; never the session thread; cannot start before convergence is complete. |

> **Note on the table.** Reproduced in prose below for the designer-facing reading (per house style, prose is normative):
> Consolidation is owned by a dedicated agent because its failure mode is invisible. Synthesis and convergence are owned by the team-lead because their failure mode is auditable and because the team-lead must be able to defend the option set it presents. Authoring is owned by a dedicated scribe because it is the largest single context cost and is safely offloadable once the verdict is complete.

Unchanged supporting roles: **researcher** (facts only, on demand), **designer** (adjudicates, owns termination).

## 4. Two Modes (designer directive at dispatch)

- **one-round** (default, single-pass): members write final positions; cross-pollinate pairwise via capped peer DM; the team-lead synthesizes and converges. No aggregate feedback to members. Ruthless on context; relies on peer DM for cross-pollination.
- **two-round** (Delphi escalation, opt-in): after the team-lead writes `alignment-map.md`, the aggregate is fed back to members; each member gets **one** revision pass in light of the aggregate; the round re-consolidates, then converges. Better-calibrated convergence at the cost of a second member cycle plus a second consolidate. The dispatcher selects this for high-stakes questions where convergence quality outweighs cost.

The mode is named in the convening message. one-round is assumed when unspecified.

## 5. Per-Round Flow

1. **Dispatch** — team-lead sends the question + mode to members (caveman ultra).
2. **Members work** — each writes its full reasoning to `committee/roundNN/<member>-transcript.md`, ending with a mandatory `## Final Position` section (see §6, constraints 5 & 6).
3. **Members signal** — each sends the team-lead a **typed routing signal only** (no prose); peer DM is member-to-member, capped.
4. **Consolidate** — consolidator reads only each transcript's `## Final Position` section (last section), copies the fields **verbatim**, writes `consolidator-output.md` (enumerate-only, bounded by bounded input).
5. **Synthesize** — team-lead reads `consolidator-output.md`, writes `alignment-map.md` (alignment pattern + option set + discarded-with-reason), then evicts.
   - *two-round only:* alignment map is fed back to members; each revises once; return to step 4 for a second consolidate.
6. **Converge** — team-lead reads `alignment-map.md`, writes `verdict.md` (a specific, one-sentence-minimum decision; ambiguous verdicts cannot proceed), then evicts.
7. **Author** — scribe is dispatched with `verdict.md` + annotated template + `consolidator-output.md` (+ prior artifact version if revising); writes the draft artifact; returns a pointer only.
8. **Present** — team-lead reads the artifact once (the read IS the review; the mandatory `Dissent Record` section is therefore guaranteed to be seen) and presents the decision packet to the designer.

Each step's dispatch carries the prior step's artifact path as a **required input field** (constraint 12) — the checkpoint is observable by inspection.

## 6. Spec Requirements (the twelve cross-design constraints)

1. Consolidate is owned by a dedicated off-team-lead consolidator — not team-lead-reads-transcripts.
2. The consolidator reads only the member's `## Final Position` section (200-word cap), never full transcripts.
3. The consolidator copies member-authored fields **verbatim** — no summarizing, no selection.
4. Consolidator output is enumerate-only and bounded by its bounded input (not by instruction alone) — eliminating the prior 5–7× drift.
5. The member `## Final Position` section is mandatory, exact-header, **last section** of the transcript, 200-word cap, schema `{position, rationale, blocking_risk}`, all fields member-authored.
6. `blocking_risk` is the member's own articulation (~20 words, member framing — not a category label, not a paraphrase) of the hardest objection to the non-chosen options. This is the field that gives R4 (retain meaning) teeth.
7. Synthesize and converge may co-locate on the team-lead because their contamination is auditable (written artifacts state what was discarded); consolidate may not.
8. The team-lead writes `alignment-map.md` to disk before convergence begins (audit record; evicted after write).
9. The team-lead writes `verdict.md` (specific, one-sentence-minimum) before dispatching the scribe; ambiguous verdicts cannot proceed.
10. The scribe receives annotated template + `verdict.md` + `consolidator-output.md` (+ prior artifact if revising) — never raw transcripts or the session thread.
11. The handoff artifact template contains a mandatory named `Dissent Record` section (header, not advisory prose).
12. A disk-artifact checkpoint is enforced between every step — each dispatch carries the prior artifact path as a required input field.

## 7. Channel Formats

- **member → team-lead:** typed routing signal, schema fields are the entire message body, no free text. Fields: `{member, status, round, transcript}`. Malformed signals (any field outside the schema) are **rejected unread** with one correction prompt.
- **member ↔ member (peer DM):** capped exchange, schema `[sender]→[target]: [one sentence] / [target]: [one sentence]`, max 2 exchanges per pair.
- **role → role (pipeline):** file path only; the receiving step reads the file.
- **team-lead → designer:** the decision packet (existing partner-role voice + info-packet overlay).

## 8. Acceptance Criteria

- A four-round committee session keeps team-lead context within roughly **37–49k tokens** (vs ~297k measured), against a fixed ~35–50k system-prompt baseline that no redesign can reduce.
- No member content (prose) reaches team-lead context except via the bounded artifacts in the pipeline.
- Every per-round artifact (`consolidator-output.md`, `alignment-map.md`, `verdict.md`, draft) exists on disk before the next step begins; absence blocks the next dispatch.
- The consolidator output stays enumerate-only across all rounds (no recurrence of the 5–7× drift) — verifiable because its input is the capped `## Final Position` section.
- Dissent reaches the designer in every session where members split (guaranteed by the mandatory `Dissent Record` section the team-lead reads while presenting).

## 9. Implementation Surface (skill files affected)

At spec altitude — the plan maps the detail:

- `skills/design-committee/SKILL.md` — per-round flow reorder; mode selection (one-round / two-round); scribe + verdict steps; checkpoint enforcement.
- `skills/design-committee/references/team-lead.md` — team-lead owns synthesize (alignment-map) + converge (verdict) with write-evict; rejection-by-default for malformed signals; present-reads-artifact.
- `skills/design-committee/references/member-protocol.md` — mandatory `## Final Position` section (location, schema, caps); typed routing-signal schema; capped peer-DM schema.
- `agents/design-committee-consolidator.md` — read-scoping (Final Position only), verbatim copy, enumerate-only.
- New: `agents/design-committee-scribe.md` — authoring agent fed verdict + annotated template; never the session thread.
- Annotated handoff/artifact template (with `Dissent Record`) — location per artifact-schema.

## 10. Open / Deferred

- None blocking. The alignment-map-feedback question is resolved by the one-round / two-round mode split (§4).

---

## Change Log

- 2026-06-06 — Initial spec. Captures the design-committee rounds 01–03 converged design (4-0 on role ownership; 12 cross-design constraints) plus the designer's one-round/two-round mode decision. Diagnosis evidence (347k peak, ~63% off-disk) verified from session JSONL in round 01.
