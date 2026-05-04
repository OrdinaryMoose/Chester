# Session Summary: Cluster B.1 — Define Transition (open_proof contract surface)

**Date:** 2026-05-04
**Session type:** Full-stack implementation (design → spec → plan → execute)
**Plan:** `cluster-b-1-define-transition-plan-00.md`

## Goal

Deliver Phase 4b's contract surface: a single `open_proof` MCP tool that accepts untrusted caller submissions, restructures them into typed proof elements per a 4b-owned schema, and gates open on per-element artifacts before persisting state. Replace the legacy `initialize_proof` tool. Boundary permissive; rigor enforced internally. Sprint operates under master plan `20260430-02-rebuild-design-derivation` cluster B.1.

## What Was Completed

### New tool: `open_proof`

- Single MCP entry point with two top-level fields: `state_file` (string), `submission_material` (free-form object). Permissive at boundary — no `additionalProperties: false`, no nested required keys.
- Three-phase orchestration in `handleOpenProof`: accept → restructure → check-gate-then-persist.
- Five status responses: `opened`, `gate_failed` (two paths: missing problem_statement and gate-verifier failure), `partial_write_failure`, `save_failed`, `already_open`.
- Resubmissions to the same `state_file` are safe — gate-fail and partial-write-failure paths write nothing.

### New module split (3-module restructure pipeline)

- `restructure-schema.js` — `REQUIRED_FIELDS_REGISTRY` for 6 B.1-admittable categories (5 element types + Concern). FRICTION and RESOLVE_CONDITION explicitly excluded with rationale comments.
- `restructure-rules.js` — three pure predicates: `assignActionLabel` (verbatim-preserve / reshape / gap-fill / null), `isRejectedValue` (placeholder/empty/redirect detection), `validateReasoningAnchor` (rule:|schema:|template: regex discipline).
- `restructure.js` — `buildProvenance` (per-field provenance array), `extractMetadata` (metadata-channel routing for unknown caller fields), `restructure` (top-level orchestrator with priority promotion `gap-fill > reshape > verbatim-preserve` and per-field provenance assembly).

### New verifier

- `open-gate.js` — `checkOpenGate(admitted, report)` — pre-flight verifier per AC-7.1 (NCON-3 enforcement). Validates each admitted element carries `restructuring_action_label`, `provenance.source_citation`, and `reasoning_chain` (when non-verbatim). Rejects empty admitted set or empty report.

### Schema extensions (backward-compatible)

- `proof.js` `createElement` — accepts optional `restructuring` field (conditional add; FRICTION early-return path excluded). Existing callers unchanged.
- `state.js` — added `proofStatus: 'unopen' | 'open'` field on `initializeState` and `??=` backfill in `loadState`. Pre-cluster-B.1 state files load cleanly with backfill default.
- `state.js` `addConcern` integration — `handleOpenProof` partitions admitted into typed elements (routed through `applyOperations`) and Concerns (routed through `addConcern`). Concerns cannot leak into `state.elements`.

### Server changes

- Registered `open_proof` in TOOLS array + dispatch case.
- Retired `initialize_proof` (TOOLS entry, dispatch case, and `handleInitialize` function deleted).
- Gated `main()` with ESM main-module check (`import.meta.url === \`file://${process.argv[1]}\``) so vitest imports don't launch the stdio server.

### Skill text update

- `design-large-task` SKILL.md Solve Stage Opening rewritten to call `open_proof` with `submission_material`. Tool list updated. Vocabulary list updated. Version bumped v0010 → v0011.

## Verification Results

| Check | Result |
|-------|--------|
| vitest (proof-mcp full suite) | 21 files / 328 tests pass |
| bash (repo) | 49/50 pass; 1 pre-existing stamping test failure |
| git status post-checkpoint | clean |

The single bash failure (`tests/test-stamping-design-large-task.sh`) hard-codes a SKILL.md version expectation; T14's documented v0010 → v0011 bump shifted the same pre-existing failure two versions, no new regression.

## Known Remaining Items

- `tests/test-stamping-design-large-task.sh` should be updated to track the current version (or made dynamic). Not addressed this sprint — pre-existing baseline; out of scope.
- Quality-review notes (Minor, all): `PRIORITY` const declared inside loop body could move to module scope; `expectedType` in `restructure.js` is derived from caller value rather than registry (cosmetic for current registry); `addConcern` 4-tuple destructuring drops error/friction_hints (acknowledged in round-3 threat report — error path unreachable from open). All deferred — no action required.

## Files Changed

**Source (new):**
- `skills/design-large-task/proof-mcp/restructure-schema.js`
- `skills/design-large-task/proof-mcp/restructure-rules.js`
- `skills/design-large-task/proof-mcp/restructure.js`
- `skills/design-large-task/proof-mcp/open-gate.js`

**Source (modified):**
- `skills/design-large-task/proof-mcp/proof.js` — `createElement` accepts optional `restructuring`
- `skills/design-large-task/proof-mcp/state.js` — `proofStatus` field + backfill
- `skills/design-large-task/proof-mcp/server.js` — `open_proof` registration, `handleOpenProof` orchestration, `already_open` pre-check, `initialize_proof` retirement, ESM main-module guard
- `skills/design-large-task/SKILL.md` — Solve Stage Opening flow rewrite + version bump

**Tests (new):**
- `skills/design-large-task/proof-mcp/__tests__/restructure-schema.test.js`
- `skills/design-large-task/proof-mcp/__tests__/restructure-rules.test.js`
- `skills/design-large-task/proof-mcp/__tests__/restructure.test.js`
- `skills/design-large-task/proof-mcp/__tests__/open-gate.test.js`

**Tests (modified):**
- `skills/design-large-task/proof-mcp/__tests__/proof.test.js` — createElement restructuring extension
- `skills/design-large-task/proof-mcp/__tests__/loadstate-backfill.test.js` — proofStatus backfill
- `skills/design-large-task/proof-mcp/__tests__/server.test.js` — open_proof registration, handleOpenProof orchestration, already-open refusal, initialize_proof retirement

## Commits

```
bc81034 checkpoint: execution complete
359df3f feat(design-large-task): switch Solve Stage Opening to open_proof; retire initialize_proof references
1fc064a feat(proof-mcp): retire legacy initialize_proof tool; open_proof is the sole entry point
6a63135 feat(proof-mcp): add already-open refusal pre-check to handleOpenProof
bcd43c9 feat(proof-mcp): implement handleOpenProof three-phase orchestration
145804d feat(proof-mcp): register open_proof tool with permissive input schema
7bd3508 feat(proof-mcp): add checkOpenGate pre-flight verifier
64c48d8 feat(proof-mcp): add top-level restructure() orchestrator with per-field provenance
d715a51 feat(proof-mcp): add validateReasoningAnchor for infer/derive label discipline
bf942e6 feat(proof-mcp): add buildProvenance and extractMetadata for restructuring
1375ce6 feat(proof-mcp): add isRejectedValue check for placeholder/empty/redirect values
af00e5a feat(proof-mcp): add assignActionLabel rule table in restructure-rules.js
58bed45 feat(proof-mcp): add REQUIRED_FIELDS_REGISTRY in restructure-schema.js
6b90d3e feat(proof-mcp): add proofStatus field to state with loadState backfill
7c6e220 feat(proof-mcp): extend createElement with optional restructuring field
```

## Handoff Notes

**For Cluster C (Restructure Understand).** Cluster B.1 closes the 4a → 4b transition contract. The `open_proof` tool now accepts the `submission_material` shape that Cluster C's revised understanding-MCP output must produce. The schema discipline lives in `restructure-schema.js` REQUIRED_FIELDS_REGISTRY; treat that file as Cluster C's read-only target. Caller does not need perfect formatting — restructure absorbs reshape/gap-fill/normalization at the boundary.

**Per-task execution mode pattern.** Plan-build added per-task `Execution: inline | subagent` field in this sprint as a designer-driven override of the plan-wide heuristic. T8 + T11 ran as subagents; the other 12 tasks ran inline. Pattern is precedent-setting if reused — execute-write reads the per-task field directly.

**Threat report status: Low.** Three rounds of attacker + smeller hardening landed: Significant → Moderate → Low. All blocking issues closed. Surviving Minor findings documented in summary "Known Remaining Items".

**Pre-existing stamping test.** `tests/test-stamping-design-large-task.sh` shifted from expecting v0009 to expecting v0011 (we are now at v0011 post-T14). Same shape failure as before — should be made dynamic in a follow-up.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by design-large-task@v0010 -->
<!-- produced-by finish-write-records@v0003 -->
