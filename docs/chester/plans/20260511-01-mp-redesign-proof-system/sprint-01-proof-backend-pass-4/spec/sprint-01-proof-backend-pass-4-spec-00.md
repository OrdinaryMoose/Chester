# Spec: Sprint-01 Proof Backend Pass-4 (Engine Public API Alignment)

**Sprint:** `20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4`
**Parent brief:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/design/sprint-01-proof-backend-pass-4-design-00.md`
**Architecture:** Hybrid — extracted `RuleAtomTranslator.js` production module (Architect A) + `__tests__/helpers/defineRuleObj.js` incremental test-migration helper (Architect B).

---

## Goal

Bring the engine's public API at `skills/design-large-task/engine/` into literal compliance with `04-engine-spec.md` §4. Two operations diverge: `Engine.defineRule(rule)` (one-arg object) must become `Engine.defineRule(ruleId, headAtom, bodyAtoms, metadata)` (four positional with tuple-format atoms); `Engine.explain(predicate, args)` (two-arg) must become `Engine.explain(fact)` (one-arg tuple). The serializer's on-disk format also switches to the public tuple form, eliminating the implicit contract drift between persisted state and the engine's stated API.

The hybrid choice means: tuple↔object translation lives in a new dedicated module (`RuleAtomTranslator.js`) shared between `Engine.js` and `Serializer.js`; the ~11 test files that need migration use a temporary `defineRuleObj` helper (deleted in a final cleanup commit) so the suite stays green at every commit.

## Components

### Production code (new + modified)

| File | Status | Role | Target LOC |
|------|--------|------|-----------|
| `skills/design-large-task/engine/RuleAtomTranslator.js` | **NEW** | Translation between tuple form (public) and object form (internal). Exports `tupleAtomToInternal(tuple)`, `tupleRuleToInternal(ruleId, headTuple, bodyTuples, metadata)`, `internalRuleToTuple(rule)`. No imports from other engine modules. | ~55 |
| `skills/design-large-task/engine/Engine.js` | Modified | `defineRule(ruleId, headAtom, bodyAtoms, metadata)` calls `tupleRuleToInternal` then forwards internal-shape object to `this._rules.defineRule(internalRule)`. `explain(fact)` destructures `[predicate, args] = fact` and calls existing `explainFact`. | +~10 |
| `skills/design-large-task/engine/Serializer.js` | Modified | `serializeEngine` maps each internal rule through `internalRuleToTuple` for on-disk output. `loadEngineFrom` validates new on-disk shape and calls `engine.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata)` matching the new public signature. `isValidSerialized` validator updated for tuple-shape inputs. | ~+5 / -2 |
| `skills/design-large-task/engine/RuleStore.js` | **Unchanged** | Internal `{predicate, arity, args, negated}` shape; `defineRule(rule)` private surface still takes a single internal-shape object. Stratification check, safety check, duplicate-rule-id detection, by-head index — all untouched. | 0 |
| `skills/design-large-task/engine/Unifier.js` | **Unchanged** | `'_'` wildcard handling and `{var}` variable handling already in place. | 0 |
| `skills/design-large-task/engine/Explain.js` | **Unchanged** | `explainFact(predicate, args, ...)` still takes two args; `Engine.explain(fact)` destructures before calling. | 0 |
| `skills/design-large-task/engine/Snapshot.js` | **Unchanged** | Snapshot/restore unaffected. | 0 |
| `skills/design-large-task/engine/Evaluator.js` | **Unchanged** | Internal object-form rule consumer. | 0 |
| `skills/design-large-task/engine/Stratifier.js` | **Unchanged** | Internal cycle-through-negation detection. | 0 |
| `skills/design-large-task/engine/FactStore.js` | **Unchanged** | Fact ops unaffected. | 0 |

**Production LOC delta: ~+70 LOC net** across one new file and two modified files. File count grows by exactly one (9→10).

### Test infrastructure (new helper + 11 migrated test files)

| File | Status | Role |
|------|--------|------|
| `skills/design-large-task/engine/__tests__/helpers/defineRuleObj.js` | **NEW (temporary)** | `defineRuleObj(target, ruleObj)` performs inverse translation (internal object → tuple) so tests retain existing object-shape literals during migration. `target` is an Engine instance. Companion `explainTuple(engine, predicate, args)` calls `engine.explain([predicate, args])` for `explain`-call migration. Deleted in final cleanup commit. |
| `__tests__/snapshot.test.js` | Migrated (1 Engine-level callsite) | First file converted; lowest risk. |
| `__tests__/properties.test.js` | Migrated (3 callsites) | Simple, no negation. |
| `__tests__/explain.test.js` | Migrated (2 defineRule + 6 explain callsites) | Covers both surface changes. |
| `__tests__/lifecycle.test.js` | Migrated (4 callsites) | Includes serialization round-trip test — validates on-disk shape decision. |
| `__tests__/query.test.js` | Migrated (3 callsites) | |
| `__tests__/stress.test.js` | Migrated (4 callsites) | Includes one in-loop callsite. |
| `__tests__/transactions.test.js` | Migrated (3 callsites) | Includes ADR-0013 cyclic-negation-inside-tx test — load-bearing for AC-7.1 below. |
| `__tests__/failures.test.js` | Migrated (5 callsites) | Includes MALFORMED_RULE test (must assert new API rejects bad tuple-shape input). |
| `__tests__/evaluator-indexing.test.js` | Migrated (3 Engine-level callsites; 3 RuleStore-level callsites exempt) | Mixed file; only Engine callsites migrate. |
| `__tests__/evaluation.test.js` | Migrated (Engine-level subset of 14 mixed callsites) | Largest file; RuleStore-level calls stay object-form throughout. |

**Files exempt from migration** (zero Engine-level callsites, no work needed):
- `__tests__/DerivedPositionalIndex.test.js` — pure internal module tests.
- `__tests__/candidates-for.test.js` — uses `ruleStore.defineRule` directly (internal, unchanged).
- `__tests__/operations.test.js` — all 17 callsites are `rs.defineRule` on RuleStore directly.

## Data Flow

### `Engine.defineRule(ruleId, headAtom, bodyAtoms, metadata)`

1. Engine class method receives the four positional args.
2. Calls `RuleAtomTranslator.tupleRuleToInternal(ruleId, headAtom, bodyAtoms, metadata)`. This:
   - Validates the tuple shape (throws `MALFORMED_RULE` on bad input — non-array atoms, non-string predicates, `null`/`undefined` in args, malformed `['not', x]` wrapper, etc.).
   - For the **head atom**, builds `{predicate, arity: args.length, args: translatedArgs}` — heads are always positive; no `negated` field. (If the caller passes `['not', ...]` as the head, the translator throws `MALFORMED_RULE` with payload `field: 'head'` — heads cannot be negated.)
   - For each **body atom**: if `[predicate, args]`, builds `{predicate, arity: args.length, args: translatedArgs, negated: false}`. If `['not', innerAtom]`, recursively translates `innerAtom` and sets `negated: true` on the result. Doubly-nested `['not', ['not', atom]]` throws `MALFORMED_RULE`.
   - Translates each arg: bare uppercase string (`'X'`, `'NAME'`, etc.) → `{var: 'X'}`; literal `'_'` passes through unchanged as the anonymous wildcard; underscore-prefixed strings like `'_foo'` pass through as ground constants (only the bare `'_'` is the wildcard); anything else (number, lowercase string, etc.) passes through as a ground constant. `null` and `undefined` in args throw `MALFORMED_RULE`.
   - Returns `{ruleId, head: <translated head>, body: <translated body atoms>, metadata}`.
3. Forwards the resulting internal-shape object to `this._rules.defineRule(internalRule)` — the existing private `RuleStore.defineRule` path with its existing validation, safety check, stratification check, and storage.

Markdirty (`_markDirty()`) fires after the rule-store call returns.

### `Engine.explain(fact)`

1. Engine class method receives one arg: `fact = [predicate, args]`.
2. Destructures: `const [predicate, args] = fact`.
3. Calls existing `explainFact(predicate, args, this._derived, this._rules, this._facts)` — `Explain.js` is untouched.

If `fact` is malformed (not a two-element array, predicate not a string, etc.), the destructure produces `undefined` values which the existing `explainFact` already handles by returning null. No new error code introduced.

### Serialization round-trip

1. **Serialize:** `serializeEngine` reads internal rules from `_snapshot()`. Each rule passes through `RuleAtomTranslator.internalRuleToTuple(rule)` which produces `{ruleId, headAtom, bodyAtoms, metadata}` with tuple atoms, bare uppercase-string variables, `'_'` wildcards, `['not', atom]` negation wrappers. The on-disk JSON is this tuple form.
2. **Load:** `loadEngineFrom` validates the on-disk shape (each rule has `ruleId`, `headAtom`, `bodyAtoms`, `metadata`; atoms are tuple-shaped). For each rule, calls `engine.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata)` — going through the public translation path, identical to any other caller.

### Test migration via helper

1. Engine refactor commit changes `Engine.defineRule` and `Engine.explain` signatures.
2. In the same commit, every Engine-level callsite in the 11 test files is wrapped through `defineRuleObj(engine, oldObjectLiteral)` or `explainTuple(engine, predicate, args)`. Suite stays green.
3. Subsequent commits convert files one at a time from helper-wrapped object form to direct tuple-form calls.
4. Final cleanup commit deletes the helper file once all 11 files use direct calls. Grep confirms no remaining `defineRuleObj` or `explainTuple` references.

## Error Handling

Preserved (no behavior change):

- `MALFORMED_RULE` — thrown when the tuple shape is invalid: head atom is not a two-element array, predicate is not a string, body atom shape is malformed, `['not', x]` wrapper has non-atom inner value, etc. Translator detects and throws before reaching `RuleStore`.
- `UNSAFE_RULE` — head variable not bound by any non-negated body atom. Detected by existing `RuleStore.checkSafety` (unchanged), running on the translated internal-form rule.
- `DUPLICATE_RULE_ID` — existing `RuleStore.defineRule` duplicate check (unchanged).
- `CYCLIC_NEGATION` — existing `Stratifier` detection (unchanged), triggered at `defineRule` time per ADR-0013 Part 3, whether inside or outside a transaction.
- All other existing error codes (`NESTED_TRANSACTION_OP_REFUSED`, `UNBOUND_HEAD_VARIABLE`, etc.) preserved exactly.

New error category:

- **Translator-stage `MALFORMED_RULE`** is the *only* new throw site. It runs *before* the rule store sees the rule, so the order of error detection becomes: tuple-shape validation → translation → store-level validation → safety check → duplicate check → stratification check. The error code is `MALFORMED_RULE` matching the existing engine convention; payloads include a `stage: 'translator'` discriminator for diagnostic clarity.

## Testing Strategy

### Three test scopes

**1. Translator unit tests (new file: `__tests__/RuleAtomTranslator.test.js`)** — Isolated tests against `RuleAtomTranslator` exports. Covers: bare uppercase string → `{var}` conversion; `'_'` wildcard passthrough; `['not', atom]` negation unwrap; arity computation from args.length; round-trip fidelity `internalRuleToTuple(tupleRuleToInternal(...))`; `MALFORMED_RULE` on bad input shapes (non-array head, non-string predicate, etc.).

**2. Engine integration tests (existing 14 test files; 11 migrated)** — All existing behavioral coverage retained: stratification, safety, duplicate detection, query/derive correctness, snapshot/restore round-trip, serialization round-trip, transaction semantics including ADR-0013 cyclic-negation-inside-tx, read-own-writes, lifecycle (clear/loadFrom). After migration, all callsites use tuple form directly (or via helper during transition).

**3. Helper sunset enforcement** — A final commit removes `__tests__/helpers/defineRuleObj.js` and `explainTuple` companion. Grep confirms zero remaining `defineRuleObj`/`explainTuple` references in test sources.

### Test count

Sprint-01-pass-3 baseline: 107 tests across 14 files. Sprint-1.5 adds translator unit tests (estimated ~12 tests). No existing tests removed. Final count: ~119 tests across 15 files.

## Constraints

- `04-engine-spec.md` §4 is normative. Every public-API decision matches the document literally.
- ADR-0013 Part 3 preserved: stratification check fires at `defineRule` call, including inside an open transaction. The translator runs first; if it throws `MALFORMED_RULE`, no rule reaches the store and no stratification check fires (correct — the rule is malformed before stratification semantics apply).
- ADR-0013 Part 2 preserved: read-own-writes transaction visibility unchanged.
- All existing engine error codes (`MALFORMED_RULE`, `UNSAFE_RULE`, `DUPLICATE_RULE_ID`, `CYCLIC_NEGATION`, `UNBOUND_HEAD_VARIABLE`, `NESTED_TRANSACTION_OP_REFUSED`) preserved with identical semantics.
- No new dependencies. `package.json` unchanged unless a patch-level version bump is desired.
- LOC budget: ~115 LOC net of new infrastructure (translator + helper + Engine/Serializer modifications). 11 test-file migrations are additive — they edit existing files rather than adding new ones.
- Test helper is temporary: tracked for deletion in a final cleanup commit. A spec-level structural test asserts the helper is gone before sprint close.

## Non-Goals

- **Internal engine data structures.** `RuleStore`, `Unifier`, `Stratifier`, `Evaluator`, `Explain`, `FactStore`, `Snapshot` keep their `{predicate, arity, args: [{var}|constant|'_'], negated}` representation. The translation seam is exclusively at the engine class public boundary and at the serializer.
- **Engine spec document edits.** `04-engine-spec.md` is the source of truth this pass aligns the code to. No spec text changes.
- **New engine functionality.** No new ports, operations, validation, or ADRs. This is alignment, not feature work.
- **Sprint-02 Domain layer code.** Addressed when sprint-02 resumes after this pass merges.
- **Sprint-02's substrate fake.** Will be revised when sprint-02 resumes — out of scope here.
- **AST-based test verification.** Not introduced.

---

## Acceptance Criteria

### AC-1.1 — Engine module count grows by exactly one

**Observable boundary:**
- `skills/design-large-task/engine/` contains exactly 10 production source files (was 9 in pass-3): the 9 existing files plus `RuleAtomTranslator.js`.

**Given:** the engine alignment is complete.
**When:** the engine directory is listed.
**Then:** exactly 10 `.js` files (excluding `__tests__/`); `RuleAtomTranslator.js` is present; all 9 pre-existing files are present and named unchanged.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Production LOC delta within budget

**Observable boundary:**
- Net production LOC change ≤ 150 (well inside the brief's 150-200 ceiling).
- `RuleAtomTranslator.js` LOC ≤ 80.

**Given:** the engine alignment is complete.
**When:** non-blank non-comment LOC is counted for new + modified production files.
**Then:** total delta ≤ 150; `RuleAtomTranslator.js` ≤ 80 LOC.

**Implementing tasks:**

**Decisions:**

### AC-2.1 — `Engine.defineRule` signature matches `04-engine-spec.md` §4.2

**Observable boundary:**
- `Engine.defineRule(ruleId, headAtom, bodyAtoms, metadata)` accepts four positional arguments matching the engine spec.
- `headAtom` is `[predicate, args]` with `args` an array; `bodyAtoms` is `Array<[predicate, args]> | Array<['not', [predicate, args]]>`.
- Calling with valid inputs successfully defines a rule (rule appears via `getRule`).

**Given:** a fresh `Engine` instance.
**When:** `engine.defineRule('r1', ['p', ['X']], [['q', ['X']]], { source: 'test' })` is called.
**Then:** `engine.getRule('r1')` returns the rule with the same `ruleId` and internal-shape head and body.

**Implementing tasks:**

**Decisions:**

### AC-2.2 — `Engine.defineRule` rejects malformed tuple input with `MALFORMED_RULE`

**Observable boundary:**
- Calling `defineRule` with a non-array `headAtom`, a non-string predicate, a non-array `bodyAtoms`, or a malformed `['not', x]` wrapper throws an error with `code: 'MALFORMED_RULE'` and a `stage: 'translator'` payload field.

**Given:** a fresh `Engine` instance.
**When:** `engine.defineRule('r1', 'not-an-array', [], {})` is called.
**Then:** throws `{code: 'MALFORMED_RULE', stage: 'translator', ...}`. The rule is not stored; `engine.getRule('r1')` returns undefined.

**Implementing tasks:**

**Decisions:**

### AC-3.1 — `Engine.explain` signature matches `04-engine-spec.md` §4.5

**Observable boundary:**
- `Engine.explain(fact)` accepts one argument: `fact = [predicate, args]`.
- Returns the derivation tree for the fact, or `null` if the fact is not in the derived set.

**Given:** a populated engine with a derivable fact `['ancestor', ['a', 'c']]`.
**When:** `engine.explain(['ancestor', ['a', 'c']])` is called.
**Then:** returns a non-null derivation tree object.

**Implementing tasks:**

**Decisions:**

### AC-3.2 — `Engine.explain` returns `null` for absent facts

**Observable boundary:**
- Calling `explain` with a `[predicate, args]` tuple that is not in the derived set returns `null`.

**Given:** an engine without facts for predicate `'ancestor'`.
**When:** `engine.explain(['ancestor', ['x', 'y']])` is called.
**Then:** returns `null`. No throw.

**Implementing tasks:**

**Decisions:**

### AC-4.1 — Translator handles all three atom-arg kinds

**Observable boundary:**
- `RuleAtomTranslator.tupleAtomToInternal(['p', ['X', '_', 'concrete']])` returns `{predicate: 'p', arity: 3, args: [{var: 'X'}, '_', 'concrete'], negated: false}`.
- A bare uppercase string becomes `{var: <string>}`. `'_'` passes through unchanged. Anything else passes through as a ground constant.

**Given:** the translator module exists.
**When:** unit tests in `RuleAtomTranslator.test.js` exercise each arg kind.
**Then:** each kind produces the documented internal representation.

**Implementing tasks:**

**Decisions:**

### AC-4.2 — Translator handles `['not', atom]` negation wrapper

**Observable boundary:**
- `tupleAtomToInternal(['not', ['p', ['X']]])` returns `{predicate: 'p', arity: 1, args: [{var: 'X'}], negated: true}`.
- Nested `['not', ['not', atom]]` is rejected as `MALFORMED_RULE`. **Rationale:** Engine spec §6.2 documents the negation form as a single outer wrapper; double-negation has no documented semantics in the engine. Rejecting at the translator boundary fails fast at the spec-undefined input rather than letting it propagate to the rule store as a flat positive atom.

**Given:** the translator module exists.
**When:** unit tests exercise the negation wrapper.
**Then:** single negation produces the negated internal atom; double negation throws `MALFORMED_RULE`.

**Implementing tasks:**

**Decisions:**

### AC-4.2a — Wildcard unification end-to-end

**Observable boundary:**
- A rule whose `bodyAtoms` contains a wildcard `'_'` at position N (e.g., `['evidence', ['evid_3', '_', '_']]`) successfully unifies against any concrete value at position N during evaluation.
- The wildcard does not bind a variable — different `'_'` occurrences in the same atom do not require the same value.

**Given:** an engine with a rule using `'_'` at one or more body-atom positions, and facts asserted whose values at those positions vary.
**When:** queries that depend on the rule are evaluated.
**Then:** the rule fires for any matching binding of the non-wildcard positions, regardless of what concrete values appear at the wildcard positions. (Existing unifier behavior — this AC documents that the new translation path preserves it end-to-end.)

**Implementing tasks:**

**Decisions:**

### AC-4.3 — Round-trip fidelity: `internalRuleToTuple` ∘ `tupleRuleToInternal` is identity

**Observable boundary:**
- For any valid public-form rule, translating to internal form and back to tuple form produces a structurally-equivalent rule (same `ruleId`, same head shape, same body atoms in same order, same metadata).

**Given:** a public-form rule with mixed variables, wildcards, constants, and negation.
**When:** `internalRuleToTuple(tupleRuleToInternal(...))` is computed.
**Then:** the result is structurally equivalent to the input.

**Implementing tasks:**

**Decisions:**

### AC-5.1 — Serialization round-trip preserves rule fidelity

**Observable boundary:**
- A rule defined via the new public API, then serialized via `engine.serialize()`, then loaded into a fresh engine via `engine.loadFrom(serialized)`, fires identically against the same input facts.
- The serialized JSON contains tuple-form atoms with bare uppercase-string variables and `'_'` wildcards and `['not', atom]` negation — not the internal `{predicate, arity, args}` form.

**Given:** a rule `engine.defineRule('r1', ['p', ['X']], [['q', ['X']], ['not', ['r', ['X']]]], {})` is defined and facts are asserted such that the rule should fire on input `'a'` but not on input `'b'`.
**When:** `engine.serialize()` is called, the result is loaded into a fresh `Engine` via `loadFrom`, and the same input facts are asserted in the new engine.
**Then:** the loaded engine produces the same query results (`exists(['p', ['a']])` returns true; `exists(['p', ['b']])` returns false). The serialized JSON, inspected directly, contains `bodyAtoms: [["q", ["X"]], ["not", ["r", ["X"]]]]` (or equivalent — tuple-shaped, not object-shaped).

**Implementing tasks:**

**Decisions:**

### AC-5.2 — Serializer's deserialization invokes the public `Engine.defineRule` signature

**Observable boundary:**
- `Serializer.js`'s `loadEngineFrom` calls `engine.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata)` — the new 4-arg public signature.
- A grep across `Serializer.js` finds no calls to `engine.defineRule(r)` (the old 1-arg form).

**Given:** the engine alignment is complete.
**When:** `Serializer.js` is read.
**Then:** the deserialization path calls the 4-arg form; no 1-arg call remains.

**Implementing tasks:**

**Decisions:**

### AC-5.3 — Serialization schema version bumps; old blobs rejected

**Observable boundary:**
- `serializeEngine` emits `version: 2` (was `1`).
- `loadEngineFrom` rejects any serialized blob whose `version` is not exactly `2` with `{code: 'MALFORMED_SERIALIZED_INPUT', message: 'unsupported schema version: <N>; expected 2', actualVersion: <N>}`. Loading a `version: 1` blob into the new code throws this error before any replay step; engine state is unchanged.

**Given:** the engine alignment is complete; a synthetic `version: 1` blob is constructed (or saved from pass-3).
**When:** `loadEngineFrom` is called with the `version: 1` blob.
**Then:** throws `MALFORMED_SERIALIZED_INPUT` with the version-mismatch payload. Engine state is unchanged. No partial load occurs.

**Implementing tasks:**

**Decisions:**

### AC-6.1 — Datalog safety preserved (`UNSAFE_RULE`)

**Observable boundary:**
- Defining a rule whose `headAtom` carries an uppercase-string variable that does not appear in any non-negated `bodyAtoms` atom throws `{code: 'UNSAFE_RULE', ruleId, unboundVars: [...]}`.

**Given:** a fresh engine.
**When:** `engine.defineRule('bad', ['p', ['Y']], [['q', ['X']]], {})` is called (head variable `Y` not bound in body).
**Then:** throws `UNSAFE_RULE` with `unboundVars: ['Y']`. The rule is not stored.

**Implementing tasks:**

**Decisions:**

### AC-6.2 — Duplicate-rule-id rejection preserved

**Observable boundary:**
- Defining two rules with the same `ruleId` throws `{code: 'DUPLICATE_RULE_ID', ruleId}` on the second call.

**Given:** a fresh engine with a rule `'r1'` defined.
**When:** a second call defines another rule with `ruleId: 'r1'`.
**Then:** throws `DUPLICATE_RULE_ID` with the offending ruleId.

**Implementing tasks:**

**Decisions:**

### AC-6.3 — Cyclic-negation rejection preserved

**Observable boundary:**
- Defining a set of rules where the head depends transitively on a body atom that depends on a negation of the head throws `{code: 'CYCLIC_NEGATION', ...}` at the `defineRule` call that introduced the cycle.

**Given:** a fresh engine with the cycle's prefix rules already defined.
**When:** the rule completing the negation cycle is added.
**Then:** throws `CYCLIC_NEGATION` at that `defineRule` call (not deferred to a later derive or commit).

**Implementing tasks:**

**Decisions:**

### AC-7.1 — ADR-0013 Part 3 preserved: cyclic-negation inside a transaction throws at the call

**Observable boundary:**
- Defining a cyclic-negation rule inside an open transaction throws at the `defineRule` call. Subsequent `rollback` discards buffered mutations cleanly. The rest of the transaction's pre-cycle work remains visible until rollback.

**Given:** a fresh engine. A transaction is opened. Rules forming a valid prefix of a cycle are defined inside the transaction.
**When:** the rule completing the negation cycle is defined inside the same transaction.
**Then:** throws `CYCLIC_NEGATION` at that call. The transaction handle remains valid. Subsequent `rollback(handle)` reverts the engine to its pre-`begin()` state.

**Implementing tasks:**

**Decisions:**

### AC-7.2 — Read-own-writes preserved (ADR-0013 Part 2)

**Observable boundary:**
- Inside a transaction, after `defineRule` + `assertFact` + `derive`, `query` against a predicate the new rule derives returns the derived bindings.

**Given:** a fresh engine; a transaction is opened; a rule and facts that the rule derives are defined inside the transaction.
**When:** `query` is called inside the transaction for the rule's head predicate.
**Then:** the query returns the derived bindings (read-own-writes confirmed against the new API surface).

**Implementing tasks:**

**Decisions:**

### AC-8.0 — Failure-mode tests migrate directly to tuple form (bypass helper)

**Observable boundary:**
- Tests that intentionally pass malformed input to assert `MALFORMED_RULE`, `UNSAFE_RULE`, or `DUPLICATE_RULE_ID` (concentrated in `__tests__/failures.test.js`) migrate **directly** to tuple-form calls in the engine refactor commit, **not** through `defineRuleObj`.
- Rationale: `defineRuleObj` performs inverse translation assuming well-formed object input; it would crash mid-translation on malformed input rather than reaching the new public API. Failure tests must reach the public API to assert its error behavior, so they bypass the helper.
- Each failure test's assertion remains semantically identical: throws the same error code with the same payload shape.

**Given:** the engine refactor commit lands.
**When:** `__tests__/failures.test.js` is inspected.
**Then:** every `expect(() => e.defineRule(...)).toThrow(...)` callsite uses tuple-form arguments directly (e.g., `e.defineRule('r', 'bad', [], {})` to assert `MALFORMED_RULE` on non-array head). No `defineRuleObj` wrapping appears in this file. Failure tests assert the same error codes (`MALFORMED_RULE`, `UNSAFE_RULE`, `DUPLICATE_RULE_ID`) they did before migration.

**Implementing tasks:**

**Decisions:**

### AC-8.1 — Test helper exists during migration

**Observable boundary:**
- Between the engine refactor commit and the cleanup commit, `__tests__/helpers/defineRuleObj.js` exists and exports `defineRuleObj(target, ruleObj)` and `explainTuple(engine, predicate, args)`.

**Given:** the engine refactor commit has landed and migration is in progress.
**When:** the test directory is inspected.
**Then:** the helper file exists; both functions are exported; tests pass green.

**Implementing tasks:**

**Decisions:**

### AC-8.2 — Test helper deleted after migration

**Observable boundary:**
- After all 11 test files complete direct-call migration, `__tests__/helpers/defineRuleObj.js` is deleted.
- A grep across `skills/design-large-task/engine/__tests__/` finds zero references to `defineRuleObj` or `explainTuple`.

**Given:** all 11 test files have been migrated to direct tuple-form calls.
**When:** the cleanup commit lands.
**Then:** the helper file is absent; grep returns zero matches; test suite green.

**Implementing tasks:**

**Decisions:**

### AC-9.1 — All test files green after migration

**Observable boundary:**
- After each migration commit (and at the final state), running `npm test` from `skills/design-large-task/engine/` produces 100% green.
- Test count is ≥ 107 (pass-3 baseline) — no tests deleted by this pass; translator unit tests are additive.

**Given:** the engine alignment is in any consistent state (between commits as well as at end).
**When:** `npm test` runs from `skills/design-large-task/engine/`.
**Then:** all tests pass; count is at least 107.

**Implementing tasks:**

**Decisions:**

### AC-9.2 — Exempt test files unchanged

**Observable boundary:**
- `__tests__/DerivedPositionalIndex.test.js`, `__tests__/candidates-for.test.js`, and `__tests__/operations.test.js` have no diff against pass-3 state.

**Given:** the engine alignment is complete.
**When:** git diff is computed for these three files against the pre-pass-4 baseline.
**Then:** the diff is empty for each file. (Whitespace-only changes pass the criterion but should be noted in the implementation commit message; the AC is "no semantic change", not "no character-level change".)

**Implementing tasks:**

**Decisions:**

### AC-10.1 — Internal modules unchanged

**Observable boundary:**
- `RuleStore.js`, `Unifier.js`, `Stratifier.js`, `Evaluator.js`, `Explain.js`, `Snapshot.js`, `FactStore.js` — none of these files change.

**Given:** the engine alignment is complete.
**When:** git diff is computed for these seven files against the pre-pass-4 baseline.
**Then:** the diff is empty for each file. (Whitespace-only changes pass the criterion but should be noted in the implementation commit message; the AC is "no semantic change", not "no character-level change".)

**Implementing tasks:**

**Decisions:**

---

## Provenance trailer

(stamped by the trailer-write helper after this file is finalized)

<!-- created-at: 2026-05-13T21:43:05Z -->
<!-- produced-by design-specify@v0003 -->
