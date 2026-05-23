# R1 Procedures — Innovator (verbatim)

**File:** `r1-procedures-innovator-00.md`
**Pole:** Innovator
**Round:** R1 of 3 (procedures)
**Macro step:** 3 of 4 (procedures)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R1 — PROCEDURES

---

ADD CONCERN
- Mutates: Concerns registry — appends CE-NNN row.
- Triggers: OPEN or ANCHORED or DELIBERATING (late Concern registration permitted).
- Gates: CE-NNN prefix enforced; no duplicate concern_id.
- State: no phase transition. Coverage Map gains a GAP row automatically.

ADD EVIDENCE
- Mutates: Evidence registry — appends EV-NNN row.
- Triggers: any phase except CLOSED.
- Gates: EV-NNN prefix enforced; no duplicate entry_id.
- State: none.

ADD AXIOM
- Mutates: Constraint Envelope — appends AX-NNN row (source=AXIOM, provenance=DESIGNER, status=RATIFIED).
- Triggers: OPEN, ANCHORED, or DELIBERATING. Late axiom assertion in DELIBERATING permitted — same procedure, different precondition: Concern must already exist; Clerk immediately runs cascade scope-capture if any RATIFIED PROPOSITION for that Concern exists (axiom added mid-deliberation may constrain existing Propositions; cascade surfaces at next round-close lint).
- Gates: AX-NNN prefix; concern_id must exist in Concerns registry; provenance must be DESIGNER (agent cannot issue Add Axiom).
- State: OPEN → ANCHORED on first axiom addition. No transition if already ANCHORED or DELIBERATING.

INITIATE DELIBERATION
- Mutates: session state only.
- Triggers: ANCHORED; at least one CE-NNN has an axiom row.
- Gates: designer explicit signal; at least one anchored Concern exists.
- State: ANCHORED → DELIBERATING.

PROPOSE PROPOSITION
- Mutates: Constraint Envelope — appends PR-NNN row (source=PROPOSITION, provenance=AGENT, status=REVISED-PENDING pending lint). Resolution Criterion — appends matching collapse_test row with structural_valid=FALSE pending lint.
- Triggers: DELIBERATING only.
- Gates: concern_id must be anchored (has at least one AX-NNN row); all grounding entry_ids must exist in Evidence registry AND not be in Clerk's cascade-affected scope; PR-NNN prefix enforced; body must be IF/THEN form; collapse_test must be IF NOT/THEN form.
- State: none until lint.

SUBMIT ROUND
- Mutates: session state only — signals round-end.
- Triggers: DELIBERATING; designer explicit round-end signal.
- Gates: designer signal only. No coverage precondition required.
- State: fires Clerk LINT BATCH synchronously → DELIBERATING → RATIFYING on lint pass.

LINT BATCH
- Mutates: structural_valid fields on all pending PR-NNN rows; applies deferred cascade (flips in-scope rows to REVISED-PENDING); recomputes Coverage Map.
- Triggers: on SUBMIT ROUND.
- Gates: Clerk operation — no designer gate. Runs atomically.
- State: on lint pass → RATIFYING. On lint failure → rows flagged, batch returned to DELIBERATING.

ACCEPT ROW
- Mutates: Constraint Envelope row status → RATIFIED; Resolution Criterion structural_valid confirmed.
- Triggers: RATIFYING; per-row designer disposition.
- Gates: structural_valid must be TRUE; designer explicit accept.
- State: no phase transition until all rows dispositioned and session-close gate evaluated.

REJECT ROW
- Mutates: Constraint Envelope row status → REVISED-PENDING; Clerk records rejection reason.
- Triggers: RATIFYING; per-row designer disposition.
- Gates: designer explicit reject.
- State: any rejection triggers RATIFYING → DELIBERATING after full batch dispositioned.

REVISE ROW
- Mutates: target row body/collapse_test/grounding field(s); status → REVISED-PENDING immediately; Clerk captures cascade scope synchronously.
- Triggers: DELIBERATING or RATIFYING (designer may revise before or during ratification).
- Gates: entry_id must exist; DESIGNER may revise AXIOM rows; AGENT may revise only own PROPOSITION rows.
- State: none immediately; cascade mutation deferred to next lint.

RE-RATIFY ROW
- Mutates: Constraint Envelope row status → RATIFIED (after Clerk re-lint confirms structural_valid=TRUE).
- Triggers: RATIFYING; row in REVISED-PENDING state.
- Gates: Clerk re-lint must set structural_valid=TRUE first; designer explicit re-ratification.
- State: contributes to session-close gate evaluation.

WITHDRAW ENTRY
- Mutates: removes entry_id from Constraint Envelope entirely. Immediate full cascade (scope-capture + REVISED-PENDING mutation both synchronous — process-locked exception). Coverage Map recomputed immediately.
- Triggers: any phase except CLOSED.
- Gates: DESIGNER only; entry_id must exist; withdrawal irreversible; re-entry requires new entry_id.
- State: if withdrawal produces GAP → blocks CLOSED until addressed.

CLOSE SESSION
- Mutates: session state → CLOSED; deliverables frozen.
- Triggers: RATIFYING; session-close gate clears.
- Gates: Clerk-computed three conditions all TRUE (zero GAP, zero REVISED-PENDING, all PROPOSITION rows have structural_valid=TRUE Resolution Criterion row). Designer reads result, does not compute.
- State: RATIFYING → CLOSED. Terminal.

---

LATE AXIOM OPEN QUESTION RESOLVED: Add Axiom procedure works from DELIBERATING. No separate procedure needed. Precondition differs (Concern must already exist and be in Concerns registry); cascade scope-capture fires synchronously if existing Propositions may be affected; mutation deferred to next round-close lint per locked hybrid timing. Single procedure, phase-conditional behavior.
