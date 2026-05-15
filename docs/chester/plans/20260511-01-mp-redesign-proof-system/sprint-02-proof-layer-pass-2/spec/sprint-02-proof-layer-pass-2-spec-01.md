# Spec: Add Missing CONCERN Element Category to Domain Pipeline

**Sprint:** sprint-02-proof-layer-pass-2 (under master `20260511-01-mp-redesign-proof-system`)
**Parent brief:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/design/sprint-02-proof-layer-pass-2-design-00.md`
**Architecture:** Hybrid Recommendation from competing-architecture review — option (a) with disciplined scope. Adds CONCERN to the domain element-schema pipeline (`tags.js`, `schema.js`, `translation.js`), exposes it via dedicated bridge entry points (`addConcern`/`reviseConcern`/`ratifyConcern`/`withdrawConcern`), corrects the existing `unaddressed_concern_rule` body bug in `closure-policy.js`, adds the missing `approved → concern_status(ratified)` derivation rule that ratification depends on, **adds the missing `covered(C)` producer rule** that closure depends on (per cascade §7.2 first clause), and retires proof-mcp's parallel `state.concerns` array by rerouting `manage_concerns` and four downstream readers through the unified element pipeline. Discipline rule (from Architect A's design): no abstraction introduced, no adjacent refactoring beyond cascade-mandated rule additions, no test coverage beyond what the spec acceptance criteria require.

**Revision history:**
- `-00` (initial): seven-AC-section spec from Hybrid choice.
- `-01` (this revision): adversarial review surfaced missing `covered(C)` producer rule, unspecified ID allocator format, underspecified `approved → concern_status(ratified)` rule body, and `addresses/2` vs cascade `addresses/3` arity mismatch. Added AC-4.3 (`covered(C)` producer rule), AC-1.4 (ID allocator format), tightened AC-2.3 (rule body specified), added Non-Goal noting `friction-policy.js:10` parallel pattern (LOW finding).

## Goal

The domain element-schema pipeline is missing the CONCERN entity. Eight of the nine element categories enumerated in cascade `05-domain-spec.md` §3 are registered through `ELEMENT_CATEGORIES` (tags.js), `CATEGORY_REGISTRY` (schema.js), and `ELEMENT_TRANSLATORS` (translation.js); CONCERN is the only one absent. Concern handling instead lives in proof-mcp's `state.concerns` array — a legacy structure that predates the domain redesign — and the `manage_concerns` MCP tool mutates that array without ever calling `domain-bridge.runOperation`. Three load-bearing places in the codebase already depend on Concerns being unified-pipeline elements: `closure-policy.js`'s `unaddressed_concern_rule` (broken — derives from `risk` instead of `concern_status`), the cascade-specified `addresses(Resolution, Concern)` semantics, and the §10.5 derived `in_lane(Proposition, Concern)` predicate. This spec adds the missing schema surface end-to-end, fixes the broken rule body, adds the missing status-transition rule the brief flagged, retires the shadow entity, and exercises all of it through real-import tests at parity with DEFINITION's existing coverage.

## Components

**Domain layer** (`skills/design-proof-system/references/domain/`):

- `tags.js` — append `CONCERN: 'concern'` to `ELEMENT_CATEGORIES` (between `FRICTION` and `DEFINITION`, preserving cascade §3 order).
- `schema.js` — add `[ELEMENT_CATEGORIES.CONCERN]` entry to `CATEGORY_REGISTRY`, inserted between FRICTION (lines 58-66) and DEFINITION (lines 67-75) to keep the registry's cascade-§3 ordering. Field shape mirrors DEFINITION (the closest analog: status-bearing, ratifiable, designer-sourced) with substitutions per cascade §3.8.
- `translation.js` — add Concern translator to `ELEMENT_TRANSLATORS` emitting `concern/3` and `concern_status/2` base facts; register `'concern'` and `'concern_status'` as EDB predicates; add the `approved → concern_status(ratified)` derivation rule. Choice of placement (rule emitted by translator vs. listed in `RULE_TEMPLATES`) is the implementer's, but the rule must be present in the engine after a Concern is added so ratification transitions status from `'draft'` to `'ratified'`.
- `closure-policy.js` — replace the `unaddressed_concern_rule` body. The current body is `[['risk', ['C', '_', '_']], ['not', ['addresses', ['_', 'C']]]]` — a pass-1 placeholder that reads from the wrong predicate. The corrected body is `[['concern_status', ['C', 'ratified']], ['not', ['covered', ['C']]]]` per the brief's Scope specification ("derived from `concern_status(C, ratified)` and the negation of `covered(C)`").
- `domain-bridge.js` — add four dedicated facade entry points mirroring DEFINITION at lines 88-94: `addConcern`, `reviseConcern`, `ratifyConcern`, `withdrawConcern`. Each wraps `runOperation` with `idShape: tags.ELEMENT_CATEGORIES.CONCERN` pinned into args. Add `'concern'` and `'concern_status'` to the two `validPredicates` static lists at lines 47 and 155.

**Proof-mcp layer** (`skills/design-large-task/proof-mcp/`):

- `state.js` — remove `state.concerns` and `state.concernCounter` from `initializeState`; remove the local `addConcern`, `ratifyConcern`, `withdrawConcern` exports that mutate that array.
- `server.js` (or whichever file registers the MCP tools) — reroute the `manage_concerns` tool's handler to call `domain-bridge.addConcern` / `reviseConcern` / `ratifyConcern` / `withdrawConcern`. The tool's input schema and observable outputs are preserved.
- `closing-argument.js`, `body-advancement.js`, `first-yes-gate.js`, `state-render.js` — redirect direct `state.concerns` reads to queries against the engine via `domain-bridge.queryProof({ pattern: ['concern_status', ...] })` (or whichever query primitive returns concern elements at parity with the prior reads).

**Tests** (added, not modifying existing):

- New test file `skills/design-proof-system/references/domain/__tests__/concern-schema.test.js` (or co-located following the existing test layout) — covers schema entry shape, translator output, bridge surface behavior, status transition through ratify/withdraw, and end-to-end `unaddressed_concern(C)` derivation.
- Existing proof-mcp tests covering the four touched readers must continue to pass; if any directly mocked `state.concerns`, they must be rewritten to use real imports per dr-20260514-06 (cross-layer real-import convention). The plan stage will scope this.

## Data Flow

A Concern's lifecycle after this spec lands:

1. **Add.** Caller invokes `domain-bridge.addConcern({ label, description? }, consent)`. Bridge wraps args with `idShape: 'concern'` and calls `runOperation('add', args, consent, fullPorts)`. `runOperation` allocates a `cern_N` id via the existing generic id-shape path, validates args against `CATEGORY_REGISTRY[CONCERN]`, then calls the Concern translator. Translator emits `concern(Id, Label, Description)` and `concern_status(Id, 'draft')` base facts plus the standard `created_at` meta-fact. Engine receives both EDB facts.

2. **Ratify.** Caller invokes `domain-bridge.ratifyConcern({ id }, consent)`. Bridge calls `runOperation('ratify', ...)`. `runOperation` asserts the generic `approved(Id, ConsentSource, Timestamp)` fact (same path as DEFINITION ratification). The new `approved → concern_status(ratified)` derivation rule fires, producing `concern_status(Id, ratified)` as an IDB fact. The original `concern_status(Id, 'draft')` EDB fact remains; downstream rules that need ratified status query the derived `ratified` predicate, not by retraction. (If implementation determines retraction is needed for invariant preservation, document the decision in the AC's Decisions field at execute-write time.)

3. **Withdraw.** Caller invokes `domain-bridge.withdrawConcern({ id, disposition }, consent)`. `runOperation('withdraw', ...)` follows the existing generic withdrawal path: writes a `element_status(Id, withdrawn, Disposition, Round)` fact via the standard withdrawal-disposition machinery. Downstream `active_element` / `withdrawn_element` queries gate visibility.

4. **Closure check.** `closure-policy.js`'s corrected `unaddressed_concern_rule` body derives `unaddressed_concern(C)` from `concern_status(C, ratified) AND NOT covered(C)`. The existing `closure_permitted_rule` (line 12-15) consumes `unaddressed_concern` via negation-as-failure, blocking closure when any ratified Concern is unaddressed.

5. **Proof-mcp visibility.** `manage_concerns` MCP tool's handler (post-rewire) calls the bridge entry points. The four downstream readers (`closing-argument.js`, `body-advancement.js`, `first-yes-gate.js`, `state-render.js`) query `concern/3` and `concern_status/2` facts from the engine instead of reading `state.concerns`. The MCP tool's externally-observable input schema and output shape are preserved.

## Error Handling

- **Missing `label` on add.** `verifyArgsShape({ }, 'concern')` throws `Error` with `{ code: 'SHAPE_INVALID', field: 'label' }`. This is the existing schema-validation path; no new error handling is introduced.
- **Unknown `idShape` 'concern' before this spec lands.** The bridge's existing fallback already throws on unknown idShape; once `CATEGORY_REGISTRY[CONCERN]` is added, that fallback is no longer reached for Concern operations.
- **Ratify with no matching concern.** The generic `runOperation('ratify', ...)` path already raises on unknown element id; no new handling needed.
- **Withdrawal disposition missing.** Existing withdrawal-disposition validation applies unchanged.
- **`manage_concerns` MCP tool input contract.** The tool's existing input schema validation runs before any bridge call; on invalid input the tool returns its existing error response, never reaching the bridge. Tool responses post-rewire match the pre-rewire shape (per Constraint 4 in the brief).

No new error types are introduced. The corrected `unaddressed_concern_rule` body cannot itself raise — Datalog rule body re-binding is a pure data-substitution.

## Testing Strategy

Test coverage at parity with DEFINITION's existing test footprint (see `__tests__/schema.test.js`, `__tests__/translation.test.js`, `__tests__/domain-bridge.test.js`, `__tests__/bridge-integration.test.js`, `__tests__/closure-policy.test.js`):

- **Schema unit tests:** CONCERN entry exists with the expected fields, idShape, render section, authority matrix; `verifyArgsShape` accepts valid args and rejects missing `label`.
- **Translator unit tests:** Concern translator emits the expected `concern/3` and `concern_status/2` base facts; the `approved → concern_status(ratified)` rule is present in the translator's rule output (or in the engine after add — whichever the implementer chooses).
- **Bridge unit tests:** `addConcern` allocates a `cern_N` id, persists the element, emits facts; `ratifyConcern` transitions derived status to `ratified`; `withdrawConcern` transitions to `withdrawn` with disposition; `reviseConcern` updates label/description.
- **Closure-policy correctness test:** `unaddressed_concern(C)` derives exactly when `concern_status(C, ratified)` holds and no ratified Resolution covers C. Negative case: derives nothing when no Concern exists, or when the Concern is `draft`/`withdrawn`, or when a ratified Resolution addresses it.
- **Integration test (proof-mcp rewire):** the `manage_concerns` MCP tool's add/ratify/withdraw paths produce the expected `concern_status` engine state; the four downstream readers (`closing-argument`, `body-advancement`, `first-yes-gate`, `state-render`) return outputs at parity with their pre-rewire behavior for any state that was previously expressible via `state.concerns`.

All new tests use real imports of the modules under test (per dr-20260514-06). Mocking the engine or the bridge is prohibited. Test discipline:

- 84 domain tests + 138 engine tests at branch HEAD must continue to pass post-spec.
- Any proof-mcp test that previously mocked `state.concerns` directly must be rewritten to read engine state via the bridge — the rewrite is part of the spec, not separate technical debt.

## Constraints

- **Cascade is normative.** `05-domain-spec.md` §3.8 dictates field names, id shape (`cern_N`), status set (`{draft, ratified, withdrawn}`), and engine-fact arity (`concern/3`, `concern_status/2`). The implementation must match exactly. The cascade is not edited by this sub-sprint.
- **Eight-category registration pattern is preserved.** CONCERN is the ninth entry using the same registration sequence. No new schema machinery is introduced.
- **No test regression.** The 84 passing domain tests and 138 passing engine tests at `132dfba` must continue to pass.
- **MCP tool contract preserved.** `manage_concerns` tool's input schema and observable outputs do not change. Only internal routing is rewired.
- **Real-import test discipline.** Per repo CLAUDE.md and decision record dr-20260514-06, all new and rewritten tests use real imports, not mocks of the modules under test.
- **No abstraction introduction.** Per Architect A's discipline carried into the hybrid: no new helper modules, no extracted patterns, no DRY-ing of the existing eight-category registration. CONCERN is the ninth in the same uniform pattern.
- **No adjacent refactoring.** Files touched are only those listed in Components. Surrounding code is not cleaned up, renamed, or modernized.
- **Worktree scope.** Work happens on branch `sprint-02-proof-layer-pass-2` in `.worktrees/sprint-02-proof-layer-pass-2/`, off commit `132dfba` (the post-relocation HEAD).

## Non-Goals

- **No rewrite of the closure-policy module.** Only the `unaddressed_concern_rule` body is corrected. Other rules in the module are not modified.
- **No new ADR.** The cascade already specifies CONCERN; this fix conforms to existing design, it does not amend it.
- **No retroactive migration of existing proof state files.** Any proof state file currently carrying `state.concerns` content is treated as out-of-scope; the rewire is forward-only. If a stored state file needs migration support, that is a separate sub-sprint.
- **No work on RISK or other element categories.** Only CONCERN is missing; only CONCERN is added.
- **No changes to the engine.** The engine treats `concern/3` as a generic ground atom and `concern_status/2` as a generic EDB predicate. No engine work is needed.
- **No changes to the cascade `design-documents/`.** This is a code fix that conforms to existing cascade specification.
- **No retirement of the `manage_concerns` MCP tool.** The tool stays; only its handler implementation is rewired.
- **No fix to `friction-policy.js:10`'s identical `[['risk', ['C', '_', '_']], ['not', ['addresses', ['_', 'C']]]]` pattern.** This is the same pass-1 placeholder shape as the `unaddressed_concern_rule` body that AC-4.1 corrects. Whether friction-policy carries an analogous bug is out of scope for this spec; plan-build should surface it as a follow-up sub-sprint candidate but not address it here. Spec discipline is "no adjacent refactoring beyond cascade-mandated rule additions."

## Acceptance Criteria

### AC-1.1 — CONCERN tag exported from `tags.js`

**Observable boundary:**
- `ELEMENT_CATEGORIES.CONCERN` is a defined property whose value is the string `'concern'`.
- `assertExhaustive('concern', ELEMENT_CATEGORIES, 'idShape')` returns `'concern'` without throwing.

**Given:** the post-spec `tags.js` module is imported.
**When:** `Object.values(ELEMENT_CATEGORIES)` is enumerated.
**Then:** the array contains `'concern'` exactly once; total length is 9.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — CATEGORY_REGISTRY entry for CONCERN

**Observable boundary:**
- `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.CONCERN]` is a frozen object.
- `requiredFields` equals `['label']`.
- `optionalFields` equals `['description']`.
- `idShape` equals `'concern'`.
- `sourceConstraint` equals `CONSENT_SOURCES.DESIGNER`.
- `renderSection` equals `RENDER_SECTIONS.PROBLEM` (matches cascade §3.8 placement; consistent with RISK's use of `PROBLEM`).
- `closedEnumFields` equals `{}`.
- `authority.add`, `authority.revise`, `authority.withdraw` each equal `[CONSENT_SOURCES.DESIGNER]`.
- `authority.ratify` equals `[CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER]`.

**Given:** the post-spec `schema.js` module is imported.
**When:** the registry entry for `'concern'` is destructured.
**Then:** every field above matches exactly.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — `verifyArgsShape` validation for CONCERN

**Observable boundary:**
- `verifyArgsShape({ label: 'X' }, 'concern')` returns `{ label: 'X' }`.
- `verifyArgsShape({}, 'concern')` throws an `Error` whose `code` is `'SHAPE_INVALID'` and whose `field` is `'label'`.
- `verifyArgsShape({ label: 'X', description: 'D' }, 'concern')` returns the input args unchanged.

**Given:** the post-spec `schema.js` is imported.
**When:** `verifyArgsShape` is called with the inputs above.
**Then:** outputs and thrown errors match exactly.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.4 — ID allocator produces `cern_N` form

**Observable boundary:**
- `domain-bridge.addConcern({ label: 'X' }, designerConsent)` returns an id matching the regex `^cern_\d+$` (lowercase, underscore, monotonically increasing counter scoped to category — same shape pattern that existing categories produce: `evid_1`, `prop_1`, `defn_1`, etc.).
- The id is whatever the existing domain-layer `runOperation` allocator yields for `idShape: 'concern'`. If the existing allocator's idShape→prefix mapping (currently producing `evid_*`, `prop_*` rather than `evidence_*`, `proposition_*` despite `idShape` being the full long-name string) does not produce `cern_*` for `idShape: 'concern'`, a small mapping update for the new category is in scope; the existence and location of that mapping is a Decision recorded at execute-write time.
- Note on legacy: proof-mcp's pre-rewire `state.js:18-19,253` produced `CERN-N` (uppercase, hyphen). That format is **not** preserved post-rewire — existing proof state files carrying `CERN-N` ids are out of scope for migration per Non-Goals.

**Given:** the post-spec domain bridge.
**When:** `addConcern` is called and the returned id is inspected.
**Then:** the id matches `^cern_\d+$`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Concern translator emits base facts on add

**Observable boundary:**
- `ELEMENT_TRANSLATORS[ELEMENT_CATEGORIES.CONCERN]({ label: 'C1', description: 'D1' }, 'cern_1', 1234)` returns a translation object containing `concern('cern_1', 'C1', 'D1')` and `concern_status('cern_1', 'draft')` as base facts.
- For an add without `description`: the translator emits `concern('cern_N', label, X)` where `X` matches the absent-optional-field convention DEFINITION uses for its optional fields in the existing `translation.js` (empty string is the expected value pending plan-build verification of DEFINITION's pattern). The translator must not throw when `description` is omitted.

**Given:** the post-spec `translation.js` is imported.
**When:** the translator is invoked with the args above.
**Then:** the returned base-facts list contains both tuples; no other domain-of-discourse facts are emitted by the translator.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — EDB predicates registered

**Observable boundary:**
- The translation module's `EDB_PREDICATES` (or equivalent) set contains `'concern'` and `'concern_status'`.
- The bridge facade's `validPredicates` (at `domain-bridge.js:47` and `domain-bridge.js:155`) contains `'concern'` and `'concern_status'`.

**Given:** the post-spec translation and bridge modules.
**When:** the predicate sets are enumerated.
**Then:** both names are present in both locations.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.3 — Status transition rule: `approved → concern_status(ratified)`

**Observable boundary:**
- A rule is registered in the engine equivalent to: `concern_status(C, ratified) :- approved(C, _, _), concern(C, _, _).` Form: head atom `['concern_status', [C, 'ratified']]`; body `[['approved', [C, '_', '_']], ['concern', [C, '_', '_']]]`. Rule placement is the implementer's choice between `RULE_TEMPLATES` in `translation.js` (Phase B parameterized template, instantiated per-element by `instantiateTemplate` — mirrors the proposition template at `translation.js:75-82`) and a static rule registered in the Concern translator. The chosen placement is recorded in this AC's Decisions field at execute-write time.
- After `domain-bridge.addConcern({ label: 'X' }, designerConsent)` followed by `domain-bridge.ratifyConcern({ id: <returned-id> }, designerConsent)`, querying the engine for `concern_status(<returned-id>, 'ratified')` returns at least one match.

**Given:** a fresh proof state, a Concern added via the bridge, then ratified via the bridge.
**When:** the engine is queried for `concern_status(<id>, 'ratified')`.
**Then:** the query succeeds. The `'draft'` row asserted as a base fact at add-time may also still be present (rule-derivation, not retraction) — the AC requires only that the `'ratified'` row is derivable.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Dedicated bridge entry points

**Observable boundary:**
- `domain-bridge.addConcern` is a function. Calling it allocates a fresh `cern_N` id, returns it, and emits the base facts from AC-2.1.
- `domain-bridge.reviseConcern` is a function. Calling it with `{ id, label?, description? }` updates the element. Only fields listed in `CATEGORY_REGISTRY[CONCERN]`'s `requiredFields` plus `optionalFields` (`label`, `description`) are revisable; any other key is rejected by the existing generic revise path.
- `domain-bridge.ratifyConcern` is a function. Calling it transitions status to `'ratified'` (see AC-2.3).
- `domain-bridge.withdrawConcern` is a function. Calling it with `{ id, disposition }` writes the `element_status(..., withdrawn, Disposition, Round)` fact.
- Each entry point pins `idShape: 'concern'` into args before delegating to `runOperation`.

**Given:** the post-spec `domain-bridge.js` is imported.
**When:** each of the four methods is invoked through a valid path.
**Then:** behavior matches DEFINITION's corresponding entry points (lines 88-94) with `'concern'` substituted for `'definition'`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — `unaddressed_concern_rule` body corrected

**Observable boundary:**
- The `unaddressed_concern_rule` in `closure-policy.js` derives `unaddressed_concern(C)` exactly when `concern_status(C, ratified)` holds and `not covered(C)` holds.
- The pass-1 placeholder body using `risk(C, _, _)` is removed.
- In a proof state with one ratified Concern and no ratified Resolution addressing it, `unaddressed_concern(<concern-id>)` is derivable; with a ratified Resolution that addresses it, it is not derivable.

**Given:** the post-spec `closure-policy.js`.
**When:** the engine is queried for `unaddressed_concern(C)` against the two state configurations above.
**Then:** the first returns the concern id, the second returns no match.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — `closure_permitted` blocks on unaddressed Concern

**Observable boundary:**
- In a proof state with one ratified Concern and no ratified Resolution addressing it, `closure_permitted` is not derivable.
- After a ratified Resolution covers the Concern (so `covered(C)` holds), `closure_permitted` becomes derivable (assuming other closure preconditions are also satisfied).

**Given:** the post-spec policy modules and a proof state per above.
**When:** `closure_permitted` is queried.
**Then:** results match the boundary.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.3 — `covered(C)` producer rule added

**Observable boundary:**
- A rule is registered in the engine equivalent to: `covered(C) :- concern_status(C, ratified), addresses(R, C), approved(R, _, _).` Form: head atom `['covered', [C]]`; body `[['concern_status', [C, 'ratified']], ['addresses', [R, C]], ['approved', [R, '_', '_']]]`.
- This rule corresponds to cascade `05-domain-spec.md` §7.2 first clause (`covered(C) :- concern_status(C, ratified), addresses(_, C, _)`). The cascade's clause uses `addresses/3` (three-position); the actual Resolution translator at `translation.js:45` emits `addresses/2` (two-position). The spec adopts the existing `addresses/2` arity. The cascade's third argument is preserved in semantics by adding `approved(R, _, _)` so coverage requires the addressing Resolution to itself be approved/ratified (matching the cascade text "covered predicate only when both ratified and addressed by a ratified Resolution" at §3.8 line 244).
- Cascade §7.2 second clause (`rule_covers` path) is **out of scope** for this spec — that path depends on `rule_covers` facts not yet implemented and is a separate cascade feature.
- Rule placement: in `closure-policy.js` adjacent to `unaddressed_concern_rule`, as a static rule. Alternative placement is the implementer's choice; the chosen placement is recorded in this AC's Decisions field at execute-write time.

**Given:** the post-spec `closure-policy.js` (or alternative module per implementer decision) and a proof state with one ratified Concern and one ratified Resolution whose `addresses` fact targets that Concern.
**When:** the engine is queried for `covered(<concern-id>)`.
**Then:** the query returns the concern id. In a state where the Resolution is unratified or the `addresses` fact is absent, the query returns no match.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — `state.concerns` retired

**Observable boundary:**
- `proof-mcp/state.js`'s `initializeState` no longer assigns `concerns: []` or `concernCounter: N`.
- The exports `addConcern`, `ratifyConcern`, `withdrawConcern` are removed from `proof-mcp/state.js`.
- Grepping the post-spec `proof-mcp/` directory for `state.concerns` returns no matches.

**Given:** the post-spec proof-mcp directory.
**When:** `grep -r "state\.concerns" skills/design-large-task/proof-mcp/` runs.
**Then:** no matches are returned.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.2 — `manage_concerns` MCP tool routes through the bridge

**Observable boundary:**
- The handler for the `manage_concerns` MCP tool calls `domain-bridge.addConcern` / `reviseConcern` / `ratifyConcern` / `withdrawConcern` for the corresponding tool actions.
- The tool's externally-observable input schema is unchanged from pre-spec.
- The tool's externally-observable output shape is unchanged from pre-spec.

**Given:** the post-spec proof-mcp tool registration and handler implementation.
**When:** the tool is invoked with each of its action types.
**Then:** the bridge is reached; the response shape matches the pre-spec response shape for that action.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.3 — Four downstream readers rewired

**Observable boundary:**
- `closing-argument.js`, `body-advancement.js`, `first-yes-gate.js`, and `state-render.js` no longer read from `state.concerns`. They obtain Concern data via the bridge (e.g., `domain-bridge.queryProof({ pattern: ['concern_status', ...] })` or whatever query primitive the plan settles on).
- For any proof state previously expressible via `state.concerns`, the four readers' outputs are byte-identical to their pre-spec outputs.

**Given:** the post-spec proof-mcp readers and a proof state with Concerns added through the bridge.
**When:** each reader runs against that state.
**Then:** outputs match pre-spec outputs.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.1 — No regression in existing domain tests

**Observable boundary:**
- `cd skills/design-proof-system/references/domain && npm test` reports 0 failures.
- All 84 tests passing at HEAD continue to pass.

**Given:** the worktree post-spec implementation.
**When:** domain `npm test` runs.
**Then:** exit code is 0, failure count is 0.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.2 — No regression in existing engine tests

**Observable boundary:**
- `cd skills/design-proof-system/references/engine && npm test` reports 0 failures.
- All 138 tests passing at HEAD continue to pass.

**Given:** the worktree post-spec implementation.
**When:** engine `npm test` runs.
**Then:** exit code is 0, failure count is 0.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.3 — Proof-mcp tests touched by rewire still pass

**Observable boundary:**
- `cd skills/design-large-task/proof-mcp && npm test` reports 0 failures.
- Tests covering the four touched readers (`closing-argument`, `body-advancement`, `first-yes-gate`, `state-render`) and the `manage_concerns` tool handler pass post-rewire.
- Any test that previously mocked `state.concerns` is rewritten to use real imports per dr-20260514-06; the rewritten test passes.

**Given:** the worktree post-spec implementation.
**When:** proof-mcp `npm test` runs.
**Then:** exit code is 0, failure count is 0.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.1 — New Concern test file added at parity with DEFINITION coverage

**Observable boundary:**
- A new test file (e.g., `__tests__/concern-schema.test.js`) exists in the domain test directory.
- The file covers: schema entry shape (AC-1.1, AC-1.2, AC-1.3), translator output (AC-2.1, AC-2.2), bridge surface (AC-3.1), status transitions (AC-2.3), closure-policy correctness (AC-4.1, AC-4.2).
- Test count is at parity with DEFINITION's existing coverage in the same test directory (within ±2 tests).
- All new tests use real imports of the modules under test; no mocking of the engine, bridge, or schema.

**Given:** the post-spec test directory.
**When:** the new test file runs.
**Then:** all assertions pass.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.2 — No archived plans edited

**Observable boundary:**
- `git diff` against the pre-spec HEAD shows no changes under `docs/chester/plans/`.

**Given:** the worktree post-spec implementation.
**When:** `git diff --name-only 132dfba.. | grep '^docs/chester/plans/'` runs.
**Then:** no output.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-15T01:32:37Z -->
<!-- produced-by design-specify@v0003 -->
