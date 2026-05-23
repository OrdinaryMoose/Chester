# R1 DM Procedures — Pragmatist (verbatim)

**File:** `r1-dm-procedures-pragmatist-00.md`
**Pole:** Pragmatist (critique of other three R1 procedure proposals)
**Round:** R1 DM (procedures)
**Macro step:** 3 of 4 (procedures)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R1 DM PROCEDURES CRITIQUE

**Conservator.** Right: Re-Ratify Row as a named procedure distinct from Ratify Row is load-bearing — the gate differs (re-lint required before re-ratification surface opens) and collapsing them into one unified procedure with an outcome parameter obscures that gate difference. Wrong: Recompute Coverage as a named procedure inflates the procedure count; it is a Clerk side-effect that fires inside Lint Batch and Withdraw Entry — naming it separately implies it can be invoked independently, which it cannot without corrupting Coverage Map consistency. Push: late Concern registration permitted in DELIBERATING — if a Concern is registered mid-deliberation, it enters as GAP immediately; are poles permitted to immediately propose against it in the same round, or must it wait for the next round dispatch?

**Innovator.** Right: Initiate Deliberation as a named procedure correctly surfaces the ANCHORED → DELIBERATING transition as a designer-explicit act rather than an implicit side-effect of having axioms — this is the load-bearing gate on the two-player asymmetry; designer must explicitly open deliberation, not just have axioms present. Wrong: Resolution Criterion row creation inside Propose Proposition (appends matching collapse_test row with structural_valid=FALSE pending lint) is premature — Resolution Criterion rows are a deliverable artifact, not a working record; creating them at proposal time with structural_valid=FALSE means the deliverable contains invalid rows until lint runs, which is visible state consumers should never see. Create them at Ratify Row Accept only. Push: axiom-collision check is absent from every proposal. If a pole submits a Proposition body that directly contradicts a designer-asserted axiom for the same Concern, what stops it? Lint Batch checks structural form, not semantic collision. No procedure currently gates this.

**Purist.** Right: unified Ratify Row with outcome parameter is cleaner than split Accept/Reject procedures — same trigger, same phase, same gate; the outcome is a parameter not a separate procedure; Conservator and Innovator's split names two things that are one operation with two branches. Wrong: OPEN as initial status on Propose Proposition creates a third status value not in the locked deliverables spec (RATIFIED | REVISED-PENDING); introducing OPEN adds vocabulary the locked deliverables do not carry and creates a status the Clerk must track separately. Use REVISED-PENDING from submission; that is already the pending-lint meaning. Push: Submit Round cut as "phase transition signal, not artifact mutation" — but Signal Round End triggers Lint Batch which does mutate artifacts; the trigger must be a named procedure so its actor can be assigned in macro step 4. Purist has no procedure for round-end signaling.
