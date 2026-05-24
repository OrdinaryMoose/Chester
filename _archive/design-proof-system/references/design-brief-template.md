# Design Proof System — Design Brief Output Template

**Version:** v01

Canonical template for the design brief artifact produced after a design proof has
been closed. Read this file when writing the brief. The brief carries the proof
envelope — the elements that survived ratification, organized by the proof system's
nine element categories — and feeds `design-specify`, which dispatches architects
against this envelope to choose the architectural approach.

A design brief is the **envelope** — what the proof established. The goal, the
Definitions, Concerns, Risks, Evidence, Rules, Permissions, Propositions, and
Resolutions that the proof closed on. The brief does **not** contain the
architectural approach — that is chosen by `design-specify` against this envelope
and recorded in the spec, not the brief.

## Guiding Principle

The brief must be **self-contained for design-specify**. A `design-specify` agent
that has never seen the proof session should be able to identify tensions in the
design space, dispatch architects against dispatcher-assigned axes, build a hybrid
recommendation, write the spec, and run the spec reviews from this brief alone.

Every Proposition must carry its full reasoning chain, grounding, and collapse test.
Every Resolution must name the Concern or Risk it addresses. Every codebase
Evidence claim must carry an anchor (file path, type name, or method reference) so
the ground-truth review has a clean target.

## Writer Guidance

Use the canonical element-category names from the proof system verbatim —
**Evidence**, **Rule**, **Permission**, **Proposition**, **Risk**, **Resolution**,
**Concern**, **Definition**. Preserve the per-category element IDs the engine
allocated (`evid_001`, `rule_001`, `perm_001`, `prop_001`, `risk_001`, `rsln_001`,
`cern_001`, `defn_001`) so cross-references within the brief — a Resolution naming
which Concern it addresses, a Proposition naming which Evidence it is grounded in —
remain navigable.

Withdrawn elements do not appear in the brief. Superseded elements appear under
their current (live) ID. Proof-internal lifecycle state (ratification source,
inference pattern, friction dispositions, closure timestamps) is not surfaced —
the brief carries what the proof established, not how the proof tracked it.

## Template Structure

Nine required sections, in order. The order organizes the brief from
context-setting through to the conditions-and-coverage pairing that design-specify
uses for AC derivation.

---

### Goal (REQUIRED)

One paragraph: what is being built and why. Domain language, no code vocabulary.
States the problem from the user's or system's perspective. Does not prescribe HOW.

```markdown
## Goal

{What we're building, why it matters, what problem it solves — one paragraph.}
```

---

### Definitions (REQUIRED)

Vocabulary fixings established during the proof. Each entry names a `defn_NNN`
element, the term, and the prose definition. Scope is shown only when non-default
(i.e. not `global`) — a non-global scope signals legitimate dual-use of the term
in different parts of the system, which the spec must respect.

```markdown
## Definitions

- **defn_001 — {term}**: {definition prose}.
- **defn_002 — {term}** (scope: {non-global scope value}): {definition prose}.
```

If no Definitions were established, state: "No Definitions were established during
the proof."

---

### Concerns (REQUIRED)

Named aspects of the problem statement that the design must cover. Each Concern is
a `cern_NNN` element with a label and an optional one-sentence description. The
proof closed only after every Concern was covered by at least one Resolution, so
each Concern listed here has a corresponding entry in the Resolutions section that
names it via `addresses`.

```markdown
## Concerns

- **cern_001 — {short label}**: {optional one-sentence description}.
- **cern_002 — {short label}**: {description}.
```

`design-specify` uses the Concerns list as the coverage rationale for the spec —
every Concern should be covered by at least one acceptance criterion or by a
constraint in the spec.

If no Concerns were established, state: "No Concerns were established during the
proof — coverage was established against Risks only." This is unusual; flag
explicitly.

---

### Risks (REQUIRED)

Failure modes the design must account for. Each Risk is a `risk_NNN` element with
a statement and an optional severity. Architects in `design-specify` inherit these
Risks and may add architecture-level risks against the spec, but design-level Risks
are established here.

```markdown
## Risks

- **risk_001** — {statement}. Severity: {high | medium | low | unset}.
- **risk_002** — ...
```

Be specific. "Type placement is a risk" is not useful. "If future projects need
the canonical form types, they would reference Application.Contracts, creating a
cross-hierarchy dependency" is.

If no Risks were flagged, state: "No Risks were flagged during the proof."

---

### Evidence (REQUIRED)

Factual claims treated as given inside the proof. Group entries by source so the
ground-truth review can locate codebase anchors quickly and architects can locate
industry context quickly.

```markdown
## Evidence

### Codebase Evidence

- **evid_001** — {claim}. Anchor: {file path, type name, or method reference}.
- **evid_002** — {claim}. Anchor: {...}.

### Industry Evidence

- **evid_005** — {claim}. Source: {URL or citation}. Pitfalls: {failure modes
  observed in practice when this pattern is applied}.

### Prior or Derived Evidence

- **evid_009** — {claim}. Source: {prior-sprint artifact path, or note that the
  claim was derived from named premises during the proof}.
```

Codebase anchors feed the automatic ground-truth review `design-specify` runs
against the spec — be precise so verification has clean targets. Industry pitfalls
are surfaced because architects use them to weigh approaches; record them
verbatim from the proof.

Omit a subsection if the proof had no Evidence of that source. The section as a
whole must contain at least one Evidence entry; a proof with zero Evidence cannot
ground any Proposition.

---

### Rules and Permissions (REQUIRED)

Designer-directed restrictions on the design space (Rules) and designer-granted
reliefs from specific Rules (Permissions). Both shape what architects can propose.

```markdown
## Rules and Permissions

### Rules

- **rule_001** — {statement}. Rationale: {rationale prose, if recorded}.
- **rule_002** — {statement}.

### Permissions

- **perm_001** — {statement}. Relieves: {rule_NNN id(s) this permission relaxes}.
  Rationale: {rationale prose, if recorded}.
```

If no Rules were established, state: "No designer-directed Rules beyond the Goal."
If no Permissions, state: "No Permissions granted. All Rules apply as stated."
Permissions without a corresponding Rule do not belong here.

---

### Necessary Conditions (Propositions) (REQUIRED)

The claims that must hold for the design to be sound. Each entry is a `prop_NNN`
element. Every Proposition carries: a statement, grounding (the `evid_NNN` ids it
rests on), a reasoning chain (the IF/THEN derivation from grounding to claim), a
collapse test (what breaks if this condition is removed), and any rejected
alternatives recorded during the proof.

```markdown
## Necessary Conditions (Propositions)

- **prop_001 — {one-line summary of the claim}.**
  - Statement: {full statement prose}.
  - Grounding: {evid_NNN id(s) the Proposition rests on}.
  - Reasoning chain: {IF/THEN derivation from grounding to claim — full prose}.
  - Collapse test: {what fails if this Proposition is removed}.
  - Rejected alternatives: {alt 1 — why rejected}; {alt 2 — why rejected}.
    (Omit if none were recorded.)

- **prop_002 — {summary}.** ...
```

Print every Proposition's full statement, full reasoning chain, and full collapse
test verbatim. ID + summary is insufficient — architects evaluate sufficiency of a
proposed approach against the collapse test, and the reviewer agents need the
reasoning chain to verify the spec preserves the condition.

If the proof captured rejected alternatives, list them — architects use the
rejected-alternatives history to avoid re-proposing approaches already considered
and to understand the shape of the design space.

---

### Resolve Conditions (Resolutions) (REQUIRED)

Designer-ratified observable outcomes that certify the design space's exit
condition. Each entry is an `rsln_NNN` element. Every Resolution names the
Concern(s) and/or Risk(s) it covers via `addresses`, and (when recorded) the
Proposition(s) it rests on via `grounding`.

```markdown
## Resolve Conditions (Resolutions)

- **rsln_001 — {one-line summary}.**
  - Statement: {full statement prose}.
  - Addresses: {cern_NNN and/or risk_NNN id(s)}.
  - Grounding: {prop_NNN id(s) the Resolution rests on}. (Omit if not recorded.)

- **rsln_002 — {summary}.** ...
```

The Resolution's `statement` is the seed text `design-specify` uses to derive the
spec's `AC-{N.M}` acceptance criteria. Each Resolution corresponds to one or more
acceptance criteria in the spec, anchored to the Concern or Risk it addresses.

---

## Section Ordering Summary

1. Goal
2. Definitions
3. Concerns
4. Risks
5. Evidence
6. Rules and Permissions
7. Necessary Conditions (Propositions)
8. Resolve Conditions (Resolutions)

All eight content sections are required. Sections whose element category had no
surviving elements at closure carry an explicit "None" statement per their
per-section guidance — this tells the reader the category was considered, not
skipped.

---

## The Self-Containment Test

Before finalizing the brief: **Could a `design-specify` agent consume this brief
and dispatch architect subagents against dispatcher-assigned axes (derived from
tensions among the brief's Necessary Conditions, Permissions, and Resolutions)
without needing to read the proof transcript?**

If the answer is no, the Necessary Conditions, Evidence, or Rules sections are
incomplete. Common gaps that fail this test:

- A Proposition whose reasoning chain or collapse test was paraphrased rather than
  printed verbatim.
- A codebase Evidence entry without a file/type/method anchor.
- A Resolution whose `addresses` field is empty or names a Concern/Risk that does
  not appear in the brief.
- An Industry Evidence entry whose pitfalls are summarized rather than recorded
  verbatim from the proof.

---

## Relationship to Sibling Templates

`design-specify` reads design briefs from multiple upstream sources by section
heading. Three brief templates exist:

- **This template** (`design-proof-system/references/design-brief-template.md`) —
  produced after a closed design proof. Eight sections, organized by the proof
  system's element categories. Use when the design was developed under the design
  proof system.
- **Large-task template** (`../../design-large-task/references/design-brief-template.md`) —
  nine sections, produced by team-interview design flows.
- **Small-task template** (`../../design-small-task/references/design-brief-small-template.md`) —
  six sections, lightweight, for bounded tasks that skip a formal proof.

`design-specify` normalizes all three shapes into one spec contract for
`plan-build`. Use the template that matches the upstream skill that produced the
brief; do not mix.
