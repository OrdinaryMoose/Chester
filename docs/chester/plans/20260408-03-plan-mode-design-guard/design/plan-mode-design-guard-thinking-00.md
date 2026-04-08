# Thinking Summary: Plan Mode Design Guard

**Sprint:** 20260408-03-plan-mode-design-guard
**Date:** 2026-04-08

---

## Decision History

### 1. Initial framing: Plan Mode as structural enforcement

The feature brief framed the problem as replacing behavioral prohibitions with a platform constraint. Plan Mode would prevent file writes at the tool level, making prohibition instructions unnecessary. Initial analysis focused on where to insert EnterPlanMode/ExitPlanMode and how much of the HARD-GATE could be simplified.

**Status:** Superseded by designer's reframe.

### 2. Designer correction: token cost is a byproduct, not a driver

The agent initially framed the motivation as both reliability and token efficiency. The designer corrected: token cost is a byproduct of long interviews caused by poor protocol design. The real question is how to use better behavioral instructions to discourage implementation drift. This narrowed the problem from "add Plan Mode" to "design better behavioral instructions, of which Plan Mode is one tool."

**Status:** Accepted, reshaped the entire design direction.

### 3. Prohibition vs. channeling — applying the architect Round One lesson

The prior sprint (20260405-01-architect-round-one-fix) established that prohibitions lose against the agent's completion drive, and redirecting goals works better. The agent initially proposed Plan Mode as a sufficient structural answer, since it operates at the platform level rather than the instruction level. The designer pushed further: what positive activity could channel the agent's energy the way the understanding MCP channels Phase 1 energy?

**Status:** Key inflection point. Led to the design deliverable concept.

### 4. The agent wants to write — let it write the design

Designer's insight: instead of preventing writing, redirect what the agent writes. If the design itself is the "code" — a concrete, structured, progressively complete artifact — the agent's completion drive works for you. The agent gets to build something every turn, but the thing it builds is the design, not implementation code.

**Status:** Accepted. Core design principle.

### 5. Formal proof language over structured prose

Designer pushed for a symbolic/formal notation rather than a structured document. Analogy to geometric proofs: each symbol means something, each step must follow from prior steps, the proof is verifiable. Optimized for the machine (the agent), not for human readability — the designer reads it only for debugging.

**Status:** Accepted. Led to the seven element types and four operations.

### 6. Proof subsumes enforcement MCP

The agent identified that challenge modes and closure gates could be derived from proof structure rather than self-assessed dimension scores. Contrarian triggers from untested assumptions in basis chains. Simplifier triggers from scope growth outpacing resolution. Ontologist triggers from proof completeness plateaus. This eliminates both MCPs — understanding (Phase 1 becomes conversational + Plan Mode) and enforcement (Phase 2 becomes proof-driven).

**Status:** Accepted after designer confirmed that enforcement's challenge triggers were the main thing to preserve, and the proof provides better (structural vs self-assessed) signals for those triggers.

### 7. Plan Mode scoping across phases

Phase 1: Plan Mode active, no MCP, pure conversation. Phase 2: Plan Mode off, proof MCP active, agent writes proof elements. The transition (ExitPlanMode) is the moment the agent earns the right to write — and what it writes is the proof. Commentary surface stays consistent across both phases.

**Status:** Final design.

---

## Alternatives Considered

- **Plan Mode only** — sufficient for preventing file writes but doesn't address the agent's drive to think in implementation terms. Rejected by designer as "not the interesting question."
- **Living design model (Mermaid diagrams)** — visual artifact updated each turn. Considered but superseded by the proof language, which provides more structure and machine-verifiable rigor.
- **Adversarial design artifact (threat model)** — channels analytical drive toward breaking the design. Interesting but too narrow — doesn't cover the full range of design reasoning.
- **Progressive spec draft** — running spec skeleton growing each turn. Close to the final design but less formal — prose with structure rather than a verifiable proof.
- **Proof alongside enforcement MCP** — keep enforcement for scoring, add proof for channeling. Rejected as redundant — the proof provides better signals than self-assessed scores.

---

## User Corrections

1. Token cost is not a driver for this redesign — it's a byproduct of poor protocol design causing long interviews.
2. The problem is narrower than the feature brief suggests: better behavioral instructions, not just Plan Mode integration.
3. Plan Mode works as a blanket even if the agent invokes implementation skills — those skills can't write either.
4. "What if the design is the code and the agent writes that" — the key reframe that redirected the entire design.
5. The proof notation should be machine-first since the designer only inspects it for debugging.
6. Understand phase stays conversational with Plan Mode, no MCP.
7. Solve phase still uses the same commentary format — the proof drives it but doesn't replace it.
8. This is a fork (design-experimental), not a modification of design-figure-out.
