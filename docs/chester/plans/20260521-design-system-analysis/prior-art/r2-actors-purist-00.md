# R2 Actors — Purist (verbatim)

**File:** `r2-actors-purist-00.md`
**Pole:** Purist
**Round:** R2 of 3 (actors — refined)
**Macro step:** 4 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R2 ACTORS (refined)

CONCESSIONS FROM R1:
- Initiate Deliberation delegation dropped (Innovator + Pragmatist right; designer-only).
- Add Concern added to Designer ANCHORED surface (Innovator right).
- Submission-identity key named (Conservator + Pragmatist right): Clerk working record carries per-round submission index keyed on (pole_id, concern_id, round_number). Clerk enforces one PR-NNN per key at Propose Proposition gate.
- Researcher "attendance" framing dropped; Researcher is consultable at any phase except CLOSED.

REJECTED:
- Conservator delegation argument for Initiate Deliberation: team-lead calling a designer-authority procedure is a role-boundary violation regardless of authorization.

---

PROCEDURE-TO-ACTOR MAPPING

1. Add Concern — DESIGNER only.
2. Add Evidence — DESIGNER or RESEARCHER.
3. Add Axiom — DESIGNER only. Provenance=DESIGNER structurally enforced.
4. Initiate Deliberation — DESIGNER only. No delegation.
5. Propose Proposition — POLE only (any of four). Clerk enforces one PR-NNN per (pole_id, concern_id, round_number).
6. Submit Round — DESIGNER only.
7. Lint Batch — CLERK only. Triggered by Submit Round or Re-Ratify Row; no caller access.
8. Ratify Row — DESIGNER only.
9. Re-Ratify Row — DESIGNER only. After Clerk re-lint clears structural_valid=TRUE.
10. Revise Row — DESIGNER (AXIOM rows, any phase except CLOSED); POLE (own PROPOSITION rows, DELIBERATING only; ownership = provenance+submission identity in Clerk working record).
11. Withdraw Entry — DESIGNER only.
12. Close Session — DESIGNER signal; CLERK gate computation.

---

CLERK ROLE DESIGN — DETERMINISTIC SCRIPT (D3 FINAL).

All Clerk operations fully specifiable. No operation requires LLM judgment. LLM Clerk violates Lens 9 (agent checking agent output) and introduces non-determinism into the one surface that must be unconditional. Deterministic script is the only configuration that makes the lint gate auditable.

---

POLE DEPLOYMENT — all four poles, all anchored Concerns, no specialization. Submission-index (pole_id, concern_id, round_number) enforced by Clerk. Abstention = empty slot for that round only.

---

TEAM-LEAD SURFACE — round dispatch (non-artifact signal to poles naming open Concerns) and session-close artifact formatting (reads Clerk-certified working record, produces three output documents). No procedure calls. No synthesis. Formatting is mechanical extraction, not editorial. Clerk certifies; team-lead formats.

---

RESEARCHER SURFACE — Add Evidence only. Consultable at any phase except CLOSED. No procedure access beyond evidence supply. Researcher does not deliberate, propose, or ratify.

---

DESIGNER SURFACE BY PHASE

- OPEN: Add Concern, Add Evidence.
- ANCHORED: Add Concern, Add Axiom, Add Evidence, Initiate Deliberation.
- DELIBERATING: Add Concern, Add Axiom (late), Add Evidence, Submit Round, Revise Row (AXIOM only), Withdraw Entry.
- RATIFYING: Ratify Row, Re-Ratify Row, Revise Row (AXIOM only), Withdraw Entry, Close Session.
- CLOSED: no procedures.
