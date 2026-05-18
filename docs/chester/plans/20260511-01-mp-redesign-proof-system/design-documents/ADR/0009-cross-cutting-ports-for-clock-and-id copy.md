---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [03-architecture, 04-engine-spec, 05-domain-spec]
---

# ADR-0009: Cross-cutting ports for clock, ID allocation, and transactions

## Status

Accepted.

## Context

The Domain layer has three implicit dependencies on infrastructure that, left implicit, leak into use-case logic in ways that complicate testing and limit substitution:

1. **Time / round counter.** Round increment, "current round" reads, and timestamping of mutations all consult an implicit clock. If the implementation reads `Date.now()` or increments a module-level integer directly inside a use case, the use case is no longer a pure function of its inputs and state.

2. **ID allocation.** Element IDs (`evid_N`, `prop_N`, etc.) come from somewhere. The current architecture's natural pattern is "next-integer per category, scoped to the proof." Embedded inside the mutation operation, this couples ID generation to mutation semantics and makes test fixtures depend on insertion order.

3. **Atomicity across multi-fact mutations.** A single Domain operation often asserts multiple Engine facts (e.g., adding a Proposition with grounding citations is one fact for the Proposition plus citation facts plus action-label metadata plus operation-log append). If the operation fails midway, the Engine should be left in the pre-operation state. The current architecture assumes this implicitly through the "load → mutate → save" pattern at the Interface layer, but the assumption is fragile and unstated.

Each of these admits a port treatment. ADR-0001 (three-layer hexagonal) and ADR-0007 (forward-solve paradigm) establish the discipline; this ADR extends it to three concrete cross-cutting concerns.

Adopting these as explicit ports has two consequences worth weighing:

- **Adds three small abstractions.** Three more interfaces in the layer topology; three more adapter implementations to maintain. The cost is small per port but real in aggregate.
- **Forces explicit injection.** Use cases that currently call `Date.now()` or `nextId('prop')` directly must accept an injected `IClock` or `IIDAllocator` instead. This is a small refactor; the architecture admits it cleanly.

The architecture's payoffs from each port:

- **IClock**: deterministic use cases. Tests inject a controlled clock and get repeatable round counters and timestamps.
- **IIDAllocator**: pluggable allocation strategies. Sequential is the current default; tests use deterministic allocators; future multi-session or multi-author proofs can use UUID or namespace-prefixed allocation without changing use-case logic.
- **ITransaction**: explicit atomicity contract. The substrate adapter implements transactions consistent with the underlying engine — buffer-and-commit for the custom evaluator, native transactions for CozoDB if it is ever swapped in. The Domain wraps multi-fact operations in `begin / commit / rollback` without knowing which underlying mechanism is in effect.

## Decision

**Three cross-cutting ports are added to the architecture:**

- **`IClock`** — surface: `now() → instant; currentRound() → int; advanceRound() → int`. The Domain layer accepts an `IClock` instance; all references to "now" or the round counter go through it. Default adapter: real clock + in-memory counter scoped to the loaded proof. Test adapter: deterministic clock with explicit `tick()`.

- **`IIDAllocator`** — surface: `next(category) → string`. The Domain layer accepts an `IIDAllocator` instance; element creation calls `allocator.next("prop")` to mint an ID. Default adapter: sequential-per-category, scoped to the loaded proof, persisted with state. Test adapter: deterministic sequence per category.

- **`ITransaction`** — surface: `begin() → handle; commit(handle); rollback(handle)`. The Engine layer exposes transactional semantics. The Domain wraps multi-fact mutations: `begin → assert facts / define rules → commit on success, rollback on failure`. Default adapter (custom evaluator): buffer-and-commit. Adapter for native-transactional engines: pass through to the underlying transaction model.

The ports are wired at session boundary. The Interface layer constructs adapter instances and injects them into the Domain's bridge.

## Consequences

**Positive:**
- **Deterministic Domain.** With injected clock, ID allocator, and transaction handle, every Domain use case is a pure function of its inputs and the engine state. Tests are repeatable; debugging is reproducible.
- **Test surface clean.** The mock substrate, mock persistence, deterministic clock, deterministic ID allocator combination lets the Domain be tested in pure isolation, with no real I/O and no non-determinism.
- **Substitution paths opened.** Multi-session proofs (UUID allocation), distributed deployment (transactional engines with MVCC), and forensic replay (deterministic clock injection over historical inputs) all become tractable. The architecture does not commit to these but admits them.
- **Atomicity becomes a contract.** Multi-fact mutations either fully apply or fully roll back. The Domain layer's failure semantics improve from "we assume the Interface persists only on success" to "the substrate guarantees transactional consistency."

**Negative:**
- **Three more abstractions to keep coherent.** Each port is small but adds surface area. Mitigated by treating them as cross-cutting (uniform across use cases) rather than per-operation.
- **Refactor cost.** Existing code that calls `Date.now()` or generates IDs inline must be updated. Estimated effort: small (less than a day for the existing codebase).
- **Test adapter discipline required.** With deterministic adapters available, the temptation is to write tests against the production adapters and discover non-determinism late. Mitigation: per-layer test convention requires Domain tests use deterministic adapters by default.

**Neutral:**
- **No user-visible behavior change.** The ports affect implementation structure and testability; they do not change what the agent or designer observe.

## Alternatives considered

- **Implicit dependencies (status quo).** Continue with module-level clock/ID/atomicity assumptions. Rejected because the test-surface and substitution costs accumulate as the system grows.
- **Pull only IClock behind a port; keep ID and transactions implicit.** Rejected as inconsistent; if the principle is "infrastructure dependencies go behind ports," it should apply uniformly to the three concrete infrastructure dependencies the Domain has.
- **Combine into a single `IInfrastructure` port with all three surfaces.** Rejected. Violates Interface Segregation: a read-only renderer should not need to depend on `next()` or `commit()`. Three separate ports let each adapter implement only the ones it needs.

## References

- Architecture §6 (Cross-cutting concerns)
- Architecture §4 (Named ports)
- Engine Spec §4.4 (Transaction surface)
- Domain Spec §4 (Lifecycle), §13 (Sizing)
- ADR-0001 (Three-layer hexagonal)
