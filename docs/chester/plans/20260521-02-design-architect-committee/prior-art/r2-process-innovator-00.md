# R2 Process — Innovator (verbatim)

**File:** `r2-process-innovator-00.md`
**Pole:** Innovator
**Round:** R2 of 3 (process — refined)
**Macro step:** 2 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R2 — PROCESS REFINED

DM changes applied:
- CLERK-AUDIT dropped as phase (Conservator + Pragmatist + Purist all pushed; three poles correct — Clerk lint has no designer-observable duration; folded to RATIFYING entry gate)
- Cascade scope "broader" now defined precisely (Conservator + Pragmatist pushed)
- Partial-round abstention resolved (Purist pushed)
- Pre-ratification axiom-revision cascade scope resolved (Pragmatist pushed)
Rejected: Purist push to defer cascade to round close — synchronous cascade prevents poles submitting Propositions in same round that ground on a mid-round-invalidated entry; deferral creates silent integrity window Clerk cannot close at lint without knowing which Propositions were submitted before vs after the cascade event.

---

SESSION PHASES — four named states:

OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED (back-edge: RATIFYING → DELIBERATING on batch reject)

- OPEN: Concerns registered, zero axioms asserted.
- ANCHORED: Designer has asserted at least one axiom for at least one Concern. Entry condition for DELIBERATING — no Concern may receive Proposition submissions until its axiom row exists. ANCHORED is a phase, not a sub-condition of OPEN, because it gates what operations are valid on which Concerns. (Rejected Purist "sub-condition" framing: ANCHORED vs OPEN have different valid-operation sets — merging them means OPEN must carry a per-Concern axiom-presence check, which is a phase condition named differently.)
- DELIBERATING: Poles submit Proposition records; multiple rounds possible.
- RATIFYING: Entry gate = Clerk lint pass complete (all structural_valid flags set, FK checks pass). Designer reviews Clerk-audited batch, ratifies or rejects. Transition to CLOSED when session-close gate clears; back to DELIBERATING on full-batch reject.
- CLOSED: Terminal. Deliverables frozen.

---

ROUND STRUCTURE — round advances on explicit designer signal only. No automatic trigger. Partial rounds permitted; pole abstention means that pole submits zero Propositions for that round — abstaining pole may NOT re-address same Concern in same round, only in next round. (Purist push resolved: abstention closes pole's slot for that round, not for the session.)

---

RATIFICATION FLOW — Clerk lint completes → designer reads batch → full-batch accept or full-batch reject with Clerk-flagged failure rows. Per-row accept conceded to Conservator push in R1 DM but reversed here: partial-batch accept creates mixed ratified/pending state within one round that Clerk must track as a separate state class; full-batch reject is simpler and the cost (discarding valid rows) is recoverable in one additional round. Designer re-submits non-failing rows in next round.

---

REVISION HANDLING — unchanged from R1. REVISED-PENDING clears only on explicit designer re-ratification after Clerk re-lint.

---

CASCADE HANDLING — cascade triggers synchronously on: (1) RATIFIED PROPOSITION revised, (2) RATIFIED AXIOM revised or withdrawn. Cascade scope defined precisely (Conservator + Pragmatist pushed): DESIGNER axiom revision = all PROPOSITION rows for that Concern (not session-wide; scoped to the Concern whose axiom changed). AGENT Proposition revision = only rows whose grounding list contains the revised entry_id directly. Transitive: both cascade types follow citation chains until no new REVISED-PENDING rows are flagged. Pre-ratification edge case (Pragmatist push): if a pole proposes an axiom revision in a Proposition body before designer ratifies, that Proposition is rejected at Clerk lint as a structural violation — axiom mutation is DESIGNER-provenance only; agent cannot revise axioms via Proposition body.

---

WITHDRAWAL HANDLING — unchanged from R1. Withdrawn entry removed entirely; Coverage Map recomputed; ungrounded Propositions → REVISED-PENDING; GAP blocks close.

---

SESSION-CLOSE GATE — unchanged from R1. Four conditions all hold simultaneously: zero GAP, zero REVISED-PENDING, all PROPOSITION rows have structural_valid=TRUE Resolution Criterion row, all FK checks pass.
