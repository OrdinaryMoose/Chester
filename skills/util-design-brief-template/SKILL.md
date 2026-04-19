---
name: util-design-brief-template
description: >
  Canonical template for design brief output. Read this skill (don't invoke it)
  when writing the design brief artifact at the end of `design-experimental`. Follows
  the envelope-plus-point structure: the envelope (what the proof established) plus the
  point (the architectural approach selected during Finalization).
---

# Design Brief Output Template

This document defines the required structure for design brief artifacts produced by
`design-experimental`. It is the single source of truth for what a design brief must
contain at Artifact Handoff.

A design brief has two layers. The **envelope** is what the proof established — the
goal, the necessary conditions that must hold, the designer-directed rules and
permissions, the codebase evidence the design rests on. The **point** is the
architectural approach selected during Finalization — the HOW that satisfies the
envelope, plus the alternatives considered. Both layers must be self-contained: a
reader who has never seen the design conversation should understand what is being
built, what must be true for it to hold, and how it will be implemented.

## Guiding Principle

The brief must be **self-contained for plan-build**. A plan-build agent that has
never seen the design conversation should be able to write an implementation plan
from this brief alone. Every scope boundary must have a reason legible in the brief.

## Template Structure

Ten required sections, in order.

---

### Goal (REQUIRED)

One paragraph: what is being built and why. Domain language, no code vocabulary.
States the problem from the user's or system's perspective. Does not prescribe HOW.

```markdown
## Goal

{What we're building, why it matters, what problem it solves — one paragraph.}
```

---

### Necessary Conditions (REQUIRED)

The necessary conditions (WHAT) established in the proof. Each condition is something
that must be true for the design to hold. Numbered, with reasoning chain and collapse
test per condition.

```markdown
## Necessary Conditions

1. **{Condition}.** {Reasoning chain — what premises in the envelope make this
   condition necessary.} Collapse test: {what breaks if this condition is removed}.
2. ...
```

If the proof captured rejected alternatives for a condition, note them inline:

```markdown
1. **{Condition}.** {Reasoning.} Collapse test: {what breaks}.
   Rejected alternatives: {alt 1 — why rejected}; {alt 2 — why rejected}.
```

---

### Rules (REQUIRED)

Designer-directed restrictions on the design space. Each rule shapes the envelope of
valid approaches. Scope exclusions, architectural mandates, design directives. These
are explicitly stated by the designer during the proof phase.

```markdown
## Rules

- {Rule} — {what it restricts, in domain language}
```

If the proof has no rules, state: "No designer-directed rules beyond the goal." This
is preferable to omitting the section.

---

### Permissions (REQUIRED)

Designer-directed relief from specific rules. Each permission names the rule it
relaxes and the specific allowance granted. Permissions without a corresponding rule
do not belong here.

```markdown
## Permissions

- {Permission} — relieves: {rule referenced}; {what the approach may do despite the rule}
```

If no permissions were granted, state: "No permissions granted. All rules apply as
stated."

---

### Evidence (REQUIRED)

Codebase facts the design rests on. Each entry is a claim about the current system
verified against the code at the time of the proof. Includes file/type/method anchors
where the claim references specific elements.

```markdown
## Evidence

- {Claim about the current system} ({file path or type name if anchored})
```

The ground-truth verification report produced at Envelope Handoff is a sibling
artifact and contains the full verification detail. This section captures the
evidence list the design relied on, not the verification findings.

---

### Industry Context (REQUIRED)

External patterns surfaced by the industry explorer that bear on the design. Each
entry names a pattern or approach from the broader field, summarizes how it
addresses this class of problem, and notes the pitfalls or failure modes observed
when it is applied. Citations are required so the reader can audit the source.
This section is input the designer weighed — not a list of recommendations adopted.

```markdown
## Industry Context

- **{Pattern name}** — {one-sentence description of how the pattern addresses the
  problem class}. Pitfalls: {failure modes observed in practice}. Source:
  {URL or citation}.
```

If the industry explorer reported thin signal (niche problem, proprietary domain,
nothing substantive found), state that explicitly: "Industry signal was thin for
this problem class. No comparable external patterns were substantive enough to
influence the design." This tells the reader the axis was considered, not skipped.

---

### Chosen Approach (REQUIRED)

The architectural approach selected during Finalization. Describes the shape of the
solution — components, reuse profile, trade-off profile. This is the HOW. Sourced
from the architect proposal the designer adopted (or the designer's articulated
hybrid or own direction).

```markdown
## Chosen Approach

{2-4 paragraphs describing the shape — what gets built, how it integrates with
existing code, what trade-offs it makes. Domain language with specific file/type
references where needed.}

**Component Structure:**
- {New or modified unit}
- ...

**Reuse Profile:**
- {Existing code or pattern leveraged}
- ...

**Trade-off Summary:**
- Optimized for: {things this approach prioritizes}
- Sacrificed: {things this approach gives up}
```

---

### Alternatives Considered (REQUIRED)

The architectural approaches that were not adopted. Sourced from the architect
proposals the designer did not pick (or from hybrids where only part of a proposal
was folded in). For each alternative, describe the shape briefly and record why it
was rejected in favor of the Chosen Approach.

```markdown
## Alternatives Considered

### {Alternative name or trade-off lens}

{Shape summary — 2-3 sentences.}

**Why not chosen:** {rationale, typically referencing envelope constraints the
alternative violates or trade-offs the designer preferred to avoid}
```

If only one alternative was meaningfully considered, include one entry. If the
architect proposals all converged on near-identical shapes, state that explicitly
— the fact that the comparison produced narrow breadth is itself useful signal.

---

### Risks (REQUIRED)

Hazards that remain even if the Chosen Approach is implemented correctly. Sourced
from the proof's RISK elements plus any new risks surfaced during Finalization
(ground-truth findings that were noted rather than forcing revision, architect
proposal concerns adopted into the approach).

```markdown
## Risks

- {Specific failure mode — what could go wrong, not just "area of concern"}
```

Be specific. "Type placement is a risk" is not useful. "If future projects need the
canonical form types, they would reference Application.Contracts, creating a
cross-hierarchy dependency" is.

---

### Acceptance Criteria (REQUIRED)

Observable, testable conditions for completion. Each criterion is something a
developer can verify by running a test or check. Subjective criteria ("code is
clean") and restatements of the design ("the canonical form exists") do not belong.

```markdown
## Acceptance Criteria

- {Observable condition that must be true when the work is complete}
```

---

## Section Ordering Summary

1. Goal
2. Necessary Conditions
3. Rules
4. Permissions
5. Evidence
6. Industry Context
7. Chosen Approach
8. Alternatives Considered
9. Risks
10. Acceptance Criteria

All ten sections are required. If a section would be empty, include it with an
explicit "None" statement rather than omitting it — this tells the reader you
considered it.

---

## Relationship to Sibling Artifacts

The design brief is one of four artifacts produced at Artifact Handoff:

- **Design brief** (this template) — envelope + point + risks + acceptance
- **Thinking summary** — decision history including Finalization Reasoning
- **Process evidence** — operational narrative including Finalization Metrics
- **Ground-truth report** — verification findings against the Evidence section

The brief cross-references the sibling artifacts but is readable on its own.

---

## The Self-Containment Test

Before finalizing the brief: **Could a plan-build agent consume this brief and write
an implementation plan without needing to read the design conversation or the
sibling artifacts?** If the answer is no, the Evidence, Chosen Approach, or Risks
sections are incomplete.

---

## Lightweight Alternative

`design-small-task` uses `util-design-brief-small-template` instead of this template.
The small template has six sections (Goal, Prior Art, Scope, Key Decisions,
Constraints, Acceptance Criteria) optimized for direct plan-build consumption when
there is no proof phase upstream. `plan-build` reads both templates by section
heading and does not branch on which design skill produced the brief.
