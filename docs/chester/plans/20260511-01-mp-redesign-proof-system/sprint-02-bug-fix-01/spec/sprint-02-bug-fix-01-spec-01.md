# Spec: Restore reasoning_chain, rejected_alternatives, and collapse_test render to PROPOSITION pipeline

**Sprint:** sprint-02-bug-fix-01 (under master plan `20260511-01-mp-redesign-proof-system`)
**Parent brief:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-01/design/sprint-02-bug-fix-01-design-00.md`
**Architecture:** Hybrid Recommendation from competing-architecture review. Architect A's declarative-schema spine with one tightening (`nonEmptyStringFields` declarative directive in `verifyArgsShape` for content validation) and two Explorer-flagged cross-cutting hazards addressed (`PROJECTION_ARITIES`/`EDB_PREDICATES` atomic-update discipline; ratify-path latent `SHAPE_INVALID` exposure). Render scope expanded beyond the brief to include the `collapse_test` line ADR-0006 specifies, on the rationale that it is the same `render.js` touch as the two named fields and leaving it unfixed reproduces the same class of cascade-vs-implementation gap this sub-sprint is repairing. The Explorer's "duplicate `validPredicates` lists in `domain-bridge.js`" hazard was investigated during adversarial spec review and found to require no spec action — both `validPredicates` sites (lines 47-50 and 196-197 at spec-writing time) hardcode Phase-A *rule-head* predicates only; new EDB predicates flow in automatically via `getDeclaredEDBPredicates()` once `EDB_PREDICATES` is updated.

## Goal

The domain layer's PROPOSITION schema diverges from cascade `05-domain-spec.md` §3.4. The schema currently declares `requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern']` and `optionalFields: ['scope']` — missing the cascade-required `reasoning_chain` and the cascade-encouraged-optional `rejected_alternatives`. The translator emits neither `reasoning_chain/2` nor `rejected_alternative/3` baseFacts. The EDB whitelist excludes both predicates. The structured-proof render surfaces only the proposition's statement, omitting the `collapse_test`, `reasoning_chain`, and `rejected_alternatives` lines ADR-0006 specifies. One cross-cutting infrastructure hazard compounds the gap: `render.js`'s `PROJECTION_ARITIES` table is a second EDB whitelist that silently drops predicates from the Datalog projection if not updated alongside `EDB_PREDICATES`. (A separate concern about duplicate `validPredicates` lists in `domain-bridge.js` was investigated and dismissed — those lists hardcode rule-head predicates only; new EDB predicates flow in automatically via `getDeclaredEDBPredicates()` once `EDB_PREDICATES` is updated.) This spec closes the schema/translator/whitelist/render gaps end-to-end, tightens `verifyArgsShape` with a declarative `nonEmptyStringFields` directive so empty strings on `reasoning_chain` are rejected at the schema layer (without introducing PROPOSITION-specific validator code), and verifies the ratify path's exposure to required-field count growth surfaced as a latent issue in the prior CONCERN sub-sprint.

## Components

**Note on line citations:** All `line N` references in this Components section reflect the codebase at spec-writing time. Lines will drift between spec writing and implementation. Plan-build and execute-write must re-locate references by content (grep for the named identifier or string), not by the cited line number.

**Modified files:**

- `skills/design-proof-system/references/domain/schema.js`
  - `CATEGORY_REGISTRY[PROPOSITION].requiredFields` extended from `['statement', 'grounding', 'collapse_test', 'inference_pattern']` to `['statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain']`. Cascade enumeration order is statement → grounding → collapse_test → reasoning_chain; `inference_pattern` retains its current position before `reasoning_chain` to minimize diff to existing required-field consumers.
  - `CATEGORY_REGISTRY[PROPOSITION].optionalFields` extended from `['scope']` to `['scope', 'rejected_alternatives']`.
  - `CATEGORY_REGISTRY[PROPOSITION]` gains a new descriptor field `nonEmptyStringFields: ['reasoning_chain']`. This is a new declarative directive — see `verifyArgsShape` change below.
  - `verifyArgsShape` extended to consume the new `nonEmptyStringFields` descriptor entry. For each field name listed: after the existing presence check passes, if the value is not a string OR is a string whose `.trim().length === 0`, throw `Error` with `{code: 'SHAPE_INVALID', field}`. Behavior change scope: declarative — adding the directive to other category descriptors in a future sub-sprint enforces the same check there without further code changes.

- `skills/design-proof-system/references/domain/translation.js`
  - PROPOSITION translator (currently lines 28-36) extended with two new baseFact emissions:
    - `['reasoning_chain', [id, args.reasoning_chain]]` — emitted unconditionally (the field is required and non-empty post-verify).
    - Conditional spread: `...(Array.isArray(args.rejected_alternatives) ? args.rejected_alternatives.map(alt => ['rejected_alternative', [id, alt.statement, alt.rejection_reason]]) : [])`. When the field is absent or an empty array, zero `rejected_alternative` facts are emitted. The spread idiom matches the RESOLUTION translator at lines 42-49.
  - `EDB_PREDICATES` (currently lines 180-188) extended with two predicate names: `'reasoning_chain'` and `'rejected_alternative'`.

- `skills/design-proof-system/references/domain/render.js`
  - `renderStructuredProof` proposition rendering (currently a single-line `${b.I}: ${b.S}` per proposition at lines 27-31) extended to emit a three-line block per proposition matching ADR-0006:
    - Existing `{prop.statement}` line (preserved as the block header).
    - `Collapse test: {text}` line — queries `collapse_test(propId, T)` against the EDB. Emitted whenever the fact exists. Currently the fact already exists in the EDB (translator emits it) but is not rendered.
    - `Reasoning: {text}` line — queries `reasoning_chain(propId, T)`. Emitted whenever the fact exists.
    - `Rejected alternatives:` block followed by one bullet per alternative — queries `rejected_alternative(propId, S, R)`. Emitted only when at least one alternative exists. Zero-alternative propositions omit the block entirely (no empty section).
  - `PROJECTION_ARITIES` table (currently lines 131-139) extended with `reasoning_chain: 2` and `rejected_alternative: 3`. Updated atomically with `EDB_PREDICATES` to prevent silent omission from the Datalog projection.
  - The `_ARITIES` table (currently lines 37-46), used by `renderElementDeep`, is intentionally **not** extended. `renderElementDeep` dispatches on each element's primary declaration predicate (e.g., `proposition_decl/3`), not its meta-facts; surfacing meta-facts is the structured-proof render's job (handled above). If a future caller needs deep-render to include meta-facts per element, that is a separate scope question.

- `skills/design-proof-system/references/domain/__tests__/schema.test.js`
  - Fixture repair: existing PROPOSITION constructions that supply only the prior four required fields get `reasoning_chain: 'IF X THEN Y'` (or a similarly non-empty IF/THEN string) added to their args. The Explorer report and Architect A both identified `schema.test.js:28-35` as one such fixture.
  - New assertions per Acceptance Criteria below.

- `skills/design-proof-system/references/domain/__tests__/translation.test.js`
  - Fixture repair as above; the Explorer named `translation.test.js:13-20` as the affected site.
  - New assertions per Acceptance Criteria below.

- `skills/design-proof-system/references/domain/__tests__/bridge-integration.test.js` (comment-only update, plus any other test files containing four-field PROPOSITION fixtures discovered by grep)
  - This file does not construct PROPOSITION fixtures — line 103 is a documentation comment listing PROPOSITION's required fields as a reference for the eight-verb sweep. Update the comment to reflect the new five-field requirement so it doesn't drift out of sync. No object-literal fixture repair is needed in this file.

- `skills/design-proof-system/references/domain/__tests__/render.test.js`
  - New assertions per Acceptance Criteria below covering the three-line render block.

**New files:**

- `skills/design-proof-system/references/domain/__tests__/proposition-schema.test.js`
  - Follows the precedent set by `concern-schema.test.js` from sprint-02-proof-layer-pass-2: dedicated per-category test file with layered `describe` blocks (schema, translation, bridge facade, lifecycle integration). Uses real imports per dr-20260514-06. The file is created so that PROPOSITION-specific coverage of the new fields lives in one place rather than being scattered across the existing per-module test files. Existing per-module assertions in `schema.test.js`, `translation.test.js`, etc., are extended only with the minimum needed to keep their internal narratives coherent; the dedicated PROPOSITION-focused tests live in the new file.

**Unchanged surfaces (explicitly):**

- `skills/design-proof-system/references/domain/mutations.js` — no change. The existing `runOperation('revise', ...)` path creates a new element id with a `superseded/2` link (verified at `mutations.js:69-89` per Explorer report). The new per-alternative facts and the `reasoning_chain` fact flow through the unchanged revise path because the translator is called with the full revised args, producing the full updated baseFact set under the new id. No retract-and-reassert logic is added; the existing supersession model already delivers the equivalent semantics.
- `skills/design-proof-system/references/domain/authority.js`, `lifecycle.js`, `closure-policy.js`, `friction-policy.js`, `counterfactual.js`, `restructuring.js`, `engine-port-adapter.js` — no change.
- All other element-category descriptors in `CATEGORY_REGISTRY` — no change. Only PROPOSITION is touched.
- All engine-layer files — no change.

## Data Flow

**Add path (new fields exercised end-to-end):**

1. Caller invokes `domain-bridge.runOperation('add', { idShape: 'proposition', statement, grounding, collapse_test, inference_pattern, reasoning_chain, rejected_alternatives: [...] }, consent)`.
2. `runOperation` calls `verifyArgsShape(args, 'proposition')`. The presence check passes for all five required fields. The new `nonEmptyStringFields: ['reasoning_chain']` directive runs the trim-length check on `reasoning_chain`; if empty or whitespace-only, throws `SHAPE_INVALID`.
3. Authority check, id allocation (`prop_N`), and clock tick proceed via the unchanged generic add path.
4. `ELEMENT_TRANSLATORS[PROPOSITION](args, id, ts)` returns `{baseFacts, rules, metaFacts}`. `baseFacts` now includes: `proposition_decl/3`, `grounding/2`, `collapse_test/2`, `reasoning_chain/2` (one fact), and `rejected_alternative/3` (zero or more facts, one per alternative).
5. Each baseFact is asserted into the engine via the existing translation pipeline.
6. Boot-validators previously verified every emitted predicate name appears in `EDB_PREDICATES`; the whitelist extension means the new emissions pass that check.

**Render path (all three lines surfaced):**

1. Caller invokes `renderStructuredProof(readPorts)`.
2. Function queries derived `proposition(I, S)` (approval-gated) — unchanged.
3. For each proposition binding, three new queries run against the EDB:
   - `collapse_test(I, T)` — at most one row per proposition.
   - `reasoning_chain(I, T)` — at most one row per proposition (required field, so exactly one when proposition exists).
   - `rejected_alternative(I, S, R)` — zero or more rows per proposition.
4. Output Markdown emits the proposition statement, then a `Collapse test:` line, then a `Reasoning:` line, then (if non-empty) a `Rejected alternatives:` block with one bullet per alternative.

**Revise path (clarified, no code change):**

1. Caller invokes `runOperation('revise', { idShape: 'proposition', supersedes, statement, grounding, collapse_test, inference_pattern, reasoning_chain, rejected_alternatives: [...] }, consent)`.
2. The existing revise path allocates a new `prop_N` id, runs the PROPOSITION translator with the revised args, and emits the full updated baseFact set (including the new `reasoning_chain/2` and all `rejected_alternative/3` facts) under the new id.
3. A `superseded(new_id, old_id)` metaFact links the new element to the prior id. The prior element's baseFacts (including its old `reasoning_chain/2` and `rejected_alternative/3` facts) remain in the engine under the prior id.
4. Downstream queries that filter to active (non-superseded, approved) elements see only the new element's facts. Queries that span the supersession chain see both.

**Datalog projection path:**

1. Caller invokes `renderDatalogProjection(readPorts)`.
2. Function iterates `PROJECTION_ARITIES`. For each `(predicate, arity)` pair, queries all facts of that predicate and emits them in the projection format.
3. The two new entries (`reasoning_chain: 2`, `rejected_alternative: 3`) cause those facts to appear in the projection, ensuring second-engine replay can reconstruct the full PROPOSITION state.

## Error Handling

**Missing required field on add.** `verifyArgsShape({statement, grounding, collapse_test, inference_pattern}, 'proposition')` (no `reasoning_chain` key) throws `Error` with `{code: 'SHAPE_INVALID', field: 'reasoning_chain'}`. This rides the existing presence-check loop; no new error path is introduced.

**Empty-string `reasoning_chain`.** `verifyArgsShape({...validArgs, reasoning_chain: ''}, 'proposition')` throws `Error` with `{code: 'SHAPE_INVALID', field: 'reasoning_chain'}`. Same for `'   '` (whitespace-only). The new `nonEmptyStringFields` declarative directive routes through `verifyArgsShape`'s existing throw shape — no new error code is introduced.

**Non-string `reasoning_chain`.** `verifyArgsShape({...validArgs, reasoning_chain: 42}, 'proposition')` throws `Error` with `{code: 'SHAPE_INVALID', field: 'reasoning_chain'}`. The trim-length check is preceded by a `typeof === 'string'` check; non-string values fail before the trim runs.

**Malformed `rejected_alternatives` entry.** `verifyArgsShape({...validArgs, rejected_alternatives: [{statement: 'A'}]}, 'proposition')` (entry missing `rejection_reason`) does **not** throw at the schema layer — the shape of objects inside the optional array is intentionally not validated here, per the architecture choice (declarative schema; deep-shape validation deferred). The translator's `.map(alt => [..., [id, alt.statement, alt.rejection_reason]])` emits the fact with `undefined` for the missing field. This is an accepted trade-off; the design brief's Open Question 2 was scoped to `reasoning_chain` only.

**Ratify-path required-field exposure.** Per the Explorer report (confirmed by ground-truth review), `verifyArgsShape` is called from the ratify path with `{elementId, idShape}` args — which lack the category's `requiredFields`. The throw fires on the *first* missing required field, so the exposure is binary (throws / doesn't), not graduated by field count. The latent CONCERN-side instance of this bug is already documented in `concern-schema.test.js:266-279` ("AC-3.1 surface coverage: ratifyConcern is exported (latent SHAPE_INVALID — see Known Issues)"). AC-6.1 below verifies that `ratifyElement({elementId, idShape: 'proposition'}, consent)` does not throw `SHAPE_INVALID`. If it does (and it likely does today, regardless of whether `reasoning_chain` is added), the fix is to short-circuit `verifyArgsShape`'s `requiredFields` loop when the call is a ratify-shape call rather than an add/revise-shape call. The mechanism (skip `requiredFields` for ratify-shape args, or split into separate descriptor shapes) is left to the implementer to choose during plan-build; this spec asserts only the observable behavior (no throw). **Cross-impact note:** any fix to the ratify-path mechanism will affect CONCERN, DEFINITION, and RESOLUTION simultaneously. If the fix lands, the `concern-schema.test.js:266-279` assertion that expects `SHAPE_INVALID` on `ratifyConcern` will start failing and must be inverted (or the test moved/removed). Plan-build should anticipate this concurrent cleanup.

**Engine assertion failure on new EDB predicates.** Boot-validators warn if the translator emits a predicate not in `EDB_PREDICATES`. The whitelist extension covers this. AC-3.2 verifies the assertion path runs without warning post-extension.

**Projection arity mismatch.** If `EDB_PREDICATES` is updated but `PROJECTION_ARITIES` is not, the new facts exist in the engine but vanish from the Datalog projection silently. AC-4.2 below asserts both new predicates appear in the projection output.

## Testing Strategy

**Per dr-20260514-06 (cross-layer real-import convention):** All tests use real imports of the modules under test. No mocking of the engine, the bridge, the schema module, or the translator. The `concern-schema.test.js` pattern (real Engine via `Engine.js` import, real bridge via `createDomainBridge`) is the precedent.

**Test categories and coverage targets:**

- **Schema descriptor shape** (in `proposition-schema.test.js`): per-field assertions on `CATEGORY_REGISTRY[PROPOSITION]` covering `requiredFields` exact-order, `optionalFields` membership, `nonEmptyStringFields` membership.
- **`verifyArgsShape` behavior** (in `proposition-schema.test.js`): valid add args pass; missing `reasoning_chain` throws; empty/whitespace `reasoning_chain` throws; non-string `reasoning_chain` throws; missing optional `rejected_alternatives` passes; malformed alternative objects pass at schema (deep-shape not validated); ratify-shape args do not throw.
- **`nonEmptyStringFields` mechanism** (in `schema.test.js`): a small descriptor-level test exercises the new directive against a stub category descriptor to confirm the loop runs the trim-length check. Keeps the mechanism's coverage independent of PROPOSITION-specific test data.
- **Translator output** (in `proposition-schema.test.js`): `reasoning_chain/2` baseFact emitted with correct id and text; zero/one/many `rejected_alternative/3` facts; empty array emits zero facts; absent field emits zero facts; arity exactness for both predicates.
- **EDB whitelist** (in `proposition-schema.test.js`): `getDeclaredEDBPredicates()` (or equivalent introspection of `EDB_PREDICATES`) contains both new names.
- **Bridge facade and `validPredicates`** (in `proposition-schema.test.js`): bridge round-trip `addElement` → `queryProof` returns the expected fact tuples for both new predicates; `validPredicates` at both `domain-bridge.js` sites contains both new names (introspected directly if exported, or asserted via the absence-of-validation-error path otherwise).
- **Revise path documentation test** (in `proposition-schema.test.js`): revise creates a new element id, the new id's facts contain the new `reasoning_chain` and `rejected_alternative` values, and the prior id's facts remain queryable. This is a documentation-style test — it asserts the existing behavior to prevent future drift.
- **Render output** (in `render.test.js`): `renderStructuredProof` output for a proposition with all three fields (collapse_test + reasoning_chain + ≥1 rejected_alternative) contains all three lines/blocks; a proposition with zero alternatives omits the `Rejected alternatives:` block; a proposition without a reasoning_chain (impossible after this spec, but tested as defensive coverage) omits the `Reasoning:` line gracefully.
- **Projection** (in `render.test.js`): `renderDatalogProjection` output contains both new predicate names with the correct arities; round-trip through a second engine reproduces the facts.
- **Fixture repair** (across `schema.test.js`, `translation.test.js`, `bridge-integration.test.js`, plus any other site found by grep): existing PROPOSITION fixtures get `reasoning_chain` added; existing tests retain their original assertion narratives (do not collapse repaired tests into the new file).

**Test count target:** the new `proposition-schema.test.js` file should add at least 18 tests (mirroring the granularity of `concern-schema.test.js`'s 24-test footprint, scaled to PROPOSITION's slightly smaller surface). Aggregate suite count grows by exactly the number of net new tests; fixture repairs do not change suite counts.

**Regression discipline:** all currently-passing domain tests and engine tests must remain passing post-spec. The plan must include a verify-clean checkpoint before the architectural change lands.

## Constraints

- **Cascade normativity.** `05-domain-spec.md` §3.4 and §3.4.1 are binding. Field names (`reasoning_chain`, `rejected_alternatives`), fact arities (`reasoning_chain/2`, `rejected_alternative/3`), per-alternative object shape (`{statement, rejection_reason}`), and required-vs-optional discrimination must match the cascade exactly. The spec adds `nonEmptyStringFields` as an implementation discipline that strengthens — does not contradict — the cascade's requirement that `reasoning_chain` carry "prose IF/THEN inference."
- **ADR-0006 normativity.** The render block format (Collapse test / Reasoning / Rejected alternatives) is a direct realization of ADR-0006's specified structured-prose form per `design-documents/ADR/0006-rendered-proof-format-as-structured-prose copy.md:65`.
- **No file modified outside `skills/design-proof-system/references/domain/` or its `__tests__/` subdirectory.** This includes `domain-bridge.js` (which lives inside that subtree).
- **No cascade document edits.** The spec conforms to the cascade; it does not amend it. No ADR is written by this sub-sprint.
- **No engine-layer changes.** The engine treats `reasoning_chain/2` and `rejected_alternative/3` as generic ground atoms.
- **No friction-policy or closure-policy changes.** Semantic gates over the new fields (substantiveness, genuineness of alternatives) belong to the future Adversary pass per ADR-0008; this sub-sprint provides the data shape only.
- **No other element-category schema changes.** Only PROPOSITION is touched. The broader cascade-vs-implementation field audit is deferred per the brief's Key Decision 3.
- **System boundary.** No reference to, search of, or work within systems outside this sub-sprint's scope. All citations and tests remain inside the design-proof-system.
- **Real-import test discipline** per dr-20260514-06.
- **Branch and worktree:** work happens on branch `sprint-02-bug-fix-01` in `.worktrees/sprint-02-bug-fix-01/`.

## Non-Goals

- Promoting `rejected_alternatives` to a typed `REJECTED_ALTERNATIVE` element category. The cascade glossary names this as a future direction; pursuing it here would change the scope from gap-repair to category-introduction and require its own ADR.
- Validating the deep shape of per-alternative objects in `rejected_alternatives` (presence of `statement` and `rejection_reason` keys, non-emptiness of each). The architectural choice keeps the schema declarative; deep-shape validation belongs to the future Adversary pass.
- Adding semantic gates over `reasoning_chain` content (IF/THEN pattern enforcement, length minimums beyond non-empty, etc.). Same deferral.
- Refactoring the `domain-bridge.js` duplicate `validPredicates` lists into a single source of truth. The duplication is a pre-existing smell with its own scope question; this sub-sprint preserves it and updates both sites atomically.
- Resolving the latent `ratify`-path `verifyArgsShape` exposure at the mechanism layer (e.g., introducing per-verb argument shapes). This sub-sprint verifies the observable behavior (AC-6.1) and, if necessary, applies a minimal targeted fix; a broader rework belongs to a separate sub-sprint.
- Cascade-vs-implementation field audit across the other eight element categories. PROPOSITION-only audit per the brief's Key Decision 3.
- Render format choices beyond what ADR-0006 specifies. The block uses ADR-0006's three labels verbatim; no heuristic for distinguishing substantive from formulaic content (that is the future Adversary's job).
- Changes to MCP tool wrappers, interface-layer adapters, or any presentation-layer files. Sprint-03's scope.

## Acceptance Criteria

### AC-1.1 — `requiredFields` includes `reasoning_chain` in cascade order

**Observable boundary:**
- `CATEGORY_REGISTRY[PROPOSITION].requiredFields` equals `['statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain']` (exact array, exact order).

**Given:** the post-spec `schema.js` module is imported.
**When:** the test reads `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].requiredFields`.
**Then:** the returned array is `['statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain']` — deep-equal, including order.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.2 — `optionalFields` includes `rejected_alternatives`

**Observable boundary:**
- `CATEGORY_REGISTRY[PROPOSITION].optionalFields` contains `'rejected_alternatives'`.
- `CATEGORY_REGISTRY[PROPOSITION].optionalFields` continues to contain `'scope'` (no regression).

**Given:** the post-spec `schema.js` module is imported.
**When:** the test reads `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].optionalFields`.
**Then:** the array contains both `'scope'` and `'rejected_alternatives'`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.3 — `nonEmptyStringFields` descriptor field present

**Observable boundary:**
- `CATEGORY_REGISTRY[PROPOSITION].nonEmptyStringFields` equals `['reasoning_chain']`.

**Given:** the post-spec `schema.js` module is imported.
**When:** the test reads `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].nonEmptyStringFields`.
**Then:** the array equals `['reasoning_chain']`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.1 — Valid args pass `verifyArgsShape`

**Observable boundary:**
- `verifyArgsShape(validArgs, 'proposition')` returns `validArgs` unchanged.

**Given:** `validArgs = { statement: 'S', grounding: ['evid_1'], collapse_test: 'T', inference_pattern: 'grounds-imply-conclusion', reasoning_chain: 'IF X THEN Y' }`.
**When:** the test calls `verifyArgsShape(validArgs, 'proposition')`.
**Then:** the call returns `validArgs` without throwing.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.2 — Missing `reasoning_chain` is rejected

**Observable boundary:**
- Calling `verifyArgsShape` with `reasoning_chain` absent throws `Error` with `code: 'SHAPE_INVALID'` and `field: 'reasoning_chain'`.

**Given:** `args = { statement: 'S', grounding: ['evid_1'], collapse_test: 'T', inference_pattern: 'grounds-imply-conclusion' }`.
**When:** the test calls `verifyArgsShape(args, 'proposition')`.
**Then:** the call throws an `Error` whose `.code === 'SHAPE_INVALID'` and `.field === 'reasoning_chain'`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.3 — Empty-string `reasoning_chain` is rejected

**Observable boundary:**
- Calling `verifyArgsShape` with `reasoning_chain: ''` throws `Error` with `code: 'SHAPE_INVALID'` and `field: 'reasoning_chain'`.
- Calling `verifyArgsShape` with `reasoning_chain: '   '` (whitespace-only) throws the same error.

**Given:** `args = { ...validArgs, reasoning_chain: '' }` (and a parallel case with `reasoning_chain: '   '`).
**When:** the test calls `verifyArgsShape(args, 'proposition')` for each case.
**Then:** both calls throw `Error` with `.code === 'SHAPE_INVALID'` and `.field === 'reasoning_chain'`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.4 — Non-string `reasoning_chain` is rejected

**Observable boundary:**
- Calling `verifyArgsShape` with `reasoning_chain: 42` throws `Error` with `code: 'SHAPE_INVALID'` and `field: 'reasoning_chain'`.

**Given:** `args = { ...validArgs, reasoning_chain: 42 }`.
**When:** the test calls `verifyArgsShape(args, 'proposition')`.
**Then:** the call throws `Error` with `.code === 'SHAPE_INVALID'` and `.field === 'reasoning_chain'`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.5 — Optional `rejected_alternatives` is accepted

**Observable boundary:**
- Calling `verifyArgsShape` with a valid `rejected_alternatives` array passes.
- Calling `verifyArgsShape` without `rejected_alternatives` passes.
- Calling `verifyArgsShape` with `rejected_alternatives: []` passes.

**Given:** three arg sets — with `[{statement: 'A1', rejection_reason: 'R1'}]`, without the key, and with `[]`.
**When:** `verifyArgsShape` is called on each.
**Then:** all three return the args without throwing.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.6 — `nonEmptyStringFields` directive applies generically

**Observable boundary:**
- `verifyArgsShape` consults the `nonEmptyStringFields` array on any descriptor it receives.
- For a stub category descriptor with `nonEmptyStringFields: ['foo']`, calling `verifyArgsShape({foo: ''}, stubDescriptor)` throws `SHAPE_INVALID` with `field: 'foo'`.

**Given:** a stub inline descriptor `{label: 'stub', requiredFields: ['foo'], nonEmptyStringFields: ['foo']}`.
**When:** the test calls `verifyArgsShape({foo: ''}, stubDescriptor)`.
**Then:** the call throws `Error` with `.code === 'SHAPE_INVALID'` and `.field === 'foo'`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.1 — Translator emits `reasoning_chain/2` baseFact

**Observable boundary:**
- `ELEMENT_TRANSLATORS[PROPOSITION](validArgs, 'prop_1', ts).baseFacts` contains a tuple deep-equal to `['reasoning_chain', ['prop_1', 'IF X THEN Y']]`.

**Given:** `validArgs.reasoning_chain === 'IF X THEN Y'`.
**When:** the translator is called with `id = 'prop_1'`.
**Then:** `.baseFacts.some(f => deepEqual(f, ['reasoning_chain', ['prop_1', 'IF X THEN Y']]))` is true.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.2 — Translator spreads `rejected_alternatives` correctly (zero, one, many)

**Observable boundary:**
- Zero alternatives (key absent): the returned `.baseFacts` contains no `rejected_alternative` facts; the translator does not throw.
- Empty array: same as above.
- One alternative: exactly one `rejected_alternative` fact in `.baseFacts` with the correct id, statement, and reason.
- Many alternatives (e.g., two): exactly two `rejected_alternative` facts in `.baseFacts`, one per array element, in array order.

**Given:** four args sets (no key, `[]`, one alternative, two alternatives).
**When:** the translator is called on each with `id = 'prop_1'`.
**Then:** the count and content of `rejected_alternative` facts in `.baseFacts` matches the table above.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.3 — EDB whitelist contains the new predicate names

**Observable boundary:**
- `EDB_PREDICATES` (or `getDeclaredEDBPredicates()` if used) contains `'reasoning_chain'` and `'rejected_alternative'`.

**Given:** the post-spec `translation.js` module is imported.
**When:** the test reads the EDB predicate set.
**Then:** both names are members.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.4 — Boot validation accepts the new emissions

**Observable boundary:**
- Constructing a bridge via `createDomainBridge(...)` does not throw `DomainBootError` from `validateOperationSpecs`, `validateRuleTemplates`, or any other boot-validator path after `EDB_PREDICATES` is extended.
- Asserting a PROPOSITION with `reasoning_chain` and a non-empty `rejected_alternatives` array completes without throwing any error related to unknown EDB predicates.

**Given:** a freshly constructed bridge built against the post-spec `translation.js` (with `EDB_PREDICATES` extended).
**When:** the test calls `createDomainBridge(...)` and then `addElement` for a full-shape PROPOSITION.
**Then:** the constructor returns without throwing; the `addElement` call returns successfully. The mechanism is verification by throw-absence — `validateOperationSpecs` throws (it does not warn) on unknown predicates, so the AC's observable is "no throw" rather than "no warning."

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.1 — `validPredicates` admits the new predicates via `getDeclaredEDBPredicates()`

**Observable boundary:**
- The `validPredicates` set constructed in `createDomainBridge` (and in its internal `createDomainBridgeWith` variant) contains `'reasoning_chain'` and `'rejected_alternative'` after the `EDB_PREDICATES` extension lands. No edits to the hardcoded rule-head lists in `domain-bridge.js` are made by this sub-sprint.

**Given:** the post-spec `translation.js` (with `EDB_PREDICATES` extended) and unchanged `domain-bridge.js`.
**When:** the test constructs a bridge and asserts that `getDeclaredEDBPredicates()` returns a Set containing both new names.
**Then:** both `'reasoning_chain'` and `'rejected_alternative'` are members; the bridge constructs without `validateOperationSpecs` errors.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.2 — `PROJECTION_ARITIES` contains the new predicates with correct arity

**Observable boundary:**
- `PROJECTION_ARITIES` (in `render.js`) contains `reasoning_chain: 2` and `rejected_alternative: 3`.
- A call to `renderDatalogProjection` after asserting both kinds of facts emits them in the projection output.

**Given:** the post-spec `render.js` is loaded; the engine has been seeded with one `reasoning_chain` fact and two `rejected_alternative` facts.
**When:** the test calls `renderDatalogProjection(readPorts)`.
**Then:** the output string contains both predicate names with the asserted argument values, formatted per existing projection conventions.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.1 — Bridge round-trip persists and reads back the new fields

**Observable boundary:**
- After `addElement` with the full PROPOSITION shape, querying the engine for `reasoning_chain/2` returns one row with the expected text; querying for `rejected_alternative/3` returns one row per alternative.

**Given:** a bridge constructed with the real Engine (per dr-20260514-06).
**When:** the test calls `addElement({idShape: 'proposition', ...validArgs, rejected_alternatives: [{statement: 'A1', rejection_reason: 'R1'}, {statement: 'A2', rejection_reason: 'R2'}]}, consent)` and then queries `reasoning_chain(propId, {var: 'T'})` and `rejected_alternative(propId, {var: 'S'}, {var: 'R'})`.
**Then:** the first query returns exactly one row with the asserted text; the second returns exactly two rows whose `S`/`R` bindings match the asserted alternatives.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.2 — Revise creates a new id; new facts emerge under it; old facts persist under prior id

**Observable boundary:**
- After `addElement` then `reviseElement` with modified `reasoning_chain` and a changed `rejected_alternatives` array:
  - A new prop id exists; querying its `reasoning_chain` and `rejected_alternative` facts returns the revised values.
  - The prior prop id still has its original facts queryable.
  - A `superseded(new_id, old_id)` fact links them.

**Given:** a bridge constructed with the real Engine.
**When:** the test adds a proposition `prop_1` with `reasoning_chain: 'OLD'` and one alternative, then revises to `reasoning_chain: 'NEW'` and a different alternative.
**Then:** the new id (e.g., `prop_2`) has facts containing 'NEW'; the prior id `prop_1` still has facts containing 'OLD'; a `superseded` fact links the two.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.1 — Ratify path does not throw `SHAPE_INVALID` on PROPOSITION

**Observable boundary:**
- `ratifyElement({elementId: 'prop_1', idShape: 'proposition'}, consent)` (where `prop_1` has been added and approved) does not throw `SHAPE_INVALID`.

**Given:** a bridge with a prior added-and-approved `prop_1` of full shape.
**When:** the test calls `ratifyElement({elementId: 'prop_1', idShape: 'proposition'}, consent)`.
**Then:** the call returns successfully; no `Error` with `.code === 'SHAPE_INVALID'` is thrown. If the call would otherwise throw (per the latent issue from the prior CONCERN sub-sprint), the implementer must apply the minimum fix to make this AC pass — either short-circuiting the `requiredFields` loop for ratify-shape args or splitting the descriptor's shape vocabulary into add/revise/ratify variants. The choice is left to plan-build / execute-write; this AC asserts only the observable.

**Execution discipline note for plan-build:** verify the *current* ratify-path behavior on PROPOSITION (with the pre-spec four-field `requiredFields`) before designing the fix. If the current behavior already passes (because of how `verifyArgsShape` handles ratify-shape args today), no mechanism change is needed and the AC is satisfied by a single defensive test. If the current behavior throws, the mechanism choice (short-circuit vs. split-vocabulary) belongs in the plan task that owns this AC.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.1 — `renderStructuredProof` surfaces all three ADR-0006 lines for a fully-populated proposition

**Observable boundary:**
- The render output for a proposition with `collapse_test`, `reasoning_chain`, and ≥1 `rejected_alternative` contains, in order: the statement (existing), a line starting with `Collapse test:`, a line starting with `Reasoning:`, and a section starting with `Rejected alternatives:` followed by one bullet per alternative.

**Given:** a bridge with one ratified proposition carrying `collapse_test: 'CT'`, `reasoning_chain: 'RC'`, and `rejected_alternatives: [{statement: 'A1', rejection_reason: 'R1'}]`.
**When:** the test calls `renderStructuredProof(readPorts)`.
**Then:** the output (a single string) contains `'Collapse test: CT'`, `'Reasoning: RC'`, and a bullet for `'A1 — R1'` (exact bullet formatting per implementer's choice; the assertion is on substring presence and ordering).

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.2 — `renderStructuredProof` omits the `Rejected alternatives:` block for zero-alternative propositions

**Observable boundary:**
- The render output for a proposition with `collapse_test` and `reasoning_chain` but zero `rejected_alternative` facts does not contain the substring `'Rejected alternatives:'`.

**Given:** a bridge with one ratified proposition carrying `collapse_test` and `reasoning_chain` but no rejected alternatives.
**When:** the test calls `renderStructuredProof(readPorts)`.
**Then:** the output does not contain `'Rejected alternatives:'`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.3 — Render is graceful when `reasoning_chain` fact is somehow absent

**Observable boundary:**
- If the engine somehow contains a `proposition/2` derived fact without a corresponding `reasoning_chain/2` fact (defensive case, not reachable through the add path post-spec), `renderStructuredProof` does not throw; it emits the available lines and omits the missing one.

**Given:** a bridge where a `proposition` fact has been derived but the test removes the `reasoning_chain` fact via `retractFact` before rendering.
**When:** the test calls `renderStructuredProof(readPorts)`.
**Then:** the call returns a string; the string does not contain a `Reasoning:` line for that proposition; no error is thrown.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-8.1 — Fixture repair: all four-field PROPOSITION constructions extended

**Observable boundary:**
- `grep -rn` for PROPOSITION argument-object literals across the test suite finds no remaining four-required-field constructions (those omitting `reasoning_chain`).
- All previously-passing tests still pass.

**Given:** the test suite post-fixture-repair.
**When:** the implementer runs `npm test` and `grep -rn "statement.*grounding.*collapse_test.*inference_pattern" skills/design-proof-system/references/domain/__tests__/`.
**Then:** the test suite is green; the grep finds no four-field PROPOSITION fixtures except as part of a five-field construction (where `reasoning_chain` follows on a subsequent line) OR as a documentation comment (e.g., `bridge-integration.test.js:103` carries such a comment that was updated to the five-field shape, not an object literal). The grep is a heuristic — multi-line object literals split across many lines may evade it. The authoritative check is the test suite passing; the grep is a complementary safety net.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-9.1 — No file modified outside `references/domain/` or its `__tests__/`

**Observable boundary:**
- `git diff --name-only` after the implementation commit lists only paths under `skills/design-proof-system/references/domain/` (including its `__tests__/` subdirectory) and `docs/chester/working/.../sprint-02-bug-fix-01/...` (artifact files).

**Given:** the implementation commit is staged and ready to commit.
**When:** the implementer (or a test) runs `git diff --name-only HEAD`.
**Then:** every listed path matches the pattern above; no engine file, no other domain category, no cascade document is touched.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-9.2 — All currently-passing tests still pass

**Observable boundary:**
- The domain test suite is fully green post-implementation. The engine test suite is fully green.
- The aggregate test count is `previous_count + new_count` where `new_count ≥ 18` (per Testing Strategy target) and no test is silently removed or skipped.

**Given:** the implementation is complete; tests have been written.
**When:** the implementer runs `npm test` (or the equivalent project-wide command).
**Then:** zero failures, zero unexpected skips, count delta matches expectation.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-17T01:26:49Z -->
<!-- produced-by design-specify@v0003 -->
