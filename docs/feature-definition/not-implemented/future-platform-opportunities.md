# Consolidated Concept Brief: Future Platform Opportunities

These are platform capabilities Chester doesn't currently use. Each is described with enough detail to write a feature definition brief when the time comes. They are ordered by estimated impact, not priority — the right time to build each depends on what Chester needs next.

---

## 1. Automatic Budget Guard via PreToolUse Hooks

### What It Is

Chester currently enforces budget checks as manual procedures inside skills. Each skill that dispatches expensive work (plan-build, execute-write, design-figure-out) includes a "Budget Guard Check" section that reads `~/.claude/usage.json` and pauses if the five-hour token usage exceeds a threshold.

Claude Code's `PreToolUse` hook fires **before every tool call**. A hook can inspect which tool is about to be called, evaluate whether to allow it, and block it with a reason.

### How It Would Work

Register a `PreToolUse` hook with a matcher for expensive tools (`Agent`, `Bash`). The hook reads `~/.claude/usage.json`, checks the five-hour usage percentage against the threshold in `~/.claude/settings.chester.json`, and:

- **Below threshold:** exits 0 (tool proceeds)
- **Above threshold:** exits 2 with a message ("Token budget exceeded: 87% of five-hour limit. Pause and checkpoint before continuing.")

This makes budget enforcement automatic and inescapable. Skills no longer need their own budget guard sections — the hook fires for every Agent dispatch and Bash command regardless of which skill is active.

### Hook Type Options

- **Command hook** (recommended): Shell script that reads JSON files and exits with a code. Fast, deterministic, no LLM cost. Runs in under 100ms.
- **Agent hook**: Could make more nuanced decisions (is this a critical dispatch or a nice-to-have?) but adds latency and token cost to every tool call. Overkill for a threshold check.

### Key Details

- Matcher: `"Agent|Bash"` — only check before expensive operations, not before Read/Glob/Grep
- The hook receives `{"tool_name": "Agent", "tool_input": {...}}` on stdin — it can inspect what's being dispatched
- Could differentiate: block parallel explorer dispatches (expensive) but allow single-agent dispatches (cheap)
- Requires `jq` (already a Chester prerequisite)
- Hook configuration would live in Chester's plugin hooks, not per-skill

### Open Questions for Feature Definition

- Should the hook block the tool call entirely, or inject a warning and let the agent decide?
- Should it distinguish between different agent types (blocking 3 parallel explorers but allowing a single reviewer)?
- How does this interact with Plan Mode (which already blocks Bash)?

---

## 2. Web Search During Codebase Exploration

### What It Is

Chester's codebase exploration phase dispatches three `feature-dev:code-explorer` agents to scan the local codebase. For brownfield projects with established patterns, this is usually sufficient. For greenfield projects, unfamiliar domains, or tasks involving third-party APIs, the local codebase may not contain enough context.

Claude Code provides `WebSearch` (search engine queries) and `WebFetch` (retrieve specific URLs). These are available as built-in tools.

### How It Would Work

During Phase 2 (Parallel Codebase Exploration), the design-figure-out skill conditionally dispatches a fourth explorer — a **web researcher** — when the codebase alone is insufficient:

**Trigger conditions** (any of):
- Greenfield project (no existing code in the relevant domain)
- User's request involves an unfamiliar API, framework, or protocol
- The three codebase explorers return sparse findings

**What the web researcher does:**
- Searches for best practices, API documentation, framework conventions relevant to the user's request
- Fetches specific documentation URLs if the user mentioned them
- Returns a summary of external context: what patterns other projects use, what the documentation recommends, what gotchas exist

**What it does NOT do:**
- Replace codebase exploration (local code is always primary)
- Fetch arbitrary URLs without a clear purpose
- Search for solutions or implementations (this is understanding, not solving)

### Key Details

- The web researcher would be a custom `chester:web-researcher` agent (see custom agents brief) with `WebSearch` and `WebFetch` in its allowed tools, plus Read/Glob/Grep for local context
- Model: haiku or sonnet (web research is summarization, not deep reasoning)
- Results are consumed by the design-figure-out agent during Round One, alongside codebase explorer findings
- If Plan Mode is active during exploration, WebSearch/WebFetch are blocked — web research would need to happen before entering Plan Mode, or the web researcher agent operates outside Plan Mode (subagents aren't restricted by parent's Plan Mode)

### Open Questions for Feature Definition

- Should web research be opt-in (user requests it) or automatic (agent decides based on codebase sparsity)?
- How to prevent the agent from over-relying on web results vs. local codebase patterns?
- Privacy considerations — what queries are sent to search engines? Should the user approve search terms?

---

## 3. Expanded Hook Coverage

### What It Is

Chester uses exactly one hook event (SessionStart). Claude Code provides 23 hook event types. Beyond compaction hooks (covered in their own brief) and PreToolUse for budget guarding (above), several other hook events could strengthen Chester's pipeline.

### Candidate Hooks

#### SubagentStart / SubagentStop

**What they provide:** Notification when any subagent is spawned or completes. Receives agent type, task description, and (on stop) token usage and duration.

**Chester use case:** Automatic accounting for process evidence. Currently, the design-figure-out skill manually tracks which agents were dispatched and when. These hooks could write dispatch records to a log file that the closure phase reads when compiling process evidence.

**Implementation:** Command hook that appends a JSON line to `{sprint-dir}/design/.agent-log.jsonl` with timestamp, agent type, token count, and duration. The closure phase reads this file to generate the "explorers dispatched, reviewers run, total tokens" section of process evidence.

#### PostToolUse

**What it provides:** Notification after any tool call completes. Receives tool name, input, output, and duration.

**Chester use case:** Detect implementation drift during design phases. If a `PostToolUse` hook sees an Edit or Write tool call succeed during a design-figure-out session, it could log a warning. This is defense-in-depth alongside Plan Mode — Plan Mode should prevent this, but the hook catches violations if Plan Mode wasn't entered.

**Implementation:** Command hook with matcher for `Edit|Write`. Checks if a Chester design session is active (breadcrumb file exists). If so, logs a warning to the sprint directory. Does not block (PostToolUse cannot block — the action already happened).

#### FileChanged

**What it provides:** Notification when a file in the working directory is modified.

**Chester use case:** Auto-detect when implementation files change during execute-write, triggering a reminder to run tests before proceeding. Could also detect when someone manually edits a design brief or spec during an active session.

**Implementation:** Command hook that checks if the changed file is in the sprint's artifact directory. If a spec was modified mid-implementation, log a warning about spec drift.

### Open Questions for Feature Definition

- How many hooks are too many? Each hook adds latency to the event it monitors.
- Should these be shipped as plugin hooks or recommended as user configuration?
- SubagentStart/Stop hooks — is the token/timing data reliable enough for accounting?

---

## 4. Plugin User Configuration

### What It Is

Claude Code plugins can declare configuration that users set when enabling the plugin. This configuration is stored per-user and per-project, accessible to the plugin's hooks and skills.

Chester currently uses a hand-managed configuration system: `chester-config-read.sh` resolves project-scoped settings from `.claude/settings.chester.local.json`. First-run setup is handled by the `setup-start` skill, which creates directories and writes config files interactively.

### How It Would Work

The plugin manifest (`plugin.json`) declares configuration fields:

```json
{
  "config": {
    "plans_dir": {
      "type": "string",
      "description": "Directory for Chester artifacts (gitignored)",
      "default": "docs/chester/plans/"
    },
    "budget_threshold": {
      "type": "number",
      "description": "Five-hour token usage percentage to pause at",
      "default": 85
    }
  }
}
```

When a user enables the Chester plugin, they're prompted for these values. The values are stored in the standard plugin config location and accessible via `${CLAUDE_PLUGIN_DATA}` or environment variables.

### What This Replaces

- `chester-config-read.sh` — replaced by standard plugin config resolution
- First-run setup in `setup-start` — replaced by plugin enable flow
- `.claude/settings.chester.local.json` — replaced by plugin config storage
- `~/.claude/settings.chester.json` — replaced by user-level plugin config

### Key Details

- Plugin config supports sensitive values (API keys) with secure storage — not needed for Chester currently, but available
- Config values are available to hooks via environment variables
- Users can update config via the plugin management interface
- Project-level vs user-level config follows the same scoping as Claude Code settings

### Open Questions for Feature Definition

- Is the current config system working well enough that migration isn't worth the disruption?
- How does plugin config interact with worktrees? Does each worktree get its own config?
- What happens to existing `.claude/settings.chester.local.json` files after migration?

---

## 5. Path-Specific Rules

### What It Is

Claude Code supports rules in `.claude/rules/` that are scoped to specific file paths. When the agent is working on a file matching the rule's path pattern, the rule's content is injected into context.

### How It Would Work

Chester could ship rules that activate when editing skill files:

```
.claude/rules/
├── skill-editing.md      — conventions for editing SKILL.md files
├── mcp-server.md         — conventions for MCP server code
└── test-writing.md       — conventions for Chester test scripts
```

Example `skill-editing.md`:
```markdown
---
globs: ["skills/*/SKILL.md"]
---
When editing a skill file:
- The description frontmatter field must match the entry in skills/setup-start/SKILL.md
- Keep SKILL.md under 500 lines
- Rigid skills must be followed exactly; flexible skills adapt to context
```

### Key Details

- Rules are loaded only when the agent is working with matching files — no context cost when working elsewhere
- Rules supplement CLAUDE.md — they don't replace it
- Rules could enforce conventions that are currently just documented (like "description must match setup-start entry")
- These would be shipped as part of the Chester repo, not the plugin (rules live in the project, not the plugin)

### Open Questions for Feature Definition

- Should these be in the Chester plugin (affecting all projects using Chester) or in the Chester repo (affecting Chester development only)?
- How do path-specific rules interact with skills? If a rule says "always X" and a skill says "never X", which wins?

---

## 6. Channels and Message Injection

### What It Is

Claude Code plugins can declare message channels — named endpoints that external systems can use to push messages into an active conversation. Messages appear as if they came from a system source, injected into the agent's context.

### How It Would Work

Chester could declare channels for:

- **CI/CD notifications** — when a test suite finishes on a branch Chester created, the result is pushed into the active session. The execute-write skill gets real-time feedback without polling.
- **Review comments** — when a PR Chester created receives a GitHub review comment, it's pushed into the session. The execute-review skill activates automatically.
- **Deploy status** — when a deployment succeeds or fails, the session is notified.

### Key Details

- Channels require external integration (something must send messages to the channel)
- Messages are injected as system messages, not user messages
- The agent sees them as context and can act on them
- This is most valuable when Chester is used in long-running sessions or with CI/CD integration

### Open Questions for Feature Definition

- What external systems would actually push to these channels? GitHub Actions? Linear?
- Is anyone using Chester in contexts where CI/CD integration matters?
- Does this overlap with the scheduling/CronCreate capabilities?

---

## 7. Elicitation via MCP

### What It Is

MCP servers can request structured input from users through elicitation — presenting forms with typed fields (text, number, boolean, enum) that the user fills out. The response is returned to the MCP server, not to the agent.

### How It Would Work

Chester's enforcement and understanding MCP servers currently return scores and state to the agent, which then formulates questions for the user. With elicitation, the MCP server could directly request user input for specific decisions:

- Phase transition confirmation: "The understanding dimensions are broadly saturated. Ready to move from understanding to solving?" [Yes / No / Need more time on specific areas]
- Closure confirmation: "Design interview complete. Approve design brief?" [Approve / Continue / Specific concerns]
- Challenge mode response: structured input for how the user wants to respond to a challenge

### Key Details

- Elicitation bypasses the agent — it's a direct MCP-to-user interaction
- This could reduce agent token usage for confirmations (no need to formulate the question)
- But it also breaks the conversational flow — elicitation forms feel different from a conversation
- The agent doesn't see the elicitation happening, only the result

### Open Questions for Feature Definition

- Does structured elicitation feel natural in a Socratic interview, or does it break the conversational flow?
- Is the reduction in agent token usage worth the UX change?
- Which specific interactions benefit from structured input vs. free-form conversation?

---

## 8. Scheduled Regression Testing

### What It Is

Claude Code supports `CronCreate` for session-scoped recurring tasks and cloud-scheduled triggers for durable recurring jobs. These could run Chester's skill evaluations on a schedule.

### How It Would Work

After a skill is modified, a scheduled trigger runs the skill-creator evaluation suite (test prompts, assertions, grading) on a daily or weekly basis. Results are stored in the workspace directory. If a skill's eval scores drop below a threshold, the next session is notified.

### Key Details

- Session-scoped crons (`CronCreate`) expire after 7 days and only run while the session is active — not suitable for regression testing
- Cloud-scheduled triggers run durably but require remote agent infrastructure
- Desktop-scheduled triggers run locally with 1-minute minimum interval
- This is infrastructure, not a skill change — it would live outside the normal Chester pipeline

### Open Questions for Feature Definition

- Is automated regression testing for skills valuable enough to justify the infrastructure?
- How often do skills regress? Is this solving a real problem or a theoretical one?
- Would a simpler "run evals on commit" Git hook be more practical?
