---
name: util-design-brief-small-template
description: >
  Lightweight design brief template for bounded tasks. Read this skill (don't invoke it)
  when writing the design brief artifact from design-small-task. Six sections instead of
  thirteen — optimized for plan-build consumption without multi-brief coordination overhead.
---

# Lightweight Design Brief Template

This document defines the structure for design brief artifacts produced by
`design-small-task`. It is the lightweight counterpart to `util-design-brief-template`,
which serves `design-figure-out` and `design-experimental`.

## When to Use This Template

Use this template when:
- The task is well-bounded — the designer already knows roughly what they want
- The design conversation was 2-5 rounds, not 10-20
- There are no companion briefs or multi-brief dependency chains
- The brief feeds directly into plan-build, skipping design-specify

Use the full `util-design-brief-template` when:
- The task is complex or ambiguous
- Multiple briefs interact (companion briefs, prior art chains)
- The brief will be consumed by design-specify's three architect agents
- Infrastructure dependencies need operational status tracking

## Guiding Principle

A lightweight brief must be **self-contained for plan-build**. A plan-build agent that
has never seen the design conversation should be able to write an implementation plan
from this brief alone. If a decision or scope boundary requires reading the conversation
to understand, it is not yet in the brief.

## Template Structure

Six sections, in order. All are REQUIRED.

---

### Goal (REQUIRED)

One paragraph: what is being built and why. Combines what the full template separates
into Problem Statement and Header.

```markdown
## Goal

{What we're building, why it matters, and what problem it solves — one paragraph.}
```

---

### Prior Art (REQUIRED)

Findings from previous work, existing patterns, or prior attempts that shaped this
design. This section makes the brief self-contained — without it, a reader must know
the project history to understand why the design is shaped the way it is.

```markdown
## Prior Art

{What exists already in the codebase that informed this design. What was tried before.
What patterns or conventions should be followed or avoided. If no prior art exists,
state: "No prior design work exists for this area."}
```

This is lighter than the full template's Prior Art section — no formal brief-linking
with status fields. Just the findings that matter, in prose.

---

### Scope (REQUIRED)

What is in scope and what is out of scope.

```markdown
## Scope

**In scope:**
- {Deliverable or work item}

**Out of scope:**
- {Item} — {why it's excluded}
```

Unlike the full template, out-of-scope items do not require not-yet/not-us/not-needed
tags. A brief rationale is sufficient for bounded tasks. However, every exclusion must
still have a reason — a bare list of exclusions without rationale is ambiguous.

---

### Key Decisions (REQUIRED)

Design choices made during the conversation, with rationale and alternatives considered.

```markdown
## Key Decisions

1. **{Decision}.** {What we landed on and why. Alternative considered: X.}
```

One line per decision with inline rationale. Lighter than the full template's
D1/D2 format with separated rejected alternatives prose, but the same information:
what was chosen, why, and what was not chosen.

---

### Constraints (REQUIRED)

What limits implementation.

```markdown
## Constraints

- {Constraint}
```

For bounded tasks, a simple bullet list is sufficient. The full template's
structural/normative distinction is not required but may be used if helpful.

---

### Acceptance Criteria (REQUIRED)

Observable, testable conditions for completion.

```markdown
## Acceptance Criteria

- {Condition that must be true when the work is complete}
```

Same guidance as the full template: criteria must be verifiable, not subjective.

---

## Sections Deliberately Omitted

These sections exist in the full `util-design-brief-template` and are omitted here
with rationale:

| Full template section | Why omitted |
|---|---|
| Header (Status, Date, Sprint, Parent, Companion) | Sprint context inherited from directory path. No companion briefs for bounded tasks. |
| Logic Trail | No formal proof system — no derivation chain to capture. |
| Dependencies (infrastructure status) | Bounded tasks rarely depend on partially-operational infrastructure. If they do, note it in Constraints. |
| Current State Inventory (10-20 entries) | Too heavy — reference specific files inline in Key Decisions when relevant. |
| Assumptions (CONFIRMED/CORRECTED/UNTESTED) | Bounded tasks don't accumulate testable assumptions across many rounds. Unverified claims go in Constraints or Key Decisions. |
| Residual Risks | For bounded tasks, risks go in Constraints or Key Decisions inline. |
| Follow-on Work | Bounded tasks don't typically enable dependency chains. |

If a bounded task turns out to need any of these sections, that may be a signal the
task is not actually bounded and should use the full template with `design-figure-out`
or `design-experimental`.

---

## Vocabulary Mapping

| Template section | design-small-task term |
|---|---|
| Goal | "goal" |
| Prior Art | "prior art" / "what exists already" |
| Scope | "scope" / "in and out" |
| Key Decisions | "key decisions" / "what we landed on" |
| Constraints | "constraints" |
| Acceptance Criteria | "acceptance criteria" / "how we know it's done" |

---

## The Self-Containment Test

Before finalizing the brief: **Could plan-build consume this brief and write an
implementation plan without needing to read the design conversation?** If the answer
is no, the Prior Art or Key Decisions sections are incomplete.
