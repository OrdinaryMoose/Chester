# Skill Index

Reference for choosing between Chester skills. Read when multiple skills could apply to the
task at hand, or when you need to look up what a named skill does.

## Skill Priority

When multiple skills could apply, use this order:

1. **Gate skills first** (`design-large-task`, `design-small-task`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-close-worktree`) — these define the overall pipeline stage and determine HOW to approach the task
2. **Review skills second** (`plan-attack`, `plan-smell`, `util-codereview`) — these harden and validate the work
3. **Behavioral skills third** (`execute-test`, `execute-prove`) — these guide specific execution disciplines
4. **Utility skills fourth** (`util-worktree`, `util-dispatch`) — these support workflow mechanics

### Common Dispatch Patterns

- "Let's build X with architectural choices" → `design-large-task` first, then `plan-build`.
- "Quick design check for X" → `design-small-task` first, then `plan-build`.

## Skill Catalog

### Pipeline Skills (define the workflow stage)

- `setup-start` — Entry point; establishes the pipeline and skill usage rules (this skill)
- `start-bootstrap` — Mechanical session setup: config, sprint naming, dir creation, task reset, thinking history
- `design-large-task` — Default structural design skill: five outer phases (Bootstrap, Parallel Context Exploration, Round One, Interview Loop, Closure). Inside the Interview Loop, an Understand Stage runs under a nine-dimension saturation MCP, then a Solve Stage builds a formal proof of necessary conditions. Closure writes the design brief (the proof envelope) and transitions to design-specify. Architecture choice lives in design-specify, not here.
- `design-small-task` — Lightweight design conversation for well-bounded tasks. Surfaces considerations through structured Q&A, produces a brief for plan-build. No MCP, no spec step.
- `design-specify` — Formalize an approved design brief into a durable spec document. Two-architect competing-architecture review on dispatcher-assigned axes (with F-A-C self-check), automated fidelity review, inline adversarial review, and automatic codebase ground-truth verification (skipped only for greenfield specs) before plan-build.
- `plan-build` — Write and harden implementation plans; selects execution mode (subagent vs inline) via heuristic + human confirm at plan tail and records it in the plan header
- `execute-write` — Execute plans, request code review; reads the plan header's `Execution mode` field and runs Section 2 (subagent-driven) or Section 3 (inline), defaulting to subagent if the field is missing
- `execute-verify-complete` — Capstone of execution: prove tests, clean tree, checkpoint commit

### Finish Skills (close out a sprint)

- `finish-write-records` — Session summary, reasoning audit, cache analysis (also handles refactor summaries)
- `finish-archive-artifacts` — Copy working dir artifacts to tracked plans dir and commit
- `finish-close-worktree` — Branch integration (merge/PR/keep/discard) and worktree cleanup

### Review Skills (harden and validate)

- `plan-attack` — Adversarial review of plans for structural gaps, execution risks, and assumptions
- `plan-smell` — Forward-looking code smell analysis of an implementation plan
- `util-codereview` — Lightweight code smell review of existing code scoped to a directory or path

### Behavioral Skills (execution disciplines)

- `execute-test` — Test-driven development discipline
- `execute-prove` — Verification before completion

### Utility Skills (workflow mechanics and reference)

- `util-worktree` — Git worktree workflow for parallel branches
- `util-dispatch` — Dispatching parallel subagents
- `util-artifact-schema` — Artifact naming, versioning, and directory layout (read, don't invoke)
- `util-design-partner-role` — Canonical voice rules for design skills (Interpreter Frame, option-naming, self-evaluation, info-packet style overlay). Read, don't invoke.

Brief templates are **not** standalone skills — they live inside each design skill as references:

- `design-large-task/references/design-brief-template.md` — 8-section envelope (proof-driven briefs)
- `design-small-task/references/design-brief-small-template.md` — 6-section lightweight (bounded-task briefs)

### MCP Servers

- `chester-design-proof` (invoked inside `design-large-task`) — Solve Stage proof of necessary conditions
- `chester-design-understanding` (invoked inside `design-large-task`) — Understand Stage nine-dimension saturation scoring
