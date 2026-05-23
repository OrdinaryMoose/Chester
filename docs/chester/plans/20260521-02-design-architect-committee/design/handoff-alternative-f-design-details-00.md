# Detailed Handoff — Alternative F (Channeled Single-Layer Schema with Designer Axiom-Anchoring)

**File:** `design/handoff-alternative-f-design-details-00.md`
**Sprint:** `20260521-02-desgin-architect-committee`
**Date:** 2026-05-22
**Purpose:** Comprehensive design-handoff covering the full Alternative F architecture, the four macro-step locked specifications, cross-cutting axioms, risks carried forward, and the implementation work outstanding for the `design-architect-committee` skill build.

This handoff is the single document a future agent reads cold to understand the full `design-architect-committee` architecture without opening the four locked spec files individually.

---

## Table of Contents

- §1 Overview — what Alternative F is, why it exists, what it replaces.
- §2 Cross-cutting axioms — the eight DESIGNER axioms that bind the entire architecture.
- §3 Phase 1 — Deliverables (`deliverables-locked-00.md`).
- §4 Phase 2 — Process (`process-locked-00.md`).
- §5 Phase 3 — Procedures (`procedures-locked-00.md`).
- §6 Phase 4 — Actors (`actors-locked-00.md`).
- §7 Risks carried forward.
- §8 Implementation work outstanding.
- §9 Relation to the redesigned general committee (Mode A vs Mode B).
- §10 File pointers for the next agent.

---

## §1 Overview

Alternative F — **Channeled Single-Layer Schema with Designer Axiom-Anchoring** — is the architecture for the `design-architect-committee` Chester skill currently being designed within the Chester eco-system. It replaces the legacy proof-MCP-anchored design session pattern, which exhibited a five-generation failure sequence documented in `proof-system-origin-research.md`.

The architecture was selected and ratified at `fac-recommendation-and-aoa-00.md` (Fitness-for-Acceptance evaluation). Six candidate alternatives were considered against ten designer-set lenses (`lens-criteria-for-fac-options.md`); Alternative F was selected.

### Core Properties

- **No proof engine.** No Datalog. No closure-gate query. All Clerk operations mechanically specifiable from the locked procedures.
- **Single-layer schema.** Rows in one flat artifact (Constraint Envelope); no multi-layer concern → proposition → evidence hierarchy.
- **Designer axiom-anchoring.** Designer asserts AXIOM rows; agents (poles) propose PROPOSITION rows. Provenance structurally enforced via `provenance` field.
- **Two-player asymmetric authority** (StoryDesigner Vision Sec 2.6). Designer authority unconditional (Add Axiom, Ratify Row, Withdraw Entry, Close Session may not be blocked by agent content). Agent authority propose-revise-withdraw-bounded (poles may not ratify, withdraw, or call any designer procedure).
- **Channeling.** The five-phase session lifecycle plus the twelve named procedures narrow agent moves to legal slots per phase and per role. Reduces freeform LLM drift.
- **Deterministic Clerk.** No LLM layer in the Clerk role. All Clerk operations are mechanical: lint, FK integrity check, structural negation match, cascade scope capture, deferred status mutation, Coverage Map recomputation, session-close gate evaluation.

### What Each Session Produces

Every `design-architect-committee` session produces exactly three frozen artifacts for `design-specify` consumption: Constraint Envelope, Resolution Criterion, Coverage Map. Detailed shape in §3.

### Macro-Step Design Sequence

The architecture was authored via backwards-macro design across four macro steps:

1. **Deliverables** (what artifacts each session produces).
2. **Process** (how a session progresses from open Concerns to ratified deliverables).
3. **Procedures** (what operations mutate the artifacts).
4. **Actors** (who performs each operation).

All four macro steps locked. Per-step verbatim pole returns persist on disk as `r{1..3}-{step}-{pole}-00.md` files in the `design/` folder. Fifty-two files total across the four steps.

---

## §2 Cross-Cutting Axioms

Eight designer-asserted axioms bind the architecture. Each is sourced and grounded in `design-brief-for-specify-00.md` §4.1. Listed here verbatim for next-agent reference.

- **AX-001 (anchored to CE-005).** IF the design system needs ratified constraints before specify THEN the architecture is **Alternative F (Channeled Single-Layer Schema with Designer Axiom-Anchoring)** with no proof engine, no Datalog, and no closure-gate query. Grounding: `fac-recommendation-and-aoa-00.md` Executive Summary + Recommendation.
- **AX-002 (anchored to CE-004).** IF the Committee deploys against a Concern THEN it deploys exactly **four poles — Conservator, Innovator, Pragmatist, Purist** — with no fifth pole and no Arbiter role. Grounding: FAC + designer ruling "lets dispand arbiter" at session start.
- **AX-003 (anchored to CE-010).** IF a skill file is `skill.md` or `rules.md` THEN body content (frontmatter excluded) shall not exceed **200 words**. Schema files and `design-brief-template.md` are word-limit exempt. Grounding: designer ruling — no relief.
- **AX-004 (anchored to CE-006, CE-007, CE-009).** IF a session's operational time is measured THEN at least **90% is design planning** and at most **10% is admin processing** (90/10 budget). Grounding: designer-set Lens 10.
- **AX-005 (anchored to CE-005, CE-008).** IF a procedure mutates session state THEN designer authority is **unconditional** and agent authority is **propose-revise-withdraw-bounded**. This is the two-player asymmetric authority from Vision Sec 2.6.
- **AX-006 (anchored to CE-006).** IF an agent produces output THEN that agent **does not check its own work** (Lens 9). External validation only.
- **AX-007 (anchored to CE-006).** IF the skill's design is evaluated THEN it shall satisfy all **ten lenses** in `lens-criteria-for-fac-options.md` simultaneously. No lens is optional.
- **AX-008 (anchored to CE-010).** IF inter-agent communication occurs during deliberation THEN it uses **caveman ultra**. IF a skill file is read by the designer THEN it uses normal terse markdown — caveman ultra does not propagate to designer-facing surfaces.

---

## §3 Phase 1 — Deliverables

Source: `deliverables-locked-00.md`. Status: ratified by designer 2026-05-21.

Every session produces these three artifacts. `design-specify` consumes them. No other deliverables exist.

### 3.1 Constraint Envelope

Five fields per row.

- **`concern_id`** — typed prefix `CE-NNN`. Clerk-enforced uniqueness and format.
- **`entry_id`** — typed prefix `AX-NNN` (axiom) or `PR-NNN` (Proposition). Clerk-enforced.
- **`source`** — ENUM `{ AXIOM | PROPOSITION }`.
- **`body`** — IF/THEN architectural-altitude claim. No implementation vocabulary.
- **`provenance`** — ENUM `{ DESIGNER | AGENT }`. Clerk reads at read time for axiom-collision detection and cascade re-audit scope.
- **`status`** — ENUM `{ RATIFIED | REVISED-PENDING }`. Per-row. Consumer reads RATIFIED rows only. REVISED-PENDING rows block consumption at session close.

Read-out: flat list ordered by `concern_id`, AXIOM rows before PROPOSITION rows.

MVP: one RATIFIED row per Concern (axiom or Proposition).

### 3.2 Resolution Criterion

Four fields per row. AXIOM rows excluded — designer-asserted ground truth has no failure condition.

- **`concern_id`** — `CE-NNN`. Shared join key with Constraint Envelope.
- **`entry_id`** — `PR-NNN` only. FK to Constraint Envelope PROPOSITION row.
- **`collapse_test`** — IF NOT/THEN contrapositive. Structural form Clerk-enforced. Co-located on the Proposition record so revision cannot split body from collapse_test.
- **`structural_valid`** — BOOLEAN. Clerk-set after syntactic contrapositive match. Must be TRUE before designer ratification is accepted.

Read-out: one row per ratified PROPOSITION entry. Falsifiability battery for design-specify.

MVP: one row per ratified non-axiom Concern.

### 3.3 Coverage Map

Five fields per row. One row per Concern (rolled-up summary). No detail rows in the artifact.

- **`concern_id`** — `CE-NNN`.
- **`axiom_ids`** — list of `AX-NNN`. Empty if none.
- **`proposition_ids`** — list of `PR-NNN`. Empty if axiom-only.
- **`evidence_ids`** — list of `EV-NNN`. Evidence grounding the Propositions.
- **`status`** — ENUM `{ COVERED | AXIOM-ONLY | GAP }`. Clerk computes from Constraint Envelope at round close.

Status semantics:

- **COVERED** — at least one RATIFIED PROPOSITION row for this Concern.
- **AXIOM-ONLY** — axioms present, zero ratified Propositions. Passes session close but flags for designer inspection (no collapse_test exists for this Concern).
- **GAP** — neither axioms nor ratified Propositions. **Blocks session close.**

Read-out: one summary row per Concern. Consumer reads `status` field directly. No aggregation required at consumer surface.

MVP: every Concern appears in exactly one row, status populated.

### 3.4 Cross-Artifact Integrity Rules

The Clerk enforces these at every round close.

- `concern_id` in any Coverage Map row must appear in the Constraint Envelope (as one or more entries).
- `entry_id` referenced in any Coverage Map list (axiom_ids, proposition_ids) must appear in the Constraint Envelope with matching `source`.
- `entry_id` in any Resolution Criterion row must appear in the Constraint Envelope with `source = PROPOSITION` and `status = RATIFIED`.
- Every PROPOSITION row in the Constraint Envelope must have exactly one matching Resolution Criterion row.
- AXIOM rows in the Constraint Envelope have no matching Resolution Criterion row.

### 3.5 Clerk Working Record (separate from deliverables)

Per designer adjudication of macro-step D3 with team-lead modification.

- Clerk maintains a persisted working record between rounds.
- Working record carries detail-level data: axiom-to-Concern mappings, Proposition-to-Concern mappings, Evidence chains, per-entry provenance and status history, cascade-re-audit indices.
- Working record is **not a deliverable.** `design-specify` does not consume it.
- If the Committee re-opens the design after session close, Clerk reloads the working record and re-audits from it.
- Working record format unspecified at this point — it lives inside macro step 4 (actors), which scopes the Clerk's responsibilities. Format-of-record is part of the implementation work outstanding (§8).

---

## §4 Phase 2 — Process

Source: `process-locked-00.md`. Status: team-lead adjudicated 2026-05-21 (designer-authorized standing adjudication for macro step 2).

### 4.1 Session Phases — Five Named States

`OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED`

- **OPEN.** Concerns registered. No axioms yet. No Propositions permitted. No deliberation permitted.
- **ANCHORED.** Designer has asserted at least one axiom for at least one Concern. Designer continues asserting axioms across remaining Concerns. Per-Concern partial-license state — anchored Concerns differ from unanchored Concerns operationally. Poles still may not submit until DELIBERATING.
- **DELIBERATING.** At least one Concern is anchored AND designer has initiated deliberation. Poles submit Proposition records. Multiple rounds permitted. Poles may not submit against unanchored Concerns.
- **RATIFYING.** Round-end signal received from designer. Clerk lint complete (all `structural_valid` flags TRUE, all FK integrity checks pass). Designer reviews and dispositions each presented row.
- **CLOSED.** Session-close gate cleared. Deliverables frozen. Terminal state. No further mutations permitted.

### 4.2 Transitions

- `OPEN → ANCHORED` — designer asserts first axiom on any Concern.
- `ANCHORED → DELIBERATING` — designer initiates deliberation (explicit signal).
- `DELIBERATING → RATIFYING` — designer issues explicit round-end signal AND Clerk lint completes.
- `RATIFYING → DELIBERATING` — at least one row entered REVISED-PENDING via designer per-row reject, or session-close gate failed; new round opens.
- `RATIFYING → CLOSED` — session-close gate clears.

No transition fires automatically on a coverage condition. Every advance is designer-triggered.

### 4.3 Round Structure

- One round = one `DELIBERATING → RATIFYING` cycle.
- Session contains one or more rounds. No upper limit.
- Round begins at designer dispatch (or implicit on first entry to DELIBERATING).
- Round ends on explicit designer round-end signal only.
- No automatic round-close.
- Partial rounds permitted — pole abstention closes that pole's slot for that round only.
- An abstaining pole may NOT re-address the same Concern in the same round; only in the next round.

### 4.4 Ratification Flow

- Clerk lint runs on round-end signal.
- Lint checks: all `structural_valid = TRUE`, all FK integrity passes, all required fields present, ID prefixes match `source`.
- Lint completion gates entry to RATIFYING.
- Designer dispositions each row individually: **ACCEPT** (row → RATIFIED) or **REJECT** (row → REVISED-PENDING).
- Accepted rows in the same batch are not affected by peer rejections in that batch.
- Clerk flags rejection reason per row.

### 4.5 Revision Handling

- Any change to a RATIFIED row's `body`, `collapse_test`, or `grounding` triggers immediate status flip to REVISED-PENDING.
- REVISED-PENDING clears only via explicit designer re-ratification after Clerk re-lint confirms `structural_valid = TRUE`.
- No auto-clear. No declaration-clear.

### 4.6 Cascade Handling — Hybrid Timing

The four-pole-converged resolution. Two-step cascade with synchronous scope capture and deferred status mutation.

**Synchronous step (at trigger event):**
- Clerk captures cascade scope immediately.
- Source-row marks the affected `entry_id`.
- Clerk identifies all downstream rows whose `grounding` cites the affected `entry_id`, transitively, until no new IDs are added.
- Captured scope lives in Clerk's working record. No status mutation yet on dependent rows.
- Effect during DELIBERATING — Clerk surfaces invalid `entry_id`s to poles, preventing new Propositions from being submitted against now-invalid entries in the same round.

**Deferred step (at round-close lint):**
- Clerk flips all in-scope dependent rows to REVISED-PENDING.
- Coverage Map recomputed.
- Invalidation surface presented atomically — no mid-round partial-invalid state.

**Provenance-differentiated scope:**
- DESIGNER axiom revision → all PROPOSITION rows for that Concern (scope is per-Concern, not session-wide).
- AGENT Proposition revision → only rows whose `grounding` directly cites the revised `entry_id`, then transitive across the grounding chain.

### 4.7 Withdrawal Handling

- Withdrawal is permanent removal of an entry from the Constraint Envelope.
- Cascade fires immediately on withdrawal — full cascade (both scope capture AND status mutation) at the withdrawal event. **Exception to deferred timing.**
- Rationale: withdrawal is designer-initiated. Poles cannot submit Propositions against a withdrawn entry in the same round because the withdrawal is a designer action visible immediately. No mid-round race window exists.
- All rows whose `grounding` cites the withdrawn `entry_id` enter REVISED-PENDING.
- Coverage Map recomputed.
- GAP produced by withdrawal blocks session close until addressed.
- Withdrawal is irreversible. Re-entry requires a new `entry_id`.

### 4.8 Session-Close Gate

Three conditions, all required. Clerk computes; designer reads result.

1. Zero GAP rows in Coverage Map.
2. Zero REVISED-PENDING rows in Constraint Envelope.
3. Every PROPOSITION row in Constraint Envelope has exactly one matching Resolution Criterion row with `structural_valid = TRUE`.

Plus cross-artifact FK checks pass (from §3.4).

AXIOM-ONLY rows in Coverage Map do not block close — flag for designer inspection only.

Gate check fires after each per-row ratification batch in RATIFYING. If gate clears, `RATIFYING → CLOSED`. If gate fails, `RATIFYING → DELIBERATING` (new round).

### 4.9 Four-Pole Convergence Summary (macro step 2)

All seven dimensions reached four-pole agreement by R3.

- **Session phases** — five named states (Purist conceded R3).
- **Round structure** — explicit designer signal only, no auto-close (Purist conceded R2).
- **Ratification flow** — per-row designer disposition (Purist conceded R2; Innovator reversed in R2 to defend per-row).
- **Revision handling** — immediate status flip, designer re-ratification only (4-pole agreement throughout).
- **Cascade timing** — hybrid (synchronous scope, deferred mutation) — all four poles accepted R3.
- **Cascade scope** — provenance-differentiated (Conservator conceded one-hop in R2; all four converged on Innovator's scope rules + Purist's transitive depth).
- **Withdrawal handling** — immediate full cascade, irreversible (4-pole agreement throughout).
- **Session-close gate** — three Clerk-computed conditions, AXIOM-ONLY does not block (4-pole agreement throughout).

---

## §5 Phase 3 — Procedures

Source: `procedures-locked-00.md`. Status: team-lead adjudicated 2026-05-21 (designer-authorized standing adjudication for macro step 3).

Twelve named procedures. Each entry below: name, what it mutates, what triggers it, what gates it, what state effect it has.

### 5.1 Add Concern

- **Mutates** — Concerns registry: appends `CE-NNN` row. Coverage Map gains GAP row immediately (side effect of registry addition).
- **Trigger** — OPEN, ANCHORED, or DELIBERATING. Designer signal.
- **Gates** — `CE-NNN` prefix valid; uniqueness check.
- **State** — none. Phase unchanged. New Concern enters unanchored.

### 5.2 Add Evidence

- **Mutates** — Evidence registry: appends `EV-NNN` row.
- **Trigger** — any phase except CLOSED.
- **Gates** — `EV-NNN` prefix valid; uniqueness check.
- **State** — none.

### 5.3 Add Axiom

- **Mutates** — Constraint Envelope: appends `AX-NNN` row with `source = AXIOM`, `provenance = DESIGNER`, `status = RATIFIED`, `body`. On collision detection: synchronously flags conflicting `RATIFIED PROPOSITION` rows on the same Concern to `REVISED-PENDING` via cascade.
- **Trigger** — ANCHORED or DELIBERATING. Designer signal only. `provenance = DESIGNER` enforced; agents cannot call.
- **Gates** — `CE-NNN` must exist in Concerns registry; body must conform to IF/THEN architectural-altitude form (Clerk-enforced). **No collision-block — axiom always written.** Cascade scope captured synchronously for existing `PROPOSITION` rows on that Concern.
- **State** — OPEN → ANCHORED on first axiom. Late axiom in DELIBERATING: phase unchanged; cascade mutation deferred to next Lint Batch per hybrid timing (except conflicting Propositions, which are flagged immediately).

### 5.4 Initiate Deliberation

- **Mutates** — session state only.
- **Trigger** — ANCHORED. Designer explicit signal.
- **Gates** — at least one anchored Concern exists (at least one `CE-NNN` has an `AX-NNN` row).
- **State** — ANCHORED → DELIBERATING.

### 5.5 Propose Proposition

- **Mutates** — Constraint Envelope: appends `PR-NNN` row with `source = PROPOSITION`, `provenance = AGENT`, `status = REVISED-PENDING`, `body`, `collapse_test`, `grounding`. No Resolution Criterion row yet (created on Ratify ACCEPT).
- **Trigger** — DELIBERATING only. Agent signal.
- **Gates** — `CE-NNN` must exist and be anchored (has at least one `AX-NNN` row); all `grounding` `EV-NNN` exist in Evidence registry and are not in Clerk's cascade-invalidated scope; `body` in IF/THEN form; `collapse_test` in IF NOT/THEN form; **axiom-collision check: synchronous block at gate if body directly contradicts any `AX-NNN` body for same Concern** (structural negation match, not semantic).
- **State** — row pending Lint Batch.

### 5.6 Submit Round

- **Mutates** — session state only. Triggers Lint Batch.
- **Trigger** — DELIBERATING. Designer explicit signal.
- **Gates** — none pre-signal.
- **State** — fires Lint Batch; on lint pass DELIBERATING → RATIFYING.

### 5.7 Lint Batch

- **Mutates** — sets `structural_valid` flag per pending `PR-NNN` row; applies deferred cascade mutations (flips in-scope rows to REVISED-PENDING); recomputes Coverage Map; runs FK integrity checks; runs axiom-collision check on pending PROPOSITION bodies as defensive backstop (Propose Proposition gate is primary check).
- **Trigger** — Submit Round or Re-Ratify Row (context-parameterized). Round-close variant fires deferred cascade mutations; re-ratification variant does not.
- **Gates** — Clerk operation; blocks RATIFYING entry on any structural failure.
- **State** — pass → RATIFYING opens. Failure → flagged rows returned, session stays DELIBERATING.

### 5.8 Ratify Row

- **Disposition parameter** — `ACCEPT` | `REJECT`.
- **Mutates (ACCEPT)** — Constraint Envelope row `status → RATIFIED`. Resolution Criterion: appends matching row (`concern_id`, `entry_id = PR-NNN`, `collapse_test`, `structural_valid = TRUE`). RC row created here, not at Propose Proposition.
- **Mutates (REJECT)** — Constraint Envelope row `status → REVISED-PENDING`. Clerk records rejection reason.
- **Trigger** — RATIFYING. Per-row designer disposition.
- **Gates** — `structural_valid = TRUE` required; designer explicit signal per row; no auto-accept.
- **State** — accepted rows in same batch unaffected by peer rejections. After all rows dispositioned: session-close gate evaluated by Clerk.

### 5.9 Re-Ratify Row

- **Mutates** — REVISED-PENDING row `status → RATIFIED`. Resolution Criterion row created or updated if `collapse_test` was revised.
- **Trigger** — RATIFYING. Row must be REVISED-PENDING. Designer explicit re-ratification.
- **Gates** — Clerk re-lint (Lint Batch re-ratification variant) must confirm `structural_valid = TRUE` first; designer explicit signal.
- **State** — row → RATIFIED. Contributes to session-close gate evaluation.

### 5.10 Revise Row

- **Mutates** — target row body, collapse_test, or grounding. `status → REVISED-PENDING` immediately. `structural_valid` reset to FALSE. Clerk captures cascade scope synchronously (per hybrid timing).
- **Trigger** — DELIBERATING (DESIGNER for AXIOM rows; AGENT for own PROPOSITION rows — ownership enforced by Clerk matching `provenance = AGENT` and submission identity). RATIFYING: DESIGNER only (AGENT revision in RATIFYING prohibited — round is closed).
- **Gates** — `entry_id` must exist; revised fields must pass form checks.
- **State** — source row → REVISED-PENDING. Cascade dependents flagged in Clerk working record; deferred mutation fires at next Lint Batch.

### 5.11 Withdraw Entry

- **Mutates** — removes `entry_id` from Constraint Envelope entirely. Full immediate cascade (both scope capture AND status mutation, per process spec exception). Coverage Map recomputed.
- **Trigger** — any phase except CLOSED. DESIGNER only.
- **Gates** — `entry_id` must exist; withdrawal is irreversible; re-entry requires new `entry_id`.
- **State** — all rows whose `grounding` cites the withdrawn `entry_id` enter REVISED-PENDING immediately. GAP produced by withdrawal blocks session close.

### 5.12 Close Session

- **Mutates** — session state → CLOSED. Deliverables frozen. No further mutations permitted.
- **Trigger** — RATIFYING. Designer explicit close signal after all rows dispositioned. Clerk computes session-close gate from current artifact state.
- **Gates** — Clerk-computed three conditions: zero GAP rows in Coverage Map; zero REVISED-PENDING rows in Constraint Envelope; every PROPOSITION row has exactly one matching `structural_valid = TRUE` Resolution Criterion row. Designer reads gate result; designer does not compute it.
- **State** — RATIFYING → CLOSED on gate pass. RATIFYING → DELIBERATING on gate failure (with Clerk gate-failure report).

### 5.13 Four-Pole Convergence Summary (macro step 3)

Four R3 divergences converged. One required team-lead adjudication.

- **D1 — Re-Ratify Row separate procedure** — **4-pole CONVERGED**. Purist conceded R3. Distinct Clerk re-lint gate justifies separation.
- **D2 — Close Session structure** — **3-1 single procedure** (Conservator + Innovator + Purist). Pragmatist switched to split in R3 but stood alone. Locked as single procedure: no designer-observable duration between intent and gate-pass; gate computation is Clerk work inside the procedure.
- **D3 — Axiom-collision on Add Axiom side** — **2-2 split → TEAM-LEAD ADJUDICATED in favor of flow position** (Conservator + Innovator). Add Axiom does not block; conflicting Propositions flagged REVISED-PENDING via immediate cascade.
- **D4 — Axiom-collision on Propose Proposition side** — **4-pole CONVERGED**. Synchronous block at submission gate. Lint Batch retains the check as defensive backstop.
- **D5 — Same-round propose against new Concern** — **4-pole effectively CONVERGED**. Behavior is blocked in same round; mechanism is the existing anchoring gate (new Concern has no axioms → Propose Proposition gate rejects). Locked behavior: implicit via anchoring gate (no new rule needed).

### 5.14 Team-Lead Adjudication on D3 — Reasoning

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

## §6 Phase 4 — Actors

Source: `actors-locked-00.md`. Status: team-lead adjudicated 2026-05-21.

### 6.1 Role Inventory — Five Named Roles

Each entry: scope and authority surface.

#### Designer

Authority-without-mechanism. Designer holds all assertion, ratification, revision, and withdrawal authority. Designer signals all phase transitions. Designer never calls Clerk operations directly — Clerk fires automatically on procedure triggers. Designer reads Clerk-produced surfaces (lint reports, gate results, Coverage Map) and acts on them; designer does not compute any of them.

#### Pole (any of four — Conservator, Innovator, Pragmatist, Purist)

All four poles deploy against all anchored Concerns each round. No Concern-to-pole specialization. Each pole brings its lens; cross-pole tension is the load-bearing property of the four-pole structure. Poles propose Propositions and revise their own Propositions during DELIBERATING. Poles cannot ratify, withdraw, or call any designer-authority procedure.

#### Clerk

Deterministic script. No LLM layer. All Clerk operations mechanically specifiable from the locked procedures. Clerk lints, captures cascade scope, enforces FK integrity, recomputes Coverage Map, evaluates session-close gate, runs structural negation match for axiom-collision. Clerk has no deliberative surface, no synthesis, no narrative. Pure mechanical gate. (Closes D3 from framing.)

#### Team-Lead

Two scopes:

- **Dispatch Round** — non-artifact coordination signal at the start of each DELIBERATING round. Names which Concerns are open for the round. Not a locked procedure; no Clerk gate; no status mutation. Team-lead is sole caller.
- **Session-close artifact packaging** — after Close Session procedure fires and Clerk certifies the gate, team-lead reads the Clerk-certified working record state and produces the three formatted deliverable documents (Constraint Envelope, Resolution Criterion, Coverage Map) in consumer-ready form for `design-specify` handoff. Mechanical extraction only — no synthesis, no editorial judgment, no procedure calls.

Team-lead never calls any locked procedure. Team-lead has no deliberative surface.

#### Researcher

Add Evidence only (locked procedure call). May query the Evidence registry (read-only — `EV-NNN` existence, source, summary) to locate grounding for pole requests. May NOT access Clerk's working record (cascade-scope index, submission index, status fields are Clerk-internal). Consultable at any phase except CLOSED. Not a round attendee — "attendance" is not a concept in the locked procedures.

### 6.2 Procedure-to-Actor Mapping

Twelve locked procedures plus the team-lead non-procedure operation Dispatch Round.

- **Add Concern** — DESIGNER only.
- **Add Evidence** — DESIGNER or RESEARCHER.
- **Add Axiom** — DESIGNER only. `provenance = DESIGNER` structurally enforced; no other role may call.
- **Initiate Deliberation** — DESIGNER only. No delegation.
- **Propose Proposition** — POLE only (any of four). One `PR-NNN` per `(round_number, pole_id, concern_id)` tuple; Clerk enforces at submission gate using working-record submission index.
- **Submit Round** — DESIGNER only. No delegation. No team-lead intermediary.
- **Lint Batch** — CLERK only. Triggered automatically by Submit Round or Re-Ratify Row. No caller access.
- **Ratify Row** — DESIGNER only. Per-row ACCEPT or REJECT.
- **Re-Ratify Row** — DESIGNER only. After Clerk re-lint confirms `structural_valid = TRUE`.
- **Revise Row** — DESIGNER (AXIOM rows, any phase except CLOSED); POLE (own PROPOSITION rows, DELIBERATING only — ownership enforced by Clerk matching `provenance + submission identity`).
- **Withdraw Entry** — DESIGNER only.
- **Close Session** — DESIGNER signal; CLERK gate computation. Two-actor procedure: designer triggers, Clerk certifies.
- **Dispatch Round** (not a locked procedure) — TEAM-LEAD only. Non-artifact coordination signal at round open.

### 6.3 Designer Surface Per Phase

- **OPEN** — Add Concern, Add Evidence.
- **ANCHORED** — Add Concern, Add Evidence, Add Axiom, Initiate Deliberation.
- **DELIBERATING** — Add Concern (late), Add Evidence, Add Axiom (late), Revise Row (AXIOM rows only), Withdraw Entry, Submit Round.
- **RATIFYING** — Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows only), Withdraw Entry, Close Session.
- **CLOSED** — no procedures available. Read-only.

Designer reads Clerk-produced surfaces at every phase; designer never computes them.

### 6.4 Four-Pole Convergence Summary (macro step 4)

Macro step 4 produced the strongest convergence of any step. R2 reached four-pole agreement on every dimension except one. R3 resolved that one with a 3-1 vote.

- **D1 — Clerk role (D3 from framing)** — **4-pole CONVERGED** on deterministic script. Conservator conceded conditionally in DM ("on condition the negation-match rule is fully specified"); Innovator + Purist + Pragmatist confirmed condition is met. Pragmatist principle universally endorsed: "complete the spec; do not substitute LLM judgment for a missing rule."
- **D2 — Submit Round actor** — **4-pole CONVERGED** on DESIGNER direct. Conservator conceded R2; team-lead intermediary is unspecified indirection that fails on tired Tuesday.
- **Procedure-to-actor mapping (all 12 procedures)** — **4-pole CONVERGED** by R2.
- **Pole deployment** — **4-pole CONVERGED**. All four poles, all anchored Concerns, no specialization. Submission identity `(round_number, pole_id, concern_id)` tracked in Clerk working record.
- **Initiate Deliberation delegation** — **4-pole CONVERGED**. Designer-only, no delegation. Purist self-conceded R1 DM; Conservator conceded R2.
- **Researcher cascade-scope access** — **4-pole CONVERGED**. Restricted. Add Evidence only plus Evidence registry read-only queries. No Clerk working-record access.
- **Dispatch Round** — **4-pole CONVERGED**. Team-lead non-procedure coordination act. Innovator named it explicitly in R2; others agreed it is out-of-band coordination not requiring a locked procedure.

### 6.5 Team-Lead Adjudication on Team-Lead Session-Close Role

R3 produced a 3-1 split with role-flip drama: Conservator conceded to cut (his R2 position held the role); Pragmatist conceded to keep (his R2 position cut the role). Innovator + Purist held team-lead extraction throughout.

**Adjudication: keep team-lead session-close extraction** (Innovator + Pragmatist + Purist majority).

Reasoning:

- **Pragmatist's R3 concession argument is the strongest** — "Clerk's working record is an internal state structure keyed for computation, not a formatted handoff document; producing consumer-ready deliverable documents for `design-specify` is a formatting and presentation act that Clerk's mechanical role does not include by definition." Three poles independently agreed that Clerk certification and handoff formatting are distinct operations.
- **Innovator's Lens 1 argument** — merging gate-check and formatting into one procedure violates singular-purpose discipline. Close Session = gate check; Team-lead Session-Close Packaging = formatting. Two distinct outputs, two distinct actors.
- **Purist's sequential-acts framing** — Clerk certifies; team-lead packages. Sequential, not redundant. No overlap because the operations happen at different points (Clerk freezes state; team-lead reads frozen state).
- **Conservator's CONCEDE argument** — "the schema is already consumer-facing, Clerk can emit directly" — is structurally plausible but conflates the in-memory working record with the on-disk handoff document. Working record holds the rows; handoff document is the formatted file `design-specify` reads. The transformation is mechanical but exists.

Team-lead session-close role is **mechanical extraction and formatting only**. No synthesis. No editorial judgment. No procedure calls. The role exists in the gap between Clerk-certified state and `design-specify`-consumable document.

---

## §7 Risks Carried Forward

From `design-brief-for-specify-00.md` §10. Each accepted at FAC or surfaced during macro-step design.

- **R-1 — Cascade-invalidation regression** (accepted at FAC). The Clerk's deferred mutation surfaces inconsistency at round close rather than preventing it at submission. Designer ratification is the load-bearing semantic gate. Specify: the Clerk lint report must explicitly enumerate every row whose status changed via deferred cascade, distinguishable from rows the designer is ratifying directly.
- **R-2 — Designer axiom-assertion quality** (accepted at FAC). Axioms may be sparse if the designer arrives at a Concern with no pre-deliberation clarity. AXIOM-ONLY and zero-axiom Concerns are both legal. Specify: the Coverage Map status must distinguish the two cases (COVERED with `axiom_ids` non-empty vs. COVERED with `axiom_ids` empty) so the designer can audit axiom density across sessions over time.
- **R-3 — Field-shape rigor under deadline pressure** (accepted at FAC). The IF/THEN `body` and IF NOT/THEN `collapse_test` fields are mechanically lint-checkable for shape but not for semantic content. Designer ratification is the semantic gate. Specify: the Clerk lint report must surface each row's `body` and `collapse_test` verbatim to the designer at Ratify Row time — no summary, no synopsis, no Translation Gate (designer reads the raw schema content).
- **R-4 — Word-cap discipline maintenance over time** (new at brief). Future edits to `skill.md` and `rules.md` may exceed the cap without notice if the lint is not wired into a pre-merge gate. Specify: the lint runs as a pre-commit hook OR a CI check in the repo where the skill files live. Failure blocks the commit / blocks the merge.
- **R-5 — Clerk script maintenance burden** (new at brief). The Clerk script must remain a deterministic mechanical specification of the locked procedures. Drift toward heuristic behavior is a discipline risk. Specify: the Clerk script has its own test surface — unit tests for each procedure's gate predicates, integration tests for round-cycle behavior, golden-file tests for FK integrity and Coverage Map recomputation.
- **R-6 — Team-lead session-close packaging discipline** (new at brief). Team-lead is mechanical extraction only at session close — no synthesis, no editorial judgment, no procedure calls. The line between "mechanical extraction" and "summary writing" can erode under prompt drift. Specify: the team-lead prompt for session-close packaging is a strict template-fill from the working record. The Clerk-certified working record provides the content verbatim; team-lead reformats for the §3 + §4 + §5 + §6 shape and signs off.

---

## §8 Implementation Work Outstanding

Per `handoff-pre-skill-write-00.md`. The skill files to write live at:

- `skills/design-architect-committee/skill.md` — **200-word cap** (frontmatter excluded). Operator-facing: when to invoke, what it does, what it produces. No mechanics.
- `skills/design-architect-committee/rules.md` — **200-word cap** (frontmatter excluded). The discipline. What actors may do. What actors may not do. Honors all ten lenses.
- `skills/design-architect-committee/schema/` — directory, word-limit exempt. Field shapes, closed-set enumerations, integrity rules from `deliverables-locked-00.md`.
- `skills/design-architect-committee/design-brief-template.md` — word-limit exempt. Worked example proving the schema produces all three deliverables.

Plus supporting machinery the build spec must specify (per `design-brief-for-specify-00.md` §8.5–§8.8):

- **Clerk script.** Language and runtime (recommend Python). Repo location (`skills/design-architect-committee/clerk/`). Invocation triggers (auto-fired by Submit Round, Re-Ratify Row, Add Axiom collision-flag, Revise Row, Withdraw Entry, Close Session). Working-record format (JSON or YAML file in the session's working directory). Structural-negation-match algorithm.
- **Team-lead dispatch convention.** How team-lead invokes the four pole subagents at round open. Cite existing `chester:design-large-task-step-b-*` agents or define new `chester:design-architect-committee-*` agents. Caveman ultra mandatory for inter-agent prompts per AX-008.
- **Session-close hand-off shape.** On-disk hand-off file the team-lead produces from the Clerk-certified working record. This file is what `design-specify` reads. Recommended shape: exactly the §3 + §4 + §5 + §6 + §7 shape from `design-brief-for-specify-00.md`.
- **Working-directory layout.** Per Chester convention `docs/chester/working/<sprint-name>/`. Where the working record lives, where pole returns persist (one file per pole per round, verbatim), where the Evidence registry lives, where the hand-off file lands.

### Source Mapping (locked specs → skill files)

- `skill.md` ← extract from `actors-locked-00.md` (when to invoke / what it produces) + `process-locked-00.md` (session lifecycle one-liner). Five sections in 200 words.
- `rules.md` ← extract from `actors-locked-00.md` (role discipline) + `procedures-locked-00.md` (procedure gates) + `process-locked-00.md` (cascade/revision/withdrawal rules). Cap by forward-referencing schema/ for enumerations.
- `schema/` ← `deliverables-locked-00.md` field-by-field, plus `procedures-locked-00.md` gate predicates, plus `process-locked-00.md` status enums and phase-transition table. Dense by necessity.
- `design-brief-template.md` ← worked StoryDesigner-flavored example: one Concern, one or two axioms, one or two Propositions, populated Coverage Map. Prove the three artifacts emerge by read.

### Post-Write Checklist

After writing the four files, confirm:

- `skill.md` ≤ 200 words (frontmatter excluded).
- `rules.md` ≤ 200 words (frontmatter excluded).
- `schema/` is dense but not bloated — closed-set enumerations only, no narrative.
- `design-brief-template.md` is a real worked example, not abstract.
- All three artifacts (Constraint Envelope, Resolution Criterion, Coverage Map) emerge by read from the populated template.

---

## §9 Relation to the Redesigned General Committee

The general `chester:design-committee` skill was redesigned in sprint `20260521-design-committee-update` (sister sprint to this one). The redesign produced a **Mode A vs Mode B** distinction:

- **Mode A (general).** Process-agnostic ad-hoc committee invocation. Bare convening message. No Clerk, no gates, no sprint-specific overlay. Six roles: team-lead + 4 poles + researcher.
- **Mode B (skill-wrapped).** A named skill — `design-architect-committee` is the canonical example — wraps the same four-pole team and adds sprint-specific instructions via the convening message. The wrapping skill provides the Clerk, the locked schemas, the gate logic, and the session lifecycle.

The Alternative F architecture sits on Mode B by construction. The wrapping skill rides on the convening-message-only attach point established by the general redesign. The Clerk role is injected via that convening message, not built into the general primitive. The Translation Gate established in the general SKILL.md is preserved at consolidation as a load-bearing primitive — the wrapping skill cannot weaken or substitute it (per the floor-not-ceiling rule).

Three forbidden attach surfaces from the general redesign apply to this wrapping skill too:

1. **Agent files** — must not be modified to carry sprint-specific instructions.
2. **General `design-committee/SKILL.md`** — must not be modified to absorb wrapping-skill conventions.
3. **Output-format field labels** — must not be redefined; only appended.

The `design-architect-committee` skill operates within these constraints.

---

## §10 File Pointers for the Next Agent

### Locked Spec Files (read these for full detail)

- `design/deliverables-locked-00.md` — full deliverables spec.
- `design/process-locked-00.md` — full process spec.
- `design/procedures-locked-00.md` — full procedures spec.
- `design/actors-locked-00.md` — full actors spec.
- `design/fac-recommendation-and-aoa-00.md` — Alternative F ratification.
- `prior-art/lens-criteria-for-fac-options.md` — ten designer-set lenses.

### Other In-Folder Artifacts

- `prior-art/` — moved from the original session for context preservation.

### Sister-Sprint Cross-References (in `20260521-design-committee-update/`)

- `design/r1-mode-separation-decision-00.md` — Mode A vs Mode B contract floor.
- `design/r2-open-questions-decision-00.md` — convening-message attach point, three forbidden surfaces, editorial-discipline enforcement.
- `design/industry-research-plugin-resolver-00.md` — plugin manifest mechanics (relevant if this wrapping skill needs custom subagent files).
- `summary/20260521-design-committee-update-summary-00.md` — full record of the general redesign that this skill rides on.

### Skill File Targets (to be written)

- `skills/design-architect-committee/skill.md` (empty skeleton present)
- `skills/design-architect-committee/rules.md` (empty skeleton present)
- `skills/design-architect-committee/schema/` (empty directory present)
- `skills/design-architect-committee/design-brief-template.md` (empty skeleton present)

### Existing Vision Document

- `docs/storydesigner/01-vision.md` — designer-authored Vision binding the entire design system (Sec 1, Sec 2, Sec 2.2, Sec 2.6, Sec 3.3, Sec 4 cited throughout). Required reading for any agent picking up this work.

---

## Change Log

- **00 (2026-05-22):** Initial detailed handoff. Compiles all four macro-step locked specs into one navigable document with cross-cutting axioms, risks, implementation work, and Mode A/B relation surfaced.
