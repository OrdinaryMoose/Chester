# Thinking Summary: Chester Decision-Record / Constraint-Triangle System

**Sprint:** 20260424-01-build-decision-loop
**Date:** 2026-04-24

Decision history of how the proof reached its ten necessary conditions. Captured in domain language; no proof-element IDs or MCP vocabulary.

## Key Reasoning Shifts

### 1. Problem statement reframed: from solution-shaped to structural

The session opened with the designer's intuitive problem statement — "implementation makes decisions that the spec never learns that cannot be reincorporated back into plan for implementation." Sharpened it once to "implementation surfaces spec-level decisions that never propagate to spec, tests, or future plans — breaking the feedback loop."

The designer pushed back: *"is implementing this really our problem statement?"* and quoted back the observation that dbreunig's triangle is the architectural frame, not just a citation. The statement was still describing what a mechanism would do, not the underlying structural issue.

Reframed to structural: **Chester runs pipeline-shaped but works loop-shaped; the shape mismatch produces drift at two scales.** This reframe landed at round 3 of the Understand Stage and anchored everything that followed.

### 2. Altitude: both, not either/or

I initially presented the altitude choice as exclusive — narrow (within-sprint loop closure) vs wide (cross-sprint learning via KB). Designer: *"is it both?"*

The reframe collapsed cleanly. Inner loop fires during write-code (within-sprint coherence). Outer loop fires after sprint close (cross-sprint learning). Same decision-record atom, two lifecycle phases. Not a choice, a layering.

### 3. Prior-art anchor

Initial framing reached for external design-rationale literature (IBIS / gIBIS / QOC adoption failure, ADR tradition, economic asymmetry theorizing). Designer caught this: *"why aren't we thinking about established prior art instead of wandering off on our own."*

The context-handover doc already named the prior art: dbreunig's SDD Triangle, gotalab cc-sdd spec-as-contract, Chester's own architecture table with its single Missing row. Anchored on these three going forward. The external history stayed as input but not as operative risk framing.

### 4. KB shape committed

Designer committed directly: *"kb is a separate artifact; lives in /docs/chester/decision-record and is a flat markdown file similar to memory.md."* Concrete structural commitment — no more deciding on substrate, only on contents and mechanism.

Red team pressure-tested the shape. Five findings surfaced: flat-file scale collapse, curation trigger undefined, cross-sprint supersede mechanics unresolved, plan-build consumption undefined, three-mode curation question (direct/distillation/synthesis). Designer accepted scale as known risk and asked to resolve the curation question.

### 5. Curation fork dissolved

Four candidate positions (direct write, sprint-scoped-then-promoted, dual-write, curated distillation). The reframe that dissolved the question: **separate "where records live" from "how they're read."** Direct store + filter-at-consumption handles both scale and curation without a distillation step.

The ADR failure mode fires at curation time; if there's no curation step, that failure cannot fire. This became condition #10.

### 6. Chat-dump integration mid-Understand

Designer fed the source chat that produced the context-handover doc. Substantially richer than the compressed handover. Four load-bearing additions: four-phase operational shape, validation asymmetry, spec-plan hierarchy (not peer triangle), decision-record trigger criterion. Saturation hit transition-ready at round 6.

### 7. Authority: agent-autonomous

The ontologist challenge surfaced three candidate missing conditions. Designer picked agent-autonomous over designer-approval-gated. Rationale: the trigger criterion (two or more valid implementations exist and existing artifacts don't determine) is mechanical enough to trust; interrupt ceremony would conflict with the non-interrupt discipline the structured-decision approach aims for.

### 8. Mechanical discriminator: test-skeleton pass/fail

Condition #2 required mechanical discrimination but named no mechanism. Four candidates (test skeleton, contract boundary, spec-criterion-ID reference, LLM judgment). Picked test skeleton: `build-spec` auto-scaffolds one per criterion; skeleton pass/fail at write-code time discriminates. Builds spec-test structural traceability in by construction.

### 9. Field set: MADR-adapted, fully mandatory

Industry-pattern survey surfaced Nygard ADR, MADR, Y-Statement, and the chat dump's Chester-specific structure (closest to MADR + four-way artifact links). Designer approved the full field set as mandatory. The contrarian challenge on condition #3 resolved when the field set became a designer-authored rule (not an agent-derived convention).

### 10. ID format: YYYYMMDD-XXXXX

Designer directive. Consistent with Chester's sprint-naming convention (`YYYYMMDD-##-verb-noun-noun`). ID doubles as date — no separate Date field.

### 11. Propagation destination expanded to four

Designer re-read the problem statement: *"do we need to explicitly state the feedback loop is for the existing implementation, not just for future designs and implementations."*

The original "spec, tests, or future plans" missed that code committed earlier in the current sprint may need retroactive revision when a later task surfaces a spec-level decision. Added "implementation" as a fourth destination. Condition #5 (retroactive reach into already-committed code) was added because of this revision.

### 12. Abandoned-sprint handling

Question raised during red team: if a sprint is abandoned, what happens to records it wrote to the cross-sprint store? Designer chose: add `Status: Abandoned` value; `plan-build`'s filter excludes at read; records preserved as historical but don't pollute planning input.

## Confidence Levels

- **High confidence:** the structural diagnosis (pipeline vs loop mismatch), the three bands of conditions (capture / propagation / persistence), the four propagation destinations, the ID format, the append-only supersede discipline, the agent-autonomous authority, and the direct-store-plus-filter curation approach. All anchored in designer directives or established prior art.
- **Medium confidence:** the test-skeleton-as-arbiter discriminator — the mechanism is clean conceptually but depends on `build-spec` actually auto-scaffolding skeletons (a substantial change to that skill). The downstream design will need to pressure-test whether the scaffolding is tractable.
- **Lower confidence:** the scale mitigations (flat-file growth accepted for now; plan-build filter mechanisms listed but not detailed). Designer's call to revisit when it grows is a reasoned defer, but the downstream design should not lock out future sharding.

## User Corrections

Three redirects worth recording for future lessons:

- **"Why aren't we thinking about established prior art"** (round 2) — I was reaching for adjacent literature when source material already named the prior art. Corrected to anchor on dbreunig / gotalab / Chester's own architecture table.
- **"Is implementing this really our problem statement?"** (round 3) — the problem statement was solution-shaped. Corrected to the structural pipeline-vs-loop framing.
- **"Is it both?"** (round 4) — altitude choice was exclusive-framed when layered was the right answer.

Each correction reshaped the proof's structure, not just its content.

## Alternatives Considered (and Not Chosen)

- **Curated KB with sprint-close promotion** — rejected; fires the classic ADR failure mode at the curation step.
- **Dual-write (records in both per-sprint and cross-sprint)** — rejected; sync cost and divergence risk.
- **Read-whole-file at plan-build time** — rejected; token budget collapse as the store grows.
- **LLM-judgment discrimination between spec-level and plan-level** — rejected by condition #2; violates validation-asymmetry discipline.
- **Designer-approval-gated record creation** — rejected; reintroduces interrupt ceremony the structured-decision approach is designed to replace.
- **Contract-boundary discriminator via explicit contract definitions** — rejected; Chester has no explicit contract definitions; would require a separate large build.
- **Forward-only propagation** — rejected after designer pointed out the implementation destination; retroactive reach into already-committed code is load-bearing.

Each rejection is recorded with rationale in the design brief's necessary-conditions section.
