# Sprint D-1 Fix Proof MCP — Design Brief

## Goal

Run a maintenance pass on the proof system that addresses the friction documented in the d.2 problems report and tightens the proof system's mechanism around the master-plan organizing principle "purpose is shared understanding." Two structural moves carry the brief: collapse the proof's lifecycle to a single binary (planning before the gate, finish after the gate, no return), and retire the structural challenge-mode machinery in favor of agent conduct discipline. A handful of smaller fixes ride alongside these — a response-size cap, verification of the universal withdraw routing on the open-questions class, and removal of the now-redundant per-class lock surface. The result is a smaller proof system, less ceremony around lifecycle events, and tighter coupling between the proof structure and the designer's intent.

This brief stays at the proof-system altitude. It does not amend the master plan, change element type names, or restructure the design conversation skill. It is a fix sprint scoped to the proof-mcp module and the immediately surrounding skill prompts that consume its surface.

## Prior Art

- **Sprint d.1** shipped the CRUD-completeness extension to the proof system — 19 necessary conditions, 5 resolve conditions, 5 concerns, and roughly 202 tests. The spec lives at `cluster-d-build-shared-understanding/sprint-d-1/spec/cluster-d-1-spec-03.md` and committed to the directive "every element type supports the full operation set." This sprint inherits that directive as ground truth and addresses the places where the implementation fell short of it.
- **Sprint d.2 design session** ran the design conversation against the d.1 implementation across 17 rounds and surfaced the thirteen friction items documented at `cluster-d-build-shared-understanding/sprint-d-1/summary/proof-mcp-problems-report.md`. Several of those items were known carryforwards from d.1 (the universal withdraw routing question, the definitions promotion path); several were new structural problems that emerged only when the system was used in a real design session (the lock-blocks-add surprise, the response size limit, the false-positive challenge fires).
- **Master plan cluster-D charter** (working directory root, master CLAUDE.md) names two organizing principles that frame the altitude for these fixes — "design is the code" and "purpose is shared understanding." Both principles read against this sprint as: simplify the proof system's mechanism wherever the mechanism does work the agent's conduct should be doing, and preserve the proof's structural commitment-carrying role wherever it serves shared understanding.
- **Twelve prior proof sessions on this codebase** were reviewed for empirical evidence on the challenge personalities. Half of the sessions had no personality fire at all, including the longest session (19 rounds with all-zero condition history). The data informed the decision to retire all three personalities rather than fix the metric.
- **The vocabulary lock list** at `vocabulary-lock-list.md` and the **challenge personalities fold-in document** at `challenge-personalities-fold-into-round-prompts.md` were settled during the design conversation that produced this brief. Both documents are authoritative for the spec layer's term usage.

## Scope

**In scope:**

- Proof-level state collapse to a binary — `proofStatus` field carries only `planning` and `finish` values; `unopen` value retired, `closed` value renamed to `finish`.
- Removal of the reopen motion — the tool surface, the `lastClosureArtifact` retention field, and the post-finish-back-to-planning state transition.
- Removal of the per-class lock mechanism on the open-questions class — the `concernsLocked` field, the `manage_concerns op:lock` operation, and every code path that gates on the per-class flag rather than on `proofStatus === 'finish'`.
- Removal of the three challenge personalities (ontologist, simplifier, contrarian) — the `detectChallenge` function, the `detectStall` function, the `challengeModesUsed` state field, the `conditionCountHistory` state field, and every per-personality reasoning string.
- Replacement of the count-based stall metric with the body-advancement signal — agent-internal, surfaces only into the agent's working context, never into designer-facing turn output.
- Removal of the bulk-ratify hook at the second yes — under the first-yes precondition, no draft elements remain at the second yes, so the hook's work is empty.
- First-yes precondition enforcement — the closing argument presentation refuses when any element across any lane is in working state, and returns the list of unratified elements to the agent for resolution.
- Mid-review revision behavior — any create-revise-withdraw between presentation and second yes resets the first yes (if fired) and forces full re-derivation and re-presentation.
- Verification of the universal withdraw routing on the open-questions class — confirm that withdraw with category `CONCERN` reaches `withdrawConcern` end-to-end, with operation log entry recorded; fix routing if broken.
- Response-size cap on `get_proof_state` — add a summary mode flag (or equivalent mechanism) that returns counts and identifiers without full element bodies, so long sessions stay under the 25K token limit.
- Per-element ratify motions for the designer-explicit lane (Concerns, Necessary Conditions, Resolve Conditions, Definitions) — preserved as built; no tool surface changes.

**Out of scope:**

- Master plan vocabulary changes — element type names, the term "ratified," and master-plan rule numbers are unchanged.
- Architectural rethink of the proof system's altitude — that work belongs in the cluster-D charter and the master plan, not in this fix sprint.
- The friction-detection logic — unchanged behaviorally.
- Definitions G1 promotion path — carryforward from d.1 known-remaining items; defer to a future sprint.
- Documentation-only friction items (D-11 rule-add semantics, D-12 withdrawn-elements visibility) — defer to a documentation sweep that can batch them with related cleanup.
- The interview cadence's confirm-add discipline (the agent-side conduct change implied by the body-advancement signal) — a presentation-layer concern that consumes the round-prompt fold-in document; not implemented in the proof-mcp module itself.
- Renaming any code-level identifier whose name does not appear in the retired-vocabulary list (the goal is to retire mechanisms, not to refactor names that work).

## Key Decisions

1. **Proof lifecycle collapses to a binary with one gate.** Alternatives considered: keep the three-value status field (unopen/open/closed) and gate the lock at closing-argument presentation; or keep three values and gate at submission. Rejected because the designer's framing ("we are either planning or we are finished — nothing else") names exactly two states, and the gate event is unambiguously the second yes. Anything more nuanced creates intermediate states that the system would have to track and that don't carry decision weight.
2. **Reopen motion removed entirely.** Alternative considered: keep reopen as the inverse motion that takes finish back to planning. Rejected because finish-as-permanent is structurally simpler, removes a tool from the surface, removes a retention field from state, and aligns with the principle that the post-gate proof is the permanent record handed to the brief writer. If the designer needs to revisit a finished proof, the path is a new proof, not re-entry into the old one.
3. **Per-class lock mechanism removed.** Alternative considered: tighten the lock trigger to fire only at the second yes (instead of as a mid-session designer command). Rejected because `proofStatus === 'finish'` already provides the same gate signal at the same trigger; a separate per-class flag duplicates state without adding precision.
4. **All three challenge personalities removed.** Alternatives considered: keep all three with broader metrics; or keep only contrarian (the structurally-grounded one). Rejected because empirical data across 12 prior sessions showed inconsistent firing — half of sessions had no personality fire at all, including the longest session in the corpus — and because the diagnostic intents fold cleanly into agent conduct discipline through the round-prompt items captured in the fold-in document.
5. **Body-advancement signal replaces count-based stall metric.** Alternative considered: keep the necessary-condition count history with broader aggregation. Rejected because the count-only metric structurally missed sessions where work concentrated in other element types, and a broader signal that counts any-element advancement is straightforward to compute and serves the agent's body-stuck reflection cleanly.
6. **First-yes precondition: every element ratified before presentation.** Alternative considered: bulk-ratify at the second yes (the current d.1 behavior). Rejected because the auto-flip bypassed designer commitment on individual elements and silently collapsed the per-element ratify intent into a single closure event. The precondition forces ratification to live in the body-design phase where it belongs.
7. **Mid-review revision resets first yes and forces re-derivation.** Alternative considered: preserve partial-yes state across small revisions. Rejected because partial-state preservation introduces sub-states that contradict the binary lifecycle and complicate the closing-argument flow without earning that complexity. The closing argument's review cycle restarts cleanly on every revision; this is the simpler discipline and matches the designer's expressed intent.

## Constraints

- The master-plan vocabulary lock is preserved verbatim. Element type names (Necessary Condition, Evidence, Rule, Permission, Risk, Resolve Condition, Concern, Definition), the term "ratified," "closing argument," "two-yes," "first yes," and the master-plan rule numbers do not change.
- The eight load-bearing element types retain their current ratification lanes:
  - Designer-directed (creation = ratification): Rules, Permissions.
  - Designer-explicit (per-element ratify after creation): Concerns, Necessary Conditions, Resolve Conditions, Definitions.
  - Agent-ratified (creation = ratification by agent): Evidence, Risks, Friction.
- Friction's disposition property and the friction-detection logic are unchanged; every active Friction must reach a terminal disposition before the closing argument can be presented.
- The `proofStatus` field name is preserved; only its value set changes.
- Existing tests covering behavior preserved by this sprint must continue to pass. Tests covering retired mechanisms (challengeModesUsed, concernsLocked, reopen, bulk-ratify hook, the count-based stall detector) are withdrawn alongside the mechanisms.
- The change must be minimal-surface relative to the d.1 codebase. This is a maintenance sprint scoped to the proof-mcp module and the immediately surrounding skill prompts. No refactor of unrelated areas, no new abstractions, no speculative generalization.
- The skill prompts that consume the proof-mcp surface (the design-large-task SKILL.md sections that reference the retired mechanisms) must be updated alongside the implementation so the agent's instructions match the system's surface.

## Acceptance Criteria

- The proof system tool surface contains no `reopen_proof` tool, no `op:lock` operation on `manage_concerns`, and no challenge-mode triggers in the round response.
- The `proofStatus` field carries exactly two values across the codebase: `planning` and `finish`. Any reference to `unopen`, `open`, or `closed` as a `proofStatus` value is removed.
- The `concernsLocked` field is removed from state, and every code site that previously checked it now checks `proofStatus === 'finish'`.
- The universal withdraw tool successfully withdraws an open-questions element (CERN-N identifier) end-to-end, the operation appears in the operation log, and the proof body reflects the withdrawal in subsequent reads.
- A `get_proof_state` call on a session with 40+ elements returns a response under the 25K token limit when invoked in summary mode (or whichever mechanism the implementation chooses), and continues to return the full body when the summary flag is not set.
- The body-advancement signal is computed and is available to the agent's working context. The signal does not appear in any designer-facing turn output. The `challengeModesUsed`, `conditionCountHistory`, `detectChallenge`, and `detectStall` symbols are removed from the codebase.
- A `present_closing_argument` call refuses with a structured error when any element across any lane is in working state. The error response carries the list of unratified element identifiers.
- A create-revise-withdraw operation issued between closing-argument presentation and the second yes resets the first-yes flag (if it had fired) and triggers full re-derivation of the closing argument on the next presentation request.
- Once `proofStatus` is `finish`, every mutating tool refuses with a structured error. There is no path that takes the proof from `finish` back to `planning`.
- The test suite passes after the sprint's changes. Tests covering retired mechanisms are removed from the suite (not skipped, not disabled). New tests cover the body-advancement signal, the first-yes precondition refusal, the mid-review revision behavior, the universal withdraw routing on the open-questions class, and the summary-mode response-size cap.
- The vocabulary in the spec, the implementation, the tests, and any updated skill prompts uses the terms settled in `vocabulary-lock-list.md` consistently. No references to retired vocabulary remain in active artifacts.

<!-- created-at: 2026-05-08T14:44:47Z -->
<!-- produced-by design-small-task@v0002 -->
