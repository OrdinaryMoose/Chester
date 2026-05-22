# Deliverables — Locked Specification

**File:** `deliverables-locked-00.md`
**Status:** Ratified by designer 2026-05-21
**Macro step:** 1 of 4 (deliverables) — COMPLETE
**Source:** four-pole convergence (R1 → R1 DM → R2 → R3) + designer adjudication of D3
**Date:** 2026-05-21

---

## Three deliverables

Every design session produces these three artifacts. Design-specify consumes them. No other deliverables exist.

### 1. Constraint Envelope

Five fields per row.

- `concern_id` — typed prefix `CE-NNN`. Clerk-enforced.
- `entry_id` — typed prefix `AX-NNN` (axiom) or `PR-NNN` (Proposition). Clerk-enforced.
- `source` — ENUM { AXIOM | PROPOSITION }.
- `body` — IF/THEN architectural-altitude claim. No implementation vocabulary.
- `provenance` — ENUM { DESIGNER | AGENT }. Clerk reads at read time for axiom-collision detection and cascade re-audit scope.
- `status` — ENUM { RATIFIED | REVISED-PENDING }. Per-row. Consumer reads RATIFIED rows only. REVISED-PENDING rows block consumption at session close.

Read-out: flat list ordered by `concern_id`, AXIOM rows before PROPOSITION rows.

MVP: one RATIFIED row per Concern (axiom or Proposition).

### 2. Resolution Criterion

Four fields per row. Axiom rows excluded — designer-asserted ground truth has no failure condition.

- `concern_id` — `CE-NNN`. Shared join key with Constraint Envelope.
- `entry_id` — `PR-NNN` only. FK to Constraint Envelope PROPOSITION row.
- `collapse_test` — IF NOT/THEN contrapositive. Structural form Clerk-enforced. Co-located on the Proposition record so revision cannot split body from collapse_test.
- `structural_valid` — BOOLEAN. Clerk-set after syntactic contrapositive match. Must be TRUE before designer ratification accepted.

Read-out: one row per ratified PROPOSITION entry. Falsifiability battery for design-specify.

MVP: one row per ratified non-axiom Concern.

### 3. Coverage Map

Five fields per row. One row per Concern (rolled-up summary). No detail rows in artifact.

- `concern_id` — `CE-NNN`.
- `axiom_ids` — list of `AX-NNN`. Empty if none.
- `proposition_ids` — list of `PR-NNN`. Empty if axiom-only.
- `evidence_ids` — list of `EV-NNN`. Evidence grounding the Propositions.
- `status` — ENUM { COVERED | AXIOM-ONLY | GAP }. Clerk computes from Constraint Envelope at round close.

Status semantics.
- COVERED — at least one RATIFIED PROPOSITION row for this Concern.
- AXIOM-ONLY — axioms present, zero ratified Propositions. Passes session close but flags for designer inspection (no collapse_test exists for this Concern).
- GAP — neither axioms nor ratified Propositions. **Blocks session close.**

Read-out: one summary row per Concern. Consumer reads `status` field directly. No aggregation required at consumer surface.

MVP: every Concern appears in exactly one row, status populated.

---

## Cross-artifact integrity rules

The Clerk enforces these at every round close.

- `concern_id` in any Coverage Map row must appear in the Constraint Envelope (as one or more entries).
- `entry_id` referenced in any Coverage Map list (axiom_ids, proposition_ids) must appear in the Constraint Envelope with matching `source`.
- `entry_id` in any Resolution Criterion row must appear in the Constraint Envelope with `source = PROPOSITION` and `status = RATIFIED`.
- Every PROPOSITION row in the Constraint Envelope must have exactly one matching Resolution Criterion row.
- AXIOM rows in the Constraint Envelope have no matching Resolution Criterion row.

---

## Clerk working record (separate from deliverables)

Per designer adjudication of D3 with team-lead modification.

- Clerk maintains a persisted working record between rounds.
- Working record carries detail-level data — axiom-to-Concern mappings, Proposition-to-Concern mappings, Evidence chains, per-entry provenance and status history, cascade-re-audit indices.
- Working record is **not a deliverable.** Design-specify does not consume it.
- If the Committee re-opens the design after session close, Clerk reloads the working record and re-audits from it.
- Working record format is unspecified at this point — it lives inside macro step 4 (actors), which scopes the Clerk's responsibilities.

---

## What this artifact does NOT specify

The locked deliverables describe shape and read-out. They do not describe:

- How a session moves from open Concerns to ratified rows. (Macro step 2 — process.)
- The specific operations that mutate the artifact contents. (Macro step 3 — procedures.)
- Who performs which operations. (Macro step 4 — actors.)

These are the next three macro steps, in order.
