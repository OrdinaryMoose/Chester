# Plan Threat Report — redesign-convergence-model

**Plan reviewed:** `plan/redesign-convergence-model-plan-00.md`
**Combined risk level:** Moderate (mitigated to Low after directed fixes applied)
**User decision:** Option (b) — proceed with directed mitigations applied inline

## Smell Heuristic Pre-Check

Triggers fired (substring noise, not semantic):
- "agentic" (matched async category — false positive)
- "telemetry persistence" (matched persistence category — false positive; refers to in-memory state already saved by existing `saveState`)

Smell skipped would have been justified semantically (no real new abstractions, DI, async, persistence, or contracts). Fired anyway per skill's "tune toward over-firing" rule. Findings confirmed expected: only mechanical consistency improvements, no architectural concerns.

## Plan-Attack Findings (15 total)

### High Severity

- **F11 — Broken awk range in AC-1.4 test.** `awk '/^## Self-Evaluation/,/^## /'` terminates immediately because the closing pattern matches the opening line itself. Test would silently always pass regardless of Self-Evaluation content. **FIXED inline:** changed to exclusive-start pattern `awk '/^## Self-Evaluation/{flag=1; next} /^## /{flag=0} flag'`.

### Medium Severity

- **F6 — `$SPRINT_SUBDIR` undefined in start-bootstrap Step 4c snippet.** Existing `start-bootstrap/SKILL.md` uses brace-template style (`{CHESTER_WORKING_DIR}/{sprint-subdir}/`) for agent substitution; the new snippet introduced `$SPRINT_SUBDIR` shell variable that has never been bound. **FIXED inline:** changed snippet to brace-template style consistent with surrounding steps.
- **F9 — In-flight state files crash without defensive init.** Existing serialized state files (already-running sessions) lack the three new arrays. `next.groupSaturationHistory.push(...)` on undefined throws TypeError. **FIXED inline:** added defensive `??= []` initializers before each push.

### Low Severity (not fixed)

- **F1 — Warnings shape mismatch between test fixture and production.** Test uses `{ dimension, message }` objects; production `validateUnderstandingSubmission` produces plain strings. Test still functions because it bypasses validation; misleads about production schema. Acceptable for MVP; documenting prod schema in execute-write commit message recommended.
- **F4 — Helper-script git-fail branch not exercised by test.** Test invokes from valid git repo. Failure path (write `null` for skillVersion fields) is documented in spec Error Handling but not tested. Acceptable for MVP.
- **F5 — `JSONL_SESSION_ID` quoting fragility.** If `CLAUDE_SESSION_ID` ever contains a literal `"` or backslash, JSON malforms. Realistic IDs are UUID-like, so risk is theoretical.
- **F13 — AC-1.5 test uses OR-match (`C1|C2`) where AND would be tighter.** Spec AC-1.5 requires both. Implementation in plan does mention both. Test is loose but doesn't block implementation.
- **F2, F3, F7, F8, F12, F14, F15** — verified safe; not blocking.

### Trust-Anchor Verification

All 12 verified anchors from the design-stage ground-truth report re-confirmed accurate against current code. Plan-modified anchors (state.js signatures, server.js call site, partner-role section ordering, design-skill step locations) all match plan claims.

### Concurrency

No concerns. Synchronous bash + single-threaded MCP request handling. `structuredClone` already isolates state mutations.

## Plan-Smell Findings (8 total)

### Real consistency improvements (fixed inline)

- **#2 — `transitionHistory` hand-extracts fields instead of `structuredClone(next.transition)`.** Inconsistent with `scoreHistory.push(structuredClone(...))` pattern. **FIXED inline:** changed to `structuredClone(next.transition)`.
- **#4 — `warningsHistory` uses `[...warnings]` shallow copy instead of `structuredClone`.** Inconsistent with surrounding pushes; aliased mutable references in persistent state. **FIXED inline:** changed to `structuredClone(warnings)`.

### Acknowledged / non-defect (not fixed)

- **#1 — Helper-script extraction borderline single-call-site abstraction.** Plan acknowledges; matches existing `chester-config-read.sh` convention.
- **#3 — Ordering verification of `groupSaturation` clone source.** Verified correct.
- **#5 — Sprint-name regex duplication.** Format is stable and central; risk low.
- **#6 — Translation Gate test heuristic limitations.** Acknowledged spec limitation (AC-5.1 phrased "when read aloud as if to PM" — implies human verification).
- **#7 — `(C1)` / `(C2)` markers load-bearing for tests.** Convention coupling; acceptable.
- **#8 — Cross-reference text duplicated three times.** Intentional per spec constraint "ONE LINE per per-turn flow."

## Mitigations Applied Inline (5 fixes)

1. **F11** — Exclusive-start awk pattern in AC-1.4 test
2. **F6** — Brace-template style in start-bootstrap Step 4c snippet
3. **F9** — Defensive `??= []` init for three new state arrays
4. **plan-smell #2** — `structuredClone(next.transition)` for transitionHistory
5. **plan-smell #4** — `structuredClone(warnings)` for warningsHistory

Plan remains at v00 (mitigations are tightening corrections, not architectural revisions).

## Final Risk Assessment

After mitigations: **Low.** Three real bugs fixed at source; two consistency improvements aligned with surrounding code patterns. Remaining low-severity findings (warnings shape documentation, git-fail branch coverage, JSON quoting robustness) are acceptable for MVP; can be addressed in execute-write commit messages or follow-up polish. No structural or architectural concerns.

Plan is ready for execute-write.
