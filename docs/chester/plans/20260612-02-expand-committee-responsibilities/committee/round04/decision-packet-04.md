# One Spec Skill or Three? — Round 04 Decision

**Date:** 2026-06-12
**Sprint:** 20260612-02-expand-committee-responsibilities
**Source:** verdict from `committee/round04/verdict.md`; member positions from `committee/round04/consolidator-output.md`

---

## Summary

The committee was asked whether the specification system should remain one skill or be decomposed into three — and how to do so without duplicating architecture work across the two entry points (design-small-task, which arrives without a completed design, and the committee path, which arrives with one). The verdict does not pick a side. The 2-2 count is not the finding: both options honor every hard constraint, and the choice is an investment judgment only the designer can make.

Before that judgment sits, there is one constraint all four members agreed on without reservation. Architecture-settling is skipped for the committee path — no re-derivation. And the adversarial spec-review pass carries a real authoring-context coupling that any design must honor. This is CC1, and it shapes both options.

The central question is whether that coupling can be honored under decomposition. The answer is yes, and understanding why is the key to reading the split.

## Verdict

The committee divides 2-2 on whether the specification system should stay one skill or become three, but the count is not the finding and neither side is wrong — they are answering an investment question the committee cannot settle for the designer. All four agree on the hard constraint (CC1): the committee path skips architecture-settling, and the adversarial spec-review pass's authoring-context coupling is real and must be honored. The 2-2 turns entirely on one pivot — can that coupling be honored under decomposition? — and the answer is yes, by either of two moves that never let the pass cross a skill boundary: keep the monolith (Conservator, Pragmatist), or decompose and relocate the adversarial pass into the spec-writing skill so the hardening skill is a clean fidelity-plus-ground-truth callable (Innovator). Only Purist's authoring-notes-artifact move sends the pass across a boundary, and that is the single move Pragmatist distrusts — so the 1-skill camp's core objection targets serialization, not decomposition itself. With that cleared, the decomposition is not blocked by the adversarial problem, and the choice is a clean investment judgment. **Option 1S** — the spec-writing skill plus a Path B conditional entry — is minimal-sufficient: ~3-5 edit points, proven chain preserved, solves the stated duplication now, but keeps a conditional inside a growing monolith and yields no reusable pieces, and has zero confirmed second caller for a standalone hardening skill today. **Option 3S** — the architecture-settling precursor → the spec-writing skill → the hardening skill, with "FAC-complete design" as a shared type satisfied by both a committee verdict and an architecture-settling output, and the adversarial pass relocated into the spec-writing skill — costs ~15-20 edit points and a caller migration, but makes each entry point structurally transparent, removes all conditional branching, and produces reusable spec-writing and hardening pieces; the committee path simply never invokes the architecture-settling precursor, so no-duplication is structural rather than a flag. Both honor CC1. The designer chooses between solving today's duplication at minimum cost and investing in the cleaner decomposition the already-clean seam makes available. If 3S is chosen, relocate-into-write is the stronger adversarial resolution over the authoring-notes artifact; the artifact is the fallback only if relocation is judged to alter the proven pass's behavior.

## Rationale

**The 4-0 constraint that is not in dispute.** All four members converged on CC1 before any other position was recorded. Two things it contains: the committee path does not re-settle architecture (carries the Round 02 CF3 resolution, confirmed by the designer), and the adversarial spec-review pass currently works by running in the same agent context as spec-writing — that implicit coupling is real and cannot be wished away. Any design that severs it without a plan is a regression risk.

**The pivot.** The 2-2 split is not a disagreement about whether the coupling matters. It is a disagreement about whether the coupling can be cleanly satisfied outside a monolith. Three resolution moves surfaced in deliberation. Two share a principle — never let the adversarial pass cross a skill boundary. Keeping the monolith is the first (the pass never crosses a boundary because there is no boundary). Relocating the adversarial pass to be the final step of the spec-writing skill is the second (decomposition happens, but the pass stays inside the spec-writing skill, and the hardening skill becomes a clean, independently callable verification step). The third move — serializing the coupling via an authoring-notes artifact that the spec-writing skill emits and the hardening skill consumes — does let the pass cross a boundary.

Pragmatist's blocking objection names the third move explicitly: "serializing 'what the dispatcher noticed but did not write down' is structurally lossy." That objection does not address the second move. Innovator's relocation sidesteps exactly the failure Pragmatist fears. This means the 1-skill camp's objection is to serialization, not to decomposition as such, and the decomposition option is not blocked by the adversarial coupling problem.

**Option 1S — minimal-sufficient.** Keep the spec-writing skill as it stands, add a dispatch-mode flag, and give the FAC-complete path a conditional entry that skips architecture-settling. The adversarial pass stays inline; the coupling is honored at no additional cost. Approximately 3-5 edit points. The proven hardening chain is preserved exactly. No new callers to migrate. The recognized costs: the conditional lives inside one skill rather than being expressed as per-path shapes, no reusable spec-writing or hardening pieces emerge, and there is no confirmed second consumer for a standalone hardening callable today — so reuse value is speculative. The prior art here is plan-build, which ran a three-phase sequence inside one skill without decomposing it.

**Option 3S — structural.** Introduce the architecture-settling precursor (holds the user-selection gate, parallel dispatch, and F-A-C checks), the spec-writing skill (pure constructive authoring, called by both paths, adversarial pass relocated here as its final step), and the hardening skill (fidelity plus ground-truth verification, independently callable). "FAC-complete design" is defined as a shared type with two interchangeable producers: a committee verdict or an architecture-settling output. Once the spec template's Architecture field is made author-agnostic, both producers satisfy the same input contract, and the spec-writing skill calls neither — it receives the design and authors. The committee path simply never invokes the architecture-settling precursor; no-duplication is structural rather than enforced by a gate. Approximately 15-20 edit points and migration of all existing callers. The recognized costs are real. The recognized advantages: each entry point is structurally transparent about what it does, no conditional branching inside any skill, and both spec-writing and hardening become reusable callable pieces. Why this decomposes where plan-build did not: the user-selection gate is present on the small-task path and absent on the committee path — that asymmetry is the seam.

**Intra-3S: which adversarial resolution if decomposing.** Innovator and Purist agree on the three-skill shape and disagree only on where the adversarial pass lives. Innovator's relocate-into-write is the stronger variant: it dissolves the coupling by keeping the pass inside the spec-writing skill alongside authoring context, and it directly answers the objection the 1-skill camp raises. Purist's authoring-notes artifact transmits the coupling rather than dissolving it and is the fallback if relocation is judged to change the adversarial pass's proven behavior.

**The investment frame.** Both options are safe. Both honor CC1. The question is whether the clean seam the architecture makes available is worth paying for now, given that no confirmed second caller for the hardening skill exists today. The 1-skill camp asks: who is the second caller that justifies 15-20 edit points? The 3-skill camp asks: is a conditional flag inside a growing monolith the shape you want to maintain when the seam is already clean?

## Dissent Record

**Alignment:** 2-2 split — no majority; designer judgment required.

**Conservator (Option 1S):** Oppose decomposition into separate skills; support Path B (conditional entry inside the spec-writing skill with a dispatch-mode flag) that skips architecture-settling for FAC-complete input and preserves the adversarial pass inline.
- blocking_risk: The adversarial pass must remain inline in the same dispatcher invocation as spec-write. Extracting it into a separate skill loses the tacit authoring context.

**Pragmatist (Option 1S):** Conditional Path B entry gate in the spec-writing skill, not three-skill decomposition, because the adversarial pass coupling is irreducible, zero confirmed callers exist for the hardening skill as standalone, and Path B costs ~3-5 edit points versus ~15-20 for decomposition.
- blocking_risk: serializing 'what the dispatcher noticed but did not write down' is structurally lossy — but the committee should surface this risk to the designer.

**Innovator (Option 3S):** Decompose into three skills (architecture-settling precursor → spec-writing skill → hardening skill) with the adversarial pass relocated into the spec-writing skill as its final step, making the hardening skill a clean two-subagent verification callable and the spec-writing skill a pure function of a 7-field FAC-bundle.
- blocking_risk: The current inline approach is a coupling anti-pattern disguised as a feature. It works by accident when spec-write and spec-harden happen to run in the same agent context, but it is not a designed contract — it is accidental context retention.

**Purist (Option 3S):** Three-skill decomposition (architecture-settling precursor → spec-writing skill → hardening skill) is categorically sound; adversarial pass stays in the hardening skill but the spec-writing skill's output contract must expand to two artifacts (spec document + authoring notes), with authoring notes as a blocking requirement.
- blocking_risk: The coupling problem is a CONTRACT gap, not a CATEGORY misclassification. The adversarial pass currently receives its required context implicitly (held in the authoring agent's context window). When spec-write and spec-harden are separate skills, that implicit channel is severed.

**Intra-3S difference:** Innovator and Purist agree on the three-skill shape but differ on adversarial placement. Innovator relocates the adversarial pass into the spec-writing skill (coupling dissolved, no cross-boundary transmission). Purist keeps it in the hardening skill and requires an authoring-notes artifact output from the spec-writing skill (coupling transmitted across the boundary). If Option 3S is chosen, Innovator's variant is the stronger resolution; Purist's artifact is the fallback if relocation is judged to change the proven pass's behavior.

## Deferred / Open

- Whether a second confirmed caller for the standalone hardening skill exists or will exist — no evidence surfaced in this round. Relevant if the designer wants to revisit the investment calculus later.
- If Option 3S is chosen: the exact definition of the authoring-notes artifact (Purist fallback) was not specified. Would require its own scoping pass before implementation.
- If Option 1S is chosen: the conditional dispatch-mode flag's exact entry contract (what constitutes a "qualifying verdict") was sketched by Pragmatist but not finalized.

---

<!-- produced-by: scribe / round04 / 2026-06-12 -->
