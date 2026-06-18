# Committee Complete-Design Template

This is the annotated template the scribe uses when drafting the committee's
**complete-design document** — the round's designer-facing artifact and the
committee's hand-off into the specify phase. Every `<!-- -->` comment is
instruction to the scribe; remove all comments from the final draft.

The document keeps the committee-native section structure (Summary, Verdict,
Rationale, Dissent Record, Deferred / Open). Within those sections, **labeled
sub-fields carry all eight FAC-complete-design fields as content** — so a
downstream `spec-write` reads each field from its label rather than mining it
from narrative prose. The `## Dissent Record` section is mandatory and MUST
appear in every document regardless of whether members split.

The scribe fills every sub-field from its three bounded inputs only
(`verdict.md`, `alignment-map.md`, `consolidator-output.md`). A sub-field with
no support in those inputs is marked "none surfaced this round" — never
invented. Populating a labeled sub-field from the bounded inputs is permitted
and expected; it is not the prohibited "expanding the verdict's direction".

---

<!-- TITLE: Name the document by what it decides, not by the round number. -->
# [Complete Design — <what it decides>]

<!-- DATE: ISO date the document is produced. -->
**Date:** YYYY-MM-DD

<!-- SPRINT: Sprint name if committee operates inside a sprint context; omit if standalone. -->
**Sprint:** [sprint-name — or remove this entire line if standalone]

<!-- SOURCE: Cite the bounded inputs that produced this document. -->
**Source:** verdict from `committee/roundNN/verdict.md`; synthesis from `committee/roundNN/alignment-map.md`; member positions from `committee/roundNN/consolidator-output.md`

---

## Summary

<!-- One paragraph: what the committee was asked, what the verdict is, and what it means for downstream work. No jargon. -->

- **Goal:** <FAC field 1 — the problem the committee was asked to settle, stated as the goal the chosen design serves. From verdict.md's problem statement.>

## Verdict

<!-- State the verdict verbatim from verdict.md — do not paraphrase. -->

- **Chosen architecture:** <FAC field 2 — the chosen design direction, verbatim from verdict.md. THIS is the field spec-write quotes back to the designer before authoring any spec section; state it as a self-contained sentence so the quote-back reads cleanly on its own.>

## Rationale

<!-- Plain prose drawing from alignment-map.md (primary source) or, when absent, consolidator-output.md positions. State what was weighed and why the verdict resolves it. The labeled sub-fields below carry the remaining FAC fields; populate each from the bounded inputs, and mark "none surfaced this round" if the inputs carry nothing for it. -->

- **Rejected alternatives + sacrifices:** <FAC field 3 — the options set aside and the sacrifice each one carried. From alignment-map.md's positions-discarded-with-reason.>
- **Prior-art findings:** <FAC field 4 — researcher findings bearing on the verdict. From the Researcher line and notable quotes in consolidator-output.md, plus any alignment-map.md warrants. "none surfaced this round" if the researcher did not serve.>
- **Ground-truth-verified facts:** <FAC field 5 — facts verified against the codebase that the design relies on; consumed downstream without re-verification. Same sources as prior-art findings.>
- **Constraints / guardrails:** <FAC field 6 — constraints the verdict imposes on downstream work. From verdict.md / alignment-map.md.>
- **Acceptance-criteria seeds:** <FAC field 7 — the observable signals the design must satisfy; seeds for the spec's acceptance criteria. From the verdict's acceptance signals.>

## Dissent Record

<!-- MANDATORY. MUST appear in every document. If members were unanimous, state that explicitly. If members split, record each dissenting position — member name, position, and the blocking_risk field verbatim from their Final Position. This section is what the team-lead reads while presenting; it guarantees dissent reaches the designer even if the verdict does not foreground it. -->

**Alignment:** [4-0 unanimous | 3-1 | 2-2 | other]

**Dissenting positions** (if unanimous, replace the row below with: "None — all members aligned."):
- [Member]: [position verbatim] — blocking risk: [blocking_risk verbatim]

## Deferred / Open

<!-- Questions the committee left open or explicitly deferred. -->

- **Deferred / non-goals:** <FAC field 8 — what the design explicitly defers or rules out of scope. From verdict deferments / alignment-map.md. If none, write "None.">

---

<!-- produced-by: scribe / roundNN / YYYY-MM-DD -->
