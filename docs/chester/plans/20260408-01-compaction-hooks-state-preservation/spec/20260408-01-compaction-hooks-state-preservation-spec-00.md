# Spec: Compaction Hooks for State Preservation

## Overview

Automatic state persistence across Claude Code context compaction events during Chester architect interviews. PreCompact and PostCompact hooks snapshot and re-inject MCP interview state so that long-running sessions (20+ turns) survive compaction without losing scoring precision, phase identity, or accumulated constraints.

## Problem

Chester's design-architect skill conducts structured interviews using two MCP servers: understanding (9-dimension saturation scoring) and enforcement (ambiguity scoring, gates, challenge modes). These servers persist state to JSON files, but the agent's in-context awareness of that state is lost when Claude Code's automatic compaction fires mid-session. Compaction lossy-compresses earlier conversation, causing:

- Numerical scores to be summarized into imprecise prose
- Phase identity (Understand vs. Solve) to become ambiguous
- User constraints and rejections to be dropped or weakened
- Challenge modes that already fired to be forgotten, causing re-fires

The structured thinking protocol (`capture_thought` / `get_thinking_summary`) partially mitigates this but requires the agent to proactively capture before unpredictable compaction timing.

## Architecture

### Hook Lifecycle

```
PreCompact fires
  |
  v
pre-compact.sh reads MCP state files from active sprint directory
  |
  v
Writes consolidated snapshot to {sprint-dir}/design/.compaction-snapshot.json
  |
  v
Compaction proceeds (hook always exits 0)
  |
  v
PostCompact fires
  |
  v
post-compact.sh reads .compaction-snapshot.json
  |
  v
Outputs structured natural-language state summary as additionalContext
  |
  v
Agent resumes with precise state awareness
```

### Sprint Directory Discovery

Hooks run outside the agent's context and cannot ask "which sprint am I working on?" They need a filesystem anchor.

**Approach: Breadcrumb file.** `start-bootstrap` writes the active sprint subdirectory name to `{CHESTER_WORKING_DIR}/.active-sprint` during session setup. The compaction hooks read this file to locate state files.

This is the most reliable option because:
- It survives environment inheritance issues (unlike env vars)
- It requires no filesystem scanning (unlike most-recent-file heuristics)
- It's a one-line addition to `start-bootstrap`

## Components

### 1. Breadcrumb Writer (start-bootstrap modification)

**File modified:** `skills/start-bootstrap/SKILL.md`

After creating the sprint working directory (existing Step 5), `start-bootstrap` writes:

```bash
echo "{sprint-subdir}" > "{CHESTER_WORKING_DIR}/.active-sprint"
```

The breadcrumb contains only the sprint subdirectory name (e.g., `20260408-01-compaction-hooks-state-preservation`), not a full path. The hook composes the full path using `CHESTER_WORKING_DIR` resolved from `chester-config-read`.

### 2. PreCompact Hook Script

**File:** `chester-util-config/hooks/pre-compact.sh`

**Input:** JSON on stdin with `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `trigger`.

**Behavior:**

1. Source chester config: `eval "$(chester-config-read)"`
2. Read breadcrumb: `cat "$CHESTER_WORKING_DIR/.active-sprint"` — if missing, exit 0 (no-op; not in an interview session)
3. Construct sprint path: `$CHESTER_WORKING_DIR/$SPRINT_NAME`
4. Look for state files:
   - Understanding: `$SPRINT_PATH/design/*-understanding-state.json`
   - Enforcement: `$SPRINT_PATH/design/*-enforcement-state.json`
5. Build snapshot JSON containing:
   - `session_id` (from stdin)
   - `timestamp` (ISO 8601)
   - `sprint_name`
   - `phase`: `"understand"` if only understanding state exists, `"solve"` if enforcement state also exists
   - `understanding`: full understanding state object (if exists)
   - `enforcement`: full enforcement state object (if exists)
6. Write snapshot to `$SPRINT_PATH/design/.compaction-snapshot.json`
7. Exit 0 (always — never block compaction)

**Error handling:** All errors are logged to `$SPRINT_PATH/design/.compaction-hook.log` and the script exits 0. Silent failure is preferred over blocking compaction.

### 3. PostCompact Hook Script

**File:** `chester-util-config/hooks/post-compact.sh`

**Input:** JSON on stdin with `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `trigger`.

**Behavior:**

1. Source chester config: `eval "$(chester-config-read)"`
2. Read breadcrumb: `cat "$CHESTER_WORKING_DIR/.active-sprint"` — if missing, exit 0
3. Read snapshot: `$SPRINT_PATH/design/.compaction-snapshot.json` — if missing, exit 0
4. **Staleness check:** Parse `timestamp` from snapshot. If older than 1 hour, log warning and exit 0 (stale snapshot from a previous session)
5. **Session ID check:** Compare snapshot `session_id` with stdin `session_id`. If they differ, log warning and exit 0 (snapshot from a different session)
6. Build natural-language state summary from snapshot data:
   - Phase identity and round count
   - Understanding dimension scores: per-group saturation, weakest group/dimension with gap text
   - Enforcement scores (if in Solve phase): per-dimension scores, gate status, challenge modes fired, stall status
   - Key constraints from gap fields (these encode what the user has said)
   - Transition readiness
   - Directive: "Resume the {phase} phase. Address {weakest} next."
7. Output hook response JSON with the summary as `additionalContext`
8. Exit 0

**Output format:** The `additionalContext` string is structured natural language — readable by the agent as a state reload. Example:

```
Chester Interview State (restored after context compaction):

Phase: Understand (Phase 1)
Round: 8
Understanding saturation: 0.42 overall
  Weakest group: human_context (0.18)
  Weakest dimension: stakeholder_impact (0.10) — "No discussion yet of who is affected"
  Strongest: surface_coverage (0.72), relationship_mapping (0.65)

Key constraints established:
  - [from constraint_discovery gap]: "User rejected real-time sync approach"
  - [from problem_boundary gap]: "Must integrate with existing auth, not replace it"

Challenge modes fired: none
Transition ready: false

Resume the Understand phase. Address stakeholder_impact next.
```

### 4. Hook Registration

**File modified:** `hooks/hooks.json`

Add two new hook entries alongside the existing `SessionStart` hook:

```json
{
  "hooks": {
    "SessionStart": [ ... existing ... ],
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

No matcher is needed — compaction hooks should always run. The hooks self-guard by checking for the breadcrumb file and exiting early if not in an interview session.

## Data Flow

```
start-bootstrap
  |-- writes .active-sprint breadcrumb
  |-- creates sprint directory with design/ subdirectory
  v
Architect interview proceeds
  |-- understanding MCP writes *-understanding-state.json to design/
  |-- enforcement MCP writes *-enforcement-state.json to design/
  v
[Compaction triggers]
  |
  v
pre-compact.sh
  |-- reads .active-sprint to find sprint dir
  |-- reads *-understanding-state.json and *-enforcement-state.json
  |-- writes .compaction-snapshot.json
  v
[Compaction executes]
  v
post-compact.sh
  |-- reads .active-sprint to find sprint dir
  |-- reads .compaction-snapshot.json
  |-- validates freshness (timestamp < 1 hour, session_id matches)
  |-- outputs additionalContext with structured state summary
  v
Agent resumes with precise state
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No `.active-sprint` breadcrumb | Both hooks exit 0 (no-op). Not in an interview. |
| State files missing | PreCompact writes snapshot with null for missing state. PostCompact renders only available state. |
| Snapshot missing at PostCompact time | Exit 0. Agent relies on structured thinking captures. |
| Snapshot older than 1 hour | PostCompact logs warning, exits 0. Prevents injecting stale state from a previous session. |
| Session ID mismatch | PostCompact logs warning, exits 0. Prevents cross-session state injection. |
| `jq` unavailable | Both hooks log error and exit 0. Chester already requires `jq` (checked at session start), but hooks degrade gracefully. |
| `chester-config-read` fails | Hooks exit 0. Cannot locate working directory without config. |
| Any script error | Logged to `.compaction-hook.log`. Script exits 0. |

The guiding principle: **never block compaction.** Every error path exits 0. The worst case is that the agent loses state precision and falls back to structured thinking captures — the same as today.

## Testing Strategy

### Unit Tests (bash)

**File:** `tests/test-compaction-hooks.sh`

1. **PreCompact with understanding state only:**
   - Set up sprint directory with a mock understanding state file
   - Write breadcrumb
   - Pipe mock stdin JSON to pre-compact.sh
   - Assert `.compaction-snapshot.json` exists with `phase: "understand"` and understanding data present

2. **PreCompact with both states:**
   - Add enforcement state file
   - Assert snapshot has `phase: "solve"` and both states present

3. **PreCompact with no breadcrumb:**
   - Remove `.active-sprint`
   - Assert no snapshot written, exit code 0

4. **PostCompact produces additionalContext:**
   - Write a known snapshot
   - Pipe stdin JSON with matching session_id
   - Assert output contains `hookSpecificOutput.additionalContext` with phase, round, and dimension data

5. **PostCompact staleness guard:**
   - Write snapshot with timestamp > 1 hour ago
   - Assert output has no `additionalContext` (or empty)

6. **PostCompact session ID mismatch:**
   - Write snapshot with session_id "abc"
   - Pipe stdin with session_id "xyz"
   - Assert no additionalContext

### Integration Test

7. **Round-trip test:**
   - Initialize understanding MCP state via the server's `initialize_understanding` tool (or by writing the JSON directly)
   - Submit a few rounds of scores
   - Run pre-compact.sh to snapshot
   - Run post-compact.sh to produce additionalContext
   - Assert the output contains the correct round number, overall saturation, and weakest dimension

## Constraints

- Hooks receive only `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `trigger` on stdin — no conversation content
- PostCompact hooks inject `additionalContext` as a system message, not a file
- Hooks must complete in under 1 second (reading/writing small JSON files)
- Multiple hooks on the same event run in parallel with non-deterministic ordering — these hooks are independent of others and safe to run in parallel
- The `${CLAUDE_PLUGIN_ROOT}` variable in hook commands is expanded by the plugin system at registration time

## Non-Goals

- Changing how compaction works (Claude Code platform internal)
- Persisting full conversation history (snapshot is state, not transcript)
- Modifying the understanding or enforcement MCP servers (they already persist to JSON)
- Blocking compaction (always allow it — fighting the platform is fragile)
- Replacing the structured thinking protocol (compaction hooks complement it)

## Dependencies

- `start-bootstrap` skill must be updated to write `.active-sprint` breadcrumb
- Understanding and enforcement MCP state files must be readable standalone JSON (already true)
- `jq` must be available (already a Chester prerequisite)
- `chester-config-read` must be on PATH (already true via `bin/chester-config-read`)

## Success Criteria

1. After automatic compaction during a 20+ turn interview, the agent correctly identifies its current phase and addresses the weakest dimension on the next turn
2. Challenge modes that already fired do not re-fire after compaction
3. User constraints stated before compaction are reflected in post-compaction behavior
4. No observable change in agent behavior during sessions that don't hit compaction
5. Both hooks complete in under 1 second
6. All error paths exit 0 without blocking compaction
