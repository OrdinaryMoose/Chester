# R2 Actors — Innovator (verbatim)

**File:** `r2-actors-innovator-00.md`
**Pole:** Innovator
**Round:** R2 of 3 (actors — refined)
**Macro step:** 4 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R2 — ACTORS REFINED

DM changes applied:
- Researcher working-record query: RESTRICT to read-only Evidence registry queries only; no Clerk working-record access (Pragmatist push)
- Team-lead dispatch: formalized as DISPATCH ROUND — named coordination act, non-artifact signal, team-lead is sole caller, no procedure gate, occurs at start of each DELIBERATING round (Purist push)
- Revise Row in DELIBERATING added to Designer surface (Conservator + Pragmatist both flagged)
- Initiate Deliberation delegation: CONCEDE designer-only, no delegation (Purist self-correction accepted)
- One PR-NNN per pole per Concern per round: Clerk working-record key = (round_number, pole_id, concern_id); all three fields required at submission; Clerk rejects duplicate on matching key (Conservator + Purist both pushed)

---

PROCEDURE-TO-ACTOR MAPPING (refined)

1. Add Concern — DESIGNER only.
2. Add Evidence — DESIGNER or RESEARCHER.
3. Add Axiom — DESIGNER only.
4. Initiate Deliberation — DESIGNER only. No delegation.
5. Propose Proposition — POLE (any of four). One PR-NNN per (round_number, pole_id, concern_id) tuple; Clerk enforces at submission gate using working-record submission index.
6. Submit Round — DESIGNER only.
7. Lint Batch — CLERK only. Automatic trigger.
8. Ratify Row — DESIGNER only.
9. Re-Ratify Row — DESIGNER only.
10. Revise Row — DESIGNER (AXIOM rows, any phase); POLE (own PROPOSITION rows, DELIBERATING only).
11. Withdraw Entry — DESIGNER only.
12. Close Session — DESIGNER signal; CLERK gate computation.
DISPATCH ROUND (coordination, not a locked procedure) — TEAM-LEAD only. Signals round-open to poles; names which Concerns are open for the round. Non-artifact; no Clerk gate; no status mutation. Informal but named.

---

CLERK ROLE DESIGN — DETERMINISTIC SCRIPT (D1 locked, 4-pole)

No change from R1. Conservator conceded conditionally on negation-match rule being fully specified. Rule specification: body structural negation match = Clerk parses IF/THEN body into subject-predicate-consequent triple; collision fires when two bodies for same Concern share subject and have logically opposing consequents (negation of consequent term, not synonymic opposition). This is a syntactic parse rule, not semantic judgment. If a body is not parseable to this triple form, it fails the IF/THEN form check at a prior gate and never reaches collision check. No LLM layer required; no edge cases survive to judgment surface.

---

POLE DEPLOYMENT — unchanged. All four poles, all Concerns, no specialization, self-selected abstention.

---

TEAM-LEAD ROLE SURFACE (refined)

DISPATCH ROUND at start of each round. Consolidates three deliverables from Clerk-certified state at session close — Clerk holds working record; team-lead reads ratified Constraint Envelope, Resolution Criterion, and Coverage Map and formats them for designer handoff. Consolidation is read-only extraction, not synthesis or editorial judgment. Team-lead calls no locked procedures.

---

RESEARCHER ROLE SURFACE (refined — Pragmatist push)

Add Evidence only. Researcher may query the Evidence registry (read-only: EV-NNN existence, source, summary) to locate grounding for pole requests. Researcher may NOT query Clerk working-record cascade-scope index, submission index, or status fields — those are Clerk-internal. Evidence registry is a shared readable artifact; working record is Clerk-exclusive.

---

DESIGNER SURFACE PER PHASE (corrected)

- OPEN: Add Concern, Add Evidence.
- ANCHORED: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation.
- DELIBERATING: Add Concern, Add Evidence, Add Axiom (late), Revise Row (AXIOM rows), Withdraw Entry, Submit Round.
- RATIFYING: Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows), Withdraw Entry, Close Session.
- CLOSED: no procedures.
