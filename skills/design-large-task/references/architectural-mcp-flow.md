# Architectural-MCP Per-Turn Flow (Reference)

**Status:** Stub — under development. Full integration pending sprint per
`docs/feature-definition/Pending/understanding-mcp-lane-2-redesign-00.md`.

This reference describes the per-turn cycle for design-large-task when
the Understanding MCP swap line in `SKILL.md` is set to `architectural`.

## When to Use

Set `ACTIVE_UNDERSTANDING_MCP: architectural` in the swap-line block at
the top of `SKILL.md` when:

- The work is a software architecture redesign (greenfield, brownfield, or process/meta).
- You want inward calibration scoring (designer-relationship grounded) over
  classic landscape/foundations saturation.
- You want asymmetric event multipliers rewarding REVISE/CONTRADICT over CONFIRM.

## Tool Surface (architectural MCP)

```
mcp__chester-design-understanding-architectural__initialize_understanding
mcp__chester-design-understanding-architectural__confirm_problem_type
mcp__chester-design-understanding-architectural__reclassify_problem_type
mcp__chester-design-understanding-architectural__register_predictions
mcp__chester-design-understanding-architectural__resolve_predictions
mcp__chester-design-understanding-architectural__submit_round_evidence
mcp__chester-design-understanding-architectural__mark_falsifier_triggered
mcp__chester-design-understanding-architectural__get_understanding_state
```

## Six Tenets

1. **`reach_profile`** — breadth × depth × scale (independent numeric sub-axes).
2. **`existing_system_disposition`** — REPURPOSE / ADAPT / KEEP-AS-IS / DEPRECATE / KILL / BIRTH-NEW per system.
3. **`fragility_coupling_map`** — fragility signals (with evidence handles) + coupling fan-in/out.
4. **`pattern_principle_lineage`** — established patterns + principles honored + prior attempts.
5. **`vision_alignment`** — ALIGNED / NEUTRAL / DEVIATES per architectural move (DEVIATES requires justification).
6. **`maintainability_forecast`** — complexity / knowledge-distribution / evolvability / debt-trajectory.

## Round Cycle (sketch)

1. **Pre-question**: `register_predictions(...)` for each predicted designer stance about to be asked.
2. **Designer turn arrives**.
3. **Resolve**: `resolve_predictions(...)` with verbatim quote + outcome + optional model_update.
4. **Submit**: `submit_round_evidence(...)` with per-tenet entries (each with event_type), 3 frame_falsifiers, divergences, negative_evidence, optional architectural_target_artifact_present.
5. **Read response**: weakest tenet, prediction calibration, suspicion flags, transition state.
6. **Choose next probe**: pursue weakest tenet with prediction-locked question.

## Init Sequence

1. `initialize_understanding(user_prompt, proposed_type, state_file)` — agent proposes problem type.
2. Round-One framing presents proposed type to designer.
3. `confirm_problem_type(state_file, problem_type, designer_turn_id)` — locks weight profile.
4. Round-One baseline submission: first `submit_round_evidence` call after type confirmation.

## Transition Gate

Ready iff:
- Every tenet ≥ 0.40 (floor)
- Overall (weighted per locked profile) ≥ profile threshold (default 0.70)
- ≥ 3 locked predictions, hit rate meeting rising floor (round 1: 40%, round 4: 60%, round 7: 70%), ≥ 1 disconfirming prediction (confidence ≤ 0.55)
- Architectural target artifact present
- No major OPEN divergence without designer disposition
- No unresolved ERROR-severity suspicion flag

## Asymmetric Multipliers

- `CONFIRM` 1.0x, `EXTEND` 1.0x, `REVISE` 1.4x, `CONTRADICT` 1.6x.
- Prediction HIT-low-confidence (≤0.55): 1.5x. HIT-high-confidence (≥0.85): 0.7x.
- Prediction MISS-with-model-update: 1.5x. MISS-without-update: 0.5x.
- REVISE/CONTRADICT density cap: 30% of round entries; overflow defaults to 1.0x.

## Status

This document is a stub describing the surface. Full per-turn instructions
matching the depth of `SKILL.md` Phase 5 will be authored in the sprint
that integrates the architectural flow into design-large-task. Until then,
the swap line defaults to `classic`.
