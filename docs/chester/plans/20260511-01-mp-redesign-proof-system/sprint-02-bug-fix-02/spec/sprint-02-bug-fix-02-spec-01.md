# Spec: Close PERMISSION.relieves and RISK.basis silent-drop gaps; add INVALID_REFERENCE existence validation

**Sprint:** sprint-02-bug-fix-02 (under master plan `20260511-01-mp-redesign-proof-system`)
**Parent brief:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-02/design/sprint-02-bug-fix-02-design-00.md`
**Architecture:** Hybrid Recommendation from competing-architecture review. Architect A's declarative-directive spine extended with two new directives (`referenceFields` for existence checking, `nonEmptyArrayFields` for closing the residual empty-array gap) consumed by an extended `verifyArgsShape` that takes an optional third argument (`readPort`). The single call site in `runOperation` is updated to pass `ports.query` for ADD and REVISE verbs. Architect B's risk-discovery work folded in as in-scope plan items: pre-existing `PROJECTION_ARITIES risk: 2` mismatch corrected to `risk: 3` (a stale entry already misaligned with the translator's three-arg output), and `boot-validators.js` known-properties allow-list extended with the two new directive names. The translator emits `permission/3` as the new linkage fact while preserving `permission_decl/2` as the probe-table-facing declaration predicate — this keeps `_CATEGORY_PROBES` in `mutations.js` unchanged and avoids cross-cutting RATIFY-path disturbance. INVALID_REFERENCE is established as a new domain-layer error code following the existing `{code, field, message}` shape with an additional `referencedId` property per AC-6.

## Goal

The domain layer's PERMISSION and RISK schemas each diverge from cascade `05-domain-spec.md` §3.3 and §3.5. PERMISSION declares `requiredFields: ['statement']` — missing the cascade-required `relieves` field that links a permission to the rule it relieves. The PERMISSION translator emits only `permission_decl(PermId, Statement)` and discards any `relieves` argument silently; no `permission(PermId, Statement, RuleId)` fact ever reaches the EDB. RISK declares `requiredFields: ['statement']` — missing the cascade-required `basis` (a non-empty array of element IDs the risk attaches to). The RISK translator emits only `risk(RiskId, Statement, Severity)` and discards any `basis` argument; no `risk_basis(RiskId, ElementId)` facts reach the EDB. Two compounding cross-cutting issues compound the closure: the cascade requires domain-side existence validation for both reference fields (§3.3 final paragraph; structural analogue for §3.5), and a pre-existing `PROJECTION_ARITIES` arity mismatch on `risk` was uncovered during competing-architecture review (table says 2, translator emits 3). This spec closes the schema / translator / whitelist / render gaps end-to-end for both categories, introduces two new declarative directives (`referenceFields`, `nonEmptyArrayFields`) that consume the read port from the call site, establishes `INVALID_REFERENCE` as a new domain-layer error code, fixes the pre-existing `risk` arity mismatch, and extends `boot-validators.js` known-properties allow-list so descriptor-shape validation does not reject the new directives.

## Components

**Note on line citations:** All `line N` references reflect the codebase at spec-writing time. Lines will drift between spec writing and implementation. Plan-build and execute-write must re-locate references by content (grep for the named identifier or string), not by the cited line number.

**Modified files:**

- `skills/design-proof-system/references/domain/schema.js`
  - `CATEGORY_REGISTRY[PERMISSION].requiredFields` extended from `['statement']` to `['statement', 'relieves']`. Cascade enumeration order is statement → relieves.
  - `CATEGORY_REGISTRY[PERMISSION].optionalFields` extended from `['rationale']` to `['rationale', 'scope_constraint']`.
  - `CATEGORY_REGISTRY[PERMISSION]` gains a new descriptor field `referenceFields: { relieves: 'rule' }`. The value names the required element-category constraint for that field's reference.
  - `CATEGORY_REGISTRY[RISK].requiredFields` extended from `['statement']` to `['statement', 'basis']`. Cascade enumeration order is statement → basis.
  - `CATEGORY_REGISTRY[RISK].optionalFields` retains `['severity']` per D2 (cascade does not forbid optionals beyond what it lists).
  - `CATEGORY_REGISTRY[RISK]` gains two new descriptor fields: `nonEmptyArrayFields: ['basis']` (mirrors the bug-fix-01 `nonEmptyStringFields` precedent for array-typed required fields) and `referenceFields: { basis: '*' }` (the `'*'` constraint means any-category match acceptable, since basis references heterogeneous element types per cascade §3.5).
  - `verifyArgsShape(args, shapeOrDescriptor, readPort = null)` gains an optional third positional parameter. Two new loops run in sequence after the existing presence + closed-enum + nonEmptyStringFields checks:
    - **nonEmptyArrayFields loop** (runs unconditionally when the directive is present): for each field name in `desc.nonEmptyArrayFields ?? []`, if the field is present and `!Array.isArray(value) || value.length === 0`, throw `{code: 'SHAPE_INVALID', field, message: ...}`. This loop does not require the read port and runs even when `readPort` is null.
    - **referenceFields loop** (runs only when `readPort` is provided and the directive is non-empty): for each `[fieldName, categoryConstraint]` entry in `desc.referenceFields ?? {}`, normalize the field value (scalar → single-element array; array → as-is) and for each id call a category-existence helper. Helper uses a small private probe constant inside `schema.js` mapping category-name to declaration predicate (`rule → rule_decl/2`, `concern → concern/3`, etc.) plus a wildcard path that iterates all category probes. On miss, throw `{code: 'INVALID_REFERENCE', field: fieldName, referencedId: firstFailingId, message: ...}`.
  - A new private constant `_CATEGORY_PROBES_SCHEMA` is added at module scope (visibility: not exported). It is a partial mirror of `_CATEGORY_PROBES` from `mutations.js`, scoped to only the categories the descriptors declare as `referenceFields` constraints (at spec-writing time: `rule` and wildcard). Duplicating rather than importing avoids the circular import that would otherwise arise (`schema.js` ← `mutations.js` ← `schema.js`). Future descriptors declaring new category constraints add their probe entries to this constant.

- `skills/design-proof-system/references/domain/mutations.js`
  - One call-site change at the existing `verifyArgsShape(args, argShapeTarget)` invocation (currently line 231). The call becomes `verifyArgsShape(args, argShapeTarget, (verbName === ACTION_LABELS.ADD || verbName === ACTION_LABELS.REVISE) ? ports.query : null)`. For RATIFY, WITHDRAW, MANAGE_FRICTION, and any other verb that does not create or modify reference fields, the third argument is `null` — the referenceFields loop short-circuits, preserving backward compatibility with bug-fix-01's RATIFY argShape.
  - No other changes to `mutations.js`. `_CATEGORY_PROBES` (currently around line 18) is **not** modified — see "Translator emission strategy" below for why.

- `skills/design-proof-system/references/domain/translation.js`
  - PERMISSION translator (currently lines 23-27) extended. The translator now returns both the existing declaration fact and the new linkage fact:
    - `['permission_decl', [id, args.statement]]` — **preserved** unchanged. This is the predicate `_CATEGORY_PROBES` in `mutations.js` already uses for PERMISSION category resolution during RATIFY. Removing it would force a `_CATEGORY_PROBES` change with cross-impact on the ratify path. Keeping it preserves that path entirely.
    - `['permission', [id, args.statement, args.relieves]]` — **new**. The cascade-named linkage fact per §3.3 engine representation.
    - `['permission_scope', [id, args.scope_constraint]]` — **new, conditional**. Emitted only when `args.scope_constraint` is a non-empty string. Absent emission when the optional field is absent.
  - RISK translator (currently lines 41-45) extended. The translator continues to emit the existing 3-arg `risk` fact and adds a per-element `risk_basis` spread:
    - `['risk', [id, args.statement, args.severity ?? 'unspecified']]` — **preserved** unchanged. The `severity` optional field stays per D2.
    - `...(Array.isArray(args.basis) ? args.basis.map(eid => ['risk_basis', [id, eid]]) : [])` — **new spread**. Mirrors the RESOLUTION `addresses` spread idiom currently at line 49. When `basis` is absent or an empty array, zero `risk_basis` facts are emitted. The `nonEmptyArrayFields` schema check prevents the empty-array case from reaching the translator under normal flow.
  - `EDB_PREDICATES` (currently around line 185) extended with three predicate names: `'permission'`, `'permission_scope'`, `'risk_basis'`. `'permission_decl'` is **kept** (it was always there and is still emitted).

- `skills/design-proof-system/references/domain/render.js`
  - `PROJECTION_ARITIES` table extended with three new entries: `permission: 3`, `permission_scope: 2`, `risk_basis: 2`. The existing `permission_decl: 2` entry is **preserved** (the translator still emits the predicate).
  - `PROJECTION_ARITIES` table existing `risk: 2` entry **corrected to `risk: 3`**. The RISK translator has always emitted `risk(id, statement, severity)` — three arguments. The table entry was wrong at spec-writing time and silently dropped the third positional argument from the Datalog projection. AC-5.3 verifies the corrected entry.
  - `renderStructuredProof` gains two new render blocks:
    - **PERMISSION block** — queries `permission_decl(PermId, Statement)` for the list of permissions. For each permission binding, queries `permission(PermId, _, RuleId)` to emit a `Relieves: <rule-id>` sub-line; queries `permission_scope(PermId, ScopeText)` to emit a conditional `Scope: <text>` sub-line (omitted when no fact exists).
    - **RISK block** — queries `risk(RiskId, Statement, Severity)` for the list of risks. For each risk binding, queries `risk_basis(RiskId, ElementId)` to collect all basis ids; emits a `Basis: <id-1>, <id-2>, ...` sub-line joining the ids with `, ` (omitted when zero rows — but per `nonEmptyArrayFields`, this case should not occur in well-formed proofs).
  - Both blocks follow the per-element sub-line idiom established by ADR-0006 and applied in sprint-02-bug-fix-01 for PROPOSITION's three sub-lines.
  - The `_ARITIES` table (currently lines 52-61) used by `renderElementDeep` is **not** extended for `permission`, `permission_scope`, or `risk_basis` (the linkage facts are surfaced by `renderStructuredProof`'s sub-line queries above, per the bug-fix-01 precedent for PROPOSITION's three meta-fact lines). **However**, the existing `_ARITIES.risk` entry is **corrected from 2 to 3** to match the translator's `risk(id, statement, severity)` emission — same correction logic as AC-5.3 for `PROJECTION_ARITIES.risk`. Without this correction, `renderElementDeep({id: 'risk_N'})` returns null for any risk because the Engine matches by exact arity (Unifier returns null when pattern.length !== fact.length) and the arity-2 query never matches the arity-3 fact. AC-5.5 verifies the corrected value.

- `skills/design-proof-system/references/domain/boot-validators.js` — **no change required.** Ground-truth verification of `validateCategoryRegistry` at `boot-validators.js:50-64` shows the validator only positively asserts `requiredFields`, `sourceConstraint`, `idShape`, and `renderSection`. It does not check `closedEnumFields`, `nonEmptyStringFields`, `optionalFields`, or `authority`, and never rejects unknown properties on descriptors. The new directives `referenceFields` and `nonEmptyArrayFields` are silently accepted by boot validation, matching the existing `closedEnumFields` and `nonEmptyStringFields` pattern. Architect B's flagged risk (boot-validators known-properties allow-list update) was dissolved by adversarial spec review; this spec records the dissolution rather than the original concern.

- `skills/design-proof-system/references/domain/__tests__/schema.test.js`
  - New mechanism tests for the two new directives using stub descriptors (analogous to the `nonEmptyStringFields` mechanism test added in bug-fix-01). One test confirms the `nonEmptyArrayFields` loop throws `SHAPE_INVALID` on empty array, non-array value, and missing-when-required-and-present-elsewhere combinations. Another test confirms the `referenceFields` loop calls the read port appropriately and throws `INVALID_REFERENCE` on miss.

- `skills/design-proof-system/references/domain/__tests__/translation.test.js`
  - Fixture additions: existing PERMISSION-related tests get `relieves` added to their args. Existing RISK-related tests get `basis` added. New assertions per Acceptance Criteria below.

- `skills/design-proof-system/references/domain/__tests__/render.test.js`
  - New assertions for the PERMISSION and RISK render blocks per AC-7.

- `skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js`
  - Verb-case fixture additions: any existing PERMISSION ADD/REVISE case adds `relieves`; any existing RISK ADD/REVISE case adds `basis`. Comment update at the PERMISSION and RISK required-fields lines reflecting the new requirements.

- `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs`
  - Probe extension per AC-8. The H-2 and H-3 attempts (currently attempts 12-13 for PERMISSION and 17-18 for RISK) are extended to assert that the linkage facts exist after submission. New assertions: after `addElement` returns `{id: permission_X}`, `queryProof({pattern: ['permission', [permX, ...]] })` returns one row. After `addElement` returns `{id: risk_X}` for a basis array of N elements, `queryProof({pattern: ['risk_basis', [riskX, ...]] })` returns N rows.

**New files:**

- `skills/design-proof-system/references/domain/__tests__/permission-schema.test.js`
  - Follows the `concern-schema.test.js` / `proposition-schema.test.js` precedent: dedicated per-category test file with layered `describe` blocks (schema, translation, bridge facade, lifecycle integration). Uses real imports per dr-20260514-06. Covers AC-1.x descriptor shape, AC-2.x translator emission, AC-6.1/AC-6.4 INVALID_REFERENCE existence check, AC-7.1/AC-7.2 render block.

- `skills/design-proof-system/references/domain/__tests__/risk-schema.test.js`
  - Same structure. Covers AC-3.x descriptor shape (including nonEmptyArrayFields), AC-4.1 translator spread, AC-6.2/AC-6.3/AC-6.4 INVALID_REFERENCE and empty-array enforcement, AC-7.3 render block.

**Unchanged surfaces (explicitly):**

- `skills/design-proof-system/references/domain/mutations.js` — `_CATEGORY_PROBES` table at line ~18 is **not** modified. The PERMISSION entry continues to point at `permission_decl/2` because the translator continues to emit `permission_decl` alongside the new `permission` predicate. Sprint-02-bug-fix-01 RATIFY argShape pattern at line ~117 is not modified.
- `skills/design-proof-system/references/domain/domain-bridge.js` — the two hardcoded `validPredicates` sets (currently around lines 50 and 198) hardcode Phase-A rule-head predicates only. EDB predicates flow in automatically via `getDeclaredEDBPredicates()`. AC-5.4 verifies this auto-flow; no source edit to `domain-bridge.js` is required.
- `skills/design-proof-system/references/domain/authority.js`, `lifecycle.js`, `closure-policy.js`, `friction-policy.js`, `counterfactual.js`, `restructuring.js`, `engine-port-adapter.js`, `tags.js` — no change.
- All other element-category descriptors in `CATEGORY_REGISTRY` (EVIDENCE, RULE, PROPOSITION, RESOLUTION, FRICTION, CONCERN, DEFINITION) — no change. Only PERMISSION and RISK are touched.
- All engine-layer files — no change.

## Data Flow

**Add path — PERMISSION with valid relieves:**

1. Caller invokes `bridge.addElement({idShape: 'permission', statement, relieves, scope_constraint?}, designerConsent)`.
2. `runOperation` resolves `argShapeTarget` to PERMISSION descriptor and calls `verifyArgsShape(args, descriptor, ports.query)`. Presence check passes (relieves is present). Closed-enum loop is empty for PERMISSION. `nonEmptyStringFields` loop is empty for PERMISSION. `nonEmptyArrayFields` loop is empty for PERMISSION. `referenceFields` loop runs: looks up `relieves` field value against `rule_decl(<relieves>, _)` via `ports.query.exists`. Returns true → loop completes without throw.
3. Authority check, id allocation (`permission_N`), clock tick proceed unchanged.
4. `TRANSLATORS[PERMISSION](args, id, ts)` returns `baseFacts` = `[['permission_decl', [id, statement]], ['permission', [id, statement, relieves]]]` plus the conditional `['permission_scope', [id, scope_constraint]]` when present.
5. Each baseFact asserts into the engine. Boot-validators verify each predicate is in `EDB_PREDICATES` — all three pass.

**Add path — PERMISSION with non-existent relieves:**

1. Same as steps 1-2, but `referenceFields` loop's existence check returns false for the `relieves` value.
2. Loop throws `{code: 'INVALID_REFERENCE', field: 'relieves', referencedId: <value>, message: ...}`.
3. No id is allocated. No fact is emitted. Caller receives the thrown error.

**Add path — RISK with non-empty basis array:**

1. Caller invokes `bridge.addElement({idShape: 'risk', statement, basis: [id1, id2]}, designerConsent)`.
2. `runOperation` calls `verifyArgsShape(args, descriptor, ports.query)`. Presence check passes. `nonEmptyArrayFields` loop runs: `basis` is a non-empty array → passes. `referenceFields` loop runs: iterates the array; for each id, checks existence under wildcard category constraint (iterates `_CATEGORY_PROBES_SCHEMA` wildcard probes). Both ids resolve → passes.
3. Authority check, id allocation (`risk_N`), clock tick proceed unchanged.
4. `TRANSLATORS[RISK](args, id, ts)` returns `baseFacts` = `[['risk', [id, statement, 'unspecified']], ['risk_basis', [id, id1]], ['risk_basis', [id, id2]]]`. Plus the existing `created_at` metaFact.
5. Each baseFact asserts into the engine.

**Add path — RISK with empty basis array:**

1. Caller invokes `bridge.addElement({idShape: 'risk', statement, basis: []}, designerConsent)`.
2. `verifyArgsShape` `nonEmptyArrayFields` loop fires on `basis.length === 0` → throws `{code: 'SHAPE_INVALID', field: 'basis', message: ...}`.

**Render path:**

1. Caller invokes `bridge.renderStructuredProof({})`.
2. Function emits existing sections (Problem, Givens, Definitions, Inferential framework, Lemmas, Theorems, Frictions, Closure status) unchanged.
3. New PERMISSION block (under Inferential framework section, following existing PERMISSION listing): for each permission binding from `permission_decl(I, S)`, queries `permission(I, _, R)` and emits `Relieves: <R>` sub-line; queries `permission_scope(I, ScopeText)` and conditionally emits `Scope: <ScopeText>` sub-line.
4. New RISK block (under Problem section, alongside existing risk listing): for each risk binding from `risk(I, S, V)`, queries `risk_basis(I, E)` collecting all element ids; emits `Basis: <e1>, <e2>, ...` sub-line.

**Datalog projection path:**

1. Caller invokes `bridge.renderDatalogProjection({})`.
2. Function iterates `PROJECTION_ARITIES`. For each entry, queries all facts and projects them.
3. New entries (`permission: 3`, `permission_scope: 2`, `risk_basis: 2`) cause those facts to appear. Existing `risk` entry corrected to arity 3 causes the third positional argument (severity) to appear in the projection — previously dropped silently.

**Revise path (clarified, no code change):**

The existing revise path allocates a new element id and runs the translator on the revised args, emitting the full updated baseFact set under the new id. With `relieves` and `basis` now translator-emitted, revise carries them. The new existence check runs identically on revise (the call-site condition includes REVISE in addition to ADD).

## Error Handling

**Missing required field on add.**
- PERMISSION without `relieves`: `verifyArgsShape({statement}, 'permission', port)` throws `{code: 'SHAPE_INVALID', field: 'relieves', message: ...}` from the existing presence-check loop. No new error path introduced.
- RISK without `basis`: `verifyArgsShape({statement}, 'risk', port)` throws `{code: 'SHAPE_INVALID', field: 'basis', message: ...}` from the existing presence-check loop.

**Empty `basis` array on add.** `verifyArgsShape({statement, basis: []}, 'risk', port)` throws `{code: 'SHAPE_INVALID', field: 'basis', message: ...}` from the new `nonEmptyArrayFields` loop. Same error code as missing-field; distinguishing requires reading the message. (Distinguishing via code is a future API question; not in scope.)

**Non-array `basis` on add.** `verifyArgsShape({statement, basis: 'evid_1'}, 'risk', port)` throws `{code: 'SHAPE_INVALID', field: 'basis', message: ...}` from the new `nonEmptyArrayFields` loop's `!Array.isArray` check.

**Dangling reference on add — PERMISSION.relieves points at a non-existent rule.** `verifyArgsShape({statement, relieves: 'rule_999'}, 'permission', port)` throws `{code: 'INVALID_REFERENCE', field: 'relieves', referencedId: 'rule_999', message: ...}` from the new `referenceFields` loop. The error object includes `referencedId` so the caller can identify which id failed.

**Dangling reference on add — RISK.basis array contains a non-existent id.** `verifyArgsShape({statement, basis: ['evid_1', 'missing_id']}, 'risk', port)` throws `{code: 'INVALID_REFERENCE', field: 'basis', referencedId: 'missing_id', message: ...}`. The error reports the *first* failing id in the array (iteration order). If multiple ids miss, only the first is reported.

**Existence check on RATIFY-shape call.** `runOperation` does not pass `ports.query` for RATIFY (only for ADD and REVISE). When the RATIFY-shape descriptor is used in `verifyArgsShape`, `readPort` is `null`, the `referenceFields` loop short-circuits, and the RATIFY path is unaffected — preserving bug-fix-01's RATIFY argShape closure.

**Engine assertion failure on new EDB predicates.** Boot-validators warn if the translator emits a predicate not in `EDB_PREDICATES`. The whitelist extension (AC-5.1) covers all three new predicates.

**Projection arity mismatch.** If `EDB_PREDICATES` is updated but `PROJECTION_ARITIES` is not, the new facts exist in the engine but vanish from the Datalog projection. AC-5.2 asserts the three new entries are present. AC-5.3 separately asserts the pre-existing `risk` arity correction.

**Boot-validator handling of new directives.** Per Components note on `boot-validators.js`: no change required. The descriptor-shape validator positively asserts only four specific fields and does not reject unknown properties on descriptors. The new directives flow through silently, matching the existing `closedEnumFields` and `nonEmptyStringFields` precedent.

## Testing Strategy

**Per dr-20260514-06 (cross-layer real-import convention):** All tests use real imports of the modules under test. No mocking of the engine, the bridge, the schema module, or the translator. The `concern-schema.test.js` / `proposition-schema.test.js` pattern (real Engine via `Engine.js` import, real bridge via `createDomainBridge`) is the precedent.

**Test categories and coverage targets:**

- **Schema descriptor shape** (in `permission-schema.test.js` and `risk-schema.test.js`): per-field assertions on `CATEGORY_REGISTRY[PERMISSION]` and `[RISK]` covering `requiredFields` exact-order, `optionalFields` membership, new directive membership (`referenceFields`, `nonEmptyArrayFields`).
- **verifyArgsShape directive behavior** (in `schema.test.js`): mechanism tests with stub descriptors for `nonEmptyArrayFields` (empty, non-array, missing) and `referenceFields` (existence-check call, miss → throw, hit → pass).
- **Translator emission** (in the new per-category test files and `translation.test.js`): given valid args, PERMISSION translator produces the three baseFacts (`permission_decl/2`, `permission/3`, conditional `permission_scope/2`); RISK translator produces `risk/3` + per-element `risk_basis/2` spread.
- **EDB whitelist + projection** (in `translation.test.js` and `render.test.js`): `EDB_PREDICATES` contains the three new names; `PROJECTION_ARITIES` contains the three new entries at correct arities; `risk` arity corrected to 3.
- **Existence-check end-to-end** (in the per-category test files and `bridge-integration.test.js`): submit a PERMISSION with `relieves: 'rule_does_not_exist'` → expect `INVALID_REFERENCE` throw with `field: 'relieves'` and `referencedId: 'rule_does_not_exist'`. Submit a RISK with `basis: ['evid_1', 'missing']` after asserting `evid_1` exists → expect `INVALID_REFERENCE` with `field: 'basis'` and `referencedId: 'missing'`.
- **Render block** (in `render.test.js` and the per-category test files): fixture assertions on the rendered Markdown output containing the `Relieves:`, optional `Scope:`, and `Basis:` sub-lines.
- **Boot-validator allow-list** (in `boot-validators.test.js` or equivalent): registry boot validation passes when descriptors declare `referenceFields` and `nonEmptyArrayFields`.
- **Probe regression** (extension to `cascade-spec-probe-simulation.mjs`): probe re-run shows H-2 and H-3 attempts produce facts that the new assertions detect.

## Acceptance Criteria

Every AC follows Given/When/Then. Observable boundaries are stated in the boundary line.

---

### AC-1.1 — PERMISSION requiredFields contains `relieves` in cascade order

**Observable boundary:** `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PERMISSION].requiredFields` array contents.

**Given** the domain layer is loaded.
**When** the PERMISSION descriptor is read.
**Then** `requiredFields` equals `['statement', 'relieves']` in that exact order.

**Implementing tasks:** _(populated by plan-build)_
**Decisions:** _(populated by execute-write)_

---

### AC-1.2 — PERMISSION optionalFields contains `scope_constraint`

**Observable boundary:** `CATEGORY_REGISTRY[PERMISSION].optionalFields` array contents.

**Given** the domain layer is loaded.
**When** the PERMISSION descriptor is read.
**Then** `optionalFields` contains `'rationale'` AND `'scope_constraint'` (order not specified, membership only).

---

### AC-1.3 — PERMISSION referenceFields directive present

**Observable boundary:** `CATEGORY_REGISTRY[PERMISSION].referenceFields` object contents.

**Given** the domain layer is loaded.
**When** the PERMISSION descriptor is read.
**Then** `referenceFields` equals `{ relieves: 'rule' }`.

---

### AC-2.1 — PERMISSION translator emits `permission/3` always

**Observable boundary:** baseFacts return of `TRANSLATORS[PERMISSION](validArgs, id, ts)`.

**Given** valid PERMISSION args `{statement: 'S', relieves: 'rule_1'}` and id `'perm_1'`, ts `1700000000`.
**When** the translator runs.
**Then** the returned `baseFacts` contains `['permission', ['perm_1', 'S', 'rule_1']]` exactly once. (It also contains `['permission_decl', ['perm_1', 'S']]` per AC-2.3, but that is asserted separately.)

---

### AC-2.2 — PERMISSION translator emits `permission_scope/2` conditionally

**Observable boundary:** baseFacts return of `TRANSLATORS[PERMISSION](args, id, ts)`.

**Given** args with `scope_constraint: 'top-level only'`.
**When** the translator runs.
**Then** `baseFacts` contains `['permission_scope', [id, 'top-level only']]` exactly once.

**Given** args without `scope_constraint` (key absent).
**When** the translator runs.
**Then** `baseFacts` contains zero entries with predicate name `'permission_scope'`.

---

### AC-2.3 — PERMISSION translator preserves `permission_decl/2`

**Observable boundary:** baseFacts return of `TRANSLATORS[PERMISSION](validArgs, id, ts)`.

**Given** valid PERMISSION args.
**When** the translator runs.
**Then** `baseFacts` contains `['permission_decl', [id, args.statement]]` exactly once. (This preserves the probe-table compatibility surfaced during competing-architecture review.)

---

### AC-3.1 — RISK requiredFields contains `basis` in cascade order

**Observable boundary:** `CATEGORY_REGISTRY[RISK].requiredFields` array contents.

**Given** the domain layer is loaded.
**When** the RISK descriptor is read.
**Then** `requiredFields` equals `['statement', 'basis']` in that exact order.

---

### AC-3.2 — RISK optionalFields retains `severity`

**Observable boundary:** `CATEGORY_REGISTRY[RISK].optionalFields` array contents.

**Given** the domain layer is loaded.
**When** the RISK descriptor is read.
**Then** `optionalFields` contains `'severity'` (D2: cascade does not forbid optionals beyond what it lists; severity is retained for backward compatibility with existing simulations).

---

### AC-3.3 — RISK nonEmptyArrayFields directive present

**Observable boundary:** `CATEGORY_REGISTRY[RISK].nonEmptyArrayFields` array contents.

**Given** the domain layer is loaded.
**When** the RISK descriptor is read.
**Then** `nonEmptyArrayFields` equals `['basis']`.

---

### AC-3.4 — RISK referenceFields directive present with wildcard

**Observable boundary:** `CATEGORY_REGISTRY[RISK].referenceFields` object contents.

**Given** the domain layer is loaded.
**When** the RISK descriptor is read.
**Then** `referenceFields` equals `{ basis: '*' }`. The `'*'` constraint signals any-category match.

---

### AC-4.1 — RISK translator spreads `basis` into `risk_basis/2` facts

**Observable boundary:** baseFacts return of `TRANSLATORS[RISK](args, id, ts)`.

**Given** valid RISK args `{statement: 'S', basis: ['evid_1', 'prop_2']}`, id `'risk_1'`.
**When** the translator runs.
**Then** `baseFacts` contains exactly two `risk_basis` entries: `['risk_basis', ['risk_1', 'evid_1']]` and `['risk_basis', ['risk_1', 'prop_2']]`. Order does not matter.

**Given** args with `basis: ['only_one']`.
**When** the translator runs.
**Then** `baseFacts` contains exactly one `['risk_basis', [id, 'only_one']]` entry.

---

### AC-5.1 — EDB_PREDICATES contains new predicates

**Observable boundary:** `EDB_PREDICATES` set (or array) in `translation.js`.

**Given** the domain layer is loaded.
**When** `EDB_PREDICATES` is enumerated.
**Then** it contains `'permission'`, `'permission_scope'`, `'risk_basis'` (in addition to the pre-existing `'permission_decl'`, `'risk'`, and others).

---

### AC-5.2 — PROJECTION_ARITIES contains new entries at correct arities

**Observable boundary:** `PROJECTION_ARITIES` table in `render.js`.

**Given** the domain layer is loaded.
**When** `PROJECTION_ARITIES` is enumerated.
**Then** it contains entries `permission: 3`, `permission_scope: 2`, `risk_basis: 2` (in addition to pre-existing entries).

---

### AC-5.3 — Pre-existing `risk` arity corrected from 2 to 3 in PROJECTION_ARITIES

**Observable boundary:** `PROJECTION_ARITIES.risk` value.

**Given** the domain layer is loaded.
**When** `PROJECTION_ARITIES.risk` is read.
**Then** the value is `3` (matching the RISK translator's three-argument `risk` emission). At spec-writing time the value is `2`, which is a pre-existing mismatch this sprint corrects.

---

### AC-5.5 — Pre-existing `risk` arity corrected from 2 to 3 in _ARITIES

**Observable boundary:** `_ARITIES.risk` value and `renderElementDeep` behavior on a RISK id.

**Given** a proof with at least one RISK element asserted (translator emits `risk(id, statement, severity)` at arity 3).
**When** `renderElementDeep({id: 'risk_N'})` is called.
**Then** the call returns a record with `predicate: 'risk'` and `withdrawn` set appropriately (not null). The `_ARITIES.risk` value is `3`. At spec-writing time `_ARITIES.risk: 2` causes the call to return null because the Engine matches by exact arity (Unifier returns null when pattern.length !== fact.length). Surfaced by adversarial spec review; corrected here in parallel with AC-5.3.

---

### AC-5.4 — validPredicates picks up new EDB predicates via getDeclaredEDBPredicates

**Observable boundary:** `domain-bridge.js`'s `validPredicates` set after construction.

**Given** the bridge is constructed via `createDomainBridge(...)`.
**When** the internal `validPredicates` set is inspected (via a test that exercises `queryProof` on the new predicates).
**Then** `queryProof({pattern: ['permission', [...]]})`, `queryProof({pattern: ['permission_scope', [...]]})`, and `queryProof({pattern: ['risk_basis', [...]]})` all execute without throwing "unknown predicate" errors. The auto-flow via `getDeclaredEDBPredicates()` covers the new whitelist entries without source edit to `domain-bridge.js`.

---

### AC-6.1 — INVALID_REFERENCE thrown for PERMISSION with non-existent relieves

**Observable boundary:** error thrown by `bridge.addElement` on PERMISSION submission.

**Given** a fresh bridge with no RULE elements asserted.
**When** the caller invokes `bridge.addElement({idShape: 'permission', statement: 'S', relieves: 'rule_does_not_exist'}, designerConsent)`.
**Then** the call throws with `{code: 'INVALID_REFERENCE', field: 'relieves', referencedId: 'rule_does_not_exist'}`. The error includes a `message` property.

---

### AC-6.2 — INVALID_REFERENCE thrown for RISK with non-existent basis id

**Observable boundary:** error thrown by `bridge.addElement` on RISK submission.

**Given** a bridge with `evid_1` asserted (a valid existing element) and no element with id `'missing_id'`.
**When** the caller invokes `bridge.addElement({idShape: 'risk', statement: 'S', basis: ['evid_1', 'missing_id']}, designerConsent)`.
**Then** the call throws with `{code: 'INVALID_REFERENCE', field: 'basis', referencedId: 'missing_id'}`.

---

### AC-6.3 — SHAPE_INVALID thrown for RISK with empty basis array

**Observable boundary:** error thrown by `bridge.addElement` on RISK submission.

**Given** a fresh bridge.
**When** the caller invokes `bridge.addElement({idShape: 'risk', statement: 'S', basis: []}, designerConsent)`.
**Then** the call throws with `{code: 'SHAPE_INVALID', field: 'basis'}` from the new `nonEmptyArrayFields` loop.

---

### AC-6.4 — INVALID_REFERENCE error shape

**Observable boundary:** error object structure.

**Given** any AC-6.1 or AC-6.2 throw.
**When** the caught error is inspected.
**Then** it has at least these properties: `code` (string, value `'INVALID_REFERENCE'`), `field` (string, value matches the field name that failed), `referencedId` (string, value matches the first failing id), and `message` (string, human-readable). Additional properties (e.g., `stack`) are not asserted against.

---

### AC-7.1 — Render emits `Relieves: <rule-id>` sub-line per permission

**Observable boundary:** string output of `renderStructuredProof`.

**Given** a proof with a valid PERMISSION asserted (relieves: `rule_5`).
**When** `renderStructuredProof({})` is called.
**Then** the output contains a sub-line matching the pattern `Relieves: rule_5` under the permission's primary line.

---

### AC-7.2 — Render emits `Scope: <text>` sub-line conditionally per permission

**Observable boundary:** string output of `renderStructuredProof`.

**Given** a PERMISSION asserted with `scope_constraint: 'top-level only'`.
**When** `renderStructuredProof({})` is called.
**Then** the output contains a sub-line matching `Scope: top-level only` under the permission.

**Given** a PERMISSION asserted without `scope_constraint`.
**When** `renderStructuredProof({})` is called.
**Then** the output contains zero `Scope:` sub-lines for that permission.

---

### AC-7.3 — Render emits `Basis: <id-1>, <id-2>, ...` sub-line per risk

**Observable boundary:** string output of `renderStructuredProof`.

**Given** a RISK asserted with `basis: ['evid_1', 'prop_2']`.
**When** `renderStructuredProof({})` is called.
**Then** the output contains a sub-line starting with `Basis: ` followed by both `evid_1` and `prop_2` separated by `, ` in either order, under the risk's primary line. Test assertions use set-equality on the comma-split id list rather than full-string equality, to avoid flakiness from EDB query order.

---

### AC-8.1 — Probe regression: linkage facts present after submission

**Observable boundary:** failure count of `cascade-spec-probe-simulation.mjs`.

**Given** the probe at `docs/chester/working/stress-tests/20260517-01/cascade-spec-probe-simulation.mjs` extended with assertions: after the PERMISSION submission with `relieves: rule_1`, `queryProof({pattern: ['permission', [{ var: 'P' }, { var: 'S' }, { var: 'R' }]]})` returns at least one row with the expected `relieves` id. After the RISK submission with `basis: [evid_1, evid_2]`, `queryProof({pattern: ['risk_basis', [{ var: 'R' }, { var: 'E' }]]})` returns exactly two rows.
**When** the probe is run after this sprint's implementation lands.
**Then** the new assertions pass. The probe's overall failure count is reduced by the corresponding number of H-2 / H-3 attempts.

---

### AC-9.1 — Scope discipline: file boundaries

**Observable boundary:** `git diff --name-only main...HEAD`.

**Given** the sub-sprint branch with all changes committed.
**When** `git diff --name-only main...HEAD` is run.
**Then** every file path listed is either under `skills/design-proof-system/references/domain/` or `docs/chester/working/stress-tests/20260517-01/`. No other file paths appear.

---

### AC-9.2 — Boot validation passes with new descriptor directives

**Observable boundary:** `validateCategoryRegistry(CATEGORY_REGISTRY, tags)` behavior in `boot-validators.js`.

**Given** the PERMISSION descriptor declares `referenceFields: { relieves: 'rule' }` and the RISK descriptor declares `referenceFields: { basis: '*' }` and `nonEmptyArrayFields: ['basis']`.
**When** `validateCategoryRegistry` runs at session boot.
**Then** the validator passes without throwing. Ground-truth verification confirmed the validator does not reject unknown properties on descriptors — the new directives are silently accepted, matching the existing `closedEnumFields` and `nonEmptyStringFields` precedent. No source edit to `boot-validators.js` is required; this AC verifies the no-edit assumption holds.

---

## Constraints

- _(structural)_ Cascade `05-domain-spec.md` §3.3 and §3.5 are normative. Implementation predicate signatures, required fields, and validation rules must match cascade text. Variant signatures are not allowed.
- _(structural)_ Cross-cutting whitelist coupling (`EDB_PREDICATES` / `PROJECTION_ARITIES` / `validPredicates`) must be kept in sync per the convention noted in sprint-02-bug-fix-01. Plan-build's plan-attack reviewer should verify the whitelist edits land atomically.
- _(structural)_ `_CATEGORY_PROBES` in `mutations.js` is not modified. The translator's preservation of `permission_decl/2` keeps the existing RATIFY-on-PERMISSION path working.
- _(structural)_ Sprint-02-proof-layer Key Decision 1 ("schema/translation SRP split; validators are data-driven") is honored. All new validation logic is declarative — directives on descriptors consumed by `verifyArgsShape`.
- _(normative — source: cascade §3.3 final paragraph)_ Domain validates `relieves` references an existing Rule before assertion.
- _(normative — source: design-proof-system boundary in CLAUDE.md)_ This sprint touches only `skills/design-proof-system/`. No artifact references `skills/design-large-task/proof-mcp/` or any other system.
- _(structural)_ `cascade-spec-probe-simulation.mjs` is the regression backstop. Its H-2 / H-3 failure count must reach zero by `execute-verify-complete`.

## Non-Goals

- This spec does not introduce `unknownFieldPolicy: 'reject'` to `verifyArgsShape`. Deferred to the planned ADR sprint per design D5.
- This spec does not modify any other element-category descriptor (EVIDENCE, RULE, PROPOSITION, RESOLUTION, FRICTION, CONCERN, DEFINITION).
- This spec does not address H-1 (PROPOSITION grounding array engine crash), H-4 (EVIDENCE source-authority inversion), or any MEDIUM / LOW finding from `cascade-spec-probe-findings.md`. Those are sequenced to subsequent sub-sprints per master plan.
- This spec does not change the `severity` semantics on RISK. The field remains optional and untouched per D2.
- This spec does not change the `INVALID_SOURCE` mechanism (which is mentioned in cascade §3.1 but unimplemented). EVIDENCE source-authority is the H-4 sub-sprint's domain.

## Out of Scope

- _(deferred)_ `unknownFieldPolicy: 'reject'` cross-cutting directive — planned for ADR sprint. Rationale: framework-wide rule needs ADR-level ratification before code change.
- _(deferred)_ Element-category authority changes (e.g., correcting EVIDENCE's inverted source constraint) — planned for sprint-02-bug-fix-04. Rationale: H-4 closure depends on the ADR sprint's vocabulary decision.
- _(deferred)_ RESOLUTION structural split (`problem_anchor` + `grounding[]`) and FRICTION anchor fields — planned for sprint-02-bug-fix-05. Rationale: category-arity changes have higher blast radius; bundled separately.
- _(deferred)_ Field-name renames (EVIDENCE `claim → statement`, DEFINITION `term → canonical_name`, etc.) — planned for sprint-02-bug-fix-06. Rationale: do renames after vocabulary is settled to avoid redo.
- _(out)_ Removal of impl-only optional fields (RISK.severity, PERMISSION rationale) — out of scope per D2. Rationale: cascade-strict alignment is a vocabulary-alignment sprint concern, not a silent-drop-closure concern.

## Decisions

_(populated by execute-write as implementer decisions land)_

---

<!-- produced-by design-specify@v0003 -->
