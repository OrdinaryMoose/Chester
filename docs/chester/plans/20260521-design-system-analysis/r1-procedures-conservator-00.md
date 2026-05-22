# R1 Procedures — Conservator (verbatim)

**File:** `r1-procedures-conservator-00.md`
**Pole:** Conservator
**Round:** R1 of 3 (procedures)
**Macro step:** 3 of 4 (procedures)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R1 PROCEDURES

---

**Add Concern**
Mutates: Concerns registry — adds CE-NNN row (id, statement).
Trigger: OPEN or ANCHORED or DELIBERATING (new Concerns may surface mid-session).
Gates: CE-NNN prefix enforced; statement field must be non-empty architectural-altitude text.
State: none. Concern enters unanchored state. No deliberation permitted until axiom asserted.

---

**Add Evidence**
Mutates: Evidence registry — adds EV-NNN row (id, summary, source).
Trigger: any phase except CLOSED.
Gates: EV-NNN prefix enforced; summary non-empty.
State: none.

---

**Add Axiom**
Mutates: Constraint Envelope — adds AX-NNN row (concern_id, entry_id, source=AXIOM, body, provenance=DESIGNER, status=RATIFIED).
Trigger: ANCHORED or DELIBERATING (late axiom assertion expands anchored surface; no phase regression).
Gates: CE-NNN must exist; body must conform to IF/THEN architectural-altitude form (Clerk-enforced on submit); provenance locked to DESIGNER — no agent may call this procedure.
State: if previously unanchored Concern now has an axiom → that Concern becomes anchored. Session stays in current phase.

---

**Propose Proposition**
Mutates: Constraint Envelope — adds PR-NNN row (concern_id, entry_id, source=PROPOSITION, body, collapse_test, grounding, provenance=AGENT, status=REVISED-PENDING until ratified).
Trigger: DELIBERATING only.
Gates: CE-NNN must exist and be anchored; body IF/THEN form enforced; collapse_test IF NOT/THEN form enforced; all grounding EV-NNN IDs must exist and not be REVISED-PENDING in Clerk scope; structural_valid set by Clerk after form check.
State: row enters Constraint Envelope at REVISED-PENDING. No cascade. Not ratified until Ratify Row (Accept).

---

**Submit Round**
Mutates: none directly — signals round-end to Clerk.
Trigger: DELIBERATING, designer-only signal.
Gates: none pre-signal. Triggers Lint Batch.
State: initiates DELIBERATING → RATIFYING transition after lint completes.

---

**Lint Batch**
Mutates: sets structural_valid = TRUE/FALSE per row; flags FK failures; surfaces cascade-deferred REVISED-PENDING mutations; recomputes Coverage Map.
Trigger: Submit Round received.
Gates: none — Clerk executes unconditionally on signal.
State: if all structural_valid = TRUE and FK pass → RATIFYING opens. Else: Clerk returns failure report; session stays DELIBERATING.

---

**Ratify Row (Accept)**
Mutates: Constraint Envelope row status → RATIFIED; matching Resolution Criterion row created (concern_id, entry_id=PR-NNN, collapse_test, structural_valid=TRUE).
Trigger: RATIFYING, per-row designer disposition.
Gates: structural_valid must be TRUE; designer signal required — no auto-accept.
State: row → RATIFIED. If all rows disposed and session-close gate clears → CLOSED.

---

**Ratify Row (Reject)**
Mutates: Constraint Envelope row status → REVISED-PENDING; Clerk flags rejection reason.
Trigger: RATIFYING, per-row designer disposition.
Gates: designer signal required.
State: row → REVISED-PENDING. Does not affect peer rows in same batch.

---

**Revise Row**
Mutates: Constraint Envelope row body, collapse_test, or grounding — status flips to REVISED-PENDING immediately; Clerk captures cascade scope synchronously (no status mutation on dependents yet).
Trigger: DELIBERATING or RATIFYING.
Gates: row must exist; structural_valid reset to FALSE pending re-lint.
State: source row → REVISED-PENDING. Cascade dependents flagged in working record; deferred mutation fires at next Lint Batch.

---

**Re-Ratify Row**
Mutates: Constraint Envelope row status → RATIFIED (identical to Ratify Row Accept, applied to REVISED-PENDING row).
Trigger: RATIFYING, per-row designer disposition.
Gates: structural_valid must be TRUE after re-lint; designer signal required.
State: row → RATIFIED.

---

**Withdraw Entry**
Mutates: removes row from Constraint Envelope entirely; full cascade fires immediately (both scope capture and status mutation); Coverage Map recomputed.
Trigger: any phase except CLOSED; designer-only.
Gates: designer signal required; entry_id must exist.
State: entry gone. All grounding-dependent rows → REVISED-PENDING immediately. GAP if Concern now uncovered — blocks session close.

---

**Recompute Coverage**
Mutates: Coverage Map — recalculates status per Concern from current Constraint Envelope state.
Trigger: automatic after Lint Batch, Withdraw Entry, or any full cascade.
Gates: none — Clerk executes unconditionally.
State: Coverage Map rows updated; GAP rows flagged.

---

**Close Session**
Mutates: session state → CLOSED; deliverables frozen.
Trigger: RATIFYING, after session-close gate clears.
Gates: three-condition gate (zero GAP, zero REVISED-PENDING, all structural_valid = TRUE with matching Resolution Criterion rows); Clerk certifies; designer reads result — no designer computation.
State: CLOSED. Terminal. No further mutations.
