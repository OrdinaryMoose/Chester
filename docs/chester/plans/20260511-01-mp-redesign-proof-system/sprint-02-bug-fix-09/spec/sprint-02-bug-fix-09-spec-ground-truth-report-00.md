# Ground-Truth Report — sprint-02-bug-fix-09

**Spec:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-09/spec/sprint-02-bug-fix-09-spec-00.md
**Status:** Clean

## Verified Claims

The spec's claims about existing code have been verified against the codebase.

- `_vocabularyLintCheck(elementId, ports)` exists with the two-parameter signature — confirmed at `skills/design-proof-system/references/domain/mutations.js:41`. The function's current body runs the ratified-definitions short-circuit, extracts canonical terms, calls `renderElementDeep`, and performs the case-insensitive substring scan that returns `{ field, value, canonicalTerm }` on a violation.
- `_resolveElementCategory(id, queryPort)` exists, returns a wire-string member of `ELEMENT_CATEGORIES` or `null` — confirmed at `mutations.js:26–33`.
- `_CATEGORY_PROBES` maps probe predicates to wire-string category values — confirmed at `mutations.js:14–24`. The four exempt wire strings the spec lists (`'definition'`, `'concern'`, `'risk'`, `'evidence'`) match the values `_resolveElementCategory` returns.
- The CONCERN cleanup block exists at `mutations.js:423–428` and resolves the category at line 424 before retracting the `'draft'` status fact at line 426 — confirmed.
- The lint-check block exists at `mutations.js:449–454`, gated on `verbName === ACTION_LABELS.RATIFY`, calling `_vocabularyLintCheck(args.elementId, ports)` and throwing `VOCABULARY_LINT_VIOLATION` on a non-null result — confirmed.
- The CONCERN cleanup runs *before* derive (`ports.query.derive()` at line 431), preconditions (lines 435–439), and postconditions (lines 442–446); the lint check runs *after* those — confirmed. The spec's revised AC-2.1 description of this ordering is accurate.
- `renderElementDeep` returns records carrying a `predicate` field — confirmed at `skills/design-proof-system/references/domain/render.js:195` (`const base = { id, predicate: pred, withdrawn }`).
- `definition/3` is the public ratified-definition predicate; head atom `['definition', [elementId, 'T', 'D']]` — confirmed at `skills/design-proof-system/references/domain/translation.js:140`. The lint check's query at `mutations.js:42` matches this arity.
- AC-11.1, AC-11.2, and AC-11.3 in `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js` all use `ELEMENT_CATEGORIES.CONCERN` as the ratification subject with field `label` — confirmed at lines 439, 446–449 (AC-11.3), 456, 473–474 (AC-11.1), 483, 498–499 (AC-11.2). All three require relocation per AC-3.5.
- Baseline of 275 passing tests across 32 test files — confirmed by `npm test` execution against the worktree.
- The `makeRealBridge` scaffold pattern in `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-08.test.js` (per-file inline helper, frozen clock, designer-consent constant) — confirmed at lines 6–25 of that file.
- `skills/design-proof-system/references/domain/VOCABULARY.md` Section 11 (Naming hygiene rules) exists, currently contains the authoring-rule bullet list, and ends at line 244 (or thereabouts) with no enforcement description — confirmed. The spec's plan to add a paragraph after the bullet list and a Change Log section at the document end is consistent with the document's current shape.
- `ELEMENT_CATEGORIES.RULE` wire value is `'rule'` and the field-name swap from `label` (Concern) to `statement` (Rule) is correct — confirmed against `tags.js` and the rule-schema field-naming convention used across the codebase.

## Findings

None. All factual, behavioral, and contract claims the spec makes about existing code check out against the source.

## Implementer-Context Note

A nuance worth flagging for plan-build (not a discrepancy with the spec): the codebase contains a third `_resolveElementCategory` invocation at `mutations.js:304` during the consent-verification step (before transaction begin), which is separate from both the CONCERN cleanup call at line 424 and the new lint-check call the spec introduces. The spec's AC-2.1 "shared with any other branch... and the helper is not invoked redundantly" reads as covering the cleanup-plus-lint pair, which is correct. The consent-step call at line 304 is a different concern that this sub-sprint does not address; the implementer should leave it untouched.

## Risk Assessment

The spec is ground-truth accurate. Function signatures, line numbers, the existing two-pronged `_resolveElementCategory` call sites in the RATIFY path, the lint-check ordering relative to derive/preconditions/postconditions, the four wire strings, the render record shape, the existing D11 tests' use of CONCERN subjects, and the 275/32 baseline all match. Implementers can rely on the file paths and line references as written. No remediation is required before plan-build.

<!-- created-at: 2026-05-20T11:01:58Z -->
<!-- produced-by design-specify@v0003 -->
