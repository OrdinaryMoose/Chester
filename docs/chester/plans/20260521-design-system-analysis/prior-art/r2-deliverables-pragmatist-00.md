# R2 Deliverables — Pragmatist (verbatim)

**File:** `r2-deliverables-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R2 of 3 (deliverables — refined)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R2 DELIVERABLES (refined)

---

**1. CONSTRAINT ENVELOPE**

Purpose: declares what the design must hold true — ratified commitments the implementation phase inherits as invariants.

Required fields:
- concern_id: CE-NNN (FK anchor, Clerk-enforced prefix)
- source: ENUM { AXIOM | PROPOSITION }
- body: IF/THEN architectural claim
- status: ENUM { RATIFIED | REVISED-PENDING }

Read-out: flat list ordered by concern_id. Consumer reads RATIFIED rows only. REVISED-PENDING rows are visible but marked — design-specify blocks on any REVISED-PENDING row at session close.

MVP: one RATIFIED row per Concern (source AXIOM or PROPOSITION). Any REVISED-PENDING row blocks consumption.

Refinements from DM:
- Status reinstated (Conservator + Innovator + Purist all pushed back on my R1 cut). Accepted. REVISED-PENDING is operational state, not audit trail — my R1 cut was wrong.
- Provenance (designer | pole_id) rejected. Consumer needs claim + state, not author. Clerk re-audit uses source enum, not pole attribution. Innovator's cascade argument does not require pole identity.

---

**2. RESOLUTION CRITERION**

Purpose: states falsifiable failure condition per Concern — how design-specify tests each commitment.

Required fields:
- concern_id: CE-NNN (shared FK, consistent with envelope)
- collapse_test: IF NOT/THEN contrapositive (structural form enforced)
- structural_valid: bool (Clerk-set at lint)

Read-out: one row per Concern with a non-axiom ratified Proposition. Axiom-only Concerns carry no collapse_test row — designer-asserted ground truth has no failure condition by construction.

MVP: one collapse_test row per deliberated Concern. Axiom-covered-only Concerns explicitly absent.

Refinements from DM:
- structural_valid bool adopted (Innovator + Conservator convergence). Separates Clerk mechanical check from designer semantic gate.
- concern_id as FK adopted (Purist push on Conservator's Proposition-ID-keyed variant — all three artifacts must share same join key).

---

**3. COVERAGE MAP**

Purpose: proves every Concern addressed; surfaces gaps before session close.

Required fields:
- concern_id: CE-NNN
- axiom_ids: list of AX-NNN (empty if none)
- proposition_ids: list of PR-NNN ratified for this Concern (empty if none)
- evidence_ids: list of EV-NNN grounding the Propositions
- status: ENUM { COVERED | AXIOM-ONLY | GAP }

Read-out: one rolled-up row per Concern. GAP blocks session close. AXIOM-ONLY flags for designer inspection — signals deliberated Concern covered only by designer assertion with no pole-argued Proposition.

MVP: one row per Concern. COVERED requires at least one PR-NNN. AXIOM-ONLY requires at least one AX-NNN and zero PR-NNN. GAP is zero of both.

Refinements from DM:
- AXIOM-ONLY split from COVERED (Purist + Innovator push accepted). My R1 boolean collapsed two distinct coverage modes. Regression scenario (Proposition revised, only axiom remains) now detectable — COVERED drops to AXIOM-ONLY automatically.
- axiom_ids list replaces axiom_count (Innovator push accepted — count insufficient for Clerk re-audit on axiom revision).

---

WORD COUNT: ~395
