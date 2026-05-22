# Process — Locked Specification

**File:** `process-locked-00.md`
**Status:** Team-lead adjudicated 2026-05-21 (designer-authorized standing adjudication for macro step 2)
**Macro step:** 2 of 4 (process) — COMPLETE
**Source:** four-pole convergence (R1 → R1 DM → R2 → R3)
**Round count:** three rounds + DM, ten verbatim files on disk
**Date:** 2026-05-21

---

## Session phases — five named states

`OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED`

- **OPEN.** Concerns registered. No axioms yet. No Propositions permitted. No deliberation permitted.
- **ANCHORED.** Designer has asserted at least one axiom for at least one Concern. Designer continues asserting axioms across remaining Concerns. Per-Concern partial-license state — anchored Concerns differ from unanchored Concerns operationally. Poles still may not submit until DELIBERATING.
- **DELIBERATING.** At least one Concern is anchored AND designer has initiated deliberation. Poles submit Proposition records. Multiple rounds permitted. Poles may not submit against unanchored Concerns.
- **RATIFYING.** Round-end signal received from designer. Clerk lint complete (all structural_valid flags TRUE, all FK integrity checks pass). Designer reviews and dispositions each presented row.
- **CLOSED.** Session-close gate cleared. Deliverables frozen. Terminal state. No further mutations permitted.

## Transitions

- `OPEN → ANCHORED` — designer asserts first axiom on any Concern.
- `ANCHORED → DELIBERATING` — designer initiates deliberation (explicit signal).
- `DELIBERATING → RATIFYING` — designer issues explicit round-end signal AND Clerk lint completes.
- `RATIFYING → DELIBERATING` — at least one row entered REVISED-PENDING via designer per-row reject, or session-close gate failed; new round opens.
- `RATIFYING → CLOSED` — session-close gate clears.

No transition fires automatically on a coverage condition. Every advance is designer-triggered.

## Round structure

- One round = one `DELIBERATING → RATIFYING` cycle.
- Session contains one or more rounds. No upper limit.
- Round begins at designer dispatch (or implicit on first entry to DELIBERATING).
- Round ends on explicit designer round-end signal only.
- No automatic round-close.
- Partial rounds permitted — pole abstention closes that pole's slot for that round only.
- An abstaining pole may NOT re-address the same Concern in the same round; only in the next round.

## Ratification flow

- Clerk lint runs on round-end signal.
- Lint checks: all `structural_valid = TRUE`, all FK integrity passes, all required fields present, ID prefixes match `source`.
- Lint completion gates entry to RATIFYING.
- Designer dispositions each row individually: **ACCEPT** (row → RATIFIED) or **REJECT** (row → REVISED-PENDING).
- Accepted rows in the same batch are not affected by peer rejections in that batch.
- Clerk flags rejection reason per row.

## Revision handling

- Any change to a RATIFIED row's `body`, `collapse_test`, or `grounding` triggers immediate status flip to REVISED-PENDING.
- REVISED-PENDING clears only via explicit designer re-ratification after Clerk re-lint confirms `structural_valid = TRUE`.
- No auto-clear. No declaration-clear.

## Cascade handling — hybrid timing

The four-pole-converged resolution. Two-step cascade with synchronous scope capture and deferred status mutation.

**Synchronous step (at trigger event)**
- Clerk captures cascade scope immediately.
- Source-row marks the affected `entry_id`.
- Clerk identifies all downstream rows whose `grounding` cites the affected `entry_id`, transitively, until no new IDs are added.
- Captured scope lives in Clerk's working record. No status mutation yet on dependent rows.
- Effect during DELIBERATING — Clerk surfaces invalid `entry_id`s to poles, preventing new Propositions from being submitted against now-invalid entries in the same round.

**Deferred step (at round-close lint)**
- Clerk flips all in-scope dependent rows to REVISED-PENDING.
- Coverage Map recomputed.
- Invalidation surface presented atomically — no mid-round partial-invalid state.

**Provenance-differentiated scope**
- DESIGNER axiom revision → all PROPOSITION rows for that Concern (scope is per-Concern, not session-wide).
- AGENT Proposition revision → only rows whose `grounding` directly cites the revised `entry_id`, then transitive across the grounding chain.

## Withdrawal handling

- Withdrawal is permanent removal of an entry from the Constraint Envelope.
- Cascade fires immediately on withdrawal — full cascade (both scope capture AND status mutation) at the withdrawal event. **Exception to deferred timing.**
- Rationale: withdrawal is designer-initiated. Poles cannot submit Propositions against a withdrawn entry in the same round because the withdrawal is a designer action visible immediately. No mid-round race window exists.
- All rows whose `grounding` cites the withdrawn `entry_id` enter REVISED-PENDING.
- Coverage Map recomputed.
- GAP produced by withdrawal blocks session close until addressed.
- Withdrawal is irreversible. Re-entry requires a new `entry_id`.

## Session-close gate

Three conditions, all required. Clerk computes; designer reads result.

1. Zero GAP rows in Coverage Map.
2. Zero REVISED-PENDING rows in Constraint Envelope.
3. Every PROPOSITION row in Constraint Envelope has exactly one matching Resolution Criterion row with `structural_valid = TRUE`.

Plus cross-artifact FK checks pass (from locked deliverables spec).

AXIOM-ONLY rows in Coverage Map do not block close — flag for designer inspection only.

Gate check fires after each per-row ratification batch in RATIFYING. If gate clears, `RATIFYING → CLOSED`. If gate fails, `RATIFYING → DELIBERATING` (new round).

## Four-pole convergence summary

All seven dimensions reached four-pole agreement by R3.

- **Session phases** — five named states (Purist conceded R3).
- **Round structure** — explicit designer signal only, no auto-close (Purist conceded R2).
- **Ratification flow** — per-row designer disposition (Purist conceded R2; Innovator reversed in R2 to defend per-row).
- **Revision handling** — immediate status flip, designer re-ratification only (4-pole agreement throughout).
- **Cascade timing** — hybrid (synchronous scope, deferred mutation) — all four poles accepted R3.
- **Cascade scope** — provenance-differentiated (Conservator conceded one-hop in R2; all four converged on Innovator's scope rules + Purist's transitive depth).
- **Withdrawal handling** — immediate full cascade, irreversible (4-pole agreement throughout).
- **Session-close gate** — three Clerk-computed conditions, AXIOM-ONLY does not block (4-pole agreement throughout).

## What this artifact does NOT specify

- Specific operations that mutate the artifact contents (add Concern, propose, ratify, revise, withdraw, lint, close). Macro step 3 — procedures.
- Who performs which operations (designer, pole, Clerk, team-lead). Macro step 4 — actors.

These are the next two macro steps, in order.
