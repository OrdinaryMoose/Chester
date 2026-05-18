# Ground-Truth Review Report: sprint-02-bug-fix-07-spec

**Spec reviewed:** sprint-02-bug-fix-07-spec-00.md
**Codebase root:** skills/design-proof-system/references/
**Date:** 2026-05-18

## Status

**Findings** — 4 MEDIUM, 3 LOW. All MEDIUM findings fixed inline in the spec. LOW findings preserved here as context for the implementer; not patched.

## Verified Claims

The reviewer confirmed the spec's claims against actual source:

- `OPERATION_SPECS` has 8 entries; existing test asserts exactly 8 named verbs — CONFIRMED at `domain/mutations.js:50-183` and `domain/__tests__/mutations.test.js:7`.
- `ports.ids.next(targetShape)` call in `runOperation` step 5 — CONFIRMED at `mutations.js:250`.
- `_resolveElementCategory` exists — CONFIRMED at `mutations.js:25-32`.
- Existing inline argShape entries (RATIFY/WITHDRAW/MANAGE_FRICTION) — CONFIRMED at `mutations.js:101-105, 121-125, 152-156`.
- `runOperation` step 3 dispatch (`spec.argShape ?? targetShape`) — CONFIRMED at `mutations.js:232`.
- `CATEGORY_REGISTRY.RESOLUTION.referenceFields.problem_anchor === 'concern'` — CONFIRMED at `schema.js:116`.
- `verifyArgsShape` referenceFields validator path — CONFIRMED at `schema.js:210-224`.
- `_existsCategory` helper supports `'*'` wildcard — CONFIRMED at `schema.js:33-34`.
- `EVIDENCE_SOURCE_ENUM` four values match brief — CONFIRMED at `tags.js:20-25`.
- `ACTION_LABELS` closed at 8 entries — CONFIRMED at `tags.js:49-54`.
- `EDB_PREDICATES` set includes `resolution_anchor` and named predicates — CONFIRMED at `translation.js:194-203`.
- RESOLUTION translator emits `resolution_anchor` from `args.problem_anchor` — CONFIRMED at `translation.js:55-63`.
- `_ARITIES` in `render.js` holds only primary declaration predicates — CONFIRMED at `render.js:106-115`.
- `effective_addresses_rule` body is generic on `C` — CONFIRMED at `closure-policy.js:49-54`.
- `covered_rule` filters by `concern_status(C, 'ratified')` — CONFIRMED at `closure-policy.js:109-118`.
- `closure_permitted_rule` references `coverage_gap_detected` and `unaddressed_concern`, NOT `covered` — CONFIRMED at `closure-policy.js:65-76`.
- `coverage_gap_rule` body uses `not effective_addresses(_, C)`, independent of `covered` — CONFIRMED at `friction-policy.js:27-30`.
- `validPredicates` set locations — CONFIRMED at `domain-bridge.js:48-50, 197-198`.
- Existing `reviseElement` and `reviseConcern` facade methods — CONFIRMED at `domain-bridge.js:78, 101`.
- VOCABULARY.md `source` free-form documentation — CONFIRMED at line 50.
- `resolution-schema.test.js` asserts `referenceFields.problem_anchor: 'concern'` — CONFIRMED at line 36.

## MEDIUM Findings (Fixed Inline)

### M1 — `risk_covered_rule` is dead code

**Spec said:** Add `risk_covered_rule` to derive `covered(K)` for addressed Risks.

**Code shows:** `closure_permitted_rule` (closure-policy.js:65-76) depends on `unaddressed_concern` and `coverage_gap_detected`. It never reads `covered(K)`. `unaddressed_concern_rule` (closure-policy.js:99-104) filters on `concern_status(C, 'ratified')`, which Risks never have. Once D4's schema extension enables `resolution_anchor(R, risk_id)`, the existing generic `effective_addresses_rule` (closure-policy.js:49-54) fires automatically, and the existing `coverage_gap_rule` (friction-policy.js:27-30) stops firing for addressed Risks. **Zero new closure-policy rules are needed.**

**Fix applied:** Spec's Components → closure-policy.js section now says no new rules; the schema extension alone is sufficient. The closure path for Risks runs through `effective_addresses` → `coverage_gap_rule`, not through `covered`.

### M2 — `concern_note` should be in `_SECONDARY_QUERIES` only, not `_ARITIES`

**Spec said:** Add `concern_note: 2` to `_ARITIES` AND to `PROJECTION_ARITIES`.

**Code shows:** `_ARITIES` (render.js:106-115) holds only primary declaration predicates. `renderElementDeep` iterates `_ARITIES` and returns on first match (render.js:124-129). Post the spec's re-architecture, satellite predicates belong in the new `_SECONDARY_QUERIES` map. Adding `concern_note` to `_ARITIES` mixes satellite into primary-match table.

**Fix applied:** Spec's Components → render.js section now adds `concern_note` to `_SECONDARY_QUERIES` and `PROJECTION_ARITIES` only — NOT to `_ARITIES`.

### M3 — `idAllocator.highWater` is referenced but not declared as a new port method

**Spec said:** Acceptance criteria assert on `idAllocator.highWater('evidence') === N`. Spec line declaring new port methods names only `seed`.

**Code shows:** No `highWater` method exists in design-proof-system; only `next(shape)` is the current IIDAllocator surface. A literal implementer following the spec adds `seed` but not `highWater`, and the tests fail because the read accessor doesn't exist.

**Fix applied:** Spec's Components → domain-bridge.js section now declares both `seed(counters)` AND `highWater(shape) → number` as additions to the IIDAllocator port contract.

### M4 — D2's `_existsAnyCategory` duplicates an existing private helper

**Spec said:** "Implement `_existsAnyCategory` using `_resolveElementCategory`."

**Code shows:** `_existsAnyCategory` already exists at `schema.js:25-31` (private helper, not exported). Schema.js also holds a parallel `_CATEGORY_PROBES_SCHEMA` table mirroring mutations.js's `_CATEGORY_PROBES` — the file comments (schema.js:7-11) explicitly warn that these must stay in sync. Implementing a *third* copy in mutations.js compounds the sync-burden problem.

**Fix applied:** Spec's Components → mutations.js D2 section now directs the implementer to export `_existsAnyCategory` from `schema.js` and reuse it (or build on the existing `_resolveElementCategory` in mutations.js without creating a separate parallel table).

## LOW Findings (Context Only, Not Patched)

### L1 — Test message-match coverage for D4's INVALID_REFERENCE

`schema.js:217-219` builds the validator error message by interpolating `categoryConstraint` directly: `references non-existent ${categoryConstraint === '*' ? 'element' : categoryConstraint} "${id}"`. When `categoryConstraint` is an array `['concern', 'risk']`, the default template renders `references non-existent concern,risk "id"` — readable but unusual. Existing tests that pattern-match on `non-existent concern` substrings may need updating beyond the three "mechanical updates" named in AC-13.1. Implementer's prerogative: either pretty-print the union (`concern or risk`) or update the affected tests.

### L2 — `idShape` prefix convention is not pinned anywhere in the references

D2's `ID_PREFIX_MISMATCH` validation requires knowing the expected prefix per category. The `references/domain/` tree exposes `ports.ids.next(shape)` as the only allocator surface; the actual prefix-derivation convention lives in the runtime allocator implementation, not the references. AC-2.3 uses `evid_` for evidence. Implementer either pins the prefix table explicitly in `mutations.js` (linked to category) or adds an `idAllocator.expectedPrefix(shape) → string` port method. Either is consistent with the spec; spec leaves the choice to plan-build.

### L3 — Broader VOCABULARY.md drift (already documented out of scope)

VOCABULARY.md drifts beyond `source`: line 18 documents Evidence's required fields as `source, claim` (schema uses `source, statement`); line 33 documents Resolution's `addresses` field (schema uses `problem_anchor`); INFERENCE_PATTERNS doc values mismatch `tags.js:27-33`. Spec's Constraints section already documents these as out-of-scope for D8. A follow-up sub-sprint can own the broader doc correction.

## Risk Assessment

The spec's claims about existing design-proof-system code are factually accurate where verifiable. The four MEDIUM findings are spec-precision gaps, not design errors: M1 simplifies the design (one fewer rule), M2 corrects a re-architecture inconsistency, M3 adds a missing port method declaration, M4 prevents a third duplicate of an existing helper. Fixes are surgical and do not change the design direction; no re-review needed per the skill's "no re-review unless the fix is substantial" guideline. After fixes, the spec is ready for plan-build.

<!-- created-at: 2026-05-18T17:03:13Z -->
<!-- produced-by design-specify@v0003 -->
