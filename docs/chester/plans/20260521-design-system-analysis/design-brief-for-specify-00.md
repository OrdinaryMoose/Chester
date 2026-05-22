# Design Brief — `design-architect-committee` Skill

**File:** `design-brief-for-specify-00.md`
**Issued by:** team-lead, on behalf of the design-system-analysis Committee
**Issued on:** 2026-05-21
**Status:** Ratified at session close (informal — see Methodology Note)
**Recipient:** `design-specify` (next sprint phase)
**Purpose:** Hand-off package containing every architectural decision needed to produce the build specification for the `design-architect-committee` skill. Design-specify reads this brief and produces an implementation-level spec. No further architectural deliberation required.

---

## 1. Subject

A new Chester skill named `design-architect-committee`. It runs four-pole committee design sessions producing three frozen artifacts (Constraint Envelope, Resolution Criterion, Coverage Map) for downstream consumption by `design-specify`. The skill replaces the legacy proof-MCP-anchored design session pattern with the **Channeled Single-Layer Schema with Designer Axiom-Anchoring** architecture ratified in `fac-recommendation-and-aoa-00.md` (Alternative F).

The implementation lives at:

- `design-architect-committee/skill.md` — operator-facing invocation surface (≤ 200 words).
- `design-architect-committee/rules.md` — per-actor discipline (≤ 200 words).
- `design-architect-committee/schema/` — field shapes, enumerations, integrity rules, phase transitions (word-limit exempt).
- `design-architect-committee/design-brief-template.md` — worked example proving the schema produces all three artifacts (word-limit exempt).

Plus supporting machinery the build spec must specify:

- A deterministic Clerk script (no LLM layer — D3 closed).
- A working-record file format used between rounds and across context shifts.
- A team-lead dispatch convention for round invocation of the four poles.
- A session-close hand-off shape that `design-specify` consumes.

---

## 2. Methodology Note (read before consuming the artifacts below)

This brief was authored at the close of a four-step backwards-macro design session that ran in this folder. The four macro steps locked, in reverse-final order: deliverables → process → procedures → actors. Each step ran three rounds plus DM (or DM + three rounds) of four-pole committee deliberation with team-lead adjudication on remaining splits. Verbatim per-round pole returns persist as `r{1..3}-{deliverables|process|procedures|actors}-{pole}-00.md` (and `r1-dm-*` variants) — fifty-two files total.

The Alternative F schema was not yet in production when this session ran, so the session executed informally. The three artifacts below (§4, §5, §6) are produced **post-hoc** by reading the four locked specs as if they had been authored through the Alternative F procedure. This is the elegant self-application: the skill works on its own design. The artifacts are not "fake" — they are the real ratified architectural state — they are simply expressed in the form the new skill would have produced natively.

Design-specify should treat the §4/§5/§6 artifacts as the architectural input. The "where this came from" trail lives in `actors-locked-00.md`, `procedures-locked-00.md`, `process-locked-00.md`, `deliverables-locked-00.md`, and the verbatim pole returns.

---

## 3. Concerns Index

Ten Concerns frame the skill's architecture. Each receives a typed-prefix ID and a one-line problem statement. Detailed coverage in §6.

- **CE-001** — What artifacts does each committee session produce, and what fields do they carry?
- **CE-002** — How does a session progress from open Concerns to ratified deliverables?
- **CE-003** — What operations mutate the session's working record and artifacts?
- **CE-004** — Who performs each operation, and what authority surfaces exist?
- **CE-005** — How does the skill handle a designer-asserted axiom that contradicts a ratified pole Proposition?
- **CE-006** — How does the Clerk avoid LLM judgment while still enforcing the schema?
- **CE-007** — How are cascade-invalidation timing trade-offs resolved without a proof engine?
- **CE-008** — How is permanent removal of a ratified entry (withdrawal) handled?
- **CE-009** — What conditions must clear before a session may close?
- **CE-010** — How is word-cap discipline preserved across the skill's operator-facing files?

---

## 4. Constraint Envelope

Per the locked deliverables schema: five fields per row — `concern_id`, `entry_id` (typed prefix `AX-NNN` or `PR-NNN`), `source` (AXIOM | PROPOSITION), `body` (IF/THEN architectural-altitude claim), `provenance` (DESIGNER | AGENT), `status` (RATIFIED | REVISED-PENDING).

AXIOM rows ordered first, then PROPOSITION rows. Both grouped by `concern_id`. All rows in this brief carry `status = RATIFIED`. Read-out below.

### 4.1 Axioms (designer-asserted ground truth)

- **AX-001** (cross-cutting, anchored to CE-005)
  - `source` — AXIOM. `provenance` — DESIGNER.
  - `body` — IF the design system needs ratified constraints before specify THEN the architecture is **Alternative F (Channeled Single-Layer Schema with Designer Axiom-Anchoring)** with no proof engine, no Datalog, and no closure-gate query.
  - Grounding context — `fac-recommendation-and-aoa-00.md` Executive Summary + Recommendation section.

- **AX-002** (cross-cutting, anchored to CE-004)
  - `source` — AXIOM. `provenance` — DESIGNER.
  - `body` — IF the Committee deploys against a Concern THEN it deploys exactly **four poles — Conservator, Innovator, Pragmatist, Purist** — with no fifth pole and no Arbiter role.
  - Grounding context — `fac-recommendation-and-aoa-00.md` (Committee preservation) + designer ruling "lets dispand arbiter" at session start.

- **AX-003** (cross-cutting, anchored to CE-010)
  - `source` — AXIOM. `provenance` — DESIGNER.
  - `body` — IF a skill file is `skill.md` or `rules.md` THEN its body content (frontmatter excluded) shall not exceed **200 words**. Schema files and `design-brief-template.md` are word-limit exempt.
  - Grounding context — designer ruling "no relief from the word limits; no more comments on this."

- **AX-004** (cross-cutting, anchored to CE-006 + CE-007 + CE-009)
  - `source` — AXIOM. `provenance` — DESIGNER.
  - `body` — IF a session's operational time is measured THEN at least **90% is design planning** and at most **10% is admin processing** (90/10 budget).
  - Grounding context — designer-set Lens 10 in `lens-criteria-for-fac-options.md`.

- **AX-005** (cross-cutting, anchored to CE-005 + CE-008)
  - `source` — AXIOM. `provenance` — DESIGNER.
  - `body` — IF a procedure mutates session state THEN designer authority is **unconditional** (Add Axiom, Ratify Row, Withdraw Entry, Close Session may not be blocked by agent content) and agent authority is **propose-revise-withdraw-bounded** (poles may not ratify, withdraw, or call any designer procedure). This is the **two-player asymmetric authority** from Vision Sec 2.6.
  - Grounding context — Vision Sec 2.6 (referenced throughout FAC).

- **AX-006** (cross-cutting, anchored to CE-006)
  - `source` — AXIOM. `provenance` — DESIGNER.
  - `body` — IF an agent produces output THEN that agent **does not check its own work** (Lens 9). External validation only.
  - Grounding context — `lens-criteria-for-fac-options.md` Lens 9.

- **AX-007** (cross-cutting, anchored to CE-006)
  - `source` — AXIOM. `provenance` — DESIGNER.
  - `body` — IF the skill's design is evaluated THEN it shall satisfy all **ten lenses** in `lens-criteria-for-fac-options.md` simultaneously. No lens is optional.
  - Grounding context — `lens-criteria-for-fac-options.md` (full document).

- **AX-008** (cross-cutting, anchored to CE-010)
  - `source` — AXIOM. `provenance` — DESIGNER.
  - `body` — IF inter-agent communication occurs during deliberation THEN it uses **caveman ultra**. IF a skill file is read by the designer THEN it uses normal terse markdown — caveman ultra does not propagate to designer-facing surfaces.
  - Grounding context — designer ruling "make sure caveman ultra is active for all of the agents" + handoff-doc rule "Caveman ultra retired for skill files."

### 4.2 Propositions (committee-ratified)

- **PR-001** (on CE-001 — artifacts produced)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF a `design-architect-committee` session reaches CLOSED THEN it produces exactly **three frozen deliverables**: Constraint Envelope, Resolution Criterion, Coverage Map. No other deliverables exist.
  - Grounding context — `deliverables-locked-00.md` §"Three deliverables".

- **PR-002** (on CE-002 — phase lifecycle)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF a session is in progress THEN its current phase is exactly one of **five named states**: OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED. Every transition is designer-signaled; no auto-advance.
  - Grounding context — `process-locked-00.md` §"Session phases".

- **PR-003** (on CE-003 — procedure inventory)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF an artifact or working-record mutation occurs THEN exactly **one of twelve named procedures** fires: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation, Propose Proposition, Submit Round, Lint Batch, Ratify Row, Re-Ratify Row, Revise Row, Withdraw Entry, Close Session. The team-lead non-procedure Dispatch Round signals round open and mutates nothing.
  - Grounding context — `procedures-locked-00.md` §"Procedure inventory".

- **PR-004** (on CE-004 — actors and authority)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF a procedure fires THEN exactly one of **five named roles** is the authorized caller: Designer, Pole (any of four), Clerk, Team-lead, Researcher. Designer holds all assertion and ratification authority; poles propose Propositions only during DELIBERATING; Clerk runs mechanical operations; team-lead dispatches and packages; Researcher adds Evidence on demand.
  - Grounding context — `actors-locked-00.md` §"Role inventory" + §"Procedure-to-actor mapping".

- **PR-005** (on CE-005 — axiom collision)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF designer asserts an axiom whose body structurally negates a RATIFIED Proposition on the same Concern THEN **Add Axiom flows** (the axiom is written) and the conflicting Proposition's status flips to REVISED-PENDING via synchronous cascade-flag. IF pole submits a Proposition whose body structurally negates a RATIFIED axiom on the same Concern THEN the **Propose Proposition gate blocks** the submission at the Clerk's synchronous structural-negation match.
  - Grounding context — `procedures-locked-00.md` §"Team-lead adjudication on D3" + `r3-procedures-conservator-00.md` + `r3-procedures-innovator-00.md`.

- **PR-006** (on CE-006 — Clerk shape)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF a Clerk operation fires THEN it executes as a **deterministic script** (no LLM layer). All Clerk operations — Lint Batch, FK integrity, Coverage Map recompute, session-close gate, axiom-collision structural-negation match, cascade scope capture, cascade deferred mutation — are mechanically specifiable from the locked procedures. The Clerk has no deliberative surface, no synthesis, no narrative.
  - Grounding context — `actors-locked-00.md` §"Clerk" + `r3-actors-*` four-pole convergence (D1).

- **PR-007** (on CE-007 — cascade timing)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF a cascade trigger fires (Add Axiom collision, Revise Row, withdrawal — except withdrawal handled separately) THEN the Clerk performs **synchronous scope capture** at the trigger event and **deferred status mutation** at the next Lint Batch. Scope captured per-Concern for designer-axiom triggers; transitive on grounding chain for pole-Proposition triggers.
  - Grounding context — `process-locked-00.md` §"Cascade handling — hybrid timing".

- **PR-008** (on CE-008 — withdrawal)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF Withdraw Entry fires THEN the affected `entry_id` is permanently removed from the Constraint Envelope, and **both scope capture and status mutation fire immediately** (exception to hybrid cascade timing). All grounding citations of the withdrawn entry flip to REVISED-PENDING in the same operation. Withdrawal is irreversible; re-entry requires a new `entry_id`.
  - Grounding context — `process-locked-00.md` §"Withdrawal handling".

- **PR-009** (on CE-009 — session close)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF Close Session fires THEN the Clerk evaluates **three gate conditions**: zero `GAP` rows in Coverage Map; zero `REVISED-PENDING` rows in Constraint Envelope; every PROPOSITION row has exactly one matching Resolution Criterion row with `structural_valid = TRUE`. Plus cross-artifact FK integrity. AXIOM-ONLY Coverage Map rows do not block close — they surface for designer inspection only. Gate pass → CLOSED. Gate fail → RATIFYING → DELIBERATING new round.
  - Grounding context — `process-locked-00.md` §"Session-close gate" + `procedures-locked-00.md` §"Close Session".

- **PR-010** (on CE-010 — word-cap discipline)
  - `source` — PROPOSITION. `provenance` — AGENT. `status` — RATIFIED.
  - `body` — IF `skill.md` or `rules.md` is authored or modified THEN body word count (frontmatter excluded) is **mechanically lint-checked** against the 200-word cap. Schema files and `design-brief-template.md` are exempt. Cap failure blocks merge; no relief.
  - Grounding context — designer ruling at framing-review consolidation + `framing-review-consolidation-00.md` (Pragmatist veto rejected; cap restructured, not removed).

Read-out summary: ten ratified Propositions, eight ratified Axioms. Mapping to Concerns in §6 Coverage Map.

---

## 5. Resolution Criterion

Per the locked deliverables schema: four fields per row — `concern_id`, `entry_id` (PR-NNN only), `collapse_test` (IF NOT/THEN contrapositive), `structural_valid` (BOOL). AXIOM rows excluded (designer-asserted ground truth has no failure condition).

One row per ratified Proposition. All rows below show `structural_valid = TRUE` (Clerk-set after syntactic contrapositive match).

- **RC for PR-001** (CE-001)
  - `collapse_test` — IF NOT all three frozen deliverables (Constraint Envelope, Resolution Criterion, Coverage Map) are present at session close THEN `design-specify` cannot consume the session output and the skill has failed its singular purpose.
  - `structural_valid` — TRUE.

- **RC for PR-002** (CE-002)
  - `collapse_test` — IF NOT every phase transition is designer-signaled THEN the skill has admitted an auto-advance path, which inverts Vision Sec 2.6 two-player asymmetric authority by allowing agent content or Clerk computation to drive session state.
  - `structural_valid` — TRUE.

- **RC for PR-003** (CE-003)
  - `collapse_test` — IF NOT every artifact mutation traces to exactly one of the twelve named procedures THEN there exists at least one unspecified mutation path, which means the skill cannot guarantee replayability from the working record.
  - `structural_valid` — TRUE.

- **RC for PR-004** (CE-004)
  - `collapse_test` — IF NOT every procedure has exactly one authorized calling role THEN authority is ambiguous and the two-player asymmetric structure collapses.
  - `structural_valid` — TRUE.

- **RC for PR-005** (CE-005)
  - `collapse_test` — IF NOT Add Axiom flows past a collision (block instead) THEN designer authority is held hostage by prior agent content, which inverts Vision Sec 2.6. IF NOT Propose Proposition blocks at axiom-collision (flow instead) THEN ratified agent content can directly contradict designer-asserted ground truth without any synchronous resolution, which produces an inconsistent ratified set at round close.
  - `structural_valid` — TRUE.

- **RC for PR-006** (CE-006)
  - `collapse_test` — IF NOT every Clerk operation is mechanically specifiable THEN LLM judgment substitutes for spec gaps at runtime, which violates Lens 9 (agents do not check their own work — Clerk would become a self-checking agent).
  - `structural_valid` — TRUE.

- **RC for PR-007** (CE-007)
  - `collapse_test` — IF NOT cascade scope is captured synchronously THEN poles may submit new Propositions grounded in already-invalidated entries during the same round, producing inconsistent batch state at Lint Batch. IF NOT status mutation is deferred to round close THEN mid-round partial-invalid state surfaces to poles, breaking atomic round semantics.
  - `structural_valid` — TRUE.

- **RC for PR-008** (CE-008)
  - `collapse_test` — IF NOT withdrawal fires immediate full cascade THEN poles may submit Propositions grounded in a withdrawn entry within the same round, producing FK violations that the deferred-cascade path could not have prevented (because withdrawal is a designer action visible immediately, not a deferred class).
  - `structural_valid` — TRUE.

- **RC for PR-009** (CE-009)
  - `collapse_test` — IF NOT all three gate conditions clear before CLOSED THEN the session can close with `GAP`, `REVISED-PENDING`, or FK-broken state, which makes the hand-off to `design-specify` corrupt.
  - `structural_valid` — TRUE.

- **RC for PR-010** (CE-010)
  - `collapse_test` — IF NOT word caps are mechanically lint-enforced THEN prose drift accumulates across edits and the brilliantly-simple property (Lens 1 — singular purpose; Lens 8 — closed-set vocabulary) degrades over time.
  - `structural_valid` — TRUE.

---

## 6. Coverage Map

Per the locked deliverables schema: five fields per row — `concern_id`, `axiom_ids`, `proposition_ids`, `evidence_ids`, `status` (COVERED | AXIOM-ONLY | GAP). One summary row per Concern.

- **CE-001** (artifacts produced)
  - `axiom_ids` — empty.
  - `proposition_ids` — [PR-001].
  - `evidence_ids` — [EV-001, EV-002].
  - `status` — COVERED.

- **CE-002** (phase lifecycle)
  - `axiom_ids` — empty.
  - `proposition_ids` — [PR-002].
  - `evidence_ids` — [EV-003, EV-004].
  - `status` — COVERED.

- **CE-003** (procedure inventory)
  - `axiom_ids` — empty.
  - `proposition_ids` — [PR-003].
  - `evidence_ids` — [EV-005, EV-006].
  - `status` — COVERED.

- **CE-004** (actors and authority)
  - `axiom_ids` — [AX-002].
  - `proposition_ids` — [PR-004].
  - `evidence_ids` — [EV-007, EV-008].
  - `status` — COVERED.

- **CE-005** (axiom collision)
  - `axiom_ids` — [AX-001, AX-005].
  - `proposition_ids` — [PR-005].
  - `evidence_ids` — [EV-009, EV-010, EV-011].
  - `status` — COVERED.

- **CE-006** (Clerk shape)
  - `axiom_ids` — [AX-004, AX-006, AX-007].
  - `proposition_ids` — [PR-006].
  - `evidence_ids` — [EV-012, EV-013].
  - `status` — COVERED.

- **CE-007** (cascade timing)
  - `axiom_ids` — [AX-004].
  - `proposition_ids` — [PR-007].
  - `evidence_ids` — [EV-014, EV-015].
  - `status` — COVERED.

- **CE-008** (withdrawal)
  - `axiom_ids` — [AX-005].
  - `proposition_ids` — [PR-008].
  - `evidence_ids` — [EV-016].
  - `status` — COVERED.

- **CE-009** (session close)
  - `axiom_ids` — [AX-004].
  - `proposition_ids` — [PR-009].
  - `evidence_ids` — [EV-017, EV-018].
  - `status` — COVERED.

- **CE-010** (word-cap discipline)
  - `axiom_ids` — [AX-003, AX-008].
  - `proposition_ids` — [PR-010].
  - `evidence_ids` — [EV-019, EV-020].
  - `status` — COVERED.

Aggregate: ten Concerns, all `COVERED`. Zero `AXIOM-ONLY`. Zero `GAP`. Session-close gate clears.

---

## 7. Evidence Registry

Twenty Evidence entries supplied by the team-lead at session close. Each is a verbatim citation of a committed file in this folder or a referenced ancestor document. Researcher would have supplied these under the production skill.

- **EV-001** — `deliverables-locked-00.md` (full document).
- **EV-002** — `r3-deliverables-{conservator|innovator|pragmatist|purist}-00.md` (R3 four-pole convergence on three artifacts).
- **EV-003** — `process-locked-00.md` (full document).
- **EV-004** — `r3-process-{conservator|innovator|pragmatist|purist}-00.md` (R3 four-pole convergence on five-phase lifecycle).
- **EV-005** — `procedures-locked-00.md` (full document).
- **EV-006** — `r3-procedures-{conservator|innovator|pragmatist|purist}-00.md` (R3 procedure-inventory convergence).
- **EV-007** — `actors-locked-00.md` (full document).
- **EV-008** — `r3-actors-{conservator|innovator|pragmatist|purist}-00.md` (R3 role-inventory convergence + team-lead adjudication on team-lead session-close role).
- **EV-009** — `procedures-locked-00.md` §"Team-lead adjudication on D3 — reasoning" (axiom-collision flow-on-axiom-side rationale).
- **EV-010** — `r3-procedures-conservator-00.md` + `r3-procedures-innovator-00.md` (Flow position holders).
- **EV-011** — `r3-procedures-pragmatist-00.md` + `r3-procedures-purist-00.md` (Block position holders; documents the rejected alternative).
- **EV-012** — `actors-locked-00.md` §"Clerk" (D3 closed — deterministic script).
- **EV-013** — `r3-actors-pragmatist-00.md` Pragmatist principle: "complete the spec; do not substitute LLM judgment for a missing rule."
- **EV-014** — `process-locked-00.md` §"Cascade handling — hybrid timing" (synchronous scope, deferred mutation).
- **EV-015** — `r3-process-purist-00.md` (transitive depth on grounding chain).
- **EV-016** — `process-locked-00.md` §"Withdrawal handling" (immediate full cascade exception).
- **EV-017** — `process-locked-00.md` §"Session-close gate" (three Clerk-computed conditions).
- **EV-018** — `procedures-locked-00.md` §"Close Session" (gate evaluation procedure).
- **EV-019** — `framing-review-consolidation-00.md` §"Word cap on rules.md" (designer ruling: "No — Rules.md word cap — restructure, not remove").
- **EV-020** — `framing-review-arbiter-00.md` (arbiter framing review showing word-cap discipline applied across the cohort, prior to arbiter retirement).

---

## 8. Build-Spec Hand-off — what `design-specify` must produce

`design-specify` reads §3 through §6 above plus the locked-spec ancestor documents. It produces an implementation spec covering each of the following work units. Each work unit lists the architectural-input artifact that anchors it.

- **8.1 — Author `skill.md`** (≤ 200 words body, frontmatter excluded).
  - Anchor: PR-001, PR-002, PR-004 (operator-facing summary: what it produces, lifecycle one-liner, role roster).
  - Required sections: invoke-when, what-it-does, what-it-produces, reads, pre-flight.
  - Voice: terse markdown for designer readability. Not caveman ultra.

- **8.2 — Author `rules.md`** (≤ 200 words body).
  - Anchor: PR-004 (actor roster) + PR-003 (procedure inventory mapped to actors) + PR-007 + PR-008 (cascade / withdrawal rules).
  - Required structure: one section per role (Designer, Pole, Clerk, Team-lead, Researcher) listing may / may-not. Plus one section each for cascade timing and CLOSED terminal state.
  - Voice: terse markdown.

- **8.3 — Author `schema/` (word-limit exempt)**.
  - Anchor: PR-001 (artifacts) + PR-003 (procedures and gates) + PR-007 (cascade) + PR-009 (session-close gate) + AX-003 (word caps as schema-enforced).
  - Required files (suggested split — design-specify may consolidate or further split):
    - `schema/artifacts.md` — five-field Constraint Envelope, four-field Resolution Criterion, five-field Coverage Map, FK rules, working-record carve-out.
    - `schema/enums.md` — every closed-set enumeration (phase, source, provenance, status, Coverage Map status).
    - `schema/integrity.md` — FK integrity rules, axiom-collision structural-negation-match spec, cascade scope rules.
    - `schema/phases.md` — five named phases, transition triggers, designer surface per phase, round structure.
    - `schema/procedures.md` — twelve named procedures (name, mutates, trigger, gates, state effect) plus the team-lead Dispatch Round non-procedure.
    - `schema/word-caps.md` — lint specification for skill.md and rules.md (regex or token-count algorithm, frontmatter detection, body-only count, failure mode).

- **8.4 — Author `design-brief-template.md` (word-limit exempt)**.
  - Anchor: every Proposition (the template must prove all three artifacts emerge by read).
  - Required: one worked StoryDesigner-flavored example with at least one Concern carrying at least one axiom AND at least one Proposition, plus a Concern carrying axiom-only (to exercise the AXIOM-ONLY Coverage Map status). Worked example must surface the field shapes for all three artifacts.
  - Domain suggestion: pick a small in-flight StoryDesigner architectural question — for example, a Concern around DSL span-vocabulary placement. Designer may redirect at specify time.

- **8.5 — Author the Clerk script**.
  - Anchor: PR-006 (deterministic script — no LLM) + PR-003 (Lint Batch and FK as procedures) + PR-005 (axiom-collision structural-negation match) + PR-007 (cascade scope and deferred mutation) + PR-009 (session-close gate).
  - Required:
    - Language and runtime — design-specify chooses (Python script, Bash + jq, .NET console app, etc.). Recommend Python for regex + JSON ergonomics.
    - Repo location — `skills/design-architect-committee/clerk/` or equivalent.
    - Invocation — fired automatically by Submit Round, Re-Ratify Row, Add Axiom (collision-flag synchronous step), Revise Row (synchronous scope capture), Withdraw Entry (full immediate cascade), Close Session (gate evaluation).
    - Working-record format — JSON or YAML file in the session's working directory holding: Constraint Envelope rows, Resolution Criterion rows, Coverage Map rows, Evidence registry, cascade-scope index, submission identity index `(round_number, pole_id, concern_id)`, per-row rejection-reason log.
    - Structural-negation-match algorithm — spec the IF/THEN body parser, the negation rule (NOT-prefix on consequent), the same-Concern scope, the same-antecedent matching condition.

- **8.6 — Author the team-lead dispatch convention**.
  - Anchor: PR-004 (team-lead Dispatch Round) + AX-008 (caveman ultra inter-agent).
  - Required: a documented convention for how team-lead invokes the four pole subagents at round open. Should cite the existing `chester:design-large-task-step-b-{conservator|innovator|pragmatist|purist}` agent types or define new pole agents under `chester:design-architect-committee-*`. The Researcher slot reuses existing `chester:design-committee-researcher`. Caveman ultra mandatory for inter-agent prompts.

- **8.7 — Author the session-close hand-off shape**.
  - Anchor: PR-001 + actors-locked §"Team-lead" (session-close artifact packaging).
  - Required: the on-disk hand-off file shape that team-lead produces from the Clerk-certified working record at Close Session. This file is what `design-specify` reads as its input. Recommend it be exactly the §4 + §5 + §6 + §7 shape from this brief, written into a single Markdown file at a stable path inside the session's working directory.

- **8.8 — Author the working-directory layout**.
  - Anchor: Chester convention (`docs/chester/working/<sprint-name>/`).
  - Required: a documented layout per session — where the working record lives, where pole returns persist (one file per pole per round, verbatim — see `feedback_pole_returns_persist_before_adjudicate`), where the Evidence registry lives, where the hand-off file lands.

---

## 9. Out of scope (do not specify)

- **Engine changes.** Alternative F has no proof engine. The proof-system MCP (`mcp__plugin_chester_chester-design-proof__*`) is unused by this skill. Do not register tools against it. Do not implement engine semantics.
- **MCP server authoring.** No new MCP server required. Clerk is a script; team-lead is an LLM prompt.
- **UI changes.** No StoryDesigner UI change.
- **Migration of prior NCON-* sessions.** Prior sessions ran on the legacy proof system. They stay as-is. The new skill applies to sessions opened on or after merge.
- **Concurrent-session support.** One session per working directory. Multi-session orchestration is out of scope.
- **Persistence of cross-session knowledge.** The Wiki and other Chester knowledge stores remain unchanged. The skill produces session-scoped artifacts only.

---

## 10. Risks (carried forward to specify; design-specify spec must address each)

- **R-1 — Cascade invalidation regression** (accepted at FAC). The Clerk's deferred mutation surfaces inconsistency at round close rather than preventing it at submission. Designer ratification is the load-bearing semantic gate. Specify: the Clerk lint report must explicitly enumerate every row whose status changed via deferred cascade, distinguishable from rows the designer is ratifying directly.

- **R-2 — Designer axiom-assertion quality** (accepted at FAC). Axioms may be sparse if the designer arrives at a Concern with no pre-deliberation clarity. AXIOM-ONLY and zero-axiom Concerns are both legal. Specify: the Coverage Map status must distinguish the two cases (COVERED with axiom_ids non-empty vs. COVERED with axiom_ids empty) so the designer can audit axiom density across sessions over time.

- **R-3 — Field-shape rigor under deadline pressure** (accepted at FAC). The IF/THEN body and IF NOT/THEN collapse_test fields are mechanically lint-checkable for shape but not for semantic content. Designer ratification is the semantic gate. Specify: the Clerk lint report must surface each row's body and collapse_test verbatim to the designer at Ratify Row time — no summary, no synopsis, no Translation Gate (designer reads the raw schema content).

- **R-4 — Word-cap discipline maintenance over time** (new at this brief). Future edits to `skill.md` and `rules.md` may exceed the cap without notice if the lint is not wired into a pre-merge gate. Specify: the lint runs as a pre-commit hook OR a CI check in the repo where the skill files live. Failure blocks the commit / blocks the merge.

- **R-5 — Clerk script maintenance burden** (new at this brief). The Clerk script must remain a deterministic mechanical specification of the locked procedures. Drift toward heuristic behavior is a discipline risk. Specify: the Clerk script has its own test surface — unit tests for each procedure's gate predicates, integration tests for round-cycle behavior, golden-file tests for FK integrity and Coverage Map recomputation.

- **R-6 — Team-lead session-close packaging discipline** (new at this brief). Team-lead is mechanical extraction only at session close — no synthesis, no editorial judgment, no procedure calls. The line between "mechanical extraction" and "summary writing" can erode under prompt drift. Specify: the team-lead prompt for session-close packaging is a strict template-fill from the working record. The Clerk-certified working record provides the content verbatim; team-lead reformats for the §4 + §5 + §6 + §7 shape and signs off.

---

## 11. Open designer decisions remaining

**None.** The three framing-stage designer decisions (D1 Alternative F adoption, D2 axiom-assertion mechanism, D3 Clerk role scope) all closed during the macro-step sessions:

- D1 closed at FAC ratification (Alternative F adopted).
- D2 closed via procedure spec — Add Axiom is a locked procedure with `provenance = DESIGNER` structurally enforced; designer signals all axiom entries directly. No registry mechanism debate remained.
- D3 closed at actors-locked — Clerk is a deterministic script with no LLM layer.

Three subsequent step-internal divergences also closed (D3 axiom-collision Flow vs Block; team-lead session-close role; Re-Ratify Row separation). Each closed via either four-pole convergence or team-lead adjudication with reasoning recorded in the locked spec.

`design-specify` proceeds without re-opening any of the above.

---

## 12. References

Documents on disk in this folder, ordered by relevance:

- `deliverables-locked-00.md` — macro step 1 locked spec.
- `process-locked-00.md` — macro step 2 locked spec.
- `procedures-locked-00.md` — macro step 3 locked spec.
- `actors-locked-00.md` — macro step 4 locked spec.
- `fac-recommendation-and-aoa-00.md` — Alternative F ratification (the upstream architectural decision).
- `lens-criteria-for-fac-options.md` — designer-set ten lenses (the fitness envelope this brief honors).
- `designer-q1-q2-guidance.md` — Q1 ruling that admitted Lens 7 elimination.
- `proof-system-origin-research.md` — counterfactual analysis and channeling-spectrum precedents.
- `proof-system-engine-recommendations.md` — engine-change candidates (out of scope here; relevant only if Family 1 had been chosen).
- `framing-review-consolidation-00.md` — framing-stage consolidation including word-cap ruling.
- `deliverables-consolidation-00.md` — designer adjudication packet for the deliverables macro step (only step with designer adjudication; subsequent steps used team-lead).
- `r{1..3}-{deliverables|process|procedures|actors}-{conservator|innovator|pragmatist|purist}-00.md` — fifty-two verbatim per-round pole returns underlying the locked specs.
- `handoff-pre-skill-write-00.md` — operational handoff prior to compact, mapping locked specs to skill files.

External anchor documents:
- `docs/storydesigner/01-vision.md` — designer-authored Vision binding the entire design system (Sec 1, Sec 2, Sec 2.2, Sec 2.6, Sec 3.3, Sec 4 cited throughout).

---

## 13. Closure note

This brief is the design-system-analysis sprint's final design artifact. On `design-specify` acceptance, the next step is implementation per §8.

The session that produced this brief ran from 2026-05-21 through 2026-05-22 in a single Chester working directory. The Committee persisted across one context compaction (handoff at `handoff-pre-skill-write-00.md`). All four macro steps closed with the locked spec on disk before the compaction window. The brief was authored after compaction, reading the locked specs as its substrate — no architectural memory was carried through compaction; every claim in §4 / §5 / §6 traces to a file on disk.

Per `feedback_committee_persistence_default`, the Committee team is not torn down at brief delivery. It stays available for `design-specify` consultation if any §8 work unit surfaces an unexpected architectural question. Designer explicit termination is the only way the Committee disbands.
