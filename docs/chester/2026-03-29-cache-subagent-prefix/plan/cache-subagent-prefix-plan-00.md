# Cache Subagent Prefix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure all Chester subagent prompts so shared content forms a byte-identical prefix, maximizing Anthropic prompt cache hit rates across subagent invocations.

**Architecture:** Each subagent prompt is restructured to place shared content (plan text or task text) as the literal first bytes, followed by a `---` delimiter, then agent-specific task instructions. Role descriptions are removed entirely; domain scoping moves to directive-style task instructions after the delimiter.

**Tech Stack:** Markdown skill files (SKILL.md, prompt templates). No code, no dependencies.

---

### Task 1: Restructure chester-attack-plan Agent Prompts

**Files:**
- Modify: `chester-attack-plan/SKILL.md:49-298`

This is the largest change and establishes the pattern that smell-code must mirror exactly.

- [ ] **Step 1: Restructure Agent 1 — Structural Integrity (lines 49-85)**

Replace the current prompt block with the new cache-optimal structure. The plan text must be the literal first content — no header, no role, no framing before it.

Current (remove):
```
> You are a structural integrity auditor attacking an implementation plan. Your job is to
> find gaps between what the plan says and what the code actually contains.
>
> The plan to attack:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for structural integrity gaps — mismatches between what the plan
> says and what the code actually contains. Focus on these areas:
>
> 1. Verify every file path, class name, and namespace the plan references actually exists
> 2. Check dependency claims -- does the plan correctly describe which projects reference which?
> 3. Verify "what does NOT change" assertions -- are those areas truly unaffected?
> 4. Find internal contradictions -- does the plan say X in one place and not-X in another?
> 5. Check interface assumptions -- do the interfaces the plan depends on have the signatures it expects?
```

Keep the Rules and Output format sections unchanged — they come after the delimiter and don't affect prefix caching.

- [ ] **Step 2: Restructure Agent 2 — Execution Risk (lines 86-122)**

Current (remove):
```
> You are an execution risk analyst attacking an implementation plan. Your job is to find
> things that will go wrong during implementation -- not design concerns, but practical
> execution hazards.
>
> The plan to attack:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for execution risks — practical hazards that will cause problems
> during implementation, not design concerns. Focus on these areas:
```

Keep attack vectors, Rules, and Output format unchanged.

- [ ] **Step 3: Restructure Agent 3 — Assumptions & Edge Cases (lines 123-160)**

Current (remove):
```
> You are an assumptions analyst attacking an implementation plan. Your job is to surface
> unstated preconditions and unaddressed edge cases that could derail implementation.
>
> The plan to attack:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for unstated assumptions and unaddressed edge cases that could
> derail implementation. Focus on these areas:
```

Keep attack vectors, Rules, and Output format unchanged.

- [ ] **Step 4: Restructure Agent 4 — Migration Completeness (lines 161-203)**

Current (remove):
```
> You are a migration completeness auditor attacking an implementation plan. Your job is to find
> call sites, usages, and references that the plan intends to migrate but fails to explicitly
> address -- leaving the codebase in a partially-migrated, inconsistent state.
>
> The plan to attack:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for migration completeness — find call sites, usages, and references
> the plan intends to migrate but fails to explicitly address, leaving the codebase in a
> partially-migrated state. Focus on these areas:
```

Keep attack vectors, Rules, and Output format unchanged.

- [ ] **Step 5: Restructure Agent 5 — API Surface Compatibility (lines 205-250)**

Current (remove):
```
> You are an API surface compatibility auditor attacking an implementation plan. Your job is to
> find places where the plan changes the public contract of a type or member without acknowledging
> the downstream impact on callers -- including callers outside the files the plan lists.
>
> The plan to attack:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for API surface compatibility issues — find places where the plan
> changes the public contract of a type or member without acknowledging downstream impact
> on callers, including callers outside the files the plan lists. Focus on these areas:
```

Keep attack vectors, Rules, and Output format unchanged.

- [ ] **Step 6: Restructure Agent 6 — Concurrency & Thread Safety (lines 252-298)**

Current (remove):
```
> You are a concurrency and thread safety auditor attacking an implementation plan. Your job is
> to find threading hazards the plan introduces or ignores -- race conditions, async/await
> misuse, shared mutable state, and UI-thread violations.
>
> The plan to attack:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for concurrency and thread safety hazards — race conditions,
> async/await misuse, shared mutable state, and UI-thread violations. Focus on these areas:
```

Keep attack vectors, Rules, and Output format unchanged.

- [ ] **Step 7: Update the Step 2 dispatch instruction (line 45-46)**

Current:
```
Launch all six agents in a single message using the Agent tool. Each agent receives the
full plan text and a specific attack mission.
```

New:
```
Launch all six agents in a single message using the Agent tool. Each agent receives the
full plan text as the first content in the prompt (no header, no framing before it),
followed by a `---` delimiter, then agent-specific analysis instructions.
```

- [ ] **Step 8: Verify no instructions lost**

Run a manual diff review of the changed file. For each agent, verify:
- All original attack vectors are preserved (numbered lists after the delimiter)
- All Rules sections are preserved
- All Output format sections are preserved
- Only the role description and "The plan to attack:" header were removed
- The plan text placeholder `[full plan text]` is the first content in each prompt

- [ ] **Step 9: Commit**

```bash
git add chester-attack-plan/SKILL.md
git commit -m "feat: restructure attack-plan prompts for cache-optimal prefix"
```

---

### Task 2: Restructure chester-smell-code Agent Prompts

**Files:**
- Modify: `chester-smell-code/SKILL.md:58-249`

**CRITICAL:** The plan text preamble must be byte-identical to Task 1's pattern. The first line of each agent prompt must be `> [full plan text]` — exactly the same placeholder text, no variation.

- [ ] **Step 1: Restructure Agent 1 — Bloaters & Dispensables (lines 66-111)**

Current (remove):
```
> You are a code smell analyst. Your job is to identify Bloater and Dispensable smells
> that this implementation plan would introduce into the codebase.
>
> The plan to review:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for Bloater and Dispensable code smells it would introduce
> into the codebase. Focus on these areas:
>
> Bloater smells to look for:
```

Keep all smell checklists, Rules, and Output format unchanged.

- [ ] **Step 2: Restructure Agent 2 — Couplers & OO Abusers (lines 115-161)**

Current (remove):
```
> You are a code smell analyst. Your job is to identify Coupler and OO Abuser smells
> that this implementation plan would introduce into the codebase.
>
> The plan to review:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for Coupler and OO Abuser code smells it would introduce
> into the codebase. Focus on these areas:
>
> Coupler smells to look for:
```

Keep all smell checklists, Rules, and Output format unchanged.

- [ ] **Step 3: Restructure Agent 3 — Change Preventers (lines 165-203)**

Current (remove):
```
> You are a code smell analyst specializing in Change Preventer smells. Your job is to
> identify structural decisions in this implementation plan that will make the codebase
> harder to change in the future.
>
> The plan to review:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for Change Preventer code smells — structural decisions that
> will make the codebase harder to change in the future. Focus on these areas:
>
> Change Preventer smells to look for:
```

Keep all smell checklists, Rules, and Output format unchanged.

- [ ] **Step 4: Restructure Agent 4 — SOLID Violations (lines 207-249)**

Current (remove):
```
> You are a code smell analyst specializing in SOLID principle violations. Your job is
> to identify SOLID violations that this implementation plan would introduce.
>
> The plan to review:
> [full plan text]
```

New (replace with):
```
> [full plan text]
>
> ---
>
> Analyze the plan above for SOLID principle violations it would introduce.
> Focus on these areas:
>
> SOLID violations to look for:
```

Keep all violation checklists, Rules, and Output format unchanged.

- [ ] **Step 5: Update the Step 2 dispatch instruction (line 60-62)**

Current:
```
Launch all four agents in a single message using the Agent tool. Each agent receives the
full plan text and a specific smell mission.
```

New:
```
Launch all four agents in a single message using the Agent tool. Each agent receives the
full plan text as the first content in the prompt (no header, no framing before it),
followed by a `---` delimiter, then agent-specific analysis instructions.
```

- [ ] **Step 6: Verify no instructions lost**

Run a manual diff review. For each agent, verify:
- All original smell checklists preserved (bullet lists after the delimiter)
- All Rules sections preserved
- All Output format sections preserved
- Only the role description and "The plan to review:" header were removed
- The plan text placeholder `[full plan text]` is the first content — byte-identical to attack-plan's pattern

- [ ] **Step 7: Commit**

```bash
git add chester-smell-code/SKILL.md
git commit -m "feat: restructure smell-code prompts for cache-optimal prefix"
```

---

### Task 3: Restructure chester-write-code Prompt Templates

**Files:**
- Modify: `chester-write-code/implementer.md:8-136`
- Modify: `chester-write-code/spec-reviewer.md:12-83`
- Verify: `chester-write-code/quality-reviewer.md` (no changes expected, confirm compatibility)
- Modify: `chester-write-code/code-reviewer.md:1-118`

- [ ] **Step 1: Restructure implementer.md**

Current opening (remove):
```
    You are implementing Task N: [task name]

    ## Task Description

    [FULL TEXT of task from plan - paste it here, don't make subagent read file]

    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]
```

New opening (replace with):
```
    [FULL TEXT of task from plan - paste it here, don't make subagent read file]

    ---

    Implement the task described above.

    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]
```

Keep all remaining sections unchanged: Before You Begin, Your Job, Code Organization, When You're in Over Your Head, Before Reporting Back: Self-Review, Report Format.

- [ ] **Step 2: Restructure spec-reviewer.md**

Current opening (remove):
```
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested

    [FULL TEXT of task requirements]

    ## What Implementer Claims They Built
```

New opening (replace with):
```
    [FULL TEXT of task requirements]

    ---

    Review whether the implementation matches the task requirements above.

    ## What Implementer Claims They Built
```

Keep all remaining sections unchanged: CRITICAL: Do Not Trust the Report, Your Job, Commit Verification, Report format.

- [ ] **Step 3: Restructure code-reviewer.md**

Current opening (remove):
```
# Code Review Agent

You are reviewing code changes for production readiness.

**Your task:**
1. Review {WHAT_WAS_IMPLEMENTED}
2. Compare against {PLAN_OR_REQUIREMENTS}
...

## What Was Implemented

{DESCRIPTION}

## Requirements/Plan

{PLAN_REFERENCE}
```

New opening (replace with):
```
# Code Review Agent

{PLAN_OR_REQUIREMENTS}

---

Review the code changes described below for production readiness.

## What Was Implemented

{DESCRIPTION}
```

Remove the "Your task:" numbered list (redundant with the directive line). Keep all remaining sections unchanged: Git Range to Review, Review Checklist, Output Format, Critical Rules, Example Output.

- [ ] **Step 4: Update quality-reviewer.md**

This file is a thin wrapper that references code-reviewer.md. Update the description to reflect the new structure:

Current:
```
  Use template at chester-write-code/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
```

This stays the same — the variable names haven't changed, just where they appear in the template. Verify the additional review checks at the bottom still make sense with the restructured code-reviewer.md. No changes expected.

- [ ] **Step 5: Verify no instructions lost**

For each template, verify:
- All original review checklists, rules, output formats preserved
- Only role descriptions and structural preambles removed
- Task/plan text is the first content in each prompt
- The `---` delimiter separates shared prefix from agent-specific instructions

- [ ] **Step 6: Commit**

```bash
git add chester-write-code/implementer.md chester-write-code/spec-reviewer.md chester-write-code/code-reviewer.md
git commit -m "feat: restructure write-code templates for cache-optimal prefix"
```

---

### Task 4: Add Cache Analysis Option to chester-finish-plan

**Files:**
- Modify: `chester-finish-plan/SKILL.md:243-265`

- [ ] **Step 1: Update Step 7 options list**

Current Step 7 options:
```
1. Session summary (invoke chester-write-summary)
2. Reasoning audit (invoke chester-trace-reasoning)
3. All of the above
4. Skip
```

New Step 7 options:
```
1. Session summary (invoke chester-write-summary)
2. Reasoning audit (invoke chester-trace-reasoning)
3. Cache analysis (parse session JSONL for cache hit rates)
4. All of the above
5. Skip
```

- [ ] **Step 2: Add cache analysis implementation block**

After the existing artifact options handling, add a new section for the cache analysis option:

```markdown
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
```

- [ ] **Step 3: Update the commit block for Step 7 artifacts**

Ensure the git add line includes the new possible output:
```bash
git add {CHESTER_WORK_DIR}/{sprint-subdir}/summary/
```
(Already covers cache-analysis.md since it uses a directory glob.)

- [ ] **Step 4: Commit**

```bash
git add chester-finish-plan/SKILL.md
git commit -m "feat: add cache analysis option to finish-plan"
```

---

### Task 5: Verification Pass

**Files:** All modified files from Tasks 1-4

- [ ] **Step 1: Diff review — attack-plan**

```bash
git diff main -- chester-attack-plan/SKILL.md
```

Verify:
- All 6 agents have `[full plan text]` as literal first content
- No role descriptions remain ("You are a...")
- All attack vectors, Rules, Output format sections intact
- `---` delimiter present in each agent block

- [ ] **Step 2: Diff review — smell-code**

```bash
git diff main -- chester-smell-code/SKILL.md
```

Verify:
- All 4 agents have `[full plan text]` as literal first content
- Plan text placeholder is byte-identical to attack-plan (same text, no variation)
- No role descriptions remain
- All smell checklists, Rules, Output format sections intact

- [ ] **Step 3: Diff review — write-code templates**

```bash
git diff main -- chester-write-code/
```

Verify:
- implementer.md: task text first, no role
- spec-reviewer.md: task text first, no role
- code-reviewer.md: plan/requirements first, no role
- quality-reviewer.md: references correct (no structural change needed)

- [ ] **Step 4: Diff review — finish-plan**

```bash
git diff main -- chester-finish-plan/SKILL.md
```

Verify:
- Cache analysis is option 3 in the Step 7 list
- "All of the above" shifted to option 4, "Skip" to option 5
- Cache analysis implementation block is complete
- Best-effort error handling present

- [ ] **Step 5: Cross-skill prefix consistency check**

Grep all SKILL.md files for the plan text placeholder to confirm consistency:

```bash
grep -n "\[full plan text\]" chester-attack-plan/SKILL.md chester-smell-code/SKILL.md
```

Verify every occurrence is the first content line of an agent prompt block (not preceded by role text or headers within the prompt).

- [ ] **Step 6: Commit verification pass marker**

```bash
git commit --allow-empty -m "checkpoint: verification complete"
```