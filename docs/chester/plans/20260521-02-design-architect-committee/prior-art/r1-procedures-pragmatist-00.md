# R1 Procedures — Pragmatist (verbatim)

**File:** `r1-procedures-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R1 of 3 (procedures)
**Macro step:** 3 of 4 (procedures)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R1 PROCEDURES

Cut from candidate list: Recompute Coverage — derived from every mutation that changes Constraint Envelope rows; not a separate procedure. Close Session renamed to Signal Close — the operation is a designer signal; gate computation is Clerk work inside Lint Batch. Lint Batch split into two invocations (round-close and re-ratification) but is one procedure — context-parameterized.

---

**1. Register Concern**
Mutates: adds CE-NNN row to Concerns registry.
Trigger: OPEN or ANCHORED phase, before deliberation opens.
Gate: CE-NNN prefix valid, unique.
State: none — registry addition only.

**2. Add Evidence**
Mutates: adds EV-NNN to Evidence registry.
Trigger: any phase except CLOSED.
Gate: EV-NNN prefix valid, unique.
State: none.

**3. Assert Axiom**
Mutates: adds AX-NNN row to Constraint Envelope (source=AXIOM, provenance=DESIGNER, status=RATIFIED).
Trigger: ANCHORED phase primarily. Also permitted in DELIBERATING — late axiom permitted for any Concern not yet addressed by a ratified Proposition. Gate: CE-NNN exists; AX-NNN prefix valid; body is IF/THEN form. Cascade scope synchronously captured for all existing downstream AGENT rows on that Concern.
State: OPEN → ANCHORED on first axiom. Later assertions in DELIBERATING do not change phase.

Late axiom answer: Assert Axiom is one procedure, phase-permissive. Unanchored-Concern constraint enforced at Propose Proposition gate, not at Assert Axiom. Designer may assert axioms mid-session freely.

**4. Propose Proposition**
Mutates: adds PR-NNN row to Constraint Envelope (source=PROPOSITION, provenance=AGENT, status=REVISED-PENDING pending lint).
Trigger: DELIBERATING only.
Gate: CE-NNN exists and has at least one axiom; each EV-NNN in grounding exists and is not withdrawn; body is IF/THEN form; collapse_test is IF NOT/THEN form.
State: none — row pending until Lint Batch runs.

**5. Revise Row**
Mutates: changes body, collapse_test, or grounding on any existing row (RATIFIED or REVISED-PENDING).
Trigger: DELIBERATING or RATIFYING.
Gate: entry_id exists; revised fields valid form.
State: row → REVISED-PENDING immediately. Cascade scope captured synchronously.

**6. Withdraw Entry**
Mutates: removes entry_id row from Constraint Envelope permanently.
Trigger: any phase except CLOSED.
Gate: entry_id exists.
State: full immediate cascade — all downstream rows → REVISED-PENDING, Coverage Map recomputed, GAP rows surfaced.

**7. Signal Round End**
Mutates: nothing directly — triggers Lint Batch.
Trigger: DELIBERATING only, designer explicit.
Gate: none.
State: DELIBERATING → RATIFYING pending lint completion.

**8. Lint Batch**
Mutates: sets structural_valid flags, FK checks, cascade deferred mutations (REVISED-PENDING on in-scope rows), Coverage Map recomputed.
Trigger: round-end signal or re-ratification request.
Gate: internal — blocks RATIFYING entry if any structural failure.
State: on pass → RATIFYING opens. On failure → rejection list presented, session stays DELIBERATING.

**9. Ratify Row**
Mutates: single row status → RATIFIED (accept) or → REVISED-PENDING (reject).
Trigger: RATIFYING phase, per-row.
Gate: structural_valid = TRUE; designer explicit act per row.
State: after all rows dispositioned — gate check fires. Gate clears → CLOSED. Gate fails → DELIBERATING.

**10. Signal Close**
Mutates: nothing — triggers gate check.
Trigger: RATIFYING, after all rows dispositioned.
Gate: three session-close conditions (Clerk-computed).
State: RATIFYING → CLOSED on pass.

---
WORD COUNT: ~400
