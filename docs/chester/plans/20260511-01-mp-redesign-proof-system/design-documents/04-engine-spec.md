---
status: Draft
last_reviewed: 2026-05-10
related_docs: [03-architecture, 05-domain-spec]
related_adrs: [0002, 0007, 0009, 0013, 0014]
---

# Engine Specification

This document specifies the Datalog evaluator that constitutes the bottom layer of the architecture. The Engine is generic, pure, and knows nothing about proofs.

---

## 1. Purpose and scope

The Engine provides forward-chaining Datalog evaluation: a fact store, a rule store, semi-naive evaluation to fixed point, query against the derived database, and snapshot/restore for counterfactuals. Its surface is small, its semantics are well-defined, and its termination is guaranteed.

Out of scope:
- Knowledge of proof concepts (Concerns, Propositions, dispositions)
- Persistence (Engine state is in-memory; serialization is a separate concern)
- Authority (consent, ratification, designer roles)
- Network or filesystem I/O

---

## 2. The Datalog dialect

The Engine speaks standard Datalog terminology. The **EDB (extensional database)** is the set of base facts asserted by the Domain; in this document, also called the "fact store." The **IDB (intensional database)** is the set of facts derivable by applying rules; in this document, also called the "derived set." Together, EDB + IDB = the fixed point. The Engine's **rule store** holds the rule program — it is separate from both EDB and IDB. (Standard Datalog reserves "IDB" for derived facts; this document follows that convention.)

### 2.1 Inclusions
The Engine implements **stratified Datalog with negation**: a subset chosen for decidable evaluation and matching the Domain's needs.

Included:
- **Horn clauses**: rules of form `head :- body₁, body₂, …, bodyₙ` where head is a positive atom and each body atom is positive or negated
- **Recursion**: rules may transitively refer to themselves (allowing transitive closure, ancestor relations, grounding chains)
- **Stratified negation**: `¬p(X)` admissible in body when `p` is fully evaluated in a lower stratum
- **Constants**: string, number, boolean, null
- **Variables**: identifiers (uppercase by convention) that bind to constants during evaluation
- **Multiple clauses per head**: alternative supporting paths (OR semantics)

### 2.2 Exclusions
- **Function symbols and complex terms**: arguments are constants only, not nested structures. (This is what makes Datalog terminating; full Prolog allows function symbols and is Turing-complete.)
- **Cut and other procedural operators**: no `!`, no ordering tricks
- **Arithmetic in heads**: arithmetic appears only in body comparisons and built-in predicates
- **Higher-order predicates**: no rule that takes a predicate as argument

### 2.3 Why this subset
Termination guarantees matter for a closure check. An agent (or designer) issuing a query must always get an answer in bounded time. Stratified Datalog has decidable evaluation: every well-formed program terminates with a unique minimal model. This is what makes the Engine load-bearing for closure verification.

---

## 3. Semantics

### 3.1 Fixed-point evaluation
The minimal model of a Datalog program is the smallest set of facts derivable from base facts by exhaustive rule application. The Engine computes this by **semi-naive evaluation**:
1. Initialize derived set ∅
2. In each iteration: apply every rule whose body is now satisfied by base ∪ derived; add new heads to a delta set
3. Merge delta into derived; new delta becomes input for next iteration
4. Terminate when delta is empty (no new facts derivable)
5. Final state: base ∪ derived = the fixed point

Semi-naive (vs naive) avoids re-deriving known facts by tracking which deltas changed in the prior iteration; rules only fire on new facts.

### 3.2 Stratification
Rules are organized into strata by negation dependency:
- Stratum 0: rules with no negated body literals
- Stratum N: rules whose negated body atoms refer to predicates fully evaluated in strata 0..N-1
- Each stratum is fully evaluated to fixed point before higher strata begin

If a program cannot be stratified (cyclic negation), the Engine refuses it at rule-definition time.

### 3.3 Query semantics
A query is a pattern with variables. Evaluating a query against the fixed point returns the set of variable bindings that make the pattern match facts. Patterns can be:
- Ground patterns (no variables): returns boolean (does this fact hold?)
- Variable patterns: returns binding sets
- Mixed: returns binding sets for the variables, filtered by the constants

### 3.4 Determinism
Given the same base facts and rules, the Engine produces the same fixed point and the same query results. No randomization, no implementation-defined ordering effects on results.

---

## 4. Public API

The Engine's surface is intentionally small. All public operations live here.

### 4.1 Fact operations (EDB surface)
- `assertFact(predicate, args)` — write a base fact into the EDB. Idempotent (asserting an existing fact has no effect).
- `retractFact(predicate, args)` — remove a base fact from the EDB. Idempotent (retracting an absent fact has no effect).
- `factExists(predicate, args)` — boolean test for fact presence in the EDB.

### 4.2 Rule operations (rule-store surface)
- `defineRule(ruleId, headAtom, bodyAtoms, metadata)` — write a Horn clause into the rule store. RuleId must be unique. Metadata is opaque to the Engine; carried through for the Domain's use.
- `undefineRule(ruleId)` — remove a rule by id.
- `getRule(ruleId)` — return the rule shape (head, body, metadata) for inspection.

### 4.3 Evaluation
- `derive()` — compute fixed point from current base + rules. Idempotent. Required before queries reflect recent assertions.
- `isDerived()` — boolean, true if the current state has been derived to fixed point since the last mutation.

### 4.4 Query
- `query(pattern)` — return list of variable bindings satisfying the pattern. Triggers `derive()` if not already derived.
- `count(pattern)` — return integer count of bindings (cheaper than enumerating).
- `exists(pattern)` — boolean, returns true iff at least one binding exists.

### 4.5 Explanation
- `explain(fact)` — return a derivation tree showing why this fact appears in the fixed point. Each node names the rule that fired and the sub-facts that satisfied its body. Returns null if the fact is not in the derived set.

### 4.6 Snapshot
- `snapshot()` — return an opaque token representing current full Engine state (base + rules + derived + metadata).
- `restore(token)` — replace Engine state with the snapshot. Used by Domain's counterfactual module: `let s = snapshot(); retractFact(...); derive(); query(...); restore(s);`
- Snapshots are reference-cheap (no full copy until mutation; copy-on-write internally if useful).

### 4.7 Lifecycle
- `clear()` — empty the Engine entirely (no facts, no rules).
- `serialize()` — return a JSON-serializable representation of base facts and rules (not the derived set; that recomputes on load).
- `loadFrom(serialized)` — populate Engine from a serialized form.

### 4.8 Transaction surface (`ITransaction`)

The Engine exposes transactional semantics for atomic multi-fact mutations.

- `begin()` — open a transaction. Returns an opaque handle. Subsequent assertions, retractions, rule definitions, and rule undefinitions are buffered against this handle rather than applied immediately to the EDB or rule store.
- `commit(handle)` — apply all buffered mutations atomically. The Engine re-derives to fixed point as part of commit. On any failure during commit, the Engine state is unchanged.
- `rollback(handle)` — discard all buffered mutations. The Engine state is unchanged from `begin()`.

Mutations issued outside a transaction (i.e., bare `assertFact` calls) execute immediately. Mutations inside a transaction are deferred until commit. This is the model the custom evaluator implements; for native-transactional substrates (e.g., a future CozoDB adapter), the surface passes through to the underlying transaction model.

Transactions do not nest. A `begin()` while a transaction is open raises an error.

**Visibility (read-own-writes).** Inside an open transaction, the Engine's logical EDB and rule store are:

- logical EDB = (committed EDB ∪ buffered-asserts) − buffered-retracts
- logical rule store = (committed rules ∪ buffered-define) − buffered-undefine

`derive()` computes the fixed point against this logical view. `query`, `count`, and `exists` behave as outside a transaction: they trigger `derive()` if the state has been mutated since the last derivation, and they read against the resulting derived set. On `commit`, the buffer becomes the committed state and the derived set is preserved (no recomputation required if the buffer's mutations were already derived inside the tx). On `rollback`, the buffer is discarded and the Engine reverts to the pre-`begin()` committed state, including the derived set as of that point.

This contract is what makes Architecture §5.1's ratify walkthrough work: steps 7, 11, and 12 issue queries inside an open transaction, and the integrity and closure checks at steps 11–12 must see the just-asserted approval. (See ADR-0013, Part 2.)

**Stratification check timing in transactions.** `defineRule` inside an open transaction runs stratification analysis at `defineRule` time, not at commit. A cyclic-negation rule set is rejected at the call that introduced the cycle; the caller can react with `rollback`, or with `undefineRule` plus a different `defineRule`, without losing the rest of the transaction's work. This preserves the spec-wide fail-fast-at-call-site pattern. (See ADR-0013, Part 3.)

The Domain wraps every multi-fact operation in begin/commit/rollback (Domain Spec §4, Architecture §6.9). Single-fact operations may skip the transaction wrapper. See ADR-0009.

---

## 5. Internal data structures

The specification names the structures conceptually; the implementation may optimize while preserving observable semantics.

### 5.1 Fact store (EDB)
- Indexed by predicate symbol (primary index)
- Per-predicate secondary indexes on each argument position for fast join lookups
- Set semantics: no duplicates within a predicate

### 5.2 Rule store
- Indexed by rule id (primary)
- Secondary index by head predicate (for "which rules might derive p?")
- Stratification metadata per rule (which stratum it belongs to)

### 5.3 Derived set (IDB)
- Same shape as fact store but for facts produced by rule firing
- Cleared and rebuilt by each `derive()` call
- Per-fact provenance tag (which rule + which body bindings produced this), used by `explain`

### 5.4 Predicate dependency graph
- Directed graph: edge from p to q if a rule with head p has q in its body
- Negated edges marked specially
- Used to compute stratification and to detect cycles through negation (which cause refusal)

---

## 6. Concrete API examples (conceptual)

### 6.1 Asserting facts
```
assertFact("evidence", ["evid_3", "no version carries scope manifest", "codebase"])
assertFact("rule_decl", ["rule_1", "every deploy must produce recoverable artifact"])
```

### 6.2 Defining a rule
```
defineRule(
  ruleId: "prop_3_grounding",
  headAtom: ["proposition", ["prop_3", S]],
  bodyAtoms: [
    ["evidence", ["evid_3", "_", "_"]],
    ["rule_decl", ["rule_1", "_"]],
    ["approved", ["prop_3", "_", "_"]]
  ],
  metadata: { domain_concept: "necessary_condition", inference_pattern: "grounds_imply_conclusion" }
)
```

The Domain layer constructs these calls; the Engine doesn't know what `proposition`, `approved`, or `evidence` mean.

### 6.3 Querying
```
query(["proposition", [N, S]])
// returns [ {N: "prop_3", S: "..."}, {N: "prop_5", S: "..."}, ... ]

count(["addresses", ["_", "cern_2"]])
// returns 2

exists(["ungrounded_proposition", [N]])
// returns false
```

### 6.4 Counterfactual
```
const snap = snapshot()
retractFact("approved", ["prop_3", "_", "_"])
derive()
const stillCovered = query(["covered", ["cern_2"]])
restore(snap)
// stillCovered tells the Domain whether prop_3's approval was load-bearing
```

---

## 7. Error model

The Engine raises exceptions for:
- **Malformed rules**: head not a positive atom, body atoms with wrong shape
- **Stratification failure**: cyclic negation
- **Type errors**: assertFact called with non-constant value where constants required
- **Storage failure**: any condition under which the Engine cannot produce a deterministic answer

The Engine does not classify errors by domain concern (no `INVALID_CONSENT`, `PROOF_FINISHED`, etc.). Domain-specific error codes are the Domain layer's responsibility.

---

## 8. Performance characteristics

For the proof system's expected scale (low thousands of facts, hundreds of rules), the Engine should support:
- Sub-millisecond fact assertion and retraction
- Single-digit-millisecond query latency for typical patterns
- Sub-second full derivation from scratch
- O(facts + rule-fires) memory footprint

Optimization targets in priority order:
1. Index quality (join performance dominates query cost)
2. Semi-naive correctness (avoid redundant rule fires)
3. Snapshot copy-on-write (minimize counterfactual cost)
4. Incremental re-derivation (when feasible, recompute only deltas)

These targets are aspirations; the initial implementation can ship with naive evaluation if it meets the latency budgets and optimize later.

---

## 9. Test obligations

The Engine ships with its own test suite, exercised independently of the Domain. Tests use generic predicate names (`p`, `q`, `parent`, `ancestor`) — no proof concepts. Test obligations are organized by spec section so coverage gaps are visible structurally. Each obligation must have at least one passing test case for the Engine to be considered spec-compliant.

### 9.1 Evaluation semantics (§3)

Canonical Datalog programs exercising the §3 semantic rules:

- **Transitive closure**: ancestor relation derived from a parent fact set; verifies recursive rules and fixed-point termination.
- **Reachability**: directed-graph reachability with cycles; verifies cycle handling in semi-naive evaluation.
- **Stratified negation**: same-generation cousins (negation over a recursive predicate); verifies stratum assignment, negation-as-failure semantics, and stratum-ordering.
- **Multiple clauses per head**: alternative grounding paths converging to the same head fact; verifies OR semantics across clauses and set semantics suppressing duplicate derivations.
- **Empty programs**: empty fact set, empty rule set, and fact-only programs; verifies the fixed point is empty or EDB-only as appropriate.
- **Determinism (§3.4)**: same fact + rule set across repeated runs produces the same fixed point and the same query bindings.
- **Insertion-order independence**: asserting facts in different orders produces the same fixed point.
- **Stratum ordering (§3.2)**: in multi-stratum programs, lower strata reach fixed point before higher strata begin firing; a stratum-N rule with a negated body atom never sees partially-derived facts from stratum N-1.
- **Negation interacting with retraction**: retracting a positive fact that supported a negation literal causes dependent derivations to update on next `derive`.

### 9.2 Fact and rule operations (§4.1, §4.2)

Per-operation obligations:

- **`assertFact`**: asserted fact is observable via `factExists` and via `query`; idempotent (re-asserting an existing fact has no effect on EDB cardinality).
- **`retractFact`**: retraction removes the fact from the EDB; subsequent `query` does not return it; derived facts that depended on the retracted fact disappear after re-derivation; retracting an absent fact is idempotent.
- **`factExists`**: returns true for asserted facts, false otherwise; constant arguments matched by equality.
- **`defineRule`**: defined rule is observable via `getRule`; head fires when body is satisfied after `derive`; rule-id uniqueness enforced (defining with an existing id raises).
- **`undefineRule`**: rule removed; derived facts produced only by that rule disappear after re-`derive`; undefining a non-existent id is handled per documented contract.
- **`getRule`**: returns the rule's head, body, and metadata exactly as defined; metadata round-trips opaquely.
- **Predicate arity identity**: `p/2` and `p/3` are distinct predicates; asserting `p(a,b)` and `p(a,b,c)` produces two facts under different relations.
- **Constant types (§2.1)**: each constant type (string, number, boolean, null) is accepted in `assertFact`; non-constants raise type errors.

### 9.3 Evaluation and query (§4.3, §4.4)

- **`derive`**: idempotent (calling twice with no intervening mutation produces the same state); computes the fixed point of (EDB + rules).
- **`isDerived`**: returns true immediately after `derive` with no intervening mutation; returns false after any mutation; transitions reflect actual state.
- **Auto-derive on `query`/`count`/`exists`**: triggers `derive` if the state is non-derived since the last mutation; assert-then-query (without explicit `derive`) returns up-to-date bindings.
- **`query` pattern shapes (§3.3)**:
  - Ground patterns (no variables): return boolean presence in the fixed point.
  - Variable patterns: return all binding sets satisfying the pattern.
  - Mixed patterns: return binding sets for the variables, filtered by the constants.
- **Anonymous wildcards (`_`)**: match any value in query patterns and in rule body atoms without binding.
- **`count`/`exists` consistency with `query`**: `count(p) == length(query(p))` and `exists(p) == (count(p) > 0)` for every pattern.

### 9.4 Explanation (§4.5)

- **`explain` returns a derivation tree** for any derived fact; the tree's root is the fact and the leaves are EDB facts or otherwise non-derivable atoms.
- **Each non-leaf node names the rule that fired** and the body bindings that satisfied it.
- **Returns null (or documented sentinel) for non-derived facts** not in the fixed point.
- **Multi-clause support**: when a fact is derivable via multiple rule firings, `explain`'s behavior (all supporting paths vs. one canonical path) matches the documented choice consistently.
- **Explain across retraction**: after retracting a supporting fact and re-deriving, `explain` for a no-longer-derived fact returns the documented "not derived" result rather than a stale tree.

### 9.5 Snapshot and restore (§4.6)

- **Round-trip fidelity**: `snap = snapshot(); mutate; restore(snap);` returns Engine to bit-equal state including EDB, rule store, IDB, and per-fact metadata.
- **Restore preserves derivation**: snapshotting after `derive` and restoring captures the derived state; restoring does not require re-derivation.
- **Out-of-order restore**: restoring an older snapshot after a newer one works; intervening state is fully discarded.
- **Snapshot across `clear`**: snapshot taken before `clear` can be restored to recover full pre-clear state.
- **Snapshot/restore inside an open transaction**: behavior is defined and matches §4.8 (whether snapshots capture buffered state or only committed state — per documented choice).

### 9.6 Lifecycle and serialization (§4.7)

- **`clear`**: empties EDB and rule store; subsequent `derive` returns empty IDB; `factExists` returns false for all previously-asserted facts.
- **`serialize` round-trip**: returns a JSON-serializable representation that round-trips through `loadFrom`; the round-tripped engine matches the original on `factExists`, `query` results, and `derive` output.
- **`serialize` excludes derived facts**: serialized form omits the IDB; `loadFrom` followed by `derive` reproduces the original derived set.
- **`loadFrom` on malformed input**: rejects with a structured error; does not partially-load.
- **`loadFrom` on empty input**: results in an empty engine equivalent to `clear`.

### 9.7 Transactions (§4.8)

- **`begin`/`commit`/`rollback` lifecycle**:
  - `begin` returns a handle; subsequent mutations buffer against it.
  - `commit` applies buffered mutations atomically; engine state advances.
  - `rollback` discards buffered mutations; post-rollback state is bit-equal to pre-`begin` state.
- **Read-own-writes visibility (ADR-0013)**: queries inside an open transaction see the transaction's own buffered mutations after `derive` is called (or auto-derive via `query`/`count`/`exists`).
- **Logical view inside a transaction**: `derive` computes the fixed point against (committed-EDB ∪ buffered-asserts) − buffered-retracts, and (committed-rules ∪ buffered-define) − buffered-undefine.
- **Stratification check at `defineRule` inside a transaction (ADR-0013)**: cyclic-negation rule defined inside an open transaction is rejected at the `defineRule` call, not deferred to commit; the rest of the transaction remains usable.
- **Nested transactions refused**: calling `begin` while a transaction is open raises a structured error.
- **Commit-time atomicity**: if `commit` fails mid-application, engine state reverts to pre-`begin` (verified by snapshot-equality before `begin` and after the failed commit).
- **Post-commit visibility outside the tx**: after `commit`, facts and rules buffered inside the tx are observable to queries outside any transaction exactly as if asserted/defined outside a tx.

### 9.8 Cross-cutting properties

Universal properties spanning multiple operations:

- **Monotonicity** (absent retractions): adding facts never removes facts from the fixed point.
- **Idempotency of `derive`**: calling twice without intervening mutation produces the same state.
- **Determinism**: same inputs across runs produce the same outputs (also tested in §9.1).
- **Termination**: every well-stratified program terminates in bounded time.
- **Set semantics**: asserting the same fact twice produces a single EDB entry; deriving via multiple firing paths produces a single IDB entry.

### 9.9 Stress tests

- **Large fact stores**: 10k+ facts with realistic query patterns; full derivation completes within the §8 latency budget.
- **Deep recursion**: transitive closure on 1000+-element chains; bounded memory and time.
- **Many rules with shared bodies**: 100+ rules; join performance per the §8 budget.
- **Large transactions**: hundreds of buffered mutations per `begin`/`commit`; commit completes within budget without exceeding memory.

### 9.10 Failure modes

- **Cyclic negation refused at `defineRule`** (outside a transaction) with a structured error.
- **Cyclic negation refused at `defineRule` inside an open transaction** at the call that introduced the cycle, not deferred to commit; the rest of the transaction remains usable; subsequent `rollback` discards buffered mutations cleanly.
- **Malformed rules rejected** at `defineRule` (head not a positive atom; body atoms with wrong shape).
- **Duplicate `ruleId` rejected** at `defineRule` with a structured error.
- **Type errors caught** at `assertFact` when arguments are non-constants.
- **Nested `begin` refused** while a transaction is open.
- **Operations on a stale transaction handle**: `commit`/`rollback` on a handle that has already been committed or rolled back raises a structured error.
- **Malformed serialized input rejected** at `loadFrom` with a structured error and no partial-load side effects.
- **Programs exceeding memory budget**: do not silently corrupt state; raise a documented error or refuse the program at definition time.

---

## 10. Implementation notes

These are guidance for implementers, not contracts.

### 10.1 Language choice
JavaScript / TypeScript is the natural choice given the existing proof MCP is Node-based. The Engine has no third-party dependencies beyond the language standard library; this is intentional (minimizes audit surface, simplifies licensing).

### 10.2 Implementation size
500-800 lines for a clean implementation with stratified negation, indexes, and snapshot support. The reference algorithms are well-documented (Wikipedia's Datalog page, Abiteboul/Hull/Vianu textbook chapter on Datalog).

### 10.3 What NOT to add
- **Aggregations** (sum, count, min, max in head atoms): valuable but add complexity; defer until demonstrated need
- **User-defined functions in rule bodies**: tempting but breaks Datalog's purity; defer indefinitely
- **External fact sources**: keep all facts in-memory and Domain-supplied; external sources couple the Engine to I/O
- **Multi-threaded evaluation**: single-threaded semi-naive is adequate at expected scale; concurrency adds complexity without compensating benefit

### 10.4 What to consider adding later
- **Built-in comparison predicates** (`<`, `>`, `=`, `≠`) for body conditions: small addition, big ergonomic win
- **Magic-set rewriting** for query optimization: unlocks a class of efficient evaluations; only add if measured to matter
- **Incremental maintenance** (delta-based update rather than full rederivation): valuable for live-updating displays; defer until needed

---

## 11. Boundary contract summary

What the Domain can rely on from the Engine:
- Pure functions: same inputs produce same outputs
- Deterministic evaluation
- No I/O, no global state beyond what the Engine itself manages
- Termination on all well-formed programs
- Snapshot/restore preserves bit-equal state
- Transactional atomicity: between `begin()` and `commit()`, mutations are buffered; `rollback()` discards them cleanly
- Read-own-writes inside transactions: queries inside an open transaction see the transaction's own buffered mutations after `derive()` is called, or implicitly via the auto-derive on the next `query`/`count`/`exists` (§4.8)
- Stratification check is immediate at `defineRule`, including inside a transaction (§4.8)
- Errors raised as exceptions with structured data

What the Engine relies on from the Domain:
- Predicate names and argument types are consistent within a single Engine instance
- Stratification holds (no cycles through negation)
- Snapshots are not mutated externally
- Rule ids are unique within a single Engine instance
- Transactions are not nested (one open transaction per Engine instance at a time)

The Engine does not validate that predicate uses are consistent with element categories — that's Domain responsibility. The Engine treats `evidence(...)` and `proposition(...)` as just predicates with arguments.
