# Spec: Cluster D.1 — Build Proof Layer

**Sprint:** cluster-d-build-shared-understanding/sprint-d-1
**Parent brief:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/design/cluster-d-1-design-00.md`
**Architecture:** Universal Generic Tool Surface over heterogeneous internal storage (Architect A). Three new MCP tools (`withdraw`, `manage_definitions`, `reopen_proof`) plus consent threading across existing mutating tools. State stays heterogeneous (`state.concerns[]`, `state.elements: Map`, new `state.definitions[]` slot). Schema additions are additive — no migration. Closing-argument derivation remains a pure server-side function with extended envelope; skill responsibilities limited to caller-side things no service can own.

## Goal

Extend the proof MCP server and skill body so the proof layer becomes a self-contained service that delivers commonly understood design requirements to `design-specify`. The service owns the formal language (closed 9-category set), faithful state management with provenance on every mutation, designer-consent gating on every state-mutating operation, and a complete self-contained closure handoff. Sprint D.2 (Build Presentation Layer) is out of scope; D.1 publishes boundary contracts (NC-1, NC-8, NC-11, NC-12) for D.2 to inherit as Rules.

## Components

### New MCP tools (in `proof-mcp/server.js`)

- **`withdraw(state_file, category, element_id, disposition, consent)`** — universal withdrawal verb covering 7 non-FRICTION element types plus Concerns and Definitions. `category` is an enum drawn from the closed 9-category set. `disposition` validated server-side via `DISPOSITIONS_BY_CATEGORY` map keyed by category. Tool description enumerates per-category disposition options inline (axis-acknowledged sacrifice — schema doesn't enforce per-type, documentation does). FRICTION is **not** a valid `category` for `withdraw` — FRICTION terminal-disposition path uses the existing `override_friction_disposition` tool. This exception is registered as PERM-1 against NC-5 in §Constraints below.
- **`manage_definitions(state_file, op, payload, consent)`** — Definitions API per NC-7. `op` enum: `add | revise | deprecate | ratify | query-overlap`. `consent` required for `add`, `revise`, `deprecate`, `ratify`; not required for `query-overlap` (read-only). Payload shape varies by `op`. `deprecate` is preserved per brief §5.2 NC-7's exact ratified op list — Definitions follow Approval-tracked lifecycle (RULE-5) where `deprecate` is the lifecycle-aware withdrawal verb; functionally equivalent to `withdraw` with `category: 'DEFINITION'` but the named verb is preserved for brief fidelity.
- **`reopen_proof(state_file, consent)`** — explicit re-open per NC-12. Validates `proofStatus === 'closed'`. Preserves the closure artifact in `state.lastClosureArtifact` field before transitioning. Resets `closingArgPresentedRound` and `closingArgGoRound` to null. Sets `proofStatus: 'open'`. Concerns remain locked (`concernsLocked` not reset) — re-open is for amendment to the body of the proof, not for re-architecting the Concerns set.

### Modified MCP tools (consent threading)

- **`open_proof`** — gains `consent` field on `submission_material` capturing the designer's open directive (RC-1). Token recorded in `operationLog` as the first entry, before `restructure → checkOpenGate → initializeState → applyOperations → addConcern` sequence runs. Error-path returns at `server.js:444-450`, `server.js:457-465`, and `server.js:484-494` also record the consent token (RC-1 requires the directive precede the open even on rejected submissions).
- **`submit_proof_update`** — gains required `consent` parameter. Validation runs before any mutation. If consent shape invalid, returns error and does **not** increment `state.round`.
- **`manage_concerns`** — gains required `consent` parameter. Op enum extends from `add | lock` to `add | lock | ratify`. **Concern withdrawal is not on `manage_concerns`** — it is routed through the universal `withdraw(category: 'CONCERN', ...)` tool (see §Data Flow → Universal `withdraw` routing for the CONCERN dispatch into `withdrawConcern`). Brief §9 names "manage_concerns extended with withdraw operation" as the implementation guidance, but D.1 satisfies NC-5 / NC-6 by routing through the universal verb instead — Concerns have a withdrawal path, just on a different named tool. The new `ratify` op transitions a single Concern's `status` from `'draft'` to `'ratified'` per NC-18 (RULE-6).
- **`manage_friction`** — gains required `consent` parameter. Behavior otherwise preserved.
- **`override_friction_disposition`** — gains required `consent` parameter. Behavior otherwise preserved.
- **`ratify_resolve_condition`** — gains required `consent` parameter. Behavior otherwise preserved.
- **`confirm_closure_go`** — gains required `consent` parameter. Now also performs:
  - Sets `state.proofStatus = 'closed'` (currently absent — see §Decisions).
  - Bulk-transitions all draft NECESSARY_CONDITION elements to `status: 'ratified'` per RULE-9 two-tier ratification.
  - Bulk-transitions all draft RESOLVE_CONDITION elements to `status: 'ratified'` per RULE-9.
  - Bulk-transition is implemented in a way that does **not** clear `closingArgPresentedRound` / `closingArgGoRound`. The established mutation discipline at every other mutation site is to inline the two null-assignments (the exported `clearClosingFlags` function exists in `state.js:69-73` but is **not called** at any mutation site; per its own doc comment, "do NOT call this helper from outside a mutating function's body" — sites inline `newState.closingArgPresentedRound = null; newState.closingArgGoRound = null;` instead). The bulk-ratify path skips those two lines because RULE-9 bulk transition is a state transition, not a mutation.

### Read-only tools (unchanged signature; extended return shape)

- **`get_proof_state`** — return shape gains `definitions` array, per-element `status` field on Concerns/Definitions/NCs, `source` field on FRICTION elements, `operationLog`, `schemaVersion`, `lastClosureArtifact` (null until first re-open), `proofStatus` reflecting open/closed.
- **`present_closing_argument`** — return shape extended per NC-9; see §Data Flow → Closure envelope below. Tool handler stamps `closingArgPresentedRound` + persists state — handler is not pure, but its derivation function (`deriveClosingArgument`) is pure per NC-10.

### New file

- **`proof-mcp/definitions.js`** — pure functions module mirroring `proof.js` patterns. Exports: `createDefinition(input, id, round)`, `validateDefinitionInput(input)`, `queryOverlapCandidates(definitions, canonical_name)`. Definition shape: `{ id, canonical_name, aliases, definition, sense_constraints, status: 'draft' | 'ratified' | 'deprecated', source: 'designer' | 'agent-derivation', addedInRound, revisedInRound, revision, history }`. Overlap-candidate algorithm is a token-overlap heuristic over `canonical_name` + `aliases` — specific algorithm details (Levenshtein, Jaccard, etc.) are implementation choice within the function; D.1 commits to function signature.

### Modified files

- **`proof-mcp/proof.js`** — adds `CATEGORIES` constant (9 entries: `EVIDENCE`, `RULE`, `PERMISSION`, `NECESSARY_CONDITION`, `RISK`, `RESOLVE_CONDITION`, `FRICTION`, `CONCERN`, `DEFINITION`). Adds `DISPOSITIONS_BY_CATEGORY` map keyed by category (FRICTION key maps to existing `FRICTION_DISPOSITIONS` for read-side reference but FRICTION is not a valid `withdraw` target — see PERM-1). Adds `validateConsentToken(token)` pure function checking shape `{ source: 'designer' | 'agent-proposed-designer-confirmed', rationale?: string }`. Adds `SCHEMA_VERSION = 1` constant. Extends `createElement` FRICTION branch with `source: 'agent-derivation'` field set at construction. Adds `entityType(id)` helper deriving category from ID prefix (used by registry and tool handlers — note that Concerns use the `CERN-` prefix, not `CONC-`, per existing code at `state.js:156`).
- **`proof-mcp/state.js`** — extensive modifications. See §Data Flow.
- **`proof-mcp/server.js`** — extensive modifications. See §Data Flow.
- **`proof-mcp/closing-argument.js`** — `deriveClosingArgument` extended per NC-9 + NC-16. Pure function preserved.
- **`proof-mcp/metrics.js`** — `evaluateTrigger` adds Concerns-Ratified hard gate consistency (NC-9). `computeCompleteness` adds Definitions counters.
- **`proof-mcp/friction-detection.js`** — unchanged behaviorally. Auto-create `permission-risk-linkage` only; hints for the other three shapes. Reads via existing direct slot access.
- **`skills/design-large-task/SKILL.md`** — small additions to Phase 8 / Phase 9: consent-token construction protocol, NC-1 seed packet shape requirements, brief-renderer step that consumes the server-rendered closure envelope and writes `design/<sprint-name>-design-NN.md`.

## Data Flow

### Consent token threading

Every state-mutating tool handler in `server.js` extracts the `consent` argument and passes it to the state-layer function. State-layer functions call `validateConsentToken(consent)` as a pre-flight check **before** any state mutation, **before** `state.round++`, and **before** `clearClosingFlags`. On invalid shape, the function returns `[state, [], { code: 'INVALID_CONSENT', message }]` and the handler returns an MCP error response with `isError: true`. State is unchanged. Round is unchanged. Closing flags are unchanged.

`processFriction` is extended to accept a `parentConsent` parameter. `applyOperations`, `addConcern`, `lockConcerns`, `ratifyConcern`, `ratifyNc`, `manageDefinitions`, `manageFriction`, `overrideFrictionDisposition`, `withdrawElement`, `recordClosingArgPresented`, `recordDesignerGo`, `reopenProof`, `ratifyResolveCondition` — every function that may auto-create a FRICTION via `processFriction` — passes its own validated `consent` token down as `parentConsent`. `processFriction` writes `parentConsent` into the auto-created FRICTION element's `creationConsent` field and into the `operationLog` entry that records the auto-creation. NC-8 inheritance satisfied through the `parentConsent` data path.

### Atomic persistence

`saveState` is rewritten to use a write-to-temp-then-rename pattern: write JSON to `<state_file>.tmp` via `writeFileSync`, then `renameSync(<state_file>.tmp, <state_file>)`. POSIX `rename` on the same filesystem is atomic — readers see either the old file or the new file, never a partial write. On any throw from either step, the function rethrows and the caller's try/catch returns `{ code: 'PERSIST_FAILED', message }` distinguishable from domain errors. NC-17 satisfied at the OS atomicity layer, not just the JavaScript exception layer.

Every mutating tool handler in `server.js` wraps `saveState` in try/catch that returns a typed `PERSIST_FAILED` error. Domain errors return without calling `saveState`. Caller can distinguish persistence failure from domain rejection by error `code` field.

### State shape additions (additive, no migration)

`initializeState` returns shape extended with:

```
{
  schemaVersion: 1,
  ...existing fields...,
  definitions: [],
  definitionCounter: 0,
  definitionLog: [],
  operationLog: [],
  lastClosureArtifact: null,
  proofStatus: 'unopen',  // existing field; values: 'unopen' | 'open' | 'closed'
}
```

`loadState` adds `??=` backfills for: `schemaVersion`, `definitions`, `definitionCounter`, `definitionLog`, `operationLog`, `lastClosureArtifact`. Per-element `status` backfilled per RULE-6 / RULE-8 / NC-18:

- Each entry in `state.concerns[]`: `entry.status ??= 'draft'`; if `state.concernsLocked === true`, then `entry.status ??= 'ratified'` (preserves the meaning of an already-locked Concern set on legacy state files).
- Each entry in `state.elements` Map where `entry.type === 'NECESSARY_CONDITION'`: `entry.status` already exists with values `'active' | 'withdrawn'`. NC-18 ratification status is added as a **second, orthogonal** field `entry.ratificationStatus: 'draft' | 'ratified'`. Backfill: `entry.ratificationStatus ??= 'draft'`. Renaming `status` would break existing tests; introducing `ratificationStatus` keeps the active/withdrawn axis distinct from the draft/ratified axis.
- Each entry in `state.elements` Map where `entry.type === 'FRICTION'`: `entry.source ??= 'agent-derivation'` (preserves source on legacy state files).
- Each entry in `state.definitions[]`: `entry.status ??= 'draft'`.

### Schema version refusal

`loadState` checks `raw.schemaVersion` against `SCHEMA_VERSION` constant **before** running backfills. If `raw.schemaVersion > SCHEMA_VERSION`, throws `SchemaVersionError(message)`. If `raw.schemaVersion === undefined` or `raw.schemaVersion <= SCHEMA_VERSION`, proceeds with backfills (the version field is itself backfilled to `SCHEMA_VERSION` after the check). This handles legacy state files (no schemaVersion → backfilled to 1) and forward-incompatible files (schemaVersion > 1 → refused).

### Universal `withdraw` routing

`server.js` `handleWithdraw(args)` extracts `category` and dispatches:

- `category === 'FRICTION'` → returns error `{ code: 'INVALID_CATEGORY', message: 'FRICTION uses override_friction_disposition; see PERM-1' }`. Documented in tool description.
- `category === 'CONCERN'` → calls `withdrawConcern(state, element_id, disposition, consent, round)` in `state.js`. Walks `state.concerns[]` array.
- `category === 'DEFINITION'` → calls `withdrawDefinition(state, element_id, disposition, consent, round)` (alias; equivalent to `manageDefinitions` deprecate but goes through the universal path).
- All other categories → calls `withdrawElement(state, element_id, disposition, consent, round)` which walks `state.elements: Map`.

Every withdrawal function: validates consent shape; validates that `element_id` prefix matches expected category (returns `{ code: 'CATEGORY_MISMATCH' }` on mismatch); validates `disposition` against `DISPOSITIONS_BY_CATEGORY[category]`; transitions `entry.status` to `'withdrawn'`; sets `entry.withdrawal_disposition`; preserves `entry.source` field unchanged; appends `operationLog` entry with `{ round, op: 'withdraw', entityId, type, consent, disposition }`; returns `[newState, friction_hints, error]`.

### operationLog shape

Single shape per entry:

```
{
  round: number,
  op: 'add' | 'revise' | 'withdraw' | 'ratify' | 'lock' | 'open' | 'close' | 'reopen' | 'auto-create-friction' | 'bulk-ratify',
  entityId: string,        // null for 'open', 'close', 'reopen', 'lock', 'bulk-ratify'
  type: string,            // EVIDENCE / RULE / NCON / etc.; null where not applicable
  consent: { source, rationale } | null,  // null only for migrated legacy entries
  changedFields: string[] | null,         // populated on revise; null elsewhere
  provenance: object | null               // operation-class-specific details
}
```

Per-operation-class `provenance` content (illustrative; specific shapes deferred per brief §11):

- `add`: `{ initialPayload: {...} }`
- `revise`: `{ before: {...}, after: {...} }`
- `withdraw`: `{ disposition }`
- `auto-create-friction`: `{ shape, anchor_a, anchor_b, parentOp, parentConsent }`
- `bulk-ratify`: `{ type, count, elementIds }`

`operationLog` is appended to by every mutating function inside `state.js` immediately after the mutation succeeds and before the function returns. `loadState` backfills `operationLog ??= []`.

### Closure envelope (NC-9 completeness fix)

`deriveClosingArgument(state)` returns object with these fields — current code lacks the bolded ones:

- `problemStatement` (string)
- `lockedConcerns` (array of Concerns with `status === 'ratified'` and full description)
- `phantomConcerns` (array of withdrawn Concerns with `withdrawal_disposition` and preserved `source`) — **new**
- `resolveConditions` (array of active RCs with five attributes) — existing
- `phantomRCs` (array of withdrawn RCs with disposition) — existing
- **`activeNCs`** — array of active NCs (status `active` AND `ratificationStatus` `ratified`) with full structure (statement, grounding, collapse_test, reasoning_chain, rejected_alternatives, source) — **new standalone field per NC-9**
- **`draftNCs`** — array of active NCs with `ratificationStatus: 'draft'` — **new visibility field per NC-18**
- `phantomNCs` (existing) — withdrawn NCs with disposition
- **`activeRules`** — array of active Rules — **new per NC-9**
- **`activePermissions`** — array of active Permissions with `relieves` field — **new per NC-9**
- **`activeRisks`** — array of active Risks with `basis` field — **new per NC-9**
- `liveFriction` (existing) — array of active Friction
- `phantomFriction` (existing) — array of withdrawn Friction
- **`ratifiedDefinitions`** — array of Definitions with `status: 'ratified'` — **new per NC-9**
- **`phantomDefinitions`** — array of Definitions with `status: 'deprecated'` — **new**
- **`closureProvenance`** — array of `{ entityId, type, source, derivationChain, ratification, restructuringActionLabel }` for every cited element — **new per NC-16**. `derivationChain` is reconstructed by walking `operationLog` filtered by `entityId`.
- `compositeScore` (existing)
- `closurePermitted` (existing)
- `closureReasons` (existing)

Pure function preserved (NC-10): no I/O, no mutation. Multiple calls in the same round produce identical output.

### Closure hard gate (NC-9 consistency)

Both `evaluateTrigger` (in `metrics.js`) and `handlePresentClosingArgument` (in `server.js`) enforce:

1. `state.concernsLocked === true`, AND
2. Every entry in `state.concerns[]` has `entry.status === 'ratified'`.

Either check failing produces a closure-blocked outcome with reason. The two functions share a single helper `concernsRatificationGate(state)` exported from `metrics.js` and imported by `server.js` to prevent drift.

**Note on existing behavior — both halves of the gate are NEW logic:**

- The current `evaluateTrigger` at `metrics.js:419` checks only `!state.concernsLocked`. The per-element-status check (#2 above) does not exist today and depends on the new `entry.status` field added to Concerns by NC-18. The check is genuinely new; backfill of `entry.status` must land before the check is wired.
- The current `handlePresentClosingArgument` at `server.js:395-405` returns a non-error response on gate failure (`{ content: [...] }` with no `isError: true`). D.1 changes this handler to return `isError: true` with code `CONCERNS_UNRATIFIED` or `CONCERNS_UNLOCKED` on gate failure. Existing tests in `metrics.test.js` and `trigger-evaluator.test.js` that assert on the non-error refusal shape must be updated as part of AC-4.4 implementation.

### Re-open mechanics

`reopenProof(state, consent)` in `state.js`:

1. Validates consent shape.
2. Validates `state.proofStatus === 'closed'`. If not, returns `{ code: 'NOT_CLOSED' }`.
3. Captures current closure envelope: `newState.lastClosureArtifact = deriveClosingArgument(state)`.
4. Resets: `newState.closingArgPresentedRound = null`, `newState.closingArgGoRound = null`, `newState.proofStatus = 'open'`.
5. Does **not** reset `concernsLocked` — a re-open amends the proof body, not the Concern set.
6. Appends `operationLog` entry with `op: 'reopen'`.
7. Returns `[newState, [], null]`.

`server.js` `handleReopenProof` validates consent + calls `reopenProof` + saves state with atomic-rename pattern.

### `confirm_closure_go` extensions

`recordDesignerGo(state, consent)` in `state.js`:

1. Validates consent shape.
2. Validates `state.closingArgPresentedRound === state.round` (existing round-equality check).
3. Sets `newState.closingArgGoRound = newState.round` (existing).
4. **New:** sets `newState.proofStatus = 'closed'`.
5. **New:** bulk-transitions: for each entry in `newState.elements` Map where `entry.type === 'NECESSARY_CONDITION'` AND `entry.ratificationStatus === 'draft'` AND `entry.status === 'active'`, set `entry.ratificationStatus = 'ratified'`.
6. **New:** bulk-transitions: for each entry in `newState.elements` Map where `entry.type === 'RESOLVE_CONDITION'` AND `entry.ratification === null` (or absent) AND `entry.status === 'active'`, set `entry.ratification = { round: newState.round, by: 'bulk-go' }`.
7. **Critical:** does **not** call `clearClosingFlags`. Bulk-ratify is a state transition per RULE-9, not a mutation. Implementer must wire this explicitly — the established mutation pattern includes flag-clearing; this site is the documented exception.
8. Appends `operationLog` entries: one for the go event (`op: 'close'`) and one each for the two bulk-ratify events (`op: 'bulk-ratify'`).

### `processFriction` consent propagation

```
function processFriction(state, parentConsent, parentOp) {
  // existing logic...
  for (auto-create candidate) {
    const fric = createElement({ type: 'FRICTION', ..., source: 'agent-derivation' }, id, round);
    fric.creationConsent = parentConsent;
    state.elements.set(id, fric);
    state.frictionLog.push({ event: 'auto-created', frictionId: id, round, parentConsent, parentOp });
    state.operationLog.push({
      round, op: 'auto-create-friction', entityId: id, type: 'FRICTION',
      consent: parentConsent, changedFields: null,
      provenance: { shape: fric.friction_shape, anchor_a: fric.anchor_a, anchor_b: fric.anchor_b, parentOp, parentConsent }
    });
  }
  return { state, hints: [...] };
}
```

Every existing `processFriction` call site is updated to thread `parentConsent` and `parentOp` arguments. The handler-level consent token is the source.

## Error Handling

All state-mutating tool handlers return MCP responses with `isError: true` and a `content[0].text` carrying a JSON-stringified `{ code, message, ...details }` object on failure. Error codes:

- `INVALID_CONSENT` — consent token shape is malformed (NC-8).
- `INVALID_SEED_PACKET` — `open_proof` `submission_material` missing required field per NC-1 (problem_statement, at least one Concern, at least one Evidence, restructuring action labels on every submitted element). Message names the missing field. New code introduced by D.1; cluster B.1 open-gate previously returned error strings without codes.
- `INVALID_CATEGORY` — `withdraw` called with `category: 'FRICTION'` (PERM-1) or unrecognized category.
- `CATEGORY_MISMATCH` — `element_id` prefix doesn't match the declared `category`.
- `INVALID_DISPOSITION` — disposition is not in `DISPOSITIONS_BY_CATEGORY[category]`.
- `NOT_FOUND` — element/concern/definition not found.
- `NOT_CLOSED` — `reopen_proof` called when `proofStatus !== 'closed'`.
- `ALREADY_LOCKED` — `manage_concerns lock` called when `concernsLocked === true` (preserves existing behavior).
- `CONCERNS_UNRATIFIED` — closure gate hit because some Concerns have `status: 'draft'`.
- `CONCERNS_UNLOCKED` — closure gate hit because `concernsLocked === false`.
- `SCHEMA_VERSION_TOO_NEW` — `loadState` refused a forward-incompatible state file (NC-15).
- `PERSIST_FAILED` — `saveState` (atomic write+rename) threw. State unchanged.
- Domain errors from existing validators (`grounding required`, `RC requires problem_anchor`, etc.) preserved.

The error code distinguishes domain failure (caller error) from infrastructure failure (`PERSIST_FAILED`, `SCHEMA_VERSION_TOO_NEW`) so callers can implement appropriate retry / escalation.

`open_proof` error paths at `server.js:444-453` (problem_statement extraction failure), `server.js:458-467` (gate failure), `server.js:482-494` (applyOperations errors) each record the consent token in `operationLog` before returning the error. RC-1 requires the directive to precede the open even on rejected submissions.

## Testing Strategy

Tests live in `proof-mcp/__tests__/`. Categories:

- **Schema/backfill:** new `loadstate-backfill.test.js` cases covering `schemaVersion`, `operationLog`, `definitions`, per-element `status`/`ratificationStatus`/`source` backfills against legacy state-file fixtures.
- **Schema version refusal:** new `schema-version.test.js` testing `loadState` refuses `schemaVersion: 2`, accepts `schemaVersion: 1` and `schemaVersion: undefined`.
- **Atomic persistence:** new `atomic-persistence.test.js` covering `saveState` write-tmp-then-rename pattern. Test crashes simulated via mock `renameSync` throwing; verify state file unchanged.
- **Consent token validation:** new `consent.test.js` testing every mutating tool rejects malformed consent (`isError: true`, no round increment, no flag clearing) and accepts valid consent. Cover: `submit_proof_update`, `manage_concerns add | lock | ratify`, `manage_friction`, `override_friction_disposition`, `ratify_resolve_condition`, `confirm_closure_go`, `open_proof`, `withdraw`, `manage_definitions`, `reopen_proof`.
- **Universal withdraw:** new `withdraw.test.js` covering each non-FRICTION category, `CATEGORY_MISMATCH`, `INVALID_DISPOSITION`, FRICTION rejection (PERM-1).
- **Definitions API:** new `definitions.test.js` covering add / revise / deprecate / ratify / query-overlap. Mirrors `friction-lifecycle.test.js` shape.
- **Re-open:** new `reopen.test.js` covering: `NOT_CLOSED` rejection when proof open; successful re-open from closed state; `lastClosureArtifact` retention; flag reset to null; `concernsLocked` preserved; subsequent mutations require fresh consent.
- **Closure envelope completeness:** extend `closing-argument.test.js` with assertions on every NC-9 required field — `activeNCs`, `draftNCs`, `activeRules`, `activePermissions`, `activeRisks`, `ratifiedDefinitions`, `phantomDefinitions`, `closureProvenance`, `phantomConcerns`. Existing assertions on `phantomNCs`, `liveFriction`, etc. preserved.
- **Hard gate consistency:** extend `metrics.test.js` and add cases for `present_closing_argument` covering: gate refuses when `concernsLocked === false` even with all Concerns ratified; gate refuses when any Concern `status === 'draft'` even with `concernsLocked === true`; gate passes when both conditions hold.
- **Bulk ratification at go:** new test cases in `closing-argument-end-to-end.test.js` covering `confirm_closure_go` transitions all draft NCs and unratified active RCs to ratified, sets `proofStatus: 'closed'`, does **not** clear closing flags.
- **Friction consent inheritance:** new `friction-consent.test.js` covering auto-created `permission-risk-linkage` Friction carries `creationConsent` field copied from parent operation's consent token; `operationLog` entry for auto-creation carries `parentConsent`.
- **operationLog:** new `operation-log.test.js` covering every mutating operation appends one entry; entry shape conforms to spec; auto-create-friction appends a separate entry with parent provenance.
- **Server tool enum updates:** update `server.test.js` line 22-28 assertion (existing `enum: ['add', 'lock']` for `manage_concerns op`) to `enum: ['add', 'lock', 'ratify']`. Add tool-presence assertions for `withdraw`, `manage_definitions`, `reopen_proof`.
- **Friction guards preserved:** existing `friction-lifecycle.test.js:81-119` cases (refusing FRICTION via `submit_proof_update` add/withdraw) preserved unchanged.

Coverage target: every new code path covered by at least one direct test. Existing 21-file test suite continues to pass.

## Constraints

### Inherited (non-revisable in D.1)

- All ratified NCs (NC-1 through NC-19), RCs (RC-1 through RC-5), Concerns (C-1 through C-6), and Rules (RULE-1 through RULE-9) from the design brief.
- Cluster A shipped: RC element type, five attributes, sequential ratification, coverage-check closure gate.
- Cluster B.1 shipped: `open_proof` provenance shape (action label + source citation + reasoning chain), one-shot submission, restructuring report.
- Cluster B.2 shipped: pure-function closing-argument derivation, two-yes gate, friction detection (4 shapes — auto-create permission-risk-linkage, hints for other three), phantom mechanism, closed disposition sets.
- Master plan rules R1–R10 set aside per cluster D charter; cluster D reauthors any rule it needs (this spec uses cluster D's RULE-1 through RULE-9 from brief §6).

### Permissions registered

- **PERM-1 (against NC-5).** FRICTION terminal-disposition path is via `override_friction_disposition`, not the universal `withdraw` tool. **Why:** the FRICTION disposition vocabulary (`lived-with`, `relieved-by-exception`, `dissolved-by-revision`, `dissolved-by-scope-cut`, `not-really-friction`) is disjoint from the non-FRICTION withdrawal vocabulary (`consolidated`, `superseded`, `found-redundant`, `found-incorrect`, `scope-removed`); merging the sets would force callers to know category-conditional disposition rules anyway, and B.2's terminal-disposition state machine is the established discipline. NC-5's "universal withdrawal grammar" is preserved at the **semantic** layer — every category (including FRICTION via `override_friction_disposition`) preserves the element with closed-set disposition; no silent deletion. **How to apply:** universal `withdraw(category, ...)` rejects `category: 'FRICTION'` with `INVALID_CATEGORY` error code referencing PERM-1 and naming `override_friction_disposition` as the FRICTION path.

### NC-19 (Single-writer)

Documented in `proof-mcp/server.js` header comment and in the `withdraw`, `manage_definitions`, `reopen_proof` tool descriptions. No locking mechanism added. Multi-writer support remains explicit out-of-scope evolution.

### Schema evolution discipline

D.1 commits to additive evolution only — every schema addition is backwards-compatible via `??=` backfill (NC-15 backwards-compatible path). Breaking changes (which D.1 does not make) would require an explicit migration tool. Schema evolution categories are: **additive** (new optional field, backfill on load), **breaking** (field rename, type change, removal — requires `schemaVersion` bump + migration tool), **migration-required** (semantic reinterpretation of existing field — requires `schemaVersion` bump + migration tool).

### Boundary contracts published for D.2

D.2 inherits the following as designer-locked Rules (revision requires a D.1 amendment cycle):

- **NC-1** seed submission shape — D.2 must construct seed material satisfying NC-1 at `open_proof`.
- **NC-8** consent token contract — D.2 must capture designer confirmation and attach valid consent tokens to every state-mutating operation.
- **NC-11 / NC-12** closure gate contract — D.2 must orchestrate the three-state gate (Pending / Presented / Confirmed) including stall semantics, round-equality, and re-open invocation when post-go mutations are needed.

## Non-Goals

Explicitly out of scope for D.1:

- Presentation-layer concerns: packet shape, PM register, Translation Gate enforcement, single-topic discipline, pessimist commentary, phase orchestration, round topic selection, voice. (D.2 territory.)
- Two-axis problem space (Structured / Bounded) coordinate handling — meta-language, not proof storage. (D.2 may design rendering and request schema extension via D.1 amendment if proof storage is needed.)
- Multi-writer concurrency support (NC-19 documents single-writer constraint; locking out of scope).
- Per-type disposition set enumeration beyond the two existing closed sets (FRICTION dispositions, withdrawal dispositions); D.1 commits to `DISPOSITIONS_BY_CATEGORY` map structure with current sets reused per category. Ratification of additional per-type sets stays here in this spec via the AC-3.x and AC-2.x clauses.
- Specific overlap-candidate algorithm beyond token-overlap heuristic on `canonical_name` + `aliases`. Spec commits to function signature; algorithm tunable inside the function body.
- Schema v2 — additive-only evolution in D.1.
- Test-suite migration to a different test framework — existing Jest discipline preserved.

## Acceptance Criteria

### AC-1.1 — Designer's open directive captured at proof open

**Observable boundary:**
- After successful `open_proof` call, `state.operationLog[0]` exists, has `op === 'open'`, and `consent.source === 'designer'`.
- The `operationLog[0]` entry is appended **before** any subsequent operation entry (verifiable by inspecting `operationLog` array order).
- Even on rejected `open_proof` (any of the existing error paths at `server.js:444-453` (problem_statement extraction failure), `server.js:458-467` (gate failure), `server.js:482-494` (applyOperations errors)), the consent token is recorded in `operationLog` before the error is returned. State persisted iff at least the operationLog append succeeds.

**Given:** A fresh sprint working directory with no prior proof state file, and a `submission_material` carrying `problem_statement`, initial Concerns, initial Evidence, restructuring action labels per cluster B.1, and a `consent: { source: 'designer', rationale: '<directive text>' }` field.

**When:** Caller invokes `open_proof(state_file, submission_material)`.

**Then:** State file is created with `operationLog[0] === { round: 0, op: 'open', entityId: null, type: null, consent: { source: 'designer', rationale: '<directive text>' }, changedFields: null, provenance: { ... } }`. `proofStatus === 'open'`. `concernsLocked === false`. Each Concern in `state.concerns[]` has `status: 'draft'`. Each NC in `state.elements` has `ratificationStatus: 'draft'`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Seed packet shape enforcement

**Observable boundary:**
- `open_proof` rejects submissions missing any of: `problem_statement`, at least one Concern, at least one Evidence, restructuring action labels on every submitted element.
- Rejection returns `isError: true` with code `INVALID_SEED_PACKET` (or existing equivalent from cluster B.1 open-gate) and human-readable message naming the missing field.
- Pre-rejection, the consent token is recorded in `operationLog` (per AC-1.1).

**Given:** A `submission_material` with one or more required fields missing.

**When:** Caller invokes `open_proof(state_file, submission_material)`.

**Then:** Tool returns error response with `isError: true`. State file either does not exist (first open) or, if a partial-write created it, contains only the operationLog entry for the rejected open.

### AC-2.1 — Element-level auditability via `get_proof_state`

**Observable boundary:**
- For every active element in `get_proof_state` response: `source` field present and non-null.
- For every withdrawn element: `source` preserved (matches pre-withdrawal value); `withdrawal_disposition` field set to a value in the appropriate closed set; element body fields preserved.
- For every Concern: `status` field is `'draft'`, `'ratified'`, or `'withdrawn'`. Each Concern carries `addedInRound` and `revision` fields preserved across history.
- For every NC: both `status` (active/withdrawn) and `ratificationStatus` (draft/ratified) are present and orthogonally settable.
- `state.operationLog` length equals the number of state-mutating operations performed since proof open.

**Given:** A proof state with multiple rounds of operations including adds, revises, ratifications, withdrawals, and at least one auto-created Friction.

**When:** Caller invokes `get_proof_state(state_file)`.

**Then:** Response contains `state` matching the observable-boundary shape above, with `operationLog` array fully populated.

### AC-2.2 — Provenance reconstructable from operationLog

**Observable boundary:**
- For any element ID in the response, filtering `state.operationLog` by `entityId === <id>` produces a chronological history: the `add` entry first, any `revise` entries in order, optionally a `withdraw` or ratification entry last.
- Each `revise` entry's `provenance` field includes `before` and `after` snapshots showing the changed fields.
- Auto-created FRICTION elements have a corresponding `op: 'auto-create-friction'` operationLog entry whose `provenance` field contains `parentOp` (the user-initiated operation that triggered detection) and `parentConsent` (the consent token from that operation).

**Given:** A proof state where element X was added in round 2, revised in round 4, and an auto-created Friction triggered in round 5.

**When:** Caller filters `state.operationLog` by `entityId === X` and inspects round 5 separately for the auto-create-friction entry.

**Then:** Three-entry chronology for X (add, revise) and a separate auto-create-friction entry referencing X as `parentOp.elementId` (or equivalent) and carrying X's revision-round consent token as `parentConsent`.

### AC-3.1 — Consent token shape validation rejects malformed mutations

**Observable boundary:**
- Every state-mutating tool with `consent` argument missing or malformed (not matching `{ source: 'designer' | 'agent-proposed-designer-confirmed', rationale?: string }`) returns `isError: true` with code `INVALID_CONSENT`.
- On rejection: `state.round` unchanged; `state.closingArgPresentedRound` unchanged; `state.closingArgGoRound` unchanged; state file unchanged.
- Read-only tools (`get_proof_state`, `present_closing_argument`) accept calls without consent token.
- Tools applies: `submit_proof_update`, `manage_concerns` (all ops), `manage_friction`, `override_friction_disposition`, `ratify_resolve_condition`, `confirm_closure_go`, `open_proof`, `withdraw`, `manage_definitions` (mutating ops only — `query-overlap` is read-only), `reopen_proof`.

**Given:** A valid open proof state.

**When:** Caller invokes any mutating tool with `consent` field omitted, set to `{}`, set to `{ source: 'unknown' }`, set to `{ source: 'designer' }` without rationale (rationale optional — this case **passes**), or any other shape mismatch.

**Then:** For invalid shapes, response has `isError: true`, `content[0].text` contains `INVALID_CONSENT`, state file mtime unchanged.

### AC-3.2 — Every committed mutation carries a structurally valid consent token

**Observable boundary:**
- For every entry in `state.operationLog` where `op` is a state-mutating operation: `entry.consent` is non-null AND matches the consent token shape AND `consent.source` is one of `'designer'` or `'agent-proposed-designer-confirmed'`.
- Auto-created FRICTION entries carry `entry.consent` equal to the parent operation's consent token (NC-8 inheritance).
- Bulk-ratify entries (op `bulk-ratify`) carry the consent token from `confirm_closure_go`.

**Given:** A proof state with mixed user-initiated operations and auto-created Frictions.

**When:** Caller iterates `state.operationLog` and inspects each entry's `consent` field.

**Then:** Every state-mutating entry has a structurally valid token; no entry has `consent === null` except for the migrated-legacy carve-out (entries from state files that predate D.1 — backfill to null is documented).

### AC-3.3 — `withdraw` rejects FRICTION category per PERM-1

**Observable boundary:**
- `withdraw(state_file, category: 'FRICTION', ...)` returns `isError: true` with code `INVALID_CATEGORY` and message naming `override_friction_disposition` as the FRICTION terminal-disposition path.
- `withdraw` accepts every other category from the closed 9-category set: `EVIDENCE`, `RULE`, `PERMISSION`, `NECESSARY_CONDITION`, `RISK`, `RESOLVE_CONDITION`, `CONCERN`, `DEFINITION`.
- For each accepted category, `withdraw` validates `disposition` against `DISPOSITIONS_BY_CATEGORY[category]` and returns `INVALID_DISPOSITION` on mismatch.

**Given:** A proof state with at least one element of every category.

**When:** Caller invokes `withdraw(state_file, 'FRICTION', '<friction-id>', 'lived-with', <consent>)`.

**Then:** Error response with `INVALID_CATEGORY`. State unchanged. Subsequent `override_friction_disposition('<friction-id>', 'lived-with', <consent>)` succeeds.

### AC-4.1 — Closure envelope is complete per NC-9

**Observable boundary:**
- After successful `present_closing_argument`, response object contains: `problemStatement`, `lockedConcerns`, `phantomConcerns`, `resolveConditions`, `phantomRCs`, `activeNCs`, `draftNCs`, `phantomNCs`, `activeRules`, `activePermissions`, `activeRisks`, `liveFriction`, `phantomFriction`, `ratifiedDefinitions`, `phantomDefinitions`, `closureProvenance`, `compositeScore`, `closurePermitted`, `closureReasons`.
- Every cited element across these arrays has full structure (statement, source, addedInRound, revision, history per type).
- For NCs: `grounding`, `collapse_test`, `reasoning_chain`, `rejected_alternatives` present.
- For RCs: five attributes present (observable, ratification, problem_anchor, forward-looking phrasing, non-restrictive).
- For Permissions: `relieves` field present.
- For Risks: `basis` field present.
- For Definitions: `canonical_name`, `aliases`, `definition`, `sense_constraints` present.

**Given:** A proof state where `concernsLocked === true`, every Concern has `status: 'ratified'`, at least one ratified NC, at least one ratified RC, at least one Rule, at least one Permission, at least one Risk, at least one ratified Definition, at least one withdrawn element of each category capable of withdrawal.

**When:** Caller invokes `present_closing_argument(state_file)`.

**Then:** Response object contains every field listed above, every cited element has full structure, no field is `undefined`.

### AC-4.2 — Closure provenance chain is reconstructable from operationLog

**Observable boundary:**
- For every entry in `closureProvenance`: fields `entityId`, `type`, `source`, `derivationChain`, `ratification`, `restructuringActionLabel` are present.
- `derivationChain` is an array of operationLog entries filtered by `entityId === <entry.entityId>`, in chronological order.
- `ratification` is the ratification record for the element (round, by) where applicable; null for elements that don't ratify (e.g., Evidence per RULE-7).
- `restructuringActionLabel` is the action label assigned at `open_proof` per cluster B.1 (verbatim-preserve / reshape / gap-fill / infer / derive); null for elements added after open_proof.

**Given:** A proof state from AC-4.1's setup with full operation history.

**When:** Caller inspects `present_closing_argument` response's `closureProvenance` array.

**Then:** Every cited element has a complete provenance entry; `derivationChain` matches `state.operationLog` filtered by entityId.

### AC-4.3 — Closure derivation is pure and idempotent

**Observable boundary:**
- Calling `present_closing_argument` twice in the same round (without intervening mutations) produces identical output (deep-equal).
- `deriveClosingArgument` (the internal pure function) called directly with a state object produces output deep-equal to what `handlePresentClosingArgument` returns when the handler is called against the same persisted state.
- No I/O, no mutation of input state, no console output from `deriveClosingArgument`.

**Given:** A proof state ready for closure (per AC-4.1 setup).

**When:** Caller invokes `present_closing_argument` twice in immediate succession (same round; no mutation between).

**Then:** Both responses are deep-equal. Caller verifies via `JSON.stringify(r1) === JSON.stringify(r2)`.

### AC-4.4 — Hard gate refuses incomplete closure

**Observable boundary:**
- `present_closing_argument` returns `isError: true` with code `CONCERNS_UNRATIFIED` when any active Concern has `status: 'draft'`, even if `concernsLocked === true`.
- `present_closing_argument` returns `isError: true` with code `CONCERNS_UNLOCKED` when `concernsLocked === false`, even if every Concern has `status: 'ratified'`.
- Both checks share a single helper `concernsRatificationGate(state)` so `evaluateTrigger` and `handlePresentClosingArgument` cannot drift.

**Given:** A proof state in three configurations: (a) all Concerns ratified but `concernsLocked === false`; (b) `concernsLocked === true` but at least one Concern `status: 'draft'`; (c) both conditions satisfied.

**When:** Caller invokes `present_closing_argument` against each configuration.

**Then:** (a) and (b) return errors with the respective codes. (c) returns the closure envelope per AC-4.1.

### AC-5.1 — Two-yes gate enforces same-round view-and-go

**Observable boundary:**
- `confirm_closure_go` returns `isError: true` with code `GO_REQUIRES_VIEW_THIS_ROUND` (or equivalent existing code) when `state.closingArgPresentedRound !== state.round`.
- Any state-mutating operation between `present_closing_argument` and `confirm_closure_go` clears `closingArgPresentedRound` to null (existing `clearClosingFlags` behavior preserved).
- Successful `confirm_closure_go` sets `state.closingArgGoRound = state.round`, `state.proofStatus = 'closed'`, and bulk-ratifies all draft NCs and unratified active RCs.
- Bulk-ratification does **not** call `clearClosingFlags`. Implementation explicitly skips the established mutation pattern at this site.

**Given:** A proof state ready for closure (per AC-4.1).

**When:** Sequence A: `present_closing_argument` (round N), `confirm_closure_go` (round N) → expect success. Sequence B: `present_closing_argument` (round N), `submit_proof_update` (any mutation, increments round to N+1), `confirm_closure_go` (round N+1) → expect rejection. Sequence C: `present_closing_argument` (round N), no mutation, no go, then a fresh round somehow reached (e.g., second `present_closing_argument` returns the same envelope per AC-4.3 but does not advance round).

**Then:** Sequence A: state has `proofStatus === 'closed'`, all draft NCs/active-unratified RCs transitioned to ratified, `closingArgGoRound === N`. Sequence B: error `GO_REQUIRES_VIEW_THIS_ROUND`, state unchanged from before the `confirm_closure_go` call.

### AC-5.2 — Re-open clears closure flags but preserves closure artifact

**Observable boundary:**
- `reopen_proof(state_file, consent)` rejects with `NOT_CLOSED` when `state.proofStatus !== 'closed'`.
- On success: `state.proofStatus === 'open'`; `state.closingArgPresentedRound === null`; `state.closingArgGoRound === null`; `state.lastClosureArtifact` is a deep copy of the closure envelope at the moment of re-open; `state.concernsLocked` is unchanged from its value before re-open (preserved).
- After re-open, subsequent state-mutating operations succeed with valid consent tokens.

**Given:** A proof state with `proofStatus === 'closed'` and a populated set of ratified NCs and Concerns.

**When:** Caller invokes `reopen_proof(state_file, consent)`.

**Then:** State transitions per the observable boundary. `state.lastClosureArtifact` exists and equals the closure envelope captured at re-open time (deep-equal to `deriveClosingArgument(stateBeforeReopen)`).

### AC-5.3 — Mutation between view and go forces re-presentation

**Observable boundary:**
- After `present_closing_argument` (round N), any of these calls clear `closingArgPresentedRound` to null (existing behavior — preserved): `submit_proof_update` add/revise/withdraw, `manage_concerns add | lock | ratify`, `manage_friction`, `override_friction_disposition`, `ratify_resolve_condition`, `manage_definitions add | revise | deprecate | ratify`, `withdraw`.
- `reopen_proof` itself also clears the flags.
- `get_proof_state` and a second `present_closing_argument` (same round) do **not** clear flags.

**Given:** A proof state where `closingArgPresentedRound === N` (i.e., `present_closing_argument` was just called).

**When:** Caller invokes any of the listed mutating tools.

**Then:** Post-call state has `closingArgPresentedRound === null`. A subsequent `confirm_closure_go` returns `GO_REQUIRES_VIEW_THIS_ROUND`.

### AC-5.4 — Closure artifact retained on re-open is immutable

**Observable boundary:**
- After `reopen_proof`, subsequent mutations to the proof body do not modify `state.lastClosureArtifact`.
- A second `confirm_closure_go` (after a fresh present + go cycle following re-open) overwrites `state.lastClosureArtifact` only via a subsequent `reopen_proof` call — not as a side effect of the second go.
- `state.lastClosureArtifact` is a frozen-at-re-open snapshot; comparing it post-reopen to a fresh `deriveClosingArgument(state)` reveals any drift introduced by post-reopen mutations.

**Given:** A proof state with `proofStatus === 'closed'`, then re-opened.

**When:** Caller adds a new NC, revises an RC, then calls `present_closing_argument` followed by `confirm_closure_go`. Then calls `get_proof_state`.

**Then:** `state.lastClosureArtifact` continues to hold the first-close envelope (captured at the first re-open). The second close cycle does **not** overwrite `state.lastClosureArtifact` — the field is captured only at `reopen_proof` time, not at `confirm_closure_go` time. If a second re-open is later invoked against the now twice-closed proof, the second re-open captures the second-close envelope into `lastClosureArtifact` (overwriting the first-close envelope at that point).

### AC-6.1 — Atomic persistence on save failure

**Observable boundary:**
- `saveState` writes JSON to `<state_file>.tmp` then renames to `<state_file>`. On any throw during either step, the function rethrows; the caller's try/catch returns `{ code: 'PERSIST_FAILED' }`.
- If the rename step throws (filesystem issue, permission, disk full), the original `<state_file>` is unchanged. The `.tmp` file may remain on disk; cleanup is best-effort and does not affect correctness.
- If the write step throws before the rename, both `<state_file>` and any prior `.tmp` are unchanged.

**Given:** A mocked `fs.renameSync` that throws on call.

**When:** Caller invokes any state-mutating tool that triggers `saveState`.

**Then:** Tool returns `isError: true` with code `PERSIST_FAILED`. Reading the state file via a fresh `loadState` call returns the pre-mutation state.

### AC-6.2 — Schema-version refusal on forward-incompatible state files

**Observable boundary:**
- `loadState` against a state file with `schemaVersion: 2` (or any value > current `SCHEMA_VERSION`) throws `SchemaVersionError`. Tool handlers catch this and return `isError: true` with code `SCHEMA_VERSION_TOO_NEW`.
- `loadState` against a state file with `schemaVersion: 1` proceeds normally.
- `loadState` against a state file with no `schemaVersion` field (legacy) backfills to `SCHEMA_VERSION` and proceeds normally.

**Given:** Three state file fixtures: one with `schemaVersion: 2`, one with `schemaVersion: 1`, one without the field.

**When:** Caller invokes any tool against each fixture.

**Then:** First fixture rejects with `SCHEMA_VERSION_TOO_NEW`. Second and third fixtures process successfully.

---

## Provenance trailer

<!-- chester-trailer-end -->

<!-- created-at: 2026-05-07T09:41:32Z -->
<!-- produced-by design-specify@v0003 -->
