# Constraint Envelope — Schema

Source: `deliverables-locked-00.md` § "Three deliverables → Constraint Envelope". Six-field row shape per Class-1 fact-correction errata (brief AC-7 said "five-field" against canonical six-field locked source).

## Row Shape (Six Fields)

- `concern_id` — typed prefix `CE-NNN`. Clerk-enforced.
- `entry_id` — typed prefix `AX-NNN` (axiom) or `PR-NNN` (Proposition). Clerk-enforced.
- `source` — ENUM `{AXIOM, PROPOSITION}`.
- `body` — IF/THEN architectural-altitude claim. No implementation vocabulary.
- `provenance` — ENUM `{DESIGNER, AGENT}`. Clerk reads at read-time for axiom-collision detection, cascade re-audit scope.
- `status` — ENUM `{RATIFIED, REVISED-PENDING}`. Per-row. Consumer reads RATIFIED rows only. REVISED-PENDING blocks consumption at session close.

## Prefix Conventions

- `CE-NNN` — Concern ID.
- `AX-NNN` — axiom entry.
- `PR-NNN` — Proposition entry.

## Read-Out

Flat list ordered by `concern_id`. AXIOM rows before PROPOSITION rows per Concern.

## MVP

One RATIFIED row per Concern (axiom or Proposition).
