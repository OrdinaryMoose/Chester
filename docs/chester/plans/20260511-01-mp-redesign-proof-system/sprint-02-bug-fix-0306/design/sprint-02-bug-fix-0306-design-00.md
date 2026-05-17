# Design Brief: Consolidated Cascade-Spec Drift Closure (Bundles 03-06)

**Status:** Draft (context brief — pre-design)
**Date:** 2026-05-17
**Sprint:** sprint-02-bug-fix-0306
**Parent:** master plan 20260511-01-mp-redesign-proof-system; continues from sprint-02-bug-fix-02

## Problem Statement

The cascade specification at `design-documents/cascade/05-domain-spec.md` defines the canonical shape of the nine proof-element categories, but the implementation at `skills/design-proof-system/references/domain/{schema,translation,render}.js` diverges from it in 16 places across 7 of those 9 categories. The cascade-spec probe at `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs` exercises every category in two shapes — the spec-canonical form and the impl-actual form — and currently reports 16 failures, all on the spec-canonical side. Each failure is a place where a user (or a downstream generator) following the cascade verbatim gets rejected at the schema gate or crashes the engine.

sprint-02-bug-fix-02 closed the PERMISSION and RISK divergences. Four planned bundles (originally sprints 03 through 06) close the remainder. This sprint consolidates those four bundles into a single execution because they share file surface, test infrastructure, and the declarative-directive machinery (`nonEmptyArrayFields`, `referenceFields`, `INVALID_REFERENCE`) that bug-fix-02 just landed.

The drift is not theoretical: 2 of the 16 failures (TYPE_ERROR on PROPOSITION grounding arrays) are engine-level crashes — the cascade's stated multi-evidence proposition shape cannot be expressed against the current implementation.

## Prior Art

### sprint-02-bug-fix-01 (merged)

- Introduced `closedEnumFields` and `nonEmptyStringFields` declarative directives in `schema.js:verifyArgsShape`
- Restored ADR-0006 render reasoning_chain pipeline
- Established the pattern of fixing silent-drop bug class via declarative directives rather than per-translator logic

### sprint-02-bug-fix-02 (merged — direct parent)

- Added `nonEmptyArrayFields` and `referenceFields` declarative directives to `verifyArgsShape`
- New `INVALID_REFERENCE` error code with `{code, field, referencedId, message}` shape
- New `_CATEGORY_PROBES_SCHEMA` table in `schema.js` for category-existence probes via `readPort`
- Closed PERMISSION.relieves and RISK.basis silent-drop gaps
- Corrected `_ARITIES.risk` and `PROJECTION_ARITIES.risk` from 2 to 3
- Probe extended with H-2 (`permission/3`) and H-3 (`risk_basis/2`) regression assertions
- Deferred 10 items (DEF-1 through DEF-10); several pull forward into this sprint's scope

### Cascade-Spec Probe Findings (working artifact)

`docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-findings.md` catalogs all 14 originally-identified findings, classified H/M/L. Findings H-2 and H-3 closed in bug-fix-02; the rest are this sprint's territory plus a few cross-cutting items (DEF-7, DEF-8, DEF-9, DEF-10) from bug-fix-02's deferred list.

### Master Plan Sub-Sprint Inventory

The four bundles were originally scoped as sprint-02-bug-fix-03 through sprint-02-bug-fix-06 in `docs/chester/working/20260511-01-mp-redesign-proof-system/master-plan.md`. This sprint replaces those four entries with one consolidated sprint.

## Design Decisions

### D1 — Bundle four planned sub-sprints into one execution (approved)

The four planned bundles (H-1 engine spread, EVIDENCE rename + H-4 inversion, RESOLUTION + FRICTION reshape, DEFINITION + PROPOSITION enum) share file surface (`schema.js` descriptors, `translation.js` translators, `render.js` arities, `__tests__/<category>-schema.test.js` files) and share the regression-backstop probe. Running them sequentially as four separate sprints would mean four design briefs, four threat reports, four execution loops, and four merges into main — with each merge re-disturbing the same files. Consolidation reduces ceremony cost and lets a single threat report cover the combined risk surface.

**Rejected alternatives:**
- Four separate sprints — overhead; identical adversarial-review territory traversed four times
- Bundle-only (no deferred-item pickup) — leaves easy wins on the table where the deferred fix would land naturally inside an already-touched file (e.g., DEF-1 RESOLUTION `referenceFields` would land in the same descriptor edit as the structural reshape)

### D2 — H-1 PROPOSITION grounding-array engine spread (approved as presented)

**What:** Translator currently passes `grounding[]` as a single positional arg to `assertFact`, causing the engine's `_validateArgs` to reject the array as a non-constant. Spec §3.4 specifies `grounding` as a non-empty array of evidence ids. Fix: spread `grounding[]` into per-element facts of the form `proposition_grounding(prop_id, evidence_id)`, exactly mirroring how bug-fix-02 spread `RISK.basis` into per-element `risk_basis(risk_id, evidence_id)` facts.

**Why:** Mirrors an established and ratified pattern. Engine arg-validation is correct as-is — the bug is on the translator side, which is the layer that owns multi-id-to-multi-fact spreading.

**Rejected alternatives:**
- Loosening engine `_validateArgs` to accept arrays — would let arrays leak into the Datalog substrate where they have no semantics
- Single-fact `proposition_grounding(prop_id, [evidence_ids...])` — same problem as above; Datalog values are atomic

### D3 — EVIDENCE field rename + H-4 source-authority inversion (approved)

**What — field rename:** Spec §3.1 calls the EVIDENCE statement field `statement`; impl calls it `claim`. Rename impl field `claim` → `statement` for EVIDENCE so the canonical spec form works. Five of the 16 probe failures collapse on this rename.

**What — authority inversion:** Spec §3.1 says EVIDENCE `source` MUST NOT be `designer` (evidence comes from outside the designer's session — industry, codebase, prior records, agent derivation). Impl's `sourceConstraint` is inverted: it currently *requires* `designer` and rejects everything else. This is H-4 in the findings catalog — a semantic inversion, not a rename. Fix: invert the constraint so `designer` is rejected and the four spec-allowed values (industry, codebase, prior-record, agent-derivation) are accepted.

**Why:** Spec is the authoritative source for naming and for authority semantics. Both fixes are mechanical once decided.

**Rejected alternatives:**
- Rename spec `statement` → `claim` instead — would propagate spec churn to consumers; the spec is the contract
- Leave authority inversion as documented divergence — spec §3.1 is unambiguous about what `designer` means, and the inversion lets designer-authored content masquerade as external evidence

### D4 — RESOLUTION + FRICTION structural reshape (both approved as presented)

**What — RESOLUTION:** Spec §3.6 specifies two separate required fields: `problem_anchor` (a concern id) and `grounding[]` (an array of proposition ids). Impl conflates these into a single `addresses` field. Reshape impl to match spec, with `referenceFields: { problem_anchor: 'concern', grounding: 'proposition' }` (closes DEF-1 from bug-fix-02 as a side effect).

**What — FRICTION:** Spec §3.7 renames `shape` → `friction_shape` AND adds `anchor_a` + `anchor_b` (element-id references for the two friction endpoints). Impl currently has `shape` and no anchors. Add the rename and the two reference fields with `referenceFields: { anchor_a: '*', anchor_b: '*' }` (FRICTION endpoints can be any element category).

**Why:** Both reshapes use the `referenceFields` machinery from bug-fix-02. RESOLUTION's reshape closes a deferred item naturally. FRICTION is a larger change (two new required fields) but the directive infrastructure is in place.

**Rejected alternatives:**
- RESOLUTION partial (rename only, no field split) — would not close the underlying drift; spec's two-field intent is structural, not nomenclature
- FRICTION: leave `anchor_a`/`anchor_b` for a later sprint — pulling forward avoids a future sprint that re-disturbs `friction.js` for just two fields

### D5 — DEFINITION + PROPOSITION inference_pattern enum normalization (use underscore)

**What — DEFINITION:** Rename impl field `term` → `canonical_name` per spec §3.9. Three probe failures collapse on this rename.

**What — PROPOSITION inference_pattern:** Spec uses hyphens (`grounds-imply-conclusion`, `proposition-composition`, etc., total of 5 values); impl uses underscores with 4 values (missing `proposition-composition`). Decision needed: align direction (hyphen → underscore, or underscore → hyphen) AND add the missing pattern. This is the only place in the sprint where the direction of alignment is not obvious.

**Why:** DEFINITION rename is mechanical. PROPOSITION enum has a real choice — hyphens read better in user-facing contexts (spec docs, render output) but underscores are conventional for JavaScript-side enum keys.

**Open question:** Hyphens or underscores for inference_pattern enum?

**Rejected alternatives:**
- Defer PROPOSITION enum entirely to a separate ADR sprint — workable; the direction decision is small enough not to justify its own sprint, but if `design-large-task` flags it as ADR-worthy during design-figure-out, scope-cut to DEFINITION rename only and leave inference_pattern for a follow-on

### D6 — Pull selected deferred items from bug-fix-02 forward (do this)

**Items being pulled in:**

- **DEF-1** (RESOLUTION `referenceFields`) — lands naturally with D4's RESOLUTION reshape; same file, same descriptor block
- **DEF-8** (cascade §3.5 risk arity doc update) — cross-document edit; bug-fix-02 confined to `skills/design-proof-system/references/domain/`; this sprint relaxes that boundary to touch `design-documents/cascade/05-domain-spec.md` §3.5 once, behind the Cascade Divergence Gate

**Items considered for pickup but deferred:**

- **DEF-7** (structural test for probe-table sync `_CATEGORY_PROBES` ↔ `_CATEGORY_PROBES_SCHEMA`) — requires exporting module-private symbols or factoring out a third module; warrants its own design pass per the deferred-items rationale. Out of scope unless `design-large-task` finds a low-impact path
- **DEF-9** (`permission_decl/2` → `permission/3` retirement) — requires touching `_CATEGORY_PROBES`, which was explicitly out-of-scope in bug-fix-02's spec preamble; would expand surface significantly. Out of scope unless designed in
- **DEF-10** (`_CATEGORY_PROBES_SCHEMA` id-allocator-assumption comment) — comment-only addition; trivial to land if the file is touched, but does not warrant its own task. Best-effort pickup at developer discretion

## Scope

### In scope

- D2: H-1 PROPOSITION grounding-array translator spread
- D3: EVIDENCE field rename (`claim` → `statement`) + H-4 source-authority inversion
- D4: RESOLUTION reshape (`addresses` → `problem_anchor` + `grounding[]`) + FRICTION reshape (`shape` → `friction_shape`, add `anchor_a` + `anchor_b`)
- D5: DEFINITION field rename (`term` → `canonical_name`) + PROPOSITION inference_pattern enum alignment + missing pattern addition
- D6 pickups: DEF-1 (folds into D4 RESOLUTION), DEF-8 (cascade §3.5 doc update)
- Probe regression assertions for each fixed category, mirroring bug-fix-02's H-2/H-3 assertion style
- Per-category `__tests__/<category>-schema.test.js` files for EVIDENCE, RESOLUTION, FRICTION, DEFINITION, PROPOSITION

### Out of scope

- **DEF-7 (probe-table sync structural test)** — _design pass needed_: requires module-boundary decisions that warrant their own design
- **DEF-9 (permission_decl/2 retirement)** — _explicitly deferred by bug-fix-02 spec_: surface expansion not justified by this sprint's scope
- **Cascade-document edits beyond DEF-8** — _scope discipline_: cascade-side text changes (other than §3.5 arity update) belong to a cascade-aligned sprint, not a bug-fix sprint
- **PROPOSITION inference_pattern as a full ADR** — _scope discipline if escalated_: if D5's enum direction decision turns out to need formal ADR, scope-cut to DEFINITION rename only and defer the enum work
- **Master deferments tracker work** — _master-level concern_: outside sub-sprint scope
- **General refactor of `_CATEGORY_PROBES` or `_CATEGORY_PROBES_SCHEMA`** — _out of scope per AC-9.1 discipline inherited from bug-fix-02_: targeted edits only

## Constraints

- **Scope discipline (structural — inherited from bug-fix-02 AC-9.1):** Changes confined to `skills/design-proof-system/references/domain/`, `__tests__/`, `docs/chester/working/stress-tests/20260517-01/`, plus the single cascade-document edit for DEF-8 at `design-documents/cascade/05-domain-spec.md` §3.5
- **Real-import test discipline (normative — source: dr-20260514-06):** No mocks of Engine, bridge, schema, translator, or substrate in any test added by this sprint; tests use `createDomainBridge` and real Engine instances
- **Cascade Divergence Gate (structural — source: `finish-archive-artifacts` Master Plan Mode):** The DEF-8 cascade edit will go through the Divergence Gate at sprint finish; expect MATCH after edit if executed cleanly
- **Probe must remain a passing baseline (normative — source: bug-fix-02 dr-20260517-12):** Every fix lands with a corresponding probe assertion so the next sprint inherits a clean regression backstop; total probe failure count should drop from 16 to 0 (or to a documented residual)
- **Decision-record continuity (normative — source: `finish-write-records` Fork B):** Cross-sprint records (e.g., authority-inversion decision in D3) append to `docs/chester/decision-record/decision-record.md`; no record file is modified after creation

## Assumptions

- **"The four-bundle scope fits one sprint without exceeding design/spec/plan budgets"** — UNTESTED. The bug-fix-02 sprint had 6 tasks; this sprint is plausibly 8-12. If `design-large-task` architects flag the size as risking architectural drift, scope-cut at the design stage rather than at execution. Bundles 1-2 (D2 + D3) are the highest-severity items and would be the natural cut-line.
- **"PROPOSITION inference_pattern enum direction can be decided without a formal ADR"** — UNTESTED. If the direction has cascading consequences (e.g., affects how renders use the value, or affects external code generation downstream), it may need a dedicated ADR sprint. The brief flags this as the most likely scope-escalation risk.
- **"DEF-8 cascade edit can be executed inside this sprint via the Cascade Divergence Gate"** — UNTESTED. The Gate's `accept-working` path is the intended mechanism; the gate has not yet been exercised for an intentional working-side cascade edit in a sub-sprint that also includes domain-implementation changes. Mechanics should work per the skill's documentation.
- **"All four bundles can share a single threat report"** — UNTESTED. If `plan-attack` finds bundle-specific risks that don't compose (e.g., FRICTION reshape has different risk shape than DEFINITION rename), the threat report will have to enumerate per-bundle. Acceptable; no architectural impact.

## Residual Risks

- **Merge-conflict surface within the sprint:** Four bundles touch overlapping files. Mitigation: task sequencing during plan-build must group edits by file rather than by bundle, or commit each bundle's edits independently against a clean tree. This is a sequencing concern, not a design concern, but flagging here because it influences plan structure.
- **PROPOSITION enum decision creep:** If D5's inference_pattern direction triggers an ADR escalation, sprint scope cuts mid-flight. Acceptable per the assumption above, but creates a partial-closure outcome where the probe still reports 3 PROPOSITION-enum failures after merge. Document the residual in the summary.
- **FRICTION endpoint validation cost:** `referenceFields: { anchor_a: '*', anchor_b: '*' }` requires the `'*'` wildcard mode in the existing `referenceFields` machinery. bug-fix-02 implemented `referenceFields: { basis: '*' }` for RISK, so the wildcard path exists, but FRICTION exercises it for two fields simultaneously. Low risk; flagged as a known machinery touch.
- **H-4 authority inversion has user-visible behavior change:** Any code path or test that has been quietly relying on the impl's inverted constraint (i.e., supplying `source: 'designer'`) will start failing. Search for such call-sites at design-figure-out time and surface in the spec as a migration note.

## Acceptance Criteria

Preliminary — to be refined by `design-large-task` and locked by `design-specify`:

- **AC-prelim-1:** Cascade-spec probe failure count drops from 16 to 0 across the targeted bundles, OR the residual count is explicitly documented in the sprint summary with rationale.
- **AC-prelim-2:** All 305 existing tests on main remain green after merge.
- **AC-prelim-3:** New per-category test files for EVIDENCE, RESOLUTION, FRICTION, DEFINITION, PROPOSITION follow the bug-fix-02 pattern (real-import, `createDomainBridge`, `INVALID_REFERENCE` shape assertions where applicable).
- **AC-prelim-4:** Probe regression assertions added for every closed-bundle category, mirroring bug-fix-02 H-2/H-3 style.
- **AC-prelim-5:** Cascade `05-domain-spec.md` §3.5 reflects `risk/3 + severity` (DEF-8 closure), and the Cascade Divergence Gate reports MATCH at sprint finish.
- **AC-prelim-6:** No regression in `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-findings.md` — items not in this sprint's scope retain their current "deferred" status with no degradation.

## Logic Trail

- 2026-05-17 — sprint-02-bug-fix-02 merged to main; cascade-spec probe re-run reports 16 failures (down from 18 pre-bug-fix-02)
- 2026-05-17 — User decision to consolidate four planned sub-sprints (03 through 06) into this single sprint
- 2026-05-17 — Context brief written; pending `design-large-task` or `design-small-task` ratification of D1-D6
