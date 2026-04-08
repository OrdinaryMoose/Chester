---
name: util-budget-guard
description: >
  Token budget check procedure. Read this skill (don't invoke it) whenever a skill
  says "run the budget guard check." Provides the standard check-and-pause procedure
  for monitoring five-hour token usage against a configurable threshold.
---

# Budget Guard Check

Run this check at the entry point of any skill that consumes significant tokens.
Some skills also run it at mid-skill checkpoints (e.g., before dispatching expensive
subagent calls) — the skill will say when.

## Procedure

1. Read current usage:
   ```bash
   cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // empty'
   ```

2. **If the file is missing or the command fails:** Log "Budget guard: usage data unavailable" and continue.

3. **If the file exists,** check staleness via `.timestamp` — if more than 60 seconds old, log "Budget guard: usage data stale" and continue.

4. Read threshold:
   ```bash
   cat ~/.claude/settings.chester.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'
   ```

5. **If `five_hour_used_pct >= threshold`:** STOP and display the pause-and-report below, then wait for user response.

6. **If below threshold:** Continue normally.

## Pause-and-Report Format

> **Budget Guard — Pausing**
>
> **5-hour usage:** {pct}% (threshold: {threshold}%)
> **Resets in:** {countdown from five_hour_resets_at}
>
> **Completed tasks:** {list}
> **Current task:** {current}
> **Remaining tasks:** {list}
>
> **Options:** (1) Continue anyway, (2) Stop here, (3) Other

Populate the task lists from whatever task tracking is active in the current session.
If no tasks are tracked, omit those lines and show only usage and options.

## Dependency

Requires `jq` for JSON parsing. The `setup-start` skill verifies jq availability at
session start and warns if missing.
