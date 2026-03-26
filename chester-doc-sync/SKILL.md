# chester-doc-sync

Detect documentation staleness after an implementation session by cross-referencing the reasoning audit and git changes against the project's documentation corpus.

## Trigger

- **Auto-trigger:** Invoked by chester-finish-plan before presenting merge/PR options
- **Manual trigger:** User says "run doc sync", "check doc staleness", or `/chester-doc-sync`

## Announcement

When this skill activates, announce: "Running doc sync — checking documentation alignment against session changes."

## Process

### Step 1: Locate inputs

1. **Find the reasoning audit:**
   - First check the conversation context for an audit path (from spec/plan frontmatter or earlier skill output)
   - If not in context, search the session's output directory for files matching `*-audit-*` or `*-reasoning-audit*`
   - If multiple matches, use the most recently modified file (by mtime)
   - If no match found and this is a manual invocation, ask the user for the audit path
   - If no match found and this is an auto-trigger, proceed without audit (limited mode)

2. **Determine base SHA for git diff (fallback chain):**
   - **First:** If a base SHA is available from the session context (e.g., recorded by chester-write-code before first task), use it
   - **Second:** If the session used a worktree that was merged, find the merge commit parent: `git log --merges -1 --format=%P HEAD | awk '{print $2}'` — this gives the pre-merge commit on main
   - **Third:** If the session used a worktree still active, use the branch point: `git merge-base HEAD main`
   - **Fourth:** Search git log for the first sprint-related commit (e.g., the plan or spec commit) and use its parent: `git rev-parse <first-sprint-commit>~1`
   - **Last resort:** Ask the user: "What is the base commit or branch to diff against?"
   - Run: `git diff --name-only {BASE_SHA}..HEAD`
   - Group changed files by their top-level project directory (e.g., `Story.Core.Service/src/Foo.cs` groups under `Story.Core.Service`)

3. **Get git log:** Run `git log --oneline {BASE_SHA}..HEAD` for commit message context.

### Step 2: Determine mode and scope

**Determine scope from git diff:**

Classify the change scope by examining which projects were touched:
- **Test-only scope:** ALL changed `.cs` files are in `*.Tests/` projects or `TestData/`. No production code changed.
- **Production scope:** At least one changed `.cs` file is outside test projects.

**Determine mode from available inputs:**

- **Full mode:** Reasoning audit found AND git diff shows code changes → dispatch all 3 subagents. If test-only scope, dispatch Agent 2 (approved docs) in lightweight mode (see below).
- **Limited mode:** No reasoning audit found, but git diff shows code changes → dispatch only Agent 1 (CLAUDE.md staleness checker). Print warning: *"No reasoning audit found — running in limited mode (git diff only)"*
- **Audit-only mode:** Reasoning audit found but git diff shows NO code changes → dispatch Agents 2 and 3 only (approved doc conflicts and gaps). Print note: *"No code changes detected — checking reasoning audit decisions against approved docs only"*
- **Skip mode:** No reasoning audit AND no code changes → print *"No code changes or reasoning audit — doc sync skipped"* and return

**Lightweight mode for Agent 2 (test-only scope):**

When all code changes are in test projects, the approved doc conflict checker is unlikely to find architectural conflicts. In this case, instruct Agent 2 to check only test-governance docs (ADR-GOV-110, ADR-GOV-120, GPR-GOV-110) rather than the full TDR/ADR/GPR corpus. Add to the agent prompt: *"All changes are in test projects — limit your search to test-governance documents."*

### Step 3: Dispatch subagents

Read the subagent prompt templates from this skill's directory:
- `~/.claude/skills/chester-doc-sync/subagent-claude-md.md`
- `~/.claude/skills/chester-doc-sync/subagent-approved-docs.md` (full or audit-only mode)
- `~/.claude/skills/chester-doc-sync/subagent-doc-gaps.md` (full or audit-only mode)

For each subagent prompt template:
1. Read the template file
2. Replace the placeholder variables with actual values:
   - `{GIT_DIFF_SUMMARY}` → the git diff grouped by project
   - `{AUDIT_PATH}` → the reasoning audit file path (or "not available" for Agent 1 in limited mode)
   - `{ADR_INDEX_PATH}` → `Documents/Approved/StoryDesigner/ADR/adr-index-current.md`
   - `{GPR_INDEX_PATH}` → `Documents/Approved/StoryDesigner/GPR/gpr-index-current.md`
   - `{TDR_DIR_PATH}` → `Documents/Approved/StoryDesigner/TDR/`
   - `{CONCEPT_INDEX_PATH}` → `Documents/Approved/StoryDesigner/ConceptIndex/concept-index-current.md`
3. Dispatch via the Agent tool with `description` set to the agent's role name
4. Dispatch all applicable agents **in parallel** (use a single message with multiple Agent tool calls)

### Step 4: Collect and merge results

Wait for all subagents to complete. For each:
- If the agent returned findings, parse them into the structured format
- If the agent failed or timed out, note: *"Agent {name} failed — that section skipped"*
- If the agent returned "no findings", record a clean result for that category

Sort findings within each category by finding ID (C-1 before C-2, etc.) for deterministic output.

### Step 5: Produce terminal summary

Print a terminal summary following this format:

**If findings exist:**

```
## Doc Sync Report

### CLAUDE.md Staleness: {N} findings ({M} sprint-caused, {K} pre-existing)
- [{severity}] [{origin}] {project}/CLAUDE.md — {one-line description}
...

### Approved Doc Conflicts: {N} findings
- [{severity}] {DOC-ID} ({title}) — {one-line description}
...

### Documentation Gaps: {N} findings
- [missing] {description}
...

Full report: {report_file_path}
```

**If no findings:**

```
Doc sync: all clear — no staleness detected.
```

**If limited or audit-only mode with findings:**

Include the mode warning at the top before the findings.

### Step 6: Write detailed report file (MANDATORY)

**This step is not optional.** Always write the report file unless no output directory is determinable.

Read the report template from `~/.claude/skills/chester-doc-sync/report-template.md`.

Populate it with:
- Date, session description, mode, audit path, base SHA
- Summary counts
- All findings from all agents, organized by category
- For each CLAUDE.md finding, include the `[sprint-caused]` or `[pre-existing]` tag
- Agent execution notes (any failures, skips, or degradation)

Write the report to the session's output directory:
- If using a `docs/chester/YYYY-MM-DD-<slug>/` directory: `<slug>-doc-sync-00.md`
- If using a `Documents/Refactor/Sprint NNN .../` directory: `<sprint-prefix>-doc-sync-report.md` in `summary/`
- If no output directory is determinable: skip the file and note in terminal that only the terminal summary was produced

Verify the file was written successfully before printing the "Full report:" path in the terminal summary.

### Step 7: Offer CLAUDE.md fixes

If any CLAUDE.md staleness findings exist (C-* findings), offer to fix them:

> "Doc sync found {N} CLAUDE.md staleness issues. Want me to fix them now?"

If the user accepts:
1. For each finding, read the current CLAUDE.md and apply the fix described in the finding's "Suggested action"
2. Present each edit for user review before writing
3. Commit all fixes in a single commit: `docs: update CLAUDE.md files for {sprint/session} changes`

If the user declines, note the findings as deferred and continue.

### Step 8: Return control

The skill is complete. If invoked from chester-finish-plan, return control so finish-plan can present merge/PR options. If invoked manually, the terminal summary and report file are the final output.

## Error Handling

- **Subagent failure:** Report findings from successful agents. Note the failure in the terminal summary and report file.
- **Index files not found:** The subagent should warn and skip that check. Expected paths from root CLAUDE.md:
  - ADR index: `Documents/Approved/StoryDesigner/ADR/adr-index-current.md`
  - GPR index: `Documents/Approved/StoryDesigner/GPR/gpr-index-current.md`
  - TDR directory: `Documents/Approved/StoryDesigner/TDR/` (no index — scan filenames matching `tdr-*-current.md`)
  - Concept index: `Documents/Approved/StoryDesigner/ConceptIndex/concept-index-current.md`
- **No output directory:** Fall back to terminal-only output.
- **Multiple audit file matches:** Use most recently modified file by mtime.
