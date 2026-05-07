# Sprint D.2 — Build Presentation Layer (Feature Dev Brief)

**Status:** Pre-design. Awaiting D.1 to ship before D.2 can begin design.
**Parent master plan:** `20260430-02-rebuild-design-derivation`
**Sibling sprint:** D.1 — Build Proof Layer (`cluster-d-build-shared-understanding/sprint-d-1/`)
**Captured:** 2026-05-06 during cluster D design session, after the two-layer split was ratified.

---

## 1. One-Line Statement

D.2 delivers the Presentation layer of the redesigned `design-large-task` skill — voice, verbosity, packet shape, phase orchestration, and round-cycle mechanics — built against the Proof layer that D.1 ships.

---

## 2. Pre-Conditions

D.2 cannot begin design until D.1 has shipped:

- D.1 design brief approved.
- D.1 spec written (design-specify).
- D.1 plan written and hardened (plan-build + plan-attack + plan-smell).
- D.1 code written and verified (execute-write + execute-verify-complete).
- D.1 records and archive written (finish-write-records + finish-archive-artifacts).
- D.1 worktree closed (finish-close-worktree) — typically merged to main.

If any of these is incomplete, D.2 design will reference unstable contracts and produce rework. Do not start D.2 early.

---

## 3. Why Two Sprints — Architectural Frame

Cluster D's design conversation surfaced a clean two-layer architecture (see `cluster-d-build-shared-understanding/design/cluster-d-foundation-v1.md` §3):

- **Proof Layer** (D.1) owns CRUD, proof logic, resolve conditions, closing argument composition, and the artifact passed to design-specify. Spans proof MCP server schema/tools and skill-side proof reasoning. Has zero dependency on Presentation.
- **Presentation Layer** (D.2) owns voice, verbosity, packet shape, phase orchestration, round topic selection, and designer-facing rendering. Depends on Proof for state and tool surface.

Dependency direction is one-way: Presentation imports Proof contract; Proof never reaches into Presentation. This is why D.1 leads — specifying D.2 against unstable D.1 produces rework.

---

## 4. Concerns Owned

D.2 owns one Concern from cluster D's six-Concern set:

- **C-2 — Designer consumption of proof state.** Designer must be able to consume proof state to build shared understanding, including problem-space coordinate placement.

D.2 inherits as designer-locked Rules from D.1:

- **C-1 contract** — open_proof submission shape (problem statement + topic + concerns + evidence)
- **C-4 contract** — which operations require ratification + how the ratification signal carries
- **C-6 contract** — agreement protocol shape, closure artifact, two-yes gate semantics

D.2 cannot revise these contracts. If a contract breaks D.2's needs, D.2 surfaces the problem as Friction against the inherited Rule and the issue routes back to a D.1 amendment, not in-band revision.

---

## 5. Tasks — Design Block

### 5.1 Bootstrap

- Create sprint directory `cluster-d-build-shared-understanding/sprint-d-2/{design,spec,plan,summary}/`
- Create worktree
- Read inheritance chain (see §10)

### 5.2 Resolve rule altitude for presentation-side rules

The cluster D session-internal proof carried 21 RULES at mixed altitudes. The implementation-altitude rules (13-17 mostly) are presentation-layer:

- RULE-13 (information packet structure)
- RULE-14 (pessimist commentary categories with random rotation)
- RULE-15 (bullets discipline)
- RULE-16 (single topic per round)
- RULE-17 (coordinate trigger)

These need to land at architectural altitude in D.2's proof. They are not behavioral interview-instructions; they are commitments about how the Presentation layer is shaped.

### 5.3 Author NCs anchored to C-2

Starter set lifted from cluster D session work:

- Round-trip readability — proof state readable directly, no separate translation pass.
- Information packet structure — insight + intro + facts (3-5 single-sentence bullets) + agent commentary + pessimist commentary + decision.
- PM register applies to all designer-facing output (Translation Gate).
- Single topic per round.
- Pessimist commentary categories (Foreclosure / Fragility / Tension / Real uncertainty / Surprise) with random rotation.
- Problem-space coordinate placement visible in every read.

Each NC needs full structure: `statement`, `basis`, `problem_anchor`, `collapse_test`, `rejected_alternatives`.

### 5.4 Author RCs for C-2

At least one Ratified RC anchored to C-2 with all five attributes (observable, designer-ratified, problem-statement-anchored, forward-looking, non-restrictive).

### 5.5 Design SKILL.md six-phase concrete body

Six-phase architecture from foundation v1 §4 needs concrete skill body:

- Phase 1 Initialize — composite (1.a Bootstrap, 1.b Frame the Work with 1.b.i Agree on the Topic + 1.b.ii Collect Concerns)
- Phase 2 Open the Proof
- Phase 3 Research Summary
- Phase 4 Round Cycle
- Phase 5 Closing Argument
- Phase 6 Closure

Per Phase: write description + Step orchestration logic + which D.1 tools get called + the data the Phase produces. Plain-English names ratified; do not rename.

### 5.6 Design pessimist commentary mechanism

Random rotation across five categories (foreclosure / fragility / tension / real uncertainty / surprise) per round. Implementation: how is the random selection seeded? Does the agent self-select category or is it a tool? Where does the category surface in the packet?

### 5.7 Design round topic selection logic

Consumes D.1's gap API (whatever shape D.1 ships). Agent uses proof gaps to propose next round topic; designer may direct alternative. Selection mechanics live presentation-side.

### 5.8 Design phase transition mechanics

When does Phase 4 (Round Cycle) signal Phase 5 (Closing Argument) readiness? Agent-detected, designer-detected, or proof-state-derived? Mechanics live presentation-side; gate semantics inherited from D.1.

### 5.9 Design coordinate placement rendering

Two-axis problem space (Structured ⊥ Bounded) is meta-language. D.1 ships the coordinate as tracked proof-state property. D.2 designs how the coordinate surfaces in designer-facing reads — every packet? Round-one only + on axis-cross? See cluster D session decision (line 26 round transcript): "first round + on axis cross, no per-round commentary on current point."

### 5.10 Compose D.2 closing argument and gate

Standard closing argument composition + two-yes gate.

---

## 6. Tasks — Specify Block

Run `chester:design-specify` on D.2 design brief. Spec covers:

- SKILL.md rewrite of `skills/design-large-task/SKILL.md`
- Possible updates to `skills/util-design-partner-role/SKILL.md`
- Any presentation-layer supporting scripts (e.g., pessimist-category-rotation helper if any)
- Tests for any new mechanics

Spec includes competing-architecture review and codebase ground-truth verification per design-specify discipline.

---

## 7. Tasks — Plan Block

Run `chester:plan-build`. plan-attack + plan-smell hardening fires automatically. Plan covers:

- File-by-file changes to SKILL.md (likely large rewrite)
- Updates to util-design-partner-role
- Test additions / updates
- Documentation alignment (e.g., references in setup-start, master CLAUDE.md if applicable)

Subagent vs inline execution mode decided in plan.

---

## 8. Tasks — Execute Block

Run `chester:execute-write`. Then `chester:execute-verify-complete` to gate the finish phase.

Expected deliverables:

- Updated `skills/design-large-task/SKILL.md` reflecting six-phase architecture, plain-English Step names, packet shape, PM register, single-topic, pessimist mechanism, phase orchestration calling D.1 tools.
- Updated `skills/util-design-partner-role/SKILL.md` if voice rules need extension.
- Tests covering presentation-layer mechanics testable in isolation (where applicable; much of presentation is conversational and resists unit testing).

Possible related changes:
- `skills/setup-start/SKILL.md` — entry for design-large-task may need update if naming or invocation changes.
- Master plan §4.5 cluster D charter section may need closure note ("D.2 ships completes cluster D").

---

## 9. Tasks — Finish Block

Standard sequence:

1. `chester:finish-write-records` — summary, audit, decision records.
2. `chester:finish-archive-artifacts` — copy master tree to plans archive (Master Plan Mode).
3. `chester:finish-close-worktree` — four-option menu.

On D.2 merge to main: cluster D completes. Master plan §9 updated to mark cluster D shipped. `.active-master` breadcrumb decision: keep if more sub-sprints planned; delete if master closes.

---

## 10. Inheritance — Read at Session Start

Read these in order at D.2 session start:

1. `/home/mike/Documents/CodeProjects/Chester/CLAUDE.md` — project root.
2. `docs/chester/working/20260430-02-rebuild-design-derivation/CLAUDE.md` — master plan commitments.
3. `docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md` — current state.
4. `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/design/cluster-d-foundation-v1.md` — cluster D architectural foundation.
5. `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/` — D.1 deliverables (design brief, spec, summary, audit). The shipped artifacts are in `docs/chester/plans/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/` after merge.
6. `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/design/cluster-d-concerns-working-list.md` — six ratified Concerns + reclassification map + derived NC list.
7. `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/design/cluster-d-proof-layer-crud-requirements.md` — CRUD analysis (mostly D.1 territory but D.2 reads to understand what D.1 shipped).
8. `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/design/structured-bounded-problem-space-reference.md` — two-axis problem space framing.
9. This document — `sprint-d-2-feature-dev-brief.md`.
10. The session JSONL copied alongside this document — `cluster-d-design-session-<id>.jsonl` — for transcript archaeology if needed.

---

## 11. Architectural Commitments Inherited (verbatim from foundation v1)

Locked, do not relitigate:

- Two organizing principles ("Design is the code"; "The purpose is to create Shared Understanding").
- One-system architecture (no Phase 4a/4b temporal boundary).
- Two-layer architecture (Proof + Presentation; one-way dependency).
- Six-phase skill outline with plain-English Step names.
- Six atomic Concerns.
- Closed element set (NC, Evidence, Rule, Permission, Risk, Concern, RC, Friction, Phantom + Definition G1).
- Approval-tracked discipline (Concern, RC, NC, Definition with Draft/Ratified states).
- Two-tier ratification (Concerns mid-round individually; RCs/NCs bulk at closing).
- Two-yes closure gate (cluster B.2 inheritance).
- PM register and Translation Gate.
- Information packet shape (insight + intro + facts + agent commentary + pessimist commentary + decision).
- Single-topic discipline.
- Pessimist commentary five categories with random rotation.
- Coordinate placement and movement (Structured ⊥ Bounded) as meta-language.
- Agent rule-submission discipline (only designer submits Rules).
- CRUD-completeness commitment.
- Designer-consent gate on advancement.

---

## 12. Open Questions for D.2

Decisions deferred to D.2 design conversation:

- **Pessimist category selection mechanism.** Random rotation seeded by what? Tool-call vs agent self-select?
- **Coordinate visibility frequency.** Round one + on axis-cross only, or every round? Cluster D session reached "first round + on axis-cross, no per-round commentary" — confirm or revise.
- **Phase transition triggers.** Round Cycle → Closing Argument: agent-detected? Designer-driven? Proof-state-derived?
- **SKILL.md migration strategy.** Keep current swap-line plug-in architecture (classic / problemfocused / team-interview)? Cluster D is a fundamentally new flow — does it become a fourth ACTIVE_UNDERSTANDING_MCP option, or replace the lot? See SKILL.md current header at lines 1-65.
- **Worktree session boundary handling.** Cluster D's existing `cluster-d-build-shared-understanding/` worktree — does D.2 use a fresh worktree under `sprint-d-2/`, or continue?
- **Round status line preservation.** Current SKILL.md spec includes per-turn status line at end of scroll (e.g., `→ Understanding Step 4`). Cluster D updates this; D.2 designs the new status-line shape.

---

## 13. Risks / Watch Items

- **D.1 contract drift.** D.1's published API may evolve during D.1 specify/plan/execute. D.2 should re-read D.1 deliverables at session start, not trust this brief's snapshot.
- **Behavioral vs structural rules.** D.2 must hold rule-altitude discipline — implementation rules belong in skill body, architectural rules belong in proof. Easy to slip.
- **PM register adherence.** D.2 itself must run under PM register (Translation Gate) — when designing the Presentation layer, do not lapse into proof-internal jargon during the conversation.
- **Length pressure.** SKILL.md will get large. Consider reference files (`references/d2-phase-orchestration.md` etc.) to keep top-level skill scannable.

---

## 14. Naming Open

Sprint dir name not finalized. Candidate forms:

- `cluster-d-build-shared-understanding/sprint-d-2/` (current proposal; consistent with sibling `sprint-d-1/`).
- `cluster-d-2-build-presentation-layer/` (top-level under master, sibling to `cluster-d-build-shared-understanding/`).

Decision deferred. Master plan §4.5 needs amendment regardless: cluster D charter splits into D.1 + D.2.

---

## 15. Provenance

- Captured 2026-05-06 in cluster D design session after 19+ rounds and the two-layer-split ratification.
- Authored by agent (this session) at designer direction.
- Session JSONL preserved alongside this brief for transcript archaeology — see `sprint-d-2/design/cluster-d-design-session-*.jsonl`.
