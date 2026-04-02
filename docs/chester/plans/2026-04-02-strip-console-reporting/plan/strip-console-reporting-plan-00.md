# Strip Console Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-execute-write (recommended) or chester-execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all progress-only console output, debug instrumentation, and redundant in-session recording from Chester skills to reset to baseline agent behavior.

**Architecture:** Pure removal — edit SKILL.md files to delete reporting instructions, delete the debug subsystem entirely. No new code, no replacement mechanisms. Skills keep their functional logic; only prescriptive output instructions are removed.

**Tech Stack:** Markdown (SKILL.md files), Bash scripts (deletion), Git

---

### Task 1: Delete Debug Subsystem

**Files:**
- Delete: `chester-setup-start-debug/SKILL.md` (entire directory)
- Delete: `~/.claude/chester-log-usage.sh`
- Delete: `tests/test-debug-flag.sh`
- Delete: `tests/test-log-usage-script.sh`
- Modify: `tests/test-write-code-guard.sh` (remove debug assertions)
- Modify: `tests/test-start-cleanup.sh` (remove debug assertions)
- Modify: `tests/test-integration.sh` (remove debug assertions)

- [ ] **Step 1: Delete the debug skill directory**

```bash
rm -rf chester-setup-start-debug/
```

- [ ] **Step 2: Delete the log-usage script**

```bash
rm ~/.claude/chester-log-usage.sh
```

- [ ] **Step 3: Delete debug test files**

```bash
rm tests/test-debug-flag.sh
rm tests/test-log-usage-script.sh
```

- [ ] **Step 4: Update remaining test files that assert debug content**

In `tests/test-write-code-guard.sh`, `tests/test-start-cleanup.sh`, and `tests/test-integration.sh`: remove any assertions that grep for "Diagnostic Logging", "chester-debug.json", "chester-setup-start-debug", or "chester-log-usage". Read each file, identify the debug-related assertions, and delete them. If removing assertions leaves an empty test section, remove that section too.

- [ ] **Step 5: Commit**

```bash
git add -A chester-setup-start-debug/ tests/
git commit -m "chore: remove debug instrumentation subsystem and related tests"
```

Note: `~/.claude/chester-log-usage.sh` is outside the repo — deletion doesn't need git tracking.

---

### Task 2: Clean chester-setup-start/SKILL.md

**Files:**
- Modify: `chester-setup-start/SKILL.md`

- [ ] **Step 1: Remove the debug flag cleanup step**

Remove the entire "Clean up stale debug flag" section (lines 32-43), from `1. **Clean up stale debug flag:**` through the `If fresh (<12h)...` line. Renumber the remaining housekeeping steps: "Verify jq" becomes step 1, "First-run project configuration" becomes step 2.

- [ ] **Step 2: Remove the announce node from the digraph**

In the `skill_flow` digraph, remove:
- The node declaration: `"Announce: 'Using [skill] to [purpose]'" [shape=box];`
- The edge: `"Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";`
- The edge: `"Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";`

Add a replacement edge: `"Invoke Skill tool" -> "Has checklist?";`

- [ ] **Step 3: Remove chester-setup-start-debug from the available skills list**

Delete the line:
```
- `chester-setup-start-debug` — Activate diagnostic token logging mode for the session
```

- [ ] **Step 4: Verify and commit**

Run: `grep -n "debug\|Announce.*skill.*purpose\|chester-setup-start-debug" chester-setup-start/SKILL.md`
Expected: zero matches.

```bash
git add chester-setup-start/SKILL.md
git commit -m "chore: remove debug references and announce node from setup-start"
```

---

### Task 3: Clean chester-design-figure-out/SKILL.md

**Files:**
- Modify: `chester-design-figure-out/SKILL.md`

- [ ] **Step 1: Remove the Diagnostic Logging section**

Delete lines 30-35 (the `## Diagnostic Logging` header through the `Replace {sprint-dir}...` line).

- [ ] **Step 2: Remove the Announcement section**

Delete lines 61-63 (the `## Announcement` header and the announce instruction).

- [ ] **Step 3: Remove the Interview Transcript subsection**

Delete the entire `### Interview Transcript` subsection (lines 133-183), from `### Interview Transcript` through the formatting rules ending with `- `---` — exchange separator`. This includes: tool choice directive, example append, Phase 3 entry instructions, write-through rule, checkpoint instructions, content capture/exclude rules, and formatting rules.

- [ ] **Step 4: Remove transcript-related closure steps**

In Phase 4 Closure:
- Remove step 9: `Inform user: "Sprint docs at..."` (line 271)
- Remove step 14: `Copy transcript from...` (line 276)
- Remove step 15: `Include transcript in the commit...` (line 277)
- Update step 16 commit message reference: change "all three documents" to "thinking summary and design brief" (line 278)

Renumber remaining steps after removals.

- [ ] **Step 5: Remove transcript from file listing**

In the "This skill writes to design/" section, delete the line:
```
- `{sprint-name}-interview-00.md` — the interview transcript (dialogue)
```

- [ ] **Step 6: Verify and commit**

Run: `grep -n "transcript\|Diagnostic Logging\|log-usage\|[Aa]nnounce.*skill\|Inform user" chester-design-figure-out/SKILL.md`
Expected: zero matches.

```bash
git add chester-design-figure-out/SKILL.md
git commit -m "chore: remove reporting, debug, and transcript from figure-out"
```

---

### Task 4: Clean chester-design-specify/SKILL.md

**Files:**
- Modify: `chester-design-specify/SKILL.md`

- [ ] **Step 1: Remove the Diagnostic Logging section**

Delete lines 30-35.

- [ ] **Step 2: Remove the Announcement section**

Delete lines 68-70 (the `## Announcement` header and announce instruction).

- [ ] **Step 3: Remove "print to terminal" from checklist**

In the checklist item 3, remove `, print full content to terminal` from the end of the line (line 62).

- [ ] **Step 4: Remove "print to terminal" from Writing the Spec section**

Delete the line: `- Print the full document content to the terminal so the user can read it without opening the file` (line 132).

- [ ] **Step 5: Remove /report progress visibility from review loop**

In the Automated Spec Review Loop, delete the `**Progress visibility:**` paragraph (line 139): `**Progress visibility:** Before dispatching, `/report` as Spec Reviewer dispatching spec review. After reading the reviewer's report, `/report` as Spec Reviewer with spec review complete and approved/issues found summary.`

- [ ] **Step 6: Verify and commit**

Run: `grep -n "Diagnostic Logging\|log-usage\|[Aa]nnounce.*skill\|print.*terminal\|/report" chester-design-specify/SKILL.md`
Expected: zero matches.

```bash
git add chester-design-specify/SKILL.md
git commit -m "chore: remove reporting and debug from design-specify"
```

---

### Task 5: Clean chester-plan-build/SKILL.md

**Files:**
- Modify: `chester-plan-build/SKILL.md`

- [ ] **Step 1: Remove the Diagnostic Logging section**

Delete the entire `## Diagnostic Logging` section (lines 34-43), including all six before/after log-usage commands.

- [ ] **Step 2: Remove "print to terminal" from Save Plan Document**

Delete the line: `After writing the plan to disk, print the full plan content to the terminal so the user can read it without opening the file.` (line 226).

- [ ] **Step 3: Verify and commit**

Run: `grep -n "Diagnostic Logging\|log-usage\|print.*terminal" chester-plan-build/SKILL.md`
Expected: zero matches.

```bash
git add chester-plan-build/SKILL.md
git commit -m "chore: remove reporting and debug from plan-build"
```

---

### Task 6: Clean chester-execute-write/SKILL.md

**Files:**
- Modify: `chester-execute-write/SKILL.md`

- [ ] **Step 1: Remove the announcement**

Delete line 34: `Announce: "I'm using the chester-execute-write skill to implement this plan."`

- [ ] **Step 2: Remove /report progress visibility lines**

Delete these three `**Progress visibility:**` paragraphs:
- Line 98: Implementer dispatch/completion reporting
- Line 122: Spec Review dispatch/completion reporting
- Line 131: Quality Review dispatch/completion reporting

- [ ] **Step 3: Remove "print deferred item to terminal"**

In section 1.3 Handle Deferred Items, delete line 79: `5. Print the deferred item to terminal output so the user can see it immediately`

Renumber: there is no step 5 needed — step 4 "Continue with the current task" becomes the last step.

- [ ] **Step 4: Remove the Diagnostic Logging section**

Delete the entire `### 2.4 Diagnostic Logging (Debug Mode Only)` subsection (lines 149-178).

- [ ] **Step 5: Verify and commit**

Run: `grep -n "Diagnostic Logging\|log-usage\|[Aa]nnounce.*skill\|/report\|[Pp]rint.*terminal" chester-execute-write/SKILL.md`
Expected: zero matches.

```bash
git add chester-execute-write/SKILL.md
git commit -m "chore: remove reporting and debug from execute-write"
```

---

### Task 7: Clean chester-finish/SKILL.md

**Files:**
- Modify: `chester-finish/SKILL.md`

- [ ] **Step 1: Remove the Diagnostic Logging section**

Delete lines 40-45.

- [ ] **Step 2: Remove the announce instruction**

Delete line 53: `**Announce at start:** "I'm using the chester-finish skill to complete this work."`

- [ ] **Step 3: Remove the cleanup announcement**

Delete line 241: `Announce: "Cleaned up working copy at \`{CHESTER_WORK_DIR}/{sprint-subdir}/\`"`

- [ ] **Step 4: Remove "print to terminal" from artifacts section**

Delete line 257: `Every artifact produced must be both saved to disk AND written to the terminal. The user should be able to read the full content of each artifact in their terminal output without needing to open the file.`

- [ ] **Step 5: Verify and commit**

Run: `grep -n "Diagnostic Logging\|log-usage\|[Aa]nnounce\|[Pp]rint.*terminal" chester-finish/SKILL.md`
Expected: zero matches.

```bash
git add chester-finish/SKILL.md
git commit -m "chore: remove reporting and debug from finish"
```

---

### Task 8: Clean chester-plan-attack/SKILL.md

**Files:**
- Modify: `chester-plan-attack/SKILL.md`

- [ ] **Step 1: Remove /report progress visibility lines**

Delete line 45: The `**Progress visibility:**` paragraph about dispatching six agents.

Delete lines 301: The `**Progress visibility:**` paragraph about reporting completions.

- [ ] **Step 2: Remove "print raw findings" directives**

Delete lines 303-304: `**Before synthesis:** Print each agent's raw findings to the terminal. This preserves all evidence if the Structured Thinking MCP fails during synthesis.`

In the Fallback section (around line 331), change the last sentence from:
`Raw findings have already been printed to the terminal.`
to remove that sentence entirely.

- [ ] **Step 3: Remove "output to terminal" in step 3.1**

Delete the step `#### Step 3.1` and `Output the threat report to the terminal to the user` (lines 377-378).

- [ ] **Step 4: Verify and commit**

Run: `grep -n "/report\|[Pp]rint.*terminal\|[Pp]rint.*findings" chester-plan-attack/SKILL.md`
Expected: zero matches.

```bash
git add chester-plan-attack/SKILL.md
git commit -m "chore: remove reporting from plan-attack"
```

---

### Task 9: Clean chester-plan-smell/SKILL.md

**Files:**
- Modify: `chester-plan-smell/SKILL.md`

- [ ] **Step 1: Remove /report progress visibility lines**

Delete line 60: The `**Progress visibility:**` paragraph about dispatching four agents.

Delete line 257: The `**Progress visibility:**` paragraph about reporting completions.

- [ ] **Step 2: Remove "print raw findings" directives**

Delete lines 259-260: `**Before synthesis:** Print each agent's raw findings to the terminal. This preserves all evidence if the Structured Thinking MCP fails during synthesis.`

In the Fallback section (around line 288), change the last sentence from:
`Raw findings have already been printed to the terminal.`
to remove that sentence entirely.

- [ ] **Step 3: Verify and commit**

Run: `grep -n "/report\|[Pp]rint.*terminal\|[Pp]rint.*findings" chester-plan-smell/SKILL.md`
Expected: zero matches.

```bash
git add chester-plan-smell/SKILL.md
git commit -m "chore: remove reporting from plan-smell"
```

---

### Task 10: Clean chester-util-dispatch/SKILL.md

**Files:**
- Modify: `chester-util-dispatch/SKILL.md`

- [ ] **Step 1: Remove the Progress Visibility section**

Delete lines 126-138, from `## Progress Visibility for Dispatched Agents` through `**Do NOT include \`## Progress Reporting\` blocks in agent prompts.**...`

- [ ] **Step 2: Verify and commit**

Run: `grep -n "/report\|Progress Visibility\|Progress Reporting" chester-util-dispatch/SKILL.md`
Expected: zero matches.

```bash
git add chester-util-dispatch/SKILL.md
git commit -m "chore: remove progress visibility from dispatch"
```

---

### Task 11: Clean chester-util-worktree/SKILL.md

**Files:**
- Modify: `chester-util-worktree/SKILL.md`

- [ ] **Step 1: Remove the announcement**

Delete line 14: `**Announce at start:** "I'm using the chester-util-worktree skill to set up an isolated workspace."`

- [ ] **Step 2: Remove the readiness status block**

In section "5. Report Location", delete the formatted output block (lines 138-142):
```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

Change the section to just say: `### 5. Verify Baseline` and keep only the test running logic without the prescriptive output format.

- [ ] **Step 3: Remove the example output**

In the Example Workflow section, remove the formatted output block (lines 189-192):
```
Worktree ready at /Users/jesse/myproject/.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

Also remove the `You: I'm using the chester-util-worktree skill to set up an isolated workspace.` line from the example (line 181).

- [ ] **Step 4: Verify and commit**

Run: `grep -n "[Aa]nnounce\|Worktree ready at\|Ready to implement" chester-util-worktree/SKILL.md`
Expected: zero matches.

```bash
git add chester-util-worktree/SKILL.md
git commit -m "chore: remove reporting from worktree"
```

---

### Task 12: Clean chester-finish-write-session-summary/SKILL.md and chester-finish-write-reasoning-audit/SKILL.md

**Files:**
- Modify: `chester-finish-write-session-summary/SKILL.md`
- Modify: `chester-finish-write-reasoning-audit/SKILL.md`

- [ ] **Step 1: Remove "print to terminal" from session summary**

Delete line 122: `After writing the summary to disk, print the full document content to the terminal so the user can read it without opening the file.`

- [ ] **Step 2: Remove "print to terminal" from reasoning audit**

Delete line 137: `After writing the reasoning audit to disk, print the full document content to the terminal so the user can read it without opening the file.`

- [ ] **Step 3: Verify and commit**

Run: `grep -n "[Pp]rint.*terminal" chester-finish-write-session-summary/SKILL.md chester-finish-write-reasoning-audit/SKILL.md`
Expected: zero matches.

```bash
git add chester-finish-write-session-summary/SKILL.md chester-finish-write-reasoning-audit/SKILL.md
git commit -m "chore: remove print-to-terminal from summary and audit skills"
```

---

### Task 13: Final Verification

**Files:**
- All modified files (read-only verification)

- [ ] **Step 1: Global grep for removed patterns**

```bash
grep -rn "Diagnostic Logging\|chester-log-usage\|chester-debug\|chester-setup-start-debug" chester-*/SKILL.md
grep -rn "/report" chester-*/SKILL.md
grep -rn "[Pp]rint.*terminal\|[Pp]rint.*findings" chester-*/SKILL.md
grep -rn "Announce.*skill\|announce.*skill" chester-*/SKILL.md
```

Expected: `/report` appears ONLY in the available skills list entry for the report skill. All other patterns return zero matches.

- [ ] **Step 2: Verify deleted files are gone**

```bash
ls chester-setup-start-debug/ 2>/dev/null && echo "FAIL: directory still exists" || echo "PASS"
ls ~/.claude/chester-log-usage.sh 2>/dev/null && echo "FAIL: script still exists" || echo "PASS"
ls tests/test-debug-flag.sh tests/test-log-usage-script.sh 2>/dev/null && echo "FAIL: test files still exist" || echo "PASS"
```

- [ ] **Step 3: Verify no broken cross-references**

Check that no skill references `chester-setup-start-debug` or `chester-log-usage`:
```bash
grep -rn "chester-setup-start-debug\|chester-log-usage" chester-*/SKILL.md
```
Expected: zero matches.

- [ ] **Step 4: Final commit if any cleanup needed**

If any issues found in verification, fix and commit. Otherwise, no action needed.
