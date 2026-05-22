# Session Summary: Review Skill Rationalization

**Date:** 2026-04-05
**Session type:** Benchmark-driven refactoring
**Plan:** No formal plan — driven by evaluation brief (`20260405-01-review-skill-rationalization-brief-00.md`)

## Goal

Evaluate whether Chester's multi-agent review skills (chester-plan-smell with 3 agents, chester-plan-attack with 5 agents) produce findings that justify their cost overhead compared to a single-pass baseline review. If not, simplify them. Additionally, create a new skill (chester-util-codereview) for reviewing existing code scoped to a directory.

## What Was Completed

### Phase 1: Created chester-util-codereview and benchmarked against baseline

Built a 3-agent code review skill mirroring plan-smell's architecture, then tested it against an unskilled baseline across two iterations:

**Iteration 1 — Chester skill files (markdown):**
- 3 eval targets, 6 runs (3 with skill, 3 baseline)
- Skill pass rate: 95.8%, baseline: 66.7% — delta driven entirely by output formatting (severity labels, smell taxonomy, density rating)
- Cost: skill averaged 157s/29k tokens vs baseline 54s/17k tokens (2.9x time)

**Iteration 2 — Real C# code (StoryDesigner):**
- 3 eval targets (ViewModels 9 files, Services 28 files, Core.Domain 42 files), 6 runs
- Finding counts nearly identical: 13/12/15 (skill) vs 12/12/13 (baseline)
- Both found the same high-severity issues (God Classes, copy-paste providers, clone boilerplate)
- Baseline found practical runtime bugs the skill missed (memory leaks, thread safety, missing notifications)
- Skill found cross-cutting architectural patterns the baseline missed (Shotgun Surgery, blast radius)
- Cost: skill averaged 206s/60k tokens vs baseline 99s/47k tokens (2.1x time)

**Iteration 3 — Lightweight rewrite test:**
- Rewrote skill as 85-line single-pass review (no agents, no Structured Thinking)
- Tested on Services/: 98s/44k tokens — matched baseline cost with better organization

### Phase 2: Rewrote chester-plan-smell

Applied the same simplification. Removed 3-agent architecture and Structured Thinking MCP dependency. Key insight: plan-build consumes smell output as prose ("read both reports and synthesize a single combined implementation risk level — this is a judgment call, not a formula"), so structured format adds no value to the consumer.

310 lines → 105 lines.

### Phase 3: Benchmarked and rewrote chester-plan-attack

Created a lightweight temp skill and tested both versions against two implementation plans:

| Test | Lightweight | 5-Agent | Multiplier |
|------|-------------|---------|------------|
| Chester config plan (stale) | 120s / 35k | 211s / 45k | 1.8x / 1.3x |
| StoryDesigner output dir plan (stale) | 163s / 46k | 237s / 52k | 1.5x / 1.1x |

Both plans turned out to be stale — both versions immediately identified "plan unexecutable" as the critical finding. The 5-agent version found one additional insight (shell injection in existing code, framework generation history) but these were marginal and arguably outside the skill's scope.

343 lines → 112 lines. 5-agent version preserved as SKILL.md.bak.

### Registry updates

Updated chester-setup-start/SKILL.md:
- Added chester-util-codereview to the available skills list and priority order
- Updated chester-plan-smell description (removed "three parallel agents" reference)
- Updated chester-plan-attack description (removed "five parallel attack agents" reference)

## Files Changed

**New files:**
- `chester-util-codereview/SKILL.md` — new lightweight code review skill (85 lines)

**Modified files:**
- `chester-plan-smell/SKILL.md` — rewritten from 310 to 105 lines
- `chester-plan-attack/SKILL.md` — rewritten from 343 to 112 lines
- `chester-setup-start/SKILL.md` — registry entries updated for all three skills

**Backup files (untracked):**
- `chester-plan-attack/SKILL.md.bak` — preserved 5-agent version
- `chester-util-codereview/SKILL.md.bak` — preserved 3-agent version

**Evaluation artifacts (untracked):**
- `chester-util-codereview-workspace/` — all benchmark data, grading, analysis
- `chester-plan-attack-temp/` — temporary lightweight attack skill used for testing

## Commits

1. `b6808a8` — feat: add lightweight chester-util-codereview skill
2. `5853c56` — chore: add chester-util-codereview to setup skill registry
3. `a391f67` — feat: rewrite chester-plan-smell as lightweight single-pass review
4. `c0d0b1b` — feat: rewrite chester-plan-attack as lightweight single-pass review

Plus merge commits for the two worktree branches.

## Known Remaining Items

- **Plan-attack tested only against stale plans.** The lightweight version has not been stress-tested against a live, complex plan where execution risk, concurrency, and contract tracing angles would differentiate from structural integrity checks. The .bak file is preserved for this reason.
- **Untracked cleanup needed.** `chester-plan-attack-temp/`, `chester-util-codereview/SKILL.md.bak`, and `chester-util-codereview-workspace/` can be deleted.

## Handoff Notes

All three review skills now follow the same pattern: identify scope/plan → single-pass review across complementary dimensions → evidence-backed findings → brief assessment. No multi-agent overhead, no Structured Thinking MCP dependency.

The key architectural insight from this session: Claude's built-in code review ability is already strong. The skill's value is in *scoping* and *dimension guidance* (what to look for), not in *methodology enforcement* (how many agents, what taxonomy). The multi-agent approach produced structured output at 2-3x cost but did not find better issues.

If plan-attack's lightweight version misses critical findings on a future live plan, restore from SKILL.md.bak and re-evaluate.
