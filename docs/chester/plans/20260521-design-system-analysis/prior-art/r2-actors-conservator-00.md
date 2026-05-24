# R2 Actors — Conservator (verbatim)

**File:** `r2-actors-conservator-00.md`
**Pole:** Conservator
**Round:** R2 of 3 (actors — refined)
**Macro step:** 4 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R2 ACTORS

---

**PROCEDURE-TO-ACTOR MAPPING**

| Procedure | Actor |
|---|---|
| Add Concern | DESIGNER only |
| Add Evidence | DESIGNER or RESEARCHER |
| Add Axiom | DESIGNER only |
| Initiate Deliberation | DESIGNER only (no delegation) |
| Propose Proposition | POLE (any of four) |
| Submit Round | DESIGNER only |
| Lint Batch | CLERK (automatic, not callable) |
| Ratify Row | DESIGNER only |
| Re-Ratify Row | DESIGNER only |
| Revise Row | DESIGNER (AXIOM rows, any phase except CLOSED); POLE (own PROPOSITION rows, DELIBERATING only) |
| Withdraw Entry | DESIGNER only |
| Close Session | DESIGNER signal; CLERK gate computation |

Refinements: Submit Round → DESIGNER direct (concede D2). Initiate Deliberation → DESIGNER only, no delegation.

---

**CLERK ROLE DESIGN — DETERMINISTIC SCRIPT**

Clerk is a deterministic script executing all operations: IF/THEN form check, IF NOT/THEN form check, ID-prefix validation, FK existence, structural negation match for axiom-collision (same-subject opposing-consequent at parse level), transitive cascade scope traversal, Coverage Map recomputation, structural_valid flag assignment, session-close gate evaluation. No LLM layer. No judgment surface. All operations mechanically specifiable from locked procedures.

Refinements: concede D1 fully (4-pole convergence + Purist Lens 9 argument).

Submission identity tracking: Clerk working record carries (round_id, pole_id, concern_id) → PR-NNN index. Second Propose Proposition call on same key rejected at gate. Pole_id is agent session identity at submission.

---

**POLE DEPLOYMENT**

All four poles propose against all anchored Concerns each round. No specialization. Abstention = empty slot for that Concern that round; pole may address it next round.

---

**TEAM-LEAD ROLE SURFACE**

Two named operations:
- **Dispatch Round** (non-artifact coordination signal): team-lead opens each round by naming which Concerns are active for poles. Not a procedure in the locked set — out-of-band coordination act.
- **Extract Deliverables** (at session close): team-lead reads Clerk-certified artifact state after Close Session and formats the three deliverable documents for design-specify handoff. No synthesis, no judgment, no editorial content — mechanical extraction from Clerk-certified rows. This is what team-lead produces that Clerk does not: formatted, consumer-ready deliverable documents.

Team-lead does not propose, revise, ratify, lint, or call any locked procedure.

Refinements: named Dispatch Round explicitly. Distinguished team-lead extraction from Clerk working record.

---

**RESEARCHER ROLE SURFACE**

Calls Add Evidence only. Consultable at any phase except CLOSED. Does not access Clerk's cascade-scope working record — Researcher queries Evidence registry for existence and ID validity only; cascade scope is Clerk-internal state.

---

**DESIGNER SURFACE PER PHASE**

- OPEN: Add Concern, Add Evidence.
- ANCHORED: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation.
- DELIBERATING: Add Concern (late), Add Evidence, Add Axiom (late), Revise Row (AXIOM rows), Withdraw Entry, Submit Round.
- RATIFYING: Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows), Withdraw Entry, Close Session.
- CLOSED: no procedures.

Refinements: added Revise Row (AXIOM rows) to DELIBERATING surface.
