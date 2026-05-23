# R3 Process Final — Purist (verbatim)

**File:** `r3-process-purist-00.md`
**Pole:** Purist
**Round:** R3 of 3 (process — final positions)
**Macro step:** 2 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R3 PROCESS FINAL POSITIONS

---

DIVERGENCE 1: CONCEDE — ANCHORED is a named phase.
Reason: axioms-not-yet-asserted and axioms-asserted are operationally distinct states with different permitted operations (Propositions blocked vs permitted) — that qualifies as a durable phase by the Purist's own "phase = durable state" rule. Collapsing it to a transition condition was under-specified.

DIVERGENCE 2: ACCEPT HYBRID — synchronous scope capture, deferred invalidation surface.
Reason: Conservator correctly splits two distinct operations I had bundled. Marking cascade scope (which rows are affected) is read-only and synchronous — no consistency risk. Flipping those rows to REVISED-PENDING and presenting the invalidation surface happens at round-close lint, where Clerk resolves atomically. This closes the mid-round race window Pragmatist and I identified while also closing the scope-detection delay Innovator identified. Strictly stronger than either pure position.

---

FINAL POSITION SUMMARY:

- ANCHORED is a named session phase (five phases: OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED). Entry to ANCHORED requires designer assertion of at least one axiom. Entry to DELIBERATING requires at least one ANCHORED Concern. Phase boundary is mechanically enforceable.

- Cascade timing: hybrid. Scope captured synchronously on triggering event (Clerk marks affected entry_ids). Invalidation surface (status flip to REVISED-PENDING on dependent rows) deferred to round-close lint pass. Withdrawal remains an exception — full cascade fires immediately because withdrawal is designer-initiated with no mid-round submission risk.
