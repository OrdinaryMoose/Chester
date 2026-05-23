---
name: design-architect-committee
description: Convene the four-pole Committee in Mode B for a session producing a ratified Constraint Envelope, Resolution Criterion, and Coverage Map for design-specify. Use when architectural choice requires structured deliberation with Clerk-enforced schema and the five-phase OPEN→ANCHORED→DELIBERATING→RATIFYING→CLOSED lifecycle.
version: v0001
---

# Design Architect Committee

## When To Invoke

Architectural choice needing structured multi-perspective deliberation governed by Clerk-enforced single-layer schema. Anchors `Mode B` convening of four-pole Committee with locked `Alternative F` machinery.

## What It Produces

Three ratified frozen artifacts for `design-specify` consumption — [Constraint Envelope](schema/constraint-envelope.md), [Resolution Criterion](schema/resolution-criterion.md), [Coverage Map](schema/coverage-map.md). Cross-artifact integrity per [FK rules](schema/integrity-rules.md#fk-rules).

## Session Lifecycle

Sessions follow [five named phases](schema/phases-and-transitions.md#session-phases-five-named-states). [Procedures](schema/procedures.md) mutate state per [procedure-actor map](schema/actors.md#procedure-actor-map). Closes when [session-close gate](schema/integrity-rules.md#session-close-gate) clears.

## Outputs To

`design-specify`. Team-lead packages three deliverables from Clerk-certified working record at session close. No other downstream consumer.

## Scope Limits

Produces only three frozen deliverables. Clerk script, dispatch convention, working-directory layout, on-disk handoff document shape — out of scope for skill files themselves.
