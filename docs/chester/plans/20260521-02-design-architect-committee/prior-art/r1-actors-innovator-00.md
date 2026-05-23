# R1 Actors — Innovator (verbatim)

**File:** `r1-actors-innovator-00.md`
**Pole:** Innovator
**Round:** R1 of 3 (actors)
**Macro step:** 4 of 4 (actors)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R1 — ACTORS

---

PROCEDURE-TO-ACTOR MAPPING

1. Add Concern — DESIGNER only. No agent may register a Concern; concern framing is designer authority.
2. Add Evidence — DESIGNER or RESEARCHER. Evidence supply is a research function; Researcher adds on designer request or proactively during DELIBERATING.
3. Add Axiom — DESIGNER only. Provenance=DESIGNER enforced at procedure gate; structurally enforced, not policy.
4. Initiate Deliberation — DESIGNER only. Phase advance is designer authority.
5. Propose Proposition — POLE (any of four). Each pole proposes independently per Concern per round. No specialization by Concern — all poles address all Concerns; differentiation comes from pole lens, not Concern assignment.
6. Submit Round — DESIGNER only. Round-close is designer authority; no pole or team-lead may trigger.
7. Lint Batch — CLERK only. Executes unconditionally on Submit Round or Re-Ratify Row. No designer intervention between trigger and lint completion.
8. Ratify Row — DESIGNER only. Per-row disposition is irreducibly designer authority; no delegation.
9. Re-Ratify Row — DESIGNER only. Same authority as Ratify Row; gate is Clerk-cleared first.
10. Revise Row — DESIGNER (AXIOM rows, any phase); AGENT/POLE (own PROPOSITION rows, DELIBERATING only). Ownership enforced by Clerk matching provenance + submission identity in working record.
11. Withdraw Entry — DESIGNER only. Permanent removal is irreversible; designer authority only.
12. Close Session — DESIGNER signal; CLERK gate computation. Designer issues close signal; Clerk computes three-condition gate; transition fires on pass. Two-actor procedure: designer triggers, Clerk certifies.

---

CLERK ROLE DESIGN — D3 POSITION: DETERMINISTIC SCRIPT

Clerk must be a deterministic script, not an LLM agent. Reason: every Clerk operation (structural_valid flag, FK existence check, prefix validation, cascade scope computation, axiom-collision structural negation match, Coverage Map recompute) is mechanically specifiable with no judgment surface. An LLM Clerk introduces non-determinism into the one surface that must be deterministic — the lint gate and the session-close gate. If Clerk output is non-deterministic, the structural/semantic split collapses: designer cannot trust that Clerk-certified rows are structurally valid without re-reading the lint logic, which moves semantic judgment back onto the designer for what should be a mechanical surface. Hybrid (LLM for edge cases) is rejected: if an edge case requires LLM judgment, it is a semantic question that belongs at designer ratification, not a structural question Clerk can answer. The edge case handling belongs upstream (designer disposition) or downstream (ratification), not inside Clerk's mechanical lane.

---

POLE DEPLOYMENT — ALL FOUR POLES, ALL CONCERNS, NO SPECIALIZATION

All four poles address all Concerns every round. Specialization by Concern (e.g., Purist addresses only rigor-surface Concerns) would reduce cross-lens coverage — the value of the four-pole model is that each Concern receives all four lens perspectives. Abstention is permitted per locked process; poles self-select which Concerns they have something to add. No team-lead assignment of poles to Concerns.

---

TEAM-LEAD ROLE SURFACE

Team-lead is a coordination role only — no procedure calls. Team-lead dispatches round-open to poles (non-artifact signal), consolidates session artifacts at close, and presents designer decision packets. Team-lead does not propose, revise, or lint. If team-lead calls any procedure, it is acting as designer proxy — not permitted.

---

RESEARCHER ROLE SURFACE

Researcher calls Add Evidence only. Researcher may also query Clerk working record for Evidence ID existence and cascade-scope status on designer request. No other procedure access. Researcher does not propose Propositions or revise rows.

---

DESIGNER SURFACE AT EACH PHASE

- OPEN: Add Concern, Add Evidence (may delegate to Researcher).
- ANCHORED: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation.
- DELIBERATING: Add Concern, Add Evidence, Add Axiom (late), Revise Row (AXIOM only), Withdraw Entry, Submit Round.
- RATIFYING: Ratify Row, Re-Ratify Row, Revise Row (AXIOM only), Withdraw Entry, Close Session.
- CLOSED: no procedures. Read-only.
