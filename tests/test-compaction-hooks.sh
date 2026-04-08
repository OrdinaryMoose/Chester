#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ERRORS=0

fail() { echo "FAIL: $1"; ERRORS=$((ERRORS + 1)); }

# ── Setup ────────────────────────────────────────────────────────
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# Mock chester-config-read to point at temp directory
MOCK_BIN="$TMPDIR/bin"
mkdir -p "$MOCK_BIN"
cat > "$MOCK_BIN/chester-config-read" <<MOCK
#!/usr/bin/env bash
echo "export CHESTER_WORKING_DIR='$TMPDIR/working'"
echo "export CHESTER_PLANS_DIR='plans'"
echo "export CHESTER_CONFIG_PATH='$TMPDIR/config.json'"
echo "export CHESTER_MAIN_ROOT='$TMPDIR'"
MOCK
chmod +x "$MOCK_BIN/chester-config-read"
export PATH="$MOCK_BIN:$PATH"

WORKING="$TMPDIR/working"
SPRINT="20260408-01-test-sprint-name"
SPRINT_PATH="$WORKING/$SPRINT"
mkdir -p "$SPRINT_PATH/design"

# Write breadcrumb
echo "$SPRINT" > "$WORKING/.active-sprint"

# Mock understanding state
cat > "$SPRINT_PATH/design/test-understanding-state.json" <<'STATE'
{
  "contextType": "greenfield",
  "round": 5,
  "userPrompt": "test prompt",
  "scores": {
    "surface_coverage": { "score": 0.72, "justification": "Good coverage", "gap": "" },
    "relationship_mapping": { "score": 0.65, "justification": "Mapped well", "gap": "" },
    "constraint_discovery": { "score": 0.45, "justification": "Some found", "gap": "User rejected real-time sync" },
    "risk_topology": { "score": 0.30, "justification": "Partial", "gap": "" },
    "stakeholder_impact": { "score": 0.10, "justification": "Minimal", "gap": "No discussion of who is affected" },
    "prior_art": { "score": 0.40, "justification": "Some research", "gap": "" },
    "temporal_context": { "score": 0.55, "justification": "Timeline clear", "gap": "" },
    "problem_boundary": { "score": 0.50, "justification": "Boundaries set", "gap": "Must integrate with existing auth" },
    "assumption_inventory": { "score": 0.35, "justification": "Some assumptions", "gap": "" }
  },
  "overallSaturation": 0.42,
  "groupSaturation": {
    "landscape": 0.53,
    "human_context": 0.25,
    "foundations": 0.47
  },
  "weakest": {
    "group": "human_context",
    "dimension": "stakeholder_impact"
  },
  "transition": { "ready": false, "reasons": ["saturation too low"] },
  "scoreHistory": [],
  "saturationHistory": [0.20, 0.30, 0.35, 0.40, 0.42]
}
STATE

STDIN_JSON='{"session_id":"test-session-001","transcript_path":"/tmp/transcript.jsonl","cwd":"/tmp","hook_event_name":"PreCompact","trigger":"auto"}'

# ── Test 1: PreCompact with understanding state only ─────────────
echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/hooks/pre-compact.sh"
RC=$?

if [ "$RC" -ne 0 ]; then
  fail "Test 1: pre-compact.sh exited with $RC, expected 0"
fi

SNAPSHOT="$SPRINT_PATH/design/.compaction-snapshot.json"
if [ ! -f "$SNAPSHOT" ]; then
  fail "Test 1: snapshot file not created"
else
  PHASE=$(jq -r '.phase' "$SNAPSHOT")
  SID=$(jq -r '.session_id' "$SNAPSHOT")
  SPRINT_IN_SNAP=$(jq -r '.sprint_name' "$SNAPSHOT")
  HAS_UNDERSTANDING=$(jq 'has("understanding")' "$SNAPSHOT")
  HAS_ENFORCEMENT=$(jq '.enforcement == null' "$SNAPSHOT")

  [ "$PHASE" = "understand" ] || fail "Test 1: phase expected 'understand', got '$PHASE'"
  [ "$SID" = "test-session-001" ] || fail "Test 1: session_id expected 'test-session-001', got '$SID'"
  [ "$SPRINT_IN_SNAP" = "$SPRINT" ] || fail "Test 1: sprint_name mismatch"
  [ "$HAS_UNDERSTANDING" = "true" ] || fail "Test 1: understanding data missing"
  [ "$HAS_ENFORCEMENT" = "true" ] || fail "Test 1: enforcement should be null"
  echo "PASS: Test 1 — PreCompact with understanding state only"
fi

# ── Test 2: PreCompact with both states ──────────────────────────
cat > "$SPRINT_PATH/design/test-enforcement-state.json" <<'STATE'
{
  "type": "greenfield",
  "round": 12,
  "problemStatement": "test problem",
  "scores": {
    "intent": { "score": 0.8, "justification": "Clear", "gap": "" },
    "outcome": { "score": 0.7, "justification": "Defined", "gap": "" },
    "scope": { "score": 0.6, "justification": "Bounded", "gap": "" },
    "constraints": { "score": 0.5, "justification": "Some found", "gap": "Budget unclear" },
    "success": { "score": 0.4, "justification": "Partial", "gap": "" }
  },
  "gates": { "nonGoalsExplicit": true, "decisionBoundariesExplicit": false },
  "challengeModesUsed": ["contrarian"],
  "challengeLog": [{ "mode": "contrarian", "round": 8 }],
  "ambiguityHistory": [0.8, 0.6, 0.5, 0.4],
  "scoreHistory": [],
  "pressureTracking": []
}
STATE

# Remove old snapshot to test fresh
rm -f "$SNAPSHOT"

echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/hooks/pre-compact.sh"

if [ ! -f "$SNAPSHOT" ]; then
  fail "Test 2: snapshot file not created"
else
  PHASE=$(jq -r '.phase' "$SNAPSHOT")
  HAS_ENF=$(jq '.enforcement != null' "$SNAPSHOT")
  [ "$PHASE" = "solve" ] || fail "Test 2: phase expected 'solve', got '$PHASE'"
  [ "$HAS_ENF" = "true" ] || fail "Test 2: enforcement data missing"
  echo "PASS: Test 2 — PreCompact with both states"
fi

# ── Test 3: PreCompact with no breadcrumb ────────────────────────
rm -f "$WORKING/.active-sprint"
rm -f "$SNAPSHOT"

echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/hooks/pre-compact.sh"
RC=$?

[ "$RC" -eq 0 ] || fail "Test 3: expected exit 0, got $RC"
[ ! -f "$SNAPSHOT" ] || fail "Test 3: snapshot should not be created without breadcrumb"
echo "PASS: Test 3 — PreCompact with no breadcrumb (no-op)"

# ── Summary ──────────────────────────────────────────────────────
if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "FAIL: $ERRORS test(s) failed"
  exit 1
fi

echo ""
echo "PASS: All PreCompact tests passed"
exit 0
