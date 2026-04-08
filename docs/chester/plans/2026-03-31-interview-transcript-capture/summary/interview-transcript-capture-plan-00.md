# Interview Transcript Capture & Subagent Progress Visibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Chester's internal processes visible — capture interview dialogue as a transcript artifact, and add progress reporting to all long-running subagents.

**Architecture:** All changes are prompt/behavioral modifications to existing SKILL.md files and companion prompt templates. No new files, scripts, or infrastructure.

**Tech Stack:** Markdown, Chester skill system

---

### Task 1: Add Interview Transcript Capture to chester-figure-out

**Files:**
- Modify: `chester-figure-out/SKILL.md`

This task adds three things to the figure-out skill: (a) transcript creation at Phase 3 entry, (b) per-turn append instructions, and (c) transcript handling at Phase 4 closure.

- [ ] **Step 1: Add transcript section to Phase 3**

In `chester-figure-out/SKILL.md`, insert a new subsection `### Interview Transcript` between the `## Phase 3: Socratic Interview` header (line 129) and `### Six Question Types` (line 133). Insert after line 131 (`The agent is an interviewer...`):

```markdown
### Interview Transcript

Capture the interview as a readable transcript, appended incrementally.

**At Phase 3 entry** (after problem statement is confirmed):
1. Create the transcript file at `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-interview-00.md` with this header:

   ```markdown
   # Interview Transcript — {Sprint Name}

   **Date:** {YYYY-MM-DD}
   **Sprint:** {sprint-NNN-slug}

   ---
   ```

2. Append the confirmed problem statement as the first entry (bold text).

**After each interview turn:**
1. Append your stream-of-consciousness thinking (italic lines) and question (bold) to the transcript
2. After receiving the user's response, append it as a blockquote (`> response text`)
3. Append a horizontal rule (`---`) to separate exchanges

**At checkpoints** (every 4-6 questions):
- Append a checkpoint marker: `### Checkpoint — {N} questions`

**Content to capture:** Only interview interactions — thinking, questions, user responses.
**Content to exclude:** Tool calls, MCP outputs, task management, budget guard checks.

**Formatting:**
- *Italic lines* — agent stream-of-consciousness thinking
- **Bold text** — agent questions
- `> Blockquote` — user responses
- `---` — exchange separator
```

- [ ] **Step 2: Add transcript to Phase 4 closure artifact list**

In `chester-figure-out/SKILL.md`, in Phase 4 (line 188+), add transcript handling after step 13 (copy design brief to working dir) and before step 14 (commit). Insert as new steps 14 and 15, renumbering subsequent steps:

```markdown
14. Copy transcript from `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-interview-00.md` to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/{sprint-name}-interview-00.md` (worktree)
15. Include transcript in the commit alongside thinking summary and design brief
```

- [ ] **Step 3: Update File Naming Convention section**

In the "File Naming Convention" section (line 230), add the transcript to the list of artifacts this skill writes:

```markdown
- `{sprint-name}-interview-00.md` — the interview transcript (dialogue)
```

Add after the existing two entries (`design-00.md` and `thinking-00.md`).

- [ ] **Step 4: Verify the edit**

Run: `grep -n "Interview Transcript\|interview-00" chester-figure-out/SKILL.md`
Expected: Multiple matches showing the new section header and file references.

- [ ] **Step 5: Commit**

```bash
git add chester-figure-out/SKILL.md
git commit -m "feat: add interview transcript capture to figure-out skill"
```

---

### Task 2: Add Progress Reporting to chester-attack-plan

**Files:**
- Modify: `chester-attack-plan/SKILL.md`

Add a progress reporting instruction block to each of the 6 agent prompts. Insert the block immediately after the `---` delimiter in each agent's prompt (before the analysis instructions).

- [ ] **Step 1: Add progress reporting to all 6 agent prompts**

For each agent prompt, insert the following block immediately after the `> ---` line and before the `> Analyze the plan above...` line:

**Agent 1 — Structural Integrity** (after line 56):
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: Structural:{label}-{one sentence}
> Your phases: Reading, Verifying, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

**Agent 2 — Execution Risk** (after the `---` in its prompt):
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: Execution:{label}-{one sentence}
> Your phases: Reading, Analyzing, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

**Agent 3 — Assumptions & Edge Cases** (after the `---` in its prompt):
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: Assumptions:{label}-{one sentence}
> Your phases: Reading, Probing, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

**Agent 4 — Migration Completeness** (after the `---` in its prompt):
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: Migration:{label}-{one sentence}
> Your phases: Reading, Tracing, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

**Agent 5 — API Surface Compatibility** (after the `---` in its prompt):
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: API Surface:{label}-{one sentence}
> Your phases: Reading, Checking, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

**Agent 6 — Concurrency & Thread Safety** (after the `---` in its prompt):
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: Concurrency:{label}-{one sentence}
> Your phases: Reading, Analyzing, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

- [ ] **Step 2: Verify the edits**

Run: `grep -c "Progress Reporting" chester-attack-plan/SKILL.md`
Expected: `6`

- [ ] **Step 3: Commit**

```bash
git add chester-attack-plan/SKILL.md
git commit -m "feat: add progress reporting to attack-plan agents"
```

---

### Task 3: Add Progress Reporting to chester-smell-code

**Files:**
- Modify: `chester-smell-code/SKILL.md`

Same pattern as Task 2 — add progress reporting block to each of the 4 agent prompts, after the `---` delimiter.

- [ ] **Step 1: Add progress reporting to all 4 agent prompts**

**Agent 1 — Bloaters & Dispensables:**
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: Bloaters:{label}-{one sentence}
> Your phases: Reading, Scanning, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

**Agent 2 — Couplers & OO Abusers:**
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: Couplers:{label}-{one sentence}
> Your phases: Reading, Scanning, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

**Agent 3 — Change Preventers:**
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: Preventers:{label}-{one sentence}
> Your phases: Reading, Scanning, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

**Agent 4 — SOLID Violations:**
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: SOLID:{label}-{one sentence}
> Your phases: Reading, Scanning, Reporting
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
>
```

- [ ] **Step 2: Verify the edits**

Run: `grep -c "Progress Reporting" chester-smell-code/SKILL.md`
Expected: `4`

- [ ] **Step 3: Commit**

```bash
git add chester-smell-code/SKILL.md
git commit -m "feat: add progress reporting to smell-code agents"
```

---

### Task 4: Add Progress Reporting to chester-write-code Agents

**Files:**
- Modify: `chester-write-code/implementer.md`
- Modify: `chester-write-code/spec-reviewer.md`
- Modify: `chester-write-code/quality-reviewer.md`

- [ ] **Step 1: Add progress reporting to implementer.md**

Insert after the `---` line (line 11) and before `Implement the task described above.` (line 13):

```markdown
    ## Progress Reporting
    Emit a short status line at each major phase. Format: Implementer Task N:{label}-{one sentence}
    Replace N with the task number from the task description.
    Your phases: Reading, Writing tests, Implementing, Testing, Self-reviewing, Committing
    Emit one line per phase transition. No additional analysis — just announce what you're doing.

```

- [ ] **Step 2: Add progress reporting to spec-reviewer.md**

Insert after the `---` delimiter in the prompt template, before the review instructions:

```markdown
    ## Progress Reporting
    Emit a short status line at each major phase. Format: Spec Review:{label}-{one sentence}
    Your phases: Reading, Diffing, Comparing, Reporting
    Emit one line per phase transition. No additional analysis — just announce what you're doing.

```

- [ ] **Step 3: Add progress reporting to quality-reviewer.md**

Insert a progress reporting section:

```markdown
    ## Progress Reporting
    Emit a short status line at each major phase. Format: Quality Review:{label}-{one sentence}
    Your phases: Reading, Analyzing, Reporting
    Emit one line per phase transition. No additional analysis — just announce what you're doing.

```

- [ ] **Step 4: Verify the edits**

Run: `grep -l "Progress Reporting" chester-write-code/*.md`
Expected: `implementer.md`, `spec-reviewer.md`, `quality-reviewer.md`

- [ ] **Step 5: Commit**

```bash
git add chester-write-code/implementer.md chester-write-code/spec-reviewer.md chester-write-code/quality-reviewer.md
git commit -m "feat: add progress reporting to write-code agents"
```

---

### Task 5: Add Progress Reporting to chester-build-spec Reviewer

**Files:**
- Modify: `chester-build-spec/spec-reviewer.md`

- [ ] **Step 1: Add progress reporting to spec-reviewer prompt**

Insert after the `You are a spec document reviewer.` line, before the `## What to Check` section:

```markdown
    ## Progress Reporting
    Emit a short status line at each major phase. Format: Spec Review:{label}-{one sentence}
    Your phases: Reading, Checking, Reporting
    Emit one line per phase transition. No additional analysis — just announce what you're doing.

```

- [ ] **Step 2: Verify the edit**

Run: `grep -c "Progress Reporting" chester-build-spec/spec-reviewer.md`
Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add chester-build-spec/spec-reviewer.md
git commit -m "feat: add progress reporting to build-spec reviewer"
```

---

### Task 6: Add Progress Reporting Guidance to chester-dispatch-agents

**Files:**
- Modify: `chester-dispatch-agents/SKILL.md`

- [ ] **Step 1: Add progress reporting section**

Add a new section to the skill, after the existing guidance on constructing agent prompts. Title it `## Progress Reporting in Dispatched Agents`:

```markdown
## Progress Reporting in Dispatched Agents

When constructing subagent prompts, include a progress reporting block so the user can monitor agent activity and interrupt if needed.

**Template to include in each agent prompt:**

```
## Progress Reporting
Emit a short status line at each major phase. Format: {who}:{label}-{one sentence}
Your phases: {comma-separated list of phase labels}
Emit one line per phase transition. No additional analysis — just announce what you're doing.
```

**Choosing values:**
- **{who}** — the agent's role name, short and recognizable (e.g., "Auth", "Parser", "Migration")
- **{label}** — fixed phase label, identical every run (e.g., "Reading", "Implementing", "Testing")
- **{freetext}** — one sentence describing the specific context

**Constraint:** Reports must require zero additional analysis — they announce what the agent is already doing, nothing more.
```

- [ ] **Step 2: Verify the edit**

Run: `grep -c "Progress Reporting" chester-dispatch-agents/SKILL.md`
Expected: At least `1`

- [ ] **Step 3: Commit**

```bash
git add chester-dispatch-agents/SKILL.md
git commit -m "feat: add progress reporting guidance to dispatch-agents skill"
```
