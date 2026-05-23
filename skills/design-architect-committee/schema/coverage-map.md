# Coverage Map — Schema

Source: `deliverables-locked-00.md` § "Three deliverables → Coverage Map". One row per Concern.

## Row Shape (Five Fields)

- `concern_id` — `CE-NNN`.
- `axiom_ids` — list of `AX-NNN`. Empty if none.
- `proposition_ids` — list of `PR-NNN`. Empty if axiom-only.
- `evidence_ids` — list of `EV-NNN`. Grounds Propositions.
- `status` — ENUM `{COVERED, AXIOM-ONLY, GAP}`. Clerk computes from Constraint Envelope at round close.

## Status Semantics

- `COVERED` — at least one RATIFIED PROPOSITION row for Concern.
- `AXIOM-ONLY` — axioms present, zero ratified Propositions. Passes session close, flags designer inspection.
- `GAP` — neither axioms nor ratified Propositions. **Blocks session close.**

## Read-Out

One summary row per Concern. Consumer reads `status` direct. No aggregation at consumer surface.

## MVP

Every Concern exactly one row; status populated.
