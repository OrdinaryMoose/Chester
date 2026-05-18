---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [03-architecture, 06-interface-spec]
---

# ADR-0001: Three-layer hexagonal separation

## Status

Accepted.

## Context

The existing proof MCP is a single-package Node module with `state.js` (1236 lines), `server.js` (1105 lines), and `proof.js` (988 lines) carrying intermixed responsibilities: schema definitions, MCP tool registration, JSON wire shaping, persistence, closure computation, friction detection, render generation, and procedural integrity checking. The mixing is not arbitrary — these modules co-evolved — but it has produced two specific costs:

1. **Engine choice locked-in.** Replacing the procedural checker with a Datalog evaluator (or any other inference engine) requires touching every file that mentions integrity, closure, or friction. The replacement has no clean target.
2. **Interface choice locked-in.** Replacing MCP with HTTP, CLI, or library-mode is structurally awkward — the wire format and persistence are entwined with the proof concepts.

The system's architectural needs include: forward-solve via Datalog (a different inference paradigm than the current procedural checker), an Adversary role attaching at the protocol layer (a second client type), and possibly an alternate render adapter (a different output channel). All three are easier when the proof concepts (Domain) are separated from the inference (Engine) and from the protocol (Interface).

The architectural styles considered:
- **Single-module/script**: current state. Cheap; doesn't admit the changes above.
- **MVC-style**: model/view/controller. Doesn't fit; there is no UI binding and the inference engine is itself an adapter, not a passive store.
- **Hexagonal / ports-and-adapters**: Domain at the center; Engine and Interface as adapters bound through typed ports. Inward dependency only.
- **Microkernel + plugins**: Domain as kernel, Engine and Interface as plugins. Equivalent in shape to hexagonal at this scale.

## Decision

Adopt **three-layer hexagonal architecture** with Engine, Domain, and Interface as named layers. Dependencies flow inward only: Interface depends on Domain, Domain depends on Engine, Engine depends on nothing. Cross-layer calls go through typed boundary contracts.

The Domain holds proof identity (schema, closure, friction, lifecycle, render, counterfactual). The Engine is a generic Datalog evaluator. The Interface is the MCP adapter.

## Consequences

**Positive:**
- The Engine becomes a reusable component; it can be packaged separately and used by other tools.
- The Interface becomes replaceable; switching from MCP to HTTP affects only the Interface layer.
- Domain tests don't require the MCP layer; they exercise the Domain's programmatic surface directly.
- Layer boundaries make code reviewable in chunks; a Domain change doesn't tangle with Interface changes.
- The Adversary role integrates as just another client at the Interface layer.

**Negative:**
- A mutation flows through three layers, where a single-module implementation would be one function call. Indirection is real.
- The discipline must be maintained; slipping (Interface calls Engine directly) corrupts the architecture's value.
- Migration cost: the existing intermixed code must be untangled. This is sequenced in Phases 2–7 of the migration plan.
- Boundary contracts must be designed and documented; this is overhead the single-module architecture didn't have.

**Neutral:**
- The architectural style is a structural commitment, not a behavioral commitment. The system's user-visible behavior is unchanged by the layering itself.
- Code volume modestly decreases overall (estimated 4300 → 2600–4200 lines per Architecture §12) due to policy externalizing into engine rules.

## Alternatives considered

- **Stay with single-module**: rejected because forward-solve migration and Adversary integration are too entangled with current code organization to proceed cleanly.
- **Two layers (Engine + everything)**: simpler, but the wire format and persistence belong on a different boundary than proof concepts. The two-layer collapse degrades quickly under the Adversary requirement.
- **Four or more layers**: unjustified at this scale; would add ceremony without compensating clarity.

## References

- Architecture §1, §2, §3
- Domain Spec §13 (sizing implications)
- Migration Plan §7 (Phase 7 implementation timing)
