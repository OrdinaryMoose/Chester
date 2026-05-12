# Combined Threat Report — sprint-01-proof-backend Plan

**Plan reviewed:** `sprint-01-proof-backend-plan-00.md`
**Smell pre-check triggers matched:** `serialize` (×35 occurrences in persistence-pathway category). `plan-smell` therefore ran in parallel with `plan-attack`.

## Combined Implementation Risk: Significant

Two HIGH-severity findings (converging on the same structural issue), six MEDIUM, and four LOW. None are design-level (no return to design needed). All are addressable inline in the plan with mechanical edits. The combined risk is **Significant** rather than Moderate because the HIGH findings would land real bugs if shipped as-is and the MEDIUM findings cluster around a coherent coupling problem in the persistence layer (Serializer + Snapshot + TransactionBuffer interaction).

Why Significant rather than High: every finding is mapped to a specific plan section with a known fix. No finding requires revisiting the spec, the design, or the hybrid-architecture choice. Plan can be hardened in a single edit pass.

## HIGH Findings (plan-attack and plan-smell converged)

**H1 — `TransactionBuffer.js` is dead code shipped to history.** Task 12 Step 3 creates `engine/TransactionBuffer.js` with `assertedFacts`, `retractedFacts`, `definedRules`, `undefinedRuleIds` accumulator state and `applyToFactStore`/`applyToRuleStore` methods. The same step's actual implementation discards the buffer entirely and uses snapshot-rollback ("Mutations during the tx are applied directly to the live state"). `Engine.begin/commit/rollback` never reference `TransactionBuffer`. The commit at Task 12 Step 5 stages it. *Fix:* either delete the `TransactionBuffer.js` creation from Task 12 (snapshot-rollback is the actual transaction strategy) or rewrite Task 12 to actually use the buffer. Recommend deletion — snapshot-rollback is simpler.

**H2 — `Serializer.js` reaches past `_snapshot()` helpers into `_facts._facts` and `_rules._rules` directly.** Task 11's `serializeEngine` accesses `engine._facts._facts.entries()` and `engine._rules._rules.values()`. Task 10 added `_snapshot()` helpers on FactStore and RuleStore precisely to provide a stable extraction point; Task 11 bypasses them. This creates two paths to the same data with no mechanical link — internal storage renames will require updating both. *Fix:* `serializeEngine` should call `engine._facts._snapshot()` and `engine._rules._snapshot()` and unpack those structures.

## MEDIUM Findings

**M1 — `query()` returns duplicate bindings when an EDB fact is also derivable via rules.** `Engine._matchAllAgainstPattern` iterates EDB then IDB and unions results without deduplication. If `assertFact('ancestor', ['a', 'b'])` is also derivable by rule, the ground query `['ancestor', ['a', 'b']]` returns `[{}, {}]`. AC-10.1's set-semantics invariant holds within the IDB but not across EDB+IDB. *Fix:* dedup the union by factKey before returning.

**M2 — Serializer wrong-predicate bug for predicate names containing `/`.** `serializeEngine` uses `pk.split('/')` and destructures `[predicate, arityStr]` — but if a predicate name contains `/`, the destructure assigns the wrong fragment. Domain predicates like `approval/condition` would round-trip wrong. *Fix:* `pk.split('/').slice(0, -1).join('/')` for the predicate name, `parseInt(pk.split('/').at(-1))` for arity. Or change the `pk` separator from `/` to a character disallowed in predicate names. Becomes moot under H2's fix (use `_snapshot()` which doesn't go through `pk`).

**M3 — Task 13 description mentions "commit-time atomicity via try/catch with pre-snapshot revert" but implementation omits it.** The Task 13 file-modifications description claims a try/catch wrapper around commit, but `commit()` is just `this._tx = null`. Inconsistency between description and code. *Fix:* update the description to match the snapshot-rollback approach ("commit is trivially atomic because mutations are applied live; rollback is the only revert path") — no try/catch needed.

**M4 — `factKey` duplicated verbatim across four modules.** FactStore.js, Evaluator.js, Explain.js, Engine.js each define a local `factKey` helper. FactStore's version differs in signature (args only); the others are identical. Changing the key format requires four edits. *Fix:* extract to `engine/utils.js` and import. Mechanical refactor.

**M5 — AC-11.2 stress test (1000-element transitive closure) has O(n³) IDB scan complexity.** `matchBodyAtom` scans the entire derived Map per body atom per binding. At n=1000, ~170M scan steps; 8-17s on V8, within 60s timeout but borderline on slow CI. The plan provides no IDB positional index. *Fix:* add per-predicate IDB index in Evaluator (mirror EDB pattern). Or accept the performance ceiling and note in the plan.

**M6 — Snapshot.js and Serializer.js are redundant persistence paths.** Both extract engine state but with different shapes (IDB included vs. excluded) and no shared abstraction. The `_snapshot()` helpers on FactStore/RuleStore are the natural shared layer but Serializer bypasses them (see H2). *Fix:* H2's fix consolidates them — Serializer becomes a thin wrapper over the `_snapshot()` helpers minus the IDB.

## LOW Findings

**L1 — Append-import pattern in TDD Step 1/2 causes broader test failures than plan describes.** Tasks 3, 4, 7, 8 append `import` and `describe` blocks to existing test files; the import references modules that don't yet exist, causing `ERR_MODULE_NOT_FOUND` at file load, failing the entire file rather than just the new block. Previously-passing tests in the same file go red during Step 2 → Step 3. *Fix:* note this in the plan, or split tests into separate files per task.

**L2 — AC-9.1 test uses a leaf-node program instead of same-generation cousins.** The spec lists same-gen cousins as the canonical stratified-negation example; Task 8 implements a `leaf` rule instead. Both are valid stratified-negation programs; same-gen tests two-sided mutual-exclusion negation which exercises a different code path. *Fix:* add or substitute the same-gen cousins program.

**L3 — AC-13.2 port-independence test verifies method presence, not structural independence.** JS has no compile-time interface enforcement; the test cannot prove that querying doesn't reach into `_facts` or `_rules` internals. *Fix:* note as known limitation; consider exporting port-narrowed factory functions in a future sprint.

**L4 — `MEMORY_BUDGET_EXCEEDED` reachable on a 10001-element chain.** Task 16 documents it as defensive-only, but a 10001-node transitive closure would actually hit the 10000-iteration cap. The cap is too low for plausible Domain usage. *Fix:* raise the cap to 100000 or document the limit explicitly in the spec.

## Verified Plan Assumptions

The reviewers confirmed several non-trivial assumptions that reduce implementer uncertainty:

- `import.meta.dirname` works in Vitest 3.x on Node 22.
- `structuredClone` handles all data shapes used in `captureSnapshot`.
- Node.js ESM hoists `import` declarations correctly.
- `Symbol('tx')` provides unique transaction handle identity.
- `RuleStore.defineRule` cycle rejection is atomic (no partial state).
- The DFS cycle-through-negation algorithm in Stratifier is algorithmically correct.

## Suggested Mitigation Order

If proceeding with directed mitigations, address in this order:

1. H1 — delete `TransactionBuffer.js` from Task 12 (one-line removal in the plan).
2. H2 + M2 + M6 — rewrite `Serializer.serializeEngine` to use `_snapshot()` helpers (consolidates three findings).
3. M1 — add factKey-dedup step in `Engine._matchAllAgainstPattern`.
4. M3 — fix Task 13 description language to match the snapshot-rollback approach.
5. M4 — extract `factKey` to `engine/utils.js` (mechanical refactor).
6. M5 — accept performance ceiling OR add IDB index (judgment call).
7. L2 — substitute same-gen cousins program in Task 8 (test rewrite).
8. L1, L3, L4 — note as context; no action required.

The first five mitigations are ~30 minutes of plan edits; the remaining are optional. After mitigations, re-running plan-attack and plan-smell is *not* required — the findings are mechanical fixes with no structural ambiguity.

## Smell Trigger Note

`plan-smell` ran because the trigger pre-check matched `serialize` (×35) in the persistence-pathway category. Matched triggers: `serialize`. Other categories did not match. The decision to fire plan-smell was correct: the persistence-pathway smell found H2 + M6 which plan-attack missed.

<!-- created-at: 2026-05-11T17:00:00Z -->
<!-- produced-by plan-build@v0004 -->
