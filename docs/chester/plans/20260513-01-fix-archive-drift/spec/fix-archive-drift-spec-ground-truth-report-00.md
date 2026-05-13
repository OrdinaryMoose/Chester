# Ground-Truth Report: Fix Master-Mode Cascade Archive Drift

**Spec:** `spec/fix-archive-drift-spec-00.md`
**Reviewed:** 2026-05-13

## Status: Findings (1 MEDIUM, 4 LOW)

The spec's core claims about file paths, version numbers, the `cp -r` form, the `.active-master` breadcrumb, env-var contracts, manifest auto-discovery, and `docs/chester/CLAUDE.md` text locations were all verified against the current code. No HIGH findings. The MEDIUM and one functionally-important LOW have been addressed in the spec; the remaining three LOWs are reported as implementer context.

## Verified Claims

- **`bin/` wrapper pattern** (self-resolving, delegates to `chester-util-config/` sibling) — confirmed at `bin/chester-config-read:1-7` and `bin/chester-trailer-write:1-5`. Both use `exec` to delegate.
- **`finish-archive-artifacts/SKILL.md` is currently `v0002`** — confirmed at `skills/finish-archive-artifacts/SKILL.md:8`. Bump to `v0003` is correct sequencing.
- **Step structure** (Resolve Paths / Copy / Verify / Commit) — confirmed at lines 20, 38, 47, 63 of `skills/finish-archive-artifacts/SKILL.md`.
- **`cp -r` invocation form** `cp -r "$CHESTER_WORKING_DIR/{sprint-subdir}/"* "$WORKTREE_ROOT/$CHESTER_PLANS_DIR/{sprint-subdir}/"` — confirmed verbatim at `skills/finish-archive-artifacts/SKILL.md:42`.
- **`docs/chester/CLAUDE.md` text locations** — all three amendment targets confirmed: "No skill writes here except `finish-archive-artifacts`" at line 10; "Transfer Flow at Sprint Finish" section header at line 24; "One-way flow: working → plans at archive step. Never reverse." at line 42.
- **`.active-master` breadcrumb** — confirmed canonical at `CLAUDE.md:99,106` and `docs/chester/CLAUDE.md:13`. Path: `docs/chester/working/.active-master`.
- **`chester-config-read` exports** — confirmed at `chester-util-config/chester-config-read.sh:61-68`. `CHESTER_WORKING_DIR` is absolutized; `CHESTER_PLANS_DIR` is emitted as relative.
- **Plugin manifest does not enumerate bin files** — confirmed at `.claude-plugin/plugin.json:1-7`. Adding `bin/chester-cascade-diff` needs no manifest change.
- **`finish-archive-artifacts/SKILL.md` does not currently handle Master Plan Mode explicitly** — confirmed. No mentions of `master`, `cascade`, or `design-documents` exist in the skill file; Master Plan Mode override is documented only in `docs/chester/CLAUDE.md:30-31` (prose).
- **`tests/test-archive-bytewise.sh` and `tests/test-decision-record-emission.sh` both exist** — confirmed in `tests/` directory.

## Findings (Applied in Spec)

- **MEDIUM — Test idiom claim was a synthesis, not a single-file template** *(applied to spec)*
  - Original spec claim: test "uses `mktemp -d`, `trap EXIT` for cleanup, a `fail()` helper, and the pass/fail exit-code idiom established in `tests/test-archive-bytewise.sh` and `tests/test-decision-record-emission.sh`."
  - Code reality: `test-archive-bytewise.sh` has the `fail()` helper and accumulating-errors pattern but no `mktemp`/`trap EXIT`. `test-decision-record-emission.sh` has `mktemp -d` + `trap 'rm -rf "$TMPDIR"' EXIT` but no `fail()` helper.
  - Fix: spec now explicitly notes the test composes idioms from two files, naming which idiom comes from which.

- **LOW (functionally important) — `bin/` wrapper arg-forwarding bifurcation** *(applied to spec)*
  - `bin/chester-config-read:7` does `exec "$CHESTER_ROOT/.../chester-config-read.sh"` (no args).
  - `bin/chester-trailer-write:5` does `exec "$CHESTER_ROOT/.../chester-trailer-write.sh" "$@"` (forwards args).
  - The new `chester-cascade-diff` takes two directory args; the wrapper MUST follow `chester-trailer-write`'s shape, not `chester-config-read`'s.
  - Fix: spec's Components section now calls this out explicitly.

## Findings (Reported as Implementer Context)

- **LOW — "Four-line" wrapper claim was approximate.** Real `bin/chester-trailer-write` is 5 lines (shebang + 1 comment + 3 code); `bin/chester-config-read` is 7 non-blank lines. The spec's revised phrasing ("minimal self-resolving wrapper following `bin/chester-trailer-write`'s shape") avoids the line-count framing entirely.

- **LOW — `CHESTER_MAIN_ROOT` is also exported by `chester-config-read.sh:70`** as the canonical anchor for absolutizing `CHESTER_PLANS_DIR`. The spec doesn't need this — `WORKTREE_ROOT="$(git rev-parse --show-toplevel)"` already serves the cascade-diff's needs — but plan-build authors should know it exists if they touch path resolution.

- **LOW — `chester-util-config/chester-config-read.sh:11` uses `set -euo pipefail`.** The new `chester-cascade-diff.sh` should match for consistency, but be aware: under `set -e`, exit-1 from internal `cmp`/`diff`/`sha256sum -c` invocations will abort the script. The categorized-walk pattern (CONFLICT vs MATCH vs PLANS_ONLY vs WORKING_ONLY) needs explicit `|| true` guards or `if ! cmd; then` branching to survive `set -e`. Plan-build implementer should expect this.

## Risk Assessment

The spec accurately describes what it touches at the code-reference level. The one MEDIUM finding was a precision issue in the test-strategy section (now corrected). The arg-forwarding LOW was elevated to a spec change because it's a functional pre-condition for the new bin wrapper to work. The remaining LOWs are operator/implementer context — they do not invalidate the spec's architecture or acceptance criteria, and they will be visible to plan-build as report context rather than as required spec amendments.

No HIGH findings means no re-run of the ground-truth review is needed. The spec is ready for the user gate.

<!-- created-at: 2026-05-13T11:15:23Z -->
<!-- produced-by design-specify@v0003 -->
