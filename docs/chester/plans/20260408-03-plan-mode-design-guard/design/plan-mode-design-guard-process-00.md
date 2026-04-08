# Process Evidence: Plan Mode Design Guard

**Sprint:** 20260408-03-plan-mode-design-guard
**Date:** 2026-04-08

---

## Interview Profile

- **Total rounds:** 7 (3 understand, 4 solve)
- **Phase 1 (Understand):** 3 rounds — short, designer redirected to solve quickly
- **Phase 2 (Solve):** 4 rounds — compact, strong designer direction accelerated resolution
- **Phase 2 length relative to Phase 1:** Longer, but Phase 1 was curtailed by designer's early reframe
- **MCP availability:** Understanding and enforcement MCPs were not available (plugin not loaded with --plugin-dir). Scoring was manual.

## Phase 1 Trajectory

Round 1 presented the gap map — strong on codebase coverage, weak on human context. The agent framed the problem around reliability vs elegance tradeoffs. The designer immediately corrected this framing: token cost is a byproduct, not a driver. The real concern is protocol quality. This correction arrived in round 2 and was strong enough that the designer directed an early transition to solve with a provided problem statement.

The conversation pulled vertical fast because the designer had a clear problem in mind and the agent's initial framing was off-target. Phase 1's brevity reflects designer certainty, not insufficient exploration.

## Phase 2 Trajectory

Round 1 (Solve): Explored solution space — Plan Mode as structural floor, existing instructions for conversational quality. Agent proposed trimming the HARD-GATE. Designer corrected: Plan Mode covers everything including downstream skill invocations.

Round 2: Designer introduced the key reframe — minimize hard gates, find a natural channeling approach. Referenced the "summarize not question" improvement from the architect round-one fix. This shifted the problem from "how to constrain" to "how to channel."

Round 3: Agent proposed four options for design-level deliverables. Designer pushed further: "what if the design is the code and the agent writes that." This was the breakthrough — redirect what the agent writes, not whether it writes.

Round 4: Designer pushed for formal symbolic notation (geometric proof analogy), machine-first, with Plan Mode as floor. Confirmed full scope: fork into experimental skill, remove both MCPs, proof MCP only in Solve phase.

## Key Moments

- **Round 2 correction** (understand → solve): Designer provided the problem statement directly, cutting short an understanding phase that was heading in the wrong direction.
- **Round 2 (solve)**: Designer connected the current problem to the prior architect round-one lesson. The agent had the lesson in its thinking history but hadn't applied it to the action layer.
- **Round 3 (solve)**: "What if the design is the code" — designer's insight that flipped the design from constraint-based to channeling-based.
- **Round 4 (solve)**: Geometric proof analogy, machine-first notation, scope confirmation.

## Challenge Modes

No challenge modes fired. The interview was compact (7 rounds total) and the designer drove direction strongly throughout. The Auditor was applicable — the lessons table contains the "redirect rather than prohibit" lesson at score 1 — but the designer surfaced the same insight before the Auditor would have triggered.

## Drift Assessment

The agent initially drifted toward a constraint-focused framing (Plan Mode as the answer) rather than a channeling-focused framing (what's more compelling than code). The designer corrected this twice: once by reframing the problem statement, once by asking "what if the design is the code." Both corrections were absorbed cleanly — the agent updated its model rather than defending its prior position.

## Process Notes

- Understanding and enforcement MCPs were unavailable, so scoring was tracked manually. This didn't materially affect the interview — the designer's strong direction compensated for the lack of MCP-enforced rigor.
- The interview was efficient (7 rounds) despite the significant design pivot mid-session. The designer's clarity on the problem drove fast convergence.
