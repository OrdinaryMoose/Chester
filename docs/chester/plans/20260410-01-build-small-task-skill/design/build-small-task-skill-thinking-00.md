# design-small-task — Thinking Summary

## Decision History

### Understanding Phase (Rounds 1-2, Plan Mode)

**Baseline established.** Three parallel explorer agents scanned: (1) existing design skills' conversation gating patterns, (2) Chester skill architecture and conventions, (3) skill-creator's interview vs iteration loop structural differences.

**Core diagnosis.** Skill-creator's interview rushes because its gate is advisory — 4 lines of prose, no enforcement. Its iteration loop sticks because feedback.json physically doesn't exist until the user acts. Chester's design skills solve rushing with MCP servers (understanding scoring, enforcement scoring, proof building) — effective but heavy. The gap is a lightweight conversation gate without MCP infrastructure.

**Key insight from designer.** The skill targets well-bounded tasks where the designer already knows roughly what they want. Typically invoked mid-conversation after detailed discussion. Output feeds directly into plan-build, skipping design-specify.

### Solve Phase (Rounds 3-6, Proof MCP)

**Infrastructure decisions (Round 2).** Designer confirmed: keep bootstrap, inline exploration only (synthesize conversation + code + prior art), no capture_thought, no safety valve. Rationale: bootstrap pulls its weight even for short sessions; formal explorer dispatch is overkill when the conversation already contains context.

**Translation Gate dropped (Round 3).** Designer directed: code vocabulary welcome in commentary for bounded tasks. The gate adds overhead without value when the designer already knows the territory.

**Brief format decided (Round 3).** Five sections optimized for plan-build: Goal, Scope, Key Decisions, Constraints, Acceptance Criteria. Drops the 9-section experimental format (intent, outcome, assumptions tested, residual risks) as overhead.

**Information package kept at full weight (Round 5).** Designer rejected proposal to simplify from three components to two. All three components (current facts, surface analysis, uncomfortable truths) retained.

**Proceed gate hardened (Round 6).** Designer rejected three proposed gate mechanisms (checkpoint question, magic phrase, confirmation vs action directive interpretation). Final decision: the agent has no role in the transition at all. It never suggests, recommends, or steers toward writing the brief. It stays in the conversation loop indefinitely. The designer explicitly directs proceed.

## Alternatives Considered

| Decision | Chosen | Rejected |
|----------|--------|----------|
| Bootstrap | Keep start-bootstrap | Inline reimplementation; skip entirely |
| Exploration | Three-part inline (conversation + code + prior art) | 3 explorer agents; 1 explorer agent; none |
| capture_thought | Drop | Keep with full trigger protocol |
| Round cap | None — designer controls | Soft 10-round; hard 20-round |
| Translation Gate | Drop entirely | Keep from experimental; make optional |
| Info package | Full 3 components | Reduce to 2 |
| Proceed gate | Designer-initiated only, agent has no transition role | Checkpoint question; magic phrase; confirmation interpretation |
| Brief format | 5 sections (Goal, Scope, Decisions, Constraints, Criteria) | Full 9-section experimental format; minimal 2-section |

## Understanding Shifts

1. **Exploration model shift.** Initial assumption was cold-start exploration like design-experimental. Designer corrected: skill is typically invoked mid-conversation, so existing conversation context is the primary input.

2. **Proceed gate escalation.** Started with "treat confirmations differently from action directives" — designer pushed for harder gate. Then "agent asks checkpoint question" — designer pushed harder. Final: agent has no role in transition at all. Each escalation reflected the designer's direct experience with completion bias overriding advisory instructions.

3. **Information package weight.** Proposed simplifying to two components for a lighter skill. Designer rejected — the three-component structure is the presentation style they explicitly want preserved, regardless of skill weight.
