# Reasoning Audit: Compaction Hooks for Interview State Preservation

**Date:** 2026-04-08
**Session type:** Standalone specify → plan → implement → merge

## How the Plan Developed

### Entry point: Feature definition brief

The session started with a pre-written design brief at `docs/feature-definition/compaction-hooks.md`. This bypassed the design-figure-out phase entirely — the user had already resolved the open design questions (hook architecture, breadcrumb vs. env var vs. filesystem scan for sprint discovery, scope boundaries). The specify skill was invoked directly.

### Specification phase

The spec was synthesized from the design brief plus codebase exploration. Key files read:
- `hooks/hooks.json` — existing hook registration format
- `chester-util-config/session-start` — existing hook script pattern, `escape_for_json()` function
- `skills/design-figure-out/understanding/state.js` and `enforcement/state.js` — MCP state schemas
- `skills/design-figure-out/understanding/server.js` — how state files are written and read
- `skills/start-bootstrap/SKILL.md` — where to add the breadcrumb write step
- `.plugin-mcp.json` — MCP server registration
- `chester-util-config/chester-config-read.sh` — config resolution mechanics

The spec added no requirements beyond the design brief — it elaborated implementation details (file paths, error handling table, test cases) but introduced nothing untraceable. Automated spec review confirmed this.

### Planning phase

The plan decomposed into 5 tasks following the natural data flow:
1. Breadcrumb writer (upstream dependency for all hooks)
2. PreCompact hook + tests (produces the snapshot)
3. PostCompact hook + tests (consumes the snapshot)
4. Hook registration (wires scripts into plugin system)
5. Integration test (validates the full round-trip)

**Why this ordering:** Each task produces a testable artifact that the next task depends on. The breadcrumb must exist before hooks can find the sprint. PreCompact must produce the snapshot format before PostCompact can consume it. Registration must reference existing scripts.

### Hardening phase

Plan-attack and plan-smell were dispatched in parallel. Both independently identified the same top finding: the newline encoding bug. This convergence increased confidence that it was a real issue, not a false positive.

**Decision: Moderate risk, proceed with directed mitigations.** Three fixes were applied to the plan before implementation:
1. Replace literal `\n` with `${NL}` where `NL=$'\n'`, reuse `escape_for_json()`
2. Change `pressure_test` to `contrarian` in test mock data
3. Add `jq -e` existence checks for derived fields

**What was accepted without fixing:** The integration test gap (no way to verify hooks actually fire via the plugin system) was accepted because the existing `SessionStart` hook proves the mechanism works, and the new hooks can be manually verified on the first real architect session.

## What Information Shaped Decisions

### The `session-start` hook was the architectural template

Reading `chester-util-config/session-start` revealed the `escape_for_json()` pattern and the `additionalContext` output format. This file is the closest existing analog to what the compaction hooks needed to do — read data, escape it, output it as hook response JSON. The entire PostCompact output structure was modeled on this existing pattern.

### MCP state file schemas drove the jq queries

The understanding and enforcement `state.js` files defined the exact field paths the PostCompact hook needed to extract. The key insight was that derived fields (`overallSaturation`, `groupSaturation`, `weakest`) are only present after `updateState()` — they don't exist in the initial state from `initializeState()`. This drove the null guard mitigation.

### The `hooks/hooks.json` structure was already proven

The existing `SessionStart` hook registration provided the exact JSON format needed. The only design question was whether to add a `matcher` — the answer was no, because the hooks self-guard via breadcrumb file checks, making a matcher redundant.

## Alternatives Considered

### Sprint directory discovery (from design brief)

The design brief evaluated three options:
1. **Breadcrumb file** (chosen) — `.active-sprint` written by `start-bootstrap`
2. **Most recent state file** — scan `*/design/*-understanding-state.json`
3. **Environment variable** — `CHESTER_ACTIVE_SPRINT`

Breadcrumb was chosen because it's the most reliable (survives environment inheritance issues, requires no scanning, is a one-line addition to bootstrap). This decision was made in the design brief, not during this session.

### Newline handling (from hardening)

Two approaches were available:
1. **Literal `\n` + sed escaping** (original plan) — fragile, produced garbled output
2. **`$'\n'` ANSI-C quoting + `escape_for_json()`** (hardened plan) — correct, reuses proven code

The hardening reviewers identified option 1 as a correctness bug. Option 2 was chosen because it matched the existing pattern in `session-start` and was proven to work.

### Execution mode

Subagent-driven execution was chosen over inline execution. Each task was dispatched to a fresh subagent with full task context, then verified. This was appropriate because:
- Tasks were well-defined with clear boundaries
- Fresh context per task prevented accumulated confusion
- The controller could verify between tasks without context pollution

## What I Would Do Differently

1. **The test file grew incrementally across three subagents** (Tasks 2, 3, 5), with each appending to the file the previous created. The Task 3 implementer had to add a snapshot regeneration line not in the plan because Test 3 deletes the snapshot that Test 4 needs. Writing the complete test file in Task 2 (with PostCompact tests that fail until Task 3) would have been cleaner.

2. **The `docs/chester/working/` gitignore addition** was made by the Task 3 implementer without plan guidance. While correct (the working directory should be gitignored), it's the kind of out-of-scope change that should have been caught and questioned during spec review rather than silently accepted.
