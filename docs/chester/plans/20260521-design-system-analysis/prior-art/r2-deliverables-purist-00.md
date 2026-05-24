# R2 Deliverables — Purist (verbatim)

**File:** `r2-deliverables-purist-00.md`
**Pole:** Purist
**Round:** R2 of 3 (deliverables — refined)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R2 DELIVERABLES (refined)

CHANGES FROM R1 — per DM push-backs:
- ratified_by: enum {DESIGNER} dropped (Conservator right: dead single-value field). Replaced by status field carrying revision state — load-bearing, not audit trail.
- round dropped from Constraint Envelope (Innovator + Pragmatist right: process metadata, not constraint content).
- Coverage Map rolled up: Clerk produces one summary row per Concern plus detail rows. Consumer reads summary; Clerk uses detail for re-audit. Resolves Conservator's aggregation push-back.
- grounding on Resolution Criterion dropped (Pragmatist right: ambiguous whether it re-cites Proposition evidence or adds new evidence; if same, redundant; if different, undefined). Evidence traceability runs through Constraint Envelope → Coverage Map join.

REJECTED PUSH-BACKS:
- "Axiom-only is not GAP so drop distinct status" (Innovator): rejected. Axiom-only Concern has no collapse_test — design-specify cannot falsify it. That asymmetry must be visible in the artifact, not inferred.

---

## 1. CONSTRAINT ENVELOPE

Purpose: flat indexed record of every hold-true architectural commitment per Concern.

Required fields:
- concern_id: CE-NNN
- entry_id: AX-NNN or PR-NNN (typed prefix; Clerk-enforced)
- source: enum { AXIOM | PROPOSITION }
- body: IF/THEN architectural-commitment sentence
- status: enum { RATIFIED | REVISED-PENDING }

Read-out: flat list ordered by concern_id, AXIOM rows before PROPOSITION rows. REVISED-PENDING rows visible to consumer — design-specify treats them as open, not locked.

MVP: one RATIFIED row per Concern minimum. Any Concern with zero RATIFIED rows is a blocking gap.

---

## 2. RESOLUTION CRITERION

Purpose: per-Concern falsifiability record — what failure looks like for each ratified Proposition.

Required fields:
- concern_id: CE-NNN (FK to Constraint Envelope)
- entry_id: PR-NNN (FK to source Proposition row; AXIOM rows excluded)
- collapse_test: IF NOT/THEN contrapositive sentence
- structural_valid: bool (Clerk-set; syntactic form confirmed)

Read-out: one row per PROPOSITION-sourced Constraint Envelope entry. Axiom rows have no Resolution Criterion row — intentional. Consumer sees per-Proposition failure condition with structural validation flag.

MVP: one row per ratified Proposition. structural_valid must be true before designer ratification accepted.

---

## 3. COVERAGE MAP

Purpose: per-Concern coverage accounting with rolled-up status for consumer and detail rows for Clerk re-audit.

Required fields (summary row):
- concern_id: CE-NNN
- axiom_ids: list of AX-NNN (empty if no axioms)
- proposition_ids: list of PR-NNN (empty if axiom-only)
- status: enum { COVERED | AXIOM-ONLY | GAP }

Read-out: one summary row per Concern. Consumer reads status field; COVERED = at least one RATIFIED PROPOSITION; AXIOM-ONLY = axioms present, no ratified Proposition; GAP = neither. GAP blocks session close. AXIOM-ONLY passes but flags that design-specify has no collapse_test for this Concern.

MVP: one summary row per Concern with status populated. Clerk also maintains detail rows (one per entry_id) for re-audit on revision — not exposed to consumer.
