---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [03-architecture, 05-domain-spec, 00-glossary]
related_adrs: [0007, 0010]
supersedes: 0010
---

# ADR-0011: Lane membership as derived predicate

## Status

Accepted. Supersedes ADR-0010.

## Context

ADR-0010 deferred the question of whether Propositions should carry a `concerns_addressed[]` pointer naming the Concerns whose lanes they participate in. The argument in favor was that per-lane rendering, per-lane closure granularity, and authoring clarity all benefit from making lane membership first-class structural data rather than a transitive derivation.

Two developments resolve the deferral.

**First, the forward-solve paradigm (ADR-0007).** With Datalog as the substrate, lane membership is computable from the existing pointer graph by a two-clause recursive rule:

```
in_lane(PropId, ConcernId) :-
  addresses(ResoId, ConcernId, _),
  proposition_grounds(ResoId, PropId).
in_lane(PropId, ConcernId) :-
  proposition_grounds(Prop2, PropId),
  in_lane(Prop2, ConcernId).
```

The first clause covers Propositions that ground a Resolution directly; the second walks the transitive grounding chain. Multi-lane Propositions (a Proposition that grounds Resolutions anchored to multiple Concerns) appear naturally — the rule produces one `in_lane` fact per Concern the Proposition transitively serves. The Datalog evaluator computes the predicate at every fixed point; the result is always consistent with the current pointer state.

**Second, the synchronization risk ADR-0010 named is real.** With a `concerns_addressed[]` pointer plus the transitive Resolution→Proposition path, two independent sources of truth exist for the Proposition-to-Concern relationship. If an Agent asserts `concerns_addressed: [cern_2]` and later the only Resolution grounding in the Proposition anchors `cern_3`, the integrity policy must adjudicate. Any resolution policy is either arbitrary (pick one source by precedence) or rejective (refuse the mutation). Both add complexity that the derived approach avoids entirely.

The architectural payoff of "first-class lane membership" turns out to be cheaper as a derived predicate than as a schema field: the per-lane render mode (`renderLaneSlice`) becomes a normal query against `in_lane`, per-lane closure status becomes a derived predicate (`lane_closed(ConcernId)`), and the closing-argument trigger can gate on per-lane convergence without schema extension.

## Decision

**Lane membership is a derived predicate, not an asserted field.** No `concerns_addressed[]` field is added to the Proposition schema. The Domain defines `in_lane(Proposition, Concern)` as a two-clause Datalog rule (above) loaded into the substrate at session start. Per-lane render modes, per-lane closure predicates, and any "which Concerns does this Proposition serve" query consume the derived predicate.

The `renderLaneSlice` render mode (Interface Spec, Architecture §4.2) is implemented as a query against `in_lane` plus a structured projection over the resulting Proposition set. It moves from "planned-not-yet-implemented" to "implementable on existing schema."

## Consequences

**Positive:**
- Schema stays minimal. The closed-set discipline holds; no new required field on Propositions.
- Single source of truth for lane membership: the Resolution→Proposition grounding graph. No synchronization risk.
- Multi-lane Propositions appear naturally — no special handling for a Proposition that serves multiple Concerns.
- Per-lane closure becomes computable today: `lane_closed(C) :- all_grounded_in_lane(C), all_ratified_in_lane(C)`.
- Counterfactual queries over lane membership are mechanical: snapshot, retract a Resolution's anchor, derive, re-query `in_lane`.
- The `renderLaneSlice` mode unblocks without a migration.
- No migration burden for existing proofs.

**Negative:**
- Lane membership cannot be asserted before a Resolution exists. A Proposition that the Agent knows-in-advance will serve Concern C must wait until a Resolution anchored to C grounds in it. This is the cost ADR-0010 named in favor of the pointer; the architecture accepts it.
- Querying lane membership requires the substrate to be loaded. Static analysis tools that don't instantiate the engine cannot answer "which lanes does this Proposition serve?" — they must derive the predicate themselves or run the engine. In practice every Domain operation already loads the engine, so the constraint binds only on out-of-band tools.

**Neutral:**
- The decision is reversible: if usage demonstrates that pre-Resolution lane declaration is a frequent need, a future ADR can supersede this one and add the pointer with the integrity-resolution policy the synchronization risk requires.
- The derivation has bounded depth (one base case plus one recursive case over `proposition_grounds`); evaluator performance characteristics are well-understood for this rule shape.

## Alternatives considered

- **First-class `concerns_addressed[]` pointer (ADR-0010 in-favor case).** Rejected because the forward-solve paradigm makes the derived predicate cheap, and the synchronization risk is real. The benefits cited in ADR-0010 (render quality, closure granularity, authoring clarity) are recovered by the derived approach without the trade-offs.
- **Hybrid: assertion as a hint, derivation as authority.** The Agent could optionally declare `concerns_addressed_hint[]` for early signaling, with the derived `in_lane` predicate remaining authoritative. Rejected as over-engineering — the hint adds a second field without removing the authoritative one, and "early signaling" turns out to be solved by the derivation appearing as soon as the first Resolution grounds in the Proposition, which is when the Proposition's role becomes meaningful anyway.
- **Generalized `serves(Element, Concern)` predicate.** A more general formulation that would cover lanes for any element category, not only Propositions. Rejected at this time because the lane abstraction is currently Proposition-centric (Resolutions anchor Concerns directly; Risks attach to Propositions; Frictions span two anchors). Generalization can be revisited if other element categories surface lane-shaped queries.

## What would change the decision

This ADR should be revisited if:

1. The Agent's authoring workflow consistently surfaces "declare lane intent before grounding the Resolution" as a productive move that the derived approach cannot accommodate.
2. Static-analysis tools that run outside the engine become a significant consumer of lane data, and re-evaluating the Datalog rule out-of-band proves more burdensome than synchronizing a schema field.
3. A general `serves(Element, Concern)` formulation emerges with applications across multiple element categories, in which case this ADR is superseded.

## References

- ADR-0007 (Forward-solve paradigm — the substrate that makes derived lane membership cheap)
- ADR-0010 (Superseded — the deferred predecessor)
- Architecture §4.2 (IRenderSurface, `renderLaneSlice` mode)
- Architecture §6.3 (this ADR's framing in the layered architecture)
- Domain Spec §10.5 (lane and lane-slice render concepts)
- Glossary entry `lane` (updated to reflect this decision)
