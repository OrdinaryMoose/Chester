# Expanding the Committee into Spec Hardening — Round 01 Decision

**Date:** 2026-06-12
**Sprint:** 20260612-02-expand-committee-responsibilities
**Source:** verdict from `committee/round01/verdict.md`; member positions from `committee/round01/consolidator-output.md`

---

## Summary

The committee was asked to design how to expand its own responsibilities so that, when given a design, it also writes and hardens specification documents. The verdict closes the "write specs" half of that question immediately — all four members reject it outright, and the committee's category as a process-primitive makes spec authorship a structural impossibility, not a preference. What remains open is the hardening half: the adversarial spec-review pass inside the spec-hardening skill is the only step in the current workflow that is not truly independent (the same agent that wrote the spec also attacks it), and all four members agree that closing that independence gap is the real work. How heavy the fix should be is an unresolved three-way split that the designer must settle. No evidence on the record defeats any of the three options on the merits — the choice turns on how much adversarial depth is worth how much per-spec cost.

## Verdict

The committee should **not** take on writing specification documents — all four members reject spec authorship by the committee (4-0), and the Purist supplies the binding reason: a unit with two terminal states (verdict + spec) collapses the committee's process-agnostic category rather than expanding it. The warranted expansion is confined to the **hardening** half of the request, aimed at exactly one target all four members agree on: the inline adversarial spec review in design-specify is the only non-independent hardening pass, and closing that independence gap is the real work. **How heavy** that remedy should be is an irreducible three-way split the designer must settle: (H) design-specify dispatches the full committee as the adversarial pass — richest independence, heaviest cost, defended by Innovator and Purist; (M) a single cold spec-attacker subagent replaces the inline pass, plus a wrapping skill that closes the lossy committee→brief handoff — independence at one dispatch, defended by Pragmatist; (L) a targeted in-skill point fix to the adversarial pass with no new machinery — cheapest, smallest gain, defended by Conservator. The committee→brief handoff loss (A4/A5) is a separable second decision, addressed only by the M and L paths.

## Rationale

Two findings converged cleanly across all four members before the split emerged.

The first convergence is on what the committee must not do. No member proposed that the committee write a specification. The Purist made the structural reason explicit: the committee is defined as a process-agnostic primitive that produces exactly one kind of output — a verdict. Adding a second terminal state (a written spec) does not expand the committee; it collapses its category into something else entirely. This convergence is 4-0 and has no dissenters.

The second convergence is on where the real problem sits. The spec-hardening skill runs a three-pass review chain, and the adversarial pass — the step that stress-tests the spec for gaps and contradictions — is executed by the same agent that wrote the spec. The agent cannot be cold to its own output. All four members identified this non-independence as the single worthwhile gap to close. This convergence is also 4-0.

The split begins at the remedy. Three positions emerged and none was defeated by the evidence:

- Option H (heavy, defended by Innovator and Purist): after the fidelity pass clears, the spec-hardening skill dispatches the full committee — four lenses, full deliberation, a new adversarial-review artifact produced by the scribe. The committee's existing machinery (scribe, verdict, rubric) is reused. This is the richest possible independent review but carries the cost of a full committee lifecycle on every hardened spec.

- Option M (medium, defended by Pragmatist): a single dedicated spec-attacker subagent, dispatched cold, replaces the inline adversarial pass. A separate wrapping skill is added to pass the committee's verdict and alignment map directly into the spec-hardening skill, closing the lossy manual handoff from committee output to design brief. Independence is achieved in roughly one dispatch rather than a full round. The wrapping skill is the only option that also addresses the handoff loss.

- Option L (light, defended by Conservator): the adversarial pass is made independent through a targeted in-skill edit — no new subagent, no wrapping skill, no committee involvement. The fidelity reviewer is also given access to committee transcripts to address the handoff loss. Cheapest path; preserves the proven three-pass chain exactly; gains the least in adversarial depth.

The committee→brief handoff loss (the gap between what the committee decides and what downstream spec work actually receives) is a separable second question. Option M and Option L each address it in different ways. Option H does not address it at all. The designer may want to resolve this separately from the choice of remedy heft.

## Dissent Record

**Alignment:** 4-0 on no spec authorship (CF1) and on Gap A3 as the target (CF2). 2-1-1 split on remedy heft: Innovator + Purist defend Option H; Pragmatist defends Option M; Conservator defends Option L.

**Positions by member:**

- **Innovator** (Option H — committee as adversarial hardening stage): Replace the inline adversarial spec review with a committee deliberation dispatched immediately after the fidelity review passes, with the committee receiving the spec, design brief, and adversarial-spec-review rubric as its question, and the scribe writing an adversarial-review artifact via a new template. — blocking risk: "Pass 2 is the only non-independent gate in the current hardening chain. The committee offers real independence across four concern vocabularies that no single inline agent can replicate."

- **Purist** (Option H — committee as adversarial hardening stage): The committee should not write or harden specs; the clean shape is committee-as-hardening-stage where design-specify dispatches the committee for the adversarial review pass, gaining independence without changing either skill's category. — blocking risk: "The moment the committee 'writes a spec,' it has two terminal states: verdict (deliberation) and spec (transformation). Two terminal states in one unit is a category collapse, not an expansion."

- **Pragmatist** (Option M — spec-attacker subagent + wrapping skill): Committee should NOT own spec writing; the right expansion is a wrapping skill that programmatically closes the committee-to-brief handoff loss, plus a spec-attacker subagent replacing the inline adversarial pass in design-specify. — blocking risk: "Routing spec writing through a full committee round would add 4–5x dispatch cost against marginal value. The real gap is the lossy manual handoff from committee verdict to design brief — that gap is closed by a wrapping skill, not by giving the committee a new phase."

- **Conservator** (Option L — targeted point fixes, no new machinery): Committee should remain separate from spec-writing; close Gap A3 (adversarial pass independence) and Gap A4/A5 (fidelity reviewer access to committee transcripts) as targeted point fixes with no workflow restructuring, no absorption, no wrapping. — blocking risk: "Absorbing design-specify into the committee would replace a proven three-person parallel chain with a six-role deliberation committee that was not designed for spec authorship."

## Deferred / Open

- **Remedy heft (H / M / L):** Designer must choose which path closes the adversarial-pass independence gap. The committee cannot resolve this — it turns on how much independent adversarial depth is worth how much per-spec cost.
- **Committee→brief handoff loss (A4/A5):** A separable second decision. Options M and L address it; Option H does not. The designer may resolve this independently of the remedy-heft choice.
- **New scribe template (Option H only):** If Option H is chosen, a new adversarial-review artifact template is required. The scope of that template was not deliberated.

---

<!-- produced-by: scribe / round01 / 2026-06-12 -->

<!-- created-at: 2026-06-12T11:39:58Z -->
<!-- produced-by design-committee@v0022 -->
