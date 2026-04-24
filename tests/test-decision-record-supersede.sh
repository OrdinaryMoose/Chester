#!/usr/bin/env bash
# Integration test: dr_supersede — append-only supersede with bidirectional links.
#
# COVERS: AC-7.1
#
# Scenarios:
#   1. Capture first record
#   2. Capture second record
#   3. dr_supersede(firstId, secondId) → first.status=Superseded, first.Superseded By=secondId;
#      second.Supersedes=firstId
#   4. Old record body (rationale, context, trigger) unchanged except link fields
#   5. dr_supersede with missing oldId → structured error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=test-decision-record-shared-fixtures.sh
source "$SCRIPT_DIR/test-decision-record-shared-fixtures.sh"

dr_temp_store_init

[[ "${CHESTER_DECISION_RECORD_PATH:-}" == /tmp/* ]] || {
  echo "ERROR: CHESTER_DECISION_RECORD_PATH not pointed at temp store" >&2
  exit 1
}

FAILED=0
fail() { echo "FAIL: $*" >&2; FAILED=$((FAILED + 1)); }
pass() { echo "PASS: $*"; }

SPRINT="sprint-sup"
dr_mock_sprint "$SPRINT" >/dev/null

# Capture first.
FIRST_ARGS=$(jq -n --arg s "$SPRINT" '{
  sprint: $s,
  task: "Task A",
  tags: "auth",
  trigger: "How to represent tokens",
  context: "Session auth needs tokens that survive reload",
  options_considered: "A) JWT; B) opaque; C) session-cookie",
  chosen: "JWT with 24h expiry",
  rationale: "Stateless, easily rotated",
  spec_update: "AC-1.1",
  test: "auth round-trip",
  code: "src/auth.js:10"
}')
FIRST_ID=$(dr_invoke dr_capture "$FIRST_ARGS" | jq -r '.id')
[ -n "$FIRST_ID" ] && pass "captured first record ($FIRST_ID)" || fail "first capture"

# Capture second (superseder).
SECOND_ARGS=$(jq -n --arg s "$SPRINT" '{
  sprint: $s,
  task: "Task A (revised)",
  tags: "auth",
  trigger: "Token expiry proved too short",
  context: "Users complained about being logged out",
  options_considered: "A) 7d expiry; B) refresh token",
  chosen: "Refresh token with rolling 24h access",
  rationale: "Industry standard; limits blast radius",
  spec_update: "AC-1.1",
  test: "auth refresh round-trip",
  code: "src/auth.js:42"
}')
SECOND_ID=$(dr_invoke dr_capture "$SECOND_ARGS" | jq -r '.id')
[ -n "$SECOND_ID" ] && pass "captured second record ($SECOND_ID)" || fail "second capture"

# Snapshot first record's body fields before supersede (to verify no mutation
# beyond Status + Superseded By).
QB=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT" '{sprint_subject: $s}')")
ORIG_TRIGGER=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .trigger')
ORIG_CONTEXT=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .context')
ORIG_RATIONALE=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .rationale')
ORIG_CHOSEN=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .chosen')

# Supersede.
SUP_ARGS=$(jq -n --arg o "$FIRST_ID" --arg n "$SECOND_ID" '{old_id: $o, new_id: $n}')
RESULT=$(dr_invoke dr_supersede "$SUP_ARGS")
if [ "$(echo "$RESULT" | jq -r '.status // empty')" = "error" ]; then
  fail "dr_supersede rejected valid supersede: $RESULT"
fi
pass "dr_supersede accepted"

# Verify status + link fields.
QB=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT" '{sprint_subject: $s}')")
FIRST_STATUS=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .status')
FIRST_SUPERSEDED_BY=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .superseded_by')
SECOND_SUPERSEDES=$(echo "$QB" | jq -r --arg id "$SECOND_ID" '.records[] | select(.id==$id) | .supersedes')

[ "$FIRST_STATUS" = "Superseded" ] && pass "first.status=Superseded" || fail "first.status='$FIRST_STATUS' expected Superseded"
[ "$FIRST_SUPERSEDED_BY" = "$SECOND_ID" ] && pass "first.superseded_by=$SECOND_ID" || fail "first.superseded_by='$FIRST_SUPERSEDED_BY' expected $SECOND_ID"
[ "$SECOND_SUPERSEDES" = "$FIRST_ID" ] && pass "second.supersedes=$FIRST_ID" || fail "second.supersedes='$SECOND_SUPERSEDES' expected $FIRST_ID"

# Verify first-record body fields unchanged.
NEW_TRIGGER=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .trigger')
NEW_CONTEXT=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .context')
NEW_RATIONALE=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .rationale')
NEW_CHOSEN=$(echo "$QB" | jq -r --arg id "$FIRST_ID" '.records[] | select(.id==$id) | .chosen')

[ "$NEW_TRIGGER" = "$ORIG_TRIGGER" ] && pass "trigger unchanged" || fail "trigger changed: '$ORIG_TRIGGER' → '$NEW_TRIGGER'"
[ "$NEW_CONTEXT" = "$ORIG_CONTEXT" ] && pass "context unchanged" || fail "context changed"
[ "$NEW_RATIONALE" = "$ORIG_RATIONALE" ] && pass "rationale unchanged" || fail "rationale changed"
[ "$NEW_CHOSEN" = "$ORIG_CHOSEN" ] && pass "chosen unchanged" || fail "chosen changed"

# Scenario 5: missing old_id → structured error.
BAD=$(jq -n --arg n "$SECOND_ID" '{new_id: $n}')
RESULT=$(dr_invoke dr_supersede "$BAD")
if [ "$(echo "$RESULT" | jq -r '.status')" = "error" ]; then
  pass "dr_supersede rejects missing old_id"
else
  fail "dr_supersede should reject missing old_id: $RESULT"
fi

if [ "$FAILED" -gt 0 ]; then
  echo "FAIL: $FAILED assertion(s) failed in supersede"
  exit 1
fi
echo "PASS: supersede integration test"
exit 0
