# R1 Procedures — Purist (verbatim)

**File:** `r1-procedures-purist-00.md`
**Pole:** Purist
**Round:** R1 of 3 (procedures)
**Macro step:** 3 of 4 (procedures)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R1 PROCEDURES

Cut from candidate set: Submit Round (phase transition signal, not artifact mutation), Recompute Coverage (Clerk-internal side effect of other procedures, not a standalone op). Merged Ratify Row (Accept) + Ratify Row (Reject) into one procedure with outcome parameter.

---

1. ADD CONCERN
Mutates: Constraint Envelope — inserts new CE-NNN row, status=OPEN, no body yet.
Trigger: OPEN or ANCHORED phase, designer signal.
Gate: CE-NNN uniqueness check (Clerk FK enforcement).
State: Coverage Map gains GAP row for new Concern.

2. ADD EVIDENCE
Mutates: Clerk working record — inserts EV-NNN into Evidence registry.
Trigger: OPEN, ANCHORED, or DELIBERATING, designer or Researcher signal.
Gate: EV-NNN uniqueness check.
State: EV-NNN becomes valid grounding target.

3. ADD AXIOM
Mutates: Constraint Envelope — inserts AX-NNN row with source=AXIOM, provenance=DESIGNER, status=RATIFIED, body populated.
Trigger: ANCHORED or DELIBERATING phase, designer signal.
Gate: CE-NNN must exist; body must be IF/THEN form (Clerk structural check); no CLOSED phase.
State: OPEN → ANCHORED on first axiom. Coverage Map row updated. Late axiom in DELIBERATING valid — same procedure, broader phase range.

4. PROPOSE PROPOSITION
Mutates: Constraint Envelope — inserts PR-NNN row with source=PROPOSITION, provenance=AGENT, status=OPEN, body + collapse_test populated.
Trigger: DELIBERATING phase, pole signal, Concern must be anchored.
Gate: CE-NNN must exist and be anchored; all EV-NNN in grounding must exist in Evidence registry; body IF/THEN form; collapse_test IF NOT/THEN form; structural_valid set by Clerk on submission.
State: Row enters ratification surface for next Lint Batch.

5. LINT BATCH
Mutates: Resolution Criterion — structural_valid flag set per row; Constraint Envelope — cascade scope captured (synchronous step); FK integrity check logged.
Trigger: Designer round-end signal (DELIBERATING → RATIFYING transition).
Gate: Runs before designer sees any rows. Blocking — lint failure surfaces to designer with flagged rows; structural_valid=FALSE rows excluded from ratification surface.
State: RATIFYING phase entered on lint completion.

6. RATIFY ROW
Mutates: Constraint Envelope — row status → RATIFIED (ACCEPT) or REVISED-PENDING (REJECT); Clerk flags rejection reason on REJECT.
Trigger: RATIFYING phase, designer disposition per row, row must have structural_valid=TRUE.
Gate: Designer explicit per-row signal; no auto-accept.
State: After full batch: cascade deferred step fires (REVISED-PENDING flips on dependent rows); Coverage Map recomputed; session-close gate checked.

7. REVISE ROW
Mutates: Constraint Envelope — updates body or collapse_test on any row; status → REVISED-PENDING immediately.
Trigger: Any phase except CLOSED, designer or pole signal (designer for AXIOM rows; pole for PROPOSITION rows).
Gate: Row must exist; new body must pass IF/THEN form; new collapse_test must pass IF NOT/THEN form.
State: Cascade scope captured synchronously; invalidation deferred to next Lint Batch.

8. RE-RATIFY ROW
Mutates: Constraint Envelope — row status REVISED-PENDING → RATIFIED.
Trigger: RATIFYING phase, designer explicit accept, row structural_valid=TRUE after re-lint.
Gate: Clerk re-lint must confirm structural_valid=TRUE; designer explicit accept; row must be REVISED-PENDING.
State: Same as Ratify Row accept outcome.

9. WITHDRAW ENTRY
Mutates: Constraint Envelope — row removed entirely.
Trigger: Any phase except CLOSED, designer signal only.
Gate: entry_id must exist.
State: Full cascade fires immediately (scope + mutation); Coverage Map recomputed; GAP rows produced if Concern loses all coverage.

10. CLOSE SESSION
Mutates: All deliverables — frozen. No further mutations.
Trigger: RATIFYING phase, session-close gate passes (Clerk-computed), designer reads gate result.
Gate: Three conditions all TRUE (zero GAP, zero REVISED-PENDING, every PROPOSITION has structural_valid=TRUE Resolution Criterion row).
State: RATIFYING → CLOSED. Terminal.
