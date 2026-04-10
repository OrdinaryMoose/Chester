---
name: util-design-brief-template
description: >
  Canonical template for design brief output. Read this skill (don't invoke it)
  when writing the design brief artifact at the end of any design skill session.
  Both design-figure-out and design-experimental use this template. If you're about
  to write a `-design-00.md` file, follow this structure.
---

# Design Brief Output Template

This document defines the required structure for design brief artifacts produced by
Chester's design skills (design-figure-out, design-experimental, or any future design
skill). It is the single source of truth for what a design brief must contain.

The design brief is the **primary handoff artifact** — it is consumed by design-specify
(which dispatches three architect agents against it), by plan-build, and potentially by
human readers in future sessions. Every section exists because a downstream consumer
needs it, or because its absence has caused a documented failure.

## Guiding Principle

A design brief must be **self-contained for reasoning**. A reader — human or agent —
who has never seen the design conversation, the companion briefs, or the codebase should
be able to understand not only WHAT is being built but WHY every scope boundary exists.
If the reasoning for a decision or exclusion lives only in the designer's memory, the
proof state, or a companion document, it is not yet in the brief.

This principle was established after a comparative analysis found that a design brief
which correctly excluded validation wiring (because a companion brief had found the
infrastructure non-functional) was scored as having a "gap" by a reviewer who only had
access to the brief itself. The companion brief's finding never made it into the design
brief, so the exclusion looked like an oversight rather than an informed decision.

## Template Structure

The sections below are listed in the order they should appear in the brief. Each section
includes its purpose, what downstream consumers use it for, and guidance on what to
include. Sections marked REQUIRED must appear. Sections marked CONDITIONAL appear when
their trigger condition is met.

---

### Header (REQUIRED)

```markdown
# Design Brief: {title}

**Status:** {Draft | Approved}
**Date:** {YYYY-MM-DD}
**Sprint:** {sprint-name}
**Parent:** {parent brief or initiative, if any}
```

If the brief has companion briefs (other design work happening in parallel or upstream
that shares context), list them:

```markdown
**Companion briefs:** {name (sprint), name (sprint), ...}
```

---

### Problem Statement (REQUIRED)

**Purpose:** Frame what is wrong or missing in the current system, in domain language.
This is WHAT and WHY, not HOW.

**Consumed by:** design-specify (maps to spec goals), plan-build (validates scope
alignment), architect agents (grounds their trade-off analysis).

**Guidance:**
- State the problem from the user's or system's perspective, not from the solution's
- Describe the current state that makes this problem visible — what breaks, what's
  missing, what's fragile, what's slow
- Do not prescribe the solution here. The problem statement should be valid even if the
  design decisions section proposed a completely different approach.

---

### Prior Art (REQUIRED)

**Purpose:** Carry forward findings from prior or companion design work that shaped this
brief's scope, decisions, or exclusions. This is the section that makes the brief
self-contained — without it, a reader must locate and read every referenced document to
understand why the brief is shaped the way it is.

**Consumed by:** design-specify (understands constraint origins), plan-build (avoids
planning work that depends on non-functional infrastructure), future design sessions
(avoids re-discovering what was already found).

**Guidance:**

For each prior or companion brief that influenced this design, include:

```markdown
## Prior Art

### {Brief name} ({sprint or date})

**Status:** {status of that brief — Approved, Paused, Draft, Superseded}

**Key findings:**
- {Finding 1 — what did that design session discover?}
- {Finding 2}

**How it shapes this brief:**
- {What this brief includes, excludes, or decides differently because of those findings}
```

What belongs here:
- Findings from companion briefs that change what's feasible (e.g., "validation
  infrastructure is a no-op, so wiring into it would produce zero diagnostics")
- Prior attempts at this same problem and why they were paused, rejected, or superseded
- Decisions made in upstream briefs that this brief inherits as constraints
- Status of prerequisite work that gates part of this brief's scope

What does NOT belong here:
- Summaries of briefs that are merely related but didn't influence this design
- Git history or commit-level changes (use git log for that)
- Code patterns or architecture that can be derived from reading the current codebase

If there is no prior art — this is the first design effort in this area — state that
explicitly:

```markdown
## Prior Art

No prior design work exists for this area. This is the first design effort.
```

This is preferable to omitting the section, because it tells the reader "I checked"
rather than "I forgot."

---

### Logic Trail (CONDITIONAL — when the design skill tracks derivation chains)

**Trigger:** The design session produced a chain of premise-to-conclusion reasoning
steps (e.g., design-experimental's proof system, or any session where the designer
explicitly traced "A, therefore B, therefore C").

**Purpose:** Show the derivation chain that connects the problem statement to the design
decisions. A reviewer can audit each step: dispute a premise, challenge a "therefore,"
or trace why a conclusion follows.

**Consumed by:** design-specify (validates that design decisions are grounded),
spec-reviewer (checks that the spec doesn't contradict the reasoning chain), future
sessions (identifies which premises, if changed, would invalidate the design).

**Guidance:**

Write as connected prose, not a bulleted list of conditions. Each step should flow
naturally from the previous one:

```markdown
## Logic Trail

{Premise about the system state.}

{What that premise implies.} Therefore {conclusion 1}.

{Additional premise or discovery.} Combined with {conclusion 1}, therefore
{conclusion 2}.

...
```

The Logic Trail covers reasoning for **inclusions** — why things are in scope. Reasoning
for **exclusions** belongs in the Scope section's annotated out-of-scope list.

If the design session did not produce an explicit derivation chain, omit this section.
Do not fabricate a trail after the fact.

---

### Design Decisions (REQUIRED)

**Purpose:** Record each significant design choice with its rationale and the
alternatives that were considered and rejected.

**Consumed by:** design-specify (architect agents need to understand the solution space,
including roads not taken), spec-reviewer (checks that the spec doesn't contradict
decisions), plan-build (validates that the plan implements the chosen alternative).

**Guidance:**

Number decisions sequentially. For each decision:

```markdown
### D{N} — {Decision title}

{What was decided and why — 1-3 sentences in domain language.}

**Rejected alternatives:**
- {Alternative 1} — {why it was rejected, in one sentence}
- {Alternative 2} — {why it was rejected}
```

Include rejected alternatives even when the decision feels obvious. The purpose is not
to justify the decision to a skeptic — it is to prevent a future agent or developer from
re-proposing a rejected approach without understanding why it was rejected.

If the design skill uses a formal proof system (e.g., design-experimental's necessary
conditions model), the decisions section should translate proof elements into
human-readable decisions. The proof is the evidence; the decisions section is the
verdict.

---

### Scope (REQUIRED)

**Purpose:** Define what is in scope and what is out of scope, with reasoning for every
exclusion.

**Consumed by:** design-specify (scope defines spec boundaries), plan-build (scope
defines task boundaries), developer (scope prevents scope creep during implementation).

#### In Scope

List what this design covers. Be specific enough that a developer can tell whether a
given piece of work falls inside or outside the boundary.

```markdown
### In scope

- {Deliverable or work item 1}
- {Deliverable or work item 2}
- ...
```

#### Out of Scope (Annotated)

Every out-of-scope item must be tagged with its exclusion type and a rationale. The
three types:

| Tag | Meaning | When to use |
|-----|---------|-------------|
| **not yet** | Deferred because it depends on unfinished prerequisite work | The work is relevant but blocked. Name the blocker. |
| **not us** | Belongs to a different brief, sprint, or team | The work is relevant but owned elsewhere. Name the owner. |
| **not needed** | Considered and determined unnecessary for this scope | The work was evaluated and excluded on its merits. Say why. |

```markdown
### Out of scope

- **{Item 1}** — _not yet_: {rationale, including what prerequisite must complete first}
- **{Item 2}** — _not us_: {rationale, including which brief or sprint owns it}
- **{Item 3}** — _not needed_: {rationale, including why it's unnecessary for this scope}
```

**Why this matters:** A flat out-of-scope list without rationale is ambiguous. A reader
cannot tell whether an exclusion is a deliberate, informed decision or an accidental
omission. The tag and rationale make the reasoning legible. This was the specific failure
mode that motivated adding Prior Art and annotated exclusions to the template — a
correct exclusion was misread as a gap because no rationale was present.

---

### Dependencies (CONDITIONAL — when the design depends on infrastructure that may not be fully operational)

**Trigger:** The design relies on existing infrastructure, services, or systems whose
current operational status affects what can be built or tested.

**Purpose:** Record the current state of infrastructure the design depends on, so
downstream consumers don't plan work against broken plumbing.

**Consumed by:** plan-build (avoids scheduling work that depends on non-functional
systems), design-specify (adjusts spec to account for partial infrastructure),
execute-test (knows what can actually be tested end-to-end vs. what requires stubs).

**Guidance:**

```markdown
## Dependencies

| Dependency | Status | Implication |
|------------|--------|-------------|
| {System or component} | {operational / partial / non-functional} | {What this means for the design — what works, what doesn't, what's blocked} |
```

Status definitions:
- **operational** — works as documented, tested in production or CI
- **partial** — exists and partially works, but key paths are non-functional or untested
- **non-functional** — infrastructure exists (types, interfaces, DI registration) but
  produces no useful output in production. This is the most dangerous status because code
  review will see "the wiring is there" and assume it works.

**Why this matters:** A design that includes "wire into X" as a deliverable implicitly
claims X works. If X is non-functional, the deliverable gives false confidence — the
wiring will compile and may even pass unit tests with mocks, but produces no value at
runtime. The Dependencies section forces this status to be explicit.

If the design has no infrastructure dependencies beyond the standard project structure,
omit this section.

---

### Current State Inventory (REQUIRED)

**Purpose:** Name the key classes, files, methods, and types that implement the feature
area being changed or extended. This is the implementation surface the spec agent needs
to find.

**Consumed by:** design-specify's three architect agents (each needs to know what exists
before proposing changes), spec-reviewer (checks that the spec addresses every item on
the change surface), plan-build (uses as the basis for task decomposition).

**Guidance:**

The design skill already explores the codebase extensively during the interview. This
section captures that knowledge instead of discarding it. List 10-20 entries, grouped by
project or layer:

```markdown
## Current State Inventory

### {Project or layer name}

- **{ClassName}** (`{relative/path/to/file.cs}`, {line count} lines) — {one-line role}
- **{ClassName}** (`{relative/path/to/file.cs}`) — {one-line role}

### {Another project or layer}

- ...
```

Include:
- Classes/files that will be modified, extended, or replaced
- Classes/files that the new code must integrate with (interfaces, base types, DI
  registrations)
- Classes/files that serve as structural precedent for the new work (e.g., an existing
  implementation of a similar pattern)

Do not include:
- Every file in the affected project (this is an inventory, not a directory listing)
- Files that are merely nearby but not involved in the change
- Test files (unless the design specifically changes test infrastructure)

---

### Constraints (REQUIRED)

**Purpose:** Record structural and normative constraints that bound the implementation.

**Consumed by:** design-specify (constraints become spec requirements), spec-reviewer
(checks constraints are respected), plan-build (constraints shape task ordering).

**Guidance:**

Distinguish between two kinds:

- **Structural constraints** — cannot be changed without breaking something else. These
  are facts about the system: dependency directions, interface contracts, invariants that
  other code relies on.
- **Normative constraints** — could be changed with justification but are currently in
  effect. These are conventions, team decisions, or rules from CLAUDE.md / ADRs / TDRs.

```markdown
## Constraints

- {Constraint} _(structural)_
- {Constraint} _(normative — source: {where this rule comes from})_
```

Reproducing constraints inline (rather than referencing external documents) makes the
brief self-contained. A spec agent or plan agent does not need to locate and read
CLAUDE.md or an ADR to understand what rules apply.

---

### Assumptions (REQUIRED)

**Purpose:** Record claims the design depends on that were tested or discovered during
the interview, and could be wrong.

**Consumed by:** design-specify (assumptions that are wrong invalidate the spec),
plan-build (assumptions may need verification tasks), execute-test (assumptions suggest
test cases).

**Guidance:**

For each assumption, record what was believed, whether it was confirmed or corrected,
and what depends on it:

```markdown
## Assumptions

- **"{Assumption text}"** — {CONFIRMED | CORRECTED | UNTESTED}. {What depends on this
  being true. If corrected, what the correction was.}
```

Untested assumptions are especially important to flag — they are risks that no one has
verified. A plan-build session should consider adding verification tasks for untested
assumptions.

---

### Residual Risks (REQUIRED)

**Purpose:** Name what could still go wrong even if the design is implemented correctly.

**Consumed by:** plan-build (may add mitigation tasks), execute-test (may add risk-
specific test cases), future design sessions (may inherit these risks).

**Guidance:**

Each risk should describe the failure mode, not just the area of concern:

```markdown
## Residual Risks

- {What could go wrong — be specific about the failure mode, not just "this is risky"}
```

Bad: "Type placement is a risk."
Good: "If future project hierarchies (Simulation.*, Analysis.*) need the canonical form
types, they would need to reference Application.Contracts, creating a cross-hierarchy
dependency. Migration is a namespace rename of pure record types — low cost but requires
coordination."

---

### Acceptance Criteria (REQUIRED)

**Purpose:** Define when this design is done — observable, testable conditions.

**Consumed by:** design-specify (maps criteria to spec requirements), execute-verify-
complete (checks criteria at delivery), the designer (approves the brief against these).

**Guidance:**

Each criterion should be verifiable — a developer should be able to write a test or run
a check that confirms it:

```markdown
## Acceptance Criteria

- {Observable condition that must be true when the work is complete}
- {Another condition}
```

Avoid criteria that are subjective ("code is clean"), unmeasurable ("performance is
acceptable"), or that restate the design ("the canonical form exists"). Good criteria
describe behavior or state that can be checked.

---

### Follow-on Work (CONDITIONAL — when the design enables future work that should be tracked)

**Trigger:** The design explicitly defers work or creates prerequisites for future
design efforts.

**Purpose:** Connect this brief to the work it enables, so future sessions don't need
to re-derive the dependency chain.

**Consumed by:** Future design sessions (know where to start), project planning (knows
what's unblocked after this sprint ships).

**Guidance:**

```markdown
## Follow-on Work

This design enables but does not require:

- **{Work item}** — {what it is and why this design enables it}
- **{Work item}** — {what it is}
```

This section is forward-looking. It is NOT the place to list everything that was
excluded — that belongs in the annotated out-of-scope list. Follow-on work describes
new capabilities or efforts that become possible once this design is implemented.

---

## Section Ordering Summary

| # | Section | Required? | Purpose (one line) |
|---|---------|-----------|-------------------|
| 1 | Header | REQUIRED | Identity, status, lineage |
| 2 | Problem Statement | REQUIRED | What's wrong, in domain language |
| 3 | Prior Art | REQUIRED | Findings from adjacent design work that shaped this brief |
| 4 | Logic Trail | CONDITIONAL | Derivation chain from premises to conclusions |
| 5 | Design Decisions | REQUIRED | Each choice with rationale and rejected alternatives |
| 6 | Scope | REQUIRED | In-scope list + annotated out-of-scope with exclusion types |
| 7 | Dependencies | CONDITIONAL | Infrastructure status (operational / partial / non-functional) |
| 8 | Current State Inventory | REQUIRED | Classes, files, methods on the change surface |
| 9 | Constraints | REQUIRED | Structural and normative bounds, reproduced inline |
| 10 | Assumptions | REQUIRED | Tested, corrected, and untested claims the design depends on |
| 11 | Residual Risks | REQUIRED | Specific failure modes that remain |
| 12 | Acceptance Criteria | REQUIRED | Observable, testable done conditions |
| 13 | Follow-on Work | CONDITIONAL | Future work this design enables |

---

## Vocabulary Mapping

Different design skills use different vocabulary for similar concepts. This table maps
skill-specific terms to template sections:

| Template section | design-figure-out term | design-experimental term | design-small-task term |
|-----------------|----------------------|------------------------|----------------------|
| Design Decisions | "decision boundaries" | "necessary conditions with rationale" | "key decisions" |
| Scope (out) | "non-goals" | "out of scope" | "out of scope" |
| Constraints | "constraints" | "designer-directed restrictions" + "constraints" | "constraints" |
| Assumptions | "assumptions tested" | (embedded in proof elements — extract to this section) | (omitted — uses `util-design-brief-small-template`) |
| Logic Trail | (not produced — omit section) | "Logic Trail" (derived from proof state) | (omitted — no proof system) |

Both skills map onto the same template. The vocabulary differs; the information is the
same.

---

## Notes for Design Skill Implementors

### What this template does NOT govern

- The interview process (Phases 1-3 in figure-out, Phase 1 in design-experimental)
- The thinking summary artifact
- The process evidence artifact
- Artifact naming or directory layout (see `util-artifact-schema`)
- Whether the design transitions to design-specify

### How to use this template

At closure time (Phase 5 in figure-out, Closure in design-experimental):

1. Read `util-design-brief-template` (this document)
2. Write the design brief following the section ordering above
3. For REQUIRED sections: always include, even if the content is minimal
4. For CONDITIONAL sections: include when the trigger condition is met, omit otherwise
5. If a section would be empty, include it with an explicit "None" or "Not applicable"
   statement rather than omitting it — this tells the reader you considered it

### The self-containment test

Before finalizing the brief, apply this test: **Could a reader who has never seen the
design conversation, the companion briefs, or the codebase understand why every scope
boundary exists?** If the answer is no, the Prior Art or annotated out-of-scope sections
are incomplete.

### Lightweight alternative

`design-small-task` uses `util-design-brief-small-template` instead of this template.
The small template has 6 sections (Goal, Prior Art, Scope, Key Decisions, Constraints,
Acceptance Criteria) optimized for direct plan-build consumption without multi-brief
coordination overhead. See that template for details on which sections are deliberately
omitted and why.
