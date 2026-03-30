# Chester

Chester is a complete development workflow for Claude Code, built on a set of skills that load automatically and trigger based on context. It was inspired by [Superpowers](https://github.com/obra/superpowers) and the decision-tree interview approach from [Grill-Me](link).

The problem it solves is building a shared understanding of the proposed code revisions or refactoring. Before Chester, I'd have something in mind, Claude would have an interpretation, and we'd only discover the gap once there was code to look at.

Chester starts by reviewing the current codebase and your initial prompt to come up with a baseline problem statement.  Once that is agreed up, Chester asks a series of questions one at a time walking through the entire decision tree to really understand what is going on and what needs to be build.  Think of it as the digital equivalent to a whiteboard session. This iterative question and answer process organically filters past what you think you wanted to build, and gets down to what you really need. This conversation is then distilled to become the design specification for your sprint (or whatever you call it).

From the specification, Chester builds an implementation plan and then immediately tries to break it. A set of parallel review agents picks it apart for flawed assumptions, execution risks, and structural problems. The plan gets revised, the risks get assessed, and you decide whether to proceed. Nothing runs until you say so.

When you do, Chester works through the plan task by task — writing a failing test first, then the code to pass it, then committing and moving on. Each task gets reviewed before the next one starts. It's a slow way to go fast.

Along the way, Chester writes everything down. The problem definition, a record of the interview and key insights, the specification, the imlementation plan along with the adversarial analysis findings, and afterwards a summary of what the agent actually did, the reasons why they did it, and any deferments from the plan are all saved as readable documents. 

When you come back to this code in six months, or someone else does, there's a record of why it works the way it does.

## Installation

Clone this repo into your Claude Code skills directory:

```bash
git clone https://github.com/OrdinaryMoose/Chester.git ~/.claude/skills
```

Add the session-start hook to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "~/.claude/skills/chester-hooks/session-start"
      }
    ]
  }
}
```

Start a new Claude Code session. Chester loads automatically.

### Verify installation

Ask Claude to build something. Instead of writing code, it should ask what you're trying to do and announce it's using the `chester-figure-out` skill.

### MCP server (optional)

Chester works best with one MCP server:

- **Structured Thinking** — captures decision trees during design and planning

This is optional. Without it the full pipeline still runs — the reasoning checkpoints are just less granular.

## Skills

### Pipeline

| Skill | What it does |
|-------|-------------|
| `chester-start` | Loads Chester into every session via the startup hook |
| `chester-figure-out` | Socratic design interview with live visual companion |
| `chester-build-spec` | Turns the design brief into a reviewed, approvable spec |
| `chester-build-plan` | Breaks the spec into TDD tasks and stress-tests the plan |
| `chester-write-code` | Subagent-driven implementation with per-task review |
| `chester-finish-plan` | Final verification, doc-sync, and merge/PR options |

### Review

| Skill | What it does |
|-------|-------------|
| `chester-attack-plan` | Six parallel agents that try to break your plan |
| `chester-smell-code` | Four parallel agents that predict code smells |

### Development discipline

| Skill | What it does |
|-------|-------------|
| `chester-test-first` | Enforces TDD: failing test before any code |
| `chester-fix-bugs` | Root cause investigation before any fix attempt |
| `chester-prove-work` | Runs verification fresh before claiming it works |
| `chester-review-code` | Handles code review feedback with technical rigor |

### Utilities

| Skill | What it does |
|-------|-------------|
| `chester-make-worktree` | Sets up isolated git worktrees for feature work |
| `chester-dispatch-agents` | Coordinates parallel subagents |
| `chester-doc-sync` | Detects stale documentation after implementation |
| `chester-write-summary` | Session summary with plan archival |
| `chester-trace-reasoning` | Decision audit from session transcript |

## Contributing

Each skill is a folder with a `SKILL.md` and optional subagent templates.

1. Fork the repository
2. Create or modify a skill
3. Submit a PR

## License

MIT
