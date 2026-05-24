# R1 DM — Purist (verbatim)

**File:** `r1-dm-purist-00.md`
**Pole:** Purist (critique of other three R1 proposals)
**Round:** R1 DM (deliverables)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R1 DM CROSS-POLE CRITIQUE

---

CONSERVATOR: Right — REVISED-PENDING status on the Constraint Envelope is the only proposal that handles the cascade-invalidation regression with a typed terminal state rather than ignoring it. Wrong — Resolution Criterion keys on Proposition ID, not concern_id. That breaks the shared join key. Design-specify can't cross-reference without an additional lookup. Push-back: why split the FK? All three artifacts join on concern_id; making Resolution Criterion the only artifact that breaks that pattern introduces a seam.

INNOVATOR: Right — structural_valid bool on Resolution Criterion is the only proposal that surfaces Clerk's contrapositive-match check as a typed field rather than a process step. That makes the lint gate machine-readable, not just procedural. Wrong — coverage_status ENUM includes axiom-only as a named status. That is a category violation: axiom-only IS a coverage mode, not a gap variant. Axiom-only should be COVERED with source=AXIOM, not a third status value. Push-back: if axiom-only is a distinct status, what does design-specify do differently with it versus COMPLETE? If the answer is "flag for inspection," that is a process rule, not a status.

PRAGMATIST: Right — collapse_test as a required field on the same Proposition record that carries the body prevents document-sync drift. Tightest structural coupling of any proposal. Wrong — Status field COVERED computed as "axiom count > 0 OR at least one ratified Proposition" collapses two distinct source types into one boolean. Loses the ability to audit axiom-only coverage versus proposition-backed coverage at session close. Push-back: if revision invalidates a Proposition and the only remaining coverage is an axiom, COVERED still reads true — Clerk cannot detect the regression without source breakdown.
