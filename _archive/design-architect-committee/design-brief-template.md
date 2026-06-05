# Design Architect Committee — Design Brief Template

Template shows one Concern, full chain, end-to-end. Copy shape. Replace example content. Field names, ENUM values, prefix conventions: preserve exactly.

## Header

- Sprint name: `YYYYMMDD-##-verb-noun-noun`
- Date: `YYYY-MM-DD`
- Scope statement: one sentence. Names architectural target. No implementation vocabulary.

## Concerns

- `CE-001` — Working-record read-write ordering. Scope: concurrent reader/writer access to committee working-record file during a procedure.

## Constraint Envelope

Six-field rows. Order: AXIOM rows before PROPOSITION rows per Concern.

Row 1:
- `concern_id`: `CE-001`
- `entry_id`: `AX-001`
- `source`: `AXIOM`
- `body`: IF the working record is read while a procedure is mid-write, THEN readers may observe inconsistent state.
- `provenance`: `DESIGNER`
- `status`: `RATIFIED`

Row 2:
- `concern_id`: `CE-001`
- `entry_id`: `PR-001`
- `source`: `PROPOSITION`
- `body`: IF the Clerk batches all mutations into atomic transactions, THEN no reader observes mid-write state.
- `provenance`: `AGENT`
- `status`: `RATIFIED`

## Resolution Criterion

Four-field row. AXIOM rows excluded — `AX-001` has none.

Row:
- `concern_id`: `CE-001`
- `entry_id`: `PR-001`
- `collapse_test`: IF NOT all Clerk mutations are atomic, THEN readers may observe mid-write state.
- `structural_valid`: `TRUE`

## Coverage Map

Five-field row. One per Concern.

Row:
- `concern_id`: `CE-001`
- `axiom_ids`: `[AX-001]`
- `proposition_ids`: `[PR-001]`
- `evidence_ids`: `[]`
- `status`: `COVERED`

## Confirmation

Three deliverables produced. Constraint Envelope carries `AX-001` plus `PR-001`, both `RATIFIED`. Resolution Criterion carries `PR-001` collapse test, `structural_valid` TRUE. Coverage Map carries `CE-001` row, status `COVERED`. Brief ready for `design-specify` handoff.
