# Thinking Summary: Architect Round One Fix

**Sprint:** 20260405-01-architect-round-one-fix
**Date:** 2026-04-05

---

## Decision History

### 1. Problem Identification — Round 1 collapse (Thought 1)

**Problem confirmed:** The architect skill's Round 1 collapses the entire Problem Definition phase into a single turn. The agent explores the codebase, builds a comprehensive technical model, and presents a complete problem statement before the interview loop starts. Evidence: screenshot of a live session where the agent said "I have a thorough understanding of the design landscape now. Let me capture this and move to the problem statement" and presented a fully formed WHAT/WHY/design-challenge artifact in Round 1.

**Confidence:** High — directly observed in session, matches the root cause identified in sprint 20260404-01's design brief.

### 2. Dual Cause Analysis (Thought 2)

**Finding:** Two forces cause the collapse — the agent's natural helpfulness drive (wanting to present thorough understanding) and structural signals in the skill that point toward presenting a finished analysis. Both contribute. Fixing only wording without addressing structural incentives won't hold.

**Confidence:** High — user confirmed "probably both."

### 3. Phase Identity Reframe (Thought 3)

**Key insight from user:** The two phases should be framed as "Understand" and "Solve." The word "explore" is too vague — it's an activity without a goal. "Understand" is a goal that channels the agent's thoroughness drive toward depth of understanding rather than breadth of conclusion. The fix should harness the LLM's natural tendencies along these axes rather than constrain them with prohibitions.

**Shift:** From "how do we prevent the agent from doing X" to "how do we redirect what the agent is trying to achieve."

### 4. Problem Statement Relocation (Thought 4)

**User proposal:** Remove "problem statement" entirely from Phase 1. Make "understanding" the transition gate. Problem statement becomes the first step of Phase 2.

**Rationale:** If the words "problem statement" appear anywhere in Phase 1, the agent will gravitate toward producing one. By relocating it to Phase 2's opening move, the problem statement becomes a crystallization of earned understanding rather than a pre-exploration conclusion.

**Red team attacks raised:**
1. Phase 1 becomes aimless without a concrete deliverable
2. The collapse might move with the problem statement
3. Enforcement mechanism gates on `problem-statement-confirmed`
4. Figure-out presents a problem statement early and it works

### 5. Attack 1 Resolution (Thought 5)

**User response:** "Understand" is a human-facing goal — the user knows when they understand. On the LLM side, the existing transition criterion works: when conversation shifts from what's wrong to implementation details. The transition criteria don't change mechanistically — what changes is the framing and deliverable.

### 6. Two Problems Identified (Thought 7)

**User decomposition:**
- Problem A: Round 1 collapse — happens before enforcement, needs its own fix
- Problem B: Phase 1 loop behavior — can the enforcement mechanism reinforce understanding?

These are independent problems requiring independent solutions.

### 7. Enforcement vs Reinforcement Distinction (Thought 9)

**Key distinction from user:** Enforcement = transition gating ("you can't leave until conditions are met"). Reinforcement = behavioral shaping ("each turn, reflect on whether you're staying in the right mode"). Phase 1 needs reinforcement, not enforcement.

**User direction:** Not self-assessment (too lightweight) — wants "more teeth." An understanding MCP with a rubric.

### 8. Understanding Definition (Thought 11)

**User's philosophical framing:** Understanding = correlating broadly (breadth across problem surface, relationships between parts, constraints, safe action zones). Planning/solving = thinking narrowly (specific details, chains, process, mechanics of change). The boundary between these two modes IS the metric.

**Nine dimensions confirmed:**
- **Landscape:** Surface coverage, Relationship mapping, Constraint discovery, Risk topology
- **Human Context:** Stakeholder impact, Prior art
- **Foundations:** Temporal context, Problem boundary, Assumption inventory

### 9. MCP Separation (Thought 14)

**Decision:** Understanding MCP runs Phase 1 only. Enforcement MCP runs Phase 2 only. No overlap. This simplifies per-turn cognitive load and makes each phase's identity crisp.

---

## Key Reasoning Shifts

| # | From | To | Trigger |
|---|------|----|---------|
| 1 | Constraining agent behavior with prohibitions | Redirecting agent goals with positive framing | User: "harness the LLM's natural tendencies" |
| 2 | Problem statement as Phase 1 deliverable | Problem statement as Phase 2 opening move | User: "take 'problem statement' out of Phase 1 altogether" |
| 3 | Self-assessment for Phase 1 shaping | MCP with rubric for Phase 1 shaping | User: "more teeth" |
| 4 | Design clarity dimensions for understanding | Understanding-specific dimensions (breadth-oriented) | User: "understanding = correlating broadly" |
| 5 | Both MCPs running in both phases | One MCP per phase, no overlap | User: "understanding MCP only in phase 1 and evaluation MCP only in phase 2" |

---

## Alternatives Considered

- **Self-assessment rubric in SKILL.md** — Rejected as too lightweight ("more teeth" needed). The agent marking its own homework without external feedback isn't sufficient behavioral shaping.
- **Modifying enforcement MCP dimensions for Phase 1** — Rejected because it would require MCP code changes and the enforcement mechanism's architecture is optimized for design resolution, not understanding measurement.
- **Running both MCPs simultaneously** — Rejected as too heavy (eighteen dimensions per turn) and conceptually muddled (mixing understanding and resolution metrics).

---

## Residual Risks

- The understanding MCP is new infrastructure that needs to be built and tested
- The gap map presentation format in Round 1 is conceptually defined but not yet specified in detail
- Attack 2 (agent mentally composing problem statement during Phase 1 despite relocation) was discussed but not definitively resolved — the combination of phase identity + understanding rubric is expected to mitigate this but hasn't been tested
