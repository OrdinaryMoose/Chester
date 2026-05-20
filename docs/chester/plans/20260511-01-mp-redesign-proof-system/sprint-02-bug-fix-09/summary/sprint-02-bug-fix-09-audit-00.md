# Reasoning Audit: Vocabulary Discipline Refinement

**Date:** 2026-05-20
**Session:** `00`
**Plan:** `sprint-02-bug-fix-09-plan-00.md`

## Executive Summary

This session refined the proof system's pre-ratify vocabulary check so descriptive-category prose no longer trips the case-variance discipline, and replaced the substring matcher with a whole-word regex matcher under a narrow word-character set. The most consequential decision was locking the fix at the engine (`_vocabularyLintCheck` in `mutations.js`) rather than adding a wrapper or boundary layer above it — that framing call was made by the designer in response to a live StoryDesigner proof whose arbiter scripts had layered three runtime patches around the strict lint. Implementation stayed on-plan throughout the four TDD tasks; the only post-execution refactor was a code-review-driven unification of `_resolveElementCategory` from two calls to one per RATIFY, which landed as a follow-up commit (`def1f03`) rather than being folded into the original feature commit.

## Plan Development

The plan was developed through the full Chester design pipeline: a design-small-task conversation surfaced five locked design decisions (granularity, exempt set, matcher shape, doc placement, doc discipline), which design-specify formalized into a 12-AC spec after a parallel three-agent dispatch (architect A on exempt-set encoding, architect B on test-file segregation, explorer on prior art). The spec went through fidelity review (clean) and adversarial review (three MEDIUMs, all fixed inline). plan-build produced a four-task TDD plan that went through plan-attack and plan-smell (two MEDIUMs, three LOWs; the two MEDIUMs fixed inline, the three LOWs accepted with named mitigations). The execute phase ran with subagent dispatch, the user opting for an uninterrupted flow except on designer-level findings.

## Decision Log

### Direct engine fix vs. wrapper/boundary layer

**Context:**
After diagnosing that the lint's three failure modes (case-only, substring with no word-boundary, morphological inflection) were all structurally embedded in `_vocabularyLintCheck`, the designer asked whether to fix the engine or to keep the StoryDesigner-side wrapper pattern that had already been deployed downstream.

**Information used:**
- The three-patch arbiter-script pattern at `~/RiderProjects/StoryDesigner/docs/chester/working/20260426-01-update-project-architecture-rev-01/ncon-06-build-result-subscription/design/proof/arbiter-scripts` (word-boundary guard, self-term skip, cross-term skip on prose-bearing predicates)
- The fact that the workaround was sophisticated, layered, and load-bearing (not a one-off comment-out) — a signal that the engine contract itself was wrong, not just the call sites
- The proof-layer's existing `_vocabularyLintCheck` location at `mutations.js:41` and the existing test file `__tests__/sprint-02-bug-fix-07.test.js`

**Alternatives considered:**
- `Keep the wrapper pattern` — rejected because the downstream patches were already structural and load-bearing, demonstrating that the contract itself produced unworkable false positives in descriptive prose
- `Add a new boundary layer between caller and engine` — rejected explicitly by the designer ("I would like to fix the engine, not make another boundary layer")

**Decision:** Fix the engine directly in `_vocabularyLintCheck` with two changes (category exemption and whole-word matcher); leave downstream wrapper removal to the operator's schedule.

**Rationale:** The downstream workaround was diagnostic, not corrective — its existence and shape proved the engine contract was the actual defect. A direct engine fix removes the wrapper's reason-to-exist entirely; a boundary layer would preserve the bug and add coupling.

**Confidence:** High — designer stated the choice in direct words.

---

### Standalone-documentation discipline

**Context:**
Mid-design, the assistant was framing the new contract by reference to the old contract (comparative framing, "what changes" prose). The designer interrupted to establish a different documentation principle that would apply to all artifacts in this sub-sprint and going forward.

**Information used:**
- The assistant's own drift into comparative framing across two consecutive info packages
- The structure of Chester artifacts (brief, spec, plan, vocabulary doc) — each has a discrete audience and a discrete current-state to describe
- The fact that lineage information is real and load-bearing but does not belong inline in declarative prose

**Alternatives considered:**
- `Comparative framing throughout` — rejected because it forces every reader to reconstruct the old state to understand the current state
- `No lineage record at all` — rejected because the history is genuinely informative for future maintainers
- *(The designer named the principle directly; the assistant did not surface alternatives before adopting it)*

**Decision:** Every artifact describes its current state declaratively as authoritative on its own; lineage lives in a Change Log section at the end of each document.

**Rationale:** Comparative framing creates a chain of dependent reads (you must read the old version to understand the new); declarative framing makes each artifact self-contained. The Change Log is a deliberate, bounded place for history rather than letting history bleed through the body.

**Confidence:** High — designer stated the principle in direct words; a feedback memory entry (`feedback_standalone_documentation.md`) was saved.

---

### Category-level vs. field-level granularity

**Context:**
After the exempt category set was locked (Definition, Concern, Risk, Evidence), the design needed to commit on granularity: whether exemption applies to whole categories or to specific fields within categories (e.g., a Rule's `rationale` could be exempt while its `statement` stayed strict).

**Information used:**
- The StoryDesigner workaround's actual shape — it exempted categories wholesale, not fields
- The schema registry's existing per-category metadata pattern
- The sub-sprint's stated scope (a bounded engine fix), not a structural redesign

**Alternatives considered:**
- `Field-level granularity` — rejected because it would require schema-registry changes, per-field metadata, and a more complex matcher contract; out of scope for a bug-fix sub-sprint
- `Per-Definition lint_policy or lexical_variants` — rejected explicitly as out of scope in the sub-sprint plan
- `Category-level granularity` — selected

**Decision:** Exemption is by category; rationale fields on Rule and Permission stay strict alongside their statement fields.

**Rationale:** Category-level is what the live workaround validated empirically. Field-level granularity is a future option that can be added later without revisiting this sub-sprint's choices (the brief explicitly carries this forward-compatibility note). Holding the line on scope preserved the bug-fix character of the sub-sprint.

**Confidence:** High — designer answered the question directly ("category-level granualrity").

---

### Narrow word-character class for the matcher

**Context:**
Once the whole-word matcher was committed, the engine needed a precise definition of what separates one word from the next. The choice was between the language-default sense (letters, digits, underscore as word characters) and a narrower sense (only letters and digits; underscore counts as a separator).

**Information used:**
- The live StoryDesigner workaround's actual matcher — it used the narrower sense
- The shape of compound identifiers in proof prose (underscore-joined, hyphen-joined)
- The principle that whatever the engine commits to here will lock behavior across every future proof

**Alternatives considered:**
- `Language-default class (`\w` semantics: letters, digits, underscore)` — rejected because underscore-joined compound identifiers would slip through as single tokens, and the workaround already proved the narrower sense was needed
- `Narrow class (letters and digits only)` — selected

**Decision:** Underscore, hyphen, period, apostrophe, and whitespace all act as word separators; only letters and digits are word characters.

**Rationale:** Matched the live workaround's empirically-validated behavior. The narrower sense catches more edge cases as intended; the engine's job is discipline, and discipline argues for the tighter boundary.

**Confidence:** High — designer answered "narrow" directly to a binary prompt.

---

### Test reorganization — relocate vs. amend in-file

**Context:**
Under the new contract, three D11 assertions in `sprint-02-bug-fix-07.test.js` (AC-11.1, AC-11.2, AC-11.3) would undergo semantic drift if left in place: AC-11.1 would fail outright (Concern is now exempt, so the violation no longer fires), and AC-11.2/AC-11.3 would pass via the new exempt-category early-exit path rather than via the behaviors they originally asserted. The spec needed to commit on how to reorganize the contract.

**Information used:**
- The proof-layer's per-sub-sprint test-file convention (each sub-sprint adds its own AC file)
- Architect B's analysis on test-file segregation
- The adversarial spec review's MEDIUM-2 finding: "AC-11.2 and AC-11.3 in the same file are not touched" was wrong as originally written
- The fact that the original test intents on AC-11.1, AC-11.2, AC-11.3 are still valid — just on a different category

**Alternatives considered:**
- `Leave existing tests in place and add new file` — rejected because AC-11.1 would fail and AC-11.2/AC-11.3 would silently shift their assertion semantics
- `Rewrite tests in place in sprint-02-bug-fix-07.test.js` — rejected because per-sub-sprint test-file segregation is the established convention and the new contract is this sub-sprint's contribution
- `Relocate the three subjects from CONCERN to RULE in the existing file, and add new ACs in a new sprint-02-bug-fix-09.test.js file` — selected

**Decision:** Move AC-11.1, AC-11.2, AC-11.3 in `sprint-02-bug-fix-07.test.js` from `ELEMENT_CATEGORIES.CONCERN` (field `label`) to `ELEMENT_CATEGORIES.RULE` (field `statement`); add four new ACs (AC-11.4 through AC-11.7) in a new `sprint-02-bug-fix-09.test.js` file.

**Rationale:** Relocation preserves the original test intents on a non-exempt category, so the original tests still measure what they were always meant to measure. The new file segregates this sub-sprint's added contract surface per convention, making the lineage of D11 visible in `git log` and across files.

**Confidence:** High — both the spec adversarial review and the dispatcher's hybrid called for this shape, and the plan executed it as Task 1.

---

### Exempt-set encoding — enum references vs. string literals

**Context:**
The exempt-set initially landed in the plan as a frozen Set of raw wire strings (`'definition'`, `'concern'`, `'risk'`, `'evidence'`). Plan-smell flagged this as a silent-failure risk: if any `ELEMENT_CATEGORIES` enum value is ever renamed in a future sprint, the exempt set would silently stop matching with no test failure (because the raw strings wouldn't update).

**Information used:**
- The existing `ELEMENT_CATEGORIES` enum in the domain layer
- The plan-smell finding's specific failure mode (silent drift on rename)
- The pattern elsewhere in the codebase that uses enum references for cross-module category identity

**Alternatives considered:**
- `Raw string literals` — rejected because of the silent-failure-on-rename risk
- `Enum references (`ELEMENT_CATEGORIES.DEFINITION` etc.)` — selected

**Decision:** Build `VOCAB_LINT_EXEMPT_CATEGORIES` from `ELEMENT_CATEGORIES.*` enum references, not from raw wire strings.

**Rationale:** Enum references propagate automatically if the canonical wire values are ever renamed; raw strings would silently stop matching with no compile-time or test-time signal. The cost is zero (same Set, different source); the safety gain is real.

**Confidence:** High — plan-smell finding was explicit and the fix was applied inline to the plan before execution.

---

### `_resolveElementCategory` unification — refactor as follow-up commit

**Context:**
The full code review at the end of execution surfaced one Important finding: a strict reading of AC-2.1 ("shared with any other branch that consumes it") said the unification of `_resolveElementCategory` should cover all three call sites within RATIFY (the step-2 consent lookup, the step 5.5 CONCERN cleanup, and the step 8b lint gate), but the implementation as landed had only unified two of them. The third call at the consent lookup was still independent.

**Information used:**
- The code review's strict-reading interpretation of AC-2.1
- The ground-truth report from spec time had already noted the consent-step call was independent and AC-2.1 didn't claim to deduplicate it — but the code review took a tighter reading
- The fact that the change is a refactor with no behavior change (still 279/279 tests passing)
- The standalone-documentation discipline applied at commit boundaries (each commit's subject reads declaratively about what landed)

**Alternatives considered:**
- `Amend the original Task 2 commit to fold the unification in` — rejected because that would obscure the lineage of "what landed because of which review" in `git log`
- `Defer the unification to a future sprint` — rejected because the finding was Important and the fix was small and verified
- `Land the unification as a separate refactor commit` — selected

**Decision:** Commit the unification as `def1f03` with subject `refactor(design-proof-system): single _resolveElementCategory call per RATIFY`, as a follow-up to Task 2.

**Rationale:** A separate commit preserves the "this landed because of code review" lineage in `git log`, consistent with the standalone-documentation discipline applied at commit boundaries. Folding it into Task 2 would hide the review-driven shape of the cleanup. The refactor is behavior-preserving (test count unchanged), so isolating it as its own commit costs nothing and clarifies intent.

**Confidence:** High — the assistant explicitly named the rationale in the post-verification recap.

---

### Documentation placement — VOCABULARY.md Section 11 + end-of-doc Change Log

**Context:**
The standalone-documentation discipline raised a real question: where does the new mechanical-enforcement description live in `VOCABULARY.md`, and where does the lineage of this update get recorded?

**Information used:**
- `VOCABULARY.md`'s existing Section 11 (Naming hygiene rules) — already names "do not invent synonyms" and "use capitalized noun form" as authoring guidance
- The standalone-documentation principle: body describes current state; lineage lives in a Change Log section at the end
- The fact that no prior Change Log section existed in `VOCABULARY.md` — this would be the first entry
- Plan-attack finding that the originally-planned location (after Section 12) was inaccurate — the Change Log actually lands after the "Structured payload channel" section

**Alternatives considered:**
- `Add a brand-new section dedicated to mechanical enforcement` — rejected because Section 11 already covers naming hygiene and the new paragraph belongs in that context
- `Put the matcher's character-set specifics in VOCABULARY.md` — rejected because those details belong in the spec (different audience); the doc names categories, not character classes
- `Inline change-log notes scattered through the document` — rejected as inconsistent with the standalone-documentation discipline

**Decision:** Add one paragraph to Section 11 naming the mechanical enforcement and the five argumentative + four exempt categories; append a new Change Log section at the end of `VOCABULARY.md` with a single dated entry for this update.

**Rationale:** Section 11 is where naming-hygiene rules already live, so a future reader looking up the discipline finds the mechanical-enforcement description in context. The matcher's character-set lives in the spec because the audience (engine maintainer) is different. The Change Log establishes a new lineage-record convention for `VOCABULARY.md` that future updates can extend.

**Confidence:** Medium — the placement was settled across multiple design-conversation turns and one plan-attack correction; the rationale is consistent with the standalone-documentation discipline but the specific section-anchor choice (Section 11) was inferred more than directly debated.

---

### Dispatch shape — three parallel agents (two architects + one explorer)

**Context:**
Design-specify needed to formalize the brief into a spec, but the brief left two real spec-layer architectural choices open: where the exempt-category list lives in code, and how the test contract is reorganized across files. The dispatcher pattern is to fork architects on real tensions.

**Information used:**
- The brief locked five design decisions but explicitly left two open at the spec layer
- The two open questions touched different parts of the codebase (enforcement layer vs. test files) — complementary, not competing
- The Chester design-specify skill's parallel-dispatch convention (two architects on real tensions, one explorer for prior art)

**Alternatives considered:**
- `Single architect on both tensions` — rejected because the parallel-dispatch pattern surfaces independent perspectives without compromise
- `Three architects with overlapping scope` — rejected because the two real tensions were complementary, not competing, so two architects were enough
- `Skip the explorer and rely on session-context for prior art` — rejected because the prior-art question (precedents and adjacent sub-sprints) needed dedicated treatment

**Decision:** Dispatch architect A on exempt-set encoding, architect B on test-file segregation, and an explorer on prior art — all three in parallel.

**Rationale:** Each architect optimized for one axis without compromise, and because the axes were complementary the dispatcher's eventual hybrid was a principled merge rather than a forced trade-off. The explorer surfaced the field-observation provenance distinction that became a handoff note for the master plan.

**Confidence:** Medium — the dispatch was the assistant's framing of the design-specify pattern; the designer approved the hybrid afterwards but didn't shape the dispatch directly.

<!-- produced-by finish-write-records@v0003 -->
