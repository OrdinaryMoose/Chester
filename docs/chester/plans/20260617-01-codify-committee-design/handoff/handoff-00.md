# Handoff — Codify a committee complete-design document (reverse D9)

**Date:** 2026-06-17
**Sprint:** 20260617-01-codify-committee-design
**For:** a fresh session that will **convene `design-committee`** on the question below.

---

## One-line task

Make `design-committee` author a **complete design document** (committee-specific template mirroring the eight FAC fields), instead of a verdict-only decision packet that `spec-write` must mine. This reverses decision **D9**.

## Why (the gap)

- `design-committee` emits only a verdict decision-packet — `skills/design-committee/references/artifact-template.md` (Summary / Verdict / Rationale / Dissent Record / Deferred). Not a design document.
- `design-small-task` emits a real six-section design brief — `skills/design-small-task/references/design-brief-small-template.md` (Goal, Prior Art, Scope, Key Decisions, Constraints, Acceptance Criteria).
- Both feed `spec-write` as a "FAC-complete design," but only the brief is an actual design document. The committee side is a verdict the design is reverse-engineered out of.
- The bridge is `skills/spec-write/references/fac-complete-design-contract.md`: it defines FAC-complete-design as **eight fields `spec-write` extracts** from the producer's native output (for the committee, mined from narrative verdict). **D9** (same file, ~lines 24-26) explicitly *rejected* a typed committee design bundle to avoid "artifact bifurcation," keeping it only as a fallback.
- Self-admitted risk in that contract (line 22): silent mis-extraction from a narrative verdict is "the one failure hardening structurally cannot catch — the quote-back is the only guard." That single human gate is what this work removes the reliance on.

## Designer's ratified decisions (from this conversation)

- **(a) Scope = committee-SPECIFIC template** mirroring the eight FAC fields. NOT a single shared format with `design-small-task`. Keep the committee's mandatory **Dissent Record**.
- **(b) Path = convene the committee** (this is a meta-architecture / D9-reversal call; independent lenses wanted). To be run in a **new session** — this handoff is that session's entry point.

These are the designer's *leanings to pressure-test*, not a pre-decided verdict. The committee must be free to challenge them (esp. the Purist on "why not one shared format").

## Convening question (paste to start the committee)

> Should `design-committee` emit a complete design document via a committee-specific template that mirrors the eight FAC-complete-design fields — reversing D9, which kept the committee on a verdict-only decision packet and made `spec-write` extract the design from narrative?

## Hard constraints any solution must respect

- **Context-economy invariant** — the scribe stays bounded-input: authors from `verdict.md` + `consolidator-output.md` + `alignment-map.md` only, never raw transcripts or the session thread. See `agents/design-committee-scribe.md` and memory `project_committee_context_economy`.
- **Catalog freshness** — if any skill `description` changes, regen + stage `skills/setup-start/references/skill-index.md` in the same commit (`bin/chester-generate-agents`). Version-bump-only edits are catalog-safe. Memory `project_catalog_freshness_invariant`.
- **Standalone invocability** of the committee must survive (no sprint context fabricated).

## Files the next session will likely touch

- `skills/design-committee/references/artifact-template.md` — current verdict-packet template (the thing being replaced/augmented).
- New: a committee complete-design template (the eight-field mirror + Dissent Record).
- `skills/design-committee/agents/` → actually `agents/design-committee-scribe.md` — scribe inputs/output may need the new template path wired in.
- `skills/spec-write/references/fac-complete-design-contract.md` — D9 rationale + extraction-vs-document framing updates once the committee emits a real document.
- `skills/design-committee/SKILL.md` § Scribe (lines ~148-151) — references `artifact-template.md` by path.

## State

- Nothing implemented. Diagnosis + decisions only.
- No branch/worktree created for this work yet.
- Decision persisted to memory: `project_committee_design_document_gap` (indexed in MEMORY.md).
- This sprint folder (`20260617-01-codify-committee-design/`) currently holds only this handoff; the committee will create its own `committee/` tree at convene time.

## First moves for the next session

1. `eval "$(chester-config-read)"`; confirm working dir.
2. Convene `design-committee` with the question above; feed the context block and hard constraints as the convening packet.
3. After the verdict: route to the spec path (committee verdict = FAC-complete design → `spec-write` → `spec-harden` → `plan-build`), or implement the template change directly if the committee scopes it small.
