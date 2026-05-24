# R1 Process — Innovator (verbatim)

**File:** `r1-process-innovator-00.md`
**Pole:** Innovator
**Round:** R1 of 3 (process)
**Macro step:** 2 of 4 (process)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R1 — PROCESS

---

SESSION PHASES (named states, linear with one back-edge)

OPEN → ANCHORED → DELIBERATING → CLERK-AUDIT → RATIFYING → CLOSED (terminal) | REVISED (back-edge to DELIBERATING)

- OPEN: Concerns registered, no axioms asserted, no Propositions submitted.
- ANCHORED: Designer has asserted axioms for at least one Concern. Deliberation may begin on anchored Concerns only.
- DELIBERATING: Poles submit Proposition records per round. Phase repeats per round until designer calls ratification.
- CLERK-AUDIT: Round closes; Clerk runs integrity checks before designer sees the record. Transition is automatic at round-close signal.
- RATIFYING: Designer reviews Clerk-audited record, accepts or rejects rows, asserts re-ratification on REVISED-PENDING rows. Transition to CLOSED if all Concerns covered; transition to DELIBERATING if gaps remain or revision opened.
- CLOSED: All Concerns COVERED or AXIOM-ONLY; zero REVISED-PENDING rows; cross-artifact FK checks pass. Terminal state.

---

ROUND STRUCTURE

Session contains one or more rounds. A round is the unit of deliberation: poles submit, Clerk audits, designer ratifies. Round advances when designer issues ratification signal — not on timer, not on pole-count. Partial rounds (designer stops before all poles submit) are permitted; unsubmitted pole slots are treated as abstentions for that round.

---

RATIFICATION FLOW

Designer ratification is the sole gate. Clerk-audit must complete (CLERK-AUDIT phase) before ratification opens. Ratification accepts all structurally-valid rows in batch; designer may reject individual rows, which enter REVISED-PENDING. Batch acceptance with per-row reject is the only ratification shape — no partial accept without explicit per-row decision.

---

REVISION HANDLING

A row enters REVISED-PENDING when designer rejects it at ratification OR when a dependency is revised (cascade trigger). REVISED-PENDING clears to RATIFIED only via explicit designer re-ratification after Clerk re-audit confirms structural validity. No auto-clear.

---

CASCADE HANDLING

Cascade triggers on two events: (1) a RATIFIED PROPOSITION row is revised, (2) a RATIFIED AXIOM row is revised or withdrawn. On trigger, Clerk marks all Constraint Envelope rows whose grounding cites the revised entry_id as REVISED-PENDING. Cascade scope: DESIGNER axiom revision = broader (all downstream Propositions); AGENT Proposition revision = narrow (direct grounding citations only).

---

WITHDRAWAL HANDLING

Withdrawal is distinct from revision. A withdrawn entry_id is removed from the Constraint Envelope entirely. Clerk immediately re-audits Coverage Map: any Concern whose only coverage was the withdrawn entry transitions to GAP status. GAP blocks session close and forces re-entry into DELIBERATING.

---

SESSION-CLOSE GATE

All conditions must hold simultaneously: (1) zero GAP rows in Coverage Map, (2) zero REVISED-PENDING rows in Constraint Envelope, (3) all cross-artifact FK checks pass, (4) every PROPOSITION row has structural_valid = TRUE in Resolution Criterion. Any single failure blocks CLOSED transition.
