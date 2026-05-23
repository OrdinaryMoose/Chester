# Actors — Locked Specification

**File:** `actors-locked-00.md`
**Status:** Team-lead adjudicated 2026-05-21 (designer-authorized standing adjudication for macro step 4)
**Macro step:** 4 of 4 (actors) — COMPLETE
**Source:** four-pole convergence (R1 → R1 DM → R2 → R3) plus team-lead synthesis on team-lead session-close role
**Round count:** three rounds + DM, twelve verbatim files on disk
**Date:** 2026-05-21
**Closes:** D3 from framing (Clerk role scope)

---

## Role inventory

Five named roles. Each entry: scope and authority surface.

### Designer

Authority-without-mechanism. Designer holds all assertion, ratification, revision, and withdrawal authority. Designer signals all phase transitions. Designer never calls Clerk operations directly — Clerk fires automatically on procedure triggers. Designer reads Clerk-produced surfaces (lint reports, gate results, Coverage Map) and acts on them; designer does not compute any of them.

### Pole (any of four — Conservator, Innovator, Pragmatist, Purist)

All four poles deploy against all anchored Concerns each round. No Concern-to-pole specialization. Each pole brings its lens; cross-pole tension is the load-bearing property of the four-pole structure. Poles propose Propositions and revise their own Propositions during DELIBERATING. Poles cannot ratify, withdraw, or call any designer-authority procedure.

### Clerk

Deterministic script. No LLM layer. All Clerk operations mechanically specifiable from the locked procedures. Clerk lints, captures cascade scope, enforces FK integrity, recomputes Coverage Map, evaluates session-close gate, runs structural negation match for axiom-collision. Clerk has no deliberative surface, no synthesis, no narrative. Pure mechanical gate. (Closes D3 from framing.)

### Team-lead

Two scopes:

- **Dispatch Round** — non-artifact coordination signal at the start of each DELIBERATING round. Names which Concerns are open for the round. Not a locked procedure; no Clerk gate; no status mutation. Team-lead is sole caller.
- **Session-close artifact packaging** — after Close Session procedure fires and Clerk certifies the gate, team-lead reads the Clerk-certified working record state and produces the three formatted deliverable documents (Constraint Envelope, Resolution Criterion, Coverage Map) in consumer-ready form for design-specify handoff. Mechanical extraction only — no synthesis, no editorial judgment, no procedure calls.

Team-lead never calls any locked procedure. Team-lead has no deliberative surface.

### Researcher

Add Evidence only (locked procedure call). May query the Evidence registry (read-only — EV-NNN existence, source, summary) to locate grounding for pole requests. May NOT access Clerk's working record (cascade-scope index, submission index, status fields are Clerk-internal). Consultable at any phase except CLOSED. Not a round attendee — "attendance" is not a concept in the locked procedures.

---

## Procedure-to-actor mapping

Twelve locked procedures plus the team-lead non-procedure operation Dispatch Round.

- **Add Concern** — DESIGNER only.
- **Add Evidence** — DESIGNER or RESEARCHER.
- **Add Axiom** — DESIGNER only. `provenance = DESIGNER` structurally enforced; no other role may call.
- **Initiate Deliberation** — DESIGNER only. No delegation.
- **Propose Proposition** — POLE only (any of four). One PR-NNN per `(round_number, pole_id, concern_id)` tuple; Clerk enforces at submission gate using working-record submission index.
- **Submit Round** — DESIGNER only. No delegation. No team-lead intermediary.
- **Lint Batch** — CLERK only. Triggered automatically by Submit Round or Re-Ratify Row. No caller access.
- **Ratify Row** — DESIGNER only. Per-row ACCEPT or REJECT.
- **Re-Ratify Row** — DESIGNER only. After Clerk re-lint confirms `structural_valid = TRUE`.
- **Revise Row** — DESIGNER (AXIOM rows, any phase except CLOSED); POLE (own PROPOSITION rows, DELIBERATING only — ownership enforced by Clerk matching `provenance + submission identity`).
- **Withdraw Entry** — DESIGNER only.
- **Close Session** — DESIGNER signal; CLERK gate computation. Two-actor procedure: designer triggers, Clerk certifies.
- **Dispatch Round** (not a locked procedure) — TEAM-LEAD only. Non-artifact coordination signal at round open.

---

## Designer surface per phase

- **OPEN** — Add Concern, Add Evidence.
- **ANCHORED** — Add Concern, Add Evidence, Add Axiom, Initiate Deliberation.
- **DELIBERATING** — Add Concern (late), Add Evidence, Add Axiom (late), Revise Row (AXIOM rows only), Withdraw Entry, Submit Round.
- **RATIFYING** — Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows only), Withdraw Entry, Close Session.
- **CLOSED** — no procedures available. Read-only.

Designer reads Clerk-produced surfaces at every phase; designer never computes them.

---

## Four-pole convergence summary

Macro step 4 produced the strongest convergence of any step. R2 reached four-pole agreement on every dimension except one. R3 resolved that one with a 3-1 vote.

- **D1 — Clerk role (D3 from framing)** — **4-pole CONVERGED** on deterministic script. Conservator conceded conditionally in DM ("on condition the negation-match rule is fully specified"); Innovator + Purist + Pragmatist confirmed condition is met. Pragmatist principle universally endorsed: "complete the spec; do not substitute LLM judgment for a missing rule."
- **D2 — Submit Round actor** — **4-pole CONVERGED** on DESIGNER direct. Conservator conceded R2; team-lead intermediary is unspecified indirection that fails on tired Tuesday.
- **Procedure-to-actor mapping (all 12 procedures)** — **4-pole CONVERGED** by R2.
- **Pole deployment** — **4-pole CONVERGED**. All four poles, all anchored Concerns, no specialization. Submission identity `(round_number, pole_id, concern_id)` tracked in Clerk working record.
- **Initiate Deliberation delegation** — **4-pole CONVERGED**. Designer-only, no delegation. Purist self-conceded R1 DM; Conservator conceded R2.
- **Researcher cascade-scope access** — **4-pole CONVERGED**. Restricted. Add Evidence only plus Evidence registry read-only queries. No Clerk working-record access.
- **Dispatch Round** — **4-pole CONVERGED**. Team-lead non-procedure coordination act. Innovator named it explicitly in R2; others agreed it is out-of-band coordination not requiring a locked procedure.

## Team-lead adjudication on team-lead session-close role

R3 produced a 3-1 split with role-flip drama: Conservator conceded to cut (his R2 position held the role); Pragmatist conceded to keep (his R2 position cut the role). Innovator + Purist held team-lead extraction throughout.

**Adjudication: keep team-lead session-close extraction** (Innovator + Pragmatist + Purist majority).

Reasoning:

- **Pragmatist's R3 concession argument is the strongest** — "Clerk's working record is an internal state structure keyed for computation, not a formatted handoff document; producing consumer-ready deliverable documents for design-specify is a formatting and presentation act that Clerk's mechanical role does not include by definition." Three poles independently agreed that Clerk certification and handoff formatting are distinct operations.
- **Innovator's Lens 1 argument** — merging gate-check and formatting into one procedure violates singular-purpose discipline. Close Session = gate check; Team-lead Session-Close Packaging = formatting. Two distinct outputs, two distinct actors.
- **Purist's sequential-acts framing** — Clerk certifies; team-lead packages. Sequential, not redundant. No overlap because the operations happen at different points (Clerk freezes state; team-lead reads frozen state).
- **Conservator's CONCEDE argument** — "the schema is already consumer-facing, Clerk can emit directly" — is structurally plausible but conflates the in-memory working record with the on-disk handoff document. Working record holds the rows; handoff document is the formatted file design-specify reads. The transformation is mechanical but exists.

Team-lead session-close role is **mechanical extraction and formatting only**. No synthesis. No editorial judgment. No procedure calls. The role exists in the gap between Clerk-certified state and design-specify-consumable document.

---

## What this artifact does NOT specify

The actors-locked spec completes the four macro-step backwards sequence. Deliverables, process, procedures, and actors are all locked. What remains is the skill-files write — the four operator-facing files that encode all four locked specs into the production skill.

- `skill.md` (200-word cap)
- `rules.md` (200-word cap)
- `schema/` (word-limit exempt)
- `design-brief-template.md` (word-limit exempt)

Those four files draw their content from the four locked specs:
- skill.md → operator-facing summary (when to invoke, what it does, what it produces).
- rules.md → operator-facing discipline (what the actors may do, what they may not do).
- schema/ → field shapes, enumerations, integrity rules from deliverables-locked.
- design-brief-template.md → worked example proving the schema produces the three artifacts.

That write step is the next work, not a deliberation step.
