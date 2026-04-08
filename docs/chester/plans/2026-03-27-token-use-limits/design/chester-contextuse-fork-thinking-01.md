# Thinking Summary: Chester Architecture Fork Decision

**Sprint:** token-use-limits
**Date:** 2026-03-28
**Sequence:** Follows token-use-limits-thinking-00 (reviewer consolidation analysis)
**Confidence:** 0.9 average across 4 captured decisions

## Context

The prior thinking session (thinking-00) and design brief (design-00) analyzed Chester's runtime token costs and proposed reviewer consolidation: merging per-task spec and quality reviewers into a single combined reviewer to reduce subagent launches from 43 to 27 for a 10-task plan, saving ~320K tokens.

During continued discussion, the conversation reframed the problem. The consolidation plan is a local optimization within an architecture whose fundamental cost driver — subagent proliferation — remains. This thinking summary captures the reframing and the resulting fork decision.

## Decision Sequence

### 1. Reframing: Subagents Are the Dominant Cost (score: 0.95)

The analysis from thinking-00 established that a full pipeline run spawns 43 subagents with ~860K tokens of baseline overhead before any productive work occurs. Each subagent pays ~20K tokens just to load the Claude Code system prompt, CLAUDE.md chain, and skill descriptions.

The reviewer consolidation saves ~320K (37% fewer launches), but the remaining 27 subagents still carry ~540K in baseline overhead. The problem is structural: the multi-agent architecture pays a fixed tax per agent that scales linearly with task count.

This led to the question: is the multi-agent architecture the right one for this user's context?

### 2. Subagents as Context Hygiene Tools (score: 0.9)

The discussion established that subagents serve a specific purpose: context hygiene. Each subagent starts with a clean context window, preventing cross-contamination between tasks. This is valuable when context is scarce — if the orchestrator's window fills up, accumulated context from prior tasks degrades performance on later tasks.

But the user's subscription provides a 1M token context window. Typical session utilization is around 15%. The context scarcity that justifies subagent isolation does not exist in this environment.

Research into context degradation indicates approximately 2% quality loss per 100K tokens of accumulated context. A 10-task plan executed inline might accumulate 300-400K tokens, reaching 30-40% utilization with roughly 6-8% degradation. This is well below the 50% threshold where degradation becomes operationally significant.

The conclusion: subagents are paying a 4-7x token multiplier to solve a context pollution problem that does not meaningfully exist at this user's scale.

### 3. Fork vs Incremental Optimization (score: 0.9)

Two paths forward were evaluated:

- **Incremental:** Continue optimizing the subagent architecture (reviewer consolidation, hardening consolidation, context accumulation mitigation). Each saves tokens but none addresses the fundamental overhead of per-agent baseline costs.
- **Fork:** Create a second Chester variant that eliminates per-task subagents entirely, executing tasks inline within the orchestrator's context window.

The user chose to fork. The reasoning:

- The incremental path has diminishing returns — the largest single optimization (reviewer consolidation) saves 37% of launches but only 37% of the overhead. Further consolidation yields smaller gains.
- The fork path eliminates the dominant cost entirely. A single-context executor pays the ~20K baseline once, not per task.
- The existing subagent architecture is not wrong — it is well-suited to environments where context is scarce or where isolation between tasks is critical (e.g., security-sensitive workflows, untrusted code). Keeping it as a variant preserves that option.
- The reviewer consolidation work (design-00, spec-00, plan-00) remains valid as an optimization for the subagent variant if it is ever needed.

### 4. Fork Structure (score: 0.85)

The fork creates two parallel Chester variants:

- **chester-subagents** (current main) — the existing multi-agent architecture, unchanged. Suitable for high-isolation workloads or environments with smaller context windows.
- **chester-singlecontext** — a new variant that shifts per-task execution from dispatched subagents to inline execution within one large context window.

What stays the same in both variants:

- The discovery pipeline: chester-figure-out, chester-build-spec, chester-build-plan. These are conversational skills that run in the main context by design.
- The hardening reviews: chester-attack-plan, chester-smell-code. These dispatch parallel agents where isolation genuinely adds value — adversarial reviewers should not share context with the plan they are attacking.
- The utility skills: chester-make-worktree, chester-dispatch-agents, chester-prove-work, chester-finish-plan.

What changes in chester-singlecontext:

- **chester-write-code** shifts from dispatcher-of-subagents to inline executor with periodic state checkpoints. The orchestrator executes each task directly, writing code, running tests, and verifying results within its own context.
- **Per-task review** shifts from fresh reviewer subagents to inline self-review with structured checklists. The combined reviewer template (from the consolidation work) is repurposed as a self-review checklist rather than a subagent prompt.
- **Error accumulation mitigation** relies on structured state checkpoints that Chester already produces (design briefs, specs, plans, task completion reports). These serve as "context anchors" that the inline executor can reference to maintain coherence across tasks.

## Open Questions

- What is the actual degradation curve for inline execution of a 10-task plan? The 2% per 100K estimate is from general research, not measured on Chester workloads. Needs empirical validation.
- Should the singlecontext variant include a context budget guard that switches to subagent dispatch if context utilization exceeds a threshold (e.g., 50%)? This would be a hybrid approach.
- How should the two variants be structured in the skills repo? Separate skill directories? A mode flag in the existing skills? This is a design question for the singlecontext design cycle.

## Cross-References

- Reviewer consolidation analysis → token-use-limits-thinking-00, token-use-limits-design-00
- Subagent baseline overhead measurement → token-use-limits-design-00 (860K for 43 agents)
- Token budget guard design → `docs/chester/2026-03-27-token-budget-guard/` (separate effort, complementary)
- Prior baseline optimization no-go → `docs/chester/2026-03-26-token-diet-skills/` (confirmed baseline not worth optimizing)
- Memory record of fork decision → `~/.claude/projects/-home-mike--claude-skills/memory/project_chester_fork.md`
