# R2 Process — Pragmatist (verbatim)

**File:** `r2-process-pragmatist-00.md`
**Pole:** Pragmatist
**Round:** R2 of 3 (process — refined)
**Macro step:** 2 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST — R2 PROCESS (refined)

---

**SESSION PHASES**

Four phases: OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED. OPEN: Concerns registered, no axioms yet. ANCHORED: designer has asserted at least one axiom — deliberation permitted only on axiom-anchored Concerns. DELIBERATING: poles submitting Proposition records per round. RATIFYING: Clerk lint complete, designer reviewing and ratifying batch. CLOSED: session-close gate passes.

Refinement: ANCHORED added (Conservator + Purist push: three-phase OPEN doing two jobs — registration and assertion are distinct states). CLERK-AUDIT rejected as named phase (Innovator likely concedes — Clerk lint is a transition condition into RATIFYING, not a session state).

---

**ROUND STRUCTURE**

Session contains one or more rounds. Round begins at team-lead dispatch. Round ends on explicit designer signal — not on coverage condition, not on submission count. Partial poles (abstentions) permitted; unsubmitted slots are open for next round.

---

**RATIFICATION FLOW**

Clerk lint pass completes — triggered by designer round-end signal, not by pole submission count or automatic condition — before ratification surface opens. Designer ratifies batch; per-row reject permitted. Rejected rows enter REVISED-PENDING; accepted rows transition to RATIFIED. Designer round-end signal is the lint trigger; lint completion gates entry to RATIFYING.

Refinement: lint trigger named as designer signal (Innovator push — R1 left trigger ambiguous). Keeps trigger at process level, actor identity deferred to step 4.

---

**REVISION HANDLING**

Any change to a RATIFIED row immediately sets status to REVISED-PENDING. Clears only on explicit designer re-ratification after Clerk re-lint confirms structural_valid = TRUE.

---

**CASCADE HANDLING**

Cascade fires at round close, not synchronously. On round close, Clerk scans all Constraint Envelope rows whose grounding cites any entry_id that entered REVISED-PENDING or was withdrawn during the round. Cascade is transitive — repeats until no new rows are flagged. Flagged rows set REVISED-PENDING before ratification surface opens.

Refinement: cascade deferred to round close (Purist push accepted — synchronous cascade creates race: pole submits Proposition grounding on entry_id that cascade simultaneously invalidates, producing submitted-but-invalid row Clerk must then reject at lint; deferring eliminates the race). Cascade scope changed from one-hop to transitive (Innovator + Purist convergence — one-hop leaves silent integrity failures in multi-hop grounding chains).

---

**WITHDRAWAL HANDLING**

Withdrawal is permanent. Withdrawn entry removed from Constraint Envelope. Clerk adds withdrawn entry_id to round's cascade scan set — transitive cascade fires at round close covering all downstream grounding. Coverage Map recomputed after cascade. GAP rows block session close.

---

**SESSION-CLOSE GATE**

Three conditions, all required, Clerk-computed: (1) zero GAP rows in Coverage Map, (2) zero REVISED-PENDING rows in Constraint Envelope, (3) every PROPOSITION row has exactly one structural_valid=TRUE Resolution Criterion row. Gate check fires on designer close-signal. AXIOM-ONLY rows do not block close.

---

WORD COUNT: ~390
