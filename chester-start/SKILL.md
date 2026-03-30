---
name: chester-start
description: Use when starting any conversation - establishes how to find and use Chester skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

Chester skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, direct requests) — highest priority
2. **Chester skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## Session Housekeeping

At the start of every session:

1. **Clean up stale debug flag:** If `~/.claude/chester-debug.json` exists, check its `session_start` timestamp. If older than 12 hours, remove it:
   ```bash
   if [ -f ~/.claude/chester-debug.json ]; then
     start_ts=$(jq -r '.session_start // 0' ~/.claude/chester-debug.json)
     now=$(date +%s)
     age=$(( now - start_ts ))
     if [ "$age" -gt 43200 ]; then
       rm ~/.claude/chester-debug.json
     fi
   fi
   ```
   If fresh (<12h), leave it — the user may be continuing a debug session.

2. **Verify jq availability:** Run `which jq`. If jq is not installed, warn: "Budget guard requires jq for JSON parsing. Install jq for token budget monitoring." Continue without the guard.

3. **First-run project configuration:** Check for project-scoped Chester config:
   ```bash
   eval "$(~/.claude/skills/chester-hooks/chester-config-read.sh)"
   ```
   If `CHESTER_CONFIG_PATH` is `none`, this is a new project. Run the first-run setup:

   a. Announce: "This looks like a new project for Chester. Let's set up your output directories."

   b. Present defaults and ask for confirmation or customization:
   ```
   Chester needs two directories for this project:

   Plans directory (committed archive): docs/chester/plans/
   Working directory (gitignored, for active docs): docs/chester/working/

   Accept defaults? Or enter custom paths.
   ```

   c. User accepts defaults or provides custom paths for either or both.

   d. Create both directories:
   ```bash
   mkdir -p "$CHESTER_WORK_DIR"
   mkdir -p "$CHESTER_PLANS_DIR"
   ```

   e. Ensure working directory is in `.gitignore`:
   ```bash
   if ! git check-ignore -q "$CHESTER_WORK_DIR" 2>/dev/null; then
     echo "$CHESTER_WORK_DIR/" >> .gitignore
     git add .gitignore
     git commit -m "chore: add chester working directory to .gitignore"
   fi
   ```

   f. Write project config:
   ```bash
   PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
   mkdir -p "$PROJECT_ROOT/.claude"
   ```
   Write to `$PROJECT_ROOT/.claude/settings.chester.local.json`:
   ```json
   {
     "working_dir": "<user's chosen working directory>",
     "plans_dir": "<user's chosen plans directory>"
   }
   ```
   Create user-level config if it doesn't exist:
   ```bash
   if [ ! -f "$HOME/.claude/settings.chester.json" ]; then
     echo '{}' > "$HOME/.claude/settings.chester.json"
   fi
   ```

   g. Announce: "Chester configured. Plans archived to `{plans_dir}`, working docs at `{working_dir}`."

   If `CHESTER_CONFIG_PATH` is not `none`, read silently and proceed. No announcement unless there's a problem (e.g., working directory missing from .gitignore — fix and warn).

## How to Access Skills

**In Claude Code:** Use the `Skill` tool.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorming skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Invoke Skill tool" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Create TodoWrite todo per item" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "About to EnterPlanMode?" -> "Already brainstormed?";
    "Already brainstormed?" -> "Invoke brainstorming skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes"];
    "Invoke brainstorming skill" -> "Might any skill apply?";

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
    "Might any skill apply?" -> "Respond (including clarifications)" [label="definitely not"];
    "Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Create TodoWrite todo per item" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Create TodoWrite todo per item" -> "Follow skill exactly";
}
```

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Gate skills first** (`chester-figure-out`, `chester-build-spec`, `chester-build-plan`, `chester-write-code`, `chester-finish-plan`) — these define the overall pipeline stage and determine HOW to approach the task
2. **Review skills second** (`chester-attack-plan`, `chester-smell-code`) — these harden and validate the work
3. **Behavioral skills third** (`chester-test-first`, `chester-fix-bugs`, `chester-prove-work`, `chester-review-code`) — these guide specific execution disciplines
4. **Utility skills fourth** (`chester-make-worktree`, `chester-dispatch-agents`) — these support workflow mechanics

"Let's build X" → `chester-figure-out` first, then `chester-build-spec`, then `chester-build-plan`.
"Write a spec for this" → `chester-build-spec` directly.
"Fix this bug" → `chester-fix-bugs` first, then domain-specific skills.

## Skill Types

**Rigid** (`chester-test-first`, `chester-fix-bugs`): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## Available Chester Skills

- `chester-start` — Entry point; establishes the pipeline and skill usage rules (this skill)
- `chester-start-debug` — Activate diagnostic token logging mode for the session
- `chester-figure-out` — Socratic discovery of design through structured dialogue
- `chester-build-spec` — Formalize approved designs into spec documents with automated review
- `chester-build-plan` — Write and harden implementation plans
- `chester-write-code` — Execute plans, request code review, and perform subagent-driven development
- `chester-finish-plan` — Finish a development branch and prepare for merge
- `chester-attack-plan` — Adversarial review of plans to find weaknesses
- `chester-smell-code` — Code smell review of implementation
- `chester-test-first` — Test-driven development discipline
- `chester-fix-bugs` — Systematic debugging workflow
- `chester-prove-work` — Verification before completion
- `chester-review-code` — Receiving and acting on code review feedback
- `chester-make-worktree` — Git worktree workflow for parallel branches
- `chester-dispatch-agents` — Dispatching parallel subagents
- `chester-write-summary` — Session summary after completing work
- `chester-trace-reasoning` — Reasoning audit for decisions

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
