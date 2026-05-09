# Sprint-D-1-Fix-Proof-MCP-3 — Design Brief

## Goal

Add a designer-readable rendering surface to the proof MCP. Today the system exposes its state through a structured-form inspection call and a counts-and-IDs summary; neither produces the bulleted, full-text recap a designer reads mid-conversation when the proof has grown past a few dozen elements. Sessions at that scale fall back to agent-side multi-step reflow over the structured form, which is expensive on tokens, drifts on format consistency from one recap to the next, and bumps against the inline-result size limit on full-state pulls.

This sprint ships a new read-only rendering call on the proof MCP. The call has two modes: with no element ID it produces a fast bulleted recap of the active proof body, organized into seven sections (problem statement, concerns, rules, permissions, evidence, necessary conditions, resolve conditions, risks). With an element ID it produces a deep render of that single element with all its sub-fields. The agent's per-call cost is one invocation, one rendered string, no reformatting work. Output is inline-only — no disk-write surface.

This is the third fix sprint under cluster D against the proof MCP, following the same pattern as `sprint-d-1-fix-proof-mcp` (lifecycle collapse) and `sprint-d-1-fix-proof-mcp-2` (NC ratify tool).

## Prior Art

- **Problem report.** `cluster-d-build-shared-understanding/sprint-d-2/working/proof-mcp-state-render-problem-report.md` documents the failure modes that surfaced during sprint-d-2's round 19–20 design conversation: inline-result token cap on full-state pulls, multi-step jq reflow overhead during recap, format drift when the agent reformats per-response.
- **Two prior fix sprints under cluster D.** `sprint-d-1-fix-proof-mcp` (16 ACs, +8 tests; lifecycle collapse to a binary, removal of the per-class lock mechanism, removal of three challenge personalities). `sprint-d-1-fix-proof-mcp-2` (9 ACs, +20 tests; shipped `ratify_necessary_condition` tool to close the first-yes-gate cycle). Same pattern in both: design conversation surfaces a tooling gap; gap is sized for a half-day fix sprint; sprint-d-2 resumes after merge.
- **Existing read-only inspection paths.** `get_proof_state` returns the full structured state form. `manage_definitions op:query-overlap` returns a token-search result. Both are consent-free, by precedent. The new render call follows that precedent.
- **Closing-argument envelope.** `closing-argument.js deriveClosingArgument` already partitions every element by type and lifecycle status (active vs withdrawn), attaches ratification metadata to each entry, and computes per-element provenance from the operation history. The render call shares the type-and-status partitioning logic with this envelope but skips the heavy provenance computation, which has no consumer in the recap path.
- **Server tool registration pattern.** `proof-mcp/server.js` exposes a `TOOLS` array of tool definitions, a request dispatcher with a `switch` over tool names, and per-tool handler functions exported alongside. The new render call follows the same shape — array entry + dispatcher case + handler function.
- **Format demonstration during the design conversation.** A live recap of sprint-d-2's proof state (45 elements: 12 concerns, 10 rules active, 1 permission, 6 evidence, 17 NCs, 2 RCs, 0 risks) was rendered into the conversation window to demonstrate the format. The rendered output came in around five to eight kilobytes of bulleted markdown; a single-element deep render landed well under one kilobyte. Both well within the inline-return size limit.

## Scope

**In scope:**

- New read-only tool registered in the proof MCP — `render_proof_state` — with two-input shape: `state_file` (required, absolute path to state JSON), `element_id` (optional, switches the call from recap mode to deep-render mode).
- Recap mode (no `element_id`): markdown output organized into seven sections — problem statement, concerns, rules, permissions, evidence, necessary conditions, resolve conditions, risks. Each section lists active elements only, one line per element with the element's ID, key metadata (status / source / anchor / ratificationStatus where applicable), and the element's statement (or first sentence for outsized statements).
- Outsized-sub-rules annotation: rules whose statement carries multiple structured sub-clause inventories above a small threshold (multiple numbered sub-items) render with a parenthetical pointer to deep render, rather than inlining the full sub-clause body.
- Deep-render mode (`element_id` provided): output is the requested element printed with all its sub-fields. For Necessary Conditions: statement + grounding + reasoning chain + collapse test + rejected alternatives. For Rules: full statement including any sub-clauses. For Resolve Conditions: statement + problem_anchor + ratification + grounding NCs. For Concerns: label + description + status. For Evidence: statement + source. For Permissions: statement + relieves field. For Risks: statement + basis.
- Deep-render returns the element regardless of active or withdrawn status when the element ID is supplied. Refusal only when the ID does not exist in state.
- Inline-only output channel. The call returns the rendered string in the standard tool-result `content` shape. No `output_path` parameter. No filesystem writes.
- Internal wiring: the recap path consumes the closure envelope's type-and-status partitioning function — same source of truth that decides "which elements are active by type" for the closing argument. The render path skips the closure envelope's provenance and derivation-chain computation, which has no consumer in the recap.
- Test coverage: new test file under `proof-mcp/__tests__/` covering recap happy path, deep-render happy path for each element type, deep-render returns withdrawn element when requested by ID, deep-render refuses unknown ID with structured error, outsized-sub-rule annotation behavior on real fixtures.

**Out of scope:**

- Disk-write capability (the `output_path` parameter from the original problem report). _Not yet_: rendered output sizes observed in the format demo are well under the inline-return size limit; the disk-write surface ages badly without a real consumer driving its shape (path validation, parent-directory checks, overwrite policy, three error codes per the report's Q5). Refusing with a clear error if a future proof exceeds the inline cap, and adding disk-write at that point with a real consumer, is the lower-cost path.
- The `verbosity: 'full' | 'compact'`, `include_withdrawn`, `include_logs` input axes from the original problem report. _Not needed_: the recap-plus-deep-render-on-demand pattern subsumes the verbosity setting (recap is the lean view; deep render is the full view); the active-only default subsumes `include_withdrawn` (deep render serves withdrawn elements when explicitly requested by ID); operation-log inclusion has no observed consumer.
- Section filtering (the `sections?: ['ncs', 'rules', ...]` axis from the report's Q3). _Not yet_: default = full proof at recap level; filtering can be added later if a real consumer surfaces.
- Multi-format output (JSON-compact, structured-envelope-shape, etc., per the report's Q2). _Not needed_: markdown only. Adding formats speculatively grows maintenance surface without consumers.
- Recursive expansion of referenced IDs in deep render (e.g., expanding an NC's grounding `[RULE-2, EVID-1]` into the content of those elements). _Not needed_: deep render returns one element with its own sub-fields. Reference IDs render as IDs; the agent invokes deep render on the referenced ID to see its content.
- Closing-argument envelope contract changes. _Not needed_: the render call consumes the envelope's existing partitioning function. No modification of what the envelope returns at closure, no new fields, no new partition lanes.
- Amendments to sprint-d-2's RULE-18 or any other element of sprint-d-2's proof state. _Not applicable_: that proof governs the design-large-task skill's presentation layer, not the proof MCP source code. The fix sprint changes the proof MCP source; sprint-d-2's proof rules do not govern it.
- Renaming or restructuring of any existing proof MCP tool, file, or function whose behavior is unchanged.

## Key Decisions

1. **Two-mode call with one optional input switches between modes.** The same call produces either a recap or a deep render of one element, depending on whether `element_id` is supplied. Alternative considered: separate tools for recap and deep render. Rejected — same call surface with one optional input is leaner, matches the "minimal agent decision-load per call" goal, and the two modes share enough internal wiring (state load, partitioner) that splitting them would duplicate plumbing.

2. **Inline-only return; no disk-write surface.** Alternative considered: ship the `output_path` parameter and disk-write capability per the original problem report. Rejected — the recap shape produces output well under the inline-return size limit at observed proof sizes, and deep render produces even smaller output. Speculative surface ages badly without a real consumer; if a future proof grows past where inline fits, the call refuses cleanly and disk-write gets added then with a consumer driving the shape.

3. **Recap omits withdrawn elements; deep render returns any element by ID active or withdrawn.** Alternative considered: `include_withdrawn` boolean axis. Rejected — defaults aligned with the fast-recap goal (withdrawn is paper trail, not big picture); deep-render-by-ID honors what the agent typed (refusing a typed-in withdrawn ID would add friction without protecting anything).

4. **Render call shares the closure envelope's type-and-status partitioner; skips its provenance and derivation-chain computation.** Alternatives considered: (a) share the full closure envelope derivation including the heavy provenance work — rejected because closure-specific work has no consumer in the recap path, paying for it on every recap is waste; (b) parallel derivation of type-and-status filtering inside the render call — rejected because two source-of-truth paths for "which elements are active by type" invite silent drift when new element types or dispositions are added later.

5. **Outsized rules render with parenthetical annotation pointing to deep render; ordinary rules render with full statement.** Alternative considered: always render full rule statement. Rejected because rules with structured sub-clause inventories (the validation-rule class with dozens of numbered sub-items) dominate the recap if rendered in full and undermine the big-picture goal. Threshold is small (multiple numbered sub-items inside a rule statement); tunable in implementation, not a structural decision.

6. **Format ratification anchored to the conversation-rendered demo.** The recap shape ratified during the design conversation — seven sections, one bulleted line per element, ID + metadata + statement summary — is the canonical format the implementation reproduces. Alternative considered: leave format ratification to implementer discretion. Rejected — the report's Q1 explicitly flagged this as a designer-ratification-required decision, and the conversation produced a rendered artifact the designer read against. Locking to that artifact is the cheap way to avoid a revision cycle post-ship.

## Constraints

- The new tool's read-only contract must follow the existing precedent — no consent token required, no `proofStatus === 'finish'` refusal, no state mutation under any input. _(structural — the call is a pure read)_
- The closure envelope's existing contract is preserved unchanged. The render call consumes the envelope's type-and-status partitioning function as a shared dependency; it does not modify what the envelope returns at closure, does not add fields, does not change partition lanes. _(structural — closing-argument and design-brief consumers depend on the envelope's current contract)_
- Output is deterministic markdown — same proof state produces byte-identical rendered output every time the call fires. _(structural — eliminates the format-drift failure mode that motivated the sprint)_
- The new tool must register in `proof-mcp/server.js` TOOLS array, route through the request dispatcher's `switch`, and export a handler function in the same module structure as existing tools. _(normative — source: existing proof MCP module conventions)_
- Existing tests must remain green. No existing test exercises render output; the new tool's tests are additive. _(normative — source: prior fix-sprint discipline)_
- Markdown rendering does not embed raw state JSON or schema fragments inside the output. The render call serves designer reading; the `get_proof_state` call exists for structural-data consumers and remains the only path to raw state form. _(normative — source: separation of concerns between the two read paths)_

## Acceptance Criteria

- AC-1 — `render_proof_state` is registered in the `TOOLS` array of `proof-mcp/server.js` with input schema accepting `state_file` (required string) and `element_id` (optional string). The dispatcher routes the tool name to a `handleRenderProofState` handler function exported from the module.
- AC-2 — When called with `state_file` only (no `element_id`), the tool returns markdown organized into seven sections in this order: Problem Statement, Concerns, Rules, Permissions, Evidence, Necessary Conditions, Resolve Conditions, Risks. Each section lists active elements only, one bulleted line per element, format `**ID** _(metadata)_ — statement-summary`.
- AC-3 — In recap mode, rules whose statement contains numbered sub-clause inventories above the threshold render with a parenthetical annotation pointing to deep-render — for example, `**RULE-N** — [first sentence]. (N sub-clauses — request deep render to view in full)`. The threshold is a small fixed number (e.g., three or more numbered sub-items in the statement).
- AC-4 — When called with `state_file` and a valid `element_id`, the tool returns markdown for that single element with all its sub-fields. NCs include statement + grounding + reasoning chain + collapse test + rejected alternatives. Rules include full statement (all sub-clauses inlined). RCs include statement + problem_anchor + ratification + grounding NCs. Concerns include label + description + status. Evidence includes statement + source. Permissions include statement + relieves field. Risks include statement + basis.
- AC-5 — Deep-render mode returns the requested element whether its `status` is `active` or `withdrawn`. Withdrawn elements include their `withdrawal_disposition` in the rendered metadata.
- AC-6 — When called with an `element_id` that does not exist in state, the tool returns a structured refusal naming the missing ID — for example, `{ code: 'ELEMENT_NOT_FOUND', message: 'Element <id> not found in state.' }`. No fallback to recap; the agent must fix the ID and re-call.
- AC-7 — The render path's "which elements are active by type" filtering consumes the closure envelope's type-and-status partitioning function as its source of truth. The render path does not re-implement type/status filtering. (Verifiable: a single function in the closure envelope module is the only producer of the partition; render path imports it.)
- AC-8 — The tool requires no consent token. The handler function does not check for or validate consent input. Calls succeed regardless of `proofStatus` value.
- AC-9 — The tool's output is returned inline in the standard tool-result `content` shape. The tool accepts no input parameter that selects a disk-write target. The handler function performs no filesystem write under any input.
- AC-10 — Existing test suite passes after the sprint's changes. A new test file (e.g., `proof-mcp/__tests__/render-proof-state.test.js`) covers AC-2 through AC-7 against fixture proof states. New tests fire on the standard test command.

<!-- created-at: 2026-05-09T10:57:17Z -->
<!-- produced-by design-small-task@v0002 -->
