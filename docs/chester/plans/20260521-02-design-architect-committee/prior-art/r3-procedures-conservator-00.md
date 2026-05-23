# R3 Procedures Final — Conservator (verbatim)

**File:** `r3-procedures-conservator-00.md`
**Pole:** Conservator
**Round:** R3 of 3 (procedures — final positions)
**Macro step:** 3 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R3 PROCEDURES FINAL POSITIONS

**DIVERGENCE 1: HOLD** — Re-Ratify Row gate (Clerk re-lint required before surface opens) is structurally distinct from Ratify Row gate (lint already ran at Submit Round); collapsing into one procedure with a precondition obscures that difference for macro step 4 actor assignment. Gate asymmetry is load-bearing.

**DIVERGENCE 2: HOLD** — Single Close Session procedure. Close fires when Clerk-computed gate clears — no meaningful designer signal precedes it distinct from reading the gate result. Innovator's split would invent a designer act that is just "read the output"; that is not a procedure, it is ratification of Clerk computation. Two-player asymmetry does not require a procedure for every designer read.

**DIVERGENCE 3: CONCEDE to Purist** — Blocking Add Axiom on axiom-collision gives agent-authored Propositions veto power over designer axiom assertion; that inverts two-player asymmetry. Purist's approach is correct: allow Add Axiom, immediately flag conflicting RATIFIED PROPOSITION rows REVISED-PENDING via cascade. Designer authority over axioms is unconditional; conflict surfaces as cascade consequence, not as a gate the agent content can block.

**DIVERGENCE 4: HOLD** — Axiom-collision check at Propose Proposition gate (synchronous block) prevents the invalid row from entering the Constraint Envelope at all. Lint Batch catch still catches it but allows a structural violation to sit in the artifact between submission and lint. Fail-fast at the gate is cleaner enforcement; deliverable artifact should never contain a row that violates axiom authority even transiently.

**DIVERGENCE 5: HOLD** — Same-round propose block against mid-DELIBERATING Concern is load-bearing for deliberation fairness: poles that submitted before the new Concern was registered cannot retroactively address it; poles that submit after have an uneven surface. Must wait next dispatch.

---

**FINAL POSITION SUMMARY:**

- Re-Ratify Row: separate procedure; gate difference (pre-lint requirement) justifies separation for actor assignment clarity.
- Close Session: single procedure; no distinct designer-signal step precedes Clerk gate computation.
- Add Axiom collision: concede to Purist — flag conflicting Propositions REVISED-PENDING immediately; do not block axiom addition.
- Propose Proposition collision: hold synchronous gate block — axiom-violating Proposition body rejected at submission, not deferred to lint.
- Late Concern registration: new Concern in DELIBERATING blocks same-round proposals; poles must wait next dispatch.
