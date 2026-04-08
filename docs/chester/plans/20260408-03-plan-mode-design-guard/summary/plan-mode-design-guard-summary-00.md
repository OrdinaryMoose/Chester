# Session Summary: Experimental Design Skill with Formal Proof Language

**Date:** 2026-04-08
**Session type:** Full pipeline — design through implementation
**Plan:** `plan-mode-design-guard-plan-00.md`

## Goal

Create `design-experimental` — a new Chester skill that replaces behavioral prohibitions ("don't write code") with a two-phase model: Plan Mode during understanding (Phase 1) and a formal design proof language during solving (Phase 2). The proof language channels the agent's completion drive into building a structured design artifact rather than fighting the urge to write code.

## What Was Decided

### Problem reframe: channeling over constraining

The original feature brief proposed Plan Mode as a structural constraint to prevent code writing. Through the design interview, the problem was reframed: token cost is a byproduct of long interviews, not a driver. The real question is how to use better behavioral instructions. The key insight — from the designer — was "what if the design is the code and the agent writes that," applying the same principle that fixed the architect Round One collapse (redirect the goal, don't prohibit the behavior) to the action layer.

### Design proof language

Seven element types (GIVEN, CONSTRAINT, ASSERTION, DECISION, OPEN, RISK, BOUNDARY) with four operations (add, resolve, revise, withdraw). The proof is a machine-first artifact — the designer reads it only for debugging. The MCP validates structural integrity (referential integrity, no cycles, withdrawn-basis citations, boundary collisions, confidence inversions, stale dependencies) and derives challenge modes from proof structure.

### Phase model

Phase 1 (Understand): Plan Mode active, no MCP, pure conversation. The agent can't write files. Phase 2 (Solve): ExitPlanMode, design proof MCP active. The agent builds the proof — its completion drive channels into design-level work.

### Architecture: Clean 4-module MCP

`proof.js` (element model + integrity), `metrics.js` (completeness + challenges + closure), `state.js` (lifecycle + persistence), `server.js` (3-tool wiring). Chosen over Minimal (3-file) because the module separation enables clean extension to per-operation tools later.

## Verification Results

| Check | Result |
|-------|--------|
| proof.js tests | 44 passed |
| metrics.js tests | 31 passed |
| state.js tests | 27 passed |
| Total test suite | 102 passed, 0 failed |
| Clean tree | Verified |

## Files Changed

### Created (in worktree `20260408-03-plan-mode-design-guard`)

- `skills/design-experimental/SKILL.md` — 583-line skill definition
- `skills/design-experimental/proof-mcp/package.json` — Node package config
- `skills/design-experimental/proof-mcp/proof.js` — Element model and integrity checks
- `skills/design-experimental/proof-mcp/metrics.js` — Completeness, challenges, closure
- `skills/design-experimental/proof-mcp/state.js` — State lifecycle and persistence
- `skills/design-experimental/proof-mcp/server.js` — MCP server (3 tools)
- `skills/design-experimental/proof-mcp/__tests__/proof.test.js` — 44 tests
- `skills/design-experimental/proof-mcp/__tests__/metrics.test.js` — 31 tests
- `skills/design-experimental/proof-mcp/__tests__/state.test.js` — 27 tests
- `.plugin-mcp.json` — MCP server registration (3 servers)
- `skills/setup-start/SKILL.md` — Added design-experimental to available skills

### Modified (main tree, during design phase)

- `.gitignore` — Cleaned up stale entries, added `**/node_modules/` pattern, added `docs/chester/working/`
- `~/.chester/thinking.md` — Updated 3 lesson scores

### Design artifacts (working directory, not committed)

- `docs/chester/working/20260408-03-plan-mode-design-guard/design/plan-mode-design-guard-design-00.md`
- `docs/chester/working/20260408-03-plan-mode-design-guard/design/plan-mode-design-guard-thinking-00.md`
- `docs/chester/working/20260408-03-plan-mode-design-guard/design/plan-mode-design-guard-process-00.md`
- `docs/chester/working/20260408-03-plan-mode-design-guard/spec/plan-mode-design-guard-spec-00.md`
- `docs/chester/working/20260408-03-plan-mode-design-guard/plan/plan-mode-design-guard-plan-00.md`
- `docs/chester/working/20260408-03-plan-mode-design-guard/plan/plan-mode-design-guard-plan-threat-report-00.md`

## Commits

| Hash | Message |
|------|---------|
| `ba28709` | feat: add package.json for design proof MCP server |
| `36ff967` | feat: add element model and integrity checks for design proof MCP |
| `7a55eff` | feat: add completeness metrics, challenge triggers, and closure checks |
| `9a7eade` | feat: add state lifecycle for design proof MCP |
| `0089b6b` | feat: add MCP server wiring for design proof |
| `525ecf8` | feat: register chester-design-proof MCP server |
| `4e5078a` | feat: add design-experimental skill with Plan Mode and formal proof language |
| `489cba2` | feat: register design-experimental in setup-start available skills |
| `a5d544d` | checkpoint: execution complete |

## Known Remaining Items

- **Compaction hooks** not updated — deliberately excluded to avoid compounding experimental features. If design-experimental proves out, add compaction support in a follow-up.
- **Semantic contradiction detection** not implemented — MCP validates structure only. Future versions may add NLU-based contradiction detection.
- **The experiment itself** — the skill needs to be tested in real design sessions to validate the core hypothesis: that the proof language engages the agent's completion drive more effectively than behavioral prohibitions.

## Handoff Notes

- Branch `20260408-03-plan-mode-design-guard` is ready for merge or PR
- The skill is opt-in — `design-figure-out` remains the default
- To test: invoke `chester:design-experimental` explicitly in a session with the plugin loaded
- The proof MCP needs `npm install` in its directory after cloning (node_modules are gitignored)
- The worktree's `.gitignore` was cleaned up with a global `**/node_modules/` pattern — this is an improvement over the stale path-specific entries on main
