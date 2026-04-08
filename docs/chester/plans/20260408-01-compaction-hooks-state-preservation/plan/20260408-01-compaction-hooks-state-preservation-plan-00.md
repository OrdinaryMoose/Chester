# Compaction Hooks for State Preservation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically snapshot and re-inject Chester architect interview state across Claude Code context compaction events, so long-running sessions survive compaction without losing scoring precision.

**Architecture:** Two shell scripts (PreCompact and PostCompact hooks) communicate through a JSON snapshot file. A breadcrumb file written during session bootstrap anchors sprint directory discovery. Both hooks are non-blocking — every error path exits 0.

**Tech Stack:** Bash, jq, Claude Code plugin hooks system

---

### Task 1: Add Breadcrumb Writer to start-bootstrap

**Files:**
- Modify: `skills/start-bootstrap/SKILL.md:64-68` (after Step 5: Create Working Directory)

This task adds a single instruction to the start-bootstrap skill that writes the active sprint subdirectory name to a breadcrumb file. The compaction hooks use this file to locate state files without access to conversation context.

- [ ] **Step 1: Read the current start-bootstrap skill**

Read: `skills/start-bootstrap/SKILL.md`

Confirm that Step 5 creates the working directory and Step 6 initializes thinking history. The new step goes between them.

- [ ] **Step 2: Add Step 5b — Write Active Sprint Breadcrumb**

After the existing Step 5 block (Create Working Directory) and before Step 6 (Initialize Thinking History), insert:

```markdown
### Step 5b: Write Active Sprint Breadcrumb

Write the sprint subdirectory name to a breadcrumb file so that compaction hooks can discover the active sprint without conversation context:

\```bash
echo "{sprint-subdir}" > "{CHESTER_WORKING_DIR}/.active-sprint"
\```

This file is read by `pre-compact.sh` and `post-compact.sh` to locate MCP state files during compaction events.
```

- [ ] **Step 3: Update "What It Returns" section**

In the "What It Returns" section at the bottom of the file, add a bullet:

```markdown
- `.active-sprint` breadcrumb file pointing to the current sprint
```

- [ ] **Step 4: Commit**

```bash
git add skills/start-bootstrap/SKILL.md
git commit -m "feat: add active sprint breadcrumb to start-bootstrap"
```

---

### Task 2: Create PreCompact Hook Script

**Files:**
- Create: `chester-util-config/hooks/pre-compact.sh`
- Create: `tests/test-compaction-hooks.sh` (PreCompact test cases only — PostCompact cases added in Task 3)

The PreCompact hook reads the breadcrumb file and MCP state JSON files, then writes a consolidated snapshot to the sprint's design directory. It always exits 0.

- [ ] **Step 1: Create hooks directory**

```bash
mkdir -p chester-util-config/hooks
```

- [ ] **Step 2: Write failing test — PreCompact with understanding state only**

Create `tests/test-compaction-hooks.sh`:

```bash
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
```

- [ ] **Step 3: Run test to verify it fails**

```bash
bash tests/test-compaction-hooks.sh
```

Expected: FAIL — `pre-compact.sh` does not exist yet.

- [ ] **Step 4: Write pre-compact.sh**

Create `chester-util-config/hooks/pre-compact.sh`:

```bash
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
```

```bash
chmod +x chester-util-config/hooks/pre-compact.sh
```

- [ ] **Step 5: Run test to verify it passes**

```bash
bash tests/test-compaction-hooks.sh
```

Expected: PASS — all 3 PreCompact tests pass.

- [ ] **Step 6: Commit**

```bash
git add chester-util-config/hooks/pre-compact.sh tests/test-compaction-hooks.sh
git commit -m "feat: add PreCompact hook for interview state snapshots"
```

---

### Task 3: Create PostCompact Hook Script

**Files:**
- Create: `chester-util-config/hooks/post-compact.sh`
- Modify: `tests/test-compaction-hooks.sh` (append PostCompact test cases)

The PostCompact hook reads the snapshot, validates freshness and session ID, then outputs a structured natural-language state summary as `additionalContext` for the agent.

- [ ] **Step 1: Write failing test — PostCompact produces additionalContext**

Append to `tests/test-compaction-hooks.sh`, replacing the summary section at the bottom. Remove the final summary block (`# ── Summary ──` through `exit 0`) and append these tests plus a new summary:

```bash
# ── PostCompact Tests ────────────────────────────────────────────

# Restore breadcrumb for PostCompact tests
echo "$SPRINT" > "$WORKING/.active-sprint"

# ── Test 4: PostCompact produces additionalContext ───────────────
# Snapshot already exists from Test 2

# Update snapshot with current timestamp and matching session_id
CURRENT_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq --arg ts "$CURRENT_TS" --arg sid "test-session-001" \
  '.timestamp = $ts | .session_id = $sid' \
  "$SNAPSHOT" > "$SNAPSHOT.tmp" && mv "$SNAPSHOT.tmp" "$SNAPSHOT"

OUTPUT=$(echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/hooks/post-compact.sh")
RC=$?

[ "$RC" -eq 0 ] || fail "Test 4: expected exit 0, got $RC"

# Check output is valid JSON with additionalContext
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
if [ -z "$CONTEXT" ]; then
  fail "Test 4: no additionalContext in output"
else
  # Verify key content is present in the context string
  echo "$CONTEXT" | grep -q "Phase" || fail "Test 4: missing phase in context"
  echo "$CONTEXT" | grep -q "Round" || fail "Test 4: missing round in context"
  echo "$CONTEXT" | grep -q "stakeholder_impact" || fail "Test 4: missing weakest dimension"
  echo "$CONTEXT" | grep -q "Resume" || fail "Test 4: missing resume directive"
  echo "PASS: Test 4 — PostCompact produces additionalContext"
fi

# ── Test 5: PostCompact staleness guard ──────────────────────────
# Set timestamp to 2 hours ago
OLD_TS=$(date -u -d '2 hours ago' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v-2H +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
if [ -n "$OLD_TS" ]; then
  jq --arg ts "$OLD_TS" '.timestamp = $ts' "$SNAPSHOT" > "$SNAPSHOT.tmp" && mv "$SNAPSHOT.tmp" "$SNAPSHOT"

  OUTPUT=$(echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/hooks/post-compact.sh")
  CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)

  [ -z "$CONTEXT" ] || fail "Test 5: stale snapshot should produce no additionalContext"
  echo "PASS: Test 5 — PostCompact staleness guard"
else
  echo "SKIP: Test 5 — cannot compute past timestamp on this platform"
fi

# ── Test 6: PostCompact session ID mismatch ──────────────────────
# Restore fresh timestamp but with different session_id
CURRENT_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq --arg ts "$CURRENT_TS" --arg sid "different-session" \
  '.timestamp = $ts | .session_id = $sid' \
  "$SNAPSHOT" > "$SNAPSHOT.tmp" && mv "$SNAPSHOT.tmp" "$SNAPSHOT"

OUTPUT=$(echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/hooks/post-compact.sh")
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)

[ -z "$CONTEXT" ] || fail "Test 6: session ID mismatch should produce no additionalContext"
echo "PASS: Test 6 — PostCompact session ID mismatch guard"

# ── Test 7: PostCompact with no breadcrumb ───────────────────────
rm -f "$WORKING/.active-sprint"

OUTPUT=$(echo "$STDIN_JSON" | "$CHESTER_ROOT/chester-util-config/hooks/post-compact.sh")
RC=$?

[ "$RC" -eq 0 ] || fail "Test 7: expected exit 0, got $RC"
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)
[ -z "$CONTEXT" ] || fail "Test 7: no breadcrumb should produce no additionalContext"
echo "PASS: Test 7 — PostCompact with no breadcrumb (no-op)"

# ── Summary ──────────────────────────────────────────────────────
if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "FAIL: $ERRORS test(s) failed"
  exit 1
fi

echo ""
echo "PASS: All compaction hook tests passed"
exit 0
```

- [ ] **Step 2: Run test to verify new tests fail**

```bash
bash tests/test-compaction-hooks.sh
```

Expected: Tests 1-3 PASS (PreCompact), Test 4+ FAIL — `post-compact.sh` does not exist yet.

- [ ] **Step 3: Write post-compact.sh**

Create `chester-util-config/hooks/post-compact.sh`:

```bash
#!/usr/bin/env bash
# PostCompact hook — re-injects interview state after context compaction.
# Reads snapshot, validates freshness, outputs structured state summary.
# Always exits 0 — never blocks the agent.
set -uo pipefail

NL=$'\n'

INPUT=$(cat)

# Source chester config — exit silently if unavailable
eval "$(chester-config-read)" 2>/dev/null || exit 0

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
```

```bash
chmod +x chester-util-config/hooks/post-compact.sh
```

- [ ] **Step 4: Run test to verify all tests pass**

```bash
bash tests/test-compaction-hooks.sh
```

Expected: PASS — all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add chester-util-config/hooks/post-compact.sh tests/test-compaction-hooks.sh
git commit -m "feat: add PostCompact hook for interview state re-injection"
```

---

### Task 4: Register Hooks in Plugin Configuration

**Files:**
- Modify: `hooks/hooks.json`

Add PreCompact and PostCompact hook entries to the existing hooks configuration.

- [ ] **Step 1: Read current hooks.json**

Read: `hooks/hooks.json`

Confirm it currently has only a `SessionStart` entry.

- [ ] **Step 2: Add PreCompact and PostCompact entries**

Replace the contents of `hooks/hooks.json` with:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/chester-util-config/session-start",
            "async": false
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/chester-util-config/hooks/pre-compact.sh"
          }
        ]
      }
    ],
    "PostCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/chester-util-config/hooks/post-compact.sh"
          }
        ]
      }
    ]
  }
}
```

No `matcher` field on the compaction hooks — they always run. The scripts self-guard by checking for the breadcrumb file.

- [ ] **Step 3: Validate JSON is well-formed**

```bash
jq . hooks/hooks.json
```

Expected: pretty-printed valid JSON, no errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat: register PreCompact and PostCompact hooks"
```

---

### Task 5: Integration Round-Trip Test

**Files:**
- Modify: `tests/test-compaction-hooks.sh` (append integration test before summary)

This test simulates a full round-trip: creates realistic MCP state, runs PreCompact to snapshot, then runs PostCompact to verify the output contains accurate data from the original state.

- [ ] **Step 1: Write integration test**

Insert before the `# ── Summary ──` block in `tests/test-compaction-hooks.sh`:

```bash
# ── Test 8: Round-trip integration ───────────────────────────────
# Restore breadcrumb
echo "$SPRINT" > "$WORKING/.active-sprint"

# Clean slate — remove old snapshot and enforcement state
rm -f "$SNAPSHOT"
rm -f "$SPRINT_PATH"/design/*-enforcement-state.json

# Re-write understanding state with known values for precise assertions
cat > "$SPRINT_PATH/design/test-understanding-state.json" <<'STATE'
{
  "contextType": "brownfield",
  "round": 11,
  "userPrompt": "integration test prompt",
  "scores": {
    "surface_coverage": { "score": 0.80, "justification": "Thorough", "gap": "" },
    "relationship_mapping": { "score": 0.70, "justification": "Mapped", "gap": "" },
    "constraint_discovery": { "score": 0.60, "justification": "Found", "gap": "Cannot use GraphQL" },
    "risk_topology": { "score": 0.55, "justification": "Identified", "gap": "" },
    "stakeholder_impact": { "score": 0.20, "justification": "Minimal", "gap": "PM not consulted" },
    "prior_art": { "score": 0.45, "justification": "Some", "gap": "" },
    "temporal_context": { "score": 0.65, "justification": "Clear", "gap": "" },
    "problem_boundary": { "score": 0.50, "justification": "Set", "gap": "" },
    "assumption_inventory": { "score": 0.40, "justification": "Listed", "gap": "Assuming single-tenant" }
  },
  "overallSaturation": 0.54,
  "groupSaturation": {
    "landscape": 0.66,
    "human_context": 0.33,
    "foundations": 0.52
  },
  "weakest": {
    "group": "human_context",
    "dimension": "stakeholder_impact"
  },
  "transition": { "ready": false, "reasons": ["human_context too low"] },
  "scoreHistory": [],
  "saturationHistory": [0.10, 0.20, 0.30, 0.40, 0.50, 0.54]
}
STATE

# Run PreCompact
INTEGRATION_STDIN='{"session_id":"integration-test","transcript_path":"/tmp/t.jsonl","cwd":"/tmp","hook_event_name":"PreCompact","trigger":"auto"}'
echo "$INTEGRATION_STDIN" | "$CHESTER_ROOT/chester-util-config/hooks/pre-compact.sh"

if [ ! -f "$SNAPSHOT" ]; then
  fail "Test 8: PreCompact did not create snapshot"
else
  # Run PostCompact with matching session_id
  POST_STDIN='{"session_id":"integration-test","transcript_path":"/tmp/t.jsonl","cwd":"/tmp","hook_event_name":"PostCompact","trigger":"auto"}'
  OUTPUT=$(echo "$POST_STDIN" | "$CHESTER_ROOT/chester-util-config/hooks/post-compact.sh")

  CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
  if [ -z "$CONTEXT" ]; then
    fail "Test 8: PostCompact produced no additionalContext"
  else
    # Verify round-trip accuracy
    echo "$CONTEXT" | grep -q "Round: 11" || fail "Test 8: wrong round number"
    echo "$CONTEXT" | grep -q "Understand" || fail "Test 8: wrong phase"
    echo "$CONTEXT" | grep -q "0.54" || fail "Test 8: wrong overall saturation"
    echo "$CONTEXT" | grep -q "human_context" || fail "Test 8: missing weakest group"
    echo "$CONTEXT" | grep -q "stakeholder_impact" || fail "Test 8: missing weakest dimension"
    echo "$CONTEXT" | grep -q "Cannot use GraphQL" || fail "Test 8: missing constraint"
    echo "$CONTEXT" | grep -q "PM not consulted" || fail "Test 8: missing gap"
    echo "$CONTEXT" | grep -q "Assuming single-tenant" || fail "Test 8: missing assumption gap"
    echo "PASS: Test 8 — Round-trip integration"
  fi
fi
```

- [ ] **Step 2: Run full test suite**

```bash
bash tests/test-compaction-hooks.sh
```

Expected: PASS — all 8 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/test-compaction-hooks.sh
git commit -m "test: add round-trip integration test for compaction hooks"
```
