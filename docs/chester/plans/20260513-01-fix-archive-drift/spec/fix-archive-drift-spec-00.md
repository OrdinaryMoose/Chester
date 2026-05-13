# Spec: Fix Master-Mode Cascade Archive Drift

**Sprint:** 20260513-01-fix-archive-drift
**Parent brief:** `docs/feature-definition/Pending/master-mode-cascade-archive-drift-00.md`
**Architecture:** Hybrid — Tiered detection-and-reconcile at the archive boundary

## Goal

Make silent reversion of cascade-document edits at `finish-archive-artifacts` time structurally impossible under Master Plan Mode, without changing where cascade edits land during a sub-sprint. The fix inserts a tiered pre-flight into `finish-archive-artifacts` that detects divergence between `working/<master>/design-documents/` and the worktree's `plans/<master>/design-documents/`, handles the common "new file" case automatically, and halts with a named operator-choice manifest only on genuine conflict. Cascade edits continue to land in the worktree's `plans/<master>/design-documents/` during execution (preserving per-commit cascade history), and the archive flow reconciles working/ ← worktree-plans/ at the boundary before the existing `cp -r` runs.

## Components

- **`bin/chester-cascade-diff`** — new bin wrapper. Minimal self-resolving script that delegates to `chester-util-config/chester-cascade-diff.sh`. Matches the shape of `bin/chester-trailer-write` specifically (shebang + `SCRIPT_DIR` + `CHESTER_ROOT` + `exec ... "$@"`) — argument forwarding is required because `chester-cascade-diff` takes two directory args. `bin/chester-config-read` is a similar wrapper but does NOT forward args; do not copy from that file as the template.
- **`chester-util-config/chester-cascade-diff.sh`** — new helper script (~80 lines). Walks two directory trees, computes per-file SHA-256, emits a categorized line-tagged manifest to stdout. Exit code 0 = no divergence; exit code 1 = divergence found (regardless of category). Categories: `MATCH`, `PLANS_ONLY`, `WORKING_ONLY`, `CONFLICT`. Uses `sha256sum` with `shasum -a 256` fallback for macOS.
- **`skills/finish-archive-artifacts/SKILL.md`** — modified. Inserts three new steps before the existing copy: Master-Mode detection, divergence scan, tiered resolution. The existing `cp -r` and verify and commit steps run after resolution. Version bump `v0002 → v0003`.
- **`docs/chester/CLAUDE.md`** — modified. Three targeted amendments: soften the "no skill writes to plans/" assertion to reflect sanctioned cascade-doc edits during sub-sprint execution; document the divergence gate under "Transfer Flow at Sprint Finish"; amend the "Key Properties" one-way-flow bullet to note the targeted pre-flight sync exception.
- **`tests/test-cascade-archive-divergence.sh`** — new bash test (~120 lines). Exercises all three tiers (MATCH fast path, PLANS_ONLY auto-sync, CONFLICT halt) using temp dirs and direct invocation of `chester-cascade-diff.sh`.

## Data Flow

1. `finish-archive-artifacts` runs `eval "$(chester-config-read)"`; resolves `WORKTREE_ROOT` and the sprint subdirectory as today.
2. **New Master-Mode gate**: checks `$CHESTER_WORKING_DIR/.active-master`. If absent, jump to the existing `cp -r` step (no change to non-master behavior).
3. **New divergence scan**: reads master sprint name from the breadcrumb; sets `WORKING_CASCADE="$CHESTER_WORKING_DIR/$MASTER/design-documents"` and `PLANS_CASCADE="$WORKTREE_ROOT/$CHESTER_PLANS_DIR/$MASTER/design-documents"`. If neither path exists, jump to `cp -r` (no cascade content). Otherwise invokes `chester-cascade-diff "$WORKING_CASCADE" "$PLANS_CASCADE"`, captures the manifest and exit code.
4. **New tiered resolution**. The exact commit-body strings used in each branch are quoted verbatim here and reused without paraphrase by AC-1.3:
   - **Tier MATCH** (exit code 0, manifest is all `MATCH` lines or empty) → proceed to `cp -r` silently. No commit-body addition.
   - **Tier PLANS_ONLY-only** (exit code 1, manifest contains only `MATCH` and `PLANS_ONLY` entries) → for each `PLANS_ONLY` file, copy it from `$PLANS_CASCADE/<relpath>` to `$WORKING_CASCADE/<relpath>` (creating parent dirs as needed). Set `COMMIT_TRAILER="Cascade sync: PLANS_ONLY auto-synced: <file-list>"`. Proceed to `cp -r`. Note: the auto-sync is required for cross-worktree visibility (AC-2.1), not for the archive's correctness — `cp -r` preserves files present only in worktree-plans/ even without sync (see §5).
   - **Tier CONFLICT-or-WORKING_ONLY** (exit code 1, manifest contains at least one `CONFLICT` or `WORKING_ONLY` entry) → print the structured manifest to stderr. Wait for operator to type one of `accept-plans`, `accept-working`, or `abort`. No default — empty input or any other string re-prompts.
     - On `accept-plans`: for every `CONFLICT` and `WORKING_ONLY` file, copy `$PLANS_CASCADE/<relpath>` → `$WORKING_CASCADE/<relpath>`. (`WORKING_ONLY` files get removed from working/ — they are absent in plans/, so the sync produces a deletion.) Auto-sync any `PLANS_ONLY` entries the same way. Set `COMMIT_TRAILER="Cascade sync: accepted plans/ for: <file-list>"`.
     - On `accept-working`: do not touch working/. The subsequent `cp -r` will overwrite worktree-plans/ with working/'s state — exactly the destructive choice. Set `COMMIT_TRAILER="Cascade OVERWRITE: reverted plans/ to working/ state for: <file-list>"`.
     - On `abort`: print "Archive halted. No files copied." to stderr; exit non-zero. No commit. No state change.
5. **Existing `cp -r` step** runs as today: `cp -r "$CHESTER_WORKING_DIR/{sprint-subdir}/"* "$WORKTREE_ROOT/$CHESTER_PLANS_DIR/{sprint-subdir}/"`. After tiered resolution, working/ now matches the operator's intent and the copy carries the correct content forward. (`cp -r` overwrites files that exist on both sides but does not delete destination-only files — this is why PLANS_ONLY entries survive the copy without intervention, and why a WORKING_ONLY entry would be propagated into worktree-plans/ if the gate did not halt.)
6. **Existing verify step** runs as today.
7. **Existing commit step** runs as today, but if `COMMIT_TRAILER` is non-empty, the commit message gains a body paragraph: `git commit -m "docs: archive sprint artifacts for {sprint-name}" -m "$COMMIT_TRAILER"`.

The detection scope is fixed to `design-documents/` only. Other files under `working/<master>/` (master-plan.md, sub-sprint subtrees) are not scanned; they continue to flow through the `cp -r` as today.

## Error Handling

- **`sha256sum` and `shasum` both absent**: `chester-cascade-diff.sh` aborts with exit code 2 and a clear stderr message naming both tools. `finish-archive-artifacts` surfaces the error and halts; no copy proceeds. This is a hard failure, not a fall-back-to-silent-copy.
- **`$CHESTER_WORKING_DIR/.active-master` absent**: not an error — non-master mode behavior. Detection block is skipped entirely.
- **Master sprint name in breadcrumb but `working/<master>/` directory missing**: warn and halt. This indicates corrupt state; manual intervention required.
- **`design-documents/` absent on both sides**: treat as empty. No detection output, no manifest, fast path to `cp -r`.
- **`design-documents/` present on one side only**: every file is `WORKING_ONLY` or `PLANS_ONLY`. `PLANS_ONLY`-only triggers auto-sync; `WORKING_ONLY` triggers halt because `cp -r` would create (or re-create) the working/-side file inside worktree-plans/, which would either undo a deliberate deletion during the sub-sprint or propagate a stale working/-only file the sub-sprint never committed. Either outcome contradicts the sub-sprint's apparent intent and is precisely the silent-mutation class this gate prevents.
- **Operator input is empty or unrecognized at the resolution prompt**: re-prompt. Do not accept defaults. Do not interpret partial matches.
- **Non-interactive invocation** (no TTY, no piped input) when a halt would otherwise fire: detect via `[ -t 0 ]` test. If stdin is not a TTY and a CONFLICT/WORKING_ONLY tier is reached, print the manifest to stderr and exit non-zero with a clear message ("non-interactive invocation cannot resolve divergence — re-run interactively or pre-sync manually"). No silent default.
- **Stale `/tmp/chester-cascade-manifest.txt` or other temp file**: the script writes to a per-invocation temp path via `mktemp` and traps EXIT for cleanup. No shared global file.

## Testing Strategy

One new test file under `tests/`:

- **`tests/test-cascade-archive-divergence.sh`** — direct exercise of `chester-cascade-diff.sh` against constructed temp directories. Scenarios:
  - **MATCH scenario**: identical content on both sides → exit code 0, manifest contains only `MATCH` lines.
  - **PLANS_ONLY scenario**: file exists in `plans/`, not in `working/` (new-ADR shape from pass-3) → exit code 1, manifest contains `PLANS_ONLY` line for that file. After applying the auto-sync logic inline in the test (copy plans/ → working/), re-run detection asserts exit code 0.
  - **CONFLICT scenario**: file present both sides with different content → exit code 1, manifest contains `CONFLICT` line with both hashes. The test does not exercise the interactive prompt directly (out of scope for unit-level bash testing); it asserts only that detection produces the correct manifest entry.
  - **WORKING_ONLY scenario**: file exists in `working/`, not in `plans/` → exit code 1, manifest contains `WORKING_ONLY` line.
  - **Hash tool fallback**: test stubs `PATH` to make `sha256sum` unavailable; asserts the script falls back to `shasum -a 256` if present, or exits 2 with the expected error if neither is available.

The test composes its idioms from two existing test files (neither alone contains the full template): `mktemp -d` and `trap EXIT` patterned from `tests/test-decision-record-emission.sh`; the `fail()` helper and the accumulating-errors exit-code idiom patterned from `tests/test-archive-bytewise.sh`. No real git repo is required for the detection script's own behavior.

Manual verification at integration time: a follow-up sub-sprint that edits cascade docs in worktree-plans/ and runs `finish-archive-artifacts` will exercise the actual interactive flow. This is the live-integration check; it is not automated.

## Constraints

- **Working directory remains gitignored.** `$CHESTER_WORKING_DIR` is never added to git tracking. Auto-sync and `accept-plans` writes to `working/<master>/design-documents/` produce gitignored mutations.
- **Plans directory remains tracked.** Only `finish-archive-artifacts` writes content into `$CHESTER_PLANS_DIR` (via the existing `cp -r`, after resolution). Cascade-doc edits during sub-sprint execution land in `$WORKTREE_ROOT/$CHESTER_PLANS_DIR/<master>/design-documents/` directly — these are sub-sprint commits authored by `execute-write`'s implementer subagents and committed by the implementer; they are part of the worktree's normal commit flow, not a skill-driven write into plans/ at archive time.
- **Master Plan Mode accumulation is unchanged.** The `cp -r` continues to copy the entire master working tree to `plans/<master>/`. The detection block runs against `design-documents/` only; non-cascade content under the master tree flows through unchanged.
- **Cross-worktree visibility property preserved.** `accept-plans` and the PLANS_ONLY auto-sync write to working/ at archive time, so subsequent sub-sprint worktrees opening `$CHESTER_WORKING_DIR/<master>/design-documents/` see the post-archive cascade state. During a sub-sprint, working/'s copy is stale relative to the active worktree-plans/ — this is unchanged from current behavior.
- **No new skill dependencies.** The fix uses existing infrastructure: `chester-config-read`, the `bin/` wrapper pattern, the `.active-master` breadcrumb, standard POSIX shell tools (sha256sum / shasum / find / sort).
- **POSIX-portable bash.** No bash-4-isms; no Linux-only commands. The macOS fallback for sha256 is the one named compatibility concession.

## Non-Goals

- **Path-translation logic in `plan-build`, `execute-write`, or `design-specify`.** The working/-canonical approach (brief's Direction B, also surfaced as one of the competing-architecture options during this spec's design-specify run) was considered and rejected because it would route cascade edits through gitignored working/ and destroy the per-commit cascade history that pass-3 surfaced as load-bearing. No skill outside `finish-archive-artifacts` is modified for cascade-doc path resolution.
- **Living-document persistence gap.** Drift in `master-plan.md` between sub-sprint merges has the same root mechanism (working/ vs worktree-plans/ divergence) but is a separate problem with its own candidate-solution survey at `docs/chester/working/master-plan-skill-living-document-problem-brief.md`. The detection scope of this spec is `design-documents/` only.
- **ADR-required-for-cascade-edits enforcement.** The master CLAUDE.md asserts that cascade edits require an ADR; this is enforced by convention only. Any of the three brief directions (and this hybrid) could be bypassed by a sub-sprint that edits cascade docs without filing an ADR. Out of scope per the brief's residual risks.
- **Hardening against habituated `accept-working`.** The labeling, commit-body audit, and "no default" enter behavior are the in-scope mitigations. A future hardening could add a typed-file-count confirmation for `accept-working`; not in this sprint.
- **Detection broader than `design-documents/`.** Other paths under the master tree could in principle drift the same way; restricting scope keeps the spec aligned with the brief and avoids interaction with the living-document gap.

## Acceptance Criteria

### AC-1.1 — CONFLICT case requires explicit resolution

**Observable boundary:**
- Detection finds a `CONFLICT` entry → `finish-archive-artifacts` halts before `cp -r`
- Operator does not type `accept-plans`, `accept-working`, or `abort` → the skill does not proceed; no commit is created; no working/ or plans/ mutation occurs

**Given:** Master Plan Mode is active (`$CHESTER_WORKING_DIR/.active-master` present) and a sub-sprint has committed cascade-doc edits to `$WORKTREE_ROOT/$CHESTER_PLANS_DIR/<master>/design-documents/` whose content differs from the matching file in `$CHESTER_WORKING_DIR/<master>/design-documents/`.
**When:** `finish-archive-artifacts` runs to completion of its existing step sequence.
**Then:** The skill halts at the new resolution step. Stderr contains a manifest naming every `CONFLICT` file with both side hashes. The skill does not invoke `cp -r` and does not invoke `git commit` until the operator types one of the three named choices.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — PLANS_ONLY entries auto-sync without halt

**Observable boundary:**
- Detection finds only `PLANS_ONLY` and `MATCH` entries (no `CONFLICT`, no `WORKING_ONLY`) → no operator prompt fires; auto-sync runs; `cp -r` proceeds
- After archive completes, every `PLANS_ONLY` file exists in `working/<master>/design-documents/` with content identical to the worktree-plans/ copy

**Given:** Master Plan Mode is active and a sub-sprint has committed a new cascade-doc file (e.g., a new ADR) to `$WORKTREE_ROOT/$CHESTER_PLANS_DIR/<master>/design-documents/` with no matching file in `$CHESTER_WORKING_DIR/<master>/design-documents/`. All other files are identical or absent.
**When:** `finish-archive-artifacts` runs.
**Then:** The new file is copied from worktree-plans/ to working/ before `cp -r`. The skill does not prompt the operator. The archive commit message body contains a `Cascade sync: PLANS_ONLY auto-synced` line listing the synced files.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — Commit body records resolution outcome

**Observable boundary:**
- After archive commit lands, `git show HEAD` displays a body paragraph describing what was synced (`accept-plans`, `PLANS_ONLY auto-synced`) or overwritten (`accept-working`); a clean MATCH-only archive has no body addition
- The file list in the body matches the files affected by resolution

**Given:** A sub-sprint with any divergence at archive time.
**When:** Resolution completes and the archive commit is created.
**Then:** The commit message body contains exactly one of: (a) `Cascade sync: PLANS_ONLY auto-synced: <file-list>` for tier PLANS_ONLY-only; (b) `Cascade sync: accepted plans/ for: <file-list>` for `accept-plans`; (c) `Cascade OVERWRITE: reverted plans/ to working/ state for: <file-list>` for `accept-working`. The MATCH-only fast path commits with the existing single-line message and no body.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Cross-worktree visibility after archive

**Observable boundary:**
- Immediately after the archive commit lands on the sub-sprint branch, `$CHESTER_WORKING_DIR/<master>/design-documents/` reflects the worktree-plans/ post-edit content for every file involved in resolution
- A second sub-sprint worktree opening that path reads the post-archive content

**Given:** A sub-sprint that committed cascade-doc edits and resolved divergence via PLANS_ONLY auto-sync or `accept-plans`.
**When:** `finish-archive-artifacts` returns successfully.
**Then:** `cat $CHESTER_WORKING_DIR/<master>/design-documents/<file>` returns the worktree-plans/ post-edit content for every synced file. A separate worktree (real or simulated) reading the same path sees the same content because `CHESTER_WORKING_DIR` resolves to a single absolute path.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Non-master mode behavior unchanged

**Observable boundary:**
- `$CHESTER_WORKING_DIR/.active-master` absent → `finish-archive-artifacts` runs the same sequence as `v0002`: resolve paths, `cp -r`, verify, commit. No new step fires.
- Archive commit message is the existing single-line form with no body addition.

**Given:** No `.active-master` breadcrumb (single-sprint mode).
**When:** `finish-archive-artifacts` runs.
**Then:** The detection block is skipped entirely. `chester-cascade-diff` is not invoked. The `cp -r`, verify, and commit steps execute exactly as in `v0002`. The commit message is `docs: archive sprint artifacts for <sprint-name>` with no body.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — SHA-256 detection with macOS fallback

**Observable boundary:**
- `chester-cascade-diff.sh` invoked on two directories with identical content → exit 0, manifest lines all `MATCH`
- Invoked on directories with at least one differing file → exit 1, manifest contains a `CONFLICT` entry for that file with both hashes
- On a system where `sha256sum` is missing but `shasum` is present → script falls back to `shasum -a 256` silently
- On a system where both are missing → script exits 2 with a stderr message naming both tools

**Given:** `chester-cascade-diff.sh` is on `$PATH` (via the `bin/` wrapper) and at least one of `sha256sum` or `shasum` is available.
**When:** The script is invoked with two directory arguments.
**Then:** Each file present in both trees is hashed on both sides; matching hashes emit `MATCH <relpath>`, differing hashes emit `CONFLICT <relpath> <working-hash> <plans-hash>`. Files present only in the first argument emit `WORKING_ONLY <relpath>`; files present only in the second emit `PLANS_ONLY <relpath>`. Exit code is 0 iff every entry is `MATCH`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — Anti-rubber-stamp labeling at resolution prompt

**Observable boundary:**
- The resolution prompt displays three options whose labels are `accept-plans`, `accept-working`, and `abort`
- The `accept-working` line in the prompt explicitly contains the phrase "cascade edits lost" (or substantively equivalent destructive language)
- No keystroke maps to a default; pressing enter on empty input does not advance

**Given:** A CONFLICT or WORKING_ONLY tier has fired and the operator sees the manifest.
**When:** The operator presses enter on an empty line, types `y`, types `n`, or types anything other than the three exact strings.
**Then:** The skill does not proceed. It re-prompts. The destructive option's label communicates destruction at the point of choice.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — docs/chester/CLAUDE.md reconciled with sanctioned practice

**Observable boundary:**
- The "No skill writes here except `finish-archive-artifacts`" assertion in the "plans/ — Archive Only" section is amended to acknowledge that under Master Plan Mode, sub-sprint execution may produce ADR-backed cascade edits committed directly to `plans/<master>/design-documents/` as part of the sub-sprint's normal commit flow.
- A new subsection or paragraph documents the divergence gate (existence, three tiers, manifest, three named operator choices).
- The verbatim line in the "Key Properties" section reading `One-way flow: working → plans at archive step. Never reverse.` is amended to note the targeted `working/ ← worktree-plans/` sync that runs at archive time under Master Plan Mode (e.g., adds an "Exception:" clause naming the pre-flight sync as a non-structural reversal of the flow).

**Given:** The spec is approved and the implementation is complete.
**When:** A reader opens `docs/chester/CLAUDE.md`.
**Then:** The three textual amendments above are present. The doc no longer contradicts actual practice. The divergence gate is documented in prose with the same precision as the rest of the file.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.2 — finish-archive-artifacts/SKILL.md documents tiered behavior

**Observable boundary:**
- The SKILL.md text describes the four-step sequence: Resolve Paths → Master-Mode Gate + Divergence Scan + Tiered Resolution → Copy → Verify → Commit
- The three resolution choices are documented with their exact strings and their semantics
- The version frontmatter field is bumped to `v0003`

**Given:** The spec is approved and the implementation is complete.
**When:** A reader opens `skills/finish-archive-artifacts/SKILL.md`.
**Then:** The skill file describes the tiered behavior in prose at the same level of precision as the existing steps. The version field reads `v0003`. The non-master path is documented as identical to `v0002` behavior.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.1 — Bash test exercises all three tiers

**Observable boundary:**
- `bash tests/test-cascade-archive-divergence.sh` exits 0 on a clean checkout where `sha256sum` or `shasum` is available
- The test constructs MATCH, PLANS_ONLY, WORKING_ONLY, and CONFLICT scenarios and asserts the expected manifest output and exit codes for each
- The test does not require a real git repo for the detection script's own behavior

**Given:** A clean working tree on a system with `sha256sum` or `shasum -a 256` available.
**When:** `bash tests/test-cascade-archive-divergence.sh` is executed.
**Then:** The test exits 0 (all assertions pass). Each tier's scenario is exercised; the manifest output is parsed and the expected category lines are asserted present.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-05-13T11:08:48Z -->
<!-- produced-by design-specify@v0003 -->
