# Alignment Surface and Sprint Decomposition Decision

**Date:** 2026-06-17
**Sprint:** 20260617-01-codify-committee-design
**Source:** verdict from `committee/round02/verdict.md`; member positions from `committee/round02/consolidator-output.md`

---

## Summary

The committee was asked two questions: what files constitute the change surface for codifying the committee complete-design process (reversing D9 and wiring in the new artifact template), and whether that change lands in one sprint or two. The verdict is one sprint, 3-1, with a mandatory intra-sprint A→B task ordering. The surface converged on the decisive cluster with several named additions from the completeness pass. Downstream: the designer executes this as a single branch with cluster A (committee-internal) authored before cluster B (consumer-side) — no sprint seam, no intermediate commit gate.

## Verdict

Ship the whole alignment in **one refactor sprint** sequenced as two intra-sprint task clusters (A: committee-internal — `artifact-template.md` Option-2 replacement, `team-lead.md`, `committee-analysis-round-format.md`, `agents/design-committee-scribe.md`; THEN B: consumer-side — `fac-complete-design-contract.md` explicit D9 reversal, `spec-write/SKILL.md`, the `design-committee/SKILL.md` scribe-line + `Transitions: none → spec-write` declaration, and `bin/chester-generate-agents` catalog regen of `skill-index.md`), because the candidate sprint seam shares edit surfaces (`fac-complete-design-contract.md`, `spec-write/SKILL.md`, the dual-purpose Transitions line) and so cannot leave a self-consistent documentation state at any split point — a single user-gate-free test surface (catalog freshness + manual inspection) offers no two-sprint isolation benefit; Conservator's two-sprint coordination-risk concern is recorded as dissent.

The change surface is confined to the `design-committee/` + `spec-write/` cluster. **No `CLAUDE.md` file and neither settings file changes** (pure config — confirmed absence). Decisive files plus minor terminology files are enumerated below.

## Rationale

### Why one sprint

The load-bearing argument is that the proposed sprint seam does not isolate a coherent intermediate repository state. Three files straddle any possible split point:

- `fac-complete-design-contract.md` — receives edits in both proposed halves (the D9 reversal framing in half one, the FAC-field table referencing Option-2 labels in half two).
- `spec-write/SKILL.md` — its description of how spec-write reads committee output is either correct or wrong the moment the committee's output shape changes; there is no state where the committee emits a complete-design document and spec-write's own text still accurately describes what it reads.
- `design-committee/SKILL.md` Transitions line — the field currently reads "none — committee = standalone consultation." Changing it to name `spec-write` as downstream is simultaneously: (a) acknowledging the committee now produces a complete-design document, and (b) declaring the committee→spec-write transition. The field cannot carry a half-correct value across a sprint seam without violating Chester's standalone-documentation-discipline.

The Pragmatist sharpened the risk-isolation argument: two sprints would add value if the phases introduced different regression kinds or required independent test gates. Both halves are documentation and template refactors. The test gate is identical for both: `test-generated-agents-current.sh` (catalog freshness) plus manual inspection. There is no user gate or independent test between phases that would justify the seam's coordination cost.

The mandatory A→B intra-sprint ordering is a real dependency: the Option-2 template's labeled sub-fields must exist before the FAC-contract table can name those labels. This is a task-ordering constraint inside the sprint, not a sprint-split rationale.

The Purist added three items the initial survey missed, one of which is a correctness risk, not cosmetic. The scribe agent's current "do not expand" instruction would cause under-population of the new structured Option-2 sub-fields if left unchanged. This is the same class of correctness risk as round01's mis-mapping finding and is load-bearing for the sprint.

### Full enumerated change set

**Decisive files (cluster A — committee-internal, author first):**

- `skills/design-committee/references/artifact-template.md` — full replacement with Option-2 structured template (the primary schema change)
- `agents/design-committee-scribe.md` — update artifact type framing; lift or rewrite "do not expand" instruction (correctness fix — structured sub-fields require it)
- `docs/chester/working/20260617-01-codify-committee-design/committee/` — `team-lead.md`: remove "decision-packet" references, add "packet voice" naming collision fix at line 331 (category-integrity catch)
- `skills/design-committee/references/committee-analysis-round-format.md` — update refs; fix `<decision-packet>.md` filename placeholder at line 58 (Purist + Researcher catch)

**Decisive files (cluster B — consumer-side, author after cluster A):**

- `docs/fac-complete-design-contract.md` — explicit D9 reversal + framing update; FAC-field table names Option-2 labels (must exist from cluster A first)
- `skills/spec-write/SKILL.md` — update extraction→structured read; description edit triggers catalog regen; desc→`skills/setup-start/references/skill-index.md`
- `skills/design-committee/SKILL.md` — scribe-line update + `Transitions: none → spec-write` declaration; description edit triggers catalog regen
- `skills/setup-start/references/skill-index.md` — regenerate via `bin/chester-generate-agents` (mechanical, last step)

**Minor / terminology files (fold into sprint, no special ordering required):**

- `skills/spec-harden/SKILL.md` — "committee verdict" → "complete-design document" terminology
- Four advocacy member agent files — "decision-packet" vocabulary drift (Conservator's agent files included)
- `docs/instructions.md` lines 207/209 — Pragmatist flagged as decisive; include
- `skills/design-committee/references/skill-contract.md` line 40 — Conservator and Pragmatist flag; Innovator and Purist treat as minor; Researcher marks confirmed clean. Verdict: verify the line before authoring; likely minor

**Confirmed-clean absence findings (no edits needed, findings on record):**

- All `CLAUDE.md` files — confirmed clean (pure config; 4-way member agreement + Researcher)
- Both settings files — confirmed clean (pure config; 4-way member agreement + Researcher)
- `skills/spec-architect/SKILL.md` — remains accurate; committee path still skips spec-architect, no change needed

## Dissent Record

**Alignment:** 3-1 (sprint decomposition); unanimous on surface decisive cluster

**Dissenting positions:**

- Conservator: Two sprints — sprint 1 = "committee produces a document" atom (template + scribe + FAC contract + spec-write reading); sprint 2 = "committee hands off to spec" atom (Transitions-to wiring + team-lead.md decision-packet renames + skill-index regen) — blocking risk: "Coordination risk in a single pass: if the scribe agent, the template, and the FAC contract are all in motion simultaneously, a single misjudgment about field names or artifact type propagates across all three before any intermediate validation. Sprint 1 closes with a committee run you can inspect; sprint 2 wires the output into the pipeline against a known-good artifact shape."

**Surface alignment:** unanimous on the nine decisive files. The surface question was partial-to-converged with named additions from the completeness pass — the three Purist catches and the Researcher's sequencing dependency fold in without dissent.

## Deferred / Open

- `docs/feature-definition/Pending/design-committee-answer-delivery-extension-00.md` — institutionally stale; the brief's scope is superseded by this sprint's work. Non-blocking: the file is not runtime-read, so staleness does not affect execution. Review and supersede or archive post-sprint.
- `skills/design-committee/references/skill-contract.md` line 40 — borderline between minor and decisive. Verify the line text before authoring cluster B; if it references "decision-packet" as the committee's output artifact type, edit it; if it describes the committee's consultation role in a way that remains accurate under the new design, leave it.

---

<!-- produced-by: scribe / round02 / 2026-06-17 -->

<!-- created-at: 2026-06-17T15:13:19Z -->
<!-- produced-by design-committee@v0023 -->
