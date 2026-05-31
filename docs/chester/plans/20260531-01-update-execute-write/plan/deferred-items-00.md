# Deferred Items — 20260531-01-update-execute-write

Items surfaced during the execute-write granularity committee consultation that are out of
scope for this sprint's change (option 1: observed-feed per-task review depth gate). Recorded
for a future sprint to pick up.

## DI-1 — Per-task topology + hybrid executor

**Date:** 2026-05-31
**Source:** design-committee round 2 (locus question)
**Description:** Let `Execution mode` descend per-task — some tasks run inline, others as
isolated subagent dispatches within one plan — instead of the current whole-plan binary.
plan-build already computes the per-task signals (decision-budget, Type, Files) then discards
them by collapsing to one plan verdict; emitting a per-task topology would unlock that
already-computed granularity. execute-write would assign each task its topology from the plan
and may escalate UP (inline→subagent) on an observed sprawling diff, never down.
**Why deferred:** Needs user input / its own spec. The researcher confirmed this is the
largest cost in the proposal — execute-write's two mutually-exclusive sections (Section 2
subagent loop, Section 3 inline loop) must be rebuilt into a single per-task dispatcher, and
Section 4 reconciled against a mixed run. That is an architecture change, not a field-read,
and deserves its own design + plan + threat pass rather than riding on the depth gate. No
current evidence a concrete plan needs per-task topology mixing (Pragmatist's YAGNI gate).

## DI-2 — Dangling `Type` consumer in plan-build (doc-drift bug)

**Date:** 2026-05-31
**Source:** design-committee researcher finding (round 1), confirmed by Purist (round 2)
**Description:** `plan-build/SKILL.md:54` and `plan-template.md:96` assert "execute-write's
trigger-checks key off this [Type] field." Grep across execute-write + all four reference
templates finds zero matches — the claimed execute-time consumer does not exist. Either
execute-write is missing intended per-Type verification gating, or the plan-build/plan-template
lines are stale and should be cut.
**Why deferred:** Out of scope for this sprint (a plan-build/plan-template doc fix, not an
execute-write change). Needs a decision on which way to resolve: build the consumer, or
delete the claim.
**RESOLVED 2026-05-31:** Chose delete. Cut the false "execute-write's trigger-checks key off
this field" claim from `plan-build/SKILL.md` and `plan-template.md`; both now describe `Type`'s
real consumer (plan-build's Execution Mode Selection, condition 4). plan-build v0004→v0005.

## DI-3 — Conditional Section 4 (token-saving variant, declined this round)

**Date:** 2026-05-31
**Source:** design-committee (Pragmatist/Innovator vs Conservator split)
**Description:** Make the Section 4 final review conditional — run only when task-count > 3, or
any task touched multiple files, or any re-dispatch occurred — to cut the per-task/final-review
overlap on small flat plans. The designer chose ALWAYS-ON for the first cut (Conservator's
integration-net argument); this variant is the later tune once the per-task gate is proven.
**Why deferred:** Designer decision — ship always-on first; revisit conditional after the
per-task quality gate has a track record. Innovator's "observed-coupling light pass" (Section 4
as a light integration pass when task diffs are disjoint) is the candidate shape.
