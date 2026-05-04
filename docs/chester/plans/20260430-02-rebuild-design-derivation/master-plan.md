---
title: "Rebuild Design Derivation — Master Plan"
path: "docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md"
version: "v01.01"
version_date: "2026-04-30"
cycle_status: "Cycle-1 active"
doc_status: "active"
freeze_map:
  - { cluster: cluster-a-define-solve, status: done }
  - { cluster: cluster-b-define-transition, status: split }
  - { cluster: cluster-b-1-define-transition, status: done }
  - { cluster: cluster-b-2-define-solve-closing, status: done }
  - { cluster: cluster-c-restructure-understand, status: pending }
---

# Rebuild Design Derivation — Master Plan

## 1. Purpose and Three-Layer Model

This document is the **Layer-1 META-plan** for the Phase 4a + Phase 4b refactor inside `design-large-task`. It enumerates three cluster sub-sprints, the five-point endstate they collectively achieve, exit criteria, dependencies, evidence, and locked vocabulary. It does not contain per-cluster design detail.

The three-layer model:

- **Layer 1 — META-plan (this document)**. Cluster sequence and locked context.
- **Layer 2 — Per-cluster Chester pipeline cycles**. Each cluster runs its own design-large-task → design-specify → plan-build → execute-write cycle when it executes.
- **Layer 3 — Code**. The actual SKILL.md files, MCP server source, brief-template files, and downstream consumer updates landing on the Chester plugin codebase.

## 2. Endstate Target

The endstate is a five-point picture of where Phase 4a, Phase 4b, and the transition between them land:

1. **Phase 4a focuses on design-level planning, not implementation or solve-level tasks.** The Understand stage operates strictly at design altitude. Solve-shape framings, mechanism vocabulary, and implementation commitments belong downstream.
2. **Phase 4a's understanding MCP is revised into a more formalized language that can transition information into the solve MCP.** Phase 4a output uses vocabulary compatible with the solve MCP's element shapes so the transition is structural, not translational.
3. **The Phase 4a to Phase 4b process is defined.** A named, structural transition between the two stages — what Phase 4a hands over, in what shape, with what handoff guarantees.
4. **The Phase 4b solve process is confirmed valid and sufficient.** The five existing element types (Necessary Condition, Evidence, Rule, Permission, Risk) and their associated MCP machinery are verified to carry everything Phase 4b needs. If gaps surface during cluster work, they are surfaced as cluster-scope decisions; the default expectation is preservation, not refactor.
5. **The end criteria are formalized.** What we are solving is defined; the shape of that definition matches the input requirements of the design-specify skill so design-specify can generate feasible, acceptable, and complete solutions without agent-imagined material at the design-to-specify boundary.

### Genesis

This work began as a **Phase 4a altitude concern** — agent solve-drive leaks as solve-shape framings during the Understand stage regardless of which Understanding MCP flow is active (classic, problemfocused, team-interview all exhibit the same drift).

Investigation revealed Phase 4b carries a parallel concern: the proof's closure check validates element well-formedness but does not validate against the problem statement, and the brief's Acceptance Criteria are authored as agent prose at brief-render time with no upstream definition source.

The reframe followed: rather than treat Phase 4a and Phase 4b as independent fixes, the design phase's collective output shape is **pulled into being by what design-specify needs downstream**. design-specify generates the solutions; the design phase produces specify's input. Specify must produce solutions that are feasible, acceptable, and complete; the design phase must produce the input that lets specify make those claims.

That reframe locked the five-point endstate above. Cluster A defines what we are solving and shapes it to specify's input requirements (point 5). Cluster B defines the transition process and confirms Phase 4b sufficiency (points 3, 4). Cluster C restructures Phase 4a so its altitude is design-level and its language is formalized enough to transition cleanly into Phase 4b (points 1, 2).

### What design-specify Needs (the consumer-pull shape)

design-specify needs three artifacts to generate feasible, acceptable, complete solutions:

- **A constraint envelope** — what the design cannot violate, must respect, must avoid. Today fully expressible in the five immutable proof element types (Necessary Condition, Rule, Permission, Evidence, Risk).
- **A resolution criterion** — what observable state counts as the problem being solved. Not today expressible in any existing element. This is the gap cluster A closes by formalizing the end criteria.
- **A coverage map** — every aspect of the problem statement traces to at least one constraint and one resolution criterion. Concrete shape settled inside cluster A or B.

Plus support material that collapses into existing elements: industry context (Evidence with `source: "industry"`), priority signals (Rules), tension catalog (Risks with multi-element basis), permission visibility (Permission element).

### Designer-Ratified Core Tenets

- **Design = the problem (what), not the implementation (how).** Phase 4a owns the what; mechanism shapes belong in Phase 4b or downstream.
- **Agent has solve-drive — designed-for.** The system gives the agent the problem we want it to solve. The drive is a feature; the design must give it a problem-altitude target rather than prohibit drive expression.
- **`design-specify` generates solutions** — not the proof. The proof produces input for specify. Specify owns the architectural shape choice.

### The Five Resolution-Claim Attributes (designer-ratified)

The end criteria, formalized. Whatever cluster A produces — new element type, NC extension, alternative shape — must carry all five:

1. **Observable** — names a state of the world a developer or test could check
2. **Designer-ratified** — the designer commits that this observable counts as resolution
3. **Problem-statement-anchored** — explicitly resolves a named aspect of the hypothesis
4. **Forward-looking** — describes a future state the design will produce, not a current state Evidence describes
5. **Non-restrictive** — does not limit the design space (Rules do that); certifies the design space's exit condition

### Locked Vocabulary

**Immutable (designer-locked, no revision permitted):**
- Necessary Condition (NC)
- Evidence
- Rule
- Permission
- Risk
- Problem statement
- Phase 4a (Understand stage)
- Phase 4b (Solve stage)

**Working glossary (revisable inside clusters per cluster scope):**
- Sufficient Condition (working name for the resolution-claim element; cluster A settles final naming and shape)
- Discovery lens / Scope / Givens / Dependencies (Phase 4a structural concepts; cluster C validates atomicity and sufficiency, may revise)
- Pre-seeded proof (working name for the Phase 4a output shape; cluster B settles the transition mechanism and may revise)
- Derivation gap / Solve-drive (descriptive terms; not load-bearing locks)

**Deprecated:**
- Acceptance Criteria — vague semantics; replaced by the resolution-claim concept whose final shape lands in cluster A

### Code-Only Authority Discipline

The Chester plugin codebase (`skills/design-large-task/SKILL.md`, `skills/design-large-task/proof-mcp/*`, `skills/design-large-task/references/*`, `skills/design-large-task/understanding-mcp-*/*`, `skills/util-design-partner-role/SKILL.md`) is the sole authority for current Phase 4a and Phase 4b state. Prior session artifacts are reference only.

## 3. Pre-Existing State (Reference Only)

The pipeline today, as ground truth:

- **Phase 4a flows** — three pluggable Understanding MCPs exist (classic, problemfocused, team-interview). Each plugs into the swap-line architecture in `design-large-task/SKILL.md` and references its own flow file under `design-large-task/references/`. **Only one Understanding MCP is in scope for this sprint** — the active flow targeted by cluster C. The other two are deprecation candidates and are not modified by this sprint. The plugin architecture itself (swap-line + per-flow reference files + multiple MCP server packages) is preserved so deprecation can happen in a separate future sprint without disturbing the skill's pluggability.
- **Phase 4b proof** — five element types (NC, Rule, Permission, Evidence, Risk). Closure verifies six structural properties; none reference the problem statement after initialization.
- **Brief template** — eight required sections; Acceptance Criteria authored as agent prose at Closure with no upstream source.
- **`design-specify`** — reads the brief, dispatches architects, hybridizes, writes spec, runs three reviews (fidelity, adversarial, ground-truth). Spec carries `AC-{N.M}` entries; today these derive from agent-imagined brief Acceptance Criteria.
- **Voice rules** — `util-design-partner-role` carries C1 (Externalized Coverage) and C2 (Fact / Assumption / Opinion marking) shipped from prior sprint.

This master plan operates inside `design-large-task` and updates `proof-mcp` and the single Understanding MCP cluster C targets. Downstream skills (design-specify, plan-build, execute-write) inherit changes if Phase 4b output shape evolves but are not directly redesigned here.

## 4. Cluster Planning Units

### 4.1 Cluster A — Define Solve

- **Type:** Design + implementation cluster
- **Subdir:** `cluster-a-define-solve/`
- **Endstate Point:** 5 (formalize end criteria; define what we are solving; shape to specify's input requirements)
- **Objective:** Define the resolution-claim element category. Settle naming and concrete shape (new element type vs NC extension vs other). Define source rules, required fields, integrity-check semantics, closure-check contribution. Fold in hypothesis-methodology validation: what makes a problem statement well-formed enough to carry resolution claims.
- **Exit criteria:**
  - Element naming and shape locked
  - Element schema locked (required fields, source rule, integrity-check semantics)
  - Closure-check extension drafted (how presence and coverage are validated)
  - Hypothesis-methodology criteria defined (what Phase 4b expects of the problem statement at opening)
  - Cluster A design brief committed; specify run; plan-build run; execute-write delivered code changes if any are needed at this stage
- **Depends on:** none — this cluster is the foundation
- **Inheritance for downstream clusters:** every decision locked here becomes a Rule for Cluster B and Cluster C
- **Status:** done — merged to main 2026-05-01 (merge commit `5f07c64`, archive commit `c5adbbf`)

### 4.2 Cluster B — Define Transition

- **Type:** Design + implementation cluster
- **Subdir:** `cluster-b-define-transition/`
- **Endstate Points:** 3 (define the Phase 4a to Phase 4b process), 4 (confirm Phase 4b solve still valid and sufficient)
- **Objective:** Define the named, structural transition between Phase 4a and Phase 4b — what Phase 4a hands over, in what shape, with what handoff guarantees. Confirm the existing Phase 4b solve process is still valid and sufficient given cluster A's resolution-claim decisions; surface any gaps as cluster-scope decisions but default to preservation. Update brief template if cluster A's shape requires it.
- **Exit criteria:**
  - Transition process defined (what crosses the Phase 4a → Phase 4b boundary; in what shape)
  - Phase 4b validity confirmed against cluster A's resolution-claim shape (or specific gaps surfaced and resolved)
  - Phase 4b SKILL.md sections updated where transition mechanism requires (Solve Stage Opening, Per-Turn Flow, Closure Protocol)
  - proof MCP source updated where cluster A's element decisions require (proof.js, state.js, metrics.js, server.js)
  - Brief template updated where cluster A or transition requires
  - Cluster B design brief committed; specify run; plan-build run; execute-write delivered
- **Depends on:** Cluster A
- **Inheritance for downstream cluster:** every decision locked here becomes a Rule for Cluster C
- **Status:** split — decomposed into sub-clusters B.1 and B.2 below; the umbrella charter above remains the framing for the combined work, but execution happens in the two sub-clusters

#### 4.2.1 Cluster B.1 — Phase 4b Initialization

- **Type:** Design + implementation sub-cluster
- **Subdir:** `cluster-b-1-define-transition/` (new directory created at sub-sprint launch; cluster-B's umbrella session preserved at `cluster-b-define-transition/` as historical record)
- **Endstate Point:** initialization-side portion of point 3 (define the Phase 4a → Phase 4b process) and initialization-side portion of point 4 (confirm Phase 4b solve still valid and sufficient)
- **Objective:** Define the Phase 4b initialization sequence — how raw Phase 4a material types into the proof MCP at the boundary. Six pairings inherited from cluster-B's NC-1 (problem statement, Concerns, Evidence, Rules, Permissions, Resolve Conditions). Two-channel raw-material model inherited from cluster-B's NC-2 (problem statement explicit; everything else via agent session memory). Concern iteration mechanism inherited from cluster-B's NC-3 with five integration constraints.
- **Inheritance from cluster-B umbrella:** all 22 Rules, 3 NCs, 11 Evidence, 1 Permission (PERM-1), 5 Risks via context handover at `cluster-b-define-transition/summary/cluster-b-context-handover-to-b1.md` and proof-state snapshot at `cluster-b-define-transition/summary/cluster-b-define-transition-proof-state-snapshot-00.json`. RULE-22 inherited as forward constraint, not consumed in B.1.
- **Exit criteria:**
  - Phase 4b initialization sequence defined (the six pairings explicitly ordered with responsibility per step)
  - design-large-task SKILL.md Solve Stage Opening section updated
  - proof MCP source updated where initialization signature changes (server.js initialize_proof; possibly state.js initializeState)
  - Brief template updated where rendered shape requires
  - Concern iteration APIs implemented per NC-3's five integration constraints (sequential ratification preserved, late-lock procrastination gate, merge evidence bar, split RC autogeneration, invalidation-impact preview)
  - Cluster-B.1 design brief committed; specify run; plan-build run; execute-write delivered
- **Depends on:** Cluster A and Cluster B.2 (B.2's exit-shape decisions are Rules for B.1's initialization design)
- **Sequencing:** Cluster B.1 launches **after** Cluster B.2 has merged
- **Status:** pending

#### 4.2.2 Cluster B.2 — Phase 4b Closing-Argument Materialization

- **Type:** Design + implementation sub-cluster
- **Subdir:** `cluster-b-2-define-solve-closing/` (new directory created at sub-sprint launch)
- **Endstate Point:** closure-side portion of point 4 (confirm Phase 4b solve still valid and sufficient); RULE-22 makes the closing argument the locus of proof-to-problem-statement coverage validation, connecting closure-side work to point 5 (end-criteria formalization)
- **Objective:** Define the Phase 4b closing-argument materialization mechanism — how the proof's accumulated state (Concerns, NCs, RCs, Rules, Permissions, Risks) renders as a closing argument at proof closure that satisfies RULE-22's four enforcement properties (RC coverage in NC walk, tension-naming requirement, phantom-NC explicit handling, living-document discipline).
- **Inheritance from cluster-B umbrella:** all 22 Rules, 3 NCs (forward context only — B.2 derives its own NCs), 11 Evidence, 1 Permission (PERM-1), 5 Risks via context handover at `cluster-b-define-transition/summary/cluster-b-context-handover-to-b2.md` and proof-state snapshot. **RULE-22 is B.2's primary inherited Rule** — closing argument shape derives from it.
- **Exit criteria:**
  - Closure-baseline audit run (analogous to cluster-B's 21-proof transition audit, applied to historic proof closures); empirical baseline grounded
  - Closure-of-proof industry survey commissioned and integrated
  - Closing-argument materialization mechanism defined (when it materializes, what artifact it produces, how it gates closure_permitted)
  - RULE-22's four enforcement properties wired into proof MCP closure conditions
  - design-large-task SKILL.md Closure Protocol section updated
  - proof MCP source updated where closure-condition extensions or new materialization APIs require (metrics.js checkClosure; possibly server.js for materialization tool)
  - Brief template updated where closing-argument render shape requires (possibly a new section)
  - Cluster-B.2 design brief committed; specify run; plan-build run; execute-write delivered
- **Depends on:** Cluster A; inherits cluster-B umbrella's outputs as Rules
- **Sequencing:** Cluster B.2 launches **first** among the cluster-B follow-on sub-sprints; B.2 establishes the exit shape that B.1's initialization design targets
- **Status:** pending

### 4.3 Cluster C — Restructure Understand

- **Type:** Design + implementation cluster
- **Subdir:** `cluster-c-restructure-understand/`
- **Endstate Points:** 1 (Phase 4a focuses on design-level planning, not implementation), 2 (revise Phase 4a understanding MCP into a formalized language that transitions into the solve MCP)
- **Objective:** Restructure the targeted Phase 4a Understanding MCP so its altitude is design-level and its language is formalized enough to transition cleanly into Phase 4b per cluster B's transition process. Settle Phase 4a operational target (what the agent builds per turn). Validate Discovery lens atomicity for Scope / Givens / Dependencies (or replace with different lenses if validation fails). Define opening sequence (vocabulary first, then conditions, or different sequence). **Cluster C modifies only one Understanding MCP**; the plugin architecture (swap-line + per-flow reference files + multiple MCP server packages) is preserved. The other two existing flows are deprecation candidates handled in a future sprint, not modified or replaced by this cluster.
- **Exit criteria:**
  - Phase 4a operational target defined (what gets built per turn at design altitude)
  - Formalized language defined (Phase 4a vocabulary aligned with solve MCP element shapes per cluster B's transition process)
  - Discovery lenses validated (atomicity + sufficiency check) or revised
  - Opening sequence defined
  - Targeted Understanding MCP identified (which of the existing three this cluster modifies, or a new fourth flow added under the same plugin architecture)
  - Plugin architecture preserved (swap-line, per-flow reference file structure, multi-package MCP server arrangement intact)
  - Phase 4a SKILL.md / targeted flow-reference file updated accordingly
  - Targeted Understanding MCP server source updated where formalized-language change requires
  - Cluster C design brief committed; specify run; plan-build run; execute-write delivered
- **Depends on:** Cluster A and Cluster B
- **Status:** pending

## 5. Evidence Register

Evidence carried from this master-planning session:

- **EVID-1 — Audit finding on Phase 4b closure.** The proof's `checkClosure` (skills/design-large-task/proof-mcp/metrics.js:202-273) verifies six structural properties; none reference `state.problemStatement`. Source: codebase audit during master-planning session.
- **EVID-2 — Acceptance Criteria provenance.** The brief template's Acceptance Criteria section instructs agent prose authoring at Closure; no MCP tracking, no upstream source. Source: skills/design-large-task/references/design-brief-template.md:170-180.
- **EVID-3 — Three-flow drift.** ncon-05 transcript shows agent solve-drive leaking as solve-shape framings under problemfocused flow; prior sprint 20260425-01 established saturation scoring is gameable. Source: ncon-05 session jsonl + 20260425-01 design brief.
- **EVID-4 — V&V analogue.** Industry research confirmed verification (built it right) vs validation (built the right thing) as a recognized split; NASA / ISO 29148 institutionalize the distinction. Source: industry-explorer report 2026-04-30.
- **EVID-5 — Solve-drive as designed-for property.** Multiple prior Chester sprints (architect-round-one-fix, plan-mode-design-guard, small-task, team-interview) each address the same agent-completion-drive theme via different mechanisms. Source: prior-art explorer report 2026-04-30.
- **EVID-6 — Five existing element types are sufficient for everything except resolution claims.** Collapse test established: industry context, priority signals, tension catalog, coverage map, and SC cross-verification mechanism collapse cleanly into existing elements with field additions or basis attachments. Only resolution-claim category does not collapse without semantic blur. Source: this session, Understanding Step 6.
- **EVID-7 — design-specify input requirements.** Specify needs constraint envelope, resolution criterion, and coverage map to generate feasible, acceptable, complete solutions. Source: this session, Understanding Step 3 + Step 7.

## 6. Rules

Designer-locked restrictions on this sprint's design space:

- **RULE-1 — Five existing proof element types are immutable.** NC, Evidence, Rule, Permission, Risk retain their current schemas, source rules, and required fields. Sub-clusters may not propose changes to these.
- **RULE-2 — Phase naming is immutable.** Phase 4a = Understand stage; Phase 4b = Solve stage.
- **RULE-3 — `design-specify` generates solutions.** The proof produces input for specify; specify owns architectural shape choice. No cluster proposes the proof produces solutions directly.
- **RULE-4 — Solve-drive is a feature.** The redesign must give the drive a design-altitude landing target. No cluster proposes prohibiting drive expression.
- **RULE-5 — Design = the problem (what), not the implementation (how).** Phase 4a output stays at design altitude. Mechanism vocabulary belongs in Phase 4b or downstream.
- **RULE-6 — Phase 4b solve is presumed valid and sufficient.** Cluster B's default work is confirmation, not refactor. Gaps may surface and be resolved inside cluster B, but the bias is preservation.
- **RULE-7 — Resolution-claim element must carry the five attributes.** Observable, designer-ratified, problem-statement-anchored, forward-looking, non-restrictive. Cluster A may settle naming and concrete shape; the five attributes are locked.
- **RULE-8 — Code is the sole authority for current state.** Prior sprint briefs and pre-existing flow documents are reference only; the Chester repo source is authoritative.
- **RULE-9 — Cluster sequencing is fixed.** Cluster A executes first; Cluster B reads A's output as Rules; Cluster C reads A and B as Rules. No parallel execution.
- **RULE-10 — Phase 4a output must be expressible in the solve MCP's vocabulary.** The formalized language Phase 4a uses (cluster C scope) must transition into Phase 4b without translation. The transition mechanism (cluster B scope) operates structurally, not via interpretation.

## 7. Risks

- **RISK-1 — Resolution-claim element naming proves divisive.** Sufficient Condition is the working name; "completion criterion," "resolution criterion," "exit condition" are all candidates. Cluster A lands a naming decision; if the decision propagates poorly to design-specify or plan-build vocabulary, downstream cleanup may be needed.
- **RISK-2 — Hypothesis-methodology validation is harder than estimated.** Validating that a problem statement is well-formed enough to carry resolution claims is itself a design problem; if the methodology proves brittle, cluster A scope expands.
- **RISK-3 — Phase 4b confirmation surfaces real gaps.** Cluster B's default is preservation, but cluster A's resolution-claim decisions may force closure-check changes that count as refactor rather than confirmation. Scope-creep risk if gaps are larger than presumed.
- **RISK-4 — Targeted Understanding MCP coexistence during deprecation period.** Two of the three existing flows (the ones not targeted by cluster C) remain in place as deprecation candidates. Sessions on the legacy flows may produce briefs that don't carry resolution-claim shape; downstream consumers must handle this until those flows are deprecated in a future sprint. Cluster C must avoid breaking the swap-line plugin architecture while modifying its targeted flow.
- **RISK-5 — design-specify expects today's brief shape.** Brief-template changes (cluster A or B) propagate to design-specify's reading. Cluster B must verify specify still operates against the new brief or update specify accordingly.
- **RISK-6 — Telemetry continuity.** The voice-discipline telemetry shipped in 20260425-01 (groupSaturationHistory, transitionHistory) attaches to the existing understanding MCP state shape. Cluster C's redesigned Phase 4a may render these fields obsolete or require schema migration.
- **RISK-7 — Formalized language scope creep.** Cluster C's "more formalized language" requirement could be interpreted as a full vocabulary overhaul rather than alignment with the five element types. Cluster C scope must hold to the structural-transition target.

## 8. Cycle Discipline

This master plan operates as a single cycle. Each cluster's exit criteria fire as cluster lock-events. When all three clusters' lock-events fire green (briefs committed, specs reviewed, plans implemented, execute-write delivered, tests pass on `main`), the master plan closes.

There is no Cycle-2 for this master plan. Cluster outputs feed forward into design-specify → plan-build → execute-write per Chester's normal pipeline; no further META-planning is anticipated.

## 9. Active Cluster

Cluster A is **done** (merged 2026-05-01). Cluster B was split into B.1 + B.2 (see §4.2). Cluster B.2 — Phase 4b Closing-Argument Materialization — is **done** (merged 2026-05-02). Cluster B.1 — Phase 4b Initialization (open_proof contract surface) — is **done** (closed 2026-05-04 pending merge). **Cluster C — Restructure Understand** is the next active sub-sprint; B.1's REQUIRED_FIELDS_REGISTRY and the `submission_material` shape are read-only inheritance for C. Sessions entering this master plan should default to cluster C unless explicitly directed elsewhere.
