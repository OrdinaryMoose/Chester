# Threat Report — sprint-02-bug-fix-09

**Plan:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-09/plan/sprint-02-bug-fix-09-plan-00.md
**Combined implementation risk:** Low

## Why Low

- Both surfaced MEDIUM findings (one from adversarial attack, one from smell forecast) are single-line edits that have been applied inline before this report. No remaining MEDIUM or HIGH items.
- The remaining LOW findings (ratifyTarget scope widening, regex construction inside the inner loop, cross-file D11 contract reading dependency) describe shape concerns with no immediate risk and are either acknowledged in the plan itself or mitigated by inline comments.
- Plan-attack returned multiple VERIFIED CORRECT items confirming the structural soundness of the proposed sequence, the wire-string alignment between the exempt set and the resolver, the lift-and-share of the `ratifyTarget` declaration relative to the `try` block scope, and the correctness of AC-11.3 under the relocation.
- The plan's TDD ordering (Task 1 relocates existing tests first to preserve baseline; Task 2 introduces exempt-set logic with new exempt-passes tests; Task 3 swaps the matcher with new whole-word-passes tests; Task 4 documents) is structurally clean — no ordering hazards across tasks.

## Smell Heuristic Pre-Check

Matched triggers (case-insensitive):

- `async`, `await` — present in the `makeRealBridge` scaffold inherited verbatim from the established sprint-02-bug-fix-08 test pattern. Vitest convention.
- `persistence` — present in the `persistenceRepo` stub field, again from the established scaffold pattern.

Both matches reflect mechanical use of known-good scaffold code, not new concurrency primitives or new persistence pathways. The trigger list deliberately tunes toward over-firing; `plan-smell` ran in parallel with `plan-attack` as designed.

## Plan-Attack Findings

**Approved with one finding addressed inline:**

- **MEDIUM — Task 4 description inaccuracy:** the plan stated the Change Log would land "after the closing content of Section 12 (Element ID naming)". The document actually has a "Structured payload channel" section at lines 305-314 that follows Section 12. The mechanical verification step (`tail -15`) still passes regardless of which section precedes the appended Change Log, so this is documentation accuracy only. **Fix applied:** Task 4 Step 2's description now reads "At the very end of `VOCABULARY.md` — which currently terminates with the 'Structured payload channel' section (lines 305-314), after Section 12 — append:".

**Verified correct (no findings):**

- Wire-string matching in `VOCAB_LINT_EXEMPT_CATEGORIES` aligns with `ELEMENT_CATEGORIES` enum values returned by `_resolveElementCategory`.
- The `let ratifyTarget = null` declaration sits inside the `try` block at `mutations.js:350+`, in scope for both the CONCERN cleanup branch and the lint-check call site. Non-RATIFY verbs leave it `null`; the lint-check guard prevents the null from reaching `_vocabularyLintCheck` at all.
- `_resolveElementCategory` queries EDB declaration predicates (definition_decl, concern, risk_decl, etc.) — these are base facts written by `translate()` before the CONCERN cleanup block runs, independent of the `derive()` step.
- AC-11.3 passes under the relocation: empty `ratifiedDefs` short-circuit fires before the matcher is reached.
- Field name swap from `label` (CONCERN) to `statement` (RULE) is coherent with the RULE schema's `requiredFields: ['statement']`.
- Regex escape pattern in Task 3's matcher is syntactically correct JavaScript.

## Plan-Smell Findings

**MEDIUM addressed inline:**

- **Finding 1 — Implicit contract between `VOCAB_LINT_EXEMPT_CATEGORIES` wire strings and `ELEMENT_CATEGORIES` values:** the plan as initially written used raw string literals (`'definition'`, `'concern'`, `'risk'`, `'evidence'`) in the exempt-category Set. These happened to match the values exported from `ELEMENT_CATEGORIES`, but the binding was implicit. A future rename of any `ELEMENT_CATEGORIES` value would silently break the exempt-set without compile-time or test-time signal. **Fix applied:** Task 2 Step 3's exempt-set is now constructed from enum references (`ELEMENT_CATEGORIES.DEFINITION`, `.CONCERN`, `.RISK`, `.EVIDENCE`) rather than string literals. `mutations.js` already imports `ELEMENT_CATEGORIES` at the top, so no additional import is required.

**LOW findings (acknowledged, not actionable now):**

- **Finding 2 — `ratifyTarget` hoisting widens scope without lifecycle clarity.** The hoist from a tight `if`-block `const` to a function-scoped `let` is structurally sound for this sprint, but future code added after the hoist point could read `ratifyTarget` for a non-RATIFY operation and get `null` without obvious signal that the value is verb-gated. The plan's inline comment at the hoist site mitigates this; future-readers' visibility is the actual concern. Not actionable now.
- **Finding 3 — Regex constructed per (field × term) inside the inner loop.** `M × N` `RegExp` objects per `_vocabularyLintCheck` invocation. For current proof sizes this is not a practical issue. If canonical-term sets grow or per-element bulk ratification arrives in a future sprint, the inner-loop construction could become a hot path. The natural refactor (hoist regex compilation out of the field loop, keyed by term) is straightforward when needed. Not actionable now.
- **Finding 4 — D11 contract spans two test files.** Acknowledged in the plan itself, in the spec's Testing Strategy section, and in a file-level comment in the new test file. The new test file's comment names the cross-file reading dependency. Comments are not navigable from test runner output, so a developer chasing an AC-11.1 failure will land in `sprint-02-bug-fix-07.test.js` and need to know to consult the -09 file for full D11 context. Known debt, flagged for visibility.

**No finding:**

- `makeRealBridge` duplication across sprint test files is the established per-sub-sprint segregation convention, not a smell. The new file follows the same scaffold pattern as `sprint-02-bug-fix-08.test.js`.
- The `async`/`await` and `persistenceRepo` keyword matches reflect mechanical use of the established scaffold pattern; neither introduces new concurrency primitives or new persistence pathways.

## Combined Implementation Risk Statement

The plan is structurally sound and ready for execution as written. Both MEDIUM findings — one from each reviewer — have been addressed inline in the plan document. Remaining LOW findings describe shape concerns with no immediate impact and either are acknowledged in the plan or are mitigated by inline comments. The change is a one-directional relaxation of the existing vocabulary discipline (any element that currently ratifies continues to ratify), the test reorganization preserves all original test intents through targeted relocation, and the documentation update lands declaratively per the standalone-documentation discipline. Implementation can proceed to execute-write with subagent execution mode as pre-selected by the designer.

<!-- created-at: 2026-05-20T11:15:16Z -->
<!-- produced-by plan-build@v0004 -->
