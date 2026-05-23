# R1 DM — Pragmatist (verbatim)

**File:** `r1-dm-pragmatist-00.md`
**Pole:** Pragmatist (critique of other three R1 proposals)
**Round:** R1 DM (deliverables)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R1 CROSS-POLE CRITIQUE

**Conservator.** Status field on Constraint Envelope (OPEN | RATIFIED | REVISED-PENDING) is right on principle — revision state must be tracked somewhere. Wrong: it's on the wrong artifact. Status is Clerk audit state, not consumer-facing constraint content. Design-specify does not consume REVISED-PENDING rows; it consumes ratified claims only. Push: if status lives on the envelope, what does design-specify do when it encounters a REVISED-PENDING row — block, skip, or error? If no answer, the field is underdetermined.

**Innovator.** structural_valid bool on Resolution Criterion is right — Clerk-set flag separates mechanical check from semantic check, correct placement. Wrong: provenance enum {designer | pole_id} on the Constraint Envelope is overhead. Consumer needs the claim, not who wrote the draft. Pole attribution is audit trail, not constraint content. Push: axiom-only coverage_status enum is a real improvement over my binary COVERED/GAP — but if design-specify treats axiom-only as valid-but-flagged, what is the flag's action obligation? Document-sync risk if "flagged" has no defined resolution path.

**Purist.** FK consistency enforcement (concern_id join across all three artifacts) is the strongest structural contribution in any R1 proposal — load-bearing, Clerk-executable, catches drift automatically. Wrong: round field on Constraint Envelope is audit trail, not constraint content. Same cut as Conservator's status. Push: grounding on Resolution Criterion (Evidence IDs per collapse_test) — is this grounding the collapse_test's own evidence, or re-citing the Proposition's evidence? Ambiguous. If same, redundant. If different, undefined.
