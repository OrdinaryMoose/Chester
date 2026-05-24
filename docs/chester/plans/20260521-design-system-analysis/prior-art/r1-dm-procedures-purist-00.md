# R1 DM Procedures — Purist (verbatim)

**File:** `r1-dm-procedures-purist-00.md`
**Pole:** Purist (critique of other three R1 procedure proposals)
**Round:** R1 DM (procedures)
**Macro step:** 3 of 4 (procedures)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R1 DM PROCEDURES CRITIQUE

---

CONSERVATOR: Right — Propose Proposition entering at status=REVISED-PENDING is correct; OPEN is not a defined status in the locked deliverables, and an unratified row cannot be RATIFIED by default. Purist concedes this in R2. Wrong — Recompute Coverage as a named procedure implies it can be called independently; it cannot — it has no valid standalone trigger and no caller other than Lint Batch, Withdraw Entry, or Ratify Row side effects. Named procedures must have a triggering condition; "automatic after X" is a side effect specification, not a procedure. Push-back: axiom-collision check — designer asserts axiom, Clerk must detect if any existing RATIFIED or REVISED-PENDING PROPOSITION body contradicts the new axiom. No pole including Conservator specifies this gate. If Clerk does not enforce it, the schema admits contradictory ratified claims.

INNOVATOR: Right — Initiate Deliberation as an explicit procedure correctly captures the ANCHORED → DELIBERATING transition as a designer-visible operation rather than an implicit phase drift. Transition procedures are procedures. Wrong — Reject Row triggering RATIFYING → DELIBERATING "after full batch dispositioned" is a phase transition, not a row-level procedure postcondition. That transition belongs in the process spec, not embedded in a procedure's state field — mixing altitude. Push-back: Propose Proposition gate blocks submission against Concerns in Clerk's cascade-affected scope mid-round. Correct instinct, but "cascade-affected scope" is Clerk working-record state, not a named artifact field. What is the Clerk-observable gate condition? Name it precisely or it cannot be enforced.

PRAGMATIST: Right — Signal Close as a distinct procedure naming the designer's close-intent act is cleaner than embedding it inside Lint Batch or Close Session; separates designer signal from Clerk gate computation. Wrong — Register Concern blocks after ANCHORED phase ("before deliberation opens") but late Concern registration should be permitted in DELIBERATING — new Concerns surface during deliberation routinely. Conservator and Innovator both allow it; Pragmatist alone restricts it. Push-back: axiom-collision check gap applies here too — Assert Axiom says cascade scope captured for existing downstream AGENT rows, but does not specify Clerk rejecting a new axiom that directly contradicts a ratified Proposition. Cascade and collision are two different checks.
