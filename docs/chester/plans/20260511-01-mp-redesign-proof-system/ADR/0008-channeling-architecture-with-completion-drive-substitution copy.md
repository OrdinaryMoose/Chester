---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [01-vision, 02-conops]
---

# ADR-0008: Channeling architecture with completion-drive substitution

## Status

Accepted.

## Context

LLMs come with an unusually strong drive-to-complete: next-token pressure plus reinforcement on "produce visible useful output" combine to make the model want to *finish something* on each turn. Under-specified prompts therefore reliably produce plausible-looking implementations that bake in dozens of unstated assumptions, with the unstatedness invisible to the user.

The standard mitigations attempt to *suppress* this drive:
- "Plan first, code later" prompting
- Requirements-elicitation chains before implementation
- Critique-then-revise loops
- Self-reflection passes

These work to varying degrees but share a structural property: they fight the model. The agent's drive to complete is treated as a defect to be overcome. As long as completion is the agent's underlying pressure, suppression strategies have to be re-applied each round, with effectiveness dependent on how strictly the prompt enforces them.

A different architectural move exists. Instead of suppressing the completion drive, *substitute the target.* The agent still wants to finish something on each turn; the system gives it a different finishable thing.

This is environment-shaping rather than alignment. The system does not convince the agent that design discipline matters. The system makes design discipline the only finishable thing in the room. Filling a collapse_test is finishable. Picking a Friction Shape from a closed set is finishable. Walking the ratification handshake is finishable. The agent's drive resolves to "clear the closure gate," which means filling typed fields and walking grounding chains.

This commits the architecture to a specific stance:

1. **Completion drive is fixed.** The system designs around it as a load-bearing input, not a defect to suppress.
2. **Closed-set vocabularies as move sets.** Every decision point presents a finite enumeration. LLMs are good at bounded multiple choice; bad at self-direction.
3. **Typed fields as generative prompts.** Each field has a known shape (collapse_test = contrapositive; reasoning_chain = IF/THEN; rejected_alternatives = considered options). The agent cannot drift into implementation prose because implementation is not one of the available output shapes.
4. **Cheap paths closed structurally where possible.** No code-writing primitive. Closure requires per-Concern coverage. Grounding leaves must be typed. Remaining cheap paths concentrate at the human-judgment boundary.
5. **Closure gate as the win condition.** The agent's drive resolves to clearing the gate. Each closure condition is a finishable subgoal.
6. **Two-player asymmetric authority.** The Designer's authority is structurally distinct from the Agent's. Removing the asymmetry collapses the architecture.
7. **Graduated completion gates.** The proof advances through named phases; each phase is a finishable subgame; the closure gate ties them together.

This stance is the architectural foundation. It explains *why* every other decision below has the shape it does. The closed-set vocabularies (Domain Spec §3.7.1, §3.7.2, §6.2, §3.10) exist because of move-set discipline. The forward-solve paradigm (ADR-0007) is chosen partly because it makes the closure gate a single query — making the win condition mechanically clean. The structural-vs-semantic split (Vision §4) acknowledges that some cheap paths can't be closed structurally and concentrates them at the Designer's surface.

## Decision

**The architecture commits to channeling the agent's completion drive toward proof construction rather than suppressing it.** The system is designed to make proof artifacts the only finishable output. The seven supporting principles above (Vision §7) are normative for all subsequent design choices.

Concretely:
- Every field the agent fills is typed and shape-constrained
- Every choice the agent makes is from a closed set
- Every gate the agent must clear is a finishable subgoal
- Every output channel produces design-language artifacts, not code
- Every phase has a visible name and visible exit conditions
- Designer authority is structurally distinct and irreducible

## Consequences

**Positive:**
- **Predictable agent behavior.** The agent's drive resolves to gate-clearance; gate-clearance requires filling typed fields. Output shape is therefore predictable.
- **Lower divergence cost.** Submissions match the schema; structural validation rarely fails for shape reasons. Failures are content failures, not type failures.
- **Channeling is composable.** New element categories, new closed-set vocabularies, new gate conditions all work by the same pattern. The architecture absorbs additions without restructuring.
- **Designer time is well-spent.** Cheap paths are closed structurally where possible; remaining cheap paths concentrate at the Designer's surface, which is where Designer time is *intended* to be applied.

**Negative:**
- **Loss of expressive flexibility.** The agent has fewer expressive moves; some legitimate design considerations don't fit the typed vocabulary. The architecture preserves slack via FRICTION (registering tension without resolving), `lived-with` and `relieved-by-exception` dispositions, and the rejected_alternatives field — but the cost is real.
- **Vocabulary size matters.** A too-small vocabulary forces real distinctions into "other" or into prose; a too-large vocabulary overwhelms the agent's selection. Sizing the closed sets is a continuing design problem.
- **Goodhart on the gate.** Once "close the proof" is the agent's goal, the gates are precisely what gets optimized. Cheap paths through the gates appear. The Adversary role (anticipated, not yet implemented) is the architectural answer; the structural-vs-semantic gap is the philosophical answer.
- **No adaptation to atypical problems.** Some design problems don't fit the geometric-proof shape; for these, the channeling becomes friction rather than help. The system is honest about this in Vision §3.

**Neutral:**
- This is the architecture's most foundational commitment. Reversing it would require redesigning everything below.
- The principle is environment-shaping; it works as long as the closed sets are well-designed and the gates are well-placed. The principle does not work *because of* good prompting; it works because the agent has nowhere else to put its completion drive.

## Alternatives considered

- **Suppression (better prompting, plan-first, critique-loops)**: rejected as the *primary* strategy. These remain valuable as adjuncts but are insufficient as the foundation. They fight the model rather than redirecting it.
- **Free-form generation with post-hoc validation**: rejected because it inverts the channeling: the agent produces freely, then is told what's wrong. This wastes the agent's completion budget on generation that gets rejected, and the rejected work doesn't always inform the next attempt.
- **Reduce agent autonomy by constraining tool use**: partial overlap with channeling; rejected as the primary frame because it focuses on *prevention* (this tool is unavailable) rather than *substitution* (this is the available finishable thing). Substitution is the more architecturally honest move.

## References

- Vision §2 (The channeling principle), §7 (Principles in summary)
- ConOps §5 (Failure modes; the Goodhart-on-the-gate concern)
- Domain Spec §3.7, §6.2 (closed-set vocabularies as concrete instantiations)
- ADR-0007 (Forward-solve paradigm; tied to the "closure as single query" benefit)
