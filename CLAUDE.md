# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Chester is a skill system for Claude Code — a collection of 17 structured skills that enforce a disciplined software development pipeline. Skills are loaded via the `Skill` tool and injected at session start via the `chester-hooks/session-start` hook.

## Architecture

### Skill Structure

Each skill lives in its own directory (`chester-{name}/`) containing:
- `SKILL.md` — the skill prompt (YAML frontmatter + markdown body)
- Optional subagent prompt templates (e.g., `spec-reviewer.md`, `implementer.md`)
- Optional scripts or reference docs

### The Pipeline

Skills form a five-stage pipeline where each stage gates the next:

```
chester-figure-out → chester-build-spec → chester-build-plan → chester-write-code → chester-finish-plan
```

1. **figure-out**: Socratic dialogue to explore design questions → produces design brief
2. **build-spec**: Formalizes design brief into spec document → automated spec-reviewer subagent loop (max 3 iterations)
3. **build-plan**: Writes TDD-based implementation plan → plan-reviewer subagent loop, then **mandatory hardening gate** that auto-launches `chester-attack-plan` (6 parallel agents) and `chester-smell-code` (4 parallel agents)
4. **write-code**: Executes plan task-by-task, preferably via subagent dispatch (implementer → spec-reviewer → quality-reviewer per task) → commits per task
5. **finish-plan**: Runs `chester-prove-work`, verifies clean tree, runs `chester-doc-sync`, presents merge/PR/keep/discard options

### Supporting Skills

| Category | Skills | Role |
|----------|--------|------|
| **Review** | `attack-plan`, `smell-code` | Adversarial and code-smell analysis (auto-triggered during build-plan) |
| **Behavioral** | `test-first`, `fix-bugs`, `prove-work`, `review-code` | Enforce TDD, root-cause debugging, verification-before-claims, and technical code review reception |
| **Utility** | `make-worktree`, `dispatch-agents`, `doc-sync`, `write-summary`, `trace-reasoning` | Git isolation, parallel work, doc staleness checks, session summaries, decision audits |

### Skill Priority (when multiple apply)

1. Gate skills (pipeline stages)
2. Review skills (attack-plan, smell-code)
3. Behavioral skills (test-first, fix-bugs, prove-work, review-code)
4. Utility skills (make-worktree, dispatch-agents, doc-sync)

### Output Directory Convention

Skills produce artifacts in a structured directory:
```
{output_dir}/
  design/   — design briefs, thinking summaries
  spec/     — formal spec documents
  plan/     — implementation plans
  summary/  — session summaries, reasoning audits, doc-sync reports
```

File naming: `{sprint-name}-{artifact}-{nn}.md` where `nn` is revision number (00, 01, etc.).

Frontmatter in spec/plan files carries `output_dir` and `sprint_prefix` so downstream skills inherit context.

### Visual Companion Server

`chester-figure-out/scripts/` contains a Node.js WebSocket server (`server.cjs`) that renders HTML mockups/diagrams in the browser during design sessions. User clicks are recorded to `.events` JSONL files. Managed via `start-server.sh` / `stop-server.sh`.

### Hook System

`chester-hooks/session-start` is a Bash script that injects `chester-start/SKILL.md` content into every new session via the SessionStart hook, ensuring skills are always available.

### MCP Dependencies

Skills rely on two MCP servers:
- **Structured Thinking** (`capture_thought`, `get_thinking_summary`, `revise_thought`, `retrieve_relevant_thoughts`) — used for decision gating in figure-out, build-spec, build-plan, attack-plan, smell-code
- **Think Tool** (`think`) — used for per-step reasoning gates in build-plan tasks, fix-bugs diagnostics, write-code subagent response handling

## Editing Skills

- Skills are markdown files, not code — there's no build step, linter, or test suite
- The `chester-start/SKILL.md` content is duplicated in `chester-hooks/session-start` as the hook's additional context — keep them in sync
- Subagent templates (e.g., `chester-write-code/implementer.md`) are injected verbatim into subagent prompts — they must be self-contained
- YAML frontmatter fields (`name`, `description`, `type`) in SKILL.md files are used by the Skill tool for matching and display
