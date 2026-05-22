# R1 Deliverables — Innovator (verbatim)

**File:** `r1-deliverables-innovator-00.md`
**Pole:** Innovator
**Round:** R1 of 3 (deliverables)
**Macro step:** 1 of 4 (backwards order)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R1 — DELIVERABLE SHAPES

---

## 1. CONSTRAINT ENVELOPE

Purpose: The complete set of architectural commitments the design must hold true, drawn from designer-asserted axioms plus ratified Proposition bodies.

Required fields per entry:
- concern_id (FK to Concerns registry)
- entry_type: ENUM {axiom | proposition}
- body: IF/THEN architectural-altitude claim
- provenance: ENUM {designer | pole_id}
- ratified: bool

Read-out shape: flat list ordered by concern_id, axiom entries first, proposition entries after. design-specify reads it as a bounded constraint set — no narrative, no reasoning, just the locked claims.

Minimum viable form: one entry per ratified axiom or Proposition body. A single-Concern session with one designer axiom and one ratified Proposition produces a valid two-row envelope.

---

## 2. RESOLUTION CRITERION

Purpose: The explicit failure condition for each ratified commitment — machine-inspectable statement of what done-wrong looks like.

Required fields per entry:
- concern_id (FK)
- proposition_id (FK to constraint envelope entry)
- collapse_test: IF NOT/THEN contrapositive, structurally enforced (body's consequent negated → antecedent negated)
- structural_valid: bool (Clerk-set: syntactic contrapositive match confirmed)

Read-out shape: parallel list to constraint envelope, one row per proposition-type entry. design-specify reads collapse_test fields as falsifiability conditions for each commitment.

Minimum viable form: one collapse_test per ratified Proposition. Axioms are treated as designer-certified true — no collapse_test required. A session with one ratified Proposition yields a single-row resolution criterion.

---

## 3. COVERAGE MAP

Purpose: Per-Concern accounting of what has been addressed, by what entries, grounded by what Evidence.

Required fields per row:
- concern_id (FK)
- axiom_ids: list (may be empty)
- proposition_ids: list (must be non-empty for row to be ratified-complete)
- evidence_ids: list of Evidence IDs grounding the propositions (existence-checked)
- coverage_status: ENUM {complete | gap | axiom-only}

Read-out shape: one row per Concern. design-specify reads coverage_status to confirm full coverage before consuming the other two artifacts. Gap rows block consumption.

Minimum viable form: one row per Concern, coverage_status field set. A Concern covered by axiom alone is valid (axiom-only status) but flagged for designer inspection.

---

STRUCTURAL NOTE (Innovator): All three artifacts share concern_id as the join key. Machine-checkable cross-artifact consistency: every concern_id in the coverage map must appear in the constraint envelope; every proposition_id in the coverage map must have a matching collapse_test in the resolution criterion. These two joins are the minimum integrity checks Clerk must run at session close.
