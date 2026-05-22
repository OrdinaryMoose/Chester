# R3 Process Final — Conservator (verbatim)

**File:** `r3-process-conservator-00.md`
**Pole:** Conservator
**Round:** R3 of 3 (process — final positions)
**Macro step:** 2 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R3 PROCESS FINAL POSITIONS

**DIVERGENCE 1: HOLD** — Axiom-assertion is a durable observable session state, not an instantaneous predicate. Designer may spend significant time asserting axioms across multiple Concerns before any pole submits; collapsing that into a transition condition makes axiom-blocking invisible to operators. Named ANCHORED phase enforces that deliberation is structurally prohibited until designer completes axiom work — this is the load-bearing Elicitron closure, not ceremony.

**DIVERGENCE 2: HOLD hybrid** — The hybrid resolves the race window Innovator names without the mid-round inconsistency Pragmatist/Purist name. Synchronous source-row marking (entry_id → REVISED-PENDING immediately on trigger) makes invalid entries visible in the working record during DELIBERATING, preventing poles from submitting new Propositions against a now-invalid entry in the same round. Proposition-invalidation surface (flagging already-submitted Propositions that cite the revised entry) defers to round-close lint, where Clerk resolves atomically. Full deferral (Pragmatist/Purist) leaves a clean-looking working record that misleads poles mid-round. Full synchronous (Innovator) creates submitted-but-invalid Proposition state before Clerk can process it. The hybrid is the correct split between these two surfaces.

---

**FINAL POSITION SUMMARY:**

- ANCHORED is a named session phase (five states: OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED). Axiom-assertion is designer work with observable duration; phase naming enforces deliberation-blocking without relying on operator discipline.
- Cascade timing is hybrid: source-row REVISED-PENDING marking fires synchronously on trigger event; downstream Proposition-invalidation (flagging submitted Propositions citing the revised entry_id) defers to round-close lint. Synchronous source-marking closes the in-round race window; deferred Proposition-invalidation preserves Clerk atomic resolution.
