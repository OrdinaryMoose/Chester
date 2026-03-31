# Chester

Chester is a Claude Code skill set that walks the designer through a structured development workflow: identify the problem, socratic interview to create the design → build and test the specification → write an implementation plan → plan adversarial review → TDD code writing and checking → close out and document what we did. It was built to create a shared vision between the developer and agent; to close the gap between what a developer intends and what an agent builds.

Chester takes inspiration from Obra/Superpowers and Mattpocock/grill-me

## The problem

AI-assisted development fails most often not because the agent can't write code, but because it's working from an incomplete or misread problem statement. Chester front-loads the work of building shared understanding before any code is written.

## How it works

Chester starts every sprint with a structured design interview. It reviews the codebase and 
your prompt, establishes a baseline problem statement, then asks targeted questions one at a 
time to surface assumptions and constraints. The result is a design brief that accurately 
reflects what needs to be built — not just what was asked for.

From the brief, Chester generates a specification, then an implementation plan. Six parallel 
review agents immediately stress-test the plan for flawed assumptions, execution risks, and 
structural problems. The plan is revised, risks are assessed, and nothing runs until you 
approve it.

Implementation is task-by-task: failing test first, code to pass it, commit, repeat. Each 
task is reviewed before the next begins.

Every session produces a full paper trail: the problem statement, interview record, design 
specification, implementation plan, adversarial findings, session summary, and a decision 
audit explaining why the code works the way it does.

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

## Installation
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

**Verify installation:** Ask Claude to build something. It should initiate a design interview 
rather than writing code immediately.

### MCP server (optional)

Chester works with the **Structured Thinking** MCP server, which captures decision trees 
during design and planning. The full pipeline runs without it — reasoning checkpoints are 
less granular.

## Contributing

Each skill is a folder with a `SKILL.md` and optional subagent templates. Fork the repo, 
create or modify a skill, submit a PR.

## License

MIT
