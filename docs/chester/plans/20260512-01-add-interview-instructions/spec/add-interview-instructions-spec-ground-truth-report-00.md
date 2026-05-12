# Ground-Truth Review — Add Interview Instructions Spec

**Sprint:** 20260512-01-add-interview-instructions
**Spec reviewed:** docs/chester/working/20260512-01-add-interview-instructions/spec/add-interview-instructions-spec-01.md
**Design brief for context:** docs/chester/working/20260512-01-add-interview-instructions/design/add-interview-instructions-design-00.md

## Summary

The spec is well-grounded in the codebase. File paths, env-var names, script structures, version values, and section headings all check out against the actual repo state. Two MEDIUM findings (skills-index file location, framing-block line range) were fixed inline in the spec. Four LOW findings remain — implementation hints carried forward to plan-build, not spec-blockers.

## Verified Claims

- `chester-util-config/chester-config-read.sh` currently emits four exports (`CHESTER_WORKING_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`, `CHESTER_MAIN_ROOT`) — CONFIRMED at `chester-config-read.sh:57-60`.
- The script has a `jq`-available vs `jq`-absent branching structure — CONFIRMED at `chester-config-read.sh:28-49`.
- Inside the `jq`-available branch, the if/elif structure selects between `$PROJECT_CONFIG` and `$USER_CONFIG` for directory keys — CONFIRMED at `chester-config-read.sh:29-43`.
- `USER_CONFIG="$HOME/.claude/settings.chester.json"` — CONFIRMED at `chester-config-read.sh:25`.
- The existing exports use single-quoted form `'$VAR'` — CONFIRMED at `chester-config-read.sh:57-60`.
- `bin/chester-config-read` and `bin/chester-trailer-write` follow a self-resolving wrapper pattern with `SCRIPT_DIR` and `CHESTER_ROOT` — CONFIRMED at `bin/chester-config-read:5-7` and `bin/chester-trailer-write:3-5`.
- `chester-trailer-write.sh` uses `set -euo pipefail` — CONFIRMED at `chester-trailer-write.sh:4`.
- `util-design-partner-role/SKILL.md` has a "Composition Note" section — CONFIRMED at `util-design-partner-role/SKILL.md:44`; current version is `v0001` — CONFIRMED at line 4.
- `start-bootstrap/SKILL.md` has a "What It Returns" section listing `CHESTER_WORKING_DIR` and `CHESTER_PLANS_DIR` — CONFIRMED at `start-bootstrap/SKILL.md:104-116`; current version is `v0001` — CONFIRMED at line 8.
- `design-large-task/SKILL.md` Phase 3 (Round One) begins at line 246; current version is `v0013` — CONFIRMED at line 4.
- `design-small-task/SKILL.md` has Phase 3 with a "Session Framing" block at lines 102-112; current version is `v0002` — CONFIRMED at line 4.
- `tests/` directory uses self-contained bash scripts named `test-<name>.sh` — CONFIRMED.

## Findings — Fixed Inline (MEDIUM)

- **MEDIUM (FIXED): `setup-start/SKILL.md` does not contain a per-skill available-skills list.**
  Original spec named `setup-start/SKILL.md` as the update target. Reality: `setup-start/SKILL.md:203` points readers to `references/skill-index.md`; per-skill descriptions live in `setup-start/references/skill-index.md`. Spec Components bullet and AC-7.2 updated to point to the correct file. Root `CLAUDE.md` itself carries the stale pointer that originally misled the spec; that cleanup is out of scope.

- **MEDIUM (FIXED): Line range for `design-large-task` framing block was over-inclusive.**
  Original spec cited "lines 246-264" for the Phase 3 Round One Session Framing block. Reality: line 246 is the Phase 3 header; the Session Framing sub-step (step 3) lives at lines 256-262; line 264 is the start of step 4 (Active-flow framing additions). Spec updated to call out the framing sub-step at lines 256-262 and to instruct that the new framing step be inserted alongside or inside step 3, not in the Phase 3 preamble or in step 4.

## Findings — Carried Forward as Plan-Build Notes (LOW)

- **LOW: `bin/chester-config-read` omits `"$@"` while `bin/chester-trailer-write` includes it.**
  Spec correctly specifies `"$@"` for the new `bin/chester-style-write` wrapper. The "matches the pattern of `bin/chester-config-read`" phrasing is loose — the new wrapper matches `chester-trailer-write` exactly; `chester-config-read` is a no-arg variant. Not load-bearing; the spec's exec line is right. Plan-build should not be misled into omitting `"$@"`.

- **LOW: `write-session-metadata.sh` is a weaker precedent than `chester-trailer-write.sh`.**
  Spec names both as structural precedents. Reality: `write-session-metadata.sh` uses `set -e` (not `set -euo pipefail`), composes JSON via heredoc with shell interpolation (no `jq --arg`), and writes via direct redirect (no atomic temp-file + `mv`). Of the two precedents, only `chester-trailer-write.sh` actually models the discipline the spec calls for. Note: `chester-trailer-write.sh` appends in place rather than performing atomic temp-file + `mv`, so neither existing helper is a perfect precedent for the atomic-write idiom — plan-build should construct it explicitly (mktemp + jq filter + mv).

- **LOW: `chester-config-read.sh` runs `set -euo pipefail`; new unconditional read must handle malformed JSON.**
  The new unconditional `info_packet_style` read against `$USER_CONFIG` will abort the whole script if the file is malformed JSON, breaking `chester-config-read` for callers that never asked about the new key. The spec's Error Handling section covers absent / null / empty cases but not malformed JSON. Plan-build should add explicit fallback (e.g., `2>/dev/null || echo ""`) on the new `jq` invocation.

- **LOW: Test name `tests/test-info-packet-style-version-bumps.sh` is consistent with existing convention.**
  Confirmed against `tests/` directory contents. No action needed; logged for transparency.

## Risk Assessment

The spec accurately describes the codebase it targets. The two MEDIUM findings were paths-of-record mismatches caught in time; both are now corrected. The LOW findings are implementation-trap notes that an experienced implementer would handle naturally but that are worth surfacing so plan-build can name them in tasks (especially the `pipefail` + malformed-JSON interaction and the atomic-write pattern construction). Confidence in proceeding to plan-build is high.

<!-- created-at: 2026-05-12T15:31:59Z -->
<!-- produced-by design-specify@v0003 -->
