# 3. Chester: System Under Analysis

This section introduces Chester as the subject system for the applied analysis. It describes the pipeline architecture, multi-agent design, and cost structure in enough detail that a reader who has never used Chester can follow the per-stage assessments in Section 4 and the trace analysis in Section 5.

## What Chester Does

Chester is a development workflow system built as a skill layer on top of Claude Code, Anthropic's CLI agent. It replaces the common pattern of asking an AI agent to "build this feature" with a structured pipeline that separates discovery, specification, planning, adversarial review, implementation, and verification into distinct stages. Each stage produces a written artifact — a design brief, a specification, an implementation plan, task-level reports — that becomes the input to the next stage.

The system is designed for a solo developer working with Claude Code on a personal or small-team codebase. It prioritizes correctness and auditability over speed: the pipeline imposes human approval gates at three points (design sign-off, spec approval, plan approval with risk assessment), and every stage commits its artifacts to version control before proceeding. A typical Chester run for a ten-task feature takes two to four hours of wall-clock time, most of it unattended.

## Pipeline Architecture

Chester's pipeline consists of five core stages that execute in strict sequence, supported by review skills and utility skills that are invoked within specific stages.

### Core Pipeline

**chester-figure-out** conducts a Socratic design interview. The agent acts as a software architect, asking one question per turn from six question types (clarifying, assumption-probing, evidence/reasoning, viewpoint/perspective, implication/consequence, meta). The interview produces a design brief documenting all resolved decisions and their rationale. This stage requires active human participation — it is the primary mechanism for aligning the agent's understanding to the developer's intent.

**chester-build-spec** formalizes the design brief into a structured specification. The spec goes through an automated review loop (up to three iterations with a subagent reviewer) followed by a human approval gate. The spec covers architecture, components, data flow, error handling, testing strategy, constraints, and non-goals. Nothing proceeds until the human approves.

**chester-build-plan** transforms the approved spec into a task-by-task implementation plan. Each task specifies exact file paths, complete code (not pseudocode or stubs), test-driven development steps, and shell commands with expected output. After an internal review loop, the plan enters a mandatory hardening gate where chester-attack-plan and chester-smell-code run in parallel to stress-test it. The combined risk assessment is presented to the human, who decides whether to proceed, request mitigations, return to design, or stop.

**chester-write-code** executes the approved plan. In its recommended mode, it dispatches a fresh subagent for each task, followed by two review subagents (spec compliance and code quality). All work happens in a git worktree isolated from the main branch. Each task is committed independently before proceeding to the next.

**chester-finish-plan** runs the full test suite, checks for stale documentation, and presents the developer with options: merge locally, open a pull request, keep the branch, or discard it. It also generates a session summary and archives the plan alongside the design artifacts.

### Review Skills

Two review skills provide adversarial analysis during the plan hardening gate:

**chester-attack-plan** launches six parallel subagents, each attacking the plan from a different angle: structural integrity (do the file paths and interfaces actually exist?), execution risk (what breaks if a step fails partway?), assumptions and edge cases (what does the plan take for granted?), migration completeness (are all call sites accounted for?), API surface compatibility (do contract changes break downstream callers?), and concurrency/thread safety (are there race conditions or deadlock risks?). Each agent searches the actual codebase for evidence — findings without file paths and line numbers are discarded. The six reports are synthesized into a single threat report with a combined risk level.

**chester-smell-code** launches four parallel subagents that predict code smells the plan would introduce: bloaters and dispensables (long methods, duplicate code, speculative generality), couplers and OO abusers (feature envy, inappropriate intimacy, refused bequest), change preventers (divergent change, shotgun surgery), and SOLID violations. Overlapping findings across agents are deduplicated during synthesis.

### Development Discipline Skills

Three skills enforce development discipline at the task level:

**chester-test-first** enforces test-driven development: the failing test must exist before any implementation code is written. **chester-fix-bugs** requires root cause investigation before any fix attempt. **chester-prove-work** requires running verification commands and confirming output before claiming work is complete.

### Utility Skills

**chester-dispatch-agents** provides the parallel coordination pattern used by attack-plan, smell-code, and write-code. **chester-doc-sync** detects documentation that has gone stale after implementation changes. **chester-make-worktree** creates the isolated git worktree where all implementation work happens. **chester-review-code** handles code review feedback with verification requirements. **chester-write-summary** and **chester-trace-reasoning** produce end-of-session documentation.

## Multi-Agent Design

Chester's architecture is fundamentally multi-agent. Rather than maintaining a single long-running context that accumulates all pipeline state, Chester dispatches specialized subagents with narrow scope and reviews their output before proceeding.

### Subagent Model in Write-Code

For each task in the implementation plan, chester-write-code dispatches three subagents sequentially:

1. An **implementer** subagent receives the full task description, architectural context, and dependencies. It writes code, writes tests, runs them, and commits. It returns a status code (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED) and a report of what it did.
2. A **spec compliance reviewer** receives the task requirements and the implementer's report. It verifies that the implementation matches the spec and that the commit history is clean.
3. A **code quality reviewer** receives the implementation and checks for critical issues (must fix), important issues (should fix), and minor issues (note and move on).

Each subagent starts with a fresh context. The implementer does not inherit the previous task's conversation history. The reviewers do not inherit the implementer's reasoning — they receive only the artifacts (code, tests, commits, reports).

### Parallel Dispatch in Review Skills

chester-attack-plan dispatches six agents simultaneously, each with a different attack mission. chester-smell-code dispatches four agents simultaneously, each focused on a different smell category. All review agents operate in read-only mode (they search and read the codebase but cannot modify files). Their findings are synthesized by the orchestrating agent after all parallel agents return.

### Context Isolation

Every subagent starts with approximately 20,000 tokens of baseline context: the system prompt, skill instructions, and task-specific payload. This is by design. A fresh context means no accumulated confusion from prior tasks, no context window pressure from irrelevant history, and independent verification — each reviewer forms its own assessment without being anchored by the implementer's framing.

### Structured Checkpoints

The pipeline stages connect through written artifacts, not shared context:

- chester-figure-out produces a **design brief** (written to disk, committed)
- chester-build-spec produces a **specification** (written to disk, committed)
- chester-build-plan produces an **implementation plan** (written to disk, committed)
- chester-write-code produces **per-task commit reports** (tracked in the orchestrator's context)
- chester-finish-plan produces a **session summary** (written to disk, committed)

Each artifact is the complete interface between stages. A stage reads the previous artifact from disk; it does not depend on conversational context from the previous stage's session.

## Cost Structure

The multi-agent design carries a measurable token overhead. Each subagent invocation loads roughly 20,000 tokens of baseline context regardless of task complexity.

For a typical ten-task implementation plan, chester-write-code dispatches:

- 10 implementer subagents
- 10 spec compliance reviewers
- 10 code quality reviewers
- 1 final code reviewer
- Plus 6 attack-plan agents and 4 smell-code agents during plan hardening
- Plus 2 spec review agents during build-spec

That is approximately 43 subagent invocations. At 20,000 tokens of baseline overhead each, the structural cost is roughly 860,000 tokens before any task-specific work begins. Actual runs are higher: implementer subagents consume additional tokens proportional to task complexity, and review agents consume tokens proportional to the code they read.

This is the core tradeoff Chester makes: it pays a significant token cost in exchange for context isolation, independent verification, and failure containment. A single-context alternative could complete the same work with lower total token consumption but would face context degradation (see D(U) in Section 2), accumulated confusion across tasks, and no independent review.

Whether this tradeoff is favorable depends on where the system sits across the five diagnostic dimensions. The per-stage assessments in Section 4 evaluate this systematically.

## Pipeline Stages Under Analysis

The following table lists all thirteen stages assessed in this paper.

| Stage | Function |
|---|---|
| chester-figure-out | Socratic design interview with human; produces design brief |
| chester-build-spec | Formalizes design into reviewed specification |
| chester-build-plan | Creates task-level implementation plan with TDD steps |
| chester-write-code | Dispatches per-task implementer and reviewer subagents |
| chester-finish-plan | Final verification, documentation sync, merge/PR decision |
| chester-attack-plan | Six parallel agents stress-testing plan feasibility |
| chester-smell-code | Four parallel agents predicting introduced code smells |
| chester-test-first | Enforces failing test before implementation code |
| chester-fix-bugs | Requires root cause investigation before any fix |
| chester-prove-work | Requires verification evidence before success claims |
| chester-review-code | Handles code review feedback with technical rigor |
| chester-dispatch-agents | Parallel subagent coordination pattern |
| chester-doc-sync | Detects stale documentation after implementation |
