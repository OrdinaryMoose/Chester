# Plan Hardening Threat Report — extract-review-launchpad

**Plan:** `docs/chester/working/20260417-02-extract-review-launchpad/plan/20260417-02-extract-review-launchpad-plan-00.md`

**Combined implementation risk: Moderate**

## Summary

The plan is structurally sound and faithful to the spec. Verification diffs were empirically tested during hardening and produce the expected exit-0 / no-output outcomes. Source line ranges verify against the actual lens files. One HIGH defect (wrong cache path in Task 5) and two cheap MEDIUM improvements (typography normalization, heading-anchor verification) are worth fixing before implementation. The remaining MEDIUMs and LOWs are informational or mitigated by existing verification gates. The smell report's Finding #1 (content duplication with prose-only sync discipline) is an inherent architectural trade-off accepted by the spec (constraints #5–#6) and is not fixable at plan level.

## Findings by Lens

### plan-attack

| Sev | Finding | File / Task | Cost to fix |
|---|---|---|---|
| HIGH | Task 5 Step 2 checks `/home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/plan-build/` — not where `/refresh-chester` actually writes. Correct path is `/home/mike/.claude/plugins/cache/ordinarymoose/chester/1.0.0/skills/plan-build/`. Inode comparison confirmed the two paths are independent files. | Plan Task 5 Step 2 | 30s — one path substitution |
| MEDIUM | Prerequisites say "pause and confirm" if on non-worktree main but don't specify what to do. Current state: main, no worktree. | Plan Prerequisites | Add decision: proceed-on-main or abort-and-create-worktree |
| MEDIUM | Task 3 Step 3 paste block uses en-dash `3–5`; current SKILL.md line 184 uses hyphen `3-5`. Plan says "preserve whichever is present" but provides a block that mutates. | Plan Task 3 Step 3 | 30s — change en-dash → hyphen in the paste block |
| MEDIUM | Task 4 Step 2 regression grep strips `@@` hunk headers, making "review visually" harder. | Plan Task 4 Step 2 | Add `-E "^[-+@]"` to preserve hunk context |
| LOW | Task 1 Step 4 uses `head -n 100` on left side of one diff; asymmetric vs. right side and Task 2. | Plan Task 1 Step 4 | Remove the head cap — not load-bearing today |
| LOW | Sync-discipline reminder placement differs from plan-reviewer.md; cold-read does not verify presence. | Plan Task 1 Step 5 / Task 2 Step 4 | Add "sync reminder is present" to cold-read checklist |
| LOW | Literal-commit-subject assertion in Task 5 Step 4 is fragile if hooks rewrite messages. | Plan Task 5 Step 4 | Loosen to substring match or accept fragility |
| Observation | "Only the first three steps change" framing undersells the typed-agent-warning promotion from nested bullet to full step. | Plan Task 3 intro | No action — accurate, just imprecise |

### plan-smell

| Sev | Finding | Note |
|---|---|---|
| Medium–High | Content duplication across three files (lens SKILL.md + dispatch template) with only prose sync reminder as backstop | **Architectural — inherent to chosen design.** Spec constraints #5–#6 explicitly accept this. Not a plan defect. |
| Medium | Verification diffs hardcode lens line numbers; future edits above the ranges will silently misalign extraction | Mirror the heading-anchor approach already used on dispatch side: `sed -n '/^## What to Check$/,/^## Evidence Standard$/p'` for source extraction too |
| Low | Three deferrals (Phase B, rewrite_required, ground-truth unification) openly flagged with trigger conditions | Healthy pattern, not calcification — noted |
| Low | Asymmetry with plan-reviewer.md is locked in (no sync reminder there, present on new files) | Intentional divergence per spec; not penalized |
| Low | Orchestration logic (synthesis, human gate, threat report write) still inline in plan-build/SKILL.md | Informational — would need its own extraction sprint |
| Low | Error-path coverage when a hardening subagent fails is implicit | Pre-existing gap; refactor preserves it |

## Verified Assumptions

All high-confidence claims the plan makes about the codebase verified TRUE:
- `plan-attack/SKILL.md:38-76, 80-88, 92-101` — body regions are exact.
- `plan-smell/SKILL.md:58-87, 91-97, 101-107` — body regions are exact.
- `plan-build/SKILL.md` Plan Hardening section at lines 169-187.
- `plan-reviewer.md` structure as the template model.
- `/refresh-chester` exists as a user-scoped slash command at `/home/mike/.claude/commands/refresh-chester.md`.
- Verification diffs produce exit-0 when run against the literal content the plan proposes writing; mutating one bullet produces a diff mismatch.

## Recommended Mitigations (directed)

Before execution, apply these three changes to the plan:

1. **Fix Task 5 Step 2 path** — change `/home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/plan-build/` to `/home/mike/.claude/plugins/cache/ordinarymoose/chester/1.0.0/skills/plan-build/`.
2. **Normalize Task 3 Step 3 paste block typography** — change `3–5` (en-dash) to `3-5` (hyphen) to match current SKILL.md line 184.
3. **Use heading anchors for source-side verification diffs** — replace `sed -n '38,76p' "$SRC"` with `sed -n '/^## What to Check$/,/^## Evidence Standard$/p' "$SRC" | sed '1d;$d;/^$/d'` (and analogous for the other regions). Eliminates the line-number brittleness flagged by smell Finding #2.

These three fixes address the HIGH and the two highest-value MEDIUMs. The remaining MEDIUMs ("pause and confirm" ambiguity, grep strips hunk headers) are lower value and can be resolved inline at implementation time or accepted as-is.

## Human Decision

Four options:
1. **Proceed** — execute the plan as written (accept the HIGH and all MEDIUMs)
2. **Proceed with directed mitigations** — apply the three recommended fixes above, then execute
3. **Return to design with additional requirements** — not recommended; findings do not indicate a design flaw
4. **Stop** — abandon the refactor
