# Spec: Engine — Datalog Evaluator (Sprint-01 Proof Backend)

**Sprint:** 20260511-01-mp-redesign-proof-system / sprint-01-proof-backend
**Parent brief:** ../../design-documents/04-engine-spec.md
**Architecture:** Hybrid — single-pass delivery, modular file layout, semi-naive evaluation per §3.1, per-predicate positional indexes per §5.1, full-copy snapshot via `structuredClone`, provenance tracking from day one.

## Goal

Implement the pure Datalog evaluator that constitutes the Engine layer of the proof system. The Engine is generic over predicate symbols and value types, knows nothing about proof concepts, and exposes six substrate-facing ports (`IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction`) consumed by a future Domain layer. This sprint delivers a complete, spec-compliant engine in a single pass — every §11 boundary contract item is honored on first delivery, with all ~63 test obligations from Engine Spec §9 covered. The engine ships standalone (Migration Plan Phase 0) before Domain or Interface work begins.

## Components

New modules under `engine/`:

- `engine/FactStore.js` — EDB (base fact store) with predicate-keyed primary index and per-argument-position secondary indexes for fast join lookups; set semantics (no duplicate facts).
- `engine/RuleStore.js` — Rule store keyed by `ruleId`; secondary index by head predicate; stratification metadata per rule; runs stratification analysis at `defineRule` time.
- `engine/Stratifier.js` — Builds predicate dependency graph and computes stratum assignment via topological sort with cycle detection for negated edges; rejects cyclic-negation rule sets at definition time.
- `engine/Evaluator.js` — Semi-naive bottom-up fixed-point evaluation organized by stratum; produces IDB (derived set) with per-fact provenance `{ ruleId, bodyBindings }` for explain.
- `engine/Unifier.js` — Pattern matching for query evaluation and rule body matching; handles constants, named variables, and anonymous wildcards (`_`).
- `engine/TransactionBuffer.js` — Buffered-mutation container holding pending asserts, retracts, defines, undefines; provides the logical-EDB and logical-rule-store computations per ADR-0013 Part 2.
- `engine/Snapshot.js` — Implements `snapshot()` and `restore(token)` via `structuredClone` over the full engine state (EDB, rule store, IDB, provenance, derivation flag).
- `engine/Explain.js` — Implements `explain(fact)`; walks the provenance map recursively; returns a derivation tree or `null` for non-derived facts.
- `engine/Serializer.js` — Implements `serialize()` and `loadFrom(serialized)`; JSON-marshals EDB and rule store (IDB omitted, recomputed on load); schema-validates malformed input.
- `engine/Engine.js` — Thin facade aggregating the above modules; exposes the §4 public API; dispatches to ports.
- `engine/__tests__/` — Test suite organized by Engine Spec §9 subsection; uses Vitest with `describe/it/expect`; follows existing proof MCP conventions.
- `engine/package.json` — `"type": "module"`, no runtime dependencies, Vitest as the only dev dependency.

The Engine layer has no callers in this sprint — it ships standalone per Migration Plan §2 Phase 0 and is consumed by the Domain layer in sprint-02-proof-layer.

## Data Flow

Mutation → derive → query is the canonical flow:

- The Domain (in a future sprint) calls `assertFact(predicate, args)` and `defineRule(ruleId, head, body, metadata)` to populate the EDB and rule store.
- Each mutation marks the engine non-derived; subsequent reads trigger auto-derive.
- `derive()` runs semi-naive bottom-up evaluation, stratum by stratum: per stratum, iterate until no new facts derivable; across strata, lower strata reach fixed point before higher strata begin firing.
- `query(pattern)`, `count(pattern)`, `exists(pattern)` evaluate against the fixed point; auto-derive if state is non-derived.
- `explain(fact)` walks the provenance map to return a derivation tree.
- `snapshot()` captures full state; `restore(token)` reverts.
- Transactions wrap mutations: `begin()` opens a buffer; mutations accumulate; `derive()` computes against the logical view `(committed ∪ buffered)`; `commit()` flushes the buffer atomically; `rollback()` discards it.

## Error Handling

The Engine raises structured exceptions only — no untyped string throws. Every error is a plain object with a `code` string field and contextual data:

- `MALFORMED_RULE` — head not a positive atom, or body atoms with wrong shape.
- `CYCLIC_NEGATION` — rule set has a cycle through a negated edge; rejected at `defineRule` time (including inside an open transaction).
- `DUPLICATE_RULE_ID` — `defineRule` called with an already-used `ruleId`.
- `TYPE_ERROR` — `assertFact` called with non-constant argument (constants are string, number, boolean, null only).
- `NESTED_TRANSACTION` — `begin()` called while a transaction is already open.
- `STALE_HANDLE` — `commit`/`rollback` called on a handle that has already been committed or rolled back.
- `MALFORMED_SERIALIZED_INPUT` — `loadFrom` received input that failed schema validation; engine state is unchanged (no partial load).
- `MEMORY_BUDGET_EXCEEDED` — program would exceed the documented memory ceiling; refused at definition time rather than silently corrupting state.
- `NESTED_TRANSACTION_OP_REFUSED` — `clear()` or `loadFrom(...)` called while a transaction is open; the operation cannot run without first committing or rolling back the transaction.

Domain-specific error codes (e.g., `INVALID_CONSENT`, `PROOF_FINISHED`) are *not* the Engine's responsibility — those live in the Domain layer.

## Testing Strategy

- **Framework:** Vitest, matching the existing proof MCP (`vitest@^3.1.1`).
- **Layout:** `engine/__tests__/` with one test file per Engine Spec §9 subsection:
  - `evaluation.test.js` (§9.1)
  - `operations.test.js` (§9.2)
  - `query.test.js` (§9.3)
  - `explain.test.js` (§9.4)
  - `snapshot.test.js` (§9.5)
  - `lifecycle.test.js` (§9.6)
  - `transactions.test.js` (§9.7)
  - `properties.test.js` (§9.8)
  - `stress.test.js` (§9.9)
  - `failures.test.js` (§9.10)
- **Predicate names:** generic only (`p`, `q`, `parent`, `ancestor`) — no proof concepts.
- **Coverage target:** every §9 obligation has at least one passing test case; ~63 obligations total across the 10 subsections.
- **Stress assertions:** §9.9 stress tests enforce the §8 latency budgets (sub-ms fact ops, single-digit-ms queries, sub-second full derivation at 10k facts).
- **Property tests:** §9.8 properties (monotonicity, idempotency, determinism, termination, set semantics) tested as universal assertions over randomized inputs where appropriate; fixed sample programs otherwise.
- **No mocking of inner modules:** Engine tests use the real `FactStore`/`RuleStore`/`Evaluator`/etc. — tests exercise the engine as a unit. The `vi.mock()` pattern from the existing proof MCP is reserved for fs interactions, of which the engine has none.

## Constraints

- **No external runtime dependencies** (ADR-0002). The Engine imports nothing outside its own modules and JS standard library (Map, Set, JSON, structuredClone, Array).
- **ES modules** with `"type": "module"` in `package.json`, matching the existing proof MCP convention.
- **Semi-naive evaluation** per Engine Spec §3.1 — delta tracking between iterations; rules only fire on new facts.
- **Per-predicate positional indexes** per §5.1 — secondary indexes on each argument position for join lookups.
- **Stratification check at `defineRule` time**, including inside an open transaction (ADR-0013 Part 3).
- **Read-own-writes inside transactions** (ADR-0013 Part 2) — queries inside an open transaction see buffered mutations via the logical view.
- **Snapshot via `structuredClone`** for full-copy semantics (Node 17+ requirement); copy-on-write deferred to a future optimization sprint.
- **Snapshot inside an open transaction** captures the logical view (committed state plus buffered mutations), not just committed state. Restoring such a snapshot inside the same or a new transaction returns the engine to that logical view; restoring it after the transaction has been committed or rolled back returns the engine to the committed-only equivalent of that view.
- **Pattern wire format.** Query patterns and rule body atoms use a JSON-shaped array form: `[predicate, [arg1, arg2, ...]]`. Within the argument array, a position is a **variable** if its value is a plain object of shape `{var: "name"}`; a position is a **constant** if its value is a string, number, boolean, or `null`; the literal string `"_"` is the **anonymous wildcard**, matching the brief's §6 examples. Edge case: a Domain caller that needs to assert the literal string `"_"` as a constant value must use a different encoding (e.g., escape via `{constant: "_"}`); the engine reserves the bare `"_"` string for the wildcard sentinel in pattern and rule-body positions. The plan stage may refine this encoding if a more ergonomic option emerges, so long as the three concepts — variable, constant, wildcard — remain unambiguously distinguishable at the API boundary.
- **Per-fact provenance from day one** — IDB is a Map from tuple-key to `{ ruleId, bodyBindings }` fact-object, enabling explain without retrofit.
- **LOC budget:** target 700–850 LOC production code, on the high end of §10.2's 500–800 guidance (modular structure adds boilerplate but matches port segregation).
- **Sprint length:** 1–2 weeks single-developer per Migration Plan §2.
- **Single-threaded execution.** The Engine is not thread-safe; concurrent mutation from multiple JS threads (e.g., worker threads) is excluded per Engine Spec §10.3. Callers must serialize access externally if a multi-threaded host environment is introduced later.

## Non-Goals

- **Knowledge of proof concepts.** The Engine treats `evidence`, `proposition`, `approved` as just predicates with arguments; element categories, ratification, concerns, etc. are Domain-layer concerns.
- **Persistence to disk.** Engine state is in-memory; `serialize`/`loadFrom` produce/consume JSON values but do not touch the filesystem.
- **Network or filesystem I/O.** Excluded by §1.
- **Authority and consent enforcement.** Domain-layer concern.
- **Copy-on-write snapshots.** Deferred per §10.4 ("incremental maintenance ... defer until needed").
- **Aggregations (sum, count, min, max in head atoms).** Excluded per §10.3.
- **Built-in comparison predicates (`<`, `>`, `=`, `≠`) in rule bodies.** Deferred per §10.4.
- **User-defined functions in rule bodies.** Excluded per §10.3.
- **External fact sources.** Excluded per §10.3.
- **Multi-threaded evaluation.** Excluded per §10.3.
- **Magic-set rewriting.** Deferred per §10.4.
- **Incremental cross-call re-derivation.** Each `derive()` rebuilds the IDB from scratch within its own scope (with buffer-aware logical view inside transactions); cross-`derive()` incremental maintenance is deferred.
- **Multi-clause `explain` returning all supporting paths.** First supporting derivation only is the documented choice; multi-path explain is a future enhancement if needed.

## Acceptance Criteria

### AC-1.1 — assertFact stores and exposes a fact

**Observable boundary:**
- `factExists(predicate, args)` returns `true` for an asserted fact, `false` otherwise.
- `query` matching the asserted pattern returns the binding set including the asserted fact.

**Given:** an empty engine.
**When:** `assertFact("p", ["a", "b"])` is called.
**Then:** `factExists("p", ["a", "b"])` returns `true`; `query(["p", [X, Y]])` returns `[{X: "a", Y: "b"}]`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.2 — assertFact is idempotent

**Observable boundary:**
- Re-asserting an existing fact does not change EDB cardinality.
- `query` continues to return the binding exactly once.

**Given:** an engine with `p(a, b)` asserted.
**When:** `assertFact("p", ["a", "b"])` is called a second time.
**Then:** `query(["p", [X, Y]])` returns exactly one binding.

**Implementing tasks:**
**Decisions:**

### AC-1.3 — retractFact removes a base fact and cascades to derived facts

**Observable boundary:**
- After retracting and re-deriving, the fact and any derived facts that depended on it are absent from `query` results.
- Retracting an absent fact is idempotent (no error, no state change).

**Given:** `p(a, b)` asserted; rule `q(X) :- p(X, _)` defined; `derive()` called producing `q(a)`.
**When:** `retractFact("p", ["a", "b"])` is called, then `derive()` is called again.
**Then:** `query(["p", [X, Y]])` returns empty; `query(["q", [X]])` returns empty.

**Implementing tasks:**
**Decisions:**

### AC-1.4 — factExists distinguishes presence from absence

**Observable boundary:**
- Returns `true` for asserted base facts; `false` for facts that exist only in the derived set; `false` for never-asserted facts.
- Inside an open transaction, `factExists` reads against the logical EDB — i.e., `(committed-EDB ∪ buffered-asserts) − buffered-retracts` — matching the read-own-writes semantics of `query`/`count`/`exists`.

**Given:** `p(a, b)` asserted (base fact); `q(a)` derivable via rule (derived fact); `r(a)` never asserted.
**When:** `factExists("p", ["a", "b"])`, `factExists("q", ["a"])`, `factExists("r", ["a"])` are called.
**Then:** the calls return `true`, `false`, `false` respectively. (`factExists` checks the EDB only — derived facts are observable via `query`, not `factExists`.)

**Implementing tasks:**
**Decisions:**

### AC-1.5 — Predicate arity is part of predicate identity

**Observable boundary:**
- `p(a, b)` and `p(a, b, c)` are distinct facts under different relations.
- `query(["p", [X, Y]])` returns only the 2-arg facts; `query(["p", [X, Y, Z]])` returns only the 3-arg facts.

**Given:** `assertFact("p", ["a", "b"])` and `assertFact("p", ["a", "b", "c"])` both called.
**When:** `query(["p", [X, Y]])` and `query(["p", [X, Y, Z]])` are called.
**Then:** each query returns exactly the binding(s) matching its arity; cross-arity bindings are not returned.

**Implementing tasks:**
**Decisions:**

### AC-1.6 — Constants are restricted to string, number, boolean, null

**Observable boundary:**
- `assertFact` accepts arguments of types string, number, boolean, `null`.
- `assertFact` rejects functions, objects, arrays, undefined, complex terms with a `TYPE_ERROR` exception.

**Given:** an empty engine.
**When:** `assertFact("p", [{}])` or `assertFact("p", [() => {}])` or `assertFact("p", [undefined])` is called.
**Then:** a `TYPE_ERROR` is raised; the EDB is unchanged.

**Implementing tasks:**
**Decisions:**

### AC-2.1 — defineRule stores a rule observable via getRule

**Observable boundary:**
- After `defineRule`, `getRule(ruleId)` returns the rule's head, body, and metadata exactly as supplied.
- Metadata round-trips opaquely (the Engine does not inspect or interpret it).

**Given:** an empty engine.
**When:** `defineRule("r1", ["q", [X]], [["p", [X, Y]]], { domain_concept: "test" })` is called.
**Then:** `getRule("r1")` returns the rule object with head `["q", [X]]`, body `[["p", [X, Y]]]`, and metadata `{ domain_concept: "test" }`.

**Implementing tasks:**
**Decisions:**

### AC-2.2 — defineRule rejects duplicate ruleId

**Observable boundary:**
- A second `defineRule` call with an existing `ruleId` raises `DUPLICATE_RULE_ID`.
- The original rule remains intact.

**Given:** rule `r1` already defined.
**When:** `defineRule("r1", ...)` is called again with the same ruleId.
**Then:** a `DUPLICATE_RULE_ID` error is raised; `getRule("r1")` returns the original rule unchanged.

**Implementing tasks:**
**Decisions:**

### AC-2.3 — defineRule rejects malformed rules

**Observable boundary:**
- A rule whose head is not a positive atom (e.g., a constant, a negated atom) raises `MALFORMED_RULE`.
- A rule whose body atoms have wrong shape (e.g., missing predicate name, non-array args) raises `MALFORMED_RULE`.

**Given:** an empty engine.
**When:** `defineRule("r1", "not-an-atom", [...])` or `defineRule("r1", ..., [["malformed"]])` is called.
**Then:** a `MALFORMED_RULE` error is raised; the rule store is unchanged.

**Implementing tasks:**
**Decisions:**

### AC-2.4 — undefineRule removes a rule and cascades to derived facts

**Observable boundary:**
- After `undefineRule` and re-`derive`, facts produced only by that rule are absent from `query` results.
- Facts derivable via other rules are unaffected.

**Given:** rule `r1` produces `q(a)`; rule `r2` also produces `q(a)`; `derive()` has run.
**When:** `undefineRule("r1")` is called; `derive()` is called again.
**Then:** `query(["q", [X]])` still returns `[{X: "a"}]` (because `r2` still derives it).

**Implementing tasks:**
**Decisions:**

### AC-2.5 — Stratification check runs at defineRule time and rejects cyclic negation

**Observable boundary:**
- A rule set with a cycle through a negated edge raises `CYCLIC_NEGATION` at the `defineRule` call that introduces the cycle.
- The cycle path is named in the error data.
- The rule store is unchanged after the rejection.

**Given:** rule `r1: p(X) :- ¬q(X)` already defined.
**When:** `defineRule("r2", ["q", [X]], [["not", ["p", [X]]]], {...})` is called (closing the cycle).
**Then:** a `CYCLIC_NEGATION` error is raised; `getRule("r2")` returns no rule.

**Implementing tasks:**
**Decisions:**

### AC-3.1 — derive computes the fixed point of the current EDB and rule store

**Observable boundary:**
- After `derive()`, every fact derivable by exhaustive rule application is observable via `query`.
- The derived set is the minimal model.

**Given:** `parent(a,b)`, `parent(b,c)` asserted; rule `ancestor(X,Y) :- parent(X,Y)` and `ancestor(X,Y) :- parent(X,Z), ancestor(Z,Y)` defined.
**When:** `derive()` is called.
**Then:** `query(["ancestor", [X, Y]])` returns `[{X:"a",Y:"b"}, {X:"b",Y:"c"}, {X:"a",Y:"c"}]`.

**Implementing tasks:**
**Decisions:**

### AC-3.2 — derive is idempotent

**Observable boundary:**
- Two consecutive `derive()` calls without intervening mutation produce the same IDB.
- `query` results are unchanged between the two calls.

**Given:** an engine with a non-empty rule set and EDB; `derive()` has run.
**When:** `derive()` is called a second time.
**Then:** the IDB is bit-equal to its prior state; all `query` results are unchanged.

**Implementing tasks:**
**Decisions:**

### AC-3.3 — isDerived reflects mutation state

**Observable boundary:**
- `isDerived()` returns `true` immediately after `derive()` with no intervening mutation.
- Any mutation (assert, retract, define, undefine) makes `isDerived()` return `false` until the next `derive()`.

**Given:** an engine that has just called `derive()`; `isDerived()` returns `true`.
**When:** `assertFact("p", ["a"])` is called.
**Then:** `isDerived()` returns `false`; calling `derive()` then makes it return `true` again.

**Implementing tasks:**
**Decisions:**

### AC-3.4 — query, count, exists auto-derive when state is non-derived

**Observable boundary:**
- `query`/`count`/`exists` on a non-derived state implicitly trigger `derive()` and return up-to-date results.
- The caller does not need to call `derive()` explicitly between an assertion and a query.

**Given:** `parent(a,b)` asserted; rule `ancestor(X,Y) :- parent(X,Y)` defined; no explicit `derive()` called yet.
**When:** `query(["ancestor", [X, Y]])` is called.
**Then:** the query returns `[{X:"a",Y:"b"}]` (derive ran implicitly).

**Implementing tasks:**
**Decisions:**

### AC-3.5 — Semi-naive evaluation per §3.1

**Observable boundary:**
- The evaluator maintains a delta set across iterations; rules fire only on new facts.
- The fixed point reached is identical to what naive evaluation would produce (validated by cross-checking against a reference naive run on canonical programs).

**Given:** an engine with a multi-iteration rule set (e.g., transitive closure on a 100-element chain).
**When:** `derive()` is called.
**Then:** the IDB is equal to the naive-evaluation fixed point; instrumentation confirms each rule iteration fires only on new facts from the prior iteration's delta.

**Implementing tasks:**
**Decisions:**

### AC-4.1 — query pattern shapes: ground, variable, mixed

**Observable boundary:**
- Ground pattern (no variables) returns a boolean-equivalent: `[]` if absent, `[{}]` if present.
- Variable pattern returns all binding sets.
- Mixed pattern returns bindings for the variables, filtered by the constants.

**Given:** `p(a,b)`, `p(a,c)`, `p(d,e)` asserted.
**When:** `query(["p", ["a", "b"]])`, `query(["p", [X, Y]])`, `query(["p", ["a", Y]])` are called.
**Then:** results are `[{}]` (ground), 3 binding sets (variable), 2 binding sets with `Y` bound (mixed).

**Implementing tasks:**
**Decisions:**

### AC-4.2 — Anonymous wildcards (`_`) match without binding

**Observable boundary:**
- `_` in a query pattern matches any value at that position but does not produce a binding.
- `_` in a rule body atom matches any value at that position.

**Given:** `p(a,b)`, `p(a,c)` asserted.
**When:** `query(["p", ["a", "_"]])` is called.
**Then:** the result is `[{}, {}]` (two matches, no bindings produced for `_`).

**Implementing tasks:**
**Decisions:**

### AC-4.3 — count and exists are consistent with query

**Observable boundary:**
- For every pattern, `count(p) === query(p).length`.
- For every pattern, `exists(p) === (count(p) > 0)`.

**Given:** any non-trivial EDB and rule set.
**When:** `query(p)`, `count(p)`, `exists(p)` are called for any pattern `p`.
**Then:** the consistency invariant holds.

**Implementing tasks:**
**Decisions:**

### AC-5.1 — explain returns a derivation tree for derived facts

**Observable boundary:**
- For a derived fact, `explain(fact)` returns a tree whose root is the fact, leaves are EDB facts, and each non-leaf node names the rule that fired and the body bindings that satisfied it.
- For a fact not in the derived set, `explain` returns `null`.

**Given:** `parent(a,b)`, `parent(b,c)` asserted; ancestor rules defined; `derive()` has run.
**When:** `explain(["ancestor", ["a", "c"]])` is called.
**Then:** the returned tree shows the recursive-rule firing with body bindings `Z=b` and the two `parent` leaves; `explain(["ancestor", ["x", "y"]])` (not derived) returns `null`.

**Implementing tasks:**
**Decisions:**

### AC-5.2 — explain across retraction

**Observable boundary:**
- After retracting a supporting fact and re-deriving, `explain` for a no-longer-derived fact returns `null` (not a stale tree).

**Given:** state from AC-5.1 with `explain(["ancestor", ["a", "c"]])` returning a valid tree.
**When:** `retractFact("parent", ["b", "c"])` is called; `derive()` runs.
**Then:** `explain(["ancestor", ["a", "c"]])` returns `null`.

**Implementing tasks:**
**Decisions:**

### AC-5.3 — explain uses first-supporting-path provenance

**Observable boundary:**
- For a fact derivable via multiple rule firings, `explain` returns one consistent supporting path (the first one recorded during evaluation).
- The choice is deterministic — calling `explain` repeatedly returns the same tree.

**Given:** a fact `q(a)` derivable by both `r1` and `r2`.
**When:** `explain(["q", ["a"]])` is called multiple times.
**Then:** every call returns the same tree (the same supporting rule and bindings).

**Implementing tasks:**
**Decisions:**

### AC-6.1 — snapshot and restore round-trip preserves bit-equal state

**Observable boundary:**
- After `snap = snapshot(); mutate; restore(snap);`, the engine is observationally identical to its pre-snapshot state on every public API call (`factExists`, `query`, `count`, `exists`, `getRule`, `isDerived`).
- The derived set is preserved across snapshot/restore — no re-derivation required.

**Given:** an engine with EDB, rule store, and a derived IDB.
**When:** `snap = snapshot()`; arbitrary mutations are applied; `restore(snap)` is called.
**Then:** every public API call returns the same result as it did immediately before `snapshot()`.

**Implementing tasks:**
**Decisions:**

### AC-6.2 — Out-of-order restore discards intervening state

**Observable boundary:**
- Restoring an older snapshot after a newer one returns the engine to the older state.
- Intervening state is fully discarded.

**Given:** `snap1 = snapshot()`; mutations; `snap2 = snapshot()`; more mutations.
**When:** `restore(snap1)` is called.
**Then:** the engine matches the state at the time of `snap1`; the state at `snap2` and the post-`snap2` mutations are gone.

**Implementing tasks:**
**Decisions:**

### AC-6.3 — Snapshot survives clear

**Observable boundary:**
- A snapshot taken before `clear()` can be restored to recover the full pre-clear state.

**Given:** an engine with EDB and rules; `snap = snapshot()`.
**When:** `clear()` is called; `restore(snap)` is called.
**Then:** the engine returns to the pre-clear state on all observable APIs.

**Implementing tasks:**
**Decisions:**

### AC-7.1 — clear empties EDB and rule store

**Observable boundary:**
- After `clear()`, `factExists` returns `false` for all previously-asserted facts; `getRule` returns no rule for any previously-defined `ruleId`.
- `derive()` produces an empty IDB.

**Given:** an engine with EDB and rules.
**When:** `clear()` is called.
**Then:** all `factExists`, `getRule`, and `query` calls return empty/false results.

**Implementing tasks:**
**Decisions:**

### AC-7.2 — serialize and loadFrom round-trip

**Observable boundary:**
- `serialize()` returns a JSON-serializable value.
- `loadFrom(serialized)` on a fresh engine produces an engine that, after `derive()`, matches the original on every public API call.
- The IDB is not included in the serialized form (it recomputes on load).

**Given:** an engine `A` with EDB, rules, derived IDB.
**When:** `s = A.serialize()`; new engine `B`; `B.loadFrom(s)`; `B.derive()`.
**Then:** for all `(predicate, args)`, `A.factExists(...) === B.factExists(...)`; for all queries, `A.query(p)` and `B.query(p)` return equal binding sets.

**Implementing tasks:**
**Decisions:**

### AC-7.3 — loadFrom rejects malformed input without partial-load

**Observable boundary:**
- `loadFrom` on malformed input raises `MALFORMED_SERIALIZED_INPUT`.
- The engine state is unchanged from before the `loadFrom` call.

**Given:** a populated engine.
**When:** `loadFrom("not-valid-json")` or `loadFrom({ facts: "wrong-shape" })` is called.
**Then:** `MALFORMED_SERIALIZED_INPUT` is raised; every public API call returns the same result as before the failed `loadFrom`.

**Implementing tasks:**
**Decisions:**

### AC-7.4 — loadFrom on empty input produces an empty engine

**Observable boundary:**
- `loadFrom(emptyValid)` (a well-formed serialized empty engine) produces an engine equivalent to a freshly-constructed one or one that has just been `clear()`-ed.

**Given:** an empty serialized engine value (well-formed JSON with empty fact array and empty rule array).
**When:** `loadFrom(emptyValid)` is called on any engine.
**Then:** `derive()` produces an empty IDB; `factExists`, `getRule`, `query` all return empty/false.

**Implementing tasks:**
**Decisions:**

### AC-8.1 — Transaction lifecycle: begin, commit, rollback

**Observable boundary:**
- `begin()` returns a handle; subsequent mutations are not visible to queries outside the transaction.
- `commit(handle)` makes buffered mutations visible to all subsequent reads.
- `rollback(handle)` discards buffered mutations; the engine state is bit-equal to its pre-`begin` state.

**Given:** an engine with EDB `{p(a)}`.
**When:** `h = begin(); assertFact("p", ["b"]); query(["p", [X]])` (inside the tx); then `rollback(h)`; then `query(["p", [X]])` (outside the tx).
**Then:** the in-tx query returns 2 bindings (read-own-writes); the post-rollback query returns 1 binding (`p(a)` only); the engine is bit-equal to its pre-`begin` state.

**Implementing tasks:**
**Decisions:**

### AC-8.2 — Read-own-writes visibility (ADR-0013 Part 2)

**Observable boundary:**
- Inside an open transaction, `query`/`count`/`exists` see buffered mutations after `derive()` is called (or via auto-derive on next read).
- The logical view is `(committed-EDB ∪ buffered-asserts) − buffered-retracts` and `(committed-rules ∪ buffered-define) − buffered-undefine`.

**Given:** engine with `p(a)` committed; transaction open; `assertFact("p", ["b"])` and `defineRule("r", head, body)` buffered.
**When:** `query` for matching patterns is called inside the transaction.
**Then:** results include the buffered `p(b)` fact and facts derivable via the buffered rule `r`.

**Implementing tasks:**
**Decisions:**

### AC-8.3 — Stratification check inside a transaction (ADR-0013 Part 3)

**Observable boundary:**
- `defineRule` inside an open transaction runs stratification at the call site, not at commit.
- A cyclic-negation rule is rejected immediately; the rest of the transaction remains usable.

**Given:** a transaction is open with several rules already buffered; rules so far have no cyclic negation.
**When:** `defineRule` is called with a rule that would introduce a cycle through negation.
**Then:** `CYCLIC_NEGATION` is raised at the call; the prior buffered rules remain in the transaction; subsequent `commit()` succeeds without the bad rule.

**Implementing tasks:**
**Decisions:**

### AC-8.4 — Nested transactions refused

**Observable boundary:**
- A second `begin()` while a transaction is already open raises `NESTED_TRANSACTION`.
- The original transaction handle remains valid.

**Given:** a transaction is open via `h1 = begin()`.
**When:** `begin()` is called again.
**Then:** `NESTED_TRANSACTION` is raised; `commit(h1)` and `rollback(h1)` still function correctly on the original handle.

**Implementing tasks:**
**Decisions:**

### AC-8.5 — Operations on stale transaction handle refused

**Observable boundary:**
- `commit(h)` or `rollback(h)` on a handle that has already been committed or rolled back raises `STALE_HANDLE`.

**Given:** a transaction handle `h`; `commit(h)` has been called.
**When:** `commit(h)` is called again, or `rollback(h)` is called.
**Then:** `STALE_HANDLE` is raised; the engine state is unchanged.

**Implementing tasks:**
**Decisions:**

### AC-8.6 — Lifecycle and I/O operations inside an open transaction

**Observable boundary:**
- `clear()` inside an open transaction raises `NESTED_TRANSACTION_OP_REFUSED` (a structured error indicating the operation cannot run while a tx is open); the caller must `rollback` or `commit` first.
- `serialize()` inside an open transaction is permitted and returns the *logical view* (committed state plus buffered mutations) — matching the read-own-writes contract.
- `loadFrom(...)` inside an open transaction raises `NESTED_TRANSACTION_OP_REFUSED`; loading replaces engine state and conflicting with an open tx is unsafe.
- `restore(token)` inside an open transaction implicitly rolls back the transaction (the buffer is discarded) and then restores; subsequent operations are outside any transaction.

**Given:** an engine with an open transaction containing buffered mutations.
**When:** `clear()` or `loadFrom(...)` is called.
**Then:** `NESTED_TRANSACTION_OP_REFUSED` is raised; the engine state and transaction buffer are unchanged.

**Given:** an engine with an open transaction containing buffered mutations.
**When:** `serialize()` is called.
**Then:** the returned value reflects the logical view; subsequent `loadFrom(serialized)` (after the transaction is committed or rolled back) reproduces the engine at that logical-view state.

**Given:** an engine with an open transaction containing buffered mutations; `snap = snapshot()` was taken before the transaction opened.
**When:** `restore(snap)` is called.
**Then:** the open transaction is implicitly rolled back (no longer accessible via its handle); the engine state matches `snap`; the handle becomes stale.

**Implementing tasks:**
**Decisions:**

### AC-8.7 — Commit-time atomicity under failure

**Observable boundary:**
- If `commit()` fails mid-application (e.g., due to an internal error), the engine state reverts to its pre-`begin` state.
- A snapshot taken before `begin()` matches the engine state after a failed `commit()`.

**Given:** a transaction with several buffered mutations; a hypothetical failure injected during commit.
**When:** `commit(h)` raises.
**Then:** the engine state matches the pre-`begin` snapshot on every public API call.

**Implementing tasks:**
**Decisions:**

### AC-9.1 — Stratified negation correctness (canonical: same-generation cousins)

**Observable boundary:**
- For a same-generation-cousins program (negation over a recursive predicate), `derive()` produces the correct fixed point.
- Stratum-0 facts are fully derived before stratum-1 rules with negated literals fire.

**Given:** a parent fact set and rules for `ancestor(X,Y) :- parent(X,Y)`, `ancestor(X,Y) :- parent(X,Z), ancestor(Z,Y)`, `same_gen(X,Y) :- ancestor(Z,X), ancestor(Z,Y), ¬ancestor(X,Y), ¬ancestor(Y,X)`.
**When:** `derive()` is called.
**Then:** `query(["same_gen", [X, Y]])` returns exactly the cousins at the same depth from any common ancestor.

**Implementing tasks:**
**Decisions:**

### AC-9.2 — Canonical Datalog programs converge

**Observable boundary:**
- For each canonical program (transitive closure, reachability with cycles, multiple clauses per head, empty programs), `derive()` produces the documented expected fixed point.
- Test fixtures define the expected output per program.

**Given:** canonical Datalog programs from Engine Spec §9.1.
**When:** each program is loaded and `derive()` is called.
**Then:** `query` results match the documented expected fixed point for each program.

**Implementing tasks:**
**Decisions:**

### AC-9.3 — Determinism and insertion-order independence

**Observable boundary:**
- Same EDB + rule set across repeated runs produces the same IDB and the same query bindings.
- Asserting facts in different orders produces the same fixed point.

**Given:** a fixed program; two engine instances with the same facts asserted in different orders.
**When:** `derive()` is called on each.
**Then:** the two engines have bit-equal IDBs; every `query` call returns identical binding sets.

**Implementing tasks:**
**Decisions:**

### AC-9.4 — Negation interacting with retraction

**Observable boundary:**
- Retracting a positive fact that was supporting a *negated* literal in a higher-stratum rule causes the dependent negation-bearing derivation to update on next `derive()`.
- The cascade is mediated by stratum ordering: lower-stratum positive facts change, higher-stratum negation-dependent facts re-evaluate accordingly.

**Given:** `parent(a, b)` asserted; rule `r1: ancestor(X, Y) :- parent(X, Y)` (stratum 0) and rule `r2: leaf(X) :- node(X), ¬ancestor(X, _)` (stratum 1) defined; `node(a)` and `node(b)` asserted; `derive()` has run; `query(["leaf", [X]])` returns no rows for `a`.
**When:** `retractFact("parent", ["a", "b"])` is called; `derive()` runs.
**Then:** `query(["leaf", [X]])` now returns `[{X: "a"}]` (because no ancestor relation exists from `a`); the stratum-1 negation correctly re-evaluates against the updated stratum-0 EDB.

**Implementing tasks:**
**Decisions:**

### AC-10.1 — Monotonicity and set semantics

**Observable boundary:**
- Adding facts (without retracting) never reduces the IDB.
- Asserting the same fact twice produces a single EDB entry; deriving via multiple firing paths produces a single IDB entry.

**Given:** an engine with EDB and rules; `derive()` has run.
**When:** additional facts are asserted (no retractions) and `derive()` is called.
**Then:** the new IDB is a superset of the prior IDB; no fact appears with multiplicity > 1.

**Implementing tasks:**
**Decisions:**

### AC-10.2 — Termination on all well-stratified programs

**Observable boundary:**
- For every well-stratified program (i.e., every program that passes the stratification check at `defineRule` time), `derive()` terminates in bounded time.
- A test timeout that is never hit on the test suite is the operational verification.

**Given:** any well-stratified program in the canonical test corpus.
**When:** `derive()` is called.
**Then:** the call returns within a bounded time (test timeout); no infinite loops observed.

**Implementing tasks:**
**Decisions:**

### AC-11.1 — Stress: 10k facts with realistic queries within §8 budgets

**Observable boundary:**
- An engine populated with 10k facts and a realistic query workload completes `derive()` within the sub-second budget per §8.
- Individual `query` calls complete within single-digit milliseconds.

**Given:** a 10k-fact synthetic dataset with a representative query pattern set.
**When:** `derive()` and a sequence of `query` calls are timed.
**Then:** `derive()` completes in < 1 second; each `query` completes in < 10 ms.

**Implementing tasks:**
**Decisions:**

### AC-11.2 — Stress: deep recursion (1000-element transitive closure)

**Observable boundary:**
- Transitive closure on a 1000-element chain completes within bounded time and memory.
- The fixed point matches the analytic result (n × (n-1) / 2 reachability pairs for a linear chain).

**Given:** a `parent` chain of 1000 elements (`parent(0,1)`, `parent(1,2)`, ..., `parent(998,999)`).
**When:** `derive()` is called.
**Then:** `count(["ancestor", [X, Y]])` returns the analytic value; `derive()` completes within budget.

**Implementing tasks:**
**Decisions:**

### AC-11.3 — Stress: many rules with shared bodies

**Observable boundary:**
- An engine with 100+ rules whose bodies share common predicates completes `derive()` within bounded time and memory.
- Join performance scales linearly (or near-linearly) with the number of rules sharing body atoms; positional indexes per §5.1 are exercised heavily by this workload.

**Given:** 100 rules of form `qi(X) :- p(X), s(X)` (i = 1..100) with shared body predicates `p` and `s`; `p` and `s` populated with realistic fact sets.
**When:** `derive()` is called and a batch of `query` calls is timed.
**Then:** `derive()` completes within the §8 budget; per-query latency stays in single-digit milliseconds; the join-by-positional-index path is exercised (verifiable by instrumentation or by comparing against a no-index reference).

**Implementing tasks:**
**Decisions:**

### AC-11.4 — Stress: large transactions

**Observable boundary:**
- A single transaction with several hundred buffered mutations commits without exceeding memory budget.
- `commit()` completes within bounded time.

**Given:** an open transaction with 500 buffered asserts and 50 buffered defineRules.
**When:** `commit(h)` is called.
**Then:** the commit completes within the §8 budget; the engine state reflects all buffered mutations correctly.

**Implementing tasks:**
**Decisions:**

### AC-12.1 — All structured-error codes raised at the documented call sites

**Observable boundary:**
- Each of the nine error codes (`MALFORMED_RULE`, `CYCLIC_NEGATION`, `DUPLICATE_RULE_ID`, `TYPE_ERROR`, `NESTED_TRANSACTION`, `STALE_HANDLE`, `MALFORMED_SERIALIZED_INPUT`, `MEMORY_BUDGET_EXCEEDED`, `NESTED_TRANSACTION_OP_REFUSED`) is raised at the documented call site for the documented input shape.
- Each error carries a `code` string and any contextual fields documented in the error-model section.

**Given:** test fixtures crafted to trigger each error condition.
**When:** the triggering call is made.
**Then:** the exception's `code` field matches the documented value; engine state is unchanged after the throw (no partial side effects).

**Implementing tasks:**
**Decisions:**

### AC-13.1 — Engine has no external runtime dependencies

**Observable boundary:**
- `engine/package.json` declares no runtime dependencies (the `dependencies` block is empty or absent).
- The engine source files import nothing outside JS standard library and engine-internal modules.
- A `node --check` on every engine source file succeeds in a clean Node 17+ environment.

**Given:** the engine source tree.
**When:** dependencies are audited and a clean import check is run.
**Then:** no third-party imports are found; package.json's runtime-deps block is empty.

**Implementing tasks:**
**Decisions:**

### AC-13.2 — Six substrate ports are independently accessible

**Observable boundary:**
- The `Engine` facade exposes six named port surfaces — `IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction` — each of which can be referenced as an interface type and used independently.
- A consumer can hold a reference to `IQueryEngine` and `IExplain` alone (the audit-adapter dependency profile per ADR-0012) without depending on `IFactStore` or `ITransaction`.

**Given:** the engine module's exported types and the facade structure.
**When:** a hypothetical audit-only adapter is constructed depending on `IQueryEngine` and `IExplain` only.
**Then:** the adapter compiles/runs without reference to other ports; all required operations are accessible through those two ports alone.

**Implementing tasks:**
**Decisions:**

<!-- created-at: 2026-05-11T16:30:00Z -->
<!-- produced-by design-specify@v0003 -->
