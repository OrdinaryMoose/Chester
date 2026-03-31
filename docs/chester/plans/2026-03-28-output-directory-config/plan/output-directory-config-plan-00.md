# Output Directory Configuration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Chester's ad-hoc, per-skill output directory resolution with centralized project-scoped configuration, a shared config reader, and dual-write to a gitignored planning directory.

**Architecture:** A shared bash script (`chester-config-read.sh`) reads the project-scoped config and exports `work_dir` and `planning_dir`. Chester-start gains first-run detection to create the config. All downstream skills call the config reader instead of resolving paths independently. Every artifact write is dual-written to both the worktree (committed) and the planning directory (gitignored convenience copy).

**Tech Stack:** Bash, jq, SKILL.md instruction files (markdown)

---

### Task 1: Create shared config reader script

**Files:**
- Create: `chester-hooks/chester-config-read.sh`

This is the foundation — every other task depends on it.

- [ ] **Step 1: Write the config reader script**

```bash
#!/usr/bin/env bash
# chester-config-read.sh — Resolve project-scoped Chester config
# Usage: source chester-hooks/chester-config-read.sh
#   or:  eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
# Exports: CHESTER_WORK_DIR, CHESTER_PLANNING_DIR, CHESTER_CONFIG_PATH

set -euo pipefail

# Resolve project hash (same convention as Claude Code)
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT_HASH="$(echo "$PROJECT_ROOT" | sed 's|/|-|g; s|^-||')"
PROJECT_CONFIG="$HOME/.claude/projects/-${PROJECT_HASH}/chester-config.json"
GLOBAL_CONFIG="$HOME/.claude/chester-config.json"

# Priority: project config > global config > defaults
if [ -f "$PROJECT_CONFIG" ]; then
  CONFIG_FILE="$PROJECT_CONFIG"
elif [ -f "$GLOBAL_CONFIG" ]; then
  CONFIG_FILE="$GLOBAL_CONFIG"
else
  CONFIG_FILE=""
fi

if [ -n "$CONFIG_FILE" ] && command -v jq &>/dev/null; then
  CHESTER_WORK_DIR="$(jq -r '.work_dir // "docs/chester"' "$CONFIG_FILE")"
  CHESTER_PLANNING_DIR="$(jq -r '.planning_dir // empty' "$CONFIG_FILE")"
  if [ -z "$CHESTER_PLANNING_DIR" ]; then
    CHESTER_PLANNING_DIR="${CHESTER_WORK_DIR}-planning"
  fi
else
  CHESTER_WORK_DIR="docs/chester"
  CHESTER_PLANNING_DIR="docs/chester-planning"
fi

CHESTER_CONFIG_PATH="${CONFIG_FILE:-none}"

# Output as eval-able exports
echo "CHESTER_WORK_DIR='$CHESTER_WORK_DIR'"
echo "CHESTER_PLANNING_DIR='$CHESTER_PLANNING_DIR'"
echo "CHESTER_CONFIG_PATH='$CHESTER_CONFIG_PATH'"
```

- [ ] **Step 2: Make executable and verify**

Run: `chmod +x chester-hooks/chester-config-read.sh`

Run: `~/.claude/skills/chester-hooks/chester-config-read.sh`

Expected: Three lines of eval-able output with default values (since no project config exists yet for testing).

- [ ] **Step 3: Commit**

```bash
git add chester-hooks/chester-config-read.sh
git commit -m "feat: add shared config reader script"
```

---

### Task 2: Add first-run detection to chester-start

**Files:**
- Modify: `chester-start/SKILL.md`

Add a new section after the existing "Session Housekeeping" section (after jq verification, before "How to Access Skills").

- [ ] **Step 1: Read current chester-start/SKILL.md**

Read the file to confirm exact insertion point. The new section goes after the jq verification step (step 2 of Session Housekeeping) and before "## How to Access Skills".

- [ ] **Step 2: Add first-run detection section**

Insert after the jq verification step, as a new step 3 in Session Housekeeping:

```markdown
3. **First-run project configuration:** Check for project-scoped Chester config:
   ```bash
   eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
   ```
   If `CHESTER_CONFIG_PATH` is `none`, this is a new project. Run the first-run setup:

   a. Announce: "This looks like a new project for Chester. Let's set up your output directories."

   b. Present defaults and ask for confirmation or customization:
   ```
   Chester needs two directories for this project:

   Work directory (committed artifacts): docs/chester/
   Planning directory (gitignored, for reading active docs): docs/chester-planning/

   Accept defaults? Or enter custom paths.
   ```

   c. User accepts defaults or provides custom paths for either or both.

   d. Create the planning directory: `mkdir -p "$CHESTER_PLANNING_DIR"`

   e. Ensure planning directory is in `.gitignore`:
   ```bash
   if ! git check-ignore -q "$CHESTER_PLANNING_DIR" 2>/dev/null; then
     echo "$CHESTER_PLANNING_DIR/" >> .gitignore
     git add .gitignore
     git commit -m "chore: add chester planning directory to .gitignore"
   fi
   ```

   f. Determine the project config path and write the config:
   ```bash
   PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
   PROJECT_HASH="$(echo "$PROJECT_ROOT" | sed 's|/|-|g; s|^-||')"
   PROJECT_CONFIG_DIR="$HOME/.claude/projects/-${PROJECT_HASH}"
   mkdir -p "$PROJECT_CONFIG_DIR"
   ```
   Write to `$PROJECT_CONFIG_DIR/chester-config.json`:
   ```json
   {
     "work_dir": "<user's chosen work directory>",
     "planning_dir": "<user's chosen planning directory>"
   }
   ```
   Merge with any existing keys from `~/.claude/chester-config.json` (e.g., `budget_guard`).

   g. Announce: "Chester configured. Artifacts will be written to `{work_dir}`, planning docs at `{planning_dir}`."

   If `CHESTER_CONFIG_PATH` is not `none`, read silently and proceed. No announcement unless there's a problem (e.g., planning directory missing from .gitignore — fix and warn).
```

- [ ] **Step 3: Verify the edit**

Read `chester-start/SKILL.md` and confirm:
- New section appears between jq verification and "How to Access Skills"
- First-run flow is complete: detect, prompt, create dirs, update .gitignore, write config
- Existing config flow is silent

- [ ] **Step 4: Commit**

```bash
git add chester-start/SKILL.md
git commit -m "feat: add first-run project config detection to chester-start"
```

---

### Task 3: Replace directory choice in chester-figure-out

**Files:**
- Modify: `chester-figure-out/SKILL.md`

Replace the Phase 1 three-option directory prompt with config-driven silent creation. Update Phase 4 to dual-write.

- [ ] **Step 1: Read current chester-figure-out/SKILL.md**

Read the file to identify exact sections to replace.

- [ ] **Step 2: Replace Phase 1 Administrative Setup**

Find the Phase 1 section that offers three directory options (A/B/C) and the sprint auto-detection logic. Replace with:

```markdown
## Phase 1: Administrative Setup

- Read project config:
  ```bash
  eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
  ```
- Establish three-word sprint name (lowercase, hyphenated) for file naming
- Construct sprint subdirectory name: `YYYY-MM-DD-word-word-word`
- Record the sprint subdirectory name for use in Phase 4
- `clear_thinking_history()` to reset structured thinking for the session
```

- [ ] **Step 3: Update Phase 4 Closure to create directories in both locations and dual-write**

Find the Phase 4 section that creates output directories and writes design artifacts. Replace the directory creation and file writing steps with:

```markdown
5. Invoke `chester-make-worktree` to create the branch and worktree. The branch name follows the sprint naming convention: `sprint-NNN-descriptive-slug`. Auto-detect NNN by scanning existing branches for the highest sprint number and incrementing.
6. Read project config in the worktree context:
   ```bash
   eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
   ```
7. Create the output directory structure in the worktree: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/`, `spec/`, `plan/`, `summary/`
8. Create matching structure in main tree planning directory: `{CHESTER_PLANNING_DIR}/{sprint-subdir}/design/`, `spec/`, `plan/`, `summary/`
9. Inform user: "Sprint docs at `{CHESTER_PLANNING_DIR}/{sprint-subdir}/`"
10. Write thinking summary to `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-thinking-00.md` (worktree)
11. Copy thinking summary to `{CHESTER_PLANNING_DIR}/{sprint-subdir}/design/{sprint-name}-thinking-00.md` (main tree)
12. Write design brief to `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md` (worktree)
13. Copy design brief to `{CHESTER_PLANNING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md` (main tree)
14. Commit both documents in worktree with message: `checkpoint: design complete`
15. Transition to chester-build-spec
```

- [ ] **Step 4: Remove the three-option references from the checklist**

Update checklist item 1 to reflect new behavior:

```markdown
1. **Sprint setup** — read project config, establish three-word sprint name, construct sprint subdirectory name
```

- [ ] **Step 5: Verify the edit**

Read `chester-figure-out/SKILL.md` and confirm:
- No three-option directory prompt remains
- Phase 1 reads config
- Phase 4 creates directories in both worktree and main tree
- Dual-write pattern for design artifacts

- [ ] **Step 6: Commit**

```bash
git add chester-figure-out/SKILL.md
git commit -m "feat: replace directory choice with config-driven silent creation in figure-out"
```

---

### Task 4: Update chester-build-spec for config reader and dual-write

**Files:**
- Modify: `chester-build-spec/SKILL.md`

Replace standalone directory logic with config read. Add dual-write for spec artifacts.

- [ ] **Step 1: Read current chester-build-spec/SKILL.md**

Read the file to identify the standalone invocation section and the spec writing section.

- [ ] **Step 2: Replace standalone invocation section**

Find the "Standalone Invocation" section. Replace with:

```markdown
## Standalone Invocation

When invoked without a prior chester-figure-out session:

1. Read project config:
   ```bash
   eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
   ```
2. If `CHESTER_CONFIG_PATH` is `none`, warn: "No Chester config found. Run chester-start first or accept defaults." Use defaults.
3. Ask for the sprint name (three words, hyphenated) if not derivable from context
4. Construct sprint subdirectory: `YYYY-MM-DD-word-word-word`
5. Create `{CHESTER_WORK_DIR}/{sprint-subdir}/` with four subdirectories: `design/`, `spec/`, `plan/`, `summary/`
6. Create matching `{CHESTER_PLANNING_DIR}/{sprint-subdir}/` with same subdirectories
```

- [ ] **Step 3: Add dual-write to spec writing section**

Find the section that writes the spec to disk. After the write step, add:

```markdown
- Copy the spec file to the planning directory: `{CHESTER_PLANNING_DIR}/{sprint-subdir}/spec/{sprint-name}-spec-00.md`
```

- [ ] **Step 4: Remove the frontmatter conditional**

Find the section about YAML frontmatter (option B/C conditional). Replace with:

```markdown
- No YAML frontmatter is needed in spec documents. All skills read output paths from the project config via `chester-config-read.sh`, not from document frontmatter.
```

- [ ] **Step 5: Verify and commit**

Read `chester-build-spec/SKILL.md` and confirm changes. Then:

```bash
git add chester-build-spec/SKILL.md
git commit -m "feat: update build-spec with config reader and dual-write"
```

---

### Task 5: Update chester-build-plan for config reader

**Files:**
- Modify: `chester-build-plan/SKILL.md`

Replace frontmatter-based output path resolution with config read.

- [ ] **Step 1: Read current chester-build-plan/SKILL.md**

Read the file to identify the "Save plans to" and "Inheriting output directory" sections.

- [ ] **Step 2: Replace output path resolution**

Find the "Save plans to" section and the "Inheriting output directory" paragraph. Replace both with:

```markdown
**Save plans to:** Read project config:
```bash
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
```
Write the plan to `{CHESTER_WORK_DIR}/{sprint-subdir}/plan/{sprint-name}-plan-00.md`.
Copy to `{CHESTER_PLANNING_DIR}/{sprint-subdir}/plan/{sprint-name}-plan-00.md`.

The sprint subdirectory name is inherited from the spec's directory path (e.g., if the spec is at `docs/chester/2026-03-28-output-directory-config/spec/...`, the sprint subdir is `2026-03-28-output-directory-config`).
```

- [ ] **Step 3: Remove frontmatter from plan document header**

Find the plan document header section that conditionally includes `output_dir` and `sprint_prefix` frontmatter. Remove the frontmatter block — it's no longer needed since all skills read from the project config.

- [ ] **Step 4: Verify and commit**

Read `chester-build-plan/SKILL.md` and confirm changes. Then:

```bash
git add chester-build-plan/SKILL.md
git commit -m "feat: update build-plan with config reader, remove frontmatter dependency"
```

---

### Task 6: Fix deferred items path in chester-write-code

**Files:**
- Modify: `chester-write-code/SKILL.md`

Replace hardcoded deferred items path with config-driven path and add dual-write.

- [ ] **Step 1: Read current chester-write-code/SKILL.md**

Read the file to identify the "Handle Deferred Items" section (around lines 54-72).

- [ ] **Step 2: Replace deferred items section**

Find the deferred items path (`docs/chester/deferred/<plan-name>-deferred.md`). Replace with:

```markdown
### Handle Deferred Items

When ideas surface during implementation that weren't in the plan, record them in a deferred items file — never implement them.

Read project config:
```bash
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
```

Determine the sprint subdirectory from the plan file's parent path.

Write deferred items to: `{CHESTER_WORK_DIR}/{sprint-subdir}/plan/{sprint-name}-deferred.md`
Copy to: `{CHESTER_PLANNING_DIR}/{sprint-subdir}/plan/{sprint-name}-deferred.md`
```

Keep the existing deferred item format (date, source task, description, why deferred) unchanged.

- [ ] **Step 3: Verify and commit**

Read `chester-write-code/SKILL.md` and confirm the hardcoded path is gone. Then:

```bash
git add chester-write-code/SKILL.md
git commit -m "fix: replace hardcoded deferred items path with config-driven path"
```

---

### Task 7: Add planning directory cleanup to chester-finish-plan

**Files:**
- Modify: `chester-finish-plan/SKILL.md`

Add a cleanup step that removes the sprint's subfolder from the planning directory after resolution.

- [ ] **Step 1: Read current chester-finish-plan/SKILL.md**

Read the file to identify where session artifacts are committed and where cleanup logic should go.

- [ ] **Step 2: Add config read at skill entry**

Add near the top of the skill's process, after budget guard check:

```markdown
Read project config:
```bash
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
```

Determine the sprint subdirectory from the plan file's parent path.
```

- [ ] **Step 3: Add planning directory cleanup step**

After the merge/PR/discard resolution step, add:

```markdown
### Planning Directory Cleanup

After the sprint resolves (merge, PR, or discard):

```bash
rm -rf "{CHESTER_PLANNING_DIR}/{sprint-subdir}/"
```

Only remove the resolved sprint's folder. Other active sprint folders are untouched. If the planning directory is now empty, leave it in place for future sprints.

Announce: "Cleaned up planning copy at `{CHESTER_PLANNING_DIR}/{sprint-subdir}/`"
```

- [ ] **Step 4: Update the artifact commit command**

Find the commit command that references `{output_dir}` and update it to use the config-derived path:

```markdown
```bash
git add {CHESTER_WORK_DIR}/{sprint-subdir}/summary/ {CHESTER_WORK_DIR}/{sprint-subdir}/plan/
git commit -m "checkpoint: artifacts saved"
```
```

- [ ] **Step 5: Verify and commit**

Read `chester-finish-plan/SKILL.md` and confirm changes. Then:

```bash
git add chester-finish-plan/SKILL.md
git commit -m "feat: add planning directory cleanup to finish-plan"
```

---

### Task 8: Update chester-write-summary for config reader and dual-write

**Files:**
- Modify: `chester-write-summary/SKILL.md`

Replace the priority search order with config reader.

- [ ] **Step 1: Read current chester-write-summary/SKILL.md**

Read the file to identify "Step 0: Determine Output Directory" section.

- [ ] **Step 2: Replace output directory resolution**

Replace the 5-level priority search with:

```markdown
## Step 0: Determine Output Directory

Read project config:
```bash
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
```

Determine the sprint subdirectory from context (plan file path, conversation, or most recent sprint directory under `{CHESTER_WORK_DIR}/`).

Write summary to: `{CHESTER_WORK_DIR}/{sprint-subdir}/summary/{sprint-name}-summary-00.md`
Copy to: `{CHESTER_PLANNING_DIR}/{sprint-subdir}/summary/{sprint-name}-summary-00.md`

If the sprint subdirectory cannot be determined, ask the user.
```

- [ ] **Step 3: Verify and commit**

```bash
git add chester-write-summary/SKILL.md
git commit -m "feat: update write-summary with config reader and dual-write"
```

---

### Task 9: Update chester-trace-reasoning for config reader and dual-write

**Files:**
- Modify: `chester-trace-reasoning/SKILL.md`

Replace the priority search order with config reader. Remove session-variable dependency on write-summary.

- [ ] **Step 1: Read current chester-trace-reasoning/SKILL.md**

Read the file to identify "Step 1: Determine Output Directory" section.

- [ ] **Step 2: Replace output directory resolution**

Replace the 6-level priority search with:

```markdown
## Step 1: Determine Output Directory

Read project config:
```bash
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
```

Determine the sprint subdirectory from context (plan file path, conversation, or most recent sprint directory under `{CHESTER_WORK_DIR}/`).

Write audit to: `{CHESTER_WORK_DIR}/{sprint-subdir}/summary/{sprint-name}-audit-00.md`
Copy to: `{CHESTER_PLANNING_DIR}/{sprint-subdir}/summary/{sprint-name}-audit-00.md`

If the sprint subdirectory cannot be determined, ask the user.
```

- [ ] **Step 3: Verify and commit**

```bash
git add chester-trace-reasoning/SKILL.md
git commit -m "feat: update trace-reasoning with config reader and dual-write"
```

---

### Task 10: Update chester-doc-sync for config reader

**Files:**
- Modify: `chester-doc-sync/SKILL.md`

Replace report output path logic with config reader.

- [ ] **Step 1: Read current chester-doc-sync/SKILL.md**

Read the file to identify the report output path section.

- [ ] **Step 2: Replace report output path**

Find the section that determines report output (two-pattern logic for default vs sprint directory). Replace with:

```markdown
Read project config:
```bash
eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
```

Determine the sprint subdirectory from context (reasoning audit path, conversation, or most recent sprint directory under `{CHESTER_WORK_DIR}/`).

Write report to: `{CHESTER_WORK_DIR}/{sprint-subdir}/summary/{sprint-name}-doc-sync-00.md`
Copy to: `{CHESTER_PLANNING_DIR}/{sprint-subdir}/summary/{sprint-name}-doc-sync-00.md`
```

- [ ] **Step 3: Verify and commit**

```bash
git add chester-doc-sync/SKILL.md
git commit -m "feat: update doc-sync with config reader and dual-write"
```

---

### Task 11: Manual verification

Verify the complete system works end-to-end.

- [ ] **Step 1: Verify config reader works**

```bash
~/.claude/skills/chester-hooks/chester-config-read.sh
```

Expected: Three lines with default values.

- [ ] **Step 2: Verify all SKILL.md files reference config reader**

```bash
grep -l "chester-config-read.sh" chester-*/SKILL.md
```

Expected: chester-start, chester-figure-out, chester-build-spec, chester-build-plan, chester-write-code, chester-finish-plan, chester-write-summary, chester-trace-reasoning, chester-doc-sync (9 files).

- [ ] **Step 3: Verify no remaining hardcoded paths**

```bash
grep -rn "docs/chester/deferred" chester-*/SKILL.md
```

Expected: No matches.

```bash
grep -rn "docs/superpowers" chester-*/SKILL.md
```

Expected: No matches.

- [ ] **Step 4: Verify no remaining three-option prompts**

```bash
grep -rn "Option A\|Option B\|Option C\|option A\|option B\|option C" chester-*/SKILL.md
```

Expected: No matches (or only in historical context references).

- [ ] **Step 5: Verify no remaining frontmatter dependency**

```bash
grep -rn "output_dir.*frontmatter\|sprint_prefix.*frontmatter\|frontmatter.*output_dir" chester-*/SKILL.md
```

Expected: No matches indicating runtime dependency on frontmatter for path resolution.

- [ ] **Step 6: Commit verification results**

```bash
git add -A
git commit -m "checkpoint: verification complete"
```
