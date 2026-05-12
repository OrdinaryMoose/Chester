# Plan Threat Report — Add Interview Instructions

**Sprint:** 20260512-01-add-interview-instructions
**Plan reviewed:** docs/chester/working/20260512-01-add-interview-instructions/plan/add-interview-instructions-plan-00.md
**Spec:** docs/chester/working/20260512-01-add-interview-instructions/spec/add-interview-instructions-spec-01.md

## Hardening dispatch summary

- **plan-attack:** dispatched (unconditional).
- **plan-smell:** dispatched. Smell heuristic triggered on the word "persistence" (matches the "New persistence pathways" category in `references/smell-triggers.md`). Matched triggers: `persistence`.
- **Ground-truth cascade:** spec-stage ground-truth report present and used. Verified-anchor skip-list passed to plan-attack covered the existing `chester-config-read.sh`, helper-script precedents, SKILL.md framing-block locations, and the `skill-index.md` line for `util-design-partner-role`. Anchors the plan modifies were moved to re-verify; anchors the plan creates were flagged for new-anchor verification.

## Combined risk level: **Low**

The hardening pass surfaced two blocking execution-path issues and three correctness issues; all have been fixed inline in the plan before this report was written. The architecture is structurally sound — every insertion point in `chester-config-read.sh` was verified by both reviewers, the `printf %q` quoting idiom was validated by execution, the `|| true` malformed-JSON guard was validated, the single-source-of-truth discipline for the factory default was confirmed, and the atomic-mv write idiom was verified to use a same-directory temp file. The remaining risks (concurrent `instruction(save)` from two sessions producing a lost-write, intent-recognition fragility on substring matching) are architectural properties acknowledged in the spec, not plan defects.

Five statements explaining the Low rating:

- **Both critical blockers were patchable inline.** The two stamping tests that would have broken at Task 5 and Task 6 are now explicitly re-pinned by new Step 3c entries; the plan's "Must remain green" lines no longer claim the pre-broken tests are green at sprint start. No architectural change required.
- **The plan's verified-anchor coverage was 100%.** Every file path, line number, structural landmark, and version literal the plan references was confirmed against the actual codebase by the attack pass. No hallucinated files, no stale section references.
- **The quoting and atomicity concerns at the helper-script level were correctly handled.** `printf %q` round-trips all special characters under `eval`; `jq --arg` argument binding is safe for free-form prose; `mktemp + mv` in the same directory is atomic. The attack pass executed each of these to confirm.
- **The remaining LOW findings are architectural acknowledgments, not bugs.** Concurrent-session lost-writes and substring-match intent recognition are spec-level properties — the design admits them and chooses not to address them in this sprint. The plan does not introduce these risks; it inherits them from the architecture the user already approved.
- **Test coverage for the runtime-behavior ACs (AC-5.x, AC-6.x) is deliberately deferred to manual rehearsal.** The spec called this out; the plan implements the prose that enables them via Task 3. This is not a coverage gap — it is the design's chosen verification boundary.

## Findings detail

### Attack findings — addressed inline

- **CRITICAL: `tests/test-stamping-design-large-task.sh` is pre-broken (pins `v0011` while file is at `v0013`).** Plan Task 5's "Must remain green" originally claimed the test passes at sprint start; in fact, running the full test suite today shows `FAIL: tests/test-stamping-design-large-task.sh`. **Fix applied:** Task 5 now carries a pre-task note explaining the pre-existing failure, a new Step 3c that re-pins the test to `v0014` (matching the new bumped value), an updated Step 4 expectation, and an updated `git add` list. The comment block above the pin in the stamping test is also brought current with the post-sprint version chain.

- **HIGH: `tests/test-stamping-design-small-task.sh` pins `v0002` and would break on Task 6's bump to `v0003`.** Plan Task 6 originally lacked any fix instruction. **Fix applied:** Task 6 now carries a pre-task note, a new Step 3c that re-pins the stamping test to `v0003`, and an updated `git add` list. The comment on line 11 is updated to match.

- **MEDIUM: Case 4 in `tests/test-chester-config-read-info-packet-style.sh` does not actually test jq unavailability.** The original form `HOME=... PATH=... eval "$(bash "$SCRIPT")"` bound the prefix assignments to `eval` (a builtin that doesn't use PATH), so the command substitution ran with the outer shell's unrestricted PATH and `jq` was reachable. AC-1.3 was effectively untested at the automated level. **Fix applied:** Case 4's invocation rewritten as `eval "$(HOME=... PATH=... bash "$SCRIPT")"` with an inline comment explaining why the order matters. The analogous form in `tests/test-chester-style-write.sh` (`ac23b`) was already correct.

- **MEDIUM: Insertion line numbers in Task 1 shift as each insertion lands.** Insertions B, C, D referenced pre-Insertion-A line numbers. An implementer applying insertions sequentially in A→B→C→D order would find the stated numbers stale. **Fix applied:** a new "Line-number caveat" paragraph added before Insertion A directing the implementer to use structural landmarks (variable names, `fi`/`else` keywords, last `echo "export ..."` line) rather than raw line numbers. The structural landmarks themselves are unambiguous and were verified by both reviewers.

- **LOW: Task 6 Step 2 "Expected: FAIL" description assumes task ordering 1→6.** Acknowledged but not patched — the TDD step is correct regardless of which checks fail; only the prediction is order-dependent.

- **LOW: Concurrent `instruction(save)` lost-write race.** Two open sessions issuing `instruction(save)` would read-modify-write the same settings file; the later `mv` discards the earlier change. The atomic-mv idiom is the standard POSIX mitigation for write races on user settings files. This is an inherited architectural property, not a plan defect.

### Smell findings — addressed inline or accepted

- **MEDIUM: Export-idiom asymmetry in `chester-config-read.sh`.** The existing four exports use single-quote wrapping (`echo "export VAR='$VAR'"`); the new export uses `printf %q`. The asymmetry will read as inconsistency without explanation. **Fix applied:** Task 1 Insertion D now includes an inline single-line comment in the script explaining why `%q` is used for user-provided free-form prose.

- **MEDIUM: Factory default literal restated in `tests/test-chester-config-read-info-packet-style.sh`.** The test hardcodes the literal as `FACTORY_DEFAULT='...'` to verify what the script emits. This is a deliberate test-driven coupling — if the script's literal changes without updating the test, the test fails, surfacing the drift. Accepted as-designed; the alternative (test reads the literal from the script) reduces test independence.

- **HIGH (workflow) / MEDIUM (structural): Version-pinning stamping tests duplicate/conflict with the cross-cutting version test.** Same surface as the CRITICAL/HIGH attack findings; addressed by the same fixes (Task 5/6 Step 3c re-pins). The deeper structural smell — that every skill version bump requires a manual stamping-test update — is a pre-existing pattern in the test suite, not introduced by this plan. Out of scope to refactor.

- **LOW-MEDIUM: Handshake paragraph textually duplicated between `design-large-task` and `design-small-task` SKILL.md files.** Accepted. The paragraph is intentionally minimal (names the four moves without restating mechanics) and the duplication is consistent with how other framing prose is shared between the two interview skills. If a third interview skill is added, the same paragraph will be added there — at which point the pattern may warrant promotion to a single shared block read from the voice authority.

- **LOW: `write-session-metadata.sh` does not track `CHESTER_INFO_PACKET_STYLE`.** Out of scope per spec Non-Goals ("Style archiving in session-meta or design-brief artifacts"). Not a plan-introduced smell.

- **LOW: `instruction(save)` recognized via literal substring match with no guardrail at the script level.** Inherent to skill-prose intent recognition; the spec explicitly acknowledges that interview-time behavior is not unit-testable in this repo. The `jq` merge semantics prevent the settings file from becoming syntactically malformed even on misinterpreted directives.

- **LOW: `tests/test-config-read-new.sh` does not assert `CHESTER_INFO_PACKET_STYLE` is present in existing-coverage cases.** Minor gap — the new test's Case 1 covers the absent-file path, but not "user file present with other keys, `info_packet_style` absent." Could be filled later by augmenting the existing test; not blocking.

### Verified-correct anchors (no concern raised)

- All four insertion landmarks in `chester-config-read.sh` (line 21, line 43 `fi`, line 44 `else`, line 48 `echo "# jq not available..."`, line 60 last export).
- `printf %q` round-trip safety for single quotes, double quotes, ampersands, parentheses, backslashes — executed.
- `|| true` malformed-JSON guard prevents `set -euo pipefail` abort — executed.
- `mktemp "${USER_CONFIG}.XXXXXX"` places temp file in the target directory (same filesystem) — atomic-mv safe.
- Task ordering (1→6) correctly satisfies Task 2's round-trip dependency on Task 1 and Task 6's cross-cutting version-bump dependency on Tasks 3–5.
- `test-partner-role-discipline.sh` scan range is `C1: Externalized Coverage` through `Option-Naming Rule`; the new "Info-Packet Style Overlay" section is inserted before C1 (after Composition Note), so it is outside the discipline scan range — no regression risk.
- `test-large-task-closure.sh` does not pin a version string and is unaffected by the bump.

## Decision

Plan ready to proceed to execute-write. Your four options:

1. **Proceed** — accept the plan as-is (with the inline fixes applied during hardening) and move to execution.
2. **Proceed with directed mitigations** — name specific additional mitigations beyond the inline fixes already applied.
3. **Return to design** — surface a concern that warrants revisiting the spec or the design brief.
4. **Stop** — pause the sprint.

<!-- created-at: 2026-05-12T15:56:05Z -->
<!-- produced-by plan-build@v0004 -->
