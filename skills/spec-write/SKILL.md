---
name: spec-write
description: "Author a spec document from a FAC-complete design. Use when the architecture is already settled — by a design-committee complete-design document or a spec-architect output. Reads the eight-field FAC-complete-design contract (labeled fields on the committee path, extraction on the spec-architect path), quotes back the chosen-architecture field for confirmation, fills the spec template, and emits the spec. Authors only — runs no review passes. Invoked by both entry paths; transitions to spec-harden."
version: v0002
---

# Write Spec

Author a spec document from a FAC-complete design. A pure function of settled architecture: `spec-write` performs no architecture selection and **no review passes** — it consumes a settled design and produces a spec. Hardening is `spec-harden`'s job.

This is a **flexible** skill — scale each spec section to its complexity.

## Entry Condition

A **FAC-complete design** exists (see `references/fac-complete-design-contract.md`) — one input type with two producers:
- a `design-committee` complete-design document (FAC-complete by deliberation), or
- a `spec-architect` output (FAC-complete by its F-A-C step).

Because there is no architecture stage inside `spec-write`, the committee path cannot trigger architecture re-derivation — the no-duplication invariant is satisfied by construction (D8).

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Read the FAC-complete design** — obtain the eight fields per `references/fac-complete-design-contract.md`: on the **committee path** read them from the labeled sub-fields of the complete-design document (a structured read, not a narrative mine); on the **spec-architect path** extract them from its output.
2. **Quote back the architecture** — read the chosen-architecture field and quote it back to the user for confirmation before authoring any spec section. This is mandatory; it is the only guard against silent architecture mis-extraction (hardening cannot catch a wrong-from-the-start architecture).
3. **Write the spec document** — fill the template at `references/spec-template.md` from the eight fields.
4. **Transition** — invoke `spec-harden` to run the three review passes. In the normal pipeline, continue directly so the adversarial pass inherits authoring context by agent continuity.

## Writing the Spec

- Read the design brief from disk (if it exists) and conversation context
- Using the user's chosen architecture as the structural foundation, synthesize into a structured spec document covering: architecture, components, data flow, error handling, testing strategy, constraints, non-goals
- Follow the loop-optimized spec format at `references/spec-template.md` — every acceptance criterion carries a stable `AC-{N.M}` ID, an observable-boundary declaration, a Given/When/Then block, and placeholders for `Implementing tasks` (populated by plan-build) and `Decisions` (populated by execute-write).
- Scale each section to its complexity — a few sentences if straightforward, detailed if nuanced
- No YAML frontmatter is needed in spec documents. All skills read output paths from the project config, not from document frontmatter.
- Write to the `spec/` subdirectory (see `util-artifact-schema` for exact path and naming)
- After writing the spec, stamp the provenance trailer per `util-artifact-schema` `## Provenance Trailers`:

  ```bash
  chester-trailer-write stamp spec-write@<this-skill-version> "<spec-path>"
  ```

  Use the `<this-skill-version>` value from this skill's `version` frontmatter field.

**Brief → spec AC derivation.** Each `AC-{N.M}` block in the spec seeds from a `RCON-N` Resolve Condition statement in the brief's Resolve Conditions section. The brief's locked Concerns section seeds the spec's coverage rationale — every Concern should be covered by at least one acceptance criterion or by a constraint. The spec's `AC-{N.M}` numbering is independent of the brief's `RCON-N` numbering — RC statements provide the seed text, not a renumbering.

## Integration

- **Reads:** `references/fac-complete-design-contract.md` (the eight-field input type), `references/spec-template.md` (output format), `util-artifact-schema` (naming/paths)
- **Invoked by:** `spec-architect` (small-task path), the `design-committee` path (committee complete-design document), or user directly (standalone, with any FAC-complete design)
- **Transitions to:** `spec-harden`
- **Does NOT:** settle architecture (that is `spec-architect`), run any review pass (that is `spec-harden`), or branch on which producer supplied the design (one contract, two producers — D6)
