# Engine-Tier Open Architectural Questions

This document tracks open architectural questions about the engine tier that have been identified but not yet resolved. Each entry names the question, why it matters, what is known about the resolution path, the channel by which it will be closed, and the date the question was opened.

The cascade's architectural decision records (ADRs) are for decisions made; this document is for decisions pending. When an entry closes, the resolution lives in a new ADR and the entry is removed from this document.

---

## OQ-1 — Evaluator IDB Indexing Architecture (D5)

**Date opened:** 2026-05-12
**Closure channel:** sprint-01-proof-backend-pass-3 (a focused design-large-task pass on Evaluator indexing architecture)

### Problem shape

The Evaluator's `matchBodyAtom` performs a full linear scan over `derived.values()` per body atom per iteration of semi-naive evaluation. For recursive transitive-closure-shaped workloads (e.g., `ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y)`), every derived fact has the same predicate, so any per-predicate bucketing provides zero discrimination. The FactStore already has a per-position positional index for the EDB side; the IDB has no equivalent, and the Evaluator's join paths do not exploit the EDB index either.

### Why it matters now

- AC-11.2 (the 1000-element transitive-closure stress test) is currently marked `it.skip` because deep recursion does not complete within the test budget under the current Evaluator. At N=100 the same workload takes ~9 seconds; at N=1000 the runtime is extrapolated to several hours. The skipped test is sprint-01's promise to address this.
- The Domain layer (sprint-02-proof-layer) will generate rules programmatically and will exercise non-trivial join shapes. Designing the indexing architecture before observing the Domain's actual workload patterns risks under- or over-fitting.

### What is known about the resolution

The sprint-01 deferment doc (D5 entry) sketches the architectural fix: replace the IDB's `Map<factKey, fact>` with `derivedPositionalIndex: Map<predKey, Array<Map<value, Set<factKey>>>>` — mirroring `FactStore._positionalIndex` exactly. `matchBodyAtom` then performs bound-position lookup with bucket intersection on both the EDB side (via `factStore.factsMatching`) and the IDB side (via the new index). Estimated size: ~85 lines across `Evaluator.js`. Medium correctness risk on the negation branch (D3's existential-quantification semantics must continue to hold under the new lookup path) and on the intersection logic for repeated variables.

A partial fix (per-predicate index only) was attempted during sprint-01 Task 15 and reverted — it provided zero discrimination for the transitive-closure workload because all derived facts share one predicate.

### Closure channel

Sprint-01-proof-backend-pass-3 will run a fresh `design-large-task` pass on Evaluator indexing architecture, informed by sprint-02's Domain-layer workload patterns where possible. The pass-3 sprint's brief should inherit the full sprint-01 deferment doc D5 entry as the architectural context.

### Acceptance for closure

When the pass-3 sprint completes, this entry is removed from `engine-open-questions.md` and the resolution is recorded in a new ADR (`0019-...` or later). AC-11.2 is unskipped and passes within the test budget. The 100-element termination test (`properties.test.js`) is tightened back to its original 5000ms bound and passes.
