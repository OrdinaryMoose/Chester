# Spec: Engine — Sprint-01 Deferred-Item Closure (Pass-2)

**Sprint:** 20260511-01-mp-redesign-proof-system / sprint-01-proof-backend-pass-2
**Parent brief:** ../design/sprint-01-proof-backend-pass-2-design-00.md
**Architecture:** Hybrid — layered acceptance criteria. Sprint-01's full acceptance-criteria set (sections 1–13) carries forward with surgical in-place amendments where the four tightenings change the contract. New sections 14–18 carry pass-2's deliverables grouped per deferment item (D1, D2, D3, D4) plus a fifth section for the D5-visibility artifact and sprint-level structural requirements.
**Supersedes:** sprint-01-proof-backend-spec-00.md

## Goal

Close four of the five deferment items inherited from sprint-01-proof-backend (D1: finite-constant rejection; D2: canonical rule-safety check at the rule-registry; D3: existential-quantification semantics for negated body atoms; D4: atomic `loadFrom` via snapshot/restore) by canonicalizing the tightenings already in code into the master cascade's architectural decision record sequence (ADR-0015 through ADR-0018), amending `04-engine-spec.md` in place with cross-references to those records, adding one small canonical-location code addition at `RuleStore.defineRule` (a new `UNSAFE_RULE` error code), removing the now-redundant defense-in-depth `UNBOUND_HEAD_VARIABLE` guard at `Evaluator.fireRule`, re-homing one test from the evaluator suite to the operations suite, and standing up a new engine-tier open-questions document that makes the deferred indexing-architecture question (D5) visible from the master cascade surface. The fifth deferment item (D5) is explicitly out of scope; it is deferred to a future pass-3 sub-sprint that will run a fresh design-large-task pass on Evaluator indexing architecture.

The behavioral contracts captured in this spec are not new — sprint-01's surgical fixes already corrected the underlying defects in code. The goal of pass-2 is to leave a self-explanatory archeological trail dense enough that a future reader, six months from now, can open the codebase cold and reconstruct why the engine has the shape it does without needing to discover the deferment doc by accident.

This spec is the canonical engine contract as of pass-2 close. It supersedes `sprint-01-proof-backend-spec-00.md`. Future-readers open this document to see the current engine contract; sprint-01's spec is the prior state.

## Components

The engine module set is unchanged from sprint-01. Pass-2 modifies the following files:

- `engine/RuleStore.js` — adds the canonical rule-safety check at `defineRule()` raising `UNSAFE_RULE` for rules whose head variables are not contained in the variables bound by non-negated body atoms (per ADR-0016).
- `engine/Evaluator.js` — removes the defense-in-depth `UNBOUND_HEAD_VARIABLE` guard at `fireRule()` (per ADR-0016 consequences); breadcrumb comment added at the `matchBodyAtom` negation branch (per ADR-0017).
- `engine/FactStore.js` — breadcrumb comment added at the `isConstant` finite-number check (per ADR-0015).
- `engine/Serializer.js` — breadcrumb comment added at the `loadEngineFrom` snapshot/restore wrap (per ADR-0018).
- `engine/__tests__/evaluation.test.js` — deletes the test asserting the evaluator's `UNBOUND_HEAD_VARIABLE` guard fires.
- `engine/__tests__/operations.test.js` — adds a test asserting `RuleStore.defineRule` raises `UNSAFE_RULE` on an unsafe rule.
- `engine/__tests__/failures.test.js` — adds an entry for `UNSAFE_RULE` to the error-code catalog tests.

Pass-2 produces these new master-cascade documents:

- `design-documents/ADR/0015-finite-constant-constraint.md` — D1.
- `design-documents/ADR/0016-canonical-rule-safety-check.md` — D2.
- `design-documents/ADR/0017-existential-quantification-negation-semantics.md` — D3.
- `design-documents/ADR/0018-atomic-load-from.md` — D4.
- `design-documents/engine-open-questions.md` — engine-tier open-questions document, one entry at creation for the IDB-indexing gap (D5).

Pass-2 amends `design-documents/04-engine-spec.md` in place, with inline parenthetical citations of the form `(See ADR-NNNN.)` at each amended passage, matching the existing amendment convention in that document.

## Data Flow

Unchanged from sprint-01. The canonical mutation → derive → query flow is preserved. The only data-flow-adjacent change is at rule definition time: a rule presented to `defineRule` is checked for safety (head variables ⊆ variables bound by non-negated body atoms) before stratification analysis runs. Unsafe rules are rejected before any stratification work is performed and before the rule is recorded.

## Error Handling

The Engine raises structured exceptions only — no untyped string throws. Every error is a plain object with a `code` string field and contextual data. Pass-2 modifies the error catalog as follows:

- `MALFORMED_RULE` — head not a positive atom, or body atoms with wrong shape. (Unchanged.)
- `CYCLIC_NEGATION` — rule set has a cycle through a negated edge; rejected at `defineRule` time (including inside an open transaction). (Unchanged.)
- `DUPLICATE_RULE_ID` — `defineRule` called with an already-used `ruleId`. (Unchanged.)
- `TYPE_ERROR` — `assertFact` called with non-constant argument. Constants are string, **finite** number, boolean, `null` only; `NaN`, `+Infinity`, and `-Infinity` are not finite and are rejected. (See ADR-0015.)
- `UNSAFE_RULE` — **new in pass-2.** `defineRule` called with a rule whose head contains a variable not bound by any non-negated body atom. The rule is rejected at definition time. The error object carries `{ code: 'UNSAFE_RULE', ruleId, unboundVars }` where `unboundVars` is an array of the offending variable names. (See ADR-0016.)
- `NESTED_TRANSACTION` — `begin()` called while a transaction is already open. (Unchanged.)
- `STALE_HANDLE` — `commit`/`rollback` called on a handle that has already been committed or rolled back. (Unchanged.)
- `MALFORMED_SERIALIZED_INPUT` — `loadFrom` received input that failed schema validation; engine state is unchanged (no partial load). (Unchanged.)
- `MEMORY_BUDGET_EXCEEDED` — program would exceed the documented memory ceiling; refused at definition time rather than silently corrupting state. (Unchanged.)
- `NESTED_TRANSACTION_OP_REFUSED` — `clear()` or `loadFrom(...)` called while a transaction is open. (Unchanged.)

The engine catalog grows from nine codes to ten with the addition of `UNSAFE_RULE`. The `UNBOUND_HEAD_VARIABLE` code introduced during sprint-01 as a defense-in-depth guard at `Evaluator.fireRule` was never part of the spec's error catalog at AC-12.1; it was an implementation-only code. Pass-2 removes the guard and the code disappears from the engine entirely. (See ADR-0016 consequences.)

Domain-specific error codes (e.g., `INVALID_CONSENT`, `PROOF_FINISHED`) are *not* the Engine's responsibility — those live in the Domain layer.

## Testing Strategy

- **Framework:** Vitest, matching the existing proof MCP (`vitest@^3.1.1`). Unchanged from sprint-01.
- **Layout:** `engine/__tests__/` with one test file per Engine Spec §9 subsection. Unchanged from sprint-01.
- **Pass-2 changes to specific test files:**
  - `evaluation.test.js` — the test asserting the evaluator's `UNBOUND_HEAD_VARIABLE` guard fires is deleted (the guard no longer exists).
  - `operations.test.js` — one new test added: `RuleStore.defineRule` raises `UNSAFE_RULE` on a rule whose head variable does not appear in any non-negated body atom.
  - `failures.test.js` — error-code catalog test gains an entry for `UNSAFE_RULE`. The total catalog covers ten codes (nine previously) plus `MEMORY_BUDGET_EXCEEDED` (noted but intentionally untested at the failures-suite level per sprint-01 convention).
- **Predicate names:** generic only (`p`, `q`, `parent`, `ancestor`) — no proof concepts. Unchanged from sprint-01.
- **Coverage target:** all 86 previously-passing tests continue to pass after pass-2's changes; AC-11.2 (`it.skip`) remains skipped pending D5 closure in pass-3. Net test-count delta: -1 (the deleted evaluator-guard test) +1 (the new operations-suite `UNSAFE_RULE` test) +1 (the new failures-suite catalog entry) = +1 net.

## Constraints

- **No external runtime dependencies** (ADR-0002). Unchanged from sprint-01.
- **ES modules** with `"type": "module"`. Unchanged from sprint-01.
- **Semi-naive evaluation** per Engine Spec §3.1. Unchanged from sprint-01.
- **Per-predicate positional indexes** per §5.1. Unchanged from sprint-01.
- **Stratification check at `defineRule` time**, including inside an open transaction (ADR-0013 Part 3). Unchanged from sprint-01.
- **Safety check at `defineRule` time** — **new in pass-2.** A rule whose head variable is not contained in the variables bound by non-negated body atoms is rejected with `UNSAFE_RULE` before stratification analysis runs. Variables appearing only in negated body atoms do not count as bound. (See ADR-0016.)
- **Read-own-writes inside transactions** (ADR-0013 Part 2). Unchanged from sprint-01.
- **Snapshot via `structuredClone`**. Unchanged from sprint-01.
- **Snapshot inside an open transaction** captures the logical view. Unchanged from sprint-01.
- **Pattern wire format.** Unchanged from sprint-01.
- **Per-fact provenance from day one**. Unchanged from sprint-01.
- **Constant set.** Constants are string, **finite** number, boolean, `null` only. `NaN`, `+Infinity`, and `-Infinity` are not finite and are rejected by `assertFact` with `TYPE_ERROR`. (See ADR-0015.)
- **LOC budget:** target 700–850 LOC production code. Pass-2 adds at most ~30 LOC (canonical safety check at `defineRule`, breadcrumb comments) and removes ~5 LOC (defense-in-depth guard at `fireRule`). Net LOC stays in budget.
- **Sprint length:** pass-2 is a short follow-up sub-sprint (1–3 days), substantially smaller than sprint-01's 1–2 week scope.
- **Single-threaded execution.** Unchanged from sprint-01.
- **Sprint-01 folder untouched.** `sprint-01-proof-backend/` is treated as a frozen historical record. No file inside that folder is modified, added, or deleted by pass-2.
- **Engine-spec amendments cross-reference architectural decision records.** Each in-place amendment to `04-engine-spec.md` includes an inline parenthetical citation `(See ADR-NNNN...)` matching the existing convention.
- **Breadcrumb comments are single-line.** Each breadcrumb comment references its architectural decision record by number plus a four-to-eight-word failure-mode phrase. Multi-line rationale at the comment site is prohibited (would duplicate the architectural decision record and invite drift).

## Non-Goals

Unchanged from sprint-01 with two additions:

- **Knowledge of proof concepts.** (Unchanged.)
- **Persistence to disk.** (Unchanged.)
- **Network or filesystem I/O.** (Unchanged.)
- **Authority and consent enforcement.** (Unchanged.)
- **Copy-on-write snapshots.** (Unchanged.)
- **Aggregations (sum, count, min, max in head atoms).** (Unchanged.)
- **Built-in comparison predicates (`<`, `>`, `=`, `≠`) in rule bodies.** (Unchanged.)
- **User-defined functions in rule bodies.** (Unchanged.)
- **External fact sources.** (Unchanged.)
- **Multi-threaded evaluation.** (Unchanged.)
- **Magic-set rewriting.** (Unchanged.)
- **Incremental cross-call re-derivation.** (Unchanged.)
- **Multi-clause `explain` returning all supporting paths.** (Unchanged.)
- **D5 — Evaluator IDB indexing architecture.** Out of scope for pass-2. Deferred to pass-3 (a fresh design-large-task pass on Evaluator indexing). Visible from pass-2 only via the new `design-documents/engine-open-questions.md` entry.
- **Same-generation test laxity.** Out of scope. The canonical Datalog `same_gen` test in AC-9.1 passes with looser assertions because the engine lacks an inequality primitive. Per the sprint-01 deferment doc's recommendation, this is left as-is — adding inequality support is a separate expressive-power change with downstream consequences for the proof and presentation layers.
- **Serialize-during-transaction visibility contract.** Out of scope. The residual question of whether `serialize()` during an open transaction should return the read-own-writes view (current behavior) or the committed-as-of-`begin()` view is not raised in this spec; if it surfaces as a concern, a future sub-sprint may address it.

## Acceptance Criteria

The acceptance-criteria layout is hybrid (per Architecture statement above). Sections 1 through 13 carry forward from sprint-01 with surgical in-place amendments at AC-1.6, AC-2.6 (new), AC-7.3, AC-9.4, and AC-12.1. Sections 14 through 18 are pass-2-specific and group deliverables by deferment item plus a fifth structural section.

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

### AC-1.6 — Constants are restricted to string, finite number, boolean, null

**(Pass-2 amendment: tightened from "number" to "finite number" with explicit rejection of NaN, +Infinity, -Infinity. See ADR-0015.)**

**Observable boundary:**
- `assertFact` accepts arguments of types string, **finite** number, boolean, `null`.
- `assertFact` rejects `NaN`, `+Infinity`, `-Infinity`, functions, objects, arrays, undefined, complex terms with a `TYPE_ERROR` exception.

**Given:** an empty engine.
**When:** `assertFact("p", [NaN])`, `assertFact("p", [Infinity])`, `assertFact("p", [-Infinity])`, `assertFact("p", [{}])`, `assertFact("p", [() => {}])`, or `assertFact("p", [undefined])` is called.
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

### AC-2.6 — defineRule rejects unsafe rules

**(Pass-2 addition: new behavioral acceptance criterion for the canonical rule-safety check at the rule-registry. See ADR-0016.)**

**Observable boundary:**
- A rule whose head contains a variable not bound by any non-negated body atom raises `UNSAFE_RULE` at the `defineRule` call.
- The error carries `{ code: 'UNSAFE_RULE', ruleId, unboundVars }` where `unboundVars` is an array naming the offending variable(s).
- Variables appearing only in negated body atoms do not count as bound.
- The safety check runs before stratification analysis and before the rule is recorded; the rule store is unchanged after rejection.
- An equivalent rule whose head variables are all bound by some non-negated body atom is accepted.

**Given:** an empty engine.
**When:** `defineRule("r1", ["q", [{var: "X"}, {var: "Y"}]], [["p", [{var: "X"}]]], {})` is called — head variable `Y` does not appear in any body atom.
**Then:** an `UNSAFE_RULE` error is raised with `unboundVars` containing `"Y"`; `getRule("r1")` returns no rule; the rule store is unchanged.

**Given:** an empty engine.
**When:** `defineRule("r1", ["q", [{var: "X"}]], [["not", ["p", [{var: "X"}]]]], {})` is called — head variable `X` appears only in a negated body atom.
**Then:** an `UNSAFE_RULE` error is raised with `unboundVars` containing `"X"`; the rule is not stored.

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
- The fixed point reached is identical to what naive evaluation would produce.

**Given:** an engine with a multi-iteration rule set (e.g., transitive closure on a 100-element chain).
**When:** `derive()` is called.
**Then:** the IDB is equal to the naive-evaluation fixed point; instrumentation confirms each rule iteration fires only on new facts from the prior iteration's delta.

**Implementing tasks:**
**Decisions:**

### AC-4.1 — query pattern shapes: ground, variable, mixed

**Observable boundary:**
- Ground pattern returns `[]` if absent, `[{}]` if present.
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
- After `snap = snapshot(); mutate; restore(snap);`, the engine is observationally identical to its pre-snapshot state on every public API call.
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

### AC-7.3 — loadFrom is atomic on malformed input or mid-replay failure

**(Pass-2 amendment: atomicity guarantee broadened from shallow-schema failures only to all replay failures. See ADR-0018.)**

**Observable boundary:**
- `loadFrom` on input that fails schema validation raises `MALFORMED_SERIALIZED_INPUT`; the engine state is unchanged.
- `loadFrom` on input that passes schema validation but produces a mid-replay failure (e.g., a fact with `NaN` triggering `TYPE_ERROR`; a rule violating `MALFORMED_RULE`, `DUPLICATE_RULE_ID`, `CYCLIC_NEGATION`, or `UNSAFE_RULE` during rule replay) raises the underlying error; the engine state is restored to its pre-`loadFrom` state via the snapshot/restore mechanism.
- The atomicity guarantee is unconditional: regardless of where in the replay the failure occurs, no partial-load state is observable on any subsequent public API call.

**Given:** a populated engine.
**When:** `loadFrom("not-valid-json")` is called (shallow-schema failure).
**Then:** `MALFORMED_SERIALIZED_INPUT` is raised; every public API call returns the same result as before the failed `loadFrom`.

**Given:** a populated engine.
**When:** `loadFrom(serialized)` is called with a `serialized` value that passes schema validation but contains a fact whose argument is `NaN`.
**Then:** `TYPE_ERROR` is raised at the fact-assertion replay step; engine state is bit-equal to the pre-`loadFrom` state on every public API call.

**Given:** a populated engine.
**When:** `loadFrom(serialized)` is called with a `serialized` value that contains a rule with `CYCLIC_NEGATION` or `UNSAFE_RULE` shape.
**Then:** the respective error is raised at the rule-replay step; engine state is bit-equal to the pre-`loadFrom` state.

**Implementing tasks:**
**Decisions:**

### AC-7.4 — loadFrom on empty input produces an empty engine

**Observable boundary:**
- `loadFrom(emptyValid)` produces an engine equivalent to a freshly-constructed one or one that has just been `clear()`-ed.

**Given:** an empty serialized engine value.
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

**Given:** a transaction is open with several rules already buffered.
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
- `clear()` inside an open transaction raises `NESTED_TRANSACTION_OP_REFUSED`.
- `serialize()` inside an open transaction is permitted and returns the logical view.
- `loadFrom(...)` inside an open transaction raises `NESTED_TRANSACTION_OP_REFUSED`.
- `restore(token)` inside an open transaction implicitly rolls back the transaction and then restores.

**Given:** an engine with an open transaction containing buffered mutations.
**When:** `clear()` or `loadFrom(...)` is called.
**Then:** `NESTED_TRANSACTION_OP_REFUSED` is raised; the engine state and transaction buffer are unchanged.

**Given:** an engine with an open transaction containing buffered mutations.
**When:** `serialize()` is called.
**Then:** the returned value reflects the logical view.

**Given:** an engine with an open transaction; `snap = snapshot()` was taken before the transaction opened.
**When:** `restore(snap)` is called.
**Then:** the open transaction is implicitly rolled back; the engine state matches `snap`; the handle becomes stale.

**Implementing tasks:**
**Decisions:**

### AC-8.7 — Commit-time atomicity under failure

**Observable boundary:**
- If `commit()` fails mid-application, the engine state reverts to its pre-`begin` state.
- A snapshot taken before `begin()` matches the engine state after a failed `commit()`.

**Given:** a transaction with several buffered mutations; a hypothetical failure injected during commit.
**When:** `commit(h)` raises.
**Then:** the engine state matches the pre-`begin` snapshot on every public API call.

**Implementing tasks:**
**Decisions:**

### AC-9.1 — Stratified negation correctness (canonical: same-generation cousins)

**Observable boundary:**
- For a same-generation-cousins program, `derive()` produces the correct fixed point.
- Stratum-0 facts are fully derived before stratum-1 rules with negated literals fire.
- The test fixture tolerates self-pairs (`{X: a, Y: a}`) in the result because the engine lacks an inequality primitive to exclude them; strict same-generation semantics requires `X ≠ Y` support, which is out of scope (see Non-Goals).

**Given:** a parent fact set and rules for `ancestor`, `same_gen`.
**When:** `derive()` is called.
**Then:** `query(["same_gen", [X, Y]])` returns at minimum the cousins at the same depth from any common ancestor; self-pairs may be present and are accepted per the test's loose assertion form.

**Implementing tasks:**
**Decisions:**

### AC-9.2 — Canonical Datalog programs converge

**Observable boundary:**
- For each canonical program (transitive closure, reachability with cycles, multiple clauses per head, empty programs), `derive()` produces the documented expected fixed point.

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

### AC-9.4 — Negation interacting with retraction (existential quantification on unbound atom variables)

**(Pass-2 amendment: existential-quantification semantics for unbound variables in negated body atoms made explicit. See ADR-0017.)**

**Observable boundary:**
- Retracting a positive fact that was supporting a negated literal in a higher-stratum rule causes the dependent negation-bearing derivation to update on next `derive()`.
- Unbound variables in negated body atoms are existentially quantified: `¬p(X, Y)` with `X` bound and `Y` unbound holds for the current binding of `X` if and only if there is no value of `Y` such that `p(X, Y)` is in the EDB or derived set. The negation branch implements this via unify-then-consistency-check on each candidate fact, not substitute-then-unify with `undefined` placeholders.

**Given:** `parent(a, b)` asserted; rule `r1: ancestor(X, Y) :- parent(X, Y)` (stratum 0); rule `r2: leaf(X) :- node(X), ¬ancestor(X, Y)` (stratum 1) — `Y` in `r2`'s body is unbound and existentially quantified; `node(a)` and `node(b)` asserted; `derive()` has run.
**When:** `query(["leaf", [X]])` is called.
**Then:** `query` does NOT return `{X: a}` because `ancestor(a, b)` exists for some `Y` (namely `Y = b`), so the existential `¬ancestor(a, Y)` fails. After `retractFact("parent", ["a", "b"])` and re-derive, `query(["leaf", [X]])` returns `[{X: "a"}, {X: "b"}]` (or equivalent) because no ancestor relations exist from either node.

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
- For every well-stratified, well-safety-checked program, `derive()` terminates in bounded time.

**Given:** any well-stratified, safety-respecting program in the canonical test corpus.
**When:** `derive()` is called.
**Then:** the call returns within a bounded time; no infinite loops observed.

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

**(Pass-2 status: remains skipped pending D5 closure in pass-3. See `design-documents/engine-open-questions.md` for the architectural rationale.)**

**Observable boundary:**
- Transitive closure on a 1000-element chain completes within bounded time and memory.
- The fixed point matches the analytic result.

**Given:** a `parent` chain of 1000 elements.
**When:** `derive()` is called.
**Then:** `count(["ancestor", [X, Y]])` returns the analytic value; `derive()` completes within budget.

**Implementing tasks:**
**Decisions:**

### AC-11.3 — Stress: many rules with shared bodies

**Observable boundary:**
- An engine with 100+ rules whose bodies share common predicates completes `derive()` within bounded time and memory.

**Given:** 100 rules of form `qi(X) :- p(X), s(X)`.
**When:** `derive()` is called and a batch of `query` calls is timed.
**Then:** `derive()` completes within the §8 budget; per-query latency stays in single-digit milliseconds.

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

**(Pass-2 amendment: catalog grows from nine codes to ten; UNSAFE_RULE added. See ADR-0016.)**

**Observable boundary:**
- Each of the ten error codes (`MALFORMED_RULE`, `CYCLIC_NEGATION`, `DUPLICATE_RULE_ID`, `TYPE_ERROR`, `UNSAFE_RULE`, `NESTED_TRANSACTION`, `STALE_HANDLE`, `MALFORMED_SERIALIZED_INPUT`, `MEMORY_BUDGET_EXCEEDED`, `NESTED_TRANSACTION_OP_REFUSED`) is raised at the documented call site for the documented input shape.
- Each error carries a `code` string and any contextual fields documented in the error-model section.
- `UNBOUND_HEAD_VARIABLE` is NOT in this catalog. The defense-in-depth guard at `Evaluator.fireRule` that raised this code in sprint-01 is removed in pass-2; the code no longer exists anywhere in the engine.

**Given:** test fixtures crafted to trigger each error condition.
**When:** the triggering call is made.
**Then:** the exception's `code` field matches the documented value; engine state is unchanged after the throw.

**Implementing tasks:**
**Decisions:**

### AC-13.1 — Engine has no external runtime dependencies

**Observable boundary:**
- `engine/package.json` declares no runtime dependencies.
- The engine source files import nothing outside JS standard library and engine-internal modules.

**Given:** the engine source tree.
**When:** dependencies are audited and a clean import check is run.
**Then:** no third-party imports are found; package.json's runtime-deps block is empty.

**Implementing tasks:**
**Decisions:**

### AC-13.2 — Six substrate ports are independently accessible

**Observable boundary:**
- The `Engine` facade exposes six named port surfaces — `IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction` — each of which can be referenced and used independently.

**Given:** the engine module's exported types and the facade structure.
**When:** a hypothetical audit-only adapter is constructed depending on `IQueryEngine` and `IExplain` only.
**Then:** the adapter compiles/runs without reference to other ports.

**Implementing tasks:**
**Decisions:**

### AC-14.1 — ADR-0015 exists and documents the finite-constant constraint

**(Pass-2 deliverable, D1.)**

**Observable boundary:**
- File `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0015-finite-constant-constraint.md` exists.
- The file contains all sections matching the established ADR template: YAML frontmatter (status, date, deciders, related_docs, related_adrs), Status, Context, Decision, Rationale, Consequences (Positive / Negative / Neutral), Alternatives considered, What would change the decision, References.
- The Context section names the failure mode: silent fact-key collisions via `JSON.stringify` serializing `NaN`, `+Infinity`, and `-Infinity` to `null`, colliding with legitimately-null-valued facts.
- The Decision section states the tightening: constants are restricted to string, finite number, boolean, `null`; non-finite numerical values raise `TYPE_ERROR`.

**Given:** the master cascade ADR directory.
**When:** the file is read.
**Then:** all named sections are present; the Decision is consistent with AC-1.6's amended observable boundary.

**Implementing tasks:**
**Decisions:**

### AC-14.2 — Engine-tier specification carries the finite-constant amendment

**(Pass-2 deliverable, D1.)**

**Observable boundary:**
- `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` carries an in-place amendment at the constant-type definition (wherever the spec enumerates constant types) reading "finite number" (or equivalent excluding `NaN`, `+Infinity`, `-Infinity`).
- The amendment includes an inline parenthetical citation `(See ADR-0015.)` immediately after the amended phrase.
- No other content in the affected section is removed.

**Given:** `04-engine-spec.md` post-amendment.
**When:** `grep -n "ADR-0015" 04-engine-spec.md` is run.
**Then:** the citation appears at the constant-type definition; surrounding spec content is preserved.

**Implementing tasks:**
**Decisions:**

### AC-14.3 — FactStore.js carries the D1 breadcrumb comment

**(Pass-2 deliverable, D1.)**

**Observable boundary:**
- `FactStore.js` contains a single-line comment at the `isConstant` finite-number check that references ADR-0015 and includes a four-to-eight-word failure-mode phrase.
- No multi-line rationale appears at the comment site.

**Given:** the engine source tree.
**When:** `grep -n "ADR-0015" FactStore.js` is run.
**Then:** exactly one line matches, located at the `Number.isFinite` check inside `isConstant`; the comment is a single line; the failure-mode phrase is four to eight words.

**Implementing tasks:**
**Decisions:**

### AC-15.1 — ADR-0016 exists and documents the canonical rule-safety check

**(Pass-2 deliverable, D2.)**

**Observable boundary:**
- File `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0016-canonical-rule-safety-check.md` exists with all standard sections.
- The Context section names the failure mode: silent fact-key collisions via `JSON.stringify` serializing `undefined` head-variable substitutions to `null`, producing poisoned IDB entries.
- The Decision section states the placement: the safety check lives at `RuleStore.defineRule`, raises `UNSAFE_RULE` with `{ code, ruleId, unboundVars }`, and runs before stratification analysis.
- The Consequences section explicitly names the removal of the defense-in-depth `UNBOUND_HEAD_VARIABLE` guard at `Evaluator.fireRule` as part of the decision.

**Given:** the master cascade ADR directory.
**When:** the file is read.
**Then:** all sections are present; the consequences section names the guard removal; the Decision is consistent with AC-2.6.

**Implementing tasks:**
**Decisions:**

### AC-15.2 — Engine-tier specification carries the D2 amendments

**(Pass-2 deliverable, D2.)**

**Observable boundary:**
- `04-engine-spec.md` carries an in-place amendment at the `defineRule` description (or equivalent rule-definition contract section) stating the safety condition: head variables must be contained in the variables bound by non-negated body atoms; violation raises `UNSAFE_RULE`.
- `04-engine-spec.md`'s error catalog (or equivalent enumeration) gains an `UNSAFE_RULE` entry with the structured shape.
- Both amendments include inline `(See ADR-0016.)` citations.

**Given:** `04-engine-spec.md` post-amendment.
**When:** `grep -n "ADR-0016\|UNSAFE_RULE" 04-engine-spec.md` is run.
**Then:** both the safety-condition clause and the error-catalog entry are present; each carries the ADR citation.

**Implementing tasks:**
**Decisions:**

### AC-15.3 — RuleStore.defineRule rejects unsafe rules with UNSAFE_RULE

**(Pass-2 deliverable, D2. Behavioral contract is duplicated at AC-2.6; this AC verifies the implementation site and the structured error shape.)**

**Observable boundary:**
- `RuleStore.defineRule(rule)` computes the set of variable names bound by non-negated body atoms.
- If any head variable is not in that set, `defineRule` raises `{ code: 'UNSAFE_RULE', ruleId, unboundVars }` where `unboundVars` is the array of offending variable names.
- The check runs before `validateRule`'s structural check completes its work that would proceed to stratification, and before any change to the rule store.

**Given:** an empty engine.
**When:** `defineRule("r1", ["q", [{var: "X"}, {var: "Y"}]], [["p", [{var: "X"}]]], {})` is called.
**Then:** the throw has `code === 'UNSAFE_RULE'`, `ruleId === "r1"`, `unboundVars` containing `"Y"`; `getRule("r1")` returns no rule.

**Implementing tasks:**
**Decisions:**

### AC-15.4 — UNBOUND_HEAD_VARIABLE references are removed from engine source

**(Pass-2 deliverable, D2. Expanded from "Evaluator.fireRule guard removal" to include the stale comment reference in Serializer.js — both are byproducts of the canonical-check-at-defineRule decision.)**

**Observable boundary:**
- `Evaluator.js` contains no reference to `UNBOUND_HEAD_VARIABLE` (the defense-in-depth guard at `fireRule` is fully removed, including the `if (headArgs.some(a => a === undefined))` block at Evaluator.js:120-122).
- `Serializer.js` contains no reference to `UNBOUND_HEAD_VARIABLE` — the atomic-load contract comment at lines 41-44 currently lists the possible mid-replay error codes as `(TYPE_ERROR / MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION / UNBOUND_HEAD_VARIABLE on a rule)`. The comment is updated to reflect the post-pass-2 error set: `(TYPE_ERROR / MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION / UNSAFE_RULE on a rule)`.
- No other file in `engine/` references `UNBOUND_HEAD_VARIABLE`.

**Given:** the engine source tree post-amendment.
**When:** `grep -rn "UNBOUND_HEAD_VARIABLE" engine/` is run (excluding test files, which AC-15.5 and AC-15.7 cover separately).
**Then:** no matches in any production source file.

**Implementing tasks:**
**Decisions:**

### AC-15.5 — evaluation.test.js no longer asserts the evaluator guard fires

**(Pass-2 deliverable, D2.)**

**Observable boundary:**
- `__tests__/evaluation.test.js` no longer contains the test that constructs an unsafe rule and asserts `derive()` throws `UNBOUND_HEAD_VARIABLE`.
- The file's test count decreases by exactly one.

**Given:** the test source tree post-amendment.
**When:** `grep -n "UNBOUND_HEAD_VARIABLE" evaluation.test.js` is run; `npx vitest run __tests__/evaluation.test.js` is run.
**Then:** no matches for the error code; the test file reports one fewer test than in sprint-01 (9 tests instead of 10).

**Implementing tasks:**
**Decisions:**

### AC-15.6 — operations.test.js asserts RuleStore.defineRule raises UNSAFE_RULE

**(Pass-2 deliverable, D2.)**

**Observable boundary:**
- `__tests__/operations.test.js` contains a new test asserting `RuleStore.defineRule` (or via `Engine.defineRule`) raises `{ code: 'UNSAFE_RULE', ruleId, unboundVars }` on a rule whose head variable does not appear in any non-negated body atom.
- The test passes.
- The file's test count increases by exactly one.

**Given:** the test source tree post-amendment.
**When:** `grep -n "UNSAFE_RULE" operations.test.js` is run; `npx vitest run __tests__/operations.test.js` is run.
**Then:** the new test is present and passes; the test file reports one more test than in sprint-01 (21 tests instead of 20).

**Implementing tasks:**
**Decisions:**

### AC-15.7 — failures.test.js error-code catalog includes UNSAFE_RULE and excludes UNBOUND_HEAD_VARIABLE

**(Pass-2 deliverable, D2.)**

**Observable boundary:**
- `__tests__/failures.test.js` contains an `it(...)` block exercising the `UNSAFE_RULE` error code in the catalog tests.
- The test passes.
- `__tests__/failures.test.js` contains no reference to `UNBOUND_HEAD_VARIABLE` (the code no longer exists; the catalog must not assert it).
- The total number of `it(...)` blocks in failures.test.js increases by exactly one relative to sprint-01.

**Given:** the test source tree post-amendment.
**When:** `grep -n "UNSAFE_RULE" failures.test.js` is run; `grep -n "UNBOUND_HEAD_VARIABLE" failures.test.js` is run; `npx vitest run __tests__/failures.test.js` is run.
**Then:** the new catalog test is present and passes; no matches for `UNBOUND_HEAD_VARIABLE`; failures.test.js reports 9 tests instead of 8.

**Implementing tasks:**
**Decisions:**

### AC-15.8 — RuleStore.js carries the D2 breadcrumb comment

**(Pass-2 deliverable, D2.)**

**Observable boundary:**
- `RuleStore.js` contains a single-line comment at the `defineRule` safety check that references ADR-0016 and includes a four-to-eight-word failure-mode phrase.

**Given:** the engine source tree.
**When:** `grep -n "ADR-0016" RuleStore.js` is run.
**Then:** exactly one line matches, located at the safety check inside `defineRule`; the comment is a single line; the failure-mode phrase is four to eight words.

**Implementing tasks:**
**Decisions:**

### AC-16.1 — ADR-0017 exists and documents the existential-quantification negation semantics

**(Pass-2 deliverable, D3.)**

**Observable boundary:**
- File `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017-existential-quantification-negation-semantics.md` exists with all standard sections.
- The Context section names the failure mode: substitute-then-unify treating unbound variables in negated atoms as literal `undefined`, causing the negation to incorrectly succeed when an existentially-bound match exists.
- The Decision section states the unify-then-consistency-check approach.

**Given:** the master cascade ADR directory.
**When:** the file is read.
**Then:** all sections are present; the Decision is consistent with AC-9.4's amended observable boundary.

**Implementing tasks:**
**Decisions:**

### AC-16.2 — Engine-tier specification states the existential-quantification semantics

**(Pass-2 deliverable, D3.)**

**Observable boundary:**
- `04-engine-spec.md` carries an in-place amendment at the negation-as-failure semantics section (wherever the spec describes the negation branch's evaluation) explicitly stating that unbound variables in negated body atoms are existentially quantified.
- The amendment includes an inline `(See ADR-0017.)` citation.

**Given:** `04-engine-spec.md` post-amendment.
**When:** `grep -n "ADR-0017" 04-engine-spec.md` is run.
**Then:** the citation appears at the NAF-semantics passage; surrounding content is preserved.

**Implementing tasks:**
**Decisions:**

### AC-16.3 — Evaluator.js carries the D3 breadcrumb comment

**(Pass-2 deliverable, D3.)**

**Observable boundary:**
- `Evaluator.js` contains a single-line comment at the `matchBodyAtom` negation branch that references ADR-0017 and includes a four-to-eight-word failure-mode phrase.

**Given:** the engine source tree.
**When:** `grep -n "ADR-0017" Evaluator.js` is run.
**Then:** exactly one line matches, located at the negation branch in `matchBodyAtom`; the comment is a single line; the failure-mode phrase is four to eight words.

**Implementing tasks:**
**Decisions:**

### AC-17.1 — ADR-0018 exists and documents the atomic loadFrom

**(Pass-2 deliverable, D4.)**

**Observable boundary:**
- File `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0018-atomic-load-from.md` exists with all standard sections.
- The Context section names the failure mode: mid-replay failures (e.g., `TYPE_ERROR` on a fact with `NaN`; `MALFORMED_RULE` / `CYCLIC_NEGATION` / `UNSAFE_RULE` on a replayed rule) leaving the engine in a partially-loaded state, violating the AC-7.3 atomicity contract.
- The Decision section states the snapshot/restore wrap as the resolution.

**Given:** the master cascade ADR directory.
**When:** the file is read.
**Then:** all sections are present; the Decision is consistent with AC-7.3's amended observable boundary.

**Implementing tasks:**
**Decisions:**

### AC-17.2 — Engine-tier specification carries the AC-7.3 atomicity amendment

**(Pass-2 deliverable, D4.)**

**Observable boundary:**
- `04-engine-spec.md` carries an in-place amendment at the AC-7.3 atomicity contract (or equivalent passage describing `loadFrom`'s state guarantee on failure) explicitly stating that engine state is unchanged for any failure mode, not only shallow-schema failures.
- The amendment includes an inline `(See ADR-0018.)` citation.

**Given:** `04-engine-spec.md` post-amendment.
**When:** `grep -n "ADR-0018" 04-engine-spec.md` is run.
**Then:** the citation appears at the atomicity passage.

**Implementing tasks:**
**Decisions:**

### AC-17.3 — Serializer.js carries the D4 breadcrumb comment

**(Pass-2 deliverable, D4.)**

**Observable boundary:**
- `Serializer.js` contains a single-line comment at the `loadEngineFrom` snapshot/restore wrap that references ADR-0018 and includes a four-to-eight-word failure-mode phrase.

**Given:** the engine source tree.
**When:** `grep -n "ADR-0018" Serializer.js` is run.
**Then:** exactly one line matches, located at the `engine.snapshot()`/`engine.restore(rollback)` wrap inside `loadEngineFrom`; the comment is a single line; the failure-mode phrase is four to eight words.

**Implementing tasks:**
**Decisions:**

### AC-18.1 — engine-open-questions.md exists with the IDB-indexing entry

**(Pass-2 deliverable, D5 visibility.)**

**Observable boundary:**
- File `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md` exists.
- The file contains one entry titled with the IDB-indexing gap.
- The entry includes: problem shape (one or two paragraphs); why-it-matters-now (operational consequence); what's-known-about-the-fix (cross-reference to the deferment doc's architectural sketch); closure channel (pass-3 named explicitly); date opened (2026-05-12 or pass-2's actual creation date).

**Given:** the master cascade design-documents directory.
**When:** the file is read.
**Then:** all five named fields are present in the entry; the closure channel names "pass-3".

**Implementing tasks:**
**Decisions:**

### AC-18.2 — All previously-passing engine tests continue to pass

**(Pass-2 deliverable, sprint-level structural.)**

**Observable boundary:**
- Sprint-01 baseline (pre-pass-2): 86 passing + 1 skipped (AC-11.2) = 87 total test invocations.
- Pass-2 deltas: `-1` evaluator-guard test deleted (AC-15.5), `+1` operations UNSAFE_RULE test (AC-15.6), `+1` failures UNSAFE_RULE catalog test (AC-15.7) = net `+1` test invocation.
- Pass-2 expected counts (post-pass-2): 87 passing + 1 skipped (AC-11.2) = 88 total test invocations.
- AC-11.2 remains skipped (`it.skip` annotation preserved).
- Binding requirement (overrides exact-count math if the implementer chooses a slightly different test-decomposition pattern): no test that previously passed regresses, no new test fails, AC-11.2 stays skipped.

**Given:** the engine workspace.
**When:** `npx vitest run` is executed from `skills/design-large-task/engine/`.
**Then:** the output shows 0 failing tests, 1 skipped test (AC-11.2), all other tests passing; no regressions relative to sprint-01.

**Implementing tasks:**
**Decisions:**

### AC-18.3 — Sprint-01 folder is untouched

**(Pass-2 deliverable, sprint-level structural.)**

**Observable boundary:**
- After all pass-2 changes are committed on the `sprint-01-proof-backend-pass-2` branch, `git diff main -- 'docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/'` returns empty output.
- No file inside that folder is modified, added, or deleted by any pass-2 commit.

**Given:** the pass-2 worktree on branch `sprint-01-proof-backend-pass-2`.
**When:** `git diff main -- 'docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/'` is run.
**Then:** no output; the sprint-01 folder is byte-equal between the two branches.

**Implementing tasks:**
**Decisions:**

<!-- created-at: 2026-05-12T06:00:00Z -->
<!-- produced-by design-specify@v0003 -->
