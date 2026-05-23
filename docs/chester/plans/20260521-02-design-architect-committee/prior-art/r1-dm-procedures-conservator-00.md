# R1 DM Procedures — Conservator (verbatim)

**File:** `r1-dm-procedures-conservator-00.md`
**Pole:** Conservator (critique of other three R1 procedure proposals)
**Round:** R1 DM (procedures)
**Macro step:** 3 of 4 (procedures)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R1 DM PROCEDURES CRITIQUE

**Innovator.** Right: Initiate Deliberation as an explicit procedure is correct — ANCHORED→DELIBERATING requires a named designer signal, and without a procedure it becomes an implicit transition that operators cannot identify or invoke deliberately. The procedure makes the designer's authority over phase advance visible. Wrong: Reject Row triggers RATIFYING→DELIBERATING after full batch disposition — this is too coarse. Per the locked process, per-row rejection sets only the rejected row to REVISED-PENDING; phase regression to DELIBERATING happens only when the session-close gate fails after all rows are dispositioned, not as a direct consequence of any single rejection. Push: Revise Row allows AGENT to revise "own PROPOSITION rows" — who enforces ownership? No actor identity check is specified. Without that gate, any agent can revise any other agent's Proposition.

**Pragmatist.** Right: Recompute Coverage as derived side effect of other procedures, not a standalone operation — Clerk executes it unconditionally after any Coverage-affecting mutation; naming it as a separate callable procedure implies it can be invoked independently, which creates redundancy and timing confusion. Wrong: Register Concern blocked to OPEN/ANCHORED phases only — locked deliverables and process both permit new Concerns mid-session in DELIBERATING (Coverage Map gains a GAP row automatically on new Concern registration; this is explicitly useful when a Concern surfaces during deliberation). Push: axiom-collision check completely absent from all four proposals. When a pole submits a Proposition whose body contradicts a designer-asserted axiom on the same Concern, Clerk must detect and flag this at Propose Proposition gate or Lint Batch — without this check, the two-player asymmetric authority is violated at the argument surface.

**Purist.** Right: Unified Ratify Row with disposition parameter is cleaner than split Accept/Reject procedures — the operation is one designer act with two outcomes; splitting it implies different preconditions or different callers, which is false. Wrong: status=OPEN on submitted Propositions introduces a fourth status value not defined in locked deliverables — locked spec defines only RATIFIED and REVISED-PENDING. Pending-ratification rows should enter at REVISED-PENDING, consistent with the three-pole position. Push: Add Concern mutates the Constraint Envelope rather than a Concerns registry — this conflates two distinct data structures. The Concern statement and the Constraint Envelope rows are separate; adding a Concern registers the CE-NNN identity, it does not create a Constraint Envelope row.
