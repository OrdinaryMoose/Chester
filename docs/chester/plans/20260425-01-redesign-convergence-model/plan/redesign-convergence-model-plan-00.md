# Plan: Redesign Convergence Model — Lane 1 MVP

**Sprint:** 20260425-01-redesign-convergence-model
**Spec:** `docs/chester/working/20260425-01-redesign-convergence-model/spec/redesign-convergence-model-spec-01.md`

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal

Add agent voice discipline (C1 Externalized Coverage + C2 Fact-default with marked Assumption/Opinion) to `util-design-partner-role`; add three telemetry fields to the understanding MCP state; add session metadata file written at sprint bootstrap.

## Architecture

Hybrid (principled merge from design-specify): C1 and C2 inserted as new sections between Private Precision Slot and Option-Naming Rule in `util-design-partner-role/SKILL.md`. Short Composition Note added near the top. Self-Evaluation extended with four sibling checks. Cross-references one-line per per-turn-flow in both design skills' commentary steps. Telemetry: three additive append arrays in `state.js`; `updateState` gains `warnings = []` third parameter; `server.js` passes `validation.warnings`. Session metadata: small helper bash script (`chester-util-config/write-session-metadata.sh`) invoked from new Step 4c in `start-bootstrap/SKILL.md`.

## Tech Stack

- Bash (existing test convention; new helper script)
- Node.js / ES modules (existing MCP server in `understanding-mcp/`)
- Markdown (skill text)
- Git (skill version capture, commit boundaries)

## Prior Decisions

*(populated by plan-build via `dr_query` at plan-start; filter: sprint-subject match OR shared-component match, status=Active)*

None. (`dr_query` MCP not available this session; treat as zero records per skill protocol.)

---

## Task 1: MCP Telemetry — three new fields + warnings parameter

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3, AC-2.4
**Decision budget:** 1
**Must remain green:** `tests/test-understanding-telemetry.sh` (this task's new test)

**Files:**
- Modify: `skills/design-large-task/understanding-mcp/state.js:22-28` (add three fields to `initializeState` return)
- Modify: `skills/design-large-task/understanding-mcp/state.js:33` (add `warnings = []` parameter to `updateState` signature)
- Modify: `skills/design-large-task/understanding-mcp/state.js:47-50` (add three push operations after existing `saturationHistory.push`)
- Modify: `skills/design-large-task/understanding-mcp/server.js:146` (change `updateState(state, scores)` to `updateState(state, scores, validation.warnings)`)
- Create: `tests/test-understanding-telemetry.sh` (replace skeleton stub with real test)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** (replaces skeleton `ac-2-1-group-saturation-history` through `ac-2-4-existing-telemetry-unchanged`)

```bash
#!/bin/bash
# Tests: AC-2.1, AC-2.2, AC-2.3, AC-2.4 — understanding MCP telemetry persistence
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
TMPDIR="$(mktemp -d)"
STATE_FILE="$TMPDIR/state.json"
trap "rm -rf $TMPDIR" EXIT

cd "$REPO_ROOT"

# Use Node directly to exercise state.js functions
node --input-type=module -e "
import { initializeState, updateState, saveState, loadState } from '$REPO_ROOT/skills/design-large-task/understanding-mcp/state.js';

// AC-2.1, 2.2, 2.3 setup: initialize and run 3 sequential updates
let state = initializeState('brownfield', 'test prompt');

// Verify new fields initialized as empty arrays
if (!Array.isArray(state.groupSaturationHistory) || state.groupSaturationHistory.length !== 0) throw new Error('AC-2.1 init: groupSaturationHistory not empty array');
if (!Array.isArray(state.transitionHistory) || state.transitionHistory.length !== 0) throw new Error('AC-2.2 init: transitionHistory not empty array');
if (!Array.isArray(state.warningsHistory) || state.warningsHistory.length !== 0) throw new Error('AC-2.3 init: warningsHistory not empty array');

const dim = (s) => ({ score: s, justification: 'test', gap: s < 0.9 ? 'gap' : '' });

// Round 1
const scores1 = {
  surface_coverage: dim(0.3), relationship_mapping: dim(0.3), constraint_discovery: dim(0.3), risk_topology: dim(0.3),
  stakeholder_impact: dim(0.3), prior_art: dim(0.3),
  temporal_context: dim(0.3), problem_boundary: dim(0.3), assumption_inventory: dim(0.3),
};
state = updateState(state, scores1, []);

// Round 2 — trigger jump warning by raising one dim by >0.3
const scores2 = { ...scores1, surface_coverage: dim(0.7) };
state = updateState(state, scores2, [{ dimension: 'surface_coverage', message: 'jump>0.3' }]);

// Round 3
const scores3 = { ...scores2, relationship_mapping: dim(0.5) };
state = updateState(state, scores3, []);

// AC-2.1 assertion
if (state.groupSaturationHistory.length !== 3) throw new Error('AC-2.1 length: expected 3 entries, got ' + state.groupSaturationHistory.length);
if (typeof state.groupSaturationHistory[0].landscape !== 'number') throw new Error('AC-2.1 shape: missing landscape numeric');
if (typeof state.groupSaturationHistory[0].human_context !== 'number') throw new Error('AC-2.1 shape: missing human_context numeric');
if (typeof state.groupSaturationHistory[0].foundations !== 'number') throw new Error('AC-2.1 shape: missing foundations numeric');

// AC-2.2 assertion
if (state.transitionHistory.length !== 3) throw new Error('AC-2.2 length: expected 3 entries, got ' + state.transitionHistory.length);
if (typeof state.transitionHistory[0].ready !== 'boolean') throw new Error('AC-2.2 shape: ready must be boolean');
if (!Array.isArray(state.transitionHistory[0].reasons)) throw new Error('AC-2.2 shape: reasons must be array');

// AC-2.3 assertion
if (state.warningsHistory.length !== 3) throw new Error('AC-2.3 length: expected 3 entries, got ' + state.warningsHistory.length);
if (!Array.isArray(state.warningsHistory[1])) throw new Error('AC-2.3 shape: round-2 warnings must be array');
if (state.warningsHistory[1].length === 0) throw new Error('AC-2.3 content: round-2 should contain the jump warning');

// AC-2.4 assertion: existing fields function unchanged
if (state.scoreHistory.length !== 3) throw new Error('AC-2.4: scoreHistory regressed');
if (state.saturationHistory.length !== 3) throw new Error('AC-2.4: saturationHistory regressed');
if (typeof state.overallSaturation !== 'number') throw new Error('AC-2.4: overallSaturation regressed');
if (typeof state.weakest !== 'object') throw new Error('AC-2.4: weakest regressed');
if (typeof state.transition !== 'object') throw new Error('AC-2.4: transition regressed');

console.log('PASS: AC-2.1, AC-2.2, AC-2.3, AC-2.4');
"
```

Save as `tests/test-understanding-telemetry.sh`. Make executable: `chmod +x tests/test-understanding-telemetry.sh`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-understanding-telemetry.sh`
Expected: FAIL with `AC-2.1 init: groupSaturationHistory not empty array` (the field doesn't exist yet)

- [ ] **Step 3: Modify state.js — add three fields and warnings parameter**

Edit `skills/design-large-task/understanding-mcp/state.js`.

In `initializeState` (around line 22), change the returned object to:

```js
return {
  contextType,
  round: 0,
  userPrompt,
  scores,
  scoreHistory: [],
  saturationHistory: [],
  groupSaturationHistory: [],
  transitionHistory: [],
  warningsHistory: [],
};
```

Change `updateState` signature (line 33) to accept warnings:

```js
export function updateState(state, newScores, warnings = []) {
```

After the existing `next.transition = checkTransitionReady(next)` line at the end of `updateState` (around line 57), add defensive init plus three new pushes (defensive init protects against in-flight state files written by the old code that lack the three new arrays):

```js
// Defensive init — in-flight state files written before this change lack these arrays
next.groupSaturationHistory ??= [];
next.transitionHistory ??= [];
next.warningsHistory ??= [];

next.groupSaturationHistory.push(structuredClone(groupSaturation));
next.transitionHistory.push(structuredClone(next.transition));
next.warningsHistory.push(structuredClone(warnings));
```

Note: `structuredClone` for all three pushes matches the existing `scoreHistory.push(structuredClone(...))` pattern in the same function — keeps the snapshot discipline consistent across all four history arrays and removes change-propagation seeds (if `checkTransitionReady` later adds a field, `transitionHistory` automatically captures it; if `validateUnderstandingSubmission` ever returned mutable warning objects, `warningsHistory` would still hold safe snapshots).

Edit `skills/design-large-task/understanding-mcp/server.js` line 146. Change:

```js
state = updateState(state, scores);
```

to:

```js
state = updateState(state, scores, validation.warnings);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-understanding-telemetry.sh`
Expected: PASS with `PASS: AC-2.1, AC-2.2, AC-2.3, AC-2.4`

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/understanding-mcp/state.js skills/design-large-task/understanding-mcp/server.js tests/test-understanding-telemetry.sh
git commit -m "feat: add three telemetry fields to understanding MCP state

- groupSaturationHistory, transitionHistory, warningsHistory
- updateState accepts warnings as third parameter (default [])
- server.js passes validation.warnings to updateState
- Adds bash test exercising state.js functions directly via Node

Implements AC-2.1, AC-2.2, AC-2.3, AC-2.4."
```

---

## Task 2: Session Metadata — helper script + start-bootstrap Step 4c

**Type:** config-producing
**Implements:** AC-3.1, AC-3.2
**Decision budget:** 2
**Must remain green:** `tests/test-session-metadata.sh` (this task's new test)

**Files:**
- Create: `chester-util-config/write-session-metadata.sh` (new helper script — extracts metadata logic for testability)
- Modify: `skills/start-bootstrap/SKILL.md` (insert Step 4c between line 73 and line 77)
- Create: `tests/test-session-metadata.sh` (replace skeleton stub with real test)

**Note on scope refinement:** spec component list says "modify start-bootstrap/SKILL.md." Adding a small helper script (`chester-util-config/write-session-metadata.sh`) is a refinement that materially improves testability — bash inside a SKILL.md cannot be unit-tested directly. Helper script keeps logic in one place; SKILL.md instructs the agent to invoke it. Plan-attack may flag this; revert to inline-bash if reviewer pushes back.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** (replaces skeleton `ac-3-1-session-metadata-written` and `ac-3-2-session-metadata-fields`)

```bash
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

# Invoke helper with: design-dir, sprint-subdir, repo-root
bash "$HELPER" "$DESIGN_DIR" "$SPRINT_SUBDIR" "$REPO_ROOT"

# AC-3.1: file exists at expected path
META_FILE="$DESIGN_DIR/test-helper-execution-session-meta.json"
if [ ! -f "$META_FILE" ]; then
  echo "FAIL AC-3.1: metadata file not written at $META_FILE"
  exit 1
fi

# AC-3.1: file is parseable JSON
if ! jq -e . "$META_FILE" >/dev/null 2>&1; then
  echo "FAIL AC-3.1: metadata file not parseable JSON"
  exit 1
fi

# AC-3.2: five required fields
SPRINT_NAME=$(jq -r '.sprintName' "$META_FILE")
[ "$SPRINT_NAME" = "$SPRINT_SUBDIR" ] || { echo "FAIL AC-3.2: sprintName mismatch (got $SPRINT_NAME)"; exit 1; }

BRANCH_NAME=$(jq -r '.branchName' "$META_FILE")
[ "$BRANCH_NAME" = "$SPRINT_SUBDIR" ] || { echo "FAIL AC-3.2: branchName mismatch"; exit 1; }

TIMESTAMP=$(jq -r '.sessionStartTimestamp' "$META_FILE")
echo "$TIMESTAMP" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' || { echo "FAIL AC-3.2: sessionStartTimestamp not ISO 8601 UTC (got $TIMESTAMP)"; exit 1; }

# jsonlSessionId may be string or null (best-effort)
jq -e 'has("jsonlSessionId")' "$META_FILE" >/dev/null || { echo "FAIL AC-3.2: jsonlSessionId key missing"; exit 1; }

# skillVersion must be object with two keys
jq -e '.skillVersion | has("utilDesignPartnerRole") and has("designLargeTask")' "$META_FILE" >/dev/null || { echo "FAIL AC-3.2: skillVersion shape wrong"; exit 1; }

echo "PASS: AC-3.1, AC-3.2"
```

Save as `tests/test-session-metadata.sh`. `chmod +x`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-session-metadata.sh`
Expected: FAIL with `helper script .../write-session-metadata.sh not executable` (the helper doesn't exist yet)

- [ ] **Step 3: Create the helper script and update start-bootstrap**

Create `chester-util-config/write-session-metadata.sh`:

```bash
#!/bin/bash
# Writes session metadata JSON for a Chester sprint.
# Usage: write-session-metadata.sh <design-dir> <sprint-subdir> <repo-root>
#
# Produces: <design-dir>/<sprint-name>-session-meta.json
# Where <sprint-name> is the verb-noun-noun portion of sprint-subdir.

set -e

DESIGN_DIR="$1"
SPRINT_SUBDIR="$2"
REPO_ROOT="$3"

if [ -z "$DESIGN_DIR" ] || [ -z "$SPRINT_SUBDIR" ] || [ -z "$REPO_ROOT" ]; then
  echo "Usage: $0 <design-dir> <sprint-subdir> <repo-root>" >&2
  exit 1
fi

# Sprint name = three-word portion (strip date-NN prefix)
SPRINT_NAME="$(echo "$SPRINT_SUBDIR" | sed -E 's/^[0-9]{8}-[0-9]+-//')"

META_FILE="$DESIGN_DIR/${SPRINT_NAME}-session-meta.json"

# Best-effort timestamp
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
```

`chmod +x chester-util-config/write-session-metadata.sh`

Edit `skills/start-bootstrap/SKILL.md`. After Step 4b (line ~74) and before Step 5 (line 77), insert:

```markdown
### Step 4c: Write Session Metadata

Write session metadata to enable future retrospective analysis linking sprint artifacts to JSONL transcripts:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
bash "$REPO_ROOT/chester-util-config/write-session-metadata.sh" \
  "{CHESTER_WORKING_DIR}/{sprint-subdir}/design" \
  "{sprint-subdir}" \
  "$REPO_ROOT"
```

(Brace-template style matches existing `start-bootstrap` Steps 4 and 4b — the agent substitutes `{CHESTER_WORKING_DIR}` and `{sprint-subdir}` before running, consistent with the rest of the skill.)

The helper writes `design/{sprint-name}-session-meta.json` with sprintName, branchName, sessionStartTimestamp (ISO 8601 UTC), jsonlSessionId (best-effort from `CLAUDE_SESSION_ID`; null if unavailable), and skillVersion (commit hashes for `util-design-partner-role` and `design-large-task` SKILL.md files).

The file lives in the tracked `design/` subdirectory and is copied to `plans/` at sprint close by `finish-archive-artifacts`. Do NOT add to `.gitignore`.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-session-metadata.sh`
Expected: PASS with `PASS: AC-3.1, AC-3.2`

- [ ] **Step 5: Commit**

```bash
git add chester-util-config/write-session-metadata.sh skills/start-bootstrap/SKILL.md tests/test-session-metadata.sh
git commit -m "feat: write session metadata file at sprint bootstrap

- New helper: chester-util-config/write-session-metadata.sh
- start-bootstrap Step 4c invokes helper after breadcrumb write
- Captures sprintName, branchName, ISO 8601 UTC timestamp,
  best-effort jsonlSessionId, skill version commit hashes
- Helper extracted from inline bash for testability

Implements AC-3.1, AC-3.2."
```

---

## Task 3: Partner Role Discipline — Composition Note + C1 + C2 + Self-Eval extension

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-5.1, AC-5.2
**Decision budget:** 3
**Must remain green:** `tests/test-partner-role-discipline.sh` (this task's new test, covering AC-1.* and AC-5.*; Task 4 extends it for AC-4.*)

**Files:**
- Modify: `skills/util-design-partner-role/SKILL.md` (insert Composition Note after Interpreter Frame section line 41; insert C1 + C2 sections after Private Precision Slot section line 54; extend Self-Evaluation section line 67-78 with four sibling checks)
- Create: `tests/test-partner-role-discipline.sh` (replace skeleton stub with real tests for AC-1.* and AC-5.*)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** (replaces skeleton stubs `ac-1-1-c1-section-present` through `ac-1-5-composition-note` and `ac-5-1-translation-gate-passes`, `ac-5-2-existing-mechanisms-unchanged`)

```bash
#!/bin/bash
# Tests: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-5.1, AC-5.2
# Partner-role discipline structure
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
PARTNER="$REPO_ROOT/skills/util-design-partner-role/SKILL.md"

# AC-1.1: C1 section present with required elements
grep -qE '^## C1: Externalized Coverage' "$PARTNER" || { echo "FAIL AC-1.1: C1 section heading missing"; exit 1; }
grep -q "load-bearing" "$PARTNER" || { echo "FAIL AC-1.1: 'load-bearing' phrase missing"; exit 1; }
grep -qiE 'hidden[ -]premise|silent premise' "$PARTNER" || { echo "FAIL AC-1.1: failure mode (hidden/silent premise) not named"; exit 1; }
grep -qi "single-session" "$PARTNER" || { echo "FAIL AC-1.1: single-session scope not stated"; exit 1; }
grep -qi "would removing this" "$PARTNER" || { echo "FAIL AC-1.1: operational test missing"; exit 1; }

# AC-1.2: C2 section present
grep -qE '^## C2: Fact Default with Marked Departures' "$PARTNER" || { echo "FAIL AC-1.2: C2 section heading missing"; exit 1; }
grep -qi "verifiable" "$PARTNER" || { echo "FAIL AC-1.2: 'verifiable' (Fact definition) missing"; exit 1; }
grep -qi "repeatable" "$PARTNER" || { echo "FAIL AC-1.2: 'repeatable' (Fact definition) missing"; exit 1; }
grep -qE "I'm assuming|I assumed" "$PARTNER" || { echo "FAIL AC-1.2: Assumption natural-phrasing example missing"; exit 1; }
grep -qE "I think|I recommend|My read" "$PARTNER" || { echo "FAIL AC-1.2: Opinion natural-phrasing example missing"; exit 1; }
grep -qi "all recommendations are opinions" "$PARTNER" || { echo "FAIL AC-1.2: hard rule on recommendations missing"; exit 1; }
grep -qi "no source breadcrumb\|no breadcrumb" "$PARTNER" || { echo "FAIL AC-1.2: no-breadcrumb constraint missing"; exit 1; }

# AC-1.3: before/after example block
grep -qiE "^### Before/After|^\*\*Before|^Before \(" "$PARTNER" || { echo "FAIL AC-1.3: Before/After example block missing"; exit 1; }
# example must contain the four claim types — heuristic: presence of marker keywords near each other
awk '/Before/,/After/' "$PARTNER" | grep -qiE "Assumption|assuming" || { echo "FAIL AC-1.3: Assumption marker absent in before/after"; exit 1; }
awk '/After/,/^---|^##/' "$PARTNER" | grep -qiE "Opinion|I think|recommend" || { echo "FAIL AC-1.3: Opinion marker absent in after side"; exit 1; }

# AC-1.4: Self-Evaluation extended with 4 sibling checks
# Existing strategy/code check preserved + 4 new questions tagged (C1) or (C2)
# Use exclusive-start awk pattern — naive '/start/,/end/' terminates immediately when start matches the closing pattern
SE_BLOCK=$(awk '/^## Self-Evaluation/{flag=1; next} /^## /{flag=0} flag' "$PARTNER")
echo "$SE_BLOCK" | grep -qi "strategy talk or code talk" || { echo "FAIL AC-1.4: existing strategy/code check removed"; exit 1; }
# Count sibling checks specifically tagged with (C1) or (C2) markers — avoids matching pre-existing bullets
SIBLING_COUNT=$(echo "$SE_BLOCK" | grep -cE '\((C1|C2)( hard rule)?\)')
if [ "$SIBLING_COUNT" -lt 4 ]; then echo "FAIL AC-1.4: fewer than 4 (C1)/(C2)-tagged sibling checks (got $SIBLING_COUNT)"; exit 1; fi

# AC-1.5: Composition Note present near top, after Interpreter Frame
INTRO_BLOCK=$(awk '/^## The Interpreter Frame/,/^## Private Precision Slot/' "$PARTNER")
echo "$INTRO_BLOCK" | grep -qiE "C1|C2" || { echo "FAIL AC-1.5: Composition Note (mentioning C1 or C2) not found between Interpreter Frame and Private Precision Slot"; exit 1; }

# AC-5.1: Translation Gate compatibility — no obvious code vocabulary
# Heuristic: check the new sections for backticks containing CamelCase identifiers, dotted paths, or .ext suffixes
NEW_BLOCK=$(awk '/^## C1: Externalized Coverage/,/^## Option-Naming Rule/' "$PARTNER")
if echo "$NEW_BLOCK" | grep -qE '\`[A-Z][a-zA-Z]*[A-Z][a-zA-Z]*\`'; then echo "FAIL AC-5.1: backticked CamelCase identifier in new sections (Translation Gate violation)"; exit 1; fi
if echo "$NEW_BLOCK" | grep -qE '\`[a-z]+/[a-z]+'; then echo "FAIL AC-5.1: backticked file path in new sections"; exit 1; fi
if echo "$NEW_BLOCK" | grep -qE '\.cs|\.ts|\.py|\.js'; then echo "FAIL AC-5.1: file suffix in new sections"; exit 1; fi

# AC-5.2: Existing sections preserved verbatim
grep -qE '^## The Core Stance' "$PARTNER" || { echo "FAIL AC-5.2: Core Stance section missing"; exit 1; }
grep -qE '^## The Interpreter Frame' "$PARTNER" || { echo "FAIL AC-5.2: Interpreter Frame section missing"; exit 1; }
grep -qE '^## Private Precision Slot' "$PARTNER" || { echo "FAIL AC-5.2: Private Precision Slot section missing"; exit 1; }
grep -qE '^## Option-Naming Rule' "$PARTNER" || { echo "FAIL AC-5.2: Option-Naming Rule section missing"; exit 1; }
grep -qE '^## Self-Evaluation' "$PARTNER" || { echo "FAIL AC-5.2: Self-Evaluation section missing"; exit 1; }
grep -qE '^## Stance Principles' "$PARTNER" || { echo "FAIL AC-5.2: Stance Principles section missing"; exit 1; }

echo "PASS: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-5.1, AC-5.2"
```

Save as `tests/test-partner-role-discipline.sh`. `chmod +x`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-partner-role-discipline.sh`
Expected: FAIL with `FAIL AC-1.1: C1 section heading missing`

- [ ] **Step 3: Edit `skills/util-design-partner-role/SKILL.md`**

After the Interpreter Frame section (after line 41), before Private Precision Slot section, insert:

```markdown
## Composition Note

C1 (Externalized Coverage) and C2 (Fact Default with Marked Departures) are voice disciplines that compose with the existing rules in this file. Translation Gate (defined in the design skills) strips code vocabulary; C1 and C2 govern what gets surfaced and how it is marked. The disciplines are independent — apply each on its own merits, in any order, every turn.
```

After the Private Precision Slot section (after line 54), before Option-Naming Rule section, insert:

```markdown
## C1: Externalized Coverage

The agent must not reason from un-externalized context to a designer-facing conclusion. Load-bearing concepts must surface in designer-visible output before they can count toward shared understanding within this session.

**Failure mode — silent premise.** The commentary reaches a conclusion through reasoning the designer cannot see, because the enabling context never appeared in designer-visible output. The designer cannot challenge what they cannot see.

**Operational test.** Before sending, ask: would removing this from designer-visible output change whether the designer could challenge my conclusion? If yes, surface it.

**Scope.** Single session only. Carry-forward from prior sessions does not require re-surfacing.

## C2: Fact Default with Marked Departures

Most claims are Facts — verifiable and repeatable. Anyone running the same lookup gets the same result. Leave Facts unmarked.

**Assumption marker.** Use when a claim rests on an unstated premise the designer hasn't confirmed. Natural phrasing — "I'm assuming...", "Assumption; I assumed...", "If I'm reading this right..." — anything that makes the assumption unambiguous.

**Opinion marker.** Use when a claim is judgment, perspective, recommendation, or take. Natural phrasing — "I think...", "I recommend...", "My read is...", "Opinion; my opinion..." — anything that signals the agent's voice rather than observed fact.

**Hard rule: all recommendations are opinions.** No matter how well-grounded the supporting Facts, the act of recommending is judgment applied to those Facts. Recommendations carry the Opinion marker.

**No source breadcrumb in commentary.** Do not write "(read from such-and-such file)" or attribute the source inline. Precision about sources lives in private notes (see Private Precision Slot above). The designer asks for source explicitly if needed.

**Composition with Translation Gate.** Markers use plain language only — Translation Gate (in the design skills) runs after marking and continues to strip code vocabulary regardless of marker presence.

### Before/After Example

Before (confidence laundering — Assumption presented as Fact):

> The diagnostic layer routes all warnings through a single aggregation point. The safest approach is to add the new signal there.

After (C2-compliant):

> The diagnostic layer routes all warnings through a single aggregation point. I'm assuming this aggregation point is the right injection target — it is the only one I found, but the codebase may carry conventions I did not reach. I think the safest approach is to add the new signal there; the aggregation point already carries the structural plumbing, and widening it beats introducing a parallel path.

What changed: the second after-sentence adds an Assumption marker (the agent rests on an un-confirmed premise — that no other injection target exists). The third after-sentence adds an Opinion marker because it carries a recommendation. The first sentence (verifiable Fact) stays unmarked.
```

In the Self-Evaluation section (line 67-78 area), keep the existing positive-game text intact. After the existing closing sentence, add:

```markdown
**Also answer these before sending — sibling checks for C1 and C2:**

- Did I draw any conclusion from a premise the designer hasn't seen? If yes, surface the premise in the information package before the conclusion. (C1)
- Did I present an Assumption as a Fact? If yes, add the Assumption marker. (C2)
- Did I present an Opinion or recommendation without marking it? If yes, add the Opinion marker. (C2)
- Does this turn carry a recommendation without an Opinion marker? Recommendations are always opinions. (C2 hard rule)

These are siblings to the strategy-talk check, not replacements. If any answer is yes, fix it before sending.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-partner-role-discipline.sh`
Expected: PASS with `PASS: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-5.1, AC-5.2`

- [ ] **Step 5: Commit**

```bash
git add skills/util-design-partner-role/SKILL.md tests/test-partner-role-discipline.sh
git commit -m "feat: add C1 + C2 voice discipline to partner role

- New Composition Note explaining how C1 and C2 compose with existing rules
- New C1 (Externalized Coverage) section with statement, failure mode,
  operational test, single-session scope
- New C2 (Fact Default with Marked Departures) section with default-state
  rule, Assumption marker, Opinion marker, recommendations-are-opinions
  hard rule, no-breadcrumb constraint, before/after example
- Self-Evaluation extended with four sibling checks for C1 and C2
- Existing sections (Core Stance, Interpreter Frame, Private Precision Slot,
  Option-Naming Rule, Stance Principles) preserved verbatim

Implements AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-5.1, AC-5.2."
```

---

## Task 4: Cross-References — design-large-task and design-small-task per-turn flows

**Type:** docs-producing
**Implements:** AC-4.1, AC-4.2
**Decision budget:** 1
**Must remain green:** `tests/test-partner-role-discipline.sh` (extended in this task to cover AC-4.*)

**Files:**
- Modify: `skills/design-large-task/SKILL.md:282` (Understand Stage Per-Turn Flow Step 6 — append cross-reference line)
- Modify: `skills/design-large-task/SKILL.md:408` (Solve Stage Per-Turn Flow Step 8 — append cross-reference line)
- Modify: `skills/design-small-task/SKILL.md:142` (Phase 4 Per-Turn Flow Step 3 — append cross-reference line)
- Modify: `tests/test-partner-role-discipline.sh` (append AC-4.1 and AC-4.2 assertions)

**Steps (TDD):**

- [ ] **Step 1: Extend the test** (replaces skeleton stubs `ac-4-1-large-task-cross-refs` and `ac-4-2-small-task-cross-ref`)

Append to `tests/test-partner-role-discipline.sh` BEFORE the final `echo "PASS:..."` line:

```bash
# AC-4.1: design-large-task per-turn flow contains C1+C2 cross-references
LARGE="$REPO_ROOT/skills/design-large-task/SKILL.md"
# Understand Stage Step 6 (around line 282) and Solve Stage Step 8 (around line 408)
US_BLOCK=$(awk '/Step 6: Write commentary/,/Step 7:/' "$LARGE" | head -100)
SS_BLOCK=$(awk '/Step 8: Write commentary/,/Step 9:/' "$LARGE" | head -100)
echo "$US_BLOCK" | grep -qE 'C1.*C2|C2.*C1' || { echo "FAIL AC-4.1: Understand Stage Step 6 missing C1/C2 cross-reference"; exit 1; }
echo "$US_BLOCK" | grep -qi "util-design-partner-role" || { echo "FAIL AC-4.1: Understand Stage Step 6 cross-reference does not name util-design-partner-role"; exit 1; }
echo "$SS_BLOCK" | grep -qE 'C1.*C2|C2.*C1' || { echo "FAIL AC-4.1: Solve Stage Step 8 missing C1/C2 cross-reference"; exit 1; }
echo "$SS_BLOCK" | grep -qi "util-design-partner-role" || { echo "FAIL AC-4.1: Solve Stage Step 8 cross-reference does not name util-design-partner-role"; exit 1; }

# AC-4.2: design-small-task per-turn flow contains C1+C2 cross-reference
SMALL="$REPO_ROOT/skills/design-small-task/SKILL.md"
ST_BLOCK=$(awk '/Step 3: Write commentary/,/Step 4:/' "$SMALL" | head -100)
echo "$ST_BLOCK" | grep -qE 'C1.*C2|C2.*C1' || { echo "FAIL AC-4.2: Phase 4 Step 3 missing C1/C2 cross-reference"; exit 1; }
echo "$ST_BLOCK" | grep -qi "util-design-partner-role" || { echo "FAIL AC-4.2: Phase 4 Step 3 cross-reference does not name util-design-partner-role"; exit 1; }
```

Then update the final pass line to:

```bash
echo "PASS: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-4.1, AC-4.2, AC-5.1, AC-5.2"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-partner-role-discipline.sh`
Expected: FAIL with `FAIL AC-4.1: Understand Stage Step 6 missing C1/C2 cross-reference`

- [ ] **Step 3: Edit the design skill files**

Edit `skills/design-large-task/SKILL.md`. At the end of Step 6 description in the Understand Stage Per-Turn Flow (around line 282, just before Step 7), append one line:

```markdown
Before sending, verify C1 and C2 from `util-design-partner-role` — every load-bearing premise is visible in the information package; every Assumption and Opinion is marked.
```

At the end of Step 8 description in the Solve Stage Per-Turn Flow (around line 408, just before Step 9), append the same one line:

```markdown
Before sending, verify C1 and C2 from `util-design-partner-role` — every load-bearing premise is visible in the information package; every Assumption and Opinion is marked.
```

Edit `skills/design-small-task/SKILL.md`. At the end of Step 3 description in Phase 4 Per-Turn Flow (around line 142, just before Step 4), append one line:

```markdown
Before sending, verify C1 and C2 from `util-design-partner-role` — every load-bearing premise is visible in the information package; every Assumption and Opinion is marked.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-partner-role-discipline.sh`
Expected: PASS with `PASS: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-4.1, AC-4.2, AC-5.1, AC-5.2`

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/SKILL.md skills/design-small-task/SKILL.md tests/test-partner-role-discipline.sh
git commit -m "feat: add C1+C2 cross-references in design skill per-turn flows

- design-large-task Understand Stage Step 6: cross-reference line
- design-large-task Solve Stage Step 8: cross-reference line
- design-small-task Phase 4 Step 3: cross-reference line
- All three lines name C1, C2, and util-design-partner-role
- Test extended to verify cross-references in both files

Implements AC-4.1, AC-4.2."
```

---

## Final Verification

After all four tasks complete, run all three test files to confirm no regressions:

```bash
bash tests/test-understanding-telemetry.sh
bash tests/test-session-metadata.sh
bash tests/test-partner-role-discipline.sh
```

All three should print `PASS: ...` lines and exit 0.

Optional: run an existing test to confirm no incidental breakage:

```bash
bash tests/test-config-read-new.sh
```

Should pass as before.
