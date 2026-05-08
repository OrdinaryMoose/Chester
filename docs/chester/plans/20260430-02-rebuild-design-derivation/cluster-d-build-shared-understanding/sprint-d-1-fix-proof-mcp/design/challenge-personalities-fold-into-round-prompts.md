# Challenge Personalities — Diagnostic Intents for Round-Prompt Fold-In

## Context

The proof system today carries three named challenge personalities — ontologist, simplifier, contrarian — that fire structurally during a session based on metric triggers. The structural firing is being retired in this fix sprint: the personality machinery (`detectChallenge`, `challengeModesUsed`, the three trigger metrics, the per-mode reasoning strings) is removed from the proof system. The diagnostic intents each personality represented are folded into the per-round agent prompt as conduct disciplines the agent runs on its own judgment.

This document captures each personality's intent at a level that can be lifted directly into the round-prompt template the presentation layer issues each round.

---

## Ontologist — Stalled-Thinking Check

**Original diagnostic.** Are the necessary conditions stuck because they are misshapen, or have we reached saturation and there is nothing more to add?

**Original trigger.** Necessary-condition count flat for three consecutive rounds.

**Replacement conduct.** Each round, the agent privately asks: has the proof body advanced this round? "Advanced" means new elements, revised elements, or withdrawn elements that materially shifted the design — not bookkeeping moves like ratification status flips. If the body has been static for two or more consecutive rounds, the agent runs the ontologist reflection in its own context: pick the most recently surfaced load-bearing element and ask whether the difficulty is its shape (rewrite required) or whether the surrounding conditions are exhaustive (saturation declaration). The agent surfaces the result to the designer as commentary — either a candidate reshape or a saturation claim — not as a status flag.

**Action shape when run.** Either a proposed revision to a specific element, or an explicit "I think the conditions on this aspect are saturated; do you see anything we are missing." Surfaces in commentary, not in observations or information packages.

---

## Simplifier — Sprawl Check

**Original diagnostic.** Are any conditions saying the same thing twice — principle-and-result pairs, redundant phrasings, conditions that should consolidate into one?

**Original trigger.** Necessary-condition count grew by two or more in a single round without any consolidation.

**Replacement conduct.** Each time the agent adds a load-bearing element, the agent privately asks: does this restate something already in the body, just from a different angle? The discipline runs at every-add time, not on a deferred threshold. The question to ask is whether removing the new element would weaken the proof — if no, the element is redundant and shouldn't be added; if it would weaken because the new framing carries grounding the existing element lacked, the agent merges the new framing's grounding into the existing element rather than adding a new one.

**Action shape when run.** A merge-into-existing operation rather than an add operation. If the agent adds and later notices duplication, the agent surfaces the candidate consolidation in commentary and asks the designer whether to consolidate; the agent does not consolidate unilaterally because consolidation reshapes designer-ratified content.

---

## Contrarian — Monoculture-Grounding Check

**Original diagnostic.** Are necessary conditions grounded only in codebase evidence with no designer rule in the grounding chain — meaning the agent is deriving requirements from what the code does today rather than from what the designer wants the design to be?

**Original trigger.** From round two onward, any active necessary condition whose grounding chain contained evidence but no rule.

**Replacement conduct.** Each time the agent surfaces or revises a necessary condition, the agent privately walks the grounding chain. If the chain reaches only evidence elements with no rule element along the way, the agent flags the condition in commentary as a candidate code-derivation rather than a design commitment. The agent surfaces this to the designer with the question: "this condition is grounded in what the code does today; should it be grounded in a designer rule instead, and if so what is the rule." The designer either supplies a rule (which extends the grounding chain) or confirms the code-derivation is intentional.

**Action shape when run.** A surfaced question with two named options for the designer — supply a rule, or confirm intentional code-derivation. The agent does not auto-add a rule because rules are designer-directed by definition.

---

## Why All Three Fold Cleanly

Each personality's diagnostic is a question the agent should be asking itself anyway — about saturation, about duplication, about grounding. The structural triggers existed because the original design did not trust the agent to ask these questions reliably. The fix sprint retires the structural triggers in favor of explicit conduct discipline because:

1. The structural triggers fired inconsistently — the available data shows half of prior sessions had no personality fire, including the longest session in the corpus.
2. The trigger metrics tracked one element type (necessary conditions) and missed sessions where work was concentrated in other types.
3. The structural fire cost a full round of session budget per personality per session — round cost compounded against an inconsistent benefit.
4. The agent's stance principles already include "be a pessimist" and "continuously evaluate uncomfortable truths" — the disciplines belong in the agent's role definition, not in the proof system's mechanism.

## Round-Prompt Integration Points

The presentation layer's round prompt should carry, per round, three explicit conduct items the agent runs against the prior round's state:

- **Body-advancement check.** Did the body advance this round? If not for two or more consecutive rounds, run the saturation-or-reshape reflection (ontologist intent).
- **Add-time duplication check.** For every load-bearing element added this round, did the add restate an existing element? If yes, propose a merge instead of an add (simplifier intent).
- **Grounding-chain check.** For every necessary condition surfaced or revised this round, does the chain contain a rule? If not, surface the code-derivation question to the designer (contrarian intent).

Each runs as agent self-evaluation, not as a tool-driven prompt. Each surfaces to the designer through commentary when something is found, not through a status flag at every round.
