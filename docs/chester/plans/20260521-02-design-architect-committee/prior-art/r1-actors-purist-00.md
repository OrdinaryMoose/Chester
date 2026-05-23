# R1 Actors — Purist (verbatim)

**File:** `r1-actors-purist-00.md`
**Pole:** Purist
**Round:** R1 of 3 (actors)
**Macro step:** 4 of 4 (actors)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R1 ACTORS

---

PROCEDURE-TO-ACTOR MAPPING

1. Add Concern — DESIGNER only.
2. Add Evidence — DESIGNER or RESEARCHER.
3. Add Axiom — DESIGNER only. provenance=DESIGNER enforced; no other role may call.
4. Initiate Deliberation — DESIGNER only.
5. Propose Proposition — POLE only (any of the four). One PR-NNN per anchored Concern per round per pole.
6. Submit Round — DESIGNER only. Round-end authority belongs to designer per locked process.
7. Lint Batch — CLERK only. Fires on Submit Round or Re-Ratify Row trigger; not callable by any other role.
8. Ratify Row — DESIGNER only. Per-row ACCEPT or REJECT. No other role ratifies.
9. Re-Ratify Row — DESIGNER only. After Clerk re-lint confirms structural_valid=TRUE.
10. Revise Row — DESIGNER (AXIOM rows, any phase except CLOSED). POLE (own PROPOSITION rows, DELIBERATING only — ownership enforced by Clerk matching provenance+submission identity).
11. Withdraw Entry — DESIGNER only. Irreversible; authority must be designer-exclusive.
12. Close Session — DESIGNER signal; CLERK computes gate.

---

CLERK ROLE DESIGN — D3 POSITION: DETERMINISTIC SCRIPT.

All Clerk operations are mechanically specifiable: IF/THEN form check, IF NOT/THEN form check, ID-prefix validation, FK existence check, structural negation match for axiom-collision, graph traversal for cascade scope, Coverage Map recomputation. None require LLM judgment. An LLM Clerk would introduce non-determinism and self-validation risk (Lens 9: agents do not check their own work — a Clerk LLM reviewing pole LLM output is an agent checking an agent, not external validation). Deterministic script is the only configuration that makes Clerk's gate unconditional and auditable. Clerk has no deliberative surface, no synthesis, no narrative — pure mechanical gate.

---

POLE DEPLOYMENT — no specialization. All four poles propose against all anchored Concerns. Specialization by Concern type is not load-bearing and introduces coverage gaps if a pole is absent or scoped out. Each pole brings its lens to every Concern; divergence across poles is the signal, not noise. One PR-NNN per pole per Concern per round maximum — Clerk enforces at submission.

---

TEAM-LEAD SURFACE — dispatch only. Calls Initiate Deliberation on designer's behalf if explicitly delegated. Consolidates three deliverables from ratified record set at session close. No deliberative role. No synthesis. No narrative authorship. Team-lead does not propose, ratify, or revise.

---

RESEARCHER SURFACE — Add Evidence only. Supplies EV-NNN rows on request or proactively when pole proposals cite missing evidence. Does not propose, ratify, or deliberate. Evidence registry maintenance is Researcher's only write surface.

---

DESIGNER SURFACE BY PHASE

- OPEN: Add Concern.
- ANCHORED: Add Concern, Add Evidence (delegation), Add Axiom, Initiate Deliberation.
- DELIBERATING: Add Concern, Add Evidence (delegation), Add Axiom, Submit Round, Revise Row (AXIOM rows), Withdraw Entry.
- RATIFYING: Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows), Withdraw Entry, Close Session.
- CLOSED: no procedures available.

Designer never calls Lint Batch, never calls Propose Proposition, never calls Re-Ratify Row on a row that has not cleared Clerk re-lint. Designer's surface is intentionally narrow — authority without mechanism.
