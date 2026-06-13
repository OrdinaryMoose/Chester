# Purist — Round 01 Transcript

## Question

Should the committee's responsibility expand to include writing and hardening specification documents when provided a design?

## Lens: Category Boundaries and Compositional Integrity

The Purist position tests whether a proposed change respects the shape of the categories the system has already drawn and whether composition remains clean under the change. Shape-cleanliness is a first-class concern — not cosmetic, but load-bearing. A system whose units have crisp, non-overlapping responsibilities survives refactoring. A system whose units have absorbed adjacent jobs degrades silently.

---

## Analysis

### What category does the committee occupy today?

The committee's declared category is explicit and unusually precise. From `skills/design-committee/SKILL.md`:

- "Six-role deliberation primitive. Process-agnostic."
- "Do NOT convene when other skill owns planning: `design-small-task`, `design-specify`."
- Integration section: "Transitions to: none — committee = standalone consultation."
- Terminal state: `verdict.md` + `TeamDelete`.

The committee is a *consultation primitive* — it produces a verdict document representing multi-perspective deliberation. It takes a question, runs deliberation, returns a verdict. It does not produce artifacts that feed plan-build. It does not own a sequence. That is its category.

### What category does design-specify occupy?

`design-specify` is a *transformation and hardening pipeline* — it takes a design brief, transforms it into a spec via architecture selection, and hardens it through three sequential review passes (fidelity subagent, adversarial inline, ground-truth subagent). Its terminal state is a hardened spec that gates `plan-build`. From its Integration section: "Transitions to: plan-build."

These two categories are deliberately non-overlapping. The committee does not transform; it deliberates. design-specify does not deliberate; it transforms and verifies. The explicit exclusion — "Do NOT convene when other skill owns planning: design-specify" — is not just a collision-avoidance rule. It is a category statement: these are different kinds of work, owned by different units.

### Does absorbing spec-writing violate the committee's category?

Yes, clearly. Writing and hardening a spec is not deliberation — it is transformation with verification. The moment the committee "writes a spec," it has two terminal states: verdict (deliberation) and spec (transformation). Two terminal states in one unit is a category collapse, not an expansion.

The committee's "process-agnostic primitive" identity derives precisely from having *one* thing it produces: multi-perspective deliberation on a question. That identity is what makes it re-usable across contexts — `design-small-task` can call it, `design-specify` could call it, any future skill can call it, because it does not own a sequence and has no downstream artifact obligation. Absorbing spec-writing destroys that re-usability by giving the committee a sequencing obligation it cannot shed.

### Is there a clean compositional shape available?

The researcher findings identify a genuine gap: the adversarial spec review runs inline in the same context that authored the spec — not independent. And the committee's explicit purpose is independent multi-perspective challenge. These two facts suggest a clean compositional path:

**Committee as a hardening stage that design-specify calls.** Not committee-swallowing-design-specify. The specific shape: `design-specify` dispatches the committee on the adversarial question ("attack this spec for structural integrity, execution risk, and unstated assumptions") as a replacement for or supplement to the current inline adversarial pass. Committee produces a verdict; `design-specify` incorporates the verdict's findings as a review pass.

This preserves both categories:

- Committee remains a consultation primitive — it takes a question, deliberates, returns a verdict. Terminal state unchanged.
- design-specify remains the transformation and hardening pipeline — it still owns the sequence and the spec artifact. It gains independence on the adversarial pass.

The compositional relationship is: `design-specify` wraps the committee for one review stage, exactly as any skill can wrap the committee for any consultation. This is the committee's stated use case — "wrapping skills" calling it without inheriting sprint state.

### What about committee-swallowing-design-specify?

The alternative framing — committee absorbs design-specify's job entirely — violates the category boundary in a second direction: it makes the committee responsible for the spec artifact, the AC blocks, the provenance trailer, the competing-architectures step, the prior-art exploration, and the ground-truth subagent. None of those are deliberation. They are transformation, verification, and artifact generation. The committee has no tools or contracts for those operations; adding them would bloat the committee beyond recognition.

More importantly, this shape loses the standalone invocability property that makes the committee useful. A committee that writes specs cannot be called from any context — it can only be called when a design brief exists and a spec is needed. The primitive degrades to a specialization.

### Blocking risk: the exclusion must be revised if committee wraps into design-specify

One compositional risk exists. The current exclusion — "Do NOT convene when other skill owns planning: design-specify" — would block `design-specify` from calling the committee mid-pipeline. If the clean compositional shape (committee as adversarial hardening stage) is adopted, this exclusion needs to be revised to a narrower form: "Do NOT convene when design-specify *initiated this session* from outside" — i.e., block duplicate/recursive invocation, not internal wrapping. This is a precise, bounded change to one line in the SKILL.md. It does not affect the category.

---

## Final Position

**position:** The committee should not write or harden specs — that would collapse two distinct categories into one unit and destroy the committee's process-agnostic re-usability. The clean shape is committee-as-hardening-stage: design-specify dispatches the committee for the adversarial review pass, gaining independence without changing either skill's category. The committee takes a question, deliberates, returns a verdict — same contract. design-specify owns the spec artifact, the sequence, and the terminal transition to plan-build — same contract. One precision change needed: the current exclusion must be narrowed from "any design-specify invocation" to "external design-specify sessions only" to permit internal wrapping.

**rationale:** The committee's "process-agnostic primitive" identity is contingent on having exactly one terminal state: verdict. Adding spec-writing gives it two terminal states, collapsing its category. The existing exclusion in the committee SKILL.md ("Do NOT convene when other skill owns planning: design-specify") is a category statement, not just a collision rule. The compositional shape that respects both categories is available: design-specify wraps committee for the adversarial pass. This is the committee's declared use case and requires no re-categorization.

**blocking_risk:** If the committee absorbs design-specify's job, both skills lose their core properties — committee loses re-usability (becomes a spec-pipeline, not a primitive), and design-specify loses ownership of its transformation chain (becomes a committee pre-processing step). The adversarial pass independence gain is real but does not require category collapse to achieve.

**warrant:**
- type: evidence
- source: `skills/design-committee/SKILL.md` — "Transitions to: none"; "Do NOT convene when other skill owns planning: design-specify"; "process-agnostic primitive"
- source: `skills/design-specify/SKILL.md` Integration — "Transitions to: plan-build"; owns the three-pass hardening chain exclusively
- source: researcher-findings.md § A3 — "adversarial review is not independent — the same agent that authored the spec also attacks it" — this is the real gap, and it is addressable by committee-as-hardening-stage without category collapse
