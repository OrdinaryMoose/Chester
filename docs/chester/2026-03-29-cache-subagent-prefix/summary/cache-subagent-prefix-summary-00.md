# Session Summary: Cache-Optimal Subagent Prompt Restructuring

**Date:** 2026-03-29
**Session type:** Full pipeline — design through implementation
**Plan:** `cache-subagent-prefix-plan-00.md`

---

## Goal

Restructure all Chester subagent prompts so shared content (plan text or task text) forms a byte-identical prefix at the start of each prompt, maximizing Anthropic prompt cache hit rates across the 46 subagent invocations in the pipeline. This was the Tier 1 optimization identified in the AER research paper — highest ROI, no quality tradeoff.

## What Was Completed

### Design Decisions (chester-figure-out)

Socratic interview resolved six design decisions:

1. **Remove role descriptions** from all subagent prompts — frontier models respond to specific task instructions, not persona framing. Triple benefit: smaller prompts, better cache prefix matching, no quality loss.
2. **Shared content first** — plan/task text as the literal first bytes of every subagent prompt, before any agent-specific instructions.
3. **Cross-skill prefix sharing (Option A)** — attack-plan (6 agents) and smell-code (4 agents) use byte-identical plan text preamble. One cache write serves all 10 agents.
4. **Same pattern for write-code** — per-task agents put task text first.
5. **Build-plan/build-spec reviewers unchanged** — file-path style, low call count.
6. **Post-session cache analysis** — added as an option in chester-finish-plan to parse session JSONL for cache hit rates.

### Implementation (chester-write-code, subagent-driven)

Five tasks executed across 4 subagent dispatches plus inline fixes:

| Task | Files | Change |
|------|-------|--------|
| 1. Attack-plan prompts | `chester-attack-plan/SKILL.md` | 6 agent prompts restructured: plan text first, roles removed, directive instructions after `---` delimiter |
| 2. Smell-code prompts | `chester-smell-code/SKILL.md` | 4 agent prompts restructured: byte-identical plan prefix to attack-plan |
| 3. Write-code templates | `implementer.md`, `spec-reviewer.md`, `code-reviewer.md` | Task/plan text first, roles removed |
| 4. Finish-plan cache analysis | `chester-finish-plan/SKILL.md` | Cache analysis option added to Step 7; stale doc-sync references cleaned up |
| 5. Verification pass | All modified files | Grep-based checks: no roles remain, prefix byte-identical across skills, delimiters present |

### Plan Hardening

Attack-plan and smell-code reviews ran in parallel. Combined risk: **Low**.

- One Serious finding: internal contradiction about quality-reviewer.md (listed as Modify but Step 4 said "no changes expected") — fixed in plan before implementation.
- One Minor finding: code-reviewer.md line range off by one — noted.
- Cross-skill coupling acknowledged as accepted design tradeoff.

## Files Changed

| File | Change |
|------|--------|
| `chester-attack-plan/SKILL.md` | 6 prompts restructured (27 insertions, 30 deletions) |
| `chester-smell-code/SKILL.md` | 4 prompts restructured (19 insertions, 19 deletions) |
| `chester-write-code/implementer.md` | Task text first, role removed |
| `chester-write-code/spec-reviewer.md` | Task text first, role removed |
| `chester-write-code/code-reviewer.md` | Plan/requirements first, role removed, redundant task list removed |
| `chester-finish-plan/SKILL.md` | Cache analysis option 3 added, doc-sync references removed |
| `docs/chester/2026-03-29-cache-subagent-prefix/design/` | Design brief + thinking summary |
| `docs/chester/2026-03-29-cache-subagent-prefix/spec/` | Formal specification |
| `docs/chester/2026-03-29-cache-subagent-prefix/plan/` | Implementation plan |

## Handoff Notes

- **Cache verification not yet run.** The cache analysis option in finish-plan exists but hasn't been exercised. The next full pipeline run on a real project will be the first test of actual cache hit rates.
- **quality-reviewer.md was not modified.** It's a thin wrapper referencing code-reviewer.md — the wrapper's variable mapping is unchanged, only code-reviewer.md's internal structure changed.
- **Stash conflict during merge.** Main had uncommitted changes (doc-sync deletions, other skill edits) that conflicted with the worktree's version of finish-plan. Resolved by restoring from the merge commit. The uncommitted changes on main are still staged and pending a future commit.
- **Planning directory cleanup pending.** Permission was denied for `rm -rf docs/chester-planning/2026-03-29-cache-subagent-prefix/`. Clean up manually.
