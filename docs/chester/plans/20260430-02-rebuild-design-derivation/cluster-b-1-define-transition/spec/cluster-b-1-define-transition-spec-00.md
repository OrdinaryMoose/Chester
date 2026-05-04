# Spec: Cluster B.1 — Define Transition

**Sprint:** `cluster-b-1-define-transition`
**Parent brief:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/design/cluster-b-1-define-transition-design-00.md`
**Architecture:** Layered Depth Hybrid — single MCP tool with three internal phases; rule-table mechanical restructuring + anchor-disciplined infer/derive escape hatches.

## Goal

Implement Phase 4b's contract surface as a single new MCP tool (`open_proof`) that accepts an untrusted caller submission, restructures it into typed proof elements per a 4b-owned schema, and opens the proof for downstream reasoning. The boundary is permissive (any submission shape accepted); rigor lives in the internal restructuring phase. Open is gated on the presence of restructuring action labels, provenance records, and a restructuring report per element. Failed gate returns the report and diagnostics; the caller may resubmit per R6 (single-shot transition).

## Components

**New files** (under `skills/design-large-task/proof-mcp/`):
- `restructure.js` — pure functions. Required-fields registry per element category with load-bearing justifications. Rule table for action label assignment (verbatim-preserve, reshape, gap-fill). Reasoning-anchor validator for infer/derive operations. Provenance record builder. Restructuring report assembler. Rejected-element collector.
- `open-gate.js` — pure functions. Pre-flight verifier that runs after restructuring and before state write. Checks per element: action label present and in valid enum; provenance record complete (source citation, action label, reasoning chain when required); restructuring report assembled and non-empty.

**Modified files** (under `skills/design-large-task/proof-mcp/`):
- `server.js` — register `open_proof` tool; add `handleOpenProof` handler; add dispatch case.
- `state.js` — add `proofStatus` field to state shape (`'unopen' | 'open'`, default `'unopen'`); add `loadState` backfill for prior state files missing the field, following the existing `??=` pattern at state.js:452-461.
- `proof.js` — extend `createElement` to accept and persist an optional `restructuring` field (object containing `metadata`, `restructuring_action_label`, `provenance`) on the constructed element. Additive change; existing element-creation paths unchanged.

**Read-only reuse:**
- `state.js` `applyOperations`, `initializeState`, `saveState` — reused as-is for phase 3 element insertion. The `applyOperations` op shape is the existing `{op: 'add', type, statement, source, grounding, collapse_test, reasoning_chain, rejected_alternatives, relieves, basis, problem_anchor}` plus the new optional `restructuring` field per the proof.js modification above.
- Existing `initialize_proof` tool — preserved unchanged for direct-init usage; not modified. Coexists with the new `open_proof` tool. Existing B.2-owned tools (`present_closing_argument`, `confirm_closure_go`, `manage_friction`, `override_friction_disposition`) also coexist; B.1 does not modify them.

## Data Flow

1. **Phase 1 (accept).** Caller invokes `open_proof` with `state_file` (string) and `submission_material` (object, free-form). MCP SDK parses input; `handleOpenProof` receives the submission as-is. No structural validation at this stage. Receipt logged.
2. **Phase 2 (restructure).** Handler calls `restructure(submission_material)` from `restructure.js`. Returns `{ admitted: Element[], rejected: RejectedCandidate[], report: string }`. The function:
   - Iterates submission fields against the per-category required-fields registry.
   - Assigns action labels via the rule table for verbatim/reshape/gap-fill.
   - For ambiguous fields, attempts infer/derive only if a reasoning anchor is constructible; if not, drops to rejection.
   - Builds provenance record per admitted element.
   - Routes non-required caller content to per-element `metadata` channel.
   - Assembles human-readable report covering both admitted and rejected.
3. **Phase 3 (open-gate + state init).** Handler calls `checkOpenGate(admitted, report)` from `open-gate.js`.
   - **Gate pass:** Handler reads `submission_material.problem_statement` (top-level string field, see Submission Envelope below), calls `initializeState(problem_statement)` from `state.js`, then `applyOperations(state, admittedAsAddOps)` where `admittedAsAddOps` is the array of admitted elements converted to add-op shape per the conversion rule below, then `saveState`. Sets `proofStatus: 'open'`. Returns `{ status: 'opened', restructuring_report, admitted_count, rejected_count, proof_open: true }`.
   - **Gate fail:** State not written. Returns `{ status: 'gate_failed', restructuring_report, gate_failures, rejected, proof_open: false }`. Caller may resubmit per R6.

### Submission Envelope

`submission_material` (the second `open_proof` parameter) is an object with three top-level conventional fields. None are required by the MCP schema (NCON-2 permissive boundary); restructuring fails gracefully when expected fields are missing.

- `problem_statement` (string, conventional) — the proof's anchor sentence. If absent or empty, `restructure` returns a top-level rejection diagnostic and the gate fails.
- `elements` (array of candidate element objects, conventional) — each candidate carries at least a `category` field naming one of the 7 admitted element categories; arbitrary other fields are caller-supplied raw material that restructure routes per the registry.
- Any additional top-level fields are extracted into a global metadata channel by restructure and surfaced in the restructuring report; they do not affect element construction.

### Admitted-Element to applyOperations Op Conversion

Each admitted element produced by `restructure` carries: `{ category, ...typedFields, metadata, restructuring_action_label, provenance }`. Conversion to applyOperations op shape:

```
{
  op: 'add',
  type: <category as ELEMENT_TYPES value>,
  statement: <typedFields.statement>,
  source: <typedFields.source if applicable>,
  grounding: <typedFields.grounding if applicable, else []>,
  collapse_test: <typedFields.collapse_test if applicable>,
  reasoning_chain: <typedFields.reasoning_chain if applicable>,
  rejected_alternatives: <typedFields.rejected_alternatives if applicable, else []>,
  relieves: <typedFields.relieves if applicable>,
  basis: <typedFields.basis if applicable, else []>,
  problem_anchor: <typedFields.problem_anchor if applicable>,
  restructuring: { metadata, restructuring_action_label, provenance },
}
```

The `restructuring` field is the new `createElement` extension (per Components / proof.js modification). All other fields follow the existing op shape.

## Error Handling

- **Submission shape errors at MCP-SDK level** (e.g., `submission_material` missing): MCP SDK returns input validation error; handler not invoked. No bypass — schema requires `state_file` and `submission_material`.
- **Restructuring-internal errors** (rule table lookup failure, type registry mismatch): caught by `restructure.js`; element placed in `rejected` with diagnostic naming the cause. Restructuring continues for other elements.
- **Gate failures**: returned to caller as structured response; state not written. No partial admission — gate is all-or-nothing per `handleOpenProof` design.
- **State save failures** (filesystem error, JSON serialization): propagated as MCP error response; in-memory `admitted` discarded; gate-passing elements not persisted.
- **Pre-existing proof state at `state_file`**: if `proofStatus === 'open'`, `open_proof` refuses with `{ status: 'already_open', diagnostic: 'Proof at <path> is already open. Use a fresh state_file or initialize a new proof.' }`. Refusing protects against unintentional overwrite.
- **Anchor-validator failure** (infer/derive operation without valid reasoning anchor): element drops to `rejected` with diagnostic naming the missing anchor; restructuring continues.

## Testing Strategy

- **Unit tests for `restructure.js`** (`tests/test-restructure.sh` or similar): adversarial submission inputs covering each action label path, missing required fields, ambiguous fields with and without reasoning anchors, oversize metadata, malformed types.
- **Unit tests for `open-gate.js`**: gate pass with full artifacts, gate fail per missing artifact category, edge cases (empty admitted array, non-string report).
- **Integration test for `open_proof` tool**: end-to-end MCP invocation with a representative caller submission; verify state file written correctly on pass, not written on fail; verify response shape.
- **Backward compatibility test for `initialize_proof`**: existing test suite for the legacy tool path must continue to pass unchanged.
- **State backfill test**: load a prior state file lacking `proofStatus` field; verify `loadState` adds default value; verify subsequent operations work.
- **Coverage expectation**: every AC in this spec maps to at least one test case. Plan-build will derive specific test tasks per AC.

## Constraints

- **R8 (B.1-authored elements only)**: no inheritance from upstream sprints' code beyond what's already in `proof.js`/`state.js`/`server.js`. No imports of cluster-A or cluster-B umbrella experimental code.
- **R9 (caller untrusted)**: no caller-side schema validation at the MCP boundary beyond the two-field outer envelope (`state_file`, `submission_material`). All structural rigor lives inside `restructure.js`.
- **R6 (single-shot transition)**: `open_proof` is one tool call per submission. Resubmission is a new `open_proof` invocation; no in-band amendment API.
- **R2 (generic caller contract)**: `open_proof` schema names no Phase-4a-specific fields. Any caller that conforms to the two-field envelope can invoke.
- **Locked vocabulary** (per master plan): `Necessary Condition`, `Evidence`, `Rule`, `Permission`, `Risk`, `Concern`, `Resolve Condition`, `Problem statement`, `Phase 4a`, `Phase 4b`. Used verbatim in code comments, error messages, and identifiers.
- **Cluster B.2 boundary**: B.1 does not modify `closing-argument.js`, `friction-detection.js`, `metrics.js`, or any other cluster-B.2-owned file. B.1's deliverable terminates at `proofStatus: 'open'`.
- **Implementation budget**: 3 new files + minimal additions to 2 existing files. Estimated 280-320 lines total for new code; under 80 lines added to existing files.

## Non-Goals

- **In-band amendment to a partially-built proof**: rejected per RC-5; resubmission required per R6.
- **Caller-side feedback loop during restructuring**: rejected per R9; caller cannot inject logic between accept and restructure phases.
- **Modifying existing `initialize_proof` semantics**: the legacy direct-init tool is preserved as-is for the skill's existing initialization pathway.
- **Phase 4a (caller-side) implementation**: out of scope per R5.
- **Closure protocol changes**: out of scope per brief; B.2 owns closure mechanics.
- **Per-turn Solve flow changes**: out of scope per brief; B.1 deliverable ends at proof open.
- **Inference engine for ambiguous material at scale**: anchor-disciplined infer/derive escape hatches are present but not optimized; handling rich semantic ambiguity is out of scope.
- **Migration tooling for prior state files**: backfill is on-demand at `loadState`; no batch migration utility.

## Acceptance Criteria

### AC-1.1 — Required-Fields Registry per Element Category

**Observable boundary:**
- Reading the restructuring schema module exports a `REQUIRED_FIELDS_REGISTRY` object → registry contains an entry for each of the 6 B.1-admittable categories: `EVIDENCE`, `RULE`, `PERMISSION`, `NECESSARY_CONDITION`, `RISK`, plus the `Concern` category (which lives in state.concerns, not state.elements).
- Reading any registry entry → entry contains `required: { name, justification }[]` and `optional: string[]`.
- Reading any required-field justification → string is non-empty and names a downstream proof reasoning operation.
- `FRICTION` is intentionally absent — FRICTION elements are B.2-generated via `manage_friction`, not received via the contract surface (see proof.js:13 `ELEMENT_TYPES`, applyOperations FRICTION-block at state.js:265).
- `RESOLVE_CONDITION` is intentionally absent — applyOperations validates RC.problem_anchor against state.concerns, which is empty immediately after initializeState in handleOpenProof. RCs cannot be admitted via the contract surface; they are added post-open via existing tools (submit_proof_update or ratify_resolve_condition) after Concerns have been provisioned.

**Given:** the restructuring schema module is loaded.
**When:** A test reads `REQUIRED_FIELDS_REGISTRY[<category>]` for each of the 6 B.1-admittable categories.
**Then:** Each lookup returns an object with non-empty `required` and `optional` arrays; every `required` entry has a `justification` string referencing a downstream operation. Lookup of `'FRICTION'` and `'RESOLVE_CONDITION'` returns undefined.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.2 — Required-Field Rejection with Diagnostic

**Observable boundary:**
- Submitting an element candidate missing a required field → element appears in `rejected` array, not `admitted`.
- Reading a rejected entry → entry contains `missing_fields: string[]` naming each absent required field.
- Reading the diagnostic → message includes the field name and the element category.

**Given:** A `restructure()` call with `submission_material` containing one candidate of category `Concern` lacking the `label` required field.
**When:** Restructuring runs.
**Then:** Result's `rejected` array contains the candidate; `missing_fields` includes `label`; `diagnostic` string contains both `label` and `Concern`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.1 — Per-Element Metadata Channel

**Observable boundary:**
- Each element in the `admitted` array has a `metadata` field of type object.
- Submitting caller material containing fields not in the registry's `required` or `optional` lists → those fields appear under `metadata` keyed by the original field name.

**Given:** A `restructure()` call with submission material whose `Concern` candidate has `label` (required), `description` (optional), and `caller_note` (unknown).
**When:** Restructuring runs.
**Then:** Admitted element's `metadata.caller_note` equals the original value; `label` and `description` appear in their typed positions.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.2 — Metadata Channel Non-Load-Bearing

**Observable boundary:**
- `restructure()` does not validate `metadata` content beyond type-checking the outer object shape.
- `open-gate.js` does not check metadata field presence on any element.
- An element with empty `metadata: {}` passes the open gate (assuming other artifacts present).

**Given:** A `restructure()` result with an admitted element whose `metadata` is `{}`.
**When:** `checkOpenGate` runs.
**Then:** Gate passes (assuming action label, provenance, report present); no metadata-related failures in `gate_failures`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.1 — Action Label Enum per Element

**Observable boundary:**
- Each element in the `admitted` array has a `restructuring_action_label` field.
- The label value is one of `'verbatim-preserve' | 'reshape' | 'gap-fill' | 'infer' | 'derive'`.
- Submitting an element constructable from a verbatim caller field → label is `'verbatim-preserve'`.

**Given:** A `restructure()` call where the caller's submission contains a `Concern` with `label: "Foo"` matching the registry's required-field expectation directly.
**When:** Restructuring runs.
**Then:** Admitted element has `restructuring_action_label: 'verbatim-preserve'`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.2 — Empty / Placeholder / Redirect Rejection

**Observable boundary:**
- A required field with value `""`, `null`, the string `"TODO"`, the string `"not specified"`, or a value matching the regex `/^see metadata/i` → element rejected.
- Rejected entry's diagnostic identifies the field and the failure mode (empty / placeholder / redirect).

**Given:** A `restructure()` call where the caller's submission contains a `Concern` with `label: "TODO"`.
**When:** Restructuring runs.
**Then:** Candidate appears in `rejected`; diagnostic contains `placeholder`; element does not appear in `admitted`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.3 — Infer/Derive Reasoning Anchor Discipline

**Observable boundary:**
- An element's restructuring assignment to `'infer'` or `'derive'` requires a valid reasoning anchor in the provenance record.
- A valid anchor is one of: a rule citation (string matching `/^rule:[a-z0-9-]+$/`), a schema match (string matching `/^schema:[A-Z_]+\.[a-z_]+$/`), or a designer-ratified inference template id (string matching `/^template:[a-z0-9-]+$/`).
- An infer/derive assignment without a valid anchor → element drops to `rejected` with diagnostic naming the missing anchor.

**Given:** A `restructure()` call attempting to assign `'infer'` to a candidate without a constructible reasoning anchor.
**When:** Restructuring runs.
**Then:** Element appears in `rejected`; diagnostic contains `missing reasoning anchor` and the attempted action label.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.1 — Provenance Record Three-Field Shape

**Observable boundary:**
- Each admitted element has `provenance: { source_citation, action_label, reasoning_chain }`.
- `source_citation` is a non-empty string (id, position description, or quoted excerpt of caller material).
- `action_label` matches the element's `restructuring_action_label`.

**Given:** A `restructure()` call with at least one admitted element.
**When:** Test reads the admitted element's `provenance`.
**Then:** All three fields exist; `source_citation` is non-empty; `action_label` equals the element's `restructuring_action_label`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.2 — Reasoning Chain Required for Non-Verbatim Actions

**Observable boundary:**
- An admitted element with `action_label: 'verbatim-preserve'` may have `reasoning_chain: null`.
- An admitted element with any other action label has `reasoning_chain` as a non-empty string.
- An element with non-verbatim action and null reasoning chain fails the open gate (per AC-8.1).

**Given:** A `restructure()` call producing an admitted element with `action_label: 'reshape'`.
**When:** Test reads the element's `provenance.reasoning_chain`.
**Then:** Value is a non-empty string referencing the reshape operation performed.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.1 — Restructuring Report on Every Response

**Observable boundary:**
- `open_proof` response always contains a `restructuring_report` field, regardless of gate pass/fail.
- The report lists one entry per candidate (admitted and rejected).
- Each entry includes element category, admission status, provenance summary (for admitted) or rejection diagnostic (for rejected), and source citation.

**Given:** Any `open_proof` invocation with at least one candidate in the submission.
**When:** Test reads the response.
**Then:** `restructuring_report` field present; entries cover all submission candidates.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.2 — Failed Gate Preserves State

**Observable boundary:**
- An `open_proof` call where the gate fails → state file at `state_file` path is unchanged from before the call.
- Response shape: `{ status: 'gate_failed', restructuring_report, gate_failures, rejected, proof_open: false }`.
- File modification timestamp matches pre-call state (or file does not exist if no prior state).

**Given:** An `open_proof` call where restructuring produces an admitted element with missing reasoning chain (gate fails).
**When:** Call returns and test reads the state file.
**Then:** State file content is unchanged (or absent); response `status` equals `'gate_failed'`; response `proof_open` is `false`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.3 — Resubmission Discards Prior Partial State

**Observable boundary:**
- If a prior `open_proof` call wrote partial state (i.e., should not happen per AC-5.2, but defensive): a subsequent `open_proof` call with a fresh submission that passes the gate overwrites the prior state file completely.
- No residual partial elements survive in the new state.

**Given:** A `state_file` path with no prior content (or with content from a failed gate per AC-5.2). A second `open_proof` call with a complete submission that passes the gate.
**When:** Second call completes.
**Then:** State file contains exactly the elements from the second submission; no elements from any prior partial attempt are present.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.1 — Three Phases Sequential and Named

**Observable boundary:**
- `handleOpenProof` source contains three sequential named function calls in order: a phase 1 receipt log, a `restructure()` call, a `checkOpenGate()` call.
- Phase 2 result is the input to Phase 3.
- Reading the source shows the phase boundaries marked with comments naming each phase.

**Given:** `server.js` source.
**When:** Static inspection of `handleOpenProof`.
**Then:** Three named phase blocks present in declared order; data passes from one to the next without interleaving.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.1 — Permissive Boundary Schema

**Observable boundary:**
- `open_proof` tool's input schema declares two top-level fields: `state_file` (string, required), `submission_material` (object, required).
- The `submission_material` object schema has no `required` sub-fields, no `properties` constraint, no `additionalProperties: false`.
- An MCP call with `submission_material: {}` is accepted at the SDK boundary.

**Given:** The MCP server is running with `open_proof` registered.
**When:** A client invokes `open_proof` with `submission_material: {}`.
**Then:** The handler is invoked (no SDK rejection); the empty submission produces a `restructuring_report` showing zero candidates and a gate failure (no admitted elements means gate fails per AC-8.1's degenerate case).

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-8.1 — Open Gate Refuses on Missing Artifacts

**Observable boundary:**
- `checkOpenGate` returns `{ permitted: false, failures: [...] }` if any admitted element lacks `restructuring_action_label`, `provenance.source_citation`, or (for non-verbatim labels) `provenance.reasoning_chain`.
- Gate also returns `permitted: false` if the restructuring report is empty or missing.
- Gate also returns `permitted: false` if `admitted` array is empty (degenerate case — no proof to open).
- Each failure entry names the element id and the missing artifact category.

**Given:** A `restructure()` result containing one admitted element missing its `provenance.reasoning_chain` (action label is `'reshape'`).
**When:** `checkOpenGate(admitted, report)` runs.
**Then:** Returns `permitted: false`; `failures` array contains an entry naming the element id and `missing_artifact: 'reasoning_chain'`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-9.1 — Tool Registration

**Observable boundary:**
- `server.js`'s `TOOLS` array contains an entry for `open_proof` with name, description, and inputSchema.
- The dispatch switch in the request handler contains a `case 'open_proof'` branch invoking `handleOpenProof`.
- An MCP client requesting the tool list sees `open_proof` alongside existing tools.

**Given:** The MCP server is started.
**When:** A client requests the tool list.
**Then:** Response includes `open_proof` with input schema matching AC-7.1.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-10.1 — State Backfill for proofStatus

**Observable boundary:**
- `loadState` called on a state file written by a prior version (no `proofStatus` field) → returns state with `proofStatus: 'unopen'` populated.
- `loadState` on a state file with `proofStatus: 'open'` → returns state with that value preserved.
- The backfill does not modify the file on disk; it adds the field in-memory only.

**Given:** A state file on disk lacking the `proofStatus` field.
**When:** `loadState(path)` runs.
**Then:** Returned state object has `proofStatus: 'unopen'`; the file on disk is unchanged.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-12.1 — Problem Statement Extraction

**Observable boundary:**
- `restructure()` reads `submission_material.problem_statement` as a top-level string field.
- Absent or empty `problem_statement` → restructure returns a top-level rejection diagnostic; gate fails; state not written.
- Present non-empty `problem_statement` → value is passed to `initializeState` as the `problemStatement` argument.

**Given:** A `restructure()` call where `submission_material` lacks a `problem_statement` field.
**When:** Restructuring runs.
**Then:** Result includes a top-level `rejection_diagnostic` naming `problem_statement` as the missing field; gate fails per AC-8.1; state not written per AC-5.2.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-13.1 — createElement Restructuring Field Extension

**Observable boundary:**
- `createElement` accepts an optional `restructuring` field on its input object.
- When the input `restructuring` is truthy, the returned element has a `restructuring` property containing the input value.
- When the input `restructuring` is absent or falsy (existing call sites such as `submit_proof_update`), the returned element does NOT include a `restructuring` property at all (conditional-add pattern, not `restructuring: null` default). This preserves existing element-shape snapshots and JSON serialization byte-equivalence.
- The FRICTION early-return path in createElement (proof.js:60-83) does NOT apply the restructuring field; FRICTION elements are B.2-generated and never come through the contract surface, so they cannot carry a B.1 `restructuring` field.

**Given:** A direct call to `createElement({ type: 'RULE', statement: 'foo', source: 'designer', restructuring: { metadata: {}, restructuring_action_label: 'verbatim-preserve', provenance: { source_citation: 'caller-input', action_label: 'verbatim-preserve', reasoning_chain: null } } }, 'R-1', 1)`.
**When:** The function returns.
**Then:** The returned element has a `restructuring` property whose value matches the input. A separate call without the `restructuring` field produces an element with no `restructuring` property (Object.keys does not include it) and a JSON.stringify byte-identical to current `createElement` output for the same other inputs.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-11.1 — Already-Open Refusal

**Observable boundary:**
- `open_proof` invoked with a `state_file` whose loaded state has `proofStatus: 'open'` → handler returns refusal without invoking restructure or gate.
- Response shape: `{ status: 'already_open', diagnostic: <string naming the path> }`.
- State file is unchanged.

**Given:** A `state_file` containing valid state with `proofStatus: 'open'`.
**When:** `open_proof` is invoked with that path and any submission.
**Then:** Response `status` equals `'already_open'`; diagnostic mentions the path; state file unchanged; `restructure` not called.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-04T01:09:36Z -->
<!-- produced-by design-specify@v0003 -->
