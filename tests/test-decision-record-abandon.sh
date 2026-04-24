#!/usr/bin/env bash
# Integration test: dr_abandon — Active→Abandoned transition for a sprint.
#
# COVERS: AC-11.1
#
# Scenarios:
#   1. Sprint A: 2 Active records + 1 Superseded record
#   2. Sprint B: 1 Active record (must remain untouched)
#   3. dr_abandon("sprint-a") → {affected: 2, skipped_superseded: 1}
#   4. Sprint A's Active records are now Abandoned
#   5. Sprint A's Superseded record is still Superseded (preserved)
#   6. Sprint B's record is untouched

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

SPRINT_A="sprint-a-aban"
SPRINT_B="sprint-b-keep"
dr_mock_sprint "$SPRINT_A" >/dev/null
dr_mock_sprint "$SPRINT_B" >/dev/null

# Helper to capture a record with required fields.
capture_record() {
  local sprint="$1" task="$2" chosen="$3"
  local args
  args=$(jq -n --arg s "$sprint" --arg t "$task" --arg c "$chosen" '{
    sprint: $s, task: $t, tags: "fixture",
    trigger: "test trigger",
    context: "test context",
    options_considered: "A; B",
    chosen: $c,
    rationale: "test rationale",
    spec_update: "AC-1.1",
    test: ("test for " + $t),
    code: "src/file.js:1"
  }')
  dr_invoke dr_capture "$args" | jq -r '.id'
}

# Sprint A: two active records.
A1=$(capture_record "$SPRINT_A" "Task 1" "Choice 1")
A2=$(capture_record "$SPRINT_A" "Task 2" "Choice 2")
# Sprint A: one record that will be superseded.
A3=$(capture_record "$SPRINT_A" "Task 3 orig" "Original")
A3_NEW=$(capture_record "$SPRINT_A" "Task 3 revised" "Revised")
dr_invoke dr_supersede "$(jq -n --arg o "$A3" --arg n "$A3_NEW" '{old_id: $o, new_id: $n}')" >/dev/null

# Sprint B: one record.
B1=$(capture_record "$SPRINT_B" "Task 1" "B Choice")

# Now abandon Sprint A.
RESULT=$(dr_invoke dr_abandon "$(jq -n --arg s "$SPRINT_A" '{sprint: $s}')")
AFFECTED=$(echo "$RESULT" | jq -r '.affected')
SKIPPED=$(echo "$RESULT" | jq -r '.skipped_superseded')

# A1, A2, A3_NEW are Active at abandon time → affected=3; A3 is Superseded → skipped=1.
# Note: the supersede made A3_NEW Active (new record), so sprint A has 3 Active + 1 Superseded.
if [ "$AFFECTED" = "3" ]; then
  pass "dr_abandon affected=3 (Active records in Sprint A)"
else
  fail "dr_abandon affected should be 3, got '$AFFECTED' ($RESULT)"
fi
if [ "$SKIPPED" = "1" ]; then
  pass "dr_abandon skipped_superseded=1"
else
  fail "dr_abandon skipped_superseded should be 1, got '$SKIPPED' ($RESULT)"
fi

# Verify A1, A2, A3_NEW are now Abandoned.
QA=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT_A" '{sprint_subject: $s}')")
for id in "$A1" "$A2" "$A3_NEW"; do
  s=$(echo "$QA" | jq -r --arg id "$id" '.records[] | select(.id==$id) | .status')
  if [ "$s" = "Abandoned" ]; then
    pass "$id now Abandoned"
  else
    fail "$id status='$s' expected Abandoned"
  fi
done

# Verify A3 is still Superseded (NOT touched by abandon).
A3_STATUS=$(echo "$QA" | jq -r --arg id "$A3" '.records[] | select(.id==$id) | .status')
if [ "$A3_STATUS" = "Superseded" ]; then
  pass "$A3 status preserved as Superseded"
else
  fail "$A3 status='$A3_STATUS' expected Superseded (preserved)"
fi

# Verify Sprint B record untouched.
QB=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT_B" '{sprint_subject: $s}')")
B1_STATUS=$(echo "$QB" | jq -r --arg id "$B1" '.records[] | select(.id==$id) | .status')
if [ "$B1_STATUS" = "Active" ]; then
  pass "Sprint B record untouched (still Active)"
else
  fail "Sprint B record status='$B1_STATUS' expected Active"
fi

if [ "$FAILED" -gt 0 ]; then
  echo "FAIL: $FAILED assertion(s) failed in abandon"
  exit 1
fi
echo "PASS: abandon integration test"
exit 0
