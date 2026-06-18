# Conservator Transcript — Round 01

**Member:** Conservator
**Round:** 01
**Question:** Should `design-committee` emit a complete design document via a committee-specific template mirroring the eight FAC fields, reversing D9?

---

## Lens

The Conservator defends existing structure where it is working, and resists changes that trade one known failure mode for a less-understood one. Burden of proof lies with the changers.

---

## Reading the Evidence

### What D9 Actually Said

`fac-complete-design-contract.md` lines ~24-26 state: a typed FAC-bundle was "rejected as primary" and retained "only as a documented fallback if extraction-with-quote-back proves unreliable." D9's rejection was conditional and provisional — it is not a permanent architectural decree. The fallback was baked in from the start.

### The Extraction Risk is Real

The contract explicitly names the failure mode: "Silent mis-extraction from a narrative committee verdict is the one failure hardening structurally cannot catch." The mandatory quote-back is the only guard. A single human gate between committee output and spec authoring is a weak control. If that gate is missed, inattentive, or misread, the spec diverges from committee intent silently — no structural check catches it.

### The Current Artifact Template Has No Design Content

`artifact-template.md` (the thing the scribe currently uses) has: Summary, Verdict, Rationale, Dissent Record, Deferred. None of these are design-structured fields. Spec-write must mine structured design content (Goal, Chosen Architecture, Constraints, Acceptance Criteria seeds, etc.) from narrative prose in Rationale. This is not extraction from structured fields — it is interpretation of unstructured narrative. That is the real gap.

### D9's "Artifact Bifurcation" Concern is Weaker Than Stated

D9 rejected a typed bundle because it "adds a committee output mode and re-introduces artifact bifurcation." But bifurcation fear is asymmetric: the cost of two templates that both feed spec-write cleanly is modest; the cost of a failed extraction producing a mis-specified architecture is severe. D9 gave equal weight to a maintenance concern and a correctness concern — and chose wrong.

### Dissent Record is Not at Risk

The proposal explicitly preserves the Dissent Record (designer leaning (a): committee-SPECIFIC template). The Conservator notes this is the load-bearing distinction between "merge with design-small-task" and "extend the committee template." A committee-specific template preserving Dissent Record is conservative relative to the alternative of sharing a format that has no dissent concept.

### Context-Economy Invariant is Not Threatened

The scribe's bounded inputs (`verdict.md`, `consolidator-output.md`, `alignment-map.md`) stay intact. If the new template's eight fields map onto those same inputs, the scribe can populate them without seeing raw transcripts or the session thread. The scribe already reads `consolidator-output.md` for Dissent Record — the same source can populate additional structured fields. No constraint violation.

### What Conservatism Actually Calls For Here

Genuine conservatism asks: which change is smaller? Extending the artifact-template with eight structured fields (to match what spec-write already expects to find) is a smaller change than defending a known extraction failure mode indefinitely. D9 was provisional — its own text admits the fallback exists. Activating the fallback is not a reversal; it is the intended progression.

---

## Peer DM

Will send peer DM to pragmatist to validate operational cost reasoning. Innovator's position not contested from conservator lens — new structured template is itself conservative relative to the extraction-only path.

---

## Final Position

**position:** Support the committee-specific template that mirrors the eight FAC fields, preserving Dissent Record. D9 was a provisional deferral, not a permanent architectural ruling — its own text says the typed bundle was "retained as a documented fallback." Activating that fallback when the extraction failure mode is structurally undetectable is the conservative choice.

**rationale:** The existing artifact-template has no structured design fields — it emits narrative Rationale that spec-write must interpret, not extract. The quote-back is the only guard against silent mis-extraction, and it is a single human gate with no structural backup. Adding eight named fields to a committee-specific template closes that gap with no change to scribe inputs (all fields derive from `verdict.md` + `consolidator-output.md` + `alignment-map.md`), no change to standalone invocability, and no change to the Dissent Record. The bifurcation concern D9 raised is a maintenance cost; the extraction failure it deferred is a correctness cost. Those are not equal.

**blocking_risk:** None. The Conservator does not block. The only risk worth naming is scope creep — if the eight-field template is later merged with `design-small-task`'s six-section brief into a single shared format, the Dissent Record disappears. Keep formats separate.

**warrant:** {type: evidence, source: `skills/spec-write/references/fac-complete-design-contract.md` lines ~22-26 (explicit admission of extraction failure mode + D9 fallback language); `skills/design-committee/references/artifact-template.md` (absence of any structured design fields in current template)}
