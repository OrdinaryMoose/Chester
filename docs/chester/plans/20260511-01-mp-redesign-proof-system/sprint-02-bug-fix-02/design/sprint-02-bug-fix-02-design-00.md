# Design Brief: Close PERMISSION.relieves and RISK.basis silent-drop gaps

**Status:** Draft — awaiting designer review
**Date:** 2026-05-17
**Sprint:** sprint-02-bug-fix-02 (Master Plan Mode: 20260511-01-mp-redesign-proof-system)
**Input artifacts:**
- `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-findings.md` — findings H-2 and H-3
- `design-documents/05-domain-spec.md` §3.3 (PERMISSION), §3.5 (RISK) — cascade source of truth
- Precedent: `sprint-02-bug-fix-01/spec/sprint-02-bug-fix-01-spec-01.md` — established the closure pattern

---

## Problem Statement

The design-proof-system's PERMISSION and RISK categories each have a spec-required field that the implementation does not enforce or record. The schema validator does not reject unknown fields, so callers can submit `relieves` or `basis` and receive an apparent success — but the translator never emits the corresponding fact and the linkage is silently lost.

- **PERMISSION.relieves** — cascade §3.3 marks this required. Today the schema accepts a permission with only `statement`; the translator emits `permission_decl(PermId, Statement)` and ignores any `relieves` argument. No `permission(PermId, Statement, RuleId)` fact ever enters the EDB. Closure conditions, friction-detection rules, and render output that depend on permission-to-rule linkage have no data to operate on.
- **RISK.basis** — cascade §3.5 marks this required (a non-empty array of element IDs the risk attaches to). Today the schema accepts a risk with only `statement` and optional `severity`. The translator emits `risk(RiskId, Statement, Severity)` and ignores any `basis` argument. No `risk_basis(RiskId, ElementId)` facts enter the EDB. The cascade's "rebuttal/reservation layer" semantic — a risk identifying *what it is a risk about* — is unrepresentable.

Both gaps are silent. The probe (`cascade-spec-probe-simulation.mjs` attempts 12-13 and 17-18) demonstrates this directly: spec-conformant submissions return `{id: permission_3}` and `{id: risk_5}` as if successful, while the underlying linkage data is dropped.

## Prior Art

`sprint-02-bug-fix-01` (merged 2026-05-17) closed an identical class of drift for PROPOSITION — the `reasoning_chain` and `rejected_alternatives` fields were silently omitted from the EDB despite being cascade-required. The mechanical closure pattern is:

- Add the field to `CATEGORY_REGISTRY.<CATEGORY>.requiredFields` in `schema.js`.
- Emit the corresponding facts in the category translator in `translation.js`.
- Extend `EDB_PREDICATES` (translation.js), `PROJECTION_ARITIES` (render.js), and `validPredicates` (domain-bridge.js — two locations at lines 50 and 198) with the new predicate names.
- Add a render block surfacing the new linkage.
- Add tests at descriptor, translator, EDB, render, and bridge round-trip layers.

This sub-sprint applies the same pattern twice — once per category. It also adds one element bug-fix-01 did not need: domain-side existence validation for the referenced IDs.

## Design Decisions

### D1 — Follow cascade verbatim for both categories

Both closures emit exactly the predicate signatures specified in the cascade.

- PERMISSION.relieves → `permission(PermId, Statement, RuleId)`. Optional `scope_constraint` → `permission_scope(PermId, ScopeConstraint)`.
- RISK.basis → `risk_basis(RiskId, ElementId)` spread one fact per element ID in the array.

No alternative was considered. The cascade is normative; this sprint exists to close the gap to it.

### D2 — RISK.severity remains optional, not removed

The implementation's `severity` field is not mentioned in cascade §3.5. The question is whether to drop it as part of this closure.

- **Decision:** keep it. Scope this sprint to additive closure only.
- **Rationale:** The cascade does not forbid optionals beyond what it lists. Dropping `severity` would require updating existing simulations and tests that use it (`calculator-fully-featured-simulation.mjs` attempts 258, 266, 274) and would expand sprint scope without closing the silent-drop class. If the team later wants to remove non-spec optional fields, that is a vocabulary-alignment sprint (currently planned as sprint-02-bug-fix-06).
- **Rejected alternative:** drop `severity` here. Rejected because it expands scope without serving the H-3 closure goal, and because severity-removal is part of the broader cascade-alignment bundle that should happen after the ADR sprint settles vocabulary authority.

### D3 — Domain-side existence validation for referenced IDs

Both fields reference other elements. The implementation must validate that the referenced IDs exist before assertion, per cascade §3.3 final paragraph ("The Domain validates this before assertion") and the structural analogue for RISK in §3.5.

- **Decision for PERMISSION.relieves:** validate at `addElement` time that the `relieves` value matches an existing RULE id. If not, throw `INVALID_REFERENCE` with `field: 'relieves'` and `referencedId: <value>`.
- **Decision for RISK.basis:** validate at `addElement` time that every id in the `basis` array matches an existing element. If any does not, throw `INVALID_REFERENCE` with `field: 'basis'` and `referencedId: <first failing id>`.
- **Error code:** `INVALID_REFERENCE` — new error code, consistent with the naming pattern of `SHAPE_INVALID`, `TYPE_ERROR`, `INVALID_SOURCE`. Include `field` and `referencedId` properties on the thrown object for caller diagnosis.
- **Rejected alternative:** defer existence validation, accept linkage-with-dangling-ids. Rejected because the cascade explicitly requires validation and because a dangling-id risk or permission would silently fail at downstream rule evaluation in a way that is harder to diagnose than a loud submission-time rejection.

### D4 — Render block layout follows ADR-0006 sub-line precedent

ADR-0006 established the per-element render pattern in sprint-02-bug-fix-01: a primary block per element with sub-lines for each derived linkage (e.g., PROPOSITION's three sub-lines for Collapse test / Reasoning / Rejected alternatives).

- **Decision for PERMISSION:** under each rendered permission, emit a single sub-line `Relieves: <rule-id>` when a `permission/3` fact exists. Emit a second sub-line `Scope: <text>` when a `permission_scope/2` fact exists.
- **Decision for RISK:** under each rendered risk, emit a sub-line `Basis: <id-1>, <id-2>, ...` when one or more `risk_basis/2` facts exist for the risk.
- **Rejected alternative:** inline the linkage in the primary line ("permission X relieves rule Y"). Rejected because the ADR-0006 sub-line pattern is now the established render convention and consistency reduces template surface area in `render.js`.

### D5 — Defer the cross-cutting `unknownFieldPolicy: 'reject'` directive

The findings doc's headline recommendation was to add a strict-mode policy to `verifyArgsShape` that rejects unknown fields, converting silent-drop into a loud `SHAPE_INVALID` for any future drift.

- **Decision:** defer to the planned ADR sprint (master-plan.md). Do not include this directive in sprint-02-bug-fix-02.
- **Rationale:** The strict policy is a cross-cutting framework rule that affects every category and every caller. It needs ADR-level ratification of its semantics (does it reject at addElement, at all mutations, or globally? does it warn or throw? does it have an opt-out per descriptor?) before code change. Including it here would either rush a framework-wide decision into a bug-fix sprint or produce a half-implementation that needs reworking after the ADR.
- **Rejected alternative:** include the directive defaulted to opt-in on these two descriptors. Rejected because partial enforcement creates inconsistent behavior between categories and makes the eventual ADR harder to ratify (the team would be choosing between three options instead of two).

## Scope

### In scope

- PERMISSION schema: add `relieves` to `requiredFields`, add `scope_constraint` to `optionalFields`.
- PERMISSION translator: emit `permission(PermId, Statement, RuleId)` and conditional `permission_scope(PermId, ScopeConstraint)`.
- RISK schema: add `basis` to `requiredFields` as a non-empty array.
- RISK translator: spread `basis` into per-element `risk_basis(RiskId, ElementId)` facts using the RESOLUTION.addresses precedent.
- Whitelist extensions: `permission/3`, `permission_scope/2`, `risk_basis/2` added to `EDB_PREDICATES`, `PROJECTION_ARITIES`, and both `validPredicates` locations.
- Render layer: sub-line per cascade linkage (D4).
- Domain-side existence validation with `INVALID_REFERENCE` error code (D3).
- Test additions at descriptor, translator, EDB, render, and bridge round-trip layers.
- Probe conversion: extend `cascade-spec-probe-simulation.mjs` to assert the linkage facts are present after submission, turning the probe into a regression backstop for these two findings.

### Out of scope

- **H-1 grounding-array engine spread** — _not yet_: planned for sprint-02-bug-fix-03. Engine-level fix, different blast radius, deserves its own plan-attack.
- **H-4 EVIDENCE source-authority inversion** — _not yet_: planned for sprint-02-bug-fix-04. Semantically distinct; needs ADR vocabulary decision first.
- **M-1 RESOLUTION structural split (`problem_anchor` + `grounding[]`)** — _not yet_: planned for sprint-02-bug-fix-05.
- **M-2 FRICTION anchor fields** — _not yet_: planned for sprint-02-bug-fix-05.
- **M-3 / M-4 / M-5 enum vocabulary alignment** — _not yet_: requires ADR sprint to settle which side is authoritative.
- **L-1 through L-5 mechanical renames** — _not yet_: planned for sprint-02-bug-fix-06 after vocabulary is settled.
- **`unknownFieldPolicy: 'reject'` cross-cutting directive** — _not yet_: planned for ADR sprint, see D5.
- **Removal of impl-only optional fields** (RISK.severity, PERMISSION rationale) — _not yet_: see D2; aligns to sprint-02-bug-fix-06.

## Constraints

- _(structural)_ Translator emissions must use predicate signatures specified verbatim in cascade §3.3 and §3.5. No variant signatures.
- _(structural)_ The three-place whitelist coupling (`EDB_PREDICATES`, `PROJECTION_ARITIES`, `validPredicates` × 2) must be kept in sync per the pre-existing convention noted in the sprint-02-bug-fix-01 summary.
- _(normative — source: cascade §3.3 final paragraph)_ Domain validates `relieves` references an existing Rule before assertion.
- _(normative — source: design-proof-system boundary in CLAUDE.md)_ This sprint touches only `skills/design-proof-system/`. The other proof system (`skills/design-large-task/proof-mcp/`) is outside scope and must not appear in any artifact.
- _(structural)_ Cascade-spec-probe-simulation.mjs is the regression backstop. Its failure count for H-2 and H-3 must reach zero by `execute-verify-complete`.

## Assumptions

- **"RESOLUTION.addresses spread pattern at `translation.js:49` is a stable precedent to mirror."** UNTESTED in this sprint. RISK.basis translator follows the same `Array.isArray(args.basis) ? args.basis.map(...) : [[...]]` pattern. If the precedent has hidden quirks (e.g., empty-array handling), the RISK translator inherits them.
- **"No existing tests rely on PERMISSION or RISK being silently incomplete."** UNTESTED. If any test fixture asserts the *absence* of `permission/3` or `risk_basis/2` facts (intentionally or not), it will break. Test-update step in execute-write must scan for this.
- **"`INVALID_REFERENCE` is a new error code, not reused elsewhere."** UNVERIFIED — execute-write should grep before declaring the code to avoid namespace collision.
- **"Render layer can resolve element IDs to display labels."** Likely true via existing render infrastructure used for PROPOSITION's rejected_alternatives, but unverified for RISK.basis which references heterogeneous element types.

## Residual Risks

- **Whitelist drift not enforced by code.** Adding three new predicate names across four locations (the bug-fix-01 summary flagged this as plan-smell Finding 1, MEDIUM). This sprint adds three more predicates compounding the same risk. Not closed here; remains a candidate for a future enforcement-refactor sprint.
- **Translator empty-array handling.** RISK.basis is spec-required non-empty, but the schema validator's `nonEmptyArrayFields` directive (analogous to `nonEmptyStringFields` introduced in bug-fix-01) does not yet exist. Without it, a caller submitting `basis: []` would pass schema validation, the translator would emit zero `risk_basis` facts, and the validation gap that this sprint is closing would partially re-emerge in array-shape form. Mitigation: add a `nonEmptyArrayFields` directive following the `nonEmptyStringFields` precedent, applied to RISK.basis. This adds one more dimension to D1 but keeps it scoped — the directive is mechanical, mirrors an existing precedent, and is necessary to genuinely close H-3.
- **Existence-validation perf at addElement time.** Validating that every element id in a RISK.basis array exists requires a lookup per id against the bridge's element registry. For typical proof sizes (tens to low hundreds of elements) this is negligible; flagged for awareness only.

## Acceptance Criteria

- AC-1 — PERMISSION descriptor: `requiredFields` contains `['statement', 'relieves']` and `optionalFields` contains `['scope_constraint']`.
- AC-2 — PERMISSION translator: emits `permission(PermId, Statement, RuleId)` for every submitted permission; emits `permission_scope(PermId, ScopeConstraint)` when `scope_constraint` is supplied.
- AC-3 — RISK descriptor: `requiredFields` contains `['statement', 'basis']`; `severity` remains in `optionalFields` (D2); `nonEmptyArrayFields` contains `['basis']`.
- AC-4 — RISK translator: spreads `basis` into one `risk_basis(RiskId, ElementId)` fact per element id.
- AC-5 — Whitelist coherence: `EDB_PREDICATES`, `PROJECTION_ARITIES`, and both `validPredicates` sets contain `permission`, `permission_scope`, and `risk_basis` with correct arities (3, 2, 2).
- AC-6 — Existence validation: `bridge.addElement` with a PERMISSION whose `relieves` value does not match any existing RULE throws an error with `code: 'INVALID_REFERENCE'`, `field: 'relieves'`, and `referencedId: <value>`. Same shape for RISK with any unmatched id in `basis`.
- AC-7 — Render: `renderStructuredProof` emits the `Relieves: <rule-id>` sub-line and optional `Scope: <text>` sub-line per permission; emits the `Basis: <id-1>, <id-2>, ...` sub-line per risk.
- AC-8 — Probe regression: re-running `cascade-spec-probe-simulation.mjs` shows the H-2 and H-3 silent-drop assertions pass (permission/3 facts exist after submission; risk_basis/2 facts exist after submission with the expected count).
- AC-9 — Scope discipline: `git diff --name-only main...HEAD` is confined to `skills/design-proof-system/references/domain/` and `docs/chester/working/stress-tests/20260517-01/` (probe extension only).

---

## Notes for design-specify

This brief is a human-written input following the option-(b) lightweight path agreed with the designer 2026-05-17. There is no preceding design-small-task or design-large-task because the design space is fully determined by cascade §3.3 / §3.5 and the bug-fix-01 closure pattern. design-specify should:

- Run cascade ground-truth verification against §3.3 and §3.5 to confirm AC-1 through AC-7 align with spec text verbatim.
- Run competing-architecture review if any AC has more than one plausible implementation path; expected outcome is that the rejected-alternatives in D1-D4 already enumerate the alternatives and the spec converges with this brief without significant churn.
- Surface any AC whose acceptance is non-observable from the test layer (AC-7 render text in particular may need fixture stabilization).
