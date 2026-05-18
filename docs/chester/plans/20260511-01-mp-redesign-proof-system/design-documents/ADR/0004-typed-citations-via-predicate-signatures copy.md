---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [05-domain-spec, 00-glossary]
---

# ADR-0004: Typed citations via predicate signatures

## Status

Accepted.

## Context

Propositions in the existing proof MCP cite their grounding through a flat array of element IDs:

```json
{
  "id": "prop_3",
  "grounding": ["evid_1", "rule_2", "perm_5"]
}
```

The flat array works structurally — the integrity checker validates that each cited ID exists, and the closure gate counts ratified citations — but it is *type-blind*. The structural check is identical whether `prop_3` cites three Evidence elements or three Propositions or some mix. The inferential move is invisible to the system.

This invisibility shows up at two surfaces:

1. **Render quality.** The structured-proof render cannot distinguish between "this Proposition is grounded in factual Evidence" (modus ponens-flavored) and "this Proposition is grounded in another Proposition" (Proposition composition) and "this Proposition is grounded in a Permission relieving a Rule" (exception licensing). All three appear as bullet lists of element IDs. The Designer reading the proof reconstructs the inference move from the IDs' prefixes.

2. **Engine reasoning quality.** The Engine sees a body atom for each cited element but does not know whether the move from grounding to head is supposed to be "facts imply claim" or "another claim composes into this one." This means generic engine queries cannot distinguish "Propositions composed from base facts" from "Propositions composed from other Propositions" — a distinction that matters for closing-argument structure.

Several mitigations were considered:

- **Comment in `reasoning_chain`**: the agent writes the inference type as part of the prose. Visible at render but not engine-inspectable. **Insufficient.**
- **Add a tag field `inference_pattern` to Propositions**: the agent picks from a closed set. Engine-inspectable as a metadata fact. The render uses it for section headers. **Promising.**
- **Type each citation individually**: each grounding entry is `{ref: "evid_1", role: "factual-warrant"}`. Maximally expressive; verbose; doubles the number of fields the agent must fill. **Rejected as over-engineered for current need.**

The single tag at the Proposition level is the right grain. It names the *overall* inference move; per-citation roles can be added later if needed.

The closed set chosen reflects the inference patterns observed across geometric-proof analogs and Toulmin-style argumentation:

- `grounds-imply-conclusion`: ordinary modus-ponens-flavored inference from facts and rules to claim
- `rule-applies-to-case`: a Rule's prohibition or obligation extends to the Proposition's case
- `permission-licenses-relaxation`: an exception to a Rule that the Proposition depends on
- `definition-substitution`: the Proposition restates or specializes a Definition
- `proposition-composition`: the Proposition follows from other Propositions (composition through the proposition layer)

## Decision

**Add a closed-enum `inference_pattern` field to PROPOSITION elements.** The field is required when a Proposition is asserted; the agent must pick from the closed set above.

The field is represented in the Engine as a metadata fact:
```
inference_pattern(prop_3, "grounds-imply-conclusion")
```

The structured-proof render uses the inference pattern to organize and label the proof's Proposition section ("Propositions by modus ponens", "Propositions by exception licensing", etc., when these groupings are populated).

Per-citation typing (each grounding entry tagged with its inferential role) is **not** adopted. The single Proposition-level pattern is sufficient for current needs.

## Consequences

**Positive:**
- **Render quality.** The Proposition section in the closing argument is organized by inference type, making the proof's argumentative structure visible at a glance.
- **Engine inspectability.** Queries can ask "show me all Propositions grounded in modus ponens" or "show me all permission-licensed exceptions"; this enables targeted Designer review.
- **Closed-set discipline.** Adding `inference_pattern` to the closed-set vocabulary keeps the channeling principle intact: a finite enumeration the agent picks from rather than free-form prose.
- **Adversary leverage.** A future Adversary skill can probe specific inference patterns: "are the proposition-composition cases circular?", "are the permission-licenses-relaxation cases supported by a designer-asserted Permission?"

**Negative:**
- **One additional required field per Proposition.** The agent must pick a pattern; this is one more decision per Proposition and one more failure mode (picking the wrong pattern).
- **Vocabulary commitment.** The closed set above is a guess at the necessary distinctions; misses or overlaps will surface only with use. New patterns require schema migration.
- **Existing Propositions lack the field.** Migration backfills with `grounds-imply-conclusion` as the default (most common pattern); this is approximate but unblocking.

**Neutral:**
- The field's value is structurally a metadata tag — it does not change closure conditions or integrity rules. It changes *render and query* but not *gate semantics*.

## Alternatives considered

- **Per-citation typing**: rejected as over-engineered for current need; admits adoption later if the Proposition-level tag proves insufficient.
- **Free-form `inference_type` string**: rejected; loses closed-set discipline.
- **Inferring pattern from grounding shape** (e.g., "if all citations are Evidence, it's grounds-imply-conclusion"): rejected because the inference is contextual; the agent's intended move is not always recoverable from the citation set.
- **Skip entirely**: rejected because the render quality and Adversary-leverage gains justify the small cost.

## References

- Domain Spec §3.4 (Proposition schema), §3.4.1 (inference patterns)
- Glossary entry: inference_pattern
