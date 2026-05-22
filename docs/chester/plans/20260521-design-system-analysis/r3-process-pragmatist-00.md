# R3 Process Final — Pragmatist (verbatim)

**File:** `r3-process-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R3 of 3 (process — final positions)
**Macro step:** 2 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R3 PROCESS FINAL POSITIONS

DIVERGENCE 1: HOLD — ANCHORED is a named phase, not a transition condition. Purist's collapse makes axiom-assertion an entry gate to DELIBERATING, but a gate with no named state on its input side gives operators no observable position to report when stuck; "I'm between OPEN and DELIBERATING" is not a state the designer can act on. ANCHORED names the window where designer is asserting axioms and poles are waiting — that window has real wall-clock duration under tired-Tuesday conditions and must be a place the session can be "in."

DIVERGENCE 2: ACCEPT HYBRID — Conservator's hybrid is the right resolution. Synchronous trigger is correct for scope-capture: the moment a REVISED-PENDING event occurs, Clerk records which downstream entry_ids are in cascade scope, preventing scope drift if new Propositions are submitted before round close. Deferred invalidation is correct for Proposition-status mutation: actual REVISED-PENDING status flags fire at round-close lint, not mid-round, so no submitted-but-invalid race window exists. The hybrid gives Innovator the race-prevention property (scope locked synchronously) and gives me and Purist the atomic-surface property (status mutations deferred). Both concerns are satisfied; neither pure position gets both.

FINAL POSITION SUMMARY:
- ANCHORED as named phase (HOLD): five named states OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED; axiom-assertion window must be a named session state operators can locate themselves in, not a silent gate.
- Cascade timing (ACCEPT HYBRID): Clerk captures cascade scope synchronously at trigger event; Proposition-status mutations (REVISED-PENDING flags) fire at round-close lint; scope is locked immediately, invalidation surface is resolved atomically.
