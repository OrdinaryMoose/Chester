# Design Brief: Canonical instruction-injection architecture for Chester

**Status:** Draft — committee input
**Date:** 2026-06-07
**Sprint:** 20260607-01-update-voice-discipline

## Problem Statement

Chester restates shared **instruction text** across many files instead of sourcing it once and
delivering it reliably to each consumer. The duplication spans five surfaces, all the same root problem:

- **Design Partner voice** — Translation Gate, C1/C2, option-naming, Stance Principles, the info-packet
  style overlay, PM Litmus Test, Research Boundary. Canonical home (`util-design-partner-role`) is
  shallow: PM Litmus and Research Boundary have **0 canonical copies / 2 duplicates each**; Stance
  Principles is **1 canonical + 4 agent copies**; Translation Gate appears at **4 altitudes / 3 examples**.
- **Reviewer disciplines** (FD-01) — evidence-citation, ≥80 confidence ladder, independence rule,
  restated with drift across **7 files**.
- **Committee member scaffold** (FD-02) — four 103-line member agent files, **~70% identical**.
- **Skill catalog** (FD-03) — every skill description maintained in frontmatter *and* `skill-index.md`;
  drifted into a live contradiction; 3 skills missing; sync rule points at a phantom list.
- **Repo-wide CLAUDE.md rules** (FD-04) — version-bump and description-sync rules stated in two
  CLAUDE.md files; version carve-out already dropped in one.

The cost is **drift**: a change in one copy silently forks the others, and orphan rules have no
authoritative copy to sync against.

## The unifying crux

One architectural decision recurs across every surface: **how shared instruction text reaches each
consumer kind.** Consumer kinds differ in what delivery they can accept:

- **Inline skill** (`design-small-task`) — long-lived conversation; instruction present in context; drift accrues over turns.
- **Runtime-read skill** (`plan-attack`, `plan-smell`, `util-codereview`, team-lead) — can be told "read `references/X.md`" before acting; proven `util-design-partner-role` pattern.
- **Teams subagent** (the 4 committee advocacy members) — created by `TeamCreate`, dispatched via `SendMessage`; the agent file is its system prompt. **Distinct from a normal Task subagent.** Whether it can read a sibling reference file as a first action is unverified and decisive.
- **Named Task subagent** (reviewer agents) — dispatched as their `.md` prompt; same read-as-first-action question.
- **CLAUDE.md** — auto-loaded context; canonical-plus-pointer (two-tier) already works for the artifact tree.

The recurring fork, per consumer kind:

1. **Runtime-read** — DRY-est; instruction absent at load → weakest direction, highest drift risk.
2. **Build-time generator** — instruction materialized into each prompt → strongest direction; on-disk
   duplication that a generator keeps in sync (FD-03's "generate index from frontmatter" is this).
3. **Accept-inline** — strongest direction, manual sync, observed drift.

## Primary organizing principle

**Strength of agent direction — the agent does not drift mid-session — is the litmus.** DRY and SOLID
are desirable but subordinate. Where single-sourcing (a reference the agent must go read) trades against
keeping the instruction reliably in front of the agent (inline / baked-in / injected at dispatch), favor
strongest direction even at the cost of controlled duplication.

## Prior Art

- `util-improve-codebase` HTML review (this session) — voice duplication map.
- Feature-dev analysis FD-01..FD-05 (`…/review/feature-dev-0N-*.md`). FD-01..04 are the active inputs;
  FD-05 (review-loop control flow) is out of scope this sprint.
- `20260606-01-update-committee-context-management` (just merged) — established disk-as-source-of-truth
  and dispatch-payload patterns this refactor may lean on.

## Decision space (for committee)

- Per consumer kind, choose runtime-read vs build-time generator vs accept-inline.
- Decide whether one mechanism should govern all consumer kinds, or each kind gets its own.
- Disposition of each duplicated rule set (voice rules, reviewer disciplines, member scaffold, catalog,
  CLAUDE.md rules).

## Scope

### In scope

- Recommended canonical mechanism(s) for storing + injecting shared instruction text across the five surfaces.
- The decisive empirical question: can a **Teams subagent** read a sibling reference as first action?
- Disposition of the four/five duplicated rule sets.

### Out of scope

- Round/turn **flow** structures — distinct by design, not duplicated.
- FD-05 (review-loop control flow).
- Implementation — this sprint produces a design recommendation.

## Constraints

- Committee members are **Teams subagents** (`TeamCreate`/`SendMessage`), distinct from Task subagents _(structural)_.
- `CHESTER_INFO_PACKET_STYLE` env overlay + directive protocol already deliver session-scoped style _(structural)_.
- Two-place sync rule (description ↔ setup-start) — itself one of the duplications under review _(normative — CLAUDE.md)_.

## Assumptions

- **"A reference the agent must read mid-session is weaker direction than an inline or injected rule."**
  UNTESTED — central to the litmus; committee should test it.
- **"A Teams subagent cannot reliably read a sibling reference at dispatch."** UNTESTED — Researcher verifies.

## Acceptance Criteria

A committee verdict recommending, with rationale, a per-consumer-kind delivery design for shared
instruction text, optimized for strength of agent direction, with explicit disposition of every
duplicated rule set, downstream of a verified answer on Teams-subagent sibling-file access.
