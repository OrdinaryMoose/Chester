# Purist — Round 01 Transcript

## Question

How should the member contract change so members supply answer-contributions with their own warrants that support (not undercut) the lead's converged answer?

---

## Reasoning

### The category boundary at stake

Two shapes on the table:

- **Advocate-with-warrant** — member keeps its lens position AND supplies the typed warrant for its load-bearing claim. Member role stays member-shaped; warrant is a content addition.
- **Mini-synthesizer** — member tries to write a contribution that integrates into the lead's converged answer, anticipating the lead's synthesis pass. Member starts doing the lead's job.

These are not the same shape. The dispatch says "answer-contribution" but the category question is: does "contribution" mean the member's *position* (typed, warranted) or the member's *inference about how its position serves the lead's answer*? The second version bleeds the member into the lead's synthesis role. That's the compositional breakage to name.

### Where the warrant type belongs

The feature brief calls out the schema-depth question explicitly: free-text warrant vs. typed warrant (evidence | logic | designer-premise + source). From a compositional integrity standpoint:

- **Free-text warrant:** unverifiable by the lead's Authority Guard. Lead receives a string with no structure to check against. The warrant test becomes a reading-comprehension exercise, not a structural gate. The lead still originates the category because it cannot verify which type of warrant the member claimed. No real gain.
- **Typed warrant:** the lead's Authority Guard can execute a structural check — is this evidence-backed? Is the cited source in scope? Is this a designer-premise appeal, and if so, which premise, and was it granted for this scope? The Consolidator reads only the `## Final Position`; a typed warrant inside that bounded slice gives the Consolidator something to enumerate and the lead something to verify. Clean composition.

The constraint says: warrant field = content extension, not mechanics change. A typed field (enum + optional source) inside `## Final Position` satisfies that constraint. It does NOT change routing-signal schema, Consolidator enumerate-only boundary, or round-folder discipline. It changes what the member writes inside its content section. That stays on the right side of the line.

### Does "answer-contribution" blur the member into the lead?

Only if the member is asked to orient its position *toward the lead's answer goal*, rather than assert its position *from its own lens with evidence*. The dispatch says members should "integrate with and support the lead's converged answer." Purist concern: "integrate with" is dangerous phrasing if it means the member must anticipate how the lead will use its contribution. That's synthesis work. The member cannot know what the lead will converge on before the round completes.

The clean shape: member writes its lens-position + typed warrant for that position. The "answer-contribution" framing is satisfied because a warranted position is *already* an answer-contribution — the lead can verify it and incorporate it. The member does NOT need to second-guess the synthesis. The integration happens at the lead's synthesis step, not at the member's writing step.

This keeps the two shapes separate:
- **Member:** assert position + supply typed warrant for load-bearing claim
- **Lead:** verify warrants, weigh, synthesize into most-informative answer

### What I defend and what I sacrifice

**Defend:** typed warrant (not free-text). The lead's Authority Guard is a structural gate, not a reading-comprehension exercise. Free-text warrant collapses it to the latter. Typed warrant keeps it as the former. Compositional integrity of the guard depends on this.

**Defend:** member role stays advocate-shaped. Member does not try to anticipate the synthesis. Member writes: position + warrant. Lead writes: synthesis. No role bleed.

**Sacrifice:** discovery flexibility. A typed warrant schema constrains what members can say about their evidence. A member with a genuinely novel warrant type (e.g., a constraint-from-prior-sprint that is neither pure evidence nor pure logic nor pure designer-premise) gets a poor fit. This is a real cost. I hold it worth paying for structural checkability; the innovator will disagree and that's the right tension to surface.

### The blocking risk I name

Typed warrant adds schema rigidity to a contract (member-protocol) marked C-RIGID. The brief acknowledges this. The argument for strict content-vs-mechanics separation is that C-RIGID applies to the *mechanics fields* (routing-signal shape, Consolidator boundary, round-folder discipline) and the `## Final Position` schema is a *content* field, not a mechanical gate. That argument is sound but fragile — if the typed warrant enum ever needs a new value, touching member-protocol feels like a mechanics change even if it legally isn't. The cost is not zero.

---

## Final Position

```
position: Add a typed warrant field inside ## Final Position — enum: evidence | logic | designer-premise, plus an optional source line. Member keeps advocate role; typed warrant is a content extension only, not a mechanics change. Member writes position + warrant-for-position; lead verifies warrants, synthesizes.

rationale: Free-text warrant collapses the lead's Authority Guard to a reading-comprehension exercise — the lead cannot structurally verify what type of warrant the member claimed, so the lead still originates the warrant category. Typed warrant gives the Guard a structural check: is this evidence-backed? Is the cited source in scope? Is this premise appeal within granted scope? A typed field inside ## Final Position does not touch routing-signal schema, Consolidator boundary, or round-folder discipline — it sits cleanly inside the content side of the C-RIGID line. The member does not need to anticipate the synthesis; it writes position + warrant, the lead integrates. Two shapes stay distinct.

blocking_risk: Typed warrant adds schema rigidity to member-protocol (C-RIGID contract). If the enum ever needs a new value, touching member-protocol reads as a mechanics change even if it legally isn't. Accepted cost for structural checkability of the Authority Guard. The counter-position (free-text warrant) avoids this rigidity but eliminates the Guard's structural verification pass — the lead re-originates warrant categories from free text, which is the failure mode this thread exists to fix.
```
