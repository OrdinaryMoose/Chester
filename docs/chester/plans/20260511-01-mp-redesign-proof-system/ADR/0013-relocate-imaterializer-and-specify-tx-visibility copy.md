---
status: Accepted
date: 2026-05-11
deciders: [M]
related_docs: [03-architecture, 04-engine-spec, 00-glossary, 08-test-strategy]
related_adrs: [0007, 0009, 0012]
---

# ADR-0013: Relocate `IMaterializer` to Domain; specify transaction-visibility as read-own-writes

## Status

Accepted.

## Context

Two design-tier gaps surfaced during specify-readiness review of the engine layer.

**Gap 1 — `IMaterializer` placement is inconsistent across the cascade.** ADR-0012 §28–§36 introduced `IMaterializer` as a substrate-facing port (`materialize(predicate) → relation`, `materialize(query) → relation`) on the rationale that (i) some substrates (CozoDB, Soufflé) can materialize derived facts efficiently and (ii) read-only audit adapters benefit from depending on a narrow port rather than on the full `IQueryEngine` surface. Architecture §4.1 and Glossary list `IMaterializer` accordingly. Engine Spec §4 does not — `materialize` appears in no operation list. The cascade is internally inconsistent: a port named at the architecture tier has no engine-spec contract behind it.

Two facts shape the resolution. First, the only substrate in the initial build is the custom JavaScript evaluator (ADR-0002), which has no native materialization — its `materialize` would be a thin wrapper around `query`. Second, the named beneficiary of the segregation — a read-only audit adapter — is not in the build plan, the migration phases (07-migration-plan §2–§9), or any near-term roadmap. The port currently carries spec, test, and contract cost in exchange for forward option value (a future CozoDB or Soufflé swap), with no current consumer that benefits from the narrowing.

**Gap 2 — Engine Spec §4.8 is silent on transaction-visibility semantics.** §4.8 specifies that mutations inside an open transaction are buffered against the handle rather than applied immediately. It does not specify what a `query` issued inside the same transaction sees: the committed state only, or the committed state plus the buffered mutations.

The Architecture's ratify walkthrough at §5.1 implicitly assumes the second answer. Steps 7, 11, and 12 issue queries inside the open transaction whose results are load-bearing: step 7's pre-conditions check (must see pre-mutation state), step 11's integrity recomputation (must see the just-asserted approval), and step 12's closure recomputation (same). Without read-own-writes semantics, steps 11 and 12 give wrong answers — the integrity and closure queries see the state before the approval was asserted.

The cascade therefore implicitly commits to a visibility model that the engine spec does not state. The gap is design-tier because it concerns *what capability the engine offers the Domain*, not *what the wire format looks like*.

## Decision

### Part 1 — Relocate `IMaterializer` to the Domain layer

Remove `IMaterializer` from the substrate-facing port set. The Engine's substrate-facing surface drops from seven ports to six: `IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction`.

When a Domain consumer (render, audit, lane-slice projection) needs to traverse a stable corpus of derived facts across many follow-up reads, it calls `IQueryEngine.query` once and holds the result locally. No new named port is introduced at the Domain layer; the capability is a composition concern handled at the call site.

This exercises the reversibility clause ADR-0012 §64 wrote in: "The split is reversible if it proves to add ceremony without compensating clarity. Collapsing back is a mechanical refactor."

### Part 2 — Transaction-visibility: read-own-writes with `query`-triggered auto-derive

Inside an open transaction the Engine's logical EDB and rule store are:

- logical EDB = (committed EDB ∪ buffered-asserts) − buffered-retracts
- logical rule store = (committed rules ∪ buffered-define) − buffered-undefine

`derive()` computes the fixed point against this logical view. `query` behaves as outside a transaction: it triggers `derive()` if the state has been mutated since the last derivation. On `commit`, the buffer becomes the committed state. On `rollback`, the buffer is discarded and the engine reverts to the pre-`begin()` committed state.

### Part 3 — Stratification check timing inside transactions

`defineRule` inside an open transaction runs stratification analysis at `defineRule` time, not at commit. Cyclic-negation rule sets are rejected immediately; the caller can react with `rollback` (or with a `undefineRule` plus a different `defineRule`) without losing the rest of the transaction's work.

This preserves the spec-wide "fail-fast at the call site that caused the error" pattern (cyclic-negation refusal at §3.2; malformed-rule rejection at §7; type errors at `assertFact`).

## Consequences

**Positive:**
- Engine identity sharpens: the substrate now owns only what varies across Datalog evaluators (storage, evaluation, snapshots, explanation, transactions).
- Engine Spec §4 becomes internally complete; no named port is missing a contract.
- The ratify walkthrough at Architecture §5.1 becomes literal rather than aspirational.
- The engine spec phase has fewer no-op contracts to formalize (no "stable view" semantics for a pass-through wrapper).
- ADR-0012's seven-port surface drops to six; ISP discussion in Architecture §13.4 still holds but with one fewer adapter-dependency example.
- Stratification fail-fast inside transactions preserves caller-locality of errors and avoids commit-time cascade failures for one bad rule.

**Negative:**
- Forward option value for substrate swap (CozoDB native views, Soufflé compiled relations) is deferred. A future ADR must re-introduce the port if a materialization-native substrate ships and the optimization matters.
- The hypothetical read-only audit adapter that ADR-0012 §43 used as a beneficiary now depends on `IQueryEngine` + `IExplain` substrate-side rather than on `IQueryEngine` + `IMaterializer` + `IExplain`. The dependency widens by one port. (This is hypothetical because no such adapter exists yet.)
- Engine implementation must support derivation over a logical view (base ± buffer) inside transactions. The semi-naive evaluator already handles set-based derivation; the addition is the buffer-view abstraction, not a new evaluation algorithm. Implementation cost is modest but non-zero.

**Neutral:**
- The reverse migration path is well-defined: re-introduce `IMaterializer` as a substrate-facing port when a substrate with native materialization is adopted; ADR at that point references this one.
- Test strategy gains two small additions (in-tx assert/derive/query round-trip property; cyclic-negation-in-tx fail-fast test).

## Alternatives considered

### For Part 1 (`IMaterializer` placement)

- **Keep `IMaterializer` at the Engine layer (status quo from ADR-0012).** Rejected for the initial build because (i) the only substrate has no native materialization, (ii) the named beneficiary (read-only audit adapter) does not exist in the build plan, and (iii) the port contract has to be defined and tested even though the JS evaluator implements it as a no-op pass-through.
- **Add `materialize` to Engine Spec §4 as a first-class operation.** Rejected for the same YAGNI reasons; would have reconciled the cascade but at the cost of carrying a capability nothing in the initial build uses natively.
- **Move `IMaterializer` to a named Domain-layer port.** Rejected as relocating the speculative abstraction rather than removing it; if no current consumer benefits from a named substrate port, no current consumer benefits from a named Domain port either. When composition pressure emerges, an ADR introduces it then.

### For Part 2 (transaction visibility)

- **Read-committed: queries inside a tx see only the pre-`begin()` state.** Rejected because it breaks the ratify walkthrough at Architecture §5.1 — integrity and closure checks inside the tx must see the just-asserted approval. Adopting read-committed forces the Domain to commit-then-validate-then-compensate, which is not atomic.
- **Read-own-writes with implicit re-derivation on every in-tx query.** Substantively equivalent to the chosen option, but pays an implicit derivation cost on every query inside a tx even when the caller knows the state is fresh. The chosen option exposes derivation as an explicit step the caller can control while preserving the existing rule that `query` triggers `derive()` when state is non-derived; the two options converge in practice but the chosen framing is closer to the engine spec's existing patterns.
- **Forbid queries inside transactions.** Rejected because it discards the natural use case for transactions in a Datalog engine and breaks the ratify walkthrough entirely.

### For Part 3 (stratification timing)

- **Defer stratification check to commit.** Considered. Rejected because the caller has lost the immediate context by commit time, the entire transaction collapses for one bad rule, and the rest of the engine spec uses fail-fast-at-call-site uniformly. No countervailing benefit was identified.

## What would change the decision

This ADR should be revisited if:

1. A substrate with native materialization (CozoDB, Soufflé) is adopted as the primary or a co-primary evaluator. In that case `IMaterializer` returns as a substrate-facing port; a follow-up ADR amends Architecture §4.1 and Engine Spec §4 accordingly.
2. A read-only audit adapter is added to the build plan that genuinely benefits from depending on a narrower port than `IQueryEngine`. Same remediation as (1).
3. Profiling shows that implicit `query`-triggered re-derivation inside transactions creates a meaningful performance penalty under realistic workloads. In that case the contract may shift to require explicit `derive()` calls inside transactions (i.e., remove the auto-derive convenience) without changing the visibility model.

## References

- ADR-0007 (Forward-solve paradigm — establishes the substrate as Datalog and motivates the transaction semantics)
- ADR-0009 (Cross-cutting ports including `IClock`, `IIDAllocator`, `ITransaction` — the prior precedent for naming substrate boundaries explicitly)
- ADR-0012 (Finer substrate-port segregation — the parent decision this ADR amends; §64 reversibility clause is the basis for Part 1)
- Architecture §4.1 (substrate-facing ports — updated to six)
- Architecture §5.1 (ratify walkthrough — the implicit basis for Part 2's visibility model)
- Architecture §13.4 (ISP discussion — adjusted for six-port surface)
- Engine Spec §4.8 (transaction surface — gains the visibility paragraph and stratification-timing note)
- Engine Spec §11 (boundary contract — gains the in-tx-visibility guarantee)
- Test Strategy §2.3, §2.4 (property tests and failure modes — gain in-tx round-trip property and cyclic-negation-in-tx failure test)
