# Procedures — Schema

Source: `design/procedures-locked-00.md`. Twelve procedures. Each lists Mutates, Trigger, Gates, State.

### Add Concern

- **Mutates** — Concerns registry append `CE-NNN` row. Coverage Map gain GAP row immediate side effect.
- **Trigger** — OPEN, ANCHORED, DELIBERATING. Designer signal.
- **Gates** — `CE-NNN` prefix valid. Uniqueness check.
- **State** — none. Phase unchanged. New Concern unanchored.

### Add Evidence

- **Mutates** — Evidence registry append `EV-NNN` row.
- **Trigger** — any phase except CLOSED.
- **Gates** — `EV-NNN` prefix valid. Uniqueness check.
- **State** — none.

### Add Axiom

- **Mutates** — Constraint Envelope append `AX-NNN` row: `source = AXIOM`, `provenance = DESIGNER`, `status = RATIFIED`, body. On collision: synchronous flag conflicting `RATIFIED PROPOSITION` rows same Concern to `REVISED-PENDING` via cascade.
- **Trigger** — ANCHORED or DELIBERATING. Designer signal only. `provenance = DESIGNER` enforced. Agents cannot call.
- **Gates** — `CE-NNN` must exist in Concerns registry. Body must conform IF/THEN architectural-altitude form (Clerk-enforced). No collision-block — axiom always written. Cascade scope captured synchronously for existing `PROPOSITION` rows on that Concern.
- **State** — OPEN → ANCHORED on first axiom. Late axiom in DELIBERATING: phase unchanged. Cascade mutation deferred next Lint Batch per process hybrid timing (except conflicting Propositions: flagged immediate).

### Initiate Deliberation

- **Mutates** — session state only.
- **Trigger** — ANCHORED. Designer explicit signal.
- **Gates** — at least one anchored Concern exists (at least one `CE-NNN` has `AX-NNN` row).
- **State** — ANCHORED → DELIBERATING.

### Propose Proposition

- **Mutates** — Constraint Envelope append `PR-NNN` row: `source = PROPOSITION`, `provenance = AGENT`, `status = REVISED-PENDING`, body, collapse_test, grounding. No Resolution Criterion row yet (created on Ratify ACCEPT).
- **Trigger** — DELIBERATING only. Agent signal.
- **Gates** — `CE-NNN` must exist and be anchored (has at least one `AX-NNN` row). All grounding `EV-NNN` exist in Evidence registry and not in Clerk's cascade-invalidated scope. Body IF/THEN form. `collapse_test` IF NOT/THEN form. **Axiom-collision check: synchronous block at gate if body directly contradicts any `AX-NNN` body same Concern (structural negation match, not semantic).**
- **State** — row pending Lint Batch.

### Submit Round

- **Mutates** — session state only. Triggers Lint Batch.
- **Trigger** — DELIBERATING. Designer explicit signal.
- **Gates** — none pre-signal.
- **State** — fires Lint Batch. On lint pass DELIBERATING → RATIFYING.

### Lint Batch

- **Mutates** — sets `structural_valid` flag per pending `PR-NNN` row. Applies deferred cascade mutations (flips in-scope rows to REVISED-PENDING). Recomputes Coverage Map. Runs FK integrity checks. Runs axiom-collision check on pending PROPOSITION bodies as defensive backstop (Propose Proposition gate is primary check).
- **Trigger** — Submit Round or Re-Ratify Row (context-parameterized). Round-close variant fires deferred cascade mutations. Re-ratification variant does not.
- **Gates** — Clerk operation. Blocks RATIFYING entry on any structural failure.
- **State** — pass → RATIFYING opens. Failure → flagged rows returned, session stays DELIBERATING.

### Ratify Row

- **Mutates (ACCEPT)** — Constraint Envelope row `status → RATIFIED`. Resolution Criterion append matching row (`concern_id`, `entry_id = PR-NNN`, `collapse_test`, `structural_valid = TRUE`). RC row created here, not at Propose Proposition. **Mutates (REJECT)** — Constraint Envelope row `status → REVISED-PENDING`. Clerk records rejection reason. Disposition parameter: `ACCEPT` | `REJECT`.
- **Trigger** — RATIFYING. Per-row designer disposition.
- **Gates** — `structural_valid = TRUE` required. Designer explicit signal per row. No auto-accept.
- **State** — accepted rows in same batch unaffected by peer rejections. After all rows dispositioned: session-close gate evaluated by Clerk.

### Re-Ratify Row

- **Mutates** — REVISED-PENDING row `status → RATIFIED`. Resolution Criterion row created or updated if `collapse_test` revised.
- **Trigger** — RATIFYING. Row must be REVISED-PENDING. Designer explicit re-ratification.
- **Gates** — Clerk re-lint (Lint Batch re-ratification variant) must confirm `structural_valid = TRUE` first. Designer explicit signal.
- **State** — row → RATIFIED. Contributes to session-close gate evaluation.

### Revise Row

- **Mutates** — target row body, collapse_test, or grounding. `status → REVISED-PENDING` immediate. `structural_valid` reset FALSE. Clerk captures cascade scope synchronously (per process hybrid timing).
- **Trigger** — DELIBERATING (DESIGNER for AXIOM rows; AGENT for own PROPOSITION rows — ownership enforced by Clerk matching `provenance = AGENT` and submission identity). RATIFYING: DESIGNER only (AGENT revision in RATIFYING prohibited — round closed).
- **Gates** — `entry_id` must exist. Revised fields must pass form checks.
- **State** — source row → REVISED-PENDING. Cascade dependents flagged in Clerk working record. Deferred mutation fires next Lint Batch.

### Withdraw Entry

- **Mutates** — removes `entry_id` from Constraint Envelope entirely. Full immediate cascade (both scope capture AND status mutation, per process spec exception). Coverage Map recomputed.
- **Trigger** — any phase except CLOSED. DESIGNER only.
- **Gates** — `entry_id` must exist. Withdrawal irreversible. Re-entry requires new `entry_id`.
- **State** — all rows whose grounding cites withdrawn `entry_id` enter REVISED-PENDING immediate. GAP produced by withdrawal blocks session close.

### Close Session

- **Mutates** — session state → CLOSED. Deliverables frozen. No further mutations permitted.
- **Trigger** — RATIFYING. Designer explicit close signal after all rows dispositioned. Clerk computes session-close gate from current artifact state.
- **Gates** — Clerk-computed three conditions: zero GAP rows in Coverage Map; zero REVISED-PENDING rows in Constraint Envelope; every PROPOSITION row has exactly one matching `structural_valid = TRUE` Resolution Criterion row. Designer reads gate result. Designer does not compute it.
- **State** — RATIFYING → CLOSED on gate pass. RATIFYING → DELIBERATING on gate failure (with Clerk gate-failure report).
