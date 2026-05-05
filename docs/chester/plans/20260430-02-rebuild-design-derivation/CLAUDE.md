# Rebuild Design Derivation — Master Plan CLAUDE.md

## Purpose

This file documents the structures, rules, and processes that govern the **rebuild-design-derivation master plan** (`20260430-02-rebuild-design-derivation`). Every Chester sub-cluster under this master inherits the commitments captured here. Read this file in full at the start of any session that touches this master plan tree.

This file is **normative for this master only**. Root `CLAUDE.md` and Chester repo conventions still govern; this file adds master-plan-specific commitments on top.

## Reading Order at Session Start

When a new sub-cluster session begins under this master:

1. Read root `/home/mike/Documents/CodeProjects/Chester/CLAUDE.md` (project-wide).
2. Read this file (master-plan commitments).
3. Read `master-plan.md` (the cluster sequence and locked context).
4. Read the cluster-A handoff document if present (`cluster-a-define-solve/design/cluster-a-handoff-from-master-planning.md`).
5. Read prior cluster design briefs (`*-design-00.md`) when they exist for clusters preceding the active one.

Skipping any of (2), (3), or (4) means inheriting commitments without seeing them.

## Endstate — Five-Point Picture

This master plan delivers five things together. Each cluster owns specific points; clusters do not work in isolation from these:

1. **Phase 4a focuses on design-level planning, not implementation or solve-level tasks.** Cluster C ownership.
2. **Phase 4a's understanding MCP is revised into a more formalized language that can transition information into the solve MCP.** Cluster C ownership; aligned with cluster B's transition process.
3. **The Phase 4a to Phase 4b process is defined.** Cluster B ownership.
4. **The Phase 4b solve process is confirmed valid and sufficient.** Cluster B ownership; default is preservation, not refactor.
5. **The end criteria are formalized — what we are solving is defined; the shape matches the input requirements of the design-specify skill.** Cluster A ownership.

## Architecture — The Phase 4a / Phase 4b Pipeline

This master plan's target is the design-derivation pipeline inside `design-large-task`:

- **Phase 4a (Understand stage)** — currently produces saturation-scored tenet entries plus a glossary under one of three pluggable Understanding MCPs (classic, problemfocused, team-interview). **Only one Understanding MCP is in scope for this sprint** — the flow cluster C targets. The other two remain in place as deprecation candidates handled by a future sprint. The plugin architecture (swap-line in SKILL.md + per-flow reference files + multi-package MCP server arrangement) is preserved.
- **Phase 4b (Solve stage)** — currently runs the proof MCP with five element types (NC, Rule, Permission, Evidence, Risk). Cluster B confirms validity and sufficiency; default is preservation. Cluster A's end-criteria work may require closure-check or schema extensions; cluster B integrates those changes.
- **Transition** — currently the ratified problem statement is the only structural thing carried forward from Phase 4a to Phase 4b. Cluster B defines the new transition process; concrete shape settled there.

## Vocabulary Lock

The following names are **designer-locked** and must appear verbatim in all sub-cluster work. Do NOT rename, paraphrase, or substitute synonyms.

### Immutable Proof Element Types

- `Necessary Condition` (NC) — must be true for the design to hold
- `Evidence` — codebase / industry / friction facts
- `Rule` — designer-directed restriction
- `Permission` — designer-directed relief from a Rule
- `Risk` — hazard with basis pointer
- `Problem statement` — designer's confirmed hypothesis

### Phase Names

- `Phase 4a` — Understand stage
- `Phase 4b` — Solve stage

### Working Glossary (revisable inside clusters per cluster scope)

- `Sufficient Condition` (working name) — placeholder for the resolution-claim element; cluster A settles final naming and shape (new element type vs NC extension vs other)
- `Discovery lens` — agent-side probing angle in Phase 4a; cluster C validates
- `Scope`, `Givens`, `Dependencies` — discovery lenses; cluster C validates atomicity and sufficiency
- `Pre-seeded proof` — working name for the Phase 4a output shape; cluster B settles the transition mechanism

### Descriptive Terms (not load-bearing locks)

- `Derivation gap` — the structural fault between problem statement and proof closure
- `Solve-drive` — designed-for property of the agent (must land at design altitude)

### Deprecated

- `Acceptance Criteria` — vague semantics; replaced by the resolution-claim concept whose final shape lands in cluster A

## The Resolution-Claim Five Attributes

The end criteria, formalized. Whatever cluster A produces must carry all five. **Designer-ratified — the five attributes are locked; only the element naming and concrete fields are open inside cluster A.**

1. **Observable** — names a state of the world a developer or test could check
2. **Designer-ratified** — the designer commits that this observable counts as resolution
3. **Problem-statement-anchored** — explicitly resolves a named aspect of the hypothesis
4. **Forward-looking** — describes a future state the design will produce, not a current state Evidence describes
5. **Non-restrictive** — does not limit the design space (Rules do that); certifies the design space's exit condition

## What design-specify Needs (the consumer-pull shape)

design-specify must generate solutions that are **feasible**, **acceptable**, and **complete**. Specify needs three artifacts to make those claims:

- A **constraint envelope** — what the design cannot violate / must respect / must avoid. Today fully expressible in the five immutable element types.
- A **resolution criterion** — what observable state counts as the problem being solved. Cluster A formalizes this.
- A **coverage map** — every aspect of the problem statement traces to at least one constraint and one resolution criterion. Cluster A or B settles concrete shape.

## Designer-Ratified Core Tenets

- **Design = the problem (what), not the implementation (how).** Phase 4a owns the what; mechanism shapes belong in Phase 4b or downstream.
- **Agent has solve-drive — designed-for.** The system gives the agent the problem we want it to solve. No cluster proposes prohibiting drive expression.
- **`design-specify` generates solutions.** The proof produces input for specify; specify owns architectural shape choice.

## Cluster Dependency Lock

Strict sequencing — each cluster's outputs become Rules for downstream clusters:

```
Cluster A — Define Solve  (endstate point 5)
   ↓
Cluster B — Define Transition  (endstate points 3, 4)
   ↓
Cluster C — Restructure Understand  (endstate points 1, 2)
```

No parallel execution. Cluster B reads A as Rules; Cluster C reads A and B as Rules.

## Evidence Inheritance

The master plan's Evidence Register (master-plan.md section 5) is read-only inheritance for all clusters. Cluster-internal sub-sprints may add Evidence to their own proof; they may not revise master-level Evidence.

## Rules Inheritance

The master plan's Rules section (master-plan.md section 6) is read-only inheritance for all clusters. RULE-1 through RULE-10 are designer-locked; no cluster may issue Permissions against master-level Rules without designer ratification recorded in the cluster's proof.

Of particular note:

- **RULE-1** locks the five existing element types.
- **RULE-6** sets the bias for cluster B: Phase 4b is presumed valid and sufficient; cluster B confirms, not refactors.
- **RULE-7** locks the five resolution-claim attributes; cluster A settles naming and shape only.
- **RULE-9** locks cluster sequencing.
- **RULE-10** locks Phase 4a's output to be expressible in the solve MCP's vocabulary — cluster C's "formalized language" cannot be a separate vocabulary requiring translation; it must transition structurally into Phase 4b.

## Three-Layer Discipline

Per master-plan section 1:

- **Layer 1** — this master plan; META-level only; no per-cluster design detail
- **Layer 2** — per-cluster Chester pipeline cycles; each cluster runs design-large-task → design-specify → plan-build → execute-write
- **Layer 3** — code in the Chester plugin (skills/design-large-task/, skills/util-design-partner-role/)

Sub-cluster sessions operate at Layer 2. They produce design-level artifacts, specs, plans, and executed code. They do not edit this master plan or this CLAUDE.md unless the master plan itself needs revision (which requires a master-plan-revision sub-session, not a normal cluster cycle).

## Active Master Mode

This master is activated by `.active-master` breadcrumb at the working-directory level pointing to `20260430-02-rebuild-design-derivation`. Sessions running with this breadcrumb default to operating inside this master tree. Delete the breadcrumb to exit master mode.

## Known Risks

See master-plan.md section 7. RISK-1 through RISK-7 are inherited by all clusters as awareness; clusters may surface cluster-specific risks against their own proofs without master-level escalation unless a cluster's risk invalidates a master-level Rule.

## Cluster D Charter — Build Shared Understanding (2026-05-05)

Cluster D supersedes cluster C as the active sub-sprint. See master-plan.md §4.5 and §12 for the full charter and the reframe lineage.

### Two Organizing Principles (designer-ratified 2026-05-05)

1. **"Design is the code."** The design system has a formal language that the agent and designer operate within. The agent's drive toward implementation is harnessed back into design altitude through that language. Rule-class for cluster D.
2. **"The purpose is to create Shared Understanding."** The design system's reason for existing is to produce shared understanding between agent and designer. Through shared understanding the system delivers commonly understood design requirements to Specify. Rule-class for cluster D.

### Cluster D Operative Statement

> How do we create a unified design system that builds shared understanding of the problem that delivers commonly understood design requirements to the Specify system.

Seven concerns anchor the design (sub-sprint will ratify and lock):

1. Initial information available to the skill and how the initial topic and concerns are derived
2. Explore agents researching information relevant to our topic
3. Presentation layer — how information is provided to the designer to build shared understanding
4. Proof layer — how the agent faithfully manages information to build shared understanding
5. Agent and designer cooperatively advancing the proof
6. Proof system directing agent research for the next round presentation
7. Proper information provided to specify so it creates architecture that correctly addresses designer's intent

### Inheritance for Cluster D

- All A + B.1 + B.2 shipped capabilities
- Cluster C session learnings (organizing principles + reframed problem statement + 7 concerns + 6 evidence pieces with reclassified sources) carried forward as cluster D opening seed
- Master plan R1–R10 still set aside per §11; cluster D reauthors any rule it needs
- Vocabulary corpus at `cluster-a-define-solve/summary/vocabulary-corpus-2026-05-05.md`

## Pivot Amendment — Cluster C (2026-05-04)

Cluster C session 2026-05-04 surfaced that the Phase 4a / Phase 4b separation is the structural defect cluster C was supposed to repair. Designer ratified a **one-system architecture** pivot. See master-plan.md §11 for the full amendment and `cluster-c-restructure-understand/design/cluster-c-proof-seed.json` for the session-internal restart manifest. **Status:** Cluster C closed without delivery 2026-05-05; scope transferred to cluster D (see above).

### Implications for This CLAUDE.md

- **Endstate Five-Point Picture** — points 1–4 are reshaped for cluster C scope. Cluster C's new ownership is the one-system redesign. Point 5 (end criteria formalized) stands.
- **Architecture — The Phase 4a / Phase 4b Pipeline** section is paper trail for clusters A and B; for cluster C, the 4a/4b split dissolves.
- **Vocabulary Lock — Phase Names** (`Phase 4a`, `Phase 4b`) are preserved as immutable historical names in master plan paper trail. Cluster C's conversation does not need them; the proof MCP runs continuously without a named boundary.
- **The Resolution-Claim Five Attributes** stand unchanged. RC element survives the pivot.
- **What design-specify Needs (the consumer-pull shape)** stands unchanged. Constraint envelope + resolution criterion + coverage map are the master-level commitments to specify; cluster C produces them via one system rather than a two-stage handoff.
- **Designer-Ratified Core Tenets** stand unchanged.
- **Rules Inheritance** — master plan R1–R10 are set aside for cluster C's internal session per the proof seed. They remain the framing under which clusters A and B designed and shipped; cluster C reauthors any rule it needs.
- **Three-Layer Discipline** unchanged.
