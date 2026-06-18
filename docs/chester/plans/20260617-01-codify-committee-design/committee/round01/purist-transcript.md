# Purist Transcript — Round 01

**Member:** Purist
**Round:** 01
**Question:** Should `design-committee` emit a complete design document via a committee-specific template mirroring the eight FAC fields, reversing D9?

---

## Lens

The Purist tests category boundaries and compositional integrity. Shared formats that span genuinely distinct categories import semantic confusion. Distinct formats that share only surface shape are not bifurcation — they are correct taxonomy. The Purist asks: are the things being combined genuinely the same kind of thing?

---

## The Assigned Attack: Why NOT One Shared Format with `design-small-task`?

The convening packet tasks me to attack designer leaning (a) head-on — specifically the claim that a committee-specific template is warranted rather than a single shared format with `design-small-task`'s six-section brief. I will run that attack honestly, then assess what it yields.

### Attack: The six-section brief could absorb committee output

The design-small-task brief has: Goal / Prior Art / Scope / Key Decisions / Constraints / Acceptance Criteria. At first glance, the committee's output maps onto this:

- Committee's problem statement → Goal
- Researcher findings → Prior Art
- Verdict's scope framing → Scope
- Verdict's architecture choice + rejected alternatives → Key Decisions
- Verdict constraints → Constraints
- Verdict acceptance signals → Acceptance Criteria

If this mapping holds, the committee producing a six-section brief eliminates "artifact bifurcation" (D9's concern) and leaves spec-write with one format to consume regardless of upstream producer. That is not a trivial benefit — shared formats reduce the spec-write reading surface and make the extraction contract a single lookup.

### Where the attack fails: category mismatch

The attack collapses on two structural grounds, not cosmetic ones.

**First: the Dissent Record is not a section that can be omitted or relocated.** The six-section brief has no dissent concept because it has one voice. A committee exists precisely to surface minority positions that survived adversarial challenge but did not win. The Dissent Record carries the `blocking_risk` field verbatim from each dissenting member — this is the mechanism by which a 3-1 verdict does not silently bury a high-stakes objection. If the committee produced a six-section brief, the Dissent Record either disappears (breaking the committee's structural purpose) or gets appended as a foreign section (making the "shared format" a brief-plus-committee-extensions, which is not a shared format — it's a committee-specific variant wearing a brief's hat).

**Second: the fields are shaped by different epistemic sources.** The brief's "Key Decisions" records what a single designer concluded after reasoning. The committee's "Verdict" records what a deliberative body decided after adversarial challenge from four distinct lenses. These look like the same node, but they encode different epistemic provenance. The brief's Key Decisions is a reasoning trace — *how* the designer arrived at a conclusion. The committee's Verdict is an outcome record — *what* a multi-voice body resolved after positions were challenged and reconciled. Merging them into one field would either misrepresent committee output as individual reasoning or misrepresent individual reasoning as collective deliberation. Neither is acceptable from a category-integrity standpoint.

The six-section brief is a *design-as-process* record. The committee artifact is a *deliberation-as-outcome* record. These are genuinely different categories.

---

## The Secondary Question: Is Mirroring the Eight FAC Fields the Right Anchor?

The designer's leaning (a) says: committee-specific template **mirroring the eight FAC fields**. The Purist must probe this anchor as well.

The eight FAC fields in `fac-complete-design-contract.md` are an *extraction contract* — they describe what `spec-write` needs to pull from upstream. They are defined from the consumer's perspective: "here is what I need to find." They are not defined from the producer's perspective: "here is the natural structure of my output."

This creates a risk: a template built by mirroring extraction targets may optimize for spec-write convenience at the cost of committee-internal coherence. The committee's native structure has Summary / Verdict / Rationale / Dissent Record / Deferred. These are committee-native categories that match the scribe's inputs: `verdict.md` → Verdict; `consolidator-output.md` → Dissent Record positions; `alignment-map.md` → Rationale. The eight FAC fields are not a natural fit for those scribe inputs — they would require the scribe to scatter committee-native content (verdict prose, consolidator positions, alignment analysis) across eight extraction-optimized buckets.

The correct design principle: a committee-specific template should be *committee-native in structure* and *FAC-satisfying in content*. The eight fields should be satisfiable by reading the template — not imposed as the template's section headers. This is a meaningful distinction: a template organized around committee-native concepts (including Dissent Record) can carry all eight FAC fields as content within those sections, without being a mirror of spec-write's extraction contract.

Concretely: the current `artifact-template.md` already has the right section topology for committee-native concerns. The gap is that its Rationale section is unstructured narrative, leaving spec-write to interpret rather than extract. The fix is to add structured fields *within committee-native sections* — not to replace those sections with eight FAC-slot headers.

---

## Peer DM Intent

Will DM pragmatist to probe the operational cost of adding structured sub-fields within committee-native sections versus replacing section headers entirely. Will DM innovator to test whether there is a cleaner structural framing I am missing.

---

## Synthesis

The attack on (a) fails: a single shared format with `design-small-task` is not viable because the Dissent Record has no home in the six-section brief and the epistemic categories are genuinely distinct. Committee-specific template is correct.

The refinement on (a): "mirroring the eight FAC fields" as section headers is the wrong implementation of a right instinct. The committee template should remain committee-native in its section structure (preserving Dissent Record, Verdict, Rationale as first-class sections) and add structure *within* those sections to eliminate unstructured narrative that spec-write must interpret. The eight FAC fields should be satisfiable by reading the template's content — not imposed as its headers.

---

## Final Position

**position:** Support a committee-specific template — the six-section brief cannot absorb it without destroying the Dissent Record or importing a category mismatch between reasoning-trace and deliberation-outcome. Refinement: the new template should be committee-native in section structure (Verdict / Rationale / Dissent Record preserved) and add structured sub-fields within those sections to eliminate unstructured narrative, rather than mirroring the eight FAC fields as the template's section headers.

**rationale:** The Dissent Record is not optional garnish — it is the mechanism by which minority risk survives a non-unanimous verdict. No shared format can carry it without being committee-specific by another name. The FAC fields are a consumer extraction contract, not a producer document structure; making them section headers optimizes for spec-write convenience at the cost of committee coherence. The right fix is structured content within committee-native sections, not a header transplant.

**blocking_risk:** If the template is built by mirroring FAC fields as section headers (rather than as content requirements), the scribe's natural mapping from `verdict.md / consolidator-output.md / alignment-map.md` to template sections breaks — the scribe must scatter committee-native content across extraction-slot buckets, introducing a new translation layer where the current gap is. This is a correctness risk, not just a style concern.

**warrant:** {type: evidence, source: `skills/design-committee/references/artifact-template.md` (committee-native section topology: Summary/Verdict/Rationale/Dissent Record/Deferred); `agents/design-committee-scribe.md` (scribe reads verdict.md + consolidator-output.md + alignment-map.md — committee-native inputs that map to committee-native sections, not FAC slots); `skills/spec-write/references/fac-complete-design-contract.md` (eight fields defined as extraction targets from spec-write's perspective, not production targets from committee's perspective)}
