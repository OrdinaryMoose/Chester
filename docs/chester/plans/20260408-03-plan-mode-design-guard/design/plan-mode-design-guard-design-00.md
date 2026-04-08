# Design Brief: Experimental Design Skill with Formal Proof Language

**Sprint:** 20260408-03-plan-mode-design-guard
**Status:** Design complete — ready for specification
**Date:** 2026-04-08
**Type:** New experimental skill forked from design-figure-out

---

## Problem Statement

The design interview's behavioral prohibitions ("don't write code," "don't propose solutions") fight the agent's natural completion drive rather than channeling it. The agent accumulates a rich mental model during codebase exploration and feels compelled to produce concrete output — code, finished analyses, implementation plans. Stacking "don't do X" instructions consumes token budget and degrades over long contexts. The prior architect Round One fix established the principle: redirect the agent's goal rather than prohibiting behavior. That principle was applied to the conversation layer (understanding MCP replaced "don't produce a problem statement" with "score your understanding gaps"). It has not yet been applied to the action layer — the agent's drive to write concrete, structured output.

---

## Design Direction

Fork `design-figure-out` into `design-experimental`. Replace both MCPs with a two-phase model that channels the agent's energy through structural means rather than prohibitions.

### Phase 1: Understand (Plan Mode, No MCP)

- Bootstrap → `EnterPlanMode`
- The agent explores the codebase (Read/Glob/Grep), dispatches explorer subagents (Agent), and converses with the designer
- Per-turn visible surface: observations, information package, commentary, "what do you think?"
- No MCP, no scoring, no structured submissions — pure conversation
- Plan Mode serves as the behavioral floor: the agent literally cannot write files, so there's no need for prohibitions against code writing or premature artifact production
- Phase 1 content guidance stays (no solutions, no problem statements) — reinforced by Plan Mode preventing any artifacts from being written
- Transition: designer confirms understanding is sufficient

### Phase 2: Solve (Plan Mode Off, Design Proof MCP Active)

- `ExitPlanMode` → write problem statement → initialize proof MCP
- The problem statement seeds the proof with initial GIVENs and CONSTRAINTs
- Per-turn cycle:
  1. Read designer's response
  2. Update proof (add/resolve/revise/withdraw elements based on what was learned)
  3. Submit to MCP → receive validation, challenge triggers, completeness metrics
  4. Use MCP feedback to choose topic
  5. Compose observations, information package, commentary — same visible surface as Phase 1, driven by proof state
  6. "What do you think?"
- The proof file lives at `{working-dir}/{sprint}/design/{sprint-name}-proof.json`
- The agent's completion drive is channeled into building the proof — a concrete, structured, progressively complete artifact that IS the design
- Closure: proof complete per five conditions (see below)

### The Design Proof Language

Seven element types — the vocabulary the agent writes in:

| Type | Purpose | Required Fields |
|------|---------|----------------|
| `GIVEN` | Established fact from codebase or designer | id, statement, source (codebase/designer/observation) |
| `CONSTRAINT` | Fixed point limiting the solution space | id, statement, from (basis references) |
| `ASSERTION` | Claim the agent believes true, subject to challenge | id, statement, basis (references), confidence (0-1) |
| `DECISION` | Resolved design choice | id, statement, over (rejected alternatives), because (references) |
| `OPEN` | Unresolved question | id, statement, blocks (downstream dependents), leaning (current guess or none) |
| `RISK` | Identified threat to the design | id, statement, if (trigger condition), impacts (affected element references) |
| `BOUNDARY` | Explicitly out of scope | id, statement, reason |

Four operations per turn:

| Operation | Effect |
|-----------|--------|
| `add` | New element enters the proof |
| `resolve` | OPEN becomes a DECISION (or gets eliminated) |
| `revise` | Existing element updated — statement, confidence, or basis changes |
| `withdraw` | Element removed (rejected by designer or superseded) |

### Design Proof MCP — Validation and Feedback

The MCP receives proof updates each turn and returns:

- **Referential integrity** — every basis/from/because/impacts reference points to a real element
- **No circular chains** — A's basis can't eventually reference A
- **Integrity warnings** — four structural anomaly checks:
  - Withdrawn-basis citation: a DECISION or ASSERTION cites an element that was later withdrawn
  - Boundary collision: a DECISION's basis chain passes through an element also referenced by a BOUNDARY
  - Confidence inversion: a high-confidence ASSERTION's basis chain passes through a low-confidence ASSERTION
  - Stale dependency: an element was revised but downstream elements citing it were not
- **Cascade warnings** — revised or withdrawn element has downstream dependents
- **Completeness metrics** — total elements, OPENs remaining, decisions without full basis chains
- **Challenge trigger** — if conditions are met (see below)
- **Closure permitted** — boolean

Note: The MCP performs structural validation only. Semantic contradiction detection (two statements saying opposite things in natural language) is the agent's responsibility through its own reasoning during commentary. Start simple, iterate in future versions.

### Challenge Modes (Derived from Proof Structure)

| Mode | Trigger | What It Detects |
|------|---------|-----------------|
| Contrarian | High-confidence ASSERTION with no designer-sourced GIVEN in its basis chain | Untested load-bearing assumption |
| Simplifier | Proof element count growing faster than OPEN count shrinking | Scope expansion outpacing resolution |
| Ontologist | Proof completeness plateaued for 3 turns (same OPEN count, no new DECIDEs) | Interview stalled |
| Auditor | Self-triggered from lessons table (unchanged from design-figure-out) | Historical pattern repeating |

### Closure Conditions

1. Zero OPENs remaining
2. Every DECISION has a complete basis chain back to GIVENs and CONSTRAINTs
3. At least one BOUNDARY exists (non-goals explicit)
4. At least one DECISION has an `over` field with alternatives (decision boundaries explicit)
5. At least one element was revised after a designer interaction (pressure was applied and absorbed)

---

## Scope

### In Scope

- New skill: `skills/design-experimental/SKILL.md` — forked from `design-figure-out`, restructured for proof-based Phase 2
- New MCP: Design Proof server — validates proof structure, triggers challenges, gates closure
- Plan Mode integration — `EnterPlanMode` at bootstrap, `ExitPlanMode` at phase transition
- Registration in `.plugin-mcp.json` and `setup-start` available skills list

### Out of Scope

- Modifying `design-figure-out` (stays as production skill)
- Modifying the understanding or enforcement MCPs (they remain for design-figure-out)
- Changing downstream skills (design-specify, plan-build) — experimental skill feeds into same pipeline
- Changing the visible conversation surface (observations, information package, commentary model stays)
- Compaction hook updates — compaction hooks are themselves experimental; avoid compounding experimental features. If design-experimental proves out, compaction support is added in a follow-up.
- Semantic contradiction detection — the MCP validates proof structure, not statement meaning. Future versions may add NLU-based contradiction detection.

---

## Non-Goals

- Replacing design-figure-out — this is an experiment to validate the proof approach
- Optimizing the proof language for human readability — it's a machine-first artifact, inspected by the designer only for debugging
- Building a general-purpose design proof system — scoped to Chester's design interview

---

## Assumptions

- Plan Mode's tool restrictions are sufficient to prevent all file modifications during Phase 1
- MCP tools (proof MCP) can write their own state files via Node.js fs operations while Plan Mode is active for the agent (consistent with existing understanding/enforcement MCP behavior — but Plan Mode won't be active during Phase 2 anyway)
- The agent's completion drive will engage with writing proof elements as a satisfying substitute for writing code
- The proof language's seven types and four operations are sufficient to express design reasoning (may need tuning after experiments)

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Proof overhead lengthens interviews instead of shortening them | Medium | Monitor total rounds in experimental runs vs design-figure-out baselines |
| Agent treats proof writing as busywork, drifts anyway | Medium | The proof IS the design work — if it feels like busywork, the primitives need redesign |
| Seven element types are too many / too few | Low | Start with seven, tune based on experimental sessions |
| Phase 1 without MCP loses rigor (no scoring discipline) | Medium | Phase 1 quality depends on the commentary model and designer participation — this is a deliberate simplification; the experiment tests whether MCP-governed scoring was necessary |
| Proof language too rigid for messy early-stage design | Low | `confidence` field on ASSERTIONs and `leaning` field on OPENs allow imprecision |

---

## Specification Notes

The following items were identified by adversarial review and need resolution during specification:

1. **Resume protocol** — the experimental skill needs a resume protocol for proof state recovery after interruption. The proof state is on disk (`*-proof.json`); the spec must define the tool call sequence to reload it and determine where to resume.
2. **Round cap and safety mechanisms** — design-figure-out has a round 20 hard cap, early exit after 3 rounds, checkpoints every 5 rounds, and stall recovery. The experimental skill needs equivalents. The Ontologist handles stall detection, but a hard cap is needed for when it doesn't break the stall.
3. **MCP tool surface** — the brief describes validation behavior but not the tool contracts. The spec must define the tools (likely `initialize_proof`, `submit_proof_update`, `get_proof_state`), their input schemas, and return shapes.
4. **Element lifecycle on resolve** — when an OPEN is resolved into a DECISION, specify whether the OPEN is removed or retained with a resolved status. This affects how completeness metrics count "zero OPENs remaining."
5. **ExitPlanMode framing** — ExitPlanMode at the phase transition presents a plan summary for approval. The skill must instruct the agent to frame this as a transition confirmation ("here's what we've understood — ready to solve?"), not a closure summary.

---

## Key Reasoning Shifts

1. **From** "prevent code writing" **to** "give the agent something better to write" — triggered by designer's reframe of the problem from constraint to channeling
2. **From** "Plan Mode as primary solution" **to** "Plan Mode as floor, proof as the interesting design" — triggered by designer identifying that Plan Mode is solved and not the interesting question
3. **From** "self-assessed dimension scoring" **to** "structural proof completeness" — challenge modes and closure derived from proof integrity rather than the agent scoring its own clarity

---

## Integration

- **Creates:** `skills/design-experimental/SKILL.md`, Design Proof MCP server
- **Registers in:** `.plugin-mcp.json`, `setup-start` available skills list (opt-in — design-figure-out remains the default for creative work; design-experimental is invoked explicitly)
- **Does not modify:** `design-figure-out`, understanding MCP, enforcement MCP, compaction hooks, any downstream skills
- **Transitions to:** `design-specify` (same handoff — closure produces `{sprint-name}-design-00.md` at the standard path for design-specify compatibility)
