# Session Summary: Catalog-only generator + voice/rule single-sourcing

**Date:** 2026-06-08
**Session type:** Committee spec-correction → plan → full-stack implementation
**Plan:** `20260607-01-update-voice-discipline-plan-02.md`

## Goal

Correct the voice-discipline refactor after execution (a prior session) falsified two of its core premises, then re-plan and implement the corrected, narrower scope. The original sprint aimed to single-source all of Chester's shared agent instruction text via a build-time generator; execution proved that committee-member files interleave shared and lens-owned text too finely to assemble from two sources, and that reviewer disciplines are mostly per-consumer rather than shared. This session convened the committee to re-scope, rewrote the spec to catalog-only, built a fresh plan, and executed it end to end.

## What Was Completed

### Committee round 04 (one-round consult)
- Convened the design committee (four advocacy members, name-less one-shot dispatch — no team created, sidestepping the known `TeamDelete` teardown gap).
- Question: given members are out (prior decision D) and reviewer disciplines proved per-consumer, should the generator be catalog-only or catalog-plus-a-narrowed-reviewer-fold?
- Verdict **3-1 catalog-only** (Conservator, Pragmatist, Purist converge from stasis / cost / category lenses; Innovator dissents on "code already paid for"). Designer adjudicated option 1.

### Spec correction (spec-01)
- Dropped AC-2.1 (member generation) and AC-3.1 (reviewer single-sourcing) — both rested on falsified premises.
- Reduced AC-1.1, AC-5.1, AC-8.1 to catalog scope; kept AC-4.1, AC-6.1, AC-7.1.
- Resolved the spec/plan contradiction (spec-00 AC-8.1 sanctioned only the evidence-citation convergence while plan-01's F4 added an unauthorized second) by dropping the plan clause and rescoping AC-8.1 to the catalog output.

### Plan (plan-02, supersedes plan-00/01)
- 5 tasks; plan-reviewer **approved**; plan-attacker found one Critical (double `git rm`) + 3 minors, all fixed pre-execution; smell skipped per designer directive. Risk **Low**. Execution mode **subagent**.

### Implementation (all 5 tasks + remediation)
- **T1** — stripped the generator to catalog-only (removed `emit_agent`, `extract_section`, `HEADER`, `--agents-only`; deleted the agent-mode core test).
- **T2** — built the real catalog pipeline: `agents/manifest.json` + `agents/sources/catalog-template.md` + regenerated `skill-index.md` (now generated, flat-alphabetical, +3 previously-missing skills) + the staleness/determinism verify test.
- **T3** — gave PM Litmus Test and Research Boundary a single canonical home in `util-design-partner-role` (v0006).
- **T4** — pointed both consumers (`design-small-task` v0004, `team-lead.md` v0009) at the canonical home via citation.
- **T5** — CLAUDE.md two-tier version-rule dedup (carve-out restored, stated once) + fixed the phantom `setup-start/SKILL.md` catalog pointer.
- **Remediation** — reconciled three version-pin tests to the new versions and broadened the voice no-restatement sentinels (from a plan-completeness gap + a quality-review finding).

## Verification Results

| Check | Result |
|-------|--------|
| Full test suite | 30 PASS / 0 FAIL |
| Committed catalog vs fresh generation | byte-identical (staleness contract holds) |
| Generation determinism | byte-identical across two runs |
| Per-task spec reviews (T1–T5) | all Pass |
| Per-task quality reviews (T1–T5) | all Pass (findings ≤ Important, all addressed or deferred-by-design) |
| Final whole-range code review (`1c9b071..a012e87`) | CLEAN — all 6 ACs satisfied |

## Known Remaining Items

- **Generator name drift (cosmetic).** `bin/chester-generate-agents` / `chester-generate-agents.sh` now produce only the catalog, not agent files; spec-01 deliberately retained the name "for continuity with the committed wrapper." A future rename is optional.
- **AC-ID comment collision (cosmetic).** `test-generated-agents-current.sh` tags a check `AC-4.1` (this sprint) while `test-partner-role-discipline.sh` uses `AC-4.1` for a retired prior-spec criterion. Both pass; different spec namespaces. Optional one-line retag.
- **Committee closed** (round-04 artifacts + ledger stamped). No open follow-on rounds.

## Files Changed

**Generator + catalog (code/config):**
- Modify `chester-util-config/chester-generate-agents.sh` (stripped to catalog-only)
- Create `agents/manifest.json`, `agents/sources/catalog-template.md`
- Regenerate `skills/setup-start/references/skill-index.md`

**Voice rules (docs):**
- Modify `skills/util-design-partner-role/SKILL.md` (canonical home; v0005→v0006)
- Modify `skills/design-small-task/SKILL.md` (cite; v0003→v0004)
- Modify `skills/design-committee/references/team-lead.md` (cite; v0008→v0009)

**CLAUDE.md (docs):**
- Modify root `CLAUDE.md`, `skills/CLAUDE.md` (two-tier dedup + phantom-pointer fix)

**Tests:**
- Create `tests/test-generated-agents-current.sh`, `tests/test-claude-md-dedup.sh`
- Modify `tests/test-generate-catalog.sh`, `tests/test-partner-role-discipline.sh`, `tests/test-info-packet-style-version-bumps.sh`, `tests/test-partner-role-overlay-section.sh`, `tests/test-stamping-design-small-task.sh`
- Delete `tests/test-generate-agents-core.sh`

**Sprint artifacts (working/):** `spec/...-spec-01.md`, `plan/...-plan-02.md`, `plan/...-plan-threat-report-01.md`, `committee/round04/*`, `committee/ledger.md`.

## Commits

- `c9b67f2` refactor(generate-agents): reduce generator to catalog-only
- `6cac147` feat(generate-agents): generate skill catalog from frontmatter + verify test
- `5693611` feat(design-partner-role): canonical home for PM Litmus Test + Research Boundary
- `172d43c` refactor(voice): cite canonical PM Litmus + Research Boundary instead of restating
- `c0d281f` test: reconcile version pins + broaden voice no-restatement sentinels
- `a012e87` docs(claude-md): two-tier version-rule dedup + fix phantom catalog pointer
- `bfab6d4` checkpoint: execution complete

## Handoff Notes

- The skill catalog is now a generated artifact. **After changing any skill's `description` frontmatter, run `bin/chester-generate-agents`** or `test-generated-agents-current.sh` will flag it stale. This is now documented in both CLAUDE.md files.
- The version-bump rule lives in exactly one place: root `CLAUDE.md` § Skill File Conventions (with the typo/comment-only carve-out). `skills/CLAUDE.md` points up to it.
- Members and reviewers remain hand-authored by design — not a gap. The "single-source all agent text" thesis held only for catalog / voice-rules / CLAUDE.md.
- Sprint is ready to archive + close (designer chose archive + close-worktree).

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-committee@v0018 -->
<!-- produced-by design-specify@v0004 -->
<!-- produced-by plan-build@v0006 -->
<!-- produced-by finish-write-records@v0004 -->
