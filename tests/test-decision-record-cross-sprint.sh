#!/usr/bin/env bash
# Integration test: cross-sprint carry-forward + dr_query filters + dr_audit.
#
# COVERS: AC-5.1, AC-5.2, AC-8.1, AC-10.2
#
# AC-5.1 (backward reach) and AC-5.2 (spec-driven test generation) are
# exercised at this layer via the data structures those mechanisms depend on:
# prior-sprint records carry finalized Test fields (names + SHAs) that later
# sprints consult via dr_query to build must-remain-green lists. The
# execute-write orchestration that actually runs the tests lives above the
# MCP and is covered elsewhere — here we verify the query surface is
# sufficient to support that orchestration.
#
# Scenarios:
#   1. Capture a record in sprint X with fully finalized SHAs
#   2. dr_query({sprint_subject: "sprint-x", status: "Active"}) returns it
#      → supports AC-8.1 (plan-build consultation) and AC-10.2 (read-time filter)
#   3. dr_query({sprint_subject: "sprint-x", tags: ["some-tag"]}) filters by tags
#      → supports AC-10.2 narrow filtering
#   4. Records carry the test field that AC-5.1 carry-forward relies on
#   5. dr_audit({sprint_subject: "sprint-x"}) returns findings structure with
#      zero drift when fully finalized; non-zero when partially finalized
#   6. audit result discloses kinds_checked coverage field
#   7. Cross-sprint isolation: sprint-y records not returned by sprint-x query

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

SPRINT_X="sprint-x-cross"
SPRINT_Y="sprint-y-cross"
dr_mock_sprint "$SPRINT_X" >/dev/null
dr_mock_sprint "$SPRINT_Y" >/dev/null

# ---- Scenario 1: capture + finalize in sprint X. --------------------------
CAPTURE=$(jq -n --arg s "$SPRINT_X" '{
  sprint: $s, task: "Task 1",
  tags: "persistence,caching",
  trigger: "Storage format ambiguity",
  context: "Need durable cross-sprint visibility",
  options_considered: "A) markdown; B) sqlite; C) jsonl",
  chosen: "markdown append-only",
  rationale: "Human-readable, diff-friendly",
  spec_update: "AC-5.1",
  test: "cross-sprint record reachable by query",
  code: "mcp/chester-decision-record/store.js:280"
}')
X1=$(dr_invoke dr_capture "$CAPTURE" | jq -r '.id')
dr_invoke dr_finalize_refs "$(jq -n --arg id "$X1" '{record_id: $id, test_sha: "aaa1111", code_sha: "bbb2222"}')" >/dev/null
pass "captured + finalized record in $SPRINT_X ($X1)"

# Capture one in sprint Y to prove isolation.
CAPTURE_Y=$(jq -n --arg s "$SPRINT_Y" '{
  sprint: $s, task: "Task 1",
  tags: "unrelated",
  trigger: "sprint Y trigger",
  context: "sprint Y context",
  options_considered: "A; B",
  chosen: "A",
  rationale: "because",
  spec_update: "AC-1.1",
  test: "sprint Y test",
  code: "src/y.js:1"
}')
Y1=$(dr_invoke dr_capture "$CAPTURE_Y" | jq -r '.id')

# ---- Scenario 2: query by sprint + status filter. -------------------------
QR=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT_X" '{sprint_subject: $s, status: "Active"}')")
COUNT=$(echo "$QR" | jq '.records | length')
if [ "$COUNT" = "1" ]; then
  pass "dr_query(sprint_subject=$SPRINT_X, status=Active) returned 1 record"
else
  fail "dr_query count expected 1, got $COUNT ($QR)"
fi
FOUND_ID=$(echo "$QR" | jq -r '.records[0].id')
[ "$FOUND_ID" = "$X1" ] && pass "query returned the expected record" \
  || fail "query returned unexpected id: $FOUND_ID"

# ---- Scenario 3: tag filter. ----------------------------------------------
QR=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT_X" '{sprint_subject: $s, tags: ["caching"]}')")
COUNT=$(echo "$QR" | jq '.records | length')
[ "$COUNT" = "1" ] && pass "tag filter (caching) matches" \
  || fail "tag filter count expected 1, got $COUNT"

QR=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT_X" '{sprint_subject: $s, tags: ["nonexistent"]}')")
COUNT=$(echo "$QR" | jq '.records | length')
[ "$COUNT" = "0" ] && pass "tag filter (nonexistent) excludes record" \
  || fail "tag filter (nonexistent) should return 0, got $COUNT"

# ---- Scenario 4: carry-forward data shape. --------------------------------
# AC-5.1 backward reach requires that prior-sprint records carry:
#   - a stable test identifier (the Test field with SHA suffix)
#   - a code pointer (the Code field with SHA suffix)
# A new sprint's plan-build queries earlier sprints and feeds those test
# identifiers into the must-remain-green list (AC-8.1).
QR=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT_X" '{sprint_subject: $s}')")
TEST_FIELD=$(echo "$QR" | jq -r '.records[0].test')
CODE_FIELD=$(echo "$QR" | jq -r '.records[0].code')
if [[ "$TEST_FIELD" == *" @ aaa1111" ]]; then
  pass "carry-forward Test field has SHA suffix: '$TEST_FIELD'"
else
  fail "carry-forward Test field missing finalized SHA: '$TEST_FIELD'"
fi
if [[ "$CODE_FIELD" == *" @ bbb2222" ]]; then
  pass "carry-forward Code field has SHA suffix: '$CODE_FIELD'"
else
  fail "carry-forward Code field missing finalized SHA: '$CODE_FIELD'"
fi

# AC-5.2: spec-driven test-generation relies on spec_update field linking a
# record to its spec AC. Confirm the link is preserved across sprints.
SPEC_UPDATE=$(echo "$QR" | jq -r '.records[0].spec_update')
[ "$SPEC_UPDATE" = "AC-5.1" ] && pass "spec_update link preserved for cross-sprint generation" \
  || fail "spec_update='$SPEC_UPDATE' expected AC-5.1"

# ---- Scenario 5: dr_audit finds no drift on fully finalized sprint. -------
AUDIT=$(dr_invoke dr_audit "$(jq -n --arg s "$SPRINT_X" '{sprint_subject: $s}')")
DRIFTED=$(echo "$AUDIT" | jq -r '.drifted')
AUDITED=$(echo "$AUDIT" | jq -r '.audited')
if [ "$AUDITED" = "1" ] && [ "$DRIFTED" = "0" ]; then
  pass "dr_audit: sprint-x fully finalized → drifted=0"
else
  fail "dr_audit expected audited=1 drifted=0, got: $AUDIT"
fi

# Sprint Y has no SHAs → audit should find drift.
AUDIT_Y=$(dr_invoke dr_audit "$(jq -n --arg s "$SPRINT_Y" '{sprint_subject: $s}')")
DRIFTED_Y=$(echo "$AUDIT_Y" | jq -r '.drifted')
# Each Active record without SHAs on test+code → 2 findings per record.
if [ "$DRIFTED_Y" -ge 1 ]; then
  pass "dr_audit: sprint-y un-finalized → drifted>=1 (got $DRIFTED_Y)"
else
  fail "dr_audit should report drift for un-finalized sprint-y: $AUDIT_Y"
fi

# ---- Scenario 6: audit discloses kinds_checked. ---------------------------
KINDS_LEN=$(echo "$AUDIT" | jq '.kinds_checked | length')
SHA_MISSING=$(echo "$AUDIT" | jq -r '.kinds_checked | index("sha-missing")')
if [ "$KINDS_LEN" -ge 1 ] && [ "$SHA_MISSING" != "null" ]; then
  pass "dr_audit discloses kinds_checked (includes sha-missing)"
else
  fail "dr_audit kinds_checked incomplete: $AUDIT"
fi

# ---- Scenario 7: cross-sprint isolation. ----------------------------------
QR=$(dr_invoke dr_query "$(jq -n --arg s "$SPRINT_X" '{sprint_subject: $s}')")
LEAK=$(echo "$QR" | jq --arg id "$Y1" '.records[] | select(.id==$id)')
if [ -z "$LEAK" ]; then
  pass "sprint-x query does not leak sprint-y records"
else
  fail "sprint-x query leaked sprint-y record: $LEAK"
fi

if [ "$FAILED" -gt 0 ]; then
  echo "FAIL: $FAILED assertion(s) failed in cross-sprint"
  exit 1
fi
echo "PASS: cross-sprint integration test"
exit 0
