# Plan Threat Report — agent generator

**Sprint:** 20260607-01-update-voice-discipline
**Plan:** plan/20260607-01-update-voice-discipline-plan-00.md
**Date:** 2026-06-07
**Hardening:** plan-attack only. **plan-smell SKIPPED by user directive** (not by heuristic).
**Scope:** reviews read main branch + current worktree only (per directive); no other sprint worktrees.

## Combined implementation risk: SIGNIFICANT

Reasoning:
- One finding (F2) invalidates a core mechanism assumption: full-file fragment concatenation cannot reproduce the current member files because the lens name is woven INTO the "shared" bands and the generator has no substitution step. The diff-clean gate (AC-8.1) fails as written.
- Two more HIGH findings are concrete code/test bugs (F1 unbound `$tmpl_abs`; F3 `fail()` called in a test that has no `fail()`), both fixable with known one-line corrections.
- One MEDIUM (F5) is a genuine design fork, not a bug: the index groups skills by ROLE, which is not derivable from frontmatter — "generate from frontmatter" and "preserve grouping" collide. Needs a designer decision.
- Two MEDIUM (F4 second convergence; F6 leading-blank whitespace) and two LOW (F7 wrong-item guidance; F8 test-convention mismatch) are bounded fixes.
- The generator core mechanics, section extraction against the real heading, and reviewer-source extraction were VERIFIED correct.

## Findings

- **F2 — HIGH.** Member "shared" bands carry per-lens text (Phase Contract lens name; Hard Prohibitions items 2-4; Output-Format templates embed lens name; preamble). No substitution mechanism → byte-reproduction impossible. Also: current member Stance bullets are lens-ADAPTED (e.g. `conservator:29-30`), so extracting generic Stance from `util-design-partner-role` would drop the adaptation (semantic change). Evidence: `agents/design-committee-conservator.md:8,39-40,46,47-48,71,79`.
  - **Fix:** add a `{{Lens}}`/`{{lens}}` placeholder pass to the generator (manifest supplies the lens token per member); `member-scaffold.md` carries shared-structural bands with placeholders; `lens-{}.md` carries all lens-unique prose INCLUDING the lens-adapted Stance bullets; DROP the `util-design-partner-role` Stance extraction fragment for members. Update spec AC-2.1/AC-8.1 and plan Tasks 1, 3, 7.
- **F1 — HIGH.** `emit_catalog` uses `$tmpl_abs` but the assignment is only in prose, not the code block; `set -u` → unbound-variable crash. **Fix:** put `local tmpl_abs="$CHESTER_ROOT/$tmpl"` inside the Task 2 Step 3 code block.
- **F3 — HIGH.** Task 5 + Task 10 add `fail "..."` assertions to `tests/test-partner-role-discipline.sh`, which has no `fail()` (uses `set -e` + inline `|| { echo …; exit 1; }`). **Fix:** use the inline pattern in those assertions (or refactor that test to the `fail()` accumulator convention).
- **F4 — MEDIUM.** Confidence-ladder wording also drifts (`execute-write-spec-reviewer.md:68` vs `quality-reviewer.md:71`) — a SECOND convergence the canonical `## Confidence ladder` forces, not enumerated in AC-8.1. **Fix:** enumerate it as a second deliberate convergence.
- **F5 — MEDIUM (designer decision).** The index groups skills by role (Pipeline/Finish/Review/Behavioral/Utility, `skill-index.md:22-50`); role is not in frontmatter, so a frontmatter-generated list is flat-alphabetical and loses grouping. The test doesn't assert grouping. **Options:** (a) flat alphabetical list, drop role-grouping (keep Priority + Dispatch sections hand-authored); (b) add a `category:` field to every SKILL.md frontmatter (new single source) and generate grouped; (c) keep grouping hand-maintained in the template via per-group slots + a category map in the manifest.
- **F6 — MEDIUM.** `extract_section` includes the blank line after the heading (`util-design-partner-role:163`) → double blank in output. **Fix:** strip leading blank lines in `extract_section`.
- **F7 — LOW.** Task 3 Step 2 says the "fifth Hard-Prohibition item differs"; actually item 5 is identical and items 2-4 differ. **Fix:** correct the guidance.
- **F8 — LOW.** `test-partner-role-discipline.sh` uses `set -e`/inline-exit, not the `set -euo pipefail`+`fail()` convention; extending it needs the matching pattern (ties to F3).

## Verified correct (no action)
- `extract_section` awk vs `## Stance Principles (carry into every turn)` — exact-match works; section is last in file.
- `skills/*/SKILL.md` glob hits all 23, one nesting level; descriptions are single-line scalars (frontmatter awk works); no tab/backslash collisions.
- Confidence ladder present in both spec/quality reviewers at cited lines; independence at `plan-build-plan-reviewer.md:51`; root `CLAUDE.md:31` carve-out present; `:86` phantom-pointer diagnosis accurate.
- `test-generate-agents-core.sh` fixture byte-trace is correct.

<!-- created-at: 2026-06-07T12:32:22Z -->
<!-- produced-by plan-build@v0006 -->
