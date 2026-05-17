---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [03-architecture, 04-engine-spec, 00-glossary]
related_adrs: [0001, 0007, 0009]
---

# ADR-0012: Finer substrate-port segregation

## Status

Accepted.

## Context

ADR-0001 established the three-layer hexagonal architecture with named ports between layers. The substrate-facing surface (Domain → Engine) was initially defined with four ports — `IFactStore`, `IRuleStore`, `IQueryEngine`, `ITransaction` — and a note that snapshot/restore "lives on the Engine's public API but is not part of a separate port." Explanation (`explain(fact) → derivation tree`) was folded into `IQueryEngine`. Materialization (producing a stable projection of derived facts) was implicit in `IQueryEngine.query`.

Two adapter classes are now structurally significant in the architecture:

1. **Read-only audit adapters** (planned per Architecture §2.4) — tools that load proof state, project derived facts, and report findings without mutating anything. They need `IQueryEngine`, derived-fact projection, and derivation explanation; they do not need `IFactStore`, `IRuleStore`, `ISnapshotRestore`, or `ITransaction`.
2. **The Adversary** (planned per Architecture §8) — a read-only delivery client whose job is to probe a presented proof for cheap-path failures, formulaic collapse-tests, and content-empty grounding leaves. The Adversary's load-bearing capability is counterfactual probing (`snapshot(); retractFact(...); derive(); query(...); restore()`). It does not need fact assertion or rule definition; it does need snapshot/restore and derivation explanation as first-class capabilities.

With the four-port surface, both adapter classes have to depend on the full Engine public API rather than on narrow ports. This violates Interface Segregation as a structural property — the adapters declare a dependency on operations they never call. It also makes alternative substrate implementations harder to reason about: a SQLite-recursive-CTE substrate may not emit derivation trees, but with `explain` folded into `IQueryEngine` the substrate either fails the port contract or stubs `explain` with an unhelpful fallback.

A separate concern: materialization (producing a stable derived-fact view for renders that consume the same data many times) is a real capability some substrates can implement efficiently (CozoDB, Soufflé) and others cannot. Without a named port, the choice is hidden in implementation detail.

## Decision

**Split the substrate-facing surface from four ports to seven.** The full set:

- `IFactStore` — base-fact lifecycle (unchanged).
- `IRuleStore` — rule lifecycle (unchanged; clarified that stratification analysis runs at `defineRule` time).
- `IQueryEngine` — query evaluation. Surface narrowed to `derive`, `query`, `count`, `exists`. Explanation and snapshot/restore moved out.
- `ISnapshotRestore` — counterfactual primitive. Surface: `snapshot() → token`, `restore(token)`. **Promoted from Engine public API to named port.**
- `IMaterializer` — derived-fact projection. Surface: `materialize(predicate)` / `materialize(query)`. **New port.**
- `IExplain` — derivation tracing. Surface: `explain(fact) → tree`. **Split out of `IQueryEngine`.**
- `ITransaction` — atomicity (unchanged).

Adapter dependency profile after the split:

- Primary Domain implementation: all seven ports.
- Read-only audit adapter: `IQueryEngine`, `IMaterializer`, `IExplain`.
- Adversary: `IQueryEngine`, `IExplain`, `ISnapshotRestore`.
- Mock substrate (unit tests): `IFactStore`, `IRuleStore`, `IQueryEngine`, `ITransaction` (stubs the rest).
- SQLite-recursive-CTE substrate: `IFactStore`, `IRuleStore`, `IQueryEngine`, `ITransaction`, partial `IMaterializer`; declines `IExplain` and `ISnapshotRestore` (graceful unsupported path).

## Consequences

**Positive:**
- Read-only auditing adapters take narrow dependencies that match what they actually use. Interface Segregation becomes a structural property rather than a slogan.
- The Adversary's counterfactual-probing capability is named at the port level, not buried in Engine-public-API documentation. The architectural commitment to adversarial review is visible in the port surface.
- Substrates that cannot emit derivation trees (some recursive-CTE backends, some optimized evaluators) can decline `IExplain` cleanly rather than stubbing it. The port contract surfaces capability differences.
- Materialization becomes an explicit substrate capability with its own contract, separable from query evaluation. Substrates that can materialize efficiently (CozoDB, Soufflé) advertise this through the port; substrates that cannot can fall back to repeated `query` calls behind the port boundary.
- The Liskov-substitution surface is sharper: substrates substitute for each other on the ports they implement, not on a monolithic Engine API.

**Negative:**
- Seven substrate ports plus seven delivery ports plus four cross-cutting ports is a 14-port surface. The conceptual load on a new contributor goes up modestly.
- The mock substrate in unit tests must explicitly stub three additional ports (or the test harness must accept partial-implementation substrates and skip tests that depend on missing ports).
- Adapters that genuinely use the full substrate surface (the primary Domain) now declare seven dependencies where four sufficed before. The shape is mechanical but adds a small amount of wiring.

**Neutral:**
- The split is non-breaking for the Engine implementation itself — the same evaluator can satisfy all seven ports. Only the boundary contract changes.
- The split is reversible if it proves to add ceremony without compensating clarity. Collapsing `IExplain` back into `IQueryEngine` is a mechanical refactor; the port discipline allows this without disturbing adapter implementations that didn't depend on the split.

## Alternatives considered

- **Keep the four-port surface (status quo before this ADR).** Rejected because it forced read-only adapters to take broad dependencies and hid the snapshot/restore and explain capabilities in Engine-public-API documentation rather than in named port contracts.
- **Split further (e.g., separate `IDerive` from `IQuery`).** Considered and rejected. `derive` and `query` are tightly coupled in practice — every query implicitly assumes a settled fixed point, and forcing the Domain to call `derive` separately before each `query` is ceremony without value. The two stay together under `IQueryEngine`.
- **Single fine-grained `ISubstrate` port with capability flags.** Considered: a single port surface with `supports(capability) → bool` plus a uniform call interface. Rejected because it pushes capability discovery to runtime rather than to the type system; adapter authors should declare what they implement structurally, not by negotiation.

## What would change the decision

This ADR should be revisited if:

1. The seven-port surface adds enough ceremony in adapter wiring to be observable in development cost, and no read-only adapter has materialized that benefits from the segregation.
2. A substrate emerges that wants to expose capabilities the seven ports cannot cleanly represent (e.g., a probabilistic substrate that admits both crisp and weighted derivations), and the port topology needs to evolve.
3. Performance profiling shows the indirection added by the split is non-trivial at scale — though the split is structural, not behavioral, so this is unlikely.

## References

- ADR-0001 (Three-layer hexagonal separation — the parent decision)
- ADR-0007 (Forward-solve paradigm — establishes the substrate as Datalog)
- ADR-0009 (Cross-cutting ports for clock and ID — the prior precedent for adding a named port for a previously-implicit capability)
- Architecture §4.1 (Substrate-facing ports — the updated port list)
- Architecture §13.4 (Interface Segregation Principle discussion — updated for the seven-port surface)
- Engine Spec §4 (Operations — the underlying capabilities the ports expose)
