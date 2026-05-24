# R1 Deliverables — Pragmatist (verbatim)

**File:** `r1-deliverables-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R1 of 3 (deliverables)
**Macro step:** 1 of 4 (backwards order)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R1 DELIVERABLES

---

**1. CONSTRAINT ENVELOPE**

Purpose: declares what the design must hold true before implementation begins.

Required content fields:
- Concern ID (reference anchor)
- Axiom rows: designer-asserted, labeled AXIOM, one per known-true fact
- Ratified body: IF/THEN architectural claim, one per Concern

Read-out shape: flat list — Concern ID, then its axioms, then its ratified body. Consumer reads top-to-bottom; each row is a hold-true claim. No nesting.

Minimum viable form: one ratified body per Concern. Axiom rows are optional (present when designer had pre-deliberation clarity). A Concern with no axioms and one ratified body is a valid envelope entry.

Pragmatist note: do NOT add status fields, authoring metadata, or round provenance to this artifact. Consumer needs hold-true claims, not audit trail. Audit trail is the design brief document's job.

---

**2. RESOLUTION CRITERION**

Purpose: states the falsifiable condition under which each Concern's commitment fails.

Required content fields:
- Concern ID (reference anchor)
- Collapse test: IF NOT/THEN contrapositive of the ratified body

Read-out shape: one row per Concern — Concern ID plus its collapse test. Consumer reads this as a test battery: for each Concern, here is how you know the design failed.

Minimum viable form: one collapse test per Concern, derived directly from the ratified body. No separate authoring step — collapse test is a required field on the same Proposition that carries the body. No body without a collapse test; no collapse test without a body.

Pragmatist note: do NOT make resolution criterion a separate document. It is a column projection of the same Proposition record. Keeping it as a projection prevents document-sync drift under revision. Clerk extracts it; designer does not maintain it separately.

---

**3. COVERAGE MAP**

Purpose: confirms every Concern is addressed and traces which entries address it.

Required content fields:
- Concern ID
- Axiom count (integer — how many axiom rows cover this Concern)
- Proposition IDs (list of ratified Proposition IDs that address this Concern)
- Evidence IDs (list of Evidence IDs cited by those Propositions)
- Status: COVERED / GAP

Read-out shape: one row per Concern. COVERED = axiom count > 0 OR at least one ratified Proposition present. GAP = zero axioms, zero ratified Propositions. Consumer sees gaps immediately; no cross-referencing required.

Minimum viable form: COVERED/GAP status per Concern plus the Evidence IDs. If consumer only needs to know "is this addressed and by what evidence," that is sufficient. Proposition ID list is load-bearing for Clerk re-audit on revision; it stays.

Pragmatist note: Status is the only field that tempts "signaling completeness" over load-bearing content. It stays because Clerk cannot project COVERED/GAP without computing it, and consumer cannot read coverage without it. Not cut.

---

WORD COUNT: ~390
