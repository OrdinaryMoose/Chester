# Reviewer Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the per-task spec compliance reviewer and code quality reviewer in chester-write-code into a single combined reviewer subagent, reducing subagent launches from 3 to 2 per task.

**Architecture:** The combined reviewer template replaces two separate templates. It runs spec compliance first, then code quality, in a single subagent pass. The SKILL.md dispatch pattern merges steps 3 and 4 into one step and renumbers downstream steps.

**Tech Stack:** Markdown prompt templates, Chester skill framework

---

### Task 1: Create the Combined Reviewer Template

**Files:**
- Create: `chester-write-code/combined-reviewer.md`
- Reference (read-only): `chester-write-code/spec-reviewer.md` (source for Phase 1 content)
- Reference (read-only): `chester-write-code/quality-reviewer.md` (source for Phase 2 content)
- Reference (read-only): `chester-write-code/code-reviewer.md` (source for quality checklist)

- [ ] **Step 1: Read the existing spec-reviewer.md and quality-reviewer.md templates**

Read both files to understand the full content that must be preserved in the combined template.

- [ ] **Step 2: Read code-reviewer.md for the quality checklist**

The quality-reviewer.md delegates to the code-reviewer.md template for its checklist. Read it to understand what quality checks must be included.

- [ ] **Step 3: Write the combined-reviewer.md template**

Create `chester-write-code/combined-reviewer.md` with this structure:

```markdown
# Combined Reviewer Prompt Template

Use this template when dispatching the per-task reviewer subagent.

**Purpose:** Verify implementer built what was requested (spec compliance) AND built it well (code quality), in a single pass.

**Dispatch after:** Implementer reports DONE or DONE_WITH_CONCERNS.

~~~
Task tool (general-purpose):
  description: "Review Task N: [task name]"
  prompt: |
    You are reviewing an implementation for both spec compliance and code quality.

    ## What Was Requested

    [FULL TEXT of task requirements]

    ## What Implementer Claims They Built

    [From implementer's report]

    ## Git Range

    **Base:** [BASE_SHA]
    **Head:** [HEAD_SHA]

    ```bash
    git diff --stat [BASE_SHA]..[HEAD_SHA]
    git diff [BASE_SHA]..[HEAD_SHA]
    ```

    ## CRITICAL: Do Not Trust the Report

    The implementer's report may be incomplete, inaccurate, or optimistic.
    You MUST verify everything independently by reading the actual code.

    **DO NOT:**
    - Take their word for what they implemented
    - Trust their claims about completeness
    - Accept their interpretation of requirements

    **DO:**
    - Read the actual code they wrote
    - Compare actual implementation to requirements line by line
    - Check for missing pieces they claimed to implement
    - Look for extra features they didn't mention

    ---

    ## Phase 1: Spec Compliance

    **Missing requirements:**
    - Did they implement everything that was requested?
    - Are there requirements they skipped or missed?
    - Did they claim something works but didn't actually implement it?

    **Extra/unneeded work:**
    - Did they build things that weren't requested?
    - Did they over-engineer or add unnecessary features?

    **Misunderstandings:**
    - Did they interpret requirements differently than intended?
    - Did they solve the wrong problem?

    **Commit verification:**
    Run `git diff [BASE_SHA]..[HEAD_SHA] --stat` to see what files are actually
    in the commit(s). Run `git status` to check for uncommitted changes.
    - Compare committed files against the implementer's claimed file list
    - If files are claimed but not committed, report as a Commit issue
    - If `git status` shows uncommitted changes related to the task, report as a Commit issue

    ---

    ## Phase 2: Code Quality

    **Code Quality:**
    - Clean separation of concerns?
    - Proper error handling?
    - Type safety (if applicable)?
    - DRY principle followed?
    - Edge cases handled?
    - Does each file have one clear responsibility with a well-defined interface?
    - Are units decomposed so they can be understood and tested independently?
    - Is the implementation following the file structure from the plan?

    **Architecture:**
    - Sound design decisions?
    - Scalability considerations?
    - Performance implications?
    - Security concerns?

    **Testing:**
    - Tests actually test logic (not mocks)?
    - Edge cases covered?
    - Integration tests where needed?
    - All tests passing?

    ---

    ## Output Format

    ## Spec Compliance

    **Status:** Pass | Fail

    **Missing requirements:** [list, or "None"]
    **Extra/unneeded work:** [list, or "None"]
    **Misunderstandings:** [list, or "None"]
    **Commit issues:** [list, or "None"]

    ## Code Quality

    ### Strengths
    [What's well done — be specific with file:line references]

    ### Issues

    #### Critical (Must Fix)
    [Bugs, security issues, data loss risks, broken functionality]

    #### Important (Should Fix)
    [Architecture problems, missing features, poor error handling, test gaps]

    #### Minor (Nice to Have)
    [Code style, optimization opportunities, documentation improvements]

    **For each issue:**
    - File:line reference
    - What's wrong
    - Why it matters
    - How to fix (if not obvious)

    ### Assessment

    **Spec compliant:** [Yes/No]
    **Ready to proceed:** [Yes / No / With fixes]
    **Reasoning:** [1-2 sentences]

    ## Critical Rules

    **DO:**
    - Complete BOTH phases — do not skip either one
    - Categorize quality issues by actual severity
    - Be specific (file:line, not vague)
    - Verify by reading code, not by trusting the report
    - Give clear verdicts for both phases

    **DON'T:**
    - Say "looks good" without checking
    - Mark nitpicks as Critical
    - Skip Phase 1 because Phase 2 is more interesting
    - Skip Phase 2 because Phase 1 found issues
    - Avoid giving a clear verdict
~~~

**Reviewer returns:** Spec compliance status + code quality issues + combined assessment
```

- [ ] **Step 4: Verify the template is complete**

Confirm the combined template covers:
- All spec compliance checks from spec-reviewer.md (missing requirements, extra work, misunderstandings, commit verification)
- All code quality checks from quality-reviewer.md / code-reviewer.md (quality, architecture, testing checklists)
- Output format with distinct sections so the orchestrator can parse by concern type
- The "do not trust the report" framing from spec-reviewer.md

- [ ] **Step 5: Commit**

```bash
git add chester-write-code/combined-reviewer.md
git commit -m "feat: add combined reviewer template"
```

---

### Task 2: Update SKILL.md Dispatch Pattern

**Files:**
- Modify: `chester-write-code/SKILL.md` (Section 2.1 steps 3-6, Section 2.4 diagnostic logging)

- [ ] **Step 1: Read current SKILL.md Section 2.1**

Read `chester-write-code/SKILL.md` lines 76-122 to confirm the exact text of steps 3-6 that need modification.

- [ ] **Step 2: Replace steps 3-4 with a single combined reviewer step**

In Section 2.1 "Dispatch Pattern", replace:

```markdown
3. **Dispatch spec compliance reviewer** using the template at `chester-write-code/spec-reviewer.md`
   - Provide the full task requirements AND the implementer's report
   - Include BASE_SHA and HEAD_SHA for commit verification
   - If reviewer finds issues: fix them (re-dispatch implementer or fix inline) and re-review

4. **Dispatch code quality reviewer** using the template at `chester-write-code/quality-reviewer.md`
   - Only dispatch after spec compliance passes
   - Handle severity-based results:
     - **Critical:** Must fix before proceeding
     - **Important:** Should fix; use judgment on whether to fix now or defer
     - **Minor:** Note and move on
```

With:

```markdown
3. **Dispatch combined reviewer** using the template at `chester-write-code/combined-reviewer.md`
   - Provide the full task requirements AND the implementer's report
   - Include BASE_SHA and HEAD_SHA for commit verification
   - If spec compliance fails: fix issues (re-dispatch implementer or fix inline) and re-review
   - Handle code quality severity-based results:
     - **Critical:** Must fix before proceeding
     - **Important:** Should fix; use judgment on whether to fix now or defer
     - **Minor:** Note and move on
```

- [ ] **Step 3: Renumber steps 5-6 to 4-5**

Change:
- Step 5 ("Record HEAD_SHA") → Step 4
- Step 6 ("Update TodoWrite") → Step 5

- [ ] **Step 4: Update the Section 2.1 intro text**

Change line 76 from:
```
This is the recommended execution mode. Each task is dispatched to a fresh subagent, then reviewed in two stages.
```
To:
```
This is the recommended execution mode. Each task is dispatched to a fresh subagent, then reviewed.
```

- [ ] **Step 5: Update Section 2.4 diagnostic logging**

In Section 2.4, replace the six logging commands (before/after for implementer, spec-review, quality-review) with four (before/after for implementer, combined-review):

Replace:
```bash
# Before spec review
~/.claude/chester-log-usage.sh before "write-code" "task-{N} spec-review" "$LOG"
# ... dispatch spec reviewer ...
~/.claude/chester-log-usage.sh after "write-code" "task-{N} spec-review" "$LOG"

# Before quality review
~/.claude/chester-log-usage.sh before "write-code" "task-{N} quality-review" "$LOG"
# ... dispatch quality reviewer ...
~/.claude/chester-log-usage.sh after "write-code" "task-{N} quality-review" "$LOG"
```

With:
```bash
# Before combined review
~/.claude/chester-log-usage.sh before "write-code" "task-{N} combined-review" "$LOG"
# ... dispatch combined reviewer ...
~/.claude/chester-log-usage.sh after "write-code" "task-{N} combined-review" "$LOG"
```

- [ ] **Step 6: Update Section 4.2 reference**

In Section 4.2 "Dispatch Code Reviewer", verify the reference to `chester-write-code/code-reviewer.md` is unchanged. This is the end-of-plan full review, not the per-task reviewer — it should NOT reference combined-reviewer.md.

- [ ] **Step 7: Run git diff to verify changes**

```bash
git diff chester-write-code/SKILL.md
```

Verify only the targeted sections changed.

- [ ] **Step 8: Commit**

```bash
git add chester-write-code/SKILL.md
git commit -m "refactor: merge per-task reviewers into single dispatch step"
```

---

### Task 3: Remove Old Reviewer Templates

**Files:**
- Delete: `chester-write-code/spec-reviewer.md`
- Delete: `chester-write-code/quality-reviewer.md`

- [ ] **Step 1: Verify combined-reviewer.md exists and is committed**

```bash
git log --oneline -1 -- chester-write-code/combined-reviewer.md
```

Confirm the combined template was committed in Task 1.

- [ ] **Step 2: Delete the old templates**

```bash
git rm chester-write-code/spec-reviewer.md
git rm chester-write-code/quality-reviewer.md
```

- [ ] **Step 3: Grep for any remaining references to the deleted files**

```bash
grep -r "spec-reviewer.md\|quality-reviewer.md" chester-write-code/
```

Should return no matches (SKILL.md was updated in Task 2 to reference combined-reviewer.md).

- [ ] **Step 4: Commit**

```bash
git add -A chester-write-code/
git commit -m "chore: remove obsolete per-task reviewer templates"
```

---

### Task 4: Verify End-to-End Integrity

**Files:**
- Read-only: `chester-write-code/SKILL.md`
- Read-only: `chester-write-code/combined-reviewer.md`
- Read-only: `chester-write-code/implementer.md`
- Read-only: `chester-write-code/code-reviewer.md`

- [ ] **Step 1: Verify the dispatch pattern reads correctly**

Read `chester-write-code/SKILL.md` Section 2.1 and trace the full per-task flow:
1. Budget guard → 2. Dispatch implementer → 3. Handle status → 4. Dispatch combined reviewer → 5. Record SHA → 6. Update task

Confirm step references are consistent (no dangling "step 4" references that should now be "step 3").

- [ ] **Step 2: Verify no references to deleted files remain**

```bash
grep -r "spec-reviewer\|quality-reviewer" chester-write-code/
```

Should return no matches.

- [ ] **Step 3: Verify the combined reviewer output format matches what SKILL.md expects**

SKILL.md step 3 handles:
- Spec compliance pass/fail → re-dispatch if fail
- Severity-based quality results → Critical/Important/Minor handling

Confirm combined-reviewer.md output format provides both: `Spec Compliance` section with `Status: Pass | Fail` and `Code Quality` section with severity-categorized issues.

- [ ] **Step 4: Verify code-reviewer.md is untouched**

```bash
git diff code-reviewer.md
```

Should show no changes.

- [ ] **Step 5: List final directory contents**

```bash
ls -la chester-write-code/
```

Expected: SKILL.md, implementer.md, combined-reviewer.md, code-reviewer.md (4 files, down from 5).

- [ ] **Step 6: Commit verification results**

No commit needed — this is a read-only verification task. If any issues found, fix them and commit the fix.
