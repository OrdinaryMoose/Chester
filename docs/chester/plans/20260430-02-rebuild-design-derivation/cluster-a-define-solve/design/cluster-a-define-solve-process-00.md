# Cluster A — Define Solve: Process Evidence

Sprint: `cluster-a-define-solve` (under master plan `20260430-02-rebuild-design-derivation`)
Date: 2026-04-30
Status: Approved

---

## How the Interview Operated

### Stage Timing

- **Phase 4a (Understand) — rounds 1–2.** Vocabulary ratified en bloc at Round One (14 seeded terms moved to DEFINED). Round 2 captured the redirect when the designer moved focus off problem-statement well-formedness toward end-of-solve confidence. Transition criteria met after the second redirect surfaced cluster A's full-pipeline mandate. Phase 4a was unusually short — two rounds — because the master plan handoff carried strong inheritance and the designer's redirects pulled the conversation toward Solve-stage substance quickly.
- **Phase 4b (Solve) — rounds 1–5 (proof-state rounds).** Solve stage opened with problem-statement polish/readback/confirm, proof initialization, seed of nine Evidence and six Rules from master-plan inheritance and codebase audit. NC-01 (sixth element category) added round 2 of proof, revised round 3 with the locked name. NC-02 through NC-06 added in a single round-4 batch after the altitude correction. Simplifier challenge fired at round 4; consolidation in round 5 withdrew NCON-7 and absorbed its content into NC-03.

### Length Comparison (Understand vs Solve)

Phase 4a: 2 substantive turns. Phase 4b: 5 proof-state rounds plus several un-incremented design-conversation turns covering simulation, mitigations, altitude correction, vocabulary lock for "Concern," and closing argument. Solve ran longer than Understand — an expected pattern when the master plan handoff is dense and the design substance is the point.

### Where the Conversation Pulled Vertical

- The shape decision (sixth element category vs NC extension) closed cleanly in one turn — designer ratified the agent's recommendation with "add sixth condition; name unresolved."
- Naming opened then closed across two turns — agent recommended Resolution Criterion, designer counter-proposed Resolve Condition for NC pairing, agent ratified the counter-proposal with reasons.
- Field set closed in one turn after the altitude correction landed — three fields, no verification-artifact field, source rule explicit.

## Designer Redirects (Three Material Reframes)

1. **Round 3 Solve-equivalent — drop problem-statement focus.** Designer: "lets not focus on problem statement - that is the beginning of solve. We need to focus on the end of solve and what that looks like." Redirected Phase 4a target from problem-statement well-formedness toward end-of-solve confidence. Forced the agent to drop a working framing and re-anchor.

2. **Same round — full-pipeline mandate.** Designer: "why are we working on 4a transition in cluster A; our mandate is [full design + implementation cluster]." Forced the agent to recognize cluster A as a full pipeline cluster, not just a design conversation. Triggered Solve Stage opening (problem-statement polish, proof initialization, seed evidence and rules) faster than the agent had been planning.

3. **Round 7 Solve-equivalent — altitude correction.** Designer: "the person running the system is not an engineer, it is a product manager responsible for project level decisions but does not have code level knowledge. We have a mismatch in expectations for what the human is to perform." Largest reframe of the session. Forced the agent to reframe the schema (drop forward_test field) and the mitigation list (drop artifact-reference lint, producibility check, semantic-diff threshold). Verification mechanics moved downstream to the spec layer.

## Challenge Mode Firings

- **Simplifier — round 4 Solve.** Triggered when the agent added six necessary conditions in one batch. Review identified NCON-3 and NCON-7 as principle-and-result on the same concern (three-field shape and verification-belongs-downstream). Consolidation in round 5: withdrew NCON-7, absorbed its rationale into NC-03's reasoning chain and rejected-alternatives list. Net: seven NCs collapsed to six.

No Contrarian or Ontologist firings. The proof's grounding chain was strong throughout (every NC grounded in master-plan rules and codebase evidence), so Contrarian had nothing to challenge. The conversation evolved through redirects rather than stalling, so Ontologist had no ground.

## Gate Satisfaction

- **Closure permitted from round 3 onward** structurally (≥1 NC, alternatives present, revision after init, minimum rounds satisfied). Closure deferred until simulation pressure-testing and altitude correction completed; this was a designer-judgment hold, not a structural block.
- **Completeness metrics at close:** 22 elements total, 21 active (1 withdrawn). 6 NCs all carrying alternatives and collapse tests. 6 Rules. 9 Evidence. 0 Permissions. 0 Risk elements (residual risks captured in design-brief prose for downstream consumers).

## Where Drift Was Caught

- **Round 1 evidence submission:** four entries hit the Solve Leakage Ledger because of solve-side vocabulary tokens ("schema", "pipeline"). The phase-vocabulary classifier caught the leakage at the API boundary; the agent adjusted vocabulary going forward and worked around the constraints.
- **Naming over-reach (Sufficient Condition):** the agent's first naming proposal leaned on visual NC/SC symmetry. Reasoning surfaced the conjugate-logic concern; the agent surfaced the trade-off in commentary so the designer could choose. Designer counter-proposed "Resolve Conditions (to align with Necessary)" — the choice resolved the trade-off cleanly.
- **forward_test field over-reach:** the agent proposed a four-field shape with verification-artifact mechanics. Designer's altitude correction caught the engineer-altitude leak. Field removed; rationale absorbed into NC-03.
- **Wandering breadth:** designer flagged twice that the conversation was generating new framings rather than working the problem ("we are wandering in our research and thinking" / "not sure, what do you recommend"). Each flag tightened the conversation toward concrete proposals with positions taken.

## Telemetry

- **Understanding state (round 1):** 9 tenets all scored 1.0; overall 1.0; transition.ready: true; 4 entries to solve leakage ledger.
- **Vocabulary action log:** 14 ADDs at Round One Turn A; 1 RENAME ("resolution claim" → "Resolve Condition"); 2 ADDs mid-session ("designer-ratified" clarified meaning, "Concern" locked).
- **Proof challenge log:** simplifier (round 4 of proof).
- **Proof revision log:** NCON-1 revised round 3 (naming lock); NCON-3 revised round 5 (consolidation).

## Voice Discipline

C1 (externalized coverage) and C2 (Fact / Assumption / Opinion marking) operated throughout. Translation Gate operated; some "schema" / "pipeline" leakage was caught by the phase-vocabulary classifier rather than the Translation Gate self-check. The altitude correction late in the session was the deepest discipline failure — engineer-altitude content in a PM-altitude conversation. Recovery was clean once flagged.

## Notes for Cluster B and Downstream

- The Resolve Condition shape (three fields, source rule) and the Concern construct (enumerated, ratified, locked at Solve Stage opening) are inherited as Rules for cluster B's transition design.
- Cluster B's transition mechanism must carry ratification state cleanly across the Phase 4a → Phase 4b boundary. If the transition resets ratification or loses it in transit, the validation gate breaks.
- The brief template needs Concerns and Resolve Conditions sections; the existing Acceptance Criteria section is replaced (or its provenance is rewritten to render from the typed RC entries). This may be cluster A implementation work (execute-write) or it may surface as a follow-on for cluster B/C if the brief render's full update is bigger than cluster A's code-delivery scope.
- design-specify needs to read the new brief sections and derive AC-{N.M} entries from Resolve Condition statements. This is downstream consumer work outside the cluster A design but flagged as a propagation surface.
