# Plan Threat Report: Fix Master-Mode Cascade Archive Drift

**Sprint:** 20260513-01-fix-archive-drift
**Plan:** `plan/fix-archive-drift-plan-00.md`
**Reviewed:** 2026-05-13

## Smell Pre-Check

Smell heuristic scanned the plan against all five categories (DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, new contract surfaces). **Zero triggers matched** — the plan is bash + markdown, with no DI containers, async/await, persistence layers, or DTO/record types.

**Smell skipped — heuristic matched zero triggers. Plan-attack was sufficient for hardening this sprint.**

## Plan-Attack Findings

### CRITICAL — CONFLICT relpath extraction broke on filenames with spaces *(FIXED)*

- **What:** The original plan emitted `CONFLICT <relpath> <wh> <ph>` and extracted relpath via `awk '{print $2}'`. For filenames containing spaces, awk's field-split would truncate the path at the first space.
- **Why it was load-bearing:** The active master plan's `design-documents/ADR/` directory contains 14 of 19 files with spaces in their names (e.g., `0001-three-layer-hexagonal-separation copy.md`). Under `set -euo pipefail`, the subsequent `cp` on a truncated path would fail and abort the archive flow — accept-plans would never complete for the most common conflict shape this gate exists to handle.
- **Why the test didn't catch it:** All eight test scenarios used filenames without spaces.
- **Fix applied:** CONFLICT line format changed to `CONFLICT <wh> <ph> <relpath>` (relpath last); accept-plans and accept-working handlers parse via `read -r _ _ _ relpath <<< "$line"` which gives the final variable the rest of the line including embedded whitespace. A new test scenario 4b was added that constructs a file named `file with spaces.md` and asserts both the emit format and a round-trip parse.

### HIGH — `skills/setup-start/references/skill-index.md:36` not updated *(FIXED)*

- **What:** Task 2 changes the `description:` frontmatter of `finish-archive-artifacts/SKILL.md`. Root `CLAUDE.md` mandates that any skill description change be mirrored in the setup-start skill index. The original plan did not touch the index.
- **Impact:** After the plan executes, the index would describe `finish-archive-artifacts` as the v0002 behavior with no mention of the divergence gate — a user reading the index to decide whether the gate applies under Master Plan Mode would get no signal.
- **Fix applied:** Task 3 gained Step 5 (skill-index sync) and Step 7's commit now stages `skills/setup-start/references/skill-index.md` alongside `docs/chester/CLAUDE.md`. The commit message documents the index sync.

### MEDIUM — `IFS=', '` produces comma-only join, not comma-space *(FIXED)*

- **What:** Bash's `"${array[*]}"` expansion uses only the first character of `IFS` as the separator. The original `IFS=', '` would emit `file1,file2` instead of `file1, file2` in commit-body audit lines.
- **Impact:** Cosmetic only — AC-1.3 quotes the trailer-string format without specifying separator format, so this wouldn't fail any AC. But multi-file commit-body audit records would be harder to read.
- **Fix applied:** All three COMMIT_TRAILER constructions now build the file list via `joined=$(printf '%s, ' "${array[@]}"); joined="${joined%, }"` — produces a true comma-space-separated list with trailing separator stripped.

### LOW — Task 2 "Must remain green" lacked explicit ordering hint *(FIXED)*

- **What:** Task 2's regression assertion references `tests/test-cascade-archive-divergence.sh`, which is created in Task 1.
- **Why it's low risk:** `execute-write` Section 2's sequential dispatch enforces Task 1 → Task 2 → Task 3 ordering by design. A standalone invocation of just Task 2 would fail the assertion, but that's not a normal execution path.
- **Fix applied:** No structural change needed; the implicit ordering via task numbering plus execute-write's sequential gate is sufficient. The plan reviewer also explicitly verified this.

### LOW — Task 3 Step 1 line-number references were stale *(FIXED)*

- **What:** Original plan said `plans/` bullet at line 10, "Transfer Flow" at line 24, "One-way flow" at line 42. Actual lines were 8, 28, 51.
- **Impact:** Friction at implementation — `cat | grep` text matching would still find the targets, but the "confirm at line X" instruction would not match and the implementer would lose confidence in other plan assertions.
- **Fix applied:** Task 3 Step 1 now instructs text-based search rather than line-number confirmation. Line numbers were removed entirely (they would have drifted anyway as future edits land).

### VERIFIED FALSE — Scenario 7 / 8 PATH portability

The plan-attacker initially flagged Scenario 7 (PATH isolation for the "no hash tool" fallback) as a portability risk, then verified it as a non-finding: `env -i` correctly uses the test runner's outer PATH to locate `bash` before constructing the child environment. Scenario 8's bash symlink uses `command -v bash` which resolves correctly on both Linux and macOS. Both scenarios are portable as written.

## Combined Implementation Risk

**Risk level: Moderate.**

Reasoning:

1. The CRITICAL finding was real and would have shipped — accept-plans broken on the exact filenames cascade docs use in production today. Fix is structural (line format change), well-isolated to two parse sites, and now tested with scenario 4b.
2. The HIGH finding (skill-index sync) is a contract gap with the repo's own discipline. Fix is one additional file in Task 3's commit; mechanical change.
3. The MEDIUM IFS bug is cosmetic but the new `printf %s,` + strip-trailing pattern is bash-idiomatic and the kind of thing future readers will recognize.
4. With all fixes applied, the plan has no remaining HIGH or CRITICAL gaps. Residual risk concentrates in the **operator-prompt logic in finish-archive-artifacts/SKILL.md** — the test does not exercise the interactive halt, the named choices, or the COMMIT_TRAILER construction. These are integration-tested only by the next sub-sprint that produces real cascade divergence. The SKILL.md instructions are detailed enough that an agent executing them should produce correct behavior on first run, but there is no automated safety net.
5. The plan is otherwise tight: every AC traces to a task, TDD shape is preserved, file paths and content are concrete, and the hardening pass demonstrated the review machinery works (one CRITICAL bug surfaced and fixed cleanly).

The Moderate rating reflects the integration-time exposure of the interactive prompt logic, not residual structural risk in the plan itself.

## Human Decision (auto-applied per session directive)

Per the session-opening directive (user gates auto-approved): **proceed**.

If running interactively, the four options are:
- **proceed** — implement as written *(chosen)*
- **proceed with directed mitigations** — implement with additional safeguards specified at this gate
- **return to design** — surface unresolved questions back to design-specify
- **stop** — halt and reconsider scope

## Triggers Matched

Smell heuristic: **none** (zero matches across DI registrations, new abstractions, async/concurrency, persistence pathways, contract surfaces).

<!-- created-at: 2026-05-13T11:36:46Z -->
<!-- produced-by plan-build@v0004 -->
