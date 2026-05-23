# R3 Procedures Final — Innovator (verbatim)

**File:** `r3-procedures-innovator-00.md`
**Pole:** Innovator
**Round:** R3 of 3 (procedures — final positions)
**Macro step:** 3 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R3 — PROCEDURES FINAL POSITIONS

DIVERGENCE 1: HOLD — Re-Ratify Row separate procedure. Gate is structurally different: re-lint must complete and confirm structural_valid=TRUE before the re-ratification surface opens; Ratify Row's gate requires only that structural_valid already be TRUE on a row that has never been ratified. Collapsing them requires the unified procedure to carry two different pre-gate sequences, which is more complex than two named procedures with distinct preconditions.

DIVERGENCE 2: CONCEDE — Single Close Session with gate inside (3-pole majority). SIGNAL CLOSE adds a procedure that only triggers another procedure with no independent artifact mutation or designer-observable state between them; the separation is real in concept but zero-cost to collapse — Close Session with "designer signals, Clerk computes gate, transition fires on pass" is one operation with two sub-steps, not two procedures.

DIVERGENCE 3: CONCEDE to Purist — Add Axiom does not block; flags conflicting PROPOSITION rows REVISED-PENDING immediately. Reason: blocking Add Axiom at the designer gate inverts the two-player asymmetry — designer-asserted axioms are ground truth and cannot be held hostage by prior agent-submitted Propositions. Immediate cascade-flag on conflicting Propositions is the correct response: axiom wins, prior Propositions that contradict it become REVISED-PENDING for designer re-evaluation.

DIVERGENCE 4: CONCEDE to synchronous block at Propose Proposition gate (Conservator + Pragmatist majority). Reason: catching AXIOM_COLLISION at Lint Batch means a pole has already committed a contradictory Proposition to the working record; catching it at the Propose Proposition gate prevents the invalid row from entering at all, which is structurally cleaner and costs Clerk nothing extra (same axiom-scan, earlier execution point).

DIVERGENCE 5: HOLD explicit — poles may NOT propose against a newly-registered Concern in the same round. Reason: a Concern registered mid-round has no axioms yet; Propose Proposition gate already requires at least one AX-NNN row (anchored); unanchored Concerns fail that gate regardless. This is not a new restriction — it falls out of existing anchoring gate. No separate rule needed; the anchoring gate covers it.

FINAL POSITION SUMMARY:
- Re-Ratify Row: separate procedure, held (distinct pre-gate sequence from Ratify Row).
- Close Session: single procedure, conceded (SIGNAL CLOSE adds no independent state).
- Add Axiom axiom-collision: Purist position adopted (no block; immediate cascade-flag on conflicting Propositions).
- Propose Proposition axiom-collision: synchronous block at gate, conceded (prevents invalid row entering working record).
- Same-round propose against new Concern: held as non-issue — anchoring gate already blocks it; no new rule required.
