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
  CHESTER_WORK_DIR="$DEFAULT_WORK_DIR"
  CHESTER_PLANS_DIR="$DEFAULT_PLANS_DIR"
  CHESTER_CONFIG_PATH="none"
  echo "# Chester: jq not available, using defaults" >&2
fi

echo "export CHESTER_WORK_DIR='$CHESTER_WORK_DIR'"
echo "export CHESTER_PLANS_DIR='$CHESTER_PLANS_DIR'"
echo "export CHESTER_CONFIG_PATH='$CHESTER_CONFIG_PATH'"
