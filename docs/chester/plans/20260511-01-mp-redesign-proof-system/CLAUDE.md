# Master CLAUDE.md — 20260511-01-mp-redesign-proof-system

Read after the root `CLAUDE.md` and before any sub-sprint work.

## Scope

Redesign the proof system that drives Phase 4b solve. Target: `skills/design-proof-system/` (new). The legacy `skills/design-large-task/proof-mcp/` is the prior system and is **out of scope** — root CLAUDE.md's System Boundary rule applies: never reference both in the same prompt, research output, or artifact.

## Sub-sprint locations

Three primary layer sub-sprints (sequenced):

- `sprint-01-proof-backend/` — Engine layer.
- `sprint-02-proof-layer/` — Domain layer.
- `sprint-03-presentation-layer/` — Interface layer.

Re-pass and bug-fix sub-sprints are created as needed under the same master:

- `sprint-<NN>-...-pass-<N>/` — re-do passes (e.g. `sprint-01-proof-backend-pass-3`).
- `sprint-<NN>-bug-fix-<MM>/` — targeted post-merge fixes (e.g. `sprint-02-bug-fix-09`).

Each sub-sprint has its own `design/ spec/ plan/ summary/` subdirs. All in-progress artifacts live there.

## Active sub-sprint

No `.active-sprint` breadcrumb currently in place. Identify the current sub-sprint via the latest non-archived working subdir, the active git branch, or by asking the designer.

## Shared design materials

- `master-plan.md` — sequence, locked context.
- `design-documents/` — cross-sub-sprint design references.
- `ADR/` — master-level decision records.
