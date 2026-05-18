# Combined Threat Report: sprint-02-bug-fix-07-plan-00

**Plan reviewed:** `plan/sprint-02-bug-fix-07-plan-00.md`
**Spec:** `spec/sprint-02-bug-fix-07-spec-00.md`
**Date:** 2026-05-18
**Hardening passes:** plan-attack (unconditional), plan-smell (triggered on `serialize`, `serializeWithAllocatorState`, `persistence`)

## Combined Implementation Risk: **Significant**

The plan is well-structured at the unit level — every task carries a clear TDD sequence with concrete file paths, code samples, and commands. The risk concentrates in cross-task structural gaps: registry updates not propagated, contract surfaces conflated, and existing stubs implicitly relied upon. Several findings overlap between the attacker and the smeller, reinforcing their severity.

## HIGH-Severity Findings

### H1 — `validateOperationSpecs` does not accept array `consentCategory` (attacker H1)

`boot-validators.js:31` calls `consentSources.has(spec.consentCategory)` — a `Set.has()` against the scalar `consentCategory` value. D12's new `OPERATION_SPECS` entries (plan Task 12 Step 3) declare `consentCategory: [DESIGNER, DESIGN_PARTNER]` as an array. `Set.has(array)` returns false because the set contains strings, not arrays. `createDomainBridge()` will throw `DomainBootError` the moment Task 12's specs are imported — before any test runs.

**Plan gap:** no task updates `boot-validators.js`. The plan lists `boot-validators.js` in zero task file blocks.

**Mitigation needed:** add a prerequisite step (or new task) that extends `validateOperationSpecs` to accept either scalar or array `consentCategory`. `authority.js:10` already does this for runtime consent checks via `Array.isArray` — the validator just needs to mirror that.

### H2 — D12 new verbs never trigger `instantiateTemplate` (attacker H2)

`mutations.js:260-261` gates `instantiateTemplate` on `verbName === ACTION_LABELS.ADD || verbName === ACTION_LABELS.REVISE`. D12's `REVISE_PROPOSITION` and `REVISE_RESOLUTION` are neither. Without per-element rule template instantiation, the new element has `approved`/`two_yes` facts in the EDB but no derived `proposition(id, S)` or `resolution(id, S)` predicate — closure policy and any callers reading derived forms cannot see the new element.

**Plan gap:** Task 12's file list does not include the `instantiateTemplate` gate site.

**Mitigation needed:** extend the gate to `(verbName === ADD || verbName === REVISE || verbName === REVISE_PROPOSITION || verbName === REVISE_RESOLUTION)`. Trivial one-line fix that must be in Task 12.

### H3 — `createDomainBridgeWith` is an existing unconditional throw (attacker H3, smeller MEDIUM)

`domain-bridge.js:228` throws unconditionally. The plan adds new facade methods to `createDomainBridgeWith` (Tasks 5, 11, 12) but no task is responsible for filling in the stub. Any success-path test routed through this factory throws an unrelated stub error.

**Plan gap:** the existing stub is treated as a future-implementer concern; the plan extends its surface without addressing it.

**Mitigation needed:** either include the facade-body fill-in as a prerequisite task, or declare `createDomainBridgeWith` out of scope for this sub-sprint and remove any plan instructions to extend it. Smeller flagged this as compounding existing stub debt.

## MEDIUM-Severity Findings

### M1 — D5 serialize/restore wires `renderDatalogProjection` to `engine.snapshot.restore` (attacker M2)

`renderDatalogProjection` returns `{facts: Array, rules: Array}` — an in-memory projection object. `engine.snapshot.restore(token)` expects a JSON snapshot token from `engine.snapshot.snapshot()`. The plan conflates the two formats.

**Plan gap:** Task 11 Step 3 calls `engine.snapshot.restore(serialized.engine)` where `serialized.engine` is the projection, not a snapshot token.

**Mitigation needed:** use `engine.snapshot.snapshot()` for serialize and `engine.snapshot.restore(token)` for restore — the existing pair already used by `counterfactual.js`. Keep `renderDatalogProjection` for its existing replay/export role, distinct from D5's atomic restore.

### M2 — Prefix convention conflict between fixture and plan (attacker M3)

`bridge-integration.test.js`'s `makeAdapters()` allocator emits `${shape}_${n}` (e.g., `evidence_1`). The spec's AC-2.1 example and plan's `_ID_PREFIXES` table use `evid_`. AC-2.3 (`addElement` with `args.id = 'concern_1'` for an EVIDENCE target rejects with `ID_PREFIX_MISMATCH`) cannot hold under both conventions simultaneously.

**Plan gap:** the plan acknowledges "prefix convention to one source" as an open decision and pins `_ID_PREFIXES` to abbreviated prefixes, but does not align the fixture allocator to match.

**Mitigation needed:** decide one convention (`evid_` vs `evidence_`) and align both `_ID_PREFIXES` and the fixture allocator. Update AC examples in the spec if changing direction.

### M3 — Triple/quadruple parallel prefix table (smeller HIGH)

The plan introduces `_ID_PREFIXES` in `mutations.js` (Task 8) AND `prefixToShape` in `translation.js` (Task 11 — `extractAllocatorHighWaterMarks` body). Combined with existing `_CATEGORY_PROBES` and `_CATEGORY_PROBES_SCHEMA` (which already require sync per `schema.js:7-11`), this lands four parallel encodings of the same category-to-prefix fact.

**Plan gap:** the plan resolves the category-probe issue (export the existing helper) but does not consolidate the prefix table.

**Mitigation needed:** consolidate into one source. Options: (a) export `_ID_PREFIXES` from `tags.js` alongside `ELEMENT_CATEGORIES`; (b) read prefixes from `idAllocator.expectedPrefix(shape)` if/when added. Either keeps the plan's reuse principle.

### M4 — `concern` is absent from `_ARITIES` in `render.js` (attacker M5, smeller LOW)

`render.js:106-115` lists primary declaration predicates: `evidence`, `rule_decl`, `permission_decl`, `proposition_decl`, `risk`, `resolution_decl`, `friction`, `definition_decl`. `concern` is missing. `renderElementDeep` returns null for any Concern id, breaking D6/D10/D11 Concern paths silently.

**Plan gap:** Task 6 adds `_SECONDARY_QUERIES.concern` but does not add the primary `concern: 3` entry to `_ARITIES`.

**Mitigation needed:** in Task 6 Step 3, add `concern: 3` to `_ARITIES` alongside the `_SECONDARY_QUERIES` map extension. One-line fix.

### M5 — D12 verbs bypass per-category authority dispatch (attacker M4, smeller MEDIUM)

`mutations.js:208-214` dispatches `perCategoryAuthority = lookupAuthority(...)` for ADD/REVISE/WITHDRAW and (special-case) RATIFY. D12 verbs fall through to the spec-level `consentCategory` fallback. Functional but inconsistent — future changes to `CATEGORY_REGISTRY[PROPOSITION].authority.ratify` won't propagate to `REVISE_PROPOSITION`.

**Plan gap:** Task 12 does not extend the dispatch branch.

**Mitigation needed:** extend the branch at `mutations.js:208` to recognize `REVISE_PROPOSITION` and `REVISE_RESOLUTION` and look up authority from `CATEGORY_REGISTRY[targetShape].authority.ratify`.

### M6 — `__retract__` sentinel in D12 metaFacts (attacker L4, smeller MEDIUM)

The plan emits `['__retract__', [...]]` entries into `metaFacts` (Task 12 Step 3). `runOperation` step 5 iterates `metaFacts` and calls `assertFact` — the sentinel is asserted as a literal predicate name. The plan flags this as resolved by either runOperation sentinel-handling or by the AC-12.4 probe dropping `grounding_updates` entirely. Until the probe runs, the code lands in a state where the sentinel is meaningful only by convention.

**Plan gap:** the sentinel coupling is convention-based without an enforcement path.

**Mitigation needed:** AC-12.4 probe must run early (before commit) and either remove `grounding_updates` or implement explicit retract handling in `runOperation` step 5. Don't ship the sentinel-as-string into committed code.

### M7 — `serializeWithAllocatorState` dual-path counter strategy (smeller MEDIUM)

The serialize wrapper branches on `typeof idAllocator.highWater === 'function'`. If a real production allocator doesn't yet implement `highWater`, the fallback `extractAllocatorHighWaterMarks` (EDB-scan) silently undercounts when D2's caller-supplied IDs land above the allocator counter.

**Plan gap:** no migration gate for the new IIDAllocator contract; the optional-function check codifies the fallback as permanent.

**Mitigation needed:** either require `highWater` on the contract (throw if missing) or document the fallback's correctness boundary explicitly.

## LOW-Severity Findings

### L1 — Fixture allocator surface mismatch (attacker L1)

`createInMemorySubstrate` (`_fixtures/inMemorySubstrate.js:234`) does not return an `idAllocator`. D1/D2/D5 tests destructure `{ idAllocator } = createInMemorySubstrate()` — `idAllocator` will be `undefined`. Task 11 mentions the fixture needs `seed` and `highWater` but does not identify the right fixture location.

**Mitigation needed:** add an explicit fixture-extension step to Task 11 (or as Task 0 prerequisite) that exposes the allocator via the substrate's return value.

### L2 — Test imports `makeAdapters` from a non-exporting file (attacker L2)

`bridge-integration.test.js:7` defines `function makeAdapters(...)` without `export`. The plan's Task 4 test imports it. Implementer will need to refactor `makeAdapters` to a `_fixtures/` module or copy the function.

### L3 — Task 13 grep misses `toStrictEqual` (attacker L3)

The grep in Task 13 Step 1 covers `toEqual` only. A test using `toStrictEqual({ id })` or `expect(Object.keys(result)).toEqual(['id'])` won't be surfaced. Task 13's full-suite run in Step 3 catches the actual breakage — the grep is a discovery aid, not a safety net. Acceptable but worth widening the pattern.

### L4 — D4 inconsistency between spec sections (smeller LOW)

Spec §D4 Components section says "No code change required for `closure-policy.js`", but spec Data Flow §5 names two new rules (`effective_addresses_risk_rule`, `risk_covered_rule`). Ground-truth review previously resolved this — the truth is "no new rules" — but the data-flow section text wasn't updated to match. Cosmetic; doesn't change implementation.

## Matched Smell Triggers

The smell heuristic matched on:
- `serialize`
- `serializeWithAllocatorState`
- `persistence`

All matches concentrated in Task 11 (D5). Smell fired correctly — the persistence-pathway surface is the highest-leverage category for forward-looking smell analysis on this plan.

## Implementation Risk Summary

The five Significant-rank concerns concentrate on: (a) registry-update propagation (boot-validator, dispatch, instantiateTemplate) for D12's two new verbs; (b) D5 wiring to the wrong serialization surface; (c) prefix-convention drift across fixture + plan; (d) `concern` missing from primary-record map; (e) existing stub in `createDomainBridgeWith` extended without being fixed. All five are catchable during execute-write if the implementer reads attentively, but none is caught automatically — the test gates pass the wrong way (silent null returns from `renderElementDeep` for Concerns; D12 elements derive-less and pass closure-blind tests).

Mitigations are largely one-task additions plus three targeted patches to existing tasks. The plan does not need to be re-architected; it needs hardening edits before execute-write begins.

<!-- created-at: 2026-05-18T17:23:08Z -->
<!-- produced-by plan-build@v0004 -->
