# Session Summary — sprint-02-bug-fix-07

**Sprint:** sprint-02-bug-fix-07
**Master plan:** 20260511-01-mp-redesign-proof-system
**Branch:** sprint-02-bug-fix-07
**Date:** 2026-05-18
**Target system:** `skills/design-proof-system/references/`

## Goal

Close twelve utilization gaps observed during a live run of design-proof-system. Concerns clustered on four axes: allocator / ID lifecycle (D1, D2, D5); per-verb caller contract shape (D3, D6, D10); schema affordances at element level (D4, D7); cleanup-cycle economics (D11, D12). Two adjacent observations covered doc/code drift (D8) and agent payload transport (D9).

## What was completed

All twelve design decisions implemented and tested. 382 tests passing across `domain/__tests__/`, `domain/structural-tests/`, `engine/__tests__/`.

### Per-decision implementation

- **D1 — RATIFY skips ID allocation.** `runOperation` gates `ports.ids.next` so RATIFY never advances the allocator. Counter-parity invariant: after N add+ratify cycles for a category, `idAllocator.highWater(category)` equals N (not 2N). Comment names the invariant at the gate.
- **D2 — Optional caller-supplied id on ADD.** `applyOperations` step 5 accepts `args.id`. Validated against `ID_PREFIXES[targetShape]` (via `tags.js`) and EDB uniqueness (via the exported `_existsAnyCategory` from `schema.js`). Throws `ID_PREFIX_MISMATCH` or `DUPLICATE_ID` before commit on failure.
- **D3 — Inline argShape on PRESENT_CLOSING_ARGUMENT.** The OperationSpec gains `argShape: { requiredFields: [], closedEnumFields: {}, label: 'present_closing_argument' }`. Evidence-shape requirements no longer leak into the closure-gate caller contract.
- **D4 — Resolution.problem_anchor accepts concern or risk.** Schema-only change. `referenceFields.problem_anchor` becomes the array `['concern', 'risk']`; new `_existsOneOf` helper in `schema.js`; `verifyArgsShape` extended to dispatch via `_existsOneOf` for array constraints. No closure-policy or friction-policy rule changes were needed — the existing generic `effective_addresses_rule` body fires on Risk anchors automatically once schema permits the EDB facts, and `coverage_gap_rule` self-corrects. The ground-truth report's M1 finding was empirically validated by AC-4.2 (closure blocks unaddressed Risks; unblocks after ratified Resolution).
- **D5 — Atomic serialize / restore with allocator state.** `serializeWithAllocatorState` and `loadFromWithAllocatorState` added to the bridge facade in `createDomainBridge`. `IIDAllocator` port contract gains required `seed(counters)` and `highWater(shape)` methods (the bridge throws `ALLOCATOR_MISSING_HIGHWATER` if either is absent). Engine state ferried via `engine.snapshot.snapshot()` / `engine.snapshot.restore()`. Legacy-snapshot recovery (AC-5.3) falls back to `extractAllocatorHighWaterMarks` (new export in `translation.js`) which scans the EDB by `ID_PREFIXES`. Restore wrapped in `try/catch` re-throwing `LOAD_FAILED_BRIDGE_INCONSISTENT` on engine failure.
- **D6 — Mutation result carries full element record.** ADD and REVISE OperationSpecs now declare `resultShape: { id: true, fullRecord: true }`. `runOperation` step 12 calls `render.renderElementDeep` and merges the element record into the returned object, stripping the render-side artifacts `predicate` and `withdrawn` before the merge (kept private to the read-side API).
- **D7 — Optional notes array on Concern.** CONCERN `optionalFields` gains `'notes'`. Translator emits `concern_note(id, note)` facts for each entry. `EDB_PREDICATES` and `PROJECTION_ARITIES` updated. `concern_note` added to `validPredicates` in `createDomainBridge` only.
- **D8 — VOCABULARY.md source enum.** Free-form examples replaced with the closed four-value `EVIDENCE_SOURCE_ENUM` from `tags.js`. Scope held narrow per spec — broader VOCABULARY.md drift (`claim` vs `statement`, `addresses` vs `problem_anchor`, INFERENCE_PATTERNS values) deferred.
- **D9 — Payload-channel utilities.** `createPayloadChannel` / `parsePayloadChannel` exported from `domain-bridge.js`. Sentinel constants `PAYLOAD_START` / `PAYLOAD_END` extracted from the helper bodies for single-source-of-truth. New "Structured payload channel" subsection added to `VOCABULARY.md`. Module-relocation flagged as deferred (Important quality finding; not blocking).
- **D10 — renderElementDeep returns full element record.** New `_SECONDARY_QUERIES` map in `render.js` keyed by primary declaration predicate. Each descriptor carries `pattern`, `extract`, `field`, `multi`. `renderElementDeep` runs secondary queries after the primary match and merges results. `concern: 3` added to `_ARITIES`. Critical bug surfaced during review and fixed: `permission` satellite's arity-3 pattern was misencoded as arity-2; refactored descriptor schema to use `pattern: ['_', { var: 'R' }]` with explicit wildcards, plus a regression test (AC-10.4) for the Permission deep-render path. Also added `_PRIMARY_FIELDS` map so primary-slot fields (statement, source, label, etc.) reach the returned record.
- **D11 — Pre-ratify vocabulary lint gate.** `_vocabularyLintCheck` helper in `mutations.js` invoked from `runOperation` for RATIFY between postcondition (step 8) and customPostCheck (step 9). Queries the derived `definition/3` predicate; short-circuits when no Definitions are ratified (AC-11.3); scans the target element's string fields via `renderElementDeep` for canonical-term mismatch (case variant). Blocking gate — throws `VOCABULARY_LINT_VIOLATION` and prevents commit on violation.
- **D12 — reviseProposition + reviseResolution.** Two new OperationSpec entries with dual-partner atomic approval (emits both `approved` rows + both `two_yes` rows so `two_yes_complete` derives in the same transaction). New `ACTION_LABELS.REVISE_PROPOSITION` / `REVISE_RESOLUTION`. `boot-validators.js` updated to accept array-valued `consentCategory`. `runOperation` consent dispatch extended to route the new verbs through per-category ratify authority. `instantiateTemplate` gate extended so the new element receives its rule template. Facade methods `bridge.reviseProposition` / `bridge.reviseResolution` added. AC-12.4 PROBE outcome documented: **rule cascade does NOT auto-retire the old element on revise** — the old `approved` / `two_yes` facts persist alongside the new ones, so `proposition(old_id, _)` continues to derive. If the designer wants the old element retired, an explicit `grounding_updates` / retract path is needed in a follow-up sprint. The `__retract__` sentinel was intentionally NOT shipped.
- **AC-13.1 regression sweep.** Full test suite (382 tests across three directories) passes. Grep for strict bare-id shape assertions (`toEqual({id:})`, `toStrictEqual({id:})`, `Object.keys(result).length`) returned zero matches — no migration needed.

### Cross-cutting decisions made during the sprint

- **Prefix convention.** Abbreviated prefixes (`evid_`, `rule_`, `perm_`, `prop_`, `risk_`, `res_`, `fric_`, `cern_`, `defn_`) pinned via a new `ID_PREFIXES` export in `tags.js`. Single source of truth — `mutations.js`, `translation.js`, fixture allocators all import from there.
- **`createDomainBridgeWith` out of scope.** All new methods land on `createDomainBridge` only. The existing unconditional throw at the `createDomainBridgeWith` stub is acknowledged but not addressed.
- **`__retract__` sentinel removed.** Original D12 plan draft carried a `'__retract__'`-prefixed metaFact convention to support `grounding_updates`. Per cross-cutting decision, the convention was dropped; AC-12.4 probe runs to decide whether `grounding_updates` is needed at all.
- **`IIDAllocator` contract widened.** `seed(counters)` and `highWater(shape)` are now required. Bridges constructed with a missing-method allocator throw `ALLOCATOR_MISSING_HIGHWATER` instead of silently mis-restoring.

### Hardening outcomes

Plan hardening produced a Significant-risk threat report (3 HIGH, 7 MEDIUM findings before mitigation). All HIGHs and 7 MEDIUMs were patched in the plan before execute-write started; the patched plan re-attacked clean except for two new MEDIUM findings (NF4: D12 dual-partner approval semantics; NF6: scope contradiction on `createDomainBridgeWith`), both fixed inline. The user chose option (b) — proceed with directed mitigations — at the hardening gate.

During execution, code-quality reviews caught additional findings the plan did not anticipate:

- **D10 Critical: `permission` satellite arity-3 → arity-2 mismatch.** Fixed by refactoring the `_SECONDARY_QUERIES` descriptor schema to use `pattern` + `extract` fields. Regression test AC-10.4 added.
- **D6 Important: render-side `predicate` and `withdrawn` leaked into mutation results.** Stripped before merge.
- **D5 Important: `engine.snapshot.restore` could leave the bridge inconsistent on failure.** Wrapped with try/catch re-throwing a named error.
- **D5 Important: `declPredsByCategory` is a third copy of the per-category probe table.** Sync warning in `schema.js` extended to mention `translation.js`.
- **Task 0 Important: `makeAdapters` `seed` semantics drifted (merge) vs substrate's (replace).** Aligned to replace semantics so D5's restore path behaves identically through either fixture allocator.

## What was produced

Artifacts under `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-07/`:
- `design/sprint-02-bug-fix-07-design-00.md` (Approved — 12 ratified decisions)
- `spec/sprint-02-bug-fix-07-spec-00.md` (Hybrid architecture + 13 AC sections)
- `spec/sprint-02-bug-fix-07-spec-ground-truth-report-00.md` (4 MEDIUM patched inline, 3 LOW preserved)
- `plan/sprint-02-bug-fix-07-plan-00.md` (14 tasks, execution mode = subagent, hardened)
- `plan/sprint-02-bug-fix-07-plan-threat-report-00.md` (Significant risk before mitigation; mitigated to Moderate)
- `plan/sprint-02-bug-fix-07-deferred-00.md` (3 deferred items — `makeAdapters` relocation, payload-channel module relocation, substrate `this`-binding cleanup)
- `summary/sprint-02-bug-fix-07-summary-00.md` (this file)

Code commits on branch `sprint-02-bug-fix-07` (from `2cff8dc` to `d755b6b`):
- Task 0 — fixture allocator + `ID_PREFIXES` + `makeAdapters` seed alignment
- Task 1 — D8 VOCABULARY source enum doc
- Task 2 — D9 payload-channel utilities + sentinel constants + VOCABULARY subsection
- Task 3 — D3 PRESENT_CLOSING_ARGUMENT argShape
- Task 4 — D4 schema-only problem_anchor extension + AC-4.2/4.3 test fidelity correction
- Task 5 — D7 Concern notes + concern_note EDB predicate
- Task 6 — D10 `_SECONDARY_QUERIES` + `_ARITIES.concern` + permission-arity Critical fix
- Task 7 — D1 RATIFY allocator skip
- Task 8 — D2 caller-supplied id + dead-code cleanup
- Task 9 — D6 mutation full record + `_PRIMARY_FIELDS` + render-artifact strip
- Task 10 — D11 pre-ratify vocabulary lint gate
- Task 11 — D5 atomic serialize/restore + sync-warning extension + restore-error bracket
- Task 12 — D12 reviseProposition + reviseResolution + boot-validator array support + AC-12.4 probe
- Checkpoint commit `d755b6b`: execution complete

## What is deferred or left open

Captured in `plan/sprint-02-bug-fix-07-deferred-00.md`:

- Relocate `makeAdapters` out of `bridge-integration.test.js` into a `_fixtures/adapters.js` module. Important / confidence 85 (quality review on Task 0). Test-topology smell.
- Relocate D9 payload-channel helpers out of `domain-bridge.js` into a peer `payload-channel.js`. Important / confidence 85 (quality review on Task 2). Domain-bridge.js scope concern.
- `this`-binding fragility in substrate `idAllocator`. Minor / confidence 80 (quality review on Task 0). Hypothetical hazard.

Additional follow-ups surfaced during sprint but not entered as deferred items:

- **D12 `grounding_updates` / retract path.** AC-12.4 PROBE confirmed rule cascade does NOT auto-retire old proposition/resolution elements on revise. If the designer wants old elements retired, a follow-up sprint needs explicit retract handling in `runOperation` step 5 plus a per-element rule undefine step.
- **Broader VOCABULARY.md drift.** D8 only fixed the `source` enum description. `claim` vs `statement` on Evidence, `addresses` vs `problem_anchor` on Resolution, and INFERENCE_PATTERNS values still drift. Documented as out of scope in the spec.
- **D12 translator duplication.** `REVISE_PROPOSITION` and `REVISE_RESOLUTION` translators are structurally identical except for the category constant. A shared helper `_makeReviseTranslate(category)` was suggested in quality review (Minor, confidence 82). Deferred to a future cleanup pass.
- **Stale comment in `mutations.js`** at the D2 optional-id check noting "Task 12 will extend the ADD-only check below" — the extension is now complete and the comment is stale. Minor / confidence 83. Quick cleanup for the next touch.
- **`createDomainBridgeWith` stub.** Unconditional throw at `domain-bridge.js:228` remains. Declared out of scope at the hardening gate per the Cross-Cutting Decisions.
- **JSDoc on D5 facade methods.** `facade-jsdoc.test.js` structural test currently passes because it skips block-arrow functions; `serializeWithAllocatorState` and `loadFromWithAllocatorState` lack JSDoc blocks. Minor / confidence 85. Quick add-and-extend pass would close the gap.

## What the next session needs to know

- All twelve D1–D12 decisions are landed and tested at HEAD `d755b6b`. The system is in a clean state for archive and merge.
- The most operationally important follow-up is the D12 `grounding_updates` / retract path, because the PROBE explicitly confirmed the old element persistence pattern. Anyone running a live proof will observe that `reviseProposition` leaves the old derived `proposition(old_id, _)` row alongside the new one. If that's surprising in operation, the follow-up sprint exists.
- The `createDomainBridgeWith` stub debt is now extended further (new methods were added to `createDomainBridge` only, so the success-path divergence between the two factories is widened). Any test that exercises the stub via `createDomainBridgeWith` will throw an obscure error.
- Three Cross-Cutting Decisions in the plan header (`Prefix convention`, `Prefix table location`, `IIDAllocator contract`) are binding for any future work touching the bridge or allocator surface.
- The plan, threat report, and ground-truth report together capture far more decision-record context than this summary; refer to them for the full rationale on any specific choice.

## Session Skill Versions

<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by execute-write@v0006 -->
<!-- produced-by finish-write-records@v0003 -->
