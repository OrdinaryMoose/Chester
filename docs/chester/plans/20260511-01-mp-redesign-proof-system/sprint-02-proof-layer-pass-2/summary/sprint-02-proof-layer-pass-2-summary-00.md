# Session Summary: Add Missing CONCERN Element Category to Domain Pipeline

**Date:** 2026-05-15
**Session type:** Full-stack implementation (Chester pipeline: design-small → design-specify → plan-build → execute-write)
**Plan:** `sprint-02-proof-layer-pass-2-plan-01.md`

## Goal

Add the missing CONCERN element category to the domain element-schema pipeline at `skills/design-proof-system/references/domain/` so the closure-policy's `unaddressed_concern` consumer rule has a producer, and so future callers can create/revise/ratify/withdraw Concerns through the unified element pipeline. The cascade (`05-domain-spec.md` §3.8) enumerates nine element categories; pass-1 of sprint-02-proof-layer accidentally registered only eight. This sub-sprint closes that gap. proof-mcp's parallel `state.concerns` handling is a separate system and explicitly out of scope.

## What Was Completed

### Domain layer registrations (Tasks 1-3)

- **`tags.js`** — added `CONCERN: 'concern'` to `ELEMENT_CATEGORIES`. Updated the existing `tags.test.js` closed-set inventory test from 8→9 entries (mechanical cascade required by the change; spec reviewer flagged the cross-file edit as a scope boundary concern but accepted as a plan-flaw resolution).
- **`schema.js`** — inserted `[ELEMENT_CATEGORIES.CONCERN]` entry in `CATEGORY_REGISTRY` between FRICTION and DEFINITION blocks. Required field `label`, optional `description`, idShape `concern`, render section `PROBLEM`, authority matrix mirroring DEFINITION (designer-only add/revise/withdraw, designer+design-partner ratify). Updated `schema.test.js` description "eight"→"nine" (assertion already dynamic via `Object.values(ELEMENT_CATEGORIES)`).
- **`translation.js`** — added Concern translator emitting `concern(id, label, description ?? '')` and `concern_status(id, 'draft')`. Added `RULE_TEMPLATES[CONCERN]` with `build(elementId)` producing the per-element rule `concern_status(C, 'ratified') :- concern(C, _, _), approved(C, _, _)`. Added `'concern'` and `'concern_status'` to `EDB_PREDICATES`.

### Mutations + closure rules (Tasks 4-5)

- **`mutations.js`** — added `ELEMENT_CATEGORIES.CONCERN` to the Phase-C template-instantiation dispatch list at line 133 (the gate that triggers `instantiateTemplate` at `runOperation('add', ...)` time).
- **`closure-policy.js`** — fixed the pre-existing bug in `unaddressed_concern_rule` body (was reading `risk(C, _, _)` from a wrong-category pass-1 placeholder; now reads `concern_status(C, 'ratified')`). Added new `covered_rule` deriving `covered(C)` from `concern_status(C, 'ratified')`, `addresses(R, C)`, and `approved(R, _, _)` (the spec interpretation of cascade §7.2 first clause, using the actual `addresses/2` arity rather than the cascade's documented `addresses/3`).

### Bridge facade (Task 6)

- **`domain-bridge.js`** — added four dedicated CONCERN entry points (`addConcern`, `reviseConcern`, `ratifyConcern`, `withdrawConcern`) mirroring DEFINITION's pattern, each wrapping `runOperation` with `idShape: tags.ELEMENT_CATEGORIES.CONCERN` pinned. Updated both `validPredicates` loops (lines 47 and 155) with `'concern'`, `'concern_status'`, `'covered'`.

### Integration test (Task 7)

- **`__tests__/concern-schema.test.js`** (new file) — accumulates 24 tests across the lifecycle covering AC-1.1 through AC-7.1. Uses a `makeRealBridge` async helper that boots a real Engine via dynamic `import('../../engine/Engine.js')`, mirroring `bridge-integration.test.js:36-50`. The lifecycle tests exercise add → ratify → query through the real bridge with real derivation. A canary test pins the latent `ratifyConcern` SHAPE_INVALID throw (see Known Remaining Items).

### Verification (Task 8)

Full domain + engine suites pass. AC-7.2 (no archived plans modified) confirmed; system boundary check confirms zero proof-mcp files touched.

## Verification Results

| Check | Result |
|-------|--------|
| Domain test suite | 108/108 passed (84 baseline + 24 new concern-schema tests) |
| Engine test suite | 138/138 passed (untouched, baseline confirmed) |
| Working tree | Clean post-checkpoint |
| AC-7.2: no archived plans modified | OK |
| System boundary: no `skills/design-large-task/proof-mcp/` files modified | OK |

## Known Remaining Items

Carried forward from `plan-01.md` Known Issues section — accepted residuals from plan-hardening, not introduced by this sprint:

- **`ratifyConcern` latently throws `SHAPE_INVALID`** — mirrors pre-existing `ratifyDefinition` brokenness (`domain-bridge.js:92`). The dedicated wrapper pins `idShape: 'concern'`, which triggers `verifyArgsShape` against `CATEGORY_REGISTRY['concern'].requiredFields = ['label']`. Ratify args supply `{ elementId, idShape }` only — no `label` — so the check throws. Workaround in tests: use generic `ratifyElement({ elementId, source: 'designer', claim: '_' })` with dummy fields satisfying EVIDENCE's check. A canary test in `concern-schema.test.js` pins this throw; if a future sub-sprint fixes the shape-check semantics, the canary will flag the resolution.
- **`validPredicates` duplicated at `domain-bridge.js:47` and `:155`** — pre-existing pattern. This sprint extended both correctly. No test enforces the two stay in sync. A future sub-sprint could extract a single source of truth, but doing so introduces an abstraction the spec discipline forbids.
- **`createDomainBridgeWith` ends in `throw new Error(...)` at `domain-bridge.js:185`** — test-only factory for AC-4.x boot-validator tests. New CONCERN bridge methods landed only in `createDomainBridge`; `createDomainBridgeWith` remains a throwing stub. Its existing error-path tests don't reach a facade call, so they're unaffected. The divergence is now wider by four methods.
- **`friction-policy.js:10` carries the identical `[['risk', ['C', '_', '_']], ['not', ['addresses', ['_', 'C']]]]` pattern** as the now-corrected `unaddressed_concern_rule` body — possibly another pass-1 placeholder bug. Out of scope per spec discipline.
- **Phase-C dispatch list duplicates `RULE_TEMPLATES` keys** — `mutations.js:133` hardcodes `[PROPOSITION, RESOLUTION, DEFINITION, CONCERN]` rather than reading `Object.keys(RULE_TEMPLATES)`. Pre-existing structural pattern; will fan out further with each new approval-gated category.
- **proof-mcp adoption deferred** — the new domain bridge surface (`addConcern` et al.) is reachable via tests but has no upstream caller. proof-mcp continues to use its legacy `state.concerns` array independently. Cross-system unification is a separate future sub-sprint per spec-03's system-boundary declaration.

## Files Changed

**Domain layer (`skills/design-proof-system/references/domain/`):**
- `tags.js` — added `CONCERN: 'concern'` to `ELEMENT_CATEGORIES`.
- `schema.js` — added `CATEGORY_REGISTRY[CONCERN]` entry.
- `translation.js` — added Concern translator, `RULE_TEMPLATES[CONCERN]`, EDB predicate entries.
- `mutations.js` — added CONCERN to Phase-C dispatch list.
- `closure-policy.js` — fixed `unaddressed_concern_rule` body; added `covered_rule`.
- `domain-bridge.js` — added 4 bridge entry points + 2 validPredicates loop updates.

**Domain tests (`skills/design-proof-system/references/domain/__tests__/`):**
- `tags.test.js` — count update 8→9 (cascade from `tags.js` change).
- `schema.test.js` — description update "eight"→"nine" (assertion already dynamic).
- `concern-schema.test.js` — **new file**, 24 tests covering AC-1.1 through AC-7.1.

**Sprint artifacts (working/):**
- `design/sprint-02-proof-layer-pass-2-design-00.md` — six-section brief from design-small-task format.
- `spec/sprint-02-proof-layer-pass-2-spec-00.md` through `-03.md` — initial spec + three revisions (adversarial fixes, ground-truth fixes, user-directed scope correction).
- `spec/sprint-02-proof-layer-pass-2-spec-ground-truth-report-00.md` and `-01.md` — ground-truth reports for spec-01 and spec-03.
- `plan/sprint-02-proof-layer-pass-2-plan-00.md` and `-01.md` — initial plan + hardened revision.
- `plan/sprint-02-proof-layer-pass-2-plan-threat-report-00.md` — combined attack + smell report.

## Commits

```
838e8e4 checkpoint: execution complete
20ece2d test: add end-to-end CONCERN lifecycle integration test
8d338ba feat: add dedicated CONCERN bridge entry points and update validPredicates
af55b95 fix: correct unaddressed_concern_rule body and add covered(C) producer rule
9ce905b feat: include CONCERN in Phase-C template instantiation dispatch
45dcc17 feat: add CONCERN translator, RULE_TEMPLATE, and EDB predicate entries
b290d53 feat: add CONCERN entry to CATEGORY_REGISTRY
9b7c4f4 feat: add CONCERN to ELEMENT_CATEGORIES tag set
```

Base commit before sprint: `132dfba refactor: relocate Domain and Engine to skills/design-proof-system/references` (the relocation commit that established the post-relocation HEAD this sprint built off).

## Handoff Notes

- **proof-mcp adoption sub-sprint** — the new domain bridge surface is now ready for an upstream caller. A future sub-sprint can route `proof-mcp/server.js`'s `manage_concerns` MCP tool handler through `domain-bridge.addConcern`/etc., retire `state.concerns`, and rewire the downstream readers (`closing-argument.js`, `body-advancement.js`, `first-yes-gate.js`, `state-render.js`, `metrics.js`, `friction-detection.js`). The plan-build adversarial pass for this future sub-sprint should anticipate the `ratifyConcern` SHAPE_INVALID issue and either fix the shape-check semantics (broader refactor) or have callers pass dummy `source`+`claim` fields through generic `ratifyElement` (the pattern this sprint adopted in tests).
- **ratify-path shape-check fix** — the `ratifyConcern`/`ratifyDefinition` latent SHAPE_INVALID bug deserves its own sub-sprint. Two viable approaches: (a) make `verifyArgsShape` aware of the verb (skip required-field check on ratify), or (b) introduce a per-verb `argSchema` on `CATEGORY_REGISTRY` entries. The canary test in `concern-schema.test.js` (third lifecycle test) will fail when this fix lands — that's the signal.
- **`covered(C)` semantics narrowing** — this sprint's `covered_rule` body requires the addressing Resolution to be `approved` (effectively "ratified"). Cascade §7.2 first clause literally says `covered(C) :- concern_status(C, ratified), addresses(_, C, _)` — no approved check. The spec's interpretation (matching cascade §3.8's narrative "addressed by a ratified Resolution") tightens the literal cascade rule. If a future cascade revision restores the looser form, `covered_rule`'s body needs to be relaxed accordingly.
- **The pass-1 `risk`/`addresses` placeholder pattern** appears identically at `friction-policy.js:10`. Worth investigating whether friction-policy has an analogous bug to the one this sprint fixed in closure-policy.
- **AC-1.4 cascade-vs-code id-format gap** — this sprint's `concern_N` long-form id contradicts cascade §3.8's `cern_N` shorthand. Same gap exists for `evid_N`/`evidence_N`, `prop_N`/`proposition_N`, etc. Reconciling cascade documentation with the implemented `${idShape}_${n}` convention is a docs-and-code task that would touch every category and the cascade.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by finish-write-records@v0003 -->
