# R2 Procedures — Innovator (verbatim)

**File:** `r2-procedures-innovator-00.md`
**Pole:** Innovator
**Round:** R2 of 3 (procedures — refined)
**Macro step:** 3 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R2 — PROCEDURES REFINED

DM changes applied:
- Recompute Coverage: CONCEDE (Conservator + Pragmatist + Purist; correct — no independent trigger, no caller, side effect only; removed)
- Ratify Row split: CONCEDE to unified with disposition parameter (3 poles; same trigger, same phase, same gate — outcome is a parameter not a procedure boundary)
- Resolution Criterion row at Propose Proposition: CONCEDE (Pragmatist; deliverable must not hold structural_valid=FALSE rows; move creation to Ratify Row at ACCEPT disposition)
- Reject Row phase-transition postcondition: CONCEDE altitude mismatch (Purist; phase transition belongs in process spec; removed from procedure state field)
- Revise Row actor-identity: restrict AGENT revision to DELIBERATING phase only, not RATIFYING (Conservator push + Purist round-violation question resolved together; pole cannot revise in RATIFYING — round is closed)
- Cascade-affected-scope gate: named precisely (Purist push)
- Axiom-collision check: added to Lint Batch as new gate (all four poles flagged gap)

---

ADD CONCERN
- Mutates: Concerns registry — appends CE-NNN row. Coverage Map gains GAP row automatically (side effect).
- Trigger: OPEN, ANCHORED, or DELIBERATING.
- Gates: CE-NNN prefix; uniqueness check.
- State: none.

ADD EVIDENCE
- Mutates: Evidence registry — appends EV-NNN row.
- Trigger: any phase except CLOSED.
- Gates: EV-NNN prefix; uniqueness check.
- State: none.

ADD AXIOM
- Mutates: Constraint Envelope — appends AX-NNN row (source=AXIOM, provenance=DESIGNER, status=RATIFIED). Clerk captures cascade scope synchronously if RATIFIED PROPOSITION rows exist for that Concern.
- Trigger: OPEN, ANCHORED, or DELIBERATING. DESIGNER only.
- Gates: CE-NNN must exist; body IF/THEN form; provenance=DESIGNER enforced — AGENT cannot call.
- State: OPEN → ANCHORED on first axiom. No transition if already ANCHORED or DELIBERATING.

INITIATE DELIBERATION
- Mutates: session state only.
- Trigger: ANCHORED. Designer explicit signal.
- Gates: at least one anchored Concern exists (at least one CE-NNN has an AX-NNN row).
- State: ANCHORED → DELIBERATING.

PROPOSE PROPOSITION
- Mutates: Constraint Envelope — appends PR-NNN row (source=PROPOSITION, provenance=AGENT, status=REVISED-PENDING).
- Trigger: DELIBERATING only. AGENT only.
- Gates: CE-NNN must exist and have at least one AX-NNN row (anchored); all grounding EV-NNN must exist in Evidence registry; no grounding EV-NNN may be in Clerk's cascade-invalidated set (Clerk-observable condition: entry_id appears in working-record cascade-scope index with no subsequent clearing event); body IF/THEN form; collapse_test IF NOT/THEN form.
- State: row enters pending state for next Lint Batch.

SUBMIT ROUND
- Mutates: nothing directly — triggers Lint Batch.
- Trigger: DELIBERATING. Designer explicit signal only.
- Gates: none.
- State: fires Lint Batch → DELIBERATING → RATIFYING on lint pass.

LINT BATCH
- Mutates: sets structural_valid TRUE/FALSE per pending PR-NNN row; applies deferred cascade (flips cascade-scoped rows to REVISED-PENDING); recomputes Coverage Map (side effect); NEW: axiom-collision check — for each pending PR-NNN body on Concern X, Clerk scans all AX-NNN rows for Concern X and flags any PR-NNN whose body directly contradicts an axiom body (same subject, opposing consequent at IF/THEN parse level); flagged rows set structural_valid=FALSE with rejection reason AXIOM_COLLISION.
- Trigger: on SUBMIT ROUND.
- Gates: Clerk executes unconditionally. Blocking — lint failure surfaces flagged rows; session stays DELIBERATING.
- State: all structural_valid=TRUE and no AXIOM_COLLISION → RATIFYING opens. Else stays DELIBERATING.

RATIFY ROW
- Disposition parameter: ACCEPT | REJECT.
- Mutates (ACCEPT): Constraint Envelope row status → RATIFIED. Resolution Criterion — appends matching row (concern_id, entry_id=PR-NNN, collapse_test, structural_valid=TRUE).
- Mutates (REJECT): Constraint Envelope row status → REVISED-PENDING. Clerk records rejection reason.
- Trigger: RATIFYING. Per-row designer disposition.
- Gates: structural_valid must be TRUE; designer explicit signal per row.
- State: none per row. After full batch disposition: session-close gate evaluated by Clerk (side effect).

REVISE ROW
- Mutates: target row body/collapse_test/grounding → status REVISED-PENDING immediately. Clerk captures cascade scope synchronously.
- Trigger: DELIBERATING (DESIGNER for AXIOM rows; AGENT for own PROPOSITION rows — ownership enforced by Clerk matching provenance=AGENT and entry_id to the submitting agent's session identity in working record). RATIFYING: DESIGNER only (AGENT revision in RATIFYING prohibited — round closed).
- Gates: entry_id must exist; revised fields must pass form checks.
- State: cascade mutation deferred to next Lint Batch.

RE-RATIFY ROW
- Mutates: Constraint Envelope row status → RATIFIED. Resolution Criterion row updated if collapse_test revised.
- Trigger: RATIFYING. Row must be REVISED-PENDING. Designer explicit re-ratification.
- Gates: Clerk re-lint must confirm structural_valid=TRUE first.
- State: contributes to session-close gate evaluation.

WITHDRAW ENTRY
- Mutates: removes entry_id from Constraint Envelope entirely. Full immediate cascade (scope-capture + REVISED-PENDING mutation both synchronous). Coverage Map recomputed immediately.
- Trigger: any phase except CLOSED. DESIGNER only.
- Gates: entry_id must exist; withdrawal irreversible.
- State: GAP produced if Concern loses all coverage — blocks CLOSED.

SIGNAL CLOSE (adopted from Pragmatist — separates designer intent from Clerk gate computation)
- Mutates: nothing — triggers session-close gate check.
- Trigger: RATIFYING. Designer explicit signal after all rows dispositioned.
- Gates: designer signal only.
- State: RATIFYING → CLOSED on gate pass. RATIFYING → DELIBERATING on gate fail.

CLOSE SESSION (Clerk operation, not designer signal)
- Mutates: session state → CLOSED. Deliverables frozen.
- Trigger: session-close gate passes after SIGNAL CLOSE.
- Gates: Clerk-computed three conditions (zero GAP, zero REVISED-PENDING, all PROPOSITION rows have structural_valid=TRUE Resolution Criterion row).
- State: CLOSED. Terminal.
