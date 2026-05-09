# Proof MCP State Render — Problem Report

**Sprint:** `cluster-d-build-shared-understanding/sprint-d-2`
**Date:** 2026-05-09
**Status:** Tooling gap surfaced during sprint-d-2 round 19–20 design conversation
**Severity:** Medium — workaround exists but is expensive and format-fragile
**Recommended fix:** Half-day fix sprint after sprint-d-2 closes (same shape as sprint-d-1-fix-proof-mcp / sprint-d-1-fix-proof-mcp-2)

---

## Summary

The proof MCP exposes `get_proof_state` for designer-facing state inspection but has no tool for rendering the proof in a designer-readable format. Inspection at non-trivial proof sizes (≥ 30 elements) currently falls back to agent-side reflow over multiple `jq` pulls, which is expensive on tokens, drifts in format consistency, and breaks the inline-result token cap on full-state pulls.

This report documents the gap, the failure modes that surfaced this session, the proposed fix-sprint shape, and the open design questions that need designer ratification before the fix sprint launches.

---

## Failure Modes Observed This Session

### Failure Mode 1: Inline result token cap

- `get_proof_state` returns the full state JSON. At 45 elements + operationLog + ratificationLog, the response body is approximately 93KB.
- The response exceeds the inline tool-result token cap, returning an error directing the caller to read the persisted result file in chunks.
- Concrete reproduction this session: round-19 `get_proof_state` call without `summary_mode: true` failed with truncation error; required workaround.

### Failure Mode 2: Multi-jq fallback overhead

- Workaround pattern: agent issues 4–5 `jq` invocations against the state JSON, one per element category (problem statement, rules, evidence, NCs, RCs, concerns, permissions).
- Each invocation parses the file, filters, returns text; agent re-parses each result and reformats into bulleted markdown.
- Token cost: 4–5 separate tool calls per recap; 17 NCs × 5 fields each rendered manually in the agent's response stream.

### Failure Mode 3: Format drift

- Agent-side rendering means agent applies (or fails to apply) format memories per response.
- Concrete reproduction this session: first recap rendered counts in a markdown table; designer flagged that user memories prohibit tables and require bulleted lists with full element text. Second recap reapplied memories correctly.
- Format-drift failure mode would not exist if the server owned the rendering — server output is deterministic.

---

## Root Cause

The proof MCP grew under cluster B.2's closing-argument materialization charter. That charter produced a structured envelope object (returned by `present_closing_argument`, consumed by the brief renderer at closure). The envelope is the right shape for design-brief production but not for ad-hoc state inspection during the design conversation.

State inspection during conversation has been falling back to `get_proof_state` plus agent-side rendering. This works at small proof sizes (≤ 20 elements). It breaks down at sprint-d-2's current size (45 elements: 17 NCs + 10 Rules + 6 Evidence + 2 RCs + 12 Concerns + 1 Permission active, plus 8 withdrawn rules + 1 withdrawn permission).

The gap is structural, not accidental — the MCP was never designed to expose a designer-readable state dump as a first-class operation.

---

## Proposed Fix: `render_proof_state` Tool

### Shape

- New read-only tool added to the proof MCP server's TOOLS array.
- No consent token required (matches `get_proof_state` and `manage_definitions op:query-overlap` precedent for read-only operations).
- Server-side rendering: the MCP holds canonical element bodies, classifications, statuses, ratification metadata, and renders the proof in a deterministic markdown format.

### Inputs (proposed)

- `state_file` (required) — absolute path to state JSON.
- `output_path` (optional) — absolute path to write rendered markdown. When provided, tool writes to disk directly and returns a one-line confirmation.
- `verbosity` (optional, default: `'full'`) — `'full'` (every field including reasoning_chain, collapse_test, rejected_alternatives) or `'compact'` (statement + ID + status only).
- `include_withdrawn` (optional, default: `false`) — include withdrawn elements with their disposition labels.
- `include_logs` (optional, default: `false`) — include operationLog and ratificationLog in tail of rendered output.

### Output Modes

- **Primary mode (`output_path` provided):** server writes markdown to disk; response is a small status object `{ status: 'rendered', output_path, byte_count, element_count }`. Bypasses the inline-result token cap entirely.
- **Secondary mode (`output_path` omitted):** server returns `{ content: '<markdown string>' }`. Refuse with `RESPONSE_TOO_LARGE` if rendered content exceeds an explicit byte threshold (e.g., 16KB) — caller must re-invoke with `output_path` for larger states.

### Implementation Surface

- New file: `proof-mcp/state-render.js` containing the rendering function.
- Modify: `proof-mcp/server.js` — register the tool in TOOLS array, add dispatcher case, add handler function.
- Filesystem I/O: extends the proof MCP beyond state-file persistence (currently atomic write-tmp-then-rename to the registered state path); requires explicit treatment of `output_path` validation (reject paths outside working tree, error on missing parent directory, behavior on overwrite of existing file).
- Test scaffold: new `__tests__/render-proof-state.test.js` covering happy path (full + compact + with/without withdrawn + with/without logs), `RESPONSE_TOO_LARGE` refusal path, `output_path` write behavior, path validation refusals.

---

## Open Design Questions

The proposed shape sketches a buildable tool but several decisions need designer ratification before a fix-sprint design conversation runs:

### Q1: Canonical Markdown Format

- Tool needs a single canonical format the server emits. Today's session-derived format (top-line section headers, bulleted full-text-per-element, sub-bullets for grounding / reasoning / collapse / rejected) is a candidate but unratified.
- Decision: ratify the canonical markdown shape (likely a fixed template applied per element type) before fix-sprint design.
- Risk if skipped: implementer picks a format; designer disagrees post-ship; tool needs revision sprint.

### Q2: Format Pluggability

- Proposed inputs include `verbosity: 'full' | 'compact'`. Whether to support additional formats (JSON-compact, structured-envelope-shape, etc.) is open.
- Recommendation: ship with markdown only. Add formats only when a named consumer needs one.
- Risk if multi-format ships speculatively: maintenance surface grows; consumers don't materialize; format axes drift.

### Q3: Section Filtering

- Whether to support `sections?: ['ncs', 'rules', ...]` filtering vs default full proof.
- Recommendation: skip section filtering in v1. Default = full proof. Consumer trims downstream.
- If section filtering ships later, ratify the section enum explicitly rather than free-text strings.

### Q4: Coexistence with Closing-Argument Envelope

- The closing-argument envelope (cluster B.2 ship, returned by `present_closing_argument`) is the canonical structured input for the design brief at closure. A render tool overlaps superficially.
- Decision: render tool is scoped to "ad-hoc inspection only, not closure handoff." Closure path remains envelope → brief renderer.
- Implementation discipline: render tool consumes the same canonical element-state source the envelope derives from (avoids drift between conversation-time render and closure-time envelope).

### Q5: Filesystem I/O Scope

- `output_path` parameter introduces filesystem writes outside the registered state file.
- Decisions needed: (a) restrict `output_path` to paths under the same working tree as `state_file`? (b) refuse if parent directory doesn't exist, or auto-create? (c) overwrite existing files silently or error?
- Recommendation: (a) yes, restrict to working-tree-adjacent paths to prevent escape. (b) refuse missing parent directory; caller creates the directory deliberately. (c) overwrite silently — recap is naturally idempotent and overwrite matches user intent.

### Q6: RULE-18 Integration

- RULE-18 enumerates the proof MCP's validation surface as designer-issued discipline. A new read-only tool needs explicit treatment in RULE-18 — either:
  - Add a sub-clause naming the tool and its read-only-no-consent contract, or
  - Add a carve-out clause stating that read-only inspection tools (`get_proof_state`, `manage_definitions op:query-overlap`, `render_proof_state`) are exempt from per-mutation validation.
- Decision: ratify the RULE-18 amendment alongside the fix-sprint design.

---

## Proposed Fix-Sprint Scope

### Naming

`sprint-d-2-fix-proof-mcp-render` (or similar — origin sprint suffix + fix target, per established pattern).

### Cycle

- Standard Chester pipeline: design-small-task → design-specify → plan-build → execute-write → finish.
- Half-day to one-day total.

### Acceptance Criteria (draft)

- AC-1.1 — `renderProofState` state-render function exported from new `state-render.js`; pure function over state object.
- AC-1.2 — `render_proof_state` tool registered in server.js TOOLS array, dispatcher routes to `handleRenderProofState`.
- AC-1.3 — `verbosity: 'full'` returns every field of every active element in canonical markdown format.
- AC-1.4 — `verbosity: 'compact'` returns statement + ID + status only.
- AC-1.5 — `include_withdrawn: true` includes withdrawn elements with disposition labels.
- AC-1.6 — `include_logs: true` includes operationLog and ratificationLog tail.
- AC-2.1 — `output_path` provided → server writes file atomically (tmp + rename); response is `{ status: 'rendered', output_path, byte_count, element_count }`.
- AC-2.2 — `output_path` omitted → server returns content inline if under threshold; otherwise refuses with `RESPONSE_TOO_LARGE`.
- AC-3.1 — `output_path` validation refuses paths outside the working tree of `state_file`.
- AC-3.2 — `output_path` parent directory must exist; missing parent refused with `OUTPUT_PATH_PARENT_MISSING`.
- AC-3.3 — `output_path` overwrites existing files silently (idempotent recap).
- AC-4.1 — RULE-18 amended in sprint-d-2 proof state with sub-clause or carve-out covering read-only render tool (designer ratify required in active sprint-d-2 session before merge).
- AC-4.2 — SKILL.md proof-MCP toolset section adds bullet for `render_proof_state`.
- AC-4.3 — Decision-record entry appended to cross-sprint corpus naming the tooling gap, the ad-hoc-inspection-vs-closure-handoff scope distinction, and the format-drift failure mode the tool eliminates.

### Test Count Estimate

- New tests in `__tests__/render-proof-state.test.js`: ~12 cases (4 verbosity × 2 logs × happy path + 4 refusal paths).
- Existing tests must remain green; no existing test exercises render output.
- Final test count target: 529 + 12 ≈ 541.

---

## Comparison to Prior Fix Sprints

This problem report follows the same pattern as the two prior fix sprints under cluster D:

| Sprint | Trigger | Scope | Outcome |
|---|---|---|---|
| sprint-d-1-fix-proof-mcp | Designer hit `manage_concerns op:lock` blocking subsequent `op:add` mid-design conversation | 16 ACs, +8 tests | Removed `op:lock` mechanism + 8 refactor changes. 509 → 517 tests. |
| sprint-d-1-fix-proof-mcp-2 | Designer surfaced first-yes gate had no NC ratify path post-bulk-ratify-removal | 9 ACs, +20 tests | Shipped `ratify_necessary_condition` tool; closed first-yes-gate cycle. 509 → 529 tests. |
| **sprint-d-2-fix-proof-mcp-render (proposed)** | **Designer surfaced state-inspection token-cap + format-drift failure during round-19 recap** | **~13 ACs, +12 tests (estimate)** | **Ship `render_proof_state` tool; eliminate agent-side reflow path.** |

The pattern is consistent: design conversation surfaces a tooling gap; gap is sized for a half-day fix sprint; fix sprint runs against the proof MCP source; sprint-d-2 resumes after fix-sprint merges.

---

## Recommendation

- **Defer to post-sprint-d-2 closure or natural pause point.** Sprint-d-2 currently has 4 NCs to withdraw, 4 to modify, 3 candidates to add, 17 NC ratifies, 11 RC author + ratify cycles, and a closing-argument gate ahead. Pausing for a third fix sprint mid-cycle is heavy; pushing forward with the existing recap workaround is acceptable for now.
- **Capture as a deferred item in sprint-d-2's summary at next pause.** Same pattern as the PERM-2 alignment + NCON-15 lifecycle items deferred to sprint-d-2 from sprint-d-1-fix-proof-mcp-2's summary.
- **Ratify the open design questions (Q1–Q6) at the start of the fix sprint's design phase.** Six small decisions, each one ratified, before the design-specify run.

---

## Files

- This report: `working/proof-mcp-state-render-problem-report.md`
- Companion: `summary/sprint-d-2-summary-NN.md` should reference this report at the next pause snapshot.
