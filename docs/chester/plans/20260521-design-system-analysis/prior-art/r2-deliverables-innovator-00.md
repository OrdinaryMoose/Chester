# R2 Deliverables — Innovator (verbatim)

**File:** `r2-deliverables-innovator-00.md`
**Pole:** Innovator
**Round:** R2 of 3 (deliverables — refined)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R2 — REFINED DELIVERABLE SHAPES

DM changes applied:
- provenance ENUM {designer | pole_id} → ENUM {DESIGNER | AGENT} (Conservator + Pragmatist + Purist all pushed; pole_id is open-set, binary closes it)
- axiom-only coverage_status dropped; replaced by source breakdown on same row (Purist: axiom-only is coverage mode not status; accepted — source field carries the distinction without a third status value)
- Rejected: Pragmatist push to strip provenance from Constraint Envelope ("audit trail only") — Clerk needs DESIGNER vs AGENT at read time to enforce axiom-collision and cascade re-audit; not audit trail

---

## 1. CONSTRAINT ENVELOPE

Purpose: Complete set of architectural commitments the design must hold true, axioms and ratified Propositions together.

Required fields per entry:
- concern_id: CE-NNN (FK to Concerns registry)
- entry_type: ENUM {AXIOM | PROPOSITION}
- body: IF/THEN architectural-altitude claim
- provenance: ENUM {DESIGNER | AGENT}
- status: ENUM {RATIFIED | REVISED-PENDING}

Read-out: flat list ordered by concern_id, AXIOM entries first. design-specify consumes RATIFIED rows only. REVISED-PENDING rows are blocking — Clerk flags before consumer handoff.

MVP: one RATIFIED entry per Concern (AXIOM or PROPOSITION). Single-Concern session with one RATIFIED AXIOM is valid.

---

## 2. RESOLUTION CRITERION

Purpose: Explicit failure condition per ratified Proposition — machine-inspectable falsifiability statement.

Required fields per entry:
- concern_id: CE-NNN (shared join key — all three artifacts key on concern_id)
- proposition_id: PR-NNN (FK to Constraint Envelope PROPOSITION row)
- collapse_test: IF NOT/THEN contrapositive (structural form enforced)
- structural_valid: bool (Clerk-set: syntactic contrapositive match confirmed)

Read-out: one row per RATIFIED PROPOSITION entry. AXIOM entries carry no collapse_test — designer-certified ground truth, no failure condition required. design-specify reads collapse_test as falsifiability battery.

MVP: one row per ratified non-axiom Concern. structural_valid must be true before session close.

---

## 3. COVERAGE MAP

Purpose: Per-Concern accounting — what addresses it, by what source, grounded by what Evidence.

Required fields per row:
- concern_id: CE-NNN
- coverage_source: ENUM {AXIOM | PROPOSITION}
- entry_id: AX-NNN or PR-NNN (typed prefix, Clerk-enforced)
- evidence_ids: list of EV-NNN (empty permitted for AXIOM rows)
- status: ENUM {RATIFIED | GAP}

Read-out: one row per (concern_id, entry_id) pair. Clerk produces rolled-up GAP row for any Concern with zero RATIFIED entries of either source — GAP blocks session close. design-specify aggregates by concern_id to confirm full coverage; detail rows enable Clerk re-audit on revision.

MVP: every Concern appears at least once. Any Concern with only GAP rows blocks handoff.
