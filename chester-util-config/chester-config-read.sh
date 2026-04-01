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