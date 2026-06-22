# Warrant-Class Admissibility Rule — Fix Design Decision

**Date:** 2026-06-12
**Sprint:** 20260612-01-update-committee-research
**Source:** verdict from `committee/round01/verdict.md`; member positions from `committee/round01/consolidator-output.md`

---

## Summary

The committee was asked whether root causes RC-1 through RC-4 correctly explain the S5 warrant-failure, and what fix design (P1 through P5) is right. The committee confirms all four root causes as researcher-verified fact and converges on a load-bearing fix (P1, with a trigger refinement) plus two supporting fixes (P2, P3). One question remains for the designer: ship the minimal-sufficient set (P1+P2+P3) or add P4+P5 as co-located round-boundary sub-checks under `team-lead.md` Synthesize. That choice is a cost-vs-coverage value judgment and cannot be resolved by further analysis.

---

## Verdict

The four root causes are confirmed as fact (researcher-verified against the S5 artifacts, evidence warrant). The committee converges 4-0 that P1 (the warrant-class admissibility rule) is the load-bearing fix, with a warranted refinement: P1's trigger keys on **HEAD-decidability** (can a command against HEAD confirm or refute the claim?) rather than on the member's self-declared "empirical" warrant label — this closes the categorical-disguise escape that KD-3 itself exploited. P2 (standing consumer census as an R01 deliverable for move/contain/retire/absorb questions) and P3 (baseline any containment/zero-consumer acceptance criterion against HEAD at authoring time) converge as supporting fixes. The single remaining open question is a cost-vs-coverage value-judgment for the designer: ship the minimal-sufficient set (P1+P2+P3) only, or add P4+P5 unified as co-located round-boundary sub-checks under the team-lead Synthesize step.

---

## Rationale

**Root causes confirmed.** All four RCs are grounded in file-level evidence from researcher-findings.md round01, with six verification targets resolved at file:line. No member contested any RC; they are fact, not interpretation.

**P1 is load-bearing — 4-0.** The existing Chester warrant schema defines three warrant types with no admissibility rule by claim class. That gap is exactly what allowed the S5 containment claim to pass: it carried a `logic` warrant, which the current test accepts for any claim. P1 closes this by making a defined class of claims — containment, consumer-count, existence, "no callers outside X" — inadmissible on `logic` or `in-scope designer-premise`; such a claim auto-demotes to a gap and routes to the researcher. All four members endorse this.

**P1 trigger: HEAD-decidability, not self-declared label.** Shipping P1 with an "empirical claims" framing would leave an escape: a containment claim framed as architectural reasoning ("X is bounded by design") rather than as a count claim would not be caught by a label-based filter. The correct trigger is the Purist's decidability test — "can you run a command against HEAD that confirms or refutes it?" KD-3 is the case in point: it read as categorical but was HEAD-decidable by a grep, so the decidability trigger catches it where a warrant-type-label trigger would not. This refinement was warranted by logic (Innovator escape demonstration + Purist decision test) and the committee collapsed to it.

**P2 and P3 as supporting fixes.** P2 adds a standing consumer census as an R01 deliverable for any move/contain/retire/absorb question. The researcher confirmed the researcher role is currently pull-only with no standing relocation-class deliverable — the gap is real. P3 requires that any acceptance criterion asserting a zero-consumer or containment invariant be baselined against HEAD at authoring time; an un-baselined AC of this kind is malformed. Both converge with no blocking objection.

**Single-owner placement.** Wherever proposals land, ownership is fixed: P1 schema and admissibility constraint go to `member-protocol.md` § Final Position (owns warrant schema) with verification in `team-lead.md` Warrant test. P2 goes to `agents/design-committee-researcher.md` Responsibility Scope. P3 goes to the spec-authoring path and `team-lead.md` Converge. P4+P5, if shipped, go unified under `team-lead.md` Synthesize as co-located sub-checks — the enumerate-only consolidator must not be touched.

**The open question: P4+P5 depth.** Both sides are logic-warranted; no warrant defeats the other. The Pragmatist and Conservator (partial) argue P4 and P5 are substantially redundant with P1+P2 once those ship, and P5 carries the highest per-round runtime cost. The Innovator and Purist argue P4+P5 form a distinct round-boundary cross-check that catches the slip even if P1 is bypassed, and Purist's unification under a single owner eliminates the placement risk. This is a coverage-vs-cost judgment the designer must make.

---

## Dissent Record

**Alignment (converged core):** 4-0 on P1 (with HEAD-decidability trigger), P2, P3.

**Split on P4/P5 depth:** 2-2.

- **Pragmatist** (minimal-sufficient): P4 and P5 are substantially redundant with P1+P2 once those ship. P5 is the highest per-round runtime cost and should be skipped. P4 should be deferred. — blocking risk: "P5 is substantially redundant with P1+P2 and adds the highest per-round runtime cost. Skip."
- **Conservator** (partial minimal-sufficient): P5 acceptable with constraints; P4 deferred as subsumed by P1 for the S5 failure class. — blocking risk: no blocking position on P4/P5; defer judgment on depth to the designer.
- **Innovator** (defense-in-depth): P4 and P5 should be retained as a paired complement to P1 and as a distinct round-boundary cross-check that catches the slip even if P1 is bypassed. — blocking risk: shipping without P4/P5 leaves a bypass path open at the round-boundary cross-check layer.
- **Purist** (defense-in-depth, unified): P4 and P5 should ship unified as two co-located sub-checks under `team-lead.md` Synthesize; the unification resolves placement risk. — blocking risk: without unification under a single owner, P4/P5 placement risk is real regardless of which depth option ships.

**Subsumed position.** Innovator proposed widening P1's trigger from "empirical claims" to "invariant claims" (covering containment, isolation, zero-consumer, and structural boundary assertions regardless of surface warrant). This was subsumed by the HEAD-decidability trigger refinement, which achieves the same coverage with a decidable boundary — not discarded on vote count, discarded because the decidability test is strictly cleaner.

---

## Deferred / Open

- **P4 / P5 depth** — open for designer value-judgment. Ship minimal-sufficient (P1+P2+P3) or add P4+P5 co-located under `team-lead.md` Synthesize. See Dissent Record for the defending and opposing members on each side.

---

<!-- produced-by: scribe / round01 / 2026-06-12 -->
