# R1 Process — Conservator (verbatim)

**File:** `r1-process-conservator-00.md`
**Pole:** Conservator
**Round:** R1 of 3 (process)
**Macro step:** 2 of 4 (process)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R1 PROCESS

---

**SESSION PHASES**

Four named states: OPEN → DELIBERATING → RATIFYING → CLOSED. Session enters OPEN when Concerns are registered and designer asserts axioms. Session advances to DELIBERATING when at least one pole submits a Proposition record. Session advances to RATIFYING when designer initiates batch ratification. Session reaches CLOSED only when session-close gate clears. No phase may be skipped. Regression permitted only from RATIFYING back to DELIBERATING (on designer rejection of a batch).

---

**ROUND STRUCTURE**

A round is one complete DELIBERATING → RATIFYING cycle. A session has one or more rounds. Round advances when designer completes batch ratification (accept or reject). No round limit — the session-close gate, not round count, determines when the session ends. Each round produces a delta to the Constraint Envelope and triggers a Coverage Map recompute.

---

**RATIFICATION FLOW**

Clerk runs structural lint at round-close: field presence, IF/THEN form, structural_valid flag, cross-artifact FK consistency. Structural lint must pass before designer receives the batch. Designer reads ratified-candidate rows and ratifies by batch accept or per-row disposition. Semantic judgment (collapse_test quality, body coherence) is designer-only gate — Clerk does not evaluate it. Two-player asymmetry is enforced: agent proposes, designer ratifies; no ratification without explicit designer act.

---

**REVISION HANDLING**

Any change to a RATIFIED row's body or collapse_test triggers status → REVISED-PENDING on that row. REVISED-PENDING rows are excluded from coverage computation and block session close. Clearing REVISED-PENDING requires designer re-ratification of the revised row in the next round's ratification batch. Designer cannot clear REVISED-PENDING by declaration — only by explicit re-ratification.

---

**CASCADE HANDLING**

When a row enters REVISED-PENDING, Clerk scans the working record for all Proposition rows whose evidence_ids or grounding chains reference the revised entry_id. Each such row also enters REVISED-PENDING. Cascade scope is bounded: one hop from the revised entry_id in the working record. No transitive cascade beyond direct citation — transitive closure is designer's semantic judgment.

---

**WITHDRAWAL HANDLING**

Withdrawal is distinct from revision. Withdrawn entry is removed from the Constraint Envelope (not REVISED-PENDING — absent). Clerk re-audits all Proposition rows citing the withdrawn entry_id; each such row enters REVISED-PENDING (now ungrounded). Coverage Map recomputed immediately. If withdrawal produces a GAP, session is blocked until the gap is addressed.

---

**SESSION-CLOSE GATE**

Three conditions, all must hold: (1) Coverage Map has no GAP rows. (2) Constraint Envelope has no REVISED-PENDING rows. (3) Every PROPOSITION row in the Constraint Envelope has a matching Resolution Criterion row with structural_valid = TRUE. AXIOM-ONLY rows in the Coverage Map do not block close — they flag for designer inspection only. Session close is a Clerk-certified state, not a designer declaration.
