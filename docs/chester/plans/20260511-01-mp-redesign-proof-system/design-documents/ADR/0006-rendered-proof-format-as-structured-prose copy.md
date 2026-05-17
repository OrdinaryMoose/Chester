---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [05-domain-spec, 02-conops]
---

# ADR-0006: Rendered proof format as structured prose

## Status

Accepted.

## Context

The proof MCP must render its state for human reading at multiple points:
- During construction, when the Designer wants to see what's built so far
- At ratification time, when the Designer audits a specific element
- At closing-argument presentation, when the proof's full case is made
- Post-hoc, when the proof is reviewed for compliance, audit, or training data

The render's audience is a human (Designer or reviewer). Its content is the proof's structured state. Several render formats were considered:

**Option A: JSON dump.** The state object as JSON. Maximally faithful; minimally readable. Rejected immediately as a primary output (it remains useful as a debug/inspection format).

**Option B: Plain prose.** A narrative summary written in natural language. Readable but loses structure; the geometric-proof analogy disappears; the argument's joints are invisible.

**Option C: Structured prose (chosen).** Markdown organized in named sections corresponding to the proof's logical structure: Problem, Givens, Vocabulary, Inferential Framework, Lemmas, Theorems, Frictions, Rejected, Closure status. Each element rendered with its load-bearing fields visible. The structure is overt; the content is prose.

**Option D: Pure formal notation.** Logic notation, proof-tree diagrams, formal proof script (Lean-style). Maximally precise; minimally accessible to humans not trained in the notation. Rejected because the audience is engineering-design-focused, not formal-methods-trained.

**Option E: Hybrid (formal + prose).** Both notation and prose side-by-side. Possible but heavy; the value gained by adding formal notation does not justify the doubled rendering surface for the current audience.

The geometric-proof framing (Vision §1) anchors the choice: the system claims to produce a geometric-proof-shaped argument. The render should *look like* a geometric proof, with the structural roles named. A high-school geometry textbook's two-column proofs are the closest popular analog: structure visible, content readable.

## Decision

**Adopt Markdown structured prose as the primary render format.** The render is organized into named sections matching the proof's logical structure:

```
# Problem
{problem_statement}

# Givens (Evidence)
- {evidence_1.statement} (source: {source})
- ...

# Vocabulary (Definitions)
- **{defn_1.canonical_name}**: {defn_1.definition}
- ...

# Inferential Framework
## Rules
- {rule_1.statement} ({rule_1.modality})
- ...
## Permissions
- {perm_1.statement} (relieves: {rule_id})
- ...

# Lemmas (Propositions)
## By {inference_pattern}
- **{prop_1.statement}** [ratified round {N}]
  - Grounded in: {grounding_summary}
  - Collapse test: {collapse_test}
  - Reasoning: {reasoning_chain}
  - Rejected alternatives: {alternatives_summary}
- ...

# Theorems (Resolutions)
- **{rsln_1.statement}** addresses {concern_label} [ratified: {ratification_text}]
  - Grounded in: {grounded_NCs}
- ...

# Frictions
- **{friction_shape}** between {anchor_a} and {anchor_b} — {disposition}
- ...

# Rejected
- {element_id}: {disposition} (round {N})
- ...

# Closure
Status: {permitted | not_permitted}
{if not_permitted: failure_reasons}
```

Section content is element-by-element. Each element is rendered with its load-bearing fields. Optional fields appear when populated. Phantom (withdrawn) elements appear in the Rejected section with disposition tags.

The Datalog projection (Domain Spec §10.3) is a parallel render available alongside, for users who want machine-inspectable form.

## Consequences

**Positive:**
- **Structure is visible.** Section headers tell the reader what role each block plays. The geometric-proof analogy is preserved.
- **Content is readable.** Markdown is reliably renderable in any tooling the proof flows through (chat, docs, git, terminal previewers).
- **Auditable.** The render is a complete, self-contained representation of the proof. No side-channel context required to understand what the proof claims.
- **Diff-friendly.** Markdown diffs cleanly between rounds; round-over-round changes are visible.
- **Render is pure.** Same state produces same render; tests verify section presence and field rendering deterministically.

**Negative:**
- **Length grows with proof size.** Large proofs produce long renders. Mitigated by section-level navigation and a summary mode.
- **Markdown lacks formal precision.** The render is structured but not formally-machine-checkable. Mitigated by the parallel Datalog projection for users who need formal form.
- **Style choices are sticky.** Once Designers are accustomed to the render shape, changing it incurs cognitive cost. Mitigated by minor evolution (additive sections); avoided by retention of section structure across schema changes.

**Neutral:**
- The render is one of several available formats. The decision does not preclude additional formats (HTML for rich display, LaTeX for archival, etc.); these can be added as parallel adapters at the Interface layer.

## Alternatives considered

- **Option A (JSON)**: rejected as primary; retained as debug format.
- **Option B (plain prose)**: rejected because it loses structural visibility.
- **Option D (pure formal)**: rejected because the audience is not formal-methods-trained.
- **Option E (hybrid)**: rejected because cost-benefit does not justify the doubled rendering.

## References

- Domain Spec §10 (Render policy)
- ConOps §6 (Reading the proof)
- Vision §1 (Geometric-proof analogy)
