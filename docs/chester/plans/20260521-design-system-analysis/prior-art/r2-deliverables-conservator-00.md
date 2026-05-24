# R2 Deliverables — Conservator (verbatim)

**File:** `r2-deliverables-conservator-00.md`
**Pole:** Conservator
**Round:** R2 of 3 (deliverables — refined)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R2 DELIVERABLES

---

### 1. CONSTRAINT ENVELOPE

Required fields per entry:
- concern_id: CE-NNN (typed prefix, Clerk-enforced FK to Concerns registry)
- entry_type: ENUM { AXIOM | PROPOSITION }
- body: IF/THEN architectural-altitude claim
- provenance: ENUM { DESIGNER | AGENT }
- entry_id: AX-NNN or PR-NNN (typed prefix per entry_type)

Read-out: flat list ordered by concern_id, AXIOM rows first. Design-specify reads ratified rows only. No prose.

MVP: one AXIOM row OR one PROPOSITION row per Concern, provenance set, entry_id assigned.

**Refinements from DM:**
- Adopted typed ID prefixes (Purist). Channeling instrument; strongest FK anchor.
- Dropped status field. Pragmatist right: REVISED-PENDING is Clerk audit state, not consumer content. Design-specify has no defined action on it. Moved to Coverage Map where Clerk owns it.
- Adopted DESIGNER|AGENT binary provenance (replaced pole_id per my own R1 DM critique of Innovator).
- Axiom rows carry AX-NNN ID (Innovator: count insufficient for cascade re-audit — IDs required).

---

### 2. RESOLUTION CRITERION

Required fields per entry:
- concern_id: CE-NNN (shared join key — Purist correct, keying on Proposition ID breaks cross-artifact FK)
- entry_id: PR-NNN (back-ref to Constraint Envelope Proposition row)
- collapse_test: IF NOT [body claim] THEN [named consequence] (structural form enforced)
- structural_valid: BOOL (Clerk-set — contrapositive syntactic match confirmed)

Read-out: one row per PROPOSITION entry in Constraint Envelope. Axiom rows carry no collapse_test — designer-certified ground truth, no failure condition. Design-specify reads collapse_test + structural_valid.

MVP: one row per ratified Proposition. structural_valid must be TRUE before session close.

**Refinements:**
- Re-keyed on concern_id (Purist pushback accepted — breaks join if keyed on PR-NNN alone).
- Adopted structural_valid bool (Innovator — separates Clerk mechanical check from semantic gate).
- Collapse_test co-located on Proposition record (Pragmatist — prevents document-sync drift).
- Rejected Purist grounding field on Resolution Criterion: Evidence IDs already on Proposition in Constraint Envelope; adding here is redundant without clear definition of "different evidence."

---

### 3. COVERAGE MAP

Required fields per row:
- concern_id: CE-NNN
- axiom_ids: list of AX-NNN (empty permitted; Innovator: IDs not count — required for cascade re-audit)
- proposition_ids: list of PR-NNN
- status: ENUM { COVERED | AXIOM-ONLY | GAP | REVISED-PENDING }

Read-out: one summary row per Concern. Clerk certifies before session close. GAP or REVISED-PENDING blocks session close.

MVP: every Concern has one row, status set. COVERED = at least one ratified Proposition present. AXIOM-ONLY = axioms present, zero ratified Propositions. GAP = neither.

**Refinements:**
- Added AXIOM-ONLY as distinct status (Innovator pushback accepted — silently passing axiom-only as COVERED masks under-addressed deliberated Concerns; Purist agreed).
- Added REVISED-PENDING (moved from Constraint Envelope — Pragmatist right that it belongs on Clerk audit artifact, not consumer artifact; this is that artifact).
- Rejected Pragmatist's "status is on wrong artifact" critique of REVISED-PENDING: Coverage Map is Clerk-produced and designer-reviewed; correct home for operational state.
