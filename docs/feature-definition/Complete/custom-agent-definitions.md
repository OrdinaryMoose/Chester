# Feature Definition Brief: Custom Agent Definitions

## Problem

Chester dispatches subagents throughout its pipeline — explorers during design, reviewers during specify, implementers during execute-write. Currently, all subagent behavior is defined inline: the dispatching skill writes a prompt describing what the subagent should do, which model to use, and what constraints apply. This creates three problems:

1. **Duplicated instructions** — the same reviewer prompt appears in design-specify, execute-write, and plan-build. When review criteria change, every copy must be updated independently.

2. **No tool restriction** — built-in agent types like `feature-dev:code-explorer` have full tool access. Chester's explorers should only read code, but nothing prevents them from editing files. The dispatching skill includes "do not modify any files" in the prompt, but that's behavioral, not structural.

3. **No model control** — Chester dispatches explorers and reviewers using whatever model powers the current session. Three parallel explorer agents running on Opus when Haiku could handle the read-only scan is expensive. The dispatching skill has no way to select a cheaper model for commodity tasks.

## Proposed Solution

Define Chester-specific agents in the plugin's `agents/` directory. Each agent gets a markdown file with YAML frontmatter controlling model, tools, turns, and behavior. Skills dispatch these custom agents by type name instead of writing inline prompts.

### Agent Definitions

#### chester:explorer

Read-only codebase exploration agent. Replaces inline `feature-dev:code-explorer` dispatches.

```yaml
---
name: explorer
description: Read-only codebase exploration for design discovery. Traces implementations, maps architecture, identifies patterns.
model: sonnet
maxTurns: 20
tools: Read, Glob, Grep, Agent
disallowedTools: Edit, Write, Bash, NotebookEdit
---
```

**Why sonnet:** Exploration is pattern-matching and summarization — sonnet handles this well at lower cost. The dispatching skill (running on opus) synthesizes the findings.

**Why no Bash:** Explorers should never run commands. They read code structure, not runtime behavior.

**Why Agent is allowed:** Explorers occasionally need to dispatch sub-explorers for deep dives into specific modules. Restricting Agent would break this.

#### chester:reviewer

Code review agent with read-only access plus limited Bash for running tests. Used by design-specify (spec review), execute-write (quality review, spec compliance), and plan-build (plan review).

```yaml
---
name: reviewer
description: Code and artifact reviewer. Reviews specs, plans, and code for quality, correctness, and convention adherence.
model: sonnet
maxTurns: 15
tools: Read, Glob, Grep, Bash
disallowedTools: Edit, Write, NotebookEdit
---
```

**Why Bash is allowed:** Reviewers need to run test suites and linters to verify claims. But they cannot edit files — review findings go back to the dispatching skill, which decides what to change.

**Why not haiku:** Review quality matters. Sonnet balances cost and judgment. Haiku misses subtle issues.

#### chester:implementer

Implementation agent dispatched by execute-write. Has full tool access but restricted turns.

```yaml
---
name: implementer
description: Execute a single implementation task from a plan. Write code, run tests, report status.
model: inherit
maxTurns: 30
skills:
  - execute-test
---
```

**Why inherit model:** Implementation quality is critical — use whatever model the user chose for the session.

**Why execute-test is preloaded:** Every implementer should follow TDD discipline. Preloading the skill means it's in context from the start, not invoked mid-task (which sometimes doesn't happen).

**Why no tool restrictions:** Implementers need full access — Edit, Write, Bash for running tests, Grep for finding code. The restriction is on scope (one task), not on capabilities.

#### chester:grader

Lightweight evaluation agent for budget guard checks and quick assessments.

```yaml
---
name: grader
description: Quick assessment agent for budget checks, artifact validation, and lightweight scoring.
model: haiku
maxTurns: 5
tools: Read, Glob, Grep
disallowedTools: Edit, Write, Bash, Agent, NotebookEdit
---
```

**Why haiku:** Grading is structured evaluation against criteria — haiku is fast and cheap for this. No creative judgment needed.

**Why 5 turns:** Grading should be fast. If it takes more than 5 turns, the grading criteria are wrong.

### How Skills Use Custom Agents

Current pattern (inline prompt):
```
Dispatch 3 feature-dev:code-explorer agents in parallel...
Each explorer returns an analysis plus a list of 5-10 essential files.
```

New pattern (custom agent):
```
Dispatch 3 chester:explorer agents in parallel...
Each explorer returns an analysis plus a list of 5-10 essential files.
```

The skill's dispatch instructions stay the same — only the agent type name changes. The behavioral instructions move from the skill's inline prompt into the agent definition's markdown body, where they're maintained in one place.

### Plugin Manifest

```json
{
  "name": "chester",
  "agents": "./agents/"
}
```

Agent files live at:
```
agents/
├── explorer.md
├── reviewer.md
├── implementer.md
└── grader.md
```

## Scope

### In Scope

- Four agent definition files in `agents/`
- Plugin manifest update to register agents directory
- Update dispatch instructions in design-figure-out, design-specify, plan-build, execute-write to use custom agent types
- Move inline behavioral instructions from skills into agent definitions

### Out of Scope

- Changing what agents do (same exploration, review, implementation behavior)
- Adding new agent roles beyond what currently exists
- Agent hooks or MCP server scoping (not supported for plugin agents)
- Permission mode configuration (not supported for plugin agents)
- Changing the interview model or scoring

## Constraints

- **Plugin agents cannot define hooks** — `PreToolUse`, `PostToolUse` hooks are not supported in plugin-shipped agent definitions. Only user-defined agents (in `.claude/agents/`) support hooks. This means we can't add a PreToolUse hook to validate reviewer read-only behavior — we rely on `disallowedTools` instead.
- **Plugin agents cannot scope MCP servers** — the `mcpServers` field is not supported for plugin agents. All plugin MCP servers are available to all agents. This means the enforcement/understanding MCPs are technically available to explorers (not harmful, just unnecessary).
- **Model selection is limited** — `sonnet`, `opus`, `haiku`, or `inherit`. No fine-grained model version pinning for plugin agents.
- **Skills preloading injects full content** — preloading `execute-test` into the implementer means the entire skill file is in the agent's system prompt. If the skill is large, this consumes context. Keep preloaded skills concise or extract the essential parts.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Sonnet explorers miss patterns that Opus would catch | Medium | Monitor exploration quality. The dispatching skill (on Opus) reads all identified files and synthesizes — it compensates for explorer gaps. Can switch to `inherit` if quality drops. |
| disallowedTools prevents a legitimate tool use | Low | Agent definitions are easy to update. If a reviewer needs a tool, add it. |
| Preloaded skills bloat agent context | Low | Only preload execute-test (one skill). Monitor token usage. |
| Custom agents not found after plugin reload | Low | Verify agents/ directory is registered in plugin.json. Test with `/reload-plugins`. |

## Dependencies

- Claude Code plugin system must support `agents/` directory (it does)
- Agent tool must accept custom agent type names as `subagent_type` (it does — format is `chester:agent-name`)
- Skills must be updated to reference new agent types (coordinated change)

## Success Criteria

- `chester:explorer` agents successfully explore codebases with read-only access — Edit/Write attempts are blocked
- `chester:reviewer` agents can run tests (Bash) but cannot modify code (no Edit/Write)
- `chester:implementer` agents have execute-test skill in context from turn 1
- `chester:grader` agents complete assessments in under 5 turns on haiku
- Model costs decrease for exploration-heavy sessions (3 sonnet explorers vs 3 opus explorers)
- Skill files are shorter — inline behavioral prompts replaced by agent type references

## Implementation Notes

The migration can be incremental. Start by defining `chester:explorer` and updating `design-figure-out` to dispatch it. Verify behavior matches `feature-dev:code-explorer`. Then add `chester:reviewer` and update the review dispatches. The implementer and grader can follow.

Each agent definition's markdown body should contain the behavioral instructions currently inline in the dispatching skill's prompt. For explorers, this includes:
- What to look for (similar features, architecture, extension points)
- How to report (analysis + file list)
- What NOT to do (no modifications, no running code)

The tool restrictions (`disallowedTools`) make the "what NOT to do" instructions structural rather than behavioral — but keeping them in the body as well provides defense in depth and helps the agent understand *why* it has restricted access.
