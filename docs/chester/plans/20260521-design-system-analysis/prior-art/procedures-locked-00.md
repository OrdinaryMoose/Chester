# Procedures — Locked Specification

**File:** `procedures-locked-00.md`
**Status:** Team-lead adjudicated 2026-05-21 (designer-authorized standing adjudication for macro step 3)
**Macro step:** 3 of 4 (procedures) — COMPLETE
**Source:** four-pole convergence (R1 → R1 DM → R2 → R3) plus team-lead synthesis on D3
**Round count:** three rounds + DM, twelve verbatim files on disk
**Date:** 2026-05-21

---

## Procedure inventory

Twelve named procedures. Each entry: name, mutates, trigger, gates, state.

### 1. Add Concern

- **Mutates** — Concerns registry: appends `CE-NNN` row. Coverage Map gains GAP row immediately (side effect of registry addition).
- **Trigger** — OPEN, ANCHORED, or DELIBERATING. Designer signal.
- **Gates** — `CE-NNN` prefix valid; uniqueness check.
- **State** — none. Phase unchanged. New Concern enters unanchored.

### 2. Add Evidence

- **Mutates** — Evidence registry: appends `EV-NNN` row.
- **Trigger** — any phase except CLOSED.
- **Gates** — `EV-NNN` prefix valid; uniqueness check.
- **State** — none.

### 3. Add Axiom

- **Mutates** — Constraint Envelope: appends `AX-NNN` row with `source = AXIOM`, `provenance = DESIGNER`, `status = RATIFIED`, body. On collision detection: synchronously flags conflicting `RATIFIED PROPOSITION` rows on the same Concern to `REVISED-PENDING` via cascade.
- **Trigger** — ANCHORED or DELIBERATING. Designer signal only. `provenance = DESIGNER` enforced; agents cannot call.
- **Gates** — `CE-NNN` must exist in Concerns registry; body must conform to IF/THEN architectural-altitude form (Clerk-enforced). No collision-block — axiom always written. Cascade scope captured synchronously for existing `PROPOSITION` rows on that Concern.
- **State** — OPEN → ANCHORED on first axiom. Late axiom in DELIBERATING: phase unchanged; cascade mutation deferred to next Lint Batch per process hybrid timing (except conflicting Propositions: flagged immediately).

### 4. Initiate Deliberation

- **Mutates** — session state only.
- **Trigger** — ANCHORED. Designer explicit signal.
- **Gates** — at least one anchored Concern exists (at least one `CE-NNN` has an `AX-NNN` row).
- **State** — ANCHORED → DELIBERATING.

### 5. Propose Proposition

- **Mutates** — Constraint Envelope: appends `PR-NNN` row with `source = PROPOSITION`, `provenance = AGENT`, `status = REVISED-PENDING`, body, collapse_test, grounding. No Resolution Criterion row yet (created on Ratify ACCEPT).
- **Trigger** — DELIBERATING only. Agent signal.
- **Gates** — `CE-NNN` must exist and be anchored (has at least one `AX-NNN` row); all grounding `EV-NNN` exist in Evidence registry and not in Clerk's cascade-invalidated scope; body in IF/THEN form; collapse_test in IF NOT/THEN form; **axiom-collision check: synchronous block at gate if body directly contradicts any `AX-NNN` body for same Concern (structural negation match, not semantic).**
- **State** — row pending Lint Batch.

### 6. Submit Round

- **Mutates** — session state only. Triggers Lint Batch.
- **Trigger** — DELIBERATING. Designer explicit signal.
- **Gates** — none pre-signal.
- **State** — fires Lint Batch; on lint pass DELIBERATING → RATIFYING.

### 7. Lint Batch

- **Mutates** — sets `structural_valid` flag per pending `PR-NNN` row; applies deferred cascade mutations (flips in-scope rows to REVISED-PENDING); recomputes Coverage Map; runs FK integrity checks; runs axiom-collision check on pending PROPOSITION bodies as defensive backstop (Propose Proposition gate is primary check).
- **Trigger** — Submit Round or Re-Ratify Row (context-parameterized). Round-close variant fires deferred cascade mutations; re-ratification variant does not.
- **Gates** — Clerk operation; blocks RATIFYING entry on any structural failure.
- **State** — pass → RATIFYING opens. Failure → flagged rows returned, session stays DELIBERATING.

### 8. Ratify Row

- **Disposition parameter** — `ACCEPT` | `REJECT`.
- **Mutates (ACCEPT)** — Constraint Envelope row `status → RATIFIED`. Resolution Criterion: appends matching row (`concern_id`, `entry_id = PR-NNN`, `collapse_test`, `structural_valid = TRUE`). RC row created here, not at Propose Proposition.
- **Mutates (REJECT)** — Constraint Envelope row `status → REVISED-PENDING`. Clerk records rejection reason.
- **Trigger** — RATIFYING. Per-row designer disposition.
- **Gates** — `structural_valid = TRUE` required; designer explicit signal per row; no auto-accept.
- **State** — accepted rows in same batch unaffected by peer rejections. After all rows dispositioned: session-close gate evaluated by Clerk.

### 9. Re-Ratify Row

- **Mutates** — REVISED-PENDING row `status → RATIFIED`. Resolution Criterion row created or updated if `collapse_test` was revised.
- **Trigger** — RATIFYING. Row must be REVISED-PENDING. Designer explicit re-ratification.
- **Gates** — Clerk re-lint (Lint Batch re-ratification variant) must confirm `structural_valid = TRUE` first; designer explicit signal.
- **State** — row → RATIFIED. Contributes to session-close gate evaluation.

### 10. Revise Row

- **Mutates** — target row body, collapse_test, or grounding. `status → REVISED-PENDING` immediately. `structural_valid` reset to FALSE. Clerk captures cascade scope synchronously (per process hybrid timing).
- **Trigger** — DELIBERATING (DESIGNER for AXIOM rows; AGENT for own PROPOSITION rows — ownership enforced by Clerk matching `provenance = AGENT` and submission identity). RATIFYING: DESIGNER only (AGENT revision in RATIFYING prohibited — round is closed).
- **Gates** — entry_id must exist; revised fields must pass form checks.
- **State** — source row → REVISED-PENDING. Cascade dependents flagged in Clerk working record; deferred mutation fires at next Lint Batch.

### 11. Withdraw Entry

- **Mutates** — removes `entry_id` from Constraint Envelope entirely. Full immediate cascade (both scope capture AND status mutation, per process spec exception). Coverage Map recomputed.
- **Trigger** — any phase except CLOSED. DESIGNER only.
- **Gates** — `entry_id` must exist; withdrawal is irreversible; re-entry requires new `entry_id`.
- **State** — all rows whose grounding cites the withdrawn `entry_id` enter REVISED-PENDING immediately. GAP produced by withdrawal blocks session close.

### 12. Close Session

- **Mutates** — session state → CLOSED. Deliverables frozen. No further mutations permitted.
- **Trigger** — RATIFYING. Designer explicit close signal after all rows dispositioned. Clerk computes session-close gate from current artifact state.
- **Gates** — Clerk-computed three conditions: zero GAP rows in Coverage Map; zero REVISED-PENDING rows in Constraint Envelope; every PROPOSITION row has exactly one matching `structural_valid = TRUE` Resolution Criterion row. Designer reads gate result; designer does not compute it.
- **State** — RATIFYING → CLOSED on gate pass. RATIFYING → DELIBERATING on gate failure (with Clerk gate-failure report).

---

## Four-pole convergence summary

Four R3 divergences converged. One required team-lead adjudication.

- **D1 — Re-Ratify Row separate procedure** — **4-pole CONVERGED**. Purist conceded R3. Distinct Clerk re-lint gate justifies separation.
- **D2 — Close Session structure** — **3-1 single procedure** (Conservator + Innovator + Purist). Pragmatist switched to split in R3 but stood alone. Locked as single procedure: no designer-observable duration between intent and gate-pass; gate computation is Clerk work inside the procedure.
- **D3 — Axiom-collision on Add Axiom side** — **2-2 split → TEAM-LEAD ADJUDICATED in favor of flow position** (Conservator + Innovator). Add Axiom does not block; conflicting Propositions flagged REVISED-PENDING via immediate cascade.
- **D4 — Axiom-collision on Propose Proposition side** — **4-pole CONVERGED**. Synchronous block at submission gate. Lint Batch retains the check as defensive backstop.
- **D5 — Same-round propose against new Concern** — **4-pole effectively CONVERGED**. Behavior is blocked in same round; mechanism is the existing anchoring gate (new Concern has no axioms → Propose Proposition gate rejects). Three poles named the rule explicitly; Innovator noted it falls out of anchoring gate. Locked behavior: implicit via anchoring gate (no new rule needed).

## Team-lead adjudication on D3 — reasoning

Two equally-defensible positions surfaced in R3.

- **Block axiom (Pragmatist + Purist).** Add Axiom either blocks until designer resolves conflict (Purist) or surfaces collision and requires explicit designer disposition before write (Pragmatist's REFINE). Preserves "no invalid schema state" property. Synchronous resolution.
- **Flow axiom (Conservator + Innovator).** Add Axiom always proceeds; conflicting Propositions flagged REVISED-PENDING immediately. Preserves two-player asymmetric authority (designer authority unconditional; agent content cannot block designer act). Uses existing cascade machinery. Deferred resolution at next ratification.

**Adjudication: Flow axiom (Conservator + Innovator).** Reasoning:

- **Vision Sec 2.6 — two-player asymmetric authority is load-bearing.** Designer-asserted axioms are ground truth. Allowing prior agent-submitted Propositions to block designer axiom assertion inverts the authority structure. The two-player game cannot be won with agent content holding designer authority hostage.
- **Existing machinery preserved.** REVISED-PENDING is a legitimate row status. The cascade scope-capture pattern locked in macro step 2 already handles flagged Propositions on revision; flagged-on-axiom-addition is the symmetric case.
- **90/10 budget — fewer synchronous designer interrupts.** Block-style requires designer to interrupt axiom assertion and make a binary disposition (write or cancel). Flow-style lets designer assert all axioms freely, then disposes flagged Propositions at next ratification — single batch decision rather than per-axiom interrupts.
- **Pragmatist's REFINE is not lost.** Designer can still cancel an axiom after seeing the collision by calling Withdraw Entry on the just-asserted axiom row. The "withdraw axiom intent" path remains available; it just isn't a special-cased interrupt during Add Axiom.

The Block position is not wrong; it is more cautious. The Flow position is preferred for the four reasons above.

---

## What this artifact does NOT specify

- Who performs each procedure. Macro step 4 — actors.

The procedures name what operations exist, what they mutate, what triggers them, and what gates them. Macro step 4 assigns each procedure's trigger to a named role (designer, pole, Clerk, team-lead) and specifies Clerk's role surface in detail (D3 framing question still open until step 4).
