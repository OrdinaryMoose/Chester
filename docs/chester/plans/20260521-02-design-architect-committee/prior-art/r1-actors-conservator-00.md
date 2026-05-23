# R1 Actors — Conservator (verbatim)

**File:** `r1-actors-conservator-00.md`
**Pole:** Conservator
**Round:** R1 of 3 (actors)
**Macro step:** 4 of 4 (actors)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R1 ACTORS

---

**PROCEDURE-TO-ACTOR MAPPING**

| Procedure | Actor |
|---|---|
| Add Concern | DESIGNER |
| Add Evidence | DESIGNER or RESEARCHER |
| Add Axiom | DESIGNER only (provenance = DESIGNER enforced) |
| Initiate Deliberation | DESIGNER only |
| Propose Proposition | POLE (any of four) |
| Submit Round | TEAM-LEAD (dispatches round-end signal on designer authorization) |
| Lint Batch | CLERK (automatic on Submit Round or Re-Ratify Row) |
| Ratify Row | DESIGNER only (both ACCEPT and REJECT) |
| Re-Ratify Row | DESIGNER only (after Clerk re-lint completes) |
| Revise Row | DESIGNER (AXIOM rows); POLE (own PROPOSITION rows, DELIBERATING only) |
| Withdraw Entry | DESIGNER only |
| Close Session | DESIGNER + CLERK (designer signals, Clerk computes gate) |

---

**CLERK ROLE DESIGN — HYBRID**

Clerk is a hybrid: deterministic script for all FK checks, prefix enforcement, structural form validation (IF/THEN, IF NOT/THEN), Coverage Map recomputation, cascade scope traversal, and status mutations. LLM agent layer for axiom-collision detection only — structural negation match between Proposition body and AXIOM body requires semantic judgment a regex cannot reliably provide. The LLM Clerk layer does NOT propose, revise, withdraw, or ratify — it judges one binary question per Propose Proposition call: does this body contradict this axiom? Output: PASS or BLOCK with flagged term pairs. No synthesis, no narrative. Lens 9 (agents do not check their own work) satisfied: Clerk validates pole output, not its own.

---

**POLE DEPLOYMENT**

All four poles propose against all anchored Concerns each round. No Concern-to-pole specialization. Specialization reduces cross-pole tension; cross-pole tension is the load-bearing property of the four-pole structure — Conservator and Purist arguing the same Concern from different lenses is the design deliberation. Pole abstention permitted per locked process (empty slot = abstention for that round only).

---

**TEAM-LEAD ROLE SURFACE**

Team-lead dispatches rounds (signals which Concerns are open for the round), coordinates pole submission order, issues Submit Round signal on designer authorization, and produces the session-close artifact set (three deliverables extracted from Clerk working record). Team-lead does not deliberate, does not propose Propositions, does not ratify. Team-lead is a coordination and extraction role, not a design role.

---

**RESEARCHER ROLE SURFACE**

Researcher supplies Evidence on demand — called by any pole or designer to locate codebase grounding, prior design artifacts, or external references. Researcher calls Add Evidence. Researcher does not propose Propositions, does not ratify, does not call Lint Batch. Researcher is consultable at any phase except CLOSED.

---

**DESIGNER SURFACE PER PHASE**

- OPEN: Add Concern, Add Evidence (optional pre-session).
- ANCHORED: Add Axiom (one or more Concerns), Initiate Deliberation when ready.
- DELIBERATING: Add Concern (late), Add Axiom (late), Revise Row (AXIOM rows only), Withdraw Entry (any row). Does NOT propose. Does NOT issue Submit Round directly — authorizes team-lead to signal.
- RATIFYING: Ratify Row (per-row ACCEPT/REJECT), Re-Ratify Row (REVISED-PENDING rows), Revise Row (AXIOM rows only), Withdraw Entry, Close Session.
- Designer reads Clerk-produced ratification surface, gate report, and Coverage Map. Designer does not compute any of these. Structural/semantic split: Clerk presents structural surface; designer judges semantic content.
