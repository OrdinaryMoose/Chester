---
title: "Rebuild Design Derivation — Master Plan"
path: "docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md"
version: "v01.07"
version_date: "2026-05-05"
cycle_status: "Cycle-1 active"
doc_status: "active"
freeze_map:
  - { cluster: cluster-a-define-solve, status: done }
  - { cluster: cluster-b-define-transition, status: split }
  - { cluster: cluster-b-1-define-transition, status: done }
  - { cluster: cluster-b-2-define-solve-closing, status: done }
  - { task: task-01-fix-staleb3-label, status: done }
  - { task: task-02-fix-trailer-write-harvest, status: done }
  - { cluster: cluster-c-restructure-understand, status: closed-without-delivery, scope-transferred-to: cluster-d-build-shared-understanding }
  - { cluster: cluster-d-build-shared-understanding, status: pending }
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

### 4.4 Refactor Sub-Sprints

Non-endstate sub-sprints follow the `task-NN-<slug>` naming pattern. These address tooling, documentation, or process issues that surface during cluster work but are not endstate-bearing. Each task is single-issue and inherits master plan Rules read-only. Tasks may not modify cluster Rules, NCs, Evidence, or master plan vocabulary, and contribute no Rules to downstream clusters.

**Pipeline weight scales with scope:**
- **Trivial edits** (single-file text corrections, designer-directed wording, no investigation needed): bootstrap → execute → finish-write-records → finish-archive-artifacts → finish-close-worktree. Skip design and plan phases.
- **Investigation-bearing tasks** (root-cause work, behavior changes, anything where the fix shape is unknown at task launch): design-small-task → plan-build → execute-write → execute-verify-complete → finish phase.

Each task entry below declares its pipeline-weight class. The class is set at task registration; if a trivial edit surfaces unexpected complexity during execution, escalate to investigation-bearing by halting and re-bootstrapping under the heavier pipeline.

Numbering is sequential across master plan lifetime: task-01, task-02, etc. Each task gets its own subdir, branch, worktree, and archive entry under master mode. Archive payload at finish carries the full master tree per master-mode discipline.

#### 4.4.1 task-01 — Fix Stale B.3 Label

- **Subdir:** `task-01-fix-staleb3-label/`
- **Pipeline-weight class:** trivial edit
- **Scope:** Cluster B.2 summary L127 references "Cluster B.3 (final cluster of master plan B): transition handoff from Phase 4a understanding to Phase 4b solve." Cluster B was split into B.1 + B.2 only; no B.3 exists. B.1 (closed 2026-05-04) absorbed the transition-handoff scope. The summary line is misleading for cluster-C-onwards readers and creates a false signal that more cluster-B work is pending.
- **Exit criteria:**
  - B.2 summary edited in both `working/` and `plans/` locations to remove or correct the B.3 reference
  - Replacement wording accurately describes B.1's actual scope absorption
  - No code changes
- **Depends on:** none
- **Status:** done — merged to main 2026-05-04 (merge commit `3fa9ffa`, archive commit `349b663`)

#### 4.4.2 task-02 — Fix chester-trailer-write Harvest Silent-Abort Bug

- **Subdir:** `task-02-fix-trailer-write-harvest/`
- **Pipeline-weight class:** investigation-bearing
- **Scope:** `chester-trailer-write harvest` returned empty during cluster B.2's finish-write-records run, requiring manual harvest from artifact trailers (B.2 summary L179). Investigation 2026-05-04 established the root cause: the `do_harvest` function runs under `set -euo pipefail`, and the per-artifact timestamp-capture pipeline at line 79 returns non-zero when grep finds no `<!-- created-at: ... -->` line in an artifact (older artifacts predating the stamping convention), which silently aborts the script before the line-80 fallback can execute. Originally suspected to be a master-mode nested-directory-layout issue; investigation showed the bug is independent of layout — any sprint with at least one un-stamped artifact reproduces it on flat sprint dirs equally. Affects every sprint summary that runs harvest against a directory containing un-stamped artifacts.
- **Exit criteria:**
  - Failure mode reproduced under any sprint layout (master-mode or flat) with un-stamped artifacts present
  - Root cause identified: `set -e` + pipefail + grep-no-match silent abort in the per-artifact loop's timestamp-capture pipeline
  - Fix applied to `chester-util-config/chester-trailer-write.sh` `do_harvest` function (swallow-the-exit suffix on the timestamp-capture pipeline)
  - Audit findings present in `do_harvest`: every pipeline-and-strict-mode interaction either hardened or carrying a one-sentence safety invariant comment (confidence-bias rule)
  - Test added (Case 7 of `tests/test-trailer-harvest.sh`) covering the un-stamped-artifact trigger via direct local-source invocation
  - Paper-trail corrections: this entry rewritten; closing-cluster summary L179 erratum landed
- **Depends on:** none
- **Status:** done — merged to main 2026-05-04 (merge commit `fbd781a`, archive commit `382a9ee`)

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

## 9. Active Sub-Sprint

Cluster A is **done** (merged 2026-05-01). Cluster B was split into B.1 + B.2 (see §4.2). Cluster B.2 — Phase 4b Closing-Argument Materialization — is **done** (merged 2026-05-02). Cluster B.1 — Phase 4b Initialization (open_proof contract surface) — is **done** (merged 2026-05-04).

Two refactor sub-sprints (task-01-fix-staleb3-label, task-02-fix-trailer-write-harvest; see §4.4) ran before Cluster C launch. **task-01** is **done** (merged 2026-05-04 via `3fa9ffa`). **task-02** is **done** (merged 2026-05-04 via `fbd781a`).

**Cluster C — Restructure Understand** is **closed without delivery 2026-05-05.** The cluster C session pivoted twice: first 2026-05-04 to a one-system architecture (eliminating the Phase 4a / Phase 4b split — see §11), then 2026-05-05 to a higher-altitude reframe organized around two designer-ratified principles ("Design is the code"; "Purpose is Shared Understanding"). The 2026-05-05 reframe restated the problem at a level cluster C's charter could not absorb in-band. Cluster C closes; its session learnings (organizing principles, reframed problem statement, seven new concerns, six evidence pieces) transfer to **Cluster D — Build Shared Understanding** (see §4.5) which becomes the active sub-sprint. Sessions entering this master plan should default to cluster D.

## 10. Known Deferments — Out of Scope

Items surfaced during master-plan execution that are explicitly out of scope for this master and its task sub-sprints. Recorded here so they are not lost.

- **Stamping-test dynamism.** All five `tests/test-stamping-*.sh` files are equality-pinned to a hardcoded skill version. When a stamped skill bumps for unrelated reasons, the test fails until manually re-pinned. First flagged in cluster B.1 summary L114 ("should be made dynamic in a follow-up"); re-encountered 2026-05-04 (test-stamping-design-large-task.sh re-pinned v0009 → v0011). Mitigation in place: test comment now records the bump-trail pattern. Rejected as task-03 in this master plan to preserve focus on cluster C. Deferred to post-master-plan refactor.

### 4.5 Cluster D — Build Shared Understanding

- **Type:** Design + implementation cluster
- **Subdir:** `cluster-d-build-shared-understanding/`
- **Endstate Points:** Reframes points 1–4 under the cluster C one-system pivot. Points 3 and 4 (Phase 4a → 4b transition; Phase 4b solve process confirmed) are retired by the pivot. Points 1 and 2 (design-altitude planning; formalized language for design) collapse into "the design system speaks design at design altitude and produces a single captured artifact for specify." Point 5 (end criteria formalized) remains cluster A's ownership and is consumed read-only.
- **Objective:** Build a unified design system organized around three designer-ratified commitments — solve-drive redirection, agent-supplied venue construction, and PM-as-decider — that delivers commonly understood design requirements to `design-specify`. Reframes cluster C's one-system architecture pivot at higher altitude. Cluster C asked "how do we eliminate the Phase 4a / Phase 4b split"; cluster D asks "how do we create a unified design system in which the agent's implementation drive is structurally channeled into proof closure at design altitude, the agent constructs decision venues for the PM, and the captured artifact reads back as the PM's intent."
- **Organizing principles (designer-ratified 2026-05-05):**
  1. **"Design is the code."** The design system constructs a proof substantial enough to absorb the model's implementation drive at design altitude. The proof is a real solve target — necessary conditions, friction, closure conditions, dispositions, gates — weighted heavily enough that the agent's drive to "complete the task" points at proof closure rather than at implementation. This is structural redirection, not prompt-level gating; the corpus revision history (many revisions of design, few of specify or write) is direct evidence that prompt gating cannot redirect the drive and structural channeling can. Rule-class: every mechanism in the design system either contributes to the proof's structural weight at design altitude or is a candidate for removal.
  2. **"The purpose is to create Shared Understanding."** Through shared understanding the design system delivers a commonly understood set of design requirements to the Specify system. The shared understanding is between PM intent and the captured artifact, with the agent as the instrument that produces the artifact. Rule-class: every mechanism in the design system serves shared-understanding production; nothing in the design system is justified by being clever, complete, or efficient if it does not contribute to PM-intent capture.
  3. **"PM is the decider; the agent is the researcher and venue-builder."** The PM has architectural intent and decision authority but does not have codebase knowledge sufficient to drive the proof forward. The PM's role is judgment on presented venues. The agent's role is to research the codebase, prior art, and project context, and to use that research to construct well-framed decision venues for the architectural choices the PM is in a position to make. The conversation does not advance because the PM volunteers content; it advances because the agent prepares the next decision venue, presents it, and waits. Rule-class: agent generates content (input, framing, drafts, structural placement); PM generates decisions (ratifications, choices, redirects, locks). Agent-generated decisions and PM-supplied technical content are both failure modes.
- **Problem statement (designer-ratified 2026-05-05):** *How do we create a unified design system in which the agent's implementation drive is structurally channeled into proof closure at design altitude, the agent researches and frames architectural decision venues for a PM-shaped designer, and the captured artifact reads back as the PM's intent so that Specify produces architecture matching that intent.*
- **Concerns (designer-drafted 2026-05-05; cluster D internal session ratifies and locks):**
  1. **Initial information available to the skill and how the initial topic and concerns are derived.** What does the agent know at session start? What does it research first? How does the proof's first few necessary conditions get seeded?
  2. **Explorer subagents researching codebase, prior art, and project context to populate decision venues.** The PM cannot supply codebase knowledge, so explorers are the agent's primary mechanism for bringing technical context into the conversation. The design question is *how explorer output is curated to strengthen venue construction without overwriting designer-locked vocabulary or substituting explorer judgment for PM judgment.* This concern is essential, not optional; uncurated explorer dominance is the named root cause of the StoryDesigner corpus's harshest failure moment.
  3. **Presentation layer — how information is provided to the PM to build shared understanding.** Decision venues, not topic surveys. The presentation layer must adapt to whether the PM is supplying high-density novel content (vision-dump turns) or ratifying small decisions in sequence (wizard-form turns); these two modes need different surfaces, and conflating them is documented as a corpus failure pattern.
  4. **Proof layer — how the agent faithfully manages information to build shared understanding, and how the proof's structural weight absorbs the agent's solve-drive at design altitude.** The proof is both the capture mechanism and the solve target; capture and drive collapse into the same machinery. The proof's altitude lock (necessary conditions describe observable problem-altitude states, not implementation properties) is critical and is preserved from cluster A's five-attribute resolution-claim lock.
  5. **Asymmetric advancement — agent does the active labor (research, framing, drafting, structural placement), PM does the decision labor (ratify, choose, redirect, lock).** The labor split must be made explicit so the system does not expect PM-supplied technical content where agent-supplied research is the correct input, and does not let the agent make decisions that should belong to the PM.
  6. **Proof system reporting gaps to direct the next round of agent research.** The agent's drive points at proof closure, so proof-detected gaps direct research because the agent is solving the proof. This concern is the solve-drive in operation and is essential to the principle.
  7. **Decision-substitution detection — what stops the agent from making decisions that should belong to the PM, particularly when the PM cannot detect the substitution because they lack the technical context to recognize implementation-altitude options dressed as architectural choices.** This is the principle's hardest test in practice; without explicit machinery, agent research-and-framing can substitute for PM judgment in ways the PM ratifies without realizing.
  8. **Proper information provided to specify so it creates architecture that correctly addresses PM intent.** Read-back fidelity: the PM reads the captured artifact and ratifies "this is my position" without further correction. CN-7 closure.
- **Inheritance:**
  - **Cluster A + B.1 + B.2 shipped capabilities** — read-only inheritance. Includes proof MCP element types (NC, Rule, Permission, Evidence, Risk), Resolution Claim, Concern, submission_material contract, restructuring + provenance, closing argument, two-yes closure gate, friction, phantoms, dispositions. Cluster D session audits each capability through the refined principle's lens before locking; capabilities found to serve generation-of-content rather than capture-of-PM-intent are candidates for reshaping.
  - **Cluster C session learnings** — carried forward as opening seed. Reframed problem statement, seven concerns, six evidence pieces with reclassified sources, organizing principles. Cluster D session ratifies each through the refined principle before locking.
  - **Master plan R1–R10** — set aside for cluster D internal session per cluster C pivot amendment. Cluster D reauthors the rules it needs. New rules likely required: *the captured artifact is in the designer's locked vocabulary*; *the agent generates content and the PM generates decisions*; *the proof's structural weight is itself the channel for the implementation drive*; *the system measures itself on read-back fidelity, not on coverage scores*.
  - **Vocabulary corpus** at `cluster-a-define-solve/summary/vocabulary-corpus-2026-05-05.md` — read-only inheritance, with cluster D extending the maintenance protocol (designer ratifies, system locks, all later mentions check against locked form) as a model for design-altitude language generally.
  - **Organizing principle research** at `design/rebuild-design-derivation-organizing-principle-research-2026-05-05.md` — opening context for the cluster D internal session. The two corrections (implementation drive is structural; PM is not the input source) are ratified at session start as locked working tenets. The counterfactuals seed the cluster D Risk register.
- **Exit criteria:**
  - Cluster D design brief committed.
  - `design-specify` run; `plan-build` run; `execute-write` delivered.
  - The three organizing principles operationalized in the resulting `design-large-task` skill: structural channel for implementation drive (proof weighted heavily enough at design altitude); agent-supplied venue construction (explorers curated, framing produced, decisions framed for PM judgment); PM-as-decider asymmetry (agent does active labor, PM does decision labor).
  - **Read-back fidelity test:** in a sample design conversation, the PM reads the captured artifact at session end and ratifies "this is my position" without further correction. This is the concrete measurable form of CN-7 closure.
  - **Substitution-prevention test:** in the sample design conversation, decisions captured in the proof trace to PM ratification turns, not to agent commentary turns. The proof's content is mostly agent-supplied; the proof's *decisions* are PM-supplied.
  - **Drive-channel test:** in the sample design conversation, the agent does not produce implementation-altitude content in its commentary blocks beyond a measurable rate; the proof's structural weight visibly absorbs the drive.
- **Depends on:** Cluster A + B.1 + B.2 (all done). Inherits cluster C session as opening seed. Inherits the 2026-05-05 organizing principle research as locked tenets at session start.
- **Status:** pending

## 11. Pivot Amendment — Cluster C (2026-05-04)

**Trigger:** Cluster C session 2026-05-04 surfaced that the Phase 4a / Phase 4b separation is itself the structural defect cluster C was supposed to repair. Designer ratified a hard pivot to a **one-system architecture** for the design-derivation pipeline. See `cluster-c-restructure-understand/design/cluster-c-proof-seed.json` for the session-internal restart manifest.

### What Changes

- **§2 Endstate points 1–4** are reshaped for cluster C scope. Point 1 ("Phase 4a focuses on design-level planning") and point 2 ("Phase 4a understanding MCP revised into a more formalized language") presume a Phase 4a that the pivot dissolves. Point 3 ("Phase 4a → Phase 4b process is defined") is moot when the boundary disappears. Point 4 ("Phase 4b solve confirmed valid") survives in spirit — the proof MCP carries the full session — but the "Phase 4b" framing is retired. **Point 5 (end criteria formalized) stands unchanged.**
- **§4.3 (Cluster C — Restructure Understand)** is retired as an active charter. Cluster C's new objective: redesign `design-large-task` as a one-system architecture using the existing proof MCP throughout, eliminating the Phase 4a / Phase 4b separation while preserving the Chester insight of channeling completion drive into structured artifacts. Concerns CN-1..CN-7 in the proof seed are the load-bearing decomposition.
- **§6 Rules R1–R10** are set aside for cluster C's internal session per the designer-ratified rules invalidation in the proof seed. They are NOT retracted at the master level — they remain the framing under which cluster A and clusters B.1/B.2 designed and shipped. Cluster C reauthors any rule it needs.

### What Stays

- **§4.1 Cluster A and §4.2 Cluster B.1 + B.2 deliverables** stand unchanged. Resolve Conditions, Concerns, the open_proof submission_material contract, the closing argument materialization mechanism, the two-yes closure gate, phantoms, friction, dispositions, restructuring + provenance — all live in the proof MCP as shipped capabilities. Cluster C's one-system redesign uses these.
- **§5 Evidence Register** stands. EVID-1 through EVID-7 remain valid evidence for the master plan's reasoning history.
- **§7 Risks** stand as awareness items; cluster C may issue cluster-scope risks against its own proof.
- **§8 Cycle Discipline** unchanged: cluster C is the final cluster of cycle-1. When cluster C closes, the master plan closes.

### Cluster C Operative Statement

> Redesign design-large-task as a one-system architecture using the existing proof MCP throughout, eliminating the Phase 4a / Phase 4b separation while preserving the original Chester insight of channeling completion drive into structured artifacts. Address: how the proof initializes from invocation + research, how information advances the proof under designer consent, how the conversation discipline channels without the failed in-conversation gating mechanisms, how the resulting proof transfers to design-specify with sufficient fidelity to produce architecture matching designer intent.

Concerns CN-1..CN-7 (proof seed) anchor the redesign:
- CN-1 Proof system transition into design system
- CN-2 Interview initiation to set the proof
- CN-3 Information presentation to advance the proof
- CN-4 Proof advancement requires designer consent
- CN-5 Draft rule re-evaluation under new architecture
- CN-6 Balance between proof and interview responsibilities
- CN-7 Specify handoff fidelity to designer intent

### Pivot Pre-Conditions Recorded

Recorded as foundational evidence for the cluster C resumed session (proof seed):
- Subagent dispatch infeasible mid-conversation (>5 min/round breaks feasibility)
- Designer-codebase asymmetry: designer cannot be authority on patterns in 250k-LOC systems
- Five prior interview systems failed (chester small-task / classic / architectural / problemfocused / team-interview / lens architecture rebuild)
- Channel-don't-prohibit principle is foundational (from plan-mode-design-guard rationale)

### Freeze-Map Update

`cluster-c-restructure-understand` status remains `pending` but the charter behind it is the post-pivot one-system redesign, not the original Restructure Understand objective. The freeze-map entry is unchanged; this amendment is the authoritative redirection.

## 12. Reframe Amendment — Cluster C → Cluster D Transfer (2026-05-05)

**Trigger:** The cluster C session resumed 2026-05-05 under the §11 one-system framing, opened a fresh proof with the seeded problem statement + 7 Concerns + 6 Evidence (post-source reclassification), surfaced a heuristic friction hint between two concerns, and during friction resolution the designer reframed the problem at higher altitude.

### What Changed

The 2026-05-04 pivot replaced *"restructure Phase 4a"* with *"redesign as one-system architecture using existing proof MCP."* The 2026-05-05 reframe replaces that with *"create a unified design system that builds shared understanding and delivers commonly understood requirements to Specify."*

The new framing introduces two designer-ratified organizing principles:

1. **"Design is the code."** Formal language for the agent and designer; the design system speaks design altitude, not solve altitude. The agent's drive toward implementation is harnessed back into design altitude through the language itself.
2. **"The purpose is to create Shared Understanding."** The design system's reason for existing is to produce shared understanding between agent and designer. Through that shared understanding, the system delivers a commonly understood set of design requirements to Specify.

The seven concerns reshape (CN-1..CN-7 from the §11 framing retire; the new seven are listed in §4.5 cluster D charter).

### Why This Is a Cluster Transfer, Not Another In-Cluster Pivot

The §11 one-system pivot was an architecture-level move — same problem, different shape. The 2026-05-05 reframe is a charter-level move — different problem altitude. "Eliminate the 4a/4b boundary" is a structural target; "create a unified design system that produces shared understanding for Specify handoff" is a system-purpose target. The latter dictates everything the former would design and adds two organizing principles that no cluster C charter (original or pivot) carried.

Cluster B.1 R6's "in-band amendment forbidden after restructuring" applies twice over: the problem statement cannot amend in-band, and the concerns set cannot withdraw via the current MCP API. Fresh sub-sprint is the structurally correct path.

### What Cluster C Leaves Behind

- The pivot amendment in §11 stands as paper trail
- The cluster C design document captures the closed session's reasoning trail (open proof state at `-state-01.json`, 7 admitted concerns, 6 evidence elements, friction hint surfacing, designer reframe)
- The cluster D charter (§4.5) inherits cluster C's session learnings as opening seed material

### Status Update

- Cluster C status: **closed without delivery, scope transferred to cluster D**
- Cluster D status: **pending** (active sub-sprint per §9)
- Master plan endstate points 1–4 ownership transfers from cluster C to cluster D; point 5 (cluster A) unchanged

## 13. Refinement Amendment — Cluster D Principle Refinement (2026-05-05, afternoon)

**Trigger:** A research session 2026-05-05 (afternoon) analyzed interview-round prompts across two corpora — the Chester-recursive corpus (10 sessions, three skill generations) and the StoryDesigner corpus (12 sessions across ~16 sprints). The session produced an alternative narrative (the design system's value is organizing-surface for content the designer brings) which the designer accepted as the more accurate read of the corpus evidence. Two corrections to the alternative narrative followed in the same session, each load-bearing enough to revise the cluster D charter.

### What Changed

**Two corrections ratified as locked working tenets for cluster D:**

1. **The implementation drive is structural, not addressable by prompts.** The model's drive to implement is baked into training and cannot be redirected by prompt-level gating. The corpus revision history is direct evidence: many revisions of design (`design-figure-out` → `design-experimental` → `design-large-task`), few of specify or write. Design fights the model's nature; specify and write align with it. The "design is the code" principle is the only known move that addresses this at the right altitude — not by fighting the drive but by giving it a real solve target (the proof) at design altitude.

2. **The PM is not the input source.** The product manager has architectural intent and decision authority but does not have codebase knowledge sufficient to drive the proof forward. Treating the PM as the primary input source produces sessions that stall on input drought. The PM's role is judgment on presented venues. The agent must research the codebase, prior art, and project context, and use that research to construct well-framed decision venues for the architectural choices the PM is in a position to make.

**Cluster D §4.5 reshaped:**

- **Three organizing principles instead of two.** PM-as-decider split out as an explicit third principle so the labor asymmetry (agent generates content, PM generates decisions) cannot be silently absorbed into "shared understanding" cooperative production.
- **Principle #1 rationale rewritten** to name the structural-channel-for-implementation-drive function explicitly. The "give the agent and designer a formal language to operate with" framing is replaced. The vocabulary-corpus mechanism is retained as one expression of the principle, not the principle itself.
- **Problem statement expanded** to name all three commitments (drive channel, venue construction, read-back) in a single sentence.
- **Concerns reorganized** into eight items. Concern #2 (explorer subagents) reframed from "research the topic" to "populate decision venues" with curation as the load-bearing constraint. Concern #5 (advancement) made asymmetric in language. Concern #6 (proof system directing research) framed as solve-drive in operation. **Concern #7 (decision-substitution detection) is new** — what stops the agent from making decisions that should belong to the PM, particularly when the PM cannot detect the substitution because they lack the technical context. Concern #8 (specify handoff) preserved as end criterion.
- **Inheritance audit posture made explicit.** Cluster A and B shipped capabilities are read-only but cluster D ratifies each through the refined principle before locking; capabilities found to serve generation-of-content rather than capture-of-PM-intent are candidates for reshaping.
- **Three exit-criteria tests added.** Read-back fidelity (PM ratifies the captured artifact without correction); substitution prevention (decisions trace to PM ratification turns); drive-channel (implementation-altitude content stays out of agent commentary). Each is concrete enough to fail measurably.

### What Stays

- The 2026-05-05 reframe (§12) stands as paper trail. The transfer from cluster C to cluster D happened under the two-principle / seven-concern framing recorded there. Cluster D's current charter is the refinement of that framing, not a replacement for the transfer record.
- §11 pivot stands.
- Endstate-point treatment remains as in §12: points 3 and 4 retired by the pivot; points 1 and 2 collapse under cluster D's design-altitude commitment; point 5 unchanged.
- Cluster A + B.1 + B.2 deliverables stand.

### Artifacts Produced

- `design/rebuild-design-derivation-organizing-principle-research-2026-05-05.md` — research, two corrections, refined principle, cluster D review through the principle, counterfactual. Designer-accepted as cluster D opening context.
- `design/master-plan-cluster-d-section-proposal-2026-05-05.md` — designer-approved §4.5 replacement text (Part 1) plus revision notes (Part 2) and open items (Part 3, all six ratified). Now superseded by §4.5 in this document.

### Why This Is a Refinement, Not a Cluster Transfer

The 2026-05-04 pivot was architecture-level (same problem, different shape). The 2026-05-05 morning reframe was charter-level (different problem altitude — required a cluster transfer). The 2026-05-05 afternoon refinement is principle-level (same problem, same altitude, sharpened commitments). The cluster D charter sharpens; the cluster identity does not change. No cluster transfer is required; cluster D opens with the refined charter.

### Status Update

- Cluster D status: **pending** (active, charter refined)
- Cluster D opening seed: cluster C session learnings (per §12) as ratified through the refined principle (per §13)
- Cluster D opening tenets: the two corrections (drive structural, PM not input source) locked at session start
