# Phases and Transitions — Schema

Five-phase lifecycle, transitions, cascade timing, withdrawal exception. Src: `process-locked-00.md`.

## Session Phases (Five Named States)

`OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED`

- `OPEN` — Concerns registered. No axioms. Propositions forbidden.
- `ANCHORED` — Designer asserted ≥1 axiom on ≥1 Concern. Per-Concern partial-license state.
- `DELIBERATING` — ≥1 Concern anchored AND designer initiated deliberation. Poles submit Proposition records.
- `RATIFYING` — Designer round-end signal received. Clerk lint complete. Designer dispositions each row.
- `CLOSED` — Session-close gate cleared. Deliverables frozen. Terminal.

## Transitions

- `OPEN → ANCHORED` — designer asserts first axiom on any Concern.
- `ANCHORED → DELIBERATING` — designer initiates deliberation (explicit signal).
- `DELIBERATING → RATIFYING` — designer round-end signal AND Clerk lint complete.
- `RATIFYING → DELIBERATING` — ≥1 row entered REVISED-PENDING via designer per-row reject, OR session-close gate failed. New round opens.
- `RATIFYING → CLOSED` — session-close gate clears.

**Load-bearing:** No transition fires automatically on coverage condition. Every advance designer-triggered.

## Cascade Timing (Hybrid)

Sync scope capture at trigger event. Deferred status mutation at round-close lint.

Provenance-differentiated scope:
- DESIGNER axiom revision → all PROPOSITION rows for that Concern.
- AGENT Proposition revision → only rows whose `grounding` cites revised `entry_id`, then transitive.

## Withdrawal Exception

Withdrawal fires full cascade (scope capture AND status mutation) immediately at withdrawal event. Designer-initiated, visible immediately. All rows whose `grounding` cites withdrawn `entry_id` → REVISED-PENDING. Coverage Map recomputed. Irreversible — re-entry requires new `entry_id`.
