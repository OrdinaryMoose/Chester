---
status: Draft
last_reviewed: 2026-05-10
related_docs: [03-architecture, 05-domain-spec]
related_adrs: [0001, 0009, 0014]
---

# Interface Specification

This document specifies the Interface layer: the MCP tool surface, the wire format, the persistence adapter, and the render output channels. The Interface translates between the outside world's protocols and the Domain's typed operations.

The Interface knows nothing about Datalog, closure conditions, friction logic, or any other Domain concern. It knows MCP, JSON, and filesystems.

---

## 1. Responsibilities

The Interface owns:
- MCP tool registration (tool list, schemas, descriptions)
- Tool dispatch (handler routing)
- Input shape validation (cheap structural checks)
- Output shaping (Domain results → MCP response payloads)
- Error classification (mapping Domain error categories to MCP error codes)
- State file persistence (load on entry, save on success, atomic writes)
- Schema versioning (backfill, forward compatibility)
- Render adapters (markdown, JSON, Datalog text)

The Interface does NOT own:
- Closure logic, integrity rules, friction detection (Domain)
- Datalog evaluation (Engine)
- Validation of element semantics (Domain)
- Provenance construction beyond serialization (Domain)

---

## 2. MCP tool surface

The proof MCP exposes the following tools. Each tool is one entry point with a JSON Schema for inputs and a structured response shape.

The tools are grouped by which **delivery port** they implement (Architecture §4.2). The MCP adapter is one possible implementation of these ports; a CLI adapter, HTTP adapter, or test harness would implement the same ports through different surfaces. Adapters can implement subsets — e.g., a read-only audit tool implements only `IRenderSurface` and `IQuerySurface`.

| Port | MCP tools |
|---|---|
| `IElementMutation` | `submit_proof_update` (dispatches add/revise/withdraw internally); `manage_concerns` (concern-specific add); `manage_definitions` (definition-specific add/revise) |
| `IRatification` | `ratify` (universal); `manage_concerns` op=ratify; `manage_definitions` op=ratify |
| `IFrictionManagement` | `manage_friction` |
| `IDefinitionManagement` | `manage_definitions` (full lifecycle) |
| `IClosureSurface` | `present_closing_argument`; `confirm_closure_go` |
| `IRenderSurface` | `render_proof_state` (all formats) |
| `IQuerySurface` | `get_proof_state`; `query_proof` (Phase 6+); `run_counterfactual` (Phase 6+) |
| (open) | `open_proof` — bootstrap; doesn't fit cleanly into the ratification-time port set, treated as Interface-specific initialization |
| (withdraw) | `withdraw` — universal withdrawal verb across `IElementMutation` |

### 2.1 `open_proof`

Open a new proof from submission material.

**Input:**
```json
{
  "state_file": "string (absolute path)",
  "submission_material": {
    "problem_statement": "string",
    "concerns": [{ "label": "string", "description": "string?" }],
    "elements": [
      {
        "type": "EVIDENCE | RULE | PERMISSION | PROPOSITION | RISK | RESOLUTION | CONCERN | DEFINITION",
        "...": "category-specific fields per Domain Spec §3",
        "restructuring": {
          "action": "verbatim-preserve | reshape | gap-fill | infer | derive",
          "reasoning_chain": "string?"
        }
      }
    ],
    "consent": { "source": "designer | agent-proposed-designer-confirmed", "rationale": "string?" }
  }
}
```

**Output (success):**
```json
{
  "status": "opened",
  "round": 0,
  "phase": "Concerns Enumeration",
  "admitted_count": 12,
  "rejected_count": 0
}
```

**Output (gate failed):**
```json
{
  "status": "gate_failed",
  "restructuring_report": "...",
  "gate_failures": [{ "element_id": "...", "missing_artifact": "..." }],
  "rejected": [...]
}
```

**Errors:** `INVALID_CONSENT`, `INVALID_SEED_PACKET`

### 2.2 `submit_proof_update`

Submit a batch of mutations (add, revise, withdraw) for the current round.

**Input:**
```json
{
  "state_file": "string",
  "operations": [
    {
      "op": "add | revise | withdraw",
      "type": "ELEMENT_CATEGORY (for add)",
      "...": "operation-specific fields",
      "consent": "ConsentToken"
    }
  ],
  "consent": "ConsentToken (top-level batch consent)"
}
```

**Output (success):**
```json
{
  "round": 4,
  "phase": "Conditions Building",
  "results": [{ "op": "add", "entity_id": "prop_5", "status": "ok" }],
  "body_advanced": true
}
```

**Errors:** `INVALID_CONSENT`, `DOMAIN_ERROR`, `PROOF_FINISHED`

### 2.3 `get_proof_state`

Retrieve current proof state.

**Input:**
```json
{
  "state_file": "string",
  "summary_mode": "boolean (defaults false)",
  "operation_log_window": "number (last N entries; defaults to all)"
}
```

**Output:** Full state object including elements, concerns, definitions, frictions, operation log, derived metrics (completeness, grounding coverage, closure status). Summary mode omits element bodies.

### 2.4 `render_proof_state`

Render the proof in human-readable form.

**Input:**
```json
{
  "state_file": "string",
  "format": "structured-proof | datalog | element-deep",
  "element_id": "string (for element-deep)"
}
```

**Output:** Markdown text (structured-proof, element-deep) or Datalog text (datalog).

### 2.5 `manage_concerns`

Add or ratify Concerns.

**Input:**
```json
{
  "state_file": "string",
  "op": "add | ratify",
  "label": "string (for add)",
  "description": "string? (for add)",
  "concern_id": "string (for ratify)",
  "consent": "ConsentToken"
}
```

### 2.6 `manage_friction`

Add a Friction or override its disposition.

**Input:**
```json
{
  "state_file": "string",
  "op": "add | override",
  "friction_shape": "...",
  "anchor_a": "string",
  "anchor_b": "string",
  "disposition": "...",
  "statement": "string?",
  "element_id": "string (for override)",
  "consent": "ConsentToken"
}
```

### 2.7 `manage_definitions`

Add, revise, ratify, deprecate, or query-overlap Definitions.

**Input:** As Domain Spec §3.9 plus the operation verb.

### 2.8 `ratify`

Universal ratification verb (replaces `ratify_resolve_condition` and `ratify_necessary_condition`).

**Input:**
```json
{
  "state_file": "string",
  "element_id": "string (NCON-N | RCON-N | CERN-N | DEFN-N)",
  "ratification_text": "string",
  "consent": "ConsentToken (must have source: designer)"
}
```

The category is dispatched from the ID prefix.

### 2.9 `withdraw`

Universal withdrawal verb.

**Input:**
```json
{
  "state_file": "string",
  "element_id": "string",
  "disposition": "consolidated | superseded | found-redundant | found-incorrect | scope-removed",
  "consent": "ConsentToken"
}
```

Note: FRICTION uses `manage_friction` with op `override` instead of `withdraw`, since friction has its own disposition vocabulary.

### 2.10 `present_closing_argument`

Present the closing argument when the trigger gate clears.

**Input:**
```json
{
  "state_file": "string",
  "consent": "ConsentToken"
}
```

**Output:** The closing argument as a structured object. Sets `closing_arg_presented(round)`.

**Errors:** `FIRST_YES_GATE_FAILED` (with unratified IDs), `TRIGGER_NOT_MET` (with reasons), `INVALID_CONSENT`.

### 2.11 `confirm_closure_go`

Designer's go-choice against a presented closing argument.

**Input:**
```json
{
  "state_file": "string",
  "consent": "ConsentToken (must have source: designer)"
}
```

**Output:** The closure result.

**Errors:** Refused if `closing_arg_presented_round` does not equal current round (state has shifted; re-present first).

### 2.12 `query_proof`

Read-only ad-hoc Datalog query. (Future capability; gated by Phase 7 of migration plan.)

**Input:**
```json
{
  "state_file": "string",
  "query": "string (Datalog query syntax)"
}
```

**Output:** Bindings as JSON.

### 2.13 `run_counterfactual`

Mechanical collapse_test verification. (Future capability.)

**Input:**
```json
{
  "state_file": "string",
  "element_id": "string"
}
```

**Output:**
```json
{
  "still_closes": "boolean",
  "failure_reasons": ["string"]
}
```

---

## 3. Wire format

### 3.1 Tool input
JSON deserialized from MCP message. The Interface validates input against the tool's JSON Schema (cheap structural check). Anything failing schema is rejected with a structured error before reaching the Domain.

### 3.2 Tool output
JSON serialized for MCP response. Structured per tool. Error responses follow MCP's `isError: true` convention with a content payload carrying:
```json
{ "code": "ERROR_CODE", "message": "human-readable", "...": "structured details" }
```

### 3.3 Error code taxonomy
- `INVALID_CONSENT` — consent token shape or source invalid
- `INVALID_SEED_PACKET` — open_proof submission material malformed
- `FIRST_YES_GATE_FAILED` — drafts remain when presenting closing argument
- `TRIGGER_NOT_MET` — trigger gate has unmet conditions
- `PROOF_FINISHED` — mutation attempted on a finished proof
- `DOMAIN_ERROR` — generic domain-rule violation (with specific reason)
- `ELEMENT_NOT_FOUND` — referenced element id not in state
- `ENGINE_ERROR` — engine raised an exception (rare; indicates a bug)

The Domain raises domain-classified errors as exceptions or return values; the Interface translates them into the MCP shape.

---

## 4. Persistence adapter

### 4.1 State file format
JSON document with the following top-level fields:
```json
{
  "schemaVersion": 1,
  "round": 4,
  "phaseTransitionRound": 1,
  "problemStatement": "...",
  "elements": { "evid_1": {...}, ... },
  "concerns": [...],
  "definitions": [...],
  "operationLog": [...],
  "engineState": {
    "facts": [["predicate", [args...]], ...],
    "rules": [{"id": "...", "head": ..., "body": [...], "metadata": ...}, ...]
  },
  "allocatorState": { "evid": 7, "prop": 12, "rsln": 3, "cern": 4, ... },
  "closingArgPresentedRound": null,
  "closingArgGoRound": null
}
```

The `engineState` block is what the Domain's bridge restores into the Engine on load and serializes from the Engine on save. The `allocatorState` block carries the per-category counters for `IIDAllocator` (ADR-0009) so IDs remain monotonic across sessions.

### 4.2 Atomic writes
The persistence adapter writes via temp file plus rename:
1. Serialize to in-memory string
2. Write to `state_file.tmp`
3. fsync (best effort)
4. `renameSync(state_file.tmp, state_file)` — atomic on POSIX

This guarantees that a crash mid-write leaves either the prior valid state or the new valid state, never a partial state.

### 4.3 Schema versioning
The state file carries a `schemaVersion` field. On load:
- If version equals current: load directly
- If version is older: backfill missing fields with defaults, log a backfill record, save with current version
- If version is newer: refuse with a clear error (the persistence adapter cannot read future schemas)

Version increments are deliberate; not every change increments (additive optional fields are version-compatible).

### 4.4 Load → operate → save pattern
Every operation follows the pattern:
1. Load state from file
2. Rebuild Engine from `engineState` block
3. Invoke Domain operation
4. On success, save updated state (Engine re-serialized, operation log appended)
5. On failure, do NOT save (state file stays as it was)

This means the state file is always a valid checkpoint.

### 4.5 Cross-cutting adapter wiring

The Interface constructs and injects cross-cutting adapters (ADR-0009) at session boundary, on each operation:

- **`IClock`** — the default adapter wraps system time and an in-memory counter; the counter is initialized from the loaded state's `round` field. The Domain's `advanceRound()` calls increment the in-memory counter; the new counter value is persisted in the saved state.
- **`IIDAllocator`** — the default adapter is a sequential-per-category counter initialized from `allocatorState`. The Domain's `next(category)` calls increment the counter for that category; new counter values are persisted.
- **`IConsentVerification`** — strict adapter per RULE-16 hooks; constructs `VerifiedConsent` handles that mutations accept.

For test harnesses, deterministic adapters replace these. The Domain layer is identical across adapter choices; only the Interface's adapter construction changes.

---

## 5. Render adapters

The Interface translates Domain render outputs to wire formats.

### 5.1 Markdown adapter
Domain produces structured-proof markdown directly; the Interface passes it through to the MCP response as text content.

### 5.2 Datalog text adapter
Domain produces a Datalog projection (facts and rules in text form); the Interface returns it as text.

### 5.3 Structured object adapter
For closing arguments and state queries, the Domain produces structured objects; the Interface JSON-serializes for the wire.

### 5.4 Element deep render
The Interface accepts an element_id, the Domain produces the rendered text, the Interface returns it.

---

## 6. Tool dispatch

The Interface maintains a tool registry mapping tool names to handler functions. Each handler:
1. Validates input shape
2. Loads state via persistence adapter
3. Calls the appropriate Domain operation
4. Catches Domain exceptions, classifies as MCP errors
5. On success, saves state via persistence adapter
6. Returns the MCP response

Handlers are thin: they translate, route, and serialize. They do not contain Domain logic.

---

## 7. Read-only tools

Some tools (`get_proof_state`, `render_proof_state`, `query_proof`, `run_counterfactual`) are read-only. They:
- Do NOT require a consent token
- Do NOT increment the round
- Do NOT mutate state
- May rebuild the Engine from state for query evaluation, but discard the rebuilt Engine after returning

Read-only tools are fast: load → query → return.

---

## 8. Forbidden patterns

The Interface must NOT:
- Build engine queries directly (must go through Domain)
- Cache state across operations (each tool call loads fresh)
- Implement domain logic in handlers (handlers translate; Domain decides)
- Read or write files outside the configured state path
- Hold long-lived process state

These prohibitions preserve the architecture's correctness and replaceability.

---

## 9. Test obligations

### 9.1 Wire format tests
- Each tool's input schema validates correct inputs and rejects malformed
- Each tool's output is a valid JSON Schema-conforming response
- Error responses carry the documented code and structured details

### 9.2 Persistence tests
- State file round-trip: write → read → equal state
- Atomic write under simulated crash: file is either pre-write or post-write, never partial
- Schema version: older-version files load with backfill; newer-version files refused

### 9.3 Tool dispatch tests
- Each tool routes to its handler
- Unknown tool names return `Unknown tool` error
- Domain exceptions are classified into MCP error codes correctly

### 9.4 Read-only tools
- No state mutation occurs (verified by checking state file modification time)
- No round increment

### 9.5 Integration tests
- End-to-end: open proof → submit mutations → ratify → present → confirm go
- Each canonical workflow from ConOps §4 has an integration test

---

## 10. Implementation notes

### 10.1 MCP SDK
The Interface uses `@modelcontextprotocol/sdk` for the protocol layer. This dependency is bounded to the Interface; Domain and Engine never import it.

### 10.2 JSON Schema validation
Tool input schemas are declared once and used for both MCP registration and runtime validation. Use a small JSON Schema validator (Ajv or similar) at the Interface boundary.

### 10.3 Sizing
The Interface is expected to be 600-900 lines:
- `tools.js`: tool definitions and schemas (~300 lines)
- `dispatch.js`: dispatch logic (~100 lines)
- `handlers.js`: one handler per tool (~300 lines)
- `persistence.js`: load/save with atomic writes (~150 lines)
- `errors.js`: error classification (~50 lines)

### 10.4 Future surfaces
The Interface is designed to be replaced. A future HTTP REST surface, a CLI, or a library-mode export can be built as parallel adapters at the same layer, all calling the same Domain operations. None of these would change Domain or Engine.
