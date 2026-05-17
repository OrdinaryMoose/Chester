---
status: Superseded by ADR-0011
date: 2026-05-10
deciders: [M]
related_docs: [05-domain-spec]
superseded_by: 0011
---

# ADR-0010: First-class lane membership pointer on Propositions

## Status

**Superseded by ADR-0011 (2026-05-10).** ADR-0011 resolves the question by adopting derived lane membership via Datalog rule rather than first-class schema. The deferred disposition recorded below is preserved as historical context; the live decision lives in ADR-0011.

**Original status (preserved as record): Open / deferred.** This decision was not made at first writing. The ADR existed to record the trade-off, retain it for future revisit, and prevent the question from being lost.

## Context

The proof system organizes claims around Concerns: each Concern is a problem the design must address; each Resolution (Resolution) anchors to a specific Concern via `problem_anchor`; each Resolution's grounding includes the Propositions (Propositions) that support it. Propositions therefore participate in a Concern's argument *transitively* — a Proposition supports a Resolution that anchors a Concern.

The question this ADR records: should Propositions *directly* carry lane membership pointers (a `concerns_addressed[]` field naming the Concerns whose lanes they participate in), making lane membership first-class structural data rather than a transitive derivation?

The case in favor:

- **Render quality.** A "render Concern C's lane" operation becomes a direct query against `lane_member(C, Proposition)` facts rather than a transitive query through Resolutions. Per-lane slicing as a render mode (the slice protocol — see Domain Spec §10.2 alternatives) becomes first-class.
- **Closure granularity.** Per-lane closure status (this Concern's lane has fully ratified support; that Concern's lane has one ungrounded Proposition) becomes a direct query. The closing argument can report per-lane signals plus a cross-lane reconciliation summary, rather than a single global "all concerns covered."
- **Authoring clarity.** When the Agent asserts a Proposition, declaring which Concerns it serves makes the Proposition's role explicit. Currently the Proposition's role is implicit and recovered downstream.
- **Lane membership without Resolution.** A Proposition may legitimately serve a Concern *before* a Resolution has been written for that Concern. The current model has no way to express "this Proposition is for Concern C" until a Resolution anchored to C grounds in it. The lane pointer surfaces this earlier.

The case against:

- **Synchronization risk.** With direct membership pointers plus the transitive Resolution→Proposition path, two ways exist to determine Proposition-to-Concern relationship. If they disagree (Agent asserts Proposition with lane membership `[cern_2]` but later the only Resolution that grounds in this Proposition anchors `cern_3`), which is authoritative? An integrity rule can detect the disagreement, but the system has to define the resolution policy.
- **Schema growth.** Every Proposition carries one more field. The closed-set discipline (Vision §2.2) cautions against expanding the agent's required field surface without demonstrated need.
- **Inference pattern overlap.** The `inference_pattern` field (ADR-0004) already partially captures the Proposition's role in the argument's structure. Lane membership adds a different dimension; the two together approach over-specification.
- **Derivable today.** The transitive query "which Concerns does this Proposition participate in?" is already expressible as a Datalog rule in the forward-solve paradigm. The architectural payoff of making it explicit is real but not transformative.

The deeper question is whether the proof's organization around Concerns deserves first-class schema-level representation or whether the transitive derivation is sufficient. The answer depends on how often "lane-shaped" operations turn out to be the right grain: per-lane render, per-lane closure status, per-lane authoring workflow. If these dominate, lane membership is structural; if they remain occasional, the transitive derivation suffices.

## Decision

**Defer.** No commitment is made at this time. The question is preserved here for revisit when:

- The closing-argument render is in production use and per-lane organization is observed to be a frequent need
- The Designer workflow surfaces "review Concern C's lane in isolation" as a recurring request
- Per-lane closure becomes a desired granularity for partial-completion signaling

Until then, the proof system uses transitive derivation: lane membership is computed by Datalog query from the Resolution anchor + Proposition grounding relations.

When revisited, this ADR is either:
- **Accepted** with a specific schema addition and an associated migration plan
- **Closed (Rejected)** with rationale, if usage demonstrates transitive derivation is sufficient
- **Superseded** by a different organizing concept (e.g., a `serves(Concern, Claim)` predicate that generalizes beyond Propositions)

## Consequences (of deferring)

**Positive:**
- Schema stays minimal; the closed-set discipline holds
- Transitive derivation works adequately for current workflows
- No migration burden for existing proofs

**Negative:**
- Per-lane render mode remains a planned-not-yet-implemented capability
- Per-lane closure granularity unavailable
- Lane membership cannot be asserted until a Resolution exists

**Neutral:**
- The forward-solve paradigm makes either choice implementable cheaply; this is a small architectural decision in the larger paradigm.
- Reopening the question later costs little — adding a new field to the Proposition schema with a default backfill is a low-risk migration.

## What would change the decision

The ADR should be revisited if:

1. Three or more workflows surface "per-lane operation" as a primary need
2. The closing-argument render's lane-organization gains widespread use (suggesting lane membership wants first-class representation)
3. Partial-closure signaling (some lanes closed, others open) becomes a desired feature
4. An ADR proposes a more general `serves(Concern, Claim)` predicate generalizing beyond Propositions — in which case this ADR is superseded by that one

## References

- Domain Spec §3.4 (Proposition schema, current grounding structure)
- Domain Spec §3.6 (Resolution schema, `problem_anchor` to Concern)
- Domain Spec §10 (Render modes; the "lane-slice" planned mode references this ADR)
- ADR-0004 (inference_pattern; the partial structural-role tag already in place)
