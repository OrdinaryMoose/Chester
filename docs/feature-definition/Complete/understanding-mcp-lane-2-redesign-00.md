# Feature Definition Brief: Understanding MCP Lane-2 Redesign — Inward Criteria, Flat Weighting, Asymmetric Scoring

**Status:** Draft
**Date:** 2026-04-27
**Successor to:** 20260425-01-redesign-convergence-model (Lane 1 shipped voice discipline + telemetry; Lane 2 was deferred as gate-mechanism redesign pending evidence)

---

## Problem Statement

Chester's design-large-task skill (formerly design-experimental) governs the Understand Stage with a nine-dimension Understanding MCP that scores three groups (landscape 40%, human_context 30%, foundations 30%) per round, computes group-averaged saturation, and gates transition to the Solve Stage at overall ≥ 0.65 with each group ≥ 0.50.

Audit of six sprints that exercised this MCP revealed three structural failure classes:

1. **Three of nine dimensions degenerate or invert.** `temporal_context` chronically produces boilerplate (build-decision-loop scored 0.15→0.20 across six rounds with verbatim-repeated justifications). `assumption_inventory` conflates "designer unconfirmed" with "untested" — silence treated as validation failure rather than tracking validation through conversation. `problem_boundary` *penalizes* the discovery of hidden scope variables (build-decision-loop round 3 dropped 0.50→0.45 because the agent found a new scope dimension), inverting the dimension's stated purpose.
2. **Two dimension pairs blur load-bearing responsibility.** `risk_topology` and `prior_art` both claim industry-failure history (the build-decision-loop "wandering" self-correction at round 4). `constraint_discovery` and `stakeholder_impact` both claim ceremony cost. Single design questions diffuse across multiple dimensions with no clear ownership.
3. **The framework is gameable from inside the agent.** The redesign-convergence-model sprint identified this explicitly: "saturation scoring is gameable from inside the agent — climb scores by writing better justifications without deeper understanding" (design-00.md:10–11). The current `validateUnderstandingSubmission` checks only that `justification` is non-empty; any prose passes. Boilerplate fluency reaches transition without the designer ever being engaged on the agent's actual model.

The Lane-1 sprint added telemetry (`groupSaturationHistory`, `transitionHistory`, `warningsHistory`) and voice discipline (C1 externalized coverage, C2 fact/assumption/opinion marking) so Lane 2 could redesign the gate on evidence. This brief is Lane 2.

The redesign replaces the nine grouped dimensions with **six inward-focused criteria, flat-weighted per problem type, with mechanical anti-game enforcement at the MCP API boundary**. Inward focus means each criterion measures the agent's calibration to the designer (whether the agent's mental model of the designer's mental state is grounded and predictive) rather than the agent's coverage of territory (whether the agent has read enough material). Asymmetric scoring multipliers reward frame revision over frame confirmation, aligning the agent's local optimization gradient with the deeper-understanding behavior the Understand Stage exists to cultivate.

### Prior attempts

- **v01 nine-dimension MCP** (current). Six sprints of evidence. Strengths in landscape group (`surface_coverage`, `relationship_mapping`, `prior_art` work as designed). Weaknesses concentrated in foundations group, with three dimensions identified as failing or inverted.
- **20260425-01-redesign-convergence-model Lane 1** (shipped). Added voice discipline and telemetry. Did not redesign the dimensions or gate. Explicit deferral with evidence-collection rationale.
- **No prior attempt at inward focus.** Every prior version measured agent's understanding of the problem, not agent's calibration to the designer. The shift is novel for Chester.

---

## Current State Inventory

### Understanding MCP server (`skills/design-large-task/understanding-mcp/`)

- `scoring.js` — defines `DIMENSION_GROUPS` (landscape, human_context, foundations) and `GROUP_WEIGHTS` (0.40 / 0.30 / 0.30). Pure functions: `validateUnderstandingSubmission`, `computeGroupSaturation`, `computeOverallSaturation`, `findWeakestDimension`, `collectGaps`, `checkTransitionReady`. `OVERALL_THRESHOLD = 0.65`, `GROUP_THRESHOLD = 0.50`.
- `state.js` — persisted MCP state shape. Stores per-round scores, justifications, gaps. Lane 1 added `groupSaturationHistory`, `transitionHistory`, `warningsHistory` telemetry.
- `server.js` — MCP tool surface: `initialize_understanding`, `submit_understanding`, `get_understanding_state`. 198 lines.
- `__tests__/` — `scoring.test.js`, `state.test.js`. Unit-test coverage of scoring math and state transitions. No semantic verification tests (no quote round-trip, no LLM-judge integration).

### design-large-task skill (`skills/design-large-task/SKILL.md`)

- Round One framing requires `initialize_understanding` + baseline `submit_understanding` before any designer-facing turn. HARD-GATE language: "If you catch yourself composing a turn without having called `initialize_understanding`, stop mid-compose."
- Phase 5 (Understand Stage) per-turn cycle: capture thinking → score nine dimensions → read MCP response → choose topic from weakest-dimension signal → compose information package.
- Transition to Solve Stage gated on MCP `transition_ready: true` + designer confirmation.
- References the nine dimensions by name in multiple places. Migration must update all references.

### Sprint evidence corpus

- `docs/chester/plans/20260424-01-build-decision-loop/design/build-decision-loop-understanding-state.json` — only fully-persisted MCP state. Six rounds of scoring with justification + gap text per dimension. Primary evidence base for the audit.
- `docs/chester/plans/20260425-01-redesign-convergence-model/summary/redesign-convergence-model-session-transcript.jsonl` — Lane-1 session transcript with `submit_understanding` calls.
- Five additional sprints (`20260408-03-plan-mode-design-guard`, `20260410-01-build-small-task-skill`, `20260417-03-optimize-chester-throughput`, `20260423-01-refactor-chester-skills`) with design and audit documents under the design-experimental name.

### design-large-task references

- `references/design-brief-template.md` — current brief template references the nine dimensions when describing the thinking summary's saturation history. Must be updated to the new six.
- `agents/design-large-task-industry-explorer.md` — independent named subagent for Phase 2 industry exploration. No changes required.

---

## Governing Constraints

- **The two-stage Understand → Solve separation is preserved.** This redesign affects only the Understand Stage gate. Solve Stage uses the Design Proof MCP (necessary-conditions model) and is unchanged.
- **The Round One bootstrap discipline is preserved.** Initialization before any designer-facing turn remains a HARD-GATE invariant.
- **The MCP-driven topic selection (weakest-dimension signal) is preserved.** Implementation changes (new dimensions, new computation) but the per-turn cycle that uses MCP output to choose the next probe stays.
- **Telemetry from Lane 1 is preserved.** `groupSaturationHistory`, `transitionHistory`, `warningsHistory` must continue to work (with field renames where appropriate). Lane-1 evidence collection must not be invalidated by the migration.
- **Voice discipline (C1 / C2) from Lane 1 is preserved.** Externalized coverage and fact/assumption/opinion marking remain as agent behavior, not redundant MCP enforcement.
- **The MCP cannot read the agent's chain of thought.** Hidden reasoning stays hidden. Every anti-game mechanism must operate on submitted evidence + transcript, not on agent intent.
- **Replay determinism.** The framework must support post-hoc replay where a fresh MCP instance with a different LLM judge re-scores the same evidence ledger. Replay disagreement above threshold flags the session for review.
- **Three sprints of evidence is the minimum bar before declaring success.** Two of those should be Process / Meta type (the failure profile that motivated the redesign); one Greenfield Architecture or Brownfield Refactor for breadth.
- **Backward compatibility is not a constraint.** The current MCP has no production users beyond Mike. Migration may be one-shot. The old nine-dimension code path can be removed once the new one is live and tested.

---

## Design Direction

### Six Inward Criteria (replaces the nine dimensions)

Each criterion measures the agent's calibration to the designer rather than coverage of territory. Each produces evidence the MCP can mechanically verify against transcript + artifacts.

- **Grounded-Claim Ratio.** Every load-bearing claim in the agent's working frame tagged `STATED` (verbatim quote with turn ID or file:line), `INFERRED` (named source the inference bridges from), or `ASSUMED` (no source). Score = (validated × multiplier) / total claims. "Load-bearing" computed by MCP, not declared by agent (rule below). Anti-fabrication anchor.
- **Open Loops Ledger.** Every designer question, concern, redirect, rejection, unresolved hesitation. Each entry: designer turn ID + verbatim quote + status (`OPEN`, `ADDRESSED-IN-TURN-N`, `DEFERRED-WITH-REASON`). Score reflects ledger freshness and resolution quality. Phantom loops fail transcript audit. Missed real loops caught by independent transcript scan.
- **Frame Falsifier Set.** Exactly three concrete things the designer could say that would force the current frame to revise. Each entry must target a specific load-bearing element (named by ID). Vague falsifiers fail structural validator. Falsifiers must attack three distinct load-bearing elements (no same-target repeats).
- **Prediction Calibration.** Before asking the designer a confirming question, agent registers prediction `{question, expected_response, confidence, predicted_at_turn}`. MCP timestamps. After designer responds, agent resolves the prediction with verbatim response quote. LLM-judge scores HIT / PARTIAL / MISS. Rolling hit-rate window.
- **Boundary Envelope.** Two enumerated lists — IN scope, OUT of scope — each entry sourced to designer turn or artifact (verbatim citation). A `BORDERLINE` list is required (caps at IN+OUT length) for items not yet placed. Pretending all boundaries are settled fails because the borderline list must exist.
- **Divergence Surfacing.** Moments where agent's working model differs from designer's apparent model, named explicitly. Each entry: agent-position + designer-position-quote + designer-turn-ID + status. Same-turn RECONCILE blocked by temporal-lock rule. Zero-divergence over multiple rounds is a suspicious-pattern flag (real conversations contain disagreement).

### Negative-Evidence Per Round (required submission)

Every round, agent must submit one piece of evidence that *weakens* the current frame. Empty submission = round penalty. Forces self-attack as a routine behavior, not an opportunistic one.

### Flat Per-Criterion Weighting (replaces group structure)

No groups. Six criteria, each with its own weight. Weight profile selected at sprint init based on **problem type**.

#### Problem Types

- **Greenfield Architecture** — new structure, no codebase precedent for this thing. Designer's vision dominant.
- **Brownfield Refactor** — changing existing structure with strong codebase signal. Code-grounded.
- **Process / Meta Design** — workflow / methodology / framework design (e.g., Chester-on-Chester). Designer-only ground truth; harmonic-agreement risk.
- **Bounded Fix / Optimization** — narrow target, well-known goal, tight constraint envelope.
- **Default / Balanced** — when type is unclear or designer declines to classify.

#### Weight Matrix (each row sums to 1.00)

- **Default / Balanced**: Grounded-Claim 0.25, Prediction Calibration 0.20, Open Loops 0.15, Frame Falsifier 0.15, Boundary Envelope 0.15, Divergence Surfacing 0.10
- **Greenfield Architecture**: Prediction Calibration 0.25, Frame Falsifier 0.20, Grounded-Claim 0.20, Divergence Surfacing 0.15, Open Loops 0.10, Boundary Envelope 0.10
- **Brownfield Refactor**: Grounded-Claim 0.30, Boundary Envelope 0.20, Open Loops 0.15, Prediction Calibration 0.15, Frame Falsifier 0.10, Divergence Surfacing 0.10
- **Process / Meta Design**: Prediction Calibration 0.25, Divergence Surfacing 0.20, Grounded-Claim 0.20, Frame Falsifier 0.15, Open Loops 0.15, Boundary Envelope 0.05
- **Bounded Fix / Optimization**: Boundary Envelope 0.30, Grounded-Claim 0.25, Frame Falsifier 0.15, Open Loops 0.15, Prediction Calibration 0.10, Divergence Surfacing 0.05

#### Per-Criterion Floor

No criterion may score below 0.40 at transition, regardless of weight. A 0.05-weighted Divergence Surfacing in Bounded Fix still must clear 0.40 — it just doesn't dominate. Without this floor, low-weighted criteria degrade into the temporal_context boilerplate failure mode.

#### Type Detection

- Agent runs initial classifier on user prompt + explorer findings, proposes type with one-sentence reason in Round One framing.
- Designer confirms with `[type-confirm]` or overrides with `[type: <other>]`.
- MCP runs an **independent type-classifier** at `initialize_understanding` and surfaces disagreement above threshold for designer attention.
- `confirm_problem_type(type, designer_turn_id)` locks weights to the profile.
- Mid-sprint reclassification requires explicit `reclassify_problem_type` call. Each shift incurs a flat **0.10 deduction from overall** to discourage strategic shifts. Shift logged with reason and turn ID.

### Transition Gate (replaces overall ≥ 0.65 + group ≥ 0.50)

`check_transition_ready()` returns ready iff ALL hold:

- Every criterion ≥ 0.40 (floor — anti-skip).
- Overall (weighted sum per locked profile) ≥ profile threshold (default 0.70; tunable per type).
- Prediction Calibration: ≥ 3 *locked* predictions, hit rate meeting **rising floor** (round 1 ≥ 40%, round 4 ≥ 60%, round 7 ≥ 70%), ≥ 1 disconfirming prediction (confidence ≤ 0.55).
- No unresolved suspicious-pattern flag at severity ≥ ERROR.
- Designer engagement floor met (no 3-round run of <50-word designer turns + 100% prediction hit rate).

### Asymmetric Scoring (per-evidence-entry multiplier)

Each evidence entry carries an `event_type`:

- `CONFIRM` — supports existing frame element. **1.0x**.
- `EXTEND` — adds new ground that doesn't touch existing frame. **1.0x**.
- `REVISE` — modifies an existing load-bearing element. **1.4x**.
- `CONTRADICT` — overturns an existing load-bearing element. **1.6x**.

Special cases:

- Prediction MISS-with-model-update: 1.5x.
- Prediction MISS-without-update: 0.5x.
- Prediction HIT at high confidence (≥ 0.85): 0.7x (penalized as too easy).
- Prediction HIT at low confidence (≤ 0.55): 1.5x (genuine calibration win).
- Falsifier triggered (designer says something matching, agent's frame revises in next round): 1.6x.
- Open Loop closed RESOLVED-VIA-FRAME-REVISION: 1.5x.
- Open Loop closed RESOLVED-VIA-CONFIRMATION: 1.0x.
- Boundary item moved IN→OUT or OUT→IN based on designer input: 1.4x.
- Divergence resolved by agent's position revising: 1.6x.
- Divergence resolved by designer's position moving: 1.0x.

Agent declares `event_type`. MCP verifies via state-diff + LLM-judge. Mismatched declarations are silently downgraded to the actual type. No penalty for honest mistake; no reward for manufactured one.

### MCP Anti-Game Architecture (six classes of mechanical enforcement)

- **Schema enforcement at API boundary.** Every evidence entry conforms to a strict schema. REVISE entries require `revises_element_id` + `evidence_post_dates`. STATED claims require `citations` with handle + quote. Falsifiers require `target_element_id`. Empty `negative_evidence` rejects the round. Boilerplate that doesn't match the schema is rejected before reaching the scorer.
- **External-handle verification.** Every citation references a `turn_id` or `file_path` the MCP can independently fetch. MCP verifies handle exists and quoted text appears verbatim. Pure string match — no LLM in this loop. Catches phantom citations and fabricated quotes.
- **Temporal locking.** Predictions are timestamped server-side at registration. MCP refuses to register a prediction whose target question already appears in the transcript. Refuses to mark a divergence RECONCILED in the same turn it was opened. REVISE/CONTRADICT must cite evidence post-dating the original claim's submission.
- **Definition externalization.** "Load-bearing" computed by MCP via rule: a claim is load-bearing iff (a) it appears verbatim in the current design brief draft, OR (b) ≥1 other claim cites it as supporting evidence, OR (c) ≥1 falsifier targets it. Agent tags don't override. Same external definition for divergence target validity and open-loop legitimacy.
- **LLM-as-judge for semantic checks.** Isolated dispatch per evidence entry: STATED claim quote-supports-claim, falsifier reverse-test, divergence target load-bearingness, prediction-vs-resolution match, negative-evidence relevance. Judge has no access to agent's chain of thought. Cached per evidence-hash so cost stays bounded and replay is deterministic.
- **Deterministic score computation.** Once evidence is validated, scoring is a fixed formula on validated counts × multipliers. Agent cannot influence math. Per-round output includes a hash of evidence-set inputs. Retroactive state edits change the hash and flag on next submit.

### Anti-Game Guards on Asymmetric Scoring (multiplier-specific)

- **State-diff verification.** REVISE requires the prior claim's content to have actually changed. MCP holds prior state, computes diff. Structurally-identical "revisions" downgrade to CONFIRM.
- **Material-change threshold via judge.** LLM-judge: "Is this change material to load-bearing structure or surface paraphrase?" Surface-only fails.
- **Source-post-dates rule.** REVISE/CONTRADICT must cite evidence that did not exist at the time of the original claim's submission. Timestamp-enforced.
- **Density cap.** No more than 30% of a round's load-bearing entries can claim REVISE/CONTRADICT. Overflow defaults to 1.0x. Above-cap rounds flagged for designer attention (legitimate frame collapse is permitted but visible).
- **Oscillation flag.** REVISE → REVISE → REVISE on the same element across 3 rounds suppresses multiplier to 1.0x for that element until oscillation breaks.
- **Triggered-falsifier audit.** When agent calls `mark_falsifier_triggered`, MCP checks (a) cited designer turn contains content matching the falsifier (LLM-judge), AND (b) agent's frame in the next round actually revises the falsifier's target. If frame doesn't revise, the trigger is false; multiplier withdrawn.

### Suspicious-Pattern Surfacer (designer-visible, non-fail)

The MCP runs cheap heuristics each round. Doesn't auto-fail; flags for designer:

- Prediction hit rate > 95% over 5 rounds — too clean.
- Zero divergence over 3 rounds in Process / Meta type — silent alignment.
- All STATED citations from a single designer turn — over-mining.
- Type reclassified within 2 rounds of a low-scoring round — strategic shift.
- Designer turn average < 50 words for 3 consecutive rounds with high hit rate — engagement decay.
- Above-30% REVISE/CONTRADICT density — frame collapse worth attention.

### Independent Replay Mode

After session close, the entire evidence ledger can be replayed by a **fresh MCP instance with a different LLM judge model**. Score divergence > 0.10 on any criterion flags the session for designer review. This closes the chain-of-thought-hiding gap — even if the agent gamed during live, replay produces the same evidence-driven score because the evidence is what was submitted, not what was thought.

### MCP Tool Surface (additions and changes)

Net-new tools:

- `confirm_problem_type(type, designer_turn_id)` — locks weights.
- `reclassify_problem_type(new_type, reason, designer_turn_id)` — applies 0.10 penalty.
- `register_predictions(predictions[])` — server-timestamps; refuses if target question already asked.
- `resolve_predictions(resolutions[])` — verifies quote, dispatches LLM-judge, records HIT/PARTIAL/MISS.
- `mark_falsifier_triggered(falsifier_id, designer_turn_id, quote)` — verifies trigger, watches next-round frame revision.
- `replay_session(session_id, alt_judge_model)` — post-hoc audit.

Modified tools:

- `initialize_understanding` — runs independent type-classifier, returns proposal.
- `submit_understanding` — replaced by `submit_round_evidence` with structured payload (grounded_claims, open_loops, frame_falsifiers, boundary_envelope, divergences, negative_evidence). Schema enforcement at API boundary.
- `get_understanding_state` — unchanged shape; returns six criteria not nine, plus prediction ledger and suspicion flags.
- `check_transition_ready` — applies new gate logic.

Telemetry preserved:

- `groupSaturationHistory` renamed to `criterionScoreHistory` (six criteria, no groups).
- `transitionHistory` unchanged.
- `warningsHistory` extended to include suspicious-pattern flags.

### Skill Updates

- `skills/design-large-task/SKILL.md` — every reference to "nine dimensions" or "three groups" rewritten. Phase 5 per-turn cycle updated to describe new submit shape. Phase 4 Round One framing extended to include type-proposal step.
- `skills/design-large-task/references/design-brief-template.md` — saturation-history section updated to reflect six criteria.
- `agents/design-large-task-industry-explorer.md` — no changes required.

---

## Open Concerns

- **Where does the LLM-judge run?** The judge dispatches need a model; using Claude itself for self-judgment may introduce a coherence bias. Should the judge be a different model (e.g., a smaller cheaper model with stricter prompting) or the same with strong isolation? The replay mode requires *a different* judge model to be meaningful — this is a constraint on the implementation but doesn't determine which judge live mode uses.
- **Profile-threshold tuning.** Each problem type's overall threshold (default 0.70) needs evidence-based tuning. The audit suggests Process / Meta should probably be 0.75 (harder gate because the failure mode is harmonic agreement) and Bounded Fix could be 0.65 (lower because constraint enumeration converges faster). First three sprints under the new framework should be used to calibrate.
- **Migration of build-decision-loop evidence.** That sprint's evidence is the richest dataset Chester has. Should the redesign include a one-shot replay of build-decision-loop under the new framework as a benchmark? Useful for calibration; costs implementation time.
- **Type classifier accuracy.** The independent type-classifier at init is itself an LLM call. If it disagrees with the agent's proposal, that surfaces to the designer — but if both are wrong (e.g., both label as Greenfield when work is really Process / Meta), the wrong weight profile locks. Mitigation: reclassification cost is real (0.10) but not prohibitive, so honest mid-sprint correction is possible.
- **Density cap interaction with major reframes.** A genuine frame collapse (designer reveals the agent's whole frame is wrong) should produce > 30% REVISE/CONTRADICT in one round. The density cap defaults overflow to 1.0x and flags for designer — this is the right behavior but it means the agent doesn't get full multiplier credit for major insight. Acceptable tradeoff or worth tuning?
- **Replay cost.** Replay mode dispatches the full evidence ledger to a different judge. For a 6-round session with 30 evidence entries, that's ~30 judge calls. With caching by hash, replay is fast (cache hits) — but cost accrues if the alt-judge-model differs. Worth budgeting.
- **What's preserved from the old MCP's value?** The old `surface_coverage`, `relationship_mapping`, `prior_art` worked well. Their function (forcing breadth, wiring clarity, citation of precedent) is absorbed into Grounded-Claim Ratio with citations. The risk is that an indirect representation loses the explicit signal those dimensions provided. Should the framework keep "implicit checklists" (e.g., "agent has cited at least one prior_art source") as soft heuristics inside Grounded-Claim Ratio? Worth discussing.
- **Designer ergonomics.** The new framework expects the designer to occasionally see flags (suspicion patterns, type-classifier disagreements, density-cap warnings). This is more interruption than the current MCP. Worth user-testing how the flags surface — inline in the next agent turn, or as a separate channel?

---

## Acceptance Criteria

- The Understanding MCP scores six criteria, not nine, with flat per-criterion weighting (no groups).
- Weight profile is selected at `initialize_understanding` based on problem type, locked at `confirm_problem_type`, and re-locked (with 0.10 penalty) on `reclassify_problem_type`.
- Five problem types are supported: Greenfield Architecture, Brownfield Refactor, Process / Meta Design, Bounded Fix / Optimization, Default / Balanced.
- Every criterion has a 0.40 floor enforced at the transition gate.
- The transition gate requires ≥ 3 locked predictions with rising hit-rate floor (40% / 60% / 70%) and ≥ 1 disconfirming prediction.
- Asymmetric scoring is implemented with per-evidence-entry `event_type` field. Multipliers: CONFIRM/EXTEND 1.0x, REVISE 1.4x, CONTRADICT 1.6x. Special cases for predictions, falsifier triggers, loops, boundaries, divergences as specified.
- All six classes of mechanical enforcement are operational: schema enforcement at API boundary, external-handle verification, temporal locking, definition externalization, LLM-as-judge semantic checks, deterministic score computation.
- All six anti-game guards on asymmetric scoring are operational: state-diff verification, material-change threshold, source-post-dates rule, density cap, oscillation flag, triggered-falsifier audit.
- The suspicious-pattern surfacer flags at least the six listed patterns to the designer in real time.
- `replay_session` produces deterministic re-scoring with a different judge model, and disagreement > 0.10 on any criterion flags for review.
- Lane-1 telemetry (`groupSaturationHistory` renamed to `criterionScoreHistory`, `transitionHistory`, `warningsHistory`) continues to function with the new dimension set.
- design-large-task SKILL.md is updated to reference six criteria, the new submit shape, the type-proposal step, and the new transition gate. design-brief-template.md is updated.
- At least three sprints exercise the new framework before declaring success: ≥ 2 Process / Meta Design, ≥ 1 Greenfield Architecture or Brownfield Refactor.
- Build-decision-loop evidence is replayed as a calibration benchmark and the result documented.
- The old nine-dimension code path is removed once the new path is live and the calibration benchmark passes.
