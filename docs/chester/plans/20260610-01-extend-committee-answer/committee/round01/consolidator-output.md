# Consolidator output — round 01

## Alignment

Option A — add `warrant` as a new fourth field to Final Position schema (3): Innovator, Pragmatist, Purist | Option B — extend `rationale` field instruction, no new field (1): Conservator

## Per-member summary

- Conservator: Extend the `rationale` field instruction to require explicit warrant-type labeling inline within the existing field — no new schema field, schema stays three fields, Consolidator surface unchanged.
- Innovator: Add `warrant` as a fourth field to Final Position schema, keeping the existing three-field advocacy shape intact, so advocacy and warrant remain orthogonal.
- Pragmatist: Add a single `warrant` field to Final Position schema carrying warrant type (evidence / logic / in-scope designer premise) and source (citation, inference step, or designer statement), as the minimum change that makes team-lead verification possible.
- Purist: Add a typed warrant field (enum: evidence | logic | designer-premise, plus optional source line) inside Final Position as a content extension only, keeping member in advocate role and lead in synthesis role.
- Researcher: Findings not produced (session crash); served no facts this round.

## Notable quotes

- Conservator: "The warrant information already lives in member reasoning; the gap is precision-of-surfacing, not structural absence. Adding a `warrant` field to a C-RIGID-boundary schema risks over-engineering a precision fix."
- Innovator: "Advocacy and warrant are orthogonal. A member can push a framing AND name the checkable ground for its load-bearing claim without abandoning the lens-friction that generates genuine splits."
- Pragmatist: "Free-text warrant still requires the team-lead to judge whether the member's prose constitutes a real warrant or a restatement of the claim. Untyped, unanchored warrant text = opinion disguised as evidence."
- Purist: "Free-text warrant collapses the lead's Authority Guard to a reading-comprehension exercise — the lead cannot structurally verify what type of warrant the member claimed, so the lead still originates the warrant category."
