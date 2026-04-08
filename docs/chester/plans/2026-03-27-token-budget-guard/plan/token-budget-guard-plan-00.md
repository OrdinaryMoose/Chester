# Token Budget Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add runtime token budget awareness to Chester so it pauses before exhausting the 5-hour rate limit, with optional diagnostic logging.

**Architecture:** A data bridge (statusline writes usage.json), an always-on guard (reads the file at checkpoints and pauses at threshold), and an optional diagnostic logger (tracks per-step deltas). Configuration in a persistent JSON file. Debug mode toggled via a separate start skill.

**Tech Stack:** Bash (statusline script), Markdown/instructions (SKILL.md files), JSON (config/flag/usage files), jq (JSON parsing)

**Spec:** `docs/chester/2026-03-27-token-budget-guard/spec/token-budget-guard-spec-00.md`

---

## Shared Reference: Budget Guard Check Block

All skills that add budget checking use this same instruction block. Tasks 5 and 6 reference it as "the budget guard check block."

```markdown
## Budget Guard Check

Before proceeding, check the token budget:

1. Run: `cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // empty'`
2. If the file is missing or the command fails: log "Budget guard: usage data unavailable" and continue
3. If the file exists, check staleness: `cat ~/.claude/usage.json | jq -r '.timestamp // 0'` — if more than 60 seconds old, log "Budget guard: usage data stale" and continue
4. Read threshold: `cat ~/.claude/chester-config.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'`
5. If `five_hour_used_pct >= threshold`: **STOP** and display:

> ## Budget Guard — Pausing
>
> **5-hour usage:** {pct}% (threshold: {threshold}%)
> **Resets in:** {countdown}
>
> ### Progress
> - **Completed tasks:** {list from task tracker}
> - **Current task:** {current task subject and status}
> - **Remaining tasks:** {list of remaining tasks}
>
> ### Options
> 1. Continue anyway (risk hitting the hard limit)
> 2. Stop here — resume in a new session after the limit resets
> 3. Other (tell me what you'd like to do)

Wait for the user's response before proceeding.

6. If below threshold: continue normally
```

## Shared Reference: Diagnostic Log Block

Skills that add diagnostic logging (Task 6) use this pattern at each logging point:

```markdown
### Diagnostic Logging (debug mode only)

If `~/.claude/chester-debug.json` exists and is not stale (session_start < 12h ago):

**Before the step:**
```bash
BEFORE_PCT=$(cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // "N/A"')
```

**After the step:**
```bash
AFTER_PCT=$(cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // "N/A"')
```

**Append to log:**
- If sprint directory exists: append to `{sprint-dir}/summary/token-usage-log.md`
- Otherwise: append to `~/.claude/chester-usage.log`

Format: `| {HH:MM:SS} | {section} | {step} | {BEFORE_PCT} | {AFTER_PCT} | +{delta} |`

If the log file doesn't exist yet, create it with the table header first:
```markdown
# Token Usage Log

| Timestamp | Section | Step | Before % | After % | Delta |
|-----------|---------|------|----------|---------|-------|
```
```

---

### Task 1: Data Bridge — statusline writes usage.json

**Files:**
- Modify: `~/.claude/statusline-command.sh:115` (append after existing printf)
- Create: `tests/test-statusline-usage.sh` (test script)
- Output: `~/.claude/usage.json` (created by script at runtime)

- [ ] **Step 1: Write the failing test**

Create `tests/test-statusline-usage.sh`:

```bash
#!/usr/bin/env bash
# Test: statusline-command.sh writes usage.json with correct values
set -euo pipefail

SCRIPT="$HOME/.claude/statusline-command.sh"
USAGE_FILE="$HOME/.claude/usage.json"
BACKUP_FILE="$HOME/.claude/usage.json.bak"

# Backup existing usage.json if present
[ -f "$USAGE_FILE" ] && cp "$USAGE_FILE" "$BACKUP_FILE"

# Remove to start clean
rm -f "$USAGE_FILE"

# Sample JSON matching what Claude Code harness provides
SAMPLE_JSON='{
  "context_window": {"used_percentage": 4.2, "remaining_percentage": 95.8},
  "model": {"display_name": "Opus 4.6 (1M context)"},
  "worktree": {"name": "", "branch": ""},
  "rate_limits": {
    "five_hour": {"used_percentage": 42.5, "resets_at": 9999999999},
    "seven_day": {"used_percentage": 2.1, "resets_at": 9999999999}
  }
}'

# Pipe sample JSON to the statusline script (suppress display output)
echo "$SAMPLE_JSON" | bash "$SCRIPT" > /dev/null 2>&1

# Verify usage.json was created
if [ ! -f "$USAGE_FILE" ]; then
  echo "FAIL: $USAGE_FILE was not created"
  [ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$USAGE_FILE"
  exit 1
fi

# Verify values
FIVE_PCT=$(jq -r '.five_hour_used_pct' "$USAGE_FILE")
CTX_PCT=$(jq -r '.context_used_pct' "$USAGE_FILE")
TIMESTAMP=$(jq -r '.timestamp' "$USAGE_FILE")

ERRORS=0

if [ "$FIVE_PCT" != "43" ] && [ "$FIVE_PCT" != "42" ]; then
  echo "FAIL: five_hour_used_pct expected ~42-43, got $FIVE_PCT"
  ERRORS=$((ERRORS + 1))
fi

if [ "$CTX_PCT" != "4" ]; then
  echo "FAIL: context_used_pct expected 4, got $CTX_PCT"
  ERRORS=$((ERRORS + 1))
fi

if [ "$TIMESTAMP" = "null" ] || [ "$TIMESTAMP" = "0" ] || [ -z "$TIMESTAMP" ]; then
  echo "FAIL: timestamp not set"
  ERRORS=$((ERRORS + 1))
fi

# Restore backup
rm -f "$USAGE_FILE"
[ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$USAGE_FILE"

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: usage.json written correctly"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-statusline-usage.sh`
Expected: FAIL with "usage.json was not created"

- [ ] **Step 3: Write minimal implementation**

Append to `~/.claude/statusline-command.sh` after line 115 (the `printf "%b" "$output"` line):

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

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-statusline-usage.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/test-statusline-usage.sh
git commit -m "feat: statusline writes usage.json for budget guard"
```

Note: `~/.claude/statusline-command.sh` is outside the repo — commit only the test. The statusline modification is applied directly to the user's file.

---

### Task 2: Create default configuration file

**Files:**
- Create: `~/.claude/chester-config.json`
- Create: `tests/test-chester-config.sh` (test script)

- [ ] **Step 1: Write the failing test**

Create `tests/test-chester-config.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

CONFIG="$HOME/.claude/chester-config.json"

if [ ! -f "$CONFIG" ]; then
  echo "FAIL: chester-config.json does not exist"
  exit 1
fi

THRESHOLD=$(jq -r '.budget_guard.threshold_percent' "$CONFIG")
ENABLED=$(jq -r '.budget_guard.enabled' "$CONFIG")

ERRORS=0

if [ "$THRESHOLD" != "85" ]; then
  echo "FAIL: threshold_percent expected 85, got $THRESHOLD"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ENABLED" != "true" ]; then
  echo "FAIL: enabled expected true, got $ENABLED"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: chester-config.json valid"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-chester-config.sh`
Expected: FAIL with "chester-config.json does not exist"

- [ ] **Step 3: Write minimal implementation**

Create `~/.claude/chester-config.json`:

```json
{
  "budget_guard": {
    "threshold_percent": 85,
    "enabled": true
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-chester-config.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/test-chester-config.sh
git commit -m "feat: add chester-config.json with default budget guard threshold"
```

Note: `~/.claude/chester-config.json` is outside the repo — commit only the test.

---

### Task 3: Create chester-start-debug skill

**Files:**
- Create: `chester-start-debug/SKILL.md`
- Create: `tests/test-debug-flag.sh` (test script)

- [ ] **Step 1: Write the failing test**

Create `tests/test-debug-flag.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

FLAG="$HOME/.claude/chester-debug.json"

# Clean up any existing flag
rm -f "$FLAG"

# The skill should create the flag — we simulate by checking the SKILL.md
# instructs creating the file and verify the SKILL.md exists
SKILL="chester-start-debug/SKILL.md"

if [ ! -f "$SKILL" ]; then
  echo "FAIL: chester-start-debug/SKILL.md does not exist"
  exit 1
fi

# Verify SKILL.md contains debug flag creation instructions
if ! grep -q "chester-debug.json" "$SKILL"; then
  echo "FAIL: SKILL.md does not reference chester-debug.json"
  exit 1
fi

if ! grep -q "diagnostic" "$SKILL"; then
  echo "FAIL: SKILL.md does not mention diagnostic mode"
  exit 1
fi

# Verify YAML frontmatter has name field
if ! head -5 "$SKILL" | grep -q "name: chester-start-debug"; then
  echo "FAIL: SKILL.md frontmatter missing or incorrect name"
  exit 1
fi

echo "PASS: chester-start-debug skill exists with correct structure"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-debug-flag.sh`
Expected: FAIL with "chester-start-debug/SKILL.md does not exist"

- [ ] **Step 3: Write minimal implementation**

Create `chester-start-debug/SKILL.md`:

```markdown
---
name: chester-start-debug
description: "Activate diagnostic token logging mode. Use instead of chester-start when you want per-section and per-subagent token usage tracking."
---

# chester-start-debug

Announce: "Diagnostic mode active — token usage will be logged per section and subagent."

## Activate Diagnostic Mode

1. Create the debug flag file:

```bash
cat <<FLAG_EOF > ~/.claude/chester-debug.json
{
  "mode": "diagnostic",
  "session_start": $(date +%s)
}
FLAG_EOF
```

2. Verify the file was created:

```bash
cat ~/.claude/chester-debug.json
```

3. After creating the flag, follow all standard chester-start behavior — invoke the `chester-start` skill via the Skill tool for session setup. The debug flag will persist because chester-start only removes flags older than 12 hours.

## What Diagnostic Mode Does

When the debug flag is active, Chester skills that support diagnostic logging will:
- Read `~/.claude/usage.json` before and after each major step
- Append the usage delta to a token usage log
- Log location: `{sprint-dir}/summary/token-usage-log.md` or `~/.claude/chester-usage.log`

The budget guard (pause at threshold) is always active regardless of diagnostic mode.

## Deactivating

Start a new session normally (without invoking chester-start-debug). The flag will be treated as stale after 12 hours, or you can remove it manually:

```bash
rm ~/.claude/chester-debug.json
```
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-debug-flag.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add chester-start-debug/SKILL.md tests/test-debug-flag.sh
git commit -m "feat: add chester-start-debug skill for diagnostic token logging"
```

---

### Task 4: Modify chester-start — debug flag cleanup + register new skill

**Files:**
- Modify: `chester-start/SKILL.md`

- [ ] **Step 1: Write the failing test**

Create `tests/test-start-cleanup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILL="chester-start/SKILL.md"

# Verify chester-start references debug flag cleanup
if ! grep -q "chester-debug.json" "$SKILL"; then
  echo "FAIL: chester-start does not reference debug flag cleanup"
  exit 1
fi

# Verify chester-start-debug is in the available skills list
if ! grep -q "chester-start-debug" "$SKILL"; then
  echo "FAIL: chester-start-debug not registered in available skills"
  exit 1
fi

echo "PASS: chester-start has debug flag cleanup and registers debug skill"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-start-cleanup.sh`
Expected: FAIL with "chester-start does not reference debug flag cleanup"

- [ ] **Step 3: Write minimal implementation**

Add to `chester-start/SKILL.md` — insert after the `## How to Access Skills` section (after line 30) and before `# Using Skills`:

```markdown
## Session Housekeeping

At the start of every session:

1. **Clean up debug flag:** If `~/.claude/chester-debug.json` exists, check its `session_start` timestamp. If older than 12 hours, remove it:
   ```bash
   if [ -f ~/.claude/chester-debug.json ]; then
     start_ts=$(jq -r '.session_start // 0' ~/.claude/chester-debug.json)
     now=$(date +%s)
     age=$(( now - start_ts ))
     if [ "$age" -gt 43200 ]; then
       rm ~/.claude/chester-debug.json
     fi
   fi
   ```
   If fresh (<12h), leave it — the user may be continuing a debug session.

2. **Verify jq availability:** Run `which jq`. If jq is not installed, warn: "Budget guard requires jq for JSON parsing. Install jq for token budget monitoring." Continue without the guard.
```

Add to the `## Available Chester Skills` list (after the chester-start entry, line 110):

```markdown
- `chester-start-debug` — Activate diagnostic token logging mode for the session
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-start-cleanup.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add chester-start/SKILL.md tests/test-start-cleanup.sh
git commit -m "feat: chester-start cleans stale debug flags and registers debug skill"
```

---

### Task 5: Add budget guard to pipeline skill entry points

**Files:**
- Modify: `chester-figure-out/SKILL.md`
- Modify: `chester-build-spec/SKILL.md`
- Modify: `chester-build-plan/SKILL.md`
- Modify: `chester-finish-plan/SKILL.md`

All four get the same budget guard check block (see Shared Reference above) inserted after their YAML frontmatter and before their first process section.

- [ ] **Step 1: Write the failing test**

Create `tests/test-budget-guard-skills.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILLS=(
  "chester-figure-out/SKILL.md"
  "chester-build-spec/SKILL.md"
  "chester-build-plan/SKILL.md"
  "chester-finish-plan/SKILL.md"
)

ERRORS=0

for skill in "${SKILLS[@]}"; do
  if ! grep -q "Budget Guard Check" "$skill"; then
    echo "FAIL: $skill missing Budget Guard Check section"
    ERRORS=$((ERRORS + 1))
  fi
  if ! grep -q "usage.json" "$skill"; then
    echo "FAIL: $skill does not reference usage.json"
    ERRORS=$((ERRORS + 1))
  fi
  if ! grep -q "threshold" "$skill"; then
    echo "FAIL: $skill does not reference threshold"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors across pipeline skills"
  exit 1
fi

echo "PASS: all pipeline skills have budget guard"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-budget-guard-skills.sh`
Expected: FAIL for all four skills

- [ ] **Step 3: Write minimal implementation**

For each of the four skills, insert the budget guard check block after the YAML frontmatter (after the closing `---`) and before the first heading of the skill content.

The block to insert (adapted from the Shared Reference):

```markdown
## Budget Guard Check

Before proceeding with this skill, check the token budget:

1. Run: `cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // empty'`
2. If the file is missing or the command fails: log "Budget guard: usage data unavailable" and continue
3. If the file exists, check staleness via `.timestamp` — if more than 60 seconds old, log "Budget guard: usage data stale" and continue
4. Read threshold: `cat ~/.claude/chester-config.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'`
5. If `five_hour_used_pct >= threshold`: **STOP** and display the pause-and-report (see below), then wait for user response
6. If below threshold: continue normally

**Pause-and-report format:**

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
```

**Insertion points:**
- `chester-figure-out/SKILL.md`: after line 4 (closing `---`), before the `<HARD-GATE>` tag
- `chester-build-spec/SKILL.md`: after line 4 (closing `---`), before the `<HARD-GATE>` tag
- `chester-build-plan/SKILL.md`: after line 4 (closing `---`), before `## Overview`. **Additionally**, insert a second budget guard check inside the Plan Hardening section, before the step that launches chester-attack-plan and chester-smell-code in parallel. These are expensive parallel subagent dispatches — checking the budget before them catches mid-skill breaches.
- `chester-finish-plan/SKILL.md`: after line 4 (closing `---`), before the first section

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-budget-guard-skills.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add chester-figure-out/SKILL.md chester-build-spec/SKILL.md chester-build-plan/SKILL.md chester-finish-plan/SKILL.md tests/test-budget-guard-skills.sh
git commit -m "feat: add budget guard check to pipeline skill entry points"
```

---

### Task 6: Add budget guard + diagnostic logging to chester-write-code

**Files:**
- Modify: `chester-write-code/SKILL.md`

This is the critical modification — write-code is the heaviest token consumer and needs per-task checking plus diagnostic logging support.

- [ ] **Step 1: Write the failing test**

Create `tests/test-write-code-guard.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILL="chester-write-code/SKILL.md"
ERRORS=0

# Must have budget guard
if ! grep -q "Budget Guard Check" "$SKILL"; then
  echo "FAIL: missing Budget Guard Check section"
  ERRORS=$((ERRORS + 1))
fi

# Must reference per-task checking
if ! grep -q "usage.json" "$SKILL"; then
  echo "FAIL: does not reference usage.json"
  ERRORS=$((ERRORS + 1))
fi

# Must have diagnostic logging section
if ! grep -q "Diagnostic Logging" "$SKILL"; then
  echo "FAIL: missing Diagnostic Logging section"
  ERRORS=$((ERRORS + 1))
fi

# Must reference chester-debug.json for diagnostic mode detection
if ! grep -q "chester-debug.json" "$SKILL"; then
  echo "FAIL: does not reference chester-debug.json"
  ERRORS=$((ERRORS + 1))
fi

# Must reference token-usage-log
if ! grep -q "token-usage-log" "$SKILL"; then
  echo "FAIL: does not reference token-usage-log"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors"
  exit 1
fi

echo "PASS: chester-write-code has budget guard and diagnostic logging"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-write-code-guard.sh`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

**Modification A — Budget guard at skill entry:** Insert the same budget guard check block as Task 5 after the YAML frontmatter (after line 4), before `# chester-write-code`.

**Modification B — Per-task budget check in dispatch loop:** Insert into Section 2.1, before step 1 ("Dispatch implementer subagent"). Add a new step 0:

```markdown
0. **Budget guard check** — Before dispatching this task's implementer, run the budget guard check (see Budget Guard Check section above). If PAUSE is triggered, report progress using the current task list and wait for user decision. If CONTINUE, proceed to dispatch.
```

**Modification C — Diagnostic logging section:** Add a new section after Section 2.3 ("Fresh Subagent Per Task"):

```markdown
### 2.4 Diagnostic Logging (Debug Mode Only)

If `~/.claude/chester-debug.json` exists and its `session_start` is less than 12 hours old, activate diagnostic logging for this execution run.

**At each logging point** (before/after implementer dispatch, before/after spec reviewer, before/after quality reviewer):

1. Read current usage: `cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // "N/A"'`
2. Record the value with a label

**After each task completes all reviews**, append one summary row per sub-step to the log:

- Determine log path:
  - If a sprint directory exists (check for `docs/chester/` or spec frontmatter `output_dir`): `{sprint-dir}/summary/token-usage-log.md`
  - Otherwise: `~/.claude/chester-usage.log`

- If the log file doesn't exist, create it with the header:
  ```markdown
  # Token Usage Log

  | Timestamp | Section | Step | Before % | After % | Delta |
  |-----------|---------|------|----------|---------|-------|
  ```

- Append rows:
  ```
  | {HH:MM:SS} | write-code | task-{N} implementer | {before} | {after} | +{delta} |
  | {HH:MM:SS} | write-code | task-{N} spec-review | {before} | {after} | +{delta} |
  | {HH:MM:SS} | write-code | task-{N} quality-review | {before} | {after} | +{delta} |
  ```

If debug mode is not active, skip all logging — no reads, no writes.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-write-code-guard.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add chester-write-code/SKILL.md tests/test-write-code-guard.sh
git commit -m "feat: add per-task budget guard and diagnostic logging to write-code"
```

---

### Task 7: Integration verification

**Files:**
- Create: `tests/test-integration.sh`

- [ ] **Step 1: Write the integration test**

Create `tests/test-integration.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Token Budget Guard Integration Test ==="
ERRORS=0

# 1. Test statusline writes usage.json
echo "--- Test: statusline data bridge ---"
USAGE_FILE="$HOME/.claude/usage.json"
BACKUP_FILE="$HOME/.claude/usage.json.bak"
[ -f "$USAGE_FILE" ] && cp "$USAGE_FILE" "$BACKUP_FILE"
rm -f "$USAGE_FILE"

SAMPLE_JSON='{"context_window":{"used_percentage":10,"remaining_percentage":90},"model":{"display_name":"Test"},"worktree":{"name":"","branch":""},"rate_limits":{"five_hour":{"used_percentage":50,"resets_at":9999999999},"seven_day":{"used_percentage":1,"resets_at":9999999999}}}'
echo "$SAMPLE_JSON" | bash "$HOME/.claude/statusline-command.sh" > /dev/null 2>&1

if [ -f "$USAGE_FILE" ]; then
  PCT=$(jq -r '.five_hour_used_pct' "$USAGE_FILE")
  if [ "$PCT" = "50" ]; then
    echo "  PASS: usage.json written with correct 5h percentage"
  else
    echo "  FAIL: expected 50, got $PCT"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  FAIL: usage.json not created"
  ERRORS=$((ERRORS + 1))
fi
rm -f "$USAGE_FILE"
[ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$USAGE_FILE"

# 2. Test config file
echo "--- Test: chester-config.json ---"
if [ -f "$HOME/.claude/chester-config.json" ]; then
  T=$(jq -r '.budget_guard.threshold_percent' "$HOME/.claude/chester-config.json")
  if [ "$T" = "85" ]; then
    echo "  PASS: config has correct default threshold"
  else
    echo "  FAIL: expected 85, got $T"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  FAIL: chester-config.json missing"
  ERRORS=$((ERRORS + 1))
fi

# 3. Test skill files exist and have guard sections
echo "--- Test: skill modifications ---"
GUARD_SKILLS=(
  "chester-figure-out/SKILL.md"
  "chester-build-spec/SKILL.md"
  "chester-build-plan/SKILL.md"
  "chester-finish-plan/SKILL.md"
  "chester-write-code/SKILL.md"
)

for skill in "${GUARD_SKILLS[@]}"; do
  if grep -q "Budget Guard Check" "$skill" 2>/dev/null; then
    echo "  PASS: $skill has budget guard"
  else
    echo "  FAIL: $skill missing budget guard"
    ERRORS=$((ERRORS + 1))
  fi
done

# 4. Test chester-start-debug exists
echo "--- Test: chester-start-debug ---"
if [ -f "chester-start-debug/SKILL.md" ]; then
  echo "  PASS: debug skill exists"
else
  echo "  FAIL: chester-start-debug/SKILL.md missing"
  ERRORS=$((ERRORS + 1))
fi

# 5. Test chester-start references debug cleanup
echo "--- Test: chester-start debug cleanup ---"
if grep -q "chester-debug.json" "chester-start/SKILL.md" 2>/dev/null; then
  echo "  PASS: chester-start has debug cleanup"
else
  echo "  FAIL: chester-start missing debug cleanup"
  ERRORS=$((ERRORS + 1))
fi

# 6. Test write-code has diagnostic logging
echo "--- Test: write-code diagnostic logging ---"
if grep -q "Diagnostic Logging" "chester-write-code/SKILL.md" 2>/dev/null; then
  echo "  PASS: write-code has diagnostic logging"
else
  echo "  FAIL: write-code missing diagnostic logging"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "INTEGRATION: $ERRORS failures"
  exit 1
fi

echo "INTEGRATION: all tests passed"
exit 0
```

- [ ] **Step 2: Run the integration test**

Run: `bash tests/test-integration.sh`
Expected: PASS on all checks

- [ ] **Step 3: Commit**

```bash
git add tests/test-integration.sh
git commit -m "test: add integration test for token budget guard"
```

---

## Task Dependencies

```
Task 1 (data bridge) ──────┐
Task 2 (config) ───────────┤
Task 3 (debug skill) ──────┼── Task 7 (integration)
Task 4 (start modification) ┤
Task 5 (pipeline guards) ──┤
Task 6 (write-code guard) ─┘
```

Tasks 1-6 are independent of each other and can run in any order. Task 7 depends on all of them.

## Notes for Implementer

- Files under `~/.claude/` (statusline-command.sh, chester-config.json, usage.json, chester-debug.json) are outside the git repo. They are applied directly, not committed.
- Only test scripts and SKILL.md modifications are committed to the repo.
- The budget guard is instruction-level — it works by telling the model what to do, not by enforcing behavior in code. The model must follow the instructions.
- When modifying SKILL.md files, preserve all existing content. Insert new sections cleanly without disrupting the existing structure.
