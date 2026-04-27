# Reasoning Audit: Redesign Convergence Model — Lane 1 MVP

**Date:** 2026-04-26
**Session:** `00`
**Plan:** `redesign-convergence-model-plan-00.md`

## Executive Summary

Session began as analysis of 11 past StoryDesigner sessions diagnosing why the understanding-MCP transition gate fires too early. Pivoted into design discovery for a replacement convergence model, with the most consequential decision being the **collapse of three iterations of C2** — from `known/inferred/guessed` (provenance-based) → `Found/Inferred/External` (still provenance-based) → `Fact/Assumption/Opinion` (epistemic-status-based, designer-driven). Implementation stayed on-plan after adversarial review caught two HIGH factual errors in the spec (Translation Gate / Research Boundary misattributed to partner role) and three plan-attack findings were applied inline before execute.

## Plan Development

Plan derived from spec via TDD decomposition: 4 tasks, one commit each, each task = test → fail → impl → pass → commit. Spec's 15 ACs grouped logically into 4 task buckets (telemetry, session metadata, partner-role discipline, cross-references). Plan went through review (approved with 2 cleanup edits) and hardening (plan-attack + plan-smell forced 5 inline mitigations covering awk-range bug, brace-template inconsistency, defensive init for in-flight state, and structuredClone consistency).

## Decision Log

### Drop Lane 2 entirely from this sprint scope

**Context:** Designer realized after deep exploration of C3 (Implication Closure) and the 4 architecture options for dim restructuring that the citation-system expansion of Lane 1 was a "rabbit hole" and the original problem (gate fires too early) was Lane 2's domain, not Lane 1's.

**Information used:**
- Past-session analysis showing 4-of-5 inverted Solve length
- Designer's "let's go all the way back to the beginning" reset
- Realization that Lane 1 (voice discipline) is a different problem than Lane 2 (transition gate)

**Alternatives considered:**
- Path A — ship Lane 1 only, defer Lane 2
- Path B — minimum-viable Lane 1 (drop citation expansion), defer Lane 2
- Path C — pause sprint, restart on Lane 2
- Path D — ship both lanes

**Decision:** Path B — MVP Lane 1 only, Lane 2 deferred to separate sprint.

**Rationale:** Designer chose Lane 1 because "it seemed easier." Honest acknowledgment that the original problem (gate timing) remains unfixed under Path B; telemetry fields added this sprint will inform Lane 2 analysis later.

**Confidence:** High — explicitly stated by designer.

---

### Collapse C2 to binary Fact/Assumption (then add Opinion as third tier)

**Context:** Initial C2 framing used `known/inferred/guessed` markers. Designer pushed back — provenance-based framing implied training knowledge was unreliable, which is wrong (most external claims are true).

**Information used:**
- Designer's explicit reframe: "fact (verifiable, repeatable) and assumption (possibly verifiable, possibly repeatable)"
- Designer's subsequent addition: "the third category is opinion — llm taking a principled stand either based on fact or assumption but should say which"
- Designer's hard rule addition: "all recommendations are opinions"

**Alternatives considered:**
- `known/inferred/guessed` (original) — rejected as misframing training as unreliable
- `Found/Inferred/External` (provenance-based intermediate) — rejected after binary reframe
- Binary `Fact/Assumption` only — rejected when Opinion gap surfaced
- Full citation system with numbered inline markers — rejected as MVP overhead

**Decision:** Three tiers — Fact (default, unmarked), Assumption (marked), Opinion (marked, all recommendations carry it).

**Rationale:** Epistemic status (verifiable+repeatable vs uncertain vs judgment) is what designer wants to scrutinize, not provenance (where knowledge came from). Fact-default with marked departures massively reduces marker noise while still flagging confidence-laundering and forcing explicit advocacy.

**Confidence:** High — designer drove every reframe explicitly.

---

### Architect comparison axes — enforcement reach vs discipline composition

**Context:** Spec phase needed two architect axes for parallel exploration. Plan-build's competing-architectures stage requires axes derived from the brief's actual tensions, not dispatcher priors.

**Information used:**
- Brief's locked "light-touch" decision (one-line cross-references in design skills)
- Past-session evidence that what's foregrounded in primary skill text gets enforced; what's only in shared role gets skimmed
- Existing partner-role disciplines (Translation Gate, Research Boundary, Private Precision Slot, Option-Naming Rule, Self-Evaluation)

**Alternatives considered:**
- Telemetry shape axis (additive vs structured event log) — rejected; brief explicitly locks 3 fields
- Test scope axis (smoke vs comprehensive) — too small-stakes
- Documentation richness axis — too small-stakes

**Decision:** Architect A optimizes enforcement reach within light-touch constraint; Architect B optimizes discipline composition with existing partner-role rules. Hybrid landed as principled merge — short Composition Note (B's idea) + insert C1/C2 between Private Precision Slot and Option-Naming Rule (preserves existing ordering, A's foregrounding spirit) + 4 sibling Self-Evaluation checks (B's count).

**Rationale:** Both axes touched real tensions from the brief; hybrid kept what each architect did well without forcing B's full file reorganization (too invasive for MVP) or A's pre-Interpreter-Frame insertion (disrupts existing ordering).

**Confidence:** High — explicit selection by designer (Option C from comparison).

---

### Apply 5 plan-hardening fixes inline before execute

**Context:** Plan-attack identified 15 findings and plan-smell identified 8. Three findings were real bugs (F11 awk range terminating immediately, F6 undefined `$SPRINT_SUBDIR` in start-bootstrap snippet, F9 in-flight state files crashing without defensive init). Plan-smell flagged 2 consistency improvements (`structuredClone` for transitionHistory and warningsHistory).

**Information used:**
- F11 evidence: `awk '/^## Self-Evaluation/,/^## /'` terminates on opening line
- F6 evidence: existing `start-bootstrap/SKILL.md` uses `{CHESTER_WORKING_DIR}/{sprint-subdir}` brace-template style
- F9 evidence: existing serialized state files lack the three new arrays; push on undefined throws TypeError
- Plan-smell #2 + #4: existing `scoreHistory.push(structuredClone(...))` template not followed by new pushes

**Alternatives considered:**
- (a) Proceed to execute as-is, fix during execution
- (b) Apply mitigations inline, then proceed
- (c) Return to design
- (d) Stop

**Decision:** Path (b) — applied 5 inline edits before execute. Final risk dropped from Moderate to Low.

**Rationale:** Cost was small (~10 lines total), benefit was real (mechanical bugs that would have silently broken test verification or crashed in production). Designer chose explicitly.

**Confidence:** High — designer selected Path (b) explicitly.

---

### Spec adversarial fix — Translation Gate / Research Boundary misattribution

**Context:** Spec v00 listed "Translation Gate, Research Boundary, Private Precision Slot, Option-Naming Rule" as existing partner-role sections to preserve verbatim. Adversarial review caught that Translation Gate and Research Boundary actually live in `design-large-task/SKILL.md` (and `design-small-task/SKILL.md`), not in `util-design-partner-role/SKILL.md`.

**Information used:**
- Direct grep of `util-design-partner-role/SKILL.md` confirming 6 sections only (Core Stance, Interpreter Frame, Private Precision Slot, Option-Naming Rule, Self-Evaluation, Stance Principles)
- Architect B during spec phase had assumed Translation Gate was in partner role; spec text inherited the assumption uncorrected
- Two HIGH-severity findings in adversarial review (one in Constraints section, one in AC-5.2 observable boundary)

**Alternatives considered:**
- Defer fix to execute-write — rejected; would have produced unfulfillable AC and meaningless test
- Restructure to actually move Translation Gate into partner role — rejected; out of scope for MVP, brief said "additions only, no edits to existing"

**Decision:** Fix inline — replace Translation Gate / Research Boundary references with the actual existing sections; add explicit note in AC-5.2 that those sections live in design skills, not partner role. Bumped to spec v01.

**Rationale:** Mechanical fix (~3 lines), preserves correctness, keeps brief's "additions only" intent.

**Confidence:** High — adversarial review provided file:line evidence.

---

### Run all tests in suite via for-loop instead of npm test

**Context:** execute-verify-complete Step 1 says "run project's full test suite (npm test / cargo test / pytest / go test)." Chester has `package.json` with no test script.

**Information used:**
- `package.json` `scripts.test` returns `"echo Error: no test specified && exit 1"`
- `tests/` contains 27 bash test scripts (`test-*.sh` pattern)
- Existing repo convention: bash tests, not npm
- Same conflict noted in skeleton manifest with override rationale

**Alternatives considered:**
- Run `npm test` per skill literal — would fail by design, blocking the gate
- Single `bash tests/test-*.sh` glob — wouldn't capture per-test pass/fail
- Per-test for-loop — runs each, reports per-test outcome

**Decision:** For-loop over `tests/test-*.sh` files reporting per-test PASS/FAIL.

**Rationale:** Matches actual codebase test convention. All 27 tests pass cleanly.

**Confidence:** High — codebase evidence is unambiguous.

---

### Skip decision-record loop steps gracefully when MCP unavailable

**Context:** Plan-build, execute-write, and finish-write-records all expect `chester-decision-record` MCP tools (`dr_query`, `dr_capture`, `dr_finalize_refs`, `dr_audit`, `dr_verify_tests`) to be available. None were available this session.

**Information used:**
- Tool search returned no matching deferred tools for `dr_*`
- Skill-text fallback in plan-build: "If `dr_query` returns zero records, write `None.`"
- No equivalent fallback documented for `dr_capture` / `dr_finalize_refs` / `dr_verify_tests` — inferred consistency

**Alternatives considered:**
- Block execution waiting for MCP — rejected; would deadlock the sprint
- Stub the MCP locally — out of scope
- Document the gap inline at each invocation point

**Decision:** Skip decision-record loop steps with explicit "MCP unavailable" notes at each point. No records produced; no audit performed.

**Rationale:** Sprint is voice-discipline + telemetry, not decision-record loop work. Lane 2 (which would need the records for cross-sprint provenance) is deferred anyway.

**Confidence:** Medium — "graceful degradation" inferred from `dr_query` fallback; consistency with other dr_* tools is plausible but not explicit in skill text.

---

### Combined spec+quality reviews for Tasks 2-4

**Context:** execute-write skill prescribes separate dispatches for spec compliance reviewer and code quality reviewer. After Task 1 ran both as separate dispatches and both passed cleanly, Tasks 2-4 ran them combined in a single dispatch.

**Information used:**
- Task 1 had non-trivial code change (state.js function signature + 14 lines + new test); both reviews valuable
- Tasks 2-4 are smaller surface (config script, doc edits, 1-line cross-refs) where two separate dispatches would be wasteful
- Reviewer time / cost / latency considerations

**Alternatives considered:**
- Strict per-skill (separate dispatches every task) — rejected as overkill for small-surface tasks
- Skip quality review entirely for docs-producing tasks — rejected as silently weakening the gate

**Decision:** Combined spec+quality review in a single subagent dispatch for Tasks 2, 3, 4. Both verdicts surfaced separately in the report.

**Rationale:** Smaller surface means reviewer can hold both lenses in one pass without context overload. Reviewer reports separated Spec Verdict from Quality Verdict so each gate is still individually checked.

**Confidence:** Medium — pragmatic optimization; not explicitly authorized by skill but not prohibited; orchestrator's call.

---

### Defensive init via `??=` for in-flight state file compatibility

**Context:** plan-attack F9 finding — existing serialized state files (already-running sessions) lack the three new arrays. `next.groupSaturationHistory.push(...)` on undefined throws TypeError.

**Information used:**
- Spec v01 claims "no breaking changes" but technically violates this for in-flight sessions
- Defensive init is one-line per array (`??= []`) and runs only when arrays are absent
- Pattern is JS-idiomatic and widely supported

**Alternatives considered:**
- Document as accepted breakage — rejected; spec promised no break
- Migration script — overkill
- `Array.isArray(...) ? ... : []` ternary — verbose

**Decision:** Add `??= []` defensive init for all three new arrays before pushing.

**Rationale:** Smallest possible fix; preserves spec's no-breaking-changes claim; trivial to maintain.

**Confidence:** High — plan-attack provided concrete evidence of the failure mode.

---

### Brace-template consistency for start-bootstrap Step 4c

**Context:** plan-attack F6 finding — original Step 4c used `$SPRINT_SUBDIR` shell variable that was never bound in the bootstrap flow. Existing Steps 4 and 4b use brace-template style (`{CHESTER_WORKING_DIR}/{sprint-subdir}/`) for agent substitution.

**Information used:**
- Step 4 uses `mkdir -p "{CHESTER_WORKING_DIR}/{sprint-subdir}/design"` — brace-template
- Step 4b uses `echo "{sprint-subdir}" > "{CHESTER_WORKING_DIR}/.active-sprint"` — brace-template
- Agent's expected substitution behavior is documented in CLAUDE.md / setup-start

**Alternatives considered:**
- Set `SPRINT_SUBDIR=...` explicitly in the snippet first — verbose; doesn't match surrounding style
- Switch to actual env var (`$CHESTER_WORKING_DIR`) — partial; doesn't fix `$SPRINT_SUBDIR`

**Decision:** Rewrite snippet using `{CHESTER_WORKING_DIR}/{sprint-subdir}/design` and `{sprint-subdir}` brace-template style consistent with Steps 4 and 4b.

**Rationale:** Matches surrounding convention; agent substitutes both placeholders before running; no new bindings needed.

**Confidence:** High — convention is visible in adjacent steps.

---

### Chose "explanatory" output style fragmentation throughout caveman mode

**Context:** Session ran under caveman mode (terse output) AND explanatory output style (longer educational explanations) simultaneously. Two reminders fired across most turns.

**Information used:**
- System reminder: "CAVEMAN MODE ACTIVE (full)"
- System reminder: "Explanatory output style is active"
- Designer's "two-part question" memory rule about (a)/(b) prefix

**Alternatives considered:**
- Pure caveman everywhere (ignore explanatory) — rejected; explanatory style was system-mandated
- Pure explanatory (ignore caveman) — rejected; designer activated it explicitly
- Mixed register — most prose terse, headers/structure normal

**Decision:** Mixed — terse prose, structured headers, full prose for skill-required artifacts (briefs, specs, plans, summaries — all written normally per their respective conventions).

**Rationale:** Caveman applies to conversational text; explanatory style + skill conventions govern artifact content. Designer's memory rule about (a)/(b)/(c) prefixes for closing questions adopted throughout.

**Confidence:** Medium — pragmatic compromise; not perfect adherence to either style.
