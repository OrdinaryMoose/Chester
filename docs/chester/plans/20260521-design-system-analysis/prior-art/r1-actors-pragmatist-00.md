# R1 Actors — Pragmatist (verbatim)

**File:** `r1-actors-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R1 of 3 (actors)
**Macro step:** 4 of 4 (actors)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R1 ACTORS

---

**PROCEDURE-TO-ACTOR MAPPING**

Designer: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation, Submit Round, Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows only), Withdraw Entry, Close Session.
Pole (any of 4): Propose Proposition, Revise Row (own PROPOSITION rows in DELIBERATING only).
Clerk: Lint Batch (triggered, not caller-initiated). Side-effect executor for Coverage Map recompute, cascade scope capture, structural_valid flags, FK checks, axiom-collision backstop.
Team-lead: dispatches rounds (issues round-open to poles), consolidates artifacts at session close. No procedure calls — coordination role only.
Researcher: Add Evidence only. No other procedure access.

Roles not in locked framing that are not load-bearing: none to cut. All five roles have distinct non-overlapping procedure surfaces.

---

**CLERK ROLE DESIGN — D3 RESOLUTION**

Deterministic script. Clerk executes Lint Batch, cascade scope capture, coverage recompute, FK checks, axiom-collision structural match, structural_valid flags. All Clerk operations have exact specifications in the locked procedures: prefix validity, IF/THEN form check, FK existence, transitive grounding scan, Coverage Map status derivation. None require natural language judgment. LLM agent introduces context-cost and hallucination risk on operations that are purely mechanical — wrong call on tired Tuesday. Script is more reliable, faster, and cheaper. Edge case handling (malformed IDs, partial batches) is specifiable as error returns, not judgment calls.

Pragmatist position: if a Clerk operation cannot be fully specified as a deterministic rule, the spec is incomplete. Complete the spec; do not substitute LLM judgment for a missing rule.

---

**POLE DEPLOYMENT**

All four poles submit on each dispatched Concern — no specialization. One Proposition record per pole per Concern per round. Specialization (assign Concerns to poles by domain) introduces round-management overhead and dispatch complexity that fails on tired Tuesday. Designer sees four independent perspectives per Concern; team-lead consolidates; no coordination tax on poles.

---

**TEAM-LEAD SURFACE**

Two operations: (1) dispatch — opens each round by naming which Concerns poles should address; (2) artifact consolidation at session close — assembles final three deliverables from Clerk-certified state. No procedure calls; no artifact mutations. Team-lead is coordination, not execution.

---

**RESEARCHER SURFACE**

Add Evidence only. Researcher is consultable by any pole or designer for evidence sourcing; issues Add Evidence calls. No deliberation, no ratification, no procedure calls beyond evidence supply. Researcher does not attend rounds unless queried.

---

**DESIGNER SURFACE PER PHASE**

OPEN: Add Concern, Add Evidence.
ANCHORED: Add Axiom, Add Evidence, Add Concern (late).
DELIBERATING: Add Axiom (late), Add Concern (late), Add Evidence, Submit Round, Withdraw Entry. Reviews Clerk collision flags.
RATIFYING: Ratify Row, Re-Ratify Row, Revise Row (AXIOM only), Withdraw Entry, Close Session.
CLOSED: no operations.

---

WORD COUNT: ~395
