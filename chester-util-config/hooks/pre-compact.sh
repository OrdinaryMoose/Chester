#!/usr/bin/env bash
# PreCompact hook — snapshots MCP interview state before context compaction.
# Reads understanding and enforcement state files, writes consolidated snapshot.
# Always exits 0 — never blocks compaction.
set -uo pipefail

INPUT=$(cat)

# Source chester config — exit silently if unavailable
eval "$(chester-config-read)" 2>/dev/null || exit 0

# Read breadcrumb — exit silently if not in an interview session
BREADCRUMB_FILE="$CHESTER_WORKING_DIR/.active-sprint"
[ -f "$BREADCRUMB_FILE" ] || exit 0

SPRINT_NAME=$(cat "$BREADCRUMB_FILE")
SPRINT_PATH="$CHESTER_WORKING_DIR/$SPRINT_NAME"
LOGFILE="$SPRINT_PATH/design/.compaction-hook.log"

log_error() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] pre-compact ERROR: $*" >> "$LOGFILE" 2>/dev/null || true
}

# Verify design directory exists
if [ ! -d "$SPRINT_PATH/design" ]; then
  log_error "design directory not found: $SPRINT_PATH/design"
  exit 0
fi

# Extract session_id from stdin JSON
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""') || {
  log_error "failed to parse session_id from stdin"
  exit 0
}

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Find state files (glob for sprint-name prefix)
UNDERSTANDING_FILE=$(ls "$SPRINT_PATH"/design/*-understanding-state.json 2>/dev/null | head -1) || true
ENFORCEMENT_FILE=$(ls "$SPRINT_PATH"/design/*-enforcement-state.json 2>/dev/null | head -1) || true

# Determine phase
if [ -n "$UNDERSTANDING_FILE" ] && [ -n "$ENFORCEMENT_FILE" ]; then
  PHASE="solve"
elif [ -n "$UNDERSTANDING_FILE" ]; then
  PHASE="understand"
else
  # No state files — nothing to snapshot
  exit 0
fi

# Read state files
UNDERSTANDING_STATE="null"
ENFORCEMENT_STATE="null"
if [ -n "$UNDERSTANDING_FILE" ]; then
  UNDERSTANDING_STATE=$(cat "$UNDERSTANDING_FILE") || {
    log_error "failed to read understanding state: $UNDERSTANDING_FILE"
    exit 0
  }
fi
if [ -n "$ENFORCEMENT_FILE" ]; then
  ENFORCEMENT_STATE=$(cat "$ENFORCEMENT_FILE") || {
    log_error "failed to read enforcement state: $ENFORCEMENT_FILE"
    exit 0
  }
fi

# Write consolidated snapshot
jq -n \
  --arg sid "$SESSION_ID" \
  --arg ts "$TIMESTAMP" \
  --arg sprint "$SPRINT_NAME" \
  --arg phase "$PHASE" \
  --argjson understanding "$UNDERSTANDING_STATE" \
  --argjson enforcement "$ENFORCEMENT_STATE" \
  '{
    session_id: $sid,
    timestamp: $ts,
    sprint_name: $sprint,
    phase: $phase,
    understanding: $understanding,
    enforcement: $enforcement
  }' > "$SPRINT_PATH/design/.compaction-snapshot.json" || {
  log_error "failed to write snapshot"
  exit 0
}

exit 0
