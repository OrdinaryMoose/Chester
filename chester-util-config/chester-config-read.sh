#!/usr/bin/env bash
# chester-config-read.sh — Resolve layered Chester config
# Usage: eval "$($CHESTER_ROOT/chester-util-config/chester-config-read.sh)"
# Exports: CHESTER_WORKING_DIR, CHESTER_PLANS_DIR, CHESTER_CONFIG_PATH
#
# Directory model:
#   CHESTER_WORKING_DIR — absolute path, gitignored; all pipeline skills write here
#   CHESTER_PLANS_DIR   — relative to repo root, tracked in git; populated once at merge
#                         time by finish-archive-artifacts (no other skill writes here)

set -euo pipefail

# Anchor to the MAIN worktree root (not a child worktree)
MAIN_ROOT="$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //')"
if [ -z "$MAIN_ROOT" ]; then
  MAIN_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

# Defaults (single source of truth)
DEFAULT_WORKING_DIR="docs/chester/working"
DEFAULT_PLANS_DIR="docs/chester/plans"

# Config locations (Claude Code convention)
PROJECT_CONFIG="$MAIN_ROOT/.claude/settings.chester.local.json"
USER_CONFIG="$HOME/.claude/settings.chester.json"

# --- Config resolution ---
if command -v jq &>/dev/null; then
  if [ -f "$PROJECT_CONFIG" ]; then
    # Directory paths come ONLY from project config (never user config)
    CHESTER_WORKING_DIR=$(jq -r '.working_dir // "'"$DEFAULT_WORKING_DIR"'"' "$PROJECT_CONFIG")
    CHESTER_PLANS_DIR=$(jq -r '.plans_dir // "'"$DEFAULT_PLANS_DIR"'"' "$PROJECT_CONFIG")
    CHESTER_CONFIG_PATH="$PROJECT_CONFIG"
  elif [ -f "$USER_CONFIG" ]; then
    # User config exists but has no directory authority — use defaults
    CHESTER_WORKING_DIR="$DEFAULT_WORKING_DIR"
    CHESTER_PLANS_DIR="$DEFAULT_PLANS_DIR"
    CHESTER_CONFIG_PATH="$USER_CONFIG"
  else
    CHESTER_WORKING_DIR="$DEFAULT_WORKING_DIR"
    CHESTER_PLANS_DIR="$DEFAULT_PLANS_DIR"
    CHESTER_CONFIG_PATH="none"
  fi
else
  CHESTER_WORKING_DIR="$DEFAULT_WORKING_DIR"
  CHESTER_PLANS_DIR="$DEFAULT_PLANS_DIR"
  CHESTER_CONFIG_PATH="none"
  echo "# Chester: jq not available, using defaults" >&2
fi

# Resolve working_dir to absolute path (anchored to main worktree root)
case "$CHESTER_WORKING_DIR" in
  /*) ;; # already absolute
  *)  CHESTER_WORKING_DIR="$MAIN_ROOT/$CHESTER_WORKING_DIR" ;;
esac

echo "export CHESTER_WORKING_DIR='$CHESTER_WORKING_DIR'"
echo "export CHESTER_PLANS_DIR='$CHESTER_PLANS_DIR'"
echo "export CHESTER_CONFIG_PATH='$CHESTER_CONFIG_PATH'"
echo "export CHESTER_MAIN_ROOT='$MAIN_ROOT'"