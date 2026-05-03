# Cluster B — Context Handover to B.2 (Phase 4b Closing-Argument Materialization)

## Purpose

Inheritance package for the cluster-B.2 sub-sprint. Cluster-B.2 launches as its own design-large-task session in a new directory `cluster-b-2-define-solve-closing/`. This document plus the proof-state snapshot in this folder constitute B.2's Phase-2 inheritance input. B.2 runs the standard design-large-task flow: Bootstrap → Parallel Context Exploration → Round One → Understand Stage (revalidates inherited elements through normal saturation) → Solve Stage → Closure.

## Sequencing

B.2 runs **first** among the cluster-B follow-on sub-sprints. RULE-22 establishes the Phase 4b closing-argument shape; B.1's initialization design then targets that exit shape. Do not launch B.1 until B.2 has merged.

## Charter (B.2-scoped)

**Objective.** Define the Phase 4b closing-argument materialization mechanism — how the proof's accumulated state (Concerns, NCs, RCs, Rules, Permissions, Risks) renders as a closing argument at proof closure that satisfies RULE-22's four enforcement properties. Update the design-large-task SKILL.md Closure Protocol section, the proof MCP source where closure-condition extensions or new closing-argument materialization APIs require, and the brief template if the rendered shape requires updates.

**Scope (in).** Phase 4b closing argument: how the closing argument is composed, when it materializes, what artifact it produces, how it is presented to the designer, how it gates `closure_permitted`. Includes RULE-22's four properties (RC coverage in NC walk, tension-naming, phantom-NC handling, living-document discipline), closure-condition extensions to enforce properties, integration with cluster-A's existing closure conditions 7-10, and any new MCP API needed for materialization.

**Scope (out).** Phase 4b initialization (B.1 territory). Per-turn Solve flow internals before closure. Phase 4a redesign (cluster-C territory). Cluster-A's vocabulary changes (immutable per master-plan RULE-1).

**Endstate point inherited from master.** Closure-side portion of point 4 (confirm Phase 4b solve still valid and sufficient). RULE-22's enforcement makes the closing argument the locus of proof-to-problem-statement coverage validation, which connects this work to point 5 (end-criteria formalization).

## Inherited ratified elements — revalidate during Understand stage

B.2 should re-present these elements during its own Understand-stage saturation cycle so the designer revalidates that each still holds under B.2's scope. The revalidation discipline: each element walks past the designer once, designer says "stands" / "modify" / "drop." Lightweight pass; not full re-derivation.

### Necessary Conditions (3 — inherited from cluster-B; NOT B.2's NCs)

NC-1, NC-2, NC-3 from cluster-B carry as **forward context** for understanding the entry-side mechanism B.1 will design. B.2 may need to reason about how an initialized proof looks when the closing-argument materializer reads it; that reasoning is informed by NC-1 (boundary pairing), NC-2 (two-channel raw material), NC-3 (Concern iteration with five integration constraints). B.2 will derive its own NCs grounded in RULE-22 and its closure-side empirical baseline.

### Rules (22 — most load-bearing for B.2 highlighted)

All 22 ratified Rules carry forward.

- RULE-1 through RULE-9 — flow-independence, scope, immutability of element types, presumption of Phase 4b validity, cluster-A vocabulary inheritance.
- RULE-10 through RULE-18 — responsibility model. Carry forward; do not re-derive.
- RULE-19 — cluster-B initialization-only scope. **B.2 explicitly inverts this.** Author a new B.2-scope rule: "Cluster-B.2 is concerned with Phase 4b closing-argument materialization only. Initialization is cluster-B.1's home; per-turn Solve flow internals beyond closure are out of scope."
- RULE-20 — Concerns iterate through proof, not lock at opening. Carry as foundational context — RC mapping under RULE-22 depends on Concerns being in their final ratified shape at closure.
- RULE-21 — cluster-A planning stands as historical record; vocabulary immutable; implementation specifics open per PERM-1.
- **RULE-22 — primary inherited Rule for B.2.** RCs map to Concerns only structurally (single problem_anchor field; no NC anchor). Closing argument must walk every active NC explicitly, naming the tension that NC imposes on the RC set, and showing how the RC set — under that NC's constraint — resolves the Concerns of the problem statement. Four enforced properties:
  - **(a) RC coverage in walk.** Every ratified RC appears under at least one NC's constraint role; orphan RCs refuse closure.
  - **(b) Tension-naming requirement.** Closing-argument prose under each NC names the specific tension that NC creates on the RC set, not generic boilerplate.
  - **(c) Phantom-NC explicit handling.** Any NC withdrawn during Solve must be explicitly named in the closing argument with disposition (collapsed-into / superseded-by / no-longer-relevant).
  - **(d) Living-document discipline.** The closing argument is derived from current proof state and rebuilds whenever Concerns, NCs, or RCs change; not an artifact authored once and frozen.

  This Rule is B.2's primary derivation source. NCs in B.2's proof should ground in RULE-22 plus closure-side empirical findings.

### Evidence (11 — load-bearing subset for B.2)

EVID-1 through EVID-11 carry forward. Most relevant to B.2:

- **EVID-2** — closure conditions 7-10 added by cluster-A; skill text describes only 1-6. B.2 owns the skill-text update for the closure section.
- **EVID-3** — cluster-A machinery fully present in proof MCP; closure_permitted gate operational.
- **EVID-9** — 21-proof StoryDesigner audit baseline established the Round-1-heavy / NCs-emerge / gated-exit transition pattern. **B.2 needs its own equivalent baseline for closure-side patterns.** No closure-side audit ran in cluster-B; closing arguments today are agent-prose at Closure with no MCP-tracked materialization. B.2's first major work is establishing the closure baseline.
- **EVID-10** — five-pattern industry survey on stage-handoff. **B.2 should run an analogous industry survey on closure-of-proof patterns** (proof presentation in Event-B, requirements traceability matrix close-out in NASA V&V, BDD scenario walk-through, formal proof QED, etc.).

### Permission (1)

- PERM-1 — refactor cluster-A implementation specifics permitted (lock-at-opening timing, single-event lockConcerns API, closure-condition-7 fixed semantics, lack of merge/split/revise APIs). Cluster-A vocabulary remains immutable. Most directly relevant to B.2: closure-condition-7 fixed semantics. RULE-22's properties may require closure-condition extensions; PERM-1 covers it.

### Risks (5 — B.2 relevance noted)

- **RISK-1** — cascade fatigue at high RC counts (basis NC-3, RULE-22). **B.2 should explicitly mitigate** since RULE-22's living-document discipline depends on RCs staying current; cascade fatigue erodes the property.
- RISK-2 — late-lock procrastination (basis NC-3). B.1 territory primarily.
- RISK-3 — designer fatigue producing gestalt approval (basis NC-3, RULE-20). B.2 relevant for ratification of closing-argument prose.
- RISK-4 — CN/CERN naming inconsistency (basis EVID-5). B.2's brief and skill text should use consistent naming; verify before merge.
- **RISK-5** — declared-but-unconsumed flow artifacts (basis EVID-7, RULE-7). RULE-22 declares closing-argument as a derived artifact; B.2's design must include its consumer (closure_permitted gate, brief render). Avoid recurrence.

## Methodology guidance

### Empirical baseline must be established

Cluster-B's empirical baseline (21-proof transition audit) does not cover closure-side. B.2's first major Solve work is to audit historic proof closures:

- Walk N historic StoryDesigner / Chester proof closures. Sample size: aim for at least 10-15 proofs that reached closure.
- Per closure, capture: how was the closing argument composed (agent-authored prose at Closure today; no MCP tracking), what NC/RC/Concern shape was at closure_permitted, how did the designer engage with the closing argument, were there closure-protocol failures or rework events.
- Identify patterns: convergent practice across closures, divergent practice (where authoring style varied), failure modes (where closing arguments were thin, missed NCs, or required rework).
- This baseline grounds B.2's NCs analogously to how EVID-9 grounded cluster-B's NCs.

### Cluster-A / Cluster-B simulation methodology applies

Walk historic briefs against the proposed closing-argument mechanism; identify gaming vectors at HIGH/MEDIUM/LOW severity per RULE-22's four properties; surface mitigations; fold into NCs.

The option-d simulation that produced RULE-22 is a precedent — sketched mock closing arguments per brief, surfaced failure modes (preservation NCs without RC mapping, sparse-NC with orphan RCs, living-document under iteration), recommended mitigations. B.2 should run a similar simulation with greater depth once the closure-baseline audit is complete.

### Industry survey on closure-of-proof patterns

Cluster-B's industry-explorer survey covered transition patterns. B.2 should commission a parallel survey on closure / final-presentation / QED patterns:

- Event-B proof discharge presentation (PO obligations satisfied; visible discharge ledger).
- NASA V&V close-out (Requirements Verification Matrix complete; system delivery review).
- Coq/Lean QED (qed itself is the closure event; tactic trace is the argument).
- BDD scenario walk-through (each scenario passes; test report is the argument).
- TLA+ model-checked proof (no counterexample within bounds; proof envelope).

Pitfalls and patterns from the survey ground B.2's design.

### Translation Gate strict

Designer-facing voice stays plain language. RULE-22's four properties are agent-internal vocabulary; designer-facing presentation talks about "the closing argument," "what gets rendered at closure," "how the proof shows what it solved." Internal precision via `capture_thought` tag `private-precision`.

## Files cluster-B.2 will likely touch

Speculative — B.2's own scope decisions confirm or revise:

- `skills/design-large-task/SKILL.md` — Closure Protocol section, possibly Closing Argument step (new or expanded).
- `skills/design-large-task/proof-mcp/metrics.js` — checkClosure if RULE-22 enforcement requires new closure conditions (11+) or reshape of conditions 7-10.
- `skills/design-large-task/proof-mcp/server.js` — possibly a `materialize_closing_argument` tool or extension to `get_proof_state` that emits the closing argument per RULE-22's properties.
- `skills/design-large-task/proof-mcp/state.js` — closing-argument state if any (probably not — RULE-22's living-document property suggests derivation, not storage).
- `skills/design-large-task/references/design-brief-template.md` — closing-argument render shape; possibly a new section.

## Open items not yet captured as proof elements

- **Closure-baseline audit** — must run in B.2's own Solve work to ground NC derivation.
- **Closure-of-proof industry survey** — must commission in B.2's Phase-2 Parallel Context Exploration.
- **Cluster-A code-level integration debt** — concerns array initialization in legacy state files, brief template `(round n)` mapping documentation gap, brief→spec coverage rule strictness gap. Captured in cluster-a-define-solve-deferred-00.md. Some of these touch closure rendering; B.2 may close them.

## Forward dependency for B.1

B.2's outputs become Rules for B.1. Specifically:

- B.2's closing-argument shape decisions (what fields the proof exposes, what shape closure_permitted enforces, what brief section renders the argument) constrain B.1's initialization design — the initialized proof must produce material the closing argument can consume.
- B.2's possible new closure conditions (11+) constrain B.1's understanding of when initialization must terminate so the proof reaches a state the closing argument can materialize.

B.1's brief should inherit B.2's outputs as Rules in its own master-plan-style inheritance.

## Proof state snapshot

Bytewise copy of cluster-B's proof state at termination lives at:

```
docs/chester/working/20260430-02-rebuild-design-derivation/cluster-b-define-transition/summary/cluster-b-define-transition-proof-state-snapshot-00.json
```

Round 10 state. 42 elements: 22 Rules, 3 NCs, 11 Evidence, 1 Permission, 5 Risks. closure_permitted: true (not exercised). All grounding chains, reasoning chains, collapse tests, and ratification logs preserved. B.2 reads this file as Phase-2 exploration material.

## Termination provenance

This handover doc is one of two. Sister doc: `cluster-b-context-handover-to-b1.md` in the same folder. Cluster-B umbrella session terminated 2026-05-02 with the split decision. Master-plan.md updated to reflect split. `cluster-b-define-transition/` directory preserved as historical record; B.2 launches in new dir `cluster-b-2-define-solve-closing/`.

<!-- created-at: 2026-05-02T11:47:04Z -->
<!-- produced-by design-large-task@v0009 -->
