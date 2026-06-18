# Reasoning Audit: Codify committee complete-design document (reverse D9)

**Date:** 2026-06-18
**Session:** `00`
**Plan:** `20260617-01-codify-committee-design-plan-00.md`

## Executive Summary

This session executed a fully-hardened nine-task plan that reverses decision D9: the committee now emits a structured complete-design document and `spec-write` reads its eight FAC fields by label instead of mining them from narrative prose. The most consequential execution decision was handling the two-sense "decision packet" hazard in Task 3 — renaming the *artifact* sense while disambiguating (not deleting) the locked four-block *surface* sense — because conflating them would have either left the rename incomplete or destroyed a load-bearing locked surface guarded by a test. The implementation stayed on-plan throughout; the only deviation was a designer-approved finish-time fold-in (DI-1/DI-2) closing two pre-existing out-of-scope residuals the cross-task review surfaced.

## Plan Development

The plan was carried in fully-formed and pre-hardened (plan-attack ran; plan-smell was correctly skipped on a pure-markdown refactor). Design, spec (spec-02), and plan (plan-00, plan-build@v0007) were authored in prior sessions. This session was execution + finish only. The plan's commit/edit steps hardcoded the main checkout path; every dispatch redirected them to the worktree.

## Decision Log

### Two-sense "decision packet" disambiguation (Task 3)

**Context:** "Decision packet" carried two distinct meanings — the scribe's output *artifact* (which this sprint renames) and the team-lead's locked four-block *decision-communication surface* (which must not change). A blanket rename would corrupt the surface; a narrow rename would miss the artifact.

**Information used:** `team-lead.md` locked-surface structure; `tests/test-member-warrant.sh:58` which pins the exact heading `What a Good Decision Packet Sounds Like` as a locked-surface anchor; the regex property that "decision-communication packet" does not match `decision[- ]packet` (the inserted word breaks adjacency).

**Alternatives considered:**
- Blanket rename of all "decision packet" occurrences — rejected: destroys the locked surface and breaks the warrant test.
- Leave the surface term as bare "decision packet" — rejected: leaves the artifact-sense rename ambiguous against the surface sense in the same file.

**Decision:** Rename the artifact sense to "complete-design document"; disambiguate the surface sense to "decision-communication packet"; update the test anchor in lockstep.

**Rationale:** Splitting the two senses into distinct unambiguous terms lets the artifact rename land completely while preserving the locked surface and its guard test. The disambiguated surface term is regex-distinct from the artifact term, so residual sweeps stay sound.

**Confidence:** High — the hazard and the resolution were explicit in the plan and threat report, and verified against the live test anchor.

---

### Version-bump discipline: term-only edits stay unbumped (Tasks 8 and the role files)

**Context:** Task 8 and the five committee role agents received terminology-only edits (artifact name change, meaning unchanged). The `agents/CLAUDE.md` version convention bumps on meaningful behavior/contract change, "not on typo fixes or comment-only edits."

**Information used:** `agents/CLAUDE.md` version-field rule and its carve-out; the threat report's AC-8.1 resolution; the distinction between the scribe (real behavior change → bumped v0002) and the role files (term-only → unchanged v0001).

**Alternatives considered:**
- Bump every touched file — rejected: violates the carve-out and inflates version churn without contract change.

**Decision:** Bump only files with genuine behavior/contract changes (scribe, team-lead, round-format, both SKILLs); leave the five role files and `spec-harden/SKILL.md` at v0001.

**Rationale:** The version number signals contract change to downstream readers; bumping on pure terminology would dilute that signal. The carve-out exists precisely for this case.

**Confidence:** High — explicitly governed by the convention and audited in Task 9.

---

### DI-2/DI-3 — log-and-defer rather than silently fix (cross-task review finding)

**Context:** The mandatory cross-task code review surfaced two pre-existing artifact-sense "committee verdict" residuals (`spec-template.md:18`, `catalog-template.md:53`) and one doc-discipline nit (`fac-contract.md:22`) — all rated Minor, all outside Task 8's fixed eight-file edit surface.

**Information used:** execute-write §4.3 (Minor = note, not force-fix); the deferred-items discipline; the fact that neither residual file was in the sprint diff (`6d46a6e..41e4cc6`); the precedent set by DI-1 (logged, not silently edited).

**Alternatives considered:**
- Silently edit the residuals mid-execution — rejected: reaches outside the approved edit surface, the same anti-pattern that produced DI-1.
- Ignore them entirely — rejected: they are the last artifact-sense residuals and undercut the sprint's coherence goal; the record should capture them.

**Decision:** Log DI-2 and DI-3 to the deferred-items file and surface the fold-in choice to the designer at the finish boundary.

**Rationale:** Out-of-scope edits are a designer decision, not an executor one; logging preserves the record and lets the designer choose fold-in-vs-defer with full context.

**Confidence:** High — directly governed by execute-write's deferred-items discipline.

---

### DI-2 fold-in via generator source, not the generated file

**Context:** Designer approved folding in the DI-2 residuals. `skill-index.md` L37/L53 are generated; `catalog-template.md` L37/L53 are the hand-authored source spliced verbatim around the `<!-- CATALOG_SLOT -->` marker.

**Information used:** `chester-generate-agents.sh` splice mechanic; `test-generated-agents-current.sh` which diffs a fresh regen against the committed catalog (so a hand-edit to `skill-index.md` would fail on next run); CLAUDE.md's "do not hand-edit the catalog" rule.

**Alternatives considered:**
- Edit `skill-index.md` directly — rejected: passes a casual read but fails the freshness test and violates source-of-truth discipline.

**Decision:** Edit `catalog-template.md` (+ `spec-template.md`) and regenerate the catalog, then commit all three.

**Rationale:** The generated file must only change via its source + regen; this is mechanically enforced by the freshness test. Fixing the source also closed DI-1's skill-index hits in the same move.

**Confidence:** High — confirmed by reading the generator and passing the freshness test post-regen.

---

### Narrative-extraction grep false-positive disposition (Task 9 Step 1)

**Context:** Task 9's residual sweep grep (`mine.*narrative`) flagged two lines in `fac-complete-design-contract.md` describing the *old* path in contrast/history ("now a structured read … rather than a mine of narrative prose"; the "D9 is reversed" paragraph).

**Information used:** The grep is a deliberately broad tripwire; the plan's intent is "no language describing the *current* committee path as narrative-mining"; both hits describe the old path to explain the reversal.

**Alternatives considered:**
- Treat the hits as residuals and edit them out — rejected: you cannot explain a reversal without naming what it reversed; both lines describe the current path as structured.

**Decision:** Judge the two hits legitimate contrast/history; no fix. (Later partially revisited: the contrast-language placement became DI-3, a separate doc-discipline nit, deferred.)

**Rationale:** The grep over-matches by design; the matched text is correct documentation of the reversal, not a live mis-description of current behavior.

**Confidence:** Medium — the disposition is sound, but the same lines later drew a Minor doc-discipline flag (DI-3), so the placement is debatable even though the content is correct.

---

### Worktree-path redirect of every plan dispatch

**Context:** The hardened plan hardcoded `cd /home/mike/Documents/CodeProjects/Chester` (main checkout) in every commit/edit step, but the sprint runs in an isolated worktree (branch + worktree chosen earlier for `--no-ff` merge-history and isolation until green).

**Information used:** CLAUDE.md worktree-cd hazard (never cd to main during a worktree session; use absolute worktree paths); the gitignored `working/` lives at the *main* repo path while code edits go to the worktree.

**Alternatives considered:**
- Execute against the main checkout as the plan literally says — rejected: defeats the chosen isolation and risks polluting main before green.

**Decision:** Substitute the worktree path in every implementer dispatch and verification command; keep `working/` artifact writes at the main repo path.

**Rationale:** The plan's path was written for the default (no-worktree) flow; the worktree decision overrides it. Splitting code (worktree) from artifacts (main `working/`) matches the Chester directory model.

**Confidence:** High — consistently applied and verified via per-task git status from the worktree root.

<!-- created-at: 2026-06-18T12:06:53Z -->
<!-- produced-by finish-write-records@v0004 -->
