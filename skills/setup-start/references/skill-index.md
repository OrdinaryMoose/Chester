# Skill Index

Pick Chester skill.
Read when many skills could apply, or to look up a named skill.

## Pipeline

Five phases.
Gate skill enters each.

- **Design** → `design-small-task` or `design-committee`.
- **Spec** → `spec-architect` → `spec-write` → `spec-harden`.
- **Plan** → `plan-build` (wraps `plan-attack` + `plan-smell` in hardening gate).
- **Execute** → `execute-write` → `execute-verify-complete`.
- **Finish** → `finish-write-records` → `finish-archive-artifacts` → `finish-close-worktree`.

## Design skills

Pick by problem shape, not size.

- `design-small-task` — bounded single-concern problem; makes 6-section brief.
- `design-committee` — 6-role multi-perspective deliberation; use when framing bias risks outcome; standalone primitive, no auto-transition.
- `design-grillme` — adversarial interview; stress-tests existing plan or design; not a gate.

## Spec skills

3 skills.
Design entry path decides if first runs.

- `spec-architect` — settles architecture for FAC-incomplete design; small-task path only; committee path skips.
- `spec-write` — authors spec from FAC-complete design; both paths; no review passes.
- `spec-harden` — 3 review passes (fidelity, adversarial, ground-truth) + user gate → `plan-build`.

Two paths into plan:

- Small-task → `design-small-task` → `spec-architect` → `spec-write` → `spec-harden` → `plan-build`.
- Committee → `design-committee` → (designer routes verdict) → `spec-write` → `spec-harden` → `plan-build`.

## Skill Priority

Many skills apply → use this order.

1. **Gate skills first** — design skill for problem, then `spec-architect` / `spec-write` / `spec-harden`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-*`; set pipeline stage + HOW to approach.
2. **Review skills second** — `plan-attack`, `plan-smell`, `util-codereview`; harden + validate.
3. **Behavioral skills third** — `execute-test`, `execute-prove`; execution discipline.
4. **Utility skills fourth** — `util-worktree`, `util-dispatch`, `util-handoff`, read-only `util-*` refs; workflow mechanics.

### Dispatch patterns

- "Quick design check for X" → `design-small-task` → small-task path → `plan-build`.
- "Convene the committee on X" / "ask the committee" → `design-committee` standalone (not pipeline-staged).
- "Grill me on this plan" / "stress-test this design" → `design-grillme`.
- "Already have settled architecture or committee verdict" → skip to `spec-write`.

## Skill Catalog

- **design-committee** — Convene six-role committee (team-lead + 4 members + researcher) for ad-hoc design consultations. Process-agnostic primitive. Use whenever designer wants independent multi-perspective review of meta-architecture, cross-cutting design choice, charter call, or any decision where framing bias risks outcome. Triggers on "convene the committee", "ask the committee", "committee deliberation", "four-member review", "/design-committee", and natural-language asks for structured multi-perspective consultation.
- **design-grillme** — Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
- **design-small-task** — Lightweight design conversation for well-bounded tasks. Use when the task is clear but you want to surface considerations before jumping to planning. Holds an interactive Q&A loop with structured information packages — the agent presents observations and asks questions, never suggests proceeding. The designer explicitly directs when to write the brief. Produces a six-section brief at Artifact Handoff and transitions to spec-architect (which settles architecture, then spec-write authors and spec-harden hardens the spec before plan-build).
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
- **spec-architect** — Settle the architecture for a FAC-incomplete design before spec authoring. Use when a design brief from design-small-task exists but its architecture is not yet settled — runs competing-architecture review (two code-architect axes + prior-art explorer), F-A-C self-checks, and a user-selection gate, producing a FAC-complete design. Invoked only on the small-task path; the committee path skips it. Transitions to spec-write.
- **spec-harden** — Harden a spec through three review passes — fidelity, adversarial, ground-truth — then a user gate. Use after spec-write in the normal pipeline (the adversarial pass inherits authoring context by agent continuity), or invoke standalone on any spec ad-hoc to give it a full three-pass review. Fixes findings inline, writes the ground-truth report, gates on user approval, and transitions to plan-build.
- **spec-write** — Author a spec document from a FAC-complete design. Use when the architecture is already settled — by a design-committee complete-design document or a spec-architect output. Reads the eight-field FAC-complete-design contract (labeled fields on the committee path, extraction on the spec-architect path), quotes back the chosen-architecture field for confirmation, fills the spec template, and emits the spec. Authors only — runs no review passes. Invoked by both entry paths; transitions to spec-harden.
- **start-bootstrap** — Mechanical session setup for pipeline skills. Invoke this skill at the start of any pipeline skill that needs a sprint context — config reading, sprint naming, directory creation, task reset, and thinking history initialization. Called by design-small-task (always, at the start of a design sprint) and by spec-architect, spec-write, spec-harden, and execute-write (standalone, when invoked without a prior design phase).
- **util-artifact-schema** — Single source of truth for Chester's artifact naming, versioning, directory layout, and path resolution. Read this skill (don't invoke it) whenever you need to create, find, or reference a Chester artifact — design briefs, specs, plans, summaries, audits, or any other sprint artifact. If you're about to write a file path or filename for a Chester artifact, check here first.
- **util-codereview** — Code smell review of existing code scoped to a directory, namespace, or path. Single-pass review that finds structural smells, practical bugs, and architectural concerns with file:line evidence. Invoke via: "review code in src/", "smell check this directory", "code review src/billing", "what smells exist in lib/", "/util-codereview".
- **util-design-partner-role** — Canonical rules for the Design Partner voice — the Interpreter Frame, read-aloud discipline, option-naming rule, self-evaluation game, and the session-scoped info-packet style overlay (verbosity ladder, composition, directive protocol). Read this skill (don't invoke it) when running design-small-task. The voice rules live here so the discipline stays in one place.
- **util-dispatch** — Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
- **util-handoff** — Compact the current conversation into a handoff document for another agent to pick up.
- **util-improve-codebase** — Find deepening opportunities in a codebase, informed by the domain language in CONTEXT.md and the decisions in docs/adr/. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable and AI-navigable.
- **util-skill-writing-rules** — Line-format rules for Chester skill files and references that get read whole into an agent's context. Read this skill (don't invoke it) before writing or reflowing a SKILL.md, a references/*.md, an agents/*.md, or an artifact template. If you're about to wrap prose to a column width in an agent-read Markdown file, check here first. Also defines the companion authoring rule: one concept is one sentence.
- **util-worktree** — Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification

Brief templates not standalone skills — live inside each design skill as references:

- `design-small-task/references/design-brief-small-template.md` — 6-section lightweight (bounded-task briefs).
