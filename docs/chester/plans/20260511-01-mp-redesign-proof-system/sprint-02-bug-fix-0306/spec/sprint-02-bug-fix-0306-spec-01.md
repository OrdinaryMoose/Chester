# Spec: Consolidated Cascade-Spec Drift Closure (Bundles 03-06)

**Sprint:** sprint-02-bug-fix-0306 (under master 20260511-01-mp-redesign-proof-system)
**Parent brief:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-0306/design/sprint-02-bug-fix-0306-design-00.md
**Architecture:** Hybrid — Targeted reach + inline continuity. Maximal Axis 1 (cascade §3.4 and §3.5 both edited; render adopts D5 enum verbatim). Inline Axis 2 (no extraction of `_CATEGORY_PROBES_SCHEMA` or `_CATEGORY_PROBES`; bug-fix-02 inline pattern continues; DEF-7 stays deferred).

## Goal

Close the residual cascade-spec drift between `design-documents/cascade/05-domain-spec.md` and the proof-system implementation at `skills/design-proof-system/references/domain/`. The cascade-spec probe at `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs` reports 16 failures against main after sprint-02-bug-fix-02 merge; this sprint drives that count to 0 across five category territories (EVIDENCE, PROPOSITION, RESOLUTION, FRICTION, DEFINITION) plus two cascade-document edits (DEF-8 §3.5 risk arity, D5-driven §3.4 inference_pattern propagation). Inline declarative-directive machinery established by bug-fix-01 (`closedEnumFields`, `nonEmptyStringFields`) and bug-fix-02 (`nonEmptyArrayFields`, `referenceFields`, `INVALID_REFERENCE`, `_CATEGORY_PROBES_SCHEMA`) is the load-bearing infrastructure — this sprint extends it to five more category descriptors and adds the parallel test files, without restructuring it.

## Components

**Modified — production code:**

- `skills/design-proof-system/references/domain/tags.js` — `INFERENCE_PATTERNS` replaces four existing impl values with five spec-named underscore-form values; new `EVIDENCE_SOURCE_ENUM` constant holding the four spec-allowed source values (`industry`, `codebase`, `prior-record`, `agent-derivation`); new `FRICTION_SHAPES` and `FRICTION_DISPOSITIONS` constants if not already present.
- `skills/design-proof-system/references/domain/schema.js` — five `CATEGORY_REGISTRY` descriptors extended (EVIDENCE, RESOLUTION, FRICTION, DEFINITION, PROPOSITION) with directive additions; `_CATEGORY_PROBES_SCHEMA` updated where new predicates are emitted (resolution_anchor, resolution_grounding, proposition_grounding); inline sync comment strengthened cross-referencing `_CATEGORY_PROBES` in mutations.js.
- `skills/design-proof-system/references/domain/mutations.js` — `_CATEGORY_PROBES` updated where new predicates are added; no structural relocation.
- `skills/design-proof-system/references/domain/translation.js` — five category translators updated (EVIDENCE rename `claim` → `statement`; PROPOSITION grounding spread; RESOLUTION addresses split; FRICTION arity 4 → 5 with new field names; DEFINITION rename `term` → `canonical_name`); `EDB_PREDICATES` set extended with `proposition_grounding`, `resolution_anchor`, `resolution_grounding`.
- `skills/design-proof-system/references/domain/render.js` — `_ARITIES.friction` 4 → 5; `PROJECTION_ARITIES.friction` 4 → 5; new entries for `proposition_grounding: 2`, `resolution_anchor: 2`, `resolution_grounding: 2`; `renderStructuredProof` gains new sub-lines (PROPOSITION inference pattern, RESOLUTION problem_anchor + grounding, FRICTION friction_shape + anchors).

**Modified — cascade document:**

- `design-documents/cascade/05-domain-spec.md` §3.4.1 — five inference_pattern values updated to underscore form, `proposition_composition` added.
- `design-documents/cascade/05-domain-spec.md` §3.4 main text — `inference_pattern` status flipped from "Optional but encouraged" to "Required" to match impl.
- `design-documents/cascade/05-domain-spec.md` §3.5 — `risk(RiskId, Statement)` updated to `risk(RiskId, Statement, Severity)` (DEF-8 closure).

**Modified — probe:**

- `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs` — Phase 6 PROPOSITION attempts updated to underscore-form inference_pattern values; Phase 10b isolated grounding-array probe updated; new regression assertions appended for each closed category (proposition_grounding rows, resolution_anchor + resolution_grounding rows, friction/5 row, INVALID_REFERENCE assertions for designer source).

**Created — tests:**

- `__tests__/evidence-schema.test.js` — real-import test file following permission-schema.test.js / risk-schema.test.js precedent.
- `__tests__/resolution-schema.test.js`
- `__tests__/friction-schema.test.js`
- `__tests__/definition-schema.test.js`
- `__tests__/proposition-schema.test.js` — extended (existing file) with D2 grounding spread and D5 enum coverage.

## Data Flow

A caller invokes `submitProof` with a domain-level action targeting one of the five reshaped categories. The action flows through `mutations.js` to the per-category `addElement` path, which calls `verifyArgsShape(args, descriptor, ports.query)` for ADD verbs. `verifyArgsShape` runs the directive loops in order: `requiredFields`, `nonEmptyStringFields`, `closedEnumFields`, `nonEmptyArrayFields`, `referenceFields`. The first failure throws `SHAPE_INVALID` (missing/empty/wrong-enum) or `INVALID_REFERENCE` (referenced element doesn't exist) with the error shape established by bug-fix-02: `{code, field, referencedId, message}` for `INVALID_REFERENCE`; `{code: 'SHAPE_INVALID', field, message}` for the rest. On successful shape verification, control passes to the category's translator in `translation.js`, which emits one or more facts via `assertFact` into the substrate. PROPOSITION, RESOLUTION translators *spread* their array-valued fields into per-element facts; other translators emit single fixed-arity facts. `EDB_PREDICATES` whitelist gates predicates entering the substrate. Render-time, `renderStructuredProof` (or `renderClosingArgument`) queries the substrate via `queryPort.query()` with category-specific Datalog patterns to produce the rendered proof; new sub-lines surface the new fields under the existing primary-line + sub-line layout established by ADR-0006.

Cascade-document edits (§3.4 and §3.5) flow through `finish-archive-artifacts`'s Cascade Divergence Gate at sprint finish. Both edits are intentional working-side updates that the Gate must report MATCH for after the archive copy completes; if the worktree-plans/ cascade differs at archive time, the Gate's `accept-working` path is taken (working/ wins) since the working/ edits are the canonical sprint output.

## Error Handling

- **SHAPE_INVALID** — thrown for missing required fields, empty arrays, empty/whitespace strings, and closed-enum-value violations. Error shape: `Object.assign(new Error(msg), { code: 'SHAPE_INVALID', field, message })`. Existing behavior; no change.
- **INVALID_REFERENCE** — thrown when a `referenceFields`-declared field references an element ID that doesn't exist in the substrate via `_existsCategory` (or `_existsAnyCategory` for wildcard). Error shape: `Object.assign(new Error(msg), { code: 'INVALID_REFERENCE', field, referencedId, message })`. Existing behavior from bug-fix-02; extended to RESOLUTION (`problem_anchor`, `grounding`), FRICTION (`anchor_a`, `anchor_b`), PROPOSITION (`grounding`).
- **TYPE_ERROR** (engine-level) — currently thrown by `_validateArgs` when array values reach the engine. Should no longer trigger from PROPOSITION/RESOLUTION submissions after this sprint because translators spread arrays into per-element facts before reaching the engine. Engine-side behavior unchanged; closure is on the translator side.
- **Cascade Divergence Gate halt** — if `finish-archive-artifacts` detects unexpected divergence in §3.4 or §3.5, the operator is prompted with the three-choice resolution menu. Expected behavior at this sprint's finish: MATCH or PLANS_ONLY auto-sync (no conflict).

## Testing Strategy

- **Per-category schema tests** (`__tests__/<category>-schema.test.js`) — real-import tests using `createDomainBridge` and a real Engine instance via shared `makeRealBridge` factory (acknowledged duplication per DEF-5 from bug-fix-02; extraction stays deferred). Each file covers: descriptor shape (requiredFields, closedEnumFields, nonEmptyArrayFields, referenceFields exist and contain expected values); positive cases (valid submission lands expected facts); SHAPE_INVALID cases (each directive rejection produces the right error code + field + message); INVALID_REFERENCE cases (where applicable); end-to-end bridge round-trip (submit → query → assert facts).
- **Probe regression assertions** — Phase 12 of cascade-spec-probe-simulation.mjs appended with category-by-category regression rows: count + content assertions for the new predicates (`proposition_grounding/2`, `resolution_anchor/2`, `resolution_grounding/2`, `friction/5`), plus negative-case assertions confirming `source: 'designer'` rejection on EVIDENCE.
- **Render layer tests** — extended `__tests__/render.test.js` (existing file) for the new sub-lines if not already covered by per-category bridge round-trips.
- **Existing 305 tests** — must remain green. Highest risk: existing tests that supply `source: 'designer'` on EVIDENCE (the H-4 inversion now rejects these); existing tests that reference removed `INFERENCE_PATTERNS` members (`STRUCTURAL`, `ENABLEMENT`, `ABSENCE_IMPLIES_ABSENCE`); existing tests that supply FRICTION `description` (field drops out per spec §3.7); existing tests that supply RESOLUTION `addresses` (field splits into `problem_anchor` + `grounding`); existing tests that supply DEFINITION `term` (renamed to `canonical_name`).

## Constraints

- **Scope discipline** — changes confined to: `skills/design-proof-system/references/domain/{tags,schema,mutations,translation,render}.js`, `__tests__/`, `docs/chester/working/stress-tests/20260517-01/`, and `design-documents/cascade/05-domain-spec.md` §3.4 and §3.5 only. No other cascade sections; no files outside these directories.
- **Real-import test discipline** (dr-20260514-06) — no mocks of Engine, bridge, schema, translator, or substrate. Tests use `createDomainBridge` and real Engine instances.
- **Inline machinery preservation** — `_CATEGORY_PROBES_SCHEMA` (schema.js) and `_CATEGORY_PROBES` (mutations.js) remain inline. No extraction to shared module this sprint. DEF-7 (probe-table sync structural test) stays deferred. Strengthened cross-reference comment is the only mitigation added.
- **Cascade Divergence Gate** — runs at `finish-archive-artifacts` covering both §3.4 and §3.5 edits. Expected outcome: MATCH after working-side edits land in the worktree plans/ archive.
- **Decision-record continuity** — cross-sprint records (notably the H-4 authority inversion decision and the cascade-§3.4 propagation decision) append to `docs/chester/decision-record/decision-record.md` via Fork B at session-records time. No record file is modified after creation.

## Non-Goals

- **Extraction of `_CATEGORY_PROBES_SCHEMA` or `_CATEGORY_PROBES` to a shared module** — DEF-7 stays deferred; warrants its own design pass.
- **Retirement of `permission_decl/2` in favor of `permission/3` only** — DEF-9 stays deferred per bug-fix-02 spec preamble.
- **General refactor of declarative-directive machinery** — bug-fix-02's inline pattern continues; no factoring out of `verifyArgsShape` directive logic.
- **Three-parallel-whitelist consolidation** (`EDB_PREDICATES`, `PROJECTION_ARITIES`, `validPredicates`) — flagged in prior art as a structural risk; not in scope for this sprint.
- **Render-display humanization** (e.g., underscore→space conversion at render boundary) — verbatim storage form is rendered; readability layer is a future polish sprint.
- **Cascade-document edits outside §3.4 and §3.5** — no other cascade sections modified this sprint.
- **PROPOSITION `inference_pattern` content validation beyond the closed-enum check** — pattern-specific semantic rules (e.g., "grounds_imply_conclusion requires ≥1 grounding evidence") are not added.
- **Probe-table sync structural test** (DEF-7) — deferred to its own design pass.
- **FRICTION enum value normalization** (cascade §3.7.1 friction shapes, §3.7.2 friction dispositions) — cascade values differ both in vocabulary (e.g., `proposition-proposition-opposing-pull` vs current impl `coverage_gap`) and in count (cascade has 4 shapes / 5 dispositions; impl has 5 shapes / 4 dispositions). This sprint adopts the FRICTION field-rename (`shape` → `friction_shape`) and the structural additions (`anchor_a`, `anchor_b`, arity 5) but leaves `FRICTION_SHAPES` and `FRICTION_DISPOSITIONS` value sets unchanged. A future cascade-alignment sprint owns the full enum-vocabulary closure (analogous to D5 for inference_pattern). Residual probe failures on FRICTION enum values, if any, are documented residuals per AC-10.1.
- **Cascade §3.6 RESOLUTION rule-based `addresses/3` representation** — cascade §3.6 specifies `addresses(ResoId, ConcernId, Ratification)` as a derived rule with proposition body atoms. This sprint's flatter `resolution_anchor/2` + `resolution_grounding/2` per-element-fact approach does NOT implement that rule template. The flat-fact approach satisfies brief D4's structural split (problem_anchor + grounding[]) at the descriptor and translator layer; full rule-based representation is deferred to a future cascade-alignment sprint.

## Acceptance Criteria

### AC-1.1 — PROPOSITION descriptor declares grounding directives

**Observable boundary:**
- `CATEGORY_REGISTRY.PROPOSITION.nonEmptyArrayFields` contains `'grounding'`
- `CATEGORY_REGISTRY.PROPOSITION.referenceFields.grounding` equals `'*'` (wildcard)

**Note on type-locking asymmetry with RESOLUTION (AC-5.1):** PROPOSITION.grounding uses wildcard `'*'` because cascade §3.4 line 118 allows grounding to reference Evidence, Rules, Permissions, OR other Propositions — four categories. The existing `referenceFields` machinery supports `'<single-category>'` or `'*'` but not category-union, so `'*'` is the correct choice here. RESOLUTION.grounding uses `'proposition'` (type-locked) because cascade §3.6 restricts it to proposition ids only. The asymmetry is cascade-driven, not an oversight.

**Given:** the PROPOSITION descriptor in `schema.js`
**When:** descriptor is inspected by a test
**Then:** `nonEmptyArrayFields` includes `'grounding'` and `referenceFields` includes `{ grounding: '*' }`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.2 — PROPOSITION translator spreads grounding into per-element facts

**Observable boundary:**
- After `addElement('proposition', { grounding: [evA.id, evB.id], inference_pattern: 'grounds_imply_conclusion', statement: '...' })`, the substrate contains exactly two `proposition_grounding/2` facts, one per evidence element
- Single-element grounding `[evA.id]` produces exactly one `proposition_grounding/2` fact

**Given:** a bridge with two pre-existing EVIDENCE elements `evA` and `evB`
**When:** `addElement('proposition', { grounding: [evA.id, evB.id], inference_pattern: 'grounds_imply_conclusion', statement: 'p1' })` is called
**Then:** `queryPort.query(['proposition_grounding', [propId, { var: 'E' }]])` returns exactly two rows, with `E` values equal to `{evA.id, evB.id}` as a set

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.3 — Engine no longer rejects PROPOSITION multi-evidence grounding

**Observable boundary:**
- PROPOSITION submission with `grounding: [id1, id2]` does NOT throw `TYPE_ERROR: non-constant argument`
- Probe attempts [30] and [31] in `cascade-spec-probe-simulation.mjs` no longer produce TYPE_ERROR

**Given:** the post-fix translator spreads grounding before reaching the engine
**When:** a multi-element grounding array is submitted via `addElement`
**Then:** the call completes without engine-side `_validateArgs` throwing TYPE_ERROR

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.4 — INVALID_REFERENCE for non-existent grounding ids

**Observable boundary:**
- PROPOSITION submission with `grounding: ['nonexistent_id']` throws `INVALID_REFERENCE` with `field: 'grounding'`, `referencedId: 'nonexistent_id'`

**Given:** a bridge with no `nonexistent_id` element
**When:** `addElement('proposition', { grounding: ['nonexistent_id'], inference_pattern: 'grounds_imply_conclusion', statement: 'p1' })` is called
**Then:** the call throws an error with `code: 'INVALID_REFERENCE'`, `field: 'grounding'`, `referencedId: 'nonexistent_id'`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.5 — Grounding predicate naming retires legacy `grounding/2`

**Observable boundary:**
- After this sprint, `EDB_PREDICATES` set in `translation.js` contains `'proposition_grounding'` and does NOT contain `'grounding'`
- `PROJECTION_ARITIES` in `render.js` contains `proposition_grounding: 2` and does NOT contain `grounding: 2`
- PROPOSITION translator emits per-element `proposition_grounding(prop_id, evidence_id)` facts (NOT `grounding/2` facts)

**Rationale:** The legacy `grounding/2` predicate was emitted with the array as a single positional arg, which is structurally broken (engine rejects arrays as non-constant). It has no legitimate callers — any consumer attempting to query `grounding/2` would have hit TYPE_ERROR. Safe to remove without dual-emission. New name `proposition_grounding/2` is parallel to `resolution_grounding/2` (AC-5.5) for consistent vocabulary.

**Given:** the post-sprint codebase
**When:** `EDB_PREDICATES` and `PROJECTION_ARITIES` are inspected
**Then:** `proposition_grounding` is the only PROPOSITION-grounding-related predicate present; `grounding` is removed from both registries

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.1 — INFERENCE_PATTERNS exports five underscore-form values

**Observable boundary:**
- `INFERENCE_PATTERNS` is an object with exactly five own enumerable keys
- The wire values are: `grounds_imply_conclusion`, `rule_applies_to_case`, `permission_licenses_relaxation`, `definition_substitution`, `proposition_composition`
- Removed (must not be present): `absence_implies_absence`, `enablement`, `structural`

**Given:** the `INFERENCE_PATTERNS` export from `tags.js`
**When:** the export is inspected by a test
**Then:** `Object.values(INFERENCE_PATTERNS).sort()` equals `['definition_substitution', 'grounds_imply_conclusion', 'permission_licenses_relaxation', 'proposition_composition', 'rule_applies_to_case']`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.2 — PROPOSITION descriptor closedEnumFields propagates new enum

**Observable boundary:**
- Submitting PROPOSITION with `inference_pattern: 'proposition_composition'` succeeds
- Submitting PROPOSITION with `inference_pattern: 'grounds-imply-conclusion'` (hyphenated) is rejected as `SHAPE_INVALID`
- Submitting PROPOSITION with any of the three removed legacy values (`structural`, `enablement`, `absence_implies_absence`) is rejected as `SHAPE_INVALID`

**Given:** the PROPOSITION descriptor with `closedEnumFields: { inference_pattern: INFERENCE_PATTERNS }`
**When:** each test value is submitted via `addElement('proposition', ...)`
**Then:** the five underscore-form values are accepted; all other values are rejected with `code: 'SHAPE_INVALID'`, `field: 'inference_pattern'`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.3 — renderStructuredProof emits verbatim inference pattern sub-line

**Observable boundary:**
- After adding a PROPOSITION with `inference_pattern: 'grounds_imply_conclusion'`, the rendered structured proof contains a sub-line of the form `Inference pattern: grounds_imply_conclusion` (underscores verbatim, no hyphenation, no humanization)

**Given:** a bridge state with a PROPOSITION element whose `inference_pattern` is `'grounds_imply_conclusion'`
**When:** `renderStructuredProof` is called
**Then:** the returned string contains the literal substring `Inference pattern: grounds_imply_conclusion`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.1 — EVIDENCE descriptor uses 'statement' field

**Observable boundary:**
- `CATEGORY_REGISTRY.EVIDENCE.requiredFields` includes `'statement'`
- `requiredFields` does NOT include `'claim'`

**Given:** the EVIDENCE descriptor in `schema.js`
**When:** descriptor is inspected by a test
**Then:** `requiredFields` contains `'source'` and `'statement'`; `'claim'` is absent

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.2 — EVIDENCE translator emits using statement field

**Observable boundary:**
- After `addElement('evidence', { source: 'industry', statement: 'evidence text' })`, the substrate contains an `evidence/3` fact with the third arg equal to `'evidence text'`

**Given:** a bridge ready to accept EVIDENCE
**When:** `addElement('evidence', { source: 'industry', statement: 'evidence text' })` is called
**Then:** `queryPort.query(['evidence', [evId, 'industry', { var: 'S' }]])` returns a row with `S === 'evidence text'`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.3 — Probe attempts [05]-[08] close after rename

**Observable boundary:**
- Probe attempts [05], [06], [07], [08] (EVIDENCE spec-form submissions with `statement` field across four valid source values) report OK after this sprint

**Given:** the probe runs against the post-fix codebase
**When:** Phase 5 EVIDENCE spec-form attempts execute
**Then:** attempts [05]-[08] report OK (no SHAPE_INVALID)

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.1 — EVIDENCE descriptor enforces closed-enum source

**Observable boundary:**
- `CATEGORY_REGISTRY.EVIDENCE.closedEnumFields.source` equals (or references) a set whose values are exactly `{'industry', 'codebase', 'prior-record', 'agent-derivation'}`
- `'designer'` is not in this set
- The pre-existing `sourceConstraint: CONSENT_SOURCES.DESIGNER` field on the EVIDENCE descriptor is unchanged

**Clarification on `sourceConstraint` vs `closedEnumFields.source`:** These are two different fields targeting two different concerns. `sourceConstraint` is a descriptor metadata field (validated by `boot-validators.js:57-58`) that names which consent-source authority (`designer`, `design_partner`, or `system`) is authoritative for the category's mutations. `closedEnumFields.source` is a validation directive (consumed by `verifyArgsShape`) that constrains the user-supplied `source` field value (content provenance: where the evidence came from). The H-4 cascade-§3.1 violation lives entirely on the `source` field value (impl was rejecting non-`designer` values via `sourceConstraint`-coupled logic instead of accepting the four spec values via `closedEnumFields`). The fix is purely additive to `closedEnumFields`; `sourceConstraint` stays put. Plan-build verifies no existing code path conflates the two.

**Given:** the EVIDENCE descriptor in `schema.js`
**When:** descriptor is inspected by a test
**Then:** `closedEnumFields.source` resolves to the four-value spec-allowed set; `'designer'` is excluded; `sourceConstraint` retains its prior value

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.2 — EVIDENCE source='designer' is rejected

**Observable boundary:**
- `addElement('evidence', { source: 'designer', statement: '...' })` throws `SHAPE_INVALID` with `field: 'source'`
- Probe attempt [09] (the must-reject probe) reports OK_REJECTED

**Given:** a bridge ready to accept EVIDENCE
**When:** `addElement('evidence', { source: 'designer', statement: '...' })` is called
**Then:** the call throws an error with `code: 'SHAPE_INVALID'`, `field: 'source'`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.3 — All four spec-allowed EVIDENCE source values are accepted

**Observable boundary:**
- Each of `'industry'`, `'codebase'`, `'prior-record'`, `'agent-derivation'` succeeds as the `source` value when other required fields are valid

**Given:** a bridge ready to accept EVIDENCE
**When:** `addElement('evidence', { source: <value>, statement: 'text' })` is called for each of the four allowed values
**Then:** each call succeeds and the substrate contains an `evidence/3` fact with the correct source

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.1 — RESOLUTION descriptor declares split structure

**Observable boundary:**
- `CATEGORY_REGISTRY.RESOLUTION.requiredFields` equals `['statement', 'problem_anchor', 'grounding']` (order may vary; set-equality is the check)
- `nonEmptyArrayFields` contains `'grounding'`
- `referenceFields` equals `{ problem_anchor: 'concern', grounding: 'proposition' }`
- `requiredFields` does NOT include `'addresses'`

**Given:** the RESOLUTION descriptor in `schema.js`
**When:** descriptor is inspected by a test
**Then:** the descriptor declares the three-field split with the appropriate reference targets

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.2 — RESOLUTION translator emits anchor + grounding-spread facts

**Observable boundary:**
- After `addElement('resolution', { statement: 'r1', problem_anchor: concernId, grounding: [propA.id, propB.id] })`, the substrate contains:
  - One `resolution_anchor/2` fact linking the resolution to the concern
  - Two `resolution_grounding/2` facts (one per proposition), spread per-element

**Given:** a bridge with one pre-existing CONCERN and two PROPOSITION elements
**When:** RESOLUTION is added with array-grounding
**Then:** `resolution_anchor` row count is 1; `resolution_grounding` row count equals the grounding array length

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.3 — INVALID_REFERENCE for non-existent RESOLUTION references

**Observable boundary:**
- Submitting with `problem_anchor: 'nonexistent_concern'` throws `INVALID_REFERENCE` with `field: 'problem_anchor'`
- Submitting with `grounding: ['nonexistent_proposition']` throws `INVALID_REFERENCE` with `field: 'grounding'`

**Given:** a bridge with no `nonexistent_concern` or `nonexistent_proposition` element
**When:** RESOLUTION is added with each non-existent reference in turn
**Then:** each call throws `INVALID_REFERENCE` with the correct `field` and `referencedId`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.4 — Probe attempts [25], [26] close after RESOLUTION reshape

**Observable boundary:**
- Probe attempts [25] and [26] report OK after this sprint

**Given:** the probe runs against the post-fix codebase
**When:** Phase 9 RESOLUTION spec-form attempts execute
**Then:** attempts [25] and [26] report OK (no SHAPE_INVALID)

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.5 — RESOLUTION predicate naming retires legacy `addresses/2`

**Observable boundary:**
- After this sprint, `EDB_PREDICATES` set in `translation.js` contains `'resolution_anchor'` and `'resolution_grounding'`; does NOT contain `'addresses'`
- `PROJECTION_ARITIES` in `render.js` contains `resolution_anchor: 2` and `resolution_grounding: 2`; does NOT contain `addresses: 2`
- RESOLUTION translator emits one `resolution_anchor/2` fact + per-element `resolution_grounding/2` facts; does NOT emit `addresses/2` facts

**Rationale:** The cascade §3.6 reshape structurally separates the concern reference (singular) from the proposition grounding (array). New predicate names make the semantic split explicit at the substrate layer. Note: cascade §3.6 also describes a derived `addresses/3` rule with proposition body atoms — that rule template is NOT implemented in this sprint (see Non-Goals). The current impl's `resolution_decl/2` rule template (translation.js:121-132) is unchanged; it continues to emit `resolution/2` via approval.

**Given:** the post-sprint codebase
**When:** `EDB_PREDICATES` and `PROJECTION_ARITIES` are inspected
**Then:** `resolution_anchor` and `resolution_grounding` are present; `addresses` is removed from both registries

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.1 — FRICTION descriptor matches spec §3.7

**Observable boundary:**
- `CATEGORY_REGISTRY.FRICTION.requiredFields` equals `['friction_shape', 'anchor_a', 'anchor_b', 'disposition']` (set-equality)
- `optionalFields` contains `'statement'` (cascade §3.7 marks `statement` as optional prose)
- `closedEnumFields` includes `friction_shape` and `disposition` (values unchanged from current impl — FRICTION enum value normalization is deferred per Non-Goals)
- `referenceFields` equals `{ anchor_a: '*', anchor_b: '*' }`
- `requiredFields` does NOT include `'description'` or `'shape'`

**Given:** the FRICTION descriptor in `schema.js`
**When:** descriptor is inspected by a test
**Then:** the descriptor declares the four-field shape with wildcard reference targets and no `description` field

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.2 — FRICTION translator emits arity-5 fact

**Observable boundary:**
- After `addElement('friction', { friction_shape: <valid>, anchor_a: idA, anchor_b: idB, disposition: <valid> })`, the substrate contains one `friction/5` fact

**Given:** a bridge with two pre-existing elements (any category) as anchors
**When:** FRICTION is added with all four required fields valid
**Then:** `queryPort.query(['friction', [fId, { var: 'S' }, { var: 'A' }, { var: 'B' }, { var: 'D' }]])` returns exactly one row with the submitted values

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.3 — FRICTION arity tables corrected to 5

**Observable boundary:**
- `_ARITIES.friction === 5` (in render.js)
- `PROJECTION_ARITIES.friction === 5` (in render.js)

**Given:** the render.js arity tables
**When:** inspected after this sprint's changes
**Then:** both entries report arity 5

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.4 — INVALID_REFERENCE for non-existent FRICTION anchors

**Observable boundary:**
- Submitting FRICTION with `anchor_a: 'nonexistent_id'` throws `INVALID_REFERENCE` with `field: 'anchor_a'`
- Same for `anchor_b`

**Given:** a bridge with no `nonexistent_id` element
**When:** FRICTION is added with each non-existent anchor in turn
**Then:** each call throws `INVALID_REFERENCE` with the correct `field` and `referencedId`

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.5 — Probe attempt [27] closes after FRICTION reshape

**Observable boundary:**
- Probe attempt [27] reports OK after this sprint

**Given:** the probe runs against the post-fix codebase
**When:** the FRICTION spec-form attempt executes
**Then:** attempt [27] reports OK (no SHAPE_INVALID)

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.1 — DEFINITION descriptor uses canonical_name field

**Observable boundary:**
- `CATEGORY_REGISTRY.DEFINITION.requiredFields` contains `'canonical_name'`
- `requiredFields` does NOT contain `'term'`

**Given:** the DEFINITION descriptor in `schema.js`
**When:** descriptor is inspected by a test
**Then:** `requiredFields` includes `canonical_name` and `definition`; `term` is absent

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.2 — DEFINITION translator emits using canonical_name

**Observable boundary:**
- After `addElement('definition', { canonical_name: 'Calculator', definition: 'A device that performs arithmetic' })`, the substrate contains a `definition_decl/3` fact whose second arg is `'Calculator'`

**Given:** a bridge ready to accept DEFINITION
**When:** DEFINITION is added with the canonical_name field
**Then:** the resulting fact carries the canonical_name value in the expected slot

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.3 — Probe attempts [02]-[04] close after rename

**Observable boundary:**
- Probe attempts [02], [03], [04] report OK after this sprint

**Given:** the probe runs against the post-fix codebase
**When:** Phase 4 DEFINITION spec-form attempts execute
**Then:** attempts [02]-[04] report OK (no SHAPE_INVALID)

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-8.1 — Cascade §3.5 updated to risk/3 + Severity (DEF-8 closure)

**Observable boundary:**
- `design-documents/cascade/05-domain-spec.md` §3.5 text contains the fact form `risk(RiskId, Statement, Severity)` (arity 3)
- The prior arity-2 form `risk(RiskId, Statement)` is no longer present in §3.5

**Given:** the cascade document after this sprint's edits
**When:** §3.5 is read
**Then:** the documented fact form is arity 3 with the third arg labeled Severity

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-8.2 — Cascade §3.4.1 updated to underscore inference_pattern values

**Observable boundary:**
- `design-documents/cascade/05-domain-spec.md` §3.4.1 lists exactly five inference_pattern values, all in underscore form: `grounds_imply_conclusion`, `rule_applies_to_case`, `permission_licenses_relaxation`, `definition_substitution`, `proposition_composition`
- The prior hyphenated forms are no longer present in §3.4.1

**Given:** the cascade document after this sprint's edits
**When:** §3.4.1 is read
**Then:** all five values use underscore separators; `proposition_composition` is present; no hyphenated form remains

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-8.3 — Cascade §3.4 marks inference_pattern Required

**Observable boundary:**
- `design-documents/cascade/05-domain-spec.md` §3.4 main text describes `inference_pattern` as required (not "Optional but encouraged" or equivalent)

**Given:** the cascade document after this sprint's edits
**When:** §3.4 main text is read
**Then:** `inference_pattern` is described as a required field consistent with the impl descriptor's `requiredFields` inclusion

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-8.4 — Cascade Divergence Gate reports MATCH at sprint finish

**Observable boundary:**
- When `finish-archive-artifacts` runs at sprint finish, the Cascade Divergence Gate's `chester-cascade-diff` invocation reports MATCH for `design-documents/05-domain-spec.md`
- No CONFLICT or WORKING_ONLY entries are produced

**Given:** working-side cascade edits land before sprint finish; worktree plans/ archive is updated by `finish-archive-artifacts`
**When:** the Divergence Gate runs
**Then:** the manifest contains only MATCH entries

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-9.1 — renderStructuredProof PROPOSITION block surfaces inference pattern and grounding

**Observable boundary:**
- For any PROPOSITION element, the rendered output contains an "Inference pattern: <value>" sub-line where `<value>` is the verbatim stored inference_pattern value
- The same PROPOSITION block also contains a "Grounding: <id1>, <id2>, ..." sub-line listing the comma-joined grounding ids (sourced from `proposition_grounding/2` facts), for consistency with PERMISSION's `Relieves:` sub-line and RISK's `Basis:` sub-line

**Implementation note:** The `inference_pattern` value is stored as the third positional arg of `proposition_decl/3` (translator line 36). The render-side query is `proposition_decl(p.I, _, { var: 'P' })` to bind the pattern value. The grounding sub-line queries `proposition_grounding(p.I, { var: 'E' })` and joins the resulting `E` values with commas (mirroring the RISK basis sub-line pattern at render.js:32-35).

**Given:** a bridge state with at least one PROPOSITION element with valid grounding and inference_pattern
**When:** `renderStructuredProof` is called
**Then:** the PROPOSITION's primary line is followed by an `Inference pattern:` sub-line carrying the underscore-form value AND a `Grounding:` sub-line listing the evidence ids

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-9.2 — renderStructuredProof RESOLUTION block surfaces anchor + grounding

**Observable boundary:**
- For any RESOLUTION element, the rendered output contains sub-lines: "Problem anchor: <concern-id>" and "Grounding: <proposition-id-1>, <proposition-id-2>, ..." (comma-joined ids)

**Given:** a bridge state with at least one RESOLUTION element with valid anchor and grounding
**When:** `renderStructuredProof` is called
**Then:** the RESOLUTION's primary line is followed by sub-lines for problem_anchor and grounding

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-9.3 — renderStructuredProof FRICTION block is added (new section)

**Observable boundary:**
- `renderStructuredProof` includes a new `## Frictions` section when FRICTION elements exist in the substrate (the function currently has no FRICTION rendering at all; see render.js:20-75)
- For each FRICTION element, the section contains a primary line `- <id>: <statement-or-shape>` followed by sub-lines: "Friction shape: <friction_shape>", "Anchor A: <anchor_a-id>", "Anchor B: <anchor_b-id>", "Disposition: <disposition>"

**Implementation note:** This is a NEW render section, not an extension of an existing one. The current `renderStructuredProof` (render.js:20-75) renders Givens, Risks, Permissions, Lemmas, and Theorems but has no Frictions section despite FRICTION being a first-class element category. The new section follows the established pattern (primary line + sub-lines) used by Risks and Permissions blocks. Query: `readPorts.query.query(['friction', [{var: 'I'}, {var: 'S'}, {var: 'A'}, {var: 'B'}, {var: 'D'}]])` against the arity-5 fact form per AC-6.2.

**Given:** a bridge state with at least one FRICTION element with valid fields
**When:** `renderStructuredProof` is called
**Then:** the rendered output contains a `## Frictions` section with one block per friction; each block has a primary line followed by the four sub-lines

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-10.1 — Probe failure count drops to 0 (or documented residual)

**Observable boundary:**
- Running `cascade-spec-probe-simulation.mjs` against the post-sprint main branch produces a failure count of 0 OR a count whose every remaining failure is explicitly catalogued in the sprint summary as out-of-scope residual with rationale

**Given:** the post-merge state of main
**When:** the probe is run end-to-end
**Then:** failure count is 0, or any non-zero count is fully accounted for in the summary

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-10.2 — Probe extended with regression assertions per closed category

**Observable boundary:**
- Phase 12 of `cascade-spec-probe-simulation.mjs` contains regression assertions for:
  - `proposition_grounding/2` row count + content for D2 closure
  - `resolution_anchor/2` and `resolution_grounding/2` row counts for D4 RESOLUTION
  - `friction/5` row content for D4 FRICTION (with arity-5 verification)
  - SHAPE_INVALID rejection assertion for `source: 'designer'` on EVIDENCE (H-4)

**Given:** the post-fix probe file
**When:** Phase 12 is read
**Then:** each new assertion is present and passes against the post-fix substrate state

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-10.3 — Existing probe attempts updated to reflect underscore-form inference_pattern

**Observable boundary:**
- Phase 6 probe attempts [15], [16], [17] use underscore-form inference_pattern values (`grounds_imply_conclusion`, `proposition_composition`, etc.)
- Phase 10b probe (the isolated grounding-array attempt) updated similarly
- No probe attempt uses removed legacy values (`structural`, `enablement`, `absence_implies_absence`)

**Given:** the post-fix probe file
**When:** all PROPOSITION-relevant phases are scanned
**Then:** every inference_pattern submission uses one of the five underscore-form values

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-11.1 — Per-category test files created

**Observable boundary:**
- These test files exist and follow the bug-fix-02 pattern (real-import, `createDomainBridge`, `makeRealBridge` factory):
  - `__tests__/evidence-schema.test.js`
  - `__tests__/resolution-schema.test.js`
  - `__tests__/friction-schema.test.js`
  - `__tests__/definition-schema.test.js`
- The fifth category test file (`__tests__/proposition-schema.test.js`) already exists and is *extended* rather than created — see AC-11.2.

**Given:** the post-sprint codebase
**When:** the `__tests__/` directory is scanned
**Then:** all four files exist; each uses real Engine + createDomainBridge; each covers descriptor shape + positive case + SHAPE_INVALID rejections + INVALID_REFERENCE rejections (where applicable) + end-to-end bridge round-trip

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-11.2 — proposition-schema.test.js extended for D2 spread and D5 enum

**Observable boundary:**
- `__tests__/proposition-schema.test.js` contains tests asserting:
  - `grounding` array of N elements produces N `proposition_grounding/2` facts
  - Single-element grounding produces 1 fact
  - INVALID_REFERENCE for non-existent grounding ids
  - All five underscore-form inference_pattern values accepted
  - Hyphenated forms and removed legacy values rejected with SHAPE_INVALID

**Given:** the existing test file
**When:** it is read after this sprint's extensions
**Then:** the above assertions are present

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-12.1 — Existing tests remain green

**Observable boundary:**
- `npm test` (or equivalent) reports the prior 305 tests still passing after this sprint's changes
- Plus the new per-category test files all pass

**Given:** the post-merge state
**When:** the full test suite runs
**Then:** zero failures, zero pending; new test count includes all per-category file additions

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-12.2 — Scope-confined file set

**Observable boundary:**
- Files changed by this sprint are confined to:
  - `skills/design-proof-system/references/domain/{tags,schema,mutations,translation,render}.js`
  - `__tests__/*.test.js` (new and modified per-category files; render tests if needed)
  - `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs`
  - `design-documents/cascade/05-domain-spec.md` §3.4 and §3.5 only
  - Working-directory sprint artifacts (design/, spec/, plan/, summary/)

**Given:** the merged sprint diff
**When:** `git diff main...sprint-02-bug-fix-0306 -- :!docs/chester/working/` is inspected
**Then:** only the listed paths appear in the diff

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-12.3 — No extraction of category-probe tables

**Observable boundary:**
- `_CATEGORY_PROBES_SCHEMA` remains in `schema.js` as a private constant
- `_CATEGORY_PROBES` remains in `mutations.js` as a private constant
- No new file `category-probes.js` (or equivalent) is introduced
- An inline sync comment cross-referencing the two tables is present in at least one location (preference: `schema.js` near `_CATEGORY_PROBES_SCHEMA`)

**Given:** the post-merge file structure
**When:** the domain directory is scanned
**Then:** both tables remain inline; no shared probe-table module exists

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-17T15:07:49Z -->
<!-- produced-by design-specify@v0006 -->
