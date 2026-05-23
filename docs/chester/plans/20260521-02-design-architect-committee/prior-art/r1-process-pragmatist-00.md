# R1 Process — Pragmatist (verbatim)

**File:** `r1-process-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R1 of 3 (process)
**Macro step:** 2 of 4 (process)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R1 PROCESS

---

**SESSION PHASES**

Three phases: OPEN → DELIBERATING → CLOSED. OPEN: Concerns registered, axioms asserted by designer, Evidence registry populated. DELIBERATING: one or more rounds of pole deliberation producing Proposition records. CLOSED: all Concerns COVERED or AXIOM-ONLY, no REVISED-PENDING rows, session-close gate passes. No intermediate ceremony phases — transitions are state conditions, not named events.

---

**ROUND STRUCTURE**

Session contains one or more rounds. A round begins when team-lead dispatches Concern batch to poles. A round ends when Clerk completes the round-close lint pass and presents ratification surface to designer. Designer batch-ratifies; that closes the round. A new round opens only if GAP rows or REVISED-PENDING rows remain after ratification. One round is valid minimum — no minimum round count.

---

**RATIFICATION FLOW**

Clerk presents ratification surface (all PROPOSITION rows with structural_valid = TRUE) at round close. Designer reviews and ratifies the batch. Individual rows may be rejected during review; rejected rows return to deliberating state and require new Proposition. Gate: structural_valid must be TRUE before a row is presented. Designer ratification is the only authority that transitions a row from submitted to RATIFIED.

---

**REVISION HANDLING**

Any change to a RATIFIED row sets status to REVISED-PENDING immediately. REVISED-PENDING clears to RATIFIED only on explicit designer re-ratification after Clerk re-audit. No revision can self-heal — re-ratification always required.

---

**CASCADE HANDLING**

Cascade re-audit fires when: (a) a RATIFIED PROPOSITION row enters REVISED-PENDING, or (b) an Evidence ID is withdrawn. Scope: all rows whose grounding cites the revised or withdrawn ID. Clerk flags each affected row as REVISED-PENDING. Cascade is synchronous with the triggering event, not deferred to round close.

---

**WITHDRAWAL HANDLING**

Withdrawal is permanent removal, not revision. Withdrawn row exits the Constraint Envelope. Clerk immediately re-audits all rows grounding on the withdrawn entry_id and sets each to REVISED-PENDING. Coverage Map recomputed; any Concern that drops to GAP blocks session close. Withdrawal is distinct from REVISED-PENDING: withdrawn rows are gone, REVISED-PENDING rows remain pending re-ratification.

---

**SESSION-CLOSE GATE**

Three conditions, all required: (1) every Concern row in Coverage Map is COVERED or AXIOM-ONLY — no GAP. (2) no REVISED-PENDING rows in Constraint Envelope. (3) every PROPOSITION row has structural_valid = TRUE and exactly one Resolution Criterion row. All three must hold simultaneously. Gate is Clerk-computed; designer reads result, does not compute it.

---

WORD COUNT: ~395
