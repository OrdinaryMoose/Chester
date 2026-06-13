# Alignment Map — Round 01

## Question
Design how to expand the committee's responsibility so that, when provided a design, it also writes and hardens specification documents.

## Answer shape
**Preserved split on remedy heft, over a converged finding on diagnosis.**
Not a clean 2-1-1 verdict; a converged negative + a converged target + a three-way split on how heavy the fix is.

## Converged findings (no member dissents)

### CF1 — The committee should NOT author/write specs. (4-0)
None of the four endorse the committee *writing* a spec. The question's literal "also writes" half is contradicted by all four.
- Warrant (logic, verified): Conservator, Pragmatist, Purist each argue it explicitly; Innovator's design keeps spec authorship inside design-specify and gives the committee only the adversarial-review artifact. No transcript proposes committee spec authorship.
- Purist supplies the category warrant: a unit with two terminal states (verdict + spec) is "a category collapse, not an expansion" (evidence: design-committee SKILL.md "process-agnostic primitive" / "Transitions to: none").

### CF2 — The live target is the non-independent adversarial pass (Gap A3). (4-0)
All four name the inline adversarial spec review (design-specify Pass 2) as the real, agreed gap worth closing — the only hardening pass that is not independent (the agent that wrote the spec also attacks it).
- Warrant (evidence, verified): researcher-findings.md § A3; design-specify SKILL.md's own rationale concedes non-independence as a trade-off, not a defended choice (cited verbatim by Innovator).

## Preserved split — remedy heft for closing A3

### Option H (heavy) — Committee becomes the adversarial hardening stage. Innovator + Purist defend.
design-specify, after the fidelity pass, dispatches the committee with {spec, design brief, adversarial-spec-review rubric} as the question; four-lens deliberation returns a findings verdict; the scribe writes an adversarial-review artifact (new template); design-specify resumes with ground-truth. One-way dependency; committee's standalone primitive contract preserved; exclusion narrowed from "any design-specify invocation" to "external sessions only."
- Advantage: real independence across four distinct concern vocabularies — richest possible adversarial pass; reuses existing committee machinery (scribe, verdict, rubric).
- Disadvantage: heaviest per-invocation cost (full team lifecycle); needs a new scribe template; turns every hardened spec into a committee convene.
- Warrant (evidence, verified): Innovator + Purist Final Positions; design-specify Pass-2 rationale; researcher A3.

### Option M (medium) — A dedicated spec-attacker subagent replaces the inline pass; a wrapping skill closes the handoff loss. Pragmatist defends.
(a) New spec-attacker subagent (single cold dispatch) replaces the inline adversarial pass — independence without a committee. (b) Separate wrapping skill passes committee verdict + alignment-map directly into design-specify, closing the lossy manual committee→brief handoff (A4/A5).
- Advantage: independence at ~1 dispatch, not a full round (Pragmatist: full committee = "4-5x dispatch cost against marginal value"); also fixes the handoff loss the heavy option ignores.
- Disadvantage: a single attacker lens, not four — less concern diversity than Option H; adds a second new artifact (the wrapping skill).
- Warrant (evidence, verified): Pragmatist Final Position; researcher Pair F (ground-truth caught 5 HIGH errors → independent cold dispatch is the effective hardener); skill-contract.md names the wrapping-skill pattern.

### Option L (light) — Targeted point fixes only; no new machinery. Conservator defends.
Make the inline adversarial pass independent and give the fidelity reviewer access to committee transcripts (A4/A5) — narrow edits, no absorption, no wrapping, no committee spec role.
- Advantage: cheapest; preserves the proven three-pass chain and the ground-truth reviewer's cold independence exactly as-is.
- Disadvantage: smallest gain; does not add the multi-vocabulary depth the heavy/medium options buy; "independence" of an in-skill fix is weaker than a cold-dispatched one.
- Warrant (evidence, verified): Conservator Final Position; researcher §§ A3–A5 (gaps documented as narrow); StoryDesigner rev-a (skipped-spec failure was procedural, not architectural).

## Cross-cutting second gap (named by 2, ignored by 2)
The committee→brief handoff loss (A4/A5) is addressed by Pragmatist (wrapping skill) and Conservator (fidelity reviewer sees transcripts) but untouched by the two heavy-option defenders. It is a separable decision from the A3 remedy.

## Designer value-judgment required
The split is irreducible on evidence alone — it turns on how much independent-adversarial depth is worth how much per-spec cost. That is a designer trade-off call, not a fact the committee can settle.

<!-- created-at: 2026-06-12T11:39:58Z -->
<!-- produced-by design-committee@v0022 -->
