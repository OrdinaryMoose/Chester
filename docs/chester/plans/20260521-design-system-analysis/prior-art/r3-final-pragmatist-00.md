# R3 Final Positions — Pragmatist (verbatim)

**File:** `r3-final-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R3 of 3 (deliverables — final positions)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R3 FINAL POSITIONS

DIVERGENCE 1: HOLD — status belongs on the Constraint Envelope row because REVISED-PENDING must block design-specify consumption at the row level, not require a Coverage Map lookup to discover; moving it to Coverage Map forces a cross-artifact join at the point where a consumer needs a single-artifact answer.

DIVERGENCE 2: CONCEDE — Innovator's argument is correct at the operational level: Clerk needs provenance at read time to distinguish axiom-collision (designer-vs-agent) from cascade-flag scope (agent-authored rows only); without it, Clerk must re-read session history to reconstruct what it already has. Drop the pole_id specificity; accept DESIGNER | AGENT binary (Conservator's repair). Not audit trail when Clerk consumes it mechanically on every round.

DIVERGENCE 3: HOLD — rolled-up summary row per Concern is the consumer shape; detail is Clerk-internal. Purist's "both" proposal produces the right answer but names the wrong owner: Clerk maintains the detail index, emits only the summary row to the artifact. Innovator's detail-only row forces design-specify to aggregate — that is Clerk's job, not the consumer's. Summary row in the artifact, detail in Clerk's working state, not in the deliverable.

FINAL POSITION SUMMARY:
- Constraint Envelope: four fields — concern_id, source, body, status (RATIFIED | REVISED-PENDING). Status on the row, not deferred to Coverage Map. Provenance added as DESIGNER | AGENT binary (concession from R2).
- Resolution Criterion: three fields — concern_id, collapse_test, structural_valid bool. Concern_id as shared FK. Axiom-only Concerns carry no row — no failure condition on designer-asserted ground truth.
- Coverage Map: one rolled-up summary row per Concern — concern_id, axiom_ids list, proposition_ids list, evidence_ids list, status (COVERED | AXIOM-ONLY | GAP). Detail joins are Clerk-internal state, not deliverable content.
