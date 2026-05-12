# Master CLAUDE.md — 20260511-01-mp-redesign-proof-system

Read after the root `CLAUDE.md` and before any sub-sprint work.

## Source of truth

- **Design cascade lives in `design-documents/`.** All sub-sprints are normative against that cascade. No sub-sprint redefines design content; sub-sprints consume it.
- **Latest design-tier state:** ADR-0013 (relocates `IMaterializer` to Domain; specifies transaction-visibility as read-own-writes; specifies stratification-check timing inside transactions).

## Sub-sprint locations

- `sprint-01-proof-backend/` — Engine layer work.
- `sprint-02-proof-layer/` — Domain layer work.
- `sprint-03-presentation-layer/` — Interface layer work.

Each sub-sprint has its own `design/ spec/ plan/ summary/` subdirs. All in-progress artifacts live there; no sub-sprint edits the master `design-documents/` cascade without an ADR.

## Active sub-sprint

Read `docs/chester/working/.active-sprint` for the current sub-sprint path.
