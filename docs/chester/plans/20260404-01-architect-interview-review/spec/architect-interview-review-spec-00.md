# Spec: chester-design-architect Interview Process Redesign

## Overview

Restructure the `chester-design-architect` interview into two formally separated phases — Problem Definition and Design Creation — each with its own turn structure, stopping criterion, and information presentation format. The existing enforcement mechanism and scoring infrastructure remain; what changes is the interview methodology that sits on top of them.

This addresses root cause divergence observed in the authored-facts interview (sprint 20260403-05): the agent builds a detailed technical model during codebase exploration and then uses that model to frame the problem statement. When the problem is framed in code-level terms, every subsequent question inherits that altitude. Corrections initiated by the user fix individual questions but not the structural cause. Separating problem definition from design creation prevents the contamination.

## Scope

### In-Scope

- Revised interview phases in `chester-design-architect/SKILL.md`
- Phase 1 (Problem Definition) turn structure and stopping criterion
- Phase 2 (Design Creation) turn structure and stopping criterion
- Phase transition gate — artifact and conditions that mark the boundary
- Information-first turn format for both phases (approximately 60/40 information-to-question weighting)
- Altitude enforcement through externalized fact presentation
- Adjustments to enforcement mechanism configuration per phase (if needed)
- Updated closure protocol reflecting two-phase structure

### Out-of-Scope

- Changes to the enforcement mechanism implementation (MCP server code)
- Changes to scoring dimensions, weights, or formulas
- Changes to `chester-design-figure-out`
- Changes to challenge mode trigger conditions
- New tooling or MCP servers
- Modifications to downstream skills (specify, plan-build)
- Output artifact format changes (design brief, thinking summary, process evidence remain the same)

---

## Architecture

### Two-Phase Interview Model

The interview splits into two sequential phases within a single session. The enforcement mechanism runs across both phases — it does not reset at the phase boundary.

```
Phase 1: Problem Definition
├── Goal: Deep shared understanding of what's wrong
├── Turn structure: Information package → conceptual question
├── Stopping criterion: Clean problem statement, remaining questions are about what to build
└── Constraint: No solutions, no options, no design thinking

    ↓ Transition gate: Problem statement artifact confirmed by user

Phase 2: Design Creation
├── Goal: Resolved design direction
├── Turn structure: Information package → design question
├── Stopping criterion: Remaining questions are about how, not what
└── Property: Naturally shorter because problem understanding constrains the space
```

### Phase 1 — Problem Definition

**Goal:** Establish a deep, shared understanding of what's wrong, why it matters, what's been tried, and what the constraints are. No solutions.

**Turn structure — Information Package:**

Each turn presents a curated information package before the question. The package is the primary vehicle of progress; the question shapes and deepens the designer's thinking.

| Component | Purpose | Altitude |
|-----------|---------|----------|
| Current facts | What the code/system says now about this topic | Expert-level factual, conceptual language |
| Surface analysis | What's changing or under pressure in this area | Light touch, not exhaustive |
| Uncomfortable truths | What's fragile, contradictory, or historically painful | Pessimist stance — name what others avoid |

**Question:** One conceptual question that deepens problem understanding. Must pass the Translation Gate. Must NOT propose, imply, or evaluate solutions. The question targets *what's wrong* and *why it matters*, not *what to build*.

**Prohibited in Phase 1:**
- Solution proposals or option enumeration
- Design alternatives or trade-off analysis
- Architecture suggestions or structural recommendations
- "How might we..." framing (this is design thinking)
- Evaluative language about potential approaches

**Stopping criterion:** The problem statement is clean and both parties share it. Operationally: the remaining questions the interviewer wants to ask are about *what to build* rather than *what's wrong*. When the interviewer's question queue shifts from problem-understanding to solution-exploring, Phase 1 is complete.

**Enforcement interaction:** Scoring continues normally. During Phase 1, the enforcement mechanism's stage priority emphasizes Intent Clarity, Outcome Clarity (in terms of desired end-state vs. current pain), and Constraint Clarity. Scope Clarity may remain low — scope is a design question, not a problem question.

### Phase Transition Gate

The boundary between Phase 1 and Phase 2 is marked by a **problem statement artifact** — a concise document (2-4 paragraphs) written inline in the conversation that captures:

1. **What's wrong** — the pain, dysfunction, or gap in concrete terms
2. **Why it matters** — the consequences of the current state
3. **What's been tried** — prior attempts and why they didn't resolve it
4. **What constrains a solution** — immovable boundaries, not design preferences

**Gate process:**
1. The interviewer recognizes Phase 1 completion (question queue has shifted)
2. Presents the problem statement to the user
3. User confirms, corrects, or requests deeper exploration on a specific aspect
4. If corrected, revise and re-present. If deeper exploration requested, continue Phase 1.
5. Once confirmed, `capture_thought()` with tag `problem-statement-confirmed`, stage `Transition`
6. Announce phase transition: brief note that problem understanding is established and the conversation now shifts to design

The problem statement artifact is NOT a separate file — it lives in the conversation and is captured via structured thinking. It appears in the design brief's problem section at closure.

### Phase 2 — Design Creation

**Goal:** Given the deeply understood problem, explore the solution space and arrive at a resolved design direction.

**Turn structure — Information Package:**

| Component | Purpose | Altitude |
|-----------|---------|----------|
| Current facts | What the code/system says now, relevant to this design question | Expert-level factual, conceptual language |
| Surface analysis | What changes if we move in this direction | Light touch analysis of implications |
| General options | The solution space for this specific question | Enough to see the landscape, not prescriptive |
| Pessimist risks | What's fragile or uncomfortable about the emerging direction | Uncomfortable truths about the design |

**Question:** One conceptual design question. Must pass the Translation Gate. May evaluate trade-offs, explore alternatives, and probe design decisions — all activities prohibited in Phase 1.

**Stopping criterion:** Remaining questions are about *how to implement* rather than *what to build*. When the interviewer's question queue shifts from design-level to implementation-level, the design is resolved.

**Property:** Phase 2 is naturally shorter than Phase 1 because the deep problem understanding constrains the solution space. If Phase 2 is running long (approaching Phase 1 length), it signals the problem wasn't well-enough understood — consider whether Phase 1 was exited prematurely.

**Enforcement interaction:** Full scoring across all dimensions. Scope Clarity becomes primary alongside the dimensions established in Phase 1. Challenge modes operate normally.

---

## Turn Structure Detail

### Information-to-Question Weighting

Both phases target approximately **60% information, 40% question** by content weight. The information package is the primary deliverable of each turn — the curated, altitude-appropriate material that fuels the designer's reasoning. The question shapes the direction.

This inverts the current design where most effort goes into question crafting with minimal supporting material.

### Altitude Enforcement Through Externalization

The information package serves a dual purpose:

1. **Content delivery** — gives the designer the material they need to reason
2. **Altitude check** — forces the agent to externalize its understanding each round

Because the information package is visible to the designer, altitude mismatches are caught before they compound. If the agent presents "24 two-column junction tables need value columns" instead of "relationships in the system carry no data," the designer catches it immediately.

This is a structural mitigation for technical drift. The agent reads code (and should read code — it needs grounding), but the information package forces a translation step. The Translation Gate applies to questions; the information package applies the same altitude discipline to the supporting material.

**Rule:** Information package components use domain concepts and system-level observations. Code-level detail (type names, file paths, property shapes) stays in the agent's private research. The same Research Boundary that governs questions governs the information package.

### Thinking Block Adjustment

The existing thinking block (alignment check, metacognitive reflection, transparency of intent) remains. It precedes the information package. The full turn order is:

1. Thinking block (italic, 3 components — same as current)
2. Information package (structured, labeled components)
3. Question (bold, single question — same as current)

---

## Enforcement Mechanism Adjustments

The enforcement mechanism (MCP server) does not change its implementation. The following adjustments are to the SKILL.md's instructions for how the agent interacts with it:

### Phase-Aware Scoring Guidance

**Phase 1 scoring:**
- Intent Clarity and Constraint Clarity are the primary targets
- Outcome Clarity scores reflect understanding of the *desired end-state* (what "fixed" looks like), not solution design
- Scope Clarity may legitimately remain low — it's a Phase 2 concern
- Success Criteria may remain low — measurability often depends on the solution shape

**Phase 2 scoring:**
- All dimensions are active
- Scope Clarity becomes a primary target
- Success Criteria becomes achievable to score as the design takes shape

### Phase Tracking

The enforcement mechanism's state file gains no new fields. Phase tracking is handled by the SKILL.md instructions:
- The `capture_thought()` with tag `problem-statement-confirmed` marks the boundary
- The agent tracks which phase it's in based on whether this thought has been captured
- Process evidence at closure documents when the phase transition occurred

---

## Closure Protocol

Closure protocol is unchanged in mechanism but clarified in framing:

1. Phase 2 interviewer recognizes no remaining design-level questions clear the materiality threshold
2. Final `submit_scores` — enforcement mechanism must return `closure_permitted: true`
3. If `closure_permitted: false`, interview continues — surface the reason in domain terms
4. Forced crystallization at round 20 hard cap (total rounds, not per-phase)
5. Early exit available after first assumption probe + one follow-up (same as current)

**Phase 2 length check:** If Phase 2 has consumed more rounds than Phase 1, note this in the process evidence as a signal that problem definition may have been insufficient.

---

## Updated Round One

Round one changes to reflect the two-phase model:

1. Explore codebase for relevant context. Classify brownfield vs greenfield.
2. Present an initial set of facts relevant to the user's initial prompt or question.
3. Ask a Clarifying question after presenting the facts.  Do not try to frame the problem 
   statement yet.
4. `capture_thought()` with tag `problem-statement`, stage `Problem Definition`
5. Initialize enforcement mechanism
6. Announce: Phase 1 (Problem Definition) begins. The conversation will focus on understanding the problem deeply before exploring solutions.
7. First Phase 1 turn begins with the user's response

---

## Testing Strategy

Validation through observed sessions:

1. **Phase separation holds** — Phase 1 turns contain no solution proposals, options, or design thinking
2. **Information package present** — every turn includes the structured information components before the question
3. **Altitude maintained** — information package uses domain concepts, not code vocabulary
4. **Phase transition is explicit** — problem statement artifact is presented and confirmed before Phase 2 begins
5. **Phase 2 is shorter** — design converges faster because problem understanding constrains it
6. **Enforcement mechanism called each round** — no change from current behavior
7. **Translation Gate holds across both turn components** — questions AND information package pass the gate
8. **All three output artifacts produced** — design brief, thinking summary, process evidence
9. **Process evidence documents phase transition** — when it happened, what triggered it
10. **Round cadence maintained** — ~2 minutes per round target preserved

---

## Constraints

- Must maintain ~2-minute cadence per round (information package must not bloat turn time)
- Must maintain presentation parity with figure-out in terms of conversational feel
- Must not require changes to the enforcement mechanism MCP server
- Must not require changes to the structured thinking MCP
- Must produce artifacts compatible with `chester-design-specify` entry conditions
- Must use Chester's existing sprint naming, directory structure, file naming conventions
- The round 20 hard cap applies to total rounds across both phases, not per phase
- Information package components should be concise — 2-4 sentences each, not paragraphs

## Non-Goals

- Optimizing the enforcement mechanism's scoring dimensions for two-phase awareness (the dimensions work as-is; only the agent's scoring guidance changes)
- Building the problem statement framework into a standalone document or template (it's a conversation artifact captured via structured thinking)
- Creating a separate skill for problem definition (it's a phase within the existing architect skill)
- Changing how `chester-design-figure-out` works (it has its own methodology)
- Adding new MCP tools or enforcement mechanism capabilities

---

## Integration

- **Modifies:** `chester-design-architect/SKILL.md` only
- **Does not modify:** enforcement mechanism MCP, structured thinking MCP, `chester-design-figure-out`, `chester-design-specify`, `chester-plan-build`, or any other skill
- **Transitions to:** `chester-design-specify` (unchanged)
- **Invoked by:** user directly (unchanged)

---

## Open Concerns Resolved

From the design brief's open concerns:

| Concern | Resolution |
|---------|-----------|
| Phase 1 → Phase 2 transition artifact | Inline problem statement (2-4 paragraphs) confirmed by user, captured via `capture_thought()` |
| Problem statement framework — built-in or external? | Neither — it's a conversation artifact with four required components (what's wrong, why it matters, what's been tried, what constrains) |
| Enforcing conceptual altitude | Externalized information package forces translation; Research Boundary applies to information components, not just questions |
| Different enforcement configs per phase | No mechanism changes — phase-aware scoring guidance in SKILL.md instructions handles this |
| Interaction with Chester pipeline | Unchanged — the two-phase split is internal to the architect skill; downstream sees the same artifacts |
| Separate skill for problem definition? | No — a formal phase within the existing skill. Same session, same enforcement state, same artifacts. |
