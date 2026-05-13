# Deferred Items — sprint-01-proof-backend-pass-3

Items surfaced during execute-write or the full-branch code review that are out of scope for pass-3 but worth tracking for future audit or follow-up work.

---

## D1 — EDB/IDB factKey collision not enforced as engine invariant

**Date:** 2026-05-13
**Source:** Full-branch code review (Important finding I-1)
**Status:** Deferred — pre-existing, not introduced by pass-3

**Description.** `candidatesFor` can emit duplicate candidates when the same `factKey` (predicate+args) exists in both the EDB (`FactStore`) and the IDB (`derived` / `idbIndex`). Step 2 (no-bound case) iterates `factStore.allFacts(...)` then `derivedMap.values()` and pushes both; Step 5 (position-driver case) iterates `driverPos.baseKeys` then `driverPos.derivedKeys` and visits each without dedup. The downstream `derived.has(fk)` write-side guard in `fireRule` absorbs the duplicate at head derivation, so the IDB is correct, but the duplicate `bindingsList` rows cause redundant inner-loop work for later body atoms and pollute the candidate-count observer.

EDB/IDB predicate disjointness is implicit Datalog convention but is not enforced in the engine — `assertFact` and `derive()` paths do not check it. The engine spec §2 names EDB and IDB but does not formally require disjointness.

**Pre-existing.** Pre-pass-3 `matchBodyAtom` linearly scanned `derived.values()` filtered by predicate without dedup against base either. Pass-3 did not introduce the gap; it inherits it.

**Acceptance for closure.** Either (a) add a one-line spec invariant note stating "EDB and IDB predicates are disjoint; the engine relies on this for join correctness", or (b) add a visited-fk set in `candidatesFor`'s iteration to dedup, or (c) enforce the disjointness at `assertFact` / rule-definition time. The audit task is the natural channel for this decision.

---

## D2 — Body-reorder + negation lacks a targeted regression test

**Date:** 2026-05-13
**Source:** Full-branch code review (Minor finding M-1)
**Status:** Deferred — correctness argument holds; test would lock it in

**Description.** `fireRule`'s body-atom reorder (process the delta-restricted atom first) is correct under ADR-0016's safety check: every negated atom's vars are bound by earlier-in-declared-order positive atoms, and the only atom moved is the delta-restricted one, which is always positive. The integration tests (AC-1.2) cover the negation-bound-positions case but do not exercise a body shape where the reorder actually moves the delta atom past a negated atom (e.g. body `[positive_A, negated_B, positive_C_delta]`).

**Acceptance for closure.** Add one targeted test constructing that body shape, deriving a positive instance, and asserting the expected head. Locks the correctness argument as a regression signal.

---

## D3 — `candidatesFor` re-queries `derivedMap` for pure-base keys

**Date:** 2026-05-13
**Source:** Full-branch code review (Minor finding M-2)
**Status:** Deferred — micro-optimization, sub-millisecond benefit

**Description.** In Step 5's `visit` function, `derivedMap.get(fk)` runs even when `baseArgsByKey.has(fk)`. Inverting the short-circuit (`baseArgsByKey.get(fk)` first, then fall through to `derivedMap.get` only when missing) saves the lookup on pure-base hits.

**Acceptance for closure.** Reorder the lookup; verify suite stays green.

---

## D4 — `DerivedPositionalIndex.bucketFor` allocates `new Set()` on misses

**Date:** 2026-05-13
**Source:** Full-branch code review (Minor finding M-3)
**Status:** Deferred — micro-optimization

**Description.** Two return paths in `bucketFor` allocate a fresh empty Set on every miss-call. On AC-11.2 (5050 derived facts, recursive workload), this is on the order of 10^5 allocations across `derive()`. Hoisting a module-private `EMPTY_SET = new Set()` (frozen, returned for all misses) eliminates the allocations. Caller in `candidatesFor` treats the bucket as read-only.

**Acceptance for closure.** Replace per-miss allocation with a shared frozen `EMPTY_SET`; verify suite green.

---

## D5 — AC-1.1 test's regression guard depends on implicit iteration ordering

**Date:** 2026-05-13
**Source:** Full-branch code review (Minor finding M-4)
**Status:** Deferred — diagnostic robustness improvement

**Description.** AC-1.1's `r2Counts.every(c => c.candidateCount !== 3)` assertion depends on `rulesByStratum` producing a specific delta evolution. If the engine's rule iteration model shifts, the trajectory could change so that count==3 never appears even under a regression.

**Acceptance for closure.** Either assert on `iterationStats` directly to anchor the iteration count, or document the rule-order dependency explicitly in the test header.

---

## D6 — `engine-open-questions.md` is now a header-only stub

**Date:** 2026-05-13
**Source:** Full-branch code review (Minor finding M-5)
**Status:** Deferred — cosmetic

**Description.** After OQ-1 removal, the file contains only the document preamble and the `---` separator. Two reasonable end states: (a) keep the stub as a tracker ready for the next open question; (b) remove the file entirely until a new open question arises; (c) add a "no current open questions" sentinel line for clarity.

**Acceptance for closure.** Operator choice — any of the three is acceptable.

<!-- created-at: 2026-05-13T09:28:48Z -->
<!-- produced-by execute-write@v0004 -->
