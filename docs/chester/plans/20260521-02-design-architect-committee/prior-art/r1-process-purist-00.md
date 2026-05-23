# R1 Process — Purist (verbatim)

**File:** `r1-process-purist-00.md`
**Pole:** Purist
**Round:** R1 of 3 (process)
**Macro step:** 2 of 4 (process)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R1 PROCESS

---

SESSION PHASES — four named states, strictly ordered:

1. OPEN — Concerns registered, axioms not yet asserted. Entry point for every session.
2. DELIBERATING — Axioms asserted per Concern, poles submitting Proposition records. Repeatable (multiple rounds allowed).
3. RATIFYING — Round closed, Clerk lint complete, designer reviewing Proposition batch. Transitional — exits to DELIBERATING (round opened) or CLOSING (all Concerns ratified).
4. CLOSED — Session-close gate cleared. Deliverables frozen. No further mutations permitted.

Transitions: OPEN → DELIBERATING (designer asserts first axiom or opens deliberation). DELIBERATING → RATIFYING (round-end signal; Clerk runs lint). RATIFYING → DELIBERATING (designer opens new round) or RATIFYING → CLOSING (no GAP rows, no REVISED-PENDING rows, designer signals close). CLOSING → CLOSED (session-close gate passes).

---

ROUND STRUCTURE — session may contain one or more rounds. Round advances when: (a) designer issues round-end signal OR (b) all Concerns reach COVERED or AXIOM-ONLY and no REVISED-PENDING rows exist. No round auto-closes mid-deliberation. Round is the unit of Clerk lint scope — one lint pass per round close, not continuous.

---

RATIFICATION FLOW — trigger: Clerk lint pass completes with zero structural failures (all structural_valid = TRUE, all FK integrity checks pass). Gate: designer explicit ratification of the batch. No partial ratification — designer ratifies or rejects the entire round batch. Rejected batch returns to DELIBERATING with Clerk flagging specific failures.

---

REVISION HANDLING — trigger: designer or pole revises any RATIFIED Proposition body or collapse_test. Effect: Constraint Envelope row status flips to REVISED-PENDING immediately. REVISED-PENDING clears to RATIFIED only on explicit designer re-ratification after Clerk re-lint of the revised row.

---

CASCADE HANDLING — trigger: any row transitions to REVISED-PENDING or WITHDRAWN. Scope: Clerk scans all Constraint Envelope rows whose entry_id appears as grounding in any other row's provenance chain. Flagged rows also flip to REVISED-PENDING. Cascade is bounded — terminates when no new rows are flagged.

---

WITHDRAWAL HANDLING — distinct from revision. Trigger: designer withdraws an axiom or Proposition entry. Effect: row removed from Constraint Envelope; Coverage Map re-computed; any row grounding on the withdrawn entry_id immediately flagged REVISED-PENDING. Withdrawal is irreversible — no un-withdraw. Re-entry requires new entry_id.

---

SESSION-CLOSE GATE — three conditions, all required:
1. Zero GAP rows in Coverage Map.
2. Zero REVISED-PENDING rows in Constraint Envelope.
3. Every PROPOSITION row in Constraint Envelope has exactly one matching structural_valid=TRUE Resolution Criterion row.

Any failed condition blocks CLOSING transition. No partial close.
