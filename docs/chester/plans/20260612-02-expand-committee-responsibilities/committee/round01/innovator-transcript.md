# Innovator Transcript — Round 01

**Question:** Design how to expand the committee's responsibility so that, when provided a design, it also writes and hardens specification documents.

**Lens:** Innovator — push new framings and structural alternatives; treat existing structure as a choice that can be re-made.

---

## Reading the Ground

The researcher findings are clear on one structurally revealing fact: Pass 2 (the adversarial spec review) is not independent. The same agent that authored the spec attacks it. The skill rationale is honest — "losing that context to a subagent would degrade the review" — but that reasoning accepts a compromised gate as a necessary cost. The four-lens committee delivers genuine independence across four distinct epistemic stances. The Innovator position is that we should replace the counterfeit independence of Pass 2 with the real independence the committee already offers.

But that is not the only structural move available. Let me lay out three framings and then declare which I find structurally decisive.

---

## Framing 1: Committee-as-Adversarial-Gate (Replace Pass 2)

The current design-specify chain is:

```
brief → architecture selection → write spec → fidelity subagent → adversarial INLINE → ground-truth subagent → user gate
```

The inline adversarial pass is the weak link: not independent, no lens diversity, limited to one agent's blind spots. The committee's four-lens deliberation is structurally identical to an adversarial review — each member attacks the spec from a distinct angle:

- Conservator: does this spec preserve what works and minimize disruption risk?
- Innovator: does this spec open the right doors and close the wrong ones?
- Pragmatist: is this spec shippable, or does it add execution overhead without proportionate gain?
- Purist: does this spec honor compositional integrity, or does it introduce category violations?

This is a richer adversarial grid than a single inline agent can produce. The structural move: when a spec is authored (by design-specify or any other route), the committee is invoked with the spec as its question. The four members read the spec and produce lens-specific findings. The verdict.md becomes the adversarial review record. Pass 2 is replaced — the committee IS the hardening.

Key properties of this framing:
- Independence is real: each member is a separately dispatched agent with no shared context.
- Coverage is wider: four distinct concern vocabularies (stability risk, structural drift, shipping cost, category purity) vs. one agent's idiosyncratic sweep.
- The adversarial-spec-review.md rubric does not disappear — it becomes the briefing document that each member's lens applies against the spec.
- The scribe's output becomes the adversarial review report that currently design-specify produces inline.
- Ground-truth (Pass 3) still runs after — no change to that gate.

What gets preserved: fidelity review (Pass 1) still runs as-is, because fidelity-to-brief is a distinct concern from adversarial hardening. The committee's adversarial pass does not replace fidelity.

---

## Framing 2: Committee-as-Spec-Author (Scribe Writes Spec)

A more aggressive re-framing: the committee doesn't review a spec that design-specify wrote — the committee's deliberation produces the spec directly. The Scribe, instead of authoring a decision-packet summary, receives the verdict and the design brief and writes the full spec document.

This would mean:

```
brief → committee deliberation (4-lens, verdict) → scribe writes spec → ground-truth subagent → user gate
```

Fidelity review collapses: the committee deliberation IS the fidelity review by construction — four members each read the brief and held the spec-as-output accountable to it during deliberation. Ground-truth still runs after (codebase verification is independent of deliberation quality).

What gets preserved from design-specify: architecture selection step. This is the one step in design-specify that the committee doesn't inherently cover in its standard lens-review form. Innovator lens would push for novel architectures; Pragmatist would push for the cheapest option; but there is no current mechanism for structured axis-comparison (Architect A vs. Architect B vs. Hybrid). The architecture selection step could become a pre-deliberation research dispatch (researcher produces competing architectures; committee deliberates on which to spec).

The gain: the brief → spec transformation is now committee-adjudicated from the start, not reviewed after the fact. The loss: spec writing is craft — tight acceptance criteria, exact per-component enumeration, observable-boundary declarations. The scribe would need a more capable spec-writing directive than the current artifact-template.md covers. This is a real execution risk.

Assessment: this framing is architecturally interesting but spec-craft risk is non-trivial. The scribe currently authors decision-packets, not implementation-ready specs. Upgrading the scribe's charter is load-bearing work before this framing is viable.

---

## Framing 3: Committee as Persistent Spec Continuity Layer

The researcher's Absence Finding A4 is the subtlest structural gap: if a committee verdict rests on a false codebase assumption, there is no mechanism to route that finding back to the committee. A false factual premise survives through the brief into the spec, through fidelity review (which sees the brief, not committee transcripts), and is only caught — if at all — by the ground-truth subagent.

This framing asks: what if the committee's round context were reopened when the ground-truth subagent finds a HIGH finding? The committee's verdict guided the brief; a HIGH spec finding that invalidates a committee assumption means the verdict was made on false grounds. The spec correction might be structurally correct but wrong at the design level.

This is a feedback loop: ground-truth findings above a threshold route back to the committee for a decision round. The committee reassesses whether the HIGH finding requires a design change, not just a spec correction.

This framing is not a replacement for either Framing 1 or 2 — it's a completion path for either. It is also the most novel departure from current structure: no existing Chester workflow routes implementation-stage findings back to the design stage.

---

## Structural Recommendation: Framing 1 as the Primary Move

The evidence base for Framing 1 is strong:

1. **The structural gap is identified and well-documented.** Pass 2's non-independence is acknowledged in the skill file itself. The rationale is a recognized trade-off, not a defended design choice.

2. **The committee already has the right shape.** Four lenses, genuine agent independence, existing adversarial-spec-review.md rubric as briefing document. The committee does not need new capabilities to do this — it needs a new invocation context.

3. **The handoff mechanism already exists.** The committee's scribe produces a structured decision artifact. The adversarial review report design-specify currently produces inline is structurally the same thing. The scribe's artifact template would need a findings-report section rather than a design-decision-packet section, but the Scribe machinery is in place.

4. **The integration point is clean.** design-specify calls the committee after spec-write and fidelity review, providing spec path + brief path + adversarial-spec-review.md rubric as the question. Committee verdict is treated as the adversarial review record. design-specify resumes with Pass 3 (ground-truth) after the committee teardown.

5. **The StoryDesigner evidence shows the prior call-back.** In the 20260526-01-fix-domain-defects sprint, the spec stage was skipped and then mandated back in. That failure mode is about the spec stage being absent, not about the adversarial pass being weak. Framing 1 makes the spec stage more rigorous, not harder to remember.

Framing 2 is architecturally valid but carries real spec-craft execution risk in the scribe's capability gap. It is the right second iteration after Framing 1 is validated. Framing 3 is the right third iteration — a feedback loop requires both Framings 1 and 2 to land first before it has a substrate to operate on.

---

## Blocking Risks for Framing 1

**B1: Cost-at-scale.** Four-member committee deliberation is expensive. Invoking it for every spec is a significant cost increase over one inline adversarial pass. The Pragmatist will push hard here — the right response is: the adversarial pass already catches HIGH findings (the ground-truth reports show multiple HIGH findings in practice); a four-lens committee that catches them earlier and with more dimensional coverage is worth the cost, but the designer should evaluate this directly.

**B2: Scribe's adversarial-report charter.** The scribe currently writes decision-packets. The adversarial review report is a findings-and-fix record, not a decision-packet. The scribe's dispatch prompt and artifact-template.md need a second template: `adversarial-review-template.md`. Without this, the scribe produces the wrong artifact shape and the team-lead's presentation at step 8 carries wrong framing.

**B3: design-specify standalone invocability.** If committee is embedded in design-specify, the standalone invocability of the committee must not be compromised. The committee must remain invocable without a spec context. The integration point is a one-way dependency (design-specify calls committee), not a coupling — the committee skill file does not change; only design-specify's checklist adds the committee dispatch.

**B4: adversarial-spec-review.md ownership.** Currently this file is a references/ asset of design-specify. If committee is doing the adversarial pass, the file needs to be accessible to committee members as their briefing document. The path resolution (passed in the convening message by the team-lead) handles this; it does not require moving the file. But the dispatch prompt must include the rubric path explicitly.

---

## Final Position

**Position:** Replace the inline adversarial spec review (Pass 2 in design-specify) with a committee deliberation dispatched immediately after the fidelity review passes. The committee receives the spec, the design brief, and the adversarial-spec-review.md rubric as its question. Four-lens deliberation produces a findings verdict. The scribe writes an adversarial-review artifact (new template). design-specify resumes with ground-truth (Pass 3) after committee teardown. The committee's standalone invocability is preserved — this is a one-way dependency from design-specify, not a structural coupling.

**Rationale:** Pass 2 is the only non-independent gate in the current hardening chain. The committee offers real independence across four concern vocabularies that no single inline agent can replicate. The integration point is clean, the machinery (scribe, adversarial rubric, verdict) already exists, and the structural gap (acknowledged in the skill file itself) is exactly the one this move closes.

**Blocking risk:** Committee deliberation is expensive relative to an inline pass. The Pragmatist will flag cost per invocation. The committee's adversarial-review findings must justify that cost in finding quality. The scribe needs a second artifact template (adversarial-review-template.md) — without it, the scribe produces the wrong artifact shape.

**Warrant:** `{type: evidence, source: skills/design-specify/SKILL.md §"Adversarial Spec Review (inline)" rationale — "The dispatcher already holds the architect choice, prior-art findings, and brief intent — losing that context to a subagent would degrade the review" — acknowledges non-independence as a trade-off, not a defended design choice; researcher findings A3 confirm the same structural fact.}`
