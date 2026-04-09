# Concept of Operations: Design Proof System Refactor

**Date:** 2026-04-08
**Context:** Post-inaugural-run review of the design-experimental skill and its proof MCP
**Target repository:** /home/mike/Documents/CodeProjects/Chester
**Affected files:**
  - `skills/design-experimental/SKILL.md` — skill instructions
  - `skills/design-experimental/proof-mcp/proof.js` — element model, integrity checks
  - `skills/design-experimental/proof-mcp/metrics.js` — completeness, challenges, closure
  - `skills/design-experimental/proof-mcp/state.js` — state lifecycle, operations
  - `skills/design-experimental/proof-mcp/server.js` — MCP tool definitions

---

## Background

### What the proof system is

The design-experimental skill uses a Design Proof MCP to add formal rigor to Phase 2 (Solve) of a two-phase design discovery session. Phase 1 (Understand) is pure conversation under Plan Mode — no MCP. Phase 2 introduces the proof MCP, which tracks design elements (facts, constraints, decisions, open questions, etc.) and enforces convergence through integrity checks, challenge triggers, and closure gates.

The MCP provides three tools:
  - `initialize_proof` — creates a clean proof state with a problem statement
  - `submit_proof_update` — accepts a batch of operations (add, resolve, revise, withdraw) and returns integrity warnings, challenge triggers, and closure status
  - `get_proof_state` — returns the full proof state for resumption or closure

### What happened in the inaugural run

The proof system was used for the first time during a canonical format design session for StoryDesigner. The session produced a valid design brief through 12 rounds (5 understand + 7 solve). A post-session review of the proof's operation against the session JSONL revealed systemic problems with how the proof was structured, how element types were defined, and what the proof was actually measuring.

### The core finding

**The agent was talking to itself through the proof.**

The agent authored the problem statement, created questions (OPENs), answered its own questions, recorded its own conclusions (ASSERTIONs), synthesized designer statements into formal decisions, and drove toward closure by resolving its own elements. The proof tracked the agent's internal model of the conversation, not the design itself. The designer interacted through natural conversation; the proof was invisible to them. The formal rigor was real — but it was the agent being rigorous with itself, not the designer being rigorous with the agent.

The proof system has no mechanism for the designer to directly author, confirm, or reject individual elements. Everything is mediated through the agent's interpretation.

---

## Issues Identified

Seven issues were identified during the round-by-round review. They cluster into three themes: element type confusion, agent self-reference, and missing logical structure.

### Theme 1: Element type confusion

**Issue 4 — CONSTRAINTs used as actions, not restrictions.** The agent recorded architectural properties as constraints — "must consume only Contracts interfaces," "must preserve Logic's role." These are positive requirements, not prohibitions. A constraint should say "the design must NOT..." — it eliminates territory. These read as acceptance criteria.

**Issue 5 — BOUNDARY and CONSTRAINT are too similar.** In practice, the agent used BOUNDARYs ("out of scope") as proper constraints (territory the design cannot enter) and CONSTRAINTs as architectural requirements. The two types overlap enough that the agent had to choose between them arbitrarily each time. The choice carried no structural meaning.

**Issue 6 — GIVENs conflate codebase facts with designer declarations.** The GIVEN type uses a `source` field ("codebase" vs "designer") to distinguish fundamentally different kinds of elements: verifiable observations the agent found in code vs authoritative declarations from the designer about intent and direction. These serve different roles in reasoning chains and should have different integrity properties. A codebase fact can be wrong (agent misread the code). A designer declaration carries authority and can't be "wrong" — it IS what the designer wants.

### Theme 2: Agent self-reference

**Issue 1 — The problem statement was an agent summary, not the designer's problem.** The designer provided a one-sentence problem statement. The agent expanded it into a paragraph that embedded the agent's framing, added requirements the designer hadn't stated, and prescribed solution characteristics. The proof then validated against the agent's version, not the designer's.

**Issue 2 — Actions added to the problem statement that the designer didn't intend.** The agent inserted "validation state" as a requirement, specified "structured, relationship-aware representation built from DTO identity and FK references" (prescribing the solution shape inside the problem statement), and scoped to "centers all presentation, validation, and persistence operations" (expanding "centers everything" into a specific list). The known lesson — "a problem statement must describe the pain, not prescribe the solution" — was violated.

**Issue 3 — OPEN elements were agent-generated concerns, not design questions.** The agent used OPEN to park its own implementation anxieties (how does the DSL editor map text back to DTOs? what happens to the display pipeline?). Three of four OPENs were either already answered or were implementation details the designer didn't consider design-level questions. The agent then resolved its own OPENs to drive the closure metric toward zero — the convergence was bookkeeping, not design progress.

### Theme 3: Missing logical structure

**No "if...then" reasoning chains.** The proof tracks element inventory (what facts exist, what decisions were made) with flat `basis` arrays. But it doesn't track logical reasoning. A decision references elements G7, G10, G13, G14 — but there's no connective tissue showing HOW those premises lead to the conclusion. The proof can verify that a decision cites its premises but cannot verify that the conclusion follows from them.

**No falsifiability.** The proof has no mechanism for stating what would invalidate a decision. If a premise turns out to be wrong, which decisions collapse? The basis chain supports tracing backward (this decision depends on these elements) but doesn't support forward reasoning (if this element changes, these decisions are affected). The stale-dependency integrity check is a weak version of this, but it only fires when an element has been revised, not when an element's truth is questioned.

---

## Design Concept: Necessary Conditions Model

### What we're trying to prove

The current system asks "are all the bookkeeping requirements met?" (zero OPENs, basis coverage, minimum rounds). This measures the agent's organizational completeness, not the design's logical soundness.

The redesigned system should ask: **"Is every necessary condition for this design grounded and justified?"**

A necessary condition is something that MUST be true for the design to hold. Remove it and the design collapses. The proof is the set of necessary conditions, each with a reasoning chain showing why it's necessary and a collapse test showing what breaks if it's removed.

### Element types

Replace the current seven types with five:

**EVIDENCE** (replaces codebase-sourced GIVEN)
  - Facts discovered in the codebase through research
  - Agent-sourced, verifiable, mutable (changes if the code changes)
  - Can be challenged: "did you read that correctly?"
  - Describes what IS
  - Example: "The display pipeline round-trips through text — approximately 1,481 lines across four classes"
  - Example: "The import pipeline has a structured precedent (MappedDocument) but has no caller"

**RULE** (replaces CONSTRAINT + designer-sourced GIVEN + BOUNDARY-as-restriction)
  - Designer-directed restrictions on the design space
  - Adds a restriction beyond what's already codified in ADRs, TDRs, and the dependency graph
  - Designer-sourced only — the agent cannot create RULEs
  - Includes scope restrictions ("this is out of scope"), architectural mandates ("core is immutable"), and design directives ("five consumers are planned," "DTOs are the WHAT, the IL is the HOW")
  - Example: "The canonical form must not be shaped around any single consumer"
  - Example: "Compiler/validation ownership is out of scope for this session"

**PERMISSION** (replaces BOUNDARY-as-relief)
  - Designer-directed relief from an existing restriction
  - Enables the agent to explore design space that would normally be off-limits
  - Designer-sourced only — the agent cannot create PERMISSIONs
  - Example: "You may override ADR-ARCH-100 for this design"
  - Example: "Ignore TDR-PIPE-125 constraints when considering the canonical form's relationship to Language"

**NECESSARY CONDITION** (replaces ASSERTION + DECISION)
  - Something that must be true for the design to hold
  - Can be proposed by the agent, but must be grounded in EVIDENCE, RULEs, or PERMISSIONs
  - Each condition has:
    - A statement: what must be true
    - Grounding: which EVIDENCE, RULEs, or PERMISSIONs support it
    - A reasoning chain: IF [premises] THEN [this condition is necessary]
    - A collapse test: what breaks if this condition is removed
    - Rejected alternatives: what other conditions were considered instead
  - Example: "The canonical form must be consumer-neutral. IF five consumers are planned (RULE) AND text format is native to only one (EVIDENCE) THEN the canonical form cannot be text. Remove this: the canonical form becomes text, four of five consumers pay a permanent translation tax."

**RISK** (retained, unchanged)
  - Identified hazards, fragile assumptions, residual concerns
  - Can be proposed by anyone
  - Attached to specific necessary conditions
  - Example: "The display pipeline migration (~1,481 lines) is deferred — dual-format maintenance burden exists until migrated"

### What's removed

**OPEN is removed entirely.** The agent cannot create self-referential questions that gate closure. Design questions emerge from the conversation. If the designer raises a question, it becomes a RULE ("we need to resolve X before proceeding") or it's noted in commentary. The closure gate no longer counts OPENs.

**ASSERTION is absorbed into NECESSARY CONDITION.** An analytical conclusion without a collapse test is not a proof element — it's commentary. If the agent believes something is true, it either proposes it as a necessary condition (with grounding and collapse test) or states it in conversation.

**BOUNDARY is absorbed into RULE.** Scope exclusions are restrictions the designer places. "Out of scope" IS a rule: "the design must not address X."

### Proof structure per necessary condition

```
NECESSARY CONDITION: [statement]
├── Grounding
│   ├── RULE: [restriction it complies with]
│   ├── PERMISSION: [relief that enables it, if applicable]
│   └── EVIDENCE: [codebase fact that supports it]
├── Reasoning chain: IF [premise 1] AND [premise 2] THEN [this is necessary]
├── Collapse test: Remove this → [what breaks, why the design fails]
├── Rejected alternatives: [other conditions considered, why rejected]
├── Risks: [attached RISKs, if any]
└── Status: Grounded / Ungrounded / Challenged
```

### Integrity checks (revised)

**Ungrounded condition** — a necessary condition that isn't supported by at least one RULE, PERMISSION, or EVIDENCE. This replaces the withdrawn-basis and confidence-inversion checks. An ungrounded condition is the agent making a design claim without support.

**Rule violation** — a necessary condition that contradicts an active RULE. This replaces the boundary-collision check. The proof can mechanically verify that no condition crosses into territory a RULE excludes.

**Stale grounding** — a necessary condition whose grounding EVIDENCE has been revised but the condition hasn't been reconsidered. This is the existing stale-dependency check, preserved.

**Missing collapse test** — a necessary condition without a collapse test. If you can't say what breaks when you remove it, it may not actually be necessary.

### Challenge triggers (revised)

**Simplifier** — condition count is growing without conditions being consolidated. Same mechanical trigger as today (element count grows without convergence), but now it asks: "are all of these conditions genuinely necessary, or can some be consolidated?"

**Contrarian** — a necessary condition is grounded only in EVIDENCE with no RULE. The agent is deriving design requirements from code alone without designer authority. "The codebase says X, therefore the design must do Y" — but did the designer say so?

**Ontologist** — stall detected (same trigger as today). Forces reframing: "are we asking the right question?"

**Auditor** — self-triggered (same as today). Checks lessons table for historical pattern matches.

### Closure conditions (revised)

  - All necessary conditions are grounded (no ungrounded conditions)
  - Every condition has a collapse test
  - At least one condition has rejected alternatives
  - At least one condition has been revised after designer interaction
  - Minimum 3 rounds
  - No active integrity warnings

### Problem statement handling (new)

The problem statement must be the designer's words. The agent may ask the designer to clarify or refine it, but must not expand, elaborate, or rewrite it. The proof is initialized with the designer's verbatim statement. If context is needed, it's added as separate EVIDENCE and RULE elements, not embedded in the problem statement.

The skill should present the problem statement back to the designer for explicit confirmation before calling `initialize_proof`.

### Closing argument (new)

Before writing the design brief, the agent must present a closing argument:

  - The designer's problem statement (verbatim)
  - Each necessary condition with its reasoning chain and grounding
  - What was explicitly excluded (RULEs that defined scope boundaries)
  - Where the reasoning is weakest (RISKs, low-grounding conditions)
  - The collapse test summary: "if any one of these N conditions is removed, here's what breaks"

The designer approves or challenges the closing argument. This is the design's proof — not the element inventory, but the reasoned argument from premises to conclusions.

---

## Implementation Scope

### MCP changes (proof-mcp/)

**proof.js:**
  - Replace `ELEMENT_TYPES` array: remove GIVEN, CONSTRAINT, ASSERTION, DECISION, OPEN, BOUNDARY. Add EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION. Keep RISK.
  - Update `createElement()` validation:
    - EVIDENCE: requires `source` (must be "codebase" or similar, NOT "designer")
    - RULE: requires `source` (must be "designer"), no agent-sourced RULEs permitted
    - PERMISSION: requires `source` (must be "designer"), requires `relieves` field (what restriction is being relaxed)
    - NECESSARY_CONDITION: requires `grounding` (array of element IDs — must contain at least one EVIDENCE, RULE, or PERMISSION), requires `collapse_test` (string describing what breaks), requires `reasoning_chain` (string with IF...THEN structure), optional `rejected_alternatives` (array of strings)
    - RISK: unchanged
  - Update element ID prefixes: E = EVIDENCE, R = RULE (conflicts with RISK?), P = PERMISSION, N = NECESSARY_CONDITION, K = RISK (or alternative prefix scheme)
  - Revise integrity checks:
    - `checkUngrounded()` — necessary condition with empty or invalid grounding
    - `checkRuleViolation()` — necessary condition contradicting a RULE (requires semantic overlap detection — may need to be simplified to basis-chain overlap)
    - `checkStalGrounding()` — existing stale-dependency check, adapted for new types
    - `checkMissingCollapseTest()` — necessary condition without a collapse_test field
    - Remove: `checkConfidenceInversion()` (no more confidence scores), `checkBoundaryCollision()` (absorbed into rule violation)

**metrics.js:**
  - Update `computeBasisCoverage()`: necessary conditions must ground in EVIDENCE/RULE/PERMISSION leaves (replacing GIVEN/CONSTRAINT)
  - Update `detectChallenge()`:
    - Simplifier: same trigger but counts NECESSARY_CONDITIONs instead of total elements
    - Contrarian: necessary condition grounded only in EVIDENCE, no RULE (replacing "no designer GIVEN in basis")
    - Ontologist: unchanged (stall detection on condition count)
  - Update `checkClosure()`:
    - Remove: zero OPENs requirement (OPEN type no longer exists)
    - Add: all necessary conditions grounded
    - Add: all necessary conditions have collapse tests
    - Keep: at least one condition with rejected alternatives
    - Keep: at least one revision after designer interaction
    - Keep: minimum 3 rounds
    - Add: no active integrity warnings

**state.js:**
  - Update ID generation for new type prefixes
  - Update operation processing for new element types and fields
  - Handle new fields: `grounding`, `collapse_test`, `reasoning_chain`, `rejected_alternatives`, `relieves`
  - Remove: OPEN-specific logic (resolvedBy tracking)

**server.js:**
  - Update `initialize_proof` response to reflect new element types
  - Update `submit_proof_update` parameter schema for new element fields
  - No structural changes to the tool interface

### Skill changes (SKILL.md)

  - Rewrite Phase 2 per-turn flow to use new element types
  - Remove all references to OPEN, GIVEN, CONSTRAINT, ASSERTION, DECISION, BOUNDARY
  - Add instructions for composing necessary conditions with grounding, reasoning chains, and collapse tests
  - Add instructions for the closing argument
  - Add instructions for problem statement handling (designer's words, explicit confirmation)
  - Update challenge mode descriptions for revised triggers
  - Update integrity warning surfacing for revised checks
  - Update closure protocol for revised conditions
  - Add explicit prohibition: the agent must not create RULE or PERMISSION elements — only the designer can direct these

### Test changes (proof-mcp/__tests__/)

  - Rewrite element creation tests for new types and validations
  - Rewrite integrity check tests for new checks
  - Rewrite metrics tests for new challenge triggers and closure conditions
  - Add tests for: ungrounded condition detection, missing collapse test, rule violation
  - Remove tests for: OPEN resolution, confidence inversion, boundary collision

---

## Migration Notes

  - The design-figure-out skill (non-experimental) is unaffected — it uses the understanding and enforcement MCPs, not the proof MCP
  - The proof state JSON schema changes — old state files are incompatible with the new schema
  - The design-experimental skill is explicitly opt-in (user invokes it directly), so there is no risk of breaking existing workflows
  - No other Chester skills reference the proof MCP

---

## Open Questions for Implementation

  - **ID prefix collision:** RULE and RISK both want "R". Options: use "RL" for RULE, "RK" for RISK, or single-letter alternatives (U for RULE? X for RISK?). Or switch to longer prefixes: `RULE-1`, `EVID-1`, `PERM-1`, `NCON-1`, `RISK-1`.
  - **Rule violation detection:** Mechanically detecting that a necessary condition contradicts a RULE requires semantic analysis the MCP can't do. Simplify to basis-chain overlap (same as current boundary-collision)? Or make it a manual check the agent performs?
  - **Reasoning chain format:** Free-text IF...THEN? Or a structured format with explicit premise references? Free-text is simpler but can't be mechanically validated. Structured is more rigorous but adds complexity to the submission format.
  - **Closing argument:** Should this be a new MCP tool (`compose_closing_argument` that assembles the argument from proof state)? Or a skill instruction the agent follows using `get_proof_state` output?
