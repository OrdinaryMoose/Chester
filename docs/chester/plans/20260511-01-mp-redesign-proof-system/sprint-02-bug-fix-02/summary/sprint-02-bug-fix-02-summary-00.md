# Session Summary: Close PERMISSION.relieves and RISK.basis silent-drop gaps; introduce INVALID_REFERENCE existence validation

**Date:** 2026-05-17
**Session type:** Full sprint pipeline — design (option-b lightweight) → spec → plan → execute (subagent mode) → verify
**Plan:** `sprint-02-bug-fix-02-plan-00.md`

## Goal

Close two cascade-vs-implementation silent-drop bugs surfaced by the 2026-05-17 cascade-spec probe (`docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-findings.md`):

- **H-2 PERMISSION.relieves** — cascade `05-domain-spec.md §3.3` marks `relieves` as required (links a permission to the rule it relieves). The schema accepted permissions without it; the translator dropped it silently. No `permission(PermId, Statement, RuleId)` fact reached the EDB.
- **H-3 RISK.basis** — cascade `§3.5` marks `basis` (non-empty array of element IDs) as required. The translator emitted only `risk(RiskId, Statement, Severity)` and discarded `basis`. No `risk_basis(RiskId, ElementId)` facts reached the EDB.

Establish `INVALID_REFERENCE` as a new domain-layer error code for existence-check failures. Introduce two declarative directives — `nonEmptyArrayFields` and `referenceFields` — extending the `verifyArgsShape` framework established by sprint-02-bug-fix-01. Correct two pre-existing `risk: 2 → 3` arity-table mismatches surfaced by adversarial spec review (`_ARITIES` and `PROJECTION_ARITIES` both wrong at sprint start; translator has always emitted at arity 3).

## What Was Completed

### Pipeline phases executed

- **Brief (option-b lightweight)** — human-written six-section brief at `design/sprint-02-bug-fix-02-design-00.md`. Designer skipped design-small-task because cascade §3.3 / §3.5 fully determined the design space; the brief consolidated the four open micro-decisions (RISK.severity retention, error-code naming, render layout, deferring unknownFieldPolicy). User ratified the open question (`nonEmptyArrayFields` directive scope) as option (a) — take it now.
- **design-specify** — competing-architecture review on the single open architectural axis: existence-check mechanism (declarative schema directive vs imperative orchestration). Two architects + prior-art Explorer. Explorer surfaced load-bearing precedent: sprint-02-proof-layer Key Decision 1 ("no imperative orchestration checks in mutations.js — validators are data-driven"). Hybrid Recommendation chosen: declarative directive (Architect A's spine) with Architect B's risk-discovery items folded in (pre-existing `PROJECTION_ARITIES.risk: 2` arity mismatch + boot-validators allow-list assumption). Three reviews chained: fidelity (approved with three advisory recommendations folded in), adversarial (1 HIGH `_ARITIES.risk` finding + 1 MEDIUM `boot-validators` non-existent mechanism — both fixed; spec advanced spec-00 → spec-01), ground-truth (clean; all 13 spec claims confirmed at file:line).
- **plan-build** — 6-task plan written. plan-reviewer fidelity check caught one buildability issue (Task 4 references nonexistent bridge helper in `render.test.js`) — fixed plus three advisory recommendations folded in. plan-attack + plan-smell hardening gate triggered (smell fired on 2 of 5 trigger categories: new abstractions + new contract surfaces). Combined threat report: SIGNIFICANT (1 CRITICAL plan-text bug + 3 SIGNIFICANT bugs + 1 convergent finding from both reviewers on error-throw shape). User chose Option (a) — proceed with directed mitigations. All 8 mitigations applied inline; no re-dispatch needed (architecture unchanged). Execution mode heuristic 0/4 → subagent mode confirmed.
- **execute-write subagent mode** — 6 implementer dispatches (T1-T6), 12 review dispatches (spec + quality per task plus full-sprint code review). Two deferred-reviewer gaps from per-task quality reviews explicitly closed in T5 (T3 Important-84 bridge round-trip `risk_basis/2` queryProof; T4 Minor-80 AC-7.2 negative-side render assertion). T1 quality reviewer's `nonEmptyArrayFields: []` backfill recommendation folded into T3.
- **Full sprint code review** — verdict **Yes — production-ready**. 2 Important findings (probe-table sync structural test; cascade `risk/3` divergence) + 2 Minor findings (`permission_decl → permission` migration; `_CATEGORY_PROBES_SCHEMA` id-allocator contract documentation). All four recorded as deferred items DEF-7 through DEF-10.
- **execute-verify-complete** — 305 tests passing (167 domain + 138 engine), clean tree, checkpoint commit.

### Substantive changes by file

| File | Change |
|------|--------|
| `schema.js` | New `nonEmptyArrayFields` and `referenceFields` declarative directives in `verifyArgsShape` (optional third `readPort` parameter, backward compatible). New private `_CATEGORY_PROBES_SCHEMA` constant + `_existsCategory` / `_existsAnyCategory` helpers (circular-import-safe substrate probe). All 9 descriptors gain `referenceFields: {}` and `nonEmptyArrayFields: []` empty defaults for shape uniformity. PERMISSION descriptor: `requiredFields` extended with `relieves`; `optionalFields` with `scope_constraint`; `referenceFields: { relieves: 'rule' }`. RISK descriptor: `requiredFields` extended with `basis`; `nonEmptyArrayFields: ['basis']`; `referenceFields: { basis: '*' }` (wildcard — basis references heterogeneous element categories). |
| `translation.js` | PERMISSION translator emits `permission(id, statement, relieves)` (new linkage fact) AND `permission_decl(id, statement)` (preserved for `_CATEGORY_PROBES` RATIFY compat) AND conditional `permission_scope(id, scope_constraint)`. RISK translator spreads `args.basis` into per-element `risk_basis(id, eid)` facts using RESOLUTION.addresses precedent. `EDB_PREDICATES` extended incrementally with `'permission'`, `'permission_scope'`, `'risk_basis'` (all pre-existing entries including `'phase'` preserved per threat-report F3 mitigation). |
| `mutations.js` | Single call-site change at line 231: `verifyArgsShape(args, argShapeTarget, (verbName === ADD \|\| verbName === REVISE) ? ports.query : null)`. No other changes — `_CATEGORY_PROBES` table preserved unchanged because translator keeps emitting `permission_decl/2`. |
| `render.js` | `_ARITIES.risk` corrected from 2 to 3 (pre-existing bug — `renderElementDeep` returned null for any RISK). `PROJECTION_ARITIES.risk` corrected from 2 to 3 (pre-existing bug — Datalog projection silently dropped severity). Three new `PROJECTION_ARITIES` entries: `permission: 3`, `permission_scope: 2`, `risk_basis: 2`. New PERMISSION render block in `renderStructuredProof`: per permission, emits `Relieves: <rule-id>` sub-line + conditional `Scope: <text>` sub-line. New RISK render block: per risk, emits `Basis: <e1>, <e2>` sub-line. Both blocks use existing `live()` filter (withdrawal-aware), follow ADR-0006 sub-line indentation. |
| `boot-validators.js` | **No changes.** Adversarial spec review confirmed `validateCategoryRegistry` only positively asserts four specific fields (`requiredFields`, `sourceConstraint`, `idShape`, `renderSection`) and has no known-properties allow-list. The new directives `referenceFields` and `nonEmptyArrayFields` pass through silently, matching existing `closedEnumFields` / `nonEmptyStringFields` precedent. AC-9.2 verifies the no-edit assumption holds. |
| `domain-bridge.js` | **No changes.** The two `validPredicates` sets pick up new EDB predicates automatically via `getDeclaredEDBPredicates()` — verified by AC-5.4 queryProof auto-flow test. |
| `__tests__/translation.test.js` | 4 new translator tests: PERMISSION (positive + conditional `permission_scope` absent); RISK (multi-element basis spread + severity preserved). All use exported `translate()` not module-private `TRANSLATORS` (threat-report F1 mitigation). |
| `__tests__/schema.test.js` | 2 new mechanism tests using stub descriptors: `nonEmptyArrayFields` (empty / non-array / valid), `referenceFields` (no-port short-circuit, port-with-miss throws, port-with-hit passes). |
| `__tests__/render.test.js` | 5 new tests: AC-5.3 (PROJECTION risk arity 3), AC-5.2 (new predicates in projection), AC-5.5 (renderElementDeep on RISK returns non-null), AC-7.1/7.2 positive (Relieves + Scope sub-lines), AC-7.3 (Basis sub-line with set-equality on comma-split ids per Watch-Item 9). |
| `__tests__/permission-schema.test.js` | NEW file. 13 tests mirroring `proposition-schema.test.js` precedent: descriptor shape (AC-1.x), translator emission (AC-2.x including AC-2.2 negative case), bridge round-trip INVALID_REFERENCE (AC-6.1), error-shape property-presence (AC-6.4), render Relieves + Scope sub-lines through bridge (AC-7.1, AC-7.2 positive and negative), AC-9.2 boot-validator no-op, happy-path `permission/3` EDB landing assertion. Real-import discipline per dr-20260514-06 (`new Engine()` + `createDomainBridge`, no mocks). |
| `__tests__/risk-schema.test.js` | NEW file. 12 tests: descriptor (AC-3.x), translator spread (AC-4.1), INVALID_REFERENCE on bad basis id (AC-6.2), SHAPE_INVALID on empty basis (AC-6.3), AC-7.3 render Basis with set-equality on comma-split ids, AC-5.4 validPredicates auto-flow, AC-9.2 boot-validator no-op, happy-path bridge round-trip with N `risk_basis/2` EDB landings (closes T3 quality-reviewer Important-84 gap). |
| `__tests__/bridge-integration.test.js` | One existing RISK fixture repaired (added `basis: [evid.id]` to the addElement call). PERMISSION fixtures required no repair — no existing test constructed a PERMISSION. |
| `cascade-spec-probe-simulation.mjs` (gitignored — `working/stress-tests/20260517-01/`) | Header comment updated to describe H-2 and H-3 as closure-regression assertions. Imports converted to dynamic with `CHESTER_SKILLS_ROOT` env var (defaults to main repo skills/; overrides to worktree skills/). H-2 assertion queries `permission/3` post-submit and verifies one row with expected relieves id. H-3 assertion queries `risk_basis/2` and verifies expected row count. Two impl-shape EVIDENCE seeds (`evForRiskBasisA`, `evForRiskBasisB`) added because Phase 3 spec-shape EVIDENCE fails by design. Probe runs with zero new failures (16 pre-existing drift-catalog failures unchanged). |

## Verification Results

| Check | Result |
|-------|--------|
| Final domain `vitest run` | 167 passing / 0 failing across 26 test files |
| Final engine `vitest run` | 138 passing / 0 failing across 17 test files |
| Total verified test surface | 305 passing |
| Working tree | Clean |
| Sprint commits | 5 substantive + 1 checkpoint (6 total on `sprint-02-bug-fix-02` branch) |
| Scope discipline (AC-9.1) | `git diff --name-only main...HEAD` confined to `skills/design-proof-system/references/domain/` |
| Spec ACs covered | All 20 ACs implemented and tested (AC-1.1 through AC-9.2) |
| Cascade-spec probe regression | H-2 and H-3 silent-drop assertions pass; zero new failures vs baseline |

## Known Remaining Items

Six follow-up items recorded in `plan/sprint-02-bug-fix-02-deferred-00.md`:

- **DEF-1: RESOLUTION descriptor should declare `referenceFields: { addresses: 'risk' }`** — same silent-drop class for RESOLUTION as this sprint closed for PERMISSION/RISK. Naturally lands in sprint-02-bug-fix-05 (RESOLUTION structural split).
- **DEF-2: Cross-reference comment in render.js pointing to schema.js arity note** — superseded by T4 landing both arity corrections.
- **DEF-3: Tighten `permission/3` sub-line query in renderStructuredProof** — Minor 82 precision opportunity; pure polish.
- **DEF-4: Fold AC-6.4 into AC-6.1 in permission-schema.test.js** — Minor 82 test-redundancy cleanup.
- **DEF-5: Extract `makeRealBridge` helper to shared `_fixtures/` module** — Minor 80, pre-existing duplication pattern from bug-fix-01.
- **DEF-6: Tighten H-3 probe assertion with set-equality on element IDs** — Minor 85, catches swap-mutation regression.
- **DEF-7: Structural test for probe-table sync (`_CATEGORY_PROBES` ↔ `_CATEGORY_PROBES_SCHEMA`)** — Important 90, maintenance hazard from intentional duplication.
- **DEF-8: Update cascade `05-domain-spec.md §3.5` for `risk/3 + severity`** — Important 85, requires cascade-document edit out of AC-9.1 scope.
- **DEF-9: `permission_decl/2` → `permission/3` migration** — Minor 80, retires dual emission (hygiene tax).
- **DEF-10: Document `_CATEGORY_PROBES_SCHEMA` id-allocator assumption** — Minor 80, comment-only.

## Files Changed

Source files (`skills/design-proof-system/references/domain/`):
- `schema.js` — modified
- `translation.js` — modified
- `mutations.js` — modified
- `render.js` — modified
- `__tests__/schema.test.js` — modified
- `__tests__/translation.test.js` — modified
- `__tests__/render.test.js` — modified
- `__tests__/bridge-integration.test.js` — modified
- `__tests__/permission-schema.test.js` — created
- `__tests__/risk-schema.test.js` — created

Stress-tests (gitignored — `docs/chester/working/stress-tests/20260517-01/`):
- `cascade-spec-probe-simulation.mjs` — modified (probe regression assertions; not committed by design — `working/` is gitignored)

Artifacts (`docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-02/`):
- `design/sprint-02-bug-fix-02-design-00.md` — created
- `spec/sprint-02-bug-fix-02-spec-00.md` — created (initial draft)
- `spec/sprint-02-bug-fix-02-spec-01.md` — created (post-adversarial fixes)
- `spec/sprint-02-bug-fix-02-spec-ground-truth-report-00.md` — created
- `plan/sprint-02-bug-fix-02-plan-00.md` — created
- `plan/sprint-02-bug-fix-02-plan-threat-report-00.md` — created
- `plan/sprint-02-bug-fix-02-deferred-00.md` — created (10 deferred items)
- `summary/sprint-02-bug-fix-02-summary-00.md` — this file
- `summary/sprint-02-bug-fix-02-audit-00.md` — companion reasoning audit

## Commits

| Hash | Message |
|------|---------|
| `733b762` | feat(schema): add nonEmptyArrayFields and referenceFields directives to verifyArgsShape; thread read port through ADD/REVISE call site |
| `41edf9b` | feat(permission): require relieves; emit permission/3 + conditional permission_scope/2; preserve permission_decl/2; extend EDB whitelist |
| `c5aade2` | feat(risk): require basis (non-empty array, referenceFields wildcard); spread risk_basis/2 per element; extend EDB whitelist; backfill nonEmptyArrayFields default on other descriptors |
| `0e2d22f` | feat(render): correct _ARITIES.risk and PROJECTION_ARITIES.risk to arity 3; add permission and risk sub-line render blocks per ADR-0006 |
| `6b707aa` | test(permission,risk): per-category test files covering schema, translator, EDB round-trip, INVALID_REFERENCE existence checks, render blocks |
| `078e9f1` | checkpoint: execution complete |

## Handoff Notes

- **Branch state:** `sprint-02-bug-fix-02` worktree at `.worktrees/sprint-02-bug-fix-02/` with 6 commits ahead of `main`. Clean working tree post-checkpoint.
- **Archive sequence:** `finish-archive-artifacts` is next. Under Master Plan Mode (active master: `20260511-01-mp-redesign-proof-system`), the entire master working tree gets copied to `docs/chester/plans/<master>/` at this sub-sprint's merge — that includes prior sub-sprint artifacts plus this one.
- **Cascade Divergence Gate:** This sub-sprint did not modify `design-documents/` cascade files. The gate should report MATCH (silent fast-path) since no `design-documents/` edits exist in working/ vs. prior plans/<master>/design-documents/ snapshot. **DEF-8 notes a cascade divergence at `05-domain-spec.md §3.5` (`risk/2 → risk/3`) that this sprint chose not to fix in cascade.** The gate compares hashes only; it does not detect spec-vs-impl drift like DEF-8. If the gate surfaces unexpected divergence, investigate before accepting.
- **Branch integration menu:** `finish-close-worktree` will present 4 options (merge locally / create PR / keep worktree / discard). Recommended: merge locally — this is a master-plan sub-sprint commit, not an external PR.
- **Decision Records corpus:** the parallel Fork B during this session will append cross-sprint decision records to `docs/chester/decision-record/decision-record.md`. Likely candidates: the `referenceFields` declarative directive as schema convention; the `INVALID_REFERENCE` domain-layer error-code precedent with `{code, field, referencedId}` shape; the "translator emits both predicates" pattern (permission_decl preserved alongside permission/3) as a probe-table compatibility tactic; the working norm of using `Object.assign(new Error(msg), { code, field })` not plain-object literals; the `CHESTER_SKILLS_ROOT` env-var pattern for probe worktree-targeting.
- **Continuity for next sub-sprint:** the master plan's next pending work is sprint-02-bug-fix-03 (H-1 grounding-array engine spread per cascade-spec-probe-findings). The directive infrastructure landed here (`nonEmptyArrayFields`, `referenceFields`, `readPort` threading) is reusable for any future descriptor that needs reference validation. The `INVALID_REFERENCE` error code becomes the standard for cross-element-reference failures in subsequent bundles.

## Session Skill Versions

<!-- produced-by execute-write@v0001 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by design-specify@v0003 -->
<!-- produced-by finish-write-records@v0003 -->
