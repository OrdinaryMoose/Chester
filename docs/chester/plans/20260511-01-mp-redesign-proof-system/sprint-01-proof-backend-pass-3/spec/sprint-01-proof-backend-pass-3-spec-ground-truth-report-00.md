# Ground-Truth Review Report — sprint-01-proof-backend-pass-3

**Spec reviewed:** `sprint-01-proof-backend-pass-3-spec-01.md`
**Status:** Clean — no findings
**Severity counts:** HIGH 0, MEDIUM 0, LOW 0

## Summary

All factual claims about the existing codebase in `sprint-01-proof-backend-pass-3-spec-01.md` are accurate. The reviewer verified file paths, line numbers, method signatures, error-path inventory, data-structure shapes, test counts, and directory layouts against the source files. The adversarial review fixes flagged in the spec's "Revision note (-00 → -01)" are reflected correctly in the spec's body; no residual contradictions between those corrections and the source.

The spec is ready for `plan-build` with no factual blockers.

## Verified Claims

- **Single `derived.set` site.** `Evaluator.js:119` — confirmed; the spec's claim of one site matches.
- **Only `Evaluator.js` error path is `MEMORY_BUDGET_EXCEEDED`.** Raised at `Evaluator.js:100` when `iter > 10000`. No `UNBOUND_HEAD_VARIABLE` path present. The spec's revised error-handling section is accurate.
- **`factKey` import from `./utils.js`** — confirmed at `Evaluator.js:7` and `utils.js:6`. Signature `(pred, args) => ...`. (Note: `FactStore.js:13` defines a separate local `factKey = (args) => ...` — different scope, different signature, not imported. The spec correctly distinguishes the two.)
- **`matchBodyAtom` structure.** Negation branch lines 23-40 (ends at the closing `}` for `if (atom.negated)`), positive branch from line 42, full derived-scan at lines 27-29 and 45-47, candidates array at lines 48-51, deltaFilter check at line 54.
- **`derive()` structure.** Per-stratum loop at line 93, inner `while(true)` at line 98, `fireRule` closure at lines 103-126.
- **`FactStore._positionalIndex` shape.** `Map<"predicate/arity", Array<Map<value, Set<factKey>>>>` confirmed at `FactStore.js:20-21` (comment) and line 40 (initialization).
- **`factsMatching` signature.** Returns `Array.from(bucket, fk => rel.get(fk))` confirmed at `FactStore.js:92-100`.
- **FactStore index-maintenance block lines 40-50.** Line 40 creates per-predicate array; lines 45-50 do per-position bucket insertion.
- **AC-11.2 currently `it.skip` with 60000 ms timeout.** `__tests__/stress.test.js:30,48`.
- **Termination test in `properties.test.js`.** `timeout: 20000` at line 26; `toBeLessThan(15000)` at line 50.
- **Pass-2 baseline.** 87 passing + 1 skipped, confirmed by running the test suite.
- **ADR directory layout.** `docs/chester/plans/20260511-01-mp-redesign-proof-system/design-documents/ADR/NNNN-slug.md`. Existing entries 0015-0018 use bare `NNNN-kebab-slug.md` (no `ADR-` filename prefix). Earlier 0001-0014 still carry " copy.md" suffixes (legacy artifact, not normative for new ADRs per the cascade's stated convention). Next available number is 0019.
- **ADR-0017 stale citation.** `Evaluator.js:23-43` confirmed at line 62 of `0017-existential-quantification-negation-semantics.md`. Current correct range is `23-40` (negation block ends line 40). Spec correctly flags this and defers post-pass-3 number computation to execute-write.
- **Engine spec front-matter.** `related_adrs: [0002, 0007, 0009, 0013, 0014]` at `04-engine-spec.md:5`. Spec correctly identifies the stale list and the entries to add.
- **OQ-1 entry.** Confirmed as the only substantive content of `engine-open-questions.md`. Removing it leaves a header-only document, as the spec states.

## Findings

None.

## Risk Assessment

The spec accurately describes the codebase it targets. No factual errors remain after the adversarial review fixes. The two values the spec necessarily leaves to execute-write — the post-pass-3 line range for ADR-0017's citation and the assigned ADR number for the new record — are correctly deferred rather than frozen as potentially stale. Plan-build can proceed without further verification overhead on these claims.

<!-- created-at: 2026-05-13T01:48:12Z -->
<!-- produced-by design-specify@v0003 -->
