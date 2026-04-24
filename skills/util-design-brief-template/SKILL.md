---
name: util-design-brief-template
description: >
  Canonical template for design brief output. Read this skill (don't invoke it)
  when writing the design brief artifact at Closure of `design-experimental`.
  The brief carries the proof envelope — what the proof established — and feeds
  `design-specify`, which dispatches architects against this envelope to choose
  the architectural approach.
---

# Design Brief Output Template

This document defines the required structure for design brief artifacts produced by
`design-experimental` at Closure. It is the single source of truth for what a design
brief must contain.

A design brief is the **envelope** — what the proof established. The goal, the
necessary conditions that must hold, the designer-directed rules and permissions, the
codebase evidence the design rests on, and the industry context that informed the
conversation. The brief does **not** contain the architectural approach — that is
chosen by `design-specify` against this envelope and recorded in the spec, not the
brief.

## Guiding Principle

The brief must be **self-contained for design-specify**. A design-specify agent that
has never seen the design conversation should be able to dispatch architects, build
a hybrid recommendation, write the spec, and run the spec reviews from this brief
alone. Every necessary condition must have a reasoning chain and collapse test legible
in the brief.

## Template Structure

Eight required sections, in order.

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

`design-specify` runs an opt-in ground-truth review against the spec it produces from
this brief; that review will re-verify these evidence anchors against the codebase.
Be precise here so that downstream verification has clean targets.

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

### Risks (REQUIRED)

Hazards that remain even if the design is implemented correctly. Sourced from the
proof's RISK elements. Architects in `design-specify` will inherit these risks and
may add architecture-level risks against the spec — but the brief carries the
design-level risks established during the proof.

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
7. Risks
8. Acceptance Criteria

All eight sections are required. If a section would be empty, include it with an
explicit "None" statement rather than omitting it — this tells the reader you
considered it.

---

## Relationship to Sibling Artifacts

The design brief is one of three artifacts produced at Closure:

- **Design brief** (this template) — the proof envelope. WHAT and WHY, not HOW.
- **Thinking summary** — decision history. HOW the conversation reached the
  necessary conditions, alternatives considered along the way, user corrections,
  confidence levels, understanding shifts.
- **Process evidence** — operational narrative. HOW the interview operated:
  understanding dimension saturation over time, where the conversation pulled
  vertical, stage transition timing, challenge mode firings, gate satisfaction.

The brief cross-references the sibling artifacts but is readable on its own.

---

## The Self-Containment Test

Before finalizing the brief: **Could a `design-specify` agent consume this brief and
dispatch architect subagents (against the dispatcher-assigned axes derived from the
brief's tensions) without needing to read the design conversation or the sibling
artifacts?** If the answer is no, the Necessary Conditions, Evidence, or Rules
sections are incomplete.

---

## Lightweight Alternative

`design-small-task` uses `util-design-brief-small-template` instead of this template.
The small template has six sections (Goal, Prior Art, Scope, Key Decisions,
Constraints, Acceptance Criteria) optimized for bounded-task briefs that skip the
proof phase. Both templates feed `design-specify` — `design-specify` reads both by
section heading and does not branch on which design skill produced the brief; the
spec it builds normalizes both shapes into one spec contract for `plan-build`.
