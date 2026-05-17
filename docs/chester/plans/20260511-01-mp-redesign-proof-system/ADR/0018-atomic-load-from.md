---
status: Accepted
date: 2026-05-12
deciders: [M]
related_docs: [04-engine-spec]
related_adrs: [0015, 0016, 0017]
---

# ADR-0018: Atomic `loadFrom` via Snapshot/Restore Wrap

## Status

Accepted.

## Context

Sprint-01's plan-prescribed `loadEngineFrom` validated the serialized payload shallowly via `isValidSerialized`, called `engine.clear()`, then replayed the payload by calling `assertFact` per fact and `defineRule` per rule. The contract in AC-7.3 promised atomic loading: on failure, the engine must not be left in a partially-loaded state visible to any subsequent public API call.

The shallow-schema validation correctly rejected malformed envelopes with `MALFORMED_SERIALIZED_INPUT` before any mutation, so that error path honored atomicity by construction. But mid-replay failures did not. A replay step can throw `TYPE_ERROR` if a fact arg fails the `isConstant` check (per ADR-0015, this now includes non-finite numerical sentinels); it can throw `MALFORMED_RULE`, `DUPLICATE_RULE_ID`, `CYCLIC_NEGATION`, or `UNSAFE_RULE` if a serialized rule fails its respective `defineRule` check (per ADR-0016, `UNSAFE_RULE` is now raised at the rule-registry layer). When any of those threw mid-replay, the engine had already been cleared and partially repopulated — observers calling any read-side API thereafter would see a partially-loaded state that matches neither the pre-load state nor the post-load state.

The lifecycle factoring established for transactions provides snapshot/restore primitives at the engine boundary. Those primitives are exactly the affordance needed to make `loadFrom` unconditionally atomic — take a snapshot before `clear`, restore the snapshot inside a catch clause if any replay step throws, then rethrow.

## Decision

`loadEngineFrom` wraps the clear-and-replay sequence in a snapshot/restore pair. The sequence is:

1. Validate the serialized envelope via `isValidSerialized`; throw `MALFORMED_SERIALIZED_INPUT` before any mutation if validation fails.
2. Call `engine.snapshot()` to obtain a rollback handle covering the current full engine state (EDB and rules).
3. Inside a try block: call `engine.clear()`; iterate the serialized facts calling `engine.assertFact(...)`; iterate the serialized rules calling `engine.defineRule(...)`.
4. In the catch block: call `engine.restore(rollback)` to revert to the pre-load state; rethrow the underlying replay error so the caller sees the original structured error code.

AC-7.3's atomicity contract is now unconditional. Regardless of where in the replay the failure occurs, no partial-load state is observable on any subsequent public API call. The rethrow is the underlying error (e.g. `TYPE_ERROR`, `UNSAFE_RULE`), not a wrapped or rebranded code — callers diagnosing load failures see the same structured errors they would see from the underlying `assertFact` or `defineRule` call.

## Rationale

The snapshot/restore primitives are already part of the engine's lifecycle surface (they back transactions). Reusing them here keeps the engine's primitive set small and concentrates the rollback logic in one well-tested place rather than introducing a parallel staging mechanism for loads. The cost is one extra snapshot allocation per load call, which is bounded by the current engine size and trivial compared to the replay work itself for realistic payloads.

The alternative of staging the replay into a `TransactionBuffer` before committing would duplicate machinery that already exists. The alternative of documenting the gap and deferring would push a pre-conditioned-state bug into sprint-02, where the Domain layer would discover it during integration rather than as an isolated engine-tier defect.

## Consequences

**Positive:**
- The atomicity contract is unconditional: shallow-schema failures and mid-replay failures both leave the engine bit-equal to its pre-load state.
- A new lifecycle test (added during sprint-01) constructs a serialized payload with a non-finite numerical sentinel in a fact arg, asserts the resulting throw, and verifies that prior engine state — both facts and rules — is preserved.
- The fix reuses primitives the engine already exposes; no new public surface is added.

**Negative:**
- `loadEngineFrom` now allocates a full snapshot before clearing, adding O(state-size) memory and time overhead to every load call regardless of whether replay will succeed. For very large EDBs this is a real cost, though not significant for current workloads.
- A reader of the code must understand that the snapshot is defensive — the common path (validation passed, replay succeeded) discards the snapshot without using it.

**Neutral:**
- The snapshot/restore primitives reused here are the same primitives used by transactions, validating that the engine's lifecycle factoring was sound.
- The contract change is a strict tightening: any caller whose payloads previously round-tripped through `loadFrom` cleanly continues to behave identically; the new guarantee only changes observable state on the failure paths.

## Alternatives considered

- **Stage replays into a `TransactionBuffer` before committing.** Rejected — duplicates machinery already established for transactions and adds a second rollback mechanism with the same semantics as the snapshot one. The snapshot-rollback strategy already exists; reuse keeps the primitive set small.
- **Document the gap and defer to sprint-02.** Rejected — AC-7.3 is part of the engine's port contract; sprint-02's Domain layer will rely on it for serialized-proof-payload load semantics. Deferring a port-contract gap pushes its diagnosis into the wrong layer.
- **Introduce a `loadFromUnsafe(...)` variant that skips the snapshot for performance-sensitive callers.** Rejected — premature optimization; current workloads do not exhibit load-cost pressure, and adding a second public entry point with weaker semantics is a surface-area cost that should be paid only when a real caller demands it.

## What would change the decision

A future cost-conscious caller that wants to opt out of atomicity for very large loads — for example, a bulk-import path where the caller is willing to handle partial-load detection externally — might motivate a `loadFromUnsafe(...)` variant. Not in scope for sprint-01.

## References

- `04-engine-spec.md` §`loadFrom` (post-pass-2 amendment): lines 315 (failure-mode bullet) and 358 (test-obligation bullet)
- Sprint-01 deferment doc D4 entry at `docs/chester/plans/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md`
- ADR-0015 (finite-constant constraint — one of the replay-time error sources covered by the wrap)
- ADR-0016 (canonical rule-safety check — `UNSAFE_RULE` is now raised at `defineRule`, a mid-replay error site covered by the wrap)
- Code: `skills/design-large-task/engine/Serializer.js` lines 37-54 (`loadEngineFrom`)
