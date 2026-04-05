# Reasoning Audit: Architect Phase 1 Restructure — Understanding MCP

**Date:** 2026-04-05
**Session:** `00`
**Plan:** No formal implementation plan — session driven by design brief and spec produced within session

---

## Executive Summary

The session set out to fix the architect skill's Round 1 collapse, where the agent bypasses multi-round discovery by presenting a fully formed problem statement in its opening turn. The most consequential decision was reframing Phase 1's identity from "Problem Definition" to "Understand" — shifting the approach from constraining the agent's behavior with prohibitions to redirecting its goal. This led to a new Understanding MCP server and a complete SKILL.md rewrite. The session followed a design discovery → specification → implementation path without a formal implementation plan, using the skill-creator eval loop for validation.

---

## Plan Development

No implementation plan existed at session start. The session began as a validation task (check the current SKILL.md against the spec from sprint 20260404-01), escalated to root cause analysis when the user identified a deeper behavioral problem, and evolved into a full redesign through Socratic discovery (`chester-design-figure-out`). The design brief and spec were produced within the session and immediately implemented. The skill-creator workflow governed the modification and testing cycle.

---

## Decision Log

---

### Phase identity as behavioral redirection, not prohibition

**Context:**
The original SKILL.md contained prohibitions ("Do not try to frame the problem statement yet") that the agent ignored in practice. The user observed that the agent's natural completion drive overrode written constraints. A different approach was needed.

**Information used:**
- Screenshot of a live session showing the agent presenting a complete WHAT/WHY problem statement in Round 1 despite explicit instructions not to
- Design brief from sprint 20260404-01 documenting the root cause: "The current interview sequence puts code exploration before problem framing. By the time the agent reaches 'present problem statement,' it has a detailed technical model already built."
- User's framing: "If I were to use two words for the overarching architect skill it would be phase 1 Understand and phase 2 Solve. So we probably need to harness the LLMs natural tendencies along those axis instead of just saying 'explore'"

**Alternatives considered:**
- `Stronger prohibitions in SKILL.md` — rejected because the existing prohibition already failed; adding more "do not" language competes with the agent's drive and loses
- `Removing codebase exploration from Round 1` — not considered explicitly; would remove necessary grounding
- `Restructuring the capture_thought tag` — identified as a contributing cause but insufficient alone

**Decision:** Rename Phase 1 to "Understand" and Phase 2 to "Solve," reframing what the agent is trying to achieve rather than what it's forbidden from doing.

**Rationale:** The user articulated that "understand" channels the agent's thoroughness drive toward depth of understanding rather than breadth of conclusion. The agent wants to be helpful — redirect that energy toward a positive goal rather than constraining it with negative rules.

**Confidence:** High — user explicitly proposed and confirmed this direction, with clear reasoning about LLM behavioral tendencies.

---

### Problem statement relocated from Phase 1 to Phase 2 opening

**Context:**
If the words "problem statement" appear anywhere in Phase 1, the agent gravitates toward producing one. The Phase Transition Gate in the original skill defined a problem statement artifact as the boundary between phases, which primed the agent to produce it as early as possible.

**Information used:**
- The current SKILL.md had `capture_thought` with tag `problem-statement` in Round 1 (line 97), and the Phase Transition Gate section described the problem statement format
- User proposal: "maybe we take the words 'problem statement' out of phase 1 all together, make 'understanding' the transition gate, and problem statement is the first step of phase 2"

**Alternatives considered:**
- `Keep problem statement in Phase 1 but add stronger guardrails` — rejected; the red team analysis showed the agent reads the full skill at load time and knows a problem statement is expected, regardless of guardrails
- `Remove problem statement entirely` — not considered; it's needed as Phase 2's opening crystallization

**Decision:** Remove all "problem statement" language from Phase 1. The problem statement becomes Phase 2's opening move — a crystallization of earned understanding.

**Rationale:** User identified that the presence of the concept in Phase 1 creates a target the agent accelerates toward. Relocating it to Phase 2 makes it a product of understanding, not a substitute for it.

**Confidence:** High — user proposed, red-teamed (4 attack vectors examined), and confirmed.

---

### New Understanding MCP instead of self-assessment or enforcement modification

**Context:**
Phase 1 needed some mechanism to shape behavior beyond SKILL.md instructions. The enforcement MCP exists for Phase 2 but its dimensions measure design resolution, not understanding depth.

**Information used:**
- User rejected self-assessment as "too lightweight" — wanted "more teeth"
- User rejected modifying the enforcement MCP's dimensions — wanted to keep it untouched
- Enforcement MCP architecture (server.js, scoring.js, state.js) provided the structural template
- User's distinction: "enforcement establishes objective measures for design development focused on transition criteria. Does a corollary exist where objective measures can be applied to phase 1 to shape the LLM's thinking through reinforcement?"

**Alternatives considered:**
- `Per-turn self-assessment rubric in SKILL.md` — proposed, rejected by user ("more teeth")
- `Modified enforcement MCP with phase-aware dimensions` — discussed, rejected to keep enforcement MCP untouched and because its dimensions are resolution-oriented
- `Both MCPs running simultaneously` — discussed, rejected as too heavy (18 dimensions per turn) and conceptually muddled

**Decision:** Build a new Understanding MCP server with nine understanding-specific dimensions, mirroring the enforcement MCP's architecture but measuring breadth of understanding instead of design resolution.

**Rationale:** User wanted the same structural pattern (external MCP providing objective feedback) but with metrics appropriate to the "Understand" phase. The enforcement pattern of score + mandatory justification + mandatory gap was confirmed as the right mechanism.

**Confidence:** High — arrived at through iterative dialogue with clear user confirmation at each step.

---

### Nine understanding dimensions in three groups

**Context:**
The understanding MCP needed dimensions that measure breadth-first exploration rather than design resolution. The user provided a philosophical framing: "understanding = correlating broadly while planning = thinking narrowly."

**Information used:**
- User's definition: understanding means mapping relationships between parts, what you can and can't do, where you can act with least risk
- Initial four dimensions (surface coverage, relationship mapping, constraint discovery, risk topology) proposed by the agent
- User asked to "extrapolate out a few more understanding metrics"
- Five additional dimensions proposed: stakeholder impact, prior art, temporal context, problem boundary, assumption inventory

**Alternatives considered:**
- `Fewer dimensions (4-6)` — the initial landscape-only set was expanded at user's request
- `More dimensions (10+)` — not proposed; nine felt complete to user ("perfect")
- `Different groupings` — the three-group structure (landscape, human context, foundations) emerged naturally from the dimension types

**Decision:** Nine dimensions in three groups: Landscape (4), Human Context (2), Foundations (3). Weighted 0.40/0.30/0.30 to ensure human context and foundations carry equal combined weight to the technical picture.

**Rationale:** The grouping ensures the agent can't achieve transition by deeply exploring code while neglecting the user's perspective. Human context dimensions (stakeholder impact, prior art) require asking the user — they can't be scored from codebase exploration alone.

**Confidence:** High — all nine dimensions explicitly confirmed by user.

---

### One MCP per phase, no overlap

**Context:**
With two MCP servers (understanding and enforcement), a decision was needed about whether they run concurrently or sequentially.

**Information used:**
- User's clear directive: "understanding mcp only in phase 1 and evaluation mcp only in phase 2"

**Alternatives considered:**
- `Both MCPs active during Phase 1` — would mean 18 dimensions per turn, rejected as too heavy
- `Enforcement MCP tracking across both phases (original design)` — superseded by the new architecture

**Decision:** Understanding MCP governs Phase 1 exclusively. Enforcement MCP governs Phase 2 exclusively. No overlap.

**Rationale:** Each phase has a single clear identity governed by one mechanism. Simplifies per-turn cognitive load and eliminates the need for phase-aware scoring guidance in the enforcement MCP.

**Confidence:** High — user explicitly directed this separation.

---

### Score-jump detection inherited from enforcement MCP

**Context:**
The enforcement MCP flags score jumps > 0.3 per dimension per turn as warnings. The understanding MCP needed a similar anti-gaming mechanism.

**Information used:**
- User recalled the enforcement MCP's pattern: "in the evaluation mcp we asked the agent to both score and explain to force it not just to make up numbers. Does that also apply here?"
- User confirmed: "include score jump"
- Enforcement MCP's `validateScoreSubmission` function (scoring.js lines 20-41)

**Alternatives considered:**
- *(No alternatives visible in context)* — user confirmed inclusion without discussing thresholds

**Decision:** Inherit the full enforcement validation pattern: mandatory justification, mandatory gap when < 0.9, score-jump detection > 0.3 as warnings.

**Rationale:** The same pattern that prevents score gaming in Phase 2 prevents it in Phase 1. The justification + gap requirement forces the agent to externalize what it knows and doesn't know.

**Confidence:** High — directly requested by user.

---

### Presentation labels: "Observations" not "Thinking", classification hidden

**Context:**
During eval review, the user noted two presentation issues in the with-skill Round 1 output: the classification heading ("Greenfield") had no meaning to them, and "Thinking" as a section label was not the right word.

**Information used:**
- User feedback on the greenfield preview eval output: "printing out the Classification has no meaning to me. And relabel 'Thinking' to 'Observations'"

**Alternatives considered:**
- *(No alternatives visible in context)* — user gave direct corrections

**Decision:** Rename "Thinking Block" to "Observations Block" throughout the skill. Mark classification as internal — not presented to user.

**Rationale:** The classification is for the MCP's internal use (determining context type). The user sees the observations, not the internal machinery. "Observations" better describes what the block contains from the user's perspective.

**Confidence:** High — direct user feedback.
