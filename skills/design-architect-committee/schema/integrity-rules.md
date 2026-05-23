# Integrity Rules — Schema

Cross-artifact FK rules + session-close gate. Source: `deliverables-locked-00.md` "Cross-artifact integrity rules" + `process-locked-00.md` "Session-close gate".

## FK Rules

- `concern_id` in Coverage Map row → must exist in Constraint Envelope.
- `entry_id` in Coverage Map list (`axiom_ids`, `proposition_ids`) → must exist in Constraint Envelope with matching `source`.
- `entry_id` in Resolution Criterion row → must exist in Constraint Envelope with `source = PROPOSITION`, `status = RATIFIED`.
- Each PROPOSITION row in Constraint Envelope → exactly one matching Resolution Criterion row.
- AXIOM rows in Constraint Envelope → zero matching Resolution Criterion rows.

## Session-Close Gate

Three Clerk conditions, all required:

- Zero GAP rows in Coverage Map.
- Zero REVISED-PENDING rows in Constraint Envelope.
- Each PROPOSITION row in Constraint Envelope → exactly one matching Resolution Criterion row with `structural_valid = TRUE`.

Plus cross-artifact FK checks pass.

AXIOM-ONLY rows in Coverage Map don't block close — flag for designer inspection only.
