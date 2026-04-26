#!/bin/bash
# Writes session metadata JSON for a Chester sprint.
# Usage: write-session-metadata.sh <design-dir> <sprint-subdir> <repo-root>
#
# Produces: <design-dir>/<sprint-name>-session-meta.json
# Where <sprint-name> is the verb-noun-noun portion of sprint-subdir
# (matches the convention in skills/util-artifact-schema/SKILL.md).

set -e

DESIGN_DIR="$1"
SPRINT_SUBDIR="$2"
REPO_ROOT="$3"

if [ -z "$DESIGN_DIR" ] || [ -z "$SPRINT_SUBDIR" ] || [ -z "$REPO_ROOT" ]; then
  echo "Usage: $0 <design-dir> <sprint-subdir> <repo-root>" >&2
  exit 1
fi

# Sprint name = three-word portion (strip date-NN prefix per util-artifact-schema)
SPRINT_NAME="$(echo "$SPRINT_SUBDIR" | sed -E 's/^[0-9]{8}-[0-9]+-//')"

META_FILE="$DESIGN_DIR/${SPRINT_NAME}-session-meta.json"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Best-effort JSONL session ID (Claude Code may set CLAUDE_SESSION_ID)
JSONL_SESSION_ID="${CLAUDE_SESSION_ID:-null}"
if [ "$JSONL_SESSION_ID" != "null" ]; then
  JSONL_SESSION_ID="\"$JSONL_SESSION_ID\""
fi

# Best-effort skill versions (git rev-parse on the SKILL.md files)
PARTNER_ROLE_VERSION="$(git -C "$REPO_ROOT" log -1 --format=%H -- skills/util-design-partner-role/SKILL.md 2>/dev/null || echo '')"
LARGE_TASK_VERSION="$(git -C "$REPO_ROOT" log -1 --format=%H -- skills/design-large-task/SKILL.md 2>/dev/null || echo '')"

PARTNER_JSON=$([ -n "$PARTNER_ROLE_VERSION" ] && echo "\"$PARTNER_ROLE_VERSION\"" || echo "null")
LARGE_JSON=$([ -n "$LARGE_TASK_VERSION" ] && echo "\"$LARGE_TASK_VERSION\"" || echo "null")

cat > "$META_FILE" <<EOF
{
  "sprintName": "$SPRINT_SUBDIR",
  "branchName": "$SPRINT_SUBDIR",
  "sessionStartTimestamp": "$TIMESTAMP",
  "jsonlSessionId": $JSONL_SESSION_ID,
  "skillVersion": {
    "utilDesignPartnerRole": $PARTNER_JSON,
    "designLargeTask": $LARGE_JSON
  }
}
EOF
