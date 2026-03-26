# Chester

The real Chester is a rescued German Shepherd that has become a best friend. So, much like a humans in real life that needs a companion, Claude also has a best friend in Chester that just makes things better. 
The Chester Claude companion is a complete development workflow for Claude Code that really focuses you on understanding the actual problem you are trying to solve, works through all of the design considerations, and presents you with an actually useful implementation plan that the agent workflows can reliably execute.

And when everything is finished, a record of your thought process and decisions, the design specification, the plan you developed, and session summaries of what the agent actually did are recorded in detail. No more wondering about what the black box actually did — Chester helps you figure this out by documenting everything extensively.

---

## The workflow

### Figure out what you're building

To start off, Chester helps you figure things out. So literally ask Chester to "figure-out" what your next thing should be. Something like "Help me figure out how to add different sorting options for my user interface tree view", or "Figure out a better way to track the orders versus inventory" or whatever. Chester helps you sharpen your thoughts through a quick codebase review and presents you with a refined problem statement. Once you are good with the problem you are really trying to address and Chester understands it, he then goes to an interactive interview process (thanks [Grill-Me](link) for the inspiration) using a modified Socratic method with a series of questions. The questions really dig into what you are envisioning and help align the AI model to your ideas. This is surprisingly conversational and I have found that answering a question with a question works well. All of this leads Chester to help you and the agent come to a **shared understanding** of what you intend to do, refactor, build, update, or whatever.

### Build the specification

Once you've signed off on the design it is documented, and Chester moves to creating the specification. Chester formalizes your idea into a written specification that goes through an automated review process followed by a human review and approval. The [SuperPowers](link) skill set was a big inspiration here — Chester uses the [Structured Thinking](link) and [Think Tool](link) MCPs inline so the model is actually reasoning through the spec rather than just generating it.

### Create and stress-test the plan

Chester then uses an adversarial review process to create a plan, pick it apart for flaws, risks, and code smells that would cause problems. With the problems identified, Chester iterates the plan to resolve issues, assesses the risk in implementing it, and presents the whole thing to you for a final decision. You can proceed, ask Chester to mitigate specific risks, go back and redesign something, or just stop. Nothing runs until you say go.

### Execute — and go do something else

This is the part where I walk away. Once you approve the plan, Chester dispatches subagents to work through each task one at a time. Each task runs in its own contained workspace, follows the same sequence every time — write a failing test, write the code to pass it, commit, review — and doesn't move on until that review passes. Any ideas that surface during implementation that weren't in the plan go to a deferred items file, not into the code. Chester keeps its head down and works the plan.

Come back when it's done. It's not unusual for Chester to work for a couple of hours without drifting.

### Testing — the part I trust Chester most on

Honestly, writing tests first wasn't something I was consistent about before Chester. Now I don't have to think about it. Chester enforces it: the failing test gets written before a single line of implementation code. If it didn't fail first, you don't actually know if it's testing what you think it's testing. Chester knows this and won't skip it.

Every task in the plan gets a spec compliance review and a code quality review before moving on. By the time the full run is done, you have a test suite that was built alongside the code, not bolted on after.

### Worktrees — Chester's workspace, your choice

Chester does all its implementation work in a git worktree — a separate checkout of your repository that runs alongside your main branch without touching it. Your working code stays clean while Chester builds in isolation. If something goes wrong or you just don't like what it produced, you haven't lost anything.

How that worktree gets resolved at the end is up to you. Chester will ask.

### Finish and record everything

When the work is done, Chester doesn't just hand you the code and disappear. It runs the full test suite clean, checks that the working tree is tidy, and scans for any documentation that's gone stale since the implementation changed things. Then it gives you four options: merge locally, open a PR, keep the branch as-is, or discard it.

Either way, Chester writes it all up. The design brief, the spec, the plan, the risk assessment, and a session summary of what actually happened are all saved. Next time you come back to this part of the codebase — or next time someone else does — there's a record of why it works the way it does.

---

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

Ask Claude to build something. Instead of writing code, it should ask what you're trying to do and announce it's using the `chester-figure-out` skill.

### MCP servers (optional)

Chester works best with two MCP servers:

- **Structured Thinking** — captures decision trees during design and planning
- **Think Tool** — reasoning checkpoints during implementation and debugging

Both are optional, but recommended. Without them, the full pipeline still runs — the reasoning checkpoints are just less granular.

---

## What's inside

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

---

## Philosophy

Three rules that don't bend:

**Write the test first.** If you didn't watch it fail, you don't know if it tests what you think it tests.

**Find root cause first.** Random fixes waste time and create new bugs.

**Verify before claiming.** "It should pass" is not evidence.

The pipeline exists because the expensive bugs are the ones where you build the wrong thing correctly. The adversarial reviews exist because plans worth executing should be able to survive being attacked.

---

## Contributing

Each skill is a folder with a `SKILL.md` and optional subagent templates.

1. Fork the repository
2. Create or modify a skill
3. Submit a PR

## License

MIT
