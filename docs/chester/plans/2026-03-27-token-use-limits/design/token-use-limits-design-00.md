# Design Brief: Chester Runtime Token Reduction

**Sprint:** token-use-limits
**Date:** 2026-03-27
**Status:** Approved for specification

## Problem

Chester exceeds session token limits during plan execution. The primary cost driver is subagent launches — each carries ~20K tokens of baseline overhead (Claude Code system prompt + CLAUDE.md + skill descriptions). A full pipeline run for a 10-task plan spawns 43 subagents, costing ~860K tokens in baseline overhead alone before any work is done.

## Scope

Two complementary efforts to reduce subagent count:

1. **Hardening consolidation** (existing plan at `plan/agent-call-consolidation.md`): Reduce attack-plan from 6→3, smell-code from 4→2, doc-sync from 3→2. Saves ~120K per pipeline run.

2. **Reviewer consolidation** (this design): Merge the per-task spec compliance reviewer and code quality reviewer in chester-write-code into a single combined reviewer. Saves ~200K for a 10-task plan.

**Combined savings: ~320K tokens per pipeline run (37% reduction in subagent launches, 43→27).**

## Design Decisions

### Reviewer merge (chester-write-code)

- Current: 3 subagents per task — implementer, spec reviewer, quality reviewer
- Proposed: 2 subagents per task — implementer, combined reviewer
- The combined reviewer runs spec compliance first, then code quality in a single pass
- Output format preserves separate sections so the orchestrator can still parse by concern type
- Dispatch sequence: implementer returns → combined reviewer dispatched → severity-based action on findings
- The sequential gate is preserved: review only runs after implementer reports DONE

### Think tool / Sequential thinking replacement

- Think tool: already disabled by user. Gate questions in skills to be replaced with inline text instructions.
- Sequential thinking: MCP disconnected. Same treatment — inline the prompts.
- No code changes needed for these — they're already non-functional. Skill text cleanup is a separate housekeeping task.

### Task management — no change

- 30 calls per 10-task plan at ~30 tokens each = ~900 tokens total
- Not worth changing given subagent reduction saves ~320K
- User confirmed the task list visibility is useful

### Context accumulation — deferred

- Orchestrator context grows as task reports accumulate
- Potential cost driver but unmeasured
- Will analyze Sprint 052 diagnostic logs for actual data before designing a solution

## Artifacts to Produce

### New files
- `chester-write-code/combined-reviewer.md` — merged prompt template covering spec compliance + code quality

### Modified files
- `chester-write-code/SKILL.md` — Section 2.1 dispatch pattern changes from 3 subagents to 2; steps 3 and 4 merge into a single step
- `chester-write-code/quality-reviewer.md` — removed (merged into combined-reviewer)
- `chester-write-code/spec-reviewer.md` — removed (merged into combined-reviewer)

### Unchanged files
- `chester-write-code/implementer.md` — no changes
- `chester-write-code/code-reviewer.md` — full code review template (used at end of all tasks, not per-task); unchanged

## Out of Scope

- Baseline token optimization (no-go per 2026-03-26 decision)
- Reducing implementer subagent count (1 per task is the minimum)
- Context accumulation mitigation (deferred pending data)
- Think/Sequential skill text cleanup (housekeeping, separate effort)

## Risk

- Combined reviewer may be less thorough on each dimension than two dedicated reviewers. Mitigation: the prompt explicitly separates the two phases and requires findings from both before reporting.
- If combined reviewer prompts grow too large, the baseline savings shrink. Mitigation: the two existing reviewer prompts are small; combined prompt should be well under the ~20K baseline it saves.

## Validation

- After implementation, run a plan execution and compare subagent count and token usage against Sprint 052 baseline
- Verify combined reviewer catches the same class of issues as the two separate reviewers
