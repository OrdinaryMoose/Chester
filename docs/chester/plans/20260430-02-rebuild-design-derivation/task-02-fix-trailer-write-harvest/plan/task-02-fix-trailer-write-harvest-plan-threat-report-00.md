# Plan Threat Report: task-02-fix-trailer-write-harvest

**Plan reviewed:** `task-02-fix-trailer-write-harvest-plan-00.md`
**Date:** 2026-05-04
**Reviews dispatched:** plan-attack (unconditional) + plan-smell (triggered on `Task.` — verified false positive matching English "task." in plan prose; ran per skill's over-firing bias)

## Combined Risk Level: Moderate

Reasons:

1. One HIGH finding identified by both reviewers independently — the original plan's Task 3 Step 4 carried a `git -C "$(git rev-parse --show-toplevel)/.."` invocation with `2>/dev/null || git add ...` fallback that would silently commit the master-plan sync to the task-02 branch instead of main. Mechanical implementer following the literal command would corrupt the living-document sync pattern.
2. The HIGH finding was fixable in plan: replaced the broken command with explicit absolute-path `git -C "/home/mike/Documents/CodeProjects/Chester"` invocations plus verification commands that confirm the commit landed on main and not on the task-02 branch.
3. Two MEDIUM findings (Task 1 `|| :` placement prose ambiguity; Task 2 insertion-point prose ambiguity) were prose-clarity nits; both fixed inline by tightening the wording so insertion sites and quote-nesting are unambiguous.
4. Plan-smell found no structural smells. The `Task.` trigger was a false positive matching English "task." in the plan body, confirmed by reviewer reading. The plan is bash-only with no DI, async, persistence, or new contract surfaces.
5. Remaining LOW findings are design-acknowledged trade-offs (audit comments untested per confidence-bias rule; AC-1.1 cases 2/3 not in test — outside Task 1's decision budget by design) or implementer-confidence notes (test logic verified correct; L179 line ref verified correct).

## Pre-Check Triggers Matched

`Task.` — case-insensitive match against English "task." in plan prose (e.g. "task-by-task," "Section 2 (subagent-driven) — uses task..."). False positive: the trigger pattern is designed to match C# `Task.Run`, `Task.Delay`, etc. The plan is bash-only and introduces no async work. plan-smell ran per skill's over-firing bias and reported no structural smells.

## Plan-Attack Findings

| ID | Severity | Status | Summary |
|----|----------|--------|---------|
| 1 | MEDIUM | FIXED | Task 1 Step 3 prose ambiguous about `|| :` placement (two `)"` sequences in the line). Fix: clarified that `|| :` goes INSIDE the `$(...)` substitution. |
| 2 | LOW | NO ACTION | Task 2 line numbering — confirmed stable (Task 1 is single-line in-place; line numbers don't shift). No real issue. |
| 3 | LOW | FIXED | Task 2 Step 1 prose contradicted itself ("Insert at line 80" vs "after the fallback line"). Fix: clarified that the comment is a NEW line inserted between existing lines 80 and 81. |
| 4 | **HIGH** | **FIXED** | Task 3 Step 4 `git -C "$(...)/..."` fallback would silently commit to wrong branch. Fix: replaced with explicit absolute-path `git -C "/home/mike/Documents/CodeProjects/Chester"` plus verification commands. |
| 5 | MEDIUM | FIXED (via #4) | Task 3 had no concrete `cd main checkout` command. Fix: same as #4 — added absolute-path invocations and verification steps. |
| 6 | LOW | NO ACTION | Task 4 plans/ vs working/ paths could confuse implementer. Plan already specifies working/ in Step 2 unambiguously; not a real risk. |
| 7 | n/a | (no finding) | L178 reference verified correct in plan. |
| 8 | n/a | (no finding) | Test logic verified correct. |
| 9 | LOW | DEFERRED | Spec gap — AC-1.1 lists three cases, test covers case 1 only. Outside Task 1's decision budget (1) by design; case 1 covers the abort-prevention which is the actual fix. Cases 2 and 3 are observable boundaries the spec promises but does not require new test code for. Acceptable. |

## Plan-Smell Findings

| ID | Severity | Status | Summary |
|----|----------|--------|---------|
| 1 | LOW | NO ACTION | Test assertion 3 (dedup check) implicit assumption about output format. Stable today; flagged for awareness. |
| 2 | MEDIUM | FIXED (via plan-attack #4) | Same Task 3 Step 4 issue as plan-attack #4. Independent flag from a different angle confirms the severity. |
| 3 | LOW | NO ACTION | Audit comments untested. Design-acknowledged trade-off per confidence-bias rule (spec Testing Strategy explicitly opts out of testing documented-safe sites). |

## Risk Assessment Summary

The plan is now structurally sound for execution. The one HIGH-severity hazard (Task 3 Step 4's broken `git -C` fallback) was caught by both reviewers independently and fixed in-plan with absolute-path invocations and explicit verification commands that detect a wrong-branch commit before it propagates. The two prose-ambiguity nits are tightened. Remaining LOW findings are either design-acknowledged or implementer-confidence notes.

The plan is ready for execute-write under subagent execution mode (per the heuristic: 4 tasks > 3, multi-file Task 1, both fail conditions for inline downgrade).

<!-- created-at: 2026-05-04T10:42:07Z -->
<!-- produced-by plan-build@v0004 -->
