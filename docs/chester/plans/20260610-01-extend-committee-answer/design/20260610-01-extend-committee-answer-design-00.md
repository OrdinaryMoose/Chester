# Design Brief — Extend Committee Members to Warranted Answer-Contribution (Thread A)

**Status:** Approved (designer-settled)
**Date:** 2026-06-10
**Sprint:** 20260610-01-extend-committee-answer
**Parent:** feature brief `docs/feature-definition/Pending/design-committee-answer-delivery-extension-00.md` (Thread A); continuation of sprint `20260609-01-realign-committee-answer` (team-lead answer-delivery realignment, committee v0020 / team-lead v0010)
**Source:** design-committee consultation, round01 (4-0 converged core + 3-1 placement split); designer resolved the split to Option 1 and parked round02.

---

## Goal

Migrate the four advocacy committee members from a pure **advocacy** stance ("the position I defend") to a **warranted answer-contribution** stance: each member supplies, alongside its position, the **ground** under its load-bearing claim — typed and sourced — so the team-lead's Authority Guard becomes a *verification* pass over member-supplied warrants rather than an *origination* pass that retro-fits a warrant onto un-warranted member input.

This is the member half of the answer-delivery realignment. The parent sprint flipped the team-lead's terminal object from a decision menu to the most-informative answer and built an Authority Guard that warrants every answer-body assertion — but it deliberately landed in team-lead-owned files only. Today the warrant test runs entirely on the team-lead's side of the wall, working from member inputs that carry no warrant. The team-lead must *invent* the ground for each member claim; a plausible-but-wrong reconstruction is not caught until the designer pushes back. Moving warrant origination to the member who holds the gating fact closes that gap at its source.

## Prior Art

- **Sprint `20260609-01-realign-committee-answer` (merged).** Realigned the team-lead to answer-delivery: P1 answer-shape doctrine (converged / preserved-split / partial), the Authority Guard (warrant test, count-is-not-a-warrant, C2 firewall, C1 audit, warrants-on-disk), strict premise scope, the above-threshold gap trichotomy, and the output-surface split. Landed in `team-lead.md` (v0010), `SKILL.md` (v0020), `committee-analysis-round-format.md` (v0001). Explicitly scoped member agents, the Scribe, and concrete layouts OUT (spec-02 Non-Goals). This brief is the planned continuation, not a remediation.
- **Feature brief Thread A.** Names the gap precisely: members feed un-warranted inputs; the warrant test runs lead-side only. Identifies the Final Position content schema as where a member-side warrant would live, and flags the schema-depth open concern (free-text cheap-but-unverifiable vs. typed checkable-but-rigid).
- **The researcher agent is the existing model.** `agents/design-committee-researcher.md` is already warrant-shaped: it emits facts with file:line / source citations, so its output is natively grounded. The four advocacy members should follow the same evidence discipline applied to their own load-bearing claim.
- **Authority preserved by splitting value from inference (carried from the parent sprint).** The committee converges on logic-given-the-designer's-values, never on value. A member warrant is inference-side, not value-side; supplying it does not let a member seize authority the designer holds.

## Design Decisions

### D1 — Member stance is *warranted advocacy*, not synthesis

Members keep the advocate role and the four-lens friction that surfaces genuine splits. A member writes its position plus the ground under its load-bearing claim; it does **not** anticipate or pre-assemble the team-lead's synthesis. "Answer-contribution" means *a warranted position the lead can verify and incorporate* — not *a member's guess at how its position serves the final answer*.

**Rejected alternative:** retire advocacy framing and rewrite members as answer-component emitters (Innovator's Option B). Rejected because it re-grounds lens distinctiveness without advocacy and risks flattening the cross-examination friction that makes four lenses worth their overhead; a member also cannot know what the lead will converge on before the round completes, so anticipating the synthesis is role-bleed into the lead's job.

### D2 — The warrant lives in a discrete, dedicated field (Option 1)

The member's stated ground occupies its own labeled field inside the Final Position content schema — not folded into the existing `rationale` prose.

**Rejected alternative:** extend the `rationale` instruction to require the ground be named inline, adding no new field (Conservator's position). Rejected by the designer on the verifiability/enumerability warrant: a discrete field gives the Consolidator a distinct slice to enumerate and the team-lead's Authority Guard a clean structural slot to verify, where an inline-in-prose warrant pushes the check back toward a prose re-read — the very failure mode this thread fixes. (Conservator's caution is preserved as dissent; see Dissent Record.)

### D3 — The warrant is typed and sourced

The warrant field carries two parts:
- **type** — one of `evidence` | `logic` | `in-scope designer-premise`, and
- **source** — the citation (for evidence), the inference step (for logic), or the designer statement that granted the premise (for designer-premise).

This was 4-0 across the committee: even the placement-minority required a typed warrant with a source. A typed+sourced warrant is what makes the lead's check structural ("is this evidence-backed? is the cited source in scope? was this premise granted for this scope?") rather than reading-comprehension. A member that discovers at write-time it has no clean source for its load-bearing claim has surfaced the warrant test working correctly — that is a feature.

### D4 — The team-lead's Authority Guard shifts origination → verification

`team-lead.md` v0010's warrant test changes from "originate a warrant for each member claim" to "verify the member-supplied warrant." The wording in the Authority Guard and the relevant self-eval / consolidation passages is updated to reflect that warrants arrive with the member input. The doctrine itself (what counts as a warrant; count-is-not-a-warrant; C1/C2; strict premise scope) is unchanged.

### D5 — Content extension only; mechanics stay frozen

The new field extends the Final Position **content** schema. It does **not** touch the routing-signal schema, the Consolidator's enumerate-only boundary, the round-folder discipline, or write-then-send sequencing. The brief fixes the content-vs-mechanics line in writing so the addition is unambiguously on the permitted side: `member-protocol.md` § Final Position is the content surface that may be extended; the routing/consolidation/round mechanics are the frozen surface.

## Scope

### In scope

- **`skills/design-committee/references/member-protocol.md` § Final Position** — add the typed+sourced warrant field to the schema (fields become `{position, rationale, blocking_risk, warrant}` or equivalent placement inside the section), with an explicit content-vs-mechanics boundary note. This is the single authority for the Final Position schema; it changes here and only here.
- **The four advocacy agent files** — `agents/design-committee-{conservator,innovator,pragmatist,purist}.md` — each gains one instruction: your Final Position must supply the warrant (type + source) for your load-bearing claim. The researcher agent is the model; the researcher file itself needs no change.
- **`skills/design-committee/references/team-lead.md`** — reword the Authority Guard warrant test (and any mirroring self-eval / consolidation line) from *originate* to *verify member-supplied warrant*. No doctrine change.
- Version bumps on every file whose behavior/contract changes, per repo convention.

### Out of scope

- **Thread B (session-artifact owner)** — _not yet_: the load-bearing Scribe-vs-team-lead ownership call is a separate consultation; this sprint does not touch it.
- **Thread C (both-sides-of-a-split layout)** — _not yet_: the concrete packet sub-shape for P2 is undrawn and depends on no part of Thread A.
- **Thread D (threshold wave-off wording + ledger record)** — _not yet_: independent of the member contract.
- **The locked decision-communication packet** — _not needed_: unchanged; this work is upstream of it.
- **Consolidator behavior** — _not needed_: it already reads the whole `## Final Position`; one more field is within its existing enumerate-only contract and needs no contract change (a generated summary line is behavior, not contract).

## Constraints

- **C-RIGID mechanics stay frozen** _(structural)_ — routing-signal schema, Consolidator enumerate-only boundary, round-folder discipline, write-then-send sequencing are not modified. The warrant is a content extension to the Final Position section, not a mechanics change.
- **The team-lead-side v0010 doctrine must not regress** _(normative — source: parent sprint)_ — the answer-shape rule, the Authority Guard's definition of a warrant, count-is-not-a-warrant, C1/C2, and strict premise scope are unchanged; only the origination→verification framing moves.
- **The 200-word Final Position cap and member-authored rule hold** _(structural)_ — the warrant field is written by the member, within the existing section cap.
- **Voice invariants survive** _(normative — source: `util-design-partner-role`)_ — Translation Gate, C1, C2, option-naming, PM litmus apply to every designer-facing surface; `util-design-partner-role` is not edited. (Transcripts and the Final Position are internal records; code vocab is allowed there.)
- **The value/inference split is not reopened** _(normative — source: parent sprint)_ — a member warrant is inference-side; it does not let a member converge on value.

## Assumptions

- **"The Consolidator needs no contract edit to enumerate one more field"** — UNTESTED against the Consolidator agent's exact wording; if the Consolidator's instruction hard-codes the three legacy fields, a one-line update (still enumerate-only) is required. Verify at plan time.
- **"Each advocacy member already holds its gating fact"** — TESTED by round01: every member's reasoning already keys on a gating fact; the change makes it explicit, it does not ask members to manufacture grounds they lack.

## Residual Risks

- **Schema-surface widening on a single-authority frozen-boundary contract** (Conservator's preserved caution). A fourth field on the Final Position schema *reads as* touching frozen machinery even though it is legally a content extension. Mitigation: the explicit content-vs-mechanics boundary note in `member-protocol.md` (D5). Accepted cost for a structurally-checkable Authority Guard.
- **Warrant mis-typing.** A member may pick the wrong type or hedge when its ground does not cleanly fit one of the three. Mitigation: the team-lead's verification pass surfaces mis-typing; a no-clean-source discovery is the warrant test working, not a defect to prevent.

## Acceptance Criteria

- Each advocacy member's `## Final Position` carries a warrant — a type (`evidence` | `logic` | `in-scope designer-premise`) plus a source — for its load-bearing claim.
- The team-lead's warrant test verifies member-supplied warrants rather than originating them; `team-lead.md` wording reflects this.
- The warrant field lives in a dedicated, labeled place in the Final Position content schema (not folded into `rationale`).
- The routing-signal schema, the Consolidator enumerate-only boundary, round-folder discipline, and write-then-send sequencing are byte-unchanged.
- The v0010 team-lead doctrine, the locked decision-communication packet, and `util-design-partner-role` are unchanged.
- `member-protocol.md` states the content-vs-mechanics boundary so the addition is unambiguously a content extension.

## Dissent Record

**Alignment:** round01 was 4-0 on substance (warranted advocacy; typed+sourced warrant; verify-not-originate; no role-bleed; content-not-mechanics) and 3-1 on placement only.

**Preserved dissent — Conservator:** folding the typed warrant into the existing `rationale` instruction (no new field) over a discrete field — blocking risk (verbatim): *"A typed `warrant` field would be mechanically checkable and enable future structural verification — extending `rationale` prose cannot enforce warrant presence at schema level, so a member could satisfy the letter of the instruction with a vague rationale that still leaves the team-lead doing origination rather than verification."* (Note: Conservator's stated risk argues *for* the discrete field's checkability; its *position* was that the checkability is not worth widening a frozen-boundary schema.) The designer resolved to the discrete field (Option 1) and accepted the surface-widening cost, neutralizing the frozen-machinery worry with the explicit content-vs-mechanics boundary in D5.

## Open Threads (carried, not in this sprint)

- **Thread B** — who owns the end-of-turn session artifact (Scribe-authors-both vs. team-lead-owns); the feature brief flags this as a consultation in its own right.
- **Thread C** — the concrete both-sides-of-a-split question layout for P2.
- **Thread D** — threshold wave-off designer-facing wording + ledger calibration record.
- **Sequencing** — Threads A–D may run as a master plan with cluster sub-sprints or as independent sprints; A (this brief) is the dependency root the surface threads consume.

---

## Change Log

- 2026-06-10 — created from design-committee round01 (settled) + designer Option-1 ruling; round02 parked.
