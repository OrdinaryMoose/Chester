---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [05-domain-spec, 01-vision]
---

# ADR-0003: Approval as engine body literal

## Status

Accepted.

## Context

The proof MCP's existing architecture treats Designer ratification as a status field on elements: `state: 'ratified'` with associated metadata. The closure check is procedural — iterate elements, count ratified ones, validate per-Concern coverage. The cascade behavior on revision is also procedural: when an element is revised, code looks up dependents and clears their ratifications.

The forward-solve paradigm (ADR-0007) reorganizes this. Propositions and Resolutions are no longer typed records validated by code; they are Horn-clause rules in the Engine. A Proposition's grounding chain becomes its rule body. A Proposition enters the proof's *derived* set when its body is satisfied.

The question that arises: how does Designer ratification gate derivation in the forward-solve model?

Two options were considered:

**Option A: Approval as metadata.** Keep `approved` as a status flag on the element record. Procedurally check it before adding the rule to the Engine, or after derivation when filtering results.

**Option B: Approval as body literal.** The Engine has an `approved/3` predicate. The defining rule for each Proposition, Resolution, ratifiable Concern, or Definition includes `approved(ElementId, _, _)` as a body atom. Without the corresponding fact, the body is unsatisfied; the element does not derive.

The deeper question behind these options is whether the Designer's authority lives *outside* the inference (a procedural gate) or *inside* it (a body literal). Both implement the same observable behavior at the surface.

But cascading is different. In Option A, revision retracts approval, and cascade requires custom code: walk dependents, clear their approvals, walk *their* dependents, recursively. In Option B, revision retracts the `approved` fact, the Engine's next derivation re-evaluates rule bodies, and cascade is automatic — anything whose body included the now-retracted approval no longer derives, and anything that depended on it cascades through ordinary fixed-point semantics.

Counterfactuals are also different. The Designer asks "does closure still hold without this Proposition?" In Option A, this requires bespoke code that simulates approval retraction and re-runs the procedural checker. In Option B, this is `snapshot()`, `retractFact("approved", [Proposition, _, _])`, `derive()`, `query("closure_permitted")`, `restore(snap)` — a generic counterfactual mechanism the Engine provides for free.

The Vision document treats Designer authority as architecturally load-bearing (Vision §2.6). This places the question on the architecture's central spine: is authority a layer above the inference, or a participant within it?

## Decision

**Approval is an Engine body literal.** Each ratifiable element category (Proposition, Resolution, ratifiable Concern, Definition) translates to a Horn-clause rule with `approved(ElementId, RatificationText, Round)` as a body atom. The `approved/3` predicate is asserted only by the `ratify` operation, which requires a designer-source consent token.

Schematically:
```
proposition(PropId, Statement) :- 
  evidence(E1, _, _),
  rule_decl(R1, _),
  approved(PropId, _, _).
```

Without the `approved` fact, the rule body is unsatisfied; the Proposition is *defined* but not *derived*. It does not enter the proof's working knowledge base. Anything that grounds in it does not derive either.

## Consequences

**Positive:**
- **Cascade is free.** Revising an element retracts its `approved` fact; the Engine's next derivation re-evaluates and any dependent elements cascade automatically through fixed-point semantics. No custom cascade code.
- **Counterfactuals are first-class.** Snapshot + retract approval + derive + query + restore is the universal counterfactual pattern. Mechanical collapse_test verification (Domain Spec §11.1) drops out.
- **Authority is structurally visible.** The role of Designer ratification is encoded in the rule body itself; reading the rule shows what authority gates it.
- **Explanation is automatic.** The Engine's `explain()` operation produces a derivation tree that includes the `approved` fact as a body satisfier; the proof's "why does this Proposition count?" question is answered by the Engine, not by separate documentation code.
- **Uniform mechanism.** Approval, grounding, lifecycle status, and any future authority gates all use the same body-literal pattern. There are not two distinct kinds of "thing that gates derivation."

**Negative:**
- **Slightly more verbose rule bodies.** Every element rule carries an extra body atom for approval. Negligible cost.
- **Designer authority encoded in many places.** Each element's defining rule mentions `approved`; if the authority pattern changes (e.g., multi-Designer ratification with multiple `approved` facts), every defining rule needs adjustment. Mitigated by code-generating defining rules from the schema.
- **Refusing-to-derive is silent.** An unratified element exists but does not appear in queries. The agent must know to query for "elements awaiting ratification" separately. The Domain layer surfaces this view explicitly.

**Neutral:**
- This decision is the operational core of the forward-solve paradigm. Reversing it would unwind much of ADR-0007.

## Alternatives considered

- **Option A (metadata + procedural gate)**: rejected. Foregoes free cascade and counterfactuals; reintroduces the bespoke code the forward-solve shift is designed to eliminate.
- **Hybrid (procedural cascade, body-literal counterfactual)**: rejected. Two mechanisms doing similar work; cognitive overhead unjustified.

## References

- Domain Spec §3.4 (Proposition translation), §5.2 (Approval cascade), §11 (Counterfactual)
- Vision §2.6 (Two-player asymmetric authority)
- ADR-0007 (Forward-solve paradigm)
