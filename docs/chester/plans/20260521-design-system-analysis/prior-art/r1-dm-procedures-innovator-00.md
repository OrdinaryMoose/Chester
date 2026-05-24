# R1 DM Procedures — Innovator (verbatim)

**File:** `r1-dm-procedures-innovator-00.md`
**Pole:** Innovator (critique of other three R1 procedure proposals)
**Round:** R1 DM (procedures)
**Macro step:** 3 of 4 (procedures)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R1 DM — PROCEDURES CROSS-POLE CRITIQUE

CONSERVATOR: Right — Ratify Row (Accept) creates the Resolution Criterion row at ratification time, not at Propose Proposition time; this is the correct placement because structural_valid must be TRUE before the row enters the Resolution Criterion, and that confirmation only exists after lint. Wrong: Recompute Coverage as a named procedure is over-specified — it has no preconditions, no gates, and no designer-observable state transition; it is a Clerk side effect that fires inside Lint Batch and Withdraw Entry, not an operation a caller invokes independently. Gap surfaced to all poles: no procedure addresses axiom-collision detection — if an AGENT Propose Proposition submits a body that contradicts a DESIGNER axiom for the same Concern, which gate catches it? Clerk lint checks IF/THEN form and FK existence, not semantic contradiction. This is a missing gate in every R1 proposal including my own.

PRAGMATIST: Right — Signal Close as a distinct procedure is correct; it separates the designer's intent-to-close signal from the Clerk's gate computation, preserving two-player asymmetry at session end. Wrong: Register Concern restricted to OPEN or ANCHORED only — late Concern registration during DELIBERATING is a real operational need when a pole surfaces a gap the designer hadn't named; blocking it forces a session restart. Push: Pragmatist's Lint Batch is "context-parameterized" (round-close vs re-ratification invocation) but the two invocations have different deferred-cascade behavior — round-close fires deferred cascade mutations, re-ratification lint does not. Single procedure with two named contexts needs those behavioral differences explicitly stated, not implied.

PURIST: Right — Propose Proposition initial status as OPEN (not REVISED-PENDING) is cleaner; REVISED-PENDING connotes a prior ratified state that was invalidated, which is semantically wrong for a row that has never been ratified. A distinct PENDING or SUBMITTED status would be cleaner still. Wrong: Submit Round cut entirely as "phase transition signal not artifact mutation" — but Lint Batch must be triggered by something, and that trigger must be a named procedure or the process has an unnamed entry point; cutting Submit Round leaves Lint Batch floating with no named caller. Push: Purist's Revise Row allows pole signal for PROPOSITION rows — but poles submitted the original; if a pole can revise in RATIFYING phase, it gains a second submission opportunity in the same round that was already closed by Submit Round. Does that violate the round structure?
