# R2 Procedures — Pragmatist (verbatim)

**File:** `r2-procedures-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R2 of 3 (procedures — refined)
**Macro step:** 3 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R2 PROCEDURES (refined)

**1. Register Concern**
Mutates: Concerns registry — adds CE-NNN row.
Trigger: OPEN, ANCHORED, or DELIBERATING. (Conceded — Conservator + Innovator + Purist all pushed back; late Concern registration is real operational need; GAP row appears in Coverage Map immediately.)
Gate: CE-NNN prefix valid, unique.
State: Coverage Map gains GAP row.

**2. Add Evidence**
Mutates: Evidence registry — adds EV-NNN row.
Trigger: any phase except CLOSED.
Gate: EV-NNN prefix valid, unique.
State: none.

**3. Assert Axiom**
Mutates: Constraint Envelope — adds AX-NNN row (source=AXIOM, provenance=DESIGNER, status=RATIFIED).
Trigger: ANCHORED or DELIBERATING. Gate: CE-NNN exists; body IF/THEN form; Clerk checks new axiom does not directly contradict any RATIFIED PROPOSITION body for same Concern — collision blocks Assert Axiom (Purist push accepted; collision ≠ cascade).
State: OPEN → ANCHORED on first axiom. Cascade scope captured synchronously for existing downstream rows.

**4. Initiate Deliberation**
Mutates: session state only.
Trigger: ANCHORED, designer explicit signal.
Gate: at least one anchored Concern exists.
State: ANCHORED → DELIBERATING. (Adopted — Innovator correct; explicit procedure names the designer's authority over phase advance.)

**5. Propose Proposition**
Mutates: Constraint Envelope — adds PR-NNN row (source=PROPOSITION, provenance=AGENT, status=REVISED-PENDING).
Trigger: DELIBERATING only.
Gate: CE-NNN anchored; all EV-NNN in grounding exist and not in Clerk's deferred-cascade scope for this round; body IF/THEN form; collapse_test IF NOT/THEN form; Clerk checks body does not directly contradict any DESIGNER axiom on same Concern — collision blocks submission.
State: none until Lint Batch.

**6. Signal Round End**
Mutates: nothing — triggers Lint Batch.
Trigger: DELIBERATING, designer explicit.
Gate: none.
State: fires Lint Batch; DELIBERATING → RATIFYING on lint pass.

**7. Lint Batch**
Mutates: structural_valid flags; FK checks; deferred cascade (REVISED-PENDING on in-scope rows); Coverage Map recomputed.
Trigger: round-close (via Signal Round End) OR re-ratification request. Behavioral difference: round-close variant fires deferred cascade mutations; re-ratification variant does not (no new cascade scope has been captured since last lint).
Gate: Clerk executes unconditionally on trigger.
State: pass → RATIFYING opens. Failure → flagged rows returned, stays DELIBERATING.

**8. Ratify Row**
Mutates: row status → RATIFIED (ACCEPT) or REVISED-PENDING (REJECT). On ACCEPT: Resolution Criterion row created (concern_id, entry_id=PR-NNN, collapse_test, structural_valid=TRUE). (Confirmed — RC row created here, not at Propose Proposition.)
Trigger: RATIFYING, per-row, designer explicit.
Gate: structural_valid = TRUE.
State: after full batch disposition — session-close gate checked. Pass → CLOSED. Fail → DELIBERATING.

**9. Re-Ratify Row**
Mutates: REVISED-PENDING row → RATIFIED after Clerk re-lint.
Trigger: RATIFYING, row in REVISED-PENDING.
Gate: Clerk re-lint (round-close variant) sets structural_valid=TRUE; designer explicit accept.
State: contributes to session-close gate evaluation.

**10. Revise Row**
Mutates: body, collapse_test, or grounding on existing row → status REVISED-PENDING immediately. Cascade scope captured synchronously.
Trigger: DELIBERATING or RATIFYING. DESIGNER may revise AXIOM rows; AGENT may revise only rows with matching provenance=AGENT.
Gate: entry_id exists; new field values pass form check.
State: deferred cascade mutation fires at next Lint Batch.

**11. Withdraw Entry**
Mutates: removes entry_id permanently. Full immediate cascade (scope + mutation). Coverage Map recomputed.
Trigger: any phase except CLOSED, designer only.
Gate: entry_id exists.
State: GAP rows produced block session close.

**12. Signal Close**
Mutates: nothing — triggers gate check.
Trigger: RATIFYING, designer explicit after all rows dispositioned.
Gate: three Clerk-computed conditions.
State: RATIFYING → CLOSED on pass.
