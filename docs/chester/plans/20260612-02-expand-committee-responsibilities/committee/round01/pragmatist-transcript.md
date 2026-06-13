# Pragmatist — Round 01 Transcript

**Question:** Design how to expand the committee's responsibility so that, when provided a design, it also writes and hardens specification documents.

**Lens:** Pragmatist — weighs operational cost against benefit; defends simplest sufficient solution. Shipping cost and runtime cost are first-class trade-offs.

---

## Reading the Evidence

The researcher's findings are clear on the baseline:

- `design-specify` already writes and hardens specs. It runs three reviews (fidelity subagent, adversarial inline, ground-truth subagent). It works. The archived ground-truth reports show it catching HIGH factual errors — wrong DTO field names, wrong DI lifetimes, wrong file paths — that the design brief did not and could not catch. The Pair F (wire-save-dispatch) finding of 5 HIGH FK map errors is a concrete example of real value being delivered.
- The committee has zero connection to spec writing today. Its terminal state is verdict.md + a scribe packet. The handoff to design-specify is manual: designer takes committee verdicts, authors or approves a brief, then design-specify runs.
- The adversarial spec review is NOT independent — it runs in the same agent context that authored the spec. This is the one genuine structural weakness in the current chain.
- The fidelity reviewer sees the brief, not the committee transcripts. If the brief compressed committee reasoning, the fidelity reviewer cannot catch it.

These are the real gaps. The question is: what is the cheapest sufficient design that closes them?

---

## The Cost Stack for "Committee Owns Spec Writing"

If the committee writes the spec, the runtime cost is:

1. The full six-role committee convene (TeamCreate, five subagents, peer-DM grid)
2. At least one full round for spec review/deliberation (four member dispatches + consolidator + scribe + synthesize + verdict)
3. A second round for the hardening passes (adversarial + ground-truth equivalent)
4. TeamDelete

That is roughly 12–16 subagent dispatches plus team lifecycle overhead, in addition to the spec writing itself. `design-specify` today runs 3 subagent dispatches (two for spec writing and architecture exploration, one ground-truth reviewer), with the adversarial pass inline. The ratio is approximately 4:1 to 5:1 dispatch cost for committee-owned spec vs. design-specify standalone.

The shipping cost is also non-trivial: the committee SKILL.md would need a new phase (Phase 6 or a branch on "provided a design"), new agent warrant expansion (currently no member is spec-author), and a new integration surface with ground-truth-reviewer that does not exist today.

---

## What Gap Does Committee-Owned Spec Writing Actually Close?

I need to be precise about what is broken today and whether committee ownership fixes it.

**Gap A: Lossy committee → brief handoff.** When committee runs first (like 20260610-01-extend-committee-answer or 20260609-01-add-glossary-system), the designer manually distills committee verdicts into a brief. The fidelity reviewer sees the brief, not the committee transcripts. Reasoning that did not survive the brief-authoring step cannot be recovered.

Does committee owning spec writing fix Gap A? No — it relocates the problem. If the committee writes the spec directly from its verdicts, the fidelity subagent (or equivalent) still sees the spec, not the raw deliberation. The lossy compression now happens at a different step (verdict → spec vs. verdict → brief → spec), but the fidelity reviewer's blindspot is structurally identical.

**Gap B: Adversarial review is not independent.** The same agent that wrote the spec attacks it inline. This is a real independence gap.

Does committee owning spec writing fix Gap B? Potentially yes — if a separate member authors the adversarial pass. But this requires an explicit spec-attacker role or repurposing an existing advocacy member as adversarial reviewer, which is a non-trivial role contract change. The gap could also be closed much more cheaply: dispatch a dedicated spec-attack subagent from within design-specify, replacing the current inline pass. That fix is entirely within design-specify's scope.

**Gap C: Ground-truth review is already independent.** The ground-truth reviewer is already a subagent dispatch with no prior context. This gap does not exist; committee ownership adds nothing here.

**Gap D: Spec stage is skippable.** The StoryDesigner master plan finding (B1) shows the spec stage was skipped until mandated back in. Committee owning spec writing would make the committee a harder gate — but the same result is achievable by strengthening design-specify's mandatory-invocation rule in the design-small-task transition.

---

## The Cheapest Sufficient Design

The cheapest path that closes the real gaps:

**Option 1: Lossless handoff + independent adversarial pass (minimal, within existing skills)**

- Add a lossless handoff step: when committee runs before design-specify, the committee verdict + alignment-map are passed as explicit context to design-specify (not just the brief). The fidelity reviewer receives both brief and committee artifacts. This costs one additional file path in the design-specify dispatch — no new roles, no extra rounds.
- Replace the inline adversarial pass in design-specify with a subagent dispatch of a new spec-attacker agent (modeled on plan-build-plan-attacker.md). Independence is achieved at the cost of one extra dispatch per spec, not a full committee round.
- No committee-phase change required. No new warrant. No team lifecycle expansion.

**Option 2: Wrapping skill ("design-architect-committee")**

The skill-contract.md already names `design-architect-committee` as a candidate wrapping skill. A wrapping skill adds phases — convene committee → commit verdict → transition to design-specify — without modifying either committee or design-specify internals. This closes the handoff loss (the wrapping skill, not the designer, authors the brief from the verdict) while keeping design-specify's hardening chain intact.

Cost: one new skill file (50–100 lines), no new agents, no new team roles. The wrapping skill owns the committee-to-brief distillation step programmatically, making it auditable rather than manual.

---

## Position

**Option 2 (wrapping skill) is the right answer for the handoff problem.** It closes the lossy committee→brief transition at minimal cost. The wrapping skill is not "committee owning spec writing" — it is "committee feeding design-specify with a lossless brief." design-specify still writes and hardens the spec. The three-pass hardening chain already works; do not duplicate it in committee.

**Gap B (adversarial independence) is a real problem worth fixing, but it belongs in design-specify, not in committee.** Dispatch a spec-attacker subagent from within design-specify. The fix is contained, cheap, and does not require committee changes.

**The question "must committee own spec writing?" has a clear answer: no.** The value is in closing the handoff loss, not in duplicating the hardening chain. Committee owning spec writing would double the dispatch cost, add role-contract complexity, and reproduce hardening that already works.

---

## Blocking Risk

The main risk is scope inflation: treating the handoff problem and the hardening problem as one problem, then over-designing the solution. If the committee is given spec-writing responsibility, there is a strong pull to also give it spec-hardening responsibility, because the committee already runs deliberation. The result is a bloated committee phase that duplicates design-specify for no marginal gain on ground-truth accuracy (which is the hardening pass that actually catches HIGH errors).

---

## Final Position

**Position:** Committee should NOT own spec writing. The right expansion is (a) a wrapping skill that programmatically closes the committee→brief handoff loss (verdict and alignment-map passed directly into design-specify as context alongside the brief), and (b) a spec-attacker subagent replacing the inline adversarial pass in design-specify. Both changes are minimal-surface: the wrapping skill is a new file with no internal changes to committee or design-specify; the spec-attacker subagent is a single dispatch replacement.

**Rationale:** design-specify already writes and hardens specs. Its ground-truth pass is the most effective hardener in the chain (Pair F: 5 HIGH FK errors caught). Routing spec writing through a full committee round would add 4–5x dispatch cost against marginal value. The real gap is the lossy manual handoff from committee verdict to design brief — that gap is closed by a wrapping skill, not by giving the committee a new phase.

**Blocking risk:** Scope inflation — treating handoff loss and hardening duplication as the same problem. Committee-owns-spec framing merges them and over-builds.

**Warrant:** {type: evidence, source: "researcher-findings.md — Pair F ground-truth report (5 HIGH FK errors), absence finding A3 (adversarial not independent), absence finding A5 (fidelity reviewer does not see committee transcripts), skill-contract.md (wrapping skill pattern named as candidate)"}
