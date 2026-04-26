#!/bin/bash
# Tests: AC-3.1, AC-3.2 — session metadata file written by helper
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HELPER="$REPO_ROOT/chester-util-config/write-session-metadata.sh"

if [ ! -x "$HELPER" ]; then
  echo "FAIL: helper script $HELPER not executable"
  exit 1
fi

TMPDIR="$(mktemp -d)"
SPRINT_SUBDIR="20260425-99-test-helper-execution"
DESIGN_DIR="$TMPDIR/$SPRINT_SUBDIR/design"
mkdir -p "$DESIGN_DIR"
trap "rm -rf $TMPDIR" EXIT

bash "$HELPER" "$DESIGN_DIR" "$SPRINT_SUBDIR" "$REPO_ROOT"

META_FILE="$DESIGN_DIR/test-helper-execution-session-meta.json"
if [ ! -f "$META_FILE" ]; then
  echo "FAIL AC-3.1: metadata file not written at $META_FILE"
  exit 1
fi

if ! jq -e . "$META_FILE" >/dev/null 2>&1; then
  echo "FAIL AC-3.1: metadata file not parseable JSON"
  exit 1
fi

SPRINT_NAME=$(jq -r '.sprintName' "$META_FILE")
[ "$SPRINT_NAME" = "$SPRINT_SUBDIR" ] || { echo "FAIL AC-3.2: sprintName mismatch (got $SPRINT_NAME)"; exit 1; }

BRANCH_NAME=$(jq -r '.branchName' "$META_FILE")
[ "$BRANCH_NAME" = "$SPRINT_SUBDIR" ] || { echo "FAIL AC-3.2: branchName mismatch"; exit 1; }

TIMESTAMP=$(jq -r '.sessionStartTimestamp' "$META_FILE")
echo "$TIMESTAMP" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' || { echo "FAIL AC-3.2: sessionStartTimestamp not ISO 8601 UTC (got $TIMESTAMP)"; exit 1; }

jq -e 'has("jsonlSessionId")' "$META_FILE" >/dev/null || { echo "FAIL AC-3.2: jsonlSessionId key missing"; exit 1; }

jq -e '.skillVersion | has("utilDesignPartnerRole") and has("designLargeTask")' "$META_FILE" >/dev/null || { echo "FAIL AC-3.2: skillVersion shape wrong"; exit 1; }

echo "PASS: AC-3.1, AC-3.2"
