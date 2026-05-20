# Spec: Vocabulary Discipline Refinement

**Sprint:** sprint-02-bug-fix-09
**Parent brief:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-09/design/sprint-02-bug-fix-09-design-00.md
**Architecture:** Hybrid principled merge — minimal-surface encoding of the exempt-category set in the enforcement layer combined with per-sub-sprint test segregation, joined by a single targeted update to the canonical vocabulary document.

## Goal

The proof system's vocabulary discipline fires at the RATIFY operation step in the engine layer. The discipline scans the element being ratified for case-variant occurrences of canonical terms previously established by ratified Definitions. The current contract polices every element category uniformly and matches canonical terms by case-folded substring scan. Both choices produce unworkable false positives in descriptive prose, where canonical terms naturally appear as common nouns and inflected forms.

This spec formalizes a refinement to the discipline. Four element categories whose primary text is descriptive — Definition, Concern, Risk, and Evidence — are exempt from the mechanical check. The remaining element categories continue to be policed. The matcher itself replaces its substring scan with a whole-word match under a narrow word-character set (letters and digits count as word characters; underscore, hyphen, period, apostrophe, and whitespace separate words). The authoring rule itself does not change; only the engine's mechanical enforcement narrows.

## Components

- **Enforcement layer (`skills/design-proof-system/references/domain/mutations.js`).** A module-level frozen set named `VOCAB_LINT_EXEMPT_CATEGORIES` is added immediately before the existing `_vocabularyLintCheck` function. The set contains four wire-string values: `'definition'`, `'concern'`, `'risk'`, `'evidence'`. The `_vocabularyLintCheck` function gains a third parameter `elementCategory` (a wire-string value or `null`); its body adds an early-exit branch immediately after the ratified-definitions short-circuit. The substring matcher inside the inner loop is replaced with a whole-word matcher using a regular expression with `(?<![A-Za-z0-9])` and `(?![A-Za-z0-9])` lookarounds, constructed with the case-insensitive flag (`i`) so a canonical term is located regardless of casing. Canonical-term values are regex-escaped before being inserted. The matched substring is extracted from the candidate text in its original case and compared against the canonical term's exact case to detect case variance. The RATIFY step in `runOperation` is modified to resolve the element's category via the existing `_resolveElementCategory` helper and pass the resolved value as the new third argument. The existing `ratifyTarget` declaration in the CONCERN cleanup block is lifted to a single declaration at a higher position in the same function so both the lint call site and the cleanup branch consume the same resolved value.

- **Canonical vocabulary document (`skills/design-proof-system/references/domain/VOCABULARY.md`).** Section 11 (Naming hygiene rules) receives one new paragraph after the existing bullet list. The paragraph names the mechanical enforcement, names the four exempt element categories by their Capitalized noun forms, and states the whole-word matching rule in prose. Matcher character-set specifics do not appear in this document. A new "Change Log" section is appended at the document's end with one entry for this update.

- **New test file (`skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-09.test.js`).** Holds four new acceptance assertions covering the new contract surface. The file follows the same scaffold pattern as `sprint-02-bug-fix-08.test.js` (per-file inline `makeRealBridge` helper, frozen clock, designer-consent constant). A file-level comment names the cross-file reading dependency for the discipline's full contract.

- **Existing test file (`skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js`).** All three D11 assertions (AC-11.1, AC-11.2, AC-11.3) are modified in place to switch the element category in their `addElement` calls from `ELEMENT_CATEGORIES.CONCERN` (with field `label`) to `ELEMENT_CATEGORIES.RULE` (with field `statement`). The describe block label, the per-test `it` descriptions, and the assertion expectations are preserved unchanged. The relocation preserves the original test intents — AC-11.1 continues to lock the violation path on a non-exempt category, AC-11.2 continues to lock canonical-form-passes on a non-exempt category, AC-11.3 continues to lock the no-ratified-definitions early-exit short-circuit on a non-exempt category. Without these three relocations, AC-11.2 and AC-11.3 would still pass mechanically but for the wrong reason (the new exempt-category early-exit branch would short-circuit them before reaching their original behavior). No other tests in this file are touched.

## Data Flow

A RATIFY operation enters `runOperation` and progresses through the pipeline: load-state, verify-consent, begin-transaction, mutate, postconditions, **lint-check (step 8b)**, customPostCheck, commit-or-rollback, save-state. Only step 8b is modified.

At the start of step 8b, the call site invokes `_resolveElementCategory(args.elementId, ports.query)` (if not already invoked earlier in the same RATIFY operation; see Components above). The resolved value — a wire string from `ELEMENT_CATEGORIES` or `null` — is passed as the third argument to `_vocabularyLintCheck`.

Inside `_vocabularyLintCheck`, control flows in this order:

1. Query the engine for ratified `definition/3` rows. If none exist, return `null`.
2. Extract canonical terms from the rows. If none, return `null`.
3. **Early-exit branch (new).** If `elementCategory` is non-null and `VOCAB_LINT_EXEMPT_CATEGORIES.has(elementCategory)` is true, return `null`. The element is in a descriptive category and is not subject to the check.
4. Render the element's deep record via `renderElementDeep`. If the record cannot be obtained, return `null`.
5. For each string-valued field on the record, and for each canonical term, evaluate the whole-word regex against the field value. The regex is constructed with the case-insensitive flag (`i`) so it locates the canonical term in the candidate text regardless of case. The matched substring is then extracted from the candidate text in its original case and compared against the canonical term's exact case: if they differ, the substring is a case-variant violation; if they match, the candidate text used the canonical form and no violation fires. The first violation found returns `{ field, value: matchedSubstring, canonicalTerm: term }`.
6. If no field-term pair produces a violation, return `null`.

The call site treats the return value as before: `null` means the lint passed; a non-null value causes the call site to throw `DomainError({ code: 'VOCABULARY_LINT_VIOLATION', ...violation })`, which the surrounding `try` block in `runOperation` catches and converts into a transaction rollback.

## Error Handling

The error contract is unchanged. `VOCABULARY_LINT_VIOLATION` continues to be the sole error code emitted by the lint check. The error payload continues to carry `field`, `value`, and `canonicalTerm` fields. Callers that pattern-match on the code continue to function.

The new `elementCategory` parameter is treated defensively: a `null` value (which would arise if `_resolveElementCategory` could not determine the category from the EDB) causes the early-exit branch to be skipped, falling through to the full check. This preserves behavior for any edge case where category resolution fails.

Canonical-term values are escaped with the standard JavaScript regex-metacharacter escape pattern (`replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')`) before being inserted into the regex source. This prevents canonical terms containing regex-metacharacters (such as a term whose canonical form contains a period or other special character) from producing invalid regexes or matching too broadly.

If `renderElementDeep` returns a record without a `predicate` field on it (an internal invariant violation), the early-exit branch is skipped and the check proceeds; this means a malformed record is still subjected to the matcher rather than silently exempted. The existing behavior of returning `null` when the record cannot be obtained at all is preserved.

## Testing Strategy

Tests are organized across two files following the per-sub-sprint segregation convention.

- **`sprint-02-bug-fix-09.test.js` (new).** Locks the four new contract assertions: exempt category passes (Concern subject), exempt category passes (Risk subject), inflection passes on non-exempt category (Rule subject with `Cache` canonical and `cached results expire after timeout` statement), regression lock for canonical form on non-exempt category (Rule subject with `Visibility` canonical and `Visibility drives the architecture` statement).
- **`sprint-02-bug-fix-07.test.js` (existing, targeted edits).** All three D11 assertions (AC-11.1, AC-11.2, AC-11.3) are modified in place to use a Rule element instead of a Concern. AC-11.1 continues to fire `VOCABULARY_LINT_VIOLATION` under the new code; AC-11.2 continues to lock canonical-form passes lint; AC-11.3 continues to lock the no-ratified-definitions early-exit short-circuit. All three relocations preserve original test intents and prevent semantic drift via the new exempt-category early-exit branch.
- **All other test files in the domain layer (unchanged).** The baseline of 275 passing tests across 32 test files is preserved. The new test file adds at least four passing assertions; the sub-sprint is complete only when the union passes.

Test execution: `npm test` in `skills/design-proof-system/references/domain/`. No new test infrastructure or runner configuration.

The architectural-cascade probe is not in scope; this spec does not run or reference any probe artifact.

## Constraints

- The change is one-directional in its passing/failing behavior. Any element that currently ratifies without a violation continues to ratify without a violation; the change only removes blocking paths. Proofs in the field require no migration.
- Code changes are confined to `mutations.js` in the production code tree, plus the two test files described above. The schema registry (`schema.js`) is not touched. The render layer is not touched. The bridge facade is not touched. The lifecycle, closure-policy, friction-policy, restructuring, and counterfactual modules are not touched.
- The mechanical enforcement remains tied to ratification time. Elements ratified before a canonical term was fixed are not retroactively re-checked.
- The hard cross-system boundary defined in the project's root `CLAUDE.md` is preserved across every artifact this sub-sprint produces. The other system is not named, read, grepped, or referenced in any code change, test, documentation update, or further spec content.
- All artifacts produced or modified by this sub-sprint follow the standalone-documentation discipline: bodies describe current state declaratively, and lineage lives in an end-of-document change log.

## Non-Goals

- Per-field granularity within an element category. Rationale fields on rules and permissions remain under the same discipline as their statement fields.
- Per-element-type policy declarations, lexical-variant lists allowing multiple legal forms per canonical term, or any alternative form of vocabulary discipline beyond the case-variance check.
- Synonym drift detection. The discipline catches case variance only; substituting an entirely different word for a canonical term is invisible to the engine and remains so.
- Modifications to the schema registry, the operation registry, the lifecycle module, the closure policy module, the friction policy module, or any persistence layer.
- Removal of downstream operator-side wrapper scripts that currently bypass the strict check. Downstream removes those on its own schedule.
- Any cascade-spec-probe coverage, related architectural-invariant verification, or coordination with peer sub-sprints in the master plan beyond honoring artifacts those sub-sprints have already merged to main.

## Acceptance Criteria

### AC-1.1 — Exempt-Set Encoding

**Observable boundary:**
- The `_vocabularyLintCheck` function accepts an `elementCategory` parameter as its third argument
- The function exits early with `null` when the argument is a non-null wire string that is a member of the frozen `VOCAB_LINT_EXEMPT_CATEGORIES` set
- The exempt set contains exactly the four wire-string values: `'definition'`, `'concern'`, `'risk'`, `'evidence'`

**Given:** ratified canonical terms exist in the proof state
**When:** `_vocabularyLintCheck` is invoked with an `elementCategory` value matching one of the four exempt wire strings
**Then:** the function returns `null` without rendering the element record and without entering the matcher loop

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Non-Exempt Category Subject to Check

**Observable boundary:**
- `_vocabularyLintCheck` proceeds past the early-exit branch when `elementCategory` is a non-exempt wire string
- `_vocabularyLintCheck` also proceeds past the early-exit branch when `elementCategory` is `null` (defensive fallthrough on category-resolution failure)

**Given:** ratified canonical terms exist in the proof state and the element's category is non-exempt (or is `null`)
**When:** `_vocabularyLintCheck` is invoked
**Then:** the function renders the element's deep record and evaluates the matcher against each string-valued field

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — Whole-Word Matcher with Narrow Word-Character Set

**Observable boundary:**
- The matcher produces a violation only when a canonical term appears in a candidate field as a whole word under the narrow word-character set
- Word characters are letters and digits (`[A-Za-z0-9]`); underscore, hyphen, period, apostrophe, and whitespace separate words
- The match is **case-insensitive** — a canonical term is located in the candidate text regardless of casing, and the matched substring is then compared back against the canonical term's exact case to detect case variance
- Inflections and compound forms that contain the canonical term as a substring do not produce a violation

**Given:** a canonical term `Submit` is ratified and an element's field text contains the substring `submission`
**When:** the matcher evaluates that field against that canonical term
**Then:** no violation is produced — the character immediately following the candidate substring (`s`) is a word character, so the right-side lookahead fails

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.4 — Case-Variance Violation Payload Preserved on Non-Exempt Category

**Observable boundary:**
- A non-exempt element whose field text contains a canonical term as a whole word in non-canonical case produces a violation
- The violation payload object has fields `field`, `value`, and `canonicalTerm`
- The `value` field carries the matched substring as it appears in the candidate text (preserving the non-canonical casing); the `canonicalTerm` field carries the term as ratified

**Given:** a canonical term `Submit` is ratified and a Rule element's `statement` field contains the standalone word `submit` in lowercase
**When:** `_vocabularyLintCheck` is invoked for that element
**Then:** the function returns a non-null violation object with `field: 'statement'`, `value: 'submit'`, `canonicalTerm: 'Submit'`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — RATIFY Call Site Passes Resolved Category

**Observable boundary:**
- The RATIFY step in `runOperation` resolves the element's category via the existing `_resolveElementCategory` helper
- The resolved value is passed as the third argument to `_vocabularyLintCheck`
- The resolved value is shared with any other branch in the same RATIFY operation that consumes it (notably the CONCERN cleanup block at `mutations.js:423–428`, which currently performs its own resolution earlier in the function body — before derive, preconditions, and postconditions, while the lint check runs at step 8b after those)

**Given:** a RATIFY operation is in flight in `runOperation`
**When:** control reaches the lint-check step
**Then:** the resolved category value passed to `_vocabularyLintCheck` is the same value used by any other step in the same operation that consumes the resolved category, and the helper is not invoked redundantly for the same element

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Concern Element Exempt at Ratification (Integration)

**Observable boundary:**
- A Concern element whose `label` field contains a non-canonical case form of a ratified canonical term ratifies without throwing
- The ratification commits — the `approved` and `two_yes` facts for the Concern derive into the EDB

**Given:** a ratified Definition with `canonical_name: 'Reachability'` exists and a Concern with `label: 'uses reachability here'` has been added
**When:** `bridge.ratifyElement` is invoked on the Concern with designer consent
**Then:** the call returns without throwing, and a subsequent `bridge.getProofState()` shows the Concern in its ratified collection

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — Risk Element Exempt at Ratification (Integration)

**Observable boundary:**
- A Risk element whose `statement` field contains a non-canonical case form of a ratified canonical term ratifies without throwing
- The ratification commits

**Given:** a ratified Definition with `canonical_name: 'Throughput'` exists, an Evidence element exists (RATIFY precondition), and a Risk with `statement: 'throughput may degrade under load'` and `basis` referencing the Evidence has been added
**When:** `bridge.ratifyElement` is invoked on the Risk with designer consent
**Then:** the call returns without throwing

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.3 — Inflection Passes on Non-Exempt Category (Integration)

**Observable boundary:**
- A Rule element whose statement contains a word that is an inflection of a ratified canonical term ratifies without throwing
- The matcher's whole-word boundary is exercised: the canonical appears as a substring of the inflected form but not as a whole word under the narrow word-character set

**Given:** a ratified Definition with `canonical_name: 'Cache'` exists and a Rule with `statement: 'cached results expire after timeout'` has been added
**When:** `bridge.ratifyElement` is invoked on the Rule with designer consent
**Then:** the call returns without throwing — `cache` is a substring of `cached` but not a whole word

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.4 — Regression Lock for Canonical Form on Non-Exempt Category

**Observable boundary:**
- A Rule element whose statement contains a ratified canonical term in its exact canonical form ratifies without throwing
- This locks the behavior that existed before the refinement and must continue after

**Given:** a ratified Definition with `canonical_name: 'Visibility'` exists and a Rule with `statement: 'Visibility drives the architecture'` has been added
**When:** `bridge.ratifyElement` is invoked on the Rule with designer consent
**Then:** the call returns without throwing

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.5 — Existing D11 Tests Relocated to Non-Exempt Category

**Observable boundary:**
- All three D11 assertions (AC-11.1, AC-11.2, AC-11.3) in `sprint-02-bug-fix-07.test.js` have their `addElement` calls' `idShape` switched from `ELEMENT_CATEGORIES.CONCERN` to `ELEMENT_CATEGORIES.RULE` and the corresponding field key switched from `label` to `statement`
- The describe block label, the per-test `it` descriptions, and the assertion expectations are preserved unchanged for all three
- AC-11.1 continues to fire `VOCABULARY_LINT_VIOLATION` under the new code
- AC-11.2 continues to pass (canonical form does not produce a violation on a non-exempt category)
- AC-11.3 continues to pass (no ratified Definitions means the early-exit short-circuit fires regardless of the element being non-exempt)

**Given:** the existing test file is read after the three targeted edits
**When:** the test suite runs against the refined `_vocabularyLintCheck`
**Then:** all three assertions produce their expected outcomes, preserving the original D11 contract semantics on a non-exempt subject category

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — Vocabulary Document Update

**Observable boundary:**
- The canonical vocabulary document at `skills/design-proof-system/references/domain/VOCABULARY.md` has a new paragraph in its Section 11 describing the mechanical enforcement
- The paragraph names the four exempt categories by Capitalized noun form: Definition, Concern, Risk, Evidence
- The paragraph states the whole-word matching rule in prose
- Matcher character-set specifics do not appear in this document
- The document has a new "Change Log" section at its end with at least one entry describing this update

**Given:** the document is opened and read sequentially
**When:** the reader reaches Section 11
**Then:** the reader can determine what the mechanical enforcement does and which categories it polices, without consulting the spec or the code

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — Regression Suite Passes

**Observable boundary:**
- All previously passing tests in the domain layer continue to pass after the refinement lands
- The new test file adds at least four passing assertions
- The total passing test count is at least 279 (the prior baseline of 275 plus the new assertions)

**Given:** the refinement is implemented per this spec
**When:** `npm test` runs in `skills/design-proof-system/references/domain/`
**Then:** the test runner reports zero failures and the passing count meets or exceeds the threshold above

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-20T10:53:36Z -->
<!-- produced-by design-specify@v0003 -->
