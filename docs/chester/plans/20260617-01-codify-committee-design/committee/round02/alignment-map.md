# Alignment map — alignment surface + sprint decomposition — round02

## Alignment pattern

- **Sprint decomposition:** 3-1 for ONE sprint (Innovator, Pragmatist, Purist) vs two sprints (Conservator). Researcher: factual finding leans one (no advocacy).
- **Surface completeness:** converged — all four agree on the decisive committee + spec-write cluster; Purist (completeness critic) added three missed items, one of them a correctness flag. Settings + CLAUDE.md confirmed clean (4-way + researcher agreement).

## Option set

1. **One sprint** — the whole change set lands in a single sprint branch, with a mandatory intra-sprint task ordering: cluster A (committee-internal: template, scribe, team-lead, round-format) authored first, cluster B (consumer-side: FAC contract, spec-write, transition declaration, catalog regen) second.
2. **Two sprints** (Conservator's seam) — sprint 1 = "committee produces a document" (template + scribe + FAC contract + spec-write reading); sprint 2 = "committee hands off to spec" (Transitions-to line + decision-packet renames + catalog regen).

## Positions discarded (with reason)

- **Two sprints** set aside as the recommendation (dissent preserved). Load-bearing reason (logic + evidence, Innovator + Purist, unrefuted on the merits): the proposed seam does not isolate a coherent intermediate state. `fac-complete-design-contract.md` and `spec-write/SKILL.md` are shared edit surfaces for both halves, and `design-committee/SKILL.md`'s `Transitions: none` line is simultaneously both changes. After any split-point merge, the committee emits a design document while the SKILL still says "standalone / decision-packet" — the repo's own docs are self-contradictory, which Chester's standalone-documentation-discipline forbids. No user gate or independent test sits between the phases to offset the split's cost (Pragmatist: same regression kind, single test gate = catalog freshness + manual inspection). Conservator's residual point — coordination/unwind risk in one pass — is a real trade but is handled by intra-sprint A→B ordering, not by a sprint boundary.

## Answer shape

**Converged (one sprint) with preserved dissent**, on the surface question **partial→converged with named additions**. The sprint recommendation carries a warrant that defeats the dissent on the merits, but the dissent's coordination-risk trade is recorded for the designer.

## Warrant record

- **One sprint** — warrant: logic + evidence. Source: shared edit surfaces (`fac-complete-design-contract.md`, `spec-write/SKILL.md`) and the dual-purpose `design-committee/SKILL.md` Transitions line straddle the candidate seam (Innovator, Purist file:line survey); no intermediate state leaves docs coherent (Purist); no test/user-gate between phases (Pragmatist, Researcher). Verified.
- **Mandatory A→B task ordering** — warrant: evidence. Source: the Option-2 template's labeled sub-fields must exist before the FAC-contract table can name those field labels (Researcher decisive sequencing fact). Verified — this is an intra-sprint plan constraint, not a sprint split.
- **Two-sprint dissent (Conservator)** — warrant: evidence (grep survey) + the claim that each sprint leaves a coherent state. The coherent-intermediate-state claim is refuted by the shared-surface evidence; the coordination-risk concern survives as a recorded trade, not a defeater.
- **Surface — decisive files** — warrant: evidence (researcher file:line + 3 members' independent surveys). The decisive set: `artifact-template.md` (replace), `design-committee/SKILL.md` (scribe line + Transitions; desc→catalog regen), `team-lead.md` (decision-packet refs + "packet voice" line 331), `committee-analysis-round-format.md` (refs + `<decision-packet>.md` filename + section structure), `agents/design-committee-scribe.md` (artifact type + "do not expand" instruction), `fac-complete-design-contract.md` (reverse D9 + framing), `spec-write/SKILL.md` (extraction→structured read; desc→catalog regen), `skills/setup-start/references/skill-index.md` (regenerate, mechanical). Verified.
- **Surface — minor/terminology** — warrant: evidence. `spec-harden/SKILL.md` ("committee verdict"→"complete-design document"); four advocacy member agent files ("decision-packet" vocab drift, Conservator); `docs/instructions.md` lines 207/209 (Pragmatist flagged decisive, others silent — include); `skills/design-committee/references/skill-contract.md` line 40 (Conservator+Pragmatist flag, Innovator+Purist minor — verify, likely minor).
- **Confirmed-clean absence findings** — warrant: evidence (researcher). ALL CLAUDE.md files; both settings files (pure config); `spec-architect/SKILL.md` remains accurate (committee path still skips it). Stating absence is a finding.
- **Three Purist catches** — warrant: evidence + logic. (1) `team-lead.md:331` "packet voice" naming collision (category-integrity); (2) `committee-analysis-round-format.md:58` `<decision-packet>.md` filename placeholder; (3) **scribe "do not expand" instruction is a correctness risk** — left unchanged it under-populates the new structured Option-2 sub-fields. Item 3 is load-bearing, same class as round01's mis-mapping risk.
- **Non-blocking institutional** — warrant: evidence (researcher). `docs/feature-definition/Pending/design-committee-answer-delivery-extension-00.md` is stale; review/supersede post-sprint, not a runtime-read correctness blocker.

<!-- created-at: 2026-06-17T15:13:19Z -->
<!-- produced-by design-committee@v0023 -->
