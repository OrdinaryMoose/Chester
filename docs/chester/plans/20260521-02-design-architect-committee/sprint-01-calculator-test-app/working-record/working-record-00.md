# Working Record — sprint-01-calculator-test-app

- Sprint: `sprint-01-calculator-test-app` (sub-sprint of `20260521-02-design-architect-committee`)
- Date opened: 2026-05-23
- Scope: design basic calculator test application
- Mode: B (four poles + clerk + researcher)
- Phase: `CLOSED`
- Stress-test note: pole voices simulated inline by facilitator. No sub-agent dispatch. Mechanics exercised; deliberation depth shallow by design.

## Concerns Registry

- `CE-001` — arithmetic precision model. Scope: numeric type underlying ops; behavior under non-representable results.
- `CE-002` — expression evaluation strategy. Scope: how user input becomes computed result; state machine shape.
- `CE-003` — error semantics. Scope: behavior on div-by-zero, overflow, malformed input; visible-to-caller contract.
- `CE-004` — IO surface boundary. Scope: what `test application` exposes — CLI, library API, GUI widget — and where the test seam sits.

## Evidence Registry

(empty)

## Constraint Envelope

Row 1:
- `concern_id`: `CE-001`
- `entry_id`: `AX-001`
- `source`: `AXIOM`
- `body`: IF user requests arithmetic on values outside chosen numeric domain, THEN calculator must refuse rather than silently truncate.
- `provenance`: `DESIGNER`
- `status`: `RATIFIED`

Row 2:
- `concern_id`: `CE-002`
- `entry_id`: `AX-002`
- `source`: `AXIOM`
- `body`: IF user input arrives incrementally, THEN intermediate state must be inspectable at every step.
- `provenance`: `DESIGNER`
- `status`: `RATIFIED`

Row 3:
- `concern_id`: `CE-003`
- `entry_id`: `AX-003`
- `source`: `AXIOM`
- `body`: IF an operation cannot produce a defined result, THEN caller receives a typed error distinguishing the failure class.
- `provenance`: `DESIGNER`
- `status`: `RATIFIED`

Row 4:
- `concern_id`: `CE-004`
- `entry_id`: `AX-004`
- `source`: `AXIOM`
- `body`: IF the calculator exposes a test seam, THEN the seam must be reachable without instantiating any UI layer.
- `provenance`: `DESIGNER`
- `status`: `RATIFIED`

### Round 1 Ratified Propositions (post-close)

Row 5:
- `concern_id`: `CE-001`
- `entry_id`: `PR-001`
- `source`: `PROPOSITION`
- `body`: IF arithmetic uses base-10 fixed-precision Decimal as primary numeric type, THEN representable domain matches user mental model and AX-001 refusal fires on exceedance.
- `provenance`: `AGENT`
- `status`: `RATIFIED`

Row 6:
- `concern_id`: `CE-002`
- `entry_id`: `PR-007`
- `source`: `PROPOSITION`
- `body`: IF user input is button-press events feeding a four-register state machine (display, accumulator, pending-op, last-op), THEN AX-002 is satisfied by exposing the four registers.
- `provenance`: `AGENT`
- `status`: `RATIFIED`

Row 7:
- `concern_id`: `CE-003`
- `entry_id`: `PR-010`
- `source`: `PROPOSITION`
- `body`: IF every op returns `Result<Value, ErrorKind>` where `ErrorKind` is a closed sum type, THEN AX-003 typing is exhaustively checkable statically.
- `provenance`: `AGENT`
- `status`: `RATIFIED`

Row 8:
- `concern_id`: `CE-004`
- `entry_id`: `PR-013`
- `source`: `PROPOSITION`
- `body`: IF the calculator core is a pure-function library and the CLI is a no-logic wrapper, THEN AX-004 test seam is a direct library call.
- `provenance`: `AGENT`
- `status`: `RATIFIED`

### Withdrawn (post-close)

Withdrawn during RATIFYING via Withdraw Entry (irreversible, full immediate cascade — grounding empty, cascade scope empty):
`PR-002`, `PR-003`, `PR-004`, `PR-005`, `PR-006`, `PR-008`, `PR-009`, `PR-011`, `PR-012`, `PR-014`, `PR-015`, `PR-016`.

## Resolution Criterion

Row 1:
- `concern_id`: `CE-001`
- `entry_id`: `PR-001`
- `collapse_test`: IF NOT decimal type carries explicit precision metadata, THEN domain breach undetectable.
- `structural_valid`: `TRUE`

Row 2:
- `concern_id`: `CE-002`
- `entry_id`: `PR-007`
- `collapse_test`: IF NOT all four registers are exposed read-only, THEN AX-002 inspection is partial.
- `structural_valid`: `TRUE`

Row 3:
- `concern_id`: `CE-003`
- `entry_id`: `PR-010`
- `collapse_test`: IF NOT `ErrorKind` is closed and statically exhaustive, THEN unchecked failure paths exist.
- `structural_valid`: `TRUE`

Row 4:
- `concern_id`: `CE-004`
- `entry_id`: `PR-013`
- `collapse_test`: IF NOT the CLI contains zero calculation logic, THEN AX-004 seam pulls in UI-coupled paths.
- `structural_valid`: `TRUE`

## Coverage Map (post-close)

- `CE-001` | axiom_ids=[AX-001] | proposition_ids=[PR-001] | evidence_ids=[] | status=`COVERED`
- `CE-002` | axiom_ids=[AX-002] | proposition_ids=[PR-007] | evidence_ids=[] | status=`COVERED`
- `CE-003` | axiom_ids=[AX-003] | proposition_ids=[PR-010] | evidence_ids=[] | status=`COVERED`
- `CE-004` | axiom_ids=[AX-004] | proposition_ids=[PR-013] | evidence_ids=[] | status=`COVERED`

## Deferred Followups

- **Rename `Concern` → `Decision` (or `Architectural Decision` / `Decision Point`).** SE-native term `Concern` misnames the schema role. Functionally each `CE-NNN` = one architectural decision point with structurally competing positions (ADR-aligned). Candidates: `DC-NNN` (Decision), `AD-NNN` (Architectural Decision), `DP-NNN` (Decision Point). Class-1 change — touches schema files, design-brief template, downstream `design-specify` consumer. Verify prior `design-committee` skill not load-bearing on the Concern term before flipping. Deferred to its own sprint.
- **Committee `design-brief-template.md` is structurally insufficient compared to standard Chester brief templates.** Current committee template (`skills/design-architect-committee/design-brief-template.md`) is rows-only: Header / Concerns / Constraint Envelope / Resolution Criterion / Coverage Map / Confirmation. Standard Chester brief (`skills/design-small-task/references/design-brief-small-template.md`) carries Goal / Prior Art / Scope / Key Decisions / Constraints / Acceptance Criteria narrative. Downstream consumers (`design-specify`, plan-build readers) need both — the structured deliverables AND the surrounding context. Current template forces ad-hoc narrative grafting at write-time, which is fragile. Candidate fix: revise committee template to wrap three frozen deliverables INSIDE a 6-section narrative envelope (Goal / Prior Art / Scope / Key Decisions where each Decision = one Concern with chosen Proposition + rejected alternatives / Constraints = restated axioms / Acceptance Criteria = restated collapse_tests). Constraints + Acceptance Criteria sections double as plain-language restatements of axioms + collapse_tests, mirroring the rows. Authorial discipline: narrative sections derive mechanically from row content, no editorializing. Class-1 template change.
- **Extend Team-Lead packaging with a PM-facing companion brief.** Three frozen deliverables (Constraint Envelope, Resolution Criterion, Coverage Map) are machine-readable and architect-readable; PM cannot consume row-by-row IF/THEN form. Add fourth output produced by Team-Lead at session close from Clerk-certified state. Per-Decision-Point view, options surfaced as A/B/C/D with pole attribution, plain-language summary, buys/costs/locks-out bullets, `collapse_test` reframed as "wrong-pick signal", default-rule line. View-layer transform; no schema change. Two missing-field followups surfaced under this: `cost_estimate` and `reversibility_class` (one-way vs two-way door) not currently in schema — PM brief would benefit; consider adding to Resolution Criterion row shape. Stays inside Team-Lead authority envelope (mechanical extraction, no synthesis). Deferred to its own sprint.

## Phase Log

- 2026-05-23 — session opened, phase=OPEN
- 2026-05-23 — CE-001..CE-004 added; phase=OPEN (no axiom yet)
- 2026-05-23 — AX-001..AX-004 asserted; first axiom fires OPEN → ANCHORED. All four Concerns AXIOM-ONLY.
- 2026-05-23 — Designer Initiate Deliberation; ANCHORED → DELIBERATING.
- 2026-05-23 — Round 1 dispatch by Team-Lead; poles submit PR-001..PR-016 (4 poles × 4 Concerns). All rows REVISED-PENDING awaiting Lint Batch.
- 2026-05-23 — Designer Submit Round; Clerk Lint Batch fires. All 16 PR rows structural_valid=TRUE. No cascade pending. No axiom-collision. FK integrity OK. Coverage Map stays AXIOM-ONLY (RATIFICATION required for COVERED). Phase DELIBERATING → RATIFYING.
- 2026-05-23 — Stress test pivot. RATIFYING dispositions deferred. 42 scenarios run against locked schema in `clerk-stress-test-00.md`. 16 findings, 2 Critical, 2 High, 8 Medium, 4 Low.
- 2026-05-23 — Designer signal (a): full disposition path. ACCEPT PR-001/PR-007/PR-010/PR-013 (winners per Concern). WITHDRAW PR-002, PR-003, PR-004, PR-005, PR-006, PR-008, PR-009, PR-011, PR-012, PR-014, PR-015, PR-016 (12 losers). Cascade scope empty (no grounding cites). Resolution Criterion gains 4 rows on ACCEPT.
- 2026-05-23 — Designer signal Close Session. Clerk gate evaluation: zero GAP ✓ (all 4 Concerns COVERED); zero REVISED-PENDING ✓ (12 withdrawn entirely, 4 ratified); each PROPOSITION → matching RC row with structural_valid=TRUE ✓; FK integrity ✓. **Gate PASS.** Phase RATIFYING → CLOSED. Deliverables frozen.
- 2026-05-23 — Team-Lead packaging fires. Three deliverables extracted from Clerk-certified state. Design brief written to `design/sprint-01-calculator-test-app-design-00.md`.
- 2026-05-23 — Designer feedback: initial brief structurally insufficient vs standard Chester brief templates (rows-only, missing Goal/Prior Art/Scope/Key Decisions/Constraints/Acceptance Criteria narrative). Brief rewritten to compose three frozen deliverables INSIDE a 6-section narrative envelope. Third deferred followup logged: committee `design-brief-template.md` itself needs revision.
- 2026-05-23 — Deferred items consolidated into single durable document: `summary/sprint-01-calculator-test-app-deferred-followups-00.md`. Merges 3 narrative followups (NF-01..NF-03) + 16 stress-test findings (F-01..F-16) with severity buckets, candidate fixes, scope analysis, and recommended priority order.
