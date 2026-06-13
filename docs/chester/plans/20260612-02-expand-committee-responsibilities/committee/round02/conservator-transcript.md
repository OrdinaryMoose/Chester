# Conservator Transcript — Round 02

**Member:** Conservator  
**Question (reframe):** Committee output makes design-specify's front half redundant — it re-derives already-solved architecture. Does eliminating that waste require committee output to reach further into spec authorship, or can a "skip front-half" branch in design-specify solve it without changing committee scope?

---

## Does the Token-Waste Evidence Change My Round 01 Stance?

Yes — partially. The designer's premise is in-scope and treated as fact: when committee output feeds design-specify, the architecture-selection front half produces no new value and burns tokens re-deriving what the committee already settled. That is a real operational cost the Round 01 analysis did not weight.

But the observation does not change my CF1 stance. The problem identified is re-derivation waste *inside design-specify* — it says nothing about who should write the spec body. The waste lives in one specific half of one specific skill. The minimal fix targets exactly that half.

---

## Where Exactly Is the Cut?

design-specify's front half is steps 1–3 in its checklist:

1. Setup
2. Read design brief
3. Competing architectures + prior art — dispatch two architect subagents plus prior art explorer, construct hybrid recommendation, present to user, get architecture selection

Steps 4 onward (write spec, fidelity review, adversarial review, ground-truth review, user gate) are the hardening chain. Those steps have no redundancy problem — they operate on the spec text, not on architecture choices. They are the valuable half.

The cut is clean: skip step 3 when committee output already delivers an architecture selection. Nothing else in design-specify needs to change.

---

## What the Fix Looks Like

A conditional entry path in design-specify:

- **Standard path** (no committee output): run the full checklist including step 3.
- **Committee-fed path** (committee verdict + alignment map provided): skip step 3, read the committee's architecture selection from the verdict, proceed directly to step 4 (write spec).

This is a design-specify change, not a committee expansion. The committee's terminal state remains verdict.md. It does not author a spec precursor, does not write a spec body to a hardening boundary, does not emit a new artifact type. It continues to emit exactly what it emits today. design-specify gains a second entry condition that consumes that existing output.

The committee does not need to change at all. The committee's exclusion rule ("Do NOT convene when other skill owns planning: design-specify") stays intact because the flow is still: committee finishes → designer routes → design-specify starts. The two skills do not overlap — they sequence.

---

## What the Token-Waste Evidence Does NOT Support

It does not support pushing committee output further into spec body authorship. The waste is specifically in architecture re-derivation, not in spec writing. If the committee wrote spec body sections up to some "hardening boundary," the hardening passes would still need to run against whatever the committee produced — and the committee's output would be a partial spec written by a deliberation tool that was not designed for precision artifact production. That is a different risk profile than having design-specify author the spec body after receiving an architecture selection.

The argument "committee already settled architecture, so let committee write more of the spec" conflates two separate things: architecture-choice fidelity (which committee is excellent at) and mechanical spec construction (file paths, AC blocks with observable boundaries, constraint IDs, error handling sections). The committee is not better than design-specify at mechanical spec construction. The only improvement buying committee further into spec authorship would deliver is marginal alignment, at the cost of a partially-authored spec artifact with unclear version ownership and no defined handoff point.

---

## Does Option L Still Stand?

Mostly yes, with one addition. My Round 01 position was: targeted point fixes, no absorption, no wrapping. The designer's new premise adds one specific fix to that list:

- **Add** a committee-fed entry path to design-specify that skips the competing-architectures step when an architecture selection is provided by the committee.
- **Retain** all Round 01 fixes: make the adversarial pass independent (A3); give the fidelity reviewer access to committee transcripts when present (A4/A5).

The addition is a conditional branch in design-specify's entry logic — approximately ten lines of SKILL.md text. It does not restructure either skill, does not add a new artifact type, does not require committee scope expansion.

This is still Option L's spirit: find the narrowest change that closes the gap. The gap is now more precisely defined (re-derivation waste at step 3), and the fix is correspondingly more precise.

---

## Final Position

**Position:** The token-waste evidence calls for a conditional entry path in design-specify (skip step 3 when committee architecture selection is provided) — not committee expansion into spec authorship. Option L holds, augmented by this one targeted addition.

**Rationale:** The waste is localized to design-specify step 3. The fix is a conditional branch in that skill's entry logic. Committee's terminal state, scope, and artifact contract are unchanged. Pushing committee output further into spec body authorship conflates architecture-choice fidelity (where committee excels) with mechanical spec construction (where design-specify excels), and introduces unclear version ownership.

**Blocking risk:** Any design that asks committee to produce a "spec precursor" or write spec body sections must define the handoff point precisely — and that definition is where prior attempts have introduced fragility (see StoryDesigner rev-a: the undefined spec-stage boundary was what got skipped). A conditional branch in design-specify's entry has a clear, testable boundary: "committee verdict with architecture selection present → skip step 3."

**Warrant:** {type: in-scope designer-premise, source: designer R02 reframe — architecture already settled by committee; token waste is in design-specify step 3, not in spec body construction; design-specify SKILL.md step 3 is the discrete skip target; CF1 (committee does not author specs) survives because the fix lives entirely inside design-specify.}
