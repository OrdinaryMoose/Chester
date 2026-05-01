# Spec: Cluster A — Define Solve

**Sprint:** `cluster-a-define-solve` (under master plan `20260430-02-rebuild-design-derivation`)
**Parent brief:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-a-define-solve/design/cluster-a-define-solve-design-00.md`
**Architecture:** Atomic full-stack registration (Architect A). All proof MCP changes, brief template Section 8 replacement, and `design-specify/SKILL.md` brief-reading reference update land in one cluster A diff. Backed by full vitest coverage in `skills/design-large-task/proof-mcp/__tests__/`.

## Goal

Add `RESOLVE_CONDITION` as the proof MCP's sixth element type alongside the immutable five (EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, RISK), introduce a PM-ratified `Concern` enumeration anchored to the problem statement, and extend the closure gate to verify per-Concern coverage with a Rule-union path. Sequential ratification refuses batch. Revising a ratified RC's `statement` or `problem_anchor` invalidates the ratification automatically. Brief template and `design-specify` brief-reading reference are updated in the same diff so cluster B inherits no template/specify cleanup work.

## Components

**`skills/design-large-task/proof-mcp/proof.js`** — modified

- Append `'RESOLVE_CONDITION'` to `ELEMENT_TYPES` array (line 13).
- Extend `createElement`'s destructuring to extract `problem_anchor` and `ratification` from input.
- New type-specific validation block for `RESOLVE_CONDITION`:
  - `problem_anchor` required, non-empty string.
  - `source`, if provided, must NOT equal `'designer'` (RC is agent-proposes-PM-validates; PM ratification is captured via the dedicated tool, not the `source` field).
  - `grounding`, `collapse_test`, `reasoning_chain`, `rejected_alternatives`, `relieves`, `basis` are NOT required and are not validated for RC. They default per the universal element shell (null / empty array).
  - `ratification` is NOT accepted at create time. The created element's `ratification` field is initialized to `null`. Ratification is only settable via the `ratify_resolve_condition` MCP tool.
- `createElement` return-shape extended: every element gains two new fields, both null by default (`problem_anchor: null`, `ratification: null`). For RESOLVE_CONDITION, `problem_anchor` carries the input value.
- New exported function `checkUnratifiedResolveConditions(elements)` — for each active `RESOLVE_CONDITION` whose `ratification === null`, emit warning `{ type: 'unratified-rc', element_id, message }`.
- New exported function `checkStaleRatification(elements)` — reserved for future use; the cleared-on-revise approach means stale-ratification is structurally impossible (ratification field is nulled at revise time, so it can never refer to outdated content). The function exists for symmetry with the existing integrity-check pattern and initially returns an empty array. The sentinel contract is locked by AC-1.5 (below) so future logic changes have a tested callsite to extend.
- `checkAllIntegrity(elements)` extended to call `checkUnratifiedResolveConditions` and `checkStaleRatification`; results are spread into the combined warnings array.

**`skills/design-large-task/proof-mcp/state.js`** — modified

- Add `'RESOLVE_CONDITION': 'RCON-'` to `ID_PREFIX` map.
- Extend `initializeState` output:
  - `elementCounters.RESOLVE_CONDITION: 0`
  - `concerns: []` — flat array of Concern objects: `{ id, label, description }`
  - `concernsLocked: false` — list-level lock flag
  - `concernCounter: 0` — separate counter for `CERN-N` ID generation
  - `ratificationLog: []` — append-only audit array; each entry `{ event, target, round, ratificationText? }`
- Extend `applyOperations` `revise` branch to detect when the target is a `RESOLVE_CONDITION` and the operation changes `statement` or `problem_anchor`:
  - If `target.ratification !== null`, set `target.ratification = null`.
  - Append `{ event: 'cleared-on-revise', target: op.target, round: current.round, fields: ['statement'|'problem_anchor'|both] }` to `current.ratificationLog`.
- Extend `applyOperations` `revise` branch to also accept `problem_anchor` field changes when the target is a `RESOLVE_CONDITION` (parallel to the existing accepted fields like `statement`, `grounding`, etc.).
- New exported function `addConcern(state, { label, description })`:
  - Refuses if `state.concernsLocked === true` — returns `[null, newState, error]`.
  - Increments `concernCounter`, assigns `CERN-N` ID, pushes `{ id, label, description: description ?? null }` to `concerns`.
  - Returns `[concernId, newState, null]`.
- New exported function `lockConcerns(state)`:
  - Refuses if `state.concernsLocked === true` (already locked) — returns `[newState, error]`.
  - Refuses if `state.concerns.length === 0` (cannot lock empty list — closure depends on at least one Concern existing or the agent confirming "no concerns" is a deliberate state; for now the simpler invariant is: lock requires at least one Concern). Returns `[newState, error]`.
  - Sets `concernsLocked: true`. Returns `[newState, null]`.
- New exported function `ratifyResolveCondition(state, { elementId, ratificationText })`:
  - Validates the target element exists, is type `RESOLVE_CONDITION`, status `active`.
  - Validates `ratificationText` is a non-empty string.
  - Sets `target.ratification = { ratifiedAtRound: state.round, text: ratificationText }`.
  - Appends `{ event: 'ratified', target: elementId, round: state.round, ratificationText }` to `ratificationLog`.
  - Returns `[newState, null]` or `[state, error]`.
  - Function takes a single elementId (not an array). The `ratify_resolve_condition` MCP tool schema is also singular — there is no batch path through either layer.
- Extend `applyOperations` `add` branch to validate `problem_anchor` when the new element's type is `RESOLVE_CONDITION`: must reference an existing Concern ID in `state.concerns` (mechanical match against `concerns[].id`). If no match, push error `Resolve Condition problem_anchor "X" does not reference an existing Concern` to `errors`. Validation runs after `validateRefs` for grounding/basis but before `generateId`.
- `saveState` and `loadState` already serialize `concerns`, `concernsLocked`, `concernCounter`, `ratificationLog` correctly (plain JSON-serializable shapes); no special handling required.

**`skills/design-large-task/proof-mcp/metrics.js`** — modified

- Extend `computeCompleteness`:
  - Add `resolve_condition_count` (active `RESOLVE_CONDITION` count).
  - Add `ratified_rc_count` (active `RESOLVE_CONDITION` with `ratification !== null`).
- New exported function `checkConcernCoverage(state)`:
  - For each Concern in `state.concerns`, evaluate two paths:
    - **RC path:** at least one active `RESOLVE_CONDITION` with `problem_anchor === concern.id` AND `ratification !== null`.
    - **Rule-union path:** at least one active `RULE` whose `statement` (case-insensitive substring) contains either the Concern's `id` or its `label`.
  - Returns `{ covered: ConcernID[], uncovered: ConcernID[] }`.
- Extend `checkClosure(state)` with four new conditions appended after the existing six:
  - **Condition 7:** if `state.concerns.length > 0` and `state.concernsLocked === false`, push `'Concerns must be locked before closure'`.
  - **Condition 8:** if `state.concerns.length === 0`, push `'No Concerns enumerated — at least one Concern required before closure'`.
  - **Condition 9:** if any active `RESOLVE_CONDITION` has `ratification === null`, push `'Unratified Resolve Conditions exist — ratify each before closure'`.
  - **Condition 10:** if `state.concernsLocked === true`, call `checkConcernCoverage(state)`; for each entry in `uncovered`, push `'Concern "<id>" is not covered by any ratified Resolve Condition or Rule'`.
- Existing six conditions are unchanged.

**`skills/design-large-task/proof-mcp/server.js`** — modified

- Update local `ELEMENT_TYPES` constant to include `'RESOLVE_CONDITION'`.
- Update `submit_proof_update` tool inputSchema to:
  - Add `problem_anchor: { type: 'string', description: 'Concern ID anchor (for RESOLVE_CONDITION add/revise)' }` to the per-operation `properties`.
- New tool definition `manage_concerns`:
  - Description: `'Add or lock Concerns attached to the problem statement. Concerns anchor Resolve Conditions for closure coverage.'`
  - Input: `state_file` (required), `op` enum `['add', 'lock']` (required), `label` (string, required when op='add'), `description` (string, optional, op='add' only).
  - Returns: on `add` → `{ status: 'accepted', concern_id, concerns_count }`; on `lock` → `{ status: 'accepted', locked: true, concerns_count }`. Errors return `{ status: 'rejected', error }` with `isError: true`.
- New tool definition `ratify_resolve_condition`:
  - Description: `'Ratify a single Resolve Condition. Sequential by design — accepts one element_id per call; batch shapes are not supported.'`
  - Input: `state_file` (required), `element_id` (string, required, must be an `RCON-N` ID), `ratification` (string, required, PM's sign-off text).
  - There is no `element_ids` array field. The schema enforces sequential ratification at the API boundary.
  - Returns: `{ status: 'accepted', element_id, ratification: { ratifiedAtRound, text }, closure_permitted, closure_reasons }`.
- New handler functions `handleManageConcerns(args)` and `handleRatifyResolveCondition(args)`. Both load state, call into state.js, save state, return JSON-encoded response. Both follow the existing handler shape (error returns `isError: true`).
- Switch dispatch in `CallToolRequestSchema` handler extended with `'manage_concerns'` and `'ratify_resolve_condition'` cases.
- `handleInitialize` response status object extended: `concerns: []`, `tools_added: ['manage_concerns', 'ratify_resolve_condition']`.
- `handleGetProofState` response extended:
  - Include `concerns` and `concernsLocked` from state.
  - Include `ratificationLog` from state.
  - Include `concernCoverage: { covered, uncovered }` from `checkConcernCoverage(state)` when `concernsLocked === true`; otherwise omit.
- `handleSubmitProofUpdate` already serializes the result object — `closure_permitted` / `closure_reasons` automatically reflect new conditions 7-10 because `applyOperations` returns the closure result.

**`skills/design-large-task/references/design-brief-template.md`** — modified

- Replace the existing Section 8 ("Acceptance Criteria") block (currently around lines 170-180) with two new sections:
  - **Section 8a — Concerns:** renders the locked Concern enumeration. One bullet per Concern. Format: `- **{CERN-id} — {label}**: {description}` (description omitted if null).
  - **Section 8b — Resolve Conditions:** renders each active ratified `RESOLVE_CONDITION`. Format: `- **{RCON-id}** — {statement}. Anchored to {CERN-id} ({label}). Ratification: "{ratificationText}" (round {ratifiedAtRound}).`
- Update the section-ordering summary block (currently around line 184) to reflect the new section names.
- Update the self-containment-test guidance text to reference Resolve Conditions instead of Acceptance Criteria.
- Sections 1-7 (Goal, Necessary Conditions, Rules, Permissions, Evidence, Industry Context, Risks) are unchanged.

**`skills/design-specify/SKILL.md`** — modified

- Update line 230's "Reads:" integration line: replace `(8-section envelope)` with `(9-section envelope including Concerns and Resolve Conditions)` for the `design-large-task/references/design-brief-template.md` reference. (Confirmed file:line — `skills/design-specify/SKILL.md:230`.)
- **Add** a new paragraph (no equivalent exists today) under the "Writing the Spec" section (around line 147 — where `AC-{N.M}` is first introduced) describing the brief→spec AC derivation: the spec's `AC-{N.M}` entries seed from each `RCON-N` Resolve Condition's `statement` in the brief's Resolve Conditions section. The brief's locked Concerns section seeds the spec's coverage rationale. Existing `AC-{N.M}` numbering is unchanged at the spec level — RC statements are the seed text, not a renumbering. (Confirmed via grep: no current paragraph in `skills/design-specify/SKILL.md` describes brief→spec AC derivation; this is an addition, not an update.)

**`skills/design-large-task/proof-mcp/__tests__/proof.test.js`** — modified

- Add `describe('RESOLVE_CONDITION')` block covering create-time validation: accepts statement+problem_anchor, rejects missing problem_anchor, rejects designer source, initializes ratification to null.
- Add tests for `checkUnratifiedResolveConditions` and `checkStaleRatification`.
- Existing tests for the five element types are not modified; a small assertion is added to `ELEMENT_TYPES` test to confirm the array now contains six entries with the new entry appended last.

**`skills/design-large-task/proof-mcp/__tests__/state.test.js`** — modified

- Extend `initializeState` test to assert new fields (`concerns`, `concernsLocked`, `concernCounter`, `ratificationLog`, `elementCounters.RESOLVE_CONDITION`).
- Add `describe('addConcern')` block: appends Concern with sequential CERN-N ID; refuses after lock.
- Add `describe('lockConcerns')` block: locks the list; refuses on already-locked; refuses on empty list.
- Add `describe('ratifyResolveCondition')` block: ratifies a single RC; rejects unknown ID; rejects non-RC type; rejects empty ratificationText; appends to ratificationLog.
- Add `describe('applyOperations — RESOLVE_CONDITION')` block: add succeeds when problem_anchor matches Concern; add rejects when problem_anchor has no matching Concern; revise of statement on ratified RC clears ratification and logs; revise of problem_anchor on ratified RC clears ratification and logs; revise of unrelated fields preserves ratification.

**`skills/design-large-task/proof-mcp/__tests__/metrics.test.js`** — modified

- Extend `computeCompleteness` tests for `resolve_condition_count` and `ratified_rc_count` counters.
- Add `describe('checkConcernCoverage')` block: positive RC-path coverage; positive Rule-union coverage (substring on Concern ID); positive Rule-union coverage (substring on Concern label, case-insensitive); uncovered Concern returned in `uncovered` array; unratified RC does not count as RC-path coverage.
- Add `describe('checkClosure — Concerns and Resolve Conditions')` block: condition 7 fires on unlocked Concerns list; condition 8 fires on empty Concerns; condition 9 fires on unratified RC; condition 10 lists each uncovered Concern; closure permits when all conditions 1-10 pass.

**`skills/design-large-task/proof-mcp/__tests__/concerns.test.js`** — new file

- Integration-style tests covering the full Concerns lifecycle through `applyOperations` + `addConcern` + `lockConcerns`. These overlap with state.test.js but exercise the multi-step sequences (enumerate → lock → reject further adds → add ratified RC → close).

**`skills/design-large-task/proof-mcp/__tests__/server.test.js`** — new file (or skip if MCP server has no existing test file)

- Skipped if the project has no precedent for testing the MCP server layer directly. The two new tools' behavior is exercised through the underlying state.js and proof.js tests; the server layer is thin wiring. If the project later adds server-layer tests, this is the natural place for them.

## Data Flow

1. **Concern enumeration.** Agent proposes Concerns based on the polished problem statement; PM accepts/rejects/revises. Agent calls `manage_concerns` with `op: 'add'` per accepted Concern. Each call appends a Concern with a `CERN-N` ID to `state.concerns`.
2. **Concern lock.** Once PM ratifies the enumerated set, agent calls `manage_concerns` with `op: 'lock'`. `state.concernsLocked` flips to `true`. No further additions are accepted.
3. **Resolve Condition authoring.** Agent calls `submit_proof_update` with `op: 'add'`, `type: 'RESOLVE_CONDITION'`, `statement`, and `problem_anchor` (a `CERN-N` ID). `applyOperations` validates the anchor exists in `state.concerns`, generates an `RCON-N` ID, and stores the element with `ratification: null`.
4. **Sequential ratification.** Agent presents each unratified RC to PM. On PM approval, agent calls `ratify_resolve_condition` with the single `element_id` and the PM's ratification text. The handler sets `target.ratification = { ratifiedAtRound, text }` and appends to `ratificationLog`.
5. **Revision flow.** Agent calls `submit_proof_update` with `op: 'revise'`, `target: 'RCON-N'`, and one or more changed fields. If `statement` or `problem_anchor` changed and the element was ratified, `applyOperations` nulls the ratification and appends a `cleared-on-revise` entry to `ratificationLog`. Closure refuses until re-ratification.
6. **Closure check.** `applyOperations` and `get_proof_state` both call `checkClosure`. New conditions 7-10 fire as needed. Closure permits only when all ten conditions pass.
7. **Brief render.** When `design-large-task` writes the brief, the Concerns and Resolve Conditions sections render directly from `state.concerns` and the ratified `RESOLVE_CONDITION` elements. No agent prose between proof state and brief output.
8. **Spec generation.** `design-specify` reads the rendered brief, treats each `RCON-N` statement as the seed text for an `AC-{N.M}` block, and reads the Concerns section as the coverage map.

## Error Handling

- `manage_concerns` op='add' after lock — handler returns `{ status: 'rejected', error: 'Concerns are locked; cannot add' }` with `isError: true`.
- `manage_concerns` op='lock' on empty list — `{ status: 'rejected', error: 'Cannot lock empty Concerns list' }`.
- `manage_concerns` op='lock' on already-locked list — `{ status: 'rejected', error: 'Concerns already locked' }`.
- `submit_proof_update` op='add' type='RESOLVE_CONDITION' missing `problem_anchor` — error pushed to `result.errors` from `createElement` validation.
- `submit_proof_update` op='add' type='RESOLVE_CONDITION' with `problem_anchor` referencing nonexistent Concern — error pushed to `result.errors` from the `applyOperations` anchor-validation step.
- `submit_proof_update` op='add' type='RESOLVE_CONDITION' with `source: 'designer'` — error from `createElement` validation block.
- `ratify_resolve_condition` with unknown `element_id` — handler returns `{ status: 'rejected', error: 'Element <id> not found' }`.
- `ratify_resolve_condition` with non-RC element_id — `{ status: 'rejected', error: 'Element <id> is not a RESOLVE_CONDITION' }`.
- `ratify_resolve_condition` with withdrawn target — `{ status: 'rejected', error: 'Element <id> is not active' }`.
- `ratify_resolve_condition` with empty `ratification` text — `{ status: 'rejected', error: 'Ratification text is required' }`.
- `ratify_resolve_condition` schema rejection: tool inputSchema declares `element_id: { type: 'string' }` with `required: ['state_file', 'element_id', 'ratification']`. A caller passing `element_ids: [...]` gets a schema-level rejection from the MCP SDK before the handler runs.
- All errors follow the existing handler convention: response `content` is JSON-encoded, `isError: true`. State is not mutated on error. The closure_permitted flag in `get_proof_state` reflects current closure conditions accurately.

## Testing Strategy

Vitest. Existing test files extended in place; one new test file (`__tests__/concerns.test.js`). Test categories:

- **Type-registration tests** — RESOLVE_CONDITION accepted by `createElement`; required fields validated; existing five types' validation paths unchanged.
- **State-lifecycle tests** — `initializeState` shape; counter generation for RCON-; Concern enumeration, locking, post-lock refusal; ratification single-element path; revise-clears-ratification path.
- **Integrity-check tests** — `checkUnratifiedResolveConditions`; `checkStaleRatification` returns empty (sentinel); `checkAllIntegrity` includes new check outputs.
- **Coverage tests** — `checkConcernCoverage` per Concern: ratified-RC path, Rule-union substring path (ID match + label match, case-insensitive), uncovered case.
- **Closure tests** — each of the four new closure conditions fires independently; permits when all ten pass.
- **Server-layer behavior tests** — exercised indirectly through the underlying functions. Direct MCP tool tests are out of scope unless the project adds a server-test pattern in this sprint.
- **Brief-template content tests** — the template file content is checked at runtime: the template must contain the markers `## Concerns` and `## Resolve Conditions` (or whatever the chosen section heading is) and must NOT contain the deprecated `## Acceptance Criteria` heading. Implemented as a vitest test reading the .md file.
- **design-specify SKILL.md content tests** — the file must reference "Resolve Conditions" and "Concerns" in the brief-reading description, and the seeding paragraph must reference RC statements as the seed for `AC-{N.M}`. Implemented as a vitest test reading the .md file.

Coverage target: every new function has at least one positive test and one negative test (where negative cases exist). Every new closure condition has a fires-when-violated test and a permits-when-satisfied test.

## Constraints

- **RULE-1 — Five existing element types immutable.** Their validation blocks, schemas, source rules are unchanged. The `ELEMENT_TYPES` array is appended to, never reordered.
- **RULE-7 — Five resolution-claim attributes locked.** RC's three fields carry all five: `statement` (Observable, Forward-looking, Non-restrictive — the type contract has no restriction-shape fields), `problem_anchor` (Problem-statement-anchored — references locked Concern), `ratification` (Designer-ratified — populated only via the dedicated tool).
- **RULE-3 — design-specify generates solutions.** No verification-artifact field on RC. Verification mechanics belong to the spec layer's existing AC-skeleton machinery.
- **RULE-5 — Design = the problem (what), not the implementation (how).** RC's `statement` captures observable exit state, not mechanism.
- **Master-plan §4.2 cluster sequencing (RULE-9).** Cluster A's vocabulary lock (`RESOLVE_CONDITION`, `Concern`, `RCON-`, `CERN-`, three-field schema, sequential ratification, per-Concern coverage) is final. Cluster B reads these as Rules.
- **Master-plan RULE-10 — Phase 4a output expressible in solve-MCP vocabulary.** RC and Concern shapes are expressible via the existing `submit_proof_update` and `manage_concerns` tools; no separate vocabulary required for Phase 4a to produce them.
- **C1 + C2 voice discipline (from sprint 20260425-01).** Spec text is fact-default; no agent self-scoring of new logic. Tests are mechanical assertions over deterministic outputs.

## Non-Goals

- Phase 4a integration. Cluster C's scope. Phase 4a today does not produce Concerns or Resolve Conditions; cluster C will. Cluster A leaves the Phase 4a path unchanged.
- Phase 4a → Phase 4b transition mechanism. Cluster B's scope. Cluster A's MCP tools are callable from any client; the cluster B transition design will determine when and how Phase 4a invokes them.
- Final removal of the deprecated "Acceptance Criteria" template section vocabulary in `design-large-task/SKILL.md` text and other documentation references. The template file gets the section replacement in this cluster; broader doc cleanup (audit of all references to "Acceptance Criteria" across the skills tree) is out of scope. Inline references in `design-large-task/SKILL.md` instructional text that would become misleading are updated only where they describe the brief template's structure or Closure-stage rendering.
- Refactoring the existing five element types. Touched only via the universal element-shell extension (adding `problem_anchor: null` and `ratification: null` defaults to all elements). No semantic change for the five existing types — both fields default null and are not validated for those types.
- Concern revision after lock. The current invariant is: lock is final. Future cluster work may reopen Concerns under explicit unlock-and-revise machinery; cluster A does not provide that path.
- Decision-record MCP integration for ratification events. The decision-record MCP exists (per `20260424-01-build-decision-loop`); ratification events could in principle be captured as decision records. This integration is out of scope for cluster A.

## Acceptance Criteria

### AC-1.1 — RESOLVE_CONDITION element type registered

**Observable boundary:**
- `proof.js`'s exported `ELEMENT_TYPES` array contains `'RESOLVE_CONDITION'` as its sixth and final entry.
- `state.js`'s `ID_PREFIX` map contains `'RESOLVE_CONDITION': 'RCON-'`.
- `initializeState` returns an object whose `elementCounters` includes `RESOLVE_CONDITION: 0`.

**Given:** the proof MCP modules.
**When:** `ELEMENT_TYPES` is read; `initializeState('test')` is called.
**Then:** array contains six entries with `RESOLVE_CONDITION` last; counters object has the new key set to 0; `ID_PREFIX.RESOLVE_CONDITION === 'RCON-'`.

**Test skeleton ID:** `ac-1-1-resolve-condition-registered`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — RESOLVE_CONDITION accepts valid input

**Observable boundary:**
- `createElement({ type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1' }, 'RCON-1', 1)` returns an element with `id: 'RCON-1'`, `type: 'RESOLVE_CONDITION'`, `statement: 'X'`, `problem_anchor: 'CERN-1'`, `ratification: null`, `status: 'active'`.

**Given:** valid RC input with statement and problem_anchor.
**When:** `createElement` is called.
**Then:** element returned with the three semantic fields populated and `ratification` initialized to `null`.

**Test skeleton ID:** `ac-1-2-resolve-condition-create-valid`

**Implementing tasks:**

**Decisions:**

### AC-1.3 — RESOLVE_CONDITION rejects missing problem_anchor

**Observable boundary:**
- `createElement({ type: 'RESOLVE_CONDITION', statement: 'X' }, 'RCON-1', 1)` throws an Error whose message contains `'problem_anchor'`.

**Given:** RC input missing problem_anchor.
**When:** `createElement` is called.
**Then:** Error thrown referencing the missing field.

**Test skeleton ID:** `ac-1-3-resolve-condition-rejects-missing-anchor`

**Implementing tasks:**

**Decisions:**

### AC-1.4 — RESOLVE_CONDITION rejects designer source

**Observable boundary:**
- `createElement({ type: 'RESOLVE_CONDITION', statement: 'X', problem_anchor: 'CERN-1', source: 'designer' }, 'RCON-1', 1)` throws an Error referencing the `source` field.

**Given:** RC input with source='designer'.
**When:** `createElement` is called.
**Then:** Error thrown.

**Test skeleton ID:** `ac-1-4-resolve-condition-rejects-designer-source`

**Implementing tasks:**

**Decisions:**

### AC-1.5 — checkStaleRatification sentinel returns empty

**Observable boundary:**
- `checkStaleRatification(elements)` exists as an exported function in `proof.js` and returns `[]` for any elements Map, including states containing ratified, unratified, revised, and withdrawn RESOLVE_CONDITIONs.
- `checkAllIntegrity(elements)` includes `checkStaleRatification`'s output in its combined return.

**Given:** any elements Map state.
**When:** `checkStaleRatification` is called.
**Then:** returns `[]`. Sentinel contract: structurally impossible to produce stale-ratification under the cleared-on-revise approach; function exists as a tested extension callsite for future logic.

**Test skeleton ID:** `ac-1-5-stale-ratification-sentinel-empty`

**Implementing tasks:**

**Decisions:**

### AC-2.1 — addConcern appends sequential Concern

**Observable boundary:**
- `addConcern(state, { label: 'L', description: 'D' })` returns `[concernId, newState, null]` where concernId equals `'CERN-' + (oldCounter+1)`, `newState.concerns` length increased by one, the appended Concern has `id`, `label`, `description` populated.
- A second call with another label produces `CERN-2`; counter advances correctly.

**Given:** an initialized state with no Concerns.
**When:** `addConcern` is called twice with two distinct labels.
**Then:** state.concerns has two entries with IDs `CERN-1`, `CERN-2`; concernCounter is 2.

**Test skeleton ID:** `ac-2-1-add-concern-appends-sequential`

**Implementing tasks:**

**Decisions:**

### AC-2.2 — lockConcerns is irreversible

**Observable boundary:**
- After at least one `addConcern` call, `lockConcerns(state)` returns `[newState, null]` with `newState.concernsLocked === true`.
- A subsequent `lockConcerns` call returns `[state, error]` with `concernsLocked` still true.

**Given:** a state with at least one Concern.
**When:** `lockConcerns` called twice.
**Then:** first call succeeds; second call returns error.

**Test skeleton ID:** `ac-2-2-lock-concerns-irreversible`

**Implementing tasks:**

**Decisions:**

### AC-2.3 — addConcern refuses after lock

**Observable boundary:**
- `addConcern(lockedState, { label: 'X' })` returns `[null, lockedState, error]` where error references the locked state.
- `lockedState.concerns` is unchanged; `concernCounter` is unchanged.

**Given:** a locked Concerns state.
**When:** `addConcern` is called.
**Then:** error returned; no state mutation.

**Test skeleton ID:** `ac-2-3-add-concern-refused-after-lock`

**Implementing tasks:**

**Decisions:**

### AC-2.4 — lockConcerns refuses on empty list

**Observable boundary:**
- `lockConcerns(initState)` where `initState.concerns.length === 0` returns `[initState, error]`.

**Given:** an initialized state with no Concerns.
**When:** `lockConcerns` is called.
**Then:** error returned; `concernsLocked` remains false.

**Test skeleton ID:** `ac-2-4-lock-concerns-refuses-empty`

**Implementing tasks:**

**Decisions:**

### AC-3.1 — Closure refuses when Concerns not locked

**Observable boundary:**
- `checkClosure(state)` where `state.concerns.length > 0` and `state.concernsLocked === false` returns `{ permitted: false, reasons: [...] }` where reasons array contains the string `'Concerns must be locked before closure'`.

**Given:** a state with at least one Concern, not locked.
**When:** `checkClosure` is called.
**Then:** the returned reasons include the lock-required message.

**Test skeleton ID:** `ac-3-1-closure-refuses-unlocked-concerns`

**Implementing tasks:**

**Decisions:**

### AC-3.2 — Closure refuses when Concerns list is empty

**Observable boundary:**
- `checkClosure(initState)` where `state.concerns.length === 0` returns reasons containing `'No Concerns enumerated'` substring.

**Given:** an initialized state with no Concerns.
**When:** `checkClosure` is called.
**Then:** reasons array contains the no-concerns message.

**Test skeleton ID:** `ac-3-2-closure-refuses-empty-concerns`

**Implementing tasks:**

**Decisions:**

### AC-3.3 — Closure refuses when any Concern is uncovered

**Observable boundary:**
- Build a state with locked Concerns CERN-1, CERN-2; one ratified RC anchored to CERN-1; no Rule mentioning CERN-2 or its label.
- `checkClosure(state)` returns reasons array including `'Concern "CERN-2" is not covered'` substring.

**Given:** locked Concerns with CERN-2 having no RC and no Rule coverage.
**When:** `checkClosure` is called.
**Then:** reasons contain the per-Concern uncovered message for CERN-2.

**Test skeleton ID:** `ac-3-3-closure-per-concern-uncovered`

**Implementing tasks:**

**Decisions:**

### AC-3.4 — Closure permits with Rule-union coverage

**Observable boundary:**
- Build a state with locked Concerns CERN-1, CERN-2; ratified RC anchored to CERN-1; an active Rule whose statement contains the substring `'CERN-2'` (or the case-insensitive Concern label).
- `checkClosure(state)` does not include any per-Concern uncovered messages for CERN-1 or CERN-2.

**Given:** Concerns covered by a mix of RC path (CERN-1) and Rule-union path (CERN-2).
**When:** `checkConcernCoverage(state)` and `checkClosure(state)` are called.
**Then:** `coverage.uncovered` is empty; `checkClosure` reasons do not include per-Concern uncovered messages.

**Test skeleton ID:** `ac-3-4-closure-permits-rule-union-coverage`

**Implementing tasks:**

**Decisions:**

### AC-3.5 — Closure refuses when any RC is unratified

**Observable boundary:**
- Build a state with locked Concerns; one RC anchored to a Concern but with `ratification === null`.
- `checkClosure(state)` reasons contain `'Unratified Resolve Conditions exist'` substring.

**Given:** locked Concerns + unratified RC.
**When:** `checkClosure` is called.
**Then:** reasons contain the unratified-RC message.

**Test skeleton ID:** `ac-3-5-closure-refuses-unratified-rc`

**Implementing tasks:**

**Decisions:**

### AC-4.1 — ratifyResolveCondition accepts a single element_id

**Observable boundary:**
- `ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'PM approves' })` returns `[newState, null]`.
- `newState.elements.get('RCON-1').ratification` equals `{ ratifiedAtRound: state.round, text: 'PM approves' }`.
- `newState.ratificationLog` has a new entry with `event: 'ratified'`, `target: 'RCON-1'`, `ratificationText: 'PM approves'`.

**Given:** state containing one active unratified RCON-1.
**When:** `ratifyResolveCondition` called.
**Then:** ratification populated, log appended.

**Test skeleton ID:** `ac-4-1-ratify-single-rc-success`

**Implementing tasks:**

**Decisions:**

### AC-4.2 — ratify_resolve_condition tool schema is singular

**Observable boundary:**
- The MCP tool definition for `ratify_resolve_condition` in `server.js` declares `inputSchema.properties.element_id` with `type: 'string'` (NOT `type: 'array'`).
- The schema's `required` array contains `'element_id'`, NOT `'element_ids'`.
- No `element_ids` property exists on the schema.

**Given:** `server.js` source.
**When:** the `TOOLS` array is inspected for the `ratify_resolve_condition` entry.
**Then:** schema is singular by construction.

**Test skeleton ID:** `ac-4-2-ratify-tool-schema-singular`

**Implementing tasks:**

**Decisions:**

### AC-4.3 — ratifyResolveCondition rejects non-RC element

**Observable boundary:**
- Build a state with an active EVID-1 element.
- `ratifyResolveCondition(state, { elementId: 'EVID-1', ratificationText: 'X' })` returns `[state, error]` where error references the type mismatch.

**Given:** state with non-RC element.
**When:** ratify called.
**Then:** error returned; state not mutated.

**Test skeleton ID:** `ac-4-3-ratify-rejects-non-rc`

**Implementing tasks:**

**Decisions:**

### AC-5.1 — Revising statement nulls ratification

**Observable boundary:**
- Build a state with one ratified RCON-1.
- Call `applyOperations(state, [{ op: 'revise', target: 'RCON-1', statement: 'new statement' }])`.
- Result state's RCON-1 has `ratification === null` and `statement === 'new statement'`.
- `result.state.ratificationLog` includes a new entry `{ event: 'cleared-on-revise', target: 'RCON-1', fields: ['statement'] }` (or analogous).

**Given:** ratified RC.
**When:** revise changes statement.
**Then:** ratification nulled and log appended.

**Test skeleton ID:** `ac-5-1-revise-statement-clears-ratification`

**Implementing tasks:**

**Decisions:**

### AC-5.2 — Revising problem_anchor nulls ratification

**Observable boundary:**
- Build a state with one ratified RCON-1 anchored to CERN-1; add CERN-2.
- Call revise op changing `problem_anchor` to `'CERN-2'`.
- RCON-1's `ratification === null`; `problem_anchor === 'CERN-2'`; ratificationLog logged the clearing.

**Given:** ratified RC.
**When:** revise changes problem_anchor.
**Then:** ratification nulled and log appended.

**Test skeleton ID:** `ac-5-2-revise-anchor-clears-ratification`

**Implementing tasks:**

**Decisions:**

### AC-5.3 — Revising unrelated fields preserves ratification

**Observable boundary:**
- Build a state with a ratified RCON-1.
- Revise op for RCON-1 that touches a non-semantic field — `applyOperations`'s revise branch accepts no-op revises (an op carrying only `target: 'RCON-1'` with no field changes still increments `revision`/`revisedInRound` but mutates no semantic content).
- RCON-1's `ratification` is unchanged after the no-op revise; `ratificationLog` has no new entry.
- Note: only `statement` and `problem_anchor` are accepted as semantic fields on RC's revise path. The other revise-accepted fields in `applyOperations` (grounding, basis, collapse_test, reasoning_chain, rejected_alternatives, relieves) are not domain-relevant for RC; revising those on a RESOLVE_CONDITION target is permitted by the existing op handler but does not affect ratification.

**Given:** ratified RC.
**When:** revise carries no `statement` or `problem_anchor` change (no-op revise, or one that touches only non-semantic shell fields).
**Then:** ratification preserved; no log entry.

**Test skeleton ID:** `ac-5-3-revise-other-preserves-ratification`

**Implementing tasks:**

**Decisions:**

### AC-6.1 — Brief template includes Resolve Conditions section

**Observable boundary:**
- File `skills/design-large-task/references/design-brief-template.md` contains the literal heading `## Resolve Conditions` (or `### Resolve Conditions` per the template's section depth convention).
- The same file does NOT contain the deprecated heading `## Acceptance Criteria` or its variants.

**Given:** the brief template file.
**When:** the file content is read.
**Then:** new section heading present; old heading absent.

**Test skeleton ID:** `ac-6-1-brief-template-has-resolve-conditions`

**Implementing tasks:**

**Decisions:**

### AC-6.2 — Brief template includes Concerns section

**Observable boundary:**
- The brief template file contains the literal heading `## Concerns` (or matching depth) along with prose or bullet markers describing the rendered Concern format.

**Given:** the brief template file.
**When:** the file content is read.
**Then:** Concerns heading present.

**Test skeleton ID:** `ac-6-2-brief-template-has-concerns`

**Implementing tasks:**

**Decisions:**

### AC-7.1 — Existing five element types unchanged

**Observable boundary:**
- The validation paths for EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, RISK in `proof.js`'s `createElement` produce identical accept/reject results for inputs matching their pre-cluster-A test cases.
- Existing five-type *validation-logic* tests pass without modification (i.e., the type-specific validation tests in `__tests__/proof.test.js` for EVIDENCE/RULE/PERMISSION/NECESSARY_CONDITION/RISK run unchanged).
- Note: shape tests that enumerate the entire `ELEMENT_TYPES` array, the `elementCounters` object, or the `ID_PREFIX` map (e.g., `__tests__/state.test.js:21-23`'s `expect(state.elementCounters).toEqual({ EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0 })`) MUST be updated to include the sixth type. These updates extend coverage to the new type without changing assertions about the five existing types — each existing entry remains in the assertion.

**Given:** the existing five-type validation-logic test suite.
**When:** the suite is run after cluster A's changes.
**Then:** all five-type validation tests pass; the assertions specific to each existing type's accept/reject behavior are unchanged. Shape-enumeration assertions across all types are extended (not replaced) to include `RESOLVE_CONDITION`.

**Test skeleton ID:** `ac-7-1-five-existing-types-unchanged`

**Implementing tasks:**

**Decisions:**

### AC-8.1 — design-specify SKILL.md references new sections

**Observable boundary:**
- File `skills/design-specify/SKILL.md` contains the strings `'Resolve Conditions'` and `'Concerns'` in its brief-reading description.
- The seeding paragraph references RC statements as the seed text for `AC-{N.M}` blocks.
- The deprecated reference to `'Acceptance Criteria'` as the brief's resolution-criterion source is removed (text describing AC as a spec-level artifact may remain — that's the spec's own AC scheme, not the brief's).

**Given:** the design-specify SKILL.md file.
**When:** the file content is read.
**Then:** new section names present in brief-reading paragraph; old "Acceptance Criteria" reference (in brief-source context) removed.

**Test skeleton ID:** `ac-8-1-specify-skill-references-new-sections`

**Implementing tasks:**

**Decisions:**
