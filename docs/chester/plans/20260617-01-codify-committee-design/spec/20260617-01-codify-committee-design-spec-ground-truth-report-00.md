# Ground-Truth Report — Committee complete-design document (reverse D9)

**Sprint:** 20260617-01-codify-committee-design
**Spec reviewed:** `spec/20260617-01-codify-committee-design-spec-01.md` (findings applied in `-spec-02.md`)
**Date:** 2026-06-17

## Status: Findings (2 MEDIUM) — both fixed in spec-02

## Verified claims (CONFIRMED against the live plugin + docs trees)

- `artifact-template.md` referenced by exactly 4 files: `committee-analysis-round-format.md`, `team-lead.md`, `agents/design-committee-scribe.md`, `design-committee/SKILL.md`. Blast radius accurate.
- `fac-complete-design-contract.md` referenced only by `skills/spec-write/SKILL.md`. B-cluster scope accurate.
- D9 text at `fac-complete-design-contract.md:24-26` (`## Why extraction, not a typed bundle`).
- `design-committee/SKILL.md:228` "Transitions to: none — committee = standalone consultation."
- Scribe "do not expand" at `agents/design-committee-scribe.md:19`; the no-opinion prohibition to preserve at line 28.
- `team-lead.md:331` "packet voice" (Dispatch Voice).
- `committee-analysis-round-format.md:58` `<decision-packet>.md` placeholder.
- `skill-contract.md:40` "decision-packet output expected" — confirmed stale.
- Five role agent files carry the artifact-sense term: conservator/innovator/pragmatist/purist:47, researcher:31.
- Two-sense "decision packet" in team-lead.md confirmed: artifact sense (lines 87, 102, 138, 139) vs locked decision-communication-packet surface (lines 36, 38, 157, 216, 331). The spec's hazard framing is accurate.
- `spec-architect/SKILL.md` committee-skip accurate (lines 3, 20, 137) — no change needed.
- `spec-write/SKILL.md:3` frontmatter contains "Extracts the eight-field FAC-complete-design contract…" — the one catalog-regen trigger.
- No `CLAUDE.md` needs the artifact-sense change (only incidental filename mentions at `agents/CLAUDE.md:25`, `docs/feature-definition/CLAUDE.md:20`).
- `spec-harden/SKILL.md:23` "committee verdict" terminology; `docs/instructions.md:207,209` committee/pipeline lines — confirmed.

## Findings (fixed)

- **MEDIUM — fabricated settings filename.** Spec-01 named `settings.chester.json` as a repo settings file in the absence list (Components + AC-7.1). The repo contains only `.claude/settings.chester.local.json`; the `~/.claude/settings.chester.json` cited in round02 is user-scoped, outside the repo, and cannot appear in a sprint diff. **Fix (spec-02):** Components and AC-7.1 now name the repo-tracked `.claude/settings.chester.local.json` as the diff-asserted file and note the user-scoped file as out-of-repo/out-of-scope.
- **MEDIUM — "pure config" claim scoping.** Same root cause; the judgment is verified for the file that exists. **Fix (spec-02):** claim scoped to `.claude/settings.chester.local.json`.

## Risk Assessment

All substantive code claims verify exactly against the live tree. The only defect was a phantom filename in the absence list, which made AC-7.1 literally unsatisfiable for that one file; corrected in spec-02 with no design or behavioral impact. The spec is ground-truth-accurate and safe to plan against.

<!-- created-at: 2026-06-17T15:26:00Z -->
<!-- produced-by spec-harden@v0001 -->
