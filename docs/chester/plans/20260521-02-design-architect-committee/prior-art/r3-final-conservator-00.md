# R3 Final Positions — Conservator (verbatim)

**File:** `r3-final-conservator-00.md`
**Pole:** Conservator
**Round:** R3 of 3 (deliverables — final positions)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R3 FINAL POSITIONS

**DIVERGENCE 1: CONCEDE** — Row-level status on Constraint Envelope is correct; consumer needs to distinguish live RATIFIED rows from REVISED-PENDING rows in the same document without consulting a second artifact. Adopt three-pole position: status per entry row, ENUM { RATIFIED | REVISED-PENDING }.

**DIVERGENCE 2: HOLD** — Provenance is not audit trail. It is the structural enforcement of two-player asymmetric authority at the entry level. Without provenance: DESIGNER | AGENT, the Constraint Envelope cannot mechanically distinguish designer-asserted axioms from agent-proposed Propositions. Clerk axiom-collision check requires this field. Dropping it collapses the designer/agent distinction into undifferentiated body rows — Vision Sec 2.6 violation. Pragmatist's "claim + state sufficient" does not address Clerk's cascade re-audit and axiom-collision surface.

**DIVERGENCE 3: CONCEDE to Purist** — Rolled-up summary row per Concern for design-specify consumption, plus detail rows per (concern_id, entry_id) for Clerk re-audit. Summary-only loses Clerk's ability to trace cascade on revision when a single Proposition in a multi-Proposition Concern is revised. Purist's "both" is the minimum sufficient structure.

---

**FINAL POSITION SUMMARY:**

- Constraint Envelope: five fields per entry — concern_id (CE-NNN), entry_id (AX-NNN or PR-NNN), entry_type (AXIOM|PROPOSITION), body (IF/THEN), provenance (DESIGNER|AGENT), status (RATIFIED|REVISED-PENDING). Status per entry row, not moved to Coverage Map.
- Resolution Criterion: concern_id + entry_id (PR-NNN) as joint key, collapse_test (IF NOT/THEN), structural_valid (BOOL Clerk-set). Axiom entries carry no collapse_test row.
- Coverage Map: dual-layer — one summary row per Concern (status: COVERED|AXIOM-ONLY|GAP|REVISED-PENDING) plus detail rows per (concern_id, entry_id) carrying axiom_ids and proposition_ids for Clerk cascade re-audit. Session close blocked on GAP or REVISED-PENDING in summary layer.
