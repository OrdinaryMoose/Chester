# Resolution Criterion — Schema

Source: `deliverables-locked-00.md` § "Three deliverables → Resolution Criterion". Four fields per row. AXIOM rows excluded.

## Row Shape (Four Fields)

- `concern_id` — `CE-NNN`. Join key shared with Constraint Envelope.
- `entry_id` — `PR-NNN` only. FK to Constraint Envelope PROPOSITION row.
- `collapse_test` — IF NOT/THEN contrapositive. Structural form Clerk-enforced.
- `structural_valid` — BOOLEAN. Clerk-set after syntactic contrapositive match. Must be TRUE before designer ratification accepted.

## AXIOM Exclusion

AXIOM rows have no Resolution Criterion row — designer-asserted ground truth has no failure condition.

## Read-Out

One row per ratified PROPOSITION entry. Falsifiability battery for `design-specify`.

## MVP

One row per ratified non-axiom Concern.
