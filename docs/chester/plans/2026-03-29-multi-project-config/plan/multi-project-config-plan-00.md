# Multi-Project Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure Chester config so directory paths are project-local only, config files follow Claude Code conventions, and migration code is removed.

**Architecture:** Two config files — `~/.claude/settings.chester.json` (user-wide) and `{project-root}/.claude/settings.chester.local.json` (project-local). Directory paths read only from project config. Everything else merges with project overriding user.

**Tech Stack:** Bash, jq, Chester skills framework

---

### Task 1: Write tests for new config resolution

**Files:**
- Modify: `tests/test-config-read-new.sh` (full rewrite)

- [ ] **Step 1: Write the test file**

Replace the entire file with tests for the new config locations and directory isolation:

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "=== Config Read Test ==="
ERRORS=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/chester-hooks/chester-config-read.sh"

# Isolate from real HOME to avoid touching user's actual config
TMPDIR=$(mktemp -d)
REAL_HOME="$HOME"
export HOME="$TMPDIR/fakehome"
mkdir -p "$HOME/.claude"
trap 'rm -rf "$TMPDIR"; export HOME="$REAL_HOME"' EXIT
cd "$TMPDIR"
git init -q

# Test 1: No config → hardcoded defaults
echo "--- Test: no config returns defaults ---"
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='docs/chester/working'"; then
  echo "  PASS: default CHESTER_WORK_DIR"
else
  echo "  FAIL: expected docs/chester/working"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='docs/chester/plans'"; then
  echo "  PASS: default CHESTER_PLANS_DIR"
else
  echo "  FAIL: expected docs/chester/plans"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_CONFIG_PATH='none'"; then
  echo "  PASS: config path is none"
else
  echo "  FAIL: expected config path none"
  ERRORS=$((ERRORS + 1))
fi

# Test 2: User-level config only — directory paths ignored, config path set
echo "--- Test: user-level config only (dirs ignored) ---"
cat > "$HOME/.claude/settings.chester.json" << 'CONF'
{"working_dir": "user/working", "plans_dir": "user/plans", "budget_guard": {"threshold_percent": 90, "enabled": true}}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='docs/chester/working'"; then
  echo "  PASS: user-level working_dir ignored (got default)"
else
  echo "  FAIL: expected default docs/chester/working (user dirs should be ignored)"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='docs/chester/plans'"; then
  echo "  PASS: user-level plans_dir ignored (got default)"
else
  echo "  FAIL: expected default docs/chester/plans (user dirs should be ignored)"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_CONFIG_PATH=.*settings.chester.json"; then
  echo "  PASS: config path set to user config"
else
  echo "  FAIL: expected config path to user config"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi

# Test 3: Project-level config reads directory paths
echo "--- Test: project-level config sets dirs ---"
mkdir -p "$TMPDIR/.claude"
cat > "$TMPDIR/.claude/settings.chester.local.json" << 'CONF'
{"working_dir": "project/working", "plans_dir": "project/plans"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='project/working'"; then
  echo "  PASS: project working_dir used"
else
  echo "  FAIL: expected project/working"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='project/plans'"; then
  echo "  PASS: project plans_dir used"
else
  echo "  FAIL: expected project/plans"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_CONFIG_PATH=.*settings.chester.local.json"; then
  echo "  PASS: config path set to project config"
else
  echo "  FAIL: expected config path to project config"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi

# Test 4: Project config partial — missing key falls back to default
echo "--- Test: partial project config uses defaults for missing keys ---"
cat > "$TMPDIR/.claude/settings.chester.local.json" << 'CONF'
{"working_dir": "only/working"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='only/working'"; then
  echo "  PASS: project working_dir used"
else
  echo "  FAIL: expected only/working"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='docs/chester/plans'"; then
  echo "  PASS: missing plans_dir falls back to default"
else
  echo "  FAIL: expected default docs/chester/plans"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi

# Test 5: Both configs — dirs from project only, not merged from user
echo "--- Test: both configs, dirs from project only ---"
cat > "$HOME/.claude/settings.chester.json" << 'CONF'
{"working_dir": "user/working", "plans_dir": "user/plans"}
CONF
cat > "$TMPDIR/.claude/settings.chester.local.json" << 'CONF'
{"plans_dir": "project/plans"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='docs/chester/working'"; then
  echo "  PASS: working_dir is default (not from user config)"
else
  echo "  FAIL: expected default (user working_dir should not leak)"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='project/plans'"; then
  echo "  PASS: plans_dir from project config"
else
  echo "  FAIL: expected project/plans"
  echo "  GOT: $OUTPUT"
  ERRORS=$((ERRORS + 1))
fi

# Cleanup handled by trap
echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "CONFIG-READ: $ERRORS failures"
  exit 1
fi
echo "CONFIG-READ: all tests passed"
exit 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-config-read-new.sh`
Expected: FAIL — the script still uses old config paths (`~/.claude/.chester/...` and `.chester/...`)

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/test-config-read-new.sh
git commit -m "test: update config read tests for new locations and directory isolation"
```

---

### Task 2: Rewrite config resolution script

**Files:**
- Modify: `chester-hooks/chester-config-read.sh` (rewrite)

- [ ] **Step 1: Replace the config script**

Write the complete new script:

```bash
#!/usr/bin/env bash
# chester-config-read.sh — Resolve layered Chester config
# Usage: eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
# Exports: CHESTER_WORK_DIR, CHESTER_PLANS_DIR, CHESTER_CONFIG_PATH

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Defaults (single source of truth)
DEFAULT_WORK_DIR="docs/chester/working"
DEFAULT_PLANS_DIR="docs/chester/plans"

# Config locations (Claude Code convention)
PROJECT_CONFIG="$PROJECT_ROOT/.claude/settings.chester.local.json"
USER_CONFIG="$HOME/.claude/settings.chester.json"

# --- Config resolution ---
if command -v jq &>/dev/null; then
  if [ -f "$PROJECT_CONFIG" ]; then
    # Directory paths come ONLY from project config (never user config)
    CHESTER_WORK_DIR=$(jq -r '.working_dir // "'"$DEFAULT_WORK_DIR"'"' "$PROJECT_CONFIG")
    CHESTER_PLANS_DIR=$(jq -r '.plans_dir // "'"$DEFAULT_PLANS_DIR"'"' "$PROJECT_CONFIG")
    CHESTER_CONFIG_PATH="$PROJECT_CONFIG"
  elif [ -f "$USER_CONFIG" ]; then
    # User config exists but has no directory authority — use defaults
    CHESTER_WORK_DIR="$DEFAULT_WORK_DIR"
    CHESTER_PLANS_DIR="$DEFAULT_PLANS_DIR"
    CHESTER_CONFIG_PATH="$USER_CONFIG"
  else
    CHESTER_WORK_DIR="$DEFAULT_WORK_DIR"
    CHESTER_PLANS_DIR="$DEFAULT_PLANS_DIR"
    CHESTER_CONFIG_PATH="none"
  fi
else
  CHESTER_WORK_DIR="$DEFAULT_WORK_DIR"
  CHESTER_PLANS_DIR="$DEFAULT_PLANS_DIR"
  CHESTER_CONFIG_PATH="none"
  echo "# Chester: jq not available, using defaults" >&2
fi

echo "export CHESTER_WORK_DIR='$CHESTER_WORK_DIR'"
echo "export CHESTER_PLANS_DIR='$CHESTER_PLANS_DIR'"
echo "export CHESTER_CONFIG_PATH='$CHESTER_CONFIG_PATH'"
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `bash tests/test-config-read-new.sh`
Expected: PASS — all 5 tests pass

- [ ] **Step 3: Run existing schema test**

Run: `bash tests/test-chester-config.sh`
Expected: PASS (or skip if it depends on old config paths — note any failures)

- [ ] **Step 4: Commit**

```bash
git add chester-hooks/chester-config-read.sh
git commit -m "feat: rewrite config resolution for Claude Code conventions

Directory paths read only from project config. User config provides
cross-project settings only. Migration code removed."
```

---

### Task 3: Delete migration test file

**Files:**
- Delete: `tests/test-config-migration.sh`

- [ ] **Step 1: Delete the file**

```bash
git rm tests/test-config-migration.sh
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove migration test (migration code removed)"
```

---

### Task 4: Update chester-start first-run setup

**Files:**
- Modify: `chester-start/SKILL.md:73-108`

- [ ] **Step 1: Replace the first-run setup block**

In `chester-start/SKILL.md`, replace lines 73–108 (from `e. Ensure working directory` through `echo '{}' > "$HOME/.claude/.chester/.settings.chester.json"` and the closing `fi`).

Replace with:

```markdown
   e. Ensure working directory is in `.gitignore`:
   ```bash
   if ! git check-ignore -q "$CHESTER_WORK_DIR" 2>/dev/null; then
     echo "$CHESTER_WORK_DIR/" >> .gitignore
     git add .gitignore
     git commit -m "chore: add chester working directory to .gitignore"
   fi
   ```

   f. Write project config:
   ```bash
   PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
   mkdir -p "$PROJECT_ROOT/.claude"
   ```
   Write to `$PROJECT_ROOT/.claude/settings.chester.local.json`:
   ```json
   {
     "working_dir": "<user's chosen working directory>",
     "plans_dir": "<user's chosen plans directory>"
   }
   ```
   Create user-level config if it doesn't exist:
   ```bash
   if [ ! -f "$HOME/.claude/settings.chester.json" ]; then
     echo '{}' > "$HOME/.claude/settings.chester.json"
   fi
   ```
```

Key changes:
- Remove the `.chester/` gitignore check (no longer needed — config is in `.claude/`)
- Config written to `.claude/settings.chester.local.json` (not `.chester/.settings...`)
- User config at `~/.claude/settings.chester.json` (not `~/.claude/.chester/...`)
- No `mkdir -p` for `.chester` directory

- [ ] **Step 2: Verify the skill file reads correctly**

Read the modified file and confirm the first-run flow references only the new paths:
- Project config: `{project-root}/.claude/settings.chester.local.json`
- User config: `~/.claude/settings.chester.json`
- No references to `.chester/` directory at project root

- [ ] **Step 3: Commit**

```bash
git add chester-start/SKILL.md
git commit -m "feat: update first-run setup for new config locations

Config now at .claude/settings.chester.local.json (project) and
~/.claude/settings.chester.json (user). Removed .chester/ directory refs."
```

---

### Task 5: Update budget guard paths in 5 skills

**Files:**
- Modify: `chester-figure-out/SKILL.md:13`
- Modify: `chester-build-spec/SKILL.md:13`
- Modify: `chester-build-plan/SKILL.md:15`
- Modify: `chester-write-code/SKILL.md:15`
- Modify: `chester-finish-plan/SKILL.md:15`

- [ ] **Step 1: Update all 5 budget guard paths**

In each file, replace:
```
cat ~/.claude/.chester/.settings.chester.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'
```
With:
```
cat ~/.claude/settings.chester.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'
```

- [ ] **Step 2: Verify the changes**

```bash
grep -r '\.claude/.chester/.settings' chester-figure-out/ chester-build-spec/ chester-build-plan/ chester-write-code/ chester-finish-plan/ && echo "OLD REFS FOUND" || echo "Clean"
```

Expected: "Clean"

- [ ] **Step 3: Commit**

```bash
git add chester-figure-out/SKILL.md chester-build-spec/SKILL.md chester-build-plan/SKILL.md chester-write-code/SKILL.md chester-finish-plan/SKILL.md
git commit -m "fix: update budget guard config path in 5 pipeline skills"
```

---

### Task 6: Update test files for new config paths

**Files:**
- Modify: `tests/test-chester-config.sh`
- Modify: `tests/test-integration.sh`

- [ ] **Step 1: Update test-chester-config.sh**

Replace line 4:
```bash
CONFIG="$HOME/.claude/.chester/.settings.chester.json"
```
With:
```bash
CONFIG="$HOME/.claude/settings.chester.json"
```

- [ ] **Step 2: Update test-integration.sh**

Replace lines 34-35:
```bash
if [ -f "$HOME/.claude/.chester/.settings.chester.json" ]; then
  T=$(jq -r '.budget_guard.threshold_percent' "$HOME/.claude/.chester/.settings.chester.json")
```
With:
```bash
if [ -f "$HOME/.claude/settings.chester.json" ]; then
  T=$(jq -r '.budget_guard.threshold_percent' "$HOME/.claude/settings.chester.json")
```

Also update line 43:
```bash
  echo "  FAIL: .settings.chester.json missing"
```
With:
```bash
  echo "  FAIL: settings.chester.json missing"
```

- [ ] **Step 3: Commit**

```bash
git add tests/test-chester-config.sh tests/test-integration.sh
git commit -m "fix: update test files for new config paths"
```

---

### Task 7: Remove visual-companion

**Files:**
- Delete: `chester-figure-out/visual-companion.md`
- Modify: `chester-figure-out/SKILL.md:209`

- [ ] **Step 1: Delete visual-companion.md**

```bash
git rm chester-figure-out/visual-companion.md
```

- [ ] **Step 2: Remove reference in chester-figure-out/SKILL.md**

Delete lines 207-209 (the "Visual Companion" section):
```markdown
## Visual Companion

Not offered proactively. The user can request it explicitly if needed during the interview. If requested, read the detailed guide: `~/.claude/skills/chester-figure-out/visual-companion.md`
```

- [ ] **Step 3: Commit**

```bash
git add chester-figure-out/SKILL.md
git commit -m "chore: remove visual-companion (unused)"
```

---

### Task 8: End-to-end verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

```bash
bash tests/test-config-read-new.sh
bash tests/test-chester-config.sh
bash tests/test-integration.sh
```

Expected: All pass.

- [ ] **Step 2: Manual smoke test**

```bash
# In a temp directory with no config, verify defaults
cd "$(mktemp -d)" && git init -q
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
echo "WORK=$CHESTER_WORK_DIR PLANS=$CHESTER_PLANS_DIR CONFIG=$CHESTER_CONFIG_PATH"
# Expected: WORK=docs/chester/working PLANS=docs/chester/plans CONFIG=none
```

- [ ] **Step 3: Verify no old path references remain in source files**

```bash
grep -r '\.claude/.chester/.settings\|\.chester/.settings\|chester-config\.json\|migrate_user\|migrate_project' chester-hooks/ chester-start/ chester-figure-out/ chester-build-spec/ chester-build-plan/ chester-write-code/ chester-finish-plan/ tests/ || echo "Clean — no old references"
```

Expected: "Clean — no old references"