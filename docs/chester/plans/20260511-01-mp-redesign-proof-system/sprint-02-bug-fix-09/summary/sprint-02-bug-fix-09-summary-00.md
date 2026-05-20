# Session Summary: Vocabulary Discipline Refinement

**Date:** 2026-05-20
**Session type:** Full pipeline (design → spec → plan → execute → verify)
**Plan:** `sprint-02-bug-fix-09-plan-00.md`

## Goal

Refine the proof system's pre-ratify vocabulary check (`_vocabularyLintCheck` in `skills/design-proof-system/references/domain/mutations.js`) so descriptive element categories (Definition, Concern, Risk, Evidence) are exempt from the case-variance check, and replace the substring matcher with a whole-word regex matcher under a narrow word-character set. Driven by a field finding from a downstream StoryDesigner proof whose arbiter scripts had been patching around the strict lint with three layered runtime overrides — evidence that the existing discipline produced unworkable false positives in descriptive prose.

## What Was Completed

### Engine refinement

- `_vocabularyLintCheck` accepts a third `elementCategory` parameter and exits early when the category is in a module-level frozen exempt set (`VOCAB_LINT_EXEMPT_CATEGORIES`). The exempt set is built from `ELEMENT_CATEGORIES.*` enum references rather than raw string literals, foreclosing silent-failure if the canonical enum values are ever renamed.
- The inner matcher loop replaces the case-folded substring scan with a case-insensitive regex matcher using `(?<![A-Za-z0-9])` and `(?![A-Za-z0-9])` lookarounds. Canonical-term values are regex-escaped before being inserted. The matched substring is extracted from the candidate text in its original case and compared against the canonical term's exact case to detect case-variance.
- The RATIFY call site in `runOperation` resolves the element's category exactly once — at the step-2 consent lookup — and threads the resolved value through the CONCERN cleanup at step 5.5 and the lint-check gate at step 8b. Prior to this sprint, `_resolveElementCategory` was being called twice per RATIFY operation; the unification was applied as a follow-up commit after the code review surfaced the partial coverage.

### Test reorganization

- Three existing D11 assertions in `sprint-02-bug-fix-07.test.js` (AC-11.1, AC-11.2, AC-11.3) were relocated from `ELEMENT_CATEGORIES.CONCERN` with field `label` to `ELEMENT_CATEGORIES.RULE` with field `statement`. The relocation preserves the original test intents on a non-exempt category — without it, AC-11.1 would have failed under the new contract (Concern is exempt; the violation no longer fires) and AC-11.2/AC-11.3 would have passed via the new exempt-category early-exit rather than via their original behaviors.
- A new test file `sprint-02-bug-fix-09.test.js` was created carrying four new acceptance assertions: AC-11.4 (Concern element with non-canonical case form is exempt), AC-11.5 (Risk element with non-canonical case form is exempt), AC-11.6 (inflection of a canonical term passes on a non-exempt element via the whole-word matcher), and AC-11.7 (canonical form on a non-exempt element passes — regression lock).

### Documentation

- `VOCABULARY.md` Section 11 (Naming hygiene rules) received a new paragraph describing the mechanical enforcement and naming the five argumentative categories (Proposition, Resolution, Rule, Permission, Friction) plus the four exempt descriptive categories (Definition, Concern, Risk, Evidence). The matcher's character-set specifics are deliberately omitted from this document — they live in the spec.
- A new Change Log section was appended to the end of `VOCABULARY.md` with a single dated entry for this update, per the standalone-documentation discipline established mid-design.

### Review-driven refinements

Reviews surfaced six findings; all were addressed inline:

- **Spec adversarial review** found three MEDIUMs: AC-2.1 reversed the direction of CONCERN cleanup relative to the lint check; AC-11.2 and AC-11.3 in the existing test file would undergo semantic drift unless also relocated; case-insensitivity of the whole-word matcher was not explicit in the spec. All three fixed by editing the spec.
- **Plan hardening** surfaced two MEDIUMs: the exempt-set encoding initially used string literals (smell-flagged for silent-failure risk on enum rename); Task 4's description of the document structure was inaccurate (the Change Log lands after the "Structured payload channel" section, not after Section 12 as the plan stated). Both fixed inline in the plan.
- **Per-task quality reviews** surfaced two Minor and one Important during execution: a stale code comment in the Task 1 commit was amended; two forward-looking comments in Task 2's code described Task 3's end state — fixed to describe the current commit's state per the standalone-doc discipline; and the Important finding from the full code review surfaced that `_resolveElementCategory` was still being called twice per RATIFY (the unification refactor landed as commit `def1f03`).

## Verification Results

| Check | Result |
|-------|--------|
| `npm test` in `skills/design-proof-system/references/domain/` (baseline) | 275 passed across 32 files |
| `npm test` after Task 2 | 277 passed across 33 files |
| `npm test` after Task 3 | 279 passed across 33 files |
| `npm test` after unification refactor | 279 passed across 33 files |
| `git status --porcelain` at checkpoint | clean |

## Known Remaining Items

- The downstream StoryDesigner proof's three-patch wrapper around `ratifyDefinition`, `ratifyConcern`, and `ratifyElement` can be removed once this engine refinement is merged. Removal is downstream's responsibility per the brief's explicit out-of-scope note; not tracked here.
- Three LOW findings from plan-smell are acknowledged as known shape concerns, none actionable now: the function-scoped `ratifyTarget` variable widens scope from a block-scoped `const` (mitigated by inline comments); the regex is constructed per (field × term) inside the inner loop (not currently a hot path); the D11 test contract spans two files (cross-file reading dependency is named in the new file's header comment).

## Files Changed

### `skills/design-proof-system/references/domain/`

- Modify: `mutations.js` — added `VOCAB_LINT_EXEMPT_CATEGORIES` frozen Set, changed `_vocabularyLintCheck` signature, added exempt-category early-exit branch, replaced substring matcher with whole-word regex matcher, lifted single `ratifyTarget` declaration to function scope (resolved once at step 2, reused at step 5.5 and step 8b), updated function doc comment to reflect new matcher semantics.
- Modify: `VOCABULARY.md` — added mechanical-enforcement paragraph to Section 11; appended Change Log section at document end.
- Modify: `__tests__/sprint-02-bug-fix-07.test.js` — relocated AC-11.1, AC-11.2, AC-11.3 subjects from Concern to Rule with corresponding field rename `label` → `statement`; fixed one stale comment.
- Create: `__tests__/sprint-02-bug-fix-09.test.js` — four new acceptance assertions (AC-11.4 through AC-11.7) covering the new contract surface.

### Sprint artifacts (working/ — not yet archived)

- Create: `design/sprint-02-bug-fix-09-design-00.md` — six-section design brief
- Create: `spec/sprint-02-bug-fix-09-spec-00.md` — spec with 12 acceptance criteria
- Create: `spec/sprint-02-bug-fix-09-spec-ground-truth-report-00.md` — clean
- Create: `plan/sprint-02-bug-fix-09-plan-00.md` — four-task TDD plan
- Create: `plan/sprint-02-bug-fix-09-plan-threat-report-00.md` — combined risk Low
- Create: `summary/sprint-02-bug-fix-09-summary-00.md` — this file

## Commits

- `55046b7` test(design-proof-system): relocate D11 tests from Concern to Rule subject
- `f4933eb` feat(design-proof-system): exempt descriptive categories from vocab lint
- `fda1331` feat(design-proof-system): whole-word matcher for vocab lint
- `68a4b0a` docs(design-proof-system): document vocab-lint enforcement scope
- `def1f03` refactor(design-proof-system): single _resolveElementCategory call per RATIFY
- `46ed14d` checkpoint: execution complete

## Handoff Notes

- The sprint traces back to a field observation, not to the architectural cascade-spec probe that drove sprint-02-bug-fix-01 and sprint-02-bug-fix-02. This provenance distinction is worth recording in the master plan's follow-up-bundle section if a future pass surveys lineage of the bug-fix sub-sprints.
- The standalone-documentation discipline established mid-design (each artifact describes current state declaratively; lineage lives in an end-of-document change log) was applied uniformly across the brief, spec, plan, threat report, and the VOCABULARY.md update. A new feedback memory entry was saved: `feedback_standalone_documentation.md`.
- The exempt-set encoding uses `ELEMENT_CATEGORIES.*` enum references, not raw wire strings. If a future sprint renames any `ELEMENT_CATEGORIES` value, the exempt set propagates automatically. This was the load-bearing fix from plan-smell finding #1.
- A future sprint that wants to add per-field granularity (e.g., exempt rationale fields on Rule and Permission elements while keeping their statement fields strict) can do so without revisiting this sub-sprint's choices — the current contract is by-category, intentionally.
- The downstream StoryDesigner proof's wrapper-script bypass becomes unnecessary once this engine refinement is merged. Coordination is downstream's responsibility per the brief's out-of-scope note.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-small-task@v0003 -->
<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by finish-write-records@v0003 -->
