# Validation: chester-design-architect SKILL.md vs Spec

**Date:** 2026-04-05
**Spec:** `architect-interview-review-spec-00.md`
**Skill:** `chester-design-architect/SKILL.md`

## Findings

### Discrepancy 1: Round One — Extra brownfield step

**Spec (Updated Round One, lines 199-207)** defines 7 steps. The spec intentionally
simplified Round One to reflect the two-phase model, removing the separate brownfield
context collection step and merging it into step 1.

**Skill (Phase 2: Round One, lines 92-107)** has 8 steps. Step 2 ("For brownfield,
collect relevant codebase context before questioning") was not removed during
implementation.

**Proposed correction:** Remove step 2 from the skill. Brownfield context collection
is already implicit in step 1's "Explore codebase for relevant context."

Additionally, steps 3-4 in the skill contain extra guidance prose not in the spec
("neutral, domain-language observations — not a problem statement, not a solution
structure, and not a decision inventory" and "this is the opening move, not a summary").
These reinforce intent and are harmless, but should be evaluated: keep if they add
value during execution, remove if they add clutter.

### Discrepancy 2: Phase 1 stopping criterion — missing "clean problem statement"

**Spec (line 44, ASCII diagram):**
```
Stopping criterion: Clean problem statement, remaining questions are about what to build
```

**Skill (line 120, ASCII diagram):**
```
Stopping criterion: Remaining questions are about what to build, not what's wrong
```

**Spec (line 79, prose section):**
> "The problem statement is clean and both parties share it."

**Skill (line 201, prose section):**
> "The remaining questions the interviewer wants to ask are about *what to build*
> rather than *what's wrong*."

**Impact:** The spec establishes a two-part stopping criterion: (1) the problem
statement is clean and shared, AND (2) the question queue has shifted. The skill
only requires the question queue shift. This weakens the Phase 1 gate — Phase 1
could end without a clean problem statement if the interviewer's questions
naturally drift toward solutions.

**Proposed correction:** Update both the ASCII diagram and the prose stopping
criterion to match the spec's two-part formulation.

### No other discrepancies found

The following sections were validated and conform to the spec:

- Two-phase interview model structure
- Phase 1 information package components
- Phase 2 information package components
- Phase 1 prohibited content
- Phase transition gate (artifact, process, capture_thought)
- Phase 2 design creation section
- Per-turn flow (internal mechanics + presentation order)
- Phase-aware scoring guidance (both phases)
- Challenge modes (unchanged per spec scope)
- Closure protocol
- Phase 2 length check
- Information-to-question weighting (60/40)
- Altitude enforcement through externalization
- Thinking block adjustment (precedes info package)
- Translation gate applies to info package components
- Research boundary applies to info package components
- Forced crystallization at round 20
- Early exit conditions
- Process evidence documents phase transition timing

## Proposed Edits

### Edit A: Round One (Skill lines 89-107)

Replace the current 8-step Round One with the spec's 7-step version:

```markdown
## Phase 2: Round One

Round one is setup. No enforcement calls yet.

1. Explore codebase for relevant context. Classify **brownfield** (existing codebase target) vs **greenfield**.
2. Present an initial set of facts relevant to the user's initial prompt or question. These are neutral, domain-language observations — not a problem statement, not a solution structure, and not a decision inventory.
3. Ask a **Clarifying** question after presenting the facts. Do not try to frame the problem statement yet.
4. `capture_thought()` with tag `problem-statement`, stage `Problem Definition`.
5. Initialize the enforcement mechanism:

   Call `initialize_interview` with:
   - `type`: greenfield or brownfield (from step 1)
   - `problem_statement`: the user's initial prompt (not a refined statement — that comes at the Phase Transition Gate)
   - `state_file`: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-enforcement-state.json`

6. Announce: **Phase 1 (Problem Definition) begins.** The conversation will focus on understanding the problem deeply before exploring solutions.
7. Full interview loop starts with the user's first response.
```

### Edit B: Phase 1 stopping criterion — ASCII diagram (Skill line 120)

Replace:
```
└── Stopping criterion: Remaining questions are about what to build, not what's wrong
```

With:
```
└── Stopping criterion: Clean problem statement, remaining questions are about what to build
```

### Edit C: Phase 1 stopping criterion — prose (Skill line 201)

Replace:
```
**Stopping criterion:** The remaining questions the interviewer wants to ask are about *what to build* rather than *what's wrong*. When your question queue shifts from problem-understanding to solution-exploring, Phase 1 is complete.
```

With:
```
**Stopping criterion:** The problem statement is clean and both parties share it. Operationally: the remaining questions the interviewer wants to ask are about *what to build* rather than *what's wrong*. When your question queue shifts from problem-understanding to solution-exploring, Phase 1 is complete.
```
