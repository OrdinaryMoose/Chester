# Ground-Truth Report — spec-00 (canonical instruction-injection generator)

**Sprint:** 20260607-01-update-voice-discipline
**Spec:** spec/20260607-01-update-voice-discipline-spec-00.md
**Date:** 2026-06-07
**Reviewer:** ground-truth-reviewer (general-purpose subagent), findings adjudicated + fixed by design-specify

## Status: Findings fixed (1 HIGH, 2 MEDIUM, 1 LOW)

## Verified claims (CONFIRMED against code)

- Wrapper/impl split — `bin/chester-config-read:5-7` execs `chester-util-config/chester-config-read.sh`; `bin/chester-trailer-write:3-5` likewise. Generator pattern is real.
- `jq` guard — `chester-util-config/chester-config-read.sh:29` (`command -v jq`) + fallback `:53-59`.
- 9 generated-output agent files exist (4 members + 5 reviewers).
- Excluded roles exist + distinct: `design-committee-{consolidator,scribe,researcher}.md`.
- `util-design-partner-role/SKILL.md` headings: `## Interpreter Frame` (:19), `## Stance Principles (carry into every turn)` (:162); no `## PM Litmus Test` / `## Research Boundary` (spec adds them).
- Reviewer discipline distribution: evidence — attacker `:72-78,95`, smeller `:62-69`; ladder — spec-reviewer `:64-73`, quality-reviewer `:68-77`; independence — plan-reviewer `:51`, spec-reviewer `:18-31`. Irregular as the spec asserts.
- `skill-index.md` has hand-authored `## Skill Priority` / dispatch-patterns / grouped catalog; omits `design-grillme`, `util-handoff`, `util-improve-codebase` (all three exist as dirs).
- `tests/` conventions confirmed against `tests/test-trailer-write.sh` (`set -euo pipefail`, `mktemp -d`+trap, `fail()`, PASS/FAIL footer).
- Member contracts intact (`design-committee-conservator.md` `## Final Position` :73,:100; routing-signal :10,:73).

## Findings and resolution

- **HIGH — `agents/CLAUDE.md` would fail the completeness check.** `agents/CLAUDE.md` matches the `agents/*.md` glob but is neither a generated output nor on the exclusion list, so AC-5.1's "clean tree → exit 0" would fail. **FIXED:** spec now globs `agents/*.md` EXCLUDING `agents/CLAUDE.md`; AC-5.1 observable updated. Verified against full inventory (`ls agents/*.md` = 13 files: 9 generated + consolidator/scribe/researcher + CLAUDE.md).
- **MEDIUM — `team-lead` is not an agent file.** No `agents/design-committee-team-lead.md`; the role lives at `skills/design-committee/references/team-lead.md`. **FIXED:** removed from the exclusion list across Components + Constraints; exclusion is now {consolidator, scribe, researcher}.
- **MEDIUM — Translation Gate not canonical in `util-design-partner-role`.** That file defers the Gate ("Translation Gate (defined in design skills)" `:33`,`:120`); only Stance Principles is canonical there. **FIXED:** Components/Constraints/AC-2.1 now source the member Translation-Gate band from `agents/sources/member-scaffold.md` (its canonical home); only Stance Principles is extracted from `util-design-partner-role:162`.
- **LOW — independence map may undercount.** `execute-write-quality-reviewer:66` carries an independence-flavored line not in the listed map. **NOTED** in AC-3.1: the derived map resolves it at authoring; default leave-in-place (no meaning change).

## Risk Assessment

Generator-pattern foundation (wrapper/impl, jq guard, test conventions) is accurate. The one execution-blocking issue (completeness glob vs `agents/CLAUDE.md`) is fixed and verified against the full directory inventory, so a re-dispatch would only re-confirm already-verified file facts. The two factual errors (team-lead-as-agent-file, Translation-Gate-as-canonical) are corrected in place. Spec is codebase-accurate as of HEAD 6c7991b.

<!-- created-at: 2026-06-07T11:43:31Z -->
<!-- produced-by design-specify@v0004 -->
