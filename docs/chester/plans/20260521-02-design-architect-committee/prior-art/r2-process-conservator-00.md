# R2 Process — Conservator (verbatim)

**File:** `r2-process-conservator-00.md`
**Pole:** Conservator
**Round:** R2 of 3 (process — refined)
**Macro step:** 2 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R2 PROCESS

---

**SESSION PHASES**

Five named states: OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED. OPEN: Concerns registered, no axioms asserted — no deliberation permitted. ANCHORED: designer has asserted at least one axiom; deliberation may begin on anchored Concerns only; unanchored Concerns remain blocked. DELIBERATING: poles submit Proposition records per round. RATIFYING: round closed, Clerk lint complete, designer reviews and dispositions the batch. CLOSED: session-close gate clears.

Refinements: adopted ANCHORED as distinct phase (Innovator + Purist — OPEN doing two jobs; Elicitron failure mode closed by making axiom-assertion a gate, not a concurrent activity).

---

**ROUND STRUCTURE**

A round is one complete DELIBERATING → RATIFYING cycle. Round ends on explicit designer round-close signal only — no automatic trigger on coverage condition. Each round produces a delta to the Constraint Envelope; Coverage Map recomputes at round close.

Refinement: removed automatic round-close trigger (Pragmatist + Purist — two-player asymmetry violation; system cannot advance on designer's behalf).

---

**RATIFICATION FLOW**

Clerk lint completes before ratification surface opens; structural_valid must be TRUE for every row presented. Designer dispositions each row: ACCEPT (row → RATIFIED) or REJECT (row → REVISED-PENDING). Accepted rows in the same batch are not affected by peer rejections. Gate: no partial-ratified rows may accumulate across rounds without designer disposition.

Refinements: per-row reject outcome now named — REVISED-PENDING, not removal (Purist). Regression scope clarified: only rejected rows enter REVISED-PENDING; accepted rows in the same batch stay RATIFIED (Pragmatist — full-batch regression discards valid work for one bad row, too coarse; rejected Purist full-batch-reject on this ground).

---

**REVISION HANDLING**

Any change to a RATIFIED row's body or collapse_test triggers status → REVISED-PENDING immediately. REVISED-PENDING clears only on explicit designer re-ratification after Clerk re-lint confirms structural_valid = TRUE. No auto-clear.

---

**CASCADE HANDLING**

Cascade trigger: any row enters REVISED-PENDING or is withdrawn. Scope: transitive — Clerk marks all Constraint Envelope rows whose grounding (direct or chained) cites the revised or withdrawn entry_id as REVISED-PENDING, repeating until no new rows are flagged. Cascade fires synchronously on the trigger event; submitted Propositions that become ungrounded mid-round are caught by Clerk at round-close lint, not mid-round.

Refinements: concede one-hop bound (Innovator + Purist — silent integrity failures at hop 2+ are real). Synchronous trigger preserved but Proposition-invalidation surface deferred to round-close lint (Purist concern about submitted-but-invalid mid-round state resolved by separating trigger from lint surface).

---

**WITHDRAWAL HANDLING**

Withdrawal is permanent removal. Withdrawn entry exits the Constraint Envelope; Coverage Map recomputes immediately. All rows with grounding citing the withdrawn entry_id enter REVISED-PENDING via cascade. GAP produced by withdrawal blocks session close and forces new deliberation. Withdrawal is irreversible — re-entry requires new entry_id.

---

**SESSION-CLOSE GATE**

Three conditions, all required: (1) zero GAP rows in Coverage Map. (2) zero REVISED-PENDING rows in Constraint Envelope. (3) every PROPOSITION row has exactly one matching Resolution Criterion row with structural_valid = TRUE. Clerk computes and certifies; designer reads result. Any failed condition blocks CLOSED transition.
