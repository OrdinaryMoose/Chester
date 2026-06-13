# Pragmatist — Round 02 Transcript

**Question (reframe):** The real problem is token waste: when committee output feeds design-specify, the spec agent's competing-architecture / prior-art / architecture-selection front half re-derives already-settled architecture. The problem is redundant work, not (just) lossy handoff. Cheapest sufficient design to kill the redundant front half?

**Lens:** Pragmatist — shipping cost and runtime cost are first-class. Cheapest sufficient fix wins.

---

## Accepting the Designer Premise

The designer's framing is an in-scope designer premise — treat as fact. When committee has already run and settled architecture, design-specify's front half burns significant tokens to reach the same conclusion. The competing-architecture dispatch alone is three parallel subagents (Architect A + Architect B + prior-art explorer) plus the dispatcher's synthesis pass. For a committee-informed sprint that is pure re-derivation cost with zero marginal value.

The R01 wrapping-skill idea was framed as "closing lossy handoff." Under the designer's reframe it becomes something sharper: the wrapping skill's primary job is to let design-specify skip its front half entirely when committee has already settled the architecture question.

---

## What "Skip the Front Half" Costs vs. Saves

**Saved per skip:** three subagent dispatches (Architect A, Architect B, prior-art explorer) + dispatcher synthesis + user architecture-selection gate. Rough order: 4–5 operations, one user stop, and the token load of reading two full architect reports plus prior-art findings. This is the dominant cost in design-specify for any non-trivial design.

**Cost of the skip mechanism:** the wrapping skill (or the committee output itself) must emit a structured architecture-settled signal that design-specify can read to branch its entry path. One new field in the committee verdict, or one sentinel file the wrapping skill writes. design-specify reads this field/file at entry and jumps from "read design brief" directly to "write spec document" — bypassing steps 3 (competing architectures) and moving straight to step 4.

That skip requires one condition check and one branch in design-specify's entry flow. The wrapping skill or the committee verdict carries the trigger. No new roles, no new subagents.

---

## Does the Committee Need to Emit a Spec Skeleton?

The designer's question asks whether committee should emit a spec skeleton. I want to be precise about what value a skeleton buys vs. what it costs.

A spec skeleton is a partial spec — section headers, architectural assertions, component list — that design-specify fills in rather than authors from scratch. The value: design-specify's spec-writing step starts from a committed structure rather than deriving it from the brief alone. The cost: the committee's scribe (or a new dispatch) must produce the skeleton, which means a new scribe template and a new artifact type.

**My position: a skeleton is not necessary to solve the token-waste problem.** The front-half waste is in the architecture-selection step, not the spec-writing step. design-specify's spec-writing step (step 4) is not expensive — it is one pass, no subagents. The expensive part is steps 3 (three parallel dispatches + synthesis). Skip step 3; the spec-writing cost is acceptable as-is.

A skeleton would also partially couple the committee to design-specify's spec structure, creating a dependency that does not exist today. The wrapping skill already handles the handoff without creating that coupling.

**Verdict on skeleton: useful but not needed for this problem. Defer it unless the spec-writing step itself proves expensive in practice.**

---

## What the Wrapping Skill Needs to Carry

For design-specify to skip its front half, the wrapping skill (or the committee verdict) needs to carry:

1. **Architecture-settled flag** — boolean or a sentinel string that design-specify reads at entry to bypass step 3.
2. **Architecture summary** — the committee's settled architecture choice, in enough detail to serve as the spec's architectural foundation (replaces what the dispatcher's hybrid recommendation would have produced). This is already present in the committee's verdict.md — the wrapping skill just needs to surface it as the explicit architectural basis for the spec.
3. **Full committee artifacts** — verdict + alignment-map (already produced). These cover what the fidelity reviewer and adversarial pass need to see committee reasoning. This closes A5 (fidelity reviewer blindspot) as a side effect.

The wrapping skill's job: read the committee's verdict, extract or confirm the architecture summary, write a brief that carries the architecture-settled flag and the architecture summary, then invoke design-specify with a directive to skip step 3 and treat the committee's architecture choice as the settled foundation.

This is still a thin wrapping skill. It does not author the spec. It does not need new committee roles. It does not change the committee's SKILL.md.

---

## Readdressing the A3 Independence Gap

R01 alignment-map shows a 2-2 split on remedy heft for A3 (non-independent adversarial pass). The designer's round-02 reframe does not ask me to re-adjudicate that split — it presses on the token-waste problem. But the two are connected: the cheapest total solution addresses both.

For A3, my R01 position (single cold spec-attacker subagent) remains correct under the token-waste framing: a cold subagent dispatch is ~1 operation, not a full committee round. The independent adversarial pass should be cheap, not expensive. The heavy option (committee as adversarial hardening stage) would add a full round's cost every time a spec needs hardening — that is a per-spec tax, not a one-time setup cost. Under the token-waste lens, the heavy option compounds the problem rather than solving it.

The cheapest combined solution: wrapping skill (skips design-specify front half, lossless committee context) + single cold spec-attacker subagent (closes A3 independence gap). Total new machinery: one wrapping skill file, one spec-attacker agent file. Zero changes to committee SKILL.md.

---

## Final Position

**Position:** The minimal fix for re-derivation waste is a wrapping skill that emits an architecture-settled flag and the committee's architecture summary, directing design-specify to skip its competing-architecture/prior-art/selection front half (steps 3) and use the committee's settled architecture as the spec foundation. No skeleton needed — the front half is the expensive part, not spec writing itself. For A3 (adversarial independence), a single cold spec-attacker subagent stays cheapest — the heavy option (full committee round per spec) compounds the per-spec cost.

**Rationale:** design-specify's three-parallel-dispatch architecture step is the dominant token cost; skipping it when committee has already settled the architecture question eliminates re-derivation at near-zero incremental cost. The wrapping skill is the mechanism: one new file, one condition branch in design-specify's entry flow, no changes to committee internals.

**Blocking risk:** Coupling risk — if the skip mechanism embeds too much spec structure into the committee verdict, committee and design-specify drift toward tight coupling. The flag + architecture summary approach keeps the coupling minimal and explicit.

**Warrant:** {type: in-scope designer-premise, source: "designer round-02 reframe (re-derivation waste as primary cost); design-specify SKILL.md step 3 (three parallel dispatches = dominant dispatch cost); alignment-map.md CF1/CF2 (committee should not author specs; A3 is the real gap); researcher Pair F (cold independent dispatch catches HIGH errors — one attacker is sufficient)"}
