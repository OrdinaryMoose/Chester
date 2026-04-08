# Design Brief: Token Budget Guard

## Problem Statement

Chester has no awareness of how much of the available 5-hour rate limit it has consumed during a session, and no mechanism to change its behavior as it approaches the limit. A full pipeline run can span 88+ turns and 2.1M+ input tokens with no guardrails. When the allocation runs out, work gets cut off ungracefully — potentially mid-task, mid-commit, or mid-review.

## Solution Overview

A two-layer system: an always-on **budget guard** that pauses Chester and reports status when the 5-hour rate limit reaches a configurable threshold (default 85%), and an optional **diagnostic logging mode** that tracks token consumption per plan section and per subagent.

## Architecture

### Layer 1: Data Bridge

The existing `~/.claude/statusline-command.sh` receives real-time usage JSON from the Claude Code harness on each render. Modify this script to also write the data to `~/.claude/usage.json`, creating a queryable data source that Chester skills can read.

**Data available:**
- `rate_limits.five_hour.used_percentage`
- `rate_limits.five_hour.resets_at`
- `context_window.used_percentage`
- `context_window.remaining_percentage`

### Layer 2: Budget Guard (Always On)

**Threshold:** Configurable, default 85%, stored in `~/.claude/chester-config.json`.

**Check points:**
- Before every task dispatch in `chester-write-code`
- At every skill transition boundary (figure-out → build-spec → build-plan → write-code → finish-plan)

**Behavior when threshold reached:** Pause and report:
- Tasks completed so far
- Current task status
- Tasks remaining
- Current 5-hour usage percentage
- Time until rate limit resets

The user decides what to do next. Chester does not autonomously skip steps or degrade.

### Layer 3: Diagnostic Logging (Debug Mode Only)

**Toggle:** `chester-start-debug` activates diagnostic mode; `chester-start` runs normal mode.

**Flag:** `~/.claude/chester-debug.json` with session timestamp. Stale detection prevents leaked flags from crashed sessions.

**Logging:** Before and after each major step (skill transition, subagent dispatch), read `~/.claude/usage.json` and log the delta:
- Plan section name
- Subagent name/type
- Usage % before
- Usage % after
- Delta

**Log location:** `{sprint-dir}/summary/token-usage-log.md` when a sprint directory exists, `~/.claude/chester-usage.log` as fallback.

### Configuration

`~/.claude/chester-config.json` — persistent across sessions:
```json
{
  "budget_guard": {
    "threshold_percent": 85,
    "enabled": true
  }
}
```

## Files Modified

| File | Change |
|------|--------|
| `~/.claude/statusline-command.sh` | Add write to `~/.claude/usage.json` |
| `~/.claude/chester-config.json` | New — persistent config with threshold |
| `~/.claude/chester-debug.json` | New — session-scoped debug flag |
| `~/.claude/usage.json` | New — written by statusline, read by skills |
| `chester-start/SKILL.md` | Add budget guard check, remove debug flag if present |
| `chester-start-debug/SKILL.md` | New skill variant — creates debug flag, activates logging |
| `chester-write-code/SKILL.md` | Add per-task budget check before dispatch |
| Skills with transition points | Add budget check at skill entry |

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Which limit to guard | 5-hour only | 7-day limit rarely approached in single sessions |
| Behavior at threshold | Pause and report | User retains control; no autonomous degradation |
| Check granularity | Per-task + skill boundaries | Catches the danger zone (write-code) at negligible cost |
| Data bridge mechanism | Statusline writes to file | Simplest bridge; no new infrastructure needed |
| Diagnostic toggle | Separate start skill | Clean separation; no runtime flags to manage |
| Threshold configurability | Config file with default | Change once, persists across sessions |
| Guard activation | Always on | Safety mechanism should not be optional |

## Constraints

- Chester cannot query rate limit data directly — the harness only exposes it to the statusline command via stdin
- The `usage.json` file is only as fresh as the last statusline render cycle
- Subagents spawned by Chester inherit no session state — they cannot check the budget themselves (only the orchestrating skill can)

## Out of Scope

- Token optimization (making skill prompts smaller) — separate no-go decision from 2026-03-26
- 7-day rate limit monitoring
- Context window management (separate concern)
- Automatic cost estimation or dollar-based budgeting
