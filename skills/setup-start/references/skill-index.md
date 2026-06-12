# Skill Index

Reference for choosing between Chester skills. Read when multiple skills could apply to the
task at hand, or when you need to look up what a named skill does.

## Skill Priority

When multiple skills could apply, use this order:

1. **Gate skills first** (`design-small-task`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-close-worktree`) — these define the overall pipeline stage and determine HOW to approach the task
2. **Review skills second** (`plan-attack`, `plan-smell`, `util-codereview`) — these harden and validate the work
3. **Behavioral skills third** (`execute-test`, `execute-prove`) — these guide specific execution disciplines
4. **Utility skills fourth** (`util-worktree`, `util-dispatch`) — these support workflow mechanics

### Common Dispatch Patterns

- "Quick design check for X" → `design-small-task` first, then `plan-build`.
- "Convene the committee on X" / "ask the committee" / "get a multi-perspective read on X" → `design-committee` standalone (not pipeline-staged).

## Skill Catalog

- **design-committee** — Convene six-role committee (team-lead + 4 members + researcher) for ad-hoc design consultations. Process-agnostic primitive. Use whenever designer wants independent multi-perspective review of meta-architecture, cross-cutting design choice, charter call, or any decision where framing bias risks outcome. Triggers on "convene the committee", "ask the committee", "committee deliberation", "four-member review", "/design-committee", and natural-language asks for structured multi-perspective consultation.
- **design-grillme** — Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
- **design-small-task** — Lightweight design conversation for well-bounded tasks. Use when the task is clear but you want to surface considerations before jumping to planning. Holds an interactive Q&A loop with structured information packages — the agent presents observations and asks questions, never suggests proceeding. The designer explicitly directs when to write the brief. Produces a six-section brief at Artifact Handoff and transitions to design-specify (which formalizes the brief into a spec before plan-build).
- **design-specify** — Formalize an approved design brief into a durable spec document. Use when a design brief exists (from design-small-task, a whiteboard, a previous session, or a human-written brief) and needs to be written as a formal spec with competing-architecture review, automated fidelity review, and codebase ground-truth verification before plan-build.
- **execute-prove** — Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
- **execute-test** — Use when implementing any feature or bugfix, before writing implementation code
- **execute-verify-complete** — Capstone of the execute phase. Invoke after all implementation tasks are done — proves tests pass, verifies a clean tree, and marks execution complete with a checkpoint commit. This is the gate between building and finishing. Nothing past this point is about writing code. Use when execute-write completes all tasks, or when any implementation work is done and you're ready to move to the finish phase.
- **execute-write** — Use when you have a written implementation plan to execute — reads the plan's `Execution mode` header field (subagent or inline) and runs the matching section, with review checkpoints
- **finish-archive-artifacts** — Copy all sprint artifacts from the gitignored working directory into the worktree's tracked plans directory and commit them. This creates the permanent record that gets merged with the code. Invoke after finish-write-records (or after execute-verify-complete if skipping records).
- **finish-close-worktree** — Final step of the finish phase. Presents four options for branch integration (merge locally, create PR, keep as-is, discard), executes the chosen option, and cleans up the worktree. Use after finish-archive-artifacts has committed all sprint artifacts.
- **finish-write-records** — Produces session documentation after Chester work session — session summary and reasoning audit. Use when: "summarize what we did", "write the summary", "session report", "reasoning audit", "document this session", or at natural session end points. Also trigger proactively.
- **plan-attack** — Adversarial review of implementation plans. Single-pass review that finds structural integrity gaps, execution risks, unstated assumptions, contract gaps, and concurrency hazards. Auto-triggers as part of plan-build's plan hardening gate. Can also be invoked manually via: "attack this plan", "adversarial review", "red-team this", "find the weaknesses", "stress test the plan", "what could go wrong", "/plan-attack".
- **plan-build** — Use when you have a spec or requirements for a multi-step task, before touching code
- **plan-smell** — Forward-looking code smell analysis of an implementation plan. Single-pass review that identifies structural smells, coupling risks, and change-prevention patterns the plan would introduce into the codebase. Auto-triggers as part of plan-build's plan hardening gate. Can also be invoked manually via: "smell review", "code smell check", "will this introduce smells", "smell analysis", "check the plan for smells", "/plan-smell".
- **setup-start** — Use when starting any conversation - establishes how to find and use Chester skills, requiring Skill tool invocation before ANY response including clarifying questions
- **start-bootstrap** — Mechanical session setup for pipeline skills. Invoke this skill at the start of any pipeline skill that needs a sprint context — config reading, sprint naming, directory creation, task reset, and thinking history initialization. Called by design-small-task (always, at the start of a design sprint) and by design-specify and execute-write (standalone, when invoked without a prior design phase).
- **util-artifact-schema** — Single source of truth for Chester's artifact naming, versioning, directory layout, and path resolution. Read this skill (don't invoke it) whenever you need to create, find, or reference a Chester artifact — design briefs, specs, plans, summaries, audits, or any other sprint artifact. If you're about to write a file path or filename for a Chester artifact, check here first.
- **util-codereview** — Code smell review of existing code scoped to a directory, namespace, or path. Single-pass review that finds structural smells, practical bugs, and architectural concerns with file:line evidence. Invoke via: "review code in src/", "smell check this directory", "code review src/billing", "what smells exist in lib/", "/util-codereview".
- **util-design-partner-role** — Canonical rules for the Design Partner voice — the Interpreter Frame, read-aloud discipline, option-naming rule, self-evaluation game, and the session-scoped info-packet style overlay (verbosity ladder, composition, directive protocol). Read this skill (don't invoke it) when running design-small-task. The voice rules live here so the discipline stays in one place.
- **util-dispatch** — Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
- **util-handoff** — Compact the current conversation into a handoff document for another agent to pick up.
- **util-improve-codebase** — Find deepening opportunities in a codebase, informed by the domain language in CONTEXT.md and the decisions in docs/adr/. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable and AI-navigable.
- **util-skill-writing-rules** — Line-format rules for Chester skill files and references that get read whole into an agent's context. Read this skill (don't invoke it) before writing or reflowing a SKILL.md, a references/*.md, an agents/*.md, or an artifact template. If you're about to wrap prose to a column width in an agent-read Markdown file, check here first. Also defines the companion authoring rule: one concept is one sentence.
- **util-worktree** — Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification

Brief templates are **not** standalone skills — they live inside each design skill as references:

- `design-small-task/references/design-brief-small-template.md` — 6-section lightweight (bounded-task briefs)
