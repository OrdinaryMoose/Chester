# Spec: Cache Subagent Prefix

Sprint: sprint-007-cache-subagent-prefix
Date: 2026-03-29
Status: Draft

## Overview

Restructure all Chester subagent prompts to maximize Anthropic prompt cache hit rates. Shared content (plan text or task text) moves to the start of every subagent prompt, forming a byte-identical prefix across agents. Role descriptions are removed; domain scoping moves to task instructions at the end of each prompt.

## Background

Anthropic's prompt cache matches byte-identical prefixes in strict order: tools → system → messages. Claude Code manages tools and system (~18-19K tokens, identical across subagents). Chester controls the user message — the `prompt` parameter of the Agent tool. Currently, subagent prompts lead with divergent role descriptions ("You are a structural integrity auditor..."), which breaks prefix sharing on the user message portion even when agents share identical plan text.

Cache reads cost 10% of base input. Cache writes cost 125%. Cache TTL is 5 minutes (default). Minimum cacheable prefix is 4,096 tokens for Opus 4.6.

## Changes

### C1: Prompt Structure — Plan-Level Agents

**Affects:** chester-attack-plan (6 agents), chester-smell-code (4 agents)

**Current structure:**
```
> You are a [specific role] attacking/reviewing an implementation plan.
>
> The plan to attack/review:
> [full plan text]
>
> Your attack vectors / smells to look for:
> [agent-specific instructions]
>
> Rules: [...]
> Output format: [...]
```

**New structure:**
```
[full plan text]

---

Analyze the plan above for [specific domain]. Focus on these areas:

[numbered checklist of what to look for]

Rules:
[evidence requirements, classification criteria]

Output format:
[structured output format]
```

**Key properties:**
- The plan text is the first content in the prompt — byte-identical across all 10 agents (6 attack + 4 smell)
- No preamble, no framing, no role description before the plan text
- The `---` delimiter separates the cached prefix (plan) from the dynamic suffix (instructions)
- Both chester-attack-plan and chester-smell-code must paste the plan text using the same method — no skill-specific headers like "The plan to attack:" or "The plan to review:" before the text
- The plan text must not be wrapped in quotes, blockquotes, or code fences — raw text only, to avoid any formatting divergence between skills

**Cache behavior:** First agent writes the plan prefix to cache. Remaining 9 agents read from cache within the 5-minute TTL. Since attack-plan and smell-code dispatch in parallel during plan hardening, all 10 agents launch within seconds of each other.

### C2: Prompt Structure — Task-Level Agents

**Affects:** chester-write-code (implementer, spec reviewer, quality reviewer)

**Current structure (implementer.md):**
```
> You are implementing Task N: [task name]
>
> ## Task Description
> [FULL TEXT of task from plan]
>
> ## Context
> [scene-setting, dependencies]
> ...
```

**New structure (implementer.md):**
```
[FULL TEXT of task from plan]

---

Implement the task described above.

## Context
[scene-setting, dependencies, architectural context]

## Before You Begin
[questions section]

## Your Job
[implementation steps]
...
```

**Current structure (spec-reviewer.md):**
```
> You are reviewing whether an implementation matches its specification.
>
> ## What Was Requested
> [FULL TEXT of task requirements]
>
> ## What Implementer Claims They Built
> [implementer's report]
> ...
```

**New structure (spec-reviewer.md):**
```
[FULL TEXT of task requirements]

---

Review whether the implementation matches the task requirements above.

## What Implementer Claims They Built
[implementer's report]

## CRITICAL: Do Not Trust the Report
[verification instructions]
...
```

**Current structure (quality-reviewer.md / code-reviewer.md):**
```
> You are reviewing code changes for production readiness.
>
> ## What Was Implemented
> {DESCRIPTION}
>
> ## Requirements/Plan
> {PLAN_REFERENCE}
> ...
```

**New structure (code-reviewer.md):**
```
{PLAN_OR_REQUIREMENTS}

---

Review the code changes described below for production readiness.

## What Was Implemented
{DESCRIPTION}

## Git Range to Review
[BASE_SHA, HEAD_SHA, diff commands]

## Review Checklist
[quality, architecture, testing, requirements, production readiness]
...
```

**Key properties:**
- Task text is the first content — shared between implementer and spec reviewer for the same task
- The spec reviewer appends the implementer's report after the delimiter, which extends beyond the shared prefix but doesn't break it
- The code reviewer puts plan/requirements first, which may differ from the task text (it references the full plan section, not just the task). Cache sharing between code reviewer and other per-task agents is not guaranteed but the consistent pattern is maintained

### C3: Role Description Removal

**Affects:** All subagent prompts in attack-plan, smell-code, write-code

Every prompt currently opens with a role description:
- "You are a structural integrity auditor..."
- "You are a code smell analyst..."
- "You are implementing Task N..."
- "You are reviewing whether an implementation matches..."
- "You are reviewing code changes for production readiness."

All role descriptions are removed. Domain scoping moves to the task instruction after the delimiter:
- "Analyze the plan above for structural integrity gaps."
- "Analyze the plan above for Bloater and Dispensable code smells."
- "Implement the task described above."
- "Review whether the implementation matches the task requirements above."
- "Review the code changes described below for production readiness."

The task instruction line replaces the role description's scoping function. The instruction is a directive ("analyze", "implement", "review") not a persona ("you are").

### C4: Cross-Skill Prefix Discipline

**Affects:** chester-attack-plan, chester-smell-code, chester-build-plan (as the dispatcher)

Both skills must produce byte-identical plan text as their prompt prefix. This requires:

1. **No skill-specific header before plan text.** The plan text is the literal first characters of the prompt. Not "The plan to attack:" or "The plan to review:" — just the plan text.

2. **Same paste method.** The orchestrating agent (build-plan or the user) must paste the plan text identically for both skills. The SKILL.md files for both attack-plan and smell-code must use identical language to instruct the orchestrator on how to inject the plan:
   ```
   [full plan text — paste the complete plan document here, no wrapper]
   ```

3. **No whitespace variation.** No trailing newlines, no leading whitespace differences. The plan text ends, a blank line follows, then `---`.

### C5: Post-Session Cache Analysis Option in Finish-Plan

**Affects:** chester-finish-plan

Add a new option to Step 7 (Session Artifacts):

```
Would you like me to produce session artifacts?

1. Session summary (invoke chester-write-summary)
2. Reasoning audit (invoke chester-trace-reasoning)
3. Cache analysis (parse session JSONL for cache hit rates)
4. All of the above
5. Skip
```

**Cache analysis behavior:**

1. Find the current session's JSONL file:
   ```bash
   SESSION_DIR="$HOME/.claude/projects/$(echo "$PWD" | sed 's|/|-|g; s|^-||')"
   LATEST_JSONL=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1)
   ```

2. Parse subagent entries for cache metrics:
   ```bash
   jq -r 'select(.type == "assistant" and .message.usage) |
     [.message.usage.input_tokens,
      .message.usage.cache_creation_input_tokens,
      .message.usage.cache_read_input_tokens] |
     @csv' "$LATEST_JSONL"
   ```

3. Report summary to terminal:
   ```
   ## Cache Analysis

   | Call | Input | Cache Write | Cache Read | Hit Rate |
   |------|-------|-------------|------------|----------|
   | 1    | 500   | 19000       | 0          | 0%       |
   | 2    | 500   | 0           | 19000      | 97%      |
   | ...  | ...   | ...         | ...        | ...      |

   **Overall:** X% of input tokens served from cache
   **Subagent average:** Y% cache hit rate
   ```

4. Write report to `{sprint-dir}/summary/cache-analysis.md`

This is a best-effort diagnostic. The JSONL structure may vary across Claude Code versions. If parsing fails, report the error and skip gracefully.

## Files Modified

| File | Change |
|------|--------|
| `chester-attack-plan/SKILL.md` | Restructure 6 agent prompts: plan text first, remove roles, task instructions after delimiter |
| `chester-smell-code/SKILL.md` | Restructure 4 agent prompts: plan text first, remove roles, task instructions after delimiter |
| `chester-write-code/implementer.md` | Task text first, remove role, implementation instructions after delimiter |
| `chester-write-code/spec-reviewer.md` | Task text first, remove role, review instructions after delimiter |
| `chester-write-code/quality-reviewer.md` | Update to reference restructured code-reviewer.md pattern |
| `chester-write-code/code-reviewer.md` | Plan/requirements first, remove role, review instructions after delimiter |
| `chester-finish-plan/SKILL.md` | Add cache analysis option to Step 7 |

## Files NOT Modified

| File | Reason |
|------|--------|
| `chester-build-plan/plan-reviewer.md` | Uses file paths, not pasted content. 1-3 calls. Minimal cache benefit. |
| `chester-build-spec/spec-reviewer.md` | Uses file paths. 1-3 calls. Minimal cache benefit. |
| `chester-dispatch-agents/SKILL.md` | Utility skill with guidance only — no prompt templates to restructure. |
| `chester-write-code/SKILL.md` | References templates but doesn't contain prompts. May need minor instruction updates to reflect new template structure. |

## Constraints

- **Byte-identity is fragile.** A single extra space, newline, or wrapper word before the plan text breaks cross-agent caching. The spec is strict about "no preamble" for this reason.
- **Cache TTL is 5 minutes.** All agents sharing a prefix must launch within this window. Plan hardening (attack-plan + smell-code) already dispatches in parallel, so this is met. Write-code's per-task agents dispatch sequentially but within seconds of each other.
- **Minimum prefix is 4,096 tokens.** Plan documents typically exceed this. Short plans (under 4K tokens) won't benefit from user-message-level caching but still benefit from system prefix caching (managed by Claude Code).
- **No control over Claude Code's caching.** This spec only addresses the user message portion. System prefix caching is managed by Claude Code's harness and is outside Chester's control.

## Non-Goals

- Modifying Claude Code's API call construction or cache_control marker placement
- Runtime cache monitoring or debug instrumentation
- TTL tuning (uses Claude Code defaults)
- Restructuring build-plan or build-spec reviewer prompts
- Changing subagent_type or tool availability for any agent

## Testing Strategy

1. **Diff review:** After restructuring, diff each prompt against the original to verify no instructions were lost — only reordered
2. **Pipeline run:** Execute a full pipeline (figure-out → spec → plan → write-code) on a test task and verify subagent output quality is equivalent
3. **Cache verification:** Use the finish-plan cache analysis option to verify cache hit rates on the test run

## Success Criteria

1. All 10 plan-level agent prompts (6 attack + 4 smell) share a byte-identical plan text prefix
2. All per-task agent prompts in write-code place task/plan text first
3. No role descriptions remain in any affected subagent prompt
4. Task instructions after the delimiter provide equivalent domain scoping
5. Finish-plan offers cache analysis as a session artifact option
6. A full pipeline run produces equivalent-quality output with measurable cache hits