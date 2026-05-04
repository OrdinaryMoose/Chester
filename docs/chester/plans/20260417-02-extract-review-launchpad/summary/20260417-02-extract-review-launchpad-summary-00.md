# Extract Review Launchpad — Session Summary

**Sprint:** `20260417-02-extract-review-launchpad`
**Status:** Parked before execution. Spec and plan complete + hardened; no code committed on the refactor branch. Revisit after throughput-optimization patterns settle.
**Dates:** started 2026-04-17, parked 2026-04-18.
**Worktree:** `.worktrees/20260417-02-extract-review-launchpad` on branch `20260417-02-extract-review-launchpad`, based on `41c48fc` then reset to `b74c08a`.

---

## Sprint Intent (Original)

Extract subagent dispatch boilerplate from `plan-build`'s Plan Hardening section into dedicated templates (`plan-attack-dispatch.md`, `plan-smell-dispatch.md`), mirroring existing `plan-reviewer.md` pattern. Three lenses (fidelity, attack, smell) stay distinct. Only the mechanism by which plan-build launches attack and smell changes — read-a-template + substitute-placeholder replaces read-SKILL.md + embed-full-instructions.

Design brief produced inline (no disk artifact from design-figure-out — this sprint ran specify-first from conversation). Three competing architectures were explored via feature-dev:code-architect subagents (minimal / clean / pragmatic). Pragmatic chosen: two dispatch templates, no registry doc, no `## Role` cross-references in the lens SKILL.md files.

## Artifacts Produced

| Artifact | Path | State |
|---|---|---|
| Spec v00 | `spec/20260417-02-extract-review-launchpad-spec-00.md` | Superseded; fidelity-approved with advisory recs applied in place |
| Spec v01 | `spec/20260417-02-extract-review-launchpad-spec-01.md` | Superseded; fixed v00's HIGH/MEDIUM from ground-truth review |
| Spec v02 | `spec/20260417-02-extract-review-launchpad-spec-02.md` | Final; fixed v01's MEDIUM (asymmetric line-range convention) |
| Plan v00 | `plan/20260417-02-extract-review-launchpad-plan-00.md` | Final; fidelity-approved, hardened, three directed mitigations applied |
| Threat report | `plan/20260417-02-extract-review-launchpad-plan-threat-report-00.md` | Final; combined risk = Moderate |

All artifacts live in `docs/chester/working/20260417-02-extract-review-launchpad/` (gitignored). No commits on the refactor branch.

## Review Gates Passed

- **Spec fidelity review (v00):** Approved with advisory recommendations.
- **Spec ground-truth review (v00):** 2 HIGH + 2 MEDIUM + 2 LOW — HIGH/MEDIUM fixed in v01.
- **Spec ground-truth review (v01):** v00 HIGH/MEDIUM confirmed fixed; 1 new MEDIUM (line-range convention) + 2 LOW — MEDIUM fixed in v02.
- **User review gate:** spec v02 approved.
- **Plan fidelity review:** Approved with one advisory applied (pre-refactor SHA capture for regression diff).
- **Plan hardening (attack):** 1 HIGH (wrong cache path), 3 MEDIUM, 3 LOW + observation. HIGH and top MEDIUMs applied as directed mitigations.
- **Plan hardening (smell):** 1 Medium-High (content duplication — architectural, spec-accepted), 1 MEDIUM (line-number contracts), 4 LOW.
- **User mitigation decision:** proceed with directed mitigations (option 2). Three fixes applied: cache path corrected to `/home/mike/.claude/plugins/cache/ordinarymoose/chester/1.0.0/`, typography normalized to hyphen, verification diffs converted to heading anchors on both source and dispatch sides.

Execution paused at Task 1 dispatch gate after worktree was created but before any implementer subagent ran.

---

## What Changed in Chester Between Start and Now

While this sprint was paused, the `20260417-03-optimize-chester-throughput` sprint merged to main (merge commit `b74c08a`). That sprint substantially restructured the two files this refactor targets.

### `skills/plan-build/SKILL.md` — three structural additions

1. **Smell Heuristic Pre-Check** (new section, lines 169-209). Case-insensitive keyword match on plan text. Five trigger categories: DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, new contract surfaces. If any match, plan-smell fires in parallel with plan-attack; otherwise plan-attack runs alone. Drives the conditional from the 18-sprint retrospective at `docs/plan-hardening-effectiveness.md` — smell's value is concentrated in sprints introducing composition, lifetimes, or persistence; on mechanical refactors it produces mostly polish.
2. **Ground-Truth Report Cascade** (new section, lines 213-254). When plan-build runs after `design-experimental`, reads the design-stage ground-truth report from `design/*-ground-truth-report-*.md`, extracts verified anchors (file paths, type names, method names), passes them as a skip-list to plan-attack. Lets plan-attack skip re-verification of anchors the ground-truth subagent already confirmed at design time. Explicit error-path handling: empty skip-list is passed (not omitted) when the report ran but produced no verified anchors.
3. **Plan Hardening** (moved to lines 258-286, restructured). Step 2 now conditionally dispatches smell based on the heuristic result, and includes skip-list plus trust-boundary instruction in the plan-attack prompt. Synthesis, human gate, threat-report write — unchanged.

### `skills/plan-attack/SKILL.md` — Trust Input section added

New `## Trust Input (Optional)` section at lines 78-97, between Step 2 and Evidence Standard. Documents how the subagent should consume the verified-anchor skip-list: trusted anchors are not re-verified *unless the plan modifies them*; anchors the plan creates/renames/refactors/deletes are re-verified; anchors outside the skip-list are re-verified as usual. Pushes Evidence Standard from original lines 78-88 to 101-109, and Output from 90-101 to 113-122. Step 2 body (38-76) unchanged.

### `skills/plan-smell/SKILL.md` — unchanged

All line ranges this sprint's spec cited remain valid (58-87, 91-97, 101-107).

### Other adjacent changes

- New doc `docs/plan-hardening-effectiveness.md` — 18-sprint retrospective driving the smell-heuristic thresholds.
- Commit history: `d0c0a1c` (smell heuristic + ground-truth cascade), `e9f770d` (docs update for plan-attack skip-list), `f44ca4e`, `e0d7762`, `b74c08a` (merge).

---

## Impact on This Design

The refactor's core value proposition — remove read-and-embed dispatch boilerplate — still holds. The new Plan Hardening section continues to use `read the skill files` + `embed the full skill instructions`. Dispatch templates would still eliminate that pattern.

Three specific drifts break the current artifacts:

1. **Line ranges in the spec are stale for plan-attack.** Evidence Standard moved to 101-109 (was 80-88), Output moved to 113-122 (was 92-101). The spec's heading-anchor fallback introduced in v02 makes verification robust under drift — but the spec's explicit line-number citations still need updating before any implementer pastes them.
2. **Plan's Task 3 rewrite deletes the throughput sprint's work.** Plan Task 3 replaces lines 169-187 with a simplified Plan Hardening. In the new state, lines 169-209 are the Smell Heuristic Pre-Check and the real Plan Hardening is at 258-286. Executing Task 3 as written would regress the conditional-smell and skip-list logic. Unacceptable.
3. **Dispatch templates need to carry the Trust Input section.** plan-attack-dispatch.md must include Trust Input (lines 78-97) as a fourth verbatim region. Otherwise the dispatched subagent won't know what to do with the skip-list plan-build sends.

Beyond mechanical fixes, two design questions became sharper after the merge:

- **Scope drift:** original spec treated ground-truth-reviewer unification as "premature; two instances of a pattern don't justify abstraction." Post-merge, ground-truth is live infrastructure feeding plan-build. Argument for revisiting unification has strengthened, though still out of scope for this sprint.
- **Value proposition question:** the 20260417-03 sprint addressed real observed pain (heuristic-driven smell skipping saves dispatches on non-triggering sprints; skip-list narrows attack scope). This refactor addresses boilerplate the user didn't complain about. If plan-build keeps accreting sections at the pace of the last sprint, dispatch templates don't prevent the growth — they just trim one specific kind of inline prose.

---

## Current Design Assessment

**The pragmatic architecture chosen in spec v02 is still the right shape if the refactor proceeds** — two dispatch templates, no registry, lens SKILL.md untouched. Heading-anchor verification (applied in v02) already insulates the verification script from line-number drift in either file, so future lens edits won't silently misalign the verbatim-content check.

**What would change on a revisit:**

1. Spec would add a fourth verbatim region for `Trust Input (Optional)` — lines 78-97 of plan-attack — with its own sync-discipline treatment.
2. Plan's Task 3 rewrite would preserve the Smell Heuristic Pre-Check, Ground-Truth Report Cascade, and conditional dispatch in the new Plan Hardening. Net dispatch-mechanism change would be smaller than originally scoped: replace the "read skill files" + "embed full skill instructions" with "read dispatch templates, substitute `[PLAN_FILE_PATH]`, optionally include skip-list for attack, dispatch per heuristic result."
3. Non-goals list would either keep ground-truth unification deferred with refreshed rationale, or open the door to folding it into a broader `util-dispatch-templates` skill later.

**Recommendation for revisit timing:** wait 2-3 sprints after the throughput optimization lands. If plan-build grows another section at similar pace, the refactor is low-value relative to whatever accretion is actually hurting. If plan-build stabilizes at the current shape, the boilerplate removal becomes a worthwhile structural cleanup.

---

## Deferred Items for Future Consideration

- Content-duplication enforcement (smell finding #1): the Task 4 verification diffs from the paused plan could land as a committed pre-commit check or test — would turn the prose sync-discipline reminder into an enforced contract. Stand-alone sprint candidate.
- Ground-truth-reviewer and plan-attack-dispatch unification: the two files now describe overlapping review behavior; the Trust Input section is specifically a response to ground-truth infrastructure. A `util-dispatch-templates` skill or shared reviewer format could reduce the duplication identified by plan-smell #4 (asymmetry with plan-reviewer.md).
- Retroactive application to `plan-reviewer.md`: the bidirectional heading-anchor diff pattern introduced in plan v02 is strictly better than the original plan-reviewer.md dispatch approach — worth propagating in a future pass.
- Test drift in `tests/*.sh`: three tests (`test-budget-guard-skills.sh`, `test-start-cleanup.sh`, `test-write-code-guard.sh`) reference skill paths that no longer exist (`skills/finish/`, `chester-setup-start/`, `chester-execute-write/`). Unrelated to this sprint but surfaced during baseline check.

---

## Parked Artifacts

Everything in `docs/chester/working/20260417-02-extract-review-launchpad/` is preserved as-is. On revisit, start from this summary + spec v02 + plan v00. The three versions of the spec document the review-driven evolution and should remain available for audit. The plan's directed mitigations show the post-hardening refinements and are the correct starting point for any revision.

The refactor branch (`20260417-02-extract-review-launchpad`) has zero commits beyond its base. It can be discarded at close time; a future revisit can cut a fresh branch from whatever main is at that point.
