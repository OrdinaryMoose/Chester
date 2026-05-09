# Reasoning Audit: render_proof_state Tool for Proof MCP

**Date:** 2026-05-09
**Session:** `00`
**Plan:** `sprint-d-1-fix-proof-mcp-3-plan-00.md`

---

## Executive Summary

This sprint added a read-only `render_proof_state` tool to the proof MCP, with two modes (recap and deep render) anchored on a partitioner extracted from the existing closure-envelope path. The most consequential decision was the architectural choice — a hybrid that extracts `partitionActiveElements` inside `closing-argument.js` (rather than a new shared module), pairs it with a dedicated `state-render.js` decomposed into per-type render functions, and scopes deep-render lookup to seven element types with `FRIC-`/`DEFN-` explicitly excluded. Implementation stayed on-plan after one HIGH and three MEDIUM fixes during plan hardening, plus six small ambiguity resolutions during spec writing; tests grew 529 → 569 with no failures.

## Plan Development

The plan was developed end-to-end inside this session. A pre-existing problem report (from the prior sprint-d-2 working directory) named the proposed tool, sketched inputs, and surfaced six open design questions. `design-small-task` ran an interview loop that locked seven design decisions (recap shape, deep-render mode, outsize-sub-rules annotation, two-input shape, inline-only return, partitioner-sharing, active-only recap) and dissolved one stale concern (the RULE-18 validation-rule amendment, which turned out to be a scope conflation — RULE-18 governs the design-large-task skill, not the proof MCP source). `design-specify` then ran two parallel architects plus an explorer, synthesized a hybrid architecture, and produced a spec that survived fidelity review (Approved) and ground-truth review (two MEDIUMs + several LOWs fixed inline). `plan-build` produced a 1136-line plan, passed plan-reviewer after one fix (a missing AC-2.3 mutation-probe sub-assertion), and survived plan hardening at Low risk after the four actionable threat-report fixes were applied. `execute-write` ran in subagent mode for five tasks, each followed by parallel spec + quality reviews.

## Decision Log

### Hybrid Architecture — Partitioner Extraction Inside `closing-argument.js`

**Context:**
After Round One exploration, two structural tensions remained: (1) where the type-and-status partitioner lives, and (2) how the render module is internally organized. Two architects ran in parallel and converged on the outer shape; the hybrid had to merge their inner differences.

**Information used:**
- Architect A's minimal-touch proposal: partitioner stays inside `closing-argument.js`, render module monolithic, multi-storage `findElementById` covering three storage locations.
- Architect B's split proposal: dedicated render module decomposed with markdown helpers and per-type functions, but missed the multi-storage lookup.
- Prior-art finding that the closure-envelope partition is the source of truth for "which elements are active by type" (cluster B.2 ship).
- Both prior fix sprints (sprint-d-1-fix-proof-mcp, sprint-d-1-fix-proof-mcp-2) were tight half-day turnarounds; precedent favored minimal new module surface.

**Alternatives considered:**
- `Architect A pure (monolithic render with template literals)` — rejected because per-type rendering is the right axis to decompose for testability and future per-type changes.
- `Architect B pure (new shared partitioner module)` — rejected because adding a third module just for partitioning increases blast radius without buying anything beyond what extraction-in-place provides; also missed the multi-storage lookup.
- `Render walks raw state independently` — rejected during the design conversation because two source-of-truth paths drift silently when a new element type/disposition appears.

**Decision:** Extract `partitionActiveElements` as a named export inside `closing-argument.js` (consumed by both `deriveClosingArgument` and the new render path); create `state-render.js` decomposed into markdown primitives + per-type render functions + `findElementById`; keep `server.js` changes thin (TOOLS entry + dispatcher case + handler).

**Rationale:** Extraction-in-place preserves a single source of truth without introducing a new module file, matching the minimal-touch pattern of prior fix sprints. Decomposing the render module into per-type functions inherits Architect B's testability and structural clarity. Pulling Architect A's multi-storage lookup correctness into the merge closes the gap Architect B missed.

**Confidence:** High — explicitly synthesized in the L330 architecture-comparison message and ratified by user reply "hybrid, write using subagent."

---

### Multi-Storage Lookup Scoped to Seven Types — `FRIC-`/`DEFN-` Excluded

**Context:**
The ground-truth review surfaced that the brief's deep-render scope explicitly enumerates seven types, but the spec's `findElementById` prefix list initially included `FRIC-` and `DEFN-`. This created a mismatch: the function would route lookups for prefixes that AC-3.3 said should return `ELEMENT_NOT_FOUND`.

**Information used:**
- The brief's AC-4 scope language enumerating exactly seven element types eligible for deep render.
- The spec's AC-3.3, which scopes `findElementById` to those same seven types and returns `ELEMENT_NOT_FOUND` for anything else.
- Ground-truth reviewer's MEDIUM finding flagging the prefix-list collision.

**Alternatives considered:**
- `Keep FRIC-/DEFN- in the lookup table for future-proofing` — rejected because shipping unused routing code violates the design conversation's no-speculative-surface stance and creates spec/AC drift.
- `Re-open the design to decide whether to extend deep render to FRIC-/DEFN-` — rejected because the brief was already locked; out-of-scope additions belong to a future sprint.

**Decision:** Drop `FRIC-` and `DEFN-` from the prefix list; the seven covered types are NCON, RULE, RC, CERN, EVID, PERM, RISK; everything else returns `ELEMENT_NOT_FOUND`.

**Rationale:** Spec scope and AC must agree, and AC-3.3 is the normative artifact. The scoping also keeps the implementation aligned with the brief's seven-type enumeration without adding speculative routing.

**Confidence:** High — explicit in the L406 inline-fix narration ("Scope multi-storage lookup to brief AC-4's seven types only — drop `FRIC-` and `DEFN-` from the prefix list").

---

### Drop Disk-Write Surface From the Tool Entirely

**Context:**
The original problem report had sized a five-axis input surface against a worst-case render that returned full whole-state verbosity, including a disk-write fallback for outputs above the inline cap. With the recap collapsed to one-line-per-element and deep-render scoped to one element at a time, neither mode plausibly approaches the cap.

**Information used:**
- Live render of sprint-d-2's 45 active elements landing at roughly 5–8 KB.
- Single-element deep render landing well under 1 KB.
- The MCP server's inline tool-channel size limit comfortably exceeds both.
- The disk-write surface's hidden cost: path validation, parent-directory checks, overwrite policy, three error codes — all without a consumer.

**Alternatives considered:**
- `Keep disk-write as a future-proof escape hatch` — rejected because speculative surface ages badly and burdens every subsequent change to the call.
- `Keep disk-write but make it opt-in via flag` — rejected on the same grounds; opt-in unused surface is still surface.

**Decision:** Drop the disk-write surface entirely; if a rendered output ever exceeds the inline cap, refuse with a clear error and add disk-write at that point.

**Rationale:** Refuse-then-extend is cheaper than ship-then-deprecate. The minimal two-input shape (state file + optional element ID) collapses cleanly from the report's five-axis surface and aligns with the fast-recap goal.

**Confidence:** High — explicit in the L226 information packet and locked in L236 ("Locked: inline-only return, no disk-write surface, no path management on the call").

---

### RULE-18 Amendment Dissolved — Scope Conflation Caught

**Context:**
The problem report had imported a sixth design question about whether to add a read-only-tool carve-out to RULE-18 (a sixty-one-sub-clause validation rule). The agent surfaced both options (leave implicit vs explicit one-line carve-out) and recommended the carve-out for discoverability. The user pushed back: RULE-18 doesn't apply here.

**Information used:**
- User's correction: "are we trying to apply rule 18 to this context? R18 does not apply here and was only rendered to check the text formatting."
- Recognition that RULE-18 lives in sprint-d-2's proof state, which governs the design-large-task skill's presentation layer — not the proof MCP source code that this fix sprint changes.

**Alternatives considered:**
- `Push back on the user's framing and argue for the carve-out` — rejected because the user was structurally right; the rule doesn't govern the proof MCP source.
- `Add the carve-out anyway as documentation hygiene in the unrelated proof` — rejected because that's out-of-scope work for this sprint.

**Decision:** Dissolve Q2 from the design conversation; no RULE-18 amendment. Keep only the seven actually-locked items in the brief.

**Rationale:** The rendering of RULE-18 in the recap demo was format-checking, not subject-matter work. Carrying the question forward conflated demo content with this sprint's source-of-change scope.

**Confidence:** High — agent explicitly acknowledged the scope error in L269 ("that was a scope conflation on my part… Q2 dissolves").

---

### Six Spec-Writing Ambiguity Resolutions With Defaults

**Context:**
The spec writer faced six small ambiguities the brief didn't fully resolve. These were not architectural decisions, but local mechanical choices that needed concrete defaults so plan-build could proceed without ambiguity.

**Information used:**
- The hybrid architecture decision (partitioner-in-place, decomposed render).
- The brief's seven locked decisions and AC sketch.
- Existing read-only tool patterns at `proof-mcp/server.js` (manage_definitions op:query-overlap as the no-consent precedent).

**Alternatives considered:**
- `Re-open the design conversation for each ambiguity` — rejected; the items were too small to warrant another interview pass.
- `Defer the ambiguities to plan-build` — rejected because the spec is the contract for the plan; unresolved ambiguities at spec time produce plan drift.

**Decision:** Resolve all six inline with reasoned defaults (e.g., DEFN-handling shape, return-type field naming, partition lane shape, error-code envelope).

**Rationale:** The DEFN-lookup gap was a genuine omission — sprint-d-2's proof has zero definitions, so the issue never surfaced in design — but plan-build needs a concrete answer. Closing them inline keeps momentum without compromising fidelity, since each default falls within the brief's structural envelope.

**Confidence:** High — agent explicitly enumerated and reasoned through the resolutions in L355.

---

### Plan-Hardening Fix — `i < 7` Loop Bound in Task 4 Sort Test

**Context:**
The plan-attack reviewer caught a HIGH off-by-one bug in Task 4's ID-ascending sort test: the seed loop wrote `i < 6`, which produces NCON-4..NCON-9, never NCON-10. The test as written would silently pass even if the sort were broken, because the lexicographic ordering of single-digit IDs is stable.

**Information used:**
- The plan-attacker's identification of the off-by-one and the explanation that lexicographic sort of single-digit IDs is order-stable.
- AC-2.1's sort requirement (ID-ascending across the full active-NC set).

**Alternatives considered:**
- `Leave at i < 6 and patch with a hand-crafted NCON-10 outside the loop` — rejected because uneven seed shapes are noisier than fixing the bound.
- `Switch test to assert sort algorithm structurally without seed comparison` — rejected as over-engineering for a unit test.

**Decision:** Change loop bound to `i < 7` so the seed produces NCON-4..NCON-10, and add an inline math-explainer comment so future readers don't repeat the off-by-one.

**Rationale:** A correct seed exposes the actual lexicographic-vs-numeric sort distinction the AC cares about; the inline comment prevents a future regression of the same shape.

**Confidence:** High — explicit fix narration in L615 and L663 threat report.

---

### Plan-Hardening Fix — `renderConcern` Switched to `elementMeta` Helper

**Context:**
The plan-smell reviewer flagged that `renderConcern` was structurally inconsistent with the seven other per-type render functions: it surfaced its withdrawal disposition via an ad-hoc inline path rather than through the shared `elementMeta(c)` helper. AC-3.2 requires deep-render of withdrawn elements to surface `withdrawal_disposition`; the inconsistency would either drop the field for concerns or duplicate the metadata-extraction logic.

**Information used:**
- AC-3.2 requirement that all seven element types in deep render surface withdrawal disposition uniformly.
- The pattern of the seven other per-type renders, all of which delegate to `elementMeta(element)` for metadata.

**Alternatives considered:**
- `Inline withdrawal_disposition extraction inside renderConcern` — rejected because it duplicates `elementMeta`'s logic and creates a divergence point for future metadata fields.
- `Skip withdrawal_disposition for concerns` — rejected because AC-3.2 requires uniformity across all seven types.

**Decision:** Switch `renderConcern` to call `elementMeta(c)` matching the seven other per-type renderers.

**Rationale:** Uniformity at the metadata-extraction seam is the only way AC-3.2 stays satisfied without per-type drift. Future metadata additions then propagate to all eight renderers automatically.

**Confidence:** High — explicit threat-report fix narrated in L615 and L663.

---

### Plan-Hardening Fix — `rejected_alternatives` Array Join

**Context:**
The plan-smell reviewer flagged that `renderSubBullet` would coerce arrays to strings via `Array.prototype.toString()`, which produces a comma-separated form with no spaces (`alt one,alt two`). For NC `rejected_alternatives` arrays (a structured field), this would emit awkwardly cramped output.

**Information used:**
- JavaScript's default `Array.toString()` behavior (commas, no spaces).
- AC-3.1's deep-render formatting requirement (readable bulleted output).

**Alternatives considered:**
- `Leave the implicit toString coercion` — rejected because output ergonomics matter for designer-facing render.
- `Convert all arrays to multi-bullet output` — rejected as a larger change than the fix needed; the inline join is enough.
- `Refactor renderSubBullet to handle arrays generically` — deferred; the local null-guard join pattern is the minimal fix.

**Decision:** Apply explicit `arr.join('; ')` with a null-guard pattern at the `rejected_alternatives` site.

**Rationale:** Explicit join with semicolon-space produces readable output without restructuring the helper. Null-guard prevents crashes on absent fields. Targeted fix matches the threat-level (MEDIUM, local).

**Confidence:** High — explicit fix narration in L615 and L663.

---

### Task 5 Implementer — `export const TOOLS` Promotion

**Context:**
Task 5 registered `render_proof_state` in `server.js`'s `TOOLS` array. The schema-introspection test in the test file needed to import the array to assert tool registration, but `const TOOLS` was not exported in the original file.

**Information used:**
- The test's need to read the TOOLS array structurally (not via tool invocation).
- `server.js`'s existing module shape with named exports for handlers.

**Alternatives considered:**
- `Test by invoking ListTools through the MCP harness` — rejected as heavier than a direct import test; the AC verification can be structural.
- `Duplicate the array shape into a test fixture` — rejected because it creates a drift point.

**Decision:** Promote `const TOOLS` to `export const TOOLS` so the test can import it directly.

**Rationale:** Exporting the canonical tool registry array gives the test a single source of truth without duplicating the shape. The change is minimal and forward-compatible.

**Confidence:** High — explicitly narrated as a notable decision in L851 ("`const TOOLS` promoted to `export const TOOLS` so the schema introspection test can import it").

---

### Task 1 Implementer — Seed-Data Adjustments (`basis` Array Form, Required `source`)

**Context:**
Task 1's new test file `render-proof-state.test.js` needed seed proof states. The implementer hit validator failures: `basis` was originally string-shaped in the test fixture but the validators required an array; PERMISSION and RISK elements required a `source` field that the initial seed omitted.

**Information used:**
- Validator error messages from `state.js` indicating array-required for `basis` and source-required for PERMISSION/RISK.
- The existing test fixture patterns in `proof-mcp/__tests__/` (mkdtempSync + applyOperations + addConcern + ratify*).

**Alternatives considered:**
- `Change the validator to accept string basis` — rejected because that's a spec-deviation outside this sprint's scope.
- `Skip validator-trigger fields in the test seed` — rejected because realistic fixtures must pass validation.

**Decision:** Adjust seed to use array-shaped `basis` and add `source` fields to PERMISSION and RISK seeds.

**Rationale:** The fixture is a runnable artifact, not a spec contract; matching validator expectations is mechanical. The agent flagged this in self-review and the spec reviewer agreed it was a fixture concern, not a spec deviation.

**Confidence:** High — agent narrated in L738 ("Self-review issue about the seed-data adjustments… is a runnable-fixture concern, not a spec deviation") and confirmed by spec-review pass.

---

## Session Skill Versions

*(populated by `chester-trailer-write stamp`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- created-at: 2026-05-09T12:58:57Z -->
<!-- produced-by finish-write-records@v0003 -->
