# Spec: Token Budget Guard

## Overview

Add runtime token budget awareness to Chester so that it pauses and reports status before exhausting the Anthropic 5-hour rate limit. An optional diagnostic mode logs per-section and per-subagent usage deltas for analysis.

## Components

### 1. Data Bridge — statusline-command.sh modification

**What changes:** After the existing display logic, write the raw usage data to `~/.claude/usage.json` so Chester skills can read it.

**Implementation:** Append to the end of `~/.claude/statusline-command.sh`, after the existing `printf "%b" "$output"` line:

```bash
# Write usage data for Chester budget guard
cat <<USAGE_EOF > ~/.claude/usage.json
{
  "five_hour_used_pct": ${five_int:-0},
  "five_hour_resets_at": ${five_h_resets:-0},
  "context_used_pct": ${used_int:-0},
  "context_remaining_pct": ${remaining_int:-0},
  "timestamp": $(date +%s)
}
USAGE_EOF
```

**Data contract:** Skills reading `usage.json` expect these fields. The `timestamp` field enables staleness detection — if the file is older than 60 seconds, treat data as unreliable and log a warning but do not block.

**Failure mode:** If the write fails (permissions, disk full), the statusline display continues unaffected. The guard degrades to "no data available" — it logs a warning but does not block the session.

### 2. Configuration — chester-config.json

**Location:** `~/.claude/chester-config.json`

**Schema:**
```json
{
  "budget_guard": {
    "threshold_percent": 85,
    "enabled": true
  }
}
```

**Behavior:**
- If the file does not exist, use defaults (threshold 85%, enabled true)
- If the file exists but is malformed, log a warning and use defaults
- Skills read this file once at skill entry, not on every check (the threshold doesn't change mid-session)

### 3. Budget Guard — always-on check logic

**Check function (pseudocode):**
```
function check_budget():
  read ~/.claude/usage.json
  if file missing or stale (>60s): warn, return CONTINUE
  read ~/.claude/chester-config.json (or defaults)
  if not enabled: return CONTINUE
  if five_hour_used_pct >= threshold_percent: return PAUSE
  return CONTINUE
```

**Check points — where this function is called:**

| Location | When | Skill file |
|----------|------|------------|
| Skill transition | Before entering any pipeline skill | Each skill's SKILL.md |
| Write-code task loop | Before dispatching each task's implementer subagent | chester-write-code/SKILL.md |

**Implementation approach:** Each skill that needs budget checking reads `~/.claude/usage.json` via a bash command (`cat ~/.claude/usage.json | jq -r '.five_hour_used_pct'`) and compares against the threshold. This is instruction-level — added as a step in the relevant SKILL.md files, not a separate script or library.

**When PAUSE is returned — the pause-and-report output:**

```
## Budget Guard — Pausing

**5-hour usage:** {pct}% (threshold: {threshold}%)
**Resets in:** {countdown}

### Progress
- **Completed tasks:** {list of completed task subjects}
- **Current task:** {current task subject and status}
- **Remaining tasks:** {list of remaining task subjects}

### Options
1. Continue anyway (risk hitting the hard limit)
2. Stop here — resume in a new session after the limit resets
3. Other (tell me what you'd like to do)
```

The user decides. Chester does not proceed until instructed.

### 4. Debug Flag — chester-debug.json

**Location:** `~/.claude/chester-debug.json`

**Schema:**
```json
{
  "mode": "diagnostic",
  "session_start": 1743087600,
  "session_id": "optional-for-correlation"
}
```

**Lifecycle:**
- Created by `chester-start-debug` at session start
- Removed by `chester-start` at session start (cleans up stale flags)
- Stale detection: if `session_start` is more than 12 hours old, treat as stale and remove

### 5. Diagnostic Logging — debug mode only

**When active:** Skills check for `~/.claude/chester-debug.json` at entry. If present and not stale, logging is enabled for that skill invocation.

**What gets logged:** Before and after each major step, read `usage.json` and record:

```markdown
| Timestamp | Section | Step | Before % | After % | Delta |
|-----------|---------|------|----------|---------|-------|
| 10:42:03  | build-plan | attack-plan dispatch | 32 | 38 | +6 |
| 10:45:17  | build-plan | smell-code dispatch  | 38 | 42 | +4 |
| 10:47:00  | write-code | task-1 implementer   | 42 | 47 | +5 |
| 10:49:30  | write-code | task-1 spec-review   | 47 | 48 | +1 |
```

**Log location:**
- Primary: `{sprint-dir}/summary/token-usage-log.md` (when sprint directory exists)
- Fallback: `~/.claude/chester-usage.log` (when no sprint is active, e.g., during figure-out before worktree creation)

**Implementation:** Each logging point reads `usage.json`, captures `five_hour_used_pct`, and appends a row to the log file via bash. The "before" reading is taken before the step; the "after" reading is taken after the step completes.

### 6. chester-start-debug — new skill

**Purpose:** Session entry point that activates diagnostic logging mode.

**Behavior:** Identical to `chester-start` except:
1. Writes `~/.claude/chester-debug.json` with current timestamp
2. Announces: "Diagnostic mode active — token usage will be logged per section and subagent"

**Skill registration:** Added to the available skills list in `chester-start/SKILL.md` and registered in the skill system so it appears in the skill list.

### 7. chester-start modification

**Additional behavior at session start:**
- Remove `~/.claude/chester-debug.json` if it exists (clean slate for normal mode)
- No other changes to existing chester-start behavior

## Skills Modified

| Skill | Change |
|-------|--------|
| `chester-start/SKILL.md` | Remove stale debug flag at session start |
| `chester-write-code/SKILL.md` | Add budget check before each task dispatch; add diagnostic log points |
| `chester-build-spec/SKILL.md` | Add budget check at entry |
| `chester-build-plan/SKILL.md` | Add budget check at entry and before attack-plan/smell-code dispatch |
| `chester-finish-plan/SKILL.md` | Add budget check at entry |
| `chester-figure-out/SKILL.md` | Add budget check at entry (lightweight — figure-out is interactive, user would notice throttling anyway) |

## Files Created

| File | Purpose | Persistence |
|------|---------|-------------|
| `~/.claude/usage.json` | Usage data bridge from statusline | Overwritten every render cycle |
| `~/.claude/chester-config.json` | Persistent guard configuration | Permanent until user changes |
| `~/.claude/chester-debug.json` | Session-scoped diagnostic flag | Session-scoped, cleaned up by chester-start |
| `chester-start-debug/SKILL.md` | New skill variant | Permanent |
| `{sprint}/summary/token-usage-log.md` | Diagnostic usage log | Per-sprint artifact |

## Error Handling

| Condition | Behavior |
|-----------|----------|
| `usage.json` missing | Warn once, continue (guard inactive for this check) |
| `usage.json` stale (>60s) | Warn once, continue (data unreliable) |
| `chester-config.json` missing | Use defaults (85%, enabled) |
| `chester-config.json` malformed | Warn, use defaults |
| `chester-debug.json` stale (>12h) | Remove it, continue in normal mode |
| Statusline write fails | Display unaffected, guard degrades to no-data |
| `jq` not installed | Guard cannot function — warn at session start, continue without guard |

## Testing Strategy

1. **Data bridge:** Pipe sample JSON to modified statusline script, verify `usage.json` is written with correct values
2. **Guard logic:** Create `usage.json` with values above/below threshold, verify check function returns correct result
3. **Pause report:** Trigger guard during a mock write-code session, verify report format and content
4. **Debug flag lifecycle:** Start debug session, verify flag created; start normal session, verify flag removed; create 13-hour-old flag, verify stale detection
5. **Diagnostic logging:** Run debug session through a skill transition, verify log entries with correct before/after deltas
6. **Config handling:** Test with missing, default, custom, and malformed config files

## Constraints

- `usage.json` freshness depends on statusline render frequency — there may be a lag of a few seconds between actual usage and the file contents
- Subagents cannot check the budget — only the orchestrating skill (main conversation) can read the file and make decisions
- The guard is instruction-level (written into SKILL.md files), not enforced by code — it relies on the model following the instructions

## Non-Goals

- Token optimization (making skill prompts smaller)
- 7-day rate limit monitoring
- Context window management
- Dollar-based cost budgeting
- Automatic step-skipping or degradation
