#!/usr/bin/env bash
set -euo pipefail
echo "=== Config Migration Test ==="
ERRORS=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/chester-hooks/chester-config-read.sh"

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
