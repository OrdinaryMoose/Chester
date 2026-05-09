# Spec: Render Proof State

**Sprint:** sprint-d-1-fix-proof-mcp-3
**Parent brief:** docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/design/sprint-d-1-fix-proof-mcp-3-design-00.md
**Architecture:** Hybrid — split-module-with-helpers (render module) + partitioner extraction inside closing-argument.js + multi-storage element lookup

## Goal

Add a designer-readable rendering surface to the proof MCP. Today the system exposes its state through `get_proof_state` (structured form) and a counts-and-IDs summary; neither produces the bulleted, full-text recap a designer reads mid-conversation when the proof has grown past a few dozen elements. This sprint ships a new read-only tool — `render_proof_state` — registered on the proof MCP. The tool has two modes: with no `element_id` it produces a fast bulleted recap of the active proof body, organized into eight markdown sections — a Problem Statement preamble followed by seven element-listing sections (concerns, rules, permissions, evidence, necessary conditions, resolve conditions, risks). With an `element_id` it produces a deep render of that single element with all its sub-fields. Output is inline-only — no disk-write surface. The recap path consumes the closing-argument envelope's type-and-status partitioner as its source of truth so the two call sites cannot drift.

## Components

- `proof-mcp/closing-argument.js` (modified) — new named export `partitionActiveElements(state)` extracted from the active-by-type filter expressions inside `deriveClosingArgument`. Returns a plain object with **raw active-by-type lanes only** — no field projection, no sub-mapping, no disposition-tag wrapping. The lanes are `activeNCsAll` (all NC elements with `status === 'active'`, regardless of `ratificationStatus` — distinct from `deriveClosingArgument`'s published `activeNCs` key, which is ratified-only), `activeRCs` (all RC elements with `status === 'active'`), `activeRules`, `activePermissions`, `activeEvidence`, `activeRisks` (each `type === T && status === 'active'`), and `activeConcerns` (concerns with `status !== 'withdrawn'`). Each lane contains raw element objects from `state.elements` (or raw concern objects from `state.concerns`), not projected/mapped shapes. **Closure-specific computation stays inside `deriveClosingArgument`** and runs after the partitioner call: the ratification split (`activeNCs` ratified vs draft), the `resolveConditions` projection (with `groundingNCs` sub-lookup), the `liveFriction`/`phantomFriction` field projection, the `phantomNCs`/`phantomRCs`/`phantomConcerns`/`phantomDefinitions`/`ratifiedDefinitions` partitions, the `lockedConcerns` proofStatus-conditional logic, and the `closureProvenance` derivation are all computed by `deriveClosingArgument` itself, not by the partitioner. This split keeps the partitioner as the pure type-and-status filter both consumers share, and keeps closure-specific work isolated to its single consumer. `deriveClosingArgument`'s pre-extraction return shape is preserved byte-identical.
- `proof-mcp/state-render.js` (new) — provides:
  - Markdown primitive helpers — `renderHeading(title)`, `renderBullet(id, meta, summary)`, `renderSubBullet(label, value)`. The sub-bullet helper returns the empty string when `value` is absent (`undefined`/`null`/empty array).
  - Heuristic helpers — `isOutsizedRule(statement, threshold)` (counts numbered sub-clauses against threshold) and `firstSentence(text)` (returns the first sentence of a statement for outsized-rule summaries).
  - Module-level constant — `OUTSIZED_RULE_THRESHOLD = 3`.
  - Per-type render functions — `renderNC(el)`, `renderRule(el, outsized)`, `renderRC(el)`, `renderConcern(c)`, `renderEvidence(el)`, `renderPermission(el)`, `renderRisk(el)`. Each prints the sub-fields the brief specifies for that type. `renderRC(el)` reads only `el.statement`, `el.problem_anchor`, `el.ratification`, and `el.grounding` (a string array of NC IDs) — no `state` parameter is needed because the design scope renders grounding NCs as bare IDs only (per brief out-of-scope: "Reference IDs render as IDs").
  - Multi-storage element lookup helper — `findElementById(state, id)` that dispatches on ID prefix to the seven element types in deep-render scope: `NCON-`, `RULE-`, `PERM-`, `EVID-`, `RISK-`, `RCON-` go to `state.elements.get(id)`; `CERN-` goes to `state.concerns.find(c => c.id === id)`. Returns `null` when not found. **Out of scope:** `FRIC-` (FRICTION) and `DEFN-` (DEFINITION) prefixes are not routed — the brief's deep-render enumeration covers seven types and excludes both. A deep-render call against an unrouted prefix returns `ELEMENT_NOT_FOUND` via the same path as an unknown ID.
  - Top-level exports — `renderProofRecap(state, partition)` (consumes `partitionActiveElements`'s output) and `renderElementDeep(elementId, state)` (uses `findElementById` internally).
- `proof-mcp/server.js` (modified) — imports `partitionActiveElements` from `./closing-argument.js` and `renderProofRecap`, `renderElementDeep` from `./state-render.js`; adds `render_proof_state` to the `TOOLS` array; adds a dispatcher case routing to `handleRenderProofState`; exports `handleRenderProofState({ state_file, element_id })`.
- `proof-mcp/__tests__/render-proof-state.test.js` (new) — covers AC-2.1 through AC-3.4 against fixture proof states built with the existing `applyOperations` / `addConcern` / `ratifyResolveCondition` / `ratifyNecessaryCondition` seeding pattern.

## Data Flow

A `render_proof_state` call moves through three layers:

1. **Dispatcher (`server.js`)** — request hits the `CallToolRequestSchema` handler, the `switch` matches the tool name, and control passes to `handleRenderProofState({ state_file, element_id })`.
2. **Handler (`server.js`)** — calls `loadState(state_file)`. No consent token check, no `proofStatus === 'finish'` guard. Branches on `element_id`:
   - **Recap mode** (no `element_id`) — calls `partitionActiveElements(state)` from `closing-argument.js`, then `renderProofRecap(state, partition)` from `state-render.js`. Returns the rendered string in `{ content: [{ type: 'text', text: rendered }] }` shape.
   - **Deep render mode** (`element_id` provided) — calls `renderElementDeep(element_id, state)` from `state-render.js`. The render module uses `findElementById` to locate the element across `state.elements` (Map), `state.concerns` (array), or `state.definitions` (array). When the lookup returns `null`, the handler returns the structured `ELEMENT_NOT_FOUND` refusal with `isError: true`. On success, returns the rendered string in standard tool-result shape.
3. **Render module (`state-render.js`)** — `renderProofRecap` walks the partition's active lanes, emits seven section headings via `renderHeading`, and for each active element invokes the per-type render function with `renderBullet` / `renderSubBullet` primitives. Rules are passed through `isOutsizedRule` first; outsized rules render with `firstSentence(statement)` plus a parenthetical pointer to deep render. `renderElementDeep` resolves the element via `findElementById` and dispatches to the per-type render function for full sub-field output.

## Error Handling

- **Unknown `element_id`** — the only structured refusal path. When `element_id` is supplied but `findElementById` returns `null`, the handler returns:
  ```
  { content: [{ type: 'text', text: JSON.stringify({ code: 'ELEMENT_NOT_FOUND', message: 'Element <id> not found in state.' }) }], isError: true }
  ```
  No fallback to recap. The agent must fix the ID and re-call.
- **Active vs withdrawn in deep mode** — deep render returns the requested element regardless of `status`. Withdrawn elements surface their `withdrawal_disposition` in the rendered metadata. There is no refusal for "withdrawn" status when the ID is supplied.
- **Active-only filtering in recap mode** — recap omits withdrawn elements by construction (the partitioner's active lanes do not include them). This is not an error path; it is the recap's data contract.
- **No consent failures** — the handler accepts no `consent` field. Calls succeed regardless of `proofStatus` value, including `'finish'`.
- **No filesystem failures** — the handler performs no filesystem write under any input. `loadState`-side I/O errors propagate through the existing top-level `try`/`catch` in the dispatcher.

## Testing Strategy

- **New test file:** `proof-mcp/__tests__/render-proof-state.test.js`.
- **Fixture pattern:** mirrors `closing-argument.test.js` — call `initializeState`, seed with `addConcern` / `ratifyConcern` / `applyOperations` / `ratifyResolveCondition` / `ratifyNecessaryCondition` / `manageFriction` / `manageDefinitions`, then drive the render tool via direct calls to `handleRenderProofState` (or `renderProofRecap` / `renderElementDeep` where finer-grained assertions are needed).
- **Test categories:**
  - Recap happy path — seven section headings appear in canonical order; each active element renders as one bulleted line; withdrawn elements absent.
  - Outsized-rule annotation — rule with three or more numbered sub-clauses renders with `firstSentence` plus parenthetical pointer; rule with fewer renders full statement.
  - Deep-render happy path per element type — NC, Rule, RC, Concern, Evidence, Permission, Risk; each surfaces the sub-fields the brief specifies for that type.
  - Deep-render withdrawn element — explicitly request a withdrawn element ID; output includes `withdrawal_disposition`.
  - Deep-render unknown ID — returns `ELEMENT_NOT_FOUND` structured refusal with `isError: true`.
  - Multi-storage lookup — deep render works against `CERN-` (concerns array) and `DEFN-` (definitions array) IDs as well as `NCON-` / `RCON-` / `RULE-` / `PERM-` / `EVID-` / `RISK-` / `FRIC-` (elements Map).
  - Partitioner sharing — assert that `partitionActiveElements` is exported from `closing-argument.js` and that `deriveClosingArgument` continues to return the canonical closing-argument shape (regression guard for the extraction).
- **Target test count:** approximately 12–18 cases across the categories above.
- **Coverage expectation:** every AC in Sections 2 and 3 has at least one test case directly observing its boundary; AC-4.1 is satisfied by the file's existence and passing under the standard test command; AC-4.2 is satisfied by the existing closing-argument test file remaining green after the partitioner extraction.

## Constraints

- **Read-only contract** — `render_proof_state` requires no consent token, performs no state mutation, and is not gated by `proofStatus`. Calls succeed against `proofStatus === 'finish'` proofs. Source: existing precedent for `get_proof_state` and `manage_definitions op:query-overlap`.
- **Closure envelope contract preserved** — the partitioner extraction does not change what `deriveClosingArgument` returns. No new fields, no removed fields, no renamed lanes. The change is internal: inline filters become a named function call and spread.
- **Deterministic markdown** — same proof state produces byte-identical rendered output every time the call fires. Section order is fixed (Problem Statement preamble, then Concerns, Rules, Permissions, Evidence, Necessary Conditions, Resolve Conditions, Risks — eight headings total). Within each element-listing section, elements render in ID-ascending order.
- **Single source of truth for active-by-type filtering** — `partitionActiveElements` is the only producer of the type-and-status partition. Both `deriveClosingArgument` and `renderProofRecap` consume it. The render module does not re-implement type/status filtering.
- **Inline-only output** — the tool returns the rendered string in the standard tool-result `content` shape. No `output_path` parameter exists in the input schema; no filesystem write occurs in any handler branch.
- **Markdown only** — output is plain markdown with no embedded raw state JSON or schema fragments. The `get_proof_state` call remains the only path to raw state form.
- **Existing tests stay green** — partitioner extraction is a refactor: closing-argument tests and any test that reads from `closing-argument.js` continue to pass without modification.
- **Module conventions** — new module follows existing proof MCP shape (named exports, ES modules, no default export). Tool registration follows the existing TOOLS-array + dispatcher-case + exported-handler pattern.

## Non-Goals

- No disk-write surface. No `output_path` input, no path validation, no parent-directory checks, no overwrite policy.
- No `verbosity`, `include_withdrawn`, `include_logs` input axes. The recap-plus-deep-render-on-demand pattern subsumes these.
- No section filtering. Default = full proof at recap level.
- No alternate output formats (no JSON-compact, no structured-envelope-shape). Markdown only.
- No recursive expansion of referenced IDs in deep render. Reference IDs render as IDs; the agent invokes deep render on each referenced ID separately.
- No closing-argument envelope contract changes beyond extracting the named partitioner function. No new fields returned at closure.
- No renaming, restructuring, or behavior changes to any existing proof MCP tool, file, or function whose surface is unchanged.

## Acceptance Criteria

### AC-1.1 — Tool registered in TOOLS array with correct schema

**Observable boundary:**
- `TOOLS` array in `proof-mcp/server.js` contains an entry with `name: 'render_proof_state'`.
- That entry's `inputSchema` declares `state_file` as required string and `element_id` as optional string; declares no `consent` property; `required` array contains exactly `['state_file']`.
- The dispatcher's `switch` in the `CallToolRequestSchema` handler routes `'render_proof_state'` to `handleRenderProofState(args)`.
- `handleRenderProofState` is a named export of `proof-mcp/server.js`.

**Given:** the proof MCP server module is loaded.
**When:** the test inspects the `TOOLS` array, the `inputSchema`, and the module's exported names.
**Then:** the entry, schema shape, dispatcher case, and exported handler are all observable as specified.

**Implementing tasks:**

**Decisions:**

### AC-1.2 — Read-only contract: no consent token, no proofStatus gating

**Observable boundary:**
- `handleRenderProofState`'s argument destructuring contains no `consent` field; the function does not call `validateConsentToken`.
- Calling `handleRenderProofState({ state_file })` against a state with `proofStatus === 'finish'` returns a non-error result whose `content[0].text` is the rendered recap (not a `PROOF_FINISHED` refusal).
- Calling `handleRenderProofState({ state_file })` against any state without supplying a consent token returns a non-error result.

**Given:** a fixture state file written with `proofStatus: 'finish'`.
**When:** `handleRenderProofState({ state_file })` is invoked with no consent argument.
**Then:** the call returns a normal `{ content: [...] }` result without `isError`, and the rendered text is the seven-section recap.

**Implementing tasks:**

**Decisions:**

### AC-1.3 — Inline-only output: no output_path input, no filesystem writes

**Observable boundary:**
- `inputSchema.properties` for `render_proof_state` does not include any `output_path` key.
- `handleRenderProofState` source contains no calls to `writeFileSync`, `renameSync`, or `saveState`.
- Calling the handler against a fixture state directory leaves directory contents byte-identical (no files created, modified, or removed) other than the existing state file's read.

**Given:** a fixture state file in an isolated temp directory with the state file as its only entry.
**When:** `handleRenderProofState({ state_file })` is invoked (recap mode) and again with a valid `element_id` (deep mode).
**Then:** the temp directory contents after both calls equal the contents before, byte-for-byte.

**Implementing tasks:**

**Decisions:**

## Section 2 — Recap mode

### AC-2.1 — Seven-section recap output structure with active-only filtering

**Observable boundary:**
- The rendered string contains exactly eight section headings in this order: `Problem Statement`, `Concerns`, `Rules`, `Permissions`, `Evidence`, `Necessary Conditions`, `Resolve Conditions`, `Risks`. The Problem Statement section presents the `state.problemStatement` text; the remaining seven sections list elements.
- Each active element appears once as a bulleted line of the form `- **<ID>** _(<metadata>)_ — <statement-summary>`.
- Withdrawn elements (any `status !== 'active'`) do not appear in any section.
- Within each section, elements render in ID-ascending numeric order.

**Given:** a fixture state with at least one active element of each type (NC, Rule, Permission, Evidence, Risk, RC, Concern) and at least one withdrawn element of each type.
**When:** `handleRenderProofState({ state_file })` is invoked (no `element_id`).
**Then:** the rendered text contains all seven section headings in order, each active element appears once on its own bulleted line under the correct section, and no withdrawn element ID appears anywhere in the output.

**Implementing tasks:**

**Decisions:**

### AC-2.2 — Outsized-rule annotation behavior with threshold constant

**Observable boundary:**
- `state-render.js` exports a module-level constant `OUTSIZED_RULE_THRESHOLD` with value `3`.
- For a rule whose statement contains numbered sub-clauses at or above the threshold, the recap line renders as `**<ID>** — <firstSentence>. (<N> sub-clauses — request deep render to view in full)` where `<N>` is the sub-clause count.
- For a rule whose statement contains numbered sub-clauses below the threshold (or none), the recap line renders the full statement inline (no parenthetical pointer).
- `isOutsizedRule(statement, threshold)` is exported and returns `true` only when the statement's numbered-sub-clause count is at least `threshold`.

**Given:** two rules in fixture state — one with five numbered sub-clauses in its `statement`, one with one short sentence.
**When:** the recap renders.
**Then:** the five-sub-clause rule's line ends with `(5 sub-clauses — request deep render to view in full)` after `firstSentence`, and the short rule's line contains its full statement with no parenthetical annotation.

**Implementing tasks:**

**Decisions:**

### AC-2.3 — Partitioner-sharing wiring (single source of truth in closing-argument.js)

**Observable boundary:**
- `proof-mcp/closing-argument.js` exports a named function `partitionActiveElements(state)` that returns an object with exactly seven keys, each holding raw element objects (or raw concern objects) — no field projection, no sub-mapping:
  - `activeNCsAll` — every element with `type === 'NECESSARY_CONDITION'` and `status === 'active'`, regardless of `ratificationStatus`. **Name distinct from `deriveClosingArgument`'s published `activeNCs` key**, which retains its ratified-only meaning.
  - `activeRCs` — every element with `type === 'RESOLVE_CONDITION'` and `status === 'active'`
  - `activeRules` — every element with `type === 'RULE'` and `status === 'active'`
  - `activePermissions` — every element with `type === 'PERMISSION'` and `status === 'active'`
  - `activeEvidence` — every element with `type === 'EVIDENCE'` and `status === 'active'`
  - `activeRisks` — every element with `type === 'RISK'` and `status === 'active'`
  - `activeConcerns` — every concern in `state.concerns` with `status !== 'withdrawn'`
- `deriveClosingArgument(state)` calls `partitionActiveElements(state)` once at its top. It uses the partition's `activeNCsAll` lane to derive its own ratification split (the published `activeNCs` ratified-only and `draftNCs` draft-only outputs) internally; uses `activeRCs` to derive its `resolveConditions` projection (with `groundingNCs` sub-lookup); uses `activeRules`/`activePermissions`/`activeRisks` directly. It computes `liveFriction`, `phantomFriction`, `phantomNCs`, `phantomRCs`, `lockedConcerns` (proofStatus-conditional), `phantomConcerns`, `ratifiedDefinitions`, `phantomDefinitions`, and `closureProvenance` inside itself — these are NOT in the partitioner.
- `proof-mcp/state-render.js` imports `partitionActiveElements` from `./closing-argument.js` (the only import path for partition data).
- `state-render.js`'s recap path (`renderProofRecap`) accesses each section's elements only through the partition object returned by `partitionActiveElements`. It does not walk `state.elements`, `state.concerns`, or `state.definitions` directly to derive section contents.
- `deriveClosingArgument`'s pre-extraction return shape is preserved byte-identical: every key the existing closing-argument tests assert on remains present with equivalent values.

**Given:** a fixture state containing one active NC, one active RC, one active Rule, one active Permission, one active Evidence, one active Risk, and one ratified Concern. A render-side test loads the fixture, calls `partitionActiveElements`, then calls `renderProofRecap`.
**When:** the test asserts (a) `partitionActiveElements`'s return contains the seven named lanes with the expected element instances; (b) `renderProofRecap`'s output contains each fixture element's ID under the correct section heading; (c) the existing `closing-argument.test.js` suite passes against the refactored `deriveClosingArgument`; (d) a render-side test that mutates a returned partition lane (adding a fake element) observes the mutation reflected in the recap output (proving the recap reads from the partition rather than re-deriving from state).
**Then:** all four assertions hold — confirming the partition is the single source of truth and `deriveClosingArgument`'s output shape is preserved.

**Implementing tasks:**

**Decisions:**

## Section 3 — Deep render mode

### AC-3.1 — Per-type element rendering with all sub-fields

**Observable boundary:**
- `renderElementDeep(elementId, state)` returns a markdown string whose body, per element type, contains the following sub-fields:
  - **NECESSARY_CONDITION:** `statement`, `grounding`, `reasoning_chain`, `collapse_test`, `rejected_alternatives` (omitted gracefully via `renderSubBullet` when absent).
  - **RULE:** full `statement` including any sub-clauses (no truncation, no parenthetical pointer in deep mode).
  - **RESOLVE_CONDITION:** `statement`, `problem_anchor`, `ratification`, `groundingNCs` (NC IDs from `el.grounding`).
  - **CONCERN:** `label`, `description`, `status`.
  - **EVIDENCE:** `statement`, `source`.
  - **PERMISSION:** `statement`, `relieves`.
  - **RISK:** `statement`, `basis`.
- Optional fields absent on a given element produce no sub-bullet line (no `null`/`undefined` text leaks into output).

**Given:** a fixture state with one fully-populated element of each type.
**When:** `renderElementDeep(<id>, state)` is called for each element ID.
**Then:** each rendered output contains the sub-field labels listed above for that type, and rendering an element with `rejected_alternatives: []` produces output that does not include a `rejected_alternatives` sub-bullet.

**Implementing tasks:**

**Decisions:**

### AC-3.2 — Active-or-withdrawn element retrieval by ID, withdrawal_disposition surfaced

**Observable boundary:**
- `renderElementDeep` returns a non-empty rendered string for both `status: 'active'` and `status: 'withdrawn'` elements when the ID exists.
- For a withdrawn element, the rendered metadata segment includes the value of `withdrawal_disposition`.
- `handleRenderProofState({ state_file, element_id })` returns the deep render (not an error) when called with a withdrawn element's ID.

**Given:** a fixture state where `NCON-2` is active and `NCON-3` was withdrawn with `withdrawal_disposition: 'superseded'`.
**When:** `handleRenderProofState({ state_file, element_id: 'NCON-3' })` is invoked.
**Then:** the result is non-error, the rendered text contains `NCON-3` and the disposition string `superseded`, and the same call against `NCON-2` also succeeds.

**Implementing tasks:**

**Decisions:**

### AC-3.3 — Multi-storage ID lookup across elements Map, concerns array, definitions array

**Observable boundary:**
- `findElementById(state, id)` is a named export of `state-render.js`.
- For an `id` matching prefix `NCON-`, `RULE-`, `PERM-`, `EVID-`, `RISK-`, or `RCON-`, the function returns `state.elements.get(id)` (or `null` if absent).
- For an `id` matching prefix `CERN-`, the function returns `state.concerns.find(c => c.id === id)` (or `null` if absent).
- For prefixes outside this set (including `FRIC-` and `DEFN-`, which are out of deep-render scope per the brief), the function returns `null`. `handleRenderProofState` then falls through to the `ELEMENT_NOT_FOUND` refusal path (AC-3.4).
- Deep render against `CERN-1` succeeds and dispatches to `renderConcern`. Deep render against any of the six in-scope element-Map prefixes succeeds and dispatches to the matching per-type render function.

**Given:** a fixture state with `CERN-1` (ratified concern), `RULE-1` (active rule), and `FRIC-1` (active friction; out of scope for deep render).
**When:** `findElementById` is invoked for each ID and `handleRenderProofState` is invoked with each `element_id`.
**Then:** lookups for `CERN-1` and `RULE-1` return the correct stored objects and their deep renders return non-error results referencing the requested ID; the `FRIC-1` lookup returns `null` and `handleRenderProofState({ state_file, element_id: 'FRIC-1' })` returns `ELEMENT_NOT_FOUND` per AC-3.4.

**Implementing tasks:**

**Decisions:**

### AC-3.4 — Unknown ID returns ELEMENT_NOT_FOUND structured refusal with isError true

**Observable boundary:**
- `handleRenderProofState({ state_file, element_id: 'NCON-999' })` against a state where `NCON-999` is absent returns a result with `isError: true`.
- That result's `content[0].text` parses as JSON and equals `{ code: 'ELEMENT_NOT_FOUND', message: 'Element NCON-999 not found in state.' }` (the message names the missing ID).
- No partial recap content is included in the result.

**Given:** a fixture state containing only `NCON-1`.
**When:** `handleRenderProofState({ state_file, element_id: 'NCON-999' })` is invoked.
**Then:** the result has `isError: true`, the parsed JSON body has `code === 'ELEMENT_NOT_FOUND'`, and the `message` field contains `'NCON-999'`.

**Implementing tasks:**

**Decisions:**

## Section 4 — Test coverage

### AC-4.1 — New test file covering AC-2.1 through AC-3.4 against fixture states

**Observable boundary:**
- The file `proof-mcp/__tests__/render-proof-state.test.js` exists.
- The file uses the existing fixture pattern (`mkdtempSync` for state-file isolation, `initializeState` + `applyOperations` + concern/ratify helpers for seeding, vitest `describe`/`it`/`expect`).
- The file contains at least one `it` block that, by name or assertion content, covers each of AC-2.1, AC-2.2, AC-2.3, AC-3.1, AC-3.2, AC-3.3, AC-3.4.
- The file passes when run via the standard test command (`npm test` / vitest).

**Given:** a clean checkout with the new render module, server changes, partitioner extraction, and new test file in place.
**When:** the standard test command is run.
**Then:** `proof-mcp/__tests__/render-proof-state.test.js` runs and all its cases pass; each AC listed above has at least one passing test directly observing its boundary.

**Implementing tasks:**

**Decisions:**

### AC-4.2 — Existing test suite remains green; partitioner extraction does not regress closing-argument tests

**Observable boundary:**
- All existing test files in `proof-mcp/__tests__/` continue to pass after the partitioner extraction and the new module's introduction.
- In particular, `closing-argument.test.js` and `closing-argument-end-to-end.test.js` pass without modification.
- No existing test file is edited by this sprint (the change is additive: one new test file, no edits to existing ones).

**Given:** the full pre-sprint test suite.
**When:** the test suite is run after the sprint's changes are in place.
**Then:** every existing test file passes; no existing test file is modified in the sprint diff.

**Implementing tasks:**

**Decisions:**

<!-- created-at: 2026-05-09T11:18:34Z -->
<!-- produced-by design-specify@v0003 -->
