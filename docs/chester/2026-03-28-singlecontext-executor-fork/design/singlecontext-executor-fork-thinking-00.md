# Thinking Summary: Chester Fork Structure

**Sprint:** singlecontext-executor-fork
**Date:** 2026-03-28
**Sequence:** Follows chester-contextuse-fork-thinking-01 (fork decision)
**Confidence:** 0.9 average across 5 decisions

## Context

The prior thinking session (chester-contextuse-fork-thinking-01) established that Chester should fork into two variants: a subagent architecture and a single-context architecture. This session resolves HOW the fork is structured in the filesystem, repository, and user workflow.

## Decision Sequence

### 1. Clean Break Over Coexistence (score: 0.9)

Initial framing explored coexistence models: shared skill directories with divergent write-code skills, mode flags, or partial duplication. The user rejected all of these.

The fork is a clean break. Both variants start from the same codebase, then diverge independently. No shared directories, no mode switching, no abstraction layer to manage two variants in one repo. You use one or the other.

**Why:** Coexistence adds complexity (mode flags, shared-vs-divergent decisions per skill, merge conflicts) for no benefit. The user has no intention of merging or rebasing between variants.

### 2. Context as Asset, Not Pollution (score: 0.92)

The initial framing treated the fork as a mechanical difference: subagent dispatch vs inline execution. The user reframed it: the single-context variant's advantage is that the executor has been present for the entire conversation. It watched the design interview, read the spec evolve, saw the plan survive adversarial review. That accumulated understanding is the richest possible context for writing code — not pollution to isolate from.

This reframe means the singlecontext variant isn't just "cheaper Chester." It's potentially higher quality for implementation, because the executor has full reasoning history rather than pasted summaries.

### 3. Two Independent Repositories (score: 0.9)

Each variant gets its own directory and its own GitHub repository:

- `~/.claude/skills-chester-subagent/` — the original repo (OrdinaryMoose/Chester), renamed from `~/.claude/skills/`
- `~/.claude/skills-chester-singlecontext/` — a new forked repo, new GitHub remote

Both start from the current codebase. The subagent variant is the original, unchanged. The singlecontext variant starts identical and gets reworked.

### 4. Switching Mechanism (score: 0.88)

Switching between variants is done by editing the session-start hook path in `~/.claude/settings.json`. No script, no tooling — just change which skills directory the hook points at.

**Why:** Manual edit is simple and explicit. No risk of accidental switching, no tool to maintain.

### 5. Repository Lineage (score: 0.9)

- **Subagent:** Keeps the original GitHub remote (OrdinaryMoose/Chester). This IS Chester as it exists today, just at a new filesystem path.
- **Singlecontext:** Gets a new GitHub repository. Forked from the same codebase but independent going forward.

## Open Questions

- What specifically changes inside the singlecontext variant? (Deferred to the next design cycle — this sprint only handles the structural fork.)
- Should the config reader script detect which variant it's running in? (Probably not needed — each is self-contained.)

## Cross-References

- Fork decision and rationale: `docs/chester/2026-03-27-token-use-limits/design/chester-contextuse-fork-thinking-01.md`
- Token overhead analysis: `docs/chester/2026-03-27-token-use-limits/design/token-use-limits-design-00.md`
- Memory record: `~/.claude/projects/-home-mike--claude-skills/memory/project_chester_fork.md`
