# Session Summary: Compaction Hooks for Interview State Preservation

**Date:** 2026-04-08
**Session type:** Standalone specification, planning, and implementation
**Plan:** `plan/20260408-01-compaction-hooks-state-preservation-plan-00.md`

## Goal

Automatically snapshot and re-inject Chester architect interview state across Claude Code context compaction events. Long-running interviews (20+ turns) lose scoring precision, phase identity, and accumulated constraints when compaction fires mid-session. This feature uses PreCompact and PostCompact hook events to persist MCP state before compaction and restore it as structured context afterward.

## What Was Decided

### Hook architecture

Two shell scripts communicate through a JSON snapshot file, with a breadcrumb file for sprint directory discovery:

- **PreCompact hook** reads understanding and enforcement MCP state files, writes a consolidated `.compaction-snapshot.json`
- **PostCompact hook** reads the snapshot, validates freshness (< 1 hour) and session ID match, outputs structured natural-language state summary as `additionalContext`
- **Breadcrumb file** (`.active-sprint`) written by `start-bootstrap` during session setup — anchors sprint directory discovery without conversation context

### Key design decisions

- **Never block compaction.** Every error path exits 0. The worst case is fallback to structured thinking captures (the current behavior).
- **Natural language output, not raw JSON.** The PostCompact context injection is structured prose with embedded scores — readable by the agent as a state reload directive.
- **Reuse `escape_for_json()` from session-start.** Plan hardening caught a correctness bug where literal `\n` in double-quoted bash strings would produce garbled output. The fix uses `$'\n'` ANSI-C quoting and the proven escape function from the existing hook.
- **Null guards for pre-first-round state.** Derived fields (`overallSaturation`, `weakest`, `groupSaturation`) don't exist in understanding state until after the first `submit_understanding` call. PostCompact handles this with `jq -e` existence checks.

## What Was Produced

### Specification
- `spec/20260408-01-compaction-hooks-state-preservation-spec-00.md` — Full spec covering architecture, components, data flow, error handling, testing strategy, constraints, non-goals. Passed automated spec review (no issues).

### Implementation plan
- `plan/20260408-01-compaction-hooks-state-preservation-plan-00.md` — 5-task TDD plan. Passed plan review. Hardened via plan-attack and plan-smell (risk: Moderate). Three directed mitigations applied: newline encoding fix, realistic test data, null guards.

### Code
| File | Type | Purpose |
|------|------|---------|
| `chester-util-config/hooks/pre-compact.sh` | New | PreCompact hook — snapshots MCP state |
| `chester-util-config/hooks/post-compact.sh` | New | PostCompact hook — re-injects state as context |
| `hooks/hooks.json` | Modified | Registered PreCompact and PostCompact hook events |
| `skills/start-bootstrap/SKILL.md` | Modified | Added breadcrumb write step (Step 5b) |
| `tests/test-compaction-hooks.sh` | New | 8 tests: 3 PreCompact, 4 PostCompact, 1 integration round-trip |
| `.gitignore` | Modified | Added `docs/chester/working/` (implementer addition) |

### Design brief
- `design/20260408-01-compaction-hooks-state-preservation-design-00.md` — Copied from `docs/feature-definition/compaction-hooks.md`

## Key Findings from Plan Hardening

**Plan-attack and plan-smell converged** on the same top finding: the original plan's newline handling in `post-compact.sh` would produce garbled output. In bash, `"\n"` is two literal characters, not a newline — you need `$'\n'` (ANSI-C quoting). The existing `session-start` hook already solved this correctly with `escape_for_json()`.

Other findings addressed:
- Invalid challenge mode name in test mock (`pressure_test` → `contrarian`)
- Edge case: compaction before first scoring round (null guards added)

Accepted risks:
- No integration test for actual hook registration by the plugin system (manual verification needed)
- MCP schema coupling (PostCompact hardcodes knowledge of state structure)
- Breadcrumb lifecycle (no cleanup path — orphan artifacts possible but harmless)

## What's Deferred

- No deferred items were generated during implementation.

## What the Next Session Needs to Know

- **Manual verification needed:** The hooks are registered in `hooks/hooks.json` but there's no automated test that `PreCompact` and `PostCompact` are valid plugin hook event names. First real architect interview session after this merge should verify hooks fire.
- **Schema coupling:** If the understanding or enforcement MCP server schemas change (field renames, new dimensions), `post-compact.sh` must be updated to match.
- **Breadcrumb persistence:** `.active-sprint` is never deleted — it persists after sessions end. The session ID check in PostCompact prevents cross-session state injection, but PreCompact will write orphaned snapshots into old sprint directories. These are harmless dotfiles.

## Commit History

| SHA | Message |
|-----|---------|
| `bcc63fa` | feat: add active sprint breadcrumb to start-bootstrap |
| `42a7178` | feat: add PreCompact hook for interview state snapshots |
| `9144087` | chore: add chester working directory to .gitignore |
| `9d90051` | feat: add PostCompact hook for interview state re-injection |
| `9f840ff` | feat: register PreCompact and PostCompact hooks |
| `baf7996` | test: add round-trip integration test for compaction hooks |
| `ad13e4b` | checkpoint: execution complete |
