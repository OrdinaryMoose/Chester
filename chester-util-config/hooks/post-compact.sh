#!/usr/bin/env bash
# PostCompact hook — re-injects interview state after context compaction.
# Reads snapshot, validates freshness, outputs structured state summary.
# Always exits 0 — never blocks the agent.
set -uo pipefail

NL=$'\n'

INPUT=$(cat)

# Resolve chester-config-read: prefer plugin root, fall back to PATH
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -x "$CLAUDE_PLUGIN_ROOT/bin/chester-config-read" ]; then
  CONFIG_CMD="$CLAUDE_PLUGIN_ROOT/bin/chester-config-read"
elif command -v chester-config-read >/dev/null 2>&1; then
  CONFIG_CMD="chester-config-read"
else
  exit 0
fi

# Source chester config — exit silently if unavailable or vars missing
eval "$("$CONFIG_CMD")" 2>/dev/null || exit 0
[ -n "${CHESTER_WORKING_DIR:-}" ] || exit 0

# Read breadcrumb — exit silently if not in an interview session
BREADCRUMB_FILE="$CHESTER_WORKING_DIR/.active-sprint"
[ -f "$BREADCRUMB_FILE" ] || exit 0

SPRINT_NAME=$(cat "$BREADCRUMB_FILE")
SPRINT_PATH="$CHESTER_WORKING_DIR/$SPRINT_NAME"
SNAPSHOT="$SPRINT_PATH/design/.compaction-snapshot.json"
LOGFILE="$SPRINT_PATH/design/.compaction-hook.log"

log_error() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] post-compact ERROR: $*" >> "$LOGFILE" 2>/dev/null || true
}

log_warn() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] post-compact WARN: $*" >> "$LOGFILE" 2>/dev/null || true
}

# JSON string escaping — same approach as chester-util-config/session-start
escape_for_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

# Read snapshot — exit silently if none exists
[ -f "$SNAPSHOT" ] || exit 0

# Extract session_id from stdin
INPUT_SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""') || {
  log_error "failed to parse session_id from stdin"
  exit 0
}

# Validate: session ID must match
SNAP_SESSION_ID=$(jq -r '.session_id // ""' "$SNAPSHOT") || {
  log_error "failed to read snapshot session_id"
  exit 0
}
if [ "$SNAP_SESSION_ID" != "$INPUT_SESSION_ID" ]; then
  log_warn "session ID mismatch: snapshot=$SNAP_SESSION_ID, current=$INPUT_SESSION_ID"
  exit 0
fi

# Validate: snapshot must be less than 1 hour old
SNAP_TS=$(jq -r '.timestamp // ""' "$SNAPSHOT")
if [ -n "$SNAP_TS" ]; then
  SNAP_EPOCH=$(date -d "$SNAP_TS" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$SNAP_TS" +%s 2>/dev/null || echo "0")
  NOW_EPOCH=$(date +%s)
  AGE=$(( NOW_EPOCH - SNAP_EPOCH ))
  if [ "$AGE" -gt 3600 ]; then
    log_warn "stale snapshot: ${AGE}s old (max 3600s)"
    exit 0
  fi
fi

# ── Build natural-language state summary ─────────────────────────
# Uses real newlines (via $NL) so escape_for_json handles them correctly.

PHASE=$(jq -r '.phase' "$SNAPSHOT")
SUMMARY="Chester Interview State (restored after context compaction):${NL}"

# Phase identity
WEAKEST_DIM="unknown"
if [ "$PHASE" = "understand" ]; then
  ROUND=$(jq -r '.understanding.round // "?"' "$SNAPSHOT")
  SUMMARY="${SUMMARY}${NL}Phase: Understand (Phase 1)${NL}Round: $ROUND"
else
  # In solve phase, use enforcement round (it's further along)
  ROUND=$(jq -r '.enforcement.round // "?"' "$SNAPSHOT")
  SUMMARY="${SUMMARY}${NL}Phase: Solve (Phase 2)${NL}Round: $ROUND"
fi

# Understanding saturation (present in both phases)
if jq -e '.understanding' "$SNAPSHOT" >/dev/null 2>&1; then
  OVERALL=$(jq -r '.understanding.overallSaturation // "not yet scored"' "$SNAPSHOT")
  SUMMARY="${SUMMARY}${NL}Understanding saturation: $OVERALL overall"

  # Group saturations (only if computed)
  if jq -e '.understanding.groupSaturation' "$SNAPSHOT" >/dev/null 2>&1; then
    GROUPS=$(jq -r '.understanding.groupSaturation | to_entries | sort_by(.value) | .[] | "  \(.key): \(.value)"' "$SNAPSHOT" 2>/dev/null)
    if [ -n "$GROUPS" ]; then
      SUMMARY="${SUMMARY}${NL}$GROUPS"
    fi
  fi

  # Weakest dimension (only if computed)
  if jq -e '.understanding.weakest' "$SNAPSHOT" >/dev/null 2>&1; then
    WEAKEST_GROUP=$(jq -r '.understanding.weakest.group // "unknown"' "$SNAPSHOT")
    WEAKEST_DIM=$(jq -r '.understanding.weakest.dimension // "unknown"' "$SNAPSHOT")
    WEAKEST_GAP=$(jq -r '.understanding.scores[.understanding.weakest.dimension].gap // ""' "$SNAPSHOT" 2>/dev/null)
    WEAKEST_SCORE=$(jq -r '.understanding.scores[.understanding.weakest.dimension].score // "?"' "$SNAPSHOT" 2>/dev/null)
    SUMMARY="${SUMMARY}${NL}  Weakest group: $WEAKEST_GROUP"
    SUMMARY="${SUMMARY}${NL}  Weakest dimension: $WEAKEST_DIM ($WEAKEST_SCORE)"
    if [ -n "$WEAKEST_GAP" ]; then
      SUMMARY="${SUMMARY} — \"$WEAKEST_GAP\""
    fi
  fi

  # Constraints from gap fields (non-empty gaps)
  GAPS=$(jq -r '.understanding.scores | to_entries | map(select(.value.gap != "" and .value.gap != null)) | .[] | "  - [\(.key)]: \(.value.gap)"' "$SNAPSHOT" 2>/dev/null)
  if [ -n "$GAPS" ]; then
    SUMMARY="${SUMMARY}${NL}${NL}Key constraints established:${NL}$GAPS"
  fi
fi

# Enforcement data (solve phase only)
if [ "$PHASE" = "solve" ] && jq -e '.enforcement' "$SNAPSHOT" >/dev/null 2>&1; then
  SUMMARY="${SUMMARY}${NL}${NL}Enforcement state:"

  # Gate status
  NG=$(jq -r '.enforcement.gates.nonGoalsExplicit // false' "$SNAPSHOT")
  DB=$(jq -r '.enforcement.gates.decisionBoundariesExplicit // false' "$SNAPSHOT")
  SUMMARY="${SUMMARY}${NL}  Gates: nonGoalsExplicit=$NG, decisionBoundariesExplicit=$DB"

  # Challenge modes fired
  CHALLENGES=$(jq -r '.enforcement.challengeModesUsed // [] | join(", ")' "$SNAPSHOT" 2>/dev/null)
  if [ -n "$CHALLENGES" ]; then
    SUMMARY="${SUMMARY}${NL}  Challenge modes fired: $CHALLENGES"
  else
    SUMMARY="${SUMMARY}${NL}  Challenge modes fired: none"
  fi

  # Stall status
  STALLED=$(jq -r '.enforcement.stalled // false' "$SNAPSHOT")
  if [ "$STALLED" = "true" ]; then
    SUMMARY="${SUMMARY}${NL}  WARNING: Interview stalled — ambiguity not decreasing"
  fi
fi

# Transition readiness (from understanding state)
if jq -e '.understanding.transition' "$SNAPSHOT" >/dev/null 2>&1; then
  READY=$(jq -r '.understanding.transition.ready // false' "$SNAPSHOT")
  SUMMARY="${SUMMARY}${NL}${NL}Transition ready: $READY"
fi

# Directive
if [ "$PHASE" = "understand" ]; then
  SUMMARY="${SUMMARY}${NL}${NL}Resume the Understand phase. Address $WEAKEST_DIM next — it is the least-saturated dimension in the weakest group."
else
  SUMMARY="${SUMMARY}${NL}${NL}Resume the Solve phase. Continue refining the design."
fi

# ── Output hook response ─────────────────────────────────────────

ESCAPED=$(escape_for_json "$SUMMARY")

printf '{"hookSpecificOutput":{"hookEventName":"PostCompact","additionalContext":"%s"}}\n' "$ESCAPED"

exit 0
