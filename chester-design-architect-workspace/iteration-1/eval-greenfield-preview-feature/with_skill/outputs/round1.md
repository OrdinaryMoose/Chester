# Round 1 Output — DSL Preview Before Commit

## Classification

**Greenfield** — no existing preview system to build on.

---

## Thinking

*You want designers to be able to see the effect of their script changes before those changes become permanent. The request is clear in intent but open in almost every other dimension.*

*The most fragile assumption right now is that "preview" means the same thing to the person asking as it will to the people building it — the word can cover anything from syntax checking to full simulation.*

*Asking about the people involved first, because understanding who designers are and what their current pain looks like will shape every subsequent question about what "preview" should actually do.*

---

## What the exploration reveals

**Current facts:** This is a new capability — there is no existing preview mechanism in the system. Designers author domain-specific scripts and those scripts take effect when they are finalized. The request positions preview as a gate between authoring and finalization.

**Surface analysis:** The request implies that designers are currently working without a safety net — changes go live (or become permanent) without an intermediate verification step. This pattern typically emerges when the cost of a bad change has become high enough or frequent enough to justify the investment in a preview system.

**Uncomfortable truths:** "Preview" is one of those words that sounds specific but is actually a container for very different capabilities. Syntax validation, visual rendering, behavioral simulation, and side-effect-free execution are all "preview" — but they have radically different costs, constraints, and value. Without knowing which flavor matters here, any design direction is premature.

---

## What can't be determined from context alone

**About the people and history:**
- Who the designers are — their technical background, how many of them there are, how often they author or change scripts
- Whether anyone has tried to build preview before, or whether designers have developed informal workarounds (like testing in a staging area or pair-reviewing scripts)
- What prompted this request now — whether a specific incident occurred, or whether the team has grown to a size where informal safety checks no longer scale

**About the foundations:**
- What "committing" means in this context — version control, publishing to production, or some domain-specific finalization step
- What the scripts actually control — whether they affect visual output, data processing, business rules, or something else entirely
- Whether the DSL is deterministic and inspectable (making preview straightforward) or whether it has side effects, external dependencies, or runtime variability that make faithful preview difficult

---

**When a designer makes a change to a script today and it turns out to be wrong, what happens — who notices, how do they find out, and what does it take to fix it?**

---

Phase 1 (Understand) begins. The conversation will focus on building shared understanding of the problem before exploring solutions.
