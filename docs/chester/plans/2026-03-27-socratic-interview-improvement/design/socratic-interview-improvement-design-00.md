# Design Brief: Socratic Interview Improvement

## Date: 2026-03-27

## Problem

The chester-figure-out SKILL.md's implementation-flavored language causes the agent's design frame to decay by Phase 3. The agent operates on the local language of whichever section it's currently executing, not on document-level framing established in the title or opening paragraph. Implementation vocabulary in the operational sections — "read code," "codebase exploration," "use the codebase to answer questions" — primes implementation thinking during the design interview.

Four specific failures traced to this linguistic drift (Sprint 050 AAR):
1. Mechanism questions asked before design questions
2. Existing boundaries treated as constraints rather than design choices
3. Planning/specification bleed into the interview
4. Missing abstraction-level checks

## Solution: Two-Layer Framing

### Layer 1 — Persona Injection

A new section between Phase 1 (Administrative Setup) and Phase 2 (Context & Problem Statement) establishes the agent's identity as a Software Architect. This is placed after admin so the persona activates at the threshold between "set up your workspace" and "begin your design work."

Format: single framing sentence + five essential trait bullets.

**Five essential traits (distilled from Software Architect competencies):**
1. **Reads code as design history** — sees patterns, boundaries, and connections as evidence of decisions someone made, not as inventory to be catalogued
2. **Thinks in trade-offs** — balances technical against goals, current state against future needs, never optimizes a single axis
3. **Evaluates boundaries as choices** — existing structure is the result of prior design, not an immutable constraint
4. **Operates across abstraction levels** — moves fluidly between "what should this achieve" and "what pattern supports that"
5. **Aligns architecture to intent** — links every structural decision back to what the human is trying to accomplish

### Layer 2 — Vocabulary Consistency

Targeted rewording at five points so the language matches how a Software Architect would naturally describe their own activities. Not arbitrary design-flavoring — role-consistent language.

### Why Both Layers

- Persona without vocabulary: the agent knows who it is but executes implementation-framed instructions. The local language wins in the moment.
- Vocabulary without persona: the words are right but there's no identity anchoring them across sections. The frame has no persistence mechanism.
- Together: self-consistent identity + self-consistent language = sustained design frame that doesn't depend on the agent remembering the document title.

## The Five Changes

### 1. Frontmatter Description

**Current:** "Resolves open design questions through Socratic dialogue before implementation."

**Rewritten:** "Resolves open design questions through Socratic dialogue before creating a specification."

**Rationale:** Defines the skill relative to the next pipeline stage, not relative to implementation.

### 2. New Section: Role — Software Architect

**Location:** Between Phase 1 (Administrative Setup) and Phase 2 (Context & Problem Statement).

**Format:** Own named section (`## Role: Software Architect`). Single framing sentence followed by five trait bullets (see Layer 1 above).

**Rationale:** Establishes identity at the threshold between administrative setup and design work. Own section gives structural weight — it's a phase transition, not a preamble to skim past.

### 3. Phase 2 Anchor Sentence

**Current:** "Explore project context — read code, docs, recent commits relevant to the idea"

**Rewritten:** "Study the codebase as a record of design decisions — understand the patterns chosen, the boundaries drawn, and the intent behind the existing architecture. Prepare yourself to serve in your role of Software Architect."

**Rationale:** Same activity (reading files, checking commits), different cognitive frame. The agent reads code as design history, not as implementation inventory.

### 4. Phase 3 Question Types

**Current:** "codebase exploration" (appears in Clarifying and Assumption-probing types)

**Rewritten:** "codebase design"

**Rationale:** Keeps "codebase" grounded but adds "design" to frame what the agent is examining. Closes ambiguity that would let the persona drift.

### 5. Phase 3 Stopping Criterion

**Current:** "Soft — when remaining decisions become minor (implementation details any competent implementer could resolve)"

**Rewritten:** "Soft — when remaining design decisions become minor and will have little influence on patterns, boundaries, or architecture"

**Rationale:** Defines "minor" relative to design impact, not relative to implementation skill. Uses architect vocabulary (patterns, boundaries, architecture).

## What Stays Unchanged

- Document structure and phase sequence
- Phase 1 (Administrative Setup)
- Phase 3 behavioral constraints (including "Use the codebase to answer questions the agent can discover itself")
- Phase 3 secondary stopping signal
- Stream-of-consciousness example
- MCP integration section
- Emergent tree tracking
- Phase 4 (Closure)
- File naming conventions
- Integration section
- Visual companion reference

## How This Addresses Each AAR Failure

| AAR Failure | How Persona Prevents It | How Vocabulary Reinforces It |
|-------------|------------------------|------------------------------|
| Mechanism before design | Architect asks "what should this achieve" before "how" | Phase 2 frames code-reading as understanding design intent |
| Boundaries as constraints | Architect evaluates boundaries as revisable choices | Trait bullet: "evaluates boundaries as choices" |
| Planning/spec bleed | Architect in discovery explores solution space | Stopping criterion: "design decisions" not "implementation details" |
| Missing abstraction checks | Architect operates across abstraction levels | Trait bullet: "operates across abstraction levels" |
