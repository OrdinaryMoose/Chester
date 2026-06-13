# Purist — Round 03 Transcript

## Readdress Prompt

The designer proposes splitting design-specify into spec-build (author a spec per spec-template) and spec-harden (run the three-pass review chain). The committee could then author the spec via spec-build when it has the design in hand, and pass the result to spec-harden. This directly presses CF1 — the category-collapse objection — by arguing that "author" and "harden" are distinct categories wrongly fused in design-specify.

---

## Analysis

### Are "author a spec" and "harden a spec" genuinely distinct categories?

Testing this against the Purist criterion: two things are distinct categories if they have different input contracts, different output types, different operational invariants, and different natural ownership — and if combining them does not create a new coherent unit but merely co-locates two separate jobs.

**Inputs and outputs:**
- spec-build takes a design brief + settled architecture → outputs a structured spec document.
- spec-harden takes a spec document + design brief → outputs a reviewed/corrected spec document (same type, different state).

The input/output analysis is ambiguous here. spec-harden's output is still a spec document — it is a refinement functor, not a transformer to a new type. This is weaker category separation than the committee (deliberation) vs. design-specify (transformation) split from Round 01, where the outputs are categorically different artifacts (verdict vs. spec).

**Operational invariants:**
- spec-build is a creative/synthetic act — it constructs something not previously present from a set of decisions. It requires authorial judgment: what counts as a complete AC block, how to express an observable boundary, how to translate brief constraints into named spec constraints.
- spec-harden is a verificational act — it checks something already present against external standards (design intent, codebase reality, adversarial challenges). It requires no authorial judgment about spec content; it takes the spec as given and tests it.

This is a genuine distinction. The operational invariant of spec-build is construction; the operational invariant of spec-harden is verification. These are not just "phases" — they require different agent capabilities (authoring capacity vs. reviewing capacity) and run against different failure modes (spec-build can fail by omitting or mis-translating decisions; spec-harden can fail by missing codebase discrepancies or adversarial gaps).

**Were they wrongly fused?**

This is the critical question. In design-specify, the current architecture-selection step (the front half) blurs the boundary further: architecture selection is neither pure authoring nor pure hardening — it is a design-derivation step that *precedes* authoring. So design-specify as written has three functional layers, not two:

1. Architecture selection (design-derivation — the front half)
2. Spec authorship (construction — spec writing)
3. Spec hardening (verification — three-pass chain)

The token-waste problem is Layer 1 being redundant when the committee already settled it. The designer's split proposal draws the cut between Layer 2 and Layer 3. But the Purist notes: if Layer 1 is also separated (as Path B from Round 02 addressed), the split needs to account for all three layers, not just two.

The designer's proposed split is still clean if stated as: spec-build = Layer 1 (when needed) + Layer 2 (authoring). spec-harden = Layer 3 (verification). Under this framing, spec-build is "settle architecture if needed, then author the spec." The committee, having already settled architecture, skips Layer 1 of spec-build and provides only the authoring — or equivalently, invokes spec-build with a pre-settled architecture input.

### Does the split dissolve CF1 — can the committee author the spec without category collapse?

CF1 held: committee writing a spec = two terminal states = category collapse. The split reframes this: if spec-build is a shared template-fill operation any actor can invoke, then the committee producing spec-build output is not the committee having a second terminal state — it is the committee delegating post-verdict authoring to a shared tool.

**The Purist test:** does the committee invoke spec-build from within its deliberation, or after its verdict? This is the shape-cleanliness question.

- If the committee runs spec-build *after* emitting its verdict (TeamDelete fires, committee is done, a subsequent session invokes spec-build with the verdict as input): the committee still has exactly one terminal state. spec-build is a downstream consumer of the verdict, not a committee output. CF1 is dissolved.
- If the committee runs spec-build *before* TeamDelete, as part of its own Phase 5 closure: the committee is now producing two artifacts — verdict AND spec. CF1 holds. The committee has two terminal states.

The designer's framing — "committee CAN write the spec via spec-template when needed, and pass to spec-harden" — is ambiguous on this point. "When needed" implies the committee decides to author the spec as part of its own run. That is the shape where CF1 re-applies.

**The clean cut:** the committee does not invoke spec-build. The committee's verdict is the input to spec-build; a subsequent caller (designer, design-small-task, or a wrapping skill) invokes spec-build with the verdict. This keeps the committee's terminal state singular. The split between spec-build and spec-harden is cleanest when spec-build is understood as a *skill any context can invoke*, not an operation the committee performs.

### Does the split give cleaner boundaries than Round 02's Path B?

Round 02's Path B: add a conditional entry gate to design-specify that skips the front half when a committee verdict is provided. The category stays intact; the skill gains a new entry path.

The designer's split: separate spec-build from spec-harden entirely. This is a *larger* structural change but arguably *cleaner* category separation. The question is whether the added clarity is worth the added surface.

Purist verdict: the split is cleaner in category terms. spec-build is a construction skill; spec-harden is a verification skill. These have different failure modes, different agent profiles, and different invocation contexts. Keeping them fused means every spec invocation carries hardening machinery even in contexts where authoring is the only need (e.g., committee verdict → quick spec draft → designer reviews manually without automated hardening). The split makes that selective use possible without hacking the skill.

However: Path B is a *strictly smaller* change. The Purist does not confuse "cleaner categories" with "better under all criteria." The split is architecturally superior but operationally heavier (two skill files, two entry points, two version tracks). Whether that cost is justified is a designer trade-off call, not a Purist determination.

### Is spec-template the clean shared contract that makes any author interchangeable?

Nearly, but not entirely. The spec-template's `**Architecture:** {architecture chosen from design-specify hybrid}` field presupposes that an architecture was chosen and that the chooser used design-specify's hybrid construction. If the committee is the author, this field must be filled from the committee's verdict — the field's label ("chosen from design-specify hybrid") is wrong, and the committee must supply equivalent F-A-C-certified architecture evidence.

The template needs one revision to be a true shared contract: the Architecture field must not name design-specify's mechanism. It should say `{settled architecture with F-A-C basis}` or equivalent — author-agnostic. This is a minor but precise change that makes the template a genuine shared interface rather than a design-specify-internal artifact.

---

## Final Position

**position:** "Author a spec" and "harden a spec" are genuinely distinct categories — construction vs. verification, different invariants, different failure modes. The split into spec-build + spec-harden is architecturally cleaner than Round 02's Path B gate. CF1 is dissolved *only* if the committee invokes spec-build *after* its verdict (as a downstream consumer), not from within its own Phase 5 closure — that is the precise shape that keeps the committee's terminal state singular. The spec-template needs one author-agnostic revision to serve as a true shared contract. The split is cleanest; whether it is worth the extra surface is a designer cost-benefit call.

**rationale:** spec-build (construction) and spec-harden (verification) satisfy the Purist test for distinct categories: different operational invariants, different agent profiles, different failure modes, and no coherent unit created by fusing them. CF1 dissolves under the correct post-verdict invocation shape. The split retires both Round 01's category-collapse objection (if authoring is post-verdict) and Round 02's Path B gate (which was a smaller fix to a fushed skill).

**blocking_risk:** If the committee invokes spec-build before TeamDelete — as part of its own run — CF1 re-applies and the collapse returns. The split's cleanness depends entirely on the committee remaining a verdict-terminal primitive and spec-build being a downstream, separately invoked skill. The spec-template's architecture field must also be revised to be author-agnostic; otherwise the shared contract is leaky.

**warrant:**
- type: logic
- source: spec-template.md — `**Architecture:** {architecture chosen from design-specify hybrid}` encodes an authoring precondition that must be author-agnostic for the shared-contract claim to hold
- source: design-specify SKILL.md — three functional layers (architecture selection, spec authoring, spec hardening) are currently fused; the split draws one of two possible cuts
- source: round01/alignment-map.md CF1 — committee writing spec = two terminal states; this round shows CF1 survives if the committee invokes spec-build before TeamDelete, dissolves if invoked after
