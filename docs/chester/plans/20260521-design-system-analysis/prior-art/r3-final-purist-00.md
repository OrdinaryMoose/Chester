# R3 Final Positions — Purist (verbatim)

**File:** `r3-final-purist-00.md`
**Pole:** Purist
**Round:** R3 of 3 (deliverables — final positions)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R3 FINAL POSITIONS

---

DIVERGENCE 1: HOLD — status on Constraint Envelope per row.
Reason: REVISED-PENDING must co-locate with the body it qualifies — Clerk detecting "this specific body is under revision" requires the flag adjacent to the row, not deferred to Coverage Map where the entry_id link adds a lookup. Coverage Map is a coverage artifact, not an operational state tracker.

DIVERGENCE 2: CONCEDE to Innovator + Conservator — add provenance: enum { DESIGNER | AGENT }.
Reason: Clerk axiom-collision check requires knowing designer-voice rows at read time without re-parsing the session record; a typed field is cleaner than re-deriving provenance from entry_id prefix. Two-value enum is closed-set — not audit trail, operational gate.

DIVERGENCE 3: CONCEDE to Conservator + Pragmatist — summary row only, drop hidden detail rows.
Reason: Clerk-internal detail rows not exposed to consumer is a category violation — artifacts must be fully specified, not partially hidden. If Clerk needs detail for re-audit, it maintains that state in its working record, not in the deliverable. Deliverable contains only what design-specify consumes.

---

FINAL POSITION SUMMARY:

- Constraint Envelope: five fields — concern_id, entry_id, source, body, status (RATIFIED | REVISED-PENDING), provenance (DESIGNER | AGENT). Status on the row. Provenance on the row.
- Resolution Criterion: four fields — concern_id, entry_id (PR-NNN only), collapse_test, structural_valid. No grounding. Axiom rows excluded by structural rule.
- Coverage Map: one summary row per Concern — concern_id, axiom_ids list, proposition_ids list, status (COVERED | AXIOM-ONLY | GAP). Rolled up. No hidden rows. Consumer reads directly; Clerk computes from Constraint Envelope at round close.
