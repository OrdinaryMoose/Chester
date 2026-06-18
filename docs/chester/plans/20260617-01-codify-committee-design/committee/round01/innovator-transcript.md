# Innovator — Round 01 Transcript

**Role:** Innovator
**Question:** Should `design-committee` emit a complete design document via a committee-specific template mirroring the eight FAC fields, reversing D9?

---

## Framing: The D9 Premise is No Longer Correct

D9's core assumption was that "a typed committee design bundle adds a committee output mode and re-introduces artifact bifurcation." That was a reasonable guess at design time. But the FAC-complete-design contract itself has already falsified it — it defines eight fields that `spec-write` extracts from the committee's narrative output. The extraction already introduces bifurcation: two different producer shapes (brief vs. verdict) that both claim to be one type. D9 didn't prevent bifurcation; it merely deferred it downstream, into `spec-write`'s extraction step, where it operates silently.

The more interesting observation: the Innovator lens says to treat existing structure as a choice remakeable. D9 was made under uncertainty about whether extraction-with-quote-back would be reliable. We now have ground truth: the contract explicitly calls out "silent mis-extraction from a narrative committee verdict is the one failure hardening structurally cannot catch — the quote-back is the only guard." That's not a residual risk; it's a known structural weakness, confirmed in the contract document. D9's bet has resolved, and it resolved against extraction.

---

## The Alternative the Designer Didn't Consider: Structured Verdict Fields

The designer's leaning (a) is a committee-specific template mirroring the eight FAC fields. That's an improvement over D9, but it's worth asking whether we're solving at the right layer.

The current verdict-only packet is minimal by design (Summary / Verdict / Rationale / Dissent Record / Deferred). The problem isn't that there are too few *sections* — it's that the verdict section is unstructured prose that `spec-write` has to reverse-engineer. The real fix may be narrower than a full eight-field template: **add structured sub-fields to the Verdict section itself**, leaving the overall artifact shape intact.

Specifically: instead of having a prose "Verdict" entry, have the verdict carry:
- **Chosen direction** (verbatim, one sentence)
- **Rejected alternatives** (bulleted, one sentence each)
- **Acceptance signals** (what-done looks like)
- **Declared constraints** (what cannot change)
- **Deferred / non-goals** (already in template, move here explicitly)

This is a *verdict with structured payload*, not a new template format. It is additive, backward compatible, and doesn't require the scribe to author a design document — just to fill named sub-fields instead of narrative prose.

---

## Why Not One Shared Format With `design-small-task`?

The Purist is tasked to attack the committee-specific template. I'll pre-empt: a shared format is worse, not better. The committee produces a *decision*, not a design conversation record. `design-small-task`'s six sections (Goal, Prior Art, Scope, Key Decisions, Constraints, AC) are optimized for "what did we land on in a bounded design conversation." The committee produces "four advocates deliberated, here is what they agreed on and who dissented." The Dissent Record is load-bearing — it carries dissent to the designer even when the verdict goes the other way. That has no analog in `design-small-task`. A shared format would either sacrifice the Dissent Record or bolt it onto a template that wasn't designed for it.

The right insight is not one shared format, but one shared *contract* — the eight FAC fields. Both producers fill those eight fields; how they structure the document that carries them is legitimately different.

---

## The Context-Economy Constraint Is Not Blocking

The constraint: the scribe authors from `verdict.md` + `consolidator-output.md` + `alignment-map.md` only. A structured verdict payload is fully compatible with this — the structured sub-fields still live in `verdict.md`. The scribe reads the same file; it finds structured sub-fields instead of prose. No new input sources, no new scribe dispatch model required. Context-economy invariant survives.

---

## Structural Alternative: The Typed Verdict Payload

My proposal, summarized:

1. **Keep the existing artifact template shape** (Summary / Verdict / Rationale / Dissent Record / Deferred).
2. **Restructure the Verdict section** to carry typed sub-fields that directly map to the eight FAC fields:
   - `Chosen direction` → FAC field: Chosen architecture
   - `Rejected alternatives` → FAC field: Rejected alternatives + declared sacrifices
   - `Acceptance signals` → FAC field: Acceptance-criteria seeds
   - `Declared constraints` → FAC field: Constraints / guardrails
   - (Deferred section already exists) → FAC field: Deferred / non-goals
3. **Researcher findings file** in the round folder already carries Prior Art and Ground-truth-verified facts — the contract should cite these as the source for those two fields, not extract them from verdict prose.
4. The **Goal** field comes from the question statement in the convening packet, which is already in the artifact's Summary section.

This closes the extraction gap without inflating the artifact or requiring a new scribe template. The verdict document stays recognizable as a verdict; it just has structure where it currently has prose.

---

## What This Means for the Decision

The designer's leaning (a) — committee-specific template mirroring eight FAC fields — is directionally correct. The only question is whether to implement it as a new template (the designer's proposal) or as a structured-payload modification to the existing template (my alternative). The new template is cleaner as a standalone document. The structured-payload modification is smaller and less likely to break the Consolidator/Scribe dispatch chain that already exists. 

I lean toward a new committee-specific template (agreeing with the designer on direction), but structured around the eight FAC fields with the Dissent Record preserved as a mandatory ninth section, not bolted on the side. That produces a richer artifact than the current verdict packet and a cleaner extraction than narrative prose.

---

## Final Position

```
position: Reverse D9. Emit a committee-specific template that carries the eight FAC
fields plus mandatory Dissent Record. Do not share format with design-small-task — the
committee is a decision artifact, not a design-conversation record, and the Dissent
Record has no analog in the small-task brief. Optionally implement as structured sub-
fields within a revised Verdict section rather than a wholly new template shape, which
minimizes scribe dispatch changes while closing the extraction gap.

rationale: D9's premise (typed bundle = bifurcation) was already falsified by the FAC
contract itself, which defines eight fields to extract from two structurally different
producer shapes. The contract's own admission — "silent mis-extraction is the one
failure hardening cannot catch" — confirms D9's bet resolved against extraction.
Structured verdict fields close this at the source, are compatible with the context-
economy constraint (scribe still reads only verdict.md), and don't require a new
dispatch model.

blocking_risk: None. The context-economy invariant is preserved because the scribe's
input (verdict.md) gains structure, not new sources. The Dissent Record stays mandatory.
Standalone invocability is unaffected — no sprint context introduced.

warrant: {
  type: evidence,
  source: "fac-complete-design-contract.md lines 22-26 (D9 rationale + self-admitted
  extraction reliability gap); design-committee/references/artifact-template.md
  (current verdict shape); design-small-task/references/design-brief-small-template.md
  (comparison: committee Dissent Record has no analog in small-task brief)"
}
```
