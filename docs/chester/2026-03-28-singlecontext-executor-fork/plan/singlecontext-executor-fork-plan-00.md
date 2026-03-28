# Chester Fork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork Chester into two independent codebases — subagent variant and singlecontext variant — at separate filesystem paths with independent Git remotes.

**Architecture:** Rename the existing `~/.claude/skills/` directory to `~/.claude/skills-chester-subagent/`, copy it to `~/.claude/skills-chester-singlecontext/`, update all hardcoded paths in each variant, and configure `settings.json` to point at the active variant.

**Tech Stack:** Bash, Git, sed (for bulk path replacement)

---

### Task 1: Prune Worktrees and Prepare for Rename

**Files:**
- Modify: `~/.claude/skills/.worktrees/` (remove all worktrees)

- [ ] **Step 1: List active worktrees**

Run: `git -C ~/.claude/skills worktree list`

Verify which worktrees exist. The sprint-004 worktree for this plan will be listed.

- [ ] **Step 2: Remove the sprint worktree**

```bash
git -C ~/.claude/skills worktree remove .worktrees/sprint-004-singlecontext-executor-fork --force
```

The `--force` flag is needed because we are inside the worktree's branch context.

- [ ] **Step 3: Prune stale worktree references**

```bash
git -C ~/.claude/skills worktree prune
```

- [ ] **Step 4: Verify no worktrees remain**

Run: `git -C ~/.claude/skills worktree list`
Expected: Only the main worktree at `~/.claude/skills` is listed.

- [ ] **Step 5: Verify clean git state**

Run: `git -C ~/.claude/skills status`
Expected: Clean working tree (or known pre-existing changes — the sprint branch work is already committed).

---

### Task 2: Rename to Subagent Variant

**Files:**
- Move: `~/.claude/skills/` → `~/.claude/skills-chester-subagent/`

- [ ] **Step 1: Rename the directory**

```bash
mv ~/.claude/skills ~/.claude/skills-chester-subagent
```

- [ ] **Step 2: Verify the rename**

```bash
ls ~/.claude/skills-chester-subagent/CLAUDE.md
ls ~/.claude/skills 2>/dev/null && echo "ERROR: old directory still exists" || echo "OK: old directory gone"
```

Expected: CLAUDE.md exists at new path, old path does not exist.

- [ ] **Step 3: Verify Git state preserved**

```bash
git -C ~/.claude/skills-chester-subagent remote -v
git -C ~/.claude/skills-chester-subagent log --oneline -3
```

Expected: Remote still points to `OrdinaryMoose/Chester`. Recent commits visible.

---

### Task 3: Copy to Singlecontext Variant

**Files:**
- Create: `~/.claude/skills-chester-singlecontext/` (full recursive copy)

- [ ] **Step 1: Copy the directory**

```bash
cp -r ~/.claude/skills-chester-subagent ~/.claude/skills-chester-singlecontext
```

- [ ] **Step 2: Verify the copy**

```bash
diff <(ls ~/.claude/skills-chester-subagent) <(ls ~/.claude/skills-chester-singlecontext)
```

Expected: No differences in top-level directory listing.

- [ ] **Step 3: Verify both are independent Git repos**

```bash
git -C ~/.claude/skills-chester-subagent rev-parse --show-toplevel
git -C ~/.claude/skills-chester-singlecontext rev-parse --show-toplevel
```

Expected: Each reports its own path as the toplevel.

---

### Task 4: Update Hardcoded Paths in Subagent Variant

**Files (all within `~/.claude/skills-chester-subagent/`):**
- Modify: `chester-hooks/chester-config-read.sh`
- Modify: `chester-start/SKILL.md`
- Modify: `chester-figure-out/SKILL.md`
- Modify: `chester-build-spec/SKILL.md`
- Modify: `chester-build-plan/SKILL.md`
- Modify: `chester-write-code/SKILL.md`
- Modify: `chester-finish-plan/SKILL.md`
- Modify: `chester-trace-reasoning/SKILL.md`
- Modify: `chester-write-summary/SKILL.md`
- Modify: `chester-doc-sync/SKILL.md`
- Modify: `chester-doc-sync/subagent-doc-gaps.md`
- Modify: `chester-doc-sync/subagent-claude-md.md`
- Modify: `chester-doc-sync/subagent-approved-docs.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Bulk replace paths in skill files**

```bash
cd ~/.claude/skills-chester-subagent
find . -maxdepth 3 \( -name '*.md' -o -name '*.sh' \) \
  -not -path './docs/chester/*' \
  -not -path './.worktrees/*' \
  -exec sed -i 's|~/.claude/skills/|~/.claude/skills-chester-subagent/|g' {} +
```

This excludes `docs/chester/` (sprint artifacts are historical records) and `.worktrees/`.

- [ ] **Step 2: Verify no old paths remain in skill files**

```bash
cd ~/.claude/skills-chester-subagent
grep -rn '~/.claude/skills/' --include='*.md' --include='*.sh' . \
  | grep -v './docs/chester/' \
  | grep -v './.worktrees/'
```

Expected: No output (zero matches outside sprint artifacts).

- [ ] **Step 3: Spot-check key files**

```bash
grep 'skills-chester-subagent' ~/.claude/skills-chester-subagent/chester-hooks/chester-config-read.sh
grep 'skills-chester-subagent' ~/.claude/skills-chester-subagent/CLAUDE.md
grep 'skills-chester-subagent' ~/.claude/skills-chester-subagent/chester-start/SKILL.md
```

Expected: Each shows the updated path.

- [ ] **Step 4: Commit the path updates**

```bash
cd ~/.claude/skills-chester-subagent
git add -A
git commit -m "chore: update paths for chester fork (subagent variant)"
```

---

### Task 5: Update Hardcoded Paths in Singlecontext Variant

**Files (all within `~/.claude/skills-chester-singlecontext/`):**
- Same file list as Task 4

- [ ] **Step 1: Bulk replace paths in skill files**

```bash
cd ~/.claude/skills-chester-singlecontext
find . -maxdepth 3 \( -name '*.md' -o -name '*.sh' \) \
  -not -path './docs/chester/*' \
  -not -path './.worktrees/*' \
  -exec sed -i 's|~/.claude/skills/|~/.claude/skills-chester-singlecontext/|g' {} +
```

- [ ] **Step 2: Replace subagent paths carried over from the copy**

The copy was made AFTER Task 4 updated the subagent paths, so the singlecontext copy has `skills-chester-subagent` references. Replace those:

```bash
cd ~/.claude/skills-chester-singlecontext
find . -maxdepth 3 \( -name '*.md' -o -name '*.sh' \) \
  -not -path './docs/chester/*' \
  -not -path './.worktrees/*' \
  -exec sed -i 's|~/.claude/skills-chester-subagent/|~/.claude/skills-chester-singlecontext/|g' {} +
```

- [ ] **Step 3: Verify no old paths remain**

```bash
cd ~/.claude/skills-chester-singlecontext
grep -rn '~/.claude/skills/' --include='*.md' --include='*.sh' . \
  | grep -v './docs/chester/' \
  | grep -v './.worktrees/'
grep -rn '~/.claude/skills-chester-subagent/' --include='*.md' --include='*.sh' . \
  | grep -v './docs/chester/' \
  | grep -v './.worktrees/'
```

Expected: No output from either grep (zero matches outside sprint artifacts).

- [ ] **Step 4: Commit the path updates**

```bash
cd ~/.claude/skills-chester-singlecontext
git add -A
git commit -m "chore: update paths for chester fork (singlecontext variant)"
```

---

### Task 6: Update settings.json

**Files:**
- Modify: `~/.claude/settings.json`

- [ ] **Step 1: Update the hook path**

Change the session-start hook command from:
```
/home/mike/.claude/skills/chester-hooks/session-start
```
to:
```
/home/mike/.claude/skills-chester-subagent/chester-hooks/session-start
```

Note: This uses the absolute expanded path (not `~`), matching the existing format in settings.json.

- [ ] **Step 2: Verify the update**

```bash
jq '.hooks.SessionStart[0].hooks[0].command' ~/.claude/settings.json
```

Expected: `"/home/mike/.claude/skills-chester-subagent/chester-hooks/session-start"`

---

### Task 7: Set Singlecontext Remote

**Files:**
- Modify: `~/.claude/skills-chester-singlecontext/.git/config` (via git remote commands)

- [ ] **Step 1: Remove the inherited origin**

```bash
git -C ~/.claude/skills-chester-singlecontext remote remove origin
```

- [ ] **Step 2: Verify remote removed**

```bash
git -C ~/.claude/skills-chester-singlecontext remote -v
```

Expected: No output (no remotes configured).

- [ ] **Step 3: Note for user**

Print: "Singlecontext remote removed. When you create the new GitHub repo, add it with:
`git -C ~/.claude/skills-chester-singlecontext remote add origin <your-new-repo-url>`"

---

### Task 8: Final Verification

- [ ] **Step 1: Verify subagent variant loads**

```bash
~/.claude/skills-chester-subagent/chester-hooks/session-start 2>&1 | head -5
```

Expected: JSON output with hookSpecificOutput (no errors).

- [ ] **Step 2: Verify singlecontext variant loads**

```bash
~/.claude/skills-chester-singlecontext/chester-hooks/session-start 2>&1 | head -5
```

Expected: JSON output with hookSpecificOutput (no errors).

- [ ] **Step 3: Verify config reader works in subagent**

```bash
cd ~/.claude/skills-chester-subagent && eval "$(./chester-hooks/chester-config-read.sh)" && echo "WORK_DIR=$CHESTER_WORK_DIR"
```

Expected: Outputs the configured work directory.

- [ ] **Step 4: Verify config reader works in singlecontext**

```bash
cd ~/.claude/skills-chester-singlecontext && eval "$(./chester-hooks/chester-config-read.sh)" && echo "WORK_DIR=$CHESTER_WORK_DIR"
```

Expected: Outputs the configured work directory.

- [ ] **Step 5: Verify no stale path references**

```bash
for dir in ~/.claude/skills-chester-subagent ~/.claude/skills-chester-singlecontext; do
  echo "=== $dir ==="
  grep -rn '~/.claude/skills/' --include='*.md' --include='*.sh' "$dir" \
    | grep -v '/docs/chester/' \
    | grep -v '/.worktrees/' || echo "Clean"
done
```

Expected: "Clean" for both variants.

- [ ] **Step 6: Confirm old directory is gone**

```bash
ls ~/.claude/skills 2>/dev/null && echo "WARNING: old directory still exists" || echo "OK: old directory removed"
```

Expected: "OK: old directory removed"
