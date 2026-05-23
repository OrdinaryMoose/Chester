# R2 Procedures — Purist (verbatim)

**File:** `r2-procedures-purist-00.md`
**Pole:** Purist
**Round:** R2 of 3 (procedures — refined)
**Macro step:** 3 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R2 PROCEDURES (refined)

CONCESSIONS FROM R1:
- status=OPEN dropped (Conservator + Pragmatist right; REVISED-PENDING is the only pre-ratification status in locked deliverables).
- Add Concern target corrected (Conservator right; CE-NNN registers in Concerns registry, not Constraint Envelope — separate data structures).
- Submit Round reintroduced as named procedure (Innovator + Pragmatist right; Lint Batch needs a named caller for actor assignment in macro step 4).
- Revise Row in RATIFYING restricted: pole revision blocked in RATIFYING (Innovator right — second submission after round close violates round structure). Designer revision of AXIOM rows permitted in any phase except CLOSED.
- Axiom-collision check added (4-pole gap): two-point check — ADD AXIOM gate catches new axiom contradicting any ratified PROPOSITION for same Concern; LINT BATCH catches new PROPOSITION body contradicting any designer-asserted AXIOM for same Concern.

REJECTED:
- Re-Ratify Row as separate procedure (Pragmatist): re-ratification is Ratify Row applied to a REVISED-PENDING row; gate difference (Clerk re-lint required) is a precondition, not a different operation. Preconditions belong in the procedure spec; they do not create a new procedure.

---

1. ADD CONCERN
Mutates: Concerns registry — inserts CE-NNN identity row.
Trigger: OPEN, ANCHORED, or DELIBERATING. Not CLOSED.
Gate: CE-NNN prefix; uniqueness check.
State: Coverage Map gains GAP row immediately.

2. ADD EVIDENCE
Mutates: Evidence registry — inserts EV-NNN.
Trigger: any phase except CLOSED.
Gate: EV-NNN prefix; uniqueness check.
State: EV-NNN becomes valid grounding target.

3. INITIATE DELIBERATION
Mutates: session state only.
Trigger: ANCHORED; designer explicit signal.
Gate: at least one anchored Concern exists (at least one AX-NNN row in Constraint Envelope).
State: ANCHORED → DELIBERATING.

4. ADD AXIOM
Mutates: Constraint Envelope — inserts AX-NNN row (source=AXIOM, provenance=DESIGNER, status=RATIFIED, body).
Trigger: ANCHORED or DELIBERATING; designer signal only.
Gate: CE-NNN exists in Concerns registry; body IF/THEN form (Clerk-enforced); axiom-collision check — Clerk scans existing RATIFIED PROPOSITION rows for same Concern for body contradiction; conflicting Propositions flagged REVISED-PENDING immediately.
State: OPEN → ANCHORED on first axiom. Late axiom in DELIBERATING: same procedure, no phase change.

5. PROPOSE PROPOSITION
Mutates: Constraint Envelope — inserts PR-NNN row (source=PROPOSITION, provenance=AGENT, status=REVISED-PENDING, body, collapse_test, grounding).
Trigger: DELIBERATING only; pole signal.
Gate: CE-NNN exists and is anchored; all EV-NNN in grounding exist in Evidence registry and are not withdrawn; body IF/THEN form; collapse_test IF NOT/THEN form; entry_id not in Clerk's synchronous cascade scope.
State: row pending lint.

6. SUBMIT ROUND
Mutates: session state — signals round-end to Clerk.
Trigger: DELIBERATING; designer explicit signal.
Gate: none pre-signal.
State: fires Lint Batch → DELIBERATING → RATIFYING on lint pass.

7. LINT BATCH
Mutates: structural_valid flags on pending rows; deferred cascade mutations (REVISED-PENDING on in-scope dependent rows); Coverage Map recomputed; axiom-collision check on all pending PROPOSITION bodies against designer axioms for same Concern — flagged rows excluded from ratification surface.
Trigger: Submit Round received.
Gate: Clerk operation; blocks RATIFYING on any failure.
State: RATIFYING on pass; failure report to designer on fail; session stays DELIBERATING.

8. RATIFY ROW
Mutates: Constraint Envelope row status → RATIFIED (ACCEPT) or REVISED-PENDING (REJECT); Clerk flags rejection reason on REJECT; Resolution Criterion row created on ACCEPT.
Trigger: RATIFYING; per-row designer disposition; row must have structural_valid=TRUE.
Precondition for REVISED-PENDING rows: Clerk re-lint must confirm structural_valid=TRUE before row appears on ratification surface.
Gate: designer explicit per-row signal; no auto-accept.
State: after all rows dispositioned — Coverage Map recomputed; session-close gate checked; RATIFYING → CLOSED on pass or RATIFYING → DELIBERATING on fail.

9. REVISE ROW
Mutates: Constraint Envelope row body, collapse_test, or grounding; status → REVISED-PENDING immediately; Clerk captures cascade scope synchronously.
Trigger: DELIBERATING (pole signal for PROPOSITION rows); any phase except CLOSED (designer signal for AXIOM rows only).
Gate: row must exist; revised fields must pass form checks; structural_valid reset to FALSE.
State: deferred cascade mutation fires at next Lint Batch.

10. WITHDRAW ENTRY
Mutates: Constraint Envelope row removed permanently.
Trigger: any phase except CLOSED; designer signal only.
Gate: entry_id must exist; withdrawal irreversible.
State: full immediate cascade (scope + mutation); Coverage Map recomputed; GAP rows produced if Concern loses all coverage.

11. SIGNAL CLOSE
Mutates: nothing — triggers session-close gate check.
Trigger: RATIFYING; designer explicit signal after all rows dispositioned.
Gate: Clerk-computed three conditions (zero GAP, zero REVISED-PENDING, every PROPOSITION has structural_valid=TRUE Resolution Criterion row).
State: RATIFYING → CLOSED on pass; session stays RATIFYING on fail with gate failure report.
