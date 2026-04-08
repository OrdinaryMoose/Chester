# Design Brief: Architect Interview Process Improvements

**Sprint:** 20260404-01-architect-interview-review
**Status:** Design complete — ready for specification
**Date:** 2026-04-04
**Type:** After Action Review of sprint 20260403-05-authored-facts-improvements

---

## Problem Statement

The chester-design-architect interview for entity authoring attributes required ~50 rounds, a full mid-session restart, and the user writing the problem statement themselves before arriving at a viable design direction. The agent corrected course 11 times — each correction initiated by the user, not the agent. The interview consumed significant time and tokens to arrive at a conclusion ("complete what is there") that the user had to surface, not the interviewer.

The interview process is intended to extract a clear, resolved design through structured questioning. In this session, the process repeatedly worked against that goal. The design direction that ultimately emerged was simple and grounded — but the path to it was neither.

---

## Root Issue

**Divergent mental models between agent and designer.** This is one issue expressing itself across every failure mode — wrong initial target, solution-laden problem statements, premature promotion of exploratory concepts, adversarial framing of constraints, circling without convergence.

The divergence has a specific character: the agent was consistently thinking at the **code level** (types, junction tables, grammar rules, constraints) while the designer needed the **conceptual level** (what designers experience, what the system fails to express, what prior attempts taught). The corrections weren't about what the agent was looking at — they were about **how** it was looking at it.

---

## Why the Divergence Persists

The process structure generates the behavior that advisory lessons warn against.

The current interview sequence is: explore codebase → form model → present problem statement → ask questions. This puts code exploration before problem framing. By the time the agent reaches "present problem statement," it has a detailed technical model already built. The agent equates thoroughness with understanding — it explores broadly, builds an inventory of code artifacts, and presents that inventory as the problem. Each technical detail absorbed makes it harder for the agent to abstract above its own knowledge.

The lessons table has recorded this pattern across four separate sessions (score 4: "When the user rejects a proposed solution, the problem statement itself likely needs reframing"). The pattern persists because lessons are advisory but the process sequence is structural. Structure wins.

---

## Findings

### Finding 1: Problem definition and design are two separate efforts

The current process treats understanding the problem and designing the solution as one continuous flow. The authored facts interview proved they are sequential work with different goals:

- **Problem definition:** Understand what's wrong, why it matters, what's been tried, what the constraints are. No solutions, no options, no design thinking.
- **Design creation:** Given a deeply understood problem, explore the solution space.

The authored facts interview ended up doing this through an accidental restart — Phase 1 tried to do both simultaneously and failed. Phase 2 separated them and succeeded. The design direction ("complete what is there") emerged in ~18 rounds once the problem was understood, versus ~32 rounds of fighting a combined process.

As Einstein said: "If I had an hour to solve a problem, I'd spend 55 minutes thinking about the problem and 5 minutes thinking about solutions." When the problem is deeply understood, the solution space narrows naturally and the design conversation becomes short and focused. If the design conversation is long and wandering, the problem isn't understood yet.

The interview should formally split into two phases, each with its own process, turn structure, and stopping criterion.

### Finding 2: The information is the primary vehicle, not the question

The Socratic interview model assumes the interviewer drives through questions and the designer responds. In practice, the designer rarely answered questions directly — they made independent observations, offered their own framings, and steered the conversation. The questions shaped the response as a framing device but were not the primary vehicle of progress.

What the designer actually needs from each turn:

- **Current facts** (what the code says now) — expert-level, factual
- **Surface analysis** (what's changing) — light touch, not exhaustive
- **General options** (the solution space) — enough to see, not enough to constrain
- **Pessimist risks** (what's fragile) — uncomfortable truths
- **Conceptual question** — non-technical, at the design level

The weighting is approximately 60% information, 40% question. The question still matters — it shapes the designer's thinking even when not answered directly. But the curated information package is what fuels the designer's reasoning. The current process inverts this by putting most effort into question crafting and minimal effort into the supporting material.

### Finding 3: The agent's drift to technical thinking needs structural mitigation

The agent naturally drifts toward code-level thinking because it consumes code-level detail. The Translation Gate in the current skill strips code vocabulary from questions but doesn't change the thinking — the agent thinks in types and junction tables, translates to domain language, but the underlying model remains code-anchored.

The drift cannot be prevented by removing code access — the agent needs code grounding to discuss a code-based system. The agent should read junction tables and understand "relationships carry no data." It should not present that as "24 two-column junction tables need value columns." Same knowledge, different altitude.

The turn structure's visible fact presentation serves as a partial mitigation: the agent must externalize its understanding each round in the information package. The designer can catch altitude mismatches in the presented material before they compound into wrong questions. During problem definition, technical drift is especially dangerous because it pulls the problem statement toward code gaps. During the design phase, some technical grounding is appropriate.

---

## Design Direction

Formally split the interview into two phases:

**Phase 1 — Problem Definition**
- Goal: deep shared understanding of what's wrong
- Turn structure: current facts at conceptual altitude, surface analysis of what we're examining, risks and uncomfortable truths, then a question that deepens problem understanding
- Stopping criterion: a clean problem statement that both parties share — when remaining questions are about what to build rather than what's wrong
- No solutions, no options, no design thinking
- Heavily weighted toward understanding (Einstein's 55 minutes)

**Phase 2 — Design Creation**
- Goal: a resolved design direction
- Turn structure: current facts, surface analysis of what changes, general options, pessimist risks, then a conceptual design question
- Stopping criterion: remaining questions are about how rather than what
- Naturally shorter and more focused because the problem understanding constrains the space
- Weighted 60/40 information to question

---

## Open Concerns for Specification

- How to structure the Phase 1 → Phase 2 transition — what artifact or gate marks the boundary?
- Whether the problem statement framework document should be built into the skill or remain external
- How to enforce conceptual altitude in the turn structure without removing necessary code grounding
- Whether the enforcement mechanism (scoring, gates, challenges) needs different configurations for each phase
- How the two-phase model interacts with the existing Chester pipeline (figure-out → specify → plan → execute)
- Whether this changes the skill boundary — should problem definition be its own skill, or a formal phase within the existing skills?

---

## Acceptance Criteria

- The interview process formally separates problem definition from design creation
- Each turn presents curated information (facts, analysis, options, risks) before a question
- The information-to-question weighting is approximately 60/40
- The agent's code-level reasoning is visible through externalized facts, allowing the designer to catch altitude mismatches
- Problem statements are solution-free — describing pain, not prescribing fixes
- The process supports iterative deepening of the problem statement as understanding matures
