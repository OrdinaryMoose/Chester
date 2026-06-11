# Session Summary: Compact design-committee Skill Runtime Context

**Date:** 2026-06-11
**Session type:** Full implementation (subagent-driven execution of a hardened plan)
**Plan:** `20260611-01-compact-committee-skill-plan-01.md`

## Goal

Reduce the per-invocation runtime context cost of the `design-committee` skill by collapsing genuine concept restatements — places where the same rule or policy is stated in full at more than one site — down to a single authoritative owner site plus one-line cites elsewhere. The hard constraint was zero behavioral-contract change: only restatements collapse; any site adding application-scoped nuance (a boundary clause) is preserved in place.

## What Was Completed

All nine plan tasks executed in subagent mode (fresh implementer per task, independent spec review per task, full-range code review at the end). Eight content/version commits plus one empty verification commit, all on branch `20260611-01-compact-committee-skill`.

### Collapses landed

| Task | Site | Action |
|------|------|--------|
| T1 | SKILL.md §Six Members | Four advocacy lens lines → roster-only; lens owned by `agents/design-committee-*.md` |
| T2 | SKILL.md §Integration "Calls" | Doubled ephemeral-off-roster parentheticals → cite of §Consolidator / §Scribe |
| T3 | SKILL.md §Integration "Does NOT call" | Standalone/start-bootstrap restatement → cite of §Standalone Invocability |
| T4 | SKILL.md §Translation Gate | Four rule bullets → one naming line; LOAD-BEARING util cite kept |
| T5 | team-lead.md §Voice + Site B2 | Six-bullet rule list → one util cite; deleted 3 Site-B2 restatement bullets, KEPT C1/C2 markers (colon not stranded); "Apply silently" preserved |
| T6 | team-lead.md §Behavioral Constraints | "Count is not a warrant" duplicate → cite of §Authority Guard |
| T7 | SKILL.md Phase 4 step 7 | Output-surface restatement trimmed → cite of team-lead §Output Surfaces |
| T8 | SKILL.md, team-lead.md | Version bumps |
| T9 | (verification) | Cite-graph + nuance-survival check; byte-delta record |

### Preserved nuances (boundary-classified, NOT collapsed)

`Apply silently`, `Strict premise scope` (its own owner — absent from §Authority Guard), §Per-Round-Flow steps 6/7 (disk-write instructions with embedded field schema), §Self-Evaluation imperative checks, C1/C2 pre-send markers, standalone degrade-to-no-op rule.

### Scoped out (per plan)

Per-Round-Flow dedup deferred (high blast radius against frozen round-format file); `committee-analysis-round-format.md` frozen by designer decision (b) — anaphor-stranding risk; §Standalone Invocability kept as owner (inverts brief D2 to preserve the no-degrade nuance in place).

## Verification Results

| Check | Result |
|-------|--------|
| Per-task spec review (9 tasks) | 9/9 Pass |
| Full-range code review (dc693d8..5d1a97b) | Verdict: Yes — zero blocking issues |
| Cite-graph resolution (AC-2) | All introduced cites resolve at HEAD |
| Preserved-nuance survival | All 7 protected nuances present at HEAD |
| Bash test suite | 31 pass / 0 fail (after version-pin fix) |
| Byte delta (AC-5) | 81,579 → 80,043 = **−1,536 (−1.88%)** |
| Frozen-file integrity | round-format / member-protocol / util-design-partner-role absent from range diff |

The −1.88% lands inside the honest ~1.7–2% target. The brief's original AC-5 named ~25%, unreachable by dedup alone (most of the 81 KB is unique load-bearing content); the designer accepted the corrected target as option (a) at plan time.

## Known Remaining Items

- **Deferred (recorded):** §Voice cite adjacency in team-lead.md — after T5, lines 28 and 30 both name the util path and "read in full." Non-blocking (code reviewer: "reads correctly and strands nothing"). See `plan/20260611-01-compact-committee-skill-deferred-00.md`. Natural pairing with the already-deferred "Fuller Translation-Gate merge."
- **Deferred (plan Scoped Out):** Per-Round-Flow 3× restatement dedup — needs a contract-aware follow-up sprint that can touch the frozen round-format narrative.
- **Test-design note (not actioned):** `test-member-warrant.sh` pins the exact `team-lead.md` version string; any future bump re-breaks it. A presence/well-formedness assertion would be bump-resilient. Out of scope this sprint.

## Files Changed

**Skill files (worktree):**
- Modify `skills/design-committee/SKILL.md` — Tasks 1–4, 7, 8. v0021 → v0022. 16,551 → 15,483 B (−1,068).
- Modify `skills/design-committee/references/team-lead.md` — Tasks 5, 6, 8. v0011 → v0012. 31,270 → 30,802 B (−468).

**Test (unplanned fix):**
- Modify `tests/test-member-warrant.sh` — version-pin v0011 → v0012 (line 45), label updated. Caused by the T8 AC-4 bump.

**Artifacts (working dir):**
- Create `plan/20260611-01-compact-committee-skill-deferred-00.md` (stamped execute-write@v0008)
- Create `summary/20260611-01-compact-committee-skill-summary-00.md` (this file)
- Create `summary/20260611-01-compact-committee-skill-audit-00.md`

## Commits

```
2f193ea docs: reduce SKILL.md §Six Members to roster-only; lens owned by agent files
33512f7 docs: collapse Integration ephemeral restatement to cite of §Consolidator/§Scribe
9eaf967 docs: collapse standalone/no-sprint restatement in SKILL.md to §Standalone Invocability owner
e200fc7 docs: collapse §Translation Gate rule bullets in SKILL.md — cite util-design-partner-role only
49b7ca7 docs: collapse team-lead.md Translation Gate duplicates (§Voice list + Site B2); preserve Apply-silently boundary
2f2d09a docs: collapse §Behavioral Constraints count-not-a-warrant duplicate to §Authority Guard cite
1f97235 docs: collapse output-surface restatement in SKILL.md step 7 to team-lead §Output Surfaces cite
c640e17 chore: version-bump SKILL.md v0022, team-lead.md v0012 after compaction pass
5d1a97b docs: cite-graph + nuance-survival verification — byte delta -1536b (1.88%)
9fa20be fix: track team-lead.md v0012 in member-warrant version-pin test
52abc2d checkpoint: execution complete
```

## Handoff Notes

- Execution is complete and verified; next steps are `finish-archive-artifacts` then `finish-close-worktree`.
- The branch carries 11 commits over baseline `dc693d8`; HEAD is `52abc2d`.
- This sprint re-grounded against v0021 (sprint -02 had merged after plan-00 was written, growing SKILL.md). Any future compaction follow-up should re-measure the baseline again rather than trusting plan-00's 80,249 figure.
- The dedup pattern used here — single authoritative owner + one-line cite, with explicit restatement-vs-boundary classification per site — is now demonstrated across SKILL.md and team-lead.md and is the template for the deferred Per-Round-Flow and Translation-Gate-merge passes.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-committee@v0021 -->
<!-- produced-by plan-build@v0006 -->
<!-- produced-by execute-write@v0008 -->
<!-- produced-by finish-write-records@v0004 -->
