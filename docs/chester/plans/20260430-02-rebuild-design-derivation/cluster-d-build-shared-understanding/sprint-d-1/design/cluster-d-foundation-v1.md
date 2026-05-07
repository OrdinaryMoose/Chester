# Cluster D — Foundation v1

**Status:** Ratified lock-in artifact. Captures cluster D's architectural foundation as of 2026-05-06. Inheritance for continuation work and downstream design-specify.

**Purpose:** durable checkpoint after 19 rounds of design conversation. Separates what is settled from what remains in motion. Survives session compaction. Becomes designer-locked for subsequent sub-sprints.

**Successor work:** continuation occurs in two layers (see §8).

---

## 1. Operative Statement

> How do we create a unified design system that builds shared understanding of the problem and delivers commonly understood design requirements to the Specify system?

Inherited verbatim from cluster D charter (master-plan §4.5). Designer-ratified.

---

## 2. Organizing Principles

Two principles govern every cluster D design decision. Both are designer-ratified, Rule-class.

### Principle 1 — Design is the code

The design system has a formal language that the agent and designer operate within. The agent's drive toward implementation is harnessed back into design altitude through that language. The language IS the design medium.

### Principle 2 — The purpose is to create Shared Understanding

The design system exists to produce shared alignment between agent and designer about the problem, its constraints, and its resolution. Through that shared understanding the system delivers commonly understood requirements to the Specify system.

### Principle 3 — One-system architecture

The proof MCP runs from session start with no internal stage boundary. No Phase 4a / Phase 4b separation in time. (R03 inheritance.)

---

## 3. Two-Layer Architecture (ratified 2026-05-06)

Cluster D's deliverable splits into two structural layers along a one-way dependency:

### Proof Layer

What it owns:
- CRUD operations across the closed element set
- Proof logic (what counts as ratified, valid state transitions, element shapes)
- Resolve Conditions and their five attributes
- Closing argument composition (derived read of proof state)
- Artifact passed to design-specify

Spans both proof MCP server (schema + tools + validation) and skill-side proof reasoning (closing argument composition, handoff packaging).

Has zero dependency on Presentation layer.

### Presentation Layer

What it owns:
- Voice (PM register, Translation Gate)
- Verbosity (information packet shape)
- Phase orchestration of the interview
- Round topic selection mechanics
- Designer-facing rendering of proof state
- Pessimist commentary, single-topic discipline, packet bullets

Depends on Proof layer for state, contracts, and tool surface. Cannot define proof semantics; consumes them.

### Dependency direction

Presentation imports Proof contract. Proof never reaches into Presentation. Specifying Presentation against unstable Proof produces rework, so Proof leads in the sequencing.

---

## 4. Skill Architecture — Six Phases

Authoritative top-level structure. Each Phase carries a one-sentence description per RULE-13. Steps within Phases use plain-English verb names.

### Phase 1 — Initialize (composite)

Brings the skill from invocation to first proof-bearing turn. Assumes Chester-level setup (config, MCP boot, thinking history) is already complete.

- **1.a Bootstrap.** Establishes the sprint identity and working tree on disk.
- **1.b Frame the Work.** Settles what the proof is about and what the designer cares about, before any element is recorded.
  - **1.b.i Agree on the Topic.** Designer and agent reach shared agreement on problem statement, topic framing, and problem-space coordinate placement.
  - **1.b.ii Collect Concerns.** Designer enumerates initial Concerns; agent captures as Drafts pending proof open.

### Phase 2 — Open the Proof

Calls open_proof with the seed: ratified problem statement, topic framing, initial Concerns, exploration evidence. Single boundary crossing per cluster B.1 R6.

### Phase 3 — Research Summary

Presents what parallel context exploration surfaced (codebase, prior art, industry) so designer has shared baseline knowledge before round cycle begins.

### Phase 4 — Round Cycle

Iterative interview turns advancing the proof through cooperative analysis. Continues until designer signals readiness for closing argument.

### Phase 5 — Closing Argument

Single self-contained derived read of proof state walking every live RC and NC. Gates closure via two-yes mechanism.

### Phase 6 — Closure

Writes design brief, archives artifacts, hands off to design-specify.

---

## 5. Six Atomic Concerns

Ratified 2026-05-06. Each names a real worry without encoding mechanism. NCs and Evidence anchor here; RCs ratify against these and only these.

| ID | Label | Description | Layer affinity |
|----|-------|-------------|----------------|
| C-1 | Sufficient seed information | Skill must start with sufficient seed information to build shared understanding. | Interface |
| C-2 | Designer consumption of proof state | Designer must be able to consume proof state to build shared understanding, including problem-space coordinate placement. | Presentation-primary |
| C-3 | Proof state faithfulness | Proof state must remain faithful to designer's intent over time. | Proof-primary |
| C-4 | Designer-consent gate on advancement | Proof advancement without designer consent breaks shared understanding. | Interface |
| C-5 | Specify handoff fidelity | Specify handoff must carry designer's intent with sufficient fidelity to produce correct architecture. | Proof-primary |
| C-6 | Mutual agreement on specify-input adequacy | Agent and designer must mutually agree that the information provided to design-specify produces the correct architecture. | Interface |

Two proof-primary, one presentation-primary, three interface. Interface concerns make the boundary contract load-bearing.

The fifteen-Concern set that preceded these six is superseded; full reclassification map lives in `cluster-d-concerns-working-list.md`.

---

## 6. Closed Element Set

Nine element types plus Definition (G1 path proof-state extension). Charter-locked; extension requires explicit charter-level decision, not in-band addition.

- Necessary Condition (NC)
- Evidence
- Rule
- Permission
- Risk
- Concern
- Resolve Condition (RC)
- Friction
- Phantom (withdrawal-derived state, not directly created)
- Definition (G1 extension; tool surface pending — `manage_definitions` proposed but not built)

---

## 7. Architectural Commitments (ratified)

These commitments are settled. Mechanism design continues against them.

### 7.1 Approval-tracked discipline

Concern, RC, NC, and Definition carry Draft / Ratified states. Evidence, Rule, Permission, Risk, and Friction do not. Approval discipline applies only to elements where designer ratification is load-bearing.

### 7.2 Two-tier ratification

Concerns ratify mid-round, individually. RCs and NCs ratify in bulk at closing argument under the two-yes closure gate.

### 7.3 Two-yes closure gate

Designer must consent to view the closing argument AND say "go" in the same round. Mutation between view and go clears both flags. (Cluster B.2 inheritance.)

### 7.4 PM register and Translation Gate

Designer is treated as a Product Manager with no codebase knowledge. All designer-facing output must be paraphrased before crossing the boundary. No proof-internal jargon survives the gate.

### 7.5 Information packet shape

Each round delivers one packet:

- Insight (1-2 sentences)
- Intro (one sentence on what the turn addresses)
- Facts (3-5 single-sentence bullets)
- Agent commentary (1-2 sentences)
- Pessimist commentary (1-2 sentences, category rotates randomly per turn from: Foreclosure / Fragility / Tension / Real uncertainty / Surprise)
- Decision (clear ask of the designer)

### 7.6 Single-topic discipline

Each round addresses exactly one topic. Multi-topic rounds prohibited. Decompose into queue and deliver in priority order.

### 7.7 Coordinate placement and movement

Two-axis problem space (Structured ⊥ Bounded) is meta-language about problem nature and proof state. Coordinate placement and movement become first-class properties of the proof; mechanism for tracking pending design.

### 7.8 Agent rule-submission discipline

Only the designer submits Rules. The agent reviews, synthesizes, and proposes Rules for designer approval if they substantially advance the proof. Agent does not auto-add Rules on directive.

### 7.9 CRUD-completeness commitment

Every element type in the closed set supports the full CRUD operation set. Withdrawal preserves the element with closed-set disposition; never silent deletion. Every operation carries provenance, not just create.

Mechanism pending — covered by `cluster-d-proof-layer-crud-requirements.md`.

### 7.10 Designer-consent gate on advancement

Agent may not advance the proof without designer ratification of the change. (RULE-18.2 inheritance.)

---

## 8. Continuation Plan — Two Sub-Sprints

Cluster D's foundation locks here. Continuation work splits across two sub-sprints aligned with the two-layer architecture.

### Sub-sprint D.1 — Proof Layer

**Problem statement (ratified 2026-05-06):**

> How do we design the proof layer that delivers commonly understood design requirements to the Specify system — formal language, faithful state management, designer-consent gating, and closure handoff — so that the presentation layer can build shared understanding against it?

**Scope:** proof MCP schema and tooling + skill-side proof reasoning. Includes:
- CRUD-completeness across all element types
- Per-concern status field (schema gap)
- Concern phantom shape (gap)
- manage_definitions tool (gap)
- Withdrawal grammar (universal)
- Provenance on every operation (universal)
- Closing argument composition (skill-side)
- Specify handoff artifact shape

**Authors:**
- All NCs anchored to C-3 (faithfulness) and C-5 (handoff fidelity)
- RCs for C-3 and C-5
- Rule altitude resolution for proof-side rules

**Path:** specify → plan-build → execute-write. Ships proof MCP server changes plus skill-side proof reasoning code.

**Leads sequencing.** Presentation depends on Proof shape; D.1 must stabilize before D.2 design closes.

### Sub-sprint D.2 — Presentation Layer

**Scope:** skill body + voice + verbosity + orchestration. Includes:
- SKILL.md rewrite to six-phase architecture
- PM register / Translation Gate enforcement
- Information packet shape
- Single-topic discipline
- Pessimist commentary mechanism
- Phase orchestration
- Round topic selection from proof gaps

**Authors:**
- All NCs anchored to C-2 (designer consumption)
- RCs for C-2
- Rule altitude resolution for presentation-side rules

**Path:** specify → plan-build → execute-write. Ships SKILL.md plus util-design-partner-role updates.

**Depends on D.1 contracts.** Cannot specify Presentation until Proof shape ratified.

### Interface (boundary)

Three Concerns sit at the boundary (C-1 seed, C-4 consent gate, C-6 mutual agreement). Interface contract authored across both sub-sprints; lives in whichever ships first (likely D.1) and is consumed by the other.

---

## 9. Open / Deferred Material

Tracked here so deferral is visible. Each item routes to D.1 or D.2.

| Item | Routes to |
|------|-----------|
| Rule altitude resolution (rules 13-17, 20-22) | Both (per layer) |
| NC authoring (15 identified, 0 written) | Both (per anchor) |
| RC authoring (0 written) | Both (per anchor) |
| C-6 mechanism design | Boundary; likely D.1 |
| Per-concern status schema | D.1 |
| Concern phantom shape | D.1 |
| manage_definitions tool | D.1 |
| Universal withdraw API | D.1 |
| Provenance on every operation | D.1 |
| SKILL.md rewrite to six-phase | D.2 |
| Packet shape codification | D.2 |
| Pessimist mechanism | D.2 |
| Phase orchestration code | D.2 |

---

## 10. Inheritance for Continuation

Sub-sprints D.1 and D.2 inherit:

- Master plan §4.5 cluster D charter (operative statement, seven seed concerns lineage)
- All cluster A + B.1 + B.2 shipped capabilities
- Cluster C session learnings (organizing principles + reframed problem statement + 6 evidence pieces with reclassified sources)
- Vocabulary corpus at `cluster-a-define-solve/summary/vocabulary-corpus-2026-05-05.md`
- Two-axis problem space reference at `cluster-d-build-shared-understanding/design/structured-bounded-problem-space-reference.md`
- CRUD requirements at `cluster-d-build-shared-understanding/design/cluster-d-proof-layer-crud-requirements.md`
- Concerns working list at `cluster-d-build-shared-understanding/design/cluster-d-concerns-working-list.md`
- This foundation artifact

---

## 11. Provenance

- Captured 2026-05-06 after 19 rounds of cluster D design conversation across 2026-05-05 and 2026-05-06.
- Designer ratified the six-Concern set, the six-Phase skill outline, the plain-English Step naming, the two-layer architecture split, and the bifurcation into D.1 / D.2.
- Pre-existing proof state (`cluster-d-build-shared-understanding-proof-state.json`) carries the legacy fifteen-Concern shape and 21 Rules; it is preserved as session record. Continuation under D.1 / D.2 may re-seed.
