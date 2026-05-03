# Cluster B — Context Handover to B.1 (Phase 4b Initialization)

## Purpose

Inheritance package for the cluster-B.1 sub-sprint. Cluster-B.1 launches as its own design-large-task session in a new directory `cluster-b-1-define-transition/`. This document plus the proof-state snapshot in this folder constitute B.1's Phase-2 inheritance input. B.1 runs the standard design-large-task flow: Bootstrap → Parallel Context Exploration → Round One → Understand Stage (revalidates inherited elements through normal saturation) → Solve Stage → Closure.

## Sequencing

B.1 runs **after** B.2. B.2 establishes the Phase 4b closing-argument shape under RULE-22; B.1's initialization design then targets that exit shape. B.1 inherits B.2's outputs as Rules at session start. Do not launch B.1 until B.2 has merged.

## Charter (B.1-scoped)

**Objective.** Define the Phase 4b initialization sequence — how raw Phase 4a material types into the proof MCP at the boundary. Update the design-large-task SKILL.md Solve Stage Opening section, the proof MCP source where cluster-A's element decisions or the new initialization sequence requires, and the brief template if the rendered shape requires updates.

**Scope (in).** Phase 4b initialization: the procedural steps from boundary entry through the moment per-turn Solve work begins. Includes typing raw material into Evidence/Rule/Permission/Concern/RC, sequence ordering of the structuring steps, responsibility assignment per step, problem-statement ratification handling, and concern iteration mechanism per NC-3.

**Scope (out).** Closing argument materialization (B.2 territory). Per-turn Solve flow internals beyond initialization. Closure protocol. Phase 4a redesign (cluster-C territory).

**Endstate point inherited from master.** Point 3 (define the Phase 4a → Phase 4b process) and the initialization-side portion of point 4 (confirm Phase 4b solve still valid and sufficient).

## Inherited ratified elements — revalidate during Understand stage

B.1 should re-present these elements during its own Understand-stage saturation cycle so the designer revalidates that each still holds under B.1's scope. The revalidation discipline: each element walks past the designer once, designer says "stands" / "modify" / "drop." Lightweight pass; not full re-derivation.

### Necessary Conditions (3)

- **NC-1** — Phase 4b initialization sequence in skill text must contain explicit, ordered steps pairing each kind of raw Phase 4a material with the proof API call that structures it AND naming the responsibility for each step. Six pairings: problem statement, Concerns, Evidence, Rules, Permissions, Resolve Conditions. NCs and Risks excluded from boundary structuring — they emerge during per-turn Solve work.
- **NC-2** — Raw Phase 4a material at the boundary lives in two channels. Channel one: agent-drafted designer-approved problem statement, structurally carried as initialize_proof parameter. Channel two: agent session memory holding draft Concerns, surfaced codebase observations, surfaced designer directives, identified Risks — accessible via continuous session context.
- **NC-3** — Phase 4b's per-turn Solve workflow must support iterative Concern refinement (collapse/expand/revise/add) driven by accumulating Evidence and Risk examination. Five integration constraints: (a) sequential ratification preserved at every iteration event, (b) late-lock procrastination gate, (c) merge evidence bar (agent-proposed merges require Evidence citation), (d) split RC autogeneration, (e) invalidation-impact preview before merge/split commits.

### Rules (22)

All 22 ratified Rules carry forward. Notable subset most load-bearing for B.1:

- RULE-1 through RULE-9 — flow-independence, scope, immutability of element types, presumption of Phase 4b validity, cluster-A vocabulary inheritance.
- RULE-10 through RULE-18 — responsibility model: agent drafts/translates/derives, designer authors Rules/Permissions/ratifies, Phase 4a surfaces draft Concerns, Phase 4b ratifies.
- RULE-19 — cluster-B initialization-only scope. **Carry into B.1 with text update: "Cluster-B.1 is concerned with Phase 4b initialization only."** Add explicit handoff note that closing-argument materialization is cluster-B.2's home.
- RULE-20 — Concerns iterate through proof, not lock at opening.
- RULE-21 — cluster-A planning stands as historical record; vocabulary immutable; implementation specifics open per PERM-1.
- **RULE-22 (forward constraint, not consumed in B.1).** RCs map to Concerns only structurally; closing-argument materialization rules. Cluster-B.2 is the consumer. B.1 records this Rule but does not derive NCs from it. The Rules section of B.1's design brief should annotate RULE-22 with: "Ratified in cluster-B (parent); consumer is cluster-B.2 (closing-argument materialization). Cluster-B.1 inherits as forward constraint without in-cluster derivation."

### Evidence (11)

EVID-1 through EVID-11 carry forward. Most load-bearing for B.1:

- EVID-1 — current Solve Stage Opening sequence in skill text (3 steps; no Concern/RC steps).
- EVID-2 — checkClosure conditions 7-10 added by cluster-A; skill text describes only 1-6.
- EVID-3 — cluster-A machinery fully present in proof MCP; only skill text describing how to operate it is missing.
- EVID-4 — initialize_proof handler accepts only problem_statement + state_file at init time; manage_concerns and ratify_resolve_condition are post-init.
- EVID-5 — CN/CERN naming inconsistency between brief template and state code.
- EVID-6 — five capture-system TODOs in brief template (RE-xx, PN-xx, EV-xx, IC-xx, RK-xx).
- EVID-7 — Solve Leakage Ledger declared in problemfocused flow as Phase-4b seed but no consuming step in skill text.
- EVID-8 — team-interview flow's Proof Seeding mapping table; only flow with complete Phase-4a → proof-element mapping.
- EVID-9 — 21-proof StoryDesigner audit baseline (naked-transition / heavy-Round-1 / emergent-NCs / gated-exit pattern).
- EVID-10 — five-pattern industry survey (Event-B, NASA RVM, MLIR, KAOS, BDD) confirming naked-transition pattern as industry standard.
- EVID-11 — designer-direct: zero-NC transition prevention is exit-side, not entry-side.

### Permission (1)

- PERM-1 — refactor cluster-A implementation specifics permitted (lock-at-opening timing, single-event lockConcerns API, closure-condition-7 fixed semantics, lack of merge/split/revise APIs). Cluster-A vocabulary remains immutable. Relieves RULE-19 + RULE-8 (master-plan RULE-6 preservation bias for Phase 4b sufficiency). Carry into B.1 with text update aligning to B.1 scope.

### Risks (5)

- RISK-1 — cascade fatigue at high RC counts (basis NC-3, RULE-22).
- RISK-2 — late-lock procrastination (basis NC-3).
- RISK-3 — designer fatigue producing gestalt approval (basis NC-3, RULE-20).
- RISK-4 — CN/CERN naming inconsistency (basis EVID-5).
- RISK-5 — declared-but-unconsumed flow artifacts beyond Solve Leakage Ledger (basis EVID-7, RULE-7).

## Open items not yet captured as proof elements

These surfaced during Solve work but were not authored as elements before termination. B.1 should consider whether they need typing during its own Understand or Solve stage:

- **Cluster-A code-level integration debt** — concerns array initialization in legacy state files (handled by loadState backfill in cluster-A delivery), brief template `(round n)` mapping documentation gap, brief→spec coverage rule strictness gap. Captured in cluster-a-define-solve-deferred-00.md.
- **B.1 → design-specify hand-off shape** — cluster-A's brief template change (8 → 9 sections) flowed through design-specify v0001 → v0002. B.1's initialization-sequence work may further affect how design-specify reads the brief; verify against current design-specify version at B.1 hand-off.

## Methodology guidance

- **Empirical baseline available.** EVID-9's 21-proof StoryDesigner audit is reusable for B.1 simulation. Any proposed initialization mechanic should pass simulation against historic transitions.
- **Cluster-A simulation methodology applies.** Walk historic briefs against the proposed mechanism; identify gaming vectors at HIGH/MEDIUM/LOW severity; surface mitigations; fold mitigations into NCs (cluster-A precedent: NC-3 with five integration constraints).
- **Translation Gate strict.** Designer-facing voice stays plain language. Internal precision via `capture_thought` tag `private-precision`.
- **Forward-constraint discipline.** RULE-22 lives in the Rules section of B.1's brief; do not derive NCs from it; do annotate it as cluster-B.2's consumer.

## Files cluster-B.1 will likely touch

Inherited from cluster-B's own derivation:

- `skills/design-large-task/SKILL.md` — Solve Stage Opening section, possibly Per-Turn Flow if initialization changes ripple.
- `skills/design-large-task/proof-mcp/server.js` — initialize_proof handler if signature changes.
- `skills/design-large-task/proof-mcp/state.js` — initializeState if pre-seeded shape changes.
- `skills/design-large-task/references/design-brief-template.md` — if brief shape requires updates.
- `skills/design-large-task/references/team-interview-flow.md` — Proof Seeding mapping (already present, may need conformance checks).
- `skills/design-large-task/references/problemfocused-mcp-flow.md` — Solve Leakage Ledger consumption wiring (closes EVID-7).
- `skills/design-large-task/references/classic-mcp-flow.md` — flow-independence verification.

Cluster-B.1's own scope decisions confirm or revise this list.

## Proof state snapshot

Bytewise copy of cluster-B's proof state at termination lives at:

```
docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-define-transition/summary/cluster-b-define-transition-proof-state-snapshot-00.json
```

Round 10 state. 42 elements: 22 Rules, 3 NCs, 11 Evidence, 1 Permission, 5 Risks. closure_permitted: true (not exercised). All grounding chains, reasoning chains, collapse tests, and ratification logs preserved. B.1 reads this file as Phase-2 exploration material.

## Termination provenance

This handover doc is one of two. Sister doc: `cluster-b-context-handover-to-b2.md` in the same folder. Cluster-B umbrella session terminated 2026-05-02 with the split decision. Master-plan.md updated to reflect split. `cluster-b-define-transition/` directory preserved as historical record; B.1 launches in new dir `cluster-b-1-define-transition/`.

<!-- created-at: 2026-05-02T11:47:04Z -->
<!-- produced-by design-large-task@v0009 -->
