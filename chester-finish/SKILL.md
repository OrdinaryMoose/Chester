---
name: chester-finish
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Budget Guard Check

Before proceeding with this skill, check the token budget:

1. Run: `cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // empty'`
2. If the file is missing or the command fails: log "Budget guard: usage data unavailable" and continue
3. If the file exists, check staleness via `.timestamp` — if more than 60 seconds old, log "Budget guard: usage data stale" and continue
4. Read threshold: `cat ~/.claude/settings.chester.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'`
5. If `five_hour_used_pct >= threshold`: **STOP** and display the pause-and-report, then wait for user response
6. If below threshold: continue normally

**Pause-and-report format:**

> **Budget Guard — Pausing**
>
> **5-hour usage:** {pct}% (threshold: {threshold}%)
> **Resets in:** {countdown from five_hour_resets_at}
>
> **Completed tasks:** {list}
> **Current task:** {current}
> **Remaining tasks:** {list}
>
> **Options:** (1) Continue anyway, (2) Stop here, (3) Other

## Read Project Config

```bash
eval "$(~/.claude/skills/chester-util-config/chester-config-read.sh)"
```

Determine the sprint subdirectory from the plan file's parent path.

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Verify clean tree → Present options → Execute choice → Clean up → Artifacts.

## The Process

### Step 1: Verify Tests

**REQUIRED: Invoke the chester-execute-prove skill as the first step to run the full test suite and produce verification evidence.** This loads the Iron Law ("no completion claims without fresh verification evidence") and the Gate Function into context.

**Then verify tests pass:**

```bash
# Run project's FULL test suite
npm test / cargo test / pytest / go test ./...
```

Read the complete output. Confirm the pass count and zero failures. Do not summarize or skim.

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Verify Clean Tree

After tests pass, check for uncommitted changes:

```bash
git status --porcelain
```

**If output shows modified tracked files (lines starting with `M`, `A`, `D`, `R`, `C`, or `U`):**

```
Uncommitted changes detected:

[Show git status output]

All implementation changes must be committed before proceeding.
```

Stop. The user must either:
- Commit the remaining changes
- Confirm the changes are unrelated to this work

Only proceed after the user responds.

**If output is empty or shows only untracked files (`??`):** Continue to Step 2.5.

### Step 2.5: Checkpoint — Execution Complete

Commit a checkpoint marking execution as complete:

```bash
git commit --allow-empty -m "checkpoint: execution complete"
```

This checkpoint uses `--allow-empty` because all implementation work is already committed — the checkpoint is a marker, not a content commit.

### Step 3: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 4: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 5: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch (--no-ff preserves the branch rail in commit history)
git merge --no-ff <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 6)

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup worktree (Step 6)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 6)

### Step 6: Cleanup Worktree

**For Options 1, 2, 4:**

Check if in worktree:
```bash
git worktree list | grep $(git branch --show-current)
```

If yes:
```bash
git worktree remove <worktree-path>
```

**For Option 3:** Keep worktree.

### Step 6.5: Planning Directory Cleanup

After the sprint resolves (merge, PR, or discard):

```bash
rm -rf "{CHESTER_WORK_DIR}/{sprint-subdir}/"
```

Only remove the resolved sprint's folder. Other active sprint folders are untouched. If the planning directory is now empty, leave it in place for future sprints.

### Step 7: Session Artifacts (Optional)

After the workflow completes, offer:

```
Would you like me to produce session artifacts?

1. Session summary (invoke chester-finish-write-session-summary)
2. Reasoning audit (invoke chester-finish-write-reasoning-audit)
3. Cache analysis (parse session JSONL for cache hit rates)
4. All of the above
5. Skip
```

#### Cache Analysis (Option 3)

Parse the current session's JSONL file for cache hit metrics:

1. Find the session JSONL:
   ```bash
   SESSION_DIR="$HOME/.claude/projects/$(echo "$PWD" | sed 's|/|-|g; s|^-||')"
   LATEST_JSONL=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1)
   ```

2. If no JSONL found, report: "No session JSONL found at $SESSION_DIR. Skipping cache analysis."

3. Extract cache metrics per API call:
   ```bash
   jq -r 'select(.type == "assistant" and .message.usage) |
     [.message.usage.input_tokens // 0,
      .message.usage.cache_creation_input_tokens // 0,
      .message.usage.cache_read_input_tokens // 0] |
     @csv' "$LATEST_JSONL"
   ```

4. Compute and display summary:
   ```
   ## Cache Analysis

   | Call # | Input | Cache Write | Cache Read | Hit Rate |
   |--------|-------|-------------|------------|----------|
   | ...    | ...   | ...         | ...        | ...      |

   **Overall:** X% of input tokens served from cache
   **Subagent average:** Y% cache hit rate
   ```

5. Write report to `{sprint-dir}/summary/cache-analysis.md`

This is best-effort. If jq parsing fails or the JSONL structure is unexpected, report the error and skip gracefully. Do not block the finish-plan workflow.

If artifacts were produced (options 1-4), commit them:

```bash
git add {CHESTER_PLANS_DIR}/{sprint-subdir}/summary/ {CHESTER_PLANS_DIR}/{sprint-subdir}/plan/
git commit -m "checkpoint: artifacts saved"
```

If declined, the skill completes without the artifacts checkpoint.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Proceed with uncommitted changes to tracked files
- Skip chester-execute-prove invocation

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only

## Integration

**Called by:**
- **chester-execute-write** - After all tasks complete

**Requires before presenting options:**
- **chester-execute-prove** — Verify tests and clean tree with evidence

**Pairs with:**
- **chester-util-worktree** - Cleans up worktree created by that skill
- **chester-finish-write-session-summary** — Session summary production (optional, Step 7)
- **chester-finish-write-reasoning-audit** — Reasoning audit production (optional, Step 7)
