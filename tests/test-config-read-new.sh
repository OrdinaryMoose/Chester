#!/usr/bin/env bash
set -euo pipefail
echo "=== Config Read Test ==="
ERRORS=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/chester-util-config/chester-config-read.sh"

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
if echo "$OUTPUT" | grep -q "CHESTER_WORK_DIR"; then
  echo "  FAIL: CHESTER_WORK_DIR should not be exported"
  ERRORS=$((ERRORS + 1))
else
  echo "  PASS: no CHESTER_WORK_DIR exported"
fi

# Test 2: User-level config only — directory paths ignored, config path set
echo "--- Test: user-level config only (dirs ignored) ---"
cat > "$HOME/.claude/settings.chester.json" << 'CONF'
{"plans_dir": "user/plans", "notes": "user-level config ignored for directory paths"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
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
{"plans_dir": "project/plans"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
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
{"notes": "partial config — no directory keys"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
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
{"plans_dir": "user/plans"}
CONF
cat > "$TMPDIR/.claude/settings.chester.local.json" << 'CONF'
{"plans_dir": "project/plans"}
CONF
OUTPUT=$(bash "$SCRIPT" 2>/dev/null)
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
