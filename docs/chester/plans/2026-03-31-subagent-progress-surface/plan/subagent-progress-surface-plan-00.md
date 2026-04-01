# Subagent Progress Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make subagent dispatch and completion visible on the main conversation screen by having the orchestrator print status lines at dispatch/return boundaries.

**Architecture:** All changes are prompt/instruction edits in existing skill files and subagent templates. The orchestrator prints `Dispatched:` and `Completed:` lines around every Agent tool call. Existing `## Progress Reporting` blocks in subagent prompts are removed since agents ignore them and the mechanism is now orchestrator-side.

**Tech Stack:** Markdown skill files (SKILL.md, implementer.md, spec-reviewer.md, quality-reviewer.md)

---

### Task 1: Add dispatch/completion lines to chester-write-code

**Files:**
- Modify: `chester-write-code/SKILL.md`

This task adds orchestrator print instructions around the three dispatch points in Section 2.1.

- [ ] **Step 1: Add dispatch/completion instructions to implementer dispatch (Section 2.1, step 1)**

In Section 2.1 step 1, after "Record BASE_SHA before dispatch", add instruction for the orchestrator to print a dispatch line before calling the Agent tool, and a completion line after reading the agent's status.

Add this text after the existing step 1 content:

```markdown
   **Progress visibility:** Before dispatching, print to the conversation:
   `Dispatched: Implementer:Task N-{short description of what this task implements}`
   After reading the implementer's report, print:
   `Completed: Implementer:Task N-{one-line summary from status code and key finding}`
```

- [ ] **Step 2: Add dispatch/completion instructions to spec reviewer dispatch (Section 2.1, step 3)**

Add after the existing step 3 content:

```markdown
   **Progress visibility:** Before dispatching, print:
   `Dispatched: Spec Review:Task N-checking implementation matches requirements`
   After reading the reviewer's verdict, print:
   `Completed: Spec Review:Task N-{Pass/Fail and one-line summary}`
```

- [ ] **Step 3: Add dispatch/completion instructions to quality reviewer dispatch (Section 2.1, step 4)**

Add after the existing step 4 content:

```markdown
   **Progress visibility:** Before dispatching, print:
   `Dispatched: Quality Review:Task N-reviewing code quality`
   After reading the reviewer's verdict, print:
   `Completed: Quality Review:Task N-{verdict and key finding count}`
```

- [ ] **Step 4: Verify the edits read naturally**

Read back the modified Section 2.1 and confirm the new instructions integrate cleanly with the existing flow.

- [ ] **Step 5: Commit**

```bash
git add chester-write-code/SKILL.md
git commit -m "feat: add orchestrator progress lines to write-code dispatches"
```

---

### Task 2: Remove Progress Reporting blocks from write-code subagent templates

**Files:**
- Modify: `chester-write-code/implementer.md`
- Modify: `chester-write-code/spec-reviewer.md`
- Modify: `chester-write-code/quality-reviewer.md`

Remove the `## Progress Reporting` blocks from each template. These are dead weight — agents ignore them, and progress is now orchestrator-side.

- [ ] **Step 1: Remove Progress Reporting from implementer.md**

Remove lines 13-17 (the `## Progress Reporting` section including the blank line after it):
```
    ## Progress Reporting
    Emit a short status line at each major phase. Format: Implementer Task N:{label}-{one sentence}
    Replace N with the task number from the task description.
    Your phases: Reading, Writing tests, Implementing, Testing, Self-reviewing, Committing
    Emit one line per phase transition. No additional analysis — just announce what you're doing.
```

- [ ] **Step 2: Remove Progress Reporting from spec-reviewer.md**

Remove lines 17-20 (the `## Progress Reporting` section):
```
    ## Progress Reporting
    Emit a short status line at each major phase. Format: Spec Review:{label}-{one sentence}
    Your phases: Reading, Diffing, Comparing, Reporting
    Emit one line per phase transition. No additional analysis — just announce what you're doing.
```

- [ ] **Step 3: Remove Progress Reporting from quality-reviewer.md**

Remove the entire Progress Reporting block (lines 20-26):
```
**Progress Reporting — include in the dispatch prompt:**
\`\`\`
    ## Progress Reporting
    Emit a short status line at each major phase. Format: Quality Review:{label}-{one sentence}
    Your phases: Reading, Analyzing, Reporting
    Emit one line per phase transition. No additional analysis — just announce what you're doing.
\`\`\`
```

- [ ] **Step 4: Verify templates still read correctly**

Read each modified template and confirm the removal doesn't break document flow.

- [ ] **Step 5: Commit**

```bash
git add chester-write-code/implementer.md chester-write-code/spec-reviewer.md chester-write-code/quality-reviewer.md
git commit -m "feat: remove dead progress reporting blocks from write-code templates"
```

---

### Task 3: Add dispatch/completion lines to chester-attack-plan and remove inline Progress Reporting

**Files:**
- Modify: `chester-attack-plan/SKILL.md`

The attack-plan skill launches 6 agents in parallel. Add orchestrator print instructions before and after the parallel dispatch, and remove the 6 inline `## Progress Reporting` blocks from agent prompts.

- [ ] **Step 1: Add orchestrator dispatch lines before Step 2's parallel launch**

Before the "Launch all six agents" instruction, add:

```markdown
**Progress visibility:** Before launching the six agents, print all dispatch lines:
```
Dispatched: Structural:plan review-verifying file paths, dependencies, and internal consistency
Dispatched: Execution:plan review-analyzing blast radius, ordering, and reversibility
Dispatched: Assumptions:plan review-probing unstated assumptions and edge cases
Dispatched: Migration:plan review-tracing call sites and migration completeness
Dispatched: API Surface:plan review-checking contract changes and caller impact
Dispatched: Concurrency:plan review-analyzing thread safety and async hazards
```
```

- [ ] **Step 2: Add orchestrator completion lines after agents return**

In Step 3 ("Synthesize the threat report"), before "Print each agent's raw findings", add:

```markdown
**Progress visibility:** As each agent's results are processed, print a completion line:
`Completed: {agent name}:{plan review}-{one-line summary of findings or "no issues found"}`
Print all six completion lines before proceeding to synthesis.
```

- [ ] **Step 3: Remove 6 inline Progress Reporting blocks from agent prompts**

Remove the `## Progress Reporting` block (3-4 lines each) from each of the six agent prompts:
- Agent 1 (Structural): lines 58-61
- Agent 2 (Execution): lines 100-103
- Agent 3 (Assumptions): lines 141-144
- Agent 4 (Migration): lines 184-187
- Agent 5 (API Surface): lines 232-235
- Agent 6 (Concurrency): lines 283-286

Each block follows the same pattern:
```
> ## Progress Reporting
> Emit a short status line at each major phase. Format: {Role}:{label}-{one sentence}
> Your phases: {phases}
> Emit one line per phase transition. No additional analysis — just announce what you're doing.
```

- [ ] **Step 4: Verify document flow**

Read the modified SKILL.md and confirm agent prompts still flow correctly after removal.

- [ ] **Step 5: Commit**

```bash
git add chester-attack-plan/SKILL.md
git commit -m "feat: add orchestrator progress lines to attack-plan, remove dead agent blocks"
```

---

### Task 4: Add dispatch/completion lines to chester-smell-code and remove inline Progress Reporting

**Files:**
- Modify: `chester-smell-code/SKILL.md`

Same pattern as Task 3 but for 4 agents.

- [ ] **Step 1: Add orchestrator dispatch lines before Step 2's parallel launch**

Before the "Launch all four agents" instruction, add:

```markdown
**Progress visibility:** Before launching the four agents, print all dispatch lines:
```
Dispatched: Bloaters:plan review-scanning for bloater and dispensable smells
Dispatched: Couplers:plan review-scanning for coupler and OO abuser smells
Dispatched: Preventers:plan review-scanning for change preventer smells
Dispatched: SOLID:plan review-scanning for SOLID violations
```
```

- [ ] **Step 2: Add orchestrator completion lines after agents return**

In Step 3 ("Synthesize the smell report"), before "Print each agent's raw findings", add:

```markdown
**Progress visibility:** As each agent's results are processed, print a completion line:
`Completed: {agent name}:{plan review}-{one-line summary of findings or "no issues found"}`
Print all four completion lines before proceeding to synthesis.
```

- [ ] **Step 3: Remove 4 inline Progress Reporting blocks from agent prompts**

Remove the `## Progress Reporting` block from each of the four agent prompts:
- Agent 1 (Bloaters): lines 75-78
- Agent 2 (Couplers): lines 129-132
- Agent 3 (Preventers): lines 184-187
- Agent 4 (SOLID): lines 230-233

- [ ] **Step 4: Verify document flow**

Read the modified SKILL.md and confirm agent prompts still flow correctly.

- [ ] **Step 5: Commit**

```bash
git add chester-smell-code/SKILL.md
git commit -m "feat: add orchestrator progress lines to smell-code, remove dead agent blocks"
```

---

### Task 5: Update chester-dispatch-agents guidance and chester-build-spec

**Files:**
- Modify: `chester-dispatch-agents/SKILL.md`
- Modify: `chester-build-spec/SKILL.md`

- [ ] **Step 1: Replace Progress Reporting guidance in dispatch-agents**

Replace the `## Progress Reporting in Dispatched Agents` section (lines 126-144) with orchestrator-side guidance:

```markdown
## Progress Visibility for Dispatched Agents

When dispatching agents, the **orchestrator** (not the agent) prints progress lines to the main conversation screen:

**Before dispatching each agent**, print:
`Dispatched: {agent role}:{task}-{short description}`

**After each agent returns**, print:
`Completed: {agent role}:{task}-{one-line summary of result}`

For parallel dispatches, print all dispatch lines before launching, then print completion lines as agents return.

The orchestrator extracts the completion summary from the agent's report using judgment — there is no rigid extraction rule.

**Do NOT include `## Progress Reporting` blocks in agent prompts.** Agents ignore soft formatting instructions under cognitive load. Progress visibility is the orchestrator's responsibility.
```

- [ ] **Step 2: Add dispatch/completion lines to chester-build-spec**

In the "Automated Spec Review Loop" section, after "Dispatch spec-document-reviewer subagent", add:

```markdown
   **Progress visibility:** Before dispatching, print:
   `Dispatched: Spec Reviewer:spec review-checking completeness, consistency, and YAGNI`
   After reading the reviewer's report, print:
   `Completed: Spec Reviewer:spec review-{Approved/Issues Found and summary}`
```

- [ ] **Step 3: Remove Progress Reporting from build-spec's spec-reviewer.md**

Remove lines 16-19 from `chester-build-spec/spec-reviewer.md`:
```
    ## Progress Reporting
    Emit a short status line at each major phase. Format: Spec Review:{label}-{one sentence}
    Your phases: Reading, Checking, Reporting
    Emit one line per phase transition. No additional analysis — just announce what you're doing.
```

- [ ] **Step 4: Verify both files read correctly**

Read the modified sections and confirm clean integration.

- [ ] **Step 5: Commit**

```bash
git add chester-dispatch-agents/SKILL.md chester-build-spec/SKILL.md chester-build-spec/spec-reviewer.md
git commit -m "feat: add orchestrator progress lines to dispatch-agents and build-spec"
```
