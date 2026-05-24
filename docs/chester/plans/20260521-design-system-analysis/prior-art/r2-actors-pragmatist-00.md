# R2 Actors — Pragmatist (verbatim)

**File:** `r2-actors-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R2 of 3 (actors — refined)
**Macro step:** 4 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R2 ACTORS (refined)

---

**PROCEDURE-TO-ACTOR MAPPING**

Designer: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation, Submit Round, Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows only), Withdraw Entry, Close Session.
Pole (any of 4): Propose Proposition, Revise Row (own PROPOSITION rows in DELIBERATING only).
Clerk: Lint Batch (triggered). All cascade, FK, structural_valid, coverage, axiom-collision operations as side effects.
Team-lead: round dispatch (non-artifact signal to poles). No procedure calls.
Researcher: Add Evidence only.

No delegation of any designer procedure to team-lead. Initiate Deliberation is designer-only — no delegation path exists in locked procedures.

---

**CLERK ROLE DESIGN — D3**

Deterministic script. Held from R1. Principle confirmed by all four poles: if a Clerk operation cannot be fully specified as a deterministic rule, the spec is incomplete — complete the spec, do not substitute LLM judgment.

---

**POLE DEPLOYMENT**

All four poles, all Concerns, no specialization. One PR-NNN per pole per Concern per round maximum — Clerk enforces using per-round submission index in working record, keyed by (pole-identity, concern_id, round-number).

---

**TEAM-LEAD SURFACE**

Round dispatch only — signals which Concerns are open for each round (non-artifact, non-procedure). No consolidation role.

Refinement: team-lead consolidation dropped (Innovator + Conservator push accepted). Clerk's Close Session produces the three deliverables directly from working record — they are already formatted artifacts at that point. Team-lead consolidating the same data is redundant overlap. Clerk output is the session-close artifact set; team-lead has nothing to add that is not already Clerk's mechanical output.

---

**RESEARCHER SURFACE**

Add Evidence only. Consultable at any phase except CLOSED. Not a round attendee — "attendance" is not a concept in the locked procedures.

---

**DESIGNER SURFACE PER PHASE**

OPEN: Add Concern, Add Evidence.
ANCHORED: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation.
DELIBERATING: Add Concern (late), Add Evidence, Add Axiom (late), Revise Row (AXIOM rows), Withdraw Entry, Submit Round.
RATIFYING: Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows), Withdraw Entry, Close Session.
CLOSED: no operations.

---

WORD COUNT: ~370
