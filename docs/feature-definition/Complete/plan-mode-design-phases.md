# Feature Definition Brief: Plan Mode During Design Phases

## Problem

Chester's design-figure-out skill uses behavioral instructions to prevent the agent from writing code during the design interview. The HARD-GATE block says "Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until the design is resolved." Phase 1 adds further prohibitions: no solution proposals, no architecture suggestions, no design alternatives.

These are instructions, not constraints. The agent can violate them — and occasionally does, especially under pressure:

- When the user describes a problem, the agent's completion drive pulls toward writing a fix
- After codebase exploration reveals a clear solution, the agent may propose it during Phase 1 (Understand) when it should only be correlating
- Long interviews create instruction fatigue — behavioral constraints get weaker as context grows and compaction summarizes them

The skill compensates with repeated reminders, prohibited-content lists, and phase discipline checks. These work most of the time, but they consume tokens and add bulk to an already long skill file. Every word spent saying "don't do X" is a word not spent saying "do Y well."

## Proposed Solution

Use Claude Code's `EnterPlanMode` tool to structurally prevent file modifications during the design interview phases. Plan Mode restricts Edit, Write, and Bash at the platform level — the agent literally cannot write code, regardless of instruction fatigue.

### How Plan Mode Works

**Restricted in Plan Mode:**
- Edit, Write, Bash, NotebookEdit, PowerShell — no file modifications or command execution
- WebFetch, WebSearch — no external requests

**Unrestricted in Plan Mode:**
- Read, Glob, Grep — full codebase exploration
- Agent — can spawn subagents (subagents are NOT restricted by parent's Plan Mode)
- MCP tools that perform reads (understanding/enforcement scoring)
- AskUserQuestion — can interact with user

This is a near-perfect match for Chester's design phases. During the interview, the agent needs to: read code (Read/Glob/Grep), score dimensions (MCP tools), spawn explorers (Agent), and talk to the user. It does NOT need to: edit files, run commands, or create artifacts — until closure.

### Integration Points

**Enter Plan Mode** — called by `start-bootstrap` after sprint setup completes, or by `design-figure-out` at the start of Phase 3 (Round One). The agent calls `EnterPlanMode` as a tool invocation.

**Exit Plan Mode** — called during Phase 5 (Closure) when the agent needs to write the design brief, thinking summary, and process evidence artifacts. The agent calls `ExitPlanMode`, which presents a plan summary for user approval before exiting.

```
Bootstrap → EnterPlanMode
  ↓
Phase 2: Codebase Exploration (Read/Glob/Grep + Agent for explorers)
  ↓
Phase 3: Round One (MCP initialization, scoring, commentary)
  ↓
Phase 4: Interview Loop (MCP scoring, structured thinking, commentary)
  ↓  
Phase 5: Closure begins
  ↓
ExitPlanMode (present design summary, user approves)
  ↓
Write artifacts to disk
  ↓
Invoke util-worktree (needs Bash for git operations)
  ↓
Transition to design-specify
```

### What Changes in the Skill

1. **Add EnterPlanMode call** after bootstrap completes (one line in the checklist)
2. **Add ExitPlanMode call** at the start of closure (one line)
3. **Remove or reduce behavioral prohibitions** — the HARD-GATE can be simplified since Plan Mode enforces structurally. Keep a brief note explaining why Plan Mode is active, but drop the repeated "do NOT" lists
4. **Update the checklist** to include Plan Mode transitions as explicit steps

### What Stays the Same

- Phase 1 content prohibitions ("no solution proposals") are still behavioral — Plan Mode prevents code writing, not solution thinking. The agent could still verbally propose solutions during Phase 1 even in Plan Mode. Keep the Phase 1 prohibited content list.
- The structured thinking protocol, MCP scoring cycles, challenge modes, translation gate, research boundary — all unchanged.
- Subagent behavior — explorer agents are not affected by Plan Mode (they inherit their own permission mode). They already only read code, so no change.

## Scope

### In Scope

- Adding `EnterPlanMode` call to bootstrap/round-one
- Adding `ExitPlanMode` call to closure
- Simplifying HARD-GATE and behavioral prohibition sections
- Updating the checklist and process flow
- Testing that MCP tools (understanding/enforcement) work in Plan Mode

### Out of Scope

- Changing what Plan Mode restricts (that's platform behavior)
- Adding Plan Mode to other skills (design-specify needs to write files throughout; plan-build needs to write plan files)
- Restricting subagent permissions (they already behave correctly)
- Changing the interview model or scoring

## Constraints

- `EnterPlanMode` is a tool call the agent must make — it cannot be triggered automatically by a hook or skill frontmatter. The skill must instruct the agent to call it.
- `ExitPlanMode` triggers a permission prompt (the user sees a plan summary and must approve). This is actually desirable — it gives the user a natural confirmation point before closure.
- Plan Mode restricts WebFetch/WebSearch, which means the web-search opportunity (see concept brief) would need to be implemented before Plan Mode entry, or Plan Mode would need to be temporarily exited.
- MCP tools that perform writes (like `submit_scores` writing state files) work because MCP tool restrictions are based on actual effect, and these MCPs handle their own file I/O internally via Node.js — they don't go through Claude's Edit/Write tools.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Agent forgets to call EnterPlanMode | Medium | Make it a checklist item; bootstrap could remind. If missed, behavioral constraints still exist as fallback. |
| ExitPlanMode prompt confuses the user | Low | The plan summary is actually the design brief summary — frame it as "here's what we designed, ready to write it down?" |
| MCP state writes fail in Plan Mode | Low | Tested: MCP servers use their own Node.js fs operations, not Claude's tools. Should work. Verify during implementation. |
| Agent needs Bash during interview (e.g., run a quick test to check behavior) | Low | This is actually desirable to prevent — during design, the agent should not be running code. If truly needed, the user can exit Plan Mode manually. |

## Dependencies

- Claude Code Plan Mode must be available (it is — built-in tool)
- MCP tools must function in Plan Mode (expected based on architecture — MCP servers are separate processes)
- `start-bootstrap` skill must be updated to include the EnterPlanMode call

## Success Criteria

- During a design-figure-out session with Plan Mode active, the agent cannot create files, edit code, or run commands — verified by attempting these actions and confirming they're blocked
- The agent can still: read code, run explorers, score dimensions, capture thoughts, and converse with the user
- ExitPlanMode at closure produces a coherent design summary the user can approve
- After ExitPlanMode, artifact writing and worktree creation proceed normally
- Skill file is shorter (fewer behavioral prohibitions needed)

## Implementation Notes

The key insight is that Plan Mode replaces *prohibition instructions* with *platform constraints*. This is a net reduction in skill complexity — fewer words telling the agent what not to do, replaced by a single tool call that makes violation impossible.

The ExitPlanMode interaction is a natural fit for Chester's closure protocol, which already includes a "Does this capture what we're building?" confirmation. ExitPlanMode's plan approval prompt serves the same function.

One design decision to resolve during implementation: should Plan Mode be entered during bootstrap (covering codebase exploration too) or only at the start of the interview loop? Codebase exploration only reads files, so Plan Mode wouldn't restrict it — but entering early establishes the constraint before the agent has seen any code, which is when the completion drive is weakest. Entering during bootstrap is probably the right call.
