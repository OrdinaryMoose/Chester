# Proof MCP Element Relationships

**Sprint:** sprint-d-2
**Captured:** 2026-05-09 (round 25 design-conversation side-track)
**Context:** The designer probed how proof MCP elements relate to each other after the round-21 withdrawal bundle landed. This document captures the structural picture and the presentation-layer implications surfaced for d-2 before the conversation resumes the modification queue.

---

## Two Vertical Lanes

The proof body splits into two structural lanes that do not cross. The Resolve Condition lane answers "what counts as resolution"; the Necessary Condition lane answers "what must be true for the design to hold." They share no structural edges.

```
                  ┌──────────────────────┐
                  │  Problem Statement   │
                  └──────────┬───────────┘
                             │
                       anchors│
                             ▼
                  ┌──────────────────────┐
                  │       Concern        │
                  └──────────┬───────────┘
                             │
                    problem_anchor
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Resolve Condition   │   ── what counts
                  │  (coverage crit.)    │      as resolution
                  └──────────────────────┘

  ════════════════════ separate lane ════════════════════

   ┌──────────┐    ┌──────────┐    ┌──────────────┐
   │ Evidence │    │   Rule   │◄───┤  Permission  │
   └─────┬────┘    └─────┬────┘    └──────────────┘
         │               │            relieves
         │  grounding[]  │
         └───────┬───────┘
                 ▼
        ┌──────────────────────┐
        │ Necessary Condition  │   ── what must be true
        │  (design req.)       │      for design to hold
        └──────────┬───────────┘
                   │
                   │ basis[]
                   ▼
        ┌──────────────────────┐
        │        Risk          │
        └──────────────────────┘

  ═════════════════ crosses both lanes ═════════════════

        ┌──────────────────────┐
        │       Friction       │── anchor_a ─► any element
        │                      │── anchor_b ─► any element
        └──────────────────────┘

  ═══════════════════ standalone lane ═══════════════════

        ┌──────────────────────┐
        │     Definition       │  (vocabulary, no
        │                      │   outbound pointers)
        └──────────────────────┘
```

---

## Lane Composition

### Lane one — Resolve Condition lane (the "what counts as done" lane)

- **Problem Statement** — root of the lane, single per proof.
- **Concern** — anchored to the Problem Statement; represents a question or worry the designer wants resolved.
- **Resolve Condition** — anchored to a Concern via `problem_anchor`; certifies what observable state counts as resolution.

The lane is deliberately thin. Resolve Conditions don't ground in evidence, don't cite rules or permissions, and don't link to design requirements. They certify the design-space exit condition without limiting the design space (master-plan-locked attribute: "non-restrictive").

### Lane two — Necessary Condition lane (the "what must be true" lane)

- **Evidence** — codebase-sourced facts; no outbound structural pointers.
- **Rule** — designer-sourced restrictions; no outbound structural pointers.
- **Permission** — designer-sourced relief from a Rule; cites a Rule via `relieves`.
- **Necessary Condition (NC)** — design requirement; cites Evidence/Rules/Permissions via `grounding[]`; carries `collapse_test`, `reasoning_chain`, and optional `rejected_alternatives`.
- **Risk** — hazard attached to one or more NCs via `basis[]`.

The NC lane carries the proof's analytical weight — every NC has a chain of grounding back to facts or designer authority, plus a collapse test naming what breaks if the NC is removed.

### Cross-lane element

- **Friction** — anchored to any two elements via `anchor_a` and `anchor_b`; surfaces tensions that span lanes.

### Standalone lane

- **Definition** — vocabulary anchor; no outbound structural pointers; exists so other elements can name the canonical term in prose.

---

## Per-Element Pointer Surface

- **Problem Statement.** Outbound: none. Inbound: Concerns anchor here.
- **Concern.** Outbound: Problem Statement (anchor). Inbound: Resolve Conditions point here via `problem_anchor`.
- **Resolve Condition.** Outbound: Concern (`problem_anchor`). Inbound: none today.
- **Evidence.** Outbound: none. Inbound: NCs cite via `grounding`.
- **Rule.** Outbound: none. Inbound: NCs cite via `grounding`; Permissions cite via `relieves`.
- **Permission.** Outbound: Rule (`relieves`). Inbound: NCs may cite via `grounding`.
- **Necessary Condition.** Outbound: Evidence/Rule/Permission (`grounding[]`). Inbound: Risks cite via `basis`.
- **Risk.** Outbound: NCs (`basis[]`). Inbound: none today.
- **Friction.** Outbound: any two elements (`anchor_a`, `anchor_b`). Inbound: none.
- **Definition.** Outbound: none. Inbound: none structural.

---

## Three Designer Yes/No Probes (and Why)

- **Does a Resolve Condition relate structurally to Necessary Conditions?** No. They sit in disjoint lanes; no pointer type connects them today.
- **Does a Resolve Condition answer a Necessary Condition?** No. RCs answer Concerns; NCs constrain the design. They operate at different altitudes.
- **Does a Resolve Condition relate structurally to Evidence?** No. RCs have one outbound pointer (their Concern) and don't reference Evidence directly.

These three "no" answers all reduce to the same fact: the RC lane is one edge wide. Its only structural relationship is to its anchor Concern.

---

## What Does a Resolve Condition Depend On

- **Structurally:** exactly one outbound dependency — the Concern it covers.
- **Functionally:** the concern being well-formed, plus designer ratification.

Nothing else. The lane is thin by design.

---

## The Resolve-Condition Ratification Package — Presentation-Layer Implication

When the presentation layer renders a Resolve Condition for ratification, the package should be the structurally-related elements grouped together — not a composed analysis or an inferred cluster.

- **Today:** the package contains the Resolve Condition plus its anchor Concern. Two elements.
- **As pointer types are added** to the proof body (e.g., a hypothetical "supports_rc" pointer on Necessary Conditions, or concern-scope tags on Rules), the package widens automatically because the renderer follows whatever pointers exist at render time.
- **No analysis layer.** The renderer reads structural relationships; the cluster definition lives in the proof body's pointer surface, not in the renderer.

### Candidate Design Requirement (not yet added to proof body)

> The presentation layer renders a coverage criterion grouped with the elements structurally related to it. The package contents are read from the proof body's structural relationships at render time, not by agent analysis or designer enumeration.

This commits the presentation layer to follow pointers. As pointer types accrue, the package widens without re-engineering the renderer.

---

## Structural Sufficiency vs Gate Behavior

A proof with only the Resolve Condition lane populated — Problem Statement, Concerns, and ratified Resolve Conditions covering every Concern — is **structurally complete**. The lane stands on its own; no Necessary Conditions are required for the resolve-condition lane to be internally coherent.

The current closing-argument trigger gate requires:
- At least one Necessary Condition with `rejected_alternatives`,
- All Necessary Conditions carrying a `collapse_test`,
- Grounding coverage ≥ 0.9 across NCs,
- Plus the RC- and Concern-side requirements (ratified RCs, covered Concerns, etc.).

So with today's gate logic, the proof system refuses to fire the closing-argument trigger on an all-RC proof. That's a gate-level constraint, not a structural requirement of the proof shape itself.

### Open Question for the Proof Body

Whether all-RC proofs should be allowed to close — or whether at least one Necessary Condition is structurally mandatory — is a designer-ratifiable rule, not a hard-coded gate behavior. Worth surfacing as a candidate rule rather than leaving as implicit gate logic.

---

## Implications Surfaced for d-2

- **Presentation-layer commitment.** The Resolve-Condition ratification view should follow structural pointers, not compose clusters. Candidate design requirement above.
- **Closing-argument render shape.** The closing-argument tool today produces a flat-by-type envelope. If the ratification practice operates per-concern (vertical slices), the closing argument's render shape probably wants vertical slicing too, so the two views compose cleanly. Candidate friction observation against the existing closing-argument tool.
- **Gate logic vs designer-ratified rule.** The "at least one NC required" behavior is currently hard-coded in the trigger gate. If the designer wants to lock that behavior, it deserves to be a named rule in the proof body; if the designer wants to soften it, the gate logic needs revisiting.

---

*Captured as a clarifying side-track during sprint-d-2 round 25, before resuming the modification queue.*
