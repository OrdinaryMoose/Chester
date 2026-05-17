# Session Summary: Restore reasoning_chain, rejected_alternatives, and ADR-0006 render lines to PROPOSITION pipeline

**Date:** 2026-05-17
**Session type:** Full sprint pipeline — design → spec → plan → execute (subagent mode) → verify → finish
**Plan:** `sprint-02-bug-fix-01-plan-00.md`

## Goal

Close a cascade-vs-implementation gap in `skills/design-proof-system/` discovered during a casual user question ("why did we drop the reasoning_chain and rejected_alternatives fields from the entities?"). Investigation revealed the fields were never dropped by any deliberate decision — they were silently omitted when sprint-02-proof-layer transcribed `05-domain-spec.md` §3.4 into a CategoryDescriptor. End the gap by restoring both fields (schema, translator, EDB whitelist, render layer) plus the three ADR-0006 render lines per Proposition (Collapse test, Reasoning, Rejected alternatives) and fix the cross-cutting RATIFY argShape latent bug the new required-field count surfaced.

## What Was Completed

### Pipeline phases executed

- **Investigation** — identified the gap as cascade-vs-implementation drift, not a deliberate decision. No ADR or sprint summary documented dropping the fields.
- **Design brief** — six-section brief written to `sprint-02-bug-fix-01/design/sprint-02-bug-fix-01-design-00.md`. Scoped as PROPOSITION-only repair with three Open Questions (revise semantics, empty-string handling, render thinness).
- **design-specify** — competing-architecture review (two architects + prior-art Explorer) converged on the same code paths via different reasoning; user picked the Hybrid Recommendation. Three reviews chained: fidelity (approved), adversarial (HIGH finding on `validPredicates` location corrected inline; spec advanced to spec-01), ground-truth (2 MEDIUM findings fixed inline, 1 LOW upgraded for AC observable-mechanism correctness).
- **plan-build** — 7-task plan written, plan-reviewer approved, plan-attack + plan-smell both ran (smell triggered on async/persistence keywords from test boilerplate). Combined risk: Low. User chose Option 2 — proceed with directed mitigations (added `nonEmptyStringFields: []` to other eight descriptors in Task 1; flagged inference_pattern hyphen/underscore in implementer watch-items).
- **execute-write** in subagent mode — 7 implementer dispatches, 14 review dispatches (spec + quality per task), 1 deviation surfaced and accepted (`grounding` array→string in tests that route through engine assertFact).
- **Full sprint code review** — 0 Critical, 2 Important, 3 Minor. One Important fix applied inline (comment on `validProposition` constant explaining the array/string-grounding divergence).
- **execute-verify-complete** — strict discipline applied; 4 pre-existing baseline failures surfaced; user chose Option 2 (fix them) instead of accepting baseline. 4 failures closed in one follow-up commit; suite reached 131/131 passing.
- **Checkpoint** committed.

### Substantive changes by file

| File | Change |
|------|--------|
| `schema.js` | New `nonEmptyStringFields` declarative directive in `verifyArgsShape`; `nonEmptyStringFields: []` added to eight non-PROPOSITION descriptors for self-documentation; PROPOSITION descriptor extended with `reasoning_chain` (required, last position) + `rejected_alternatives` (optional) + `nonEmptyStringFields: ['reasoning_chain']` |
| `translation.js` | PROPOSITION translator emits `reasoning_chain/2` unconditionally + per-alternative `rejected_alternative/3` spread; `EDB_PREDICATES` Set extended with both predicate names |
| `render.js` | `renderStructuredProof` emits a per-proposition block with three ADR-0006 lines (Collapse test / Reasoning / Rejected alternatives), each conditional on EDB fact presence; `PROJECTION_ARITIES` extended with both new predicates |
| `mutations.js` | RATIFY OPERATION_SPECS gains `argShape: { label: 'ratify', requiredFields: ['elementId'], closedEnumFields: {} }`, mirroring WITHDRAW/MANAGE_FRICTION precedent. Closes cross-category latent SHAPE_INVALID bug on CONCERN/DEFINITION/RESOLUTION/PROPOSITION ratify paths |
| `domain-bridge.js` | Added `@throws {DomainError}` JSDoc to `renderClosingArgument` facade method to satisfy structural facade-jsdoc test |
| `__tests__/_fixtures/inMemorySubstrate.js` | Added `allRules()` to `rulesPort`; the bridge's `getAllRules` helper expected it per the engine-port-adapter contract but the substrate fake never implemented it |
| `__tests__/proposition-schema.test.js` | NEW file. 18 tests: AC-1.x descriptor shape (3), AC-2.x verifyArgsShape behavior (6 including the nonEmptyStringFields mechanism test in schema.test.js), AC-3.x translator + EDB + boot validation (6), AC-4.1 validPredicates flow, AC-5.1 bridge round-trip, AC-5.2 revise lifecycle (new id, fact persistence, supersession), AC-6.1 ratify-path no-throw. Module-scope `validProposition` fixture and `makeRealBridge` async helper shared across describe blocks |
| `__tests__/schema.test.js` | Closed-enum test fixture repaired with `reasoning_chain`; new `nonEmptyStringFields` mechanism test using stub descriptor |
| `__tests__/translation.test.js` | PROPOSITION translator test fixture repaired with `reasoning_chain` |
| `__tests__/render.test.js` | Four new tests for the three-line render block (AC-7.1/7.2/7.3) and PROJECTION_ARITIES (AC-4.2) |
| `__tests__/concern-schema.test.js` | Known-issue test at lines 266-279 inverted — `ratifyConcern({elementId})` no longer throws SHAPE_INVALID after the cross-cutting RATIFY argShape fix; test now confirms the cross-impact |
| `__tests__/bridge-integration.test.js` | Comment update reflecting new five-field PROPOSITION requirement (line 103); REVISE verb-case fixture updated with `idShape` + `supersedes`; MANAGE_FRICTION verb-case fixture updated with `disposition` |

### Pre-existing failures closed (out-of-original-scope, user-requested)

The strict execute-verify-complete gate surfaced four baseline failures unrelated to the sub-sprint's stated work. User chose to close them rather than accept baseline:

- `bridge-integration AC-3.4` (REVISE missing `idShape`/`supersedes`; MANAGE_FRICTION missing `disposition`) — test-fixture updates only
- `bridge-integration AC-6.1` and `AC-11.1` (substrate fake's rulesPort lacked `allRules()`) — substrate completion
- `facade-jsdoc` (`renderClosingArgument` missing `@throws`) — JSDoc addition

All four closed in a single targeted commit; suite count went from 127 passing/4 failing to 131 passing/0 failing.

## Verification Results

| Check | Result |
|-------|--------|
| Final `npm test` (domain layer) | 131 passing / 0 failing across 24 test files |
| Working tree | Clean |
| Sprint commits | 9 substantive + 1 checkpoint (10 total on `sprint-02-bug-fix-01` branch) |
| Scope discipline (AC-9.1) | `git diff --name-only main...HEAD` confined to `skills/design-proof-system/references/domain/` |
| Spec ACs covered | All 19 ACs implemented and tested |
| Pre-existing baseline failures | 4 → 0 (user-requested at finish gate) |

## Known Remaining Items

- **`grounding/2` translator/engine mismatch.** Cascade `05-domain-spec.md` §3.4 specifies grounding as an array. Engine's `FactStore._validateArgs` rejects array-valued constants. `validProposition` test fixture documents this divergence inline. Tests that route through `assertFact` use string grounding; tests that only call `translate()` use array grounding. Spec'd out-of-scope (Non-Goals); deferred to a future sub-sprint that would either fix the translator to spread grounding (like RESOLUTION's `addresses`) or amend the cascade. The current PROPOSITION test fixture is documentation-marked.
- **Cascade-vs-implementation field audit across the other eight categories.** Brief Key Decision 3 scoped this sub-sprint PROPOSITION-only. A systematic audit may surface additional gaps in EVIDENCE / RULE / PERMISSION / RISK / RESOLUTION / FRICTION / CONCERN / DEFINITION descriptors.
- **Spec's "Unchanged surfaces" section mentions `mutations.js`.** plan-smell Finding 5 flagged this documentation drift — AC-6.1's resolution required modifying `mutations.js`. The plan correctly modified the file; the spec text predates the AC-6.1 decision and is mildly inconsistent. Optional cleanup.
- **`EDB_PREDICATES`/`PROJECTION_ARITIES`/`validPredicates` whitelist coupling.** Three parallel structures kept in sync by comment, not by code. plan-smell Finding 1 flagged as MEDIUM. Pre-existing; not worsened by this sprint. Future enforcement refactor candidate.
- **REJECTED_ALTERNATIVE as a typed element category.** Cascade glossary names this as a future direction (line 42). Out of scope here; would expand the sub-sprint into a category-introduction sprint requiring its own ADR.
- **Adversary-pass content quality gates.** ADR-0008 names a future Adversary process that audits whether `rejected_alternatives` are *genuine* and `reasoning_chain` is *substantive*. This sprint provides the data shape only.

## Files Changed

Source files (`skills/design-proof-system/references/domain/`):
- `schema.js` — modified
- `translation.js` — modified
- `render.js` — modified
- `mutations.js` — modified
- `domain-bridge.js` — modified
- `__tests__/_fixtures/inMemorySubstrate.js` — modified
- `__tests__/schema.test.js` — modified
- `__tests__/translation.test.js` — modified
- `__tests__/render.test.js` — modified
- `__tests__/concern-schema.test.js` — modified
- `__tests__/bridge-integration.test.js` — modified
- `__tests__/proposition-schema.test.js` — created

Artifacts (`docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-01/`):
- `design/sprint-02-bug-fix-01-design-00.md` — created
- `spec/sprint-02-bug-fix-01-spec-00.md` — created (initial draft)
- `spec/sprint-02-bug-fix-01-spec-01.md` — created (post-adversarial fixes)
- `spec/sprint-02-bug-fix-01-spec-ground-truth-report-00.md` — created
- `plan/sprint-02-bug-fix-01-plan-00.md` — created
- `plan/sprint-02-bug-fix-01-plan-threat-report-00.md` — created
- `summary/sprint-02-bug-fix-01-summary-00.md` — this file
- `summary/sprint-02-bug-fix-01-audit-00.md` — companion reasoning audit

## Commits

| Hash | Message |
|------|---------|
| `1e89692` | feat(schema): add nonEmptyStringFields directive to verifyArgsShape; explicit-empty on all descriptors |
| `2a555de` | feat(schema): extend PROPOSITION descriptor with reasoning_chain (required, non-empty) and rejected_alternatives (optional) |
| `ad67fbb` | feat(translation): emit reasoning_chain/2 and rejected_alternative/3 from PROPOSITION translator; extend EDB whitelist |
| `4830f76` | feat(render): surface collapse_test, reasoning_chain, rejected_alternatives per proposition; extend PROJECTION_ARITIES |
| `6158599` | fix(mutations): add argShape to RATIFY OPERATION_SPECS — closes cross-category SHAPE_INVALID on ratify-shape args |
| `1f00d4b` | test(proposition): bridge round-trip and revise lifecycle integration tests; hoist makeRealBridge helper |
| `4202b65` | docs(test): update bridge-integration PROPOSITION required-fields comment to reflect new five-field requirement |
| `ff8cc9f` | docs(test): document validProposition grounding-array vs engine-string divergence |
| `5af7ff2` | fix(test-infra): close 4 pre-existing test failures surfaced during execute-verify-complete |
| `5f98b72` | checkpoint: execution complete |

## Handoff Notes

- **Branch state:** `sprint-02-bug-fix-01` worktree at `.worktrees/sprint-02-bug-fix-01/` with 10 commits ahead of `main`. Clean working tree post-checkpoint.
- **Archive sequence:** `finish-archive-artifacts` is next. Under Master Plan Mode (active master: `20260511-01-mp-redesign-proof-system`), the entire master working tree gets copied to `docs/chester/plans/<master>/` at this sub-sprint's merge — that includes prior sub-sprint artifacts plus this one.
- **Cascade Divergence Gate:** This sub-sprint did not modify `design-documents/` cascade files. The gate should report MATCH (silent fast-path) since no `design-documents/` edits exist in working/ vs. the prior plans/<master>/design-documents/ snapshot. If the gate surfaces unexpected divergence, investigate before accepting.
- **Branch integration menu:** `finish-close-worktree` will present 4 options (merge locally / create PR / keep worktree / discard). Recommended: merge locally — this is a master-plan sub-sprint commit, not an external PR.
- **Decision Records corpus:** the parallel Fork B during this session will append cross-sprint decision records to `docs/chester/decision-record/decision-record.md`. Most likely candidates: the `nonEmptyStringFields` declarative directive as a schema convention; the RATIFY argShape precedent extending to all ratify paths; the working norm of fixing baseline failures at execute-verify-complete when the strict gate flags them.
- **Continuity for next sub-sprint:** the master plan's next pending work is its own concern. The `validPredicates`/`PROJECTION_ARITIES` whitelist coupling, the `grounding` translator/engine gap, and the broader category-by-category cascade audit are concrete follow-up candidates surfaced by this work but not committed to.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by finish-write-records@v0003 -->
