---
name: finish-close-worktree
description: >
  Final step of the finish phase. Presents four options for branch integration (merge
  locally, create PR, keep as-is, discard), executes the chosen option, and cleans up
  the worktree. Use after finish-archive-artifacts has committed all sprint artifacts.
version: v0001
---

# Close Worktree

The last skill in the finish sequence. All code is verified, all artifacts are archived.
Now decide what to do with the branch and clean up.

## Step 1: Determine Base Branch

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main — is that correct?"

## Step 2: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to {base-branch} locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

Don't add explanation — keep options concise.

## Step 3: Execute Choice

### Option 1: Merge Locally

**Before switching branches, check if the base branch has uncommitted changes:**

```bash
# Check from worktree — inspect base branch working tree state
git -C "$(git worktree list | grep '{base-branch}' | awk '{print $1}')" status --porcelain
```

**If the base branch has uncommitted changes:**

```
{base-branch} has uncommitted changes from prior work:

[Show status output]

Options:
1. Stash changes, merge, then reapply — git stash, merge, git stash pop
2. Keep the branch as-is — you handle the merge when {base-branch} is clean

Which do you prefer?
```

Do NOT proceed with checkout if the base branch is dirty. The user must decide.

**If the base branch is clean:**

```bash
git checkout {base-branch}
git pull
git merge --no-ff {feature-branch}
```

Verify tests on merged result:
```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

If tests pass:
```bash
git branch -d {feature-branch}
```

Then: cleanup worktree (Step 4).

### Option 2: Push and Create PR

```bash
git push -u origin {feature-branch}

gh pr create --title "{title}" --body "$(cat <<'EOF'
## Summary
{2-3 bullets of what changed}

## Test Plan
- [ ] {verification steps}
EOF
)"
```

Report: "PR created. Worktree preserved at {path} for addressing review comments."

Do NOT cleanup worktree — the branch is now remote and may need local changes
to address PR feedback.

### Option 3: Keep As-Is

Report: "Keeping branch {name}. Worktree preserved at {path}."

Do NOT cleanup worktree.

### Option 4: Discard

Confirm first:

```
This will permanently delete:
- Branch {name}
- All commits: {commit-list}
- Worktree at {path}

Type 'discard' to confirm.
```

Wait for exact confirmation. If confirmed, check for dirty base branch (same check
as Option 1). If dirty, warn and offer to keep-as-is instead. If clean:

```bash
git checkout {base-branch}
git branch -D {feature-branch}
```

Then: cleanup worktree (Step 4).

## Step 4: Cleanup Worktree

**For Options 1 and 4 only:**

```bash
git worktree list | grep $(git branch --show-current)
```

If in a worktree:
```bash
git worktree remove {worktree-path}
```

**For Options 2 and 3:** Keep worktree intact.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | - | yes (force) |

## Red Flags

**Never:**
- Proceed with failing tests (Option 1 post-merge verification)
- Delete work without typed confirmation (Option 4)
- Force-push without explicit request
- Auto-cleanup worktree for Options 2 or 3

**Always:**
- Present exactly 4 options
- Get typed "discard" confirmation for Option 4
- Verify tests after merge (Option 1)

## Integration

- **Called after:** `finish-archive-artifacts`
- **Pairs with:** `util-worktree` (cleans up what that skill created)
