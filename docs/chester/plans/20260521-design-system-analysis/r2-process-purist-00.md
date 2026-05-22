# R2 Process — Purist (verbatim)

**File:** `r2-process-purist-00.md`
**Pole:** Purist
**Round:** R2 of 3 (process — refined)
**Macro step:** 2 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R2 PROCESS (refined)

CONCESSIONS FROM R1:
- Automatic round-close trigger dropped (Conservator + Innovator + Pragmatist: two-player asymmetry violation; agent fires on designer's behalf). Round closes only on explicit designer signal.
- Full-batch reject dropped (Conservator: discards nine valid rows for one failure). Per-row reject — failed rows enter REVISED-PENDING; accepted rows ratify immediately.
- CLOSING phase folded (Innovator + Pragmatist: gate-check is Clerk work within RATIFYING transition, not a durable state; "CLOSING" had no designer-observable duration).

HELD:
- Deferred cascade to round close (Pragmatist + Innovator defended synchronous; held because synchronous cascade mid-deliberation lets poles submit Propositions grounded on an entry_id that cascade simultaneously marks REVISED-PENDING — Clerk then rejects at lint a submission the pole had no way to know was invalid at time of submission. Deferred cascade defers the inconsistency window to a bounded point where Clerk can resolve it atomically).

---

SESSION PHASES — four named states:

1. OPEN — Concerns registered, no axioms yet. No Propositions permitted.
2. DELIBERATING — Designer has asserted at least one axiom. Poles submit Proposition records. Multiple rounds allowed.
3. RATIFYING — Round-end signal received; Clerk lint complete; designer reviews and ratifies per row. Failed rows enter REVISED-PENDING; accepted rows enter RATIFIED. Exits to DELIBERATING (new round opened) or CLOSED (session-close gate passes immediately after ratification batch).
4. CLOSED — Terminal. Deliverables frozen.

OPEN → DELIBERATING requires at least one designer-asserted axiom (Conservator's push: deliberation cannot precede axiom anchor). Transition is designer-triggered.

---

ROUND STRUCTURE — round begins on designer dispatch, ends on explicit designer round-end signal only. No automatic close. Each round: poles submit → designer signals end → Clerk lint → RATIFYING.

---

RATIFICATION FLOW — per-row. Clerk presents all structural_valid=TRUE rows. Designer accepts or rejects each row. Accepted: RATIFIED. Rejected: REVISED-PENDING. Clerk flags reason per rejected row. No row ratifies without explicit designer accept.

---

REVISION HANDLING — any change to RATIFIED body or collapse_test flips status to REVISED-PENDING immediately. Clears only via explicit designer re-ratification after Clerk re-lint.

---

CASCADE HANDLING — trigger: row enters REVISED-PENDING or WITHDRAWN at round close. Scope: transitive — Clerk scans all rows citing the flagged entry_id, flags each REVISED-PENDING, repeats until no new rows flagged. Deferred to round close, not synchronous with triggering event. Provenance-differentiated scope (Conservator's push, adopted): DESIGNER-provenance entry revision cascades to all Propositions for that Concern; AGENT-provenance entry revision cascades only to direct grounding citations.

---

WITHDRAWAL HANDLING — permanent removal from Constraint Envelope. Cascade fires immediately (not deferred — withdrawal is designer-initiated, no mid-round inconsistency risk). Coverage Map recomputed; GAP rows block session close.

---

SESSION-CLOSE GATE — three conditions, all required: (1) zero GAP rows in Coverage Map. (2) zero REVISED-PENDING rows in Constraint Envelope. (3) every PROPOSITION row has exactly one structural_valid=TRUE Resolution Criterion row. Clerk computes; designer reads result. Gate check runs inside RATIFYING after each ratification batch.
