#!/usr/bin/env bash
# Integration test: dr_capture + dr_finalize_refs + dr_verify_tests
#
# Exercises the capture → finalize → verify path end-to-end through the
# decision-record MCP's handler layer.
#
# COVERS: AC-1.1, AC-3.1, AC-4.1, AC-4.2
#
# Scenarios:
#   1. dr_capture with full field set → accepted, id returned
#   2. Captured record has Test = name-only, Code = file:line-only (no SHAs)
#   3. dr_finalize_refs with SHAs → accepted; record now SHA-finalized
#   4. Re-call dr_finalize_refs with same SHAs → accepted (idempotent)
#   5. Re-call with different SHAs → already-finalized-with-different-sha error
#   6. dr_verify_tests returns aggregate: "pass" when all records finalized
#   7. Missing required field (trigger) → {status: "error"} citing the field

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=test-decision-record-shared-fixtures.sh
source "$SCRIPT_DIR/test-decision-record-shared-fixtures.sh"

dr_temp_store_init

# Structural safety rail (plan-smell finding #3 fix): refuse to run if env var
# is empty or points at a non-temp path (e.g. production store).
[[ "${CHESTER_DECISION_RECORD_PATH:-}" == /tmp/* ]] || {
  echo "ERROR: CHESTER_DECISION_RECORD_PATH not pointed at temp store" >&2
  exit 1
}

FAILED=0
fail() { echo "FAIL: $*" >&2; FAILED=$((FAILED + 1)); }
pass() { echo "PASS: $*"; }

SPRINT="sprint-cf"
dr_mock_sprint "$SPRINT" >/dev/null

# ---- Scenario 1: dr_capture accepts a full-field payload. -----------------
CAPTURE_ARGS=$(jq -n --arg s "$SPRINT" '{
  sprint: $s,
  task: "Task 1",
  tags: "persistence,ids",
  trigger: "Ambiguity: how to format record IDs",
  context: "Need a deterministic, human-legible ID for decisions",
  options_considered: "A) YYYYMMDD-XXXXX; B) UUIDv4; C) sequential int",
  chosen: "YYYYMMDD-XXXXX",
  rationale: "Human-legible, sortable, embeds creation date",
  spec_update: "AC-1.1",
  test: "dr_capture returns id on accepted input",
  code: "mcp/chester-decision-record/store.js:280"
}')

RESULT=$(dr_invoke dr_capture "$CAPTURE_ARGS")
STATUS=$(echo "$RESULT" | jq -r '.status // ""')
REC_ID=$(echo "$RESULT" | jq -r '.id // ""')
if [ "$STATUS" = "accepted" ] && [ -n "$REC_ID" ]; then
  pass "dr_capture accepted full field set (id=$REC_ID)"
else
  fail "dr_capture did not accept full field set: $RESULT"
fi

# ---- Scenario 2: captured Test is name-only, Code is file:line-only. ------
QUERY=$(jq -n --arg s "$SPRINT" '{sprint_subject: $s}')
QR=$(dr_invoke dr_query "$QUERY")
TEST_FIELD=$(echo "$QR" | jq -r '.records[0].test // ""')
CODE_FIELD=$(echo "$QR" | jq -r '.records[0].code // ""')
if [[ "$TEST_FIELD" == *" @ "* ]]; then
  fail "capture Test field should lack SHA suffix, got: $TEST_FIELD"
else
  pass "capture Test is name-only: '$TEST_FIELD'"
fi
if [[ "$CODE_FIELD" == *" @ "* ]]; then
  fail "capture Code field should lack SHA suffix, got: $CODE_FIELD"
else
  pass "capture Code is file:line-only: '$CODE_FIELD'"
fi

# ---- Scenario 3: dr_finalize_refs attaches SHAs. --------------------------
TEST_SHA="abc1234"
CODE_SHA="def5678"
FIN_ARGS=$(jq -n --arg id "$REC_ID" --arg t "$TEST_SHA" --arg c "$CODE_SHA" \
  '{record_id: $id, test_sha: $t, code_sha: $c}')
FIN_RESULT=$(dr_invoke dr_finalize_refs "$FIN_ARGS")
if [ "$(echo "$FIN_RESULT" | jq -r '.status')" = "accepted" ]; then
  pass "dr_finalize_refs accepted initial SHAs"
else
  fail "dr_finalize_refs rejected initial SHAs: $FIN_RESULT"
fi

# Confirm the SHA is now embedded.
QR=$(dr_invoke dr_query "$QUERY")
TEST_FIELD=$(echo "$QR" | jq -r '.records[0].test // ""')
CODE_FIELD=$(echo "$QR" | jq -r '.records[0].code // ""')
if [[ "$TEST_FIELD" == *" @ $TEST_SHA" ]]; then
  pass "Test field SHA-finalized: '$TEST_FIELD'"
else
  fail "Test field missing SHA suffix: '$TEST_FIELD'"
fi
if [[ "$CODE_FIELD" == *" @ $CODE_SHA" ]]; then
  pass "Code field SHA-finalized: '$CODE_FIELD'"
else
  fail "Code field missing SHA suffix: '$CODE_FIELD'"
fi

# ---- Scenario 4: idempotent re-finalize with same SHAs. -------------------
RESULT=$(dr_invoke dr_finalize_refs "$FIN_ARGS")
if [ "$(echo "$RESULT" | jq -r '.status')" = "accepted" ]; then
  pass "dr_finalize_refs idempotent with identical SHAs"
else
  fail "dr_finalize_refs should be idempotent with identical SHAs: $RESULT"
fi

# ---- Scenario 5: conflicting SHAs → typed error. --------------------------
BAD_ARGS=$(jq -n --arg id "$REC_ID" --arg t "9999999" \
  '{record_id: $id, test_sha: $t}')
RESULT=$(dr_invoke dr_finalize_refs "$BAD_ARGS")
STATUS=$(echo "$RESULT" | jq -r '.status')
REASON=$(echo "$RESULT" | jq -r '.errors[0].reason // ""')
if [ "$STATUS" = "error" ] && [ "$REASON" = "already-finalized-with-different-sha" ]; then
  pass "dr_finalize_refs rejects different SHA with canonical error code"
else
  fail "dr_finalize_refs conflict error incorrect: $RESULT"
fi

# ---- Scenario 6: dr_verify_tests aggregate = pass when all finalized. -----
VERIFY=$(dr_invoke dr_verify_tests "$(jq -n --arg s "$SPRINT" '{sprint: $s}')")
AGG=$(echo "$VERIFY" | jq -r '.aggregate')
if [ "$AGG" = "pass" ]; then
  pass "dr_verify_tests aggregate=pass for fully finalized sprint"
else
  fail "dr_verify_tests aggregate should be pass, got: $VERIFY"
fi

# Add a second, un-finalized record to prove aggregate flips to fail.
SECOND_ARGS=$(jq -n --arg s "$SPRINT" '{
  sprint: $s,
  task: "Task 2",
  tags: "locking",
  trigger: "Need lock semantics",
  context: "Concurrent writers risk corruption",
  options_considered: "A) proper-lockfile; B) flock; C) sqlite",
  chosen: "proper-lockfile",
  rationale: "Portable, well-maintained, no native deps",
  spec_update: "AC-6.1",
  test: "Store concurrent writes serialize correctly",
  code: "mcp/chester-decision-record/store.js:257"
}')
dr_invoke dr_capture "$SECOND_ARGS" >/dev/null
VERIFY=$(dr_invoke dr_verify_tests "$(jq -n --arg s "$SPRINT" '{sprint: $s}')")
AGG=$(echo "$VERIFY" | jq -r '.aggregate')
if [ "$AGG" = "fail" ]; then
  pass "dr_verify_tests aggregate=fail when any record un-finalized"
else
  fail "dr_verify_tests should report fail with partial finalization: $VERIFY"
fi

# ---- Scenario 7: missing required field → structured error. ---------------
# Drop `trigger` to verify schema rejection is surfaced, not an I/O exception.
MISSING_ARGS=$(echo "$CAPTURE_ARGS" | jq 'del(.trigger)')
RESULT=$(dr_invoke dr_capture "$MISSING_ARGS")
STATUS=$(echo "$RESULT" | jq -r '.status')
FIELD=$(echo "$RESULT" | jq -r '.errors[] | select(.field=="trigger") | .field')
if [ "$STATUS" = "error" ] && [ "$FIELD" = "trigger" ]; then
  pass "dr_capture rejects missing trigger with structured error"
else
  fail "dr_capture missing-field error incorrect: $RESULT"
fi

if [ "$FAILED" -gt 0 ]; then
  echo "FAIL: $FAILED assertion(s) failed in capture-finalize"
  exit 1
fi
echo "PASS: capture-finalize integration test"
exit 0
