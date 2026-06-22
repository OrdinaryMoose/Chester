# Design Brief — sprint-01-calculator-test-app

- Sprint: `sprint-01-calculator-test-app` (sub-sprint of `20260521-02-design-architect-committee`)
- Date: 2026-05-23
- Source process: `chester:design-architect-committee`, Mode B, four-pole convening; session ratified and CLOSED 2026-05-23
- Downstream consumer: `chester:design-specify`

## Goal

Design substrate decisions for a basic calculator test application. Four architectural choice points decided: numeric precision model, expression-evaluation state shape, error-contract type model, and IO-surface boundary location. Subject is intentionally toy — sprint primary purpose was stress-testing the committee skill itself; this brief is the secondary output produced to exercise the close-and-handoff path. Findings on the committee skill live in the companion `clerk-stress-test-00.md`.

## Prior Art

No prior calculator design exists in this codebase. Subject chosen because the problem space is small, well-known, and easy to reason about against any architectural pole — making it a clean stress-test substrate. The four Decisions (Concerns CE-001..CE-004) and the four ratified positions (PR-001, PR-007, PR-010, PR-013) emerged from one round of four-pole deliberation; no prior committee output influenced them.

## Scope

**In scope:**
- Substrate decisions for arithmetic precision, evaluation state, error contract, and test-seam surface.
- Three frozen deliverables (Constraint Envelope, Resolution Criterion, Coverage Map) consumer-ready for `design-specify`.

**Out of scope:**
- UI layer (button layout, keypad event mapping, display formatting) — orthogonal to chosen substrate; UI selection deferred to a later sprint with substrate locked.
- Operator coverage (which functions ship — `+ - × ÷` only, or also `^`, `√`, trig, memory recall) — feature scope; not a substrate decision.
- Persistence (history, undo, save/restore) — out because not load-bearing on any of the four Concerns and would expand state model beyond AX-002's "intermediate inspectable" requirement without changing it qualitatively.
- Performance targets — toy stress-test subject; no SLA.

## Key Decisions

One Decision per Concern. Each names the chosen Proposition with rationale and the three rejected alternatives.

1. **Arithmetic precision = base-10 fixed-precision Decimal (CE-001 / PR-001 / Conservator).** Spreadsheet-style math; representable domain matches everyday-user mental model; AX-001 refusal fires cleanly on exceedance. **Alternatives rejected:** reduced rationals (PR-002, Innovator — display complexity, irrational fallback still needed); IEEE-754 + per-op epsilon-loss flags (PR-003, Pragmatist — epsilon thresholds heuristic, not bit-exact); typed-by-input-lexeme (PR-004, Purist — user-visible type complexity unjustified for toy subject).
2. **Evaluation = four-register state machine (CE-002 / PR-007 / Pragmatist).** Display, accumulator, pending-op, last-op exposed as read-only registers; matches button-press UX shape; AX-002 satisfied by direct register read. **Alternatives rejected:** shunting-yard producing RPN (PR-005, Conservator — extra parser layer for no gain at this scale); incremental AST (PR-006, Innovator — over-engineered for `+−×÷`); pure expression rewriter (PR-008, Purist — referential-transparency budget not warranted).
3. **Error contract = `Result<Value, ErrorKind>` with closed sum-type `ErrorKind` (CE-003 / PR-010 / Innovator).** Static exhaustiveness check available; AX-003 typing surface aligns with compiler-checkable code paths. **Alternatives rejected:** `CalcError` exception hierarchy (PR-009, Conservator — runtime-only check, type identity weaker than sum-type); `(ErrorTag, message)` enum-pair (PR-011, Pragmatist — tag exhaustiveness manually maintained); failure-class-per-Concern dedicated types (PR-012, Purist — fragments error surface unnecessarily for toy subject).
4. **IO surface = pure-function library + no-logic CLI wrapper (CE-004 / PR-013 / Conservator).** AX-004 test seam = direct library call; CLI is a transport. **Alternatives rejected:** in-process command/event bus (PR-014, Innovator — bus overhead unwarranted); stdin/stdout line protocol as canonical seam (PR-015, Pragmatist — protocol is transport, library call is more direct); typed `Input`/`Output` channel as seam (PR-016, Purist — channel adds wrapping over a function call that's already typed).

## Constraints

Restate the four ratified axioms as plain-language design constraints. (Frozen-deliverable form lives in §Constraint Envelope below.)

- **Numeric domain refusal must be explicit.** Out-of-domain requests must produce a refusal signal, not silent truncation. (AX-001)
- **Intermediate state must be inspectable.** At every input event, the calculator state must be readable by a caller. (AX-002)
- **Errors must be typed by failure class.** Callers receiving an error must be able to distinguish what class of failure occurred. (AX-003)
- **Test seam must be UI-free.** Tests must reach the calculator without instantiating any UI layer. (AX-004)

## Acceptance Criteria

Restate the four `collapse_test` rows as observable verification conditions for `design-specify` and downstream plan-build.

- **CE-001 wrong-pick signal:** decimal type carries explicit precision metadata; absence of metadata on any computed result is detectable.
- **CE-002 wrong-pick signal:** all four registers (display, accumulator, pending-op, last-op) are exposed as read-only on a stable accessor; partial exposure is detectable.
- **CE-003 wrong-pick signal:** `ErrorKind` enumeration is closed; a static check (compiler or linter) catches a new error variant added without being handled.
- **CE-004 wrong-pick signal:** the CLI module's source contains zero arithmetic-logic code; the test seam invokes the library directly without importing CLI.

---

## Frozen Deliverables — for `design-specify`

The three structured artifacts below carry the deliberation result in committee-schema form. `design-specify` consumes these row-by-row; the narrative sections above provide the surrounding context.

### Constraint Envelope

Eight rows. AXIOM rows before PROPOSITION rows per Concern.

Row 1:
- `concern_id`: `CE-001` | `entry_id`: `AX-001` | `source`: `AXIOM` | `provenance`: `DESIGNER` | `status`: `RATIFIED`
- `body`: IF user requests arithmetic on values outside chosen numeric domain, THEN calculator must refuse rather than silently truncate.

Row 2:
- `concern_id`: `CE-001` | `entry_id`: `PR-001` | `source`: `PROPOSITION` | `provenance`: `AGENT` | `status`: `RATIFIED`
- `body`: IF arithmetic uses base-10 fixed-precision Decimal as primary numeric type, THEN representable domain matches user mental model and AX-001 refusal fires on exceedance.

Row 3:
- `concern_id`: `CE-002` | `entry_id`: `AX-002` | `source`: `AXIOM` | `provenance`: `DESIGNER` | `status`: `RATIFIED`
- `body`: IF user input arrives incrementally, THEN intermediate state must be inspectable at every step.

Row 4:
- `concern_id`: `CE-002` | `entry_id`: `PR-007` | `source`: `PROPOSITION` | `provenance`: `AGENT` | `status`: `RATIFIED`
- `body`: IF user input is button-press events feeding a four-register state machine (display, accumulator, pending-op, last-op), THEN AX-002 is satisfied by exposing the four registers.

Row 5:
- `concern_id`: `CE-003` | `entry_id`: `AX-003` | `source`: `AXIOM` | `provenance`: `DESIGNER` | `status`: `RATIFIED`
- `body`: IF an operation cannot produce a defined result, THEN caller receives a typed error distinguishing the failure class.

Row 6:
- `concern_id`: `CE-003` | `entry_id`: `PR-010` | `source`: `PROPOSITION` | `provenance`: `AGENT` | `status`: `RATIFIED`
- `body`: IF every op returns `Result<Value, ErrorKind>` where `ErrorKind` is a closed sum type, THEN AX-003 typing is exhaustively checkable statically.

Row 7:
- `concern_id`: `CE-004` | `entry_id`: `AX-004` | `source`: `AXIOM` | `provenance`: `DESIGNER` | `status`: `RATIFIED`
- `body`: IF the calculator exposes a test seam, THEN the seam must be reachable without instantiating any UI layer.

Row 8:
- `concern_id`: `CE-004` | `entry_id`: `PR-013` | `source`: `PROPOSITION` | `provenance`: `AGENT` | `status`: `RATIFIED`
- `body`: IF the calculator core is a pure-function library and the CLI is a no-logic wrapper, THEN AX-004 test seam is a direct library call.

### Resolution Criterion

Four rows. AXIOM rows excluded.

Row 1:
- `concern_id`: `CE-001` | `entry_id`: `PR-001` | `structural_valid`: `TRUE`
- `collapse_test`: IF NOT decimal type carries explicit precision metadata, THEN domain breach undetectable.

Row 2:
- `concern_id`: `CE-002` | `entry_id`: `PR-007` | `structural_valid`: `TRUE`
- `collapse_test`: IF NOT all four registers are exposed read-only, THEN AX-002 inspection is partial.

Row 3:
- `concern_id`: `CE-003` | `entry_id`: `PR-010` | `structural_valid`: `TRUE`
- `collapse_test`: IF NOT `ErrorKind` is closed and statically exhaustive, THEN unchecked failure paths exist.

Row 4:
- `concern_id`: `CE-004` | `entry_id`: `PR-013` | `structural_valid`: `TRUE`
- `collapse_test`: IF NOT the CLI contains zero calculation logic, THEN AX-004 seam pulls in UI-coupled paths.

### Coverage Map

Four rows. One per Concern.

- `CE-001` | `axiom_ids`: `[AX-001]` | `proposition_ids`: `[PR-001]` | `evidence_ids`: `[]` | `status`: `COVERED`
- `CE-002` | `axiom_ids`: `[AX-002]` | `proposition_ids`: `[PR-007]` | `evidence_ids`: `[]` | `status`: `COVERED`
- `CE-003` | `axiom_ids`: `[AX-003]` | `proposition_ids`: `[PR-010]` | `evidence_ids`: `[]` | `status`: `COVERED`
- `CE-004` | `axiom_ids`: `[AX-004]` | `proposition_ids`: `[PR-013]` | `evidence_ids`: `[]` | `status`: `COVERED`

---

## Deliberation Provenance (informational)

Not part of frozen deliverables. Carried for downstream attribution.

- Pole authorship on ratified Propositions: PR-001 Conservator | PR-007 Pragmatist | PR-010 Innovator | PR-013 Conservator.
- Twelve Propositions withdrawn during RATIFYING (PR-002, PR-003, PR-004, PR-005, PR-006, PR-008, PR-009, PR-011, PR-012, PR-014, PR-015, PR-016). Cascade scope empty on each withdrawal (no grounding citations existed).
- Round count: 1. Submit Round signal fired once; Lint Batch passed without flagging; session reached CLOSED on first close-gate evaluation.

## Companion Documents

- `working-record/working-record-00.md` — full lifecycle audit trail.
- `working-record/clerk-stress-test-00.md` — 42-scenario stress-test report with 16 findings (2 Critical, 2 High, 8 Medium, 4 Low) on the committee skill itself.

## Confirmation

Three frozen deliverables produced and gated. Constraint Envelope = 4 RATIFIED AXIOM + 4 RATIFIED PROPOSITION rows. Resolution Criterion = 4 collapse-tests, `structural_valid = TRUE` each. Coverage Map = 4 Concerns, all `COVERED`. Narrative envelope (Goal, Prior Art, Scope, Key Decisions, Constraints, Acceptance Criteria) wraps the deliverables for `design-specify` consumption without requiring it to read the working record. Brief is self-contained for handoff.
