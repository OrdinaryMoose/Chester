#!/usr/bin/env bash
# chester-config-read.sh — Resolve project-scoped Chester config
# Usage: source chester-hooks/chester-config-read.sh
#   or:  eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
# Exports: CHESTER_WORK_DIR, CHESTER_PLANNING_DIR, CHESTER_CONFIG_PATH

set -euo pipefail

# Resolve project hash (same convention as Claude Code)
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT_HASH="$(echo "$PROJECT_ROOT" | sed 's|/|-|g; s|^-||')"
PROJECT_CONFIG="$HOME/.claude/projects/-${PROJECT_HASH}/chester-config.json"
GLOBAL_CONFIG="$HOME/.claude/chester-config.json"

# Priority: project config > global config > defaults
if [ -f "$PROJECT_CONFIG" ]; then
  CONFIG_FILE="$PROJECT_CONFIG"
elif [ -f "$GLOBAL_CONFIG" ]; then
  CONFIG_FILE="$GLOBAL_CONFIG"
else
  CONFIG_FILE=""
fi

if [ -n "$CONFIG_FILE" ] && command -v jq &>/dev/null; then
  CHESTER_WORK_DIR="$(jq -r '.work_dir // "docs/chester"' "$CONFIG_FILE")"
  CHESTER_PLANNING_DIR="$(jq -r '.planning_dir // empty' "$CONFIG_FILE")"
  if [ -z "$CHESTER_PLANNING_DIR" ]; then
    CHESTER_PLANNING_DIR="${CHESTER_WORK_DIR}-planning"
  fi
else
  CHESTER_WORK_DIR="docs/chester"
  CHESTER_PLANNING_DIR="docs/chester-planning"
fi

CHESTER_CONFIG_PATH="${CONFIG_FILE:-none}"

# Output as eval-able exports
echo "CHESTER_WORK_DIR='$CHESTER_WORK_DIR'"
echo "CHESTER_PLANNING_DIR='$CHESTER_PLANNING_DIR'"
echo "CHESTER_CONFIG_PATH='$CHESTER_CONFIG_PATH'"
