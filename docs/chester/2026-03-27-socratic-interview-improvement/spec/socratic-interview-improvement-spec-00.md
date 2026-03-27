# Spec: Socratic Interview Improvement

## Overview

Rewrite the chester-figure-out SKILL.md to sustain the design frame across all sections through two complementary mechanisms: persona injection and vocabulary consistency. The document's structure, phases, and mechanics are preserved — only the language and a new section are changed.

## Background

The agent operates on the local language of whichever section it's currently executing. By Phase 3 (the Socratic interview), implementation-flavored vocabulary from Phase 2 has become the active cognitive frame, causing the design frame established in the document title and opening to decay. Four failures observed in the Sprint 050 AAR trace to this drift:

1. Mechanism questions asked before design questions
2. Existing boundaries treated as constraints rather than design choices
3. Planning/specification bleed into the interview
4. Missing abstraction-level checks

## Target File

`chester-figure-out/SKILL.md` (183 lines in current version)

## Changes

### Change 1: Frontmatter Description

**File location:** Line 3, `description` field in YAML frontmatter

**Current text:**
```
"You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Resolves open design questions through Socratic dialogue before implementation."
```

**New text:**
```
"You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Resolves open design questions through Socratic dialogue before creating a specification."
```

**Scope:** Single word substitution — "before implementation" becomes "before creating a specification."

### Change 2: New Section — Role: Software Architect

**File location:** Insert between Phase 1 (Administrative Setup, ends at line 79) and Phase 2 (Context & Problem Statement, starts at line 81).

**New content:**

```markdown
## Role: Software Architect

You are a Software Architect conducting a design interview. This identity governs how you approach every activity from this point forward.

- **Read code as design history** — patterns, boundaries, and connections are evidence of decisions someone made, not inventory to catalogue
- **Think in trade-offs** — balance technical concerns against goals, current state against future needs; never optimize a single axis
- **Evaluate boundaries as choices** — existing structure is the result of prior design decisions, not immutable constraints
- **Operate across abstraction levels** — move fluidly between "what should this achieve" and "what pattern supports that"
- **Align architecture to intent** — link every structural decision back to what the human is trying to accomplish
```

**Scope:** New section, approximately 10 lines. No existing content modified.

### Change 3: Phase 2 Anchor Sentence

**File location:** Line 83, first bullet of Phase 2 (Context & Problem Statement)

**Current text:**
```
- Explore project context — read code, docs, recent commits relevant to the idea
```

**New text:**
```
- Study the codebase as a record of design decisions — understand the patterns chosen, the boundaries drawn, and the intent behind the existing architecture. Prepare yourself to serve in your role of Software Architect.
```

**Scope:** Single bullet point replacement. The remaining Phase 2 bullets (Assess scope, Present problem statement, User confirms) are unchanged.

### Change 4: Phase 3 Question Type Vocabulary

**File location:** Lines 96-97, within the Six Question Types subsection

**Current text (Clarifying):**
```
- **Clarifying** — "What do you mean by X?" Recommended answer appropriate when evident from context or codebase exploration.
```

**New text (Clarifying):**
```
- **Clarifying** — "What do you mean by X?" Recommended answer appropriate when evident from context or codebase design.
```

**Current text (Assumption-probing):**
```
- **Assumption-probing** — "What are you taking for granted here?" Recommended answer appropriate when the assumption seems sound based on evidence.
```

**New text (Assumption-probing):** Unchanged. This line does not contain "codebase exploration."

**Scope:** Single term substitution in one line — "codebase exploration" becomes "codebase design."

**Note:** On re-examination, "codebase exploration" appears only in the Clarifying question type (line 96), not in Assumption-probing. The change applies to one line only.

### Change 5: Phase 3 Stopping Criterion

**File location:** Line 145, within the Stopping Criterion subsection

**Current text:**
```
- Soft — when remaining decisions become minor (implementation details any competent implementer could resolve)
```

**New text:**
```
- Soft — when remaining design decisions become minor and will have little influence on patterns, boundaries, or architecture
```

**Scope:** Single bullet replacement. The secondary stopping signal on line 146 is unchanged.

## Unchanged Sections

The following are explicitly out of scope:

- Document title ("# Socratic Discovery")
- Hard gate block
- Anti-pattern check
- Checklist (task descriptions reference the phases, not implementation)
- Process flow diagram
- Phase 1: Administrative Setup
- Phase 3: Stream-of-Consciousness Output (example already uses design vocabulary)
- Phase 3: MCP Integration
- Phase 3: Emergent Tree Tracking
- Phase 3: Behavioral Constraints (including "Use the codebase to answer questions the agent can discover itself")
- Phase 3: Secondary stopping signal
- Phase 4: Closure
- Visual Companion reference
- File Naming Convention
- Integration section

## Testing Strategy

This is a document rewrite — there is no executable code to test. Verification is:

1. **Diff review:** The final SKILL.md diff should show exactly five changes — no more, no less. Any unintended modifications indicate scope creep.
2. **Linguistic audit:** Read the modified SKILL.md linearly from Phase 1 through Phase 3. At each section boundary, check: does the language independently reinforce "you are doing design work"? The design frame should never depend on remembering earlier sections.
3. **AAR failure check:** For each of the four AAR failures, trace through the modified document and confirm that the persona trait and/or vocabulary change that prevents it is present and correctly worded.

## Constraints

- **No structural changes.** The phase sequence, section hierarchy, and document organization stay as they are.
- **No new guardrails or gates.** The fix is through language, not through added control structures.
- **No scope expansion.** Only the five enumerated changes are made. No "while we're in here" improvements.
- **Preserve functional directives.** Behavioral constraints that work correctly (e.g., "Use the codebase to answer questions the agent can discover itself") are left alone even though their vocabulary is implementation-flavored — the persona provides sufficient framing by that point in the document.

## Non-Goals

- Rewriting the entire SKILL.md for general quality or style
- Adding new phases, checkpoints, or review mechanisms
- Changing the Socratic interview methodology
- Modifying the MCP integration approach
- Updating the visual companion or its reference
- Addressing any issues beyond the linguistic drift identified in the Sprint 050 AAR

## Risk

**Low.** This is a five-point vocabulary edit plus one new 10-line section in a document with no executable dependencies. The changes are independently verifiable through reading. Rollback is trivial — the pre-change SKILL.md is preserved in git history and in the `.pre-socratic.bak` file.
