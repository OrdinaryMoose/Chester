# Master Plan — 20260511-01-mp-redesign-proof-system

Filesystem-level index of this master sprint. Design content lives in `design-documents/`. Implementation and per-sprint planning live in each sub-sprint folder.

## Layout

```
20260511-01-mp-redesign-proof-system/
├── master-plan.md                         (this file)
├── CLAUDE.md                              (master-level commitments)
├── design-documents/                      (cascade: vision, conops, architecture, specs, ADRs)
├── sprint-01-proof-backend/               (engine layer, original pass)
├── sprint-01-proof-backend-pass-2/        (engine layer, refinement)
├── sprint-01-proof-backend-pass-3/        (engine layer, refinement)
├── sprint-01-proof-backend-pass-4/        (engine layer, refinement)
├── sprint-01-bug-fix-01/                  (engine-layer follow-up)
├── sprint-02-proof-layer/                 (domain layer, original pass)
├── sprint-02-proof-layer-pass-2/          (domain layer, refinement)
├── sprint-02-bug-fix-01/                  (PROPOSITION reasoning_chain + rejected_alternatives + ADR-0006 render lines)
├── sprint-02-bug-fix-02/                  (PERMISSION.relieves + RISK.basis silent-drop closure) ← ACTIVE
└── sprint-03-presentation-layer/          (interface layer, not yet started)
```

## Sub-sprint status

- `sprint-01-proof-backend` series (original + 3 passes + bug-fix-01) — **closed**. Engine layer complete.
- `sprint-02-proof-layer` series (original + pass-2 + bug-fix-01) — **closed**. Domain layer complete with PROPOSITION reasoning_chain / rejected_alternatives / ADR-0006 render lines restored 2026-05-17.
- `sprint-02-bug-fix-02` — **active**. Cascade-vs-implementation drift closure for silent-drop fields (PERMISSION.relieves, RISK.basis).
- `sprint-03-presentation-layer` — **not started**. Interface layer.

## Branches and worktrees

- Closed sub-sprints have been merged to main; their worktrees and branches are deleted.
- `sprint-02-bug-fix-02` branch ↔ worktree at `.worktrees/sprint-02-bug-fix-02` (created 2026-05-17).
- `sprint-03-presentation-layer` — not yet branched.

## Active sub-sprint: sprint-02-bug-fix-02

### Scope

Close the two HIGH-severity silent-drop findings surfaced by the 2026-05-17 cascade-spec probe (see `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-findings.md`).

- **H-2: PERMISSION.relieves.** Cascade §3.3 marks `relieves` as a required field linking a permission to the rule it relieves. The schema does not list it; the translator does not emit it; the call returns success and the linkage is silently lost. Closure adds `relieves` to PERMISSION's requiredFields, emits `permission(PermId, Statement, RuleId)` per spec, surfaces it in render, and validates rule existence at addElement time.
- **H-3: RISK.basis.** Cascade §3.5 marks `basis` (a non-empty array of element IDs) as required. Currently absent from schema; impl emits only `risk(RiskId, Statement, Severity)`. Closure adds `basis` to RISK's requiredFields, spreads it into `risk_basis(RiskId, ElementId)` facts per element (RESOLUTION.addresses pattern at translation.js:49), surfaces it in render, validates element existence.

### Out of scope (for this sub-sprint)

- The H-1 PROPOSITION grounding/2 engine-level array crash (next sub-sprint).
- The H-4 EVIDENCE source-authority inversion (subsequent sub-sprint).
- All MEDIUM-severity structural changes (M-1 RESOLUTION fields, M-2 FRICTION anchors, M-3/M-4/M-5 enum vocabulary).
- All LOW-severity rename and requiredness drift (L-1 through L-5).
- The cross-cutting unknownFieldPolicy directive — defer to the Phase B ADR sprint (see "Planned bundles" below). Open question for this sub-sprint's design phase: whether to take it now or defer.

### Acceptance signal

The cascade-spec-probe-simulation.mjs failure count for H-2 / H-3 reaches zero. After PERMISSION.relieves and RISK.basis assertions, querying for `permission/3` and `risk_basis/2` predicates returns the expected linkage rows.

## Planned follow-up bundles (post sprint-02-bug-fix-02)

Surfaced by the 2026-05-17 cascade-spec probe. Sequencing follows the impact-by-correctness order recommended in `cascade-spec-probe-findings.md`. Each bundle becomes its own sub-sprint when picked up.

- **sprint-02-bug-fix-03 — Grounding-array engine spread.** H-1 closure. Translator spreads PROPOSITION.grounding into multiple `grounding/2` facts (RESOLUTION.addresses precedent). Also addresses L-5 (inference_pattern requiredness drift) since the descriptor is touched. plan-attack required (translator change, high blast radius). Probe is the regression backstop.
- **ADR sprint — Cross-cutting policy decisions.** Three decisions in one ADR: (a) does `verifyArgsShape` reject unknown fields by default? (b) hyphens or underscores for closed-enum values? (c) when cascade and impl have different enum vocabularies (M-3/M-4/M-5), which side is authoritative? No code changes; output is a ratified ADR appended to design-documents/. This sprint is sequenced before structural bundles because its decisions cascade into them.
- **sprint-02-bug-fix-04 — EVIDENCE source-authority correction.** H-4 closure. New EVIDENCE_SOURCES enum in tags.js per cascade §3.1; closed-enum field on EVIDENCE; remove or invert the designer-source constraint. Requires the ADR sprint's vocabulary decision to land first.
- **sprint-02-bug-fix-05 — Structural shape changes.** M-1 (RESOLUTION: split `addresses` into `problem_anchor` + `grounding[]`) and M-2 (FRICTION: add `friction_shape` + `anchor_a` + `anchor_b`). Each changes a category-arity at the EDB layer; ripples through render, fixtures, whitelists. plan-attack essential.
- **sprint-02-bug-fix-06 — Mechanical renames.** L-1 (EVIDENCE: claim→statement), L-2 (DEFINITION: term→canonical_name), L-3 (DEFINITION optional fields), L-4 (FRICTION statement requiredness). Pure mechanical pass once vocabulary is settled. Sequenced last so renames are not redone after earlier bundles land.

## Pointers

- Design cascade: `design-documents/` (entries `00-glossary.md` through `08-test-strategy.md`, plus `ADR/`).
- Latest design-tier state: ADR-0013 (relocates `IMaterializer` to Domain; specifies tx-visibility as read-own-writes; specifies stratification-check timing inside transactions).
- Cross-sprint decision records: `docs/chester/decision-record/decision-record.md` (5 records added 2026-05-17 from sprint-02-bug-fix-01).
- Probe and findings (informs all post-bug-fix-01 bundles): `docs/chester/working/stress-tests/20260517-01/`.
