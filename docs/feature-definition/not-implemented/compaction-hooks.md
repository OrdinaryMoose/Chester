# Feature Definition Brief: Compaction Hooks for State Preservation

## Problem

Chester's design-figure-out skill conducts interviews that routinely exceed 20 turns. During these sessions, Claude Code's automatic context compaction fires when the context window fills — summarizing earlier conversation to free space. When compaction hits mid-interview, critical state gets lossy-compressed:

- **Understanding MCP scores** — the nine-dimension saturation map that governs topic selection gets summarized into prose, losing the numerical precision that drives the scoring cycle
- **Phase identity** — whether we're in Phase 1 (Understand) or Phase 2 (Solve) can be ambiguously represented in a summary, causing the agent to propose solutions during understanding or ask broad questions during solving
- **Constraint accumulations** — user rejections and corrections ("no, that's out of scope", "we tried that, it failed") are the highest-value content and the most vulnerable to lossy summarization
- **Auditor lesson matches** — the agent scans `~/.chester/thinking.md` each round; after compaction, it may forget which lessons already matched

Chester currently mitigates this with the structured thinking protocol (`capture_thought` / `get_thinking_summary`), which places captured thoughts at the end of context where attention is strongest. This works but is reactive — it depends on the agent remembering to capture before compaction happens, and compaction timing is unpredictable.

## Proposed Solution

Use Claude Code's `PreCompact` and `PostCompact` hook events to automatically persist and reload Chester's interview state across compaction boundaries.

### Architecture

```
PreCompact fires
  ↓
Command hook reads MCP state files from the sprint working directory
  ↓
Hook writes a consolidated state snapshot to a known path
  ↓
Compaction proceeds
  ↓
PostCompact fires (or SessionStart with matcher "compact")
  ↓
Command hook reads the snapshot
  ↓
Hook outputs state as additionalContext, injected into post-compaction context
```

### Hook Configuration

Two hooks registered in Chester's plugin hooks configuration:

**PreCompact hook** — persists state before compaction:

- Reads the understanding state file (`{sprint-dir}/design/{sprint-name}-understanding-state.json`) and enforcement state file (`{sprint-dir}/design/{sprint-name}-enforcement-state.json`) if they exist
- Reads the latest `get_thinking_summary` output if available
- Writes a consolidated snapshot to `{sprint-dir}/design/.compaction-snapshot.json` containing:
  - Current phase (Understand or Solve, determined by whether enforcement state exists)
  - All dimension scores with justifications and gaps
  - Group saturation levels
  - Weakest dimension and group
  - Challenge modes fired
  - Gate status
  - Round count
  - Key constraints from thinking summary
- Does NOT block compaction — always exits 0

**PostCompact hook** — re-injects state after compaction:

- Reads `.compaction-snapshot.json`
- Outputs a structured context injection containing:
  - Phase identity and round count ("You are in Phase 2 (Solve), round 14 of the interview")
  - Dimension saturation summary (which dimensions are strong, which need attention)
  - Active constraints the user has stated
  - Challenge modes already fired (so they don't re-fire)
  - The weakest dimension the agent should address next
- Output format is natural language with embedded structure — readable by the agent as a state reload, not raw JSON

### What the Hook Receives

Both hooks receive JSON on stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/home/mike/Documents/CodeProjects/Chester",
  "hook_event_name": "PreCompact",
  "trigger": "auto"
}
```

The hook uses `cwd` to locate the sprint working directory. It needs to discover the active sprint subdirectory — this could be passed via an environment variable set during bootstrap, or discovered by finding the most recently modified state file in the working directory.

### Sprint Directory Discovery

The PreCompact hook needs to find the active sprint directory without relying on conversation context (which is about to be compacted). Options:

1. **Breadcrumb file** — `start-bootstrap` writes `{CHESTER_WORKING_DIR}/.active-sprint` containing the sprint subdirectory name. The hook reads this file.
2. **Most recent state file** — scan `{CHESTER_WORKING_DIR}/*/design/*-understanding-state.json` and pick the most recently modified.
3. **Environment variable** — bootstrap exports `CHESTER_ACTIVE_SPRINT` but hooks may not inherit the agent's environment.

Option 1 (breadcrumb file) is the most reliable. It's a one-line addition to `start-bootstrap` and survives any environment inheritance issues.

## Scope

### In Scope

- PreCompact hook script that snapshots MCP state files
- PostCompact hook script that re-injects state as context
- Breadcrumb file written by `start-bootstrap`
- Hook registration in Chester's plugin hooks configuration
- Integration with existing structured thinking protocol (complement, not replace)

### Out of Scope

- Changing how compaction itself works (that's Claude Code platform internals)
- Persisting full conversation history (the snapshot is state, not transcript)
- Modifying the understanding or enforcement MCP servers
- Blocking compaction (we always allow it — fighting the platform is fragile)

## Constraints

- Hooks receive limited data (session_id, transcript_path, cwd, trigger) — no conversation content
- PostCompact hooks cannot block — they only inject context
- Hook timeout is 10 minutes by default, but these should complete in under 1 second (just reading/writing JSON files)
- The additionalContext injection appears as a system message, not as a file — the agent receives it as text in context
- Multiple hooks on the same event run in parallel with non-deterministic ordering

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Snapshot file is stale (from a previous session) | Medium | Include session_id and timestamp in snapshot; PostCompact hook ignores snapshots older than 1 hour |
| Sprint directory discovery fails | Medium | Breadcrumb file approach is robust; fallback to no-op (compaction proceeds normally, agent relies on structured thinking captures) |
| Re-injected context conflicts with compaction summary | Low | Context injection supplements, doesn't contradict — it adds precision (scores, phase identity) that the summary naturally loses |
| Hook script errors silently | Low | Log errors to `{sprint-dir}/design/.compaction-hook.log`; non-blocking errors don't break the session |

## Dependencies

- `start-bootstrap` must write the `.active-sprint` breadcrumb file
- Understanding and enforcement MCP state files must be readable as standalone JSON (they already are)
- `jq` must be available (already a Chester prerequisite)

## Success Criteria

- After automatic compaction during a 20+ turn interview, the agent correctly identifies its current phase and addresses the weakest dimension on the next turn
- Challenge modes that already fired do not re-fire after compaction
- User constraints stated before compaction are reflected in post-compaction commentary
- No observable change in agent behavior during sessions that don't hit compaction

## Implementation Notes

The hook scripts should be shell scripts using `jq` for JSON manipulation. They live in `chester-util-config/hooks/` alongside the existing session-start hook. The hook registration goes in the plugin's hooks configuration (likely `.claude-plugin/plugin.json` or a hooks directory).

The PostCompact output should be written as a concise, structured natural-language summary — not raw JSON. Example:

```
Chester Interview State (restored after context compaction):

Phase: Understand (Phase 1)
Round: 8
Understanding saturation: 0.42 overall
  Weakest group: human_context (0.18)
  Weakest dimension: stakeholder_impact (0.10) — "No discussion yet of who is affected by this change"
  Strongest: surface_coverage (0.72), relationship_mapping (0.65)

Key constraints established:
  - User rejected real-time sync approach (round 4)
  - Budget ceiling is "minimal infrastructure" (round 6)
  - Must integrate with existing auth, not replace it (round 3)

Challenge modes fired: none
Transition ready: false

Resume the Understand phase. Address stakeholder_impact next — it's the least-saturated dimension in the weakest group.
```
