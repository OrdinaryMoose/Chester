# Feature Definition Brief: Extend Answer-Delivery into Committee Members, Scribe, and Split-Question Layout

**Status:** Draft
**Date:** 2026-06-10
**Parent:** sprint `20260609-01-realign-committee-answer` (answer-delivery realignment, team-lead-only)

---

## Problem Statement

The answer-delivery realignment (sprint `20260609-01-realign-committee-answer`, merged) flipped the committee's terminal object from a **decision menu** to the **most-informative answer** — converged, preserved-split, or partial — with named gaps and a team-lead authority guard that warrants every answer-body assertion. That sprint deliberately landed the change in **team-lead-owned files only** (`team-lead.md` v0010, `SKILL.md` v0020, `committee-analysis-round-format.md` v0001). The member agents, the Scribe contract, and the concrete designer-facing layouts were held out of scope by construction.

The result is a realignment that is **correct but shallow**: the team-lead now thinks in answers and warrants, but the agents that feed it and the agent that renders its output still operate under the old decision-menu framing. Three seams remain where the new doctrine has no counterpart downstream:

1. **Members still write advocacy positions, not warranted answer-contributions.** The four advocacy members produce a `## Final Position` framed as "the position I defend." The team-lead must now retro-fit a warrant onto each contribution at synthesis time, because the members did not supply one. The warrant test runs entirely on the team-lead's side of the wall, working from un-warranted inputs.
2. **The Scribe renders one surface, but the doctrine now names two.** The realignment introduced the **output-surface split**: a locked decision-communication packet (used only when seeking a decision) vs. an unformatted end-of-turn session artifact (whatever the answer needs). The Scribe still authors only the decision-packet. Nothing owns the session-artifact surface; the team-lead improvises it.
3. **P2 ("pose the pointed question each side raises") has a principle but no layout.** `team-lead.md` states that a preserved split should surface each side's pointed question, pre-answered where possible, one at a time. The concrete packet layout for a both-sides question was deferred — so the principle currently lands as freeform prose at the team-lead's discretion, with no template the Scribe can fill.

A fourth, smaller seam: the **threshold wave-off** (designer waves a below-threshold gap; team-lead records a threshold calibration) is named as a designer response in the loop, but its designer-facing wording and ledger record shape were left to implementation.

### Prior attempts

This is the first attempt to extend answer-delivery past the team-lead. The parent sprint did not fail to reach the members and Scribe — it explicitly scoped them out (spec-02 Non-Goals) to keep the change surface minimal and the locked format provably preserved. This brief is the planned continuation, not a remediation.

---

## Current State Inventory

The change surface for this work is the agents and contracts the parent sprint left untouched.

### Member agents (the four advocacy lenses)

- `agents/design-committee-conservator.md`, `agents/design-committee-innovator.md`, `agents/design-committee-pragmatist.md`, `agents/design-committee-purist.md` — each loads as one member's system prompt on dispatch. Each writes a transcript ending in a `## Final Position` (advocacy framing: the position defended, the gating fact, what it sacrifices). None currently emits a warrant for its contribution.
- `agents/design-committee-researcher.md` — serves facts on demand; holds no design opinion; already supplies evidence (file:line/source) — the one member whose output is natively warrant-shaped.

### Contracts

- `skills/design-committee/references/member-protocol.md` — single authority for the `## Final Position` schema, routing-signal discipline, write-then-send sequencing, committee-root resolution. The Final Position schema is where a member-side warrant field would live. **Byte-unchanged by the parent sprint (rigid contract C-RIGID).**
- `skills/design-committee/references/artifact-template.md` — the Scribe's artifact structure (Summary / Verdict / Rationale / Dissent Record / Deferred-Open). This is the decision-packet template; it has no session-artifact counterpart. **Byte-unchanged (deferred).**

### Authoring agent

- `agents/design-committee-scribe.md` — ephemeral per-round dispatch; authors the designer-facing decision-packet from the verdict, alignment-map, and consolidator-output, following `artifact-template.md`. Knows only the decision-packet surface. **Byte-unchanged (deferred).**

### Already-realigned (the upstream the members/scribe must now align to)

- `skills/design-committee/references/team-lead.md` (v0010) — owns the P1 answer-shape doctrine, the Authority Guard (warrant test / count-not-a-warrant / C2 firewall / C1 audit / warrants-on-disk), the **Output Surfaces** subsection, and P2 in Split adjudication.
- `skills/design-committee/references/committee-analysis-round-format.md` (v0001) — `alignment-map.md` / `verdict.md` templates now carry an answer-shape marker and a warrant record.
- `skills/design-committee/SKILL.md` (v0020) — interview-to-resolution framing; output-surface split carried into the Author step.

---

## Governing Constraints

- **The team-lead-side realignment is settled and must not regress.** This work aligns the members and Scribe *to* the v0010 doctrine; it does not re-open the answer-shape rule, the Authority Guard, or the Output Surfaces definition.
- **The locked decision-communication packet format stays locked.** The four-block Information Packet Format and Style Exemplar in `team-lead.md` §Visible Surface are frozen. A both-sides-of-a-split layout (seam 3) must be *added* as a sub-shape, not a reshape of the four blocks.
- **C-RIGID still applies to mechanics.** The round-folder discipline, the Consolidator enumerate-only contract, the routing-signal schema, and the `ledger.md` cross-round model are mechanical contracts. A member-side warrant field extends the Final Position *content* schema; it must not change routing-signal mechanics or the Consolidator's enumerate-only boundary.
- **Voice invariants survive.** Translation Gate, C1, C2, option-naming, and the PM litmus apply to every new designer-facing surface (the session artifact, the both-sides layout, the wave-off wording). `util-design-partner-role` is not edited.
- **C-NAMING.** The term `output-surface split` is established; the two surfaces are the *decision-communication packet* and the *end-of-turn session artifact*. New work uses these terms; no new synonyms, and no collision with the "two-surface" usage in sprint `20260521-02-design-architect-committee`.
- **Standalone invocability and disk-as-handoff are preserved.** Any new artifact (e.g. a session-artifact template) must ride existing round-folder mechanics or justify a new file the way the parent sprint justified *not* adding one.

---

## Design Direction

Four threads, separable into their own sub-sprints. Listed in dependency order — thread A feeds the warrant machinery the others assume.

### Thread A — Member-side warrant contribution

Extend the `## Final Position` schema (in `member-protocol.md`) so each advocacy member supplies the **warrant** for its own load-bearing claim — evidence, logic, or an explicit appeal to a designer premise — rather than leaving the team-lead to retro-fit one. The member already knows its gating fact; naming the warrant type costs little and moves the warrant test's raw material to the source. The team-lead's Authority Guard becomes a *verification* pass over member-supplied warrants instead of an *origination* pass. The advocacy agent files gain one instruction each; the researcher (already warrant-shaped) is the model.

### Thread B — Session-artifact surface ownership

Give the **end-of-turn session artifact** an owner and a (non-mandated) shape. Two candidate structures: (1) extend the Scribe to author both surfaces — decision-packet when seeking a decision, session artifact otherwise — selecting by the team-lead's `answer-shape` marker; or (2) keep the Scribe decision-packet-only and let the team-lead own the session artifact directly. The output-surface split says the session artifact has *no mandated format*, so this thread defines *who renders it and from what*, not a rigid template. This is the "Scribe contract division" the parent sprint deferred.

### Thread C — Both-sides-of-a-split question layout

Draw the concrete packet sub-shape for P2: when a split is preserved and a designer value-judgment is needed, render **each side's pointed question against the other**, pre-answered where the committee can, surfaced one at a time. This is a new sub-block *within* the locked Decision Package (added around the frozen four blocks, like the parent sprint's Output Surfaces addition), plus the matching field in `artifact-template.md` so the Scribe can fill it.

### Thread D — Threshold wave-off wording and ledger record

Specify the designer-facing wording for a wave-off ("this gap is below your threshold — confirm I should drop it") and the `ledger.md` threshold-calibration record shape, so a waved gap leaves an auditable calibration trail the next round can read.

---

## Open Concerns

- **Scribe-authors-both vs. team-lead-owns-session-artifact (Thread B) is the load-bearing decision.** It determines whether the Scribe contract genuinely divides or merely gains a second mode. The parent sprint rejected a structural-enforcement architecture that would have edited the Scribe; this thread must not silently revive it. Likely a committee consultation in its own right.
- **Member-warrant schema depth (Thread A).** A free-text warrant line is cheap but unverifiable; a typed warrant (evidence | logic | designer-premise + source) is checkable but adds schema rigidity to a contract marked C-RIGID. Where is the line between "content extension" (allowed) and "mechanics change" (forbidden)?
- **Sequencing.** Threads A–D are separable, but A (member warrants) changes the inputs B and C consume. Run A first, or stub member warrants and run the surface work in parallel? A master-plan overlay (cluster sub-sprints) may fit better than four independent top-level sprints.
- **Does Thread C belong inside the locked packet at all?** P2's both-sides question is conceptually a decision-seeking move, so the Decision Package is its natural home — but if it grows large it may argue for its own surface. Resolve before drawing the layout.

---

## Acceptance Criteria

- Each advocacy member's `## Final Position` carries a warrant for its load-bearing claim; the team-lead's warrant test verifies member-supplied warrants rather than originating them (Thread A).
- The end-of-turn session artifact has a named owner and a defined derivation, distinct from the locked decision-communication packet, without mandating a rigid format (Thread B).
- A both-sides-of-a-split question sub-shape exists in both `team-lead.md` §Visible Surface and `artifact-template.md`, added around the frozen four-block format, never reshaping it (Thread C).
- A threshold wave-off has defined designer-facing wording and leaves a threshold-calibration record in `ledger.md` (Thread D).
- The team-lead-side v0010 doctrine, the locked packet format, and all C-RIGID mechanics are unchanged by this work.
- Voice invariants (Translation Gate, C1, C2, PM litmus) hold on every new designer-facing surface; `util-design-partner-role` is not edited.
