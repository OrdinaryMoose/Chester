# Design Brief: Architect Phase 1 Restructure — Understanding MCP

**Sprint:** 20260405-01-architect-round-one-fix
**Status:** Design complete — ready for specification
**Date:** 2026-04-05
**Type:** Structural fix to chester-design-architect Phase 1

---

## Problem Statement

The architect skill's Round 1 collapses the entire Problem Definition phase into a single turn. Instead of presenting initial observations and asking an exploratory question, the agent explores the codebase, builds a comprehensive technical model, and presents a complete problem statement — the very artifact that is supposed to emerge from multiple rounds of Socratic dialogue. The interview loop that follows becomes rubber-stamping rather than discovery.

This defeats the purpose of the two-phase model introduced in sprint 20260404-01. The spec split the interview into Problem Definition and Design Creation specifically because the prior process let code-level thinking contaminate the problem framing. If the agent still produces a finished problem statement before the first question, the structural fix hasn't taken hold — the same failure mode persists under a new label.

---

## Root Cause

Two forces cause the collapse:

1. **The agent's natural completion drive.** After exploring a codebase, the agent accumulates a rich mental model and feels compelled to present that understanding as a finished analysis. Prohibitions ("do not try to frame the problem statement yet") compete with this drive and lose.

2. **Structural signals in the skill.** The `capture_thought` tag in Round 1 is `problem-statement`. The Phase Transition Gate describes a problem statement artifact with WHAT/WHY/constraints format. The agent reads these at skill load time and knows where it's headed — it accelerates to the destination.

Fixing wording alone without addressing structural incentives won't hold. The fix must redirect the agent's natural drive rather than constrain it.

---

## Design Direction

### Part 1: Phase Identity Reframe

Rename and redefine the two phases:

- **Phase 1: Understand** — Correlate broadly across the problem surface. Map relationships between parts, discover what's movable and what's fixed, identify where action is safe. Breadth-first. No solutions, no problem statement.

- **Phase 2: Solve** — Think narrowly about specific details. Follow chains of information, work out process, figure out mechanics of change. Depth-first. Opens with a problem statement that crystallizes Phase 1's understanding.

Remove the words "problem statement" from Phase 1 entirely. The problem statement relocates to the opening move of Phase 2 — a crystallization of earned understanding, not a pre-exploration conclusion.

The transition happens when Phase 1's understanding dimensions are broadly saturated and the conversation naturally pulls toward implementation specifics — the shift from "what's wrong and why" to "okay, but how does this part work."

### Part 2: Understanding MCP

A new MCP server for Phase 1, mirroring the enforcement MCP's architecture but measuring understanding depth instead of design resolution.

**Nine dimensions in three groups:**

**Landscape** — mapping the problem terrain:
- **Surface coverage** — how many facets of the problem have we touched?
- **Relationship mapping** — do we understand how the parts connect to each other?
- **Constraint discovery** — what's movable and what's fixed?
- **Risk topology** — where can we act with least disruption?

**Human Context** — what only the user can tell us:
- **Stakeholder impact** — who feels this problem and how do they experience it?
- **Prior art** — what's been tried before and why didn't it resolve it?

**Foundations** — the ground everything rests on:
- **Temporal context** — why now? What changed or is changing that makes this urgent?
- **Problem boundary** — what's adjacent but NOT part of this problem? Where does this end?
- **Assumption inventory** — what are we taking as given that might not be true?

**Per-dimension scoring (inherited from enforcement MCP pattern):**
- **Score** (0.0–1.0): how well understood this dimension is (0 = unknown, 1 = fully mapped)
- **Justification** (mandatory, cannot be empty): what evidence supports this score
- **Gap** (mandatory when score < 0.9): what's still missing — doubles as question source
- **Score-jump detection** (flags jumps > 0.3): prevents the agent from inflating scores to rush transition

The gap field is the key behavioral mechanism — each gap is a natural interview target. The agent can't score a dimension without articulating what's missing, and what's missing drives the next question.

**Transition signal:** When dimensions are broadly saturated (high coverage across all nine) and the conversation naturally pulls vertical (questions shift from understanding to implementation detail).

### Part 3: Round 1 as Gap Map

Round 1 initializes the understanding MCP and presents:

1. **What the codebase reveals** — observations from exploration, mapped to understanding dimensions the agent can partially score (surface coverage, relationship mapping, some constraint discovery)
2. **What the agent can't determine from code alone** — explicit gaps in dimensions that require human input (stakeholder impact, prior art, temporal context, problem boundary, assumption inventory)

The gap map harnesses the agent's exploration energy while channeling it toward "here's what I see and here's what I need to learn from you" rather than "here is the problem."

The enforcement MCP no longer initializes in Round 1. It activates at the start of Phase 2 when the problem statement is written.

### Part 4: MCP Separation

- **Understanding MCP** — runs Phase 1 only. Reinforces breadth-first understanding behavior.
- **Enforcement MCP** — runs Phase 2 only. Gates design resolution and closure.
- No overlap. One MCP per phase. Each phase has a single clear identity.

The enforcement MCP's "phase-aware scoring guidance" is removed — it only runs during one phase where all dimensions are active. No conditional logic needed.

---

## Scope

### In-Scope

- Understanding MCP server (new) — nine dimensions, score/justification/gap, score-jump detection
- Revised Phase 1 identity and instructions in `chester-design-architect/SKILL.md`
- Revised Round 1 as gap map in `chester-design-architect/SKILL.md`
- Problem statement relocation from Phase 1 transition gate to Phase 2 opening move
- Enforcement MCP initialization moved from Round 1 to Phase 2 start
- Removal of "phase-aware scoring guidance" from enforcement interaction

### Out-of-Scope

- Changes to enforcement MCP server code (it runs Phase 2 as-is)
- Changes to `chester-design-figure-out` (different skill, different opening)
- Changes to structured thinking MCP
- Changes to downstream skills (specify, plan-build)
- Changes to scoring dimensions, weights, or formulas in the enforcement MCP
- Changes to challenge mode triggers

---

## Acceptance Criteria

- Round 1 presents codebase observations alongside explicit gaps — not a problem statement
- Phase 1 turns are governed by understanding MCP scoring with nine dimensions
- The agent's gaps (articulated via mandatory gap field) drive question selection
- "Problem statement" does not appear anywhere in Phase 1 instructions
- Problem statement is the first artifact of Phase 2
- Enforcement MCP initializes at Phase 2 start, not Round 1
- Score-jump detection flags rapid score inflation (> 0.3 per turn per dimension)

---

## Non-Goals

- Optimizing the enforcement MCP for Phase 2 (it works as-is once phase-aware guidance is removed)
- Building the understanding MCP as a general-purpose tool (it's specific to the architect interview)
- Changing how figure-out handles its opening (different skill, different problem)

---

## Integration

- **Modifies:** `chester-design-architect/SKILL.md`
- **Creates:** Understanding MCP server (new infrastructure, parallel to enforcement MCP)
- **Does not modify:** Enforcement MCP server, structured thinking MCP, `chester-design-figure-out`, `chester-design-specify`, or any other skill
- **Transitions to:** `chester-design-specify` (unchanged)
