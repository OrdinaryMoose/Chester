# Chester

A complete development workflow for Claude Code. Chester is a set of 17 skills that guide your agent through design, planning, implementation, and review — so it doesn't just jump into writing code before understanding what it's building.

## How it works

It starts the moment you fire up Claude Code. When you ask it to build something, Chester steps back and asks you what you're actually trying to do. It runs a Socratic interview — one question at a time — surfacing implicit design decisions and probing assumptions until the design is solid.

Once you've signed off on the design, Chester formalizes it into a spec (with automated review), then builds a task-by-task implementation plan. Before you can say "go," that plan gets attacked by 10 parallel agents looking for structural flaws, execution risks, hidden assumptions, and code smells it would introduce.

When you do say "go," Chester launches subagents to work through each task in an isolated git worktree. Every task follows TDD — failing test first, minimal code to pass, commit. Each task gets reviewed for spec compliance and code quality before moving on.

When the work is done, Chester verifies everything actually passes (no "it should work"), checks your docs for staleness, and gives you four options: merge, PR, keep the branch, or discard. It's not uncommon for Claude to work autonomously for a couple hours without drifting from the plan.

## Installation

Clone this repo into your Claude Code skills directory:

```bash
git clone https://github.com/OrdinaryMoose/Chester.git ~/.claude/skills
```

Add the session-start hook to your Claude Code settings (`~/.claude/settings.json`):

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

Start a new Claude Code session. Chester loads automatically — skills trigger based on context, so you don't need to do anything special.

### Verify installation

Ask Claude to build something. Instead of immediately writing code, it should ask you what you're trying to do and announce it's using the `chester-figure-out` skill.

### MCP servers (optional)

Chester works best with two MCP servers for structured reasoning:

- **Structured Thinking** — captures decision trees during design and planning
- **Think Tool** — per-step reasoning gates during implementation and debugging

These are optional but recommended. Without them, Chester still follows the full pipeline, but the reasoning checkpoints are less granular.

## The workflow

1. **figure-out** — Socratic dialogue to explore what you're building. Asks one question at a time, tracks decisions, writes a design brief. Includes a visual companion that renders live HTML mockups in your browser.

2. **build-spec** — Turns the design brief into a formal spec. An automated reviewer checks it for completeness and consistency (up to 3 iterations) before you approve.

3. **build-plan** — Breaks the spec into bite-sized TDD tasks, then hardens the plan:
   - 6 adversarial agents attack it (structural integrity, execution risk, assumptions, migration gaps, API compatibility, concurrency)
   - 4 code smell agents predict what smells it would introduce (bloaters, couplers, change preventers, SOLID violations)
   - You see the combined risk assessment and decide: proceed, mitigate, redesign, or stop.

4. **write-code** — Executes the plan task-by-task via subagents in an isolated git worktree. Each task gets a spec compliance review and a code quality review. Commits after each task. Out-of-scope ideas go to a deferred items file, not into the code.

5. **finish-plan** — Runs the full test suite fresh, checks for clean working tree, runs doc staleness detection, and presents options: merge locally, create a PR, keep the branch, or discard.

## What's inside

### Pipeline skills
| Skill | Purpose |
|-------|---------|
| `chester-start` | Loads the skill system into every session via hook |
| `chester-figure-out` | Socratic design discovery with visual companion |
| `chester-build-spec` | Formalize design into spec with automated review |
| `chester-build-plan` | Spec to implementation plan with adversarial hardening |
| `chester-write-code` | Subagent-driven execution with per-task review |
| `chester-finish-plan` | Verification, doc-sync, merge/PR options |

### Review skills
| Skill | Purpose |
|-------|---------|
| `chester-attack-plan` | 6 parallel agents that try to break your plan |
| `chester-smell-code` | 4 parallel agents that predict code smells |

### Development discipline
| Skill | Purpose |
|-------|---------|
| `chester-test-first` | TDD — write the failing test before the code |
| `chester-fix-bugs` | Root cause investigation before any fix attempt |
| `chester-prove-work` | Run verification fresh before claiming anything works |
| `chester-review-code` | Handle code review feedback with technical rigor |

### Utilities
| Skill | Purpose |
|-------|---------|
| `chester-make-worktree` | Isolated git worktrees for feature work |
| `chester-dispatch-agents` | Coordinate parallel subagents |
| `chester-doc-sync` | Detect stale documentation after implementation |
| `chester-write-summary` | Session summary with plan archival |
| `chester-trace-reasoning` | Decision audit from session transcript |

## Philosophy

Chester enforces three rules that don't bend:

- **Write the test first.** If you didn't watch it fail, you don't know if it tests the right thing.
- **Find root cause first.** Random fixes waste time and create new bugs.
- **Verify before claiming.** "It should pass" is not evidence.

The pipeline exists because the most expensive bugs are when you build the wrong thing correctly. The adversarial reviews exist because plans that survive attack are plans worth executing.

## Contributing

Each skill is a folder with a `SKILL.md` file and optional subagent templates. To contribute:

1. Fork the repository
2. Create or modify a skill
3. Submit a PR

## License

MIT
