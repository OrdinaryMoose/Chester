# Layered Chester Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Chester's scattered config system with layered user/project settings, rename artifact directories for clarity, and update all skills to use the new paths.

**Architecture:** Two JSON config files (user-level at `~/.claude/.chester/`, project-level at `{project}/.chester/`) deep-merged at read time by a rewritten `chester-config-read.sh`. Artifact directories renamed: `working/` (gitignored drafts) and `plans/` (committed archive). Auto-migration from old locations on first run.

**Tech Stack:** Bash, jq, git

---

### Task 1: Rewrite chester-config-read.sh

**Files:**
- Modify: `chester-hooks/chester-config-read.sh`

This is the foundation — all other skills depend on it.

- [ ] **Step 1: Write the failing test**

Create `tests/test-config-read-new.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "=== Config Read (New Locations) Test ==="
ERRORS=0
SCRIPT="$HOME/.claude/skills/chester-hooks/chester-config-read.sh"

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

# Test 2: User-level config only (writes to fake HOME)
echo "--- Test: user-level config only ---"
mkdir -p "$HOME/.claude/.chester"
cat > "$HOME/.claude/.chester/.settings.chester.json" << 'CONF'
{"working_dir": "custom/working", "plans_dir": "custom/plans", "budget_guard": {"threshold_percent": 90, "enabled": true}}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='custom/working'"; then
  echo "  PASS: user-level working_dir"
else
  echo "  FAIL: expected custom/working"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='custom/plans'"; then
  echo "  PASS: user-level plans_dir"
else
  echo "  FAIL: expected custom/plans"
  ERRORS=$((ERRORS + 1))
fi

# Test 3: Project-level overrides user-level (deep merge)
echo "--- Test: project overrides user (deep merge) ---"
mkdir -p "$TMPDIR/.chester"
cat > "$TMPDIR/.chester/.settings.chester.local.json" << 'CONF'
{"working_dir": "project/working"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR='project/working'"; then
  echo "  PASS: project overrides working_dir"
else
  echo "  FAIL: expected project/working"
  ERRORS=$((ERRORS + 1))
fi
if echo "$OUTPUT" | grep -q "CHESTER_PLANS_DIR='custom/plans'"; then
  echo "  PASS: user plans_dir inherited (not overridden)"
else
  echo "  FAIL: expected custom/plans inherited"
  ERRORS=$((ERRORS + 1))
fi

# No cleanup needed — fake HOME is removed by trap

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
Expected: FAIL — script still exports old variable names

- [ ] **Step 3: Rewrite chester-config-read.sh**

Replace the entire file with:

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

# New config locations
PROJECT_CONFIG="$PROJECT_ROOT/.chester/.settings.chester.local.json"
USER_CONFIG="$HOME/.claude/.chester/.settings.chester.json"

# Old config locations (for migration detection)
OLD_GLOBAL_CONFIG="$HOME/.claude/chester-config.json"
OLD_PROJECT_HASH="$(echo "$PROJECT_ROOT" | sed 's|/|-|g; s|^-||')"
OLD_PROJECT_CONFIG="$HOME/.claude/projects/-${OLD_PROJECT_HASH}/chester-config.json"

# --- Auto-migration ---
migrate_user_config() {
  if [ -f "$OLD_GLOBAL_CONFIG" ] && [ ! -f "$USER_CONFIG" ]; then
    mkdir -p "$(dirname "$USER_CONFIG")"
    cp "$OLD_GLOBAL_CONFIG" "$USER_CONFIG"
    if [ -f "$USER_CONFIG" ]; then
      rm "$OLD_GLOBAL_CONFIG"
      echo "# Chester: migrated user config to $USER_CONFIG" >&2
    fi
  fi
}

migrate_project_config() {
  if [ -f "$OLD_PROJECT_CONFIG" ] && [ ! -f "$PROJECT_CONFIG" ]; then
    mkdir -p "$(dirname "$PROJECT_CONFIG")"
    # Rename keys during migration: work_dir→plans_dir, planning_dir→working_dir
    # Preserve all other keys (e.g., budget_guard)
    if command -v jq &>/dev/null; then
      jq '. + {
        working_dir: (.planning_dir // empty),
        plans_dir: (.work_dir // empty)
      } | del(.work_dir, .planning_dir)
        | with_entries(select(.value != null))' "$OLD_PROJECT_CONFIG" > "$PROJECT_CONFIG"
    else
      cp "$OLD_PROJECT_CONFIG" "$PROJECT_CONFIG"
    fi
    if [ -f "$PROJECT_CONFIG" ]; then
      rm "$OLD_PROJECT_CONFIG"
      echo "# Chester: migrated project config to $PROJECT_CONFIG" >&2
    fi
  fi
}

migrate_user_config
migrate_project_config

# --- Config resolution ---
if command -v jq &>/dev/null; then
  if [ -f "$USER_CONFIG" ] && [ -f "$PROJECT_CONFIG" ]; then
    # Deep merge: user as base, project overrides
    MERGED=$(jq -s '.[0] * .[1]' "$USER_CONFIG" "$PROJECT_CONFIG")
    CHESTER_WORK_DIR=$(echo "$MERGED" | jq -r '.working_dir // "'"$DEFAULT_WORK_DIR"'"')
    CHESTER_PLANS_DIR=$(echo "$MERGED" | jq -r '.plans_dir // "'"$DEFAULT_PLANS_DIR"'"')
    CHESTER_CONFIG_PATH="$PROJECT_CONFIG"
  elif [ -f "$PROJECT_CONFIG" ]; then
    CHESTER_WORK_DIR=$(jq -r '.working_dir // "'"$DEFAULT_WORK_DIR"'"' "$PROJECT_CONFIG")
    CHESTER_PLANS_DIR=$(jq -r '.plans_dir // "'"$DEFAULT_PLANS_DIR"'"' "$PROJECT_CONFIG")
    CHESTER_CONFIG_PATH="$PROJECT_CONFIG"
  elif [ -f "$USER_CONFIG" ]; then
    CHESTER_WORK_DIR=$(jq -r '.working_dir // "'"$DEFAULT_WORK_DIR"'"' "$USER_CONFIG")
    CHESTER_PLANS_DIR=$(jq -r '.plans_dir // "'"$DEFAULT_PLANS_DIR"'"' "$USER_CONFIG")
    CHESTER_CONFIG_PATH="$USER_CONFIG"
  else
    CHESTER_WORK_DIR="$DEFAULT_WORK_DIR"
    CHESTER_PLANS_DIR="$DEFAULT_PLANS_DIR"
    CHESTER_CONFIG_PATH="none"
  fi
else
  CHESTER_WORK_DIR="docs/chester/working"
  CHESTER_PLANS_DIR="docs/chester/plans"
  CHESTER_CONFIG_PATH="none"
  echo "# Chester: jq not available, using defaults" >&2
fi

echo "export CHESTER_WORK_DIR='$CHESTER_WORK_DIR'"
echo "export CHESTER_PLANS_DIR='$CHESTER_PLANS_DIR'"
echo "export CHESTER_CONFIG_PATH='$CHESTER_CONFIG_PATH'"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-config-read-new.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add chester-hooks/chester-config-read.sh tests/test-config-read-new.sh
git commit -m "feat: rewrite chester-config-read.sh for layered config"
```

---

### Task 2: Write auto-migration test

**Files:**
- Create: `tests/test-config-migration.sh`

- [ ] **Step 1: Write the migration test**

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "=== Config Migration Test ==="
ERRORS=0
SCRIPT="$HOME/.claude/skills/chester-hooks/chester-config-read.sh"

TMPDIR=$(mktemp -d)
REAL_HOME="$HOME"
export HOME="$TMPDIR/fakehome"
mkdir -p "$HOME/.claude"
trap 'rm -rf "$TMPDIR"; export HOME="$REAL_HOME"' EXIT
cd "$TMPDIR"
git init -q

# Test 1: User-level migration
echo "--- Test: user-level auto-migration ---"
cat > "$HOME/.claude/chester-config.json" << 'CONF'
{"budget_guard": {"threshold_percent": 85, "enabled": true}}
CONF
bash "$SCRIPT" > /dev/null 2>&1
if [ -f "$HOME/.claude/.chester/.settings.chester.json" ]; then
  echo "  PASS: new user config created"
else
  echo "  FAIL: new user config not created"
  ERRORS=$((ERRORS + 1))
fi
if [ ! -f "$HOME/.claude/chester-config.json" ]; then
  echo "  PASS: old user config removed"
else
  echo "  FAIL: old user config still exists"
  ERRORS=$((ERRORS + 1))
fi

# Test 2: Project-level migration with key rename
echo "--- Test: project-level migration with key rename ---"
PROJECT_HASH="$(echo "$TMPDIR" | sed 's|/|-|g; s|^-||')"
OLD_DIR="$HOME/.claude/projects/-${PROJECT_HASH}"
mkdir -p "$OLD_DIR"
cat > "$OLD_DIR/chester-config.json" << 'CONF'
{"work_dir": "docs/chester", "planning_dir": "docs/chester-planning"}
CONF
bash "$SCRIPT" > /dev/null 2>&1
if [ -f "$TMPDIR/.chester/.settings.chester.local.json" ]; then
  # Check key renaming
  PLANS=$(jq -r '.plans_dir' "$TMPDIR/.chester/.settings.chester.local.json")
  WORKING=$(jq -r '.working_dir' "$TMPDIR/.chester/.settings.chester.local.json")
  if [ "$PLANS" = "docs/chester" ]; then
    echo "  PASS: work_dir migrated to plans_dir"
  else
    echo "  FAIL: expected plans_dir=docs/chester, got $PLANS"
    ERRORS=$((ERRORS + 1))
  fi
  if [ "$WORKING" = "docs/chester-planning" ]; then
    echo "  PASS: planning_dir migrated to working_dir"
  else
    echo "  FAIL: expected working_dir=docs/chester-planning, got $WORKING"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  FAIL: project config not migrated"
  ERRORS=$((ERRORS + 1))
fi

# Test 3: No overwrite of existing new config
echo "--- Test: no overwrite of existing config ---"
mkdir -p "$HOME/.claude/.chester"
echo '{"working_dir": "keep-this"}' > "$HOME/.claude/.chester/.settings.chester.json"
echo '{"budget_guard": {"threshold_percent": 99}}' > "$HOME/.claude/chester-config.json"
bash "$SCRIPT" > /dev/null 2>&1
KEPT=$(jq -r '.working_dir' "$HOME/.claude/.chester/.settings.chester.json")
if [ "$KEPT" = "keep-this" ]; then
  echo "  PASS: existing config not overwritten"
else
  echo "  FAIL: existing config was overwritten"
  ERRORS=$((ERRORS + 1))
fi

# No cleanup needed — fake HOME is removed by trap

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "MIGRATION: $ERRORS failures"
  exit 1
fi
echo "MIGRATION: all tests passed"
exit 0
```

- [ ] **Step 2: Run test to verify it passes**

Run: `bash tests/test-config-migration.sh`
Expected: PASS (config-read.sh already handles migration from Task 1)

- [ ] **Step 3: Commit**

```bash
git add tests/test-config-migration.sh
git commit -m "test: add config migration tests"
```

---

### Task 3: Update chester-start first-run setup

**Files:**
- Modify: `chester-start/SKILL.md`

- [ ] **Step 1: Update the first-run configuration section**

In `chester-start/SKILL.md`, replace the block from step 3b through step 3g (the user prompt, directory creation, gitignore, config write, and announcement) with:

```markdown
   b. Present defaults and ask for confirmation or customization:
   ```
   Chester needs two directories for this project:

   Plans directory (committed archive): docs/chester/plans/
   Working directory (gitignored, for active docs): docs/chester/working/

   Accept defaults? Or enter custom paths.
   ```

   c. User accepts defaults or provides custom paths for either or both.

   d. Create both directories:
   ```bash
   mkdir -p "$CHESTER_WORK_DIR"
   mkdir -p "$CHESTER_PLANS_DIR"
   ```

   e. Ensure working directory and .chester/ are in `.gitignore`:
   ```bash
   NEEDS_IGNORE=false
   if ! git check-ignore -q "$CHESTER_WORK_DIR" 2>/dev/null; then
     echo "$CHESTER_WORK_DIR/" >> .gitignore
     NEEDS_IGNORE=true
   fi
   if ! git check-ignore -q ".chester" 2>/dev/null; then
     echo ".chester/" >> .gitignore
     NEEDS_IGNORE=true
   fi
   if [ "$NEEDS_IGNORE" = true ]; then
     git add .gitignore
     git commit -m "chore: add chester directories to .gitignore"
   fi
   ```

   f. Create the project config directory and write config:
   ```bash
   PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
   mkdir -p "$PROJECT_ROOT/.chester"
   ```
   Write to `$PROJECT_ROOT/.chester/.settings.chester.local.json`:
   ```json
   {
     "working_dir": "<user's chosen working directory>",
     "plans_dir": "<user's chosen plans directory>"
   }
   ```
   Create user-level config if it doesn't exist:
   ```bash
   if [ ! -f "$HOME/.claude/.chester/.settings.chester.json" ]; then
     mkdir -p "$HOME/.claude/.chester"
     echo '{}' > "$HOME/.claude/.chester/.settings.chester.json"
   fi
   ```

   g. Announce: "Chester configured. Plans archived to `{plans_dir}`, working docs at `{working_dir}`."
```

Also update the "If `CHESTER_CONFIG_PATH` is not `none`" line at the end to check for working directory instead of planning directory:

```markdown
   If `CHESTER_CONFIG_PATH` is not `none`, read silently and proceed. No announcement unless there's a problem (e.g., working directory missing from .gitignore — fix and warn).
```

- [ ] **Step 2: Verify the skill file is syntactically correct**

Run: `grep -c 'CHESTER_PLANNING_DIR' chester-start/SKILL.md`
Expected: 0 (no old variable references remain)

Run: `grep -c 'CHESTER_WORK_DIR\|CHESTER_PLANS_DIR' chester-start/SKILL.md`
Expected: > 0 (new variables are used)

- [ ] **Step 3: Commit**

```bash
git add chester-start/SKILL.md
git commit -m "feat: update chester-start for layered config"
```

---

### Task 4: Update artifact-producing skills (dual-write pattern)

**Files:**
- Modify: `chester-figure-out/SKILL.md`
- Modify: `chester-build-spec/SKILL.md`
- Modify: `chester-build-plan/SKILL.md`
- Modify: `chester-write-code/SKILL.md`
- Modify: `chester-write-summary/SKILL.md`
- Modify: `chester-trace-reasoning/SKILL.md`

All these skills follow the same dual-write pattern. Apply these substitutions consistently:

**Variable mapping:**
- `CHESTER_WORK_DIR` (old, was committed dir) → `CHESTER_PLANS_DIR` (new, committed plans)
- `CHESTER_PLANNING_DIR` (old, was gitignored dir) → `CHESTER_WORK_DIR` (new, gitignored working)

**Context clues for correct mapping:**
- Lines referencing "worktree" or committed artifacts → use `CHESTER_PLANS_DIR`
- Lines referencing "main tree", "copy", or gitignored working copies → use `CHESTER_WORK_DIR`

- [ ] **Step 1: Update chester-figure-out/SKILL.md**

Apply variable rename across the file. Key sections:
- Phase 4 closure steps 7-13: swap all `CHESTER_WORK_DIR` → `CHESTER_PLANS_DIR` and `CHESTER_PLANNING_DIR` → `CHESTER_WORK_DIR`
- Sprint docs announcement: `CHESTER_WORK_DIR` (new = working dir)

- [ ] **Step 2: Update chester-build-spec/SKILL.md**

Apply variable rename:
- Standalone invocation section: create dirs with `CHESTER_PLANS_DIR` and `CHESTER_WORK_DIR`
- Writing the spec section: write to `CHESTER_PLANS_DIR`, copy to `CHESTER_WORK_DIR`

- [ ] **Step 3: Update chester-build-plan/SKILL.md**

Apply variable rename:
- Save plans section: write to `CHESTER_PLANS_DIR`, copy to `CHESTER_WORK_DIR`

- [ ] **Step 4: Update chester-write-code/SKILL.md**

Apply variable rename:
- Deferred items section: write to `CHESTER_PLANS_DIR`, copy to `CHESTER_WORK_DIR`

- [ ] **Step 5: Update chester-write-summary/SKILL.md**

Apply variable rename:
- Summary output: scan under `CHESTER_PLANS_DIR`, write to `CHESTER_PLANS_DIR`, copy to `CHESTER_WORK_DIR`

- [ ] **Step 6: Update chester-trace-reasoning/SKILL.md**

Apply variable rename:
- Audit output: scan under `CHESTER_PLANS_DIR`, write to `CHESTER_PLANS_DIR`, copy to `CHESTER_WORK_DIR`

- [ ] **Step 7: Verify no old variable references remain**

Run: `grep -rl 'CHESTER_PLANNING_DIR' chester-*/SKILL.md`
Expected: no output (no old references)

Run: `grep -rl 'CHESTER_WORK_DIR\|CHESTER_PLANS_DIR' chester-*/SKILL.md | sort`
Expected: list of updated skill files

- [ ] **Step 8: Commit**

```bash
git add chester-figure-out/SKILL.md chester-build-spec/SKILL.md chester-build-plan/SKILL.md chester-write-code/SKILL.md chester-write-summary/SKILL.md chester-trace-reasoning/SKILL.md
git commit -m "feat: update all skills to use new config variable names"
```

---

### Task 4b: Update budget guard paths in pipeline skills

**Files:**
- Modify: `chester-figure-out/SKILL.md`
- Modify: `chester-build-spec/SKILL.md`
- Modify: `chester-build-plan/SKILL.md`
- Modify: `chester-finish-plan/SKILL.md`
- Modify: `chester-write-code/SKILL.md`

All 5 pipeline skills contain a Budget Guard Check section with a hardcoded path to the old config location. Update them all.

- [ ] **Step 1: Update budget guard config path in all 5 skills**

In each skill's Budget Guard Check section, replace:
```
cat ~/.claude/chester-config.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'
```
with:
```
cat ~/.claude/.chester/.settings.chester.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'
```

- [ ] **Step 2: Verify no old config path references remain**

Run: `grep -rl 'chester-config.json' chester-*/SKILL.md`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add chester-figure-out/SKILL.md chester-build-spec/SKILL.md chester-build-plan/SKILL.md chester-finish-plan/SKILL.md chester-write-code/SKILL.md
git commit -m "fix: update budget guard paths to new config location"
```

---

### Task 4c: Update CLAUDE.md documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update repository structure section**

Replace references to old directory names:
- `docs/chester/` → `docs/chester/plans/` (committed session artifacts)
- `docs/chester-planning/` → `docs/chester/working/` (gitignored active planning docs)

- [ ] **Step 2: Update Key Scripts section**

Replace:
```
Exports `CHESTER_WORK_DIR`, `CHESTER_PLANNING_DIR`, `CHESTER_CONFIG_PATH`.
```
with:
```
Exports `CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for new config and directory names"
```

---

### Task 5: Update chester-finish-plan for new lifecycle

**Files:**
- Modify: `chester-finish-plan/SKILL.md`

This skill has unique behavior — it's the one that cleans up the working directory after merge.

- [ ] **Step 1: Update variable references**

Apply the same variable mapping:
- Cleanup step: `rm -rf "{CHESTER_PLANNING_DIR}/{sprint-subdir}/"` → `rm -rf "{CHESTER_WORK_DIR}/{sprint-subdir}/"`
- Summary git add: `{CHESTER_WORK_DIR}/{sprint-subdir}/summary/` → `{CHESTER_PLANS_DIR}/{sprint-subdir}/summary/`
- Announcement text: update "planning copy" → "working copy"

- [ ] **Step 2: Verify no old variable references**

Run: `grep -c 'CHESTER_PLANNING_DIR' chester-finish-plan/SKILL.md`
Expected: 0

- [ ] **Step 3: Commit**

```bash
git add chester-finish-plan/SKILL.md
git commit -m "feat: update chester-finish-plan for new directory lifecycle"
```

---

### Task 6: Update existing tests

**Files:**
- Modify: `tests/test-chester-config.sh`
- Modify: `tests/test-integration.sh`

- [ ] **Step 1: Update test-chester-config.sh**

Change config path from `$HOME/.claude/chester-config.json` to `$HOME/.claude/.chester/.settings.chester.json`. The budget_guard assertions remain the same (schema unchanged).

- [ ] **Step 2: Update test-integration.sh**

Change config path check on line 34 from `$HOME/.claude/chester-config.json` to `$HOME/.claude/.chester/.settings.chester.json`.

- [ ] **Step 3: Run all tests**

Run: `bash tests/test-config-read-new.sh && bash tests/test-config-migration.sh && bash tests/test-chester-config.sh && bash tests/test-integration.sh`
Expected: all pass

Note: `test-chester-config.sh` and `test-integration.sh` will only pass after the actual user-level config has been migrated (which happens on first `chester-config-read.sh` invocation). If running in isolation, the migration test covers correctness.

- [ ] **Step 4: Commit**

```bash
git add tests/test-chester-config.sh tests/test-integration.sh
git commit -m "test: update existing tests for new config paths"
```

---

### Task 7: Trigger migration and integration verification

**Files:** None (verification only + runtime migration)

- [ ] **Step 1: Trigger real migration of user config**

Run: `cat ~/.claude/chester-config.json` to verify old config exists.
Run: `eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"` — triggers auto-migration.
Run: `cat ~/.claude/.chester/.settings.chester.json` — verify new file created with same content.
Run: `ls ~/.claude/chester-config.json 2>/dev/null && echo "OLD EXISTS" || echo "OLD REMOVED"` — expected: OLD REMOVED.

- [ ] **Step 2: Verify no old references remain in any skill**

Run: `grep -rl 'CHESTER_PLANNING_DIR' chester-*/SKILL.md chester-hooks/*.sh`
Expected: no output

Run: `grep -rl 'chester-config.json' chester-*/SKILL.md chester-hooks/*.sh | grep -v test`
Expected: only the migration code in chester-config-read.sh (old location detection)

- [ ] **Step 2: Verify budget guard still reads correctly**

Run: `cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // empty'`
Expected: a number (budget guard data pipeline unaffected)

Run: `cat ~/.claude/.chester/.settings.chester.json | jq -r '.budget_guard.threshold_percent'`
Expected: 85

- [ ] **Step 4: Run all tests one final time**

Run: `cd ~/.claude/skills && for t in tests/test-*.sh; do echo "--- $t ---"; bash "$t"; echo; done`
Expected: all pass

- [ ] **Step 5: Final commit if any loose changes**

```bash
git status
# If clean, no commit needed
```

---

## Verification

After all tasks complete:

1. **Config resolution:** `eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"` exports `CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH` with correct values
2. **No old references:** `grep -rl 'CHESTER_PLANNING_DIR' chester-*/SKILL.md` returns nothing
3. **Tests pass:** All test scripts in `tests/` pass
4. **Migration complete:** `~/.claude/.chester/.settings.chester.json` exists, `~/.claude/chester-config.json` does not
5. **Skills reference correct vars:** Each skill uses `CHESTER_PLANS_DIR` for worktree/committed artifacts and `CHESTER_WORK_DIR` for main-tree/gitignored working copies
