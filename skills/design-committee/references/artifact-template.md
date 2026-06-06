# Committee Artifact Template

This is the annotated template the scribe uses when drafting committee artifacts (specs, plans, or analysis documents). Every `<!-- -->` comment is instruction to the scribe — remove comments from the final draft. The `## Dissent Record` section is mandatory and MUST appear in every artifact regardless of whether members split.

---

<!-- TITLE: Name the artifact by what it decides, not by the round number. -->
# [Artifact Title]

<!-- DATE: ISO date the artifact is produced. -->
**Date:** YYYY-MM-DD

<!-- SPRINT: Sprint name if committee operates inside a sprint context; omit if standalone. -->
**Sprint:** [sprint-name — or remove this entire line if standalone]

<!-- SOURCE: Cite the verdict.md and consolidator-output.md that produced this artifact. -->
**Source:** verdict from `committee/roundNN/verdict.md`; member positions from `committee/roundNN/consolidator-output.md`

---

## Summary

<!-- One paragraph: what the committee was asked, what the verdict is, and what it means for downstream work. No jargon. -->

## Verdict

<!-- State the verdict verbatim from verdict.md — do not paraphrase. -->

## Rationale

<!-- Plain prose. Draw from alignment-map.md if available, else consolidator-output.md positions. State what was weighed and why the verdict resolves it. -->

## Dissent Record

<!-- MANDATORY. MUST appear in every artifact. If members were unanimous, state that explicitly. If members split, record each dissenting position — member name, position, and the blocking_risk field verbatim from their Final Position. This section is what the team-lead reads while presenting; it guarantees dissent reaches the designer even if the verdict does not foreground it. -->

**Alignment:** [4-0 unanimous | 3-1 | 2-2 | other]

**Dissenting positions** (if unanimous, replace the row below with: "None — all members aligned."):
- [Member]: [position verbatim] — blocking risk: [blocking_risk verbatim]

## Deferred / Open

<!-- Questions the committee left open or explicitly deferred. If none, write "None." -->

---

<!-- produced-by: scribe / roundNN / YYYY-MM-DD -->
